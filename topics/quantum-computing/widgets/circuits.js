// Quantum circuits widget: run the Bell-pair circuit step by step.
// Show 2-qubit state amplitudes after each gate.

const STEPS = [
  { label: '|00⟩', amps: { '00': 1, '01': 0, '10': 0, '11': 0 } },
  { label: 'H on q0 → (|00⟩ + |10⟩)/√2', amps: { '00': 0.707, '01': 0, '10': 0.707, '11': 0 } },
  { label: 'CNOT (q0→q1) → (|00⟩ + |11⟩)/√2 (Bell pair!)', amps: { '00': 0.707, '01': 0, '10': 0, '11': 0.707 } },
];

export function initCircuitsWidget(root) {
  let step = 0;
  let outcomes = [];

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Bell pair circuit</div>

      <div class="controls">
        <button class="btn" id="cc-prev">← Back</button>
        <button class="btn btn-accent" id="cc-next">Next gate →</button>
        <button class="btn" id="cc-meas">Measure 100×</button>
        <button class="btn btn-ghost" id="cc-reset">Reset</button>
      </div>

      <div class="widget-stage" id="cc-stage" style="min-height: 300px;"></div>

      <div class="callout" id="cc-explain"></div>
    </div>
  `;

  root.querySelector('#cc-prev').addEventListener('click', () => { if (step > 0) step--; outcomes = []; render(); });
  root.querySelector('#cc-next').addEventListener('click', () => { if (step < STEPS.length - 1) step++; outcomes = []; render(); });
  root.querySelector('#cc-meas').addEventListener('click', () => {
    const amps = STEPS[step].amps;
    for (let i = 0; i < 100; i++) {
      const r = Math.random();
      let cum = 0;
      for (const k of ['00', '01', '10', '11']) {
        cum += amps[k] ** 2;
        if (r < cum) { outcomes.push(k); break; }
      }
    }
    render();
  });
  root.querySelector('#cc-reset').addEventListener('click', () => { step = 0; outcomes = []; render(); });

  function render() {
    const s = STEPS[step];
    let html = `
      <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; font-family: var(--font-mono); margin-bottom: 0.6rem;">
        <div style="font-size: 0.75rem; color: var(--ink-soft);">CURRENT STATE</div>
        <div style="font-size: 1.1rem; margin-top: 0.3em;">${escape(s.label)}</div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem;">
        ${['00', '01', '10', '11'].map((k) => {
          const a = s.amps[k];
          const p = a * a;
          return `<div style="background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 0.9rem;">|${k}⟩</div>
            <div style="font-family: var(--font-mono); font-size: 0.8rem;">amp ${a.toFixed(3)}</div>
            <div style="height: 60px; display: flex; align-items: flex-end; justify-content: center; margin-top: 0.3rem;">
              <div style="width: 50%; height: ${p * 100}%; background: var(--accent); border: 1.5px solid var(--ink); border-radius: 2px;"></div>
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-soft);">P = ${(p*100).toFixed(0)}%</div>
          </div>`;
        }).join('')}
      </div>
    `;
    if (outcomes.length) {
      const tally = { '00': 0, '01': 0, '10': 0, '11': 0 };
      outcomes.forEach((o) => tally[o]++);
      html += `<div style="margin-top: 0.8rem;"><strong>Measured ${outcomes.length}×:</strong> ${Object.entries(tally).map(([k, v]) => `${k}: ${v}`).join(' · ')}</div>`;
    }
    root.querySelector('#cc-stage').innerHTML = html;

    let exp;
    if (step === 0) exp = `<strong>Initial state |00⟩.</strong> Both qubits in 0. 100% probability on |00⟩.`;
    else if (step === 1) exp = `<strong>After H on q0.</strong> First qubit is now in superposition. Note we don't have entanglement yet — q1 is still |0⟩ if you look at it alone.`;
    else exp = `<strong>Bell pair!</strong> CNOT linked the qubits. Now you only see |00⟩ or |11⟩ — never |01⟩ or |10⟩. Pure entanglement.`;
    root.querySelector('#cc-explain').innerHTML = exp;
  }
  function escape(s) { return String(s).replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  render();
}
