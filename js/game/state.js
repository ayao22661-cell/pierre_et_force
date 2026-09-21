import { CHAMPS } from '../data/champions.js';
// ============================================================
// STATE — sauvegarde de progression (localStorage), même schéma
// logique que le moteur v3 original pour rester compatible.
// ============================================================
// Emplacements de sauvegarde — 3 profils indépendants, comme les
// « slots » de sauvegarde d'un jeu classique. SLOT_PREFIX+n = une
// sauvegarde complète par emplacement ; ACTIVE_SLOT_KEY retient lequel
// est en cours d'utilisation (loadSave/writeSave le lisent chaque
// fois, donc aucun appelant existant n'a besoin de connaître le slot).
const SLOT_PREFIX = 'pf2_save_v1_slot';
const ACTIVE_SLOT_KEY = 'pf2_active_slot';
const LEGACY_SAVE_KEY = 'pf2_save_v1'; // ancien emplacement unique, avant les slots
export const SLOT_COUNT = 3;

function slotKey(slot){ return SLOT_PREFIX + slot; }

/** Emplacement actif (1 à SLOT_COUNT). Par défaut : 1. */
export function getActiveSlot(){
  const n = parseInt(localStorage.getItem(ACTIVE_SLOT_KEY), 10);
  return (n >= 1 && n <= SLOT_COUNT) ? n : 1;
}

export function setActiveSlot(slot){
  try{ localStorage.setItem(ACTIVE_SLOT_KEY, String(slot)); } catch(e){}
}

/**
 * Résumé de chaque emplacement pour l'écran de sélection : existe ou
 * non, et si oui, de quoi a-t-on l'air (niveau, missions, dernier
 * champion joué) — sans avoir à charger la sauvegarde complète.
 */
export function listSlots(){
  const out = [];
  for(let slot = 1; slot <= SLOT_COUNT; slot++){
    let raw = null;
    try{ raw = localStorage.getItem(slotKey(slot)); } catch(e){}
    if(!raw && slot === 1){
      // Migration douce : une sauvegarde faite avant l'existence des
      // slots vit encore sous l'ancienne clé unique — elle devient le
      // slot 1 au lieu d'être perdue.
      try{ raw = localStorage.getItem(LEGACY_SAVE_KEY); } catch(e){}
    }
    if(!raw){ out.push({ slot, exists: false }); continue; }
    try{
      const d = JSON.parse(raw);
      out.push({
        slot, exists: true,
        level: d.level || 1,
        missionsDone: (d.missions_done || []).length,
        lastChamp: d.lastChamp || 'TARINE',
      });
    }catch(e){ out.push({ slot, exists: false }); }
  }
  return out;
}

export function deleteSlot(slot){
  try{
    localStorage.removeItem(slotKey(slot));
    if(slot === 1) localStorage.removeItem(LEGACY_SAVE_KEY);
  }catch(e){}
}

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
    // Chaque valeur est un entier correspondant au rang du sort (0 = rang 1).
    spellLevels: {},
    // Points de compétence NON dépensés, par champion : { TARINE: 2, ... }.
    // Distinct des points de talent (save.talPts, dépensés dans l'arbre
    // élémentaire commun à tout le monde) : ici chaque champion progresse
    // séparément, sur SES quatre sorts à lui.
    spellPts: {},
  };
}

/**
 * Rang maximum atteignable pour un sort : déduit de la longueur du
 * tableau `cd` déjà présent dans les données du champion (5 rangs pour
 * un sort normal, 3 pour un ultime — aucune donnée à dupliquer).
 */
export function maxSpellRank(champKey, slot){
  const a = CHAMPS[champKey]?.abil?.[slot];
  if(!a) return 0;
  return (Array.isArray(a.cd) ? a.cd.length : 1) - 1;
}

/** Rang actuel (0 par défaut) d'un sort pour un champion donné. */
export function spellRank(save, champKey, slot){
  return save.spellLevels?.[champKey]?.[slot] || 0;
}

/** Points de compétence non dépensés pour un champion. */
export function spellPointsLeft(save, champKey){
  return save.spellPts?.[champKey] || 0;
}

/** Dépense un point pour monter un sort d'un rang. Renvoie true si réussi. */
export function spendSpellPoint(save, champKey, slot){
  const max = maxSpellRank(champKey, slot);
  const cur = spellRank(save, champKey, slot);
  if(cur >= max) return false;
  if(spellPointsLeft(save, champKey) <= 0) return false;
  save.spellLevels = save.spellLevels || {};
  save.spellLevels[champKey] = save.spellLevels[champKey] || [0, 0, 0, 0];
  save.spellLevels[champKey][slot] = cur + 1;
  save.spellPts[champKey] = spellPointsLeft(save, champKey) - 1;
  writeSave(save);
  return true;
}

/** Un point de compétence pour le champion qui vient de gagner un combat. */
function awardSpellPoint(save, champKey){
  if(!champKey) return;
  save.spellPts = save.spellPts || {};
  save.spellPts[champKey] = (save.spellPts[champKey] || 0) + 1;
}

/** Charge la sauvegarde de l'emplacement ACTIF (voir getActiveSlot/setActiveSlot). */
export function loadSave(){
  const slot = getActiveSlot();
  try{
    let s = localStorage.getItem(slotKey(slot));
    if(!s && slot === 1) s = localStorage.getItem(LEGACY_SAVE_KEY); // migration, voir listSlots()
    if(s){ const d = JSON.parse(s); if(d.version === 1) return d; }
  } catch(e){}
  return defaultSave();
}

/** Écrit dans l'emplacement ACTIF — inchangé pour tous les appelants existants. */
export function writeSave(save){
  try{ localStorage.setItem(slotKey(getActiveSlot()), JSON.stringify(save)); } catch(e){}
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
  awardSpellPoint(save, save.lastChamp);
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
  awardSpellPoint(save, save.lastChamp);
  writeSave(save);
}

export function isDefiDone(save, id){
  return (save.defis_done || []).indexOf(id) >= 0;
}

export function recordDefeat(save){
  save.stats.games++;
  writeSave(save);
}
