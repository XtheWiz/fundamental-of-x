// Storage widget: configure a battery's size and round-trip efficiency,
// pick a wholesale price profile, and see the daily arbitrage revenue.

const PRICE_DAYS = {
  'CA summer (deep duck)': [25, 22, 20, 19, 22, 28, 45, 60, 55, 35, 18, 8, -2, -5, 5, 22, 55, 95, 140, 165, 130, 80, 50, 35],
  'TX hot day':            [35, 32, 30, 30, 35, 50, 70, 80, 70, 55, 45, 50, 65, 85, 110, 140, 175, 200, 180, 140, 100, 70, 55, 45],
  'EU calm winter':        [80, 75, 70, 70, 75, 90, 130, 180, 200, 170, 130, 110, 100, 110, 120, 140, 180, 210, 190, 150, 120, 100, 90, 85],
  'UK windy day':          [10, 8, 6, 5, 8, 15, 35, 50, 40, 25, 18, 15, 20, 25, 30, 45, 70, 95, 80, 55, 35, 22, 15, 12],
};

export function initStorageWidget(root) {
  let sizeMWh = 200; // 50 MW * 4 hr
  let powerMW = 50;
  let rte = 0.88;
  let profile = 'CA summer (deep duck)';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Daily storage arbitrage</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: grid; grid-template-columns: 180px 1fr 80px; gap: 0.6rem; align-items: center;">
          <label>Power rating (MW):</label>
          <input type="range" id="st-p" min="10" max="500" value="${powerMW}" step="10">
          <div id="st-p-v" style="font-family: var(--font-mono); text-align: right;">${powerMW}</div>
        </div>
        <div style="display: grid; grid-template-columns: 180px 1fr 80px; gap: 0.6rem; align-items: center;">
          <label>Energy (MWh):</label>
          <input type="range" id="st-e" min="40" max="2000" value="${sizeMWh}" step="20">
          <div id="st-e-v" style="font-family: var(--font-mono); text-align: right;">${sizeMWh}</div>
        </div>
        <div style="display: grid; grid-template-columns: 180px 1fr 80px; gap: 0.6rem; align-items: center;">
          <label>Round-trip eff:</label>
          <input type="range" id="st-r" min="40" max="95" value="${rte*100}" step="1">
          <div id="st-r-v" style="font-family: var(--font-mono); text-align: right;">${(rte*100).toFixed(0)}%</div>
        </div>
        <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
          <label>Price profile:</label>
          <div class="pill-group">
            ${Object.keys(PRICE_DAYS).map((p, i) => `
              <input type="radio" name="st-pr" id="st-pr${i}" value="${p}" ${p === profile ? 'checked' : ''}>
              <label for="st-pr${i}">${p}</label>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="widget-stage" id="st-stage"></div>
      <div class="callout" id="st-explain"></div>
    </div>
  `;

  root.querySelector('#st-p').addEventListener('input', (e) => { powerMW = +e.target.value; root.querySelector('#st-p-v').textContent = powerMW; render(); });
  root.querySelector('#st-e').addEventListener('input', (e) => { sizeMWh = +e.target.value; root.querySelector('#st-e-v').textContent = sizeMWh; render(); });
  root.querySelector('#st-r').addEventListener('input', (e) => { rte = +e.target.value / 100; root.querySelector('#st-r-v').textContent = (rte*100).toFixed(0) + '%'; render(); });
  root.querySelectorAll('input[name=st-pr]').forEach((r) => r.addEventListener('change', (e) => { profile = e.target.value; render(); }));

  function dispatch(prices) {
    // Greedy: at each hour, sort hours by price. Charge in N cheapest, discharge in N most expensive,
    // bounded by sizeMWh and powerMW per hour.
    const n = prices.length;
    const sortedAsc = prices.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
    const sortedDesc = sortedAsc.slice().reverse();
    const chargeMaxHours = Math.ceil(sizeMWh / powerMW);
    const action = new Array(n).fill(0); // + = discharge (MWh), - = charge (MWh)
    let stored = 0, capacity = sizeMWh;
    // charge first cheapest hours
    let chargeBudget = sizeMWh / rte; // wall-energy in
    for (const { i } of sortedAsc) {
      if (chargeBudget <= 0) break;
      const take = Math.min(powerMW, chargeBudget);
      action[i] = -take;
      chargeBudget -= take;
    }
    let dischargeBudget = sizeMWh;
    for (const { i } of sortedDesc) {
      if (dischargeBudget <= 0) break;
      if (action[i] !== 0) continue;
      const give = Math.min(powerMW, dischargeBudget);
      action[i] = give;
      dischargeBudget -= give;
    }
    return action;
  }

  function render() {
    const prices = PRICE_DAYS[profile];
    const action = dispatch(prices);
    let revenue = 0, cost = 0;
    action.forEach((a, h) => {
      if (a > 0) revenue += a * prices[h];
      else cost += -a * prices[h];
    });
    const net = revenue - cost;
    const annual = net * 320; // ~320 cyclable days
    const capex = sizeMWh * 250000; // $250/kWh = $250k/MWh
    const payback = capex / (annual || 1);

    const W = 600, H = 240, PAD = 50;
    const maxP = Math.max(...prices), minP = Math.min(...prices);
    function x(h) { return PAD + (h / 23) * (W - 2*PAD); }
    function y(p) { return H - PAD - ((p - minP) / Math.max(1, maxP - minP)) * (H - 2*PAD); }

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<line x1="${PAD}" y1="${H-PAD}" x2="${W-PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;
    // action bars
    action.forEach((a, h) => {
      if (a === 0) return;
      const w = (W - 2*PAD) / 24 * 0.9;
      const xx = x(h) - w/2;
      const color = a > 0 ? '#4caf50' : '#d62828';
      svg += `<rect x="${xx}" y="${PAD+10}" width="${w}" height="${H-2*PAD-10}" fill="${color}" fill-opacity="0.18"/>`;
    });
    // price curve
    let pts = prices.map((p, h) => `${x(h)},${y(p)}`).join(' ');
    svg += `<polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="3"/>`;
    [0, 6, 12, 18, 23].forEach((h) => svg += `<text x="${x(h)}" y="${H-PAD+18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${h}:00</text>`);
    svg += `<text x="${W/2}" y="${H-10}" text-anchor="middle" style="font-family: var(--font-display); font-size: 12px;">Hour · price ($/MWh)</text>`;
    svg += `</svg>`;

    let html = svg + `<div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.4rem; margin-top: 0.5rem; font-family: var(--font-mono); font-size: 0.78rem;">
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Spread: <strong>$${(maxP-minP).toFixed(0)}</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Day net: <strong>$${net.toFixed(0)}</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Annual: <strong>$${(annual/1e6).toFixed(2)}M</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Payback: <strong>${payback.toFixed(1)} yr</strong></div>
    </div>
    <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-soft); margin-top: 0.3rem;">red bars = charging, green bars = discharging. Capex assumed $250/kWh.</div>`;
    root.querySelector('#st-stage').innerHTML = html;

    let exp;
    if (payback < 4) exp = `<strong>Strong economics.</strong> The price spread is wide enough to pay back the battery in well under its cycle life. This is why grid-scale storage has exploded in CA and TX.`;
    else if (payback < 8) exp = `<strong>Solid project.</strong> Comfortable margins for a 10-12 year lithium pack. Most utility-scale lithium projects pencil here.`;
    else if (payback < 15) exp = `<strong>Marginal.</strong> Spread is too narrow or RTE too low. Needs a capacity-market payment or ancillary services on top.`;
    else exp = `<strong>Does not pencil.</strong> Either the price profile is too flat or efficiency too low. Hydrogen storage often lands here on day-arbitrage alone — needs seasonal value.`;
    root.querySelector('#st-explain').innerHTML = exp;
  }
  render();
}
