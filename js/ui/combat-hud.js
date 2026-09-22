// ============================================================
// COMBAT HUD — superposition DOM au-dessus du canvas PixiJS.
// Construite une fois par match, détruite à la fin.
// ============================================================
import { CHAMPS } from '../data/champions.js';
import { spellRank, maxSpellRank } from '../game/state.js';
import { iconSvg, iconForAbility } from './icons.js';
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
      const sim = this.match.sim;
      this.minimap = new Minimap(
        miniEl,
        { w: renderer.worldSize?.w || 2200, h: renderer.worldSize?.h || 1500 },
        { path: sim.path || null }  // fond schématique lane en mode Siège/Défense
      );
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
    // Portrait recadré sur le visage : les images sont en pied (480×600),
    // affichées telles quelles elles couvraient la moitié de l'écran.
    const face = el('div', 'hud-face');
    face.style.setProperty('--accent', d.fx);
    const portrait = el('img', '');
    portrait.src = portraitFor(this.match.sim.player.key);
    portrait.alt = d.name;
    face.appendChild(portrait);
    left.appendChild(face);

    const bars = el('div', 'hud-bars');
    bars.appendChild(this._bar('hp', 'pf-bar-hp'));
    bars.appendChild(this._bar('mp', 'pf-bar-mana'));
    left.appendChild(bars);

    // Bonus objets/talents : résumé compact sous les barres
    const bns = this.match?.sim?.player?.bns;
    if(bns && (bns.atk || bns.hp || bns.arm || bns.crit || bns.ls || bns.regen)){
      const bonusRow = el('div', 'hud-bonus-row');
      if(bns.atk)   bonusRow.appendChild(el('span','hud-bonus-chip',iconSvg('sword') + `+${Math.round(bns.atk)}`));
      if(bns.hp)    bonusRow.appendChild(el('span','hud-bonus-chip',iconSvg('heart') + `+${Math.round(bns.hp)}`));
      if(bns.arm)   bonusRow.appendChild(el('span','hud-bonus-chip',iconSvg('shield') + `+${Math.round(bns.arm)}`));
      if(bns.crit)  bonusRow.appendChild(el('span','hud-bonus-chip',iconSvg('target') + `${Math.round(bns.crit*100)}%`));
      if(bns.ls)    bonusRow.appendChild(el('span','hud-bonus-chip',iconSvg('drop') + `${Math.round(bns.ls*100)}%`));
      if(bns.regen + (bns.regenF||0) > 0) bonusRow.appendChild(el('span','hud-bonus-chip',iconSvg('leaf') + `+${Math.round(bns.regen+(bns.regenF||0))}/s`));
      if(bonusRow.children.length) left.appendChild(bonusRow);
    }
    bottom.appendChild(left);

    // Sorts — jouables au tap (mobile) ou au clic (desktop), en plus des
    // touches A/Z/E/R gérées directement par Match.
    const spells = el('div', 'hud-spells');
    this.spellEls = [];
    const save = this.match.sim.cfg?.save;
    const champKey = this.match.sim.player.key;
    (d.abil || []).forEach((a, i) => {
      // Icône façon MOBA : pictogramme de mécanique + disque de recharge
      // radial (balayage conique) + pastilles de rang + coût en mana.
      // Remplace l'ancien slot qui n'affichait qu'une lettre nue.
      const slot = el('div', 'spell-slot' + (a.ult ? ' ult' : ''));
      slot.title = a.name;
      slot.appendChild(el('div', 'spell-ico', iconSvg(iconForAbility(a), 'pf-ico-lg')));
      const sweep = el('div', 'spell-slot-sweep');
      slot.appendChild(sweep);
      const cd = el('div', 'spell-slot-cd');
      slot.appendChild(cd);
      slot.appendChild(el('span', 'key', KEYS[i] || ''));
      if(a.cost) slot.appendChild(el('span', 'spell-slot-cost', String(a.cost)));
      const max = maxSpellRank(champKey, i);
      const pips = el('div', 'spell-slot-pips');
      for(let r = 0; r < max; r++) pips.appendChild(el('span', 'spell-pip'));
      slot.appendChild(pips);
      slot.addEventListener('click', () => this.match.castSlot(i));
      spells.appendChild(slot);
      this.spellEls.push({ el: slot, cdEl: cd, sweepEl: sweep, pipsEl: pips, cost: a.cost || 0, maxRank: max, slot: i });
    });
    this._refreshPips(save, champKey);
    // Coup de base : une frappe au corps à corps déclenchée à la main,
    // à côté des sorts. Le personnage frappe même sans cible à portée,
    // pour que le joueur sente le coup partir.
    const basic = el('div', 'spell-slot basic-slot');
    basic.appendChild(el('div', 'spell-ico', iconSvg('fist', 'pf-ico-lg')));
    basic.title = 'Coup de base (Espace)';
    // Le glyphe U+23B5 (⎵) ne s'affiche pas proprement dans toutes les
    // polices/systèmes (rendu cassé/quasi invisible) — texte simple à la
    // place, cohérent avec les badges A/Z/E/R à côté.
    basic.appendChild(el('span', 'key key-wide', 'ESP'));
    const fire = (ev) => { ev.preventDefault(); if(!this.match.paused) this.match.basicAttack(); };
    basic.addEventListener('click', fire);
    basic.addEventListener('touchstart', fire, { passive: false });
    this.basicEl = basic;

    // Deux rangées de boutons (poing au-dessus, sorts en dessous), toutes
    // deux alignées à droite et capables de revenir à la ligne (voir
    // .hud-actions/.hud-basic-row/.hud-spells dans hud.css) : plus aucun
    // bouton ne peut sortir de l'écran, même sur petit téléphone.
    const actions = el('div', 'hud-actions');
    const basicRow = el('div', 'hud-basic-row');
    basicRow.appendChild(basic);
    actions.appendChild(basicRow);
    actions.appendChild(spells);
    bottom.appendChild(actions);

    // Pause en haut à gauche (comme sur les MOBA mobiles) : en bas, elle
    // se retrouvait coincée contre les sorts et sortait de l'écran sur
    // petit téléphone.
    const pause = el('button', 'hud-pause-btn', iconSvg('pause'));
    pause.type = 'button';
    pause.setAttribute('aria-label', 'Pause');
    pause.addEventListener('click', () => this.togglePause());
    this.root.appendChild(pause);

    // Menu de pause : reprendre ou quitter la mission (sans défaite enregistrée).
    this.onQuit = onPause;
    const menu = el('div', 'hud-pause-menu hidden');
    menu.appendChild(el('div', 'hud-pause-title', 'Pause'));
    const resume = el('button', 'pf-btn pf-btn-brand', 'Reprendre');
    resume.addEventListener('click', () => this.togglePause(false));
    const quit = el('button', 'pf-btn pf-btn-ghost', 'Quitter la mission');
    quit.addEventListener('click', () => { this.togglePause(false); this.onQuit?.(); });
    menu.appendChild(resume); menu.appendChild(quit);
    this.root.appendChild(menu);
    this.pauseMenu = menu;

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

  /** Colore les pastilles de rang selon le niveau actuel du sort (0 = aucune remplie). */
  _refreshPips(save, champKey){
    if(!save) return;
    (this.spellEls || []).forEach(s => {
      const rank = spellRank(save, champKey, s.slot);
      [...s.pipsEl.children].forEach((pip, i) => pip.classList.toggle('filled', i < rank));
    });
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

  /** Affiche la barre de PV du boss en haut au centre (mode Boss). */
  showBossBar(boss){
    if(this._bossBarEl) return; // déjà créé
    const bar = el('div', 'pf-panel hud-boss-bar');
    const label = el('div', 'hud-boss-name', boss.name.toUpperCase());
    const track = el('div', 'pf-bar pf-bar-boss');
    const fill = el('div', 'pf-bar-fill');
    fill.id = 'hud-boss-fill';
    track.appendChild(fill);
    bar.appendChild(label);
    bar.appendChild(track);
    this.root.insertBefore(bar, this.root.firstChild);
    this._bossBarEl = bar;
    this._bossUnit = boss;
  }

  /** Met à jour la largeur de la barre de boss. */
  updateBossBar(boss){
    const fill = document.getElementById('hud-boss-fill');
    if(!fill) return;
    const pct = Math.max(0, boss.hp / boss.maxHp);
    fill.style.transform = `scaleX(${pct})`;
    // Changement de couleur progressif
    fill.style.background = pct > 0.5 ? '#e05a20' : pct > 0.25 ? '#ff3a3a' : '#ff0000';
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
      const baseCd = Array.isArray(p.d?.abil?.[i]?.cd) ? p.d.abil[i].cd[0] : (p.d?.abil?.[i]?.cd || 1);
      const affordable = p.mana >= s.cost;
      s.el.classList.toggle('cooling', cd > 0.05);
      s.el.classList.toggle('no-mana', cd <= 0.05 && !affordable);
      s.cdEl.textContent = cd > 0.05 ? Math.ceil(cd) : '';
      // Balayage conique : la portion « grisée » représente le temps
      // restant, exactement comme le disque de recharge d'un MOBA.
      const frac = cd > 0.05 ? Math.max(0, Math.min(1, cd / (baseCd || 1))) : 0;
      s.sweepEl.style.setProperty('--cd-frac', frac.toFixed(3));
    });
  }

  togglePause(force){
    const on = force === undefined ? !this.match.paused : !!force;
    this.match.setPaused(on);
    this.pauseMenu?.classList.toggle('hidden', !on);
  }

  destroy(){
    if(this.match?.paused) this.match.setPaused(false);
    this.renderer.removeFrameListener(this._tickFn);
    this._joyCleanup?.();
    this.minimap?.destroy();
    this.root.innerHTML = '';
  }
}
