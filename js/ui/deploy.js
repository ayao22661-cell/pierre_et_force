// ============================================================
// DEPLOY — choix du champion et des alliés avant de lancer un combat.
// Le personnage joueur ET les alliés sont sélectionnables via des
// cartes-portraits 3D cliquables (voir engine/character-portrait-3d.js).
// ============================================================
import { CHAMPS, PLAYABLE } from '../data/champions.js';
import { portraitFor, castEntry } from '../engine/portraits.js';
import { el } from './screens.js';

const MODE_MAP = { 'SIÈGE': 'siege', 'ARÈNE': 'arena', 'DÉFENSE': 'defense', 'BOSS': 'boss' };

export function renderDeploy(mission, modeLabel, save, onLaunch){
  document.getElementById('deploy-mission-name').textContent = `${mission.num}. ${mission.name}`;
  document.getElementById('deploy-mode').textContent = modeLabel;
  document.getElementById('deploy-brief').textContent = mission.brief || mission.desc || '';

  const state = { champ: save.lastChamp && CHAMPS[save.lastChamp] ? save.lastChamp : 'TARINE', allies: [] };

  // Champions jouables par le joueur lui-même : tous les débloqués.
  const playerPool = PLAYABLE.filter(k => save.allies_unlocked.includes(k) || k === 'TARINE');

  // Alliés proposables (distincts du champion joueur courant).
  const allyPool = Array.from(new Set([...(mission.allies_dispo||[]), ...(mission.allies_requis||[])]))
    .filter(k => save.allies_unlocked.includes(k) && CHAMPS[k]);

  (mission.allies_requis||[]).forEach(k => { if(allyPool.includes(k) && k !== state.champ && !state.allies.includes(k)) state.allies.push(k); });
  state.allies = state.allies.slice(0, 2);

  const playerGrid = document.getElementById('deploy-player');
  const allyGrid = document.getElementById('deploy-allies-grid');
  const preview = document.getElementById('deploy-team-preview');

  function updatePreview(){
    const names = [state.champ, ...state.allies].map(k => CHAMPS[k].name);
    preview.textContent = 'Équipe : ' + names.join(', ');
  }

  function championChip(k, selected, onClick, size){
    const c = CHAMPS[k];
    const entry = castEntry(k);
    const chip = el('div', 'pf-panel ally-chip' + (selected ? ' selected' : ''));
    const img = el('img', 'pf-portrait-img ' + (size || 'pf-portrait-sm'));
    img.src = portraitFor(k);
    img.alt = c.name;
    img.style.setProperty('--accent', c.fx);
    chip.appendChild(img);
    const info = el('div', '');
    info.appendChild(el('div', 'ally-chip-name', c.name));
    info.appendChild(el('div', 'ally-chip-role', entry?.titre || c.role));
    chip.appendChild(info);
    chip.addEventListener('click', onClick);
    return chip;
  }

  // ── Sélecteur du personnage joueur (cliquable, remplace le portrait figé) ──
  function renderPlayerGrid(){
    playerGrid.innerHTML = '';
    playerPool.forEach(k => {
      const chip = championChip(k, k === state.champ, () => {
        if(k === state.champ) return;
        state.champ = k;
        // Le champion choisi comme joueur ne peut plus être un allié en double.
        const idx = state.allies.indexOf(k);
        if(idx >= 0) state.allies.splice(idx, 1);
        renderPlayerGrid();
        renderAllyGrid();
        updatePreview();
      }, 'pf-portrait-lg');
      playerGrid.appendChild(chip);
    });
  }

  // ── Sélecteur des alliés (jusqu'à 2) ──
  function renderAllyGrid(){
    allyGrid.innerHTML = '';
    allyPool.filter(k => k !== state.champ).forEach(k => {
      const chip = championChip(k, state.allies.includes(k), () => {
        const idx = state.allies.indexOf(k);
        if(idx >= 0) state.allies.splice(idx, 1);
        else if(state.allies.length < 2) state.allies.push(k);
        renderAllyGrid();
        updatePreview();
      });
      allyGrid.appendChild(chip);
    });
  }

  renderPlayerGrid();
  renderAllyGrid();
  updatePreview();

  document.getElementById('btn-launch').onclick = () => {
    onLaunch({
      mode: MODE_MAP[modeLabel] || 'siege',
      champ: state.champ,
      allies: state.allies.slice(),
      foes: mission.ennemis || ['BABA'],
      // Équilibrage : avant, foeCount = 1 + ennemis_extra (jusqu'à 13 champions d'un coup,
      // 3 dès la mission 1) avec 85 % des stats de base. Désormais 1 à 3 champions,
      // et des stats qui montent doucement avec la mission (≈ 40 % au début, 80 % à la fin).
      foeCount: Math.min(3, 1 + Math.floor((mission.ennemis_extra || 0) / 3)),
      // Les défis ont un numéro textuel (« D3 ») : on prend leur propre
      // difficulté, sinon la difficulté suit le numéro de mission.
      foeMult: mission.foeMult != null
        ? mission.foeMult
        : Math.min(0.8, 0.4 + (Number(mission.num) || 1) * 0.008),
      save,                  // transmis à Sim pour les bonus objets/talents
    });
  };
}
