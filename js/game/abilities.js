// ============================================================
// ABILITIES — exécute les sorts actifs (A/Z/E/R) à partir des
// données déjà présentes dans CHAMPS[key].abil. Couvre les types
// rencontrés dans le jeu : self, shot, dash, circle, cone, nova,
// zone, ally (soin), summon, et line/blink (traités comme des
// variantes de shot/dash — portée assumée pour cette passe : pas
// de vrai visé à la souris, ciblage automatique sur l'ennemi ou
// l'allié le plus pertinent à portée).
// ============================================================

/** Tente de lancer le sort au slot donné (0=A,1=Z,2=E,3=R). Renvoie true si lancé. */
export function tryCastAbility(sim, u, slot){
  if(!u || u.dead) return false;
  const d = u.d;
  const a = d && d.abil && d.abil[slot];
  if(!a) return false;
  if(u.cc && (u.cc.type === 'stun') && sim.time < u.cc.until) return false;
  if(u.cds[slot] > 0) return false;
  const cost = a.cost || 0;
  if((u.mana||0) < cost) return false;

  u.mana -= cost;
  u.cds[slot] = Array.isArray(a.cd) ? a.cd[0] : (a.cd || 6);
  sim.onEvent({ type: 'cast', unit: u, slot, ability: a });

  const fn = EXECUTORS[a.type] || EXECUTORS.self;
  fn(sim, u, a);

  // Burn (talent Feu — Brasier) : après chaque capacité, les ennemis
  // dans un rayon standard reçoivent un DoT léger pendant 3 s.
  if(u.bns?.burn > 0){
    _applyBurn(sim, u, a);
  }

  return true;
}

function dmgOf(a, u){
  const base = Array.isArray(a.dmg) ? (a.dmg[0]||0) : (a.dmg||0);
  let total = base + (u.atk||0) * (a.ratio||0);
  // Bonus ultime (talent Feu — Cœur ardent)
  if(a.ult && u.bns?.ultDmg) total *= (1 + u.bns.ultDmg);
  return total;
}
function healOf(a, u){
  const base = Array.isArray(a.heal) ? (a.heal[0]||0) : (a.heal||0);
  let total = base + (u.maxHp||0) * (a.healR||0);
  // Bonus soins prodigués (talent Eau — Source)
  if(u.bns?.healP) total *= (1 + u.bns.healP);
  return total;
}
function shieldOf(a, u){
  const base = Array.isArray(a.shield) ? (a.shield[0]||0) : (a.shield||0);
  let total = base + (u.maxHp||0) * (a.shieldR||0);
  // Bonus boucliers (talent Terre — Granit)
  if(u.bns?.shieldP) total *= (1 + u.bns.shieldP);
  return total;
}
function buffArmOf(a){
  const buf = a.buff && a.buff.arm;
  return Array.isArray(buf) ? (buf[0]||0) : (buf||0);
}

function applyCC(sim, u, t, a){
  if(!a.cc) return;
  // ccRes réduit la durée des contrôles subis
  const ccResMul = 1 - Math.min(0.75, (t.bns?.ccRes || 0));
  const dur = (a.cc.d || 1) * ccResMul;
  if(dur <= 0.05) return; // contrôle annulé
  t.cc = { type: a.cc.t, until: sim.time + dur, p: a.cc.p||0.3 };
  sim.onEvent({ type: 'cc', unit: t, cc: a.cc });
}

function heal(sim, target, amount){
  target.hp = Math.min(target.maxHp, target.hp + amount);
  sim.onEvent({ type: 'heal', unit: target, amount });
}

const EXECUTORS = {
  // Buff/bouclier sur soi (ex. "Mur de Pierre" de Tarine).
  self(sim, u, a){
    if(a.shield) u.shield += shieldOf(a, u);
    const arm = buffArmOf(a);
    if(arm){ u.tempArm = arm; u.tempArmUntil = sim.time + ((a.buff&&a.buff.d)||3); }
    sim.onEvent({ type: 'fx-self', unit: u, color: a.color });
  },

  // Projectile visé sur l'ennemi le plus proche — "line" (ultimes à portée
  // longue) traité comme une variante plus large du même schéma.
  shot(sim, u, a){ castProjectile(sim, u, a); },
  line(sim, u, a){ castProjectile(sim, u, a); },

  // Ruée vers l'ennemi le plus proche puis impact en zone à l'arrivée.
  // "blink" (téléportation) réutilise la même logique avec une portée dédiée.
  dash(sim, u, a){ castDash(sim, u, a); },
  blink(sim, u, a){ castDash(sim, u, a); },

  // Zone ciblée au sol, avec un court délai avant l'impact (télégraphié).
  circle(sim, u, a){
    const foe = sim._nearestFoe(u, a.range || 500);
    const tx = foe ? foe.x : u.x + u.facing.x * (a.range||300);
    const ty = foe ? foe.y : u.y + u.facing.y * (a.range||300);
    sim.onEvent({ type: 'ground-tell', x: tx, y: ty, radius: a.radius||150, color: a.color, delay: a.delay||0.6 });
    setTimeout(() => {
      if(sim.over) return;
      sim.onEvent({ type: 'ground-impact', x: tx, y: ty, radius: a.radius||150, color: a.color });
      for(const t of sim.units){
        if(t.dead || t.team === u.team || t.team === undefined) continue;
        if(Math.hypot(t.x-tx, t.y-ty) <= (a.radius||150)){
          sim._applyDamage(u, t, dmgOf(a, u));
          applyCC(sim, u, t, a);
        }
      }
    }, (a.delay||0.6) * 1000);
  },

  // Cône mêlée dans la direction actuelle du lanceur.
  cone(sim, u, a){
    const range = a.range || 220, half = (a.angle||1.2)/2;
    sim.onEvent({ type: 'fx-cone', unit: u, range, angle: a.angle||1.2, color: a.color });
    for(const t of sim.units){
      if(t.dead || t.team === u.team || t.team === undefined) continue;
      const dx = t.x-u.x, dy = t.y-u.y, dist = Math.hypot(dx,dy);
      if(dist > range) continue;
      const ang = Math.atan2(dy,dx) - Math.atan2(u.facing.y, u.facing.x);
      const norm = Math.atan2(Math.sin(ang), Math.cos(ang));
      if(Math.abs(norm) <= half){
        sim._applyDamage(u, t, dmgOf(a, u));
        applyCC(sim, u, t, a);
      }
    }
  },

  // Explosion centrée sur soi — vers les ennemis (dégâts) ou les alliés (soin/bouclier).
  nova(sim, u, a){
    const radius = a.radius || 260;
    sim.onEvent({ type: 'ground-impact', x: u.x, y: u.y, radius, color: a.color });
    if(a.team === 'ally'){
      for(const t of sim.units){
        if(t.dead || t.team !== u.team || t.kind !== 'champ') continue;
        if(Math.hypot(t.x-u.x, t.y-u.y) > radius) continue;
        if(a.heal) heal(sim, t, healOf(a, u));
        if(a.shield) t.shield += shieldOf(a, u);
      }
    } else {
      for(const t of sim.units){
        if(t.dead || t.team === u.team || t.team === undefined) continue;
        if(Math.hypot(t.x-u.x, t.y-u.y) > radius) continue;
        if(a.dmg) sim._applyDamage(u, t, dmgOf(a, u));
        applyCC(sim, u, t, a);
      }
    }
    const arm = buffArmOf(a);
    if(arm){ u.tempArm = arm; u.tempArmUntil = sim.time + ((a.buff&&a.buff.d)||3); }
  },

  // Zone persistante simplifiée en impact instantané (dégâts aux ennemis,
  // soin aux alliés présents dans le rayon) — pas encore de tick continu.
  zone(sim, u, a){
    const foe = sim._nearestFoe(u, a.range || 400);
    const tx = foe ? foe.x : u.x + u.facing.x * (a.range||250);
    const ty = foe ? foe.y : u.y + u.facing.y * (a.range||250);
    sim.onEvent({ type: 'ground-impact', x: tx, y: ty, radius: a.radius||170, color: a.color });
    for(const t of sim.units){
      if(t.dead) continue;
      const dist = Math.hypot(t.x-tx, t.y-ty);
      if(dist > (a.radius||170)) continue;
      if(t.team === u.team && t.kind === 'champ' && a.heal) heal(sim, t, healOf(a, u)*3);
      else if(t.team !== u.team && t.team !== undefined && a.dmg){
        sim._applyDamage(u, t, dmgOf(a, u)*3);
        applyCC(sim, u, t, a);
      }
    }
  },

  // Soin ciblé sur l'allié le plus blessé à portée (ou soi-même).
  ally(sim, u, a){
    const target = sim._nearestWoundedAlly(u, a.range || 500);
    if(a.heal) heal(sim, target, healOf(a, u));
    if(a.buff && a.buff.ms){ target.ms = target.baseMs * 1.001 + a.buff.ms; setTimeout(() => { if(!target.dead) target.ms = target.baseMs; }, (a.buff.d||2)*1000); }
    sim.onEvent({ type: 'fx-beam', from: u, to: target, color: a.color });
  },

  // Invocation temporaire — un allié fantôme qui combat quelques secondes.
  summon(sim, u, a){
    const power = Array.isArray(a.power) ? (a.power[0]||0.5) : (a.power||0.5);
    const ghost = {
      id: -Math.floor(Math.random()*1e9), kind: 'champ', key: u.key, d: u.d,
      name: u.name + ' (Lieutenant)', team: u.team,
      x: u.x, y: u.y, r: u.r*0.85,
      hp: u.maxHp*power, maxHp: u.maxHp*power,
      mana: 0, maxMana: 0,
      atk: u.atk*power, arm: u.arm*0.6, as: u.as, ms: u.ms, baseMs: u.ms, range: u.range,
      ranged: u.ranged, fx: u.fx, proj: u.proj,
      role: u.role, isPlayer: false, isAlly: u.isAlly,
      atkCd: 0, dead: false, target: null, path: null, wp: 0,
      cds: [999,999,999,999], shield: 0, tempArm: 0, tempArmUntil: 0,
      cc: null, facing: { x: 1, y: 0 },
      temporary: true, expiresAt: sim.time + (a.dur || 6),
    };
    sim.units.push(ghost);
    sim.onEvent({ type: 'fx-self', unit: u, color: a.color });
  },
};

function _applyBurn(sim, u, a){
  const burnPct = u.bns.burn;
  const burnDps = dmgOf(a, u) * burnPct; // % des dégâts de base du sort
  const burnDur = 3;
  const burnTick = 0.5;
  // Cible les unités adverses à portée de la capacité (rayon max 300)
  const burnRadius = (a.radius || a.range || 300);
  for(const t of sim.units){
    if(t.dead || t.team === u.team || t.team === undefined) continue;
    if(Math.hypot(t.x - u.x, t.y - u.y) > burnRadius) continue;
    let elapsed = 0;
    const interval = setInterval(() => {
      if(sim.over || t.dead){ clearInterval(interval); return; }
      sim._applyDamage(u, t, burnDps * burnTick, {});
      elapsed += burnTick;
      if(elapsed >= burnDur) clearInterval(interval);
    }, burnTick * 1000);
  }
}

function castProjectile(sim, u, a){
  const foe = sim._nearestFoe(u, a.range || 600);
  if(!foe) return;
  sim.onEvent({ type: 'projectile', from: u, to: foe, color: a.color || u.proj || u.fx, isAbility: true });
  const dist = Math.hypot(foe.x-u.x, foe.y-u.y);
  const travel = Math.max(60, dist / (a.speed || 900)) * 1000;
  setTimeout(() => {
    if(sim.over || foe.dead) return;
    sim._applyDamage(u, foe, dmgOf(a, u));
    applyCC(sim, u, foe, a);
    if(a.pierce){
      for(const t of sim.units){
        if(t === foe || t.dead || t.team === u.team || t.team === undefined) continue;
        if(Math.hypot(t.x-foe.x, t.y-foe.y) < (a.width||46)*2){
          sim._applyDamage(u, t, dmgOf(a, u));
          applyCC(sim, u, t, a);
        }
      }
    }
  }, travel);
}

function castDash(sim, u, a){
  const foe = sim._nearestFoe(u, a.range || 350);
  const range = a.range || 350;
  let tx, ty;
  if(foe){
    const d = Math.hypot(foe.x-u.x, foe.y-u.y) || 1;
    const k = Math.min(1, range/d);
    tx = u.x + (foe.x-u.x)*k; ty = u.y + (foe.y-u.y)*k;
  } else {
    tx = u.x + u.facing.x * range; ty = u.y + u.facing.y * range;
  }
  sim.onEvent({ type: 'fx-dash', unit: u, x0: u.x, y0: u.y, x1: tx, y1: ty, color: a.color });
  u.x = tx; u.y = ty;
  const radius = a.radius || 110;
  sim.onEvent({ type: 'ground-impact', x: tx, y: ty, radius, color: a.color });
  for(const t of sim.units){
    if(t.dead || t.team === u.team || t.team === undefined) continue;
    if(Math.hypot(t.x-tx, t.y-ty) <= radius){
      sim._applyDamage(u, t, dmgOf(a, u));
      applyCC(sim, u, t, a);
    }
  }
  const arm = buffArmOf(a);
  if(arm){ u.tempArm = arm; u.tempArmUntil = sim.time + ((a.buff&&a.buff.d)||3); }
}
