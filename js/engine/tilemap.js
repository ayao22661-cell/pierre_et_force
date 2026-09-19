// ============================================================
// TILEMAP — génère le terrain de combat en Graphics/Sprites PixiJS.
// Remplace bg.jpg / floor.jpg / wall_left.png par du rendu procédural.
// ============================================================
import { groundTile, mulberry32 } from './textures.js';

const TILE = 96;

export class Tilemap{
  /**
   * @param {object} theme - {g1,g2,lane,acc,wall} couleurs hex du thème d'acte
   * @param {object} layout - {w,h,path:[{x,y}...], brush:[{x,y,r}...], camps:[...]}
   */
  constructor(theme, layout){
    this.theme = theme;
    this.layout = layout;
    this.ground = new PIXI.Container();
    this.decor = new PIXI.Container();
    this._buildGround();
    this._buildLane();
    this._buildBrush();
    this._buildVignette();
  }

  _buildGround(){
    const { w, h } = this.layout;
    const cols = Math.ceil(w / TILE) + 1, rows = Math.ceil(h / TILE) + 1;
    const texA = groundTile(this.theme.g1, 1);
    const texB = groundTile(this.theme.g2, 2);
    let seed = mulberry32(7);
    for(let cy = 0; cy < rows; cy++){
      for(let cx = 0; cx < cols; cx++){
        const useA = ((cx + cy) % 2 === 0) || seed() > 0.82;
        const spr = new PIXI.Sprite(useA ? texA : texB);
        spr.x = cx * TILE; spr.y = cy * TILE;
        spr.width = TILE + 1; spr.height = TILE + 1;
        this.ground.addChild(spr);
      }
    }
  }

  _buildLane(){
    const path = this.layout.path;
    if(!path || path.length < 2) return;
    const laneWidth = this.layout.laneWidth || 210;
    const g = new PIXI.Graphics();
    // Bordure de lane légèrement plus sombre, puis remplissage teinté accent.
    g.moveTo(path[0].x, path[0].y);
    for(const p of path) g.lineTo(p.x, p.y);
    g.stroke({ width: laneWidth + 26, color: 0x000000, alpha: 0.28, cap: 'round', join: 'round' });
    g.moveTo(path[0].x, path[0].y);
    for(const p of path) g.lineTo(p.x, p.y);
    g.stroke({ width: laneWidth, color: hexToNum(this.theme.lane), alpha: 0.9, cap: 'round', join: 'round' });
    this.ground.addChild(g);

    // Ligne centrale décorative très fine, couleur accent, pour donner du rythme.
    const gc = new PIXI.Graphics();
    gc.moveTo(path[0].x, path[0].y);
    for(const p of path) gc.lineTo(p.x, p.y);
    gc.stroke({ width: 2, color: hexToNum(this.theme.acc), alpha: 0.18 });
    this.ground.addChild(gc);
  }

  _buildBrush(){
    for(const b of (this.layout.brush || [])){
      const g = new PIXI.Graphics();
      g.circle(0, 0, b.r);
      g.fill({ color: 0x0a1408, alpha: 0.55 });
      g.circle(0, 0, b.r);
      g.stroke({ width: 2, color: hexToNum(this.theme.acc), alpha: 0.12 });
      g.x = b.x; g.y = b.y;
      this.decor.addChild(g);
    }
    for(const c of (this.layout.camps || [])){
      const g = new PIXI.Graphics();
      g.circle(0, 0, 46);
      g.fill({ color: hexToNum(this.theme.acc), alpha: 0.08 });
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
  return parseInt(hex.replace('#',''), 16);
}

/** Construit un layout de type "siège" — une lane droite avec courbe douce. */
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

/** Layout circulaire pour l'escarmouche (arena). */
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
