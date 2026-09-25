// ============================================================
// MAIN — bootstrap de l'application.
// ============================================================
import { Renderer } from './engine/renderer.js';
import { Match } from './game/match.js';
import { preloadAllPortraits } from './engine/portraits.js';
import { loadSave, writeSave, recordVictory, recordDefeat, recordDefiVictory } from './game/state.js';
import { goTo, toast } from './ui/screens.js';
import { buildHub, updateHubHeader } from './ui/hub.js';
import { renderDeploy } from './ui/deploy.js';
import { CombatHud } from './ui/combat-hud.js';
import { renderEnd } from './ui/end.js';
import { playStory } from './ui/story.js';
import { CAMPAIGN } from './data/campaign.js';
import { renderSlots } from './ui/slots.js';
import { audio } from './engine/audio.js';

// Préchargement des portraits 3D (capture des modèles GLB, voir
// engine/character-portrait-3d.js). Le Hub s'affiche IMMÉDIATEMENT
// avec des portraits provisoires (silhouette neutre) dès le clic sur
// Commencer — plus la peine d'attendre le téléchargement des ~44 Mo
// de modèles 3D avant de voir quoi que ce soit. Une fois chaque
// portrait prêt en arrière-plan, le Hub se repeint pour les afficher.
const assetsReady = preloadAllPortraits();

let save = loadSave();
let renderer = null;
let match = null;
let hud = null;
let currentMission = null;
let currentModeLabel = 'SIÈGE';

function toHub(){
  audio.music('menu');
  match?.destroy(); match = null;
  hud?.destroy(); hud = null;
  goTo('screen-hub');
  buildHub(save, onSelectMission);
  updateHubHeader(save);
}

/** Acte d'une mission de campagne (null pour un défi ou un duel libre). */
function acteOf(mission){ return CAMPAIGN.find(a => a.missions.includes(mission)) || null; }

async function onSelectMission(mission, modeLabel){
  currentMission = mission;
  currentModeLabel = modeLabel;
  // Récit d'avant-mission (et ouverture de l'acte pour sa première
  // mission), une fois par sélection : « Réessayer » ne le rejoue pas.
  const acte = acteOf(mission);
  if(acte && !mission.isDefi){
    if(acte.missions[0] === mission && acte.narration_debut){
      await playStory({ lines: acte.narration_debut, mid: acte.id, where: 'narration_debut', title: `${acte.label} — ${acte.titre}`, bg: 'assets/illus/pf-12.webp' });
    }
    await playStory({ lines: mission.narr_avant, mid: mission.id, where: 'narr_avant', title: `${mission.num}. ${mission.name}`, bg: 'assets/illus/pf-12.webp' });
    if(currentMission !== mission) return;
  }
  goTo('screen-deploy');
  renderDeploy(mission, modeLabel, save, launchMatch);
  assetsReady.then(() => {
    if(document.getElementById('screen-deploy')?.classList.contains('active') && currentMission === mission){
      renderDeploy(mission, modeLabel, save, launchMatch);
    }
  });
}

function launchMatch(cfg){
  // « Réessayer » relance directement : la partie précédente doit d'abord
  // être entièrement retirée (unités 3D, décor, effets, interface).
  match?.destroy(); match = null;
  hud?.destroy(); hud = null;
  save.lastChamp = cfg.champ;
  writeSave(save);
  goTo('screen-game');
  // Musique du combat : duel, boss, ou affrontement de campagne.
  audio.music(cfg.mode === 'duel' ? 'duel' : cfg.mode === 'boss' ? 'boss' : 'combat');

  if(!renderer){
    renderer = new Renderer(document.getElementById('game-mount'));
  }
  // Le combat ne dépend QUE du moteur de rendu (renderer.ready) — les
  // portraits de l'UI (hub/codex/déploiement) sont une préoccupation
  // totalement séparée et ne doivent jamais retarder ni bloquer
  // l'entrée en combat, même s'ils ne sont pas encore prêts.
  renderer.ready.then(() => {
    match = new Match(renderer, {
      ...cfg,
      onEnd: (res) => onMatchEnd(res),
    });
    hud = new CombatHud(renderer, match, () => toHub());
    match._hud = hud;
    hud.announce(`${currentMission.num}. ${currentMission.name}`);
    window.__pf = { match, renderer };
  });
}

function onMatchEnd({ victory }){
  audio.music(victory ? 'victoire' : 'defaite');
  if(victory){
    // Un défi est rejouable : il ne compte pas dans la progression de campagne.
    if(currentMission.isDefi) recordDefiVictory(save, currentMission.id);
    else recordVictory(save, currentMission.id);
  }
  else recordDefeat(save);
  setTimeout(async () => {
    const m = currentMission;
    if(acteOf(m) && !m.isDefi){
      const where = victory ? 'narr_victoire' : 'narr_defaite';
      await playStory({ lines: m[where], mid: m.id, where, title: victory ? 'VICTOIRE' : 'DÉFAITE', bg: 'assets/illus/pf-14.webp' });
    }
    goTo('screen-end');
    renderEnd(victory, currentMission, save, match?.sim, toHub, () => {
      goTo('screen-deploy');
      renderDeploy(currentMission, currentModeLabel, save, launchMatch);
    });
  }, 600);
}

/** Choix d'un emplacement (nouvelle partie ou reprise) → charge cette sauvegarde et entre dans le Hub. */
function pickSlot(){
  save = loadSave();
  toHub();
  // Dès que les vrais rendus 3D sont prêts, on repeint le Hub pour
  // remplacer les silhouettes provisoires — sans bloquer l'affichage
  // initial. Si le joueur a déjà quitté le Hub entre-temps, ce
  // repaint est sans effet visible (buildHub() ne fait que remplir
  // des conteneurs DOM existants).
  assetsReady.then(() => {
    if(document.getElementById('screen-hub')?.classList.contains('active')){
      buildHub(save, onSelectMission);
      updateHubHeader(save);
    }
  });
}

// Son : le navigateur n'autorise l'audio qu'après un geste du joueur.
// Chaque bouton cliqué fait son petit bruit d'interface.
document.addEventListener('pointerdown', () => audio.unlock(), { once: true, capture: true });
document.addEventListener('click', (ev) => { if(ev.target.closest('button')) audio.sfx('ui_clic'); }, true);
audio.music('menu');

const btnStart = document.getElementById('btn-start');
btnStart.addEventListener('click', () => {
  goTo('screen-slots');
  renderSlots(pickSlot);
});
document.getElementById('btn-slots-back')?.addEventListener('click', () => goTo('screen-title'));

// Retour à l'écran de sauvegardes depuis l'intérieur du jeu (bouton dans
// l'onglet Profil, ui/hub.js) — un évènement plutôt qu'un import direct,
// pour éviter une dépendance circulaire entre main.js et ui/hub.js.
window.addEventListener('pf-go-to-slots', () => {
  goTo('screen-slots');
  renderSlots(pickSlot);
});

document.getElementById('btn-hub-back').addEventListener('click', toHub);
