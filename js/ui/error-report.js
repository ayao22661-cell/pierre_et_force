// ============================================================
// RAPPORT D'ERREURS À L'ÉCRAN
// Sur téléphone, la console du navigateur est invisible : une erreur
// au lancement d'un combat laissait simplement un écran noir. Toute
// erreur non rattrapée (ou signalée par report()) s'affiche désormais
// dans un petit panneau, avec de quoi la transmettre telle quelle.
// ============================================================

const lines = [];
let panel = null;

function render(){
  if(!panel){
    panel = document.createElement('div');
    panel.id = 'pf-errors';
    panel.style.cssText = [
      'position:fixed', 'left:8px', 'right:8px', 'bottom:8px', 'z-index:9999',
      'max-height:45vh', 'overflow:auto', 'padding:10px 12px',
      'background:rgba(20,6,6,.94)', 'border:1px solid #d6453f', 'border-radius:6px',
      'color:#ffd9d6', 'font:12px/1.45 monospace', 'white-space:pre-wrap', 'word-break:break-word',
    ].join(';');
    const head = document.createElement('div');
    head.style.cssText = 'display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;font-weight:bold;color:#ff8f87';
    head.innerHTML = '<span>Erreur — faites une capture d\'écran</span>';
    const close = document.createElement('button');
    close.textContent = '✕';
    close.style.cssText = 'background:none;border:0;color:#ff8f87;font-size:16px;cursor:pointer';
    close.onclick = () => { panel.remove(); panel = null; };
    head.appendChild(close);
    panel.appendChild(head);
    panel.appendChild(document.createElement('div'));
    document.body.appendChild(panel);
  }
  panel.lastChild.textContent = lines.join('\n\n');
}

/** Affiche une erreur à l'écran (contexte : où elle s'est produite). */
export function report(context, err){
  const msg = err?.stack || err?.message || String(err);
  const line = (context ? `[${context}] ` : '') + msg.split('\n').slice(0, 6).join('\n');
  if(lines.includes(line)) return;
  lines.push(line);
  if(lines.length > 8) lines.shift();
  render();
}

/** Branche la capture globale (une seule fois, au démarrage). */
export function installErrorReport(){
  window.addEventListener('error', (e) => {
    // Échec de chargement d'un fichier (image, script…) : e.target est l'élément.
    if(e.target && e.target !== window && (e.target.src || e.target.href)){
      report('fichier introuvable', e.target.src || e.target.href);
    }else report('erreur', e.error || e.message);
  }, true);
  window.addEventListener('unhandledrejection', (e) => report('erreur', e.reason));
  // Le moteur 3D signale ses échecs de chargement par console.error.
  const orig = console.error.bind(console);
  console.error = (...args) => {
    orig(...args);
    const text = args.map(a => a instanceof Error ? (a.stack || a.message) : typeof a === 'object' ? safe(a) : String(a)).join(' ');
    if(/❌|failed|error|erreur|échec/i.test(text)) report('', text);
  };
}

function safe(o){ try{ return JSON.stringify(o); }catch(e){ return String(o); } }
