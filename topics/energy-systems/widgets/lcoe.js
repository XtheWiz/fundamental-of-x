// LCOE widget: build a merit-order stack, slide demand, see where the
// price clears and how much each source earns.

const SOURCES = [
  { name: 'Solar',    marginal: 0,   capMW: 8000, lcoe: 35, color: '#f5a623' },
  { name: 'Wind',     marginal: 0,   capMW: 6000, lcoe: 40, color: '#2b6cb0' },
  { name: 'Nuclear',  marginal: 8,   capMW: 4000, lcoe: 95, color: '#9c27b0' },
  { name: 'Hydro',    marginal: 5,   capMW: 3000, lcoe: 55, color: '#4ec9ff' },
  { name: 'CCGT gas', marginal: 45,  capMW: 8000, lcoe: 70, color: '#888' },
  { name: 'Coal',     marginal: 35,  capMW: 5000, lcoe: 80, color: '#4a4a4a' },
  { name: 'Peaker',   marginal: 110, capMW: 3000, lcoe: 180, color: '#d62828' },
];

export function initLcoeWidget(root) {
  let demand = 22000;
  let solarOut = 1.0; // fraction of solar nameplate
  let windOut = 0.8;  // fraction of wind nameplate

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Merit-order dispatch</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: grid; grid-template-columns: 180px 1fr 90px; gap: 0.6rem; align-items: center;">
          <label>Demand (MW):</label>
          <input type="range" id="lc-d" min="6000" max="32000" value="${demand}" step="500">
          <div id="lc-d-v" style="font-family: var(--font-mono); text-align: right;">${demand}</div>
        </div>
        <div style="display: grid; grid-template-columns: 180px 1fr 90px; gap: 0.6rem; align-items: center;">
          <label>Solar output:</label>
          <input type="range" id="lc-s" min="0" max="100" value="${solarOut*100}" step="5">
          <div id="lc-s-v" style="font-family: var(--font-mono); text-align: right;">${(solarOut*100).toFixed(0)}%</div>
        </div>
        <div style="display: grid; grid-template-columns: 180px 1fr 90px; gap: 0.6rem; align-items: center;">
          <label>Wind output:</label>
          <input type="range" id="lc-w" min="0" max="100" value="${windOut*100}" step="5">
          <div id="lc-w-v" style="font-family: var(--font-mono); text-align: right;">${(windOut*100).toFixed(0)}%</div>
        </div>
      </div>

      <div class="widget-stage" id="lc-stage"></div>
      <div class="callout" id="lc-explain"></div>
    </div>
  `;

  root.querySelector('#lc-d').addEventListener('input', (e) => { demand = +e.target.value; root.querySelector('#lc-d-v').textContent = demand; render(); });
  root.querySelector('#lc-s').addEventListener('input', (e) => { solarOut = +e.target.value / 100; root.querySelector('#lc-s-v').textContent = (solarOut*100).toFixed(0) + '%'; render(); });
  root.querySelector('#lc-w').addEventListener('input', (e) => { windOut = +e.target.value / 100; root.querySelector('#lc-w-v').textContent = (windOut*100).toFixed(0) + '%'; render(); });

  function render() {
    const stack = SOURCES.map((s) => ({ ...s, available: s.capMW * (s.name === 'Solar' ? solarOut : s.name === 'Wind' ? windOut : 1) }));
    stack.sort((a, b) => a.marginal - b.marginal);

    let served = 0, clearing = 0, marginal = '';
    const usage = [];
    for (const s of stack) {
      const take = Math.max(0, Math.min(s.available, demand - served));
      usage.push({ ...s, used: take });
      if (take > 0) { clearing = s.marginal; marginal = s.name; }
      served += take;
      if (served >= demand) break;
    }
    const unserved = Math.max(0, demand - served);
    const totalCap = stack.reduce((a, b) => a + b.available, 0);

    const W = 600, H = 240, PAD = 50;
    function x(mw) { return PAD + (mw / 32000) * (W - 2*PAD); }
    function y(p) { return H - PAD - (p / 200) * (H - 2*PAD); }

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<line x1="${PAD}" y1="${H-PAD}" x2="${W-PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;
    let cum = 0;
    for (const s of usage) {
      if (s.available === 0) continue;
      const xL = x(cum), xR = x(cum + s.available);
      svg += `<rect x="${xL}" y="${y(s.marginal)}" width="${xR-xL}" height="${H-PAD-y(s.marginal)}" fill="${s.color}" stroke="var(--ink)" stroke-width="1.2" fill-opacity="0.7"/>`;
      if (xR - xL > 50) svg += `<text x="${(xL+xR)/2}" y="${H-PAD-5}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px; fill: white; font-weight: 600;">${s.name}</text>`;
      cum += s.available;
    }
    // demand line
    svg += `<line x1="${x(demand)}" y1="${PAD}" x2="${x(demand)}" y2="${H-PAD}" stroke="var(--accent)" stroke-width="3" stroke-dasharray="6 3"/>`;
    svg += `<text x="${x(demand)}" y="${PAD-5}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px; font-weight: 600; fill: var(--accent);">demand ${demand} MW</text>`;
    // clearing price
    svg += `<line x1="${PAD}" y1="${y(clearing)}" x2="${x(demand)}" y2="${y(clearing)}" stroke="var(--ink)" stroke-width="2" stroke-dasharray="3 3"/>`;
    svg += `<text x="${PAD-8}" y="${y(clearing)+4}" text-anchor="end" style="font-family: var(--font-mono); font-size: 11px; font-weight: 600;">$${clearing}</text>`;
    [0, 50, 100, 150, 200].forEach((p) => svg += `<text x="${PAD-8}" y="${y(p)+3}" text-anchor="end" style="font-family: var(--font-mono); font-size: 9px;">${p}</text>`);
    [0, 10000, 20000, 30000].forEach((m) => svg += `<text x="${x(m)}" y="${H-PAD+18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${m/1000}GW</text>`);
    svg += `</svg>`;

    let html = svg + `<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.4rem; margin-top: 0.5rem; font-family: var(--font-mono); font-size: 0.78rem;">
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Clearing: <strong>$${clearing}/MWh</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Marginal: <strong>${marginal}</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Unserved: <strong>${unserved} MW</strong></div>
    </div>`;
    root.querySelector('#lc-stage').innerHTML = html;

    let exp;
    if (unserved > 0) exp = `<strong>Blackout territory.</strong> Demand exceeds available supply. In a real market, operators shed load (managed brownouts). Price hits the cap, often >$5000/MWh.`;
    else if (marginal === 'Solar' || marginal === 'Wind') exp = `<strong>Zero clearing price.</strong> Renewables can serve the entire load. Wholesale prices crash. Great for buyers, terrible for thermal plants — and the source of the duck curve.`;
    else if (marginal === 'Peaker') exp = `<strong>Peakers in the money.</strong> The most expensive plants are dispatching. Likely a heat wave or wind drought. Every other plant earns the peaker's price — that is how merit-order markets reward inframarginal capacity.`;
    else exp = `<strong>Gas or coal sets the price.</strong> Most hours in most grids look like this. The marginal source determines the wholesale price for everyone — solar, wind, nuclear all paid the same clearing price.`;
    root.querySelector('#lc-explain').innerHTML = exp;
  }
  render();
}
