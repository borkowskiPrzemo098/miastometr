(() => {
  'use strict';

  const METRICS = [
    { key: 'salary', short: 'Pensje', label: 'Wynagrodzenie', long: 'Przeciętne wynagrodzenie brutto', unit: 'zł brutto / mies.', better: 'high', fmt: 'int',
      get: c => c.salary && c.salary.value, year: c => c.salary && c.salary.year, period: y => 'styczeń ' + y,
      note: 'Przeciętne wynagrodzenie brutto w styczniu, według miejsca zamieszkania (GUS, badanie rozkładu wynagrodzeń na danych ZUS).' },
    { key: 'population', short: 'Ludność', label: 'Liczba mieszkańców', long: 'Liczba mieszkańców', unit: 'mieszkańców', better: 'size', fmt: 'int',
      get: c => c.population && c.population.value, year: c => c.population && c.population.year,
      note: 'Liczba mieszkańców według GUS. Skala nie ma stref, bo większe miasto nie jest z definicji lepsze.' },
    { key: 'unemployment', short: 'Bezrobocie', label: 'Bezrobocie', long: 'Zarejestrowani bezrobotni na 1000 mieszkańców', unit: 'os. / 1000 mieszk.', better: 'low', fmt: '1',
      get: c => c.unemploymentPer1000, year: c => c.unemployedCount && c.unemployedCount.year,
      note: 'Zarejestrowani bezrobotni na 1000 mieszkańców (GUS). Mniej znaczy lepiej. To nie jest stopa bezrobocia.' },
    { key: 'air', short: 'Powietrze', label: 'Jakość powietrza', long: 'Indeks jakości powietrza GIOŚ', unit: 'indeks GIOŚ', better: 'low', lamp: true,
      get: c => (c.air && typeof c.air.avgIndex === 'number') ? c.air.avgIndex : null, year: () => null, note: '' },
    { key: 'migration', short: 'Migracje', label: 'Saldo migracji', long: 'Saldo migracji na 1000 mieszkańców', unit: 'os. / 1000 mieszk.', better: 'high', fmt: 'signed',
      get: c => c.migrationBalancePer1000 && c.migrationBalancePer1000.value, year: c => c.migrationBalancePer1000 && c.migrationBalancePer1000.year,
      note: 'Saldo migracji na 1000 mieszkańców (GUS). Plus oznacza, że więcej osób się wprowadza, niż wyprowadza.' },
    { key: 'firms', short: 'Firmy', label: 'Firmy', long: 'Podmioty gospodarcze REGON na 10 tys. mieszkańców', unit: 'na 10 tys. mieszk.', better: 'high', fmt: 'int',
      get: c => c.firmsPer10k && c.firmsPer10k.value, year: c => c.firmsPer10k && c.firmsPer10k.year,
      note: 'Podmioty gospodarki narodowej w rejestrze REGON na 10 tys. mieszkańców (GUS).' },
    { key: 'green', short: 'Zieleń', label: 'Tereny zieleni', long: 'Tereny zieleni na mieszkańca', unit: 'm² / mieszk.', better: 'high', fmt: '1',
      get: c => c.greenAreaPerCapita && c.greenAreaPerCapita.value, year: c => c.greenAreaPerCapita && c.greenAreaPerCapita.year,
      note: 'Powierzchnia gminnych terenów zieleni na mieszkańca w m² (GUS).' },
    { key: 'housing', short: 'Mieszkania', label: 'Zasób mieszkań', long: 'Mieszkania na 1000 mieszkańców', unit: 'mieszk. / 1000 os.', better: 'high', fmt: '1',
      get: c => c.housingUnitsPer1000 && c.housingUnitsPer1000.value, year: c => c.housingUnitsPer1000 && c.housingUnitsPer1000.year,
      note: 'Mieszkania na 1000 mieszkańców (GUS). Pokazujemy zasób, bo GUS nie publikuje cen metra dla miast.' },
  ];

  const AIR_LEVELS = {
    'Bardzo dobry': { color: '#2E9E4F', score: 100 },
    'Dobry': { color: '#8CC63F', score: 80 },
    'Umiarkowany': { color: '#F2B705', score: 60 },
    'Dostateczny': { color: '#EE5A24', score: 40 },
    'Zły': { color: '#D7263D', score: 20 },
    'Bardzo zły': { color: '#8E1B2B', score: 0 },
  };
  const CMP_COLORS = ['#EE5A24', '#0F7A78', '#1C1C1A'];
  const ZONE = { red: '#D7263D', mid: '#F2B705', green: '#2E9E4F', neutral: '#FFFFFF' };
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const nf0 = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });
  const fold = s => s.toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');

  let CITIES = [], GEO = null, BY_NAME = new Map(), STATS = {};
  const state = { metric: 0, city: 'Warszawa', order: 'best', search: '', voiv: '', compare: ['Warszawa', 'Kraków', 'Gdańsk'], weights: {}, showAll: false };

  /* ---------- Values ---------- */
  function fmtVal(m, v) {
    if (v == null) return null;
    if (m.fmt === 'int') return nf0.format(Math.round(v));
    if (m.fmt === 'signed') return (v > 0 ? '+' : '') + nf1.format(v);
    return nf1.format(v);
  }
  function airOf(c) { return c.air && AIR_LEVELS[c.air.category] ? c.air : null; }

  function buildStats() {
    for (const m of METRICS) {
      const rows = CITIES.map(c => ({ c, v: m.get(c) })).filter(r => r.v != null);
      const n = rows.length;
      const map = new Map();
      for (const r of rows) {
        let better = 0, worse = 0;
        for (const o of rows) {
          if (o === r) continue;
          const oBetter = m.better === 'low' ? o.v < r.v : o.v > r.v;
          const oWorse = m.better === 'low' ? o.v > r.v : o.v < r.v;
          if (oBetter) better++; else if (oWorse) worse++;
        }
        map.set(r.c.name, { v: r.v, rank: better + 1, pct: n > 1 ? worse / (n - 1) * 100 : 100, n });
      }
      STATS[m.key] = map;
    }
  }
  const stat = (m, name) => STATS[m.key].get(name) || null;
  function zoneColor(m, pct) {
    if (m.better === 'size') return ZONE.neutral;
    return pct < 33.3 ? ZONE.red : pct < 66.6 ? ZONE.mid : ZONE.green;
  }
  function pctPhrase(m, pct) {
    const p = Math.round(pct);
    return m.better === 'size' ? `Większe niż <b>${p}%</b> miast` : `Lepiej niż <b>${p}%</b> miast`;
  }

  /* ---------- Springs: damped, slightly underdamped needles ---------- */
  const active = new Set();
  let raf = 0, last = 0;
  function makeNeedle(el) { const n = { el, pos: -SW, vel: 0, target: -SW }; applyNeedle(n); return n; }
  function applyNeedle(n) { n.el.setAttribute('transform', `rotate(${n.pos.toFixed(2)} 100 128)`); }
  function aim(n, pct, delay = 0) {
    const target = -SW + Math.max(0, Math.min(100, pct)) * (2 * SW / 100);
    const go = () => {
      n.target = target;
      if (REDUCE) { n.pos = target; n.vel = 0; applyNeedle(n); return; }
      active.add(n);
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
    };
    delay ? setTimeout(go, delay) : go();
  }
  function step(t) {
    const dt = Math.min(0.034, (t - last) / 1000); last = t;
    const sub = 4, h = dt / sub;
    for (const n of active) {
      for (let i = 0; i < sub; i++) {
        const a = -150 * (n.pos - n.target) - 13 * n.vel;
        n.vel += a * h; n.pos += n.vel * h;
      }
      if (Math.abs(n.vel) < 0.04 && Math.abs(n.pos - n.target) < 0.04) { n.pos = n.target; n.vel = 0; active.delete(n); }
      applyNeedle(n);
    }
    raf = active.size ? requestAnimationFrame(step) : 0;
  }

  /* ---------- Dial ---------- */
  const CX = 100, CY = 128, R = 96, SW = 58;
  const pt = (r, deg) => { const a = deg * Math.PI / 180; return [+(CX + r * Math.sin(a)).toFixed(2), +(CY - r * Math.cos(a)).toFixed(2)]; };
  const arc = (r, d1, d2) => { const [x1, y1] = pt(r, d1), [x2, y2] = pt(r, d2); return `M${x1} ${y1}A${r} ${r} 0 0 1 ${x2} ${y2}`; };

  function dialSVG({ neutral = false, needles = 1, colors = ['#1C1C1A'], left = '', right = '% miast' }) {
    let ticks = '';
    for (let i = 0; i <= 40; i++) {
      const deg = -SW + i * (2 * SW / 40), len = i % 4 === 0 ? 12 : i % 2 === 0 ? 7 : 4, w = i % 4 === 0 ? 1.8 : 1;
      const [x1, y1] = pt(R, deg), [x2, y2] = pt(R - len, deg);
      ticks += `<line class="tick" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w}"/>`;
    }
    let nums = '';
    for (let p = 0; p <= 100; p += 20) { const [x, y] = pt(R + 17, -SW + p * (2 * SW / 100)); nums += `<text class="tick-num" x="${x}" y="${y + 3}">${p}</text>`; }
    const band = neutral
      ? `<path d="${arc(R + 6, -SW, SW)}" stroke="#1C1C1A" stroke-width="4" fill="none" opacity=".8"/>`
      : `<path d="${arc(R + 6, -SW, -SW / 3)}" stroke="${ZONE.red}" stroke-width="5" fill="none"/><path d="${arc(R + 6, -SW / 3, SW / 3)}" stroke="${ZONE.mid}" stroke-width="5" fill="none"/><path d="${arc(R + 6, SW / 3, SW)}" stroke="${ZONE.green}" stroke-width="5" fill="none"/>`;
    let ns = '';
    for (let i = 0; i < needles; i++) {
      const col = colors[i] || '#1C1C1A';
      ns += `<g class="needle" transform="rotate(-${SW} 100 128)" filter="url(#needleShadow)"><path d="M100 141 L100 ${CY - R + 3}" stroke="${col}" stroke-width="${needles > 1 ? 2.6 : 2.4}"/><path d="M100 141 L100 134" stroke="${col}" stroke-width="6"/></g>`;
    }
    return `<svg viewBox="-10 0 220 152" aria-hidden="true">
      ${band}
      <path class="mirror" d="${arc(R - 32, -SW, SW)}" stroke-width="3"/>
      ${ticks}${nums}
      <text class="face-txt" x="12" y="148">${esc(left)}</text>
      <text class="face-txt" x="188" y="148" text-anchor="end">${esc(right)}</text>
      ${ns}
      <circle cx="100" cy="128" r="8" fill="#1C1C1A"/><circle cx="100" cy="128" r="2.6" fill="#EEF0EA"/>
    </svg>`;
  }
  function mountDial(el, opts) { el.innerHTML = dialSVG(opts); return Array.from(el.querySelectorAll('.needle')).map(makeNeedle); }
  function lampStyle(air) {
    if (!air) return '--lamp:#b9bcb5;--lamp-glow:transparent';
    const c = AIR_LEVELS[air.category].color;
    return `--lamp:${c};--lamp-glow:${c}`;
  }

  /* ---------- Shared defs ---------- */
  function injectDefs() {
    const d = document.createElement('div');
    d.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="needleShadow" filterUnits="userSpaceOnUse" x="-10" y="0" width="220" height="152"><feDropShadow dx="1.6" dy="2.2" stdDeviation="1.1" flood-color="#000" flood-opacity=".32"/></filter></defs></svg>';
    document.body.appendChild(d.firstChild);
  }

  /* ---------- Metric switches (knob + keys) ---------- */
  const KNOB_ANGLE = i => -135 + i * (270 / (METRICS.length - 1));
  function buildKnob() {
    const wrap = $('#heroKnob');
    let grip = '';
    for (let k = 0; k < 24; k++) grip += `<rect x="63" y="1" width="6" height="11" rx="1.5" fill="#3A3B37" transform="rotate(${k * 15} 66 66)"/>`;
    let html = `<div class="knob" id="knob" aria-hidden="true"><svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="65" fill="#1C1C1A"/>${grip}<circle cx="66" cy="66" r="48" fill="#2A2B28"/><rect x="62" y="16" width="8" height="42" rx="3" fill="#F2B705"/></svg></div>`;
    METRICS.forEach((m, i) => {
      const a = KNOB_ANGLE(i) * Math.PI / 180, r = 146;
      const x = 180 + r * Math.sin(a), y = 164 - r * Math.cos(a);
      const dx = 180 + 86 * Math.sin(a), dy = 164 - 86 * Math.cos(a);
      html += `<span class="knob-dot" style="left:${dx}px;top:${dy}px"></span>`;
      html += `<button class="knob-label" type="button" role="radio" data-metric="${i}" style="left:${x}px;top:${y}px">${esc(m.short)}</button>`;
    });
    wrap.innerHTML = html;
    wrap.addEventListener('click', e => { const b = e.target.closest('[data-metric]'); if (b) setMetric(+b.dataset.metric); });
    wrap.addEventListener('keydown', radioKeys);
    $('#knob').addEventListener('click', () => setMetric((state.metric + 1) % METRICS.length));
  }
  function buildKeys() {
    $$('[data-keys]').forEach(box => {
      box.setAttribute('role', 'radiogroup');
      box.innerHTML = METRICS.map((m, i) => `<button class="key" type="button" role="radio" data-metric="${i}">${esc(m.short)}</button>`).join('');
      box.addEventListener('click', e => { const b = e.target.closest('[data-metric]'); if (b) setMetric(+b.dataset.metric); });
      box.addEventListener('keydown', radioKeys);
    });
  }
  function radioKeys(e) {
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const next = (state.metric + dir + METRICS.length) % METRICS.length;
    setMetric(next);
    const b = e.currentTarget.querySelector(`[data-metric="${next}"]`);
    if (b) b.focus();
  }
  function syncSwitches() {
    $$('[data-metric]').forEach(b => {
      const on = +b.dataset.metric === state.metric;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    const knob = $('#knob');
    if (knob) knob.style.transform = `rotate(${KNOB_ANGLE(state.metric)}deg)`;
  }
  function setMetric(i) {
    state.metric = i;
    syncSwitches();
    renderHero();
    renderLeaders();
    renderBoard();
    renderMap();
  }

  /* ---------- Hero ---------- */
  let heroNeedle = null, heroLamp = null;
  function buildHero() {
    const el = $('#heroDial');
    heroNeedle = mountDial(el, { left: 'Miastometr' })[0];
    heroLamp = document.createElement('div');
    heroLamp.className = 'hero-lamp';
    heroLamp.innerHTML = '<span class="big-lamp"></span><span class="hero-lamp-txt"></span>';
    el.appendChild(heroLamp);
    el.setAttribute('role', 'img');
  }
  function renderHero() {
    const m = METRICS[state.metric], c = BY_NAME.get(state.city);
    const el = $('#heroDial'), ro = $('#heroReadout');
    $('#heroProfileLink').textContent = `Pełny profil: ${c.name}`;
    if (m.lamp) {
      const air = airOf(c);
      el.classList.add('is-lamp');
      heroLamp.style.cssText = lampStyle(air);
      heroLamp.querySelector('.hero-lamp-txt').textContent = air ? air.category : 'Brak stacji';
      aim(heroNeedle, 0);
      ro.innerHTML = air
        ? `<span class="r-value">${esc(air.category)}</span><span class="r-line">Indeks GIOŚ ze stacji w mieście: <b>${air.stationCount}</b></span><span class="r-line">Odczyt z ${esc(fmtDateTime(air.lastUpdate))}</span>`
        : `<span class="r-value">Brak stacji</span><span class="r-line">GIOŚ nie ma stacji pomiarowej w tym mieście.</span>`;
      el.setAttribute('aria-label', `${c.name}, jakość powietrza: ${air ? air.category : 'brak stacji pomiarowej'}`);
      return;
    }
    el.classList.remove('is-lamp');
    const s = stat(m, c.name);
    rebuildBandFor(el, m);
    if (!s) {
      aim(heroNeedle, 0);
      ro.innerHTML = `<span class="r-value">Brak danych</span><span class="r-line">GUS nie publikuje tej wartości dla miasta ${esc(c.name)}.</span>`;
      el.setAttribute('aria-label', `${c.name}: brak danych`);
      return;
    }
    aim(heroNeedle, s.pct);
    const yr = m.year(c);
    ro.innerHTML = `<span class="r-value">${fmtVal(m, s.v)} <span class="r-unit">${esc(m.unit)}</span></span>
      <span class="r-line">${pctPhrase(m, s.pct)}, miejsce <b>${s.rank}</b> z ${s.n}</span>
      <span class="r-line">${esc(m.long)}${yr ? `, GUS, ${esc(m.period ? m.period(yr) : yr)}` : ''}</span>`;
    el.setAttribute('aria-label', `${c.name}, ${m.long}: ${fmtVal(m, s.v)} ${m.unit}. ${m.better === 'size' ? 'Większe' : 'Lepiej'} niż ${Math.round(s.pct)} procent miast, miejsce ${s.rank} z ${s.n}.`);
  }
  // Swap the zone band when switching between zoned and neutral metrics, keeping the needle node.
  function rebuildBandFor(el, m) {
    const svg = el.querySelector('svg');
    const neutral = m.better === 'size';
    if (svg.dataset.neutral === String(neutral)) return;
    svg.dataset.neutral = String(neutral);
    svg.querySelectorAll('.band').forEach(p => p.remove());
    const ns = 'http://www.w3.org/2000/svg';
    const parts = neutral ? [[-SW, SW, '#1C1C1A', 4]] : [[-SW, -SW / 3, ZONE.red, 5], [-SW / 3, SW / 3, ZONE.mid, 5], [SW / 3, SW, ZONE.green, 5]];
    svg.querySelectorAll(':scope > path:not(.mirror)').forEach(p => { if (p.getAttribute('stroke-width') === '5' || p.getAttribute('stroke-width') === '4') p.remove(); });
    const first = svg.querySelector('.mirror');
    for (const [a, b, col, w] of parts) {
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', arc(R + 6, a, b)); p.setAttribute('stroke', col); p.setAttribute('stroke-width', w); p.setAttribute('fill', 'none');
      p.setAttribute('class', 'band');
      svg.insertBefore(p, first);
    }
  }

  /* ---------- Leaders ---------- */
  let leaderNeedles = [];
  function buildLeaders() {
    const row = $('#leaders');
    row.innerHTML = Array.from({ length: 5 }, (_, i) => `<button class="leader" type="button" data-i="${i}"><div class="meter meter--mini"></div><span class="l-name"></span><span class="l-val"></span></button>`).join('');
    leaderNeedles = $$('#leaders .meter').map(el => mountDial(el, { left: '', right: '' })[0]);
    row.addEventListener('click', e => { const b = e.target.closest('.leader'); if (b && b.dataset.city) setCity(b.dataset.city); });
  }
  function renderLeaders(initial) {
    const m = METRICS[state.metric];
    const title = $('#leadersTitle');
    const row = $('#leaders');
    if (m.lamp) {
      const counts = {};
      CITIES.forEach(c => { const a = airOf(c); const k = a ? a.category : 'brak stacji'; counts[k] = (counts[k] || 0) + 1; });
      title.textContent = 'Powietrze w tej chwili';
      row.classList.add('is-note');
      row.dataset.note = Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' · ');
      return;
    }
    row.classList.remove('is-note');
    title.textContent = m.better === 'size' ? 'Największe miasta' : `Czołówka: ${m.label.toLowerCase()}`;
    const top = [...STATS[m.key].entries()].sort((a, b) => a[1].rank - b[1].rank || a[0].localeCompare(b[0], 'pl')).slice(0, 5);
    $$('#leaders .leader').forEach((b, i) => {
      const [name, s] = top[i];
      b.dataset.city = name;
      b.querySelector('.l-name').innerHTML = `<span class="l-pos">${s.rank}.</span> ${esc(name)}`;
      b.querySelector('.l-val').textContent = `${fmtVal(m, s.v)} ${m.unit}`;
      b.setAttribute('aria-label', `${s.rank}. ${name}: ${fmtVal(m, s.v)} ${m.unit}. Ustaw jako moje miasto.`);
      aim(leaderNeedles[i], s.pct, initial ? 650 + i * 130 : i * 60);
    });
  }

  /* ---------- Board ---------- */
  function renderBoard() {
    const m = METRICS[state.metric];
    $('#valueHead').textContent = m.lamp ? 'Odczyt GIOŚ' : m.label;
    $('#orderLabel').textContent = state.order === 'best' ? (m.better === 'size' ? 'Od największego' : 'Od najlepszego') : (m.better === 'size' ? 'Od najmniejszego' : 'Od najsłabszego');
    $('#orderToggle').setAttribute('aria-pressed', state.order === 'worst' ? 'true' : 'false');
    $('#metricNote').textContent = m.lamp ? airNote() : m.note;

    const q = fold(state.search.trim());
    let rows = CITIES.filter(c => (!q || fold(c.name).includes(q)) && (!state.voiv || voivOf(c.name) === state.voiv));
    const s = c => stat(m, c.name);
    rows.sort((a, b) => {
      const sa = s(a), sb = s(b);
      if (!sa && !sb) return a.name.localeCompare(b.name, 'pl');
      if (!sa) return 1; if (!sb) return -1;
      const d = state.order === 'best' ? sa.rank - sb.rank : sb.rank - sa.rank;
      return d || a.name.localeCompare(b.name, 'pl');
    });
    const filtered = !!(q || state.voiv);
    const total = rows.length;
    if (!filtered && !state.showAll) rows = rows.slice(0, 15);
    const more = $('#boardMore');
    more.hidden = filtered || total <= 15;
    more.textContent = state.showAll ? 'Zwiń do 15 miast' : `Pokaż wszystkie ${total} miast`;
    more.setAttribute('aria-expanded', state.showAll ? 'true' : 'false');
    const body = $('#boardBody');
    if (!rows.length) { body.innerHTML = `<tr><td colspan="4" class="empty">Żadne miasto nie pasuje do „${esc(state.search)}”. Sprawdź pisownię albo wyczyść filtr województwa.</td></tr>`; return; }
    body.innerHTML = rows.map(c => {
      const st = s(c);
      const pos = st ? (st.rank <= 3 && !m.lamp ? `<span class="pos--top">${st.rank}</span>` : st.rank) : '–';
      let val, scale;
      if (m.lamp) {
        const air = airOf(c);
        val = air ? `<b>${esc(air.category)}</b><span>${air.stationCount} st.</span>` : '<span class="na">brak stacji</span>';
        scale = `<div class="air-cell"><span class="lamp" style="${lampStyle(air)}"></span>${air ? 'odczyt GIOŚ' : 'brak odczytu'}</div>`;
      } else if (st) {
        val = `<b>${fmtVal(m, st.v)}</b><span>${esc(m.unit)}</span>`;
        scale = `<div class="edge${m.better === 'size' ? ' edge--neutral' : ''}" role="img" aria-label="${Math.round(st.pct)} na 100"><div class="edge-ticks"></div><div class="edge-band"></div><div class="edge-needle" style="left:${st.pct.toFixed(1)}%"></div></div>`;
      } else { val = '<span class="na">brak danych</span>'; scale = ''; }
      return `<tr tabindex="0" data-city="${esc(c.name)}"><td class="pos">${pos}</td><td class="city"><b>${esc(c.name)}</b><span>${esc(voivOf(c.name))}</span></td><td class="value">${val}</td><td class="col-scale">${scale}</td></tr>`;
    }).join('');
  }
  function airNote() {
    const counts = {};
    CITIES.forEach(c => { const a = airOf(c); const k = a ? a.category.toLowerCase() : 'bez stacji'; counts[k] = (counts[k] || 0) + 1; });
    const parts = Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ');
    return `Indeks GIOŚ z ${fmtDateTime(latestAir())}. Stan miast: ${parts}. Gdy prawie wszystkie mają ten sam odczyt, kolejność między nimi jest alfabetyczna.`;
  }

  /* ---------- Map ---------- */
  function voivOf(name) { return GEO && GEO.cities[name] ? GEO.cities[name].voivodeship : ''; }
  let mapBuilt = false;
  function buildMap() {
    const svg = $('#map');
    const [, , w, h] = GEO.viewBox.split(' ').map(Number);
    svg.setAttribute('viewBox', `-10 -10 ${w + 20} ${h + 20}`);
    const maxPop = Math.max(...CITIES.map(c => (c.population && c.population.value) || 0));
    const order = [...CITIES].sort((a, b) => ((b.population && b.population.value) || 0) - ((a.population && a.population.value) || 0));
    const labels = new Set(order.slice(0, 9).map(c => c.name));
    let html = GEO.voivodeships.map(v => `<path class="voiv" data-voiv="${esc(v.name)}" d="${v.d}"/>`).join('');
    html += order.map(c => {
      const g = GEO.cities[c.name]; if (!g) return '';
      const r = (6 + 18 * Math.sqrt(((c.population && c.population.value) || 0) / maxPop)).toFixed(1);
      return `<circle class="city-dot" data-city="${esc(c.name)}" cx="${g.x}" cy="${g.y}" r="${r}" data-r="${r}" tabindex="0" role="button" aria-label="${esc(c.name)}"/>`;
    }).join('');
    html += order.filter(c => labels.has(c.name)).map(c => {
      const g = GEO.cities[c.name], r = 6 + 18 * Math.sqrt(c.population.value / maxPop);
      const left = false;
      return `<text class="city-lbl" x="${left ? g.x - r - 6 : g.x + r + 6}" y="${g.y + 5}" text-anchor="${left ? 'end' : 'start'}">${esc(c.name)}</text>`;
    }).join('');
    svg.innerHTML = html;

    const tip = $('#mapTip'), frame = $('.map-frame');
    const show = dot => {
      const name = dot.dataset.city, m = METRICS[state.metric], c = BY_NAME.get(name);
      tip.innerHTML = `<b>${esc(name)}</b>${esc(valueText(m, c))}`;
      const fr = frame.getBoundingClientRect(), dr = dot.getBoundingClientRect();
      tip.style.left = (dr.left + dr.width / 2 - fr.left) + 'px';
      tip.style.top = (dr.top - fr.top) + 'px';
      tip.hidden = false;
      renderMapReadout(name, false);
    };
    const hide = () => { tip.hidden = true; renderMapReadout(state.city, true); };
    svg.addEventListener('pointerover', e => { const d = e.target.closest('.city-dot'); if (d) show(d); });
    svg.addEventListener('pointerout', e => { if (e.target.closest('.city-dot')) hide(); });
    svg.addEventListener('focusin', e => { const d = e.target.closest('.city-dot'); if (d) show(d); });
    svg.addEventListener('focusout', hide);
    svg.addEventListener('click', e => { const d = e.target.closest('.city-dot'); if (d) { setCity(d.dataset.city); renderMapReadout(d.dataset.city, true); } });
    svg.addEventListener('keydown', e => { const d = e.target.closest('.city-dot'); if (d && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setCity(d.dataset.city); openProfile(); } });
    mapBuilt = true;
  }
  function valueText(m, c) {
    if (m.lamp) { const a = airOf(c); return a ? `Powietrze: ${a.category}` : 'Brak stacji GIOŚ'; }
    const s = stat(m, c.name);
    return s ? `${fmtVal(m, s.v)} ${m.unit} · miejsce ${s.rank}/${s.n}` : 'brak danych';
  }
  function renderMap() {
    if (!mapBuilt) return;
    const m = METRICS[state.metric];
    $$('#map .city-dot').forEach(d => {
      const c = BY_NAME.get(d.dataset.city);
      let fill;
      if (m.lamp) { const a = airOf(c); fill = a ? AIR_LEVELS[a.category].color : '#b9bcb5'; }
      else { const s = stat(m, c.name); fill = s ? zoneColor(m, s.pct) : '#b9bcb5'; }
      d.style.fill = fill;
      d.classList.toggle('is-active', c.name === state.city);
      d.setAttribute('aria-label', `${c.name}: ${valueText(m, c)}`);
    });
    const home = voivOf(state.city);
    $$('#map .voiv').forEach(p => p.classList.toggle('is-home', p.dataset.voiv === home));
    renderLegend(m);
    renderMapReadout(state.city, true);
  }
  function renderLegend(m) {
    let items;
    if (m.lamp) items = Object.entries(AIR_LEVELS).slice(0, 4).map(([k, v]) => [v.color, k]).concat([['#b9bcb5', 'brak stacji']]);
    else if (m.better === 'size') items = [['#FFFFFF', 'każde miasto; wielkość punktu = liczba mieszkańców']];
    else items = [[ZONE.green, 'lepiej niż 2/3 miast'], [ZONE.mid, 'środek stawki'], [ZONE.red, 'gorzej niż 2/3 miast']];
    $('#mapLegend').innerHTML = `<h3>${esc(m.lamp ? 'Jakość powietrza' : m.label)}</h3><ul>${items.map(([c, t]) => `<li><i style="background:${c}"></i>${esc(t)}</li>`).join('')}</ul>`;
  }
  function renderMapReadout(name, isSelected) {
    const m = METRICS[state.metric], c = BY_NAME.get(name);
    const s = m.lamp ? null : stat(m, name);
    const val = m.lamp ? (airOf(c) ? airOf(c).category : 'brak stacji GIOŚ') : (s ? `${fmtVal(m, s.v)} ${m.unit}` : 'brak danych');
    const rank = s ? `Miejsce ${s.rank} z ${s.n}` : '';
    $('#mapReadout').innerHTML = `<div class="m-name">${esc(name)}</div><div class="m-voiv">woj. ${esc(voivOf(name))}</div>
      <div class="m-val">${esc(val)}</div>${rank ? `<div class="m-rank">${rank}</div>` : ''}
      ${isSelected ? '<a class="btn btn--orange" href="#miasto">Otwórz profil</a>' : '<div class="hint" style="margin-top:12px">Kliknij punkt, żeby wybrać miasto.</div>'}`;
  }

  /* ---------- Profile ---------- */
  let clusterNeedles = [];
  let clusterSeen = false;
  function buildCluster() {
    const box = $('#cluster');
    box.innerHTML = METRICS.map((m, i) => m.lamp
      ? `<div class="gauge" data-i="${i}"><div class="gauge-lamp"><span class="big-lamp"></span></div><h3>${esc(m.label)}</h3><div class="g-val"></div><div class="g-rank"></div></div>`
      : `<div class="gauge" data-i="${i}"><div class="meter meter--gauge"></div><h3>${esc(m.label)}</h3><div class="g-val"></div><div class="g-rank"></div></div>`).join('');
    clusterNeedles = METRICS.map((m, i) => {
      if (m.lamp) return null;
      const el = box.querySelector(`.gauge[data-i="${i}"] .meter`);
      return mountDial(el, { neutral: m.better === 'size', left: m.short, right: '% miast' })[0];
    });
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { clusterSeen = true; renderProfile(true); io.disconnect(); }
    }, { threshold: .25 }) : null;
    if (io) io.observe(box); else clusterSeen = true;
  }
  function renderProfile(sweep) {
    const c = BY_NAME.get(state.city);
    $('#profileName').textContent = c.name;
    $('#profileVoiv').textContent = `województwo ${voivOf(c.name)} · ${c.powiatRights ? 'miasto na prawach powiatu' : 'miasto bez praw powiatu'}${c.population ? ` · ${nf0.format(c.population.value)} mieszkańców` : ''}`;
    const ranked = METRICS.filter(m => !m.lamp && m.better !== 'size').map(m => ({ m, s: stat(m, c.name) })).filter(x => x.s);
    ranked.sort((a, b) => b.s.pct - a.s.pct);
    if (ranked.length) {
      const best = ranked[0], worst = ranked[ranked.length - 1];
      $('#profileSum').innerHTML = `Najmocniej wypada w kategorii <b>${esc(best.m.label.toLowerCase())}</b> (miejsce ${best.s.rank} z ${best.s.n}), najsłabiej w kategorii <b>${esc(worst.m.label.toLowerCase())}</b> (miejsce ${worst.s.rank} z ${worst.s.n}).`;
    }
    METRICS.forEach((m, i) => {
      const g = $(`#cluster .gauge[data-i="${i}"]`);
      if (m.lamp) {
        const a = airOf(c);
        g.querySelector('.big-lamp').style.cssText = lampStyle(a);
        g.querySelector('.g-val').textContent = a ? a.category : 'Brak stacji';
        g.querySelector('.g-rank').textContent = a ? `Indeks GIOŚ, stacji: ${a.stationCount}` : 'GIOŚ nie mierzy tu powietrza';
        return;
      }
      const s = stat(m, c.name);
      g.querySelector('.g-val').innerHTML = s ? `${fmtVal(m, s.v)}<small>${esc(m.unit)}</small>` : '<span class="na">brak danych</span>';
      g.querySelector('.g-rank').textContent = s ? `Miejsce ${s.rank} z ${s.n}` : '';
      g.setAttribute('aria-label', `${m.label}: ${s ? `${fmtVal(m, s.v)} ${m.unit}, miejsce ${s.rank} z ${s.n}` : 'brak danych'}`);
      if (clusterSeen) aim(clusterNeedles[i], s ? s.pct : 0, sweep ? i * 90 : 0);
    });
    $('#profileCity').value = c.name;
  }
  function openProfile() {
    history.replaceState(null, '', '#miasto=' + encodeURIComponent(state.city));
    $('#miasto').scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' });
  }

  /* ---------- City selection ---------- */
  function fillCitySelects() {
    const opts = [...CITIES].sort((a, b) => a.name.localeCompare(b.name, 'pl')).map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
    $$('[data-city-select]').forEach(s => { s.innerHTML = opts; s.value = state.city; s.addEventListener('change', () => setCity(s.value, s.id === 'profileCity')); });
    const voivs = [...new Set(CITIES.map(c => voivOf(c.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pl'));
    $('#voivFilter').insertAdjacentHTML('beforeend', voivs.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join(''));
  }
  function setCity(name, fromProfile) {
    if (!BY_NAME.has(name)) return;
    state.city = name;
    $$('[data-city-select]').forEach(s => { s.value = name; });
    renderHero();
    renderProfile(false);
    renderMap();
    if (fromProfile) history.replaceState(null, '', '#miasto=' + encodeURIComponent(name));
  }

  /* ---------- Finder ---------- */
  const PRESETS = {
    kariera: { salary: 4, population: 2, unemployment: 3, air: 0, migration: 2, firms: 4, green: 0, housing: 0 },
    rodzina: { salary: 2, population: 0, unemployment: 3, air: 3, migration: 1, firms: 0, green: 3, housing: 4 },
    zielen: { salary: 1, population: -2, unemployment: 1, air: 4, migration: 0, firms: 0, green: 4, housing: 2 },
    zero: { salary: 0, population: 0, unemployment: 0, air: 0, migration: 0, firms: 0, green: 0, housing: 0 },
  };
  const W_LABEL = ['pomijam', 'trochę', 'średnio', 'ważne', 'kluczowe'];
  const P_LABEL = { '-2': 'zdecydowanie mniejsze', '-1': 'raczej mniejsze', '0': 'obojętne', '1': 'raczej większe', '2': 'zdecydowanie większe' };
  function buildFinder() {
    state.weights = { salary: 3, population: 0, unemployment: 2, air: 1, migration: 1, firms: 1, green: 2, housing: 1 };
    $('#mixer').innerHTML = METRICS.map(m => {
      const bip = m.better === 'size';
      return `<div class="fader${bip ? ' fader--bipolar' : ''}">
        <label for="w-${m.key}">${esc(bip ? 'Wielkość miasta' : m.label)}</label>
        <input type="range" id="w-${m.key}" data-key="${m.key}" min="${bip ? -2 : 0}" max="${bip ? 2 : 4}" step="1" value="${state.weights[m.key]}">
        <output for="w-${m.key}" id="o-${m.key}"></output>
        ${m.lamp ? '<span class="fader-note">Dziś prawie wszystkie miasta mają ten sam odczyt, więc ten suwak mało zmienia.</span>' : ''}
      </div>`;
    }).join('');
    $('#mixer').addEventListener('input', e => {
      const r = e.target.closest('input[type=range]'); if (!r) return;
      state.weights[r.dataset.key] = +r.value;
      $$('.preset').forEach(p => { p.classList.remove('is-on'); p.setAttribute('aria-pressed', 'false'); });
      renderFinder();
    });
    $$('.preset').forEach(p => p.addEventListener('click', () => {
      Object.assign(state.weights, PRESETS[p.dataset.preset]);
      $$('#mixer input').forEach(r => { r.value = state.weights[r.dataset.key]; });
      $$('.preset').forEach(x => { const on = x === p && p.dataset.preset !== 'zero'; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      renderFinder();
    }));
    $('#results').addEventListener('click', e => { const li = e.target.closest('li[data-city]'); if (li) { setCity(li.dataset.city); openProfile(); } });
    $('#results').addEventListener('keydown', e => { const li = e.target.closest('li[data-city]'); if (li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setCity(li.dataset.city); openProfile(); } });
  }
  function renderFinder() {
    METRICS.forEach(m => {
      const v = state.weights[m.key];
      $(`#o-${m.key}`).textContent = m.better === 'size' ? P_LABEL[String(v)] : W_LABEL[v];
    });
    const totalW = METRICS.reduce((s, m) => s + Math.abs(state.weights[m.key]), 0);
    if (!totalW) { $('#results').innerHTML = '<li class="empty-li" style="cursor:default;display:block">Wszystkie suwaki są na zerze. Przesuń chociaż jeden, żeby zobaczyć wynik.</li>'; return; }
    const scored = CITIES.map(c => {
      let sum = 0, wsum = 0; const parts = [];
      for (const m of METRICS) {
        const w = state.weights[m.key]; if (!w) continue;
        let score;
        if (m.lamp) { const a = airOf(c); if (!a) continue; score = AIR_LEVELS[a.category].score; }
        else { const s = stat(m, c.name); if (!s) continue; score = m.better === 'size' ? (w > 0 ? s.pct : 100 - s.pct) : s.pct; }
        sum += Math.abs(w) * score; wsum += Math.abs(w);
        parts.push({ m, contrib: Math.abs(w) * score });
      }
      parts.sort((a, b) => b.contrib - a.contrib);
      return { c, score: wsum ? sum / wsum : 0, top: parts.slice(0, 2).map(p => p.m.short.toLowerCase()) };
    }).sort((a, b) => b.score - a.score).slice(0, 10);
    $('#results').innerHTML = scored.map(r => `<li tabindex="0" data-city="${esc(r.c.name)}"><div><span class="res-name">${esc(r.c.name)}</span><span class="res-why">mocne strony: ${esc(r.top.join(', '))}</span><div class="edge edge--res" aria-hidden="true"><div class="edge-ticks"></div><div class="edge-band"></div><div class="edge-needle" style="left:${r.score.toFixed(1)}%"></div></div></div><div class="res-score">${Math.round(r.score)}<small>na 100</small></div></li>`).join('');
  }

  /* ---------- Compare ---------- */
  let cmpNeedles = [];
  let cmpSeen = false;
  function buildCompare() {
    const opts = '<option value="">brak</option>' + [...CITIES].sort((a, b) => a.name.localeCompare(b.name, 'pl')).map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
    $('#comparePick').innerHTML = [0, 1, 2].map(i => `<label class="pick"><span class="chip" style="background:${CMP_COLORS[i]}"></span><span class="visually-hidden" style="position:absolute;left:-9999px">Miasto ${i + 1}</span><select data-slot="${i}">${opts}</select><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2"/></svg></label>`).join('');
    $$('#comparePick select').forEach(s => { s.value = state.compare[+s.dataset.slot] || ''; s.addEventListener('change', () => { state.compare[+s.dataset.slot] = s.value; renderCompare(); }); });
    $('#compareGrid').innerHTML = METRICS.map((m, i) => m.lamp
      ? `<div class="cmp" data-i="${i}"><div class="gauge-lamp cmp-lamps"></div><h3>${esc(m.label)}</h3><ul></ul></div>`
      : `<div class="cmp" data-i="${i}"><div class="meter meter--cmp"></div><h3>${esc(m.label)}</h3><ul></ul></div>`).join('');
    cmpNeedles = METRICS.map((m, i) => m.lamp ? null : mountDial($(`#compareGrid .cmp[data-i="${i}"] .meter`), { neutral: m.better === 'size', needles: 3, colors: CMP_COLORS, left: m.short }));
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { cmpSeen = true; renderCompare(true); io.disconnect(); }
    }, { threshold: .2 }) : null;
    if (io) io.observe($('#compareGrid')); else cmpSeen = true;
  }
  function renderCompare(sweep) {
    const picks = state.compare.map(n => (n && BY_NAME.get(n)) || null);
    METRICS.forEach((m, i) => {
      const box = $(`#compareGrid .cmp[data-i="${i}"]`);
      let bestIdx = -1;
      if (!m.lamp && m.better !== 'size') {
        let bestPct = -1;
        picks.forEach((c, k) => { const s = c && stat(m, c.name); if (s && s.pct > bestPct) { bestPct = s.pct; bestIdx = k; } });
      }
      box.querySelector('ul').innerHTML = picks.map((c, k) => {
        if (!c) return '';
        let v;
        if (m.lamp) { const a = airOf(c); v = a ? esc(a.category) : '<span class="na">brak stacji</span>'; }
        else { const s = stat(m, c.name); v = s ? `${fmtVal(m, s.v)}` : '<span class="na">brak danych</span>'; }
        return `<li class="${k === bestIdx ? 'win' : ''}"><i style="background:${CMP_COLORS[k]}"></i><span>${esc(c.name)}</span><b>${v}</b></li>`;
      }).join('');
      if (m.lamp) {
        box.querySelector('.cmp-lamps').innerHTML = picks.map((c, k) => c ? `<span class="cmp-lamp"><span class="big-lamp" style="${lampStyle(airOf(c))}"></span><i style="background:${CMP_COLORS[k]}"></i></span>` : '').join('');
        return;
      }
      if (!cmpSeen) return;
      cmpNeedles[i].forEach((n, k) => {
        const c = picks[k], s = c && stat(m, c.name);
        n.el.style.opacity = s ? '1' : '0';
        aim(n, s ? s.pct : 0, sweep ? i * 70 + k * 110 : k * 40);
      });
    });
  }
  function addToCompare() {
    const name = state.city;
    if (state.compare.includes(name)) { toast(`${name} już jest w porównaniu.`); }
    else {
      const slot = state.compare.findIndex(x => !x);
      state.compare[slot === -1 ? 2 : slot] = name;
      $$('#comparePick select').forEach(s => { s.value = state.compare[+s.dataset.slot] || ''; });
      renderCompare();
      toast(`Dodano ${name} do porównania.`);
    }
    $('#porownaj').scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' });
  }

  /* ---------- Misc ---------- */
  let toastTimer = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2400);
  }
  function latestAir() { return CITIES.map(c => c.air && c.air.lastUpdate).filter(Boolean).sort().pop() || ''; }
  function fmtDateTime(s) {
    if (!s) return '—';
    const d = new Date(s.replace(' ', 'T'));
    return isNaN(d) ? s : d.toLocaleString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function readHash() {
    const m = decodeURIComponent(location.hash || '').match(/^#miasto=(.+)$/);
    return m && BY_NAME.has(m[1]) ? m[1] : null;
  }

  async function main() {
    injectDefs();
    try {
      const [d, g] = await Promise.all([fetch('data/cities.json').then(r => r.json()), fetch('data/geo.json').then(r => r.json())]);
      CITIES = d.cities; GEO = g;
      CITIES.forEach(c => BY_NAME.set(c.name, c));
      buildStats();
      $('#genDate').textContent = new Date(d.generatedAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
      $('#airDate').textContent = fmtDateTime(latestAir());
    } catch (e) {
      $('#boardBody').innerHTML = '<tr><td colspan="4" class="empty">Nie udało się wczytać danych. Odśwież stronę; jeśli problem wraca, spróbuj za kilka minut.</td></tr>';
      $('#heroReadout').innerHTML = '<span class="r-line">Nie udało się wczytać danych. Odśwież stronę.</span>';
      return;
    }
    const fromHash = readHash();
    if (fromHash) state.city = fromHash;

    buildKnob(); buildKeys(); buildHero(); buildLeaders();
    fillCitySelects(); buildMap(); buildCluster(); buildFinder(); buildCompare();
    syncSwitches();

    $('#search').addEventListener('input', e => { state.search = e.target.value; renderBoard(); });
    $('#voivFilter').addEventListener('change', e => { state.voiv = e.target.value; renderBoard(); });
    $('#boardMore').addEventListener('click', () => { state.showAll = !state.showAll; renderBoard(); if (!state.showAll) $('#ranking').scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' }); });
    $('#orderToggle').addEventListener('click', () => { state.order = state.order === 'best' ? 'worst' : 'best'; renderBoard(); });
    const openRow = tr => { setCity(tr.dataset.city); openProfile(); };
    $('#boardBody').addEventListener('click', e => { const tr = e.target.closest('tr[data-city]'); if (tr) openRow(tr); });
    $('#boardBody').addEventListener('keydown', e => { const tr = e.target.closest('tr[data-city]'); if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openRow(tr); } });
    $('#heroProfileLink').addEventListener('click', e => { e.preventDefault(); openProfile(); });
    $('#mapReadout').addEventListener('click', e => { if (e.target.closest('a[href="#miasto"]')) { e.preventDefault(); openProfile(); } });
    $('#toCompareBtn').addEventListener('click', addToCompare);
    $('#shareBtn').addEventListener('click', async () => {
      const url = location.origin + location.pathname + '#miasto=' + encodeURIComponent(state.city);
      try { await navigator.clipboard.writeText(url); toast('Link do profilu skopiowany.'); }
      catch { toast(url); }
    });

    renderHero(); renderLeaders(true); renderBoard(); renderMap(); renderProfile(false); renderFinder(); renderCompare();
    setTimeout(() => { if (heroNeedle) renderHero(); }, 0);
    if (fromHash) setTimeout(() => $('#miasto').scrollIntoView(), 60);
  }

  main();
})();
