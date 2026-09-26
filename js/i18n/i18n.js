// ============================================================
// LANGUE — français (texte d'origine) ou anglais.
//
// Le français reste la langue source : tout le texte du jeu est écrit
// en français dans le code et les données. En anglais :
//   - l'interface passe par t('texte français'), qui renvoie sa
//     traduction depuis en-ui.js ;
//   - le contenu (missions, personnages, compétences…) est remplacé au
//     démarrage par celui de en-content.js (voir boot.js).
// Le choix est retenu sur l'appareil ; par défaut, la langue du téléphone.
// ============================================================
import { EN_UI } from './en-ui.js';

const KEY = 'pf2_lang';

function detect(){
  try{ const s = localStorage.getItem(KEY); if(s === 'fr' || s === 'en') return s; }catch(e){}
  return /^fr\b/i.test(navigator.language || 'fr') ? 'fr' : 'en';
}

/** Langue en cours : 'fr' ou 'en'. */
export const LANG = detect();
export const isEN = LANG === 'en';

/** Change de langue (le jeu se recharge pour tout reconstruire). */
export function setLang(lang){
  try{ localStorage.setItem(KEY, lang); }catch(e){}
  location.reload();
}

/** Format des nombres et des dates. */
export function locale(){ return isEN ? 'en-US' : 'fr-FR'; }

const missing = new Set();
/**
 * Texte d'interface dans la langue du joueur. `fr` est le texte français,
 * qui sert aussi de clé ; `{nom}` est remplacé par vars.nom.
 */
export function t(fr, vars){
  let s = fr;
  if(isEN){
    s = EN_UI[fr];
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
  const m = /^(?:The |Le |La |L'|Den )(.+)$/.exec(name || '');
  return m ? m[1] : (name || '').split(' ')[0];
}

/**
 * Traduit le texte fixe d'une page (index.html) : nœuds de texte et
 * attributs lisibles (aria-label, title, alt, placeholder).
 */
export function translateDom(root = document.body){
  if(!isEN || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  for(const n of nodes){
    const raw = n.nodeValue, txt = raw.trim();
    if(!txt || !/[A-Za-zÀ-ÿ]/.test(txt)) continue;
    const tr = EN_UI[txt];
    if(tr !== undefined) n.nodeValue = raw.replace(txt, tr);
  }
  for(const el of root.querySelectorAll('[aria-label],[title],[alt],[placeholder]')){
    for(const a of ['aria-label', 'title', 'alt', 'placeholder']){
      const v = el.getAttribute(a);
      if(v && EN_UI[v.trim()] !== undefined) el.setAttribute(a, EN_UI[v.trim()]);
    }
  }
  document.documentElement.lang = 'en';
}
