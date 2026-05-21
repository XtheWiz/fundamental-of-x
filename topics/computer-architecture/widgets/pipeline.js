// Pipeline widget: grid view of instructions × cycles, with stages.
// Two modes: "ideal" (no stalls) and "data hazard" (one stall).

const STAGES = ['F', 'D', 'E', 'M', 'W'];
const STAGE_LABELS = ['Fetch', 'Decode', 'Execute', 'Memory', 'Writeback'];

const SCENARIOS = {
  ideal: {
    label: 'Ideal (no hazards)',
    instructions: [
      'ADD r1, r2, r3',
      'SUB r4, r5, r6',
      'MUL r7, r8, r9',
      'LD  r10, [r11]',
      'XOR r12, r13, r14',
    ],
    stalls: [],
  },
  hazard: {
    label: 'Data hazard (instr 3 needs instr 2)',
    instructions: [
      'ADD r1, r2, r3',
      'LD  r4, [r5]',        // load takes longer, result not ready until M
      'ADD r6, r4, r1',      // ← depends on r4, must stall
      'SUB r7, r8, r9',
      'XOR r10, r11, r12',
    ],
    // (instruction index, # of bubble cycles before this instruction's Decode→Execute can proceed)
    stalls: [{ instr: 2, bubbles: 1 }],
  },
};

export function initPipelineWidget(root) {
  let scenario = 'ideal';
  let cycle = 0;
  const maxCycles = 12;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">5-stage pipeline</div>

      <div class="controls">
        <label>Scenario:</label>
        <div class="pill-group">
          <input type="radio" name="pp-scen" id="pp-ideal" value="ideal" checked>
          <label for="pp-ideal">Ideal</label>
          <input type="radio" name="pp-scen" id="pp-haz" value="hazard">
          <label for="pp-haz">Data hazard</label>
        </div>
        <button class="btn btn-accent" id="pp-next">Next cycle →</button>
        <button class="btn" id="pp-run">Run to end</button>
        <button class="btn btn-ghost" id="pp-reset">Reset</button>
      </div>

      <div class="widget-stage" id="pp-stage" style="min-height: 320px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Cycle</div><div class="value" id="m-cyc">0</div></div>
        <div class="metric"><div class="label">Completed</div><div class="value" id="m-done">0</div></div>
        <div class="metric accent"><div class="label">IPC</div><div class="value" id="m-ipc">—</div></div>
      </div>

      <div class="callout" id="pp-explain">
        Click "Next cycle →" to step. In the ideal scenario, all 5 instructions complete in 9 cycles (1 cycle + 4 to fill the pipe). The hazard scenario adds a stall.
      </div>
    </div>
  `;

  const stage = root.querySelector('#pp-stage');
  root.querySelectorAll('input[name=pp-scen]').forEach((r) =>
    r.addEventListener('change', (e) => { scenario = e.target.value; cycle = 0; render(); })
  );
  root.querySelector('#pp-next').addEventListener('click', () => { if (cycle < maxCycles) cycle++; render(); });
  root.querySelector('#pp-run').addEventListener('click', async () => {
    while (cycle < maxCycles && !isDone()) {
      cycle++; render();
      await wait(220);
    }
  });
  root.querySelector('#pp-reset').addEventListener('click', () => { cycle = 0; render(); });

  function getCellForInstr(instrIdx) {
    // Returns array indexed by cycle where each cell is either a stage letter or '·' (no activity yet) or '—' (stall)
    const cells = [];
    const sc = SCENARIOS[scenario];
    // First, find total stall cycles before this instruction starts feeling them.
    let pre = 0;
    for (const s of sc.stalls) if (s.instr === instrIdx) pre = s.bubbles;
    // base start = instrIdx (one cycle lag per instruction)
    const start = instrIdx;

    for (let c = 0; c < maxCycles; c++) {
      if (c < start) { cells.push(null); continue; }
      const relCycle = c - start;
      // Without stalls: stage index = relCycle
      // For this instruction's stalls: after Decode (stage 1), insert `pre` bubble cycles
      let stageIdx;
      if (relCycle < 2) {
        // Fetch + Decode complete normally
        stageIdx = relCycle;
      } else if (relCycle < 2 + pre) {
        // Stall bubbles
        cells.push('STALL');
        continue;
      } else {
        stageIdx = relCycle - pre;
      }
      // Also account for stalls that happened in earlier instructions pushing this one out
      // (For simplicity in this demo, each later instruction also picks up the same pre-shift.)
      let cumulativeStall = 0;
      for (const s of sc.stalls) {
        if (s.instr < instrIdx) cumulativeStall += s.bubbles;
      }
      const adjustedRelCycle = relCycle - cumulativeStall;
      if (adjustedRelCycle < 0) { cells.push(null); continue; }
      // recompute stageIdx for adjusted timing
      if (adjustedRelCycle < 2) {
        stageIdx = adjustedRelCycle;
      } else if (adjustedRelCycle < 2 + pre) {
        cells.push('STALL');
        continue;
      } else {
        stageIdx = adjustedRelCycle - pre;
      }

      if (stageIdx < STAGES.length) cells.push(STAGES[stageIdx]);
      else cells.push(null);
    }
    return cells;
  }

  function isDone() {
    const sc = SCENARIOS[scenario];
    for (let i = 0; i < sc.instructions.length; i++) {
      const cells = getCellForInstr(i);
      // last cell up to current cycle is W?
      let lastSeen = null;
      for (let c = 0; c <= cycle && c < maxCycles; c++) lastSeen = cells[c] ?? lastSeen;
      if (lastSeen !== 'W') return false;
    }
    return true;
  }

  function render() {
    const sc = SCENARIOS[scenario];
    let html = `<div class="pp-grid">`;
    // header row
    html += `<div class="pp-header pp-instr-label">instruction</div>`;
    for (let c = 0; c < maxCycles; c++) {
      html += `<div class="pp-header">${c + 1}</div>`;
    }
    // rows
    let completed = 0;
    sc.instructions.forEach((instr, i) => {
      html += `<div class="pp-instr-label" title="${escape(instr)}"><code>${escape(instr)}</code></div>`;
      const cells = getCellForInstr(i);
      for (let c = 0; c < maxCycles; c++) {
        const v = cells[c];
        if (c > cycle - 1) {
          html += `<div class="pp-cell"></div>`;
        } else if (v === null) {
          html += `<div class="pp-cell pp-empty"></div>`;
        } else if (v === 'STALL') {
          html += `<div class="pp-cell ca-stage-stall" title="pipeline stall">—</div>`;
        } else {
          const stageIdx = STAGES.indexOf(v);
          const stageCls = ['ca-stage-fetch','ca-stage-decode','ca-stage-exec','ca-stage-mem','ca-stage-wb'][stageIdx];
          html += `<div class="pp-cell ${stageCls}" title="${STAGE_LABELS[stageIdx]}">${v}</div>`;
          if (v === 'W' && c <= cycle - 1) completed++;
        }
      }
    });
    html += `</div>`;

    // legend
    html += `<div class="pp-legend">`;
    STAGES.forEach((s, i) => {
      html += `<div class="pp-legend-item"><div class="pp-cell ${['ca-stage-fetch','ca-stage-decode','ca-stage-exec','ca-stage-mem','ca-stage-wb'][i]}" style="width: 26px; height: 26px;">${s}</div> ${STAGE_LABELS[i]}</div>`;
    });
    html += `<div class="pp-legend-item"><div class="pp-cell ca-stage-stall" style="width: 26px; height: 26px;">—</div> Stall</div>`;
    html += `</div>`;

    html += `<style>
      .pp-grid { display: grid; grid-template-columns: 160px repeat(${maxCycles}, 1fr); gap: 2px; margin: 0.6rem 0; }
      .pp-header { font-family: var(--font-mono); font-size: 0.75rem; text-align: center; padding: 0.3em 0; color: var(--ink-soft); }
      .pp-instr-label { font-family: var(--font-mono); font-size: 0.75rem; padding: 0.4em 0.3em; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .pp-cell { font-family: var(--font-mono); font-size: 0.9rem; text-align: center; padding: 0.5em 0; border: 1.5px solid var(--ink); border-radius: 2px; min-width: 28px; }
      .pp-cell.pp-empty { border-style: dashed; background: var(--paper); opacity: 0.3; }
      .pp-legend { display: flex; gap: 0.8rem; flex-wrap: wrap; margin: 0.6rem 0 0; font-family: var(--font-mono); font-size: 0.8rem; }
      .pp-legend-item { display: flex; align-items: center; gap: 0.4em; }
    </style>`;
    stage.innerHTML = html;

    root.querySelector('#m-cyc').textContent = cycle;
    root.querySelector('#m-done').textContent = completed;
    root.querySelector('#m-ipc').textContent = cycle === 0 ? '—' : (completed / cycle).toFixed(2);

    if (scenario === 'hazard' && cycle >= 3 && cycle <= 5) {
      root.querySelector('#pp-explain').innerHTML = `Instruction 3 needs <code>r4</code> — but <code>r4</code> is being loaded by instruction 2 and won't be ready until cycle 5. Pipeline stalls (bubble cycle) until then.`;
    } else if (cycle >= 9) {
      const ideal = scenario === 'ideal' ? 9 : 10;
      root.querySelector('#pp-explain').innerHTML = `Done in <strong>${cycle} cycles</strong> for 5 instructions. ${scenario === 'ideal' ? 'IPC ≈ 0.56 — ideal minus fill cost.' : 'One extra cycle of stall reduced IPC slightly.'} Modern CPUs hide most stalls with bypass paths and out-of-order execution.`;
    }
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  render();
}
