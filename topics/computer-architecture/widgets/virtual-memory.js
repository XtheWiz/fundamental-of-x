// Virtual memory widget: pick a virtual address, walk TLB → page table
// → physical address. Show TLB hits speeding up repeat lookups.

const PAGE_SIZE = 0x1000;   // 4 KB
const NUM_VPAGES = 8;
const TLB_SIZE = 4;

// Page table: virtual page → physical frame (deliberately not monotonic)
const PAGE_TABLE = [
  { vp: 0, pf: 5 },
  { vp: 1, pf: 2 },
  { vp: 2, pf: 7 },
  { vp: 3, pf: 1 },
  { vp: 4, pf: 4 },
  { vp: 5, pf: 9 },
  { vp: 6, pf: 0 },
  { vp: 7, pf: 6 },
];

const ADDR_PRESETS = [
  { v: 0x4123, label: '0x4123 — first access'  },
  { v: 0x4456, label: '0x4456 — same page, different offset' },
  { v: 0x2080, label: '0x2080 — different page' },
  { v: 0x4789, label: '0x4789 — back to page 4 (TLB hit?)' },
];

export function initVirtualMemoryWidget(root) {
  const state = {
    tlb: [],     // [{vp, pf, recent}]
    lastVp: null,
    lastPf: null,
    lastOffset: null,
    lastHit: null,
    hits: 0,
    misses: 0,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Virtual → Physical translation</div>

      <div class="controls">
        <label>Access:</label>
        ${ADDR_PRESETS.map((p, i) => `<button class="btn" data-addr="${p.v}">${p.label}</button>`).join('')}
        <button class="btn btn-ghost" id="vm-reset">Flush TLB</button>
      </div>

      <div class="widget-stage" id="vm-stage" style="min-height: 340px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">TLB hits</div><div class="value" id="m-hit">0</div></div>
        <div class="metric"><div class="label">TLB misses</div><div class="value" id="m-miss">0</div></div>
        <div class="metric accent"><div class="label">Last translation</div><div class="value" id="m-last">—</div></div>
      </div>

      <div class="callout" id="vm-explain">Click any "Access" button. The first time you touch a page, it costs a full page-walk; subsequent accesses to the same page hit the TLB.</div>
    </div>
  `;

  root.querySelectorAll('button[data-addr]').forEach((b) =>
    b.addEventListener('click', () => translate(Number(b.dataset.addr)))
  );
  root.querySelector('#vm-reset').addEventListener('click', () => {
    state.tlb = [];
    state.lastVp = null;
    state.lastPf = null;
    state.lastOffset = null;
    state.lastHit = null;
    state.hits = 0; state.misses = 0;
    render();
  });

  function translate(virt) {
    const vp = Math.floor(virt / PAGE_SIZE);
    const offset = virt % PAGE_SIZE;
    const tlbEntry = state.tlb.find((e) => e.vp === vp);
    let pf;
    if (tlbEntry) {
      pf = tlbEntry.pf;
      state.hits++;
      state.lastHit = 'TLB hit';
    } else {
      const pte = PAGE_TABLE.find((e) => e.vp === vp);
      pf = pte.pf;
      // Insert into TLB (LRU eviction)
      state.tlb.push({ vp, pf });
      if (state.tlb.length > TLB_SIZE) state.tlb.shift();
      state.misses++;
      state.lastHit = 'TLB miss → page-walked';
    }
    state.lastVp = vp;
    state.lastPf = pf;
    state.lastOffset = offset;
    render();
  }

  function render() {
    let html = `<div class="vm-grid">`;

    // TLB
    html += `<div class="vm-section">
      <div class="vm-section-title">TLB (${TLB_SIZE} entries)</div>
      <div class="vm-tlb">`;
    for (let i = 0; i < TLB_SIZE; i++) {
      const e = state.tlb[i];
      const isLast = e && e.vp === state.lastVp && state.lastHit === 'TLB hit';
      html += `<div class="vm-tlb-row ${isLast ? 'lit' : ''}">${e ? `vp ${e.vp} → pf ${e.pf}` : '<span style="color: var(--ink-faint);">empty</span>'}</div>`;
    }
    html += `</div></div>`;

    // Page Table
    html += `<div class="vm-section">
      <div class="vm-section-title">Page Table (in RAM)</div>
      <div class="vm-pt">`;
    PAGE_TABLE.forEach((e) => {
      const isLit = e.vp === state.lastVp && state.lastHit && state.lastHit.includes('miss');
      html += `<div class="vm-pt-row ${isLit ? 'lit' : ''}"><span class="vm-vp">vp ${e.vp}</span> → <span class="vm-pf">pf ${e.pf}</span></div>`;
    });
    html += `</div></div>`;

    // Physical RAM
    html += `<div class="vm-section">
      <div class="vm-section-title">Physical RAM (10 frames)</div>
      <div class="vm-frames">`;
    for (let i = 0; i < 10; i++) {
      const isLit = i === state.lastPf;
      const used = PAGE_TABLE.some((e) => e.pf === i);
      html += `<div class="vm-frame ${isLit ? 'lit' : ''} ${used ? 'used' : ''}">pf ${i}</div>`;
    }
    html += `</div></div>`;

    html += `</div>`;

    html += `<style>
      .vm-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.6rem; }
      @media (max-width: 720px) { .vm-grid { grid-template-columns: 1fr; } }
      .vm-section { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem; }
      .vm-section-title { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.9rem; margin-bottom: 0.4em; }
      .vm-tlb-row, .vm-pt-row { font-family: var(--font-mono); font-size: 0.8rem; padding: 0.25em 0.4em; border: 1.5px solid var(--ink); border-radius: 2px; background: var(--paper); margin: 0.15em 0; }
      .vm-tlb-row.lit, .vm-pt-row.lit { background: var(--accent-soft); border-color: var(--accent); }
      .vm-frames { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.2rem; }
      .vm-frame { font-family: var(--font-mono); font-size: 0.78rem; padding: 0.3em 0.4em; border: 1.5px solid var(--ink); border-radius: 2px; background: var(--paper); text-align: center; }
      .vm-frame.used { background: var(--paper-deep); }
      .vm-frame.lit { background: var(--accent); color: white; border-color: var(--accent); }
    </style>`;
    root.querySelector('#vm-stage').innerHTML = html;

    root.querySelector('#m-hit').textContent = state.hits;
    root.querySelector('#m-miss').textContent = state.misses;
    if (state.lastVp !== null) {
      root.querySelector('#m-last').textContent = `0x${(state.lastPf * PAGE_SIZE + state.lastOffset).toString(16)}`;
    }

    if (state.lastHit) {
      root.querySelector('#vm-explain').innerHTML = `<strong>${state.lastHit}.</strong> virtual page ${state.lastVp} → physical frame ${state.lastPf}. Combined with offset 0x${state.lastOffset.toString(16)}, the physical address is 0x${(state.lastPf * PAGE_SIZE + state.lastOffset).toString(16)}.`;
    }
  }

  render();
}
