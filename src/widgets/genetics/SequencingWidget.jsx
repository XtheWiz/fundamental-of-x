import { useMemo, useState } from 'react';

const COLOR = { A: '#e74c3c', T: '#3498db', G: '#f39c12', C: '#27ae60' };
const REF = 'ATGCATGCAATTGGCCAAGTAGCCATGGTTAGCCAAGTAGCCATGG';

const TECHS = {
  sanger:   { name: 'Sanger',   readLen: 28, errRate: 0.001, readCount: 2,   color: '#2b6cb0' },
  illumina: { name: 'Illumina', readLen: 10, errRate: 0.005, readCount: 12,  color: '#388e3c' },
  nanopore: { name: 'Nanopore', readLen: 40, errRate: 0.08,  readCount: 3,   color: '#d62828' },
};

const COMPARISON = [
  { tech: 'Sanger',   length: '~1 kb',    acc: '99.9%',     cost: '$$$', through: 'low',  use: 'gold standard, single-gene confirmation' },
  { tech: 'Illumina', length: '50–300 bp', acc: '99.9%',     cost: '$',   through: 'huge', use: 'WGS, RNA-seq, exome — most production work' },
  { tech: 'PacBio',   length: '10–25 kb',  acc: '99% (HiFi)', cost: '$$',  through: 'med',  use: 'de novo assembly, structural variants' },
  { tech: 'Nanopore', length: '10kb–1Mb',  acc: '95–99%',    cost: '$$',  through: 'med',  use: 'field sequencing, in-vivo modifications' },
];

function randIntFactory(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s; };
}
function generateReads(tech, refLen, rngSeed) {
  const rand = randIntFactory(rngSeed);
  const reads = [];
  for (let i = 0; i < tech.readCount; i++) {
    const start = Math.floor((rand() / 4294967296) * (refLen - tech.readLen));
    reads.push({ start, len: Math.min(tech.readLen, refLen - start) });
  }
  return reads;
}

const NOTES = {
  sanger:   <><strong>Sanger.</strong> Long, very accurate reads. The expensive workhorse for confirming clinical findings.</>,
  illumina: <><strong>Illumina.</strong> Many short reads (~billions in reality). 99.9% accurate. Stacking them gives "coverage" — every base read 30–100× over.</>,
  nanopore: <><strong>Nanopore.</strong> Fewer but very long reads. Higher error rate (red dots) but spans repeats and structural variants short reads can't resolve.</>,
};

export default function SequencingWidget() {
  const [pick, setPick] = useState('illumina');
  const tech = TECHS[pick];
  const reads = useMemo(() => generateReads(tech, REF.length, 42), [tech]);

  const W = 700, H = 230, bw = 13, startX = 20, refY = 40;

  return (
    <div className="widget">
      <div className="widget-title">Reads vs reference — coverage view</div>
      <div className="controls">
        {Object.keys(TECHS).map((k) => (
          <button key={k} className="btn" onClick={() => setPick(k)}>{TECHS[k].name}</button>
        ))}
      </div>
      <div className="widget-stage" style={{ minHeight: 240 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <text x={20} y={20} style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>Reference</text>
          {REF.split('').map((ch, i) => {
            const x = startX + i * bw;
            return (
              <g key={i}>
                <rect x={x - 6} y={refY - 7} width={12} height={14} fill={COLOR[ch]} stroke="var(--ink)" strokeWidth={1} />
                <text x={x} y={refY + 3} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'white', fontWeight: 700 }}>{ch}</text>
              </g>
            );
          })}
          <text x={20} y={70} style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{tech.name} reads</text>
          {reads.map((r, idx) => {
            const y = 90 + idx * 12;
            const x = startX + r.start * bw - 6;
            const w = r.len * bw;
            const errs = Math.round(tech.errRate * r.len * (1 + Math.sin(idx * 7)));
            return (
              <g key={idx}>
                <rect x={x} y={y - 4} width={w} height={8} fill={tech.color} stroke="var(--ink)" strokeWidth={1} opacity={0.85} />
                {Array.from({ length: errs }).map((_, e) => {
                  const ex = x + ((e * 17 + idx * 3) % w);
                  return <circle key={e} cx={ex} cy={y} r={2.5} fill="var(--accent)" stroke="var(--ink)" strokeWidth={0.5} />;
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="callout">{NOTES[pick]}</div>

      <div style={{ marginTop: '1.2rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.3rem' }}>All four side by side</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--paper-deep)' }}>
                {['Tech', 'Read length', 'Accuracy', 'Cost / Gb', 'Throughput', 'Typical use'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.4rem 0.6rem', border: '1.5px solid var(--ink)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((c) => (
                <tr key={c.tech}>
                  <td style={{ padding: '0.4rem 0.6rem', border: '1.5px solid var(--ink)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.tech}</td>
                  <td style={{ padding: '0.4rem 0.6rem', border: '1.5px solid var(--ink)', fontFamily: 'var(--font-mono)' }}>{c.length}</td>
                  <td style={{ padding: '0.4rem 0.6rem', border: '1.5px solid var(--ink)', fontFamily: 'var(--font-mono)' }}>{c.acc}</td>
                  <td style={{ padding: '0.4rem 0.6rem', border: '1.5px solid var(--ink)', fontFamily: 'var(--font-mono)' }}>{c.cost}</td>
                  <td style={{ padding: '0.4rem 0.6rem', border: '1.5px solid var(--ink)', fontFamily: 'var(--font-mono)' }}>{c.through}</td>
                  <td style={{ padding: '0.4rem 0.6rem', border: '1.5px solid var(--ink)' }}>{c.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
