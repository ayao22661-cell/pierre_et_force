// ============================================================
// DÉFIS — missions alternatives, en dehors de la campagne.
//
// La campagne est linéaire : 50 missions à la suite, chacune
// verrouillée par la précédente. Les défis donnent une autre façon de
// jouer : ils sont REJOUABLES autant de fois qu'on veut, se débloquent
// à l'avancement (`req` = nombre de missions de campagne terminées),
// et rapportent des cauris et de l'XP pour préparer un passage
// difficile ou tester un héros.
//
// Le format est celui d'une mission de campagne (l'écran de
// déploiement et le moteur de combat n'ont rien à savoir de plus) :
//   id, num, name, desc, brief, mode, allies_dispo, ennemis,
//   ennemis_extra, xp, cauris.
// ============================================================

export const DEFIS = [
  {
    id: 'd_cour', foeMult: 0.42, num: 'D1', name: 'La Cour Ouverte',
    mode: 'ARÈNE', req: 0,
    desc: "Un duel rapide dans la cour, sans enjeu — juste pour la main.",
    brief: "Pas d'Empire, pas de pierre à protéger. La cour de la Villoise, un adversaire, et le temps de trouver ses appuis. Le genre d'entraînement qu'on refait volontiers.",
    allies_dispo: ['KAREN', 'FULGENCE'],
    ennemis: ['BABA'], ennemis_extra: 2,
    xp: 45, cauris: 60,
  },
  {
    id: 'd_marche', foeMult: 0.5, num: 'D2', name: 'Le Marché d\'Adjamé',
    mode: 'DÉFENSE', req: 2,
    desc: "Tenir l'allée centrale pendant que les vendeuses remballent.",
    brief: "Les hommes de Sylla remontent l'allée du marché. Personne ne part tant que les étals ne sont pas vidés : il faut tenir la position, pas gagner du terrain.",
    allies_dispo: ['KAREN', 'FULGENCE', 'SAM'],
    ennemis: ['SGRUN'], ennemis_extra: 6,
    xp: 70, cauris: 110,
  },
  {
    id: 'd_port', foeMult: 0.56, num: 'D3', name: 'Quai de Nuit',
    mode: 'SIÈGE', req: 5,
    desc: "Remonter le quai jusqu'au poste de sécurité.",
    brief: "Le Port dort mal. Les conteneurs font un couloir jusqu'au poste d'Ousmane, et la seule façon d'avancer est de pousser, rangée après rangée.",
    allies_dispo: ['KAREN', 'FULGENCE', 'SAM', 'LUNDGREN'],
    ennemis: ['OUSMANE', 'SGRUN'], ennemis_extra: 8,
    xp: 95, cauris: 160,
  },
  {
    id: 'd_ombre', foeMult: 0.62, num: 'D4', name: 'Face à l\'Ombre',
    mode: 'BOSS', req: 9,
    desc: "Un duel contre ton reflet. Il connaît tous tes gestes.",
    brief: "Dark n'a pas de leçon à recevoir : il est ce que Tarine serait devenu sans jamais reposer la pierre. Aucun allié, aucune excuse. Juste les deux.",
    allies_dispo: [],
    ennemis: ['DARK'], ennemis_extra: 0,
    xp: 130, cauris: 220,
  },
  {
    id: 'd_banco', foeMult: 0.6, num: 'D5', name: 'La Forêt Sans Fin',
    mode: 'ARÈNE', req: 12,
    desc: "Vagues d'émissaires sous les arbres du Banco.",
    brief: "Sous la canopée, on ne voit jamais d'où vient le suivant. L'Empire envoie ce qu'il a sous la main, et il en a beaucoup.",
    allies_dispo: ['KAREN', 'FULGENCE', 'SAM', 'LUNDGREN'],
    ennemis: ['SGRUN', 'SCHISSIN'], ennemis_extra: 10,
    xp: 120, cauris: 200,
  },
  {
    id: 'd_kong', foeMult: 0.68, num: 'D6', name: 'Le Rempart de Kong',
    mode: 'DÉFENSE', req: 18,
    desc: "Tenir la brèche jusqu'au bout, contre tout ce qui arrive.",
    brief: "La vieille muraille n'a qu'une brèche, et l'Empire l'a trouvée. Ici, on ne compte pas les ennemis, on compte les minutes.",
    allies_dispo: ['KAREN', 'FULGENCE', 'SAM', 'LUNDGREN', 'BABA'],
    ennemis: ['KRAG', 'GROB'], ennemis_extra: 12,
    xp: 160, cauris: 300,
  },
  {
    id: 'd_harmattan', foeMult: 0.72, num: 'D7', name: 'Course du Harmattan',
    mode: 'SIÈGE', req: 25,
    desc: "Percer jusqu'à l'Autel avant que le vent ne tourne.",
    brief: "Vael ne se montre qu'après le coup. Avancer vite vaut mieux qu'avancer prudemment : plus le combat traîne, plus la Lame Invisible trouve un angle.",
    allies_dispo: ['KAREN', 'FULGENCE', 'SAM', 'LUNDGREN', 'BABA', 'DARK'],
    ennemis: ['VAEL', 'MURK'], ennemis_extra: 10,
    xp: 190, cauris: 360,
  },
  {
    id: 'd_empire', foeMult: 0.8, num: 'D8', name: 'Le Bureau de Sgrün',
    mode: 'BOSS', req: 35,
    desc: "Ce n'est pas un homme qu'on affronte, c'est une structure.",
    brief: "Au bout du couloir, un costume croisé et deux yeux. Sgrün n'élève jamais la voix : il n'en a pas besoin. Le défi le plus dur du jeu.",
    allies_dispo: ['KAREN', 'FULGENCE', 'SAM', 'LUNDGREN', 'BABA'],
    ennemis: ['SGRUN'], ennemis_extra: 4,
    xp: 260, cauris: 500,
  },
];

/** Défis accessibles au joueur, selon son avancement dans la campagne. */
export function defisAvailable(missionsDoneCount){
  return DEFIS.filter(d => missionsDoneCount >= d.req);
}
