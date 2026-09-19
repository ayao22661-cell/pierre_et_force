// ============================================================
// EFFECTS — projectiles, impacts, particules, texte de dégâts.
// Tout en additif via softCircle() pour un rendu "énergie" cohérent
// avec les glows des unités, sans aucune image chargée.
// ============================================================
import { softCircle } from './textures.js';

export class EffectsLayer{
  constructor(layers){
    this.layers = layers;
    layers.projectiles.blendMode = 'add';
    layers.fx.blendMode = 'add';
    this.projectiles = [];
    this.particles = [];
    this.texts = [];
  }

  /** Projectile qui va de (x0,y0) à une cible suivie, avec traînée. */
  spawnProjectile({ x, y, target, speed = 900, color = 0xffffff, size = 10 }){
    const spr = new PIXI.Sprite(softCircle());
    spr.anchor.set(0.5);
    spr.tint = color;
    spr.width = spr.height = size * 3;
    spr.x = x; spr.y = y;
    this.layers.projectiles.addChild(spr);
    this.projectiles.push({ spr, x, y, target, speed, color, size, trail: [] });
    return spr;
  }

  /** Onde d'impact circulaire qui s'étend et s'estompe. */
  spawnImpact(x, y, color = 0xffffff, r = 60){
    const g = new PIXI.Graphics();
    g.x = x; g.y = y;
    this.layers.fx.addChild(g);
    this.particles.push({ kind: 'ring', g, t: 0, dur: 0.35, x, y, color, r });

    for(let i = 0; i < 10; i++){
      const spr = new PIXI.Sprite(softCircle());
      spr.anchor.set(0.5);
      spr.tint = color;
      spr.x = x; spr.y = y;
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random()*160;
      this.layers.fx.addChild(spr);
      this.particles.push({
        kind: 'spark', spr, t: 0, dur: 0.35 + Math.random()*0.25,
        vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, size: 4 + Math.random()*6,
      });
    }
  }

  /** Anneau au sol pulsant — zone de compétence, capture, aura. */
  spawnGroundPulse(x, y, color, r){
    const g = new PIXI.Graphics();
    g.x = x; g.y = y;
    this.layers.fx.addChild(g);
    this.particles.push({ kind: 'ring', g, t: 0, dur: 0.7, x, y, color, r });
  }

  spawnFloatText(x, y, text, color = '#ffffff', big = false){
    const t = new PIXI.Text({
      text, style: {
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: big ? 26 : 18,
        fill: color,
        stroke: { color: '#000000', width: 3 },
      }
    });
    t.anchor.set(0.5);
    t.x = x; t.y = y;
    this.layers.floatText.addChild(t);
    this.texts.push({ t, t0: 0, dur: 1.0, vy: -55 });
  }

  update(dt){
    // Projectiles
    for(let i = this.projectiles.length - 1; i >= 0; i--){
      const p = this.projectiles[i];
      const tgt = p.target;
      if(!tgt || tgt.dead){ this._killProjectile(p, i); continue; }
      const dx = tgt.x - p.x, dy = tgt.y - p.y;
      const dist = Math.hypot(dx, dy);
      if(dist < 16){
        this.spawnImpact(p.x, p.y, p.color, p.size * 4);
        this._killProjectile(p, i);
        continue;
      }
      const step = p.speed * dt;
      p.x += (dx/dist) * step; p.y += (dy/dist) * step;
      p.spr.x = p.x; p.spr.y = p.y;
    }

    // Particules (rings + sparks)
    for(let i = this.particles.length - 1; i >= 0; i--){
      const pt = this.particles[i];
      pt.t += dt;
      const k = Math.min(1, pt.t / pt.dur);
      if(pt.kind === 'ring'){
        pt.g.clear();
        pt.g.circle(0, 0, pt.r * (0.3 + k*0.9)).stroke({ width: 4 * (1-k) + 1, color: pt.color, alpha: 1 - k });
      } else {
        pt.spr.x += pt.vx * dt; pt.spr.y += pt.vy * dt;
        pt.vx *= (1 - dt*2); pt.vy *= (1 - dt*2);
        pt.spr.alpha = 1 - k;
        pt.spr.width = pt.spr.height = pt.size * (1 - k*0.5);
      }
      if(k >= 1){
        (pt.g || pt.spr).destroy();
        this.particles.splice(i, 1);
      }
    }

    // Textes flottants
    for(let i = this.texts.length - 1; i >= 0; i--){
      const ft = this.texts[i];
      ft.t0 += dt;
      const k = Math.min(1, ft.t0 / ft.dur);
      ft.t.y += ft.vy * dt;
      ft.t.alpha = 1 - k;
      if(k >= 1){ ft.t.destroy(); this.texts.splice(i, 1); }
    }
  }

  _killProjectile(p, i){
    p.spr.destroy();
    this.projectiles.splice(i, 1);
  }

  clear(){
    for(const p of this.projectiles) p.spr.destroy();
    for(const pt of this.particles) (pt.g || pt.spr).destroy();
    for(const ft of this.texts) ft.t.destroy();
    this.projectiles = []; this.particles = []; this.texts = [];
  }
}
