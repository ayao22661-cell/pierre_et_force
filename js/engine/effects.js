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

  /**
   * Onde d'impact — un anneau APLATI (ellipse, pas un cercle) pour
   * qu'il se lise comme posé AU SOL sous la vue en 3/4 du jeu, plus une
   * gerbe d'étincelles. `heavy` (coup d'ultime) et `crit` grossissent
   * l'ensemble et ajoutent un flash central bref pour plus de poids.
   */
  spawnImpact(x, y, color = 0xffffff, r = 60, opts = {}){
    const big = opts.heavy ? 1.6 : opts.crit ? 1.25 : 1;
    r *= big;
    const g = new PIXI.Graphics();
    g.x = x; g.y = y;
    this.layers.fx.addChild(g);
    this.particles.push({ kind: 'ring', g, t: 0, dur: 0.32, x, y, color, r, flat: 0.42 });

    if(opts.heavy){
      // Flash central bref — le "punch" d'un ultime qui touche.
      const flash = new PIXI.Graphics();
      flash.x = x; flash.y = y;
      this.layers.fx.addChild(flash);
      this.particles.push({ kind: 'flash', g: flash, t: 0, dur: 0.14, r: r * 0.5 });
    }

    const n = Math.round((opts.heavy ? 18 : opts.crit ? 14 : 10) * 1);
    for(let i = 0; i < n; i++){
      const spr = new PIXI.Sprite(softCircle());
      spr.anchor.set(0.5);
      spr.tint = color;
      spr.x = x; spr.y = y;
      const a = Math.random() * Math.PI * 2, sp = (70 + Math.random()*180) * big;
      // Étincelles légèrement aplaties en Y elles aussi (elles retombent
      // au sol) au lieu de voler en cercle parfait autour du point d'impact.
      this.layers.fx.addChild(spr);
      this.particles.push({
        kind: 'spark', spr, t: 0, dur: 0.3 + Math.random()*0.25,
        vx: Math.cos(a)*sp, vy: Math.sin(a)*sp*0.55, size: (4 + Math.random()*6) * big,
      });
    }
  }

  /** Anneau au sol pulsant — zone de compétence, capture, aura. Aplati comme spawnImpact. */
  spawnGroundPulse(x, y, color, r){
    const g = new PIXI.Graphics();
    g.x = x; g.y = y;
    this.layers.fx.addChild(g);
    this.particles.push({ kind: 'ring', g, t: 0, dur: 0.7, x, y, color, r, flat: 0.42 });
  }

  /**
   * Texte de dégâts. `crit` : plus grand, teinte orange vif, léger
   * surgissement (scale 1.5 → 1) pour que le coup se ressente au premier
   * coup d'œil sans avoir à lire le chiffre.
   */
  spawnFloatText(x, y, text, color = '#ffffff', big = false, crit = false){
    const size = crit ? 32 : big ? 26 : 20;
    const t = new PIXI.Text({
      text, style: {
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: size,
        fill: crit ? '#ff9c3d' : color,
        stroke: { color: '#000000', width: crit ? 4 : 3 },
      }
    });
    t.anchor.set(0.5);
    t.x = x; t.y = y;
    t.scale.set(crit ? 1.55 : 1.15);
    this.layers.floatText.addChild(t);
    this.texts.push({ t, t0: 0, dur: crit ? 1.15 : 1.0, vy: crit ? -70 : -55, pop: true, popFrom: t.scale.x });
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

    // Particules (rings + sparks + flash)
    for(let i = this.particles.length - 1; i >= 0; i--){
      const pt = this.particles[i];
      pt.t += dt;
      const k = Math.min(1, pt.t / pt.dur);
      if(pt.kind === 'ring'){
        // Ellipse (scaleY réduit) : lue comme un impact POSÉ au sol,
        // cohérent avec la caméra 3D inclinée, plutôt qu'un cercle qui
        // semble flotter face caméra.
        const flat = pt.flat || 1;
        pt.g.clear();
        pt.g.ellipse(0, 0, pt.r * (0.3 + k*0.9), pt.r * (0.3 + k*0.9) * flat)
          .stroke({ width: 4 * (1-k) + 1, color: pt.color, alpha: 1 - k });
      } else if(pt.kind === 'flash'){
        pt.g.clear();
        pt.g.circle(0, 0, pt.r * (1 - k*0.3)).fill({ color: 0xffffff, alpha: (1 - k) * 0.85 });
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

    // Textes flottants — surgissement (scale) puis montée + fondu.
    for(let i = this.texts.length - 1; i >= 0; i--){
      const ft = this.texts[i];
      ft.t0 += dt;
      const k = Math.min(1, ft.t0 / ft.dur);
      ft.t.y += ft.vy * dt;
      ft.t.alpha = 1 - Math.max(0, (k - 0.6) / 0.4); // reste opaque, puis s'efface en fin de vie
      if(ft.pop){
        const pk = Math.min(1, ft.t0 / 0.12); // 120 ms pour retomber à l'échelle normale
        const scale = ft.popFrom + (1 - ft.popFrom) * pk;
        ft.t.scale.set(scale);
      }
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
