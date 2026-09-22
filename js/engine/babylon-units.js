// ============================================================
// BABYLON UNITS — rendu 3D des personnages (GLB Mixamo) superposé au
// canvas PixiJS, avec un système d'animations complet : idle variés,
// marche/course calées sur la vitesse réelle, attaques, sorts,
// réactions aux coups et morts tirés au hasard dans la bibliothèque
// de 118 clips Mixamo (assets/animations/).
//
// Trois règles qui corrigent les défauts d'origine :
//
// 1. PAS DE GLISSADE. Les clips Mixamo contiennent du « root motion » :
//    l'os Hips avance réellement (ex. 1,5 m sur un cycle de marche) puis
//    revient d'un coup au départ de la boucle. Comme le sim déplace déjà
//    l'unité, on retire ce déplacement horizontal au chargement du clip
//    (_loadAnimSource) — on garde seulement le rebond vertical — et on
//    règle la vitesse de lecture sur la vitesse de déplacement mesurée
//    (vitesse du clip, calculée avant le retrait, en m/s).
//
// 2. ORIENTATION. La racine d'un GLB (__root__) porte un
//    rotationQuaternion : dans Babylon, `rotation.y` est alors IGNORÉ.
//    L'ancien code ne tournait donc jamais les personnages : ils se
//    déplaçaient de côté ou à reculons. Chaque modèle est maintenant
//    posé sous un pivot dont on tourne la rotation (lissée).
//
// 3. VARIÉTÉ. Chaque personnage a son propre profil (listes de clips
//    par état) ; on tire un clip différent à chaque attaque, sort,
//    réaction ou mort, les idle s'enchaînent entre plusieurs variantes,
//    et chaque unité a un léger décalage de tempo pour que les sbires
//    ne bougent pas tous à l'unisson.
// ============================================================

const GLB_BASE = 'assets/models/';
const ANIM_BASE = 'assets/animations/';

// Les 7 champions jouables ont chacun leur modèle dédié (Hunyuan 3D +
// rig Mixamo), comme les 13 autres personnages du récit (portraits,
// voir character-portrait-3d.js) et les deux sbires.
const MODEL_BY_KEY = {
  TARINE:   'TARINE.glb',
  SAM:      'SAM.glb',
  LUNDGREN: 'LUNDGREN.glb',
  KAREN:    'KAREN.glb',
  FULGENCE: 'FULGENCE.glb',
  BABA:     'BABA_TUNDE.glb',
  DARK:     'DARK.glb',
};
const MODEL_MINION_ALLY  = 'SBIRE.glb';
const MODEL_MINION_ENEMY = 'ORC.glb';
const MODEL_FALLBACK     = 'TARINE.glb';

// ---------------------------------------------------------------
// ARMES — objets statiques (aucun squelette propre) attachés à l'os de
// la main d'un champion. Chaque entrée : fichier, main ('RightHand' /
// 'LeftHand'), échelle, et un ajustement fin position/rotation pour que
// l'arme se pose naturellement dans le poing (réglé à l'œil sur des
// rendus de contrôle — voir le document de passation).
// ---------------------------------------------------------------
const PROPS_BASE = 'assets/props/';
// ---------------------------------------------------------------
// STRUCTURES — l'autel (kind:'autel'), un objet 3D statique (pas de
// squelette, pas d'animation), à la différence des champions/sbires.
// ---------------------------------------------------------------
const STRUCTURE_MODEL = { autel: 'AUTEL.glb' };
// Hauteur cible en mètres (l'obélisque doit rester un repère visible sur
// la carte) — le modèle brut mesure environ 1,1 m après compression.
const AUTEL_HEIGHT_M = 2.6;

const WEAPON_BY_KEY = {
  TARINE:   [
    { file: 'EPEE.glb',     hand: 'RightHand', scale: 0.62, pos: [0.02, 0.05, 0.0],  rot: [Math.PI/2 + 0.25, 0, 0.15] },
    { file: 'BOUCLIER.glb', hand: 'LeftForeArm', scale: 0.42, pos: [0.0, 0.30, 0.0], rot: [Math.PI/2, 0, 0] },
  ],
  FULGENCE: [
    { file: 'EPEE1.glb',    hand: 'RightHand', scale: 1.0,  pos: [0.02, 0.05, 0.0],  rot: [Math.PI/2 + 0.25, 0, 0.15] },
  ],
  LUNDGREN: [
    { file: 'BATON_MAGIQUE.glb', hand: 'RightHand', scale: 0.85, pos: [0.0, 0.05, 0.0], rot: [Math.PI + 0.2, 0, 0] },
  ],
  DARK:     [
    { file: 'EPEE3.glb',    hand: 'RightHand', scale: 0.55, pos: [0.02, 0.04, 0.0],  rot: [Math.PI/2 + 0.2, 0, 0.1] },
  ],
};

function modelForUnit(u){
  if(u.kind === 'champ')  return MODEL_BY_KEY[u.key] || MODEL_FALLBACK;
  if(u.kind === 'minion') return u.team === 0 ? MODEL_MINION_ALLY : MODEL_MINION_ENEMY;
  return null; // tours / autel restent en PixiJS (Graphics), pas de GLB
}

// ---------------------------------------------------------------
// PROFILS D'ANIMATION — un jeu de clips par personnage.
// Le premier idle est le plus fréquent (posture « maison »), les
// autres viennent ponctuer. Attaque / sort / coup / mort : tirage
// aléatoire sans répéter deux fois de suite le même clip.
// Vérifié : sword-and-shield-walk est une marche ARRIÈRE (le bassin
// recule de 1,4 m) — les marches avant utilisées ici avancent bien.
// ---------------------------------------------------------------
const PROFILES = {
  // Tarine — bouclier et pierre : frappes nettes, sorts à une main.
  tarine: {
    idle:   ['sword-and-shield-idle-1.glb', 'sword-and-shield-idle.glb', 'sword-and-shield-idle-2.glb'],
    walk:   ['great-sword-walk.glb'],
    run:    ['standing-sprint-forward.glb'],
    attack: ['sword-and-shield-slash.glb', 'sword-and-shield-slash-1.glb', 'sword-and-shield-attack-1.glb', 'sword-and-shield-kick.glb', 'sword-and-shield-attack.glb'],
    cast:   ['standing-1h-cast-spell-01.glb', 'sword-and-shield-casting.glb', 'standing-2h-magic-attack-02.glb'],
    hit:    ['sword-and-shield-impact.glb', 'sword-and-shield-impact-1.glb', 'sword-and-shield-block.glb'],
    death:  ['sword-and-shield-death.glb', 'falling-back-death.glb'],
  },
  // Baba Tunde — la star de la cour : bagarreur acrobatique.
  baba: {
    idle:   ['standing-idle-03.glb', 'ginga-variation-3.glb', 'sword-and-shield-idle-2.glb'],
    walk:   ['great-sword-walk.glb'],
    run:    ['standing-sprint-forward.glb'],
    attack: ['fist-fight-a.glb', 'headbutt.glb', 'punching.glb', 'flying-knee-punch-combo.glb', 'dual-weapon-combo.glb'],
    cast:   ['drop-kick.glb', 'butterfly-twirl.glb', 'esquiva-5.glb'],
    hit:    ['receive-uppercut-to-the-face.glb', 'standing-react-small-from-front.glb', 'reaction.glb'],
    death:  ['falling-forward-death.glb', 'standing-react-death-right.glb'],
  },
  // Sam — mage : projectiles à une main, grands sorts à deux mains.
  sam: {
    idle:   ['standing-idle.glb', 'standing-idle-03.glb', 'body-block.glb'],
    walk:   ['great-sword-walk.glb'],
    run:    ['standing-sprint-forward.glb'],
    attack: ['standing-1h-magic-attack-01.glb', 'standing-1h-magic-attack-02.glb', 'standing-1h-magic-attack-03.glb'],
    cast:   ['standing-2h-magic-attack-02.glb', 'standing-2h-magic-attack-04.glb', 'standing-2h-cast-spell-01.glb', 'standing-2h-magic-attack-03.glb'],
    hit:    ['standing-react-small-from-front.glb', 'standing-react-small-from-left.glb'],
    death:  ['standing-react-death-backward.glb', 'standing-react-death-backward-1.glb'],
  },
  // Lundgren — l'érudit : gestuelle plus posée.
  lundgren: {
    idle:   ['standing-idle-03.glb', 'standing-idle.glb', 'dwarf-idle.glb'],
    walk:   ['great-sword-walk.glb'],
    run:    ['standing-sprint-forward.glb'],
    attack: ['standing-1h-magic-attack-02.glb', 'spell-cast.glb', 'standing-1h-magic-attack-01.glb'],
    cast:   ['standing-2h-cast-spell-01.glb', 'standing-1h-cast-spell-01.glb', 'standing-2h-magic-attack-04.glb'],
    hit:    ['standing-react-small-from-left.glb', 'standing-react-small-from-front.glb'],
    death:  ['standing-react-death-left.glb', 'standing-react-death-backward.glb'],
  },
  // Karen — la sentinelle : garde haute, soins.
  karen: {
    idle:   ['sword-and-shield-block-idle.glb', 'standing-idle.glb', 'dwarf-idle-1.glb'],
    walk:   ['great-sword-walk.glb'],
    run:    ['standing-sprint-forward.glb'],
    attack: ['standing-1h-magic-attack-01.glb', 'standing-1h-magic-attack-03.glb', 'spell-cast.glb'],
    cast:   ['standing-2h-cast-spell-01.glb', 'standing-1h-cast-spell-01.glb', 'standing-2h-magic-attack-02.glb'],
    hit:    ['standing-react-small-from-front.glb', 'sword-and-shield-block.glb'],
    death:  ['standing-react-death-left.glb', 'standing-react-death-right.glb'],
  },
  // Fulgence — le roc : grande épée, coups lourds.
  fulgence: {
    idle:   ['dwarf-idle.glb', 'dwarf-idle-1.glb', 'great-sword-crouching-2.glb'],
    walk:   ['great-sword-walk-1.glb'],
    run:    ['great-sword-run.glb'],
    attack: ['great-sword-slash.glb', 'great-sword-slash-1.glb', 'great-sword-kick.glb', 'great-sword-kick-1.glb', 'two-hand-sword-combo.glb'],
    cast:   ['great-sword-jump-attack.glb', 'great-sword-slide-attack.glb', 'two-hand-club-combo.glb'],
    hit:    ['great-sword-impact.glb', 'great-sword-blocking-2.glb', 'standing-block-react-large.glb'],
    death:  ['two-handed-sword-death.glb', 'falling-back-death.glb'],
  },
  // Dark — l'ombre : souple, imprévisible.
  dark: {
    idle:   ['ginga-variation-3.glb', 'crouch-idle.glb', 'sword-and-shield-crouch-idle.glb'],
    walk:   ['crouch-walk-forward.glb'],
    run:    ['standing-sprint-forward.glb'],
    attack: ['dual-weapon-combo-1.glb', 'one-hand-club-combo.glb', 'mutant-punch.glb', 'flying-knee-punch-combo.glb'],
    cast:   ['butterfly-twirl.glb', 'run-to-rolling.glb', 'esquiva-5.glb'],
    hit:    ['standing-react-small-from-left.glb', 'reaction.glb'],
    death:  ['standing-react-death-right.glb', 'falling-forward-death.glb'],
  },
  // Sbires alliés.
  sbire: {
    idle:   ['standing-idle.glb', 'sword-and-shield-idle-2.glb', 'dwarf-idle.glb'],
    walk:   ['great-sword-walk.glb'],
    run:    ['great-sword-run.glb'],
    attack: ['punching.glb', 'sword-and-shield-kick.glb', 'mutant-punch.glb', 'sword-and-shield-attack-1.glb'],
    cast:   [],
    hit:    ['standing-react-small-from-front.glb', 'reaction.glb'],
    death:  ['falling-back-death.glb', 'standing-react-death-left.glb', 'standing-react-death-right.glb'],
  },
  // Sbires ennemis (orcs).
  orc: {
    idle:   ['orc-idle.glb', 'dwarf-idle-2.glb'],
    walk:   ['orc-walk.glb'],
    run:    ['great-sword-run.glb'],
    attack: ['mutant-punch.glb', 'headbutt.glb', 'punching.glb', 'great-sword-kick-1.glb'],
    cast:   [],
    hit:    ['receive-uppercut-to-the-face.glb', 'reaction.glb'],
    death:  ['falling-forward-death.glb', 'falling-back-death.glb', 'standing-react-death-backward.glb'],
  },
};
const PROFILE_BY_KEY = { TARINE:'tarine', BABA:'baba', SAM:'sam', LUNDGREN:'lundgren', KAREN:'karen', FULGENCE:'fulgence', DARK:'dark' };
function profileForUnit(u){
  if(u.kind === 'minion') return PROFILES[u.team === 0 ? 'sbire' : 'orc'];
  return PROFILES[PROFILE_BY_KEY[u.key]] || PROFILES.tarine;
}

// Correspondance monde Pixi (px) -> monde Babylon (unités 3D = mètres).
const WORLD_SCALE = 45;
// Inclinaison de la caméra (angle depuis la verticale). 45° : voir _syncCameraFromPixi.
const CAM_BETA = Math.PI / 4;
// Au-dessus de cette vitesse (px/s) l'unité est « en mouvement ».
const MOVE_SPEED_MIN = 25;
// Sous cette vitesse réelle (m/s) on marche, au-dessus on court.
const RUN_THRESHOLD = 2.6;
// Vitesse de rotation max du personnage (rad/s).
const TURN_SPEED = 12;
// Durée pendant laquelle un corps reste visible après sa mort (s).
const CORPSE_TIME = 3.2;

function pick(list, avoid){
  if(!list || !list.length) return null;
  if(list.length === 1) return list[0];
  let c;
  do { c = list[Math.floor(Math.random() * list.length)]; } while(c === avoid);
  return c;
}
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function angleLerp(a, b, t){
  let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * t;
}

export class BabylonUnits{
  constructor(mount, pixiRenderer){
    this.mount = mount;
    this.pixiRenderer = pixiRenderer;
    this.instances = new Map();        // unit.id -> instance
    this.structures = new Map();       // unit.id -> { pivot, ready } (autel)
    this._modelCache = new Map();      // modelFile -> Promise<AssetContainer>
    this._animSourceCache = new Map(); // animFile -> Promise<AssetContainer>
    this._propCache = new Map();       // propFile -> Promise<AssetContainer> (armes, objets statiques)

    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '0';
    // Explicite malgré la valeur par défaut CSS, pour éviter toute
    // ambiguïté de pile selon le navigateur (voir renderer.js).
    // ⚠️ Ne JAMAIS écraser la position CSS du mount : #game-mount est
    // `position:absolute; inset:0` dans layout.css. Le forcer en
    // `relative` (ancien code) lui donnait une hauteur de 0 px → canvas
    // Babylon de 0 px de haut → terrain et personnages invisibles en
    // combat (seul le HUD PixiJS/DOM restait visible). On ne corrige que
    // si le mount est réellement `static`.
    if(getComputedStyle(mount).position === 'static') mount.style.position = 'relative';
    mount.appendChild(this.canvas);

    this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.03, 1);
    console.log('[BabylonUnits] moteur créé, canvas', this.canvas.width, 'x', this.canvas.height);

    // Fondu enchaîné entre deux clips (≈ 0,15 s) : plus de sauts de pose
    // quand on passe d'idle à la course ou d'une attaque à l'autre.
    this.scene.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
    this.scene.animationPropertiesOverride.enableBlending = true;
    this.scene.animationPropertiesOverride.blendingSpeed = 0.1;

    this._buildCamera();
    this._buildLights();

    let _frameCount = 0;
    this.engine.runRenderLoop(() => {
      this._syncCameraFromPixi();
      this.scene.render();
      _frameCount++;
      if(_frameCount === 1){
        console.log('[BabylonUnits] frame', _frameCount,
          '| caméra target=', this.camera.target.asArray().map(n=>n.toFixed(1)),
          'radius=', this.camera.radius.toFixed(1),
          '| meshes dans la scène=', this.scene.meshes.length,
          '| canvas taille=', this.engine.getRenderWidth(), 'x', this.engine.getRenderHeight());
      }
    });

    this._resizeObserver = new ResizeObserver(() => this.engine.resize());
    this._resizeObserver.observe(mount);
  }

  _buildCamera(){
    // Caméra ORTHOGRAPHIQUE inclinée à 45°, calée pixel pour pixel sur la
    // caméra 2D de PixiJS (voir _syncCameraFromPixi). L'ancienne caméra
    // perspective ne correspondait pas à la projection PixiJS : l'Autel,
    // l'anneau du joueur et les barres de vie (dessinés en 2D) n'étaient
    // pas au même endroit que le sol et les personnages 3D.
    const cam = new BABYLON.ArcRotateCamera(
      'cam', -Math.PI / 2, CAM_BETA, 100,
      new BABYLON.Vector3(0, 0, 0), this.scene
    );
    cam.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    cam.minZ = 0.1;
    cam.maxZ = 1000;
    cam.lowerBetaLimit = cam.upperBetaLimit = cam.beta;
    cam.lowerAlphaLimit = cam.upperAlphaLimit = cam.alpha;
    cam.lowerRadiusLimit = cam.upperRadiusLimit = cam.radius;
    cam.inputs.clear();
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

  _pixiToBabylon(x, y){
    return new BABYLON.Vector3(x / WORLD_SCALE, 0, -y / WORLD_SCALE);
  }

  /** Même conversion, mais posée SUR le sol (relief du terrain). */
  _groundPos(x, y){
    const v = this._pixiToBabylon(x, y);
    const gh = this.scene.metadata?.groundHeight;
    if(gh) v.y = gh(v.x, v.z);
    return v;
  }

  _syncCameraFromPixi(){
    const pc = this.pixiRenderer.camera;
    if(!pc) return;
    this.camera.target.copyFrom(this._pixiToBabylon(pc.x, pc.y));
    const z = Math.max((pc.baseZoom || 1) * (pc.zoom || 1), 0.05);
    const scr = this.pixiRenderer.app?.screen;
    const vw = scr?.width  || this.canvas.clientWidth  || 1;
    const vh = scr?.height || this.canvas.clientHeight || 1;
    // Demi-largeur/hauteur visibles, en unités Babylon, identiques à
    // celles de PixiJS (px / zoom / WORLD_SCALE). En vertical, un
    // déplacement au sol est vu raccourci de cos(beta) par la caméra
    // inclinée : on applique le même facteur pour que le sol 3D tombe
    // exactement sous les éléments 2D. À 45°, la hauteur des
    // personnages garde ses proportions (sin/cos = 1).
    const halfW = (vw / 2) / z / WORLD_SCALE;
    const halfH = (vh / 2) / z / WORLD_SCALE * Math.cos(CAM_BETA);
    this.camera.orthoLeft = -halfW;
    this.camera.orthoRight = halfW;
    this.camera.orthoTop = halfH;
    this.camera.orthoBottom = -halfH;
  }

  /** Charge (ou récupère du cache) le conteneur GLB source d'un modèle de personnage. */
  _loadModel(fileName){
    if(!this._modelCache.has(fileName)){
      this._modelCache.set(fileName,
        BABYLON.SceneLoader.LoadAssetContainerAsync(GLB_BASE, fileName, this.scene));
    }
    return this._modelCache.get(fileName);
  }

  /** Charge (ou récupère du cache) un objet statique — arme, décor. */
  _loadProp(fileName){
    if(!this._propCache.has(fileName)){
      this._propCache.set(fileName,
        BABYLON.SceneLoader.LoadAssetContainerAsync(PROPS_BASE, fileName, this.scene));
    }
    return this._propCache.get(fileName);
  }

  /**
   * Attache les armes d'un champion à ses os de main (WEAPON_BY_KEY).
   * Un objet statique parenté à un os de squelette suit son animation
   * comme n'importe quel enfant de la scène — pas besoin de rig propre
   * à l'arme, Babylon recalcule sa matrice monde avec le reste du corps
   * à chaque frame.
   */
  async _attachWeapons(inst, unit){
    const list = WEAPON_BY_KEY[unit.key];
    if(!list || !list.length) return;
    for(const w of list){
      const handNode = inst.nodeByBaseName.get('mixamorig:' + w.hand);
      if(!handNode){
        console.error('[BabylonUnits] ❌ os introuvable pour l\'arme', w.file, '(', w.hand, ') sur', unit.key);
        continue;
      }
      let container;
      try{ container = await this._loadProp(w.file); }
      catch(e){ console.error('[BabylonUnits] ❌ arme introuvable :', w.file, e); continue; }
      if(inst.disposed) return;
      const entry = container.instantiateModelsToScene(name => name + '_w' + list.indexOf(w) + '_' + unit.id, false);
      const root = entry.rootNodes[0];
      root.parent = handNode;
      root.position.set(w.pos[0], w.pos[1], w.pos[2]);
      root.rotation.set(w.rot[0], w.rot[1], w.rot[2]);
      root.scaling.setAll(w.scale);
      inst.weapons = inst.weapons || [];
      inst.weapons.push(root);
    }
  }

  /**
   * Charge (ou récupère du cache) un clip d'animation, en retire le
   * déplacement horizontal du bassin (root motion → « en place ») et
   * mémorise sa vitesse d'origine (m/s) pour caler la lecture.
   * Résout vers { group, speed, duration } ou null.
   */
  _loadAnimSource(fileName){
    if(!this._animSourceCache.has(fileName)){
      const p = BABYLON.SceneLoader.LoadAssetContainerAsync(ANIM_BASE, fileName, this.scene).then(container => {
        const group = container.animationGroups[container.animationGroups.length - 1];
        if(!group) return null;
        let speed = 0;
        const fps = group.targetedAnimations[0]?.animation.framePerSecond || 30;
        const duration = Math.max((group.to - group.from) / fps, 0.05);
        for(const ta of group.targetedAnimations){
          const tname = ta.target?.name || '';
          if(!/Hips$/.test(tname) || ta.animation.targetProperty !== 'position') continue;
          const keys = ta.animation.getKeys();
          if(keys.length < 2) continue;
          const first = keys[0].value, last = keys[keys.length - 1].value;
          speed = Math.hypot(last.x - first.x, last.z - first.z) / duration;
          for(const k of keys){
            k.value = new BABYLON.Vector3(first.x, k.value.y, first.z);
          }
        }
        return { group, speed, duration };
      }).catch(e => {
        console.error('[BabylonUnits] ❌ clip introuvable :', fileName, e);
        return null;
      });
      this._animSourceCache.set(fileName, p);
    }
    return this._animSourceCache.get(fileName);
  }

  /** Clone un clip (déjà chargé ou non) sur le squelette de l'instance. Retourne { ag, speed, duration } ou null. */
  async _clipFor(inst, file){
    if(!file) return null;
    if(inst.clips.has(file)) return inst.clips.get(file);
    const src = await this._loadAnimSource(file);
    if(!src || inst.disposed) return null;
    if(inst.clips.has(file)) return inst.clips.get(file);
    // Clonage manuel plutôt que src.group.clone(...) : tous les modèles
    // n'ont pas exactement les mêmes os (un rig Mixamo peut avoir moins
    // de phalanges). clone() plante sur une cible absente ; ici on passe
    // simplement les os manquants.
    const ag = new BABYLON.AnimationGroup(file + '_' + inst.id, this.scene);
    for(const ta of src.group.targetedAnimations){
      const target = inst.nodeByBaseName.get(ta.target?.name);
      if(target) ag.addTargetedAnimation(ta.animation, target);
    }
    ag.stop();
    if(!ag.targetedAnimations.length){
      console.error('[BabylonUnits] ❌ aucun os commun entre', file, 'et', inst.modelFile);
      return null;
    }
    const clip = { ag, speed: src.speed, duration: src.duration, file };
    inst.clips.set(file, clip);
    return clip;
  }

  /** Clip déjà prêt pour cette instance (synchrone) ; lance son chargement sinon. */
  _readyClip(inst, file){
    if(!file) return null;
    const c = inst.clips.get(file);
    if(c) return c;
    this._clipFor(inst, file);
    return null;
  }

  /** Démarre un clip en coupant le précédent. */
  _play(inst, clip, { loop = false, speedRatio = 1, randomStart = false } = {}){
    if(inst.current && inst.current !== clip) inst.current.ag.stop();
    inst.current = clip;
    const ag = clip.ag;
    ag.onAnimationGroupEndObservable.clear();
    ag.start(loop, speedRatio * inst.tempo);
    if(randomStart) ag.goToFrame(ag.from + Math.random() * (ag.to - ag.from));
    return ag;
  }

  /** Crée (si besoin) et retourne l'instance 3D pour une unité du sim. */
  async ensure(unit){
    if(this.instances.has(unit.id)) return this.instances.get(unit.id);
    const fileName = modelForUnit(unit);
    if(!fileName) return null;

    const placeholder = { ready: false };
    this.instances.set(unit.id, placeholder);

    const container = await this._loadModel(fileName);
    if(this.instances.get(unit.id) !== placeholder) return null; // unité retirée pendant le chargement
    const entry = container.instantiateModelsToScene(name => name + '_' + unit.id, false);
    const root = entry.rootNodes[0];
    // Animations embarquées dans le modèle : inutiles (on utilise la bibliothèque).
    for(const ag of entry.animationGroups) ag.dispose();

    // Pivot d'orientation : le __root__ du GLB a un rotationQuaternion,
    // donc root.rotation.y n'aurait aucun effet. On tourne le pivot.
    const pivot = new BABYLON.TransformNode('unit_' + unit.id, this.scene);
    root.parent = pivot;

    const allNodes = root.getDescendants(false);
    allNodes.push(root);
    const suffix = '_' + unit.id;
    const nodeByBaseName = new Map();
    for(const n of allNodes){
      const base = n.name.endsWith(suffix) ? n.name.slice(0, -suffix.length) : n.name;
      nodeByBaseName.set(base, n);
      // Mixamo renomme parfois les os « mixamorig1: », « mixamorig9: »…
      // selon la session d'auto-rig. On les rend tous équivalents.
      if(/^mixamorig\d+:/.test(base)) nodeByBaseName.set(base.replace(/^mixamorig\d+:/, 'mixamorig:'), n);
    }

    const profile = profileForUnit(unit);
    const inst = {
      id: unit.id, pivot, root, nodeByBaseName, profile, modelFile: fileName,
      ready: true, disposed: false,
      clips: new Map(), current: null,
      state: null,          // 'idle' | 'walk' | 'run' | 'attack' | 'cast' | 'hit' | 'death'
      lastFile: {},         // dernier clip joué par état (évite les répétitions)
      oneShotUntil: 0,
      lastX: unit.x, lastY: unit.y, lastT: performance.now(), speedPx: 0,
      yaw: 0, deadAt: 0, hitCooldownUntil: 0,
      // Petit décalage de tempo propre à chaque unité : les sbires d'une
      // même vague ne s'animent plus à l'unisson.
      tempo: 0.92 + Math.random() * 0.16,
    };
    this.instances.set(unit.id, inst);

    // Précharge tous les clips du profil en tâche de fond : le premier
    // coup, sort ou réaction est ainsi prêt quand il arrive.
    const all = new Set(Object.values(profile).flat());
    const idleFirst = profile.idle[0];
    await this._clipFor(inst, idleFirst);
    for(const f of all) this._clipFor(inst, f);

    const f = unit.facing || { x: 0, y: 1 };
    inst.yaw = Math.atan2(f.x, -f.y);
    this._applyTransform(inst, unit, 1);
    this._enterIdle(inst, true);
    // Invocation temporaire (ex. le Lieutenant de Baba) : même modèle que
    // son invocateur, donc on la rend fantomatique et plus petite — sinon
    // on croyait voir le même méchant apparaître deux fois.
    const ghostify = () => {
      if(!unit.temporary || inst.disposed) return;
      pivot.scaling.setAll(0.82);
      for(const m of pivot.getChildMeshes(false)) m.visibility = 0.45;
    };
    ghostify();
    this._attachWeapons(inst, unit).then(ghostify).catch(e => console.error('[BabylonUnits] ❌ échec attache d\'arme pour', unit.key, e));
    return inst;
  }

  // ---------------------------------------------------------------
  // États
  // ---------------------------------------------------------------

  _enterIdle(inst, randomStart = false){
    const file = inst.state === 'idle' && inst.current
      ? pick(inst.profile.idle, inst.current.file)
      : (Math.random() < 0.6 ? inst.profile.idle[0] : pick(inst.profile.idle));
    const clip = this._readyClip(inst, file) || this._readyClip(inst, inst.profile.idle[0]);
    inst.state = 'idle';
    if(!clip) return;
    const ag = this._play(inst, clip, { loop: false, randomStart });
    // À la fin d'une variante, on enchaîne sur une autre.
    ag.onAnimationGroupEndObservable.addOnce(() => {
      if(inst.state === 'idle' && inst.current === clip && !inst.disposed) this._enterIdle(inst);
    });
  }

  _enterLocomotion(inst, speedMs){
    // Hystérésis : évite de basculer marche/course en boucle autour du seuil.
    const want = inst.state === 'run'
      ? (speedMs < RUN_THRESHOLD - 0.4 ? 'walk' : 'run')
      : (speedMs > RUN_THRESHOLD + 0.3 ? 'run' : 'walk');
    let clip = this._readyClip(inst, inst.lastFile[want] || (inst.lastFile[want] = pick(inst.profile[want])));
    if(!clip && want === 'run') clip = this._readyClip(inst, inst.profile.walk[0]);
    if(!clip) return;
    const ratio = clip.speed > 0.2 ? clamp(speedMs / clip.speed, 0.55, 2.2) : 1;
    if(inst.state !== want || inst.current !== clip){
      // Passage marche <-> course : on garde la phase du pas (même pied
      // en avant) au lieu de repartir au hasard.
      const prev = inst.current;
      const wasLoco = prev && (inst.state === 'walk' || inst.state === 'run');
      const phase = wasLoco ? ((prev.ag.animatables[0]?.masterFrame ?? prev.ag.from) - prev.ag.from) / Math.max(prev.ag.to - prev.ag.from, 1) : null;
      inst.state = want;
      const ag = this._play(inst, clip, { loop: true, speedRatio: ratio, randomStart: phase === null });
      if(phase !== null) ag.goToFrame(ag.from + clamp(phase, 0, 1) * (ag.to - ag.from));
    } else {
      // Ajustement continu : la foulée suit la vitesse réelle (anti-glisse).
      clip.ag.speedRatio = ratio * inst.tempo;
    }
  }

  /** Joue un clip ponctuel (attaque, sort, coup reçu), puis rend la main à idle/locomotion. */
  _playOneShot(inst, kind, speedRatio){
    const file = pick(inst.profile[kind], inst.lastFile[kind]);
    const clip = this._readyClip(inst, file);
    if(!clip) return false;
    inst.lastFile[kind] = file;
    inst.state = kind;
    const ratio = speedRatio(clip.duration);
    const ag = this._play(inst, clip, { loop: false, speedRatio: ratio });
    inst.oneShotUntil = performance.now() + (clip.duration / (ratio * inst.tempo)) * 1000;
    ag.onAnimationGroupEndObservable.addOnce(() => {
      if(inst.state === kind && inst.current === clip && !inst.disposed){
        inst.state = null;
        this._enterIdle(inst);
      }
    });
    return true;
  }

  _enterDeath(inst){
    if(inst.state === 'death') return;
    inst.deadAt = performance.now();
    const file = pick(inst.profile.death);
    const clip = this._readyClip(inst, file);
    inst.state = 'death';
    if(clip) this._play(inst, clip, { loop: false, speedRatio: 1 / inst.tempo });
    // Le clip reste figé sur sa dernière image (le corps au sol).
  }

  _applyTransform(inst, unit, turnT, X = unit.x, Y = unit.y){
    const pos = this._groundPos(X, Y);
    inst.pivot.position.copyFrom(pos);
    // Direction visée : la cible si l'unité est à l'arrêt et engagée
    // (elle frappe face à l'ennemi), sinon son sens de déplacement.
    let fx = unit.facing?.x ?? 0, fy = unit.facing?.y ?? 1;
    const t = unit.target;
    if(t && !t.dead && inst.speedPx < MOVE_SPEED_MIN){
      const dx = t.x - unit.x, dy = t.y - unit.y;
      if(dx || dy){ fx = dx; fy = dy; }
    }
    if(fx || fy){
      const targetYaw = Math.atan2(fx, -fy);
      inst.yaw = angleLerp(inst.yaw, targetYaw, turnT);
    }
    inst.pivot.rotation.y = inst.yaw;
  }

  /**
   * Appelé chaque frame par la boucle de jeu (match.js).
   * @param {Array} units - unités du sim
   * @param {Map} [views] - UnitView PixiJS par id : le modèle 3D se cale
   *   sur leur position AFFICHÉE (lissée), pour rester collé à l'anneau
   *   de sélection et à la barre de vie au lieu de les devancer.
   */
  update(units, views){
    const now = performance.now();
    const seen = new Set();
    for(const u of units){
      seen.add(u.id);

      // Structures (autel) : objet statique, chemin dédié séparé des
      // champions/sbires animés (pas de squelette, pas d'attente d'un
      // clip idle, juste position + visibilité).
      if(STRUCTURE_MODEL[u.kind]){
        this._updateStructure(u);
        continue;
      }

      const inst = this.instances.get(u.id);
      if(!inst || !inst.ready){
        if(!inst && !u.dead){
          this.ensure(u).catch(e => console.error('[BabylonUnits] ❌ échec ensure() pour unité', u.id, u.key || u.kind, '—', e));
        }
        continue;
      }

      const dt = Math.min(Math.max((now - inst.lastT) / 1000, 0.001), 0.1);
      inst.lastT = now;

      if(u.dead){
        this._enterDeath(inst);
        inst.pivot.setEnabled((now - inst.deadAt) / 1000 < CORPSE_TIME);
        continue;
      }
      if(inst.state === 'death'){
        // Réapparition (respawn) : on repart proprement.
        inst.pivot.setEnabled(true);
        inst.state = null;
        inst.lastX = u.x; inst.lastY = u.y; inst.speedPx = 0;
        this._enterIdle(inst);
      }

      const view = views?.get(u.id);
      const X = view ? view.dispX : u.x, Y = view ? view.dispY : u.y;
      // Vitesse réelle mesurée à l'écran (px/s), lissée.
      const inst_v = Math.hypot(X - inst.lastX, Y - inst.lastY) / dt;
      inst.lastX = X; inst.lastY = Y;
      inst.speedPx += (inst_v - inst.speedPx) * Math.min(1, dt * 12);
      const moving = inst.speedPx > MOVE_SPEED_MIN;

      this._applyTransform(inst, u, Math.min(1, dt * TURN_SPEED), X, Y);

      const inOneShot = (inst.state === 'attack' || inst.state === 'cast' || inst.state === 'hit') && now < inst.oneShotUntil;
      if(moving){
        // Le déplacement a priorité : jamais d'attaque « glissée ».
        this._enterLocomotion(inst, inst.speedPx / WORLD_SCALE);
      } else if(!inOneShot && inst.state !== 'idle'){
        this._enterIdle(inst);
      }
    }
    for(const [id, inst] of this.instances){
      if(seen.has(id) || !inst.ready) continue;
      // Unité retirée du sim (sbire tué) : on laisse jouer la mort, puis on nettoie.
      if(inst.state !== 'death') this._enterDeath(inst);
      if((now - inst.deadAt) / 1000 > CORPSE_TIME) this._disposeInstance(id, inst);
    }
  }

  _disposeInstance(id, inst){
    inst.disposed = true;
    for(const c of inst.clips.values()) c.ag.dispose();
    inst.pivot?.dispose();
    this.instances.delete(id);
  }

  /**
   * Événements de combat (match.js) :
   *  - 'attack' : coup de base (mêlée ou tir)      - 'cast' : compétence
   *  - 'hit'    : l'unité encaisse un coup
   * @param {object} [info] - pour 'attack' : { interval } (s entre deux coups)
   */
  notifyAction(unitId, key, info = {}){
    const inst = this.instances.get(unitId);
    if(!inst || !inst.ready || inst.state === 'death') return;
    // En course, la locomotion prime — sauf pour un coup demandé à la
    // main par le joueur (info.force), qu'on doit toujours voir partir.
    if(inst.speedPx > MOVE_SPEED_MIN && !info.force) return;
    const now = performance.now();
    if(key === 'attack'){
      if(inst.state === 'cast' && now < inst.oneShotUntil) return; // ne coupe pas un sort
      const interval = info.interval || 1.2;
      // Le clip est accéléré pour tenir dans l'intervalle entre deux coups.
      this._playOneShot(inst, 'attack', d => clamp(d / (interval * 0.9), 1, 2.4));
    } else if(key === 'cast'){
      if(!inst.profile.cast.length){ this._playOneShot(inst, 'attack', d => clamp(d / 1.0, 1, 2.4)); return; }
      this._playOneShot(inst, 'cast', d => clamp(d / 1.3, 1, 2.2));
    } else if(key === 'hit'){
      // Réaction seulement au repos, pas en pleine attaque, et pas à chaque coup.
      if(inst.state !== 'idle' || now < inst.hitCooldownUntil || Math.random() > 0.45) return;
      inst.hitCooldownUntil = now + 1800;
      this._playOneShot(inst, 'hit', d => clamp(d / 0.8, 1, 1.8));
    }
  }

  /**
   * Structure statique (autel) : chargée une fois, mise à l'échelle
   * d'après sa propre boîte englobante (le modèle brut mesure environ
   * 1,1 m après compression, on le remet à une hauteur cible fixe),
   * puis simplement montrée/masquée selon `u.dead` — aucune animation.
   */
  _updateStructure(u){
    let st = this.structures.get(u.id);
    if(!st){
      const placeholder = { ready: false };
      this.structures.set(u.id, placeholder);
      this._loadProp(STRUCTURE_MODEL[u.kind]).then(container => {
        if(this.structures.get(u.id) !== placeholder) return; // retirée entre-temps
        const entry = container.instantiateModelsToScene(name => name + '_' + u.id, false);
        for(const ag of entry.animationGroups) ag.dispose();
        const root = entry.rootNodes[0];
        const pivot = new BABYLON.TransformNode('struct_' + u.id, this.scene);
        root.parent = pivot;

        let minY = 1e9, maxY = -1e9;
        for(const m of root.getChildMeshes(false)){
          m.computeWorldMatrix(true);
          const bb = m.getBoundingInfo().boundingBox;
          minY = Math.min(minY, bb.minimumWorld.y);
          maxY = Math.max(maxY, bb.maximumWorld.y);
        }
        const rawH = Math.max(maxY - minY, 0.01);
        root.scaling.setAll(AUTEL_HEIGHT_M / rawH);

        const pos = this._groundPos(u.x, u.y);
        pivot.position.copyFrom(pos);
        this.structures.set(u.id, { pivot, ready: true });
      }).catch(e => {
        console.error('[BabylonUnits] ❌ échec chargement structure', u.kind, e);
        this.structures.delete(u.id);
      });
      return;
    }
    if(!st.ready) return;
    st.pivot.setEnabled(!u.dead);
  }

  destroy(){
    this._resizeObserver?.disconnect();
    for(const [id, inst] of this.instances){ if(inst.ready) this._disposeInstance(id, inst); }
    this.instances.clear();
    for(const [, st] of this.structures){ st.pivot?.dispose(); }
    this.structures.clear();
    this.engine.stopRenderLoop();
    this.engine.dispose();
    this.canvas.remove();
  }
}
