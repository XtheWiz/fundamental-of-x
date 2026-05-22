import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const PROGRAM = [
  { line: 'a = 1',     def: 'a', use: [] },
  { line: 'b = 2',     def: 'b', use: [] },
  { line: 'c = a + b', def: 'c', use: ['a', 'b'] },
  { line: 'd = c * 2', def: 'd', use: ['c'] },
  { line: 'e = a + d', def: 'e', use: ['a', 'd'] },
  { line: 'f = e + 1', def: 'f', use: ['e'] },
  { line: 'out = f',   def: 'out', use: ['f'] },
];
const VARS = ['a', 'b', 'c', 'd', 'e', 'f'];

function liveRanges() {
  const r = {};
  PROGRAM.forEach((ins, i) => {
    if (ins.def && VARS.includes(ins.def)) {
      r[ins.def] = r[ins.def] || [i, i];
      r[ins.def][0] = Math.min(r[ins.def][0], i);
      r[ins.def][1] = Math.max(r[ins.def][1], i);
    }
    ins.use.forEach((u) => {
      if (VARS.includes(u)) {
        r[u] = r[u] || [i, i];
        r[u][1] = Math.max(r[u][1], i);
      }
    });
  });
  return r;
}

function buildEdges(ranges) {
  const edges = [];
  for (let i = 0; i < VARS.length; i++) {
    for (let j = i + 1; j < VARS.length; j++) {
      const a = ranges[VARS[i]], b = ranges[VARS[j]];
      if (!(a[1] < b[0] || b[1] < a[0])) edges.push([VARS[i], VARS[j]]);
    }
  }
  return edges;
}

function color(edges, k) {
  const adj = Object.fromEntries(VARS.map((v) => [v, new Set()]));
  edges.forEach(([a, b]) => { adj[a].add(b); adj[b].add(a); });
  const result = {};
  for (const v of VARS) {
    const used = new Set();
    adj[v].forEach((n) => { if (result[n] !== undefined) used.add(result[n]); });
    let c = 0;
    while (used.has(c) && c < k) c++;
    if (c >= k) return null;
    result[v] = c;
  }
  return result;
}

const REG_NAMES = ['rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi'];
const REG_COLORS = ['#d62828', '#2b6cb0', '#388e3c', '#f59e0b', '#7e57c2', '#0097a7'];

export default function RegallocWidget() {
  const [k, setK] = useState(3);
  const ranges = useMemo(() => liveRanges(), []);
  const edges = useMemo(() => buildEdges(ranges), [ranges]);
  const coloring = useMemo(() => color(edges, k), [edges, k]);

  // Ranges grid
  const W1 = 600, rowH = 26;
  const H1 = PROGRAM.length * rowH + 30;
  const lineX = 240;
  const slotW = (W1 - lineX - 30) / VARS.length;

  // Interference graph (circular layout)
  const W2 = 420, H2 = 220;
  const cx = W2 / 2, cy = H2 / 2;
  const r = 80;
  const pos = {};
  VARS.forEach((v, i) => {
    const ang = (i / VARS.length) * Math.PI * 2 - Math.PI / 2;
    pos[v] = { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
  });

  const minK = (() => {
    for (let i = 1; i <= 6; i++) if (color(edges, i)) return i;
    return null;
  })();

  return (
    <div className="widget">
      <div className="widget-title">Live ranges → interference graph → coloring</div>
      <div className="controls">
        <label>Registers (K):</label>
        <input type="range" min={1} max={6} value={k} onChange={(e) => setK(+e.target.value)} style={{ width: 200 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{k}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.3rem' }}>Program &amp; live ranges</div>
          <div className="widget-stage" style={{ minHeight: 180 }}>
            <svg viewBox={`0 0 ${W1} ${H1}`} width="100%" style={{ maxWidth: W1 }}>
              {VARS.map((v, i) => {
                const c = coloring && coloring[v] !== undefined ? REG_COLORS[coloring[v]] : '#ccc';
                return (
                  <g key={v}>
                    <text x={lineX + i * slotW + slotW / 2} y={18} textAnchor="middle"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>{v}</text>
                    <motion.rect x={lineX + i * slotW + slotW / 2 - 5} y={22} width={10} height={3} fill={c}
                      animate={{ fill: c }} transition={{ duration: 0.25 }} />
                  </g>
                );
              })}
              {PROGRAM.map((ins, lineIdx) => {
                const y = 35 + lineIdx * rowH;
                return (
                  <g key={lineIdx}>
                    <text x={10} y={y + 12} style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{(lineIdx + 1).toString().padStart(2, '0')}</text>
                    <text x={35} y={y + 12} style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{ins.line}</text>
                    {VARS.map((v, i) => {
                      const rng = ranges[v];
                      if (rng && lineIdx >= rng[0] && lineIdx <= rng[1]) {
                        const c = coloring && coloring[v] !== undefined ? REG_COLORS[coloring[v]] : '#bbb';
                        return <motion.rect key={v} x={lineX + i * slotW + slotW / 2 - 6} y={y} width={12} height={rowH - 4}
                          fill={c} opacity={0.6} animate={{ fill: c }} transition={{ duration: 0.25 }} />;
                      }
                      return null;
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.3rem' }}>Interference graph &amp; coloring</div>
          <div className="widget-stage" style={{ minHeight: 220 }}>
            <svg viewBox={`0 0 ${W2} ${H2}`} width="100%" style={{ maxWidth: W2 }}>
              {edges.map(([a, b], i) => (
                <line key={i} x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y}
                  stroke="var(--ink)" strokeWidth={1.5} opacity={0.5} />
              ))}
              {VARS.map((v) => {
                const c = coloring && coloring[v] !== undefined ? REG_COLORS[coloring[v]] : '#ccc';
                return (
                  <g key={v}>
                    <motion.circle cx={pos[v].x} cy={pos[v].y} r={20} fill={c} stroke="var(--ink)" strokeWidth={2}
                      animate={{ fill: c }} transition={{ duration: 0.25 }} />
                    <text x={pos[v].x} y={pos[v].y + 5} textAnchor="middle"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, fill: 'white' }}>{v}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
      <div className="callout">
        {coloring
          ? <><strong>Colored with {k} registers.</strong>{' '}
              {VARS.map((v) => `${v}→${REG_NAMES[coloring[v]]}`).join(', ')}.{' '}
              Variables that don't interfere share a register.</>
          : <><strong>Can't fit in {k} registers.</strong> The allocator would <em>spill</em> a variable to the stack. Minimum needed: {minK}.</>}
      </div>
    </div>
  );
}
