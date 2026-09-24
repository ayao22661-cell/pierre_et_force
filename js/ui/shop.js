// ============================================================
// SHOP — onglet Éveil (talents) et boutique d'objets du hub.
// Les talents utilisent les TALENT_TREES de items.js.
// Les objets utilisent ITEMS de items.js.
// La sauvegarde garde : save.talents (obj id→rang) et save.items (array id).
// ============================================================
import { TALENT_TREES, ITEMS } from '../data/items.js';
import { iconSvg, icon, iconForStats } from './icons.js';
import { writeSave } from '../game/state.js';
import { el } from './screens.js';

// ── Assure les champs nécessaires dans la sauvegarde ──────────────────────────
export function ensureShopSave(save) {
  if (!save.talents)   save.talents   = {};   // { nodeId: rang }
  if (!save.items)     save.items     = [];   // [itemId, ...]
  if (!save.talPts)    save.talPts    = 0;    // points de talent dépensables
  // On donne 1 point de talent par niveau au-delà de 1
  const earned = Math.max(0, (save.level - 1) * 1);
  const spent  = Object.values(save.talents).reduce((a, b) => a + b, 0);
  save.talPtsTotal = earned;
  save.talPtsLeft  = Math.max(0, earned - spent);
  return save;
}

// ── Onglet Boutique ───────────────────────────────────────────────────────────
// Chaque objet est montré par sa vignette 3D (assets/items/<id>.webp,
// rendue par Babylon — voir engine/item-renders.js et tools/gen-items.html).
// Le texte se limite au nom, aux statistiques en pastilles et au prix,
// qui sert lui-même de bouton d'achat.
const TIER_COLOR = { 1: '#d08a4e', 2: '#b9c3d4', 3: '#f0c35a' };
const TIER_NAME = { 1: 'Bronze', 2: 'Argent', 3: 'Or' };
const STAT_ICON = { atk: 'sword', hp: 'heart', arm: 'shield', mana: 'bolt', as: 'target', ms: 'boot', ah: 'spark', crit: 'target', ls: 'drop', regen: 'leaf', pen: 'sword', thorns: 'shield' };
const ITEM_BY_ID = Object.fromEntries(ITEMS.map(it => [it.id, it]));
export const itemImage = (id) => `assets/items/${id}.webp`;

let shopTier = 1;
let shopPick = null;

function statChips(st){
  const box = el('div', 'chips');
  Object.entries(st).forEach(([k, v]) => {
    const val = typeof v === 'number' && v < 1 && v > -1 ? Math.round(v * 100) + '%' : v;
    // Valeur ET libellé : une icône seule ne disait pas de quoi il s'agit.
    const c = el('span', 'chip', iconSvg(STAT_ICON[k] || 'spark') + `${v > 0 ? '+' : ''}${val}<small>${STAT_LABEL[k] || k}</small>`);
    box.appendChild(c);
  });
  return box;
}

export function renderShop(save) {
  const root = document.getElementById('shop-content');
  if (!root) return;
  root.innerHTML = '';
  ensureShopSave(save);

  const head = el('div', 'shop-top');
  const seg = el('div', 'seg');
  [1, 2, 3].forEach(t => {
    const b = el('button', 'seg-btn' + (t === shopTier ? ' active' : ''), `<i class="tier-dot" style="--tier-color:${TIER_COLOR[t]}"></i>${TIER_NAME[t]}`);
    b.addEventListener('click', () => { shopTier = t; shopPick = null; renderShop(save); });
    seg.appendChild(b);
  });
  head.appendChild(seg);
  head.appendChild(el('span', 'pf-badge pf-badge-gold shop-purse', `${iconSvg('shell')} <span id="shop-cauris">${save.cauris.toLocaleString('fr-FR')}</span>`));
  root.appendChild(head);

  const list = ITEMS.filter(it => it.tier === shopTier);
  if(!shopPick || !list.find(i => i.id === shopPick)) shopPick = list[0]?.id;
  const pick = ITEM_BY_ID[shopPick];

  // Vitrine : l'objet sélectionné en grand, façon boutique de MOBA.
  const showcase = el('div', 'shop-show');
  showcase.style.setProperty('--tier-color', TIER_COLOR[pick.tier]);
  const big = el('img', 'shop-show-img');
  big.src = itemImage(pick.id); big.alt = pick.name;
  showcase.appendChild(big);
  const info = el('div', 'shop-show-info');
  info.appendChild(el('span', 'shop-show-tier', TIER_NAME[pick.tier]));
  info.appendChild(el('div', 'shop-show-name', pick.name));
  info.appendChild(statChips(pick.st));
  if (pick.from) {
    const recipe = el('div', 'recipe');
    pick.from.forEach((id, i) => {
      if(i) recipe.appendChild(el('span', 'recipe-plus', '+'));
      const r = el('img', 'recipe-img' + (save.items.includes(id) ? ' have' : ''));
      r.src = itemImage(id); r.alt = ITEM_BY_ID[id]?.name || id; r.title = r.alt;
      recipe.appendChild(r);
    });
    info.appendChild(recipe);
  }
  const owned = save.items.includes(pick.id);
  const canBuy = !owned && save.cauris >= pick.cost;
  const buy = el('button', 'pf-btn shop-buy' + (owned ? ' owned' : canBuy ? ' pf-btn-brand' : ' disabled'),
    owned ? iconSvg('check') + ' Possédé' : iconSvg('shell') + ' ' + pick.cost.toLocaleString('fr-FR'));
  buy.disabled = !canBuy;
  if (canBuy) {
    buy.addEventListener('click', () => {
      save.cauris -= pick.cost;
      save.items.push(pick.id);
      writeSave(save);
      renderShop(save);
      const hc = document.getElementById('hub-cauris');
      if(hc) hc.textContent = save.cauris.toLocaleString('fr-FR');
    });
  }
  info.appendChild(buy);
  showcase.appendChild(info);
  root.appendChild(showcase);

  // Étagère : toutes les vignettes du palier, touchées pour la vitrine.
  const grid = el('div', 'shop-shelf');
  list.forEach(item => {
    const own = save.items.includes(item.id);
    const cell = el('button', 'shop-cell' + (item.id === shopPick ? ' sel' : '') + (own ? ' owned' : '') + (!own && save.cauris < item.cost ? ' poor' : ''));
    cell.type = 'button';
    cell.style.setProperty('--tier-color', TIER_COLOR[item.tier]);
    const img = el('img', '');
    img.src = itemImage(item.id); img.alt = ''; img.loading = 'lazy';
    cell.appendChild(img);
    cell.appendChild(el('span', 'shop-cell-name', item.name));
    cell.appendChild(el('span', 'shop-cell-cost', own ? iconSvg('check') : iconSvg('shell') + item.cost));
    cell.setAttribute('aria-label', item.name);
    cell.addEventListener('click', () => { shopPick = item.id; renderShop(save); });
    grid.appendChild(cell);
  });
  root.appendChild(grid);
}

// ── Onglet Éveil (arbres de talents) ─────────────────────────────────────────
// Une pierre par arbre ; chaque talent est une tuile avec ses rangs en
// pastilles, le détail en une ligne.
export function renderEveil(save) {
  const root = document.getElementById('eveil-content');
  if (!root) return;
  root.innerHTML = '';
  ensureShopSave(save);

  const header = el('div', 'eveil-top');
  header.appendChild(el('span', 'eveil-top-lbl', 'Points d\'éveil'));
  header.appendChild(el('span', 'eveil-top-pts' + (save.talPtsLeft ? ' has' : ''), `<b>${save.talPtsLeft}</b>/${save.talPtsTotal}`));
  root.appendChild(header);

  TALENT_TREES.forEach(tree => {
    const totalInTree = tree.nodes.reduce((s, n) => s + (save.talents[n.id] || 0), 0);
    const section = el('section', 'stone');
    section.style.setProperty('--tree-color', tree.color);
    const title = el('div', 'stone-head');
    title.appendChild(el('span', 'stone-gem', iconSvg('gem')));
    title.appendChild(el('span', 'stone-name', tree.name.replace(/^Pierre (de l'|du |de la )/, '')));
    title.appendChild(el('span', 'stone-count', String(totalInTree)));
    section.appendChild(title);

    const grid = el('div', 'stone-nodes');
    tree.nodes.forEach(node => {
      const current = save.talents[node.id] || 0;
      const locked  = node.req && totalInTree < node.req;
      const maxed   = current >= node.max;
      const tile = el('div', 'talent' + (locked ? ' locked' : '') + (maxed ? ' maxed' : ''));
      tile.appendChild(el('div', 'talent-name', node.name));
      tile.appendChild(el('div', 'talent-desc', locked ? `${iconSvg('lock')} ${node.req} pts dans la pierre` : node.desc));
      const foot = el('div', 'talent-foot');
      const pips = el('div', 'eveil-pips');
      for (let i = 0; i < node.max; i++) pips.appendChild(el('i', 'eveil-pip' + (i < current ? ' filled' : '')));
      foot.appendChild(pips);
      if (!locked && !maxed && save.talPtsLeft > 0) {
        const btn = el('button', 'icon-btn talent-plus', iconSvg('plus'));
        btn.setAttribute('aria-label', 'Ajouter un rang à ' + node.name);
        btn.addEventListener('click', () => {
          save.talents[node.id] = current + 1;
          save.talPtsLeft--;
          writeSave(save);
          renderEveil(save);
        });
        foot.appendChild(btn);
      } else if (!locked && current > 0) {
        // Bouton reset (récupère les points)
        const rst = el('button', 'icon-btn talent-rst', '↺');
        rst.setAttribute('aria-label', 'Réinitialiser ' + node.name);
        rst.addEventListener('click', () => {
          save.talPtsLeft += current;
          save.talents[node.id] = 0;
          writeSave(save);
          renderEveil(save);
        });
        foot.appendChild(rst);
      }
      tile.appendChild(foot);
      grid.appendChild(tile);
    });
    section.appendChild(grid);
    root.appendChild(section);
  });
}

// ── Labels lisibles pour les stats ────────────────────────────────────────────
const STAT_LABEL = {
  atk: 'ATK', hp: 'PV', arm: 'ARM', mana: 'Mana',
  as: 'Vit.Atk', ms: 'Mvt', ah: 'Accél.Cap.',
  crit: 'Crit', ls: 'Vol.Vie', regen: 'Regen',
  pen: 'Pénétr.', thorns: 'Épines',
};
