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

const WORLD_SCALE = 45; // identique à babylon-units.js
const MARGIN = 11;      // lisière construite hors de la zone jouable

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

    const bx = layout.w / WORLD_SCALE, bz = layout.h / WORLD_SCALE;
    this.play = { x0: 0, x1: bx, z0: 0, z1: -bz };
    this.bounds = { x0: -MARGIN, x1: bx + MARGIN, z0: MARGIN, z1: -bz - MARGIN };
    this.laneHalf = (layout.laneWidth || 220) / WORLD_SCALE / 2;
    this.path = (layout.path || []).map(p => ({ x: p.x / WORLD_SCALE, z: -p.y / WORLD_SCALE }));
    this.small = Math.min(window.innerWidth || 1280, window.innerHeight || 800) < 560;

    this._buildHeight();
    const composer = this._compose();
    const baked = this._bake(composer.shadows);
    this._buildGround(baked);
    composer.commit(this.root);
    this._light();

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
    const ppu = this.small ? 14 : 21;
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
    mat.freeze();
    this.ground = ground;

    const meta = this.scene.metadata = this.scene.metadata || {};
    meta.groundHeight = (x, z) => this.height(x, z) + 0.02;
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
    const cache = matCache(this.scene);
    for(const m of cache.values()){ m.diffuseTexture?.dispose(); m.dispose(); }
    cache.clear();
    this.root.dispose(false, true);
  }
}
