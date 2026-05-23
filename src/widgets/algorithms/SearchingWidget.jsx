import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';

// Discrete log-ish sizes so the slider stays readable and the visual
// keeps working — past ~64 we collapse cells into a thin "strip" view.
const SIZES = [8, 16, 24, 32, 48, 64, 96, 128, 192, 256];

const ALGOS = [
  { key: 'linear', label: 'Linear scan', worst: (n) => n,             complexity: 'O(n)' },
  { key: 'binary', label: 'Binary search', worst: (n) => Math.ceil(Math.log2(n)), complexity: 'O(log n)' },
  { key: 'hash',   label: 'Hash table',   worst: () => 1,             complexity: 'O(1) avg' },
];

function generateArray(n, seed) {
  // Deterministic-ish: a tiny LCG seeded from `seed` so "regenerate" reshuffles
  // but rerenders during step-through don't reshuffle.
  let s = seed | 0 || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 10000) / 10000;
  };
  const set = new Set();
  // Sample without replacement so binary search has well-defined hits.
  while (set.size < n) set.add(Math.floor(rand() * (n * 8)) + 1);
  return [...set].sort((a, b) => a - b);
}

function buildLinearSteps(arr, target) {
  const steps = [];
  for (let i = 0; i < arr.length; i++) {
    const hit = arr[i] === target;
    steps.push({ i, hit });
    if (hit) break;
  }
  return steps;
}

function buildBinarySteps(arr, target) {
  const steps = [];
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const hit = arr[mid] === target;
    steps.push({ lo, hi, mid, hit });
    if (hit) break;
    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return steps;
}

// Open-addressing-style demo hash for visualisation. The exact constant
// doesn't matter — what matters is that one probe lands the answer.
function hash(x, buckets) {
  return ((x * 2654435761) >>> 0) % buckets;
}

function buildHashSteps(arr, target, buckets, table) {
  const bucket = hash(target, buckets);
  const entries = table[bucket] || [];
  const idx = entries.find((e) => e.v === target);
  return [{ bucket, hit: !!idx, idx: idx ? idx.i : -1 }];
}

function findIndex(arr, target) {
  // Linear because target may not be in arr; used to label "found at idx".
  for (let i = 0; i < arr.length; i++) if (arr[i] === target) return i;
  return -1;
}

export default function SearchingWidget() {
  const [sizeIdx, setSizeIdx] = useState(3); // 32
  const [seed, setSeed] = useState(7);
  const [algo, setAlgo] = useState('binary');
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(null);

  const n = SIZES[sizeIdx];
  const arr = useMemo(() => generateArray(n, seed), [n, seed]);
  const buckets = useMemo(() => Math.max(8, Math.floor(n * 1.3)), [n]);
  const hashTable = useMemo(() => {
    const t = Array.from({ length: buckets }, () => []);
    arr.forEach((v, i) => t[hash(v, buckets)].push({ v, i }));
    return t;
  }, [arr, buckets]);

  const [target, setTarget] = useState(() => arr[Math.floor(arr.length / 2)]);

  // When the array changes (size or regenerate), pick a target that exists so
  // the demo isn't always "not found". The learner can still type anything.
  useEffect(() => {
    setTarget(arr[Math.floor(arr.length / 2)]);
    setStepIdx(0);
    setPlaying(false);
  }, [arr]);

  const steps = useMemo(() => {
    if (algo === 'linear') return buildLinearSteps(arr, target);
    if (algo === 'binary') return buildBinarySteps(arr, target);
    return buildHashSteps(arr, target, buckets, hashTable);
  }, [algo, arr, target, buckets, hashTable]);

  // Reset run on any change to inputs that affect step semantics.
  useEffect(() => { setStepIdx(0); setPlaying(false); }, [algo, target]);

  // Auto-play loop.
  useEffect(() => {
    if (!playing) return;
    playRef.current = setInterval(() => {
      setStepIdx((s) => {
        if (s >= steps.length - 1) { setPlaying(false); return s; }
        return s + 1;
      });
    }, 200);
    return () => clearInterval(playRef.current);
  }, [playing, steps.length]);

  const cur = steps[Math.min(stepIdx, steps.length - 1)] || {};
  const totalSteps = steps.length;
  const stepsTaken = Math.min(stepIdx + 1, totalSteps);
  const lastStep = stepIdx >= totalSteps - 1;
  const realIdx = findIndex(arr, target);
  const algoMeta = ALGOS.find((a) => a.key === algo);

  const max = arr[arr.length - 1];
  const min = arr[0];

  function pickRandomFromArray() {
    setTarget(arr[Math.floor(Math.random() * arr.length)]);
  }

  function regenerate() { setSeed(Math.floor(Math.random() * 1e9)); }
  function step() {
    setPlaying(false);
    setStepIdx((s) => Math.min(totalSteps - 1, s + 1));
  }
  function reset() { setStepIdx(0); setPlaying(false); }

  // Cells: when n is small (<=64), show numbers; otherwise show a tick strip.
  const compact = n > 64;
  const cellW = compact ? Math.max(2, Math.floor(560 / n)) : Math.floor(560 / n);
  const cellH = compact ? 24 : 28;

  return (
    <div className="widget">
      <div className="widget-title">Searching — linear vs binary vs hash</div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          N = {n}
        </label>
        <input
          type="range" min={0} max={SIZES.length - 1} step={1}
          value={sizeIdx}
          onChange={(e) => setSizeIdx(+e.target.value)}
          style={{ width: 160 }}
        />
        <button className="btn" onClick={regenerate}>Regenerate</button>
      </div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Target:</label>
        <input
          type="number" className="field" value={target}
          min={1} max={max + 50}
          onChange={(e) => setTarget(+e.target.value)}
          style={{ width: 90, fontFamily: 'var(--font-mono)' }}
        />
        <button className="btn" onClick={pickRandomFromArray}>Pick random element</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.8rem' }}>
          range {min}…{max}
        </span>
      </div>

      <div className="controls" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        {ALGOS.map((a) => (
          <label key={a.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="radio" name="algo" checked={algo === a.key} onChange={() => setAlgo(a.key)} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>{a.label}</span>
          </label>
        ))}
      </div>

      <div className="controls">
        <button className="btn btn-accent" onClick={step} disabled={lastStep}>Step</button>
        <button className="btn" onClick={() => setPlaying((p) => !p)} disabled={lastStep && !playing}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          Step {stepsTaken} / {totalSteps}
        </span>
      </div>

      <div className="widget-stage" style={{ minHeight: 200 }}>
        <svg viewBox="0 0 600 200" width="100%" style={{ maxWidth: 600 }}>
          {/* Array row */}
          {arr.map((v, i) => {
            const x = 20 + i * cellW;
            let fill = 'var(--paper-deep)';
            let stroke = 'var(--ink)';
            if (algo === 'linear') {
              if (cur.i === i) fill = cur.hit ? '#2a8a3e' : 'var(--accent)';
              else if (cur.i !== undefined && i < cur.i) fill = '#cfe5ff';
            } else if (algo === 'binary') {
              const inRange = cur.lo !== undefined && i >= cur.lo && i <= cur.hi;
              const eliminated = cur.lo !== undefined && (i < cur.lo || i > cur.hi);
              if (cur.mid === i) fill = cur.hit ? '#2a8a3e' : 'var(--accent)';
              else if (inRange) fill = 'var(--accent-soft)';
              else if (eliminated) { fill = 'var(--paper-deep)'; stroke = 'var(--ink-faint)'; }
            } else if (algo === 'hash') {
              if (cur.idx === i && cur.hit) fill = '#2a8a3e';
            }
            return (
              <motion.g key={i} initial={false} animate={{ opacity: 1 }}>
                <rect
                  x={x} y={50} width={Math.max(1, cellW - 2)} height={cellH}
                  fill={fill} stroke={stroke}
                  strokeWidth={compact ? 0.5 : 1.5} rx={compact ? 1 : 3}
                  style={{ transition: 'fill 0.15s ease' }}
                />
                {!compact && (
                  <>
                    <text x={x + cellW / 2 - 1} y={50 + cellH / 2 + 4} textAnchor="middle"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>{v}</text>
                    {n <= 32 && (
                      <text x={x + cellW / 2 - 1} y={50 + cellH + 12} textAnchor="middle"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: 'var(--ink-soft)' }}>{i}</text>
                    )}
                  </>
                )}
              </motion.g>
            );
          })}

          {/* Hash bucket visualisation — only when hash algo is selected */}
          {algo === 'hash' && (
            <g>
              <text x={20} y={120} style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>
                hash({target}) → bucket {cur.bucket}
              </text>
              <rect x={20} y={130} width={120} height={28} fill="var(--accent-soft)" stroke="var(--ink)" strokeWidth={1.5} rx={3} />
              <text x={80} y={148} textAnchor="middle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
                bucket #{cur.bucket}
              </text>
              <line x1={140} y1={144} x2={200} y2={144} stroke="var(--ink)" strokeWidth={2} markerEnd="url(#arrow-end)" />
              <rect x={205} y={130} width={180} height={28}
                fill={cur.hit ? '#d9ead3' : '#fde2e2'} stroke="var(--ink)" strokeWidth={1.5} rx={3} />
              <text x={295} y={148} textAnchor="middle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
                {cur.hit ? `found at idx ${cur.idx} (1 hop)` : 'empty / miss'}
              </text>
              <defs>
                <marker id="arrow-end" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                  <polygon points="0 0,10 5,0 10" fill="var(--ink)" />
                </marker>
              </defs>
            </g>
          )}

          {algo === 'binary' && cur.lo !== undefined && (
            <g>
              <text x={20 + cur.lo * cellW} y={50 + cellH + 22}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>lo={cur.lo}</text>
              <text x={20 + cur.hi * cellW + cellW - 18} y={50 + cellH + 22}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>hi={cur.hi}</text>
            </g>
          )}
        </svg>
      </div>

      <div className="metrics">
        <div className="metric accent">
          <div className="label">Comparisons</div>
          <div className="value">{stepsTaken}</div>
        </div>
        <div className="metric">
          <div className="label">Worst for N={n}</div>
          <div className="value">{algoMeta.worst(n)}</div>
        </div>
        <div className="metric">
          <div className="label">Complexity</div>
          <div className="value" style={{ fontSize: '1rem', paddingTop: '0.4rem' }}>{algoMeta.complexity}</div>
        </div>
        <div className="metric">
          <div className="label">Result</div>
          <div className="value" style={{ fontSize: '1rem', paddingTop: '0.4rem' }}>
            {realIdx >= 0 ? `idx ${realIdx}` : 'not in array'}
          </div>
        </div>
      </div>

      <ComplexityChart n={n} />

      <div className="callout">
        {algo === 'linear' && (
          <>Linear scan touches up to <strong>{n}</strong> cells. Doubling N doubles the work.</>
        )}
        {algo === 'binary' && (
          <>Binary search halves the range each step → at most <strong>{Math.ceil(Math.log2(n))}</strong> comparisons for N={n}. For a million elements: 20 steps.</>
        )}
        {algo === 'hash' && (
          <>Hash table: one hash computation, one bucket lookup. Independent of N (on average) — the price is extra memory ({buckets} buckets for {n} items) and a good hash function.</>
        )}
      </div>
    </div>
  );
}

// Small log-scale-ish chart comparing n, log2 n, and 1 across the size domain,
// with a vertical marker at the current N so the learner sees where they are.
function ComplexityChart({ n }) {
  const W = 560, H = 110, PAD = 30;
  const maxN = SIZES[SIZES.length - 1];
  const x = (v) => PAD + ((v - SIZES[0]) / (maxN - SIZES[0])) * (W - PAD - 10);
  const y = (v) => H - 20 - (v / maxN) * (H - 40);

  const linePts = (fn) =>
    SIZES.map((s) => `${x(s)},${y(fn(s))}`).join(' ');

  return (
    <div className="widget-stage" style={{ minHeight: 130, marginTop: '0.4rem' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
        <text x={PAD} y={14} style={{ fontFamily: 'var(--font-display)', fontSize: 11 }}>Comparisons vs N</text>
        {/* axes */}
        <line x1={PAD} y1={H - 20} x2={W - 10} y2={H - 20} stroke="var(--ink)" strokeWidth={1} />
        <line x1={PAD} y1={20} x2={PAD} y2={H - 20} stroke="var(--ink)" strokeWidth={1} />

        {/* linear: y = n */}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={linePts((s) => s)} />
        {/* log2 */}
        <polyline fill="none" stroke="#1c6dd0" strokeWidth={2} points={linePts((s) => Math.log2(s))} />
        {/* constant */}
        <polyline fill="none" stroke="#2a8a3e" strokeWidth={2} points={linePts(() => 1)} />

        {/* current N marker */}
        <line x1={x(n)} y1={20} x2={x(n)} y2={H - 20} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="3 3" />
        <text x={x(n) + 4} y={28} style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>N={n}</text>

        {/* legend */}
        <g style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
          <rect x={W - 130} y={26} width={10} height={3} fill="var(--accent)" />
          <text x={W - 116} y={30}>linear n</text>
          <rect x={W - 130} y={42} width={10} height={3} fill="#1c6dd0" />
          <text x={W - 116} y={46}>log₂ n</text>
          <rect x={W - 130} y={58} width={10} height={3} fill="#2a8a3e" />
          <text x={W - 116} y={62}>constant 1</text>
        </g>
      </svg>
    </div>
  );
}
