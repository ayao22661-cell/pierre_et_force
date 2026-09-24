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
    composer.commit(this.root);

    // Obstacles solides : arbres, maisons, rochers, murs… Le compositeur
    // sait déjà où il les a posés et avec quelle emprise au sol ; on les
    // publie en coordonnées Pixi pour que la simulation empêche de les
    // traverser. Les herbes et les décalcomanies n'en font pas partie
    // (elles sont posées avec `solid: false`).
    this.obstacles = composer.placed
      .filter(o => o.r >= 0.45)
      .map(o => ({ x: o.x * WORLD_SCALE, y: -o.z * WORLD_SCALE, r: o.r * WORLD_SCALE * 0.82 }));

    this._light();
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
    mat.freeze();
    this.ground = ground;

    const meta = this.scene.metadata = this.scene.metadata || {};
    meta.groundHeight = (x, z) => this.height(x, z) + 0.02;
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
