// ============================================================
// END — écran de fin de match (v3+).
// Gère XP, montée de niveau, cauris, kills, déblocage alliés.
// ============================================================
import { el } from './screens.js';
import { iconSvg } from './icons.js';
import { CAMPAIGN } from '../data/campaign.js';
import { CHAMPS } from '../data/champions.js';
import { writeSave } from '../game/state.js';

// Alliés débloqués à la fin de chaque acte (boss battu).
// Génère automatiquement la map mission-fin-d-acte → champion.
const UNLOCK_BY_MISSION = (() => {
  const UNLOCK_ORDER = ['SAM','LUNDGREN','BABA','DARK'];
  const map = {};
  let idx = 0;
  CAMPAIGN.forEach(acte => {
    const last = acte.missions[acte.missions.length - 1];
    if(last && idx < UNLOCK_ORDER.length){
      map[last.id] = UNLOCK_ORDER[idx++];
    }
  });
  return map;
})();

export function renderEnd(victory, mission, save, sim, onHub, onRetry){
  const title = document.getElementById('end-title');
  title.textContent = victory ? 'VICTOIRE' : 'DÉFAITE';
  title.style.color = victory ? 'var(--pf-good)' : 'var(--pf-danger)';

  const sub = document.getElementById('end-subtitle');
  sub.textContent = mission ? `${mission.num}. ${mission.name}` : '';

  const rewards = document.getElementById('end-rewards');
  rewards.innerHTML = '';

  if(victory){
    // Les défis portent leurs propres récompenses (et leur numéro est du
    // texte, « D3 » : le calcul de campagne donnerait NaN).
    const num    = Number(mission?.num) || 1;
    const xp     = mission?.xp     != null ? mission.xp     : 40 + num * 10;
    const cauris = mission?.cauris != null ? mission.cauris : 30 + num * 6;
    const kills   = sim?.teamKills?.[0] || 0;

    save.xp     += xp;
    save.cauris += cauris;
    save.stats   = save.stats || {};
    save.stats.kills = (save.stats.kills || 0) + kills;
    // wins/games sont déjà incrémentés par recordVictory() (game/state.js),
    // appelé avant renderEnd() dans main.js — ne pas les recompter ici.

    // Montée de niveau
    let leveled = false;
    while(save.xp >= (100 + save.level * 40) && save.level < 80){
      save.xp -= (100 + save.level * 40);
      save.level++;
      leveled = true;
    }

    rewards.appendChild(rewardRow('Expérience', `+${xp} XP`));
    rewards.appendChild(rewardRow('Cauris', `+${cauris} ` + iconSvg('shell')));
    if(kills) rewards.appendChild(rewardRow('Éliminations', `${kills} ` + iconSvg('sword')));
    if(leveled) rewards.appendChild(rewardRow('NIVEAU+', `Niveau ${save.level} atteint !`, true));

    // Déblocage d'allié à la fin de l'acte
    const newAlly = mission?.id ? UNLOCK_BY_MISSION[mission.id] : null;
    if(newAlly && !save.allies_unlocked.includes(newAlly)){
      save.allies_unlocked.push(newAlly);
      const champName = CHAMPS[newAlly]?.name || newAlly;
      rewards.appendChild(rewardRow('Allié débloqué ' + iconSvg('spark'), `${champName} rejoint l'équipe`, true));
    }

    writeSave(save);
  } else {
    // games est déjà incrémenté par recordDefeat() (game/state.js).
    writeSave(save);
    rewards.appendChild(rewardRow('Conseil', 'Reviens avec un allié pour équilibrer le combat.'));
  }

  document.getElementById('btn-hub').onclick    = onHub;
  document.getElementById('btn-retry').onclick   = onRetry;
  document.getElementById('btn-retry').textContent = victory ? 'REJOUER' : 'RÉESSAYER';
}

function rewardRow(label, val, highlight=false){
  const row = el('div', 'pf-panel end-reward-row' + (highlight ? ' highlight' : ''), '');
  const lbl = el('span', 'pf-label', label);
  const v   = el('span', '', val);
  v.style.cssText = 'font-family:var(--pf-font-display);font-size:15px;letter-spacing:1px;color:var(--pf-text);';
  row.appendChild(lbl);
  row.appendChild(v);
  return row;
}
