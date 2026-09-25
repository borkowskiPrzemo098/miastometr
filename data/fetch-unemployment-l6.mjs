// Registered unemployed at gmina level (the powiat figure used for cities with
// powiat rights would include surrounding villages for ordinary towns).
// Finds the BDL variable instead of hard-coding it, then bulk-fetches level 6.
import fs from 'fs';

const BASE = 'https://bdl.stat.gov.pl/api/v1';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJSON(url) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 429 || res.status === 403) {
      const ra = parseInt(res.headers.get('retry-after'), 10); const wait = Number.isFinite(ra) ? Math.max(30, ra) : 180;
      console.log(`rate limited, waiting ${wait}s`);
      await sleep(wait * 1000);
      continue;
    }
    const j = await res.json();
    if (j.errorResult && /limit/i.test(j.errorResult)) { console.log('limit message, waiting 120s'); await sleep(120000); continue; }
    return j;
  }
  throw new Error('gave up: ' + url);
}

async function main() {
  const search = await getJSON(`${BASE}/subjects/search?name=${encodeURIComponent('bezrobotni zarejestrowani')}&format=json&lang=pl&page-size=50`);
  const subjects = (search.results || []).filter(s => s.hasVariables && (s.levels || []).includes(6));
  console.log('subjects with level 6:', subjects.map(s => `${s.id} ${s.name}`).join(' | '));

  let chosen = null;
  for (const s of subjects) {
    const vars = await getJSON(`${BASE}/variables?subject-id=${s.id}&format=json&lang=pl&page-size=100`);
    const v = (vars.results || []).find(v => v.level === 6 && v.measureUnitName === 'osoba' && (v.n1 || '').startsWith('ogółem') && (!v.n2 || v.n2.startsWith('ogółem')));
    if (v) { chosen = { subject: s, v }; break; }
  }
  if (!chosen) throw new Error('no gmina-level "ogółem" unemployment variable found');
  console.log('using variable', chosen.v.id, chosen.subject.name, JSON.stringify(chosen.v));

  const out = [];
  for (let page = 0; ; page++) {
    const j = await getJSON(`${BASE}/data/by-variable/${chosen.v.id}?unit-level=6&page=${page}&page-size=100&format=json`);
    out.push(...(j.results || []));
    if (!j.links || !j.links.next) break;
  }
  fs.writeFileSync('data/raw-unemployment-l6.json', JSON.stringify(out));
  fs.writeFileSync('data/raw-unemployment-l6.meta.json', JSON.stringify({ variableId: chosen.v.id, subject: chosen.subject.id, subjectName: chosen.subject.name, fetchedAt: new Date().toISOString() }, null, 1));
  console.log('gminas:', out.length);
}

main().catch(e => { console.error(e); process.exit(1); });
