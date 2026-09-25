// ============================================================
// GRAPHISMES — tout ce qui embellit la scène 3D de combat, réglé
// selon la puissance du téléphone :
//
//   • qualité Basse / Moyenne / Haute (ou Auto, qui descend d'un cran
//     tout seul si le jeu rame) ;
//   • post-traitement : halo lumineux (bloom), lissage (FXAA), rendu
//     des couleurs « cinéma » (tonemapping + étalonnage par décor) ;
//   • halo des matières émissives (lave, runes, panneaux de Sgrün) ;
//   • ombres portées en temps réel des personnages ;
//   • éclairage d'environnement (ciels HDR, assets/env/) : armures,
//     peaux et métaux reflètent le ciel du décor ;
//   • moment de la journée (aube, jour, crépuscule, nuit) ;
//   • atmosphère : brouillard de profondeur, météo en particules
//     (pluie, neige, poussière, braises, bulles, lucioles, pollen) ;
//   • particules 3D des combats (étincelles, poussière, éclats d'ultime,
//     soins) ;
//   • occlusion ambiante (Haute seulement) ;
//   • effets de caméra : aberration chromatique et halo renforcé sur
//     les gros coups et les ultimes.
//
// Un seul objet par moteur (BabylonUnits le crée). Le terrain appelle
// beginPlace() / finishPlace() / endPlace() autour de chaque combat.
// ============================================================

const PREF_KEY = 'pf_gfx';
const AUTO_KEY = 'pf_gfx_auto';

export const QUALITY_LABEL = { auto: 'Auto', basse: 'Basse', moyenne: 'Moyenne', haute: 'Haute' };
const ORDER = ['basse', 'moyenne', 'haute'];

/** Réglages de chaque palier. `scale` : résolution de rendu (1 = pixels CSS). */
const TIERS = {
  basse:   { res: 1,    pipeline: false, bloom: false, glow: false, shadows: 0,    ssao: false, particles: 0.45, weather: 0.45, grass: 0,   water: 'simple', env: true,  chroma: false },
  moyenne: { res: 1,    pipeline: true,  bloom: true,  glow: false, shadows: 1024, ssao: false, particles: 0.85, weather: 0.8,  grass: 0.35, water: 'full',   env: true,  chroma: false },
  haute:   { res: 1.5,  pipeline: true,  bloom: true,  glow: true,  shadows: 2048, ssao: true,  particles: 1,    weather: 1,    grass: 0.7,   water: 'full',   env: true,  chroma: true  },
};

/** Choix du joueur : 'auto' | 'basse' | 'moyenne' | 'haute'. */
export function gfxPref(){
  try{ return localStorage.getItem(PREF_KEY) || 'auto'; }catch(e){ return 'auto'; }
}
export function setGfxPref(q){
  try{ localStorage.setItem(PREF_KEY, q); sessionStorage.removeItem(AUTO_KEY); }catch(e){}
  for(const g of LIVE) g.reconfigure();
}

/** Palier de départ en mode Auto, d'après l'appareil. */
function detectTier(){
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || matchMedia?.('(pointer: coarse)').matches;
  const mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 4;
  if(mobile && (mem <= 2 || cores <= 4)) return 'basse';
  return mobile ? 'moyenne' : 'haute';
}

/** Palier réellement appliqué. */
export function effectiveTier(){
  const p = gfxPref();
  if(p !== 'auto') return p;
  try{ const a = sessionStorage.getItem(AUTO_KEY); if(a) return a; }catch(e){}
  return detectTier();
}

const LIVE = new Set();

// ── Couleurs et ambiances ─────────────────────────────────────
const hex = (h, a = 1) => { const n = typeof h === 'number' ? h : parseInt(String(h || '#ffffff').replace('#', ''), 16); return new BABYLON.Color4(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a); };

/** Étalonnage par décor : teinte des hautes lumières et des ombres, saturation. */
const GRADE = {
  abidjan: { hh: 38,  hd: 22, hs: 15, sh: 200, sd: 14, ss: 0,   sat: 8 },
  banco:   { hh: 60,  hd: 14, hs: 10, sh: 140, sd: 24, ss: 10,  sat: 6 },
  essence: { hh: 200, hd: 18, hs: 10, sh: 255, sd: 28, ss: 12,  sat: 4 },
  born:    { hh: 40,  hd: 8,  hs: 0,  sh: 220, sd: 12, ss: 0,   sat: -22 },
  polar:   { hh: 205, hd: 22, hs: 10, sh: 220, sd: 28, ss: 10,  sat: -6 },
  sahel:   { hh: 35,  hd: 34, hs: 22, sh: 20,  sd: 14, ss: 10,  sat: 12 },
  canyon:  { hh: 28,  hd: 30, hs: 20, sh: 210, sd: 16, ss: 0,   sat: 10 },
  abyss:   { hh: 180, hd: 30, hs: 15, sh: 195, sd: 40, ss: 20,  sat: 6 },
  void:    { hh: 290, hd: 26, hs: 15, sh: 265, sd: 38, ss: 20,  sat: 8 },
  sgrun:   { hh: 190, hd: 24, hs: 10, sh: 210, sd: 34, ss: 10,  sat: -14 },
  tower:   { hh: 40,  hd: 12, hs: 5,  sh: 215, sd: 12, ss: 0,   sat: -4 },
};
/** Moments de la journée : ciel d'éclairage, lumière du soleil, étalonnage ajouté. */
const MOMENT = {
  aube:       { env: 'aube',       envI: 0.5,  sun: '#ffd7b0', sunK: 0.85, hh: 25,  hd: 18, sh: 250, sd: 16 },
  jour:       { env: 'jour',       envI: 0.55, sun: null,      sunK: 1 },
  crepuscule: { env: 'crepuscule', envI: 0.45, sun: '#ffb27a', sunK: 0.8,  hh: 18,  hd: 30, sh: 260, sd: 22 },
  nuit:       { env: 'nuit',       envI: 0.35, sun: '#9fb4ff', sunK: 0.75, hh: 220, hd: 20, sh: 235, sd: 36, sat: -14 },
};
/** Décors dont la lumière n'est pas celle du ciel : environnement fixe. */
const ENV_FIXED = { abyss: ['nuit', 0.4], void: ['nuit', 0.4], sgrun: ['nuit', 0.45], tower: ['jour', 0.45], sahel: ['desert', 0.6], canyon: ['desert', 0.55] };

/** Brouillard de profondeur (couleur, force 0..1). */
const FOG = {
  abidjan: ['#d9c9a8', 0.25], banco: ['#9fb89a', 0.4], essence: ['#8fa8e0', 0.45], born: ['#9a9a9e', 0.5],
  polar: ['#dfe8f2', 0.45], sahel: ['#e8c890', 0.4], canyon: ['#d8a878', 0.3], abyss: ['#0c3a48', 0.7],
  void: ['#2a1848', 0.6], sgrun: ['#0e2230', 0.55], tower: ['#b8b0a4', 0.15],
};

/** Météo et particules d'ambiance par décor. */
function weatherFor(place, moment){
  const b = place.biome, v = place.variant, night = moment === 'nuit';
  if(b === 'polar') return 'neige';
  if(b === 'abyss') return v === 'eruption' ? 'braises' : 'bulles';
  if(b === 'void') return 'eclats';
  if(b === 'sgrun') return 'donnees';
  if(b === 'sahel') return v === 'harmattan' ? 'harmattan' : 'poussiere';
  if(b === 'canyon') return v === 'cave' ? 'poussiere' : 'poussiere';
  if(b === 'essence') return v === 'feu' ? 'braises' : 'pollen';
  if(b === 'tower') return v === 'feu' ? 'braises' : null;
  if(b === 'banco') return night ? 'lucioles' : 'pollen';
  if(b === 'born') return night ? 'pluie' : 'poussiere';
  if(b === 'abidjan') return night ? (hashStr(place.seed || '') % 2 ? 'pluie' : 'lucioles') : 'poussiere';
  return null;
}
function hashStr(s){ let h = 0; s = String(s); for(let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

// ── Textures de particules (dessinées une fois, aucun fichier) ─
function makeTex(scene, name, draw, size = 64){
  const t = new BABYLON.DynamicTexture('pf_' + name, { width: size, height: size }, scene, true);
  const c = t.getContext();
  c.clearRect(0, 0, size, size);
  draw(c, size);
  t.hasAlpha = true;
  t.update(false);
  return t;
}
function particleTextures(scene){
  const radial = (stops) => (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    for(const [o, col] of stops) g.addColorStop(o, col);
    c.fillStyle = g; c.fillRect(0, 0, s, s);
  };
  return {
    glow: makeTex(scene, 'glow', radial([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.8)'], [0.6, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']])),
    soft: makeTex(scene, 'soft', radial([[0, 'rgba(255,255,255,0.9)'], [0.5, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']])),
    smoke: makeTex(scene, 'smoke', (c, s) => {
      for(let i = 0; i < 9; i++){
        const x = s * (0.3 + Math.random() * 0.4), y = s * (0.3 + Math.random() * 0.4), r = s * (0.18 + Math.random() * 0.16);
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, s, s);
      }
    }),
    drop: makeTex(scene, 'drop', (c, s) => {
      const g = c.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(s * 0.44, 0, s * 0.12, s);
    }),
    bubble: makeTex(scene, 'bubble', (c, s) => {
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = s * 0.07;
      c.beginPath(); c.arc(s / 2, s / 2, s * 0.38, 0, Math.PI * 2); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(s * 0.38, s * 0.36, s * 0.08, 0, Math.PI * 2); c.fill();
    }),
    flake: makeTex(scene, 'flake', radial([[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,0.75)'], [1, 'rgba(255,255,255,0)']]), 32),
  };
}

// ── Recettes des particules de combat ─────────────────────────
// count : nombre de particules ; life/size/speed : [min, max] ;
// grav : gravité (y) ; tex ; add : mélange additif (lumineux) ;
// stretch : étirées dans le sens du mouvement (étincelles) ; up : jet vers le haut.
const BURST = {
  hit:    { count: 18, life: [0.14, 0.36], size: [0.07, 0.16], speed: [2.5, 5.5], grav: -7,  tex: 'glow',  add: true,  stretch: true,  h: 1.0 },
  heavy:  { count: 40, life: [0.2, 0.5],   size: [0.09, 0.22], speed: [3.5, 8],   grav: -9,  tex: 'glow',  add: true,  stretch: true,  h: 1.0, dust: 10 },
  ult:    { count: 110, life: [0.5, 1.2],  size: [0.14, 0.4],  speed: [3, 9],     grav: -2,  tex: 'glow',  add: true,  stretch: false, h: 0.4, up: true, flash: 3.2, dust: 14 },
  cast:   { count: 26, life: [0.35, 0.75], size: [0.1, 0.24],  speed: [0.6, 1.8], grav: 1.2, tex: 'glow',  add: true,  stretch: false, h: 0.9 },
  heal:   { count: 28, life: [0.6, 1.2],   size: [0.1, 0.24],  speed: [0.4, 1.2], grav: 1.6, tex: 'soft',  add: true,  stretch: false, h: 0.3, up: true },
  dust:   { count: 14, life: [0.6, 1.2],   size: [0.35, 0.9],  speed: [0.6, 1.6], grav: 0.2, tex: 'smoke', add: false, stretch: false, h: 0.15 },
  death:  { count: 34, life: [0.5, 1.2],   size: [0.12, 0.3],  speed: [1, 3.5],   grav: 1.5, tex: 'glow',  add: true,  stretch: false, h: 0.8, dust: 12 },
};
const MAX_BURSTS = 14;

// ── Recettes de la météo ──────────────────────────────────────
// rate : particules/s (avant réglage de qualité) ; y : [min, max] hauteur d'apparition.
// Tailles pensées pour la vue de dessus (~30 px par mètre sur téléphone).
const WEATHER = {
  pluie:     { tex: 'drop',   rate: 900, life: [0.7, 0.9], size: [0.07, 0.1], speed: [15, 19], dir: [[-0.08, -1, 0.05], [0.02, -1, 0.1]], y: [11, 14], color: ['#b8c8ff', 0.35], stretch: true },
  neige:     { tex: 'flake',  rate: 220, life: [7, 10],    size: [0.15, 0.39], speed: [0.6, 1.2], dir: [[-0.4, -1, -0.2], [0.3, -1, 0.3]], y: [8, 12], color: ['#ffffff', 0.85] },
  poussiere: { tex: 'soft',   rate: 45,  life: [5, 8],     size: [0.09, 0.24], speed: [0.3, 0.9], dir: [[0.6, 0.05, 0.1], [1, 0.2, 0.4]], y: [0.2, 2.8], color: ['#f2d8a8', 0.45] },
  harmattan: { tex: 'soft',   rate: 260, life: [3, 5],     size: [0.1, 0.3], speed: [2, 4],     dir: [[0.9, 0, 0.1], [1, 0.12, 0.35]], y: [0.1, 3.5], color: ['#e8c48a', 0.5] },
  braises:   { tex: 'glow',   rate: 70,  life: [3, 6],     size: [0.075, 0.2], speed: [0.4, 1.2], dir: [[-0.2, 1, -0.2], [0.2, 1, 0.2]], y: [0, 1], color: ['#ff8a3a', 0.9], add: true, grav: 0.25 },
  bulles:    { tex: 'bubble', rate: 55,  life: [4, 7],     size: [0.125, 0.375], speed: [0.5, 1.2], dir: [[-0.1, 1, -0.1], [0.1, 1, 0.1]], y: [0, 1.5], color: ['#9ff2ff', 0.6] },
  lucioles:  { tex: 'glow',   rate: 14,  life: [4, 7],     size: [0.125, 0.25],  speed: [0.1, 0.35], dir: [[-1, -0.3, -1], [1, 0.4, 1]], y: [0.3, 2.5], color: ['#d8ff7a', 1], add: true, blink: true },
  pollen:    { tex: 'soft',   rate: 28,  life: [5, 8],     size: [0.09, 0.21], speed: [0.1, 0.4], dir: [[-1, -0.2, -1], [1, 0.3, 1]], y: [0.3, 3], color: ['#fff6c8', 0.55], add: true },
  eclats:    { tex: 'glow',   rate: 60,  life: [2, 4],     size: [0.075, 0.2], speed: [1, 3],     dir: [[-1, 0.2, -1], [1, 0.8, 1]], y: [0, 3], color: ['#c58bff', 0.9], add: true, stretch: true },
  donnees:   { tex: 'glow',   rate: 50,  life: [2, 4],     size: [0.062, 0.15], speed: [0.5, 1.5], dir: [[-0.1, 1, -0.1], [0.1, 1, 0.1]], y: [0, 1], color: ['#5fe6ff', 0.85], add: true },
};

export class Graphics{
  /** @param {object} units BabylonUnits (scène, moteur, caméra, conversions de coordonnées) */
  constructor(units){
    this.u = units;
    this.scene = units.scene;
    this.engine = units.engine;
    this.cameras = [units.camera];
    this.tex = particleTextures(this.scene);
    this.envCache = new Map();
    this.receivers = new Set();
    this.pulseK = 0;
    this.fps = { t: 0, n: 0, sum: 0, low: 0 };
    LIVE.add(this);
    this.reconfigure();
  }

  // ── Palier de qualité ───────────────────────────────────────
  reconfigure(){
    this.tier = effectiveTier();
    const T = this.T = TIERS[this.tier];
    const dpr = window.devicePixelRatio || 1;
    this.engine.setHardwareScalingLevel(1 / Math.max(1, Math.min(dpr, T.res)));

    this.pipeline?.dispose(); this.pipeline = null;
    this.ssao?.dispose(); this.ssao = null;
    this.glow?.dispose(); this.glow = null;
    this.shadowGen?.dispose(); this.shadowGen = null;

    if(T.pipeline){
      const hdr = !!this.engine.getCaps().textureHalfFloatRender;
      const p = new BABYLON.DefaultRenderingPipeline('pf_gfx', hdr, this.scene, this.cameras);
      // Anticrénelage : MSAA (net) en WebGL 2, sinon FXAA (qui floute un peu le sol).
      const msaa = this.engine.webGLVersion >= 2;
      p.samples = msaa ? (this.tier === 'haute' ? 4 : 2) : 1;
      p.fxaaEnabled = !msaa;
      p.bloomEnabled = T.bloom;
      p.bloomThreshold = 0.72;
      p.bloomWeight = 0.32;
      p.bloomKernel = 48;
      p.bloomScale = 0.5;
      p.imageProcessingEnabled = true;
      p.chromaticAberrationEnabled = T.chroma;
      if(T.chroma){ p.chromaticAberration.aberrationAmount = 0; p.chromaticAberration.radialIntensity = 1.2; }
      if(this.tier === 'haute'){ p.sharpenEnabled = true; p.sharpen.edgeAmount = 0.18; }
      this.pipeline = p;
    }
    const ip = this.scene.imageProcessingConfiguration;
    ip.toneMappingEnabled = true;
    ip.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL;

    if(T.glow){
      this.glow = new BABYLON.GlowLayer('pf_glow', this.scene, { mainTextureRatio: 0.4, blurKernelSize: 32 });
      this.glow.intensity = 0.6;
    }
    const sun = this.scene.getLightByName('sun');
    if(T.shadows && sun){
      const sg = new BABYLON.ShadowGenerator(T.shadows, sun);
      if(this.engine.webGLVersion >= 2){ sg.usePercentageCloserFiltering = true; sg.filteringQuality = this.tier === 'haute' ? BABYLON.ShadowGenerator.QUALITY_HIGH : BABYLON.ShadowGenerator.QUALITY_MEDIUM; }
      else sg.usePoissonSampling = true;
      sg.bias = 0.0015; sg.normalBias = 0.02;
      sg.setDarkness(0.18);
      sg.transparencyShadow = false;
      sun.autoUpdateExtends = false;
      sun.shadowMinZ = 1; sun.shadowMaxZ = 120;
      this.shadowGen = sg;
      for(const inst of this.u.instances?.values() || []) if(inst.pivot) this.addCaster(inst.pivot);
    }
    for(const m of this.receivers) this._setReceive(m, !!this.shadowGen);
    // Ombres « pastille » dessinées en 2D : inutiles avec de vraies ombres.
    const shadowLayer = this.u.pixiRenderer?.layers?.shadows;
    if(shadowLayer) shadowLayer.visible = !this.shadowGen;

    if(T.ssao && this.engine.webGLVersion >= 2){
      try{
        const s = new BABYLON.SSAO2RenderingPipeline('pf_ssao', this.scene, { ssaoRatio: 0.5, blurRatio: 0.5 }, this.cameras);
        s.radius = 1.4; s.totalStrength = 0.9; s.samples = 8; s.maxZ = 250; s.expensiveBlur = false;
        this.ssao = s;
      }catch(e){ this.ssao = null; }
    }
    if(this.weather){ const w = this.weatherKind; this._stopWeather(); this._startWeather(w); }
  }

  /** Caméra supplémentaire (mode Combat) : elle reçoit les mêmes effets. */
  attachCamera(cam){
    if(this.cameras.includes(cam)) return;
    this.cameras.push(cam);
    this.pipeline?.addCamera(cam);
    if(this.ssao) this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline('pf_ssao', [cam]);
  }
  detachCamera(cam){
    const i = this.cameras.indexOf(cam);
    if(i < 0) return;
    this.cameras.splice(i, 1);
    this.pipeline?.removeCamera(cam);
    if(this.ssao) this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline('pf_ssao', [cam]);
  }

  // ── Ombres ─────────────────────────────────────────────────
  addCaster(node){
    if(!this.shadowGen || !node) return;
    for(const m of node.getChildMeshes(false)) if(m.getTotalVertices() > 0) this.shadowGen.addShadowCaster(m, false);
  }
  /** Maillage qui reçoit les ombres (le sol). */
  addReceiver(mesh){
    this.receivers.add(mesh);
    this._setReceive(mesh, !!this.shadowGen);
  }
  removeReceiver(mesh){ this.receivers.delete(mesh); }
  _setReceive(m, on){
    if(m.isDisposed?.()){ this.receivers.delete(m); return; }
    if(m.material?.isFrozen) m.material.unfreeze();   // figé, il ne prendrait pas les ombres
    m.receiveShadows = on;
  }

  // ── Environnement et lieu ──────────────────────────────────
  _env(name){
    if(!this.envCache.has(name)){
      const t = BABYLON.CubeTexture.CreateFromPrefilteredData(`assets/env/${name}.env`, this.scene);
      t.gammaSpace = false;
      this.envCache.set(name, t);
    }
    return this.envCache.get(name);
  }

  /**
   * Début d'un combat, AVANT la construction du terrain (le brouillard doit
   * être connu des matériaux avant qu'ils ne soient figés).
   * @param {object} place  { biome, variant, night, moment?, seed? }
   */
  beginPlace(place){
    this.place = place;
    const shadowLayer = this.u.pixiRenderer?.layers?.shadows;
    if(shadowLayer) shadowLayer.visible = !this.shadowGen;
    this._warm = 0;
    this.moment = place.moment || (place.night ? 'nuit' : 'jour');
    const [fogCol, fogK] = FOG[place.biome] || FOG.abidjan;
    const night = this.moment === 'nuit';
    const col = hex(fogCol);
    const k = night ? 0.45 : 1;
    this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    this.scene.fogColor = new BABYLON.Color3(col.r * k, col.g * k, col.b * k);
    this.fogK = fogK;
    // Éclairage d'environnement : les matières PBR (personnages, armes,
    // objets) reflètent désormais un vrai ciel.
    const fixed = ENV_FIXED[place.biome];
    const M = MOMENT[this.moment] || MOMENT.jour;
    const [envName, envI] = (fixed && !(fixed[0] === 'desert' && this.moment !== 'jour')) ? fixed : [M.env, M.envI];
    if(this.T.env){
      this.scene.environmentTexture = this._env(envName);
      this.scene.environmentIntensity = envI;
    }
  }

  /** Après la lumière du terrain : moment de la journée, étalonnage, météo. */
  finishPlace(){
    const place = this.place; if(!place) return;
    const M = MOMENT[this.moment] || MOMENT.jour;
    const sun = this.scene.getLightByName('sun'), hemi = this.scene.getLightByName('hemi');
    if(M.sun && sun){
      const c = hex(M.sun);
      sun.diffuse = new BABYLON.Color3(sun.diffuse.r * c.r, sun.diffuse.g * c.g, sun.diffuse.b * c.b);
      sun.intensity *= M.sunK;
    }
    // Soleil un peu plus bas qu'au zénith : en vue de dessus, les ombres
    // portées des personnages restent visibles (même côté que les ombres
    // peintes du décor).
    if(sun && this.moment === 'jour') sun.direction = new BABYLON.Vector3(-0.55, -0.78, 0.42).normalize();
    if(this.moment === 'aube' || this.moment === 'crepuscule'){
      // Soleil bas : ombres plus longues, même côté que les ombres peintes.
      if(sun) sun.direction = new BABYLON.Vector3(-0.75, -0.55, 0.45).normalize();
      if(hemi) hemi.intensity *= 0.85;
    }
    // Étalonnage : décor + moment.
    const G = GRADE[place.biome] || GRADE.abidjan;
    const cc = new BABYLON.ColorCurves();
    // Dosage léger : une teinte d'ambiance, pas un filtre coloré.
    const K = 0.5;
    cc.globalSaturation = ((G.sat || 0) + (M.sat || 0)) * K;
    cc.highlightsHue = M.hh ?? G.hh; cc.highlightsDensity = ((M.hd ?? 0) + G.hd) * K; cc.highlightsSaturation = G.hs * K;
    cc.shadowsHue = M.sh ?? G.sh; cc.shadowsDensity = ((M.sd ?? 0) + G.sd) * K; cc.shadowsSaturation = G.ss * K;
    const ip = this.scene.imageProcessingConfiguration;
    ip.colorCurvesEnabled = true;
    ip.colorCurves = cc;
    this._startWeather(weatherFor(place, this.moment));
  }

  /** Fin du combat : on remet la scène à zéro. */
  endPlace(){
    this._stopWeather();
    this.scene.fogMode = BABYLON.Scene.FOGMODE_NONE;
    this.scene.imageProcessingConfiguration.colorCurvesEnabled = false;
    this.place = null;
    for(const m of [...this.receivers]) if(m.isDisposed?.()) this.receivers.delete(m);
  }

  // ── Météo ──────────────────────────────────────────────────
  _startWeather(kind){
    this.weatherKind = kind;
    const W = WEATHER[kind];
    if(!W || !this.T.weather) return;
    const rate = Math.round(W.rate * this.T.weather);
    const ps = new BABYLON.ParticleSystem('pf_weather', Math.max(50, Math.round(rate * W.life[1] * 1.1)), this.scene);
    ps.particleTexture = this.tex[W.tex];
    this.anchor = this.anchor || new BABYLON.TransformNode('pf_weatherAnchor', this.scene);
    ps.emitter = this.anchor;
    const R = 17;
    ps.createBoxEmitter(new BABYLON.Vector3(...W.dir[0]), new BABYLON.Vector3(...W.dir[1]),
      new BABYLON.Vector3(-R, W.y[0], -R * 0.8), new BABYLON.Vector3(R, W.y[1], R * 0.8));
    ps.emitRate = rate;
    ps.minLifeTime = W.life[0]; ps.maxLifeTime = W.life[1];
    ps.minSize = W.size[0]; ps.maxSize = W.size[1];
    ps.minEmitPower = W.speed[0]; ps.maxEmitPower = W.speed[1];
    ps.gravity = new BABYLON.Vector3(0, W.grav || 0, 0);
    const c = hex(W.color[0], W.color[1]);
    ps.color1 = c; ps.color2 = new BABYLON.Color4(c.r * 0.85, c.g * 0.85, c.b * 0.85, c.a);
    ps.colorDead = new BABYLON.Color4(c.r, c.g, c.b, 0);
    if(W.blink){
      ps.addColorGradient(0, new BABYLON.Color4(c.r, c.g, c.b, 0));
      ps.addColorGradient(0.3, c); ps.addColorGradient(0.5, new BABYLON.Color4(c.r, c.g, c.b, 0.15));
      ps.addColorGradient(0.7, c); ps.addColorGradient(1, new BABYLON.Color4(c.r, c.g, c.b, 0));
    }else{
      ps.addColorGradient(0, new BABYLON.Color4(c.r, c.g, c.b, 0));
      ps.addColorGradient(0.12, c); ps.addColorGradient(0.85, c);
      ps.addColorGradient(1, new BABYLON.Color4(c.r, c.g, c.b, 0));
    }
    ps.blendMode = W.add ? BABYLON.ParticleSystem.BLENDMODE_ADD : BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    if(W.stretch) ps.billboardMode = BABYLON.ParticleSystem.BILLBOARDMODE_STRETCHED;
    ps.minAngularSpeed = -0.5; ps.maxAngularSpeed = 0.5;
    ps.preWarmCycles = 60; ps.preWarmStepOffset = 5;
    ps.start();
    this.weather = ps;
  }
  _stopWeather(){ this.weather?.dispose(false); this.weather = null; }   // texture partagée conservée

  // ── Particules de combat ───────────────────────────────────
  /**
   * Gerbe de particules 3D à un point du monde (coordonnées du jeu).
   * @param {string} kind  hit | heavy | ult | cast | heal | dust | death
   * @param {object} o     { color: '#rrggbb', scale }
   */
  burst(kind, x, y, o = {}){
    const P = BURST[kind];
    if(!P || !this.T.particles) return;
    // Gerbes encore en vie (d'après leur durée) : au-delà du plafond, on saute.
    const now = performance.now();
    this.live = (this.live || []).filter(t => t > now);
    if(this.live.length >= MAX_BURSTS) return;
    this.live.push(now + P.life[1] * 1000 / Math.max(0.2, this.scene.animationTimeScale || 1) + 150);
    const pos = this.u._groundPos(x, y); pos.y += P.h;
    const n = Math.max(4, Math.round(P.count * this.T.particles * (o.scale || 1)));
    this._emit(P, pos, n, o.color || '#ffd27a');
    if(P.dust) this._emit(BURST.dust, pos.add(new BABYLON.Vector3(0, BURST.dust.h - P.h, 0)), Math.round(P.dust * this.T.particles), o.dustColor || '#b8a48a');
    if(P.flash) this._flash(pos, P.flash, o.color || '#ffffff');
  }
  _emit(P, pos, n, color){
    const ps = new BABYLON.ParticleSystem('pf_burst', n, this.scene);
    ps.particleTexture = this.tex[P.tex];
    ps.emitter = pos.clone();
    if(P.up) ps.createCylinderEmitter(0.35, 0.2, 0.2, 0.25);
    else ps.createSphereEmitter(0.15, 1);
    ps.manualEmitCount = n;
    ps.minLifeTime = P.life[0]; ps.maxLifeTime = P.life[1];
    ps.minSize = P.size[0]; ps.maxSize = P.size[1];
    ps.minEmitPower = P.speed[0]; ps.maxEmitPower = P.speed[1];
    ps.gravity = new BABYLON.Vector3(0, P.grav, 0);
    const c = hex(color, 1);
    const white = new BABYLON.Color4(1, 1, 1, 1);
    if(P.add){
      ps.addColorGradient(0, white);
      ps.addColorGradient(0.25, c);
      ps.addColorGradient(1, new BABYLON.Color4(c.r, c.g, c.b, 0));
      ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    }else{
      ps.addColorGradient(0, new BABYLON.Color4(c.r, c.g, c.b, 0.55));
      ps.addColorGradient(1, new BABYLON.Color4(c.r, c.g, c.b, 0));
      ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
      ps.addSizeGradient(0, P.size[0]); ps.addSizeGradient(1, P.size[1] * 1.8);
    }
    if(P.stretch) ps.billboardMode = BABYLON.ParticleSystem.BILLBOARDMODE_STRETCHED;
    ps.minAngularSpeed = -2; ps.maxAngularSpeed = 2;
    ps.targetStopDuration = P.life[1] + 0.05;
    // Les textures sont partagées : on détruit la gerbe, pas sa texture
    // (disposeOnStop la supprimait, et toutes les gerbes suivantes
    // devenaient invisibles).
    ps.onStoppedObservable.addOnce(() => setTimeout(() => ps.dispose(false), 0));
    ps.start();
  }
  _flash(pos, size, color){
    const ps = new BABYLON.ParticleSystem('pf_flash', 1, this.scene);
    ps.particleTexture = this.tex.glow;
    ps.emitter = pos.clone();
    ps.createPointEmitter(BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero());
    ps.manualEmitCount = 1;
    ps.minLifeTime = ps.maxLifeTime = 0.28;
    ps.minSize = ps.maxSize = size;
    ps.minEmitPower = ps.maxEmitPower = 0;
    const c = hex(color, 1);
    ps.addColorGradient(0, new BABYLON.Color4(1, 1, 1, 0.9));
    ps.addColorGradient(0.4, new BABYLON.Color4(c.r, c.g, c.b, 0.6));
    ps.addColorGradient(1, new BABYLON.Color4(c.r, c.g, c.b, 0));
    ps.addSizeGradient(0, size * 0.4); ps.addSizeGradient(1, size * 1.4);
    ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    ps.targetStopDuration = 0.3;
    ps.onStoppedObservable.addOnce(() => setTimeout(() => ps.dispose(false), 0));
    ps.start();
  }

  /** Secousse d'image : aberration chromatique et halo renforcé (gros coup, ultime). */
  pulse(k = 1){ this.pulseK = Math.min(1.5, Math.max(this.pulseK, k)); }

  // ── À chaque image ─────────────────────────────────────────
  update(){
    const cam = this.scene.activeCamera;
    if(!cam) return;
    const dt = Math.min(0.1, this.engine.getDeltaTime() / 1000 || 0.016);
    const target = cam.target ? cam.target : cam.getTarget?.();
    const ortho = cam.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

    // Zone des ombres : un cadre autour de ce que voit la caméra.
    const sun = this.scene.getLightByName('sun');
    if(this.shadowGen && sun && target){
      const half = ortho ? Math.max(cam.orthoRight || 10, (cam.orthoTop || 10) * 1.6) * 1.15 : 16;
      sun.position = target.subtract(sun.direction.scale(60));
      sun.orthoLeft = -half; sun.orthoRight = half; sun.orthoTop = half; sun.orthoBottom = -half;
      // Nettoyage des maillages disparus (unités mortes).
      const rl = this.shadowGen.getShadowMap()?.renderList;
      if(rl && (this._rlTick = (this._rlTick || 0) + 1) % 120 === 0){
        for(let i = rl.length - 1; i >= 0; i--) if(rl[i].isDisposed()) rl.splice(i, 1);
      }
    }
    // Brouillard de profondeur : en vue plongeante, le haut de l'écran
    // (plus loin) se voile légèrement ; en vue basse, l'horizon.
    if(this.place && this.scene.fogMode){
      const K = this.fogK;
      if(ortho){ const r = cam.radius || 100; this.scene.fogStart = r - 4; this.scene.fogEnd = r + 60 / Math.max(0.15, K); }
      else { this.scene.fogStart = 10; this.scene.fogEnd = 26 + 90 * (1 - K); }
    }
    // La météo suit la caméra.
    if(this.anchor && target) this.anchor.position.set(target.x, target.y || 0, target.z);
    // Secousse d'image.
    if(this.pipeline){
      if(this.pulseK > 0.01){
        this.pulseK *= Math.pow(0.02, dt);
        if(this.T.chroma) this.pipeline.chromaticAberration.aberrationAmount = 60 * this.pulseK;
        this.pipeline.bloomWeight = 0.32 + 0.45 * this.pulseK;
      }else if(this.pulseK){
        this.pulseK = 0;
        if(this.T.chroma) this.pipeline.chromaticAberration.aberrationAmount = 0;
        this.pipeline.bloomWeight = 0.32;
      }
    }
    // Mode Auto : si le jeu rame durablement, on descend d'un cran.
    if(this.place && gfxPref() === 'auto'){
      const f = this.fps;
      f.t += dt; f.sum += this.engine.getFps(); f.n++;
      if(f.t >= 1){
        const avg = f.sum / f.n; f.t = 0; f.sum = 0; f.n = 0;
        this._warm = (this._warm || 0) + 1;
        f.low = (this._warm > 6 && avg < 24) ? f.low + 1 : 0;
        if(f.low >= 5 && this.tier !== 'basse'){
          f.low = 0;
          try{ sessionStorage.setItem(AUTO_KEY, ORDER[ORDER.indexOf(this.tier) - 1]); }catch(e){}
          console.log('[Graphismes] le jeu rame : qualité abaissée d\'un cran.');
          this.reconfigure();
        }
      }
    }
  }

  dispose(){
    LIVE.delete(this);
    this._stopWeather();
    this.pipeline?.dispose(); this.ssao?.dispose(); this.glow?.dispose(); this.shadowGen?.dispose();
    for(const t of Object.values(this.tex)) t.dispose();
    for(const t of this.envCache.values()) t.dispose();
  }
}

/** Palier effectif, pour l'affichage (« Auto (Moyenne) »). */
export function qualityLabel(){
  const p = gfxPref();
  return p === 'auto' ? `Auto (${QUALITY_LABEL[effectiveTier()]})` : QUALITY_LABEL[p];
}
