// ============================================================
// COUCHE DE COMBAT RAPPROCHÉ — le mode Duel.
//
// Ce module ne remplace pas la simulation : il s'y greffe pour les
// deux seuls combattants d'un duel, et leur donne le fonctionnement
// d'un jeu de combat plutôt que celui d'un MOBA :
//
//   • des coups à fenêtres (élan / phase active / récupération) au
//     lieu d'un délai d'attaque qui tombe tout seul ;
//   • des enchaînements : coup léger, léger, léger, lourd — chaque
//     touche ouvre une fenêtre pour le suivant, et chaque étape joue
//     une animation différente ;
//   • une garde qui réduit les dégâts et tient debout, mais bloque
//     le déplacement ;
//   • une esquive avec quelques centièmes d'invincibilité ;
//   • un arrêt sur image à l'impact (le « hitstop »), du recul, et
//     une chute au sol sur le coup final d'un enchaînement.
//
// Les valeurs sont en secondes, pensées à 60 images/s. Elles sont
// volontairement lisibles et groupées : c'est ce qu'on ajuste quand
// le combat « ne sent pas bon ».
// ============================================================

/** Données de frappe. Les durées sont en secondes. */
export const MOVES = {
  light: {
    startup: 0.10, active: 0.07, recover: 0.20,
    reach: 108, arc: 1.15,
    dmg: 0.42, hitstun: 0.30, blockstun: 0.14,
    push: 30, hitstop: 0.055, cost: 0,
  },
  heavy: {
    startup: 0.24, active: 0.09, recover: 0.36,
    reach: 124, arc: 1.0,
    dmg: 1.05, hitstun: 0.48, blockstun: 0.24,
    push: 105, hitstop: 0.11, knockdown: true, cost: 0,
  },
};

/** Enchaînement au sol : trois légers puis un lourd qui envoie au tapis. */
const CHAIN = ['light', 'light', 'light', 'heavy'];
const CHAIN_WINDOW = 0.26;   // temps pour enchaîner après la fin d'un coup
const DODGE_TOTAL = 0.42, DODGE_IFRAMES = [0.04, 0.26], DODGE_CD = 0.85, DODGE_DIST = 150;
const BLOCK_REDUCTION = 0.78;  // dégâts absorbés par la garde
const KNOCKDOWN_TIME = 0.95;

export class Fighter{
  /**
   * @param {Sim} sim
   * @param {object} unit    l'unité de simulation
   * @param {object} foe     l'adversaire
   * @param {object} o       { isPlayer, skill } — skill 0..1 pilote l'IA
   */
  constructor(sim, unit, foe, o = {}){
    this.sim = sim; this.u = unit; this.foe = foe;
    this.isPlayer = !!o.isPlayer;
    this.skill = o.skill ?? 0.5;
    this.reset();
  }

  reset(){
    this.phase = 'free';       // free | startup | active | recover | block | dodge | hitstun | down
    this.t = 0;                // temps restant dans la phase
    this.move = null;
    this.step = 0;             // position dans l'enchaînement
    this.chainUntil = 0;
    this.hasHit = false;
    this.blocking = false;
    this.dodgeCd = 0;
    this.buffered = null;      // coup mis en mémoire tampon pendant la récupération
    this._aiNext = 0.4;
  }

  get busy(){ return this.phase !== 'free' && this.phase !== 'block'; }
  get invulnerable(){
    return this.phase === 'dodge' && this.t <= DODGE_TOTAL - DODGE_IFRAMES[0] && this.t >= DODGE_TOTAL - DODGE_IFRAMES[1];
  }
  /** Le combattant peut-il se déplacer librement ? (le HUD et l'IA s'en servent) */
  get canMove(){ return this.phase === 'free' && !this.blocking; }

  // ── Entrées ────────────────────────────────────────────────
  strike(kind){
    if(this.phase === 'down' || this.phase === 'hitstun' || this.phase === 'dodge') return false;
    if(this.phase === 'startup' || this.phase === 'active'){ this.buffered = kind; return false; }
    if(this.phase === 'recover'){
      // Enchaînement : seulement si le coup précédent a touché.
      if(this.hasHit && this.sim.time <= this.chainUntil){ this._begin(kind, this.step + 1); return true; }
      this.buffered = kind; return false;
    }
    this._begin(kind, this.sim.time <= this.chainUntil && this.hasHit ? this.step + 1 : 0);
    return true;
  }

  setBlock(on){
    if(this.phase === 'down' || this.phase === 'hitstun') return;
    if(on && this.phase === 'free'){ this.phase = 'block'; this.blocking = true; this.sim._fightEvent(this, 'block-on'); }
    else if(!on && this.phase === 'block'){ this.phase = 'free'; this.blocking = false; this.sim._fightEvent(this, 'block-off'); }
    else this.blocking = on && this.blocking;
  }

  dodge(dirX, dirY){
    if(this.phase !== 'free' && this.phase !== 'block') return false;
    if(this.dodgeCd > 0) return false;
    this.phase = 'dodge'; this.t = DODGE_TOTAL; this.dodgeCd = DODGE_CD; this.blocking = false;
    // Sans direction donnée, on recule loin de l'adversaire.
    let dx = dirX, dy = dirY;
    if(!dx && !dy){
      dx = this.u.x - this.foe.x; dy = this.u.y - this.foe.y;
    }
    const d = Math.hypot(dx, dy) || 1;
    this._dodgeVec = { x: dx / d, y: dy / d };
    this.sim._fightEvent(this, 'dodge');
    return true;
  }

  // ── Interne ────────────────────────────────────────────────
  _begin(kind, step){
    const idx = Math.min(step, CHAIN.length - 1);
    // Le quatrième coup d'un enchaînement est toujours le lourd final.
    const m = (step >= CHAIN.length - 1) ? 'heavy' : kind;
    this.move = MOVES[m]; this.moveKind = m; this.step = idx;
    this.phase = 'startup'; this.t = this.move.startup;
    this.hasHit = false; this.blocking = false; this.buffered = null;
    this.sim._fightEvent(this, 'strike', { move: m, step: idx });
  }

  /** Portée + cône : le coup touche-t-il l'adversaire ? */
  _reaches(){
    const f = this.foe;
    if(f.dead) return false;
    const dx = f.x - this.u.x, dy = f.y - this.u.y;
    const d = Math.hypot(dx, dy);
    if(d > this.move.reach + (f.r || 20)) return false;
    const fac = this.u.facing || { x: 1, y: 0 };
    const cos = (dx * fac.x + dy * fac.y) / (d || 1);
    return cos > Math.cos(this.move.arc);
  }

  update(dt){
    if(this.dodgeCd > 0) this.dodgeCd = Math.max(0, this.dodgeCd - dt);
    if(this.u.dead){ this.phase = 'free'; return; }

    // La cible reste assignée en permanence : l'IA de sorts (ruées,
    // zones, soins) s'en sert pour viser. Sans elle, une ruée partait
    // vers une position indéfinie et envoyait le combattant dans le vide.
    this.u.target = this.foe;

    // Toujours face à l'adversaire : un jeu de combat ne tourne pas le dos.
    const dx = this.foe.x - this.u.x, dy = this.foe.y - this.u.y;
    const d = Math.max(0.01, Math.hypot(dx, dy));
    if(this.phase !== 'down') this.u.facing = { x: dx / d, y: dy / d };

    if(this.phase === 'dodge'){
      this.t -= dt;
      const k = DODGE_DIST * dt / DODGE_TOTAL;
      this.u.x += this._dodgeVec.x * k; this.u.y += this._dodgeVec.y * k;
      if(this.t <= 0){ this.phase = 'free'; }
      return;
    }
    if(this.phase === 'hitstun' || this.phase === 'down'){
      this.t -= dt;
      if(this.t <= 0){ this.phase = 'free'; this.sim._fightEvent(this, 'getup'); }
      return;
    }
    if(this.phase === 'startup'){
      this.t -= dt;
      if(this.t <= 0){ this.phase = 'active'; this.t = this.move.active; }
      return;
    }
    if(this.phase === 'active'){
      if(!this.hasHit && this._reaches()){
        this.hasHit = true;
        this.sim._fightHit(this, this.foe, this.move, this.moveKind, this.step);
      }
      this.t -= dt;
      if(this.t <= 0){
        this.phase = 'recover'; this.t = this.move.recover;
        this.chainUntil = this.sim.time + this.move.recover + CHAIN_WINDOW;
      }
      return;
    }
    if(this.phase === 'recover'){
      this.t -= dt;
      if(this.t <= 0){
        this.phase = 'free';
        if(this.buffered){ const b = this.buffered; this.buffered = null; this.strike(b); }
      }
      return;
    }
  }

  /**
   * Reçoit un coup. Renvoie les dégâts réellement encaissés.
   * `step` sert à la mise au sol : seul le coup lourd qui CONCLUT un
   * enchaînement (ou qui cueille un adversaire déjà chancelant) envoie au
   * tapis. Un lourd isolé ne fait que repousser fort — sinon le combat
   * devient une suite de chutes et plus personne ne se bat debout.
   */
  takeHit(move, kind, fromFighter, step = 0){
    if(this.invulnerable){ this.sim._fightEvent(this, 'dodge-perfect'); return 0; }
    const attacker = fromFighter.u;
    const raw = (attacker.atk || 40) * move.dmg * (fromFighter.isPlayer ? 1 : 0.75);
    // Garde : on encaisse peu, on ne chancelle pas, mais on est repoussé.
    if(this.phase === 'block' || this.blocking){
      this.t = Math.max(this.t, move.blockstun);
      this._pushed(move.push * 0.45, fromFighter);
      this.sim._fightEvent(this, 'blocked');
      return raw * (1 - BLOCK_REDUCTION);
    }
    // Coup encaissé : interruption, recul, et chute sur le coup final.
    const down = !!move.knockdown && (step >= CHAIN.length - 1 || this.phase === 'hitstun');
    this.phase = down ? 'down' : 'hitstun';
    this.t = down ? KNOCKDOWN_TIME : move.hitstun;
    this.move = null; this.hasHit = false; this.buffered = null;
    this._pushed(move.push, fromFighter);
    this.sim._fightEvent(this, down ? 'knockdown' : 'hurt', { move: kind });
    return raw;
  }

  _pushed(dist, fromFighter){
    let dx = this.u.x - fromFighter.u.x, dy = this.u.y - fromFighter.u.y;
    let d = Math.hypot(dx, dy);
    if(d < 0.01){ dx = -(fromFighter.u.facing?.x ?? 1); dy = -(fromFighter.u.facing?.y ?? 0); d = 1; }
    this.u.x += (dx / d) * dist * 0.5;
    this.u.y += (dy / d) * dist * 0.5;
  }

  // ── IA du combattant (adversaire) ──────────────────────────
  /**
   * Une IA de jeu de combat : elle gère la distance, attaque quand elle
   * est à portée, garde quand elle voit partir un coup, et esquive de
   * temps en temps. `skill` (0 à 1) règle sa réactivité.
   */
  think(dt){
    if(this.isPlayer || this.u.dead) return;
    const f = this.foe, u = this.u;
    // Garde-fou : une ruée peut déposer l'adversaire exactement sur soi.
    // Sans ce plancher, toutes les divisions par la distance partaient en NaN
    // et les deux combattants disparaissaient de la carte.
    const dist = Math.max(1, Math.hypot(f.x - u.x, f.y - u.y));
    const enemyStriking = this.sim.fighterOf(f)?.phase === 'startup';

    // Réaction : garder quand le coup adverse part, avec un temps de
    // réaction d'autant plus court que le niveau est élevé.
    if(enemyStriking && dist < 150){
      if(Math.random() < 0.03 + this.skill * 0.22){ this.setBlock(true); return; }
      if(Math.random() < this.skill * 0.12){ this.dodge(); return; }
    } else if(this.blocking && Math.random() < 0.25){
      this.setBlock(false);
    }

    if(this.busy || this.blocking) return;

    // Déplacement : l'IA cherche sa distance de frappe, avec un peu de
    // pas chassé pour ne pas foncer en ligne droite comme un sbire.
    const want = MOVES.light.reach * 0.8;
    const spd = (u.ms || 320) * dt;
    if(dist > want){
      const k = Math.min(1, (dist - want) / 60);
      u.x += ((f.x - u.x) / dist) * spd * k;
      u.y += ((f.y - u.y) / dist) * spd * k;
    } else if(dist < want * 0.62){
      u.x -= ((f.x - u.x) / dist) * spd * 0.6;
      u.y -= ((f.y - u.y) / dist) * spd * 0.6;
    }
    this._strafe = (this._strafe || 0) - dt;
    if(this._strafe <= 0){ this._strafe = 0.8 + Math.random() * 1.4; this._side = Math.random() < 0.5 ? 1 : -1; }
    if(dist < 260){
      u.x += (-(f.y - u.y) / dist) * spd * 0.45 * (this._side || 1);
      u.y += ((f.x - u.x) / dist) * spd * 0.45 * (this._side || 1);
    }

    this._aiNext -= dt;
    if(this._aiNext > 0) return;
    this._aiNext = 0.22 + Math.random() * (0.75 - this.skill * 0.3);

    if(dist <= MOVES.light.reach * 0.92){
      // À portée : enchaîner, avec une préférence pour finir au lourd.
      this.strike(Math.random() < 0.28 + this.skill * 0.2 ? 'heavy' : 'light');
    } else if(dist < 260 && Math.random() < 0.25 + this.skill * 0.25){
      this.dodge(f.x - u.x, f.y - u.y);   // pas chassé vers l'adversaire
    }
  }
}
