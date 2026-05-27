import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Binary heap — twin display: complete binary tree (top) + backing array (bottom).
// Element i's children live at 2i+1 and 2i+2; parent at floor((i-1)/2).
// Insert  → append, then sift-up   (compare with parent, swap while it violates the heap rule).
// Extract → pop root, move last into slot 0, then sift-down (swap with the "better" child).
// The Step button drives one swap at a time so the sift is observable.

const cmp = (type) => (a, b) => (type === 'min' ? a < b : a > b);

// Build a sift-up plan as a list of swaps {i, j} starting from `from`.
function planSiftUp(arr, from, type) {
  const a = arr.slice();
  const better = cmp(type);
  const swaps = [];
  let i = from;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (better(a[i], a[p])) {
      swaps.push({ i, j: p });
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    } else break;
  }
  return { swaps, finalArr: a };
}

// Build a sift-down plan starting from `from`.
function planSiftDown(arr, from, type) {
  const a = arr.slice();
  const better = cmp(type);
  const swaps = [];
  let i = from;
  const n = a.length;
  while (true) {
    const l = 2 * i + 1, r = 2 * i + 2;
    let best = i;
    if (l < n && better(a[l], a[best])) best = l;
    if (r < n && better(a[r], a[best])) best = r;
    if (best === i) break;
    swaps.push({ i, j: best });
    [a[i], a[best]] = [a[best], a[i]];
    i = best;
  }
  return { swaps, finalArr: a };
}

// Layout a complete binary tree of size n into {x,y} positions over a 700×280 canvas.
function treeLayout(n) {
  if (n === 0) return [];
  const height = Math.floor(Math.log2(n));
  const W = 700;
  const rowH = Math.min(70, 240 / Math.max(1, height));
  const pos = [];
  for (let i = 0; i < n; i++) {
    const depth = Math.floor(Math.log2(i + 1));
    const rowStart = (1 << depth) - 1;        // first index at this depth
    const rowSize  = 1 << depth;               // 2^depth slots
    const col = i - rowStart;
    const x = (W / (rowSize + 1)) * (col + 1);
    const y = 30 + depth * rowH;
    pos.push({ x, y, depth });
  }
  return pos;
}

function randInt(max) { return Math.floor(Math.random() * max); }

export default function HeapsWidget() {
  const [type, setType] = useState('min');
  const [heap, setHeap] = useState([]);
  const [insertVal, setInsertVal] = useState('');
  // A queued "operation in progress" — a list of remaining swaps to apply.
  // `nextOp` describes the kind: 'sift-up' or 'sift-down' (or null).
  const [pending, setPending] = useState({ swaps: [], kind: null, activeIdx: null });
  const [lastSteps, setLastSteps] = useState(0);
  const [lastOp, setLastOp] = useState('—');
  const [lastExtracted, setLastExtracted] = useState(null);
  const [highlight, setHighlight] = useState(null); // current swap pair to flash

  const size = heap.length;
  const height = size === 0 ? 0 : Math.floor(Math.log2(size));
  const layout = useMemo(() => treeLayout(size), [size]);

  function flipType() {
    const next = type === 'min' ? 'max' : 'min';
    setType(next);
    // re-heapify the current array under the new rule so the display stays valid
    if (heap.length > 0) {
      const a = heap.slice();
      const better = cmp(next);
      for (let i = (a.length >> 1) - 1; i >= 0; i--) {
        let j = i;
        while (true) {
          const l = 2 * j + 1, r = 2 * j + 2;
          let best = j;
          if (l < a.length && better(a[l], a[best])) best = l;
          if (r < a.length && better(a[r], a[best])) best = r;
          if (best === j) break;
          [a[j], a[best]] = [a[best], a[j]];
          j = best;
        }
      }
      setHeap(a);
    }
    setPending({ swaps: [], kind: null, activeIdx: null });
    setHighlight(null);
    setLastOp(`switched to ${next}-heap`);
    setLastSteps(0);
  }

  function doInsert() {
    const v = parseInt(insertVal, 10);
    if (Number.isNaN(v)) return;
    const next = heap.concat(v);
    const plan = planSiftUp(next, next.length - 1, type);
    setHeap(next);
    setPending({ swaps: plan.swaps, kind: 'sift-up', activeIdx: next.length - 1 });
    setLastOp(`insert ${v}`);
    setLastSteps(plan.swaps.length);
    setInsertVal('');
    setHighlight(null);
  }

  function doExtract() {
    if (heap.length === 0) return;
    const root = heap[0];
    setLastExtracted(root);
    if (heap.length === 1) {
      setHeap([]);
      setPending({ swaps: [], kind: null, activeIdx: null });
      setLastOp(`extract ${root}`);
      setLastSteps(0);
      setHighlight(null);
      return;
    }
    const next = heap.slice(0, -1);
    next[0] = heap[heap.length - 1];
    const plan = planSiftDown(next, 0, type);
    setHeap(next);
    setPending({ swaps: plan.swaps, kind: 'sift-down', activeIdx: 0 });
    setLastOp(`extract ${root}`);
    setLastSteps(plan.swaps.length);
    setHighlight(null);
  }

  function doStep() {
    if (pending.swaps.length === 0) { setHighlight(null); return; }
    const [{ i, j }, ...rest] = pending.swaps;
    const next = heap.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setHeap(next);
    setHighlight({ i, j });
    setPending({ swaps: rest, kind: pending.kind, activeIdx: j });
  }

  function doBuild() {
    const n = 10;
    const a = [];
    for (let k = 0; k < n; k++) a.push(1 + randInt(99));
    // Floyd heapify, recording swaps for the animation.
    const better = cmp(type);
    const swaps = [];
    function sd(start, arr) {
      let i = start;
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let best = i;
        if (l < arr.length && better(arr[l], arr[best])) best = l;
        if (r < arr.length && better(arr[r], arr[best])) best = r;
        if (best === i) break;
        swaps.push({ i, j: best });
        [arr[i], arr[best]] = [arr[best], arr[i]];
        i = best;
      }
    }
    const initial = a.slice();        // unheapified — show this first
    const work = a.slice();
    for (let i = (work.length >> 1) - 1; i >= 0; i--) sd(i, work);
    setHeap(initial);
    setPending({ swaps, kind: 'sift-down', activeIdx: null });
    setLastOp(`build-heap from random 10`);
    setLastSteps(swaps.length);
    setHighlight(null);
  }

  function doReset() {
    setHeap([]);
    setPending({ swaps: [], kind: null, activeIdx: null });
    setLastSteps(0);
    setLastOp('—');
    setLastExtracted(null);
    setHighlight(null);
  }

  const nextOpLabel =
    pending.swaps.length > 0
      ? `${pending.kind} (${pending.swaps.length} swap${pending.swaps.length === 1 ? '' : 's'} left)`
      : 'idle';

  return (
    <div className="widget">
      <div className="widget-title">Binary heap — tree on top, array below</div>

      <div className="controls">
        <div className="pill-group">
          <input type="radio" id="heap-min" name="heap-type" checked={type === 'min'} onChange={flipType} />
          <label htmlFor="heap-min">Min-heap</label>
          <input type="radio" id="heap-max" name="heap-type" checked={type === 'max'} onChange={flipType} />
          <label htmlFor="heap-max">Max-heap</label>
        </div>
        <input
          className="field"
          type="number"
          placeholder="value"
          value={insertVal}
          onChange={(e) => setInsertVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doInsert(); }}
          style={{ width: 80 }}
        />
        <button className="btn btn-accent" onClick={doInsert}>Insert</button>
        <button className="btn" onClick={doExtract} disabled={heap.length === 0}>
          Extract {type === 'min' ? 'min' : 'max'}
        </button>
        <button className="btn" onClick={doBuild}>Build heap from random 10</button>
        <button className="btn" onClick={doStep} disabled={pending.swaps.length === 0}>
          Step ({pending.swaps.length})
        </button>
        <button className="btn btn-ghost" onClick={doReset}>Reset</button>
      </div>

      <div className="widget-stage" style={{ minHeight: 360 }}>
        <svg viewBox="0 0 700 360" width="100%" style={{ maxWidth: 700 }}>
          {/* edges */}
          {heap.map((_, i) => {
            if (i === 0) return null;
            const p = (i - 1) >> 1;
            const a = layout[i], b = layout[p];
            if (!a || !b) return null;
            return (
              <line key={`e-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="var(--ink-soft)" strokeWidth={1.5} />
            );
          })}

          {/* nodes */}
          {heap.map((v, i) => {
            const p = layout[i];
            if (!p) return null;
            const isSwap = highlight && (highlight.i === i || highlight.j === i);
            const isActive = pending.activeIdx === i && pending.swaps.length > 0;
            const fill = isSwap ? 'var(--accent)' : isActive ? '#f59e0b' : i === 0 ? '#1c6dd0' : 'var(--paper)';
            const textFill = (isSwap || isActive || i === 0) ? 'white' : 'var(--ink)';
            return (
              <motion.g key={`n-${i}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1, x: p.x, y: p.y }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              >
                <circle r={18} cx={0} cy={0} fill={fill} stroke="var(--ink)" strokeWidth={2}
                  style={{ transition: 'fill 0.18s ease' }} />
                <text x={0} y={4} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, fill: textFill }}>
                  {v}
                </text>
                <text x={0} y={-24} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
                  i={i}
                </text>
              </motion.g>
            );
          })}

          {heap.length === 0 && (
            <text x={350} y={140} textAnchor="middle"
              style={{ fontFamily: 'var(--font-display)', fontSize: 14, fill: 'var(--ink-faint)' }}>
              empty heap — insert a value or build from random 10
            </text>
          )}

          {/* array strip */}
          <g transform="translate(0, 280)">
            <text x={10} y={-8} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>
              backing array (children of i: 2i+1, 2i+2 · parent: ⌊(i−1)/2⌋)
            </text>
            <AnimatePresence>
              {heap.map((v, i) => {
                const cellW = Math.min(50, 680 / Math.max(heap.length, 8));
                const x = 10 + i * cellW;
                const isSwap = highlight && (highlight.i === i || highlight.j === i);
                const isActive = pending.activeIdx === i && pending.swaps.length > 0;
                const fill = isSwap ? 'var(--accent)' : isActive ? '#f59e0b' : i === 0 ? '#1c6dd0' : 'var(--paper)';
                const textFill = (isSwap || isActive || i === 0) ? 'white' : 'var(--ink)';
                return (
                  <motion.g key={`c-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <rect x={x} y={0} width={cellW - 2} height={42} rx={4}
                      fill={fill} stroke="var(--ink)" strokeWidth={1.5}
                      style={{ transition: 'fill 0.18s ease' }} />
                    <text x={x + (cellW - 2) / 2} y={26} textAnchor="middle"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, fill: textFill }}>
                      {v}
                    </text>
                    <text x={x + (cellW - 2) / 2} y={56} textAnchor="middle"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
                      [{i}]
                    </text>
                  </motion.g>
                );
              })}
            </AnimatePresence>
          </g>
        </svg>
      </div>

      <div className="metrics">
        <div className="metric"><div className="label">Type</div><div className="value">{type}-heap</div></div>
        <div className="metric"><div className="label">Size</div><div className="value">{size}</div></div>
        <div className="metric"><div className="label">Height</div><div className="value">{height}</div></div>
        <div className="metric accent"><div className="label">Last op steps</div><div className="value">{lastSteps}</div></div>
        <div className="metric"><div className="label">Last op</div><div className="value">{lastOp}</div></div>
        <div className="metric"><div className="label">Next op type</div><div className="value">{nextOpLabel}</div></div>
      </div>

      <div className="callout">
        <strong>Heap property.</strong> Every parent is {type === 'min' ? '≤' : '≥'} its children, so the root is always the {type === 'min' ? 'minimum' : 'maximum'}.
        Insert appends at the end then <em>sifts up</em>; extract swaps the root with the last leaf, shrinks, then <em>sifts down</em>.
        Both are O(log n) because the tree height is ⌊log₂ n⌋.
        {lastExtracted !== null && (
          <div style={{ marginTop: '0.4rem', color: 'var(--ink-soft)' }}>
            Last extracted root: <strong>{lastExtracted}</strong>.
          </div>
        )}
        <div style={{ marginTop: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          Use cases: Dijkstra, A*, top-K, event scheduler, lazy delete (with key map).
        </div>
      </div>
    </div>
  );
}
