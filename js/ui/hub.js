// ============================================================
// HUB — écran principal : liste des actes et missions.
// ============================================================
import { CAMPAIGN } from '../data/campaign.js';
import { isMissionDone, isMissionAvailable, writeSave } from '../game/state.js';
import { el } from './screens.js';

function allMissionIds(){
  const ids = [];
  CAMPAIGN.forEach(a => a.missions.forEach(m => ids.push(m.id)));
  return ids;
}

function modeForMission(m, idx, acte, acteIdx){
  const isLast = acte.missions[acte.missions.length-1].id === m.id;
  if(isLast) return 'BOSS';
  if(idx === 0) return 'SIÈGE';
  return ['SIÈGE','ARÈNE','SIÈGE','DÉFENSE'][idx % 4];
}

export function buildHub(save, onSelectMission){
  const root = document.getElementById('hub-missions');
  root.innerHTML = '';
  const ids = allMissionIds();
  let globalIdx = 0;

  CAMPAIGN.forEach((acte, acteIdx) => {
    const block = el('div', 'acte-block');
    block.appendChild(el('div', 'acte-title', `${acte.label} — ${acte.titre}`));
    const row = el('div', 'mission-row');

    acte.missions.forEach((m, i) => {
      const done = isMissionDone(save, m.id);
      const avail = isMissionAvailable(save, ids, m.id);
      const mode = modeForMission(m, globalIdx, acte, acteIdx);
      globalIdx++;

      const card = el('div', 'pf-panel mission-card' + (done ? '' : avail ? '' : ' locked'));
      card.appendChild(el('div', 'm-num', String(m.num)));
      card.appendChild(el('div', 'm-name', m.name));
      card.appendChild(el('div', 'm-mode', mode));
      const status = done ? 'REJOUER' : avail ? 'DISPONIBLE' : 'VERROUILLÉE';
      const statusCls = done ? 'done' : avail ? 'avail' : 'lock';
      card.appendChild(el('div', 'm-status ' + statusCls, status));

      if(done || avail){
        card.addEventListener('click', () => onSelectMission(m, mode));
      }
      row.appendChild(card);
    });

    block.appendChild(row);
    root.appendChild(block);
  });

  const doneCount = save.missions_done.length;
  const progEl = document.getElementById('hub-progress');
  if(progEl) progEl.textContent = `${doneCount} / ${ids.length} missions`;
}

export function updateHubHeader(save){
  const lvl = document.getElementById('hub-level');
  if(lvl) lvl.textContent = save.level;
  const cauris = document.getElementById('hub-cauris');
  if(cauris) cauris.textContent = save.cauris.toLocaleString('fr-FR');
}
