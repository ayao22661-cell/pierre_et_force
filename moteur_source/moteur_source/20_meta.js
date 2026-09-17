// =====================================================================
// ===  MÉTA-PROGRESSION (sauvegarde v3, compatible avec la v2)       ===
// =====================================================================
var ACCOUNT_MAX=80;
function xpForLevel(lvl){return 100+lvl*40;}
function checkLevelUp(){
  var gained=0;
  while(save.level<ACCOUNT_MAX&&save.xp>=xpForLevel(save.level)){
    save.xp-=xpForLevel(save.level);save.level++;gained++;
  }
  return gained;
}
function migrateSave(){
  var d=save;
  if(!d.meta3){
    d.meta3=true;
    d.cauris=d.cauris||0;
    d.talents=d.talents||{};
    d.mastery=d.mastery||{};
    d.relics=d.relics||[];
    d.equipped=d.equipped||{amulette:null,bracelet:null,talisman:null};
    d.diff=d.diff||{};           // missionId -> [normal,héroïque,légendaire]
    (d.missions_done||[]).forEach(function(id){d.diff[id]=d.diff[id]||[true,false,false];});
    d.faille=d.faille||{best:0,claimed:0};
    d.daily=d.daily||null;d.weekly=d.weekly||null;
    d.ach=d.ach||{};
    d.stats=d.stats||{};
    d.lastChamp=d.lastChamp||"TARINE";
    d.relicSeq=d.relicSeq||1;
    d.settings=d.settings||{quality:1,shake:true};
    d.tutoDone=d.tutoDone||false;
  }
  ["wins","games","kills","deaths","towers","cs","ults","floors","camps","healed","flawless","bosses","penta","playtime"].forEach(function(k){
    if(typeof d.stats[k]!=="number")d.stats[k]=0;
  });
  if(d.allies_unlocked.indexOf("SAM")<0&&d.missions_done.length>=4)d.allies_unlocked.push("SAM");
}
function acteDone(i){var a=CAMPAIGN[i];return a&&a.missions.every(function(m){return isMissionDone(m.id);});}
function countDiff(k){var n=0;for(var id in save.diff)if(save.diff[id][k])n++;return n;}
function starsFor(id){var d=save.diff[id];if(!d)return 0;return (d[0]?1:0)+(d[1]?1:0)+(d[2]?1:0);}
function totalStars(){var n=0;for(var id in save.diff)n+=starsFor(id);return n;}
function diffUnlocked(m,k){
  if(k===0)return true;
  var acte=getActeFor(m.id);
  if(k===1)return CAMPAIGN.indexOf(acte)>=0&&acteDone(CAMPAIGN.indexOf(acte));
  return acteDone(CAMPAIGN.length-1)&&save.diff[m.id]&&save.diff[m.id][1];
}

// ---- Talents ----
function talentPoints(){return (save.level-1)+Math.floor(totalStars()/3);}
function talentSpent(){var n=0;for(var k in save.talents)n+=save.talents[k];return n;}
function treeSpent(tree){var n=0;tree.nodes.forEach(function(nd){n+=save.talents[nd.id]||0;});return n;}
function canRankTalent(tree,nd){
  var r=save.talents[nd.id]||0;
  if(r>=nd.max)return false;
  if(talentSpent()>=talentPoints())return false;
  if(nd.req&&treeSpent(tree)<nd.req)return false;
  return true;
}
function talentBonus(){
  var b={};
  TALENT_TREES.forEach(function(t){t.nodes.forEach(function(nd){
    var r=save.talents[nd.id]||0;if(!r)return;
    for(var k in nd.per)b[k]=(b[k]||0)+nd.per[k]*r;
  });});
  return b;
}

// ---- Maîtrise ----
function masteryData(k){if(!save.mastery[k])save.mastery[k]={xp:0};return save.mastery[k];}
function masteryLvl(k){var x=(save.mastery[k]||{xp:0}).xp,l=0;for(var i=0;i<MASTERY_XP.length;i++)if(x>=MASTERY_XP[i])l=i+1;return Math.min(10,l);}
function maxMastery(){var m=0;PLAYABLE.forEach(function(k){m=Math.max(m,masteryLvl(k));});return m;}
function skinFor(k){var l=masteryLvl(k),s=SKINS[0];SKINS.forEach(function(x){if(l>=x.lvl&&x.lvl>0)s=x;});return s;}
function championUnlocked(k){
  if(k==="TARINE")return true;
  if(k==="DARK")return acteDone(CAMPAIGN.length-1)||save.faille.best>=25;
  return save.allies_unlocked.indexOf(k)>=0;
}

// ---- Reliques ----
function relicStats(r){
  var b=RELIC_BASES.filter(function(x){return x.id===r.base;})[0];if(!b)return{};
  var m=RARITY[r.rar].mult*(1+r.lvl*0.18),o={};
  for(var k in b.st)o[k]=b.st[k]*m;
  return o;
}
function relicName(r){var b=RELIC_BASES.filter(function(x){return x.id===r.base;})[0];return b?b.name:"?";}
function relicSlot(r){var b=RELIC_BASES.filter(function(x){return x.id===r.base;})[0];return b?b.slot:"";}
function relicUpCost(r){return Math.round((60+r.lvl*45)*(1+r.rar*0.8));}
function relicSalvage(r){return Math.round((25+r.lvl*20)*(1+r.rar*1.2));}
function rollRelic(luck){
  var roll=Math.random()+luck;
  var rar=roll>1.55?3:roll>1.2?2:roll>0.85?1:0;
  var b=RELIC_BASES[Math.floor(Math.random()*RELIC_BASES.length)];
  var r={uid:save.relicSeq++,base:b.id,rar:rar,lvl:0};
  save.relics.push(r);
  if(save.relics.length>60){ // inventaire plein : on recycle la plus faible non équipée
    var eq=equippedUids();
    var worst=save.relics.filter(function(x){return eq.indexOf(x.uid)<0&&x!==r;}).sort(function(a,b){return (a.rar*20+a.lvl)-(b.rar*20+b.lvl);})[0];
    if(worst){save.cauris+=relicSalvage(worst);save.relics.splice(save.relics.indexOf(worst),1);}
  }
  var slot=b.slot,cur=findRelic(save.equipped[slot]);
  if(!cur)save.equipped[slot]=r.uid;
  return r;
}
function findRelic(uid){for(var i=0;i<save.relics.length;i++)if(save.relics[i].uid===uid)return save.relics[i];return null;}
function equippedUids(){return [save.equipped.amulette,save.equipped.bracelet,save.equipped.talisman].filter(Boolean);}
function relicBonus(){
  var o={};
  equippedUids().forEach(function(u){var r=findRelic(u);if(!r)return;var s=relicStats(r);for(var k in s)o[k]=(o[k]||0)+s[k];});
  return o;
}

// ---- Défis quotidiens et hebdomadaires ----
function dayKey(d){d=d||new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();}
function weekKey(){var d=new Date();var t=new Date(d.getFullYear(),0,1);return d.getFullYear()+"-W"+Math.floor(((d-t)/86400000+t.getDay())/7);}
function makeQuests(seedStr,count,tier){
  var rnd=_pRng(_pHash(seedStr)),pool=QUEST_TPL.slice(),out=[];
  for(var i=0;i<count&&pool.length;i++){
    var q=pool.splice(Math.floor(rnd()*pool.length),1)[0];
    var n=q.n[tier];
    out.push({id:q.id,stat:q.stat,txt:q.txt.replace("{n}",n.toLocaleString("fr-FR")),goal:n,base:save.stats[q.stat]||0,claimed:false,
      reward:{cauris:tier===2?600:120+i*30,xp:tier===2?800:150}});
  }
  return out;
}
function refreshQuests(){
  var dk=dayKey(),wk=weekKey();
  if(!save.daily||save.daily.key!==dk)save.daily={key:dk,quests:makeQuests("d"+dk,3,0)};
  if(!save.weekly||save.weekly.key!==wk)save.weekly={key:wk,quests:makeQuests("w"+wk,2,2)};
}
function questProgress(q){return Math.min(q.goal,(save.stats[q.stat]||0)-q.base);}
function claimQuest(q){
  if(q.claimed||questProgress(q)<q.goal)return;
  q.claimed=true;save.cauris+=q.reward.cauris;save.xp+=q.reward.xp;
  var before=save.level,g=checkLevelUp();
  writeSave(save);
  hubToast("+"+q.reward.cauris+" cauris · +"+q.reward.xp+" XP"+(g?" · niveau "+save.level:""));
}
function checkAchievements(){
  var fresh=[];
  ACHIEVEMENTS.forEach(function(a){
    if(save.ach[a.id])return;
    try{if(a.test(save.stats)){save.ach[a.id]=Date.now();save.cauris+=250;fresh.push(a);}}catch(e){}
  });
  return fresh;
}

// ---- Temps de jeu estimé restant (affiché dans le profil) ----
function contentProgress(){
  var total=0,done=0;
  var nm=totalMissionsCount();
  total+=nm*3;done+=countDiff(0)+countDiff(1)+countDiff(2);
  total+=100;done+=Math.min(100,save.faille.best);
  total+=PLAYABLE.length*10;PLAYABLE.forEach(function(k){done+=masteryLvl(k);});
  total+=ACHIEVEMENTS.length;done+=Object.keys(save.ach).length;
  return Math.round(done/total*100);
}

var hubToastTimer=null;
function hubToast(msg){
  var el=document.getElementById("hub-toast");if(!el)return;
  el.textContent=msg;el.classList.add("show");
  clearTimeout(hubToastTimer);hubToastTimer=setTimeout(function(){el.classList.remove("show");},2200);
}
