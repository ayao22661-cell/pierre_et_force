// ============================================================
// HUB — écran principal : missions, codex des héros, profil, journal.
// ============================================================
import { CAMPAIGN } from '../data/campaign.js';
import { CHAMPS } from '../data/champions.js';
import { CAST } from '../data/cast.js';
import { portraitFor } from '../engine/portraits.js';
import { icon, iconSvg } from './icons.js';
import { DEFIS, defisAvailable } from '../data/defis.js';
import { isDefiDone } from '../game/state.js';
import { isMissionDone, isMissionAvailable, writeSave } from '../game/state.js';
import { renderShop, renderEveil, ensureShopSave } from './shop.js';
import { el } from './screens.js';

const CAMP_LABEL = { allie: 'ALLIÉ', ennemi: 'EMPIRE', neutre: 'LÉGENDE' };
const CAMP_BADGE = { allie: 'ally', ennemi: 'enemy', neutre: 'legend' };
const ACCOUNT_MAX = 80;
function xpForLevel(lvl){ return 100 + lvl*40; }

let currentSave = null;
let codexFilter = 'tous';

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
  currentSave = save;
  const root = document.getElementById('hub-missions');
  root.innerHTML = '';

  // Deux listes dans l'onglet Missions : la campagne (linéaire) et les
  // défis (rejouables, débloqués à l'avancement).
  const switcher = el('div', 'mission-switch');
  const btnCamp = el('button', 'mission-switch-btn active', 'CAMPAGNE');
  const btnDefis = el('button', 'mission-switch-btn', 'DÉFIS');
  switcher.appendChild(btnCamp); switcher.appendChild(btnDefis);
  root.appendChild(switcher);
  const listCamp = el('div', 'mission-list');
  const listDefis = el('div', 'mission-list hidden');
  root.appendChild(listCamp); root.appendChild(listDefis);
  const show = (defis) => {
    listDefis.classList.toggle('hidden', !defis);
    listCamp.classList.toggle('hidden', defis);
    btnDefis.classList.toggle('active', defis);
    btnCamp.classList.toggle('active', !defis);
  };
  btnCamp.addEventListener('click', () => show(false));
  btnDefis.addEventListener('click', () => show(true));
  buildDefis(save, onSelectMission, listDefis);
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
    listCamp.appendChild(block);
  });

  const doneCount = save.missions_done.length;
  const progEl = document.getElementById('hub-progress');
  if(progEl) progEl.textContent = `${doneCount} / ${ids.length} missions`;

  ensureShopSave(save);
  _bindTabs();
  renderCodex();
  renderProfile(save);
  renderJournal(save);
  renderEveil(save);
  renderShop(save);
}

/**
 * Liste des défis. Un défi verrouillé reste visible, avec la condition
 * à remplir : le joueur sait ce qui l'attend et pourquoi continuer.
 */
function buildDefis(save, onSelectMission, host){
  const done = save.missions_done.length;
  const open = defisAvailable(done);
  const intro = el('div', 'acte-title', 'DÉFIS — rejouables, pour s\'entraîner et gagner des cauris');
  host.appendChild(intro);
  const row = el('div', 'mission-row');
  DEFIS.forEach(d => {
    const avail = open.includes(d);
    const card = el('div', 'pf-panel mission-card' + (avail ? '' : ' locked'));
    card.appendChild(el('div', 'm-num', String(d.num)));
    card.appendChild(el('div', 'm-name', d.name));
    card.appendChild(el('div', 'm-mode', d.mode));
    const reward = el('div', 'm-reward');
    reward.appendChild(icon('shell'));
    reward.appendChild(el('span', '', ` +${d.cauris}`));
    card.appendChild(reward);
    const status = avail ? (isDefiDone(save, d.id) ? 'REJOUER' : 'DISPONIBLE') : `${d.req} MISSIONS`;
    card.appendChild(el('div', 'm-status ' + (avail ? 'avail' : 'lock'), status));
    if(avail){
      // isDefi : la fin de match saura ne pas l'ajouter à la campagne.
      card.addEventListener('click', () => onSelectMission({ ...d, isDefi: true }, d.mode));
    }
    row.appendChild(card);
  });
  host.appendChild(row);
}

export function updateHubHeader(save){
  const lvl = document.getElementById('hub-level');
  if(lvl) lvl.textContent = save.level;
  // Icône cauri devant le compteur (une seule fois, l'en-tête est réutilisé).
  const caurisBadge = document.getElementById('hub-cauris-badge');
  if(caurisBadge && !caurisBadge.querySelector('svg')) caurisBadge.insertBefore(icon('shell'), caurisBadge.firstChild);
  const cauris = document.getElementById('hub-cauris');
  if(cauris) cauris.textContent = save.cauris.toLocaleString('fr-FR');
}

// ---------------------------------------------------------------------
// Onglets
// ---------------------------------------------------------------------
let tabsBound = false;
function _bindTabs(){
  if(tabsBound) return; // les boutons existent une fois pour toutes dans le DOM statique
  tabsBound = true;
  document.querySelectorAll('.hub-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchHubTab(btn.dataset.tab));
  });
  document.querySelectorAll('.codex-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      codexFilter = chip.dataset.camp;
      document.querySelectorAll('.codex-chip').forEach(c => c.classList.toggle('active', c === chip));
      renderCodex();
    });
  });
}

export function switchHubTab(tab){
  document.querySelectorAll('.hub-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tab));
  document.querySelectorAll('.hub-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const body = document.querySelector('#screen-hub .hub-body');
  if(body) body.scrollTop = 0;
}

// ---------------------------------------------------------------------
// Codex — le casting complet du récit (alliés, Empire, figures légendaires)
// ---------------------------------------------------------------------
function renderCodex(){
  const box = document.getElementById('codex-list');
  if(!box) return;
  box.innerHTML = '';
  for(const k in CAST){
    const c = CAST[k];
    if(codexFilter !== 'tous' && c.camp !== codexFilter) continue;
    const card = el('div', 'champ-card');
    const img = el('img', 'champ-card-img');
    img.src = portraitFor(k);
    img.alt = c.name;
    card.appendChild(img);
    card.appendChild(el('div', 'champ-card-overlay'));
    card.appendChild(el('span', 'champ-card-badge ' + (CAMP_BADGE[c.camp]||'legend'), CAMP_LABEL[c.camp]||'LÉGENDE'));
    const info = el('div', 'champ-card-info');
    info.appendChild(el('div', 'champ-card-name', c.name));
    info.appendChild(el('div', 'champ-card-role', c.role));
    card.appendChild(info);
    card.addEventListener('click', () => openChampDetail(k));
    box.appendChild(card);
  }
}

function openChampDetail(key){
  const c = CAST[key];
  if(!c) return;
  const box = document.getElementById('codex-list');
  if(!box) return;
  const detail = el('div', 'pf-panel champ-detail');
  const img = el('img', 'pf-portrait-img pf-portrait-xl');
  img.src = portraitFor(key);
  img.alt = c.name;
  detail.appendChild(img);
  const info = el('div', '');
  info.appendChild(el('div', 'champ-detail-name', c.name));
  info.appendChild(el('div', 'champ-detail-title', c.titre));
  info.appendChild(el('div', 'champ-detail-bio', c.bio));
  const back = el('button', 'pf-btn pf-btn-ghost pf-btn-sm', '← RETOUR');
  back.style.marginTop = '10px';
  back.addEventListener('click', renderCodex);
  info.appendChild(back);
  detail.appendChild(info);
  box.innerHTML = '';
  box.appendChild(detail);
}

// ---------------------------------------------------------------------
// Profil — progression du compte, statistiques de Tarine, actes complétés
// ---------------------------------------------------------------------
function renderProfile(save){
  const root = document.getElementById('profile-content');
  if(!root) return;
  root.innerHTML = '';

  const t = CHAMPS.TARINE;
  const cast = CAST.TARINE;

  const hero = el('div', 'pf-panel profile-hero');
  const img = el('img', 'pf-portrait-img pf-portrait-xl');
  img.src = portraitFor('TARINE');
  img.style.setProperty('--accent', t.fx);
  hero.appendChild(img);
  const info = el('div', '');
  info.appendChild(el('div', 'profile-name', t.name.toUpperCase()));
  info.appendChild(el('div', 'profile-title', cast?.titre || t.role));
  const xpNeed = xpForLevel(save.level);
  const xpPct = Math.min(100, Math.round(100 * save.xp / xpNeed));
  const bar = el('div', 'pf-bar pf-bar-xp profile-xp-bar');
  const fill = el('div', 'pf-bar-fill'); fill.style.transform = `scaleX(${xpPct/100})`;
  bar.appendChild(fill);
  info.appendChild(bar);
  info.appendChild(el('div', 'pf-label', save.level >= ACCOUNT_MAX ? `Niveau ${save.level} (max)` : `${save.xp} / ${xpNeed} XP — Niveau ${save.level}`));
  hero.appendChild(info);
  root.appendChild(hero);

  const ids = allMissionIds();
  const stats = el('div', 'profile-stats-grid');
  stats.appendChild(statTile('heart', Math.round(t.hp), 'PV de base'));
  stats.appendChild(statTile('sword', Math.round(t.atk), 'Attaque de base'));
  stats.appendChild(statTile('target', `${save.missions_done.length}/${ids.length}`, 'Missions'));
  stats.appendChild(statTile('shield', save.allies_unlocked.length, 'Alliés débloqués'));
  root.appendChild(stats);

  const actes = el('div', 'pf-panel profile-acte-list');
  actes.style.padding = '6px';
  CAMPAIGN.forEach(acte => {
    const total = acte.missions.length;
    const done = acte.missions.filter(m => isMissionDone(save, m.id)).length;
    const row = el('div', 'profile-acte-row');
    row.appendChild(el('span', '', acte.label + ' — ' + acte.titre));
    row.appendChild(el('span', done === total ? 'done' : '', `${done}/${total}`));
    actes.appendChild(row);
  });
  root.appendChild(actes);
}

function statTile(ico, val, label){
  const tile = el('div', 'pf-panel profile-stat-tile');
  tile.appendChild(icon(ico, 'pf-ico-lg'));
  const wrap = el('div', '');
  wrap.appendChild(el('div', 'profile-stat-val', String(val)));
  wrap.appendChild(el('div', 'profile-stat-label', label));
  tile.appendChild(wrap);
  return tile;
}

// ---------------------------------------------------------------------
// Journal — les pensées de Tarine, débloquées mission après mission
// ---------------------------------------------------------------------
function renderJournal(save){
  const root = document.getElementById('journal-entries');
  if(!root) return;
  root.innerHTML = '';
  const entries = [];
  CAMPAIGN.forEach(acte => acte.missions.forEach(m => {
    if(isMissionDone(save, m.id) && m.journal_victoire){
      entries.push(m);
    }
  }));
  if(!entries.length){
    root.appendChild(el('div', 'journal-empty', 'Le journal de Tarine se remplit à mesure que tu avances dans l\'histoire.'));
    return;
  }
  entries.forEach(m => {
    const card = el('div', 'pf-panel journal-entry');
    card.appendChild(el('div', 'journal-entry-num', `${m.num}. ${m.name}`));
    card.appendChild(el('div', 'journal-entry-text', '« ' + m.journal_victoire + ' »'));
    root.appendChild(card);
  });
}
