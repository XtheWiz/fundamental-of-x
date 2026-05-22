import { useEffect, useRef, useState } from 'react';

const DNA_COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
const DNA_TO_RNA = { A: 'U', T: 'A', G: 'C', C: 'G' };
const COLOR = { A: '#e74c3c', T: '#3498db', G: '#f39c12', C: '#27ae60', U: '#9b59b6' };
const TEMPLATE = 'TACGCATGCAATCGGTACCAGTTACGCATGCAA';

export default function TranscriptionWidget() {
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(true);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setPos((p) => {
        const next = p + dt * 7;
        if (next >= TEMPLATE.length) { setPlaying(false); return TEMPLATE.length; }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const W = 700, H = 230, bw = 20, startX = 30;
  const dnaTopY = 60, dnaBotY = 100, rnaY = 180;
  const polX = startX + pos * bw;
  const done = Math.floor(pos);

  let exp;
  if (done === 0) exp = <><strong>Click Play.</strong> RNA polymerase will scan the template strand 3'→5' and build mRNA 5'→3' using A↔U, G↔C pairing.</>;
  else if (done >= TEMPLATE.length) {
    const rna = TEMPLATE.split('').map((b) => DNA_TO_RNA[b]).join('');
    exp = <><strong>Done.</strong> Full mRNA: <code style={{ background: 'var(--paper-deep)', padding: '0 0.3em' }}>{rna}</code>. Notice every T in the DNA became a U in the RNA.</>;
  }
  else exp = <><strong>{done} / {TEMPLATE.length}</strong> bases transcribed. Template (bottom) bases pair with RNA bases below — A→U, T→A, G→C, C→G.</>;

  return (
    <div className="widget">
      <div className="widget-title">RNA polymerase reads DNA, writes mRNA</div>
      <div className="controls">
        <button className="btn" onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button className="btn" onClick={() => { setPos(0); setPlaying(false); }}>Reset</button>
        <label style={{ marginLeft: '1rem' }}>Position:</label>
        <input type="range" min={0} max={TEMPLATE.length} step="0.1" value={pos}
          onChange={(e) => { setPlaying(false); setPos(+e.target.value); }}
          style={{ flex: 1, minWidth: 160 }} />
      </div>
      <div className="widget-stage" style={{ minHeight: 240 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <text x={20} y={20} style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>Template DNA</text>
          <text x={20} y={170} style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>mRNA being synthesized</text>

          {TEMPLATE.split('').map((tBase, i) => {
            const x = startX + i * bw;
            const coding = DNA_COMP[tBase];
            const dist = Math.abs(x - polX);
            const isOpen = dist < 30;
            const sep = isOpen ? (30 - dist) * 0.6 : 0;
            const rna = DNA_TO_RNA[tBase];
            return (
              <g key={i}>
                <rect x={x - 10} y={dnaTopY - sep - 10} width={20} height={20} fill={COLOR[coding]} stroke="var(--ink)" rx={3} opacity={0.55} />
                <text x={x} y={dnaTopY - sep + 5} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: 'white', opacity: 0.85 }}>{coding}</text>
                <rect x={x - 10} y={dnaBotY + sep - 10} width={20} height={20} fill={COLOR[tBase]} stroke="var(--ink)" strokeWidth={2} rx={3} />
                <text x={x} y={dnaBotY + sep + 5} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: 'white' }}>{tBase}</text>
                {i < Math.floor(pos) && (
                  <>
                    <rect x={x - 10} y={rnaY - 10} width={20} height={20} fill={COLOR[rna]} stroke="var(--ink)" strokeWidth={1.5} rx={3} />
                    <text x={x} y={rnaY + 5} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: 'white' }}>{rna}</text>
                  </>
                )}
              </g>
            );
          })}

          {pos < TEMPLATE.length && (
            <g>
              <rect x={polX - 30} y={dnaTopY - 35} width={60} height={80} rx={14} fill="#f4b8b8" stroke="var(--ink)" strokeWidth={2} />
              <text x={polX} y={dnaTopY - 18} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 11 }}>RNA pol</text>
              <text x={polX} y={dnaTopY - 5} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9 }}>⤵</text>
            </g>
          )}
        </svg>
      </div>
      <div className="callout">{exp}</div>
    </div>
  );
}
