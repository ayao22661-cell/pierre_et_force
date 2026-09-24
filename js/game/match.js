// ============================================================
// MATCH — assemble Sim (logique) + Renderer (PixiJS) + Tilemap
// ============================================================
import { Sim, makeChampionUnit } from './sim.js';
import { siegeLayout, arenaLayout } from '../engine/tilemap.js';
import { BabylonTerrain } from '../engine/babylon-terrain.js';
import { UnitView } from '../engine/unit-view.js';
import { EffectsLayer } from '../engine/effects.js';
import { CHAMPS } from '../data/champions.js';

const THEME_DEFAULT = { g1:'#3a2c1e', g2:'#463524', lane:'#6a5138', acc:'#c9a24a', wall:'#1c140c' };

export class Match{
  constructor(renderer, cfg){
    this.renderer = renderer;
    this.cfg = cfg;
    this.onHud = cfg.onHud || (() => {});
    this.onEnd = cfg.onEnd || (() => {});
    this.views = new Map();
    this.keys = {};
    this.touchVec = { x: 0, y: 0 };

    const theme = cfg.theme || THEME_DEFAULT;
    // Le mode Défense a lui aussi besoin d'une voie (les ennemis y
    // convergent vers l'autel allié) : sans ce chemin, Sim._build()
    // retombait silencieusement sur l'arène (pas de chemin => pas d'autel,
    // pas de vagues) — la carte semblait vide dès la première mission en
    // Défense (mission 4).
    const layout = (cfg.mode === 'siege' || cfg.mode === 'defense') ? siegeLayout() : arenaLayout();
    renderer.worldSize = { w: layout.w, h: layout.h };

    // artSeed basé sur le nom de mission pour varier le terrain par mission
    const artSeed = cfg.missionId ? hashStr(cfg.missionId) : Math.floor(Math.random() * 100);
    // Le terrain (sol, voie, bosquets, murs) est rendu en 3D par Babylon,
    // dans la même scène que les personnages — voir engine/babylon-terrain.js.
    // Remplace l'ancien tapis de tuiles PixiJS plat (tilemap.js n'est plus
    // utilisé que pour ses fonctions de layout siegeLayout()/arenaLayout()).
    if(!renderer.units3d){
      console.error('[Match] renderer.units3d est introuvable — le terrain et les personnages 3D ne peuvent pas être créés.');
    } else {
      // Le lieu de la mission (cour d'Abidjan, forêt du Banco, Pôle Nord…)
      // décide du sol, du décor et de la lumière — voir engine/scene/scene-map.js.
      this.terrain = new BabylonTerrain(renderer.units3d.scene, { ...theme, missionId: cfg.missionId, mode: cfg.mode }, layout, artSeed, cfg.place || null);
    }

    this.fx = new EffectsLayer(renderer.layers);

    this.sim = new Sim({
      ...cfg, path: layout.path, w: layout.w, h: layout.h,
      onEvent: (e) => this._onSimEvent(e),
    });

    for(const u of this.sim.units) this._ensureView(u);

    this._onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      // Échap / P : pause (gérée par le HUD, qui affiche le menu).
      if(k === 'escape' || k === 'p'){ this._hud?.togglePause(); return; }
      if(this.paused) return;
      this.keys[k] = true;
      const slot = { a: 0, z: 1, e: 2, r: 3 }[k];
      if(slot !== undefined) this.sim.requestCast(this.sim.player, slot);
      // Espace (ou W) : coup de base à la main.
      if(k === ' ' || k === 'spacebar' || k === 'w'){ e.preventDefault(); this.basicAttack(); }
      // Mode Combat : coup lourd, garde (maintenue) et esquive.
      if(this.sim.mode === 'duel'){
        if(k === 'k'){ e.preventDefault(); this.sim.duelStrike('heavy'); }
        if(k === 'l'){ e.preventDefault(); this.sim.duelBlock(true); }
        if(k === 'm'){ e.preventDefault(); this.sim.duelDodge(); }
      }
    };
    this._onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;
      // La garde se relâche avec la touche (comme au pad).
      if(this.sim.mode === 'duel' && k === 'l') this.sim.duelBlock(false);
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    // Mode Combat : la caméra se rapproche nettement. Au cadrage MOBA, deux
    // combattants font quarante pixels de haut et on ne lit plus rien des coups.
    if(this.sim.mode === 'duel'){
      // Caméra de jeu de combat : perspective basse, perpendiculaire à
      // l'axe des deux combattants, et couche 2D projetée à l'écran.
      renderer.setDuelProjection(true);
      renderer.units3d?.setDuelCamera({
        ax: this.sim.player.x, ay: this.sim.player.y,
        bx: this.sim.duelFoe.x, by: this.sim.duelFoe.y,
      });
    }
    renderer.setFocusImmediate(this.sim.player.x, this.sim.player.y);
    this._tickFn = (dt) => this._tick(dt);
    renderer.addFrameListener(this._tickFn);
    this._running = true;
    this._hud = null; // assigné par CombatHud après construction
  }

  _ensureView(u){
    if(this.views.has(u.id)) return this.views.get(u.id);
    const accent = u.fx ? parseInt(u.fx.replace('#',''), 16) : 0x3f8fd6;
    const v = new UnitView(this.renderer.layers, u, accent);
    if(u.isPlayer) v.setSelected(true);
    this.views.set(u.id, v);
    return v;
  }

  castSlot(slot){ this.sim.requestCast(this.sim.player, slot); }
  /** Coup de base du joueur (bouton du HUD, touche Espace). */
  basicAttack(){ this.sim.requestBasicAttack(); }

  _onSimEvent(e){
    switch(e.type){
      case 'swing':
        // Coup dans le vide : juste l'animation, aucun dégât.
        this.renderer.units3d?.notifyAction(e.from.id, 'attack', { interval: 1 / (e.from.as || 0.7), force: true });
        break;
      case 'projectile':
        this.fx.spawnProjectile({ x: e.from.x, y: e.from.y, target: e.to, color: hexNum(e.color), size: e.isAbility ? 13 : 10 });
        // Tir de base (mages, soutiens) : animation d'attaque à distance.
        // force: true (pas seulement e.manual) — cet événement n'est émis
        // qu'APRÈS _resolveAttack, donc l'unité est déjà à portée, jamais
        // "en glissade". Avant : seules les attaques du joueur forçaient
        // l'anim ; celles de l'IA (alliés, sbires, champions ennemis)
        // dépendaient de speedPx, que le tassement de _separate() autour
        // d'une cible groupée (autel notamment) maintient artificiellement
        // au-dessus du seuil — l'IA semblait ne jamais frapper alors que
        // les dégâts, eux, s'appliquaient bien.
        if(!e.isAbility) this.renderer.units3d?.notifyAction(e.from.id, 'attack', { interval: 1 / (e.from.as || 0.7), force: true });
        break;
      case 'hit': {
        const v = this.views.get(e.unit.id);
        if(v) v.flashHit();
        if(e.dmg > 0){
          this.renderer.units3d?.notifyAction(e.unit.id, 'hit');
          this.fx.spawnFloatText(e.unit.x, e.unit.y - (e.unit.r||20) - 6, Math.round(e.dmg).toString(), '#ffe27a', e.heavy, e.crit);
          // Coup critique ou dégât d'ultime : impact au sol plus large sous
          // la cible (pas seulement le texte) + tremblement de caméra bref,
          // pour que le coup se RESSENTE, pas juste se lise en chiffres.
          if(e.crit || e.heavy){
            this.fx.spawnImpact(e.unit.x, e.unit.y + (e.unit.r||20)*0.6, hexNum(e.color), e.heavy ? 46 : 30, { crit: e.crit, heavy: e.heavy });
          }
          if(e.heavy) this.renderer.shakeCamera(10, 0.2);
          else if(e.crit) this.renderer.shakeCamera(5, 0.12);
        }
        break;
      }
      case 'heal':
        this.fx.spawnFloatText(e.unit.x, e.unit.y - (e.unit.r||20) - 6, '+' + Math.round(e.amount), '#7dffb0');
        this.fx.spawnImpact(e.unit.x, e.unit.y, 0x7dffb0, 34);
        break;
      case 'melee': {
        // Impact posé au sol, juste devant la cible plutôt qu'au milieu
        // des deux unités : lisible comme « le coup a frappé LÀ », plus
        // large qu'avant (24 -> 34) et un peu plus si le coup est critique.
        const mx = e.to.x - (e.to.x - e.from.x) * 0.15, my = e.to.y - (e.to.y - e.from.y) * 0.15 + (e.to.r||20)*0.5;
        this.fx.spawnImpact(mx, my, hexNum(e.from.fx), e.crit ? 30 : 22, { crit: e.crit });
        // force: true — même raison que pour 'projectile' ci-dessus : cet
        // événement suit toujours un coup déjà résolu (unité à portée),
        // donc jamais de « glissade » à craindre ici.
        this.renderer.units3d?.notifyAction(e.from.id, 'attack', { interval: 1 / (e.from.as || 0.7), force: true });
        break;
      }
      case 'cast': {
        const v = this.views.get(e.unit.id);
        if(v) v.flashHit();
        this.renderer.units3d?.notifyAction(e.unit.id, 'cast');
        break;
      }
      case 'fx-self':
        this.fx.spawnImpact(e.unit.x, e.unit.y, hexNum(e.color), 60);
        break;
      case 'fx-dash':
        this.fx.spawnImpact(e.x1, e.y1, hexNum(e.color), 50);
        break;
      case 'fx-beam':
        this.fx.spawnImpact(e.to.x, e.to.y, hexNum(e.color), 40);
        break;
      case 'fx-cone':
        this.fx.spawnImpact(
          e.unit.x + e.unit.facing.x * e.range * 0.5,
          e.unit.y + e.unit.facing.y * e.range * 0.5,
          hexNum(e.color), e.range * 0.6
        );
        break;
      case 'ground-tell':
        this.fx.spawnGroundPulse(e.x, e.y, hexNum(e.color), e.radius);
        break;
      case 'ground-impact':
        this.fx.spawnImpact(e.x, e.y, hexNum(e.color), e.radius, { heavy: e.heavy });
        if(e.heavy) this.renderer.shakeCamera(9, 0.2);
        break;
      case 'death': {
        this.fx.spawnImpact(e.unit.x, e.unit.y, 0xffffff, 70);
        if(e.unit.kind === 'champ' && !e.silent){
          this.fx.spawnFloatText(e.unit.x, e.unit.y - 30, 'ÉLIMINÉ', '#ff6a5a', true);
        }
        break;
      }
      case 'score':
        this.onHud({ teamKills: e.teamKills });
        break;
      case 'announce':
        // Utilisé par le revive, le burn, les vagues, etc.
        if(this._hud) this._hud.announce(e.text);
        break;
      // ── Mode Combat : chaque état du combattant a son animation ──
      case 'fight': {
        const u3 = this.renderer.units3d;
        if(!u3) break;
        const id = e.unit.id;
        switch(e.kind){
          case 'strike': {
            // Coup n° e.step de l'enchaînement : un clip différent à chaque
            // étape, joué dans la durée exacte du coup (élan + phase active).
            const heavy = e.move === 'heavy';
            u3.playFight(id, 'attack', heavy ? 1 + e.step : e.step, { dur: heavy ? 0.33 : 0.26 });
            break;
          }
          case 'hurt':      u3.playFight(id, 'hit', Math.floor(Math.random() * 3), { dur: 0.42 }); break;
          case 'knockdown': u3.playFight(id, 'death', Math.floor(Math.random() * 2), { dur: 0.9, hold: true }); break;
          case 'getup':     u3.releaseFight(id); break;
          case 'block-on':  u3.playFight(id, 'block', 0, { dur: 0.5, hold: true }); break;
          case 'block-off': u3.releaseFight(id); break;
          case 'blocked':   this.fx.spawnFloatText(e.unit.x, e.unit.y - 40, 'GARDE', '#9ec5ff'); break;
          case 'dodge':     u3.playFight(id, 'dodge', Math.floor(Math.random() * 3), { dur: 0.42 }); break;
          case 'dodge-perfect': this.fx.spawnFloatText(e.unit.x, e.unit.y - 40, 'ESQUIVE !', '#ffd166', true); break;
        }
        break;
      }
      case 'fight-impact':
        // Secousse + rapprochement bref de la caméra sur le coup qui porte.
        this.renderer.units3d?.duelImpact(e.heavy);
        // Impact : gerbe d'étincelles, plus large sur un coup lourd.
        this.fx.spawnImpact(e.to.x, e.to.y - 20, e.heavy ? 0xffc04a : 0xffffff, e.heavy ? 150 : 90);
        break;

      // ── Mode Combat ──
      case 'duel-round':
        if(this._hud){ this._hud.showDuelBar(this.sim); this._hud.announce(`ROUND ${e.round}`); }
        break;
      case 'duel-fight':
        if(this._hud) this._hud.announce('COMBAT !');
        break;
      case 'duel-round-end':
        if(this._hud) this._hud.announce(e.winner === 0 ? 'ROUND REMPORTÉ' : 'ROUND PERDU');
        break;
      case 'duel-combo':
        if(this._hud) this._hud.showCombo(e.combo);
        break;
      case 'duel-combo-end':
        if(this._hud) this._hud.hideCombo();
        break;
      case 'boss-spawn':
        if(this._hud) this._hud.showBossBar(e.boss);
        break;
      case 'boss-hp':
        if(this._hud) this._hud.updateBossBar(e.boss);
        break;
      case 'end':
        this._running = false;
        this.onEnd({ victory: e.victory });
        break;
    }
  }

  /** Met le combat en pause (simulation, effets, animations 3D) ou le relance. */
  setPaused(on){
    this.paused = !!on;
    this.keys = {};
    this.touchVec.x = this.touchVec.y = 0;
    const scene = this.renderer.units3d?.scene;
    if(scene) scene.animationsEnabled = !this.paused;
  }

  _tick(dt){
    if(!this._running || this.paused) return;

    let dx = 0, dy = 0;
    if(this.keys['arrowup'])    dy -= 1;
    if(this.keys['arrowdown'])  dy += 1;
    if(this.keys['arrowleft'])  dx -= 1;
    if(this.keys['arrowright']) dx += 1;
    if(this.touchVec.x || this.touchVec.y){ dx = this.touchVec.x; dy = this.touchVec.y; }
    if(this.sim.mode === 'duel' && this.renderer.units3d){
      // La caméra tourne avec les combattants : « en avant » doit rester
      // le haut de l'écran, pas le nord de la carte.
      const yaw = this.renderer.units3d.duelCameraYaw();
      const s0 = Math.sin(yaw), c0 = Math.cos(yaw);
      const wx = dy * s0 + dx * c0;
      const wy = -dy * c0 + dx * s0;
      dx = wx; dy = wy;
    }
    this.sim.setPlayerInput(dx, dy);

    this.sim.update(dt);
    this.fx.update(dt);

    for(const u of this.sim.units){
      const v = this._ensureView(u);
      v.update(dt, u);
    }
    // Synchronise les modèles 3D Babylon (position, orientation, mort)
    // sur l'état courant du sim — le rendu 2D ci-dessus ne gère plus
    // que HUD/barres de vie/effets pour les unités concernées.
    this.renderer.units3d?.update(this.sim.units, this.views);

    if(this.sim.mode === 'duel' && this.sim.duelFoe){
      // La caméra suit le couple : elle reste entre les deux, à hauteur
      // d'homme, et pivote pour rester perpendiculaire à leur axe.
      const p = this.sim.player, f = this.sim.duelFoe;
      this.renderer.units3d?.setDuelCamera({ ax: p.x, ay: p.y, bx: f.x, by: f.y });
      this.renderer.focusOn((p.x + f.x) / 2, (p.y + f.y) / 2);  // minimap
    } else {
      this.renderer.focusOn(this.sim.player.x, this.sim.player.y);
    }

    this.onHud({
      time: this.sim.time,
      objective: this._objectiveText(),
    });
  }

  _objectiveText(){
    const m = this.sim.mode;
    if(m === 'siege'){
      const ne = this.sim.autelEnnemi;
      return `Autel ennemi ${Math.round(100*ne.hp/ne.maxHp)}%`;
    }
    if(m === 'defense'){
      const na = this.sim.autelAllie;
      const wave = this.sim.defenseWaveN, total = this.sim.defenseWaveTotal;
      return `Défense — Autel ${Math.round(100*na.hp/na.maxHp)}% • Vague ${wave}/${total}`;
    }
    if(m === 'boss'){
      if(this.sim.boss){
        return `BOSS — ${this.sim.boss.name} ${Math.round(100*this.sim.boss.hp/this.sim.boss.maxHp)}% PV`;
      }
      return 'BOSS';
    }
    if(m === 'duel'){
      const s2 = this.sim;
      return `Round ${s2.roundNo} — manches ${s2.roundWins[0]} / ${s2.roundWins[1]} (${s2.roundsToWin} gagnantes)`;
    }
    return `Score ${this.sim.teamKills[0]} – ${this.sim.teamKills[1]} / ${this.sim.killGoal}`;
  }

  destroy(){
    if(this.sim?.mode === 'duel'){
      this.renderer.setDuelProjection(false);
      this.renderer.units3d?.setDuelCamera(null);
    }
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.renderer.removeFrameListener(this._tickFn);
    for(const v of this.views.values()) v.destroy();
    this.fx.clear();
    this.terrain?.destroy();
  }
}

function hexNum(hex){ return typeof hex === 'number' ? hex : parseInt((hex||'#ffffff').replace('#',''), 16); }
function hashStr(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return Math.abs(h); }
