import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Backtracking widget — DFS with pruning, visualised three ways.
//   * N-queens, Subset sum, Sudoku 4x4.
// Each solver is a generator yielding step events:
//   { kind: 'enter'|'reject'|'solution'|'backtrack', node, parent?, depth?, partial, reason? }
// The recursion tree is built incrementally from those events.

// ---- Problem 1: N-queens -------------------------------------------------
function* solveQueens(N, prune) {
  const cols = [];
  let id = 1;
  const safe = (r, c) => {
    for (let i = 0; i < r; i++) {
      if (cols[i] === c) return { ok: false, reason: `column ${c} taken` };
      if (Math.abs(cols[i] - c) === r - i) return { ok: false, reason: 'diagonal hit' };
    }
    return { ok: true };
  };
  function* dfs(row, parent, depth) {
    if (row === N) { yield { kind: 'solution', node: parent, partial: cols.slice() }; return; }
    for (let c = 0; c < N; c++) {
      const nid = id++;
      yield { kind: 'enter', node: nid, parent, depth, partial: [...cols, c] };
      cols.push(c);
      const ck = prune ? safe(row, c) : { ok: true };
      if (!ck.ok) { yield { kind: 'reject', node: nid, reason: ck.reason, partial: cols.slice() }; cols.pop(); continue; }
      yield* dfs(row + 1, nid, depth + 1);
      cols.pop();
      yield { kind: 'backtrack', node: nid, partial: cols.slice() };
    }
  }
  yield* dfs(0, 0, 1);
}

// ---- Problem 2: Subset sum -----------------------------------------------
function* solveSubset(nums, target, prune) {
  const chosen = [];
  let id = 1;
  function* dfs(idx, sum, parent, depth) {
    if (sum === target) { yield { kind: 'solution', node: parent, partial: { chosen: chosen.slice(), sum } }; return; }
    if (idx === nums.length) return;
    // include
    const iId = id++;
    yield { kind: 'enter', node: iId, parent, depth, partial: { chosen: [...chosen, idx], sum: sum + nums[idx] } };
    chosen.push(idx);
    if (prune && sum + nums[idx] > target) {
      yield { kind: 'reject', node: iId, reason: `sum ${sum + nums[idx]} > ${target}`, partial: { chosen: chosen.slice(), sum: sum + nums[idx] } };
    } else {
      yield* dfs(idx + 1, sum + nums[idx], iId, depth + 1);
    }
    chosen.pop();
    yield { kind: 'backtrack', node: iId, partial: { chosen: chosen.slice(), sum } };
    // exclude
    const eId = id++;
    const rest = nums.slice(idx + 1).reduce((a, b) => a + b, 0);
    yield { kind: 'enter', node: eId, parent, depth, partial: { chosen: chosen.slice(), sum } };
    if (prune && sum + rest < target) {
      yield { kind: 'reject', node: eId, reason: `can't reach ${target}`, partial: { chosen: chosen.slice(), sum } };
    } else {
      yield* dfs(idx + 1, sum, eId, depth + 1);
    }
    yield { kind: 'backtrack', node: eId, partial: { chosen: chosen.slice(), sum } };
  }
  yield* dfs(0, 0, 0, 1);
}

// ---- Problem 3: Sudoku 4x4 -----------------------------------------------
function* solveSudoku(grid0, prune) {
  const grid = grid0.map((r) => r.slice());
  let id = 1;
  const emptyCell = () => {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (grid[r][c] === 0) return [r, c];
    return null;
  };
  const check = (r, c, v) => {
    for (let i = 0; i < 4; i++) {
      if (i !== c && grid[r][i] === v) return { ok: false, reason: 'row hit' };
      if (i !== r && grid[i][c] === v) return { ok: false, reason: 'col hit' };
    }
    const br = Math.floor(r / 2) * 2, bc = Math.floor(c / 2) * 2;
    for (let dr = 0; dr < 2; dr++) for (let dc = 0; dc < 2; dc++) {
      const rr = br + dr, cc = bc + dc;
      if ((rr !== r || cc !== c) && grid[rr][cc] === v) return { ok: false, reason: 'box hit' };
    }
    return { ok: true };
  };
  function* dfs(parent, depth) {
    const cell = emptyCell();
    if (!cell) { yield { kind: 'solution', node: parent, partial: grid.map((r) => r.slice()) }; return; }
    const [r, c] = cell;
    for (let v = 1; v <= 4; v++) {
      const nid = id++;
      yield { kind: 'enter', node: nid, parent, depth, partial: grid.map((row, ri) => row.map((x, ci) => (ri === r && ci === c ? v : x))) };
      grid[r][c] = v;
      const ck = prune ? check(r, c, v) : { ok: true };
      if (!ck.ok) { yield { kind: 'reject', node: nid, reason: ck.reason, partial: grid.map((r) => r.slice()) }; grid[r][c] = 0; continue; }
      yield* dfs(nid, depth + 1);
      grid[r][c] = 0;
      yield { kind: 'backtrack', node: nid, partial: grid.map((r) => r.slice()) };
    }
  }
  yield* dfs(0, 1);
}

// ---- Registry & constants ------------------------------------------------
const SUBSET_NUMS = [3, 7, 1, 8, 5, 2];
const SUDOKU_GIVENS = [
  [1, 0, 0, 4],
  [0, 0, 2, 0],
  [0, 3, 0, 0],
  [4, 0, 0, 2],
];
const PROBLEMS = { queens: 'N-queens', subset: 'Subset sum', sudoku: 'Sudoku 4x4' };
const STEP_CAP = 5000;

// ---- Compact tree layout -------------------------------------------------
function layoutTree(nodes) {
  if (nodes.size === 0) return { positions: new Map(), maxDepth: 0, width: 0 };
  const children = new Map();
  for (const n of nodes.values()) {
    if (!children.has(n.parent)) children.set(n.parent, []);
    children.get(n.parent).push(n.id);
  }
  for (const arr of children.values()) arr.sort((a, b) => a - b);
  const positions = new Map();
  let slot = 0, maxDepth = 0;
  function visit(id, depth) {
    maxDepth = Math.max(maxDepth, depth);
    const kids = children.get(id) || [];
    if (kids.length === 0) { positions.set(id, { x: slot, y: depth }); slot += 1; return; }
    const start = slot;
    for (const k of kids) visit(k, depth + 1);
    positions.set(id, { x: (start + slot - 1) / 2, y: depth });
  }
  for (const r of children.get(0) || []) visit(r, 1);
  return { positions, maxDepth, width: slot };
}

// ---- Component -----------------------------------------------------------
export default function BacktrackingWidget() {
  const [problem, setProblem] = useState('queens');
  const [nQueens, setNQueens] = useState(5);
  const [target, setTarget] = useState(11);
  const [prune, setPrune] = useState(true);
  const [speed, setSpeed] = useState(120);
  const [, force] = useState(0);
  const stateRef = useRef(null);
  const playingRef = useRef(false);

  function makeState(p, opts) {
    let gen;
    if (p === 'queens') gen = solveQueens(opts.nQueens, opts.prune);
    else if (p === 'subset') gen = solveSubset(SUBSET_NUMS, opts.target, opts.prune);
    else gen = solveSudoku(SUDOKU_GIVENS, opts.prune);
    return { gen, nodes: new Map(), partial: null, stepCount: 0, branches: 0, pruned: 0,
      solutions: 0, depth: 0, done: false, lastReject: null, lastSolution: null, capped: false };
  }
  if (stateRef.current === null) stateRef.current = makeState('queens', { nQueens: 5, target: 11, prune: true });

  function reset(p = problem, opts) {
    stateRef.current = makeState(p, { nQueens, target, prune, ...(opts || {}) });
    playingRef.current = false;
    force((x) => x + 1);
  }
  function step() {
    const s = stateRef.current;
    if (s.done) return false;
    const r = s.gen.next();
    if (r.done) { s.done = true; force((x) => x + 1); return false; }
    const ev = r.value;
    s.stepCount += 1;
    if (s.stepCount >= STEP_CAP) { s.done = true; s.capped = true; }
    if (ev.kind === 'enter') {
      s.branches += 1;
      s.nodes.set(ev.node, { id: ev.node, parent: ev.parent, depth: ev.depth, status: 'open' });
      s.partial = ev.partial; s.depth = ev.depth;
    } else if (ev.kind === 'reject') {
      s.pruned += 1;
      const n = s.nodes.get(ev.node); if (n) n.status = 'reject';
      s.lastReject = ev.reason; s.partial = ev.partial;
    } else if (ev.kind === 'solution') {
      s.solutions += 1;
      const n = s.nodes.get(ev.node); if (n) n.status = 'solution';
      s.lastSolution = ev.partial; s.partial = ev.partial;
    } else if (ev.kind === 'backtrack') {
      const n = s.nodes.get(ev.node); if (n && n.status === 'open') n.status = 'closed';
      s.partial = ev.partial;
    }
    force((x) => x + 1);
    return !s.done;
  }
  async function play() {
    if (playingRef.current) { playingRef.current = false; force((x) => x + 1); return; }
    playingRef.current = true; force((x) => x + 1);
    while (playingRef.current && step()) await new Promise((r) => setTimeout(r, speed));
    playingRef.current = false; force((x) => x + 1);
  }
  useEffect(() => { reset(problem); /* eslint-disable-next-line */ }, [problem, nQueens, target, prune]);

  const s = stateRef.current;

  return (
    <div className="widget">
      <div className="widget-title">Backtracking — DFS with pruning</div>

      <div className="controls" role="radiogroup" aria-label="Problem">
        {Object.entries(PROBLEMS).map(([k, name]) => (
          <button key={k} className={`btn ${problem === k ? 'btn-accent' : ''}`} onClick={() => setProblem(k)}>{name}</button>
        ))}
      </div>

      <div className="controls" style={{ flexWrap: 'wrap', gap: '0.6rem 1rem' }}>
        {problem === 'queens' && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            N:
            <input type="range" min="4" max="8" step="1" value={nQueens} onChange={(e) => setNQueens(+e.target.value)} style={{ width: 110 }} />
            <span style={{ fontFamily: 'var(--font-mono)' }}>{nQueens}</span>
          </label>
        )}
        {problem === 'subset' && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            target:
            <input type="number" className="field" min="1" max="26" value={target}
              onChange={(e) => setTarget(Math.max(1, Math.min(26, +e.target.value || 0)))} style={{ width: 70 }} />
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
              from {'{' + SUBSET_NUMS.join(', ') + '}'}
            </span>
          </label>
        )}
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <input type="checkbox" checked={prune} onChange={(e) => setPrune(e.target.checked)} />
          prune (constraint checks)
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
          speed:
          <input type="range" min="0" max="400" step="10" value={400 - speed} onChange={(e) => setSpeed(400 - +e.target.value)} style={{ width: 110 }} />
        </label>
      </div>

      <div className="controls">
        <button className="btn btn-accent" onClick={play}>{playingRef.current ? 'Pause' : 'Play'}</button>
        <button className="btn" onClick={step} disabled={s.done}>Step</button>
        <button className="btn btn-ghost" onClick={() => reset()}>Reset</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          {s.done ? (s.capped ? `halted at ${STEP_CAP} steps` : 'finished') : `step ${s.stepCount}`}
        </span>
      </div>

      <div className="widget-stage" style={{ minHeight: 280, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto' }}>
          <PartialView problem={problem} state={s} nQueens={nQueens} />
        </div>
        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <RecursionTree nodes={s.nodes} />
        </div>
      </div>

      <div className="metrics">
        <div className="metric"><div className="label">Branches tried</div><div className="value">{s.branches}</div></div>
        <div className="metric accent"><div className="label">Branches pruned</div><div className="value">{s.pruned}</div></div>
        <div className="metric"><div className="label">Solutions</div><div className="value">{s.solutions}</div></div>
        <div className="metric"><div className="label">Current depth</div><div className="value">{s.depth}</div></div>
      </div>

      <div className="callout">
        {!prune && (
          <div style={{ color: 'var(--accent)', marginBottom: '0.4rem' }}>
            <strong>Pruning OFF.</strong> Every leaf of the full search tree is explored. For N-queens N=8 that is
            8<sup>8</sup> = 16,777,216 placements — capped here at {STEP_CAP} steps.
          </div>
        )}
        {prune && s.lastReject && !s.done && (
          <div>Last prune: <code style={{ fontFamily: 'var(--font-mono)' }}>{s.lastReject}</code> — backtracking instead of recursing further.</div>
        )}
        {s.done && s.solutions > 0 && (
          <div style={{ color: '#2a8a3e' }}>Found {s.solutions} solution{s.solutions === 1 ? '' : 's'} in {s.branches} explored branches ({s.pruned} pruned).</div>
        )}
        {s.done && s.solutions === 0 && !s.capped && <div>Search exhausted — no solution under these constraints.</div>}
      </div>
    </div>
  );
}

// ---- Partial-solution views ----------------------------------------------
function PartialView({ problem, state, nQueens }) {
  if (problem === 'queens') return <QueensBoard N={nQueens} cols={state.partial || []} solved={!!state.lastSolution} />;
  if (problem === 'subset') return <SubsetView partial={state.partial} />;
  return <SudokuView grid={state.partial || SUDOKU_GIVENS} givens={SUDOKU_GIVENS} solved={!!state.lastSolution} />;
}

function QueensBoard({ N, cols, solved }) {
  const cell = 28, W = N * cell, H = N * cell;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ border: '1.5px solid var(--ink)' }}>
      {Array.from({ length: N }).map((_, r) =>
        Array.from({ length: N }).map((__, c) => (
          <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell}
            fill={(r + c) % 2 ? 'var(--paper-deep)' : 'var(--paper)'} stroke="var(--ink-faint)" strokeWidth={0.5} />
        ))
      )}
      {cols.map((c, r) => (
        <motion.g key={`q-${r}`} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.18 }}>
          <circle cx={c * cell + cell / 2} cy={r * cell + cell / 2} r={cell * 0.32} fill={solved ? '#2a8a3e' : 'var(--ink)'} />
          <text x={c * cell + cell / 2} y={r * cell + cell / 2 + 4} textAnchor="middle"
            style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, fill: 'white' }}>Q</text>
        </motion.g>
      ))}
    </svg>
  );
}

function SubsetView({ partial }) {
  const sel = partial?.chosen || [], sum = partial?.sum || 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        {SUBSET_NUMS.map((n, i) => {
          const on = sel.includes(i);
          return (
            <div key={i} style={{
              width: 38, height: 38, display: 'grid', placeItems: 'center',
              border: '2px solid var(--ink)', borderRadius: 4,
              background: on ? 'var(--accent)' : 'var(--paper)', color: on ? 'white' : 'var(--ink)',
              fontFamily: 'var(--font-mono)', fontWeight: 700,
            }}>{n}</div>
          );
        })}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>sum = {sum}</div>
    </div>
  );
}

function SudokuView({ grid, givens, solved }) {
  const cell = 36;
  return (
    <svg viewBox={`0 0 ${4 * cell} ${4 * cell}`} width={4 * cell} height={4 * cell} style={{ border: '2px solid var(--ink)' }}>
      {grid.map((row, r) => row.map((v, c) => {
        const isGiven = givens[r][c] !== 0;
        return (
          <g key={`${r}-${c}`}>
            <rect x={c * cell} y={r * cell} width={cell} height={cell}
              fill={isGiven ? 'var(--paper-deep)' : solved ? '#e8f4ea' : 'var(--paper)'}
              stroke="var(--ink)" strokeWidth={(c % 2 === 0 || r % 2 === 0) ? 1.5 : 0.6} />
            {v !== 0 && (
              <text x={c * cell + cell / 2} y={r * cell + cell / 2 + 6} textAnchor="middle"
                style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: isGiven ? 700 : 500,
                  fill: isGiven ? 'var(--ink)' : (solved ? '#2a8a3e' : 'var(--accent)') }}>{v}</text>
            )}
          </g>
        );
      }))}
      <line x1={0} y1={2 * cell} x2={4 * cell} y2={2 * cell} stroke="var(--ink)" strokeWidth={2.5} />
      <line x1={2 * cell} y1={0} x2={2 * cell} y2={4 * cell} stroke="var(--ink)" strokeWidth={2.5} />
    </svg>
  );
}

// ---- Recursion tree ------------------------------------------------------
function RecursionTree({ nodes }) {
  const { positions, maxDepth, width } = useMemo(() => layoutTree(nodes), [nodes, nodes.size]);
  if (positions.size === 0) {
    return (
      <div style={{
        height: 220, display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)',
        border: '1px dashed var(--ink-faint)', borderRadius: 4,
      }}>recursion tree appears here as steps run</div>
    );
  }
  const W = Math.max(320, Math.min(width * 12 + 20, 900));
  const H = Math.max(140, maxDepth * 28 + 20);
  const dx = W / Math.max(1, width), dy = (H - 20) / Math.max(1, maxDepth);
  const color = (st) => st === 'reject' ? 'var(--ink-faint)' : st === 'solution' ? '#2a8a3e' : st === 'closed' ? 'var(--ink-soft)' : 'var(--accent)';
  const arr = [...nodes.values()];
  const legendStyle = { fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, border: '1px solid var(--ink-faint)', borderRadius: 4 }}>
      {arr.map((n) => {
        const p = positions.get(n.id), pp = positions.get(n.parent);
        if (!p || !pp || !nodes.get(n.parent)) return null;
        const x1 = pp.x * dx + dx / 2, y1 = pp.y * dy + 12;
        const x2 = p.x * dx + dx / 2, y2 = p.y * dy + 12;
        const dim = n.status === 'reject';
        return <line key={`e-${n.id}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={dim ? 'var(--ink-faint)' : 'var(--ink-soft)'} strokeWidth={1}
          strokeDasharray={dim ? '3 3' : undefined} />;
      })}
      {arr.map((n) => {
        const p = positions.get(n.id); if (!p) return null;
        const cx = p.x * dx + dx / 2, cy = p.y * dy + 12;
        const r = n.status === 'solution' ? 5 : 3.5;
        return <motion.circle key={`n-${n.id}`} cx={cx} cy={cy} r={r}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.12 }}
          fill={color(n.status)} stroke="var(--ink)" strokeWidth={0.8} opacity={n.status === 'reject' ? 0.5 : 1} />;
      })}
      <g transform={`translate(8, ${H - 8})`}>
        <circle cx={0} cy={-3} r={3} fill="var(--accent)" /><text x={7} y={0} style={legendStyle}>active</text>
        <circle cx={50} cy={-3} r={3} fill="var(--ink-soft)" /><text x={57} y={0} style={legendStyle}>closed</text>
        <circle cx={108} cy={-3} r={3} fill="var(--ink-faint)" /><text x={115} y={0} style={legendStyle}>pruned</text>
        <circle cx={168} cy={-3} r={3} fill="#2a8a3e" /><text x={175} y={0} style={legendStyle}>solution</text>
      </g>
    </svg>
  );
}
