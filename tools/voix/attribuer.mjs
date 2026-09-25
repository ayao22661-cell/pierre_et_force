import { CAMPAIGN } from '../../js/data/campaign.js';
import fs from 'fs';
const NAMES = { 'Tarine':'TARINE','Sam':'SAM','Lundgren':'LUNDGREN','Karen':'KAREN','Fulgence':'FULGENCE','Youri':'YOURI','Baba':'BABA_TUNDE','Général':'KEITA','Keïta':'KEITA','Samia':'SAMIA','Sylla':'SYLLA','Ousmane':'OUSMANE','Schissin':'SCHISSIN','Sub':'SUB','Grob':'GROB','Krag':'KRAG','Murk':'MURK','Vael':'VAEL','Sgrün':'SGRUN','Dark':'DARK','Kankou':'KANKOU','Moussa':'KANKOU','Yasuke':'YASUKE','Papa':'KEITA' };
const V = '(?:dit|demande|lance|souffle|confirme|répond|murmure|ajoute|fait|reprend|glisse|crie|grogne|hurle|tranche|annonce|observe|corrige|articule|conclut|insiste|lâche|poursuit|rétorque|explique|chuchote|note|constate|admet|avoue|soupire|rit|sourit|gronde|siffle|coupe|précise|déclare|rugit|répète|continue)';
const INC = new RegExp('([,?!.…])\\s*' + V + '(?:-t-|-|\\s+)(il|elle|ils|[A-ZÉ][\\wëïüéè-]+(?:[ -][A-ZÉ][\\wëïüéè-]+)?)([^.!?…,]*?)([.!?…,]|$)', 'u');
const nameKey = (s) => { if(!s) return null; let best=null, bi=1e9; for(const n in NAMES){ const i = s.indexOf(n); if(i>=0 && i<bi){ bi=i; best=NAMES[n]; } } return best; };
const out = [];
for(const a of CAMPAIGN){
  const arrays = [[a.id,'narration_debut',a.narration_debut],[a.id,'narration_fin',a.narration_fin]];
  for(const m of a.missions) for(const k of ['narr_avant','narr_victoire','narr_defaite']) arrays.push([m.id,k,m[k]]);
  for(const [mid, where, arr] of arrays){
    if(!arr) continue;
    const hist = [];
    arr.forEach((line, i) => {
      const t = line.trim();
      const mm = t.match(/^(.*?)(?:^|[.:!?…]\s)—\s(.*)$/su) || t.match(/^()—\s(.*)$/su);
      if(!mm) return;
      let before = t.startsWith('—') ? '' : t.slice(0, t.indexOf('— '));
      let speech = t.slice(t.indexOf('— ') + 2);
      let spk = null, conf = 'hi';
      const inc = speech.match(INC);
      if(inc){ const who = inc[2]; spk = nameKey(who + inc[3]); if(!spk && /^(il|elle|ils)$/.test(who)) { spk = nameKey(before) || nameKey(arr[i-1]); conf = 'pro'; }
        speech = speech.replace(INC, (all, p, w, rest, end) => (p === ',' ? (end === ',' ? ', ' : end) : p + (end === ',' ? ' ' : ''))).replace(/\s+,/g, ',').replace(/, ([a-zà-ÿ])/g, ', $1'); }
      if(!spk && before){ spk = nameKey(before); conf = 'bef'; }
      if(!spk){ // alternance
        const last = hist[hist.length-1], prev2 = hist.findLast(h => h !== last);
        spk = prev2 || (last && last !== 'TARINE' ? 'TARINE' : null); conf = '?';
      }
      speech = speech.replace(/\s*[—–]\s*$/,'').trim();
      hist.push(spk);
      out.push({ mid, where, i, spk, conf, speech, line: t });
    });
  }
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(out.length, out.filter(o=>o.conf==='?').length, out.filter(o=>!o.spk).length);
