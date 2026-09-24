// ============================================================
// ÉQUIPEMENT PORTÉ — ce que le héros du joueur a sur lui.
//
// Tous les objets achetés donnent leurs statistiques (game/bonuses.js).
// Ici, on choisit ce qui se VOIT : par emplacement, le meilleur objet
// possédé (palier le plus haut, puis le plus cher).
//   main  — arme en main droite, à la place de celle du personnage ;
//   off   — main gauche / avant-bras (bouclier, kora, boussole) ;
//   armor — aura de la couleur de l'armure autour du héros.
// ============================================================
import { ITEMS } from '../data/items.js';

export function gearFor(save){
  const owned = new Set(save?.items || []);
  const best = {};
  for(const it of ITEMS){
    if(!it.slot || !owned.has(it.id)) continue;
    const cur = best[it.slot];
    if(!cur || it.tier > cur.tier || (it.tier === cur.tier && it.cost > cur.cost)) best[it.slot] = it;
  }
  return best;
}
