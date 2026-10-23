// Liste des fichiers à produire dans une autre langue que le français :
// texte prononcé (tools/voix/textes/<langue>.json, incises du narrateur
// déjà retirées) + personnage qui parle (js/data/voices.js).
//   node tools/voix/taches_langue.mjs <langue> $W   ->  $W/jobs.json
import fs from 'fs';
import { RECIT_VOICES } from '../../js/data/voices.js';
const [L, S] = process.argv.slice(2);
const texts = JSON.parse(fs.readFileSync(new URL(`./textes/${L}.json`, import.meta.url)));
const jobs = Object.entries(texts).map(([k, text]) => {
  const [dir, id] = k.split('/');
  const who = dir === 'recit' ? (id.startsWith('intro_') ? 'KANKOU' : RECIT_VOICES[id]) : id.replace(/_[a-z]+$/, '');
  return { id, dir, spk: who === 'BABA' ? 'BABA_TUNDE' : who, text };
});
const cfg = JSON.parse(fs.readFileSync(S + '/voicecfg.json')).voices;
for(const j of jobs) if(!cfg[j.spk]) throw new Error('pas de voix pour ' + j.id + ' ' + j.spk);
fs.writeFileSync(S + '/jobs.json', JSON.stringify(jobs, null, 1));
console.log(jobs.length);
