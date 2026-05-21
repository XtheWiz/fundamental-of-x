// Overfitting widget: polynomial regression with adjustable degree.
// Fit train set, evaluate on both train and validation. Show U-shape.

const TRUE_FN = (x) => Math.sin(x) + 0.3 * x;
function noise(seed) { return Math.sin(seed * 12.9898) * 43758.5453 % 1; }

function makeData(N, seedOffset) {
  const data = [];
  for (let i = 0; i < N; i++) {
    const x = i * (6 / N) + 0.2;
    const y = TRUE_FN(x) + (Math.random() - 0.5) * 0.8;
    data.push({ x, y });
  }
  return data;
}

const TRAIN = makeData(12, 0);
const VAL = makeData(40, 100);

// Polynomial fit via normal equations (small N, fine here)
function polyFit(data, degree) {
  // Build matrix X (N × (d+1)) and vector y
  const N = data.length;
  const d = degree + 1;
  // X^T X (d × d) and X^T y (d)
  const XtX = Array.from({ length: d }, () => new Array(d).fill(0));
  const Xty = new Array(d).fill(0);
  data.forEach((p) => {
    const row = new Array(d);
    for (let i = 0; i < d; i++) row[i] = Math.pow(p.x, i);
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) XtX[i][j] += row[i] * row[j];
      Xty[i] += row[i] * p.y;
    }
  });
  // Solve via Gaussian elimination
  const aug = XtX.map((r, i) => [...r, Xty[i]]);
  for (let i = 0; i < d; i++) {
    let piv = i;
    for (let k = i + 1; k < d; k++) if (Math.abs(aug[k][i]) > Math.abs(aug[piv][i])) piv = k;
    [aug[i], aug[piv]] = [aug[piv], aug[i]];
    if (Math.abs(aug[i][i]) < 1e-10) return new Array(d).fill(0);
    for (let k = i + 1; k < d; k++) {
      const f = aug[k][i] / aug[i][i];
      for (let j = i; j <= d; j++) aug[k][j] -= f * aug[i][j];
    }
  }
  const w = new Array(d).fill(0);
  for (let i = d - 1; i >= 0; i--) {
    let s = aug[i][d];
    for (let j = i + 1; j < d; j++) s -= aug[i][j] * w[j];
    w[i] = s / aug[i][i];
  }
  return w;
}

function predict(w, x) {
  let acc = 0;
  for (let i = 0; i < w.length; i++) acc += w[i] * Math.pow(x, i);
  return acc;
}
function lossOn(w, data) {
  return data.reduce((acc, p) => acc + (predict(w, p.x) - p.y) ** 2, 0) / data.length;
}

export function initOverfittingWidget(root) {
  let degree = 3;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Fit a polynomial of degree D</div>

      <div class="controls">
        <label>Degree: <strong id="of-d">3</strong></label>
        <input type="range" min="1" max="12" value="3" step="1" id="of-deg" style="flex: 1;">
      </div>

      <div class="widget-stage" id="of-stage" style="text-align: center;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Train loss</div><div class="value" id="m-train">—</div></div>
        <div class="metric accent"><div class="label">Validation loss</div><div class="value" id="m-val">—</div></div>
        <div class="metric"><div class="label">Sweet spot</div><div class="value" id="m-sweet">D ≈ ?</div></div>
      </div>

      <div class="callout" id="of-explain"></div>
    </div>
  `;

  root.querySelector('#of-deg').addEventListener('input', (e) => {
    degree = Number(e.target.value);
    root.querySelector('#of-d').textContent = degree;
    render();
  });

  function render() {
    const w = polyFit(TRAIN, degree);
    const trainLoss = lossOn(w, TRAIN);
    const valLoss = lossOn(w, VAL);

    const W = 580, H = 320, PAD = 40;
    const XMIN = 0, XMAX = 6.5, YMIN = -1.5, YMAX = 4;
    function xToPx(x) { return PAD + (x - XMIN) / (XMAX - XMIN) * (W - 2 * PAD - 200); }
    function yToPx(y) { return H - PAD - (y - YMIN) / (YMAX - YMIN) * (H - 2 * PAD); }

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // main fit plot
    const plotW = W - 2 * PAD - 200;
    svg += `<rect class="ml-plot-bg" x="${PAD}" y="${PAD}" width="${plotW}" height="${H - 2 * PAD}"/>`;
    // true function
    let truePath = '';
    for (let x = XMIN; x <= XMAX; x += 0.05) {
      truePath += (truePath ? 'L' : 'M') + xToPx(x) + ',' + yToPx(TRUE_FN(x));
    }
    svg += `<path d="${truePath}" stroke="#2a8a3e" stroke-width="2" stroke-dasharray="5 3" fill="none" opacity="0.7"/>`;
    // fitted poly
    let fitPath = '';
    for (let x = XMIN; x <= XMAX; x += 0.04) {
      fitPath += (fitPath ? 'L' : 'M') + xToPx(x) + ',' + yToPx(predict(w, x));
    }
    svg += `<path d="${fitPath}" stroke="var(--accent)" stroke-width="2.5" fill="none"/>`;
    // train data
    TRAIN.forEach((p) => {
      svg += `<circle cx="${xToPx(p.x)}" cy="${yToPx(p.y)}" r="4" fill="var(--accent)" stroke="var(--ink)" stroke-width="1"/>`;
    });
    svg += `<text class="ml-axis-text" x="${PAD + plotW/2}" y="${H - 8}" text-anchor="middle">x</text>`;

    // train/val loss bars (right side)
    const barX = PAD + plotW + 20;
    const barW = 170;
    const barTop = PAD;
    const barH = H - 2 * PAD;
    svg += `<text class="ml-axis-text" x="${barX + barW/2}" y="${barTop - 5}" text-anchor="middle">losses (lower = better)</text>`;
    const maxL = Math.max(trainLoss, valLoss, 0.5);
    const tH = (trainLoss / maxL) * (barH - 30);
    const vH = (valLoss / maxL) * (barH - 30);
    svg += `<rect x="${barX + 20}" y="${barTop + barH - 30 - tH}" width="50" height="${tH}" fill="var(--accent)" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<text class="ml-axis-text" x="${barX + 45}" y="${barTop + barH - 14}" text-anchor="middle">train</text>`;
    svg += `<text class="ml-axis-text" x="${barX + 45}" y="${barTop + barH - 30 - tH - 6}" text-anchor="middle" style="font-weight: 700;">${trainLoss.toFixed(2)}</text>`;
    svg += `<rect x="${barX + 100}" y="${barTop + barH - 30 - vH}" width="50" height="${vH}" fill="#1c6dd0" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<text class="ml-axis-text" x="${barX + 125}" y="${barTop + barH - 14}" text-anchor="middle">val</text>`;
    svg += `<text class="ml-axis-text" x="${barX + 125}" y="${barTop + barH - 30 - vH - 6}" text-anchor="middle" style="font-weight: 700;">${valLoss.toFixed(2)}</text>`;

    svg += `</svg>`;
    root.querySelector('#of-stage').innerHTML = svg;

    root.querySelector('#m-train').textContent = trainLoss.toFixed(3);
    root.querySelector('#m-val').textContent = valLoss.toFixed(3);

    // find sweet spot by scanning
    let bestD = 1, bestV = Infinity;
    for (let d = 1; d <= 12; d++) {
      const wd = polyFit(TRAIN, d);
      const v = lossOn(wd, VAL);
      if (v < bestV) { bestV = v; bestD = d; }
    }
    root.querySelector('#m-sweet').textContent = `D = ${bestD}`;

    let exp;
    if (degree < bestD - 1) exp = `<strong>Underfitting.</strong> Degree ${degree} is too low — the line can't capture the curve. Both losses are high.`;
    else if (degree > bestD + 2) exp = `<strong>Overfitting.</strong> Degree ${degree} fits the training points beautifully (low train loss) but wiggles wildly between them — validation loss explodes.`;
    else exp = `<strong>Sweet spot.</strong> Degree ${degree} captures the signal without memorizing noise.`;
    root.querySelector('#of-explain').innerHTML = exp;
  }
  render();
}
