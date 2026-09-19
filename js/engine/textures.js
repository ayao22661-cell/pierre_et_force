// ============================================================
// TEXTURES PROCÉDURALES
// Tout le visuel du jeu part de textures générées en Canvas2D puis
// converties en PIXI.Texture — aucune image externe n'est chargée.
// ============================================================

const cache = new Map();

function canvasTexture(key, size, draw){
  if(cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d');
  draw(ctx, size);
  const tex = PIXI.Texture.from(cv);
  cache.set(key, tex);
  return tex;
}

/** Disque radial doux — base de tous les glows et particules additives. */
export function softCircle(size = 128){
  return canvasTexture('soft-circle-' + size, size, (ctx, s) => {
    const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(.35, 'rgba(255,255,255,.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/** Anneau doux — utilisé pour les cercles de sélection et zones d'effet. */
export function softRing(size = 128){
  return canvasTexture('soft-ring-' + size, size, (ctx, s) => {
    const cx = s/2, cy = s/2, r = s*0.38, w = s*0.06;
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.filter = 'blur(2px)';
  });
}

/** Ombre elliptique portée au sol sous chaque unité. */
export function unitShadow(){
  return canvasTexture('unit-shadow', 64, (ctx, s) => {
    const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    g.addColorStop(0, 'rgba(0,0,0,.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/** Tuile de terrain avec bruit subtil — herbe / pierre selon la teinte fournie. */
export function groundTile(hex, seed, size = 128){
  const key = 'ground-' + hex + '-' + seed;
  return canvasTexture(key, size, (ctx, s) => {
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, s, s);
    let rnd = mulberry32(seed);
    for(let i = 0; i < 140; i++){
      const x = rnd()*s, y = rnd()*s, r = rnd()*2.2 + 0.4;
      const shade = rnd() > 0.5 ? 255 : 0;
      ctx.globalAlpha = rnd()*0.06 + 0.02;
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export { mulberry32 };
