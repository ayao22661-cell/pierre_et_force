// ============================================================
// LIEUX — la photo du lieu de chaque mission (assets/lieux/).
//
// Photos prises avec le moteur du jeu lui-même (tools/_lieux.html) :
// mêmes décors, même lumière, même ciel qu'en combat. Elles servent de
// fond aux récits, à la préparation, à l'écran de fin et aux cartes de
// mission : ce que le joueur voit avant une mission ressemble à ce
// qu'il va jouer.
// ============================================================
import { sceneFor } from '../engine/scene/scene-map.js';

/** Nom du lieu d'une mission (ex. « abidjan-cour-nuit »). */
export function lieuKey(missionId){
  const p = sceneFor(missionId);
  return [p.biome, p.setting, p.variant, p.night ? 'nuit' : ''].filter(Boolean).join('-');
}

/** Image du lieu d'une mission. */
export function lieuImage(missionId){
  return `assets/lieux/${lieuKey(missionId)}.webp`;
}

/** Image d'ensemble du jeu (écran titre, hub) : l'équipe dans la cour. */
export const KEY_ART = 'assets/lieux/equipe.webp';
