// ============================================================
// BRUIT PROCÉDURAL — générateurs déterministes (même graine =
// même scène), sans dépendance. Sert aux textures peintes et au
// placement du décor.
// ============================================================

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
export function rng(seed){
  let a = (seed >>> 0) || 0x9e3779b9;
  const r = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (a, b) => a + r() * (b - a);
  r.int = (a, b) => Math.floor(a + r() * (b - a + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.sign = () => (r() < 0.5 ? -1 : 1);
  return r;
}

export function hashStr(s){
  let h = 2166136261;
  for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * Bruit de valeur 2D lissé. `period` > 0 rend le bruit raccordable
 * (tuile sans couture) sur cette période, en unités de grille.
 */
export function valueNoise(seed, period = 0){
  const r = rng(seed);
  const N = 256;
  const perm = new Uint8Array(N * 2);
  const vals = new Float32Array(N);
  for(let i = 0; i < N; i++){ perm[i] = i; vals[i] = r(); }
  for(let i = N - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for(let i = 0; i < N; i++) perm[i + N] = perm[i];
  const lat = (x, y) => {
    if(period){ x = ((x % period) + period) % period; y = ((y % period) + period) % period; }
    return vals[perm[(perm[x & 255] + y) & 255]];
  };
  const fade = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = fade(xf), v = fade(yf);
    const a = lat(xi, yi), b = lat(xi + 1, yi), c = lat(xi, yi + 1), d = lat(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

/** Bruit fractal (fBm) normalisé dans [0,1]. */
export function fbm(seed, { octaves = 4, period = 0, lacunarity = 2, gain = 0.5 } = {}){
  const layers = [];
  for(let o = 0; o < octaves; o++) layers.push(valueNoise(seed + o * 1013, period ? period * Math.pow(lacunarity, o) : 0));
  return (x, y) => {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for(let o = 0; o < octaves; o++){
      sum += layers[o](x * freq, y * freq) * amp;
      norm += amp; amp *= gain; freq *= lacunarity;
    }
    return sum / norm;
  };
}

/** Bruit « crêtes » (valeurs hautes le long de lignes) — fissures, veines. */
export function ridged(seed, opts = {}){
  const f = fbm(seed, opts);
  return (x, y) => 1 - Math.abs(f(x, y) * 2 - 1);
}

/**
 * Cellules de Voronoï raccordables sur [0,1)² : renvoie pour un point
 * la distance au centre le plus proche (d1), au second (d2) et l'index
 * de la cellule. Sert aux pavés, dalles, écailles de roche.
 */
export function voronoi(seed, cells){
  const r = rng(seed);
  const pts = [];
  for(let i = 0; i < cells; i++) pts.push([r(), r(), r()]);
  return (u, v) => {
    let d1 = 9, d2 = 9, id = 0;
    for(let i = 0; i < pts.length; i++){
      const p = pts[i];
      for(let ox = -1; ox <= 1; ox++) for(let oy = -1; oy <= 1; oy++){
        const dx = u - (p[0] + ox), dy = v - (p[1] + oy);
        const d = dx * dx + dy * dy;
        if(d < d1){ d2 = d1; d1 = d; id = i; } else if(d < d2) d2 = d;
      }
    }
    return { d1: Math.sqrt(d1), d2: Math.sqrt(d2), id, cell: pts[id] };
  };
}

export const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

export function hexRgb(hex){
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mixRgb(a, b, t){ return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
export function rgbCss(c, a = 1){ return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
/** Dégradé multi-couleurs : stops = [[t, '#hex'], ...] triés. */
export function ramp(stops){
  const s = stops.map(([t, h]) => [t, hexRgb(h)]);
  return (t) => {
    if(t <= s[0][0]) return s[0][1];
    for(let i = 1; i < s.length; i++){
      if(t <= s[i][0]){
        const k = (t - s[i - 1][0]) / (s[i][0] - s[i - 1][0]);
        return mixRgb(s[i - 1][1], s[i][1], k);
      }
    }
    return s[s.length - 1][1];
  };
}
