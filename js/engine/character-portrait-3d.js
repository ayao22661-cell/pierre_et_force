// ============================================================
// CHARACTER PORTRAIT 3D — remplace les portraits SVG plats par de
// vraies captures des modèles GLB (les mêmes que ceux affichés en
// combat), pour que "cartes" de personnages dans le hub, le codex,
// l'écran de déploiement et le HUD montrent le vrai rendu 3D plutôt
// qu'une image dessinée.
//
// Principe : un moteur Babylon dédié, séparé de celui du combat
// (BabylonUnits dans babylon-units.js), jamais ajouté au DOM — on
// s'en sert uniquement pour charger un modèle, jouer un instant son
// animation idle, capturer une image PNG (toDataURL), puis jeter la
// scène. Le résultat est mis en cache : chaque modèle n'est rendu
// qu'une seule fois, quel que soit le nombre de personnages qui le
// partagent (ex: TARINE et BABA_TUNDE utilisent tous deux le modèle
// "guerrier").
// ============================================================

const GLB_BASE = 'assets/models/';
const ANIM_BASE = 'assets/animations/';
const PORTRAIT_SIZE = { w: 480, h: 600 };

// Modèle 3D utilisé pour le portrait de chaque personnage du CAST
// (fiches narratives, y compris les PNJ sans équivalent en combat).
// Réutilise le rôle pour choisir le modèle le plus proche parmi les
// 7 disponibles quand le personnage n'a pas de modèle dédié.
const CAST_MODEL = {
  TARINE:     'TARINE.glb',
  BABA_TUNDE: 'personnage-guerrier.glb',
  SAM:        'personnage-mage.glb',
  LUNDGREN:   'personnage-mage.glb',
  KAREN:      'personnage-soigneuse.glb',
  YOURI:      'personnage-soigneuse.glb',
  FULGENCE:   'personnage-chevalier.glb',
  OUSMANE:    'personnage-chevalier.glb',
  GROB:       'personnage-chevalier.glb',
  KEITA:      'personnage-chevalier.glb',
  KANKOU:     'personnage-chevalier.glb',
  DARK:       'personnage-rodeur.glb',
  SGRUN:      'personnage-rodeur.glb',
  SCHISSIN:   'personnage-rodeur.glb',
  SAMIA:      'personnage-rodeur.glb',
  SYLLA:      'personnage-assassin.glb',
  SUB:        'personnage-assassin.glb',
  KRAG:       'personnage-orc.glb',
  VAEL:       'personnage-orc.glb',
  MURK:       'personnage-orc.glb',
};
const MODEL_IDLE_ANIM = {
  'personnage-guerrier.glb':  'sword-and-shield-idle-1.glb',
  'personnage-chevalier.glb': 'great-sword-crouching.glb',
  'personnage-mage.glb':      'body-block.glb',
  'personnage-soigneuse.glb': 'sword-and-shield-block-idle.glb',
  'personnage-assassin.glb':  'sword-and-shield-block-idle.glb',
  'personnage-rodeur.glb':    'sword-and-shield-idle-1.glb',
  'personnage-orc.glb':       'sword-and-shield-block-idle.glb',
  'TARINE.glb':               'sword-and-shield-idle-1.glb',
};
// Idle par défaut : tout nouveau modèle rigué sur Mixamo est ainsi
// capturé dans une posture naturelle, et non en T-pose.
const DEFAULT_IDLE_ANIM = 'sword-and-shield-idle-1.glb';
const DEFAULT_MODEL = 'personnage-guerrier.glb';
// Timeout de sécurité pour le chargement des GLB (modèle + anim idle) :
// si un fichier ne charge jamais (mauvais chemin, réseau), on abandonne
// après ce délai plutôt que de bloquer indéfiniment sans erreur visible.

function withTimeout(promise, ms, label){
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout: ' + label)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

// Cache définitif : modelFile -> data URL PNG. Une entrée par modèle
// (pas par personnage), puisque plusieurs clés CAST partagent le même
// fichier GLB.
const modelSnapshotCache = new Map();
// Cache clé CAST -> data URL, pour l'accès direct par portraitFor().
const keySnapshotCache = new Map();

let sharedEngine = null;
function getEngine(){
  if(!sharedEngine){
    const canvas = document.createElement('canvas');
    canvas.width = PORTRAIT_SIZE.w;
    canvas.height = PORTRAIT_SIZE.h;
    // Jamais ajouté au DOM : on ne s'en sert que pour rendre puis lire
    // les pixels via toDataURL, pas pour un affichage direct.
    sharedEngine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, antialias: true });
  }
  return sharedEngine;
}

async function renderModelSnapshot(modelFile){
  const engine = getEngine();
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.05, 0.045, 0.06, 1);

  const camera = new BABYLON.ArcRotateCamera(
    'pcam', Math.PI / 2 - 0.35, Math.PI / 2.35, 2.6,
    new BABYLON.Vector3(0, 1.05, 0), scene
  );
  camera.fov = 0.55;

  const hemi = new BABYLON.HemisphericLight('phemi', new BABYLON.Vector3(0.2, 1, 0.3), scene);
  hemi.intensity = 0.9;
  const sun = new BABYLON.DirectionalLight('psun', new BABYLON.Vector3(-0.4, -0.7, -0.5), scene);
  sun.intensity = 1.15;
  sun.position = new BABYLON.Vector3(3, 5, 3);

  try{
    // PAS de timeout sur le téléchargement du modèle : les GLB font 5 à
    // 7 Mo et, au lancement, le premier (guerrier = Tarine + Baba Tunde)
    // partage la bande passante avec les grandes images de fond. Sur une
    // connexion mobile, l'ancien délai de 20 s expirait systématiquement
    // pour CE modèle-là → portrait provisoire définitif. Une vraie erreur
    // réseau reste gérée par les tentatives de preloadPortraits3D().
    const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(GLB_BASE, modelFile, scene);
    container.addAllToScene();

    // Joue un instant l'idle pour sortir de la pose de bind (souvent
    // un T-pose) avant la capture, pour une posture naturelle.
    const idleFile = MODEL_IDLE_ANIM[modelFile] || DEFAULT_IDLE_ANIM;
    if(idleFile){
      try{
        const animContainer = await withTimeout(
          BABYLON.SceneLoader.LoadAssetContainerAsync(ANIM_BASE, idleFile, scene),
          60000, 'anim:' + idleFile
        );
        const sourceGroup = animContainer.animationGroups[animContainer.animationGroups.length - 1];
        if(sourceGroup){
          const nodeByName = new Map();
          const add = (n) => {
            nodeByName.set(n.name, n);
            // Mixamo renomme parfois les os « mixamorig1: », « mixamorig9: ».
            if(/^mixamorig\d+:/.test(n.name)) nodeByName.set(n.name.replace(/^mixamorig\d+:/, 'mixamorig:'), n);
          };
          for(const n of scene.transformNodes) add(n);
          for(const n of scene.meshes) add(n);
          // Clonage manuel : tous les rigs n'ont pas exactement les mêmes
          // os (moins de phalanges selon l'auto-rig). clone() plante sur
          // une cible absente ; ici on saute simplement les os manquants.
          const cloned = new BABYLON.AnimationGroup('portrait_idle', scene);
          for(const ta of sourceGroup.targetedAnimations){
            const target = nodeByName.get(ta.target?.name);
            if(target) cloned.addTargetedAnimation(ta.animation, target);
          }
          if(cloned.targetedAnimations.length) cloned.start(false, 1.0, 0.4, 0.9); // petite tranche de l'idle, hors T-pose
        }
      }catch(e){ /* pas grave si l'idle échoue : on capture la bind pose */ }
    }

    // Attend que la scène soit totalement prête (shaders compilés inclus)
    // avant de lancer les rendus de capture. Sans ça, le tout premier
    // modèle rendu sur un moteur Babylon frais peut être capturé avant la
    // fin de la compilation WebGL2 des shaders ("Parallel shader
    // compilation"), donnant une image vide alors même qu'aucune erreur
    // n'est levée.
    await scene.whenReadyAsync(true);

    // Quelques rendus pour laisser l'animation avancer et les textures se stabiliser.
    for(let i = 0; i < 8; i++) scene.render();

    // Lecture directe du framebuffer via toDataURL — plus simple et plus
    // fiable que BABYLON.Tools.CreateScreenshotUsingRenderTargetAsync,
    // qui a un bug connu de blocage silencieux (sans erreur) selon les
    // versions. preserveDrawingBuffer:true (voir getEngine()) est ce qui
    // rend le contenu du framebuffer lisible ainsi après le rendu.
    const dataUrl = engine.getRenderingCanvas().toDataURL('image/png');
    return dataUrl;
  } finally {
    scene.dispose();
  }
}

function placeholderDataUrl(){
  // Silhouette neutre pendant le chargement — évite un <img> cassé.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PORTRAIT_SIZE.w}" height="${PORTRAIT_SIZE.h}">
    <rect width="100%" height="100%" fill="#0d0d12"/>
    <circle cx="${PORTRAIT_SIZE.w/2}" cy="${PORTRAIT_SIZE.h*0.4}" r="70" fill="#1c1c26"/>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/** Précharge (et met en cache) les portraits 3D pour un ensemble de clés CAST. */
export async function preloadPortraits3D(keys){
  const uniqueModels = new Set();
  for(const k of keys) uniqueModels.add(CAST_MODEL[k] || DEFAULT_MODEL);
  console.log('[portrait3D] démarrage —', uniqueModels.size, 'modèles à rendre :', [...uniqueModels]);

  // Chargement SÉQUENTIEL (un modèle à la fois), pas en parallèle : les 7
  // rendus partagent un seul moteur Babylon cachée (getEngine()), et
  // charger plusieurs scènes en même temps dessus peut créer des
  // interférences (textures/matériaux d'une scène lus pendant qu'une
  // autre charge encore) — plus lent mais fiable.
  const MAX_TRIES = 4;
  for(const modelFile of uniqueModels){
    if(modelSnapshotCache.has(modelFile)) continue;
    for(let attempt = 1; attempt <= MAX_TRIES; attempt++){
      try{
        const url = await renderModelSnapshot(modelFile);
        modelSnapshotCache.set(modelFile, url);
        console.log('[portrait3D] ✅ rendu OK :', modelFile, attempt > 1 ? '(tentative ' + attempt + ')' : '');
        break;
      }catch(e){
        console.error('[portrait3D] ❌ échec rendu pour', modelFile, '— tentative', attempt, '/', MAX_TRIES, '—', e);
        if(attempt < MAX_TRIES) await new Promise(r => setTimeout(r, 1500 * attempt));
      }
    }
    // En cas d'échec total, on NE met PAS le portrait provisoire en cache :
    // portraitFor3D() renverra la silhouette, et le prochain appel à
    // preloadPortraits3D() retentera ce modèle au lieu de l'abandonner.
  }

  console.log('[portrait3D] terminé —', modelSnapshotCache.size, '/', uniqueModels.size, 'portraits 3D réels.');
  for(const k of keys){
    const modelFile = CAST_MODEL[k] || DEFAULT_MODEL;
    if(modelSnapshotCache.has(modelFile)) keySnapshotCache.set(k, modelSnapshotCache.get(modelFile));
  }
}

/** Retourne le portrait 3D déjà en cache pour une clé CAST (synchrone, comme l'ancien portraitFor). */
export function portraitFor3D(key){
  if(keySnapshotCache.has(key)) return keySnapshotCache.get(key);
  const modelFile = CAST_MODEL[key] || DEFAULT_MODEL;
  if(modelSnapshotCache.has(modelFile)) return modelSnapshotCache.get(modelFile);
  return placeholderDataUrl();
}
