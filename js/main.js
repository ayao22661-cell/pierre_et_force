// ============================================================
// MAIN — bootstrap de l'application.
// ============================================================
import { Renderer } from './engine/renderer.js';
import { Match } from './game/match.js';
import { preloadPortraits } from './engine/unit-view.js';
import { PLAYABLE } from './data/champions.js';
import { loadSave, writeSave, recordVictory, recordDefeat } from './game/state.js';
import { goTo, toast } from './ui/screens.js';
import { buildHub, updateHubHeader } from './ui/hub.js';
import { renderDeploy } from './ui/deploy.js';
import { CombatHud } from './ui/combat-hud.js';
import { renderEnd } from './ui/end.js';

// Démarré dès le chargement du script : le temps que le joueur traverse
// titre → hub → déploiement, les 7 portraits ont largement eu le temps
// de se décoder. launchMatch() attend quand même cette promesse par
// sécurité (elle est déjà résolue dans l'immense majorité des cas).
const portraitsReady = preloadPortraits(PLAYABLE);

let save = loadSave();
let renderer = null;
let match = null;
let hud = null;
let currentMission = null;

function toHub(){
  match?.destroy(); match = null;
  hud?.destroy(); hud = null;
  goTo('screen-hub');
  buildHub(save, onSelectMission);
  updateHubHeader(save);
}

function onSelectMission(mission, modeLabel){
  currentMission = mission;
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
  Promise.all([renderer.ready, portraitsReady]).then(() => {
    match = new Match(renderer, {
      ...cfg,
      onEnd: (res) => onMatchEnd(res),
    });
    hud = new CombatHud(renderer, match, () => toast('Pause — bientôt disponible'));
    hud.announce(`${currentMission.num}. ${currentMission.name}`);
    window.__pf = { match, renderer }; // hook de debug — sans effet sur le jeu
  });
}

function onMatchEnd({ victory }){
  if(victory) recordVictory(save, currentMission.id);
  else recordDefeat(save);
  setTimeout(() => {
    goTo('screen-end');
    renderEnd(victory, currentMission, save, toHub, () => {
      goTo('screen-deploy');
      renderDeploy(currentMission, 'SIÈGE', save, launchMatch);
    });
  }, 600);
}

document.getElementById('btn-start').addEventListener('click', () => {
  save = loadSave();
  toHub();
});
document.getElementById('btn-hub-back').addEventListener('click', toHub);
