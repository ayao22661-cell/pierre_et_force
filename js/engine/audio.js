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
//   • Voix : chaque personnage a la sienne (répliques du récit et cris
//     de combat, assets/audio/voix/). Une seule voix à la fois ; la
//     musique baisse le temps qu'elle parle.
//   • Bruitages : décodés une fois (Web Audio), rejoués sans latence,
//     avec plusieurs prises par son et une légère variation de hauteur
//     pour qu'un même coup ne sonne jamais deux fois pareil.
//
// Une entrée sans fichier (`files: []`) est simplement muette.
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
  ui_clic:      { files: ['sfx/ui_clic_1.mp3', 'sfx/ui_clic_2.mp3', 'sfx/ui_clic_3.mp3'], vol: 0.5, pitch: 0.03, gap: 40 },
  ui_achat:     { files: ['sfx/ui_achat_1.mp3', 'sfx/ui_achat_2.mp3', 'sfx/ui_achat_3.mp3', 'sfx/ui_achat_4.mp3'], vol: 0.7 },
  recrue:       { files: ['sfx/recrue_1.mp3'], vol: 0.8 },
  niveau:       { files: ['sfx/niveau_1.mp3'], vol: 0.8 },
  // Corps à corps
  elan:         { files: ['sfx/elan_1.mp3', 'sfx/elan_2.mp3', 'sfx/elan_3.mp3', 'sfx/elan_4.mp3', 'sfx/elan_5.mp3', 'sfx/elan_6.mp3', 'sfx/elan_7.mp3', 'sfx/elan_8.mp3'], vol: 0.55, pitch: 0.08, gap: 60, voices: 4 },
  coup_leger:   { files: ['sfx/coup_leger_1.mp3', 'sfx/coup_leger_2.mp3', 'sfx/coup_leger_3.mp3', 'sfx/coup_leger_4.mp3', 'sfx/coup_leger_5.mp3'], vol: 0.75, pitch: 0.07, gap: 50, voices: 4 },
  coup_lourd:   { files: ['sfx/coup_lourd_1.mp3', 'sfx/coup_lourd_2.mp3', 'sfx/coup_lourd_3.mp3', 'sfx/coup_lourd_4.mp3', 'sfx/coup_lourd_5.mp3'], vol: 0.9,  pitch: 0.05, gap: 80, voices: 3 },
  lame:         { files: ['sfx/lame_1.mp3', 'sfx/lame_2.mp3', 'sfx/lame_3.mp3', 'sfx/lame_4.mp3', 'sfx/lame_5.mp3', 'sfx/lame_6.mp3'], vol: 0.7,  pitch: 0.06, gap: 60, voices: 4 },
  garde:        { files: ['sfx/garde_1.mp3', 'sfx/garde_2.mp3', 'sfx/garde_3.mp3', 'sfx/garde_4.mp3', 'sfx/garde_5.mp3'], vol: 0.75, pitch: 0.05, gap: 80 },
  esquive:      { files: ['sfx/esquive_1.mp3', 'sfx/esquive_2.mp3', 'sfx/esquive_3.mp3', 'sfx/esquive_4.mp3'], vol: 0.6,  pitch: 0.06, gap: 120 },
  chute:        { files: ['sfx/chute_1.mp3', 'sfx/chute_2.mp3', 'sfx/chute_3.mp3', 'sfx/chute_4.mp3'], vol: 0.85, pitch: 0.04, gap: 200 },
  // Sorts et impacts
  sort:         { files: ['sfx/sort_1.mp3', 'sfx/sort_2.mp3', 'sfx/sort_3.mp3', 'sfx/sort_4.mp3'], vol: 0.6,  pitch: 0.06, gap: 90, voices: 3 },
  ultime:       { files: ['sfx/ultime_1.mp3'], vol: 0.95, gap: 400 },
  tir:          { files: ['sfx/tir_1.mp3', 'sfx/tir_2.mp3', 'sfx/tir_3.mp3', 'sfx/tir_4.mp3', 'sfx/tir_5.mp3'], vol: 0.45, pitch: 0.08, gap: 70, voices: 4 },
  impact_sol:   { files: ['sfx/impact_sol_1.mp3', 'sfx/impact_sol_2.mp3', 'sfx/impact_sol_3.mp3'], vol: 0.8,  pitch: 0.05, gap: 120 },
  soin:         { files: ['sfx/soin_1.mp3', 'sfx/soin_2.mp3'], vol: 0.45, pitch: 0.05, gap: 250 },
  elimination:  { files: ['sfx/elimination_1.mp3', 'sfx/elimination_2.mp3', 'sfx/elimination_3.mp3'], vol: 0.8,  gap: 250 },
  // Mode Combat
  gong:         { files: ['sfx/gong_1.mp3', 'sfx/gong_2.mp3', 'sfx/gong_3.mp3'], vol: 0.9 },
  round_gagne:  { files: ['sfx/round_gagne_1.mp3'], vol: 0.8 },
  round_perdu:  { files: ['sfx/round_perdu_1.mp3'], vol: 0.8 },
};

/** Musique. files : un morceau, ou plusieurs enchaînés ; loop : on reprend
 *  au début de la liste à la fin ; vol : volume propre au morceau. */
export const MUSIC = {
  menu:     { files: ['music/menu.mp3'], vol: 0.55, loop: true },
  // Combat de campagne : trois morceaux enchaînés, pour ne pas entendre
  // la même boucle pendant toute une mission.
  combat:   { files: ['music/combat_manganda.mp3', 'music/combat_battle_a.mp3', 'music/combat_battlegrounds.mp3'], vol: 0.5, loop: true },
  duel:     { files: ['music/duel.mp3'], vol: 0.5,  loop: true },
  boss:     { files: ['music/boss.mp3'], vol: 0.55, loop: true },
  victoire: { files: ['music/victoire.mp3'], vol: 0.6, loop: false },
  defaite:  { files: ['music/defaite.mp3'], vol: 0.6, loop: false },
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
    this.prefs = { music: 0.7, sfx: 0.85, voice: 1, muted: false };
    this.speaking = null;          // { src, done } de la voix en cours
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
    this.voiceGain = this.ctx.createGain();
    this.voiceGain.connect(this.ctx.destination);
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
    if(this.voiceGain) this.voiceGain.gain.value = this.prefs.muted ? 0 : 1.3 * (this.prefs.voice ?? 1);
    if(this.track){ const m = MUSIC[this.track.key]; this.track.el.volume = this._musicVol(m); }
  }
  _musicVol(m){ return this.prefs.muted ? 0 : Math.min(1, (m?.vol ?? 0.5) * this.prefs.music * (this.speaking ? 0.45 : 1)); }

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

  /**
   * Fait parler un personnage : `file` relatif à assets/audio/voix/ (sans
   * .mp3). Une seule voix à la fois : par défaut une nouvelle réplique
   * coupe la précédente ; avec { polite: true } (cris de combat), elle
   * se tait si quelqu'un parle déjà. Renvoie une promesse résolue à la
   * fin de la réplique (ou tout de suite si elle ne peut pas être jouée).
   */
  voice(file, o = {}){
    if(!this.ctx || !file) return Promise.resolve();
    if(this.speaking && o.polite) return Promise.resolve();
    this.stopVoice();
    const path = 'voix/' + file + '.mp3';
    const token = {};
    this._voiceToken = token;
    return Promise.resolve(this._load(path)).then(buf => new Promise(done => {
      if(!buf || this._voiceToken !== token || (this.speaking && o.polite)) return done();
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.voiceGain);
      const end = () => {
        if(this.speaking?.src === src){ this.speaking = null; this._applyVolumes(); }
        done();
      };
      src.onended = end;
      this.speaking = { src, done: end };
      this._applyVolumes();
      src.start();
    }));
  }

  /** Interrompt la réplique en cours. */
  stopVoice(){
    this._voiceToken = null;
    const s = this.speaking;
    if(!s) return;
    this.speaking = null;
    try{ s.src.onended = null; s.src.stop(); }catch(e){}
    s.done();
    this._applyVolumes();
  }

  /** Change de morceau, en fondu enchaîné. null : silence. */
  music(key){
    if(this.track?.key === key) return;
    if(!this.ctx){ this._pendingMusic = key; return; }
    const m = key ? MUSIC[key] : null;
    const old = this.track;
    this.track = null;
    if(old) this._fade(old.el, old.el.volume, 0, () => { old.el.pause(); old.el.removeAttribute('src'); old.el.load(); });
    if(!m || !m.files?.length) return;
    // Playlist : on part d'un morceau au hasard, puis on enchaîne.
    let i = Math.floor(Math.random() * m.files.length);
    const el = new Audio(BASE + m.files[i]);
    el.loop = m.loop && m.files.length === 1;
    if(m.files.length > 1) el.addEventListener('ended', () => {
      if(this.track?.el !== el) return;
      i = (i + 1) % m.files.length;
      if(i === 0 && !m.loop) return;
      el.src = BASE + m.files[i];
      el.play().catch(() => {});
    });
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
