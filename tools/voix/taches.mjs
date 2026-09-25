import fs from 'fs';
const S = process.argv[2];
const a = JSON.parse(fs.readFileSync(S + '/attrib.json'));
const c = JSON.parse(fs.readFileSync(S + '/voicecfg.json'));
const W = { narration_debut:'nd', narration_fin:'nf', narr_avant:'av', narr_victoire:'vi', narr_defaite:'de' };
const jobs = [];
a.forEach((x, k) => {
  const spk = c.spk[k] || x.spk; const text = (c.speech[k] || x.speech).replace(/\s+/g, ' ').replace(/\s+([,.])/g, '$1').trim();
  if(!spk || !c.voices[spk]) throw new Error('no voice ' + k + ' ' + spk);
  jobs.push({ id: `${x.mid}_${W[x.where]}_${x.i}`, dir: 'recit', spk, text, mid: x.mid, where: x.where, i: x.i });
});
const T = ['debut', 'ultime', 'victoire', 'defaite'];
for(const [k, lines] of Object.entries(c.barks)) lines.forEach((t, j) => jobs.push({ id: `${k}_${T[j]}`, dir: 'combat', spk: k === 'BABA' ? 'BABA_TUNDE' : k, text: t }));
fs.writeFileSync(S + '/jobs.json', JSON.stringify(jobs, null, 1));
const cnt = {}; jobs.forEach(j => cnt[j.spk] = (cnt[j.spk] || 0) + 1);
console.log(jobs.length, cnt);
