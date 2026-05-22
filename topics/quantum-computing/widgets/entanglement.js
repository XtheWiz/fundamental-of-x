// Entanglement widget: Bell pair simulator. Measure Alice's qubit;
// Bob's outcome correlates perfectly. Show correlation table.

export function initEntanglementWidget(root) {
  let entangled = true;
  let outcomes = [];  // {a, b}

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Bell pair (|00⟩ + |11⟩)/√2 — vs an unentangled product state</div>

      <div class="controls">
        <label>State:</label>
        <div class="pill-group">
          <input type="radio" name="en-s" id="en-bell" value="bell" checked>
          <label for="en-bell">Bell pair (entangled)</label>
          <input type="radio" name="en-s" id="en-prod" value="prod">
          <label for="en-prod">Product (|+⟩|+⟩)</label>
        </div>
        <button class="btn btn-accent" id="en-meas">Measure both qubits 1×</button>
        <button class="btn" id="en-meas100">Measure 100×</button>
        <button class="btn btn-ghost" id="en-reset">Reset</button>
      </div>

      <div class="widget-stage" id="en-stage" style="min-height: 220px;"></div>

      <div class="callout" id="en-explain"></div>
    </div>
  `;

  root.querySelectorAll('input[name=en-s]').forEach((r) =>
    r.addEventListener('change', (e) => { entangled = e.target.value === 'bell'; outcomes = []; render(); })
  );
  root.querySelector('#en-meas').addEventListener('click', () => measure(1));
  root.querySelector('#en-meas100').addEventListener('click', () => measure(100));
  root.querySelector('#en-reset').addEventListener('click', () => { outcomes = []; render(); });

  function measure(n) {
    for (let i = 0; i < n; i++) {
      if (entangled) {
        // Bell pair: outcomes always equal
        const r = Math.random() < 0.5 ? 0 : 1;
        outcomes.push({ a: r, b: r });
      } else {
        // Two independent |+⟩ qubits — independent fair coins
        outcomes.push({ a: Math.random() < 0.5 ? 0 : 1, b: Math.random() < 0.5 ? 0 : 1 });
      }
    }
    render();
  }

  function render() {
    const tally = { '00': 0, '01': 0, '10': 0, '11': 0 };
    outcomes.forEach((o) => tally[`${o.a}${o.b}`]++);
    const n = outcomes.length;

    let html = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem;">
        ${['00', '01', '10', '11'].map((k) => {
          const c = tally[k];
          const pct = n === 0 ? 0 : c / n * 100;
          const expected = entangled ? (k === '00' || k === '11' ? 50 : 0) : 25;
          return `<div style="background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 1.1rem;">${k}</div>
            <div style="font-family: var(--font-display); font-size: 1.8rem; color: ${pct > 1 ? 'var(--accent)' : 'var(--ink-faint)'};">${pct.toFixed(0)}%</div>
            <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft);">expected ${expected}%</div>
          </div>`;
        }).join('')}
      </div>
      <div style="margin-top: 0.6rem; font-family: var(--font-mono); font-size: 0.85rem;">${n} measurements — pairs (a, b)</div>
    `;
    root.querySelector('#en-stage').innerHTML = html;

    let exp;
    if (n === 0) exp = `Pick a state and click measure.`;
    else if (entangled) exp = `<strong>Bell pair:</strong> outcomes are 100% correlated. You only see 00 or 11. Same measurement on Alice and Bob always agrees, even though each is individually 50/50.`;
    else exp = `<strong>Product state:</strong> each qubit is independently 50/50. You see all four outcomes 25% of the time. No correlation.`;
    root.querySelector('#en-explain').innerHTML = exp;
  }
  render();
}
