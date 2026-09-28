// ============================================================
// DÉMARRAGE DE LA LANGUE — importé en tout premier par main.js.
// Hors français, remplace le texte des données (campagne, fiches, sorts,
// objets…) avant que le reste du jeu ne les lise. Chaque texte est
// repéré par son chemin : « CAMPAIGN/@acte1/missions/@m1/name » — un
// segment « @id » désigne l'élément d'une liste qui porte cet id.
// ============================================================
import { LANG } from './i18n.js';
import { EN_CONTENT } from './en-content.js';
import { PT_CONTENT } from './pt-content.js';
import { ES_CONTENT } from './es-content.js';
import { CAMPAIGN } from '../data/campaign.js';
import { CAST } from '../data/cast.js';
import { CHAMPS, ACTE_FOES } from '../data/champions.js';
import { DUELS, FREE_DUEL } from '../data/combat.js';
import { DEFIS } from '../data/defis.js';
import { ITEMS, TALENT_TREES, RELIC_BASES, RARITY } from '../data/items.js';
import { DIFFS, QUEST_TPL, ACHIEVEMENTS, THEMES, SKINS } from '../data/progression.js';
import { VOICE_NAMES } from '../data/voices.js';

const ROOTS = { CAMPAIGN, CAST, CHAMPS, ACTE_FOES, DUELS, FREE_DUEL, DEFIS, ITEMS, TALENT_TREES, RELIC_BASES, RARITY, DIFFS, QUEST_TPL, ACHIEVEMENTS, THEMES, SKINS, VOICE_NAMES };

function step(obj, seg){
  if(obj == null) return undefined;
  if(seg[0] === '@' && Array.isArray(obj)) return obj.find(x => x && String(x.id) === seg.slice(1));
  return obj[seg];
}

const CONTENT = { en: EN_CONTENT, pt: PT_CONTENT, es: ES_CONTENT }[LANG];
if(CONTENT){
  for(const [path, text] of Object.entries(CONTENT)){
    const segs = path.split('/');
    let obj = ROOTS[segs[0]];
    for(let i = 1; i < segs.length - 1 && obj != null; i++) obj = step(obj, segs[i]);
    const last = segs[segs.length - 1];
    if(obj != null && typeof obj === 'object' && typeof obj[last] === 'string') obj[last] = text;
  }
}
