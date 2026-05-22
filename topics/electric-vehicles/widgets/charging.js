// Charging widget: animated CC-CV charge curve from 5% to 100%, showing
// why the last 20% takes so long.

export function initChargingWidget(root) {
  let maxKW = 250;
  let packKWh = 75;
  let playing = false;
  let soc = 5;
  let timer = null;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Why fast charging slows past 80%</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: grid; grid-template-columns: 160px 1fr 90px; gap: 0.6rem; align-items: center;">
          <label>Charger peak (kW):</label>
          <input type="range" id="ch-k" min="50" max="350" value="${maxKW}" step="25">
          <div id="ch-k-v" style="font-family: var(--font-mono); text-align: right;">${maxKW}</div>
        </div>
        <div style="display: grid; grid-template-columns: 160px 1fr 90px; gap: 0.6rem; align-items: center;">
          <label>Pack size (kWh):</label>
          <input type="range" id="ch-p" min="40" max="120" value="${packKWh}" step="5">
          <div id="ch-p-v" style="font-family: var(--font-mono); text-align: right;">${packKWh}</div>
        </div>
        <div style="display: flex; gap: 0.6rem;">
          <button id="ch-play" class="btn">▶ Charge from 5% to 100%</button>
          <button id="ch-reset" class="btn">Reset</button>
        </div>
      </div>

      <div class="widget-stage" id="ch-stage"></div>
      <div class="callout" id="ch-explain"></div>
    </div>
  `;

  root.querySelector('#ch-k').addEventListener('input', (e) => { maxKW = +e.target.value; root.querySelector('#ch-k-v').textContent = maxKW; render(); });
  root.querySelector('#ch-p').addEventListener('input', (e) => { packKWh = +e.target.value; root.querySelector('#ch-p-v').textContent = packKWh; render(); });
  root.querySelector('#ch-play').addEventListener('click', () => {
    if (playing) return;
    playing = true; soc = 5;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      soc += 1;
      if (soc >= 100) { soc = 100; playing = false; clearInterval(timer); }
      render();
    }, 80);
  });
  root.querySelector('#ch-reset').addEventListener('click', () => { playing = false; soc = 5; if (timer) clearInterval(timer); render(); });

  function powerAt(s) {
    // CC up to ~50%, taper toward CV. Tesla-ish curve.
    if (s < 20) return maxKW * 0.9;
    if (s < 50) return maxKW;
    if (s < 80) return maxKW * (1 - (s - 50) / 60);
    return maxKW * 0.25 * (1 - (s - 80) / 25);
  }

  function timeToReach(target) {
    // integrate dt = dE / P; E = packKWh * dSoC/100
    let t = 0;
    for (let s = 5; s < target; s += 0.5) {
      const p = Math.max(1, powerAt(s));
      t += (packKWh * 0.005) / p * 3600;
    }
    return t; // seconds
  }

  function render() {
    const W = 600, H = 260, PAD = 50;
    function x(s) { return PAD + (s / 100) * (W - 2*PAD); }
    function y(p) { return H - PAD - (p / 350) * (H - 2*PAD); }

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<line x1="${PAD}" y1="${H-PAD}" x2="${W-PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;
    [0, 25, 50, 75, 100].forEach((s) => {
      svg += `<text x="${x(s)}" y="${H-PAD+18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${s}%</text>`;
    });
    [0, 100, 200, 300].forEach((p) => {
      svg += `<line x1="${PAD-5}" y1="${y(p)}" x2="${PAD}" y2="${y(p)}" stroke="var(--ink)"/>`;
      svg += `<text x="${PAD-8}" y="${y(p)+3}" text-anchor="end" style="font-family: var(--font-mono); font-size: 10px;">${p}</text>`;
    });
    svg += `<text x="${W/2}" y="${H-12}" text-anchor="middle" style="font-family: var(--font-display); font-size: 13px;">State of charge</text>`;
    svg += `<text x="14" y="${H/2}" text-anchor="middle" style="font-family: var(--font-display); font-size: 13px;" transform="rotate(-90 14 ${H/2})">Power (kW)</text>`;

    let pts = [];
    for (let s = 0; s <= 100; s += 1) pts.push(`${x(s)},${y(powerAt(s))}`);
    svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--accent)" stroke-width="3"/>`;

    // current marker
    const cx = x(soc), cy = y(powerAt(soc));
    svg += `<circle cx="${cx}" cy="${cy}" r="7" fill="var(--accent)" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="1" stroke-dasharray="3 3"/>`;
    svg += `<text x="${cx}" y="${cy - 12}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px; font-weight: 600;">${powerAt(soc).toFixed(0)} kW</text>`;
    svg += `</svg>`;

    const t10to80 = (timeToReach(80) - timeToReach(10)) / 60;
    const t80to100 = (timeToReach(100) - timeToReach(80)) / 60;

    let html = svg + `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-top: 0.6rem; font-family: var(--font-mono); font-size: 0.8rem;">
        <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.4rem 0.6rem; border-radius: 3px;">SoC: <strong>${soc}%</strong></div>
        <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.4rem 0.6rem; border-radius: 3px;">10→80%: <strong>${t10to80.toFixed(1)} min</strong></div>
        <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.4rem 0.6rem; border-radius: 3px;">80→100%: <strong>${t80to100.toFixed(1)} min</strong></div>
      </div>`;
    root.querySelector('#ch-stage').innerHTML = html;

    let exp;
    if (soc < 50) exp = `<strong>CC phase (constant current).</strong> The charger pushes maximum amps. Voltage rises gently. This is where you grab the most kWh per minute.`;
    else if (soc < 80) exp = `<strong>Tapering.</strong> Cell voltage is approaching its limit. To keep going without damaging the anode (lithium plating), the BMS cuts current.`;
    else exp = `<strong>CV phase (constant voltage).</strong> Voltage is held at the limit; current trickles. The last 20% can take as long as the first 60%. Most road-trip plans target 10–80% and skip the rest.`;
    root.querySelector('#ch-explain').innerHTML = exp;
  }
  render();
}
