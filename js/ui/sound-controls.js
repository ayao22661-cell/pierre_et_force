// ============================================================
// RÉGLAGES DU SON — coupure et volumes (musique, voix, bruitages).
// Le même panneau sert au menu pause et à l'onglet Profil ; le bouton
// rapide de l'en-tête du hub ne fait que couper / rétablir. Tout est
// mémorisé (voir engine/audio.js, prefs).
// ============================================================
import { audio } from '../engine/audio.js';
import { iconSvg } from './icons.js';
import { el } from './screens.js';
import { gfxPref, setGfxPref, qualityLabel, QUALITY_LABEL } from '../engine/graphics.js';

// Tous les contrôles affichés, pour qu'ils restent d'accord entre eux.
// Un contrôle retiré de la page (fin de combat) est oublié.
const views = new Map();   // élément -> fonction de mise à jour
const track = (node, paint) => { views.set(node, paint); paint(); };
const refreshAll = () => {
  for(const [node, paint] of views){
    if(node.isConnected){ node.dataset.vu = '1'; paint(); }
    else if(node.dataset.vu) views.delete(node);
    else paint();
  }
};

/** Bouton seul : coupe ou rétablit tout le son. */
export function muteButton(cls = 'icon-btn'){
  const b = el('button', cls + ' sound-mute');
  b.type = 'button';
  const paint = () => {
    const m = audio.prefs.muted;
    b.innerHTML = iconSvg(m ? 'sound_off' : 'sound_on');
    b.setAttribute('aria-label', m ? 'Rétablir le son' : 'Couper le son');
    b.classList.toggle('muted', m);
  };
  b.addEventListener('click', () => { audio.setPrefs({ muted: !audio.prefs.muted }); refreshAll(); });
  track(b, paint);
  return b;
}

/** Panneau complet : coupure + curseurs de volume (musique, voix, bruitages). */
export function soundPanel(){
  const box = el('div', 'sound-panel');
  const head = el('div', 'sound-head');
  head.appendChild(el('span', 'sound-title', 'Son'));
  head.appendChild(muteButton('icon-btn sound-mute-sm'));
  box.appendChild(head);
  for(const [key, label] of [['music', 'Musique'], ['voice', 'Voix'], ['sfx', 'Bruitages']]){
    const row = el('label', 'sound-row');
    row.appendChild(el('span', 'sound-lbl', label));
    const input = el('input', 'sound-range');
    input.type = 'range'; input.min = '0'; input.max = '100'; input.step = '5';
    const val = el('span', 'sound-val');
    const paint = () => {
      const v = Math.round((audio.prefs[key] ?? 1) * 100);
      input.value = String(v);
      input.style.setProperty('--fill', v + '%');
      val.textContent = audio.prefs.muted ? '—' : v + ' %';
      row.classList.toggle('off', audio.prefs.muted);
    };
    input.addEventListener('input', () => {
      // Toucher un curseur rétablit le son : on veut entendre le réglage.
      audio.setPrefs({ [key]: Number(input.value) / 100, muted: false });
      refreshAll();
      if(key === 'sfx') audio.sfx('ui_clic');
    });
    track(row, paint);
    row.appendChild(input); row.appendChild(val);
    box.appendChild(row);
  }
  return box;
}

/**
 * Panneau « Graphismes » : Auto / Basse / Moyenne / Haute. En Auto, le jeu
 * choisit selon l'appareil et baisse d'un cran tout seul s'il rame.
 * Le changement s'applique tout de suite (l'herbe et l'eau au combat suivant).
 */
export function graphicsPanel(){
  const box = el('div', 'sound-panel gfx-panel');
  const head = el('div', 'sound-head');
  head.appendChild(el('span', 'sound-title', 'Graphismes'));
  const now = el('span', 'gfx-now');
  head.appendChild(now);
  box.appendChild(head);
  const seg = el('div', 'gfx-seg');
  const btns = {};
  const paint = () => {
    const p = gfxPref();
    for(const k in btns) btns[k].classList.toggle('on', k === p);
    now.textContent = qualityLabel();
  };
  for(const k of ['auto', 'basse', 'moyenne', 'haute']){
    const b = el('button', 'gfx-opt', QUALITY_LABEL[k]);
    b.type = 'button';
    b.addEventListener('click', () => { setGfxPref(k); audio.sfx('ui_clic'); paint(); });
    btns[k] = b; seg.appendChild(b);
  }
  box.appendChild(seg);
  box.appendChild(el('p', 'gfx-hint', 'Haute : ombres fines, occlusion et halo complet. Basse : pour les téléphones modestes.'));
  paint();
  return box;
}
