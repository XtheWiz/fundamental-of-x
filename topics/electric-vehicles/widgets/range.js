// Range widget: estimate effective range given speed, temperature, HVAC,
// and payload. Show the drag curve and the wH/km breakdown.

export function initRangeWidget(root) {
  let speed = 110;       // km/h
  let temp = 20;         // °C
  let hvac = 'off';      // off, heat, ac
  let payload = 1;       // passengers (1–5)
  const PACK_KWH = 75;
  const USABLE = 0.92;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Real-world range estimator</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: grid; grid-template-columns: 130px 1fr 70px; gap: 0.6rem; align-items: center;">
          <label>Speed (km/h):</label>
          <input type="range" id="rn-s" min="40" max="160" value="${speed}" step="5">
          <div id="rn-s-v" style="font-family: var(--font-mono); text-align: right;">${speed}</div>
        </div>
        <div style="display: grid; grid-template-columns: 130px 1fr 70px; gap: 0.6rem; align-items: center;">
          <label>Outside temp (°C):</label>
          <input type="range" id="rn-t" min="-20" max="40" value="${temp}" step="1">
          <div id="rn-t-v" style="font-family: var(--font-mono); text-align: right;">${temp}°</div>
        </div>
        <div style="display: grid; grid-template-columns: 130px 1fr 70px; gap: 0.6rem; align-items: center;">
          <label>Passengers:</label>
          <input type="range" id="rn-p" min="1" max="5" value="${payload}" step="1">
          <div id="rn-p-v" style="font-family: var(--font-mono); text-align: right;">${payload}</div>
        </div>
        <div style="display: flex; gap: 0.6rem; align-items: center;">
          <label>HVAC:</label>
          <div class="pill-group">
            <input type="radio" name="rn-h" id="rn-h0" value="off" checked>
            <label for="rn-h0">off</label>
            <input type="radio" name="rn-h" id="rn-h1" value="heat">
            <label for="rn-h1">heat</label>
            <input type="radio" name="rn-h" id="rn-h2" value="ac">
            <label for="rn-h2">A/C</label>
          </div>
        </div>
      </div>

      <div class="widget-stage" id="rn-stage"></div>
      <div class="callout" id="rn-explain"></div>
    </div>
  `;

  root.querySelector('#rn-s').addEventListener('input', (e) => { speed = +e.target.value; root.querySelector('#rn-s-v').textContent = speed; render(); });
  root.querySelector('#rn-t').addEventListener('input', (e) => { temp = +e.target.value; root.querySelector('#rn-t-v').textContent = temp + '°'; render(); });
  root.querySelector('#rn-p').addEventListener('input', (e) => { payload = +e.target.value; root.querySelector('#rn-p-v').textContent = payload; render(); });
  root.querySelectorAll('input[name=rn-h]').forEach((r) => r.addEventListener('change', (e) => { hvac = e.target.value; render(); }));

  function consumption() {
    const v = speed / 3.6;
    // drag: 0.5 * Cd * A * rho * v^3 / v = aero W per m/s; convert to Wh/km
    const Cd = 0.23, A = 2.3, rho = 1.2;
    const aero_W = 0.5 * Cd * A * rho * v * v * v;
    const aero_Whkm = aero_W / v / 3.6;
    // rolling: Crr * m * g
    const m = 1900 + payload * 75;
    const roll_W = 0.01 * m * 9.81 * v;
    const roll_Whkm = roll_W / v / 3.6;
    // HVAC overhead
    let hvac_Whkm = 0;
    if (hvac === 'heat') hvac_Whkm = Math.max(80, (20 - temp) * 15);
    else if (hvac === 'ac') hvac_Whkm = Math.max(60, (temp - 20) * 10);
    // Battery thermal penalty in extreme cold
    const coldPenalty = temp < 0 ? (0 - temp) * 4 : 0;
    return { aero: aero_Whkm, roll: roll_Whkm, hvac: hvac_Whkm, cold: coldPenalty };
  }

  function render() {
    const c = consumption();
    const total = c.aero + c.roll + c.hvac + c.cold;
    const usableKWh = PACK_KWH * USABLE * (temp < 0 ? 0.9 : 1);
    const rangeKm = (usableKWh * 1000) / total;
    const epaRange = 480;

    let html = `<div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; margin-bottom: 0.6rem;">
      <div style="font-family: var(--font-display); font-size: 1.6rem; color: var(--accent);">${Math.round(rangeKm)} km</div>
      <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-soft);">vs EPA ${epaRange} km (${Math.round(rangeKm / epaRange * 100)}%) · ${total.toFixed(0)} Wh/km</div>
    </div>`;

    const segs = [
      { k: 'Aero drag',     v: c.aero, color: '#d62828' },
      { k: 'Rolling',       v: c.roll, color: '#f5a623' },
      { k: 'HVAC',          v: c.hvac, color: '#2b6cb0' },
      { k: 'Cold penalty',  v: c.cold, color: '#4a4a4a' },
    ];

    html += `<div style="display: flex; height: 38px; border: 2px solid var(--ink); border-radius: var(--radius); overflow: hidden; margin-bottom: 0.4rem;">
      ${segs.filter((s) => s.v > 0).map((s) => {
        const pct = (s.v / total) * 100;
        return `<div style="width: ${pct}%; background: ${s.color}; display: flex; align-items: center; justify-content: center; color: white; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600;">${pct > 12 ? Math.round(pct) + '%' : ''}</div>`;
      }).join('')}
    </div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.3rem; font-family: var(--font-mono); font-size: 0.78rem;">
      ${segs.map((s) => `<div><span style="display: inline-block; width: 10px; height: 10px; background: ${s.color}; border: 1px solid var(--ink); vertical-align: middle;"></span> ${s.k}: <strong>${s.v.toFixed(0)} Wh/km</strong></div>`).join('')}
    </div>`;

    root.querySelector('#rn-stage').innerHTML = html;

    let exp;
    if (speed > 130) exp = `<strong>Drag dominates at highway speed.</strong> Aero loss grows with v³, so going from 100 to 130 km/h costs you nearly 30% range, with no extra time saved on most trips.`;
    else if (temp < 0) exp = `<strong>Cold is brutal for EVs.</strong> The pack itself holds less usable energy below 0°C, and the cabin heater pulls 2–5 kW from the same battery. Pre-conditioning while plugged in helps.`;
    else if (hvac !== 'off' && Math.abs(temp - 20) > 10) exp = `<strong>HVAC overhead is real.</strong> A heat pump (most modern EVs) trims the penalty roughly in half versus a resistive heater.`;
    else exp = `<strong>Best conditions:</strong> mild temp, moderate speed, HVAC off. Stay between 90–110 km/h to hit close to EPA range.`;
    root.querySelector('#rn-explain').innerHTML = exp;
  }
  render();
}
