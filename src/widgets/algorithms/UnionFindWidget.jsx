import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Union-Find / DSU. A forest of 12 elements; parent[i] points to another node
// (or to itself when i is a root). Union joins two roots; Find walks up to
// the root. Toggles for union-by-rank and path-compression visibly change
// the shape of the trees and the resulting depth / op-cost.

const N = 12;

// Grid layout for the 12 elements.
const COLS = 6;
const CELL_W = 90;
const CELL_H = 80;
const PAD_X = 30;
const PAD_Y = 30;

function nodePos(i) {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return { x: PAD_X + c * CELL_W + CELL_W / 2, y: PAD_Y + r * CELL_H + CELL_H / 2 };
}

function findRoot(parent, i) {
  let cur = i;
  const path = [cur];
  while (parent[cur] !== cur) {
    cur = parent[cur];
    path.push(cur);
  }
  return { root: cur, path };
}

function countComponents(parent) {
  let n = 0;
  for (let i = 0; i < parent.length; i++) if (parent[i] === i) n++;
  return n;
}

function treeDepth(parent, i) {
  let d = 0, cur = i;
  while (parent[cur] !== cur) { cur = parent[cur]; d++; if (d > parent.length) return d; }
  return d;
}

function maxHeight(parent) {
  let m = 0;
  for (let i = 0; i < parent.length; i++) m = Math.max(m, treeDepth(parent, i));
  return m;
}

function avgFindDepth(parent) {
  let s = 0;
  for (let i = 0; i < parent.length; i++) s += treeDepth(parent, i);
  return (s / parent.length).toFixed(2);
}

// Generate a deterministic-ish random weighted graph for the Kruskal demo.
function makeRandomEdges() {
  const edges = [];
  const seen = new Set();
  // Guarantee connectivity with a spanning chain first
  for (let i = 0; i < N - 1; i++) {
    edges.push({ u: i, v: i + 1, w: 1 + Math.floor(Math.random() * 20) });
    seen.add(`${i}-${i + 1}`);
  }
  // Add some random extra edges
  let extra = 8;
  while (extra > 0) {
    const u = Math.floor(Math.random() * N);
    const v = Math.floor(Math.random() * N);
    if (u === v) continue;
    const key = u < v ? `${u}-${v}` : `${v}-${u}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ u, v, w: 1 + Math.floor(Math.random() * 20) });
    extra--;
  }
  return edges.sort((a, b) => a.w - b.w);
}

export default function UnionFindWidget() {
  const initialParent = useMemo(() => Array.from({ length: N }, (_, i) => i), []);
  const initialRank = useMemo(() => Array(N).fill(0), []);

  const [parent, setParent] = useState(initialParent);
  const [rank, setRank] = useState(initialRank);
  const [aSel, setASel] = useState(0);
  const [bSel, setBSel] = useState(1);
  const [findSel, setFindSel] = useState(0);

  const [useRank, setUseRank] = useState(true);
  const [useCompress, setUseCompress] = useState(true);

  const [ops, setOps] = useState(0);
  const [highlightPath, setHighlightPath] = useState([]);
  const [highlightRoot, setHighlightRoot] = useState(null);
  const [message, setMessage] = useState('Pick two elements and click Union, or pick one and click Find.');

  const [kruskal, setKruskal] = useState(null); // {edges, accepted:Set, rejected:Set, idx, mstWeight}
  const animTimer = useRef(null);

  function reset() {
    if (animTimer.current) clearTimeout(animTimer.current);
    setParent(Array.from({ length: N }, (_, i) => i));
    setRank(Array(N).fill(0));
    setOps(0);
    setHighlightPath([]);
    setHighlightRoot(null);
    setKruskal(null);
    setMessage('Forest reset. Each element is its own component (root).');
  }

  // Find with optional path compression. Returns {root, walked} and a new
  // parent array (mutated to apply compression if enabled).
  function findWithCompress(p, i, compress) {
    const walked = [i];
    let cur = i;
    while (p[cur] !== cur) {
      cur = p[cur];
      walked.push(cur);
    }
    if (compress) {
      for (const node of walked) p[node] = cur;
    }
    return { root: cur, walked };
  }

  function doUnion() {
    if (aSel === bSel) {
      setMessage('Pick two distinct elements to union.');
      return;
    }
    const p = parent.slice();
    const r = rank.slice();
    const fa = findWithCompress(p, aSel, useCompress);
    const fb = findWithCompress(p, bSel, useCompress);
    if (fa.root === fb.root) {
      setParent(p);
      setHighlightPath([...new Set([...fa.walked, ...fb.walked])]);
      setHighlightRoot(fa.root);
      setOps((o) => o + 1);
      setMessage(`Find(${aSel}) and Find(${bSel}) both reach root ${fa.root}. Already connected — no link.`);
      return;
    }
    let newRoot, child;
    if (useRank) {
      if (r[fa.root] < r[fb.root]) { p[fa.root] = fb.root; newRoot = fb.root; child = fa.root; }
      else if (r[fa.root] > r[fb.root]) { p[fb.root] = fa.root; newRoot = fa.root; child = fb.root; }
      else { p[fb.root] = fa.root; r[fa.root]++; newRoot = fa.root; child = fb.root; }
    } else {
      // naive: attach b's root under a's root
      p[fb.root] = fa.root;
      newRoot = fa.root;
      child = fb.root;
    }
    setParent(p);
    setRank(r);
    setOps((o) => o + 1);
    setHighlightPath([...new Set([...fa.walked, ...fb.walked])]);
    setHighlightRoot(newRoot);
    setMessage(
      `Union(${aSel}, ${bSel}): roots ${fa.root} & ${fb.root}. ` +
      (useRank ? `By rank — attached ${child} under ${newRoot}.` : `Naive — attached ${child} under ${newRoot}.`) +
      (useCompress ? ' Path compression flattened the walked nodes.' : '')
    );
  }

  function doFind() {
    const p = parent.slice();
    const { root, walked } = findWithCompress(p, findSel, useCompress);
    setParent(p);
    setOps((o) => o + 1);
    setHighlightPath(walked);
    setHighlightRoot(root);
    setMessage(
      `Find(${findSel}) → root ${root}. Walked ${walked.length - 1} edge${walked.length - 1 === 1 ? '' : 's'}.` +
      (useCompress && walked.length > 2 ? ' Path compression re-pointed every visited node directly at the root.' : '')
    );
  }

  function runKruskal() {
    if (animTimer.current) clearTimeout(animTimer.current);
    // Reset DSU first to give a clean run
    const p = Array.from({ length: N }, (_, i) => i);
    const r = Array(N).fill(0);
    const edges = makeRandomEdges();
    const accepted = [];
    const rejected = [];

    const stepThrough = (idx) => {
      if (idx >= edges.length) {
        setParent(p.slice());
        setRank(r.slice());
        setKruskal({ edges, accepted: [...accepted], rejected: [...rejected], idx: edges.length, done: true });
        setMessage(
          `Kruskal finished. Accepted ${accepted.length} edges (MST weight ${
            accepted.reduce((s, e) => s + e.w, 0)
          }), rejected ${rejected.length} (cycles).`
        );
        return;
      }
      const e = edges[idx];
      const fa = findWithCompress(p, e.u, useCompress);
      const fb = findWithCompress(p, e.v, useCompress);
      if (fa.root === fb.root) {
        rejected.push(e);
      } else {
        if (useRank) {
          if (r[fa.root] < r[fb.root]) p[fa.root] = fb.root;
          else if (r[fa.root] > r[fb.root]) p[fb.root] = fa.root;
          else { p[fb.root] = fa.root; r[fa.root]++; }
        } else {
          p[fb.root] = fa.root;
        }
        accepted.push(e);
      }
      setParent(p.slice());
      setRank(r.slice());
      setOps((o) => o + 1);
      setKruskal({ edges, accepted: [...accepted], rejected: [...rejected], idx: idx + 1, done: false, current: e });
      setHighlightPath([e.u, e.v]);
      setHighlightRoot(null);
      animTimer.current = setTimeout(() => stepThrough(idx + 1), 420);
    };

    setParent(p.slice());
    setRank(r.slice());
    setKruskal({ edges, accepted: [], rejected: [], idx: 0, done: false });
    setMessage('Kruskal: scanning edges in sorted order. Accept if endpoints are in different components, else reject (cycle).');
    animTimer.current = setTimeout(() => stepThrough(0), 300);
  }

  // Build arrows from i -> parent[i] for non-roots
  const arrows = parent.map((p, i) => ({ from: i, to: p })).filter((a) => a.from !== a.to);
  const components = countComponents(parent);
  const mh = maxHeight(parent);
  const avg = avgFindDepth(parent);

  const SVG_W = PAD_X * 2 + CELL_W * COLS;
  const SVG_H = PAD_Y * 2 + CELL_H * Math.ceil(N / COLS);

  return (
    <div className="widget">
      <div className="widget-title">Union-Find — forests, ranks, path compression</div>

      <div className="controls">
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Union:</label>
        <select className="field" value={aSel} onChange={(e) => setASel(+e.target.value)}>
          {Array.from({ length: N }, (_, i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <span style={{ fontFamily: 'var(--font-mono)' }}>+</span>
        <select className="field" value={bSel} onChange={(e) => setBSel(+e.target.value)}>
          {Array.from({ length: N }, (_, i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <button className="btn btn-accent" onClick={doUnion}>Union</button>

        <label style={{ marginLeft: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Find:</label>
        <select className="field" value={findSel} onChange={(e) => setFindSel(+e.target.value)}>
          {Array.from({ length: N }, (_, i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <button className="btn" onClick={doFind}>Find</button>
      </div>

      <div className="controls">
        <button className={`btn ${useRank ? 'btn-accent' : ''}`} onClick={() => setUseRank((v) => !v)}>
          Union by rank: {useRank ? 'ON' : 'OFF'}
        </button>
        <button className={`btn ${useCompress ? 'btn-accent' : ''}`} onClick={() => setUseCompress((v) => !v)}>
          Path compression: {useCompress ? 'ON' : 'OFF'}
        </button>
        <button className="btn" onClick={runKruskal}>Run Kruskal's on random graph</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      <div className="widget-stage" style={{ minHeight: SVG_H + 20 }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ maxWidth: SVG_W }}>
          <defs>
            <marker id="uf-arr" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <polygon points="0 0,9 4.5,0 9" fill="var(--ink)" />
            </marker>
            <marker id="uf-arr-hot" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <polygon points="0 0,9 4.5,0 9" fill="var(--accent)" />
            </marker>
          </defs>

          <AnimatePresence>
            {arrows.map(({ from, to }) => {
              const pf = nodePos(from);
              const pt = nodePos(to);
              const dx = pt.x - pf.x, dy = pt.y - pf.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const ux = dx / len, uy = dy / len;
              const r = 22;
              const x1 = pf.x + ux * r, y1 = pf.y + uy * r;
              const x2 = pt.x - ux * r, y2 = pt.y - uy * r;
              const hot = highlightPath.includes(from) && highlightPath.includes(to);
              return (
                <motion.line
                  key={`${from}->${to}`}
                  initial={{ opacity: 0, x1, y1, x2, y2 }}
                  animate={{ opacity: 1, x1, y1, x2, y2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  stroke={hot ? 'var(--accent)' : 'var(--ink)'}
                  strokeWidth={hot ? 3 : 1.8}
                  markerEnd={hot ? 'url(#uf-arr-hot)' : 'url(#uf-arr)'}
                />
              );
            })}
          </AnimatePresence>

          {Array.from({ length: N }, (_, i) => {
            const { x, y } = nodePos(i);
            const isRoot = parent[i] === i;
            const onPath = highlightPath.includes(i);
            const isRootHL = highlightRoot === i;
            const fill = isRootHL ? 'var(--accent)' : onPath ? '#f59e0b' : isRoot ? '#1c6dd0' : 'var(--paper)';
            const txtColor = isRootHL || onPath || isRoot ? 'white' : 'var(--ink)';
            return (
              <g key={i}>
                <motion.circle
                  cx={x} cy={y} r={22}
                  fill={fill}
                  stroke="var(--ink)" strokeWidth={2.5}
                  animate={{ scale: isRootHL ? 1.12 : 1 }}
                  transition={{ duration: 0.25 }}
                  style={{ transition: 'fill 0.2s ease' }}
                />
                <text x={x} y={y + 5} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, fill: txtColor, pointerEvents: 'none' }}>
                  {i}
                </text>
                {useRank && isRoot && rank[i] > 0 && (
                  <text x={x + 18} y={y - 16} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)', fontWeight: 700 }}>
                    r{rank[i]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="metrics">
        <div className="metric"><div className="label">Components</div><div className="value">{components}</div></div>
        <div className="metric"><div className="label">Operations</div><div className="value">{ops}</div></div>
        <div className="metric"><div className="label">Max height</div><div className="value">{mh}</div></div>
        <div className="metric accent"><div className="label">Avg find depth</div><div className="value">{avg}</div></div>
      </div>

      <div className="callout">
        {message}
        <div style={{ marginTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
          Blue = root, orange = path walked by last op, red = root touched by last op.
          With both optimisations, amortised cost per op is O(α(n)) — effectively constant.
        </div>
      </div>

      {kruskal && (
        <div className="callout" style={{ marginTop: '0.6rem' }}>
          <strong>Kruskal's MST.</strong> {kruskal.idx} / {kruskal.edges.length} edges scanned.
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
            {kruskal.edges.map((e, idx) => {
              const isAcc = kruskal.accepted.some((x) => x === e);
              const isRej = kruskal.rejected.some((x) => x === e);
              const isCur = kruskal.current === e;
              const bg = isCur ? '#fde2e2' : isAcc ? '#d9ead3' : isRej ? 'var(--paper-deep)' : 'var(--paper)';
              const txt = isRej ? 'var(--ink-faint)' : 'var(--ink)';
              const deco = isRej ? 'line-through' : 'none';
              return (
                <span key={idx} style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                  border: '1.5px solid var(--ink)', borderRadius: 4,
                  padding: '0.15rem 0.4rem', background: bg, color: txt, textDecoration: deco,
                }}>
                  {e.u}-{e.v}:{e.w}
                </span>
              );
            })}
          </div>
          {kruskal.done && (
            <div style={{ marginTop: '0.5rem', color: '#2a8a3e', fontWeight: 600 }}>
              MST weight = {kruskal.accepted.reduce((s, e) => s + e.w, 0)}. Cycle detection used {kruskal.edges.length} union-find ops.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
