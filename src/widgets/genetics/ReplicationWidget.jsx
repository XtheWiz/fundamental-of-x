import { useEffect, useRef, useState } from 'react';

const COMPLEMENT = { A: 'T', T: 'A', G: 'C', C: 'G' };
const COLOR = { A: '#e74c3c', T: '#3498db', G: '#f39c12', C: '#27ae60' };
const TEMPLATE = 'ATGCGTACGTTAGCCATGGTCAATGCGTACGTTAGCC';

export default function ReplicationWidget() {
  const [forkPos, setForkPos] = useState(0);
  const [playing, setPlaying] = useState(true);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setForkPos((p) => {
        const next = p + dt * 6;
        if (next >= TEMPLATE.length) {
          setPlaying(false);
          return TEMPLATE.length;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const reset = () => { setForkPos(0); setPlaying(false); };

  const W = 680, H = 230;
  const bw = 18;
  const startX = 30;
  const topY = 50, botY = 130;
  const forkX = startX + forkPos * bw;
  const done = Math.floor(forkPos);

  let exp;
  if (done === 0) exp = <>Press <strong>Play</strong>. Helicase will unwind the helix; polymerase will fill in each new strand from the templates.</>;
  else if (done >= TEMPLATE.length) exp = <><strong>Complete.</strong> Two daughter duplexes, each containing one original (black) and one new (red) strand. Semiconservative replication — that's the principle Meselson &amp; Stahl proved in 1958.</>;
  else exp = <><strong>{done} / {TEMPLATE.length}</strong> base pairs replicated. The fork is mid-genome. Note both daughter duplexes contain one old strand and one new.</>;

  return (
    <div className="widget">
      <div className="widget-title">A replication fork in motion</div>
      <div className="controls">
        <button className="btn" onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button className="btn" onClick={reset}>Reset</button>
        <label style={{ marginLeft: '1rem' }}>Position:</label>
        <input type="range" min={0} max={TEMPLATE.length} step="0.1" value={forkPos}
          onChange={(e) => { setPlaying(false); setForkPos(+e.target.value); }}
          style={{ flex: 1, minWidth: 160 }} />
      </div>
      <div className="widget-stage" style={{ minHeight: 240 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <text x={20} y={20} style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>Original duplex (template)</text>
          <text x={20} y={topY - 5} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>5'</text>
          <text x={W - 22} y={topY - 5} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>3'</text>

          {TEMPLATE.split('').map((topBase, i) => {
            const x = startX + i * bw;
            const botBase = COMPLEMENT[topBase];
            if (i < Math.floor(forkPos)) {
              const newComp = COMPLEMENT[topBase];
              const newTop = COMPLEMENT[botBase];
              return (
                <g key={i}>
                  <rect x={x - 9} y={10} width={18} height={18} fill={COLOR[topBase]} stroke="var(--ink)" rx={3} />
                  <text x={x} y={24} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: 'white' }}>{topBase}</text>
                  <line x1={x} y1={30} x2={x} y2={42} stroke="var(--accent)" strokeWidth={1.2} strokeDasharray="2,2" />
                  <rect x={x - 9} y={42} width={18} height={18} fill={COLOR[newComp]} stroke="var(--accent)" strokeWidth={2} rx={3} />
                  <text x={x} y={56} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: 'white' }}>{newComp}</text>
                  <rect x={x - 9} y={130} width={18} height={18} fill={COLOR[newTop]} stroke="var(--accent)" strokeWidth={2} rx={3} />
                  <text x={x} y={144} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: 'white' }}>{newTop}</text>
                  <line x1={x} y1={148} x2={x} y2={160} stroke="var(--accent)" strokeWidth={1.2} strokeDasharray="2,2" />
                  <rect x={x - 9} y={160} width={18} height={18} fill={COLOR[botBase]} stroke="var(--ink)" rx={3} />
                  <text x={x} y={174} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: 'white' }}>{botBase}</text>
                </g>
              );
            }
            const spread = Math.max(0, 10 - Math.abs(x - forkX) / 4);
            return (
              <g key={i}>
                <rect x={x - 9} y={topY - spread} width={18} height={18} fill={COLOR[topBase]} stroke="var(--ink)" rx={3} />
                <text x={x} y={topY - spread + 14} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: 'white' }}>{topBase}</text>
                <rect x={x - 9} y={botY + spread} width={18} height={18} fill={COLOR[botBase]} stroke="var(--ink)" rx={3} />
                <text x={x} y={botY + spread + 14} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: 'white' }}>{botBase}</text>
                {i >= Math.floor(forkPos) && <line x1={x} y1={topY + 18 - spread} x2={x} y2={botY + spread} stroke="var(--ink-faint)" strokeWidth={1} />}
              </g>
            );
          })}

          {forkPos < TEMPLATE.length && (
            <g>
              <circle cx={forkX} cy={(topY + botY) / 2 + 9} r={14} fill="#f4b8b8" stroke="var(--ink)" strokeWidth={2} />
              <text x={forkX} y={(topY + botY) / 2 + 13} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 10 }}>helicase</text>
            </g>
          )}

          <g transform={`translate(20,${H - 22})`}>
            <rect x={0} y={0} width={14} height={14} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} />
            <text x={20} y={11} style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>old strand</text>
            <rect x={120} y={0} width={14} height={14} fill="var(--paper)" stroke="var(--accent)" strokeWidth={2} />
            <text x={140} y={11} style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>newly synthesized</text>
          </g>
        </svg>
      </div>
      <div className="callout">{exp}</div>
    </div>
  );
}
