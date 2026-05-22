// Frequency widget: trip a generator, watch frequency drop, inertia
// hold the line, governor droop respond, AGC restore.

export function initFrequencyWidget(root) {
  let inertia = 0.7; // 0..1, how much rotating mass on the grid
  let playing = false;
  let timer = null;
  let t = 0;
  let freq = 50.0;
  let history = [];

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Trip a 1 GW generator on a 60 GW system</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: grid; grid-template-columns: 200px 1fr 90px; gap: 0.6rem; align-items: center;">
          <label>Grid inertia level:</label>
          <input type="range" id="fq-i" min="10" max="100" value="${inertia*100}" step="5">
          <div id="fq-i-v" style="font-family: var(--font-mono); text-align: right;">${(inertia*100).toFixed(0)}%</div>
        </div>
        <div style="display: flex; gap: 0.6rem;">
          <button id="fq-trip" class="btn">⚡ Trip generator</button>
          <button id="fq-reset" class="btn">Reset</button>
        </div>
      </div>

      <div class="widget-stage" id="fq-stage"></div>
      <div class="callout" id="fq-explain"></div>
    </div>
  `;

  root.querySelector('#fq-i').addEventListener('input', (e) => { inertia = +e.target.value / 100; root.querySelector('#fq-i-v').textContent = (inertia*100).toFixed(0) + '%'; reset(); });
  root.querySelector('#fq-trip').addEventListener('click', () => {
    if (playing) return;
    playing = true;
    t = 0;
    history = [];
    if (timer) clearInterval(timer);
    timer = setInterval(step, 60);
  });
  root.querySelector('#fq-reset').addEventListener('click', () => reset());

  function reset() {
    if (timer) clearInterval(timer);
    playing = false; t = 0; freq = 50; history = [];
    render();
  }

  function step() {
    t += 0.1;
    // Stage 1 (0..2s): pure inertia. Frequency falls linearly. Slope inversely proportional to inertia.
    // Stage 2 (2..15s): primary response (governor droop) arrests the fall.
    // Stage 3 (15..60s): secondary (AGC) restores to 50.
    const droprate = 0.5 / (inertia + 0.1); // Hz/s without response
    if (t < 2) {
      freq -= droprate * 0.1;
    } else if (t < 15) {
      // Primary response brings the rate to zero and slightly recovers
      const targetNadir = 50 - droprate * 2; // approx where it landed
      const recoveryAmt = 0.3; // primary recovers ~30% of the dip
      const target = targetNadir + (50 - targetNadir) * recoveryAmt * Math.min(1, (t - 2) / 5);
      freq += (target - freq) * 0.05;
    } else if (t < 45) {
      // Secondary AGC restores to 50
      freq += (50.0 - freq) * 0.02;
    } else {
      freq = 50.0;
      clearInterval(timer);
      playing = false;
    }
    history.push({ t, freq });
    render();
  }

  function render() {
    const W = 600, H = 240, PAD = 50;
    const tMax = 45;
    function x(tt) { return PAD + (tt / tMax) * (W - 2*PAD); }
    function y(f) { return H - PAD - ((f - 49.0) / 1.2) * (H - 2*PAD); }

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<line x1="${PAD}" y1="${H-PAD}" x2="${W-PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;

    // 50.0 Hz reference
    svg += `<line x1="${PAD}" y1="${y(50)}" x2="${W-PAD}" y2="${y(50)}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="3 3"/>`;
    svg += `<text x="${W-PAD+5}" y="${y(50)+4}" style="font-family: var(--font-mono); font-size: 10px;">50.0</text>`;
    // 49.5 line - danger
    svg += `<line x1="${PAD}" y1="${y(49.5)}" x2="${W-PAD}" y2="${y(49.5)}" stroke="#d62828" stroke-width="1" stroke-dasharray="3 3"/>`;
    svg += `<text x="${W-PAD+5}" y="${y(49.5)+4}" style="font-family: var(--font-mono); font-size: 10px; fill: #d62828;">49.5</text>`;

    // Phase shading
    svg += `<rect x="${x(0)}" y="${PAD}" width="${x(2)-x(0)}" height="${H-2*PAD}" fill="rgba(255, 200, 50, 0.15)"/>`;
    svg += `<rect x="${x(2)}" y="${PAD}" width="${x(15)-x(2)}" height="${H-2*PAD}" fill="rgba(76, 175, 80, 0.12)"/>`;
    svg += `<rect x="${x(15)}" y="${PAD}" width="${x(45)-x(15)}" height="${H-2*PAD}" fill="rgba(43, 108, 178, 0.1)"/>`;
    svg += `<text x="${x(1)}" y="${PAD+12}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px;">inertia</text>`;
    svg += `<text x="${x(8)}" y="${PAD+12}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px;">primary (droop)</text>`;
    svg += `<text x="${x(30)}" y="${PAD+12}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px;">secondary (AGC)</text>`;

    // x labels
    [0, 5, 15, 30, 45].forEach((tt) => {
      svg += `<text x="${x(tt)}" y="${H-PAD+18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${tt}s</text>`;
    });
    [49.0, 49.5, 50.0, 50.2].forEach((f) => {
      svg += `<text x="${PAD-8}" y="${y(f)+3}" text-anchor="end" style="font-family: var(--font-mono); font-size: 10px;">${f.toFixed(1)}</text>`;
    });

    if (history.length > 1) {
      const pts = history.map((p) => `${x(p.t)},${y(p.freq)}`).join(' ');
      svg += `<polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="3"/>`;
    }
    svg += `</svg>`;

    let html = `<div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.9rem; margin-bottom: 0.5rem; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; font-family: var(--font-mono); font-size: 0.85rem;">
      <div>t = <strong>${t.toFixed(1)}s</strong></div>
      <div>f = <strong style="color: ${freq < 49.5 ? '#d62828' : 'var(--ink)'};">${freq.toFixed(3)} Hz</strong></div>
      <div>Δf = <strong>${(freq - 50).toFixed(3)} Hz</strong></div>
    </div>` + svg;
    root.querySelector('#fq-stage').innerHTML = html;

    let exp;
    if (!playing && t === 0) exp = `Hit <em>Trip generator</em>. The system instantly loses 1 GW of supply — frequency starts to fall. How fast it falls depends on inertia.`;
    else if (t < 2) exp = `<strong>Inertia phase.</strong> Spinning turbines convert their rotational kinetic energy into electrical output, slowing as they do. Higher inertia = slower drop = more time to react.`;
    else if (t < 15) exp = `<strong>Primary response (droop).</strong> Each generator's governor reads the dip and opens its valve a bit more. Distributed, fast (seconds). Stops the fall but does not restore.`;
    else if (t < 45) exp = `<strong>Secondary control (AGC).</strong> Central dispatch commands specific units to ramp up over minutes. Restores frequency to exactly 50 Hz and frees up primary reserves.`;
    else exp = `<strong>Back to nominal.</strong> Operators have ~30 minutes to find a tertiary unit (warm-start gas, hydro) and replenish reserves before the next contingency.`;
    root.querySelector('#fq-explain').innerHTML = exp;
  }
  render();
}
