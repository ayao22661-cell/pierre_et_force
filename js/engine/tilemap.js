// ============================================================
// TILEMAP — terrain de combat PixiJS avec art de fond.
// Les images de Pierre et Force servent de backdrop atmosphérique
// (floutées/assombries) pour ancrer visuellement le combat.
// ============================================================
import { groundTile, mulberry32 } from './textures.js';

const TILE = 96;

// Images d'art chargées dynamiquement (chemins relatifs à index.html)
const ART_IMAGES = [
  'assets/art_battle1.webp',
  'assets/art_battle2.webp',
  'assets/art_battle3.webp',
  'assets/art_divine.webp',
];
let artTextureCache = {};
export function preloadArtTextures(){
  return Promise.all(ART_IMAGES.map(src =>
    PIXI.Assets.load(src).then(tex => { artTextureCache[src] = tex; }).catch(() => {})
  ));
}

export class Tilemap{
  constructor(theme, layout, artSeed = 0){
    this.theme = theme;
    this.layout = layout;
    this.ground = new PIXI.Container();
    this.decor  = new PIXI.Container();
    this._buildGround(artSeed);
    this._buildLane();
    this._buildBrush();
    this._buildBattleArt(artSeed);
    this._buildVignette();
  }

  _buildGround(seed){
    const { w, h } = this.layout;
    const cols = Math.ceil(w / TILE) + 1, rows = Math.ceil(h / TILE) + 1;
    const texA = groundTile(this.theme.g1, 1);
    const texB = groundTile(this.theme.g2, 2);
    let rng = mulberry32(seed + 7);
    for(let cy = 0; cy < rows; cy++){
      for(let cx = 0; cx < cols; cx++){
        const useA = ((cx + cy) % 2 === 0) || rng() > 0.82;
        const spr = new PIXI.Sprite(useA ? texA : texB);
        spr.x = cx * TILE; spr.y = cy * TILE;
        spr.width = TILE + 1; spr.height = TILE + 1;
        this.ground.addChild(spr);
      }
    }
  }

  // ── Images d'art placées en décor atmosphérique sur le terrain ──
  _buildBattleArt(artSeed){
    const { w, h } = this.layout;
    const rng = mulberry32(artSeed + 13);

    // Choisir 2 images parmi le pool
    const pool = Object.values(artTextureCache).filter(Boolean);
    if(pool.length === 0) return;

    // Image centrale de fond (très sombre, effet de brume de bataille)
    const picks = [];
    const copy = [...pool];
    while(picks.length < 2 && copy.length > 0){
      const idx = Math.floor(rng() * copy.length);
      picks.push(copy.splice(idx, 1)[0]);
    }

    // Image 1 : grande, au fond, très transparente — comme une fresque murale
    if(picks[0]){
      const spr1 = new PIXI.Sprite(picks[0]);
      spr1.anchor.set(0.5);
      spr1.x = w * 0.5; spr1.y = h * 0.5;
      // Couvrir une grande portion de la carte
      const scale1 = Math.max(w * 0.9 / picks[0].width, h * 0.85 / picks[0].height);
      spr1.scale.set(scale1);
      spr1.alpha = 0.09; // très discret pour ne pas gêner la lisibilité
      spr1.tint = 0x88aacc;
      this.ground.addChild(spr1);
    }

    // Image 2 : plus petite, posée dans un coin, comme une bannière héroïque
    if(picks[1]){
      const side = rng() > 0.5 ? 1 : -1;
      const spr2 = new PIXI.Sprite(picks[1]);
      spr2.anchor.set(0.5);
      spr2.x = w * (0.5 + side * 0.3);
      spr2.y = h * (0.28 + rng() * 0.4);
      const scale2 = Math.min(340 / picks[1].width, 260 / picks[1].height);
      spr2.scale.set(scale2);
      spr2.alpha = 0.18;
      spr2.tint = 0xffddaa;
      // Overlay de vignette pour fondre l'image dans le décor
      this.decor.addChild(spr2);

      // Auréole autour de l'image
      const g = new PIXI.Graphics();
      const hw = picks[1].width * scale2 / 2, hh = picks[1].height * scale2 / 2;
      g.x = spr2.x; g.y = spr2.y;
      g.ellipse(0, 0, hw*1.15, hh*1.1).fill({ color: 0xc9a24a, alpha: 0.04 });
      g.ellipse(0, 0, hw*1.15, hh*1.1).stroke({ width: 2, color: 0xc9a24a, alpha: 0.12 });
      this.decor.addChild(g);
    }
  }

  _buildLane(){
    const path = this.layout.path;
    if(!path || path.length < 2) return;
    const laneWidth = this.layout.laneWidth || 210;
    const g = new PIXI.Graphics();
    g.moveTo(path[0].x, path[0].y);
    for(const p of path) g.lineTo(p.x, p.y);
    g.stroke({ width: laneWidth + 26, color: 0x000000, alpha: 0.28, cap: 'round', join: 'round' });
    g.moveTo(path[0].x, path[0].y);
    for(const p of path) g.lineTo(p.x, p.y);
    g.stroke({ width: laneWidth, color: hexToNum(this.theme.lane), alpha: 0.9, cap: 'round', join: 'round' });
    this.ground.addChild(g);

    const gc = new PIXI.Graphics();
    gc.moveTo(path[0].x, path[0].y);
    for(const p of path) gc.lineTo(p.x, p.y);
    gc.stroke({ width: 2, color: hexToNum(this.theme.acc), alpha: 0.18 });
    this.ground.addChild(gc);
  }

  _buildBrush(){
    for(const b of (this.layout.brush || [])){
      const g = new PIXI.Graphics();
      g.circle(0, 0, b.r).fill({ color: 0x0a1408, alpha: 0.55 });
      g.circle(0, 0, b.r).stroke({ width: 2, color: hexToNum(this.theme.acc), alpha: 0.12 });
      g.x = b.x; g.y = b.y;
      this.decor.addChild(g);
    }
    for(const c of (this.layout.camps || [])){
      const g = new PIXI.Graphics();
      g.circle(0, 0, 46).fill({ color: hexToNum(this.theme.acc), alpha: 0.08 });
      g.x = c.x; g.y = c.y;
      this.decor.addChild(g);
    }
  }

  _buildVignette(){
    const { w, h } = this.layout;
    const g = new PIXI.Graphics();
    const wallColor = hexToNum(this.theme.wall);
    const t = 60;
    g.rect(-t, -t, w + t*2, t).fill({ color: wallColor, alpha: 0.9 });
    g.rect(-t, h, w + t*2, t).fill({ color: wallColor, alpha: 0.9 });
    g.rect(-t, -t, t, h + t*2).fill({ color: wallColor, alpha: 0.9 });
    g.rect(w, -t, t, h + t*2).fill({ color: wallColor, alpha: 0.9 });
    this.decor.addChild(g);
  }

  addTo(layers){
    layers.ground.addChild(this.ground);
    layers.decor.addChild(this.decor);
  }

  destroy(){
    this.ground.destroy({ children: true });
    this.decor.destroy({ children: true });
  }
}

function hexToNum(hex){
  return parseInt((hex||'#000000').replace('#',''), 16);
}

export function siegeLayout(w = 3600, h = 1400){
  const path = [];
  for(let x = 200; x <= w - 200; x += 90){
    path.push({ x, y: h/2 + Math.sin(x/620) * 100 });
  }
  return {
    w, h, path, laneWidth: 220,
    brush: [
      { x: w*0.3, y: h*0.25, r: 90 }, { x: w*0.3, y: h*0.75, r: 90 },
      { x: w*0.7, y: h*0.25, r: 90 }, { x: w*0.7, y: h*0.75, r: 90 },
    ],
    camps: [{ x: w/2, y: h*0.18 }],
  };
}

export function arenaLayout(w = 2200, h = 1500){
  return {
    w, h, path: null,
    brush: [
      { x: w/2 - 260, y: h/2, r: 100 }, { x: w/2 + 260, y: h/2, r: 100 },
      { x: w*0.22, y: h*0.2, r: 80 }, { x: w*0.78, y: h*0.8, r: 80 },
    ],
    camps: [],
  };
}
