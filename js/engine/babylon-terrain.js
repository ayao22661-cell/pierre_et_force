// ============================================================
// BABYLON TERRAIN — sol de combat en 3D (relief léger, matériau
// procédural tileable, voie et bosquets en volume), pour remplacer
// le tapis de tuiles plat PixiJS. Utilise le même `layout` (siège/
// arène, chemin, bosquets) que l'ancien tilemap.js : aucune donnée
// de niveau à refaire, seul le moteur de rendu du sol change.
//
// Partage la scène Babylon de BabylonUnits (passée en paramètre) afin
// que personnages et terrain reçoivent la même lumière et s'affichent
// dans le même espace 3D, sans double moteur ni désynchronisation.
// ============================================================

const WORLD_SCALE = 45; // doit rester identique à celui de babylon-units.js

function hexToColor3(hex){
  const n = parseInt((hex || '#808080').replace('#',''), 16);
  return new BABYLON.Color3(((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255);
}

/** Bruit de hauteur simple, sans dépendance externe, pour un relief doux et non-répétitif. */
function heightNoise(x, z, seed){
  const s = Math.sin(x*0.015 + seed) * Math.cos(z*0.017 + seed*1.3);
  const s2 = Math.sin(x*0.04 - seed*0.7) * Math.cos(z*0.035 + seed);
  return s*0.65 + s2*0.35;
}

/** Texture de sol tileable générée en Canvas2D (herbe/terre avec grain), convertie en DynamicTexture Babylon. */
function makeGroundTexture(scene, hexA, hexB, seed){
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = hexA;
  ctx.fillRect(0, 0, size, size);
  let s = seed >>> 0 || 1;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  for(let i = 0; i < 3000; i++){
    const x = rnd()*size, y = rnd()*size, r = rnd()*3 + 0.6;
    ctx.globalAlpha = rnd()*0.10 + 0.03;
    ctx.fillStyle = rnd() > 0.5 ? hexB : '#000000';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new BABYLON.DynamicTexture('groundtex' + seed, { width: size, height: size }, scene, true);
  tex.getContext().drawImage(cv, 0, 0);
  tex.update();
  return tex;
}

export class BabylonTerrain{
  /**
   * @param {BABYLON.Scene} scene - la scène partagée avec BabylonUnits
   * @param {object} theme - mêmes clés que THEME_DEFAULT dans match.js (g1,g2,lane,acc,wall)
   * @param {object} layout - retour de siegeLayout()/arenaLayout() (w,h,path,brush,camps)
   * @param {number} seed
   */
  constructor(scene, theme, layout, seed = 0){
    this.scene = scene;
    this.theme = theme;
    this.layout = layout;
    this.root = new BABYLON.TransformNode('terrainRoot', scene);
    console.log('[BabylonTerrain] construction — layout w=', layout.w, 'h=', layout.h, '| meshes scène avant=', scene.meshes.length);
    this._buildGround(seed);
    this._buildLane();
    this._buildBrush();
    this._buildWalls();
    console.log('[BabylonTerrain] ✅ terminé — meshes scène après=', scene.meshes.length,
      '| sol position=', this.ground.position.asArray().map(n=>n.toFixed(2)),
      '| sol dimensions(w,h)=', (layout.w/WORLD_SCALE).toFixed(1), (layout.h/WORLD_SCALE).toFixed(1));
  }

  _toBabylon(x, y){ return { x: x / WORLD_SCALE, z: -y / WORLD_SCALE }; }

  _buildGround(seed){
    const { w, h } = this.layout;
    const bx = w / WORLD_SCALE, bz = h / WORLD_SCALE;
    const subdivisions = 48; // suffisant pour un relief doux sans coût excessif

    const ground = BABYLON.MeshBuilder.CreateGround('ground', {
      width: bx, height: bz, subdivisions, updatable: true,
    }, this.scene);
    ground.parent = this.root;
    // Le sol Pixi avait son origine en (0,0) coin haut-gauche ; ici on
    // centre le plan puis on le décale pour garder la même correspondance
    // de coordonnées que _pixiToBabylon (x/SCALE, -y/SCALE).
    ground.position.set(bx/2, 0, -bz/2);

    // Relief doux via un déplacement vertical des vertices (déterministe).
    const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    for(let i = 0; i < positions.length; i += 3){
      const localX = positions[i], localZ = positions[i+2];
      const worldX = localX + bx/2, worldZ = -(localZ - bz/2);
      positions[i+1] = heightNoise(worldX, worldZ, seed) * 0.55;
    }
    ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    ground.createNormals(true);

    const mat = new BABYLON.StandardMaterial('groundMat', this.scene);
    const tex = makeGroundTexture(this.scene, this.theme.g1, this.theme.g2, seed + 7);
    tex.uScale = bx / 3.2; tex.vScale = bz / 3.2; // tiling : la texture se répète sur toute la carte
    mat.diffuseTexture = tex;
    mat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    ground.material = mat;
    ground.receiveShadows = true;
    this.ground = ground;
  }

  _buildLane(){
    const path = this.layout.path;
    if(!path || path.length < 2) return;
    const laneWidth = (this.layout.laneWidth || 210) / WORLD_SCALE;

    const points = path.map(p => {
      const b = this._toBabylon(p.x, p.y);
      return new BABYLON.Vector3(b.x, 0.03, b.z); // légèrement au-dessus du sol pour éviter le z-fighting
    });
    const ribbon = BABYLON.MeshBuilder.CreateRibbon('lane', {
      pathArray: [
        points.map(p => p.add(new BABYLON.Vector3(0, 0, -laneWidth/2))),
        points.map(p => p.add(new BABYLON.Vector3(0, 0,  laneWidth/2))),
      ],
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    }, this.scene);
    ribbon.parent = this.root;
    const mat = new BABYLON.StandardMaterial('laneMat', this.scene);
    mat.diffuseColor = hexToColor3(this.theme.lane);
    mat.alpha = 0.92;
    mat.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02);
    ribbon.material = mat;
  }

  _buildBrush(){
    for(const b of (this.layout.brush || [])){
      const pos = this._toBabylon(b.x, b.y);
      const r = b.r / WORLD_SCALE;
      // Bosquet bas-poly : quelques cônes irréguliers groupés, plutôt
      // qu'un cercle plat semi-transparent.
      const group = new BABYLON.TransformNode('brush', this.scene);
      group.parent = this.root;
      group.position.set(pos.x, 0, pos.z);
      const n = 4 + Math.floor((b.r || 90) / 40);
      for(let i = 0; i < n; i++){
        const a = (i / n) * Math.PI * 2 + (i * 0.7);
        const dist = r * (0.25 + 0.5 * ((i * 37) % 10) / 10);
        const bushR = r * (0.35 + 0.25 * ((i * 53) % 7) / 7);
        const cone = BABYLON.MeshBuilder.CreateCylinder('bush', {
          diameterTop: 0, diameterBottom: bushR * 2, height: bushR * 1.6, tessellation: 6,
        }, this.scene);
        cone.parent = group;
        cone.position.set(Math.cos(a) * dist, bushR * 0.8, Math.sin(a) * dist);
        const mat = new BABYLON.StandardMaterial('bushMat', this.scene);
        mat.diffuseColor = hexToColor3(this.theme.g2).scale(0.6);
        cone.material = mat;
      }
    }
    for(const c of (this.layout.camps || [])){
      const pos = this._toBabylon(c.x, c.y);
      const ring = BABYLON.MeshBuilder.CreateTorus('camp', { diameter: 46/WORLD_SCALE*2, thickness: 0.06 }, this.scene);
      ring.parent = this.root;
      ring.position.set(pos.x, 0.05, pos.z);
      const mat = new BABYLON.StandardMaterial('campMat', this.scene);
      mat.emissiveColor = hexToColor3(this.theme.acc).scale(0.5);
      ring.material = mat;
    }
  }

  _buildWalls(){
    const { w, h } = this.layout;
    const bx = w / WORLD_SCALE, bz = h / WORLD_SCALE;
    const t = 60 / WORLD_SCALE;
    const mat = new BABYLON.StandardMaterial('wallMat', this.scene);
    mat.diffuseColor = hexToColor3(this.theme.wall);

    const specs = [
      { w: bx + t*2, h: t, x: bx/2, z: t/2 },
      { w: bx + t*2, h: t, x: bx/2, z: -bz - t/2 },
      { w: t, h: bz + t*2, x: -t/2, z: -bz/2 },
      { w: t, h: bz + t*2, x: bx + t/2, z: -bz/2 },
    ];
    for(const s of specs){
      const wall = BABYLON.MeshBuilder.CreateBox('wall', { width: s.w, height: 0.5, depth: s.h }, this.scene);
      wall.parent = this.root;
      wall.position.set(s.x, 0.25, s.z);
      wall.material = mat;
    }
  }

  destroy(){
    this.root.dispose(false, true); // détruit aussi les meshes/matériaux enfants
  }
}
