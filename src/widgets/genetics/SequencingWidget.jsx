import { useMemo, useState } from 'react';

// Pedagogical goal: let the learner *feel* the trade-off between coverage,
// error rate, and read length. The same reference is "sequenced" by simulated
// reads — each read is a substring with random substitutions injected. A
// majority-vote consensus is computed per base; accuracy collapses when
// coverage is low (few reads → ties → wrong base wins) or when error rate
// climbs (noise drowns the signal). Switching tech preset shows how Nanopore's
// long reads survive low coverage that would kill Illumina, but its higher
// error rate punishes the same accuracy metric.

const REF_DEFAULT = 'ATGCATGCAATTGGCCAAGTAGCCATGGTTAGCCAAGTAGCCATGGTTAGCCAAGTAGCC';
const BASES = ['A', 'T', 'G', 'C'];
const COLOR = { A: '#e74c3c', T: '#3498db', G: '#f39c12', C: '#27ae60' };

const TECHS = {
  sanger:   { name: 'Sanger',   readLen: 50, errRate: 0.001, coverage: 4,  color: '#2b6cb0' },
  illumina: { name: 'Illumina', readLen: 15, errRate: 0.005, coverage: 20, color: '#388e3c' },
  nanopore: { name: 'Nanopore', readLen: 55, errRate: 0.10,  coverage: 8,  color: '#d62828' },
};

// LCG — stable & deterministic. We want reproducibility while the learner
// drags sliders so the picture only shifts in the dimension they changed.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function clampReadLen(len, refLen) {
  return Math.max(4, Math.min(len, refLen));
}

// Generate reads — each is { start, bases[] } where bases has substitutions
// mixed in at the requested error rate.
function generateReads({ ref, readLen, errRate, coverage, seed }) {
  const refLen = ref.length;
  const rl = clampReadLen(readLen, refLen);
  // Number of reads ≈ coverage * refLen / readLen. This is the textbook
  // relationship — total bases sequenced divided by genome size.
  const nReads = Math.max(1, Math.round((coverage * refLen) / rl));
  const r = rng(seed);
  const reads = [];
  for (let i = 0; i < nReads; i++) {
    const maxStart = Math.max(0, refLen - rl);
    const start = Math.floor(r() * (maxStart + 1));
    const bases = new Array(rl);
    for (let j = 0; j < rl; j++) {
      const trueBase = ref[start + j];
      if (r() < errRate) {
        // Pick a different base — real errors don't usually preserve identity.
        let b = BASES[Math.floor(r() * 4)];
        if (b === trueBase) b = BASES[(BASES.indexOf(trueBase) + 1) % 4];
        bases[j] = b;
      } else {
        bases[j] = trueBase;
      }
    }
    reads.push({ start, bases });
  }
  return reads;
}

function computeConsensus(reads, ref) {
  const refLen = ref.length;
  const depth = new Array(refLen).fill(0);
  const consensus = new Array(refLen).fill('.');
  for (let i = 0; i < refLen; i++) {
    const counts = { A: 0, T: 0, G: 0, C: 0 };
    for (const rd of reads) {
      const j = i - rd.start;
      if (j >= 0 && j < rd.bases.length) {
        counts[rd.bases[j]]++;
        depth[i]++;
      }
    }
    if (depth[i] === 0) { consensus[i] = '.'; continue; }
    let best = 'A', bestN = -1;
    for (const b of BASES) {
      if (counts[b] > bestN) { bestN = counts[b]; best = b; }
    }
    consensus[i] = best;
  }
  let correct = 0, covered = 0;
  for (let i = 0; i < refLen; i++) {
    if (depth[i] > 0) {
      covered++;
      if (consensus[i] === ref[i]) correct++;
    }
  }
  const meanDepth = depth.reduce((a, b) => a + b, 0) / refLen;
  return {
    consensus,
    depth,
    meanDepth,
    accuracy: covered ? correct / covered : 0,
    coveredFrac: covered / refLen,
  };
}

const NOTES = {
  sanger:   <><strong>Sanger.</strong> Long, very accurate reads — but few of them and expensive. Try dropping coverage to 1×: still good, because every read is almost perfect.</>,
  illumina: <><strong>Illumina.</strong> Short but cheap and accurate. The whole game is stacking depth — push coverage up to see how many noisy short reads vote down occasional errors.</>,
  nanopore: <><strong>Nanopore.</strong> Long reads, but every read is noisy. Crank the error slider — even at 10× coverage the consensus starts losing bases. Real labs combine this with Illumina.</>,
};

export default function SequencingWidget() {
  const [tech, setTech] = useState('illumina');
  const [coverage, setCoverage] = useState(TECHS.illumina.coverage);
  const [errRate, setErrRate] = useState(TECHS.illumina.errRate);
  const [readLen, setReadLen] = useState(TECHS.illumina.readLen);
  const [ref, setRef] = useState(REF_DEFAULT);
  const [seed, setSeed] = useState(42);

  function pickTech(k) {
    const t = TECHS[k];
    setTech(k);
    setCoverage(t.coverage);
    setErrRate(t.errRate);
    setReadLen(t.readLen);
    setSeed((s) => s + 1);
  }

  const refClean = (ref || '').toUpperCase().replace(/[^ATGC]/g, '').slice(0, 80) || REF_DEFAULT;

  const reads = useMemo(
    () => generateReads({ ref: refClean, readLen, errRate, coverage, seed }),
    [refClean, readLen, errRate, coverage, seed],
  );
  const { consensus, depth, meanDepth, accuracy } = useMemo(
    () => computeConsensus(reads, refClean),
    [reads, refClean],
  );

  const cellW = Math.min(18, Math.max(10, Math.floor(720 / refClean.length)));
  const stageW = Math.max(360, refClean.length * cellW + 40);
  const startX = 20;

  // Cap rendered reads to keep DOM light at high coverage.
  const MAX_RENDER = 80;
  const renderReads = reads.slice(0, MAX_RENDER);
  const truncated = reads.length - renderReads.length;

  const refY = 30;
  const readsTopY = 60;
  const rowH = 11;
  const readsBottomY = readsTopY + renderReads.length * rowH;
  const consensusY = readsBottomY + 24;
  const totalH = consensusY + 50;

  const techColor = TECHS[tech].color;

  return (
    <div className="widget">
      <div className="widget-title">Sequencing — coverage, error, and consensus</div>

      <div className="controls" style={{ flexWrap: 'wrap', gap: '0.8rem', alignItems: 'flex-start' }}>
        <div className="pill-group" role="radiogroup" aria-label="Technology">
          {Object.entries(TECHS).map(([k, v]) => (
            <span key={k}>
              <input
                type="radio"
                id={`tech-${k}`}
                name="seq-tech"
                checked={tech === k}
                onChange={() => pickTech(k)}
              />
              <label htmlFor={`tech-${k}`}>{v.name}</label>
            </span>
          ))}
        </div>
        <button className="btn btn-accent" onClick={() => setSeed((s) => s + 1)}>
          Regenerate reads
        </button>
      </div>

      <div
        className="controls"
        style={{
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: '0.4rem',
          alignItems: 'stretch',
        }}
      >
        <SliderField
          label="Coverage"
          value={coverage}
          min={1}
          max={30}
          step={1}
          unit="×"
          onChange={setCoverage}
        />
        <SliderField
          label="Error rate"
          value={errRate}
          min={0}
          max={0.15}
          step={0.005}
          unit="%"
          format={(v) => (v * 100).toFixed(1)}
          onChange={setErrRate}
        />
        <SliderField
          label="Read length"
          value={readLen}
          min={4}
          max={Math.min(80, refClean.length)}
          step={1}
          unit="bp"
          onChange={setReadLen}
        />
      </div>

      <div className="controls" style={{ marginTop: '0.4rem' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
          Reference&nbsp;
          <input
            className="field"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              width: 'min(520px, 100%)',
              letterSpacing: '0.05em',
            }}
            spellCheck={false}
          />
        </label>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">Reads</div>
          <div className="value">{reads.length}</div>
        </div>
        <div className="metric">
          <div className="label">Mean depth</div>
          <div className="value">{meanDepth.toFixed(1)}×</div>
        </div>
        <div className="metric">
          <div className="label">Error rate</div>
          <div className="value">{(errRate * 100).toFixed(1)}%</div>
        </div>
        <div className={`metric ${accuracy < 0.95 ? 'accent' : ''}`}>
          <div className="label">Consensus accuracy</div>
          <div className="value">{(accuracy * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="widget-stage" style={{ minHeight: 240, overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${stageW} ${totalH}`} width="100%" style={{ maxWidth: stageW }}>
          {/* Reference row */}
          <text x={startX} y={refY - 14} style={{ fontFamily: 'var(--font-display)', fontSize: 12, fill: 'var(--ink-soft)' }}>
            Reference ({refClean.length} bp)
          </text>
          {refClean.split('').map((ch, i) => {
            const x = startX + i * cellW;
            return (
              <g key={`r-${i}`}>
                <rect
                  x={x}
                  y={refY - 9}
                  width={cellW - 1}
                  height={16}
                  fill={COLOR[ch]}
                  stroke="var(--ink)"
                  strokeWidth={0.8}
                />
                <text
                  x={x + (cellW - 1) / 2}
                  y={refY + 3}
                  textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'white', fontWeight: 700 }}
                >
                  {ch}
                </text>
              </g>
            );
          })}

          {/* Read stack */}
          {renderReads.map((rd, idx) => {
            const y = readsTopY + idx * rowH;
            return (
              <g key={`rd-${idx}`}>
                {rd.bases.map((b, j) => {
                  const x = startX + (rd.start + j) * cellW;
                  const match = b === refClean[rd.start + j];
                  return (
                    <g key={j}>
                      <rect
                        x={x}
                        y={y}
                        width={cellW - 1}
                        height={rowH - 2}
                        fill={match ? techColor : '#d62828'}
                        opacity={match ? 0.75 : 1}
                        stroke="var(--ink)"
                        strokeWidth={0.3}
                      />
                      {cellW >= 12 && (
                        <text
                          x={x + (cellW - 1) / 2}
                          y={y + rowH - 4}
                          textAnchor="middle"
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, fill: 'white', fontWeight: 600 }}
                        >
                          {b}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
          {truncated > 0 && (
            <text
              x={startX}
              y={readsBottomY + 10}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-faint)' }}
            >
              + {truncated} more reads not shown (still counted in consensus)
            </text>
          )}

          {/* Consensus row */}
          <text
            x={startX}
            y={consensusY - 14}
            style={{ fontFamily: 'var(--font-display)', fontSize: 12, fill: 'var(--ink-soft)' }}
          >
            Consensus (majority vote)
          </text>
          {consensus.map((ch, i) => {
            const x = startX + i * cellW;
            const ok = ch !== '.' && ch === refClean[i];
            const uncovered = ch === '.';
            const fill = uncovered ? 'var(--paper-deep)' : ok ? '#2a8a3e' : '#d62828';
            return (
              <g key={`c-${i}`}>
                <rect
                  x={x}
                  y={consensusY - 9}
                  width={cellW - 1}
                  height={16}
                  fill={fill}
                  stroke="var(--ink)"
                  strokeWidth={0.8}
                />
                <text
                  x={x + (cellW - 1) / 2}
                  y={consensusY + 3}
                  textAnchor="middle"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fill: uncovered ? 'var(--ink-faint)' : 'white',
                    fontWeight: 700,
                  }}
                >
                  {ch}
                </text>
                {/* Tiny depth tick */}
                <text
                  x={x + (cellW - 1) / 2}
                  y={consensusY + 22}
                  textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 7, fill: 'var(--ink-faint)' }}
                >
                  {depth[i]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="callout">
        {NOTES[tech]}
        {accuracy < 0.9 && (
          <div style={{ marginTop: '0.4rem', color: 'var(--accent)' }}>
            Consensus accuracy below 90% — either coverage is too low to outvote errors, or the error rate has overwhelmed it. This is exactly why short-read pipelines target 30× and long-read pipelines polish with a second technology.
          </div>
        )}
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step, unit, format, onChange }) {
  const shown = format ? format(value) : value;
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 180, flex: '1 1 180px' }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--ink-soft)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{label}</span>
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
          {shown}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
    </label>
  );
}
