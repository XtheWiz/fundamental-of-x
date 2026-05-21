// Gradient descent widget: 1D loss curve f(w) = (w-3)^2 + 1. Ball
// rolls down via w -= lr * df/dw. Adjustable learning rate + start.

const TRUE_MIN = 3;
function loss(w) { return (w - TRUE_MIN) ** 2 + 1; }
function grad(w) { return 2 * (w - TRUE_MIN); }

export function initGradientDescentWidget(root) {
  const state = {
    w: -2,
    lr: 0.1,
    history: [],   // [w values]
    running: false,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Roll the ball down (loss = (w−3)² + 1)</div>

      <div class="controls">
        <label>Learning rate: <strong id="gd-lrv">${state.lr.toFixed(2)}</strong></label>
        <input type="range" min="0.01" max="1.2" step="0.01" value="${state.lr}" id="gd-lr" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Starting w: <strong id="gd-wv">${state.w.toFixed(2)}</strong></label>
        <input type="range" min="-5" max="10" step="0.1" value="${state.w}" id="gd-w" style="flex: 1;">
      </div>
      <div class="controls">
        <button class="btn btn-accent" id="gd-step">Step</button>
        <button class="btn" id="gd-run">Run 30 steps</button>
        <button class="btn btn-ghost" id="gd-reset">Reset</button>
      </div>

      <div class="widget-stage" id="gd-stage" style="text-align: center;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">w</div><div class="value" id="m-w">—</div></div>
        <div class="metric"><div class="label">loss</div><div class="value" id="m-loss">—</div></div>
        <div class="metric accent"><div class="label">steps</div><div class="value" id="m-steps">0</div></div>
      </div>

      <div class="callout" id="gd-explain">Pick a learning rate. Step or run. At lr=0.1 you'll converge smoothly. Push lr above 1 to see overshoot/divergence.</div>
    </div>
  `;

  root.querySelector('#gd-lr').addEventListener('input', (e) => {
    state.lr = Number(e.target.value);
    root.querySelector('#gd-lrv').textContent = state.lr.toFixed(2);
  });
  root.querySelector('#gd-w').addEventListener('input', (e) => {
    state.w = Number(e.target.value);
    state.history = [];
    root.querySelector('#gd-wv').textContent = state.w.toFixed(2);
    render();
  });
  root.querySelector('#gd-step').addEventListener('click', () => { step(); render(); });
  root.querySelector('#gd-run').addEventListener('click', async () => {
    if (state.running) return; state.running = true;
    for (let i = 0; i < 30; i++) { step(); render(); await wait(120); }
    state.running = false;
  });
  root.querySelector('#gd-reset').addEventListener('click', () => {
    state.w = Number(root.querySelector('#gd-w').value);
    state.history = []; render();
  });

  function step() {
    state.history.push(state.w);
    state.w = state.w - state.lr * grad(state.w);
    // clamp to keep visualization sane
    if (!isFinite(state.w) || Math.abs(state.w) > 50) state.w = state.w > 0 ? 50 : -50;
  }

  const W = 500, H = 320, PAD = 40;
  const WMIN = -5, WMAX = 10;
  const LMIN = 0, LMAX = loss(WMIN);
  function xToPx(w) { return PAD + (w - WMIN) / (WMAX - WMIN) * (W - 2 * PAD); }
  function yToPx(l) { return H - PAD - Math.min(l, LMAX) / LMAX * (H - 2 * PAD); }

  function render() {
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<rect class="ml-plot-bg" x="${PAD}" y="${PAD}" width="${W - 2 * PAD}" height="${H - 2 * PAD}"/>`;
    // axes
    for (let w = WMIN; w <= WMAX; w += 2.5) {
      svg += `<text class="ml-axis-text" x="${xToPx(w)}" y="${H - PAD + 14}" text-anchor="middle">${w}</text>`;
    }
    svg += `<text class="ml-axis-text" x="${xToPx(WMAX/2)}" y="${H - 4}" text-anchor="middle">parameter w</text>`;
    svg += `<text class="ml-axis-text" x="10" y="${H/2}" transform="rotate(-90, 10, ${H/2})" text-anchor="middle">loss</text>`;
    // loss curve
    let path = '';
    for (let w = WMIN; w <= WMAX; w += 0.1) {
      path += (path ? 'L' : 'M') + xToPx(w) + ',' + yToPx(loss(w));
    }
    svg += `<path d="${path}" stroke="var(--ink)" stroke-width="2.5" fill="none"/>`;
    // minimum marker
    svg += `<circle cx="${xToPx(TRUE_MIN)}" cy="${yToPx(loss(TRUE_MIN))}" r="4" fill="#2a8a3e" stroke="var(--ink)" stroke-width="1.5"/>`;
    svg += `<text class="ml-axis-text" x="${xToPx(TRUE_MIN)}" y="${yToPx(loss(TRUE_MIN)) + 18}" text-anchor="middle" style="fill: #2a8a3e;">min</text>`;
    // history trail
    state.history.forEach((wh, i) => {
      svg += `<circle cx="${xToPx(wh)}" cy="${yToPx(loss(wh))}" r="3" fill="var(--accent)" opacity="${0.2 + 0.6 * (i / Math.max(1, state.history.length))}"/>`;
    });
    // gradient arrow at current point
    const g = grad(state.w);
    const arrowEnd = state.w - state.lr * g;
    svg += `<line x1="${xToPx(state.w)}" y1="${yToPx(loss(state.w))}" x2="${xToPx(arrowEnd)}" y2="${yToPx(loss(state.w))}" stroke="var(--accent)" stroke-width="2" marker-end="url(#gd-arr)"/>`;
    svg += `<defs><marker id="gd-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--accent)"/></marker></defs>`;
    // current ball
    svg += `<circle cx="${xToPx(state.w)}" cy="${yToPx(loss(state.w))}" r="9" fill="var(--accent)" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `</svg>`;
    root.querySelector('#gd-stage').innerHTML = svg;

    root.querySelector('#m-w').textContent = state.w.toFixed(3);
    root.querySelector('#m-loss').textContent = loss(state.w).toFixed(3);
    root.querySelector('#m-steps').textContent = state.history.length;

    let exp;
    if (state.lr > 1.0) exp = `<strong>Diverging.</strong> lr=${state.lr} is too large — each step overshoots, then overshoots more. Real ML: pick a smaller lr or use Adam (adaptive).`;
    else if (state.lr < 0.03) exp = `<strong>Too slow.</strong> Convergence will eventually happen, but you'll waste hundreds of steps. Bump lr up.`;
    else if (state.lr > 0.9) exp = `<strong>Bouncing.</strong> lr=${state.lr} is at the edge of stability — you'll converge but with oscillation.`;
    else exp = `Smooth convergence. Each step moves a fraction of the way toward the minimum.`;
    root.querySelector('#gd-explain').innerHTML = exp;
  }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  render();
}
