import { useMemo, useState } from 'react';

const NODES = [
  { id: 'A', x: 100, y: 60 },
  { id: 'B', x: 220, y: 60 },
  { id: 'C', x: 340, y: 60 },
  { id: 'D', x: 100, y: 160 },
  { id: 'E', x: 220, y: 160 },
  { id: 'F', x: 340, y: 160 },
  { id: 'G', x: 460, y: 110 },
];
const EDGES = [
  ['A', 'B'], ['B', 'C'], ['A', 'D'], ['B', 'E'], ['C', 'F'],
  ['D', 'E'], ['E', 'F'], ['C', 'G'], ['F', 'G'],
];

const adjList = NODES.reduce((acc, n) => { acc[n.id] = []; return acc; }, {});
EDGES.forEach(([a, b]) => { adjList[a].push(b); adjList[b].push(a); });

function bfs(start) {
  const steps = [];
  const visited = new Set([start]);
  const queue = [start];
  steps.push({ frontier: [...queue], visited: new Set(visited), current: null });
  while (queue.length) {
    const u = queue.shift();
    steps.push({ frontier: [...queue], visited: new Set(visited), current: u });
    for (const v of adjList[u]) {
      if (!visited.has(v)) { visited.add(v); queue.push(v); }
    }
    steps.push({ frontier: [...queue], visited: new Set(visited), current: u });
  }
  return steps;
}

function dfs(start) {
  const steps = [];
  const visited = new Set();
  const stack = [start];
  steps.push({ frontier: [...stack], visited: new Set(visited), current: null });
  while (stack.length) {
    const u = stack.pop();
    if (visited.has(u)) continue;
    visited.add(u);
    steps.push({ frontier: [...stack], visited: new Set(visited), current: u });
    for (const v of [...adjList[u]].reverse()) {
      if (!visited.has(v)) stack.push(v);
    }
    steps.push({ frontier: [...stack], visited: new Set(visited), current: u });
  }
  return steps;
}

export default function GraphTraversalWidget() {
  const [mode, setMode] = useState('BFS');
  const [start, setStart] = useState('A');
  const [stepIdx, setStepIdx] = useState(0);
  const steps = useMemo(() => mode === 'BFS' ? bfs(start) : dfs(start), [mode, start]);
  const safe = Math.min(stepIdx, steps.length - 1);
  const s = steps[safe];

  return (
    <div className="widget">
      <div className="widget-title">BFS vs DFS — same graph, different orders</div>
      <div className="controls">
        <button className={`btn ${mode === 'BFS' ? 'btn-accent' : ''}`} onClick={() => { setMode('BFS'); setStepIdx(0); }}>BFS (queue)</button>
        <button className={`btn ${mode === 'DFS' ? 'btn-accent' : ''}`} onClick={() => { setMode('DFS'); setStepIdx(0); }}>DFS (stack)</button>
        <label style={{ marginLeft: '1rem' }}>Start:</label>
        {NODES.map((n) => (
          <button key={n.id} className={`btn ${start === n.id ? 'btn-accent' : ''}`}
            onClick={() => { setStart(n.id); setStepIdx(0); }}>{n.id}</button>
        ))}
      </div>
      <div className="controls">
        <button className="btn btn-accent" onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}>Next step</button>
        <button className="btn btn-ghost" onClick={() => setStepIdx(0)}>Reset</button>
      </div>
      <div className="widget-stage" style={{ minHeight: 240 }}>
        <svg viewBox="0 0 560 220" width="100%" style={{ maxWidth: 560 }}>
          {EDGES.map(([a, b], i) => {
            const na = NODES.find((n) => n.id === a);
            const nb = NODES.find((n) => n.id === b);
            return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke="var(--ink-soft)" strokeWidth={2} />;
          })}
          {NODES.map((n) => {
            const isVisited = s.visited.has(n.id);
            const isCurrent = s.current === n.id;
            const isFrontier = s.frontier.includes(n.id);
            const fill = isCurrent ? 'var(--accent)' : isVisited ? '#2a8a3e' : isFrontier ? '#f59e0b' : 'var(--paper)';
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={22} fill={fill} stroke="var(--ink)" strokeWidth={2.5}
                  style={{ transition: 'all 0.2s ease' }} />
                <text x={n.x} y={n.y + 5} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, fill: isVisited || isCurrent ? 'white' : 'var(--ink)' }}>
                  {n.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="metrics">
        <div className="metric"><div className="label">Algorithm</div><div className="value">{mode}</div></div>
        <div className="metric"><div className="label">Visited</div><div className="value">{s.visited.size} / {NODES.length}</div></div>
        <div className="metric accent"><div className="label">{mode === 'BFS' ? 'Queue' : 'Stack'}</div><div className="value">[{s.frontier.join(',')}]</div></div>
      </div>
      <div className="callout">
        {mode === 'BFS'
          ? <>BFS explores neighbours level by level. The <strong>queue</strong> (FIFO) holds nodes to visit; the closer-to-start ones come out first.</>
          : <>DFS goes deep before wide. The <strong>stack</strong> (LIFO) means we follow one branch all the way to a leaf before backtracking.</>}
      </div>
    </div>
  );
}
