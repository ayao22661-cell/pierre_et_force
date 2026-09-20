// ============================================================
// BABYLON UNITS — rendu 3D des personnages (GLB Mixamo + matériaux
// multi-couches peau/tissu/armure/cuir) superposé au canvas PixiJS.
//
// Architecture : deux canvas empilés dans #game-mount.
//   - Babylon (dessous)  : les modèles 3D des unités (champions,
//     sbires...), rendus avec une caméra isométrique fixe.
//   - PixiJS (dessus)    : tilemap, HUD, barres de vie, effets,
//     projectiles — inchangé, transparent au-dessus de Babylon.
//
// La synchronisation des deux mondes se fait via une correspondance
// simple monde-Pixi (x,y en pixels) -> monde-Babylon (X,Z en unités),
// pilotée par BabylonUnits.worldScale.
// ============================================================

const GLB_BASE = 'assets/models/';

// Un seul fichier GLB par rôle — chacun contient déjà les animations
// Mixamo attachées (idle, walk, attack...) plus les 4 matériaux
// (skin/cloth/armor/leather) issus du pipeline de texturing.
const MODEL_BY_KEY = {
  TARINE:   'personnage-guerrier.glb',
  BABA:     'personnage-guerrier.glb',
  SAM:      'personnage-mage.glb',
  LUNDGREN: 'personnage-mage.glb',
  KAREN:    'personnage-soigneuse.glb',
  FULGENCE: 'personnage-chevalier.glb',
  DARK:     'personnage-rodeur.glb',
};
const MODEL_MINION_ALLY  = 'personnage-rodeur.glb';
const MODEL_MINION_ENEMY = 'personnage-orc.glb';
const MODEL_FALLBACK     = 'personnage-guerrier.glb';

function modelForUnit(u){
  if(u.kind === 'champ')  return MODEL_BY_KEY[u.key] || MODEL_FALLBACK;
  if(u.kind === 'minion') return u.team === 0 ? MODEL_MINION_ALLY : MODEL_MINION_ENEMY;
  return null; // tours / nexus restent en PixiJS (Graphics), pas de GLB
}

// Correspondance monde Pixi (px) -> monde Babylon (unités 3D).
// 1 unité Babylon = WORLD_SCALE pixels Pixi. Ajuster si les modèles
// paraissent trop grands/petits une fois en jeu.
const WORLD_SCALE = 45;

export class BabylonUnits{
  /**
   * @param {HTMLElement} mount - même conteneur que le Renderer PixiJS
   * @param {Renderer} pixiRenderer - pour lire la caméra (x,y,zoom)
   */
  constructor(mount, pixiRenderer){
    this.mount = mount;
    this.pixiRenderer = pixiRenderer;
    this.instances = new Map(); // unit.id -> UnitInstance3D
    this._meshCache = new Map(); // modelFile -> { meshes, skeletons, animationGroups } (container source)
    this._loadingPromises = new Map();

    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none'; // les clics passent au PixiJS au-dessus
    this.canvas.style.zIndex = '0';
    mount.style.position = mount.style.position || 'relative';
    mount.appendChild(this.canvas);

    this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // transparent : le fond Pixi reste visible dessous... 
    // NB : Babylon est en dessous dans le DOM, donc son propre clearColor
    // opaque suffit ; le canvas Pixi (au-dessus, transparent) laisse
    // voir Babylon. On garde alpha=1 sur un fond neutre sombre pour
    // éviter tout flash blanc pendant le chargement.
    this.scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.03, 1);

    this._buildCamera();
    this._buildLights();

    this.engine.runRenderLoop(() => {
      this._syncCameraFromPixi();
      this.scene.render();
    });

    this._resizeObserver = new ResizeObserver(() => this.engine.resize());
    this._resizeObserver.observe(mount);
  }

  _buildCamera(){
    // Caméra isométrique douce, même angle que la vue PixiJS existante
    // (vue du dessus légèrement inclinée). ArcRotateCamera fixe.
    const cam = new BABYLON.ArcRotateCamera(
      'cam',
      -Math.PI / 2,      // alpha : orientation horizontale
      Math.PI / 3.4,     // beta : inclinaison (0=vue de dessus, PI/2=horizon)
      40,                // radius initial, recalculé selon le zoom Pixi
      new BABYLON.Vector3(0, 0, 0),
      this.scene
    );
    cam.lowerBetaLimit = cam.upperBetaLimit = cam.beta; // verrouillée
    cam.lowerAlphaLimit = cam.upperAlphaLimit = cam.alpha;
    cam.inputs.clear(); // pas de contrôle souris : pilotée par le code
    this.camera = cam;
  }

  _buildLights(){
    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0.3, 1, 0.2), this.scene);
    hemi.intensity = 0.85;
    hemi.groundColor = new BABYLON.Color3(0.12, 0.10, 0.15);

    const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.5, -1, -0.3), this.scene);
    sun.intensity = 1.1;
    sun.position = new BABYLON.Vector3(20, 40, 20);
  }

  /** Convertit une position monde-Pixi (px) en position monde-Babylon (X,Z). */
  _pixiToBabylon(x, y){
    return new BABYLON.Vector3(x / WORLD_SCALE, 0, -y / WORLD_SCALE);
  }

  /** Recale la caméra Babylon sur la caméra Pixi (pan + zoom) à chaque frame. */
  _syncCameraFromPixi(){
    const pc = this.pixiRenderer.camera;
    if(!pc) return;
    const target = this._pixiToBabylon(pc.x, pc.y);
    this.camera.target.copyFrom(target);
    const z = (pc.baseZoom || 1) * (pc.zoom || 1);
    // Plus le zoom Pixi est grand, plus on rapproche la caméra Babylon.
    this.camera.radius = 32 / Math.max(z, 0.05);
  }

  /** Charge (ou récupère du cache) le conteneur GLB source pour un fichier modèle. */
  async _loadModel(fileName){
    if(this._meshCache.has(fileName)) return this._meshCache.get(fileName);
    if(this._loadingPromises.has(fileName)) return this._loadingPromises.get(fileName);

    // Forme "namespace complet" : c'est celle exposée par le build UMD
    // classique chargé en <script> (babylon.js + babylonjs.loaders.min.js) —
    // la forme raccourcie loadAssetContainerAsync() n'existe que dans le
    // build ES6 modulaire (@babylonjs/core), pas ici.
    const p = BABYLON.SceneLoader.LoadAssetContainerAsync(GLB_BASE, fileName, this.scene).then(container => {
      // Le container reste "hors scène" tant qu'on ne l'instancie pas :
      // on l'utilise comme moule pour createInstance() par unité.
      this._meshCache.set(fileName, container);
      return container;
    });
    this._loadingPromises.set(fileName, p);
    return p;
  }

  /** Crée (si besoin) et retourne l'instance 3D pour une unité du sim. */
  async ensure(unit){
    if(this.instances.has(unit.id)) return this.instances.get(unit.id);
    const fileName = modelForUnit(unit);
    if(!fileName) return null; // tours/nexus : pas de modèle 3D

    const placeholder = { ready: false };
    this.instances.set(unit.id, placeholder);

    const container = await this._loadModel(fileName);
    // instantiateModelsToScene clone meshes+squelette+animations en gardant
    // le partage des géométries/textures sources (léger en mémoire).
    const entry = container.instantiateModelsToScene(name => name + '_' + unit.id, false);
    const root = entry.rootNodes[0];
    root.scaling.setAll(1);

    const anims = {};
    for(const ag of entry.animationGroups){
      // Les noms de groupe viennent tels quels de Mixamo (ex: "mixamo.com" ou
      // le nom donné à l'export) — à normaliser une fois les vraies
      // animations branchées ; pour l'instant on garde tel quel et on
      // référence par index si un seul groupe est présent par fichier.
      anims[ag.name] = ag;
      ag.stop();
    }

    const inst = { root, animGroups: entry.animationGroups, anims, ready: true, facing: 1 };
    this.instances.set(unit.id, inst);
    this._applyTransform(inst, unit);
    this._playDefaultAnim(inst);
    return inst;
  }

  _playDefaultAnim(inst){
    const first = inst.animGroups[0];
    if(first) first.start(true, 1.0);
  }

  _applyTransform(inst, unit){
    const pos = this._pixiToBabylon(unit.x, unit.y);
    inst.root.position.copyFrom(pos);
    // Le "body" scale en X (flip gauche/droite) équivalent PixiJS
    // devient une rotation Y en 3D (demi-tour), plus naturel pour un GLB.
    const facing = unit.facing?.x < 0 ? -1 : 1;
    if(facing !== inst.facing){
      inst.facing = facing;
      inst.root.rotation.y = facing < 0 ? Math.PI : 0;
    }
  }

  /** Appelé chaque frame par le boucle de jeu (match.js) avec la liste des unités vivantes. */
  update(units){
    const seen = new Set();
    for(const u of units){
      seen.add(u.id);
      const inst = this.instances.get(u.id);
      if(!inst || !inst.ready){
        this.ensure(u); // fire-and-forget ; le mesh apparaîtra dès chargé
        continue;
      }
      inst.root.setEnabled(!u.dead);
      if(!u.dead) this._applyTransform(inst, u);
    }
    // Nettoyer les instances d'unités disparues (mortes depuis longtemps / retirées du sim)
    for(const [id, inst] of this.instances){
      if(!seen.has(id)){
        if(inst.root) inst.root.dispose();
        this.instances.delete(id);
      }
    }
  }

  destroy(){
    this._resizeObserver?.disconnect();
    for(const [, inst] of this.instances){ inst.root?.dispose(); }
    this.instances.clear();
    this.engine.stopRenderLoop();
    this.engine.dispose();
    this.canvas.remove();
  }
}
