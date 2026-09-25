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
  // ---- Navigation du hub et états de carte ----
  // Poing — coup de base au corps à corps
  fist: '<path d="M7 11V8.2a1.6 1.6 0 0 1 3.2 0V10"/><path d="M10.2 9.5V7.4a1.6 1.6 0 0 1 3.2 0V10"/><path d="M13.4 9.8V8a1.6 1.6 0 0 1 3.2 0v2.3"/><path d="M16.6 10.2a1.5 1.5 0 0 1 3 .3v2.8c0 3.9-2.8 6.7-6.6 6.7h-1.4C8 20 5.2 17.6 5 14.2l-.2-2a1.6 1.6 0 0 1 2.2-1.6"/><path d="M7 14.5c1.4-.9 3.3-1 4.8-.3"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="10" rx="1.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  // Haut-parleur — son actif / coupé
  sound_on: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  sound_off: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20.5c0-4 3.1-6.5 7-6.5s7 2.5 7 6.5"/>',
  gem: '<path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18M9.5 4L12 20M14.5 4L12 20"/>',
  bag: '<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
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

  // ---- Icônes de sorts, par MÉCANIQUE (abil[].type) — voir iconForAbility()
  // Projectile visé (shot/line)
  ability_shot: '<path d="M4 12h13"/><path d="M13 6.5L19.5 12 13 17.5"/>',
  // Ruée / téléportation (dash/blink)
  ability_dash: '<path d="M3 16l6-6-6-6" opacity=".45"/><path d="M10 18l8-8-8-8"/>',
  // Zone ciblée au sol (circle/zone)
  ability_circle: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.2"/><path d="M12 3v2.3M12 18.7V21M3 12h2.3M18.7 12H21"/>',
  // Cône mêlée (cone)
  ability_cone: '<path d="M12 4l7 15H5z"/><path d="M12 10.5v5"/>',
  // Explosion centrée sur soi (nova)
  ability_nova: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/>',
  // Soin ciblé (ally / heal)
  ability_heal: '<path d="M12 20.5s-7-4.3-7-9.8A4 4 0 0 1 12 8a4 4 0 0 1 7 2.7c0 5.5-7 9.8-7 9.8z"/><path d="M12 9.5v6M9 12.5h6"/>',
  // Invocation (summon)
  ability_summon: '<circle cx="12" cy="7" r="2.6"/><path d="M6 20c0-3.6 2.7-6 6-6s6 2.4 6 6"/><path d="M4 20h16" opacity=".4"/>',
  // Buff / voile sur soi, sans bouclier (self sans shield)
  ability_aura: '<path d="M12 3c3 2.4 5 5.7 5 9a5 5 0 0 1-10 0c0-3.3 2-6.6 5-9z"/>',

  // ---- Icônes de RÔLE (sélection de champion) ----
  role_combattant: '<path d="M12 3l2.2 4.4L19 8.5l-3.5 3.4.8 4.9-4.3-2.3-4.3 2.3.8-4.9L5 8.5l4.8-1.1z"/>',
  role_mage: '<path d="M12 3v6M12 15v6M6 9l4 3-4 3M18 9l-4 3 4 3"/>',
  role_soutien: '<path d="M12 20.5s-7-4.3-7-9.8A4 4 0 0 1 12 8a4 4 0 0 1 7 2.7c0 5.5-7 9.8-7 9.8z"/>',
  role_tank: '<path d="M12 3l7 3v5.5c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  role_assassin: '<path d="M5 19L17 7"/><path d="M13 3l4.5 4.5L21 4"/><path d="M5 19l-1.5 3L7 20.5"/>',

  // ---- Icônes de MODE de mission ----
  mode_siege: '<path d="M4 21V10l4-3 4 3 4-3 4 3v11"/><path d="M4 21h16M9 21v-5h6v5"/>',
  mode_arena: '<circle cx="12" cy="12" r="8.5"/><path d="M12 6v3M12 15v3M6 12h3M15 12h3"/>',
  mode_defense: '<path d="M12 3l7 3v5.5c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6z"/>',
  mode_boss: '<path d="M12 3l2 3.5L18 5l-1 4 3 2-3 2 1 4-4-1.5L12 19l-2-3.5L6 17l1-4-3-2 3-2-1-4 4 1.5z"/>',
};

const ROLE_ICON = {
  Combattant: 'role_combattant', Mage: 'role_mage', Soutien: 'role_soutien',
  Tank: 'role_tank', Assassin: 'role_assassin',
};
/** Icône de rôle (sélection de champion) — repli neutre si rôle inconnu. */
export function iconForRole(role){ return ROLE_ICON[role] || 'role_combattant'; }

/**
 * Icône représentative d'un sort d'après sa MÉCANIQUE (le champ `type`
 * dans data/champions.js), pas son thème visuel propre — un seul jeu
 * d'icônes suffit donc pour tous les personnages, présents et à venir.
 * Le bouclier prime sur "self" nu (Mur de Pierre vs Voile Maudit), et
 * le cœur prime sur "nova" quand la nova soigne l'équipe au lieu de
 * frapper les ennemis.
 */
export function iconForAbility(a){
  if(a.type === 'self' && a.shield) return 'shield';
  if(a.type === 'self') return 'ability_aura';
  if(a.type === 'ally') return 'ability_heal';
  if(a.type === 'nova') return a.team === 'ally' ? 'ability_heal' : 'ability_nova';
  if(a.type === 'circle' || a.type === 'zone') return 'ability_circle';
  if(a.type === 'cone') return 'ability_cone';
  if(a.type === 'dash' || a.type === 'blink') return 'ability_dash';
  if(a.type === 'summon') return 'ability_summon';
  return 'ability_shot'; // shot / line / par défaut
}

/** Chaîne SVG de l'icône, à insérer dans un innerHTML ou un template. */
export function iconSvg(name, cls = ''){
  const d = PATHS[name];
  if(!d) return '';
  return `<svg class="pf-ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
}

const MODE_ICON = { 'SIÈGE': 'mode_siege', 'ARÈNE': 'mode_arena', 'DÉFENSE': 'mode_defense', 'BOSS': 'mode_boss' };
/** Icône représentative du mode d'une mission (affichage des cartes de mission). */
// Le mode Combat (duel) réutilise le poing du bouton d'attaque.
export function iconForMode(mode){
  if(mode === 'COMBAT') return 'fist';
  return MODE_ICON[mode] || 'mode_arena';
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
