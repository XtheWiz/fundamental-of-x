// K-means widget: step Lloyd's algorithm on a 3-cluster dataset.
// Show assignment phase + update phase as separate buttons.

const COLORS = ['#d62828', '#1c6dd0', '#2a8a3e'];

function generateData(seed) {
  // 3 Gaussian-ish clusters
  let s = seed;
  function rng() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
  function gauss() { return (rng() + rng() + rng() - 1.5) * 1.2; }
  const pts = [];
  const centers = [[2.5, 2.5], [7, 3], [5, 7.5]];
  centers.forEach((c) => {
    for (let i = 0; i < 15; i++) pts.push({ x: c[0] + gauss(), y: c[1] + gauss(), cluster: -1 });
  });
  return pts;
}

export function initKmeansWidget(root) {
  const state = {
    points: generateData(7),
    K: 3,
    centroids: [],
    phase: 'init',   // 'init' | 'assign' | 'update' | 'converged'
    iter: 0,
  };

  function reset() {
    state.points = generateData(Math.floor(Math.random() * 1000));
    state.points.forEach((p) => p.cluster = -1);
    state.centroids = [];
    for (let i = 0; i < state.K; i++) {
      state.centroids.push({ x: 1 + Math.random() * 8, y: 1 + Math.random() * 8 });
    }
    state.phase = 'init';
    state.iter = 0;
  }

  function assignStep() {
    state.points.forEach((p) => {
      let best = 0, bestD = Infinity;
      state.centroids.forEach((c, i) => {
        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      p.cluster = best;
    });
    state.phase = 'assign';
  }
  function updateStep() {
    const moved = [];
    state.centroids.forEach((c, i) => {
      const pts = state.points.filter((p) => p.cluster === i);
      if (!pts.length) return;
      const nx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
      const ny = pts.reduce((a, p) => a + p.y, 0) / pts.length;
      moved.push(Math.hypot(nx - c.x, ny - c.y));
      c.x = nx; c.y = ny;
    });
    state.phase = moved.every((m) => m < 0.01) ? 'converged' : 'update';
    state.iter += 1;
  }

  reset();

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Lloyd's algorithm step-by-step (K=3)</div>

      <div class="controls">
        <button class="btn btn-accent" id="km-step">Next step</button>
        <button class="btn" id="km-run">Run to convergence</button>
        <button class="btn btn-ghost" id="km-reset">New dataset</button>
      </div>

      <div class="widget-stage" id="km-stage" style="text-align: center;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Iteration</div><div class="value" id="m-iter">0</div></div>
        <div class="metric"><div class="label">Phase</div><div class="value" id="m-phase">init</div></div>
        <div class="metric accent"><div class="label">Status</div><div class="value" id="m-status">—</div></div>
      </div>
    </div>
  `;

  root.querySelector('#km-step').addEventListener('click', () => {
    if (state.phase === 'init' || state.phase === 'update') assignStep();
    else if (state.phase === 'assign') updateStep();
    render();
  });
  root.querySelector('#km-run').addEventListener('click', async () => {
    while (state.phase !== 'converged' && state.iter < 30) {
      if (state.phase === 'init' || state.phase === 'update') assignStep();
      else if (state.phase === 'assign') updateStep();
      render();
      await wait(280);
    }
  });
  root.querySelector('#km-reset').addEventListener('click', () => { reset(); render(); });

  const W = 480, H = 360, PAD = 30;
  const XMIN = 0, XMAX = 10, YMIN = 0, YMAX = 10;
  function xToPx(x) { return PAD + (x - XMIN) / (XMAX - XMIN) * (W - 2 * PAD); }
  function yToPx(y) { return H - PAD - (y - YMIN) / (YMAX - YMIN) * (H - 2 * PAD); }

  function render() {
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<rect class="ml-plot-bg" x="${PAD}" y="${PAD}" width="${W - 2 * PAD}" height="${H - 2 * PAD}"/>`;
    state.points.forEach((p) => {
      const color = p.cluster >= 0 ? COLORS[p.cluster] : '#aaa';
      svg += `<circle cx="${xToPx(p.x)}" cy="${yToPx(p.y)}" r="4" fill="${color}" stroke="var(--ink)" stroke-width="0.8"/>`;
    });
    state.centroids.forEach((c, i) => {
      svg += `<polygon points="${xToPx(c.x)},${yToPx(c.y) - 11} ${xToPx(c.x) + 10},${yToPx(c.y) + 6} ${xToPx(c.x) - 10},${yToPx(c.y) + 6}" fill="${COLORS[i]}" stroke="var(--ink)" stroke-width="2.5"/>`;
      svg += `<text class="ml-axis-text" x="${xToPx(c.x)}" y="${yToPx(c.y) + 24}" text-anchor="middle" style="fill: ${COLORS[i]}; font-weight: 700;">μ${i+1}</text>`;
    });
    svg += `</svg>`;
    root.querySelector('#km-stage').innerHTML = svg;

    root.querySelector('#m-iter').textContent = state.iter;
    root.querySelector('#m-phase').textContent = state.phase;
    root.querySelector('#m-status').textContent = state.phase === 'converged' ? 'converged ✓' : 'running';
  }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  render();
}
