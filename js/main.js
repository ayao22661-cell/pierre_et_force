// ============================================================
// MAIN — bootstrap de l'application.
// ============================================================
import { Renderer } from './engine/renderer.js';
import { Match } from './game/match.js';
import { preloadPortraits } from './engine/unit-view.js';
import { preloadArtTextures } from './engine/tilemap.js';
import { PLAYABLE } from './data/champions.js';
import { loadSave, writeSave, recordVictory, recordDefeat } from './game/state.js';
import { goTo, toast } from './ui/screens.js';
import { buildHub, updateHubHeader } from './ui/hub.js';
import { renderDeploy } from './ui/deploy.js';
import { CombatHud } from './ui/combat-hud.js';
import { renderEnd } from './ui/end.js';

// Préchargement parallèle : portraits (compatibilité) + images d'art
const portraitsReady = preloadPortraits(PLAYABLE);
const artReady = preloadArtTextures();
const assetsReady = Promise.all([portraitsReady, artReady]);

let save = loadSave();
let renderer = null;
let match = null;
let hud = null;
let currentMission = null;
let currentModeLabel = 'SIÈGE';

function toHub(){
  match?.destroy(); match = null;
  hud?.destroy(); hud = null;
  goTo('screen-hub');
  buildHub(save, onSelectMission);
  updateHubHeader(save);
}

function onSelectMission(mission, modeLabel){
  currentMission = mission;
  currentModeLabel = modeLabel;
  goTo('screen-deploy');
  renderDeploy(mission, modeLabel, save, launchMatch);
}

function launchMatch(cfg){
  save.lastChamp = cfg.champ;
  writeSave(save);
  goTo('screen-game');

  if(!renderer){
    renderer = new Renderer(document.getElementById('game-mount'));
  }
  Promise.all([renderer.ready, assetsReady]).then(() => {
    match = new Match(renderer, {
      ...cfg,
      onEnd: (res) => onMatchEnd(res),
    });
    hud = new CombatHud(renderer, match, () => toast('Pause — bientôt disponible'));
    match._hud = hud;
    hud.announce(`${currentMission.num}. ${currentMission.name}`);
    window.__pf = { match, renderer };
  });
}

function onMatchEnd({ victory }){
  if(victory) recordVictory(save, currentMission.id);
  else recordDefeat(save);
  setTimeout(() => {
    goTo('screen-end');
    renderEnd(victory, currentMission, save, match?.sim, toHub, () => {
      goTo('screen-deploy');
      renderDeploy(currentMission, currentModeLabel, save, launchMatch);
    });
  }, 600);
}

document.getElementById('btn-start').addEventListener('click', () => {
  save = loadSave();
  toHub();
});
document.getElementById('btn-hub-back').addEventListener('click', toHub);
