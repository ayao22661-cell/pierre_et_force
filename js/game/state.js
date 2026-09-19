// ============================================================
// STATE — sauvegarde de progression (localStorage), même schéma
// logique que le moteur v3 original pour rester compatible.
// ============================================================
const SAVE_KEY = 'pf2_save_v1';

export function defaultSave(){
  return {
    version: 1,
    missions_done: [],
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

export function recordDefeat(save){
  save.stats.games++;
  writeSave(save);
}
