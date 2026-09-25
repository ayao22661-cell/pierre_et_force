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
    o:{skin:"#6b4226",cloth:"#4a3410",accent:"#f0c860",hair:"#141018",eye:"#ffd76b",hairStyle:0,mark:4,beard:3,crown:true,smile:false,prop:"medal"}},
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
