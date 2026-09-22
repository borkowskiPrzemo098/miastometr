(function(){
  "use strict";

  const METRICS = [
    { key:'salary', label:'Wynagrodzenie', unit:'brutto / mies.', better:'high', get:c=>c.salary && c.salary.value, colHead:'Wynagrodzenie brutto' },
    { key:'population', label:'Ludność', unit:'mieszkańców', better:'high', get:c=>c.population && c.population.value, colHead:'Liczba mieszkańców' },
    { key:'unemploymentPer1000', label:'Bezrobocie', unit:'os. / 1000 mieszk.', better:'low', get:c=>c.unemploymentPer1000, colHead:'Bezrobocie (na 1000 mieszk.)' },
    { key:'air', label:'Jakość powietrza', unit:'indeks GIOŚ', better:'low', get:c=>c.air && typeof c.air.avgIndex==='number' ? c.air.avgIndex : null, colHead:'Indeks jakości powietrza' },
    { key:'migrationBalancePer1000', label:'Saldo migracji', unit:'os. / 1000 mieszk.', better:'high', get:c=>c.migrationBalancePer1000 && c.migrationBalancePer1000.value, colHead:'Saldo migracji (na 1000 mieszk.)' },
    { key:'firmsPer10k', label:'Firmy', unit:'podmiotów / 10 tys. mieszk.', better:'high', get:c=>c.firmsPer10k && c.firmsPer10k.value, colHead:'Podmioty gosp. (na 10 tys. mieszk.)' },
    { key:'greenAreaPerCapita', label:'Zieleń', unit:'m² / os.', better:'high', get:c=>c.greenAreaPerCapita && c.greenAreaPerCapita.value, colHead:'Tereny zieleni (m² na mieszkańca)' },
    { key:'housingUnitsPer1000', label:'Mieszkania', unit:'mieszkań / 1000 os.', better:'high', get:c=>c.housingUnitsPer1000 && c.housingUnitsPer1000.value, colHead:'Zasób mieszkaniowy (na 1000 os.)' },
  ];

  const AIR_CATEGORY_PL = ['Bardzo dobry','Dobry','Umiarkowany','Dostateczny','Zły','Bardzo zły'];

  let DATA = null;
  let currentMetric = METRICS[0];
  let order = 'best'; // 'best' | 'worst'
  let compareSlots = [null, null, null];

  const fmtInt = n => n==null ? null : new Intl.NumberFormat('pl-PL').format(Math.round(n));
  const fmt1 = n => n==null ? null : new Intl.NumberFormat('pl-PL',{maximumFractionDigits:1}).format(n);

  function metricDisplay(metric, city) {
    const v = metric.get(city);
    if (v == null) return null;
    if (metric.key === 'salary') return fmtInt(v) + ' zł';
    if (metric.key === 'population') return fmtInt(v);
    if (metric.key === 'unemploymentPer1000') return fmt1(v);
    if (metric.key === 'air') return AIR_CATEGORY_PL[Math.round(v)] || fmt1(v);
    if (metric.key === 'migrationBalancePer1000') return (v > 0 ? '+' : '') + fmt1(v);
    return fmt1(v);
  }

  function pillClass(metric, city) {
    if (metric.key !== 'air') return '';
    const v = metric.get(city);
    if (v == null) return '';
    if (v <= 1) return 'good';
    if (v <= 2) return 'mid';
    return 'bad';
  }

  async function loadData() {
    const res = await fetch('data/cities.json', {cache:'no-store'});
    DATA = await res.json();
    document.getElementById('statCities').textContent = DATA.cities.length;
    const d = new Date(DATA.generatedAt);
    const dateStr = d.toLocaleDateString('pl-PL', {day:'numeric', month:'long', year:'numeric'});
    document.getElementById('statUpdated').textContent = dateStr;
    document.getElementById('lastUpdatedFooter').textContent = 'Dane odświeżone: ' + dateStr;
  }

  function buildMetricTabs() {
    const wrap = document.getElementById('metricTabs');
    wrap.innerHTML = '';
    METRICS.forEach(m => {
      const btn = document.createElement('button');
      btn.textContent = m.label;
      btn.type = 'button';
      btn.setAttribute('role','tab');
      btn.className = m === currentMetric ? 'active' : '';
      btn.addEventListener('click', () => {
        currentMetric = m;
        [...wrap.children].forEach(c=>c.classList.remove('active'));
        btn.classList.add('active');
        renderTable();
      });
      wrap.appendChild(btn);
    });
  }

  function getSorted(metric, searchTerm) {
    let list = DATA.cities.filter(c => metric.get(c) != null);
    if (searchTerm) {
      const t = searchTerm.toLocaleLowerCase('pl-PL');
      list = list.filter(c => c.name.toLocaleLowerCase('pl-PL').includes(t));
    }
    list.sort((a,b) => {
      const va = metric.get(a), vb = metric.get(b);
      const dir = metric.better === 'high' ? -1 : 1;
      return (va - vb) * dir;
    });
    if (order === 'worst') list.reverse();
    return list;
  }

  function renderTable() {
    if (!DATA) return;
    const searchTerm = document.getElementById('searchInput').value.trim();
    const list = getSorted(currentMetric, searchTerm);
    document.getElementById('metricColHead').textContent = currentMetric.colHead;

    const maxVal = Math.max(...list.map(c => currentMetric.get(c)).filter(v=>v!=null), 1);
    const minVal = Math.min(...list.map(c => currentMetric.get(c)).filter(v=>v!=null), 0);
    const range = maxVal - minVal || 1;

    const body = document.getElementById('rankBody');
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="4" class="loading-row">Brak miast spełniających kryteria wyszukiwania.</td></tr>';
      return;
    }

    body.innerHTML = list.map((c, i) => {
      const val = currentMetric.get(c);
      const display = metricDisplay(currentMetric, c);
      const frac = currentMetric.better === 'low'
        ? 1 - ((val - minVal) / range)
        : ((val - minVal) / range);
      const pct = Math.max(4, Math.round(frac * 100));
      const pill = currentMetric.key === 'air'
        ? `<span class="pill ${pillClass(currentMetric,c)}">${display}</span>`
        : `<span class="metric-val">${display} <span style="color:var(--ink-soft);font-weight:400;font-size:.8em">${currentMetric.unit}</span></span>`;
      return `<tr data-id="${c.id}">
        <td class="rank-num">${i+1}</td>
        <td class="city-name"><button class="city-link" data-action="add-compare" data-id="${c.id}">${escapeHtml(c.name)}</button></td>
        <td ${currentMetric.key==='air' ? '' : 'class="metric-val"'}>${pill}</td>
        <td class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div></td>
      </tr>`;
    }).join('');

    [...body.querySelectorAll('[data-action="add-compare"]')].forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCompare(btn.dataset.id);
      });
    });
  }

  function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function addToCompare(id) {
    if (compareSlots.includes(id)) return;
    const emptyIdx = compareSlots.findIndex(s => s === null);
    if (emptyIdx === -1) { compareSlots[0] = id; } else { compareSlots[emptyIdx] = id; }
    renderComparePicker();
    renderCompareGrid();
    document.getElementById('porownanie').scrollIntoView({behavior:'smooth', block:'start'});
  }

  function renderComparePicker() {
    const wrap = document.getElementById('comparePicker');
    wrap.innerHTML = '';
    for (let i=0;i<3;i++) {
      const slot = document.createElement('div');
      slot.className = 'compare-slot';
      const select = document.createElement('select');
      select.innerHTML = '<option value="">— wybierz miasto ' + (i+1) + ' —</option>' +
        DATA.cities.slice().sort((a,b)=>a.name.localeCompare(b.name,'pl')).map(c =>
          `<option value="${c.id}" ${compareSlots[i]===c.id?'selected':''}>${escapeHtml(c.name)}</option>`
        ).join('');
      select.addEventListener('change', () => {
        compareSlots[i] = select.value || null;
        renderCompareGrid();
      });
      slot.appendChild(select);
      wrap.appendChild(slot);
    }
  }

  function renderCompareGrid() {
    const grid = document.getElementById('compareGrid');
    const cities = compareSlots.map(id => id ? DATA.cities.find(c=>c.id===id) : null);
    if (cities.every(c=>!c)) { grid.innerHTML = ''; return; }

    let html = '<div class="cell label"></div>';
    cities.forEach(c => html += `<div class="cell head">${c ? escapeHtml(c.name) : '—'}</div>`);

    METRICS.forEach(m => {
      html += `<div class="cell label">${m.label}</div>`;
      const vals = cities.map(c => c ? m.get(c) : null);
      const best = m.better === 'high' ? Math.max(...vals.filter(v=>v!=null)) : Math.min(...vals.filter(v=>v!=null));
      cities.forEach((c,idx) => {
        if (!c) { html += '<div class="cell"></div>'; return; }
        const v = vals[idx];
        const display = v==null ? '<span class="na">brak danych</span>' : metricDisplay(m, c) + ' <span style="color:var(--ink-soft);font-size:.85em">' + m.unit + '</span>';
        const isWinner = v != null && v === best;
        html += `<div class="cell ${isWinner ? 'winner':''}">${display}</div>`;
      });
    });
    grid.innerHTML = html;
  }

  function initOrderToggle() {
    const btn = document.getElementById('orderToggle');
    btn.addEventListener('click', () => {
      order = order === 'best' ? 'worst' : 'best';
      document.getElementById('orderLabel').textContent = order === 'best' ? 'Od najlepszego' : 'Od najsłabszego';
      document.getElementById('orderIcon').style.transform = order === 'best' ? 'none' : 'rotate(180deg)';
      renderTable();
    });
  }

  function initTheme() {
    const btn = document.getElementById('themeToggle');
    const saved = (() => { try { return localStorage.getItem('miastometr-theme'); } catch(e){ return null; } })();
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
      btn.textContent = saved === 'dark' ? 'Tryb jasny' : 'Tryb ciemny';
    }
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      btn.textContent = next === 'dark' ? 'Tryb jasny' : 'Tryb ciemny';
      try { localStorage.setItem('miastometr-theme', next); } catch(e){}
    });
  }

  async function main() {
    initTheme();
    initOrderToggle();
    buildMetricTabs();
    document.getElementById('searchInput').addEventListener('input', renderTable);
    try {
      await loadData();
      renderTable();
      renderComparePicker();
    } catch (e) {
      document.getElementById('rankBody').innerHTML = '<tr><td colspan="4" class="loading-row">Nie udało się wczytać danych. Odśwież stronę.</td></tr>';
      console.error(e);
    }
  }

  main();
})();
