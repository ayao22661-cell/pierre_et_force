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
export function renderShop(save) {
  const root = document.getElementById('shop-content');
  if (!root) return;
  root.innerHTML = '';
  ensureShopSave(save);

  const header = el('div', 'pf-panel shop-header');
  header.innerHTML = `<span class="pf-label">OBJETS DISPONIBLES</span><span class="pf-badge pf-badge-gold">${iconSvg('shell')} <span id="shop-cauris">${save.cauris}</span></span>`;
  root.appendChild(header);

  const tiers = [1, 2, 3];
  tiers.forEach(tier => {
    const section = el('div', '');
    section.appendChild(el('div', 'shop-tier-label', `TIER ${tier}`));
    const grid = el('div', 'shop-grid');
    ITEMS.filter(it => it.tier === tier).forEach(item => {
      const owned  = save.items.includes(item.id);
      const card   = el('div', 'pf-panel shop-card' + (owned ? ' owned' : ''));
      // Couleur de palier (bronze/argent/or), comme les objets d'un MOBA :
      // un simple coup d'œil au liseré du haut indique le tier.
      const TIER_COLOR = { 1: '#a3714b', 2: '#b9c3d4', 3: '#c9a24a' };
      card.style.setProperty('--tier-color', TIER_COLOR[tier] || TIER_COLOR[1]);
      // Icône dessinée d'après la statistique principale de l'objet :
      // les emoji d'origine changeaient d'aspect d'un téléphone à l'autre.
      const ico = el('div', 'shop-card-ico');
      ico.appendChild(icon(iconForStats(item.st), 'pf-ico-lg'));
      card.appendChild(ico);
      card.appendChild(el('div', 'shop-card-name', item.name));
      // Stats résumées
      const statsStr = Object.entries(item.st).map(([k, v]) => `${STAT_LABEL[k] || k} ${v > 0 ? '+' : ''}${typeof v === 'number' && v < 1 && v > -1 ? (v * 100).toFixed(0) + '%' : v}`).join('  ');
      card.appendChild(el('div', 'shop-card-stats', statsStr));
      if (item.from) {
        card.appendChild(el('div', 'shop-card-from', 'Craft : ' + item.from.join(' + ')));
      }
      const footer = el('div', 'shop-card-footer');
      if (owned) {
        footer.appendChild(el('span', 'shop-owned-badge', iconSvg('check') + ' POSSÉDÉ'));
      } else {
        const cost = el('span', 'shop-card-cost', iconSvg('shell') + ` ${item.cost}`);
        const btn  = el('button', 'pf-btn pf-btn-sm' + (save.cauris < item.cost ? ' disabled' : ''), 'ACHETER');
        if (save.cauris >= item.cost) {
          btn.addEventListener('click', () => {
            save.cauris -= item.cost;
            save.items.push(item.id);
            writeSave(save);
            renderShop(save);
          });
        }
        footer.appendChild(cost);
        footer.appendChild(btn);
      }
      card.appendChild(footer);
      grid.appendChild(card);
    });
    section.appendChild(grid);
    root.appendChild(section);
  });
}

// ── Onglet Éveil (arbres de talents) ─────────────────────────────────────────
export function renderEveil(save) {
  const root = document.getElementById('eveil-content');
  if (!root) return;
  root.innerHTML = '';
  ensureShopSave(save);

  const header = el('div', 'pf-panel eveil-header');
  header.innerHTML = `<span class="pf-label">PIERRES ÉLÉMENTAIRES</span><span class="pf-badge" id="tal-pts-badge">Points restants : <b>${save.talPtsLeft}</b> / ${save.talPtsTotal}</span>`;
  root.appendChild(header);

  TALENT_TREES.forEach(tree => {
    const section = el('div', 'pf-panel eveil-tree');
    section.style.setProperty('--tree-color', tree.color);
    const title = el('div', 'eveil-tree-title');
    title.innerHTML = `<span class="eveil-gem" style="background:${tree.color}"></span>${tree.name.toUpperCase()}`;
    section.appendChild(title);

    const totalInTree = tree.nodes.reduce((s, n) => s + (save.talents[n.id] || 0), 0);

    tree.nodes.forEach(node => {
      const current = save.talents[node.id] || 0;
      const locked  = node.req && totalInTree < node.req;
      const maxed   = current >= node.max;
      const row     = el('div', 'eveil-node' + (locked ? ' locked' : '') + (maxed ? ' maxed' : ''));

      const left = el('div', 'eveil-node-left');
      left.appendChild(el('div', 'eveil-node-name', node.name));
      left.appendChild(el('div', 'eveil-node-desc', node.desc));
      if (locked) left.appendChild(el('div', 'eveil-node-req', `Nécessite ${node.req} points dans l'arbre`));
      row.appendChild(left);

      const right = el('div', 'eveil-node-right');
      // Pips de rang
      const pips = el('div', 'eveil-pips');
      for (let i = 0; i < node.max; i++) {
        const pip = el('div', 'eveil-pip' + (i < current ? ' filled' : ''));
        pip.style.setProperty('--pip-color', tree.color);
        pips.appendChild(pip);
      }
      right.appendChild(pips);

      if (!locked && !maxed && save.talPtsLeft > 0) {
        const btn = el('button', 'pf-btn pf-btn-sm eveil-btn-plus', '+');
        btn.addEventListener('click', () => {
          save.talents[node.id] = current + 1;
          save.talPtsLeft--;
          writeSave(save);
          renderEveil(save);
        });
        right.appendChild(btn);
      } else if (!locked && current > 0) {
        // Bouton reset (récupère les points)
        const rst = el('button', 'pf-btn pf-btn-sm pf-btn-ghost eveil-btn-rst', '↺');
        rst.title = 'Réinitialiser ce nœud';
        rst.addEventListener('click', () => {
          save.talPtsLeft += current;
          save.talents[node.id] = 0;
          writeSave(save);
          renderEveil(save);
        });
        right.appendChild(rst);
      }
      row.appendChild(right);
      section.appendChild(row);
    });
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
