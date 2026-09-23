// ============================================================
// CUISSON DU SOL — toute la carte est peinte dans UNE image, comme
// les sols de Dota : pas de tuile répétée visible, la voie se fond
// dans l'herbe par un bord usé, les ombres du décor sont posées au
// pied de chaque arbre, rocher ou maison.
//
// Coût : un seul matériau et une seule texture pour tout le sol.
// ============================================================

import { rng, fbm, clamp, smooth } from './noise.js';
import { canvas } from './textures.js';

/**
 * @param {object} o
 *   bounds  : { x0, z0, x1, z1 } en unités Babylon (z décroît vers le bas de l'écran)
 *   ppu     : pixels de texture par unité
 *   path    : [{x,z}] tracé de la voie (ou null en arène)
 *   laneHalf: demi-largeur de voie (unités)
 *   play    : { x0, z0, x1, z1 } zone jouable (le reste est la lisière)
 *   recipe  : couches du biome (voir biomes.js)
 *   shadows : [{x, z, r, k}] ombres de contact à peindre
 *   seed
 */
export function bakeGround(o){
  const { bounds: B, ppu, recipe, seed } = o;
  const W = Math.round((B.x1 - B.x0) * ppu), H = Math.round((B.z0 - B.z1) * ppu);
  const main = canvas(W, H);
  const ctx = main.getContext('2d');
  const toC = (x, z) => [(x - B.x0) * ppu, (B.z0 - z) * ppu];

  // ── Champ de distance à la voie (basse résolution) ──────────
  const MR = 6; // cellules par unité
  const mw = Math.ceil((B.x1 - B.x0) * MR), mh = Math.ceil((B.z0 - B.z1) * MR);
  const laneDist = new Float32Array(mw * mh).fill(1e9);
  if(o.path && o.path.length > 1){
    const P = o.path;
    for(let j = 0; j < mh; j++){
      const z = B.z0 - (j + 0.5) / MR;
      for(let i = 0; i < mw; i++){
        const x = B.x0 + (i + 0.5) / MR;
        let best = 1e9;
        for(let k = 0; k < P.length - 1; k++){
          const ax = P[k].x, az = P[k].z, bx = P[k + 1].x, bz = P[k + 1].z;
          const dx = bx - ax, dz = bz - az;
          const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz));
          const ex = ax + dx * t - x, ez = az + dz * t - z;
          const d = ex * ex + ez * ez;
          if(d < best) best = d;
        }
        laneDist[j * mw + i] = Math.sqrt(best);
      }
    }
  } else if(o.arena){
    // Arène : clairière centrale usée par les combats
    const cx = (o.play.x0 + o.play.x1) / 2, cz = (o.play.z0 + o.play.z1) / 2;
    const rx = (o.play.x1 - o.play.x0) * 0.32, rz = (o.play.z0 - o.play.z1) * 0.3;
    // bord irrégulier : une clairière usée, pas un ovale tracé au compas
    const wob = fbm(seed + 17, { octaves: 3 });
    for(let j = 0; j < mh; j++) for(let i = 0; i < mw; i++){
      const x = B.x0 + (i + 0.5) / MR, z = B.z0 - (j + 0.5) / MR;
      const k = 0.78 + wob(x / 6, z / 6) * 0.55;
      laneDist[j * mw + i] = Math.hypot((x - cx) / rx, (z - cz) / rz) * o.laneHalf * 1.4 * k;
    }
  }
  const distAt = (x, z) => {
    const i = clamp(Math.floor((x - B.x0) * MR), 0, mw - 1), j = clamp(Math.floor((B.z0 - z) * MR), 0, mh - 1);
    return laneDist[j * mw + i];
  };
  // distance au bord de la zone jouable (négatif = dans la lisière)
  const P = o.play;
  const edgeDist = (x, z) => Math.min(x - P.x0, P.x1 - x, P.z0 - z, z - P.z1);

  // Masque basse résolution -> canvas alpha, agrandi avec lissage.
  const noiseCache = {};
  const maskCanvas = (fn) => {
    const c = canvas(mw, mh);
    const mctx = c.getContext('2d');
    const img = mctx.createImageData(mw, mh);
    for(let j = 0; j < mh; j++) for(let i = 0; i < mw; i++){
      const x = B.x0 + (i + 0.5) / MR, z = B.z0 - (j + 0.5) / MR;
      const a = clamp(fn(x, z, laneDist[j * mw + i]));
      const k = (j * mw + i) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = 255; img.data[k + 3] = a * 255;
    }
    mctx.putImageData(img, 0, 0);
    return c;
  };
  const noiseFn = (s, scale, oct = 4) => {
    const key = s + ':' + scale + ':' + oct;
    if(!noiseCache[key]){ const f = fbm(seed + s, { octaves: oct }); noiseCache[key] = (x, z) => f(x / scale, z / scale); }
    return noiseCache[key];
  };

  // Remplit tout le canvas avec une tuile répétée, à `tileWorld` unités par tuile.
  const fillPattern = (target, tile, tileWorld, alpha = 1, rot = 0) => {
    const tctx = target.getContext('2d');
    const pat = tctx.createPattern(tile, 'repeat');
    const s = tileWorld * ppu / tile.width;
    pat.setTransform(new DOMMatrix().rotate(rot).scale(s, s));
    tctx.globalAlpha = alpha;
    tctx.fillStyle = pat;
    tctx.fillRect(0, 0, W, H);
    tctx.globalAlpha = 1;
  };
  // Couche = tuile masquée par une fonction (x, z, distVoie) -> [0..1]
  const layer = (tile, tileWorld, maskFn, opts = {}) => {
    const tmp = canvas(W, H);
    fillPattern(tmp, tile, tileWorld, 1, opts.rot || 0);
    const t2 = tmp.getContext('2d');
    t2.globalCompositeOperation = 'destination-in';
    t2.imageSmoothingEnabled = true; t2.imageSmoothingQuality = 'high';
    t2.drawImage(maskCanvas(maskFn), 0, 0, W, H);
    ctx.globalAlpha = opts.alpha ?? 1;
    ctx.globalCompositeOperation = opts.blend || 'source-over';
    ctx.drawImage(tmp, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  };

  const helpers = {
    W, H, ppu, toC, distAt, edgeDist, noiseFn, layer, fillPattern, ctx, bounds: B, play: P, path: o.path,
    laneHalf: o.laneHalf, rnd: rng(seed + 77), smooth, clamp,
  };

  // ── Couches du biome ─────────────────────────────────────────
  // Fond : la même tuile posée deux fois, la seconde tournée et à une
  // autre échelle, masquée par un bruit large — sans cela, l'œil repère
  // la trame répétée sur une carte de 100 unités de long.
  fillPattern(main, recipe.base.tile, recipe.base.world || 6);
  if(recipe.base.breakup !== false){
    const tmp = canvas(W, H);
    fillPattern(tmp, recipe.base.tile, (recipe.base.world || 6) * 1.43, 1, 33);
    const t2 = tmp.getContext('2d');
    t2.globalCompositeOperation = 'destination-in';
    t2.drawImage(maskCanvas((x, z) => clamp((noiseFn(31, 7)(x, z) - 0.32) * 2.2)), 0, 0, W, H);
    ctx.globalAlpha = 0.75; ctx.drawImage(tmp, 0, 0); ctx.globalAlpha = 1;
  }
  for(const L of (recipe.layers || [])) L(helpers);

  // ── Ombres de contact du décor ───────────────────────────────
  // Décalées dans le sens du soleil (vers la gauche et le haut de l'écran).
  ctx.globalCompositeOperation = 'multiply';
  for(const s of (o.shadows || [])){
    const [cx, cy] = toC(s.x - s.r * 0.25, s.z + s.r * 0.18);
    const r = s.r * ppu;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const k = (s.k ?? 0.55) * 1.25;
    g.addColorStop(0, `rgba(0,0,0,${k})`);
    g.addColorStop(0.5, `rgba(0,0,0,${k * 0.62})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1.25, 1); ctx.translate(-cx, -cy);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';

  // ── Étalonnage final : lisière assombrie + teinte du biome ───
  const vign = maskCanvas((x, z) => smooth(0.5, -3.5, edgeDist(x, z)) * (recipe.edgeDark ?? 0.45));
  const vtmp = canvas(W, H); const vctx = vtmp.getContext('2d');
  vctx.fillStyle = recipe.edgeColor || '#000'; vctx.fillRect(0, 0, W, H);
  vctx.globalCompositeOperation = 'destination-in'; vctx.drawImage(vign, 0, 0, W, H);
  ctx.drawImage(vtmp, 0, 0);
  if(recipe.tint){
    ctx.globalCompositeOperation = recipe.tint.blend || 'multiply';
    ctx.globalAlpha = recipe.tint.alpha ?? 0.25;
    ctx.fillStyle = recipe.tint.color; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  // ── Carte d'émission (lave, runes, fissures lumineuses) ──────
  let emissive = null;
  if(recipe.emissive){
    emissive = canvas(W, H);
    const ectx = emissive.getContext('2d');
    ectx.fillStyle = '#000'; ectx.fillRect(0, 0, W, H);
    recipe.emissive({ ...helpers, ctx: ectx });
  }
  return { color: main, emissive, W, H, distAt, edgeDist };
}
