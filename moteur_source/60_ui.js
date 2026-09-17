// =====================================================================
// ===  INTERFACE DE COMBAT : audio, boutique, HUD, contrôles, boucle ===
// =====================================================================

// ---------------------------------------------------------------------
// Audio synthétisé (aucun fichier externe)
// ---------------------------------------------------------------------
var AC=null,SFX_LAST={};
var SFX_DEF={
  hit:{f:[180,90],d:0.06,t:"square",v:0.05,gap:0.05},
  cast:{f:[420,760],d:0.14,t:"triangle",v:0.07,gap:0.06},
  ult:{f:[120,520],d:0.45,t:"sawtooth",v:0.09,gap:0.2},
  lvl:{f:[520,1040],d:0.35,t:"triangle",v:0.09,gap:0.3},
  death:{f:[300,60],d:0.6,t:"sawtooth",v:0.08,gap:0.5},
  tower:{f:[90,40],d:0.5,t:"square",v:0.08,gap:0.3},
  buy:{f:[880,1320],d:0.12,t:"sine",v:0.08,gap:0.05},
  kill:{f:[660,990],d:0.2,t:"triangle",v:0.08,gap:0.1},
  win:{f:[392,784],d:0.9,t:"triangle",v:0.1,gap:1},
  lose:{f:[330,110],d:0.9,t:"sine",v:0.1,gap:1},
  ui:{f:[700,900],d:0.05,t:"sine",v:0.04,gap:0.03},
  deny:{f:[160,140],d:0.1,t:"square",v:0.04,gap:0.15}
};
function sfx(kind,u){
  if(save.settings&&save.settings.sound===false)return;
  if(u&&G&&G.player&&u!==G.player&&dist(u.x,u.y,G.player.x,G.player.y)>900)return;
  var s=SFX_DEF[kind];if(!s)return;
  var now=performance.now()/1000;
  if(SFX_LAST[kind]&&now-SFX_LAST[kind]<s.gap)return;
  SFX_LAST[kind]=now;
  try{
    if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==="suspended")AC.resume();
    var t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
    o.type=s.t;o.frequency.setValueAtTime(s.f[0],t);o.frequency.exponentialRampToValueAtTime(Math.max(20,s.f[1]),t+s.d);
    var vol=s.v*(u&&u!==G.player?0.5:1);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+s.d);
    o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+s.d+0.02);
  }catch(e){}
}
function haptic(p){try{if(navigator.vibrate&&save.settings.vibe!==false)navigator.vibrate(p);}catch(e){}}
function toast(msg){hubToast(msg);}

// ---------------------------------------------------------------------
// Boutique (utilisée par le joueur ET par l'IA)
// ---------------------------------------------------------------------
var INV_MAX=6;
function quoteItem(u,id){
  var I=ITEM_BY[id];if(!I)return{ok:false,price:0,used:[]};
  var inv=u.items.slice(),used=[],price=I.cost;
  function take(cid){
    var j=inv.indexOf(cid);
    if(j>=0){inv.splice(j,1);used.push(cid);price-=ITEM_BY[cid].cost;return;}
    var C=ITEM_BY[cid];
    if(C&&C.from){C.from.forEach(take);}
  }
  (I.from||[]).forEach(take);
  // un composant de niveau 2 qu'on ne possède pas coûte son prix plein moins ses propres composants
  price=Math.max(0,Math.round(price));
  var ok=inv.length+1<=INV_MAX;
  return{ok:ok,price:price,used:used,full:!ok};
}
function buyItem(u,id){
  var q=quoteItem(u,id);
  if(!q.ok||u.gold<q.price)return false;
  q.used.forEach(function(c){var j=u.items.indexOf(c);if(j>=0)u.items.splice(j,1);});
  u.items.push(id);u.gold-=q.price;
  recalc(u,false);
  if(u.isPlayer){sfx("buy");hudDirty();shopDirty=true;}
  return true;
}
function sellItem(u,idx){
  var id=u.items[idx];if(!id)return;
  u.items.splice(idx,1);u.gold+=Math.round(ITEM_BY[id].cost*0.6);
  recalc(u,false);sfx("buy");hudDirty();shopDirty=true;
}
function canShop(u){return u.dead||u.atFount||G.mode==="boss"&&G.time<3;}

// ---------------------------------------------------------------------
// Annonces, fil des éliminations
// ---------------------------------------------------------------------
var HUD={dirty:true,el:{},annT:0,shopHint:0,lastCd:"",aim:null,joy:null,keys:{},mouse:null,holdAtk:false,holdT:0};
var shopDirty=true;
function hudDirty(){HUD.dirty=true;}
function announce(txt,kind){
  if(!G)return;
  G.announceQ.push({txt:txt,kind:kind||"info"});
  if(G.announceQ.length>4)G.announceQ.splice(1,1);
  if(kind==="win")sfx("win");else if(kind==="lose")sfx("lose");else if(kind==="kill")sfx("kill");
}
function pumpAnnounce(dt){
  var el=HUD.el.banner;if(!el)return;
  HUD.annT-=dt;
  if(HUD.annT<=0&&G.announceQ.length){
    var a=G.announceQ.shift();
    el.className="mv-banner show k-"+a.kind;el.textContent=a.txt;
    HUD.annT=a.kind==="win"||a.kind==="lose"?3:1.8;
  }else if(HUD.annT<=0){el.className="mv-banner";}
}
function killFeed(k,t){
  var el=HUD.el.feed;if(!el||!k)return;
  var row=document.createElement("div");
  var kc=k.team===0?"a":"e";
  row.className="mv-kf "+kc;
  row.innerHTML='<span>'+esc(k.name||"Tour")+'</span><i>⚔</i><span>'+esc(t.name)+'</span>';
  el.prepend(row);
  while(el.children.length>4)el.removeChild(el.lastChild);
  setTimeout(function(){row.classList.add("out");setTimeout(function(){row.remove();},400);},4500);
}
function openShopHint(){HUD.shopHint=4;}

// ---------------------------------------------------------------------
// Portraits
// ---------------------------------------------------------------------
var PORTRAIT_CACHE={};
function champPortrait(k){
  if(PORTRAIT_CACHE[k])return PORTRAIT_CACHE[k];
  var uri="";
  try{
    if(typeof BASE_CHAMPIONS!=="undefined"&&BASE_CHAMPIONS[k])uri=portraitFor(BASE_CHAMPIONS[k]);
    else{var c=CAST[k==="BABA"?"BABA_TUNDE":k];if(c)uri=IMGS[k]||makePortrait("cast:"+k,c.role,c.o);}
  }catch(e){}
  PORTRAIT_CACHE[k]=uri;return uri;
}

// ---------------------------------------------------------------------
// DOM de l'écran de combat
// ---------------------------------------------------------------------
function buildGameDom(){
  var root=document.getElementById("screen-game");
  if(root.dataset.v3)return;
  root.dataset.v3="1";
  root.innerHTML=
  '<canvas id="mv-canvas"></canvas>'+
  '<div id="mv-joyzone"></div>'+
  '<div class="mv-hud">'+
    '<div class="mv-top">'+
      '<div class="mv-pill" id="mv-kda">0 / 0 / 0</div>'+
      '<div class="mv-score"><b class="a" id="mv-sa">0</b><span id="mv-time">00:00</span><b class="e" id="mv-se">0</b></div>'+
      '<button class="mv-ico" id="mv-pause" aria-label="Pause">❚❚</button>'+
    '</div>'+
    '<div class="mv-obj" id="mv-obj"></div>'+
    '<canvas id="mv-mini"></canvas>'+
    '<div class="mv-boss" id="mv-boss"><div class="mv-boss-n" id="mv-boss-n"></div><div class="mv-boss-bar"><i id="mv-boss-hp"></i><b id="mv-boss-sh"></b></div></div>'+
    '<div class="mv-banner" id="mv-banner"></div>'+
    '<div class="mv-feed" id="mv-feed"></div>'+
    '<div class="mv-dead" id="mv-dead"></div>'+
    '<div class="mv-me">'+
      '<div class="mv-face"><img id="mv-face" alt=""><span id="mv-lvl">1</span><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" id="mv-xpring"/></svg></div>'+
      '<div class="mv-bars">'+
        '<div class="mv-bar hp"><i id="mv-hp"></i><b id="mv-sh"></b><span id="mv-hpt"></span></div>'+
        '<div class="mv-bar mp"><i id="mv-mp"></i><span id="mv-mpt"></span></div>'+
        '<div class="mv-inv" id="mv-inv"></div>'+
      '</div>'+
    '</div>'+
    '<button class="mv-gold" id="mv-shopbtn"><span>🛒</span><b id="mv-gold">500</b></button>'+
    '<div class="mv-joy" id="mv-joy"><div class="mv-knob" id="mv-knob"></div></div>'+
    '<div class="mv-act">'+
      '<button class="mv-atk" id="mv-atk">⚔</button>'+
      '<div class="mv-ab" data-i="0"><button class="mv-abb"><span class="nm"></span><em></em><i class="cd"></i></button><button class="mv-up">+</button><div class="pips"></div></div>'+
      '<div class="mv-ab" data-i="1"><button class="mv-abb"><span class="nm"></span><em></em><i class="cd"></i></button><button class="mv-up">+</button><div class="pips"></div></div>'+
      '<div class="mv-ab" data-i="2"><button class="mv-abb"><span class="nm"></span><em></em><i class="cd"></i></button><button class="mv-up">+</button><div class="pips"></div></div>'+
      '<div class="mv-ab ult" data-i="3"><button class="mv-abb"><span class="nm"></span><em></em><i class="cd"></i></button><button class="mv-up">+</button><div class="pips"></div></div>'+
      '<button class="mv-sp" data-s="saut"><span>✦</span><i class="cd"></i></button>'+
      '<button class="mv-sp" data-s="soin"><span>✚</span><i class="cd"></i></button>'+
      '<button class="mv-sp rc" id="mv-recall"><span>⌂</span><i class="cd"></i></button>'+
    '</div>'+
    '<div class="mv-cancel" id="mv-cancel">✕ ANNULER</div>'+
    '<div class="mv-tip" id="mv-tip"></div>'+
  '</div>'+
  '<div class="mv-over" id="mv-shop"><div class="mv-panel">'+
    '<div class="mv-ph"><b>MARCHÉ D\'ADJAMÉ</b><span id="mv-shop-gold"></span><button class="mv-x" data-close="mv-shop">✕</button></div>'+
    '<div class="mv-shop-note" id="mv-shop-note"></div>'+
    '<div class="mv-shop-inv" id="mv-shop-inv"></div>'+
    '<div class="mv-shop-list" id="mv-shop-list"></div>'+
    '<div class="mv-shop-detail" id="mv-shop-detail"></div>'+
  '</div></div>'+
  '<div class="mv-over" id="mv-menu"><div class="mv-panel">'+
    '<div class="mv-ph"><b>PAUSE</b><button class="mv-x" data-close="mv-menu">✕</button></div>'+
    '<div id="mv-board"></div>'+
    '<div class="mv-set" id="mv-set"></div>'+
    '<div class="mv-menu-btns"><button class="btn btn-primary" id="mv-resume">REPRENDRE</button><button class="btn btn-red" id="mv-quit">ABANDONNER</button></div>'+
  '</div></div>';
  var ids=["canvas","kda","sa","se","time","obj","mini","boss","boss-n","boss-hp","boss-sh","banner","feed","dead","face","lvl","xpring","hp","sh","hpt","mp","mpt","inv","gold","joy","knob","cancel","tip","shop","menu","joyzone","shopbtn"];
  ids.forEach(function(k){HUD.el[k]=document.getElementById("mv-"+k);});
  HUD.el.abs=[].slice.call(root.querySelectorAll(".mv-ab"));
  HUD.el.sps=[].slice.call(root.querySelectorAll(".mv-sp[data-s]"));
  HUD.el.recall=document.getElementById("mv-recall");
  bindControls(root);
}

// ---------------------------------------------------------------------
// Ciblage automatique
// ---------------------------------------------------------------------
function pickTarget(p,range,champsFirst){
  var best=null,bs=1e9;
  for(var i=0;i<G.units.length;i++){
    var o=G.units[i];
    if(o.dead||o.team===p.team)continue;
    if(o.kind!=="nexus"&&!targetable(o))continue;
    if(o.protectedBy&&!o.protectedBy.dead)continue;
    if(o.kind==="champ"&&!visibleTo(o,p.team))continue;
    if(o.pending)continue;
    var d=edgeDist(p,o);if(d>range)continue;
    var s=d;
    if(o.kind==="champ")s-=(champsFirst?500:140)+(1-o.hp/o.maxHp)*120;
    else if(o.kind==="minion"&&o.hp<p.atk*1.05)s-=160;
    else if(o.kind==="tower"||o.kind==="nexus")s+=80;
    if(s<bs){bs=s;best=o;}
  }
  return best;
}
function aimDir(){
  var p=G.player;
  if(p.joy&&(Math.abs(p.joy.x)+Math.abs(p.joy.y))>0.2){var l=Math.hypot(p.joy.x,p.joy.y);return{x:p.joy.x/l,y:p.joy.y/l};}
  if(HUD.mouse&&HUD.mouse.fresh){var w=screenToWorld(HUD.mouse.x,HUD.mouse.y);var dx=w.x-p.x,dy=w.y-p.y,l2=Math.hypot(dx,dy)||1;return{x:dx/l2,y:dy/l2,len:l2};}
  return{x:p.face||1,y:0};
}
function playerCast(i,tx,ty,tu){
  var p=G.player;
  if(!canCast(p,i)){
    if(p.ranks[i]<1)hudTip("Capacité non apprise — touche le « + »");
    else if(p.cds[i]>0)hudTip("Pas encore prête");
    else if(p.mana<p.d.abil[i].cost)hudTip("Pas assez d'Essence");
    sfx("deny");return false;
  }
  var ok=castAbility(p,i,tx,ty,tu);
  if(ok){haptic(p.d.abil[i].ult?[20,30,40]:12);if(p.d.abil[i].type!=="dash")p.target=p.target&&!p.target.dead?p.target:null;}
  return ok;
}
function quickCast(i){
  var p=G.player,ab=p.d.abil[i];
  var rng=ab.range||ab.radius||300;
  if(ab.type==="self"||ab.type==="nova"||ab.type==="ally")return playerCast(i,p.x+(p.face||1)*20,p.y,null);
  var md=aimDir();
  if(HUD.mouse&&HUD.mouse.fresh&&md.len){return playerCast(i,p.x+md.x*md.len,p.y+md.y*md.len,null);}
  var reach=ab.type==="circle"||ab.type==="zone"?rng+(ab.radius||0)*0.6:rng+30;
  var t=(p.target&&!p.target.dead&&p.target.kind==="champ"&&edgeDist(p,p.target)<reach)?p.target:pickTarget(p,reach,true);
  if(t){
    var lead=ab.type==="shot"&&t.vx!=null?Math.min(0.35,dist(p.x,p.y,t.x,t.y)/(ab.speed||900)):0;
    return playerCast(i,t.x+(t.vx||0)*lead,t.y+(t.vy||0)*lead,t);
  }
  return playerCast(i,p.x+md.x*rng*0.8,p.y+md.y*rng*0.8,null);
}
function playerAttack(){
  var p=G.player;if(p.dead)return;
  var t=pickTarget(p,p.range+260,false);
  if(t){p.target=t;p.order=null;p.joy=null;HUD.joy=null;p.recall=0;}
  else hudTip("Aucune cible à portée");
}
function playerSpell(id){
  var p=G.player;
  if(p.spells[id]>0){sfx("deny");hudTip(SPELLS[id].name+" : "+Math.ceil(p.spells[id])+" s");return;}
  var d=aimDir();
  var len=d.len?Math.min(260,d.len):260;
  if(castSpell(p,id,p.x+d.x*len,p.y+d.y*len))haptic(15);
}
function playerRecall(){
  var p=G.player;
  if(p.dead||p.recall>0)return;
  if(G.mode==="boss"){hudTip("Impossible de se replier pendant un boss");return;}
  p.recall=4;p.target=null;p.order=null;
  fxRing(p.x,p.y,p.r+30,"#bfe3ff",4);
}
var tipT=null;
function hudTip(msg){
  var el=HUD.el.tip;if(!el)return;
  el.textContent=msg;el.classList.add("show");
  clearTimeout(tipT);tipT=setTimeout(function(){el.classList.remove("show");},1400);
}

// ---------------------------------------------------------------------
// Contrôles tactiles, souris et clavier
// ---------------------------------------------------------------------
function bindControls(root){
  var jz=HUD.el.joyzone,joy=HUD.el.joy,knob=HUD.el.knob;
  var R=52;
  jz.addEventListener("pointerdown",function(e){
    if(!G||e.pointerType==="mouse")return;
    e.preventDefault();
    HUD.joy={id:e.pointerId,ox:e.clientX,oy:e.clientY,x:0,y:0};
    joy.style.left=(e.clientX-60)+"px";joy.style.top=(e.clientY-60)+"px";joy.classList.add("on");
    knob.style.transform="translate(0,0)";
    try{jz.setPointerCapture(e.pointerId);}catch(_){}
  });
  jz.addEventListener("pointermove",function(e){
    var J=HUD.joy;if(!J||J.id!==e.pointerId)return;
    var dx=e.clientX-J.ox,dy=e.clientY-J.oy,l=Math.hypot(dx,dy);
    if(l>R){J.ox+=dx*(1-R/l)*0.5;J.oy+=dy*(1-R/l)*0.5;joy.style.left=(J.ox-60)+"px";joy.style.top=(J.oy-60)+"px";dx=e.clientX-J.ox;dy=e.clientY-J.oy;l=Math.hypot(dx,dy);}
    var k=Math.min(1,l/R);
    J.x=l>6?dx/l*k:0;J.y=l>6?dy/l*k:0;
    knob.style.transform="translate("+(J.x*R)+"px,"+(J.y*R)+"px)";
  });
  function joyEnd(e){var J=HUD.joy;if(!J||J.id!==e.pointerId)return;HUD.joy=null;joy.classList.remove("on");}
  jz.addEventListener("pointerup",joyEnd);jz.addEventListener("pointercancel",joyEnd);

  // souris : clic = déplacer/attaquer, molette ignorée
  var cv=HUD.el.canvas;
  function worldClick(e){
    if(!G||G.paused)return;
    var r=cv.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;
    var w=screenToWorld(sx,sy),p=G.player,best=null,bd=1e9;
    G.units.forEach(function(o){
      if(o.dead||o.team===0||o.pending)return;
      if(o.kind==="champ"&&!visibleTo(o,0))return;
      var d=dist(w.x,w.y,o.x,o.y-o.r*0.6);
      if(d<o.r+26&&d<bd){bd=d;best=o;}
    });
    if(best){p.target=best;p.order=null;fxRing(best.x,best.y,best.r+10,"#ff4d6d",0.3);}
    else{p.target=null;p.order={type:"move",x:w.x,y:w.y};fxRing(w.x,w.y,18,"#8fd3ff",0.35);}
    p.recall=0;
  }
  cv.addEventListener("pointerdown",function(e){
    if(!G)return;
    if(e.pointerType==="mouse"){worldClick(e);}
    else{ // appui direct sur un ennemi = le cibler
      var r=cv.getBoundingClientRect(),w=screenToWorld(e.clientX-r.left,e.clientY-r.top);
      var hit=null;G.units.forEach(function(o){if(!o.dead&&o.team!==0&&!o.pending&&dist(w.x,w.y,o.x,o.y-o.r*0.6)<o.r+30&&(o.kind!=="champ"||visibleTo(o,0)))hit=o;});
      if(hit){G.player.target=hit;fxRing(hit.x,hit.y,hit.r+10,"#ff4d6d",0.3);}
    }
  });
  cv.addEventListener("contextmenu",function(e){e.preventDefault();});
  window.addEventListener("pointermove",function(e){
    if(e.pointerType!=="mouse"||!G)return;
    var r=cv.getBoundingClientRect();
    HUD.mouse={x:e.clientX-r.left,y:e.clientY-r.top,fresh:true,t:performance.now()};
  });

  // attaque
  var atk=document.getElementById("mv-atk");
  atk.addEventListener("pointerdown",function(e){e.preventDefault();if(!G)return;HUD.holdAtk=true;HUD.holdT=0;playerAttack();atk.classList.add("pr");});
  ["pointerup","pointercancel","pointerleave"].forEach(function(ev){atk.addEventListener(ev,function(){HUD.holdAtk=false;atk.classList.remove("pr");});});

  // capacités : appui court = lancer auto, glisser = viser
  HUD.el.abs.forEach(function(box){
    var i=+box.dataset.i,btn=box.querySelector(".mv-abb"),up=box.querySelector(".mv-up");
    up.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();if(G&&rankUp(G.player,i)){sfx("lvl");haptic(10);}});
    btn.addEventListener("pointerdown",function(e){
      e.preventDefault();if(!G||G.player.dead)return;
      var p=G.player;
      if(p.ranks[i]<1){if(rankUp(p,i)){sfx("lvl");}else hudTip("Capacité verrouillée");return;}
      var rc=btn.getBoundingClientRect();
      HUD.aim={i:i,id:e.pointerId,cx:rc.left+rc.width/2,cy:rc.top+rc.height/2,drag:false,cancel:false};
      try{btn.setPointerCapture(e.pointerId);}catch(_){}
      btn.classList.add("pr");
    });
    btn.addEventListener("pointermove",function(e){
      var A=HUD.aim;if(!A||A.id!==e.pointerId)return;
      var dx=e.clientX-A.cx,dy=e.clientY-A.cy,l=Math.hypot(dx,dy);
      if(l>18){
        A.drag=true;
        var ab=G.player.d.abil[i],rng=ab.range||ab.radius||260;
        G.aimInd={i:i,dx:dx/l,dy:dy/l,len:Math.min(1,l/110)*rng};
        HUD.el.cancel.classList.add("on");
        var cr=HUD.el.cancel.getBoundingClientRect();
        A.cancel=e.clientX>cr.left-10&&e.clientX<cr.right+10&&e.clientY>cr.top-10&&e.clientY<cr.bottom+10;
        HUD.el.cancel.classList.toggle("hot",A.cancel);
      }
    });
    function end(e){
      var A=HUD.aim;if(!A||A.id!==e.pointerId)return;
      btn.classList.remove("pr");HUD.aim=null;HUD.el.cancel.classList.remove("on","hot");
      var ai=G&&G.aimInd;G&&(G.aimInd=null);
      if(!G||e.type==="pointercancel"||A.cancel)return;
      if(A.drag&&ai){var p=G.player,ab=p.d.abil[i];
        if(ab.type==="self"||ab.type==="nova"||ab.type==="ally")playerCast(i,p.x,p.y,null);
        else playerCast(i,p.x+ai.dx*Math.max(40,ai.len),p.y+ai.dy*Math.max(40,ai.len),null);}
      else quickCast(i);
    }
    btn.addEventListener("pointerup",end);btn.addEventListener("pointercancel",end);
  });
  HUD.el.sps.forEach(function(b){b.addEventListener("pointerdown",function(e){e.preventDefault();if(G)playerSpell(b.dataset.s);});});
  HUD.el.recall.addEventListener("pointerdown",function(e){e.preventDefault();if(G)playerRecall();});
  HUD.el.shopbtn.addEventListener("click",function(){openShop();});
  document.getElementById("mv-pause").addEventListener("click",function(){openMenu();});
  document.getElementById("mv-resume").addEventListener("click",closeOverlays);
  document.getElementById("mv-quit").addEventListener("click",function(){
    if(!G||G.over)return;
    closeOverlays();G.abandon=true;endMatchSoon(false);G.endIn=0.3;
  });
  root.querySelectorAll("[data-close]").forEach(function(b){b.addEventListener("click",closeOverlays);});
  HUD.el.mini.addEventListener("pointerdown",function(e){
    if(!G)return;e.preventDefault();e.stopPropagation();
    var r=HUD.el.mini.getBoundingClientRect(),s=MINI.s;
    var wx=(e.clientX-r.left-MINI.ox)/s,wy=(e.clientY-r.top-MINI.oy)/s;
    G.player.order={type:"move",x:clamp(wx,G.bx0,G.bx1),y:clamp(wy,G.by0,G.by1)};G.player.target=null;
    fxRing(G.player.order.x,G.player.order.y,24,"#8fd3ff",0.5);
  });
  window.addEventListener("resize",function(){if(G&&LOOP.running)resizeCanvas();});
}

var KEYMAP={arrowup:"u",z:"u",w:"u",arrowdown:"d",s:"d",arrowleft:"l",q:"l",a:"l",arrowright:"r",d:"r"};
function onKey(e){
  if(!G||!LOOP.running)return;
  var k=e.key.toLowerCase(),down=e.type==="keydown";
  if(KEYMAP[k]){HUD.keys[KEYMAP[k]]=down;e.preventDefault();return;}
  if(!down||e.repeat)return;
  if(k==="escape"){if(G.paused)closeOverlays();else openMenu();return;}
  if(G.paused)return;
  var n={"1":0,"2":1,"3":2,"4":3,"&":0,"é":1,"\"":2,"'":3}[e.key];
  if(n!=null){e.preventDefault();if(e.ctrlKey||e.altKey){rankUp(G.player,n);}else quickCast(n);return;}
  if(k===" "){e.preventDefault();playerAttack();return;}
  if(k==="f"||k==="shift"){playerSpell("saut");return;}
  if(k==="h"||k==="g"){playerSpell("soin");return;}
  if(k==="b"){playerRecall();return;}
  if(k==="p"||k==="tab"){e.preventDefault();openShop();return;}
}
function keyJoy(){
  var K=HUD.keys,x=(K.r?1:0)-(K.l?1:0),y=(K.d?1:0)-(K.u?1:0);
  if(!x&&!y)return null;var l=Math.hypot(x,y);return{x:x/l,y:y/l};
}

// ---------------------------------------------------------------------
// Boutique : écran
// ---------------------------------------------------------------------
var shopSel=null;
function openShop(){
  if(!G)return;
  G.paused=true;shopDirty=true;
  HUD.el.shop.classList.add("on");
  var p=G.player,build=BUILDS[p.role]||BUILDS.Combattant;
  if(!shopSel){for(var i=0;i<build.length;i++){if(p.items.indexOf(build[i])<0){shopSel=build[i];break;}}}
  renderShop();
}
function renderShop(){
  if(!G||!HUD.el.shop.classList.contains("on"))return;
  var p=G.player,can=canShop(p);
  document.getElementById("mv-shop-gold").textContent="🪙 "+Math.floor(p.gold);
  document.getElementById("mv-shop-note").textContent=can?"Tu es à la fontaine : achats possibles.":"Retourne à ta fontaine (⌂) ou attends ta réapparition pour acheter.";
  document.getElementById("mv-shop-note").className="mv-shop-note"+(can?" ok":"");
  var inv="";
  for(var s=0;s<INV_MAX;s++){var id=p.items[s];inv+='<div class="mv-slot'+(id?" f":"")+'" data-s="'+s+'">'+(id?ITEM_BY[id].ico:"")+'</div>';}
  document.getElementById("mv-shop-inv").innerHTML=inv;
  var build=BUILDS[p.role]||BUILDS.Combattant;
  var next=null;for(var b=0;b<build.length;b++){var cnt=build.slice(0,b+1).filter(function(x){return x===build[b];}).length;if(p.items.filter(function(x){return x===build[b];}).length<cnt&&!ownsUpgradeOf(p,build[b])){next=build[b];break;}}
  var html="";
  [1,2,3].forEach(function(tier){
    html+='<div class="mv-tier">'+["","COMPOSANTS","OBJETS AVANCÉS","OBJETS LÉGENDAIRES"][tier]+'</div><div class="mv-grid">';
    ITEMS.filter(function(I){return I.tier===tier;}).forEach(function(I){
      var q=quoteItem(p,I.id),afford=p.gold>=q.price&&q.ok;
      html+='<button class="mv-item'+(afford?" af":"")+(shopSel===I.id?" sel":"")+(next===I.id?" rec":"")+'" data-id="'+I.id+'"><span class="ic">'+I.ico+'</span><b>'+q.price+'</b></button>';
    });
    html+='</div>';
  });
  document.getElementById("mv-shop-list").innerHTML=html;
  var d=document.getElementById("mv-shop-detail");
  if(shopSel){
    var I=ITEM_BY[shopSel],q=quoteItem(p,I.id);
    var st=Object.keys(I.st).map(function(k){return '<li>'+fmtStat(k,I.st[k])+'</li>';}).join("");
    var from=I.from?'<div class="mv-from">Recette : '+I.from.map(function(c){return ITEM_BY[c].ico+" "+ITEM_BY[c].name;}).join(" + ")+'</div>':"";
    d.innerHTML='<div class="mv-dh"><span class="ic">'+I.ico+'</span><div><b>'+esc(I.name)+'</b><small>'+(next===I.id?"Recommandé · ":"")+'Prix : '+q.price+' (total '+I.cost+')</small></div></div><ul>'+st+'</ul>'+from+
      '<button class="btn btn-primary" id="mv-buy" '+(can&&q.ok&&p.gold>=q.price?"":"disabled")+'>'+(q.full?"INVENTAIRE PLEIN":"ACHETER")+'</button>';
    var bb=document.getElementById("mv-buy");
    bb.onclick=function(){if(buyItem(p,I.id)){haptic(15);renderShop();}};
  }else d.innerHTML='<div class="mv-empty">Choisis un objet. L\'étoile indique le prochain achat conseillé pour ton rôle.</div>';
  document.querySelectorAll("#mv-shop-list .mv-item").forEach(function(b){b.onclick=function(){shopSel=b.dataset.id;sfx("ui");renderShop();};});
  document.querySelectorAll("#mv-shop-inv .mv-slot.f").forEach(function(b){b.onclick=function(){
    if(!canShop(p)){hudTip("Vente uniquement à la fontaine");return;}
    var id=p.items[+b.dataset.s];
    if(confirm("Vendre "+ITEM_BY[id].name+" pour "+Math.round(ITEM_BY[id].cost*0.6)+" or ?")){sellItem(p,+b.dataset.s);renderShop();}
  };});
  shopDirty=false;
}
function ownsUpgradeOf(p,id){
  return p.items.some(function(x){var I=ITEM_BY[x];function has(it){return it.from&&it.from.some(function(c){return c===id||has(ITEM_BY[c]);});}return has(I);});
}
function openMenu(){
  if(!G)return;G.paused=true;
  HUD.el.menu.classList.add("on");
  var rows=G.units.filter(function(u){return u.kind==="champ"&&!u.pending||u.kind==="champ"&&u.team===1;});
  var h='<table class="mv-tab"><tr><th></th><th>Champion</th><th>Nv</th><th>K/M/A</th><th>Sbires</th><th>Or</th></tr>';
  rows.sort(function(a,b){return a.team-b.team;}).forEach(function(u){
    h+='<tr class="t'+u.team+(u.isPlayer?" me":"")+'"><td><i></i></td><td>'+esc(u.name)+'</td><td>'+u.lvl+'</td><td>'+u.kills+'/'+u.deaths+'/'+u.assists+'</td><td>'+u.cs+'</td><td>'+(u.team===0?Math.floor(u.gold):"—")+'</td></tr>';
  });
  h+='</table>';
  var aff=Object.keys(G.affix).map(function(a){var A=AFFIXES.filter(function(x){return x.id===a;})[0];return A?'<span class="mv-aff" title="'+esc(A.desc)+'">'+A.name+'</span>':"";}).join("");
  h+='<div class="mv-info"><b>'+esc(G.meta.title)+'</b> · '+MODE_INFO[G.mode].name+' · '+G.diff.name+(aff?'<div>'+aff+'</div>':'')+'<p>'+esc(G.objective)+'</p></div>';
  h+='<div class="mv-keys">Clavier : ZQSD/WASD déplacer · clic gauche = aller/attaquer · Espace attaque · 1-4 capacités (vers la souris) · Ctrl+1-4 améliorer · F saut · H souffle · B repli · P boutique</div>';
  document.getElementById("mv-board").innerHTML=h;
  var S=save.settings;
  document.getElementById("mv-set").innerHTML=
    setToggle("sound","Sons",S.sound!==false)+setToggle("shake","Tremblements",S.shake!==false)+setToggle("vibe","Vibrations",S.vibe!==false)+
    setToggle("autoRank","Amélioration auto des capacités",!!S.autoRank)+setToggle("lowq","Mode économie (téléphones modestes)",(S.quality||1)<1);
  document.querySelectorAll("#mv-set input").forEach(function(inp){inp.onchange=function(){
    var k=inp.dataset.k;
    if(k==="lowq"){S.quality=inp.checked?0.5:1;resizeCanvas();groundPat=null;}
    else S[k]=inp.checked;
    writeSave(save);
  };});
}
function setToggle(k,label,on){return '<label class="mv-tg"><input type="checkbox" data-k="'+k+'" '+(on?"checked":"")+'><span></span>'+label+'</label>';}
function closeOverlays(){
  if(HUD.el.shop)HUD.el.shop.classList.remove("on");
  if(HUD.el.menu)HUD.el.menu.classList.remove("on");
  if(G&&!G.over)G.paused=false;
  LOOP.last=performance.now();
}

// ---------------------------------------------------------------------
// Mise à jour du HUD
// ---------------------------------------------------------------------
var MINI={s:0.05,ox:0,oy:0,t:0};
function updateHud(dt){
  var p=G.player,E=HUD.el;
  E.hp.style.width=(p.hp/p.maxHp*100)+"%";
  E.sh.style.width=Math.min(100,p.st.shield/p.maxHp*100)+"%";
  E.hpt.textContent=Math.ceil(p.hp)+" / "+Math.round(p.maxHp);
  E.mp.style.width=(p.maxMana?p.mana/p.maxMana*100:0)+"%";
  E.mpt.textContent=Math.floor(p.mana)+" / "+Math.round(p.maxMana);
  E.gold.textContent=Math.floor(p.gold);
  E.lvl.textContent=p.lvl;
  var xpf=p.lvl>=18?1:p.xp/xpNeeded(p.lvl);
  E.xpring.style.strokeDasharray=(xpf*100.5)+" 100.5";
  E.kda.textContent=p.kills+" / "+p.deaths+" / "+p.assists+"  ·  "+p.cs+" 🗡";
  E.time.textContent=fmtTime(G.time);
  E.sa.textContent=G.teamKills[0];
  E.se.textContent=G.teamKills[1];
  E.obj.innerHTML=objectiveText();
  // boutique
  var near=canShop(p);
  E.shopbtn.classList.toggle("hot",near||HUD.shopHint>0);
  HUD.shopHint=Math.max(0,HUD.shopHint-dt);
  if(shopDirty||HUD.el.shop.classList.contains("on")&&Math.random()<0.1)renderShop();
  // capacités
  E.abs.forEach(function(box,i){
    var ab=p.d.abil[i],cd=p.cds[i],rk=p.ranks[i];
    var btn=box.querySelector(".mv-abb");
    if(HUD.dirty){
      btn.querySelector(".nm").textContent=["1","2","3","R"][i];
      btn.title=ab.name+" — "+ab.desc;
      btn.style.setProperty("--c",ab.color||p.d.fx);
      var pm=i===3?3:5,ph="";for(var k=0;k<pm;k++)ph+='<i class="'+(k<rk?"on":"")+'"></i>';
      box.querySelector(".pips").innerHTML=ph;
    }
    box.classList.toggle("can",canRank(p,i));
    box.classList.toggle("lock",rk<1);
    box.classList.toggle("nomana",rk>0&&p.mana<ab.cost);
    var full=rv(ab.cd,Math.max(1,rk))*(1-p.ah/(p.ah+100));
    btn.querySelector(".cd").style.height=(cd>0?Math.min(100,cd/full*100):0)+"%";
    btn.querySelector("em").textContent=cd>0?(cd<1?cd.toFixed(1):Math.ceil(cd)):"";
  });
  E.sps.forEach(function(b){var id=b.dataset.s,c=p.spells[id];b.querySelector(".cd").style.height=(c>0?c/SPELLS[id].cd*100:0)+"%";b.classList.toggle("cool",c>0);});
  E.recall.classList.toggle("act",p.recall>0);
  E.recall.querySelector(".cd").style.height=(p.recall>0?p.recall/4*100:0)+"%";
  if(HUD.dirty){
    var inv="";for(var s=0;s<INV_MAX;s++){var id=p.items[s];inv+='<i>'+(id?ITEM_BY[id].ico:"")+'</i>';}
    E.inv.innerHTML=inv;
    HUD.dirty=false;
  }
  // mort
  if(p.dead){E.dead.classList.add("on");E.dead.innerHTML='<b>K.O.</b><span>Retour dans '+Math.ceil(Math.max(0,p.respawnT))+' s</span><small>Profites-en pour passer à la boutique 🛒</small>';}
  else E.dead.classList.remove("on");
  // boss
  var boss=G.boss||null;
  if(!boss&&G.mode==="siege"){G.units.forEach(function(u){if(u.kind==="nexus"&&u.team===1)boss=u;});if(boss&&boss.hp>=boss.maxHp)boss=null;}
  if(boss&&!boss.dead){E.boss.classList.add("on");E["boss-n"].textContent=boss.kind==="nexus"?"Nexus de l'Empire":boss.name+(G.enrage?" — ENRAGÉ":"");E["boss-hp"].style.width=(boss.hp/boss.maxHp*100)+"%";E["boss-sh"].style.width=Math.min(100,boss.st.shield/boss.maxHp*100)+"%";}
  else E.boss.classList.remove("on");
  pumpAnnounce(dt);
  // attaque maintenue
  if(HUD.holdAtk){HUD.holdT-=dt;if(HUD.holdT<=0){HUD.holdT=0.25;if(!p.target||p.target.dead)playerAttack();}}
  if(save.settings.autoRank&&p.sp>0){[3,0,2,1].forEach(function(i){rankUp(p,i);});}
  MINI.t-=dt;if(MINI.t<=0){MINI.t=0.1;drawMinimap();}
}
function objectiveText(){
  var t=esc(G.objective||"");
  if(G.floor)t='<span class="fl">ÉTAGE '+G.floor+'</span> '+t;
  return t;
}
function drawMinimap(){
  var cv=HUD.el.mini;if(!cv)return;
  var W=cv.clientWidth,H=cv.clientHeight;if(!W)return;
  var d=Math.min(2,window.devicePixelRatio||1);
  if(cv.width!==Math.round(W*d)){cv.width=Math.round(W*d);cv.height=Math.round(H*d);}
  var c=cv.getContext("2d");c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,W,H);
  var s=Math.min((W-8)/G.W,(H-8)/G.H);MINI.s=s;MINI.ox=(W-G.W*s)/2;MINI.oy=(H-G.H*s)/2;
  c.save();c.translate(MINI.ox,MINI.oy);
  c.fillStyle=hexA(G.theme.g1,0.9);c.fillRect(0,0,G.W*s,G.H*s);
  if(G.mode==="siege"){c.strokeStyle=hexA(G.theme.lane,0.9);c.lineWidth=Math.max(3,110*s);c.beginPath();for(var x=0;x<=G.W;x+=100){var y=laneY(x);if(x===0)c.moveTo(x*s,y*s);else c.lineTo(x*s,y*s);}c.stroke();}
  if(G.mode==="boss"){c.strokeStyle="rgba(255,80,80,.5)";c.lineWidth=1;c.beginPath();c.arc(G.cx*s,G.cy*s,G.arenaR*s,0,Math.PI*2);c.stroke();}
  G.brush.forEach(function(b){c.fillStyle="rgba(40,110,60,.55)";c.beginPath();c.arc(b.x*s,b.y*s,Math.max(1.5,b.r*s),0,Math.PI*2);c.fill();});
  G.units.forEach(function(u){
    if(u.dead||u.pending)return;
    if(u.kind==="champ"&&!visibleTo(u,0))return;
    var col=TEAM_COL[u.team]||"#ccc",r=1.6;
    if(u.kind==="tower"){r=3.4;c.fillStyle=col;c.fillRect(u.x*s-r,u.y*s-r,r*2,r*2);return;}
    if(u.kind==="nexus"){r=5;c.fillStyle=col;c.beginPath();c.moveTo(u.x*s,u.y*s-r);c.lineTo(u.x*s+r,u.y*s);c.lineTo(u.x*s,u.y*s+r);c.lineTo(u.x*s-r,u.y*s);c.fill();return;}
    if(u.kind==="champ")r=u.isPlayer?4:3.2;
    if(u.kind==="monster")col="#e8c46a";
    c.fillStyle=col;c.beginPath();c.arc(u.x*s,u.y*s,r,0,Math.PI*2);c.fill();
    if(u.isPlayer){c.strokeStyle="#fff";c.lineWidth=1.5;c.stroke();}
  });
  if(G.orb){c.fillStyle="#39FF7A";c.beginPath();c.arc(G.orb.x*s,G.orb.y*s,3.5,0,Math.PI*2);c.fill();}
  var z=G.cam.z;c.strokeStyle="rgba(255,255,255,.7)";c.lineWidth=1;
  c.strokeRect((G.cam.x-VW/2/z)*s,(G.cam.y-VH/2/z)*s,VW/z*s,VH/z*s);
  c.restore();
}

// ---------------------------------------------------------------------
// Boucle de jeu
// ---------------------------------------------------------------------
var LOOP={raf:0,last:0,acc:0,running:false};
var STEP=1/60;
function frame(ts){
  if(!LOOP.running||!G)return;
  var dt=Math.min(0.1,(ts-LOOP.last)/1000);LOOP.last=ts;
  var p=G.player;
  if(!G.paused){
    var kj=keyJoy();
    p.joy=HUD.joy&&(HUD.joy.x||HUD.joy.y)?{x:HUD.joy.x,y:HUD.joy.y}:kj;
    if(p.joy){p.order=null;}
    if(HUD.mouse&&performance.now()-HUD.mouse.t>2500)HUD.mouse.fresh=false;
    LOOP.acc+=dt;
    var n=0;
    while(LOOP.acc>=STEP&&n<6){stepMatch(STEP);LOOP.acc-=STEP;n++;if(!LOOP.running)return;}
    if(n>=6)LOOP.acc=0;
    G.playT=(G.playT||0)+dt;
  }
  updateCamera(dt);
  renderFrame();
  updateHud(dt);
  LOOP.raf=requestAnimationFrame(frame);
}
function runMatch(cfg,meta){
  buildGameDom();
  newMatch(cfg);
  G.meta=meta;
  goTo("screen-game");
  CV=HUD.el.canvas;CX=CV.getContext("2d");groundPat=null;
  resizeCanvas();
  HUD.dirty=true;shopDirty=true;shopSel=null;HUD.keys={};HUD.joy=null;HUD.aim=null;HUD.annT=0;
  HUD.el.feed.innerHTML="";HUD.el.joy.classList.remove("on");
  HUD.el.face.src=champPortrait(cfg.champ);
  closeOverlays();
  G.cam.z=viewZoom();
  document.addEventListener("keydown",onKey);document.addEventListener("keyup",onKey);
  announce(meta.title,"info");
  announce(MODE_INFO[G.mode].name+" · "+G.diff.name,"info");
  if(!save.tutoDone){
    setTimeout(function(){hudTip("Joystick à gauche · ⚔ attaque · glisse une capacité pour viser");},900);
    save.tutoDone=true;writeSave(save);
  }
  LOOP.running=true;LOOP.last=performance.now();LOOP.acc=0;
  cancelAnimationFrame(LOOP.raf);
  LOOP.raf=requestAnimationFrame(frame);
}
function stopLoop(){
  LOOP.running=false;cancelAnimationFrame(LOOP.raf);
  document.removeEventListener("keydown",onKey);document.removeEventListener("keyup",onKey);
  HUD.keys={};HUD.joy=null;HUD.aim=null;HUD.holdAtk=false;
}

// ---------------------------------------------------------------------
// Configurations de partie
// ---------------------------------------------------------------------
function seeded(str){return _pRng(_pHash(str));}
function pickAffixes(seedStr,n){
  var r=seeded(seedStr),pool=AFFIXES.map(function(a){return a.id;}),out=[];
  for(var i=0;i<n&&pool.length;i++)out.push(pool.splice(Math.floor(r()*pool.length),1)[0]);
  return out;
}
function missionCfg(m,diffK,champ,allies){
  var acte=getActeFor(m.id),ai=Math.max(0,CAMPAIGN.indexOf(acte));
  var af=ACTE_FOES[ai%ACTE_FOES.length];
  var mode=modeForMission(m);
  var ts=1+allies.length;
  var foeCount=ts+(diffK===2?1:0)+(mode==="defense"?(diffK===0?1:2):0)+(mode==="arena"&&m.ennemis_extra>2&&diffK>0?1:0);
  if(diffK===0&&m.num<=5)foeCount=Math.max(1,foeCount-1); // les premières missions restent douces
  foeCount=clamp(foeCount,1,mode==="defense"?6:5);
  var pool=af.pool.filter(function(k){return CHAMPS[k];});
  if(!pool.length)pool=["DARK"];
  return{mode:mode,champ:champ,allies:allies,foes:pool,foeCount:foeCount,boss:af.boss,diff:diffK,num:m.num,acteIdx:ai,
    themeIdx:ai%THEMES.length,affixes:pickAffixes(m.id+":"+diffK,diffK),
    assist:Math.min(0.36,((save.fails||{})[m.id+":"+diffK]||0)*0.12)};
}
function failleCfg(floor,champ,allies){
  var mode=floor%5===0?"boss":["arena","siege","defense","siege"][floor%4];
  var af=ACTE_FOES[(floor*3)%ACTE_FOES.length];
  var ts=1+allies.length;
  var nAff=Math.min(3,Math.floor(floor/8));
  return{mode:mode,champ:champ,allies:allies,foes:af.pool,foeCount:clamp(ts+(floor>=30?1:0)+(mode==="defense"?2:0),1,6),boss:af.boss,
    diff:floor>=60?2:floor>=25?1:0,num:Math.min(50,floor),floor:floor,acteIdx:floor%CAMPAIGN.length,themeIdx:(floor*7)%THEMES.length,
    affixes:pickAffixes("faille"+floor+":"+weekKey(),nAff)};
}

// ---------------------------------------------------------------------
// Fin de partie et récompenses
// ---------------------------------------------------------------------
function finishMatch(){
  if(!G||!LOOP.running)return;
  stopLoop();
  var g=G,v=!!g.victory,meta=g.meta,st=g.stats,S=save.stats;
  S.games++;if(v)S.wins++;
  S.kills+=st.kills;S.deaths+=st.deaths;S.towers+=st.towers;S.cs+=st.cs;S.ults+=st.ults;S.camps+=st.camps;
  S.healed+=Math.round(st.healed);S.penta+=st.penta;S.playtime+=Math.round(g.playT||g.time);
  if(v&&st.deaths===0&&!g.abandon)S.flawless++;
  if(v&&g.mode==="boss")S.bosses++;
  var perf=1+Math.min(0.5,st.kills*0.03+st.towers*0.05+st.cs*0.002);
  var R={xp:0,cauris:0,mxp:0,relic:null,first:false,lines:[]};
  var diff=g.diff,champ=g.cfg.champ;
  var mission=meta.kind==="mission"?meta.m:null;
  var nextActeNarr=null,unlockTxt="";
  if(g.abandon){
    R.xp=0;R.cauris=0;R.mxp=20;
  }else if(mission){
    var base=40+mission.num*9;
    var d=save.diff[mission.id]||(save.diff[mission.id]=[false,false,false]);
    if(v){
      R.first=!d[diff.id];
      var k=R.first?1:0.4;
      R.xp=Math.round((mission.xp||base)*diff.xp*k*perf+base*0.5);
      R.cauris=Math.round(base*diff.cauris*k*perf);
      R.mxp=Math.round((120+mission.num*6)*diff.xp);
      d[diff.id]=true;
      if(save.fails)delete save.fails[mission.id+":"+diff.id];
      var luck=diff.id*0.25+(R.first?0.3:0)+(g.mode==="boss"?0.35:0);
      if(Math.random()<(R.first?0.8:0.25)+diff.id*0.1)R.relic=rollRelic(luck);
      if(!isMissionDone(mission.id)){
        save.missions_done.push(mission.id);
        if(mission.unlock_ally&&save.allies_unlocked.indexOf(mission.unlock_ally)<0){
          save.allies_unlocked.push(mission.unlock_ally);
          var bc=CHAMPS[mission.unlock_ally];unlockTxt=(bc?bc.name:mission.unlock_ally)+" rejoint les Gardiens du Sud — jouable !";
        }
        if(mission.journal_victoire){var ac=getActeFor(mission.id);save.journal.push({mission:mission.num,acte:ac?ac.label:"I",text:mission.journal_victoire});}
        var acte=getActeFor(mission.id),ai=CAMPAIGN.indexOf(acte);
        if(acte.missions[acte.missions.length-1].id===mission.id&&ai+1<CAMPAIGN.length){
          nextActeNarr=CAMPAIGN[ai+1].narration_debut.slice();nextActeNarr._acteLabel=CAMPAIGN[ai+1].label+" — "+CAMPAIGN[ai+1].titre;
        }
      }
      refundLife();
    }else{
      R.xp=Math.round(base*0.3*diff.xp);R.cauris=Math.round(base*0.2);R.mxp=Math.round(40*diff.xp);
      save.fails=save.fails||{};
      var fk=mission.id+":"+diff.id;
      if(!g.abandon)save.fails[fk]=Math.min(3,(save.fails[fk]||0)+1);
      R.assist=Math.min(0.36,(save.fails[fk]||0)*0.12);
    }
  }else{ // Faille
    var f=g.floor;
    if(v){
      R.first=f>save.faille.best;
      R.xp=Math.round((80+f*14)*perf*(R.first?1:0.5));
      R.cauris=Math.round((50+f*9)*perf*(R.first?1:0.5));
      R.mxp=Math.round(140+f*5);
      save.faille.best=Math.max(save.faille.best,f);
      save.faille.cur=f+1;
      S.floors++;
      if(f%5===0||Math.random()<0.3)R.relic=rollRelic(Math.min(1.2,f*0.012)+(f%5===0?0.3:0));
    }else{
      R.xp=Math.round((30+f*4));R.cauris=Math.round(20+f*3);R.mxp=40;
      save.faille.cur=Math.max(1,f-2);
    }
  }
  var goldBonus=Math.round(st.gold*0.02);R.cauris+=g.abandon?0:goldBonus;
  save.cauris+=R.cauris;save.xp+=R.xp;
  var prevLvl=save.level;var lvGain=checkLevelUp();
  var md=masteryData(champ),prevM=masteryLvl(champ);md.xp+=R.mxp;var newM=masteryLvl(champ);
  save.lastChamp=champ;
  refreshQuests();
  var ach=checkAchievements();
  writeSave(save);
  // unlocks
  var skinUp=newM>prevM?SKINS.filter(function(x){return x.lvl===newM;})[0]:null;
  var res={v:v,R:R,prevLvl:prevLvl,lvGain:lvGain,prevM:prevM,newM:newM,skin:skinUp,ach:ach,unlockTxt:unlockTxt,nextActeNarr:nextActeNarr,g:g};
  var screenCv=HUD.el.canvas;
  if(mission&&!g.abandon){
    var narr=(v?mission.narr_victoire:mission.narr_defaite)||[];
    var showStory=narr.length&&(diff.id===0||R.first);
    setTimeout(function(){
      if(showStory)showNarration(narr,function(){showResults(res);},mission.num+". "+mission.name);
      else showResults(res);
    },300);
  }else setTimeout(function(){showResults(res);},300);
}
function refundLife(){
  try{syncLives();if(save.lives<save.lives_max){save.lives++;if(save.lives>=save.lives_max)save.next_life_ts=null;writeSave(save);writeLifeCookie();}}catch(e){}
}
function showResults(res){
  goTo("screen-end");
  var g=res.g,R=res.R,meta=g.meta;
  var T=document.getElementById("end-title"),Su=document.getElementById("end-subtitle"),N=document.getElementById("end-narration"),W=document.getElementById("end-rewards");
  T.textContent=res.v?"VICTOIRE":(g.abandon?"ABANDON":"DÉFAITE");T.className="end-title "+(res.v?"victory":"defeat");
  Su.textContent=meta.title.toUpperCase()+" · "+g.diff.name.toUpperCase();
  var st=g.stats,p=g.player;
  N.innerHTML='<div class="rs-grid">'+
    rsTile("Durée",fmtTime(g.time))+rsTile("K / M / A",p.kills+" / "+p.deaths+" / "+p.assists)+rsTile("Sbires",p.cs)+rsTile("Tours",st.towers)+rsTile("Or gagné",Math.round(st.gold))+rsTile("Soins",Math.round(st.healed))+
    '</div>'+(res.v?"":'<div class="rs-tip">'+defeatTip(g)+'</div>');
  var h='<div class="reward-title">RÉCOMPENSES'+(R.first?' <span class="rs-first">PREMIÈRE FOIS</span>':'')+'</div>';
  h+=rsRow("Expérience","+"+R.xp+" XP");
  h+=rsRow("Cauris","+"+R.cauris+" 🐚");
  h+=rsRow("Maîtrise "+CHAMPS[g.cfg.champ].name,"+"+R.mxp+(res.newM>res.prevM?"  → niveau "+res.newM:""));
  if(res.lvGain)h+=rsRow("Niveau de compte",res.prevLvl+" → "+save.level+" (+"+res.lvGain+" point"+(res.lvGain>1?"s":"")+" de talent)");
  if(R.relic){var rr2=RARITY[R.relic.rar];h+='<div class="reward-unlock" style="color:'+rr2.color+'">✦ Relique '+rr2.name.toLowerCase()+' : '+esc(relicName(R.relic))+'</div>';}
  if(res.skin)h+='<div class="reward-unlock">✦ Nouvelle tenue : '+res.skin.name+'</div>';
  if(res.unlockTxt)h+='<div class="reward-unlock">✦ '+esc(res.unlockTxt)+'</div>';
  res.ach.forEach(function(a){h+='<div class="reward-unlock">🏆 Succès : '+esc(a.name)+' (+250 🐚)</div>';});
  if(R.assist)h+='<div class="reward-unlock">✦ Renfort des Pierres : +'+Math.round(R.assist*100)+'% de PV et de dégâts au prochain essai</div>';
  if(meta.kind==="mission")h+=rsRow("Étoiles de campagne",totalStars()+" / "+totalMissionsCount()*3);
  else h+=rsRow("Record de la Faille","étage "+save.faille.best);
  h+=rsRow("Contenu terminé",contentProgress()+" %");
  W.innerHTML=h;
  var bh=document.getElementById("btn-hub"),br=document.getElementById("btn-retry");
  function toHub(){
    var go=function(){goTo("screen-hub");buildHub();if(meta.kind==="faille")switchHubTab("faille");};
    if(res.nextActeNarr)showNarration(res.nextActeNarr,go,res.nextActeNarr._acteLabel);else go();
  }
  bh.onclick=function(){
    if(res.lvGain&&typeof showLevelUp==="function"){
      var ls=document.querySelectorAll("#levelup-overlay .lu-stat-label");
      if(ls[0])ls[0].textContent="TALENTS";if(ls[1])ls[1].textContent="CAURIS";
      showLevelUp(res.prevLvl,save.level,res.lvGain,R.cauris,toHub);
    }
    else toHub();
  };
  if(meta.kind==="faille"){
    br.textContent=res.v?"ÉTAGE SUIVANT":"RÉESSAYER";
    br.onclick=function(){launchFaille(save.faille.cur||1,g.cfg.champ,g.cfg.allies);};
  }else{
    br.textContent=res.v?"REJOUER":"RÉESSAYER";
    br.onclick=function(){openDeploy(meta.m.id,g.cfg.diff);};
  }
}
function rsTile(k,v){return '<div class="rs-t"><b>'+v+'</b><span>'+k+'</span></div>';}
function rsRow(k,v){return '<div class="reward-row"><span class="reward-key">'+k+'</span><span class="reward-val">'+v+'</span></div>';}
function defeatTip(g){
  var p=g.player,tips=[];
  if(p.items.length<2)tips.push("Tu as peu acheté : repasse à la fontaine (⌂) pour dépenser ton or.");
  if(p.sp>0)tips.push("Des points de capacité n'ont pas été dépensés — touche les « + ».");
  if(p.deaths>=4)tips.push("Reste derrière tes sbires et hors de portée des tours ennemies (cercle rouge).");
  if(g.mode==="boss")tips.push("Les cercles rouges au sol annoncent les coups du boss : sors-en avant l'impact.");
  if(talentSpent()<talentPoints())tips.push("Tu as "+(talentPoints()-talentSpent())+" point(s) de talent libres dans l'onglet Éveil.");
  if(g.cfg.diff>0)tips.push("Essaie d'abord cette mission en Normal pour monter ta maîtrise.");
  tips.push("Les reliques équipées et la maîtrise renforcent ton champion : fais un tour dans la Faille.");
  return "Conseil : "+tips[0];
}
