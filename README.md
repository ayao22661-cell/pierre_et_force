# Pierre et Force — L'Éveil (v2, moteur PixiJS)

Refonte complète du moteur de jeu : rendu PixiJS (vue du dessus, glow additif),
de vrais personnages dessinés (portraits SVG procéduraux, pas des images
chargées), interface HTML/CSS entièrement redessinée dans le style « Pixels
of Force », et architecture en modules séparés (fini le fichier `index.html`
monolithique de 10 000 lignes).

## Comment lancer le jeu

Ouvrir `index.html` via un petit serveur local (pas en double-clic direct,
les modules ES ont besoin de http:// ou https://) :

```bash
cd pierre-et-force
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Ou héberger le dossier tel quel sur Vercel/Netlify/n'importe quel hébergeur
statique — aucune étape de build n'est nécessaire.

**GitHub Pages** : ça fonctionne directement. Tous les chemins internes
(`css/…`, `js/…`, `assets/…`) sont relatifs, donc ça marche aussi bien à la
racine d'un repo (`username.github.io`) que dans un sous-dossier
(`username.github.io/nom-du-repo/`). Il suffit d'activer Pages dans les
paramètres du repo sur la branche où se trouve ce dossier.

## Ce qui fonctionne, vérifié en conditions réelles

J'ai testé ce projet dans un vrai navigateur (Chromium headless, pas juste en
syntaxe) : écran titre → hub (les 4 onglets) → déploiement → combat, avec
capture d'écran et vérification zéro erreur JS à chaque étape, en desktop et
en mobile (390px).

- **Toutes les données d'origine sont intactes** : 50 missions, 14 actes, tout
  le texte narratif (y compris le journal de Tarine mission par mission), les
  7 champions avec leurs sorts, 18 objets, 24 succès — extraits
  programmatiquement depuis l'ancien `index.html`, rien retapé, rien perdu.
- **De vrais personnages dessinés, pas des formes géométriques** : un système
  de portraits 100% SVG (déterministe, aucune image chargée) récupéré de
  l'ancien moteur — peau, vêtements, coiffure, yeux, marques, accessoires, et
  des formes spéciales pour les entités non humaines (les Émissaires de
  Sgrün : liquide, pierre, vent, ombre). **20 personnages** au total, bien
  au-delà des 7 champions jouables. En combat, chaque champion affiche son
  vrai visage en médaillon circulaire avec glow et anneau d'équipe — les
  sbires anonymes restent en formes géométriques simples.
- **Rendu PixiJS réel** : terrain procédural (tuiles, lane, buissons), glow
  additif, ombres portées, projectiles et impacts avec particules, texte de
  dégâts flottant.
- **Simulation de combat jouable** : mouvement clavier (flèches/ZQSD) et
  joystick tactile (glisser le pouce en bas à gauche de l'écran — testé en
  contexte tactile émulé), attaque de base automatique (mêlée ou à distance
  selon le champion), IA simple d'engagement, vagues de sbires et tours en
  mode Siège, tours de score en mode Arène. Testé en combat headless : le
  mode Siège se résout correctement (victoire/défaite selon le nexus
  détruit), le mode Arène est gagnable de façon fiable avec une équipe
  complète.
- **Hub à 4 onglets, la profondeur retrouvée** :
  - **Missions** — les 50 missions, verrouillage/déverrouillage fonctionnel
  - **Héros** — le codex complet des 20 personnages (alliés, Empire, figures
    légendaires), filtrable par camp, avec fiche détaillée (bio, titre) au clic
  - **Profil** — portrait et progression de Tarine (XP, PV/ATK de base,
    missions terminées, alliés débloqués, détail acte par acte)
  - **Journal** — les pensées de Tarine, débloquées mission après mission,
    tirées du texte narratif original (`journal_victoire`)
- **Portraits partout** : déploiement (joueur + alliés), HUD de combat, hub —
  plus aucune initiale générique dans un cercle.
- **Pierres élémentaires conformes au roman** : les arbres de talents utilisent
  Eau / Terre / Feu / Air / Éveil (métaphysique-schismariat) — exactement la
  terminologie de *De Pierre et de Force*, remplaçant l'ancien nom générique
  « Pierre du Vide ».

## Ce qui reste à construire

Pour rester honnête sur l'ampleur du travail : ceci est une base solide et
vraiment jouable, pas un portage 1:1 complet de l'ancien moteur (944 lignes de
`core.js` original). Prochaines couches, dans l'ordre où je les attaquerais :

1. **Sorts actifs (Q/W/E/R)** — les données existent déjà entièrement dans
   `js/data/champions.js` (`CHAMPS[key].abil`), il reste à câbler les
   cooldowns, les visées, les zones d'effet et les inputs clavier/tactile.
2. **Objets et boutique** — `js/data/items.js` contient déjà tous les objets
   et talents ; il manque l'écran d'achat et l'application des stats en jeu.
3. **Onglet Éveil (talents)** — `js/data/items.js` a les 5 arbres complets
   (Eau/Terre/Feu/Air/Éveil), il manque l'écran de répartition des points.
4. **Mode Défense et Boss** — actuellement seuls Siège et Arène sont
   simulés ; Défense et Boss utilisent la même structure `Sim` mais avec des
   règles différentes à ajouter dans `js/game/sim.js`.
5. **Minimap active**, **Faille (mode infini)**, **succès et quêtes**,
   **système de slots de sauvegarde multiples**.

## Structure du projet

```
index.html              point d'entrée, charge PixiJS depuis cdnjs
css/
  tokens.css             palette, typographie, panneaux de base
  layout.css              structure des écrans, onglets du hub
  components.css          cartes de mission, portraits, codex, journal, profil
  hud.css                  HUD de combat (+ media query mobile)
js/
  data/
    campaign.js            50 missions, texte narratif complet
    champions.js            7 champions jouables, stats et sorts
    cast.js                  20 personnages du récit (bios, rôles, apparence)
    items.js                 objets, arbres de talents, reliques
    progression.js           difficultés, succès, thèmes visuels
  engine/
    renderer.js              app PixiJS, calques, caméra (bornée aux limites de la carte)
    textures.js               textures procédurales (glow, ombres, bruit)
    tilemap.js                 terrain procédural par mode de mission
    portrait.js                 générateur de portraits 100% SVG
    portraits.js                cache + pont vers cast.js
    unit-view.js                représentation visuelle d'une unité (portrait en combat)
    effects.js                   projectiles, impacts, texte de dégâts
  game/
    sim.js                       simulation de combat (mouvement, IA, dégâts)
    match.js                      orchestrateur (relie Sim + Renderer + Tilemap)
    state.js                       sauvegarde (localStorage)
  ui/
    screens.js, hub.js (4 onglets), deploy.js, combat-hud.js, end.js
  main.js                          bootstrap + préchargement des portraits
assets/
  logo.png                          ton logo Pierre et Force
```

Chaque fichier fait entre 50 et 250 lignes — facile à ouvrir, comprendre et
modifier un système à la fois, contrairement à l'ancien fichier unique.
