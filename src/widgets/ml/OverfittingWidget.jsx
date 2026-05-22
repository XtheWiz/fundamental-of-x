import { useMemo, useState } from 'react';

const TRUE_FN = (x) => Math.sin(x) + 0.3 * x;

function makeData(N, seed = 0) {
  let s = seed + 1;
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const data = [];
  for (let i = 0; i < N; i++) {
    const x = i * (6 / N) + 0.2;
    const y = TRUE_FN(x) + (rng() - 0.5) * 0.8;
    data.push({ x, y });
  }
  return data;
}

const TRAIN = makeData(12, 0);
const VAL = makeData(40, 100);

function polyFit(data, degree) {
  const N = data.length;
  const d = degree + 1;
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

const predict = (w, x) => w.reduce((a, c, i) => a + c * Math.pow(x, i), 0);
const lossOn = (w, data) => data.reduce((a, p) => a + (predict(w, p.x) - p.y) ** 2, 0) / data.length;

const W = 580, H = 320, PAD = 40;
const XMIN = 0, XMAX = 6.5, YMIN = -1.5, YMAX = 4;
const plotW = W - 2 * PAD - 200;
const xToPx = (x) => PAD + (x - XMIN) / (XMAX - XMIN) * plotW;
const yToPx = (y) => H - PAD - (y - YMIN) / (YMAX - YMIN) * (H - 2 * PAD);

const bestD = (() => {
  let best = 1, bestV = Infinity;
  for (let d = 1; d <= 12; d++) {
    const wd = polyFit(TRAIN, d);
    const v = lossOn(wd, VAL);
    if (v < bestV) { bestV = v; best = d; }
  }
  return best;
})();

export default function OverfittingWidget() {
  const [degree, setDegree] = useState(3);
  const { w, trainLoss, valLoss } = useMemo(() => {
    const w = polyFit(TRAIN, degree);
    return { w, trainLoss: lossOn(w, TRAIN), valLoss: lossOn(w, VAL) };
  }, [degree]);

  let truePath = '', fitPath = '';
  for (let x = XMIN; x <= XMAX; x += 0.05) truePath += (truePath ? 'L' : 'M') + xToPx(x) + ',' + yToPx(TRUE_FN(x));
  for (let x = XMIN; x <= XMAX; x += 0.04) fitPath += (fitPath ? 'L' : 'M') + xToPx(x) + ',' + yToPx(predict(w, x));

  const barX = PAD + plotW + 20, barW = 170, barTop = PAD, barH = H - 2 * PAD;
  const maxL = Math.max(trainLoss, valLoss, 0.5);
  const tH = (trainLoss / maxL) * (barH - 30);
  const vH = (valLoss / maxL) * (barH - 30);

  let exp;
  if (degree < bestD - 1) exp = <><strong>Underfitting.</strong> Degree {degree} is too low — the line can't capture the curve. Both losses are high.</>;
  else if (degree > bestD + 2) exp = <><strong>Overfitting.</strong> Degree {degree} fits the training points beautifully (low train loss) but wiggles wildly between them — validation loss explodes.</>;
  else exp = <><strong>Sweet spot.</strong> Degree {degree} captures the signal without memorising noise.</>;

  return (
    <div className="widget">
      <div className="widget-title">Fit a polynomial of degree D</div>
      <div className="controls">
        <label>Degree: <strong>{degree}</strong></label>
        <input type="range" min="1" max="12" value={degree} step="1" onChange={(e) => setDegree(+e.target.value)} style={{ flex: 1 }} />
      </div>
      <div className="widget-stage" style={{ textAlign: 'center' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <rect className="ml-plot-bg" x={PAD} y={PAD} width={plotW} height={H - 2 * PAD} />
          <path d={truePath} stroke="#2a8a3e" strokeWidth={2} strokeDasharray="5 3" fill="none" opacity={0.7} />
          <path d={fitPath} stroke="var(--accent)" strokeWidth={2.5} fill="none" />
          {TRAIN.map((p, i) => (
            <circle key={i} cx={xToPx(p.x)} cy={yToPx(p.y)} r={4}
              fill="var(--accent)" stroke="var(--ink)" strokeWidth={1} />
          ))}
          <text className="ml-axis-text" x={PAD + plotW / 2} y={H - 8} textAnchor="middle">x</text>

          <text className="ml-axis-text" x={barX + barW / 2} y={barTop - 5} textAnchor="middle">losses (lower = better)</text>
          <rect x={barX + 20} y={barTop + barH - 30 - tH} width={50} height={tH}
            fill="var(--accent)" stroke="var(--ink)" strokeWidth={2} />
          <text className="ml-axis-text" x={barX + 45} y={barTop + barH - 14} textAnchor="middle">train</text>
          <text className="ml-axis-text" x={barX + 45} y={barTop + barH - 30 - tH - 6} textAnchor="middle"
            style={{ fontWeight: 700 }}>{trainLoss.toFixed(2)}</text>
          <rect x={barX + 100} y={barTop + barH - 30 - vH} width={50} height={vH}
            fill="#1c6dd0" stroke="var(--ink)" strokeWidth={2} />
          <text className="ml-axis-text" x={barX + 125} y={barTop + barH - 14} textAnchor="middle">val</text>
          <text className="ml-axis-text" x={barX + 125} y={barTop + barH - 30 - vH - 6} textAnchor="middle"
            style={{ fontWeight: 700 }}>{valLoss.toFixed(2)}</text>
        </svg>
      </div>
      <div className="metrics">
        <div className="metric"><div className="label">Train loss</div><div className="value">{trainLoss.toFixed(3)}</div></div>
        <div className="metric accent"><div className="label">Validation loss</div><div className="value">{valLoss.toFixed(3)}</div></div>
        <div className="metric"><div className="label">Sweet spot</div><div className="value">D = {bestD}</div></div>
      </div>
      <div className="callout">{exp}</div>
    </div>
  );
}
