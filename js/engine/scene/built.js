// ============================================================
// CONSTRUCTIONS — l'Abidjan des quartiers (maisons enduites, toits
// de tôle, murs d'enceinte, portails peints, cuves noires sur les
// toits, maquis sous parasols, étals du marché), le Mali (banco de
// Djenné, greniers dogon, canaris) et la technologie de Sgrün.
//
// Même logique que nature.js : chaque fonction renvoie un Template
// instanciable, construit en quelques maillages (un par matériau).
// ============================================================

import { rng, fbm, hexRgb, mixRgb, rgbCss } from './noise.js';
import * as T from './textures.js';
import { Geo, Template, texMat, colorMat, c3, aoColor } from './geo.js';

const B = () => window.BABYLON;

function box(w, h, d, x = 0, y = 0, z = 0, ry = 0){
  const m = B().MeshBuilder.CreateBox('b', { width: w, height: h, depth: d }, null);
  m.position.set(x, y + h / 2, z); m.rotation.y = ry;
  return m;
}
function cyl(dTop, dBot, h, tess = 12, x = 0, y = 0, z = 0){
  const m = B().MeshBuilder.CreateCylinder('c', { diameterTop: dTop, diameterBottom: dBot, height: h, tessellation: tess }, null);
  m.position.set(x, y + h / 2, z);
  return m;
}

// ── Textures propres aux constructions ─────────────────────────

/** Fenêtre « naco » à lames de verre + grille de fer forgé, typique d'Abidjan. */
function texWindow(frameHex = '#e9e4d8'){
  const W = 128, H = 128;
  const c = T.canvas(W, H); const ctx = c.getContext('2d');
  ctx.fillStyle = frameHex; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1e2a33'; ctx.fillRect(10, 10, W - 20, H - 20);
  for(let y = 14; y < H - 14; y += 11){
    const g = ctx.createLinearGradient(0, y, 0, y + 9);
    g.addColorStop(0, '#6f8a99'); g.addColorStop(1, '#2d3d48');
    ctx.fillStyle = g; ctx.fillRect(13, y, W - 26, 8);
  }
  ctx.strokeStyle = '#2a2622'; ctx.lineWidth = 3;
  for(let x = 26; x < W - 10; x += 19){ ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, H - 10); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(10, H / 2); ctx.lineTo(W - 10, H / 2); ctx.stroke();
  ctx.lineWidth = 2;
  for(let x = 26; x < W - 10; x += 38){ ctx.beginPath(); ctx.arc(x + 9, H / 2, 8, 0, Math.PI * 2); ctx.stroke(); }
  return c;
}

/** Portail métallique peint, à barreaux et tôle pleine en bas. */
function texGate(hex = '#2f6b4f'){
  const W = 256, H = 128; const col = hexRgb(hex);
  const n = fbm(5, { octaves: 3, period: 4 });
  const c = T.pix(W, H, (u, v) => {
    const bar = (u * 24) % 1 < 0.28;
    let k = v > 0.55 ? 1 : bar ? 1 : 0;
    let cc = mixRgb([col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], col, n(u * 4, v * 4));
    if(v > 0.55 && ((u * 4) % 1 < 0.03)) cc = mixRgb(cc, [20, 20, 20], 0.6);
    const rust = n(u * 8 + 3, v * 8) > 0.68 ? 0.6 : 0;
    cc = mixRgb(cc, [120, 60, 28], rust);
    return k ? cc : [0, 0, 0, 0];
  });
  return c;
}

/** Porte en bois peinte avec cadre. */
function texDoor(hex = '#6d3b22'){
  const col = hexRgb(hex);
  const n = fbm(8, { octaves: 3, period: 4 });
  return T.pix(64, 128, (u, v) => {
    const frame = u < 0.08 || u > 0.92 || v < 0.05;
    const panel = (Math.abs(u - 0.5) > 0.36) || ((v * 3) % 1 < 0.06);
    let c = mixRgb([col[0] * 0.75, col[1] * 0.75, col[2] * 0.75], col, n(u * 3, v * 12));
    if(panel) c = mixRgb(c, [0, 0, 0], 0.25);
    if(frame) c = [205, 198, 185];
    if(Math.hypot(u - 0.8, v - 0.52) < 0.04) c = [200, 170, 60];
    return c;
  });
}

/** Chaume (toits coniques des greniers dogon). */
function texThatch(seed = 3){
  const S = 256;
  const c = T.canvas(S); const ctx = c.getContext('2d'); const r = rng(seed);
  ctx.fillStyle = '#7a6436'; ctx.fillRect(0, 0, S, S);
  const cols = ['#a88d52', '#c2a86a', '#8f7640', '#d6be82', '#6a5530'];
  for(let i = 0; i < 2600; i++){
    const x = r() * S, y = r() * S, l = 10 + r() * 22;
    ctx.strokeStyle = r.pick(cols); ctx.globalAlpha = 0.7; ctx.lineWidth = 1 + r();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 3, y + l); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for(let y = 0; y < S; y += 42){ ctx.fillStyle = 'rgba(40,28,12,0.35)'; ctx.fillRect(0, y, S, 4); }
  return c;
}

/** Panneau de Sgrün : métal noir et lignes d'énergie bleues (émissif). */
function texSgrunPanel(hex = '#5fd4ff'){
  const W = 128, H = 256; const col = hexRgb(hex);
  const n = fbm(12, { octaves: 3, period: 4 });
  return T.pix(W, H, (u, v) => {
    let c = mixRgb([14, 16, 22], [40, 44, 54], n(u * 4, v * 8));
    const line = Math.abs(u - 0.5) < 0.025 || ((v * 6) % 1 < 0.018 && Math.abs(u - 0.5) < 0.3);
    if(line) c = col;
    if(u < 0.03 || u > 0.97) c = [70, 76, 90];
    return c;
  });
}

// ── Abidjan ────────────────────────────────────────────────────

const PASTELS = ['#efe0a6', '#e9c9a8', '#cfe3d2', '#e8e2d4', '#bcd6e6', '#f0cfc4', '#e7d7b4'];

/**
 * Maison de quartier : murs enduits, soubassement, toit de tôle en
 * débord, fenêtres naco, porte, cuve à eau noire, climatiseur.
 */
export function house(scene, o = {}){
  const R = rng(o.seed || 101);
  const w = o.w ?? 4.2 + R() * 1.6, d = o.d ?? 3.2 + R() * 0.8, h = o.h ?? 2.5 + R() * 0.3;
  const color = o.color || R.pick(PASTELS);
  const walls = new Geo(), plinth = new Geo(), roof = new Geo(), wins = new Geo(), door = new Geo(), misc = new Geo();
  walls.add(box(w, h, d), aoColor(h, 0.86, 1.06, 0.04), [w / 3, h / 3]);
  plinth.add(box(w + 0.08, 0.45, d + 0.08), null, [w / 2, 0.3]);
  // toit : tôle légèrement inclinée, débord de 35 cm
  const rf = box(w + 0.7, 0.06, d + 0.7, 0, h + 0.05, 0);
  rf.rotation.x = 0.08;
  roof.add(rf, (x, y, z, nx, ny) => ny > 0 ? [1, 1, 1] : [0.35, 0.35, 0.35], [w / 2, d / 2]);
  // fenêtres sur les 4 faces
  const addWin = (x, z, ry) => { const m = box(0.9, 1.0, 0.06, x, 1.0, z, ry); wins.add(m, null, [1, 1]); };
  const nW = Math.max(1, Math.floor(w / 1.8));
  for(let i = 0; i < nW; i++){
    const x = -w / 2 + (i + 0.5) * (w / nW);
    addWin(x, d / 2 + 0.01, 0);
    if(i !== Math.floor(nW / 2)) addWin(x, -d / 2 - 0.01, 0);
  }
  addWin(w / 2 + 0.01, 0, Math.PI / 2); addWin(-w / 2 - 0.01, 0, Math.PI / 2);
  door.add(box(0.95, 2.0, 0.08, 0, 0.1, -d / 2 - 0.02), null, [1, 1]);
  // perron
  plinth.add(box(1.5, 0.15, 0.6, 0, 0, -d / 2 - 0.35), null, [1, 0.3]);
  // cuve à eau (polytank noir) sur le toit — silhouette très abidjanaise
  if(R() < 0.8){
    const tx = (R() - 0.5) * w * 0.5, tz = (R() - 0.5) * d * 0.4;
    misc.add(cyl(0.9, 0.95, 1.0, 16, tx, h + 0.35, tz), (x, y, z, nx, ny) => { const v = 0.18 + ny * 0.15; return [v, v, v * 1.05]; });
    misc.add(box(0.8, 0.3, 0.8, tx, h + 0.1, tz), () => [0.4, 0.4, 0.42]);
  }
  // climatiseur sur une façade latérale
  if(R() < 0.6) misc.add(box(0.12, 0.45, 0.7, w / 2 + 0.08, 1.8, -d * 0.2), () => [0.85, 0.85, 0.82]);
  const seed = o.seed || 101;
  return new Template([
    walls.build('houseWalls', scene, texMat(scene, 'plaster_' + color, () => T.texPlaster(seed, color))),
    plinth.build('housePlinth', scene, texMat(scene, 'concrete', () => T.tileConcrete(7))),
    roof.build('houseRoof', scene, texMat(scene, 'tole', () => T.texTole(20, 0.65), { spec: 0.25, specPower: 24 })),
    wins.build('houseWin', scene, texMat(scene, 'naco', () => texWindow(), { spec: 0.4, specPower: 48 })),
    door.build('houseDoor', scene, texMat(scene, 'door_' + (o.door || 'w'), () => texDoor(o.door || '#6d3b22'))),
    misc.build('houseMisc', scene, colorMat(scene, 'polytank', '#ffffff', { spec: 0.2 })),
  ], { radius: Math.max(w, d) * 0.62, height: h + 1.2, shadow: 0.6, box: [w + 0.1, d + 0.1] });
}

/** Mur d'enceinte (clôture de cour) : enduit, chaperon, tessons au sommet. */
export function compoundWall(scene, o = {}){
  const len = o.len ?? 4, h = o.h ?? 1.7, t = 0.22;
  const color = o.color || '#e8e2d4';
  const g = new Geo(), cap = new Geo();
  g.add(box(len, h, t), aoColor(h, 0.65, 1.0, 0.05), [len / 3, h / 3]);
  for(let x = -len / 2; x <= len / 2 + 0.01; x += 2){ g.add(box(0.34, h + 0.1, 0.34, x), aoColor(h, 0.65, 1.0, 0.05), [0.3, h / 3]); }
  cap.add(box(len + 0.1, 0.08, t + 0.1, 0, h), null, [len, 0.2]);
  return new Template([
    g.build('wall', scene, texMat(scene, 'plaster_' + color, () => T.texPlaster(211, color))),
    cap.build('wallCap', scene, texMat(scene, 'concrete', () => T.tileConcrete(7))),
  ], { radius: len * 0.5, height: h, shadow: 0.45, box: [len + 0.34, t + 0.14] });
}

/** Portail métallique entre deux piliers. */
export function gate(scene, o = {}){
  const color = o.color || '#2f6b4f';
  const g = new Geo(), p = new Geo();
  const m = B().MeshBuilder.CreatePlane('gate', { width: 3, height: 1.8, sideOrientation: B().Mesh.DOUBLESIDE }, null);
  m.position.y = 0.95;
  g.add(m);
  p.add(box(0.45, 2.1, 0.45, -1.72), aoColor(2, 0.65, 1, 0.05), [0.3, 1]); p.add(box(0.45, 2.1, 0.45, 1.72), aoColor(2, 0.65, 1, 0.05), [0.3, 1]);
  return new Template([
    g.build('gate', scene, texMat(scene, 'gate_' + color, () => texGate(color), { alpha: 'test', spec: 0.3 })),
    p.build('gatePillars', scene, texMat(scene, 'plaster_#e8e2d4', () => T.texPlaster(211, '#e8e2d4'))),
  ], { radius: 1.9, height: 2, shadow: 0.35, box: [3.9, 0.45] });
}

/** Table de maquis sous parasol rayé, casiers de bouteilles. */
export function maquis(scene, o = {}){
  const R = rng(o.seed || 131);
  const fabric = new Geo(), wood = new Geo(), plastic = new Geo();
  const cone = B().MeshBuilder.CreateCylinder('para', { diameterTop: 0, diameterBottom: 2.4, height: 0.55, tessellation: 8 }, null);
  cone.position.y = 2.15;
  fabric.add(cone, (x, y, z, nx, ny) => ny > 0 ? [1, 1, 1] : [0.45, 0.45, 0.45], [1, 1]);
  wood.add(cyl(0.05, 0.05, 2.2), null, [0.2, 2]);
  wood.add(cyl(1.1, 1.1, 0.06, 16, 0, 0.72), null, [1, 1]);
  wood.add(cyl(0.12, 0.2, 0.72), null, [0.3, 1]);
  // chaises en plastique (blanches ou rouges) + casier
  const chairCol = R() < 0.5 ? [0.95, 0.95, 0.93] : [0.8, 0.18, 0.15];
  for(let i = 0; i < 4; i++){
    const a = i / 4 * Math.PI * 2 + 0.4, x = Math.cos(a) * 0.95, z = Math.sin(a) * 0.95;
    plastic.add(box(0.45, 0.06, 0.45, x, 0.42, z, a), () => chairCol);
    const back = box(0.45, 0.45, 0.05, x + Math.cos(a) * 0.22, 0.45, z + Math.sin(a) * 0.22, -a + Math.PI / 2);
    plastic.add(back, () => chairCol);
    for(const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) plastic.add(box(0.04, 0.42, 0.04, x + lx, 0, z + lz), () => chairCol);
  }
  plastic.add(box(0.45, 0.28, 0.32, 1.35, 0, -0.4, 0.3), () => [0.9, 0.55, 0.1]);
  plastic.add(box(0.45, 0.28, 0.32, 1.35, 0.28, -0.4, 0.2), () => [0.12, 0.45, 0.25]);
  const stripes = o.stripes || R.pick([['#c0392b', '#f1e3c6'], ['#1f6fb2', '#f4f1e8'], ['#e67e22', '#2c3e50'], ['#27ae60', '#f5f0e0']]);
  return new Template([
    fabric.build('parasol', scene, texMat(scene, 'fabric_' + stripes.join(''), () => T.texFabric(stripes), { twoSided: true })),
    wood.build('maquisWood', scene, texMat(scene, 'wood', () => T.texWood(22))),
    plastic.build('maquisPlastic', scene, colorMat(scene, 'plastic', '#ffffff', { spec: 0.35, specPower: 32 })),
  ], { radius: 1.4, height: 2.4, shadow: 0.45 });
}

/** Étal de marché : table, bâche tendue sur 4 poteaux, marchandises. */
export function marketStall(scene, o = {}){
  const R = rng(o.seed || 141);
  const wood = new Geo(), tarp = new Geo(), goods = new Geo();
  wood.add(box(2.0, 0.08, 1.1, 0, 0.8), null, [2, 1]);
  for(const [x, z] of [[-0.95, -0.5], [0.95, -0.5], [-0.95, 0.5], [0.95, 0.5]]) wood.add(box(0.07, 0.8, 0.07, x, 0, z), null, [0.1, 1]);
  for(const [x, z] of [[-1.1, -0.7], [1.1, -0.7], [-1.1, 0.7], [1.1, 0.7]]) wood.add(box(0.06, 2.1 + (z > 0 ? 0 : 0.25), 0.06, x, 0, z), null, [0.1, 2]);
  const t = B().MeshBuilder.CreatePlane('tarp', { width: 2.5, height: 1.7, sideOrientation: B().Mesh.DOUBLESIDE }, null);
  t.rotation.x = Math.PI / 2 - 0.15; t.position.y = 2.2;
  tarp.add(t, () => [1, 1, 1], [1, 1]); tarp.normalsUp();
  // pyramides de tomates, oranges, bananes, ignames
  const fruit = [[0.85, 0.18, 0.12], [0.95, 0.55, 0.1], [0.92, 0.8, 0.22], [0.45, 0.3, 0.18], [0.3, 0.55, 0.2]];
  for(let k = 0; k < 5; k++){
    const col = R.pick(fruit);
    const cx = -0.7 + k * 0.35, cz = (R() - 0.5) * 0.4;
    for(let i = 0; i < 7; i++){
      const s = B().MeshBuilder.CreateSphere('f', { diameter: 0.14, segments: 4 }, null);
      s.position.set(cx + (R() - 0.5) * 0.2, 0.92 + (i > 4 ? 0.1 : 0), cz + (R() - 0.5) * 0.2);
      goods.add(s, () => col);
    }
  }
  const tarpCols = o.tarp || R.pick([['#2980b9', '#1f618d'], ['#c0392b', '#922b21'], ['#16a085', '#117a65'], ['#e67e22', '#ca6f1e']]);
  return new Template([
    wood.build('stallWood', scene, texMat(scene, 'wood', () => T.texWood(22))),
    tarp.build('stallTarp', scene, texMat(scene, 'fabric_' + tarpCols.join(''), () => T.texFabric(tarpCols), { twoSided: true })),
    goods.build('stallGoods', scene, colorMat(scene, 'goods', '#ffffff', { spec: 0.3 })),
  ], { radius: 1.5, height: 2.3, shadow: 0.45 });
}

/** Lampadaire de rue (avec halo lumineux la nuit). */
export function streetLamp(scene, o = {}){
  const g = new Geo(), bulb = new Geo(), halo = new Geo();
  g.add(cyl(0.08, 0.14, 4.0), null, [0.3, 3]);
  const arm = box(1.1, 0.06, 0.08, 0.5, 3.95);
  g.add(arm);
  bulb.add(box(0.45, 0.12, 0.22, 1.0, 3.84));
  // halo au sol (carte additive)
  const q = B().MeshBuilder.CreateGround('halo', { width: 3.6, height: 3.6 }, null);
  q.position.set(1.0, 0.05, 0);
  halo.add(q);
  const meshes = [
    g.build('lampPole', scene, colorMat(scene, 'lampMetal', '#3a3d42', { spec: 0.4 })),
    bulb.build('lampBulb', scene, colorMat(scene, 'lampBulb', '#fff4d0', { emissive: '#ffe6a8' })),
  ];
  if(o.night){
    const hm = texMat(scene, 'glowWarm', () => T.cardGlow('#ffc870'), { additive: true, unlit: true });
    hm.alpha = 0.4;
    meshes.push(halo.build('lampHalo', scene, hm));
  }
  return new Template(meshes, { radius: 0.4, height: 4.1, shadow: 0.3 });
}

/** Fûts (plastique bleu ou métal rouillé) et caisses empilées. */
export function barrels(scene, o = {}){
  const R = rng(o.seed || 151);
  const g = new Geo(), crates = new Geo();
  const cols = o.metal ? [[0.55, 0.25, 0.12], [0.35, 0.33, 0.3], [0.62, 0.3, 0.1]] : [[0.12, 0.32, 0.62], [0.1, 0.28, 0.55], [0.75, 0.72, 0.65]];
  for(let i = 0; i < 3; i++){
    const col = R.pick(cols);
    const x = (i - 1) * 0.62 + (R() - 0.5) * 0.1, z = (R() - 0.5) * 0.3;
    g.add(cyl(0.56, 0.56, 0.9, 14, x, 0, z), (xx, y, zz, nx, ny) => { const v = 0.6 + (y / 0.9) * 0.45 + (Math.abs((y * 3.2) % 1 - 0.5) < 0.06 ? -0.25 : 0); return [col[0] * v, col[1] * v, col[2] * v]; });
  }
  for(let i = 0; i < 2; i++) crates.add(box(0.6, 0.5, 0.6, 1.05, i * 0.5, 0.1, i * 0.3), aoColor(1, 0.7, 1, 0.1), [1, 1]);
  return new Template([
    g.build('barrels', scene, colorMat(scene, 'barrelMat', '#ffffff', { spec: 0.3 })),
    crates.build('crates', scene, texMat(scene, 'wood', () => T.texWood(22))),
  ], { radius: 1.1, height: 1.0, shadow: 0.45 });
}

/** Conteneur maritime (port d'Abidjan). */
export function container(scene, o = {}){
  const col = o.color || '#2d5d8a';
  const g = new Geo();
  g.add(box(6.0, 2.6, 2.44), aoColor(2.6, 0.7, 1.0, 0.05), [2, 1]);
  return new Template([g.build('container', scene, texMat(scene, 'container_' + col, () => T.texContainer(3, col), { spec: 0.2 }))],
    { radius: 3.2, height: 2.6, shadow: 0.65, box: [6.0, 2.44] });
}

// ── Mali ───────────────────────────────────────────────────────

/**
 * Bâtiment de terre à la manière de Djenné : murs en banco, pilastres
 * coiffés de pinacles, torons (bois de palmier qui dépassent), acrotère.
 */
export function djenne(scene, o = {}){
  const R = rng(o.seed || 161);
  const w = o.w ?? 4.5, d = o.d ?? 3.4, h = o.h ?? 3.0;
  const mud = new Geo(), wood = new Geo(), dark = new Geo();
  mud.add(box(w, h, d), aoColor(h, 0.72, 1.04, 0.06), [w / 2.5, h / 2.5]);
  const nP = Math.max(3, Math.round(w / 1.1));
  for(let i = 0; i < nP; i++){
    const x = -w / 2 + i * (w / (nP - 1));
    mud.add(box(0.42, h + 0.55, 0.42, x, 0, -d / 2), aoColor(h + 0.5, 0.6, 1.05, 0.08), [0.4, h / 2]);
    const pin = cyl(0.05, 0.42, 0.55, 8, x, h + 0.55, -d / 2);
    mud.add(pin, aoColor(h + 1.2, 0.6, 1.05, 0.08), [0.4, 0.5]);
    // torons en rangées
    for(let r = 0; r < 3; r++) wood.add(box(0.06, 0.06, 0.55, x + 0.22, 0.8 + r * 0.8, -d / 2 - 0.2), () => [0.9, 0.85, 0.8]);
  }
  mud.add(box(w + 0.2, 0.35, d + 0.2, 0, h), aoColor(h + 0.4, 0.8, 1.05, 0.05), [w / 2.5, 0.3]);
  dark.add(box(1.0, 1.8, 0.1, 0, 0, -d / 2 - 0.22), () => [0.25, 0.18, 0.12]);
  for(const x of [-w * 0.3, w * 0.3]) dark.add(box(0.35, 0.5, 0.1, x, 1.9, -d / 2 - 0.22), () => [0.12, 0.08, 0.06]);
  return new Template([
    mud.build('djenne', scene, texMat(scene, 'banco', () => T.texBanco(21))),
    wood.build('toron', scene, texMat(scene, 'bark_toron', () => T.texBark(7, { ramp: [[0, '#4a3322'], [1, '#8a6a48']] }))),
    dark.build('djenneDark', scene, colorMat(scene, 'openings', '#ffffff')),
  ], { radius: Math.max(w, d) * 0.62, height: h + 1.1, shadow: 0.62, box: [w + 0.4, d + 0.5] });
}

/** Pan de mur en ruine (sommet brisé, blocs tombés). */
export function ruinWall(scene, o = {}){
  const R = rng(o.seed || 171);
  const len = o.len ?? 4, g = new Geo();
  const seg = 8;
  for(let i = 0; i < seg; i++){
    const hh = (o.h ?? 2.2) * (0.35 + R() * 0.65) * (1 - Math.abs(i - seg / 2) / seg * 0.6);
    g.add(box(len / seg + 0.02, hh, 0.45, -len / 2 + (i + 0.5) * len / seg), aoColor(2.2, 0.6, 1.02, 0.08), [0.5, hh / 2]);
  }
  for(let i = 0; i < 4; i++){
    const s = 0.25 + R() * 0.25;
    g.add(box(s, s * 0.7, s, (R() - 0.5) * len, 0, 0.6 + R() * 0.6, R() * 3), aoColor(0.5, 0.6, 1, 0.1), [0.3, 0.3]);
  }
  const key = o.stone ? 'rockwall' : 'banco';
  const mat = o.stone ? texMat(scene, 'rock_wall', () => T.tileCobble(18, { stones: ['#8a7a64', '#a08c70', '#76664f', '#b49c7c'], grout: '#4a3c2c', cells: 30 }))
    : texMat(scene, 'banco', () => T.texBanco(21));
  return new Template([g.build('ruin_' + key, scene, mat)], { radius: len * 0.5, height: o.h ?? 2.2, shadow: 0.5, box: [len, 0.45] });
}

/** Grenier dogon : cylindre de banco, toit conique de chaume. */
export function granary(scene, o = {}){
  const mud = new Geo(), straw = new Geo();
  const h = o.h ?? 1.7;
  mud.add(cyl(1.1, 1.2, h, 14), aoColor(h, 0.62, 1.02, 0.08), [2, 1]);
  mud.add(cyl(0.3, 0.3, 0.35, 8, 0, 0, 0), aoColor(h, 0.5, 0.8), [0.5, 0.3]);
  const roof = B().MeshBuilder.CreateCylinder('roof', { diameterTop: 0.05, diameterBottom: 1.7, height: 1.2, tessellation: 14 }, null);
  roof.position.y = h + 0.5;
  straw.add(roof, (x, y, z, nx, ny) => { const v = 0.6 + ny * 0.5; return [v, v, v]; }, [2, 1]);
  return new Template([
    mud.build('granary', scene, texMat(scene, 'banco', () => T.texBanco(21))),
    straw.build('granaryRoof', scene, texMat(scene, 'thatch', () => texThatch())),
  ], { radius: 0.9, height: h + 1.1, shadow: 0.55 });
}

/** Canaris (jarres de terre cuite). */
export function jars(scene, o = {}){
  const R = rng(o.seed || 181);
  const g = new Geo();
  for(let i = 0; i < 3; i++){
    const s = 0.8 + R() * 0.4;
    const shape = [[0.001, 0], [0.22, 0.02], [0.32, 0.18], [0.3, 0.38], [0.16, 0.5], [0.14, 0.58], [0.19, 0.62]].map(([r, y]) => new (B().Vector3)(r * s, y * s, 0));
    const m = B().MeshBuilder.CreateLathe('jar', { shape, tessellation: 14 }, null);
    m.position.set((i - 1) * 0.55, 0, (R() - 0.5) * 0.4);
    g.add(m, aoColor(0.6, 0.6, 1.05, 0.1), [2, 1]);
  }
  return new Template([g.build('jars', scene, texMat(scene, 'terracotta', () => T.tileDirt(5, { ramp: [[0, '#7a3a1c'], [0.5, '#a0522d'], [1, '#c06a3a']], pebbles: 0, cracks: 0.2 })))],
    { radius: 0.8, height: 0.7, shadow: 0.45 });
}

// ── Sgrün, Royaume, Vide ───────────────────────────────────────

/** Pylône / monolithe de Sgrün : prisme noir aux lignes d'énergie. */
export function pylon(scene, o = {}){
  const h = o.h ?? 3.5;
  const g = new Geo(), core = new Geo();
  const p = B().MeshBuilder.CreateCylinder('pylon', { diameterTop: 0.35, diameterBottom: 0.9, height: h, tessellation: 4 }, null);
  p.position.y = h / 2; p.rotation.y = Math.PI / 4;
  g.add(p, aoColor(h, 0.6, 1.1, 0.05), [2, 1]);
  g.add(box(1.4, 0.3, 1.4), aoColor(1, 0.5, 0.9), [1, 0.3]);
  const orb = B().MeshBuilder.CreateIcoSphere('orb', { radius: 0.22, subdivisions: 2 }, null);
  orb.position.y = h + 0.35;
  core.add(orb);
  const col = o.color || '#5fd4ff';
  return new Template([
    g.build('pylon', scene, texMat(scene, 'sgrunPanel_' + col, () => texSgrunPanel(col), { spec: 0.6, specPower: 64, emissiveTex: true })),
    core.build('pylonOrb', scene, colorMat(scene, 'orb_' + col, col, { emissive: col })),
  ], { radius: 0.9, height: h + 0.6, shadow: 0.5 });
}

/** Colonne (marbre clair du Royaume, béton brisé, basalte). */
export function pillar(scene, o = {}){
  const R = rng(o.seed || 191);
  const h = o.broken ? (o.h ?? 3) * (0.4 + R() * 0.4) : (o.h ?? 3);
  const g = new Geo();
  g.add(box(0.9, 0.3, 0.9), aoColor(h, 0.6, 1.02, 0.1), [1, 0.3]);
  g.add(cyl(0.55, 0.62, h - 0.5, 16, 0, 0.3), aoColor(h, 0.6, 1.05, 0.1), [2, h / 2]);
  if(!o.broken) g.add(box(0.85, 0.25, 0.85, 0, h - 0.2), aoColor(h, 0.6, 1.05, 0.1), [1, 0.3]);
  const tile = o.tile === 'marble' ? () => T.tileConcrete(33, { ramp: [[0, '#b9c4c8'], [0.5, '#dfe6e8'], [1, '#f7fbfc']] })
    : o.tile === 'basalt' ? () => T.tileRock(34, { ramp: [[0, '#141214'], [0.5, '#2a2629'], [1, '#403a3c']] })
    : () => T.tileConcrete(35);
  return new Template([g.build('pillar', scene, texMat(scene, 'pillar_' + (o.tile || 'c'), tile, { spec: o.tile === 'marble' ? 0.3 : 0.06 }))],
    { radius: 0.6, height: h, shadow: 0.5 });
}

/** Engrenage géant (Salle des Engrenages). */
export function gear(scene, o = {}){
  const r = o.r ?? 1.4;
  const g = new Geo();
  const ring = B().MeshBuilder.CreateTorus('gear', { diameter: r * 2, thickness: 0.35, tessellation: 32 }, null);
  g.add(ring);
  for(let i = 0; i < 16; i++){
    const a = i / 16 * Math.PI * 2;
    const t = box(0.3, 0.3, 0.3); t.position.set(Math.cos(a) * (r + 0.22), 0.15, Math.sin(a) * (r + 0.22)); t.rotation.y = -a;
    g.add(t);
  }
  for(let i = 0; i < 4; i++){ const s = box(r * 2, 0.18, 0.18); s.rotation.y = i * Math.PI / 4; s.position.y = 0.09; g.add(s); }
  const m = g.build('gear', scene, colorMat(scene, 'brass', '#9a7a3a', { spec: 0.8, specPower: 32 }));
  m.rotation.x = 0;
  return new Template([m], { radius: r + 0.3, height: 0.4, shadow: 0.45 });
}

/** Bureau (Tour Postel) : plateau, écran, chaise. */
export function desk(scene, o = {}){
  const g = new Geo(), screen = new Geo();
  g.add(box(1.6, 0.06, 0.8, 0, 0.74), null, [1, 1]);
  g.add(box(0.06, 0.74, 0.75, -0.75), null); g.add(box(0.06, 0.74, 0.75, 0.75), null);
  screen.add(box(0.7, 0.42, 0.04, 0, 0.9, -0.2), () => [0.15, 0.2, 0.28]);
  screen.add(box(0.5, 0.5, 0.5, 0, 0, 0.7), () => [0.15, 0.15, 0.18]);
  return new Template([
    g.build('desk', scene, texMat(scene, 'wood', () => T.texWood(22))),
    screen.build('deskScreen', scene, colorMat(scene, 'deskDark', '#ffffff', { spec: 0.5 })),
  ], { radius: 1.0, height: 1.1, shadow: 0.4 });
}

/** Corail branchu (fonds marins). */
export function coral(scene, o = {}){
  const R = rng(o.seed || 201);
  const g = new Geo();
  const col = c3(o.color || '#e0605a');
  const grow = (from, dir, len, r, depth) => {
    const to = from.add(dir.scale(len));
    const tube = B().MeshBuilder.CreateTube('co', { path: [from, to], radiusFunction: (i) => i ? r * 0.7 : r, tessellation: 6, cap: B().Mesh.CAP_ALL }, null);
    g.add(tube, (x, y) => { const v = 0.55 + y * 0.6; return [col[0] * v, col[1] * v, col[2] * v]; });
    if(depth <= 0) return;
    for(let k = 0; k < 2; k++) grow(to, dir.add(new (B().Vector3)((R() - 0.5) * 1.3, 0.3, (R() - 0.5) * 1.3)).normalize(), len * 0.72, r * 0.7, depth - 1);
  };
  for(let i = 0; i < 3; i++) grow(new (B().Vector3)((R() - 0.5) * 0.4, 0, (R() - 0.5) * 0.4), new (B().Vector3)((R() - 0.5), 1, (R() - 0.5)).normalize(), 0.45, 0.08, 3);
  return new Template([g.build('coral', scene, colorMat(scene, 'coral_' + (o.color || 'r'), '#ffffff', { spec: 0.2 }))], { radius: 0.7, height: 1.3, shadow: 0.35 });
}
