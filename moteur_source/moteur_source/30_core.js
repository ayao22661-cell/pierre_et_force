// =====================================================================
// ===  MOTEUR « FAILLE » v3 — CŒUR                                  ===
// =====================================================================
var G=null;           // partie en cours
var UID=1;
var TEAM_COL=["#4ea8ff","#ff4d6d","#e8c46a"];
var MODE_INFO={
  siege:{name:"Siège",desc:"Une voie, quatre tours, deux nexus. Détruis le nexus ennemi."},
  arena:{name:"Escarmouche",desc:"Combat d'équipe dans l'arène. Première équipe à atteindre le score gagne."},
  defense:{name:"Défense",desc:"Protège le nexus contre les vagues de l'Empire."},
  boss:{name:"Boss",desc:"Affronte le lieutenant de l'Empire et ses sbires."}
};

function missionIndex(id){var i=0,r=-1;CAMPAIGN.forEach(function(a){a.missions.forEach(function(m){if(m.id===id)r=i;i++;});});return r;}
function modeForMission(m){
  var a=getActeFor(m.id);
  if(a&&a.missions[a.missions.length-1].id===m.id)return "boss";
  var idx=missionIndex(m.id);
  if(idx===0)return "siege";
  return ["siege","arena","siege","defense"][idx%4];
}

// ---------------------------------------------------------------------
// Unités
// ---------------------------------------------------------------------
function baseUnit(kind,team,x,y,r){
  return{id:UID++,kind:kind,team:team,x:x,y:y,r:r,vx:0,vy:0,kx:0,ky:0,
    hp:1,maxHp:1,mana:0,maxMana:0,atk:0,arm:0,as:0.7,ms:0,range:60,ah:0,ls:0,crit:0,regen:0,pen:0,thorns:0,
    dead:false,atkCd:0,wind:0,recall:0,target:null,order:null,face:1,
    st:{stun:0,root:0,slow:0,slowP:0,silence:0,taunt:0,tauntBy:null,shield:0,shieldT:0,frost:0,frostT:0,veil:0,invuln:0},
    buffs:[],anim:{walk:0,atk:0,cast:0,hit:0,spawn:1,moving:0},lastHitBy:{},lastDmgT:-99,bonus:{}};
}
function makeChamp(key,team,opts){
  opts=opts||{};
  var d=CHAMPS[key];
  var u=baseUnit("champ",team,0,0,d.body===2?31:27);
  u.key=key;u.d=d;u.name=d.name;u.look=lookFor(key);u.role=d.role;
  u.lvl=1;u.xp=0;u.sp=1;u.ranks=[0,0,0,0];u.cds=[0,0,0,0];
  u.items=[];u.gold=500;u.buildIdx=0;
  u.spells={saut:0,soin:0};
  u.kills=0;u.deaths=0;u.assists=0;u.cs=0;u.dmg=0;u.healed=0;u.streak=0;u.multi=0;u.multiT=0;
  u.passiveCount=0;u.passiveT=0;u.empower=0;
  u.mult=opts.mult||1;u.isPlayer=!!opts.player;u.ai=!opts.player;
  u.skill=opts.skill!=null?opts.skill:0.5;
  u.home=opts.home||{x:0,y:0};
  u.respawnT=0;u.recall=0;u.reviveUsed=false;
  u.bonus=opts.bonus||{};
  u.skin=opts.skin||null;
  u.isBoss=!!opts.boss;
  if(u.isBoss){u.r=50;}
  u.brain={t:0,state:"lane",goal:null};
  if(u.ai){u.ranks=[1,0,0,0];u.sp=0;}
  recalc(u,true);
  return u;
}
function champStat(u,base,per){return base+per*(u.lvl-1)*(0.7025+0.0175*(u.lvl-1));}
function recalc(u,full){
  if(u.kind!=="champ")return;
  var d=u.d,b=u.bonus||{};
  var it={atk:0,arm:0,hp:0,mana:0,ah:0,as:0,ms:0,ls:0,crit:0,regen:0,pen:0,thorns:0};
  u.items.forEach(function(id){var I=ITEM_BY[id];for(var k in I.st)it[k]+=I.st[k];});
  var bf={atk:0,arm:0,as:0,ms:0,atkP:0};
  u.buffs.forEach(function(x){for(var k in x.s)bf[k]=(bf[k]||0)+x.s[k];});
  var oldMax=u.maxHp,oldMana=u.maxMana;
  var m=u.mult;
  u.maxHp=Math.round((champStat(u,d.hp,d.hpL)+it.hp+(b.hp||0))*(1+(b.hpP||0))*m*(u.isBoss?G.bossHpMult:1));
  u.maxMana=Math.round((champStat(u,d.mana||300,d.manaL||40)+it.mana+(b.mana||0))*(1+(b.manaP||0)));
  u.atk=(champStat(u,d.atk,d.atkL)+it.atk+(b.atk||0)+bf.atk)*(1+(b.atkP||0)+bf.atkP)*(0.55+0.45*m);
  u.arm=Math.max(0,champStat(u,d.arm,d.armL)+it.arm+(b.arm||0)+(b.armF||0)+bf.arm);
  u.as=Math.min(2.5,(d.as)*(1+d.asL*(u.lvl-1)+it.as+(b.as||0)+bf.as));
  u.ms=(d.ms+it.ms+(b.ms||0)+(b.msF||0)+bf.ms)*(G&&G.affix.hate&&u.team===1?1.15:1);
  u.range=d.range;
  u.ah=it.ah+(b.ah||0);
  u.ls=it.ls+(b.ls||0)+(u.key==="DARK"?0.12:0)+(G&&G.affix.vampire&&u.team===1?0.1:0);
  u.crit=Math.min(1,it.crit+(b.crit||0));
  u.regen=(2+u.lvl*0.4+it.regen+(b.regen||0)+(b.regenF||0))*(u.isBoss?0:1);
  u.manaRegen=4+u.lvl*0.5;
  u.pen=it.pen;u.thorns=it.thorns+(b.thornsF||0);
  if(full){u.hp=u.maxHp;u.mana=u.maxMana;}
  else{
    if(u.maxHp>oldMax&&!u.dead)u.hp+=u.maxHp-oldMax;
    if(u.maxMana>oldMana)u.mana+=u.maxMana-oldMana;
    u.hp=Math.min(u.hp,u.maxHp);u.mana=Math.min(u.mana,u.maxMana);
  }
}
function xpNeeded(l){return 180+(l-1)*95;}
function gainXp(u,x){
  if(u.lvl>=18)return;
  u.xp+=x;
  while(u.lvl<18&&u.xp>=xpNeeded(u.lvl)){
    u.xp-=xpNeeded(u.lvl);u.lvl++;u.sp++;
    recalc(u);
    if(u.ai)aiSpendPoints(u);
    fxRing(u.x,u.y,u.r+30,"#ffe27a",0.7);
    fxBurst(u.x,u.y-20,"#ffe27a",18,160);
    if(u.isPlayer){announce("Niveau "+u.lvl,"lvl");sfx("lvl");hudDirty();}
  }
}
function maxRank(u,i){if(i===3)return u.lvl>=16?3:u.lvl>=11?2:u.lvl>=6?1:0;return Math.min(5,Math.ceil(u.lvl/2));}
function canRank(u,i){return u.sp>0&&u.ranks[i]<maxRank(u,i);}
function rankUp(u,i){if(!canRank(u,i))return false;u.ranks[i]++;u.sp--;if(u.isPlayer)hudDirty();return true;}
function aiSpendPoints(u){
  var order=[3,0,2,1];
  var guard=0;
  while(u.sp>0&&guard++<10){
    var done=false;
    for(var j=0;j<order.length;j++){if(canRank(u,order[j])){rankUp(u,order[j]);done=true;break;}}
    if(!done)break;
  }
}

function makeMinion(team,type,path){
  var st={melee:{r:17,hp:470,atk:14,arm:10,range:60,as:1.2,gold:21,xp:60},caster:{r:15,hp:300,atk:24,arm:0,range:260,as:0.67,gold:16,xp:30},
    siege:{r:24,hp:900,atk:42,arm:30,range:320,as:0.5,gold:60,xp:95},elite:{r:22,hp:1100,atk:38,arm:25,range:70,as:0.9,gold:45,xp:90}}[type];
  var u=baseUnit("minion",team,0,0,st.r);
  var grow=1+G.time/60*0.045;
  var m=team===1?G.minionMult:1;
  u.mtype=type;u.maxHp=u.hp=Math.round(st.hp*grow*m);u.atk=st.atk*grow*(team===1?Math.sqrt(m):1);u.arm=st.arm;
  u.range=st.range;u.as=st.as;u.ms=150;u.gold=st.gold;u.xpv=st.xp;u.path=path||null;u.wp=path?(team===0?0:path.length-1):0;
  u.ranged=type==="caster"||type==="siege";
  return u;
}
function makeTower(team,x,y,tier,hp){
  var u=baseUnit("tower",team,x,y,40);
  u.maxHp=u.hp=hp||3200;u.atk=150+G.time*0;u.arm=60;u.range=330;u.as=0.85;u.tier=tier;u.heat=0;
  u.ms=0;u.heavy=true;u.gold=250;u.xpv=150;
  return u;
}
function makeNexus(team,x,y,hp){
  var u=baseUnit("nexus",team,x,y,60);u.maxHp=u.hp=hp||4500;u.arm=40;u.heavy=true;u.ms=0;u.range=0;return u;
}
function makeMonster(x,y,big,buff){
  var u=baseUnit("monster",2,x,y,big?38:24);
  var grow=1+G.time/60*0.06;
  u.maxHp=u.hp=Math.round((big?2600:1000)*grow*G.monsterMult);u.atk=(big?70:36)*grow;u.arm=big?30:12;u.range=80;u.as=0.8;u.ms=170;
  u.home={x:x,y:y};u.big=big;u.buff=buff;u.gold=big?150:70;u.xpv=big?300:120;
  return u;
}
function isHostile(a,b){return a.team!==b.team;}
function alive(u){return u&&!u.dead;}
function edgeDist(a,b){return dist(a.x,a.y,b.x,b.y)-a.r-b.r;}
function unitsNear(x,y,rad,filter){
  var out=[];
  for(var i=0;i<G.units.length;i++){var u=G.units[i];if(u.dead)continue;if(dist2(x,y,u.x,u.y)<=(rad+u.r)*(rad+u.r)&&(!filter||filter(u)))out.push(u);}
  return out;
}
function targetable(u){return !u.dead&&!u.st.invuln&&!u.protectedBy;}

// ---------------------------------------------------------------------
// Vision : buissons
// ---------------------------------------------------------------------
function brushAt(x,y){
  for(var i=0;i<G.brush.length;i++){var b=G.brush[i];if(dist2(x,y,b.x,b.y)<b.r*b.r)return b;}
  return null;
}
function visibleTo(u,team){
  if(u.team===team||u.kind==="tower"||u.kind==="nexus")return true;
  if(u.revealT>G.time)return true;
  var vr=G.affix.brume&&team===0?520:900;
  var ub=u.brushRef;
  for(var i=0;i<G.units.length;i++){
    var o=G.units[i];
    if(o.dead||o.team!==team)continue;
    if(o.kind==="monster")continue;
    var d2=dist2(o.x,o.y,u.x,u.y);
    if(d2>vr*vr)continue;
    if(!ub)return true;
    if(o.brushRef===ub||d2<150*150)return true;
  }
  return false;
}

// ---------------------------------------------------------------------
// Dégâts, soins, contrôles
// ---------------------------------------------------------------------
function applyDamage(src,t,amount,o){
  o=o||{};
  if(!t||t.dead||t.st.invuln||t.protectedBy)return 0;
  if(o.proj&&t.st.veil>0){fxText(t.x,t.y-t.r-20,"Esquive","#c084fc");return 0;}
  var arm=t.arm*(1-(src&&src.pen||0));
  var dmg=amount*100/(100+Math.max(0,arm));
  if(src&&src.bonus&&src.bonus.exec&&t.hp<t.maxHp*0.4)dmg*=1+src.bonus.exec;
  if(src&&src.kind==="champ"&&t.kind==="tower")dmg*=o.ability?0.5:1;
  if(t.kind==="champ"&&t.bonus&&t.bonus.dmgTaken)dmg*=t.bonus.dmgTaken;
  dmg=Math.max(1,dmg);
  if(t.st.shield>0){var ab=Math.min(t.st.shield,dmg);t.st.shield-=ab;dmg-=ab;}
  t.hp-=dmg;
  t.anim.hit=1;t.lastDmgT=G.time;
  if(t.recall>0){t.recall=0;}
  if(src){
    if(src.kind==="champ"){
      src.dmg+=dmg;
      if(t.kind==="champ"){t.lastHitBy[src.id]=G.time;}
      var ls=o.basic?src.ls:(src.key==="DARK"?0.12:0)+(o.drain||0);
      if(ls>0&&!src.dead)heal(src,src,dmg*ls,true);
      if(o.ability&&src.bonus.burn&&t.kind!=="tower"&&t.kind!=="nexus"){addDot(t,src,dmg*src.bonus.burn,3);}
      if(t.kind==="champ")towerAggro(src,t);
    }
    if(t.kind==="monster"&&!t.aggro)t.aggro=src;
    if(o.basic&&t.thorns>0&&!o.noThorns&&!src.dead)applyDamage(t,src,amount*t.thorns,{noThorns:true});
  }
  var big=o.crit||amount>300;
  if(t.kind!=="minion"||src&&src.isPlayer){
    var col=t.team===0?"#ff6b6b":o.crit?"#ffcf3d":o.ability?"#c9a2ff":"#ffffff";
    if(G.player&&(src===G.player||t===G.player||t.kind==="champ"||t.isBoss))fxText(t.x+rand(-10,10),t.y-t.r-18,(o.crit?"✦":"")+Math.round(dmg),col,big);
  }
  if(t.hp<=0)killUnit(t,src);
  else if(t.kind==="champ"&&t.key==="FULGENCE"&&t.hp<t.maxHp*0.4&&(t.passiveT||0)<=G.time){
    t.passiveT=G.time+40;giveShield(t,t.maxHp*0.15,3);fxRing(t.x,t.y,t.r+20,"#b3adff",0.6);
  }
  return dmg;
}
function heal(src,t,v,silent){
  if(!t||t.dead)return;
  var mult=1;
  if(src&&src.key==="KAREN")mult*=1.2;
  if(src&&src.bonus&&src.bonus.healP)mult*=1+src.bonus.healP;
  if(t.bonus&&t.bonus.shieldP)mult*=1+t.bonus.shieldP;
  v*=mult;
  var real=Math.min(t.maxHp-t.hp,v);
  t.hp+=real;
  if(src&&src.kind==="champ"&&src!==t)src.healed+=real;
  if(src===G.player&&src!==t)G.stats.healed+=real;
  if(!silent&&real>5)fxText(t.x,t.y-t.r-26,"+"+Math.round(real),"#5dff9a");
}
function giveShield(t,v,d){
  if(t.bonus&&t.bonus.shieldP)v*=1+t.bonus.shieldP;
  t.st.shield=Math.max(t.st.shield,v);t.st.shieldT=Math.max(t.st.shieldT,d);
}
function applyCC(src,t,cc){
  if(!cc||t.dead||t.kind==="tower"||t.kind==="nexus")return;
  var res=(t.bonus&&t.bonus.ccRes)||0;
  if(t.isBoss)res+=0.6;
  var d=cc.d*(1-res);
  if(cc.t==="stun"){t.st.stun=Math.max(t.st.stun,d);t.recall=0;}
  else if(cc.t==="root")t.st.root=Math.max(t.st.root,d);
  else if(cc.t==="slow"){t.st.slow=Math.max(t.st.slow,d);t.st.slowP=Math.max(t.st.slowP*(t.st.slow>0?1:0),cc.p);}
  else if(cc.t==="silence")t.st.silence=Math.max(t.st.silence,d);
  else if(cc.t==="knock"&&!t.heavy){
    var a=Math.atan2(t.y-src.y,t.x-src.x);var p=cc.p*(t.isBoss?0.2:1);
    t.kx+=Math.cos(a)*p*3;t.ky+=Math.sin(a)*p*3;t.st.stun=Math.max(t.st.stun,d*(1-res));
  }
}
function addFrost(src,t,n){
  if(t.kind!=="champ"&&t.kind!=="minion"&&t.kind!=="monster")return;
  t.st.frost+=n;t.st.frostT=4;
  if(t.st.frost>=3){t.st.frost=0;applyCC(src,t,{t:"stun",d:1});fxBurst(t.x,t.y,"#dff0ff",14,140);fxText(t.x,t.y-t.r-30,"Gelé","#9fd8ff");}
}
function addBuff(t,id,stats,d){
  for(var i=0;i<t.buffs.length;i++)if(t.buffs[i].id===id){t.buffs[i].t=d;t.buffs[i].s=stats;recalc(t);return;}
  t.buffs.push({id:id,s:stats,t:d});recalc(t);
}
function addDot(t,src,dps,d){t.dots=t.dots||[];t.dots.push({src:src,dps:dps,t:d});}

function towerAggro(att,victim){
  G.units.forEach(function(tw){
    if(tw.kind!=="tower"||tw.dead||tw.team!==victim.team)return;
    if(dist(tw.x,tw.y,att.x,att.y)<tw.range+att.r+40){tw.target=att;tw.focusT=2.5;}
  });
}

// ---------------------------------------------------------------------
// Mort, récompenses
// ---------------------------------------------------------------------
function killUnit(t,src){
  if(t.dead)return;
  if(t.isPlayer&&t.bonus.revive&&!t.reviveUsed){
    t.reviveUsed=true;t.hp=t.maxHp*0.3;t.st.invuln=1;fxBurst(t.x,t.y,"#39FF7A",40,260);announce("Deuxième vie","good");return;
  }
  t.dead=true;t.hp=0;t.deathT=G.time;
  fxDeath(t);
  var killerChamp=src&&src.kind==="champ"?src:null;
  if(t.kind==="champ"){
    t.deaths++;t.streak=0;
    var base=t.isBoss?0:Math.round(7+t.lvl*1.8);
    t.respawnT=G.mode==="arena"?5+t.lvl*0.4:base;
    if(t.isPlayer&&t.bonus.respawn)t.respawnT*=1-t.bonus.respawn;
    if(G.mode==="boss"&&t.team===0)t.respawnT=12;
    var assists=[];
    for(var id in t.lastHitBy){
      if(G.time-t.lastHitBy[id]<10){var a=unitById(+id);if(a&&a!==killerChamp&&a.kind==="champ")assists.push(a);}
    }
    t.lastHitBy={};
    var bounty=300;
    if(killerChamp){
      killerChamp.kills++;killerChamp.streak++;
      killerChamp.multi=(G.time-killerChamp.multiT<10)?killerChamp.multi+1:1;killerChamp.multiT=G.time;
      giveGold(killerChamp,bounty,t);
      if(killerChamp.key==="BABA")babaReset(killerChamp);
      if(killerChamp.bonus.cdKill)killerChamp.cds=killerChamp.cds.map(function(c){return c*(1-killerChamp.bonus.cdKill);});
    }
    assists.forEach(function(a){a.assists++;giveGold(a,150,t);if(a.key==="BABA")babaReset(a);});
    shareXp(t,140+t.lvl*30,killerChamp);
    if(killerChamp)G.teamKills[killerChamp.team]++;
    else G.teamKills[t.team===0?1:0]++;
    killFeed(killerChamp||src,t);
    if(killerChamp&&killerChamp.isPlayer){
      G.stats.kills++;
      var names=["","","Doublé !","Triplé !","Quadruplé !","QUINTUPLÉ !"];
      if(killerChamp.multi>=2)announce(names[Math.min(5,killerChamp.multi)],"kill");
      if(killerChamp.multi>=5)G.stats.penta++;
      hitStop(0.08);
    }
    if(!G.firstBlood){G.firstBlood=true;announce("Premier sang !","kill");}
    if(t.isPlayer){G.stats.deaths++;sfx("death");}
    if(t.isBoss){G.bossDead=true;announce(t.name+" est vaincu","good");shake(18);}
  }else if(t.kind==="minion"){
    if(killerChamp){giveGold(killerChamp,t.gold,t);killerChamp.cs++;if(killerChamp.isPlayer)G.stats.cs++;}
    shareXp(t,t.xpv,null);
    if(t.team===1&&G.affix.explosif){zoneTelegraph({x:t.x,y:t.y,r:110,delay:0.6,team:1,src:null,dmg:60+G.time*0.3,color:"#ff6a2a"});}
    if(t.summoned&&t.owner)t.gold=0;
  }else if(t.kind==="monster"){
    if(killerChamp){
      giveGold(killerChamp,t.gold,t);killerChamp.cs+=t.big?4:2;
      if(killerChamp.isPlayer)G.stats.camps++;
      if(t.buff==="bless"){
        G.units.forEach(function(u){if(u.kind==="champ"&&u.team===killerChamp.team&&!u.dead)addBuff(u,"bless",{atkP:0.2,ms:20},90);});
        announce(killerChamp.team===0?"Bénédiction du Banco pour ton équipe":"L'Empire reçoit la bénédiction",killerChamp.team===0?"good":"bad");
      }else if(t.buff==="red")addBuff(killerChamp,"red",{atk:15},75);
      else if(t.buff==="blue")addBuff(killerChamp,"blue",{as:0.15},75);
    }
    shareXp(t,t.xpv,killerChamp);
    G.camps.forEach(function(c){if(c.unit===t)c.respawn=G.time+(t.big?150:80);});
  }else if(t.kind==="tower"){
    G.teamTowers[t.team===0?1:0]++;
    G.units.forEach(function(u){if(u.kind==="champ"&&u.team!==t.team)giveGold(u,t.gold,null);});
    if(t.team===1)G.stats.towers++;
    announce(t.team===1?"Tour ennemie détruite":"Une de tes tours est tombée",t.team===1?"good":"bad");
    shake(14);sfx("tower");
    G.units.forEach(function(u){if(u.protectedBy===t)u.protectedBy=null;});
  }else if(t.kind==="nexus"){
    shake(26);hitStop(0.25);
    endMatchSoon(t.team===1);
  }
}
function babaReset(u){u.cds=u.cds.map(function(c){return c*0.4;});addBuff(u,"show",{ms:60},2);}
function unitById(id){for(var i=0;i<G.units.length;i++)if(G.units[i].id===id)return G.units[i];return null;}
function giveGold(u,g,from){
  if(u.bonus&&u.bonus.goldP)g*=1+u.bonus.goldP;
  u.gold+=g;
  if(u.isPlayer&&from){fxText(from.x,from.y-from.r-6,"+"+Math.round(g)+" or","#ffd24a");G.stats.gold+=g;}
}
function shareXp(dead,amount,killer){
  var list=G.units.filter(function(u){return u.kind==="champ"&&!u.dead&&u.team!==dead.team&&dist(u.x,u.y,dead.x,dead.y)<1000;});
  if(killer&&list.indexOf(killer)<0&&!killer.dead)list.push(killer);
  if(!list.length)return;
  var each=amount*(list.length>1?1.25:1)/list.length;
  list.forEach(function(u){gainXp(u,each);});
}

// ---------------------------------------------------------------------
// Capacités
// ---------------------------------------------------------------------
function abilityCdLeft(u,i){return u.cds[i];}
function canCast(u,i){
  var ab=u.d.abil[i];
  if(u.dead||u.st.stun>0||u.st.silence>0||u.recall>0&&false)return false;
  if(u.ranks[i]<1||u.cds[i]>0)return false;
  if(u.mana<ab.cost&&!u.isBoss)return false;
  return true;
}
function rv(arr,r){return Array.isArray(arr)?arr[Math.max(0,Math.min(arr.length-1,r-1))]:arr;}
function castAbility(u,i,tx,ty,tu){
  if(!canCast(u,i))return false;
  var ab=u.d.abil[i],r=u.ranks[i];
  var cdr=u.ah/(u.ah+100);
  u.cds[i]=rv(ab.cd,r)*(1-cdr)*(u.isBoss?0.6:1);
  if(!u.isBoss)u.mana-=ab.cost;
  u.recall=0;
  var dmg=ab.dmg?rv(ab.dmg,r)+(ab.ratio||0)*u.atk:0;
  if(ab.ult&&u.bonus.ultDmg)dmg*=1+u.bonus.ultDmg;
  if(u.isBoss)dmg*=1.2;
  var ang=Math.atan2(ty-u.y,tx-u.x);
  if(!isFinite(ang))ang=u.face>0?0:Math.PI;
  var dx=Math.cos(ang),dy=Math.sin(ang);
  var range=ab.range||0;
  var d0=dist(u.x,u.y,tx,ty);
  var px=u.x+dx*Math.min(d0,range),py=u.y+dy*Math.min(d0,range);
  u.face=dx>=0?1:-1;
  u.anim.cast=1;
  var col=ab.color||u.d.fx||"#fff";
  var ctx={src:u,ab:ab,r:r,dmg:dmg,color:col};
  u.empower=(u.key==="SAM")?1:u.empower;
  if(ab.ult){if(u.isPlayer){G.stats.ults++;shake(8);}fxRing(u.x,u.y,u.r+50,col,0.5);}
  sfx(ab.ult?"ult":"cast",u);

  switch(ab.type){
    case "shot":
      spawnProj({x:u.x+dx*u.r,y:u.y+dy*u.r-10,dx:dx,dy:dy,speed:ab.speed,range:range,width:ab.width,team:u.team,src:u,
        dmg:dmg,pierce:ab.pierce,explode:ab.explode,cc:ab.cc,frost:ab.frost,color:col,ability:true,skill:true});
      break;
    case "circle":
      zoneTelegraph({x:px,y:py,r:ab.radius,delay:ab.delay||0.5,team:u.team,src:u,dmg:dmg,cc:ab.cc,frost:ab.frost,color:col,ult:ab.ult,ability:true});
      break;
    case "line":
      lineTelegraph({x:u.x,y:u.y,dx:dx,dy:dy,len:range,w:ab.width,delay:ab.delay||0.6,team:u.team,src:u,dmg:dmg,cc:ab.cc,color:col,ult:ab.ult});
      u.st.root=Math.max(u.st.root,ab.delay||0.6);
      break;
    case "cone":
      fxCone(u.x,u.y,ang,ab.range,ab.angle,col);
      unitsNear(u.x,u.y,ab.range,function(o){return isHostile(u,o)&&targetable(o);}).forEach(function(o){
        var a=Math.atan2(o.y-u.y,o.x-u.x);var da=Math.abs(((a-ang+Math.PI*3)%(Math.PI*2))-Math.PI);
        if(da<=ab.angle/2+0.15){
          applyDamage(u,o,dmg,{ability:true,drain:ab.drain});applyCC(u,o,ab.cc);
          if(ab.debuff)addBuff(o,"debuff"+u.id,{arm:ab.debuff.arm},ab.debuff.d);
          fxHit(o.x,o.y,col,true);
        }
      });
      break;
    case "dash":
      var dd=Math.min(d0,range);if(dd<60)dd=Math.min(range,160);
      if(tu&&isHostile(u,tu)){dd=Math.max(0,edgeDist(u,tu)-6);}
      u.dash={dx:dx,dy:dy,left:dd,speed:1500,ctx:ctx,hit:{}};
      u.st.invuln=Math.max(u.st.invuln,0);
      break;
    case "blink":
      var ox=u.x,oy=u.y;
      if(ab.from){zoneTelegraph({x:ox,y:oy,r:ab.radius,delay:0.05,team:u.team,src:u,dmg:dmg,cc:ab.cc,frost:ab.frost,color:col,ability:true});}
      fxBurst(ox,oy,col,26,220);
      u.x=clamp(px,G.bx0,G.bx1);u.y=clamp(py,G.by0,G.by1);pushOut(u);
      u.blinkFx=0.35;
      fxBurst(u.x,u.y,col,30,260);
      if(!ab.from)zoneTelegraph({x:u.x,y:u.y,r:ab.radius,delay:0.12,team:u.team,src:u,dmg:dmg,cc:ab.cc,frost:ab.frost,color:col,ult:ab.ult,ability:true});
      if(ab.buff)addBuff(u,"ab"+i,buffStats(ab.buff,r),ab.buff.d);
      if(ab.ult)shake(10);
      break;
    case "nova":
      var fire=function(){
        if(u.dead)return;
        fxNova(u.x,u.y,ab.radius,col);
        if(ab.team==="ally"){
          unitsNear(u.x,u.y,ab.radius,function(o){return o.team===u.team&&o.kind==="champ";}).forEach(function(o){
            if(ab.heal)heal(u,o,rv(ab.heal,r)+u.atk*0.4);
            if(ab.shield)giveShield(o,rv(ab.shield,r),3);
          });
        }else{
          unitsNear(u.x,u.y,ab.radius,function(o){return isHostile(u,o)&&targetable(o);}).forEach(function(o){
            applyDamage(u,o,dmg,{ability:true});applyCC(u,o,ab.cc);
            if(ab.frost)addFrost(u,o,ab.frost);
            if(ab.taunt&&o.kind==="champ"){o.st.taunt=ab.taunt;o.st.tauntBy=u;}
            if(ab.taunt&&o.kind==="minion")o.target=u;
          });
        }
        if(ab.buff)addBuff(u,"ab"+i,buffStats(ab.buff,r),ab.buff.d);
        if(ab.ult)shake(12);
      };
      if(ab.delay){fxCharge(u,ab.radius,ab.delay,col);later(ab.delay,fire);}else fire();
      break;
    case "self":
      if(ab.shield)giveShield(u,rv(ab.shield,r)+(ab.shieldR||0)*u.maxHp,3);
      if(ab.buff){
        var bs=buffStats(ab.buff,r);addBuff(u,"ab"+i,bs,ab.buff.d);
        if(ab.buff.veil){u.st.veil=ab.buff.d;}
      }
      fxRing(u.x,u.y,u.r+26,col,0.6);fxBurst(u.x,u.y,col,16,120);
      break;
    case "ally":
      var best=null,bs2=1.01;
      unitsNear(u.x,u.y,range,function(o){return o.team===u.team&&o.kind==="champ";}).forEach(function(o){
        var f=o.hp/o.maxHp;if(tu===o)f-=1;if(f<bs2){bs2=f;best=o;}
      });
      best=best||u;
      heal(u,best,rv(ab.heal,r)+(ab.healR||0)*best.maxHp+u.atk*0.3);
      if(ab.buff)addBuff(best,"ally"+i,buffStats(ab.buff,r),ab.buff.d);
      fxBeam(u.x,u.y-20,best.x,best.y-20,col,0.35);
      fxBurst(best.x,best.y,col,18,140);
      break;
    case "zone":
      G.zones.push({x:px,y:py,r:ab.radius,t:ab.dur,tick:ab.tick,acc:0,team:u.team,src:u,
        dmg:ab.dmg?rv(ab.dmg,r)+u.atk*0.15:0,heal:ab.heal?rv(ab.heal,r):0,cc:ab.cc,color:col,max:ab.dur});
      break;
    case "summon":
      var s=makeMinion(u.team,"elite",null);
      s.summoned=true;s.owner=u;s.x=u.x+dx*50;s.y=u.y+dy*50;s.life=ab.dur;
      s.maxHp=s.hp=u.maxHp*0.5;s.atk=u.atk*rv(ab.power,r)*1.4;s.arm=u.arm;s.ms=u.ms+20;s.range=80;s.as=1.1;s.gold=0;s.xpv=0;
      s.ghost=col;s.look=u.look;
      G.units.push(s);fxBurst(s.x,s.y,col,24,200);
      break;
  }
  if(ab.type!=="blink"&&ab.type!=="nova"&&ab.buff&&ab.type!=="self"&&ab.type!=="ally")addBuff(u,"ab"+i,buffStats(ab.buff,r),ab.buff.d);
  return true;
}
function buffStats(b,r){var s={};for(var k in b){if(k==="d"||k==="veil")continue;s[k]=rv(b[k],r);}return s;}
function later(t,fn){G.timers.push({t:t,fn:fn});}

function castSpell(u,id,tx,ty){
  if(u.dead||u.spells[id]>0||u.st.stun>0)return false;
  u.spells[id]=SPELLS[id].cd;
  if(id==="saut"){
    var a=Math.atan2(ty-u.y,tx-u.x),dd=Math.min(260,dist(u.x,u.y,tx,ty));
    fxBurst(u.x,u.y,"#ffe27a",20,200);
    u.x=clamp(u.x+Math.cos(a)*dd,G.bx0,G.bx1);u.y=clamp(u.y+Math.sin(a)*dd,G.by0,G.by1);pushOut(u);
    fxBurst(u.x,u.y,"#ffe27a",20,200);u.blinkFx=0.3;
  }else{
    heal(u,u,u.maxHp*0.25);addBuff(u,"souffle",{ms:80},2);fxRing(u.x,u.y,u.r+30,"#5dff9a",0.6);
    unitsNear(u.x,u.y,400,function(o){return o.team===u.team&&o.kind==="champ"&&o!==u;}).slice(0,1).forEach(function(o){heal(u,o,o.maxHp*0.15);});
  }
  sfx("cast",u);
  return true;
}

// ---------------------------------------------------------------------
// Projectiles et zones
// ---------------------------------------------------------------------
function spawnProj(p){p.trav=0;p.hit={};p.t=0;G.projs.push(p);}
function zoneTelegraph(z){z.kind="circle";z.t=0;G.teles.push(z);}
function lineTelegraph(z){z.kind="line";z.t=0;G.teles.push(z);}
function updateProjs(dt){
  for(var i=G.projs.length-1;i>=0;i--){
    var p=G.projs[i];p.t+=dt;
    if(p.homing){
      var h=p.homing;
      if(h.dead){G.projs.splice(i,1);continue;}
      var a=Math.atan2(h.y-p.y,h.x-p.x);p.dx=Math.cos(a);p.dy=Math.sin(a);
      var step=p.speed*dt;
      if(dist(p.x,p.y,h.x,h.y)<=step+h.r){
        applyDamage(p.src,h,p.dmg,{basic:true,crit:p.crit,proj:true});
        if(p.src&&p.src.key==="SAM"&&p.emp)fxBurst(h.x,h.y,"#16c8bd",14,160);
        fxHit(h.x,h.y,p.color,p.crit);
        G.projs.splice(i,1);continue;
      }
      p.x+=p.dx*step;p.y+=p.dy*step;
      if(Math.random()<0.6)fxTrail(p.x,p.y,p.color,p.size||3);
      continue;
    }
    var st=p.speed*dt;p.x+=p.dx*st;p.y+=p.dy*st;p.trav+=st;
    fxTrail(p.x,p.y,p.color,p.width*0.18);
    var done=false;
    for(var j=0;j<G.units.length;j++){
      var u=G.units[j];
      if(u.dead||u.team===p.team||p.hit[u.id]||!targetable(u))continue;
      if(u.kind==="nexus")continue;
      if(dist2(p.x,p.y,u.x,u.y)<(u.r+p.width/2)*(u.r+p.width/2)){
        p.hit[u.id]=1;
        if(p.explode){
          fxNova(p.x,p.y,p.explode,p.color);
          unitsNear(p.x,p.y,p.explode,function(o){return o.team!==p.team&&targetable(o);}).forEach(function(o){
            applyDamage(p.src,o,p.dmg,{ability:true,proj:true});applyCC(p.src,o,p.cc);
          });
          done=true;break;
        }
        var dealt=applyDamage(p.src,u,p.dmg,{ability:true,proj:true});
        applyCC(p.src,u,p.cc);
        if(p.frost)addFrost(p.src,u,p.frost);
        fxHit(u.x,u.y,p.color,true);
        if(!p.pierce){done=true;break;}
      }
    }
    if(done||p.trav>=p.range||p.x<0||p.y<0||p.x>G.W||p.y>G.H){
      if(!done)fxBurst(p.x,p.y,p.color,6,80);
      G.projs.splice(i,1);
    }
  }
  for(var k=G.teles.length-1;k>=0;k--){
    var z=G.teles[k];z.t+=dt;
    if(z.t>=z.delay){
      G.teles.splice(k,1);
      if(z.kind==="circle"){
        fxNova(z.x,z.y,z.r,z.color,z.ult);
        if(z.ult||z.r>200)shake(z.ult?14:6);
        unitsNear(z.x,z.y,z.r,function(o){return o.team!==z.team&&targetable(o);}).forEach(function(o){
          applyDamage(z.src,o,z.dmg,{ability:true});applyCC(z.src,o,z.cc);if(z.frost)addFrost(z.src,o,z.frost);
        });
      }else{
        fxLine(z.x,z.y,z.dx,z.dy,z.len,z.w,z.color);
        if(z.ult)shake(14);
        G.units.forEach(function(o){
          if(o.dead||o.team===z.team||!targetable(o))return;
          var rx=o.x-z.x,ry=o.y-z.y,along=rx*z.dx+ry*z.dy;
          if(along<-o.r||along>z.len+o.r)return;
          var perp=Math.abs(rx*-z.dy+ry*z.dx);
          if(perp<=z.w/2+o.r){applyDamage(z.src,o,z.dmg,{ability:true});applyCC(z.src,o,z.cc);}
        });
      }
    }
  }
  for(var q=G.zones.length-1;q>=0;q--){
    var zn=G.zones[q];zn.t-=dt;zn.acc+=dt;
    if(zn.acc>=zn.tick){
      zn.acc-=zn.tick;
      unitsNear(zn.x,zn.y,zn.r,null).forEach(function(o){
        if(o.team===zn.team){if(zn.heal&&o.kind==="champ")heal(zn.src,o,zn.heal,true);}
        else if(targetable(o)){if(zn.dmg)applyDamage(zn.src,o,zn.dmg,{ability:true});applyCC(zn.src,o,zn.cc);}
      });
    }
    if(zn.t<=0)G.zones.splice(q,1);
  }
}

// ---------------------------------------------------------------------
// Construction des cartes
// ---------------------------------------------------------------------
function laneY(x){return G.H/2+Math.sin(x/620)*110;}
function addProp(x,y,r,type,solid){G.props.push({x:x,y:y,r:r,type:type,solid:solid,seed:Math.random()});if(solid)G.obst.push({x:x,y:y,r:r*0.7});}
function scatterProps(n,avoid){
  var t=G.theme.prop,tries=0;
  while(n>0&&tries++<n*20){
    var x=rand(40,G.W-40),y=rand(40,G.H-40);
    if(avoid(x,y))continue;
    var bad=false;
    for(var i=0;i<G.props.length;i++)if(dist2(x,y,G.props[i].x,G.props[i].y)<120*120){bad=true;break;}
    if(bad)continue;
    addProp(x,y,rand(26,48),t,true);n--;
  }
}
function buildSiege(){
  G.W=4400;G.H=1500;
  var path=[];for(var x=260;x<=G.W-260;x+=110)path.push({x:x,y:laneY(x)});
  G.path=path;
  G.fount=[{x:180,y:laneY(180)},{x:G.W-180,y:laneY(G.W-180)}];
  var towerHp=3000*(G.affix.rempart?1.5:1);
  var t0a=makeTower(0,1650,laneY(1650)-70,1),t0b=makeTower(0,950,laneY(950)+60,2);
  var t1a=makeTower(1,G.W-1650,laneY(G.W-1650)+70,1,towerHp*G.towerMult),t1b=makeTower(1,G.W-950,laneY(G.W-950)-60,2,towerHp*G.towerMult);
  var n0=makeNexus(0,520,laneY(520)),n1=makeNexus(1,G.W-520,laneY(G.W-520),4500*G.towerMult);
  t0b.protectedBy=t0a;n0.protectedBy=t0b;t1b.protectedBy=t1a;n1.protectedBy=t1b;
  [t0a,t0b,t1a,t1b,n0,n1].forEach(function(u){G.units.push(u);});
  G.nexus=[n0,n1];
  // Camps de la forêt
  [[1350,250,"red"],[1350,G.H-250,"blue"],[G.W-1350,250,"blue"],[G.W-1350,G.H-250,"red"],[G.W/2,150,"bless"]].forEach(function(c){
    G.camps.push({x:c[0],y:c[1],buff:c[2],big:c[2]==="bless",respawn:c[2]==="bless"?90:30,unit:null});
  });
  // Buissons
  [[1250,-250],[1250,250],[G.W/2,-260],[G.W/2,260],[G.W-1250,-250],[G.W-1250,250],[2000,-420],[G.W-2000,420]].forEach(function(b){
    G.brush.push({x:b[0],y:laneY(b[0])+b[1],r:95,seed:Math.random()});
  });
  // Rivière décorative au centre
  G.river={x:G.W/2,w:170};
  scatterProps(70,function(x,y){
    if(Math.abs(y-laneY(x))<260)return true;
    if(x<700||x>G.W-700)return true;
    for(var i=0;i<G.camps.length;i++)if(dist2(x,y,G.camps[i].x,G.camps[i].y)<220*220)return true;
    for(var j=0;j<G.brush.length;j++)if(dist2(x,y,G.brush[j].x,G.brush[j].y)<170*170)return true;
    return Math.abs(x-G.W/2)<140;
  });
  G.nextWave=4;G.waveN=0;
}
function buildArena(){
  G.W=2600;G.H=1700;
  G.fount=[{x:200,y:G.H/2},{x:G.W-200,y:G.H/2}];
  [[G.W/2,G.H/2-330],[G.W/2,G.H/2+330],[850,480],[850,G.H-480],[G.W-850,480],[G.W-850,G.H-480]].forEach(function(p){addProp(p[0],p[1],58,"pillar",true);});
  [[G.W/2-260,G.H/2],[G.W/2+260,G.H/2],[600,250],[600,G.H-250],[G.W-600,250],[G.W-600,G.H-250]].forEach(function(b){G.brush.push({x:b[0],y:b[1],r:105,seed:Math.random()});});
  G.orbT=20;G.orb=null;
  G.killGoal=8+G.teamSize*3;
  G.timeLimit=480;
  scatterProps(24,function(x,y){return (x>300&&x<G.W-300&&y>160&&y<G.H-160);});
}
function buildDefense(){
  G.W=3200;G.H=1900;
  G.fount=[{x:180,y:G.H/2},{x:G.W-150,y:G.H/2}];
  var n0=makeNexus(0,480,G.H/2,6000);
  var ta=makeTower(0,950,G.H/2-360,1,3600),tb=makeTower(0,950,G.H/2+360,1,3600),tc=makeTower(0,1500,G.H/2,1,3600);
  [n0,ta,tb,tc].forEach(function(u){G.units.push(u);});
  G.nexus=[n0,null];
  G.paths=[];
  [-600,0,600].forEach(function(off){
    var p=[];for(var x=G.W-180;x>=480;x-=100){var k=(x-480)/(G.W-660);p.push({x:x,y:G.H/2+off*Math.min(1,k*1.4)+Math.sin(x/300)*30*k});}
    G.paths.push(p.reverse());
  });
  G.waveTotal=8+Math.floor(G.num/10)+(G.floor?Math.floor(G.floor/10):0);
  G.waveN=0;G.nextWave=6;
  [[1250,G.H/2-620],[1250,G.H/2+620],[2100,G.H/2-320],[2100,G.H/2+320]].forEach(function(b){G.brush.push({x:b[0],y:b[1],r:100,seed:Math.random()});});
  scatterProps(40,function(x,y){
    if(x<260)return true;
    for(var i=0;i<G.paths.length;i++){for(var j=0;j<G.paths[i].length;j+=2){if(dist2(x,y,G.paths[i][j].x,G.paths[i][j].y)<170*170)return true;}}
    return dist2(x,y,480,G.H/2)<400*400;
  });
}
function buildBoss(){
  G.W=2600;G.H=2100;
  G.fount=[{x:G.W/2,y:G.H-170},{x:G.W/2,y:220}];
  G.arenaR=880;G.cx=G.W/2;G.cy=G.H/2+40;
  [[0,-1],[0.87,0.5],[-0.87,0.5]].forEach(function(v){addProp(G.cx+v[0]*520,G.cy+v[1]*520,50,"pillar",true);});
  G.brush.push({x:G.cx-620,y:G.cy+200,r:95,seed:0.3});G.brush.push({x:G.cx+620,y:G.cy+200,r:95,seed:0.6});
  G.bossPat=3;G.bossPhase=0;G.timeLimit=600;
}

// ---------------------------------------------------------------------
// Création de la partie
// ---------------------------------------------------------------------
function playerBonus(key){
  var t=talentBonus(),r=relicBonus(),ml=masteryLvl(key);
  var b={};
  [t,r].forEach(function(o){for(var k in o)b[k]=(b[k]||0)+o[k];});
  var mp=ml*0.015;
  b.hpP=(b.hpP||0)+mp;b.atkP=(b.atkP||0)+mp;
  return b;
}
function newMatch(cfg){
  UID=1;
  var diff=DIFFS[cfg.diff||0];
  var num=cfg.num||1;
  var acteIdx=cfg.acteIdx||0;
  G={cfg:cfg,mode:cfg.mode,mission:cfg.mission||null,diff:diff,num:num,floor:cfg.floor||0,
    theme:THEMES[cfg.themeIdx!=null?cfg.themeIdx:acteIdx],acteIdx:acteIdx,
    units:[],projs:[],teles:[],zones:[],fx:[],texts:[],props:[],obst:[],brush:[],camps:[],timers:[],
    time:0,teamKills:[0,0],teamTowers:[0,0],over:false,paused:false,stop:0,shakeA:0,
    affix:{},stats:{kills:0,deaths:0,towers:0,cs:0,ults:0,camps:0,healed:0,gold:0,penta:0},
    cam:{x:0,y:0,z:1},announceQ:[],feed:[],teamSize:1+cfg.allies.length};
  (cfg.affixes||[]).forEach(function(a){G.affix[a]=true;});
  var power=cfg.floor?(0.95+cfg.floor*0.022):(0.9+num*0.01);
  power*=diff.mult;
  G.foeMult=power;G.minionMult=0.9+(power-1)*0.8;G.towerMult=0.9+(power-1)*0.6;G.monsterMult=0.9+(power-1)*0.5;
  G.bossHpMult=1;
  G.aiSkill=clamp(diff.ai+(cfg.floor?cfg.floor*0.006:num*0.004),0.3,1);
  if(G.mode==="siege")buildSiege();
  else if(G.mode==="arena")buildArena();
  else if(G.mode==="defense")buildDefense();
  else buildBoss();
  G.bx0=40;G.by0=40;G.bx1=G.W-40;G.by1=G.H-40;

  // Équipe alliée
  var pb=playerBonus(cfg.champ);
  var player=makeChamp(cfg.champ,0,{player:true,bonus:pb,skin:skinFor(cfg.champ).tint||null});
  G.player=player;
  var allyBonus={hpP:(pb.hpP||0)*0.5,atkP:(pb.atkP||0)*0.5};
  var team0=[player];
  cfg.allies.forEach(function(k){team0.push(makeChamp(k,0,{skill:clamp(0.55+diff.ai*0.3,0,0.9),bonus:allyBonus}));});
  // Équipe ennemie
  var pool=cfg.foes;
  var nFoes=cfg.foeCount;
  var team1=[];
  for(var i=0;i<nFoes;i++){
    var fk=pool[i%pool.length];
    var fu=makeChamp(fk,1,{skill:G.aiSkill,mult:power*(G.affix.titan?1.25:1)});
    if(i>=pool.length){fu.name=fu.name+" ("+(["II","III","IV","V"][i-pool.length]||"")+")";}
    team1.push(fu);
  }
  if(G.mode==="boss"){
    G.bossHpMult=5+G.teamSize*1.6;
    var bk=cfg.boss;
    var boss=makeChamp(bk,1,{skill:Math.min(1,G.aiSkill+0.1),mult:power,boss:true});
    boss.ranks=[5,5,5,3];boss.lvl=Math.min(18,6+Math.floor(num/3));recalc(boss,true);
    boss.name=CHAMPS[bk].name;
    G.boss=boss;team1.unshift(boss);
    team1=team1.slice(0,1+Math.max(0,G.teamSize-2));
  }
  // positions
  function place(list,team){
    list.forEach(function(u,i){
      var f=G.fount[team];
      u.home={x:f.x,y:f.y};
      if(G.mode==="boss"&&team===1){u.x=G.cx+(i===0?0:(i%2?-1:1)*220);u.y=G.cy-(i===0?120:40);u.home={x:u.x,y:u.y};}
      else if(G.mode==="defense"&&team===1){u.x=-9999;u.y=-9999;u.dead=true;u.pending=true;}
      else{var a=(i-(list.length-1)/2)*0.5;u.x=f.x+(team===0?60:-60)+Math.sin(a)*20;u.y=f.y+i*50-(list.length-1)*25;}
      u.anim.spawn=1;
      G.units.push(u);
    });
  }
  place(team0,0);place(team1,1);
  if(G.mode==="defense"){G.foeQueue=team1.slice();}
  // tuiles de passage des tours (siège)
  G.units.forEach(function(u){u.brushRef=null;});
  G.cam.x=player.x;G.cam.y=player.y;
  G.ambient=[];
  if(G.mode!=="defense"&&G.mode!=="boss"){}
  G.objective=MODE_INFO[G.mode].desc;
  return G;
}

// ---------------------------------------------------------------------
// Vagues et objectifs
// ---------------------------------------------------------------------
function spawnWave(){
  G.waveN++;
  var types=["melee","melee","melee","caster","caster","caster"];
  if(G.waveN%3===0)types.splice(3,0,"siege");
  if(G.affix.horde)types.push("melee","caster");
  [0,1].forEach(function(team){
    types.forEach(function(tp,i){
      later(i*0.55,function(){
        if(G.over)return;
        var m=makeMinion(team,tp,G.path);
        var p=G.path[team===0?0:G.path.length-1];
        m.x=p.x+(team===0?1:-1)*(80+rand(-10,10));m.y=p.y+rand(-24,24);m.wp=team===0?1:G.path.length-2;
        G.units.push(m);
      });
    });
  });
  if(G.cfg.extra&&G.waveN%2===0){
    for(var e=0;e<Math.min(3,G.cfg.extra);e++){
      later(4+e*0.6,function(){
        if(G.over)return;
        var m=makeMinion(1,"elite",G.path);var p=G.path[G.path.length-1];
        m.x=p.x-90;m.y=p.y+rand(-30,30);m.wp=G.path.length-2;G.units.push(m);
      });
    }
  }
}
function spawnDefWave(){
  G.waveN++;
  var n=5+G.waveN+(G.affix.horde?3:0);
  var elites=Math.floor(G.waveN/2)+(G.cfg.extra||0);
  var list=[];
  for(var i=0;i<n;i++)list.push(i%3===2?"caster":"melee");
  if(G.waveN%2===0)list.push("siege");
  for(var e=0;e<elites;e++)list.push("elite");
  list.forEach(function(tp,i){
    later(i*0.45,function(){
      if(G.over)return;
      var path=G.paths[i%3];
      var m=makeMinion(1,tp,path);
      m.maxHp=m.hp=Math.round(m.hp*(1+G.waveN*0.08));
      var p=path[path.length-1];m.x=p.x+rand(-20,20);m.y=p.y+rand(-30,30);m.wp=path.length-2;
      G.units.push(m);
    });
  });
  // champions ennemis : entrent en jeu aux vagues 3, 5, 7...
  if(G.waveN>=3&&G.waveN%2===1&&G.foeQueue.length){
    var f=G.foeQueue.shift();
    later(2,function(){
      if(G.over)return;
      f.dead=false;f.pending=false;f.hp=f.maxHp;
      var lv=Math.min(18,G.player.lvl+(G.diff.id));while(f.lvl<lv){f.lvl++;f.sp++;}recalc(f,true);aiSpendPoints(f);
      f.x=G.W-160;f.y=G.H/2+rand(-300,300);f.home={x:G.W-150,y:G.H/2};
      f.gold=500+G.waveN*350;aiShop(f,true);
      fxBurst(f.x,f.y,f.d.fx,40,300);
      announce(f.name+" entre dans la bataille","bad");
    });
  }
  announce("Vague "+G.waveN+" / "+G.waveTotal,"info");
}
function updateObjectives(dt){
  var m=G.mode;
  if(m==="siege"){
    G.nextWave-=dt;
    if(G.nextWave<=0){G.nextWave=30;spawnWave();}
    var stl=Math.max(0,1500-G.time);
    G.objective="Tours : "+G.teamTowers[0]+"/2 détruites · Vague "+G.waveN+(stl<300?" · "+fmtTime(stl):"");
    if(stl<=0&&!G.over){
      var na=G.nexus[0],nb=G.nexus[1];
      endMatchSoon(G.teamTowers[0]>G.teamTowers[1]||(G.teamTowers[0]===G.teamTowers[1]&&nb.hp/nb.maxHp<=na.hp/na.maxHp));
    }
  }else if(m==="arena"){
    G.orbT-=dt;
    if(G.orbT<=0&&!G.orb){G.orb={x:G.W/2,y:G.H/2,t:0};announce("La Pierre de pouvoir apparaît au centre","info");}
    if(G.orb){
      G.orb.t+=dt;
      var near=unitsNear(G.orb.x,G.orb.y,40,function(u){return u.kind==="champ";});
      if(near.length){
        var u=near[0];
        G.units.forEach(function(o){if(o.kind==="champ"&&o.team===u.team&&!o.dead){addBuff(o,"orb",{atkP:0.25,ms:30},30);heal(o,o,o.maxHp*0.3);}});
        fxNova(G.orb.x,G.orb.y,260,G.theme.acc);
        announce(u.team===0?"Ton équipe capture la Pierre":"L'Empire capture la Pierre",u.team===0?"good":"bad");
        G.orb=null;G.orbT=40;
      }
    }
    var tl=Math.max(0,G.timeLimit-G.time);
    G.objective="Score "+G.teamKills[0]+" – "+G.teamKills[1]+" · objectif "+G.killGoal+" · "+fmtTime(tl);
    if(G.teamKills[0]>=G.killGoal)endMatchSoon(true);
    else if(G.teamKills[1]>=G.killGoal)endMatchSoon(false);
    else if(tl<=0)endMatchSoon(G.teamKills[0]>G.teamKills[1]);
  }else if(m==="defense"){
    var enemiesLeft=G.units.filter(function(u){return u.team===1&&!u.dead&&(u.kind==="minion"||u.kind==="champ");}).length;
    G.nextWave-=dt;
    if(G.waveN<G.waveTotal&&(G.nextWave<=0||(enemiesLeft===0&&G.nextWave<22))){G.nextWave=26;spawnDefWave();}
    G.objective="Vague "+G.waveN+" / "+G.waveTotal+" · ennemis restants "+enemiesLeft;
    if(G.waveN>=G.waveTotal&&enemiesLeft===0&&G.foeQueue.length===0&&G.timers.length===0)endMatchSoon(true);
    if(G.time>G.waveTotal*26+480&&!G.over)endMatchSoon(true); // sécurité : la défense a tenu
    if(G.waveN>=G.waveTotal&&G.foeQueue.length){ // derniers champions restants
      G.foeQueue.forEach(function(f){f.pending=false;});
      var f=G.foeQueue.shift();f.dead=false;f.hp=f.maxHp;f.x=G.W-160;f.y=G.H/2;f.gold=3000;aiShop(f,true);
      while(f.lvl<G.player.lvl){f.lvl++;f.sp++;}recalc(f,true);aiSpendPoints(f);
    }
  }else if(m==="boss"){
    bossDirector(dt);
    var tl2=Math.max(0,G.timeLimit-G.time);
    var b=G.boss;
    G.objective=b.name+" "+Math.round(b.hp/b.maxHp*100)+"% · "+fmtTime(tl2);
    if(G.bossDead&&G.units.every(function(u){return u.team!==1||u.dead||u.kind!=="champ";}))endMatchSoon(true);
    else if(G.bossDead&&!G.bossDeadT){G.bossDeadT=G.time;}
    if(G.bossDeadT&&G.time-G.bossDeadT>3)endMatchSoon(true);
    if(tl2<=0&&!G.enrage){G.enrage=true;addBuff(b,"enrage",{atkP:1,as:1},999);announce("Enragé !","bad");}
    var allDead=G.units.every(function(u){return u.team!==0||u.kind!=="champ"||u.dead;});
    if(allDead)endMatchSoon(false);
  }
}
function fmtTime(s){s=Math.max(0,Math.floor(s));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}

// ---------------------------------------------------------------------
// Directeur de boss : motifs télégraphiés
// ---------------------------------------------------------------------
function bossDirector(dt){
  var b=G.boss;if(!b||b.dead)return;
  var f=b.hp/b.maxHp;
  if(G.bossPhase===0&&f<0.66){G.bossPhase=1;giveShield(b,b.maxHp*0.12,8);announce(b.name+" se protège","bad");summonAdds(3);}
  if(G.bossPhase===1&&f<0.33){G.bossPhase=2;addBuff(b,"fury",{atkP:0.3,as:0.3,ms:30},999);announce(b.name+" entre en furie","bad");summonAdds(4);shake(16);}
  G.bossPat-=dt;
  if(G.bossPat>0||b.st.stun>0)return;
  G.bossPat=Math.max(2.2,4.6-G.bossPhase*0.9-G.aiSkill);
  var col=b.d.fx;
  var foes=G.units.filter(function(u){return u.team===0&&u.kind==="champ"&&!u.dead;});
  if(!foes.length)return;
  var dmg=b.atk*2.2;
  var r=Math.random();
  b.anim.cast=1;
  if(r<0.3){
    // anneau autour du boss
    zoneTelegraph({x:b.x,y:b.y,r:380+G.bossPhase*60,delay:1.3,team:1,src:b,dmg:dmg,color:col,cc:{t:"slow",d:1.5,p:0.4},ult:true});
  }else if(r<0.6){
    foes.forEach(function(u){
      zoneTelegraph({x:u.x+u.vx*0.5,y:u.y+u.vy*0.5,r:120,delay:1.05,team:1,src:b,dmg:dmg*0.8,color:col,cc:{t:"stun",d:0.8}});
    });
    if(G.bossPhase>=1)later(0.6,function(){foes.forEach(function(u){if(!u.dead)zoneTelegraph({x:u.x,y:u.y,r:100,delay:1,team:1,src:b,dmg:dmg*0.6,color:col});});});
  }else if(r<0.85){
    var t=foes[Math.floor(Math.random()*foes.length)];
    var a=Math.atan2(t.y-b.y,t.x-b.x);
    var n=G.bossPhase>=2?3:G.bossPhase>=1?2:1;
    for(var i=0;i<n;i++){
      var aa=a+(i-(n-1)/2)*0.45;
      lineTelegraph({x:b.x,y:b.y,dx:Math.cos(aa),dy:Math.sin(aa),len:1200,w:150,delay:1.1,team:1,src:b,dmg:dmg*1.1,color:col,cc:{t:"knock",d:0.3,p:220}});
    }
    b.st.root=1.1;
  }else{
    summonAdds(2+G.bossPhase);
  }
}
function summonAdds(n){
  var b=G.boss;
  for(var i=0;i<n;i++){
    var a=Math.random()*Math.PI*2;
    var m=makeMinion(1,i%2?"caster":"melee",null);
    m.x=b.x+Math.cos(a)*140;m.y=b.y+Math.sin(a)*140;m.free=true;
    m.maxHp=m.hp=m.hp*1.5;
    G.units.push(m);fxBurst(m.x,m.y,b.d.fx,16,160);
  }
}

var endTimer=null;
function endMatchSoon(victory){
  if(G.over)return;
  G.over=true;G.victory=victory;
  announce(victory?"VICTOIRE":"DÉFAITE",victory?"win":"lose");
  G.endIn=2.6;
}
