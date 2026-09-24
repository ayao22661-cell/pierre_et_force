// ============================================================
// LIEUX DES MISSIONS — quelle scène monter pour quelle mission.
// Tiré des briefs de campagne (js/data/campaign.js) et des défis.
// ============================================================

const M = {
  // ACTE I — Abidjan, la cour, le Banco, la maison de Marcory
  m1:  { biome: 'abidjan', setting: 'cour' },
  m2:  { biome: 'banco' },
  m3:  { biome: 'abidjan', setting: 'villa', night: true },
  // ACTE II — Royaume de l'Essence
  m4:  { biome: 'essence' },
  m5:  { biome: 'essence', variant: 'lac' },
  m6:  { biome: 'essence', variant: 'feu' },
  // ACTE III — Born Land puis retour à Abidjan
  m7:  { biome: 'born' },
  m8:  { biome: 'abidjan', setting: 'rue', night: true },
  m9:  { biome: 'abidjan', setting: 'rue' },
  // ACTE IV — Marcory, Cocody, Treichville
  m10: { biome: 'abidjan', setting: 'rue' },
  m11: { biome: 'abidjan', setting: 'villa', night: true },
  m12: { biome: 'abidjan', setting: 'marche', night: true },
  // ACTE V — Marcory
  m13: { biome: 'abidjan', setting: 'rue' },
  m14: { biome: 'abidjan', setting: 'rue' },
  m15: { biome: 'abidjan', setting: 'villa' },
  // ACTE VI — Pôle Nord
  m16: { biome: 'polar' }, m17: { biome: 'polar' }, m18: { biome: 'polar' },
  // ACTE VII — Mali
  m19: { biome: 'sahel' },
  m20: { biome: 'canyon', variant: 'cave' },
  m21: { biome: 'sahel' },
  // ACTE VIII — enquête à Abidjan
  m22: { biome: 'abidjan', setting: 'rue', night: true },
  m23: { biome: 'abidjan', setting: 'port', night: true },
  m24: { biome: 'abidjan', setting: 'cimetiere', night: true },
  // ACTE IX — la guerre d'Abidjan
  m25: { biome: 'abidjan', setting: 'pont' },
  m26: { biome: 'abidjan', setting: 'cour' },
  m27: { biome: 'abidjan', setting: 'villa' },
  // ACTE X — la tour Postel
  m28: { biome: 'tower' }, m29: { biome: 'tower', variant: 'feu' }, m30: { biome: 'tower', variant: 'feu' },
  // ACTE XI — Bandiagara et les profondeurs
  m31: { biome: 'canyon' },
  m32: { biome: 'canyon', variant: 'cave' }, m33: { biome: 'canyon', variant: 'cave' }, m34: { biome: 'canyon', variant: 'cave' },
  m35: { biome: 'canyon' },
  // ACTE XII — la fosse marine
  m36: { biome: 'abyss' }, m37: { biome: 'abyss' }, m38: { biome: 'abyss' }, m39: { biome: 'abyss' },
  m40: { biome: 'abyss', variant: 'eruption' },
  // ACTE XIII — le Vide
  m41: { biome: 'void' }, m42: { biome: 'void' }, m43: { biome: 'void' }, m44: { biome: 'void' },
  m45: { biome: 'sgrun' },
  // ACTE XIV — la forteresse
  m46: { biome: 'sgrun' },
  m47: { biome: 'sgrun', variant: 'engrenages' },
  m48: { biome: 'sgrun' }, m49: { biome: 'sgrun' }, m50: { biome: 'void' },

  // ── Missions ajoutées (campaign-extra.js) ────────────────────
  m101: { biome: 'abidjan', setting: 'cour' },              // Les Voisins Curieux
  m102: { biome: 'abidjan', setting: 'cour', night: true }, // La Panne de la Villoise
  m103: { biome: 'banco' },                                 // Sous le Manguier du Banco
  m104: { biome: 'banco' },                                 // Les Chercheurs de Pierre
  m105: { biome: 'essence' },                               // Le Seuil de Sam
  m106: { biome: 'essence' },                               // L'Épreuve du Souffle
  m107: { biome: 'essence', variant: 'lac' },               // Le Reflet qui Ment
  m108: { biome: 'essence' },                               // La Main Tendue
  m109: { biome: 'born' },                                  // Les Marcheurs Gris
  m110: { biome: 'born' },                                  // Le Marché des Borns
  m111: { biome: 'born', night: true },                     // La Nuit sans Étoiles
  m112: { biome: 'born' },                                  // Le Rosmog Blessé
  m113: { biome: 'abidjan', setting: 'rue' },               // Le Quartier Sous Surveillance
  m114: { biome: 'abidjan', setting: 'rue' },               // Les Yeux du Commissaire
  m115: { biome: 'abidjan', setting: 'villa', night: true },// Le Toit de Cocody
  m116: { biome: 'abidjan', setting: 'rue', night: true },  // La Cache de Samia
  m117: { biome: 'abidjan', setting: 'port', night: true }, // Six Mois à Abidjan
  m118: { biome: 'abidjan', setting: 'cour' },              // Le Passage de Grob
  m119: { biome: 'abidjan', setting: 'marche' },            // Les Derniers Cauris
  m120: { biome: 'abidjan', setting: 'villa', night: true },// La Promesse à Karen
  m121: { biome: 'polar' },                                 // Le Convoi Blanc
  m122: { biome: 'polar' },                                 // Les Sentinelles de Glace
  m123: { biome: 'sgrun' },                                 // La Salle des Transactions
  m124: { biome: 'canyon', variant: 'cave' },               // Sous la Glace
  m125: { biome: 'sahel', variant: 'harmattan' },           // La Piste de Tombouctou
  m126: { biome: 'sahel' },                                 // Les Gardiens de Banco
  m127: { biome: 'canyon', variant: 'cave' },               // Le Puits de Djenné
  m128: { biome: 'sahel' },                                 // L'Écho du Griot
  m129: { biome: 'tower' },                                 // Les Archives de la Préfecture
  m130: { biome: 'abidjan', setting: 'port', night: true }, // Le Cigare d'Ousmane
  m131: { biome: 'abidjan', setting: 'marche', night: true },// Le Carnet Brûlé
  m132: { biome: 'abidjan', setting: 'cimetiere', night: true }, // Ce Qu'il Reste à Enterrer
  m133: { biome: 'abidjan', setting: 'rue', night: true },  // Le Couvre-Feu
  m134: { biome: 'abidjan', setting: 'marche' },            // Les Barricades d'Adjamé
  m135: { biome: 'abidjan', setting: 'rue', night: true },  // Le Convoi de Sylla
  m136: { biome: 'abidjan', setting: 'cour', night: true }, // Les Réfugiés de la Villoise
  m137: { biome: 'tower' },                                 // Le Hall de Verre
  m138: { biome: 'tower' },                                 // L'Étage des Dossiers
  m139: { biome: 'tower' },                                 // La Garde Rapprochée
  m140: { biome: 'tower', variant: 'feu' },                 // La Descente
  m141: { biome: 'canyon' },                                // Le Village Suspendu
  m142: { biome: 'canyon' },                                // Les Greniers Scellés
  m143: { biome: 'abyss' },                                 // Le Banc de Corail
  m144: { biome: 'abyss' },                                 // Les Voix sous la Coque
  m145: { biome: 'void' },                                  // Les Éclats Tournants
  m146: { biome: 'void' },                                  // Le Couloir sans Sol
  m147: { biome: 'sgrun' },                                 // Les Portes Blanches
  m148: { biome: 'sgrun' },                                 // La Chambre des Copies
  m149: { biome: 'sgrun' },                                 // L'Avant-Dernier Émissaire
  m150: { biome: 'void' },                                  // Ce Qui Reste de Sgrün

  // DÉFIS
  d_cour: { biome: 'abidjan', setting: 'cour' },
  d_marche: { biome: 'abidjan', setting: 'marche' },
  d_port: { biome: 'abidjan', setting: 'port', night: true },
  d_ombre: { biome: 'void' },
  d_banco: { biome: 'banco' },
  d_kong: { biome: 'sahel', variant: 'kong' },
  d_harmattan: { biome: 'sahel', variant: 'harmattan' },
  d_empire: { biome: 'tower' },
  d_villoise: { biome: 'abidjan', setting: 'cour' },
  d_banco_nuit: { biome: 'banco', night: true },
  d_treichville: { biome: 'abidjan', setting: 'marche', night: true },
  d_cocody: { biome: 'abidjan', setting: 'villa', night: true },
  d_miroir: { biome: 'essence', variant: 'lac' },
  d_pont: { biome: 'abidjan', setting: 'pont' },
  d_glace: { biome: 'polar' },
  d_niani: { biome: 'sahel' },
  d_prefecture: { biome: 'tower' },
  d_tour: { biome: 'tower' },
  d_feu: { biome: 'tower', variant: 'feu' },
  d_bandiagara: { biome: 'canyon' },
  d_fosse: { biome: 'abyss' },
  d_lame: { biome: 'void' },
  d_engrenages: { biome: 'sgrun', variant: 'engrenages' },
  d_convergence: { biome: 'sgrun' },

  // ── Mode Combat : chaque duel a son lieu ─────────────────────
  c_baba: { biome: 'abidjan', setting: 'cour' },
  c_karen: { biome: 'abidjan', setting: 'villa' },
  c_fulgence: { biome: 'abidjan', setting: 'cour' },
  c_sam: { biome: 'essence' },
  c_dark: { biome: 'banco', night: true },
  c_lundgren: { biome: 'polar' },
  c_sub: { biome: 'abidjan', setting: 'port', night: true },
  c_grob: { biome: 'born' },
  c_ousmane: { biome: 'abidjan', setting: 'port', night: true },
  c_schissin: { biome: 'tower' },
  c_sylla: { biome: 'tower', variant: 'feu' },
  c_krag: { biome: 'canyon', variant: 'cave' },
  c_murk: { biome: 'abyss' },
  c_vael: { biome: 'void' },
  c_sgrun: { biome: 'sgrun' },
};

export function sceneFor(missionId){
  return M[missionId] || { biome: 'abidjan', setting: 'rue' };
}
