// Données narratives de la campagne. Ce fichier contient les 50 missions
// d'origine ; campaign-extra.js en ajoute 50 autres, intercalées dans les
// mêmes actes (fusion en bas de fichier).
import { EXTRA } from './campaign-extra.js';

export const CAMPAIGN = [
  {
    id:"acte1",label:"ACTE I",titre:"LE CADEAU DE PAPA",
    narration_debut:[
      "Marcory, Abidjan.",
      "Tarine Keïta fête son anniversaire aujourd'hui. Son père, le Général Keïta, est en mission quelque part au loin — mais il n'a jamais oublié un anniversaire.",
      "Ce matin, un colis est arrivé sans un mot d'explication : une pierre tiède, lisse, qui semble respirer doucement au creux de la main.",
      "À l'atelier de la Villoise, on surnomme Tarine « le Bricoleur » à cause de ses inventions qui finissent toujours en fumée. Personne ne se doute que celle-ci, cette fois, va vraiment fonctionner.",
      "Quelque chose s'éveille dans ses paumes. Et ça promet d'être une sacrée aventure."
    ],
    missions:[
      {
        id:"m1",num:1,name:"Le Défi de la Cour",
        desc:"Baba Tunde veut sa revanche — cette fois, ça chauffe pour de vrai.",
        brief:"La cour de l'atelier, pause de midi. Baba Tunde, la star auto-proclamée du quartier, cherche un adversaire à sa taille pour épater la galerie. Tarine, la pierre encore tiède dans la poche, décide pour une fois de ne pas se défiler.",
        allies_requis:[],allies_dispo:["KAREN"],
        ennemis:["BABA"],ennemis_extra:2,
        xp:60,
        narr_avant:[
          "La cour de l'atelier. Le soleil d'Abidjan tape fort, les vendeuses d'attiéké s'installent déjà à l'ombre du manguier.",
          "Baba Tunde traverse la cour en roulant des mécaniques, ses deux copains sur les talons, prêt pour le show.",
          "— Alors, le Bricoleur, tu me montres ton dernier gadget ? lance-t-il en rigolant.",
          "Tarine sourit. Dans sa paume, la pierre se met à chauffer doucement. Cette fois, il a peut-être vraiment un tour à montrer."
        ],
        narr_victoire:[
          "Le coup de Baba s'arrête net, comme freiné par un mur invisible. Toute la cour retient son souffle.",
          "Baba recule, l'air aussi surpris que vexé, puis se rattrape avec un haussement d'épaules théâtral.",
          "— Ok, ok, t'as un truc nouveau. Respect, le Bricoleur.",
          "Il repart en sifflotant, plus impressionné qu'il ne veut l'admettre. Fulgence ramasse le sac de Tarine en riant.",
          "Dans les paumes de Tarine, une petite chaleur continue de pulser, comme fière d'elle-même."
        ],
        narr_defaite:[
          "La cour tourne, les rires fusent — bon enfant, mais ça pique quand même l'orgueil.",
          "La chaleur dans ses mains s'éteint, presque timide.",
          "Fulgence aide Tarine à se relever en riant. — On retente ça demain, capitaine."
        ],
        journal_victoire:"Aujourd'hui, pour mon anniversaire, j'ai senti un truc bizarre et génial dans mes mains — une chaleur, une force, comme si la pierre de Papa me chuchotait un secret. Baba n'a rien compris, moi non plus complètement, mais une chose est sûre : cette pierre n'est pas un gadget comme les autres."
      },
      {
        id:"m2",num:2,name:"L'Appel de la Forêt du Banco",
        desc:"La pierre s'agite — et elle veut aller quelque part de précis.",
        brief:"Les abords de la forêt du Banco, au nord d'Abidjan. Ce matin, la pierre ne pulse plus pareil : pas vers l'atelier, vers les arbres. Tarine décide de suivre le mouvement — et d'embarquer ses amis dans l'aventure.",
        allies_requis:[],allies_dispo:["KAREN","FULGENCE"],
        ennemis:["DARK"],ennemis_extra:2,
        xp:80,
        narr_avant:[
          "La pierre dans la poche de Tarine vibre différemment ce matin, comme une boussole qui aurait trouvé le nord.",
          "Direction : la forêt du Banco, ses fougères géantes et son air humide qui sent la terre mouillée.",
          "— Une vraie expédition, dit Fulgence en ajustant son sac. On aurait dû prendre des sandwichs.",
          "Karen les regarde partir depuis le porche, amusée. — Rentrez avant la nuit, tous les deux !"
        ],
        narr_victoire:[
          "Dans la clairière, la lumière change de couleur — plus douce, presque dorée.",
          "Une silhouette apparaît entre les bougainvilliers : grande, calme, les yeux couleur de glace, un sourire en coin.",
          "— Enfin. Sept siècles que j'attends quelqu'un capable de faire autant de bruit en marchant, dit Lundgren.",
          "— C'est un compliment ? demande Tarine.",
          "— On verra. Viens, j'ai des choses amusantes à t'apprendre sur cette pierre."
        ],
        narr_defaite:[
          "La forêt reprend son silence habituel, comme si de rien n'était.",
          "Quelque chose s'éclipse entre les arbres — pas vaincu, juste pas pressé.",
          "— On reviendra mieux préparés, dit Fulgence en époussetant son pantalon."
        ],
        journal_victoire:"J'ai rencontré un certain Lundgren dans la forêt du Banco — sept siècles, qu'il dit, comme on parlerait de sept ans de vacances. Il connaissait Papa, apparemment. Il dit que les pierres choisissent leurs porteurs, et que la mienne a visiblement fait son choix. Meilleur anniversaire de ma vie, en fait."
      },
      {
        id:"m3",num:3,name:"Le Journal de Papa",
        desc:"D'autres chasseurs de trésor ont repéré le même indice que toi.",
        brief:"La maison de Marcory. Karen est encore à la clinique. Quelqu'un vient de forcer le portail du jardin — quelqu'un qui, apparemment, cherche aussi le vieux carnet d'exploration du Général Keïta.",
        allies_requis:["KAREN"],allies_dispo:["FULGENCE"],
        ennemis:["BABA","DARK"],ennemis_extra:1,
        xp:100,
        narr_avant:[
          "La maison de Marcory, en fin d'après-midi. Karen est de garde à la clinique.",
          "La pierre chauffe d'un coup — signal d'alarme sans équivoque.",
          "Tarine entend le portail du jardin grincer, forcé par des mains pressées.",
          "Quelqu'un d'autre a flairé la piste du carnet de Papa. Et il n'est pas question de les laisser fouiller la maison."
        ],
        narr_victoire:[
          "Le carnet est toujours là, bien planqué dans sa boîte verte sous le lit. Sain et sauf.",
          "Karen rentre une heure plus tard, pose ses sacs de courses et remarque à peine le salon un peu chamboulé.",
          "— T'as encore déplacé les meubles pour t'entraîner ? dit-elle, un sourcil levé.",
          "— Un peu, dit Tarine avec un grand sourire.",
          "Ce n'est pas tout à fait un mensonge. Juste toute une aventure qu'il gardera pour lui, pour l'instant."
        ],
        narr_defaite:[
          "Le carnet a filé entre les mains de Tarine — littéralement.",
          "Il s'assoit dans la cuisine, un peu dépité, en attendant le retour de sa mère.",
          "Bon. Il faudra le récupérer. Et vite, avant que quelqu'un d'autre ne comprenne où il mène."
        ],
        journal_victoire:"Il paraît que le vieux carnet d'exploration de Papa vaut cher pour certaines personnes — apparemment il y a des indices dessus sur l'emplacement des Cinq Pierres. Lundgren dit que dès qu'une pierre s'éveille, ça attire du monde, curieux comme rivaux. Papa savait manifestement des choses passionnantes. J'ai hâte de tout découvrir."
      }
    ]
  },
  {
    id:"acte2",label:"ACTE II",titre:"LE ROYAUME DE L'ESSENCE",
    narration_debut:[
      "Le portail dans le jardin de derrière s'ouvre sur quelque chose d'autre.",
      "Sam Grün est assis sur les marches. Il attendait.",
      "— C'est ce soir ? dit Tarine.",
      "— C'est ce soir, dit Sam.",
      "Karen pose une main brève sur l'épaule de son fils — juste une seconde.",
      "— Prends ton manteau. Les nuits sont fraîches où tu vas."
    ],
    missions:[
      {
        id:"m4",num:4,name:"Le Miroir de l'Âme",
        desc:"Première épreuve dans le Royaume de l'Essence.",
        brief:"Le Royaume de l'Essence. Sam t'a amené ici pour voir ce que tu es vraiment, avant de te montrer ce que tu peux devenir.",
        allies_requis:[],allies_dispo:["KAREN","FULGENCE"],
        ennemis:["DARK"],ennemis_extra:2,
        xp:120,
        narr_avant:[
          "Le Royaume de l'Essence. Ce n'est pas un lieu — c'est un état.",
          "Le sol sous les pieds : quelque chose entre la terre, la pierre et l'eau.",
          "Sam dit : — Ce que tu vas voir ici n'est pas un ennemi. C'est une version de toi.",
          "— Une version de moi qui veut me tuer, dit Tarine.",
          "— Toutes les versions font ça au début."
        ],
        narr_victoire:[
          "Le miroir se brise. Les fragments restent suspendus une seconde — lumière dispersée.",
          "Dans chaque fragment, Tarine voit quelque chose de différent. Ses peurs. Ses questions.",
          "Sam ramasse un fragment. Il ne dit rien.",
          "Tarine comprend sans qu'on lui dise : l'épreuve n'était pas de gagner.",
          "C'était de rester debout après avoir regardé."
        ],
        narr_defaite:[
          "Le miroir tient. Ce qu'il reflète reste.",
          "Sam pose une main sur l'épaule de Tarine.",
          "— Ce que tu n'arrives pas à regarder reviendra. C'est la règle ici.",
          "— Je sais, dit Tarine.",
          "Il ne sait pas encore. Mais il commence."
        ],
        journal_victoire:"Le Royaume de l'Essence n'est pas là-bas. Il est dedans. L'épreuve du miroir ne m'a pas montré des ennemis — elle m'a montré ce que j'évite de regarder. L'absence de Papa, quelque part au loin. La solitude à la Villoise avant tout ça. La peur de ne pas être à la hauteur de ce que cette pierre semble attendre de moi. J'ai regardé en face. Je suis encore debout, et plutôt fier de moi."
      },
      {
        id:"m5",num:5,name:"L'Épreuve de l'Eau",
        desc:"Apprendre à tenir sans résister.",
        brief:"Le lac immobile du Royaume. Lundgren dit : certaines choses ne se combattent pas. Elles se traversent.",
        allies_requis:["FULGENCE"],allies_dispo:["KAREN"],
        ennemis:["DARK","BABA"],ennemis_extra:1,
        xp:140,
        narr_avant:[
          "Le lac du Royaume n'a pas de fond visible.",
          "Lundgren est debout sur le bord, les yeux sur l'eau immobile.",
          "— L'eau n'a pas de forme, dit-il. Elle prend la forme de ce qui la contient.",
          "— Et moi je suis le contenant, dit Tarine.",
          "— Pas encore. Mais tu le deviendras si tu arrêtes de te battre contre ta propre nature."
        ],
        narr_victoire:[
          "L'eau se referme. Tarine remonte — pas indemne, mais différent.",
          "Il a tenu. Pas en résistant. En acceptant d'être traversé.",
          "— Deuxième épreuve, dit Lundgren. Il reste le feu.",
          "La pierre dans sa poche pulse doucement, régulièrement.",
          "Comme un cœur qui sait ce qu'il fait."
        ],
        narr_defaite:[
          "L'eau ne se bat pas. Elle attend.",
          "Tarine remonte à la surface en toussant.",
          "— Tu t'es battu contre elle, dit Lundgren.",
          "— Qu'est-ce qu'il fallait faire ?",
          "— La laisser entrer. On recommence."
        ],
        journal_victoire:"Fulgence est venu avec moi dans le Royaume. Il ne pose pas de questions — il est juste là. C'est une des rares choses sur lesquelles je peux compter sans avoir à l'expliquer. L'épreuve de l'eau m'a appris à ne pas résister à ce que je ne peux pas contrôler. Mon père était comme ça aussi, je crois. Il savait tenir sans se durcir."
      },
      {
        id:"m6",num:6,name:"L'Épreuve du Feu",
        desc:"La dernière épreuve. La plus dure.",
        brief:"La chambre de feu du Royaume. Lundgren dit que cette épreuve ne se passe pas dans un lieu. Elle se passe dans la mémoire.",
        allies_requis:["KAREN","FULGENCE"],allies_dispo:[],
        ennemis:["BABA","DARK"],ennemis_extra:2,
        xp:180,unlock_ally:"LUNDGREN",
        narr_avant:[
          "La chambre de feu du Royaume ne brûle pas.",
          "Elle révèle.",
          "Les flammes ici ne sont pas de la chaleur — elles sont des souvenirs.",
          "Et les souvenirs de Tarine Keïta ont des dents."
        ],
        narr_victoire:[
          "Les flammes s'éteignent une par une.",
          "Ce qui reste : la mémoire nette du Général Keïta. Son rire jeune. Sa façon de serrer les mâchoires.",
          "Et cette certitude, nouvelle, calme : la promesse qu'il s'est faite à neuf ans était juste.",
          "Lundgren pose la main sur son épaule — ce geste qu'il a depuis le premier soir dans la forêt.",
          "— Tu es prêt pour Abidjan, dit-il.",
          "Tarine hoche la tête. Il n'a pas peur."
        ],
        narr_defaite:[
          "Le feu de la mémoire est différent des autres feux.",
          "On ne l'éteint pas en soufflant dessus.",
          "— Reviens quand tu es prêt à te souvenir, dit Lundgren.",
          "— Je me souviens déjà, dit Tarine.",
          "— Se souvenir et regarder sont deux choses différentes."
        ],
        journal_victoire:"Lundgren dit que je suis prêt. Je ne sais pas si c'est vrai. Mais je sais que je n'ai plus peur de la même façon. La peur d'avant était aveugle. Celle-ci a une forme. Elle s'appelle Schissin-Rouge. Un nom de code dans le carnet de mon père. Quelqu'un qui a su qui il était avant que lui le sache. Je rentre à Abidjan."
      }
    ]
  },
  {
    id:"acte3",label:"ACTE III",titre:"LE BORN LAND",
    narration_debut:[
      "Il y a des territoires au-delà du Royaume de l'Essence.",
      "Le Born Land : là où ceux qui refusent les pierres construisent leur propre pouvoir.",
      "Youri est là-bas. Il surveille quelqu'un depuis des mois.",
      "Tarine traverse seul. Pour la première fois, la pierre ne guide pas — elle suit."
    ],
    missions:[
      {
        id:"m7",num:7,name:"La Terre des Borns",
        desc:"Territoire inconnu. La pierre change ici.",
        brief:"Le Born Land. Les règles changent ici. Ce que tu portais là-bas ne fonctionne pas de la même façon ici. Mais ce que tu es, oui.",
        allies_requis:[],allies_dispo:["LUNDGREN"],
        ennemis:["DARK","BABA"],ennemis_extra:2,
        xp:160,
        narr_avant:[
          "Le Born Land a une odeur qui n'existe pas dans le monde réel.",
          "Quelque chose entre le fer et le sel et quelque chose de plus ancien.",
          "La pierre dans la poche de Tarine pulsait autrement depuis qu'il avait franchi la frontière.",
          "Pas d'avertissement. Pas de direction. Juste une présence silencieuse, comme si elle aussi regardait autour d'elle."
        ],
        narr_victoire:[
          "Les Born reculent — pas défaits, repositionnés.",
          "Youri sort de l'ombre. Grand, calme, avec cette façon d'observer qu'ont les gens qui attendent depuis longtemps.",
          "— Bienvenue dans le Born Land, dit-il. Tu es en retard d'environ sept siècles.",
          "— Mon emploi du temps était chargé, dit Tarine.",
          "Youri sourit. Pas un grand sourire — juste suffisant."
        ],
        narr_defaite:[
          "Le Born Land repousse.",
          "Tarine s'appuie contre une surface qui n'existe pas dans le monde ordinaire.",
          "La pierre dans sa poche est froide pour la première fois.",
          "Froid de surprise, pas de peur. Elle attend. Lui aussi."
        ],
        journal_victoire:"Le Born Land est différent de ce que j'imaginais. Pas hostile — mais pas accueillant non plus. Neutre d'une façon absolue, comme si le lieu lui-même n'avait pas d'opinion sur ce qui s'y passe. J'ai rencontré Youri. Papa parlait de lui dans le carnet — quelqu'un en qui avoir confiance plus qu'en lui-même. Je comprends maintenant."
      },
      {
        id:"m8",num:8,name:"La Veille",
        desc:"La nuit avant la confrontation.",
        brief:"Youri a des informations sur Sub et Grob — les émissaires de Sgrün qui opèrent à Abidjan. Cette nuit, on prépare.",
        allies_requis:["LUNDGREN"],allies_dispo:["KAREN","FULGENCE"],
        ennemis:["DARK"],ennemis_extra:3,
        xp:180,
        narr_avant:[
          "Youri étale les cartes sur la table.",
          "— Sub est à Abidjan depuis six mois. Grob passe. Ce sont des opérateurs.",
          "— Ils travaillent pour Sgrün.",
          "— Oui. Et ils ont équipé quelqu'un que tu connais de nom.",
          "Tarine attend.",
          "— Schissin-Rouge, dit Youri."
        ],
        narr_victoire:[
          "La veille tient. Les positions sont claires.",
          "Tarine regarde la carte d'Abidjan — sa ville, ses rues, le quartier de Marcory dessiné en rouge.",
          "Quelque chose s'installe en lui. Pas de la colère. Quelque chose de plus froid et de plus précis.",
          "— On rentre demain, dit-il.",
          "— On rentre demain, confirme Lundgren."
        ],
        narr_defaite:[
          "Les lignes ne tiennent pas. Les informations sont incomplètes.",
          "— On n'est pas prêts, dit Youri.",
          "— Si, dit Tarine. On n'a juste pas tous les morceaux encore.",
          "— C'est la même chose.",
          "— Non. Ce n'est pas la même chose du tout."
        ],
        journal_victoire:"Sub et Grob. Deux émissaires d'une entité qui veut les cinq pierres. Pas pour les utiliser comme des outils — pour contrôler les possibilités elles-mêmes. Ce que ça signifie concrètement : quelqu'un décide de ce qui peut arriver et de ce qui ne peut pas. À grande échelle. Pour longtemps. Mon père a senti ça arriver. Il n'a pas eu le temps de nommer la chose. Moi j'ai le temps."
      },
      {
        id:"m9",num:9,name:"Le Rosmog",
        desc:"Affrontement avec l'émissaire.",
        brief:"Treichville, Abidjan. La pierre explose d'un coup — avertissement immédiat. L'émissaire est dans la rue. Il cherche quelqu'un.",
        allies_requis:["LUNDGREN","FULGENCE"],allies_dispo:["KAREN"],
        ennemis:["DARK","BABA"],ennemis_extra:2,
        xp:220,unlock_ally:"BABA",
        narr_avant:[
          "Treichville. Un après-midi ordinaire.",
          "La pierre dans la poche de Tarine explose — pas une pulsation. Une alarme.",
          "Dans la rue, les gens ralentissent sans savoir pourquoi.",
          "Les oiseaux sur les fils électriques s'envolent dans la direction opposée.",
          "L'émissaire est là. Forme humaine — une forme qu'il habite, pas une forme qu'il est."
        ],
        narr_victoire:[
          "L'émissaire recule. Pas vaincu — repositionné.",
          "Dans ses yeux avant qu'il disparaisse : Tu es là. Je te trouverai.",
          "Tarine tient la pierre dans sa paume. Elle ne pulsait plus.",
          "Elle brûlait.",
          "— C'est différent, dit-il à Lundgren.",
          "— Oui, dit Lundgren. Maintenant ils savent que tu existes."
        ],
        narr_defaite:[
          "L'émissaire disparaît dans la rue de Treichville.",
          "Pas de victoire. Un message.",
          "— Il reviendra, dit Lundgren.",
          "— Je sais, dit Tarine.",
          "— La prochaine fois, il ne viendra pas seul.",
          "— Je sais ça aussi."
        ],
        journal_victoire:"L'émissaire m'a regardé avec des yeux qui n'ont pas de chaleur — pas de la haine, pas de l'indifférence. Une attention totale, sans autre contenu. Tu es là. Je te trouverai. C'est ce que ses yeux disaient. Comme Sylla dans la vision. Ce n'est pas une coïncidence. Baba Tunde est venu me trouver après le combat. Il a changé, lui aussi. Parfois les ennemis deviennent autre chose."
      }
    ]
  },
  {
    id:"acte4",label:"ACTE IV",titre:"L'HOMME EN BLEU",
    narration_debut:[
      "Retour à Abidjan. Marcory Résidentiel.",
      "La cuisine jaune pâle. Karen qui range ses courses.",
      "Sam Grün est assis sur les marches.",
      "— Youri m'a contacté hier soir, dit Sam.",
      "— Je sais, dit Tarine.",
      "Schissin-Rouge. Un chef de police abidjanais. Un nom de code dans le carnet de son père.",
      "Son père est mort exactement au bord de ce qu'il cherchait à savoir."
    ],
    missions:[
      {
        id:"m10",num:10,name:"Retour à Marcory",
        desc:"La ville a changé pendant votre absence.",
        brief:"Les rues de Marcory. Depuis votre retour, les opérations dans le quartier ont augmenté. Ils cartographient. Ils cherchent quelqu'un.",
        allies_requis:["KAREN"],allies_dispo:["FULGENCE","BABA"],
        ennemis:["DARK","BABA"],ennemis_extra:2,
        xp:200,
        narr_avant:[
          "Les rues de Marcory le matin.",
          "Le vendeur de journaux passe — Fraternité Matin, Fraternité Matin.",
          "Tout est pareil. Rien n'est pareil.",
          "— Depuis trois semaines, dit Sam, les opérations dans le quartier ont augmenté.",
          "— Ils cherchent l'homme en bleu.",
          "— Ils me cherchent, dit Tarine.",
          "— Oui."
        ],
        narr_victoire:[
          "Marcory tient.",
          "Tarine regarde sa rue depuis le toit de l'immeuble du coin.",
          "La ville qui continue — les vendeurs, les motos, les femmes avec leurs étals.",
          "Il connaît ces rues mieux qu'eux.",
          "C'est l'avantage.",
          "C'est la seule chose qu'ils n'ont pas et qu'ils ne peuvent pas acheter."
        ],
        narr_defaite:[
          "Ils avancent dans le quartier.",
          "— Il faut changer de position, dit Sam.",
          "— Non, dit Tarine. Marcory c'est chez moi.",
          "— Exactement. C'est pourquoi c'est dangereux.",
          "Tarine regarde la cuisine jaune pâle par la fenêtre.",
          "Karen à l'intérieur qui prépare le café.",
          "Il sait que Sam a raison. Il refuse de le dire."
        ],
        journal_victoire:"Je suis rentré à Abidjan et la ville me reconnaît. Pas de façon magique — de façon réelle. Je connais les rues, les habitudes, les chemins que personne d'autre ne prend. C'est ce que les émissaires ne peuvent pas cartographier depuis l'extérieur. Karen ne pose pas de questions sur ce qui s'est passé pendant mon absence. Elle me regarde et elle sait. Elle a toujours su."
      },
      {
        id:"m11",num:11,name:"La Villa de Sylla",
        desc:"Reconnaissance à Cocody.",
        brief:"Une villa à Cocody. Sylla — le chef de police — tient quelque chose dans ses mains ce soir. La pierre du feu. La vision est réelle.",
        allies_requis:["LUNDGREN","BABA"],allies_dispo:["FULGENCE"],
        ennemis:["DARK","BABA"],ennemis_extra:2,
        xp:240,
        narr_avant:[
          "La villa de Cocody depuis le mur d'enceinte.",
          "Tarine voit Sylla sur la terrasse.",
          "La pierre dans sa poche brûle d'une façon nouvelle — pas d'avertissement.",
          "De la reconnaissance.",
          "Deux pierres dans le même espace.",
          "— La pierre du feu, dit-il à voix basse.",
          "— Oui, dit Lundgren derrière lui. Quinze ans qu'il l'a."
        ],
        narr_victoire:[
          "Ils sortent de la villa sans être vus.",
          "Dans la nuit d'Abidjan, Tarine tient la vision dans sa tête.",
          "Les chars. La main de Sylla qui impose une direction.",
          "— Ce n'est pas un homme ambitieux à qui on a vendu quelque chose qui le dépassait, dit Sam.",
          "— Il peut réellement la porter.",
          "— Et il a eu quinze ans pour apprendre à l'utiliser.",
          "Tarine pense à son père. Au fil. Au bord.",
          "— On l'expose, dit-il."
        ],
        narr_defaite:[
          "L'alarme. Les gardes qui convergent.",
          "Ils sortent en courant — Tarine, Lundgren, Baba.",
          "Dans la course, Tarine voit quand même : la main de Sylla, la façon dont il tient quelque chose.",
          "La pierre du feu. Réelle.",
          "— On a ce qu'il faut, dit Baba en courant.",
          "— Pas encore assez, dit Lundgren.",
          "— Assez pour commencer, dit Tarine."
        ],
        journal_victoire:"J'ai vu Sylla. Pas une vision cette fois — réel, sur sa terrasse, avec la pierre du feu dans sa main. Il tient ça avec la précision de quelqu'un qui a appris. Quinze ans. Pendant que je grandissais à Marcory sans savoir ce que j'étais, il construisait quelque chose avec ce que mon père cherchait à exposer. Papa est mort exactement au bord de ça. Je suis au bord maintenant. Je ne m'arrête pas."
      },
      {
        id:"m12",num:12,name:"L'Émissaire de Treichville",
        desc:"Protéger Samia Koné.",
        brief:"Un maquis de Treichville. Samia Koné documente les incidents depuis des mois. Elle a un carnet rouge bordeaux. Il faut la protéger.",
        allies_requis:["KAREN","BABA"],allies_dispo:["FULGENCE","LUNDGREN"],
        ennemis:["DARK","BABA"],ennemis_extra:3,
        xp:260,
        narr_avant:[
          "Le maquis de Treichville.",
          "Samia Koné pose son carnet rouge bordeaux sur la table entre eux.",
          "— Vous êtes qui exactement ? dit-elle.",
          "— Quelqu'un qui a entendu parler de votre travail.",
          "— Tout le monde dit ça.",
          "La pierre explose dans la poche de Tarine.",
          "Maintenant. Ici. Immédiatement.",
          "— Restez ici. Derrière le comptoir si possible."
        ],
        narr_victoire:[
          "L'émissaire disparaît dans la rue.",
          "Samia Koné sort de derrière le comptoir.",
          "Elle regarde Tarine. Elle ouvre son carnet rouge bordeaux.",
          "— C'est quoi votre vrai nom ? dit-elle.",
          "— Tarine Keïta.",
          "— Le fils du Général Keïta.",
          "Ce n'est pas une question.",
          "— Oui, dit Tarine.",
          "Elle hoche la tête une fois. Puis elle continue d'écrire."
        ],
        narr_defaite:[
          "L'émissaire repasse.",
          "Samia Koné est en sécurité derrière le comptoir.",
          "Mais le carnet est là, sur la table.",
          "Tarine le ramasse et le lui rend.",
          "— Il faut changer d'endroit, dit-il.",
          "— Je sais, dit-elle. Mais j'ai encore des sources qui ne peuvent pas se déplacer.",
          "— Alors on revient."
        ],
        journal_victoire:"Samia Koné. Elle documente tout depuis des mois — les dates, les noms, les montants. Son carnet rouge bordeaux est une arme plus précise que tout ce que je peux faire avec les pierres. Elle sait qui je suis. Je lui ai dit que sa liste serait utilisée. Elle a hoché la tête comme si ça, au moins, était une réponse suffisante."
      }
    ]
  },
  {
    id:"acte5",label:"ACTE V",titre:"NOUVEAU DÉPART",
    narration_debut:[
      "Schissin-Rouge est exposé. L'article paraît dans La Nuit d'Abidjan.",
      "Mais Sgrün a d'autres pierres. D'autres transactions.",
      "Sam dit : il y a une porte au Pôle Nord.",
      "Tarine se souvient de la vision — la porte debout dans la neige.",
      "— C'est presque le moment, dit-il.",
      "— Presque, dit Sam. D'abord la dernière chose à protéger ici."
    ],
    missions:[
      {
        id:"m13",num:13,name:"L'Adieu",
        desc:"Protéger les siens avant de partir.",
        brief:"Marcory. Karen. Fulgence. Samia. Ceux que Sylla cherche maintenant que l'article est publié. On protège d'abord.",
        allies_requis:["KAREN","FULGENCE"],allies_dispo:["BABA","LUNDGREN"],
        ennemis:["DARK","BABA"],ennemis_extra:3,
        xp:280,
        narr_avant:[
          "L'article est sorti ce matin.",
          "Schissin-Rouge, chef de police, pierre du feu, quinze ans de transactions.",
          "Les hommes de Sylla se positionnent dans Marcory depuis l'aube.",
          "— Il va tenter quelque chose avant que les arrestations soient prononcées, dit Sam.",
          "— Il va s'en prendre à ceux qui ont témoigné.",
          "Tarine pense à Karen dans la cuisine jaune pâle.",
          "— On protège d'abord."
        ],
        narr_victoire:[
          "Karen est en sécurité. Fulgence aussi. Samia Koné a été escortée vers un endroit que Youri connaît.",
          "Tarine regarde la cuisine une dernière fois.",
          "Le jaune des murs. La fissure dans le carrelage du coin gauche. La cafetière sur le feu.",
          "Des choses qui ont tenu pendant toute sa vie.",
          "Karen vient se mettre à côté de lui.",
          "— Tu pars ce soir ? dit-elle.",
          "— Oui.",
          "— C'est bien, dit-elle.",
          "Il lui prend la main. Elle le laisse faire."
        ],
        narr_defaite:[
          "Ils passent à travers les positions.",
          "Tarine se retrouve entre les gardes et la maison.",
          "— Tarine, dit Karen depuis la fenêtre. Derrière. Par le jardin.",
          "Il passe par le jardin. Le portail. Le bananier maigre.",
          "L'endroit où tout a commencé.",
          "Il tient. Pour ce soir, il tient."
        ],
        journal_victoire:"Karen est en sécurité. Je lui ai dit que je partais. Elle a dit que c'est bien. Pas résignation — quelque chose de plus grand que ça. Elle a attendu ce moment depuis ma naissance. Elle l'a préparé. Elle m'a préparé. La main sur ma joue, une dernière fois. Sa peau chaude. Ses doigts légèrement rugueux. La main de quelqu'un qui a tenu les choses pendant longtemps."
      },
      {
        id:"m14",num:14,name:"Sub & Grob",
        desc:"Les émissaires de Sgrün. Le combat final à Abidjan.",
        brief:"Le quartier de Marcory. Sub et Grob sont là tous les deux — ce n'est pas une coïncidence. Ils savent que tu pars. Ils veulent la pierre avant.",
        allies_requis:["LUNDGREN","BABA","FULGENCE"],allies_dispo:["KAREN"],
        ennemis:["DARK","BABA"],ennemis_extra:3,
        xp:320,
        narr_avant:[
          "La nuit de Marcory.",
          "Deux présences dans la rue — Sub et Grob. Formes humaines.",
          "La pierre dans la poche de Tarine brûle comme jamais.",
          "— Ils veulent la schismariat, dit Sam.",
          "— Ils ne l'auront pas, dit Tarine.",
          "— Non, dit Sam. Je sais."
        ],
        narr_victoire:[
          "Sub et Grob disparaissent. Pas vaincus — ils ne le sont jamais vraiment.",
          "Mais repoussés.",
          "La nuit de Marcory retrouve son calme.",
          "Quelque part dans la rue, une radio joue quelque chose de doux.",
          "Sam pose la main sur l'épaule de Tarine.",
          "— Tu sais où on va maintenant.",
          "— La porte, dit Tarine.",
          "— La porte."
        ],
        narr_defaite:[
          "Deux émissaires. Trop.",
          "Sam intervient — une lumière grise dans la nuit d'Abidjan.",
          "Sub et Grob reculent.",
          "— La prochaine fois, dit Grob, tu ne seras pas là pour lui, Grün.",
          "— La prochaine fois, dit Sam, il n'aura pas besoin de moi.",
          "Tarine regarde sa ville. Ses rues. Sa maison.",
          "Il pense : je reviendrai."
        ],
        journal_victoire:"Sub et Grob. Deux algorithmes qui imitent l'humanité sans en avoir le désordre. Je les ai regardés partir dans la nuit de Marcory. Ils reviendront. Sgrün enverra d'autres choses. Mais pas ce soir. Ce soir, Abidjan est à nous. Demain, la porte au Pôle Nord. Quand tu mourras, elles sauront où aller — c'est ce que Lundgren a dit à Kankou Moussa il y a sept siècles. Je ne mourrai pas ce soir."
      },
      {
        id:"m15",num:15,name:"La Porte",
        desc:"La fin de l'Éveil. Le début de quelque chose d'autre.",
        brief:"Le jardin de Marcory. Le portail s'ouvre. Sam étend le bras — pas d'incantation, juste une concentration silencieuse. La porte. L'autre côté.",
        allies_requis:["LUNDGREN","SAM"],allies_dispo:["KAREN","FULGENCE","BABA"],
        ennemis:["DARK","BABA"],ennemis_extra:4,
        xp:400,
        narr_avant:[
          "Le jardin de derrière. Le bananier maigre.",
          "Sam étend le bras, paume vers le bas.",
          "L'air autour de sa paume change — une densité, une résistance.",
          "La porte. Ses bords nets, solides.",
          "De l'autre côté : une lumière qui n'a pas de source, une profondeur qui n'a pas de fond.",
          "Tarine touche le bracelet à son poignet — le noir, le vert, le doré.",
          "D'où il vient.",
          "Il se retourne une dernière fois.",
          "Karen. Les épaules droites. La tête haute.",
          "Elle lève la main.",
          "Ce fut tout. Ce fut suffisant."
        ],
        narr_victoire:[
          "La lumière de l'autre côté.",
          "Tarine fait un pas.",
          "Le froid l'enveloppe — pas le froid de la climatisation.",
          "Un froid qui vient de plus loin que la météo.",
          "Sam pose une main sur son épaule. Ferme. Stable. Réelle.",
          "— Respire, dit-il.",
          "Tarine respire.",
          "Et la porte devient possible.",
          ".",
          ".",
          "Les cinq pierres. Kankou Moussa. Sept siècles.",
          "L'Éveil est terminé.",
          "Ce qui vient après n'a pas encore de nom."
        ],
        narr_defaite:[
          "La porte se referme.",
          "Pas maintenant — mais bientôt.",
          "Tarine regarde ses mains dans le noir du jardin.",
          "La chaleur est toujours là.",
          "Elle a toujours été là.",
          "— La porte sera là demain, dit Sam.",
          "— Et dans sept siècles si nécessaire.",
          "— C'est une longue attente, dit Tarine.",
          "— Pour les pierres, dit Sam, non."
        ],
        journal_victoire:"Je suis passé. L'autre côté n'est pas ce que j'imaginais — pas un endroit différent. Une façon différente d'être dans les endroits. Sam dit que la porte au Pôle Nord nous attend. Que la prochaine transaction de Sgrün est là-bas. Que comprendre comment neutraliser ce que Sylla porte et protéger ce que je porte — les deux arrivent ensemble. Je porte le bracelet de mon père. Je porte la schismariat. Je porte la promesse que je m'ai faite à neuf ans dans le salon de Marcory. Ce n'est pas du poids. C'est de la direction."
      }
    ]
  },
   {
    id:"acte6",label:"ACTE VI",titre:"LE PÔLE NORD",
    narration_debut:[
      "La porte s'est refermée derrière eux. L'air d'Abidjan a disparu.",
      "Le froid n'est pas une température ici. C'est une présence.",
      "Sam marche dans la neige sans laisser d'empreintes.",
      "— Sgrün ne vit pas ici, dit-il. Mais c'est ici qu'il fait ses transactions.",
      "Lundgren regarde l'horizon blanc. Sept siècles qu'il n'avait pas vu de glace."
    ],
    missions:[
      {
        id:"m16",num:16,name:"La Base Sgrün",
        desc:"Infiltrer le point de transaction.",
        brief:"Une structure noire au milieu du blanc absolu. La schismariat pulse dans ta main pour se réchauffer. Il y a des gardes. Pas des humains.",
        allies_requis:["SAM"],allies_dispo:["LUNDGREN"],
        ennemis:["DARK"],ennemis_extra:4,
        xp:450,
        narr_avant:[
          "Le bâtiment n'a pas de fenêtres. Pas de portes visibles.",
          "Juste un bloc d'obsidienne posé sur la banquise.",
          "— Des Construits, dit Sam en désignant les gardes.",
          "Des armures vides tenues par de la volonté.",
          "La pierre de Tarine devient brûlante. Elle déteste cet endroit."
        ],
        narr_victoire:[
          "Les armures tombent. Juste de la ferraille dans la neige.",
          "Sam pose sa main sur le mur d'obsidienne. Le mur s'ouvre comme de l'eau.",
          "— Facile, dit Tarine.",
          "— Trop facile, corrige Lundgren.",
          "Dans le couloir sombre, quelque chose les attendait déjà."
        ],
        narr_defaite:[
          "Les Construits ne se fatiguent pas. Pas de muscles. Pas de poumons.",
          "Tarine recule dans la neige, le souffle court.",
          "— On ne passe pas en force, dit Sam.",
          "La neige commence à recouvrir leurs traces. Le bloc noir reste impassible."
        ],
        journal_victoire:"Les Construits de Sgrün ne sont pas vivants, mais ils ne sont pas morts non plus. C'est le pouvoir de Sgrün : retirer l'essence des choses pour n'en garder que la fonction. C'est ce qu'il veut faire avec nos pierres. Je commence à comprendre pourquoi mon père était terrifié. Ce n'est pas un ennemi qui veut nous détruire. C'est un ennemi qui veut nous ranger."
      },
      {
        id:"m17",num:17,name:"L'Archive des Possibles",
        desc:"Trouver ce que Sgrün cherche.",
        brief:"Le cœur de la base. Sgrün stocke des futurs possibles ici. Il faut trouver celui qui concerne Abidjan.",
        allies_requis:["LUNDGREN"],allies_dispo:["SAM"],
        ennemis:["DARK","BABA"],ennemis_extra:3,
        xp:500,
        narr_avant:[
          "Des milliers de filaments lumineux flottent dans une salle immense.",
          "Chaque filament est un futur. Un choix.",
          "Lundgren marche parmi eux. — Ne les touchez pas, dit-il. Ils s'accrochent.",
          "Mais un filament rouge vif se dirige tout droit vers Tarine."
        ],
        narr_victoire:[
          "Tarine attrape le filament rouge.",
          "Une explosion d'images : Abidjan en flammes. Sylla riant. Une tombe sans nom.",
          "Il serre le poing. Le filament éclate en poussière.",
          "— Ce n'était qu'un possible, dit Sam doucement.",
          "— C'en est un que je viens d'annuler, répond Tarine."
        ],
        narr_defaite:[
          "Le filament le touche. Les visions sont trop fortes.",
          "Tarine tombe à genoux. Le poids de mille futurs s'écrase sur lui.",
          "Lundgren le tire en arrière.",
          "— Ton esprit n'est pas fait pour voir demain, dit le vieux guerrier."
        ],
        journal_victoire:"J'ai vu le plan de Sylla. Il ne veut pas juste le pouvoir militaire. Il veut utiliser la pierre du feu pour réécrire la volonté des gens d'Abidjan. Sgrün lui fournit la technologie pour amplifier la pierre. Il faut rentrer. Vite."
      },
      {
        id:"m18",num:18,name:"La Fissure de Glace",
        desc:"Fuir le Pôle Nord.",
        brief:"La base s'effondre. Sgrün sait que vous êtes là. Une anomalie géante vous bloque le chemin de la porte.",
        allies_requis:["SAM","LUNDGREN"],allies_dispo:[],
        ennemis:["DARK"],ennemis_extra:5,
        xp:600,
        narr_avant:[
          "Les murs d'obsidienne hurlent.",
          "Une faille s'ouvre dans le sol. Une entité en sort. Pas humaine. Pas machine.",
          "Un concept pur de destruction.",
          "— On ne tue pas ça, crie Sam. On le retarde !"
        ],
        narr_victoire:[
          "La porte s'ouvre. Sam passe. Lundgren passe.",
          "Tarine se retourne. L'entité n'a pas de visage, mais elle a un regard.",
          "Il lève sa pierre, libère un flash aveuglant, et plonge dans la porte.",
          "Le froid disparaît. L'odeur de la terre d'Afrique revient d'un coup."
        ],
        narr_defaite:[
          "L'entité bloque la porte.",
          "Son froid brûle plus que le feu.",
          "La porte se referme. Piégés dans le blanc absolu.",
          "Ils vont devoir trouver un autre chemin."
        ],
        journal_victoire:"Nous avons survécu au Pôle Nord. Mais Sgrün nous a vus. Il connaît mon visage. Sam est inquiet, bien qu'il ne le montre pas. Lundgren, lui, regarde sa propre main. Il a vieilli. Juste un peu. Mais je l'ai vu. L'immortalité a ses limites quand on sort du Royaume de l'Essence."
      }
    ]
  },
  {
    id:"acte7",label:"ACTE VII",titre:"L'HÉRITAGE DE MALI",
    narration_debut:[
      "Retour en Afrique, mais pas à Abidjan.",
      "La porte s'est ouverte sur le désert du Mali. Le sable rouge.",
      "— Pourquoi ici ? demande Tarine.",
      "— Parce que c'est ici que Kankou Moussa a divisé les pierres, répond Lundgren.",
      "Il faut comprendre le passé pour ne pas le rater demain."
    ],
    missions:[
      {
        id:"m19",num:19,name:"Les Ruines de Niani",
        desc:"L'ancienne capitale de l'Empire du Mali.",
        brief:"Des pillards opèrent dans les ruines. Mais ils ne cherchent pas de l'or. Ils cherchent des résonances.",
        allies_requis:["LUNDGREN"],allies_dispo:["FULGENCE"],
        ennemis:["BABA"],ennemis_extra:3,
        xp:400,
        narr_avant:[
          "Les murs de briques de terre cuite à moitié effacés par le vent.",
          "Des hommes armés fouillent la zone avec des compteurs géiger étranges.",
          "— Les hommes de Sylla, souffle Fulgence.",
          "Tarine serre les poings. Ils profanent l'histoire."
        ],
        narr_victoire:[
          "Les hommes de Sylla fuient dans le désert.",
          "Tarine ramasse un de leurs appareils. L'écran clignote en approchant de lui.",
          "— Ils cherchent les échos des autres pierres, dit Lundgren.",
          "Sous le sable, une vieille porte en pierre apparaît."
        ],
        narr_defaite:[
          "Les tirs de suppression sont trop denses.",
          "Le sable vole, aveuglant.",
          "— On se replie ! crie Fulgence.",
          "Les ruines de Niani gardent leurs secrets."
        ],
        journal_victoire:"Sylla ne se contente pas de la pierre du feu. Il cherche les quatre autres. Mon père avait essayé de cacher leurs emplacements. Lundgren dit que sous ces ruines se trouve la Chambre des Poids, là où l'Empereur a pris sa décision il y a sept siècles."
      },
      {
        id:"m20",num:20,name:"La Chambre des Poids",
        desc:"Résoudre l'énigme de l'Empereur.",
        brief:"Une salle souterraine. Des gardiens spectraux protègent le savoir de l'Empereur. Ils testent ton droit d'être ici.",
        allies_requis:[],allies_dispo:["LUNDGREN","FULGENCE"],
        ennemis:["DARK"],ennemis_extra:3,
        xp:450,
        narr_avant:[
          "Il fait frais sous le sable.",
          "Des torches s'allument toutes seules en lumière bleue.",
          "Des silhouettes de guerriers mandingues se lèvent des murs.",
          "Ils ne portent pas d'armes. Ils portent de la gravité."
        ],
        narr_victoire:[
          "Tarine ne frappe pas. Il laisse sa pierre résonner avec les spectres.",
          "Les guerriers s'inclinent en silence et retournent dans la pierre.",
          "Au centre de la pièce, un piédestal vide.",
          "— C'est là que reposait ta pierre, Tarine. La Pierre de l'Équilibre."
        ],
        narr_defaite:[
          "La gravité de la pièce augmente.",
          "Les genoux de Tarine cèdent. Impossible de se tenir debout.",
          "Les spectres jugent : indigne.",
          "La porte de pierre commence à se refermer."
        ],
        journal_victoire:"L'Équilibre. C'est le nom de ma pierre. Elle ne détruit pas, elle ne crée pas. Elle stabilise. C'est pour ça que Baba ne pouvait pas me toucher dans la cour de l'atelier. C'est pour ça que la magie des autres s'éteint près de moi. Je suis le point d'ancrage."
      },
      {
        id:"m21",num:21,name:"Le Poids de l'Or",
        desc:"L'écho de Kankou Moussa.",
        brief:"Une projection de l'Empereur apparaît. Il a un message pour le porteur de l'Équilibre.",
        allies_requis:["LUNDGREN"],allies_dispo:[],
        ennemis:["DARK"],ennemis_extra:4,
        xp:550,
        narr_avant:[
          "L'air scintille.",
          "Un homme couvert d'or, mais dont le visage est triste, se forme devant eux.",
          "Kankou Moussa. Le plus riche des rois.",
          "Mais l'image est corrompue. Un virus du Born Land tente d'effacer le message."
        ],
        narr_victoire:[
          "Le virus est détruit.",
          "L'Empereur parle d'une voix qui résonne dans les os.",
          "« Le feu consume. L'eau noie. La terre écrase. Le vent disperse. Seul l'équilibre tient le monde. »",
          "Il regarde Tarine. « Ne laisse pas le Feu prendre la tête. »"
        ],
        narr_defaite:[
          "Le virus ronge la projection.",
          "L'Empereur se fragmente, son message perdu dans des grésillements.",
          "Lundgren hurle de rage. Une part d'histoire vient de mourir."
        ],
        journal_victoire:"Le message est clair. Sylla, avec la pierre du Feu, est la menace ultime. S'il n'est pas arrêté, il ne va pas juste gouverner Abidjan. Il va la réduire en cendres pour reconstruire dessus. Le vrai nom de la schismariat est l'Équilibre. Il est temps de rentrer à la maison et de rééquilibrer les choses."
      }
    ]
  },
  {
    id:"acte8",label:"ACTE VIII",titre:"LA VÉRITÉ SUR LE GÉNÉRAL",
    narration_debut:[
      "Abidjan. Le retour.",
      "La ville est sous tension. La police patrouille partout.",
      "Karen attendait Tarine dans la pénombre du salon.",
      "— Il est temps de parler de ton père, dit-elle.",
      "Elle sort une vieille boîte à chaussures verte de sous le canapé."
    ],
    missions:[
      {
        id:"m22",num:22,name:"Le Fichier Rouge",
        desc:"Déchiffrer les dernières notes du Général.",
        brief:"La boîte contient des disquettes et des notes cryptées. Les hommes de Sylla ont repéré l'activation des données et lancent un raid sur la maison.",
        allies_requis:["KAREN"],allies_dispo:["FULGENCE"],
        ennemis:["BABA"],ennemis_extra:4,
        xp:450,
        narr_avant:[
          "L'écran du vieil ordinateur clignote.",
          "Les données défilent. Noms, dates, assassinats couverts par la police.",
          "Soudain, la porte du jardin vole en éclats.",
          "GIGN Ivoirien. Ou du moins, des hommes qui portent leur uniforme."
        ],
        narr_victoire:[
          "La maison est ravagée, mais les assaillants sont à terre.",
          "Le transfert de données finit à 100%.",
          "Karen sort l'arme de service de son mari du tiroir.",
          "— On ne peut plus rester ici, Tarine."
        ],
        narr_defaite:[
          "Ils sont trop nombreux.",
          "L'ordinateur est détruit par une balle perdue.",
          "Tarine tire Karen par le bras. Il faut fuir avant de tout perdre."
        ],
        journal_victoire:"Ma mère savait tirer. Elle n'a même pas cligné des yeux. Les données de Papa sont accablantes. Sylla n'a pas seulement tué mon père. Il a éliminé toute la chaîne de commandement qui s'opposait à son utilisation des Pierres. Papa est mort dans un hangar du Port Autonome."
      },
      {
        id:"m23",num:23,name:"Le Traître de la Garde",
        desc:"Trouver l'homme qui a vendu le Général.",
        brief:"Les dossiers pointent vers un certain 'Ousmane'. Un ancien ami du Général, aujourd'hui bras droit de Sylla. Il gère la sécurité du Port.",
        allies_requis:["FULGENCE"],allies_dispo:["BABA"],
        ennemis:["DARK","BABA"],ennemis_extra:3,
        xp:500,
        narr_avant:[
          "Le Port Autonome d'Abidjan la nuit.",
          "Ousmane fume un cigare près des conteneurs.",
          "Tarine s'avance hors de l'ombre. L'air autour de lui crépite.",
          "Ousmane lâche son cigare. Il a reconnu les yeux de son ancien ami."
        ],
        narr_victoire:[
          "Ousmane tremble à terre.",
          "— Sylla m'a forcé ! Il l'aurait fait sans moi de toute façon !",
          "Tarine lève la main, la chaleur au maximum.",
          "Puis il baisse le bras. Il n'est pas un assassin. L'Équilibre, pas la vengeance."
        ],
        narr_defaite:[
          "Les snipers d'Ousmane étaient en position.",
          "Tarine est cloué derrière un conteneur.",
          "Ousmane s'enfuit dans une berline noire. L'occasion est manquée."
        ],
        journal_victoire:"J'ai épargné Ousmane. Baba Tunde ne comprend pas. Il m'a dit que j'étais faible. Mais Lundgren a souri dans l'ombre. Tuer Ousmane ne ramènerait pas mon père, ça ne ferait que nourrir le chaos que Sylla installe. Ousmane a parlé avant de fuir : Sylla prépare l'Incandescence ce soir au Plateau."
      },
      {
        id:"m24",num:24,name:"La Tombe Vide",
        desc:"Le dernier secret du Général.",
        brief:"Avant d'attaquer Sylla, Tarine doit vérifier une dernière chose au cimetière de Williamsville. Une intuition terrible.",
        allies_requis:[],allies_dispo:["KAREN"],
        ennemis:["DARK"],ennemis_extra:4,
        xp:600,
        narr_avant:[
          "Le cimetière est silencieux.",
          "La tombe du Général Keïta. Le marbre est froid.",
          "Mais la pierre dans la poche de Tarine résonne... avec le sol.",
          "Des ombres du Born Land gardent la stèle."
        ],
        narr_victoire:[
          "Les ombres se dissipent.",
          "Tarine utilise la pierre pour déplacer la dalle.",
          "Le cercueil est vide. Pas d'ossements.",
          "Juste un message gravé au fond : 'Je t'attends de l'autre côté'."
        ],
        narr_defaite:[
          "Les ombres sont trop denses. Elles protègent le secret.",
          "Tarine est forcé de quitter le cimetière, le doute rongeant son esprit.",
          "Le Général repose-t-il vraiment ici ?"
        ],
        journal_victoire:"Mon père n'est pas mort. Ou plutôt, il n'est pas mort dans ce monde. 'L'autre côté'... Le Royaume de l'Essence ? Le Born Land ? Il a simulé sa mort pour protéger l'Équilibre et m'a laissé grandir loin de tout ça. Je n'ai plus le temps d'être en colère. Sylla va brûler le Plateau ce soir."
      }
    ]
  },
  {
    id:"acte9",label:"ACTE IX",titre:"LA GUERRE D'ABIDJAN",
    narration_debut:[
      "La sirène du couvre-feu hurle sur tout Abidjan.",
      "Sylla a déclaré la loi martiale. Les chars sont dans les rues.",
      "Mais ce ne sont pas des chars normaux. Leurs moteurs crachent des flammes bleues.",
      "Le feu de la Pierre alimente l'armée.",
      "Tarine, Karen, Fulgence, Baba et Lundgren regardent la ville depuis les toits."
    ],
    missions:[
      {
        id:"m25",num:25,name:"Le Pont HKB",
        desc:"Bloquer l'avancée des blindés de Sylla.",
        brief:"Les blindés magiques tentent de traverser le pont Henri Konan Bédié. Il faut tenir la ligne pour protéger le Sud d'Abidjan.",
        allies_requis:["BABA","FULGENCE"],allies_dispo:["LUNDGREN"],
        ennemis:["BABA","DARK"],ennemis_extra:5,
        xp:500,
        narr_avant:[
          "Le pont s'étire au-dessus de la lagune Ébrié.",
          "Les phares des blindés déchirent la nuit.",
          "Baba Tunde craque ses phalanges. — Comme à l'époque, Tarine ?",
          "— En un peu plus bruyant."
        ],
        narr_victoire:[
          "Tarine pose les deux mains sur l'asphalte du pont.",
          "L'Équilibre s'étend. Les flammes bleues des moteurs s'éteignent instantanément.",
          "Les chars s'arrêtent, morts. De simples blocs de métal sans magie.",
          "Les soldats fuient à pied."
        ],
        narr_defaite:[
          "Le feu des blindés est trop puissant.",
          "Le pont tremble. Les barricades cèdent.",
          "L'équipe doit sauter dans la lagune pour échapper aux flammes."
        ],
        journal_victoire:"Baba Tunde a combattu à mes côtés comme un frère. Le pont est bloqué avec les carcasses des blindés. Le Sud d'Abidjan est sauf pour le moment. Mais Sylla est dans la Tour Postel au Plateau. Il observe."
      },
      {
        id:"m26",num:26,name:"La Défense de la Villoise",
        desc:"Protéger l'atelier de l'attaque.",
        brief:"Sylla attaque les lieux symboliques. L'atelier de la Villoise est pris d'assaut par les Émissaires de Sgrün pour briser le moral.",
        allies_requis:["FULGENCE"],allies_dispo:["KAREN"],
        ennemis:["DARK"],ennemis_extra:4,
        xp:550,
        narr_avant:[
          "La cour de l'atelier. Là où Tarine a ressenti la pierre pour la première fois.",
          "Sub est de retour. Il flotte au-dessus du terrain de basket.",
          "— Sentimentalisme, dit Sub. Une faille humaine prévisible."
        ],
        narr_victoire:[
          "L'Équilibre de Tarine frappe Sub en plein vol.",
          "L'émissaire s'écrase sur le bitume, son enveloppe humaine se fracturant comme du verre.",
          "Fulgence sourit. — Il était temps qu'on nettoie la cour."
        ],
        narr_defaite:[
          "Sub est trop rapide. Des parties de l'atelier prennent feu.",
          "La bibliothèque brûle.",
          "Tarine sent un morceau de son enfance partir en fumée."
        ],
        journal_victoire:"Nous avons sauvé la Villoise. Sub a fui, grièvement endommagé. Fulgence m'a regardé au milieu de la cour défoncée et m'a dit que Papa serait fier. C'est la première fois que quelqu'un d'autre que ma mère parle de mon père avec cette fierté."
      },
      {
        id:"m27",num:27,name:"Le Siège de Marcory",
        desc:"Protéger la maison familiale.",
        brief:"Un commando d'élite fond sur la maison jaune pâle. C'est personnel. Karen refuse de quitter les lieux.",
        allies_requis:["KAREN"],allies_dispo:["BABA","LUNDGREN"],
        ennemis:["BABA","DARK"],ennemis_extra:5,
        xp:600,
        narr_avant:[
          "La rue de Marcory est vide. Les voisins sont barricadés.",
          "Des lasers rouges balaient la façade de la maison.",
          "Karen recharge le fusil du Général.",
          "— C'est chez moi, dit-elle. Ils n'entreront pas."
        ],
        narr_victoire:[
          "La rue est un champ de bataille.",
          "Tarine a dressé un dôme d'Équilibre pur autour de la maison.",
          "Les balles s'arrêtent en plein air et tombent. Les flammes meurent.",
          "La maison jaune pâle reste debout, intacte."
        ],
        narr_defaite:[
          "La défense cède.",
          "Le mur du salon s'effondre.",
          "Tarine doit arracher sa mère de la maison en flammes. Marcory est perdu."
        ],
        journal_victoire:"Ma mère est la personne la plus forte que je connaisse. Elle n'a pas cillé une seule fois. La maison tient debout. Marcory est sécurisé. Mais on ne peut pas rester sur la défensive éternellement. C'est le moment. On va au Plateau. On va chercher Sylla."
      }
    ]
  },
  {
    id:"acte10",label:"ACTE X",titre:"LA PIERRE DU FEU",
    narration_debut:[
      "Le Plateau, centre des affaires d'Abidjan.",
      "La Tour Postel brille d'une lueur rouge maladive.",
      "Le ciel au-dessus du bâtiment tourbillonne.",
      "Sylla prépare l'Incandescence : lier la pierre du Feu à l'esprit de tous les habitants.",
      "C'est la fin du chemin. Le combat final."
    ],
    missions:[
      {
        id:"m28",num:28,name:"L'Ascension de la Tour",
        desc:"Combattre étage par étage.",
        brief:"Monter les 26 étages de la Tour Postel. L'ascenseur est détruit. Les escaliers sont remplis de gardes sous l'influence du feu.",
        allies_requis:["BABA","FULGENCE"],allies_dispo:["SAM"],
        ennemis:["BABA","DARK"],ennemis_extra:6,
        xp:700,
        narr_avant:[
          "L'air dans les escaliers est étouffant. Ça sent le soufre.",
          "Des hommes aux yeux rougis barrent le chemin.",
          "— Ne les tuez pas, dit Tarine. Ils sont sous l'emprise de la Pierre.",
          "Baba soupire. — Ça complique toujours tout."
        ],
        narr_victoire:[
          "Étage 26. Les gardes sont assommés mais vivants.",
          "Les muscles de Tarine hurlent de fatigue.",
          "Mais la porte du bureau de Sylla est juste là.",
          "Elle est faite de bois massif. Elle fume légèrement."
        ],
        narr_defaite:[
          "La chaleur et le nombre ont raison d'eux.",
          "Pris au piège au 15ème étage, ils doivent briser une vitre et sauter sur un toit adjacent pour survivre."
        ],
        journal_victoire:"Nous y sommes. Le dernier palier. Baba Tunde saigne, Fulgence est épuisé, mais on l'a fait. Derrière cette porte, l'homme qui a brisé ma famille et qui veut maintenant briser ma ville."
      },
      {
        id:"m29",num:29,name:"L'Incandescence",
        desc:"Arrêter le rituel de Sylla.",
        brief:"Le bureau est un vaste espace vitré. Sylla lévite au centre, la Pierre du Feu brillant comme un soleil miniature dans son torse.",
        allies_requis:["LUNDGREN","SAM"],allies_dispo:[],
        ennemis:["DARK"],ennemis_extra:7,
        xp:900,
        narr_avant:[
          "Sylla ouvre les yeux. Ils sont devenus de la lave pure.",
          "— Tarine Keïta. Le fils du Général.",
          "Il sourit.",
          "— Ton père n'a pas su voir le potentiel de ce monde. Je vais le purifier.",
          "Tarine fait un pas en avant. L'Équilibre gronde dans ses paumes."
        ],
        narr_victoire:[
          "L'onde de choc brise toutes les vitres de la Tour Postel.",
          "L'Équilibre percute le Feu.",
          "Sylla hurle alors que la magie rouge est aspirée, éteinte, neutralisée.",
          "La Pierre du Feu s'échappe de sa poitrine et tombe sur la moquette, éteinte."
        ],
        narr_defaite:[
          "La Pierre du Feu est trop puissante.",
          "Une vague de chaleur rejette Tarine contre le mur, brisant ses côtes.",
          "Sylla rit, intouchable."
        ],
        journal_victoire:"Sylla est à terre. Il a vieilli de vingt ans en une seconde quand la pierre l'a quitté. C'est ça le prix. Mais il n'est pas mort. Je ramasse la Pierre du Feu. Elle est froide. Soumise. Je tiens maintenant deux des Cinq Pierres."
      },
      {
        id:"m30",num:30,name:"Le Choix de Tarine",
        desc:"L'ultime décision pour Abidjan.",
        brief:"Grob, le dernier Émissaire, apparaît dans le bureau dévasté. Sgrün propose un marché : donne-nous le Feu, et on laisse l'Afrique tranquille.",
        allies_requis:[],allies_dispo:["KAREN","LUNDGREN"],
        ennemis:["DARK"],ennemis_extra:8,
        xp:1000,
        narr_avant:[
          "Grob marche sur le verre brisé.",
          "— Un échange raisonnable, Keïta. Sgrün te laisse Abidjan. On prend juste le Feu.",
          "Lundgren lève son épée. — Ne l'écoute pas, Tarine.",
          "Tarine regarde les deux pierres dans sa main."
        ],
        narr_victoire:[
          "Tarine lève les yeux vers l'Émissaire.",
          "— Dis à Sgrün que je viens chercher les trois autres.",
          "Grob perd son sourire parfait.",
          "Tarine libère la puissance combinée du Feu et de l'Équilibre. L'Émissaire est oblitéré."
        ],
        narr_defaite:[
          "Grob manipule l'esprit de Tarine, exploitant sa fatigue extrême.",
          "La Pierre du Feu lui échappe des mains.",
          "L'Émissaire disparaît avec elle. Une victoire au goût très amer."
        ],
        journal_victoire:"C'est fini. Pour l'instant. Abidjan respire sous un ciel clair. Sylla est en prison. Ma mère dort enfin paisiblement à Marcory. J'ai deux pierres. Sgrün en a peut-être une autre. L'Empereur a dit de ne pas laisser le Feu prendre la tête. Maintenant, c'est moi qui mène. S'il faut traverser tous les Royaumes pour trouver les autres pierres, c'est ce que je ferai."
      }
    ]
  }
   // ===== SAISON 2 : LA QUÊTE DES PIERRES =====
  ,
  {
    id:"acte11",label:"ACTE XI",titre:"LE POIDS DE LA TERRE",
    narration_debut:[
      "Deux pierres sur cinq. Le compte à rebours est lancé.",
      "Lundgren pointe une carte sur la table de la cuisine à Marcory.",
      "— Les Gorges de Bandiagara, au Mali. Le pays Dogon.",
      "— C'est là qu'est la Pierre de la Terre ? demande Fulgence.",
      "— C'est là qu'elle dort, corrige Sam. Et Sgrün a déjà commencé à creuser."
    ],
    missions:[
      {
        id:"m31",num:31,name:"La Faille Rouge",
        desc:"Infiltrer le site de fouille de Sgrün.",
        brief:"Les falaises de Bandiagara. Sgrün utilise des Construits miniers pour éventrer la roche sacrée. Il faut les arrêter avant qu'ils ne trouvent l'entrée.",
        allies_requis:["LUNDGREN"],allies_dispo:["BABA","FULGENCE"],
        ennemis:["DARK"],ennemis_extra:4,
        xp:750,
        narr_avant:[
          "La poussière rouge s'élève dans l'air sec.",
          "Des machines qui ne font aucun bruit de moteur dévorent la falaise.",
          "— Ils ne cherchent pas la porte, dit Lundgren. Ils essaient de casser le mur.",
          "Tarine sent la Pierre de l'Équilibre vibrer. La roche a mal."
        ],
        narr_victoire:[
          "Les Construits tombent en poussière.",
          "Le silence revient dans les gorges.",
          "Baba Tunde donne un coup de pied dans une carcasse métallique.",
          "— Même leur métal n'a pas de sang. C'est ennuyeux."
        ],
        narr_defaite:[
          "Les foreuses continuent. Le sol tremble.",
          "La falaise menace de s'effondrer sur eux.",
          "— Repli ! crie Sam. La pierre cède !"
        ],
        journal_victoire:"Sgrün n'a aucun respect pour le temps. Là où l'Équilibre demande de la patience, lui utilise la force brute pour effacer l'histoire. La falaise est sauvée, mais l'entrée du sanctuaire est exposée. Nous descendons."
      },
      {
        id:"m32",num:32,name:"Le Puits des Anciens",
        desc:"Descendre dans les ténèbres.",
        brief:"Un réseau de grottes plonge vers le centre de la terre. La gravité devient oppressante. Quelque chose garde le passage.",
        allies_requis:["BABA"],allies_dispo:["LUNDGREN"],
        ennemis:["DARK","BABA"],ennemis_extra:5,
        xp:800,
        narr_avant:[
          "Plus ils descendent, plus l'air est lourd.",
          "Ce n'est pas un manque d'oxygène. C'est le poids de la terre elle-même.",
          "Des ombres d'argile se détachent des parois.",
          "— Les gardiens d'origine, dit Sam. Ils ne feront pas la différence entre nous et Sgrün."
        ],
        narr_victoire:[
          "Les ombres d'argile se figent, redevenant de simples statues.",
          "Tarine respire fort. Chaque pas pèse cent kilos.",
          "— Tu portes l'Équilibre, dit Lundgren. Dis à la terre que tu as le droit d'être ici.",
          "Tarine ferme les yeux. La pression diminue."
        ],
        narr_defaite:[
          "La gravité est trop forte.",
          "Tarine est plaqué au sol, incapable de lever le bras.",
          "La terre refuse de le laisser passer."
        ],
        journal_victoire:"L'Équilibre n'est pas qu'une arme, c'est un laissez-passer. J'ai dû convaincre la montagne que je n'étais pas là pour la piller. Baba a eu du mal à respirer, mais il n'a pas reculé. Il y a un cœur qui bat, tout en bas."
      },
      {
        id:"m33",num:33,name:"Krag, l'Émissaire",
        desc:"Affronter la masse.",
        brief:"Krag. Un Émissaire de Sgrün conçu spécifiquement pour résister à la pression des profondeurs. Il a trouvé la porte de la Pierre.",
        allies_requis:["SAM","BABA"],allies_dispo:[],
        ennemis:["DARK","BABA"],ennemis_extra:6,
        xp:900,
        narr_avant:[
          "La caverne centrale est éclairée par des cristaux verts.",
          "Krag est là. Il n'a pas de visage, juste une plaque d'obsidienne.",
          "— Sgrün veut l'inertie, dit Krag. Une voix qui sonne comme un éboulement.",
          "— Sgrün ne l'aura pas, répond Tarine."
        ],
        narr_victoire:[
          "Krag encaisse des coups qui auraient pulvérisé un tank.",
          "Mais l'Équilibre trouve toujours la faille.",
          "Tarine utilise le propre poids de l'Émissaire contre lui.",
          "Krag s'effondre, se fissurant en deux. Une statue brisée."
        ],
        narr_defaite:[
          "Krag est invincible.",
          "Chaque coup rebondit sur lui. La caverne tremble sous ses poings.",
          "Ils sont repoussés vers la surface, vaincus par la masse pure."
        ],
        journal_victoire:"Krag était fait de la même matière que la base du Pôle Nord. Sgrün s'adapte. Il construit des monstres sur mesure. Mais la masse sans intelligence a une faiblesse : elle ne sait pas changer de direction. Krag est mort. La porte du sanctuaire s'ouvre."
      },
      {
        id:"m34",num:34,name:"L'Épreuve de l'Immobilité",
        desc:"Prouver sa valeur à la Pierre.",
        brief:"La Pierre de la Terre exige une chose : ne pas bouger face à l'inévitable. Une épreuve mentale et physique absolue.",
        allies_requis:[],allies_dispo:["LUNDGREN","SAM"],
        ennemis:["DARK"],ennemis_extra:7,
        xp:1000,
        narr_avant:[
          "Le piédestal est au centre de la salle.",
          "Dès que Tarine s'approche, le plafond entier commence à s'effondrer.",
          "— Bouge ! hurle Baba.",
          "— Non, dit Sam. C'est l'épreuve."
        ],
        narr_victoire:[
          "Le plafond s'écrase sur Tarine.",
          "Mais il lève la main, tenant l'Équilibre.",
          "Des milliers de tonnes de roche s'arrêtent à un millimètre de sa tête.",
          "La Pierre de la Terre, verte et brute, glisse dans sa main libre."
        ],
        narr_defaite:[
          "L'instinct de survie l'emporte.",
          "Tarine plonge sur le côté pour éviter la roche.",
          "La Pierre de la Terre disparaît dans le sol. Refus."
        ],
        journal_victoire:"Trois pierres. Équilibre. Feu. Terre. La puissance que je ressens maintenant est terrifiante. J'aurais pu pulvériser Krag d'un seul regard si je l'avais eue plus tôt. Mon père avait raison de s'enfuir avec les secrets. Si un homme normal possède ça, il cesse d'être humain."
      },
      {
        id:"m35",num:35,name:"L'Ascension",
        desc:"S'échapper avant l'effondrement.",
        brief:"La montagne se referme. Sgrün, furieux d'avoir perdu, a ordonné la destruction du site depuis l'orbite ou le Born Land.",
        allies_requis:["BABA","FULGENCE","LUNDGREN","SAM"],allies_dispo:[],
        ennemis:["DARK","BABA"],ennemis_extra:8,
        xp:1200,
        narr_avant:[
          "La roche pleure de la poussière.",
          "— Sgrün efface la zone, dit Sam calmement. Le protocole d'annihilation.",
          "— On remonte, ordonne Tarine.",
          "Pour la première fois, ce n'est pas une suggestion. C'est un ordre de chef."
        ],
        narr_victoire:[
          "Ils jaillissent du puits juste au moment où la gorge implose.",
          "Tarine utilise la Pierre de la Terre pour solidifier l'air sous leurs pieds.",
          "Ils atterrissent dans le désert, couverts de poussière.",
          "Le soleil se lève sur le Mali."
        ],
        narr_defaite:[
          "La vitesse de l'effondrement est trop grande.",
          "L'obscurité les engloutit.",
          "Le poids du monde se referme sur eux."
        ],
        journal_victoire:"J'ai donné un ordre et ils ont obéi. Même Lundgren, même Sam. Ce n'est plus un entraînement. Je ne suis plus le jeune bricoleur de Marcory qui se défendait dans la cour de l'atelier. Je suis le gardien de trois pierres. La prochaine étape est sous l'eau."
      }
    ]
  },
  {
    id:"acte12",label:"ACTE XII",titre:"LE MURMURE DE L'EAU",
    narration_debut:[
      "Le Golfe de Guinée. Au large de São Tomé-et-Príncipe.",
      "Un bateau de pêche tangue sur l'océan noir.",
      "Tarine regarde l'eau. Elle n'a pas de fond visible.",
      "— La Pierre de l'Eau est la plus traître, dit Lundgren.",
      "— Pourquoi ? demande Fulgence, malade à cause du mal de mer.",
      "— Parce qu'elle se nourrit de vos regrets."
    ],
    missions:[
      {
        id:"m36",num:36,name:"La Fosse Noire",
        desc:"Plonger dans l'anomalie.",
        brief:"L'océan s'ouvre. Une bulle d'Essence permet de respirer sous l'eau, mais les gardiens marins de Sgrün patrouillent.",
        allies_requis:["SAM"],allies_dispo:["LUNDGREN"],
        ennemis:["DARK"],ennemis_extra:5,
        xp:800,
        narr_avant:[
          "Tarine plonge. La bulle générée par Sam repousse la pression.",
          "À trois mille mètres de fond, il n'y a pas de lumière.",
          "Seulement les yeux jaunes des drones aquatiques de Sgrün.",
          "— Ils ressemblent à des requins de métal, murmure Tarine."
        ],
        narr_victoire:[
          "L'Équilibre et le Feu font bouillir l'eau autour des drones.",
          "Les machines fondent et coulent dans les abysses.",
          "— Le sanctuaire est juste en dessous, indique Sam.",
          "Une faible lueur bleue pulse dans les ténèbres."
        ],
        narr_defaite:[
          "L'eau est trop froide. La bulle de Sam vacille.",
          "Les drones percent leurs défenses.",
          "Tarine est forcé de remonter d'urgence avant l'asphyxie."
        ],
        journal_victoire:"Le feu fonctionne même sous l'eau quand il est pur. Sgrün utilise des machines pour tout, mais les machines ne comprennent pas la magie, elles ne font que la calculer. Je commence à voir les limites de son intelligence artificielle dimensionnelle."
      },
      {
        id:"m37",num:37,name:"Les Noyés de la Mémoire",
        desc:"Affronter les illusions du passé.",
        brief:"Le sanctuaire de l'Eau utilise vos propres souvenirs comme armes. Des visages familiers apparaissent pour vous arrêter.",
        allies_requis:["FULGENCE"],allies_dispo:["BABA"],
        ennemis:["BABA","DARK"],ennemis_extra:6,
        xp:900,
        narr_avant:[
          "Le temple est fait de corail et d'épaves.",
          "Une silhouette avance vers Tarine. C'est Baba Tunde, plus jeune, tel qu'il était avant tout ça.",
          "Puis Karen. Puis le Général Keïta.",
          "— Ce ne sont pas eux, crie Fulgence. C'est l'eau qui lit ton esprit !"
        ],
        narr_victoire:[
          "Tarine refuse de combattre son père.",
          "Il utilise la Pierre de la Terre pour ancrer son esprit au présent.",
          "Les illusions se liquéfient, redevenant de l'eau de mer salée.",
          "La tristesse est là, mais elle ne le contrôle plus."
        ],
        narr_defaite:[
          "Le visage du Général est trop réel.",
          "Tarine hésite. Il baisse sa garde.",
          "L'eau s'engouffre dans ses poumons et dans son esprit. Il se noie dans ses regrets."
        ],
        journal_victoire:"La Pierre de l'Eau teste notre capacité à lâcher prise. J'ai revu mon père. Pas l'homme en bleu des notes de police, mais mon papa. J'ai failli abandonner juste pour rester avec cette illusion. Fulgence m'a sauvé la vie en me rappelant qui j'étais aujourd'hui."
      },
      {
        id:"m38",num:38,name:"Murk, l'Émissaire Abyssal",
        desc:"Combattre le maître des profondeurs.",
        brief:"Murk n'a pas de forme fixe. C'est un Émissaire liquide. Il peut se glisser partout et geler instantanément.",
        allies_requis:["LUNDGREN","SAM"],allies_dispo:[],
        ennemis:["DARK"],ennemis_extra:7,
        xp:1000,
        narr_avant:[
          "L'eau autour d'eux devient glaciale.",
          "Murk n'apparaît pas : il est l'eau elle-même.",
          "— Il va essayer de geler le sang dans vos veines, prévient Sam.",
          "Tarine fait appel à la Pierre du Feu. Le combat d'éléments primordiaux commence."
        ],
        narr_victoire:[
          "L'eau bout. La vapeur explose.",
          "Tarine enferme l'Émissaire dans une sphère de roche créée avec la Pierre de la Terre.",
          "Murk est scellé, incapable de s'écouler.",
          "— Tu maîtrises les synergies, constate Lundgren avec admiration."
        ],
        narr_defaite:[
          "Le froid est instantané.",
          "Les membres de Tarine se figent. Le gel attaque ses organes.",
          "Murk a gagné. L'océan réclame son dû."
        ],
        journal_victoire:"J'ai combiné la Terre et le Feu. L'Équilibre me permet de faire ça sans que les éléments ne s'annulent. Murk est emprisonné pour l'éternité dans une prison de roche au fond de l'océan. La quatrième pierre est juste derrière."
      },
      {
        id:"m39",num:39,name:"La Larme de l'Océan",
        desc:"Récupérer la Quatrième Pierre.",
        brief:"La Pierre de l'Eau flotte au-dessus d'un autel de nacre. Mais elle est piégée dans une stase temporelle de Sgrün.",
        allies_requis:[],allies_dispo:["FULGENCE"],
        ennemis:["DARK","BABA"],ennemis_extra:6,
        xp:1100,
        narr_avant:[
          "La Pierre est bleue, lumineuse, douce.",
          "Mais un cube de lumière rouge de Sgrün l'enserre.",
          "— Un cadenas dimensionnel, dit Sam. Si on force, la pierre se téléporte chez lui.",
          "— Alors on ne force pas. On dissout."
        ],
        narr_victoire:[
          "Tarine utilise l'Équilibre avec une précision chirurgicale.",
          "Fil après fil, il détricote le cube rouge de l'Émissaire suprême.",
          "La Pierre de l'Eau tombe dans sa paume.",
          "Un sentiment de paix absolue envahit son esprit."
        ],
        narr_defaite:[
          "Le cube rouge clignote plus vite.",
          "Tarine a fait une erreur de calcul. L'Équilibre vacille.",
          "La pierre disparaît dans un flash. Sgrün l'a prise."
        ],
        journal_victoire:"Quatre pierres. Eau, Terre, Feu, Équilibre. La voix de ma mère me manque. Je sens que je m'éloigne de l'humanité à chaque fois qu'une de ces reliques fusionne avec moi. L'eau m'a donné une clarté mentale terrifiante. Il n'en reste qu'une. L'Air."
      },
      {
        id:"m40",num:40,name:"L'Éruption",
        desc:"Remonter à la surface.",
        brief:"Sgrün déclenche un volcan sous-marin pour vous éliminer. La bulle de protection ne tiendra pas contre la lave.",
        allies_requis:["LUNDGREN","BABA","SAM"],allies_dispo:[],
        ennemis:["DARK"],ennemis_extra:8,
        xp:1200,
        narr_avant:[
          "Le fond de l'océan se déchire.",
          "La croûte terrestre crache du magma.",
          "— Sgrün est un mauvais perdant, lâche Baba.",
          "— L'Eau et le Feu, dit Tarine. On va surfer."
        ],
        narr_victoire:[
          "Tarine utilise la Pierre de l'Eau pour créer un courant ascendant massif.",
          "La bulle est propulsée vers la surface à une vitesse folle.",
          "Ils jaillissent hors de l'océan et retombent sur le pont du bateau de pêche.",
          "Sains et saufs."
        ],
        narr_defaite:[
          "Le magma heurte la bulle.",
          "L'eau devient une prison bouillante.",
          "Il n'y a pas d'échappatoire dans les abysses."
        ],
        journal_victoire:"Nous avons survécu à un volcan sous-marin en nous servant de la mer comme d'un canon. Je suis épuisé. Baba a ri à gorge déployée une fois sur le pont. Sam est resté silencieux. Il regarde le ciel. Il sait que la dernière pierre n'est pas sur Terre. Elle est déjà entre les mains de Sgrün."
      }
    ]
  },
  {
    id:"acte13",label:"ACTE XIII",titre:"LE SOUFFLE DU VIDE",
    narration_debut:[
      "Les Montagnes de l'Aïr, au Niger.",
      "Le vent souffle en continu, soulevant le sable du Sahara.",
      "Mais le sanctuaire de l'Air est déjà vide.",
      "— Il a pris la dernière pierre, constate Lundgren, amer.",
      "— Sgrün a l'Air. L'espace, le mouvement, le vide, dit Sam. Il peut ouvrir la Faille."
    ],
    missions:[
      {
        id:"m41",num:41,name:"La Tempête d'Éclats",
        desc:"Survivre au piège de l'Air.",
        brief:"Sgrün a laissé une surprise dans le sanctuaire vide : un ouragan d'air tranchant comme des lames de rasoir.",
        allies_requis:["BABA"],allies_dispo:["FULGENCE"],
        ennemis:["DARK"],ennemis_extra:6,
        xp:900,
        narr_avant:[
          "Le vent change de ton.",
          "Il ne siffle plus, il hurle.",
          "Les rochers sont coupés net. Des lames invisibles.",
          "— Baissez-vous ! crie Baba en tirant Fulgence à terre."
        ],
        narr_victoire:[
          "Tarine dresse un dôme de Terre et d'Eau.",
          "Les lames de vent s'écrasent et rebondissent.",
          "Il avance pas à pas, jusqu'au centre du sanctuaire.",
          "Il détruit la balise de Sgrün qui générait la tempête."
        ],
        narr_defaite:[
          "Les lames de vent sont trop rapides.",
          "Le dôme de Tarine est taillé en pièces.",
          "La montagne devient un abattoir invisible."
        ],
        journal_victoire:"Il ne reste rien de la Pierre de l'Air. Sgrün savait qu'on viendrait ici. Il a laissé cette tempête pour nous ralentir pendant qu'il prépare la Convergence. L'Air, c'est le lien. S'il l'utilise avec sa technologie, il peut réécrire les règles de notre monde à distance."
      },
      {
        id:"m42",num:42,name:"Vael, la Lame Invisible",
        desc:"Le gardien de Sgrün.",
        brief:"Vael, l'Émissaire de l'Air. Il est resté pour s'assurer que vous ne suiviez pas Sgrün. Il est plus rapide que le son.",
        allies_requis:["LUNDGREN","SAM"],allies_dispo:[],
        ennemis:["DARK","BABA"],ennemis_extra:7,
        xp:1000,
        narr_avant:[
          "Une silhouette se dessine dans la poussière.",
          "Fine, presque transparente.",
          "— Quatre pierres contre moi. C'est presque injuste, dit Vael.",
          "— Alors rends-toi, répond Tarine.",
          "— Je parlais pour vous."
        ],
        narr_victoire:[
          "Vael bouge si vite qu'il est impossible à cibler.",
          "Mais Tarine ne le cible pas. Il enflamme tout l'air autour de lui.",
          "Le Feu aspire l'oxygène. Vael étouffe et perd sa vitesse.",
          "Lundgren l'achève avec son épée, un geste net vieux de sept siècles."
        ],
        narr_defaite:[
          "Trop rapide.",
          "Tarine sent des entailles s'ouvrir sur son corps sans voir l'arme.",
          "Vael les découpe méthodiquement, un jeu d'enfant."
        ],
        journal_victoire:"Lundgren a tué Vael. Il y avait de la tristesse dans son geste. Il m'a expliqué plus tard que Vael n'était pas une machine, mais un ancien héros corrompu par Sgrün. Un avertissement sur ce qui arrive à ceux qui perdent face à lui. Je ne perdrai pas."
      },
      {
        id:"m43",num:43,name:"La Trace de Sgrün",
        desc:"Pister la Faille.",
        brief:"Vael portait un compas dimensionnel. Sam doit le pirater pour ouvrir un chemin vers le QG de Sgrün.",
        allies_requis:["SAM"],allies_dispo:["FULGENCE"],
        ennemis:["DARK"],ennemis_extra:5,
        xp:1100,
        narr_avant:[
          "Sam tient l'appareil brisé de Vael.",
          "— Ce n'est pas de la magie. C'est des mathématiques pures.",
          "Des ombres sortent des rochers. Les renforts automatiques.",
          "— Protégez Sam. Laissez-lui le temps d'ouvrir la porte."
        ],
        narr_victoire:[
          "Les ombres sont repoussées.",
          "Le compas émet un clic.",
          "Une déchirure verticale apparaît dans l'air. Pas une porte fluide comme celle de Sam.",
          "Une plaie ouverte dans la réalité, aux bords rouges et agressifs."
        ],
        narr_defaite:[
          "Les ombres submergent Sam.",
          "Le compas est détruit dans la mêlée.",
          "Sans ce chemin, Sgrün est intouchable."
        ],
        journal_victoire:"La déchirure dans l'air sent le métal brûlé et l'ozone. C'est l'entrée vers le domaine de Sgrün. L'Autel de l'Ordre, comme il l'appelle. Sam dit que le temps ne s'y écoule pas de la même façon. On pourrait y passer un jour, et dix ans se seraient écoulés à Abidjan. J'ai appelé Karen. Juste pour entendre sa voix."
      },
      {
        id:"m44",num:44,name:"Le Passage du Vide",
        desc:"Traverser sans se perdre.",
        brief:"Entre notre monde et celui de Sgrün, il y a le Vide. Un espace où vos pierres pèsent des tonnes et où l'air manque.",
        allies_requis:["LUNDGREN","BABA"],allies_dispo:["FULGENCE"],
        ennemis:["DARK","BABA"],ennemis_extra:7,
        xp:1300,
        narr_avant:[
          "Ils franchissent la déchirure.",
          "Aucun son. La lumière est absente. Le sol n'existe pas.",
          "— Restez groupés ! crie Tarine dans sa tête, la télépathie s'imposant.",
          "Des créatures parasites flottent autour d'eux, attirées par les Pierres."
        ],
        narr_victoire:[
          "L'Équilibre crée un tunnel stable.",
          "Ils marchent sur un sol de pure volonté.",
          "Les parasites sont brûlés par le Feu.",
          "Au bout du tunnel, une forteresse métallique immense flotte dans le néant."
        ],
        narr_defaite:[
          "Le Vide est trop vaste.",
          "Le tunnel d'Équilibre s'effondre.",
          "L'équipe est séparée, dérivant pour toujours dans le néant absolu."
        ],
        journal_victoire:"Nous sommes arrivés. La Forteresse de Sgrün. C'est pire que ce que j'imaginais. C'est une horloge géante, froide, parfaite. Il veut que l'univers ressemble à ça. Plus de guerre, plus de douleur, mais plus de choix non plus. Plus de liberté. Il veut transformer l'humanité en Construits."
      },
      {
        id:"m45",num:45,name:"La Porte du Maître",
        desc:"Forcer l'entrée de l'Autel.",
        brief:"La porte principale de la forteresse est scellée par la Pierre de l'Air. Il faut forcer l'entrée en utilisant les quatre autres pierres.",
        allies_requis:["LUNDGREN","SAM","BABA","FULGENCE"],allies_dispo:[],
        ennemis:["DARK"],ennemis_extra:10,
        xp:1500,
        narr_avant:[
          "Un sas blindé gigantesque.",
          "Il est protégé par une barrière de vent cyclonique impénétrable.",
          "L'armée personnelle de Sgrün, la Légion Parfaite, les attend sur le parvis.",
          "— On y va tous, dit Tarine. On ne retient rien."
        ],
        narr_victoire:[
          "La Légion Parfaite est balayée par un tsunami d'Eau et de Feu.",
          "Tarine concentre la Terre pour fracasser la barrière de vent.",
          "Le sas géant s'ouvre avec un gémissement métallique.",
          "L'intérieur est aveuglant de lumière blanche."
        ],
        narr_defaite:[
          "La barrière de l'Air est parfaite.",
          "La Légion Parfaite avance au même rythme, implacable.",
          "Le parvis de la forteresse devient leur tombeau."
        ],
        journal_victoire:"Nous sommes à l'intérieur. Sgrün sait qu'on est là. Mais l'ironie, c'est qu'il ne peut pas nous tuer instantanément. Il veut les pierres intactes, et s'il me détruit brutalement, l'Équilibre pourrait se dissiper et se réincarner dans cent ans. Il est obligé de nous affronter face à face. On a nos chances."
      }
    ]
  },
  {
    id:"acte14",label:"ACTE XIV",titre:"LA CONVERGENCE",
    narration_debut:[
      "Le cœur de l'Autel de l'Ordre.",
      "Des couloirs blancs à l'infini. Aucune ombre.",
      "Sgrün n'est pas un homme. C'est une conscience téléchargée dans un avatar parfait.",
      "Mais avant d'atteindre le trône, quelqu'un les attend dans l'Anti-chambre.",
      "Quelqu'un que Tarine pensait avoir enterré."
    ],
    missions:[
      {
        id:"m46",num:46,name:"Le Fantôme de l'Essence",
        desc:"Combattre le protecteur personnel de Sgrün.",
        brief:"Un homme en uniforme se tient devant la salle du trône. Ses yeux brillent du bleu de Sgrün, mais son visage... C'est le Général Keïta.",
        allies_requis:[],allies_dispo:["LUNDGREN","BABA","FULGENCE","SAM"],
        ennemis:["DARK"],ennemis_extra:5,
        xp:1200,
        narr_avant:[
          "Tarine s'arrête net.",
          "— Papa ?",
          "L'homme lève une arme familière. L'arme de service.",
          "— Ce n'est pas ton père, dit Sam, livide. C'est un écho de son esprit que Sgrün a capturé à sa mort."
        ],
        narr_victoire:[
          "Tarine désarme le Général sans le blesser gravement.",
          "L'Équilibre chasse la lueur bleue de Sgrün de ses yeux.",
          "Le Général tombe à genoux, clignant des yeux.",
          "— Tarine... Tu es devenu grand."
        ],
        narr_defaite:[
          "L'hésitation de Tarine lui coûte le combat.",
          "L'écho du Général est impitoyable. Il tire pour tuer.",
          "L'ironie d'être abattu par le fantôme de son propre père est totale."
        ],
        journal_victoire:"C'était lui. Une partie de lui. Sgrün a volé son âme à sa mort pour en faire son garde du corps ultime, sachant que je ne pourrais pas le tuer. J'ai utilisé l'Équilibre pour libérer son esprit. Papa m'a regardé. Il m'a souri. 'Ne laisse pas l'ordre étouffer le monde', a-t-il dit. Puis il a disparu en poussière de lumière."
      },
      {
        id:"m47",num:47,name:"La Salle des Engrenages",
        desc:"Détruire la source d'énergie.",
        brief:"Avant d'affronter Sgrün, il faut désactiver l'Horloge, la machine qui lui permet de réécrire le temps et l'espace.",
        allies_requis:["FULGENCE","SAM"],allies_dispo:["BABA","LUNDGREN"],
        ennemis:["DARK","BABA"],ennemis_extra:8,
        xp:1300,
        narr_avant:[
          "Une salle remplie de mécanismes flottants.",
          "Des milliers d'engrenages de la taille d'une maison.",
          "— Si l'Horloge tourne, il peut annuler nos attaques, dit Sam.",
          "— Alors on la casse, tranche Fulgence."
        ],
        narr_victoire:[
          "La Terre et le Feu fondent les engrenages principaux.",
          "L'Horloge s'arrête avec un hurlement atroce.",
          "La perfection mathématique de Sgrün est brisée.",
          "— C'est l'heure, dit Tarine. Plus de retours en arrière."
        ],
        narr_defaite:[
          "L'Horloge accélère.",
          "L'équipe est prise dans une boucle temporelle, revivant les mêmes minutes en boucle.",
          "Sgrün les a piégés dans l'éternité."
        ],
        journal_victoire:"Fulgence a été incroyable. Il a calculé les trajectoires des engrenages pour que je puisse tous les détruire d'un seul coup. La magie n'est rien sans l'intelligence. Sgrün est maintenant vulnérable. Il est enfermé dans le présent avec nous. C'est l'heure du combat final."
      },
      {
        id:"m48",num:48,name:"L'Avant-Garde Parfaite",
        desc:"Les derniers défenseurs.",
        brief:"Les Prétoriens de Sgrün, trois Émissaires d'élite, bloquent la porte finale. C'est un combat de force pure.",
        allies_requis:["LUNDGREN","BABA"],allies_dispo:["SAM","FULGENCE"],
        ennemis:["DARK","BABA"],ennemis_extra:9,
        xp:1500,
        narr_avant:[
          "Trois statues dorées s'animent.",
          "— Je prends le gros, crie Baba Tunde.",
          "— Je prends celui avec l'épée, dit Lundgren, souriant presque.",
          "— On prend le reste, ajoute Tarine. Pour Abidjan."
        ],
        narr_victoire:[
          "Baba Tunde écrase la tête de son adversaire avec un rire sauvage.",
          "Lundgren décapite le sien d'un geste élégant.",
          "Tarine réduit le dernier en cendres.",
          "La grande porte s'ouvre d'elle-même."
        ],
        narr_defaite:[
          "Les Prétoriens sont trop coordonnés.",
          "Baba tombe le premier. Puis Lundgren.",
          "Tarine est submergé. La porte reste close."
        ],
        journal_victoire:"Baba et Lundgren. Le voyou de Marcory et le guerrier de sept siècles. Ils ont combattu côte à côte avec une synchronisation parfaite. Je suis fier de mes frères d'armes. La porte s'est ouverte. La salle du trône est là. Sgrün nous attend."
      },
      {
        id:"m49",num:49,name:"L'Architecte",
        desc:"Sgrün et la Pierre de l'Air.",
        brief:"Sgrün lévite. Il contrôle l'Air. Il veut vos quatre pierres. Il n'attaquera pas : il va essayer d'aspirer votre énergie.",
        allies_requis:["SAM","LUNDGREN","BABA","FULGENCE"],allies_dispo:[],
        ennemis:["DARK","BABA"],ennemis_extra:10,
        xp:2000,
        narr_avant:[
          "Sgrün est aveuglant. Une entité d'énergie pure en costume croisé.",
          "— Rendez-les moi, Tarine. Le chaos de l'humanité me fatigue.",
          "— Le chaos, c'est la vie, répond Tarine.",
          "Sgrün soupire. Et le vide se fait dans la pièce."
        ],
        narr_victoire:[
          "Tarine utilise la Terre pour s'ancrer, le Feu pour attaquer, l'Eau pour se soigner, et l'Équilibre pour contrer l'Air.",
          "Sgrün est acculé.",
          "La Pierre de l'Air se détache de son torse.",
          "Sgrün s'effondre, son corps d'énergie se dissipant."
        ],
        narr_defaite:[
          "Sgrün crée un vide parfait.",
          "Les poumons de l'équipe explosent. La magie est aspirée.",
          "L'ordre absolu gagne."
        ],
        journal_victoire:"J'ai la Pierre de l'Air. J'ai les Cinq Pierres. Kankou Moussa les avait séparées pour une bonne raison : la puissance est insoutenable. Mon corps brûle, gèle, se solidifie et s'envole en même temps. Sgrün est à terre, mais il rit. 'Tu crois que c'est fini ?', crache-t-il."
      },
      {
        id:"m50",num:50,name:"Le Choix de l'Éveillé",
        desc:"Maîtriser l'Omnipotence.",
        brief:"Avec les Cinq Pierres réunies, la réalité s'effondre. Vous avez le pouvoir de tout réécrire. Sgrün veut que vous fassiez la même erreur que lui.",
        allies_requis:[],allies_dispo:["LUNDGREN","SAM","BABA","FULGENCE","KAREN"],
        ennemis:["DARK"],ennemis_extra:12,
        xp:3000,
        narr_avant:[
          "L'univers clignote.",
          "Tarine flotte. Il voit Abidjan. Il voit le passé. Il voit la mort de son père annulable d'une simple pensée.",
          "— Fais-le ! crie Sgrün. Sois un Dieu !",
          "Lundgren le regarde. — Tarine, rappelle-toi l'eau. Ne résiste pas au deuil. Accepte-le."
        ],
        narr_victoire:[
          "Tarine ferme les yeux.",
          "Il ne réécrit rien. Il refuse d'être un Dieu.",
          "Il utilise les Cinq Pierres pour sceller définitivement la Faille.",
          "Sgrün hurle alors que son existence est effacée, non pas par la force, mais par le refus de son pouvoir.",
          "Tarine relâche les pierres. Elles s'éparpillent dans les étoiles."
        ],
        narr_defaite:[
          "Tarine cède à la tentation. Il réécrit la mort de son père.",
          "L'univers se brise. Les paradoxes dévorent la réalité.",
          "Il est devenu exactement ce qu'il combattait."
        ],
        journal_victoire:"C'est fini. J'ai laissé partir les Pierres. Elles trouveront de nouveaux porteurs dans cent ans, ou dans mille ans. Lundgren a souri, il a dit que c'était sa dernière bataille et qu'il pouvait enfin se reposer. Baba Tunde est retourné à la Villoise en légende. Fulgence veut étudier l'Essence. Sam a disparu. Et moi ? Je suis rentré à Marcory. Ma mère préparait le café dans la cuisine jaune pâle. Je viens de sauver le monde."
      }
    ]
  }
];

// ─────────────────────────────────────────────────────────────
// FUSION DES MISSIONS AJOUTÉES
// Chaque mission de campaign-extra.js indique son acte et la position
// qu'elle doit occuper dans l'acte une fois tout inséré. On insère donc
// du début vers la fin : chaque insertion décale ce qui suit, ce qui est
// exactement ce qu'attendent les positions suivantes.
// ─────────────────────────────────────────────────────────────
for(const acte of CAMPAIGN){
  const ajouts = EXTRA.filter(m => m.acte === acte.id).sort((a, b) => a.at - b.at);
  for(const m of ajouts){
    const { acte: _a, at, ...mission } = m;
    acte.missions.splice(Math.min(at, acte.missions.length), 0, mission);
  }
}

// Les ennemis nommés dans le récit affrontent enfin le bon champion :
// avant l'ajout de leurs fiches, toutes ces missions retombaient sur
// Baba et Dark, quel que soit le texte à l'écran.
const CASTING = {
  m11: ['SYLLA', 'SUB'],        // La Villa de Sylla
  m12: ['SUB'],                 // L'Émissaire de Treichville
  m14: ['SUB', 'GROB'],         // Sub & Grob
  m16: ['SUB'], m17: ['GROB', 'SUB'], m18: ['GROB'],   // base du Pôle Nord
  m22: ['SCHISSIN'],            // Le Fichier Rouge
  m23: ['OUSMANE', 'SCHISSIN'], // Le Traître de la Garde
  m24: ['SCHISSIN', 'SYLLA'],   // La Tombe Vide
  m25: ['OUSMANE', 'SCHISSIN'], // Le Pont HKB
  m26: ['GROB'], m27: ['SYLLA', 'SCHISSIN'],
  m28: ['SCHISSIN', 'SUB'], m29: ['SYLLA'], m30: ['SYLLA'],
  m31: ['SUB'], m32: ['GROB'], m33: ['KRAG'], m34: ['KRAG'], m35: ['KRAG', 'GROB'],
  m36: ['MURK'], m37: ['MURK', 'SUB'], m38: ['MURK'], m39: ['MURK', 'KRAG'], m40: ['MURK'],
  m41: ['VAEL'], m42: ['VAEL'], m43: ['VAEL', 'SUB'], m44: ['VAEL', 'MURK'], m45: ['VAEL', 'KRAG'],
  m46: ['SGRUN'], m47: ['KRAG', 'GROB'], m48: ['VAEL', 'SUB', 'GROB'], m49: ['SGRUN'], m50: ['SGRUN'],
};
for(const acte of CAMPAIGN){
  for(const m of acte.missions){
    if(CASTING[m.id]) m.ennemis = CASTING[m.id];
  }
}

// Renumérotation continue : la mission 1 est la première de l'acte I,
// la 100 la dernière de l'acte XIV.
let _n = 0;
for(const acte of CAMPAIGN) for(const m of acte.missions) m.num = ++_n;

/** Nombre total de missions de campagne (100). */
export const MISSION_COUNT = _n;
