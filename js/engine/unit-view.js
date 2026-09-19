// ============================================================
// UNIT VIEW — traduit une unité de simulation en objets PixiJS.
// Les champions affichent leur véritable portrait dessiné (voir
// engine/portraits.js — génération SVG, aucune image chargée depuis
// un fichier externe), recadré en médaillon circulaire avec un
// anneau d'équipe. Sbires, tours et nexus restent en formes
// géométriques (ce sont des unités anonymes, pas des personnages).
// Glow additif + ombre portée pour garder le rendu PixiJS.
// ============================================================
import { softCircle, unitShadow, softRing } from './textures.js';
import { portraitFor } from './portraits.js';

const TEAM_COLOR = [0x3f8fd6, 0xd6453f, 0xc9a24a]; // allié / ennemi / neutre

const portraitTextureCache = new Map();

function loadPortraitTexture(key){
  return new Promise((resolve) => {
    if(portraitTextureCache.has(key)) return resolve(portraitTextureCache.get(key));
    const img = new Image();
    img.onload = () => {
      const tex = PIXI.Texture.from(img);
      portraitTextureCache.set(key, tex);
      resolve(tex);
    };
    img.onerror = () => resolve(null);
    img.src = portraitFor(key);
  });
}

/**
 * Précharge les textures de portrait pour les clés données (attendre cette
 * promesse avant de lancer un combat évite le cercle vide le temps que le
 * SVG se décode). Sans appel préalable, UnitView retombe sur la forme
 * géométrique — aucun crash, juste moins joli le temps du premier chargement.
 */
export function preloadPortraits(keys){
  return Promise.all(keys.map(loadPortraitTexture));
}

function getPortraitTexture(key){
  return portraitTextureCache.get(key) || null;
}

export class UnitView{
  constructor(layers, unit, accentHex = 0x3f8fd6){
    this.layers = layers;
    this.unit = unit;
    this.accent = accentHex;
    this.dispX = unit.x; this.dispY = unit.y;

    this.shadow = new PIXI.Sprite(unitShadow());
    this.shadow.anchor.set(0.5);
    layers.shadows.addChild(this.shadow);

    this.glow = new PIXI.Sprite(softCircle());
    this.glow.anchor.set(0.5);
    this.glow.tint = accentHex;
    this.glow.alpha = 0.5;
    layers.glow.addChild(this.glow);

    this.body = new PIXI.Container();
    layers.units.addChild(this.body);

    this.bg = new PIXI.Graphics();
    this.body.addChild(this.bg);

    // Portrait en médaillon — uniquement pour les champions, et seulement si
    // la texture a été préchargée (voir preloadPortraits). Sinon repli sur
    // la forme géométrique, comme pour les unités anonymes.
    this.portrait = null;
    this.portraitMask = null;
    const portraitTex = (unit.kind === 'champ' && unit.key) ? getPortraitTexture(unit.key) : null;
    if(portraitTex){
      this.portrait = new PIXI.Sprite(portraitTex);
      this.portrait.anchor.set(0.5, 0.4); // recentré sur le visage du portrait (SVG 200x260)
      this.body.addChild(this.portrait);
      this.portraitMask = new PIXI.Graphics();
      this.body.addChild(this.portraitMask);
      this.portrait.mask = this.portraitMask;
    }

    this.ring = new PIXI.Graphics();
    this.body.addChild(this.ring);

    this.selRing = new PIXI.Sprite(softRing());
    this.selRing.anchor.set(0.5);
    this.selRing.tint = 0xffffff;
    this.selRing.visible = false;
    this.body.addChild(this.selRing);

    this.hpWrap = new PIXI.Container();
    layers.overlay.addChild(this.hpWrap);
    this.hpBg = new PIXI.Graphics();
    this.hpFill = new PIXI.Graphics();
    this.hpWrap.addChild(this.hpBg, this.hpFill);

    this._redrawShape();
  }

  _redrawShape(){
    const u = this.unit;
    const r = u.r || 24;
    const teamColor = TEAM_COLOR[u.team] ?? TEAM_COLOR[2];

    this.bg.clear();
    if(this.portrait){
      // Médaillon : le visage (rayon ~76 en unités SVG, centré à 100,104) remplit
      // le cercle du personnage. On zoome légèrement au-delà de r pour ne jamais
      // laisser de bord vide visible une fois le masque appliqué.
      const size = r * 4.15;
      this.portrait.width = size; this.portrait.height = size * (260/200);
      this.portraitMask.clear().circle(0, 0, r).fill(0xffffff);
      this.ring.clear();
      this.ring.circle(0, 0, r).stroke({ width: 3, color: teamColor, alpha: 0.95 });
      this.ring.circle(0, 0, r + 2).stroke({ width: 1, color: 0x000000, alpha: 0.35 });
    } else if(u.kind === 'tower' || u.kind === 'nexus'){
      const n = u.kind === 'nexus' ? 6 : 5;
      drawPolygon(this.bg, n, r, 0x14141c, teamColor, 3);
      this.bg.circle(0, 0, Math.max(3, r*0.28)).fill({ color: this.accent, alpha: 0.9 });
    } else {
      // Sbires : un simple disque teinté équipe, sans portrait (unités anonymes).
      this.bg.circle(0, 0, r).fill(0x14141c);
      this.bg.circle(0, 0, r).stroke({ width: 2.5, color: teamColor, alpha: 0.95 });
      this.bg.circle(0, 0, Math.max(3, r*0.28)).fill({ color: this.accent, alpha: 0.9 });
    }

    this.glow.width = this.glow.height = r * 5.2;
    this.shadow.width = r * 2.3; this.shadow.height = r * 1.1;

    this.selRing.width = this.selRing.height = r * 2.6;
  }

  setSelected(v){ this.selRing.visible = v; }

  /** Appelé chaque frame — dt en secondes, u = unité de simulation à jour. */
  update(dt, u){
    this.unit = u;
    const lerpSpeed = 1 - Math.pow(0.0001, dt);
    this.dispX += (u.x - this.dispX) * lerpSpeed;
    this.dispY += (u.y - this.dispY) * lerpSpeed;

    this.body.x = this.dispX; this.body.y = this.dispY;
    this.shadow.x = this.dispX; this.shadow.y = this.dispY + (u.r||24)*0.8;
    this.glow.x = this.dispX; this.glow.y = this.dispY;

    const dead = !!u.dead;
    this.body.visible = !dead;
    this.shadow.visible = !dead;
    this.glow.visible = !dead;
    this.hpWrap.visible = !dead && u.kind !== 'nexus_hidden';

    // Pulsation légère du glow pour donner de la vie, plus marquée en cast/dégâts.
    const pulse = 1 + Math.sin(performance.now()/450 + (u.id||0)) * 0.06;
    this.glow.alpha = (u.glowBoost ? 0.85 : 0.42) * pulse;

    if(!dead && u.maxHp){
      const pct = Math.max(0, u.hp / u.maxHp);
      const w = (u.r || 24) * 2.1, h = 5;
      this.hpBg.clear().rect(-w/2, 0, w, h).fill({ color: 0x000000, alpha: 0.6 });
      this.hpFill.clear().rect(-w/2, 0, w * pct, h)
        .fill({ color: pct > 0.5 ? 0x4aa876 : pct > 0.25 ? 0xc9a24a : 0xd6453f });
      this.hpWrap.x = this.dispX; this.hpWrap.y = this.dispY - (u.r||24) - 16;
    }
  }

  flashHit(){
    this.glow.alpha = 1;
    this.body.scale.set(1.12);
    setTimeout(() => { if(!this.body.destroyed) this.body.scale.set(1); }, 90);
  }

  destroy(){
    this.shadow.destroy(); this.glow.destroy();
    this.body.destroy({ children: true });
    this.hpWrap.destroy({ children: true });
  }
}

function drawPolygon(g, sides, r, fillColor, strokeColor, strokeWidth){
  const pts = [];
  for(let i = 0; i < sides; i++){
    const a = -Math.PI/2 + i * (Math.PI*2/sides);
    pts.push(Math.cos(a)*r, Math.sin(a)*r);
  }
  g.poly(pts).fill(fillColor);
  g.poly(pts).stroke({ width: strokeWidth, color: strokeColor, alpha: 0.95 });
}
