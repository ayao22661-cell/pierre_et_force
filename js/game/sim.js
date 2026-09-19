// ============================================================
// SIM — simulation de combat temps réel, indépendante du rendu.
// Reprend les vraies statistiques des champions (CHAMPS) pour un
// combat crédible : mouvement, attaque de base (mêlée / à distance
// via projectile), IA simple d'engagement, vagues de sbires,
// tours et nexus pour le mode Siège.
//
// Portée assumée pour cette passe : pas encore le système complet
// de sorts Q/W/E/R avec cooldowns (c'est la couche suivante à
// brancher — voir CHAMPS[key].abil qui contient déjà toutes les
// données nécessaires). Ici : attaque de base + déplacement + mort.
// ============================================================
import { CHAMPS } from '../data/champions.js';
import { tryCastAbility } from './abilities.js';

let UID = 1;

export function makeChampionUnit(key, team, opts = {}){
  const d = CHAMPS[key];
  const mult = opts.mult ?? 1;
  return {
    id: UID++, kind: 'champ', key, team, d,
    name: d.name,
    x: opts.x ?? 0, y: opts.y ?? 0, r: d.body === 2 ? 30 : 25,
    hp: d.hp * mult, maxHp: d.hp * mult,
    mana: d.mana || 0, maxMana: d.mana || 0,
    atk: d.atk * mult, arm: d.arm, as: d.as, ms: d.ms, baseMs: d.ms, range: d.range,
    ranged: !!d.ranged, fx: d.fx, proj: d.proj || d.fx,
    role: d.role,
    isPlayer: !!opts.isPlayer, isAlly: !!opts.isAlly,
    atkCd: 0, dead: false, target: null, goal: opts.goal || null,
    path: opts.path || null, wp: opts.wp ?? 0,
    cds: [0,0,0,0], shield: 0, tempArm: 0, tempArmUntil: 0,
    cc: null, facing: { x: 1, y: 0 }, temporary: false, expiresAt: 0,
  };
}

export function makeMinion(team, path, wp){
  return {
    id: UID++, kind: 'minion', team,
    x: 0, y: 0, r: 15,
    hp: 320, maxHp: 320, atk: 22, arm: 8, as: 0.9, ms: 220, range: 46,
    ranged: false, fx: team === 0 ? '#5aa9ff' : '#ff6a5a',
    atkCd: 0, dead: false, target: null, path, wp,
  };
}

export function makeStructure(kind, team, x, y, hp){
  return {
    id: UID++, kind, team, x, y, r: kind === 'nexus' ? 55 : 38,
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
      const p0 = path[0], p1 = path[path.length-1];
      this.player = makeChampionUnit(this.cfg.champ, 0, { isPlayer: true, x: p0.x, y: p0.y - 40, path, wp: 1 });
      this.units.push(this.player);
      (this.cfg.allies || []).forEach((k, i) => {
        const u = makeChampionUnit(k, 0, { isAlly: true, x: p0.x, y: p0.y + 40 + i*40, path, wp: 1 });
        this.units.push(u);
      });
      const foes = this.cfg.foes || ['BABA'];
      for(let i = 0; i < (this.cfg.foeCount || 2); i++){
        const k = foes[i % foes.length];
        const u = makeChampionUnit(k, 1, { x: p1.x, y: p1.y + (i-1)*44, mult: this.cfg.foeMult || 1, path, wp: path.length-2 });
        this.units.push(u);
      }
      this.nexusAlly = makeStructure('nexus', 0, p0.x - 60, p0.y, 3500);
      this.nexusEnemy = makeStructure('nexus', 1, p1.x + 60, p1.y, 3500 * (this.cfg.foeMult || 1));
      this.units.push(this.nexusAlly, this.nexusEnemy);
      this.path = path;
      this.waveTimer = 6; this.waveN = 0;
    } else {
      // Arena — cercle simple, pas de lane.
      const cx = this.cfg.w/2 || 1100, cy = this.cfg.h/2 || 750;
      this.player = makeChampionUnit(this.cfg.champ, 0, { isPlayer: true, x: cx - 500, y: cy });
      this.units.push(this.player);
      (this.cfg.allies || []).forEach((k, i) => {
        this.units.push(makeChampionUnit(k, 0, { isAlly: true, x: cx - 500, y: cy + 60 + i*50 }));
      });
      const foes = this.cfg.foes || ['BABA'];
      for(let i = 0; i < (this.cfg.foeCount || 2); i++){
        const k = foes[i % foes.length];
        this.units.push(makeChampionUnit(k, 1, { x: cx + 500, y: cy + (i-1)*50, mult: this.cfg.foeMult || 1 }));
      }
      this.teamKills = [0, 0];
      this.killGoal = this.cfg.killGoal || 8;
      this.timeLimit = this.cfg.timeLimit || 300;
    }
  }

  setPlayerInput(dx, dy){ this.playerInput = { dx, dy }; }

  update(dt){
    if(this.over) return;
    this.time += dt;

    this._movePlayer(dt);
    for(const u of this.units){
      if(u.dead || u === this.player) continue;
      this._think(u, dt);
    }
    for(const u of this.units) if(!u.dead) this._tickAttack(u, dt);
    for(const u of this.units) if(!u.dead && u.kind === 'champ') this._tickResources(u, dt);
    this._processCastQueue();

    if(this.mode === 'siege') this._tickSiege(dt);
    else this._tickArena(dt);

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
    // Cible la plus proche adverse dans une zone d'agro.
    const foe = this._nearestFoe(u, 480);
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
      // Alliés/ennemis en arena sans cible : dérive vers le joueur.
      const anchor = this.player;
      const d = Math.hypot(anchor.x-u.x, anchor.y-u.y);
      if(d > 140) this._moveToward(u, anchor.x, anchor.y, dt);
      u.target = null;
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
      if(o.kind === 'nexus' && this.mode !== 'siege') continue;
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

  _resolveAttack(u, t){
    const effArm = (t.arm||0) + ((t.tempArm && this.time < t.tempArmUntil) ? t.tempArm : 0);
    const dmg = Math.max(2, (u.atk||10) * (100/(100+effArm)));
    if(u.ranged){
      this.onEvent({ type: 'projectile', from: u, to: t, color: u.proj || u.fx });
      setTimeout(() => this._applyDamage(u, t, dmg), 140);
    } else {
      this.onEvent({ type: 'melee', from: u, to: t });
      this._applyDamage(u, t, dmg);
    }
  }

  _applyDamage(u, t, dmg){
    if(t.dead) return;
    if(t.shield > 0){
      const absorbed = Math.min(t.shield, dmg);
      t.shield -= absorbed; dmg -= absorbed;
    }
    if(dmg <= 0){ this.onEvent({ type: 'hit', unit: t, dmg: 0, color: u.fx, blocked: true }); return; }
    t.hp -= dmg;
    this.onEvent({ type: 'hit', unit: t, dmg, color: u.fx });
    if(t.hp <= 0 && !t.dead){
      t.dead = true;
      this.onEvent({ type: 'death', unit: t, killer: u });
      if(t.kind === 'nexus') this._endMatch(u.team === 0);
      if(t.kind === 'champ' && this.mode === 'arena'){
        this.teamKills[u.team]++;
        this.onEvent({ type: 'score', teamKills: this.teamKills.slice() });
      }
      if(t.kind === 'champ') setTimeout(() => this._respawn(t), 4000);
    }
  }

  _respawn(t){
    if(this.over) return;
    t.dead = false; t.hp = t.maxHp;
    if(this.mode === 'siege' && this.path){
      const p = t.team === 0 ? this.path[0] : this.path[this.path.length-1];
      t.x = p.x; t.y = p.y; t.wp = t.team === 0 ? 1 : this.path.length-2;
    }
    this.onEvent({ type: 'respawn', unit: t });
  }

  _tickSiege(dt){
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
      const m0 = makeMinion(0, path, 1);
      m0.x = path[0].x; m0.y = path[0].y + (i-1)*30;
      const m1 = makeMinion(1, path, path.length-2);
      m1.x = path[path.length-1].x; m1.y = path[path.length-1].y + (i-1)*30;
      this.units.push(m0, m1);
    }
  }

  _minionMove(u, dt){
    const foe = this._nearestFoe(u, 220);
    if(foe){ u.target = foe; return; }
    const wp = u.path[u.wp];
    if(!wp) return;
    const d = Math.hypot(wp.x-u.x, wp.y-u.y);
    if(d < 30) u.wp += (u.team === 0 ? 1 : -1);
    else this._moveToward(u, wp.x, wp.y, dt);
  }

  _tickArena(dt){
    if(this.teamKills[0] >= this.killGoal) this._endMatch(true);
    else if(this.teamKills[1] >= this.killGoal) this._endMatch(false);
    else if(this.time >= this.timeLimit) this._endMatch(this.teamKills[0] >= this.teamKills[1]);
  }

  _endMatch(victory){
    if(this.over) return;
    this.over = true; this.victory = victory;
    this.onEvent({ type: 'end', victory });
  }
}
