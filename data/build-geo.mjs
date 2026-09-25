// Builds docs/data/geo.json: voivodeship outlines as SVG paths plus each city's
// projected position and voivodeship. Coordinates come from OpenStreetMap
// Nominatim (1 req/s per its usage policy); outlines from ppatrzyk/polska-geojson.
import fs from 'fs';

const GEO_URL = 'https://raw.githubusercontent.com/ppatrzyk/polska-geojson/master/wojewodztwa/wojewodztwa-min.geojson';
const CACHE = 'data/geo-cache.json';
const UA = 'Miastometr/1.0 (https://borkowskiprzemo098.github.io/miastometr/)';

const W = 1000;
const LAT0 = 52;
const K = Math.cos(LAT0 * Math.PI / 180);
const BOUNDS = { minLon: 14.1, maxLon: 24.2, minLat: 49.0, maxLat: 54.9 };
const SCALE = W / ((BOUNDS.maxLon - BOUNDS.minLon) * K);
const H = Math.round((BOUNDS.maxLat - BOUNDS.minLat) * SCALE);
const project = (lon, lat) => [
  +(((lon - BOUNDS.minLon) * K) * SCALE).toFixed(1),
  +((BOUNDS.maxLat - lat) * SCALE).toFixed(1),
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

function ringToPath(ring) {
  let last = null, d = '';
  for (const [lon, lat] of ring) {
    const [x, y] = project(lon, lat);
    const key = x + ',' + y;
    if (key === last) continue;
    d += (d ? 'L' : 'M') + x + ' ' + y;
    last = key;
  }
  return d + 'Z';
}

async function main() {
  const geo = await (await fetch(GEO_URL, { headers: { 'User-Agent': UA } })).json();
  const voivodeships = geo.features.map(f => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const d = polys.map(p => p.map(ringToPath).join('')).join('');
    return { name: f.properties.nazwa, d };
  });

  const { cities } = JSON.parse(fs.readFileSync('docs/data/cities.json'));
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE)) : {};

  // Digits 3-4 of a BDL unit id are the TERYT voivodeship code; used to steer the
  // lookup away from same-named villages (Piła, Marki...).
  const TERYT = { '02': 'dolnośląskie', '04': 'kujawsko-pomorskie', '06': 'lubelskie', '08': 'lubuskie', '10': 'łódzkie', '12': 'małopolskie', '14': 'mazowieckie', '16': 'opolskie', '18': 'podkarpackie', '20': 'podlaskie', '22': 'pomorskie', '24': 'śląskie', '26': 'świętokrzyskie', '28': 'warmińsko-mazurskie', '30': 'wielkopolskie', '32': 'zachodniopomorskie' };
  for (const c of cities) {
    if (cache[c.name]) continue;
    const woj = TERYT[String(c.id).slice(2, 4)];
    const q = woj ? `${c.name}, województwo ${woj}` : c.name;
    const url = 'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&countrycodes=pl&accept-language=pl&q=' + encodeURIComponent(q);
    const res = await (await fetch(url, { headers: { 'User-Agent': UA } })).json();
    const inWoj = res.filter(r => !woj || (r.address && (r.address.state || '').includes(woj)));
    const hit = inWoj.find(r => ['city', 'town'].includes(r.addresstype) || ['city', 'town'].includes(r.type)) || inWoj.find(r => r.type === 'administrative') || inWoj[0];
    if (!hit) { console.warn('NO HIT', c.name); await sleep(1100); continue; }
    cache[c.name] = {
      lat: +(+hit.lat).toFixed(4),
      lon: +(+hit.lon).toFixed(4),
      voivodeship: (hit.address && hit.address.state || '').replace(/^województwo\s+/i, ''),
    };
    console.log(c.name, cache[c.name]);
    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
    await sleep(1100);
  }

  const cityGeo = {};
  for (const c of cities) {
    const g = cache[c.name];
    if (!g) continue;
    const [x, y] = project(g.lon, g.lat);
    cityGeo[c.name] = { ...g, x, y };
  }

  fs.writeFileSync('docs/data/geo.json', JSON.stringify({ viewBox: `0 0 ${W} ${H}`, voivodeships, cities: cityGeo }));
  const missing = cities.filter(c => !cityGeo[c.name]).map(c => c.name);
  console.log('voivodeships', voivodeships.length, 'cities placed', Object.keys(cityGeo).length, 'missing', missing);
}

main();
