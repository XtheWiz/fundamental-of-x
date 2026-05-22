import { useEffect, useRef, useState } from 'react';

const N = 20;

function makeArray(seed = 0) {
  let s = seed + 1;
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const a = [];
  for (let i = 0; i < N; i++) a.push({ id: i, v: 1 + Math.floor(rng() * 99) });
  return a;
}

// Each algorithm yields snapshots: { arr, compare: [i,j], swap?: [i,j], done? }.
function* bubbleSort(a) {
  const arr = a.slice();
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      yield { arr: arr.slice(), compare: [j, j + 1] };
      if (arr[j].v > arr[j + 1].v) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield { arr: arr.slice(), compare: [j, j + 1], swap: [j, j + 1] };
      }
    }
  }
  yield { arr, compare: null, done: true };
}

function* insertionSort(a) {
  const arr = a.slice();
  for (let i = 1; i < arr.length; i++) {
    let j = i;
    while (j > 0 && arr[j - 1].v > arr[j].v) {
      yield { arr: arr.slice(), compare: [j - 1, j] };
      [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
      yield { arr: arr.slice(), compare: [j - 1, j], swap: [j - 1, j] };
      j--;
    }
  }
  yield { arr, compare: null, done: true };
}

function* quickSort(a) {
  const arr = a.slice();
  function* qs(lo, hi) {
    if (lo >= hi) return;
    const pivot = arr[hi].v;
    let i = lo;
    for (let j = lo; j < hi; j++) {
      yield { arr: arr.slice(), compare: [j, hi] };
      if (arr[j].v < pivot) {
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          yield { arr: arr.slice(), compare: [i, j], swap: [i, j] };
        }
        i++;
      }
    }
    [arr[i], arr[hi]] = [arr[hi], arr[i]];
    yield { arr: arr.slice(), compare: [i, hi], swap: [i, hi] };
    yield* qs(lo, i - 1);
    yield* qs(i + 1, hi);
  }
  yield* qs(0, arr.length - 1);
  yield { arr, compare: null, done: true };
}

function* mergeSort(a) {
  const arr = a.slice();
  function* ms(lo, hi) {
    if (hi - lo <= 1) return;
    const mid = (lo + hi) >> 1;
    yield* ms(lo, mid);
    yield* ms(mid, hi);
    const merged = [];
    let i = lo, j = mid;
    while (i < mid && j < hi) {
      yield { arr: arr.slice(), compare: [i, j] };
      if (arr[i].v <= arr[j].v) merged.push(arr[i++]); else merged.push(arr[j++]);
    }
    while (i < mid) merged.push(arr[i++]);
    while (j < hi) merged.push(arr[j++]);
    for (let k = 0; k < merged.length; k++) arr[lo + k] = merged[k];
    yield { arr: arr.slice(), compare: null, swap: [lo, lo + merged.length - 1] };
  }
  yield* ms(0, arr.length);
  yield { arr, compare: null, done: true };
}

const ALGS = {
  Bubble: bubbleSort, Insertion: insertionSort, Quick: quickSort, Merge: mergeSort,
};

export default function SortingWidget() {
  const [alg, setAlg] = useState('Quick');
  const [seed, setSeed] = useState(7);
  const [state, setState] = useState({ arr: makeArray(seed), compare: null, swap: null, done: false });
  const [comps, setComps] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [speed, setSpeed] = useState(40);
  const genRef = useRef(null);
  const playingRef = useRef(false);

  function reset() {
    const arr = makeArray(seed);
    setState({ arr, compare: null, swap: null, done: false });
    setComps(0); setSwaps(0);
    genRef.current = ALGS[alg](arr);
    playingRef.current = false;
  }
  useEffect(reset, [alg, seed]);

  function step() {
    if (!genRef.current) genRef.current = ALGS[alg](state.arr);
    const next = genRef.current.next();
    if (next.done) return false;
    const v = next.value;
    setState(v);
    if (v.compare) setComps((c) => c + 1);
    if (v.swap) setSwaps((s) => s + 1);
    return !v.done;
  }
  async function play() {
    if (playingRef.current) { playingRef.current = false; return; }
    playingRef.current = true;
    while (playingRef.current && step()) {
      await new Promise((r) => setTimeout(r, speed));
    }
    playingRef.current = false;
  }

  const max = Math.max(...state.arr.map((x) => x.v));

  return (
    <div className="widget">
      <div className="widget-title">Watch a sorting algorithm run</div>
      <div className="controls">
        {Object.keys(ALGS).map((k) => (
          <button key={k} className={`btn ${alg === k ? 'btn-accent' : ''}`} onClick={() => setAlg(k)}>{k}</button>
        ))}
      </div>
      <div className="controls">
        <button className="btn btn-accent" onClick={play}>{playingRef.current ? 'Pause' : 'Play'}</button>
        <button className="btn" onClick={step}>Step</button>
        <button className="btn btn-ghost" onClick={() => setSeed(seed + 1)}>New array</button>
        <label style={{ marginLeft: '1rem' }}>Speed:</label>
        <input type="range" min="5" max="200" step="5" value={speed}
          onChange={(e) => setSpeed(+e.target.value)} style={{ width: 120 }} />
      </div>
      <div className="widget-stage" style={{ minHeight: 240 }}>
        <svg viewBox="0 0 600 220" width="100%" style={{ maxWidth: 600 }}>
          {state.arr.map((item, i) => {
            const x = 20 + i * 28;
            const h = (item.v / max) * 180;
            const y = 200 - h;
            const isCompare = state.compare && (state.compare[0] === i || state.compare[1] === i);
            const isSwap = state.swap && (state.swap[0] === i || state.swap[1] === i);
            const fill = state.done ? '#2a8a3e' : isSwap ? 'var(--accent)' : isCompare ? '#f59e0b' : 'var(--ink-soft)';
            return (
              <g key={item.id}>
                <rect x={x} y={y} width={22} height={h} fill={fill} stroke="var(--ink)" strokeWidth={1}
                  style={{ transition: 'all 0.15s ease' }} />
                <text x={x + 11} y={216} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>{item.v}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="metrics">
        <div className="metric"><div className="label">Algorithm</div><div className="value">{alg}</div></div>
        <div className="metric"><div className="label">Comparisons</div><div className="value">{comps}</div></div>
        <div className="metric accent"><div className="label">Swaps</div><div className="value">{swaps}</div></div>
        <div className="metric"><div className="label">Status</div><div className="value">{state.done ? 'sorted ✓' : 'running'}</div></div>
      </div>
    </div>
  );
}
