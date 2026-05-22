import { useMemo, useState } from 'react';

const DATA = [
  { x: 1, y: 1.8 }, { x: 2, y: 3.6 }, { x: 3, y: 4.2 }, { x: 4, y: 6.5 },
  { x: 5, y: 7.0 }, { x: 6, y: 8.4 }, { x: 7, y: 9.1 }, { x: 8, y: 10.6 },
];
const mse = (w, b) => DATA.reduce((a, p) => a + ((w * p.x + b) - p.y) ** 2, 0) / DATA.length;
function optimal() {
  const n = DATA.length;
  const mx = DATA.reduce((a, p) => a + p.x, 0) / n;
  const my = DATA.reduce((a, p) => a + p.y, 0) / n;
  let num = 0, den = 0;
  DATA.forEach((p) => { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; });
  const w = num / den;
  return { w, b: my - w * mx, loss: mse(num / den, my - (num / den) * mx) };
}

const W = 480, H = 320, PAD = 36;
const XMIN = 0, XMAX = 10, YMIN = 0, YMAX = 12;
const xToPx = (x) => PAD + (x - XMIN) / (XMAX - XMIN) * (W - 2 * PAD);
const yToPx = (y) => H - PAD - (y - YMIN) / (YMAX - YMIN) * (H - 2 * PAD);

export default function LinearRegressionWidget() {
  const opt = useMemo(() => optimal(), []);
  const [w, setW] = useState(0.5);
  const [b, setB] = useState(1);
  const myLoss = mse(w, b);

  return (
    <div className="widget">
      <div className="widget-title">Adjust w and b — beat the optimal fit</div>
      <div className="controls">
        <label>w (slope): <strong>{w.toFixed(2)}</strong></label>
        <input type="range" min="-1" max="3" step="0.01" value={w} onChange={(e) => setW(+e.target.value)} style={{ flex: 1 }} />
      </div>
      <div className="controls">
        <label>b (intercept): <strong>{b.toFixed(2)}</strong></label>
        <input type="range" min="-3" max="6" step="0.01" value={b} onChange={(e) => setB(+e.target.value)} style={{ flex: 1 }} />
      </div>
      <div className="controls">
        <button className="btn btn-accent" onClick={() => { setW(opt.w); setB(opt.b); }}>Snap to optimal</button>
      </div>
      <div className="widget-stage" style={{ textAlign: 'center' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <rect className="ml-plot-bg" x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} />
          {[0, 2, 4, 6, 8, 10].map((i) => (
            <g key={i}>
              <line className="ml-grid" x1={xToPx(i)} y1={PAD} x2={xToPx(i)} y2={H - PAD} />
              <line className="ml-grid" x1={PAD} y1={yToPx(i)} x2={W - PAD} y2={yToPx(i)} />
              <text className="ml-axis-text" x={xToPx(i)} y={H - PAD + 14} textAnchor="middle">{i}</text>
              <text className="ml-axis-text" x={PAD - 6} y={yToPx(i) + 3} textAnchor="end">{i}</text>
            </g>
          ))}
          <line x1={xToPx(XMIN)} y1={yToPx(opt.w * XMIN + opt.b)} x2={xToPx(XMAX)} y2={yToPx(opt.w * XMAX + opt.b)}
            stroke="#2a8a3e" strokeWidth={2} strokeDasharray="4 3" opacity={0.7} />
          <line className="ml-line predicted" x1={xToPx(XMIN)} y1={yToPx(w * XMIN + b)} x2={xToPx(XMAX)} y2={yToPx(w * XMAX + b)} />
          {DATA.map((p, i) => {
            const yhat = w * p.x + b;
            return (
              <g key={i}>
                <line x1={xToPx(p.x)} y1={yToPx(p.y)} x2={xToPx(p.x)} y2={yToPx(yhat)}
                  stroke="var(--accent)" strokeWidth={1} strokeDasharray="3 2" opacity={0.5} />
                <circle className="ml-point-a" cx={xToPx(p.x)} cy={yToPx(p.y)} r={6} />
              </g>
            );
          })}
          <text className="ml-axis-text" x={W - PAD} y={PAD - 6} textAnchor="end" style={{ fill: 'var(--accent)' }}>your line</text>
          <text className="ml-axis-text" x={W - PAD} y={PAD + 6} textAnchor="end" style={{ fill: '#2a8a3e' }}>— optimal</text>
        </svg>
      </div>
      <div className="metrics">
        <div className="metric"><div className="label">Your loss</div><div className="value">{myLoss.toFixed(3)}</div></div>
        <div className="metric"><div className="label">Optimal loss</div><div className="value">{opt.loss.toFixed(3)}</div></div>
        <div className="metric accent"><div className="label">Δ from optimal</div><div className="value">+{(myLoss - opt.loss).toFixed(3)}</div></div>
      </div>
    </div>
  );
}
