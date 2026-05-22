// Shor widget: pick an RSA key size, see classical vs quantum break time
// estimates + qubits needed.

const POINTS = [
  { rsaBits: 1024, classicalYears: 1, qubitsNeeded: 2050, notes: 'Already deprecated (since 2013).' },
  { rsaBits: 2048, classicalYears: 1e9, qubitsNeeded: 4096, notes: 'Current standard for HTTPS.' },
  { rsaBits: 3072, classicalYears: 1e13, qubitsNeeded: 6144, notes: 'Recommended for new keys.' },
  { rsaBits: 4096, classicalYears: 1e17, qubitsNeeded: 8192, notes: 'Used for long-lived root CAs.' },
];

export function initShorWidget(root) {
  let idx = 1;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">RSA key size vs quantum requirements</div>

      <div class="controls">
        <label>RSA key size:</label>
        <div class="pill-group">
          ${POINTS.map((p, i) => `
            <input type="radio" name="sh-k" id="sh-${i}" value="${i}" ${i === idx ? 'checked' : ''}>
            <label for="sh-${i}">${p.rsaBits}-bit</label>
          `).join('')}
        </div>
      </div>

      <div class="widget-stage" id="sh-stage" style="min-height: 220px;"></div>

      <div class="callout" id="sh-explain"></div>
    </div>
  `;

  root.querySelectorAll('input[name=sh-k]').forEach((r) =>
    r.addEventListener('change', (e) => { idx = Number(e.target.value); render(); })
  );

  function fmtTime(y) {
    if (y < 1) return `${(y * 365).toFixed(1)} days`;
    if (y < 1000) return `${y.toLocaleString()} years`;
    if (y < 1e6) return `${(y/1000).toFixed(0)}k years`;
    if (y < 1e9) return `${(y/1e6).toFixed(0)} million years`;
    if (y < 1e12) return `${(y/1e9).toFixed(0)} billion years`;
    return `${(y/1e12).toPrecision(2)} trillion years`;
  }

  function render() {
    const p = POINTS[idx];
    // Logical qubits → physical qubits at 1000:1 with current surface code
    const physQubits = p.qubitsNeeded * 1000;
    let html = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
        <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; box-shadow: 3px 3px 0 #2a8a3e;">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase;">CLASSICAL BREAK TIME</div>
          <div style="font-family: var(--font-display); font-size: 1.6rem;">${fmtTime(p.classicalYears)}</div>
          <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft);">on all of today's supercomputers combined</div>
        </div>
        <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; box-shadow: 3px 3px 0 var(--accent);">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase;">SHOR ON QUANTUM</div>
          <div style="font-family: var(--font-display); font-size: 1.6rem;">~8 hours</div>
          <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft);">if you had a fault-tolerant machine</div>
        </div>
      </div>
      <div style="margin-top: 0.6rem; background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem;">
        <div style="font-family: var(--font-display); letter-spacing: 1px;">Quantum requirements</div>
        <div style="font-family: var(--font-mono); font-size: 0.9rem; margin-top: 0.4em;">
          • Logical qubits: <strong>~${p.qubitsNeeded.toLocaleString()}</strong><br>
          • Physical qubits (with current surface-code overhead): <strong>~${physQubits.toLocaleString()}</strong><br>
          • Today's largest: ~1,200 noisy physical qubits.
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4em;">${p.notes}</div>
      </div>
    `;
    root.querySelector('#sh-stage').innerHTML = html;

    root.querySelector('#sh-explain').innerHTML = `The gap between today's ~1k physical qubits and the millions needed is the whole story. Useful Shor is a 10–30 year horizon — long enough that "harvest now, decrypt later" attacks are already a concern, which is why post-quantum migration is happening now.`;
  }
  render();
}
