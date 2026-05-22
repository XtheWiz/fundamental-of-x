import { useState } from 'react';

const ALGS = [
  { name: 'O(1)',      fn: () => 1,                            color: '#2a8a3e' },
  { name: 'O(log n)',  fn: (n) => Math.log2(Math.max(2, n)),   color: '#1c6dd0' },
  { name: 'O(n)',      fn: (n) => n,                           color: '#f59e0b' },
  { name: 'O(n log n)',fn: (n) => n * Math.log2(Math.max(2, n)), color: '#7e57c2' },
  { name: 'O(n²)',     fn: (n) => n * n,                       color: '#d62828' },
];

const fmt = (v) => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M'
                : v >= 1e3 ? (v / 1e3).toFixed(1) + 'k'
                : v.toFixed(0);

export default function BigOWidget() {
  const [n, setN] = useState(100);
  const values = ALGS.map((a) => ({ ...a, v: a.fn(n) }));
  const maxV = Math.max(...values.map((x) => x.v), 10);

  return (
    <div className="widget">
      <div className="widget-title">Same N, very different runtimes</div>
      <div className="controls">
        <label>Input size N: <strong>{n}</strong></label>
        <input type="range" min="1" max="10000" step="1" value={n}
          onChange={(e) => setN(+e.target.value)} style={{ flex: 1 }} />
      </div>
      <div className="widget-stage" style={{ minHeight: 260 }}>
        <svg viewBox="0 0 600 240" width="100%" style={{ maxWidth: 600 }}>
          <rect className="ml-plot-bg" x={20} y={20} width={560} height={200} />
          {values.map((a, i) => {
            const barW = 80, gap = 24;
            const x = 60 + i * (barW + gap);
            const h = Math.min(180, (a.v / maxV) * 180);
            const y = 200 - h;
            return (
              <g key={a.name}>
                <rect x={x} y={y} width={barW} height={h} fill={a.color}
                  stroke="var(--ink)" strokeWidth={2}
                  style={{ transition: 'all 0.25s ease' }} />
                <text x={x + barW / 2} y={216} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>{a.name}</text>
                <text x={x + barW / 2} y={y - 6} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: a.color }}>
                  {fmt(a.v)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="callout">
        At N={n}: an O(n²) operation does <strong>{fmt(n * n)}</strong> steps; O(n log n) does <strong>{fmt(n * Math.log2(Math.max(2, n)))}</strong>; O(log n) does <strong>{fmt(Math.log2(Math.max(2, n)))}</strong>. Push the slider — the bars tell the story Big-O is trying to.
      </div>
    </div>
  );
}
