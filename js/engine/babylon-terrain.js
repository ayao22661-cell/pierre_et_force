// ============================================================
// BABYLON TERRAIN — monte la scène de combat complète à partir du
// lieu de la mission (js/engine/scene/scene-map.js) :
//
//   1. relief doux, aplani sous la voie ;
//   2. composition du décor (composer.js) : on décide d'abord OÙ va
//      chaque arbre, maison ou rocher ;
//   3. cuisson du sol (ground-bake.js) : toute la carte est peinte
//      dans une seule image, la voie fondue dans le terrain et les
//      ombres de contact déjà posées au pied du décor ;
//   4. construction du décor en instanciation GPU (un appel de rendu
//      par matériau, quel que soit le nombre de copies) ;
//   5. lumière et étalonnage du biome.
//
// La signature reste `new BabylonTerrain(scene, theme, layout, seed)`
// et `scene.metadata.groundHeight` est toujours fourni : rien d'autre
// à changer dans le jeu.
// ============================================================

import { BIOMES } from './scene/biomes.js';
import { sceneFor } from './scene/scene-map.js';
import { Composer } from './scene/composer.js';
import { bakeGround } from './scene/ground-bake.js';
import { matCache } from './scene/geo.js';
import * as T from './scene/textures.js';
import { valueNoise, smooth, clamp } from './scene/noise.js';
import { CAMPAIGN } from '../data/campaign.js';

/**
 * Moment de la journée d'une mission, lu dans son récit : « l'aube »,
 * « le soir »… (la nuit vient déjà du lieu). Défaut : plein jour.
 */
function momentFor(missionId, night){
  if(night) return 'nuit';
  for(const a of CAMPAIGN) for(const m of a.missions){
    if(m.id !== missionId) continue;
    const t = [m.brief || '', ...(m.narr_avant || []).slice(0, 2)].join(' ').toLowerCase();
    if(/\b(aube|petit matin|lever du (jour|soleil)|au matin)\b/.test(t)) return 'aube';
    if(/\b(soir|crépuscule|couchant|coucher du soleil|fin d'après-midi)\b/.test(t)) return 'crepuscule';
    return 'jour';
  }
  return 'jour';
}

const WORLD_SCALE = 45; // identique à babylon-units.js
const MARGIN = 11;      // lisière construite hors de la zone jouable

// Ciels par biome : zénith, milieu, horizon. Le rendu n'y touche qu'en
// vue basse (mode Combat) — d'où des teintes pensées pour un fond, pas
// pour éclairer la scène.
const SKY = {
  abidjan: { day: { top: '#2f6fae', mid: '#8fc0dc', low: '#f0dcb0', clouds: 0.55 }, night: { top: '#070c1c', mid: '#14203c', low: '#3a3a52', clouds: 0.2 } },
  banco:   { day: { top: '#2a5a3a', mid: '#7fae86', low: '#d8e0a8', clouds: 0.4 }, night: { top: '#040a08', mid: '#0e1a14', low: '#1e2a20', clouds: 0.15 } },
  essence: { day: { top: '#1a2a5a', mid: '#5f86c8', low: '#bfe8ec', clouds: 0.35 }, night: { top: '#0a0620', mid: '#241a4a', low: '#4a3a78', clouds: 0.3 } },
  born:    { day: { top: '#4a4a52', mid: '#8a8a92', low: '#c0bcb4', clouds: 0.7 }, night: { top: '#12121a', mid: '#24242e', low: '#3a3a44', clouds: 0.4 } },
  polar:   { day: { top: '#3a6a9a', mid: '#9fc8e4', low: '#eaf2fa', clouds: 0.6 }, night: { top: '#050e1c', mid: '#0e2036', low: '#22405e', clouds: 0.3 } },
  sahel:   { day: { top: '#3a76ae', mid: '#b8c8c0', low: '#f0cc90', clouds: 0.3 }, night: { top: '#0a0e1e', mid: '#1c2136', low: '#4a3c34', clouds: 0.2 } },
  canyon:  { day: { top: '#2f6aa8', mid: '#9ab4c4', low: '#e2a468', clouds: 0.35 }, night: { top: '#0a0c18', mid: '#1a1c2c', low: '#3a2a22', clouds: 0.2 } },
  abyss:   { day: { top: '#03161c', mid: '#0a3040', low: '#1c5a62', clouds: 0.15 }, night: { top: '#01080c', mid: '#052028', low: '#0e3a44', clouds: 0.1 } },
  void:    { day: { top: '#08041a', mid: '#2a1a4a', low: '#5a3a86', clouds: 0.25 }, night: { top: '#06020f', mid: '#1e1038', low: '#42266a', clouds: 0.25 } },
  sgrun:   { day: { top: '#050a12', mid: '#12202e', low: '#24485e', clouds: 0.2 }, night: { top: '#03060c', mid: '#0c1620', low: '#1a3244', clouds: 0.15 } },
  tower:   { day: { top: '#2a4a70', mid: '#7f9ab4', low: '#d8ccb8', clouds: 0.4 }, night: { top: '#0a0e18', mid: '#1c2432', low: '#3e3a42', clouds: 0.2 } },
};

function hexColor(hex){
  const n = parseInt((hex || '#808080').replace('#', ''), 16);
  return new BABYLON.Color3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export class BabylonTerrain{
  /**
   * @param {BABYLON.Scene} scene  scène partagée avec BabylonUnits
   * @param {object} theme         thème hérité ; `theme.missionId` sert à choisir le lieu
   * @param {object} layout        siegeLayout() / arenaLayout()
   * @param {number} seed
   * @param {object} [place]       { biome, setting, variant, night } — sinon déduit de la mission
   */
  constructor(scene, theme, layout, seed = 0, place = null){
    const t0 = performance.now();
    this.scene = scene;
    this.layout = layout;
    this.theme = theme || {};
    this.seed = seed >>> 0;
    this.place = place || sceneFor(this.theme.missionId);
    this.biome = BIOMES[this.place.biome] || BIOMES.abidjan;
    this.root = new BABYLON.TransformNode('terrainRoot', scene);
    // Graphismes : brouillard et éclairage d'environnement AVANT la
    // création des matériaux (ils sont figés ensuite).
    this.gfx = scene.metadata?.gfx || null;
    this.gfx?.beginPlace({ ...this.place, moment: momentFor(this.theme.missionId, !!this.place.night), seed: this.theme.missionId || this.seed });

    const bx = layout.w / WORLD_SCALE, bz = layout.h / WORLD_SCALE;
    this.play = { x0: 0, x1: bx, z0: 0, z1: -bz };
    // MODE COMBAT : on rétrécit la zone jouable autour du centre. Les règles
    // de composition placent leur décor sur les bords : sur une arène de 49
    // par 33 mètres, ce décor se retrouvait à trente mètres et le duel se
    // déroulait au milieu d'un terrain vague. Resserrée, la même composition
    // dessine un anneau fermé juste derrière les combattants.
    if(this.theme.mode === 'duel'){
      const cx = bx / 2, cz = -bz / 2, hw = 11, hh = 8;
      this.play = { x0: cx - hw, x1: cx + hw, z0: cz + hh, z1: cz - hh };
    }
    this.bounds = { x0: -MARGIN, x1: bx + MARGIN, z0: MARGIN, z1: -bz - MARGIN };
    this.laneHalf = (layout.laneWidth || 220) / WORLD_SCALE / 2;
    this.path = (layout.path || []).map(p => ({ x: p.x / WORLD_SCALE, z: -p.y / WORLD_SCALE }));
    this.small = Math.min(window.innerWidth || 1280, window.innerHeight || 800) < 560;

    this._buildHeight();
    const composer = this._compose();
    const baked = this._bake(composer.shadows);
    this._buildGround(baked);
    try{ this._buildWater(baked); }catch(e){ console.warn('[BabylonTerrain] eau animée indisponible', e); }
    try{ this._buildGrass(baked); }catch(e){ console.warn('[BabylonTerrain] herbe indisponible', e); }
    composer.commit(this.root);

    // Obstacles solides : arbres, maisons, rochers, murs… Le compositeur
    // sait déjà où il les a posés et avec quelle emprise au sol ; on les
    // publie en coordonnées Pixi pour que la simulation empêche de les
    // traverser. Les herbes et les décalcomanies n'en font pas partie
    // (elles sont posées avec `solid: false`).
    // Maisons, murs et conteneurs gardent leur emprise RECTANGULAIRE
    // (orientée) : réduits à un cercle, on passait à travers les bouts
    // des murs et entre deux maisons d'une même rangée.
    this.obstacles = composer.placed
      .filter(o => o.hw != null || o.r >= 0.45)
      .map(o => {
        const ob = { x: o.x * WORLD_SCALE, y: -o.z * WORLD_SCALE, r: o.r * WORLD_SCALE * 0.82, h: o.h ?? 2 };
        if(o.hw != null){
          // Axe X local du modèle, tourné de `rot` autour de Y (repère
          // Babylon), puis ramené en Pixi (y = -z).
          ob.hw = o.hw * WORLD_SCALE; ob.hd = o.hd * WORLD_SCALE;
          ob.ux = Math.cos(o.rot); ob.uy = Math.sin(o.rot);
          ob.r = Math.hypot(ob.hw, ob.hd);   // rayon englobant (tri rapide)
        }
        return ob;
      });
    // MODE COMBAT : l'arène est un anneau de décor. On publie ses bords
    // (en Pixi) pour que ni les combattants ni la caméra n'en sortent.
    if(this.theme.mode === 'duel'){
      const P = this.play;
      this.arena = { x0: P.x0 * WORLD_SCALE, x1: P.x1 * WORLD_SCALE, y0: -P.z0 * WORLD_SCALE, y1: -P.z1 * WORLD_SCALE };
    }

    this._light();
    this.gfx?.finishPlace();
    if(this.theme.mode === 'duel') this._sky();   // invisible en vue plongeante, et il masquait la carte
    // Modèles 3D réels (sentinelles de Sgrün, vaisseau, artefacts) : chargés
    // après coup pour ne pas retarder l'affichage du terrain.
    this._loadModels(composer.models).catch(e => console.error('[BabylonTerrain] ❌ modèle de décor', e));

    let calls = 0, inst = 0;
    for(const m of this.root.getChildMeshes()){ calls++; inst += m.thinInstanceCount || 1; }
    console.log(`[BabylonTerrain] ${this.place.biome}${this.place.setting ? '/' + this.place.setting : ''}${this.place.variant ? '/' + this.place.variant : ''}`
      + ` — ${calls} appels de rendu, ${inst} éléments, sol ${baked.W}x${baked.H}px, ${(performance.now() - t0).toFixed(0)} ms`);
  }

  // ── 1. relief ────────────────────────────────────────────────
  _buildHeight(){
    const n1 = valueNoise(this.seed + 3), n2 = valueNoise(this.seed + 11);
    const amp = this.biome.flat ? 0.15 : 0.5;
    const laneHalf = this.laneHalf;
    const P = this.path;
    const laneDist = (x, z) => {
      if(!P.length) return 1e9;
      let best = 1e9;
      for(let k = 0; k < P.length - 1; k++){
        const ax = P[k].x, az = P[k].z, dx = P[k + 1].x - ax, dz = P[k + 1].z - az;
        const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz));
        const ex = ax + dx * t - x, ez = az + dz * t - z;
        best = Math.min(best, ex * ex + ez * ez);
      }
      return Math.sqrt(best);
    };
    this.laneDist = laneDist;
    // La voie et ses abords restent plats : c'est là que tout se joue.
    this.height = (x, z) => {
      const h = (n1(x * 0.12, z * 0.12) - 0.5) * 2 * amp + (n2(x * 0.32, z * 0.32) - 0.5) * amp * 0.5;
      const k = smooth(laneHalf * 1.1, laneHalf * 3.2, laneDist(x, z));
      return h * (0.25 + 0.75 * k);
    };
  }

  // ── 2. composition ───────────────────────────────────────────
  _compose(){
    const reserved = [];
    const P = this.path;
    if(P.length){
      reserved.push({ x: P[0].x, z: P[0].z, r: 5.5 });                        // base alliée
      reserved.push({ x: P[P.length - 1].x, z: P[P.length - 1].z, r: 5.5 });  // base ennemie
    } else {
      reserved.push({ x: (this.play.x0 + this.play.x1) / 2, z: (this.play.z0 + this.play.z1) / 2, r: 7 });
    }
    for(const c of (this.layout.camps || [])) reserved.push({ x: c.x / WORLD_SCALE, z: -c.y / WORLD_SCALE, r: 3 });

    const c = new Composer({
      play: this.play, margin: MARGIN, path: P.length ? P : null, laneHalf: this.laneHalf,
      reserved, seed: this.seed, small: this.small, groundHeight: (x, z) => this.height(x, z),
    });
    c.scene = this.scene;
    const store = new Map();                 // une forme construite une seule fois
    const S = (key, make) => { if(!store.has(key)) store.set(key, make()); return store.get(key); };
    const v = { setting: this.place.setting, variant: this.place.variant, night: !!this.place.night };
    this.biome.compose(c, S, v);

    // Bosquets du niveau (zones de gameplay) : buissons denses aux points prévus
    // Sur le pont, les bosquets tomberaient dans la lagune.
    const brushTpl = this.place.setting === 'pont' ? null : store.get('bushA') || store.get('jbush0') || store.get('hedge') || store.get('plant');
    if(brushTpl) for(const b of (this.layout.brush || [])){
      const bx = b.x / WORLD_SCALE, bz = -b.y / WORLD_SCALE, r = (b.r || 90) / WORLD_SCALE;
      for(let i = 0; i < 8; i++){
        const a = i / 8 * Math.PI * 2 + c.R(), d = Math.sqrt(c.R()) * r;
        const x = bx + Math.cos(a) * d, z = bz + Math.sin(a) * d;
        if(c.blocked(x, z, 0.3)) continue;
        c.put(brushTpl, x, z, { s: 0.9 + c.R() * 0.5, pad: 0.5 });
      }
    }
    this.composer = c;
    return c;
  }

  // ── 3. cuisson du sol ────────────────────────────────────────
  _bake(shadows){
    // En mode Combat la caméra est deux fois plus près : le sol est peint
    // à une résolution plus fine, sinon la texture cuite apparaît floue.
    const duel = this.theme.mode === 'duel';
    const ppu = (this.small ? 14 : 21) * (duel ? 1.7 : 1);
    const v = { setting: this.place.setting, variant: this.place.variant, night: !!this.place.night };
    // La recette ne fait que décrire les couches : elles reçoivent les vrais
    // outils de peinture au moment de la cuisson.
    const recipe = this.biome.ground({ laneHalf: this.laneHalf, play: this.play, bounds: this.bounds, ppu }, v);
    return bakeGround({
      bounds: this.bounds, ppu, path: this.path.length ? this.path : null, arena: !this.path.length,
      laneHalf: this.laneHalf, play: this.play, recipe, shadows, seed: this.seed,
    });
  }

  // ── 4. sol ───────────────────────────────────────────────────
  _buildGround(baked){
    const B = this.bounds;
    const W = B.x1 - B.x0, H = B.z0 - B.z1;
    const sub = this.small ? 40 : 72;
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: W, height: H, subdivisions: sub, updatable: true }, this.scene);
    ground.parent = this.root;
    ground.position.set((B.x0 + B.x1) / 2, 0, (B.z0 + B.z1) / 2);
    const pos = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const cx = ground.position.x, cz = ground.position.z;
    for(let i = 0; i < pos.length; i += 3) pos[i + 1] = this.height(pos[i] + cx, pos[i + 2] + cz);
    ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, pos);
    ground.createNormals(true);

    const mat = new BABYLON.StandardMaterial('groundMat', this.scene);
    const tex = new BABYLON.DynamicTexture('groundBake', baked.color, this.scene, true);
    tex.update(true);
    tex.wrapU = tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
    tex.anisotropicFilteringLevel = 8;
    mat.diffuseTexture = tex;
    mat.specularColor = new BABYLON.Color3(0.03, 0.03, 0.03);
    if(baked.emissive){
      const em = new BABYLON.DynamicTexture('groundEm', baked.emissive, this.scene, true);
      em.update(true); em.wrapU = em.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
      mat.emissiveTexture = em;
    }
    // grain fin : le sol reste net de près sans agrandir l'image cuite
    try{
      const det = new BABYLON.DynamicTexture('groundDetail', T.texDetail(this.seed + 5), this.scene, true);
      det.update(true);
      det.uScale = det.vScale = W / 1.1;   // grain fin : ~1 unité par tuile
      mat.detailMap.texture = det;
      mat.detailMap.isEnabled = true;
      mat.detailMap.diffuseBlendLevel = 0.09;
      mat.detailMap.bumpLevel = 0.12;
    }catch(e){ /* detailMap indisponible : sans conséquence */ }
    ground.material = mat;
    ground.isPickable = false;
    ground.freezeWorldMatrix();
    // Le sol reçoit les ombres des personnages : son matériau n'est pas
    // figé (figé, il ne se recompile plus quand les ombres s'allument).
    if(this.gfx) this.gfx.addReceiver(ground);
    else mat.freeze();
    this.ground = ground;

    const meta = this.scene.metadata = this.scene.metadata || {};
    meta.groundHeight = (x, z) => this.height(x, z) + 0.02;
  }

  /**
   * EAU ANIMÉE — une surface épouse le relief là où la cuisson a peint de
   * l'eau (lagune, lac) : vaguelettes qui défilent, reflets du ciel
   * d'environnement et éclats du soleil. L'eau peinte reste visible
   * dessous : la surface n'ajoute que le mouvement et la lumière.
   */
  _buildWater(baked){
    if(!baked.water) return;
    const sc = this.scene, full = (this.gfx?.T?.water || 'full') === 'full';
    const night = !!this.place.night;
    const w = this.ground.clone('water');
    w.unfreezeWorldMatrix();
    w.position.y += 0.05;
    w.freezeWorldMatrix();
    w.isPickable = false;
    w.receiveShadows = false;
    const mat = new BABYLON.StandardMaterial('waterMat', sc);
    const mask = new BABYLON.DynamicTexture('waterMask', baked.water, sc, true);
    mask.update(true);
    mask.wrapU = mask.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
    mask.hasAlpha = true;
    mat.opacityTexture = mask;
    mat.alpha = full ? 0.62 : 0.45;
    mat.diffuseColor = night ? new BABYLON.Color3(0.03, 0.07, 0.14) : new BABYLON.Color3(0.08, 0.28, 0.34);
    mat.specularColor = night ? new BABYLON.Color3(0.5, 0.6, 0.9) : new BABYLON.Color3(1, 0.97, 0.9);
    mat.specularPower = 110;
    const nrm = new BABYLON.DynamicTexture('waterNormal', waterNormalCanvas(this.seed), sc, true);
    nrm.update(true);
    const W = this.bounds.x1 - this.bounds.x0, H = this.bounds.z0 - this.bounds.z1;
    nrm.uScale = W / 5; nrm.vScale = H / 5;
    nrm.level = 0.7;
    mat.bumpTexture = nrm;
    if(full && sc.environmentTexture){
      mat.reflectionTexture = sc.environmentTexture;
      mat.reflectionFresnelParameters = new BABYLON.FresnelParameters();
      mat.reflectionFresnelParameters.bias = 0.12;
      mat.reflectionFresnelParameters.power = 2;
      mat.reflectionFresnelParameters.leftColor = BABYLON.Color3.White();
      mat.reflectionFresnelParameters.rightColor = BABYLON.Color3.Black();
    }
    mat.backFaceCulling = true;
    w.material = mat;
    // Vaguelettes : la carte de relief défile lentement.
    this._waterObs = sc.onBeforeRenderObservable.add(() => {
      const dt = sc.getEngine().getDeltaTime() / 1000 * (sc.animationTimeScale || 1);
      nrm.uOffset = (nrm.uOffset + dt * 0.018) % 1;
      nrm.vOffset = (nrm.vOffset + dt * 0.011) % 1;
    });
    this.water = w;
  }

  /**
   * VÉGÉTATION DENSE — des milliers de touffes d'herbe en instances GPU
   * (un seul appel de rendu), posées là où le sol peint est de l'herbe et
   * teintées de sa couleur exacte, hors de la voie, de l'eau et du décor.
   * Elles ondulent au vent (petit ajout au shader de sommets).
   */
  _buildGrass(baked){
    const k = this.gfx?.T?.grass ?? 0.6;
    if(!k || this.place.biome === 'polar' || this.place.biome === 'tower') return;
    const sc = this.scene, B = this.bounds;
    const PX = 4;                                   // échantillons par unité
    const sw = Math.round((B.x1 - B.x0) * PX), sh = Math.round((B.z0 - B.z1) * PX);
    const small = document.createElement('canvas'); small.width = sw; small.height = sh;
    const sctx = small.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(baked.color, 0, 0, sw, sh);
    const img = sctx.getImageData(0, 0, sw, sh).data;
    let wimg = null, ww = 0, wh = 0;
    if(baked.water){
      ww = baked.water.width; wh = baked.water.height;
      wimg = baked.water.getContext('2d').getImageData(0, 0, ww, wh).data;
    }
    const R = rngFrom(this.seed + 404);
    const area = (B.x1 - B.x0) * (B.z0 - B.z1);
    const tries = Math.round(area * 14 * k);
    const mats = [], cols = [];
    const lane = (this.laneHalf || 2) * 1.15;
    for(let n = 0; n < tries; n++){
      const x = B.x0 + R() * (B.x1 - B.x0), z = B.z1 + R() * (B.z0 - B.z1);
      const i = Math.min(sw - 1, Math.floor((x - B.x0) * PX)), j = Math.min(sh - 1, Math.floor((B.z0 - z) * PX));
      const o = (j * sw + i) * 4;
      const r = img[o] / 255, g = img[o + 1] / 255, b = img[o + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
      let hue = 0;
      if(mx !== mn){
        if(mx === r) hue = 60 * (((g - b) / (mx - mn)) % 6);
        else if(mx === g) hue = 60 * ((b - r) / (mx - mn) + 2);
        else hue = 60 * ((r - g) / (mx - mn) + 4);
      }
      if(hue < 0) hue += 360;
      if(hue < 44 || hue > 165 || sat < 0.18 || mx < 0.12) continue;     // pas de l'herbe
      if(baked.distAt(x, z) < lane) continue;                            // voie
      if(wimg){
        const wi = Math.min(ww - 1, Math.floor((x - B.x0) / (B.x1 - B.x0) * ww)), wj = Math.min(wh - 1, Math.floor((B.z0 - z) / (B.z0 - B.z1) * wh));
        if(wimg[(wj * ww + wi) * 4 + 3] > 40) continue;                  // eau
      }
      if(this.composer?.blocked?.(x, z, 0.25)) continue;                 // décor
      const s = 0.55 + R() * 0.5;
      const m = BABYLON.Matrix.Compose(new BABYLON.Vector3(s, s * (0.8 + R() * 0.5), s),
        BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, R() * Math.PI), new BABYLON.Vector3(x, this.height(x, z), z));
      mats.push(m);
      const v = 1.0 + R() * 0.25;
      cols.push(Math.min(1, r * v), Math.min(1, g * v), Math.min(1, b * v), 1);
    }
    if(!mats.length) return;
    const tuft = grassTuft(sc, this.seed);
    tuft.parent = this.root;
    const buf = new Float32Array(mats.length * 16);
    mats.forEach((m, i) => m.copyToArray(buf, i * 16));
    tuft.thinInstanceSetBuffer('matrix', buf, 16, true);
    tuft.thinInstanceSetBuffer('color', new Float32Array(cols), 4, true);
    tuft.isPickable = false;
    tuft.alwaysSelectAsActiveMesh = true;
    const wind = tuft.material.pfWind;
    if(wind) this._grassObs = sc.onBeforeRenderObservable.add(() => {
      wind.time += sc.getEngine().getDeltaTime() / 1000 * (sc.animationTimeScale || 1);
    });
    this.grass = tuft;
  }

  /**
   * Charge les modèles GLB posés par le compositeur et les instancie.
   * Un seul chargement par fichier, puis une instance GPU par copie ;
   * chaque modèle est mis à l'échelle sur sa hauteur voulue en mètres.
   */
  async _loadModels(jobs){
    if(!jobs || !jobs.length) return;
    const byFile = new Map();
    for(const j of jobs){ if(!byFile.has(j.file)) byFile.set(j.file, []); byFile.get(j.file).push(j); }
    for(const [file, list] of byFile){
      let container;
      try{ container = await BABYLON.SceneLoader.LoadAssetContainerAsync('assets/props/', file, this.scene); }
      catch(e){ console.error('[BabylonTerrain] ❌ modèle introuvable :', file, e); continue; }
      if(this._destroyed){ container.dispose(); return; }
      // hauteur d'origine, pour convertir « je veux 2,4 m » en facteur d'échelle
      let minY = 1e9, maxY = -1e9;
      for(const m of container.meshes){
        if(!m.getTotalVertices()) continue;
        m.computeWorldMatrix(true);
        const bb = m.getBoundingInfo().boundingBox;
        minY = Math.min(minY, bb.minimumWorld.y); maxY = Math.max(maxY, bb.maximumWorld.y);
      }
      const raw = Math.max(maxY - minY, 0.01);
      for(const j of list){
        const entry = container.instantiateModelsToScene(n => n + '_' + Math.round(j.x * 10) + '_' + Math.round(j.z * 10), false);
        const root = entry.rootNodes[0];
        if(!root) continue;
        const k = j.height / raw;
        root.parent = this.root;
        root.scaling.setAll(k);
        root.position.set(j.x, j.y - minY * k, j.z);
        root.rotation.set(j.tilt || 0, j.rot, 0);
        for(const m of root.getChildMeshes()){ m.isPickable = false; m.alwaysSelectAsActiveMesh = true; }
      }
      // On NE détruit PAS le conteneur : les copies posées sont des
      // instances GPU qui pointent vers ses maillages source. Le détruire
      // faisait disparaître tout le décor chargé.
      this._containers = this._containers || [];
      this._containers.push(container);
    }
  }

  /**
   * Dôme d'horizon. Invisible en vue plongeante (mode Siège), il devient
   * indispensable en mode Combat : sans lui, tout ce qui dépasse la ligne
   * des toits est du noir.
   */
  _sky(){
    // ATTENTION : réservé au mode Combat. En vue plongeante, la caméra est
    // À L'INTÉRIEUR du dôme et sa paroi avant recouvrait toute la carte —
    // l'écran devenait un aplat gris-vert. D'où le rendu en arrière-plan
    // strict ci-dessous (groupe 0, sans écriture de profondeur).
    const L = this.biome.light({ setting: this.place.setting, variant: this.place.variant, night: !!this.place.night });
    const pal = SKY[this.place.biome] || SKY.abidjan;
    const night = !!this.place.night;
        // Demi-sphère aplatie plutôt qu'une sphère complète : on ne voit jamais
    // le zénith en vue basse, et l'aplatissement évite la distorsion au pôle.
    const dome = BABYLON.MeshBuilder.CreateSphere('sky', { diameter: 300, segments: 28, slice: 0.55, sideOrientation: BABYLON.Mesh.BACKSIDE }, this.scene);
    dome.scaling.y = 0.55;
    dome.parent = this.root;
    dome.position.set((this.play.x0 + this.play.x1) / 2, -6, (this.play.z0 + this.play.z1) / 2);
    dome.isPickable = false;
    dome.infiniteDistance = false;
    const mat = new BABYLON.StandardMaterial('skyMat', this.scene);
    const tex = new BABYLON.DynamicTexture('skyTex', T.texSky(this.seed + 21, night ? pal.night : pal.day), this.scene, true);
    tex.update(true);
    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
    mat.emissiveTexture = tex;          // le ciel s'éclaire tout seul
    mat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    mat.specularColor = new BABYLON.Color3(0, 0, 0);
    mat.disableLighting = true;
    mat.backFaceCulling = true;      // seule la paroi intérieure est dessinée
    mat.disableDepthWrite = true;    // il ne masque jamais ce qui est devant
    dome.material = mat;
    dome.renderingGroupId = 0;       // dessiné avant tout le reste
    dome.applyFog = false;
    dome.freezeWorldMatrix();
    this.sky = dome;
  }

  // ── 5. lumière et étalonnage ─────────────────────────────────
  _light(){
    const L = this.biome.light({ setting: this.place.setting, variant: this.place.variant, night: !!this.place.night });
    const sc = this.scene;
    this._prevClear = sc.clearColor;
    sc.clearColor = BABYLON.Color4.FromColor3(hexColor(L.clear), 1);
    let hemi = sc.getLightByName('hemi'), sun = sc.getLightByName('sun');
    if(!hemi) hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0.3, 1, 0.2), sc);
    if(!sun) sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.45, -1, 0.35), sc);
    this._lightBackup = {
      hemi: { d: hemi.diffuse.clone(), g: hemi.groundColor.clone(), i: hemi.intensity },
      sun: { d: sun.diffuse.clone(), i: sun.intensity, dir: sun.direction.clone() },
    };
    hemi.diffuse = hexColor(L.hemi); hemi.groundColor = hexColor(L.ground); hemi.intensity = L.hemiI;
    sun.diffuse = hexColor(L.sun); sun.intensity = L.sunI;
    sun.direction = new BABYLON.Vector3(-0.45, -1, 0.35).normalize(); // même sens que les ombres cuites
    const ip = sc.imageProcessingConfiguration;
    this._ipBackup = { c: ip.contrast, e: ip.exposure, v: ip.vignetteEnabled, vw: ip.vignetteWeight };
    ip.contrast = L.contrast; ip.exposure = L.exposure;
    ip.vignetteEnabled = true; ip.vignetteWeight = L.vignette;
    ip.vignetteColor = BABYLON.Color4.FromColor3(hexColor(L.vignetteColor || '#000000'), 1);
    ip.isEnabled = true;
  }

  destroy(){
    this._destroyed = true;
    this.gfx?.endPlace();
    if(this._waterObs) this.scene.onBeforeRenderObservable.remove(this._waterObs);
    if(this._grassObs) this.scene.onBeforeRenderObservable.remove(this._grassObs);
    this.water?.material?.dispose(true, true);
    this.grass?.material?.dispose(true, true);
    if(this.scene?.metadata) delete this.scene.metadata.groundHeight;
    const hemi = this.scene.getLightByName('hemi'), sun = this.scene.getLightByName('sun');
    if(this._lightBackup){
      if(hemi){ hemi.diffuse = this._lightBackup.hemi.d; hemi.groundColor = this._lightBackup.hemi.g; hemi.intensity = this._lightBackup.hemi.i; }
      if(sun){ sun.diffuse = this._lightBackup.sun.d; sun.intensity = this._lightBackup.sun.i; sun.direction = this._lightBackup.sun.dir; }
    }
    if(this._ipBackup){
      const ip = this.scene.imageProcessingConfiguration;
      ip.contrast = this._ipBackup.c; ip.exposure = this._ipBackup.e;
      ip.vignetteEnabled = this._ipBackup.v; ip.vignetteWeight = this._ipBackup.vw;
    }
    if(this._prevClear) this.scene.clearColor = this._prevClear;
    for(const c of (this._containers || [])) c.dispose();
    const cache = matCache(this.scene);
    for(const m of cache.values()){ m.diffuseTexture?.dispose(); m.dispose(); }
    cache.clear();
    this.root.dispose(false, true);
  }
}

// ── Petits outils de l'eau et de l'herbe ──────────────────────
function rngFrom(seed){
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Carte de relief de vaguelettes, raccordable dans les deux sens. */
function waterNormalCanvas(seed){
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const ctx = c.getContext('2d'), img = ctx.createImageData(S, S);
  const R = rngFrom(seed + 9);
  const waves = Array.from({ length: 7 }, () => ({ fx: 1 + Math.floor(R() * 5), fy: Math.floor(R() * 5) - 2, a: 0.4 + R() * 0.6, p: R() * 6.28 }));
  const h = (x, y) => { let v = 0; for(const w of waves) v += w.a * Math.sin((w.fx * x + w.fy * y) / S * Math.PI * 2 + w.p); return v; };
  for(let y = 0; y < S; y++) for(let x = 0; x < S; x++){
    const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1);
    const nx = -dx * 2.2, ny = -dy * 2.2, nz = 1, L = Math.hypot(nx, ny, nz);
    const o = (y * S + x) * 4;
    img.data[o] = (nx / L * 0.5 + 0.5) * 255; img.data[o + 1] = (ny / L * 0.5 + 0.5) * 255; img.data[o + 2] = (nz / L * 0.5 + 0.5) * 255; img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Brins d'herbe : un dessin blanc (teinté par instance), transparent autour. */
function bladesCanvas(seed){
  const W = 128, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'), R = rngFrom(seed + 21);
  for(let i = 0; i < 26; i++){
    const x0 = 12 + R() * (W - 24), lean = (R() - 0.5) * 34, top = 8 + R() * 44, wd = 3 + R() * 3;
    const g = ctx.createLinearGradient(0, H, 0, top);
    const shade = 185 + Math.round(R() * 70);
    g.addColorStop(0, `rgb(${shade * 0.55 | 0},${shade * 0.6 | 0},${shade * 0.5 | 0})`);
    g.addColorStop(1, `rgb(${shade},${shade},${shade * 0.9 | 0})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0 - wd, H);
    ctx.quadraticCurveTo(x0 + lean * 0.4, (H + top) / 2, x0 + lean, top);
    ctx.quadraticCurveTo(x0 + lean * 0.4 + wd * 0.3, (H + top) / 2, x0 + wd, H);
    ctx.closePath(); ctx.fill();
  }
  return c;
}

/** Vent : légère oscillation du haut des brins (ajout au shader de sommets). */
class PfWindPlugin extends BABYLON.MaterialPluginBase{
  constructor(material){
    super(material, 'PfWind', 200, { PF_WIND: false });
    this.time = 0;
    this._enable(true);
  }
  prepareDefines(defines){ defines.PF_WIND = true; }
  getClassName(){ return 'PfWindPlugin'; }
  getUniforms(){ return { ubo: [{ name: 'pfTime', size: 1, type: 'float' }], vertex: 'uniform float pfTime;' }; }
  bindForSubMesh(ubo){ ubo.updateFloat('pfTime', this.time); }
  getCustomCode(type){
    if(type !== 'vertex') return null;
    return {
      CUSTOM_VERTEX_UPDATE_POSITION: `
        #ifdef PF_WIND
          float pfH = clamp(positionUpdated.y / 0.55, 0.0, 1.0);
          vec3 pfP = vec3(0.0);
          #ifdef INSTANCES
            pfP = world3.xyz;
          #endif
          positionUpdated.x += sin(pfTime * 1.9 + pfP.x * 0.7 + pfP.z * 0.45) * 0.08 * pfH;
          positionUpdated.z += cos(pfTime * 1.4 + pfP.z * 0.6 + pfP.x * 0.3) * 0.05 * pfH;
        #endif
      `,
    };
  }
}

/** Touffe : deux plans croisés portant le dessin des brins. */
function grassTuft(scene, seed){
  const planes = [];
  // Deux plans en croix, une seule face (le matériau les dessine des deux côtés).
  for(let i = 0; i < 2; i++){
    const p = BABYLON.MeshBuilder.CreatePlane('gt' + i, { width: 0.55, height: 0.5 }, scene);
    p.position.y = 0.25;
    p.rotation.y = i * Math.PI / 2;
    p.bakeCurrentTransformIntoVertices();
    planes.push(p);
  }
  const tuft = BABYLON.Mesh.MergeMeshes(planes, true, true);
  tuft.name = 'grass';
  // Normales tournées vers le ciel : la touffe est éclairée comme le sol
  // qui la porte (des plans verticaux vus d'en haut sortaient trop sombres).
  const nrm = tuft.getVerticesData(BABYLON.VertexBuffer.NormalKind);
  for(let i = 0; i < nrm.length; i += 3){ nrm[i] = 0; nrm[i + 1] = 1; nrm[i + 2] = 0; }
  tuft.setVerticesData(BABYLON.VertexBuffer.NormalKind, nrm);
  const mat = new BABYLON.StandardMaterial('grassMat', scene);
  const tex = new BABYLON.DynamicTexture('grassBlades', bladesCanvas(seed), scene, true);
  tex.hasAlpha = true; tex.update(true);
  mat.diffuseTexture = tex;
  mat.useAlphaFromDiffuseTexture = true;
  mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHATEST;
  mat.alphaCutOff = 0.45;
  mat.backFaceCulling = false;
  mat.specularColor = BABYLON.Color3.Black();
  mat.emissiveColor = new BABYLON.Color3(0.06, 0.06, 0.05);
  try{ mat.pfWind = new PfWindPlugin(mat); }catch(e){ mat.pfWind = null; }
  tuft.material = mat;
  return tuft;
}
