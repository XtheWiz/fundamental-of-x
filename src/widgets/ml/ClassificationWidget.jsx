import { useMemo, useState } from 'react';

const W = 480, H = 360, PAD = 36;
const XMIN = 0, XMAX = 10, YMIN = 0, YMAX = 10;
const xToPx = (x) => PAD + (x - XMIN) / (XMAX - XMIN) * (W - 2 * PAD);
const yToPx = (y) => H - PAD - (y - YMIN) / (YMAX - YMIN) * (H - 2 * PAD);
const pxToX = (px) => XMIN + (px - PAD) / (W - 2 * PAD) * (XMAX - XMIN);
const pxToY = (py) => YMIN + (H - PAD - py) / (H - 2 * PAD) * (YMAX - YMIN);

const sigmoid = (z) => 1 / (1 + Math.exp(-Math.max(-50, Math.min(50, z))));

function train(points, w, b, iter = 300, lr = 0.1) {
  let [w0, w1] = w; let b0 = b;
  for (let s = 0; s < iter; s++) {
    let gw0 = 0, gw1 = 0, gb = 0;
    points.forEach((p) => {
      const z = w0 * p.x + w1 * p.y + b0;
      const err = sigmoid(z) - p.c;
      gw0 += err * p.x; gw1 += err * p.y; gb += err;
    });
    const n = Math.max(1, points.length);
    w0 -= lr * gw0 / n; w1 -= lr * gw1 / n; b0 -= lr * gb / n;
  }
  return { w: [w0, w1], b: b0 };
}

const INITIAL = [
  { x: 2, y: 2, c: 0 }, { x: 3, y: 3, c: 0 }, { x: 2, y: 4, c: 0 },
  { x: 7, y: 7, c: 1 }, { x: 8, y: 6, c: 1 }, { x: 7, y: 8, c: 1 },
];

export default function ClassificationWidget() {
  const [points, setPoints] = useState(INITIAL);
  const [addClass, setAddClass] = useState(0);
  const [model, setModel] = useState({ w: [0.1, 0.1], b: 0 });

  const onClick = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (W / rect.width);
    const sy = (e.clientY - rect.top) * (H / rect.height);
    if (sx < PAD || sx > W - PAD || sy < PAD || sy > H - PAD) return;
    const next = [...points, { x: pxToX(sx), y: pxToY(sy), c: addClass }];
    setPoints(next);
    setModel(train(next, model.w, model.b));
  };

  const cellSize = 16;
  const cells = useMemo(() => {
    const out = [];
    for (let px = PAD; px < W - PAD; px += cellSize) {
      for (let py = PAD; py < H - PAD; py += cellSize) {
        const x = pxToX(px + cellSize / 2), y = pxToY(py + cellSize / 2);
        const z = model.w[0] * x + model.w[1] * y + model.b;
        const p = sigmoid(z);
        const color = p > 0.5
          ? `rgba(28, 109, 208, ${(p - 0.5) * 0.5})`
          : `rgba(214, 40, 40, ${(0.5 - p) * 0.5})`;
        out.push({ px, py, color });
      }
    }
    return out;
  }, [model]);

  let line = null;
  if (Math.abs(model.w[1]) > 1e-6) {
    const yL = -(model.w[0] * XMIN + model.b) / model.w[1];
    const yR = -(model.w[0] * XMAX + model.b) / model.w[1];
    line = { x1: xToPx(XMIN), y1: yToPx(yL), x2: xToPx(XMAX), y2: yToPx(yR) };
  }

  return (
    <div className="widget">
      <div className="widget-title">Click the plot to add points</div>
      <div className="controls">
        <label>Adding class:</label>
        <div className="pill-group">
          <input type="radio" name="cl-c" id="cl-a" value="0" checked={addClass === 0} onChange={() => setAddClass(0)} />
          <label htmlFor="cl-a">Class A (red)</label>
          <input type="radio" name="cl-c" id="cl-b" value="1" checked={addClass === 1} onChange={() => setAddClass(1)} />
          <label htmlFor="cl-b">Class B (blue)</label>
        </div>
        <button className="btn btn-accent" onClick={() => setModel(train(points, model.w, model.b))}>Train (300 steps)</button>
        <button className="btn btn-ghost" onClick={() => { setPoints([]); setModel({ w: [0.1, 0.1], b: 0 }); }}>Reset</button>
      </div>
      <div className="widget-stage" style={{ textAlign: 'center' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, cursor: 'crosshair' }} onClick={onClick}>
          <rect className="ml-plot-bg" x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} />
          {cells.map((c, i) => (
            <rect key={i} x={c.px} y={c.py} width={cellSize} height={cellSize} fill={c.color} />
          ))}
          {[0, 2, 4, 6, 8, 10].map((i) => (
            <g key={i}>
              <text className="ml-axis-text" x={xToPx(i)} y={H - PAD + 14} textAnchor="middle">{i}</text>
              <text className="ml-axis-text" x={PAD - 6} y={yToPx(i) + 3} textAnchor="end">{i}</text>
            </g>
          ))}
          {line && <line className="ml-line" x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />}
          {points.map((p, i) => (
            <circle key={i} className={p.c === 0 ? 'ml-point-a' : 'ml-point-b'} cx={xToPx(p.x)} cy={yToPx(p.y)} r={7} />
          ))}
        </svg>
      </div>
      <div className="callout">
        Decision boundary is where the model's predicted probability crosses 0.5 — visualised as the line. The shaded regions show which class the model would predict at every point.
      </div>
    </div>
  );
}
