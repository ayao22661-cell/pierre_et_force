// ============================================================
// RENDERER — coeur PixiJS : application, hiérarchie de calques,
// caméra. Tout le reste du moteur vient se brancher dessus.
// ============================================================

export class Renderer{
  /**
   * @param {HTMLElement} mount - élément dans lequel injecter le canvas
   */
  constructor(mount){
    this.mount = mount;
    this.app = new PIXI.Application();
    this.ready = this.app.init({
      resizeTo: mount,
      antialias: true,
      backgroundAlpha: 1,
      background: '#050508',
      preference: 'webgl',
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    }).then(() => this._build());
  }

  _build(){
    this.mount.appendChild(this.app.canvas);

    // Racine du monde — c'est elle qui bouge avec la caméra (pan + zoom).
    this.world = new PIXI.Container();
    this.app.stage.addChild(this.world);

    // Hiérarchie de calques, du sol vers le HUD dans-le-monde.
    this.layers = {
      ground:    new PIXI.Container(),  // tuiles de terrain
      decor:     new PIXI.Container(),  // buissons, props, rivière
      shadows:   new PIXI.Container(),  // ombres portées des unités
      ground2:   new PIXI.Container(),  // zones de sort au sol, indicateurs
      units:     new PIXI.Container(),  // corps des unités
      glow:      new PIXI.Container(),  // halos additifs des unités
      projectiles: new PIXI.Container(),
      fx:        new PIXI.Container(),  // impacts, particules
      floatText: new PIXI.Container(),  // texte de dégâts flottant
      overlay:   new PIXI.Container(),  // barres de vie monde, noms
    };
    for(const k in this.layers) this.world.addChild(this.layers[k]);

    this.layers.units.sortableChildren = true;
    this.layers.glow.blendMode = 'add';

    this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
    this.worldSize = { w: 3000, h: 1700 };

    this._frameListeners = [];
    this.app.ticker.add((ticker) => this._onTick(ticker));
    this._resizeObserver = new ResizeObserver(() => this._applyZoom());
    this._resizeObserver.observe(this.mount);
    this._applyZoom();
  }

  _applyZoom(){
    if(!this.app.renderer) return;
    const vw = this.app.screen.width, vh = this.app.screen.height;
    // Zoom de base tel qu'une portion confortable de la carte soit visible.
    const targetView = 1000;
    this.camera.baseZoom = Math.min(vw, vh) / targetView;
  }

  _onTick(ticker){
    const dt = Math.min(ticker.deltaMS / 1000, 0.1);
    for(const fn of this._frameListeners) fn(dt);
    this._applyCameraTransform();
  }

  /** Centre la caméra sur un point du monde (en général le joueur), bornée aux limites de la carte. */
  focusOn(x, y){
    this.camera.x += (x - this.camera.x) * 0.12;
    this.camera.y += (y - this.camera.y) * 0.12;
    this._clampCamera();
  }

  setFocusImmediate(x, y){
    this.camera.x = x; this.camera.y = y;
    this._clampCamera();
  }

  _clampCamera(){
    if(!this.app?.renderer) return;
    const z = (this.camera.baseZoom || 1) * (this.camera.zoom || 1);
    const vw = this.app.screen.width, vh = this.app.screen.height;
    const halfW = (vw/2) / z, halfH = (vh/2) / z;
    const { w, h } = this.worldSize;
    this.camera.x = clampAxis(this.camera.x, halfW, w);
    this.camera.y = clampAxis(this.camera.y, halfH, h);
  }

  _applyCameraTransform(){
    if(!this.app.renderer) return;
    const z = (this.camera.baseZoom || 1) * (this.camera.zoom || 1);
    const vw = this.app.screen.width, vh = this.app.screen.height;
    this.world.scale.set(z);
    this.world.x = vw/2 - this.camera.x * z;
    this.world.y = vh/2 - this.camera.y * z;
  }

  /** Abonne une fonction appelée à chaque frame avec le delta-temps (s). */
  addFrameListener(fn){ this._frameListeners.push(fn); }
  removeFrameListener(fn){
    const i = this._frameListeners.indexOf(fn);
    if(i >= 0) this._frameListeners.splice(i, 1);
  }

  worldToScreen(x, y){
    const z = (this.camera.baseZoom || 1) * (this.camera.zoom || 1);
    return {
      x: this.world.x + x * z,
      y: this.world.y + y * z,
    };
  }

  destroy(){
    this._resizeObserver?.disconnect();
    this.app.destroy(true, { children: true, texture: true });
  }
}

/** Borne une coordonnée de caméra pour que le demi-viewport reste dans [0, size]. */
function clampAxis(v, halfView, size){
  if(halfView * 2 >= size) return size / 2; // la carte est plus petite que l'écran : centrer
  return Math.min(Math.max(v, halfView), size - halfView);
}
