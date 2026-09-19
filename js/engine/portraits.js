// ============================================================
// PORTRAITS — pont entre CAST (data) et portrait.js (génération SVG).
// Génère chaque portrait une seule fois puis le met en cache : la
// génération est déterministe (seed = clé du personnage), donc le
// cache ne fait qu'économiser du travail, jamais de la fraîcheur.
// ============================================================
import { CAST } from '../data/cast.js';
import { makePortrait } from './portrait.js';

const cache = new Map();

// Alias utilisés côté combat (CHAMPS.BABA) vers la fiche narrative (CAST.BABA_TUNDE).
const ALIASES = { BABA: 'BABA_TUNDE' };

/** Retourne le data-URI SVG du portrait pour une clé de CAST (ou un alias). */
export function portraitFor(key){
  const k = ALIASES[key] || key;
  if(cache.has(k)) return cache.get(k);
  const entry = CAST[k];
  const uri = entry
    ? makePortrait('cast:' + k, entry.role, entry.o)
    : makePortrait('cast:' + k, 'OMBRE');
  cache.set(k, uri);
  return uri;
}

/** Fiche complète (nom, titre, rôle, bio, camp) pour une clé de CAST. */
export function castEntry(key){
  return CAST[ALIASES[key] || key] || null;
}
