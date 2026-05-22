import { useEffect, useMemo, useRef, useState } from 'react';

const COMPLEMENT = { A: 'T', T: 'A', G: 'C', C: 'G' };
const COLOR = { A: '#e74c3c', T: '#3498db', G: '#f39c12', C: '#27ae60' };

const clean = (s) => s.toUpperCase().replace(/[^ATGC]/g, '');

export default function HelixWidget() {
  const [seq, setSeq] = useState('ATGCGTACGTTAGCCATGGTC');
  const [playing, setPlaying] = useState(true);
  const [rotation, setRotation] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setRotation((r) => r + dt * 1.8);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const complement = useMemo(() => seq.split('').map((b) => COMPLEMENT[b] || '?').join(''), [seq]);
  const stats = useMemo(() => {
    const c = { A: 0, T: 0, G: 0, C: 0 };
    seq.split('').forEach((b) => { if (c[b] !== undefined) c[b]++; });
    return { ...c, gc: ((c.G + c.C) / Math.max(1, seq.length) * 100).toFixed(0) };
  }, [seq]);

  const W = 600, H = 260, cx = W / 2;
  const n = seq.length;
  const step = (H - 30) / Math.max(1, n - 1);
  const r = 50;

  let backbone1 = '', backbone2 = '';
  const bases = [];
  for (let i = 0; i < n; i++) {
    const y = 15 + i * step;
    const ang = (i / 10) * Math.PI * 2 + rotation;
    const s = Math.sin(ang);
    const z = Math.cos(ang);
    const x1 = cx + s * r;
    const x2 = cx - s * r;
    backbone1 += (i === 0 ? 'M' : 'L') + `${x1},${y} `;
    backbone2 += (i === 0 ? 'M' : 'L') + `${x2},${y} `;
    const b1 = seq[i];
    const b2 = COMPLEMENT[b1] || '?';
    const opacity = 0.4 + 0.6 * ((z + 1) / 2);
    bases.push({ y, x1, x2, b1, b2, opacity });
  }

  return (
    <div className="widget">
      <div className="widget-title">Edit a strand, watch the helix</div>
      <div className="controls">
        <label>Strand 5'→3':</label>
        <input
          type="text"
          value={seq}
          maxLength={40}
          onChange={(e) => setSeq(clean(e.target.value))}
          style={{ flex: 1, minWidth: 200, fontFamily: 'var(--font-mono)', fontSize: '0.95rem', letterSpacing: '0.15em', padding: '0.45em 0.7em', border: '2px solid var(--ink)', borderRadius: 'var(--radius)', background: 'var(--paper-deep)' }}
        />
        <button className="btn" onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Spin'}</button>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', margin: '0.3rem 0' }}>
        Complement 3'→5': <span style={{ letterSpacing: '0.15em', color: 'var(--ink)', fontWeight: 600 }}>{complement}</span>
      </div>
      <div className="widget-stage" style={{ minHeight: 280 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <path d={backbone1} fill="none" stroke="var(--ink)" strokeWidth={2.5} />
          <path d={backbone2} fill="none" stroke="var(--ink-soft)" strokeWidth={2.5} />
          {bases.map((b, i) => (
            <g key={i} opacity={b.opacity}>
              <line x1={b.x1} y1={b.y} x2={b.x2} y2={b.y} stroke="var(--ink-soft)" strokeWidth={1.2} opacity={0.6} />
              <rect x={b.x1 - 9} y={b.y - 9} width={18} height={18} fill={COLOR[b.b1]} stroke="var(--ink)" strokeWidth={1.5} rx={3} />
              <text x={b.x1} y={b.y + 4} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: 'white' }}>{b.b1}</text>
              <rect x={b.x2 - 9} y={b.y - 9} width={18} height={18} fill={COLOR[b.b2]} stroke="var(--ink)" strokeWidth={1.5} rx={3} />
              <text x={b.x2} y={b.y + 4} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: 'white' }}>{b.b2}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="callout">
        <strong>{seq.length} bp.</strong> A: {stats.A}, T: {stats.T}, G: {stats.G}, C: {stats.C}.{' '}
        <strong>GC content: {stats.gc}%</strong> — higher GC means tighter binding and higher melting temperature.
      </div>
    </div>
  );
}
