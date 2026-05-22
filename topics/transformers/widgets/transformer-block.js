// Transformer block widget: step through the layers of one block,
// showing what each step does to a token's vector.

const STEPS = [
  { label: 'Input embedding',         note: 'Token enters with a 768-dim vector from the previous layer (or the embedding table, if this is layer 0).' },
  { label: 'LayerNorm 1',             note: 'Normalize across the 768 dims: subtract the mean, divide by std. Then scale + shift by learned parameters.' },
  { label: 'Multi-Head Attention',    note: 'Mix in information from every other token. The horizontal step. Output is the same shape: 768-dim per token.' },
  { label: 'Residual Add',            note: 'Add the attention output back to the input. The original signal can still pass through unchanged.' },
  { label: 'LayerNorm 2',             note: 'Normalize again.' },
  { label: 'Feed-Forward',            note: 'Per-token MLP: 768 → 3072 (with GELU/ReLU) → 768. No cross-token mixing — pure point-wise compute.' },
  { label: 'Residual Add',            note: 'Add the FFN output back. Output goes to the next block.' },
];

export function initBlockWidget(root) {
  let step = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">One block, seven sub-steps</div>

      <div class="controls">
        <button class="btn" id="tb-prev">← Back</button>
        <button class="btn btn-accent" id="tb-next">Next step →</button>
        <button class="btn btn-ghost" id="tb-reset">Reset</button>
        <span style="margin-left: auto; font-family: var(--font-mono);" id="tb-counter">0 / ${STEPS.length}</span>
      </div>

      <div class="widget-stage" id="tb-stage" style="min-height: 380px;"></div>

      <div class="callout" id="tb-note">Click "Next step →" to walk through the block.</div>
    </div>
  `;

  root.querySelector('#tb-next').addEventListener('click', () => { if (step < STEPS.length) step++; render(); });
  root.querySelector('#tb-prev').addEventListener('click', () => { if (step > 0) step--; render(); });
  root.querySelector('#tb-reset').addEventListener('click', () => { step = 0; render(); });

  function render() {
    let html = `<div class="tb-flow">`;
    STEPS.forEach((s, i) => {
      const done = i < step;
      const cur = i === step - 1;
      const isAttn = i === 2;
      const isFFN = i === 5;
      const isResidual = i === 3 || i === 6;
      const colors = isAttn ? '#cfe5ff' : isFFN ? '#c8f0c8' : isResidual ? '#ffe9b3' : 'var(--paper)';
      html += `
        <div class="tb-step ${done ? 'done' : ''} ${cur ? 'cur' : ''}" style="background: ${done ? colors : 'var(--paper-deep)'};">
          <div class="tb-step-num">${String(i + 1).padStart(2, '0')}</div>
          <div class="tb-step-label">${escape(s.label)}</div>
        </div>
        ${i < STEPS.length - 1 ? '<div class="tb-arrow">↓</div>' : ''}
      `;
    });
    html += `</div>`;
    html += `<style>
      .tb-flow { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
      .tb-step { display: grid; grid-template-columns: 40px 1fr; align-items: center; gap: 0.5rem; min-width: 320px; padding: 0.5rem 0.8rem; border: 2px solid var(--ink); border-radius: var(--radius); opacity: 0.4; }
      .tb-step.done { opacity: 1; box-shadow: 3px 3px 0 var(--ink); }
      .tb-step.cur { box-shadow: 4px 4px 0 var(--accent); border-color: var(--accent); }
      .tb-step-num { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-soft); text-align: center; }
      .tb-step-label { font-family: var(--font-display); letter-spacing: 0.04em; }
      .tb-arrow { font-family: var(--font-display); font-size: 1.4rem; color: var(--ink-faint); }
    </style>`;
    root.querySelector('#tb-stage').innerHTML = html;

    root.querySelector('#tb-counter').textContent = `${step} / ${STEPS.length}`;
    root.querySelector('#tb-note').innerHTML = step > 0 ? STEPS[step - 1].note : 'Click "Next step →" to walk through the block.';
  }
  function escape(s) { return String(s).replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  render();
}
