// Neural network widget: tiny 2-4-1 net learning XOR. Train via
// simple SGD. Show decision regions + loss curve.

const XOR_DATA = [
  { x: 0.1, y: 0.1, c: 0 }, { x: 0.1, y: 0.9, c: 1 },
  { x: 0.9, y: 0.1, c: 1 }, { x: 0.9, y: 0.9, c: 0 },
];

function sigmoid(z) { return 1 / (1 + Math.exp(-Math.max(-50, Math.min(50, z)))); }

function makeNet() {
  // 2 inputs → 4 hidden → 1 output. Random init.
  return {
    W1: Array.from({ length: 4 }, () => [Math.random() - 0.5, Math.random() - 0.5]),
    b1: Array.from({ length: 4 }, () => Math.random() - 0.5),
    W2: Array.from({ length: 4 }, () => Math.random() - 0.5),
    b2: Math.random() - 0.5,
  };
}

function forward(net, x1, x2) {
  const h = net.W1.map((w, i) => sigmoid(w[0] * x1 + w[1] * x2 + net.b1[i]));
  const y = sigmoid(h.reduce((acc, hi, i) => acc + hi * net.W2[i], net.b2));
  return { h, y };
}

function step(net, lr) {
  const data = XOR_DATA;
  // Compute gradients across all data, then update
  const gW1 = net.W1.map(() => [0, 0]);
  const gb1 = net.b1.map(() => 0);
  const gW2 = net.W2.map(() => 0);
  let gb2 = 0;
  data.forEach((p) => {
    const { h, y } = forward(net, p.x, p.y);
    const dout = y - p.c;          // BCE gradient w.r.t. pre-sigmoid (for sigmoid output)
    net.W2.forEach((w, i) => { gW2[i] += dout * h[i]; });
    gb2 += dout;
    h.forEach((hi, i) => {
      const dh = dout * net.W2[i] * hi * (1 - hi);
      gW1[i][0] += dh * p.x;
      gW1[i][1] += dh * p.y;
      gb1[i]    += dh;
    });
  });
  const n = data.length;
  net.W1.forEach((w, i) => { w[0] -= lr * gW1[i][0] / n; w[1] -= lr * gW1[i][1] / n; });
  net.b1.forEach((_, i) => { net.b1[i] -= lr * gb1[i] / n; });
  net.W2.forEach((_, i) => { net.W2[i] -= lr * gW2[i] / n; });
  net.b2 -= lr * gb2 / n;
}

function loss(net) {
  return XOR_DATA.reduce((acc, p) => {
    const y = forward(net, p.x, p.y).y;
    const c = p.c;
    return acc - (c * Math.log(Math.max(1e-7, y)) + (1 - c) * Math.log(Math.max(1e-7, 1 - y)));
  }, 0) / XOR_DATA.length;
}

export function initNeuralNetworkWidget(root) {
  let net = makeNet();
  let lossHistory = [loss(net)];
  let running = false;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">XOR — a line cannot do this, but 4 hidden neurons can</div>

      <div class="controls">
        <button class="btn btn-accent" id="nn-train">Train 200 steps</button>
        <button class="btn" id="nn-step">Step 10</button>
        <button class="btn btn-ghost" id="nn-reset">Re-init weights</button>
      </div>

      <div class="widget-stage" id="nn-stage" style="text-align: center;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Loss</div><div class="value" id="m-loss">—</div></div>
        <div class="metric"><div class="label">Steps</div><div class="value" id="m-steps">0</div></div>
        <div class="metric accent"><div class="label">Accuracy</div><div class="value" id="m-acc">—</div></div>
      </div>
    </div>
  `;

  root.querySelector('#nn-train').addEventListener('click', async () => {
    if (running) return; running = true;
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 10; j++) step(net, 1.5);
      lossHistory.push(loss(net));
      render();
      await wait(40);
    }
    running = false;
  });
  root.querySelector('#nn-step').addEventListener('click', () => {
    for (let i = 0; i < 10; i++) step(net, 1.5);
    lossHistory.push(loss(net));
    render();
  });
  root.querySelector('#nn-reset').addEventListener('click', () => {
    net = makeNet();
    lossHistory = [loss(net)];
    render();
  });

  function render() {
    const W = 480, H = 360, PAD = 24;
    // Decision region + points
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    const plotW = 240;
    svg += `<rect class="ml-plot-bg" x="${PAD}" y="${PAD}" width="${plotW}" height="${plotW}"/>`;
    const cell = 12;
    for (let px = PAD; px < PAD + plotW; px += cell) {
      for (let py = PAD; py < PAD + plotW; py += cell) {
        const xx = (px - PAD) / plotW;
        const yy = 1 - (py - PAD) / plotW;
        const p = forward(net, xx, yy).y;
        const color = p > 0.5 ? `rgba(28, 109, 208, ${(p - 0.5) * 0.8})` : `rgba(214, 40, 40, ${(0.5 - p) * 0.8})`;
        svg += `<rect x="${px}" y="${py}" width="${cell}" height="${cell}" fill="${color}"/>`;
      }
    }
    XOR_DATA.forEach((p) => {
      const cx = PAD + p.x * plotW;
      const cy = PAD + (1 - p.y) * plotW;
      const cls = p.c === 0 ? 'ml-point-a' : 'ml-point-b';
      svg += `<circle class="${cls}" cx="${cx}" cy="${cy}" r="10"/>`;
    });
    svg += `<text class="ml-axis-text" x="${PAD + plotW/2}" y="${PAD + plotW + 16}" text-anchor="middle">decision regions</text>`;

    // Loss curve
    const lossX = 290, lossY = PAD, lossW = 170, lossH = 240;
    svg += `<rect class="ml-plot-bg" x="${lossX}" y="${lossY}" width="${lossW}" height="${lossH}"/>`;
    svg += `<text class="ml-axis-text" x="${lossX + lossW/2}" y="${lossY + lossH + 16}" text-anchor="middle">training loss</text>`;
    if (lossHistory.length > 1) {
      const maxL = Math.max(...lossHistory);
      let path = '';
      lossHistory.forEach((l, i) => {
        const px = lossX + (i / (lossHistory.length - 1)) * lossW;
        const py = lossY + lossH - (l / maxL) * lossH;
        path += (path ? 'L' : 'M') + px + ',' + py;
      });
      svg += `<path d="${path}" stroke="var(--accent)" stroke-width="2" fill="none"/>`;
    }

    svg += `</svg>`;
    root.querySelector('#nn-stage').innerHTML = svg;

    root.querySelector('#m-loss').textContent = loss(net).toFixed(4);
    root.querySelector('#m-steps').textContent = (lossHistory.length - 1) * 10;
    const acc = XOR_DATA.filter((p) => (forward(net, p.x, p.y).y > 0.5) === (p.c === 1)).length / XOR_DATA.length;
    root.querySelector('#m-acc').textContent = `${(acc * 100).toFixed(0)}%`;
  }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  render();
}
