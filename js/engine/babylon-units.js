// ============================================================
// BABYLON UNITS — rendu 3D des personnages (GLB Mixamo) superposé au
// canvas PixiJS, avec un système d'animations complet : idle variés,
// marche/course calées sur la vitesse réelle, attaques, sorts,
// réactions aux coups et morts tirés au hasard dans la bibliothèque
// de 580 clips Mixamo (assets/animations/).
//
// Trois règles qui corrigent les défauts d'origine :
//
// 1. PAS DE GLISSADE. Les clips Mixamo contiennent du « root motion » :
//    l'os Hips avance réellement (ex. 1,5 m sur un cycle de marche) puis
//    revient d'un coup au départ de la boucle. Comme le sim déplace déjà
//    l'unité, on retire ce déplacement horizontal au chargement du clip
//    (_loadAnimSource) — on garde seulement le rebond vertical — et on
//    règle la vitesse de lecture sur la vitesse de déplacement mesurée
//    (vitesse du clip, calculée avant le retrait, en m/s).
//
// 2. ORIENTATION. La racine d'un GLB (__root__) porte un
//    rotationQuaternion : dans Babylon, `rotation.y` est alors IGNORÉ.
//    L'ancien code ne tournait donc jamais les personnages : ils se
//    déplaçaient de côté ou à reculons. Chaque modèle est maintenant
//    posé sous un pivot dont on tourne la rotation (lissée).
//
// 3. VARIÉTÉ. Chaque personnage a son propre profil (listes de clips
//    par état) ; on tire un clip différent à chaque attaque, sort,
//    réaction ou mort, les idle s'enchaînent entre plusieurs variantes,
//    et chaque unité a un léger décalage de tempo pour que les sbires
//    ne bougent pas tous à l'unisson.
// ============================================================
import { WEAPON_BY_KEY } from '../data/weapons.js';
import { Graphics } from './graphics.js';

const GLB_BASE = 'assets/models/';
const ANIM_BASE = 'assets/animations/';

// Personnages qui ne projettent aucune ombre au sol.
const NO_SHADOW = new Set(['SKYGGE']);

// Les 7 champions jouables ont chacun leur modèle dédié (Hunyuan 3D +
// rig Mixamo), comme les 13 autres personnages du récit (portraits,
// voir character-portrait-3d.js) et les deux sbires.
const MODEL_BY_KEY = {
  TARINE:   'TARINE.glb',
  SAM:      'SAM.glb',
  LUNDGREN: 'LUNDGREN.glb',
  KAREN:    'KAREN.glb',
  FULGENCE: 'FULGENCE.glb',
  BABA:     'BABA_TUNDE.glb',
  DARK:     'DARK.glb',
  // Ennemis : police d'Abidjan et Émissaires de Sgrün.
  SYLLA:    'SYLLA.glb',
  SCHISSIN: 'SCHISSIN.glb',
  OUSMANE:  'OUSMANE.glb',
  SUB:      'SUB.glb',
  GROB:     'GROB.glb',
  KRAG:     'KRAG.glb',
  MURK:     'MURK.glb',
  VAEL:     'SAMIA.glb',   // Vael n'a pas de modèle propre : silhouette de Samia
  SGRUN:    'SGRUN.glb',
  // Légendes, jouables une fois leur épreuve gagnée.
  KANKOU:   'KANKOU.glb',
  YASUKE:   'YASUKE.glb',
  ADANDE:   'ADANDE.glb',
  SKYGGE:   'SKYGGE.glb',
  DINGANE:  'DINGANE.glb',
  // Ennemis de la deuxième vague.
  CENDRE:      'CENDRE.glb',
  CHRONOPHAGE: 'CHRONOPHAGE.glb',
};
const MODEL_MINION_ALLY  = 'SBIRE.glb';
const MODEL_MINION_ENEMY = 'ORC.glb';
const MODEL_FALLBACK     = 'TARINE.glb';

// ---------------------------------------------------------------
// ARMES — objets statiques (aucun squelette propre) attachés à l'os de
// la main d'un champion. Chaque entrée : fichier, main ('RightHand' /
// 'LeftHand'), échelle, et un ajustement fin position/rotation pour que
// l'arme se pose naturellement dans le poing (réglé à l'œil sur des
// rendus de contrôle — voir le document de passation).
// ---------------------------------------------------------------
const PROPS_BASE = 'assets/props/';
// ---------------------------------------------------------------
// STRUCTURES — l'autel (kind:'autel'), un objet 3D statique (pas de
// squelette, pas d'animation), à la différence des champions/sbires.
// ---------------------------------------------------------------
const STRUCTURE_MODEL = { autel: 'AUTEL.glb' };
// Hauteur cible en mètres (l'obélisque doit rester un repère visible sur
// la carte) — le modèle brut mesure environ 1,1 m après compression.
const AUTEL_HEIGHT_M = 2.6;

// Armes portées : voir js/data/weapons.js (partagé avec la simulation,
// qui en déduit la portée des coups en mode Combat).
export { WEAPON_BY_KEY };
export const WEAPON_TABLE = WEAPON_BY_KEY;
export const WEAPON_LIBRARY = {
  lance:     { file: 'LANCE.glb',     hand: 'RightHand', height: 1.9,  grip: 0.42, pos: [0, 0.05, 0], rot: [1.8, 0, 0.79] },
  pistolet1: { file: 'PISTOLET1.glb', hand: 'RightHand', height: 0.42, grip: 0.35, pos: [0, 0.04, 0], rot: [1.8, 0, 0.79] },
  pistolet2: { file: 'PISTOLET2.glb', hand: 'RightHand', height: 0.40, grip: 0.35, pos: [0, 0.04, 0], rot: [1.8, 0, 0.79] },
  pistolet3: { file: 'PISTOLET3.glb', hand: 'RightHand', height: 0.45, grip: 0.35, pos: [0, 0.04, 0], rot: [1.8, 0, 0.79] },
  kora:      { file: 'HARPE.glb',     hand: 'LeftHand',  height: 0.75, grip: 0.45, pos: [0, 0.07, 0], rot: [1.8, 0, 0.79] },
  boussole:  { file: 'BOUSSOLE.glb',  hand: 'LeftHand',  height: 0.26, grip: 0.5,  pos: [0, 0.06, 0], rot: [1.57, 0, 0] },
  // Porté à la hanche plutôt qu'en main : parenter à 'LeftUpLeg'.
  holster:   { file: 'PISTOLET2.glb', hand: 'LeftUpLeg', height: 0.36, grip: 0.4,  pos: [0.06, 0.12, 0.05], rot: [1.3, 0, 1.2] },
};

function modelForUnit(u){
  // Armure riggée achetée par le joueur : le héros la porte réellement
  // (même squelette Mixamo, donc toutes ses animations restent valables).
  if(u.kind === 'champ' && u.gear?.armor?.model) return u.gear.armor.model;
  if(u.kind === 'champ')  return MODEL_BY_KEY[u.key] || MODEL_FALLBACK;
  if(u.kind === 'minion') return u.team === 0 ? MODEL_MINION_ALLY : MODEL_MINION_ENEMY;
  return null; // tours / autel restent en PixiJS (Graphics), pas de GLB
}

// ---------------------------------------------------------------
// PROFILS D'ANIMATION — un jeu de clips par personnage.
// Le premier idle est le plus fréquent (posture « maison »), les
// autres viennent ponctuer. Attaque / sort / coup / mort : tirage
// aléatoire sans répéter deux fois de suite le même clip.
// Vérifié : sword-and-shield-walk est une marche ARRIÈRE (le bassin
// recule de 1,4 m) — les marches avant utilisées ici avancent bien.
// ---------------------------------------------------------------
// PROFILS D'ANIMATION — un jeu de clips par personnage, puisé dans la
// bibliothèque de 580 clips Mixamo (assets/animations/).
// Le premier idle est le plus fréquent (posture « maison »), les autres
// viennent ponctuer. Attaque / sort / coup / mort : tirage aléatoire sans
// jamais répéter deux fois de suite le même clip — c'est ce qui évite
// l'effet « ils font tous le même geste ».
// Les états dodge / block / taunt / jump ne sont pas encore joués par le
// mode Siège : ils sont là pour le mode Combat (duel façon Tekken).
// Vérifié : sword-and-shield-walk est une marche ARRIÈRE (le bassin
// recule de 1,4 m) — les marches avant listées ici avancent bien.
// ---------------------------------------------------------------
const PROFILES = {
  // Tarine — bouclier et pierre : frappes nettes, garde haute, sorts à une main.
  tarine: {
    idle  : ['sword-and-shield-idle-1.glb', 'sword-and-shield-idle.glb', 'pro-sword-and-shield-pack-sword-and-shield-idle.glb', 'pro-sword-and-shield-pack-sword-and-shield-idle-2.glb', 'lite-sword-and-shield-pack-sword-and-shield-idle.glb', 'sword-and-shield-idle-2.glb'],
    walk  : ['pro-sword-and-shield-pack-sword-and-shield-walk.glb', 'pro-sword-and-shield-pack-sword-and-shield-walk-2.glb', 'great-sword-walk.glb', 'sword-and-shield-pack-sword-and-shield-walk-2.glb'],
    run   : ['pro-sword-and-shield-pack-sword-and-shield-run.glb', 'lite-sword-and-shield-pack-sword-and-shield-run.glb', 'standing-sprint-forward.glb', 'running.glb'],
    attack: ['sword-and-shield-slash.glb', 'sword-and-shield-slash-1.glb', 'pro-sword-and-shield-pack-sword-and-shield-attack.glb', 'pro-sword-and-shield-pack-sword-and-shield-attack-2.glb', 'pro-sword-and-shield-pack-sword-and-shield-attack-3.glb', 'pro-sword-and-shield-pack-sword-and-shield-attack-4.glb', 'lite-sword-and-shield-pack-sword-and-shield-attack.glb', 'lite-sword-and-shield-pack-sword-and-shield-attack-2.glb', 'lite-sword-and-shield-pack-sword-and-shield-attack-3.glb', 'sword-and-shield-kick.glb', 'sword-and-shield-attack-1.glb'],
    cast  : ['standing-1h-cast-spell-01.glb', 'sword-and-shield-casting.glb', 'standing-2h-magic-attack-02.glb', 'pro-sword-and-shield-pack-sword-and-shield-power-up.glb'],
    hit   : ['sword-and-shield-impact.glb', 'pro-sword-and-shield-pack-sword-and-shield-impact.glb', 'pro-sword-and-shield-pack-sword-and-shield-impact-2.glb', 'sword-and-shield-block.glb', 'lite-sword-and-shield-pack-sword-and-shield-block.glb', 'standing-block-react-large.glb'],
    death : ['sword-and-shield-death.glb', 'lite-sword-and-shield-pack-sword-and-shield-death.glb', 'falling-back-death.glb', 'pro-sword-and-shield-pack-sword-and-shield-death.glb'],
    dodge : ['standing-dodge-left.glb', 'standing-dodge-right.glb', 'standing-dodge-forward.glb', 'capoeira-pack-esquiva-1.glb'],
    block : ['pro-sword-and-shield-pack-sword-and-shield-block-idle.glb', 'lite-sword-and-shield-pack-sword-and-shield-block-idle.glb', 'center-block.glb', 'body-block.glb'],
    taunt : ['standing-taunt-battlecry.glb', 'pro-melee-axe-pack-standing-taunt-chest-thump.glb'],
    jump  : ['pro-melee-axe-pack-standing-jump.glb', 'big-jump.glb'],
  },
  // Baba Tunde — la star de la cour : boxe, capoeira, esquives acrobatiques.
  baba: {
    idle  : ['bouncing-fight-idle.glb', 'fight-idle.glb', 'fighting-idle.glb', 'bouncing-fight-idle-1.glb', 'ginga-variation-3.glb', 'standing-idle-03.glb'],
    walk  : ['start-walking.glb', 'great-sword-walk.glb', 'walk-forward-arc.glb', 'basic-shooter-pack-walking.glb'],
    run   : ['running.glb', 'run.glb', 'standing-sprint-forward.glb'],
    attack: ['boxing.glb', 'fist-fight-a.glb', 'fist-fight-b.glb', 'punching.glb', 'headbutt.glb', 'flying-knee-punch-combo.glb', 'mutant-punch.glb', 'inside-crescent-kick.glb', 'chapa-2.glb', 'dual-weapon-combo.glb'],
    cast  : ['drop-kick.glb', 'butterfly-twirl.glb', 'capoeira-pack-armada.glb', 'capoeira-pack-chapa-giratoria.glb', 'running-forward-flip.glb'],
    hit   : ['receive-uppercut-to-the-face.glb', 'standing-react-small-from-front.glb', 'reaction.glb', 'standing-block-react-large.glb'],
    death : ['falling-forward-death.glb', 'standing-react-death-right.glb', 'falling-back-death.glb'],
    dodge : ['dodging.glb', 'standing-dodge-left.glb', 'standing-dodge-right.glb', 'capoeira-pack-esquiva-2.glb', 'capoeira-pack-esquiva-3.glb'],
    block : ['center-block.glb', 'inward-block.glb', 'right-block.glb', 'body-block.glb'],
    taunt : ['standing-taunt-battlecry.glb', 'hip-hop-dancing.glb', 'silly-dancing.glb'],
    jump  : ['jumping.glb', 'big-jump.glb', 'jumping-over-into-combat.glb'],
  },
  // Sam — mage : projectiles à une main, grands sorts à deux mains.
  sam: {
    idle  : ['standing-idle.glb', 'standing-idle-03.glb', 'looking.glb', 'body-block.glb'],
    walk  : ['great-sword-walk.glb', 'sword-and-shield-pack-sword-and-shield-walk-2.glb', 'basic-shooter-pack-walking.glb'],
    run   : ['standing-sprint-forward.glb', 'running.glb'],
    attack: ['standing-1h-magic-attack-01.glb', 'standing-1h-magic-attack-02.glb', 'standing-1h-magic-attack-03.glb', 'fireball.glb'],
    cast  : ['standing-2h-magic-attack-02.glb', 'standing-2h-magic-attack-04.glb', 'standing-2h-cast-spell-01.glb', 'standing-2h-magic-attack-03.glb', 'standing-1h-cast-spell-01.glb'],
    hit   : ['standing-react-small-from-front.glb', 'standing-react-small-from-left.glb', 'reaction.glb'],
    death : ['standing-react-death-backward.glb', 'standing-react-death-backward-1.glb', 'falling-back-death.glb'],
    dodge : ['standing-dodge-forward.glb', 'standing-dodge-left.glb', 'dodging.glb'],
    block : ['body-block.glb', 'center-block.glb'],
    taunt : ['standing-taunt-battlecry.glb', 'kneeling-pointing.glb'],
    jump  : ['jumping.glb', 'big-jump.glb'],
  },
  // Lundgren — l'érudit : gestuelle posée, magie lente.
  lundgren: {
    idle  : ['standing-idle-03.glb', 'standing-idle.glb', 'dwarf-idle.glb', 'looking.glb', 'pro-melee-axe-pack-standing-idle-looking-ver-1.glb'],
    walk  : ['great-sword-walk.glb', 'start-walking.glb', 'basic-shooter-pack-walking.glb'],
    run   : ['standing-sprint-forward.glb', 'run.glb'],
    attack: ['standing-1h-magic-attack-02.glb', 'spell-cast.glb', 'standing-1h-magic-attack-01.glb', 'fireball.glb'],
    cast  : ['standing-2h-cast-spell-01.glb', 'standing-1h-cast-spell-01.glb', 'standing-2h-magic-attack-04.glb', 'standing-2h-magic-attack-03.glb'],
    hit   : ['standing-react-small-from-left.glb', 'standing-react-small-from-front.glb', 'reaction.glb'],
    death : ['standing-react-death-left.glb', 'standing-react-death-backward.glb', 'falling-back-death.glb'],
    dodge : ['standing-dodge-right.glb', 'standing-dodge-left.glb'],
    block : ['body-block.glb', 'center-block.glb'],
    taunt : ['kneeling-pointing.glb', 'looking.glb'],
    jump  : ['jumping.glb'],
  },
  // Karen — la sentinelle : garde en bouclier, soins.
  karen: {
    idle  : ['sword-and-shield-block-idle.glb', 'pro-sword-and-shield-pack-sword-and-shield-block-idle.glb', 'standing-idle.glb', 'dwarf-idle-1.glb', 'lite-sword-and-shield-pack-sword-and-shield-idle.glb'],
    walk  : ['great-sword-walk.glb', 'sword-and-shield-pack-sword-and-shield-walk-2.glb'],
    run   : ['standing-sprint-forward.glb', 'lite-sword-and-shield-pack-sword-and-shield-run.glb'],
    attack: ['standing-1h-magic-attack-01.glb', 'standing-1h-magic-attack-03.glb', 'spell-cast.glb', 'lite-sword-and-shield-pack-sword-and-shield-attack-4.glb'],
    cast  : ['standing-2h-cast-spell-01.glb', 'standing-1h-cast-spell-01.glb', 'standing-2h-magic-attack-02.glb', 'pro-sword-and-shield-pack-sword-and-shield-power-up.glb'],
    hit   : ['standing-react-small-from-front.glb', 'sword-and-shield-block.glb', 'lite-sword-and-shield-pack-sword-and-shield-block.glb', 'standing-block-react-large.glb'],
    death : ['standing-react-death-left.glb', 'standing-react-death-right.glb', 'lite-sword-and-shield-pack-sword-and-shield-death.glb'],
    dodge : ['standing-dodge-left.glb', 'standing-dodge-forward.glb'],
    block : ['pro-sword-and-shield-pack-sword-and-shield-block-idle.glb', 'center-block.glb', 'body-block.glb'],
    taunt : ['standing-taunt-battlecry.glb'],
    jump  : ['jumping.glb'],
  },
  // Fulgence — le roc : grande épée, coups lourds, blocages.
  fulgence: {
    idle  : ['dwarf-idle.glb', 'dwarf-idle-1.glb', 'great-sword-pack-great-sword-idle.glb', 'great-sword-pack-great-sword-idle-2.glb', 'great-sword-pack-great-sword-idle-3.glb', 'great-sword-crouching-2.glb'],
    walk  : ['great-sword-walk-1.glb', 'great-sword-pack-great-sword-walk.glb', 'great-sword-pack-great-sword-walk-2.glb'],
    run   : ['great-sword-run.glb', 'great-sword-pack-great-sword-run.glb'],
    attack: ['great-sword-slash.glb', 'great-sword-slash-1.glb', 'great-sword-pack-great-sword-slash.glb', 'great-sword-pack-great-sword-slash-2.glb', 'great-sword-pack-great-sword-slash-3.glb', 'great-sword-pack-great-sword-slash-4.glb', 'great-sword-pack-great-sword-attack.glb', 'great-sword-pack-great-sword-high-spin-attack.glb', 'great-sword-kick.glb', 'great-sword-pack-great-sword-kick-2.glb', 'two-hand-sword-combo.glb'],
    cast  : ['great-sword-jump-attack.glb', 'great-sword-pack-great-sword-slide-attack.glb', 'two-hand-club-combo.glb', 'great-sword-pack-great-sword-jump-attack.glb'],
    hit   : ['great-sword-impact.glb', 'great-sword-pack-great-sword-impact.glb', 'great-sword-blocking-2.glb', 'standing-block-react-large.glb', 'great-sword-pack-great-sword-blocking.glb'],
    death : ['two-handed-sword-death.glb', 'great-sword-pack-two-handed-sword-death.glb', 'great-sword-pack-two-handed-sword-death-2.glb', 'falling-back-death.glb'],
    dodge : ['standing-dodge-backward.glb', 'standing-dodge-left.glb', 'standing-dodge-right.glb', 'standing-dodge-forward.glb'],
    block : ['great-sword-pack-great-sword-blocking.glb', 'great-sword-blocking-1.glb', 'center-block.glb'],
    taunt : ['pro-melee-axe-pack-standing-taunt-battlecry.glb', 'pro-melee-axe-pack-standing-taunt-chest-thump.glb'],
    jump  : ['great-sword-pack-great-sword-jump.glb', 'big-jump.glb'],
  },
  // Dark — l'ombre : furtif, capoeira, combos à deux armes.
  dark: {
    idle  : ['ninja-idle.glb', 'ginga-variation-3.glb', 'crouch-idle.glb', 'fight-idle-1.glb', 'sword-and-shield-crouch-idle.glb'],
    walk  : ['crouch-walk-forward.glb', 'walk-forward-arc.glb', 'left-cover-sneak.glb'],
    run   : ['running.glb', 'standing-sprint-forward.glb', 'run.glb'],
    attack: ['dual-weapon-combo-1.glb', 'one-hand-club-combo.glb', 'mutant-punch.glb', 'flying-knee-punch-combo.glb', 'capoeira-pack-chapa-giratoria-2.glb', 'capoeira-pack-bencao.glb', 'capoeira-pack-chapaeu-de-couro.glb', 'standing-melee-attack-downward.glb'],
    cast  : ['butterfly-twirl.glb', 'run-to-rolling.glb', 'capoeira-pack-au.glb', 'capoeira-pack-au-to-role.glb', 'running-forward-flip.glb'],
    hit   : ['standing-react-small-from-left.glb', 'reaction.glb', 'standing-react-small-from-front.glb'],
    death : ['standing-react-death-right.glb', 'falling-forward-death.glb', 'standing-react-death-backward.glb'],
    dodge : ['capoeira-pack-esquiva-4.glb', 'capoeira-pack-esquiva-5.glb', 'dodging.glb', 'standing-dodge-right.glb'],
    block : ['inward-block.glb', 'center-block.glb'],
    taunt : ['capoeira-pack-capoeira.glb', 'silly-dancing.glb'],
    jump  : ['running-forward-flip.glb', 'big-jump.glb', 'jumping.glb'],
  },
  // Sbires alliés.
  sbire: {
    idle  : ['standing-idle.glb', 'sword-and-shield-idle-2.glb', 'dwarf-idle.glb', 'lite-sword-and-shield-pack-sword-and-shield-idle.glb', 'fight-idle.glb'],
    walk  : ['great-sword-walk.glb', 'start-walking.glb', 'basic-shooter-pack-walking.glb'],
    run   : ['great-sword-run.glb', 'running.glb', 'run.glb'],
    attack: ['punching.glb', 'sword-and-shield-kick.glb', 'mutant-punch.glb', 'sword-and-shield-attack-1.glb', 'lite-sword-and-shield-pack-sword-and-shield-attack.glb', 'fist-fight-b.glb', 'boxing.glb'],
    cast  : [],
    hit   : ['standing-react-small-from-front.glb', 'reaction.glb', 'standing-block-react-large.glb'],
    death : ['falling-back-death.glb', 'standing-react-death-left.glb', 'standing-react-death-right.glb', 'falling-forward-death.glb'],
    dodge : ['standing-dodge-left.glb', 'dodging.glb'],
    block : ['center-block.glb', 'body-block.glb'],
    taunt : ['standing-taunt-battlecry.glb'],
    jump  : ['jumping.glb'],
  },
  // Sylla — le commissaire : gestes secs, arme de poing, autorité.
  sylla: {
    idle  : ['standing-idle.glb', 'standing-idle-03.glb', 'pro-rifle-pack-idle.glb', 'dwarf-idle-1.glb'],
    walk  : ['pro-rifle-pack-walk-forward.glb', 'great-sword-walk.glb', 'basic-shooter-pack-walking.glb'],
    run   : ['pro-rifle-pack-run-forward.glb', 'standing-sprint-forward.glb', 'running.glb'],
    attack: ['standing-melee-attack-downward.glb', 'pro-melee-axe-pack-standing-melee-attack-horizontal.glb', 'punching.glb', 'basic-shooter-pack-firing-rifle.glb', 'standing-1h-magic-attack-01.glb', 'headbutt.glb'],
    cast  : ['standing-2h-magic-attack-02.glb', 'spell-cast.glb', 'standing-1h-cast-spell-01.glb'],
    hit   : ['standing-react-small-from-front.glb', 'standing-block-react-large.glb', 'reaction.glb'],
    death : ['falling-back-death.glb', 'standing-react-death-backward.glb', 'standing-react-death-right.glb'],
    dodge : ['standing-dodge-left.glb', 'standing-dodge-right.glb', 'dodging.glb'],
    block : ['center-block.glb', 'body-block.glb'],
    taunt : ['standing-taunt-battlecry.glb'],
    jump  : ['jumping.glb'],
  },
  // Schissin-Rouge — le tank de la police : garde basse, coups lourds.
  schissin: {
    idle  : ['dwarf-idle.glb', 'dwarf-idle-2.glb', 'pro-melee-axe-pack-standing-idle.glb', 'pro-sword-and-shield-pack-sword-and-shield-idle.glb'],
    walk  : ['pro-melee-axe-pack-standing-walk-forward.glb', 'great-sword-walk.glb'],
    run   : ['great-sword-run.glb', 'pro-melee-axe-pack-standing-run-forward.glb'],
    attack: ['pro-melee-axe-pack-standing-melee-attack-downward.glb', 'pro-melee-axe-pack-standing-melee-attack-horizontal.glb', 'pro-melee-axe-pack-standing-melee-attack-backhand.glb', 'headbutt.glb', 'pro-melee-axe-pack-standing-melee-attack-360-high.glb', 'punching.glb'],
    cast  : ['pro-melee-axe-pack-standing-taunt-battlecry.glb', 'standing-2h-magic-attack-03.glb'],
    hit   : ['pro-melee-axe-pack-standing-block-react-large.glb', 'standing-block-react-large.glb', 'reaction.glb'],
    death : ['two-handed-sword-death.glb', 'falling-forward-death.glb', 'standing-react-death-left.glb'],
    dodge : ['standing-dodge-backward.glb', 'standing-dodge-left.glb'],
    block : ['pro-melee-axe-pack-standing-block-idle.glb', 'center-block.glb', 'body-block.glb'],
    taunt : ['pro-melee-axe-pack-standing-taunt-chest-thump.glb', 'standing-taunt-battlecry.glb'],
    jump  : ['pro-melee-axe-pack-standing-jump.glb'],
  },
  // Ousmane — sécurité du port : postures de tir, rechargements, grenades.
  ousmane: {
    idle  : ['pro-rifle-pack-idle.glb', 'basic-shooter-pack-rifle-aiming-idle.glb', 'rifle-idle.glb', 'pro-rifle-pack-idle-aiming.glb'],
    walk  : ['pro-rifle-pack-walk-forward.glb', 'basic-shooter-pack-walking.glb', 'basic-shooter-pack-walking.glb'],
    run   : ['pro-rifle-pack-run-forward.glb', 'pro-rifle-pack-sprint-forward.glb', 'running.glb'],
    attack: ['basic-shooter-pack-firing-rifle.glb', 'basic-shooter-pack-1-firing-rifle.glb', 'basic-shooter-pack-1-toss-grenade.glb', 'basic-shooter-pack-rifle-aiming-idle.glb'],
    cast  : ['basic-shooter-pack-reloading.glb', 'basic-shooter-pack-1-reloading.glb', 'basic-shooter-pack-toss-grenade.glb'],
    hit   : ['basic-shooter-pack-hit-reaction.glb', 'standing-react-small-from-front.glb', 'reaction.glb'],
    death : ['pro-rifle-pack-death-from-the-front.glb', 'falling-back-death.glb', 'standing-react-death-backward.glb'],
    dodge : ['pro-rifle-pack-walk-left.glb', 'pro-rifle-pack-walk-right.glb', 'standing-dodge-forward.glb'],
    block : ['body-block.glb', 'center-block.glb'],
    taunt : ['standing-taunt-battlecry.glb'],
    jump  : ['jumping.glb'],
  },
  // Sub — l'opérateur : furtif, lame, économie de mouvement.
  sub: {
    idle  : ['ninja-idle.glb', 'fight-idle.glb', 'crouch-idle.glb', 'fight-idle-1.glb'],
    walk  : ['crouch-walk-forward.glb', 'walk-forward-arc.glb', 'left-cover-sneak.glb'],
    run   : ['running.glb', 'standing-sprint-forward.glb'],
    attack: ['dual-weapon-combo.glb', 'dual-weapon-combo-1.glb', 'standing-melee-attack-downward.glb', 'one-hand-club-combo.glb', 'mutant-punch.glb'],
    cast  : ['run-to-rolling.glb', 'butterfly-twirl.glb', 'dodging.glb'],
    hit   : ['standing-react-small-from-left.glb', 'reaction.glb'],
    death : ['standing-react-death-right.glb', 'falling-forward-death.glb'],
    dodge : ['standing-dodge-right.glb', 'standing-dodge-left.glb', 'dodging.glb'],
    block : ['inward-block.glb', 'center-block.glb'],
    taunt : ['standing-taunt-battlecry.glb'],
    jump  : ['jumping.glb', 'big-jump.glb'],
  },
  // Grob — la masse : lent, brutal, grande lame.
  grob: {
    idle  : ['dwarf-idle-2.glb', 'orc-idle.glb', 'pro-melee-axe-pack-standing-idle-looking-ver-1.glb', 'great-sword-pack-great-sword-idle.glb'],
    walk  : ['orc-walk.glb', 'great-sword-pack-great-sword-walk.glb'],
    run   : ['great-sword-run.glb', 'pro-melee-axe-pack-standing-run-forward.glb'],
    attack: ['great-sword-pack-great-sword-slash.glb', 'great-sword-pack-great-sword-slash-2.glb', 'great-sword-slash.glb', 'headbutt.glb', 'pro-melee-axe-pack-standing-melee-attack-360-high.glb', 'mutant-punch.glb'],
    cast  : ['great-sword-pack-great-sword-jump-attack.glb', 'pro-melee-axe-pack-standing-taunt-chest-thump.glb'],
    hit   : ['great-sword-pack-great-sword-impact.glb', 'standing-block-react-large.glb', 'pro-melee-axe-pack-standing-block-react-large.glb'],
    death : ['great-sword-pack-two-handed-sword-death.glb', 'falling-forward-death.glb', 'two-handed-sword-death.glb'],
    dodge : ['standing-dodge-backward.glb', 'standing-dodge-right.glb'],
    block : ['great-sword-pack-great-sword-blocking.glb', 'pro-melee-axe-pack-standing-block-idle.glb'],
    taunt : ['pro-melee-axe-pack-standing-taunt-battlecry.glb'],
    jump  : ['big-jump.glb'],
  },
  // Krag — l'obsidienne : implacable, ne recule jamais.
  krag: {
    idle  : ['dwarf-idle-1.glb', 'orc-idle.glb', 'pro-melee-axe-pack-standing-idle-looking-ver-2.glb', 'standing-idle-03.glb'],
    walk  : ['orc-walk.glb', 'pro-melee-axe-pack-standing-walk-forward.glb'],
    run   : ['great-sword-run.glb', 'standing-sprint-forward.glb'],
    attack: ['pro-melee-axe-pack-standing-melee-attack-downward.glb', 'pro-melee-axe-pack-standing-melee-attack-horizontal.glb', 'headbutt.glb', 'pro-melee-axe-pack-standing-melee-attack-kick-ver-1.glb', 'punching.glb'],
    cast  : ['pro-melee-axe-pack-standing-taunt-chest-thump.glb', 'standing-2h-magic-attack-03.glb'],
    hit   : ['pro-melee-axe-pack-standing-block-react-large.glb', 'standing-block-react-large.glb'],
    death : ['falling-back-death.glb', 'two-handed-sword-death.glb'],
    dodge : ['standing-dodge-backward.glb'],
    block : ['pro-melee-axe-pack-standing-block-idle.glb', 'body-block.glb'],
    taunt : ['pro-melee-axe-pack-standing-taunt-battlecry.glb'],
    jump  : ['pro-melee-axe-pack-standing-jump.glb'],
  },
  // Murk — l'émissaire liquide : ondulant, magie de glace.
  murk: {
    idle  : ['standing-idle.glb', 'looking.glb', 'standing-idle-03.glb', 'dwarf-idle.glb'],
    walk  : ['great-sword-walk.glb', 'basic-shooter-pack-walking.glb'],
    run   : ['standing-sprint-forward.glb', 'running.glb'],
    attack: ['standing-1h-magic-attack-02.glb', 'standing-1h-magic-attack-03.glb', 'fireball.glb', 'spell-cast.glb'],
    cast  : ['standing-2h-magic-attack-04.glb', 'standing-2h-cast-spell-01.glb', 'standing-2h-magic-attack-02.glb', 'standing-1h-cast-spell-01.glb'],
    hit   : ['standing-react-small-from-left.glb', 'reaction.glb'],
    death : ['standing-react-death-backward.glb', 'falling-back-death.glb'],
    dodge : ['standing-dodge-forward.glb', 'dodging.glb'],
    block : ['body-block.glb'],
    taunt : ['standing-taunt-battlecry.glb'],
    jump  : ['jumping.glb'],
  },
  // Vael — la lame invisible : capoeira, vitesse pure.
  vael: {
    idle  : ['ginga-variation-3.glb', 'bouncing-fight-idle.glb', 'fight-idle-1.glb', 'ninja-idle.glb'],
    walk  : ['walk-forward-arc.glb', 'start-walking.glb'],
    run   : ['running.glb', 'standing-sprint-forward.glb', 'run.glb'],
    attack: ['capoeira-pack-armada.glb', 'capoeira-pack-chapa-giratoria.glb', 'inside-crescent-kick.glb', 'dual-weapon-combo.glb', 'flying-knee-punch-combo.glb', 'butterfly-twirl.glb'],
    cast  : ['running-forward-flip.glb', 'capoeira-pack-au-to-role.glb', 'drop-kick.glb'],
    hit   : ['standing-react-small-from-front.glb', 'reaction.glb'],
    death : ['standing-react-death-right.glb', 'falling-forward-death.glb'],
    dodge : ['capoeira-pack-esquiva-1.glb', 'capoeira-pack-esquiva-4.glb', 'dodging.glb', 'standing-dodge-left.glb'],
    block : ['inward-block.glb', 'center-block.glb'],
    taunt : ['capoeira-pack-capoeira.glb'],
    jump  : ['running-forward-flip.glb', 'big-jump.glb'],
  },
  // Sgrün — l'entité : lenteur souveraine, grands sorts.
  sgrun: {
    idle  : ['standing-idle-03.glb', 'looking.glb', 'standing-idle.glb'],
    walk  : ['great-sword-walk.glb'],
    run   : ['standing-sprint-forward.glb'],
    attack: ['standing-2h-magic-attack-02.glb', 'standing-2h-magic-attack-03.glb', 'standing-1h-magic-attack-01.glb', 'fireball.glb'],
    cast  : ['standing-2h-cast-spell-01.glb', 'standing-2h-magic-attack-04.glb', 'spell-cast.glb', 'standing-1h-cast-spell-01.glb'],
    hit   : ['standing-react-small-from-front.glb', 'standing-block-react-large.glb'],
    death : ['standing-react-death-backward.glb', 'falling-back-death.glb'],
    dodge : ['standing-dodge-forward.glb'],
    block : ['body-block.glb'],
    taunt : ['standing-taunt-battlecry.glb', 'kneeling-pointing.glb'],
    jump  : ['jumping.glb'],
  },
  // Sbires ennemis (orcs) : hache et corps-à-corps brutal.
  // Kankou Moussa — l'Empereur : sceptre en main, sorts à deux mains, posture royale.
  kankou: {
    idle  : ['standing-idle-03.glb', 'standing-idle.glb', 'looking.glb'],
    walk  : ['great-sword-walk.glb', 'start-walking.glb'],
    run   : ['standing-sprint-forward.glb', 'running.glb'],
    attack: ['standing-1h-magic-attack-01.glb', 'standing-2h-magic-attack-02.glb', 'standing-2h-magic-attack-03.glb', 'standing-1h-magic-attack-02.glb'],
    cast  : ['standing-2h-cast-spell-01.glb', 'standing-2h-magic-attack-04.glb', 'spell-cast.glb', 'standing-1h-cast-spell-01.glb'],
    hit   : ['standing-react-small-from-front.glb', 'standing-block-react-large.glb'],
    death : ['standing-react-death-backward.glb', 'falling-back-death.glb'],
    dodge : ['standing-dodge-backward.glb', 'standing-dodge-left.glb'],
    block : ['body-block.glb', 'center-block.glb'],
    taunt : ['standing-taunt-battlecry.glb'],
    jump  : ['jumping.glb'],
  },
  // Yasuke — le samouraï : grande lame à deux mains, gardes basses, coupes amples.
  yasuke: {
    idle  : ['great-sword-pack-great-sword-idle.glb', 'great-sword-pack-great-sword-idle-2.glb', 'great-sword-pack-great-sword-idle-3.glb'],
    walk  : ['great-sword-walk-1.glb', 'great-sword-pack-great-sword-walk.glb'],
    run   : ['great-sword-run.glb', 'great-sword-pack-great-sword-run.glb'],
    attack: ['great-sword-slash.glb', 'great-sword-pack-great-sword-slash.glb', 'great-sword-pack-great-sword-slash-2.glb', 'great-sword-pack-great-sword-slash-3.glb', 'great-sword-slash-1.glb', 'great-sword-pack-great-sword-attack.glb'],
    cast  : ['great-sword-pack-great-sword-high-spin-attack.glb', 'great-sword-pack-great-sword-slide-attack.glb', 'great-sword-jump-attack.glb'],
    hit   : ['great-sword-impact.glb', 'great-sword-pack-great-sword-impact.glb', 'great-sword-pack-great-sword-blocking.glb'],
    death : ['two-handed-sword-death.glb', 'great-sword-pack-two-handed-sword-death.glb', 'falling-back-death.glb'],
    dodge : ['standing-dodge-backward.glb', 'standing-dodge-left.glb', 'standing-dodge-right.glb'],
    block : ['great-sword-pack-great-sword-blocking.glb', 'great-sword-blocking-1.glb'],
    taunt : ['pro-melee-axe-pack-standing-taunt-battlecry.glb'],
    jump  : ['great-sword-pack-great-sword-jump.glb'],
  },
  orc: {
    idle  : ['orc-idle.glb', 'dwarf-idle-2.glb', 'pro-melee-axe-pack-standing-idle.glb', 'pro-melee-axe-pack-standing-idle-looking-ver-2.glb'],
    walk  : ['orc-walk.glb', 'pro-melee-axe-pack-standing-walk-forward.glb'],
    run   : ['great-sword-run.glb', 'pro-melee-axe-pack-standing-run-forward.glb'],
    attack: ['mutant-punch.glb', 'headbutt.glb', 'punching.glb', 'pro-melee-axe-pack-standing-melee-attack-downward.glb', 'pro-melee-axe-pack-standing-melee-attack-horizontal.glb', 'pro-melee-axe-pack-standing-melee-attack-backhand.glb', 'pro-melee-axe-pack-standing-melee-attack-360-high.glb', 'pro-melee-axe-pack-standing-melee-attack-kick-ver-1.glb', 'great-sword-kick-1.glb'],
    cast  : [],
    hit   : ['receive-uppercut-to-the-face.glb', 'reaction.glb', 'pro-melee-axe-pack-standing-block-react-large.glb'],
    death : ['falling-forward-death.glb', 'falling-back-death.glb', 'standing-react-death-backward.glb', 'two-handed-sword-death.glb'],
    dodge : ['standing-dodge-right.glb', 'dodging.glb'],
    block : ['pro-melee-axe-pack-standing-block-idle.glb', 'center-block.glb'],
    taunt : ['pro-melee-axe-pack-standing-taunt-battlecry.glb'],
    jump  : ['pro-melee-axe-pack-standing-jump.glb'],
  },
};

// ---------------------------------------------------------------
// MODE COMBAT — clips de boxe (pack « boxe-* », Mixamo). Ils sont
// courts et lisibles, choisis pour la durée réelle des coups du duel
// (léger ≈ 0,37 s, lourd ≈ 0,7 s) :
//   • punchLight : les trois coups légers d'un enchaînement (jab,
//     direct, crochet), un clip différent à chaque étape ;
//   • punchHeavy : le coup lourd qui conclut ;
//   • hitLight / hitHeavy : réactions à un coup reçu, à la tête ou au
//     corps, plus fortes sur un coup lourd.
// Les réactions servent à tout le monde. Les coups de poing, seulement
// à ceux qui se battent à mains nues (ou dont l'arme ne sert pas au
// corps-à-corps) : un épéiste garde ses coups d'épée.
// ---------------------------------------------------------------
const FIGHT_HITS = {
  hitLight: ['boxe-light-hit-to-head.glb', 'boxe-medium-hit-to-head.glb', 'boxe-hit-to-body.glb', 'boxe-light-hit-to-head-1.glb', 'boxe-head-hit-8.glb', 'boxe-medium-hit-to-head-1.glb', 'boxe-light-hit-to-head-2.glb', 'boxe-receive-punch-to-the-face.glb', 'boxe-medium-hit-to-head-2.glb'],
  hitHeavy: ['boxe-big-hit-to-head-2.glb', 'boxe-receive-uppercut-to-the-face.glb', 'boxe-big-hit-to-head-4.glb', 'boxe-head-hit.glb'],
};
const FIGHT_PUNCHES = {
  punchLight: ['boxe-punching-2.glb', 'boxe-punching-1.glb', 'boxe-right-hook.glb', 'boxe-hook.glb', 'boxe-punching-3.glb'],
  punchHeavy: ['boxe-uppercut.glb', 'boxe-mutant-punch.glb', 'boxe-elbow-punching.glb'],
};
// Profils qui se battent avec une arme de mêlée : pas de coups de poing.
const ARMED_MELEE = new Set(['tarine', 'fulgence', 'dark', 'karen', 'sub', 'grob', 'krag', 'vael']);
for(const [name, prof] of Object.entries(PROFILES)){
  prof.fight = { ...FIGHT_HITS, ...(ARMED_MELEE.has(name) ? {} : FIGHT_PUNCHES) };
}

const PROFILE_BY_KEY = {
  TARINE:'tarine', BABA:'baba', SAM:'sam', LUNDGREN:'lundgren', KAREN:'karen', FULGENCE:'fulgence', DARK:'dark',
  SYLLA:'sylla', SCHISSIN:'schissin', OUSMANE:'ousmane', SUB:'sub', GROB:'grob',
  KRAG:'krag', MURK:'murk', VAEL:'vael', SGRUN:'sgrun', KANKOU:'kankou', YASUKE:'yasuke',
  // Nouveaux venus : même gestuelle qu'un personnage de même arme.
  ADANDE:'vael', DINGANE:'karen', CENDRE:'kankou', CHRONOPHAGE:'sam', SKYGGE:'yasuke',
};
/** Animation « maison » d'un personnage (1er idle de son profil), pour
 *  les cartes animées du Codex. Les PNJ sans profil gardent une posture calme. */
export function homeIdleFor(castKey){
  const k = castKey === 'BABA_TUNDE' ? 'BABA' : castKey;
  return PROFILES[PROFILE_BY_KEY[k]]?.idle[0] || 'standing-idle.glb';
}
function profileForUnit(u){
  if(u.kind === 'minion') return PROFILES[u.team === 0 ? 'sbire' : 'orc'];
  return PROFILES[PROFILE_BY_KEY[u.key]] || PROFILES.tarine;
}

// Correspondance monde Pixi (px) -> monde Babylon (unités 3D = mètres).
const WORLD_SCALE = 45;
// Inclinaison de la caméra (angle depuis la verticale). 45° : voir _syncCameraFromPixi.
const CAM_BETA = Math.PI / 4;
// Au-dessus de cette vitesse (px/s) l'unité est « en mouvement ».
const MOVE_SPEED_MIN = 25;
// Sous cette vitesse réelle (m/s) on marche, au-dessus on court.
const RUN_THRESHOLD = 2.6;
// Vitesse de rotation max du personnage (rad/s).
const TURN_SPEED = 12;
// Durée pendant laquelle un corps reste visible après sa mort (s).
const CORPSE_TIME = 3.2;

function pick(list, avoid){
  if(!list || !list.length) return null;
  if(list.length === 1) return list[0];
  let c;
  do { c = list[Math.floor(Math.random() * list.length)]; } while(c === avoid);
  return c;
}
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function angleLerp(a, b, t){
  let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * t;
}

export class BabylonUnits{
  constructor(mount, pixiRenderer){
    this.mount = mount;
    this.pixiRenderer = pixiRenderer;
    this.instances = new Map();        // unit.id -> instance
    this.structures = new Map();       // unit.id -> { pivot, ready } (autel)
    this._modelCache = new Map();      // modelFile -> Promise<AssetContainer>
    this._animSourceCache = new Map(); // animFile -> Promise<AssetContainer>
    this._propCache = new Map();       // propFile -> Promise<AssetContainer> (armes, objets statiques)

    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '0';
    // Explicite malgré la valeur par défaut CSS, pour éviter toute
    // ambiguïté de pile selon le navigateur (voir renderer.js).
    // ⚠️ Ne JAMAIS écraser la position CSS du mount : #game-mount est
    // `position:absolute; inset:0` dans layout.css. Le forcer en
    // `relative` (ancien code) lui donnait une hauteur de 0 px → canvas
    // Babylon de 0 px de haut → terrain et personnages invisibles en
    // combat (seul le HUD PixiJS/DOM restait visible). On ne corrige que
    // si le mount est réellement `static`.
    if(getComputedStyle(mount).position === 'static') mount.style.position = 'relative';
    mount.appendChild(this.canvas);

    this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.03, 1);
    console.log('[BabylonUnits] moteur créé, canvas', this.canvas.width, 'x', this.canvas.height);

    // Fondu enchaîné entre deux clips (≈ 0,15 s) : plus de sauts de pose
    // quand on passe d'idle à la course ou d'une attaque à l'autre.
    this.scene.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
    this.scene.animationPropertiesOverride.enableBlending = true;
    this.scene.animationPropertiesOverride.blendingSpeed = 0.1;

    this._buildCamera();
    this._buildLights();
    // Graphismes (qualité, halo, ombres, environnement, particules, météo).
    this.gfx = new Graphics(this);
    (this.scene.metadata = this.scene.metadata || {}).gfx = this.gfx;

    let _frameCount = 0;
    this.engine.runRenderLoop(() => {
      this._syncCameraFromPixi();
      this.gfx.update();
      this.scene.render();
      _frameCount++;
      if(_frameCount === 1){
        console.log('[BabylonUnits] frame', _frameCount,
          '| caméra target=', this.camera.target.asArray().map(n=>n.toFixed(1)),
          'radius=', this.camera.radius.toFixed(1),
          '| meshes dans la scène=', this.scene.meshes.length,
          '| canvas taille=', this.engine.getRenderWidth(), 'x', this.engine.getRenderHeight());
      }
    });

    this._resizeObserver = new ResizeObserver(() => this.engine.resize());
    this._resizeObserver.observe(mount);
  }

  _buildCamera(){
    // Caméra ORTHOGRAPHIQUE inclinée à 45°, calée pixel pour pixel sur la
    // caméra 2D de PixiJS (voir _syncCameraFromPixi). L'ancienne caméra
    // perspective ne correspondait pas à la projection PixiJS : l'Autel,
    // l'anneau du joueur et les barres de vie (dessinés en 2D) n'étaient
    // pas au même endroit que le sol et les personnages 3D.
    const cam = new BABYLON.ArcRotateCamera(
      'cam', -Math.PI / 2, CAM_BETA, 100,
      new BABYLON.Vector3(0, 0, 0), this.scene
    );
    cam.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    cam.minZ = 0.1;
    cam.maxZ = 1000;
    cam.lowerBetaLimit = cam.upperBetaLimit = cam.beta;
    cam.lowerAlphaLimit = cam.upperAlphaLimit = cam.alpha;
    cam.lowerRadiusLimit = cam.upperRadiusLimit = cam.radius;
    cam.inputs.clear();
    this.camera = cam;
  }

  _buildLights(){
    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0.3, 1, 0.2), this.scene);
    hemi.intensity = 0.85;
    hemi.groundColor = new BABYLON.Color3(0.12, 0.10, 0.15);
    const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.5, -1, -0.3), this.scene);
    sun.intensity = 1.1;
    sun.position = new BABYLON.Vector3(20, 40, 20);
  }

  _pixiToBabylon(x, y){
    return new BABYLON.Vector3(x / WORLD_SCALE, 0, -y / WORLD_SCALE);
  }

  /** Même conversion, mais posée SUR le sol (relief du terrain). */
  _groundPos(x, y){
    const v = this._pixiToBabylon(x, y);
    const gh = this.scene.metadata?.groundHeight;
    if(gh) v.y = gh(v.x, v.z);
    return v;
  }

  /**
   * MODE COMBAT — caméra de jeu de combat (façon Tekken) : en perspective,
   * basse, qui reste PERPENDICULAIRE à l'axe des deux combattants et tourne
   * avec eux. Elle remplace la caméra orthographique couplée au rendu 2D ;
   * tant qu'elle est active, la couche PixiJS est projetée à l'écran par
   * `projectToScreen()` au lieu d'être posée à plat sur le monde.
   *
   * @param {object|null} o  { ax, ay, bx, by } positions Pixi des deux
   *   combattants, ou null pour revenir à la caméra normale.
   */
  setDuelCamera(o){
    if(!o){
      if(this._duelCam){ this.gfx?.detachCamera(this._duelCam); this._duelCam.dispose(); this._duelCam = null; this.scene.activeCamera = this.camera; }
      return;
    }
    const BB = window.BABYLON;
    if(!this._duelCam){
      const c = new BB.UniversalCamera('duelCam', new BB.Vector3(0, 2, -6), this.scene);
      c.fov = 0.82;            // ~47°, cadrage serré mais sans déformation
      c.minZ = 0.15; c.maxZ = 400;
      c.inputs.clear();
      this._duelCam = c;
      this.gfx?.attachCamera(c);
      this._duelYaw = null;
      this._duelPunch = 0;
    }
    const cam = this._duelCam;
    this.scene.activeCamera = cam;

    const A = this._pixiToBabylon(o.ax, o.ay);
    const B = this._pixiToBabylon(o.bx, o.by);
    const mid = A.add(B).scale(0.5);
    const sep = BB.Vector3.Distance(A, B);

    // Axe des combattants, puis la perpendiculaire : la caméra se place
    // toujours sur le côté, pour qu'aucun des deux ne cache l'autre.
    let ax = B.x - A.x, az = B.z - A.z;
    const L = Math.hypot(ax, az) || 1; ax /= L; az /= L;
    let yaw = Math.atan2(-ax, az);      // perpendiculaire à l'axe
    // On garde le côté courant : sans ça, la caméra bascule d'un bord à
    // l'autre dès que les combattants échangent leurs places.
    if(this._duelYaw != null){
      const d = ((yaw - this._duelYaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      if(Math.abs(d) > Math.PI / 2) yaw += Math.PI;
      this._duelYaw = angleLerp(this._duelYaw, yaw, 0.06);
    } else this._duelYaw = yaw;
    yaw = this._duelYaw;

    // Recul selon l'écartement : serré au corps-à-corps, large quand ils
    // prennent leurs distances. Le « punch » rapproche d'un coup à l'impact.
    this._duelPunch = Math.max(0, (this._duelPunch || 0) - 0.06);
    let dist = clamp(4.4 + sep * 0.75, 4.4, 10.5) - this._duelPunch;
    const height = 1.75 + sep * 0.05;
    const look = mid.add(new BB.Vector3(0, 1.15, 0));

    // Le décor arrête la caméra : elle ne recule jamais dans une maison ni
    // derrière un mur (on voyait le duel depuis l'intérieur des murs). Si
    // son côté est bouché et que l'autre est dégagé, elle passe de l'autre
    // côté des combattants ; sinon elle se rapproche.
    const mpx = (o.ax + o.bx) / 2, mpy = (o.ay + o.by) / 2;
    const room = this._cameraRoom(mpx, mpy, yaw, height);
    if(room < Math.min(dist, 4.2)){
      const other = this._cameraRoom(mpx, mpy, yaw + Math.PI, height);
      if(other > room + 1){ this._duelYaw = yaw = yaw + Math.PI; dist = Math.min(dist, other); }
      else dist = Math.min(dist, room);
    }
    dist = Math.max(1.6, dist);
    const want = new BB.Vector3(
      look.x + Math.sin(yaw) * dist,
      height + this._shakeY(),
      look.z + Math.cos(yaw) * dist,
    );
    // Lissage : la caméra ne saute jamais, elle glisse.
    cam.position = BB.Vector3.Lerp(cam.position, want, 0.14);
    this._duelLook = BB.Vector3.Lerp(this._duelLook || look, look, 0.2);
    cam.setTarget(this._duelLook);
    this._duelCamYaw = yaw;
  }

  /** Obstacles du décor et bords de l'arène (Pixi), pour la caméra de combat. */
  setCameraObstacles(list, arena){
    this._camObstacles = list || [];
    this._camArena = arena || null;
  }

  /**
   * Recul libre (en mètres) de la caméra depuis le point visé (Pixi), dans
   * la direction `yaw`, avant de toucher un obstacle plus haut qu'elle ou
   * de sortir de l'arène. 0,4 m de marge pour que l'objectif ne rase pas
   * le mur.
   */
  _cameraRoom(px, py, yaw, camH){
    const dx = Math.sin(yaw), dy = -Math.cos(yaw);   // direction en Pixi
    let best = 12 * WORLD_SCALE;
    const A = this._camArena;
    if(A){
      if(dx > 1e-6) best = Math.min(best, (A.x1 - px) / dx); else if(dx < -1e-6) best = Math.min(best, (A.x0 - px) / dx);
      if(dy > 1e-6) best = Math.min(best, (A.y1 - py) / dy); else if(dy < -1e-6) best = Math.min(best, (A.y0 - py) / dy);
    }
    for(const o of this._camObstacles || []){
      if((o.h ?? 2) < camH - 0.25) continue;   // muret, buisson : la caméra passe au-dessus
      const ox = px - o.x, oy = py - o.y;
      let t;
      if(o.hw != null){
        // Rayon contre rectangle orienté (méthode des dalles).
        const vx = -o.uy, vy = o.ux;
        const lx = ox * o.ux + oy * o.uy, ly = ox * vx + oy * vy;
        const ldx = dx * o.ux + dy * o.uy, ldy = dx * vx + dy * vy;
        let t0 = 0, t1 = best;
        for(const [p, d, e] of [[lx, ldx, o.hw], [ly, ldy, o.hd]]){
          if(Math.abs(d) < 1e-9){ if(Math.abs(p) > e){ t0 = Infinity; break; } continue; }
          let a = (-e - p) / d, b = (e - p) / d;
          if(a > b){ const c = a; a = b; b = c; }
          t0 = Math.max(t0, a); t1 = Math.min(t1, b);
          if(t0 > t1){ t0 = Infinity; break; }
        }
        t = t0;
      } else {
        const bq = ox * dx + oy * dy, c = ox * ox + oy * oy - o.r * o.r;
        if(c <= 0) continue;                    // déjà dedans (tronc au milieu) : on ignore
        const disc = bq * bq - c;
        if(disc < 0) continue;
        t = -bq - Math.sqrt(disc);
        if(t < 0) continue;
      }
      if(t < best) best = t;
    }
    return Math.max(0, best / WORLD_SCALE - 0.4);
  }

  _shakeY(){
    if(!this._shakeT || this._shakeT <= 0) return 0;
    this._shakeT -= 0.016;
    return (Math.random() - 0.5) * this._shakeMag * Math.max(0, this._shakeT);
  }

  /** Secousse + rapprochement bref : à déclencher sur un coup qui porte. */
  duelImpact(heavy){
    this._duelPunch = Math.min(1.1, (this._duelPunch || 0) + (heavy ? 0.75 : 0.3));
    this._shakeT = heavy ? 0.22 : 0.12;
    this._shakeMag = heavy ? 0.5 : 0.22;
  }

  /** Orientation de la caméra de duel (rad) — sert à orienter les commandes. */
  duelCameraYaw(){ return this._duelCamYaw || 0; }

  /**
   * Projette un point du monde Pixi vers les coordonnées écran, avec la
   * vraie matrice de la caméra active. C'est ce qui permet de garder les
   * chiffres de dégâts et les impacts 2D calés sur la scène en perspective.
   */
  projectToScreen(px, py, hUnits = 0){
    const BB = window.BABYLON;
    const cam = this.scene.activeCamera;
    if(!cam) return null;
    const p = this._pixiToBabylon(px, py);
    p.y += hUnits;
    const e = this.engine;
    const v = BB.Vector3.Project(
      p,
      BB.Matrix.Identity(),
      this.scene.getTransformMatrix(),
      cam.viewport.toGlobal(e.getRenderWidth(), e.getRenderHeight()),
    );
    return { x: v.x, y: v.y, depth: v.z };
  }

  _syncCameraFromPixi(){
    if(this._duelCam && this.scene.activeCamera === this._duelCam) return;
    const pc = this.pixiRenderer.camera;
    if(!pc) return;
    this.camera.target.copyFrom(this._pixiToBabylon(pc.x, pc.y));
    const z = Math.max((pc.baseZoom || 1) * (pc.zoom || 1), 0.05);
    const scr = this.pixiRenderer.app?.screen;
    const vw = scr?.width  || this.canvas.clientWidth  || 1;
    const vh = scr?.height || this.canvas.clientHeight || 1;
    // Demi-largeur/hauteur visibles, en unités Babylon, identiques à
    // celles de PixiJS (px / zoom / WORLD_SCALE). En vertical, un
    // déplacement au sol est vu raccourci de cos(beta) par la caméra
    // inclinée : on applique le même facteur pour que le sol 3D tombe
    // exactement sous les éléments 2D. À 45°, la hauteur des
    // personnages garde ses proportions (sin/cos = 1).
    const halfW = (vw / 2) / z / WORLD_SCALE;
    const halfH = (vh / 2) / z / WORLD_SCALE * Math.cos(CAM_BETA);
    this.camera.orthoLeft = -halfW;
    this.camera.orthoRight = halfW;
    this.camera.orthoTop = halfH;
    this.camera.orthoBottom = -halfH;
  }

  /** Charge (ou récupère du cache) le conteneur GLB source d'un modèle de personnage. */
  _loadModel(fileName){
    if(!this._modelCache.has(fileName)){
      this._modelCache.set(fileName,
        BABYLON.SceneLoader.LoadAssetContainerAsync(GLB_BASE, fileName, this.scene));
    }
    return this._modelCache.get(fileName);
  }

  /** Charge (ou récupère du cache) un objet statique — arme, décor. */
  _loadProp(fileName){
    if(!this._propCache.has(fileName)){
      this._propCache.set(fileName,
        BABYLON.SceneLoader.LoadAssetContainerAsync(PROPS_BASE, fileName, this.scene));
    }
    return this._propCache.get(fileName);
  }

  /**
   * Attache les armes d'un champion à ses os de main (WEAPON_BY_KEY).
   * Un objet statique parenté à un os de squelette suit son animation
   * comme n'importe quel enfant de la scène — pas besoin de rig propre
   * à l'arme, Babylon recalcule sa matrice monde avec le reste du corps
   * à chaque frame.
   */
  /**
   * Armes du personnage, remplacées par l'équipement acheté du joueur :
   * une arme achetée prend la main droite, un bouclier / une kora / une
   * boussole la main gauche (ou l'avant-bras).
   */
  _weaponList(unit){
    let list = (WEAPON_BY_KEY[unit.key] || []).slice();
    const g = unit.gear;
    if(g?.main?.wear){
      list = list.filter(w => w.hand !== 'RightHand');
      list.push(g.main.wear);
    }
    if(g?.off?.wear){
      list = list.filter(w => w.hand !== 'LeftHand' && w.hand !== 'LeftForeArm');
      list.push(g.off.wear);
    }
    return list;
  }

  /**
   * Bouclier sanglé : le bras passe DERRIÈRE lui, pas au travers. Centré
   * sur l'os, il était traversé de part en part par l'avant-bras. On le
   * construit directement dans le repère de l'avant-bras :
   *   • axe long le long du bras (pointe côté coude, haut côté poignet) ;
   *   • face bombée tournée à l'opposé du corps ;
   *   • dos posé contre l'avant-bras, à mi-chemin du coude et du poignet.
   */
  _strapOnForearm(inst, arm, pivot, shape, k, boneName){
    const side = /Left/.test(boneName) ? 'Left' : 'Right';
    const hand = inst.nodeByBaseName.get('mixamorig:' + side + 'Hand');
    const body = inst.nodeByBaseName.get('mixamorig:Spine1') || inst.nodeByBaseName.get('mixamorig:Spine') || inst.nodeByBaseName.get('mixamorig:Hips');
    if(!hand) return;
    arm.computeWorldMatrix(true); hand.computeWorldMatrix(true);
    const armW = arm.getWorldMatrix();
    const inv = BABYLON.Matrix.Invert(armW);
    const elbow = arm.getAbsolutePosition().clone();
    const wrist = hand.getAbsolutePosition().clone();
    const mid = BABYLON.Vector3.Lerp(elbow, wrist, 0.5);

    // Vers l'extérieur : du tronc vers l'avant-bras, à l'horizontale.
    let out = new BABYLON.Vector3(0, 0, 1);
    if(body){
      body.computeWorldMatrix(true);
      out = mid.subtract(body.getAbsolutePosition()); out.y = 0;
      if(out.length() < 1e-4) out = new BABYLON.Vector3(0, 0, 1);
    }
    // Tout en repère local de l'avant-bras.
    const Y = BABYLON.Vector3.TransformCoordinates(wrist, inv).normalize();
    let Z = BABYLON.Vector3.TransformNormal(out, inv);
    // Mieux que l'estimation par le tronc (qui dépend de la pose au moment
    // du chargement : en T-pose, elle ne veut rien dire) : le DOS de la main,
    // perpendiculaire au bras et à l'écart index-pouce. Mesuré en garde, il
    // coïncide avec l'extérieur (signe inversé pour la main droite, en miroir).
    const idx = inst.nodeByBaseName.get('mixamorig:' + side + 'HandIndex1');
    const thb = inst.nodeByBaseName.get('mixamorig:' + side + 'HandThumb1');
    if(idx && thb){
      idx.computeWorldMatrix(true); thb.computeWorldMatrix(true);
      const across = BABYLON.Vector3.TransformCoordinates(thb.getAbsolutePosition(), inv)
        .subtract(BABYLON.Vector3.TransformCoordinates(idx.getAbsolutePosition(), inv));
      const dorsal = BABYLON.Vector3.Cross(across, Y).scale(side === 'Left' ? 1 : -1);
      if(dorsal.length() > 1e-4) Z = dorsal;
    }
    Z = Z.subtract(Y.scale(BABYLON.Vector3.Dot(Z, Y)));
    if(Z.length() < 1e-4) Z = Math.abs(Y.x) < 0.9 ? new BABYLON.Vector3(1, 0, 0) : new BABYLON.Vector3(0, 0, 1);
    Z.normalize();
    const nLocal = Z.clone();
    if(shape.bulge < 0) Z.scaleInPlace(-1);     // le côté bombé du modèle suit nLocal
    const X = BABYLON.Vector3.Cross(Y, Z).normalize();   // X × Y = Z : repère direct
    pivot.rotationQuaternion = BABYLON.Quaternion.FromRotationMatrix(BABYLON.Matrix.FromValues(
      X.x, X.y, X.z, 0,
      Y.x, Y.y, Y.z, 0,
      Z.x, Z.y, Z.z, 0,
      0, 0, 0, 1,
    ));
    // Recul : le dos du bouclier à ~6 cm de l'axe du bras (son rayon).
    const nWorld = BABYLON.Vector3.TransformNormal(nLocal, armW).normalize();
    const offset = 0.06 + (shape.thickness * k) / 2 - shape.zMid * k * shape.bulge;
    const target = mid.add(nWorld.scale(Math.max(0.04, offset)));
    pivot.position.copyFrom(BABYLON.Vector3.TransformCoordinates(target, inv));
  }

  /**
   * Forme d'une arme, mesurée sur ses sommets (dans le repère du modèle
   * posé à l'origine) :
   *   • axe principal (analyse en composantes principales) = axe de la lame ;
   *   • côté manche = le bout le plus fin autour de cet axe ;
   *   • axe secondaire = largeur de la lame (le plat), sert au `roll`.
   * Renvoie la longueur, le centre (milieu de l'arme sur son axe) et la
   * rotation qui ramène l'arme debout : manche en -Y, pointe en +Y, plat
   * de la lame dans le plan XY.
   */
  _weaponShape(model){
    const pts = [];
    const v = new BABYLON.Vector3();
    for(const m of model.getChildMeshes().concat([model])){
      if(!m.getTotalVertices || !m.getTotalVertices()) continue;
      const pos = m.getVerticesData('position');
      if(!pos) continue;
      m.computeWorldMatrix(true);
      const wm = m.getWorldMatrix();
      const n = pos.length / 3, step = Math.max(1, Math.floor(n / 4000));
      for(let i = 0; i < n; i += step){
        BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], wm, v);
        pts.push(v.x, v.y, v.z);
      }
    }
    const N = pts.length / 3;
    if(!N) return { length: 1, centre: BABYLON.Vector3.Zero(), toLocal: BABYLON.Quaternion.Identity() };
    let cx = 0, cy = 0, cz = 0;
    for(let i = 0; i < N; i++){ cx += pts[i * 3]; cy += pts[i * 3 + 1]; cz += pts[i * 3 + 2]; }
    cx /= N; cy /= N; cz /= N;
    // Covariance
    let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
    for(let i = 0; i < N; i++){
      const x = pts[i * 3] - cx, y = pts[i * 3 + 1] - cy, z = pts[i * 3 + 2] - cz;
      xx += x * x; xy += x * y; xz += x * z; yy += y * y; yz += y * z; zz += z * z;
    }
    const C = [[xx, xy, xz], [xy, yy, yz], [xz, yz, zz]];
    const mul = (a) => [
      C[0][0] * a[0] + C[0][1] * a[1] + C[0][2] * a[2],
      C[1][0] * a[0] + C[1][1] * a[1] + C[1][2] * a[2],
      C[2][0] * a[0] + C[2][1] * a[1] + C[2][2] * a[2],
    ];
    const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    // Itération de la puissance : vecteur propre dominant, puis le suivant
    // (orthogonalisé contre le premier).
    const power = (seed, against) => {
      let a = norm(seed);
      for(let it = 0; it < 60; it++){
        a = mul(a);
        if(against){ const d = dot(a, against); a = [a[0] - against[0] * d, a[1] - against[1] * d, a[2] - against[2] * d]; }
        a = norm(a);
      }
      return a;
    };
    let e1 = power([0.577, 0.577, 0.577]);
    if(!isFinite(e1[0])) e1 = [0, 1, 0];
    let e2 = power(Math.abs(e1[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1);
    // Étendue le long de l'axe, et épaisseur à chaque bout.
    let tMin = 1e9, tMax = -1e9;
    for(let i = 0; i < N; i++){
      const t = (pts[i * 3] - cx) * e1[0] + (pts[i * 3 + 1] - cy) * e1[1] + (pts[i * 3 + 2] - cz) * e1[2];
      if(t < tMin) tMin = t; if(t > tMax) tMax = t;
    }
    const span = Math.max(tMax - tMin, 1e-6);
    let sLo = 0, nLo = 0, sHi = 0, nHi = 0;
    for(let i = 0; i < N; i++){
      const x = pts[i * 3] - cx, y = pts[i * 3 + 1] - cy, z = pts[i * 3 + 2] - cz;
      const t = x * e1[0] + y * e1[1] + z * e1[2];
      const r = Math.hypot(x - e1[0] * t, y - e1[1] * t, z - e1[2] * t);
      const u = (t - tMin) / span;
      if(u < 0.2){ sLo += r; nLo++; } else if(u > 0.8){ sHi += r; nHi++; }
    }
    // Le manche est le bout le plus fin : on veut qu'il soit en -Y.
    if(nLo && nHi && (sHi / nHi) < (sLo / nLo)){ e1 = [-e1[0], -e1[1], -e1[2]]; const a = tMin; tMin = -tMax; tMax = -a; }
    const mid = (tMin + tMax) / 2;
    const centre = new BABYLON.Vector3(cx + e1[0] * mid, cy + e1[1] * mid, cz + e1[2] * mid);
    const Y = new BABYLON.Vector3(e1[0], e1[1], e1[2]);
    const X = new BABYLON.Vector3(e2[0], e2[1], e2[2]);
    const Z = BABYLON.Vector3.Cross(X, Y).normalize();   // repère direct : X × Y = Z
    // Lignes = images des axes locaux : cette matrice envoie X→e2, Y→e1.
    // On veut l'inverse (monde du modèle → arme debout) : sa transposée.
    const toWorld = BABYLON.Matrix.FromValues(
      X.x, X.y, X.z, 0,
      Y.x, Y.y, Y.z, 0,
      Z.x, Z.y, Z.z, 0,
      0, 0, 0, 1,
    );
    const toLocal = BABYLON.Quaternion.FromRotationMatrix(toWorld.transpose());
    // Épaisseur (le long de Z) et côté bombé : utile pour un bouclier, qui
    // se porte face bombée vers l'extérieur, le bras contre son dos.
    let zMin = 1e9, zMax = -1e9, zCen = 0, nCen = 0, zRim = 0, nRim = 0;
    const R2 = (span / 2) * (span / 2);
    for(let i = 0; i < N; i++){
      const x = pts[i * 3] - centre.x, y = pts[i * 3 + 1] - centre.y, z = pts[i * 3 + 2] - centre.z;
      const pz = x * Z.x + y * Z.y + z * Z.z;
      if(pz < zMin) zMin = pz; if(pz > zMax) zMax = pz;
      const px = x * X.x + y * X.y + z * X.z, py = x * Y.x + y * Y.y + z * Y.z;
      const rr = (px * px + py * py) / R2;
      if(rr < 0.04){ zCen += pz; nCen++; } else if(rr > 0.36){ zRim += pz; nRim++; }
    }
    const thickness = Math.max(0, zMax - zMin);
    // +1 : le centre dépasse du côté +Z (bombé vers +Z) ; -1 sinon.
    const bulge = (nCen && nRim && (zCen / nCen) < (zRim / nRim)) ? -1 : 1;
    const zMid = (zMin + zMax) / 2;
    return { length: span, centre, toLocal, thickness, bulge, zMid };
  }

  /**
   * Mesure la PRISE d'une main sur le squelette : le centre du poing et
   * l'axe du manche. Avant, chaque arme était calée à l'œil avec trois
   * rotations et un décalage ; elles finissaient collées à côté du poing
   * plutôt que tenues dedans, et le réglage d'un personnage ne valait pas
   * pour un autre (les squelettes n'ont pas tous les mêmes doigts).
   *
   * On lit les os des doigts quand ils existent :
   *   • centre du poing  = base des doigts (majeur, ou index à défaut) ;
   *   • axe du manche    = perpendiculaire au plan doigts/pouce, c'est la
   *                        direction dans laquelle passe une poignée ;
   *   • haut de la lame  = côté du pouce.
   * Tout est ramené dans le repère LOCAL de la main, donc valable quelle
   * que soit la pose.
   *
   * @returns {{ grip: BABYLON.Vector3, axis: BABYLON.Vector3, up: BABYLON.Vector3 }}
   */
  _measureGrip(inst, handBaseName, axisMode){
    const hand = inst.nodeByBaseName.get(handBaseName);
    const side = /Left/.test(handBaseName) ? 'Left' : 'Right';
    const get = (n) => inst.nodeByBaseName.get('mixamorig:' + side + 'Hand' + n);
    hand.computeWorldMatrix(true);
    const inv = BABYLON.Matrix.Invert(hand.getWorldMatrix());
    const local = (node) => {
      if(!node) return null;
      node.computeWorldMatrix(true);
      return BABYLON.Vector3.TransformCoordinates(node.getAbsolutePosition(), inv);
    };
    const middle = local(get('Middle1')) || local(get('Ring1'));
    const index  = local(get('Index1'));
    const pinky  = local(get('Pinky1')) || local(get('Ring1'));
    const thumb  = local(get('Thumb1')) || local(get('Thumb2'));

    // Centre du poing : la base des doigts, un peu refermée vers la paume.
    let grip = middle || index;
    if(!grip){
      // Squelette sans doigts : repli sur un décalage le long de la main.
      grip = new BABYLON.Vector3(0, 0.08, 0);
    } else {
      grip = grip.scale(0.78);
    }

    // Axe du manche : il traverse le poing, d'un bord à l'autre.
    let axis = null;
    if(index && pinky && !index.equalsWithEpsilon(pinky, 1e-4)) axis = pinky.subtract(index);
    if(!axis || axis.length() < 1e-3){
      // Pas d'auriculaire (nos modèles n'ont qu'index et pouce) : le
      // manche passe DANS le plan de la paume, perpendiculairement aux
      // doigts. L'ancien repli prenait la normale de la paume, un axe qui
      // traverse la main : bras le long du corps, la grande épée de
      // Fulgence partait droit dans son torse.
      const fingerDir = (middle || index || new BABYLON.Vector3(0, 1, 0)).clone().normalize();
      const thumbDir = (thumb || new BABYLON.Vector3(1, 0, 0)).clone().normalize();
      const palmNormal = BABYLON.Vector3.Cross(fingerDir, thumbDir);
      axis = BABYLON.Vector3.Cross(palmNormal, fingerDir);
    }
    if(axis.length() < 1e-3) axis = new BABYLON.Vector3(0, 0, 1);
    axis.normalize();
    // Axe de l'arme : par défaut celui du poing (le manche traverse les
    // doigts refermés). Certaines poses tiennent l'arme dans le prolongement
    // des doigts : `axisMode` permet de le dire arme par arme.
    const fingersDir = (middle || index || new BABYLON.Vector3(0, 1, 0)).clone().normalize();
    if(axisMode === 'fingers') axis = fingersDir;
    else if(axisMode === 'palm') axis = BABYLON.Vector3.Cross(axis, fingersDir).normalize();
    // Orientation : la lame sort du poing du côté du pouce. On mesure le
    // BOUT du pouce depuis le centre du poing : sa base (Thumb1) est
    // presque dans l'axe du poignet, et le test tombait du mauvais côté
    // selon la pose — la grande épée de Fulgence traversait son torse.
    const tip = local(get('Thumb3')) || local(get('Thumb2')) || thumb;
    const thumbDir = tip ? tip.subtract(grip) : new BABYLON.Vector3(1, 0, 0);
    if(BABYLON.Vector3.Dot(axis, thumbDir) < 0) axis.scaleInPlace(-1);
    // « Haut » de référence : le long des doigts, rendu perpendiculaire à l'axe.
    let up = (middle || index || new BABYLON.Vector3(0, 1, 0)).clone().normalize();
    up = up.subtract(axis.scale(BABYLON.Vector3.Dot(up, axis)));
    if(up.length() < 1e-3) up = new BABYLON.Vector3(0, 1, 0);
    up.normalize();
    return { grip, axis, up };
  }

  /**
   * ARMES À FEU — un pistolet ne se tient pas comme une épée : son axe le
   * plus long est le CANON, pas la poignée. Tenu comme une lame, il pointait
   * vers le ciel, crosse dans le vide. On mesure donc sur le modèle :
   *   • l'axe du canon (axe principal des sommets) et le côté de la bouche ;
   *   • la crosse (la partie qui dépasse sous le canon, d'un seul côté) ;
   * puis on met la crosse dans le poing, dressée comme un manche (base côté
   * auriculaire), et le canon dans le prolongement de la main.
   */
  _gunShape(model){
    const pts = [];
    const v = new BABYLON.Vector3();
    for(const m of model.getChildMeshes().concat([model])){
      if(!m.getTotalVertices || !m.getTotalVertices()) continue;
      const pos = m.getVerticesData('position');
      if(!pos) continue;
      m.computeWorldMatrix(true);
      const wm = m.getWorldMatrix();
      const n = pos.length / 3, step = Math.max(1, Math.floor(n / 4000));
      for(let i = 0; i < n; i += step){
        BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], wm, v);
        pts.push(v.x, v.y, v.z);
      }
    }
    const N = pts.length / 3;
    const V3 = BABYLON.Vector3;
    if(!N) return { span: 1, grip: V3.Zero(), up: new V3(0, 1, 0), fwd: new V3(0, 0, 1) };
    let cx = 0, cy = 0, cz = 0;
    for(let i = 0; i < N; i++){ cx += pts[i * 3]; cy += pts[i * 3 + 1]; cz += pts[i * 3 + 2]; }
    cx /= N; cy /= N; cz /= N;
    let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
    for(let i = 0; i < N; i++){
      const x = pts[i * 3] - cx, y = pts[i * 3 + 1] - cy, z = pts[i * 3 + 2] - cz;
      xx += x * x; xy += x * y; xz += x * z; yy += y * y; yz += y * z; zz += z * z;
    }
    const mul = (a) => [xx * a[0] + xy * a[1] + xz * a[2], xy * a[0] + yy * a[1] + yz * a[2], xz * a[0] + yz * a[1] + zz * a[2]];
    const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const power = (seed, against) => {
      let a = norm(seed);
      for(let it = 0; it < 60; it++){
        a = mul(a);
        if(against){ const d = dot(a, against); a = [a[0] - against[0] * d, a[1] - against[1] * d, a[2] - against[2] * d]; }
        a = norm(a);
      }
      return a;
    };
    const e1 = power([0.577, 0.577, 0.577]);                                  // canon
    const e2 = power(Math.abs(e1[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1);      // plan canon / crosse
    // Coordonnées de chaque sommet dans (e1, e2).
    const T = new Float32Array(N), U = new Float32Array(N);
    let tMin = 1e9, tMax = -1e9, uPos = 0, uNeg = 0;
    for(let i = 0; i < N; i++){
      const x = pts[i * 3] - cx, y = pts[i * 3 + 1] - cy, z = pts[i * 3 + 2] - cz;
      T[i] = x * e1[0] + y * e1[1] + z * e1[2];
      U[i] = x * e2[0] + y * e2[1] + z * e2[2];
      if(T[i] < tMin) tMin = T[i]; if(T[i] > tMax) tMax = T[i];
      if(U[i] > uPos) uPos = U[i]; if(-U[i] > uNeg) uNeg = -U[i];
    }
    // La crosse est ce qui dépasse le plus loin du canon (le dessus de la
    // culasse, lui, reste proche de l'axe).
    const sU = uPos >= uNeg ? 1 : -1;
    let uMax = 0;
    for(let i = 0; i < N; i++) uMax = Math.max(uMax, U[i] * sU);
    let gx = 0, gy = 0, gz = 0, gt = 0, gn = 0;
    for(let i = 0; i < N; i++){
      if(U[i] * sU < uMax * 0.35) continue;
      gx += pts[i * 3]; gy += pts[i * 3 + 1]; gz += pts[i * 3 + 2]; gt += T[i]; gn++;
    }
    const grip = gn ? new V3(gx / gn, gy / gn, gz / gn) : new V3(cx, cy, cz);
    // La crosse est à l'arrière : la bouche du canon est de l'autre côté.
    const muzzle = (gn && gt / gn > 0) ? -1 : 1;
    const up = new V3(-e2[0] * sU, -e2[1] * sU, -e2[2] * sU).normalize();          // de la crosse vers le canon
    let fwd = new V3(e1[0] * muzzle, e1[1] * muzzle, e1[2] * muzzle);
    fwd = fwd.subtract(up.scale(V3.Dot(fwd, up))).normalize();
    // Recul de l'arrière de l'arme derrière la crosse (le long du canon) :
    // c'est lui qui risque de rentrer dans le poignet.
    let rear = 0;
    for(let i = 0; i < N; i++){
      const d = (pts[i * 3] - grip.x) * fwd.x + (pts[i * 3 + 1] - grip.y) * fwd.y + (pts[i * 3 + 2] - grip.z) * fwd.z;
      if(-d > rear) rear = -d;
    }
    return { span: Math.max(tMax - tMin, 1e-6), grip, up, fwd, rear };
  }

  _attachGun(inst, unit, w, model, boneName, handNode){
    const V3 = BABYLON.Vector3;
    const gs = this._gunShape(model);
    const k = (w.height || 0.36) / gs.span;
    const g = this._measureGrip(inst, boneName);
    // Repère de l'arme (X, Y = crosse→canon, Z = bouche) et repère de la
    // main (X, Y = axe du poing côté pouce, Z = le long des doigts).
    const Yc = gs.up, Zc = gs.fwd, Xc = V3.Cross(Yc, Zc).normalize();
    // Le canon prolonge l'AVANT-BRAS : les doigts d'un poing fermé sont
    // pliés, et s'aligner sur eux relevait le canon (et enfonçait l'arrière
    // de l'arme dans le poignet).
    const side0 = /Left/.test(boneName) ? 'Left' : 'Right';
    const fore = inst.nodeByBaseName.get('mixamorig:' + side0 + 'ForeArm');
    let aim = g.up.clone();
    if(fore){
      fore.computeWorldMatrix(true); handNode.computeWorldMatrix(true);
      const f = V3.TransformCoordinates(fore.getAbsolutePosition(), BABYLON.Matrix.Invert(handNode.getWorldMatrix()));
      const d = f.scale(-1);                                  // du coude vers le poignet, prolongé
      const dp = d.subtract(g.axis.scale(V3.Dot(d, g.axis)));
      if(dp.length() > 1e-4 && V3.Dot(dp, g.up) > 0) aim = dp.normalize();
    }
    const Yh = g.axis, Zh = aim, Xh = V3.Cross(Yh, Zh).normalize();
    const rows = (a, b, c) => BABYLON.Matrix.FromValues(a.x, a.y, a.z, 0, b.x, b.y, b.z, 0, c.x, c.y, c.z, 0, 0, 0, 0, 1);
    const R = rows(Xc, Yc, Zc).transpose().multiply(rows(Xh, Yh, Zh));
    const inner = new BABYLON.TransformNode('wgun_' + unit.id, this.scene);
    model.position.subtractInPlace(gs.grip);          // la crosse sur l'origine
    model.parent = inner;
    inner.scaling.setAll(k);
    inner.rotationQuaternion = BABYLON.Quaternion.FromRotationMatrix(R);
    const pivot = new BABYLON.TransformNode('wgrip_' + unit.id, this.scene);
    inner.parent = pivot;
    handNode.computeWorldMatrix(true);
    const sc3 = new V3();
    handNode.getWorldMatrix().decompose(sc3);
    const sMean = (Math.abs(sc3.x) + Math.abs(sc3.y) + Math.abs(sc3.z)) / 3 || 1;
    pivot.position.copyFrom(g.grip);
    // L'arrière de la culasse doit s'arrêter au creux du pouce, pas dans le
    // poignet : on avance l'arme le long des doigts si elle déborde.
    // (g.grip est en unités de l'os ; ×sMean ramène en mètres.)
    // Le point de prise mesuré est au milieu des os de la main ; le creux
    // du poing, lui, est côté paume (là où se replient les doigts). Sans
    // ce décalage, la crosse traversait le dos de la main.
    const side = /Left/.test(boneName) ? 'Left' : 'Right';
    const tipNode = inst.nodeByBaseName.get('mixamorig:' + side + 'HandIndex3') || inst.nodeByBaseName.get('mixamorig:' + side + 'HandIndex2')
      || inst.nodeByBaseName.get('mixamorig:' + side + 'HandMiddle3') || inst.nodeByBaseName.get('mixamorig:' + side + 'HandMiddle2');
    let palm = V3.Cross(g.axis, g.up).normalize();
    if(tipNode){
      tipNode.computeWorldMatrix(true);
      const tip = V3.TransformCoordinates(tipNode.getAbsolutePosition(), BABYLON.Matrix.Invert(handNode.getWorldMatrix()));
      if(V3.Dot(tip.subtract(g.grip), palm) < 0) palm.scaleInPlace(-1);
    }
    pivot.position.addInPlace(palm.scale(0.03 / sMean));
    const wristToGrip = V3.Dot(g.grip, aim) * sMean;
    const shift = Math.max(0, gs.rear * k - wristToGrip * 0.2);
    if(shift > 0) pivot.position.addInPlace(aim.scale(shift / sMean));
    if(w.offset) pivot.position.addInPlace(new V3(w.offset[0], w.offset[1], w.offset[2]));
    pivot.parent = handNode;
    if(Math.abs(sMean - 1) > 0.02) pivot.scaling.setAll(1 / sMean);
    return pivot;
  }

  /**
   * Accroche les armes d'un champion. Toutes les entrées utilisent le même
   * format mesuré : hauteur réelle en mètres, position de la poignée le long
   * de l'arme, et une rotation autour de son axe (`roll`) pour orienter le
   * tranchant. Plus aucune constante devinée à l'œil.
   */
  async _attachWeapons(inst, unit){
    const list = this._weaponList(unit);
    if(!list || !list.length) return;
    for(const w of list){
      const boneName = 'mixamorig:' + w.hand;
      const handNode = inst.nodeByBaseName.get(boneName);
      if(!handNode){
        console.error('[BabylonUnits] ❌ os introuvable pour l\'arme', w.file, '(', w.hand, ') sur', unit.key);
        continue;
      }
      let container;
      try{ container = await this._loadProp(w.file); }
      catch(e){ console.error('[BabylonUnits] ❌ arme introuvable :', w.file, e); continue; }
      if(inst.disposed) return;
      const entry = container.instantiateModelsToScene(name => name + '_w' + list.indexOf(w) + '_' + unit.id, false);
      const model = entry.rootNodes[0];

      // Arme à feu : prise propre (crosse dans le poing, canon devant).
      if(w.gun || /PISTOLET/i.test(w.file)){
        const pv = this._attachGun(inst, unit, w, model, boneName, handNode);
        inst.weapons = inst.weapons || [];
        inst.weapons.push(pv);
        continue;
      }

      // 1. Mesure de l'arme : son VRAI axe long, par analyse des sommets.
      //    Plusieurs modèles sont posés en diagonale dans leur fichier (EPEE
      //    et LANCE font ~0,8 × 0,8 m en boîte englobante) : prendre l'axe le
      //    plus long de la boîte tenait l'arme de travers, voire par la lame,
      //    et la décalait loin du poing. L'axe principal des sommets, lui,
      //    suit la lame quelle que soit la pose du modèle.
      const shape = this._weaponShape(model);
      const k = (w.height || 0.6) / shape.length;

      // 2. Redressement. Le modèle garde SA propre transformation (certains
      //    .glb portent une conversion d'axes dans leur nœud racine : la
      //    remplacer envoyait l'arme à un mètre de la main). On l'enveloppe
      //    donc dans deux nœuds : l'un recentre sur le milieu de l'arme,
      //    l'autre la tourne (manche vers -Y, lame vers +Y) et la met à
      //    l'échelle.
      const inner = new BABYLON.TransformNode('wscale_' + unit.id, this.scene);
      const straight = new BABYLON.TransformNode('wfix_' + unit.id, this.scene);
      inner.parent = straight;
      model.position.subtractInPlace(shape.centre);   // l'arme est centrée sur l'origine
      model.parent = inner;
      inner.scaling.setAll(k);
      inner.rotationQuaternion = shape.toLocal;
      if(w.flip) straight.rotation.z = Math.PI;
      const h = w.height || 0.6;
      straight.position.y = (0.5 - (w.grip ?? 0.5)) * h;

      // 3. Mise en main : on oriente +Y sur l'axe du manche mesuré, et on
      //    pose la poignée au centre du poing.
      const pivot = new BABYLON.TransformNode('wgrip_' + unit.id, this.scene);
      straight.parent = pivot;
      const g = this._measureGrip(inst, boneName, w.axis);
      // Repère direct (déterminant +1) : Z = X × Y. L'ancienne version
      // prenait Y × X, un repère « gaucher » : la conversion en quaternion
      // n'a alors aucun sens et l'arme partait de travers, loin du poing.
      const xAxis = BABYLON.Vector3.Cross(g.up, g.axis).normalize();
      const zAxis = BABYLON.Vector3.Cross(xAxis, g.axis).normalize();
      const rot = BABYLON.Matrix.FromValues(
        xAxis.x, xAxis.y, xAxis.z, 0,
        g.axis.x, g.axis.y, g.axis.z, 0,
        zAxis.x, zAxis.y, zAxis.z, 0,
        0, 0, 0, 1,
      );
      pivot.rotationQuaternion = BABYLON.Quaternion.FromRotationMatrix(rot);
      if(w.roll){
        pivot.rotationQuaternion = pivot.rotationQuaternion.multiply(
          BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, w.roll));
      }
      pivot.position.copyFrom(g.grip);
      if(w.offset) pivot.position.addInPlace(new BABYLON.Vector3(w.offset[0], w.offset[1], w.offset[2]));
      pivot.parent = handNode;
      // Les modèles de personnages n'ont pas tous la même échelle interne
      // (certains rigs sont en centimètres). En héritant de l'os, l'arme
      // héritait aussi de ce facteur : elle partait à un mètre de la main,
      // ou sortait dix fois trop grande. On annule l'échelle de l'os pour
      // que la hauteur demandée reste en mètres réels.
      // Les rigs n'ont ni la même échelle ni la même orientation d'axes :
      // certains sont en centimètres, d'autres en miroir (échelle négative).
      // On annule exactement l'échelle de l'os, signe compris, pour que
      // l'arme garde sa taille réelle et ne parte pas de travers.
      handNode.computeWorldMatrix(true);
      const sc3 = new BABYLON.Vector3();
      handNode.getWorldMatrix().decompose(sc3);
      const sMean = (Math.abs(sc3.x) + Math.abs(sc3.y) + Math.abs(sc3.z)) / 3 || 1;
      if(Math.abs(sMean - 1) > 0.02) pivot.scaling.setAll(1 / sMean);

      if(w.strap) this._strapOnForearm(inst, handNode, pivot, shape, k, w.hand);

      inst.weapons = inst.weapons || [];
      inst.weapons.push(pivot);
    }
  }

  /**
   * Charge (ou récupère du cache) un clip d'animation, en retire le
   * déplacement horizontal du bassin (root motion → « en place ») et
   * mémorise sa vitesse d'origine (m/s) pour caler la lecture.
   * Résout vers { group, speed, duration } ou null.
   */
  _loadAnimSource(fileName){
    if(!this._animSourceCache.has(fileName)){
      const p = BABYLON.SceneLoader.LoadAssetContainerAsync(ANIM_BASE, fileName, this.scene).then(container => {
        const group = container.animationGroups[container.animationGroups.length - 1];
        if(!group) return null;
        let speed = 0;
        const fps = group.targetedAnimations[0]?.animation.framePerSecond || 30;
        const duration = Math.max((group.to - group.from) / fps, 0.05);
        for(const ta of group.targetedAnimations){
          const tname = ta.target?.name || '';
          if(!/Hips$/.test(tname) || ta.animation.targetProperty !== 'position') continue;
          const keys = ta.animation.getKeys();
          if(keys.length < 2) continue;
          const first = keys[0].value, last = keys[keys.length - 1].value;
          speed = Math.hypot(last.x - first.x, last.z - first.z) / duration;
          for(const k of keys){
            k.value = new BABYLON.Vector3(first.x, k.value.y, first.z);
          }
        }
        return { group, speed, duration };
      }).catch(e => {
        console.error('[BabylonUnits] ❌ clip introuvable :', fileName, e);
        return null;
      });
      this._animSourceCache.set(fileName, p);
    }
    return this._animSourceCache.get(fileName);
  }

  /** Clone un clip (déjà chargé ou non) sur le squelette de l'instance. Retourne { ag, speed, duration } ou null. */
  async _clipFor(inst, file){
    if(!file) return null;
    if(inst.clips.has(file)) return inst.clips.get(file);
    const src = await this._loadAnimSource(file);
    if(!src || inst.disposed) return null;
    if(inst.clips.has(file)) return inst.clips.get(file);
    // Clonage manuel plutôt que src.group.clone(...) : tous les modèles
    // n'ont pas exactement les mêmes os (un rig Mixamo peut avoir moins
    // de phalanges). clone() plante sur une cible absente ; ici on passe
    // simplement les os manquants.
    const ag = new BABYLON.AnimationGroup(file + '_' + inst.id, this.scene);
    for(const ta of src.group.targetedAnimations){
      const target = inst.nodeByBaseName.get(ta.target?.name);
      if(target) ag.addTargetedAnimation(ta.animation, target);
    }
    ag.stop();
    if(!ag.targetedAnimations.length){
      console.error('[BabylonUnits] ❌ aucun os commun entre', file, 'et', inst.modelFile);
      return null;
    }
    const clip = { ag, speed: src.speed, duration: src.duration, file };
    inst.clips.set(file, clip);
    return clip;
  }

  /** Clip déjà prêt pour cette instance (synchrone) ; lance son chargement sinon. */
  _readyClip(inst, file){
    if(!file) return null;
    const c = inst.clips.get(file);
    if(c) return c;
    this._clipFor(inst, file);
    return null;
  }

  /** Démarre un clip en coupant le précédent. */
  _play(inst, clip, { loop = false, speedRatio = 1, randomStart = false } = {}){
    if(inst.current && inst.current !== clip) inst.current.ag.stop();
    inst.current = clip;
    const ag = clip.ag;
    ag.onAnimationGroupEndObservable.clear();
    ag.start(loop, speedRatio * inst.tempo);
    if(randomStart) ag.goToFrame(ag.from + Math.random() * (ag.to - ag.from));
    return ag;
  }

  /** Crée (si besoin) et retourne l'instance 3D pour une unité du sim. */
  async ensure(unit){
    if(this.instances.has(unit.id)) return this.instances.get(unit.id);
    const fileName = modelForUnit(unit);
    if(!fileName) return null;

    const placeholder = { ready: false };
    this.instances.set(unit.id, placeholder);

    const container = await this._loadModel(fileName);
    if(this.instances.get(unit.id) !== placeholder) return null; // unité retirée pendant le chargement
    const entry = container.instantiateModelsToScene(name => name + '_' + unit.id, false);
    const root = entry.rootNodes[0];
    // Animations embarquées dans le modèle : inutiles (on utilise la bibliothèque).
    for(const ag of entry.animationGroups) ag.dispose();

    // Pivot d'orientation : le __root__ du GLB a un rotationQuaternion,
    // donc root.rotation.y n'aurait aucun effet. On tourne le pivot.
    const pivot = new BABYLON.TransformNode('unit_' + unit.id, this.scene);
    root.parent = pivot;

    const allNodes = root.getDescendants(false);
    allNodes.push(root);
    const suffix = '_' + unit.id;
    const nodeByBaseName = new Map();
    for(const n of allNodes){
      const base = n.name.endsWith(suffix) ? n.name.slice(0, -suffix.length) : n.name;
      nodeByBaseName.set(base, n);
      // Mixamo renomme parfois les os « mixamorig1: », « mixamorig9: »…
      // selon la session d'auto-rig. On les rend tous équivalents.
      if(/^mixamorig\d+:/.test(base)) nodeByBaseName.set(base.replace(/^mixamorig\d+:/, 'mixamorig:'), n);
    }

    const profile = profileForUnit(unit);
    const inst = {
      id: unit.id, pivot, root, nodeByBaseName, profile, modelFile: fileName,
      ready: true, disposed: false,
      clips: new Map(), current: null,
      state: null,          // 'idle' | 'walk' | 'run' | 'attack' | 'cast' | 'hit' | 'death'
      lastFile: {},         // dernier clip joué par état (évite les répétitions)
      oneShotUntil: 0,
      lastX: unit.x, lastY: unit.y, lastT: performance.now(), speedPx: 0,
      yaw: 0, deadAt: 0, hitCooldownUntil: 0,
      // Petit décalage de tempo propre à chaque unité : les sbires d'une
      // même vague ne s'animent plus à l'unisson.
      tempo: 0.92 + Math.random() * 0.16,
    };
    this.instances.set(unit.id, inst);

    // Précharge tous les clips du profil en tâche de fond : le premier
    // coup, sort ou réaction est ainsi prêt quand il arrive.
    // Préchargement en deux temps : d'abord ce qui sert dans la première
    // seconde (posture, marche, course, deux attaques), puis le reste en
    // tâche de fond. Avec des profils de 30 à 40 clips, tout charger d'un
    // coup retardait l'apparition des unités au début de la mission.
    const urgent = [profile.idle[0], profile.walk?.[0], profile.run?.[0], ...(profile.attack || []).slice(0, 2)].filter(Boolean);
    await this._clipFor(inst, urgent[0]);
    for(const f of urgent.slice(1)) this._clipFor(inst, f);
    const rest = [...new Set([...Object.values(profile.fight || {}).flat(), ...Object.values(profile).filter(Array.isArray).flat()])].filter(f => !urgent.includes(f));
    setTimeout(() => { for(const f of rest){ if(!inst.disposed) this._clipFor(inst, f); } }, 1200);

    const f = unit.facing || { x: 0, y: 1 };
    inst.yaw = Math.atan2(f.x, -f.y);
    this._applyTransform(inst, unit, 1);
    this._enterIdle(inst, true);
    // Invocation temporaire (ex. le Lieutenant de Baba) : même modèle que
    // son invocateur, donc on la rend fantomatique et plus petite — sinon
    // on croyait voir le même méchant apparaître deux fois.
    const ghostify = () => {
      if(!unit.temporary || inst.disposed) return;
      pivot.scaling.setAll(0.82);
      for(const m of pivot.getChildMeshes(false)) m.visibility = 0.45;
    };
    ghostify();
    // Den skyggeløse mannen ne projette aucune ombre (indice du récit).
    if(NO_SHADOW.has(unit.key)) pivot.metadata = { ...(pivot.metadata || {}), noShadow: true };
    this.gfx?.addCaster(pivot);
    this._attachWeapons(inst, unit).then(ghostify).then(() => this.gfx?.addCaster(pivot)).catch(e => console.error('[BabylonUnits] ❌ échec attache d\'arme pour', unit.key, e));
    return inst;
  }

  // ---------------------------------------------------------------
  // États
  // ---------------------------------------------------------------

  _enterIdle(inst, randomStart = false){
    const file = inst.state === 'idle' && inst.current
      ? pick(inst.profile.idle, inst.current.file)
      : (Math.random() < 0.6 ? inst.profile.idle[0] : pick(inst.profile.idle));
    const clip = this._readyClip(inst, file) || this._readyClip(inst, inst.profile.idle[0]);
    inst.state = 'idle';
    if(!clip) return;
    const ag = this._play(inst, clip, { loop: false, randomStart });
    // À la fin d'une variante, on enchaîne sur une autre.
    ag.onAnimationGroupEndObservable.addOnce(() => {
      if(inst.state === 'idle' && inst.current === clip && !inst.disposed) this._enterIdle(inst);
    });
  }

  _enterLocomotion(inst, speedMs){
    // Hystérésis : évite de basculer marche/course en boucle autour du seuil.
    const want = inst.state === 'run'
      ? (speedMs < RUN_THRESHOLD - 0.4 ? 'walk' : 'run')
      : (speedMs > RUN_THRESHOLD + 0.3 ? 'run' : 'walk');
    let clip = this._readyClip(inst, inst.lastFile[want] || (inst.lastFile[want] = pick(inst.profile[want])));
    if(!clip && want === 'run') clip = this._readyClip(inst, inst.profile.walk[0]);
    if(!clip) return;
    const ratio = clip.speed > 0.2 ? clamp(speedMs / clip.speed, 0.55, 2.2) : 1;
    if(inst.state !== want || inst.current !== clip){
      // Passage marche <-> course : on garde la phase du pas (même pied
      // en avant) au lieu de repartir au hasard.
      const prev = inst.current;
      const wasLoco = prev && (inst.state === 'walk' || inst.state === 'run');
      const phase = wasLoco ? ((prev.ag.animatables[0]?.masterFrame ?? prev.ag.from) - prev.ag.from) / Math.max(prev.ag.to - prev.ag.from, 1) : null;
      inst.state = want;
      const ag = this._play(inst, clip, { loop: true, speedRatio: ratio, randomStart: phase === null });
      if(phase !== null) ag.goToFrame(ag.from + clamp(phase, 0, 1) * (ag.to - ag.from));
    } else {
      // Ajustement continu : la foulée suit la vitesse réelle (anti-glisse).
      clip.ag.speedRatio = ratio * inst.tempo;
    }
  }

  /** Joue un clip ponctuel (attaque, sort, coup reçu), puis rend la main à idle/locomotion. */
  _playOneShot(inst, kind, speedRatio){
    const file = pick(inst.profile[kind], inst.lastFile[kind]);
    const clip = this._readyClip(inst, file);
    if(!clip) return false;
    inst.lastFile[kind] = file;
    inst.state = kind;
    const ratio = speedRatio(clip.duration);
    const ag = this._play(inst, clip, { loop: false, speedRatio: ratio });
    inst.oneShotUntil = performance.now() + (clip.duration / (ratio * inst.tempo)) * 1000;
    ag.onAnimationGroupEndObservable.addOnce(() => {
      if(inst.state === kind && inst.current === clip && !inst.disposed){
        inst.state = null;
        this._enterIdle(inst);
      }
    });
    return true;
  }

  _enterDeath(inst){
    inst.fightUntil = 0;
    if(inst.state === 'death') return;
    inst.deadAt = performance.now();
    const file = pick(inst.profile.death);
    const clip = this._readyClip(inst, file);
    inst.state = 'death';
    if(clip) this._play(inst, clip, { loop: false, speedRatio: 1 / inst.tempo });
    // Le clip reste figé sur sa dernière image (le corps au sol).
  }

  _applyTransform(inst, unit, turnT, X = unit.x, Y = unit.y){
    const pos = this._groundPos(X, Y);
    inst.pivot.position.copyFrom(pos);
    // Direction visée : la cible si l'unité est à l'arrêt et engagée
    // (elle frappe face à l'ennemi), sinon son sens de déplacement.
    let fx = unit.facing?.x ?? 0, fy = unit.facing?.y ?? 1;
    const t = unit.target;
    if(t && !t.dead && inst.speedPx < MOVE_SPEED_MIN){
      const dx = t.x - unit.x, dy = t.y - unit.y;
      if(dx || dy){ fx = dx; fy = dy; }
    }
    if(fx || fy){
      const targetYaw = Math.atan2(fx, -fy);
      inst.yaw = angleLerp(inst.yaw, targetYaw, turnT);
    }
    inst.pivot.rotation.y = inst.yaw;
  }

  /**
   * Appelé chaque frame par la boucle de jeu (match.js).
   * @param {Array} units - unités du sim
   * @param {Map} [views] - UnitView PixiJS par id : le modèle 3D se cale
   *   sur leur position AFFICHÉE (lissée), pour rester collé à l'anneau
   *   de sélection et à la barre de vie au lieu de les devancer.
   */
  update(units, views){
    const now = performance.now();
    const seen = new Set();
    for(const u of units){
      seen.add(u.id);

      // Structures (autel) : objet statique, chemin dédié séparé des
      // champions/sbires animés (pas de squelette, pas d'attente d'un
      // clip idle, juste position + visibilité).
      if(STRUCTURE_MODEL[u.kind]){
        this._updateStructure(u);
        continue;
      }

      const inst = this.instances.get(u.id);
      if(!inst || !inst.ready){
        if(!inst && !u.dead){
          this.ensure(u).catch(e => console.error('[BabylonUnits] ❌ échec ensure() pour unité', u.id, u.key || u.kind, '—', e));
        }
        continue;
      }

      const dt = Math.min(Math.max((now - inst.lastT) / 1000, 0.001), 0.1);
      inst.lastT = now;

      if(u.dead){
        this._enterDeath(inst);
        inst.pivot.setEnabled((now - inst.deadAt) / 1000 < CORPSE_TIME);
        continue;
      }
      if(inst.state === 'death'){
        // Réapparition (respawn, nouveau round) : on repart proprement.
        inst.pivot.setEnabled(true);
        inst.state = null;
        inst.fightUntil = 0;
        inst.lastX = u.x; inst.lastY = u.y; inst.speedPx = 0;
        this._enterIdle(inst);
      }

      const view = views?.get(u.id);
      const X = view ? view.dispX : u.x, Y = view ? view.dispY : u.y;
      // Vitesse réelle mesurée à l'écran (px/s), lissée.
      const inst_v = Math.hypot(X - inst.lastX, Y - inst.lastY) / dt;
      inst.lastX = X; inst.lastY = Y;
      inst.speedPx += (inst_v - inst.speedPx) * Math.min(1, dt * 12);
      const moving = inst.speedPx > MOVE_SPEED_MIN;

      this._applyTransform(inst, u, Math.min(1, dt * TURN_SPEED), X, Y);

      // Mode Combat : un coup, une réaction, une garde ou une chute en cours
      // ne se laisse couper ni par la marche ni par la posture d'attente.
      if(now < (inst.fightUntil || 0)) continue;

      const inOneShot = (inst.state === 'attack' || inst.state === 'cast' || inst.state === 'hit') && now < inst.oneShotUntil;
      if(moving){
        // Le déplacement a priorité : jamais d'attaque « glissée ».
        this._enterLocomotion(inst, inst.speedPx / WORLD_SCALE);
      } else if(!inOneShot && inst.state !== 'idle'){
        this._enterIdle(inst);
      }
    }
    for(const [id, inst] of this.instances){
      if(seen.has(id) || !inst.ready) continue;
      // Unité retirée du sim (sbire tué) : on laisse jouer la mort, puis on nettoie.
      if(inst.state !== 'death') this._enterDeath(inst);
      if((now - inst.deadAt) / 1000 > CORPSE_TIME) this._disposeInstance(id, inst);
    }
  }

  _disposeInstance(id, inst){
    inst.disposed = true;
    for(const c of inst.clips.values()) c.ag.dispose();
    inst.pivot?.dispose();
    this.instances.delete(id);
  }

  /**
   * Événements de combat (match.js) :
   *  - 'attack' : coup de base (mêlée ou tir)      - 'cast' : compétence
   *  - 'hit'    : l'unité encaisse un coup
   * @param {object} [info] - pour 'attack' : { interval } (s entre deux coups)
   */
  /**
   * Mode Combat : joue un clip précis d'un état, en priorité absolue.
   * C'est ce qui permet qu'un enchaînement montre quatre coups
   * DIFFÉRENTS (attack[0], [1], [2], puis le lourd) au lieu d'un tirage
   * au hasard, et qu'une garde tienne tant que le bouton est pressé.
   *
   * @param {number} unitId
   * @param {string} state   'attack' | 'hit' | 'block' | 'dodge' | 'death' | 'taunt'
   * @param {number} index   position dans la liste du profil (bouclée)
   * @param {object} o       { dur } durée voulue en secondes (le clip est
   *                         accéléré ou ralenti pour tenir dedans), { hold }
   *                         pour rester sur la dernière image (garde, chute)
   */
  playFight(unitId, state, index = 0, o = {}){
    const inst = this.instances.get(unitId);
    if(!inst || !inst.ready || inst.disposed) return;
    // `o.set` : liste dédiée au duel (profile.fight), si le profil l'a.
    const fightList = o.set && inst.profile.fight?.[o.set];
    const list = fightList && fightList.length ? fightList
      : (inst.profile[state] && inst.profile[state].length ? inst.profile[state] : inst.profile.attack);
    if(!list || !list.length) return;
    const file = list[index % list.length];
    let clip = this._readyClip(inst, file);
    // Clip pas encore chargé : on prend le premier de la liste qui l'est,
    // plutôt que de ne rien montrer du tout.
    if(!clip) for(const f of list){ clip = inst.clips.get(f); if(clip) break; }
    if(!clip) return;
    // « down » et non « death » : update() prend l'état « death » pour une
    // mort en cours et relevait le combattant dès l'image suivante.
    const tag = state === 'death' ? 'down' : state;
    inst.state = tag;
    const ratio = o.dur ? clamp(clip.duration / o.dur, 0.5, 3.6) : 1;
    const ag = this._play(inst, clip, { loop: !!o.loop, speedRatio: ratio });
    const len = (clip.duration / (ratio * inst.tempo)) * 1000;
    inst.oneShotUntil = performance.now() + len;
    // Verrou de combat : tant qu'il court, ni la marche (le recul d'un coup
    // fait « bouger » le combattant) ni la posture d'attente ne coupent le
    // clip. C'est ce qui effaçait coups de poing et réactions.
    inst.fightUntil = o.hold ? Infinity : performance.now() + len;
    if(o.hold){
      // Reste figé sur la dernière image : garde tenue, corps au sol.
      ag.onAnimationGroupEndObservable.addOnce(() => { try{ ag.pause(); }catch(e){} });
      return;
    }
    if(!o.loop) ag.onAnimationGroupEndObservable.addOnce(() => {
      if(inst.state === tag && inst.current === clip && !inst.disposed){
        inst.state = null;
        inst.fightUntil = 0;
        this._enterIdle(inst);
      }
    });
  }

  /** Rend la main à la posture d'attente (fin de garde, relevé). */
  releaseFight(unitId){
    const inst = this.instances.get(unitId);
    if(!inst || !inst.ready || inst.disposed) return;
    inst.state = null;
    inst.oneShotUntil = 0;
    inst.fightUntil = 0;
    this._enterIdle(inst);
  }

  notifyAction(unitId, key, info = {}){
    const inst = this.instances.get(unitId);
    if(!inst || !inst.ready || inst.state === 'death') return;
    // En course, la locomotion prime — sauf pour un coup demandé à la
    // main par le joueur (info.force), qu'on doit toujours voir partir.
    if(inst.speedPx > MOVE_SPEED_MIN && !info.force) return;
    const now = performance.now();
    if(key === 'attack'){
      if(inst.state === 'cast' && now < inst.oneShotUntil) return; // ne coupe pas un sort
      const interval = info.interval || 1.2;
      // Le clip est accéléré pour tenir dans l'intervalle entre deux coups.
      this._playOneShot(inst, 'attack', d => clamp(d / (interval * 0.9), 1, 2.4));
    } else if(key === 'cast'){
      if(!inst.profile.cast.length){ this._playOneShot(inst, 'attack', d => clamp(d / 1.0, 1, 2.4)); return; }
      this._playOneShot(inst, 'cast', d => clamp(d / 1.3, 1, 2.2));
    } else if(key === 'hit'){
      // Réaction seulement au repos, pas en pleine attaque, et pas à chaque coup.
      if(inst.state !== 'idle' || now < inst.hitCooldownUntil || Math.random() > 0.45) return;
      inst.hitCooldownUntil = now + 1800;
      this._playOneShot(inst, 'hit', d => clamp(d / 0.8, 1, 1.8));
    }
  }

  /**
   * Structure statique (autel) : chargée une fois, mise à l'échelle
   * d'après sa propre boîte englobante (le modèle brut mesure environ
   * 1,1 m après compression, on le remet à une hauteur cible fixe),
   * puis simplement montrée/masquée selon `u.dead` — aucune animation.
   */
  _updateStructure(u){
    let st = this.structures.get(u.id);
    if(!st){
      const placeholder = { ready: false };
      this.structures.set(u.id, placeholder);
      this._loadProp(STRUCTURE_MODEL[u.kind]).then(container => {
        if(this.structures.get(u.id) !== placeholder) return; // retirée entre-temps
        const entry = container.instantiateModelsToScene(name => name + '_' + u.id, false);
        for(const ag of entry.animationGroups) ag.dispose();
        const root = entry.rootNodes[0];
        const pivot = new BABYLON.TransformNode('struct_' + u.id, this.scene);
        root.parent = pivot;

        let minY = 1e9, maxY = -1e9;
        for(const m of root.getChildMeshes(false)){
          m.computeWorldMatrix(true);
          const bb = m.getBoundingInfo().boundingBox;
          minY = Math.min(minY, bb.minimumWorld.y);
          maxY = Math.max(maxY, bb.maximumWorld.y);
        }
        const rawH = Math.max(maxY - minY, 0.01);
        root.scaling.setAll(AUTEL_HEIGHT_M / rawH);

        const pos = this._groundPos(u.x, u.y);
        pivot.position.copyFrom(pos);
        this.structures.set(u.id, { pivot, ready: true });
      }).catch(e => {
        console.error('[BabylonUnits] ❌ échec chargement structure', u.kind, e);
        this.structures.delete(u.id);
      });
      return;
    }
    if(!st.ready) return;
    st.pivot.setEnabled(!u.dead);
  }

  /**
   * Vide la scène des personnages et bâtiments de la partie terminée
   * (le moteur, lui, reste prêt pour la suivante). Sans ça, les corps et
   * les tours de la partie perdue restaient à l'écran au combat suivant.
   */
  clearUnits(){
    for(const [id, inst] of this.instances){
      if(inst.ready) this._disposeInstance(id, inst);
      else inst.disposed = true;   // chargement en cours : jeté à l'arrivée
    }
    this.instances.clear();
    for(const [, st] of this.structures){ st.disposed = true; st.pivot?.dispose(); }
    this.structures.clear();
  }

  destroy(){
    this._resizeObserver?.disconnect();
    this.clearUnits();
    this.gfx?.dispose();
    this.engine.stopRenderLoop();
    this.engine.dispose();
    this.canvas.remove();
  }
}
