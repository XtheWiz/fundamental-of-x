import { useState } from 'react';

const VALUES = [3, 8, 12, 17, 23, 31, 42, 56, 64, 71, 78, 85, 92, 97, 99];

function binarySearchSteps(arr, target) {
  const steps = [];
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    steps.push({ lo, hi, mid, val: arr[mid] });
    if (arr[mid] === target) return { steps, found: mid };
    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return { steps, found: -1 };
}

function linearSearchSteps(arr, target) {
  const steps = [];
  for (let i = 0; i < arr.length; i++) {
    steps.push({ i });
    if (arr[i] === target) return { steps, found: i };
  }
  return { steps, found: -1 };
}

export default function SearchingWidget() {
  const [target, setTarget] = useState(64);
  const [stepIdx, setStepIdx] = useState(0);
  const bin = binarySearchSteps(VALUES, target);
  const lin = linearSearchSteps(VALUES, target);
  const max = Math.max(bin.steps.length, lin.steps.length);
  const safe = Math.min(stepIdx, max - 1);
  const binStep = bin.steps[Math.min(safe, bin.steps.length - 1)];
  const linStep = lin.steps[Math.min(safe, lin.steps.length - 1)];

  return (
    <div className="widget">
      <div className="widget-title">Binary search vs linear scan</div>
      <div className="controls">
        <label>Target:</label>
        <select value={target} onChange={(e) => { setTarget(+e.target.value); setStepIdx(0); }}
          style={{ fontFamily: 'var(--font-mono)', padding: '0.3em 0.5em', border: '2px solid var(--ink)', borderRadius: 'var(--radius)' }}>
          {VALUES.map((v) => <option key={v} value={v}>{v}</option>)}
          <option value={50}>50 (not in array)</option>
        </select>
        <button className="btn btn-accent" onClick={() => setStepIdx((s) => Math.min(max - 1, s + 1))}>Next step</button>
        <button className="btn btn-ghost" onClick={() => setStepIdx(0)}>Reset</button>
      </div>
      <div className="widget-stage" style={{ minHeight: 240 }}>
        <svg viewBox="0 0 600 220" width="100%" style={{ maxWidth: 600 }}>
          <text x={20} y={20} style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>Binary search (sorted)</text>
          {VALUES.map((v, i) => {
            const x = 30 + i * 38;
            const active = binStep && binStep.mid === i;
            const inRange = binStep && i >= binStep.lo && i <= binStep.hi;
            const fill = active ? 'var(--accent)' : inRange ? 'var(--accent-soft)' : 'var(--paper-deep)';
            return (
              <g key={i}>
                <rect x={x} y={40} width={32} height={32} fill={fill} stroke="var(--ink)" strokeWidth={1.5} rx={3}
                  style={{ transition: 'all 0.2s ease' }} />
                <text x={x + 16} y={62} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{v}</text>
              </g>
            );
          })}

          <text x={20} y={120} style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>Linear scan</text>
          {VALUES.map((v, i) => {
            const x = 30 + i * 38;
            const active = linStep && linStep.i === i;
            const visited = linStep && linStep.i > i;
            const fill = active ? 'var(--accent)' : visited ? '#cfe5ff' : 'var(--paper-deep)';
            return (
              <g key={i}>
                <rect x={x} y={140} width={32} height={32} fill={fill} stroke="var(--ink)" strokeWidth={1.5} rx={3}
                  style={{ transition: 'all 0.2s ease' }} />
                <text x={x + 16} y={162} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{v}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="metrics">
        <div className="metric"><div className="label">Binary steps</div><div className="value">{Math.min(safe + 1, bin.steps.length)} / {bin.steps.length}</div></div>
        <div className="metric accent"><div className="label">Linear steps</div><div className="value">{Math.min(safe + 1, lin.steps.length)} / {lin.steps.length}</div></div>
        <div className="metric"><div className="label">Found</div><div className="value">{bin.found >= 0 ? `idx ${bin.found}` : 'not found'}</div></div>
      </div>
      <div className="callout">
        Binary search converges in {bin.steps.length} steps because it halves the search range each time. Linear scan touches up to {VALUES.length} cells. For a million-element array: 20 vs 1,000,000.
      </div>
    </div>
  );
}
