// ============================================================
// TEXTURES PEINTES — tout est dessiné en Canvas 2D au lancement de
// la mission, rien n'est téléchargé. Trois familles :
//   • tuiles de sol raccordables (herbe, latérite, pavés, neige…)
//     qui servent à « cuire » le sol de la carte (ground-bake.js) ;
//   • cartes à transparence (feuillage, herbe, fougère, palmes…)
//     posées sur les formes 3D : c'est le principe des arbres de
//     Dota / LoL — des volumes simples habillés d'images ;
//   • matières de construction (enduit, tôle, banco, écorce…).
// ============================================================

import { rng, fbm, ridged, voronoi, valueNoise, clamp, lerp, smooth, hexRgb, mixRgb, rgbCss, ramp } from './noise.js';

export function canvas(w, h = w){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/** Remplit un canvas pixel par pixel : fn(u, v, x, y) -> [r,g,b(,a)]. */
export function pix(w, h, fn){
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const col = fn(x / w, y / h, x, y);
      const i = (y * w + x) * 4;
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = col.length > 3 ? col[3] : 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Dessine fn(ctx, dx, dy) 9 fois (décalages ±w, ±h) : motifs sans couture. */
function wrapDraw(w, h, fn){
  for(const dx of [-w, 0, w]) for(const dy of [-h, 0, h]) fn(dx, dy);
}

// ════════════════════════════════════════════════════════════
// TUILES DE SOL (raccordables)
// ════════════════════════════════════════════════════════════

/** Herbe : fond nuancé + milliers de brins peints. */
export function tileGrass(seed, pal = {}){
  const S = 256;
  const base = ramp(pal.ramp || [[0, '#2f4a1c'], [0.45, '#4d6e27'], [0.8, '#6f8f35'], [1, '#8fa648']]);
  const n = fbm(seed, { octaves: 5, period: 4 });
  const n2 = fbm(seed + 9, { octaves: 3, period: 8 });
  const c = pix(S, S, (u, v) => {
    const t = n(u * 4, v * 4) * 0.8 + n2(u * 8, v * 8) * 0.35 - 0.1;
    return base(t);
  });
  const ctx = c.getContext('2d');
  const r = rng(seed + 1);
  const blades = pal.blades || ['#3f5f1f', '#567a2a', '#7a9c3c', '#9cb556', '#2b4216'];
  ctx.lineCap = 'round';
  for(let i = 0; i < (pal.count || 2600); i++){
    const x = r() * S, y = r() * S, len = 3 + r() * 7, ang = -Math.PI / 2 + (r() - 0.5) * 1.3;
    ctx.strokeStyle = r.pick(blades);
    ctx.globalAlpha = 0.35 + r() * 0.5;
    ctx.lineWidth = 0.7 + r() * 0.9;
    const ex = Math.cos(ang) * len, ey = Math.sin(ang) * len;
    wrapDraw(S, S, (dx, dy) => {
      ctx.beginPath(); ctx.moveTo(x + dx, y + dy);
      ctx.quadraticCurveTo(x + dx + ex * 0.3 + (r() - 0.5) * 2, y + dy + ey * 0.6, x + dx + ex, y + dy + ey);
      ctx.stroke();
    });
  }
  // petites fleurs / trèfles épars
  if(pal.flowers){
    for(let i = 0; i < 40; i++){
      const x = r() * S, y = r() * S;
      ctx.globalAlpha = 0.9; ctx.fillStyle = r.pick(pal.flowers);
      wrapDraw(S, S, (dx, dy) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1 + r() * 0.8, 0, 7); ctx.fill(); });
    }
  }
  ctx.globalAlpha = 1;
  return c;
}

/** Terre / latérite / sable caillouteux : fond + cailloux ombrés + fissures. */
export function tileDirt(seed, pal = {}){
  const S = 256;
  const base = ramp(pal.ramp || [[0, '#5a3a22'], [0.5, '#7c5433'], [1, '#a07546']]);
  const n = fbm(seed, { octaves: 5, period: 4 });
  const cr = ridged(seed + 3, { octaves: 3, period: 3 });
  const crackK = pal.cracks ?? 0.5;
  const c = pix(S, S, (u, v) => {
    const t = n(u * 4, v * 4);
    let col = base(t * 1.1 - 0.05);
    const k = smooth(0.965, 0.996, cr(u * 3, v * 3)) * crackK;
    if(k > 0) col = mixRgb(col, [col[0] * 0.45, col[1] * 0.42, col[2] * 0.4], k);
    return col;
  });
  const ctx = c.getContext('2d');
  const r = rng(seed + 5);
  const stones = pal.stones || ['#8a7560', '#6d5c4b', '#a8927a', '#5b4a3a'];
  for(let i = 0; i < (pal.pebbles ?? 260); i++){
    const x = r() * S, y = r() * S, rx = 1 + r() * (pal.pebbleSize || 3.2), ry = rx * (0.55 + r() * 0.35), a = r() * Math.PI;
    const col = r.pick(stones);
    wrapDraw(S, S, (dx, dy) => {
      ctx.save(); ctx.translate(x + dx, y + dy); ctx.rotate(a);
      ctx.globalAlpha = 0.45; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(0.8, 1.1, rx, ry, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(-rx * 0.25, -ry * 0.35, rx * 0.45, ry * 0.3, 0, 0, 7); ctx.fill();
      ctx.restore();
    });
  }
  ctx.globalAlpha = 1;
  return c;
}

/** Sable : rides du vent + grains. */
export function tileSand(seed, pal = {}){
  const S = 256;
  const base = ramp(pal.ramp || [[0, '#b58d5a'], [0.5, '#d2ad76'], [1, '#e8cc95']]);
  const n = fbm(seed, { octaves: 4, period: 4 });
  const w = fbm(seed + 7, { octaves: 2, period: 2 });
  return pix(S, S, (u, v) => {
    const warp = w(u * 2, v * 2) * 3;
    const rip = Math.sin((v * 22 + warp * 2 + u * 3) * Math.PI) * 0.5 + 0.5;
    const t = n(u * 4, v * 4) * 0.8 + rip * 0.22;
    const g = ((Math.sin(u * 5131 + v * 9173) * 43758.5) % 1 + 1) % 1;
    const c = base(t);
    const k = (g - 0.5) * 18;
    return [c[0] + k, c[1] + k, c[2] + k];
  });
}

/** Neige : ondulations douces, bleu dans les creux, paillettes. */
export function tileSnow(seed){
  const S = 256;
  const n = fbm(seed, { octaves: 5, period: 4 });
  const base = ramp([[0, '#9fb3c9'], [0.4, '#d6e2ee'], [0.75, '#eef4fa'], [1, '#ffffff']]);
  const c = pix(S, S, (u, v) => base(n(u * 4, v * 4) * 1.15 - 0.05));
  const ctx = c.getContext('2d'); const r = rng(seed);
  ctx.fillStyle = '#fff';
  for(let i = 0; i < 300; i++){ ctx.globalAlpha = r(); ctx.fillRect(r() * S, r() * S, 1, 1); }
  ctx.globalAlpha = 1;
  return c;
}

/** Pavés / dalles (Voronoï) avec joints, variations et relief. */
export function tileCobble(seed, pal = {}){
  const S = 256;
  const vor = voronoi(seed, pal.cells || 42);
  const n = fbm(seed + 2, { octaves: 4, period: 4 });
  const stones = (pal.stones || ['#7d766c', '#8f877b', '#6c665e', '#9a9082', '#77705f']).map(hexRgb);
  const grout = hexRgb(pal.grout || '#3b352d');
  const gw = pal.groutWidth || 0.035;
  return pix(S, S, (u, v) => {
    const { d1, d2, cell } = vor(u, v);
    const edge = d2 - d1;
    const col = stones[Math.floor(cell[2] * stones.length)];
    const noise = n(u * 4, v * 4);
    let c = mixRgb(col, [col[0] * 1.2, col[1] * 1.2, col[2] * 1.2], noise - 0.4);
    // bombé : plus clair au centre de la pierre, plus sombre vers le joint
    const dome = clamp(edge / 0.12);
    c = mixRgb([c[0] * 0.7, c[1] * 0.7, c[2] * 0.7], c, dome);
    if(edge < gw) c = mixRgb(grout, c, smooth(0, gw, edge) * 0.6);
    return c;
  });
}

/** Béton de cour : taches, fissures, joints de dilatation. */
export function tileConcrete(seed, pal = {}){
  const S = 256;
  const base = ramp(pal.ramp || [[0, '#7a736a'], [0.5, '#9a9387'], [1, '#b3aca0']]);
  const n = fbm(seed, { octaves: 5, period: 4 });
  const st = fbm(seed + 4, { octaves: 3, period: 2 });
  const cr = ridged(seed + 8, { octaves: 4, period: 3 });
  return pix(S, S, (u, v) => {
    let c = base(n(u * 4, v * 4));
    const stain = smooth(0.55, 0.8, st(u * 2, v * 2));
    c = mixRgb(c, [c[0] * 0.72, c[1] * 0.7, c[2] * 0.62], stain * 0.6);
    const k = smooth(0.978, 0.998, cr(u * 3, v * 3));
    c = mixRgb(c, [c[0] * 0.45, c[1] * 0.45, c[2] * 0.45], k * 0.6);
    if(u < 0.008 || v < 0.008) c = mixRgb(c, [50, 46, 42], 0.7);
    return c;
  });
}

/** Dalles de roche naturelle (falaises, grottes, sol de pierre). */
export function tileRock(seed, pal = {}){
  const S = 256;
  const base = ramp(pal.ramp || [[0, '#3e3a36'], [0.5, '#5f5850'], [1, '#857b6e']]);
  const vor = voronoi(seed, pal.cells || 14);
  const n = fbm(seed + 1, { octaves: 5, period: 4 });
  const cr = ridged(seed + 6, { octaves: 3, period: 4 });
  return pix(S, S, (u, v) => {
    const { d1, d2, cell } = vor(u, v);
    const e = d2 - d1;
    let c = base(n(u * 4, v * 4) * 0.8 + cell[2] * 0.3 - 0.1);
    c = mixRgb([c[0] * 0.5, c[1] * 0.5, c[2] * 0.5], c, smooth(0, 0.05, e));
    const k = smooth(0.955, 0.992, cr(u * 4, v * 4));
    return mixRgb(c, [c[0] * 0.55, c[1] * 0.55, c[2] * 0.55], k * 0.6);
  });
}

/** Plaques de métal (base de Sgrün) : panneaux, rivets, usure. */
export function tileMetal(seed, pal = {}){
  const S = 256;
  const base = ramp(pal.ramp || [[0, '#1c1f26'], [0.5, '#2a2e37'], [1, '#3c414c']]);
  const n = fbm(seed, { octaves: 4, period: 4 });
  const c = pix(S, S, (u, v) => {
    let col = base(n(u * 4, v * 4));
    const gu = (u * 2) % 1, gv = (v * 2) % 1;
    if(gu < 0.012 || gv < 0.012) col = [10, 12, 16];
    else if(gu < 0.025 || gv < 0.025) col = mixRgb(col, [90, 100, 115], 0.5);
    return col;
  });
  const ctx = c.getContext('2d');
  for(let i = 0; i < 2; i++) for(let j = 0; j < 2; j++){
    for(const [a, b] of [[0.06, 0.06], [0.44, 0.06], [0.06, 0.44], [0.44, 0.44]]){
      const x = (i * 0.5 + a) * S, y = (j * 0.5 + b) * S;
      ctx.fillStyle = '#000'; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(x + 1, y + 1, 2.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#6b7383'; ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill();
    }
  }
  return c;
}

/** Sol de cristal / verre sombre (Vide, Royaume) : facettes lumineuses. */
export function tileCrystal(seed, pal = {}){
  const S = 256;
  const vor = voronoi(seed, pal.cells || 26);
  const base = ramp(pal.ramp || [[0, '#120e1f'], [0.6, '#2a2046'], [1, '#4a3a78']]);
  const edgeC = hexRgb(pal.edge || '#9d7bff');
  const n = fbm(seed + 3, { octaves: 3, period: 4 });
  return pix(S, S, (u, v) => {
    const { d1, d2, cell } = vor(u, v);
    const e = d2 - d1;
    let c = base(cell[2] * 0.6 + n(u * 4, v * 4) * 0.4 + d1 * 1.2);
    return mixRgb(edgeC, c, smooth(0, 0.018, e));
  });
}

// ════════════════════════════════════════════════════════════
// CARTES À TRANSPARENCE (feuillages, herbes…)
// ════════════════════════════════════════════════════════════

function leafPath(ctx, len, wid){
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(wid, -len * 0.25, wid * 0.9, -len * 0.75, 0, -len);
  ctx.bezierCurveTo(-wid * 0.9, -len * 0.75, -wid, -len * 0.25, 0, 0);
}

/**
 * Grappe de feuilles (houppier) : des centaines de feuilles pointues,
 * ombrées du centre vers le bord haut — plaquée sur des cartes en croix
 * autour de volumes, elle donne un feuillage dense et vivant.
 */
export function cardLeaves(seed, pal = {}){
  const S = 256;
  const c = canvas(S); const ctx = c.getContext('2d'); const r = rng(seed);
  const cols = pal.leaves || ['#27461a', '#335a1f', '#3f6d25', '#4f7f2c', '#65963a', '#7fae48'];
  const lenMin = pal.len?.[0] ?? 12, lenMax = pal.len?.[1] ?? 22;
  // 7 à 9 sous-grappes : le bord de la carte est découpé, jamais rond
  const subs = [];
  for(let k = 0; k < 8; k++){
    const a = r() * Math.PI * 2, d = k === 0 ? 0 : S * (0.14 + r() * 0.2);
    subs.push([S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d * 0.9, S * (0.13 + r() * 0.1)]);
  }
  const n = pal.count || 560;
  for(let i = 0; i < n; i++){
    const [sx, sy, sr] = subs[i % subs.length];
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * sr;
    const x = sx + Math.cos(a) * d, y = sy + Math.sin(a) * d;
    const light = clamp(1 - (y / S) * 0.85 - (d / sr) * 0.15 + (r() - 0.5) * 0.45, 0, 1);
    const col = hexRgb(cols[Math.min(cols.length - 1, Math.floor(light * cols.length))]);
    const shade = 0.78 + r() * 0.32;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2 + (r() - 0.5) * 1.6);
    const len = lenMin + r() * (lenMax - lenMin), wid = len * (pal.width || 0.34);
    ctx.fillStyle = rgbCss([col[0] * shade, col[1] * shade, col[2] * shade]);
    leafPath(ctx, len, wid); ctx.fill();
    ctx.strokeStyle = rgbCss([col[0] * 0.6, col[1] * 0.6, col[2] * 0.55], 0.6); ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len * 0.9); ctx.stroke();
    ctx.restore();
  }
  return c;
}

/** Touffe d'herbe haute (carte verticale, base en bas). */
export function cardGrass(seed, pal = {}){
  const W = 128, H = 128;
  const c = canvas(W, H); const ctx = c.getContext('2d'); const r = rng(seed);
  const cols = pal.blades || ['#2d4a17', '#3f6420', '#557f2b', '#6f973a', '#8aab4b'];
  ctx.lineCap = 'round';
  for(let i = 0; i < (pal.count || 70); i++){
    const x0 = W / 2 + (r() - 0.5) * W * 0.45;
    const h = H * (0.45 + r() * 0.5);
    const lean = (r() - 0.5) * W * 0.6;
    const col = hexRgb(r.pick(cols));
    const g = ctx.createLinearGradient(0, H, 0, H - h);
    g.addColorStop(0, rgbCss([col[0] * 0.45, col[1] * 0.45, col[2] * 0.4]));
    g.addColorStop(1, rgbCss(col));
    ctx.fillStyle = g;
    const w = 1.6 + r() * 2.2;
    ctx.beginPath();
    ctx.moveTo(x0 - w, H);
    ctx.quadraticCurveTo(x0 + lean * 0.3, H - h * 0.55, x0 + lean, H - h);
    ctx.quadraticCurveTo(x0 + lean * 0.3 + w * 0.5, H - h * 0.5, x0 + w, H);
    ctx.fill();
  }
  if(pal.flowers){
    for(let i = 0; i < 6; i++){
      const x = W * (0.25 + r() * 0.5), y = H * (0.1 + r() * 0.35);
      ctx.fillStyle = r.pick(pal.flowers);
      for(let p = 0; p < 5; p++){
        const a = p / 5 * Math.PI * 2;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2, 1.8, 0, 7); ctx.fill();
      }
      ctx.fillStyle = '#f4d03f'; ctx.beginPath(); ctx.arc(x, y, 1.4, 0, 7); ctx.fill();
    }
  }
  return c;
}

/** Fougère (sous-bois du Banco). */
export function cardFern(seed, pal = {}){
  const S = 256;
  const c = canvas(S); const ctx = c.getContext('2d'); const r = rng(seed);
  const cols = pal.leaves || ['#1f3d14', '#2d561b', '#3d7025', '#4f8a30'];
  const fronds = 9;
  for(let f = 0; f < fronds; f++){
    const ang = -Math.PI / 2 + (f / (fronds - 1) - 0.5) * 2.6;
    const len = S * (0.35 + r() * 0.12);
    const col = hexRgb(r.pick(cols));
    ctx.save(); ctx.translate(S / 2, S * 0.95);
    for(let s = 0; s < 22; s++){
      const t = s / 22;
      const bend = t * t * 0.9;
      const px = Math.cos(ang + bend * Math.sign(ang + Math.PI / 2)) * len * t;
      const py = Math.sin(ang) * len * t + bend * len * 0.35;
      const lw = (1 - t) * 13 + 3;
      const sh = 0.7 + t * 0.4;
      ctx.fillStyle = rgbCss([col[0] * sh, col[1] * sh, col[2] * sh]);
      for(const side of [-1, 1]){
        ctx.save(); ctx.translate(px, py); ctx.rotate(ang + side * 1.1 + Math.PI / 2);
        ctx.beginPath(); ctx.ellipse(0, -lw / 2, 2.4, lw / 2, 0, 0, 7); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }
  return c;
}

/** Palme de cocotier : nervure + folioles retombantes (carte 1:4). */
export function cardPalmFrond(seed, pal = {}){
  const W = 128, H = 512;
  const c = canvas(W, H); const ctx = c.getContext('2d'); const r = rng(seed);
  const cols = pal.leaves || ['#3c5f1c', '#4f7424', '#628a2c', '#7a9f38', '#8fae45'];
  // folioles fines, espacées, qui partent de la nervure vers la pointe
  for(let i = 0; i < 46; i++){
    const t = i / 46;
    const y = H * (0.96 - t * 0.93);
    const len = W * 0.5 * Math.sin(Math.PI * (0.06 + t * 0.9)) * (0.85 + r() * 0.25);
    const col = hexRgb(r.pick(cols));
    for(const side of [-1, 1]){
      if(r() < 0.06) continue; // foliole manquante : silhouette déchirée
      ctx.fillStyle = rgbCss(col);
      ctx.beginPath();
      ctx.moveTo(W / 2, y);
      ctx.quadraticCurveTo(W / 2 + side * len * 0.55, y - 10, W / 2 + side * len, y - 16 - r() * 8);
      ctx.quadraticCurveTo(W / 2 + side * len * 0.5, y - 3, W / 2, y + 4);
      ctx.fill();
      ctx.strokeStyle = rgbCss([col[0] * 0.7, col[1] * 0.7, col[2] * 0.6], 0.6); ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(W / 2, y); ctx.quadraticCurveTo(W / 2 + side * len * 0.55, y - 8, W / 2 + side * len, y - 16); ctx.stroke();
    }
  }
  ctx.strokeStyle = '#9a8a48'; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(W / 2, H); ctx.lineTo(W / 2, H * 0.02); ctx.stroke();
  return c;
}

/** Branche de conifère enneigée (vue de dessus). */
export function cardPine(seed, pal = {}){
  const S = 256;
  const c = canvas(S); const ctx = c.getContext('2d'); const r = rng(seed);
  const needle = pal.needle || ['#1d3324', '#26422e', '#2f5238'];
  const snow = pal.snow;
  ctx.lineCap = 'round';
  for(let b = 0; b < 16; b++){
    const a = (b / 16) * Math.PI * 2 + r() * 0.3;
    const len = S * (0.3 + r() * 0.16);
    for(let s = 0; s < 40; s++){
      const t = s / 40;
      const x = S / 2 + Math.cos(a) * len * t, y = S / 2 + Math.sin(a) * len * t;
      ctx.strokeStyle = r.pick(needle); ctx.lineWidth = 1.2;
      for(const side of [-1, 1]){
        const na = a + side * (0.8 + r() * 0.3);
        const nl = (1 - t) * 14 + 4;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(na) * nl, y + Math.sin(na) * nl); ctx.stroke();
      }
    }
  }
  if(snow){
    for(let i = 0; i < 220; i++){
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * S * 0.4;
      ctx.fillStyle = r() < 0.7 ? '#f4f8fc' : '#cfdbe8';
      ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.ellipse(S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d, 3 + r() * 6, 2 + r() * 3, a, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  return c;
}

/** Algue / kelp (fonds marins) : ruban ondulant. */
export function cardKelp(seed){
  const W = 64, H = 512;
  const c = canvas(W, H); const ctx = c.getContext('2d'); const r = rng(seed);
  const g = ctx.createLinearGradient(0, H, 0, 0);
  g.addColorStop(0, '#1b3a22'); g.addColorStop(0.5, '#3f6b2a'); g.addColorStop(1, '#8aa84a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 3, H);
  for(let y = H; y > 0; y -= 8){ const x = W / 2 + Math.sin(y * 0.03) * 10; ctx.lineTo(x - 5 - Math.sin(y * 0.11) * 4, y); }
  for(let y = 0; y < H; y += 8){ const x = W / 2 + Math.sin(y * 0.03) * 10; ctx.lineTo(x + 5 + Math.sin(y * 0.13) * 5, y); }
  ctx.fill();
  for(let i = 0; i < 12; i++){
    const y = r() * H * 0.9, x = W / 2 + Math.sin(y * 0.03) * 10;
    ctx.fillStyle = '#4f7a30';
    ctx.beginPath(); ctx.ellipse(x + r.sign() * 10, y, 9, 4, r() - 0.5, 0, 7); ctx.fill();
  }
  return c;
}

/** Tache d'ombre douce (ombres de contact au sol). */
export function cardShadow(){
  const S = 128;
  const c = canvas(S); const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(0.5, 'rgba(0,0,0,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  return c;
}

/** Halo lumineux (lampadaires, cristaux, lave) — mélange additif. */
export function cardGlow(hex = '#ffcf7a'){
  const S = 128;
  const c = canvas(S); const ctx = c.getContext('2d');
  const [R, G, B] = hexRgb(hex);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, `rgba(${R},${G},${B},1)`); g.addColorStop(0.25, `rgba(${R},${G},${B},0.45)`); g.addColorStop(1, `rgba(${R},${G},${B},0)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  return c;
}

// ════════════════════════════════════════════════════════════
// MATIÈRES DE CONSTRUCTION ET DE VOLUMES
// ════════════════════════════════════════════════════════════

/** Écorce : fibres verticales, crevasses, mousse éventuelle au pied. */
export function texBark(seed, pal = {}){
  const W = 128, H = 256;
  const base = ramp(pal.ramp || [[0, '#2a1d14'], [0.5, '#4a3525'], [1, '#6e5238']]);
  const n = fbm(seed, { octaves: 4, period: 4 });
  const moss = pal.moss ? hexRgb(pal.moss) : null;
  return pix(W, H, (u, v) => {
    const f = n(u * 16, v * 2);
    const groove = smooth(0.35, 0.5, Math.abs(Math.sin((u * 10 + f * 1.8) * Math.PI)));
    let c = base(f * 0.7 + groove * 0.45);
    c = mixRgb([c[0] * 0.35, c[1] * 0.3, c[2] * 0.28], c, groove);
    if(moss){ const m = smooth(0.55, 0.95, v) * smooth(0.4, 0.7, n(u * 6, v * 6)); c = mixRgb(c, moss, m * 0.8); }
    return c;
  });
}

/** Stipe de cocotier : anneaux réguliers. */
export function texPalmTrunk(seed){
  const n = fbm(seed, { octaves: 3, period: 4 });
  const base = ramp([[0, '#4b3a28'], [0.5, '#6f5a40'], [1, '#948060']]);
  return pix(64, 256, (u, v) => {
    const ring = (v * 26) % 1;
    const k = smooth(0.0, 0.18, ring) * (1 - smooth(0.8, 1, ring));
    const c = base(n(u * 8, v * 8) * 0.6 + k * 0.5);
    return mixRgb([c[0] * 0.45, c[1] * 0.4, c[2] * 0.35], c, k);
  });
}

/** Enduit peint (maisons d'Abidjan) : salissures, coulures, remontées d'humidité, éclats. */
export function texPlaster(seed, hex = '#e8d9a8'){
  const S = 256;
  const col = hexRgb(hex);
  const n = fbm(seed, { octaves: 5, period: 4 });
  const drip = fbm(seed + 3, { octaves: 3, period: 8 });
  const chip = fbm(seed + 9, { octaves: 4, period: 4 });
  const brick = [150, 92, 64];
  return pix(S, S, (u, v) => {
    const t = n(u * 4, v * 4);
    let c = [col[0] * (0.88 + t * 0.2), col[1] * (0.88 + t * 0.2), col[2] * (0.86 + t * 0.2)];
    // coulures verticales depuis le haut
    const dr = smooth(0.62, 0.82, drip(u * 8, v * 0.6)) * (1 - v * 0.6);
    c = mixRgb(c, [c[0] * 0.66, c[1] * 0.64, c[2] * 0.6], dr * 0.55);
    // remontée d'humidité + terre au pied du mur
    const damp = smooth(0.62, 1, v + (t - 0.5) * 0.25);
    c = mixRgb(c, [110, 90, 66], damp * 0.42);
    // enduit écaillé laissant voir la brique
    const k = smooth(0.8, 0.82, chip(u * 5, v * 5));
    if(k > 0) c = mixRgb(c, brick, k * 0.85);
    return c;
  });
}

/** Tôle ondulée (toits) : ondes, rouille, coulures. */
export function texTole(seed, rusty = 0.6){
  const S = 256;
  const n = fbm(seed, { octaves: 5, period: 4 });
  const ru = fbm(seed + 5, { octaves: 4, period: 4 });
  return pix(S, S, (u, v) => {
    const wave = Math.sin(u * 24 * Math.PI) * 0.5 + 0.5;
    let c = mixRgb([95, 100, 104], [178, 184, 186], wave * 0.7 + n(u * 4, v * 4) * 0.3);
    const r = smooth(0.45, 0.75, ru(u * 3, v * 3 + u * 0.3)) * rusty;
    c = mixRgb(c, mixRgb([110, 52, 22], [168, 86, 38], wave), r);
    if(((v * 4) % 1) < 0.015) c = mixRgb(c, [40, 36, 32], 0.6); // recouvrement des plaques
    return c;
  });
}

/** Banco (terre crue, Mali) : lissé à la main, paille, fissures. */
export function texBanco(seed, pal = {}){
  const S = 256;
  const base = ramp(pal.ramp || [[0, '#7c5433'], [0.5, '#a3754a'], [1, '#c29566']]);
  const n = fbm(seed, { octaves: 5, period: 4 });
  const sw = fbm(seed + 2, { octaves: 2, period: 4 });
  const cr = ridged(seed + 7, { octaves: 3, period: 4 });
  const c = pix(S, S, (u, v) => {
    const stroke = Math.sin((u * 3 + v * 9 + sw(u * 4, v * 4) * 3) * Math.PI) * 0.5 + 0.5;
    let col = base(n(u * 4, v * 4) * 0.9 + stroke * 0.08);
    const k = smooth(0.965, 0.995, cr(u * 3, v * 3));
    col = mixRgb(col, [col[0] * 0.5, col[1] * 0.45, col[2] * 0.4], k * 0.7);
    const damp = smooth(0.8, 1, v);
    return mixRgb(col, [col[0] * 0.72, col[1] * 0.66, col[2] * 0.6], damp);
  });
  const ctx = c.getContext('2d'); const r = rng(seed + 11);
  ctx.strokeStyle = '#d8b878'; ctx.lineWidth = 0.8;
  for(let i = 0; i < 160; i++){
    const x = r() * S, y = r() * S, a = r() * Math.PI, l = 3 + r() * 5;
    ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return c;
}

/** Planches de bois (étals, caisses, pontons). */
export function texWood(seed, pal = {}){
  const W = 256, H = 256;
  const base = ramp(pal.ramp || [[0, '#4a3220'], [0.5, '#6e4c30'], [1, '#93704a']]);
  const n = fbm(seed, { octaves: 4, period: 4 });
  const planks = pal.planks || 5;
  return pix(W, H, (u, v) => {
    const p = Math.floor(v * planks);
    const grain = Math.sin((u * 30 + n(u * 2, v * 16 + p) * 6) * Math.PI) * 0.5 + 0.5;
    let c = base(n(u * 4 + p * 7, v * 4) * 0.6 + grain * 0.35 + (p % 2) * 0.08);
    const pv = (v * planks) % 1;
    if(pv < 0.05 || pv > 0.97) c = mixRgb(c, [25, 18, 12], 0.8);
    return c;
  });
}

/** Tissu rayé (parasols, bâches de marché). */
export function texFabric(colors = ['#c0392b', '#f1e3c6']){
  const cs = colors.map(hexRgb);
  const n = fbm(77, { octaves: 3, period: 4 });
  return pix(256, 64, (u, v) => {
    const c = cs[Math.floor(u * 8) % cs.length];
    const k = 0.85 + n(u * 8, v * 4) * 0.25;
    return [c[0] * k, c[1] * k, c[2] * k];
  });
}

/** Conteneur maritime : tôle nervurée peinte, rouille. */
export function texContainer(seed, hex = '#2d5d8a'){
  const col = hexRgb(hex);
  const n = fbm(seed, { octaves: 4, period: 4 });
  const ru = fbm(seed + 3, { octaves: 4, period: 4 });
  return pix(256, 128, (u, v) => {
    const rib = Math.abs(Math.sin(u * 28 * Math.PI));
    let c = [col[0] * (0.7 + rib * 0.35), col[1] * (0.7 + rib * 0.35), col[2] * (0.7 + rib * 0.35)];
    c = mixRgb(c, [c[0] * 1.1, c[1] * 1.1, c[2] * 1.1], n(u * 4, v * 4) - 0.5);
    const r = smooth(0.6, 0.8, ru(u * 4, v * 2)) + smooth(0.85, 1, v) * 0.5;
    return mixRgb(c, [120, 60, 30], clamp(r) * 0.75);
  });
}

/**
 * Détail fin (grain) pour le « detailMap » du sol : garde le sol net même
 * quand la caméra zoome, sans agrandir la texture cuite.
 * Canaux attendus par Babylon : R = diffus, G = normale Y, B = rugosité, A = normale X.
 */
export function texDetail(seed){
  const n = fbm(seed, { octaves: 4, period: 8 });
  return pix(256, 256, (u, v, x, y) => {
    const g = ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1 + 1) % 1;
    const val = 128 + (n(u * 8, v * 8) - 0.5) * 70 + (g - 0.5) * 50;
    const nx = 128 + (n(u * 8 + 0.02, v * 8) - n(u * 8 - 0.02, v * 8)) * 900;
    const ny = 128 + (n(u * 8, v * 8 + 0.02) - n(u * 8, v * 8 - 0.02)) * 900;
    return [val, clamp(ny, 0, 255), 128, clamp(nx, 0, 255)];
  });
}

/** Bitume usé : granulats, rapiéçages, fissures, bords effrités. */
export function tileAsphalt(seed, pal = {}){
  const S = 256;
  const base = ramp(pal.ramp || [[0, '#2b2a28'], [0.5, '#3d3b37'], [1, '#55524c']]);
  const n = fbm(seed, { octaves: 5, period: 4 });
  const patch = fbm(seed + 4, { octaves: 2, period: 2 });
  const cr = ridged(seed + 8, { octaves: 4, period: 3 });
  return pix(S, S, (u, v, x, y) => {
    let c = base(n(u * 4, v * 4));
    const p = smooth(0.6, 0.62, patch(u * 2, v * 2));
    c = mixRgb(c, [c[0] * 0.75, c[1] * 0.75, c[2] * 0.78], p * 0.7);
    const g = ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1 + 1) % 1;
    if(g > 0.93) c = mixRgb(c, [150, 145, 135], 0.5);
    const k = smooth(0.975, 0.997, cr(u * 3, v * 3));
    return mixRgb(c, [18, 17, 16], k * 0.8);
  });
}
