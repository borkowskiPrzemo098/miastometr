import fs from 'fs';

const sleep = ms => new Promise(res=>setTimeout(res,ms));
const BASE = 'https://api.gios.gov.pl/pjp-api/v1/rest';

async function getJSON(url) {
  for (let i=0;i<6;i++) {
    try {
      const r = await fetch(url, {headers:{'Accept':'application/ld+json'}});
      if (r.status===429) { await sleep(3000*(i+1)); continue; }
      if (!r.ok) throw new Error(r.status+' '+url);
      return await r.json();
    } catch(e) {
      if (i===5) throw e;
      await sleep(1000*(i+1));
    }
  }
}

async function main() {
  // fetch all stations (paginated)
  let stations = [];
  let page = 0;
  while (true) {
    const j = await getJSON(`${BASE}/station/findAll?page=${page}&size=500`);
    const list = j['Lista stacji pomiarowych'] || [];
    stations.push(...list);
    if (list.length < 500) break;
    page++;
    if (page > 10) break;
  }
  fs.writeFileSync('data/gios-stations.json', JSON.stringify(stations, null, 2));
  console.log('stations:', stations.length);

  // group by city name, fetch AQ index for first station per city, average category
  const byCity = new Map();
  for (const s of stations) {
    const city = s['Nazwa miasta'];
    if (!byCity.has(city)) byCity.set(city, []);
    byCity.get(city).push(s);
  }

  const results = {};
  let n = 0;
  for (const [city, list] of byCity) {
    const scores = [];
    for (const s of list.slice(0,3)) { // up to 3 stations per city
      try {
        const j = await getJSON(`${BASE}/aqindex/getIndex/${s['Identyfikator stacji']}`);
        const idx = j.AqIndex;
        if (idx && typeof idx['Wartość indeksu'] === 'number') {
          scores.push({ value: idx['Wartość indeksu'], category: idx['Nazwa kategorii indeksu'], date: idx['Data wykonania obliczeń indeksu'] });
        }
      } catch(e) { /* skip */ }
      await sleep(150);
    }
    if (scores.length) {
      const avg = scores.reduce((a,b)=>a+b.value,0)/scores.length;
      results[city] = { avgIndex: avg, category: scores[0].category, stationCount: list.length, lastUpdate: scores[0].date };
    }
    n++;
    if (n % 20 === 0) { fs.writeFileSync('data/gios-air.json', JSON.stringify(results, null, 2)); console.log('progress', n, '/', byCity.size); }
  }
  fs.writeFileSync('data/gios-air.json', JSON.stringify(results, null, 2));
  console.log('done gios-air.json, cities:', Object.keys(results).length);
}
main().catch(e=>{console.error(e);process.exit(1)});
