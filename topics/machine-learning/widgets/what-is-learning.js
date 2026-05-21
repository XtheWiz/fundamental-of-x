// What-is-learning widget: drag points on a 2D plot, watch a best-fit
// line (ordinary least squares) update in real time. Show MSE.

export function initWhatIsLearningWidget(root) {
  const state = {
    points: [
      { x: 1.0, y: 2.2 },
      { x: 2.0, y: 3.5 },
      { x: 3.5, y: 4.1 },
      { x: 5.0, y: 6.8 },
      { x: 6.0, y: 7.0 },
      { x: 7.0, y: 8.5 },
    ],
    dragIdx: null,
  };
  const W = 480, H = 320, PAD = 36;
  const XMIN = 0, XMAX = 10, YMIN = 0, YMAX = 10;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Best-fit line (drag points)</div>
      <p class="widget-hint">Drag any orange point. The line — y = m·x + b — re-fits to minimize squared error.</p>

      <div class="widget-stage" id="wl-stage" style="text-align: center;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Slope (m)</div><div class="value" id="m-slope">—</div></div>
        <div class="metric"><div class="label">Intercept (b)</div><div class="value" id="m-int">—</div></div>
        <div class="metric accent"><div class="label">MSE (loss)</div><div class="value" id="m-mse">—</div></div>
      </div>

      <div class="callout">The model is <code>ŷ = m·x + b</code>. The loss is the average of (ŷ − y)². The optimizer (analytic least squares) picks m and b to minimize it. Drag points to change the data and watch the fit follow.</div>
    </div>
  `;

  function xToPx(x) { return PAD + (x - XMIN) / (XMAX - XMIN) * (W - 2 * PAD); }
  function yToPx(y) { return H - PAD - (y - YMIN) / (YMAX - YMIN) * (H - 2 * PAD); }
  function pxToX(px) { return XMIN + (px - PAD) / (W - 2 * PAD) * (XMAX - XMIN); }
  function pxToY(py) { return YMIN + (H - PAD - py) / (H - 2 * PAD) * (YMAX - YMIN); }

  function fit() {
    const n = state.points.length;
    const meanX = state.points.reduce((a, p) => a + p.x, 0) / n;
    const meanY = state.points.reduce((a, p) => a + p.y, 0) / n;
    let num = 0, den = 0;
    state.points.forEach((p) => {
      num += (p.x - meanX) * (p.y - meanY);
      den += (p.x - meanX) ** 2;
    });
    const m = den === 0 ? 0 : num / den;
    const b = meanY - m * meanX;
    const mse = state.points.reduce((acc, p) => acc + ((m * p.x + b) - p.y) ** 2, 0) / n;
    return { m, b, mse };
  }

  function render() {
    const { m, b, mse } = fit();
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // background + axes
    svg += `<rect class="ml-plot-bg" x="${PAD}" y="${PAD}" width="${W - 2 * PAD}" height="${H - 2 * PAD}"/>`;
    for (let i = 0; i <= 10; i += 2) {
      svg += `<line class="ml-grid" x1="${xToPx(i)}" y1="${PAD}" x2="${xToPx(i)}" y2="${H - PAD}"/>`;
      svg += `<line class="ml-grid" x1="${PAD}" y1="${yToPx(i)}" x2="${W - PAD}" y2="${yToPx(i)}"/>`;
      svg += `<text class="ml-axis-text" x="${xToPx(i)}" y="${H - PAD + 14}" text-anchor="middle">${i}</text>`;
      svg += `<text class="ml-axis-text" x="${PAD - 6}" y="${yToPx(i) + 3}" text-anchor="end">${i}</text>`;
    }
    // best-fit line
    const yLeft = m * XMIN + b;
    const yRight = m * XMAX + b;
    svg += `<line class="ml-line predicted" x1="${xToPx(XMIN)}" y1="${yToPx(yLeft)}" x2="${xToPx(XMAX)}" y2="${yToPx(yRight)}"/>`;
    // residual lines (faded vertical)
    state.points.forEach((p) => {
      const yhat = m * p.x + b;
      svg += `<line x1="${xToPx(p.x)}" y1="${yToPx(p.y)}" x2="${xToPx(p.x)}" y2="${yToPx(yhat)}" stroke="var(--accent)" stroke-width="1" stroke-dasharray="3 2" opacity="0.5"/>`;
    });
    // points
    state.points.forEach((p, i) => {
      svg += `<circle class="ml-point-a" data-i="${i}" cx="${xToPx(p.x)}" cy="${yToPx(p.y)}" r="8" style="cursor: grab;"/>`;
    });
    svg += `</svg>`;
    root.querySelector('#wl-stage').innerHTML = svg;

    root.querySelector('#m-slope').textContent = m.toFixed(3);
    root.querySelector('#m-int').textContent = b.toFixed(3);
    root.querySelector('#m-mse').textContent = mse.toFixed(3);

    // wire up drag
    const svgEl = root.querySelector('svg');
    svgEl.querySelectorAll('circle[data-i]').forEach((c) => {
      c.addEventListener('mousedown', (e) => {
        state.dragIdx = Number(c.dataset.i);
        c.style.cursor = 'grabbing';
      });
    });
    svgEl.addEventListener('mousemove', (e) => {
      if (state.dragIdx === null) return;
      const rect = svgEl.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (W / rect.width);
      const sy = (e.clientY - rect.top) * (H / rect.height);
      let x = pxToX(sx), y = pxToY(sy);
      x = Math.max(XMIN + 0.1, Math.min(XMAX - 0.1, x));
      y = Math.max(YMIN + 0.1, Math.min(YMAX - 0.1, y));
      state.points[state.dragIdx] = { x, y };
      render();
    });
    svgEl.addEventListener('mouseup', () => { state.dragIdx = null; });
    svgEl.addEventListener('mouseleave', () => { state.dragIdx = null; });
  }
  render();
}
