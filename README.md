# Pierre et Force — L'Éveil (v2, moteur PixiJS)

Refonte complète du moteur de jeu : rendu PixiJS (vue du dessus, glow additif,
sans aucune image externe), interface HTML/CSS entièrement redessinée dans le
style « Pixels of Force », et architecture en modules séparés (fini le fichier
`index.html` monolithique de 10 000 lignes).

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
syntaxe) : écran titre → hub → déploiement → combat, avec capture d'écran et
vérification zéro erreur JS à chaque étape, en desktop et en mobile (390px).

- **Toutes les données d'origine sont intactes** : 50 missions, 14 actes, tout
  le texte narratif, les 7 champions avec leurs sorts, 18 objets, 24 succès —
  extraits programmatiquement depuis l'ancien `index.html`, rien retapé, rien
  perdu.
- **Rendu PixiJS réel** : terrain procédural (tuiles, lane, buissons), unités
  en formes géométriques avec glow additif coloré par champion, ombres
  portées, projectiles et impacts avec particules, texte de dégâts flottant.
- **Simulation de combat jouable** : mouvement clavier (flèches/ZQSD) **et
  joystick tactile** (glisser le pouce en bas à gauche de l'écran — testé en
  contexte tactile émulé, le déplacement répond correctement), attaque de
  base automatique (mêlée ou à distance selon le champion), IA simple
  d'engagement, vagues de sbires et tours en mode Siège, tours de score en
  mode Arène. Testé en combat headless : le mode Siège se résout correctement
  (victoire/défaite selon le nexus détruit), le mode Arène est gagnable de
  façon fiable avec une équipe complète.
- **Interface complète** : hub avec les 50 missions réelles (verrouillage/
  déverrouillage fonctionnel), écran de déploiement avec sélection d'alliés,
  HUD de combat (vie/mana/sorts/objectif/minicarte), écran de fin avec
  récompenses. Responsive vérifié jusqu'à 390px de large.
- **Pierres élémentaires conformes au roman** : les arbres de talents utilisent
  maintenant Eau / Terre / Feu / Air / Éveil (métaphysique-schismariat) —
  exactement la terminologie de *De Pierre et de Force*, remplaçant l'ancien
  nom générique « Pierre du Vide ».

## Ce qui reste à construire

Pour rester honnête sur l'ampleur du travail : ceci est une base solide et
vraiment jouable, pas un portage 1:1 complet de l'ancien moteur (944 lignes de
`core.js` original). Prochaines couches, dans l'ordre où je les attaquerais :

1. **Sorts actifs (Q/W/E/R)** — les données existent déjà entièrement dans
   `js/data/champions.js` (`CHAMPS[key].abil`), il reste à câbler les
   cooldowns, les visées, les zones d'effet et les inputs clavier/tactile.
2. **Objets et boutique** — `js/data/items.js` contient déjà tous les objets
   et talents ; il manque l'écran d'achat et l'application des stats en jeu.
3. **Mode Défense et Boss** — actuellement seuls Siège et Arène sont
   simulés ; Défense et Boss utilisent la même structure `Sim` mais avec des
   règles différentes à ajouter dans `js/game/sim.js`.
4. **Minimap active**, **Faille (mode infini)**, **succès et quêtes**,
   **système de slots de sauvegarde multiples**.

## Structure du projet

```
index.html              point d'entrée, charge PixiJS depuis cdnjs
css/
  tokens.css             palette, typographie, panneaux de base
  layout.css              structure des écrans
  components.css          cartes de mission, portraits, badges
  hud.css                  HUD de combat (+ media query mobile)
js/
  data/
    campaign.js            50 missions, texte narratif complet
    champions.js            7 champions, stats et sorts
    items.js                 objets, arbres de talents, reliques
    progression.js           difficultés, succès, thèmes visuels
  engine/
    renderer.js              app PixiJS, calques, caméra (bornée aux limites de la carte)
    textures.js               textures procédurales (glow, ombres, bruit)
    tilemap.js                 terrain procédural par mode de mission
    unit-view.js                représentation visuelle d'une unité
    effects.js                   projectiles, impacts, texte de dégâts
  game/
    sim.js                       simulation de combat (mouvement, IA, dégâts)
    match.js                      orchestrateur (relie Sim + Renderer + Tilemap)
    state.js                       sauvegarde (localStorage)
  ui/
    screens.js, hub.js, deploy.js, combat-hud.js, end.js
  main.js                          bootstrap de l'application
assets/
  logo.png                          ton logo Pierre et Force
```

Chaque fichier fait entre 50 et 200 lignes — facile à ouvrir, comprendre et
modifier un système à la fois, contrairement à l'ancien fichier unique.
