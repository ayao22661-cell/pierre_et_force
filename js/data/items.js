// Objets, reliques et talents.
// `slot` : où l'objet se porte sur le héros du joueur (voir game/gear.js).
//   main  — tenu en main droite, remplace l'arme du personnage ;
//   off   — main gauche / avant-bras (bouclier, kora, boussole) ;
//   armor — armure riggée sur Mixamo (`model`, dans assets/models/) : le
//           héros la porte réellement, avec toutes ses animations.
// `wear` : comment le modèle 3D se tient (mêmes champs que WEAPON_BY_KEY).
const SWORD = (file, height, grip = 0.14) => ({ file, hand: 'RightHand', height, grip, roll: Math.PI / 2 });
const GUN = (file, height) => ({ file, hand: 'RightHand', height, grip: 0.42, roll: 0 });
export const ITEMS = [
  {id:"lame",name:"Lame de Treichville",cost:350,tier:1,st:{atk:12},ico:"🗡",slot:"main",wear:SWORD('EPEE1.glb', 1.2, 0.12)},
  {id:"gilet",name:"Gilet de Docker",cost:300,tier:1,st:{arm:15},ico:"🦺"},
  {id:"perle",name:"Perle de Cauri",cost:350,tier:1,st:{mana:150,ah:5},ico:"🐚"},
  {id:"ceinture",name:"Ceinture Kente",cost:400,tier:1,st:{hp:180},ico:"🎗"},
  {id:"gants",name:"Gants du Port",cost:300,tier:1,st:{as:0.12},ico:"🧤"},
  {id:"sandales",name:"Sandales d'Adjamé",cost:300,tier:1,st:{ms:25},ico:"👡"},
  {id:"pistolet",name:"Pistolet du Plateau",cost:400,tier:1,st:{atk:10,as:0.08},ico:"🔫",slot:"main",wear:GUN('PISTOLET1.glb', 0.36)},
  {id:"boussole",name:"Boussole de Sam",cost:350,tier:1,st:{ms:15,ah:8},ico:"🧭",slot:"off",wear:{file:'BOUSSOLE.glb',hand:'LeftHand',height:0.24,grip:0.5,roll:0}},
  {id:"faucille",name:"Faucille Ancienne",cost:1100,tier:2,from:["lame","lame"],st:{atk:30,crit:0.12},ico:"⚔",slot:"main",wear:SWORD('EPEE3.glb', 0.95)},
  {id:"bouclier",name:"Bouclier Baoulé",cost:1000,tier:2,from:["gilet","ceinture"],st:{arm:30,hp:250},ico:"🛡",slot:"off",wear:{file:'BOUCLIER.glb',hand:'LeftForeArm',height:0.62,grip:0.5,roll:0,strap:true}},
  {id:"baton",name:"Bâton du Griot",cost:1100,tier:2,from:["perle","lame"],st:{atk:22,mana:250,ah:10},ico:"🪄",slot:"main",wear:{file:'BATON_MAGIQUE.glb',hand:'RightHand',height:1.7,grip:0.42,roll:0}},
  {id:"bottes",name:"Bottes du Messager",cost:900,tier:2,from:["sandales"],st:{ms:45,ah:10},ico:"🥾"},
  {id:"arc",name:"Corde de Balafon",cost:1000,tier:2,from:["gants","gants"],st:{as:0.3,crit:0.1},ico:"🏹"},
  {id:"masque",name:"Masque Dan",cost:1000,tier:2,from:["ceinture","perle"],st:{hp:300,mana:200,regen:4},ico:"🎭"},
  {id:"lance",name:"Lance Sénoufo",cost:1050,tier:2,from:["lame","gants"],st:{atk:28,arm:10,pen:0.08},ico:"🔱",slot:"main",wear:{file:'LANCE.glb',hand:'RightHand',height:1.95,grip:0.38,roll:Math.PI/2}},
  {id:"revolver",name:"Revolver de Bassam",cost:1050,tier:2,from:["pistolet","gants"],st:{atk:24,as:0.2,crit:0.08},ico:"🔫",slot:"main",wear:GUN('PISTOLET2.glb', 0.36)},
  {id:"kora",name:"Kora du Griot",cost:950,tier:2,from:["perle","ceinture"],st:{hp:150,mana:250,regen:5},ico:"🪕",slot:"off",wear:{file:'HARPE.glb',hand:'LeftHand',height:0.7,grip:0.5,roll:0}},
  {id:"bouclier_garde",name:"Bouclier du Gardien",cost:1050,tier:2,from:["gilet","gants"],st:{arm:25,hp:200,as:0.08},ico:"🛡",slot:"off",wear:{file:'BOUCLIER_GARDIEN.glb',hand:'LeftForeArm',height:0.66,grip:0.5,roll:0,strap:true}},
  {id:"armure_ombre",name:"Armure de l'Ombre",cost:1100,tier:2,from:["gilet","ceinture"],st:{arm:35,hp:200},ico:"🥷",slot:"armor",prop:"ARMURE_1",model:"ARMURE_OMBRE.glb"},
  {id:"armure_garde",name:"Armure du Gardien",cost:1150,tier:2,from:["gilet","gilet"],st:{arm:30,hp:320},ico:"🛡",slot:"armor",prop:"ARMURE_2",model:"ARMURE_GARDIEN.glb"},
  {id:"coupe",name:"Coupe-Coupe de l'Éveillé",cost:2900,tier:3,from:["faucille","arc"],st:{atk:60,as:0.35,crit:0.25,pen:0.12},ico:"🔱",slot:"main",wear:SWORD('EPEE.glb', 1.05)},
  {id:"rempart",name:"Rempart de Kong",cost:2800,tier:3,from:["bouclier","masque"],st:{arm:70,hp:650,regen:10},ico:"🏯",slot:"off",wear:{file:'BOUCLIER.glb',hand:'LeftForeArm',height:0.7,grip:0.5,roll:0,strap:true}},
  {id:"sceptre",name:"Sceptre de Kankou Moussa",cost:3000,tier:3,from:["baton","masque"],st:{atk:70,mana:500,ah:25,hp:200},ico:"👑",slot:"main",wear:{file:'BATON_MAGIQUE.glb',hand:'RightHand',height:1.85,grip:0.42,roll:0}},
  {id:"lamevide",name:"Lame du Vide",cost:3000,tier:3,from:["faucille","baton"],st:{atk:80,ah:15,crit:0.2,pen:0.3},ico:"🌑",slot:"main",wear:SWORD('EPEE.glb', 1.1)},
  {id:"ailes",name:"Ailes du Harmattan",cost:2600,tier:3,from:["bottes","arc"],st:{ms:70,as:0.4,ah:15},ico:"🪽"},
  {id:"coeur",name:"Cœur de Pierre",cost:3200,tier:3,from:["rempart","gilet"],st:{arm:100,hp:900,regen:15,thorns:0.25},ico:"💎"},
  {id:"canon",name:"Canon de Sgrün",cost:2800,tier:3,from:["revolver","arc"],st:{atk:55,as:0.35,crit:0.2},ico:"🔫",slot:"main",wear:GUN('PISTOLET3.glb', 0.42)}
];
export const TALENT_TREES = [
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
  {id:"air",name:"Pierre de l'Air",color:"#c084fc",nodes:[
    {id:"a1",name:"Lame de Vent",max:5,per:{as:0.03},desc:"+3% vitesse d'attaque par rang"},
    {id:"a2",name:"Courant Ascendant",max:5,per:{msF:5},desc:"+5 vitesse par rang"},
    {id:"a3",name:"Tempête d'Éclats",max:3,per:{exec:0.05},desc:"+5% dégâts par rang aux cibles sous 40% PV",req:3},
    {id:"a4",name:"Convergence",max:1,per:{goldP:0.2},desc:"+20% or gagné en combat",req:8}]}
];
export const RELIC_BASES = [
  {id:"am1",slot:"amulette",name:"Amulette de Cauris",st:{hp:60}},
  {id:"am2",slot:"amulette",name:"Collier Akan",st:{atk:5}},
  {id:"am3",slot:"amulette",name:"Perle d'Ivoire",st:{ah:3}},
  {id:"am4",slot:"amulette",name:"Œil du Griot",st:{mana:50}},
  {id:"br1",slot:"bracelet",name:"Bracelet de Bronze",st:{arm:4}},
  {id:"br2",slot:"bracelet",name:"Jonc du Chasseur",st:{as:0.03}},
  {id:"br3",slot:"bracelet",name:"Manchette Sénoufo",st:{crit:0.02}},
  {id:"br4",slot:"bracelet",name:"Fil de Kente",st:{regen:1}},
  {id:"ta1",slot:"talisman",name:"Talisman du Banco",st:{regen:2}},
  {id:"ta2",slot:"talisman",name:"Gri-gri du Port",st:{ms:4}},
  {id:"ta3",slot:"talisman",name:"Statuette Baoulé",st:{hp:40,arm:2}},
  {id:"ta4",slot:"talisman",name:"Éclat de Faille",st:{atk:3,ah:2}}
];
export const RARITY = [
  {id:0,name:"Commune",mult:1,color:"#b8b0c8"},
  {id:1,name:"Rare",mult:1.7,color:"#4ea8ff"},
  {id:2,name:"Épique",mult:2.6,color:"#c084fc"},
  {id:3,name:"Légendaire",mult:3.8,color:"#fbbf24"}
];
