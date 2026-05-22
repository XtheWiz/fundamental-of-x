// SIMD widget: scalar vs vectorized multiplication of 8 numbers by 2.
// Step through cycles, see scalar take 8 cycles while SIMD takes 1.

const VALUES = [3, 7, 2, 11, 4, 9, 5, 6];
const MULTIPLIER = 2;

export function initSimdWidget(root) {
  let cycle = 0;
  let running = false;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Scalar vs SIMD multiplication</div>
      <p class="widget-hint">Both compute <code>v[i] = v[i] × ${MULTIPLIER}</code> for 8 values.</p>

      <div class="controls">
        <button class="btn btn-accent" id="simd-step">Next cycle →</button>
        <button class="btn" id="simd-run">Run animation</button>
        <button class="btn btn-ghost" id="simd-reset">Reset</button>
      </div>

      <div class="widget-stage" id="simd-stage" style="min-height: 320px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Cycle</div><div class="value" id="m-cyc">0</div></div>
        <div class="metric"><div class="label">Scalar done</div><div class="value" id="m-scalar">0/8</div></div>
        <div class="metric accent"><div class="label">SIMD done</div><div class="value" id="m-simd">0/8</div></div>
      </div>

      <div class="callout" id="simd-explain">In scalar code, the CPU executes one multiplication per cycle. With SIMD it executes one <em>vector</em> multiplication that handles all 8 elements at once.</div>
    </div>
  `;

  const stage = root.querySelector('#simd-stage');
  root.querySelector('#simd-step').addEventListener('click', () => { if (cycle < 8) cycle++; render(); });
  root.querySelector('#simd-run').addEventListener('click', async () => {
    if (running) return; running = true;
    while (cycle < 8) { cycle++; render(); await wait(400); }
    running = false;
  });
  root.querySelector('#simd-reset').addEventListener('click', () => { cycle = 0; render(); });

  function render() {
    const W = 720;
    const H = 320;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<style>
      .si-label { font-family: var(--font-display); letter-spacing: 1.5px; font-size: 1.1rem; fill: var(--ink); }
      .si-sub { font-family: var(--font-mono); font-size: 0.75rem; fill: var(--ink-soft); }
      .si-cell-num { font-family: var(--font-mono); font-size: 14px; fill: var(--ink); }
      .si-cell { stroke: var(--ink); stroke-width: 2; fill: var(--paper); }
      .si-cell.done { fill: #d6f5d6; }
      .si-cell.current { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 2.5; }
      .si-alu { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 2.5; }
      .si-alu.active { fill: var(--accent-soft); stroke: var(--accent); }
      .si-arrow { stroke: var(--ink); stroke-width: 1.5; fill: none; marker-end: url(#si-arrow); }
    </style>`;
    svg += `<defs><marker id="si-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/></marker></defs>`;

    // SCALAR
    svg += `<text class="si-label" x="20" y="30">SCALAR (1 wide)</text>`;
    svg += `<text class="si-sub" x="20" y="48">${cycle} of 8 cycles</text>`;
    // 8 cells, sequential ALU
    for (let i = 0; i < 8; i++) {
      const x = 50 + i * 60;
      const done = i < cycle;
      const cur = i === cycle - 1;
      svg += `<rect class="si-cell ${done ? 'done' : ''} ${cur ? 'current' : ''}" x="${x}" y="60" width="50" height="40" rx="3"/>`;
      svg += `<text class="si-cell-num" x="${x + 25}" y="85" text-anchor="middle">${done ? VALUES[i] * MULTIPLIER : VALUES[i]}</text>`;
    }
    // ALU box
    const aluActive = cycle > 0 && cycle <= 8;
    svg += `<rect class="si-alu ${aluActive ? 'active' : ''}" x="${50 + (cycle - 1) * 60}" y="120" width="50" height="40" rx="4" ${cycle === 0 ? 'style="opacity:0.3"' : ''}/>`;
    svg += `<text class="si-cell-num" x="${50 + (cycle - 1) * 60 + 25}" y="146" text-anchor="middle" style="font-weight: 700;" ${cycle === 0 ? 'style="opacity:0.3"' : ''}>× ${MULTIPLIER}</text>`;
    svg += `<text class="si-sub" x="20" y="135">ALU →</text>`;

    // SIMD
    svg += `<text class="si-label" x="20" y="210">SIMD (8 wide)</text>`;
    svg += `<text class="si-sub" x="20" y="228">${cycle >= 1 ? '1 of 1 cycle' : '0 of 1 cycle'}</text>`;
    // 8 cells, single vector operation
    for (let i = 0; i < 8; i++) {
      const x = 50 + i * 60;
      const done = cycle >= 1;
      svg += `<rect class="si-cell ${done ? 'done' : ''} ${done && cycle === 1 ? 'current' : ''}" x="${x}" y="240" width="50" height="40" rx="3"/>`;
      svg += `<text class="si-cell-num" x="${x + 25}" y="265" text-anchor="middle">${done ? VALUES[i] * MULTIPLIER : VALUES[i]}</text>`;
    }
    // Big vector ALU
    svg += `<rect class="si-alu ${cycle >= 1 ? 'active' : ''}" x="50" y="295" width="${50 + 7*60 - 50 + 50}" height="20" rx="4" ${cycle === 0 ? 'style="opacity:0.5"' : ''}/>`;
    svg += `<text class="si-cell-num" x="285" y="310" text-anchor="middle" style="font-weight: 700;">vector × ${MULTIPLIER}</text>`;

    svg += `</svg>`;
    stage.innerHTML = svg;

    root.querySelector('#m-cyc').textContent = cycle;
    root.querySelector('#m-scalar').textContent = `${cycle}/8`;
    root.querySelector('#m-simd').textContent = cycle >= 1 ? '8/8' : '0/8';

    if (cycle === 0) {
      root.querySelector('#simd-explain').innerHTML = `Same input array, two execution models. Click "Next cycle →" to compare.`;
    } else if (cycle === 1) {
      root.querySelector('#simd-explain').innerHTML = `<strong>Cycle 1</strong>: scalar processes element 0 (1/8 done). SIMD processed all 8 in the same cycle (8/8 done). One instruction did the work of 8.`;
    } else if (cycle < 8) {
      root.querySelector('#simd-explain').innerHTML = `Scalar still grinding through (${cycle}/8). SIMD has been done for ${cycle - 1} cycles already. This is the 8× speedup compilers target with vectorization.`;
    } else {
      root.querySelector('#simd-explain').innerHTML = `Scalar finished after 8 cycles. SIMD finished after 1. Same answer; 8× less time. AVX-512 widens the gap to 16×.`;
    }
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  render();
}
