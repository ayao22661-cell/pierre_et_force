# Voix des personnages

Chaque personnage parle avec sa propre voix. Les répliques du récit et les
cris de combat sont des fichiers MP3 intégrés au jeu
(`assets/audio/voix/`), donc lisibles sans connexion.

- `recit/<mission>_<partie>_<ligne>.mp3` : dialogues (parties : `av` avant la
  mission, `vi` victoire, `de` défaite, `nd` ouverture d'acte).
- `combat/<CHAMPION>_<moment>.mp3` : cris (`debut`, `ultime`, `victoire`, `defaite`).
- `js/data/voices.js` : manifeste généré (qui dit quelle réplique).

## Production

Les voix sont synthétisées hors ligne avec **Chatterbox multilingue**
(Resemble AI, licence MIT). Le timbre de chaque personnage est cloné à
partir d'une voix du corpus **Multilingual LibriSpeech français**
(CC-BY 4.0, via le modèle Piper `fr_FR-mls-medium`), puis réglé : hauteur,
intensité (« exaggeration »), et effets (compression, grave renforcé, écho
pour les figures légendaires ou surnaturelles). Voir `voix.json`.

Chaque réplique est générée jusqu'à trois fois ; une transcription
automatique (faster-whisper) garde la prise la plus fidèle au texte.

Depuis la racine du dépôt, avec un dossier de travail `$W` contenant
`tts/spk_<n>.wav` (voix de référence Piper) et `ff/ffmpeg` :

    node tools/voix/attribuer.mjs $W/attrib.json   # repère les répliques et qui parle
    cp tools/voix/voix.json $W/voicecfg.json          # voix, corrections, cris de combat
    node tools/voix/taches.mjs $W                     # liste des fichiers à produire
    python tools/voix/generer.py $W                   # synthèse (reprend là où elle s'est arrêtée)
    node tools/voix/manifeste.mjs $W                  # régénère js/data/voices.js

Dans `voix.json`, `spk` corrige l'attribution automatique (index de
réplique → personnage) et `speech` le texte prononcé quand l'incise du
narrateur (« dit-il, amer ») a été mal retirée.
