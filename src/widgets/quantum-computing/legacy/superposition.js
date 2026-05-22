// Superposition widget: prepare α|0⟩ + β|1⟩, run N measurements,
// compare empirical distribution to theoretical.

export function initSuperpositionWidget(root) {
  let theta = Math.PI / 3;  // tilt so it's not 50/50
  let history = [];

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Run measurements, watch frequencies converge</div>

      <div class="controls">
        <label>State preparation θ: <strong id="sp-tv">${theta.toFixed(2)}</strong></label>
        <input type="range" min="0" max="3.1416" step="0.05" value="${theta}" id="sp-t" style="flex: 1;">
      </div>
      <div class="controls">
        <button class="btn btn-accent" id="sp-one">Measure 1×</button>
        <button class="btn" id="sp-ten">Measure 10×</button>
        <button class="btn" id="sp-100">Measure 100×</button>
        <button class="btn btn-ghost" id="sp-reset">Reset</button>
      </div>

      <div class="widget-stage" id="sp-stage" style="min-height: 240px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Theoretical P(0)</div><div class="value" id="m-p0">—</div></div>
        <div class="metric"><div class="label">Empirical P(0)</div><div class="value" id="m-e0">—</div></div>
        <div class="metric accent"><div class="label">Measurements</div><div class="value" id="m-n">0</div></div>
      </div>
    </div>
  `;

  root.querySelector('#sp-t').addEventListener('input', (e) => { theta = Number(e.target.value); history = []; render(); });
  root.querySelector('#sp-one').addEventListener('click', () => measure(1));
  root.querySelector('#sp-ten').addEventListener('click', () => measure(10));
  root.querySelector('#sp-100').addEventListener('click', () => measure(100));
  root.querySelector('#sp-reset').addEventListener('click', () => { history = []; render(); });

  function measure(n) {
    const p0 = Math.cos(theta / 2) ** 2;
    for (let i = 0; i < n; i++) history.push(Math.random() < p0 ? 0 : 1);
    render();
  }

  function render() {
    const p0 = Math.cos(theta / 2) ** 2;
    const p1 = 1 - p0;
    const n = history.length;
    const c0 = history.filter((x) => x === 0).length;
    const c1 = n - c0;

    const W = 480, H = 240, PAD = 40;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // theoretical bars (gray)
    const barW = 80;
    svg += `<text style="font-family: var(--font-mono); font-size: 11px; fill: var(--ink-soft);" x="${W/2}" y="20" text-anchor="middle">theoretical (gray) vs empirical (red)</text>`;
    svg += `<rect x="${W/4 - barW}" y="${H - PAD - p0 * (H - 2*PAD)}" width="${barW}" height="${p0 * (H - 2*PAD)}" fill="#aaa" stroke="var(--ink)" stroke-width="1"/>`;
    svg += `<rect x="${W/2 + 20}" y="${H - PAD - p1 * (H - 2*PAD)}" width="${barW}" height="${p1 * (H - 2*PAD)}" fill="#aaa" stroke="var(--ink)" stroke-width="1"/>`;
    // empirical bars (red)
    if (n > 0) {
      const e0 = c0 / n, e1 = c1 / n;
      svg += `<rect x="${W/4}" y="${H - PAD - e0 * (H - 2*PAD)}" width="${barW}" height="${e0 * (H - 2*PAD)}" fill="var(--accent)" stroke="var(--ink)" stroke-width="1.5"/>`;
      svg += `<rect x="${W/2 + 100}" y="${H - PAD - e1 * (H - 2*PAD)}" width="${barW}" height="${e1 * (H - 2*PAD)}" fill="var(--accent)" stroke="var(--ink)" stroke-width="1.5"/>`;
    }
    svg += `<line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="var(--ink)" stroke-width="1.5"/>`;
    svg += `<text x="${W/4 - barW/2 + 40}" y="${H - PAD + 18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 12px;">|0⟩</text>`;
    svg += `<text x="${W/2 + 20 + barW/2 + 40}" y="${H - PAD + 18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 12px;">|1⟩</text>`;
    svg += `</svg>`;
    root.querySelector('#sp-stage').innerHTML = svg;

    root.querySelector('#sp-tv').textContent = theta.toFixed(2);
    root.querySelector('#m-p0').textContent = (p0 * 100).toFixed(1) + '%';
    root.querySelector('#m-e0').textContent = n === 0 ? '—' : (100 * c0 / n).toFixed(1) + '%';
    root.querySelector('#m-n').textContent = n;
  }
  render();
}
