// ============================================================
// MODE COMBAT — des duels en rounds gagnants, un contre un.
//
// Ni sbires, ni autel, ni allié : deux champions, une arène, et le
// premier à deux rounds. Entre chaque round, tout est remis à zéro
// (PV, essence, délais) — on repart à armes égales.
//
// Le format reprend celui d'une mission (l'écran de déploiement et le
// moteur n'ont rien à savoir de plus) avec trois champs en plus :
//   opponent   — la fiche de champion affrontée
//   roundsToWin — rounds à gagner (2 = deux manches gagnantes)
//   roundTime  — durée d'un round en secondes ; à l'expiration, celui
//                qui a le plus de PV en proportion remporte la manche.
// ============================================================

import { CAMPAIGN } from './campaign.js';
import { CHAMPS } from './champions.js';

export const DUELS = [
  {
    id: 'c_baba', num: 'C1', name: 'Baba Tunde', mode: 'COMBAT', req: 0,
    opponent: 'BABA', foeMult: 0.9, roundsToWin: 2, roundTime: 60,
    desc: "La revanche de la cour, en règle cette fois.",
    brief: "Pas de galerie, pas de public, pas d'excuse. Baba se bat comme il parle : vite, fort, et sans jamais reculer d'un pas.",
    ennemis: ['BABA'], ennemis_extra: 0, allies_dispo: [],
    xp: 50, cauris: 80,
  },
  {
    id: 'c_karen', num: 'C2', name: 'Karen Keïta', mode: 'COMBAT', req: 2,
    opponent: 'KAREN', foeMult: 0.85, roundsToWin: 2, roundTime: 60,
    desc: "Un entraînement avec sa sœur. Elle ne retient rien.",
    brief: "Karen soigne, protège et immobilise. Un duel contre elle est une leçon de patience : elle ne cherche pas à gagner vite, elle cherche à ce que vous perdiez lentement.",
    ennemis: ['KAREN'], ennemis_extra: 0, allies_dispo: [],
    xp: 55, cauris: 90,
  },
  {
    id: 'c_fulgence', num: 'C3', name: 'Fulgence', mode: 'COMBAT', req: 5,
    opponent: 'FULGENCE', foeMult: 0.95, roundsToWin: 2, roundTime: 60,
    desc: "Le Roc de Marcory, dans la cour de son propre atelier.",
    brief: "Il encaisse tout et ne bouge pas. Le seul moyen de gagner un round contre Fulgence est de le contourner — ce qui, avec sa provocation, n'est pas prévu au programme.",
    ennemis: ['FULGENCE'], ennemis_extra: 0, allies_dispo: [],
    xp: 65, cauris: 100,
  },
  {
    id: 'c_sam', num: 'C4', name: 'Sam Grün', mode: 'COMBAT', req: 9,
    opponent: 'SAM', foeMult: 0.95, roundsToWin: 2, roundTime: 60,
    desc: "Le Passeur ne se bat jamais à la distance qu'on croit.",
    brief: "Sam ouvre des failles et s'en sert comme d'un couloir. Le combat se joue sur le placement : là où il veut que vous soyez, ou ailleurs.",
    ennemis: ['SAM'], ennemis_extra: 0, allies_dispo: [],
    xp: 70, cauris: 110,
  },
  {
    id: 'c_dark', num: 'C5', name: 'Dark', mode: 'COMBAT', req: 14,
    opponent: 'DARK', foeMult: 1.0, roundsToWin: 2, roundTime: 60,
    desc: "L'Enfant de l'Abîme, et sa faim.",
    brief: "Chaque coup qu'il porte le soigne. Laisser traîner un round contre Dark, c'est lui offrir la victoire en deux temps : d'abord la vôtre, ensuite la sienne.",
    ennemis: ['DARK'], ennemis_extra: 0, allies_dispo: [],
    xp: 85, cauris: 140,
  },
  {
    id: 'c_lundgren', num: 'C6', name: 'Lundgren', mode: 'COMBAT', req: 18,
    opponent: 'LUNDGREN', foeMult: 1.0, roundsToWin: 2, roundTime: 60,
    desc: "Sept siècles d'expérience contre quelques mois.",
    brief: "Il pose du Givre à chaque sort et compte jusqu'à trois. Après trois, on ne bouge plus — et il a tout son temps.",
    ennemis: ['LUNDGREN'], ennemis_extra: 0, allies_dispo: [],
    xp: 90, cauris: 150,
  },
  {
    id: 'c_sub', num: 'C7', name: 'Sub', mode: 'COMBAT', req: 24,
    opponent: 'SUB', foeMult: 1.05, roundsToWin: 2, roundTime: 60,
    desc: "L'opérateur. Six mois d'observation, zéro improvisation.",
    brief: "Sub disparaît dès qu'il est en danger et revient dès que vous ne l'êtes plus. Il ne vole pas seulement des vies : il vole du temps.",
    ennemis: ['SUB'], ennemis_extra: 0, allies_dispo: [],
    xp: 100, cauris: 170,
  },
  {
    id: 'c_grob', num: 'C8', name: 'Grob', mode: 'COMBAT', req: 30,
    opponent: 'GROB', foeMult: 1.05, roundsToWin: 2, roundTime: 60,
    desc: "La masse de passage. Elle renvoie ce qu'on lui donne.",
    brief: "Frapper Grob coûte cher : il renvoie un cinquième de ce qu'il encaisse. Et chaque round qu'il gagne le rend plus rapide à relancer ses coups.",
    ennemis: ['GROB'], ennemis_extra: 0, allies_dispo: [],
    xp: 110, cauris: 185,
  },
  {
    id: 'c_ousmane', num: 'C9', name: 'Ousmane', mode: 'COMBAT', req: 38,
    opponent: 'OUSMANE', foeMult: 1.1, roundsToWin: 2, roundTime: 60,
    desc: "Le Gardien du Port tient la distance et la ligne.",
    brief: "Ousmane frappe plus fort quand on est bas. Terminer un round à moitié mort contre lui, c'est rarement terminer un round.",
    ennemis: ['OUSMANE'], ennemis_extra: 0, allies_dispo: [],
    xp: 120, cauris: 200,
  },
  {
    id: 'c_schissin', num: 'C10', name: 'Schissin-Rouge', mode: 'COMBAT', req: 46,
    opponent: 'SCHISSIN', foeMult: 1.12, roundsToWin: 2, roundTime: 60,
    desc: "Le nom du carnet, sans son uniforme.",
    brief: "Il renvoie un quart des dégâts au corps-à-corps et provoque pour vous garder près de lui. Un duel contre Schissin se gagne rarement à l'usure.",
    ennemis: ['SCHISSIN'], ennemis_extra: 0, allies_dispo: [],
    xp: 135, cauris: 230,
  },
  {
    id: 'c_sylla', num: 'C11', name: 'Sylla', mode: 'COMBAT', req: 55,
    opponent: 'SYLLA', foeMult: 1.15, roundsToWin: 2, roundTime: 60,
    desc: "Le Commissaire, et la Pierre du Feu qu'il porte sur lui.",
    brief: "Chacune de ses capacités embrase la zone autour de lui. Rester à portée de Sylla, c'est brûler deux fois : une fois par le coup, une fois après.",
    ennemis: ['SYLLA'], ennemis_extra: 0, allies_dispo: [],
    xp: 150, cauris: 260,
  },
  {
    id: 'c_krag', num: 'C12', name: 'Krag', mode: 'COMBAT', req: 64,
    opponent: 'KRAG', foeMult: 1.18, roundsToWin: 2, roundTime: 75,
    desc: "La plaque d'obsidienne. Les contrôles glissent dessus.",
    brief: "Krag résiste à quarante pour cent de la durée des contrôles : l'étourdir ne fait que le ralentir. Il faudra le battre à la régulière.",
    ennemis: ['KRAG'], ennemis_extra: 0, allies_dispo: [],
    xp: 165, cauris: 290,
  },
  {
    id: 'c_murk', num: 'C13', name: 'Murk', mode: 'COMBAT', req: 72,
    opponent: 'MURK', foeMult: 1.2, roundsToWin: 2, roundTime: 75,
    desc: "L'émissaire liquide. Il gèle avant de frapper.",
    brief: "Murk empile le Givre et fige au troisième cumul. Le round se joue sur une seule question : combien de temps peut-on rester mobile ?",
    ennemis: ['MURK'], ennemis_extra: 0, allies_dispo: [],
    xp: 180, cauris: 320,
  },
  {
    id: 'c_vael', num: 'C14', name: 'Vael', mode: 'COMBAT', req: 82,
    opponent: 'VAEL', foeMult: 1.25, roundsToWin: 3, roundTime: 60,
    desc: "La Lame Invisible. Trois rounds gagnants, parce qu'il insiste.",
    brief: "Plus rapide que le son, et chaque round gagné le rend plus rapide encore. Le seul duel du jeu qui se joue en trois manches gagnantes.",
    ennemis: ['VAEL'], ennemis_extra: 0, allies_dispo: [],
    xp: 220, cauris: 400,
  },
  {
    id: 'c_sgrun', num: 'C15', name: 'Sgrün', mode: 'COMBAT', req: 95,
    opponent: 'SGRUN', foeMult: 1.3, roundsToWin: 3, roundTime: 90,
    desc: "Celui qui décide. Le dernier duel.",
    brief: "Il régénère en continu, ses ultimes frappent un quart plus fort, et il fait apparaître des émissaires quand la distance lui déplaît. À réserver pour la fin.",
    ennemis: ['SGRUN'], ennemis_extra: 0, allies_dispo: [],
    xp: 300, cauris: 600,
  },
];

/** Duels accessibles selon l'avancement en campagne. */
export function duelsAvailable(missionsDoneCount){
  return DUELS.filter(d => missionsDoneCount >= d.req);
}

// ── Combat libre ─────────────────────────────────────────────
// On choisit son personnage (parmi les héros débloqués) et l'adversaire
// de l'IA (parmi ceux déjà affrontés, en campagne ou en duel). Pas de
// progression à débloquer : c'est un terrain d'entraînement, les
// récompenses restent donc modestes.

export const FREE_DUEL = {
  id: 'c_libre', num: 'C★', name: 'Combat libre', mode: 'COMBAT', req: 0, free: true,
  opponent: 'BABA', foeMult: 1.0, roundsToWin: 2, roundTime: 60,
  desc: "Ton personnage, ton adversaire.",
  brief: "Choisis avec qui tu te bats et contre qui. Deux rounds gagnants, rien d'autre en jeu que le combat.",
  ennemis: ['BABA'], ennemis_extra: 0, allies_dispo: [],
  xp: 20, cauris: 25,
};

/** Adversaires déjà rencontrés : ennemis des missions et duels gagnés. */
export function opponentsFaced(save){
  const seen = new Set();
  const done = new Set(save.missions_done || []);
  for(const acte of CAMPAIGN) for(const m of acte.missions){
    if(done.has(m.id)) for(const k of (m.ennemis || [])) seen.add(k);
  }
  const defis = new Set(save.defis_done || []);
  for(const d of DUELS) if(defis.has(d.id)) seen.add(d.opponent);
  // Baba est le premier adversaire du jeu : toujours proposé.
  seen.add('BABA');
  return [...seen].filter(k => CHAMPS[k]);
}
