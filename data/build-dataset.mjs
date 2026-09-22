import fs from 'fs';

function readJSON(p){ return JSON.parse(fs.readFileSync(p)); }

const cities = readJSON('data/cities.json'); // [{id, name, level6Id, ...}]
const salary = readJSON('data/raw-salary.json'); // level6 records [{id,name,values:[{year,val}]}]
const population = readJSON('data/raw-population.json'); // level6
const unemployment = readJSON('data/raw-unemployment.json'); // level5
const air = readJSON('data/gios-air.json'); // by city display name
const migration = readJSON('data/raw-migration.json'); // level6, saldo migracji na 1000 ludności
const firms = readJSON('data/raw-firms.json'); // level6, podmioty REGON na 10 tys. ludności
const green = readJSON('data/raw-green.json'); // level6, powierzchnia terenów zieleni na 1 mieszkańca
const housing = readJSON('data/raw-housing.json'); // level6, mieszkania na 1000 mieszkańców

function latestVal(rec) {
  if (!rec || !rec.values || !rec.values.length) return null;
  const sorted = [...rec.values].sort((a,b)=> (b.year||'').localeCompare(a.year||''));
  const v = sorted.find(v=>v.val!=null);
  return v ? { value: v.val, year: v.year } : null;
}

const salaryById = new Map(salary.map(r=>[r.id, r]));
const popById = new Map(population.map(r=>[r.id, r]));
const unempById = new Map(unemployment.map(r=>[r.id, r]));
const migrationById = new Map(migration.map(r=>[r.id, r]));
const firmsById = new Map(firms.map(r=>[r.id, r]));
const greenById = new Map(green.map(r=>[r.id, r]));
const housingById = new Map(housing.map(r=>[r.id, r]));
const migrationByName = new Map(migration.map(r=>[r.name, r]));
const firmsByName = new Map(firms.map(r=>[r.name, r]));
const greenByName = new Map(green.map(r=>[r.name, r]));
const housingByName = new Map(housing.map(r=>[r.name, r]));
// Name-keyed maps as a fallback/primary join: level6Id resolution via BDL's
// parent-id lookup is rate-limited and often incomplete, but by-variable
// datasets carry the unit's display name directly, and that name matches
// the cleaned city name for all but a couple of multi-word exceptions.
const salaryByName = new Map(salary.map(r=>[r.name, r]));
const popByName = new Map(population.map(r=>[r.name, r]));

// Normalize a display name for GIOS matching (strip "Powiat m. ", "m. st. ", etc.)
function cleanName(name) {
  return name
    .replace(/^Powiat m\.\s*st\.\s*/i,'')
    .replace(/^Powiat m\.\s*/i,'')
    .replace(/^Powiat\s*/i,'')
    .replace(/\s+(do|od)\s+\d{4}$/i,'') // drop historical-boundary suffixes (e.g. "Wałbrzych do 2002")
    .trim();
}

const out = [];
for (const c of cities.filter(c => !/do 2002$/.test(c.name))) {
  const displayName = cleanName(c.name);
  const salRec = (c.level6Id && salaryById.get(c.level6Id)) || salaryByName.get(displayName) || null;
  const popRec = (c.level6Id && popById.get(c.level6Id)) || popByName.get(displayName) || null;
  const unempRec = unempById.get(c.id);
  const airRec = air[displayName];
  const migRec = (c.level6Id && migrationById.get(c.level6Id)) || migrationByName.get(displayName) || null;
  const firmsRec = (c.level6Id && firmsById.get(c.level6Id)) || firmsByName.get(displayName) || null;
  const greenRec = (c.level6Id && greenById.get(c.level6Id)) || greenByName.get(displayName) || null;
  const housingRec = (c.level6Id && housingById.get(c.level6Id)) || housingByName.get(displayName) || null;

  out.push({
    id: c.id,
    level6Id: c.level6Id,
    name: displayName,
    population: latestVal(popRec),
    salary: latestVal(salRec),
    unemployedCount: latestVal(unempRec),
    air: airRec ? { avgIndex: airRec.avgIndex, category: airRec.category, lastUpdate: airRec.lastUpdate, stationCount: airRec.stationCount } : null,
    migrationBalancePer1000: latestVal(migRec),
    firmsPer10k: latestVal(firmsRec),
    greenAreaPerCapita: latestVal(greenRec),
    housingUnitsPer1000: latestVal(housingRec),
  });
}

// compute unemployment per 1000 residents where both present
for (const c of out) {
  if (c.unemployedCount && c.population && c.population.value) {
    c.unemploymentPer1000 = +(c.unemployedCount.value / c.population.value * 1000).toFixed(1);
  } else {
    c.unemploymentPer1000 = null;
  }
}

const withData = out.filter(c=>c.population || c.salary || c.air);
console.log('total cities:', out.length, 'with at least one metric:', withData.length);
console.log('with salary:', out.filter(c=>c.salary).length);
console.log('with population:', out.filter(c=>c.population).length);
console.log('with air:', out.filter(c=>c.air).length);
console.log('with unemployment:', out.filter(c=>c.unemploymentPer1000!=null).length);
console.log('with migration balance:', out.filter(c=>c.migrationBalancePer1000).length);
console.log('with firms per 10k:', out.filter(c=>c.firmsPer10k).length);
console.log('with green area per capita:', out.filter(c=>c.greenAreaPerCapita).length);
console.log('with housing units per 1000:', out.filter(c=>c.housingUnitsPer1000).length);

const sampleNames = ['Warszawa','Kraków','Gdańsk'];
for (const n of sampleNames) {
  const c = out.find(x=>x.name===n);
  if (c) console.log('SAMPLE', n, JSON.stringify({
    migrationBalancePer1000: c.migrationBalancePer1000,
    firmsPer10k: c.firmsPer10k,
    greenAreaPerCapita: c.greenAreaPerCapita,
    housingUnitsPer1000: c.housingUnitsPer1000,
  }));
}

fs.mkdirSync('docs/data', {recursive:true});
fs.writeFileSync('docs/data/cities.json', JSON.stringify({
  generatedAt: new Date().toISOString(),
  sources: { gus: 'GUS BDL (bdl.stat.gov.pl)', gios: 'GIOS GIOŚ (api.gios.gov.pl)' },
  cities: out
}, null, 2));
console.log('wrote docs/data/cities.json');
