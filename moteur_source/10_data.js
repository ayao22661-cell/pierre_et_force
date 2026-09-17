// =====================================================================
// ===  MOTEUR « FAILLE » v3 — DONNÉES                               ===
// ===  Champions jouables, adversaires, objets, thèmes, progression ===
// =====================================================================

function clamp(v,a,b){return v<a?a:v>b?b:v;}
function lerp(a,b,t){return a+(b-a)*t;}
function rand(a,b){return a+Math.random()*(b-a);}
function dist2(ax,ay,bx,by){var dx=ax-bx,dy=ay-by;return dx*dx+dy*dy;}
function dist(ax,ay,bx,by){return Math.sqrt(dist2(ax,ay,bx,by));}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}

// ---------------------------------------------------------------------
// Apparence en jeu (couleurs reprises du casting des portraits)
// ---------------------------------------------------------------------
function lookFor(key){
  var c=CAST[key==="BABA"?"BABA_TUNDE":key];
  var o=(c&&c.o)||{};
  return{
    skin:o.skin||"#6b4226", cloth:o.cloth||"#222", accent:o.accent||"#c084fc",
    hair:o.hair||"#141018", eye:o.eye||"#fff", form:o.form||null,
    crown:!!o.crown, hairStyle:o.hairStyle||0
  };
}

// ---------------------------------------------------------------------
// Capacités : chaque capacité est décrite par des données, exécutées
// par un seul interpréteur (castAbility). Valeurs par rang [1..5] ou [1..3].
//  type : shot | circle | cone | dash | blink | nova | self | ally | line | zone | summon
// ---------------------------------------------------------------------
var CHAMPS={
  TARINE:{name:"Tarine Keïta",title:"L'Éveillé de Marcory",role:"Combattant",
    body:1, hp:640,hpL:98, mana:300,manaL:40, atk:62,atkL:3.6, arm:32,armL:4, as:0.68,asL:0.022, ms:200, range:78, ranged:false,
    fx:"#39FF7A",
    passive:{name:"Pierre tiède",desc:"Toutes les 3 attaques, la pierre libère une décharge (+60% dégâts) et rend 3% des PV max."},
    abil:[
      {name:"Onde d'Éveil",desc:"Projette une onde qui traverse les ennemis et les ralentit.",type:"shot",cd:[8,7.5,7,6.5,6],cost:45,range:520,width:46,speed:900,pierce:true,dmg:[70,110,150,190,230],ratio:0.9,cc:{t:"slow",d:1.5,p:0.3},color:"#39FF7A"},
      {name:"Chaleur Ancestrale",desc:"Bond vers l'avant puis frappe la zone d'arrivée.",type:"dash",cd:[13,12,11,10,9],cost:60,range:330,radius:120,dmg:[60,95,130,165,200],ratio:0.7,color:"#b6ff5c"},
      {name:"Mur de Pierre",desc:"Bouclier de pierre et bonus d'armure pendant 3 s.",type:"self",cd:[16,15,14,13,12],cost:50,shield:[90,140,190,240,290],shieldR:0.08,buff:{arm:[15,20,25,30,35],d:3},color:"#c9a86a"},
      {name:"Cinq Pierres",desc:"Cinq pierres s'abattent sur la zone : dégâts massifs et étourdissement.",type:"circle",cd:[90,75,60],cost:100,range:560,radius:230,delay:0.6,dmg:[260,400,540],ratio:1.3,cc:{t:"stun",d:1.25},color:"#39FF7A",ult:true}
    ]},
  SAM:{name:"Sam Grün",title:"Le Passeur",role:"Mage",
    body:0, hp:540,hpL:84, mana:420,manaL:55, atk:52,atkL:2.8, arm:22,armL:3.5, as:0.64,asL:0.015, ms:195, range:300, ranged:true,
    fx:"#16c8bd", proj:"#16c8bd",
    passive:{name:"Le Seuil",desc:"Après une capacité, la prochaine attaque inflige +80% de dégâts."},
    abil:[
      {name:"Seuil Ouvert",desc:"Faille explosive qui éclate au premier ennemi touché.",type:"shot",cd:[6,5.5,5,4.5,4],cost:50,range:620,width:40,speed:1000,explode:110,dmg:[80,125,170,215,260],ratio:1.0,color:"#16c8bd"},
      {name:"Ce Que Tu Es",desc:"Zone qui révèle et enracine après un court délai.",type:"circle",cd:[14,13,12,11,10],cost:70,range:600,radius:150,delay:0.8,dmg:[70,110,150,190,230],ratio:0.8,cc:{t:"root",d:1.5},color:"#5ef2e6"},
      {name:"Main sur l'Épaule",desc:"Soigne l'allié le plus blessé à proximité et accélère.",type:"ally",cd:[14,13,12,11,10],cost:80,range:520,heal:[70,110,150,190,230],healR:0.05,buff:{ms:60,d:2},color:"#a6fff7"},
      {name:"Royaume de l'Essence",desc:"Déchire l'espace en ligne droite après canalisation.",type:"line",cd:[100,85,70],cost:120,range:900,width:110,delay:0.7,dmg:[300,460,620],ratio:1.5,cc:{t:"slow",d:2,p:0.5},color:"#16c8bd",ult:true}
    ]},
  KAREN:{name:"Karen Keïta",title:"La Sentinelle",role:"Soutien",
    body:0, hp:560,hpL:88, mana:400,manaL:50, atk:48,atkL:2.5, arm:28,armL:4, as:0.63,asL:0.015, ms:198, range:280, ranged:true,
    fx:"#378ADD", proj:"#8ec5ff",
    passive:{name:"Veilleuse",desc:"Soins +20%. Les alliés proches régénèrent 1% PV/s."},
    abil:[
      {name:"Main Tranquille",desc:"Soigne un allié blessé.",type:"ally",cd:[9,8.5,8,7.5,7],cost:60,range:560,heal:[80,120,160,200,240],healR:0.06,color:"#8ec5ff"},
      {name:"Regard Absolu",desc:"Projectile qui étourdit le premier ennemi touché.",type:"shot",cd:[14,13,12,11,10],cost:60,range:600,width:44,speed:950,dmg:[60,95,130,165,200],ratio:0.6,cc:{t:"stun",d:1.2},color:"#378ADD"},
      {name:"Présence Apaisante",desc:"Zone qui soigne les alliés et ralentit les ennemis.",type:"zone",cd:[18,17,16,15,14],cost:80,range:520,radius:170,dur:3,tick:0.5,heal:[18,26,34,42,50],dmg:[10,16,22,28,34],cc:{t:"slow",d:0.6,p:0.35},color:"#378ADD"},
      {name:"Veille de Nuit",desc:"Soin et bouclier sur toute l'équipe proche.",type:"nova",cd:[110,95,80],cost:120,radius:700,team:"ally",heal:[180,280,380],shield:[120,180,240],color:"#8ec5ff",ult:true}
    ]},
  FULGENCE:{name:"Fulgence",title:"Le Roc de Marcory",role:"Tank",
    body:2, hp:760,hpL:118, mana:280,manaL:35, atk:58,atkL:3.2, arm:42,armL:5, as:0.62,asL:0.015, ms:190, range:82, ranged:false,
    fx:"#7F77DD",
    passive:{name:"Roc",desc:"Sous 40% PV, gagne un bouclier de 15% PV max (délai 40 s)."},
    abil:[
      {name:"Corps Interposé",desc:"Charge courte qui repousse les ennemis touchés.",type:"dash",cd:[12,11,10,9,8],cost:50,range:300,radius:90,dmg:[50,80,110,140,170],ratio:0.5,cc:{t:"knock",d:0.35,p:260},color:"#a39bff"},
      {name:"Grip de Marcory",desc:"Cône qui étourdit les ennemis devant lui.",type:"cone",cd:[14,13,12,11,10],cost:60,range:230,angle:1.2,dmg:[60,90,120,150,180],ratio:0.6,cc:{t:"stun",d:1},color:"#7F77DD"},
      {name:"Présence Constante",desc:"Provocation : les ennemis proches le ciblent, il gagne de l'armure.",type:"nova",cd:[16,15,14,13,12],cost:60,radius:260,team:"enemy",taunt:1.5,dmg:[30,50,70,90,110],buff:{arm:[30,40,50,60,70],d:3},color:"#b3adff"},
      {name:"Imperturbable",desc:"Saut sur la zone : dégâts, projection et grosse armure.",type:"blink",cd:[100,85,70],cost:100,range:500,radius:240,dmg:[200,300,400],ratio:0.8,cc:{t:"stun",d:1.5},buff:{arm:[60,90,120],d:4},color:"#7F77DD",ult:true}
    ]},
  BABA:{name:"Baba Tunde",title:"Seigneur de la Cour",role:"Assassin",
    body:1, hp:590,hpL:90, mana:260,manaL:35, atk:68,atkL:4, arm:26,armL:3.6, as:0.72,asL:0.028, ms:210, range:76, ranged:false,
    fx:"#D85A30",
    passive:{name:"Show de la Cour",desc:"Élimination ou assistance : délais −60% et +30% vitesse 2 s."},
    abil:[
      {name:"Mot qui Blesse",desc:"Frappe en cône qui réduit l'armure.",type:"cone",cd:[6,5.5,5,4.5,4],cost:35,range:190,angle:1.4,dmg:[70,110,150,190,230],ratio:1.0,debuff:{arm:-20,d:3},color:"#ff8a5c"},
      {name:"Sourire de Victoire",desc:"Ruée vers une cible puis étourdissement.",type:"dash",cd:[12,11,10,9,8],cost:50,range:380,radius:80,dmg:[60,95,130,165,200],ratio:0.8,cc:{t:"stun",d:0.75},color:"#D85A30"},
      {name:"Lieutenant",desc:"Invoque un lieutenant fantôme qui combat 6 s.",type:"summon",cd:[18,17,16,15,14],cost:60,dur:6,power:[0.4,0.5,0.6,0.7,0.8],color:"#ff6a3d"},
      {name:"Chez Moi Partout",desc:"Se téléporte sur la zone et frappe tout autour.",type:"blink",cd:[80,65,50],cost:80,range:600,radius:180,dmg:[280,420,560],ratio:1.4,buff:{as:0.4,d:4},color:"#D85A30",ult:true}
    ]},
  LUNDGREN:{name:"Lundgren",title:"Le Passeur de Pierres",role:"Mage",
    body:0, hp:520,hpL:82, mana:440,manaL:58, atk:50,atkL:2.6, arm:22,armL:3.4, as:0.62,asL:0.014, ms:195, range:310, ranged:true,
    fx:"#B5D4F4", proj:"#dff0ff", orbit:true,
    passive:{name:"Sept Siècles",desc:"Les capacités posent Givre. À 3 cumuls, la cible est gelée 1 s."},
    abil:[
      {name:"Yeux de Glace",desc:"Trait de glace qui ralentit fortement.",type:"shot",cd:[7,6.5,6,5.5,5],cost:50,range:640,width:36,speed:1100,dmg:[80,120,160,200,240],ratio:0.9,cc:{t:"slow",d:2,p:0.45},frost:1,color:"#B5D4F4"},
      {name:"Bougainvillier",desc:"Se téléporte en laissant une explosion florale.",type:"blink",cd:[16,15,14,13,12],cost:70,range:380,radius:130,from:true,dmg:[60,95,130,165,200],ratio:0.7,frost:1,color:"#f07ab8"},
      {name:"Pierres en Orbite",desc:"Les pierres frappent tous les ennemis autour de lui.",type:"nova",cd:[9,8.5,8,7.5,7],cost:60,radius:240,team:"enemy",dmg:[70,105,140,175,210],ratio:0.8,frost:1,color:"#dff0ff"},
      {name:"Quand Tu Mourras",desc:"Pluie de glace retardée sur une grande zone.",type:"circle",cd:[100,85,70],cost:130,range:700,radius:280,delay:1.1,dmg:[330,500,670],ratio:1.6,frost:2,color:"#B5D4F4",ult:true}
    ]},
  DARK:{name:"Dark",title:"L'Enfant de l'Abîme",role:"Assassin",
    body:0, hp:560,hpL:86, mana:300,manaL:40, atk:72,atkL:4.2, arm:24,armL:3.4, as:0.7,asL:0.03, ms:212, range:80, ranged:false,
    fx:"#C084FC",
    passive:{name:"Faim de l'Abîme",desc:"Tous les dégâts rendent 12% de PV."},
    abil:[
      {name:"Lame d'Ombre",desc:"Lame lancée qui traverse.",type:"shot",cd:[6,5.5,5,4.5,4],cost:40,range:540,width:42,speed:1150,pierce:true,dmg:[70,110,150,190,230],ratio:1.0,color:"#C084FC"},
      {name:"Voile Maudit",desc:"Disparaît dans l'ombre : vitesse et esquive des tirs 1,5 s.",type:"self",cd:[18,16.5,15,13.5,12],cost:60,buff:{ms:[90,100,110,120,130],d:1.5,veil:true},color:"#6b21a8"},
      {name:"Drain d'Âme",desc:"Vole la vie des ennemis devant lui.",type:"cone",cd:[10,9.5,9,8.5,8],cost:50,range:220,angle:1.3,dmg:[80,120,160,200,240],ratio:0.9,drain:0.6,color:"#a855f7"},
      {name:"Néant Absolu",desc:"L'obscurité engloutit la zone autour de lui.",type:"nova",cd:[90,75,60],cost:100,radius:340,team:"enemy",delay:0.5,dmg:[340,500,660],ratio:1.5,cc:{t:"silence",d:1.5},color:"#C084FC",ult:true}
    ]}
};
var PLAYABLE=["TARINE","KAREN","FULGENCE","SAM","LUNDGREN","BABA","DARK"];

// ---------------------------------------------------------------------
// Adversaires : kits bâtis sur des archétypes, habillés par le casting
// ---------------------------------------------------------------------
function foeKit(key,name,title,arch,col){
  var A={
    assassin:{body:1,hp:560,hpL:86,atk:70,atkL:4,arm:24,armL:3.4,as:0.72,asL:0.028,ms:212,range:78,ranged:false,
      abil:[
        {name:"Entaille",type:"cone",cd:[6,5.5,5,4.5,4],cost:30,range:190,angle:1.3,dmg:[70,110,150,190,230],ratio:1},
        {name:"Saut de l'Ombre",type:"dash",cd:[12,11,10,9,8],cost:40,range:380,radius:80,dmg:[60,95,130,165,200],ratio:0.8,cc:{t:"slow",d:1,p:0.4}},
        {name:"Lame Jetée",type:"shot",cd:[9,8.5,8,7.5,7],cost:40,range:520,width:38,speed:1100,dmg:[60,95,130,165,200],ratio:0.8},
        {name:"Exécution",type:"blink",cd:[80,65,50],cost:80,range:560,radius:160,dmg:[260,400,540],ratio:1.3,ult:true}]},
    mage:{body:0,hp:520,hpL:82,atk:50,atkL:2.6,arm:22,armL:3.4,as:0.62,asL:0.014,ms:195,range:300,ranged:true,
      abil:[
        {name:"Trait",type:"shot",cd:[6,5.5,5,4.5,4],cost:40,range:600,width:40,speed:1000,dmg:[80,120,160,200,240],ratio:1},
        {name:"Piège",type:"circle",cd:[13,12,11,10,9],cost:60,range:600,radius:150,delay:0.9,dmg:[70,110,150,190,230],ratio:0.8,cc:{t:"stun",d:1}},
        {name:"Marée",type:"zone",cd:[16,15,14,13,12],cost:60,range:520,radius:160,dur:3,tick:0.5,dmg:[20,30,40,50,60],cc:{t:"slow",d:0.6,p:0.35}},
        {name:"Cataclysme",type:"line",cd:[100,85,70],cost:120,range:900,width:120,delay:0.8,dmg:[300,450,600],ratio:1.4,ult:true}]},
    tank:{body:2,hp:780,hpL:120,atk:56,atkL:3,arm:44,armL:5,as:0.62,asL:0.015,ms:188,range:84,ranged:false,
      abil:[
        {name:"Coup d'Épaule",type:"dash",cd:[12,11,10,9,8],cost:40,range:300,radius:90,dmg:[50,80,110,140,170],ratio:0.5,cc:{t:"knock",d:0.35,p:240}},
        {name:"Onde de Choc",type:"nova",cd:[10,9.5,9,8.5,8],cost:50,radius:220,team:"enemy",dmg:[60,90,120,150,180],ratio:0.6,cc:{t:"slow",d:1.5,p:0.3}},
        {name:"Carapace",type:"self",cd:[18,17,16,15,14],cost:50,shield:[120,170,220,270,320],shieldR:0.1,buff:{arm:[20,30,40,50,60],d:3}},
        {name:"Séisme",type:"circle",cd:[100,85,70],cost:100,range:450,radius:260,delay:0.7,dmg:[200,300,400],ratio:0.8,cc:{t:"stun",d:1.5},ult:true}]},
    fighter:{body:1,hp:640,hpL:100,atk:64,atkL:3.8,arm:32,armL:4,as:0.68,asL:0.022,ms:200,range:80,ranged:false,
      abil:[
        {name:"Frappe Lourde",type:"cone",cd:[7,6.5,6,5.5,5],cost:30,range:200,angle:1.1,dmg:[70,110,150,190,230],ratio:1,cc:{t:"slow",d:1,p:0.3}},
        {name:"Ruée",type:"dash",cd:[13,12,11,10,9],cost:40,range:320,radius:110,dmg:[60,95,130,165,200],ratio:0.8},
        {name:"Rage",type:"self",cd:[16,15,14,13,12],cost:40,buff:{as:[0.3,0.35,0.4,0.45,0.5],d:4}},
        {name:"Écrasement",type:"blink",cd:[90,75,60],cost:80,range:480,radius:220,dmg:[250,380,510],ratio:1.1,cc:{t:"stun",d:1},ult:true}]}
  }[arch];
  var k=JSON.parse(JSON.stringify(A));
  k.name=name;k.title=title;k.role={assassin:"Assassin",mage:"Mage",tank:"Tank",fighter:"Combattant"}[arch];
  k.mana=360;k.manaL=45;k.fx=col;k.proj=col;k.foe=true;
  k.passive={name:"Serviteur de l'Empire",desc:""};
  k.abil.forEach(function(a,i){a.color=col;a.desc=a.desc||"";});
  var names=FOE_ABIL_NAMES[key];
  if(names)k.abil.forEach(function(a,i){if(names[i])a.name=names[i];});
  return k;
}
var FOE_ABIL_NAMES={
  SYLLA:["Lame de la Villa","Visite Nocturne","Couteau du Maître","Je te trouverai"],
  OUSMANE:["Épaule du Port","Conteneur","Cigare Brûlant","Grue d'Acier"],
  SUB:["Racine","Enracinement","Habitude","L'Ordre"],
  GROB:["Casse","Passage","Colère","Démolition"],
  KRAG:["Pression","Abysses","Coque de Pierre","Profondeur"],
  VAEL:["Coup Invisible","Rafale","Lame d'Air","Tempête"],
  MURK:["Jet Gelé","Glissement","Flaque","Raz-de-marée"],
  SCHISSIN:["Peur Rouge","Nom de Code","Frisson","Forme de la Peur"],
  SGRUN:["Ordre de l'Empire","Structure","Costume Croisé","Réécriture"]
};
function addFoe(key,title,arch,col){
  var c=CAST[key];
  CHAMPS[key]=foeKit(key,c?c.name:key,title,arch,col);
}
addFoe("SYLLA","Le Maître de la Villa","assassin","#e0455c");
addFoe("OUSMANE","Le Bras Droit","tank","#ff9f43");
addFoe("SUB","L'Opérateur Installé","assassin","#9d7bff");
addFoe("GROB","L'Opérateur de Passage","fighter","#ff7a35");
addFoe("KRAG","L'Émissaire des Profondeurs","tank","#7fd4e0");
addFoe("VAEL","La Lame Invisible","assassin","#cdfafa");
addFoe("MURK","L'Émissaire Abyssal","mage","#2a9ebe");
addFoe("SCHISSIN","La Peur qui a une Forme","mage","#ff3d3d");
addFoe("SGRUN","L'Empire","mage","#C084FC");

// Adversaires par acte (pool) et boss de fin d'acte
var ACTE_FOES=[
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

// ---------------------------------------------------------------------
// Thèmes visuels par acte
// ---------------------------------------------------------------------
var THEMES=[
  {name:"Cour de la Villoise",g1:"#5a3d26",g2:"#6e4a2e",lane:"#8a6a48",acc:"#f5b04a",prop:"tree",amb:"firefly",wall:"#3a2616"},
  {name:"Royaume de l'Essence",g1:"#1c1036",g2:"#2a1850",lane:"#3d2a6e",acc:"#16c8bd",prop:"crystal",amb:"mote",wall:"#120a24"},
  {name:"Born Land",g1:"#6b2e1c",g2:"#7d3a22",lane:"#a0583a",acc:"#ffb347",prop:"baobab",amb:"dust",wall:"#3e1a10"},
  {name:"Le Plateau",g1:"#1b2230",g2:"#232c3d",lane:"#394559",acc:"#ffd76b",prop:"lamp",amb:"rain",wall:"#10151f"},
  {name:"Bord de Lagune",g1:"#6c6446",g2:"#7c7350",lane:"#a39a72",acc:"#7fe0d0",prop:"palm",amb:"mist",wall:"#2c4a50"},
  {name:"Pôle Nord",g1:"#b9cbd9",g2:"#cfdde8",lane:"#e8f0f6",acc:"#7fd4ff",prop:"ice",amb:"snow",wall:"#7b93a8"},
  {name:"Terres de Mali",g1:"#a07840",g2:"#b48a4c",lane:"#c9a266",acc:"#ffd24a",prop:"mud",amb:"dust",wall:"#6a4a22"},
  {name:"La Villa",g1:"#2e3a2a",g2:"#384734",lane:"#6a6a5c",acc:"#e0455c",prop:"hedge",amb:"leaf",wall:"#1a2218"},
  {name:"Abidjan en guerre",g1:"#2a2624",g2:"#35302c",lane:"#4e4640",acc:"#ff6a2a",prop:"ruin",amb:"ember",wall:"#171412"},
  {name:"La Pierre du Feu",g1:"#241414",g2:"#301a18",lane:"#4a2620",acc:"#ff5a1f",prop:"lava",amb:"ember",wall:"#120808"},
  {name:"Le Poids de la Terre",g1:"#34402a",g2:"#404e32",lane:"#6a6450",acc:"#c9e26a",prop:"rock",amb:"dust",wall:"#1e2618"},
  {name:"Le Murmure de l'Eau",g1:"#0e3440",g2:"#124250",lane:"#1e5e6e",acc:"#5ef2e6",prop:"coral",amb:"bubble",wall:"#06202a"},
  {name:"Le Souffle du Vide",g1:"#0a0814",g2:"#110e20",lane:"#221c3a",acc:"#c084fc",prop:"crystal",amb:"star",wall:"#05040a"},
  {name:"La Convergence",g1:"#2a1a10",g2:"#241436",lane:"#5a4420",acc:"#f5c542",prop:"crystal",amb:"mote",wall:"#120a14"}
];

// ---------------------------------------------------------------------
// Boutique en combat (or) — trois paliers, recettes simples
// ---------------------------------------------------------------------
var ITEMS=[
  {id:"lame",name:"Lame de Treichville",cost:350,tier:1,st:{atk:12},ico:"🗡"},
  {id:"gilet",name:"Gilet de Docker",cost:300,tier:1,st:{arm:15},ico:"🦺"},
  {id:"perle",name:"Perle de Cauri",cost:350,tier:1,st:{mana:150,ah:5},ico:"🐚"},
  {id:"ceinture",name:"Ceinture Kente",cost:400,tier:1,st:{hp:180},ico:"🎗"},
  {id:"gants",name:"Gants du Port",cost:300,tier:1,st:{as:0.12},ico:"🧤"},
  {id:"sandales",name:"Sandales d'Adjamé",cost:300,tier:1,st:{ms:25},ico:"👡"},
  {id:"faucille",name:"Faucille Ancienne",cost:1100,tier:2,from:["lame","lame"],st:{atk:30,ls:0.08},ico:"⚔"},
  {id:"bouclier",name:"Bouclier Baoulé",cost:1000,tier:2,from:["gilet","ceinture"],st:{arm:30,hp:250},ico:"🛡"},
  {id:"baton",name:"Bâton du Griot",cost:1100,tier:2,from:["perle","lame"],st:{atk:22,mana:250,ah:10},ico:"🪄"},
  {id:"bottes",name:"Bottes du Messager",cost:900,tier:2,from:["sandales"],st:{ms:45,ah:10},ico:"🥾"},
  {id:"arc",name:"Corde de Balafon",cost:1000,tier:2,from:["gants","gants"],st:{as:0.3,crit:0.1},ico:"🏹"},
  {id:"masque",name:"Masque Dan",cost:1000,tier:2,from:["ceinture","perle"],st:{hp:300,mana:200,regen:4},ico:"🎭"},
  {id:"coupe",name:"Coupe-Coupe de l'Éveillé",cost:2900,tier:3,from:["faucille","arc"],st:{atk:60,as:0.35,crit:0.25,ls:0.1},ico:"🔱"},
  {id:"rempart",name:"Rempart de Kong",cost:2800,tier:3,from:["bouclier","masque"],st:{arm:70,hp:650,regen:10},ico:"🏯"},
  {id:"sceptre",name:"Sceptre de Kankou Moussa",cost:3000,tier:3,from:["baton","masque"],st:{atk:70,mana:500,ah:25,hp:200},ico:"👑"},
  {id:"lamevide",name:"Lame du Vide",cost:3000,tier:3,from:["faucille","baton"],st:{atk:80,ah:15,ls:0.15,pen:0.3},ico:"🌑"},
  {id:"ailes",name:"Ailes du Harmattan",cost:2600,tier:3,from:["bottes","arc"],st:{ms:70,as:0.4,ah:15},ico:"🪽"},
  {id:"coeur",name:"Cœur de Pierre",cost:3200,tier:3,from:["rempart","gilet"],st:{arm:100,hp:900,regen:15,thorns:0.25},ico:"💎"}
];
var ITEM_BY={};ITEMS.forEach(function(i){ITEM_BY[i.id]=i;});
var BUILDS={
  Combattant:["lame","sandales","faucille","bottes","ceinture","gilet","bouclier","coupe","masque","rempart","perle","sceptre"],
  Assassin:["lame","sandales","lame","faucille","bottes","perle","baton","lamevide","gants","gants","arc","coupe"],
  Mage:["perle","sandales","lame","baton","bottes","ceinture","masque","sceptre","lame","faucille","baton","lamevide"],
  Soutien:["perle","sandales","ceinture","masque","bottes","gilet","bouclier","sceptre","gilet","ceinture","rempart","coeur"],
  Tank:["ceinture","sandales","gilet","bouclier","bottes","perle","masque","rempart","gilet","coeur","lame","faucille"]
};
var STAT_LABEL={atk:"Attaque",arm:"Armure",hp:"PV",mana:"Essence",ah:"Accélération",as:"Vit. attaque",ms:"Vitesse",ls:"Vol de vie",crit:"Critique",regen:"Régén. PV",pen:"Pénétration",thorns:"Épines"};
function fmtStat(k,v){
  if(k==="as"||k==="ls"||k==="crit"||k==="pen"||k==="thorns")return "+"+Math.round(v*100)+"% "+STAT_LABEL[k];
  return "+"+Math.round(v)+" "+STAT_LABEL[k];
}

// Sorts d'invocateur
var SPELLS={
  saut:{name:"Saut",key:"D",cd:150,desc:"Téléportation courte.",ico:"✦"},
  soin:{name:"Souffle",key:"F",cd:120,desc:"Soigne 25% PV et accélère.",ico:"✚"}
};

// ---------------------------------------------------------------------
// Méta-progression : talents (Pierres), reliques, maîtrise, défis
// ---------------------------------------------------------------------
var TALENT_TREES=[
  {id:"eveil",name:"Pierre de l'Éveil",color:"#39FF7A",nodes:[
    {id:"e1",name:"Chair solide",max:5,per:{hpP:0.03},desc:"+3% PV max par rang"},
    {id:"e2",name:"Souffle long",max:5,per:{manaP:0.05},desc:"+5% Essence par rang"},
    {id:"e3",name:"Retour à Marcory",max:3,per:{respawn:0.1},desc:"−10% temps de réapparition par rang",req:3},
    {id:"e4",name:"Deuxième vie",max:1,per:{revive:1},desc:"Une fois par combat, survit à un coup fatal avec 30% PV",req:8}]},
  {id:"feu",name:"Pierre du Feu",color:"#ff5a1f",nodes:[
    {id:"f1",name:"Braise",max:5,per:{atkP:0.03},desc:"+3% attaque par rang"},
    {id:"f2",name:"Étincelle",max:5,per:{crit:0.03},desc:"+3% chance de critique par rang"},
    {id:"f3",name:"Brasier",max:3,per:{burn:0.04},desc:"Les capacités brûlent (4% des dégâts/s, 3 s) par rang",req:3},
    {id:"f4",name:"Cœur ardent",max:1,per:{ultDmg:0.25},desc:"Ultime +25% dégâts",req:8}]},
  {id:"terre",name:"Pierre de la Terre",color:"#c9a86a",nodes:[
    {id:"t1",name:"Racines",max:5,per:{armF:4},desc:"+4 armure par rang"},
    {id:"t2",name:"Poids",max:5,per:{ccRes:0.05},desc:"−5% durée des contrôles subis par rang"},
    {id:"t3",name:"Granit",max:3,per:{shieldP:0.1},desc:"+10% boucliers et soins reçus par rang",req:3},
    {id:"t4",name:"Montagne",max:1,per:{thornsF:0.15},desc:"Renvoie 15% des dégâts de base subis",req:8}]},
  {id:"eau",name:"Pierre de l'Eau",color:"#5ef2e6",nodes:[
    {id:"w1",name:"Courant",max:5,per:{ah:4},desc:"+4 accélération de capacité par rang"},
    {id:"w2",name:"Marée",max:5,per:{regenF:1},desc:"+1 PV/s par rang"},
    {id:"w3",name:"Source",max:3,per:{healP:0.1},desc:"+10% soins donnés par rang",req:3},
    {id:"w4",name:"Reflux",max:1,per:{cdKill:0.3},desc:"Élimination : −30% délais restants",req:8}]},
  {id:"vide",name:"Pierre du Vide",color:"#c084fc",nodes:[
    {id:"v1",name:"Faim",max:5,per:{ls:0.02},desc:"+2% vol de vie par rang"},
    {id:"v2",name:"Pas feutré",max:5,per:{msF:5},desc:"+5 vitesse par rang"},
    {id:"v3",name:"Exécution",max:3,per:{exec:0.05},desc:"+5% dégâts par rang aux cibles sous 40% PV",req:3},
    {id:"v4",name:"Abîme",max:1,per:{goldP:0.2},desc:"+20% or gagné en combat",req:8}]}
];
var RELIC_BASES=[
  {id:"am1",slot:"amulette",name:"Amulette de Cauris",st:{hp:60}},
  {id:"am2",slot:"amulette",name:"Collier Akan",st:{atk:5}},
  {id:"am3",slot:"amulette",name:"Perle d'Ivoire",st:{ah:3}},
  {id:"am4",slot:"amulette",name:"Œil du Griot",st:{mana:50}},
  {id:"br1",slot:"bracelet",name:"Bracelet de Bronze",st:{arm:4}},
  {id:"br2",slot:"bracelet",name:"Jonc du Chasseur",st:{as:0.03}},
  {id:"br3",slot:"bracelet",name:"Manchette Sénoufo",st:{crit:0.02}},
  {id:"br4",slot:"bracelet",name:"Fil de Kente",st:{regen:1}},
  {id:"ta1",slot:"talisman",name:"Talisman du Banco",st:{ls:0.015}},
  {id:"ta2",slot:"talisman",name:"Gri-gri du Port",st:{ms:4}},
  {id:"ta3",slot:"talisman",name:"Statuette Baoulé",st:{hp:40,arm:2}},
  {id:"ta4",slot:"talisman",name:"Éclat de Faille",st:{atk:3,ah:2}}
];
var RARITY=[
  {id:0,name:"Commune",mult:1,color:"#b8b0c8"},
  {id:1,name:"Rare",mult:1.7,color:"#4ea8ff"},
  {id:2,name:"Épique",mult:2.6,color:"#c084fc"},
  {id:3,name:"Légendaire",mult:3.8,color:"#fbbf24"}
];
var DIFFS=[
  {id:0,name:"Normal",mult:0.78,ai:0.32,xp:1,cauris:1},
  {id:1,name:"Héroïque",mult:1.12,ai:0.62,xp:1.6,cauris:1.9},
  {id:2,name:"Légendaire",mult:1.45,ai:0.9,xp:2.4,cauris:3.2}
];
var MASTERY_XP=[0,300,800,1500,2500,4000,6000,8500,11500,15000];
var SKINS=[{lvl:0,name:"Tenue d'origine"},{lvl:4,name:"Tenue d'argent",tint:"#d8dee9"},{lvl:7,name:"Tenue d'or",tint:"#f5c542"},{lvl:10,name:"Tenue d'Essence",tint:"#c084fc"}];

var AFFIXES=[
  {id:"hate",name:"Hâte",desc:"Les ennemis sont 15% plus rapides."},
  {id:"rempart",name:"Tours renforcées",desc:"Les tours ennemies ont +50% PV."},
  {id:"brume",name:"Brume",desc:"Champ de vision réduit."},
  {id:"explosif",name:"Sbires explosifs",desc:"Les sbires ennemis explosent en mourant."},
  {id:"vampire",name:"Vampirisme",desc:"Les ennemis récupèrent 10% des dégâts infligés."},
  {id:"horde",name:"Horde",desc:"Vagues de sbires plus nombreuses."},
  {id:"titan",name:"Titans",desc:"Champions ennemis +25% PV."}
];

var QUEST_TPL=[
  {id:"win",txt:"Gagner {n} missions",n:[2,3,4],stat:"wins"},
  {id:"kills",txt:"Éliminer {n} champions",n:[10,15,25],stat:"kills"},
  {id:"towers",txt:"Détruire {n} tours",n:[3,5,8],stat:"towers"},
  {id:"cs",txt:"Achever {n} sbires",n:[60,120,200],stat:"cs"},
  {id:"ults",txt:"Lancer {n} ultimes",n:[5,10,15],stat:"ults"},
  {id:"faille",txt:"Franchir {n} étages de la Faille",n:[2,3,5],stat:"floors"},
  {id:"camps",txt:"Vaincre {n} esprits de la forêt",n:[4,6,10],stat:"camps"},
  {id:"heal",txt:"Soigner {n} PV",n:[3000,6000,10000],stat:"healed"},
  {id:"flawless",txt:"Gagner {n} missions sans mourir",n:[1,2,3],stat:"flawless"}
];

var ACHIEVEMENTS=[
  {id:"first",name:"Premier Éveil",desc:"Gagner une mission",test:function(s){return s.wins>=1;}},
  {id:"acte1",name:"Le Cadeau de Papa",desc:"Terminer l'acte I",test:function(){return acteDone(0);}},
  {id:"acte7",name:"Héritier de Mali",desc:"Terminer l'acte VII",test:function(){return acteDone(6);}},
  {id:"acte14",name:"La Convergence",desc:"Terminer la campagne",test:function(){return acteDone(13);}},
  {id:"k50",name:"Chasseur",desc:"50 éliminations",test:function(s){return s.kills>=50;}},
  {id:"k500",name:"Légende de la Cour",desc:"500 éliminations",test:function(s){return s.kills>=500;}},
  {id:"t25",name:"Démolisseur",desc:"Détruire 25 tours",test:function(s){return s.towers>=25;}},
  {id:"t200",name:"Tombeur d'Empires",desc:"Détruire 200 tours",test:function(s){return s.towers>=200;}},
  {id:"cs1k",name:"Moissonneur",desc:"Achever 1 000 sbires",test:function(s){return s.cs>=1000;}},
  {id:"penta",name:"Cinq Pierres",desc:"Réussir un quintuplé",test:function(s){return s.penta>=1;}},
  {id:"boss10",name:"Briseur de Boss",desc:"Vaincre 10 boss",test:function(s){return s.bosses>=10;}},
  {id:"f10",name:"Faille I",desc:"Atteindre l'étage 10 de la Faille",test:function(){return save.faille.best>=10;}},
  {id:"f25",name:"Faille II",desc:"Atteindre l'étage 25",test:function(){return save.faille.best>=25;}},
  {id:"f50",name:"Faille III",desc:"Atteindre l'étage 50",test:function(){return save.faille.best>=50;}},
  {id:"f100",name:"Au fond de l'Abîme",desc:"Atteindre l'étage 100",test:function(){return save.faille.best>=100;}},
  {id:"hero",name:"Héroïque",desc:"Terminer 25 missions en Héroïque",test:function(){return countDiff(1)>=25;}},
  {id:"leg",name:"Légendaire",desc:"Terminer 50 missions en Légendaire",test:function(){return countDiff(2)>=50;}},
  {id:"m5",name:"Apprenti",desc:"Maîtrise 5 sur un héros",test:function(){return maxMastery()>=5;}},
  {id:"m10",name:"Maître des Pierres",desc:"Maîtrise 10 sur un héros",test:function(){return maxMastery()>=10;}},
  {id:"allm",name:"Tous Gardiens",desc:"Maîtrise 5 sur tous les héros",test:function(){return PLAYABLE.every(function(k){return masteryLvl(k)>=5;});}},
  {id:"leg1",name:"Trésor de l'Empereur",desc:"Obtenir une relique légendaire",test:function(){return save.relics.some(function(r){return r.rar===3;});}},
  {id:"lv30",name:"Porteur confirmé",desc:"Niveau de compte 30",test:function(){return save.level>=30;}},
  {id:"lv60",name:"Gardien du Sud",desc:"Niveau de compte 60",test:function(){return save.level>=60;}},
  {id:"flaw10",name:"Intouchable",desc:"10 victoires sans mourir",test:function(s){return s.flawless>=10;}}
];

