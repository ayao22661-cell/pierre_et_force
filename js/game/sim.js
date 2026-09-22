// ============================================================
// SIM — simulation de combat temps réel, indépendante du rendu.
// Reprend les vraies statistiques des champions (CHAMPS) pour un
// combat crédible : mouvement, attaque de base (mêlée / à distance
// via projectile), IA simple d'engagement, vagues de sbires,
// tours et autel pour le mode Siège.
//
// Portée assumée pour cette passe : pas encore le système complet
// de sorts Q/W/E/R avec cooldowns (c'est la couche suivante à
// brancher — voir CHAMPS[key].abil qui contient déjà toutes les
// données nécessaires). Ici : attaque de base + déplacement + mort.
// ============================================================
import { CHAMPS } from '../data/champions.js';
import { tryCastAbility } from './abilities.js';
import { computeBonuses } from './bonuses.js';

let UID = 1;

/**
 * Découplage PV/dégâts pour les ennemis renforcés (foeMult élevé en fin
 * de campagne) : leurs PV montent pleinement avec `mult` (c'est ce qui
 * les rend réellement plus durs à tuer), mais leurs DÉGÂTS montent
 * beaucoup plus lentement (racine adoucie). Sans ça, un ennemi 3× plus
 * costaud inflige aussi 3× plus de dégâts par coup, et la fin de
 * campagne devient mortelle pour le joueur (qui, lui, ne monte jamais
 * en puissance) au lieu de simplement durer plus longtemps.
 */
function dampenedAtkMult(mult){ return Math.pow(Math.max(mult, 0.01), 0.45); }

/**
 * Rééquilibrage du rythme de combat (validé avec Yao) : les duels se
 * terminaient en 15-20 s aux coups de base (ultimes non compris), bien
 * en dessous de la cible de 2 min+ par affrontement. Les PV de TOUS les
 * champions (joueur, alliés, ennemis, boss) sont multipliés uniformément
 * — les dégâts de base ne changent pas, seule la durée pour vider une
 * barre de vie augmente. Le pendant côté sorts/ultimes (réduction de
 * dégâts + rallongement des CD) est dans abilities.js.
 */
const CHAMP_HP_MULT = 2.2;

// Vitesse relative des champions ennemis par rapport à leur valeur de base.
const FOE_SPEED = 0.85;
// Rayon dans lequel un ennemi remarque le joueur (avant : 480 pour tout le monde).
const FOE_AGGRO = 420;

export function makeChampionUnit(key, team, opts = {}){
  const d = CHAMPS[key];
  const mult = opts.mult ?? 1;

  // Bonus objets + talents — uniquement pour le joueur et ses alliés (team 0).
  // Les ennemis utilisent leurs stats de base multipliées par foeMult.
  const bns = (team === 0 && opts.save) ? computeBonuses(opts.save) : null;

  const atkMult = opts.atkMult ?? mult;
  // Les champions ennemis courent ~15 % moins vite que le joueur : on peut leur échapper.
  const foeSpeed = team === 1 ? FOE_SPEED : 1;

  const baseHp  = d.hp  * CHAMP_HP_MULT * mult * (bns ? 1 + bns.hpP   : 1) + (bns ? bns.hp   : 0);
  const baseAtk = d.atk * atkMult * (bns ? 1 + bns.atkP  : 1) + (bns ? bns.atk  : 0);
  const baseMs  = d.ms * foeSpeed + (bns ? bns.ms + bns.msF : 0);
  const baseAs  = d.as  + (bns ? bns.as  : 0);
  const baseArm = d.arm + (bns ? bns.arm + bns.armF : 0);
  const baseMana = (d.mana || 0) * (bns ? 1 + bns.manaP : 1) + (bns ? bns.mana : 0);

  return {
    id: UID++, kind: 'champ', key, team, d,
    name: d.name,
    x: opts.x ?? 0, y: opts.y ?? 0, r: d.body === 2 ? 30 : 25,
    hp: baseHp, maxHp: baseHp,
    mana: baseMana, maxMana: baseMana,
    atk: baseAtk, arm: baseArm,
    as: baseAs, ms: baseMs, baseMs,
    range: d.range,
    ranged: !!d.ranged, fx: d.fx, proj: d.proj || d.fx,
    role: d.role,
    isPlayer: !!opts.isPlayer, isAlly: !!opts.isAlly,
    atkCd: 0, dead: false, target: null, goal: opts.goal || null,
    path: opts.path || null, wp: opts.wp ?? 0,
    cds: [0,0,0,0], shield: 0, tempArm: 0, tempArmUntil: 0,
    cc: null, facing: { x: 1, y: 0 }, temporary: false, expiresAt: 0,
    home: { x: opts.x ?? 0, y: opts.y ?? 0 },
    // Stats dérivées des bonus — gardées sur l'unité pour y accéder en combat
    bns: bns || {},
    // Revive : reset à true en début de match, consommé une seule fois
    reviveReady: bns?.revive || false,
    // Niveaux de sorts (0-4) lus depuis save.spellLevels[champKey] pour le joueur/alliés
    _spellLevels: (team === 0 && opts.save?.spellLevels?.[key]) ? opts.save.spellLevels[key] : null,
  };
}

export function makeMinion(team, path, wp){
  return {
    id: UID++, kind: 'minion', team,
    x: 0, y: 0, r: 15,
    hp: 320, maxHp: 320, atk: 22, arm: 8, as: 0.9, ms: 220 * (0.95 + Math.random() * 0.1), range: 46,
    slot: 0, // décalage latéral dans la formation (px)
    ranged: false, fx: team === 0 ? '#5aa9ff' : '#ff6a5a',
    atkCd: 0, dead: false, target: null, path, wp,
  };
}

export function makeStructure(kind, team, x, y, hp){
  return {
    id: UID++, kind, team, x, y, r: kind === 'autel' ? 55 : 38,
    hp, maxHp: hp, atk: kind === 'tower' ? 140 : 0, arm: 30, as: 1, ms: 0,
    range: kind === 'tower' ? 340 : 0, ranged: true,
    fx: team === 0 ? '#5aa9ff' : '#ff6a5a',
    atkCd: 0, dead: false, target: null,
  };
}

export class Sim{
  /**
   * @param {object} cfg - { mode, champ, allies, foes, path, foeCount, onEvent }
   */
  constructor(cfg){
    this.cfg = cfg;
    this.mode = cfg.mode;
    this.time = 0;
    this.over = false;
    this.victory = false;
    this.units = [];
    this.onEvent = cfg.onEvent || (() => {});
    this._build();
  }

  _build(){
    const path = this.cfg.path;
    if(this.mode === 'siege' && path){
      this._buildSiege(path);
    } else if(this.mode === 'defense' && path){
      this._buildDefense(path);
    } else if(this.mode === 'boss'){
      this._buildBoss();
    } else {
      this._buildArena();
    }
  }

  _buildSiege(path){
    const p0 = path[0], p1 = path[path.length-1];
    this.player = makeChampionUnit(this.cfg.champ, 0, { isPlayer: true, x: p0.x, y: p0.y - 40, path, wp: 1, save: this.cfg.save });
    this.units.push(this.player);
    (this.cfg.allies || []).forEach((k, i) => {
      const u = makeChampionUnit(k, 0, { isAlly: true, x: p0.x, y: p0.y + 40 + i*40, path, wp: 1, save: this.cfg.save });
      this.units.push(u);
    });
    const foes = this.cfg.foes || ['BABA'];
    for(let i = 0; i < (this.cfg.foeCount || 1); i++){
      const k = foes[i % foes.length];
      const fm = this.cfg.foeMult || 1;
      const u = makeChampionUnit(k, 1, { x: p1.x, y: p1.y + (i-1)*44, mult: fm, atkMult: dampenedAtkMult(fm), path, wp: path.length-2 });
      this.units.push(u);
    }
    this.autelAllie = makeStructure('autel', 0, p0.x - 60, p0.y, 3500);
    this.autelEnnemi = makeStructure('autel', 1, p1.x + 60, p1.y, 3500 * (this.cfg.foeMult || 1));
    this.units.push(this.autelAllie, this.autelEnnemi);
    this.path = path;
    this.waveTimer = 6; this.waveN = 0;
    this.teamKills = [0, 0]; // suivi des éliminations de champions, tous modes confondus
  }

  /**
   * Défense — le joueur protège son autel allié à gauche pendant N vagues.
   * Les ennemis arrivent par la droite et convergent sur l'autel.
   * Victoire : survivre à toutes les vagues. Défaite : autel détruit.
   */
  _buildDefense(path){
    const p0 = path[0], p1 = path[path.length-1];
    // Le joueur commence côté allié (gauche)
    this.player = makeChampionUnit(this.cfg.champ, 0, { isPlayer: true, x: p0.x + 80, y: p0.y, path, wp: 1, save: this.cfg.save });
    this.units.push(this.player);
    (this.cfg.allies || []).forEach((k, i) => {
      const u = makeChampionUnit(k, 0, { isAlly: true, x: p0.x + 80, y: p0.y + 60 + i*50, path, wp: 1, save: this.cfg.save });
      this.units.push(u);
    });
    // Autel allié à défendre, pas de autel ennemi
    this.autelAllie = makeStructure('autel', 0, p0.x - 60, p0.y, 4500);
    this.units.push(this.autelAllie);
    this.path = path;
    // Nombre de vagues à survivre (foeMult conditionne leur force)
    this.defenseWaveTotal = this.cfg.waveTotal || 5;
    this.defenseWaveN = 0;
    this.waveTimer = 3; // première vague dans 3 s
    this._defenseSpawnSide = p1; // les ennemis arrivent depuis p1
    this.defenseOver = false;
    this.teamKills = [0, 0]; // suivi des éliminations de champions, tous modes confondus
    // Champion ennemi spawné une seule fois au départ, il ne respawne pas.
    // Toujours exactement 1 champion pour toute la mission, quel que soit
    // cfg.foeCount (1 à 3, pensé pour un duel Siège/Arène) : en Défense ce
    // champion reste seul en jeu sur la durée entière des 5 vagues, pas
    // juste le temps d'un duel — 2 ou 3 champions plein foeMult en plus des
    // vagues de sbires serait ingérable sur la durée. mission.ennemis[0]
    // (le premier ennemi listé) est utilisé comme unique adversaire.
    const foes = this.cfg.foes || ['BABA'];
    const fm = this.cfg.foeMult || 1;
    const atkM = dampenedAtkMult(fm);
    const champ = makeChampionUnit(foes[0], 1, { x: p1.x, y: p1.y - 50, mult: fm, atkMult: atkM, path, wp: path.length - 2 });
    champ.respawnDisabled = true;
    this.units.push(champ);
  }

  /**
   * Boss — arène mais avec un seul champion ennemi très puissant (mult élevé)
   * qui ne respawn pas. Il a aussi des PV affichés séparément.
   * Victoire : tuer le boss. Défaite : joueur mort ou temps écoulé.
   */
  _buildBoss(){
    const cx = this.cfg.w/2 || 1100, cy = this.cfg.h/2 || 750;
    this.player = makeChampionUnit(this.cfg.champ, 0, { isPlayer: true, x: cx - 480, y: cy, save: this.cfg.save });
    this.units.push(this.player);
    (this.cfg.allies || []).forEach((k, i) => {
      this.units.push(makeChampionUnit(k, 0, { isAlly: true, x: cx - 480, y: cy + 60 + i*50, save: this.cfg.save }));
    });
    // Boss — multiplicateur fort, ne respawn pas
    // Beaucoup de PV (×3,5) mais des dégâts à peine supérieurs à un ennemi normal (×1,3) :
    // avant, le boss avait ×2,5 sur les deux et tuait le joueur en quelques secondes.
    const fm = this.cfg.foeMult || 0.5;
    // Courbe propre au boss (indépendante de la formule de fm ci-dessus,
    // recalée pour la plage de fm ci-dessus, 1,3-5,0) : PV 1,4x à 6,3x la
    // base au fil de la campagne, dégâts 0,9x à 2x seulement — un boss doit
    // durer longtemps, pas foudroyer le joueur en trois coups.
    const bossHpMult  = 1.4 + (fm - 0.6) * 1.336;
    const bossAtkMult = 0.9 + (fm - 0.6) * 0.267;
    const bossKey = (this.cfg.foes && this.cfg.foes[0]) || 'BABA';
    this.boss = makeChampionUnit(bossKey, 1, { x: cx + 480, y: cy, mult: bossHpMult, atkMult: bossAtkMult });
    this.boss.isBoss = true;
    this.boss.respawnDisabled = true;
    this.units.push(this.boss);
    this.teamKills = [0, 0];
    // 4 min ne suffisent plus depuis le rééquilibrage (PV du boss ×2,2
    // en plus de bossHpMult ci-dessus) : remonté à 6 min pour laisser le
    // temps de vider la barre sans que le combat time out injustement.
    this.timeLimit = this.cfg.timeLimit || 360; // boss : 6 min max
    this.onEvent({ type: 'boss-spawn', boss: this.boss });
  }

  _buildArena(){
    // Arena — cercle simple, pas de lane.
    const cx = this.cfg.w/2 || 1100, cy = this.cfg.h/2 || 750;
    this.player = makeChampionUnit(this.cfg.champ, 0, { isPlayer: true, x: cx - 500, y: cy, save: this.cfg.save });
    this.units.push(this.player);
    (this.cfg.allies || []).forEach((k, i) => {
      this.units.push(makeChampionUnit(k, 0, { isAlly: true, x: cx - 500, y: cy + 60 + i*50, save: this.cfg.save }));
    });
    const foes = this.cfg.foes || ['BABA'];
    const fmArena = this.cfg.foeMult || 1;
    for(let i = 0; i < (this.cfg.foeCount || 2); i++){
      const k = foes[i % foes.length];
      this.units.push(makeChampionUnit(k, 1, { x: cx + 500, y: cy + (i-1)*50, mult: fmArena, atkMult: dampenedAtkMult(fmArena) }));
    }
    this.teamKills = [0, 0];
    this.killGoal = this.cfg.killGoal || 8;
    this.timeLimit = this.cfg.timeLimit || 300;
  }

  setPlayerInput(dx, dy){ this.playerInput = { dx, dy }; }

  /**
   * Coup de base du joueur, déclenché à la main (bouton ou touche).
   * Les unités frappent déjà automatiquement quand une cible entre à
   * portée ; ici le joueur choisit son moment, et frappe même dans le
   * vide si personne n'est à portée — sans ça, on ne « sent » pas le
   * personnage taper.
   */
  requestBasicAttack(){ this._basicQueued = true; }

  _tickPlayerBasic(){
    if(!this._basicQueued) return;
    this._basicQueued = false;
    const p = this.player;
    if(!p || p.dead) return;
    if(p.cc && p.cc.type === 'stun' && this.time < p.cc.until) return;
    if(p.atkCd > 0) return;
    const t = this._nearestFoe(p, p.range);
    if(t){
      p.target = t;
      p.atkCd = 1 / (p.as || 0.7);
      // Oriente le personnage vers sa cible avant de frapper.
      const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy) || 1;
      p.facing = { x: dx/d, y: dy/d };
      this._resolveAttack(p, t, true);
    } else {
      // Coup dans le vide : petit temps de recharge et animation quand même.
      p.atkCd = 0.45 / (p.as || 0.7);
      this.onEvent({ type: 'swing', from: p });
    }
  }

  update(dt){
    if(this.over) return;
    this.time += dt;

    this._movePlayer(dt);
    this._tickPlayerBasic();
    for(const u of this.units){
      if(u.dead || u === this.player) continue;
      this._think(u, dt);
    }
    for(const u of this.units) if(!u.dead) this._tickAttack(u, dt);
    for(const u of this.units) if(!u.dead && u.kind === 'champ') this._tickResources(u, dt);
    // IA de sorts — alliés (hors joueur) et ennemis choisissent et lancent
    // leurs propres capacités (soin, bouclier, contrôle, dégâts). Avant
    // cet ajout, seul le joueur lançait jamais un sort : chaque champion,
    // le sien compris pour ses alliés, ne servait qu'à l'attaque de base.
    for(const u of this.units) if(!u.dead && u.kind === 'champ' && !u.isPlayer) this._aiTick(u, dt);
    this._processCastQueue();

    if(this.mode === 'siege') this._tickSiege(dt);
    else if(this.mode === 'defense') this._tickDefense(dt);
    else if(this.mode === 'boss') this._tickBoss(dt);
    else this._tickArena(dt);
    // Après TOUS les déplacements (les sbires avancent dans le tick du mode).
    this._separate(dt);

    // Nettoyage des unités temporaires (invocations expirées).
    for(const u of this.units){
      if(u.temporary && !u.dead && this.time >= u.expiresAt){
        u.dead = true;
        this.onEvent({ type: 'death', unit: u, silent: true });
      }
    }
  }

  _tickResources(u, dt){
    for(let i = 0; i < u.cds.length; i++) if(u.cds[i] > 0) u.cds[i] = Math.max(0, u.cds[i] - dt);
    if(u.maxMana) u.mana = Math.min(u.maxMana, u.mana + u.maxMana * 0.03 * dt);
    // Régénération de PV : un socle de base (1,5 %/s des PV max, pour
    // TOUS les champions — joueur, alliés ET ennemis, à égalité) + objet
    // (regen fixe/s) + talent Eau (regenF PV/s). Avant ce socle, un
    // champion sans objet ni talent n'avait AUCUNE régénération : une
    // mission sans allié (certaines Arènes/Défenses en ont aucun) était
    // une pure usure sans la moindre récupération entre deux affrontements,
    // ce qui rendait les missions à enchaînements — 8 éliminations d'affilée,
    // 5 vagues de suite — bien plus punitives qu'un duel unique.
    const baseRegen = (u.maxHp || 0) * 0.015;
    const totalRegen = baseRegen + (u.bns?.regen || 0) + (u.bns?.regenF || 0);
    if(totalRegen > 0) u.hp = Math.min(u.maxHp, u.hp + totalRegen * dt);
  }

  /**
   * IA de sorts pour toute unité "champ" qui n'est pas le joueur (alliés
   * ET ennemis partagent la même logique — un ennemi n'est qu'un
   * "champ" côté équipe 1). Décision simple, réévaluée toutes les
   * ~0,35-0,6 s par unité (décalées aléatoirement pour ne pas voir tout
   * le monde lancer un sort à la même frame) :
   *   1) Soutien (soin / bouclier) si soi-même ou l'allié le plus blessé
   *      à portée est sous le seuil — priorité absolue, même hors combat
   *      (un soin en retard ne sert à rien).
   *   2) Sinon, si un ennemi est à portée d'engagement, lance la première
   *      capacité offensive disponible (ultime en priorité).
   * Le ciblage lui-même (plus proche ennemi, allié le plus blessé...)
   * est déjà géré par les EXECUTORS de abilities.js — l'IA choisit
   * seulement QUAND et QUELLE capacité, pas QUI viser.
   */
  _aiTick(u, dt){
    if(!u.d || !u.d.abil || !u.d.abil.length) return;
    u.aiNext = (u.aiNext || 0) - dt;
    if(u.aiNext > 0) return;
    u.aiNext = 0.35 + Math.random() * 0.25;

    if(u.cc && u.cc.type === 'stun' && this.time < u.cc.until) return;

    const abil = u.d.abil;
    const isSupport = a => a.type === 'ally' || (a.type === 'self' && a.shield) || (a.type === 'nova' && a.team === 'ally');

    // 1) Soutien prioritaire.
    for(let slot = 0; slot < abil.length; slot++){
      const a = abil[slot];
      if(!a || !isSupport(a) || u.cds[slot] > 0 || (u.mana||0) < (a.cost||0)) continue;
      const target = a.type === 'self' ? u : this._nearestWoundedAlly(u, a.range || 500);
      const pct = target.hp / (target.maxHp || 1);
      if(pct < (a.type === 'self' ? 0.55 : 0.65)){ this.requestCast(u, slot); return; }
    }

    // 2) Offensif — seulement si un ennemi est à portée d'engagement,
    //    pour ne pas gaspiller un sort dans le vide.
    const engageRange = Math.max((u.range || 100) + 260, 420);
    if(!this._nearestFoe(u, engageRange)) return;
    const order = [3, 0, 1, 2]; // ultime d'abord, puis A/Z/E dans l'ordre
    for(const slot of order){
      const a = abil[slot];
      if(!a || isSupport(a) || u.cds[slot] > 0 || (u.mana||0) < (a.cost||0)) continue;
      this.requestCast(u, slot);
      return;
    }
  }

  /** Demande de lancer un sort — traitée au prochain tick (voir _processCastQueue). */
  requestCast(unit, slot){
    this._castQueue = this._castQueue || [];
    this._castQueue.push({ unit, slot });
  }

  _processCastQueue(){
    if(!this._castQueue || !this._castQueue.length) return;
    const q = this._castQueue; this._castQueue = [];
    for(const { unit, slot } of q) tryCastAbility(this, unit, slot);
  }

  _movePlayer(dt){
    const p = this.player;
    if(p.dead) return;
    if(p.cc && p.cc.type !== 'slow' && this.time < p.cc.until) return; // étourdi/enraciné : ne bouge pas
    const inp = this.playerInput;
    if(inp && (inp.dx || inp.dy)){
      const len = Math.hypot(inp.dx, inp.dy) || 1;
      const slowMul = (p.cc && p.cc.type === 'slow' && this.time < p.cc.until) ? (1 - p.cc.p) : 1;
      p.x += (inp.dx/len) * p.ms * slowMul * dt;
      p.y += (inp.dy/len) * p.ms * slowMul * dt;
      p.facing = { x: inp.dx/len, y: inp.dy/len };
    }
  }

  _think(u, dt){
    if(u.cc && u.cc.type !== 'slow' && this.time < u.cc.until) return; // étourdi/enraciné
    // Les sbires sont pilotés par _minionMove (sinon ils avançaient deux fois par frame).
    if(u.kind === 'minion') return;
    // Cible la plus proche adverse dans une zone d'agro.
    const aggro = (u.team === 1 && !u.isBoss) ? FOE_AGGRO : 480;
    const foe = this._nearestFoe(u, aggro);
    if(foe){
      const d = Math.hypot(foe.x-u.x, foe.y-u.y);
      if(d > u.range * 0.85){
        this._moveToward(u, foe.x, foe.y, dt);
      }
      u.target = foe;
    } else if(u.path){
      const wp = u.path[u.wp];
      if(wp){
        const d = Math.hypot(wp.x-u.x, wp.y-u.y);
        if(d < 40) u.wp += (u.team === 0 ? 1 : -1);
        else this._moveToward(u, wp.x, wp.y, dt);
      }
      u.target = null;
    } else if(u.kind === 'champ'){
      if(u.team === 0 || u.isBoss){
        // Alliés (et boss) sans cible : rejoignent le joueur.
        const anchor = this.player;
        const d = Math.hypot(anchor.x-u.x, anchor.y-u.y);
        if(d > 140) this._moveToward(u, anchor.x, anchor.y, dt);
      } else {
        // Ennemis normaux sans cible : retournent à leur poste au lieu de traquer
        // le joueur à travers toute la carte.
        const h = u.home;
        if(h && Math.hypot(h.x-u.x, h.y-u.y) > 40) this._moveToward(u, h.x, h.y, dt);
      }
      u.target = null;
    }
  }

  /**
   * Écartement doux entre unités : sans lui, tous ceux qui visaient la
   * même cible finissaient empilés sur un seul point (un amas de modèles
   * 3D les uns dans les autres). Chaque paire trop proche est repoussée
   * de part et d'autre ; le joueur bouge moins que les autres pour ne
   * pas se faire « bousculer » hors de sa trajectoire. Les structures
   * (Autel, tours) ne bougent pas mais repoussent ceux qui entrent dedans.
   */
  _separate(dt){
    const mob = this.units.filter(u => !u.dead && u.ms > 0);
    const rad = (u) => u.kind === 'minion' ? 22 : 26;
    // Deux passes de correction complète : en mêlée, ceux qui poussent vers
    // la même cible compriment le groupe à chaque frame ; une correction
    // partielle ne suffisait pas à les tenir écartés.
    const k = 0.5;
    for(let pass = 0; pass < 2; pass++)
    for(let i = 0; i < mob.length; i++){
      const a = mob[i];
      for(let j = i + 1; j < mob.length; j++){
        const b = mob[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        // Entre ennemis, on laisse le contact (sinon l'écartement les
        // repoussait hors de portée de mêlée et ils ne se battaient plus) :
        // l'espacement complet ne vaut qu'entre membres d'une même équipe.
        const min = (rad(a) + rad(b)) * (a.team === b.team ? 1 : 0.6);
        const d2 = dx*dx + dy*dy;
        if(d2 >= min*min) continue;
        let d = Math.sqrt(d2);
        if(d < 0.01){ // exactement superposés : direction pseudo-aléatoire stable
          const ang = ((a.id * 928371 + b.id * 1237) % 628) / 100;
          dx = Math.cos(ang); dy = Math.sin(ang); d = 1;
        }
        const push = (min - d) * k;
        const nx = dx / d, ny = dy / d;
        const wa = a.isPlayer ? 0.2 : b.isPlayer ? 0.8 : 0.5;
        a.x -= nx * push * wa;       a.y -= ny * push * wa;
        b.x += nx * push * (1 - wa); b.y += ny * push * (1 - wa);
      }
    }
    for(const s of this.units){
      if(s.dead || s.ms > 0 || !s.r) continue;
      for(const u of mob){
        const dx = u.x - s.x, dy = u.y - s.y, min = s.r + rad(u) * 0.6;
        const d = Math.hypot(dx, dy);
        if(d >= min || d < 0.01) continue;
        const push = (min - d) * k;
        u.x += dx / d * push; u.y += dy / d * push;
      }
    }
  }

  _moveToward(u, tx, ty, dt){
    const dx = tx-u.x, dy = ty-u.y, d = Math.hypot(dx,dy) || 1;
    const slowMul = (u.cc && u.cc.type === 'slow' && this.time < u.cc.until) ? (1 - u.cc.p) : 1;
    u.x += (dx/d) * u.ms * slowMul * dt;
    u.y += (dy/d) * u.ms * slowMul * dt;
    u.facing = { x: dx/d, y: dy/d };
  }

  _nearestFoe(u, radius){
    let best = null, bd = radius;
    for(const o of this.units){
      if(o.dead || o.team === u.team || o.team === undefined) continue;
      // L'autel est une cible de combat valide en Siège (autel ennemi à
      // détruire) ET en Défense (autel allié à protéger) — seuls Arène et
      // Boss n'ont pas d'autel en jeu. Avant ce correctif, l'exclusion ne
      // couvrait que "hors Siège", ce qui rendait l'autel allié totalement
      // inciblable en Défense : les vagues ne pouvaient jamais l'attaquer et
      // reportaient 100% de leur agressivité sur le joueur/alliés, sans
      // aucun partage de dégâts — d'où des missions Défense écrasantes.
      if(o.kind === 'autel' && this.mode !== 'siege' && this.mode !== 'defense') continue;
      const d = Math.hypot(o.x-u.x, o.y-u.y);
      if(d < bd){ bd = d; best = o; }
    }
    return best;
  }

  /** Allié le plus blessé (en % PV) à portée — ou soi-même si personne d'autre n'est éligible. */
  _nearestWoundedAlly(u, radius){
    let best = u, bestPct = u.hp / u.maxHp;
    for(const o of this.units){
      if(o === u || o.dead || o.team !== u.team || o.kind !== 'champ') continue;
      const d = Math.hypot(o.x-u.x, o.y-u.y);
      if(d > radius) continue;
      const pct = o.hp / o.maxHp;
      if(pct < bestPct){ bestPct = pct; best = o; }
    }
    return best;
  }

  _tickAttack(u, dt){
    u.atkCd -= dt;
    if(u.cc && u.cc.type === 'stun' && this.time < u.cc.until) return; // étourdi : n'attaque pas
    if(!u.target || u.target.dead){
      u.target = this._nearestFoe(u, u.range + 40);
    }
    const t = u.target;
    if(!t) return;
    const d = Math.hypot(t.x-u.x, t.y-u.y);
    if(d <= u.range && u.atkCd <= 0){
      u.atkCd = 1 / (u.as || 0.7);
      this._resolveAttack(u, t);
    }
  }

  _resolveAttack(u, t, manual = false){
    // Critique (crit chance) — double les dégâts de base. La réduction
    // d'armure est appliquée uniformément dans _applyDamage (voir plus
    // bas) — pour l'attaque de base comme pour les sorts.
    const critChance = (u.bns?.crit || 0);
    const isCrit = critChance > 0 && Math.random() < critChance;
    let dmg = u.atk || 10;
    if(isCrit) dmg *= 2;

    // Passif SAM — "Le Seuil" : +40% dégâts sur l'attaque de base
    // suivant un sort (proc une fois, délai interne 1 s entre procs).
    if(u.key === 'SAM' && u._seuilReady){
      dmg *= 1.4;
      u._seuilReady = false;
      this.onEvent({ type: 'fx-self', unit: u, color: '#16c8bd' });
    }

    if(u.ranged){
      this.onEvent({ type: 'projectile', from: u, to: t, color: u.proj || u.fx, manual });
      setTimeout(() => this._applyDamage(u, t, dmg, { basic: true, crit: isCrit }), 140);
    } else {
      this.onEvent({ type: 'melee', from: u, to: t, manual, crit: isCrit });
      this._applyDamage(u, t, dmg, { basic: true, crit: isCrit });
    }
  }

  _applyDamage(u, t, rawDmg, opts = {}){
    if(t.dead) return;

    // Exec : bonus dégâts sur cibles sous 40% PV
    let dmg = rawDmg;
    if(u.bns?.exec && (t.hp / (t.maxHp||1)) < 0.4){
      dmg *= (1 + u.bns.exec);
    }

    // Réduction par l'armure — s'applique à TOUTE source de dégâts,
    // attaque de base ET sorts. Avant ce correctif, seule l'attaque de
    // base la subissait (elle était calculée dans _resolveAttack) : les
    // sorts ignoraient entièrement l'armure de la cible. Sans effet
    // visible tant que l'IA de sorts n'existait pas (seul le joueur
    // lançait un sort), mais une fois les ennemis capables de lancer les
    // leurs, leurs sorts frappaient à dégâts pleins quelle que soit
    // l'armure du joueur — d'où des pertes de PV bien plus rapides que
    // prévu par l'équilibrage.
    {
      const effArm = (t.arm||0) + ((t.tempArm && this.time < t.tempArmUntil) ? t.tempArm : 0);
      const pen = u?.bns?.pen || 0;
      const reducedArm = Math.max(0, effArm * (1 - pen));
      dmg *= 100 / (100 + reducedArm);
      if(opts.basic) dmg = Math.max(2, dmg);
    }

    // Réduction de contrôle (ccRes s'applique dans _applyCC, pas ici)
    if(t.shield > 0){
      const absorbed = Math.min(t.shield, dmg);
      t.shield -= absorbed; dmg -= absorbed;
    }
    if(dmg <= 0){ this.onEvent({ type: 'hit', unit: t, dmg: 0, color: u.fx, blocked: true }); return; }

    // Thorns — renvoie un % des dégâts de base reçus à l'attaquant
    if(t.bns?.thorns && u && !u.dead && opts.basic){
      const thornDmg = dmg * t.bns.thorns;
      u.hp = Math.max(1, u.hp - thornDmg);
      this.onEvent({ type: 'hit', unit: u, dmg: thornDmg, color: '#fff' });
    }

    t.hp -= dmg;
    // crit/heavy : purement décoratifs (texte de dégâts plus gros,
    // impact plus large, léger tremblement caméra sur un ultime) — voir
    // match.js. « heavy » marque les dégâts venant d'un ultime.
    this.onEvent({ type: 'hit', unit: t, dmg, color: u.fx, crit: !!opts.crit, heavy: !!opts.heavy, from: u });

    // Vol de vie (ls) — seulement pour les attaques de base
    if(u.bns?.ls && opts.basic && u.team === 0){
      const lifesteal = dmg * u.bns.ls;
      u.hp = Math.min(u.maxHp, u.hp + lifesteal);
      if(lifesteal > 0) this.onEvent({ type: 'heal', unit: u, amount: lifesteal });
    }

    // Passif DARK — "Faim de l'Abîme" : attaques de base +6% PV, sorts +3%.
    // S'applique à DARK quel que soit son équipe (joueur ou ennemi).
    if(u.key === 'DARK' && !t.isSummon){
      const rate = opts.basic ? 0.06 : (opts.isAbility ? 0.03 : 0);
      if(rate > 0){
        const drain = dmg * rate;
        u.hp = Math.min(u.maxHp, u.hp + drain);
        if(drain > 0.5) this.onEvent({ type: 'heal', unit: u, amount: drain });
      }
    }

    if(t.hp <= 0 && !t.dead){
      // Revive — survie à 1 PV une fois par combat
      if(t.reviveReady && t.team === 0){
        t.reviveReady = false;
        t.hp = t.maxHp * 0.3;
        this.onEvent({ type: 'announce', text: 'DEUXIÈME VIE !' });
        return;
      }
      t.dead = true;
      this.onEvent({ type: 'death', unit: t, killer: u });
      if(t.kind === 'autel') this._endMatch(u.team === 0);
      // Élimination d'un champion — comptabilisée dans tous les modes (pas
      // seulement en Arène), pour que la récompense de fin de match reflète
      // les vraies éliminations en Siège/Défense/Boss aussi.
      if(t.kind === 'champ' && this.teamKills){
        this.teamKills[u.team]++;
        this.onEvent({ type: 'score', teamKills: this.teamKills.slice() });
      }
      // cdKill — élimination : réduit les CDs du tueur
      if(t.kind === 'champ' && u?.bns?.cdKill > 0){
        u.cds = u.cds.map(cd => cd * (1 - u.bns.cdKill));
      }
      // Passif BABA — "Show de la Cour" : élimination → −25% CDs + +15% vitesse 2 s.
      // Fonctionne que BABA soit joueur ou ennemi.
      if(t.kind === 'champ' && u?.key === 'BABA'){
        u.cds = u.cds.map(cd => cd * 0.75);
        const baseMs = u.baseMs || u.ms;
        u.ms = baseMs * 1.15;
        setTimeout(() => { if(!u.dead) u.ms = u.baseMs || baseMs; }, 2000);
        this.onEvent({ type: 'fx-self', unit: u, color: '#D85A30' });
      }
      // Plus AUCUN respawn, pour aucune unité, dans aucun mode — sur
      // demande explicite : un ennemi tué reste mort, point final.
      // Corrigé : le mode ARÈNE ne visait avant que killGoal victoires
      // (8 par défaut) alors qu'il ne pose que foeCount (1 à 3) champions
      // ennemis au départ — mission impossible sans respawn. killGoal est
      // désormais égal à foeCount (voir deploy.js) : l'Arène est un duel
      // court plutôt qu'un gantelet à 8 kills. Choix validé avec Yao.
    }
  }

  // _respawn(t) supprimée : plus jamais appelée depuis que le respawn a
  // été retiré du gestionnaire de mort des champions (voir plus haut).
  // Code mort retiré pour éviter toute confusion future.

  _tickSiege(dt){
    // Mort du héros = défaite immédiate, comme en mode Boss — sans
    // respawn, un héros mort ne peut plus rien faire gagner tout seul.
    if(this.player.dead) { this._endMatch(false); return; }
    this.waveTimer -= dt;
    if(this.waveTimer <= 0){
      this.waveTimer = 22; this.waveN++;
      this._spawnWave();
    }
    this.units.forEach(u => { if(u.kind === 'minion' && !u.dead) this._minionMove(u, dt); });
  }

  _spawnWave(){
    const path = this.path;
    for(let i = 0; i < 3; i++){
      // Formation en éventail : un couloir par sbire (gauche / centre /
      // droite) et un léger décalage en profondeur, au lieu d'une file
      // collée qui visait exactement le même point.
      const m0 = makeMinion(0, path, 1);
      m0.slot = (i-1) * 48;
      m0.x = path[0].x - (i === 1 ? 30 : 0); m0.y = path[0].y + (i-1)*48;
      const m1 = makeMinion(1, path, path.length-2);
      m1.slot = (i-1) * 48;
      m1.x = path[path.length-1].x + (i === 1 ? 30 : 0); m1.y = path[path.length-1].y + (i-1)*48;
      this.units.push(m0, m1);
    }
  }

  _minionMove(u, dt){
    const foe = this._nearestFoe(u, 220);
    if(foe){
      u.target = foe;
      if(Math.hypot(foe.x-u.x, foe.y-u.y) > u.range * 0.85) this._moveToward(u, foe.x, foe.y, dt);
      return;
    }
    const wp = u.path[u.wp];
    if(!wp) return;
    // Point visé décalé sur le côté selon le couloir du sbire
    // (perpendiculaire au tronçon de route), pour garder la formation.
    let tx = wp.x, ty = wp.y;
    if(u.slot){
      const prev = u.path[u.wp - (u.team === 0 ? 1 : -1)] || wp;
      const sx = wp.x - prev.x, sy = wp.y - prev.y, sl = Math.hypot(sx, sy) || 1;
      tx += (-sy / sl) * u.slot; ty += (sx / sl) * u.slot;
    }
    const d = Math.hypot(tx-u.x, ty-u.y);
    if(d < 30) u.wp += (u.team === 0 ? 1 : -1);
    else this._moveToward(u, tx, ty, dt);
  }

  _tickArena(dt){
    // Mort du héros = défaite immédiate, comme en mode Boss — sans
    // respawn, un héros mort ne peut plus rien faire gagner tout seul.
    if(this.player.dead) { this._endMatch(false); return; }
    if(this.teamKills[0] >= this.killGoal) this._endMatch(true);
    else if(this.teamKills[1] >= this.killGoal) this._endMatch(false);
    else if(this.time >= this.timeLimit) this._endMatch(this.teamKills[0] >= this.teamKills[1]);
  }

  /**
   * Défense — spawn des vagues d'ennemis depuis le côté droit de la lane.
   * Victoire : avoir survécu à toutes les vagues (plus aucun ennemi vivant après la dernière).
   * Défaite : autel allié détruit.
   */
  _tickDefense(dt){
    // Mort du héros = défaite immédiate, comme en mode Boss — sans
    // respawn, un héros mort ne peut plus rien faire gagner tout seul.
    if(this.player.dead) { this._endMatch(false); return; }
    if(this.autelAllie && this.autelAllie.dead){ this._endMatch(false); return; }
    this.waveTimer -= dt;
    if(this.waveTimer <= 0 && this.defenseWaveN < this.defenseWaveTotal){
      this.defenseWaveN++;
      // Vagues de plus en plus rapprochées (20s -> 12s) : le code faisait
      // l'inverse jusqu'ici (+2s/vague), contredisant ce commentaire —
      // les défenses traînaient en longueur au lieu de monter en intensité.
      this.waveTimer = Math.max(10, 20 - this.defenseWaveN * 2);
      this._spawnDefenseWave();
      this.onEvent({ type: 'announce', text: `VAGUE ${this.defenseWaveN} / ${this.defenseWaveTotal}` });
    }
    // Déplacer les sbires ennemis en mode défense
    this.units.forEach(u => { if(u.kind === 'minion' && !u.dead && u.team === 1) this._minionMove(u, dt); });

    // Vérifier la fin : toutes les vagues lancées + plus d'ennemis vivants.
    // Avant : gardé derrière "waveTimer <= 0", qui après la dernière vague
    // ne mesure plus que le délai (jusqu'à 10-18 s) avant une 6e vague
    // fictive qui ne spawnera jamais — la victoire restait donc bloquée
    // tout ce temps même quand le terrain était déjà vide.
    if(this.defenseWaveN >= this.defenseWaveTotal){
      const aliveEnemies = this.units.filter(u => !u.dead && u.team === 1);
      if(aliveEnemies.length === 0) this._endMatch(true);
    }
  }

  _spawnDefenseWave(){
    const path = this.path;
    if(!path) return;
    const spawn = this._defenseSpawnSide || path[path.length-1];
    // Les sbires ne doivent PAS hériter de cfg.foeMult : ce multiplicateur
    // de campagne (jusqu'à ×4) est calibré pour un duel de champion en
    // tête-à-tête (voir deploy.js), pas pour une horde. Avant ce correctif,
    // il se cumulait avec la montée en puissance propre aux vagues
    // (×1 à ×1,6) ET avec le nombre croissant de sbires par vague (3 à 8) :
    // les deux axes (stat ET nombre) explosaient ensemble en fin de
    // campagne, sur des missions qui posent déjà 1-2 champions ennemis à
    // plein foeMult dès le départ. En Siège, à titre de comparaison, les
    // sbires gardent toujours leurs stats de base, sans lien avec foeMult.
    const waveMult = 1 + this.defenseWaveN * 0.12;
    const waveAtkMult = dampenedAtkMult(waveMult);
    // Sbires
    const minionCount = 2 + Math.floor(this.defenseWaveN * 1.2);
    for(let i = 0; i < minionCount; i++){
      const m = makeMinion(1, path, path.length - 2);
      m.slot = ((i % 3) - 1) * 48;
      m.x = spawn.x + (i - Math.floor(minionCount/2)) * 48;
      m.y = spawn.y + Math.floor(i / 3) * 40;
      m.hp *= waveMult; m.maxHp = m.hp; m.atk *= waveAtkMult;
      this.units.push(m);
    }

  }

  /**
   * Boss — surveille uniquement si le boss est mort (victoire) ou le joueur mort
   * + temps écoulé (défaite). Même logique de mort du héros = défaite
   * reprise dans les trois autres modes (Arène, Siège, Défense).
   */
  _tickBoss(dt){
    if(this.boss && this.boss.dead) { this._endMatch(true); return; }
    if(this.player.dead) { this._endMatch(false); return; }
    if(this.time >= this.timeLimit) this._endMatch(false);
    // Annonce à mi-temps si le boss est sous 50% PV
    if(this.boss && !this._bossHalfAnnounced && (this.boss.hp / this.boss.maxHp) < 0.5){
      this._bossHalfAnnounced = true;
      this.onEvent({ type: 'announce', text: `${this.boss.name} est affaibli !` });
    }
    // Mise à jour HUD : HP du boss
    this.onEvent({ type: 'boss-hp', boss: this.boss });
  }

  _endMatch(victory){
    if(this.over) return;
    this.over = true; this.victory = victory;
    this.onEvent({ type: 'end', victory });
  }
}
