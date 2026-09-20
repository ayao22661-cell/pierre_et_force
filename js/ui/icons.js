// ============================================================
// ICÔNES — petit jeu d'icônes SVG dessinées à la main, au trait,
// pour remplacer les emoji du HUD et du Hub. Les emoji changent de
// dessin selon le téléphone (Android, iPhone, Windows) et cassent
// l'identité visuelle du jeu ; ces icônes sont identiques partout,
// prennent la couleur du texte (currentColor) et s'alignent sur la
// ligne de base du texte.
//
// Usage :
//   iconSvg('sword')              -> chaîne SVG à insérer dans un innerHTML
//   icon('heart', 'pf-ico-sm')    -> élément DOM prêt à appendChild()
// ============================================================

const PATHS = {
  // Cœur — points de vie
  heart: '<path d="M12 20s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5C19 15.5 12 20 12 20z"/>',
  // Épée — attaque
  sword: '<path d="M12 2.5l2.4 3.6V14h-4.8V6.1z"/><path d="M8 14h8"/><path d="M12 14v5.5"/><path d="M9.8 19.5h4.4"/>',
  // Bouclier — armure / alliés
  shield: '<path d="M12 3l7 3v5.5c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6z"/>',
  // Cible — missions / critique
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  // Goutte — vol de vie
  drop: '<path d="M12 3.5s5.5 6 5.5 9.5a5.5 5.5 0 0 1-11 0C6.5 9.5 12 3.5 12 3.5z"/>',
  // Feuille — régénération
  leaf: '<path d="M5 19c0-7 5-12 14-13 .5 7-2.5 13-9.5 13H5z"/><path d="M9 15c2-2.5 4.5-4 7.5-5"/>',
  // Cauri — la monnaie du jeu
  shell: '<path d="M12 3.5c3.6 0 6.5 3.8 6.5 8.5S15.6 20.5 12 20.5 5.5 16.7 5.5 12 8.4 3.5 12 3.5z"/><path d="M12 5.5v13"/><path d="M9.2 8.5l1.6 1.2M9 12h1.8M9.2 15.5l1.6-1.2M14.8 8.5l-1.6 1.2M15 12h-1.8M14.8 15.5l-1.6-1.2"/>',
  // Coche — objet possédé
  check: '<path d="M4.5 12.5l5 5 10-11"/>',
  // Pause
  pause: '<path d="M9 5v14M15 5v14"/>',
  // Étincelle — déblocage, récompense
  spark: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/>',
  // Botte — vitesse de déplacement
  boot: '<path d="M7 4h4v7c0 1.6 1 2.6 2.6 3.2L18 16c1.3.5 2 1.4 2 2.6V20H7z"/><path d="M7 4v16"/><path d="M11 11h3"/>',
  // Éclair — énergie, accélération de capacité
  bolt: '<path d="M13 3L5.5 13.5H11L10.5 21 18.5 10H13z"/>',
  // Parchemin — journal
  scroll: '<path d="M7 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7"/><path d="M7 4a2 2 0 0 0-2 2v1h3"/><path d="M9.5 9h6M9.5 12.5h6M9.5 16h3.5"/>',
};

/** Chaîne SVG de l'icône, à insérer dans un innerHTML ou un template. */
export function iconSvg(name, cls = ''){
  const d = PATHS[name];
  if(!d) return '';
  return `<svg class="pf-ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
}

/**
 * Icône la plus parlante pour un objet, d'après sa statistique principale.
 * Évite d'avoir à dessiner une icône par objet, et reste cohérent avec le
 * reste du HUD (une épée veut toujours dire attaque, où qu'elle soit).
 */
export function iconForStats(st = {}){
  if(st.atk) return 'sword';
  if(st.arm || st.thorns) return 'shield';
  if(st.hp || st.regen) return 'heart';
  if(st.crit || st.as) return 'target';
  if(st.ms) return 'boot';
  if(st.mana || st.ah) return 'bolt';
  if(st.ls) return 'drop';
  return 'spark';
}

/** Élément DOM de l'icône, prêt à être ajouté au document. */
export function icon(name, cls = ''){
  const span = document.createElement('span');
  span.className = 'pf-ico-wrap';
  span.innerHTML = iconSvg(name, cls);
  return span.firstElementChild || span;
}
