// P-N junction widget: show n-type, depletion region, p-type. A photon
// arrives, creates pair, electric field sweeps them apart through external circuit.

export function initPNJunctionWidget(root) {
  let step = 0;
  const STEPS = [
    'Initial: N-type (donor electrons) | depletion region | P-type (holes).',
    'A photon arrives at the depletion region.',
    'Photon absorbed → electron-hole pair created.',
    'Built-in field pulls electron toward N side, hole toward P side.',
    'Electron flows through external circuit (= current), recombines on P side.',
  ];

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">P-N junction with one photon event</div>

      <div class="controls">
        <button class="btn" id="pn-prev">← Back</button>
        <button class="btn btn-accent" id="pn-next">Next step →</button>
        <button class="btn btn-ghost" id="pn-reset">Reset</button>
      </div>

      <div class="widget-stage" id="pn-stage" style="text-align: center;"></div>
      <div class="callout" id="pn-explain"></div>
    </div>
  `;

  root.querySelector('#pn-prev').addEventListener('click', () => { if (step > 0) step--; render(); });
  root.querySelector('#pn-next').addEventListener('click', () => { if (step < STEPS.length - 1) step++; render(); });
  root.querySelector('#pn-reset').addEventListener('click', () => { step = 0; render(); });

  function render() {
    const W = 600, H = 260;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // N side
    svg += `<rect x="40" y="60" width="200" height="120" fill="#cfe5ff" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<text x="140" y="55" text-anchor="middle" style="font-family: var(--font-display); font-size: 14px;">N-type</text>`;
    // Depletion
    svg += `<rect x="240" y="60" width="80" height="120" fill="#ffe9b3" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<text x="280" y="55" text-anchor="middle" style="font-family: var(--font-display); font-size: 13px;">depletion</text>`;
    // P side
    svg += `<rect x="320" y="60" width="200" height="120" fill="#f7c8c8" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<text x="420" y="55" text-anchor="middle" style="font-family: var(--font-display); font-size: 14px;">P-type</text>`;
    // Field arrow
    svg += `<line x1="320" y1="120" x2="240" y2="120" stroke="var(--ink)" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#pn-arr-e)"/>`;
    svg += `<text x="280" y="200" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft);">built-in field</text>`;
    svg += `<defs>
      <marker id="pn-arr-e" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/></marker>
      <marker id="pn-arr-acc" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--accent)"/></marker>
    </defs>`;

    if (step >= 1) {
      svg += `<line x1="280" y1="20" x2="280" y2="60" stroke="var(--accent)" stroke-width="3" marker-end="url(#pn-arr-acc)"/>`;
      svg += `<text x="285" y="25" style="font-family: var(--font-mono); font-size: 11px; fill: var(--accent);">photon</text>`;
    }
    if (step >= 2) {
      svg += `<circle cx="280" cy="110" r="6" fill="#1c6dd0" stroke="var(--ink)" stroke-width="1.5"/>`;
      svg += `<text x="280" y="105" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px; fill: white;">e⁻</text>`;
      svg += `<circle cx="280" cy="140" r="6" fill="white" stroke="var(--ink)" stroke-width="1.5"/>`;
      svg += `<text x="280" y="143" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px;">h⁺</text>`;
    }
    if (step >= 3) {
      svg += `<line x1="280" y1="110" x2="150" y2="110" stroke="#1c6dd0" stroke-width="2" stroke-dasharray="3 2"/>`;
      svg += `<circle cx="150" cy="110" r="6" fill="#1c6dd0" stroke="var(--ink)" stroke-width="1.5"/>`;
      svg += `<line x1="280" y1="140" x2="420" y2="140" stroke="var(--ink-soft)" stroke-width="2" stroke-dasharray="3 2"/>`;
      svg += `<circle cx="420" cy="140" r="6" fill="white" stroke="var(--ink)" stroke-width="1.5"/>`;
    }
    if (step >= 4) {
      // External circuit
      svg += `<path d="M 140 60 L 140 30 L 420 30 L 420 60" fill="none" stroke="var(--accent)" stroke-width="2.5" marker-end="url(#pn-arr-acc)"/>`;
      svg += `<rect x="270" y="15" width="60" height="30" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>`;
      svg += `<text x="300" y="35" text-anchor="middle" style="font-family: var(--font-display); font-size: 11px;">LOAD</text>`;
      svg += `<text x="200" y="20" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px; fill: var(--accent);">electron current ↑</text>`;
    }
    svg += `</svg>`;
    root.querySelector('#pn-stage').innerHTML = svg;
    root.querySelector('#pn-explain').innerHTML = STEPS[step];
  }
  render();
}
