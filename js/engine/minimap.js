// ============================================================
// MINIMAP — canvas 2D léger superposé au HUD, mis à jour chaque frame.
// Affiche : joueur (blanc), alliés (vert), ennemis (rouge),
// sbires (bleu/rouge pâle), structures (autel/tour).
// ============================================================

export class Minimap {
  /**
   * @param {HTMLElement} container — .hud-minimap déjà dans le DOM
   * @param {{ w:number, h:number }} worldSize
   * @param {{ path?: {x,y}[], structures?: Unit[] }} [opts] — fond schématique optionnel
   */
  constructor(container, worldSize, opts = {}) {
    this.W = worldSize.w;
    this.H = worldSize.h;
    this.path = opts.path || null;          // waypoints de la lane (mode Siège/Défense)
    this.staticStructures = opts.structures || []; // tours/autel pour fond figé

    this.canvas = document.createElement('canvas');
    this.canvas.width  = container.clientWidth  || 130;
    this.canvas.height = container.clientHeight || 84;
    this.canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:4px;';
    container.innerHTML = '';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }

  /** Appelé chaque frame avec la liste des unités de la sim. */
  update(units, playerUnit) {
    const { canvas, ctx, W, H } = this;
    const cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    // Fond sombre
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(0, 0, cw, ch);

    const tx = x => (x / W) * cw;
    const ty = y => (y / H) * ch;

    // ── Fond schématique : lane + points fixes ───────────────────────────────
    if(this.path && this.path.length > 1){
      // Trait de lane
      ctx.beginPath();
      ctx.moveTo(tx(this.path[0].x), ty(this.path[0].y));
      for(const p of this.path) ctx.lineTo(tx(p.x), ty(p.y));
      ctx.strokeStyle = 'rgba(160,130,80,.45)';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.lineWidth = 1;

      // Points d'autel/structures (passés à la construction ou lus des unités live)
      const structures = this.staticStructures.length ? this.staticStructures
        : units.filter(u => u.kind === 'autel' || u.kind === 'tower');
      for(const s of structures){
        const color = s.team === 0 ? 'rgba(90,169,255,.5)' : 'rgba(255,100,80,.5)';
        const size  = s.kind === 'autel' ? 5 : 3;
        ctx.fillStyle = color;
        ctx.fillRect(tx(s.x) - size/2, ty(s.y) - size/2, size, size);
      }
    }

    for (const u of units) {
      if (u.dead) continue;
      let color, r;
      if (u.kind === 'autel') {
        color = u.team === 0 ? '#5aa9ff' : '#ff6a5a';
        r = 5;
      } else if (u.kind === 'tower') {
        color = u.team === 0 ? '#3a7fff' : '#cc4422';
        r = 3;
      } else if (u.kind === 'minion') {
        color = u.team === 0 ? 'rgba(90,169,255,.7)' : 'rgba(255,106,90,.7)';
        r = 2;
      } else if (u === playerUnit) {
        color = '#ffffff';
        r = 4;
      } else if (u.team === 0) {
        color = '#7dffb0';
        r = 3;
      } else {
        color = '#ff6a5a';
        r = 3;
      }
      ctx.beginPath();
      ctx.arc(tx(u.x), ty(u.y), r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Anneau blanc pour le joueur
      if (u === playerUnit) {
        ctx.beginPath();
        ctx.arc(tx(u.x), ty(u.y), 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  destroy() {
    this.canvas.remove();
  }
}
