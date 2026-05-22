// Grover widget: 16 items, one target. Step amplitude amplification
// and watch the target's amplitude grow.

const N = 16;
const TARGET = 11;

function groverStep(amps) {
  // Oracle: negate target amplitude
  const a = amps.slice();
  a[TARGET] = -a[TARGET];
  // Diffuser: reflect about mean
  const mean = a.reduce((acc, x) => acc + x, 0) / N;
  return a.map((x) => 2 * mean - x);
}

export function initGroverWidget(root) {
  let amps = new Array(N).fill(1 / Math.sqrt(N));
  let iter = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Grover search over 16 items (target = #${TARGET})</div>

      <div class="controls">
        <button class="btn btn-accent" id="gv-step">Next iteration</button>
        <button class="btn btn-ghost" id="gv-reset">Reset</button>
      </div>

      <div class="widget-stage" id="gv-stage" style="min-height: 240px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Iteration</div><div class="value" id="m-iter">0</div></div>
        <div class="metric accent"><div class="label">P(target)</div><div class="value" id="m-pt">—</div></div>
        <div class="metric"><div class="label">Optimal iterations</div><div class="value">~${Math.round(Math.PI / 4 * Math.sqrt(N))}</div></div>
      </div>

      <div class="callout" id="gv-explain"></div>
    </div>
  `;

  root.querySelector('#gv-step').addEventListener('click', () => { amps = groverStep(amps); iter++; render(); });
  root.querySelector('#gv-reset').addEventListener('click', () => { amps = new Array(N).fill(1 / Math.sqrt(N)); iter = 0; render(); });

  function render() {
    const W = 600, H = 240, PAD = 30;
    const barW = (W - 2 * PAD) / N - 2;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<line x1="${PAD}" y1="${H/2}" x2="${W - PAD}" y2="${H/2}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="3 3"/>`;
    svg += `<text class="ml-axis-text" x="${PAD - 6}" y="${H/2 + 4}" text-anchor="end">0</text>`;
    for (let i = 0; i < N; i++) {
      const a = amps[i];
      const x = PAD + i * (barW + 2);
      const h = Math.abs(a) * (H - 2 * PAD - 20);
      const y = a >= 0 ? H/2 - h : H/2;
      const isTarget = i === TARGET;
      const color = isTarget ? 'var(--accent)' : (a < 0 ? '#aaa' : '#1c6dd0');
      svg += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${color}" stroke="var(--ink)" stroke-width="1"/>`;
      svg += `<text class="ml-axis-text" x="${x + barW/2}" y="${H - PAD/2}" text-anchor="middle" style="${isTarget ? 'fill: var(--accent); font-weight: 700;' : ''}">${i}</text>`;
    }
    svg += `</svg>`;
    root.querySelector('#gv-stage').innerHTML = svg;

    const pT = amps[TARGET] ** 2;
    root.querySelector('#m-iter').textContent = iter;
    root.querySelector('#m-pt').textContent = (pT * 100).toFixed(1) + '%';
    const opt = Math.round(Math.PI / 4 * Math.sqrt(N));
    let exp;
    if (iter === 0) exp = `Uniform superposition: every item equally likely. Step the algorithm to amplify the target.`;
    else if (iter < opt - 1) exp = `Amplitude of target is growing. After ~${opt} iterations it'll be near 1.`;
    else if (iter <= opt + 1) exp = `<strong>Peak.</strong> Measure now — you'll get the target with probability ${(pT*100).toFixed(0)}%.`;
    else exp = `<strong>Overshot.</strong> Grover amplitude oscillates — too many iterations and it cycles back down. Stop at the optimum.`;
    root.querySelector('#gv-explain').innerHTML = exp;
  }
  render();
}
