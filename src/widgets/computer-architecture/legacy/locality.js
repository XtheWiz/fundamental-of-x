// Memory locality widget: AoS vs SoA layout for 16 structs of 4
// int fields. A 64-byte cache line holds 16 ints. Show which cells
// are read for two access patterns.

const NUM_STRUCTS = 16;
const FIELDS = ['x', 'y', 'z', 'w'];
const CACHE_LINE_INTS = 16;  // 16 × 4 bytes = 64 bytes

const QUERIES = {
  sumX:   { label: 'sum every struct\'s x field',  wantField: 'x', wantStruct: null },
  oneStruct: { label: 'compute on struct #3 (all fields)', wantField: null, wantStruct: 3 },
};

export function initLocalityWidget(root) {
  let layout = 'aos';
  let query = 'sumX';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Cache lines on two layouts</div>

      <div class="controls">
        <label>Layout:</label>
        <div class="pill-group">
          <input type="radio" name="loc-layout" id="loc-aos" value="aos" checked>
          <label for="loc-aos">Array of Structs</label>
          <input type="radio" name="loc-layout" id="loc-soa" value="soa">
          <label for="loc-soa">Struct of Arrays</label>
        </div>
        <label>Query:</label>
        <select class="field" id="loc-query">
          ${Object.entries(QUERIES).map(([id, q]) => `<option value="${id}">${q.label}</option>`).join('')}
        </select>
      </div>

      <div class="widget-stage" id="loc-stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Cache lines read</div><div class="value" id="m-lines">0</div></div>
        <div class="metric"><div class="label">Useful bytes</div><div class="value" id="m-useful">0</div></div>
        <div class="metric"><div class="label">Wasted bytes</div><div class="value" id="m-wasted">0</div></div>
        <div class="metric accent"><div class="label">Efficiency</div><div class="value" id="m-eff">—</div></div>
      </div>

      <div class="callout" id="loc-explain"></div>
    </div>
  `;

  root.querySelectorAll('input[name=loc-layout]').forEach((r) =>
    r.addEventListener('change', (e) => { layout = e.target.value; render(); })
  );
  root.querySelector('#loc-query').addEventListener('change', (e) => { query = e.target.value; render(); });

  function render() {
    // Build the int sequence based on layout
    const memory = []; // each cell: { label, useful }
    const q = QUERIES[query];
    if (layout === 'aos') {
      for (let i = 0; i < NUM_STRUCTS; i++) {
        for (const f of FIELDS) {
          const useful = (q.wantField === f || q.wantStruct === i && q.wantField === null) ||
                         (q.wantStruct === i && q.wantField === null) ||
                         (q.wantField === f && q.wantStruct === null);
          memory.push({ label: `${f}${i}`, useful, field: f, struct: i });
        }
      }
    } else {
      for (const f of FIELDS) {
        for (let i = 0; i < NUM_STRUCTS; i++) {
          const useful = (q.wantField === f) || (q.wantStruct === i);
          memory.push({ label: `${f}${i}`, useful, field: f, struct: i });
        }
      }
    }

    // Determine which cache lines need to be read
    const lines = [];
    for (let l = 0; l < memory.length / CACHE_LINE_INTS; l++) {
      const start = l * CACHE_LINE_INTS;
      const end = start + CACHE_LINE_INTS;
      const slice = memory.slice(start, end);
      const needed = slice.some((c) => c.useful);
      lines.push({ start, end, needed, slice });
    }

    // Render visualization
    let html = `<div class="loc-mem">`;
    lines.forEach((line, idx) => {
      html += `<div class="loc-line ${line.needed ? 'needed' : 'skipped'}">`;
      html += `<div class="loc-line-label">Cache line ${idx + 1} (64 B)</div>`;
      html += `<div class="loc-cells">`;
      line.slice.forEach((c) => {
        let cls = 'loc-cell';
        if (!line.needed) cls += ' cold';
        else if (c.useful) cls += ' useful';
        else cls += ' wasted';
        html += `<div class="${cls}">${c.label}</div>`;
      });
      html += `</div></div>`;
    });
    html += `</div>`;
    html += `<style>
      .loc-mem { display: flex; flex-direction: column; gap: 0.4rem; }
      .loc-line { padding: 0.4rem 0.5rem; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper); }
      .loc-line.needed { box-shadow: 3px 3px 0 var(--ink); }
      .loc-line.skipped { opacity: 0.4; background: repeating-linear-gradient(45deg, transparent 0 5px, var(--hatch) 5px 6px), var(--paper); }
      .loc-line-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); margin-bottom: 0.3em; text-transform: uppercase; letter-spacing: 0.08em; }
      .loc-cells { display: grid; grid-template-columns: repeat(16, 1fr); gap: 2px; }
      .loc-cell { font-family: var(--font-mono); font-size: 0.7rem; padding: 0.3em 0; text-align: center; border: 1px solid var(--ink); background: var(--paper); }
      .loc-cell.useful { background: var(--accent); color: white; }
      .loc-cell.wasted { background: var(--paper-deep); color: var(--ink-soft); opacity: 0.7; }
      .loc-cell.cold { background: var(--paper); color: var(--ink-faint); }
    </style>`;
    root.querySelector('#loc-stage').innerHTML = html;

    // metrics
    const linesRead = lines.filter((l) => l.needed).length;
    const useful = memory.filter((c) => c.useful).length * 4;
    const wasted = (linesRead * CACHE_LINE_INTS * 4) - useful;
    const total = linesRead * 64;
    const eff = total === 0 ? 0 : Math.round((useful / total) * 100);
    root.querySelector('#m-lines').textContent = linesRead;
    root.querySelector('#m-useful').textContent = useful + ' B';
    root.querySelector('#m-wasted').textContent = wasted + ' B';
    root.querySelector('#m-eff').textContent = eff + '%';

    // explain
    let msg;
    if (query === 'sumX' && layout === 'aos') {
      msg = `<strong>Worst case.</strong> Summing every x field reads all 4 cache lines (you can't skip any), but only 1/4 of each line is the x's you want. Efficiency: ${eff}%.`;
    } else if (query === 'sumX' && layout === 'soa') {
      msg = `<strong>Best case for SoA.</strong> All 16 x's fit in one cache line. Read it, sum them, done. ${eff}% efficient — perfect.`;
    } else if (query === 'oneStruct' && layout === 'aos') {
      msg = `<strong>Best case for AoS.</strong> Struct #3's four fields are 16 bytes, all in one cache line. Just one read. ${eff}% efficient on the relevant line.`;
    } else if (query === 'oneStruct' && layout === 'soa') {
      msg = `<strong>Worst case for SoA on a single-struct query.</strong> Each of struct #3's four fields lives in a different cache line — 4 separate reads, almost all of each line wasted. ${eff}% efficient.`;
    }
    root.querySelector('#loc-explain').innerHTML = msg;
  }

  render();
}
