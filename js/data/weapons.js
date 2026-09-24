// ============================================================
// ARMES DES PERSONNAGES — données partagées par le rendu 3D (qui les
// met en main, js/engine/babylon-units.js) et la simulation (qui en
// déduit la portée des coups en mode Combat, js/game/duel.js).
// ============================================================

// ARMES PORTÉES — format unique et mesuré :
//   file    fichier de assets/props/
//   hand    os d'accroche ('RightHand', 'LeftHand', 'LeftForeArm', 'LeftUpLeg')
//   height  longueur réelle voulue, en mètres
//   grip    où la main tient l'arme, de 0 (talon/pommeau) à 1 (pointe)
//   roll    rotation autour de l'axe de l'arme, pour orienter le tranchant
//   axis    'fist' par défaut : le manche traverse le poing fermé,
//           perpendiculairement aux doigts — c'est ainsi qu'on tient une
//           épée, un bâton ou une arme de poing. 'fingers' n'est utile que
//           pour un objet tenu à plat dans la paume.
//   flip    retourne l'arme bout pour bout si le modèle est à l'envers
//   offset  ajustement fin dans le repère de la main (rarement utile)
//
// La position et l'orientation sont CALCULÉES à partir des os des doigts
// (voir _measureGrip) : l'arme est tenue dans le poing, pas posée à côté.
export const WEAPON_BY_KEY = {
  TARINE: [
    { file: 'EPEE.glb',      hand: 'RightHand',   height: 1.05, grip: 0.14, roll: Math.PI / 2 },
    { file: 'BOUCLIER.glb',  hand: 'LeftForeArm', height: 0.62, grip: 0.5,  roll: 0, strap: true },
  ],
  FULGENCE: [
    { file: 'EPEE1.glb',     hand: 'RightHand',   height: 1.55, grip: 0.12, roll: Math.PI / 2 },
  ],
  // Baba Tunde se bat aux poings, et rien d'autre. L'étui à la ceinture a
  // été retiré : accroché à l'os de la cuisse, il flottait à côté de lui
  // (le repère d'un os de jambe n'a pas la même échelle qu'une main).
  BABA: [],
  LUNDGREN: [
    { file: 'BATON_MAGIQUE.glb', hand: 'RightHand', height: 1.70, grip: 0.42, roll: 0 },
    { file: 'HARPE.glb',     hand: 'LeftHand',    height: 0.70, grip: 0.5,  roll: 0 },
  ],
  DARK: [
    { file: 'EPEE3.glb',     hand: 'RightHand',   height: 0.95, grip: 0.14, roll: Math.PI / 2 },
    { file: 'PISTOLET3.glb', hand: 'LeftHand',    height: 0.38, grip: 0.42, roll: 0 },
  ],
  KAREN: [
    { file: 'LANCE.glb',     hand: 'RightHand',   height: 1.95, grip: 0.38, roll: Math.PI / 2 },
  ],
  SAM: [
    { file: 'PISTOLET1.glb', hand: 'RightHand',   height: 0.36, grip: 0.42, roll: 0 },
    { file: 'BOUSSOLE.glb',  hand: 'LeftHand',    height: 0.22, grip: 0.5,  roll: 0 },
  ],

  // ── Ennemis ────────────────────────────────────────────────
  SYLLA:    [{ file: 'PISTOLET2.glb', hand: 'RightHand', height: 0.34, grip: 0.42, roll: 0 }],
  OUSMANE:  [{ file: 'PISTOLET1.glb', hand: 'RightHand', height: 0.38, grip: 0.42, roll: 0 }],
  SCHISSIN: [{ file: 'PISTOLET3.glb', hand: 'RightHand', height: 0.40, grip: 0.42, roll: 0 }],
  SUB:      [{ file: 'EPEE3.glb',     hand: 'RightHand', height: 0.95, grip: 0.14, roll: Math.PI / 2 }],
  GROB:     [{ file: 'EPEE1.glb',     hand: 'RightHand', height: 1.60, grip: 0.12, roll: Math.PI / 2 }],
  KRAG:     [{ file: 'LANCE.glb',     hand: 'RightHand', height: 2.10, grip: 0.38, roll: Math.PI / 2 }],
  VAEL:     [{ file: 'EPEE.glb',      hand: 'RightHand', height: 1.00, grip: 0.14, roll: Math.PI / 2 }],
  SGRUN: [
    { file: 'BATON_MAGIQUE.glb', hand: 'RightHand', height: 1.85, grip: 0.42, roll: 0 },
    { file: 'BOUSSOLE.glb',      hand: 'LeftHand',  height: 0.28, grip: 0.5,  roll: 0 },
  ],
};
