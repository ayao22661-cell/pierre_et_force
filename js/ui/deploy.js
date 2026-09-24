// ============================================================
// DEPLOY — choix du champion et des alliés avant de lancer un combat.
// Le personnage joueur ET les alliés sont sélectionnables via des
// cartes-portraits 3D cliquables (voir engine/character-portrait-3d.js).
// ============================================================
import { CHAMPS, PLAYABLE } from '../data/champions.js';
import { portraitFor, castEntry } from '../engine/portraits.js';
import { icon, iconSvg, iconForRole } from './icons.js';
import { el } from './screens.js';
import { opponentsFaced, DUELS } from '../data/combat.js';

const MODE_MAP = { 'SIÈGE': 'siege', 'ARÈNE': 'arena', 'DÉFENSE': 'defense', 'BOSS': 'boss', 'COMBAT': 'duel' };

export function renderDeploy(mission, modeLabel, save, onLaunch){
  document.getElementById('deploy-mission-name').textContent = `${mission.num}. ${mission.name}`;
  document.getElementById('deploy-mode').textContent = modeLabel;
  const brief = document.getElementById('deploy-brief');
  brief.textContent = mission.brief || mission.desc || '';
  // Brief replié sur 3 lignes : un toucher l'ouvre en entier.
  brief.classList.remove('open');
  brief.onclick = () => brief.classList.toggle('open');

  const state = { champ: save.lastChamp && CHAMPS[save.lastChamp] ? save.lastChamp : 'TARINE', allies: [] };
  // Combat libre : la rangée des alliés devient celle de l'adversaire.
  const free = !!mission.free;
  const foePool = free ? opponentsFaced(save) : [];
  if(free) state.foe = foePool.includes(save.lastFoe) ? save.lastFoe : foePool[0];
  document.getElementById('deploy-allies-title').textContent = free ? 'TON ADVERSAIRE' : 'ALLIÉ (1 max)';
  // Combat libre : cartes animées façon sélection de champion (voir
  // components.css, « .deploy-free »). `picked` marque la carte qu'on
  // vient de verrouiller, `entered` évite de rejouer l'apparition en
  // cascade à chaque clic.
  document.getElementById('screen-deploy').classList.toggle('deploy-free', free);
  let picked = null;
  const entered = new Set();
  const animate = (tile, grid, k, i) => {
    if(!free) return;
    tile.style.setProperty('--i', i);
    if(!entered.has(grid)) tile.classList.add('enter');
    if(grid + ':' + k === picked) tile.classList.add('lock');
  };

  // Champions jouables par le joueur lui-même : tous les débloqués.
  const playerPool = PLAYABLE.filter(k => save.allies_unlocked.includes(k) || k === 'TARINE');

  // Alliés proposables (distincts du champion joueur courant).
  const allyPool = Array.from(new Set([...(mission.allies_dispo||[]), ...(mission.allies_requis||[])]))
    .filter(k => save.allies_unlocked.includes(k) && CHAMPS[k]);

  (mission.allies_requis||[]).forEach(k => { if(allyPool.includes(k) && k !== state.champ && !state.allies.includes(k)) state.allies.push(k); });
  // Jusqu'à deux coéquipiers sélectionnables.
  state.allies = state.allies.slice(0, 2);

  const playerGrid = document.getElementById('deploy-player');
  const allyGrid = document.getElementById('deploy-allies-grid');
  const preview = document.getElementById('deploy-team-preview');

  function updatePreview(){
    if(free){ preview.textContent = `${CHAMPS[state.champ].name} contre ${CHAMPS[state.foe].name}`; return; }
    const names = [state.champ, ...state.allies].map(k => CHAMPS[k].name);
    preview.textContent = 'Équipe : ' + names.join(', ');
  }

  // Tuile de sélection façon « champion select » MOBA : portrait carré,
  // badge de rôle, halo dans la couleur du personnage quand sélectionné.
  function championTile(k, selected, onClick){
    const c = CHAMPS[k];
    const entry = castEntry(k);
    const tile = el('div', 'champ-tile' + (selected ? ' selected' : ''));
    tile.style.setProperty('--accent', c.fx);
    const img = el('img', 'champ-tile-img');
    img.src = portraitFor(k);
    img.alt = c.name;
    tile.appendChild(img);
    tile.appendChild(el('div', 'champ-tile-overlay'));
    const role = el('div', 'champ-tile-role', iconSvg(iconForRole(c.role), 'pf-ico-sm'));
    role.title = c.role;
    tile.appendChild(role);
    tile.appendChild(el('div', 'champ-tile-name', c.name.split(' ')[0]));
    tile.addEventListener('click', onClick);
    return tile;
  }

  // ── Bandeau du champion actuellement sélectionné (grand portrait) ──
  // renderDeploy() est appelé deux fois par mission (voir main.js) : on
  // réutilise le bandeau déjà en place plutôt que d'en empiler un second.
  let heroBanner = playerGrid.parentElement.querySelector('.hero-banner');
  if(!heroBanner){
    heroBanner = el('div', 'hero-banner');
    playerGrid.parentElement.insertBefore(heroBanner, playerGrid);
  }

  function renderHeroBanner(){
    const c = CHAMPS[state.champ];
    const entry = castEntry(state.champ);
    heroBanner.innerHTML = '';
    heroBanner.style.setProperty('--accent', c.fx);
    const img = el('img', 'hero-banner-img');
    img.src = portraitFor(state.champ);
    img.alt = c.name;
    heroBanner.appendChild(img);
    const info = el('div', 'hero-banner-info');
    const roleRow = el('div', 'hero-banner-role');
    roleRow.appendChild(icon(iconForRole(c.role), 'pf-ico-sm'));
    roleRow.appendChild(el('span', '', c.role.toUpperCase()));
    info.appendChild(roleRow);
    info.appendChild(el('div', 'hero-banner-name', c.name));
    info.appendChild(el('div', 'hero-banner-title', entry?.titre || ''));
    heroBanner.appendChild(info);
  }

  // ── Sélecteur du personnage joueur : rangée de tuiles ──
  function renderPlayerGrid(){
    playerGrid.innerHTML = '';
    playerPool.forEach((k, i) => {
      const tile = championTile(k, k === state.champ, () => {
        if(k === state.champ) return;
        state.champ = k;
        picked = 'player:' + k;
        // Le champion choisi comme joueur ne peut plus être un allié en double.
        const idx = state.allies.indexOf(k);
        if(idx >= 0) state.allies.splice(idx, 1);
        renderHeroBanner();
        renderPlayerGrid();
        renderAllyGrid();
        updatePreview();
      });
      animate(tile, 'player', k, i);
      playerGrid.appendChild(tile);
    });
    entered.add('player');
  }

  // ── Sélecteur des alliés (jusqu'à 2) : rangée de tuiles ──
  function renderAllyGrid(){
    allyGrid.innerHTML = '';
    if(free){
      foePool.forEach((k, i) => {
        const tile = championTile(k, k === state.foe, () => {
          if(k === state.foe) return;
          state.foe = k;
          picked = 'foe:' + k;
          renderAllyGrid();
          updatePreview();
        });
        tile.classList.add('foe');
        animate(tile, 'foe', k, i);
        allyGrid.appendChild(tile);
      });
      entered.add('foe');
      return;
    }
    allyPool.filter(k => k !== state.champ).forEach(k => {
      const tile = championTile(k, state.allies.includes(k), () => {
        const idx = state.allies.indexOf(k);
        if(idx >= 0) state.allies.splice(idx, 1);
        else if(state.allies.length < 2) state.allies.push(k);
        renderAllyGrid();
        updatePreview();
      });
      allyGrid.appendChild(tile);
    });
  }

  renderHeroBanner();
  renderPlayerGrid();
  renderAllyGrid();
  updatePreview();

  document.getElementById('btn-launch').onclick = () => {
    // Équilibrage : avant, foeCount = 1 + ennemis_extra (jusqu'à 13 champions d'un coup,
    // 3 dès la mission 1) avec 85 % des stats de base. Désormais 1 à 3 champions,
    // et des stats qui montent doucement avec la mission (≈ 40 % au début, 80 % à la fin).
    const foeCount = Math.min(3, 1 + Math.floor((mission.ennemis_extra || 0) / 3));
    // Combat libre : le décor est celui du duel de l'adversaire choisi.
    let missionId = mission.id;
    if(free){
      save.lastFoe = state.foe;
      missionId = DUELS.find(d => d.opponent === state.foe)?.id || 'c_baba';
    }
    onLaunch({
      mode: MODE_MAP[modeLabel] || 'siege',
      // Identifiant de la mission : il choisit le décor (engine/scene/scene-map.js)
      // et la graine du terrain. Sans lui, toutes les missions se déroulaient
      // dans le même lieu par défaut.
      missionId,
      champ: state.champ,
      allies: free ? [] : state.allies.slice(),
      foes: free ? [state.foe] : (mission.ennemis || ['BABA']),
      foeCount,
      // Arène, sans respawn : l'objectif de victoire (killGoal) ne peut plus
      // dépasser le nombre de champions posés au départ (foeCount), sinon la
      // mission devient infaisable dès qu'ils sont tous morts une fois. Le
      // mode devient donc un duel simple (1 à 3 éliminations selon la
      // mission) plutôt qu'un gantelet à 8 victoires. Choix validé avec Yao
      // (voir passation) — les autres pistes (critère de victoire différent,
      // plus de champions au départ) ont été écartées.
      killGoal: foeCount,
      // Les défis ont un numéro textuel (« D3 ») : on prend leur propre
      // difficulté, sinon la difficulté suit le numéro de mission.
      //
      // Troisième passe d'équilibrage. La deuxième (plancher 1,3, plafond
      // 5,0) corrigeait bien l'alpha strike d'ouverture, mais combinée à
      // la limite à 1 seul allié (moins de PV/dégâts en jeu côté joueur)
      // rendait la mission 1 quasi invivable : joueur à 74 % de PV perdus
      // en 20 s de jeu actif, ennemi encore à 36 % de vie. Nouveau
      // plancher (1,05) et plafond réduit en proportion (4,0) : la salve
      // d'ouverture (~450 dégâts bruts) laisse l'ennemi à environ 23 % de
      // ses PV — un vrai duel de quelques secondes, gagnable sans jeu
      // parfait, plutôt qu'un mur ou un one-shot. Voir sim.js pour le
      // découplage PV/dégâts qui protège le joueur de la hausse de PV
      // ennemis côté dégâts subis.
      // Progression de la difficulté réétalée sur 100 missions (elle
      // atteignait son plafond dès la 50e depuis l'ajout de la seconde
      // moitié de campagne).
      foeMult: mission.foeMult != null
        ? mission.foeMult
        : Math.min(2.9, 1.0 + (((Number(mission.num) || 1) - 1) * 0.0192)),
      roundsToWin: mission.roundsToWin,
      roundTime: mission.roundTime,
      save,                  // transmis à Sim pour les bonus objets/talents
    });
  };
}
