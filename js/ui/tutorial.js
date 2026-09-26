// ============================================================
// CONSEILS DE PRISE EN MAIN — pendant les premiers combats.
//
// Pas d'écran de tutoriel à lire : chaque conseil apparaît au moment où
// il sert (au début du combat, après le premier coup, quand les PV
// baissent…), une seule fois, puis disparaît dès que le joueur l'a mis
// en pratique. Les conseils déjà vus sont retenus sur l'appareil.
// ============================================================
import { el } from './screens.js';

const STORE = 'pf2_tips_v1';
const touch = () => window.matchMedia?.('(pointer: coarse)').matches;

function seen(){ try{ return new Set(JSON.parse(localStorage.getItem(STORE) || '[]')); }catch(e){ return new Set(); } }
function markSeen(id){ try{ const s = seen(); s.add(id); localStorage.setItem(STORE, JSON.stringify([...s])); }catch(e){} }

// Chaque conseil : quand il apparaît (show), quand il est réussi (done).
// `after` : il attend qu'un autre conseil soit passé.
const TIPS = [
  { id: 'move', modes: 'moba', show: (t) => t.time > 1.2,
    text: () => touch() ? "Pose ton pouce à gauche de l'écran et fais-le glisser pour te déplacer." : "Déplace-toi avec les flèches du clavier.",
    done: (t) => t.moved > 90 },
  { id: 'attack', modes: 'moba', after: 'move',
    text: () => touch() ? "Approche-toi d'un ennemi et touche le bouton rouge pour frapper." : "Approche-toi d'un ennemi et appuie sur Espace pour frapper.",
    done: (t) => t.hits > 0 },
  { id: 'spells', modes: 'moba', after: 'attack', show: (t) => t.hits > 1,
    text: () => touch() ? "Tes compétences sont en bas à droite. Elles coûtent du mana et se rechargent : utilise-les souvent." : "Tes compétences : A, Z, E et R. Elles coûtent du mana et se rechargent : utilise-les souvent.",
    done: (t) => t.casts > 0 },
  { id: 'lowhp', modes: 'all', show: (t) => t.hpPct < 0.35,
    text: () => "Tes PV sont bas. Recule un instant et laisse tes alliés prendre les coups.",
    done: (t) => t.hpPct > 0.6 },
  { id: 'duel', modes: 'duel', show: (t) => t.time > 1.5,
    text: () => touch() ? "Duel ! Bouton rouge : coup rapide. LOURD : coup puissant mais lent. Gagne deux manches." : "Duel ! Espace : coup rapide. K : coup lourd, puissant mais lent. Gagne deux manches.",
    done: (t) => t.hits > 1 },
  { id: 'duel-guard', modes: 'duel', after: 'duel', show: (t) => t.hurt > 0,
    text: () => touch() ? "GARDE bloque les coups. ESQUIVE les évite, au dernier moment c'est encore mieux." : "L (maintenu) : garde, pour bloquer. M : esquive, au dernier moment c'est encore mieux.",
    done: (t) => t.guards > 0 },
];

export class Tutorial{
  constructor(root, sim){
    this.sim = sim;
    this.duel = sim.mode === 'duel';
    this.seen = seen();
    this.todo = TIPS.filter(t => !this.seen.has(t.id) && (t.modes === 'all' || (t.modes === 'duel') === this.duel));
    this.state = { time: 0, moved: 0, hits: 0, casts: 0, hurt: 0, guards: 0, hpPct: 1 };
    this.cur = null; this.curT = 0;
    this._last = { x: sim.player.x, y: sim.player.y };
    if(!this.todo.length) return;
    this.box = el('div', 'hud-tip');
    root.appendChild(this.box);
  }

  /** Événements de la simulation utiles aux conseils. */
  event(e){
    if(!this.box) return;
    const p = this.sim.player;
    if(e.type === 'hit' && e.from === p && e.dmg > 0) this.state.hits++;
    else if(e.type === 'fight-impact' && e.from === p) this.state.hits++;
    else if(e.type === 'cast' && e.unit === p) this.state.casts++;
    else if(e.type === 'fight-impact' && e.to === p) this.state.hurt++;
    else if(e.type === 'fight' && e.unit === p && (e.kind === 'block-on' || e.kind === 'dodge')) this.state.guards++;
  }

  update(dt){
    if(!this.box) return;
    const s = this.state, p = this.sim.player;
    s.time += dt;
    s.moved += Math.hypot(p.x - this._last.x, p.y - this._last.y);
    this._last = { x: p.x, y: p.y };
    s.hpPct = p.maxHp ? p.hp / p.maxHp : 1;

    if(this.cur){
      this.curT += dt;
      // Réussi, ou affiché assez longtemps : on range le conseil.
      if(this.cur.done(s) || this.curT > 12){ this._hide(); }
      return;
    }
    const next = this.todo.find(t => (!t.after || this.seen.has(t.after)) && (!t.show || t.show(s)));
    if(next && !next.done(s)) this._show(next);
    else if(next) this._skip(next);
  }

  _show(t){
    this.cur = t; this.curT = 0;
    this.seen.add(t.id); markSeen(t.id);
    this.box.textContent = t.text();
    this.box.classList.add('show');
  }
  _skip(t){ this.seen.add(t.id); markSeen(t.id); this.todo = this.todo.filter(x => x !== t); }
  _hide(){
    this.todo = this.todo.filter(x => x !== this.cur);
    this.cur = null;
    this.box.classList.remove('show');
  }
}
