// =====================================================================
// ===  EMPLACEMENTS DE SAUVEGARDE : trois parties indépendantes      ===
// =====================================================================
var SLOT_N=3,SLOT_CUR="dpdf_slot_cur";
function slotKey(i){return i===1?"dpdf_save_v2":"dpdf_save_v2_s"+i;}
function curSlot(){
  var v=1;try{v=parseInt(localStorage.getItem(SLOT_CUR)||"1",10);}catch(e){}
  return (v>=1&&v<=SLOT_N)?v:1;
}
function readSlot(i){
  try{var s=localStorage.getItem(slotKey(i));if(!s)return null;var d=JSON.parse(s);if(d&&d.version===2)return d;}catch(e){}
  return null;
}
// à partir d'ici, toute sauvegarde va dans l'emplacement courant
writeSave=function(d){
  try{d.ts=Date.now();localStorage.setItem(slotKey(curSlot()),JSON.stringify(d));}catch(e){}
};
function useSlot(i,fresh){
  try{localStorage.setItem(SLOT_CUR,String(i));}catch(e){}
  var d=fresh?null:readSlot(i);
  save=d||defaultSave();
  migrateSave();refreshQuests();writeSave(save);
  syncLives();
}
function slotSummary(i){
  var d=readSlot(i);
  if(!d)return{empty:true,label:"Emplacement "+i,sub:"Vide — nouvelle partie"};
  var done=(d.missions_done||[]).length,total=totalMissionsCount();
  var stars=0;for(var k in (d.diff||{})){var a=d.diff[k];stars+=(a[0]?1:0)+(a[1]?1:0)+(a[2]?1:0);}
  var when="";
  if(d.ts){var dt=new Date(d.ts);when=dt.toLocaleDateString("fr-FR")+" "+("0"+dt.getHours()).slice(-2)+"h"+("0"+dt.getMinutes()).slice(-2);}
  return{empty:false,label:"Emplacement "+i,
    sub:"Niveau "+(d.level||1)+" · "+done+"/"+total+" missions · ★ "+stars+(d.faille&&d.faille.best?" · Faille "+d.faille.best:""),
    when:when,lvl:d.level||1,done:done,total:total};
}
function openSlots(){
  var ov=document.getElementById("slot-over");
  if(!ov){
    ov=document.createElement("div");ov.id="slot-over";ov.className="mv-over";
    document.body.appendChild(ov);
  }
  var h='<div class="mv-panel"><div class="mv-ph"><b>PARTIES SAUVEGARDÉES</b><button class="mv-x" id="slot-close">✕</button></div>'+
        '<div class="ev-note">Trois parties indépendantes : progression, talents, reliques et Faille séparés. L\'emplacement choisi reste actif jusqu\'à ce que tu en changes.</div>';
  for(var i=1;i<=SLOT_N;i++){
    var s=slotSummary(i),cur=curSlot()===i;
    h+='<div class="slot'+(cur?" cur":"")+(s.empty?" empty":"")+'">'+
        '<div class="slot-i"><b>'+s.label+(cur?' <span class="slot-tag">EN COURS</span>':'')+'</b><small>'+s.sub+'</small>'+(s.when?'<em>dernière session '+s.when+'</em>':'')+'</div>'+
        '<div class="slot-b">'+
          '<button class="btn btn-sm btn-primary" data-act="play" data-i="'+i+'">'+(s.empty?"COMMENCER":"JOUER")+'</button>'+
          (s.empty?"":'<button class="btn btn-sm btn-red" data-act="del" data-i="'+i+'">EFFACER</button>')+
        '</div></div>';
  }
  h+='</div>';
  ov.innerHTML=h;ov.classList.add("on");
  document.getElementById("slot-close").onclick=function(){ov.classList.remove("on");};
  ov.querySelectorAll("[data-act]").forEach(function(b){
    b.onclick=function(){
      var i=+b.dataset.i;
      if(b.dataset.act==="del"){
        if(!confirm("Effacer définitivement l'emplacement "+i+" ?"))return;
        try{localStorage.removeItem(slotKey(i));}catch(e){}
        if(curSlot()===i)useSlot(i,true);
        openSlots();initTitle();return;
      }
      var fresh=!readSlot(i);
      useSlot(i,fresh);
      ov.classList.remove("on");
      if(fresh)showNarration(CAMPAIGN[0].narration_debut,function(){goTo("screen-hub");buildHub();});
      else{goTo("screen-hub");buildHub();}
    };
  });
}
// bouton sur l'écran titre + accès depuis le hub
function installSlotsUI(){
  var btns=document.querySelector("#screen-title .title-btns");
  if(btns&&!document.getElementById("btn-slots")){
    var b=document.createElement("button");
    b.className="btn btn-sm";b.id="btn-slots";b.textContent="PARTIES SAUVEGARDÉES";
    b.onclick=openSlots;btns.appendChild(b);
  }
  var hdr=document.querySelector("#screen-hub .lives-box");
  if(hdr&&!document.getElementById("btn-slots-hub")){
    var h=document.createElement("button");
    h.className="btn btn-sm";h.id="btn-slots-hub";h.style.cssText="margin-top:4px;font-size:9px;padding:3px 8px";
    h.textContent="EMPL. "+curSlot();
    h.onclick=openSlots;hdr.appendChild(h);
  }
}
var _slotInitTitle=initTitle;
initTitle=function(){
  _slotInitTitle();
  installSlotsUI();
  var b=document.getElementById("btn-slots-hub");if(b)b.textContent="EMPL. "+curSlot();
  var st=document.getElementById("save-status");
  if(st){
    var s=slotSummary(curSlot());
    st.textContent="Emplacement "+curSlot()+" — "+(s.empty?"vide":s.sub);
  }
  var c=document.getElementById("btn-continue");
  if(c)c.style.display=readSlot(curSlot())?"block":"none";
};
var _slotBuildHub=buildHub;
buildHub=function(){
  _slotBuildHub();
  installSlotsUI();
  var b=document.getElementById("btn-slots-hub");if(b)b.textContent="EMPL. "+curSlot();
};
// au démarrage, on charge l'emplacement mémorisé
useSlot(curSlot(),false);
