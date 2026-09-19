// ============================================================
// MINIMAP — canvas 2D léger superposé au HUD, mis à jour chaque frame.
// Affiche : joueur (blanc), alliés (vert), ennemis (rouge),
// sbires (bleu/rouge pâle), structures (nexus/tour).
// ============================================================

export class Minimap {
  /**
   * @param {HTMLElement} container — .hud-minimap déjà dans le DOM
   * @param {{ w:number, h:number }} worldSize
   */
  constructor(container, worldSize) {
    this.W = worldSize.w;
    this.H = worldSize.h;

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

    for (const u of units) {
      if (u.dead) continue;
      let color, r;
      if (u.kind === 'nexus') {
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
