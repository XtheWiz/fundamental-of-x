// Units widget: a converter + capacity-factor calculator that shows how
// nameplate capacity differs from actual annual energy production.

const SOURCES = [
  { name: 'Solar PV (utility)',  cf: 0.22, color: '#f5a623' },
  { name: 'Wind onshore',        cf: 0.35, color: '#2b6cb0' },
  { name: 'Wind offshore',       cf: 0.48, color: '#1a4d80' },
  { name: 'Hydro',               cf: 0.40, color: '#4ec9ff' },
  { name: 'Coal',                cf: 0.55, color: '#4a4a4a' },
  { name: 'Gas (CCGT)',          cf: 0.55, color: '#888' },
  { name: 'Nuclear',             cf: 0.92, color: '#9c27b0' },
  { name: 'Battery (4-hr)',      cf: 0.12, color: '#4caf50' },
];

const SCALES = [
  { name: '100 W bulb (1 hr)',          wh: 100 },
  { name: 'Phone full charge',          wh: 15 },
  { name: 'EV daily commute',           wh: 8000 },
  { name: 'Home daily',                 wh: 30000 },
  { name: 'Steel factory daily',        wh: 5e7 },
  { name: 'Small town daily',           wh: 5e8 },
  { name: 'NYC daily',                  wh: 1.6e11 },
  { name: 'USA daily',                  wh: 1.1e13 },
];

export function initUnitsWidget(root) {
  let capMW = 1000;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">From nameplate watts → actual watt-hours</div>

      <div class="controls" style="display: grid; grid-template-columns: 200px 1fr 100px; gap: 0.6rem; align-items: center;">
        <label>Plant nameplate (MW):</label>
        <input type="range" id="un-c" min="10" max="5000" value="${capMW}" step="10">
        <div id="un-c-v" style="font-family: var(--font-mono); text-align: right;">${capMW}</div>
      </div>

      <div class="widget-stage" id="un-stage"></div>
      <div class="callout"><strong>The slogan:</strong> capacity tells you size, capacity factor tells you reality. A 1 GW solar farm produces less annual energy than a 400 MW nuclear plant.</div>
    </div>
  `;

  root.querySelector('#un-c').addEventListener('input', (e) => { capMW = +e.target.value; root.querySelector('#un-c-v').textContent = capMW; render(); });

  function fmt(wh) {
    if (wh >= 1e12) return (wh / 1e12).toFixed(2) + ' TWh';
    if (wh >= 1e9) return (wh / 1e9).toFixed(2) + ' GWh';
    if (wh >= 1e6) return (wh / 1e6).toFixed(2) + ' MWh';
    if (wh >= 1e3) return (wh / 1e3).toFixed(2) + ' kWh';
    return wh.toFixed(1) + ' Wh';
  }

  function render() {
    const capW = capMW * 1e6;
    let html = `<div style="display: grid; gap: 0.4rem;">`;
    SOURCES.forEach((s) => {
      const annualWh = capW * 8760 * s.cf;
      html += `<div style="display: grid; grid-template-columns: 170px 60px 1fr 130px; gap: 0.6rem; align-items: center; padding: 0.4rem 0.6rem; border: 1.5px solid var(--ink); border-radius: 3px; background: var(--paper);">
        <div style="font-family: var(--font-mono); font-size: 0.82rem;">${s.name}</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem; text-align: right;">CF ${(s.cf*100).toFixed(0)}%</div>
        <div style="position: relative; height: 18px; background: var(--paper-deep); border: 1px solid var(--ink); border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; width: ${s.cf*100}%; background: ${s.color};"></div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.8rem; text-align: right;"><strong>${fmt(annualWh)}/yr</strong></div>
      </div>`;
    });
    html += `</div>`;

    html += `<div style="margin-top: 1rem;"><strong>Scale check:</strong> what is one MWh?</div>`;
    html += `<div style="display: grid; gap: 0.25rem; margin-top: 0.4rem;">`;
    SCALES.forEach((sc) => {
      html += `<div style="display: grid; grid-template-columns: 200px 1fr; gap: 0.6rem; font-family: var(--font-mono); font-size: 0.78rem; padding: 0.2rem 0.4rem; border-bottom: 1px dashed var(--ink-soft);">
        <div>${sc.name}</div>
        <div><strong>${fmt(sc.wh)}</strong></div>
      </div>`;
    });
    html += `</div>`;
    root.querySelector('#un-stage').innerHTML = html;
  }
  render();
}
