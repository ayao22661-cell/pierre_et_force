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
    passive:{name:"Le Seuil",desc:"Après une capacité, la prochaine attaque inflige +80% de dégâts."},
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
    passive:{name:"Show de la Cour",desc:"Élimination ou assistance : délais −60% et +30% vitesse 2 s."},
    abil:[
      {name:"Mot qui Blesse",desc:"Frappe en cône qui réduit l'armure.",type:"cone",cd:[6,5.5,5,4.5,4],cost:35,range:190,angle:1.4,dmg:[70,110,150,190,230],ratio:1.0,debuff:{arm:-20,d:3},color:"#ff8a5c"},
      {name:"Sourire de Victoire",desc:"Ruée vers une cible puis étourdissement.",type:"dash",cd:[12,11,10,9,8],cost:50,range:380,radius:80,dmg:[60,95,130,165,200],ratio:0.8,cc:{t:"stun",d:0.75},color:"#D85A30"},
      {name:"Lieutenant",desc:"Invoque un lieutenant fantôme qui combat 6 s.",type:"summon",cd:[18,17,16,15,14],cost:60,dur:6,power:[0.25,0.3,0.35,0.4,0.45],color:"#ff6a3d"},
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
    passive:{name:"Faim de l'Abîme",desc:"Tous les dégâts rendent 12% de PV."},
    abil:[
      {name:"Lame d'Ombre",desc:"Lame lancée qui traverse.",type:"shot",cd:[6,5.5,5,4.5,4],cost:40,range:540,width:42,speed:1150,pierce:true,dmg:[70,110,150,190,230],ratio:1.0,color:"#C084FC"},
      {name:"Voile Maudit",desc:"Disparaît dans l'ombre : vitesse et esquive des tirs 1,5 s.",type:"self",cd:[18,16.5,15,13.5,12],cost:60,buff:{ms:[90,100,110,120,130],d:1.5,veil:true},color:"#6b21a8"},
      {name:"Drain d'Âme",desc:"Vole la vie des ennemis devant lui.",type:"cone",cd:[10,9.5,9,8.5,8],cost:50,range:220,angle:1.3,dmg:[80,120,160,200,240],ratio:0.9,drain:0.6,color:"#a855f7"},
      {name:"Néant Absolu",desc:"L'obscurité engloutit la zone autour de lui.",type:"nova",cd:[90,75,60],cost:100,radius:340,team:"enemy",delay:0.5,dmg:[340,500,660],ratio:1.5,cc:{t:"silence",d:1.5},color:"#C084FC",ult:true}
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
