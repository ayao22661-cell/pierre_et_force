// ============================================================
// ITEM RENDERS — vignettes 3D des objets de la boutique.
//
// Chaque objet est rendu une fois, hors ligne, par Babylon.js :
// soit à partir d'un modèle du dossier assets/props (épées, bouclier,
// bâton), soit « dessiné » en primitives Babylon quand aucun modèle
// n'existe encore (perle, ceinture, masque, ailes…).
//
// Le jeu n'exécute PAS ce fichier : la boutique affiche les images
// pré-rendues de assets/items/<id>.webp (quelques Ko chacune), comme
// les portraits. Pour régénérer après un changement : ouvrir
// tools/gen-items.html via le serveur local, puis « Tout télécharger »
// et copier les fichiers dans assets/items/.
//
// Pour remplacer un objet dessiné par un vrai modèle (Hunyuan 3D) :
// mettre le .glb dans assets/props/ et changer sa ligne dans ITEM_ART
// en { prop: 'NOM_DU_FICHIER' }.
// ============================================================

const B = () => window.BABYLON;
const PROPS = '../assets/props/';
export const ITEM_SIZE = 320;

// Teinte d'un modèle existant, pour décliner un même prop en plusieurs objets.
// rot : orientation [x, y, z] en radians pour une présentation de 3/4.
export const ITEM_ART = {
  lame:     { prop: 'EPEE1', rot: [Math.PI / 2, 0, -0.7] },
  faucille: { prop: 'EPEE3', rot: [Math.PI / 2, 0, -0.7], glow: '#39FF7A' },
  coupe:    { prop: 'EPEE',  rot: [0, 0.35, 0], glow: '#c9a24a' },
  lamevide: { prop: 'EPEE',  rot: [0, -0.35, 0.12], tint: '#8a5cff', glow: '#8a5cff' },
  bouclier: { prop: 'BOUCLIER', rot: [0, Math.PI + 0.35, 0], metal: 0.25 },
  rempart:  { prop: 'BOUCLIER', rot: [0, Math.PI - 0.35, 0], tint: '#e0b45a', metal: 0.55, glow: '#c9a24a', halo: '#e0b45a' },
  baton:    { prop: 'BATON_MAGIQUE', rot: [0, 0.4, -0.35], glow: '#a060ff' },
  sceptre:  { prop: 'BATON_MAGIQUE', rot: [0, -0.4, 0.35], tint: '#f0c060', metal: 0.6, glow: '#fbbf24', halo: '#fbbf24' },
  perle:    { draw: 'cowrie' },
  ceinture: { draw: 'kente' },
  gants:    { draw: 'bracer' },
  sandales: { draw: 'sandal' },
  bottes:   { draw: 'boot' },
  arc:      { draw: 'bow' },
  masque:   { draw: 'mask' },
  gilet:    { draw: 'vest' },
  ailes:    { draw: 'wings' },
  coeur:    { draw: 'gem', color: '#39FF7A' },
};

// ── Matériaux ───────────────────────────────────────────────
function pbr(scene, hex, { metal = 0, rough = 0.6, emissive = null, alpha = 1 } = {}){
  const BB = B();
  const m = new BB.PBRMaterial('m' + Math.random(), scene);
  m.albedoColor = BB.Color3.FromHexString(hex).toLinearSpace();
  m.metallic = metal; m.roughness = rough;
  if(emissive) m.emissiveColor = BB.Color3.FromHexString(emissive);
  if(alpha < 1){ m.alpha = alpha; }
  return m;
}
function stripes(scene, colors, w = 256, h = 32, vertical = true){
  const BB = B();
  const tex = new BB.DynamicTexture('kente' + Math.random(), { width: w, height: h }, scene, false);
  const ctx = tex.getContext();
  const n = colors.length;
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    if(vertical) ctx.fillRect(i * w / n, 0, w / n + 1, h);
    else ctx.fillRect(0, i * h / n, w, h / n + 1);
  });
  // petits motifs géométriques façon kente
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  for(let x = 0; x < w; x += 16) ctx.fillRect(x, h * 0.42, 8, h * 0.16);
  tex.update();
  return tex;
}

// ── Objets dessinés en primitives ───────────────────────────
const DRAW = {
  gem(scene, root, art){
    const BB = B();
    const g = BB.MeshBuilder.CreatePolyhedron('gem', { type: 1, size: 0.55 }, scene);
    g.scaling.set(1, 1.45, 1); g.rotation.y = 0.4;
    g.material = pbr(scene, art.color, { metal: 0.1, rough: 0.12, emissive: '#0f5a2a' });
    g.convertToFlatShadedMesh();
    g.parent = root;
    // gangue de pierre brute autour de la gemme
    for(let i = 0; i < 5; i++){
      const r = BB.MeshBuilder.CreatePolyhedron('rock' + i, { type: 2, size: 0.22 + Math.random() * 0.1 }, scene);
      const a = i / 5 * Math.PI * 2;
      r.position.set(Math.cos(a) * 0.5, -0.55 + Math.random() * 0.1, Math.sin(a) * 0.35);
      r.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      r.material = pbr(scene, '#4a4640', { rough: 0.9 });
      r.convertToFlatShadedMesh();
      r.parent = root;
    }
  },
  cowrie(scene, root){
    const BB = B();
    const shell = BB.MeshBuilder.CreateSphere('shell', { diameter: 1, segments: 32 }, scene);
    shell.scaling.set(0.72, 1, 0.5);
    const mat = pbr(scene, '#f3e6cf', { rough: 0.18 });
    mat.clearCoat.isEnabled = true; mat.clearCoat.intensity = 1;
    mat.sheen.isEnabled = true; mat.sheen.color = BB.Color3.FromHexString('#ffd9f0');
    shell.material = mat; shell.parent = root;
    // fente dentelée de la cauri
    const slit = BB.MeshBuilder.CreateBox('slit', { width: 0.06, height: 0.78, depth: 0.1 }, scene);
    slit.position.z = -0.24; slit.material = pbr(scene, '#3a2416', { rough: 0.7 }); slit.parent = root;
    for(let i = -4; i <= 4; i++){
      [-1, 1].forEach(s => {
        const t = BB.MeshBuilder.CreateBox('t', { width: 0.07, height: 0.025, depth: 0.05 }, scene);
        t.position.set(s * 0.055, i * 0.08, -0.25);
        t.material = mat; t.parent = root;
      });
    }
    // cordon doré
    const ring = BB.MeshBuilder.CreateTorus('ring', { diameter: 0.34, thickness: 0.045, tessellation: 32 }, scene);
    ring.position.y = 0.55; ring.rotation.x = Math.PI / 2 - 0.3;
    ring.material = pbr(scene, '#d9a441', { metal: 1, rough: 0.3 }); ring.parent = root;
    root.rotation.set(-0.35, 0.5, 0.25);
  },
  kente(scene, root){
    const BB = B();
    const belt = BB.MeshBuilder.CreateCylinder('belt', { diameter: 1.4, height: 0.32, tessellation: 48, sideOrientation: BB.Mesh.DOUBLESIDE }, scene);
    const mat = pbr(scene, '#ffffff', { rough: 0.75 });
    mat.albedoTexture = stripes(scene, ['#e8b030', '#1d6b3a', '#e8b030', '#b3261e', '#111111', '#e8b030', '#1d6b3a', '#b3261e']);
    mat.albedoTexture.uScale = 6;
    mat.albedoTexture.wrapU = 1;
    belt.material = mat; belt.parent = root;
    const buckle = BB.MeshBuilder.CreateBox('buckle', { width: 0.36, height: 0.42, depth: 0.08 }, scene);
    buckle.position.z = -0.71;
    buckle.material = pbr(scene, '#d9a441', { metal: 1, rough: 0.25 }); buckle.parent = root;
    const gem = BB.MeshBuilder.CreatePolyhedron('bg', { type: 1, size: 0.08 }, scene);
    gem.position.z = -0.77; gem.material = pbr(scene, '#b3261e', { rough: 0.1, emissive: '#400' }); gem.parent = root;
    root.rotation.set(0.55, 0.2, 0.1);
  },
  bracer(scene, root){
    const BB = B();
    const leather = pbr(scene, '#6a3d22', { rough: 0.7 });
    const gold = pbr(scene, '#d9a441', { metal: 1, rough: 0.28 });
    [-0.35, 0.35].forEach((x, k) => {
      const c = BB.MeshBuilder.CreateCylinder('br', { diameterTop: 0.5, diameterBottom: 0.62, height: 0.9, tessellation: 32 }, scene);
      c.position.x = x; c.rotation.z = k ? -0.25 : 0.25; c.material = leather; c.parent = root;
      [-0.3, 0.3].forEach(y => {
        const r = BB.MeshBuilder.CreateTorus('r', { diameter: y > 0 ? 0.52 : 0.64, thickness: 0.07, tessellation: 32 }, scene);
        r.position.y = y; r.material = gold; r.parent = c;
      });
      const stud = BB.MeshBuilder.CreatePolyhedron('s', { type: 1, size: 0.09 }, scene);
      stud.position.z = -0.29; stud.material = pbr(scene, '#5ef2e6', { rough: 0.1, emissive: '#0a4a46' }); stud.parent = c;
    });
    root.rotation.set(0.25, 0.3, 0);
  },
  sandal(scene, root){
    const BB = B();
    const sole = BB.MeshBuilder.CreateCapsule('sole', { radius: 0.28, height: 1.3, tessellation: 24 }, scene);
    sole.scaling.set(1, 1, 0.22); sole.rotation.x = Math.PI / 2;
    sole.material = pbr(scene, '#7a4a2a', { rough: 0.8 }); sole.parent = root;
    const strapM = pbr(scene, '#b3261e', { rough: 0.6 });
    [-0.3, 0.05, 0.35].forEach((z, i) => {
      const s = BB.MeshBuilder.CreateTorus('st', { diameter: 0.5, thickness: 0.07, tessellation: 32 }, scene);
      s.scaling.set(1, 1.1, 0.6); s.rotation.z = Math.PI / 2; s.rotation.y = Math.PI / 2;
      s.position.set(0, 0.1, z); s.material = i === 1 ? pbr(scene, '#d9a441', { metal: 1, rough: 0.3 }) : strapM; s.parent = root;
    });
    root.rotation.set(-0.7, 0.7, 0);
  },
  boot(scene, root){
    const BB = B();
    const leather = pbr(scene, '#4a2c1a', { rough: 0.65 });
    const shaft = BB.MeshBuilder.CreateCylinder('sh', { diameterTop: 0.52, diameterBottom: 0.46, height: 0.95, tessellation: 32 }, scene);
    shaft.position.y = 0.3; shaft.material = leather; shaft.parent = root;
    const foot = BB.MeshBuilder.CreateCapsule('ft', { radius: 0.24, height: 0.95, tessellation: 24 }, scene);
    foot.rotation.x = Math.PI / 2; foot.position.set(0, -0.2, -0.22); foot.scaling.set(1, 1, 0.9);
    foot.material = leather; foot.parent = root;
    const cuff = BB.MeshBuilder.CreateTorus('cf', { diameter: 0.55, thickness: 0.1, tessellation: 32 }, scene);
    cuff.position.y = 0.77; cuff.material = pbr(scene, '#d9a441', { metal: 1, rough: 0.3 }); cuff.parent = root;
    // petites ailes du messager
    const wingM = pbr(scene, '#f2f5ff', { rough: 0.35, emissive: '#1a3050' });
    [-1, 1].forEach(s => {
      for(let i = 0; i < 3; i++){
        const f = BB.MeshBuilder.CreateCapsule('f', { radius: 0.09, height: 0.7 - i * 0.14, tessellation: 12 }, scene);
        f.scaling.z = 0.25;
        f.position.set(s * 0.3, 0.62 - i * 0.06, 0.05 + i * 0.08);
        f.rotation.set(0.9 + i * 0.25, 0, s * (0.6 + i * 0.1));
        f.material = wingM; f.parent = root;
      }
    });
    root.rotation.set(0.1, Math.PI / 2 + 0.35, 0);
  },
  bow(scene, root){
    const BB = B();
    const pts = [];
    for(let i = 0; i <= 40; i++){
      const t = -1 + i / 20;
      pts.push(new BB.Vector3(0.38 * (1 - t * t) - 0.19, t * 0.95, 0));
    }
    const limb = BB.MeshBuilder.CreateTube('limb', { path: pts, radiusFunction: (i) => 0.045 + 0.04 * Math.sin(Math.PI * i / 40), tessellation: 12 }, scene);
    limb.material = pbr(scene, '#7a4a24', { rough: 0.55 }); limb.parent = root;
    const str = BB.MeshBuilder.CreateTube('str', { path: [pts[0], pts[40]], radius: 0.008 }, scene);
    str.material = pbr(scene, '#f0e6c8', { rough: 0.4, emissive: '#302010' }); str.parent = root;
    // lames de balafon enfilées sur la poignée
    for(let i = 0; i < 4; i++){
      const k = BB.MeshBuilder.CreateBox('k', { width: 0.3 - i * 0.04, height: 0.05, depth: 0.1 }, scene);
      k.position.set(0.18, -0.12 + i * 0.08, 0);
      k.material = pbr(scene, i % 2 ? '#d9a441' : '#a36a38', { metal: i % 2 ? 1 : 0, rough: 0.35 }); k.parent = root;
    }
    root.rotation.set(0, 0.5, -0.5);
  },
  mask(scene, root){
    const BB = B();
    // Masque Dan : ovale de bois poli, fentes des yeux, arête blanche.
    const W = 0.36, H = 0.53, D = 0.26;
    const face = BB.MeshBuilder.CreateSphere('face', { diameter: 1, segments: 40, slice: 0.5, sideOrientation: BB.Mesh.DOUBLESIDE }, scene);
    face.rotation.x = Math.PI / 2; face.scaling.set(W * 2, D * 2, H * 2);
    const wood = pbr(scene, '#6b3e22', { rough: 0.32 });
    wood.clearCoat.isEnabled = true; wood.clearCoat.intensity = 0.6;
    face.material = wood; face.parent = root;
    // point à la surface du dôme (face tournée vers la caméra, z négatif)
    const onFace = (x, y, lift = 0.012) => -D * Math.sqrt(Math.max(0, 1 - (x / W) ** 2 - (y / H) ** 2)) - lift;
    const dark = pbr(scene, '#050303', { rough: 1 });
    [-0.14, 0.14].forEach(x => {
      const e = BB.MeshBuilder.CreateSphere('eye', { diameter: 0.2, segments: 16 }, scene);
      e.scaling.set(1, 0.32, 0.25); e.position.set(x, 0.07, onFace(x, 0.07, -0.005));
      e.rotation.z = x > 0 ? -0.15 : 0.15;
      e.material = dark; e.parent = root;
    });
    const white = pbr(scene, '#efe8d6', { rough: 0.5 });
    for(let i = 0; i < 9; i++){
      const y = 0.46 - i * 0.045;
      const d = BB.MeshBuilder.CreateSphere('ridge', { diameter: 0.05, segments: 8 }, scene);
      d.position.set(0, y, onFace(0, y)); d.material = white; d.parent = root;
    }
    const mouth = BB.MeshBuilder.CreateSphere('mouth', { diameter: 0.14, segments: 16 }, scene);
    mouth.scaling.set(1, 0.55, 0.5); mouth.position.set(0, -0.3, onFace(0, -0.3, -0.01));
    mouth.material = pbr(scene, '#9b1f18', { rough: 0.45 }); mouth.parent = root;
    // fibres de raphia sous le menton
    const raffia = pbr(scene, '#c9a86a', { rough: 0.9 });
    for(let i = 0; i < 11; i++){
      const a = -0.9 + i * 0.18;
      const f = BB.MeshBuilder.CreateCylinder('r', { diameter: 0.025, height: 0.42, tessellation: 6 }, scene);
      f.position.set(Math.sin(a) * 0.3, -0.62, -Math.cos(a) * 0.12);
      f.rotation.z = a * 0.35; f.material = raffia; f.parent = root;
    }
    root.rotation.set(0.05, 0.4, 0);
  },
  vest(scene, root){
    const BB = B();
    // Gilet de docker : torse orange haute visibilité, bandes réfléchissantes,
    // bretelles et poche poitrine.
    const orange = pbr(scene, '#ff7a1a', { rough: 0.55 });
    const refl = pbr(scene, '#e6edf5', { metal: 0.9, rough: 0.12 });
    const arc = 0.56, rot = Math.PI / 2 + Math.PI * (1 - arc) + Math.PI * arc - Math.PI;
    const body = BB.MeshBuilder.CreateCylinder('v', { diameterTop: 0.78, diameterBottom: 1.0, height: 1.2, tessellation: 48, arc, sideOrientation: BB.Mesh.DOUBLESIDE }, scene);
    body.material = orange; body.parent = root;
    [-0.2, 0.18].forEach(y => {
      const b = BB.MeshBuilder.CreateCylinder('b', { diameter: 1.0 - (y + 0.55) * 0.07 + 0.02, height: 0.09, tessellation: 48, arc, sideOrientation: BB.Mesh.DOUBLESIDE }, scene);
      b.position.y = y; b.material = refl; b.parent = root;
    });
    // bretelles (au-dessus des épaules)
    [-0.25, 0.25].forEach(x => {
      const st = BB.MeshBuilder.CreateTorus('st', { diameter: 0.5, thickness: 0.1, tessellation: 24, arc: 0.5 }, scene);
      st.rotation.set(0, Math.PI / 2, 0); st.position.set(x, 0.55, 0); st.scaling.set(1, 0.9, 1);
      st.material = orange; st.parent = root;
    });
    const zip = BB.MeshBuilder.CreateBox('z', { width: 0.035, height: 1.18, depth: 0.03 }, scene);
    zip.position.set(0, 0, -0.45); zip.rotation.x = -0.09; zip.material = pbr(scene, '#2a2a30', { metal: 0.6, rough: 0.4 }); zip.parent = root;
    const pocket = BB.MeshBuilder.CreateBox('p', { width: 0.2, height: 0.18, depth: 0.04 }, scene);
    pocket.position.set(0.2, 0.36, -0.44); pocket.rotation.y = -0.4; pocket.material = pbr(scene, '#d95f0e', { rough: 0.6 }); pocket.parent = root;
    // oriente l'ouverture du demi-cylindre vers l'arrière
    body.rotation.y = 0; root.getChildMeshes().forEach(m => { if(m.name === 'v' || m.name === 'b') m.rotation.y = Math.PI / 2 - Math.PI * arc; });
    root.rotation.set(0.12, 0.55, 0);
  },
  wings(scene, root){
    const BB = B();
    const white = pbr(scene, '#f4f6ff', { rough: 0.35, emissive: '#10263a' });
    const tip = pbr(scene, '#5ef2e6', { rough: 0.3, emissive: '#1f7a74' });
    [-1, 1].forEach(s => {
      for(let i = 0; i < 6; i++){
        const len = 1.05 - i * 0.12;
        const f = BB.MeshBuilder.CreateCapsule('fe', { radius: 0.085, height: len, tessellation: 16 }, scene);
        f.scaling.z = 0.2;
        f.setPivotPoint(new BB.Vector3(0, -len / 2, 0));
        f.position.set(s * 0.08, -0.25 + len / 2, 0);
        f.rotation.z = s * (-0.35 - i * 0.2);
        f.material = i === 0 ? tip : white; f.parent = root;
      }
    });
    root.rotation.set(0.2, 0.35, 0);
  },
};

// ── Environnement de reflets, sans téléchargement externe ────
// Un ciel en dégradé capturé par une sonde : les matériaux métalliques
// (PBR) des props ont besoin de quelque chose à refléter, sinon ils
// rendent noirs (c'était le cas du bouclier).
function makeEnvironment(scene){
  const BB = B();
  const sky = BB.MeshBuilder.CreateSphere('sky', { diameter: 40, sideOrientation: BB.Mesh.BACKSIDE }, scene);
  const tex = new BB.DynamicTexture('skytex', { width: 16, height: 256 }, scene, false);
  const ctx = tex.getContext();
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#fff3d6'); g.addColorStop(0.35, '#8a7a66'); g.addColorStop(0.55, '#2a2230'); g.addColorStop(1, '#07080f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 256); tex.update();
  const m = new BB.StandardMaterial('skym', scene);
  m.emissiveTexture = tex; m.disableLighting = true; m.backFaceCulling = false;
  sky.material = m;
  const probe = new BB.ReflectionProbe('probe', 128, scene);
  probe.renderList.push(sky);
  scene.environmentTexture = probe.cubeTexture;
  scene.environmentIntensity = 0.9;
  return sky;
}

function tintMaterials(meshes, art){
  const BB = B();
  for(const m of meshes){
    const mat = m.material;
    if(!mat || !mat.albedoColor) continue;
    if(art.tint){
      const t = BB.Color3.FromHexString(art.tint);
      mat.albedoColor = mat.albedoColor.multiply(t).scale(1.6);
    }
    if(art.metal != null) mat.metallic = art.metal;
  }
}

/**
 * Rend un objet et renvoie un data URL PNG (fond transparent).
 * tierColor : couleur du liseré lumineux (bronze / argent / or).
 */
export async function renderItem(engine, id, tierColor = '#c9a24a'){
  const BB = B();
  const art = ITEM_ART[id];
  if(!art) throw new Error('objet inconnu : ' + id);
  const scene = new BB.Scene(engine);
  scene.clearColor = new BB.Color4(0, 0, 0, 0);
  const sky = makeEnvironment(scene);

  const cam = new BB.ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 2.15, 4.2, BB.Vector3.Zero(), scene);
  cam.fov = 0.5;

  // Éclairage « vitrine » : clé chaude, contre-jour dans la couleur du tier.
  const hemi = new BB.HemisphericLight('h', new BB.Vector3(0, 1, -0.3), scene);
  hemi.intensity = 0.55; hemi.groundColor = new BB.Color3(0.08, 0.06, 0.1);
  const key = new BB.DirectionalLight('k', new BB.Vector3(0.6, -0.7, 0.8), scene);
  key.intensity = 2.2; key.diffuse = BB.Color3.FromHexString('#ffe9c8');
  const rim = new BB.DirectionalLight('r', new BB.Vector3(-0.4, -0.1, -1), scene);
  rim.direction = new BB.Vector3(-0.5, -0.2, 1).scale(-1);
  rim.intensity = 2.6; rim.diffuse = BB.Color3.FromHexString(art.glow || tierColor);

  const root = new BB.TransformNode('root', scene);
  let meshes = [];
  if(art.prop){
    const res = await BB.SceneLoader.ImportMeshAsync('', PROPS, art.prop + '.glb', scene);
    res.meshes[0].parent = root;
    meshes = res.meshes;
    tintMaterials(meshes, art);
    if(art.rot) root.rotation.set(...art.rot);
  } else {
    DRAW[art.draw](scene, root, art);
    meshes = root.getChildMeshes();
  }

  // Anneau doré derrière les objets de prestige (distingue les déclinaisons)
  if(art.halo){
    const { min: a, max: b } = root.getHierarchyBoundingVectors(true);
    const h = BB.MeshBuilder.CreateTorus('halo', { diameter: Math.max(b.y - a.y, b.x - a.x) * 0.95, thickness: 0.035, tessellation: 64 }, scene);
    h.rotation.x = Math.PI / 2; h.position = a.add(b).scale(0.5); h.position.z += 0.25;
    h.material = pbr(scene, art.halo, { metal: 1, rough: 0.2, emissive: art.halo });
    h.parent = root.parent || null;
    h.setParent(root);
  }

  // Cadrage : centre l'objet et le met à l'échelle de la vignette.
  root.computeWorldMatrix(true);
  const { min, max } = root.getHierarchyBoundingVectors(true);
  const size = max.subtract(min);
  const s = 1.9 / Math.max(size.x, size.y, size.z * 0.8);
  const holder = new BB.TransformNode('holder', scene);
  root.parent = holder;
  holder.scaling.setAll(s);
  const c = min.add(max).scale(0.5 * s);
  holder.position = c.scale(-1);

  const glow = new BB.GlowLayer('glow', scene, { mainTextureSamples: 2 });
  glow.intensity = 0.7;

  await scene.whenReadyAsync(true);
  sky.isVisible = true;
  scene.render(); // capture de la sonde
  sky.isVisible = false;
  for(let i = 0; i < 6; i++) scene.render();
  const url = engine.getRenderingCanvas().toDataURL('image/png');
  scene.dispose();
  return url;
}
