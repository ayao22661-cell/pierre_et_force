// ============================================================
// OUTILS DE GÉOMÉTRIE — assemble des formes Babylon en un seul
// maillage par matériau (un appel de rendu), avec couleurs de
// sommets pour l'occlusion ambiante peinte (pieds sombres, cimes
// claires) : c'est ce qui donne du volume sans coûter d'ombres.
// ============================================================

const B = () => window.BABYLON;

/** Accumulateur de géométrie : on y ajoute des maillages, puis on construit. */
export class Geo{
  constructor(){ this.pos = []; this.nrm = []; this.uv = []; this.col = []; this.idx = []; }
  get count(){ return this.pos.length / 3; }

  /**
   * Ajoute un maillage Babylon (qui est ensuite détruit).
   * colorFn(x, y, z, nx, ny, nz) -> [r, g, b] (0..1), optionnelle.
   */
  add(mesh, colorFn = null, uvScale = null, uvSwap = false){
    mesh.bakeCurrentTransformIntoVertices();
    const p = mesh.getVerticesData('position');
    let n = mesh.getVerticesData('normal');
    if(!n){ mesh.createNormals(true); n = mesh.getVerticesData('normal'); }
    const t = mesh.getVerticesData('uv') || new Float32Array(p.length / 3 * 2);
    const ind = mesh.getIndices();
    const base = this.count;
    for(let i = 0; i < p.length / 3; i++){
      const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2];
      const nx = n[i * 3], ny = n[i * 3 + 1], nz = n[i * 3 + 2];
      this.pos.push(x, y, z); this.nrm.push(nx, ny, nz);
      let tu = t[i * 2], tv = t[i * 2 + 1];
      if(uvSwap){ const k = tu; tu = tv; tv = k; }
      this.uv.push(tu * (uvScale ? uvScale[0] : 1), tv * (uvScale ? uvScale[1] : 1));
      const c = colorFn ? colorFn(x, y, z, nx, ny, nz) : [1, 1, 1];
      this.col.push(c[0], c[1], c[2], 1);
    }
    for(let i = 0; i < ind.length; i++) this.idx.push(ind[i] + base);
    mesh.dispose();
    return this;
  }

  /** Quad (carte) : 4 coins, normale commune, coins UV, couleurs haut/bas. */
  quad(p0, p1, p2, p3, nrm, cTop = [1, 1, 1], cBot = [1, 1, 1], uv = [0, 0, 1, 1]){
    const b = this.count;
    const [u0, v0, u1, v1] = uv;
    for(const [p, c, t] of [[p0, cBot, [u0, v0]], [p1, cBot, [u1, v0]], [p2, cTop, [u1, v1]], [p3, cTop, [u0, v1]]]){
      this.pos.push(p[0], p[1], p[2]); this.nrm.push(nrm[0], nrm[1], nrm[2]);
      this.uv.push(t[0], t[1]); this.col.push(c[0], c[1], c[2], 1);
    }
    this.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    return this;
  }

  /** Force toutes les normales vers le haut (feuillages plats, étages de sapin). */
  normalsUp(from = 0){ for(let i = from * 3; i < this.nrm.length; i += 3){ this.nrm[i] = 0; this.nrm[i + 1] = 1; this.nrm[i + 2] = 0; } return this; }

  build(name, scene, material){
    const BB = B();
    const m = new BB.Mesh(name, scene);
    const vd = new BB.VertexData();
    vd.positions = this.pos; vd.normals = this.nrm; vd.uvs = this.uv; vd.colors = this.col; vd.indices = this.idx;
    vd.applyToMesh(m, false);
    m.material = material;
    m.isPickable = false;
    m.hasVertexAlpha = false;
    return m;
  }
}

/** Carte en croix (2 ou 3 plans verticaux) — herbes, fougères, fleurs. */
export function crossCards(geo, { w, h, planes = 3, x = 0, y = 0, z = 0, rot = 0, tilt = 0, cTop = [1, 1, 1], cBot = [0.55, 0.55, 0.55] }){
  for(let i = 0; i < planes; i++){
    const a = rot + (i / planes) * Math.PI;
    const dx = Math.cos(a) * w / 2, dz = Math.sin(a) * w / 2;
    const tx = Math.cos(a + Math.PI / 2) * tilt * h, tz = Math.sin(a + Math.PI / 2) * tilt * h;
    geo.quad(
      [x - dx, y, z - dz], [x + dx, y, z + dz],
      [x + dx + tx, y + h, z + dz + tz], [x - dx + tx, y + h, z - dz + tz],
      [0, 1, 0], cTop, cBot
    );
  }
}

// ── Matériaux (mis en cache par scène) ─────────────────────────
const CACHE = new WeakMap();
export function matCache(scene){
  if(!CACHE.has(scene)) CACHE.set(scene, new Map());
  return CACHE.get(scene);
}

/**
 * Matériau texturé depuis un canvas.
 *  alpha : 'test' (feuillages, découpe nette, sans tri) | 'blend' | null
 */
export function texMat(scene, key, makeCanvas, o = {}){
  const cache = matCache(scene);
  if(cache.has(key)) return cache.get(key);
  const BB = B();
  const cv = makeCanvas();
  const tex = new BB.DynamicTexture(key + '_t', cv, scene, true);
  tex.update(true);
  tex.hasAlpha = !!o.alpha;
  tex.wrapU = tex.wrapV = o.clamp ? BB.Texture.CLAMP_ADDRESSMODE : BB.Texture.WRAP_ADDRESSMODE;
  tex.anisotropicFilteringLevel = 4;
  const m = new BB.StandardMaterial(key, scene);
  m.diffuseTexture = tex;
  m.specularColor = o.spec != null ? new BB.Color3(o.spec, o.spec, o.spec) : new BB.Color3(0.04, 0.04, 0.04);
  if(o.specPower) m.specularPower = o.specPower;
  if(o.alpha === 'test'){
    m.useAlphaFromDiffuseTexture = true;
    m.transparencyMode = BB.Material.MATERIAL_ALPHATEST;
    m.alphaCutOff = o.cutoff ?? 0.45;
    m.backFaceCulling = false;
  } else if(o.alpha === 'blend'){
    m.useAlphaFromDiffuseTexture = true;
    m.transparencyMode = BB.Material.MATERIAL_ALPHABLEND;
    m.backFaceCulling = false;
    m.disableDepthWrite = true;
  }
  if(o.twoSided) m.backFaceCulling = false;
  if(o.emissive) m.emissiveColor = BB.Color3.FromHexString(o.emissive);
  if(o.emissiveTex){ m.emissiveTexture = tex; }
  if(o.ambient) m.ambientColor = BB.Color3.FromHexString(o.ambient);
  if(o.unlit){ m.disableLighting = true; m.emissiveTexture = tex; }
  if(o.additive){ m.alphaMode = BB.Engine.ALPHA_ADD; m.transparencyMode = BB.Material.MATERIAL_ALPHABLEND; m.useAlphaFromDiffuseTexture = true; m.disableDepthWrite = true; m.backFaceCulling = false; }
  cache.set(key, m);
  return m;
}

/** Matériau uni (sans texture). */
export function colorMat(scene, key, hex, o = {}){
  const cache = matCache(scene);
  if(cache.has(key)) return cache.get(key);
  const BB = B();
  const m = new BB.StandardMaterial(key, scene);
  m.diffuseColor = BB.Color3.FromHexString(hex);
  m.specularColor = new BB.Color3(o.spec ?? 0.05, o.spec ?? 0.05, o.spec ?? 0.05);
  if(o.specPower) m.specularPower = o.specPower;
  if(o.emissive) m.emissiveColor = BB.Color3.FromHexString(o.emissive);
  if(o.alpha != null){ m.alpha = o.alpha; }
  if(o.twoSided) m.backFaceCulling = false;
  cache.set(key, m);
  return m;
}

/** Couleur 0..1 depuis '#hex', multipliée par k. */
export function c3(hex, k = 1){
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255 * k, ((n >> 8) & 255) / 255 * k, (n & 255) / 255 * k];
}

/**
 * Occlusion ambiante « peinte » : sombre au pied (y bas), clair en haut
 * et sur les faces tournées vers le ciel. h = hauteur de référence.
 */
export function aoColor(h, lo = 0.45, hi = 1.05, skyK = 0.15){
  return (x, y, z, nx, ny) => {
    const t = Math.max(0, Math.min(1, y / h));
    const v = lo + (hi - lo) * Math.sqrt(t) + ny * skyK;
    return [v, v, v];
  };
}

/** Rassemble les modèles en « gabarits » instanciables (thin instances). */
export class Template{
  constructor(meshes, info = {}){
    this.meshes = meshes.filter(Boolean);
    for(const m of this.meshes){ m.isVisible = true; m.alwaysSelectAsActiveMesh = true; m.doNotSyncBoundingInfo = true; }
    this.radius = info.radius || 1;   // empreinte au sol (ombres, espacement)
    this.height = info.height || 1;
    this.shadow = info.shadow ?? 0.55;
    this.mats = [];
  }
  add(x, y, z, rotY = 0, s = 1, sy = s){
    const BB = B();
    const m = BB.Matrix.Compose(new BB.Vector3(s, sy, s), BB.Quaternion.RotationYawPitchRoll(rotY, 0, 0), new BB.Vector3(x, y, z));
    this.mats.push(m);
  }
  commit(parent){
    if(!this.mats.length){ for(const m of this.meshes) m.dispose(); return; }
    const BB = B();
    const buf = new Float32Array(this.mats.length * 16);
    this.mats.forEach((m, i) => m.copyToArray(buf, i * 16));
    for(const mesh of this.meshes){
      mesh.parent = parent;
      mesh.thinInstanceSetBuffer('matrix', buf.slice(), 16, true);
      mesh.thinInstanceRefreshBoundingInfo(false);
      mesh.freezeWorldMatrix();
    }
  }
}
