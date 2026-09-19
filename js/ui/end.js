// ============================================================
// END — écran de fin de match.
// ============================================================
import { el } from './screens.js';

export function renderEnd(victory, mission, save, onHub, onRetry){
  const title = document.getElementById('end-title');
  title.textContent = victory ? 'VICTOIRE' : 'DÉFAITE';
  title.style.color = victory ? 'var(--pf-good)' : 'var(--pf-danger)';

  const sub = document.getElementById('end-subtitle');
  sub.textContent = mission ? `${mission.num}. ${mission.name}` : '';

  const rewards = document.getElementById('end-rewards');
  rewards.innerHTML = '';
  if(victory){
    const xp = 40 + (mission?.num || 1) * 10;
    const cauris = 30 + (mission?.num || 1) * 6;
    rewards.appendChild(rewardRow('Expérience', `+${xp} XP`));
    rewards.appendChild(rewardRow('Cauris', `+${cauris} 🐚`));
    save.xp += xp; save.cauris += cauris;
  } else {
    rewards.appendChild(rewardRow('Conseil', 'Reviens avec un allié pour équilibrer le combat.'));
  }

  document.getElementById('btn-hub').onclick = onHub;
  document.getElementById('btn-retry').onclick = onRetry;
  document.getElementById('btn-retry').textContent = victory ? 'REJOUER' : 'RÉESSAYER';
}

function rewardRow(label, val){
  const row = el('div', 'pf-panel', '');
  row.style.cssText = 'display:flex;justify-content:space-between;padding:10px 14px;margin-bottom:6px;';
  row.appendChild(el('span', 'pf-label', label));
  row.appendChild(el('span', '', val));
  return row;
}
