// Statistiques et sorts des champions jouables et ennemis.
export const CHAMPS = {
  TARINE:{name:"Tarine Keïta",title:"L'Éveillé de Marcory",role:"Combattant",
    body:1, hp:640,hpL:98, mana:300,manaL:40, atk:62,atkL:3.6, arm:32,armL:4, as:0.68,asL:0.022, ms:330, range:95, ranged:false,
    fx:"#39FF7A",
    passive:{name:"Pierre tiède",desc:"Toutes les 3 attaques, la pierre libère une décharge (+60% dégâts) et rend 3% des PV max."},
    abil:[
      {name:"Onde d'Éveil",desc:"Projette une onde qui traverse les ennemis et les ralentit.",type:"shot",cd:[8,7.5,7,6.5,6],cost:45,range:520,width:46,speed:900,pierce:true,dmg:[70,110,150,190,230],ratio:0.9,cc:{t:"slow",d:1.5,p:0.3},color:"#39FF7A"},
      {name:"Chaleur Ancestrale",desc:"Bond vers l'avant puis frappe la zone d'arrivée.",type:"dash",cd:[13,12,11,10,9],cost:60,range:330,radius:120,dmg:[60,95,130,165,200],ratio:0.7,color:"#b6ff5c"},
      {name:"Mur de Pierre",desc:"Bouclier de pierre et bonus d'armure pendant 3 s.",type:"self",cd:[16,15,14,13,12],cost:50,shield:[90,140,190,240,290],shieldR:0.08,buff:{arm:[15,20,25,30,35],d:3},color:"#c9a86a"},
      {name:"Cinq Pierres",desc:"Cinq pierres s'abattent sur la zone : dégâts massifs et étourdissement.",type:"circle",cd:[90,75,60],cost:100,range:560,radius:180,delay:0.6,dmg:[190,320,460],ratio:1.3,cc:{t:"stun",d:1.25},color:"#39FF7A",ult:true}
    ]},
  SAM:{name:"Sam Grün",title:"Le Passeur",role:"Mage",
    body:0, hp:540,hpL:84, mana:420,manaL:55, atk:52,atkL:2.8, arm:22,armL:3.5, as:0.64,asL:0.015, ms:320, range:300, ranged:true,
    fx:"#16c8bd", proj:"#16c8bd",
    passive:{name:"Le Seuil",desc:"Après avoir lancé une capacité, la prochaine attaque de base inflige +40% de dégâts supplémentaires (proc une fois, délai interne 1 s)."},
    abil:[
      {name:"Seuil Ouvert",desc:"Faille explosive qui éclate au premier ennemi touché.",type:"shot",cd:[6,5.5,5,4.5,4],cost:50,range:620,width:40,speed:1000,explode:110,dmg:[80,125,170,215,260],ratio:1.0,color:"#16c8bd"},
      {name:"Ce Que Tu Es",desc:"Zone qui révèle et enracine après un court délai.",type:"circle",cd:[14,13,12,11,10],cost:70,range:600,radius:150,delay:0.8,dmg:[70,110,150,190,230],ratio:0.8,cc:{t:"root",d:1.5},color:"#5ef2e6"},
      {name:"Main sur l'Épaule",desc:"Soigne l'allié le plus blessé à proximité et accélère.",type:"ally",cd:[14,13,12,11,10],cost:80,range:520,heal:[70,110,150,190,230],healR:0.05,buff:{ms:60,d:2},color:"#a6fff7"},
      {name:"Royaume de l'Essence",desc:"Déchire l'espace en ligne droite après canalisation.",type:"line",cd:[100,85,70],cost:120,range:900,width:110,delay:0.7,dmg:[300,460,620],ratio:1.5,cc:{t:"slow",d:2,p:0.5},color:"#16c8bd",ult:true}
    ]},
  KAREN:{name:"Karen Keïta",title:"La Sentinelle",role:"Soutien",
    body:0, hp:560,hpL:88, mana:400,manaL:50, atk:48,atkL:2.5, arm:28,armL:4, as:0.63,asL:0.015, ms:325, range:280, ranged:true,
    fx:"#378ADD", proj:"#8ec5ff",
    passive:{name:"Veilleuse",desc:"Soins +20%. Les alliés proches régénèrent 1% PV/s."},
    abil:[
      {name:"Main Tranquille",desc:"Soigne un allié blessé.",type:"ally",cd:[9,8.5,8,7.5,7],cost:60,range:560,heal:[80,120,160,200,240],healR:0.06,color:"#8ec5ff"},
      {name:"Regard Absolu",desc:"Projectile qui étourdit le premier ennemi touché.",type:"shot",cd:[14,13,12,11,10],cost:60,range:600,width:44,speed:950,dmg:[60,95,130,165,200],ratio:0.6,cc:{t:"stun",d:1.2},color:"#378ADD"},
      {name:"Présence Apaisante",desc:"Zone qui soigne les alliés et ralentit les ennemis.",type:"zone",cd:[18,17,16,15,14],cost:80,range:520,radius:170,dur:3,tick:0.5,heal:[18,26,34,42,50],dmg:[10,16,22,28,34],cc:{t:"slow",d:0.6,p:0.35},color:"#378ADD"},
      {name:"Veille de Nuit",desc:"Soin et bouclier sur toute l'équipe proche.",type:"nova",cd:[110,95,80],cost:120,radius:700,team:"ally",heal:[180,280,380],shield:[120,180,240],color:"#8ec5ff",ult:true}
    ]},
  FULGENCE:{name:"Fulgence",title:"Le Roc de Marcory",role:"Tank",
    body:2, hp:760,hpL:118, mana:280,manaL:35, atk:58,atkL:3.2, arm:42,armL:5, as:0.62,asL:0.015, ms:310, range:100, ranged:false,
    fx:"#7F77DD",
    passive:{name:"Roc",desc:"Sous 40% PV, gagne un bouclier de 15% PV max (délai 40 s)."},
    abil:[
      {name:"Corps Interposé",desc:"Charge courte qui repousse les ennemis touchés.",type:"dash",cd:[12,11,10,9,8],cost:50,range:300,radius:90,dmg:[50,80,110,140,170],ratio:0.5,cc:{t:"knock",d:0.35,p:260},color:"#a39bff"},
      {name:"Grip de Marcory",desc:"Cône qui étourdit les ennemis devant lui.",type:"cone",cd:[14,13,12,11,10],cost:60,range:230,angle:1.2,dmg:[60,90,120,150,180],ratio:0.6,cc:{t:"stun",d:1},color:"#7F77DD"},
      {name:"Présence Constante",desc:"Provocation : les ennemis proches le ciblent, il gagne de l'armure.",type:"nova",cd:[16,15,14,13,12],cost:60,radius:260,team:"enemy",taunt:1.5,dmg:[30,50,70,90,110],buff:{arm:[30,40,50,60,70],d:3},color:"#b3adff"},
      {name:"Imperturbable",desc:"Saut sur la zone : dégâts, projection et grosse armure.",type:"blink",cd:[100,85,70],cost:100,range:500,radius:240,dmg:[200,300,400],ratio:0.8,cc:{t:"stun",d:1.5},buff:{arm:[60,90,120],d:4},color:"#7F77DD",ult:true}
    ]},
  BABA:{name:"Baba Tunde",title:"Seigneur de la Cour",role:"Assassin",
    body:1, hp:590,hpL:90, mana:260,manaL:35, atk:68,atkL:4, arm:26,armL:3.6, as:0.72,asL:0.028, ms:340, range:92, ranged:false,
    fx:"#D85A30",
    passive:{name:"Show de la Cour",desc:"Élimination ou assistance : délais −25% et +15% vitesse pendant 2 s."},
    abil:[
      {name:"Mot qui Blesse",desc:"Frappe en cône qui réduit l'armure.",type:"cone",cd:[6,5.5,5,4.5,4],cost:35,range:190,angle:1.4,dmg:[70,110,150,190,230],ratio:1.0,debuff:{arm:-20,d:3},color:"#ff8a5c"},
      {name:"Sourire de Victoire",desc:"Ruée vers une cible puis étourdissement.",type:"dash",cd:[12,11,10,9,8],cost:50,range:380,radius:80,dmg:[60,95,130,165,200],ratio:0.8,cc:{t:"stun",d:0.75},color:"#D85A30"},
      {name:"Deuxième Souffle",desc:"Il remonte sa garde : vitesse d'attaque, déplacement et encaisse pendant 5 s.",type:"self",cd:[18,17,16,15,14],cost:60,shield:[80,120,160,200,240],shieldR:0.06,buff:{as:[0.25,0.32,0.39,0.46,0.53],ms:[50,60,70,80,90],d:5},color:"#ff6a3d"},
      {name:"Chez Moi Partout",desc:"Se téléporte sur la zone et frappe tout autour.",type:"blink",cd:[80,65,50],cost:80,range:600,radius:180,dmg:[280,420,560],ratio:1.4,buff:{as:0.4,d:4},color:"#D85A30",ult:true}
    ]},
  LUNDGREN:{name:"Lundgren",title:"Le Passeur de Pierres",role:"Mage",
    body:0, hp:520,hpL:82, mana:440,manaL:58, atk:50,atkL:2.6, arm:22,armL:3.4, as:0.62,asL:0.014, ms:320, range:310, ranged:true,
    fx:"#B5D4F4", proj:"#dff0ff", orbit:true,
    passive:{name:"Sept Siècles",desc:"Les capacités posent Givre. À 3 cumuls, la cible est gelée 1 s."},
    abil:[
      {name:"Yeux de Glace",desc:"Trait de glace qui ralentit fortement.",type:"shot",cd:[7,6.5,6,5.5,5],cost:50,range:640,width:36,speed:1100,dmg:[80,120,160,200,240],ratio:0.9,cc:{t:"slow",d:2,p:0.45},frost:1,color:"#B5D4F4"},
      {name:"Bougainvillier",desc:"Se téléporte en laissant une explosion florale.",type:"blink",cd:[16,15,14,13,12],cost:70,range:380,radius:130,from:true,dmg:[60,95,130,165,200],ratio:0.7,frost:1,color:"#f07ab8"},
      {name:"Pierres en Orbite",desc:"Les pierres frappent tous les ennemis autour de lui.",type:"nova",cd:[9,8.5,8,7.5,7],cost:60,radius:240,team:"enemy",dmg:[70,105,140,175,210],ratio:0.8,frost:1,color:"#dff0ff"},
      {name:"Quand Tu Mourras",desc:"Pluie de glace retardée sur une grande zone.",type:"circle",cd:[100,85,70],cost:130,range:700,radius:280,delay:1.1,dmg:[330,500,670],ratio:1.6,frost:2,color:"#B5D4F4",ult:true}
    ]},
  DARK:{name:"Dark",title:"L'Enfant de l'Abîme",role:"Assassin",
    body:0, hp:560,hpL:86, mana:300,manaL:40, atk:72,atkL:4.2, arm:24,armL:3.4, as:0.7,asL:0.03, ms:345, range:97, ranged:false,
    fx:"#C084FC",
    passive:{name:"Faim de l'Abîme",desc:"Ses attaques de base brisent l'armure de 6 pendant 4 s, cumulable trois fois."},
    abil:[
      {name:"Lame d'Ombre",desc:"Lame lancée qui traverse.",type:"shot",cd:[6,5.5,5,4.5,4],cost:40,range:540,width:42,speed:1150,pierce:true,dmg:[70,110,150,190,230],ratio:1.0,color:"#C084FC"},
      {name:"Voile Maudit",desc:"Disparaît dans l'ombre : vitesse et esquive des tirs 1,5 s.",type:"self",cd:[18,16.5,15,13.5,12],cost:60,buff:{ms:[90,100,110,120,130],d:1.5,veil:true},color:"#6b21a8"},
      {name:"Fauche de l'Abîme",desc:"Fauche devant lui : les touchés saignent et ralentissent.",type:"cone",cd:[10,9.5,9,8.5,8],cost:50,range:220,angle:1.3,dmg:[80,120,160,200,240],ratio:0.9,cc:{t:"slow",d:1.6,p:0.35},debuff:{arm:-18,d:3},color:"#a855f7"},
      {name:"Néant Absolu",desc:"L'obscurité engloutit la zone autour de lui.",type:"nova",cd:[90,75,60],cost:100,radius:340,team:"enemy",delay:0.5,dmg:[340,500,660],ratio:1.5,cc:{t:"silence",d:1.5},color:"#C084FC"},
    ]},
  // ═══════════════════════════════════════════════════════════
  // ENNEMIS — la police d'Abidjan (Sylla, Schissin, Ousmane) et les
  // Émissaires de Sgrün (Sub, Grob, Krag, Murk, Vael), puis l'entité
  // elle-même. `innate` est appliqué au bonus du champion à sa création
  // (sim.js) : ces passifs agissent réellement, ce n'est pas du texte.
  // ═══════════════════════════════════════════════════════════
  SYLLA:{name:"Sylla",title:"Le Commissaire",role:"Combattant",
    body:1, hp:700,hpL:104, mana:320,manaL:42, atk:64,atkL:3.8, arm:34,armL:4.2, as:0.66,asL:0.02, ms:325, range:96, ranged:false,
    fx:"#FF6A2A",
    passive:{name:"Autorité",desc:"Chacune de ses capacités embrase les ennemis autour de lui pendant 3 s."},
    innate:{burn:0.14},
    abil:[
      {name:"Ordre d'Arrêt",desc:"Somme la cible de s'arrêter : trait qui ralentit fortement.",type:"shot",cd:[7,6.5,6,5.5,5],cost:45,range:560,width:44,speed:950,dmg:[75,115,155,195,235],ratio:0.9,cc:{t:"slow",d:1.6,p:0.4},color:"#FF6A2A"},
      {name:"Descente",desc:"Fauche en cône et brise l'armure des ennemis touchés.",type:"cone",cd:[10,9.5,9,8.5,8],cost:55,range:220,angle:1.3,dmg:[80,125,170,215,260],ratio:0.95,debuff:{arm:-25,d:3},color:"#ff8a4a"},
      {name:"Mandat",desc:"S'entoure d'un bouclier de braise et gagne de l'armure.",type:"self",cd:[16,15,14,13,12],cost:50,shield:[100,150,200,250,300],shieldR:0.08,buff:{arm:[18,24,30,36,42],d:3},color:"#ffb070"},
      {name:"Pierre du Feu",desc:"Abat la pierre volée sur la zone : brasier et étourdissement.",type:"circle",cd:[95,80,65],cost:110,range:540,radius:200,delay:0.7,dmg:[220,350,490],ratio:1.35,cc:{t:"stun",d:1.2},color:"#FF6A2A",ult:true}
    ]},
  SCHISSIN:{name:"Schissin-Rouge",title:"Le Nom du Carnet",role:"Tank",
    body:2, hp:820,hpL:124, mana:260,manaL:32, atk:56,atkL:3, arm:46,armL:5.4, as:0.6,asL:0.014, ms:305, range:100, ranged:false,
    fx:"#C0392B",
    passive:{name:"Le Rouge",desc:"Renvoie 25% des dégâts subis à l'attaquant au corps-à-corps."},
    innate:{thorns:0.25},
    abil:[
      {name:"Interpellation",desc:"Charge courte qui plaque la cible au sol.",type:"dash",cd:[12,11,10,9,8],cost:50,range:320,radius:95,dmg:[55,85,115,145,175],ratio:0.55,cc:{t:"stun",d:0.9},color:"#e05a4a"},
      {name:"Cordon Rouge",desc:"Encercle : les ennemis proches ne peuvent plus le contourner.",type:"nova",cd:[16,15,14,13,12],cost:60,radius:280,team:"enemy",taunt:1.6,dmg:[35,55,75,95,115],buff:{arm:[28,38,48,58,68],d:3},color:"#C0392B"},
      {name:"Vieille Garde",desc:"Se blinde et régénère en tenant sa position.",type:"self",cd:[18,17,16,15,14],cost:55,shield:[130,190,250,310,370],shieldR:0.1,buff:{arm:[20,28,36,44,52],d:4},color:"#ff7a6a"},
      {name:"Dossier Clos",desc:"S'abat sur la zone : tout est projeté et étourdi.",type:"blink",cd:[100,85,70],cost:110,range:480,radius:250,dmg:[210,320,430],ratio:0.9,cc:{t:"stun",d:1.4},buff:{arm:[50,75,100],d:4},color:"#C0392B",ult:true}
    ]},
  OUSMANE:{name:"Ousmane",title:"Le Gardien du Port",role:"Tireur",
    body:1, hp:610,hpL:94, mana:300,manaL:38, atk:66,atkL:3.9, arm:28,armL:3.8, as:0.7,asL:0.026, ms:320, range:300, ranged:true,
    fx:"#E0A020", proj:"#ffd070",
    passive:{name:"Ancien Ami",desc:"+18% de dégâts sur les cibles sous 40% de PV : il achève ce qu'il commence."},
    innate:{exec:0.18},
    abil:[
      {name:"Tir de Semonce",desc:"Balle traçante qui traverse la ligne.",type:"shot",cd:[6,5.5,5,4.5,4],cost:40,range:640,width:38,speed:1200,pierce:true,dmg:[80,125,170,215,260],ratio:1.0,color:"#ffd070"},
      {name:"Grenade de Quai",desc:"Grenade lobée sur la zone.",type:"circle",cd:[12,11,10,9,8],cost:60,range:600,radius:170,delay:0.6,dmg:[90,140,190,240,290],ratio:0.9,cc:{t:"slow",d:1.2,p:0.35},color:"#E0A020"},
      {name:"Barrage",desc:"Tient un secteur du quai sous le feu pendant 3 s.",type:"zone",cd:[18,17,16,15,14],cost:75,range:560,radius:180,dur:3,tick:0.5,dmg:[22,34,46,58,70],cc:{t:"slow",d:0.6,p:0.3},color:"#ffd070"},
      {name:"Rafale du Port",desc:"Vide son chargeur en ligne droite.",type:"line",cd:[95,80,65],cost:110,range:860,width:100,delay:0.5,dmg:[280,430,580],ratio:1.4,color:"#E0A020",ult:true}
    ]},
  SUB:{name:"Sub",title:"L'Opérateur",role:"Assassin",
    body:0, hp:570,hpL:88, mana:290,manaL:38, atk:70,atkL:4.1, arm:24,armL:3.4, as:0.72,asL:0.028, ms:342, range:94, ranged:false,
    fx:"#7FE0C0",
    passive:{name:"Six Mois à Abidjan",desc:"Il a tout repéré : 15% de coups critiques et 10% de pénétration d'armure."},
    innate:{crit:0.15,pen:0.10},
    abil:[
      {name:"Coupure Nette",desc:"Lame lancée qui traverse les rangs.",type:"shot",cd:[6,5.5,5,4.5,4],cost:40,range:520,width:40,speed:1150,pierce:true,dmg:[75,115,155,195,235],ratio:1.0,color:"#7FE0C0"},
      {name:"Effacement",desc:"Se retire du champ de vision : vitesse et esquive des tirs 1,5 s.",type:"self",cd:[17,16,15,14,13],cost:55,buff:{ms:[85,95,105,115,125],d:1.5,veil:true},color:"#3aa88a"},
      {name:"Prise de Contrôle",desc:"Bond sur la cible suivi d'une immobilisation.",type:"dash",cd:[12,11,10,9,8],cost:55,range:400,radius:85,dmg:[70,105,140,175,210],ratio:0.85,cc:{t:"root",d:1.1},color:"#7FE0C0"},
      {name:"Dossier Fermé",desc:"Apparaît au milieu d'eux et frappe tout autour.",type:"blink",cd:[85,70,55],cost:90,range:580,radius:190,dmg:[290,430,570],ratio:1.4,buff:{as:0.35,d:4},color:"#7FE0C0",ult:true}
    ]},
  GROB:{name:"Grob",title:"L'Émissaire de Passage",role:"Tank",
    body:2, hp:840,hpL:128, mana:240,manaL:30, atk:60,atkL:3.4, arm:44,armL:5.2, as:0.58,asL:0.013, ms:300, range:104, ranged:false,
    fx:"#8A8F98",
    passive:{name:"Masse Inerte",desc:"Renvoie 20% des dégâts subis et perd 20% de temps de recharge à chaque élimination."},
    innate:{thorns:0.2,cdKill:0.2},
    abil:[
      {name:"Revers",desc:"Balayage qui projette tout ce qui est devant lui.",type:"cone",cd:[11,10.5,10,9.5,9],cost:50,range:240,angle:1.5,dmg:[75,115,155,195,235],ratio:0.8,cc:{t:"knock",d:0.4,p:280},color:"#b0b6c0"},
      {name:"Pas Lourd",desc:"Charge qui écrase la zone d'arrivée.",type:"dash",cd:[13,12,11,10,9],cost:55,range:300,radius:120,dmg:[70,110,150,190,230],ratio:0.7,cc:{t:"stun",d:0.8},color:"#8A8F98"},
      {name:"Encaisse",desc:"Se durcit : bouclier et armure, il ne recule plus.",type:"self",cd:[17,16,15,14,13],cost:55,shield:[140,200,260,320,380],shieldR:0.1,buff:{arm:[25,34,43,52,61],d:4},color:"#c8ced8"},
      {name:"Écrasement",desc:"Retombe sur la zone de tout son poids.",type:"blink",cd:[100,85,70],cost:105,range:460,radius:260,dmg:[230,350,470],ratio:0.95,cc:{t:"stun",d:1.5},color:"#8A8F98",ult:true}
    ]},
  KRAG:{name:"Krag",title:"La Plaque d'Obsidienne",role:"Tank",
    body:2, hp:900,hpL:136, mana:260,manaL:32, atk:62,atkL:3.5, arm:50,armL:5.8, as:0.58,asL:0.013, ms:298, range:102, ranged:false,
    fx:"#2E3440",
    passive:{name:"Conçu pour la Pression",desc:"Résiste à 40% de la durée des contrôles : rien ne l'arrête longtemps."},
    innate:{ccRes:0.4},
    abil:[
      {name:"Poing de Fond",desc:"Frappe le sol : onde qui projette autour de lui.",type:"nova",cd:[11,10.5,10,9.5,9],cost:50,radius:250,team:"enemy",dmg:[80,120,160,200,240],ratio:0.8,cc:{t:"knock",d:0.35,p:240},color:"#4a5568"},
      {name:"Marche Abyssale",desc:"Avance sans possibilité d'être ralenti et écrase l'arrivée.",type:"dash",cd:[14,13,12,11,10],cost:55,range:340,radius:110,dmg:[75,115,155,195,235],ratio:0.75,cc:{t:"slow",d:1.5,p:0.4},color:"#2E3440"},
      {name:"Obsidienne",desc:"Sa plaque absorbe : gros bouclier, armure massive.",type:"self",cd:[18,17,16,15,14],cost:60,shield:[160,230,300,370,440],shieldR:0.12,buff:{arm:[35,46,57,68,79],d:4},color:"#6b7a90"},
      {name:"La Porte de la Pierre",desc:"Ouvre la pression des profondeurs sur toute la zone.",type:"nova",cd:[105,90,75],cost:115,radius:360,team:"enemy",delay:0.5,dmg:[300,450,600],ratio:1.3,cc:{t:"stun",d:1.5},color:"#2E3440",ult:true}
    ]},
  MURK:{name:"Murk",title:"L'Émissaire Liquide",role:"Mage",
    body:0, hp:560,hpL:86, mana:460,manaL:60, atk:52,atkL:2.8, arm:22,armL:3.4, as:0.62,asL:0.014, ms:326, range:310, ranged:true,
    fx:"#2FA8C8", proj:"#9ee8f4",
    passive:{name:"Sans Forme Fixe",desc:"Ses capacités posent Givre. À 3 cumuls, la cible gèle sur place 1 s."},
    innate:{},
    abil:[
      {name:"Filet d'Eau",desc:"Trait liquide qui gèle progressivement la cible.",type:"shot",cd:[6.5,6,5.5,5,4.5],cost:48,range:620,width:38,speed:1050,dmg:[78,118,158,198,238],ratio:0.9,cc:{t:"slow",d:1.8,p:0.4},frost:1,color:"#2FA8C8"},
      {name:"Il Est l'Eau",desc:"Se dissout et resurgit plus loin, laissant une flaque gelante.",type:"blink",cd:[15,14,13,12,11],cost:65,range:400,radius:140,from:true,dmg:[65,100,135,170,205],ratio:0.7,frost:1,color:"#9ee8f4"},
      {name:"Marée Basse",desc:"Nappe glacée qui immobilise après un instant.",type:"circle",cd:[14,13,12,11,10],cost:70,range:580,radius:180,delay:0.8,dmg:[75,115,155,195,235],ratio:0.85,cc:{t:"root",d:1.4},frost:1,color:"#2FA8C8"},
      {name:"Gel Instantané",desc:"Tout ce qui l'entoure prend en glace.",type:"nova",cd:[100,85,70],cost:120,radius:340,team:"enemy",delay:0.4,dmg:[300,450,600],ratio:1.4,cc:{t:"stun",d:1.6},frost:2,color:"#9ee8f4",ult:true}
    ]},
  VAEL:{name:"Vael",title:"La Lame Invisible",role:"Assassin",
    body:0, hp:540,hpL:84, mana:280,manaL:36, atk:74,atkL:4.4, arm:22,armL:3.2, as:0.76,asL:0.032, ms:360, range:92, ranged:false,
    fx:"#E8F4FF",
    passive:{name:"Plus Rapide que le Son",desc:"Chaque élimination réduit ses délais de 30% et le rend plus rapide."},
    innate:{cdKill:0.3,msF:15},
    abil:[
      {name:"Coup de Vent",desc:"Trait d'air qui traverse tout sur son passage.",type:"shot",cd:[5.5,5,4.5,4,3.5],cost:38,range:560,width:36,speed:1400,pierce:true,dmg:[70,108,146,184,222],ratio:0.95,color:"#E8F4FF"},
      {name:"Pas de Côté",desc:"Devient insaisissable : vitesse et esquive des tirs.",type:"self",cd:[15,14,13,12,11],cost:50,buff:{ms:[110,120,130,140,150],d:1.6,veil:true,as:0.25},color:"#c8e4ff"},
      {name:"Lame Invisible",desc:"Fond sur la cible avant qu'elle ne le voie.",type:"dash",cd:[10,9.5,9,8.5,8],cost:50,range:460,radius:80,dmg:[85,130,175,220,265],ratio:1.0,cc:{t:"silence",d:0.8},color:"#E8F4FF"},
      {name:"Presque Injuste",desc:"Traverse la zone en une série de coups impossibles à suivre.",type:"blink",cd:[80,65,50],cost:90,range:650,radius:200,dmg:[300,450,600],ratio:1.5,buff:{as:0.5,ms:80,d:4},color:"#E8F4FF",ult:true}
    ]},
  SGRUN:{name:"Sgrün",title:"Celui qui Décide",role:"Mage",
    body:1, hp:980,hpL:150, mana:520,manaL:66, atk:70,atkL:4, arm:38,armL:4.8, as:0.64,asL:0.018, ms:315, range:320, ranged:true,
    fx:"#5FD4FF", proj:"#bfeaff",
    passive:{name:"Contrôle des Possibles",desc:"Ses ultimes frappent 25% plus fort et il régénère continuellement."},
    innate:{ultDmg:0.25,regen:8},
    abil:[
      {name:"Ce Qui Peut Arriver",desc:"Faille qui s'ouvre sur la zone visée.",type:"circle",cd:[8,7.5,7,6.5,6],cost:55,range:640,radius:190,delay:0.6,dmg:[95,145,195,245,295],ratio:1.0,color:"#5FD4FF"},
      {name:"Ce Qui Ne Peut Pas",desc:"Coupe la parole aux pierres : réduit au silence tout autour.",type:"nova",cd:[16,15,14,13,12],cost:75,radius:300,team:"enemy",dmg:[70,110,150,190,230],ratio:0.8,cc:{t:"silence",d:1.6},color:"#bfeaff"},
      {name:"Champ des Possibles",desc:"Fige une zone où tout ralentit : dégâts continus pendant 4 s.",type:"zone",cd:[20,19,18,17,16],cost:70,range:600,radius:200,dur:4,tick:0.5,dmg:[24,32,40,48,56],cc:{t:"slow",d:0.8,p:0.35},color:"#5FD4FF"},
      {name:"Transaction Finale",desc:"Déchire l'espace de part en part : rien ne reste debout sur la ligne.",type:"line",cd:[110,95,80],cost:140,range:960,width:130,delay:0.8,dmg:[360,540,720],ratio:1.7,cc:{t:"stun",d:1.4},color:"#5FD4FF",ult:true}
    ]}
};
export const PLAYABLE = ["TARINE","KAREN","FULGENCE","SAM","LUNDGREN","BABA","DARK"];
export const ACTE_FOES = [
  {pool:["BABA","DARK"],boss:"DARK"},
  {pool:["DARK","SCHISSIN"],boss:"SCHISSIN"},
  {pool:["GROB","SUB"],boss:"GROB"},
  {pool:["SUB","SYLLA"],boss:"SYLLA"},
  {pool:["OUSMANE","SUB"],boss:"OUSMANE"},
  {pool:["MURK","VAEL"],boss:"MURK"},
  {pool:["KRAG","GROB"],boss:"KRAG"},
  {pool:["SCHISSIN","SYLLA"],boss:"SCHISSIN"},
  {pool:["SYLLA","OUSMANE","SUB","GROB"],boss:"SYLLA"},
  {pool:["GROB","DARK","OUSMANE"],boss:"GROB"},
  {pool:["KRAG","OUSMANE","SUB"],boss:"KRAG"},
  {pool:["MURK","VAEL","SCHISSIN"],boss:"MURK"},
  {pool:["VAEL","DARK","SCHISSIN"],boss:"VAEL"},
  {pool:["SCHISSIN","KRAG","MURK","VAEL","SYLLA"],boss:"SGRUN"}
];
