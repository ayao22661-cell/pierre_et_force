# Photos des lieux (`assets/lieux/`)

Fonds des récits, de la préparation, de l'écran de fin et des cartes de
mission : chaque lieu du jeu photographié par le moteur lui-même
(`tools/_lieux.html`), donc avec les mêmes décors, lumière et ciel qu'en
combat. Le lieu d'une mission vient de `js/engine/scene/scene-map.js`,
le nom du fichier de `js/data/lieux.js` (ex. `abidjan-cour-nuit.webp`).

## Refaire une photo

1. Lancer un serveur à la racine du jeu : `python3 -m http.server 8123`.
2. Ouvrir `http://localhost:8123/tools/_lieux.html?m=m1&mode=duel&cam=0,2.5,1.5&tgt=0,-9,2.3&fov=0.85`
   dans une fenêtre de 1280 × 720, attendre que le titre de l'onglet passe
   à `DONE`, puis faire une capture.
   - `m` : une mission du lieu ; `cam` / `tgt` : position et visée
     (mètres, depuis le centre de l'arène : x, profondeur, hauteur).
   - `cast=TARINE:0:1.2:0,KAREN:-1.8:0.3:0.35` : personnages (clé, x, y,
     orientation en radians).
3. Convertir en WebP (qualité 72). Les lieux de nuit sont éclaircis
   (`eq=gamma=1.45:saturation=1.1`) pour rester lisibles derrière le texte.

`equipe.webp` (écran titre, sauvegardes, hub) : l'équipe réunie dans la
cour de Marcory, au crépuscule.
