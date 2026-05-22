import { useMemo, useState } from 'react';

// 5x4 grid graph with weights; pathological so A* visibly does less work.
const COLS = 6, ROWS = 4;
const NODES = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) NODES.push({ id: `${c},${r}`, c, r, x: 60 + c * 80, y: 40 + r * 50 });
const EDGES = [];
NODES.forEach((n) => {
  if (n.c < COLS - 1) EDGES.push([n.id, `${n.c + 1},${n.r}`, 1 + ((n.c + n.r) % 3)]);
  if (n.r < ROWS - 1) EDGES.push([n.id, `${n.c},${n.r + 1}`, 1 + ((n.c * 2 + n.r) % 3)]);
});
const adj = NODES.reduce((m, n) => (m[n.id] = [], m), {});
EDGES.forEach(([a, b, w]) => { adj[a].push([b, w]); adj[b].push([a, w]); });

function nodeOf(id) { return NODES.find((n) => n.id === id); }
function manhattan(a, b) { return Math.abs(a.c - b.c) + Math.abs(a.r - b.r); }

function dijkstra(start, goal) {
  const dist = {}, prev = {}, visited = new Set(), explored = [];
  NODES.forEach((n) => { dist[n.id] = Infinity; });
  dist[start] = 0;
  const pq = [[0, start]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    explored.push(u);
    if (u === goal) break;
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) {
        dist[v] = d + w;
        prev[v] = u;
        pq.push([dist[v], v]);
      }
    }
  }
  const path = [];
  let cur = goal;
  while (cur && cur !== start) { path.unshift(cur); cur = prev[cur]; }
  if (cur === start) path.unshift(start);
  return { explored, path, dist: dist[goal] };
}

function astar(start, goal) {
  const goalNode = nodeOf(goal);
  const g = {}, prev = {}, visited = new Set(), explored = [];
  NODES.forEach((n) => { g[n.id] = Infinity; });
  g[start] = 0;
  const open = [[manhattan(nodeOf(start), goalNode), start]];
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]);
    const [, u] = open.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    explored.push(u);
    if (u === goal) break;
    for (const [v, w] of adj[u]) {
      const tentative = g[u] + w;
      if (tentative < g[v]) {
        g[v] = tentative;
        prev[v] = u;
        open.push([tentative + manhattan(nodeOf(v), goalNode), v]);
      }
    }
  }
  const path = [];
  let cur = goal;
  while (cur && cur !== start) { path.unshift(cur); cur = prev[cur]; }
  if (cur === start) path.unshift(start);
  return { explored, path, dist: g[goal] };
}

export default function ShortestPathsWidget() {
  const start = '0,0', goal = `${COLS - 1},${ROWS - 1}`;
  const dij = useMemo(() => dijkstra(start, goal), []);
  const ast = useMemo(() => astar(start, goal), []);
  const [mode, setMode] = useState('dijkstra');
  const r = mode === 'dijkstra' ? dij : ast;
  const exploredSet = new Set(r.explored);
  const pathSet = new Set(r.path);

  return (
    <div className="widget">
      <div className="widget-title">Dijkstra vs A* — same graph, very different exploration</div>
      <div className="controls">
        <button className={`btn ${mode === 'dijkstra' ? 'btn-accent' : ''}`} onClick={() => setMode('dijkstra')}>Dijkstra</button>
        <button className={`btn ${mode === 'astar' ? 'btn-accent' : ''}`} onClick={() => setMode('astar')}>A* (Manhattan)</button>
      </div>
      <div className="widget-stage" style={{ minHeight: 260 }}>
        <svg viewBox="0 0 540 240" width="100%" style={{ maxWidth: 540 }}>
          {EDGES.map(([a, b, w], i) => {
            const na = nodeOf(a), nb = nodeOf(b);
            const onPath = pathSet.has(a) && pathSet.has(b) && r.path.indexOf(a) >= 0 && r.path.indexOf(b) >= 0 && Math.abs(r.path.indexOf(a) - r.path.indexOf(b)) === 1;
            return (
              <g key={i}>
                <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke={onPath ? 'var(--accent)' : 'var(--ink-soft)'} strokeWidth={onPath ? 3 : 1.5} />
                <text x={(na.x + nb.x) / 2 + 3} y={(na.y + nb.y) / 2 - 2}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-faint)' }}>{w}</text>
              </g>
            );
          })}
          {NODES.map((n) => {
            const isStart = n.id === start, isGoal = n.id === goal;
            const inExplored = exploredSet.has(n.id);
            const inPath = pathSet.has(n.id);
            const fill = isStart ? '#2a8a3e' : isGoal ? '#d62828' : inPath ? 'var(--accent-soft)' : inExplored ? '#cfe5ff' : 'var(--paper)';
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={14} fill={fill} stroke="var(--ink)" strokeWidth={2} />
                {(isStart || isGoal) && <text x={n.x} y={n.y + 4} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, fill: 'white' }}>
                  {isStart ? 'S' : 'G'}
                </text>}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="metrics">
        <div className="metric"><div className="label">Nodes explored</div><div className="value">{r.explored.length} / {NODES.length}</div></div>
        <div className="metric accent"><div className="label">Path cost</div><div className="value">{r.dist}</div></div>
        <div className="metric"><div className="label">Path length</div><div className="value">{r.path.length} nodes</div></div>
      </div>
      <div className="callout">
        Dijkstra explored <strong>{dij.explored.length}</strong> nodes. A* explored <strong>{ast.explored.length}</strong>. Both find the optimal path (cost {dij.dist}) — A* just gets there with less work by biasing search toward the goal.
      </div>
    </div>
  );
}
