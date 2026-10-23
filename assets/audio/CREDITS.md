# Crédits audio — Pierre et Force

Tous les sons du jeu sont de vrais enregistrements ou des compositions,
publiés sous licence **CC0 1.0 (domaine public)** — sauf ArcLight (Matthew Pablo, CC-BY 3.0) et la Fantasy Sound Effects Library (Little Robot Sound Factory, CC-BY 3.0), dont les auteurs doivent être crédités (générique de fin du prologue). Pour les autres, aucune attribution
n'est exigée, mais on crédite leurs auteurs ici. Aucun son n'est
synthétisé par le jeu.

Les fichiers ont été convertis en MP3, leur volume égalisé (musique à
−16 LUFS, bruitages normalisés en crête) et le silence de début retiré
pour les bruitages.

## Musique (`music/`)

| Fichier | Morceau | Auteur | Source |
|---|---|---|---|
| menu.mp3 | Tribal | Of Far Different Nature | https://opengameart.org/content/tribal |
| combat_manganda.mp3 | March of Manganda | eldritch-grim | https://opengameart.org/content/march-of-manganda |
| combat_battle_a.mp3 | Battle Theme A | cynicmusic | https://opengameart.org/content/battle-theme-a |
| combat_battlegrounds.mp3 | Fantasy – Battlegrounds (remastered) | doge | https://opengameart.org/content/fantasy-battlegrounds |
| duel.mp3 | Determined Pursuit (epic orchestra loop) | emmama | https://opengameart.org/content/determined-pursuit-epic-orchestra-loop |
| boss.mp3 | Epic Boss Battle | Juhani Junkala (subspaceaudio) | https://opengameart.org/content/boss-battle-music |
| victoire.mp3 | Medieval: Victory Theme | randommind | https://opengameart.org/content/medieval-victory-theme |
| defaite.mp3 | Medieval: Defeat Theme | randommind | https://opengameart.org/content/medieval-defeat-theme |
| prologue.mp3 (0:00–1:01) | Epic Endgame Cinematic | cynicmusic (CC0) | https://opengameart.org/content/epic-endgame-cinematic |
| prologue.mp3 (1:01–2:31) | ArcLight — Epic Orchestral Rock Soundtrack | Matthew Pablo, www.matthewpablo.com (**CC-BY 3.0**, attribution requise) | https://opengameart.org/content/arclight-epic-orchestralrock-soundtrack |
| prologue.mp3 (2:31–3:04) | Storyboard | iamoneabe (CC0) | https://opengameart.org/content/storyboard |

## Bruitages (`sfx/`)

| Sons du jeu | Pack | Auteur | Source |
|---|---|---|---|
| coup_leger, coup_lourd, chute, elimination, gong, recrue, round_gagne, round_perdu | Impact Sounds | Kenney | https://kenney.nl/assets/impact-sounds |
| esquive (tissu), ui_achat (pièces) | RPG Audio | Kenney | https://kenney.nl/assets/rpg-audio |
| ui_clic | Interface Sounds | Kenney | https://kenney.nl/assets/interface-sounds |
| elan, tir (sifflements) | Swishes Sound Pack | artisticdude | https://opengameart.org/content/swishes-sound-pack |
| lame, garde (épée, chocs de lames) | 20 Sword Sound Effects (Attacks and Clashes) | StarNinjas | https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes |
| sort, impact_sol, ui_achat (pièces) | 80 CC0 RPG SFX | rubberduck | https://opengameart.org/content/80-cc0-rpg-sfx |
| soin, niveau | Cure Magic | Someoneman | https://opengameart.org/content/cure-magic |
| ultime | Earth Element Magic Spell | qubodup | https://opengameart.org/content/earth-element-magic-spell |
| elan, esquive (souffles, tissu) | RPG Sound Pack | artisticdude (CC0) | https://opengameart.org/content/rpg-sound-pack |
| sort, ultime, elimination (couches magiques) | Fantasy Sound Effects Library | Little Robot Sound Factory, **CC-BY 3.0, attribution obligatoire** — www.littlerobotsoundfactory.com | https://opengameart.org/content/fantasy-sound-effects-library |
| chute, impact_sol (terre, débris) | Fantasy Sound Effects Library (pas sur la terre) | Little Robot Sound Factory, CC-BY 3.0 | idem |

Les bruitages de combat sont fabriqués en couches par `tools/sfx/build_sfx.py` : les échantillons ci-dessus (attaque, matière) et des couches synthétiques (corps grave, souffles, résonances métalliques, réverbération stéréo) générées par le script lui-même.

## Voix des personnages (assets/audio/voix/)

Synthèse hors ligne, fichiers intégrés au jeu. Détails : tools/voix/README.md.

- Moteur : Chatterbox multilingue — Resemble AI, licence MIT.
- Timbres de référence : Multilingual LibriSpeech (français), OpenSLR 94 —
  licence CC-BY 4.0 (Pratap et al., 2020), via le modèle Piper
  `fr_FR-mls-medium` (rhasspy/piper-voices).
- Langues : français (`voix/`), anglais (`voix/en/`), portugais du Brésil
  (`voix/pt/`) et espagnol (`voix/es/`). Chaque personnage garde le même
  timbre de référence dans toutes les langues (clonage multilingue).
- Contrôle qualité : transcription automatique faster-whisper (modèle
  Whisper « small », OpenAI, licence MIT) dans la langue de la réplique.
