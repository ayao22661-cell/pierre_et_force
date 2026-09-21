// ============================================================
// PORTRAITS — pont entre CAST (data) et les rendus 3D des personnages.
// Depuis le passage à la 3D, portraitFor() ne dessine plus un SVG :
// il retourne la capture PNG du vrai modèle GLB (voir
// character-portrait-3d.js), préchargée avant l'affichage du Hub.
// ============================================================
import { CAST } from '../data/cast.js';
import { CHAMPS } from '../data/champions.js';
import { portraitFor3D, preloadPortraits3D } from './character-portrait-3d.js';

// Alias utilisés côté combat (CHAMPS.BABA) vers la fiche narrative (CAST.BABA_TUNDE).
const ALIASES = { BABA: 'BABA_TUNDE' };
// Sens inverse : fiche narrative -> clé jouable en combat (CHAMPS).
const REVERSE_ALIASES = { BABA_TUNDE: 'BABA' };

/** Clé CHAMPS (jouable en combat) pour une clé de CAST, ou null si le personnage ne combat pas. */
export function champKeyFor(castKey){
  if(CHAMPS[castKey]) return castKey;
  return REVERSE_ALIASES[castKey] || null;
}

/** Retourne le data-URI PNG (rendu 3D) du portrait pour une clé de CAST (ou un alias). */
export function portraitFor(key){
  return portraitFor3D(ALIASES[key] || key);
}

/** Précharge les portraits 3D de toutes les clés du CAST (+ alias de combat). */
export function preloadAllPortraits(){
  const keys = Object.keys(CAST);
  return preloadPortraits3D(keys);
}

/** Fiche complète (nom, titre, rôle, bio, camp) pour une clé de CAST. */
export function castEntry(key){
  return CAST[ALIASES[key] || key] || null;
}
