// NISQ widget: gate error rate vs circuit depth, with a 'usefulness' line.
// Show what depth is doable at various error rates.

const ERROR_RATES = [
  { label: 'Today (~2024)', perGate: 0.005 },     // 0.5% per gate
  { label: 'Best demonstrated', perGate: 0.001 }, // 0.1%
  { label: 'Threshold for QEC', perGate: 0.0001 },// 0.01%
  { label: 'Future (FT)', perGate: 0.000001 },    // 0.0001%
];

const CIRCUIT_DEPTH_NEEDED = {
  'Toy Grover (16 items)':       50,
  'Toy quantum chemistry':       500,
  'Useful Shor on 2048-bit RSA': 1e10,
  'Quantum advantage in ML':     1e6,
};

export function initNisqWidget(root) {
  let rateIdx = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Error rate → max useful circuit depth</div>

      <div class="controls">
        <label>Error rate:</label>
        <div class="pill-group">
          ${ERROR_RATES.map((r, i) => `
            <input type="radio" name="nq-r" id="nq-${i}" value="${i}" ${i === 0 ? 'checked' : ''}>
            <label for="nq-${i}">${r.label}</label>
          `).join('')}
        </div>
      </div>

      <div class="widget-stage" id="nq-stage" style="min-height: 280px;"></div>

      <div class="callout" id="nq-explain"></div>
    </div>
  `;

  root.querySelectorAll('input[name=nq-r]').forEach((r) =>
    r.addEventListener('change', (e) => { rateIdx = Number(e.target.value); render(); })
  );

  function render() {
    const rate = ERROR_RATES[rateIdx];
    // Useful = error rate ⋅ depth < 0.1 (heuristic threshold)
    const maxDepth = 0.1 / rate.perGate;

    let html = `
      <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; margin-bottom: 0.6rem;">
        <div style="font-family: var(--font-mono); font-size: 0.8rem;">Per-gate error rate: <strong>${(rate.perGate * 100).toFixed(4)}%</strong></div>
        <div style="font-family: var(--font-mono); font-size: 0.8rem;">Max useful circuit depth: <strong>${Math.round(maxDepth).toLocaleString()}</strong> gates</div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.3rem;">
        ${Object.entries(CIRCUIT_DEPTH_NEEDED).map(([name, needed]) => {
          const possible = needed <= maxDepth;
          return `<div style="display: grid; grid-template-columns: 1fr 100px 100px; gap: 0.5rem; align-items: center; padding: 0.35em 0.7em; background: ${possible ? '#d6f5d6' : 'var(--accent-soft)'}; border: 1.5px solid var(--ink); border-radius: 3px;">
            <div style="font-family: var(--font-mono); font-size: 0.85rem;">${name}</div>
            <div style="font-family: var(--font-mono); font-size: 0.78rem; text-align: right;">needs ${needed.toLocaleString()}</div>
            <div style="font-family: var(--font-display); font-size: 0.95rem; text-align: center;">${possible ? '✓ OK' : '✗ noise dominates'}</div>
          </div>`;
        }).join('')}
      </div>
    `;
    root.querySelector('#nq-stage').innerHTML = html;

    let exp;
    if (rateIdx === 0) exp = `Today's machines can run shallow circuits — small Grover, NISQ-friendly chemistry. Anything deep gets drowned in noise. That's why useful Shor is still science fiction.`;
    else if (rateIdx <= 1) exp = `Best lab demos. Most academic papers' results are run here, briefly, before noise wins.`;
    else if (rateIdx === 2) exp = `<strong>Threshold for surface-code error correction.</strong> Below this, encoding more qubits actually <em>reduces</em> the logical error rate. We're inching past this in 2024–2025.`;
    else exp = `<strong>The fault-tolerant regime.</strong> With error correction on top of this, billions of gates become possible. This is what Shor needs. Decades away at current rate of progress.`;
    root.querySelector('#nq-explain').innerHTML = exp;
  }
  render();
}
