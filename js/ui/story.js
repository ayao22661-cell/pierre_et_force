// ============================================================
// RÉCIT — scène de dialogue avant et après chaque mission.
//
// Les textes existent depuis toujours dans la campagne (narr_avant,
// narr_victoire, narr_defaite, narration_debut) ; ils s'affichent ici
// une ligne à la fois. Quand un personnage parle, son portrait animé
// apparaît avec son nom, et on entend SA voix (assets/audio/voix/recit/,
// fichiers intégrés au jeu : aucune connexion nécessaire).
// Toucher l'écran : ligne suivante. « Passer » : tout sauter.
// ============================================================
import { el } from './screens.js';
import { audio } from '../engine/audio.js';
import { RECIT_VOICES, VOICE_NAMES, STORY_CODE } from '../data/voices.js';
import { CAST } from '../data/cast.js';
import { setAnimatedPortrait } from '../engine/portraits.js';

const TYPE_MS = 18;   // vitesse d'écriture (ms par caractère)

/**
 * Joue une suite de lignes. mid/where identifient les répliques doublées.
 * Résout quand le joueur a fini (ou passé). Sans ligne, résout aussitôt.
 */
export function playStory({ lines, mid, where, title, bg }){
  if(!lines?.length) return Promise.resolve();
  return new Promise(resolve => {
    const root = el('div', 'story');
    root.innerHTML = `
      <div class="story-bg"><img alt=""></div>
      <div class="story-top">
        <span class="story-title"></span>
        <button type="button" class="pf-btn pf-btn-ghost pf-btn-sm story-skip">PASSER</button>
      </div>
      <div class="story-cast"><img class="story-portrait" alt=""></div>
      <div class="story-box">
        <div class="story-name"></div>
        <p class="story-text"></p>
        <span class="story-next" aria-hidden="true">▼</span>
      </div>`;
    root.querySelector('.story-bg img').src = bg || 'assets/illus/pf-12.webp';
    root.querySelector('.story-title').textContent = title || '';
    document.getElementById('app')?.appendChild(root) || document.body.appendChild(root);

    const $text = root.querySelector('.story-text');
    const $name = root.querySelector('.story-name');
    const $cast = root.querySelector('.story-cast');
    const $img  = root.querySelector('.story-portrait');
    let i = -1, typing = null, shown = '', lastSpk = null;

    const finish = () => {
      clearInterval(typing);
      audio.stopVoice();
      root.classList.add('out');
      setTimeout(() => root.remove(), 250);
      resolve();
    };

    const show = () => {
      i++;
      if(i >= lines.length) return finish();
      const line = lines[i];
      const id = `${mid}_${STORY_CODE[where]}_${i}`;
      const spk = RECIT_VOICES[id] || null;
      root.classList.toggle('is-dialogue', !!spk);
      root.classList.toggle('is-narration', !spk);
      if(spk){
        $name.textContent = VOICE_NAMES[spk] || CAST[spk]?.name?.split(' ')[0] || '';
        if(spk !== lastSpk){
          $cast.classList.remove('in');
          if(CAST[spk]){ setAnimatedPortrait($img, spk); void $cast.offsetWidth; $cast.classList.add('in'); }
        }
        audio.voice('recit/' + id);
      }else{
        $name.textContent = '';
        $cast.classList.remove('in');
        // Sur la première ligne, on laisse finir le cri de fin de combat.
        if(i > 0) audio.stopVoice();
      }
      lastSpk = spk;
      // Écriture progressive.
      shown = line; clearInterval(typing);
      let n = 0;
      $text.textContent = '';
      typing = setInterval(() => {
        n += 2;
        $text.textContent = line.slice(0, n);
        if(n >= line.length){ clearInterval(typing); typing = null; }
      }, TYPE_MS);
    };

    root.addEventListener('click', (ev) => {
      if(ev.target.closest('.story-skip')) return finish();
      if(typing){ clearInterval(typing); typing = null; $text.textContent = shown; return; }
      audio.sfx('ui_clic', { vol: 0.5 });
      show();
    });
    show();
  });
}
