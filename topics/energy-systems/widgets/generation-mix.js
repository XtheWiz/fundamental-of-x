// Generation mix widget: pick a country preset, see fuel mix as a
// stacked bar, plus role assignment (baseload / mid / peaker / variable).

const COUNTRIES = {
  'France':      { coal: 1, gas: 7, nuclear: 65, hydro: 11, wind: 9, solar: 4,  other: 3 },
  'Germany':     { coal: 24, gas: 14, nuclear: 4, hydro: 4, wind: 26, solar: 12, other: 16 },
  'USA':         { coal: 16, gas: 43, nuclear: 18, hydro: 6, wind: 10, solar: 5, other: 2 },
  'China':       { coal: 60, gas: 3,  nuclear: 5, hydro: 14, wind: 9, solar: 6, other: 3 },
  'Norway':      { coal: 0, gas: 1, nuclear: 0, hydro: 88, wind: 11, solar: 0,  other: 0 },
  'Australia':   { coal: 47, gas: 18, nuclear: 0, hydro: 6, wind: 12, solar: 14, other: 3 },
  'Thailand':    { coal: 16, gas: 64, nuclear: 0, hydro: 4, wind: 1,  solar: 5, other: 10 },
};

const SOURCES = [
  { key: 'coal',    name: 'Coal',     color: '#1a1a1a', role: 'baseload',   carbon: 820 },
  { key: 'gas',     name: 'Gas',      color: '#888',    role: 'load-following', carbon: 490 },
  { key: 'nuclear', name: 'Nuclear',  color: '#9c27b0', role: 'baseload',   carbon: 12 },
  { key: 'hydro',   name: 'Hydro',    color: '#4ec9ff', role: 'flexible',   carbon: 24 },
  { key: 'wind',    name: 'Wind',     color: '#2b6cb0', role: 'variable',   carbon: 11 },
  { key: 'solar',   name: 'Solar',    color: '#f5a623', role: 'variable',   carbon: 45 },
  { key: 'other',   name: 'Other',    color: '#bbb',    role: 'mixed',      carbon: 200 },
];

export function initGenMixWidget(root) {
  let country = 'Germany';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Generation mix by country</div>

      <div class="controls">
        <label>Country:</label>
        <div class="pill-group">
          ${Object.keys(COUNTRIES).map((c, i) => `
            <input type="radio" name="gm-c" id="gm-c${i}" value="${c}" ${c === country ? 'checked' : ''}>
            <label for="gm-c${i}">${c}</label>
          `).join('')}
        </div>
      </div>

      <div class="widget-stage" id="gm-stage"></div>
      <div class="callout" id="gm-explain"></div>
    </div>
  `;

  root.querySelectorAll('input[name=gm-c]').forEach((r) =>
    r.addEventListener('change', (e) => { country = e.target.value; render(); }));

  function render() {
    const mix = COUNTRIES[country];
    const total = Object.values(mix).reduce((a, b) => a + b, 0);
    let carbon = 0;
    SOURCES.forEach((s) => carbon += (mix[s.key] / total) * s.carbon);

    let html = `<div style="display: flex; height: 45px; border: 2px solid var(--ink); border-radius: var(--radius); overflow: hidden; margin-bottom: 0.4rem;">
      ${SOURCES.map((s) => {
        const pct = (mix[s.key] / total) * 100;
        if (pct < 0.5) return '';
        return `<div style="width: ${pct}%; background: ${s.color}; display: flex; align-items: center; justify-content: center; color: white; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600;" title="${s.name} ${pct.toFixed(1)}%">${pct > 8 ? pct.toFixed(0) + '%' : ''}</div>`;
      }).join('')}
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.25rem; font-family: var(--font-mono); font-size: 0.78rem; margin-bottom: 0.8rem;">
      ${SOURCES.map((s) => `<div><span style="display: inline-block; width: 12px; height: 12px; background: ${s.color}; border: 1px solid var(--ink); vertical-align: middle;"></span> ${s.name}: <strong>${mix[s.key]}%</strong></div>`).join('')}
    </div>

    <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 1rem;">
      <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 0.4rem;">
        Avg carbon intensity: <strong style="color: ${carbon > 400 ? '#d62828' : carbon > 150 ? '#f5a623' : '#4caf50'};">${carbon.toFixed(0)} gCO₂/kWh</strong>
      </div>
      <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft);">Roles in this mix:</div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.2rem; font-family: var(--font-mono); font-size: 0.75rem; margin-top: 0.3rem;">
        ${['baseload', 'load-following', 'flexible', 'variable', 'mixed'].map((r) => {
          const s = SOURCES.filter((x) => x.role === r).reduce((a, b) => a + mix[b.key], 0);
          return `<div>${r}: <strong>${s}%</strong></div>`;
        }).join('')}
      </div>
    </div>`;
    root.querySelector('#gm-stage').innerHTML = html;

    const top = SOURCES.map((s) => ({ ...s, share: mix[s.key] })).sort((a, b) => b.share - a.share)[0];
    root.querySelector('#gm-explain').innerHTML = `<strong>${country}</strong> leans hardest on <strong>${top.name}</strong> (${top.share}%). ${
      carbon < 100 ? 'A predominantly low-carbon grid — your EV is genuinely clean here.' :
      carbon < 300 ? 'Mid-carbon grid. Renewables matter but fossil still sets the marginal carbon at most hours.' :
      'High-carbon grid. The marginal kWh almost certainly comes from coal or gas.'
    }`;
  }
  render();
}
