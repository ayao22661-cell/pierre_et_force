// ============================================================
// NATURE — arbres, palmiers, baobabs, sapins, buissons, rochers,
// herbes. Chaque fonction renvoie un Template (voir geo.js) : une
// forme construite une fois, puis posée des dizaines de fois par
// instanciation GPU.
//
// Principe (celui de Dota / LoL) : un volume simple (tronc en tube,
// cœur de feuillage) habillé de cartes à transparence peintes
// (textures.js) orientées vers l'extérieur. Les normales des cartes
// suivent la sphère du houppier : la lumière glisse sur le feuillage
// comme sur un vrai volume.
// ============================================================

import { rng, valueNoise } from './noise.js';
import * as T from './textures.js';
import { Geo, Template, crossCards, texMat, colorMat, c3, aoColor } from './geo.js';

const B = () => window.BABYLON;
const V3 = (x, y, z) => new (B().Vector3)(x, y, z);

// ── Feuillage ──────────────────────────────────────────────────

/**
 * Touffe de feuillage : cœur opaque + cartes orientées vers l'extérieur.
 * Ajoute dans `cards` et `core` (deux Geo), centre (cx,cy,cz), rayon r.
 */
function foliageClump(cards, core, r, cx, cy, cz, R, o = {}){
  const BB = B();
  // cœur : sphère aplatie, un peu plus petite (bouche les trous)
  const s = BB.MeshBuilder.CreateSphere('c', { diameter: r * 1.35, segments: 6 }, null);
  s.scaling.y = o.flat ?? 0.8;
  s.position.set(cx, cy, cz);
  core.add(s, (x, y, z, nx, ny) => {
    const v = 0.35 + 0.45 * Math.max(0, ny) + (y - cy) / r * 0.15;
    return [v, v, v];
  }, [2, 2]);
  // cartes
  const n = o.cards ?? Math.round(16 + r * 14);
  for(let i = 0; i < n; i++){
    // direction biaisée vers le haut (c'est ce que voit la caméra)
    let dx = R() * 2 - 1, dy = R() * 1.6 - 0.45, dz = R() * 2 - 1;
    const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
    const px = cx + dx * r * 0.7, py = cy + dy * r * 0.7 * (o.flat ?? 0.8), pz = cz + dz * r * 0.7;
    const size = r * (1.15 + R() * 0.6);
    // repère de la carte : normale = direction, axe « haut » au hasard autour
    const N = V3(dx, dy, dz);
    let up = V3(R() - 0.5, 1, R() - 0.5).normalize();
    let right = BB.Vector3.Cross(up, N);
    if(right.lengthSquared() < 1e-4) right = V3(1, 0, 0);
    right.normalize(); up = BB.Vector3.Cross(N, right).normalize();
    const hs = size / 2;
    const p = (a, b) => [px + right.x * a + up.x * b, py + right.y * a + up.y * b, pz + right.z * a + up.z * b];
    const shade = 0.55 + 0.5 * Math.max(0, dy) + (R() - 0.5) * 0.2;
    const top = [shade * 1.05, shade * 1.05, shade], bot = [shade * 0.72, shade * 0.72, shade * 0.7];
    cards.quad(p(-hs, -hs), p(hs, -hs), p(hs, hs), p(-hs, hs), [dx, Math.max(dy, 0.25), dz], top, bot);
  }
}

function foliageMats(scene, key, pal, seed){
  const cards = texMat(scene, 'leafCard_' + key, () => T.cardLeaves(seed, pal), { alpha: 'test', cutoff: 0.42 });
  const core = texMat(scene, 'leafCore_' + key, () => {
    const cv = T.canvas(256); const ctx = cv.getContext('2d');
    ctx.fillStyle = (pal.leaves || ['#27461a'])[0]; ctx.fillRect(0, 0, 256, 256);
    ctx.drawImage(T.cardLeaves(seed + 1, pal), 0, 0); ctx.drawImage(T.cardLeaves(seed + 2, pal), 64, 64, 192, 192);
    return cv;
  });
  return { cards, core };
}

function barkMat(scene, key, pal, seed){
  return texMat(scene, 'bark_' + key, () => T.texBark(seed, pal));
}

/** Tronc : tube courbe avec empattement de racines. */
function trunkTube(geo, { h, r0, r1 = r0 * 0.5, bend = 0.25, dir = 0, flare = 1.8, R }){
  const BB = B();
  const path = [];
  for(let i = 0; i <= 10; i++){
    const t = i / 10;
    path.push(V3(Math.cos(dir) * bend * t * t * h * 0.3, t * h, Math.sin(dir) * bend * t * t * h * 0.3));
  }
  const tube = BB.MeshBuilder.CreateTube('t', {
    path, tessellation: 10, cap: BB.Mesh.CAP_END,
    radiusFunction: (i) => { const t = i / 10; return r1 + (r0 - r1) * (1 - t) + r0 * (flare - 1) * Math.pow(Math.max(0, 1 - t * 5), 2); },
  }, null);
  geo.add(tube, aoColor(h, 0.4, 1.0, 0.1), [2, 1.5 * h]);
  return path[path.length - 1];
}

function branch(geo, from, to, r0, r1, h){
  const BB = B();
  const mid = BB.Vector3.Lerp(from, to, 0.5).add(V3(0, 0.12 * BB.Vector3.Distance(from, to), 0));
  const path = [];
  for(let i = 0; i <= 6; i++){
    const t = i / 6;
    const a = BB.Vector3.Lerp(from, mid, t), b = BB.Vector3.Lerp(mid, to, t);
    path.push(BB.Vector3.Lerp(a, b, t));
  }
  const tube = BB.MeshBuilder.CreateTube('b', { path, tessellation: 7, radiusFunction: (i) => r0 + (r1 - r0) * i / 6, cap: BB.Mesh.CAP_END }, null);
  geo.add(tube, aoColor(h, 0.45, 1.0, 0.1), [1, 2]);
}

/**
 * Feuillu (manguier, fromager, flamboyant…).
 * o : { h, crown, clumps, leaves (palette cardLeaves), bark (palette texBark), key, seed }
 */
export function broadleafTree(scene, o = {}){
  const R = rng(o.seed || 1);
  const h = o.h ?? 2.2, crown = o.crown ?? 1.5;
  const trunk = new Geo(), cards = new Geo(), core = new Geo();
  const top = trunkTube(trunk, { h, r0: o.r0 ?? 0.2, bend: R() * 0.5, dir: R() * 6.28, R });
  const nClumps = o.clumps ?? 5;
  const centers = [];
  // touffe centrale haute + couronne de touffes autour
  centers.push([top.x, h + crown * 0.55, top.z, crown * 0.85]);
  for(let i = 0; i < nClumps - 1; i++){
    const a = (i / (nClumps - 1)) * Math.PI * 2 + R() * 0.6;
    const d = crown * (0.65 + R() * 0.3);
    centers.push([top.x + Math.cos(a) * d, h + crown * (0.05 + R() * 0.35), top.z + Math.sin(a) * d, crown * (0.55 + R() * 0.25)]);
  }
  for(const [x, y, z, r] of centers){
    branch(trunk, V3(top.x * 0.6, h * 0.78, top.z * 0.6), V3(x * 0.8, y - r * 0.35, z * 0.8), (o.r0 ?? 0.2) * 0.55, 0.035, h + crown);
    foliageClump(cards, core, r, x, y, z, R, { flat: o.flat ?? 0.78 });
  }
  const mats = foliageMats(scene, o.key || 'tree', o.leaves || {}, o.seed || 1);
  const meshes = [
    trunk.build('trunk', scene, barkMat(scene, o.key || 'tree', o.bark || {}, (o.seed || 1) + 3)),
    core.build('core', scene, mats.core),
    cards.build('leaves', scene, mats.cards),
  ];
  return new Template(meshes, { radius: crown * 1.35, height: h + crown * 1.8, shadow: 0.62 });
}

/** Buisson : touffes basses sans tronc. */
export function bush(scene, o = {}){
  const R = rng(o.seed || 5);
  const r = o.r ?? 0.6;
  const cards = new Geo(), core = new Geo();
  const n = o.clumps ?? 3;
  for(let i = 0; i < n; i++){
    const a = i / n * Math.PI * 2 + R();
    const d = i === 0 ? 0 : r * 0.55;
    foliageClump(cards, core, r * (i === 0 ? 1 : 0.75), Math.cos(a) * d, r * 0.55, Math.sin(a) * d, R, { flat: 0.72, cards: Math.round(9 + r * 8) });
  }
  const mats = foliageMats(scene, o.key || 'bush', o.leaves || {}, o.seed || 5);
  return new Template([core.build('bushCore', scene, mats.core), cards.build('bushCards', scene, mats.cards)], { radius: r * 1.3, height: r * 1.3, shadow: 0.5 });
}

/** Cocotier : stipe courbé, palmes retombantes, noix de coco. */
export function palmTree(scene, o = {}){
  const BB = B();
  const R = rng(o.seed || 9);
  const h = o.h ?? 3.4, lean = o.lean ?? 0.5, dir = R() * Math.PI * 2;
  const trunk = new Geo(), fronds = new Geo(), nuts = new Geo();
  const path = [];
  for(let i = 0; i <= 12; i++){
    const t = i / 12;
    const off = Math.sin(t * Math.PI * 0.5) * lean * h * 0.35;
    path.push(V3(Math.cos(dir) * off, t * h, Math.sin(dir) * off));
  }
  const tube = BB.MeshBuilder.CreateTube('palm', { path, tessellation: 9, radiusFunction: (i) => 0.13 - i * 0.004 + (i === 0 ? 0.08 : i === 1 ? 0.03 : 0), cap: BB.Mesh.CAP_END }, null);
  trunk.add(tube, aoColor(h, 0.5, 1.0, 0.05), [1, h * 2.2]);
  const top = path[path.length - 1];
  const n = o.fronds ?? 9;
  for(let f = 0; f < n; f++){
    const a = (f / n) * Math.PI * 2 + R() * 0.4;
    const len = 2.0 + R() * 0.6, width = 0.42;
    const rise = f % 3 === 0 ? 0.55 : 0.25 + R() * 0.2; // quelques palmes jeunes, plus dressées
    const seg = 8;
    const pts = [];
    for(let s = 0; s <= seg; s++){
      const t = s / seg;
      const d = t * len;
      const y = top.y + rise * d - (d * d) * 0.42;
      pts.push([top.x + Math.cos(a) * d, y, top.z + Math.sin(a) * d]);
    }
    const px = -Math.sin(a), pz = Math.cos(a);
    for(let s = 0; s < seg; s++){
      const t0 = s / seg, t1 = (s + 1) / seg;
      const w0 = width * Math.sin(Math.PI * (0.1 + t0 * 0.85)) + 0.05, w1 = width * Math.sin(Math.PI * (0.1 + t1 * 0.85)) + 0.05;
      const A = pts[s], Bp = pts[s + 1];
      // les folioles retombent : bords plus bas que la nervure
      const droop0 = w0 * 0.6, droop1 = w1 * 0.6;
      const sh = 0.8 + t0 * 0.3;
      fronds.quad(
        [A[0] - px * w0, A[1] - droop0, A[2] - pz * w0], [A[0] + px * w0, A[1] - droop0, A[2] + pz * w0],
        [Bp[0] + px * w1, Bp[1] - droop1, Bp[2] + pz * w1], [Bp[0] - px * w1, Bp[1] - droop1, Bp[2] - pz * w1],
        [0, 1, 0], [sh, sh, sh * 0.95], [sh * 0.85, sh * 0.85, sh * 0.8], [0, t0, 1, t1]
      );
    }
  }
  for(let i = 0; i < 4; i++){
    const s = BB.MeshBuilder.CreateSphere('nut', { diameter: 0.2, segments: 5 }, null);
    const a = i / 4 * 6.28;
    s.position.set(top.x + Math.cos(a) * 0.12, top.y - 0.12, top.z + Math.sin(a) * 0.12);
    nuts.add(s, () => [0.9, 0.9, 0.9]);
  }
  const frondMat = texMat(scene, 'palmFrond', () => T.cardPalmFrond(o.seed || 9, o.leaves || {}), { alpha: 'test', cutoff: 0.35 });
  const trunkMat = texMat(scene, 'palmTrunk', () => T.texPalmTrunk(21));
  const nutMat = colorMat(scene, 'coconut', '#5a4a1e', { spec: 0.15 });
  return new Template([trunk.build('palmTrunk', scene, trunkMat), fronds.build('palmFronds', scene, frondMat), nuts.build('nuts', scene, nutMat)],
    { radius: 1.7, height: h + 0.6, shadow: 0.45 });
}

/** Conifère (enneigé ou non) : étages de branches en étoile. */
export function pineTree(scene, o = {}){
  const BB = B();
  const R = rng(o.seed || 13);
  const h = o.h ?? 3.2;
  const trunk = new Geo(), tiers = new Geo();
  trunkTube(trunk, { h: h * 0.95, r0: 0.11, r1: 0.03, bend: 0.05, dir: 0, flare: 1.4, R });
  const layers = o.layers ?? 6;
  for(let l = 0; l < layers; l++){
    const t = l / (layers - 1);
    const y = h * (0.22 + t * 0.72);
    const r = (1 - t * 0.82) * (o.r ?? 1.15) * (0.9 + R() * 0.2);
    const disc = BB.MeshBuilder.CreateDisc('tier', { radius: r, tessellation: 14, sideOrientation: BB.Mesh.DOUBLESIDE }, null);
    disc.rotation.x = -Math.PI / 2; disc.rotation.y = R() * 6.28;
    disc.bakeCurrentTransformIntoVertices();
    // étage en parapluie : le bord retombe
    const p = disc.getVerticesData('position');
    for(let i = 0; i < p.length; i += 3){ const d = Math.hypot(p[i], p[i + 2]); p[i + 1] = -d * 0.45 + (Math.sin(Math.atan2(p[i + 2], p[i]) * 7) * 0.04); }
    disc.updateVerticesData('position', p);
    disc.position.y = y;
    const sh = 0.75 + t * 0.4;
    tiers.add(disc, (x, yy, z) => { const d = Math.hypot(x, z) / r; const v = sh * (0.8 + d * 0.3); return [v, v, v]; });
  }
  const mat = texMat(scene, 'pine_' + (o.snow ? 's' : 'g'), () => T.cardPine(o.seed || 13, { snow: o.snow }), { alpha: 'test', cutoff: 0.35 });
  tiers.normalsUp();
  return new Template([trunk.build('pineTrunk', scene, barkMat(scene, 'pine', { ramp: [[0, '#2a1d16'], [1, '#5a4030']] }, 31)), tiers.build('pineTiers', scene, mat)],
    { radius: (o.r ?? 1.15) * 1.1, height: h, shadow: 0.55 });
}

/** Baobab : tronc-bouteille, branches noueuses, feuillage clairsemé. */
export function baobab(scene, o = {}){
  const BB = B();
  const R = rng(o.seed || 17);
  const h = o.h ?? 2.6;
  const trunk = new Geo(), cards = new Geo(), core = new Geo();
  const prof = [];
  const rr = [0.85, 0.8, 0.72, 0.66, 0.6, 0.52, 0.42, 0.3];
  rr.forEach((r, i) => prof.push(V3(r * (o.fat ?? 0.9), i / (rr.length - 1) * h, 0)));
  const lathe = BB.MeshBuilder.CreateLathe('baobab', { shape: prof, tessellation: 16, cap: BB.Mesh.CAP_END }, null);
  const nz = valueNoise(o.seed || 17);
  const p = lathe.getVerticesData('position');
  for(let i = 0; i < p.length; i += 3){
    const a = Math.atan2(p[i + 2], p[i]);
    const k = 1 + (nz(a * 3, p[i + 1] * 2) - 0.5) * 0.35;
    p[i] *= k; p[i + 2] *= k;
  }
  lathe.updateVerticesData('position', p);
  lathe.createNormals?.(true);
  trunk.add(lathe, aoColor(h, 0.45, 1.0, 0.08), [3, 1.5], true);
  for(let b = 0; b < 6; b++){
    const a = b / 6 * Math.PI * 2 + R() * 0.5;
    const from = V3(Math.cos(a) * 0.15, h * 0.97, Math.sin(a) * 0.15);
    const to = V3(Math.cos(a) * (0.9 + R() * 0.6), h + 0.5 + R() * 0.7, Math.sin(a) * (0.9 + R() * 0.6));
    branch(trunk, from, to, 0.16, 0.04, h + 1.2);
    if(R() < (o.leafy ?? 0.7)) foliageClump(cards, core, 0.45 + R() * 0.2, to.x, to.y + 0.1, to.z, R, { flat: 0.6, cards: 7 });
  }
  const mats = foliageMats(scene, 'baobab', o.leaves || { leaves: ['#3d4f1f', '#56672a', '#6f7f37', '#8c9446'] }, 44);
  return new Template([
    trunk.build('baobabTrunk', scene, barkMat(scene, 'baobab', { ramp: [[0, '#5d4c44'], [0.5, '#8a766b'], [1, '#a8958a']] }, 45)),
    core.build('baobabCore', scene, mats.core), cards.build('baobabLeaves', scene, mats.cards),
  ], { radius: 1.6, height: h + 1.4, shadow: 0.55 });
}

/** Acacia : tronc fourchu, houppier plat en ombrelle (Sahel). */
export function acacia(scene, o = {}){
  const R = rng(o.seed || 19);
  const h = o.h ?? 2.0;
  const trunk = new Geo(), cards = new Geo(), core = new Geo();
  const top = trunkTube(trunk, { h: h * 0.7, r0: 0.1, r1: 0.06, bend: 0.8, dir: R() * 6.28, flare: 1.3, R });
  for(let i = 0; i < 5; i++){
    const a = i / 5 * Math.PI * 2 + R();
    const d = 0.5 + R() * 0.8;
    const x = top.x + Math.cos(a) * d, z = top.z + Math.sin(a) * d, y = h + R() * 0.15;
    branch(trunk, V3(top.x, h * 0.68, top.z), V3(x, y - 0.1, z), 0.06, 0.02, h + 0.3);
    foliageClump(cards, core, 0.7 + R() * 0.25, x, y, z, R, { flat: 0.32, cards: 12 });
  }
  const mats = foliageMats(scene, 'acacia', o.leaves || { leaves: ['#4a5424', '#5f6a2c', '#7a8238', '#98994a'], len: [7, 12] }, 51);
  return new Template([
    trunk.build('acaciaTrunk', scene, barkMat(scene, 'acacia', { ramp: [[0, '#2e2218'], [1, '#6a5038']] }, 52)),
    core.build('acaciaCore', scene, mats.core), cards.build('acaciaLeaves', scene, mats.cards),
  ], { radius: 1.6, height: h + 0.5, shadow: 0.5 });
}

/** Arbre mort : branches nues en fourche (Born Land, Vide, volcan). */
export function deadTree(scene, o = {}){
  const R = rng(o.seed || 23);
  const h = o.h ?? 2.4;
  const g = new Geo();
  const top = trunkTube(g, { h, r0: 0.14, r1: 0.05, bend: 0.6, dir: R() * 6.28, flare: 1.6, R });
  const grow = (from, dir, len, r, depth) => {
    const to = from.add(dir.scale(len));
    branch(g, from, to, r, r * 0.55, h + 1);
    if(depth <= 0) return;
    for(let k = 0; k < 2; k++){
      const nd = dir.add(V3((R() - 0.5) * 1.2, R() * 0.4, (R() - 0.5) * 1.2)).normalize();
      grow(to, nd, len * 0.68, r * 0.55, depth - 1);
    }
  };
  for(let i = 0; i < 3; i++){
    const a = i / 3 * 6.28 + R();
    grow(V3(top.x * 0.8, h * (0.7 + i * 0.08), top.z * 0.8), V3(Math.cos(a), 0.9, Math.sin(a)).normalize(), 0.8, 0.07, 2);
  }
  return new Template([g.build('deadTree', scene, barkMat(scene, 'dead' + (o.key || ''), o.bark || { ramp: [[0, '#1c1814'], [0.5, '#3a322a'], [1, '#5c5146']] }, 61))],
    { radius: 1.0, height: h + 1.4, shadow: 0.35 });
}

/**
 * Rocher : icosphère déformée par le bruit, base aplatie, dessus teinté
 * (mousse, neige, sable) selon l'orientation des faces.
 * o : { r, tile (palette tileRock), top: '#hex', topK, flat, key }
 */
export function rock(scene, o = {}){
  const BB = B();
  const seed = o.seed || 29;
  const r = o.r ?? 0.6;
  const n1 = valueNoise(seed), n2 = valueNoise(seed + 5);
  const s = BB.MeshBuilder.CreateIcoSphere('rock', { radius: 1, subdivisions: 3, flat: false }, null);
  const p = s.getVerticesData('position');
  for(let i = 0; i < p.length; i += 3){
    const x = p[i], y = p[i + 1], z = p[i + 2];
    let k = 1 + (n1(x * 1.6 + 3, z * 1.6 + y) - 0.5) * 0.55 + (n2(y * 3.5 + 7, x * 3.5 - z) - 0.5) * 0.22;
    let yy = y * k * (o.tall ?? 0.75);
    if(yy < -0.1) yy = -0.1 + (yy + 0.1) * 0.25; // base aplatie, posée au sol
    p[i] = x * k * r * (o.sx ?? 1); p[i + 1] = (yy + 0.12) * r; p[i + 2] = z * k * r * (o.sz ?? 0.9);
  }
  s.updateVerticesData('position', p);
  s.convertToFlatShadedMesh?.(); // facettes : lecture « pierre taillée par le temps »
  const top = c3(o.top || '#6a7a3a');
  const topK = o.topK ?? 0.7;
  const g = new Geo().add(s, (x, y, z, nx, ny) => {
    const t = Math.max(0, Math.min(1, y / (r * 1.1)));
    const base = 0.5 + 0.55 * t;
    const m = Math.max(0, (ny - 0.55) / 0.45) * topK;
    return [base * (1 - m) + top[0] * m * 1.6, base * (1 - m) + top[1] * m * 1.6, base * (1 - m) + top[2] * m * 1.6];
  }, [3.2, 3.2]);
  const mat = texMat(scene, 'rock_' + (o.key || 'std'), () => T.tileRock(seed, { cells: 26, ...(o.tile || {}) }), { spec: o.spec ?? 0.08 });
  return new Template([g.build('rock', scene, mat)], { radius: r * 1.1, height: r, shadow: 0.5 });
}

/** Touffes d'herbe / fougères / fleurs en cartes croisées. */
export function groundCover(scene, o = {}){
  const R = rng(o.seed || 31);
  const g = new Geo();
  const n = o.tufts ?? 3;
  for(let i = 0; i < n; i++){
    const a = R() * 6.28, d = i ? R() * (o.spread ?? 0.35) : 0;
    const h = (o.h ?? 0.45) * (0.75 + R() * 0.5);
    crossCards(g, { w: h * (o.aspect ?? 1.1), h, planes: o.planes ?? 3, x: Math.cos(a) * d, z: Math.sin(a) * d, rot: R() * 3, tilt: 0.12,
      cTop: [1, 1, 1], cBot: [0.5, 0.5, 0.5] });
  }
  const kind = o.kind || 'grass';
  const mat = texMat(scene, 'cover_' + (o.key || kind), () => kind === 'fern' ? T.cardFern(o.seed || 31, o.pal || {}) : T.cardGrass(o.seed || 31, o.pal || {}), { alpha: 'test', cutoff: 0.4 });
  return new Template([g.build('cover', scene, mat)], { radius: 0.3, height: o.h ?? 0.45, shadow: 0 });
}

/** Algues (fonds marins). */
export function kelp(scene, o = {}){
  const R = rng(o.seed || 37);
  const g = new Geo();
  for(let i = 0; i < 4; i++){
    const h = (o.h ?? 2.2) * (0.6 + R() * 0.5);
    crossCards(g, { w: h * 0.14, h, planes: 2, x: (R() - 0.5) * 0.5, z: (R() - 0.5) * 0.5, rot: R() * 3, tilt: 0.1, cBot: [0.4, 0.45, 0.45] });
  }
  const mat = texMat(scene, 'kelp', () => T.cardKelp(o.seed || 37), { alpha: 'test', cutoff: 0.4 });
  return new Template([g.build('kelp', scene, mat)], { radius: 0.4, height: o.h ?? 2.2, shadow: 0.2 });
}

/** Grappe de cristaux (Royaume, Vide, grottes, glace). */
export function crystals(scene, o = {}){
  const BB = B();
  const R = rng(o.seed || 41);
  const g = new Geo();
  const n = o.n ?? 7;
  for(let i = 0; i < n; i++){
    const h = (o.h ?? 1.2) * (i === 0 ? 1 : 0.35 + R() * 0.55);
    const r = h * (0.14 + R() * 0.05);
    const prism = BB.MeshBuilder.CreateCylinder('cr', { height: h, diameter: r * 2, tessellation: 6 }, null);
    const tip = BB.MeshBuilder.CreateCylinder('tip', { height: r * 2.2, diameterTop: 0, diameterBottom: r * 2, tessellation: 6 }, null);
    tip.position.y = h / 2 + r * 1.1;
    const merged = BB.Mesh.MergeMeshes([prism, tip], true);
    merged.position.y = h / 2;
    const a = R() * 6.28, lean = i === 0 ? 0.08 : 0.3 + R() * 0.45;
    merged.rotation.set(Math.cos(a) * lean, R() * 3, Math.sin(a) * lean);
    const d = i === 0 ? 0 : 0.12 + R() * 0.3;
    merged.position.x = Math.cos(a) * d; merged.position.z = Math.sin(a) * d;
    g.add(merged, (x, y) => { const v = 0.55 + Math.min(1, y / (o.h ?? 1.2)) * 0.6; return [v, v, v]; });
  }
  const m = colorMat(scene, 'crystal_' + (o.key || o.color), o.color || '#7fd8ff', { spec: 0.9, specPower: 64, emissive: o.glow || '#1a4a66' });
  const mesh = g.build('crystals', scene, m);
  mesh.convertToFlatShadedMesh?.();
  return new Template([mesh], { radius: 0.6, height: o.h ?? 1.2, shadow: 0.3 });
}

/** Mesa / falaise de grès stratifié (Bandiagara) ou de glace. */
export function cliff(scene, o = {}){
  const BB = B();
  const seed = o.seed || 43;
  const h = o.h ?? 3, r = o.r ?? 2;
  const nz = valueNoise(seed);
  const cyl = BB.MeshBuilder.CreateCylinder('cliff', { height: h, diameterTop: r * 1.6, diameterBottom: r * 2, tessellation: 14, subdivisions: 6 }, null);
  const p = cyl.getVerticesData('position');
  for(let i = 0; i < p.length; i += 3){
    const a = Math.atan2(p[i + 2], p[i]);
    const y = p[i + 1];
    const k = 1 + (nz(a * 2.2 + 5, y * 0.9) - 0.5) * 0.5 + (Math.floor((y + h / 2) * 1.6) % 2) * 0.04; // strates en gradins
    p[i] *= k; p[i + 2] *= k * (o.sz ?? 1);
    if(y > h / 2 - 0.01) p[i + 1] += (nz(p[i] * 2, p[i + 2] * 2) - 0.5) * 0.3;
  }
  cyl.updateVerticesData('position', p);
  cyl.position.y = h / 2;
  cyl.convertToFlatShadedMesh?.();
  const top = c3(o.top || '#b08050');
  const g = new Geo().add(cyl, (x, y, z, nx, ny) => {
    const base = 0.5 + 0.55 * Math.min(1, y / h);
    return ny > 0.6 ? [top[0] * 1.4, top[1] * 1.4, top[2] * 1.4] : [base, base, base];
  }, [3, 1]);
  const mat = texMat(scene, 'strata_' + (o.key || 'std'), () => texStrata(seed, o.pal), { spec: 0.05 });
  return new Template([g.build('cliff', scene, mat)], { radius: r * 1.1, height: h, shadow: 0.65 });
}

/** Strates horizontales de grès / roche (texture de falaise). */
function texStrata(seed, pal){
  pal = pal || {};
  const bands = (pal.bands || ['#8a4f2c', '#a8683a', '#c4864e', '#9a5a34', '#b87a48', '#7a4428']).map(h => h);
  const R = rng(seed);
  const cv = T.canvas(256); const ctx = cv.getContext('2d');
  let y = 0;
  while(y < 256){
    const hh = 6 + R() * 22;
    ctx.fillStyle = R.pick(bands); ctx.fillRect(0, y, 256, hh + 1);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, y + hh - 2, 256, 2);
    ctx.fillStyle = 'rgba(255,240,220,0.12)'; ctx.fillRect(0, y, 256, 2);
    y += hh;
  }
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(T.tileRock(seed + 1, { ramp: [[0, '#8a8a8a'], [0.5, '#c8c8c8'], [1, '#ffffff']], cells: 10 }), 0, 0);
  return cv;
}
