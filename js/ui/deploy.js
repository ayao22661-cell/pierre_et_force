// ============================================================
// DEPLOY — choix du champion et des alliés avant de lancer un combat.
// ============================================================
import { CHAMPS } from '../data/champions.js';
import { portraitFor, castEntry } from '../engine/portraits.js';
import { el } from './screens.js';

const MODE_MAP = { 'SIÈGE': 'siege', 'ARÈNE': 'arena', 'DÉFENSE': 'defense', 'BOSS': 'boss' };

export function renderDeploy(mission, modeLabel, save, onLaunch){
  document.getElementById('deploy-mission-name').textContent = `${mission.num}. ${mission.name}`;
  document.getElementById('deploy-mode').textContent = modeLabel;
  document.getElementById('deploy-brief').textContent = mission.brief || mission.desc || '';

  const state = { champ: save.lastChamp && CHAMPS[save.lastChamp] ? save.lastChamp : 'TARINE', allies: [] };

  const pool = Array.from(new Set([...(mission.allies_dispo||[]), ...(mission.allies_requis||[])]))
    .filter(k => save.allies_unlocked.includes(k) && CHAMPS[k]);

  (mission.allies_requis||[]).forEach(k => { if(pool.includes(k) && !state.allies.includes(k)) state.allies.push(k); });
  state.allies = state.allies.slice(0, 2);

  // Portrait du personnage joueur, mis en avant au-dessus du choix d'alliés.
  const playerBox = document.getElementById('deploy-player');
  if(playerBox){
    playerBox.innerHTML = '';
    const c = CHAMPS[state.champ];
    const entry = castEntry(state.champ);
    const wrap = el('div', 'pf-panel deploy-player-card');
    const img = el('img', 'pf-portrait-img pf-portrait-lg');
    img.src = portraitFor(state.champ);
    img.alt = c.name;
    img.style.setProperty('--accent', c.fx);
    wrap.appendChild(img);
    const info = el('div', '');
    info.appendChild(el('div', 'deploy-player-name', c.name));
    info.appendChild(el('div', 'deploy-player-title', entry?.titre || c.role));
    wrap.appendChild(info);
    playerBox.appendChild(wrap);
  }

  const grid = document.getElementById('deploy-allies-grid');
  grid.innerHTML = '';

  function renderChips(){
    grid.innerHTML = '';
    pool.forEach(k => {
      const c = CHAMPS[k];
      const selected = state.allies.includes(k);
      const chip = el('div', 'pf-panel ally-chip' + (selected ? ' selected' : ''));
      const img = el('img', 'pf-portrait-img pf-portrait-sm');
      img.src = portraitFor(k);
      img.alt = c.name;
      img.style.setProperty('--accent', c.fx);
      chip.appendChild(img);
      const info = el('div', '');
      info.appendChild(el('div', 'ally-chip-name', c.name));
      info.appendChild(el('div', 'ally-chip-role', c.role));
      chip.appendChild(info);
      chip.addEventListener('click', () => {
        if(k === state.champ) return;
        const idx = state.allies.indexOf(k);
        if(idx >= 0) state.allies.splice(idx, 1);
        else if(state.allies.length < 2) state.allies.push(k);
        renderChips();
      });
      grid.appendChild(chip);
    });
  }
  renderChips();

  const preview = document.getElementById('deploy-team-preview');
  function updatePreview(){
    const names = [state.champ, ...state.allies].map(k => CHAMPS[k].name);
    preview.textContent = 'Équipe : ' + names.join(', ');
  }
  updatePreview();
  const origRender = renderChips;
  renderChips = function(){ origRender(); updatePreview(); };
  renderChips();

  document.getElementById('btn-launch').onclick = () => {
    onLaunch({
      mode: MODE_MAP[modeLabel] || 'siege',
      champ: state.champ,
      allies: state.allies.slice(),
      foes: mission.ennemis || ['BABA'],
      foeCount: 1 + (mission.ennemis_extra || 1),
      foeMult: 0.85,
      save,                  // transmis à Sim pour les bonus objets/talents
    });
  };
}
