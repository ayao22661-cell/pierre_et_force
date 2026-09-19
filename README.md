# Pierre et Force — L'Éveil (v3+, moteur PixiJS)

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
(`css/…`, `js/…`, `assets/…`) sont relatifs.

## Ce qui fonctionne, vérifié en conditions réelles

- **Toutes les données d'origine sont intactes** : 50 missions, 14 actes, tout
  le texte narratif, les 7 champions avec leurs sorts, 18 objets, 24 succès.
- **De vrais personnages dessinés** : portraits 100% SVG, 20 personnages au total.
- **Rendu PixiJS réel** : terrain procédural, glow additif, ombres portées,
  projectiles et impacts avec particules, texte de dégâts flottant.
- **Simulation de combat jouable** : mouvement clavier (flèches/ZQSD) et
  joystick tactile, attaque de base automatique, IA simple, vagues de sbires.
- **Sorts actifs Q/W/E/R câblés** : les inputs clavier (A/Z/E/R) et les
  boutons du HUD déclenchent les sorts de chaque champion via `abilities.js`.
  Tous les types sont couverts : shot, dash, blink, circle, cone, nova, zone,
  ally (soin ciblé), summon (lieutenant), line (ultimes longue portée).
- **Hub à 6 onglets** :
  - **Missions** — 50 missions, verrouillage/déverrouillage fonctionnel
  - **Héros** — codex des 20 personnages, filtrable par camp
  - **Profil** — portrait et progression de Tarine
  - **Journal** — les pensées de Tarine, débloquées mission après mission
  - **Éveil** *(nouveau)* — 5 arbres de talents (Eau/Terre/Feu/Air/Éveil),
    points dépensables au niveau, reset nœud par nœud, pips visuels par rang,
    prérequis d'arbre vérifiés, sauvegardé dans `localStorage`
  - **Boutique** *(nouveau)* — 18 objets en 3 tiers achetables avec les
    cauris gagnés en combat, stats affichées, craft visible, indicateur "possédé"
- **Minimap active** *(nouveau)* — canvas 2D mis à jour chaque frame : joueur
  (blanc), alliés (vert), ennemis (rouge), sbires, nexus et tours.
- **Fin de match enrichie** *(nouveau)* — XP, montée de niveau automatique,
  cauris, compteur d'éliminations, déblocage d'allié à la fin de chaque acte
  (Sam → Lundgren → Baba → Dark).

## Ce qui reste à construire

Pour rester honnête sur l'ampleur du travail — prochaines couches dans l'ordre :

1. ~~**Application des stats d'objets en combat**~~ ✅ — `js/game/bonuses.js`
   calcule la somme de tous les objets possédés et les applique à
   `makeChampionUnit`. Les stats ATK, PV, ARM, Mana, AS, MS sont injectées
   au lancement du combat pour le joueur et ses alliés.

2. ~~**Application des talents en combat**~~ ✅ — mêmes `computeBonuses`.
   Tous les effets passifs actifs : regen PV/s (`_tickResources`), vol de vie
   (`ls`), critique aléatoire, pénétration d'armure (`pen`), exec (+dmg < 40%
   PV), thorns (renvoi dégâts), revive (30% PV une fois), ccRes (réduction
   CC), shieldP/healP (bonus soins/boucliers), ultDmg (+dmg ultime), burn
   (DoT après sort), cdKill (−CDs à l'élim). Le HUD affiche un résumé compact
   des bonus actifs sous les barres HP/Mana.

3. **Mode Défense et Boss** — seuls Siège et Arène sont simulés. Défense
   et Boss utilisent la même structure `Sim` mais avec des règles différentes
   à ajouter dans `js/game/sim.js` (vagues défensives, HP de boss inflé).

4. **Onglet Éveil — niveau de sort** — les sorts ont 5 niveaux dans
   `champions.js` (`cd`, `dmg`, `heal`…), mais `abilities.js` utilise
   toujours `[0]` (niveau 1). Il faut lire `save.spellLevels[champ][slot]`
   et accéder au bon index du tableau.

5. **Minimap active en mode Siège** — la minimap affiche déjà les unités,
   mais elle ne dessine pas la lane ni les tours. Ajouter un fond schématique
   (ligne de lane, points tours/nexus) rendrait la carte lisible sans unités.

6. **Faille (mode infini)**, **succès et quêtes**, **système de slots de
   sauvegarde multiples** — non commencés.

## Structure du projet

```
index.html              point d'entrée, charge PixiJS depuis cdnjs
css/
  tokens.css             palette, typographie, panneaux de base
  layout.css             structure des écrans, onglets du hub
  components.css         cartes de mission, portraits, codex, boutique, éveil
  hud.css                HUD de combat (+ media query mobile)
js/
  data/
    campaign.js          50 missions, texte narratif complet
    champions.js         7 champions jouables, stats et sorts
    cast.js              20 personnages du récit (bios, rôles, apparence)
    items.js             objets, arbres de talents, reliques
    progression.js       difficultés, succès, thèmes visuels
  engine/
    renderer.js          app PixiJS, calques, caméra
    textures.js          textures procédurales
    tilemap.js           terrain procédural par mode de mission
    portrait.js          générateur de portraits 100% SVG
    portraits.js         cache + pont vers cast.js
    unit-view.js         représentation visuelle d'une unité
    effects.js           projectiles, impacts, texte de dégâts
    minimap.js           canvas minimap temps réel  ← nouveau
  game/
    sim.js               simulation de combat
    match.js             orchestrateur (Sim + Renderer + Tilemap)
    abilities.js         exécuteurs des sorts A/Z/E/R
    state.js             sauvegarde (localStorage)
  ui/
    screens.js
    hub.js               6 onglets (Missions/Héros/Profil/Journal/Éveil/Boutique)
    shop.js              onglets Éveil et Boutique  ← nouveau
    deploy.js
    combat-hud.js        HUD combat + minimap active
    end.js               fin de match enrichie (XP, level, kills, déblocage)
  main.js                bootstrap + préchargement
assets/
  logo.png
  art_battle1.png … art_battle3.png, art_divine.png, art_warrior.png
```

## Nouveau fichier : `js/game/bonuses.js`

Module sans dépendances côté rendu : lit `save.items` et `save.talents`,
additionne tous les deltas et multiplicateurs, et renvoie un objet `bns`
plat stocké sur chaque unité alliée. `makeChampionUnit` l'applique au
moment de la construction pour que les stats de base soient déjà les
stats finales — aucun calcul n'est nécessaire pendant la boucle de jeu
(sauf les effets à tick : regen, burn, lifesteal).
