import { useRef, useState } from 'react';

const INITIAL = [
  { x: 1.0, y: 2.2 }, { x: 2.0, y: 3.5 }, { x: 3.5, y: 4.1 },
  { x: 5.0, y: 6.8 }, { x: 6.0, y: 7.0 }, { x: 7.0, y: 8.5 },
];

const W = 480, H = 320, PAD = 36;
const XMIN = 0, XMAX = 10, YMIN = 0, YMAX = 10;
const xToPx = (x) => PAD + (x - XMIN) / (XMAX - XMIN) * (W - 2 * PAD);
const yToPx = (y) => H - PAD - (y - YMIN) / (YMAX - YMIN) * (H - 2 * PAD);
const pxToX = (px) => XMIN + (px - PAD) / (W - 2 * PAD) * (XMAX - XMIN);
const pxToY = (py) => YMIN + (H - PAD - py) / (H - 2 * PAD) * (YMAX - YMIN);

function fit(points) {
  const n = points.length;
  const mx = points.reduce((a, p) => a + p.x, 0) / n;
  const my = points.reduce((a, p) => a + p.y, 0) / n;
  let num = 0, den = 0;
  points.forEach((p) => { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; });
  const m = den === 0 ? 0 : num / den;
  const b = my - m * mx;
  const mse = points.reduce((a, p) => a + ((m * p.x + b) - p.y) ** 2, 0) / n;
  return { m, b, mse };
}

export default function WhatIsLearningWidget() {
  const [points, setPoints] = useState(INITIAL);
  const dragRef = useRef(null);
  const svgRef = useRef(null);
  const { m, b, mse } = fit(points);

  const movePoint = (e) => {
    if (dragRef.current === null) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (W / rect.width);
    const sy = (e.clientY - rect.top) * (H / rect.height);
    let x = pxToX(sx), y = pxToY(sy);
    x = Math.max(XMIN + 0.1, Math.min(XMAX - 0.1, x));
    y = Math.max(YMIN + 0.1, Math.min(YMAX - 0.1, y));
    setPoints((ps) => ps.map((p, i) => (i === dragRef.current ? { x, y } : p)));
  };

  return (
    <div className="widget">
      <div className="widget-title">Best-fit line (drag points)</div>
      <p className="widget-hint">Drag any orange point. The line — y = m·x + b — re-fits to minimise squared error.</p>
      <div className="widget-stage" style={{ textAlign: 'center' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}
          onMouseMove={movePoint}
          onMouseUp={() => { dragRef.current = null; }}
          onMouseLeave={() => { dragRef.current = null; }}
        >
          <rect className="ml-plot-bg" x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} />
          {[0, 2, 4, 6, 8, 10].map((i) => (
            <g key={i}>
              <line className="ml-grid" x1={xToPx(i)} y1={PAD} x2={xToPx(i)} y2={H - PAD} />
              <line className="ml-grid" x1={PAD} y1={yToPx(i)} x2={W - PAD} y2={yToPx(i)} />
              <text className="ml-axis-text" x={xToPx(i)} y={H - PAD + 14} textAnchor="middle">{i}</text>
              <text className="ml-axis-text" x={PAD - 6} y={yToPx(i) + 3} textAnchor="end">{i}</text>
            </g>
          ))}
          <line className="ml-line predicted" x1={xToPx(XMIN)} y1={yToPx(m * XMIN + b)} x2={xToPx(XMAX)} y2={yToPx(m * XMAX + b)} />
          {points.map((p, i) => {
            const yhat = m * p.x + b;
            return (
              <g key={i}>
                <line x1={xToPx(p.x)} y1={yToPx(p.y)} x2={xToPx(p.x)} y2={yToPx(yhat)}
                  stroke="var(--accent)" strokeWidth={1} strokeDasharray="3 2" opacity={0.5} />
                <circle className="ml-point-a" cx={xToPx(p.x)} cy={yToPx(p.y)} r={8}
                  style={{ cursor: 'grab' }}
                  onMouseDown={() => { dragRef.current = i; }} />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="metrics">
        <div className="metric"><div className="label">Slope (m)</div><div className="value">{m.toFixed(3)}</div></div>
        <div className="metric"><div className="label">Intercept (b)</div><div className="value">{b.toFixed(3)}</div></div>
        <div className="metric accent"><div className="label">MSE (loss)</div><div className="value">{mse.toFixed(3)}</div></div>
      </div>
      <div className="callout">
        The model is <code>ŷ = m·x + b</code>. The loss is the average of (ŷ − y)². The optimiser (analytic least squares) picks m and b to minimise it. Drag points to change the data and watch the fit follow.
      </div>
    </div>
  );
}
