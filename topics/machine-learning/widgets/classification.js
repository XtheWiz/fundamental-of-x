// Classification widget: 2D plot, click to add red/blue points,
// logistic regression fit via gradient descent shows decision boundary.

export function initClassificationWidget(root) {
  const state = {
    points: [
      { x: 2, y: 2, c: 0 }, { x: 3, y: 3, c: 0 }, { x: 2, y: 4, c: 0 },
      { x: 7, y: 7, c: 1 }, { x: 8, y: 6, c: 1 }, { x: 7, y: 8, c: 1 },
    ],
    addClass: 0,
    w: [0.1, 0.1], b: 0,    // logistic weights
  };
  const W = 480, H = 360, PAD = 36;
  const XMIN = 0, XMAX = 10, YMIN = 0, YMAX = 10;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Click the plot to add points</div>

      <div class="controls">
        <label>Adding class:</label>
        <div class="pill-group">
          <input type="radio" name="cl-c" id="cl-a" value="0" checked>
          <label for="cl-a">Class A (red)</label>
          <input type="radio" name="cl-c" id="cl-b" value="1">
          <label for="cl-b">Class B (blue)</label>
        </div>
        <button class="btn btn-accent" id="cl-train">Train (300 steps)</button>
        <button class="btn btn-ghost" id="cl-reset">Reset</button>
      </div>

      <div class="widget-stage" id="cl-stage" style="text-align: center;"></div>

      <div class="callout">Decision boundary is where the model's predicted probability crosses 0.5 — visualized as the line. The shaded regions show which class the model would predict at every point.</div>
    </div>
  `;

  root.querySelectorAll('input[name=cl-c]').forEach((r) =>
    r.addEventListener('change', (e) => { state.addClass = Number(e.target.value); })
  );
  root.querySelector('#cl-train').addEventListener('click', () => { train(); render(); });
  root.querySelector('#cl-reset').addEventListener('click', () => {
    state.points = [];
    state.w = [0.1, 0.1]; state.b = 0;
    render();
  });

  function sigmoid(z) { return 1 / (1 + Math.exp(-Math.max(-50, Math.min(50, z)))); }

  function train() {
    const lr = 0.1;
    for (let step = 0; step < 300; step++) {
      let gw0 = 0, gw1 = 0, gb = 0;
      state.points.forEach((p) => {
        const z = state.w[0] * p.x + state.w[1] * p.y + state.b;
        const yhat = sigmoid(z);
        const err = yhat - p.c;
        gw0 += err * p.x; gw1 += err * p.y; gb += err;
      });
      const n = Math.max(1, state.points.length);
      state.w[0] -= lr * gw0 / n;
      state.w[1] -= lr * gw1 / n;
      state.b    -= lr * gb / n;
    }
  }

  function xToPx(x) { return PAD + (x - XMIN) / (XMAX - XMIN) * (W - 2 * PAD); }
  function yToPx(y) { return H - PAD - (y - YMIN) / (YMAX - YMIN) * (H - 2 * PAD); }
  function pxToX(px) { return XMIN + (px - PAD) / (W - 2 * PAD) * (XMAX - XMIN); }
  function pxToY(py) { return YMIN + (H - PAD - py) / (H - 2 * PAD) * (YMAX - YMIN); }

  function render() {
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<rect class="ml-plot-bg" x="${PAD}" y="${PAD}" width="${W - 2 * PAD}" height="${H - 2 * PAD}"/>`;
    // shaded prediction regions
    const cell = 16;
    for (let px = PAD; px < W - PAD; px += cell) {
      for (let py = PAD; py < H - PAD; py += cell) {
        const x = pxToX(px + cell/2), y = pxToY(py + cell/2);
        const z = state.w[0] * x + state.w[1] * y + state.b;
        const p = sigmoid(z);
        const color = p > 0.5 ? `rgba(28, 109, 208, ${(p - 0.5) * 0.5})` : `rgba(214, 40, 40, ${(0.5 - p) * 0.5})`;
        svg += `<rect x="${px}" y="${py}" width="${cell}" height="${cell}" fill="${color}"/>`;
      }
    }
    // grid
    for (let i = 0; i <= 10; i += 2) {
      svg += `<text class="ml-axis-text" x="${xToPx(i)}" y="${H - PAD + 14}" text-anchor="middle">${i}</text>`;
      svg += `<text class="ml-axis-text" x="${PAD - 6}" y="${yToPx(i) + 3}" text-anchor="end">${i}</text>`;
    }
    // decision boundary: w0*x + w1*y + b = 0  =>  y = -(w0*x + b)/w1
    if (Math.abs(state.w[1]) > 1e-6) {
      const yL = -(state.w[0] * XMIN + state.b) / state.w[1];
      const yR = -(state.w[0] * XMAX + state.b) / state.w[1];
      svg += `<line class="ml-line" x1="${xToPx(XMIN)}" y1="${yToPx(yL)}" x2="${xToPx(XMAX)}" y2="${yToPx(yR)}"/>`;
    }
    // points
    state.points.forEach((p) => {
      const cls = p.c === 0 ? 'ml-point-a' : 'ml-point-b';
      svg += `<circle class="${cls}" cx="${xToPx(p.x)}" cy="${yToPx(p.y)}" r="7"/>`;
    });
    svg += `</svg>`;
    root.querySelector('#cl-stage').innerHTML = svg;

    // click handler
    const svgEl = root.querySelector('svg');
    svgEl.style.cursor = 'crosshair';
    svgEl.addEventListener('click', (e) => {
      const rect = svgEl.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (W / rect.width);
      const sy = (e.clientY - rect.top) * (H / rect.height);
      if (sx < PAD || sx > W - PAD || sy < PAD || sy > H - PAD) return;
      state.points.push({ x: pxToX(sx), y: pxToY(sy), c: state.addClass });
      train();
      render();
    }, { once: true });
  }

  render();
}
