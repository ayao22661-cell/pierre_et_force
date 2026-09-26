// ============================================================
// MISSIONS AJOUTÉES — la campagne passe de 50 à 100 missions.
//
// Elles ne remplacent rien : elles s'intercalent dans les actes
// existants (champ `at` = position d'insertion dans l'acte), pour
// densifier la trame sans la réécrire. campaign.js les fusionne au
// chargement et renumérote l'ensemble de 1 à 100.
//
// Elles font aussi entrer en scène les champions ennemis qui
// n'existaient pas encore : Sylla, Schissin-Rouge, Ousmane, Sub,
// Grob, Krag, Murk, Vael et Sgrün lui-même.
// ============================================================

export const EXTRA = [

  // ═══ ACTE I — LE CADEAU DE PAPA ═══════════════════════════
  {
    acte: 'acte1', at: 1,
    id: 'm101', name: "Les Voisins Curieux",
    desc: "La cour a vu quelque chose. Maintenant tout le quartier veut voir.",
    brief: "La nouvelle a fait le tour de Marcory en une heure : le Bricoleur a arrêté un coup de poing sans bouger. Trois gars du quartier voisin viennent vérifier eux-mêmes, et ils ne comptent pas demander poliment.",
    allies_requis: [], allies_dispo: ["KAREN", "FULGENCE"],
    ennemis: ["BABA"], ennemis_extra: 3,
    xp: 55,
    narr_avant: [
      "Fin d'après-midi. Les portails de la cour sont restés ouverts, et ça se voit.",
      "— Ils sont six, dit Fulgence sans lever les yeux de son moteur. Peut-être sept.",
      "Tarine serre la pierre dans sa poche. Elle est tiède, calme. Elle ne prévient jamais."
    ],
    narr_victoire: [
      "Le dernier repart en boitant, plus vexé que blessé, en jurant que c'était un coup de chance.",
      "Fulgence essuie ses mains sur son bleu de travail.",
      "— Capitaine, il va falloir fermer ce portail."
    ],
    narr_defaite: [
      "Trop nombreux, trop vite. La cour se vide, les rires portent loin dans la nuit qui tombe.",
      "Fulgence ramasse la caisse à outils renversée sans rien dire."
    ],
    journal_victoire: "Six personnes sont venues voir si l'histoire était vraie. Ce matin, j'avais un secret. Ce soir, j'ai une réputation. Je ne sais pas encore laquelle des deux est la plus dangereuse."
  },
  {
    acte: 'acte1', at: 2,
    id: 'm102', name: "La Panne de la Villoise",
    desc: "L'atelier tombe en panne au pire moment — et on en profite.",
    brief: "Coupure de courant sur tout le pâté de maisons. Dans le noir de l'atelier, des silhouettes s'intéressent d'un peu trop près aux caisses de pièces détachées. Il faut tenir jusqu'au retour de la lumière.",
    allies_requis: [], allies_dispo: ["FULGENCE", "KAREN"],
    ennemis: ["BABA", "DARK"], ennemis_extra: 3,
    xp: 60,
    narr_avant: [
      "La lumière meurt d'un coup. Les ventilateurs ralentissent, puis se taisent.",
      "Dans le noir, un raclement de métal contre le béton. Quelqu'un est déjà entré.",
      "La pierre, elle, s'allume faiblement au creux de la main. Juste assez pour voir."
    ],
    narr_victoire: [
      "Le courant revient d'un seul coup, éclairant une cour vide et des caisses intactes.",
      "— Tu éclairais, dit Fulgence. Tu as vu ça ? Tu éclairais."
    ],
    narr_defaite: [
      "Quand la lumière revient, il manque trois caisses et la moitié de l'outillage.",
      "Fulgence ne dit rien. C'est pire que s'il criait."
    ],
    journal_victoire: "Dans le noir, la pierre a donné de la lumière. Pas beaucoup. Assez. Papa savait-il qu'elle faisait ça ?"
  },
  {
    acte: 'acte1', at: 4,
    id: 'm103', name: "Sous le Manguier du Banco",
    desc: "La forêt ne laisse pas entrer n'importe qui, ni n'importe comment.",
    brief: "À deux cents mètres du sentier, la pierre s'est mise à battre comme un cœur pressé. Ce qui vit sous le couvert du Banco l'a sentie aussi, et n'apprécie pas la visite.",
    allies_requis: [], allies_dispo: ["KAREN", "FULGENCE"],
    ennemis: ["DARK"], ennemis_extra: 3,
    xp: 70,
    narr_avant: [
      "Le Banco avale les bruits de la ville en vingt pas. Après, il n'y a plus que l'eau qui tombe des feuilles.",
      "La pierre bat plus fort. Plus vite qu'un cœur d'homme.",
      "Quelque chose bouge dans les fougères, à hauteur de hanche."
    ],
    narr_victoire: [
      "Le calme revient d'un coup, comme si on avait refermé une porte.",
      "Au pied du manguier géant, l'écorce porte une entaille ancienne, nette, faite de main d'homme.",
      "Trois traits. Le même signe que sur le colis."
    ],
    narr_defaite: [
      "La forêt les repousse jusqu'au sentier sans jamais se montrer vraiment.",
      "La pierre s'est tue. Il faudra revenir."
    ],
    journal_victoire: "Trois traits gravés dans un manguier du Banco, les mêmes que sur mon colis. Papa est venu ici. Avant moi. Il y a longtemps."
  },
  {
    acte: 'acte1', at: 5,
    id: 'm104', name: "Les Chercheurs de Pierre",
    desc: "D'autres suivent la même piste, et ils ont de l'avance.",
    brief: "Sur le chemin du retour, les traces sont fraîches : campement démonté à la hâte, sacs de fouille, matériel qui n'a rien d'ivoirien. Ils cherchent la même chose, et ils savent déjà que quelqu'un d'autre cherche aussi.",
    allies_requis: [], allies_dispo: ["KAREN", "FULGENCE"],
    ennemis: ["BABA", "DARK"], ennemis_extra: 3,
    xp: 75,
    narr_avant: [
      "Des piquets de tente arrachés, une bâche pliée trop vite, et des empreintes de rangers.",
      "— Ce ne sont pas des braconniers, dit Karen. Regarde le matériel.",
      "Au bout du sentier, deux hommes attendent, et ils n'ont pas l'air surpris de les voir."
    ],
    narr_victoire: [
      "Le carnet tombé dans la boue n'a que trois pages écrites, en allemand, d'une main pressée.",
      "Un seul mot revient à chaque ligne : Grün."
    ],
    narr_defaite: [
      "Ils décrochent, méthodiques, sans paniquer — comme des gens qui reviendront.",
      "Karen aide Tarine à se relever. — Ils savaient qu'on venait."
    ],
    journal_victoire: "Ils ne fouillaient pas au hasard. Ils avaient une carte, et je crois que c'est la même que celle de Papa."
  },

  // ═══ ACTE II — LE ROYAUME DE L'ESSENCE ════════════════════
  {
    acte: 'acte2', at: 0,
    id: 'm105', name: "Le Seuil de Sam",
    desc: "Avant d'entrer, il faut apprendre à tenir debout de l'autre côté.",
    brief: "Le Royaume ne fonctionne pas comme Abidjan. Sam fait passer un premier test tout simple : rester soi-même pendant que le décor essaie de convaincre du contraire.",
    allies_requis: ["SAM"], allies_dispo: [],
    ennemis: ["DARK"], ennemis_extra: 2,
    xp: 80,
    narr_avant: [
      "L'herbe est turquoise et ne plie pas sous le pied. Le ciel n'a pas de soleil, et pourtant tout porte une ombre.",
      "— Ici, ce que tu crois change ce qui est, dit Sam. Alors fais attention à ce que tu crois.",
      "Des formes se lèvent au bout de l'allée de marbre. Elles ont le visage de gens du quartier."
    ],
    narr_victoire: [
      "Les formes se défont comme de la fumée qu'on chasse de la main.",
      "— Bien, dit Sam. Tu as compris la première chose : ce n'est pas parce que ça porte un visage connu que c'est quelqu'un."
    ],
    narr_defaite: [
      "Tarine a hésité une seconde de trop devant un visage familier. Une seconde, ici, c'est long.",
      "— Recommence, dit Sam, sans reproche."
    ],
    journal_victoire: "Sam dit que le Royaume montre ce qu'on attend. Aujourd'hui il m'a montré Papa, de dos. Je ne me suis pas retourné. C'est peut-être la chose la plus dure que j'aie faite."
  },
  {
    acte: 'acte2', at: 4,
    id: 'm106', name: "L'Épreuve du Souffle",
    desc: "Apprendre à lâcher sans se perdre.",
    brief: "La deuxième épreuve ne demande pas de force. Elle demande de laisser passer — coups, mots, peur — sans rien retenir. Le Royaume est très doué pour donner envie de retenir.",
    allies_requis: ["SAM"], allies_dispo: [],
    ennemis: ["DARK", "BABA"], ennemis_extra: 2,
    xp: 85,
    narr_avant: [
      "Le vent du Royaume porte des voix. Aucune n'est aimable.",
      "— Ne réponds pas, dit Sam. Si tu réponds, tu tiens. Si tu tiens, tu tombes."
    ],
    narr_victoire: [
      "Le vent tombe. Les voix avec.",
      "— Tu vois, dit Sam. Rien n'est passé parce que tu n'as rien attrapé."
    ],
    narr_defaite: [
      "Une phrase de trop, et Tarine a répondu. Le Royaume s'engouffre dans la fissure.",
      "— Ce n'est pas grave, dit Sam. C'est même normal."
    ],
    journal_victoire: "J'ai laissé passer des choses très laides aujourd'hui sans les attraper. Je ne savais pas que c'était une forme de force."
  },
  {
    acte: 'acte2', at: 3,
    id: 'm107', name: "Le Reflet qui Ment",
    desc: "Le lac renvoie une image. Elle n'est pas d'accord pour rester dedans.",
    brief: "Au bord du lac d'Essence, le reflet de Tarine se lève avant lui. Il connaît tout : ses gestes, ses doutes, ses raccourcis. Il n'a simplement aucune limite.",
    allies_requis: ["SAM"], allies_dispo: [],
    ennemis: ["DARK"], ennemis_extra: 2,
    xp: 90,
    narr_avant: [
      "L'eau est immobile comme une plaque de verre.",
      "Le reflet se redresse. Tarine, lui, n'a pas bougé.",
      "— Celui-là, dit Sam en reculant, je ne peux pas le combattre à ta place."
    ],
    narr_victoire: [
      "Le reflet se disperse en cercles concentriques, sans un bruit.",
      "Sur l'eau redevenue lisse, il n'y a plus qu'un visage. Le bon."
    ],
    narr_defaite: [
      "Le reflet connaissait le coup d'avance. Évidemment.",
      "— Il est toi, dit Sam. Alors deviens quelqu'un qu'il ne connaît pas encore."
    ],
    journal_victoire: "Je me suis battu contre moi et j'ai gagné. Sam dit que ça ne veut pas dire que j'ai raison. Juste que je peux vivre avec moi."
  },
  {
    acte: 'acte2', at: 6,
    id: 'm108', name: "La Main Tendue",
    desc: "Sortir du Royaume sans laisser quelqu'un dedans.",
    brief: "Un Éveillé n'est jamais ressorti de la deuxième épreuve : il est resté, il y a des années. Il ne veut pas partir, et il ne veut pas que quelqu'un d'autre parte non plus.",
    allies_requis: ["SAM"], allies_dispo: [],
    ennemis: ["BABA", "DARK"], ennemis_extra: 2,
    xp: 95,
    narr_avant: [
      "Il est assis sur une colonne brisée, comme s'il attendait depuis toujours.",
      "— Tu as trouvé la sortie ? demande-t-il d'une voix douce. Moi aussi. Deux fois."
    ],
    narr_victoire: [
      "Quand il tombe, il sourit — et il remercie.",
      "— Il était là avant moi, dit Sam. Bien avant."
    ],
    narr_defaite: [
      "Il s'assied à nouveau sur sa colonne, patient, et attend le prochain.",
      "— On repart, dit Sam. Tout de suite."
    ],
    journal_victoire: "Quelqu'un est resté ici jusqu'à devenir un obstacle. Je ne veux pas finir comme lui : quelqu'un que les autres doivent contourner."
  },

  // ═══ ACTE III — LE BORN LAND ══════════════════════════════
  {
    acte: 'acte3', at: 1,
    id: 'm109', name: "Les Marcheurs Gris",
    desc: "Le Born Land ne souhaite pas la bienvenue. Il évalue.",
    brief: "Les premiers habitants rencontrés ne parlent pas. Ils mesurent, ils comparent, et ils décident si un porteur de pierre a le droit de traverser leurs terres.",
    allies_requis: [], allies_dispo: ["SAM", "KAREN"],
    ennemis: ["DARK", "BABA"], ennemis_extra: 3,
    xp: 100,
    narr_avant: [
      "Une plaine grise, sans horizon net. Le vent porte une poussière qui ne se pose jamais.",
      "Ils sont douze, alignés, immobiles. Ils regardent la pierre, pas le porteur."
    ],
    narr_victoire: [
      "Ils s'écartent enfin, sans un mot, et forment un couloir.",
      "— Ce n'était pas une attaque, dit Sam. C'était un examen."
    ],
    narr_defaite: [
      "Ils reculent d'un pas, referment la ligne, et attendent la prochaine tentative."
    ],
    journal_victoire: "Ici, personne ne demande d'où tu viens. On te demande ce que tu vaux sans ta pierre. C'est une question qui fait mal."
  },
  {
    acte: 'acte3', at: 2,
    id: 'm110', name: "Le Marché des Borns",
    desc: "Tout s'échange ici. Même ce qu'on ne voulait pas vendre.",
    brief: "Sur le marché du Born Land, on troque des outils, des souvenirs et des morceaux de volonté. Une transaction tourne mal quand un marchand réclame la pierre en paiement.",
    allies_requis: [], allies_dispo: ["SAM", "KAREN"],
    ennemis: ["SUB"], ennemis_extra: 3,
    xp: 105,
    narr_avant: [
      "Des étals de pierre sèche, des lampes à huile, et pas un seul prix affiché.",
      "— Ne promets rien ici, souffle Sam. Une promesse, c'est une monnaie.",
      "Un homme en costume sombre observe la scène depuis le fond de l'allée. Il ne vend rien."
    ],
    narr_victoire: [
      "L'homme en costume s'en va sans se presser, en époussetant sa manche.",
      "— Celui-là n'est pas d'ici, dit Sam. Celui-là vient d'Abidjan."
    ],
    narr_defaite: [
      "Le marché se referme autour d'eux comme une main.",
      "L'homme en costume, lui, a déjà disparu."
    ],
    journal_victoire: "Un homme en costume au milieu du Born Land, qui n'achète rien et ne vend rien. Il était là pour regarder. Pour me regarder, moi."
  },
  {
    acte: 'acte3', at: 4,
    id: 'm111', name: "La Nuit sans Étoiles",
    desc: "Tenir le campement jusqu'au matin. S'il y a un matin.",
    brief: "La nuit du Born Land dure ce qu'elle décide. Le campement est cerné par des choses qui ne cherchent pas à tuer, mais à user — vague après vague, jusqu'à ce que quelqu'un cède.",
    allies_requis: [], allies_dispo: ["SAM", "KAREN", "FULGENCE"],
    ennemis: ["DARK", "SUB"], ennemis_extra: 4,
    xp: 110,
    narr_avant: [
      "Pas de lune, pas d'étoiles. Juste le feu de camp et ce qu'il éclaire.",
      "— Ils ne veulent pas nous tuer, dit Karen. Ils veulent qu'on abandonne."
    ],
    narr_victoire: [
      "Le ciel gris pâlit enfin, sans se lever vraiment.",
      "Le feu est éteint depuis longtemps. Personne n'a cédé."
    ],
    narr_defaite: [
      "Au petit matin, le campement est intact. Simplement, plus personne n'a envie de continuer.",
      "C'est exactement ce qu'ils voulaient."
    ],
    journal_victoire: "Ils nous ont usés toute la nuit sans jamais frapper fort. J'ai compris que la fatigue est une arme. Sgrün doit le savoir aussi."
  },
  {
    acte: 'acte3', at: 6,
    id: 'm112', name: "Le Rosmog Blessé",
    desc: "Un émissaire à terre est encore un émissaire.",
    brief: "Le Rosmog a reculé, mais il n'est pas parti. Acculé dans les ruines basses, il n'a plus de plan — et c'est ce qui le rend dangereux.",
    allies_requis: [], allies_dispo: ["SAM", "KAREN"],
    ennemis: ["GROB"], ennemis_extra: 3,
    xp: 120,
    narr_avant: [
      "Une traînée sombre sur la pierre grise. Il saigne quelque chose qui n'est pas du sang.",
      "— Il appelle, dit Sam. Depuis dix minutes, il appelle quelqu'un."
    ],
    narr_victoire: [
      "Il s'effondre enfin, et ce qui le tenait debout s'évapore dans l'air gris.",
      "Loin, très loin, quelque chose a entendu son appel et a noté l'adresse."
    ],
    narr_defaite: [
      "Acculé, il frappe deux fois plus fort. Il faut décrocher.",
      "— On le reprend, dit Sam. Autrement."
    ],
    journal_victoire: "Il appelait à l'aide dans une langue que je n'ai pas comprise. Sam dit que quelqu'un a répondu. C'est la première fois que j'ai peur de quelque chose que je n'ai pas encore vu."
  },

  // ═══ ACTE IV — L'HOMME EN BLEU ════════════════════════════
  {
    acte: 'acte4', at: 1,
    id: 'm113', name: "Le Quartier Sous Surveillance",
    desc: "Marcory est sous les yeux de quelqu'un, et ça se sent.",
    brief: "Deux voitures banalisées stationnées depuis trois jours, des visages nouveaux au maquis, et des questions posées aux voisins. Il est temps de savoir qui regarde.",
    allies_requis: [], allies_dispo: ["KAREN", "FULGENCE"],
    ennemis: ["SUB"], ennemis_extra: 3,
    xp: 115,
    narr_avant: [
      "La rue est normale. Trop normale, comme quand tout le monde fait semblant.",
      "— La 4x4 grise, dit Fulgence sans tourner la tête. Depuis mardi. Personne n'en descend jamais."
    ],
    narr_victoire: [
      "La 4x4 démarre enfin et s'en va sans se presser.",
      "Sur le siège arrière, une chemise cartonnée est restée ouverte. Une photo de Tarine à douze ans."
    ],
    narr_defaite: [
      "Ils partent quand ils ont fini, pas quand on le leur demande.",
      "Karen referme le portail. — Ils reviendront."
    ],
    journal_victoire: "Ils ont une photo de moi à douze ans. Ça veut dire qu'ils me suivent depuis bien avant la pierre. Ça veut dire qu'ils suivaient Papa."
  },
  {
    acte: 'acte4', at: 4,
    id: 'm114', name: "Les Yeux du Commissaire",
    desc: "Sylla veut voir de ses yeux ce qu'on lui a raconté.",
    brief: "Contrôle de police au carrefour de Marcory, à une heure où il n'y a rien à contrôler. Sylla est descendu de voiture, ce qu'il ne fait jamais.",
    allies_requis: [], allies_dispo: ["KAREN", "FULGENCE"],
    ennemis: ["SYLLA"], ennemis_extra: 3,
    xp: 125,
    narr_avant: [
      "Gyrophares sans sirène. Six hommes, et un septième qui reste près de la portière.",
      "Il regarde Tarine longtemps, sans rien demander.",
      "— Alors c'est toi, dit-il enfin. Tu ressembles à ton père."
    ],
    narr_victoire: [
      "Sylla recule vers sa voiture sans se retourner, et il n'a pas l'air pressé.",
      "— À bientôt, dit-il. Vraiment."
    ],
    narr_defaite: [
      "Il laisse ses hommes finir le travail et remonte en voiture, déjà ailleurs.",
      "Il n'était pas venu pour gagner. Il était venu pour mesurer."
    ],
    journal_victoire: "Sylla connaissait Papa. Il l'a dit comme on parle de quelqu'un qu'on a longtemps regardé de loin. Ou de très près."
  },
  {
    acte: 'acte4', at: 3,
    id: 'm115', name: "Le Toit de Cocody",
    desc: "Sortir de la villa est plus dur que d'y entrer.",
    brief: "La reconnaissance a réussi, ce qui est déjà un problème : Sylla sait maintenant qu'on est venu. Il reste à traverser les toits de Cocody avant que le cordon se referme.",
    allies_requis: [], allies_dispo: ["KAREN", "SAM"],
    ennemis: ["SCHISSIN"], ennemis_extra: 3,
    xp: 130,
    narr_avant: [
      "Les tôles chauffent encore de la journée. En bas, les portails claquent les uns après les autres.",
      "— Ils ferment le quartier, dit Karen. Trois minutes, peut-être."
    ],
    narr_victoire: [
      "Le dernier mur franchi donne sur un terrain vague, et le terrain vague sur la liberté.",
      "Derrière eux, les gyrophares balayent des toits vides."
    ],
    narr_defaite: [
      "Le cordon se referme plus vite que prévu. Il faut redescendre, et payer le prix.",
      "Sam couvre la retraite sans un mot de reproche."
    ],
    journal_victoire: "Un homme en rouge dirigeait la manœuvre depuis le sol. Karen dit que tout le monde l'appelle Schissin-Rouge. Ce nom-là, je l'ai déjà lu dans le carnet de Papa."
  },
  {
    acte: 'acte4', at: 7,
    id: 'm116', name: "La Cache de Samia",
    desc: "Protéger Samia le temps qu'elle disparaisse pour de bon.",
    brief: "Samia Koné a accepté de partir, mais pas les mains vides : elle emporte ce que le Général lui avait confié. L'immeuble est déjà surveillé quand ils arrivent.",
    allies_requis: [], allies_dispo: ["KAREN", "FULGENCE"],
    ennemis: ["SUB", "SYLLA"], ennemis_extra: 3,
    xp: 135,
    narr_avant: [
      "Quatrième étage, cage d'escalier sans lumière. Samia tient un sac contre elle comme un enfant.",
      "— Il m'avait dit : si un jour quelqu'un vient avec la pierre, donne-lui ça."
    ],
    narr_victoire: [
      "Le taxi démarre, Samia dedans, le sac sur les genoux.",
      "Dans la main de Tarine : une clé de consigne, et une adresse au port."
    ],
    narr_defaite: [
      "Ils sont montés trop vite. Samia part quand même, mais sans le sac.",
      "— On le récupérera, dit Karen. On n'a pas le choix."
    ],
    journal_victoire: "Papa avait tout préparé. Une clé, une consigne, une adresse au port. Il savait qu'il ne serait pas là pour me l'expliquer."
  },

  // ═══ ACTE V — NOUVEAU DÉPART ══════════════════════════════
  {
    acte: 'acte5', at: 1,
    id: 'm117', name: "Six Mois à Abidjan",
    desc: "Sub n'est pas de passage. Il s'est installé.",
    brief: "L'adresse trouvée chez Samia mène à un entrepôt de Koumassi loué depuis exactement six mois. Sub y travaille, méthodiquement, comme un employé consciencieux.",
    allies_requis: [], allies_dispo: ["KAREN", "SAM", "FULGENCE"],
    ennemis: ["SUB"], ennemis_extra: 3,
    xp: 140,
    narr_avant: [
      "Un entrepôt propre, rangé, éclairé au néon. Des cartons étiquetés à la main.",
      "— Bonsoir, dit Sub sans lever les yeux de son inventaire. J'ai presque fini."
    ],
    narr_victoire: [
      "L'inventaire reste ouvert sur la table : une liste de noms d'Abidjan, avec des croix devant certains.",
      "Le nom du Général Keïta est en haut. La croix est ancienne."
    ],
    narr_defaite: [
      "Sub se retire par l'arrière, sans précipitation, en refermant derrière lui.",
      "Il a emporté l'inventaire."
    ],
    journal_victoire: "Sub tenait une liste. Des gens d'ici, avec des croix. Papa était le premier. Ce n'est pas une chasse aux pierres, c'est une chasse aux gens qui savent."
  },
  {
    acte: 'acte5', at: 3,
    id: 'm118', name: "Le Passage de Grob",
    desc: "Grob ne reste jamais. Il vient, il casse, il repart.",
    brief: "Grob est arrivé à Abidjan ce matin et repartira ce soir. Entre les deux, il a une adresse à visiter : celle de la Villoise.",
    allies_requis: [], allies_dispo: ["FULGENCE", "KAREN"],
    ennemis: ["GROB"], ennemis_extra: 3,
    xp: 145,
    narr_avant: [
      "Le portail de l'atelier n'a pas été forcé. Il a été arraché, gonds compris.",
      "— Il est à l'intérieur, dit Fulgence. Et il ne se cache même pas."
    ],
    narr_victoire: [
      "Grob s'en va par où il est entré, sans un regard pour ce qu'il a cassé.",
      "L'atelier tient debout. De justesse."
    ],
    narr_defaite: [
      "Quand il ressort, il ne reste pas grand-chose de l'établi de Fulgence.",
      "Fulgence regarde ses outils par terre, longtemps."
    ],
    journal_victoire: "Grob n'a rien volé. Il est venu vérifier que la Villoise existait, et repartir. Pour lui, c'était une case à cocher."
  },
  {
    acte: 'acte5', at: 4,
    id: 'm119', name: "Les Derniers Cauris",
    desc: "Un départ, ça se prépare — et ça se paie.",
    brief: "Avant de partir, il faut de quoi tenir : matériel, contacts, promesses tenues. Le marché de Treichville se règle en cauris, et certains créanciers n'acceptent pas les retards.",
    allies_requis: [], allies_dispo: ["KAREN", "FULGENCE", "SAM"],
    ennemis: ["BABA", "SUB"], ennemis_extra: 3,
    xp: 140,
    narr_avant: [
      "Fin de marché, les vendeuses remballent, l'allée sent le poisson fumé et la poussière chaude.",
      "— Trois dettes, dit Baba en comptant sur ses doigts. Et je suis gentil."
    ],
    narr_victoire: [
      "Les comptes sont soldés, à la manière du quartier.",
      "Baba crache par terre, puis tend la main. — Reviens vivant, le Bricoleur."
    ],
    narr_defaite: [
      "Les dettes restent. Les portes, elles, se ferment une à une."
    ],
    journal_victoire: "Baba m'a serré la main avant que je parte. Ce n'était pas un adversaire, aujourd'hui. Je crois que je viens de perdre un ennemi."
  },
  {
    acte: 'acte5', at: 5,
    id: 'm120', name: "La Promesse à Karen",
    desc: "Le dernier soir, et la conversation qu'on repousse depuis des semaines.",
    brief: "La maison est calme, les sacs sont faits. Ce sera la dernière nuit à Marcory avant longtemps — et quelqu'un a décidé que ce serait aussi la dernière tout court.",
    allies_requis: ["KAREN"], allies_dispo: ["FULGENCE"],
    ennemis: ["SCHISSIN", "SUB"], ennemis_extra: 3,
    xp: 150,
    narr_avant: [
      "La cuisine jaune pâle, la même que toujours. Karen coupe des oignons pour un repas que personne n'aura le temps de manger.",
      "Dehors, un moteur s'arrête. Puis un deuxième.",
      "— Ils ont attendu le dernier soir, dit Karen. Bien sûr."
    ],
    narr_victoire: [
      "Au matin, la maison tient toujours debout, et la porte tient encore sur ses gonds.",
      "Karen pose la main sur l'épaule de Tarine. — Va. Je garde la maison."
    ],
    narr_defaite: [
      "Ils sont entrés. La maison ne sera plus jamais tout à fait la même.",
      "— Ça n'a rien changé, dit Karen. On part quand même."
    ],
    journal_victoire: "J'ai promis à Karen de revenir. Je n'ai pas promis quand. Je crois qu'elle a compris pourquoi."
  },

  // ═══ ACTE VI — LE PÔLE NORD ═══════════════════════════════
  {
    acte: 'acte6', at: 0,
    id: 'm121', name: "Le Convoi Blanc",
    desc: "Rien ne se déplace ici sans laisser de trace. Il suffit de suivre.",
    brief: "Des traces de chenilles fraîches dans la neige, larges de trois mètres, qui vont droit vers le nord. Ce qui les a laissées transporte quelque chose de lourd, et ne tient pas à être suivi.",
    allies_requis: [], allies_dispo: ["SAM", "LUNDGREN"],
    ennemis: ["SUB"], ennemis_extra: 3,
    xp: 155,
    narr_avant: [
      "Moins quarante. Le souffle gèle avant d'avoir quitté la bouche.",
      "— Ils ont trois heures d'avance, dit Lundgren. Et ils s'arrêtent toutes les deux heures."
    ],
    narr_victoire: [
      "Le convoi est abandonné dans la neige, moteurs encore tièdes.",
      "Dans la remorque : des caisses vides, et une plaque de métal noir gravée de lignes bleues."
    ],
    narr_defaite: [
      "Le convoi disparaît dans le blizzard. Les traces sont effacées en dix minutes."
    ],
    journal_victoire: "Ils transportaient des caisses vides vers le nord. On ne fait pas trois cents kilomètres dans la glace pour du vide. À moins d'aller chercher quelque chose."
  },
  {
    acte: 'acte6', at: 1,
    id: 'm122', name: "Les Sentinelles de Glace",
    desc: "La base n'a pas de clôture. Elle a mieux.",
    brief: "Autour du périmètre, des silhouettes immobiles depuis si longtemps que la glace les a prises. Elles ne dorment pas : elles attendent que quelque chose les réveille.",
    allies_requis: [], allies_dispo: ["SAM", "LUNDGREN", "FULGENCE"],
    ennemis: ["GROB", "SUB"], ennemis_extra: 3,
    xp: 160,
    narr_avant: [
      "Douze pylônes noirs plantés dans la glace, en demi-cercle. Entre eux, des formes debout.",
      "— Ne les regarde pas trop longtemps, dit Lundgren. Elles s'en rendent compte."
    ],
    narr_victoire: [
      "La glace cède autour des dernières silhouettes, qui s'effondrent en morceaux.",
      "Les pylônes s'éteignent l'un après l'autre. La base est ouverte."
    ],
    narr_defaite: [
      "Il faut reculer hors du demi-cercle. Les sentinelles ne poursuivent pas — elles reprennent leur place."
    ],
    journal_victoire: "Elles attendaient depuis des années dans la glace. Sgrün laisse des gardes qui n'ont besoin ni de manger ni de dormir. Combien de temps est-il prêt à attendre, lui ?"
  },
  {
    acte: 'acte6', at: 4,
    id: 'm123', name: "La Salle des Transactions",
    desc: "Ici, on échange des choses qui ne s'échangent pas.",
    brief: "Au cœur de la base, une salle circulaire couverte de registres. Ce ne sont pas des comptes : ce sont des accords passés avec des gens, un par ligne, sur des décennies.",
    allies_requis: ["SAM"], allies_dispo: ["LUNDGREN"],
    ennemis: ["SUB", "GROB"], ennemis_extra: 3,
    xp: 170,
    narr_avant: [
      "Des murs de registres jusqu'au plafond, tous de la même écriture fine et régulière.",
      "Sam ouvre un volume au hasard, lit trois lignes, et referme brutalement.",
      "— Il faut qu'on sorte d'ici, dit-il. Tout de suite."
    ],
    narr_victoire: [
      "Une page arrachée dans la poche, et la salle qui s'éteint derrière eux.",
      "Sur la page : une date d'il y a vingt ans, un nom d'Abidjan, et deux mots — accord refusé."
    ],
    narr_defaite: [
      "Les portes de la salle se referment. Il faut ressortir par où on est entré, sans rien."
    ],
    journal_victoire: "Papa a refusé un accord avec Sgrün il y a vingt ans. C'est écrit noir sur blanc. Ce n'est pas une guerre qui commence : c'est une facture qu'on vient présenter."
  },
  {
    acte: 'acte6', at: 6,
    id: 'm124', name: "Sous la Glace",
    desc: "La fissure descend plus bas que prévu, et quelque chose y vit.",
    brief: "La fuite passe par une crevasse qui s'enfonce sous la banquise. Il y fait plus chaud que dehors, ce qui est en soi une très mauvaise nouvelle.",
    allies_requis: [], allies_dispo: ["SAM", "LUNDGREN"],
    ennemis: ["MURK"], ennemis_extra: 3,
    xp: 175,
    narr_avant: [
      "La glace bleutée laisse passer une lumière qui ne vient de nulle part.",
      "L'eau, au fond, n'est pas gelée. Elle bouge toute seule.",
      "— Ce n'est pas de l'eau, dit Lundgren très doucement."
    ],
    narr_victoire: [
      "La chose se disperse dans la crevasse et disparaît sous la banquise.",
      "— Il n'est pas mort, dit Lundgren. On ne tue pas ça. On le repousse."
    ],
    narr_defaite: [
      "L'eau monte dans la crevasse plus vite qu'ils ne remontent. Il faut ressortir par la base."
    ],
    journal_victoire: "Quelque chose de liquide nous a suivis sous la glace. Lundgren dit que ça a un nom. Il a refusé de le prononcer tout haut."
  },

  // ═══ ACTE VII — L'HÉRITAGE DE MALI ════════════════════════
  {
    acte: 'acte7', at: 0,
    id: 'm125', name: "La Piste de Tombouctou",
    desc: "Le désert n'a pas de routes, mais il a des habitudes.",
    brief: "Trois jours de piste vers Niani, et une escorte qui n'était pas prévue au départ. Quelqu'un a payé pour que le convoi n'arrive pas.",
    allies_requis: [], allies_dispo: ["LUNDGREN", "SAM"],
    ennemis: ["SUB"], ennemis_extra: 3,
    xp: 165,
    narr_avant: [
      "Le sable rouge à perte de vue, et l'ombre courte de midi.",
      "Deux pick-up sur la crête, à l'arrêt, capots tournés vers la piste."
    ],
    narr_victoire: [
      "Les pick-up repartent vers l'est en soulevant la poussière.",
      "Dans l'un d'eux, oublié sur le siège : un plan des ruines de Niani, annoté en allemand."
    ],
    narr_defaite: [
      "Ils bloquent la piste jusqu'à la nuit. Il faudra contourner, et perdre deux jours."
    ],
    journal_victoire: "Ils avaient un plan des ruines annoté. En allemand. Comme le carnet du Banco. Sgrün ne cherche pas au hasard : il a fait ses devoirs avant nous."
  },
  {
    acte: 'acte7', at: 2,
    id: 'm126', name: "Les Gardiens de Banco",
    desc: "Les murs de terre de Niani se défendent encore.",
    brief: "Les ruines ne sont pas vides. Ce qui garde l'ancienne capitale est là depuis Kankou Moussa, et ne fait pas de différence entre un pilleur et un héritier.",
    allies_requis: [], allies_dispo: ["LUNDGREN", "FULGENCE"],
    ennemis: ["GROB"], ennemis_extra: 4,
    xp: 175,
    narr_avant: [
      "Les pilastres de banco jettent des ombres longues sur la cour centrale.",
      "Les torons de bois qui sortent des murs bougent. Tous en même temps."
    ],
    narr_victoire: [
      "Les gardiens retournent à la terre dont ils étaient faits, et la cour redevient une ruine.",
      "Au centre, une dalle descellée laisse voir des marches."
    ],
    narr_defaite: [
      "Il faut se replier hors des murs. Derrière eux, la cour se referme."
    ],
    journal_victoire: "Les murs eux-mêmes gardaient l'entrée. L'Empire savait déjà qu'on viendrait chercher. Il a juste voulu qu'on le mérite."
  },
  {
    acte: 'acte7', at: 4,
    id: 'm127', name: "Le Puits de Djenné",
    desc: "Descendre là où l'or de l'Empire n'a jamais brillé.",
    brief: "Sous la chambre des poids, un puits qui ne mène pas à l'eau. Les parois sont couvertes d'inscriptions, et les inscriptions sont des avertissements.",
    allies_requis: ["LUNDGREN"], allies_dispo: ["SAM"],
    ennemis: ["KRAG"], ennemis_extra: 3,
    xp: 185,
    narr_avant: [
      "Trente mètres de corde, et l'air qui devient dense comme de l'eau.",
      "— Ils ont écrit la même phrase deux cents fois, dit Lundgren. « Ne pas peser. »"
    ],
    narr_victoire: [
      "Au fond, une salle basse, et une plaque d'obsidienne fendue en deux.",
      "— Quelqu'un est déjà venu, dit Lundgren. Récemment."
    ],
    narr_defaite: [
      "La pression du puits devient insupportable. Il faut remonter en abandonnant le matériel."
    ],
    journal_victoire: "Une plaque d'obsidienne brisée au fond du puits. Lundgren dit que ce n'est pas de la roche. Que c'est quelqu'un."
  },
  {
    acte: 'acte7', at: 6,
    id: 'm128', name: "L'Écho du Griot",
    desc: "Une voix chante dans les ruines depuis sept siècles.",
    brief: "Le griot de l'Empereur n'a jamais cessé de raconter. Sa mémoire tient encore debout dans les murs de Niani, et elle exige un auditoire avant de livrer la suite.",
    allies_requis: ["LUNDGREN"], allies_dispo: ["SAM", "FULGENCE"],
    ennemis: ["DARK", "GROB"], ennemis_extra: 3,
    xp: 190,
    narr_avant: [
      "Une kora posée contre un mur, intacte, sans une trace de sable.",
      "Elle joue seule quand personne ne la touche.",
      "— Écoute jusqu'au bout, dit Lundgren. Surtout, n'interromps pas."
    ],
    narr_victoire: [
      "La kora se tait enfin, et se fend en deux dans un bruit sec.",
      "La dernière phrase du griot flotte encore : « La cinquième n'est pas une pierre. »"
    ],
    narr_defaite: [
      "Le chant s'arrête net, vexé. Les ruines redeviennent muettes."
    ],
    journal_victoire: "Le griot a dit que la cinquième n'est pas une pierre. Je ne sais pas encore ce que ça veut dire. Je crois que c'est la phrase la plus importante qu'on m'ait dite depuis le début."
  },

  // ═══ ACTE VIII — LA VÉRITÉ SUR LE GÉNÉRAL ═════════════════
  {
    acte: 'acte8', at: 1,
    id: 'm129', name: "Les Archives de la Préfecture",
    desc: "Le dossier du Général existe. Il est simplement très bien gardé.",
    brief: "Trois sous-sols sous la préfecture, et un dossier classé rouge au nom de Keïta. L'homme qui en a la clé porte un costume de la même couleur.",
    allies_requis: [], allies_dispo: ["KAREN", "SAM"],
    ennemis: ["SCHISSIN"], ennemis_extra: 3,
    xp: 195,
    narr_avant: [
      "Néons, odeur de papier humide, et des rayonnages qui se perdent dans le noir.",
      "— Bonsoir, dit une voix calme au bout de l'allée. Vous cherchez la boîte 47, je suppose."
    ],
    narr_victoire: [
      "La boîte 47 est presque vide : deux photos et une fiche de service.",
      "Sur la fiche, une mention ajoutée à la main : « ne pas arrêter — ordre supérieur »."
    ],
    narr_defaite: [
      "Schissin referme la grille derrière eux sans se presser.",
      "— Revenez quand vous voudrez, dit-il. Les archives sont publiques."
    ],
    journal_victoire: "On n'a jamais arrêté Papa parce que quelqu'un l'a interdit. Ce n'était pas de la protection. C'était une laisse."
  },
  {
    acte: 'acte8', at: 3,
    id: 'm130', name: "Le Cigare d'Ousmane",
    desc: "Le bras droit de Sylla fume toujours au même endroit, à la même heure.",
    brief: "Ousmane gère la sécurité du port depuis douze ans. Il a servi avec le Général, il a mangé à sa table, et il a signé le papier qui l'a envoyé à la mort.",
    allies_requis: [], allies_dispo: ["KAREN", "FULGENCE"],
    ennemis: ["OUSMANE"], ennemis_extra: 3,
    xp: 200,
    narr_avant: [
      "Quai 4, deux heures du matin. Les conteneurs font des couloirs sans fin.",
      "Un point rouge dans le noir, à trente mètres. Il ne bouge pas.",
      "— Tu as les yeux de ton père, dit Ousmane. C'est très désagréable."
    ],
    narr_victoire: [
      "Ousmane s'assied sur un plot d'amarrage, à bout de souffle, et rit sans joie.",
      "— Je n'ai pas vendu ton père, petit. J'ai juste signé là où on m'a dit de signer. C'est pire, je sais."
    ],
    narr_defaite: [
      "Les hommes du port referment le couloir de conteneurs.",
      "Le point rouge, lui, n'a pas bougé de tout le combat."
    ],
    journal_victoire: "Ousmane n'a pas nié. Il a expliqué. C'est la première fois que quelqu'un de ce côté-là me parle comme à un être humain, et ça ne me console pas du tout."
  },
  {
    acte: 'acte8', at: 4,
    id: 'm131', name: "Le Carnet Brûlé",
    desc: "Ce qui reste du carnet du Général tient dans une enveloppe.",
    brief: "Quelqu'un a mis le feu aux affaires du Général il y a des années. Il en reste des fragments, entre les mains d'un prêteur de Williamsville qui les vend au plus offrant.",
    allies_requis: [], allies_dispo: ["KAREN", "SAM", "FULGENCE"],
    ennemis: ["SCHISSIN", "SUB"], ennemis_extra: 3,
    xp: 205,
    narr_avant: [
      "Une arrière-boutique qui sent le pétrole lampant. Le prêteur compte des billets sans les regarder.",
      "— Vous êtes les troisièmes ce mois-ci, dit-il. Les deux autres n'ont pas payé."
    ],
    narr_victoire: [
      "Sept fragments noircis, dont un porte trois traits gravés — le même signe que le manguier du Banco.",
      "Au dos, une date : celle de la naissance de Tarine."
    ],
    narr_defaite: [
      "L'arrière-boutique brûle avant qu'ils en sortent. Les fragments avec."
    ],
    journal_victoire: "Papa avait gravé le signe du Banco le jour de ma naissance. Tout ça n'a jamais été un hasard. Je suis un plan qu'il a commencé il y a vingt-deux ans."
  },
  {
    acte: 'acte8', at: 6,
    id: 'm132', name: "Ce Qu'il Reste à Enterrer",
    desc: "Une tombe vide, et tout un cimetière qui n'aime pas les visiteurs de nuit.",
    brief: "La tombe du Général ne contient rien, et ce n'est pas une surprise. Ce qui est enterré à côté, en revanche, n'aurait jamais dû l'être.",
    allies_requis: [], allies_dispo: ["KAREN", "SAM"],
    ennemis: ["SYLLA", "SCHISSIN"], ennemis_extra: 3,
    xp: 210,
    narr_avant: [
      "Williamsville, minuit. Les croix blanches font des rangées jusqu'au mur d'enceinte.",
      "La dalle du Général est descellée depuis longtemps. À côté, la terre est fraîche."
    ],
    narr_victoire: [
      "Sous vingt centimètres de terre : une caisse métallique, et dedans, un uniforme plié.",
      "Pas de corps. Juste l'uniforme, et une pierre éteinte cousue dans la doublure."
    ],
    narr_defaite: [
      "Les gyrophares entourent le cimetière. Il faut partir par le mur nord, les mains vides."
    ],
    journal_victoire: "Une pierre éteinte cousue dans son uniforme. Papa en portait une. Il n'a jamais été juste un soldat qui protégeait quelque chose. Il en était un aussi."
  },

  // ═══ ACTE IX — LA GUERRE D'ABIDJAN ════════════════════════
  {
    acte: 'acte9', at: 0,
    id: 'm133', name: "Le Couvre-Feu",
    desc: "Vingt heures. La ville se vide, et la rue change de propriétaire.",
    brief: "Premier soir de loi martiale. Des familles entières sont coincées entre deux barrages, et les patrouilles ont reçu l'ordre de ne pas faire de détail.",
    allies_requis: [], allies_dispo: ["KAREN", "FULGENCE", "SAM"],
    ennemis: ["SCHISSIN"], ennemis_extra: 4,
    xp: 200,
    narr_avant: [
      "Les sirènes montent des quatre coins de Marcory en même temps.",
      "— Il y a trente personnes bloquées au carrefour, dit Fulgence. Des gamins, surtout."
    ],
    narr_victoire: [
      "Le carrefour se vide enfin, famille par famille, par les ruelles arrière.",
      "Le dernier gamin passe le portail à vingt heures quarante."
    ],
    narr_defaite: [
      "Les patrouilles referment le carrefour. Ce qui s'y passe ensuite ne s'écrit pas."
    ],
    journal_victoire: "Trente personnes sont rentrées chez elles ce soir. Ce n'est pas une victoire militaire. C'est la seule qui compte."
  },
  {
    acte: 'acte9', at: 2,
    id: 'm134', name: "Les Barricades d'Adjamé",
    desc: "Le marché se défend tout seul. Il manque juste quelqu'un pour tenir le centre.",
    brief: "Les vendeuses d'Adjamé ont monté des barricades avec ce qu'elles avaient : étals, palettes, bidons. Il faut tenir l'allée centrale le temps que le marché se vide.",
    allies_requis: [], allies_dispo: ["FULGENCE", "KAREN"],
    ennemis: ["OUSMANE", "SCHISSIN"], ennemis_extra: 4,
    xp: 205,
    narr_avant: [
      "Des parasols renversés en travers de l'allée, et des femmes qui portent des sacs de riz comme des sacs de sable.",
      "— On a besoin de vingt minutes, dit la doyenne. Pas une de plus."
    ],
    narr_victoire: [
      "À la vingt-et-unième minute, l'allée est vide et les barricades tiennent encore.",
      "La doyenne tend une calebasse d'eau sans un mot."
    ],
    narr_defaite: [
      "Les barricades cèdent au bout de douze minutes. Le marché brûlera jusqu'au matin."
    ],
    journal_victoire: "Elles n'ont pas fui : elles ont organisé. Vingt minutes, et tout le monde savait quoi faire. Je commence à comprendre ce que Papa défendait."
  },
  {
    acte: 'acte9', at: 5,
    id: 'm135', name: "Le Convoi de Sylla",
    desc: "Ce que Sylla transporte cette nuit vaut plus qu'une ville.",
    brief: "Un convoi de trois véhicules traverse Abidjan sous escorte, feux éteints. Au milieu, une caisse blindée qui chauffe assez pour déformer le métal autour d'elle.",
    allies_requis: [], allies_dispo: ["KAREN", "SAM", "FULGENCE"],
    ennemis: ["SYLLA", "OUSMANE"], ennemis_extra: 3,
    xp: 215,
    narr_avant: [
      "Le boulevard est désert, bloqué aux deux bouts. Le convoi roule au pas.",
      "— La caisse du milieu, dit Sam. Tu sens ? Elle respire."
    ],
    narr_victoire: [
      "La caisse est ouverte au chalumeau. À l'intérieur, un socle vide, encore brûlant.",
      "— Il l'a déjà sur lui, dit Sam. Il ne s'en sépare plus."
    ],
    narr_defaite: [
      "Le convoi force le barrage et disparaît vers le Plateau.",
      "La chaleur reste dans l'air longtemps après son passage."
    ],
    journal_victoire: "Sylla ne transporte plus la Pierre du Feu : il la porte. Un homme qui garde ça contre lui jour et nuit ne redeviendra jamais tout à fait un homme."
  },
  {
    acte: 'acte9', at: 6,
    id: 'm136', name: "Les Réfugiés de la Villoise",
    desc: "L'atelier est devenu un abri. Il faut qu'il le reste.",
    brief: "Quarante personnes dorment dans la cour de la Villoise. Fulgence a soudé les portails, mais un atelier n'est pas une forteresse, et tout le monde le sait.",
    allies_requis: ["FULGENCE"], allies_dispo: ["KAREN", "SAM"],
    ennemis: ["GROB", "SCHISSIN"], ennemis_extra: 4,
    xp: 220,
    narr_avant: [
      "Des nattes par terre entre les établis, des enfants qui dorment sous les machines.",
      "Fulgence vérifie ses soudures pour la troisième fois.",
      "— Ça tiendra, dit-il. Ça doit tenir."
    ],
    narr_victoire: [
      "Au matin, le portail est tordu mais fermé, et il y a toujours quarante personnes à l'intérieur.",
      "Fulgence s'assied enfin, et ne se relève pas avant midi."
    ],
    narr_defaite: [
      "Le portail cède à l'aube. Ce que l'atelier abritait se disperse dans la ville."
    ],
    journal_victoire: "Fulgence a soudé les portails avec les pièces de sa moto. Il ne l'a dit à personne. Je l'ai vu."
  },

  // ═══ ACTE X — LA PIERRE DU FEU ════════════════════════════
  {
    acte: 'acte10', at: 0,
    id: 'm137', name: "Le Hall de Verre",
    desc: "Entrer dans la Tour Postel, c'est facile. C'est prévu.",
    brief: "Le hall est vide, les ascenseurs fonctionnent, et le bureau d'accueil est encore allumé. Tout est trop simple, et ça ne s'arrange pas quand les portes se verrouillent.",
    allies_requis: [], allies_dispo: ["KAREN", "SAM", "FULGENCE"],
    ennemis: ["SCHISSIN"], ennemis_extra: 4,
    xp: 215,
    narr_avant: [
      "Du marbre, du verre, et une lumière rouge qui tombe des étages supérieurs.",
      "Les portes se verrouillent une à une derrière eux, sans que personne n'appuie sur rien."
    ],
    narr_victoire: [
      "L'escalier de secours est ouvert. C'est le seul chemin qui reste.",
      "Au-dessus, quarante étages de lumière rouge."
    ],
    narr_defaite: [
      "Le hall se referme complètement. Il faut ressortir par le parking, et tout recommencer."
    ],
    journal_victoire: "Ils nous ont laissés entrer. Sylla ne se défend pas : il nous fait monter. Il veut qu'on arrive en haut."
  },
  {
    acte: 'acte10', at: 2,
    id: 'm138', name: "L'Étage des Dossiers",
    desc: "Vingt-deuxième étage : tout ce que l'Empire sait sur Abidjan.",
    brief: "Un plateau entier de bureaux transformé en salle d'archives. Les employés sont partis en laissant leurs écrans allumés, et ce qui s'y affiche concerne des gens du quartier.",
    allies_requis: [], allies_dispo: ["SAM", "KAREN"],
    ennemis: ["SUB", "SCHISSIN"], ennemis_extra: 3,
    xp: 220,
    narr_avant: [
      "Des écrans partout, tous sur la même liste, qui défile toute seule.",
      "Karen s'arrête net devant l'un d'eux. Son nom est dessus. Celui de Fulgence aussi."
    ],
    narr_victoire: [
      "La liste est copiée, puis les serveurs sont mis hors service — proprement, à la manière de Fulgence.",
      "Deux mille noms. Deux mille personnes fichées par l'Empire à Abidjan."
    ],
    narr_defaite: [
      "Les serveurs s'effacent d'eux-mêmes avant la copie. Il ne reste rien."
    ],
    journal_victoire: "Deux mille noms. Karen était dessus. Fulgence aussi. Moi, j'étais sur la première page, avec une mention : « à ne pas neutraliser »."
  },
  {
    acte: 'acte10', at: 3,
    id: 'm139', name: "La Garde Rapprochée",
    desc: "Trente-huitième étage. Schissin-Rouge n'ira pas plus haut.",
    brief: "Il attend devant l'ascenseur du dernier étage, seul, sans arme de service. Il a quelque chose à dire avant de faire son travail.",
    allies_requis: [], allies_dispo: ["KAREN", "SAM", "FULGENCE"],
    ennemis: ["SCHISSIN"], ennemis_extra: 2,
    xp: 235,
    narr_avant: [
      "— Ton père s'est assis là où tu es, dit Schissin. Même heure, même étage, il y a douze ans.",
      "Il retire sa veste et la plie soigneusement sur une chaise.",
      "— Il n'est pas monté. Moi, j'aurais préféré qu'il monte."
    ],
    narr_victoire: [
      "Schissin reste assis contre la baie vitrée, la respiration courte, et lève une main pour arrêter Karen qui veut l'aider.",
      "— Monte, dit-il. Avant qu'il finisse."
    ],
    narr_defaite: [
      "Il les redescend de quatre étages avant de refermer la cage d'escalier.",
      "— Recommencez, dit-il. Je serai encore là."
    ],
    journal_victoire: "Schissin connaissait Papa mieux que moi. Il m'a laissé monter. Je ne sais pas si c'était de la trahison envers Sylla ou de la fidélité envers mon père."
  },
  {
    acte: 'acte10', at: 6,
    id: 'm140', name: "La Descente",
    desc: "La tour s'effondre étage par étage. Il reste quarante niveaux à descendre.",
    brief: "Le rituel est brisé, mais la Pierre du Feu ne s'éteint pas si vite. La structure chauffe, le verre éclate, et tout ce qui vivait dans la tour veut sortir en même temps.",
    allies_requis: [], allies_dispo: ["KAREN", "SAM", "FULGENCE"],
    ennemis: ["SUB", "GROB"], ennemis_extra: 4,
    xp: 245,
    narr_avant: [
      "Les vitres explosent vers l'extérieur, étage par étage, en remontant.",
      "— Trente-huit, dit Sam en courant. Trente-sept. Ne t'arrête pas."
    ],
    narr_victoire: [
      "Le hall de marbre est traversé au moment où le plafond cède.",
      "Dehors, la tour tient debout — noircie, tordue, mais debout. Abidjan la regarde."
    ],
    narr_defaite: [
      "Bloqués au douzième. Il faudra passer par les cages techniques et perdre un temps précieux."
    ],
    journal_victoire: "La tour est encore debout. Noire, tordue, mais debout. Comme la ville. Comme nous."
  }
,

  // ═══ ACTE XI — LE POIDS DE LA TERRE ═══════════════════════
  {
    acte: 'acte11', at: 0,
    id: 'm141', name: "Le Village Suspendu",
    desc: "Bandiagara vit accrochée à la falaise depuis huit siècles.",
    brief: "Le village au-dessus du site de fouille a vu passer les camions de Sgrün pendant six mois sans rien dire. Aujourd'hui, les anciens ont décidé de parler — et l'Empire a décidé de les faire taire.",
    allies_requis: [], allies_dispo: ["LUNDGREN", "FULGENCE", "KAREN"],
    ennemis: ["GROB", "SUB"], ennemis_extra: 4,
    xp: 230,
    narr_avant: [
      "Des greniers de banco coiffés de chaume, accrochés à la paroi comme des nids.",
      "— Ils viennent le soir, dit l'ancien. Ils ne prennent rien. Ils mesurent."
    ],
    narr_victoire: [
      "Le village tient, et l'ancien accepte enfin de montrer le sentier qui descend.",
      "— Ce n'est pas une mine, dit-il. C'est une porte. Nous la gardons depuis huit cents ans."
    ],
    narr_defaite: [
      "Les greniers brûlent en contrebas. L'ancien ne montrera plus rien à personne."
    ],
    journal_victoire: "Huit cents ans qu'ils gardent cette porte sans savoir ce qu'il y a derrière. Et nous, on va l'ouvrir en une nuit."
  },
  {
    acte: 'acte11', at: 3,
    id: 'm142', name: "Les Greniers Scellés",
    desc: "Ce que les Dogons ont enfermé ne devait jamais ressortir.",
    brief: "Trois greniers murés depuis des générations, marqués du même signe que le manguier du Banco. Krag est déjà en train d'en ouvrir le premier.",
    allies_requis: ["LUNDGREN"], allies_dispo: ["SAM", "FULGENCE"],
    ennemis: ["KRAG"], ennemis_extra: 3,
    xp: 245,
    narr_avant: [
      "Le premier grenier est éventré. Le deuxième tient encore.",
      "Devant le troisième, une silhouette massive, immobile, sans visage.",
      "— Il n'attend pas, dit Lundgren. Il travaille."
    ],
    narr_victoire: [
      "Krag recule vers la falaise et se laisse tomber dans le vide sans un bruit.",
      "Dans le grenier intact : des poids de cuivre, et une dalle gravée d'une carte du ciel."
    ],
    narr_defaite: [
      "Les trois greniers sont ouverts avant qu'ils n'atteignent le dernier.",
      "Krag part sans se presser, chargé."
    ],
    journal_victoire: "Krag s'est jeté dans le vide plutôt que de continuer le combat. Ce n'est pas de la fuite. Il avait juste fini ce qu'il était venu faire."
  },

  // ═══ ACTE XII — LE MURMURE DE L'EAU ═══════════════════════
  {
    acte: 'acte12', at: 0,
    id: 'm143', name: "Le Banc de Corail",
    desc: "Avant la fosse, il y a le récif. Et le récif a des habitudes.",
    brief: "La descente commence par un récif que les pêcheurs évitent depuis toujours. Ils ont leurs raisons, et elles se réveillent au passage d'une pierre.",
    allies_requis: [], allies_dispo: ["SAM", "LUNDGREN", "KAREN"],
    ennemis: ["MURK"], ennemis_extra: 3,
    xp: 235,
    narr_avant: [
      "Quinze mètres de fond. Le corail est rouge, orange, violet — et il bouge quand on ne le regarde pas.",
      "— Ne touche rien, dit Sam dans le casque. Vraiment rien."
    ],
    narr_victoire: [
      "Le récif se referme derrière eux, indifférent.",
      "En dessous, l'eau devient noire d'un coup : la fosse commence là."
    ],
    narr_defaite: [
      "Il faut remonter par paliers, lentement, pendant que le récif s'agite."
    ],
    journal_victoire: "Les pêcheurs évitent ce banc depuis des générations. Ils appellent ça « le jardin qui a faim ». Ils n'ont pas tort."
  },
  {
    acte: 'acte12', at: 3,
    id: 'm144', name: "Les Voix sous la Coque",
    desc: "Une épave, et des passagers qui n'ont pas fini leur voyage.",
    brief: "À mi-profondeur, la carcasse d'un cargo échoué depuis quarante ans. La mémoire de l'eau y a gardé tout ce qui s'y est passé, et compte bien le rejouer.",
    allies_requis: ["SAM"], allies_dispo: ["LUNDGREN", "KAREN"],
    ennemis: ["MURK", "SUB"], ennemis_extra: 3,
    xp: 250,
    narr_avant: [
      "La coque éventrée grince encore, quarante ans après.",
      "Dans les coursives, des silhouettes vont et viennent, occupées à des tâches d'un autre temps.",
      "— Elles ne savent pas, dit Sam. Ne leur dis pas."
    ],
    narr_victoire: [
      "Les silhouettes s'effacent une à une, et le cargo redevient une épave.",
      "Sur la passerelle, un journal de bord intact : la dernière page parle d'une lumière sous la coque."
    ],
    narr_defaite: [
      "L'épave se referme sur eux. Il faut ressortir par la brèche, en abandonnant le journal."
    ],
    journal_victoire: "Ils rejouaient leur dernier jour sans savoir qu'il était passé. Sam dit que l'eau garde tout. Je n'ai pas osé demander ce qu'elle gardera de nous."
  },

  // ═══ ACTE XIII — LE SOUFFLE DU VIDE ═══════════════════════
  {
    acte: 'acte13', at: 1,
    id: 'm145', name: "Les Éclats Tournants",
    desc: "Dans le Vide, même le sol est une opinion.",
    brief: "Des plateformes de cristal dérivent sans logique au-dessus de rien. Vael s'amuse à les faire tourner pendant que le groupe essaie de traverser.",
    allies_requis: [], allies_dispo: ["SAM", "LUNDGREN", "KAREN"],
    ennemis: ["VAEL"], ennemis_extra: 3,
    xp: 255,
    narr_avant: [
      "Pas d'horizon, pas de bas. Des éclats violets qui dérivent en silence.",
      "Un rire, très près, très bref. Personne à côté."
    ],
    narr_victoire: [
      "Les plateformes s'immobilisent d'un coup, alignées comme un pont.",
      "— Bien joué, dit la voix de Vael, déjà loin. La prochaine fois, je ne joue plus."
    ],
    narr_defaite: [
      "Le pont se défait sous leurs pieds. Il faut recommencer depuis l'autre rive."
    ],
    journal_victoire: "Il jouait. Tout ce combat, pour lui, c'était un jeu. C'est la chose la plus inquiétante que j'aie affrontée depuis le début."
  },
  {
    acte: 'acte13', at: 5,
    id: 'm146', name: "Le Couloir sans Sol",
    desc: "La Faille de Sgrün se traverse, ou elle vous garde.",
    brief: "Le passage vers l'Autel est un couloir qui n'existe que si on continue d'avancer. S'arrêter, c'est y rester — et quelque chose fait tout pour qu'on s'arrête.",
    allies_requis: ["SAM"], allies_dispo: ["LUNDGREN", "KAREN"],
    ennemis: ["VAEL", "MURK"], ennemis_extra: 3,
    xp: 265,
    narr_avant: [
      "Le couloir se dessine devant chaque pas et s'efface derrière chaque talon.",
      "— Ne te retourne pas, dit Sam. Il n'y a plus rien derrière, et c'est normal."
    ],
    narr_victoire: [
      "La dernière porte est là, immense, et parfaitement banale.",
      "Derrière, une lumière blanche, sans chaleur."
    ],
    narr_defaite: [
      "Le couloir s'arrête. Il faut revenir sur ses pas — et il n'y a plus de pas."
    ],
    journal_victoire: "J'ai avancé pendant des heures dans un couloir qui n'existait que parce que j'avançais. Je crois que c'est la définition exacte de ma vie depuis mon anniversaire."
  },

  // ═══ ACTE XIV — LA CONVERGENCE ════════════════════════════
  {
    acte: 'acte14', at: 0,
    id: 'm147', name: "Les Portes Blanches",
    desc: "Cent portes identiques. Une seule mène plus loin.",
    brief: "L'entrée de la forteresse est un couloir de portes blanches gardé par des sentinelles qui ne se lassent jamais. Chaque erreur ramène au début, et chaque retour coûte plus cher.",
    allies_requis: [], allies_dispo: ["SAM", "KAREN", "LUNDGREN", "FULGENCE"],
    ennemis: ["SUB", "GROB"], ennemis_extra: 4,
    xp: 270,
    narr_avant: [
      "Des couloirs blancs à l'infini, sans une ombre, sans un bruit de pas.",
      "Les sentinelles en armure sont alignées le long des murs. Aucune ne bouge encore."
    ],
    narr_victoire: [
      "La quatre-vingt-dix-neuvième porte s'ouvre sur un escalier qui descend.",
      "Derrière eux, le couloir se referme proprement, comme un dossier qu'on classe."
    ],
    narr_defaite: [
      "Retour à la première porte. Les sentinelles ont repris leur place, intactes."
    ],
    journal_victoire: "Cent portes, et il n'y avait aucun piège : juste de la patience. Sgrün ne perd jamais de temps — il en fait perdre aux autres."
  },
  {
    acte: 'acte14', at: 3,
    id: 'm148', name: "La Chambre des Copies",
    desc: "Il a gardé une version de chacun. Au cas où.",
    brief: "Une salle pleine de cuves, et dans chaque cuve un visage connu : des gens d'Abidjan, du Mali, du Pôle Nord. Certaines cuves sont vides, et les occupants manquants sont déjà dans la salle.",
    allies_requis: ["SAM"], allies_dispo: ["KAREN", "LUNDGREN"],
    ennemis: ["SUB", "GROB", "VAEL"], ennemis_extra: 3,
    xp: 280,
    narr_avant: [
      "Des cuves de verre alignées sur trois étages, éclairées de l'intérieur.",
      "Karen s'arrête devant l'une d'elles et ne dit rien pendant très longtemps.",
      "C'est son propre visage qui flotte dedans."
    ],
    narr_victoire: [
      "Les cuves se vident une à une, proprement, sans un cri.",
      "— Ce n'étaient pas des gens, dit Sam sans conviction. Pas encore."
    ],
    narr_defaite: [
      "Les cuves s'ouvrent toutes en même temps. Il faut ressortir avant la fin du comptage."
    ],
    journal_victoire: "Il avait une copie de Karen. Et une de moi, vide, prête. Il ne voulait pas nous détruire : il voulait pouvoir nous remplacer."
  },
  {
    acte: 'acte14', at: 5,
    id: 'm149', name: "L'Avant-Dernier Émissaire",
    desc: "Krag et Murk ensemble, devant la dernière porte.",
    brief: "Sgrün n'envoie plus personne : il ne lui reste que deux serviteurs, et ils sont tous les deux dans la salle. L'un ne recule pas, l'autre n'a pas de forme.",
    allies_requis: [], allies_dispo: ["SAM", "KAREN", "LUNDGREN", "FULGENCE"],
    ennemis: ["KRAG", "MURK"], ennemis_extra: 3,
    xp: 300,
    narr_avant: [
      "La salle est circulaire, le sol de métal noir, et il n'y a aucune autre sortie.",
      "Krag se place devant la porte. L'eau, elle, est déjà partout."
    ],
    narr_victoire: [
      "La plaque d'obsidienne se fend enfin, et ce qui était liquide reflue vers les grilles.",
      "La porte du fond s'ouvre toute seule. Sgrün attend."
    ],
    narr_defaite: [
      "Ils tiennent la porte à deux, et ils la tiendront aussi longtemps qu'il faudra."
    ],
    journal_victoire: "Les deux derniers. Après ça, il n'y a plus personne entre lui et moi. Je devrais avoir peur. Je suis surtout très calme."
  },
  {
    acte: 'acte14', at: 8,
    id: 'm150', name: "Ce Qui Reste de Sgrün",
    desc: "L'entité vaincue n'a pas disparu. Elle propose autre chose.",
    brief: "Le dernier fragment de Sgrün n'a plus la force de contraindre qui que ce soit. Il lui reste la parole, et une offre à faire à celui qui tient désormais les cinq pierres.",
    allies_requis: [], allies_dispo: ["SAM", "KAREN", "LUNDGREN", "FULGENCE", "SKYGGE"],
    ennemis: ["SGRUN"], ennemis_extra: 2,
    xp: 350,
    narr_avant: [
      "La salle est vide, et il n'y a plus de trône. Juste une voix, partout à la fois.",
      "— Tu as gagné, dit Sgrün. Maintenant tu vas devoir décider à ma place. Tous les jours. Pour tout le monde.",
      "— Je te propose de te libérer de ça."
    ],
    narr_victoire: [
      "Le dernier fragment se disperse sans bruit, et le silence qui suit est le premier vrai silence depuis des mois.",
      "Les cinq pierres pèsent exactement leur poids. Pas plus.",
      "Quelque part, très loin, une cour d'atelier attend à Marcory.",
      "Personne ne voit la dernière brume de Sgrün glisser sur le sol et venir se coller aux pieds de Den skyggeløse mannen.",
      "Pour la première fois depuis sept siècles, une ombre s'étire derrière lui. Elle est plus longue qu'elle ne devrait.",
      "— Enfin, dit-il, d'une voix qui n'est plus tout à fait la sienne. Je suis entier."
    ],
    narr_defaite: [
      "L'offre reste sur la table. Elle est très raisonnable, et c'est bien le problème."
    ],
    journal_victoire: "Il m'a proposé de ne plus avoir à choisir. C'était la première offre honnête qu'on m'ait faite, et la seule que je ne pouvais pas accepter. Je rentre à Abidjan. J'ai un atelier à rouvrir."
  }
,

  // ═══ LÉGENDES — deux épreuves, deux alliés ════════════════
  // `apres` : insérées juste après une mission précise, une fois tous les
  // autres ajouts faits, pour ne rien décaler de l'ordre existant.
  // `mode: 'COMBAT'` : un duel en rounds gagnants contre la légende ;
  // `recrue` : elle rejoint l'équipe une fois battue.
  {
    acte: 'acte7', apres: 'm21',
    id: 'm151', name: "L'Épreuve de l'Empereur",
    desc: "L'écho de Kankou Moussa ne donne rien sans avoir pesé celui qui reçoit.",
    brief: "Le message est transmis, mais l'Empereur n'est pas reparti. Sept siècles plus tôt, il a séparé les cinq pierres parce que personne ne tenait debout sous leur poids. Avant de marcher aux côtés du porteur de l'Équilibre, il veut savoir s'il tient, lui.",
    mode: 'COMBAT', roundsToWin: 2, roundTime: 75, foeMult: 1.05,
    allies_requis: [], allies_dispo: [],
    ennemis: ["KANKOU"], ennemis_extra: 0,
    recrue: "KANKOU",
    xp: 260, cauris: 180,
    narr_avant: [
      "La projection ne s'éteint pas. Elle se solidifie, grain d'or après grain d'or.",
      "— Un message ne suffit pas, dit l'Empereur. J'ai vu des rois plus sages que toi tomber sous une seule pierre.",
      "Il plante son sceptre dans le sable. Le sol de Niani s'aplanit tout autour, comme une cour prête pour un duel."
    ],
    narr_victoire: [
      "L'Empereur pose un genou à terre, sans honte, et sourit pour la première fois.",
      "— Tu ne gagnes pas en frappant plus fort. Tu gagnes en ne tombant pas. C'est ce que j'attendais.",
      "Il se relève, et son or se tourne vers Tarine : Kankou Moussa rejoint l'équipe."
    ],
    narr_defaite: [
      "Le sceptre s'abat une dernière fois, doucement, presque avec regret.",
      "— Reviens quand tu sauras perdre sans lâcher, dit l'Empereur. Je ne suis pas pressé. Je ne l'ai jamais été."
    ],
    journal_victoire: "Kankou Moussa s'est battu contre moi pour voir si je tenais debout. Maintenant il marche avec nous. Lundgren n'a rien dit pendant une heure, et je crois que c'est la première fois que je le vois ému."
  },
  {
    acte: 'acte8', apres: 'm131',
    id: 'm152', name: "La Page du Géant",
    desc: "Un fragment du carnet a survécu au feu. Il parle d'un homme, pas d'une pierre.",
    brief: "Parmi les fragments sauvés, une page entière, intacte, que le feu a contournée. Le Général y raconte un géant venu d'Afrique qui servit un seigneur du Japon il y a quatre siècles, et la pierre tiède cousue dans sa ceinture. Posée sur la pierre de Tarine, la page s'est mise à chauffer.",
    mode: 'COMBAT', roundsToWin: 2, roundTime: 75, foeMult: 1.1,
    allies_requis: [], allies_dispo: [],
    ennemis: ["YASUKE"], ennemis_extra: 0,
    recrue: "YASUKE",
    xp: 240, cauris: 170,
    narr_avant: [
      "La page brûle sans se consumer. L'odeur de pétrole disparaît, remplacée par celle du bois de cèdre.",
      "Un temple en flammes se dessine autour d'eux, puis s'efface. Il ne reste qu'une silhouette immense, en armure rouge et bleue.",
      "— Six shaku deux bu, dit-il en saluant. On m'a mesuré avant de me juger. À ton tour."
    ],
    narr_victoire: [
      "Yasuke abaisse sa lame et incline la tête, exactement comme on le lui a appris il y a quatre cents ans.",
      "— Ton père portait la même chaleur dans sa poche. Il l'a sentie, lui aussi, en lisant mon nom.",
      "Le temple disparaît pour de bon. Le géant, lui, reste : Yasuke rejoint l'équipe."
    ],
    narr_defaite: [
      "La lame s'arrête à un doigt de la gorge de Tarine.",
      "— Au temple, on ne m'a pas laissé de deuxième chance, dit Yasuke. Toi, je t'en laisse une."
    ],
    journal_victoire: "Papa avait gardé une seule page intacte, et c'était celle-là. Un homme qui a traversé les mers avec une pierre dans sa ceinture et qui s'est battu pour quelqu'un jusqu'au bout. Je crois que Papa voulait que je le rencontre."
  },
  // ── L'Homme sans Ombre : allié de la première partie. La suite du jeu
  // en fera le grand méchant (Sgrün est son ombre arrachée) : ses répliques
  // et celles des autres sèment les indices, sans jamais les expliquer.
  {
    acte: 'acte6', apres: 'm123',
    id: 'm157', name: "L'Homme sans Ombre",
    desc: "Sous la base de Sgrün, la glace s'est fendue. Quelqu'un dormait au fond.",
    brief: "Les secousses de la base ont ouvert une faille sous la glace, profonde de plusieurs centaines de mètres. Au fond, un homme dort debout, une épée runique entre les mains, depuis sept siècles. La pierre de Tarine le réveille. Il ne demande pas où il est. Il demande qui a volé son sommeil, puis il veut voir ce que vaut le porteur.",
    mode: 'COMBAT', roundsToWin: 2, roundTime: 75, foeMult: 1.1,
    allies_requis: [], allies_dispo: [],
    ennemis: ["SKYGGE"], ennemis_extra: 0,
    recrue: "SKYGGE",
    xp: 260, cauris: 180,
    narr_avant: [
      "Sous la base, la glace s'est fendue sur des centaines de mètres. Au fond de la faille, un homme dort debout, une épée runique entre les mains.",
      "Ses yeux s'ouvrent quand la pierre de Tarine approche. Des yeux couleur d'hiver.",
      "— Sept siècles de sommeil, dit l'homme. Et le premier visage que je vois porte une pierre de Kankou Moussa.",
      "— Qui êtes-vous ? demande Tarine.",
      "— Ceux du Nord m'appelaient Den skyggeløse mannen. Montre-moi si tu mérites que je me souvienne du reste."
    ],
    narr_victoire: [
      "L'homme abaisse son épée. La lumière blanche de la base tombe droit sur lui.",
      "— Tu te bats contre Sgrün, dit-il. Moi aussi. Il m'a pris quelque chose, il y a très longtemps, et je compte le reprendre.",
      "Lundgren fixe longtemps la glace aux pieds de l'étranger.",
      "— Sept siècles, et je n'ai jamais vu un homme marcher au soleil sans ombre.",
      "L'étranger sourit sans répondre. Den skyggeløse mannen rejoint l'équipe."
    ],
    narr_defaite: [
      "L'épée runique s'arrête contre la gorge de Tarine, froide comme la faille.",
      "— Tu hésites encore, dit l'homme sans ombre. Sgrün, lui, n'hésitera pas."
    ],
    journal_victoire: "Un homme dormait sous la glace depuis sept siècles. Il connaît Sgrün, il connaît Kankou Moussa, et il connaissait mon nom avant que je le lui dise. Lundgren dit qu'il n'a pas d'ombre. J'ai regardé : il a raison. Il dit que c'est une vieille histoire. Je n'ai pas insisté."
  },
  // ── Deuxième vague : Dingane, la Reine Cendre, Adandé, le Chronophage ──
  {
    acte: 'acte9', apres: 'm135',
    id: 'm155', name: "Le Roi Qui a Refusé",
    desc: "La Pierre de la Terre fait lever l'écho d'un roi qui n'a jamais voulu d'elle.",
    brief: "En pleine guerre d'Abidjan, la pierre de Tarine se met à peser comme une montagne. Au bout de la rue, la poussière se lève et dessine un enclos royal sur une colline. Un roi zoulou de 1838 attend là : celui qui a refusé une pierre la veille de sa dernière bataille veut savoir pourquoi Tarine, lui, l'a acceptée.",
    mode: 'COMBAT', roundsToWin: 2, roundTime: 75, foeMult: 1.1,
    allies_requis: [], allies_dispo: [],
    ennemis: ["DINGANE"], ennemis_extra: 0,
    recrue: "DINGANE",
    xp: 250, cauris: 175,
    narr_avant: [
      "La rue se tait. Les barricades se couvrent de poussière rouge, et une colline se dessine là où il n'y en a jamais eu.",
      "Au sommet, un homme immense, une sagaie courte à la main, un bouclier de cuir sur le bras.",
      "— On m'a offert une pierre, un jour, dit Dingane. Je l'ai refusée. Un roi qui a besoin d'une pierre pour tenir debout n'est plus un roi.",
      "— Alors pourquoi vous êtes là ? demande Tarine.",
      "— Pour voir si toi, tu tiens debout sans elle."
    ],
    narr_victoire: [
      "Le roi recule d'un pas, le premier de la journée. Il plante sa sagaie dans le sol et la laisse là.",
      "— J'ai perdu à la rivière parce que j'étais seul contre des fusils, dit Dingane. Toi, tu n'es pas seul. C'est ta vraie force.",
      "Il ramasse son bouclier et se tourne vers la rue en guerre : Dingane rejoint l'équipe."
    ],
    narr_defaite: [
      "Le bouclier de cuir s'abat comme un mur. Tarine roule dans la poussière rouge.",
      "— Relève-toi sans regarder ta pierre, dit Dingane. Quand tu y arriveras, reviens."
    ],
    journal_victoire: "Un roi de 1838 m'a demandé si je tenais debout sans ma pierre. Je n'avais jamais pensé à la question. Il dit que ma vraie force, ce sont les autres. Karen a souri quand je le lui ai répété."
  },
  {
    acte: 'acte10', apres: 'm138',
    id: 'm156', name: "La Reine Cendre",
    desc: "Au dernier étage brûlé de la Tour Postel, la première gardienne du Feu attend.",
    brief: "Les dossiers de l'étage parlent d'une femme qui a gardé la Pierre du Feu pendant quatre siècles, avant de la vendre à Sgrün contre l'éternité. Elle garde maintenant l'étage le plus haut de la tour. Elle a tout perdu sauf sa couronne, et elle veut la pierre que Sylla lui a prise.",
    mode: 'BOSS', foeMult: 1.15,
    allies_requis: [], allies_dispo: ["KAREN", "FULGENCE", "LUNDGREN"],
    ennemis: ["CENDRE"], ennemis_extra: 2,
    xp: 280, cauris: 190,
    narr_avant: [
      "Le dernier étage sent le bois brûlé. Les murs de verre sont noircis de l'intérieur.",
      "Une femme est assise sur un trône de cendre, une couronne éteinte sur la tête.",
      "— Quatre siècles, dit la Reine Cendre. J'ai gardé ce feu quatre siècles. Et vous le portez comme un briquet.",
      "— On ne l'a pas vendu, nous, répond Tarine."
    ],
    narr_victoire: [
      "La couronne roule sur le sol et se fend en deux. Les braises s'éteignent une à une.",
      "— Il m'avait promis l'éternité, murmure la Reine Cendre. Il ne m'a jamais dit qu'elle serait froide.",
      "Lundgren ramasse les deux moitiés de la couronne sans un mot, et les garde."
    ],
    narr_defaite: [
      "Le sol de l'étage s'embrase. Il faut redescendre, vite, par l'escalier de secours.",
      "— Revenez avec plus de feu que ça, dit la Reine Cendre. Ou ne revenez pas."
    ],
    journal_victoire: "La Reine Cendre a vendu sa flamme contre l'éternité. Elle a eu l'éternité, mais sans la flamme. Je crois que c'est la chose la plus triste que j'aie vue depuis le début."
  },
  {
    acte: 'acte13', apres: 'm145',
    id: 'm153', name: "La Dernière Mino",
    desc: "Un éclat du Vide dépose une guerrière de 1892 au milieu du combat.",
    brief: "Parmi les éclats tournants de Vael, l'un d'eux ne reflète pas le présent. Il se brise, et une guerrière du Dahomey en sort, lame au poing, au milieu de sa dernière bataille. Pour elle, la bataille n'est pas finie, et Tarine ressemble beaucoup à un ennemi.",
    mode: 'COMBAT', roundsToWin: 2, roundTime: 75, foeMult: 1.1,
    allies_requis: [], allies_dispo: [],
    ennemis: ["ADANDE"], ennemis_extra: 0,
    recrue: "ADANDE",
    xp: 270, cauris: 185,
    narr_avant: [
      "L'éclat se fend. Il en sort une odeur de poudre et de terre mouillée, et une femme qui sourit.",
      "— Abomey ne tombera pas aujourd'hui, dit Adandé. Pas tant que je suis debout.",
      "— Abomey ? Madame, on est en 2026, dit Tarine.",
      "Elle sourit encore. C'est le sourire le plus doux qu'il ait jamais vu, et il comprend trop tard qu'il annonce le premier coup."
    ],
    narr_victoire: [
      "La lame s'arrête à un doigt de sa gorge. Adandé regarde autour d'elle : les éclats, le vide, les inconnus.",
      "— Tu ne te bats pas comme eux, dit Adandé. Tu te bats comme quelqu'un qui protège.",
      "Elle range sa lame. — Si ma bataille est finie, j'en choisirai une autre. La tienne. Adandé rejoint l'équipe."
    ],
    narr_defaite: [
      "Elle frappe trois fois avant qu'il ait levé la main.",
      "— Tu es lent, dit Adandé, sans méchanceté. Les Français aussi étaient lents. Reviens plus vite."
    ],
    journal_victoire: "Une guerrière de 1892 est tombée du Vide. Elle a failli me couper en deux en souriant. Maintenant elle est avec nous, et elle pose mille questions sur les téléphones."
  },
  {
    acte: 'acte13', apres: 'm153',
    id: 'm154', name: "Le Chasseur de Temps",
    desc: "Quelqu'un est venu du futur pour ramener Adandé. Et effacer le reste.",
    brief: "Depuis l'arrivée d'Adandé, les éclats du Vide se figent un à un, comme des horloges arrêtées. Une silhouette blanche et or marche entre eux sans jamais se presser. Le Chronophage vient réparer une erreur du temps : Adandé. Et tout ce qu'elle a touché depuis.",
    mode: 'BOSS', foeMult: 1.15,
    allies_requis: [], allies_dispo: ["ADANDE", "SAM", "LUNDGREN"],
    ennemis: ["CHRONOPHAGE"], ennemis_extra: 2,
    xp: 290, cauris: 200,
    narr_avant: [
      "Les éclats s'arrêtent de tourner. Le silence qui suit a quelque chose de mécanique.",
      "— Adandé. Née en 1872. Disparue en 1892. Retour prévu, dit le Chronophage.",
      "— Elle ne retourne nulle part, répond Tarine.",
      "— Correction supplémentaire enregistrée."
    ],
    narr_victoire: [
      "Le casque miroir se fissure, et l'armure blanche se replie sur elle-même comme une montre qu'on referme.",
      "— Erreur non corrigée, dit le Chronophage. Elle le restera.",
      "Il disparaît. Adandé garde la main sur sa lame longtemps après."
    ],
    narr_defaite: [
      "Le temps saute. Une seconde manque, puis une autre.",
      "— Reprise de la correction à la prochaine occurrence, dit le Chronophage."
    ],
    journal_victoire: "Un chasseur est venu du futur pour reprendre Adandé. On l'a arrêté. Elle m'a demandé si c'était ça, les amis, dans mon époque. J'ai dit oui."
  }
];
