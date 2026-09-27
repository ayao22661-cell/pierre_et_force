// ============================================================
// PROLOGUE — cinématique d'ouverture (≈ 3 min), jouée avec le moteur du
// jeu lui-même : vrais décors de mission, personnages armés, animations
// de combat, gerbes de particules, ombres et lumière de chaque lieu.
//
// Trois scènes, racontées par Kankou Moussa :
//   1. NIANI, 1324 — l'Empereur, les cinq pierres, les ombres qui
//      l'attaquent, la séparation des pierres ;
//   2. LE DOMAINE DE SGRÜN — l'Empire et ses émissaires ;
//   3. MARCORY, AUJOURD'HUI — Tarine, la pierre, le premier combat.
//
// Mise en scène : un « metteur en scène » avance une horloge (qui ralentit
// pendant les ralentis), déplace les acteurs, déclenche leurs gestes
// (coups, esquives, parades, chutes, sorts) et pilote une caméra de
// cinéma (plans, coupes, travellings, secousses). La musique (bande de
// 3 min, music/prologue.mp3) et les répliques de Kankou suivent.
// Jouée au premier lancement, et rejouable depuis l'écran titre.
// ============================================================
import { el } from './screens.js';
import { audio } from '../engine/audio.js';
import { t as tr, isEN } from '../i18n/i18n.js';
import { BabylonUnits } from '../engine/babylon-units.js';
import { BabylonTerrain } from '../engine/babylon-terrain.js';
import { arenaLayout } from '../engine/tilemap.js';

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

const M = 45;                          // pixels du monde par mètre (WORLD_SCALE)
const LAYOUT = arenaLayout();
const C = { x: LAYOUT.w / 2, y: LAYOUT.h / 2 };   // centre de l'arène
const THEME = { g1: '#3a2c1e', g2: '#463524', lane: '#6a5138', acc: '#c9a24a', wall: '#1c140c' };
// Les cinq pierres : Eau, Terre, Feu, Air, Équilibre.
const STONES = ['#3fa9f5', '#c08a4a', '#ff6a2a', '#e8f4ff', '#6fe0b0'];

// Distribution : clé du personnage, camp (0 : alliés, 1 : Empire).
const CAST = {
  kankou: ['KANKOU', 0], ombre1: ['DARK', 1], ombre2: ['DARK', 1],
  sgrun: ['SGRUN', 1], krag: ['KRAG', 1], vael: ['VAEL', 1], murk: ['MURK', 1], sub: ['SUB', 1], grob: ['GROB', 1],
  tarine: ['TARINE', 0], karen: ['KAREN', 0], fulgence: ['FULGENCE', 0], baba: ['BABA', 0],
};

// Rayon du corps (m) : les colosses prennent plus de place.
const BIG = new Set(['GROB', 'FULGENCE', 'KRAG', 'SGRUN']);

class Skip extends Error{}
const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/** Joue le prologue. Résout quand il est fini ou passé. */
let running = null;   // un seul prologue à la fois (double clic)
export function playIntro(){
  if(typeof BABYLON === 'undefined') return Promise.resolve();
  if(running) return running;
  running = new Promise(resolve => {
    const root = el('div', 'intro');
    root.innerHTML = `
      <div class="intro-stage"></div>
      <div class="intro-veil"></div>
      <div class="intro-flash"></div>
      <div class="intro-load"><span>${tr('Chargement…')}</span><i></i></div>
      <button type="button" class="pf-btn pf-btn-ghost pf-btn-sm intro-skip">${tr('PASSER')}</button>
      <div class="intro-card"><b></b><span></span></div>
      <p class="intro-sub"></p>
      <div class="intro-end"><img src="assets/logo-clair.webp" alt="Pierre et Force"><small>${tr('Musique : cynicmusic, Matthew Pablo, iamoneabe · Sons : Little Robot Sound Factory, Kenney')}</small></div>`;
    (document.getElementById('app') || document.body).appendChild(root);
    const $ = (s) => root.querySelector(s);
    const $sub = $('.intro-sub'), $flash = $('.intro-flash'), $card = $('.intro-card'), $veil = $('.intro-veil');

    let done = false, stage = null, terrain = null, obs = null;
    const finish = () => {
      if(done) return;
      done = true;
      audio.stopVoice();
      audio.music('menu');
      root.classList.add('out');
      setTimeout(() => {
        try{ if(obs) stage?.scene.onBeforeRenderObservable.remove(obs); }catch(e){}
        try{ terrain?.destroy(); }catch(e){}
        try{ stage?.destroy(); }catch(e){}
        root.remove();
        delete window.__pfIntroClock;
        running = null;
        resolve();
      }, 650);
    };
    $('.intro-skip').addEventListener('click', (e) => { e.stopPropagation(); finish(); });

    run().catch(e => { if(!(e instanceof Skip)) console.warn('[prologue]', e); finish(); });

    async function run(){
      const V3 = BABYLON.Vector3;
      // ── Le plateau : le moteur 3D du jeu, avec notre propre caméra ──
      const fakePixi = { camera: { x: C.x, y: C.y, zoom: 1, baseZoom: 1 }, app: null };
      stage = new BabylonUnits($('.intro-stage'), fakePixi);
      const scene = stage.scene, gfx = stage.gfx;
      const cam = new BABYLON.UniversalCamera('cine', new V3(0, 3, -10), scene);
      cam.fov = 0.8; cam.minZ = 0.1; cam.maxZ = 600; cam.inputs.clear();
      scene.activeCamera = cam;
      gfx.attachCamera(cam);

      // ── Les acteurs (tous chargés dès le début, montrés à la demande) ──
      let nextId = 9000;
      const A = {};
      for(const [name, [key, team]] of Object.entries(CAST)){
        A[name] = { name, on: false, tweens: [], bx: C.x, by: C.y + 40 * M, ox: 0, oy: 0, down: false, r: BIG.has(key) ? 0.6 : 0.4, u: { id: nextId++, key, kind: 'champ', team, isPlayer: key === 'TARINE',
          x: C.x, y: C.y + 40 * M, facing: { x: 0, y: 1 }, target: null, dead: false } };
      }
      const units = Object.values(A).map(a => a.u);
      const inst = (a) => stage.instances.get(a.u.id);
      const ready = (a) => !!inst(a)?.ready;

      // ── Horloges du metteur en scène ──
      // `clock` : temps de l'action, ralenti pendant les ralentis (wait).
      // `wall` : temps de la musique, jamais ralenti. Les repères until(t)
      // sont en temps musique : chaque séquence se recale sur la bande-son.
      let clock = 0, wall = 0, timeScale = 1, slowUntil = 0;
      const waiters = [];
      const wait = (s) => { if(done) throw new Skip(); return new Promise(r => waiters.push({ at: clock + s, r })); };
      const until = (t) => {
        if(done) throw new Skip();
        if(wall > t + 0.3) console.warn('[prologue] repère ' + t + ' s dépassé de ' + (wall - t).toFixed(1) + ' s');
        return new Promise(r => waiters.push({ wallAt: t, r }));
      };
      const slow = (k, dur) => { timeScale = k; slowUntil = clock + dur; };

      // ── Caméra : un plan = une position et une visée, qui peuvent suivre
      // les acteurs, interpolées de « de » à « vers » sur la durée du plan.
      let shotCur = null, shake = 0;
      const shot = (from, to, dur, o = {}) => { shotCur = { from, to: to || from, t0: clock, dur, fov: o.fov || [0.8, 0.8], ease: o.ease || ease }; };
      const P = (a) => stage._groundPos(a.u.x, a.u.y);
      const W = (dx, dy) => ({ x: C.x + dx * M, y: C.y + dy * M });
      const G = (dx, dy, h = 0) => { const w = W(dx, dy); const v = stage._groundPos(w.x, w.y); v.y += h; return v; };
      const rel = (a) => ({ x: (a.u.x - C.x) / M, y: (a.u.y - C.y) / M });
      // Position autour d'un acteur : angle 0 = devant lui (vers le bas de la carte).
      const around = (a, ang, d, h, th = 1.5) => () => {
        const b = P(a);
        return { pos: b.add(new V3(Math.sin(ang) * d, h, -Math.cos(ang) * d)), tgt: b.add(new V3(0, th, 0)) };
      };
      const between = (a, b, ang, d, h, th = 1.3) => () => {
        const m = P(a).add(P(b)).scale(0.5);
        return { pos: m.add(new V3(Math.sin(ang) * d, h, -Math.cos(ang) * d)), tgt: m.add(new V3(0, th, 0)) };
      };
      const fixed = (pos, tgt) => () => ({ pos, tgt });
      // Plan de duel : caméra de profil par rapport à l'axe a→b (côté `s` :
      // +1 / −1), légèrement dans le dos de a pour voir le visage de b.
      // Toujours lisible, quel que soit l'endroit où les corps ont bougé.
      const duel = (a, b, s, d, h, th = 1.3, back = 0.35) => () => {
        const pa = P(a), pb = P(b), m = pa.add(pb).scale(0.5);
        const u = pb.subtract(pa); u.y = 0; u.normalize();
        const n = new V3(-u.z * s, 0, u.x * s);
        return { pos: m.add(n.scale(d)).add(u.scale(-back * d)).add(new V3(0, h, 0)), tgt: m.add(new V3(0, th, 0)) };
      };

      // ── Gestes et déplacements ──
      const show = (...as) => as.forEach(a => { a.on = true; });
      const hide = (...as) => as.forEach(a => { a.on = false; });
      const place = (a, dx, dy, f) => { const w = W(dx, dy); a.bx = a.u.x = w.x; a.by = a.u.y = w.y; a.ox = a.oy = 0; a.tweens = []; if(f) a.u.facing = f; };
      const face = (a, b) => { const dx = b.u.x - a.u.x, dy = b.u.y - a.u.y, d = Math.hypot(dx, dy) || 1; a.u.facing = { x: dx / d, y: dy / d }; };
      const move = (a, dx, dy, dur, o = {}) => {
        const w = W(dx, dy);
        a.bx = a.u.x; a.by = a.u.y; a.ox = a.oy = 0;
        a.tweens = [{ x0: a.u.x, y0: a.u.y, x1: w.x, y1: w.y, t0: clock, dur, ease: o.ease || ((t) => t), turn: o.turn !== false }];
      };
      const toward = (a, b, stop, dur) => {   // court vers b et s'arrête à `stop` mètres
        const dx = b.u.x - a.u.x, dy = b.u.y - a.u.y, d = Math.hypot(dx, dy) || 1;
        const k = Math.max(0, d - stop * M) / d;
        move(a, (a.u.x + dx * k - C.x) / M, (a.u.y + dy * k - C.y) / M, dur);
      };
      const knock = (a, from, dist, dur = 0.45) => {   // projeté en arrière, loin de `from`
        const dx = a.u.x - from.u.x, dy = a.u.y - from.u.y, d = Math.hypot(dx, dy) || 1;
        move(a, (a.u.x + dx / d * dist * M - C.x) / M, (a.u.y + dy / d * dist * M - C.y) / M, dur, { ease: easeOut, turn: false });
      };
      const act = (a, state, i = 0, o = {}) => { if(state === 'death') a.down = true; return stage.playFight(a.u.id, state, i, o); };
      const rise = (a) => { a.down = false; stage.releaseFight(a.u.id); };
      const fx = (kind, a, color, scale = 1) => gfx.burst(kind, a.u.x, a.u.y, { color, scale });
      const fxAt = (kind, dx, dy, color, scale = 1) => { const w = W(dx, dy); gfx.burst(kind, w.x, w.y, { color, scale }); };
      const sfx = (k, vol) => audio.sfx(k, vol ? { vol } : {});
      const flash = (white = true) => { $flash.classList.toggle('dark', !white); $flash.classList.remove('go'); void $flash.offsetWidth; $flash.classList.add('go'); };
      const hit = (k = 1) => { shake = Math.max(shake, k); gfx.pulse(0.6 * k); };
      const blink = (a, dx, dy, color = '#9b59ff') => { fx('death', a, color, 0.7); place(a, dx, dy); fx('death', a, color, 0.7); sfx('sort'); };

      // ── Texte : répliques, cartons de lieu, fondus ──
      const say = (i) => {
        $sub.classList.remove('in'); void $sub.offsetWidth;
        $sub.textContent = INTRO_LINES[i]; $sub.classList.add('in');
        audio.voice('recit/intro_nd_' + i).then(() => setTimeout(() => { if($sub.textContent === INTRO_LINES[i]) $sub.classList.remove('in'); }, 900));
      };
      const card = async (title, sub, dur = 3.2) => {
        $card.querySelector('b').textContent = title; $card.querySelector('span').textContent = sub;
        $card.classList.add('in'); await wait(dur); $card.classList.remove('in');
      };
      const black = (on, s = 0.8) => { $veil.style.transition = `opacity ${s}s ease`; $veil.style.opacity = on ? '1' : '0'; };

      // ── Lieux : un vrai décor de mission, en arène, avec son ciel ──
      const setPlace = (missionId, moment, seed) => {
        try{ terrain?.destroy(); }catch(e){}
        terrain = new BabylonTerrain(scene, { ...THEME, missionId, mode: 'duel', moment }, LAYOUT, seed, null);
      };
      const waitReady = async (as, ms) => {
        const t1 = performance.now();
        while(!as.every(ready) && performance.now() - t1 < ms){ if(done) throw new Skip(); await new Promise(r => setTimeout(r, 150)); }
      };

      // ── Les cinq pierres (sphères lumineuses et leur halo) ──
      let stones = [];
      const makeStones = (colors) => {
        stones.forEach(s => { s.ps.dispose(false); s.m.dispose(); });
        stones = colors.map((h, i) => {
          const m = BABYLON.MeshBuilder.CreateIcoSphere('st' + i, { radius: 0.13, subdivisions: 3 }, scene);
          const mat = new BABYLON.StandardMaterial('stm' + i, scene);
          mat.emissiveColor = BABYLON.Color3.FromHexString(h); mat.disableLighting = true; mat.diffuseColor = BABYLON.Color3.Black();
          m.material = mat; m.setEnabled(false);
          const ps = new BABYLON.ParticleSystem('sth' + i, 60, scene);
          ps.particleTexture = gfx.tex.glow; ps.emitter = m; ps.createSphereEmitter(0.05, 1);
          const c = BABYLON.Color3.FromHexString(h);
          ps.color1 = new BABYLON.Color4(c.r, c.g, c.b, 0.9); ps.color2 = new BABYLON.Color4(1, 1, 1, 0.6); ps.colorDead = new BABYLON.Color4(c.r, c.g, c.b, 0);
          ps.minSize = 0.25; ps.maxSize = 0.5; ps.minLifeTime = 0.15; ps.maxLifeTime = 0.35; ps.emitRate = 70;
          ps.minEmitPower = 0; ps.maxEmitPower = 0.2; ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
          return { m, ps, pos: null, glow: 1 };
        });
      };
      const stoneOn = (s, on) => { s.m.setEnabled(on); if(on) s.ps.start(); else s.ps.stop(); };

      // ── Chaque image : horloge, acteurs, caméra, pierres ──
      let last = performance.now();
      obs = scene.onBeforeRenderObservable.add(() => {
        const now = performance.now();
        const real = Math.min(0.25, (now - last) / 1000); last = now;
        wall += real;
        if(slowUntil && clock >= slowUntil){ timeScale = 1; slowUntil = 0; }
        scene.animationTimeScale = timeScale;
        clock += real * timeScale;
        for(let i = waiters.length - 1; i >= 0; i--) if(waiters[i].wallAt !== undefined ? wall >= waiters[i].wallAt : clock >= waiters[i].at){ const w = waiters.splice(i, 1)[0]; w.r(); }
        // Déplacements.
        for(const a of Object.values(A)){
          const tw = a.tweens[0];
          if(tw){
            const k = Math.min(1, (clock - tw.t0) / tw.dur), e = tw.ease(k);
            const nx = tw.x0 + (tw.x1 - tw.x0) * e, ny = tw.y0 + (tw.y1 - tw.y0) * e;
            if(tw.turn && (Math.abs(nx - a.bx) + Math.abs(ny - a.by)) > 0.5){ const d = Math.hypot(nx - a.bx, ny - a.by); a.u.facing = { x: (nx - a.bx) / d, y: (ny - a.by) / d }; }
            a.bx = nx; a.by = ny;
            if(k >= 1) a.tweens.shift();
          }
          a.u.x = a.bx + a.ox; a.u.y = a.by + a.oy;
        }
        // Les corps ne se traversent pas : deux acteurs trop proches
        // s'écartent doucement (les corps au sol restent où ils tombent).
        const on = Object.values(A).filter(a => a.on);
        for(let i = 0; i < on.length; i++) for(let j = i + 1; j < on.length; j++){
          const a = on[i], b = on[j];
          const dx = b.u.x - a.u.x, dy = b.u.y - a.u.y, d = Math.hypot(dx, dy) || 0.01;
          const need = (a.r + b.r) * M;
          if(d >= need) continue;
          const push = Math.min(need - d, 6 * M * real) / 2, nx = dx / d, ny = dy / d;
          const wa = a.down ? 0 : (b.down ? 2 : 1), wb = b.down ? 0 : (a.down ? 2 : 1);
          a.ox -= nx * push * wa; a.oy -= ny * push * wa; b.ox += nx * push * wb; b.oy += ny * push * wb;
          a.u.x = a.bx + a.ox; a.u.y = a.by + a.oy; b.u.x = b.bx + b.ox; b.u.y = b.by + b.oy;
        }
        stage.update(units);
        for(const a of Object.values(A)){ const i = inst(a); if(i?.ready && i.pivot) i.pivot.setEnabled(a.on); }
        // Caméra.
        if(shotCur){
          const k = shotCur.ease(Math.min(1, (clock - shotCur.t0) / shotCur.dur));
          const f = shotCur.from(), t = shotCur.to();
          cam.position.copyFrom(V3.Lerp(f.pos, t.pos, k));
          const tg = V3.Lerp(f.tgt, t.tgt, k);
          if(shake > 0){
            const s = shake * 0.12;
            cam.position.addInPlace(new V3((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s));
            shake = Math.max(0, shake - real * 2.2);
          }
          cam.setTarget(tg);
          cam.fov = shotCur.fov[0] + (shotCur.fov[1] - shotCur.fov[0]) * k;
        }
        // Pierres.
        for(const s of stones) if(s.pos){ s.m.position.copyFrom(s.pos(clock)); s.m.scaling.setAll(s.glow); }
      });

      // ═══ Chargement ═══
      black(true, 0);
      setPlace('m19', 'crepuscule', 7);
      makeStones(STONES);
      const t0 = performance.now();
      while(![A.kankou, A.ombre1, A.ombre2].every(ready) && performance.now() - t0 < 30000){
        if(done) throw new Skip();
        const n = Object.values(A).filter(ready).length;
        $('.intro-load i').style.setProperty('--p', Math.round(100 * n / units.length) + '%');
        await new Promise(r => setTimeout(r, 200));
      }
      root.classList.add('ready');
      audio.music('intro');
      clock = 0; wall = 0;
      window.__pfIntroClock = () => ({ wall, clock });

      // ═══════════════ 1. NIANI, 1324 ═══════════════
      show(A.kankou); place(A.kankou, 0, 0, { x: 0, y: 1 });
      shot(around(A.kankou, 0.2, 22, 16, 1.2), around(A.kankou, 0, 9, 4.5, 1.6), 9, { fov: [0.9, 0.7] });
      black(false, 2.2);
      card(tr('NIANI'), tr('Empire du Mali — 1324'), 4);
      await until(1.8); say(0);
      await until(9.5);
      // Plan bas, héroïque : l'Empereur et son or.
      shot(around(A.kankou, 0.5, 3.2, 0.5, 1.9), around(A.kankou, -0.4, 3.4, 0.7, 1.9), 8.5, { fov: [0.75, 0.68] });
      act(A.kankou, 'taunt'); sfx('gong', 0.7);
      say(1);
      for(let i = 0; i < 4; i++){ fx('cast', A.kankou, '#ffd27a', 1.2); sfx('soin', 0.5); await wait(1.6); }
      await until(18);
      // Les cinq pierres apparaissent autour de lui.
      shot(around(A.kankou, 0, 7, 2.6, 1.8), around(A.kankou, 1.4, 6.5, 2.2, 2), 10, { fov: [0.8, 0.8] });
      act(A.kankou, 'cast', 0, { dur: 2.2 });
      say(2);
      const orbit = (i) => (t) => { const b = P(A.kankou), a = t * 0.9 + i * Math.PI * 2 / 5; return b.add(new V3(Math.cos(a) * 2.1, 2.7 + Math.sin(t * 1.4 + i) * 0.15, Math.sin(a) * 2.1)); };
      for(let i = 0; i < 5; i++){ stones[i].pos = orbit(i); stoneOn(stones[i], true); sfx('sort', 0.5); await wait(1.1); }
      await until(25.5);
      // Des ombres surgissent et chargent l'Empereur.
      show(A.ombre1, A.ombre2);
      place(A.ombre1, -8, -2); place(A.ombre2, 8, -1);
      fx('death', A.ombre1, '#7a3cff'); fx('death', A.ombre2, '#7a3cff'); sfx('gong'); hit(0.8);
      face(A.ombre1, A.kankou); face(A.ombre2, A.kankou); face(A.kankou, A.ombre1);
      shot(around(A.ombre1, 3.9, 2.4, 1.9, 1.6), around(A.ombre1, 3.7, 2.8, 1.7, 1.2), 1.4, { fov: [0.85, 0.85] });
      act(A.ombre1, 'taunt');
      await wait(1.2);
      toward(A.ombre1, A.kankou, 1.4, 1.5); toward(A.ombre2, A.kankou, 1.4, 1.6); sfx('elan');
      shot(between(A.ombre1, A.kankou, 0.3, 8, 2.2), between(A.ombre1, A.kankou, 0.1, 6, 1.6), 1.6, { fov: [0.85, 0.8] });
      await wait(1.3);
      act(A.ombre1, 'attack', 0, { dur: 0.6 }); act(A.kankou, 'dodge', 0, { dur: 0.5 }); sfx('esquive'); slow(0.35, 0.8);
      await wait(0.6);
      // L'Empereur riposte : onde d'or, ralenti.
      shot(around(A.kankou, 0.3, 3, 1.2, 1.5), around(A.kankou, -0.3, 4, 1.6, 1.4), 2.2, { fov: [0.7, 0.9] });
      act(A.kankou, 'cast', 1, { dur: 1 }); sfx('ultime'); slow(0.3, 1.0);
      await wait(0.5);
      fx('ult', A.kankou, '#ffd27a', 1.4); fx('heavy', A.kankou, '#ffe9a0'); flash(); hit(1.4);
      knock(A.ombre1, A.kankou, 5, 0.6); knock(A.ombre2, A.kankou, 5, 0.6);
      act(A.ombre1, 'death', 0, { hold: true }); act(A.ombre2, 'death', 1, { hold: true }); sfx('chute'); sfx('coup_lourd');
      await wait(1.2);
      shot(around(A.kankou, 2.4, 10, 3, 1), around(A.kankou, 2.7, 10, 3.2, 1), 3);
      await wait(1.2);
      fx('death', A.ombre1, '#7a3cff'); fx('death', A.ombre2, '#7a3cff'); sfx('elimination', 0.6); hide(A.ombre1, A.ombre2);
      await until(36);
      // Réunies, les pierres donnent le pouvoir de tout réécrire.
      const merge = (i, t1) => (t) => { const k = Math.min(1, Math.max(0, (t - t1) / 4)); return V3.Lerp(orbit(i)(t), P(A.kankou).add(new V3(0, 3.3, 0)), ease(k)); };
      const tMerge = clock;
      stones.forEach((s, i) => { s.pos = merge(i, tMerge); });
      shot(around(A.kankou, 0.15, 3.5, 0.4, 2.6), around(A.kankou, 0, 4.5, 0.3, 3), 7, { fov: [0.8, 0.95] });
      act(A.kankou, 'cast', 0, { dur: 4 });
      say(3);
      for(let i = 0; i < 5; i++){ stones.forEach(s => { s.glow = 1 + i * 0.35; }); sfx('sort', 0.4 + i * 0.1); await wait(0.9); }
      flash(); hit(1.6); sfx('impact_sol'); sfx('gong');
      fxAt('ult', 0, 0, '#ffffff', 1.6);
      await until(44);
      // Il les sépare : elles s'envolent aux quatre coins du monde.
      const tScatter = clock;
      const scatter = (i) => (t) => { const s = t - tScatter, a = i * Math.PI * 2 / 5 + 0.4, d = s * 1.6 + s * s * 0.25; return P(A.kankou).add(new V3(Math.cos(a) * d, 3.3 + s * 1.1, Math.sin(a) * d)); };
      stones.forEach((s, i) => { s.pos = scatter(i); s.glow = 1.3; });
      act(A.kankou, 'cast', 1, { dur: 1.2 }); sfx('elan'); sfx('ultime', 0.6);
      say(4);
      shot(around(A.kankou, 0.3, 6, 1.2, 3), around(A.kankou, 0.5, 11, 1.4, 5.5), 8, { fov: [0.8, 0.95] });
      await until(53);
      stones.forEach(s => stoneOn(s, false));
      black(true, 1.6);
      await until(55.5);

      // ═══════════════ 2. LE DOMAINE DE SGRÜN ═══════════════
      hide(A.kankou);
      setPlace('m46', 'nuit', 3);
      // Nuit hors du temps, mais on doit voir les visages : lumière violette d'appoint.
      { const h = scene.getLightByName('hemi'); if(h){ h.intensity *= 1.6; h.diffuse = BABYLON.Color3.Lerp(h.diffuse, BABYLON.Color3.FromHexString('#b48cff'), 0.4); }
        scene.imageProcessingConfiguration.exposure *= 1.35; }
      await waitReady([A.sgrun, A.krag, A.vael, A.murk, A.sub, A.grob], 8000);
      show(A.sgrun); place(A.sgrun, 0, -2, { x: 0, y: 1 });
      const emis = [[A.krag, -4, -5], [A.vael, 4, -5], [A.murk, -6.5, -2.5], [A.sub, 6.5, -2.5], [A.grob, 0, -7]];
      emis.forEach(([a, x, y]) => place(a, x, y, { x: 0, y: 1 }));
      shot(around(A.sgrun, 0, 16, 3, 1.8), around(A.sgrun, 0, 4.2, 1.5, 1.8), 9, { fov: [0.75, 0.62], ease: (t) => t });
      black(false, 2);
      card(tr('LE DOMAINE DE SGRÜN'), tr('Hors du temps'), 3.6);
      await wait(2); say(5);
      await wait(4.5);
      act(A.sgrun, 'cast', 0, { dur: 1.6 }); sfx('sort'); fx('cast', A.sgrun, '#c084fc', 1.4);
      await until(66);
      // Ses émissaires paraissent, un par un.
      for(const [a] of emis){
        show(a); fx('death', a, '#c084fc', 1.1); fx('heavy', a, '#7a3cff', 0.8); sfx('gong', 0.8); hit(0.5);
        shot(around(a, 0.35, 3.2, 0.9, 1.25), around(a, -0.2, 2.8, 1.1, 1.3), 2.6, { fov: [0.78, 0.7] });
        act(a, 'taunt');
        await wait(2.6);
      }
      // L'Empire au complet.
      shot(around(A.sgrun, 0, 11, 0.8, 1.6), around(A.sgrun, 0.15, 9, 0.6, 1.8), 6.5, { fov: [0.85, 0.8] });
      act(A.sgrun, 'taunt'); sfx('gong');
      await wait(3.6);
      act(A.sgrun, 'cast', 1, { dur: 1.4 }); fx('ult', A.sgrun, '#c084fc', 1.2); hit(0.8); sfx('ultime', 0.7);
      await wait(2.4);
      // Ils partent vers le monde des hommes.
      emis.forEach(([a, x], i) => move(a, x * 0.6, 9.5, 2.2 + i * 0.15));
      sfx('elan'); sfx('elan');
      shot(fixed(G(0, 6, 0.4), G(0, -3, 1.6)), fixed(G(0, 7.5, 0.3), G(0, -1, 1.4)), 3, { fov: [0.95, 0.95] });
      await wait(3);
      shot(around(A.sgrun, 0.1, 3.2, 1.5, 1.6), around(A.sgrun, 0, 2.2, 1.6, 1.65), 6, { fov: [0.62, 0.5] });
      await wait(2); act(A.sgrun, 'taunt'); sfx('gong', 0.6);
      await until(95.2);
      black(true, 1.2);
      await until(97);

      // ═══════════════ 3. ABIDJAN — MARCORY, AUJOURD'HUI ═══════════════
      hide(A.sgrun, A.krag, A.vael, A.murk, A.sub, A.grob);
      setPlace('m1', 'crepuscule', 11);
      await waitReady([A.tarine, A.karen, A.fulgence, A.baba], 8000);
      makeStones([STONES[4]]);
      show(A.tarine); place(A.tarine, 0, 0.5, { x: 0, y: 1 });
      const pierre = stones[0];
      // La pierre flotte à côté de lui, à hauteur de main : petite, pour ne
      // jamais masquer l'image quand la caméra est proche.
      pierre.pos = () => P(A.tarine).add(new V3(0.42, 1.2 + Math.sin(clock * 1.7) * 0.04, -0.15));
      pierre.glow = 0.6; pierre.ps.minSize = 0.12; pierre.ps.maxSize = 0.24;
      stoneOn(pierre, true);
      shot(around(A.tarine, 0.6, 16, 10, 1), around(A.tarine, 0.2, 5, 1.8, 1.3), 8, { fov: [0.9, 0.72] });
      black(false, 2);
      card(tr('ABIDJAN'), tr('Marcory — aujourd\'hui'), 3.6);
      await wait(1.4); say(6);
      await wait(4);
      shot(around(A.tarine, 0.1, 2.3, 1.55, 1.5), around(A.tarine, -0.1, 1.9, 1.55, 1.5), 3.2, { fov: [0.6, 0.52] });
      await wait(3.2);
      // Les émissaires tombent du ciel dans la cour.
      stoneOn(pierre, false);   // la pierre se cache dans sa main pendant la bagarre
      show(A.sub, A.grob); place(A.sub, -6, -3); place(A.grob, 6, -3.5);
      face(A.sub, A.tarine); face(A.grob, A.tarine); face(A.tarine, A.grob);
      fx('heavy', A.sub, '#9b59ff'); fx('heavy', A.grob, '#ff8a3a'); fx('dust', A.grob, null, 1.6); fx('dust', A.sub, null, 1.6);
      sfx('impact_sol'); sfx('impact_sol'); hit(1.2);
      shot(around(A.tarine, 3.4, 5, 2, 1.3), around(A.tarine, 3.2, 5.5, 2.2, 1.2), 2.2);
      act(A.grob, 'taunt'); act(A.sub, 'taunt');
      await wait(2.2);
      // Grob charge. Tarine esquive au dernier moment.
      toward(A.grob, A.tarine, 1.2, 1.3); sfx('elan');
      shot(duel(A.grob, A.tarine, 1, 6, 1.1, 1.2, 0.2), duel(A.grob, A.tarine, 1, 4.5, 1.0, 1.2, 0.3), 1.4, { fov: [0.85, 0.8] });
      await wait(1.2);
      act(A.grob, 'attack', 0, { dur: 0.7 }); sfx('elan');
      act(A.tarine, 'dodge', 0, { dur: 0.55 }); move(A.tarine, -1.6, 1.6, 0.45, { turn: false }); sfx('esquive');
      slow(0.3, 1.1);
      await wait(1.1);
      // Riposte : trois coups, le dernier le projette.
      face(A.tarine, A.grob);
      shot(duel(A.tarine, A.grob, 1, 3.8, 1.2), duel(A.tarine, A.grob, 1, 3.4, 1.1, 1.3, 0.45), 2.4, { fov: [0.8, 0.75] });
      for(let i = 0; i < 3; i++){
        act(A.tarine, 'attack', i, { dur: 0.5 }); sfx('elan');
        await wait(0.28);
        act(A.grob, 'hit', i, { dur: 0.4 }); fx(i === 2 ? 'heavy' : 'hit', A.grob, '#39ff7a', i === 2 ? 1 : 0.7);
        sfx(i === 2 ? 'coup_lourd' : 'lame'); hit(i === 2 ? 1 : 0.4);
        if(i === 2){ knock(A.grob, A.tarine, 3.2, 0.4); act(A.grob, 'death', 0, { hold: true }); sfx('chute'); }
        await wait(0.3);
      }
      // Sub surgit dans son dos.
      await wait(0.4);
      { const r = rel(A.tarine); blink(A.sub, r.x - 1.3, r.y - 1.1); }
      face(A.sub, A.tarine);
      shot(duel(A.sub, A.tarine, -1, 3.4, 1.5, 1.3, 0.1), duel(A.sub, A.tarine, -1, 3, 1.4, 1.3, 0.2), 1.8, { fov: [0.75, 0.75] });
      await wait(0.35);
      face(A.tarine, A.sub);
      act(A.sub, 'attack', 0, { dur: 0.55 }); act(A.tarine, 'block', 0, { dur: 0.5, hold: true });
      await wait(0.3);
      fx('hit', A.tarine, '#9ec5ff'); sfx('garde'); hit(0.8);
      await wait(0.7);
      rise(A.tarine); rise(A.grob);
      // Deux contre un : il finit par tomber.
      toward(A.grob, A.tarine, 1.1, 0.9); sfx('elan');
      act(A.sub, 'attack', 1, { dur: 0.6 });
      await wait(0.45);
      fx('hit', A.tarine, '#9b59ff'); sfx('lame'); act(A.tarine, 'hit', 0, { dur: 0.4 });
      await wait(0.5);
      act(A.grob, 'attack', 1, { dur: 0.7 }); sfx('elan');
      await wait(0.4);
      fx('heavy', A.tarine, '#ff8a3a'); sfx('coup_lourd'); hit(1.3);
      act(A.tarine, 'death', 0, { hold: true }); knock(A.tarine, A.grob, 2.2, 0.5); sfx('chute');
      slow(0.35, 1.6); flash(false);
      shot(around(A.tarine, 2.2, 3.0, 1.0, 1.0), around(A.tarine, 2.0, 2.1, 0.4, 0.4), 2.4, { fov: [0.72, 0.62] });
      await wait(2.4);
      // Les siens arrivent.
      show(A.karen, A.fulgence, A.baba);
      place(A.fulgence, -10, 5); place(A.baba, 10, 5); place(A.karen, -3.5, 8);
      toward(A.fulgence, A.grob, 1.2, 1.4); toward(A.baba, A.sub, 1.2, 1.3);
      { const r = rel(A.tarine); move(A.karen, r.x - 1.7, r.y + 0.3, 1.6); }   // à son côté, hors du champ du gros plan
      sfx('elan'); sfx('elan');
      shot(fixed(G(1.5, 14, 4), G(0, 0, 1)), fixed(G(1.2, 12.5, 3.2), G(0, 0, 1)), 1.6, { fov: [0.95, 0.9] });
      await wait(1.4);
      act(A.fulgence, 'attack', 2, { dur: 0.6 }); act(A.baba, 'attack', 0, { dur: 0.5 }); sfx('elan');
      await wait(0.3);
      act(A.grob, 'hit', 1, { dur: 0.5 }); act(A.sub, 'hit', 0, { dur: 0.5 });
      fx('heavy', A.grob, '#378ADD'); fx('hit', A.sub, '#ffd27a'); sfx('coup_lourd'); sfx('coup_leger'); hit(1);
      knock(A.grob, A.fulgence, 2.5); knock(A.sub, A.baba, 2.2);
      shot(duel(A.baba, A.sub, 1, 4.5, 1.5), duel(A.fulgence, A.grob, -1, 5, 1.5), 2.2, { fov: [0.85, 0.85] });
      await wait(1.1);
      face(A.karen, A.tarine); act(A.karen, 'cast', 0, { dur: 1 }); sfx('soin');
      await wait(0.5);
      fx('heal', A.tarine, '#7dffb0', 1.3);
      await wait(0.8);
      // Échanges : Sub contre Baba, Grob contre Fulgence.
      face(A.sub, A.baba); face(A.baba, A.sub);
      shot(duel(A.baba, A.sub, 1, 3.8, 1.3), duel(A.baba, A.sub, 1, 3.3, 1.2, 1.3, 0.5), 2.4);
      act(A.sub, 'attack', 2, { dur: 0.55 }); sfx('elan');
      await wait(0.3);
      act(A.baba, 'dodge', 1, { dur: 0.45 }); sfx('esquive');
      await wait(0.5);
      act(A.baba, 'attack', 1, { dur: 0.5 }); await wait(0.3);
      act(A.sub, 'hit', 1, { dur: 0.4 }); fx('hit', A.sub, '#ffd27a'); sfx('coup_leger'); hit(0.5);
      await wait(0.7);
      face(A.grob, A.fulgence); rise(A.grob);
      shot(duel(A.grob, A.fulgence, 1, 4.6, 1.5, 1.4), duel(A.grob, A.fulgence, 1, 4, 1.4, 1.4, 0.5), 2.2);
      act(A.grob, 'attack', 2, { dur: 0.7 }); sfx('elan');
      await wait(0.35);
      act(A.fulgence, 'block', 0, { dur: 0.4, hold: true }); fx('hit', A.fulgence, '#9ec5ff'); sfx('garde'); hit(0.9);
      await wait(0.9); rise(A.fulgence);
      await wait(0.4);
      // Tarine se relève. La pierre s'éveille.
      rise(A.tarine);
      { const r = rel(A.tarine); place(A.tarine, r.x, r.y, { x: 0, y: -1 }); }
      shot(around(A.tarine, Math.PI + 0.25, 2.8, 0.45, 1.5), around(A.tarine, Math.PI - 0.3, 3.1, 0.5, 1.6), 3.4, { fov: [0.75, 0.7] });   // face à lui, contre-plongée
      act(A.tarine, 'taunt'); sfx('gong'); stoneOn(pierre, true); pierre.glow = 1.0;
      fx('cast', A.tarine, '#6fe0b0', 1.3); sfx('soin');
      await wait(2.4);
      // Onde d'Équilibre : l'ultime.
      act(A.tarine, 'cast', 0, { dur: 1.2 }); sfx('ultime'); slow(0.25, 1.8);
      shot(around(A.tarine, 0, 5, 1, 1.4), around(A.tarine, 0.4, 7.5, 2, 1.2), 2.6, { fov: [0.8, 1.0] });
      await wait(0.6);
      fx('ult', A.tarine, '#6fe0b0', 1.6); fx('heavy', A.tarine, '#dff0ff', 1.2); flash(); hit(1.8); sfx('impact_sol');
      knock(A.sub, A.tarine, 6, 0.7); knock(A.grob, A.tarine, 6, 0.7);
      act(A.sub, 'death', 1, { hold: true }); act(A.grob, 'death', 0, { hold: true }); sfx('chute'); sfx('coup_lourd');
      await wait(2.2);
      fx('death', A.sub, '#9b59ff'); fx('death', A.grob, '#9b59ff'); sfx('elimination', 0.6);
      hide(A.sub, A.grob);
      pierre.glow = 0.7;
      shot(around(A.tarine, 0.4, 7.5, 2, 1.2), around(A.tarine, 1.4, 6, 1.4, 1.3), Math.max(4, 151 - wall), { ease: (t) => t });
      await until(152);
      // L'équipe réunie, face au lendemain.
      place(A.tarine, 0, 0.5, { x: 0, y: 1 }); place(A.karen, -2, -0.6, { x: 0.2, y: 1 });
      place(A.fulgence, 2.1, -0.6, { x: -0.2, y: 1 }); place(A.baba, 3.9, -1.4, { x: -0.3, y: 1 });
      [A.tarine, A.karen, A.fulgence, A.baba].forEach(rise);
      shot(around(A.tarine, 0, 9, 0.6, 1.6), around(A.tarine, 0, 5, 0.45, 1.7), 11, { fov: [0.85, 0.72], ease: (t) => t });
      act(A.karen, 'taunt'); act(A.fulgence, 'taunt'); act(A.baba, 'taunt'); sfx('gong', 0.7);
      await wait(4);
      act(A.tarine, 'taunt'); fx('cast', A.tarine, '#6fe0b0', 1.4);
      await until(163); say(7);
      pierre.glow = 0.3;   // gros plan : on la garde petite
      shot(around(A.tarine, 0, 3.2, 1.4, 1.45), around(A.tarine, 0, 1.9, 1.5, 1.5), 7, { fov: [0.62, 0.48] });
      for(let i = 1; i <= 13; i++){ await wait(0.5); pierre.glow = 0.3 + 0.03 * i; }   // la pierre s'éveille
      pierre.glow = 3; sfx('ultime', 0.5);
      $veil.style.background = '#fff8ec'; black(true, 0.9);
      await wait(1.2);
      $veil.style.transition = 'background 1s ease'; $veil.style.background = '#07080d';
      root.classList.add('title');
      $sub.classList.remove('in');
      await until(182);
      finish();
    }
  });
  return running;
}
