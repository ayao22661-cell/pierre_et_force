// ============================================================
// PORTRAITS — pont entre CAST (data) et les rendus 3D des personnages.
// Depuis le passage à la 3D, portraitFor() ne dessine plus un SVG :
// il retourne la capture PNG du vrai modèle GLB (voir
// character-portrait-3d.js), préchargée avant l'affichage du Hub.
// ============================================================
import { CAST } from '../data/cast.js';
import { CHAMPS } from '../data/champions.js';
import { portraitFor3D, portraitAnimFor3D, preloadPortraits3D } from './character-portrait-3d.js';

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

/** Carte animée (WebP animé de l'animation « maison ») pour une clé de CAST. */
export function portraitAnimFor(key){
  return portraitAnimFor3D(ALIASES[key] || key);
}

const REDUCED_MOTION = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/**
 * Affiche le portrait fixe tout de suite, puis le remplace par la version
 * animée dès qu'elle est téléchargée (rien ne clignote, et le portrait
 * fixe reste si l'animation manque ou si le joueur limite les animations).
 */
export function setAnimatedPortrait(img, key){
  img.src = portraitFor(key);
  if(REDUCED_MOTION) return;
  const anim = new Image();
  anim.onload = () => { img.src = anim.src; };
  anim.src = portraitAnimFor(key);
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
