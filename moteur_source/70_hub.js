// =====================================================================
// ===  HUB v3 : déploiement, Éveil (talents/reliques/héros), Faille  ===
// =====================================================================
var DEPLOY={kind:"mission",m:null,diff:0,champ:"TARINE",allies:[]};
var MODE_ICO={siege:"🏰",arena:"⚔️",defense:"🛡️",boss:"👑"};
var ROLE_FR={Combattant:"Combattant",Assassin:"Assassin",Mage:"Mage",Soutien:"Soutien",Tank:"Tank"};

function unlockedChamps(){return PLAYABLE.filter(championUnlocked);}
function champCard(k,sel,extra){
  var c=CHAMPS[k],ml=masteryLvl(k);
  return '<button class="dp-ch'+(sel?" sel":"")+'" data-k="'+k+'"><img src="'+champPortrait(k)+'" alt=""><b>'+esc(c.name.split(" ")[0])+'</b><small>'+c.role+'</small>'+(ml?'<i class="ml">M'+ml+'</i>':'')+(extra||"")+'</button>';
}

// ---------------------------------------------------------------------
// Déploiement (mission ou Faille)
// ---------------------------------------------------------------------
function openDeploy(missionId,diffK){
  var m=getMission(missionId);if(!m)return;
  DEPLOY.kind="mission";DEPLOY.m=m;
  if(diffK==null){diffK=0;for(var k=2;k>=0;k--){if(diffUnlocked(m,k)&&!(save.diff[m.id]||[])[k]){diffK=k;}}if(!diffUnlocked(m,diffK))diffK=0;}
  DEPLOY.diff=diffK;
  DEPLOY.champ=championUnlocked(save.lastChamp)?save.lastChamp:"TARINE";
  DEPLOY.allies=[];
  (m.allies_requis||[]).forEach(function(a){if(save.allies_unlocked.indexOf(a)>=0&&a!==DEPLOY.champ&&CHAMPS[a])DEPLOY.allies.push(a);});
  (m.allies_dispo||[]).concat(m.allies_requis||[]).forEach(function(k){
    if(AUTO_ALLIES[k]&&save.allies_unlocked.indexOf(k)<0){save.allies_unlocked.push(k);writeSave(save);}
  });
  renderDeploy();
  goTo("screen-deploy");
  updateLivesUI();
}
function openFailleDeploy(){
  DEPLOY.kind="faille";DEPLOY.m=null;DEPLOY.diff=0;
  DEPLOY.champ=championUnlocked(save.lastChamp)?save.lastChamp:"TARINE";
  if(!DEPLOY.allies||DEPLOY.kind!=="faille")DEPLOY.allies=(save.failleAllies||[]).filter(function(k){return championUnlocked(k)&&k!==DEPLOY.champ;}).slice(0,2);
  renderDeploy();
  goTo("screen-deploy");
  updateLivesUI();
}
function allyPool(){
  if(DEPLOY.kind==="faille")return unlockedChamps();
  var m=DEPLOY.m,pool=(m.allies_dispo||[]).concat(m.allies_requis||[]);
  // la campagne propose ses alliés ; une fois la mission finie, tous les gardiens débloqués peuvent venir
  if(isMissionDone(m.id))pool=pool.concat(unlockedChamps());
  if(DEPLOY.champ!=="TARINE")pool.push("TARINE");
  return pool.filter(function(k,i){return pool.indexOf(k)===i&&CHAMPS[k]&&championUnlocked(k);});
}
function renderDeploy(){
  var body=document.querySelector("#screen-deploy .deploy-body");
  var ex=document.getElementById("dp-extra");
  if(!ex){ex=document.createElement("div");ex.id="dp-extra";body.insertBefore(ex,body.firstChild);}
  var m=DEPLOY.m,isF=DEPLOY.kind==="faille";
  var floor=save.faille.cur||1;
  var cfg=isF?failleCfg(floor,DEPLOY.champ,DEPLOY.allies):missionCfg(m,DEPLOY.diff,DEPLOY.champ,DEPLOY.allies);
  var title=isF?"La Faille — étage "+floor:m.num+". "+m.name;
  document.getElementById("deploy-mission-name").innerHTML=esc(title)+' <span class="dp-mode">'+MODE_ICO[cfg.mode]+" "+MODE_INFO[cfg.mode].name+'</span>';
  document.getElementById("deploy-brief").textContent=isF?
    "La Faille s'ouvre sous Abidjan : chaque étage renforce l'Empire et change les règles. Un boss garde chaque cinquième étage. Ton record : étage "+save.faille.best+".":m.brief;
  // champion
  var h='<div class="deploy-label">TON CHAMPION</div><div class="dp-row">';
  unlockedChamps().forEach(function(k){h+=champCard(k,k===DEPLOY.champ);});
  PLAYABLE.filter(function(k){return !championUnlocked(k);}).forEach(function(k){h+='<div class="dp-ch lock"><span>🔒</span><small>'+(k==="DARK"?"Fin de campagne ou étage 25":"À débloquer")+'</small></div>';});
  h+='</div>';
  var C=CHAMPS[DEPLOY.champ];
  h+='<div class="dp-kit"><b>'+esc(C.name)+'</b> — '+esc(C.title)+' · <em>'+C.role+'</em><div class="dp-pass">Passif · '+esc(C.passive.name)+' : '+esc(C.passive.desc)+'</div><div class="dp-abs">'+
    C.abil.map(function(a,i){return '<span title="'+esc(a.desc)+'"><i style="background:'+(a.color||C.fx)+'">'+["1","2","3","U"][i]+'</i>'+esc(a.name)+'</span>';}).join("")+'</div></div>';
  // difficulté
  if(!isF){
    h+='<div class="deploy-label">DIFFICULTÉ</div><div class="dp-diffs">';
    DIFFS.forEach(function(d,k){
      var un=diffUnlocked(m,k),done=(save.diff[m.id]||[])[k];
      h+='<button class="dp-diff d'+k+(DEPLOY.diff===k?" sel":"")+(un?"":" lock")+'" data-d="'+k+'">'+(done?"★ ":"")+d.name+'<small>'+(un?"×"+d.cauris+" cauris":k===1?"Finir l'acte":"Finir la campagne + Héroïque")+'</small></button>';
    });
    h+='</div>';
  }
  if(cfg.affixes.length){
    h+='<div class="dp-affs">'+cfg.affixes.map(function(a){var A=AFFIXES.filter(function(x){return x.id===a;})[0];return '<span><b>'+A.name+'</b> '+A.desc+'</span>';}).join("")+'</div>';
  }
  ex.innerHTML=h;
  ex.querySelectorAll(".dp-ch[data-k]").forEach(function(b){b.onclick=function(){
    DEPLOY.champ=b.dataset.k;
    DEPLOY.allies=DEPLOY.allies.filter(function(a){return a!==DEPLOY.champ;});
    sfx("ui");renderDeploy();
  };});
  ex.querySelectorAll(".dp-diff").forEach(function(b){b.onclick=function(){
    if(b.classList.contains("lock")){hubToast(b.querySelector("small").textContent);return;}
    DEPLOY.diff=+b.dataset.d;sfx("ui");renderDeploy();
  };});
  // ennemis
  var el=document.getElementById("deploy-enemies-list");
  var foes=[];for(var i=0;i<cfg.foeCount;i++)foes.push(cfg.foes[i%cfg.foes.length]);
  if(cfg.mode==="boss")foes=[cfg.boss].concat(foes.slice(0,Math.max(0,cfg.allies.length)));
  var power=Math.round((cfg.floor?(0.95+cfg.floor*0.022):(0.9+cfg.num*0.01))*DIFFS[cfg.diff].mult*100);
  el.innerHTML=foes.map(function(k,i){var c=CHAMPS[k];return '<div class="enemy-preview"><img src="'+champPortrait(k)+'" alt="">'+(cfg.mode==="boss"&&i===0?"👑 ":"")+esc(c?c.name:k)+' <span class="enemy-lvl">'+(c?c.role:"")+'</span></div>';}).join("")+
    threatLine(power,cfg);
  // alliés
  var grid=document.getElementById("deploy-grid");
  var pool=allyPool(),req=isF?[]:(m.allies_requis||[]);
  document.querySelector("#screen-deploy .deploy-allies .deploy-label").textContent="ALLIÉS IA (2 max)";
  grid.innerHTML=pool.length?"":'<div class="dp-none">Aucun allié disponible pour cette mission.</div>';
  pool.forEach(function(k){
    if(k===DEPLOY.champ)return;
    var d=document.createElement("div");
    var sel=DEPLOY.allies.indexOf(k)>=0;
    d.className="deploy-card"+(sel?" selected":"");
    d.innerHTML='<img src="'+champPortrait(k)+'" alt=""><div class="deploy-card-name">'+esc(CHAMPS[k].name)+'</div><div class="deploy-card-role">'+CHAMPS[k].role+(req.indexOf(k)>=0?" · REQUIS":"")+'</div>';
    d.onclick=function(){
      if(req.indexOf(k)>=0&&k!==DEPLOY.champ)return;
      var i=DEPLOY.allies.indexOf(k);
      if(i>=0)DEPLOY.allies.splice(i,1);else if(DEPLOY.allies.length<2)DEPLOY.allies.push(k);else{hubToast("Deux alliés maximum");return;}
      sfx("ui");renderDeploy();
    };
    grid.appendChild(d);
  });
  document.getElementById("deploy-team-preview").innerHTML='Équipe : '+[DEPLOY.champ].concat(DEPLOY.allies).map(function(k){return '<span>'+esc(CHAMPS[k].name)+'</span>';}).join(", ")+
    ' <small class="dp-vs">'+(1+DEPLOY.allies.length)+" contre "+cfg.foeCount+'</small>';
  var btn=document.getElementById("btn-launch");
  btn.textContent=isF?"DESCENDRE DANS LA FAILLE":"ENTRER EN COMBAT";
  document.getElementById("no-lives-msg").style.display=(!isF&&save.lives<=0)?"block":"none";
}
function threatLine(power,cfg){
  var mine=playerPowerPct(DEPLOY.champ)+(cfg.diff===0?12:0);
  var r=power/mine*(cfg.foeCount/(1+DEPLOY.allies.length));
  var lab,cls,txt;
  if(r<0.75){lab="FACILE";cls="t0";txt="Tu domines nettement ce combat.";}
  else if(r<1.05){lab="ABORDABLE";cls="t1";txt="Combat équilibré : joue derrière tes sbires.";}
  else if(r<1.45){lab="RUDE";cls="t2";txt="Ils sont plus forts : farme, achète, puis engage.";}
  else{lab="REDOUTABLE";cls="t3";txt="Reviens avec plus de talents, de reliques ou d'alliés.";}
  return '<div class="dp-threat '+cls+'"><b>Menace : '+lab+'</b><small>'+txt+'</small></div>';
}
function playerPowerPct(k){
  var b=playerBonus(k);
  return 100*(1+(b.hpP||0)*0.5+(b.atkP||0)*0.5+((b.hp||0)/1500)+((b.atk||0)/120)+((b.armF||0)+(b.arm||0))/300);
}
function launchFromDeploy(){
  if(DEPLOY.kind==="faille"){
    save.failleAllies=DEPLOY.allies.slice();writeSave(save);
    launchFaille(save.faille.cur||1,DEPLOY.champ,DEPLOY.allies.slice());
    return;
  }
  var m=DEPLOY.m;if(!m)return;
  if(!consumeLife()){updateLivesUI();hubToast("Plus de vies — une victoire te rend ta vie. Reviens bientôt ou tente la Faille.");renderDeploy();return;}
  updateLivesUI();
  save.lastAllies=DEPLOY.allies.slice();save.lastChamp=DEPLOY.champ;writeSave(save);
  var cfg=missionCfg(m,DEPLOY.diff,DEPLOY.champ,DEPLOY.allies.slice());
  var meta={kind:"mission",m:m,title:m.num+". "+m.name};
  var firstTime=!(save.diff[m.id]||[])[DEPLOY.diff];
  if(m.narr_avant&&m.narr_avant.length&&(DEPLOY.diff===0||firstTime))showNarration(m.narr_avant,function(){runMatch(cfg,meta);},m.num+". "+m.name);
  else runMatch(cfg,meta);
}
function launchFaille(floor,champ,allies){
  save.faille.cur=floor;writeSave(save);
  runMatch(failleCfg(floor,champ,allies),{kind:"faille",title:"La Faille — étage "+floor});
}

// ---------------------------------------------------------------------
// Onglet ÉVEIL : talents, reliques, héros
// ---------------------------------------------------------------------
var eveilView="talents",relicSel=null;
function renderEveil(){
  var P=document.getElementById("panel-eveil");if(!P)return;
  var pts=talentPoints(),sp=talentSpent();
  var h='<div class="ev-head"><div><b>'+save.cauris.toLocaleString("fr-FR")+'</b> 🐚 cauris</div><div><b>'+(pts-sp)+'</b> / '+pts+' points de talent</div></div>';
  h+='<div class="ev-seg">'+[["talents","Pierres"],["reliques","Reliques"],["heros","Héros"]].map(function(x){return '<button data-v="'+x[0]+'" class="'+(eveilView===x[0]?"on":"")+'">'+x[1]+'</button>';}).join("")+'</div>';
  if(eveilView==="talents"){
    h+='<div class="ev-note">Un point par niveau de compte et un point toutes les 3 étoiles de campagne. Les rangs profonds demandent des points investis dans la même pierre.</div>';
    TALENT_TREES.forEach(function(t){
      var ts=treeSpent(t);
      h+='<div class="tt" style="--c:'+t.color+'"><div class="tt-h"><b>'+t.name+'</b><span>'+ts+' pts</span></div><div class="tt-n">';
      t.nodes.forEach(function(nd){
        var r=save.talents[nd.id]||0,can=canRankTalent(t,nd),locked=nd.req&&ts<nd.req;
        h+='<button class="tn'+(r?" has":"")+(can?" can":"")+(locked?" lock":"")+'" data-t="'+t.id+'" data-n="'+nd.id+'"><b>'+esc(nd.name)+'</b><small>'+esc(nd.desc)+'</small><i>'+r+'/'+nd.max+'</i>'+(locked?'<em>'+nd.req+' pts requis</em>':'')+'</button>';
      });
      h+='</div></div>';
    });
    h+='<button class="btn btn-sm ev-reset" id="ev-reset">Réinitialiser les talents (300 🐚)</button>';
  }else if(eveilView==="reliques"){
    h+='<div class="rl-eq">';
    ["amulette","bracelet","talisman"].forEach(function(sl){
      var r=findRelic(save.equipped[sl]);
      h+='<button class="rl-slot'+(r?" f":"")+'" data-uid="'+(r?r.uid:"")+'" style="--rc:'+(r?RARITY[r.rar].color:"#444")+'"><small>'+sl.toUpperCase()+'</small>'+(r?'<b>'+esc(relicName(r))+'</b><em>+'+r.lvl+'</em>':'<b>Vide</b>')+'</button>';
    });
    h+='</div><div class="rl-tot">'+statList(relicBonus())+'</div>';
    h+='<div class="rl-forge"><button class="btn btn-primary btn-sm" id="rl-buy">Autel des cauris : invoquer une relique (400 🐚)</button></div>';
    var sel=relicSel&&findRelic(relicSel);
    if(sel){
      var eqd=equippedUids().indexOf(sel.uid)>=0;
      h+='<div class="rl-det" style="--rc:'+RARITY[sel.rar].color+'"><b>'+esc(relicName(sel))+' +'+sel.lvl+'</b><small>'+RARITY[sel.rar].name+' · '+relicSlot(sel)+'</small><div>'+statList(relicStats(sel))+'</div>'+
        '<div class="rl-btns">'+(eqd?'<span class="rl-on">Équipée</span>':'<button class="btn btn-sm" id="rl-eq">Équiper</button>')+
        (sel.lvl<10?'<button class="btn btn-sm btn-primary" id="rl-up">Améliorer ('+relicUpCost(sel)+' 🐚)</button>':'<span class="rl-on">Niveau max</span>')+
        (eqd?'':'<button class="btn btn-sm btn-red" id="rl-sal">Recycler (+'+relicSalvage(sel)+' 🐚)</button>')+'</div></div>';
    }
    h+='<div class="rl-list">';
    var list=save.relics.slice().sort(function(a,b){return (b.rar*100+b.lvl)-(a.rar*100+a.lvl);});
    if(!list.length)h+='<div class="ev-note">Aucune relique. Gagne des missions (surtout les boss et les difficultés élevées) ou descends dans la Faille.</div>';
    list.forEach(function(r){
      var eqd=equippedUids().indexOf(r.uid)>=0;
      h+='<button class="rl-it'+(relicSel===r.uid?" sel":"")+'" data-uid="'+r.uid+'" style="--rc:'+RARITY[r.rar].color+'"><b>'+esc(relicName(r))+'</b><small>'+relicSlot(r)+' · +'+r.lvl+'</small>'+(eqd?'<i>✓</i>':'')+'</button>';
    });
    h+='</div><div class="ev-note">'+save.relics.length+' / 60 reliques — au-delà, la plus faible est recyclée automatiquement.</div>';
  }else{
    PLAYABLE.forEach(function(k){
      var c=CHAMPS[k],un=championUnlocked(k),ml=masteryLvl(k),x=(save.mastery[k]||{xp:0}).xp;
      var nx=MASTERY_XP[ml]||MASTERY_XP[MASTERY_XP.length-1],pv=MASTERY_XP[ml-1]||0;
      var pct=ml>=10?100:Math.round((x-pv)/(nx-pv)*100);
      h+='<div class="hr'+(un?"":" lock")+'"><img src="'+champPortrait(k)+'" alt=""><div class="hr-i"><b>'+esc(c.name)+'</b><small>'+esc(c.title)+' · '+c.role+'</small>'+
        (un?'<div class="hr-m">Maîtrise '+ml+'/10 · '+skinFor(k).name+'</div><div class="xp-bar"><div class="xp-fill" style="width:'+pct+'%"></div></div>'+
        '<div class="hr-k"><span>PV '+c.hp+'</span><span>ATQ '+c.atk+'</span><span>ARM '+c.arm+'</span><span>Portée '+c.range+'</span></div>'+
        '<details><summary>Kit et conseils</summary><p><b>'+esc(c.passive.name)+'</b> — '+esc(c.passive.desc)+'</p>'+c.abil.map(function(a,i){return '<p><b>'+["1","2","3","Ultime"][i]+' · '+esc(a.name)+'</b> — '+esc(a.desc)+'</p>';}).join("")+'<p class="hr-tip">Achats conseillés : '+(BUILDS[c.role]||[]).slice(0,6).map(function(id){return ITEM_BY[id].ico;}).join(" ")+'</p></details>'
        :'<div class="hr-m">🔒 '+(k==="DARK"?"Termine la campagne ou atteins l'étage 25 de la Faille":"Se débloque au fil de la campagne")+'</div>')+
        '</div></div>';
    });
  }
  P.innerHTML=h;
  P.querySelectorAll(".ev-seg button").forEach(function(b){b.onclick=function(){eveilView=b.dataset.v;sfx("ui");renderEveil();};});
  P.querySelectorAll(".tn").forEach(function(b){b.onclick=function(){
    var t=TALENT_TREES.filter(function(x){return x.id===b.dataset.t;})[0],nd=t.nodes.filter(function(x){return x.id===b.dataset.n;})[0];
    if(!canRankTalent(t,nd)){hubToast(talentSpent()>=talentPoints()?"Plus de points — monte de niveau ou gagne des étoiles":"Rang indisponible");return;}
    save.talents[nd.id]=(save.talents[nd.id]||0)+1;writeSave(save);sfx("lvl");renderEveil();
  };});
  var rs=document.getElementById("ev-reset");
  if(rs)rs.onclick=function(){
    if(!talentSpent())return;
    if(save.cauris<300){hubToast("Il faut 300 cauris");return;}
    if(!confirm("Rendre tous les points de talent pour 300 cauris ?"))return;
    save.cauris-=300;save.talents={};writeSave(save);renderEveil();
  };
  P.querySelectorAll(".rl-it,.rl-slot.f").forEach(function(b){b.onclick=function(){relicSel=+b.dataset.uid;sfx("ui");renderEveil();};});
  var bb=document.getElementById("rl-buy");
  if(bb)bb.onclick=function(){
    if(save.cauris<400){hubToast("Il faut 400 cauris");return;}
    save.cauris-=400;var r=rollRelic(0.15);relicSel=r.uid;writeSave(save);
    checkAchievements();writeSave(save);
    hubToast("Relique "+RARITY[r.rar].name.toLowerCase()+" : "+relicName(r));sfx("buy");renderEveil();
  };
  var sel2=relicSel&&findRelic(relicSel);
  if(sel2){
    var e1=document.getElementById("rl-eq");if(e1)e1.onclick=function(){save.equipped[relicSlot(sel2)]=sel2.uid;writeSave(save);sfx("buy");renderEveil();};
    var e2=document.getElementById("rl-up");if(e2)e2.onclick=function(){var c=relicUpCost(sel2);if(save.cauris<c){hubToast("Il faut "+c+" cauris");return;}save.cauris-=c;sel2.lvl++;writeSave(save);sfx("lvl");renderEveil();};
    var e3=document.getElementById("rl-sal");if(e3)e3.onclick=function(){save.cauris+=relicSalvage(sel2);save.relics.splice(save.relics.indexOf(sel2),1);relicSel=null;writeSave(save);sfx("buy");renderEveil();};
  }
}
function statList(o){
  var ks=Object.keys(o);if(!ks.length)return '<span class="ev-note">Aucun bonus</span>';
  return ks.map(function(k){return '<span class="st">'+(STAT_LABEL[k]?fmtStat(k,o[k]):k)+'</span>';}).join("");
}

// ---------------------------------------------------------------------
// Onglet FAILLE : mode infini, défis, succès, statistiques
// ---------------------------------------------------------------------
function renderFaille(){
  var P=document.getElementById("panel-faille");if(!P)return;
  refreshQuests();
  var F=save.faille,cur=F.cur||1;
  var nextMs=(Math.floor(F.claimed/10)+1)*10;
  var canClaim=F.best>=nextMs;
  var cfg=failleCfg(cur,save.lastChamp||"TARINE",[]);
  var h='<div class="fl-hero"><div class="fl-depth"><small>RECORD</small><b>'+F.best+'</b><small>ÉTAGE ACTUEL '+cur+'</small></div>'+
    '<div class="fl-txt"><b>LA FAILLE</b><p>Des étages sans fin sous Abidjan. Chaque étage est plus dur ; un boss tous les 5 étages ; les règles changent chaque semaine.</p>'+
    '<div class="fl-next">'+MODE_ICO[cfg.mode]+' Étage '+cur+' : '+MODE_INFO[cfg.mode].name+(cfg.affixes.length?' · '+cfg.affixes.map(function(a){return AFFIXES.filter(function(x){return x.id===a;})[0].name;}).join(", "):"")+'</div>'+
    '<button class="btn btn-primary" id="fl-go">DESCENDRE</button>'+
    (cur>1?' <button class="btn btn-sm" id="fl-restart">Repartir de l\'étage 1</button>':'')+'</div></div>';
  h+='<div class="fl-ms"><span>Palier '+nextMs+' : '+(nextMs*50)+' 🐚 + relique</span><button class="btn btn-sm'+(canClaim?" btn-primary":"")+'" id="fl-claim" '+(canClaim?"":"disabled")+'>'+(canClaim?"RÉCLAMER":F.best+" / "+nextMs)+'</button></div>';
  h+='<div class="q-sec"><div class="q-t">DÉFIS DU JOUR</div>'+save.daily.quests.map(questRow).join("")+'</div>';
  h+='<div class="q-sec"><div class="q-t">DÉFIS DE LA SEMAINE</div>'+save.weekly.quests.map(questRow).join("")+'</div>';
  var S=save.stats;
  h+='<div class="q-sec"><div class="q-t">CARNET DE ROUTE</div><div class="fl-stats">'+
    [["Temps de jeu",fmtHours(S.playtime)],["Victoires",S.wins+" / "+S.games],["Éliminations",S.kills],["Tours",S.towers],["Sbires",S.cs],["Boss",S.bosses],["Étoiles",totalStars()+" / "+totalMissionsCount()*3],["Contenu",contentProgress()+" %"]]
    .map(function(x){return '<div><b>'+x[1]+'</b><small>'+x[0]+'</small></div>';}).join("")+'</div></div>';
  var nA=Object.keys(save.ach).length;
  h+='<div class="q-sec"><div class="q-t">SUCCÈS '+nA+' / '+ACHIEVEMENTS.length+'</div><div class="ach">'+
    ACHIEVEMENTS.map(function(a){return '<div class="'+(save.ach[a.id]?"on":"")+'"><b>'+(save.ach[a.id]?"🏆 ":"")+esc(a.name)+'</b><small>'+esc(a.desc)+'</small></div>';}).join("")+'</div></div>';
  P.innerHTML=h;
  document.getElementById("fl-go").onclick=function(){openFailleDeploy();};
  var rs=document.getElementById("fl-restart");if(rs)rs.onclick=function(){save.faille.cur=1;writeSave(save);renderFaille();};
  document.getElementById("fl-claim").onclick=function(){
    if(!canClaim)return;
    F.claimed=nextMs;save.cauris+=nextMs*50;var r=rollRelic(0.4+nextMs*0.008);
    writeSave(save);hubToast("+"+nextMs*50+" cauris · relique "+RARITY[r.rar].name.toLowerCase());sfx("lvl");renderFaille();
  };
  P.querySelectorAll(".q-claim").forEach(function(b){b.onclick=function(){
    var all=save.daily.quests.concat(save.weekly.quests);
    var q=all[+b.dataset.i];claimQuest(q);renderFaille();
  };});
}
var _qIdx=0;
function questRow(q){
  var all=save.daily.quests.concat(save.weekly.quests),i=all.indexOf(q);
  var pr=questProgress(q),done=pr>=q.goal;
  return '<div class="q'+(q.claimed?" cl":"")+'"><div class="q-i"><b>'+esc(q.txt)+'</b><div class="xp-bar"><div class="xp-fill" style="width:'+Math.round(pr/q.goal*100)+'%"></div></div><small>'+pr.toLocaleString("fr-FR")+' / '+q.goal.toLocaleString("fr-FR")+' · '+q.reward.cauris+' 🐚 · '+q.reward.xp+' XP</small></div>'+
    (q.claimed?'<span class="q-ok">✓</span>':'<button class="btn btn-sm q-claim'+(done?" btn-primary":"")+'" data-i="'+i+'" '+(done?"":"disabled")+'>'+(done?"PRENDRE":"…")+'</button>')+'</div>';
}
function fmtHours(s){var h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h+" h "+(m<10?"0":"")+m;}

// ---------------------------------------------------------------------
// Intégration dans le hub existant
// ---------------------------------------------------------------------
function installHubV3(){
  var tabs=document.querySelector("#screen-hub .hub-tabs");
  if(tabs&&!document.querySelector('[data-tab="eveil"]')){
    var mk=function(id,ico,lb,after){
      var b=document.createElement("button");b.className="hub-tab-btn";b.dataset.tab=id;
      b.innerHTML='<span class="tab-icon">'+ico+'</span><span class="tab-label">'+lb+'</span>';
      b.onclick=function(){switchHubTab(id);};
      var ref=tabs.querySelector('[data-tab="'+after+'"]');tabs.insertBefore(b,ref?ref.nextSibling:null);
      var p=document.createElement("div");p.className="hub-panel";p.id="panel-"+id;p.dataset.panel=id;
      document.querySelector("#screen-hub .hub-body").appendChild(p);
    };
    mk("eveil","💎","Éveil","missions");
    mk("faille","🌀","Faille","eveil");
  }
  // bouton de lancement : on remplace l'ancien gestionnaire
  var old=document.getElementById("btn-launch");
  if(old&&!old.dataset.v3){var nb=old.cloneNode(true);nb.dataset.v3="1";old.parentNode.replaceChild(nb,old);nb.addEventListener("click",launchFromDeploy);}
  // en-tête compact : cauris + un seul bouton menu
  var lb=document.querySelector("#screen-hub .lives-box");
  if(lb&&!document.getElementById("hub-cauris")){var c=document.createElement("div");c.id="hub-cauris";c.className="hub-cauris";lb.appendChild(c);}
  if(lb&&!document.getElementById("hub-menu-btn")){
    var mb=document.createElement("button");mb.id="hub-menu-btn";mb.className="hub-menu-btn";mb.textContent="☰";
    mb.onclick=openHubMenu;lb.appendChild(mb);
  }
  if(!document.getElementById("hub-toast")){var t=document.createElement("div");t.id="hub-toast";document.body.appendChild(t);}
  var bs=document.getElementById("btn-start");
  if(bs)bs.addEventListener("click",function(){migrateSave();refreshQuests();writeSave(save);});
  var br=document.getElementById("btn-reset");
  if(br)br.addEventListener("click",function(){setTimeout(function(){migrateSave();refreshQuests();writeSave(save);},0);});
  buildGameDom();
}
// filet de sécurité : une sauvegarde neuve doit toujours porter les champs v3
var _basePlayerBonus=playerBonus;
playerBonus=function(k){migrateSave();return _basePlayerBonus(k);};
function openHubMenu(){
  var ov=document.getElementById("hubmenu-over");
  if(!ov){ov=document.createElement("div");ov.id="hubmenu-over";ov.className="mv-over";document.body.appendChild(ov);}
  ov.innerHTML='<div class="mv-panel"><div class="mv-ph"><b>MENU</b><button class="mv-x" id="hm-x">✕</button></div>'+
    '<button class="btn hm-b" id="hm-help">? Comment jouer</button>'+
    '<button class="btn hm-b" id="hm-slots">Parties sauvegardées (empl. '+curSlot()+')</button>'+
    '<button class="btn hm-b" id="hm-title">Écran titre</button></div>';
  ov.classList.add("on");
  var close=function(){ov.classList.remove("on");};
  document.getElementById("hm-x").onclick=close;
  document.getElementById("hm-help").onclick=function(){close();openHelp();};
  document.getElementById("hm-slots").onclick=function(){close();openSlots();};
  document.getElementById("hm-title").onclick=function(){close();goTo("screen-title");initTitle();};
}
// mission suivante à jouer : première non terminée, sinon la dernière ouverte
function nextMission(){
  var all=[],prev=null;
  CAMPAIGN.forEach(function(a){a.missions.forEach(function(m){all.push(m);});});
  for(var i=0;i<all.length;i++){if(!isMissionDone(all[i].id))return all[i];prev=all[i];}
  return prev||all[0];
}
function quickPlay(){
  var m=nextMission();
  DEPLOY.kind="mission";DEPLOY.m=m;DEPLOY.diff=0;
  DEPLOY.champ=championUnlocked(save.lastChamp)?save.lastChamp:"TARINE";
  var mem=(save.lastAllies||[]).filter(function(k){return championUnlocked(k)&&k!==DEPLOY.champ;});
  var pool=(m.allies_dispo||[]).concat(m.allies_requis||[]).filter(function(k){return CHAMPS[k]&&championUnlocked(k)&&k!==DEPLOY.champ;});
  DEPLOY.allies=(isMissionDone(m.id)?mem:pool).slice(0,2);
  if(!DEPLOY.allies.length)DEPLOY.allies=pool.slice(0,2);
  launchFromDeploy();
}
var _baseBuildHub=buildHub;
buildHub=function(){
  migrateSave();refreshQuests();
  var nw=checkAchievements();
  _baseBuildHub();
  // bandeau JOUER : une seule touche pour repartir au combat
  var mp=document.getElementById("panel-missions");
  var m0=nextMission();
  var bar=document.getElementById("hub-play");
  if(!bar){bar=document.createElement("div");bar.id="hub-play";bar.className="hub-play";mp.insertBefore(bar,mp.firstChild);}
  bar.innerHTML='<div class="hp-i"><small>'+(isMissionDone(m0.id)?"REJOUER":"MISSION "+m0.num)+'</small><b>'+esc(m0.name)+'</b></div>'+
    '<button class="btn btn-primary" id="hub-play-go">JOUER</button>'+
    '<button class="btn btn-sm" id="hub-play-team">Équipe</button>';
  document.getElementById("hub-play-go").onclick=quickPlay;
  document.getElementById("hub-play-team").onclick=function(){openDeploy(m0.id);};
  // cartes de mission : étoiles, mode, boss
  var cards=document.querySelectorAll("#hub-missions .mission-card"),idx=0;
  CAMPAIGN.forEach(function(a){a.missions.forEach(function(m){
    var card=cards[idx++];if(!card)return;
    var mode=modeForMission(m),st=starsFor(m.id);
    var tag=document.createElement("div");tag.className="m-tags";
    tag.innerHTML='<span class="m-mode">'+MODE_ICO[mode]+' '+MODE_INFO[mode].name+'</span><span class="m-stars">'+[0,1,2].map(function(k){return '<i class="'+(k<st?"on":"")+'">★</i>';}).join("")+'</span>';
    var info=card.querySelector(".m-info");if(info)info.appendChild(tag);
    if(mode==="boss")card.classList.add("m-boss");
  });});
  // profil
  var T=CHAMPS.TARINE,b=playerBonus("TARINE");
  var e;
  if(e=document.getElementById("prof-hp"))e.textContent=Math.round((T.hp+(b.hp||0))*(1+(b.hpP||0)));
  if(e=document.getElementById("prof-atk"))e.textContent=Math.round((T.atk+(b.atk||0))*(1+(b.atkP||0)));
  if(e=document.getElementById("prof-xp"))e.textContent=save.xp+" / "+xpForLevel(save.level)+(save.level>=ACCOUNT_MAX?" (max)":"");
  if(e=document.getElementById("xp-fill"))e.style.width=Math.min(100,Math.round(save.xp/xpForLevel(save.level)*100))+"%";
  if(e=document.getElementById("hub-cauris"))e.textContent="🐚 "+save.cauris.toLocaleString("fr-FR");
  // gardiens : maîtrise
  document.querySelectorAll("#allies-list .ally-row").forEach(function(row,i){
    var k=["KAREN","FULGENCE","SAM","LUNDGREN","BABA","DARK"][i];
    if(k&&championUnlocked(k)){var r=row.querySelector(".ally-role");if(r)r.textContent=CHAMPS[k].role+" · maîtrise "+masteryLvl(k)+" · jouable";}
  });
  renderEveil();renderFaille();
  var ab=document.querySelector('[data-tab="eveil"]');
  if(ab)ab.classList.toggle("badge",talentSpent()<talentPoints());
  var fb=document.querySelector('[data-tab="faille"]');
  if(fb)fb.classList.toggle("badge",save.daily.quests.concat(save.weekly.quests).some(function(q){return !q.claimed&&questProgress(q)>=q.goal;}));
  if(nw.length){writeSave(save);hubToast("🏆 "+nw.map(function(a){return a.name;}).join(", "));}
};
var _baseSwitch=switchHubTab;
switchHubTab=function(tab){
  _baseSwitch(tab);
  if(tab==="eveil")renderEveil();
  if(tab==="faille")renderFaille();
  var body=document.querySelector("#screen-hub .hub-body");if(body)body.scrollTop=0;
};
window.switchHubTab=switchHubTab;
var _baseInitTitle=initTitle;
initTitle=function(){
  _baseInitTitle();
  var s=document.getElementById("save-status");
  if(s&&save.missions_done.length)s.textContent="Sauvegarde : "+save.missions_done.length+"/"+totalMissionsCount()+" missions · niveau "+save.level+" · Faille "+(save.faille?save.faille.best:0);
};
window.openDeploy=openDeploy;

// Point d'entrée de débogage (console du navigateur) : KWENI.G(), KWENI.give(5000)…
window.KWENI={
  G:function(){return G;},save:function(){return save;},
  runMatch:runMatch,openDeploy:openDeploy,launchFaille:launchFaille,openShop:openShop,quickCast:quickCast,
  give:function(c){save.cauris+=c||1000;writeSave(save);buildHub();},
  wipe:function(){localStorage.removeItem("dpdf_save_v2");location.reload();}
};
KWENI.dev=function(code){return eval(code);};
