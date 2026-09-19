// ============================================================
// DEPLOY — choix du champion et des alliés avant de lancer un combat.
// ============================================================
import { CHAMPS } from '../data/champions.js';
import { el } from './screens.js';

const MODE_MAP = { 'SIÈGE': 'siege', 'ARÈNE': 'arena', 'DÉFENSE': 'siege', 'BOSS': 'siege' };

export function renderDeploy(mission, modeLabel, save, onLaunch){
  document.getElementById('deploy-mission-name').textContent = `${mission.num}. ${mission.name}`;
  document.getElementById('deploy-mode').textContent = modeLabel;
  document.getElementById('deploy-brief').textContent = mission.brief || mission.desc || '';

  const state = { champ: save.lastChamp && CHAMPS[save.lastChamp] ? save.lastChamp : 'TARINE', allies: [] };

  const pool = Array.from(new Set([...(mission.allies_dispo||[]), ...(mission.allies_requis||[])]))
    .filter(k => save.allies_unlocked.includes(k) && CHAMPS[k]);

  (mission.allies_requis||[]).forEach(k => { if(pool.includes(k) && !state.allies.includes(k)) state.allies.push(k); });
  state.allies = state.allies.slice(0, 2);

  const grid = document.getElementById('deploy-allies-grid');
  grid.innerHTML = '';

  function renderChips(){
    grid.innerHTML = '';
    pool.forEach(k => {
      const c = CHAMPS[k];
      const selected = state.allies.includes(k);
      const chip = el('div', 'pf-panel ally-chip' + (selected ? ' selected' : ''));
      const portrait = el('div', 'pf-portrait pf-portrait-sm', initials(c.name));
      portrait.style.setProperty('--accent', c.fx);
      portrait.style.color = c.fx;
      chip.appendChild(portrait);
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
    });
  };
}

function initials(name){
  return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
}
