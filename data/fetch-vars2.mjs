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
  console.log('fetching migration balance (var 1365239, level6)...');
  const migration = await fetchAllByVariable(1365239, 6, 'data/raw-migration.json');
  console.log('migration records:', migration.length);

  console.log('fetching REGON entities per 10k (var 60530, level6)...');
  const firms = await fetchAllByVariable(60530, 6, 'data/raw-firms.json');
  console.log('firms records:', firms.length);

  console.log('fetching green area per capita (var 1724788, level6)...');
  const green = await fetchAllByVariable(1724788, 6, 'data/raw-green.json');
  console.log('green records:', green.length);

  console.log('fetching housing units per 1000 (var 410600, level6)...');
  const housing = await fetchAllByVariable(410600, 6, 'data/raw-housing.json');
  console.log('housing records:', housing.length);

  console.log('done');
}
main().catch(e=>{console.error(e);process.exit(1)});
