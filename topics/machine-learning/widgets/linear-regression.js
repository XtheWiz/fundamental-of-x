// Linear regression widget: sliders for w and b. Plot data + your line +
// the optimal line. Show your loss vs the optimal loss.

const DATA = [
  { x: 1.0, y: 1.8 },  { x: 2.0, y: 3.6 },  { x: 3.0, y: 4.2 },
  { x: 4.0, y: 6.5 },  { x: 5.0, y: 7.0 },  { x: 6.0, y: 8.4 },
  { x: 7.0, y: 9.1 },  { x: 8.0, y: 10.6 },
];

function mse(w, b) {
  return DATA.reduce((acc, p) => acc + ((w * p.x + b) - p.y) ** 2, 0) / DATA.length;
}
function optimal() {
  const n = DATA.length;
  const mx = DATA.reduce((a, p) => a + p.x, 0) / n;
  const my = DATA.reduce((a, p) => a + p.y, 0) / n;
  let num = 0, den = 0;
  DATA.forEach((p) => { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; });
  const w = num / den;
  const b = my - w * mx;
  return { w, b, loss: mse(w, b) };
}

export function initLinearRegressionWidget(root) {
  let w = 0.5, b = 1;
  const opt = optimal();
  const W = 480, H = 320, PAD = 36;
  const XMIN = 0, XMAX = 10, YMIN = 0, YMAX = 12;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Adjust w and b — beat the optimal fit</div>

      <div class="controls">
        <label>w (slope): <strong id="lr-wv">${w.toFixed(2)}</strong></label>
        <input type="range" min="-1" max="3" step="0.01" value="${w}" id="lr-w" style="flex: 1;">
      </div>
      <div class="controls">
        <label>b (intercept): <strong id="lr-bv">${b.toFixed(2)}</strong></label>
        <input type="range" min="-3" max="6" step="0.01" value="${b}" id="lr-b" style="flex: 1;">
      </div>
      <div class="controls">
        <button class="btn btn-accent" id="lr-snap">Snap to optimal</button>
      </div>

      <div class="widget-stage" id="lr-stage" style="text-align: center;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Your loss</div><div class="value" id="m-loss">—</div></div>
        <div class="metric"><div class="label">Optimal loss</div><div class="value" id="m-opt">${opt.loss.toFixed(3)}</div></div>
        <div class="metric accent"><div class="label">Δ from optimal</div><div class="value" id="m-delta">—</div></div>
      </div>
    </div>
  `;

  root.querySelector('#lr-w').addEventListener('input', (e) => { w = Number(e.target.value); render(); });
  root.querySelector('#lr-b').addEventListener('input', (e) => { b = Number(e.target.value); render(); });
  root.querySelector('#lr-snap').addEventListener('click', () => {
    w = opt.w; b = opt.b;
    root.querySelector('#lr-w').value = w;
    root.querySelector('#lr-b').value = b;
    render();
  });

  function xToPx(x) { return PAD + (x - XMIN) / (XMAX - XMIN) * (W - 2 * PAD); }
  function yToPx(y) { return H - PAD - (y - YMIN) / (YMAX - YMIN) * (H - 2 * PAD); }

  function render() {
    const myLoss = mse(w, b);
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<rect class="ml-plot-bg" x="${PAD}" y="${PAD}" width="${W - 2 * PAD}" height="${H - 2 * PAD}"/>`;
    for (let i = 0; i <= 10; i += 2) {
      svg += `<line class="ml-grid" x1="${xToPx(i)}" y1="${PAD}" x2="${xToPx(i)}" y2="${H - PAD}"/>`;
      svg += `<line class="ml-grid" x1="${PAD}" y1="${yToPx(i)}" x2="${W - PAD}" y2="${yToPx(i)}"/>`;
      svg += `<text class="ml-axis-text" x="${xToPx(i)}" y="${H - PAD + 14}" text-anchor="middle">${i}</text>`;
      svg += `<text class="ml-axis-text" x="${PAD - 6}" y="${yToPx(i) + 3}" text-anchor="end">${i}</text>`;
    }
    // optimal line (faded green)
    svg += `<line x1="${xToPx(XMIN)}" y1="${yToPx(opt.w * XMIN + opt.b)}" x2="${xToPx(XMAX)}" y2="${yToPx(opt.w * XMAX + opt.b)}" stroke="#2a8a3e" stroke-width="2" stroke-dasharray="4 3" opacity="0.7"/>`;
    // your line
    svg += `<line class="ml-line predicted" x1="${xToPx(XMIN)}" y1="${yToPx(w * XMIN + b)}" x2="${xToPx(XMAX)}" y2="${yToPx(w * XMAX + b)}"/>`;
    // residuals
    DATA.forEach((p) => {
      const yhat = w * p.x + b;
      svg += `<line x1="${xToPx(p.x)}" y1="${yToPx(p.y)}" x2="${xToPx(p.x)}" y2="${yToPx(yhat)}" stroke="var(--accent)" stroke-width="1" stroke-dasharray="3 2" opacity="0.5"/>`;
    });
    // points
    DATA.forEach((p) => {
      svg += `<circle class="ml-point-a" cx="${xToPx(p.x)}" cy="${yToPx(p.y)}" r="6"/>`;
    });
    // legend
    svg += `<text class="ml-axis-text" x="${W - PAD}" y="${PAD - 6}" text-anchor="end" style="fill: var(--accent);">your line</text>`;
    svg += `<text class="ml-axis-text" x="${W - PAD}" y="${PAD + 6}" text-anchor="end" style="fill: #2a8a3e;">— optimal</text>`;
    svg += `</svg>`;
    root.querySelector('#lr-stage').innerHTML = svg;

    root.querySelector('#lr-wv').textContent = w.toFixed(2);
    root.querySelector('#lr-bv').textContent = b.toFixed(2);
    root.querySelector('#m-loss').textContent = myLoss.toFixed(3);
    root.querySelector('#m-delta').textContent = `+${(myLoss - opt.loss).toFixed(3)}`;
  }
  render();
}
