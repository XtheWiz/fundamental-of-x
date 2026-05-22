// MPPT widget: IV curve with the operating point marker. User slides
// voltage; show P=V*I, mark MPP. Optionally simulate auto-tracking.

export function initMpptWidget(root) {
  let V = 18;  // operating voltage in V
  let irradiance = 1.0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">IV curve and the max-power point</div>

      <div class="controls">
        <label>Operating voltage: <strong id="mp-vv">${V}</strong> V</label>
        <input type="range" min="0" max="22" step="0.1" value="${V}" id="mp-v" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Irradiance: <strong id="mp-iv">${(irradiance*100).toFixed(0)}%</strong></label>
        <input type="range" min="0.2" max="1.0" step="0.05" value="${irradiance}" id="mp-i" style="flex: 1;">
        <button class="btn btn-accent" id="mp-track">Auto-track MPP</button>
      </div>

      <div class="widget-stage" id="mp-stage" style="text-align: center;"></div>
      <div class="callout" id="mp-explain"></div>
    </div>
  `;

  root.querySelector('#mp-v').addEventListener('input', (e) => { V = Number(e.target.value); render(); });
  root.querySelector('#mp-i').addEventListener('input', (e) => { irradiance = Number(e.target.value); render(); });
  root.querySelector('#mp-track').addEventListener('click', () => {
    // Find MPP by scanning
    let best = 0, bestV = 0;
    for (let v = 0; v < 22; v += 0.1) {
      const p = v * current(v);
      if (p > best) { best = p; bestV = v; }
    }
    V = bestV;
    root.querySelector('#mp-v').value = V;
    render();
  });

  function current(v) {
    // Simple model: I = Isc * (1 - exp((V - Voc) * k))
    const Isc = 8 * irradiance;
    const Voc = 21;
    const i = Isc * (1 - Math.exp((v - Voc) / 1.5));
    return Math.max(0, i);
  }

  function render() {
    const W = 540, H = 280, PAD = 40;
    const Vmax = 22;
    const Imax = 9;
    function xToPx(v) { return PAD + v / Vmax * (W - 2 * PAD); }
    function yToPx(i) { return H - PAD - i / Imax * (H - 2 * PAD); }

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<rect class="ml-plot-bg" x="${PAD}" y="${PAD}" width="${W - 2*PAD}" height="${H - 2*PAD}"/>`;
    // IV curve
    let ivPath = '';
    for (let v = 0; v <= Vmax; v += 0.1) {
      ivPath += (ivPath ? 'L' : 'M') + xToPx(v) + ',' + yToPx(current(v));
    }
    svg += `<path d="${ivPath}" stroke="var(--ink)" stroke-width="2.5" fill="none"/>`;
    // Power curve (right axis)
    let pvPath = '';
    const Pmax = 200;  // arbitrary
    for (let v = 0; v <= Vmax; v += 0.1) {
      const p = v * current(v);
      pvPath += (pvPath ? 'L' : 'M') + xToPx(v) + ',' + (H - PAD - p / Pmax * (H - 2 * PAD));
    }
    svg += `<path d="${pvPath}" stroke="var(--accent)" stroke-width="2" fill="none" stroke-dasharray="4 3"/>`;
    // operating point marker
    const Iop = current(V);
    const Pop = V * Iop;
    svg += `<line x1="${xToPx(V)}" y1="${yToPx(Iop)}" x2="${xToPx(V)}" y2="${H - PAD}" stroke="var(--ink)" stroke-width="1" stroke-dasharray="3 2"/>`;
    svg += `<circle cx="${xToPx(V)}" cy="${yToPx(Iop)}" r="7" fill="var(--accent)" stroke="var(--ink)" stroke-width="2"/>`;
    // Axes
    for (let v = 0; v <= Vmax; v += 5) {
      svg += `<text class="ml-axis-text" x="${xToPx(v)}" y="${H - PAD + 14}" text-anchor="middle">${v}V</text>`;
    }
    for (let i = 0; i <= Imax; i += 2) {
      svg += `<text class="ml-axis-text" x="${PAD - 6}" y="${yToPx(i) + 3}" text-anchor="end">${i}A</text>`;
    }
    svg += `<text class="ml-axis-text" x="${W/2}" y="${H - 10}" text-anchor="middle">voltage</text>`;
    svg += `<text class="ml-axis-text" x="14" y="${H/2}" transform="rotate(-90, 14, ${H/2})" text-anchor="middle">current (—) / power (—) </text>`;
    svg += `</svg>`;
    root.querySelector('#mp-stage').innerHTML = svg;

    root.querySelector('#mp-vv').textContent = V.toFixed(1);
    root.querySelector('#mp-iv').textContent = (irradiance*100).toFixed(0) + '%';

    // Find MPP for explainer
    let bestP = 0, bestV = 0;
    for (let v = 0; v < 22; v += 0.1) { const p = v * current(v); if (p > bestP) { bestP = p; bestV = v; } }
    const dist = Math.abs(V - bestV);
    let exp;
    if (dist < 0.3) exp = `<strong>At the MPP.</strong> Operating at ${V.toFixed(1)}V × ${Iop.toFixed(1)}A = ${Pop.toFixed(0)}W. Maximum power for this irradiance.`;
    else if (V < bestV) exp = `Below MPP. Current is high but voltage is too low — wasting potential power. ${Pop.toFixed(0)}W vs ${bestP.toFixed(0)}W max.`;
    else exp = `Above MPP. The curve falls off a cliff past Voc — too high a voltage chokes the current. ${Pop.toFixed(0)}W vs ${bestP.toFixed(0)}W max.`;
    root.querySelector('#mp-explain').innerHTML = exp;
  }
  render();
}
