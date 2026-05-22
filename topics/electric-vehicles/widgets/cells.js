// Cells widget: compare battery chemistries on four axes.

const CHEMISTRIES = [
  { name: 'NMC / NCA',   density: 250, cost: 130, life: 1500, safety: 5, note: 'Tesla long-range, Mach-E. Best energy, lowest cycle life, highest fire risk.' },
  { name: 'LFP',         density: 180, cost: 90,  life: 4000, safety: 8, note: 'Tesla SR, BYD, CATL. Cheaper and lasts forever — at the price of range.' },
  { name: 'Solid-state', density: 400, cost: 250, life: 2500, safety: 9, note: 'Toyota, QuantumScape. Higher energy and safer, but factory yield is still terrible.' },
];

const AXES = [
  { key: 'density', label: 'Energy density (Wh/kg)', max: 500 },
  { key: 'cost',    label: 'Cost ($/kWh)',           max: 300, invert: true },
  { key: 'life',    label: 'Cycle life',             max: 5000 },
  { key: 'safety',  label: 'Safety (1–10)',          max: 10 },
];

export function initCellsWidget(root) {
  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Battery chemistry trade-offs</div>
      <div class="widget-stage" id="cells-stage"></div>
      <div class="callout"><strong>Pick two-and-a-half.</strong> NMC wins on range, LFP on cost and longevity, solid-state on (eventually) everything — but it does not yet ship at scale.</div>
    </div>
  `;

  function bar(value, max, invert) {
    const pct = Math.min(100, (value / max) * 100);
    const fillPct = invert ? Math.max(8, 100 - pct) : pct;
    return `<div style="position: relative; height: 14px; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: 3px; overflow: hidden;">
      <div style="height: 100%; width: ${fillPct}%; background: var(--accent);"></div>
    </div>`;
  }

  let html = `<div style="display: grid; gap: 0.8rem;">`;
  CHEMISTRIES.forEach((c) => {
    html += `<div style="border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; background: var(--paper);">
      <div style="font-family: var(--font-display); font-size: 1.2rem; color: var(--accent); margin-bottom: 0.3rem;">${c.name}</div>
      <div style="display: grid; grid-template-columns: 220px 1fr 70px; gap: 0.4rem 0.7rem; align-items: center; font-family: var(--font-mono); font-size: 0.78rem; margin-bottom: 0.4rem;">
        ${AXES.map((a) => `
          <div>${a.label}</div>
          <div>${bar(c[a.key], a.max, a.invert)}</div>
          <div style="text-align: right;">${c[a.key].toLocaleString()}</div>
        `).join('')}
      </div>
      <div style="font-size: 0.85rem; color: var(--ink-soft);">${c.note}</div>
    </div>`;
  });
  html += `</div>`;
  root.querySelector('#cells-stage').innerHTML = html;
}
