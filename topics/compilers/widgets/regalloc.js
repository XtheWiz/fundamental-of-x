// Regalloc widget: show live ranges, interference graph, and coloring.

// A small program. Each instruction has defs (variables written) and uses (read).
const PROGRAM = [
  { line: 'a = 1',         def: 'a', use: [] },
  { line: 'b = 2',         def: 'b', use: [] },
  { line: 'c = a + b',     def: 'c', use: ['a', 'b'] },
  { line: 'd = c * 2',     def: 'd', use: ['c'] },
  { line: 'e = a + d',     def: 'e', use: ['a', 'd'] },
  { line: 'f = e + 1',     def: 'f', use: ['e'] },
  { line: 'out = f',       def: 'out', use: ['f'] },
];

const VARS = ['a', 'b', 'c', 'd', 'e', 'f'];

// Compute live ranges (each var: [firstLine, lastLine] inclusive).
function liveRanges() {
  const ranges = {};
  PROGRAM.forEach((ins, i) => {
    if (ins.def && VARS.includes(ins.def)) {
      ranges[ins.def] = ranges[ins.def] || [i, i];
      ranges[ins.def][0] = Math.min(ranges[ins.def][0], i);
      ranges[ins.def][1] = Math.max(ranges[ins.def][1], i);
    }
    ins.use.forEach((u) => {
      if (VARS.includes(u)) {
        ranges[u] = ranges[u] || [i, i];
        ranges[u][1] = Math.max(ranges[u][1], i);
      }
    });
  });
  return ranges;
}

function interferes(rA, rB) {
  return !(rA[1] < rB[0] || rB[1] < rA[0]);
}

function buildGraph(ranges) {
  const edges = [];
  for (let i = 0; i < VARS.length; i++) {
    for (let j = i + 1; j < VARS.length; j++) {
      if (interferes(ranges[VARS[i]], ranges[VARS[j]])) {
        edges.push([VARS[i], VARS[j]]);
      }
    }
  }
  return edges;
}

// Greedy coloring with K colors. Returns { var: colorIdx } or null on failure.
function color(edges, k) {
  const adj = {};
  VARS.forEach((v) => adj[v] = new Set());
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

export function initRegallocWidget(root) {
  let k = 3;
  const ranges = liveRanges();
  const edges = buildGraph(ranges);

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Live ranges → interference graph → coloring</div>
      <div class="controls">
        <label>Registers (K):</label>
        <input type="range" id="ra-k" min="1" max="6" value="3" style="width:200px;">
        <span id="ra-kval" style="font-family:var(--font-mono);font-weight:600;">3</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr;gap:1rem;">
        <div>
          <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--ink-soft);margin-bottom:0.3rem;">Program &amp; live ranges</div>
          <div class="widget-stage" id="ra-ranges" style="min-height:180px;"></div>
        </div>
        <div>
          <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--ink-soft);margin-bottom:0.3rem;">Interference graph &amp; coloring</div>
          <div class="widget-stage" id="ra-graph" style="min-height:220px;"></div>
        </div>
      </div>
      <div class="callout" id="ra-explain"></div>
    </div>
  `;

  function renderRanges(coloring) {
    const W = 600, rowH = 26;
    const H = PROGRAM.length * rowH + 30;
    const lineX = 240;
    const slotW = (W - lineX - 30) / VARS.length;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    // var headers
    VARS.forEach((v, i) => {
      const color = coloring && coloring[v] !== undefined ? REG_COLORS[coloring[v]] : '#ccc';
      svg += `<text x="${lineX + i*slotW + slotW/2}" y="18" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:600;">${v}</text>`;
      svg += `<rect x="${lineX + i*slotW + slotW/2 - 5}" y="22" width="10" height="3" fill="${color}"/>`;
    });
    // live range bars
    PROGRAM.forEach((ins, lineIdx) => {
      const y = 35 + lineIdx * rowH;
      svg += `<text x="10" y="${y + 12}" style="font-family:var(--font-mono);font-size:11px;">${(lineIdx+1).toString().padStart(2,'0')}</text>`;
      svg += `<text x="35" y="${y + 12}" style="font-family:var(--font-mono);font-size:11px;">${ins.line}</text>`;
      VARS.forEach((v, i) => {
        const r = ranges[v];
        if (r && lineIdx >= r[0] && lineIdx <= r[1]) {
          const color = coloring && coloring[v] !== undefined ? REG_COLORS[coloring[v]] : '#bbb';
          svg += `<rect x="${lineX + i*slotW + slotW/2 - 6}" y="${y}" width="12" height="${rowH - 4}" fill="${color}" opacity="0.6"/>`;
        }
      });
    });
    svg += `</svg>`;
    root.querySelector('#ra-ranges').innerHTML = svg;
  }

  function renderGraph(coloring) {
    const W = 420, H = 220;
    const cx = W/2, cy = H/2;
    const r = 80;
    const pos = {};
    VARS.forEach((v, i) => {
      const ang = (i / VARS.length) * Math.PI * 2 - Math.PI/2;
      pos[v] = { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
    });
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    edges.forEach(([a, b]) => {
      svg += `<line x1="${pos[a].x}" y1="${pos[a].y}" x2="${pos[b].x}" y2="${pos[b].y}" stroke="var(--ink)" stroke-width="1.5" opacity="0.5"/>`;
    });
    VARS.forEach((v) => {
      const c = coloring && coloring[v] !== undefined ? REG_COLORS[coloring[v]] : '#ccc';
      svg += `<circle cx="${pos[v].x}" cy="${pos[v].y}" r="20" fill="${c}" stroke="var(--ink)" stroke-width="2"/>`;
      svg += `<text x="${pos[v].x}" y="${pos[v].y + 5}" text-anchor="middle" style="font-family:var(--font-mono);font-size:13px;font-weight:700;fill:white;">${v}</text>`;
    });
    svg += `</svg>`;
    root.querySelector('#ra-graph').innerHTML = svg;
  }

  function render() {
    const coloring = color(edges, k);
    renderRanges(coloring);
    renderGraph(coloring);
    let exp = '';
    if (coloring) {
      const assigns = VARS.map((v) => `${v}→${REG_NAMES[coloring[v]]}`).join(', ');
      exp = `<strong>Colored with ${k} registers.</strong> ${assigns}. Variables that don't interfere share a register.`;
    } else {
      const minK = (() => {
        for (let i = 1; i <= 6; i++) if (color(edges, i)) return i;
        return null;
      })();
      exp = `<strong>Can't fit in ${k} registers.</strong> The allocator would <em>spill</em> a variable to the stack. Minimum needed: ${minK}.`;
    }
    root.querySelector('#ra-explain').innerHTML = exp;
  }

  root.querySelector('#ra-k').addEventListener('input', (e) => {
    k = +e.target.value;
    root.querySelector('#ra-kval').textContent = k;
    render();
  });
  render();
}
