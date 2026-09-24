// ============================================================
// BIOMES — une fiche par lieu du roman : le sol (couches peintes),
// la lumière, l'étalonnage et la composition du décor.
//
//   abidjan  : cour d'atelier, rues de Marcory/Treichville, marché
//              d'Adjamé, port, villa de Cocody, cimetière, pont HKB
//   banco    : forêt du Banco
//   essence  : Royaume de l'Essence (variantes lac et feu)
//   born     : Born Land
//   polar    : Pôle Nord, base de Sgrün
//   sahel    : ruines de Niani, rempart de Kong, harmattan
//   canyon   : falaises de Bandiagara (variante grotte)
//   abyss    : fosse marine (variante éruption)
//   void     : le Vide
//   sgrun    : forteresse de Sgrün, salle des engrenages
//   tower    : tour Postel (bureaux)
// ============================================================

import * as T from './textures.js';
import * as N from './nature.js';
import * as K from './built.js';
import { Z } from './composer.js';
import * as GEO from './geo.js';
import { rng, smooth, clamp } from './noise.js';

// ── Lumières ───────────────────────────────────────────────────
// hemi : ciel / sol ; sun : direction fixe (celle des ombres cuites)
export const LIGHTS = {
  day:    { hemi: '#fff4e0', ground: '#3a3024', hemiI: 0.78, sun: '#fff0d0', sunI: 1.25, clear: '#0d0b09', contrast: 1.12, exposure: 1.05, vignette: 1.6 },
  golden: { hemi: '#ffd9a8', ground: '#3a2418', hemiI: 0.7, sun: '#ffb870', sunI: 1.35, clear: '#140c06', contrast: 1.15, exposure: 1.02, vignette: 2.0 },
  night:  { hemi: '#6f86b8', ground: '#141826', hemiI: 0.55, sun: '#9fb4e8', sunI: 0.55, clear: '#04060c', contrast: 1.18, exposure: 1.0, vignette: 2.6, vignetteColor: '#02030a' },
  forest: { hemi: '#e8f5d0', ground: '#1a2410', hemiI: 0.72, sun: '#fff2c8', sunI: 1.15, clear: '#060a04', contrast: 1.15, exposure: 1.02, vignette: 2.2 },
  snow:   { hemi: '#e6f0ff', ground: '#8aa0b8', hemiI: 0.8, sun: '#ffffff', sunI: 1.1, clear: '#0a0e14', contrast: 1.08, exposure: 1.0, vignette: 1.6, vignetteColor: '#0a1420' },
  mystic: { hemi: '#d8f0ff', ground: '#2a2446', hemiI: 0.8, sun: '#cfe8ff', sunI: 1.0, clear: '#070812', contrast: 1.1, exposure: 1.06, vignette: 2.2, vignetteColor: '#0a0620' },
  fire:   { hemi: '#ffb080', ground: '#2a0a04', hemiI: 0.62, sun: '#ff9050', sunI: 1.1, clear: '#0c0302', contrast: 1.2, exposure: 1.02, vignette: 2.6, vignetteColor: '#140200' },
  grey:   { hemi: '#d8d4cc', ground: '#2c2a28', hemiI: 0.75, sun: '#e8e2d6', sunI: 0.95, clear: '#0a0a0a', contrast: 1.05, exposure: 1.0, vignette: 2.2 },
  dust:   { hemi: '#ffe2b0', ground: '#4a3420', hemiI: 0.8, sun: '#ffd8a0', sunI: 1.15, clear: '#1a1008', contrast: 1.05, exposure: 1.05, vignette: 1.8, vignetteColor: '#2a1808' },
  cave:   { hemi: '#b8a890', ground: '#140e0a', hemiI: 0.5, sun: '#ffd8a8', sunI: 0.8, clear: '#050302', contrast: 1.2, exposure: 1.0, vignette: 3.0 },
  sea:    { hemi: '#8fe0e8', ground: '#0a2a34', hemiI: 0.75, sun: '#c8fff4', sunI: 0.85, clear: '#021014', contrast: 1.1, exposure: 1.02, vignette: 2.6, vignetteColor: '#001018' },
  void:   { hemi: '#a89ce0', ground: '#120824', hemiI: 0.55, sun: '#d8c8ff', sunI: 0.75, clear: '#05020c', contrast: 1.2, exposure: 1.0, vignette: 3.0, vignetteColor: '#080214' },
  tech:   { hemi: '#a8c8ff', ground: '#0c1018', hemiI: 0.6, sun: '#d0e4ff', sunI: 0.8, clear: '#04060a', contrast: 1.18, exposure: 1.0, vignette: 2.6 },
  office: { hemi: '#f0f0f0', ground: '#303030', hemiI: 0.8, sun: '#fff8ec', sunI: 0.9, clear: '#0a0a0a', contrast: 1.08, exposure: 1.05, vignette: 1.8 },
};

// ── Aides de peinture du sol ───────────────────────────────────
const laneMask = (h, inner = 0.72, outer = 1.02, rough = 0.35, s = 1) => {
  const n = h.noiseFn(s, 2.2);
  return (x, z, d) => smooth(h.laneHalf * outer + (n(x, z) - 0.5) * rough * 2, h.laneHalf * inner, d);
};
const bandMask = (h, a, b, s = 3) => {
  const n = h.noiseFn(s, 1.6);
  return (x, z, d) => { const dd = d + (n(x, z) - 0.5) * 0.8; return smooth(h.laneHalf * a, h.laneHalf * (a + 0.12), dd) * smooth(h.laneHalf * b, h.laneHalf * (b - 0.2), dd); };
};
const patches = (h, s, scale, lo, hi = lo + 0.08, laneClear = 1.1) => {
  const n = h.noiseFn(s, scale);
  return (x, z, d) => smooth(lo, hi, n(x, z)) * smooth(h.laneHalf * laneClear, h.laneHalf * (laneClear + 0.35), d);
};
const borderMask = (h, inside = 1.5, s = 7) => {
  const n = h.noiseFn(s, 2);
  return (x, z) => smooth(inside, -0.5, h.edgeDist(x, z) + (n(x, z) - 0.5) * 2);
};

/** Parsème des décalcomanies (feuilles, cailloux, taches…) peintes à pleine résolution. */
function sprinkle(h, count, where, draw){
  const R = h.rnd, B = h.bounds;
  for(let i = 0; i < count; i++){
    const x = B.x0 + R() * (B.x1 - B.x0), z = B.z1 + R() * (B.z0 - B.z1);
    const d = h.distAt(x, z);
    if(!where(x, z, d)) continue;
    const [px, py] = h.toC(x, z);
    h.ctx.save(); h.ctx.translate(px, py); draw(h.ctx, R, h.ppu); h.ctx.restore();
  }
}
const leafDecal = (cols) => (ctx, R, ppu) => {
  ctx.rotate(R() * 6.28); ctx.fillStyle = R.pick(cols); ctx.globalAlpha = 0.75;
  const l = ppu * (0.08 + R() * 0.07);
  ctx.beginPath(); ctx.ellipse(0, 0, l, l * 0.4, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
};
const stainDecal = (col, size = 0.5, a = 0.35) => (ctx, R, ppu) => {
  const r = ppu * size * (0.5 + R());
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0));
  ctx.fillStyle = g; ctx.scale(1, 0.6 + R() * 0.4); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
};
/** Flaque : sombre, bord net, reflet du ciel. */
const puddleDecal = (sky = 'rgba(170,190,210,A)') => (ctx, R, ppu) => {
  const rx = ppu * (0.22 + R() * 0.35), ry = rx * (0.4 + R() * 0.25);
  ctx.rotate(R() * 0.6 - 0.3);
  ctx.fillStyle = 'rgba(16,20,24,0.7)'; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.fill();
  const g = ctx.createLinearGradient(0, -ry, 0, ry);
  g.addColorStop(0, sky.replace('A', 0.35)); g.addColorStop(1, sky.replace('A', 0.05));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.9, ry * 0.8, 0, 0, 7); ctx.fill();
};
/** Traces de roues le long de la voie. */
function tireTracks(h, offset, col = 'rgba(20,16,12,0.22)'){
  const ctx = h.ctx;
  ctx.strokeStyle = col; ctx.lineWidth = h.ppu * 0.12; ctx.setLineDash([h.ppu * 0.4, h.ppu * 0.15]);
  for(const side of [-1, 1]){
    ctx.beginPath();
    let first = true;
    for(let x = h.bounds.x0; x < h.bounds.x1; x += 0.5){
      // suit la voie : on cherche le z du centre de voie par balayage
      let bestZ = null, best = 1e9;
      for(let z = h.play.z1; z < h.play.z0; z += 0.25){ const d = h.distAt(x, z); if(d < best){ best = d; bestZ = z; } }
      if(bestZ == null || best > 0.5) { first = true; continue; }
      const [px, py] = h.toC(x, bestZ + side * offset);
      if(first){ ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
}
/** Trace une bande peinte le long de la voie (marquage routier). */
function laneStripe(h, offset, col, width = 0.1, dash = null){
  const P = h.path || [];
  const ctx = h.ctx;
  if(!P.length) return;
  ctx.strokeStyle = col; ctx.lineWidth = h.ppu * width;
  if(dash) ctx.setLineDash([h.ppu * dash[0], h.ppu * dash[1]]);
  ctx.beginPath();
  for(let k = 0; k < P.length - 1; k++){
    const a = P[k], b = P[k + 1];
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
    const nx = -dz / L * offset, nz = dx / L * offset;
    const p0 = h.toC(a.x + nx, a.z + nz), p1 = h.toC(b.x + nx, b.z + nz);
    if(k === 0) ctx.moveTo(p0[0], p0[1]);
    ctx.lineTo(p1[0], p1[1]);
  }
  ctx.stroke(); ctx.setLineDash([]);
}

/** Caniveau (rigole bétonnée) de chaque côté de la voie. */
function gutters(h, at = 1.12){
  sprinkle(h, 9000, (x, z, d) => Math.abs(d - h.laneHalf * at) < 0.06, (ctx, R, ppu) => {
    ctx.fillStyle = 'rgba(30,28,26,0.55)'; ctx.fillRect(-ppu * 0.1, -ppu * 0.1, ppu * 0.2, ppu * 0.2);
    ctx.fillStyle = 'rgba(160,155,145,0.35)'; ctx.fillRect(-ppu * 0.12, -ppu * 0.14, ppu * 0.24, ppu * 0.05);
  });
}

// ── Palettes partagées ─────────────────────────────────────────
const PAL = {
  laterite: { ramp: [[0, '#6b3219'], [0.5, '#96502b'], [1, '#bd733f']], stones: ['#a07050', '#7a5038', '#c09070', '#5a3824'], pebbles: 180, cracks: 0.18 },
  grassLush: { ramp: [[0, '#1f3a12'], [0.45, '#35561c'], [0.8, '#4c7224'], [1, '#62882f']] },
  grassDry: { ramp: [[0, '#5a5424'], [0.5, '#7f7534'], [1, '#a39650']], blades: ['#6a6230', '#8f8440', '#b3a762', '#514a22'] },
  soil: { ramp: [[0, '#2a1d12'], [0.5, '#3e2b1b'], [1, '#574029']], stones: ['#5a4a3a', '#443628', '#6e5c48'], pebbles: 120, cracks: 0.2 },
  sand: { ramp: [[0, '#b0885a'], [0.5, '#cfaa74'], [1, '#e6c890']] },
  mango: { leaves: ['#17300e', '#1f3d12', '#294d18', '#35601f', '#447329', '#568635'] },
  flamboyant: { leaves: ['#5c1410', '#86180f', '#ab2314', '#cf3a1a', '#e85a24', '#2f5a1f'] },
  jungle: { leaves: ['#10260a', '#173210', '#1f4014', '#2a511a', '#386524', '#4a7a2e'], len: [16, 28] },
  mystic: { leaves: ['#1a4a5a', '#237080', '#2f94a0', '#4ab8c0', '#7ad8d8', '#b8f0ec'] },
  ember: { leaves: ['#3a0a04', '#6a1406', '#9a2a0a', '#c84a12', '#f07a20', '#ffb040'] },
};

// ════════════════════════════════════════════════════════════
// ABIDJAN
// ════════════════════════════════════════════════════════════
const abidjan = {
  light: (v) => v.night ? LIGHTS.night : v.setting === 'pont' ? LIGHTS.golden : LIGHTS.day,
  ground(h, v){
    const lat = T.tileDirt(11, PAL.laterite);
    const setting = v.setting;
    let base = { tile: lat, world: 3 };
    const layers = [];
    if(setting === 'pont'){
      // lagune : eau peinte de part et d'autre du tablier
      base = { tile: water(12, v.night), world: 5.5 };
      layers.push(h2 => h2.layer(T.tileConcrete(13, { ramp: [[0, '#6f6a62'], [0.5, '#8d877c'], [1, '#a59e92']] }), 4, (x, z, d) => smooth(h2.laneHalf * 1.35, h2.laneHalf * 1.3, d)));
      layers.push(h2 => h2.layer(T.tileAsphalt(14), 4, (x, z, d) => smooth(h2.laneHalf * 1.02, h2.laneHalf * 0.98, d)));
      layers.push(h2 => laneStripe(h2, 0, 'rgba(240,236,214,0.85)', 0.1, [1.6, 1.4]));   // ligne axiale
      layers.push(h2 => { laneStripe(h2, h2.laneHalf * 0.85, 'rgba(230,226,206,0.6)', 0.08); laneStripe(h2, -h2.laneHalf * 0.85, 'rgba(230,226,206,0.6)', 0.08); });
      return { base, layers, edgeDark: 0.25 };
    }
    layers.push(h2 => h2.layer(T.tileGrass(15, PAL.grassDry), 2.6, patches(h2, 1, 3.6, 0.55, 0.68)));
    layers.push(h2 => h2.layer(T.tileGrass(16, { ...PAL.grassLush, count: 2200 }), 2.6, (x, z, d) => Math.max(borderMask(h2, 1.2, 4)(x, z) * 0.9, patches(h2, 2, 3.2, 0.66, 0.74)(x, z, d))));
    if(setting === 'cour' || setting === 'villa'){
      // grande dalle de béton de la cour, bords cassés
      const slab = setting === 'villa' ? T.tileCobble(17, { stones: ['#b8ad9a', '#c9bfac', '#a89d8a', '#d6cdbb'], grout: '#6a6254', cells: 20 }) : T.tileConcrete(18);
      layers.push(h2 => h2.layer(slab, setting === 'villa' ? 2.2 : 3.4, laneMask(h2, 0.95, 1.25, 0.25)));
    } else if(setting === 'marche'){
      layers.push(h2 => h2.layer(T.tileDirt(19, { ...PAL.laterite, ramp: [[0, '#5a2e18'], [0.5, '#7d4526'], [1, '#9a5a34']], pebbles: 60 }), 2.8, laneMask(h2, 0.8, 1.35, 0.4)));
    } else {
      layers.push(h2 => h2.layer(T.tileAsphalt(20), 3, laneMask(h2, 0.9, 0.98, 0.18)));
    }
    layers.push(h2 => { // décalcomanies de rue
      if(setting === 'rue' || setting === 'port' || setting === 'cimetiere') gutters(h2);
      if(setting !== 'villa') tireTracks(h2, h2.laneHalf * 0.35, setting === 'cour' ? 'rgba(30,26,22,0.14)' : 'rgba(20,16,12,0.22)');
      sprinkle(h2, 90, (x, z, d) => d < h2.laneHalf * 1.3, puddleDecal(v.night ? 'rgba(120,150,210,A)' : 'rgba(170,190,210,A)'));
      sprinkle(h2, 220, (x, z, d) => d < h2.laneHalf * 1.15, stainDecal('rgba(15,12,10,A)', 0.4, 0.32));
      sprinkle(h2, 500, (x, z, d) => d > h2.laneHalf, leafDecal(['#5a4a22', '#7a6230', '#3f4a1c', '#8a3a1a']));
      // déchets : sachets, capsules (réalisme des bas-côtés)
      sprinkle(h2, 140, (x, z, d) => d > h2.laneHalf * 0.95 && d < h2.laneHalf * 2.2, (ctx, R, ppu) => {
        ctx.rotate(R() * 6.28); ctx.fillStyle = R.pick(['#e8e8e0', '#2a6ab0', '#c03020', '#303030', '#e0c040']); ctx.globalAlpha = 0.8;
        ctx.fillRect(0, 0, ppu * (0.05 + R() * 0.1), ppu * (0.04 + R() * 0.06)); ctx.globalAlpha = 1;
      });
      if(setting === 'villa'){ // piscine
        const [px, py] = h2.toC((h2.play.x0 + h2.play.x1) * 0.5 + 9, h2.play.z0 - 4);
        const w = h2.ppu * 6, hh = h2.ppu * 2.6;
        h2.ctx.fillStyle = '#d8d2c4'; h2.ctx.fillRect(px - w / 2 - 12, py - hh / 2 - 12, w + 24, hh + 24);
        const g = h2.ctx.createLinearGradient(px, py - hh / 2, px, py + hh / 2);
        g.addColorStop(0, '#2aa0c8'); g.addColorStop(1, '#5fd0e8');
        h2.ctx.fillStyle = g; h2.ctx.fillRect(px - w / 2, py - hh / 2, w, hh);
      }
    });
    return { base, layers, edgeDark: 0.4, tint: v.night ? { color: '#2a3a6a', alpha: 0.25 } : null };
  },
  compose(c, S, v){
    const setting = v.setting;
    const houses = [0, 1, 2, 3].map(i => S(`house${i}`, () => K.house(c.scene, { seed: 300 + i })));
    const wall = S('cwall', () => K.compoundWall(c.scene, { len: 4 }));
    const gateT = S('gate', () => K.gate(c.scene, { color: c.R.pick(['#2f6b4f', '#2a4f8a', '#7a2a2a']) }));
    const palm = [S('palm0', () => N.palmTree(c.scene, { seed: 41, h: 3.6 })), S('palm1', () => N.palmTree(c.scene, { seed: 42, h: 4.2, lean: 0.8 }))];
    const mango = S('mango', () => N.broadleafTree(c.scene, { seed: 43, key: 'mango', leaves: PAL.mango, h: 2.2, crown: 1.7, clumps: 6 }));
    const flamb = S('flamb', () => N.broadleafTree(c.scene, { seed: 44, key: 'flamb', leaves: PAL.flamboyant, h: 2.4, crown: 1.6, flat: 0.55 }));
    const bushT = S('bushA', () => N.bush(c.scene, { seed: 45, key: 'bushA', leaves: PAL.mango, r: 0.55 }));
    const grass = S('grassA', () => N.groundCover(c.scene, { seed: 46, key: 'grassA', pal: PAL.grassDry, h: 0.62, tufts: 5 }));
    const barrelsT = S('barrels', () => K.barrels(c.scene, { seed: 47 }));
    const lamp = S('lamp' + (v.night ? 'N' : 'D'), () => K.streetLamp(c.scene, { night: v.night }));

    if(setting === 'pont'){
      // tablier du pont : garde-corps et lampadaires ; rives lointaines plantées
      const rail = S('rail', () => K.compoundWall(c.scene, { len: 4, h: 0.9, color: '#c8c2b6' }));
      for(const side of [-1, 1]) c.path && laneFollow(c, rail, side * (c.laneHalf * 1.3 + 0.1), 4, { rotAlong: true });
      for(const side of [-1, 1]) laneFollow(c, lamp, side * (c.laneHalf * 1.25), 9, { rotAlong: true, face: side });
      c.row(palm, 'top', { step: 3.2, offset: 6.5, gapChance: 0.25 });
      c.row([mango, flamb], 'top', { step: 4.5, offset: 8.5 });
      return;
    }

    if(setting === 'port'){
      const cont = ['#2d5d8a', '#a33a2a', '#2f7a4a', '#c07a20', '#6a6a70'].map((col, i) => S('cont' + i, () => K.container(c.scene, { color: col })));
      c.row(cont, 'top', { step: 6.4, offset: 1.8, gapChance: 0.1, rot: 0 });
      c.row(cont, 'top', { step: 6.4, offset: 4.6, gapChance: 0.2, rot: 0 });
      c.row(cont, 'bottom', { step: 6.4, offset: 2.4, gapChance: 0.3, rot: 0 });
      c.scatter([barrelsT, S('barrelsM', () => K.barrels(c.scene, { seed: 48, metal: true }))], 14, Z.border, { s: [0.9, 1.1] });
      for(const side of [-1, 1]) laneFollow(c, lamp, side * (c.laneHalf + 1.6), 10, { rotAlong: true, face: side });
      c.scatter(grass, 60, Z.border, { solid: false, shadow: false, s: [0.8, 1.2] });
      c.scatterModel('AVION.glb', 1, Z.and(Z.top(6), Z.field), { height: 2.0, r: 3.4, fixed: true, shadow: 0.6 });
      return;
    }

    // Rangée de maisons au fond, murs d'enceinte et portails entre elles
    if(setting === 'villa'){
      const villa = S('villa', () => K.house(c.scene, { seed: 390, w: 8, d: 5, h: 3.1, color: '#f4efe4', door: '#3a2a1a' }));
      c.put(villa, (c.play.x0 + c.play.x1) / 2 - 4, c.play.z0 + 3.2, { rot: 0 });
      c.row(wall, 'top', { step: 4.1, offset: 7.2, jitter: 0, gapChance: 0 });
      c.row(palm, 'top', { step: 3.5, offset: 1.2, gapChance: 0.3 });
      const hedge = S('hedge', () => N.bush(c.scene, { seed: 49, key: 'hedge', leaves: PAL.mango, r: 0.6, clumps: 4 }));
      c.row(hedge, 'bottom', { step: 1.3, offset: 0.8, jitter: 0.1, gapChance: 0.05 });
      c.row(palm, 'left', { step: 4, offset: 1.5 }); c.row(palm, 'right', { step: 4, offset: 1.5 });
      c.scatter([bushT, S('flamb2', () => N.bush(c.scene, { seed: 50, key: 'flambush', leaves: PAL.flamboyant, r: 0.5 }))], 18, Z.border, { s: [0.8, 1.2] });
      if(v.night) for(const side of [-1, 1]) laneFollow(c, lamp, side * (c.laneHalf + 1.6), 12, { rotAlong: true, face: side });
      c.scatter(grass, 90, Z.not(Z.nearLane(-9, 0.4)), { solid: false, shadow: false });
      return;
    }

    if(setting === 'cimetiere'){
      const tomb = S('tomb', () => tombTemplate(c.scene));
      c.clusters(tomb, 10, 7, 3.5, Z.and(Z.field, Z.not(Z.nearLane(-9, 1.2))), { pad: 0.9 });
      c.row(wall, 'top', { step: 4.1, offset: 0.6, jitter: 0, gapChance: 0 });
      c.row(wall, 'bottom', { step: 4.1, offset: 0.4, jitter: 0, gapChance: 0.1 });
      c.row([mango, S('dead', () => N.deadTree(c.scene, { seed: 51 }))], 'top', { step: 4.5, offset: 3 });
      for(const side of [-1, 1]) laneFollow(c, lamp, side * (c.laneHalf + 1.6), 13, { rotAlong: true, face: side });
      c.scatter(grass, 110, Z.anywhere, { solid: false, shadow: false });
      return;
    }

    // rue, cour, marché : front bâti continu en haut, portails, arbres derrière
    c.row(houses, 'top', { step: 6.2, offset: 2.9, gapChance: 0.08, rot: 0 });
    c.row([wall, wall, gateT], 'top', { step: 4.2, offset: 0.35, jitter: 0.05, gapChance: 0.15, rot: 0 });
    c.row([mango, flamb, ...palm], 'top', { step: 3.4, offset: 7.2, gapChance: 0.1 });
    c.row(houses, 'top', { step: 6.6, offset: 9.6, gapChance: 0.15, rot: 0 });
    c.row(houses, 'left', { step: 6, offset: 3 }); c.row(houses, 'right', { step: 6, offset: 3 });
    // bas de l'écran : murets bas, buissons, fûts — rien de haut
    const lowWall = S('lowWall', () => K.compoundWall(c.scene, { len: 4, h: 0.85, color: '#e7d7b4' }));
    c.row([lowWall, lowWall, bushT], 'bottom', { step: 4.2, offset: 0.9, jitter: 0.1, gapChance: 0.2, rot: Math.PI });
    c.row([bushT, grass], 'bottom', { step: 1.6, offset: 2.4, gapChance: 0.3 });
    c.scatter([palm[0], mango], 5, Z.and(Z.top(4), Z.field), { s: [0.85, 1.05] });

    if(setting === 'marche'){
      const stalls = [0, 1, 2, 3].map(i => S('stall' + i, () => K.marketStall(c.scene, { seed: 500 + i })));
      for(const side of [-1, 1]) laneFollow(c, stalls, side * (c.laneHalf + 1.4), 3.2, { rotAlong: true, face: side, jitter: 0.3 });
    } else if(setting === 'cour'){
      const maq = S('maquis', () => K.maquis(c.scene, { seed: 61 }));
      c.scatter(maq, 3, Z.and(Z.fieldTop, Z.nearLane(1.5, 5)), { s: [1, 1] });
      c.scatterModel('HARPE.glb', 1, Z.and(Z.fieldTop, Z.nearLane(2, 6)), { height: 1.1, r: 0.6, fixed: true });
    } else {
      const maq = [S('maquis', () => K.maquis(c.scene, { seed: 61 })), S('maquis2', () => K.maquis(c.scene, { seed: 62 }))];
      c.scatter(maq, v.night ? 4 : 2, Z.and(Z.fieldTop, Z.nearLane(1.5, 4)), { s: [1, 1] });
      for(const side of [-1, 1]) laneFollow(c, lamp, side * (c.laneHalf + 1.5), 11, { rotAlong: true, face: side });
    }
    c.scatter(barrelsT, 8, Z.and(Z.field, Z.nearLane(1, 6)), { s: [0.9, 1.1] });
    c.scatter(grass, 260, Z.not(Z.nearLane(-9, 0.3)), { solid: false, shadow: false, s: [0.7, 1.4], noise: 0.4 });
    c.scatter([bushT, barrelsT], 18, Z.and(Z.field, Z.nearLane(1.5, 99)), { s: [0.8, 1.2] });
  },
};

/** Tombe : dalle, stèle, croix peinte. */
function tombTemplate(scene){
  const BB = window.BABYLON;
  const { Geo, Template, texMat } = GEO;
  const g = new Geo();
  const slab = BB.MeshBuilder.CreateBox('t', { width: 0.9, height: 0.25, depth: 1.9 }, null); slab.position.y = 0.125;
  g.add(slab, null, [1, 2]);
  const st = BB.MeshBuilder.CreateBox('s', { width: 0.8, height: 0.9, depth: 0.15 }, null); st.position.set(0, 0.45, -0.95);
  g.add(st, null, [1, 1]);
  const cr = BB.MeshBuilder.CreateBox('c', { width: 0.08, height: 0.5, depth: 0.08 }, null); cr.position.set(0, 1.12, -0.95); g.add(cr);
  const cr2 = BB.MeshBuilder.CreateBox('c2', { width: 0.32, height: 0.08, depth: 0.08 }, null); cr2.position.set(0, 1.2, -0.95); g.add(cr2);
  return new Template([g.build('tomb', scene, texMat(scene, 'tombStone', () => T.tileConcrete(71, { ramp: [[0, '#8f8a82'], [0.5, '#b5b0a6'], [1, '#d4d0c8']] })))], { radius: 1.0, height: 1.3, shadow: 0.45 });
}

/** Eau peinte (lagune, lac) : profondeur, reflets du ciel, vaguelettes irrégulières. */
function water(seed, night){
  const S = 256;
  const deep = night ? '#06131f' : '#134a58', mid = night ? '#0f2740' : '#1f6b78', light = night ? '#2f4a78' : '#57a8a8';
  const c = T.tileGrass(seed, { ramp: [[0, deep], [0.45, mid], [0.85, light], [1, light]], count: 0 });
  const ctx = c.getContext('2d'); const R = rng(seed + 3);
  ctx.lineCap = 'round';
  for(let i = 0; i < 320; i++){
    const x = R() * S, y = R() * S, l = 4 + R() * 26, a = (R() - 0.5) * 0.7;
    ctx.strokeStyle = night ? `rgba(150,180,235,${0.05 + R() * 0.18})` : `rgba(215,245,250,${0.06 + R() * 0.22})`;
    ctx.lineWidth = 0.8 + R() * 1.8;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + l * 0.3, y - 3 + a * 6, x + l * 0.7, y + 3 - a * 6, x + l, y + a * 4);
    ctx.stroke();
  }
  for(let i = 0; i < 120; i++){ // écume et reflets ponctuels
    const x = R() * S, y = R() * S;
    ctx.fillStyle = night ? 'rgba(180,205,255,0.12)' : 'rgba(235,255,255,0.16)';
    ctx.beginPath(); ctx.ellipse(x, y, 2 + R() * 7, 1 + R() * 2, R() * 3, 0, 7); ctx.fill();
  }
  return c;
}

/**
 * Pose des éléments le long de la voie, décalés d'un côté (offset en
 * unités, signe = côté), tous les `step` unités.
 */
function laneFollow(c, tpls, offset, step, o = {}){
  const P = c.path;
  if(!P) return;
  const list = Array.isArray(tpls) ? tpls : [tpls];
  let acc = step * 0.5 + c.R() * step * 0.5;
  for(let k = 0; k < P.length - 1; k++){
    const a = P[k], b = P[k + 1];
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
    const nx = -dz / L, nz = dx / L;
    for(let t = acc; t < L; t += step){
      const x = a.x + dx / L * t + nx * offset + (c.R() - 0.5) * (o.jitter || 0);
      const z = a.z + dz / L * t + nz * offset;
      const tpl = c.R.pick(list);
      let rot = o.rotAlong ? -Math.atan2(dz, dx) : null;
      if(o.face === -1 && rot != null) rot += Math.PI;
      let clear = true;
      for(const q of c.reserved) if(Math.hypot(q.x - x, q.z - z) < q.r + tpl.radius) clear = false;
      if(clear && !c.overlaps(x, z, tpl.radius * 0.5)) c.put(tpl, x, z, { rot, pad: 0.5 });
    }
    acc = (acc - L) % step; if(acc < 0) acc += step;
  }
}

// ════════════════════════════════════════════════════════════
// FORÊT DU BANCO
// ════════════════════════════════════════════════════════════
const banco = {
  light: () => LIGHTS.forest,
  ground(h){
    return {
      base: { tile: T.tileGrass(21, { ...PAL.grassLush, count: 3000 }), world: 2.6 },
      layers: [
        h2 => h2.layer(T.tileDirt(22, PAL.soil), 4, patches(h2, 1, 4, 0.58, 0.66)),
        h2 => h2.layer(T.tileDirt(23, PAL.soil), 3, borderMask(h2, 2.5)),
        h2 => h2.layer(T.tileDirt(24, { ...PAL.soil, ramp: [[0, '#4a3420'], [0.5, '#6a4c30'], [1, '#86623e']], pebbles: 90 }), 3.5, laneMask(h2, 0.55, 1.0, 0.6)),
        h2 => {
          // racines qui traversent le chemin
          sprinkle(h2, 40, (x, z, d) => d < h2.laneHalf * 1.3, (ctx, R, ppu) => {
            ctx.rotate(R() * 6.28); ctx.strokeStyle = 'rgba(40,26,14,0.7)'; ctx.lineWidth = ppu * 0.09; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(ppu * 0.5, ppu * 0.2, ppu * 0.9, -ppu * 0.2, ppu * 1.5, ppu * 0.1); ctx.stroke();
            ctx.strokeStyle = 'rgba(120,90,60,0.35)'; ctx.lineWidth = ppu * 0.03; ctx.stroke();
          });
          sprinkle(h2, 1300, () => true, leafDecal(['#4a3a18', '#6a5020', '#8a6a28', '#3a4a18', '#a0501a']));
          // taches de soleil sous la canopée
          h2.ctx.globalCompositeOperation = 'soft-light';
          sprinkle(h2, 160, () => true, stainDecal('rgba(255,245,200,A)', 0.9, 0.6));
          h2.ctx.globalCompositeOperation = 'source-over';
        },
      ],
      edgeDark: 0.45, edgeColor: '#0a1206',
    };
  },
  compose(c, S){
    const trees = [0, 1, 2].map(i => S('jungle' + i, () => N.broadleafTree(c.scene, { seed: 70 + i, key: 'jungle', leaves: PAL.jungle, h: 2.8 + i * 0.4, crown: 1.9 + i * 0.2, clumps: 6, r0: 0.28 })));
    const small = S('jungleS', () => N.broadleafTree(c.scene, { seed: 74, key: 'jungle', leaves: PAL.jungle, h: 1.8, crown: 1.2, clumps: 4 }));
    const palm = S('oilpalm', () => N.palmTree(c.scene, { seed: 75, h: 3.0, lean: 0.3, fronds: 12 }));
    const bushT = [0, 1].map(i => S('jbush' + i, () => N.bush(c.scene, { seed: 76 + i, key: 'jbush', leaves: PAL.jungle, r: 0.6 + i * 0.2 })));
    const fern = S('fern', () => N.groundCover(c.scene, { seed: 78, kind: 'fern', key: 'fern', h: 0.75, tufts: 3, spread: 0.3 }));
    const grass = S('jgrass', () => N.groundCover(c.scene, { seed: 79, key: 'jgrass', pal: PAL.grassLush, h: 0.55, tufts: 4 }));
    const rockT = S('mossRock', () => N.rock(c.scene, { seed: 80, key: 'moss', r: 0.7, top: '#3f6a22', topK: 0.85 }));
    const log = S('log', () => fallenLog(c.scene));
    // canopée dense au fond, sur les côtés ; lisière basse en sous-bois
    c.clusters(trees, 30, 5, 4, Z.top(9), { s: [1.0, 1.35], pad: 0.55 });
    c.clusters([...trees, palm], 14, 4, 3, Z.and(Z.sides, Z.not(Z.bottom(3))), { s: [0.9, 1.2], pad: 0.55 });
    c.clusters([small, ...bushT], 24, 4, 2.5, Z.bottom(6), { s: [0.8, 1.1], pad: 0.6 });
    c.scatter([small, palm], 14, Z.and(Z.field, Z.nearLane(2.5, 99)), { s: [0.8, 1.0] });
    c.scatter(bushT, 42, Z.and(Z.field, Z.nearLane(0.8, 99)), { s: [0.8, 1.2] });
    c.scatter([rockT, log], 20, Z.and(Z.field, Z.nearLane(1.0, 99)), { s: [0.7, 1.2] });
    c.scatter(fern, 260, Z.not(Z.nearLane(-9, 0.2)), { solid: false, shadow: false, s: [0.7, 1.4], noise: 0.35 });
    c.scatter(grass, 280, Z.not(Z.nearLane(-9, 0.1)), { solid: false, shadow: false, s: [0.7, 1.3] });
  },
};

/** Tronc tombé, moussu. */
function fallenLog(scene){
  const BB = window.BABYLON; const { Geo, Template, texMat, aoColor } = GEO;
  const g = new Geo();
  const t = BB.MeshBuilder.CreateCylinder('log', { diameter: 0.5, height: 2.6, tessellation: 10 }, null);
  t.rotation.z = Math.PI / 2; t.position.y = 0.22;
  g.add(t, (x, y, z, nx, ny) => { const v = 0.5 + Math.max(0, ny) * 0.6; return ny > 0.5 ? [0.45, 0.6, 0.3] : [v, v, v]; }, [2, 2], true);
  return new Template([g.build('log', scene, texMat(scene, 'bark_log', () => T.texBark(81, { moss: '#3f5a22' })))], { radius: 1.3, height: 0.5, shadow: 0.5 });
}

// ════════════════════════════════════════════════════════════
// ROYAUME DE L'ESSENCE (variantes : lac, feu)
// ════════════════════════════════════════════════════════════
const essence = {
  light: (v) => v.variant === 'feu' ? LIGHTS.fire : LIGHTS.mystic,
  ground(h, v){
    if(v.variant === 'feu') return volcanoGround(h);
    const glowGrass = T.tileGrass(31, { ramp: [[0, '#1d3a4a'], [0.4, '#2a5a66'], [0.8, '#3f8a8a'], [1, '#6ac0b8']], blades: ['#2a6a70', '#3f9090', '#6ac8c0', '#9ae8dc', '#1f4a58'] });
    const marble = T.tileCobble(32, { stones: ['#cdd8dc', '#e4ecee', '#b8c6cc', '#f2f6f8'], grout: '#6a8a9a', cells: 18, groutWidth: 0.02 });
    const layers = [
      h2 => h2.layer(T.tileGrass(33, { ramp: [[0, '#2a2a5a'], [0.5, '#40408a'], [1, '#6a6ab8']], blades: ['#5050a0', '#7070c8', '#9a9ae8'] }), 3, patches(h2, 1, 3.2, 0.68, 0.76)),
      h2 => h2.layer(marble, 3, laneMask(h2, 0.7, 0.95, 0.2)),
    ];
    if(v.variant === 'lac') layers.unshift(h2 => h2.layer(water(34, false), 8, (x, z, d) => smooth(h2.laneHalf * 2.2, h2.laneHalf * 2.6, d) * smooth(-2, 1.5, h2.edgeDist(x, z))));
    return {
      base: { tile: glowGrass, world: 4 }, layers, edgeDark: 0.5, edgeColor: '#0a0620',
      // runes lumineuses gravées dans les dalles
      emissive: (h2) => {
        sprinkle(h2, 30, (x, z, d) => d < h2.laneHalf * 0.6, (ctx, R, ppu) => {
          ctx.strokeStyle = '#6ae8ff'; ctx.lineWidth = ppu * 0.05; ctx.globalAlpha = 0.9;
          ctx.beginPath(); ctx.arc(0, 0, ppu * 0.6, 0, 7); ctx.stroke();
          for(let i = 0; i < 6; i++){ const a = i / 6 * 6.28; ctx.beginPath(); ctx.moveTo(Math.cos(a) * ppu * 0.25, Math.sin(a) * ppu * 0.25); ctx.lineTo(Math.cos(a) * ppu * 0.55, Math.sin(a) * ppu * 0.55); ctx.stroke(); }
          ctx.globalAlpha = 1;
        });
      },
    };
  },
  compose(c, S, v){
    if(v.variant === 'feu') return volcanoCompose(c, S);
    const tree = [0, 1].map(i => S('spirit' + i, () => N.broadleafTree(c.scene, { seed: 90 + i, key: 'spirit', leaves: PAL.mystic, bark: { ramp: [[0, '#8a9aa8'], [0.5, '#c8d4dc'], [1, '#eef4f8']] }, h: 2.6, crown: 1.6, flat: 0.7 })));
    const cr = [S('crysA', () => N.crystals(c.scene, { seed: 92, color: '#7fe0ff', glow: '#1a5a7a', key: 'a', h: 1.6 })), S('crysB', () => N.crystals(c.scene, { seed: 93, color: '#c8a0ff', glow: '#3a1a6a', key: 'b', h: 1.2 }))];
    const col = [S('colM', () => K.pillar(c.scene, { tile: 'marble', h: 3.2 })), S('colMb', () => K.pillar(c.scene, { tile: 'marble', h: 3.2, broken: true, seed: 94 }))];
    const rockT = S('mRock', () => N.rock(c.scene, { seed: 95, key: 'mrock', r: 0.7, tile: { ramp: [[0, '#3a3a5a'], [0.5, '#5a5a80'], [1, '#8080a8']] }, top: '#6ac0b8', topK: 0.7 }));
    const grass = S('mGrass', () => N.groundCover(c.scene, { seed: 96, key: 'mgrass', pal: { blades: ['#2a6a70', '#3f9090', '#6ac8c0', '#9ae8dc'], flowers: ['#f8e8ff', '#c8a8ff'] }, h: 0.5 }));
    c.clusters(tree, 16, 3, 3, Z.top(8), { s: [1, 1.3], pad: 0.6 });
    c.clusters([...cr, rockT], 10, 3, 2, Z.sides, { s: [0.9, 1.3] });
    c.row(col, 'top', { step: 3.6, offset: 0.2, gapChance: 0.25 });
    c.scatter(cr, 12, Z.and(Z.field, Z.nearLane(1, 99)), { s: [0.7, 1.1] });
    c.scatter([rockT, col[1]], 6, Z.and(Z.field, Z.nearLane(2, 99)), { s: [0.7, 1] });
    c.clusters([rockT, cr[0]], 10, 3, 2, Z.bottom(6), { s: [0.7, 1.0] });
    c.scatter(grass, 200, Z.not(Z.nearLane(-9, 0.1)), { solid: false, shadow: false, s: [0.7, 1.3] });
    // Reliques du Royaume : la kora du griot et l'artefact de l'Équilibre.
    c.scatterModel('HARPE.glb', 3, Z.and(Z.field, Z.nearLane(2, 99)), { height: 1.3, r: 0.7 });
    c.scatterModel('BOUSSOLE.glb', 2, Z.and(Z.fieldTop, Z.nearLane(3, 99)), { height: 1.7, r: 0.9 });
    floatingMotes(c, S, '#a8f0ff');
  },
};

/** Lucioles / éclats d'Essence en suspension (émissifs, sans ombre). */
function floatingMotes(c, S, color){
  const mote = S('mote' + color, () => {
    const BB = window.BABYLON; const { Geo, Template, colorMat } = GEO;
    const g = new Geo();
    const s = BB.MeshBuilder.CreateIcoSphere('m', { radius: 0.06, subdivisions: 1 }, null); g.add(s);
    return new Template([g.build('mote', c.scene, colorMat(c.scene, 'mote' + color, color, { emissive: color }))], { radius: 0.05, height: 0.1, shadow: 0 });
  });
  const R = c.R, P = c.play;
  for(let i = 0; i < (c.small ? 50 : 110); i++){
    const x = P.x0 + R() * (P.x1 - P.x0), z = P.z1 + R() * (P.z0 - P.z1);
    c.put(mote, x, z, { y: 0.6 + R() * 2.4, solid: false, shadow: false, s: 0.6 + R() });
  }
}

// ── Volcan / chambre de feu (partagé : Essence-feu, éruption) ──
function volcanoGround(h){
  return {
    base: { tile: T.tileRock(41, { ramp: [[0, '#0e0a0a'], [0.5, '#221a18'], [1, '#3a2c26']], cells: 30 }), world: 3 },
    layers: [
      h2 => h2.layer(T.tileDirt(42, { ramp: [[0, '#1a1210'], [0.5, '#2e2220'], [1, '#463430']], stones: ['#2a2020', '#3a2e2a', '#1a1414'], pebbles: 200 }), 4, laneMask(h2, 0.7, 1.05, 0.4)),
      h2 => { sprinkle(h2, 300, () => true, stainDecal('rgba(255,120,40,A)', 0.4, 0.12)); },
    ],
    edgeDark: 0.6, edgeColor: '#0a0000',
    emissive: (h2) => {
      // coulées et fissures de lave (lumineuses)
      const ctx = h2.ctx;
      const R = h2.rnd;
      for(let i = 0; i < 70; i++){
        const B = h2.bounds;
        let x = B.x0 + R() * (B.x1 - B.x0), z = B.z1 + R() * (B.z0 - B.z1);
        if(h2.distAt(x, z) < h2.laneHalf * 1.1) continue;
        let a = R() * 6.28;
        ctx.strokeStyle = R() < 0.5 ? '#ff6a10' : '#ffa030'; ctx.lineCap = 'round';
        ctx.lineWidth = h2.ppu * (0.05 + R() * 0.12);
        ctx.beginPath(); let [px, py] = h2.toC(x, z); ctx.moveTo(px, py);
        for(let s = 0; s < 14; s++){ a += (R() - 0.5) * 1.1; x += Math.cos(a) * 0.35; z += Math.sin(a) * 0.35; [px, py] = h2.toC(x, z); ctx.lineTo(px, py); }
        ctx.stroke();
      }
      ctx.filter = 'blur(6px)'; ctx.globalAlpha = 0.6; ctx.drawImage(ctx.canvas, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1;
    },
  };
}
function volcanoCompose(c, S){
  const basaltP = [S('bas', () => K.pillar(c.scene, { tile: 'basalt', h: 3 })), S('basB', () => K.pillar(c.scene, { tile: 'basalt', broken: true, seed: 97 }))];
  const rockT = [0, 1].map(i => S('vrock' + i, () => N.rock(c.scene, { seed: 98 + i, key: 'vrock', r: 0.8 + i * 0.4, tile: { ramp: [[0, '#0e0a0a'], [0.5, '#221a18'], [1, '#3a2c26']] }, top: '#3a1a10', topK: 0.3 })));
  const dead = S('vdead', () => N.deadTree(c.scene, { seed: 99, key: 'burnt', bark: { ramp: [[0, '#0a0808'], [1, '#2a2220']] } }));
  const ember = S('ember', () => N.crystals(c.scene, { seed: 100, color: '#ff7a20', glow: '#aa2a00', key: 'ember', h: 0.9 }));
  c.clusters([...rockT, ...basaltP], 22, 4, 3, Z.top(8), { s: [1, 1.6] });
  c.clusters(rockT, 16, 3, 2.5, Z.or(Z.sides, Z.bottom(5)), { s: [0.8, 1.3] });
  c.scatter([dead, ember, rockT[0]], 16, Z.and(Z.field, Z.nearLane(1.2, 99)), { s: [0.7, 1.1] });
  floatingMotes(c, S, '#ff9a40');
}

// ════════════════════════════════════════════════════════════
// BORN LAND
// ════════════════════════════════════════════════════════════
const born = {
  light: () => LIGHTS.grey,
  ground(h){
    return {
      base: { tile: T.tileDirt(51, { ramp: [[0, '#4a4640'], [0.5, '#66605a'], [1, '#86807a']], stones: ['#7a746c', '#5a5650', '#9a948c'], cracks: 0.9, pebbles: 120 }), world: 5 },
      layers: [
        h2 => h2.layer(T.tileGrass(52, { ramp: [[0, '#4a4a3a'], [0.5, '#66664e'], [1, '#86866a']], blades: ['#6a6a50', '#8a8a6a', '#a8a888', '#4a4a38'] }), 4, patches(h2, 1, 3.2, 0.55, 0.65)),
        h2 => h2.layer(T.tileDirt(53, { ramp: [[0, '#5a5650'], [0.5, '#76706a'], [1, '#948e86']], pebbles: 60, cracks: 0.4 }), 4, laneMask(h2, 0.6, 1.0, 0.5)),
      ],
      edgeDark: 0.5, tint: { color: '#b8b0c8', alpha: 0.12, blend: 'overlay' },
    };
  },
  compose(c, S){
    const mono = [S('mono', () => K.pillar(c.scene, { tile: 'basalt', h: 4.2 })), S('monoB', () => K.pillar(c.scene, { tile: 'basalt', broken: true, seed: 110 }))];
    const dead = [0, 1].map(i => S('bdead' + i, () => N.deadTree(c.scene, { seed: 111 + i, key: 'b' })));
    const rockT = [0, 1].map(i => S('brock' + i, () => N.rock(c.scene, { seed: 113 + i, key: 'brock', r: 0.8 + i * 0.5, tile: { ramp: [[0, '#3a3834'], [0.5, '#5a5650'], [1, '#7a766e']] }, top: '#8a8a70', topK: 0.4 })));
    const grass = S('bgrass', () => N.groundCover(c.scene, { seed: 115, key: 'bgrass', pal: { blades: ['#6a6a50', '#8a8a6a', '#a8a888'] }, h: 0.5 }));
    c.clusters([...rockT, ...mono], 16, 3, 3, Z.top(8), { s: [1, 1.5] });
    c.row(mono, 'top', { step: 5, offset: 0.6, gapChance: 0.3 });
    c.clusters([...dead, rockT[0]], 12, 3, 3, Z.or(Z.sides, Z.bottom(5)), { s: [0.8, 1.2] });
    c.scatter([...dead, rockT[0]], 10, Z.and(Z.field, Z.nearLane(1.5, 99)), { s: [0.7, 1] });
    c.scatter(grass, 150, Z.not(Z.nearLane(-9, 0.2)), { solid: false, shadow: false, noise: 0.4 });
  },
};

// ════════════════════════════════════════════════════════════
// PÔLE NORD
// ════════════════════════════════════════════════════════════
const polar = {
  light: () => LIGHTS.snow,
  ground(h){
    return {
      base: { tile: T.tileSnow(61), world: 4 },
      layers: [
        h2 => h2.layer(T.tileRock(62, { ramp: [[0, '#6a8aa8'], [0.5, '#9ab8d0'], [1, '#c8e0f0']], cells: 26 }), 3, patches(h2, 1, 3.6, 0.64, 0.7)),
        h2 => h2.layer(T.tileSnow(63), 4, laneMask(h2, 0.6, 1.0, 0.4), { alpha: 0.9 }),
        h2 => { // piétinement : neige tassée grise-bleue + empreintes
          h2.layer(T.tileDirt(64, { ramp: [[0, '#8a9aac'], [0.5, '#a8b8c8'], [1, '#c8d4e0']], stones: ['#6a7a8c'], pebbles: 30, cracks: 0 }), 4, laneMask(h2, 0.3, 0.8, 0.8), { alpha: 0.8 });
          sprinkle(h2, 700, (x, z, d) => d < h2.laneHalf * 0.8, (ctx, R, ppu) => { ctx.rotate(R() * 0.6 - 0.3); ctx.fillStyle = 'rgba(70,90,120,0.3)'; ctx.beginPath(); ctx.ellipse(0, 0, ppu * 0.07, ppu * 0.13, 0, 0, 7); ctx.fill(); });
        },
      ],
      edgeDark: 0.35, edgeColor: '#1a2a40',
    };
  },
  compose(c, S){
    const pine = [0, 1, 2].map(i => S('spine' + i, () => N.pineTree(c.scene, { seed: 120 + i, snow: true, h: 3 + i * 0.5, r: 1.1 + i * 0.15 })));
    const ice = [0, 1].map(i => S('ice' + i, () => N.rock(c.scene, { seed: 123 + i, key: 'ice', r: 0.8 + i * 0.5, tile: { ramp: [[0, '#5a7a9a'], [0.5, '#8ab0cc'], [1, '#c8e4f4']] }, top: '#ffffff', topK: 0.95, spec: 0.6 })));
    const drift = S('drift', () => N.rock(c.scene, { seed: 125, key: 'drift', r: 1.2, tall: 0.35, tile: { ramp: [[0, '#b8c8d8'], [1, '#ffffff']] }, top: '#ffffff', topK: 1 }));
    const pyl = S('pylon', () => K.pylon(c.scene, { h: 3.8 }));
    const cr = S('iceCrys', () => N.crystals(c.scene, { seed: 126, color: '#bfe8ff', glow: '#2a5a7a', key: 'ice', h: 1.4 }));
    c.clusters(pine, 26, 4, 3.5, Z.top(9), { s: [0.95, 1.3], pad: 0.6 });
    c.clusters([...pine, ...ice], 12, 3, 3, Z.and(Z.sides, Z.not(Z.bottom(3))), { s: [0.9, 1.2] });
    c.row(pyl, 'top', { step: 9, offset: 0.4, gapChance: 0.2 });
    c.clusters([drift, ...ice], 16, 3, 2.5, Z.bottom(6), { s: [0.8, 1.2] });
    c.scatter([drift, cr, ice[0]], 30, Z.and(Z.field, Z.nearLane(1.0, 99)), { s: [0.7, 1.3] });
    c.clusters([pine[0], ice[0]], 10, 3, 3, Z.and(Z.field, Z.nearLane(3, 99)), { s: [0.8, 1.0] });
    c.scatter(pyl, 3, Z.and(Z.fieldTop, Z.nearLane(2, 6)), { fixed: true });
    // La base de Sgrün : un vaisseau posé sur la neige et ses sentinelles.
    c.scatterModel('AVION.glb', 2, Z.top(9), { height: 2.4, r: 3.6, fixed: true, shadow: 0.6 });
    for(const f of ['ARMURE_2.glb', 'ARMURE3.glb']) c.scatterModel(f, 2, Z.and(Z.top(7), Z.field), { height: 2.3, r: 0.8, fixed: true });
  },
};

// ════════════════════════════════════════════════════════════
// MALI / SAHEL
// ════════════════════════════════════════════════════════════
const sahel = {
  light: (v) => v.variant === 'harmattan' ? LIGHTS.dust : LIGHTS.golden,
  ground(h, v){
    return {
      base: { tile: T.tileSand(71, PAL.sand), world: 4 },
      layers: [
        h2 => h2.layer(T.tileDirt(72, PAL.laterite), 5, patches(h2, 1, 3.6, 0.5, 0.62)),
        h2 => h2.layer(T.tileGrass(73, { ...PAL.grassDry, count: 1600 }), 4, patches(h2, 2, 4, 0.62, 0.7)),
        h2 => h2.layer(T.tileDirt(74, { ramp: [[0, '#7a5030'], [0.5, '#9a6a40'], [1, '#b8885a']], pebbles: 90, cracks: 0.7 }), 4, laneMask(h2, 0.65, 1.05, 0.5)),
        h2 => { sprinkle(h2, 400, (x, z, d) => d > h2.laneHalf, (ctx, R, ppu) => { ctx.fillStyle = R.pick(['#8a6a40', '#6a4a28', '#b89868']); ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(0, 0, ppu * (0.03 + R() * 0.05), 0, 7); ctx.fill(); ctx.globalAlpha = 1; }); },
      ],
      edgeDark: 0.4, tint: v.variant === 'harmattan' ? { color: '#e8c890', alpha: 0.3, blend: 'screen' } : null,
    };
  },
  compose(c, S, v){
    const dj = [0, 1].map(i => S('djenne' + i, () => K.djenne(c.scene, { seed: 130 + i, w: 4 + i * 1.2 })));
    const ruin = [S('ruin', () => K.ruinWall(c.scene, { seed: 132 })), S('ruin2', () => K.ruinWall(c.scene, { seed: 133, len: 3 }))];
    const stoneWall = S('kongWall', () => K.ruinWall(c.scene, { seed: 134, stone: true, len: 4.5, h: 2.8 }));
    const bao = S('baobab', () => N.baobab(c.scene, { seed: 135 }));
    const aca = [0, 1].map(i => S('acacia' + i, () => N.acacia(c.scene, { seed: 136 + i })));
    const gran = S('granary', () => K.granary(c.scene, {}));
    const jarT = S('jars', () => K.jars(c.scene, {}));
    const rockT = S('sRock', () => N.rock(c.scene, { seed: 138, key: 'sand', r: 0.7, tile: { ramp: [[0, '#6a4428'], [0.5, '#9a6a40'], [1, '#c89a68']] }, top: '#d8b888', topK: 0.5 }));
    const grass = S('sGrass', () => N.groundCover(c.scene, { seed: 139, key: 'sgrass', pal: PAL.grassDry, h: 0.55, tufts: 4 }));
    if(v.variant === 'kong'){
      c.row(stoneWall, 'top', { step: 4.3, offset: 0.6, jitter: 0, gapChance: 0.08, rot: 0 });
      c.row(stoneWall, 'bottom', { step: 4.3, offset: 0.9, jitter: 0, gapChance: 0.3, rot: 0 });
      c.row(dj, 'top', { step: 6, offset: 4 });
    } else if(v.variant === 'harmattan'){
      c.clusters([bao, ...aca, rockT], 14, 3, 3, Z.top(8), { s: [0.9, 1.3] });
      c.row(ruin, 'top', { step: 5, offset: 0.8, gapChance: 0.4 });
    } else {
      c.row(dj, 'top', { step: 6.5, offset: 3, gapChance: 0.2, rot: 0 });
      c.row(ruin, 'top', { step: 4.2, offset: 0.4, gapChance: 0.35, rot: 0 });
      c.scatter(ruin, 8, Z.and(Z.field, Z.nearLane(2, 99)), { s: [0.6, 0.9] });
    }
    c.clusters([bao, ...aca], 8, 2, 3, Z.and(Z.top(10), Z.not(Z.top(3))), { s: [0.9, 1.2] });
    c.row([...aca, bao], 'left', { step: 4.5, offset: 2 }); c.row([...aca, bao], 'right', { step: 4.5, offset: 2 });
    c.clusters([gran, jarT], 5, 3, 2, Z.and(Z.top(6), Z.field), { s: [0.9, 1.1] });
    c.clusters([rockT, jarT, grass], 14, 3, 2, Z.bottom(5), { s: [0.8, 1.2] });
    c.scatter([rockT, jarT, aca[0]], 22, Z.and(Z.field, Z.nearLane(1.2, 99)), { s: [0.7, 1.1] });
    c.scatter(grass, 170, Z.not(Z.nearLane(-9, 0.3)), { solid: false, shadow: false, noise: 0.42 });
  },
};

// ════════════════════════════════════════════════════════════
// BANDIAGARA (falaises) / GROTTE
// ════════════════════════════════════════════════════════════
const canyon = {
  light: (v) => v.variant === 'cave' ? LIGHTS.cave : LIGHTS.golden,
  ground(h, v){
    if(v.variant === 'cave') return {
      base: { tile: T.tileRock(81, { ramp: [[0, '#1c1612'], [0.5, '#34281f'], [1, '#4c3c2e']], cells: 30 }), world: 3 },
      layers: [
        h2 => h2.layer(T.tileDirt(82, { ramp: [[0, '#2e2218'], [0.5, '#46362a'], [1, '#5e4a3a']], pebbles: 160, cracks: 0.3 }), 4, laneMask(h2, 0.6, 1.0, 0.5)),
        h2 => { sprinkle(h2, 120, () => true, stainDecal('rgba(0,0,0,A)', 0.8, 0.35)); },
      ],
      edgeDark: 0.7,
      emissive: (h2) => { sprinkle(h2, 60, (x, z, d) => d > h2.laneHalf * 1.2, stainDecal('rgba(90,200,255,A)', 0.35, 0.5)); },
    };
    return {
      // plateau de grès : le sable domine, la roche affleure par plaques
      base: { tile: T.tileSand(84, { ramp: [[0, '#a0643a'], [0.5, '#c0844e'], [1, '#d8a068']] }), world: 4 },
      layers: [
        h2 => h2.layer(T.tileRock(83, { ramp: [[0, '#6a3a20'], [0.5, '#9a5a32'], [1, '#c07a48']], cells: 30 }), 3.2, patches(h2, 1, 3.2, 0.62, 0.72)),
        h2 => h2.layer(T.tileGrass(85, { ...PAL.grassDry, count: 1400 }), 4, patches(h2, 2, 3, 0.66, 0.72)),
        h2 => h2.layer(T.tileDirt(86, { ramp: [[0, '#7a4428'], [0.5, '#9a5a36'], [1, '#b87448']], pebbles: 220, pebbleSize: 4, stones: ['#a86a44', '#7a4a2e', '#c88a5e'] }), 4, laneMask(h2, 0.65, 1.05, 0.5)),
      ],
      edgeDark: 0.45,
    };
  },
  compose(c, S, v){
    const cliffs = [0, 1, 2].map(i => S('cliff' + i + v.variant, () => N.cliff(c.scene, { seed: 140 + i, key: v.variant === 'cave' ? 'cave' : 'band', h: 3 + i * 0.8, r: 1.6 + i * 0.4,
      pal: v.variant === 'cave' ? { bands: ['#2a2018', '#3a2c22', '#4a3a2c', '#201810'] } : null, top: v.variant === 'cave' ? '#3a2c22' : '#c08850' })));
    const boulder = [0, 1].map(i => S('boulder' + i + v.variant, () => N.rock(c.scene, { seed: 143 + i, key: 'b' + v.variant, r: 0.7 + i * 0.5,
      tile: v.variant === 'cave' ? { ramp: [[0, '#1c1612'], [0.5, '#34281f'], [1, '#4c3c2e']] } : { ramp: [[0, '#6a3a20'], [0.5, '#9a5a32'], [1, '#c07a48']] }, top: v.variant === 'cave' ? '#4c3c2e' : '#d8a068', topK: 0.4 })));
    c.clusters(cliffs, 24, 3, 3, Z.top(10), { s: [1, 1.4], pad: 0.55 });
    c.clusters(cliffs, 12, 2, 3, Z.and(Z.sides, Z.not(Z.bottom(2))), { s: [0.9, 1.2], pad: 0.55 });
    c.clusters(boulder, 16, 3, 2.5, Z.bottom(5), { s: [0.7, 1.1] });
    if(v.variant === 'cave'){
      const stal = S('stal', () => N.rock(c.scene, { seed: 146, key: 'stal', r: 0.45, tall: 3.5, tile: { ramp: [[0, '#2a2018'], [1, '#6a5a48']] }, top: '#8a7a68', topK: 0.3 }));
      const cr = S('caveCrys', () => N.crystals(c.scene, { seed: 147, color: '#6ad8ff', glow: '#1a6a8a', key: 'cave', h: 1.3 }));
      c.scatter([stal, cr, boulder[0]], 22, Z.and(Z.field, Z.nearLane(1, 99)), { s: [0.7, 1.2] });
      c.clusters([stal, cr], 10, 3, 2, Z.top(6), { s: [1, 1.4] });
    } else {
      const gran = S('granary', () => K.granary(c.scene, {}));
      const aca = S('acacia0', () => N.acacia(c.scene, { seed: 136 }));
      const grass = S('sGrass', () => N.groundCover(c.scene, { seed: 139, key: 'sgrass', pal: PAL.grassDry, h: 0.55, tufts: 4 }));
      c.clusters(gran, 5, 3, 1.8, Z.and(Z.top(3), Z.field), { s: [0.9, 1.1], fixed: true });
      c.scatter([boulder[0], boulder[1], aca], 12, Z.and(Z.field, Z.nearLane(1.5, 99)), { s: [0.7, 1.1] });
      c.scatter(grass, 120, Z.not(Z.nearLane(-9, 0.3)), { solid: false, shadow: false, noise: 0.45 });
    }
  },
};

// ════════════════════════════════════════════════════════════
// FOSSE MARINE (variante éruption)
// ════════════════════════════════════════════════════════════
const abyss = {
  light: (v) => v.variant === 'eruption' ? LIGHTS.fire : LIGHTS.sea,
  ground(h, v){
    if(v.variant === 'eruption') return volcanoGround(h);
    return {
      base: { tile: T.tileSand(91, { ramp: [[0, '#2a5a5a'], [0.5, '#4a7e76'], [1, '#6a9e8e']] }), world: 4 },
      layers: [
        h2 => h2.layer(T.tileRock(92, { ramp: [[0, '#16323a'], [0.5, '#244a50'], [1, '#3a6a6a']], cells: 28 }), 3, patches(h2, 1, 3.2, 0.58, 0.66)),
        h2 => h2.layer(T.tileSand(93, { ramp: [[0, '#5a8a80'], [0.5, '#7aa898'], [1, '#98c4b0']] }), 5, laneMask(h2, 0.6, 1.0, 0.5)),
        h2 => { // caustiques : réseau lumineux ondulant
          const ctx = h2.ctx; ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = 'rgba(180,255,240,0.13)'; ctx.lineWidth = h2.ppu * 0.05;
          const R = h2.rnd;
          for(let i = 0; i < 1400; i++){
            const x = R() * h2.W, y = R() * h2.H, r = h2.ppu * (0.3 + R() * 0.4);
            ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, R() * 3, 0, 5 + R()); ctx.stroke();
          }
          ctx.globalCompositeOperation = 'source-over';
        },
      ],
      edgeDark: 0.6, edgeColor: '#001014',
    };
  },
  compose(c, S, v){
    if(v.variant === 'eruption') return volcanoCompose(c, S);
    const corals = ['#e0605a', '#f0a040', '#c070d0', '#50c0b0'].map((col, i) => S('coral' + i, () => K.coral(c.scene, { seed: 150 + i, color: col })));
    const kelpT = S('kelp', () => N.kelp(c.scene, { seed: 154, h: 2.6 }));
    const rockT = [0, 1].map(i => S('srock' + i, () => N.rock(c.scene, { seed: 155 + i, key: 'sea', r: 0.9 + i * 0.5, tile: { ramp: [[0, '#10262c'], [0.5, '#1e3e44'], [1, '#2e5a5a']] }, top: '#6a9a50', topK: 0.6 })));
    const pearl = S('pearlCrys', () => N.crystals(c.scene, { seed: 157, color: '#f0f4ff', glow: '#4a6a8a', key: 'nacre', h: 1.0 }));
    c.clusters([kelpT, ...rockT], 24, 4, 3, Z.top(9), { s: [1, 1.5], pad: 0.5 });
    c.clusters([...corals, rockT[0]], 16, 4, 2.5, Z.or(Z.sides, Z.bottom(6)), { s: [0.9, 1.4] });
    c.scatter([...corals, pearl], 22, Z.and(Z.field, Z.nearLane(1, 99)), { s: [0.7, 1.2] });
    c.scatter(kelpT, 14, Z.and(Z.fieldTop, Z.nearLane(2, 99)), { s: [0.8, 1.2] });
    floatingMotes(c, S, '#d8fff4');
  },
};

// ════════════════════════════════════════════════════════════
// LE VIDE
// ════════════════════════════════════════════════════════════
const voidB = {
  light: () => LIGHTS.void,
  ground(h){
    return {
      base: { tile: T.tileCrystal(101, { cells: 40 }), world: 3.4 },
      layers: [
        h2 => h2.layer(T.tileRock(102, { ramp: [[0, '#0a0614'], [0.5, '#1a1230'], [1, '#2a2048']], cells: 26 }), 3, patches(h2, 1, 3.2, 0.5, 0.6)),
        h2 => h2.layer(T.tileCrystal(103, { ramp: [[0, '#2a2050'], [0.6, '#4a3a80'], [1, '#7a68b8']], edge: '#e0d0ff', cells: 16 }), 4, laneMask(h2, 0.7, 1.0, 0.3)),
      ],
      edgeDark: 0.75, edgeColor: '#000',
      emissive: (h2) => {
        const R = h2.rnd, ctx = h2.ctx;
        for(let i = 0; i < 60; i++){
          const B = h2.bounds;
          let x = B.x0 + R() * (B.x1 - B.x0), z = B.z1 + R() * (B.z0 - B.z1), a = R() * 6.28;
          ctx.strokeStyle = '#9a6aff'; ctx.lineWidth = h2.ppu * 0.04;
          ctx.beginPath(); let [px, py] = h2.toC(x, z); ctx.moveTo(px, py);
          for(let s = 0; s < 10; s++){ a += (R() - 0.5) * 1.4; x += Math.cos(a) * 0.4; z += Math.sin(a) * 0.4; [px, py] = h2.toC(x, z); ctx.lineTo(px, py); }
          ctx.stroke();
        }
      },
    };
  },
  compose(c, S){
    const cr = [S('vcrA', () => N.crystals(c.scene, { seed: 160, color: '#8a5aff', glow: '#3a1a8a', key: 'va', h: 2.0 })), S('vcrB', () => N.crystals(c.scene, { seed: 161, color: '#d0b8ff', glow: '#4a2a9a', key: 'vb', h: 1.3 }))];
    const shard = [0, 1].map(i => S('shard' + i, () => N.rock(c.scene, { seed: 162 + i, key: 'void', r: 0.9 + i * 0.6, tall: 1.4, tile: { ramp: [[0, '#0a0614'], [0.5, '#1a1230'], [1, '#3a2a60']] }, top: '#6a4aaa', topK: 0.5 })));
    const colB = S('vcol', () => K.pillar(c.scene, { tile: 'basalt', broken: true, seed: 164 }));
    c.clusters([...shard, cr[0], colB], 22, 3, 3, Z.top(9), { s: [1, 1.5] });
    c.clusters([...cr, shard[0]], 14, 3, 2.5, Z.or(Z.sides, Z.bottom(5)), { s: [0.8, 1.2] });
    c.scatter([...cr, colB], 14, Z.and(Z.field, Z.nearLane(1.2, 99)), { s: [0.7, 1.1] });
    // éclats flottants
    const R = c.R, P = c.play;
    for(let i = 0; i < 26; i++){
      const x = P.x0 + R() * (P.x1 - P.x0), z = P.z0 + 1 + R() * 6;
      c.put(R.pick(shard), x, z, { y: 2 + R() * 3, s: 0.4 + R() * 0.5, solid: false, shadow: false });
    }
    c.scatterModel('BOUSSOLE.glb', 4, Z.and(Z.field, Z.nearLane(2, 99)), { height: 1.8, r: 1.0, y: null });
    c.scatterModel('ARMURE3.glb', 3, Z.top(8), { height: 2.4, r: 0.9 });
    floatingMotes(c, S, '#c8a8ff');
  },
};

// ════════════════════════════════════════════════════════════
// FORTERESSE DE SGRÜN
// ════════════════════════════════════════════════════════════
const sgrun = {
  light: () => LIGHTS.tech,
  ground(h, v){
    return {
      base: { tile: T.tileMetal(111), world: 3 },
      layers: [
        h2 => h2.layer(T.tileMetal(112, { ramp: [[0, '#262a33'], [0.5, '#353a46'], [1, '#4a5060']] }), 2, laneMask(h2, 0.9, 0.98, 0.05)),
        h2 => { sprinkle(h2, 200, () => true, stainDecal('rgba(0,0,0,A)', 0.6, 0.3)); },
      ],
      edgeDark: 0.7,
      emissive: (h2) => {
        // lignes d'énergie de part et d'autre de l'allée
        sprinkle(h2, 20000, (x, z, d) => Math.abs(d - h2.laneHalf * 0.94) < 0.03, (ctx, R, ppu) => { ctx.fillStyle = v.variant === 'engrenages' ? '#ffb040' : '#4ac8ff'; ctx.fillRect(-ppu * 0.05, -ppu * 0.05, ppu * 0.1, ppu * 0.1); });
      },
    };
  },
  compose(c, S, v){
    const pyl = S('pylonS', () => K.pylon(c.scene, { h: 4.2 }));
    const col = [S('sCol', () => K.pillar(c.scene, { tile: 'basalt', h: 4 })), S('sColB', () => K.pillar(c.scene, { tile: 'basalt', broken: true, seed: 170 }))];
    const cr = S('sCrys', () => N.crystals(c.scene, { seed: 171, color: '#5fd4ff', glow: '#0a4a6a', key: 'sg', h: 1.4 }));
    c.row(col, 'top', { step: 3.4, offset: 0.4, jitter: 0, gapChance: 0.05, rot: 0 });
    c.row(pyl, 'top', { step: 6.8, offset: 3 });
    c.row(col, 'bottom', { step: 3.4, offset: 0.6, jitter: 0, gapChance: 0.5, s: [0.5, 0.6] });
    if(v.variant === 'engrenages'){
      const gearT = [S('gearA', () => K.gear(c.scene, { r: 1.6 })), S('gearB', () => K.gear(c.scene, { r: 1.0 }))];
      c.scatter(gearT, 16, Z.and(Z.field, Z.nearLane(1.2, 99)), { s: [0.8, 1.3] });
      c.clusters(gearT, 8, 3, 2.5, Z.top(6), { s: [1, 1.5] });
    }
    c.scatter([cr, col[1]], 12, Z.and(Z.field, Z.nearLane(1.5, 99)), { s: [0.7, 1.0] });
    for(const side of [-1, 1]) laneFollow(c, pyl, side * (c.laneHalf + 1.2), 12, {});
    // Sentinelles en armure : figées en faction de part et d'autre de l'allée.
    const armures = ['ARMURE_1.glb', 'ARMURE_2.glb', 'ARMURE3.glb', 'ARMURE4.glb'];
    if(c.path) for(const side of [-1, 1]){
      const P = c.path;
      for(let t = 6; t < P.length - 6; t += 9){
        const a = P[t], b = P[Math.min(t + 1, P.length - 1)];
        const L = Math.hypot(b.x - a.x, b.z - a.z) || 1;
        const off = side * (c.laneHalf + 2.2);
        const x = a.x + (-(b.z - a.z) / L) * off, z = a.z + ((b.x - a.x) / L) * off;
        if(c.blocked(x, z, 1) || c.overlaps(x, z, 1)) continue;
        c.putModel(c.R.pick(armures), x, z, { height: 2.3, r: 0.8, rot: side < 0 ? 0 : Math.PI, shadow: 0.55 });
      }
    }
    c.scatterModel('AVION.glb', 2, Z.top(8), { height: 2.2, r: 3.4, fixed: true, shadow: 0.6 });
    c.scatterModel('BOUSSOLE.glb', 3, Z.and(Z.field, Z.nearLane(2.5, 99)), { height: 1.6, r: 0.9 });
  },
};

// ════════════════════════════════════════════════════════════
// TOUR POSTEL (bureaux)
// ════════════════════════════════════════════════════════════
const tower = {
  light: (v) => v.variant === 'feu' ? LIGHTS.fire : LIGHTS.office,
  ground(h, v){
    const floor = T.tileCobble(121, { stones: ['#c8c4bc', '#d4d0c8', '#bcb8b0', '#dcd8d0'], grout: '#8a867e', cells: 4, groutWidth: 0.012 });
    return {
      base: { tile: floor, world: 2.5 },
      layers: [
        h2 => h2.layer(T.tileConcrete(122, { ramp: [[0, '#5a3a3a'], [0.5, '#7a4a4a'], [1, '#8a5a5a']] }), 4, laneMask(h2, 0.8, 0.9, 0.05)),
        h2 => { // papiers éparpillés, éclats de verre
          sprinkle(h2, 500, () => true, (ctx, R, ppu) => { ctx.rotate(R() * 6.28); ctx.fillStyle = 'rgba(245,245,238,0.9)'; ctx.fillRect(0, 0, ppu * 0.16, ppu * 0.22); });
          sprinkle(h2, 300, () => true, (ctx, R, ppu) => { ctx.rotate(R() * 6.28); ctx.fillStyle = 'rgba(200,230,255,0.5)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ppu * 0.1, ppu * 0.03); ctx.lineTo(ppu * 0.03, ppu * 0.12); ctx.fill(); });
          if(v.variant === 'feu') sprinkle(h2, 200, () => true, stainDecal('rgba(20,10,5,A)', 0.8, 0.45));
        },
      ],
      edgeDark: 0.5,
      emissive: v.variant === 'feu' ? (h2) => sprinkle(h2, 80, () => true, stainDecal('rgba(255,120,30,A)', 0.4, 0.6)) : null,
    };
  },
  compose(c, S){
    const deskT = S('desk', () => K.desk(c.scene, {}));
    const col = S('cCol', () => K.pillar(c.scene, { h: 3.4 }));
    const plant = S('officePlant', () => N.bush(c.scene, { seed: 180, key: 'plant', leaves: PAL.mango, r: 0.45 }));
    c.row(col, 'top', { step: 5, offset: 0.4, jitter: 0, gapChance: 0 });
    c.row(col, 'bottom', { step: 5, offset: 0.6, jitter: 0, gapChance: 0, s: [0.3, 0.3] });
    c.clusters(deskT, 12, 4, 2.5, Z.and(Z.field, Z.nearLane(1, 99)), { s: [1, 1], pad: 0.8 });
    c.scatter(plant, 10, Z.border, { s: [0.8, 1.1] });
    for(const f of ['ARMURE_1.glb', 'ARMURE4.glb']) c.scatterModel(f, 3, Z.and(Z.field, Z.nearLane(2, 99)), { height: 2.2, r: 0.8 });
  },
};

export const BIOMES = { abidjan, banco, essence, born, polar, sahel, canyon, abyss, void: voidB, sgrun, tower };
