import fs from 'fs';
const sleep = ms => new Promise(res=>setTimeout(res,ms));
const BASE = 'https://bdl.stat.gov.pl/api/v1';

async function getJSON(url) {
  for (let i=0;i<10;i++) {
    try {
      const r = await fetch(url, {headers:{'Accept':'application/json'}});
      if (r.status===429) {
        const ra = r.headers.get('retry-after');
        const wait = ra ? (parseInt(ra)*1000 + 3000) : 20000*(i+1);
        console.log('429, waiting ms:', wait);
        await sleep(wait);
        continue;
      }
      if (!r.ok) throw new Error(r.status+' '+url);
      await sleep(2500);
      return await r.json();
    } catch(e) {
      if (i===9) throw e;
      await sleep(3000*(i+1));
    }
  }
  throw new Error('failed after retries '+url);
}

async function fetchAllByVariable(varId, unitLevel, cacheFile) {
  if (fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile));
  let all = [];
  let page = 0;
  while (true) {
    const j = await getJSON(`${BASE}/data/by-variable/${varId}?unit-level=${unitLevel}&page=${page}&page-size=100&format=json`);
    all.push(...j.results);
    if (!j.links || !j.links.next) break;
    page++;
  }
  fs.writeFileSync(cacheFile, JSON.stringify(all, null, 2));
  return all;
}

async function main() {
  console.log('fetching salary (var 1749925, level6)...');
  const salary = await fetchAllByVariable(1749925, 6, 'data/raw-salary.json');
  console.log('salary records:', salary.length);

  console.log('fetching population (var 72305, level6)...');
  const population = await fetchAllByVariable(72305, 6, 'data/raw-population.json');
  console.log('population records:', population.length);

  console.log('fetching unemployment (var 33507, level5)...');
  const unemployment = await fetchAllByVariable(33507, 5, 'data/raw-unemployment.json');
  console.log('unemployment records:', unemployment.length);

  console.log('done');
}
main().catch(e=>{console.error(e);process.exit(1)});
