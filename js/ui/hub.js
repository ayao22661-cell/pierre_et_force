// ============================================================
// HUB — écran principal : missions, codex des héros, profil, journal.
// ============================================================
import { CAMPAIGN } from '../data/campaign.js';
import { CHAMPS } from '../data/champions.js';
import { CAST } from '../data/cast.js';
import { portraitFor, champKeyFor } from '../engine/portraits.js';
import { icon, iconSvg, iconForAbility, iconForMode } from './icons.js';
import { DEFIS, defisAvailable } from '../data/defis.js';
import { isDefiDone } from '../game/state.js';
import { isMissionDone, isMissionAvailable, writeSave, spellRank, maxSpellRank, spellPointsLeft, spendSpellPoint } from '../game/state.js';
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

// Chaque acte est illustré par une seule fresque, découpée entre ses
// missions : mises côte à côte, les cartes d'un acte recomposent le
// tableau. C'est l'image qui raconte l'avancée, pas une liste de titres.
const ACT_ART = ['art_battle1', 'art_warrior', 'art_battle2', 'art_divine', 'art_battle3'];
function artForActe(acteIdx){ return `assets/${ACT_ART[acteIdx % ACT_ART.length]}.webp`; }

function missionCard({ num, name, mode, state, art, slice, total, reward }){
  // state : 'done' | 'next' | 'avail' | 'lock'
  const card = el('button', `mcard is-${state} mode-${mode.toLowerCase()}`);
  card.type = 'button';
  card.style.backgroundImage = `url(${art})`;
  card.style.backgroundSize = `${Math.max(1, total) * 100}% auto`;
  card.style.backgroundPosition = `${total > 1 ? (slice / (total - 1)) * 100 : 50}% 30%`;
  card.setAttribute('aria-label', `${num}. ${name} — ${mode}`);
  if(state === 'lock') card.disabled = true;

  card.appendChild(el('span', 'mcard-num', String(num)));
  card.appendChild(el('span', 'mcard-mode', iconSvg(iconForMode(mode))));
  const badge = state === 'done' ? iconSvg('check') : state === 'lock' ? iconSvg('lock') : state === 'next' ? iconSvg('play') : '';
  if(badge) card.appendChild(el('span', 'mcard-state', badge));
  if(reward) card.appendChild(el('span', 'mcard-reward', iconSvg('shell') + reward));
  card.appendChild(el('span', 'mcard-name', name));
  return card;
}

export function buildHub(save, onSelectMission){
  currentSave = save;
  const root = document.getElementById('hub-missions');
  root.innerHTML = '';

  // Deux listes dans l'onglet Missions : la campagne (linéaire) et les
  // défis (rejouables, débloqués à l'avancement).
  const switcher = el('div', 'seg');
  const btnCamp = el('button', 'seg-btn active', 'Campagne');
  const btnDefis = el('button', 'seg-btn', 'Défis');
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
  let nextCard = null;

  CAMPAIGN.forEach((acte, acteIdx) => {
    const done = acte.missions.filter(m => isMissionDone(save, m.id)).length;
    const block = el('section', 'acte');
    const head = el('div', 'acte-head');
    head.appendChild(el('span', 'acte-roman', acte.label.replace('ACTE ', '')));
    head.appendChild(el('span', 'acte-name', acte.titre.toLowerCase()));
    const pips = el('span', 'acte-pips');
    acte.missions.forEach((m, i) => pips.appendChild(el('i', i < done ? 'on' : '')));
    head.appendChild(pips);
    block.appendChild(head);

    const row = el('div', 'mcard-row');
    const art = artForActe(acteIdx);
    acte.missions.forEach((m, i) => {
      const isDone = isMissionDone(save, m.id);
      const avail = isMissionAvailable(save, ids, m.id);
      const mode = modeForMission(m, globalIdx, acte, acteIdx);
      globalIdx++;
      const state = isDone ? 'done' : avail ? 'next' : 'lock';
      const card = missionCard({ num: m.num, name: m.name, mode, state, art, slice: i, total: acte.missions.length });
      if(isDone || avail) card.addEventListener('click', () => onSelectMission(m, mode));
      if(state === 'next' && !nextCard) nextCard = card;
      row.appendChild(card);
    });
    block.appendChild(row);
    listCamp.appendChild(block);
  });

  // Amène la prochaine mission à l'écran (sinon, après 10 actes, il
  // faudrait défiler longtemps pour la retrouver).
  if(nextCard) requestAnimationFrame(() => {
    const panel = document.getElementById('panel-missions');
    const acteEl = nextCard.closest('.acte');
    if(panel && acteEl && acteEl.offsetTop > panel.clientHeight * 0.6) panel.scrollTop = acteEl.offsetTop - 60;
    nextCard.parentElement.scrollLeft = nextCard.offsetLeft - 12;
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
  const head = el('div', 'acte-head');
  head.appendChild(el('span', 'acte-roman', iconSvg('target')));
  head.appendChild(el('span', 'acte-name', 'rejouables, pour gagner des cauris'));
  host.appendChild(head);
  const grid = el('div', 'mcard-grid');
  DEFIS.forEach((d, i) => {
    const avail = open.includes(d);
    const state = avail ? (isDefiDone(save, d.id) ? 'done' : 'next') : 'lock';
    const card = missionCard({ num: d.num, name: d.name, mode: d.mode, state, art: artForActe(i), slice: 1, total: 3, reward: `+${d.cauris}` });
    if(!avail){
      card.appendChild(el('span', 'mcard-req', `${d.req} missions`));
    } else {
      // isDefi : la fin de match saura ne pas l'ajouter à la campagne.
      card.addEventListener('click', () => onSelectMission({ ...d, isDefi: true }, d.mode));
    }
    grid.appendChild(card);
  });
  host.appendChild(grid);
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
  const TAB_ICON = { missions: 'flag', codex: 'role_combattant', profile: 'user', journal: 'scroll', eveil: 'gem', shop: 'bag' };
  document.querySelectorAll('.hub-tab-btn').forEach(btn => {
    if(!btn.querySelector('svg')){
      const label = btn.textContent.trim();
      btn.innerHTML = iconSvg(TAB_ICON[btn.dataset.tab] || 'spark') + `<span>${label.charAt(0) + label.slice(1).toLowerCase()}</span>`;
    }
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
  const panel = document.querySelector(`.hub-panel[data-panel="${tab}"]`);
  if(panel && tab !== 'missions') panel.scrollTop = 0;
}

// ---------------------------------------------------------------------
// Codex — le casting complet du récit (alliés, Empire, figures légendaires)
// ---------------------------------------------------------------------
function renderCodex(){
  const box = document.getElementById('codex-list');
  if(!box) return;
  box.innerHTML = '';
  box.className = 'hero-grid';
  document.getElementById('codex-filters')?.classList.remove('hidden');
  for(const k in CAST){
    const c = CAST[k];
    if(codexFilter !== 'tous' && c.camp !== codexFilter) continue;
    const card = el('button', 'hero-card camp-' + (CAMP_BADGE[c.camp] || 'legend'));
    card.type = 'button';
    const img = el('img', 'hero-card-img');
    img.src = portraitFor(k); img.alt = ''; img.loading = 'lazy';
    card.appendChild(img);
    if(champKeyFor(k)) card.appendChild(el('span', 'hero-card-play', iconSvg('sword'), ));
    card.appendChild(el('span', 'hero-card-name', c.name.split(' ')[0]));
    card.setAttribute('aria-label', `${c.name}, ${c.titre}`);
    card.addEventListener('click', () => openChampDetail(k));
    box.appendChild(card);
  }
}

function openChampDetail(key){
  const c = CAST[key];
  if(!c) return;
  const box = document.getElementById('codex-list');
  if(!box) return;
  document.getElementById('codex-filters')?.classList.add('hidden');
  box.className = 'hero-detail-wrap';
  box.innerHTML = '';
  const accent = CHAMPS[champKeyFor(key)]?.fx || (c.camp === 'ennemi' ? '#d6453f' : c.camp === 'allie' ? '#3f8fd6' : '#c9a24a');

  const detail = el('div', 'hero-detail camp-' + (CAMP_BADGE[c.camp] || 'legend'));
  detail.style.setProperty('--accent', accent);
  const stage = el('div', 'hero-stage');
  const img = el('img', 'hero-stage-img');
  img.src = portraitFor(key); img.alt = c.name;
  stage.appendChild(img);
  const back = el('button', 'icon-btn hero-back', iconSvg('back'));
  back.setAttribute('aria-label', 'Retour aux héros');
  back.addEventListener('click', renderCodex);
  stage.appendChild(back);
  const plate = el('div', 'hero-plate');
  plate.appendChild(el('span', 'camp-tag', CAMP_LABEL[c.camp] || 'LÉGENDE'));
  plate.appendChild(el('div', 'hero-plate-name', c.name));
  plate.appendChild(el('div', 'hero-plate-title', c.titre));
  stage.appendChild(plate);
  detail.appendChild(stage);

  const side = el('div', 'hero-side');
  // Panneau de compétences : uniquement pour les personnages jouables en
  // combat (les autres n'ont qu'une bio — ce sont des figures du récit,
  // sans capacités propres). Voir _renderAbilityPanel plus bas.
  const champKey = champKeyFor(key);
  if(champKey && currentSave) side.appendChild(_renderAbilityPanel(champKey));
  // La bio reste à portée de main, repliée : l'image passe en premier.
  const lore = el('details', 'hero-lore');
  lore.appendChild(el('summary', '', iconSvg('scroll') + '<span>Histoire</span>'));
  lore.appendChild(el('p', '', c.bio));
  if(!champKey) lore.open = true;
  side.appendChild(lore);
  detail.appendChild(side);
  box.appendChild(detail);
  document.getElementById('panel-codex').scrollTop = 0;
}

/**
 * Compétences d'un champion jouable : les 4 sorts (A/Z/E/R) en icônes,
 * comme la barre de sorts du combat. On en touche une pour lire son
 * effet AU RANG ACTUEL (les chiffres suivent le rang investi) et y
 * dépenser un point. Un point de compétence est gagné à chaque victoire
 * jouée avec ce champion (voir game/state.js, awardSpellPoint) —
 * indépendant des points de talent (onglet Éveil, communs à tous).
 */
const SLOT_KEYS = ['A', 'Z', 'E', 'R'];
function _renderAbilityPanel(champKey){
  const d = CHAMPS[champKey];
  const panel = el('div', 'abil');
  const bar = el('div', 'abil-bar');
  const ptsEl = el('span', 'abil-pts', '');
  const info = el('div', 'abil-info');
  panel.appendChild(bar);
  panel.appendChild(info);
  let selected = 0;

  const refresh = () => {
    const pts = spellPointsLeft(currentSave, champKey);
    ptsEl.innerHTML = pts > 0 ? `+${pts}` : '';
    ptsEl.classList.toggle('hidden', pts <= 0);
    bar.innerHTML = '';
    (d.abil || []).forEach((a, slot) => {
      const rank = spellRank(currentSave, champKey, slot);
      const max = maxSpellRank(champKey, slot);
      const b = el('button', 'spell-slot abil-slot' + (a.ult ? ' ult' : '') + (slot === selected ? ' sel' : ''));
      b.type = 'button';
      b.appendChild(el('div', 'spell-ico', iconSvg(iconForAbility(a), 'pf-ico-lg')));
      b.appendChild(el('span', 'key', SLOT_KEYS[slot]));
      const pips = el('div', 'spell-slot-pips');
      for(let r = 0; r < max; r++) pips.appendChild(el('span', 'spell-pip' + (r < rank ? ' filled' : '')));
      b.appendChild(pips);
      b.setAttribute('aria-label', a.name);
      b.addEventListener('click', () => { selected = slot; refresh(); });
      bar.appendChild(b);
    });
    bar.appendChild(ptsEl);

    const a = d.abil[selected];
    const rank = spellRank(currentSave, champKey, selected);
    const max = maxSpellRank(champKey, selected);
    const atRank = (v) => Array.isArray(v) ? (v[rank] ?? v[v.length - 1]) : v;
    info.innerHTML = '';
    const top = el('div', 'abil-top');
    top.appendChild(el('span', 'abil-name', a.name + (a.ult ? ' <em>ultime</em>' : '')));
    const canSpend = rank < max && spellPointsLeft(currentSave, champKey) > 0;
    const up = el('button', 'pf-btn pf-btn-sm abil-up' + (canSpend ? ' pf-btn-brand' : ' disabled'), rank >= max ? 'Max' : iconSvg('plus') + ' Rang');
    if(canSpend) up.addEventListener('click', () => { spendSpellPoint(currentSave, champKey, selected); refresh(); });
    else up.disabled = true;
    top.appendChild(up);
    info.appendChild(top);
    if(a.desc) info.appendChild(el('p', 'abil-desc', a.desc));
    const chips = el('div', 'chips');
    if(a.dmg) chips.appendChild(el('span', 'chip', iconSvg('sword') + Math.round(atRank(a.dmg))));
    if(a.heal) chips.appendChild(el('span', 'chip', iconSvg('heart') + Math.round(atRank(a.heal))));
    if(a.shield) chips.appendChild(el('span', 'chip', iconSvg('shield') + Math.round(atRank(a.shield))));
    if(a.cd) chips.appendChild(el('span', 'chip', iconSvg('pause') + atRank(a.cd) + ' s'));
    if(a.cost) chips.appendChild(el('span', 'chip chip-mana', iconSvg('bolt') + a.cost));
    info.appendChild(chips);
  };
  refresh();
  return panel;
}

// ---------------------------------------------------------------------
// Profil — Tarine en vitrine, statistiques en tuiles, et la campagne
// résumée en 14 pierres qui se remplissent acte après acte.
// ---------------------------------------------------------------------
function renderProfile(save){
  const root = document.getElementById('profile-content');
  if(!root) return;
  root.innerHTML = '';

  const t = CHAMPS.TARINE;
  const cast = CAST.TARINE;

  const hero = el('div', 'profile-hero');
  hero.style.setProperty('--accent', t.fx);
  const img = el('img', 'profile-hero-img');
  img.src = portraitFor('TARINE'); img.alt = t.name;
  hero.appendChild(img);
  const plate = el('div', 'hero-plate');
  const lvl = el('div', 'profile-level', `<b>${save.level}</b><small>niv</small>`);
  plate.appendChild(lvl);
  plate.appendChild(el('div', 'hero-plate-name', t.name));
  plate.appendChild(el('div', 'hero-plate-title', cast?.titre || t.role));
  const xpNeed = xpForLevel(save.level);
  const xpPct = save.level >= ACCOUNT_MAX ? 100 : Math.min(100, Math.round(100 * save.xp / xpNeed));
  const bar = el('div', 'pf-bar pf-bar-xp profile-xp-bar');
  const fill = el('div', 'pf-bar-fill'); fill.style.transform = `scaleX(${xpPct/100})`;
  bar.appendChild(fill);
  bar.title = save.level >= ACCOUNT_MAX ? 'Niveau max' : `${save.xp} / ${xpNeed} XP`;
  plate.appendChild(bar);
  plate.appendChild(el('div', 'profile-xp-txt', save.level >= ACCOUNT_MAX ? 'max' : `${save.xp} / ${xpNeed} xp`));
  hero.appendChild(plate);
  root.appendChild(hero);

  const side = el('div', 'profile-side');
  const ids = allMissionIds();
  const stats = el('div', 'stat-grid');
  stats.appendChild(statTile('heart', Math.round(t.hp), 'PV'));
  stats.appendChild(statTile('sword', Math.round(t.atk), 'Attaque'));
  stats.appendChild(statTile('flag', `${save.missions_done.length}<small>/${ids.length}</small>`, 'Missions'));
  stats.appendChild(statTile('user', save.allies_unlocked.length, 'Alliés'));
  side.appendChild(stats);

  const stones = el('div', 'act-stones');
  CAMPAIGN.forEach(acte => {
    const total = acte.missions.length;
    const done = acte.missions.filter(m => isMissionDone(save, m.id)).length;
    const st = el('div', 'act-stone' + (done === total ? ' full' : done ? ' part' : ''));
    st.style.setProperty('--fill', (done / total).toFixed(3));
    st.title = `${acte.label} — ${acte.titre} : ${done}/${total}`;
    st.appendChild(el('span', '', acte.label.replace('ACTE ', '')));
    stones.appendChild(st);
  });
  side.appendChild(stones);

  const slotBtn = el('button', 'pf-btn pf-btn-ghost pf-btn-sm profile-slot-btn', 'Changer de sauvegarde');
  slotBtn.addEventListener('click', () => window.dispatchEvent(new Event('pf-go-to-slots')));
  side.appendChild(slotBtn);
  root.appendChild(side);
}

function statTile(ico, val, label){
  const tile = el('div', 'stat-tile');
  tile.appendChild(el('span', 'stat-ico', iconSvg(ico)));
  tile.appendChild(el('span', 'stat-val', String(val)));
  tile.appendChild(el('span', 'stat-lbl', label));
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
    root.appendChild(el('div', 'empty-state', iconSvg('scroll') + '<p>Chaque victoire ajoute une page au journal de Tarine.</p>'));
    return;
  }
  entries.forEach(m => {
    const card = el('div', 'pf-panel journal-entry');
    card.appendChild(el('div', 'journal-entry-num', `<b>${m.num}</b> ${m.name}`));
    card.appendChild(el('div', 'journal-entry-text', '« ' + m.journal_victoire + ' »'));
    root.appendChild(card);
  });
}
