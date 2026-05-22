import { useMemo, useState } from 'react';

function editDistanceTable(a, b) {
  const n = a.length, m = b.length;
  const t = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) t[i][0] = i;
  for (let j = 0; j <= m; j++) t[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) t[i][j] = t[i - 1][j - 1];
      else t[i][j] = 1 + Math.min(t[i - 1][j], t[i][j - 1], t[i - 1][j - 1]);
    }
  }
  return t;
}

const clean = (s) => s.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);

export default function DPWidget() {
  const [a, setA] = useState('KITTEN');
  const [b, setB] = useState('SITTING');
  const t = useMemo(() => editDistanceTable(a, b), [a, b]);
  const [reveal, setReveal] = useState((a.length + 1) * (b.length + 1));

  const totalCells = (a.length + 1) * (b.length + 1);
  const cellSize = 36, padL = 60, padT = 50;
  const W = padL + (b.length + 1) * cellSize + 20;
  const H = padT + (a.length + 1) * cellSize + 30;

  return (
    <div className="widget">
      <div className="widget-title">Edit distance — fill the table cell by cell</div>
      <div className="controls">
        <label>A:</label>
        <input value={a} onChange={(e) => { setA(clean(e.target.value)); setReveal(totalCells); }}
          style={{ width: 100, fontFamily: 'var(--font-mono)', padding: '0.3em 0.5em', border: '2px solid var(--ink)', borderRadius: 'var(--radius)' }} />
        <label>B:</label>
        <input value={b} onChange={(e) => { setB(clean(e.target.value)); setReveal(totalCells); }}
          style={{ width: 100, fontFamily: 'var(--font-mono)', padding: '0.3em 0.5em', border: '2px solid var(--ink)', borderRadius: 'var(--radius)' }} />
      </div>
      <div className="controls">
        <button className="btn btn-accent" onClick={() => setReveal((r) => Math.min(totalCells, r + 1))}>Reveal next cell</button>
        <button className="btn" onClick={() => setReveal(totalCells)}>Reveal all</button>
        <button className="btn btn-ghost" onClick={() => setReveal(a.length + b.length + 1)}>Reset</button>
      </div>
      <div className="widget-stage" style={{ minHeight: 280 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <text x={padL + cellSize / 2} y={padT - 30} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>·</text>
          {b.split('').map((ch, j) => (
            <text key={`b-${j}`} x={padL + (j + 1) * cellSize + cellSize / 2} y={padT - 30} textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>{ch}</text>
          ))}
          <text x={padL - 30} y={padT + cellSize / 2 + 4} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>·</text>
          {a.split('').map((ch, i) => (
            <text key={`a-${i}`} x={padL - 30} y={padT + (i + 1) * cellSize + cellSize / 2 + 4} textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>{ch}</text>
          ))}
          {Array.from({ length: a.length + 1 }).map((_, i) =>
            Array.from({ length: b.length + 1 }).map((__, j) => {
              const idx = i * (b.length + 1) + j;
              const shown = idx < reveal;
              const isAnswer = i === a.length && j === b.length && shown;
              const x = padL + j * cellSize, y = padT + i * cellSize;
              return (
                <g key={`c-${i}-${j}`}>
                  <rect x={x} y={y} width={cellSize} height={cellSize}
                    fill={isAnswer ? 'var(--accent-soft)' : shown ? 'var(--paper)' : 'var(--paper-deep)'}
                    stroke="var(--ink)" strokeWidth={1} />
                  {shown && (
                    <text x={x + cellSize / 2} y={y + cellSize / 2 + 4} textAnchor="middle"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: isAnswer ? 700 : 400 }}>
                      {t[i][j]}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>
      <div className="callout">
        Edit distance: <strong>{t[a.length][b.length]}</strong>. Each cell is <code>min(top+1, left+1, diag + (chars match ? 0 : 1))</code> — insertion, deletion, or substitution. The bottom-right cell is the answer.
      </div>
    </div>
  );
}
