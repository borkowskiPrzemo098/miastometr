// Picks the largest Polish towns that are not cities with powiat rights, so the
// base of 66 grows to TARGET. Uses GUS gmina-level population already cached in
// raw-population.json: kind 1 = urban gmina, kind 4 = the town part of an
// urban-rural gmina ("X - miasto").
import fs from 'fs';

const TARGET = 100;
const base = JSON.parse(fs.readFileSync('data/cities.json'));
const baseNames = new Set(base.map(c => c.name.replace(/^Powiat m\.\s*(st\.\s*)?/i, '').replace(/\s+(do|od)\s+\d{4}$/i, '').trim()));
baseNames.add('Warszawa');
const pop = JSON.parse(fs.readFileSync('data/raw-population.json'));

const latest = r => {
  const v = [...r.values].sort((a, b) => b.year.localeCompare(a.year)).find(x => x.val != null);
  return v ? v.val : 0;
};

const candidates = pop
  .filter(r => /[14]$/.test(r.id) && !/dzielnica|delegatura|\s(do|od)\s\d{4}|obszar/i.test(r.name))
  .map(r => ({ id: r.id, name: r.name.replace(/\s+-\s+miasto$/i, '').trim(), population: latest(r) }))
  .filter(c => !baseNames.has(c.name))
  .sort((a, b) => b.population - a.population);

const seen = new Set();
const extra = [];
for (const c of candidates) {
  if (seen.has(c.name)) continue;
  seen.add(c.name);
  extra.push({ id: c.id, name: c.name });
  if (baseNames.size + extra.length >= TARGET) break;
}

fs.writeFileSync('data/extra-cities.json', JSON.stringify(extra, null, 1));
console.log("base", baseNames.size, '+ extra', extra.length);
console.log(extra.map(c => c.name).join(', '));
