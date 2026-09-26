// ============================================================
// PROLOGUE — cinématique d'ouverture racontée par Kankou Moussa.
//
// Une petite scène 3D à part (son propre moteur, détruit à la fin),
// découpée en plans calés sur les répliques : chaque plan dure le temps
// que Kankou dit sa phrase (voix intégrée, assets/audio/voix/recit/
// intro_nd_<n>.mp3), sur la musique « intro ». Les sous-titres suivent.
// Jouée au premier lancement d'une sauvegarde, et rejouable depuis
// l'écran titre. « Passer » arrête tout à n'importe quel moment.
// ============================================================
import { el } from './screens.js';
import { audio } from '../engine/audio.js';
import { t as tr, isEN } from '../i18n/i18n.js';

const GLB = 'assets/models/';
const ANIM = 'assets/animations/';

/** Texte du conte (identique aux voix enregistrées). */
const INTRO_FR = [
  "Écoute, enfant. Je vais te dire comment tout a commencé.",
  "Il y a sept siècles, j'étais l'Empereur du Mali. J'avais plus d'or que tous les rois de la terre.",
  "Mais l'or n'était rien à côté de ce qu'on m'a confié : cinq pierres. L'Eau, la Terre, le Feu, l'Air, et l'Équilibre.",
  "Réunies, elles donnaient le pouvoir de tout réécrire. Et aucun homme ne tient debout sous un tel poids.",
  "Alors je les ai séparées, et je les ai confiées au monde, pour que personne ne les réunisse jamais.",
  "Mais un jour, une ombre s'est mise à les chercher. Elle s'appelle Sgrün.",
  "Aujourd'hui, à Abidjan, dans une cour de Marcory, un bricoleur ouvre le colis que son père lui a envoyé.",
  "Il ne le sait pas encore… mais ce conte, c'est lui qui va l'écrire.",
];
const INTRO_EN = [
  "Listen, child. I will tell you how it all began.",
  "Seven centuries ago, I was the Emperor of Mali. I had more gold than all the kings of the earth.",
  "But gold was nothing compared to what was entrusted to me: five stones. Water, Earth, Fire, Air, and Balance.",
  "United, they gave the power to rewrite everything. And no man can stand under such a weight.",
  "So I separated them, and entrusted them to the world, so that no one would ever unite them again.",
  "But one day, a shadow began to search for them. Its name is Sgrün.",
  "Today, in Abidjan, in a courtyard in Marcory, a tinkerer opens the parcel his father sent him.",
  "He does not know it yet… but this tale is his to write.",
];
export const INTRO_LINES = isEN ? INTRO_EN : INTRO_FR;

// Les cinq pierres : Eau, Terre, Feu, Air, Équilibre.
const STONES = ['#3fa9f5', '#c08a4a', '#ff6a2a', '#e8f4ff', '#6fe0b0'];

// Ambiance de chaque plan : ciel (haut, horizon), brouillard, lumières.
const MOODS = {
  dusk:   { top: '#2a1d3a', hor: '#f08a3c', fog: '#b86a3a', hemi: '#ffd2a0', ground: '#7a5230', sun: '#ffb070', hemiI: 0.75, sunI: 1.4 },
  gold:   { top: '#3a2410', hor: '#ffc860', fog: '#c89040', hemi: '#ffe0a0', ground: '#8a6030', sun: '#ffd080', hemiI: 0.85, sunI: 1.6 },
  night:  { top: '#05060d', hor: '#26304a', fog: '#1a2030', hemi: '#8090c0', ground: '#2a2a34', sun: '#a0b0ff', hemiI: 0.45, sunI: 0.7 },
  shadow: { top: '#020103', hor: '#2a0f3a', fog: '#12061a', hemi: '#8a50c0', ground: '#140c18', sun: '#c084fc', hemiI: 0.3, sunI: 0.9 },
  city:   { top: '#1a2340', hor: '#f0905a', fog: '#6a4a50', hemi: '#ffc8a0', ground: '#4a4440', sun: '#ffb080', hemiI: 0.8, sunI: 1.3 },
};

// Plans : qui est à l'écran, ambiance, caméra de départ -> d'arrivée
// (alpha, beta, rayon, hauteur visée).
const SHOTS = [
  { who: 'KANKOU', mood: 'dusk',   anim: 'idle', from: [2.2, 1.40, 10, 1.1], to: [1.75, 1.38, 4.6, 1.2] },
  { who: 'KANKOU', mood: 'gold',   anim: 'idle', from: [1.35, 1.30, 3.4, 1.5], to: [1.85, 1.32, 3.0, 1.55], gold: true },
  { who: 'KANKOU', mood: 'dusk',   anim: 'cast', from: [1.2, 1.20, 5.4, 1.4], to: [1.9, 1.25, 4.8, 1.5], stones: 'appear' },
  { who: 'KANKOU', mood: 'night',  anim: 'cast', from: [1.9, 1.25, 4.8, 1.6], to: [1.6, 1.05, 4.0, 2.2], stones: 'merge' },
  { who: 'KANKOU', mood: 'night',  anim: 'idle', from: [1.6, 1.05, 5, 1.8], to: [1.3, 0.75, 13, 2.5], stones: 'scatter' },
  { who: 'SGRUN',  mood: 'shadow', anim: 'idle', from: [1.57, 1.55, 3.2, 1.6], to: [1.57, 1.45, 4.4, 1.5] },
  { who: 'TARINE', mood: 'city',   anim: 'idle', from: [2.3, 1.32, 7, 1.1], to: [1.9, 1.35, 3.6, 1.25], hand: true },
  { who: 'TARINE', mood: 'city',   anim: 'idle', from: [1.9, 1.35, 3.6, 1.25], to: [1.62, 1.45, 1.1, 1.18], hand: true, finale: true },
];

const CAST = {
  KANKOU: { file: 'KANKOU.glb', idle: 'pro-melee-axe-pack-unarmed-idle.glb', cast: 'standing-2h-cast-spell-01.glb' },
  SGRUN:  { file: 'SGRUN.glb',  idle: 'pro-melee-axe-pack-unarmed-idle.glb' },
  TARINE: { file: 'TARINE.glb', idle: 'pro-melee-axe-pack-unarmed-idle-looking-ver-1.glb' },
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const col = (h) => BABYLON.Color3.FromHexString(h);

/** Joue le prologue. Résout quand il est fini ou passé. */
export function playIntro(){
  if(typeof BABYLON === 'undefined') return Promise.resolve();
  return new Promise(resolve => {
    const root = el('div', 'intro');
    root.innerHTML = `
      <canvas class="intro-canvas"></canvas>
      <div class="intro-veil"></div>
      <div class="intro-flash"></div>
      <button type="button" class="pf-btn pf-btn-ghost pf-btn-sm intro-skip">${tr('PASSER')}</button>
      <p class="intro-sub"></p>
      <div class="intro-end"><img src="assets/logo-clair.webp" alt="Pierre et Force"></div>`;
    (document.getElementById('app') || document.body).appendChild(root);
    const canvas = root.querySelector('canvas');
    const $sub = root.querySelector('.intro-sub');
    const $flash = root.querySelector('.intro-flash');

    let done = false, engine = null;
    const finish = () => {
      if(done) return;
      done = true;
      audio.stopVoice();
      audio.music('menu');
      root.classList.add('out');
      setTimeout(() => { try{ engine?.dispose(); }catch(e){} root.remove(); resolve(); }, 600);
    };
    root.querySelector('.intro-skip').addEventListener('click', (e) => { e.stopPropagation(); finish(); });

    run().catch(e => { console.warn('[intro]', e); finish(); });

    async function run(){
      engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true }, true);
      engine.setHardwareScalingLevel(Math.max(1, (window.devicePixelRatio || 1) / 1.5));
      const scene = new BABYLON.Scene(engine);
      scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
      scene.fogDensity = 0.014;

      const cam = new BABYLON.ArcRotateCamera('ic', 1.7, 1.4, 8, new BABYLON.Vector3(0, 1.2, 0), scene);
      cam.fov = 0.6; cam.minZ = 0.05;
      const hemi = new BABYLON.HemisphericLight('ih', new BABYLON.Vector3(0.2, 1, 0.3), scene);
      const sun = new BABYLON.DirectionalLight('is', new BABYLON.Vector3(-0.5, -0.6, -0.6), scene);
      const rim = new BABYLON.DirectionalLight('ir', new BABYLON.Vector3(0.3, -0.2, 1), scene);  // contre-jour
      rim.intensity = 0.9;

      // Ciel : grand dôme peint d'un dégradé vertical.
      const skyTex = new BABYLON.DynamicTexture('isky', { width: 4, height: 256 }, scene, false);
      const sky = BABYLON.MeshBuilder.CreateSphere('idome', { diameter: 180, segments: 16, sideOrientation: BABYLON.Mesh.BACKSIDE }, scene);
      const skyMat = new BABYLON.StandardMaterial('iskym', scene);
      skyMat.emissiveTexture = skyTex; skyMat.disableLighting = true; skyMat.fogEnabled = false;
      skyMat.diffuseColor = BABYLON.Color3.Black(); skyMat.specularColor = BABYLON.Color3.Black();
      sky.material = skyMat; sky.infiniteDistance = true;

      // Sol : un grand disque de sable, légèrement grainé.
      const grain = new BABYLON.DynamicTexture('igrain', 256, scene, true);
      { const c = grain.getContext(); const im = c.createImageData(256, 256);
        for(let i = 0; i < im.data.length; i += 4){ const v = 200 + Math.random() * 55; im.data[i] = im.data[i+1] = im.data[i+2] = v; im.data[i+3] = 255; }
        c.putImageData(im, 0, 0); grain.update(); }
      grain.uScale = grain.vScale = 30;
      const ground = BABYLON.MeshBuilder.CreateDisc('iground', { radius: 70, tessellation: 64 }, scene);
      ground.rotation.x = Math.PI / 2;
      const gMat = new BABYLON.StandardMaterial('igm', scene);
      gMat.diffuseTexture = grain; gMat.specularColor = BABYLON.Color3.Black();
      ground.material = gMat;

      // Pierres : cinq sphères lumineuses, avec halo.
      const glow = new BABYLON.GlowLayer('iglow', scene, { mainTextureSamples: 2 });
      glow.intensity = 0.9;
      const stones = STONES.map((h, i) => {
        const m = BABYLON.MeshBuilder.CreateIcoSphere('istone' + i, { radius: 0.11, subdivisions: 4 }, scene);
        const mat = new BABYLON.StandardMaterial('istm' + i, scene);
        mat.emissiveColor = col(h); mat.diffuseColor = BABYLON.Color3.Black(); mat.disableLighting = true;
        m.material = mat; m.setEnabled(false); m.__c = col(h);
        return m;
      });

      // Poussière d'or / braises : une texture ronde générée.
      const dot = new BABYLON.DynamicTexture('idot', 64, scene, false);
      { const c = dot.getContext(); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, 64, 64); dot.update(); dot.hasAlpha = true; }
      const dust = new BABYLON.ParticleSystem('idust', 600, scene);
      dust.particleTexture = dot;
      dust.emitter = new BABYLON.Vector3(0, 3.5, 0);
      dust.createBoxEmitter(new BABYLON.Vector3(-0.2, -1, -0.2), new BABYLON.Vector3(0.2, -1, 0.2), new BABYLON.Vector3(-3, 0, -3), new BABYLON.Vector3(3, 1, 3));
      dust.minSize = 0.02; dust.maxSize = 0.07; dust.minLifeTime = 2; dust.maxLifeTime = 4;
      dust.minEmitPower = 0.3; dust.maxEmitPower = 0.8; dust.emitRate = 0;
      dust.color1 = new BABYLON.Color4(1, 0.85, 0.4, 1); dust.color2 = new BABYLON.Color4(1, 0.7, 0.2, 0.8);
      dust.colorDead = new BABYLON.Color4(1, 0.6, 0.1, 0);
      dust.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
      dust.start();

      // Personnages : chargés une fois, un seul visible à la fois.
      const actors = {};
      await Promise.all(Object.entries(CAST).map(async ([k, c]) => {
        const cont = await BABYLON.SceneLoader.LoadAssetContainerAsync(GLB, c.file, scene);
        cont.animationGroups.forEach(g => g.stop());
        cont.addAllToScene();
        const rootNode = cont.meshes[0];
        const nodes = new Map();
        const add = (n) => { nodes.set(n.name, n); if(/^mixamorig\d+:/.test(n.name)) nodes.set(n.name.replace(/^mixamorig\d+:/, 'mixamorig:'), n); };
        cont.transformNodes.forEach(add); cont.meshes.forEach(add);
        const anims = {};
        for(const [slot, file] of Object.entries(c)){
          if(slot === 'file') continue;
          try{
            const ac = await BABYLON.SceneLoader.LoadAssetContainerAsync(ANIM, file, scene);
            const src = ac.animationGroups[ac.animationGroups.length - 1];
            const g = new BABYLON.AnimationGroup(k + '_' + slot, scene);
            for(const ta of src?.targetedAnimations || []){ const t = nodes.get(ta.target?.name); if(t) g.addTargetedAnimation(ta.animation, t); }
            ac.animationGroups.forEach(x => x.dispose());
            if(g.targetedAnimations.length) anims[slot] = g;
          }catch(e){ /* sans animation, le personnage garde sa pose */ }
        }
        rootNode.setEnabled(false);
        actors[k] = { root: rootNode, anims, hand: nodes.get('mixamorig:RightHand') };
      }));
      if(done) return;

      // Fond sonore et lumière de départ.
      audio.music('intro');
      let mood = { ...MOODS.dusk }, moodTo = MOODS.dusk, moodT = 1;
      const paintSky = (m) => {
        const c = skyTex.getContext(); const g = c.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, m.top); g.addColorStop(0.62, m.hor); g.addColorStop(1, m.fog);
        c.fillStyle = g; c.fillRect(0, 0, 4, 256); skyTex.update();
      };
      const applyMood = (a, b, t) => {
        const mix = (k) => BABYLON.Color3.Lerp(col(a[k]), col(b[k]), t);
        scene.fogColor = mix('fog'); scene.clearColor = BABYLON.Color4.FromColor3(mix('fog'), 1);
        hemi.diffuse = mix('hemi'); hemi.groundColor = mix('ground').scale(0.6);
        sun.diffuse = mix('sun'); rim.diffuse = mix('sun');
        gMat.diffuseColor = mix('ground');
        hemi.intensity = lerp(a.hemiI, b.hemiI, t); sun.intensity = lerp(a.sunI, b.sunI, t);
      };
      paintSky(MOODS.dusk); applyMood(MOODS.dusk, MOODS.dusk, 1);

      // Animation continue : caméra, ambiance, pierres, secousse.
      let shot = null, t0 = 0, dur = 1, shake = 0, stoneMode = null, stoneT0 = 0, handStone = null;
      const orbit = (i, t) => {
        const a = t * 0.8 + i * (Math.PI * 2 / 5);
        return new BABYLON.Vector3(Math.cos(a) * 1.1, 1.7 + Math.sin(t * 1.3 + i) * 0.12, Math.sin(a) * 1.1);
      };
      scene.onBeforeRenderObservable.add(() => {
        const now = performance.now() / 1000;
        if(shot){
          const k = ease(Math.min(1, (now - t0) / dur));
          cam.alpha = lerp(shot.from[0], shot.to[0], k);
          cam.beta = lerp(shot.from[1], shot.to[1], k);
          cam.radius = lerp(shot.from[2], shot.to[2], k);
          cam.target.y = lerp(shot.from[3], shot.to[3], k);
          // Dernier plan : on vient cadrer la pierre.
          cam.target.x = 0; cam.target.z = shot.finale ? lerp(0, 0.42, k) : 0;
        }
        if(moodT < 1){
          moodT = Math.min(1, moodT + engine.getDeltaTime() / 1400);
          applyMood(mood, moodTo, moodT);
          if(moodT >= 1){ mood = { ...moodTo }; }
        }
        if(shake > 0){
          cam.alpha += (Math.random() - 0.5) * shake * 0.03;
          cam.beta += (Math.random() - 0.5) * shake * 0.03;
          shake = Math.max(0, shake - engine.getDeltaTime() / 900);
        }
        // Pierres
        const st = now - stoneT0;
        stones.forEach((s, i) => {
          if(stoneMode === 'appear'){
            const on = st > 0.4 + i * 1.1;
            s.setEnabled(on);
            if(on){ s.position.copyFrom(orbit(i, now)); s.scaling.setAll(Math.min(1, (st - 0.4 - i * 1.1) * 3)); }
          }else if(stoneMode === 'merge'){
            s.setEnabled(true);
            const k = Math.min(1, st / 4);
            const p = BABYLON.Vector3.Lerp(orbit(i, now), new BABYLON.Vector3(0, 2.7, 0), ease(k));
            s.position.copyFrom(p);
            s.scaling.setAll(1 + k * 1.5);
          }else if(stoneMode === 'scatter'){
            s.setEnabled(st < 5);
            const a = i * (Math.PI * 2 / 5) + 0.4;
            const d = st * st * 3;
            s.position.set(Math.cos(a) * d, 2.7 + st * 2.2, Math.sin(a) * d);
            s.scaling.setAll(Math.max(0.3, 2.5 - st * 0.5));
          }else s.setEnabled(false);
        });
        if(!handStone) glow.intensity = stoneMode === 'merge' ? 0.9 + Math.min(1, st / 4) * 1.6 : 0.9;
        if(handStone){
          // La pierre de l'Équilibre flotte devant lui, sortie de la boîte.
          handStone.position.set(0, 1.18 + Math.sin(now * 1.6) * 0.03, 0.42);
          const k = shot?.finale ? Math.min(1, (now - t0) / dur) : 0;
          handStone.scaling.setAll(0.75 + Math.sin(now * 3) * 0.06 + k * 0.5);
          glow.intensity = 0.9 + k * 2.2;
        }
      });
      engine.runRenderLoop(() => scene.render());
      const onResize = () => engine.resize();
      window.addEventListener('resize', onResize);
      await scene.whenReadyAsync(true);
      if(done) return;
      root.classList.add('ready');

      // Déroulé : un plan par réplique.
      for(let i = 0; i < SHOTS.length && !done; i++){
        const s = SHOTS[i], line = INTRO_LINES[i];
        // Personnage à l'écran et son animation.
        for(const [k, a] of Object.entries(actors)){
          const on = k === s.who;
          a.root.setEnabled(on);
          for(const g of Object.values(a.anims)) g.stop();
          if(on){ const g = a.anims[s.anim] || a.anims.idle; g?.start(true, 1.0); }
        }
        if(s.mood){ mood = { ...mood }; moodTo = MOODS[s.mood]; moodT = 0; paintSky(moodTo); }
        dust.emitRate = s.gold ? 160 : (s.mood === 'dusk' ? 25 : 0);
        dust.color1 = s.mood === 'shadow' ? new BABYLON.Color4(0.75, 0.5, 1, 1) : new BABYLON.Color4(1, 0.85, 0.4, 1);
        if(s.stones !== undefined || stoneMode){ stoneMode = s.stones || null; stoneT0 = performance.now() / 1000; }
        if(s.hand && !handStone){
          handStone = stones[4].clone('ihand'); handStone.setEnabled(true);
        }
        if(!s.hand && handStone){ handStone.dispose(); handStone = null; }

        // Sous-titre.
        $sub.classList.remove('in'); void $sub.offsetWidth;
        $sub.textContent = line; $sub.classList.add('in');

        // Durée : celle de la voix, avec un minimum de lecture.
        const minMs = Math.max(3200, line.length * 55);
        shot = { ...s }; t0 = performance.now() / 1000; dur = minMs / 1000 + 1.2;
        const voice = audio.voice('recit/intro_nd_' + i);
        if(s.stones === 'merge') setTimeout(() => { if(!done){ $flash.classList.remove('go'); void $flash.offsetWidth; $flash.classList.add('go'); shake = 1; } }, 3800);
        await Promise.all([voice, sleep(minMs)]);
        if(done) break;
        await sleep(s.finale ? 400 : 1100);   // un temps de conte entre les phrases
      }
      if(done) return;
      // Fin : l'éclat de la pierre remplit l'écran, puis le titre.
      root.classList.add('white');
      await sleep(900);
      root.classList.add('title');
      $sub.classList.remove('in');
      await sleep(3200);
      window.removeEventListener('resize', onResize);
      finish();
    }
  });
}
