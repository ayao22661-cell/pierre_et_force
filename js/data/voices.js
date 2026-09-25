// ============================================================
// VOIX — répliques doublées (fichier généré, voir tools/voix/README.md).
// Chaque personnage a sa propre voix, enregistrée dans
// assets/audio/voix/ : recit/<mission>_<partie>_<ligne>.mp3 pour les
// dialogues, combat/<CHAMPION>_<moment>.mp3 pour les cris de combat.
// ============================================================

/** Partie du récit -> code utilisé dans le nom des fichiers. */
export const STORY_CODE = { narration_debut: 'nd', narration_fin: 'nf', narr_avant: 'av', narr_victoire: 'vi', narr_defaite: 'de' };

/** Nom affiché des personnages sans fiche dans le Codex. */
export const VOICE_NAMES = { PNJ_H: 'Le prêteur', PNJ_F: 'La doyenne', PNJ_VIEUX: "L'Ancien", KEITA: 'Général Keïta', DARK: "L'Ombre", KANKOU: 'Kankou Moussa' };

/** Réplique -> personnage qui la dit (16 répliques). */
export const RECIT_VOICES = {
  "m1_av_2":"BABA_TUNDE",
  "m1_vi_2":"BABA_TUNDE",
  "m1_de_2":"FULGENCE",
  "m101_av_1":"FULGENCE",
  "m101_vi_2":"FULGENCE",
  "m102_vi_1":"FULGENCE",
  "m2_av_2":"FULGENCE",
  "m2_av_3":"KAREN",
  "m2_vi_2":"LUNDGREN",
  "m2_vi_3":"TARINE",
  "m2_vi_4":"LUNDGREN",
  "m2_de_2":"FULGENCE",
  "m104_av_1":"KAREN",
  "m104_de_1":"KAREN",
  "m3_vi_2":"KAREN",
  "m3_vi_3":"TARINE"
};

/** Cris de combat disponibles par champion : debut, ultime, victoire, defaite. */
export const COMBAT_VOICES = {};
