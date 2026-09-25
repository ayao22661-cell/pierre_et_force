import fs from 'fs';
const S = process.argv[2];
const jobs = JSON.parse(fs.readFileSync(S + '/jobs.json'));
const recit = {}; const combat = {};
for(const j of jobs){
  if(!fs.existsSync(`assets/audio/voix/${j.dir}/${j.id}.mp3`)) continue;
  if(j.dir === 'recit') recit[j.id] = j.spk; else { const [k, t] = [j.id.slice(0, j.id.lastIndexOf('_')), j.id.slice(j.id.lastIndexOf('_') + 1)]; (combat[k] ||= []).push(t); }
}
const src = `// ============================================================
// VOIX — répliques doublées (fichier généré, voir tools/voix/README.md).
// Chaque personnage a sa propre voix, enregistrée dans
// assets/audio/voix/ : recit/<mission>_<partie>_<ligne>.mp3 pour les
// dialogues, combat/<CHAMPION>_<moment>.mp3 pour les cris de combat.
// ============================================================

/** Partie du récit -> code utilisé dans le nom des fichiers. */
export const STORY_CODE = { narration_debut: 'nd', narration_fin: 'nf', narr_avant: 'av', narr_victoire: 'vi', narr_defaite: 'de' };

/** Nom affiché des personnages sans fiche dans le Codex. */
export const VOICE_NAMES = { PNJ_H: 'Le prêteur', PNJ_F: 'La doyenne', PNJ_VIEUX: "L'Ancien", KEITA: 'Général Keïta', DARK: "L'Ombre", KANKOU: 'Kankou Moussa' };

/** Réplique -> personnage qui la dit (${Object.keys(recit).length} répliques). */
export const RECIT_VOICES = ${JSON.stringify(recit, null, 0).replace(/","/g, '",\n  "').replace('{', '{\n  ').replace(/}$/, '\n}')};

/** Cris de combat disponibles par champion : debut, ultime, victoire, defaite. */
export const COMBAT_VOICES = ${JSON.stringify(combat)};
`;
fs.writeFileSync('js/data/voices.js', src);
console.log(Object.keys(recit).length, Object.keys(combat).length);
