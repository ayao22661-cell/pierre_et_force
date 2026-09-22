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
const PROPS_BASE = 'assets/props/';

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
    this._buildLane(seed);
    this._buildBrush(seed);
    this._buildWalls();
    // Modèles de décor réels (rochers, buissons, coffre, brasero) —
    // chargés à part et de façon asynchrone : le terrain s'affiche tout
    // de suite avec son décor procédural, ces props détaillés viennent
    // l'enrichir dès qu'ils sont prêts, sans rien bloquer.
    this._scatterPropModels(seed).catch(e => console.error('[BabylonTerrain] ❌ échec décor 3D', e));
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
    ground.isPickable = false;
    ground.freezeWorldMatrix();
    mat.freeze();
    this.ground = ground;
  }

  _buildLane(seed = 0){
    const path = this.layout.path;
    if(!path || path.length < 2) return;
    const laneWidth = (this.layout.laneWidth || 210) / WORLD_SCALE;
    // La voie épouse le relief : posée à plat (y = 0.03), elle passait
    // SOUS le sol partout où le bruit de hauteur dépassait ce niveau,
    // d'où la route coupée net au milieu de l'écran. On rééchantillonne
    // le tracé finement et on lit la hauteur du sol à chaque bord.
    const groundY = (x, z) => heightNoise(x, -z, seed) * 0.55 + 0.1;
    const pts = path.map(p => { const b = this._toBabylon(p.x, p.y); return new BABYLON.Vector3(b.x, 0, b.z); });
    const dense = [];
    for(let i = 0; i < pts.length - 1; i++){
      const a = pts[i], b = pts[i + 1];
      const n = Math.max(1, Math.ceil(BABYLON.Vector3.Distance(a, b) / 0.5));
      for(let k = 0; k < n; k++) dense.push(BABYLON.Vector3.Lerp(a, b, k / n));
    }
    dense.push(pts[pts.length - 1]);
    const edge = (sign) => dense.map(p => {
      const q = p.add(new BABYLON.Vector3(0, 0, sign * laneWidth / 2));
      q.y = groundY(q.x, q.z);
      return q;
    });
    const ribbon = BABYLON.MeshBuilder.CreateRibbon('lane', {
      pathArray: [edge(-1), edge(1)],
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    }, this.scene);
    ribbon.parent = this.root;
    const mat = new BABYLON.StandardMaterial('laneMat', this.scene);
    mat.diffuseColor = hexToColor3(this.theme.lane);
    mat.alpha = 0.92;
    mat.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02);
    ribbon.material = mat;
  }

  /**
   * Bosquets, rochers, touffes d'herbe et arbres de bordure.
   *
   * Perf : tout est FUSIONNÉ en un seul mesh par matériau (MergeMeshes),
   * au lieu d'un mesh + un StandardMaterial par cône comme avant. Sur un
   * téléphone, les dizaines d'appels de rendu séparés coûtaient plus cher
   * que la géométrie elle-même. Les matrices et matériaux sont figés :
   * le décor ne bouge pas.
   */
  _buildBrush(seed){
    const { w, h } = this.layout;
    const bx = w / WORLD_SCALE, bz = h / WORLD_SCALE;
    let st = (seed >>> 0) || 7;
    const rnd = () => { st = (Math.imul(st, 1664525) + 1013904223) >>> 0; return st / 4294967296; };
    // Moins d'éléments sur petit écran : le décor reste fourni, le coût baisse.
    const small = Math.min(window.innerWidth || 1280, window.innerHeight || 800) < 500;
    // Hauteur du sol sous un point : sans ça, le décor flottait au-dessus
    // des creux et s'enfonçait dans les bosses du relief.
    const groundY = (x, z) => heightNoise(x, -z, seed) * 0.55;
    const parts = { foliage: [], trunk: [], rock: [], grass: [] };

    // ── Bosquets (positions du niveau) ───────────────────────────────
    for(const b of (this.layout.brush || [])){
      const pos = this._toBabylon(b.x, b.y);
      const r = b.r / WORLD_SCALE;
      const n = 4 + Math.floor((b.r || 90) / 40);
      for(let i = 0; i < n; i++){
        const a = (i / n) * Math.PI * 2 + (i * 0.7);
        const dist = r * (0.25 + 0.5 * ((i * 37) % 10) / 10);
        const bushR = r * (0.35 + 0.25 * ((i * 53) % 7) / 7);
        const cone = BABYLON.MeshBuilder.CreateCylinder('bush', {
          diameterTop: 0, diameterBottom: bushR * 2, height: bushR * 1.6, tessellation: 6,
        }, this.scene);
        const cx = pos.x + Math.cos(a) * dist, cz = pos.z + Math.sin(a) * dist;
        cone.position.set(cx, groundY(cx, cz) + bushR * 0.8, cz);
        parts.foliage.push(cone);
      }
    }

    // ── Rochers, herbes, arbres semés sur toute la carte ─────────────
    const onLane = (x, z) => {
      const path = this.layout.path || [];
      for(const p of path){
        const b = this._toBabylon(p.x, p.y);
        if(Math.hypot(b.x - x, b.z - z) < (this.layout.laneWidth || 210) / WORLD_SCALE * 0.75) return true;
      }
      return false;
    };
    const place = (count, make) => {
      let tries = 0;
      while(count > 0 && tries < count * 12){
        tries++;
        const x = rnd() * bx, z = -rnd() * bz;
        if(onLane(x, z)) continue;       // rien au milieu de la voie : lisibilité du combat
        make(x, z); count--;
      }
    };

    place(small ? 26 : 48, (x, z) => {                 // rochers
      const sc = 0.18 + rnd() * 0.35;
      const rock = BABYLON.MeshBuilder.CreatePolyhedron('rock', { type: 1, size: sc }, this.scene);
      rock.position.set(x, groundY(x, z) + sc * 0.35, z);
      rock.rotation.set(rnd(), rnd() * Math.PI * 2, rnd() * 0.4);
      parts.rock.push(rock);
    });

    place(small ? 60 : 130, (x, z) => {                // touffes d'herbe
      const hgt = 0.18 + rnd() * 0.22;
      const tuft = BABYLON.MeshBuilder.CreateCylinder('grass', {
        diameterTop: 0, diameterBottom: 0.16 + rnd() * 0.12, height: hgt, tessellation: 4,
      }, this.scene);
      tuft.position.set(x, groundY(x, z) + hgt * 0.45, z);
      tuft.rotation.y = rnd() * Math.PI;
      parts.grass.push(tuft);
    });

    place(small ? 10 : 20, (x, z) => {                 // arbres
      const hgt = 1.6 + rnd() * 1.4;
      const trunk = BABYLON.MeshBuilder.CreateCylinder('trunk', {
        diameterTop: 0.12, diameterBottom: 0.2, height: hgt * 0.45, tessellation: 5,
      }, this.scene);
      const gy = groundY(x, z);
      trunk.position.set(x, gy + hgt * 0.22, z);
      parts.trunk.push(trunk);
      for(let k = 0; k < 2; k++){
        const cr = (0.75 - k * 0.22) * (0.8 + rnd() * 0.4);
        const crown = BABYLON.MeshBuilder.CreateCylinder('crown', {
          diameterTop: 0, diameterBottom: cr * 2, height: hgt * 0.5, tessellation: 6,
        }, this.scene);
        crown.position.set(x, gy + hgt * (0.45 + k * 0.28), z);
        parts.foliage.push(crown);
      }
    });

    const merge = (list, color, name, spec) => {
      if(!list.length) return;
      const merged = BABYLON.Mesh.MergeMeshes(list, true, true, undefined, false, false);
      if(!merged) return;
      merged.name = name;
      merged.parent = this.root;
      const mat = new BABYLON.StandardMaterial(name + 'Mat', this.scene);
      mat.diffuseColor = color;
      mat.specularColor = new BABYLON.Color3(spec, spec, spec);
      mat.freeze();
      merged.material = mat;
      merged.isPickable = false;
      merged.freezeWorldMatrix();
      merged.alwaysSelectAsActiveMesh = true; // décor statique : pas de recalcul de visibilité
    };
    // Teintes distinctes : sans ça, sur une carte brune, buissons, rochers
    // et herbe se confondaient avec le sol et le décor semblait vide.
    const g2 = hexToColor3(this.theme.g2);
    const greener = (c, k) => new BABYLON.Color3(c.r * 0.7 * k, c.g * 1.25 * k, c.b * 0.75 * k);
    const stone = hexToColor3(this.theme.wall);
    const lum = stone.r * 0.3 + stone.g * 0.59 + stone.b * 0.11;
    const grey = new BABYLON.Color3(lum * 0.95, lum * 0.97, lum * 1.05);
    merge(parts.foliage, greener(g2, 0.85), 'foliage', 0.02);
    merge(parts.trunk, stone.scale(0.6), 'trunks', 0.02);
    merge(parts.rock, grey, 'rocks', 0.10);
    merge(parts.grass, greener(g2, 1.05), 'grass', 0.02);

    for(const c of (this.layout.camps || [])){
      const pos = this._toBabylon(c.x, c.y);
      const ring = BABYLON.MeshBuilder.CreateTorus('camp', { diameter: 46/WORLD_SCALE*2, thickness: 0.06 }, this.scene);
      ring.parent = this.root;
      ring.position.set(pos.x, groundY(pos.x, pos.z) + 0.05, pos.z);
      const mat = new BABYLON.StandardMaterial('campMat', this.scene);
      mat.emissiveColor = hexToColor3(this.theme.acc).scale(0.5);
      mat.freeze();
      ring.material = mat;
      ring.isPickable = false;
      ring.freezeWorldMatrix();
    }
  }

  /**
   * Décor 3D réel (rochers, buissons, coffre, brasero — voir MATERIEL2 du
   * document de passation), en complément du décor procédural déjà posé
   * par _buildBrush(). Chargé une fois par fichier, puis dupliqué par
   * instanciation GPU (createInstance) : coût quasi nul par copie
   * supplémentaire. Même règle qu'ailleurs : rien au milieu de la voie.
   */
  async _scatterPropModels(seed){
    const { w, h } = this.layout;
    const bx = w / WORLD_SCALE, bz = h / WORLD_SCALE;
    let st = ((seed >>> 0) || 7) ^ 0x9e3779b9;
    const rnd = () => { st = (Math.imul(st, 1664525) + 1013904223) >>> 0; return st / 4294967296; };
    const small = Math.min(window.innerWidth || 1280, window.innerHeight || 800) < 500;
    const groundY = (x, z) => heightNoise(x, -z, seed) * 0.55;
    const onLane = (x, z) => {
      const path = this.layout.path || [];
      for(const p of path){
        const b = this._toBabylon(p.x, p.y);
        if(Math.hypot(b.x - x, b.z - z) < (this.layout.laneWidth || 210) / WORLD_SCALE * 0.75) return true;
      }
      return false;
    };
    const randomSpot = (tries = 40) => {
      for(let i = 0; i < tries; i++){
        const x = rnd() * bx, z = -rnd() * bz;
        if(!onLane(x, z)) return { x, z };
      }
      return null;
    };

    // Charge un GLB et renvoie son premier mesh « gabarit » (source des
    // instances), mis à l'échelle pour une hauteur cible en mètres, la
    // pointe/base au sol posée sur y=0 local (les instances n'ont plus
    // qu'à être posées à la bonne hauteur de terrain ensuite).
    const loadTemplate = async (file, targetH) => {
      const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(PROPS_BASE, file, this.scene);
      container.addAllToScene();
      const meshes = container.meshes.filter(m => m.getTotalVertices() > 0);
      if(!meshes.length) return null;
      // Un seul mesh racine visible : les sous-parties restent group ées
      // dessous pour garder les multi-matériaux (arme/déco à plusieurs textures).
      const root = meshes[0].parent && meshes[0].parent.getClassName?.() === 'TransformNode'
        ? meshes[0].parent : meshes[0];
      let minY = 1e9, maxY = -1e9;
      for(const m of meshes){
        m.computeWorldMatrix(true);
        const bb = m.getBoundingInfo().boundingBox;
        minY = Math.min(minY, bb.minimumWorld.y); maxY = Math.max(maxY, bb.maximumWorld.y);
      }
      const rawH = Math.max(maxY - minY, 0.01);
      const scale = targetH / rawH;
      for(const m of meshes){ m.scaling.scaleInPlace(scale); m.isVisible = false; m.setEnabled(false); }
      return meshes; // gabarits désactivés — seules leurs instances seront visibles
    };

    const scatterInstances = (templates, count, targetY0 = true) => {
      if(!templates || !templates.length) return;
      for(let i = 0; i < count; i++){
        const spot = randomSpot();
        if(!spot) continue;
        const gy = targetY0 ? groundY(spot.x, spot.z) : 0;
        const rotY = rnd() * Math.PI * 2;
        for(const tpl of templates){
          const inst = tpl.createInstance(tpl.name + '_i' + i);
          inst.parent = this.root;
          inst.position.set(spot.x, gy, spot.z);
          inst.rotation.y = rotY;
          inst.isPickable = false;
          inst.alwaysSelectAsActiveMesh = true;
          inst.freezeWorldMatrix();
        }
      }
    };

    try{
      const [rockT, bushT] = await Promise.all([
        loadTemplate('DECOR1.glb', 0.9),
        loadTemplate('DECOR2.glb', 0.75),
      ]);
      scatterInstances(rockT, small ? 5 : 9);
      scatterInstances(bushT, small ? 5 : 9);

      // Coffre et brasero : accents rares, posés près des camps plutôt
      // que semés partout — ce sont des repères, pas du remplissage.
      const [chestT, brazierT] = await Promise.all([
        loadTemplate('DECOR3.glb', 0.55),
        loadTemplate('DECOR4.glb', 0.7),
      ]);
      const camps = this.layout.camps || [];
      if(brazierT && camps.length){
        for(const c of camps){
          const pos = this._toBabylon(c.x, c.y);
          const a = rnd() * Math.PI * 2, d = 1.6 + rnd() * 0.6;
          const x = pos.x + Math.cos(a) * d, z = pos.z + Math.sin(a) * d;
          for(const tpl of brazierT){
            const inst = tpl.createInstance('brazier_' + c.x);
            inst.parent = this.root;
            inst.position.set(x, groundY(x, z), z);
            inst.isPickable = false; inst.alwaysSelectAsActiveMesh = true; inst.freezeWorldMatrix();
          }
        }
      }
      if(chestT){
        const spot = randomSpot();
        if(spot){
          for(const tpl of chestT){
            const inst = tpl.createInstance('chest');
            inst.parent = this.root;
            inst.position.set(spot.x, groundY(spot.x, spot.z), spot.z);
            inst.rotation.y = rnd() * Math.PI * 2;
            inst.isPickable = false; inst.alwaysSelectAsActiveMesh = true; inst.freezeWorldMatrix();
          }
        }
      }
    }catch(e){
      console.error('[BabylonTerrain] ❌ un modèle de décor n\'a pas pu être chargé —', e);
    }
  }

  _buildWalls(){
    const { w, h } = this.layout;
    const bx = w / WORLD_SCALE, bz = h / WORLD_SCALE;
    const t = 60 / WORLD_SCALE;
    const mat = new BABYLON.StandardMaterial('wallMat', this.scene);
    mat.diffuseColor = hexToColor3(this.theme.wall);
    mat.freeze();

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
      wall.isPickable = false;
      wall.freezeWorldMatrix();
    }
  }

  destroy(){
    this.root.dispose(false, true); // détruit aussi les meshes/matériaux enfants
  }
}
