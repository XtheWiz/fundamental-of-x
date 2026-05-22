// Duck curve widget: slide solar penetration and watch the duck appear
// in the residual (net) load shape over a 24-hour day.

export function initDuckCurveWidget(root) {
  let solarPct = 0;

  // Base demand: morning ramp 6-9, plateau, evening peak 18-21
  function demand(h) {
    // simple smooth shape, 0..1
    const base = 0.55;
    const morning = 0.18 * Math.exp(-Math.pow((h - 8.5) / 2, 2));
    const evening = 0.35 * Math.exp(-Math.pow((h - 19) / 2.2, 2));
    const night = 0.0;
    return Math.max(0.3, base + morning + evening + night);
  }
  // Solar output: bell at noon
  function solar(h) {
    if (h < 6 || h > 18) return 0;
    return Math.max(0, Math.cos((h - 12) * Math.PI / 12) * 1.0);
  }

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Net load = demand − solar output</div>

      <div class="controls" style="display: grid; grid-template-columns: 200px 1fr 70px; gap: 0.6rem; align-items: center;">
        <label>Solar penetration:</label>
        <input type="range" id="dk-s" min="0" max="80" value="0" step="2">
        <div id="dk-s-v" style="font-family: var(--font-mono); text-align: right;">0%</div>
      </div>

      <div class="widget-stage" id="dk-stage"></div>
      <div class="callout" id="dk-explain"></div>
    </div>
  `;

  root.querySelector('#dk-s').addEventListener('input', (e) => { solarPct = +e.target.value; root.querySelector('#dk-s-v').textContent = solarPct + '%'; render(); });

  function render() {
    const peak = demand(19) * 1.0;
    const totalDemandIntegral = Array.from({length:24}, (_,h) => demand(h)).reduce((a,b)=>a+b);
    const solarShare = solarPct / 100;
    // Scale solar capacity so its annual energy equals solarShare * total demand
    // Daily solar integral
    const solarDailyIntegral = Array.from({length:24}, (_,h) => solar(h)).reduce((a,b)=>a+b);
    const solarScale = (totalDemandIntegral * solarShare) / Math.max(0.001, solarDailyIntegral);

    const W = 600, H = 280, PAD = 50;
    function x(h) { return PAD + (h / 24) * (W - 2*PAD); }
    function y(v) { return H - PAD - (v / 1.5) * (H - 2*PAD); }

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<line x1="${PAD}" y1="${H-PAD}" x2="${W-PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;
    [0, 6, 12, 18, 24].forEach((h) => {
      svg += `<text x="${x(h)}" y="${H-PAD+18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${h}:00</text>`;
    });
    [0, 0.5, 1.0, 1.5].forEach((v) => {
      svg += `<text x="${PAD-8}" y="${y(v)+3}" text-anchor="end" style="font-family: var(--font-mono); font-size: 10px;">${v.toFixed(1)}</text>`;
    });

    // Demand line (gray)
    let dpts = [];
    for (let h = 0; h <= 24; h += 0.25) dpts.push(`${x(h)},${y(demand(h))}`);
    svg += `<polyline points="${dpts.join(' ')}" fill="none" stroke="var(--ink-soft)" stroke-width="2" stroke-dasharray="4 3"/>`;
    // Solar line (orange)
    let spts = [];
    for (let h = 0; h <= 24; h += 0.25) spts.push(`${x(h)},${y(solar(h) * solarScale)}`);
    svg += `<polyline points="${spts.join(' ')}" fill="none" stroke="#f5a623" stroke-width="2"/>`;
    // Net load (the duck) — accent red, filled
    let npts = [];
    for (let h = 0; h <= 24; h += 0.25) {
      const net = Math.max(0, demand(h) - solar(h) * solarScale);
      npts.push(`${x(h)},${y(net)}`);
    }
    svg += `<polyline points="${npts.join(' ')}" fill="none" stroke="var(--accent)" stroke-width="3"/>`;

    // Legend
    svg += `<g transform="translate(${W-180}, ${PAD+5})">
      <rect x="0" y="0" width="170" height="60" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5" rx="3"/>
      <line x1="10" y1="14" x2="30" y2="14" stroke="var(--ink-soft)" stroke-width="2" stroke-dasharray="3 2"/>
      <text x="36" y="18" style="font-family: var(--font-mono); font-size: 10px;">Total demand</text>
      <line x1="10" y1="32" x2="30" y2="32" stroke="#f5a623" stroke-width="2"/>
      <text x="36" y="36" style="font-family: var(--font-mono); font-size: 10px;">Solar supply</text>
      <line x1="10" y1="50" x2="30" y2="50" stroke="var(--accent)" stroke-width="3"/>
      <text x="36" y="54" style="font-family: var(--font-mono); font-size: 10px;">Net (residual) load</text>
    </g>`;
    svg += `<text x="${W/2}" y="${H-12}" text-anchor="middle" style="font-family: var(--font-display); font-size: 13px;">Hour of day</text>`;
    svg += `<text x="14" y="${H/2}" text-anchor="middle" style="font-family: var(--font-display); font-size: 13px;" transform="rotate(-90 14 ${H/2})">Load (normalized)</text>`;
    svg += `</svg>`;

    // metrics
    let maxNet = 0, minNet = 999, eveningRamp = 0;
    let prevNet = 0;
    for (let h = 0; h <= 24; h += 0.25) {
      const net = Math.max(0, demand(h) - solar(h) * solarScale);
      if (net > maxNet) maxNet = net;
      if (net < minNet) minNet = net;
      if (h > 16 && h <= 20) {
        eveningRamp = Math.max(eveningRamp, net - prevNet);
      }
      prevNet = net;
    }
    const ramp = (maxNet - minNet);

    let html = svg + `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; margin-top: 0.5rem; font-family: var(--font-mono); font-size: 0.78rem;">
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Peak net: <strong>${maxNet.toFixed(2)}</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Min net: <strong>${minNet.toFixed(2)}</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Daily ramp: <strong>${ramp.toFixed(2)}</strong></div>
    </div>`;
    root.querySelector('#dk-stage').innerHTML = html;

    let exp;
    if (solarPct < 10) exp = `<strong>Flat day, gentle bumps.</strong> Generation chases demand with a comfortable morning ramp and evening peak. This was every grid until ~2010.`;
    else if (solarPct < 30) exp = `<strong>Daytime trough begins.</strong> Wholesale prices dip when the sun is up. Fossil baseload starts cycling — bad for plant economics.`;
    else if (solarPct < 60) exp = `<strong>The duck is here.</strong> The valley is deep and the evening ramp is brutal. Operators need fast-ramping resources — peakers or batteries.`;
    else exp = `<strong>Over-the-belly duck.</strong> Solar makes more than the grid can absorb midday. Either curtail solar or store it. Modern systems shift it to evening with batteries.`;
    root.querySelector('#dk-explain').innerHTML = exp;
  }
  render();
}
