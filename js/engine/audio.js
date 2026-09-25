// ============================================================
// AUDIO — bande originale, ambiances et bruitages.
//
// Uniquement de VRAIS enregistrements (assets/audio/), sous licence
// libre (CC0 / domaine public, voir assets/audio/CREDITS.md) : aucun son
// n'est synthétisé par le navigateur.
//
//   • Musique : un morceau par moment du jeu (menus, combat, duel, boss,
//     victoire, défaite), en fondu enchaîné, lu en flux (<audio>) pour ne
//     pas tout télécharger d'un coup.
//   • Bruitages : décodés une fois (Web Audio), rejoués sans latence,
//     avec plusieurs prises par son et une légère variation de hauteur
//     pour qu'un même coup ne sonne jamais deux fois pareil.
//
// Une entrée sans fichier (`files: []`) est simplement muette : on peut
// brancher le jeu avant d'avoir tous les enregistrements.
// ============================================================

const BASE = 'assets/audio/';

/**
 * Bruitages. files : prises (une est tirée au hasard) ; vol : volume ;
 * pitch : variation de hauteur (± fraction) ; gap : délai minimal entre
 * deux lectures (ms), pour les sons très fréquents ; voices : lectures
 * simultanées au plus.
 */
export const SFX = {
  // Interface
  ui_clic:      { files: [], vol: 0.5, pitch: 0.03, gap: 40 },
  ui_achat:     { files: [], vol: 0.7 },
  ui_refus:     { files: [], vol: 0.6 },
  recrue:       { files: [], vol: 0.8 },
  niveau:       { files: [], vol: 0.8 },
  // Corps à corps
  elan:         { files: [], vol: 0.55, pitch: 0.08, gap: 60, voices: 4 },
  coup_leger:   { files: [], vol: 0.75, pitch: 0.07, gap: 50, voices: 4 },
  coup_lourd:   { files: [], vol: 0.9,  pitch: 0.05, gap: 80, voices: 3 },
  lame:         { files: [], vol: 0.7,  pitch: 0.06, gap: 60, voices: 4 },
  garde:        { files: [], vol: 0.75, pitch: 0.05, gap: 80 },
  esquive:      { files: [], vol: 0.6,  pitch: 0.06, gap: 120 },
  chute:        { files: [], vol: 0.85, pitch: 0.04, gap: 200 },
  // Sorts et impacts
  sort:         { files: [], vol: 0.6,  pitch: 0.06, gap: 90, voices: 3 },
  ultime:       { files: [], vol: 0.95, gap: 400 },
  tir:          { files: [], vol: 0.45, pitch: 0.08, gap: 70, voices: 4 },
  impact_sol:   { files: [], vol: 0.8,  pitch: 0.05, gap: 120 },
  soin:         { files: [], vol: 0.45, pitch: 0.05, gap: 250 },
  elimination:  { files: [], vol: 0.8,  gap: 250 },
  // Mode Combat
  gong:         { files: [], vol: 0.9 },
  round_gagne:  { files: [], vol: 0.8 },
  round_perdu:  { files: [], vol: 0.8 },
};

/** Musique. loop : en boucle ; vol : volume propre au morceau. */
export const MUSIC = {
  menu:     { file: null, vol: 0.55, loop: true },
  combat:   { file: null, vol: 0.5,  loop: true },
  duel:     { file: null, vol: 0.5,  loop: true },
  boss:     { file: null, vol: 0.55, loop: true },
  victoire: { file: null, vol: 0.6,  loop: false },
  defaite:  { file: null, vol: 0.6,  loop: false },
};

const PREFS_KEY = 'pf_audio';
const FADE_S = 1.2;

class AudioEngine{
  constructor(){
    this.ctx = null;
    this.buffers = new Map();      // fichier -> AudioBuffer | Promise
    this.last = new Map();         // clé -> dernier départ (ms)
    this.playing = new Map();      // clé -> nombre de voix en cours
    this.track = null;             // { key, el }
    this.prefs = { music: 0.7, sfx: 0.85, muted: false };
    try{ Object.assign(this.prefs, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); }catch(e){}
  }

  /** À appeler sur un premier geste du joueur (règle des navigateurs). */
  unlock(){
    if(this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    this.ctx = new AC();
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.connect(this.ctx.destination);
    this._applyVolumes();
    // Préchargement des bruitages courants.
    for(const k of ['ui_clic', 'elan', 'coup_leger', 'coup_lourd', 'garde', 'gong']) this._preload(k);
    if(this._pendingMusic){ const k = this._pendingMusic; this._pendingMusic = null; this.music(k); }
  }

  setPrefs(p){
    Object.assign(this.prefs, p);
    try{ localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs)); }catch(e){}
    this._applyVolumes();
  }

  _applyVolumes(){
    if(this.sfxGain) this.sfxGain.gain.value = this.prefs.muted ? 0 : this.prefs.sfx;
    if(this.track){ const m = MUSIC[this.track.key]; this.track.el.volume = this._musicVol(m); }
  }
  _musicVol(m){ return this.prefs.muted ? 0 : Math.min(1, (m?.vol ?? 0.5) * this.prefs.music); }

  _load(file){
    if(this.buffers.has(file)) return this.buffers.get(file);
    const p = fetch(BASE + file)
      .then(r => { if(!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(buf => this.ctx.decodeAudioData(buf))
      .then(b => { this.buffers.set(file, b); return b; })
      .catch(e => { console.warn('[audio] son introuvable :', file, e.message || e); this.buffers.set(file, null); return null; });
    this.buffers.set(file, p);
    return p;
  }
  _preload(key){ for(const f of SFX[key]?.files || []) this._load(f); }

  /** Joue un bruitage. o : { vol, rate } pour moduler une lecture. */
  sfx(key, o = {}){
    const s = SFX[key];
    if(!this.ctx || !s || !s.files.length || this.prefs.muted) return;
    const now = performance.now();
    if(s.gap && now - (this.last.get(key) || 0) < s.gap) return;
    if((this.playing.get(key) || 0) >= (s.voices || 2)) return;
    const file = s.files[Math.floor(Math.random() * s.files.length)];
    const buf = this.buffers.get(file);
    if(!buf || buf instanceof Promise){ this._load(file); return; }   // prêt à la prochaine fois
    this.last.set(key, now);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const p = s.pitch || 0;
    src.playbackRate.value = (o.rate || 1) * (1 + (Math.random() * 2 - 1) * p);
    const g = this.ctx.createGain();
    g.gain.value = (s.vol ?? 0.8) * (o.vol ?? 1);
    src.connect(g).connect(this.sfxGain);
    this.playing.set(key, (this.playing.get(key) || 0) + 1);
    src.onended = () => this.playing.set(key, Math.max(0, (this.playing.get(key) || 1) - 1));
    src.start();
  }

  /** Change de morceau, en fondu enchaîné. null : silence. */
  music(key){
    if(this.track?.key === key) return;
    if(!this.ctx){ this._pendingMusic = key; return; }
    const m = key ? MUSIC[key] : null;
    const old = this.track;
    this.track = null;
    if(old) this._fade(old.el, old.el.volume, 0, () => { old.el.pause(); old.el.src = ''; });
    if(!m || !m.file) return;
    const el = new Audio(BASE + m.file);
    el.loop = !!m.loop;
    el.volume = 0;
    el.play().catch(() => {});
    this.track = { key, el };
    this._fade(el, 0, this._musicVol(m));
  }

  _fade(el, from, to, done){
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / (FADE_S * 1000));
      el.volume = from + (to - from) * k;
      if(k < 1) requestAnimationFrame(step); else done?.();
    };
    requestAnimationFrame(step);
  }
}

export const audio = new AudioEngine();
