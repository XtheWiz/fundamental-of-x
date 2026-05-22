// Demand response widget: heat-wave hour, dispatch DR vs build peaker.
// Show $/MW-hr cost difference and total system spend.

const DR_BLOCKS = [
  { name: 'Smart thermostats (1M homes)', mw: 800,  cost: 30,  ramp: '5 min', desc: 'Cycle ACs off in 15-min windows. Slight comfort impact.' },
  { name: 'EV charging defer',             mw: 600,  cost: 25,  ramp: '1 min', desc: 'Shift home and workplace charging 1-3 hours later.' },
  { name: 'Aluminum smelter',              mw: 350,  cost: 80,  ramp: '10 min', desc: 'One phone call. Smelter loses some output value during the curtailment.' },
  { name: 'Data center DC throttle',       mw: 200,  cost: 60,  ramp: '2 min', desc: 'Move compute to other regions. Customers see degraded perf.' },
  { name: 'Cement kiln',                   mw: 150,  cost: 95,  ramp: '20 min', desc: 'Pause grinding step. Output rebalanced overnight.' },
  { name: 'Water utility pumps',           mw: 100,  cost: 40,  ramp: '5 min', desc: 'Pump overnight instead. Storage in tanks absorbs the shift.' },
];

const PEAKER = { name: 'New gas peaker', capex: 800, omPerYear: 25, mwhPerYear: 200, lcoe: 180 };
//  capex $800/kW, runs ~200 hr/year → LCOE on the spike portion is high

export function initDemandResponseWidget(root) {
  let needMW = 1500;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Cover a peak-hour shortfall</div>

      <div class="controls" style="display: grid; grid-template-columns: 200px 1fr 90px; gap: 0.6rem; align-items: center;">
        <label>Capacity needed (MW):</label>
        <input type="range" id="dr-n" min="100" max="2200" value="${needMW}" step="50">
        <div id="dr-n-v" style="font-family: var(--font-mono); text-align: right;">${needMW}</div>
      </div>

      <div class="widget-stage" id="dr-stage"></div>
      <div class="callout" id="dr-explain"></div>
    </div>
  `;

  root.querySelector('#dr-n').addEventListener('input', (e) => { needMW = +e.target.value; root.querySelector('#dr-n-v').textContent = needMW; render(); });

  function render() {
    const sorted = DR_BLOCKS.slice().sort((a, b) => a.cost - b.cost);
    let remaining = needMW, totalCost = 0;
    const dispatched = [];
    for (const b of sorted) {
      if (remaining <= 0) break;
      const take = Math.min(b.mw, remaining);
      dispatched.push({ ...b, taken: take });
      totalCost += take * b.cost;
      remaining -= take;
    }
    const drCovered = needMW - remaining;
    const peakerNeeded = remaining; // MW
    const peakerCostHr = peakerNeeded * PEAKER.lcoe;
    const peakerAltAllHr = needMW * PEAKER.lcoe;
    const peakerCapexAvoided = peakerNeeded * 0; // for this hour we still need peaker for remainder

    let html = `<div style="margin-bottom: 0.4rem; font-family: var(--font-mono); font-size: 0.8rem;"><strong>DR merit order:</strong> stack cheapest first.</div>
      <div style="display: grid; gap: 0.3rem;">`;
    sorted.forEach((b) => {
      const taken = dispatched.find((d) => d.name === b.name)?.taken || 0;
      const utilization = (taken / b.mw) * 100;
      const used = utilization > 0;
      html += `<div style="display: grid; grid-template-columns: 240px 100px 1fr 100px; gap: 0.5rem; align-items: center; padding: 0.35rem 0.6rem; border: 1.5px solid var(--ink); border-radius: 3px; background: ${used ? 'rgba(76, 175, 80, 0.12)' : 'var(--paper)'};">
        <div>
          <div style="font-family: var(--font-mono); font-size: 0.82rem;">${b.name}</div>
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft);">ramp ${b.ramp} · ${b.desc}</div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem; text-align: right;">$${b.cost}/MWh</div>
        <div style="position: relative; height: 16px; background: var(--paper-deep); border: 1px solid var(--ink); border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; width: ${utilization}%; background: #4caf50;"></div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem; text-align: right;">${taken.toFixed(0)} / ${b.mw} MW</div>
      </div>`;
    });
    html += `</div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.8rem;">
      <div style="background: rgba(76, 175, 80, 0.12); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem;">
        <div style="font-family: var(--font-display); font-size: 1.1rem; color: #2e7d32;">DR-first approach</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem;">DR covers ${drCovered.toFixed(0)} MW</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem;">Peaker tops up ${peakerNeeded.toFixed(0)} MW</div>
        <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-top: 0.3rem;">Total hourly cost: <strong>$${(totalCost + peakerCostHr).toLocaleString()}</strong></div>
      </div>
      <div style="background: rgba(214, 40, 40, 0.08); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem;">
        <div style="font-family: var(--font-display); font-size: 1.1rem; color: #d62828;">Peaker-only approach</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem;">Peaker covers all ${needMW} MW</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem;">@ $${PEAKER.lcoe}/MWh</div>
        <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-top: 0.3rem;">Total hourly cost: <strong>$${peakerAltAllHr.toLocaleString()}</strong></div>
      </div>
    </div>`;
    root.querySelector('#dr-stage').innerHTML = html;

    const savings = peakerAltAllHr - (totalCost + peakerCostHr);
    let exp;
    if (savings > 0.4 * peakerAltAllHr) exp = `<strong>DR is the obvious win.</strong> Most of the shortfall can be flexed away at $25-60/MWh — far below a peaker's $180. This is why ISOs prefer DR to building new gas: same MW available, fraction of the cost.`;
    else if (savings > 0) exp = `<strong>Mixed approach.</strong> Cheap DR is exhausted; a peaker is needed for the residual. Combined cost still beats peaker-only by $${savings.toLocaleString()}.`;
    else exp = `<strong>DR alone is not enough.</strong> The need exceeds available flexible load — a peaker is doing most of the work. Long-term answer: more storage and demand-side enrollment.`;
    root.querySelector('#dr-explain').innerHTML = exp;
  }
  render();
}
