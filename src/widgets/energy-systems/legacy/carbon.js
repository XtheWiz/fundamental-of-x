// Carbon widget: pick country + hour. Show avg vs marginal carbon
// intensity, then convert into kg CO2 for an EV charge.

const COUNTRIES = {
  'France':    { avg: 50,  marginal: 380, mix: 'Nuclear baseload + small gas peakers', solar: 'low' },
  'Sweden':    { avg: 30,  marginal: 80,  mix: 'Hydro + nuclear; mostly clean even at margin', solar: 'low' },
  'Germany':   { avg: 380, marginal: 700, mix: 'Renewable-heavy, but lignite or hard coal at the margin', solar: 'high' },
  'UK':        { avg: 200, marginal: 450, mix: 'Wind + gas; gas usually marginal', solar: 'medium' },
  'California':{ avg: 240, marginal: 420, mix: 'Solar + gas; gas at the margin most evenings', solar: 'high' },
  'Texas':     { avg: 410, marginal: 480, mix: 'Wind, gas, coal — almost always gas marginal', solar: 'medium' },
  'Poland':    { avg: 720, marginal: 950, mix: 'Mostly coal — every kWh you add is coal', solar: 'low' },
  'Thailand':  { avg: 500, marginal: 580, mix: 'Gas-dominated; coal at peak', solar: 'high' },
  'India':     { avg: 700, marginal: 950, mix: 'Coal baseload + coal margin', solar: 'high' },
};

const HOURS = [
  { name: '2am (deep night)',   solarFactor: 0,    margBoost: 0.9 },
  { name: '7am (morning ramp)', solarFactor: 0.1,  margBoost: 1.0 },
  { name: 'noon (solar peak)',  solarFactor: 1.0,  margBoost: 0.6 },
  { name: '5pm (evening ramp)', solarFactor: 0.3,  margBoost: 1.1 },
  { name: '8pm (peak demand)',  solarFactor: 0,    margBoost: 1.2 },
];

export function initCarbonWidget(root) {
  let country = 'California';
  let hourIdx = 4; // 8pm
  let kwh = 60; // EV charge

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Average vs marginal carbon</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
          <label>Country:</label>
          <div class="pill-group">
            ${Object.keys(COUNTRIES).map((c, i) => `
              <input type="radio" name="cb-c" id="cb-c${i}" value="${c}" ${c === country ? 'checked' : ''}>
              <label for="cb-c${i}">${c}</label>
            `).join('')}
          </div>
        </div>
        <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
          <label>Hour:</label>
          <div class="pill-group">
            ${HOURS.map((h, i) => `
              <input type="radio" name="cb-h" id="cb-h${i}" value="${i}" ${i === hourIdx ? 'checked' : ''}>
              <label for="cb-h${i}">${h.name}</label>
            `).join('')}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 180px 1fr 80px; gap: 0.6rem; align-items: center;">
          <label>EV charge (kWh):</label>
          <input type="range" id="cb-k" min="10" max="100" value="${kwh}" step="5">
          <div id="cb-k-v" style="font-family: var(--font-mono); text-align: right;">${kwh}</div>
        </div>
      </div>

      <div class="widget-stage" id="cb-stage"></div>
      <div class="callout" id="cb-explain"></div>
    </div>
  `;

  root.querySelectorAll('input[name=cb-c]').forEach((r) => r.addEventListener('change', (e) => { country = e.target.value; render(); }));
  root.querySelectorAll('input[name=cb-h]').forEach((r) => r.addEventListener('change', (e) => { hourIdx = +e.target.value; render(); }));
  root.querySelector('#cb-k').addEventListener('input', (e) => { kwh = +e.target.value; root.querySelector('#cb-k-v').textContent = kwh; render(); });

  function render() {
    const c = COUNTRIES[country];
    const h = HOURS[hourIdx];
    const solarBoost = c.solar === 'high' ? 1.0 : c.solar === 'medium' ? 0.6 : 0.2;
    // Solar lowers avg during midday; marginal still gas at most hours.
    const hourAvg = Math.max(20, c.avg * (1 - h.solarFactor * solarBoost * 0.45));
    const hourMarginal = c.marginal * h.margBoost;
    const evAvgKg = (kwh * hourAvg) / 1000;
    const evMargKg = (kwh * hourMarginal) / 1000;
    const ICE_PER_L = 2.31; // kg/L gasoline
    const ICE_KWH_PER_L = 10; // gasoline equivalent
    const iceKg = (kwh * 0.25 * 0.25) * 0; // placeholder
    // Compare: similar distance — assume EV is 6× more efficient end-to-end
    const distKm = kwh / 0.18; // 180 Wh/km
    const iceKgForSameDist = (distKm / 12) * ICE_PER_L; // 12 km/L

    const W = 540, H = 180, PAD = 50;
    function y(g) { return H - PAD - (g / 1000) * (H - 2*PAD); }
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<line x1="${PAD}" y1="${H-PAD}" x2="${W-PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;
    [0, 250, 500, 750, 1000].forEach((g) => svg += `<text x="${PAD-8}" y="${y(g)+3}" text-anchor="end" style="font-family: var(--font-mono); font-size: 10px;">${g}</text>`);
    // bars
    const bars = [
      { label: 'Average', v: hourAvg, color: '#4caf50' },
      { label: 'Marginal', v: hourMarginal, color: '#d62828' },
    ];
    bars.forEach((b, i) => {
      const xL = PAD + 60 + i * 160;
      const bw = 110;
      svg += `<rect x="${xL}" y="${y(b.v)}" width="${bw}" height="${H-PAD-y(b.v)}" fill="${b.color}" stroke="var(--ink)" stroke-width="2"/>`;
      svg += `<text x="${xL + bw/2}" y="${y(b.v)-5}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px; font-weight: 600;">${b.v.toFixed(0)}</text>`;
      svg += `<text x="${xL + bw/2}" y="${H-PAD+18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">${b.label}</text>`;
    });
    svg += `<text x="14" y="${H/2}" text-anchor="middle" style="font-family: var(--font-display); font-size: 12px;" transform="rotate(-90 14 ${H/2})">gCO₂/kWh</text>`;
    svg += `</svg>`;

    let html = `<div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; margin-bottom: 0.5rem; font-family: var(--font-mono); font-size: 0.82rem;">
      <div><strong>${country}</strong> at <strong>${h.name}</strong></div>
      <div style="color: var(--ink-soft); margin-top: 0.2rem;">${c.mix}</div>
    </div>${svg}
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem;">
      <div style="border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; background: var(--paper);">
        <div style="font-family: var(--font-display); font-size: 1rem;">EV (avg accounting)</div>
        <div style="font-family: var(--font-mono); font-size: 1.3rem; color: var(--accent);">${evAvgKg.toFixed(1)} kg CO₂</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft);">${kwh} kWh × ${hourAvg.toFixed(0)} g/kWh</div>
      </div>
      <div style="border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; background: var(--paper);">
        <div style="font-family: var(--font-display); font-size: 1rem;">EV (marginal — honest)</div>
        <div style="font-family: var(--font-mono); font-size: 1.3rem; color: var(--accent);">${evMargKg.toFixed(1)} kg CO₂</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft);">${kwh} kWh × ${hourMarginal.toFixed(0)} g/kWh</div>
      </div>
    </div>
    <div style="margin-top: 0.5rem; border: 2px dashed var(--ink-soft); border-radius: var(--radius); padding: 0.5rem 0.8rem; font-family: var(--font-mono); font-size: 0.82rem;">
      For the same distance (~${distKm.toFixed(0)} km) a gasoline car emits ~<strong>${iceKgForSameDist.toFixed(1)} kg CO₂</strong>. EV wins unless your grid is almost pure coal at the margin.
    </div>`;
    root.querySelector('#cb-stage').innerHTML = html;

    let exp;
    if (h.solarFactor > 0.7 && c.solar !== 'low') exp = `<strong>Charge at noon.</strong> Solar drags average intensity down. But the marginal source is still gas (or coal) — your additional kWh comes from whichever plant ramped to serve you, not from the existing solar farm.`;
    else if (c.avg < 100) exp = `<strong>Clean grid, easy win.</strong> Even at the margin you are below most other countries' average. Electrify everything you can.`;
    else if (c.marginal > 700) exp = `<strong>Coal-marginal grid.</strong> Average looks moderate, marginal is brutal. Your extra demand pulls coal up. Time-shifting helps a little, switching to a heat pump helps a lot, rooftop solar helps most.`;
    else exp = `<strong>Mid-carbon grid.</strong> Average vs marginal differ by ~2×. For decision-making (should I charge now or in 4 hours?), look at marginal. For reporting (what did I emit last year?), use average.`;
    root.querySelector('#cb-explain').innerHTML = exp;
  }
  render();
}
