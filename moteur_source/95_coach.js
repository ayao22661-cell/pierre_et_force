// =====================================================================
// ===  APPRENTISSAGE : coach en combat + panneau « Comment jouer »   ===
// =====================================================================
var COACH_STEPS=[
  {id:"move",txt:"Pose ton doigt sur la moitié gauche de l'écran et fais-le glisser : Tarine suit la direction.",
   ok:function(c){return dist(G.player.x,G.player.y,c.x0,c.y0)>420;}},
  {id:"atk",txt:"Approche les sbires ennemis (petits soldats rouges) et touche le gros bouton ⚔. Chaque sbire achevé rapporte de l'or et de l'expérience.",
   ok:function(){return G.player.cs>=3;}},
  {id:"rank",txt:"Tu as un point de capacité : touche le « + » doré sur un bouton rond pour apprendre une capacité.",
   ok:function(){return G.player.ranks[0]+G.player.ranks[1]+G.player.ranks[2]+G.player.ranks[3]>=1;}},
  {id:"cast",txt:"Lance-la : touche le bouton pour viser tout seul, ou garde le doigt dessus et glisse pour viser à la main.",
   ok:function(){return (G.coachCasts||0)>=1;}},
  {id:"shop",txt:"Touche ⌂ pour rentrer à ta base, puis 🛒 pour dépenser ton or. Les objets sont ce qui te rend vraiment plus fort.",
   ok:function(){return G.player.items.length>=1;}},
  {id:"tower",txt:"Avance derrière tes sbires : ils encaissent les tours. Détruis les tours, puis le nexus ennemi pour gagner.",
   ok:function(){return G.stats.towers>=1||G.over;}}
];
var coach=null;
function coachStart(){
  if(save.coachDone||!G||G.floor){coach=null;return;}
  coach={i:0,t:0,x0:G.player.x,y0:G.player.y,done:false};
  G.coachCasts=0;
  coachRender();
}
function coachRender(){
  var el=document.getElementById("mv-coach");
  if(!el){
    el=document.createElement("div");el.id="mv-coach";el.className="mv-coach";
    document.querySelector("#screen-game .mv-hud").appendChild(el);
  }
  if(!coach||coach.done){el.classList.remove("on");return;}
  var st=COACH_STEPS[coach.i];
  el.className="mv-coach on";
  el.innerHTML='<div class="mv-coach-h"><b>APPRENTISSAGE '+(coach.i+1)+'/'+COACH_STEPS.length+'</b><button id="mv-coach-skip">passer</button></div><p>'+esc(st.txt)+'</p>';
  document.getElementById("mv-coach-skip").onclick=function(){
    coach.done=true;save.coachDone=true;writeSave(save);coachRender();
  };
}
function coachTick(dt){
  if(!coach||coach.done||!G)return;
  coach.t+=dt;
  if(coach.t<1.2)return;
  var st=COACH_STEPS[coach.i];
  var ok=false;try{ok=st.ok(coach);}catch(e){}
  if(!ok)return;
  var el=document.getElementById("mv-coach");
  if(el){el.classList.add("ok");setTimeout(function(){if(el)el.classList.remove("ok");},600);}
  sfx("lvl");
  coach.i++;coach.t=0;
  if(coach.i>=COACH_STEPS.length){
    coach.done=true;save.coachDone=true;writeSave(save);
    announce("Tu as les bases. Bonne chance.","good");
  }
  coachRender();
}

// ---------------------------------------------------------------------
// Panneau « Comment jouer » (accessible depuis le hub et la pause)
// ---------------------------------------------------------------------
function openHelp(){
  var ov=document.getElementById("help-over");
  if(!ov){ov=document.createElement("div");ov.id="help-over";ov.className="mv-over";document.body.appendChild(ov);}
  ov.innerHTML='<div class="mv-panel"><div class="mv-ph"><b>COMMENT JOUER</b><button class="mv-x" id="help-close">✕</button></div>'+
  '<div class="hlp">'+
    '<h4>Le but</h4><p>Chaque mission est un combat en temps réel. Ce que tu dois faire dépend du mode, indiqué avant le départ :</p>'+
    '<ul>'+
      '<li><b>🏰 Siège</b> — détruis les tours ennemies puis leur nexus. Tes sbires arrivent par vagues : avance toujours derrière eux.</li>'+
      '<li><b>⚔️ Escarmouche</b> — premier camp à atteindre le score. Une Pierre de pouvoir apparaît au centre.</li>'+
      '<li><b>🛡️ Défense</b> — survis aux vagues et protège ton nexus.</li>'+
      '<li><b>👑 Boss</b> — un adversaire unique en trois phases. Les cercles rouges au sol annoncent ses coups : sors-en.</li>'+
    '</ul>'+
    '<h4>Les commandes</h4>'+
    '<ul>'+
      '<li>Doigt sur la <b>moitié gauche</b> : déplacement libre.</li>'+
      '<li><b>⚔</b> : attaque la cible la plus proche. Reste appuyé pour enchaîner.</li>'+
      '<li>Boutons ronds <b>1, 2, 3, R</b> : capacités. Appui court = visée automatique, appui long + glisser = visée libre.</li>'+
      '<li><b>+</b> doré : apprendre ou améliorer une capacité (un point par niveau).</li>'+
      '<li><b>✦</b> saut, <b>✚</b> souffle (soin), <b>⌂</b> retour à la base.</li>'+
      '<li><b>🛒</b> : boutique, uniquement à ta base ou pendant ta réapparition.</li>'+
    '</ul>'+
    '<h4>Pendant le combat</h4>'+
    '<p>Tu commences chaque mission au niveau 1 : l\'or et les niveaux gagnés dans une partie ne sont pas conservés. Achever un sbire au dernier coup rapporte l\'or — c\'est la base de ta puissance. Les tours font très mal : n\'y entre jamais sans sbires devant toi.</p>'+
    '<h4>Entre les combats</h4>'+
    '<ul>'+
      '<li><b>Éveil</b> — talents permanents (un point par niveau de compte), reliques à équiper et améliorer, maîtrise des héros.</li>'+
      '<li><b>Faille</b> — étages infinis, défis quotidiens, succès. C\'est là qu\'on farme sans limite.</li>'+
      '<li>Chaque mission se rejoue en <b>Normal, Héroïque et Légendaire</b> : trois étoiles par mission.</li>'+
      '<li>Si une mission te résiste, réessaie : les Pierres te renforcent à chaque échec.</li>'+
    '</ul>'+
  '</div></div>';
  ov.classList.add("on");
  document.getElementById("help-close").onclick=function(){ov.classList.remove("on");};
}
function installHelpUI(){
  var lb=document.querySelector("#screen-hub .lives-box");
  if(lb&&!document.getElementById("btn-help")){
    var b=document.createElement("button");
    b.className="btn btn-sm";b.id="btn-help";b.style.cssText="margin-top:4px;font-size:9px;padding:3px 8px";
    b.textContent="? COMMENT JOUER";b.onclick=openHelp;lb.appendChild(b);
  }
}
var _helpBuildHub=buildHub;
buildHub=function(){_helpBuildHub();installHelpUI();};


// ---------------------------------------------------------------------
// Narrations : bouton PASSER visible, apparition plus rapide, clic immédiat
// ---------------------------------------------------------------------
var _baseShowNarration=showNarration;
showNarration=function(lines,cb,label){
  _baseShowNarration(lines,cb,label);
  var sc=document.getElementById("screen-narration");
  var done=false;
  var go=function(){if(done)return;done=true;sc.onclick=null;if(cb)cb();};
  sc.onclick=go;                       // plus d'attente d'une seconde
  var el=sc.querySelectorAll(".narr-line");
  el.forEach(function(l,i){setTimeout(function(){l.classList.add("visible");},120+i*260);});
  var btn=document.getElementById("narr-skip");
  if(!btn){btn=document.createElement("button");btn.id="narr-skip";btn.className="narr-skip";sc.appendChild(btn);}
  btn.textContent="PASSER ▸";
  btn.onclick=function(e){e.stopPropagation();go();};
};
