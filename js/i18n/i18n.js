// ============================================================
// LANGUE — français (texte d'origine), anglais, portugais (Brésil) ou espagnol.
//
// Le français reste la langue source : tout le texte du jeu est écrit
// en français dans le code et les données. Dans une autre langue :
//   - l'interface passe par t('texte français'), qui renvoie sa
//     traduction depuis <langue>-ui.js ;
//   - le contenu (missions, personnages, compétences…) est remplacé au
//     démarrage par celui de <langue>-content.js (voir boot.js).
// Les voix existent en français et en anglais ; en portugais et en
// espagnol, on entend la voix française, sous-titrée.
// Le choix est retenu sur l'appareil ; par défaut, la langue du téléphone.
// ============================================================
import { EN_UI } from './en-ui.js';
import { PT_UI } from './pt-ui.js';
import { ES_UI } from './es-ui.js';

const KEY = 'pf2_lang';

/** Langues du jeu, avec leur nom dans leur propre langue. */
export const LANGS = [['fr', 'Français'], ['en', 'English'], ['pt', 'Português'], ['es', 'Español']];
const CODES = LANGS.map(l => l[0]);

function detect(){
  try{ const s = localStorage.getItem(KEY); if(CODES.includes(s)) return s; }catch(e){}
  const nav = (navigator.language || 'fr').slice(0, 2).toLowerCase();
  return CODES.includes(nav) ? nav : 'en';
}

/** Langue en cours : 'fr', 'en', 'pt' ou 'es'. */
export const LANG = detect();
export const isEN = LANG === 'en';
/** Toute langue autre que le français : clavier QWERTY, textes traduits. */
export const isFR = LANG === 'fr';
const DICT = { en: EN_UI, pt: PT_UI, es: ES_UI }[LANG] || null;

/** Change de langue (le jeu se recharge pour tout reconstruire). */
export function setLang(lang){
  try{ localStorage.setItem(KEY, lang); }catch(e){}
  location.reload();
}

/** Format des nombres et des dates. */
export function locale(){ return { fr: 'fr-FR', en: 'en-US', pt: 'pt-BR', es: 'es-ES' }[LANG]; }

const missing = new Set();
/**
 * Texte d'interface dans la langue du joueur. `fr` est le texte français,
 * qui sert aussi de clé ; `{nom}` est remplacé par vars.nom.
 */
export function t(fr, vars){
  let s = fr;
  if(DICT){
    s = DICT[fr];
    if(s === undefined){
      s = fr;
      if(!missing.has(fr)){ missing.add(fr); console.warn('[i18n] traduction manquante :', fr); }
    }
  }
  if(vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}

/** Nom court d'un personnage (sans article) pour les cartes. */
export function shortName(name){
  const m = /^(?:The |Le |La |L'|Den |O |A |El )(.+)$/.exec(name || '');
  return m ? m[1] : (name || '').split(' ')[0];
}

/**
 * Traduit le texte fixe d'une page (index.html) : nœuds de texte et
 * attributs lisibles (aria-label, title, alt, placeholder).
 */
export function translateDom(root = document.body){
  if(!DICT || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  for(const n of nodes){
    const raw = n.nodeValue, txt = raw.trim();
    if(!txt || !/[A-Za-zÀ-ÿ]/.test(txt)) continue;
    const tr = DICT[txt];
    if(tr !== undefined) n.nodeValue = raw.replace(txt, tr);
  }
  for(const el of root.querySelectorAll('[aria-label],[title],[alt],[placeholder]')){
    for(const a of ['aria-label', 'title', 'alt', 'placeholder']){
      const v = el.getAttribute(a);
      if(v && DICT[v.trim()] !== undefined) el.setAttribute(a, DICT[v.trim()]);
    }
  }
  document.documentElement.lang = LANG;
}
