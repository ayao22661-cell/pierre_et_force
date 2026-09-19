// ============================================================
// COMBAT HUD — superposition DOM au-dessus du canvas PixiJS.
// Construite une fois par match, détruite à la fin.
// ============================================================
import { CHAMPS } from '../data/champions.js';
import { portraitFor } from '../engine/portraits.js';
import { el } from './screens.js';
import { Minimap } from '../engine/minimap.js';

const KEYS = ['A', 'Z', 'E', 'R'];

export class CombatHud{
  constructor(renderer, match, onPause){
    this.renderer = renderer;
    this.match = match;
    this.root = document.getElementById('game-hud');
    this.root.innerHTML = '';
    this._build(onPause);
    const miniEl = this.root.querySelector('.hud-minimap');
    if (miniEl && this.match.sim) {
      this.minimap = new Minimap(miniEl, { w: renderer.worldSize?.w || 2200, h: renderer.worldSize?.h || 1500 });
    }
    this._tickFn = (dt) => this._update(dt);
    renderer.addFrameListener(this._tickFn);
  }

  _build(onPause){
    const d = CHAMPS[this.match.sim.player.key];

    // Barre d'objectif + minuteur
    const top = el('div', 'hud-top');
    const obj = el('div', 'pf-panel hud-objective');
    obj.id = 'hud-objective-text';
    obj.textContent = 'Objectif';
    top.appendChild(obj);
    this.root.appendChild(top);
    this.objEl = obj;

    // Minimap simplifiée (statique pour l'instant)
    const mini = el('div', 'pf-panel hud-minimap');
    this.root.appendChild(mini);

    // Bas gauche : portrait + barres
    const bottom = el('div', 'hud-bottom');
    const left = el('div', 'pf-panel hud-portrait');
    const portrait = el('img', 'pf-portrait-img');
    portrait.src = portraitFor(this.match.sim.player.key);
    portrait.alt = d.name;
    portrait.style.setProperty('--accent', d.fx);
    left.appendChild(portrait);

    const bars = el('div', 'hud-bars');
    bars.appendChild(this._bar('hp', 'pf-bar-hp'));
    bars.appendChild(this._bar('mp', 'pf-bar-mana'));
    left.appendChild(bars);

    // Bonus objets/talents : résumé compact sous les barres
    const bns = this.match?.sim?.player?.bns;
    if(bns && (bns.atk || bns.hp || bns.arm || bns.crit || bns.ls || bns.regen)){
      const bonusRow = el('div', 'hud-bonus-row');
      if(bns.atk)   bonusRow.appendChild(el('span','hud-bonus-chip',`⚔+${Math.round(bns.atk)}`));
      if(bns.hp)    bonusRow.appendChild(el('span','hud-bonus-chip',`❤+${Math.round(bns.hp)}`));
      if(bns.arm)   bonusRow.appendChild(el('span','hud-bonus-chip',`🛡+${Math.round(bns.arm)}`));
      if(bns.crit)  bonusRow.appendChild(el('span','hud-bonus-chip',`🎯${Math.round(bns.crit*100)}%`));
      if(bns.ls)    bonusRow.appendChild(el('span','hud-bonus-chip',`🩸${Math.round(bns.ls*100)}%`));
      if(bns.regen + (bns.regenF||0) > 0) bonusRow.appendChild(el('span','hud-bonus-chip',`💚+${Math.round(bns.regen+(bns.regenF||0))}/s`));
      if(bonusRow.children.length) left.appendChild(bonusRow);
    }
    bottom.appendChild(left);

    // Sorts — jouables au tap (mobile) ou au clic (desktop), en plus des
    // touches A/Z/E/R gérées directement par Match.
    const spells = el('div', 'hud-spells');
    this.spellEls = [];
    (d.abil || []).forEach((a, i) => {
      const slot = el('div', 'spell-slot' + (a.ult ? ' ult' : ''), a.name[0]);
      slot.title = a.name;
      const cd = el('div', 'spell-slot-cd');
      slot.appendChild(cd);
      slot.appendChild(el('span', 'key', KEYS[i] || ''));
      slot.addEventListener('click', () => this.match.castSlot(i));
      spells.appendChild(slot);
      this.spellEls.push({ el: slot, cdEl: cd, cost: a.cost || 0 });
    });
    bottom.appendChild(spells);

    const pause = el('div', 'pf-panel hud-pause-btn', '❚❚');
    pause.addEventListener('click', onPause);
    bottom.appendChild(pause);

    this.root.appendChild(bottom);

    // Bannière d'annonce
    this.banner = el('div', 'hud-banner');
    this.root.appendChild(this.banner);

    this._buildJoystick();

    this.match.onHud = (data) => this._onHudData(data);
  }

  /**
   * Joystick tactile — seule source de mouvement sur les appareils sans
   * clavier. Utilise les Pointer Events pour marcher au doigt comme à la
   * souris (pratique pour tester au clic sur desktop aussi).
   */
  _buildJoystick(){
    const zone = el('div', 'hud-joyzone');
    const joy = el('div', 'hud-joy');
    const knob = el('div', 'hud-joy-knob');
    joy.appendChild(knob);
    zone.appendChild(joy);
    this.root.appendChild(zone);

    const MAX_R = 44;
    let activeId = null, cx = 0, cy = 0;

    const setVec = (dx, dy) => {
      this.match.touchVec.x = dx; this.match.touchVec.y = dy;
    };

    const start = (e) => {
      if(activeId !== null) return; // un seul doigt pilote le déplacement
      activeId = e.pointerId;
      const r = zone.getBoundingClientRect();
      cx = e.clientX; cy = e.clientY;
      joy.style.left = (cx - r.left - 48) + 'px';
      joy.style.top = (cy - r.top - 48) + 'px';
      joy.classList.add('on');
      knob.style.transform = 'translate(0px, 0px)';
      zone.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if(e.pointerId !== activeId) return;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const d = Math.hypot(dx, dy);
      if(d > MAX_R){ dx = dx / d * MAX_R; dy = dy / d * MAX_R; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      setVec(dx / MAX_R, dy / MAX_R);
    };
    const end = (e) => {
      if(e.pointerId !== activeId) return;
      activeId = null;
      joy.classList.remove('on');
      setVec(0, 0);
    };

    zone.addEventListener('pointerdown', start);
    zone.addEventListener('pointermove', move);
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    this._joyCleanup = () => {
      zone.removeEventListener('pointerdown', start);
      zone.removeEventListener('pointermove', move);
      zone.removeEventListener('pointerup', end);
      zone.removeEventListener('pointercancel', end);
    };
  }

  _bar(kind, cls){
    const wrap = el('div', '');
    const row = el('div', 'pf-label-row');
    row.innerHTML = `<span>${kind === 'hp' ? 'PV' : 'Mana'}</span><span id="hud-${kind}-txt"></span>`;
    wrap.appendChild(row);
    const bar = el('div', 'pf-bar ' + cls);
    const fill = el('div', 'pf-bar-fill');
    fill.id = 'hud-' + kind + '-fill';
    bar.appendChild(fill);
    wrap.appendChild(bar);
    return wrap;
  }

  _onHudData(data){
    if(data.objective !== undefined && this.objEl) this.objEl.textContent = data.objective;
  }

  announce(text){
    this.banner.textContent = text;
    this.banner.classList.add('show');
    clearTimeout(this._bannerT);
    this._bannerT = setTimeout(() => this.banner.classList.remove('show'), 1800);
  }

  _update(dt){
    const p = this.match.sim.player;
    if(!p) return;
    const hpPct = Math.max(0, p.hp / p.maxHp);
    const mpPct = p.maxMana ? Math.max(0, p.mana / p.maxMana) : 0;
    const hpFill = document.getElementById('hud-hp-fill');
    const mpFill = document.getElementById('hud-mp-fill');
    if(hpFill) hpFill.style.transform = `scaleX(${hpPct})`;
    if(mpFill) mpFill.style.transform = `scaleX(${mpPct})`;
    const hpTxt = document.getElementById('hud-hp-txt');
    const mpTxt = document.getElementById('hud-mp-txt');
    if(hpTxt) hpTxt.textContent = `${Math.round(p.hp)} / ${Math.round(p.maxHp)}`;
    if(mpTxt) mpTxt.textContent = `${Math.round(p.mana)} / ${Math.round(p.maxMana)}`;

    if (this.minimap) this.minimap.update(this.match.sim.units, p);
    (this.spellEls || []).forEach((s, i) => {
      const cd = p.cds ? p.cds[i] : 0;
      const affordable = p.mana >= s.cost;
      s.el.classList.toggle('cooling', cd > 0.05);
      s.el.classList.toggle('no-mana', cd <= 0.05 && !affordable);
      s.cdEl.textContent = cd > 0.05 ? Math.ceil(cd) : '';
    });
  }

  destroy(){
    this.renderer.removeFrameListener(this._tickFn);
    this._joyCleanup?.();
    this.minimap?.destroy();
    this.root.innerHTML = '';
  }
}
