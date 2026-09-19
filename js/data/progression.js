// Difficultés, quêtes, succès, thèmes visuels.
export const DIFFS = [
  {id:0,name:"Normal",mult:0.55,ai:0.18,xp:1,cauris:1},
  {id:1,name:"Héroïque",mult:0.82,ai:0.42,xp:1.6,cauris:1.9},
  {id:2,name:"Légendaire",mult:1.10,ai:0.68,xp:2.4,cauris:3.2}
];
export const QUEST_TPL = [
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
export const ACHIEVEMENTS = [
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
export const THEMES = [
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
export const MASTERY_XP = [0,300,800,1500,2500,4000,6000,8500,11500,15000];
export const SKINS = [{lvl:0,name:"Tenue d'origine"},{lvl:4,name:"Tenue d'argent",tint:"#d8dee9"},{lvl:7,name:"Tenue d'or",tint:"#f5c542"},{lvl:10,name:"Tenue d'Essence",tint:"#c084fc"}];
