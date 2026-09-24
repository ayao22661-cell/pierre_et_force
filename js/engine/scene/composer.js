// ============================================================
// COMPOSITEUR — décide OÙ va chaque élément du décor, avant de
// construire quoi que ce soit, pour que la cuisson du sol connaisse
// les ombres de contact. Règles de mise en scène (celles des MOBA) :
//   • rien d'encombrant sur la voie ni sur les bases / camps ;
//   • lisière du HAUT dense et haute (arbres, maisons) : elle ferme
//     le fond du tableau ;
//   • lisière du BAS basse (buissons, murets, rochers) : elle est
//     entre la caméra et le combat, elle ne doit rien masquer ;
//   • sur le terrain, seulement des éléments bas et épars.
// ============================================================

import { rng, fbm } from './noise.js';

export class Composer{
  /**
   * @param {object} o
   *   play : { x0, z0, x1, z1 } zone jouable (unités Babylon)
   *   margin : largeur de la lisière hors carte
   *   path : [{x,z}] ou null ; laneHalf
   *   reserved : [{x, z, r}] zones à garder libres (bases, camps, départ)
   *   seed, small (petit écran : moins d'éléments)
   */
  constructor(o){
    Object.assign(this, o);
    this.R = rng(o.seed + 991);
    this.placed = [];       // obstacles posés {x,z,r}
    this.shadows = [];      // pour ground-bake
    this.jobs = [];         // [template, x, y, z, rot, s, sy]
    this.models = [];       // modèles GLB à charger (armures, vaisseau, boussole…)
    this.cell = 2;
    this.grid = new Map();
    this.density = o.small ? 0.65 : 1.25; // le joueur vit au milieu du terrain : il ne doit jamais être vide
    this.noise = fbm(o.seed + 5, { octaves: 3 });
    const P = o.play;
    this.outer = { x0: P.x0 - o.margin, x1: P.x1 + o.margin, z0: P.z0 + o.margin, z1: P.z1 - o.margin };
  }

  laneDist(x, z){
    const P = this.path;
    if(!P) return 1e9;
    let best = 1e9;
    for(let k = 0; k < P.length - 1; k++){
      const ax = P[k].x, az = P[k].z, dx = P[k + 1].x - ax, dz = P[k + 1].z - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
      const ex = ax + dx * t - x, ez = az + dz * t - z;
      best = Math.min(best, ex * ex + ez * ez);
    }
    return Math.sqrt(best);
  }
  edgeDist(x, z){
    const P = this.play;
    return Math.min(x - P.x0, P.x1 - x, P.z0 - z, z - P.z1);
  }
  _key(i, j){ return i + ',' + j; }
  overlaps(x, z, r){
    const c = this.cell, i0 = Math.floor((x - r - 4) / c), i1 = Math.floor((x + r + 4) / c);
    const j0 = Math.floor((z - r - 4) / c), j1 = Math.floor((z + r + 4) / c);
    for(let i = i0; i <= i1; i++) for(let j = j0; j <= j1; j++){
      const list = this.grid.get(this._key(i, j));
      if(!list) continue;
      for(const p of list) if(Math.hypot(p.x - x, p.z - z) < p.r + r) return true;
    }
    return false;
  }
  blocked(x, z, r, { lanePad = 0.6, allowField = true } = {}){
    if(this.laneDist(x, z) < this.laneHalf + r + lanePad) return true;
    for(const q of this.reserved) if(Math.hypot(q.x - x, q.z - z) < q.r + r) return true;
    if(!allowField && this.edgeDist(x, z) > 0.5) return true;
    const O = this.outer;
    if(x < O.x0 || x > O.x1 || z > O.z0 || z < O.z1) return true;
    return false;
  }
  _register(x, z, r){
    const p = { x, z, r };
    this.placed.push(p);
    const k = this._key(Math.floor(x / this.cell), Math.floor(z / this.cell));
    if(!this.grid.has(k)) this.grid.set(k, []);
    this.grid.get(k).push(p);
  }

  /** Pose un élément. solid : compte comme obstacle (espacement). */
  put(tpl, x, z, { rot = null, s = 1, sy = null, solid = true, shadow = true, y = null, pad = 1 } = {}){
    const R = this.R;
    const gy = y ?? (this.groundHeight ? this.groundHeight(x, z) : 0);
    const rr = rot ?? R() * Math.PI * 2;
    this.jobs.push([tpl, x, gy, z, rr, s, sy ?? s]);
    if(solid) this._register(x, z, tpl.radius * s * pad);
    if(shadow && tpl.shadow > 0) this.shadows.push({ x, z, r: tpl.radius * s * 1.15, k: tpl.shadow });
  }

  /** Essaie de poser à une position aléatoire répondant à `where`. */
  scatter(tpls, count, where, o = {}){
    const R = this.R;
    const list = Array.isArray(tpls) ? tpls : [tpls];
    let n = Math.round(count * (o.fixed ? 1 : this.density)), tries = 0;
    const O = this.outer;
    while(n > 0 && tries < count * 40){
      tries++;
      const x = O.x0 + R() * (O.x1 - O.x0), z = O.z1 + R() * (O.z0 - O.z1);
      const tpl = R.pick(list);
      const s = (o.s?.[0] ?? 0.85) + R() * ((o.s?.[1] ?? 1.15) - (o.s?.[0] ?? 0.85));
      const r = tpl.radius * s * (o.pad ?? 1);
      if(!where(x, z, this)) continue;
      if(this.blocked(x, z, r, o)) continue;
      if(o.solid !== false && this.overlaps(x, z, r * (o.spacing ?? 1))) continue;
      if(o.noise != null && this.noise(x / 9, z / 9) < o.noise) continue;
      this.put(tpl, x, z, { s, solid: o.solid !== false, shadow: o.shadow !== false, pad: o.pad ?? 1, rot: o.rot?.(x, z) });
      n--;
    }
  }

  /**
   * Rangée le long d'un bord (façades vers la zone jouable).
   * side : 'top' | 'bottom' | 'left' | 'right' ; offset : distance du bord (+ = hors carte)
   */
  row(tpls, side, { step = 5, offset = 2, jitter = 0.6, gapChance = 0.12, rot = null, s = [0.95, 1.05] } = {}){
    const R = this.R, P = this.play;
    const list = Array.isArray(tpls) ? tpls : [tpls];
    const horiz = side === 'top' || side === 'bottom';
    const a0 = horiz ? P.x0 - this.margin + step / 2 : P.z1 - this.margin + step / 2;
    const a1 = horiz ? P.x1 + this.margin : P.z0 + this.margin;
    for(let a = a0; a < a1; a += step * (0.9 + R() * 0.25)){
      if(R() < gapChance) continue;
      const tpl = R.pick(list);
      const sc = s[0] + R() * (s[1] - s[0]);
      const j = (R() - 0.5) * jitter;
      let x, z, ry;
      if(side === 'top'){ x = a; z = P.z0 + offset + j; ry = 0; }
      else if(side === 'bottom'){ x = a; z = P.z1 - offset + j; ry = Math.PI; }
      else if(side === 'left'){ x = P.x0 - offset + j; z = a; ry = Math.PI / 2; }
      else { x = P.x1 + offset + j; z = a; ry = -Math.PI / 2; }
      if(this.blocked(x, z, tpl.radius * sc * 0.6, { lanePad: 0.2 })) continue;
      if(this.overlaps(x, z, tpl.radius * sc * 0.55)) continue;
      this.put(tpl, x, z, { rot: rot != null ? rot : ry + (R() - 0.5) * 0.06, s: sc, pad: 0.6 });
    }
  }

  /** Bosquets : grappes autour de centres pris dans `where`. */
  clusters(tpls, nClusters, each, radius, where, o = {}){
    const R = this.R, O = this.outer;
    const list = Array.isArray(tpls) ? tpls : [tpls];
    let made = 0, tries = 0;
    const target = Math.round(nClusters * (o.fixed ? 1 : this.density));
    while(made < target && tries < nClusters * 60){
      tries++;
      const cx = O.x0 + R() * (O.x1 - O.x0), cz = O.z1 + R() * (O.z0 - O.z1);
      if(!where(cx, cz, this)) continue;
      made++;
      for(let i = 0; i < each; i++){
        const a = R() * Math.PI * 2, d = Math.sqrt(R()) * radius;
        const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
        const tpl = R.pick(list);
        const s = (o.s?.[0] ?? 0.8) + R() * ((o.s?.[1] ?? 1.2) - (o.s?.[0] ?? 0.8));
        if(!where(x, z, this)) continue;
        if(this.blocked(x, z, tpl.radius * s * (o.pad ?? 0.7), o)) continue;
        if(o.solid !== false && this.overlaps(x, z, tpl.radius * s * (o.pad ?? 0.7))) continue;
        this.put(tpl, x, z, { s, pad: o.pad ?? 0.7, solid: o.solid !== false, shadow: o.shadow !== false });
      }
    }
  }

  /**
   * Pose un modèle 3D réel (assets/props/*.glb). Contrairement aux formes
   * procédurales, il est chargé de façon asynchrone : le terrain s'affiche
   * tout de suite, ces pièces viennent l'enrichir dès qu'elles sont prêtes.
   * @param {string} file  nom du fichier dans assets/props/
   * @param {object} o     { height (m), r (empreinte), rot, y, tilt, shadow }
   */
  putModel(file, x, z, o = {}){
    const r = o.r ?? 1;
    const y = o.y ?? (this.groundHeight ? this.groundHeight(x, z) : 0);
    this.models.push({ file, x, y, z, rot: o.rot ?? this.R() * Math.PI * 2, height: o.height ?? 2, tilt: o.tilt || 0 });
    if(o.solid !== false) this._register(x, z, r);
    if((o.shadow ?? 0.5) > 0) this.shadows.push({ x, z, r: r * 1.15, k: o.shadow ?? 0.5 });
  }

  /** Essaie de poser un modèle à un emplacement libre répondant à `where`. */
  scatterModel(file, count, where, o = {}){
    const R = this.R, O = this.outer;
    let n = Math.round(count * (o.fixed ? 1 : this.density)), tries = 0;
    const r = o.r ?? 1;
    while(n > 0 && tries < count * 40){
      tries++;
      const x = O.x0 + R() * (O.x1 - O.x0), z = O.z1 + R() * (O.z0 - O.z1);
      if(!where(x, z, this)) continue;
      if(this.blocked(x, z, r, o)) continue;
      if(this.overlaps(x, z, r)) continue;
      this.putModel(file, x, z, o);
      n--;
    }
  }

  /** Construit tout : thin instances, sous `parent`. */
  commit(parent){
    const used = new Set();
    for(const [tpl, x, y, z, r, s, sy] of this.jobs){ tpl.add(x, y, z, r, s, sy); used.add(tpl); }
    for(const tpl of used) tpl.commit(parent);
    return used;
  }
}

// Prédicats de zones courants
export const Z = {
  top: (depth = 99) => (x, z, c) => z > c.play.z0 - 1.2 && z < c.play.z0 + depth,
  bottom: (depth = 99) => (x, z, c) => z < c.play.z1 + 1.2 && z > c.play.z1 - depth,
  sides: (x, z, c) => x < c.play.x0 + 1.5 || x > c.play.x1 - 1.5,
  border: (x, z, c) => c.edgeDist(x, z) < 1.5,
  field: (x, z, c) => c.edgeDist(x, z) > 2.5,
  fieldTop: (x, z, c) => c.edgeDist(x, z) > 1.5 && z > (c.play.z0 + c.play.z1) / 2,
  nearLane: (min, max) => (x, z, c) => { const d = c.laneDist(x, z) - c.laneHalf; return d > min && d < max; },
  anywhere: () => true,
  and: (...fs) => (x, z, c) => fs.every(f => f(x, z, c)),
  or: (...fs) => (x, z, c) => fs.some(f => f(x, z, c)),
  not: (f) => (x, z, c) => !f(x, z, c),
};
