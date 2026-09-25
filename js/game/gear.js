// ============================================================
// ÉQUIPEMENT PORTÉ — ce que le héros du joueur a sur lui.
//
// Tous les objets achetés donnent leurs statistiques (game/bonuses.js).
// Ici, on choisit ce qui se VOIT : par emplacement, le meilleur objet
// possédé (palier le plus haut, puis le plus cher).
//   main  — arme en main droite, à la place de celle du personnage ;
//   off   — main gauche / avant-bras (bouclier, kora, boussole) ;
//   armor — l'armure portée : le héros prend son modèle riggé.
// ============================================================
import { ITEMS } from '../data/items.js';

export function gearFor(save){
  const owned = new Set(save?.items || []);
  const best = {};
  for(const it of ITEMS){
    if(!it.slot || !owned.has(it.id)) continue;
    const cur = best[it.slot];
    const rank = (x) => x.tier * 10 + x.cost / 1e4;
    if(!cur || rank(it) > rank(cur)) best[it.slot] = it;
  }
  return best;
}
