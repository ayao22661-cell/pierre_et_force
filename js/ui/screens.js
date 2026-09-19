// ============================================================
// SCREENS — navigation entre écrans + toast partagé.
// ============================================================
export function goTo(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if(el) el.classList.add('active');
}

let toastTimer = null;
export function toast(msg){
  const el = document.getElementById('pf-toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

export function el(tag, cls, html){
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(html != null) e.innerHTML = html;
  return e;
}
