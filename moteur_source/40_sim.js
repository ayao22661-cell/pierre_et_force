// =====================================================================
// ===  SIMULATION : mise à jour, déplacements, IA                    ===
// =====================================================================
function stepMatch(dt){
  if(G.stop>0){G.stop-=dt;return;}
  G.time+=dt;
  // minuteries
  for(var i=G.timers.length-1;i>=0;i--){var tm=G.timers[i];tm.t-=dt;if(tm.t<=0){G.timers.splice(i,1);tm.fn();}}
  if(G.over){G.endIn-=dt;updateUnits(dt*0.3);updateFx(dt);if(G.endIn<=0)finishMatch();return;}
  updateObjectives(dt);
  // camps
  G.camps.forEach(function(c){
    if((!c.unit||c.unit.dead)&&c.respawn!=null&&G.time>=c.respawn){
      c.unit=makeMonster(c.x,c.y,c.big,c.buff);c.respawn=null;G.units.push(c.unit);
      if(c.big&&G.time>10)announce("Le Gardien du Banco s'est réveillé","info");
    }
  });
  updateUnits(dt);
  updateProjs(dt);
  updateFx(dt);
  // ménage
  if(G.units.length>140||Math.random()<0.02){
    G.units=G.units.filter(function(u){return !(u.dead&&(u.kind==="minion"||u.kind==="monster")&&G.time-u.deathT>1.2);});
  }
}

function updateUnits(dt){
  var U=G.units;
  for(var i=0;i<U.length;i++){
    var u=U[i];
    u.brushRef=brushAt(u.x,u.y);
    var an=u.anim;
    an.hit=Math.max(0,an.hit-dt*5);an.atk=Math.max(0,an.atk-dt*3.2);an.cast=Math.max(0,an.cast-dt*2.6);an.spawn=Math.max(0,an.spawn-dt*1.5);
    if(u.blinkFx)u.blinkFx=Math.max(0,u.blinkFx-dt);
    if(u.dead){
      if(u.kind==="champ"&&!u.pending){
        u.respawnT-=dt;
        if(u.respawnT<=0&&!(G.mode==="boss"&&u.team===1)){respawn(u);}
      }
      continue;
    }
    var s=u.st;
    ["stun","root","slow","silence","taunt","shieldT","frostT","veil","invuln"].forEach(function(k){if(s[k]>0)s[k]=Math.max(0,s[k]-dt);});
    if(s.shieldT<=0)s.shield=0;
    if(s.frostT<=0)s.frost=0;
    if(s.slow<=0)s.slowP=0;
    if(s.taunt<=0)s.tauntBy=null;
    // buffs
    var changed=false;
    for(var b=u.buffs.length-1;b>=0;b--){u.buffs[b].t-=dt;if(u.buffs[b].t<=0){u.buffs.splice(b,1);changed=true;}}
    if(changed)recalc(u);
    if(u.dots){for(var d=u.dots.length-1;d>=0;d--){var dd=u.dots[d];dd.t-=dt;applyDamageRaw(u,dd.src,dd.dps*dt);if(dd.t<=0)u.dots.splice(d,1);}if(u.dead)continue;}
    if(u.kind==="champ"){
      for(var c=0;c<4;c++)if(u.cds[c]>0)u.cds[c]=Math.max(0,u.cds[c]-dt);
      if(u.spells.saut>0)u.spells.saut-=dt;if(u.spells.soin>0)u.spells.soin-=dt;
      u.hp=Math.min(u.maxHp,u.hp+u.regen*dt);
      u.mana=Math.min(u.maxMana,u.mana+u.manaRegen*dt);
      u.gold+=2.4*dt*(u.team===1&&u.ai?(G.diff.id===0?0.75:1.1):1);
      // fontaine
      var f=G.fount[u.team];
      if(f&&dist2(u.x,u.y,f.x,f.y)<380*380){u.hp=Math.min(u.maxHp,u.hp+u.maxHp*0.12*dt);u.mana=Math.min(u.maxMana,u.mana+u.maxMana*0.12*dt);u.atFount=true;}else u.atFount=false;
      if(u.key==="KAREN"){unitsNear(u.x,u.y,420,function(o){return o.team===u.team&&o.kind==="champ"&&o!==u;}).forEach(function(o){o.hp=Math.min(o.maxHp,o.hp+o.maxHp*0.01*dt);});}
      if(u.recall>0){
        u.recall-=dt;
        if(Math.random()<0.5)fxRise(u.x+rand(-20,20),u.y,TEAM_COL[u.team]);
        if(u.recall<=0){u.recall=0;var h=G.fount[u.team];fxBurst(u.x,u.y,"#bfe3ff",30,200);u.x=h.x;u.y=h.y;u.order=null;u.target=null;fxBurst(u.x,u.y,"#bfe3ff",30,200);if(u.isPlayer){openShopHint();}}
      }
      if(u.ai&&!u.dead)thinkChamp(u,dt);
    }else if(u.kind==="minion")thinkMinion(u,dt);
    else if(u.kind==="tower")thinkTower(u,dt);
    else if(u.kind==="monster")thinkMonster(u,dt);
    if(u.summoned){u.life-=dt;if(u.life<=0){u.dead=true;u.deathT=G.time;fxBurst(u.x,u.y,u.ghost,16,140);continue;}}
    if(u.kind!=="tower"&&u.kind!=="nexus")moveAndAttack(u,dt);
    // fontaine ennemie : laser
    var ef=G.fount[1-u.team];
    if(ef&&u.kind==="champ"&&G.mode!=="boss"&&dist2(u.x,u.y,ef.x,ef.y)<300*300&&Math.random()<dt*3){
      applyDamage(null,u,u.maxHp*0.2,{});fxBeam(ef.x,ef.y-60,u.x,u.y-20,TEAM_COL[1-u.team],0.2);
    }
  }
  separate();
}
function applyDamageRaw(u,src,v){
  if(u.dead)return;
  if(u.st.shield>0){var a=Math.min(u.st.shield,v);u.st.shield-=a;v-=a;}
  u.hp-=v;if(src&&src.kind==="champ")src.dmg+=v;
  if(u.hp<=0)killUnit(u,src);
}
function respawn(u){
  var f=G.fount[u.team];
  u.dead=false;u.hp=u.maxHp;u.mana=u.maxMana;u.x=f.x+rand(-40,40);u.y=f.y+rand(-40,40);
  u.st={stun:0,root:0,slow:0,slowP:0,silence:0,taunt:0,tauntBy:null,shield:0,shieldT:0,frost:0,frostT:0,veil:0,invuln:2};
  u.target=null;u.order=null;u.dots=[];u.anim.spawn=1;u.recall=0;u.dash=null;
  fxBurst(u.x,u.y,TEAM_COL[u.team],36,260);
  if(u.ai)aiShop(u);
  if(u.isPlayer)hudDirty();
}

// ---------------------------------------------------------------------
// Déplacement et attaque de base
// ---------------------------------------------------------------------
function moveAndAttack(u,dt){
  var s=u.st;
  // ruée
  if(u.dash){
    var dsh=u.dash,step=Math.min(dsh.left,dsh.speed*dt);
    u.x+=dsh.dx*step;u.y+=dsh.dy*step;dsh.left-=step;
    u.x=clamp(u.x,G.bx0,G.bx1);u.y=clamp(u.y,G.by0,G.by1);
    fxTrail(u.x,u.y-10,dsh.ctx.color,8);
    var ab=dsh.ctx.ab;
    unitsNear(u.x,u.y,ab.radius*0.6,function(o){return isHostile(u,o)&&targetable(o)&&!dsh.hit[o.id];}).forEach(function(o){
      dsh.hit[o.id]=1;
      applyDamage(u,o,dsh.ctx.dmg,{ability:true});applyCC(u,o,ab.cc);fxHit(o.x,o.y,dsh.ctx.color,true);
    });
    if(dsh.left<=0||pushOut(u)){
      unitsNear(u.x,u.y,ab.radius,function(o){return isHostile(u,o)&&targetable(o)&&!dsh.hit[o.id];}).forEach(function(o){
        applyDamage(u,o,dsh.ctx.dmg,{ability:true});applyCC(u,o,ab.cc);
      });
      fxNova(u.x,u.y,ab.radius,dsh.ctx.color);
      u.dash=null;
    }
    u.anim.moving=1;u.anim.walk+=dt*20;
    return;
  }
  // knockback
  if(u.kx||u.ky){
    u.x+=u.kx*dt;u.y+=u.ky*dt;u.kx*=Math.pow(0.02,dt);u.ky*=Math.pow(0.02,dt);
    if(Math.abs(u.kx)+Math.abs(u.ky)<20){u.kx=0;u.ky=0;}
    u.x=clamp(u.x,G.bx0,G.bx1);u.y=clamp(u.y,G.by0,G.by1);
  }
  if(u.atkCd>0)u.atkCd-=dt;
  if(s.stun>0){u.anim.moving=0;u.wind=0;return;}
  if(s.taunt>0&&s.tauntBy&&!s.tauntBy.dead){u.target=s.tauntBy;u.order=null;}
  var tgt=u.target;
  if(tgt&&(tgt.dead||!targetable(tgt)&&tgt.kind!=="nexus"||(!visibleTo(tgt,u.team)&&u.kind==="champ"))){u.target=tgt=null;u.wind=0;}
  if(tgt&&tgt.protectedBy&&!tgt.protectedBy.dead){u.target=tgt=null;}
  var mx=0,my=0,wantMove=false,goal=null;
  if(tgt){
    var ed=edgeDist(u,tgt);
    if(ed<=u.range){
      // à portée : attaque
      u.face=tgt.x>=u.x?1:-1;
      if(u.wind>0){
        u.wind-=dt;
        if(u.wind<=0)releaseAttack(u,tgt);
      }else if(u.atkCd<=0){
        u.wind=Math.min(0.3,0.22/u.as);u.anim.atk=1;u.atkCd=1/u.as;
      }
    }else{goal=tgt;}
  }
  if(!tgt||goal){
    if(goal){mx=goal.x;my=goal.y;wantMove=true;}
    else if(u.joy){mx=u.x+u.joy.x*200;my=u.y+u.joy.y*200;wantMove=true;}
    else if(u.order&&u.order.type==="move"){mx=u.order.x;my=u.order.y;wantMove=dist2(u.x,u.y,mx,my)>36;if(!wantMove)u.order=null;}
    else if(u.moveGoal){mx=u.moveGoal.x;my=u.moveGoal.y;wantMove=dist2(u.x,u.y,mx,my)>30*30;}
  }
  if(u.joy&&u.isPlayer&&tgt&&!goal){ // le joystick annule l'attaque en cours
    if(Math.abs(u.joy.x)+Math.abs(u.joy.y)>0.3){u.target=null;u.wind=0;mx=u.x+u.joy.x*200;my=u.y+u.joy.y*200;wantMove=true;}
  }
  if(wantMove&&s.root<=0&&u.recall<=0&&!(u.wind>0)){
    var sp=u.ms*(1-s.slowP)*dt;
    var dx=mx-u.x,dy=my-u.y,dl=Math.sqrt(dx*dx+dy*dy)||1;
    var st=Math.min(sp,dl);
    var nx=dx/dl,ny=dy/dl;
    // évitement des obstacles
    for(var i=0;i<G.obst.length;i++){
      var o=G.obst[i];var ox=o.x-u.x,oy=o.y-u.y;var od=Math.sqrt(ox*ox+oy*oy);
      if(od<o.r+u.r+60&&(ox*nx+oy*ny)>0){
        var side=(ox*ny-oy*nx)>0?1:-1;
        var w=clamp(1-(od-o.r-u.r)/60,0,1);
        var tx=-oy/od*side,ty=ox/od*side;
        nx=nx*(1-w*0.5)+tx*w;ny=ny*(1-w*0.5)+ty*w;
        var nl=Math.sqrt(nx*nx+ny*ny)||1;nx/=nl;ny/=nl;
      }
    }
    u.x+=nx*st;u.y+=ny*st;
    u.vx=nx*u.ms;u.vy=ny*u.ms;
    if(Math.abs(nx)>0.15)u.face=nx>0?1:-1;
    u.anim.moving=Math.min(1,u.anim.moving+dt*8);
    u.anim.walk+=dt*u.ms/22;
    if(u.recall>0)u.recall=0;
  }else{
    u.vx=0;u.vy=0;u.anim.moving=Math.max(0,u.anim.moving-dt*8);
  }
  u.x=clamp(u.x,G.bx0,G.bx1);u.y=clamp(u.y,G.by0,G.by1);
  if(G.mode==="boss"){var cd=dist(u.x,u.y,G.cx,G.cy);if(cd>G.arenaR&&u.kind!=="champ"){}
    if(cd>G.arenaR+200){var a=Math.atan2(u.y-G.cy,u.x-G.cx);u.x=G.cx+Math.cos(a)*(G.arenaR+200);u.y=G.cy+Math.sin(a)*(G.arenaR+200);}}
  pushOut(u);
}
function releaseAttack(u,t){
  if(t.dead)return;
  var dmg=u.atk,crit=Math.random()<u.crit;
  if(crit)dmg*=1.75;
  var extra=null;
  if(u.kind==="champ"){
    if(u.key==="TARINE"){u.passiveCount++;if(u.passiveCount>=3){u.passiveCount=0;dmg*=1.6;heal(u,u,u.maxHp*0.03,true);extra="#39FF7A";}}
    if(u.empower){dmg*=1.8;u.empower=0;extra=u.d.fx;}
    if(t.kind==="minion"&&u.ai)dmg*=1.15;
  }
  if(u.kind==="minion"&&t.kind==="champ")dmg*=0.6;
  if(u.kind==="monster"&&t.kind==="champ")dmg*=1;
  var ranged=u.kind==="champ"?u.d.ranged:u.ranged;
  if(ranged){
    spawnProj({x:u.x+u.face*14,y:u.y-24*(u.r/26),speed:u.kind==="champ"?1200:800,homing:t,team:u.team,src:u,dmg:dmg,crit:crit,
      color:extra||(u.kind==="champ"?(u.d.proj||u.d.fx):TEAM_COL[u.team]),size:u.kind==="champ"?5:3,emp:!!extra});
  }else{
    applyDamage(u,t,dmg,{basic:true,crit:crit});
    fxSlash(u,t,extra||(u.kind==="champ"?u.d.fx:"#fff"),crit);
    if(extra)fxBurst(t.x,t.y,extra,14,160);
    if(u.isPlayer||t.isPlayer)sfx("hit",u);
  }
  if(crit&&u.isPlayer)shake(3);
}
function pushOut(u){
  var hit=false;
  for(var i=0;i<G.obst.length;i++){
    var o=G.obst[i];var dx=u.x-o.x,dy=u.y-o.y,d=Math.sqrt(dx*dx+dy*dy)||0.01,m=o.r+u.r;
    if(d<m){u.x=o.x+dx/d*m;u.y=o.y+dy/d*m;hit=true;}
  }
  return hit;
}
function separate(){
  var U=G.units,n=U.length;
  for(var i=0;i<n;i++){
    var a=U[i];if(a.dead||a.kind==="nexus")continue;
    for(var j=i+1;j<n;j++){
      var b=U[j];if(b.dead||b.kind==="nexus")continue;
      var dx=b.x-a.x,dy=b.y-a.y,m=(a.r+b.r)*0.85;
      if(dx>m||dx<-m||dy>m||dy<-m)continue;
      var d=Math.sqrt(dx*dx+dy*dy)||0.01;
      if(d<m){
        var push=(m-d)/2,nx=dx/d,ny=dy/d;
        var aw=a.heavy?0:(b.heavy?1:(a.kind==="champ"&&b.kind==="minion"?0.2:a.kind==="minion"&&b.kind==="champ"?0.8:0.5));
        var bw=1-aw;if(b.heavy){bw=0;aw=1;}
        if(a.dash||b.dash)continue;
        a.x-=nx*push*2*aw;a.y-=ny*push*2*aw;b.x+=nx*push*2*bw;b.y+=ny*push*2*bw;
      }
    }
  }
}

// ---------------------------------------------------------------------
// IA : sbires, tours, monstres
// ---------------------------------------------------------------------
function thinkMinion(u,dt){
  u.think=(u.think||0)-dt;
  if(u.think>0)return;
  u.think=0.25+Math.random()*0.1;
  // cible
  if(!u.target||u.target.dead||edgeDist(u,u.target)>420){
    var best=null,bd=1e9;
    for(var i=0;i<G.units.length;i++){
      var o=G.units[i];
      if(o.dead||o.team===u.team||o.team===2||!targetable(o))continue;
      if(o.kind==="champ"&&!visibleTo(o,u.team))continue;
      var d=edgeDist(u,o);
      if(d>(u.summoned?520:360))continue;
      var pr=d+(o.kind==="champ"?(u.summoned?-60:180):0)+(o.kind==="tower"||o.kind==="nexus"?-40:0);
      if(pr<bd){bd=pr;best=o;}
    }
    u.target=best;
  }
  if(u.target)return;
  if(u.summoned){var ow=u.owner;u.moveGoal=ow&&!ow.dead?{x:ow.x-ow.face*40,y:ow.y+30}:null;return;}
  if(u.free){var pl=G.units.filter(function(o){return o.team!==u.team&&o.kind==="champ"&&!o.dead;})[0];u.moveGoal=pl?{x:pl.x,y:pl.y}:null;return;}
  // suivre la voie
  var p=u.path;if(!p){u.moveGoal=null;return;}
  var dir=u.team===0?1:-1;
  var w=p[u.wp];
  if(!w){var nx=G.nexus[1-u.team];u.moveGoal=nx?{x:nx.x,y:nx.y}:null;if(nx&&!nx.dead&&!nx.protectedBy)u.target=nx;return;}
  if(dist2(u.x,u.y,w.x,w.y)<70*70)u.wp+=dir;
  u.moveGoal={x:w.x,y:w.y+((u.id%5)-2)*8};
}
function thinkTower(u,dt){
  u.atkCd-=dt;u.focusT=(u.focusT||0)-dt;
  if(u.protectedBy&&u.protectedBy.dead)u.protectedBy=null;
  var t=u.target;
  if(t&&(t.dead||dist(u.x,u.y,t.x,t.y)>u.range+t.r||(t.kind==="champ"&&!visibleTo(t,u.team))))t=u.target=null;
  if(t&&t.kind==="champ"&&u.focusT<=0){
    // revenir sur les sbires s'il y en a
    var m=unitsNear(u.x,u.y,u.range,function(o){return o.team!==u.team&&o.team!==2&&o.kind==="minion";});
    if(m.length){t=u.target=m[0];u.heat=0;}
  }
  if(!t){
    var list=unitsNear(u.x,u.y,u.range,function(o){return o.team!==u.team&&o.team!==2&&targetable(o)&&(o.kind==="minion"||o.kind==="champ");});
    list.sort(function(a,b){return (a.kind==="champ")-(b.kind==="champ")||dist2(u.x,u.y,a.x,a.y)-dist2(u.x,u.y,b.x,b.y);});
    t=u.target=list[0]||null;u.heat=0;
  }
  if(t&&u.atkCd<=0){
    u.atkCd=1/u.as;
    var dmg=t.kind==="minion"?t.maxHp*(t.mtype==="siege"?0.14:0.42):(u.atk+G.time*0.9)*(1+u.heat*0.25)*(u.team===1?G.towerMult:1);
    if(t.kind==="champ")u.heat=Math.min(4,u.heat+1);
    spawnProj({x:u.x,y:u.y-95,speed:900,homing:t,team:u.team,src:u,dmg:dmg,color:TEAM_COL[u.team],size:9,tower:true});
    u.anim.atk=1;
    if(t.isPlayer)sfx("tower",u);
  }
}
function thinkMonster(u,dt){
  var h=u.home;
  var a=u.aggro;
  if(a&&(a.dead||dist(a.x,a.y,h.x,h.y)>520)){u.aggro=null;a=null;u.target=null;}
  if(!a){
    u.target=null;
    u.moveGoal=dist2(u.x,u.y,h.x,h.y)>20*20?h:null;
    if(dist2(u.x,u.y,h.x,h.y)<60*60)u.hp=Math.min(u.maxHp,u.hp+u.maxHp*0.2*dt);
  }else u.target=a;
}

// ---------------------------------------------------------------------
// IA des champions
// ---------------------------------------------------------------------
function aiShop(u,force){
  if(!u.atFount&&!force)return;
  var build=BUILDS[u.role]||BUILDS.Combattant;
  var guard=0;
  while(u.buildIdx<build.length&&guard++<12){
    var id=build[u.buildIdx];
    var q=quoteItem(u,id);
    if(q.ok&&u.gold>=q.price){buyItem(u,id);u.buildIdx++;}
    else break;
  }
}
function threatAt(x,y,team,rad){
  var s=0;
  G.units.forEach(function(o){
    if(o.dead||o.team===team||o.team===2)return;
    if(dist2(x,y,o.x,o.y)>rad*rad)return;
    if(o.kind==="champ"&&visibleTo(o,team))s+=o.atk*o.as*2+o.lvl*6+(o.hp/o.maxHp)*40;
    else if(o.kind==="tower"&&!o.protectedBy)s+=dist(x,y,o.x,o.y)<o.range+60?220:0;
  });
  return s;
}
function allyPowerAt(x,y,team,rad){
  var s=0;
  G.units.forEach(function(o){
    if(o.dead||o.team!==team||o.kind!=="champ")return;
    if(dist2(x,y,o.x,o.y)>rad*rad)return;
    s+=o.atk*o.as*2+o.lvl*6+(o.hp/o.maxHp)*40;
  });
  return s;
}
function inEnemyTowerRange(u,x,y,pad){
  for(var i=0;i<G.units.length;i++){var t=G.units[i];if(t.kind==="tower"&&!t.dead&&t.team!==u.team&&dist2(x,y,t.x,t.y)<(t.range+(pad||0))*(t.range+(pad||0)))return t;}
  return null;
}
function dangerZoneAt(u,x,y){
  for(var i=0;i<G.teles.length;i++){
    var z=G.teles[i];if(z.team===u.team)continue;
    if(z.kind==="circle"){if(dist2(x,y,z.x,z.y)<(z.r+u.r)*(z.r+u.r))return z;}
    else{var rx=x-z.x,ry=y-z.y,al=rx*z.dx+ry*z.dy;if(al>-u.r&&al<z.len+u.r&&Math.abs(rx*-z.dy+ry*z.dx)<z.w/2+u.r)return z;}
  }
  return null;
}
function thinkChamp(u,dt){
  var br=u.brain;
  // esquive des télégraphes (réaction selon le niveau de l'IA)
  var dz=dangerZoneAt(u,u.x,u.y);
  if(dz&&u.st.root<=0&&Math.random()<u.skill*dt*9){
    var ex,ey;
    if(dz.kind==="circle"){var a=Math.atan2(u.y-dz.y,u.x-dz.x);ex=dz.x+Math.cos(a)*(dz.r+u.r+40);ey=dz.y+Math.sin(a)*(dz.r+u.r+40);}
    else{var side=((u.x-dz.x)*-dz.dy+(u.y-dz.y)*dz.dx)>0?1:-1;ex=u.x+-dz.dy*side*(dz.w/2+u.r+30);ey=u.y+dz.dx*side*(dz.w/2+u.r+30);}
    u.target=null;u.moveGoal={x:ex,y:ey};br.t=0.35;br.state="dodge";
    if(u.spells.saut<=0&&dz.ult&&Math.random()<u.skill*0.5)castSpell(u,"saut",ex,ey);
    return;
  }
  br.t-=dt;
  if(br.t>0)return;
  br.t=0.18+(1-u.skill)*0.25+Math.random()*0.08;
  if(u.recall>0)return;
  var hpF=u.hp/u.maxHp;
  var fount=G.fount[u.team];
  // à la fontaine : achats puis départ
  if(u.atFount){aiShop(u);if(hpF<0.95&&br.state==="retreat"){u.moveGoal=null;u.target=null;return;}if(br.state==="retreat")br.state="lane";}
  // sort de soin
  if(hpF<0.3&&u.spells.soin<=0&&Math.random()<u.skill)castSpell(u,"soin",u.x,u.y);
  var enemies=G.units.filter(function(o){return !o.dead&&o.kind==="champ"&&o.team!==u.team&&targetable(o)&&visibleTo(o,u.team)&&dist2(u.x,u.y,o.x,o.y)<900*900;});
  var threat=threatAt(u.x,u.y,u.team,700);
  var power=allyPowerAt(u.x,u.y,u.team,700);
  var retreatAt=G.mode==="boss"||G.mode==="defense"&&u.team===1?0.05:0.22+(1-u.skill)*0.05;
  if(u.isBoss)retreatAt=-1;
  // retraite
  if(br.state==="retreat"||(hpF<retreatAt&&threat>0)||(hpF<0.3&&G.mode==="siege")){
    br.state="retreat";
    if(G.mode==="defense"&&u.team===1){br.state="fight";}
    else{
      u.target=null;
      var safe=threat<=0||enemies.every(function(o){return dist(u.x,u.y,o.x,o.y)>750;});
      if(safe&&!u.atFount&&G.mode!=="boss"){u.recall=4;u.moveGoal=null;return;}
      if(!safe&&u.spells.saut<=0&&hpF<0.2&&enemies.length&&Math.random()<u.skill){castSpell(u,"saut",fount.x,fount.y);}
      // Utiliser une capacité défensive
      aiUseDefensive(u);
      u.moveGoal={x:fount.x,y:fount.y};
      if(u.atFount&&hpF>0.9)br.state="lane";
      return;
    }
  }
  // retour à la fontaine pour dépenser beaucoup d'or
  if(G.mode==="siege"&&u.gold>1400&&enemies.length===0&&hpF<0.7&&!u.atFount){u.recall=4;u.target=null;u.moveGoal=null;return;}
  // combat
  var aggro=power*(0.9+u.skill*0.4)+(hpF-0.5)*80>threat*0.95||G.mode!=="siege";
  if(u.team===1&&G.mode==="defense")aggro=true;
  var focus=null,fs=1e9;
  enemies.forEach(function(o){
    var d=dist(u.x,u.y,o.x,o.y);
    if(d>(aggro?780:u.range+o.r+u.r+40))return;
    if(G.mode==="siege"&&inEnemyTowerRange(u,o.x,o.y,20)&&hpF<0.85&&!(u.team===1&&false)){
      var tw=inEnemyTowerRange(u,o.x,o.y,20);
      var tanked=unitsNear(tw.x,tw.y,tw.range,function(m){return m.team===u.team&&m.kind==="minion";}).length>0;
      if(!tanked&&o.hp/o.maxHp>0.25)return;
    }
    var score=o.hp*100/(100+o.arm)+d*(0.6+u.skill*0.2)-(o.isPlayer?40:0);
    if(u.st.tauntBy===o)score-=9999;
    if(score<fs){fs=score;focus=o;}
  });
  if(focus){
    br.state="fight";
    aiUseAbilities(u,focus,enemies);
    // kiting pour les distances
    if(u.d.ranged&&u.atkCd>0.15&&edgeDist(u,focus)<u.range*0.6&&u.skill>0.5){
      var ka=Math.atan2(u.y-focus.y,u.x-focus.x);
      u.target=null;u.moveGoal={x:u.x+Math.cos(ka)*80,y:u.y+Math.sin(ka)*80};
    }else{u.target=focus;u.moveGoal=null;}
    if(u.spells.saut<=0&&focus.hp/focus.maxHp<0.2&&edgeDist(u,focus)>u.range&&edgeDist(u,focus)<u.range+240&&Math.random()<u.skill*0.4)castSpell(u,"saut",focus.x,focus.y);
    return;
  }
  br.state="lane";
  // modes
  if(G.mode==="siege")aiLane(u);
  else if(G.mode==="arena")aiArena(u);
  else if(G.mode==="defense")aiDefense(u);
  else aiBoss(u);
}
function aiUseDefensive(u){
  for(var i=0;i<4;i++){
    var ab=u.d.abil[i];
    if(!canCast(u,i))continue;
    if(ab.type==="self"||ab.type==="ally"||(ab.type==="nova"&&ab.team==="ally")){castAbility(u,i,u.x,u.y,u);return;}
  }
}
function aiUseAbilities(u,t,enemies){
  var d=dist(u.x,u.y,t.x,t.y);
  var lead=u.skill;
  for(var i=3;i>=0;i--){
    var ab=u.d.abil[i];
    if(!canCast(u,i))continue;
    if(Math.random()>0.35+u.skill*0.55)continue;
    var px=t.x,py=t.y;
    var travel=ab.speed?d/ab.speed:(ab.delay||0.3);
    px+=t.vx*travel*lead;py+=t.vy*travel*lead;
    var ok=false;
    switch(ab.type){
      case "shot":ok=d<ab.range*0.95;break;
      case "circle":ok=d<ab.range+ab.radius*0.5;break;
      case "line":ok=d<ab.range*0.9;break;
      case "cone":ok=d<ab.range*0.9;break;
      case "dash":ok=d<ab.range+40&&(u.hp/u.maxHp>0.35||t.hp/t.maxHp<0.3);break;
      case "blink":ok=d<ab.range&&(ab.from?true:(u.hp/u.maxHp>0.4||t.hp/t.maxHp<0.35));if(ab.from){px=u.x+(t.x-u.x)*0.2;py=u.y+(t.y-u.y)*0.2;}break;
      case "nova":ok=ab.team==="ally"?(allyHurt(u,ab.radius)):(d<ab.radius*0.85);break;
      case "self":ok=d<500&&(u.hp/u.maxHp<0.8||ab.buff&&ab.buff.as);break;
      case "ally":ok=allyHurt(u,ab.range);break;
      case "zone":ok=d<ab.range;break;
      case "summon":ok=d<400;break;
    }
    if(ab.ult&&!u.isBoss){
      var score=t.hp/t.maxHp;
      if(ab.type!=="nova"||ab.team!=="ally")ok=ok&&(score<0.7||enemies.length>=2||u.hp/u.maxHp<0.4);
    }
    if(ok){castAbility(u,i,px,py,t);return;}
  }
}
function allyHurt(u,rad){
  return unitsNear(u.x,u.y,rad,function(o){return o.team===u.team&&o.kind==="champ"&&o.hp/o.maxHp<0.65;}).length>0;
}
function aiLane(u){
  var dir=u.team===0?1:-1;
  // front de la vague alliée
  var front=null;
  G.units.forEach(function(m){
    if(m.dead||m.team!==u.team||m.kind!=="minion")return;
    if(!front||(m.x-front.x)*dir>0)front=m;
  });
  // achever des sbires
  var lh=null,lhs=1e9;
  unitsNear(u.x,u.y,u.range+320,function(o){return o.team!==u.team&&(o.kind==="minion"||o.kind==="monster"&&false);}).forEach(function(o){
    var s=o.hp-(u.atk*100/(100+o.arm))*1.1;
    var score=s<=0?-1000+dist(u.x,u.y,o.x,o.y):o.hp+dist(u.x,u.y,o.x,o.y)*0.5;
    if(inEnemyTowerRange(u,o.x,o.y,40)&&!front)return;
    if(score<lhs){lhs=score;lh=o;}
  });
  // tour ennemie attaquable si des sbires la tankent
  var tw=null;
  G.units.forEach(function(t){
    if(t.dead||t.team===u.team||(t.kind!=="tower"&&t.kind!=="nexus")||t.protectedBy)return;
    if(dist(u.x,u.y,t.x,t.y)>t.range+200)return;
    var tanked=unitsNear(t.x,t.y,t.range,function(m){return m.team===u.team&&m.kind==="minion";}).length>0;
    if(tanked||t.kind==="nexus"||G.units.filter(function(e){return e.kind==="champ"&&e.team!==u.team&&!e.dead;}).length===0)tw=t;
  });
  // forêt : prendre un camp si la voie est calme
  if(!front&&u.skill>0.4&&Math.random()<0.15){
    var camp=null,cd=1e9;
    G.camps.forEach(function(c){
      if(!c.unit||c.unit.dead)return;
      if(c.big&&u.lvl<8)return;
      var home=u.team===0?c.x<G.W/2:c.x>G.W/2;
      if(!home&&!c.big)return;
      var d=dist(u.x,u.y,c.x,c.y);if(d<cd){cd=d;camp=c;}
    });
    if(camp&&cd<1400){u.target=camp.unit;camp.unit.aggro=camp.unit.aggro||u;u.moveGoal=null;return;}
  }
  if(u.target&&u.target.kind==="monster"&&!u.target.dead)return;
  if(tw&&(!lh||lhs>0)){u.target=tw;u.moveGoal=null;return;}
  if(lh){u.target=lh;u.moveGoal=null;return;}
  u.target=null;
  var gx;
  if(front)gx=front.x-dir*(u.d.ranged?190:110);
  else{
    // sans vague : tenir sous sa tour la plus avancée
    var myT=null;
    G.units.forEach(function(t){if(t.kind==="tower"&&!t.dead&&t.team===u.team){if(!myT||(t.x-myT.x)*dir>0)myT=t;}});
    gx=myT?myT.x+dir*60:G.fount[u.team].x+dir*300;
  }
  // pression : au bout de quelques minutes, l'Empire quitte sa moitié et vient au contact
  if(u.team===1&&!front){
    var press=(G.time>180?1:0)+(G.teamKills[1]>G.teamKills[0]?1:0);
    if(press)gx=gx+dir*(180+press*160);
  }
  var slot=(u.id%3-1)*70;
  u.moveGoal={x:clamp(gx,G.bx0,G.bx1),y:laneY(clamp(gx,G.bx0,G.bx1))+slot};
}
function aiArena(u){
  var e=G.units.filter(function(o){return o.kind==="champ"&&o.team!==u.team&&!o.dead;});
  if(G.orb&&Math.random()<0.6){u.moveGoal={x:G.orb.x,y:G.orb.y};u.target=null;return;}
  var hpF=u.hp/u.maxHp;
  if(u.team===0&&G.player&&!G.player.dead&&!u.isPlayer){
    var p=G.player;
    if(dist(u.x,u.y,p.x,p.y)>320){u.moveGoal={x:p.x-p.face*80,y:p.y+(u.id%2?70:-70)};u.target=null;return;}
  }
  // traque : aller vers l'ennemi visible le plus proche, sinon le centre
  var vis=e.filter(function(o){return visibleTo(o,u.team);});
  if(vis.length&&hpF>0.4){var t=vis[0];u.moveGoal={x:t.x,y:t.y};u.target=null;return;}
  u.moveGoal={x:G.W/2+(u.team===0?-250:250)+Math.sin(G.time*0.3+u.id)*200,y:G.H/2+Math.cos(G.time*0.23+u.id)*300};
  u.target=null;
}
function aiDefense(u){
  if(u.team===1){
    var nx=G.nexus[0];
    // attaquer tour / nexus
    var t=null,bd=1e9;
    G.units.forEach(function(o){if(o.dead||o.team!==0||o.kind==="monster")return;if(o.protectedBy)return;var d=dist(u.x,u.y,o.x,o.y);if(d<bd&&(o.kind!=="champ"||visibleTo(o,1))){bd=d;t=o;}});
    if(t&&bd<700){u.target=t;u.moveGoal=null;}else{u.target=null;u.moveGoal={x:nx.x,y:nx.y};}
    return;
  }
  // alliés : défendre, rester près du joueur ou de la ligne de défense
  var enemies=G.units.filter(function(o){return o.team===1&&!o.dead&&(o.kind==="minion"||o.kind==="champ");});
  var guard={x:1250,y:G.H/2};
  var near=null,nd=1e9;
  enemies.forEach(function(o){var d=dist(guard.x,guard.y,o.x,o.y);if(d<nd){nd=d;near=o;}});
  if(near&&nd<1300){u.target=near;u.moveGoal=null;return;}
  var p=G.player;
  u.target=null;
  u.moveGoal=p&&!p.dead&&!u.isPlayer?{x:p.x-60,y:p.y+(u.id%2?60:-60)}:guard;
}
function aiBoss(u){
  if(u.team===1){
    var foes=G.units.filter(function(o){return o.team===0&&o.kind==="champ"&&!o.dead;});
    var t=foes.sort(function(a,b){return dist2(u.x,u.y,a.x,a.y)-dist2(u.x,u.y,b.x,b.y);})[0];
    if(u.isBoss&&G.time%12<4&&foes.length>1)t=foes.sort(function(a,b){return a.hp-b.hp;})[0];
    u.target=t||null;u.moveGoal=t?null:{x:G.cx,y:G.cy};
    if(t)aiUseAbilities(u,t,foes);
    return;
  }
  var b=G.boss;
  if(!b||b.dead){
    var adds=G.units.filter(function(o){return o.team===1&&!o.dead;});
    u.target=adds[0]||null;return;
  }
  // se placer : les distances restent loin, les mêlées vont au contact ; nettoyer les renforts d'abord si proches
  var add=unitsNear(u.x,u.y,350,function(o){return o.team===1&&o.kind==="minion";})[0];
  if(add&&u.role!=="Tank"){u.target=add;u.moveGoal=null;return;}
  u.target=b;u.moveGoal=null;
  aiUseAbilities(u,b,[b]);
}
