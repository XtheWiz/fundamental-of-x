// False sharing widget: 4 cores incrementing 4 counters. Two layouts:
// "shared" (all on one cache line) vs "padded" (each on its own).
// Animated cache-line state churn, total cycle count at end.

const CORES = 4;
const INCREMENTS_PER_CORE = 8;

export function initFalseSharingWidget(root) {
  let layout = 'shared';
  let running = false;
  const state = {
    counters: [0, 0, 0, 0],
    lineState: ['I','I','I','I'],   // MESI state per core's view of the shared line
    invalidations: 0,
    cycles: 0,
    step: 0,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">4 cores, MESI in action</div>

      <div class="controls">
        <label>Layout:</label>
        <div class="pill-group">
          <input type="radio" name="fs-layout" id="fs-shared" value="shared" checked>
          <label for="fs-shared">Shared line (false sharing)</label>
          <input type="radio" name="fs-layout" id="fs-padded" value="padded">
          <label for="fs-padded">Padded (one line per counter)</label>
        </div>
        <button class="btn btn-accent" id="fs-run">Run ${INCREMENTS_PER_CORE} writes/core</button>
        <button class="btn btn-ghost" id="fs-reset">Reset</button>
      </div>

      <div class="widget-stage" id="fs-stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Writes total</div><div class="value" id="m-writes">0</div></div>
        <div class="metric accent"><div class="label">Cache invalidations</div><div class="value" id="m-inv">0</div></div>
        <div class="metric"><div class="label">Simulated cycles</div><div class="value" id="m-cyc">0</div></div>
      </div>

      <div class="callout" id="fs-explain">Pick a layout and run. Watch the cache-line state churn (or not).</div>
    </div>
  `;

  root.querySelectorAll('input[name=fs-layout]').forEach((r) =>
    r.addEventListener('change', (e) => { layout = e.target.value; reset(); })
  );
  root.querySelector('#fs-run').addEventListener('click', run);
  root.querySelector('#fs-reset').addEventListener('click', reset);

  function reset() {
    state.counters = [0,0,0,0];
    state.lineState = ['I','I','I','I'];
    state.invalidations = 0;
    state.cycles = 0;
    state.step = 0;
    render();
  }

  async function run() {
    if (running) return;
    running = true;
    reset();
    const schedule = [];
    for (let r = 0; r < INCREMENTS_PER_CORE; r++) {
      for (let c = 0; c < CORES; c++) {
        schedule.push(c);
      }
    }
    for (const c of schedule) {
      step(c);
      await wait(160);
    }
    running = false;
  }

  function step(core) {
    state.counters[core]++;
    if (layout === 'shared') {
      // The other cores' copies of the line are invalidated by this write.
      for (let i = 0; i < CORES; i++) {
        if (i !== core) {
          if (state.lineState[i] === 'S' || state.lineState[i] === 'M' || state.lineState[i] === 'E') {
            state.invalidations++;
          }
          state.lineState[i] = 'I';
        }
      }
      state.lineState[core] = 'M';
      // simulated cost: each invalidation = 30 cycles of coherence traffic
      state.cycles += 30 + 1;
    } else {
      // padded: each core's counter is on its own line, no cross-talk
      state.lineState[core] = 'M';
      state.cycles += 1;
    }
    state.step++;
    render();
  }

  function render() {
    let html = `<div class="fs-row">`;
    // line view
    if (layout === 'shared') {
      html += `
        <div class="fs-line-vis">
          <div class="fs-line-label">SHARED CACHE LINE (64 bytes)</div>
          <div class="fs-line">${state.counters.map((c, i) => `
            <div class="fs-line-slot ${state.lineState[i] === 'M' ? 'mod' : ''}">
              counter ${i}<br><strong>${c}</strong>
            </div>`).join('')}</div>
        </div>
      `;
    } else {
      html += `<div class="fs-line-vis">`;
      for (let i = 0; i < CORES; i++) {
        html += `
          <div class="fs-line-label">CACHE LINE ${i + 1} — counter ${i} only</div>
          <div class="fs-line"><div class="fs-line-slot ${state.lineState[i] === 'M' ? 'mod' : ''}" style="flex: 1;">counter ${i}<br><strong>${state.counters[i]}</strong></div></div>
        `;
      }
      html += `</div>`;
    }
    html += `</div>`;

    // core states
    html += `<div class="fs-cores">`;
    for (let i = 0; i < CORES; i++) {
      const s = state.lineState[i];
      const desc = { M: 'Modified — exclusive write', E: 'Exclusive — clean', S: 'Shared', I: 'Invalid — refetch on next read' }[s];
      html += `<div class="fs-core">
        <div class="fs-core-name">Core ${i}</div>
        <div class="fs-core-state ${s.toLowerCase()}">${s}</div>
        <div class="fs-core-desc">${desc}</div>
      </div>`;
    }
    html += `</div>`;

    html += `<style>
      .fs-line-vis { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; margin-bottom: 0.6rem; }
      .fs-line-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
      .fs-line { display: flex; gap: 0; border: 2px solid var(--ink); border-radius: var(--radius); overflow: hidden; margin-bottom: 0.4rem; }
      .fs-line-slot { flex: 1; padding: 0.4rem; background: var(--paper); text-align: center; font-family: var(--font-mono); font-size: 0.8rem; border-right: 1.5px solid var(--ink); }
      .fs-line-slot:last-child { border-right: none; }
      .fs-line-slot.mod { background: var(--accent-soft); }
      .fs-cores { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; }
      .fs-core { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem; text-align: center; }
      .fs-core-name { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.9rem; }
      .fs-core-state { font-family: var(--font-display); font-size: 1.6rem; margin: 0.2em 0; padding: 0.1em 0.3em; border: 2px solid var(--ink); border-radius: 4px; }
      .fs-core-state.m { background: var(--accent); color: white; }
      .fs-core-state.e { background: #c8f0c8; }
      .fs-core-state.s { background: #cfe5ff; }
      .fs-core-state.i { background: #eee; color: var(--ink-soft); }
      .fs-core-desc { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); }
      @media (max-width: 640px) { .fs-cores { grid-template-columns: repeat(2, 1fr); } }
    </style>`;
    root.querySelector('#fs-stage').innerHTML = html;

    root.querySelector('#m-writes').textContent = state.step;
    root.querySelector('#m-inv').textContent = state.invalidations;
    root.querySelector('#m-cyc').textContent = state.cycles;

    if (!state.step) {
      root.querySelector('#fs-explain').innerHTML = 'Pick a layout and click Run.';
    } else if (layout === 'shared') {
      const overhead = state.invalidations * 30;
      root.querySelector('#fs-explain').innerHTML = `Each core's write invalidates the others. <strong>${state.invalidations} invalidations</strong> so far, costing ~${overhead} cycles of coherence traffic. The same workload with padding would take ${state.step} cycles total.`;
    } else {
      root.querySelector('#fs-explain').innerHTML = `Each counter on its own cache line. No invalidations across cores. Total: ${state.step} cycles. Compare to the shared-line version.`;
    }
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  render();
}
