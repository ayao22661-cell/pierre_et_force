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
  // DÉFIS
  d_cour: { biome: 'abidjan', setting: 'cour' },
  d_marche: { biome: 'abidjan', setting: 'marche' },
  d_port: { biome: 'abidjan', setting: 'port', night: true },
  d_ombre: { biome: 'void' },
  d_banco: { biome: 'banco' },
  d_kong: { biome: 'sahel', variant: 'kong' },
  d_harmattan: { biome: 'sahel', variant: 'harmattan' },
  d_empire: { biome: 'tower' },
};

export function sceneFor(missionId){
  return M[missionId] || { biome: 'abidjan', setting: 'rue' };
}
