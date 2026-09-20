// ============================================================
// UNIT VIEW v3 — Personnages complets style LoL/MOBA en PixiJS
// Corps, torse, tête, bras, jambes, arme — dessinés en Graphics.
// Vue du dessus légèrement inclinée (isométrique douce).
// Chaque champion a sa propre silhouette + palette de couleur.
// Sbires = forme simplifiée mais reconnaissable.
// ============================================================
import { softCircle, unitShadow } from './textures.js';
import { CHAMPS } from '../data/champions.js';

const TEAM_COLOR   = [0x3f8fd6, 0xd6453f, 0xc9a24a];
const TEAM_COLOR_S = ['#3f8fd6','#d6453f','#c9a24a'];

// Palette par champion
const CHAMP_PALETTE = {
  TARINE:  { skin:'#8d5524', cloth:'#1a3a1a', accent:'#39FF7A', hair:'#141018', weapon:'#c9a86a' },
  SAM:     { skin:'#7a4a2b', cloth:'#0d2d3d', accent:'#16c8bd', hair:'#141018', weapon:'#16c8bd' },
  KAREN:   { skin:'#c68642', cloth:'#1a2a4a', accent:'#8ec5ff', hair:'#2b1a10', weapon:'#8ec5ff' },
  FULGENCE:{ skin:'#5c3317', cloth:'#2a2050', accent:'#a39bff', hair:'#1a1a24', weapon:'#7F77DD' },
  BABA:    { skin:'#8d5524', cloth:'#3a1a10', accent:'#D85A30', hair:'#141018', weapon:'#ff8a5c' },
  LUNDGREN:{ skin:'#a86b3c', cloth:'#102040', accent:'#B5D4F4', hair:'#3d2b1f', weapon:'#dff0ff' },
  DARK:    { skin:'#6b4226', cloth:'#14041a', accent:'#C084FC', hair:'#141018', weapon:'#a855f7' },
};
function getPalette(key){ return CHAMP_PALETTE[key] || { skin:'#8d5524', cloth:'#1c2a1c', accent:'#ffffff', hair:'#141018', weapon:'#aaaaaa' }; }

// ── Convertisseur hex→nombre ──
function h(hex){ return parseInt((hex||'#ffffff').replace('#',''), 16); }

// ── Dessinateur de personnage complet ──
// Tous les personnages sont dessinés à l'origine (0,0), échelle ~1px=1u.
// r = rayon simulateur = taille cible (~24 pour sbire, ~25-30 pour champ)

function drawChampion(g, key, r, teamCol, facing, state){
  const pal = getPalette(key);
  const d = CHAMPS[key];
  // Taille relative au rayon
  const sc = r / 26; // ratio de mise à l'échelle

  // ── OMBRE AU SOL ──
  g.ellipse(0, r * 0.55, r * 1.1, r * 0.35).fill({ color: 0x000000, alpha: 0.38 });

  // ── JAMBES ──
  // Jambe gauche
  const legW = sc * 7, legH = sc * 16;
  const legOff = sc * 5;
  const legY = sc * 6;
  // Jambe gauche
  g.roundRect(-legOff - legW/2, legY, legW, legH, sc*2).fill({ color: h(pal.cloth) });
  g.roundRect(-legOff - legW/2, legY + legH - sc*4, legW + sc*1, sc*5, sc*1.5).fill({ color: h(pal.weapon) }); // botte gauche
  // Jambe droite
  g.roundRect(legOff - legW/2, legY, legW, legH, sc*2).fill({ color: h(pal.cloth) });
  g.roundRect(legOff - legW/2, legY + legH - sc*4, legW + sc*1, sc*5, sc*1.5).fill({ color: h(pal.weapon) }); // botte droite

  // ── TORSE ──
  const torsoW = sc * 18, torsoH = sc * 18;
  const torsoY = -sc * 14;
  g.roundRect(-torsoW/2, torsoY, torsoW, torsoH, sc*3).fill({ color: h(pal.cloth) });
  // détail central (plastron / cape)
  g.roundRect(-torsoW/2 + sc*2, torsoY + sc*2, torsoW - sc*4, torsoH - sc*4, sc*2).fill({ color: h(pal.cloth), alpha:0.6 });
  // emblème sur le torse
  g.circle(0, torsoY + torsoH/2, sc*4).fill({ color: h(pal.accent), alpha:0.9 });

  // ── BRAS ──
  const armW = sc * 6, armH = sc * 14;
  const armY = torsoY + sc*2;
  // Bras gauche (bouclier / défense)
  g.roundRect(-torsoW/2 - armW + sc, armY, armW, armH, sc*2).fill({ color: h(pal.cloth) });
  // Main gauche (poing)
  g.circle(-torsoW/2 - armW/2 + sc, armY + armH, sc*3.5).fill({ color: h(pal.skin) });

  // Bras droit (arme)
  const armAngle = facing === -1 ? -0.3 : 0.2; // orienté selon direction
  g.roundRect(torsoW/2 - sc, armY, armW, armH + sc*4, sc*2).fill({ color: h(pal.cloth) });
  // ── ARME selon rôle ──
  drawWeapon(g, d?.role || 'Combattant', sc, torsoW, armY, armH, pal, facing);

  // ── COU ──
  g.roundRect(-sc*3, torsoY - sc*4, sc*6, sc*5, sc*1.5).fill({ color: h(pal.skin) });

  // ── TÊTE ──
  const headR = sc * 9.5;
  const headY = torsoY - sc*4 - headR;
  g.circle(0, headY, headR).fill({ color: h(pal.skin) });
  // Cheveux/coiffe
  drawHair(g, key, sc, headY, headR, pal, teamCol);
  // Yeux
  const eyeY = headY - sc*1.5;
  g.circle(-sc*3, eyeY, sc*2).fill({ color: 0xffffff });
  g.circle(sc*3, eyeY, sc*2).fill({ color: 0xffffff });
  g.circle(-sc*3 + (facing<0 ? -sc:sc)*0.5, eyeY, sc*1.2).fill({ color: 0x111111 });
  g.circle(sc*3 + (facing<0 ? -sc:sc)*0.5, eyeY, sc*1.2).fill({ color: 0x111111 });

  // ── ANNEAU D'ÉQUIPE sous le personnage ──
  g.circle(0, r*0.6, r*0.6).stroke({ width: sc*2, color: teamCol, alpha:0.8 });
}

function drawWeapon(g, role, sc, torsoW, armY, armH, pal, facing){
  const wx = torsoW/2 + sc*3.5;
  const wy = armY + armH - sc*2;
  const col = h(pal.weapon);
  const aCol = h(pal.accent);
  const dir = facing < 0 ? -1 : 1;

  switch(role){
    case 'Tank': // Grand bouclier
      // Bouclier côté gauche (protège)
      g.roundRect(-torsoW/2 - sc*10, armY - sc*2, sc*8, sc*16, sc*2).fill({ color: col });
      g.roundRect(-torsoW/2 - sc*9, armY - sc*1, sc*6, sc*14, sc*2).fill({ color: aCol, alpha:0.5 });
      // Lance courte côté droit
      g.rect(wx - sc*1.5, wy - sc*8, sc*3, sc*14).fill({ color: col });
      g.poly([wx-sc,wy-sc*8, wx+sc,wy-sc*8, wx,wy-sc*13]).fill({ color: aCol });
      break;
    case 'Assassin': // Deux lames
      g.rect(wx - sc*1.5, wy - sc*8, sc*3, sc*12).fill({ color: col });
      g.poly([wx-sc*1.5,wy-sc*8, wx+sc*1.5,wy-sc*8, wx,wy-sc*14]).fill({ color: 0xffffff, alpha:0.9 });
      // Lame gauche aussi
      g.rect(-torsoW/2 - sc*5, wy - sc*5, sc*3, sc*10).fill({ color: col });
      g.poly([-torsoW/2-sc*5, wy-sc*5, -torsoW/2-sc*2, wy-sc*5, -torsoW/2-sc*3.5, wy-sc*11]).fill({ color: 0xffffff, alpha:0.7 });
      break;
    case 'Mage': // Bâton magique
      g.rect(wx - sc*1.5, wy - sc*20, sc*3, sc*22).fill({ color: col }); // hampe
      g.circle(wx, wy - sc*20, sc*5).fill({ color: aCol }); // orbe
      g.circle(wx, wy - sc*20, sc*3.5).fill({ color: 0xffffff, alpha:0.7 }); // brillance
      break;
    case 'Soutien': // Sceptre de soin
      g.rect(wx - sc*1.5, wy - sc*18, sc*3, sc*20).fill({ color: col });
      // Croix au sommet
      g.rect(wx - sc*5, wy - sc*20, sc*10, sc*3).fill({ color: aCol });
      g.rect(wx - sc*1.5, wy - sc*23, sc*3, sc*9).fill({ color: aCol });
      break;
    default: // Combattant — lance + bouclier
      // Lance
      g.rect(wx - sc*2, wy - sc*20, sc*4, sc*22).fill({ color: col });
      g.poly([wx-sc*3, wy-sc*20, wx+sc*3, wy-sc*20, wx, wy-sc*28]).fill({ color: aCol });
      // Petit bouclier gauche
      g.roundRect(-torsoW/2 - sc*9, armY + sc*2, sc*7, sc*12, sc*2).fill({ color: col });
      g.roundRect(-torsoW/2 - sc*8, armY + sc*3, sc*5, sc*10, sc*1.5).fill({ color: aCol, alpha:0.5 });
  }
}

function drawHair(g, key, sc, headY, headR, pal, teamCol){
  const hc = h(pal.hair);
  const ac = h(pal.accent);
  switch(key){
    case 'TARINE':
      // Coupe courte avec trait d'éveil vert
      g.circle(0, headY - headR*0.3, headR*0.85).fill({ color: hc });
      g.circle(0, headY - headR*0.3, headR*0.85).fill({ color: ac, alpha:0.2 });
      g.roundRect(-sc*3, headY - headR - sc*2, sc*6, sc*4, sc*2).fill({ color: ac, alpha:0.8 });
      break;
    case 'LUNDGREN':
      // Lunettes + crane partiellement chauve
      g.ellipse(0, headY - headR*0.5, headR*0.9, headR*0.6).fill({ color: hc });
      // Lunettes
      g.circle(-sc*3, headY - sc*1, sc*2.8).stroke({ width: sc*1.2, color: ac, alpha:0.9 });
      g.circle(sc*3, headY - sc*1, sc*2.8).stroke({ width: sc*1.2, color: ac, alpha:0.9 });
      g.rect(-sc*3, headY - sc*1, sc*6, sc*0.8).fill({ color: ac, alpha:0.9 });
      break;
    case 'DARK':
      // Capuche sombre, yeux violets
      g.circle(0, headY - headR*0.2, headR*1.05).fill({ color: 0x14041a });
      g.circle(0, headY - headR*0.5, headR*0.9).fill({ color: hc, alpha:0.4 });
      break;
    case 'KAREN':
      // Tresses longues
      g.ellipse(0, headY - headR*0.35, headR, headR*0.9).fill({ color: hc });
      g.rect(-sc*2, headY + headR*0.5, sc*2.5, sc*14).fill({ color: hc });
      g.rect(sc*0.5, headY + headR*0.5, sc*2.5, sc*12).fill({ color: hc });
      break;
    case 'FULGENCE':
      // Crâne rasé, imposant
      g.circle(0, headY - headR*0.15, headR*1.05).fill({ color: hc });
      g.roundRect(-sc*3, headY - headR - sc*1, sc*6, sc*2, sc).fill({ color: ac, alpha:0.6 });
      break;
    case 'SAM':
      // Dreadlocks courtes
      g.circle(0, headY - headR*0.3, headR*0.9).fill({ color: hc });
      for(let i = -2; i <= 2; i++){
        g.rect(i*sc*3.5 - sc*1, headY - headR*0.4, sc*2, sc*6).fill({ color: hc });
      }
      break;
    default: // BABA
      // Afro compact
      g.circle(0, headY - headR*0.3, headR*1.05).fill({ color: hc });
      g.circle(0, headY - headR*0.3, headR*1.05).fill({ color: 0xffffff, alpha:0.06 });
  }
}

function drawMinion(g, r, teamCol){
  const sc = r / 15;
  // Ombre
  g.ellipse(0, r*0.55, r*0.9, r*0.28).fill({ color: 0x000000, alpha:0.3 });
  // Jambes courtes
  g.roundRect(-sc*4, sc*3, sc*3, sc*8, sc).fill({ color: 0x3a2a1a });
  g.roundRect(sc*1, sc*3, sc*3, sc*8, sc).fill({ color: 0x3a2a1a });
  // Corps
  g.roundRect(-sc*6, -sc*7, sc*12, sc*12, sc*2).fill({ color: teamCol === 0x3f8fd6 ? 0x1a3060 : 0x601a1a });
  g.circle(0, -sc*1, sc*3).fill({ color: teamCol, alpha:0.7 });
  // Tête
  g.circle(0, -sc*11, sc*5.5).fill({ color: 0x8d6545 });
  // Yeux
  g.circle(-sc*2, -sc*11.5, sc*1.5).fill({ color: 0xffffff });
  g.circle(sc*2, -sc*11.5, sc*1.5).fill({ color: 0xffffff });
  // Arme simple
  g.rect(sc*5, -sc*8, sc*1.5, sc*10).fill({ color: 0x888888 });
  g.poly([sc*3.5,-sc*8, sc*7,-sc*8, sc*5.25,-sc*12]).fill({ color: 0xaaaaaa });
  // Anneau équipe
  g.circle(0, r*0.6, r*0.55).stroke({ width: sc*1.5, color: teamCol, alpha:0.7 });
}

function drawTower(g, r, teamCol){
  const sc = r / 38;
  g.ellipse(0, r*0.4, r*0.8, r*0.25).fill({ color: 0x000000, alpha:0.4 });
  // Base
  g.poly([-r*0.7, r*0.3, r*0.7, r*0.3, r*0.55, -r*0.5, -r*0.55, -r*0.5]).fill({ color: teamCol === 0x3f8fd6 ? 0x0d2040 : 0x400d0d });
  // Corps
  g.rect(-r*0.3, -r*0.8, r*0.6, r*0.35).fill({ color: teamCol === 0x3f8fd6 ? 0x1a3d60 : 0x5a1010 });
  // Canon
  g.rect(-r*0.12, -r*1.1, r*0.24, r*0.3).fill({ color: 0x888888 });
  // Cristal au sommet
  g.circle(0, -r*1.1, r*0.22).fill({ color: teamCol, alpha:0.9 });
  g.circle(0, -r*1.1, r*0.22).stroke({ width: sc*2, color: 0xffffff, alpha:0.4 });
}

function drawAutel(g, r, teamCol){
  g.ellipse(0, r*0.35, r*0.85, r*0.28).fill({ color: 0x000000, alpha:0.45 });
  // Socle hexagonal
  const pts = [];
  for(let i=0;i<6;i++){ const a=-Math.PI/2+i*Math.PI/3; pts.push(Math.cos(a)*r*0.85, Math.sin(a)*r*0.55); }
  g.poly(pts).fill({ color: teamCol === 0x3f8fd6 ? 0x0a1e3a : 0x3a0a0a });
  g.poly(pts).stroke({ width: 3, color: teamCol, alpha:0.8 });
  // Cristal central
  const inner = [];
  for(let i=0;i<6;i++){ const a=-Math.PI/2+i*Math.PI/3; inner.push(Math.cos(a)*r*0.4, Math.sin(a)*r*0.25); }
  g.poly(inner).fill({ color: teamCol, alpha:0.9 });
  g.poly(inner).stroke({ width: 2, color: 0xffffff, alpha:0.5 });
  g.circle(0, 0, r*0.18).fill({ color: 0xffffff, alpha:0.85 });
}

// ─────────────────────────────────────────────────────────
export class UnitView {
  constructor(layers, unit, accentHex = 0x3f8fd6){
    this.layers = layers;
    this.unit = unit;
    this.accent = accentHex;
    this.dispX = unit.x;
    this.dispY = unit.y;
    this._facing = 1; // 1=droite, -1=gauche
    this._state = 'idle'; // idle | attack | cast
    this._stateT = 0;

    // Container principal (suit le personnage)
    this.body = new PIXI.Container();
    this.body.sortableChildren = false;
    layers.units.addChild(this.body);

    // Glow additif
    this.glow = new PIXI.Sprite(softCircle());
    this.glow.anchor.set(0.5);
    this.glow.tint = accentHex;
    this.glow.alpha = 0.4;
    this.glow.blendMode = 'add';
    layers.glow.addChild(this.glow);

    // Barre de vie
    this.hpWrap = new PIXI.Container();
    this.hpBg   = new PIXI.Graphics();
    this.hpFill = new PIXI.Graphics();
    this.hpWrap.addChild(this.hpBg, this.hpFill);
    layers.overlay.addChild(this.hpWrap);

    // Anneau de sélection
    this.selRing = new PIXI.Graphics();
    layers.overlay.addChild(this.selRing);

    this._draw();
  }

  _draw(){
    this.body.removeChildren().forEach(c => c.destroy && c.destroy());
    const g = new PIXI.Graphics();
    const u = this.unit;
    const r = u.r || 24;
    const teamCol = TEAM_COLOR[u.team] ?? TEAM_COLOR[2];

    // Champions et sbires sont maintenant rendus en 3D par Babylon.js
    // (voir engine/babylon-units.js), superposé sous ce canvas PixiJS.
    // On ne dessine donc plus leur corps ici : seuls la barre de vie,
    // le glow et l'anneau de sélection restent en 2D par-dessus.
    if(u.kind === 'tower'){
      drawTower(g, r, teamCol);
    } else if(u.kind === 'autel' || u.kind === 'autel_hidden'){
      drawAutel(g, r, teamCol);
    } else if(u.kind !== 'champ' && u.kind !== 'minion'){
      // fallback cercle pour tout type non géré ailleurs
      g.circle(0, 0, r).fill({ color: teamCol, alpha:0.8 });
    }

    this.body.addChild(g);
    this.glow.width = this.glow.height = r * 5.5;
    // Glow discret pour champ/minion (le relief vient du modèle 3D) ;
    // gardé plus visible pour tours/autel qui restent en Graphics.
    this._is3D = (u.kind === 'champ' || u.kind === 'minion');
  }

  setSelected(v){
    this.selRing.clear();
    if(v){
      const r = (this.unit.r||24) * 1.15;
      this.selRing.circle(0, 0, r).stroke({ width: 2.5, color: 0xffffff, alpha: 0.85 });
      for(let i=0;i<4;i++){
        const a = i*Math.PI/2;
        const rx = Math.cos(a)*r, ry = Math.sin(a)*r;
        this.selRing.rect(rx-4,ry-4,8,8).fill({ color: 0xffffff, alpha:0.9 });
      }
    }
  }

  flashHit(){
    this.glow.alpha = 1.2;
    this._state = 'attack'; this._stateT = 0;
    this.body.scale.set(1.08);
    setTimeout(() => { if(!this.body.destroyed){ this.body.scale.set(1); this.glow.alpha = 0.4; } }, 100);
  }

  update(dt, u){
    this.unit = u;
    const lerpSpeed = 1 - Math.pow(0.0001, dt);
    // Détecter la direction
    const dx = u.x - this.dispX;
    if(Math.abs(dx) > 2) this._facing = dx > 0 ? 1 : -1;

    this.dispX += (u.x - this.dispX) * lerpSpeed;
    this.dispY += (u.y - this.dispY) * lerpSpeed;

    this._stateT += dt;

    const dead = !!u.dead;
    this.body.x = this.dispX;
    this.body.y = this.dispY;
    this.body.scale.x = this._facing; // flip horizontal
    this.body.visible = !dead;

    this.glow.x = this.dispX; this.glow.y = this.dispY;
    this.glow.visible = !dead;

    this.selRing.x = this.dispX; this.selRing.y = this.dispY;

    // Pulsation glow — atténuée pour les unités rendues en 3D (Babylon
    // apporte déjà son propre relief/lumière ; on garde juste un halo
    // discret pour la lisibilité de l'équipe).
    if(!dead){
      const pulse = 1 + Math.sin(performance.now()/500 + (u.id||0))*0.07;
      const base = u.glowBoost ? 0.9 : (this._is3D ? 0.16 : 0.35);
      this.glow.alpha = base * pulse;
    }

    // Animation de marche légère (oscillation verticale)
    if(!dead && u.kind === 'champ' && u.ms > 0){
      const moving = Math.abs(u.x - this.dispX) > 0.5 || Math.abs(u.y - this.dispY) > 0.5;
      if(moving){
        this.body.y += Math.sin(performance.now()/120)*2.5;
      }
    }

    // HP bar
    this.hpWrap.visible = !dead && !!u.maxHp && u.kind !== 'autel_hidden';
    if(this.hpWrap.visible){
      const pct = Math.max(0, u.hp / u.maxHp);
      const w = (u.r||24)*2.2, h = 5;
      this.hpBg.clear().rect(-w/2, 0, w, h).fill({ color:0x000000, alpha:0.65 });
      this.hpFill.clear().rect(-w/2, 0, w*pct, h)
        .fill({ color: pct>0.5 ? 0x4aa876 : pct>0.25 ? 0xc9a24a : 0xd6453f });
      this.hpWrap.x = this.dispX;
      this.hpWrap.y = this.dispY - (u.r||24)*1.8 - 14;
    }

    // Z-order : plus le personnage est bas sur l'écran, plus il passe devant
    this.body.zIndex = this.dispY;
  }

  destroy(){
    this.glow.destroy();
    this.body.destroy({ children: true });
    this.hpWrap.destroy({ children: true });
    this.selRing.destroy();
  }
}

// Garde compatibilité avec main.js (préchargement portraits)
export function preloadPortraits(keys){ return Promise.resolve(); }
