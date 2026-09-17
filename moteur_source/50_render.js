// =====================================================================
// ===  RENDU : décor, personnages animés, effets                     ===
// =====================================================================
var CV=null,CX=null,DPR=1,VW=0,VH=0;
var groundPat=null,groundPatTheme=null;

// ---------------------------------------------------------------------
// Effets
// ---------------------------------------------------------------------
function fxP(p){if(G.fx.length>700)G.fx.shift();p.t=0;G.fx.push(p);}
function fxBurst(x,y,col,n,sp){
  var q=G&&CX?(save.settings.quality||1):1;n=Math.round(n*(q>=1?1:0.5));
  for(var i=0;i<n;i++){var a=Math.random()*Math.PI*2,s=rand(0.3,1)*sp;fxP({k:"dot",x:x,y:y-10,vx:Math.cos(a)*s,vy:Math.sin(a)*s-40,life:rand(0.35,0.8),size:rand(2,5),col:col,drag:3,add:true});}
}
function fxTrail(x,y,col,size){fxP({k:"dot",x:x+rand(-3,3),y:y+rand(-3,3),vx:0,vy:-10,life:0.3,size:Math.max(2,size),col:col,drag:0,add:true});}
function fxRise(x,y,col){fxP({k:"dot",x:x,y:y,vx:0,vy:-rand(80,160),life:0.8,size:rand(2,4),col:col,drag:0,add:true});}
function fxRing(x,y,r,col,life){fxP({k:"ring",x:x,y:y,r0:r*0.4,r1:r,life:life||0.5,col:col,add:true});}
function fxNova(x,y,r,col,big){
  fxP({k:"nova",x:x,y:y,r:r,life:big?0.7:0.45,col:col,add:true});
  fxP({k:"ring",x:x,y:y,r0:r*0.2,r1:r*1.05,life:big?0.6:0.4,col:col,add:true,w:big?10:5});
  fxBurst(x,y,col,big?50:22,r*1.3);
  if(big)fxP({k:"flash",x:x,y:y,r:r*1.4,life:0.25,col:col,add:true});
}
function fxHit(x,y,col,big){
  fxP({k:"spark",x:x,y:y-18,life:0.22,size:big?30:18,col:col,add:true,rot:Math.random()*3});
  fxBurst(x,y,col,big?8:4,big?180:110);
}
function fxSlash(u,t,col,crit){
  var a=Math.atan2(t.y-u.y,t.x-u.x);
  fxP({k:"slash",x:u.x+Math.cos(a)*u.r*0.9,y:u.y-18+Math.sin(a)*u.r*0.6,a:a,r:u.r+26+(crit?14:0),life:0.2,col:col,add:true,w:crit?7:4,flip:u.anim.flip=(!u.anim.flip)});
  fxHit(t.x,t.y,col,crit);
}
function fxCone(x,y,a,r,ang,col){fxP({k:"cone",x:x,y:y,a:a,r:r,ang:ang,life:0.3,col:col,add:true});}
function fxBeam(x1,y1,x2,y2,col,life){fxP({k:"beam",x:x1,y:y1,x2:x2,y2:y2,life:life,col:col,add:true});}
function fxLine(x,y,dx,dy,len,w,col){
  fxP({k:"line",x:x,y:y,dx:dx,dy:dy,len:len,w:w,life:0.45,col:col,add:true});
  for(var i=0;i<24;i++){var k=Math.random()*len;fxP({k:"dot",x:x+dx*k+rand(-w/3,w/3),y:y+dy*k-10+rand(-w/3,w/3),vx:rand(-60,60),vy:rand(-120,-20),life:rand(0.3,0.7),size:rand(2,5),col:col,drag:2,add:true});}
}
function fxCharge(u,r,d,col){fxP({k:"charge",u:u,r:r,life:d,col:col,add:true});}
function fxDeath(u){
  var col=u.kind==="champ"?u.d.fx:u.kind==="tower"||u.kind==="nexus"?TEAM_COL[u.team]:u.ghost||"#aaa";
  var big=u.kind==="tower"||u.kind==="nexus"||u.isBoss;
  fxBurst(u.x,u.y,col,big?80:u.kind==="champ"?36:10,big?420:u.kind==="champ"?240:120);
  if(big){fxNova(u.x,u.y,u.kind==="nexus"?420:260,col,true);for(var i=0;i<24;i++)fxP({k:"debris",x:u.x+rand(-30,30),y:u.y-rand(20,120),vx:rand(-260,260),vy:rand(-420,-120),life:rand(0.8,1.5),size:rand(5,12),col:"#5a5060",g:900});}
  if(u.kind==="champ")fxP({k:"soul",x:u.x,y:u.y,life:1.2,col:col,add:true});
}
function fxText(x,y,txt,col,big){
  if(G.texts.length>60)G.texts.shift();
  G.texts.push({x:x,y:y,txt:txt,col:col,big:big,t:0,life:big?1.1:0.85,vx:rand(-30,30),vy:big?-120:-90});
}
function shake(a){if(save.settings.shake!==false)G.shakeA=Math.max(G.shakeA,a);}
function hitStop(t){G.stop=Math.max(G.stop,t);}
function updateFx(dt){
  for(var i=G.fx.length-1;i>=0;i--){
    var p=G.fx[i];p.t+=dt;
    if(p.t>=p.life){G.fx.splice(i,1);continue;}
    if(p.vx!=null){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.drag){p.vx*=1-Math.min(1,p.drag*dt);p.vy*=1-Math.min(1,p.drag*dt);}if(p.g)p.vy+=p.g*dt;}
  }
  for(var j=G.texts.length-1;j>=0;j--){var t=G.texts[j];t.t+=dt;t.x+=t.vx*dt;t.y+=t.vy*dt;t.vy+=160*dt;if(t.t>=t.life)G.texts.splice(j,1);}
  G.shakeA=Math.max(0,G.shakeA-dt*40);
  // ambiance
  var amb=G.theme.amb,cam=G.cam;
  var rate={snow:40,rain:70,ember:14,dust:8,firefly:6,mote:10,star:6,bubble:8,mist:3,leaf:4}[amb]||5;
  if(save.settings.quality<1)rate*=0.4;
  var n=rate*dt;
  while(n>0){
    if(Math.random()<n){
      var vw=VW/cam.z,vh=VH/cam.z;
      var x=cam.x+rand(-vw/2,vw/2),y=cam.y+rand(-vh/2,vh/2);
      var p2={k:"amb",a:amb,x:x,y:y,life:rand(1.5,4),size:rand(1,3),col:G.theme.acc};
      if(amb==="snow"){p2.vx=rand(-20,20);p2.vy=rand(40,90);p2.col="#fff";p2.y=cam.y-vh/2;p2.life=vh/60;}
      else if(amb==="rain"){p2.vx=-60;p2.vy=700;p2.col="#9bb4d8";p2.y=cam.y-vh/2+rand(0,vh*0.6);p2.life=0.6;}
      else if(amb==="ember"){p2.vx=rand(-20,20);p2.vy=rand(-60,-20);p2.col=Math.random()<0.5?"#ff7a2a":"#ffcc55";p2.add=true;}
      else if(amb==="bubble"){p2.vx=rand(-10,10);p2.vy=rand(-50,-20);p2.col="#bff";}
      else if(amb==="leaf"){p2.vx=rand(20,50);p2.vy=rand(10,40);p2.col="#6a8a3a";p2.size=4;}
      else if(amb==="dust"){p2.vx=rand(20,60);p2.vy=rand(-5,5);p2.col="rgba(255,220,170,.5)";}
      else if(amb==="mist"){p2.vx=rand(5,15);p2.vy=0;p2.size=rand(60,120);p2.col="rgba(220,240,240,.05)";}
      else {p2.vx=rand(-12,12);p2.vy=rand(-18,-4);p2.add=true;}
      fxP(p2);
    }
    n-=1;
  }
}

// ---------------------------------------------------------------------
// Caméra et coordonnées
// ---------------------------------------------------------------------
function resizeCanvas(){
  if(!CV)return;
  DPR=Math.min(window.devicePixelRatio||1,(save.settings.quality||1)>=1?2:1.25);
  VW=CV.clientWidth;VH=CV.clientHeight;
  CV.width=Math.round(VW*DPR);CV.height=Math.round(VH*DPR);
}
function viewZoom(){
  // on montre une portion plus large du champ de bataille : lisibilité MOBA
  var span=Math.max(VW,VH*1.25);
  var z=span/1750;
  if(G&&G.affix.brume)z*=1.15;
  return clamp(z,0.34,0.95);
}
function screenToWorld(sx,sy){var c=G.cam;return{x:c.x+(sx-VW/2)/c.z,y:c.y+(sy-VH/2)/c.z};}
function worldToScreen(x,y){var c=G.cam;return{x:(x-c.x)*c.z+VW/2,y:(y-c.y)*c.z+VH/2};}
function updateCamera(dt){
  var c=G.cam,p=G.player;
  c.z=viewZoom();
  var tx=p.x,ty=p.y;
  if(G.camFree){tx=G.camFree.x;ty=G.camFree.y;}
  if(G.aimInd){tx+=G.aimInd.dx*60;ty+=G.aimInd.dy*60;}
  var k=1-Math.pow(0.0008,dt);
  c.x+=(tx-c.x)*k;c.y+=(ty-c.y)*k;
  var hw=VW/2/c.z,hh=VH/2/c.z;
  c.x=hw*2>G.W?G.W/2:clamp(c.x,hw,G.W-hw);
  c.y=hh*2>G.H?G.H/2:clamp(c.y,hh,G.H-hh);
}

// ---------------------------------------------------------------------
// Sol
// ---------------------------------------------------------------------
function makeGroundPattern(th){
  var s=256,c=document.createElement("canvas");c.width=c.height=s;
  var x=c.getContext("2d");
  x.fillStyle=th.g1;x.fillRect(0,0,s,s);
  var rnd=_pRng(_pHash(th.name));
  for(var i=0;i<140;i++){
    x.globalAlpha=0.05+rnd()*0.12;
    x.fillStyle=rnd()<0.5?th.g2:"#000";
    var r=2+rnd()*22;
    x.beginPath();x.ellipse(rnd()*s,rnd()*s,r,r*0.6,rnd()*3,0,Math.PI*2);x.fill();
  }
  x.globalAlpha=0.18;x.strokeStyle=th.g2;x.lineWidth=1;
  for(var j=0;j<18;j++){x.beginPath();var sx=rnd()*s,sy=rnd()*s;x.moveTo(sx,sy);x.lineTo(sx+rnd()*14-7,sy-4-rnd()*8);x.stroke();}
  x.globalAlpha=1;
  return c;
}
function drawGround(ctx){
  var th=G.theme;
  if(groundPatTheme!==th){groundPat=ctx.createPattern(makeGroundPattern(th),"repeat");groundPatTheme=th;}
  var c=G.cam,vw=VW/c.z,vh=VH/c.z,x0=c.x-vw/2,y0=c.y-vh/2;
  ctx.fillStyle=th.wall;ctx.fillRect(x0-10,y0-10,vw+20,vh+20);
  ctx.fillStyle=groundPat;
  if(G.mode==="boss"){
    ctx.beginPath();ctx.arc(G.cx,G.cy,G.arenaR+220,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.globalAlpha=0.25;ctx.strokeStyle=th.acc;ctx.lineWidth=6;
    ctx.beginPath();ctx.arc(G.cx,G.cy,G.arenaR,0,Math.PI*2);ctx.stroke();
    ctx.lineWidth=2;ctx.setLineDash([18,22]);ctx.beginPath();ctx.arc(G.cx,G.cy,G.arenaR*0.55,G.time*0.05,Math.PI*2+G.time*0.05);ctx.stroke();ctx.setLineDash([]);
    // rune au sol
    for(var k=0;k<5;k++){var a=k/5*Math.PI*2-Math.PI/2+G.time*0.05;ctx.beginPath();ctx.moveTo(G.cx+Math.cos(a)*G.arenaR*0.55,G.cy+Math.sin(a)*G.arenaR*0.55);var a2=a+Math.PI*0.8;ctx.lineTo(G.cx+Math.cos(a2)*G.arenaR*0.55,G.cy+Math.sin(a2)*G.arenaR*0.55);ctx.stroke();}
    ctx.restore();
  }else{
    roundRect(ctx,20,20,G.W-40,G.H-40,60);ctx.fill();
  }
  // voie
  ctx.save();
  ctx.lineCap="round";ctx.lineJoin="round";
  if(G.mode==="siege"){
    strokePath(ctx,G.path,300,"rgba(0,0,0,.18)");
    strokePath(ctx,G.path,260,th.lane);
    ctx.globalAlpha=0.35;strokePath(ctx,G.path,6,th.g2,[30,40]);ctx.globalAlpha=1;
    // rivière
    var rv=G.river;
    var grd=ctx.createLinearGradient(rv.x-rv.w,0,rv.x+rv.w,0);
    grd.addColorStop(0,"rgba(40,120,160,0)");grd.addColorStop(0.5,"rgba(60,150,190,.45)");grd.addColorStop(1,"rgba(40,120,160,0)");
    ctx.fillStyle=grd;ctx.fillRect(rv.x-rv.w,20,rv.w*2,G.H-40);
    ctx.globalAlpha=0.35;ctx.strokeStyle="#bfefff";ctx.lineWidth=2;
    for(var w=0;w<6;w++){var yy=((G.time*40+w*260)%(G.H-40))+20;ctx.beginPath();ctx.moveTo(rv.x-30,yy);ctx.quadraticCurveTo(rv.x,yy+10,rv.x+30,yy);ctx.stroke();}
    ctx.globalAlpha=1;
    // bases
    [0,1].forEach(function(t){var f=G.fount[t];var g=ctx.createRadialGradient(f.x,f.y,20,f.x,f.y,520);g.addColorStop(0,hexA(TEAM_COL[t],0.35));g.addColorStop(1,hexA(TEAM_COL[t],0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,520,0,Math.PI*2);ctx.fill();});
  }else if(G.mode==="defense"){
    G.paths.forEach(function(p){strokePath(ctx,p,150,th.lane);});
    var f0=G.fount[0];var g0=ctx.createRadialGradient(f0.x,f0.y,20,f0.x,f0.y,600);g0.addColorStop(0,hexA(TEAM_COL[0],0.35));g0.addColorStop(1,hexA(TEAM_COL[0],0));ctx.fillStyle=g0;ctx.beginPath();ctx.arc(f0.x+200,f0.y,600,0,Math.PI*2);ctx.fill();
    // portail ennemi
    var px=G.W-150,py=G.H/2;
    ctx.save();ctx.translate(px,py);ctx.rotate(G.time*0.6);
    for(var r=0;r<3;r++){ctx.strokeStyle=hexA(TEAM_COL[1],0.5-r*0.12);ctx.lineWidth=8-r*2;ctx.beginPath();ctx.ellipse(0,0,110+r*30,420,0,0,Math.PI*1.6);ctx.stroke();}
    ctx.restore();
  }else if(G.mode==="arena"){
    ctx.globalAlpha=0.5;ctx.strokeStyle=th.lane;ctx.lineWidth=40;
    ctx.beginPath();ctx.arc(G.W/2,G.H/2,420,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(300,G.H/2);ctx.lineTo(G.W-300,G.H/2);ctx.stroke();
    ctx.globalAlpha=1;
    [0,1].forEach(function(t){var f=G.fount[t];var g=ctx.createRadialGradient(f.x,f.y,20,f.x,f.y,380);g.addColorStop(0,hexA(TEAM_COL[t],0.35));g.addColorStop(1,hexA(TEAM_COL[t],0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,380,0,Math.PI*2);ctx.fill();});
    if(G.orb){
      var o=G.orb,pul=1+Math.sin(G.time*5)*0.15;
      ctx.save();ctx.globalCompositeOperation="lighter";
      var og=ctx.createRadialGradient(o.x,o.y-20,4,o.x,o.y-20,90*pul);og.addColorStop(0,"#fff");og.addColorStop(0.3,th.acc);og.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=og;ctx.beginPath();ctx.arc(o.x,o.y-20,90*pul,0,Math.PI*2);ctx.fill();ctx.restore();
      drawGem(ctx,o.x,o.y-30-Math.sin(G.time*3)*6,16,th.acc);
    }
  }
  // fontaine
  G.fount.forEach(function(f,t){
    if(G.mode==="boss"&&t===1)return;
    ctx.save();ctx.translate(f.x,f.y);
    ctx.globalAlpha=0.8;ctx.strokeStyle=TEAM_COL[t];ctx.lineWidth=4;
    ctx.beginPath();ctx.ellipse(0,0,120,70,0,0,Math.PI*2);ctx.stroke();
    ctx.rotate(G.time*0.4);ctx.setLineDash([10,14]);ctx.beginPath();ctx.ellipse(0,0,90,90,0,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  });
  // camps (empreintes)
  G.camps.forEach(function(c){
    ctx.save();ctx.globalAlpha=0.35;ctx.strokeStyle=c.buff==="red"?"#ff6a3d":c.buff==="blue"?"#4ea8ff":"#e8c46a";ctx.lineWidth=3;ctx.setLineDash([6,8]);
    ctx.beginPath();ctx.arc(c.x,c.y,c.big?90:60,0,Math.PI*2);ctx.stroke();ctx.restore();
  });
  ctx.restore();
}
function strokePath(ctx,p,w,col,dash){
  ctx.strokeStyle=col;ctx.lineWidth=w;if(dash)ctx.setLineDash(dash);
  ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);
  for(var i=1;i<p.length-1;i++){var mx=(p[i].x+p[i+1].x)/2,my=(p[i].y+p[i+1].y)/2;ctx.quadraticCurveTo(p[i].x,p[i].y,mx,my);}
  ctx.lineTo(p[p.length-1].x,p[p.length-1].y);ctx.stroke();ctx.setLineDash([]);
}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function hexA(hex,a){
  if(hex.charAt(0)!=="#")return hex;
  var h=hex.slice(1);if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var n=parseInt(h,16);return "rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")";
}
function shade(hex,k){
  var h=hex.slice(1);if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var n=parseInt(h,16),r=n>>16&255,g=n>>8&255,b=n&255;
  if(k>0){r+=(255-r)*k;g+=(255-g)*k;b+=(255-b)*k;}else{r*=1+k;g*=1+k;b*=1+k;}
  return "rgb("+Math.round(r)+","+Math.round(g)+","+Math.round(b)+")";
}

// ---------------------------------------------------------------------
// Décor
// ---------------------------------------------------------------------
function drawProp(ctx,p){
  var t=p.type,r=p.r,x=p.x,y=p.y,th=G.theme,s=p.seed;
  ctx.fillStyle="rgba(0,0,0,.28)";ctx.beginPath();ctx.ellipse(x+r*0.2,y+r*0.25,r*1.05,r*0.45,0,0,Math.PI*2);ctx.fill();
  var sway=Math.sin(G.time*1.2+s*9)*2;
  if(t==="tree"||t==="baobab"||t==="palm"||t==="hedge"){
    ctx.fillStyle=t==="baobab"?"#6a4a34":"#4a3222";
    ctx.fillRect(x-r*(t==="baobab"?0.35:0.14),y-r*1.3,r*(t==="baobab"?0.7:0.28),r*1.35);
    var leaf=t==="palm"?"#3f7a3a":t==="hedge"?"#2f5a2a":t==="baobab"?"#5a7a34":"#356a2c";
    if(t==="palm"){
      ctx.strokeStyle=leaf;ctx.lineWidth=7;ctx.lineCap="round";
      for(var i=0;i<6;i++){var a=i/6*Math.PI*2+sway*0.05;ctx.beginPath();ctx.moveTo(x,y-r*1.3);ctx.quadraticCurveTo(x+Math.cos(a)*r*0.8,y-r*1.7+Math.sin(a)*r*0.3,x+Math.cos(a)*r*1.3,y-r*1.1+Math.sin(a)*r*0.5);ctx.stroke();}
    }else{
      for(var j=0;j<4;j++){
        ctx.fillStyle=j%2?shade(leaf,0.12):leaf;
        ctx.beginPath();ctx.arc(x+sway+(j-1.5)*r*0.42,y-r*1.45-(j%2)*r*0.3,r*(0.62+(j%2)*0.1),0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle=hexA("#ffffff",0.08);ctx.beginPath();ctx.arc(x+sway-r*0.3,y-r*1.8,r*0.35,0,Math.PI*2);ctx.fill();
    }
  }else if(t==="crystal"||t==="ice"){
    var col=t==="ice"?"#cfefff":th.acc;
    for(var k=0;k<3;k++){
      var hx=x+(k-1)*r*0.45,hh=r*(1.6-Math.abs(k-1)*0.5);
      ctx.fillStyle=k===1?hexA(col,0.9):hexA(col,0.6);
      ctx.beginPath();ctx.moveTo(hx,y-hh*1.4);ctx.lineTo(hx+r*0.28,y-hh*0.3);ctx.lineTo(hx,y);ctx.lineTo(hx-r*0.28,y-hh*0.3);ctx.closePath();ctx.fill();
      ctx.fillStyle="rgba(255,255,255,.35)";ctx.beginPath();ctx.moveTo(hx,y-hh*1.4);ctx.lineTo(hx+r*0.1,y-hh*0.4);ctx.lineTo(hx,y-hh*0.2);ctx.closePath();ctx.fill();
    }
    if(t==="crystal"){ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=0.25+Math.sin(G.time*2+s*6)*0.1;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y-r,r*1.1,0,Math.PI*2);ctx.fill();ctx.restore();}
  }else if(t==="lamp"){
    ctx.fillStyle="#2a2f3a";ctx.fillRect(x-4,y-r*2.4,8,r*2.4);ctx.fillRect(x-4,y-r*2.4,r*0.7,6);
    ctx.save();ctx.globalCompositeOperation="lighter";var lg=ctx.createRadialGradient(x+r*0.6,y-r*2.2,2,x+r*0.6,y-r*2.2,r*2.4);lg.addColorStop(0,"rgba(255,220,130,.8)");lg.addColorStop(1,"rgba(255,220,130,0)");ctx.fillStyle=lg;ctx.beginPath();ctx.arc(x+r*0.6,y-r*2.2,r*2.4,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.fillStyle="#3a4050";ctx.beginPath();ctx.arc(x,y,r*0.5,0,Math.PI*2);ctx.fill();
  }else if(t==="mud"||t==="ruin"||t==="pillar"){
    var wc=t==="mud"?"#9a6a3a":t==="ruin"?"#4a4440":shade(th.wall,0.25);
    ctx.fillStyle=shade(wc,-0.25);ctx.fillRect(x-r*0.8,y-r*1.8,r*1.6,r*1.9);
    ctx.fillStyle=wc;ctx.fillRect(x-r*0.8,y-r*1.8,r*1.6,r*0.35);
    ctx.fillStyle=shade(wc,0.15);ctx.fillRect(x-r*0.8,y-r*1.8,r*0.35,r*1.9);
    if(t==="mud"){ctx.fillStyle=shade(wc,-0.35);for(var q=0;q<3;q++)ctx.fillRect(x-r*0.6+q*r*0.5,y-r*2.05,5,r*0.35);}
    if(t==="pillar"){ctx.save();ctx.globalCompositeOperation="lighter";ctx.fillStyle=hexA(th.acc,0.6+Math.sin(G.time*2+s*5)*0.2);ctx.fillRect(x-4,y-r*1.6,8,r*1.3);ctx.restore();}
    if(t==="ruin"&&s>0.5){ctx.save();ctx.globalCompositeOperation="lighter";ctx.fillStyle="rgba(255,120,40,"+(0.3+Math.sin(G.time*8+s*9)*0.15)+")";ctx.beginPath();ctx.arc(x,y-r*1.9,r*0.4,0,Math.PI*2);ctx.fill();ctx.restore();}
  }else if(t==="lava"||t==="rock"){
    ctx.fillStyle=t==="lava"?"#2a1a18":"#5a5a4a";
    ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x-r*0.7,y-r*0.9);ctx.lineTo(x+r*0.1,y-r*1.2);ctx.lineTo(x+r,y-r*0.5);ctx.lineTo(x+r*0.8,y);ctx.closePath();ctx.fill();
    ctx.fillStyle=t==="lava"?"#3a2420":"#6e6e5c";ctx.beginPath();ctx.moveTo(x-r*0.7,y-r*0.9);ctx.lineTo(x+r*0.1,y-r*1.2);ctx.lineTo(x,y-r*0.6);ctx.closePath();ctx.fill();
    if(t==="lava"){ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle="rgba(255,90,30,"+(0.6+Math.sin(G.time*3+s*9)*0.3)+")";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-r*0.5,y-r*0.3);ctx.lineTo(x,y-r*0.7);ctx.lineTo(x+r*0.5,y-r*0.4);ctx.stroke();ctx.restore();}
  }else if(t==="coral"){
    ctx.strokeStyle=s>0.5?"#ff7a9a":"#ffb36a";ctx.lineWidth=6;ctx.lineCap="round";
    for(var c=0;c<5;c++){var a2=-Math.PI/2+(c-2)*0.35;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.cos(a2)*r*0.6+sway,y-r*0.8,x+Math.cos(a2)*r+sway,y-r*1.4);ctx.stroke();}
  }
}
function drawBrush(ctx,b,top){
  var n=11;
  for(var i=0;i<n;i++){
    var a=i/n*Math.PI*2+b.seed*5,rr=b.r*(0.45+((i*7919)%5)/10);
    var x=b.x+Math.cos(a)*rr*0.8,y=b.y+Math.sin(a)*rr*0.5;
    var sway=Math.sin(G.time*2+i+b.seed*10)*3;
    ctx.fillStyle=top?"rgba(60,110,50,.55)":"#2e5a28";
    ctx.beginPath();
    for(var k=0;k<5;k++){var bx=x+(k-2)*8;ctx.moveTo(bx-5,y);ctx.quadraticCurveTo(bx+sway,y-34,bx+sway*1.5+2,y-46);ctx.quadraticCurveTo(bx+4,y-20,bx+5,y);}
    ctx.fill();
  }
}

// ---------------------------------------------------------------------
// Personnages
// ---------------------------------------------------------------------
function drawChamp(ctx,u,alpha){
  var L=u.look,s=u.r/27,an=u.anim;
  var bob=Math.abs(Math.sin(an.walk))*3*an.moving+Math.sin(G.time*2.2+u.id)*1.2*(1-an.moving);
  var face=u.face||1;
  var accent=u.skin||L.accent;
  var hit=an.hit;
  ctx.save();
  ctx.translate(u.x,u.y);
  if(an.spawn>0){ctx.globalAlpha=alpha*(1-an.spawn);ctx.scale(1+an.spawn*0.3,1-an.spawn*0.3);}else ctx.globalAlpha=alpha;
  // ombre
  ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(0,2,u.r*1.05,u.r*0.42,0,0,Math.PI*2);ctx.fill();
  // anneau d'équipe
  ctx.strokeStyle=u.isPlayer?"#ffd24a":TEAM_COL[u.team];ctx.lineWidth=u.isPlayer?3:2;ctx.globalAlpha*=0.85;
  ctx.beginPath();ctx.ellipse(0,2,u.r*1.1,u.r*0.46,0,0,Math.PI*2);ctx.stroke();
  if(u.isBoss){ctx.lineWidth=3;ctx.strokeStyle=hexA(u.d.fx,0.6);ctx.beginPath();ctx.ellipse(0,2,u.r*1.5+Math.sin(G.time*4)*4,u.r*0.62,0,0,Math.PI*2);ctx.stroke();}
  ctx.globalAlpha=an.spawn>0?alpha*(1-an.spawn):alpha;
  // aura
  if(u.d.orbit){
    for(var o=0;o<3;o++){var oa=G.time*2+o*2.09;var ox=Math.cos(oa)*u.r*1.25,oy=Math.sin(oa)*u.r*0.5-26*s;
      if(Math.sin(oa)<0)drawGem(ctx,ox,oy,5*s,"#dff0ff");}
  }
  ctx.scale(face*s,s);
  ctx.translate(0,-bob);
  var form=L.form,body=u.d.body;
  var cloth=L.cloth,skin=L.skin;
  if(form==="shadow"){cloth="#1a0d24";skin="#2a1638";}
  if(form==="stone"){cloth="#4a5560";skin="#6a7680";}
  if(form==="liquid"){cloth="#0d3a4a";skin="#1a6a80";}
  if(form==="wind"){cloth="#2a5a66";skin="#bfe8f0";}
  var bw=body===2?1.3:body===1?1.08:0.95;
  // jambes
  var sw=Math.sin(an.walk)*7*an.moving;
  ctx.fillStyle=shade(cloth,-0.3);
  if(form!=="liquid"&&form!=="wind"){
    rr(ctx,-7*bw-3,-16,7,17+sw*0.4,3);ctx.fill();
    rr(ctx,3*bw-1,-16,7,17-sw*0.4,3);ctx.fill();
    ctx.fillStyle="#1a1414";rr(ctx,-7*bw-4+sw*0.5,-1+sw*0.2,9,4,2);ctx.fill();rr(ctx,3*bw-2-sw*0.5,-1-sw*0.2,9,4,2);ctx.fill();
  }else{
    ctx.fillStyle=hexA(cloth,0.8);ctx.beginPath();ctx.moveTo(-12*bw,-18);ctx.quadraticCurveTo(Math.sin(G.time*5)*6,6,12*bw,-18);ctx.fill();
  }
  // bras arrière
  var atk=an.atk,cast=an.cast;
  var armA=-0.3+Math.sin(an.walk)*0.5*an.moving;
  var swing=atk>0?Math.sin((1-atk)*Math.PI)*2.2:0;
  drawArm(ctx,-10*bw,-38,armA-swing*0.3-cast*2.2,skin,cloth,s);
  // torse
  ctx.fillStyle=cloth;
  rr(ctx,-12*bw,-44,24*bw,30,8);ctx.fill();
  ctx.fillStyle=shade(cloth,0.12);rr(ctx,-12*bw,-44,10*bw,30,8);ctx.fill();
  ctx.fillStyle=accent;ctx.fillRect(-12*bw,-22,24*bw,4);
  if(body===2){ctx.fillStyle=shade(cloth,-0.2);rr(ctx,-15*bw,-45,30*bw,8,4);ctx.fill();}
  if(u.key==="TARINE"||u.key==="SAM"){ctx.fillStyle=accent;ctx.beginPath();ctx.arc(0,-34,3.2,0,Math.PI*2);ctx.fill();}
  // tête
  var hy=-54;
  if(form==="shadow"){
    ctx.fillStyle=skin;ctx.beginPath();ctx.arc(0,hy,12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=L.eye;ctx.fillRect(2,hy-2,5,2.5);ctx.fillRect(-4,hy-2,4,2.5);
  }else{
    ctx.fillStyle=skin;ctx.beginPath();ctx.arc(0,hy,11.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=shade(skin,-0.15);ctx.beginPath();ctx.arc(-3,hy+1,9,Math.PI*0.6,Math.PI*1.3);ctx.fill();
    drawHair(ctx,L,hy);
    ctx.fillStyle="#fff";ctx.fillRect(3,hy-2,4,3);ctx.fillRect(-3,hy-2,3,3);
    ctx.fillStyle=form==="stone"||form==="wind"?L.eye:"#1a1010";ctx.fillRect(5,hy-2,2,3);ctx.fillRect(-1,hy-2,2,3);
    if(u.isBoss||u.team===1&&u.d.foe){ctx.fillStyle=hexA(L.eye,0.9);ctx.fillRect(3,hy-2,4,2);}
  }
  if(L.crown){ctx.fillStyle="#f0c860";ctx.beginPath();ctx.moveTo(-9,hy-10);ctx.lineTo(-9,hy-18);ctx.lineTo(-4,hy-13);ctx.lineTo(0,hy-20);ctx.lineTo(4,hy-13);ctx.lineTo(9,hy-18);ctx.lineTo(9,hy-10);ctx.fill();}
  // bras avant + arme
  var fa=0.2-Math.sin(an.walk)*0.5*an.moving-swing-cast*2.4;
  drawArm(ctx,10*bw,-38,fa,skin,cloth,s,u,accent);
  // formes spéciales
  if(form==="shadow"||u.key==="DARK"){
    if(Math.random()<0.35)fxP({k:"dot",x:u.x+rand(-14,14),y:u.y-rand(10,60)*s,vx:rand(-10,10),vy:-rand(20,50),life:0.8,size:rand(3,7),col:"rgba(90,30,130,.5)",drag:0});
  }
  if(form==="wind"){ctx.strokeStyle="rgba(220,255,255,.5)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-30,20+Math.sin(G.time*6)*3,G.time*4,G.time*4+2);ctx.stroke();}
  // flash de coup
  if(hit>0){
    ctx.globalCompositeOperation="lighter";ctx.globalAlpha=hit*0.6;ctx.fillStyle="#fff";
    rr(ctx,-12*bw,-44,24*bw,30,8);ctx.fill();ctx.beginPath();ctx.arc(0,hy,12,0,Math.PI*2);ctx.fill();
    ctx.globalCompositeOperation="source-over";
  }
  // incantation
  if(cast>0){
    ctx.globalCompositeOperation="lighter";ctx.globalAlpha=cast*0.8;
    var cg=ctx.createRadialGradient(10*bw,-62,1,10*bw,-62,26);cg.addColorStop(0,"#fff");cg.addColorStop(0.3,u.d.fx);cg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(10*bw,-62,26,0,Math.PI*2);ctx.fill();
    ctx.globalCompositeOperation="source-over";
  }
  ctx.restore();
  // cercle runique au sol pendant l'incantation
  if(an.cast>0.2){
    ctx.save();ctx.translate(u.x,u.y);ctx.globalAlpha=an.cast*0.7*alpha;ctx.strokeStyle=u.d.fx;ctx.lineWidth=2;
    ctx.rotate(G.time*3);ctx.beginPath();ctx.ellipse(0,0,u.r*1.5,u.r*0.65,0,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([4,6]);ctx.beginPath();ctx.ellipse(0,0,u.r*1.8,u.r*0.8,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  drawStatus(ctx,u,alpha);
}
function rr(ctx,x,y,w,h,r){roundRect(ctx,x,y,w,h,Math.min(r,Math.abs(w)/2,Math.abs(h)/2));}
function drawArm(ctx,x,y,a,skin,cloth,s,u,accent){
  ctx.save();ctx.translate(x,y);ctx.rotate(a);
  ctx.fillStyle=cloth;rr(ctx,-3.5,-2,7,12,3);ctx.fill();
  ctx.fillStyle=skin;rr(ctx,-3,9,6,9,3);ctx.fill();
  if(u){
    var role=u.role,col=u.d.fx;
    ctx.translate(0,18);
    if(role==="Mage"){
      ctx.globalCompositeOperation="lighter";
      var g=ctx.createRadialGradient(0,4,1,0,4,11);g.addColorStop(0,"#fff");g.addColorStop(0.4,col);g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,4+Math.sin(G.time*5)*2,11,0,Math.PI*2);ctx.fill();
      ctx.globalCompositeOperation="source-over";
    }else if(role==="Soutien"){
      ctx.fillStyle="#6a4a2a";ctx.fillRect(-1.5,-26,3,40);
      ctx.globalCompositeOperation="lighter";ctx.fillStyle=hexA(col,0.9);ctx.beginPath();ctx.arc(0,-28,5+Math.sin(G.time*4),0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation="source-over";
    }else if(role==="Tank"){
      ctx.fillStyle=shade(accent||col,-0.2);rr(ctx,-9,-6,18,22,5);ctx.fill();
      ctx.strokeStyle=accent||col;ctx.lineWidth=2;rr(ctx,-9,-6,18,22,5);ctx.stroke();
    }else{
      ctx.fillStyle="#d8dde6";ctx.beginPath();ctx.moveTo(-1.5,0);ctx.lineTo(1.5,0);ctx.lineTo(2.5,26);ctx.lineTo(0,32);ctx.lineTo(-2.5,26);ctx.closePath();ctx.fill();
      ctx.fillStyle=col;ctx.fillRect(-4,-1,8,3);
      if(role==="Assassin"){ctx.globalCompositeOperation="lighter";ctx.fillStyle=hexA(col,0.5);ctx.fillRect(-1,4,2,24);ctx.globalCompositeOperation="source-over";}
    }
  }
  ctx.restore();
}
function drawHair(ctx,L,hy){
  ctx.fillStyle=L.hair;
  var st=L.hairStyle%8;
  if(L.form==="stone"){ctx.fillStyle="#5a6670";ctx.fillRect(-11,hy-12,22,6);return;}
  if(L.form==="wind"||L.form==="liquid")return;
  ctx.beginPath();
  if(st===0||st===6){ctx.arc(0,hy-3,12,Math.PI*1.05,Math.PI*1.95);ctx.fill();}
  else if(st===1||st===5){ctx.arc(0,hy-5,14,Math.PI*0.95,Math.PI*2.05);ctx.fill();ctx.beginPath();ctx.arc(-9,hy-2,6,0,Math.PI*2);ctx.fill();}
  else if(st===2||st===3){ctx.arc(0,hy-4,12.5,Math.PI,Math.PI*2);ctx.fill();for(var i=0;i<4;i++){ctx.fillRect(-11+i*2.5,hy-2,2,10+i);}}
  else{ctx.arc(0,hy-8,10,Math.PI*0.9,Math.PI*2.1);ctx.fill();ctx.beginPath();ctx.arc(0,hy-16,6,0,Math.PI*2);ctx.fill();}
}
function drawGem(ctx,x,y,r,col){
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,-r*1.4);ctx.lineTo(r,0);ctx.lineTo(0,r*1.4);ctx.lineTo(-r,0);ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(255,255,255,.55)";ctx.beginPath();ctx.moveTo(0,-r*1.4);ctx.lineTo(r*0.4,-r*0.2);ctx.lineTo(0,0);ctx.closePath();ctx.fill();
  ctx.restore();
}
function drawStatus(ctx,u,alpha){
  var s=u.st,y=u.y-u.r*2.6-6;
  ctx.save();ctx.globalAlpha=alpha;
  if(s.shield>0){ctx.strokeStyle="rgba(230,240,255,.8)";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(u.x,u.y-u.r*0.9,u.r*1.45,0,Math.PI*2);ctx.stroke();ctx.fillStyle="rgba(200,220,255,.12)";ctx.fill();}
  if(s.stun>0){for(var i=0;i<3;i++){var a=G.time*6+i*2.1;ctx.fillStyle="#ffe27a";drawStar(ctx,u.x+Math.cos(a)*16,y+8+Math.sin(a)*5,4);}}
  if(s.root>0){ctx.strokeStyle="#5a8a3a";ctx.lineWidth=3;for(var j=0;j<5;j++){var b=j/5*Math.PI*2;ctx.beginPath();ctx.moveTo(u.x+Math.cos(b)*u.r,u.y+Math.sin(b)*u.r*0.4);ctx.quadraticCurveTo(u.x+Math.cos(b)*u.r*0.4,u.y-16,u.x+Math.cos(b)*u.r*0.2,u.y-26);ctx.stroke();}}
  if(s.slow>0){ctx.fillStyle="rgba(120,190,255,.25)";ctx.beginPath();ctx.ellipse(u.x,u.y+2,u.r*1.2,u.r*0.5,0,0,Math.PI*2);ctx.fill();}
  if(s.silence>0){ctx.fillStyle="#c084fc";ctx.font="bold 14px Inter";ctx.textAlign="center";ctx.fillText("∅",u.x,y+4);}
  if(s.frost>0){for(var f=0;f<s.frost;f++)drawGem(ctx,u.x-10+f*10,y+12,3,"#bfe3ff");}
  if(u.recall>0){ctx.globalCompositeOperation="lighter";var h=(4-u.recall)/4;var g=ctx.createLinearGradient(0,u.y-160,0,u.y);g.addColorStop(0,"rgba(120,190,255,0)");g.addColorStop(1,"rgba(120,190,255,"+(0.25+h*0.4)+")");ctx.fillStyle=g;ctx.fillRect(u.x-u.r*1.1,u.y-160,u.r*2.2,160);}
  ctx.restore();
}
function drawStar(ctx,x,y,r){ctx.beginPath();for(var i=0;i<10;i++){var a=i/10*Math.PI*2-Math.PI/2,rr2=i%2?r*0.45:r;ctx.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2);}ctx.closePath();ctx.fill();}

function drawMinion(ctx,u,alpha){
  var col=u.ghost||TEAM_COL[u.team],an=u.anim,f=u.face||1;
  var bob=Math.abs(Math.sin(an.walk))*2*an.moving;
  ctx.save();ctx.translate(u.x,u.y);ctx.globalAlpha=alpha*(u.ghost?0.7:1);
  ctx.fillStyle="rgba(0,0,0,.3)";ctx.beginPath();ctx.ellipse(0,1,u.r,u.r*0.4,0,0,Math.PI*2);ctx.fill();
  ctx.scale(f,1);ctx.translate(0,-bob);
  var body=u.team===0?"#26374f":"#3a1c2c";
  if(u.ghost)body="#301010";
  if(u.mtype==="siege"){
    ctx.fillStyle="#3a2a1a";rr(ctx,-u.r,-u.r*1.2,u.r*2,u.r*0.9,5);ctx.fill();
    ctx.fillStyle=col;ctx.fillRect(-u.r,-u.r*1.2,u.r*2,4);
    ctx.fillStyle="#222";[-u.r*0.6,u.r*0.6].forEach(function(wx){ctx.beginPath();ctx.arc(wx,-u.r*0.3,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#777";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(wx+Math.cos(an.walk)*6,-u.r*0.3+Math.sin(an.walk)*6);ctx.lineTo(wx-Math.cos(an.walk)*6,-u.r*0.3-Math.sin(an.walk)*6);ctx.stroke();});
    ctx.save();ctx.translate(u.r*0.2,-u.r*1.3);ctx.rotate(-0.4-an.atk*0.6);ctx.fillStyle="#555";ctx.fillRect(0,-4,u.r*1.3,8);ctx.restore();
  }else{
    var sw=Math.sin(an.walk)*5*an.moving;
    ctx.fillStyle=shade(body,-0.3);ctx.fillRect(-6,-10,4,10+sw*0.3);ctx.fillRect(2,-10,4,10-sw*0.3);
    ctx.fillStyle=body;rr(ctx,-u.r*0.6,-u.r*1.5,u.r*1.2,u.r*1.1,5);ctx.fill();
    ctx.fillStyle=col;ctx.fillRect(-u.r*0.6,-u.r*0.8,u.r*1.2,3);
    ctx.fillStyle=u.ghost?"#6a2a1a":"#8a6a50";ctx.beginPath();ctx.arc(0,-u.r*1.8,u.r*0.45,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=body;ctx.beginPath();ctx.arc(0,-u.r*1.9,u.r*0.48,Math.PI,Math.PI*2);ctx.fill();
    ctx.fillStyle=u.team===1?"#ff6a6a":"#bfe3ff";ctx.fillRect(1,-u.r*1.85,3,2);
    if(u.mtype==="caster"){
      ctx.fillStyle="#5a3a1a";ctx.fillRect(u.r*0.55,-u.r*2.3,2.5,u.r*1.8);
      ctx.globalCompositeOperation="lighter";ctx.fillStyle=hexA(col,0.9);ctx.beginPath();ctx.arc(u.r*0.6,-u.r*2.4,3.5+an.atk*4,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation="source-over";
    }else{
      ctx.save();ctx.translate(u.r*0.55,-u.r*1.2);ctx.rotate(-0.6+an.atk*2);ctx.fillStyle="#c8ccd6";ctx.fillRect(-1,-u.r*1.1,3,u.r*1.2);ctx.restore();
      ctx.fillStyle=shade(col,-0.3);ctx.beginPath();ctx.arc(-u.r*0.6,-u.r*1.0,u.r*0.45,0,Math.PI*2);ctx.fill();
      if(u.mtype==="elite"){ctx.strokeStyle="#ffd24a";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-u.r*1.9,u.r*0.62,Math.PI*1.1,Math.PI*1.9);ctx.stroke();}
    }
  }
  if(an.hit>0){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=an.hit*0.5;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(0,-u.r,u.r,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  drawStatus(ctx,u,alpha);
}
function drawMonster(ctx,u){
  var an=u.anim,col=u.buff==="red"?"#ff6a3d":u.buff==="blue"?"#4ea8ff":"#e8c46a";
  var br=Math.sin(G.time*2+u.id)*2;
  ctx.save();ctx.translate(u.x,u.y);
  ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(0,2,u.r*1.1,u.r*0.45,0,0,Math.PI*2);ctx.fill();
  ctx.scale(u.face||1,1);
  var bc=u.big?"#3a4a2a":"#2a3a30";
  ctx.fillStyle=bc;ctx.beginPath();ctx.ellipse(0,-u.r*0.9-br,u.r*1.05,u.r*0.9+br,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=shade(bc,0.15);ctx.beginPath();ctx.ellipse(-u.r*0.3,-u.r*1.2-br,u.r*0.5,u.r*0.4,0,0,Math.PI*2);ctx.fill();
  // feuillage/cornes
  ctx.fillStyle=u.big?"#6a8a3a":"#4a6a3a";
  for(var i=0;i<(u.big?5:3);i++){var a=-Math.PI*0.8+i*0.4;ctx.beginPath();ctx.ellipse(Math.cos(a)*u.r*0.8,-u.r*0.9+Math.sin(a)*u.r*0.95-br,u.r*0.28,u.r*0.14,a,0,Math.PI*2);ctx.fill();}
  // yeux
  ctx.globalCompositeOperation="lighter";ctx.fillStyle=col;
  ctx.beginPath();ctx.arc(u.r*0.35,-u.r*1.0-br,u.r*0.12,0,Math.PI*2);ctx.arc(u.r*0.7,-u.r*1.0-br,u.r*0.1,0,Math.PI*2);ctx.fill();
  var g=ctx.createRadialGradient(0,-u.r,2,0,-u.r,u.r*1.6);g.addColorStop(0,hexA(col,0.25));g.addColorStop(1,hexA(col,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,-u.r,u.r*1.6,0,Math.PI*2);ctx.fill();
  if(an.hit>0){ctx.globalAlpha=an.hit*0.5;ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(0,-u.r*0.9,u.r,u.r*0.9,0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  // mâchoire d'attaque
  if(an.atk>0){ctx.save();ctx.globalAlpha=an.atk;ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.beginPath();ctx.arc(u.x+(u.face||1)*u.r,u.y-u.r,u.r*0.6,-1,1);ctx.stroke();ctx.restore();}
}
function drawTower(ctx,u){
  var col=TEAM_COL[u.team],prot=!!u.protectedBy;
  ctx.save();ctx.translate(u.x,u.y);
  ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(10,4,56,22,0,0,Math.PI*2);ctx.fill();
  // socle
  ctx.fillStyle="#3a3440";ctx.beginPath();ctx.moveTo(-46,0);ctx.lineTo(-38,-18);ctx.lineTo(38,-18);ctx.lineTo(46,0);ctx.lineTo(38,10);ctx.lineTo(-38,10);ctx.closePath();ctx.fill();
  ctx.fillStyle="#4c4454";ctx.fillRect(-38,-22,76,6);
  // colonne
  var g=ctx.createLinearGradient(-22,0,22,0);g.addColorStop(0,"#5a5264");g.addColorStop(0.5,"#7a7086");g.addColorStop(1,"#3e3848");
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-24,-20);ctx.lineTo(-16,-100);ctx.lineTo(16,-100);ctx.lineTo(24,-20);ctx.closePath();ctx.fill();
  ctx.fillStyle=hexA(col,0.7);ctx.fillRect(-18,-60,36,4);ctx.fillRect(-16,-88,32,3);
  // motif
  ctx.strokeStyle=hexA(col,0.5);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-30);ctx.lineTo(0,-48);ctx.lineTo(8,-30);ctx.stroke();
  // couronne
  ctx.fillStyle="#2c2834";ctx.beginPath();ctx.moveTo(-26,-100);ctx.lineTo(26,-100);ctx.lineTo(20,-110);ctx.lineTo(-20,-110);ctx.closePath();ctx.fill();
  // cristal flottant
  var fy=-132+Math.sin(G.time*2+u.id)*5;
  ctx.globalCompositeOperation="lighter";
  var gg=ctx.createRadialGradient(0,fy,2,0,fy,50+u.heat*8);gg.addColorStop(0,hexA(col,prot?0.3:0.8));gg.addColorStop(1,hexA(col,0));
  ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,fy,50+u.heat*8,0,Math.PI*2);ctx.fill();
  ctx.globalCompositeOperation="source-over";
  ctx.save();ctx.translate(0,fy);ctx.rotate(Math.sin(G.time)*0.2);drawGem(ctx,0,0,13,prot?shade(col,-0.3):col);ctx.restore();
  if(prot){ctx.strokeStyle="rgba(200,220,255,.35)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-60,70,0,Math.PI*2);ctx.stroke();}
  if(u.anim.hit>0){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=u.anim.hit*0.35;ctx.fillStyle="#fff";ctx.fillRect(-24,-100,48,80);}
  ctx.restore();
}
function drawNexus(ctx,u){
  var col=TEAM_COL[u.team];
  ctx.save();ctx.translate(u.x,u.y);
  ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(0,6,90,34,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#2e2838";
  ctx.beginPath();for(var i=0;i<8;i++){var a=i/8*Math.PI*2;ctx.lineTo(Math.cos(a)*84,Math.sin(a)*30);}ctx.closePath();ctx.fill();
  ctx.strokeStyle=hexA(col,0.6);ctx.lineWidth=3;ctx.stroke();
  // anneaux
  ctx.save();ctx.translate(0,-80);
  for(var r=0;r<2;r++){ctx.save();ctx.rotate(G.time*(r?-0.8:0.6));ctx.strokeStyle=hexA(col,0.6);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,70+r*14,20+r*6,0,0,Math.PI*1.4);ctx.stroke();ctx.restore();}
  ctx.globalCompositeOperation="lighter";
  var g=ctx.createRadialGradient(0,0,4,0,0,110);g.addColorStop(0,hexA(col,0.9));g.addColorStop(1,hexA(col,0));
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,110,0,Math.PI*2);ctx.fill();
  ctx.globalCompositeOperation="source-over";
  var p=Math.sin(G.time*1.5)*4;
  ctx.fillStyle=u.protectedBy?shade(col,-0.35):col;
  ctx.beginPath();ctx.moveTo(0,-56+p);ctx.lineTo(30,-6);ctx.lineTo(0,50+p*0.5);ctx.lineTo(-30,-6);ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(255,255,255,.45)";ctx.beginPath();ctx.moveTo(0,-56+p);ctx.lineTo(12,-10);ctx.lineTo(0,-4);ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(0,0,0,.25)";ctx.beginPath();ctx.moveTo(0,50+p*0.5);ctx.lineTo(-30,-6);ctx.lineTo(0,-4);ctx.closePath();ctx.fill();
  ctx.restore();
  ctx.restore();
}
function drawBars(ctx,u){
  if(u.dead||u.kind==="monster"&&u.hp>=u.maxHp)return;
  var w,h,y,col;
  if(u.kind==="champ"){w=u.isBoss?110:64;h=u.isBoss?9:7;y=u.y-u.r*2.55-18;}
  else if(u.kind==="tower"){w=90;h=7;y=u.y-170;}
  else if(u.kind==="nexus"){w=130;h=9;y=u.y-200;}
  else if(u.kind==="monster"){w=u.big?80:50;h=5;y=u.y-u.r*2.2-10;}
  else{if(u.hp>=u.maxHp&&!u.summoned)return;w=34;h=4;y=u.y-u.r*2.4-6;}
  var x=u.x-w/2;
  col=u.team===0?(u.isPlayer?"#39d353":"#4ea8ff"):u.team===1?"#ff4d6d":"#e8c46a";
  ctx.fillStyle="rgba(8,6,14,.85)";ctx.fillRect(x-1.5,y-1.5,w+3,h+3+(u.kind==="champ"?4:0));
  var f=clamp(u.hp/u.maxHp,0,1);
  if(u.lagHp==null)u.lagHp=f;
  u.lagHp=Math.max(f,u.lagHp-0.6*(1/60));
  ctx.fillStyle="#fff";ctx.globalAlpha=0.55;ctx.fillRect(x,y,w*u.lagHp,h);ctx.globalAlpha=1;
  ctx.fillStyle=col;ctx.fillRect(x,y,w*f,h);
  if(u.st&&u.st.shield>0){ctx.fillStyle="#e8eef8";ctx.fillRect(x+w*f,y,Math.min(w*(1-f),w*u.st.shield/u.maxHp),h);}
  if(u.kind==="champ"){
    // graduations tous les 250 PV
    ctx.fillStyle="rgba(0,0,0,.5)";var step=250/u.maxHp*w;if(step>4)for(var sx=x+step;sx<x+w;sx+=step)ctx.fillRect(sx,y,1,h*0.6);
    ctx.fillStyle="#3a7bff";ctx.fillRect(x,y+h+1,w*clamp(u.mana/u.maxMana,0,1),2.5);
    // niveau
    ctx.fillStyle="rgba(8,6,14,.9)";ctx.fillRect(x-17,y-2,15,h+8);
    ctx.fillStyle="#e8c46a";ctx.font="bold 10px Inter";ctx.textAlign="center";ctx.fillText(u.lvl,x-9.5,y+h+2);
    if(u.isBoss||u.team===1||!u.isPlayer){ctx.fillStyle=u.isBoss?"#ffd0d8":"rgba(255,255,255,.85)";ctx.font=(u.isBoss?"bold 13px ":"600 10px ")+"Inter";ctx.fillText(u.name,u.x,y-5);}
  }
}

// ---------------------------------------------------------------------
// Télégraphes, projectiles, particules
// ---------------------------------------------------------------------
function drawTeles(ctx){
  G.teles.forEach(function(z){
    var k=z.t/z.delay,col=z.team===0?z.color:"#ff3355";
    ctx.save();
    if(z.kind==="circle"){
      ctx.fillStyle=hexA(z.team===0?"#8ab8ff":"#ff2244",0.14);ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=hexA(z.team===0?z.color:"#ff2244",0.3);ctx.beginPath();ctx.arc(z.x,z.y,z.r*k,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=hexA(col,0.9);ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.stroke();
    }else{
      ctx.translate(z.x,z.y);ctx.rotate(Math.atan2(z.dy,z.dx));
      ctx.fillStyle=hexA(z.team===0?"#8ab8ff":"#ff2244",0.14);ctx.fillRect(0,-z.w/2,z.len,z.w);
      ctx.fillStyle=hexA(z.team===0?z.color:"#ff2244",0.3);ctx.fillRect(0,-z.w/2,z.len*k,z.w);
      ctx.strokeStyle=hexA(col,0.9);ctx.lineWidth=2.5;ctx.strokeRect(0,-z.w/2,z.len,z.w);
    }
    ctx.restore();
  });
  G.zones.forEach(function(z){
    var a=Math.min(1,z.t*2,(z.max-z.t)*3+0.3);
    ctx.save();ctx.globalAlpha=0.5*a;
    var g=ctx.createRadialGradient(z.x,z.y,z.r*0.2,z.x,z.y,z.r);g.addColorStop(0,hexA(z.color,0.1));g.addColorStop(1,hexA(z.color,0.45));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=z.color;ctx.lineWidth=2;ctx.setLineDash([10,8]);ctx.lineDashOffset=-G.time*30;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  });
}
function drawProjs(ctx){
  ctx.save();ctx.globalCompositeOperation="lighter";
  G.projs.forEach(function(p){
    var sz=p.homing?(p.size||4):p.width*0.45;
    var g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,sz*2.2);
    g.addColorStop(0,"#fff");g.addColorStop(0.35,p.color);g.addColorStop(1,hexA(p.color.charAt(0)==="#"?p.color:"#ffffff",0));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,sz*2.2,0,Math.PI*2);ctx.fill();
    if(!p.homing){
      ctx.strokeStyle=hexA(p.color,0.5);ctx.lineWidth=sz*1.2;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.dx*sz*4,p.y-p.dy*sz*4);ctx.stroke();
    }
  });
  ctx.restore();
}
function drawFx(ctx,front){
  G.fx.forEach(function(p){
    var k=p.t/p.life,a=1-k;
    if(p.k==="amb"){
      if(front)return;
      ctx.globalAlpha=Math.min(1,a*2,k*4);
      if(p.add)ctx.globalCompositeOperation="lighter";
      ctx.fillStyle=p.col;
      if(p.a==="rain"){ctx.strokeStyle=p.col;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-3,p.y+14);ctx.stroke();}
      else{ctx.beginPath();ctx.arc(p.x,p.y,p.size+(p.a==="firefly"?Math.sin(p.t*8)*1:0),0,Math.PI*2);ctx.fill();}
      ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;
      return;
    }
    if(!front)return;
    ctx.globalAlpha=a;
    if(p.add)ctx.globalCompositeOperation="lighter";
    switch(p.k){
      case "dot":ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size*(0.4+a*0.6),0,Math.PI*2);ctx.fill();break;
      case "debris":ctx.fillStyle=p.col;ctx.fillRect(p.x,p.y,p.size,p.size);break;
      case "ring":ctx.strokeStyle=p.col;ctx.lineWidth=(p.w||4)*a;ctx.beginPath();ctx.ellipse(p.x,p.y,lerp(p.r0,p.r1,easeOut(k)),lerp(p.r0,p.r1,easeOut(k))*0.5,0,0,Math.PI*2);ctx.stroke();break;
      case "nova":var g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*easeOut(k));g.addColorStop(0,hexA(p.col,0));g.addColorStop(0.7,hexA(p.col,0.35*a));g.addColorStop(1,hexA(p.col,0.8*a));ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.r*easeOut(k),0,Math.PI*2);ctx.fill();break;
      case "flash":ctx.fillStyle=hexA("#ffffff",0.5*a);ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();break;
      case "spark":ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.col;var ss=p.size*(0.5+k);
        ctx.beginPath();ctx.moveTo(-ss,0);ctx.lineTo(0,-ss*0.18);ctx.lineTo(ss,0);ctx.lineTo(0,ss*0.18);ctx.closePath();ctx.fill();
        ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(-ss*0.6,0);ctx.lineTo(0,-ss*0.12);ctx.lineTo(ss*0.6,0);ctx.lineTo(0,ss*0.12);ctx.closePath();ctx.fill();ctx.restore();break;
      case "slash":ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.strokeStyle=p.col;ctx.lineWidth=p.w*a+1;ctx.lineCap="round";
        var st=p.flip?-1:1;ctx.beginPath();ctx.arc(-p.r*0.6,0,p.r,st*(-0.9+k*0.5),st*(0.9*k+0.2),p.flip);ctx.stroke();
        ctx.strokeStyle="#fff";ctx.lineWidth=1.5*a;ctx.beginPath();ctx.arc(-p.r*0.6,0,p.r,st*(-0.7+k*0.5),st*(0.7*k+0.2),p.flip);ctx.stroke();ctx.restore();break;
      case "cone":ctx.fillStyle=hexA(p.col,0.45*a);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.arc(p.x,p.y,p.r*(0.5+k*0.5),p.a-p.ang/2,p.a+p.ang/2);ctx.closePath();ctx.fill();
        ctx.strokeStyle=p.col;ctx.lineWidth=3*a;ctx.beginPath();ctx.arc(p.x,p.y,p.r*(0.5+k*0.5),p.a-p.ang/2,p.a+p.ang/2);ctx.stroke();break;
      case "beam":ctx.strokeStyle=p.col;ctx.lineWidth=8*a;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x2,p.y2);ctx.stroke();ctx.strokeStyle="#fff";ctx.lineWidth=2*a;ctx.stroke();break;
      case "line":ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.dy,p.dx));
        var lg=ctx.createLinearGradient(0,-p.w/2,0,p.w/2);lg.addColorStop(0,hexA(p.col,0));lg.addColorStop(0.5,hexA(p.col,0.9));lg.addColorStop(1,hexA(p.col,0));
        ctx.fillStyle=lg;ctx.fillRect(0,-p.w/2*(0.3+a*0.7),p.len*Math.min(1,k*6),p.w*(0.3+a*0.7));
        ctx.fillStyle="rgba(255,255,255,"+a+")";ctx.fillRect(0,-3*a,p.len*Math.min(1,k*6),6*a);ctx.restore();break;
      case "charge":if(p.u.dead)break;ctx.strokeStyle=p.col;ctx.lineWidth=3;ctx.globalAlpha=0.3+k*0.6;ctx.beginPath();ctx.arc(p.u.x,p.u.y,p.r*(1-k*0.85),0,Math.PI*2);ctx.stroke();
        ctx.fillStyle=hexA(p.col,0.15);ctx.beginPath();ctx.arc(p.u.x,p.u.y,p.r,0,Math.PI*2);ctx.fill();break;
      case "soul":ctx.fillStyle=p.col;ctx.beginPath();ctx.ellipse(p.x,p.y-k*120,10*a+2,16*a+2,0,0,Math.PI*2);ctx.fill();break;
      case "click":ctx.strokeStyle=p.col;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,18*(1-k)+4,8*(1-k)+2,0,0,Math.PI*2);ctx.stroke();break;
    }
    ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;
  });
}
function easeOut(k){return 1-(1-k)*(1-k);}
function drawTexts(ctx){
  ctx.textAlign="center";
  G.texts.forEach(function(t){
    var k=t.t/t.life,sc=t.t<0.12?1+(0.12-t.t)*5:1;
    ctx.globalAlpha=k>0.7?(1-k)/0.3:1;
    ctx.font="800 "+Math.round((t.big?22:15)*sc)+"px 'Bebas Neue', Inter, sans-serif";
    ctx.lineWidth=3;ctx.strokeStyle="rgba(10,6,16,.9)";ctx.strokeText(t.txt,t.x,t.y);
    ctx.fillStyle=t.col;ctx.fillText(t.txt,t.x,t.y);
  });
  ctx.globalAlpha=1;
}
function drawAim(ctx){
  var ai=G.aimInd,p=G.player;if(!ai||p.dead)return;
  var ab=ai.spell?null:p.d.abil[ai.i];
  ctx.save();
  ctx.fillStyle="rgba(120,200,255,.16)";ctx.strokeStyle="rgba(160,220,255,.8)";ctx.lineWidth=2;
  var rng=ab?(ab.range||ab.radius||200):260;
  ctx.setLineDash([8,8]);ctx.beginPath();ctx.arc(p.x,p.y,rng,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  var a=Math.atan2(ai.dy,ai.dx);
  var t=ab?ab.type:"blink";
  if(t==="shot"||t==="line"||t==="dash"){
    ctx.translate(p.x,p.y);ctx.rotate(a);
    var w=ab.width||(ab.radius?ab.radius:60);
    ctx.fillRect(0,-w/2,rng,w);ctx.strokeRect(0,-w/2,rng,w);
    ctx.beginPath();ctx.moveTo(rng,-w/2-8);ctx.lineTo(rng+24,0);ctx.lineTo(rng,w/2+8);ctx.fill();
  }else if(t==="cone"){
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.arc(p.x,p.y,ab.range,a-ab.angle/2,a+ab.angle/2);ctx.closePath();ctx.fill();ctx.stroke();
  }else if(t==="circle"||t==="blink"||t==="zone"){
    var d=Math.min(rng,ai.len);
    var cx=p.x+ai.dx*d,cy=p.y+ai.dy*d;
    ctx.beginPath();ctx.arc(cx,cy,ab?(ab.radius||80):40,0,Math.PI*2);ctx.fill();ctx.stroke();
  }else{
    ctx.beginPath();ctx.arc(p.x,p.y,ab.radius||ab.range||200,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------
// Image complète
// ---------------------------------------------------------------------
function renderFrame(){
  var ctx=CX,c=G.cam;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.clearRect(0,0,VW,VH);
  var sx=(Math.random()-0.5)*G.shakeA,sy=(Math.random()-0.5)*G.shakeA;
  ctx.setTransform(DPR*c.z,0,0,DPR*c.z,DPR*(VW/2-c.x*c.z+sx),DPR*(VH/2-c.y*c.z+sy));
  var vw=VW/c.z,vh=VH/c.z,x0=c.x-vw/2-150,x1=c.x+vw/2+150,y0=c.y-vh/2-100,y1=c.y+vh/2+250;
  drawGround(ctx);
  drawFx(ctx,false);
  G.brush.forEach(function(b){if(b.x>x0&&b.x<x1&&b.y>y0&&b.y<y1)drawBrush(ctx,b,false);});
  drawTeles(ctx);
  if(G.player&&!G.player.dead){
    var p=G.player;
    // portée d'attaque discrète
    ctx.save();ctx.strokeStyle="rgba(255,255,255,.08)";ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(p.x,p.y,p.range+p.r,(p.range+p.r)*0.98,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    // portée des tours ennemies proches
    G.units.forEach(function(t){
      if(t.kind!=="tower"||t.dead||t.team===0)return;
      var d=dist(p.x,p.y,t.x,t.y);
      if(d<t.range+260){ctx.save();ctx.globalAlpha=clamp(1-(d-t.range)/260,0,1)*(t.target===p?0.9:0.45);ctx.strokeStyle=t.target===p?"#ff2244":"#ff8899";ctx.lineWidth=3;ctx.beginPath();ctx.arc(t.x,t.y,t.range,0,Math.PI*2);ctx.stroke();ctx.restore();}
    });
    if(p.target&&!p.target.dead){ctx.save();ctx.strokeStyle="#ff4d6d";ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(p.target.x,p.target.y+2,p.target.r*1.3,p.target.r*0.55,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  }
  // tri par profondeur
  var list=[];
  G.units.forEach(function(u){
    if(u.x<x0||u.x>x1||u.y<y0||u.y>y1)return;
    if(u.dead&&u.kind!=="tower"&&u.kind!=="nexus")return;
    var vis=visibleTo(u,0);
    if(!vis)return;
    list.push({y:u.y,u:u});
  });
  G.props.forEach(function(p){if(p.x>x0&&p.x<x1&&p.y>y0&&p.y<y1)list.push({y:p.y,p:p});});
  list.sort(function(a,b){return a.y-b.y;});
  list.forEach(function(e){
    if(e.p){drawProp(ctx,e.p);return;}
    var u=e.u;
    if(u.kind==="tower"){if(u.dead)drawRubble(ctx,u);else drawTower(ctx,u);}
    else if(u.kind==="nexus"){if(!u.dead)drawNexus(ctx,u);else drawRubble(ctx,u);}
    else if(u.kind==="champ"){var al=u.st.veil>0?(u.team===0?0.45:0.25):u.brushRef&&u.team===0?0.65:1;drawChamp(ctx,u,al);}
    else if(u.kind==="minion")drawMinion(ctx,u,u.brushRef&&u.team===0?0.65:1);
    else if(u.kind==="monster")drawMonster(ctx,u);
  });
  G.brush.forEach(function(b){if(b.x>x0&&b.x<x1&&b.y>y0&&b.y<y1)drawBrush(ctx,b,true);});
  drawProjs(ctx);
  drawFx(ctx,true);
  list.forEach(function(e){if(e.u)drawBars(ctx,e.u);});
  drawAim(ctx);
  drawTexts(ctx);
  // vignette
  ctx.setTransform(DPR,0,0,DPR,0,0);
  var vg=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*(G.affix.brume?0.2:0.45),VW/2,VH/2,Math.max(VW,VH)*0.75);
  vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,G.affix.brume?"rgba(10,10,20,.92)":"rgba(0,0,0,.45)");
  ctx.fillStyle=vg;ctx.fillRect(0,0,VW,VH);
  if(G.player.dead){ctx.fillStyle="rgba(40,30,50,.35)";ctx.fillRect(0,0,VW,VH);}
  if(G.player.hp/G.player.maxHp<0.25&&!G.player.dead){var pa=0.25+Math.sin(G.time*6)*0.1;var rg=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.3,VW/2,VH/2,Math.max(VW,VH)*0.7);rg.addColorStop(0,"rgba(255,0,40,0)");rg.addColorStop(1,"rgba(255,0,40,"+pa+")");ctx.fillStyle=rg;ctx.fillRect(0,0,VW,VH);}
}
function drawRubble(ctx,u){
  ctx.save();ctx.translate(u.x,u.y);
  ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(0,0,60,22,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#3a3440";
  for(var i=0;i<7;i++){var a=i*0.9;ctx.fillRect(Math.cos(a)*30-8,Math.sin(a)*10-14,16,12);}
  ctx.fillStyle="#2a2430";ctx.beginPath();ctx.moveTo(-26,-2);ctx.lineTo(-18,-34);ctx.lineTo(-4,-28);ctx.lineTo(4,-40);ctx.lineTo(20,-10);ctx.lineTo(24,0);ctx.closePath();ctx.fill();
  ctx.restore();
}
