import fs from 'fs';

const BASE = 'https://bdl.stat.gov.pl/api/v1';

const sleep = ms => new Promise(res=>setTimeout(res,ms));

async function getJSON(url) {
  for (let i=0;i<10;i++) {
    try {
      const r = await fetch(url, {headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) miastometr-research/1.0'}});
      if (r.status===429) {
        const ra = r.headers.get('retry-after');
        const wait = ra ? (parseInt(ra)*1000 + 2000) : 15000*(i+1);
        console.log('429, waiting ms:', wait);
        await sleep(wait);
        continue;
      }
      if (!r.ok) throw new Error(r.status+' '+url);
      await sleep(2500);
      return await r.json();
    } catch(e) {
      if (i===9) throw e;
      await sleep(2000*(i+1));
    }
  }
  throw new Error('failed after retries '+url);
}

async function main() {
  // 1. all level-5 kind-2 units (cities with powiat rights)
  let cities;
  if (fs.existsSync('data/cities-level5.json')) {
    cities = JSON.parse(fs.readFileSync('data/cities-level5.json'));
  } else {
    cities = [];
    let page = 0;
    while (true) {
      const j = await getJSON(`${BASE}/units?level=5&page=${page}&page-size=100&format=json`);
      cities.push(...j.results.filter(u=>u.kind==='2'));
      if (!j.links.next) break;
      page++;
    }
    fs.writeFileSync('data/cities-level5.json', JSON.stringify(cities, null, 2));
  }
  console.log('cities level5 kind2:', cities.length);

  // 2. find level-6 child unit for each city (parent-id query), resumable
  let existing = [];
  if (fs.existsSync('data/cities.json')) existing = JSON.parse(fs.readFileSync('data/cities.json'));
  const doneMap = new Map(existing.map(c=>[c.id,c]));
  for (const c of cities) {
    if (doneMap.has(c.id) && doneMap.get(c.id).level6Id !== undefined) {
      c.level6Id = doneMap.get(c.id).level6Id;
      continue;
    }
    const j = await getJSON(`${BASE}/units?parent-id=${c.id}&format=json`);
    const child = j.results.find(u=>u.level===6);
    c.level6Id = child ? child.id : null;
    fs.writeFileSync('data/cities.json', JSON.stringify(cities, null, 2));
  }
  fs.writeFileSync('data/cities.json', JSON.stringify(cities, null, 2));
  console.log('done cities.json');
}
main().catch(e=>{console.error(e);process.exit(1)});
