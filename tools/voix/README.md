# Voix des personnages

Chaque personnage parle avec sa propre voix. Les répliques du récit et les
cris de combat sont des fichiers MP3 intégrés au jeu
(`assets/audio/voix/`), donc lisibles sans connexion.

- Langues : français à la racine de `voix/`, puis `voix/en/`, `voix/pt/`
  (portugais du Brésil) et `voix/es/` (espagnol), avec les mêmes noms de
  fichiers. Le jeu joue la voix de la langue choisie, sinon la française.
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

Les réglages d'Adandé, Dingane, la Reine Cendre, le Chronophage et
Skygge (et `SKYGGE_OMBRE`, sa voix transformée) ont été retrouvés après
coup à partir de leurs MP3 français : locuteur Piper le plus proche
(empreinte vocale de Chatterbox), hauteur d'après la fréquence
fondamentale, effet choisi parmi ceux des autres personnages.

## Autres langues (pt, es)

Le texte à prononcer est dans `textes/<langue>.json` (`recit/<id>` et
`combat/<CLE>_<moment>` → texte), tiré de `js/i18n/<langue>-content.js`
et du prologue (`js/ui/intro.js`), incises du narrateur retirées
(« diz Sam », « dice Sam »…), nombres écrits en toutes lettres. Les cris
de combat y sont traduits directement.

    cp tools/voix/voix.json $W/voicecfg.json
    node tools/voix/taches_langue.mjs pt $W           # $W/jobs.json
    LANGID=pt python tools/voix/generer.py $W          # -> assets/audio/voix/pt/

`LANGID` (`fr` par défaut) règle la langue de la synthèse et de la
transcription de contrôle ; hors français, la sortie va dans
`voix/<langue>/`. Pour aller plus vite, lancer plusieurs générateurs sur
le même `$W` : `WORKER=0/2 THREADS=2` et `WORKER=1/2 THREADS=2` (avec
`OMP_NUM_THREADS=2`), environ 5 Go de mémoire chacun. Pour refaire des
répliques : `python tools/voix/generer.py $W id1,id2 3` (garde
l'ancienne prise si la nouvelle n'est pas meilleure).
