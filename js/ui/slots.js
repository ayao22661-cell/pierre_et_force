// ============================================================
// SLOTS — écran de sélection d'emplacement de sauvegarde (3 profils
// indépendants). Affiché entre l'écran-titre et le Hub, et accessible
// depuis l'onglet Profil ("Changer de sauvegarde") pour basculer sans
// recharger la page.
// ============================================================
import { CHAMPS } from '../data/champions.js';
import { MISSION_COUNT } from '../data/campaign.js';
import { listSlots, setActiveSlot, deleteSlot, getActiveSlot } from '../game/state.js';
import { icon } from './icons.js';
import { el } from './screens.js';

/**
 * @param {(slot:number) => void} onPick - appelé quand un emplacement est
 *   choisi (nouvelle partie ou reprise) ; le slot est déjà actif à cet instant.
 */
export function renderSlots(onPick){
  const box = document.getElementById('slots-list');
  if(!box) return;
  box.innerHTML = '';
  const current = getActiveSlot();

  listSlots().forEach(info => {
    const card = el('div', 'pf-panel slot-card' + (info.slot === current ? ' current' : ''));

    const left = el('div', 'slot-card-left');
    left.appendChild(icon('shield', 'pf-ico-lg'));
    const label = el('div', '');
    label.appendChild(el('div', 'slot-card-title', `EMPLACEMENT ${info.slot}`));
    if(info.exists){
      const champName = CHAMPS[info.lastChamp]?.name || 'Tarine Keïta';
      label.appendChild(el('div', 'slot-card-sub',
        `Niveau ${info.level} · ${info.missionsDone}/${MISSION_COUNT} missions · ${champName}`));
    } else {
      label.appendChild(el('div', 'slot-card-sub slot-card-empty', 'Emplacement vide'));
    }
    left.appendChild(label);
    card.appendChild(left);

    const right = el('div', 'slot-card-right');
    const go = el('button', 'pf-btn pf-btn-brand pf-btn-sm', info.exists ? 'CONTINUER' : 'NOUVELLE PARTIE');
    go.addEventListener('click', () => {
      setActiveSlot(info.slot);
      onPick(info.slot);
    });
    right.appendChild(go);
    if(info.exists){
      const del = el('button', 'pf-btn pf-btn-ghost pf-btn-sm slot-card-del', '✕');
      del.title = 'Supprimer cette sauvegarde';
      del.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if(del.dataset.confirm === '1'){
          deleteSlot(info.slot);
          renderSlots(onPick);
        } else {
          del.dataset.confirm = '1';
          del.textContent = 'SÛR ?';
          del.classList.add('confirm');
          setTimeout(() => { del.dataset.confirm = '0'; del.textContent = '✕'; del.classList.remove('confirm'); }, 2500);
        }
      });
      right.appendChild(del);
    }
    card.appendChild(right);
    box.appendChild(card);
  });
}
