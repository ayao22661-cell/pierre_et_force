// ============================================================
// CAST — le casting complet du récit : un portrait par personnage
// (allié, ennemi ou figure légendaire), avec bio et rôle. Sert au
// Codex du hub et aux portraits affichés en jeu. Récupéré intégralement
// depuis le moteur v3 — 19 personnages, alliés comme ennemis.
// ============================================================

export const CAST = {
  // ---- Le cercle de Tarine ----
  TARINE:{name:"Tarine Keïta",titre:"L'Éveillé de Marcory",role:"DUELLISTE",camp:"allie",
    bio:"Surnommé « le Bricoleur » à l'atelier de la Villoise. La pierre tiède envoyée par son père s'est réveillée dans ses paumes.",
    o:{skin:"#8d5524",cloth:"#1c4e3a",accent:"#39FF7A",hair:"#141018",eye:"#c8f5b0",hairStyle:0,mark:2,beard:0,smile:true,prop:"stone"}},
  KAREN:{name:"Karen Keïta",titre:"La Sentinelle",role:"SOUTIEN",camp:"allie",
    bio:"Elle veille sur Tarine avant même de comprendre ce qu'il devient. Sa force est de tenir debout quand les autres reculent.",
    o:{skin:"#a86b3c",cloth:"#132f52",accent:"#378ADD",hair:"#1a1a24",eye:"#9fd8ff",hairStyle:5,mark:3,beard:0,smile:true}},
  FULGENCE:{name:"Fulgence",titre:"Le Roc de Marcory",role:"TANK",camp:"allie",
    bio:"On ne le contourne pas, on ne le déplace pas. Il s'interpose, et c'est tout ce qu'il a jamais eu à faire.",
    o:{skin:"#6b4226",cloth:"#2a2a4e",accent:"#7F77DD",hair:"#141018",eye:"#e6c98a",hairStyle:6,mark:0,beard:3,smile:false}},
  BABA_TUNDE:{name:"Baba Tunde",titre:"Seigneur de la Cour",role:"ASSASSIN",camp:"allie",
    bio:"La star auto-proclamée du quartier. Battu dans la cour, il revient en allié — le genre d'ami qu'on préfère devant soi.",
    o:{skin:"#7a4a2b",cloth:"#4e1c2c",accent:"#D85A30",hair:"#2b1a10",eye:"#ffd76b",hairStyle:2,mark:1,beard:2,smile:true}},
  LUNDGREN:{name:"Lundgren",titre:"Le Cartographe",role:"ERUDIT",camp:"allie",
    bio:"Il sait où sont les choses : les ruines, la Chambre des Poids, les emplacements que sept siècles avaient effacés.",
    o:{skin:"#c68642",cloth:"#123a3a",accent:"#B5D4F4",hair:"#4a2c17",eye:"#9fd8ff",hairStyle:7,mark:4,beard:1,eyewear:1,smile:false}},
  SAM:{name:"Sam Grün",titre:"Le Passeur",role:"MAGE",camp:"allie",
    bio:"Assis sur les marches, il attendait. C'est lui qui mène Tarine au Royaume de l'Essence pour lui montrer ce qu'il est vraiment.",
    o:{skin:"#5c3317",cloth:"#1b3550",accent:"#16c8bd",hair:"#1a1a24",eye:"#16c8bd",hairStyle:3,mark:4,beard:2,smile:false,prop:"scarf"}},
  YOURI:{name:"Youri",titre:"L'Observateur",role:"SOUTIEN",camp:"allie",
    bio:"Grand, calme, cette façon d'observer qu'ont les gens qui attendent depuis longtemps. Il surveille quelqu'un depuis des mois.",
    o:{skin:"#b07340",cloth:"#2a2a4e",accent:"#9fd8ff",hair:"#3d2b1f",eye:"#9fd8ff",hairStyle:6,mark:0,beard:1,eyewear:2,smile:false}},
  SAMIA:{name:"Samia Koné",titre:"Le Carnet Rouge",role:"TEMOIN",camp:"allie",
    bio:"Elle documente les incidents depuis des mois dans un carnet rouge bordeaux. C'est pour ça qu'il faut la protéger.",
    o:{skin:"#a86b3c",cloth:"#4e1c2c",accent:"#e0455c",hair:"#141018",eye:"#ffd76b",hairStyle:5,mark:3,beard:0,smile:true,prop:"notebook"}},
  KEITA:{name:"Général Keïta",titre:"Le Père",role:"EMPEREUR",camp:"allie",
    bio:"Il a découvert la Pierre de l'Équilibre en 1983 et n'a jamais oublié un anniversaire. Son carnet contient un nom de code.",
    o:{skin:"#7a4a2b",cloth:"#1c3a5e",accent:"#c9a86a",hair:"#c8c0b0",eye:"#e6c98a",hairStyle:6,mark:0,beard:1,smile:false,prop:"epaulet"}},
  KANKOU:{name:"Kankou Moussa",titre:"L'Empereur",role:"EMPEREUR",camp:"neutre",
    bio:"Au sommet de sa puissance il possédait cinq pierres héritées de l'aube des temps. Sous les ruines, il a pris sa décision.",
    o:{skin:"#6b4226",cloth:"#4a3410",accent:"#f0c860",hair:"#141018",eye:"#ffd76b",hairStyle:0,mark:4,beard:3,crown:true,smile:false,prop:"medal"},
    // Faits : chroniques d'al-Umari et d'Ibn Khaldoun, Atlas catalan.
    // Entrées `legende` : le récit de Pierre et Force.
    chrono:[
      {date:"Vers 1280", texte:"Naît dans la famille régnante du Mali, petit-neveu de Soundiata Keïta, le fondateur de l'empire."},
      {date:"Vers 1312", texte:"Devient mansa, empereur du Mali. L'empire s'étend de l'Atlantique jusqu'au-delà du fleuve Niger, et il tient les mines d'or du Bambouk et du Bouré."},
      {date:"1324", texte:"Part en pèlerinage à La Mecque avec une caravane de milliers de personnes et des tonnes d'or. Au Caire, il en donne tant que le cours de l'or s'effondre pour des années, raconte le chroniqueur al-Umari."},
      {date:"1325", texte:"Sur le chemin du retour, ses généraux rattachent Gao à l'empire. Il ramène avec lui des savants et l'architecte andalou Abu Ishaq al-Sahili."},
      {date:"Vers 1327", texte:"Fait bâtir la grande mosquée Djinguereber à Tombouctou. La ville devient l'un des grands centres du savoir du monde musulman."},
      {date:"Vers 1337", texte:"Meurt au sommet de sa puissance ; les sources hésitent sur la date exacte. Son fils Maghan lui succède."},
      {date:"1375", texte:"L'Atlas catalan le représente sur son trône, une pépite d'or à la main : l'Europe le tient pour l'homme le plus riche du monde."},
      {date:"Légende", legende:true, texte:"Il possédait cinq pierres héritées de l'aube des temps. Sous les ruines de Niani, dans la Chambre des Poids, il les a séparées : personne, pas même lui, ne tenait debout sous leur poids réuni."},
      {date:"Aujourd'hui", legende:true, texte:"Sept siècles plus tard, son écho met à l'épreuve le porteur de l'Équilibre. Tarine tient debout : l'Empereur marche désormais à ses côtés."},
    ]},
  // `chrono` : chronologie affichée dans sa fiche (onglet Héros). Les
  // faits sont ceux des sources (lettres des jésuites, chronique de
  // Nobunaga, journal de Matsudaira Ietada) ; l'entrée marquée
  // `legende` appartient au récit de Pierre et Force.
  YASUKE:{name:"Yasuke",titre:"Le Samouraï venu d'Afrique",role:"DUELLISTE",camp:"neutre",
    bio:"Arrivé au Japon en 1579 au service d'un jésuite, il devient en 1581 l'homme de confiance d'Oda Nobunaga, le seigneur qui unifiait le pays. Les historiens débattent encore du titre exact qu'il portait ; la légende, elle, a tranché.",
    o:{skin:"#4a2e1c",cloth:"#1e2f5e",accent:"#b3263a",hair:"#141018",eye:"#e6c98a",hairStyle:1,mark:0,beard:0,smile:false},
    chrono:[
      {date:"Vers 1555", texte:"Naît en Afrique de l'Est. Son origine exacte reste discutée : le Mozambique pour la plupart des récits, l'Éthiopie ou le Soudan du Sud pour d'autres."},
      {date:"1579", texte:"Débarque au Japon aux côtés d'Alessandro Valignano, le jésuite chargé d'inspecter les missions d'Asie."},
      {date:"23 mars 1581", texte:"À Kyoto, la foule se presse pour le voir. Oda Nobunaga le fait venir, doute que sa peau soit vraie et la fait frotter. Convaincu, il le prend à son service."},
      {date:"1581", texte:"Nobunaga lui donne le nom de Yasuke, une résidence et une solde. Une chronique ajoute un sabre court, et le montre portant les armes de son seigneur."},
      {date:"Mai 1582", texte:"Suit Nobunaga lors de la campagne contre le clan Takeda. Le journal de Matsudaira Ietada le décrit : six shaku deux bu, près d'un mètre quatre-vingt-dix, la peau noire comme l'encre."},
      {date:"21 juin 1582", texte:"Akechi Mitsuhide trahit Nobunaga au temple Honnō-ji ; le seigneur se donne la mort. Yasuke rejoint le combat au château de Nijō, auprès de son fils Nobutada, puis rend son sabre."},
      {date:"1582", texte:"Mitsuhide l'épargne et le fait conduire à la mission jésuite de Kyoto. Ensuite, les sources se taisent."},
      {date:"Légende", legende:true, texte:"Une page du carnet du Général Keïta parle d'un géant venu d'Afrique qui aurait traversé les mers avec une pierre tiède cousue dans sa ceinture. Personne ne l'a jamais vue briller, et personne ne sait où il l'a laissée."},
      {date:"Aujourd'hui", legende:true, texte:"Seule rescapée du carnet brûlé, cette page s'embrase au contact de la pierre de Tarine. Yasuke en sort, le met à l'épreuve comme on l'avait jugé lui-même, puis rejoint son équipe."},
    ]},
  // Adandé : personnage du récit. Les entrées non marquées `legende`
  // décrivent l'histoire réelle des guerrières du Dahomey (les Agojie,
  // que les Européens appelaient « Amazones »), pas sa vie à elle.
  ADANDE:{name:"Adandé",titre:"La Dernière Mino",role:"LAME",camp:"neutre",
    bio:"Guerrière du Dahomey arrachée à sa dernière bataille par la Pierre de l'Air. Un visage d'ange, et la lame la plus rapide de deux siècles.",
    o:{skin:"#5a3520",cloth:"#1e3a6e",accent:"#e8e4d8",hair:"#141018",eye:"#e6c98a",hairStyle:2,mark:0,beard:0,smile:true},
    chrono:[
      {date:"XVIIᵉ siècle", texte:"Le royaume du Dahomey, dans l'actuel Bénin, forme un corps de guerrières d'élite : les Agojie, ou Mino, « nos mères ». Les voyageurs européens les appelleront les Amazones."},
      {date:"XIXᵉ siècle", texte:"Sous les rois Ghézo puis Glèlè, elles sont plusieurs milliers. Entraînées dès l'enfance, elles gardent le palais d'Abomey et combattent en première ligne."},
      {date:"1890", texte:"Première guerre contre la France. Les Agojie chargent à Cotonou et à Atchoupa ; les officiers français parlent de leur courage dans leurs rapports."},
      {date:"1892", texte:"Seconde guerre. Face aux fusils à répétition, les guerrières se battent jusqu'au bout. Abomey tombe ; le roi Béhanzin se rend en 1894."},
      {date:"1979", texte:"Nawi, la dernière Agojie connue, s'éteint à plus de cent ans."},
      {date:"Légende", legende:true, texte:"Au matin de sa dernière bataille, en 1892, une pierre froide tombée d'un ciel sans nuages l'enveloppe de vent. Adandé disparaît du champ de bataille et de l'histoire."},
      {date:"Aujourd'hui", legende:true, texte:"La Pierre de l'Air la dépose dans le Vide, au milieu des éclats de Vael. Elle croit d'abord que Tarine est l'ennemi. Elle se trompe rarement deux fois."},
    ]},
  // Dingane : faits historiques (sources sud-africaines et récits des
  // Voortrekkers) ; les entrées `legende` appartiennent au récit.
  DINGANE:{name:"Dingane",titre:"Le Roi de la Colline de l'Éléphant",role:"ROI",camp:"neutre",
    bio:"Roi zoulou au temps où les colons hollandais entrent sur ses terres. Stratège implacable, il a vu tomber son monde et refuse de voir tomber celui de Tarine.",
    o:{skin:"#4a2e1c",cloth:"#7a5a30",accent:"#e8d5a0",hair:"#141018",eye:"#e6c98a",hairStyle:0,mark:0,beard:1,crown:true,smile:false},
    chrono:[
      {date:"Vers 1795", texte:"Naît dans la famille royale zouloue, fils de Senzangakhona et demi-frère de Shaka, le fondateur du royaume."},
      {date:"1828", texte:"Prend le pouvoir après la mort de Shaka, tué dans un complot où il a sa part. Il devient roi des Zoulous."},
      {date:"Vers 1829", texte:"Fait bâtir sa capitale, uMgungundlovu, « le lieu secret de l'éléphant » : un immense enclos royal sur une colline."},
      {date:"1837", texte:"Les Voortrekkers, colons d'origine hollandaise venus du Cap, arrivent dans le Natal et réclament des terres à son royaume."},
      {date:"Février 1838", texte:"À uMgungundlovu, il fait exécuter le chef boer Piet Retief et ses hommes, venus négocier. La guerre éclate."},
      {date:"16 décembre 1838", texte:"Bataille de la rivière Ncome, que les Boers appellent Blood River. Ses régiments se brisent contre les chariots et les fusils."},
      {date:"1840", texte:"Vaincu par son demi-frère Mpande, allié aux Boers, il s'enfuit vers le nord et y meurt la même année."},
      {date:"Légende", legende:true, texte:"La veille de Ncome, un sorcier lui aurait offert une pierre lourde comme une montagne. Il l'aurait refusée : « Un roi qui a besoin d'une pierre pour tenir debout n'est plus un roi. »"},
      {date:"Aujourd'hui", legende:true, texte:"La Pierre de la Terre se souvient de ce refus. Au cœur de la guerre d'Abidjan, elle fait lever son écho pour juger Tarine, qui, lui, a accepté la sienne."},
    ]},
  // Ennemis de la deuxième vague (personnages du récit).
  CENDRE:{name:"La Reine Cendre",titre:"La Gardienne Déchue",role:"REINE",camp:"ennemi",
    bio:"Gardienne de la Pierre du Feu pendant quatre siècles, elle a vendu sa flamme à Sgrün en échange de l'éternité. Il ne lui reste que les braises.",
    o:{skin:"#3a2418",cloth:"#2a2420",accent:"#ff6a2a",hair:"#141018",eye:"#ff8a3a",hairStyle:0,mark:3,beard:0,crown:true,smile:false},
    chrono:[
      {date:"XVIᵉ siècle", legende:true, texte:"Choisie par la Pierre du Feu, elle en devient la gardienne. Sa flamme veille sur les forges de toute une région."},
      {date:"Quatre siècles", legende:true, texte:"Les porteurs passent, meurent, oublient. Elle reste, et la solitude refroidit ce que la pierre réchauffait."},
      {date:"Il y a vingt ans", legende:true, texte:"Sgrün lui propose l'éternité contre sa flamme. Elle accepte. La Pierre du Feu lui échappe et finit entre les mains de Sylla."},
      {date:"Aujourd'hui", legende:true, texte:"Elle garde les étages de la Tour Postel pour Sgrün, et elle attend le porteur qui osera reprendre ce qu'elle a perdu."},
    ]},
  CHRONOPHAGE:{name:"Le Chronophage",titre:"Le Chasseur de Temps",role:"CHASSEUR",camp:"ennemi",
    bio:"Venu d'un futur lointain pour ramener Adandé à son époque, il efface au passage tout ce qu'elle a touché. Il ne parle jamais au présent.",
    o:{skin:"#d8d4c8",cloth:"#e8e4d8",accent:"#e8c060",hair:"#e8e4d8",eye:"#e8c060",hairStyle:0,mark:0,beard:0,smile:false},
    chrono:[
      {date:"Dans un futur lointain", legende:true, texte:"Une époque où l'on répare les accidents du temps. Chaque personne déplacée est une faute à corriger."},
      {date:"1892", legende:true, texte:"L'enlèvement d'Adandé par la Pierre de l'Air ouvre une déchirure. On l'envoie la refermer."},
      {date:"Aujourd'hui", legende:true, texte:"Il la retrouve aux côtés de Tarine. Pour lui, l'équipe entière est une erreur à effacer."},
    ]},

  // Den skyggeløse mannen (« l'homme sans ombre », en norvégien) : personnage
  // du récit, entièrement légendaire. Allié dans la première partie ; la
  // suite du jeu en fera le grand méchant. Sgrün est son ombre arrachée.
  SKYGGE:{name:"Den skyggeløse mannen",titre:"L'Homme sans Ombre",role:"DIEU",camp:"neutre",
    bio:"Un dieu du Nord chassé du ciel, retrouvé endormi sous la glace. Il se bat aux côtés de Tarine avec une patience infinie. Au soleil, il ne laisse aucune ombre.",
    o:{skin:"#d8cfc4",cloth:"#5a6470",accent:"#9fc4e8",hair:"#d8d8d0",eye:"#9fc4e8",hairStyle:1,mark:0,beard:1,smile:false},
    chrono:[
      {date:"Avant les runes", legende:true, texte:"Les récits du Nord parlent d'un dieu qui gardait la frontière entre le jour et la nuit. Aucun ne donne son vrai nom."},
      {date:"Un hiver sans fin", legende:true, texte:"Les sagas disent qu'on l'a chassé du ciel. Elles ne disent pas pourquoi. Elles disent seulement qu'il n'a plus d'ombre depuis ce jour."},
      {date:"Sept siècles", legende:true, texte:"Il dort sous la glace, au fond d'une faille que personne ne visite. Pendant ce temps, quelque chose qui lui appartenait apprend à marcher seul."},
      {date:"Aujourd'hui", legende:true, texte:"La base de Sgrün fend la glace et le réveille. Il offre son épée à Tarine et dit avoir une dette envers Sgrün. Il ne dit pas laquelle."},
    ]},

  // ---- L'empire de Sgrün ----
  SGRUN:{name:"Sgrün",titre:"L'Empire",role:"OMBRE",camp:"ennemi",
    bio:"Une silhouette en costume croisé, debout au fond de chaque vision. Ce n'est pas un homme qu'on affronte, c'est une structure.",
    o:{cloth:"#0d0d14",accent:"#C084FC",eye:"#C084FC",form:"shadow",prop:"tie",bg:["#241238","#050208"]}},
  DARK:{name:"L'Ombre",titre:"Le Reflet",role:"OMBRE",camp:"ennemi",
    bio:"Ce que tu vas voir ici n'est pas un ennemi. C'est une version de toi — celle qui n'a jamais posé la pierre.",
    o:{cloth:"#241238",accent:"#C084FC",eye:"#ff5c72",form:"shadow"}},
  SCHISSIN:{name:"Schissin-Rouge",titre:"La Peur qui a une Forme",role:"OMBRE",camp:"ennemi",
    bio:"Un nom de code dans le carnet du Général. Quelqu'un qui a su qui il était avant que lui-même ne le sache.",
    o:{cloth:"#2a0810",accent:"#e0455c",eye:"#ff3d3d",form:"shadow",bg:["#3d0d18","#0d0206"]}},
  SYLLA:{name:"Sylla",titre:"Le Maître de la Villa",role:"ASSASSIN",camp:"ennemi",
    bio:"Il frappe les lieux symboliques pour briser le moral. Dans la vision, ses yeux disaient déjà : je te trouverai.",
    o:{skin:"#5c3317",cloth:"#1a1a1a",accent:"#e0455c",hair:"#141018",eye:"#e0455c",hairStyle:0,mark:1,beard:2,eyewear:2,smile:false,prop:"tie"}},
  OUSMANE:{name:"Ousmane",titre:"Le Bras Droit",role:"TANK",camp:"ennemi",
    bio:"Un ancien ami du Général passé chez Sylla. Il gère la sécurité du Port et fume son cigare près des conteneurs.",
    o:{skin:"#6b4226",cloth:"#2a2418",accent:"#ff9f43",hair:"#3d2b1f",eye:"#ffd76b",hairStyle:6,mark:0,beard:3,smile:false,prop:"cigar"}},
  KRAG:{name:"Krag",titre:"L'Émissaire des Profondeurs",role:"EMISSAIRE",camp:"ennemi",
    bio:"Conçu spécifiquement pour résister à la pression des abysses. Ce qui le brise doit venir d'ailleurs que de la force.",
    o:{skin:"#4a5560",cloth:"#16232e",accent:"#7fd4e0",eye:"#9fd8ff",form:"stone",bg:["#16323f","#04101a"]}},
  VAEL:{name:"Vael",titre:"La Lame Invisible",role:"EMISSAIRE",camp:"ennemi",
    bio:"L'Émissaire de l'Air, resté derrière pour s'assurer que personne ne suive Sgrün. On ne le voit qu'après le coup.",
    o:{skin:"#cfe8f0",cloth:"#1e3a44",accent:"#cdfafa",eye:"#ffffff",form:"wind",bg:["#1d4450","#050f14"]}},
  MURK:{name:"Murk",titre:"L'Émissaire Abyssal",role:"EMISSAIRE",camp:"ennemi",
    bio:"Sans forme fixe. Un émissaire liquide qui se glisse partout et gèle instantanément ce qu'il touche.",
    o:{cloth:"#0d2833",accent:"#2a7f9e",eye:"#9fd8ff",form:"liquid",bg:["#12363f","#030d12"]}},
  SUB:{name:"Sub",titre:"L'Opérateur Installé",role:"ASSASSIN",camp:"ennemi",
    bio:"À Abidjan depuis six mois. Il ne passe pas : il s'enracine, il apprend les habitudes, il attend l'ordre.",
    o:{skin:"#7a4a2b",cloth:"#1a1f2e",accent:"#9d7bff",hair:"#1a1a24",eye:"#9d7bff",hairStyle:3,mark:1,beard:4,smile:false}},
  GROB:{name:"Grob",titre:"L'Opérateur de Passage",role:"TANK",camp:"ennemi",
    bio:"Lui, il passe. Il arrive, il casse ce qu'il faut casser, il repart avant qu'on ait retenu son visage.",
    o:{skin:"#5c3317",cloth:"#2e1a1a",accent:"#ff7a35",hair:"#141018",eye:"#ff9f43",hairStyle:0,mark:1,beard:3,smile:false,prop:"epaulet"}}
};
