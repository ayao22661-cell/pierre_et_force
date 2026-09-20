// ============================================================
// STATE — sauvegarde de progression (localStorage), même schéma
// logique que le moteur v3 original pour rester compatible.
// ============================================================
const SAVE_KEY = 'pf2_save_v1';

export function defaultSave(){
  return {
    version: 1,
    missions_done: [],
    // Défis (missions alternatives) déjà réussis au moins une fois.
    // Ils restent rejouables : on ne garde la trace que pour l'affichage.
    defis_done: [],
    diff: {},
    xp: 0, level: 1,
    allies_unlocked: ['KAREN', 'FULGENCE'],
    cauris: 0,
    lastChamp: 'TARINE',
    stats: { wins: 0, games: 0, kills: 0 },
    // Niveaux de sorts par champion : { TARINE: [0,0,0,0], ... }
    // Chaque valeur est un entier 0-4 correspondant au rang du sort.
    spellLevels: {},
  };
}

export function loadSave(){
  try{
    const s = localStorage.getItem(SAVE_KEY);
    if(s){ const d = JSON.parse(s); if(d.version === 1) return d; }
  } catch(e){}
  return defaultSave();
}

export function writeSave(save){
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch(e){}
}

export function isMissionDone(save, id){
  return save.missions_done.indexOf(id) >= 0;
}

export function isMissionAvailable(save, allMissionIds, id){
  const idx = allMissionIds.indexOf(id);
  if(idx <= 0) return true;
  return isMissionDone(save, allMissionIds[idx-1]);
}

export function recordVictory(save, missionId){
  if(!isMissionDone(save, missionId)) save.missions_done.push(missionId);
  save.stats.wins++; save.stats.games++;
  writeSave(save);
}

/**
 * Victoire sur un défi. Volontairement séparé de recordVictory() :
 * les défis sont rejouables et ne doivent pas gonfler la progression
 * de campagne (le compteur « x / 50 missions »).
 */
export function recordDefiVictory(save, defiId){
  if(!save.defis_done) save.defis_done = [];
  if(save.defis_done.indexOf(defiId) < 0) save.defis_done.push(defiId);
  save.stats.wins++; save.stats.games++;
  writeSave(save);
}

export function isDefiDone(save, id){
  return (save.defis_done || []).indexOf(id) >= 0;
}

export function recordDefeat(save){
  save.stats.games++;
  writeSave(save);
}
