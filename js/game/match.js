// ============================================================
// MATCH — assemble Sim (logique) + Renderer (PixiJS) + Tilemap
// ============================================================
import { Sim, makeChampionUnit } from './sim.js';
import { Tilemap, siegeLayout, arenaLayout } from '../engine/tilemap.js';
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
    const layout = cfg.mode === 'siege' ? siegeLayout() : arenaLayout();
    renderer.worldSize = { w: layout.w, h: layout.h };

    // artSeed basé sur le nom de mission pour varier les images par mission
    const artSeed = cfg.missionId ? hashStr(cfg.missionId) : Math.floor(Math.random() * 100);
    this.tilemap = new Tilemap(theme, layout, artSeed);
    this.tilemap.addTo(renderer.layers);

    this.fx = new EffectsLayer(renderer.layers);

    this.sim = new Sim({
      ...cfg, path: layout.path, w: layout.w, h: layout.h,
      onEvent: (e) => this._onSimEvent(e),
    });

    for(const u of this.sim.units) this._ensureView(u);

    this._onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;
      const slot = { a: 0, z: 1, e: 2, r: 3 }[k];
      if(slot !== undefined) this.sim.requestCast(this.sim.player, slot);
    };
    this._onKeyUp = (e) => { this.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

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

  _onSimEvent(e){
    switch(e.type){
      case 'projectile':
        this.fx.spawnProjectile({ x: e.from.x, y: e.from.y, target: e.to, color: hexNum(e.color), size: e.isAbility ? 13 : 10 });
        break;
      case 'hit': {
        const v = this.views.get(e.unit.id);
        if(v) v.flashHit();
        if(e.dmg > 0) this.fx.spawnFloatText(e.unit.x, e.unit.y - (e.unit.r||20) - 6, Math.round(e.dmg).toString(), '#ffe27a');
        break;
      }
      case 'heal':
        this.fx.spawnFloatText(e.unit.x, e.unit.y - (e.unit.r||20) - 6, '+' + Math.round(e.amount), '#7dffb0');
        this.fx.spawnImpact(e.unit.x, e.unit.y, 0x7dffb0, 34);
        break;
      case 'melee':
        this.fx.spawnImpact((e.from.x+e.to.x)/2, (e.from.y+e.to.y)/2, hexNum(e.from.fx), 24);
        break;
      case 'cast': {
        const v = this.views.get(e.unit.id);
        if(v) v.flashHit();
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
        this.fx.spawnImpact(e.x, e.y, hexNum(e.color), e.radius);
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
        // Utilisé par le revive, le burn, etc.
        if(this._hud) this._hud.announce(e.text);
        break;
      case 'end':
        this._running = false;
        this.onEnd({ victory: e.victory });
        break;
    }
  }

  _tick(dt){
    if(!this._running) return;

    let dx = 0, dy = 0;
    if(this.keys['arrowup'])    dy -= 1;
    if(this.keys['arrowdown'])  dy += 1;
    if(this.keys['arrowleft'])  dx -= 1;
    if(this.keys['arrowright']) dx += 1;
    if(this.touchVec.x || this.touchVec.y){ dx = this.touchVec.x; dy = this.touchVec.y; }
    this.sim.setPlayerInput(dx, dy);

    this.sim.update(dt);
    this.fx.update(dt);

    for(const u of this.sim.units){
      const v = this._ensureView(u);
      v.update(dt, u);
    }

    this.renderer.focusOn(this.sim.player.x, this.sim.player.y);

    this.onHud({
      time: this.sim.time,
      objective: this._objectiveText(),
    });
  }

  _objectiveText(){
    if(this.sim.mode === 'siege'){
      const na = this.sim.nexusAlly, ne = this.sim.nexusEnemy;
      return `Nexus ennemi ${Math.round(100*ne.hp/ne.maxHp)}%`;
    }
    return `Score ${this.sim.teamKills[0]} – ${this.sim.teamKills[1]} / ${this.sim.killGoal}`;
  }

  destroy(){
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.renderer.removeFrameListener(this._tickFn);
    for(const v of this.views.values()) v.destroy();
    this.fx.clear();
    this.tilemap.destroy();
  }
}

function hexNum(hex){ return typeof hex === 'number' ? hex : parseInt((hex||'#ffffff').replace('#',''), 16); }
function hashStr(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return Math.abs(h); }
