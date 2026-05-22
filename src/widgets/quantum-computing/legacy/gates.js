// Quantum gates widget: a single qubit. Apply X, Z, H one at a time.
// Show state amplitudes + Bloch sphere position.

export function initGatesWidget(root) {
  // State: complex amplitudes for |0⟩ and |1⟩
  let state = { a: { re: 1, im: 0 }, b: { re: 0, im: 0 } };  // |0⟩
  let history = ['|0⟩'];

  function reset() { state = { a: { re: 1, im: 0 }, b: { re: 0, im: 0 } }; history = ['|0⟩']; }

  function applyX() {
    state = { a: state.b, b: state.a };
    history.push('X');
  }
  function applyZ() {
    state = { a: state.a, b: { re: -state.b.re, im: -state.b.im } };
    history.push('Z');
  }
  function applyH() {
    const s = 1 / Math.sqrt(2);
    const newA = { re: s * (state.a.re + state.b.re), im: s * (state.a.im + state.b.im) };
    const newB = { re: s * (state.a.re - state.b.re), im: s * (state.a.im - state.b.im) };
    state = { a: newA, b: newB };
    history.push('H');
  }

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Apply gates to a single qubit</div>

      <div class="controls">
        <button class="btn btn-accent" id="g-x">X (bit flip)</button>
        <button class="btn btn-accent" id="g-z">Z (phase flip)</button>
        <button class="btn btn-accent" id="g-h">H (Hadamard)</button>
        <button class="btn btn-ghost" id="g-reset">Reset to |0⟩</button>
      </div>

      <div class="widget-stage" id="g-stage" style="min-height: 240px;"></div>

      <div class="callout" id="g-explain"></div>
    </div>
  `;

  root.querySelector('#g-x').addEventListener('click', () => { applyX(); render(); });
  root.querySelector('#g-z').addEventListener('click', () => { applyZ(); render(); });
  root.querySelector('#g-h').addEventListener('click', () => { applyH(); render(); });
  root.querySelector('#g-reset').addEventListener('click', () => { reset(); render(); });

  function fmtC(c) {
    if (Math.abs(c.im) < 1e-6) return c.re.toFixed(3);
    if (Math.abs(c.re) < 1e-6) return c.im.toFixed(3) + 'i';
    return `${c.re.toFixed(3)} ${c.im >= 0 ? '+' : ''}${c.im.toFixed(3)}i`;
  }
  function magSq(c) { return c.re * c.re + c.im * c.im; }

  function render() {
    const p0 = magSq(state.a);
    const p1 = magSq(state.b);

    const html = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 0.6rem;">
        <div class="qc-state" style="text-align: center;">
          <div style="font-size: 0.75rem; color: var(--ink-soft);">α</div>
          <div style="font-size: 1.1rem; font-weight: 600;">${fmtC(state.a)}</div>
          <div style="font-size: 0.78rem; color: var(--ink-soft);">|α|² = ${p0.toFixed(3)} → P(0) = ${(p0*100).toFixed(1)}%</div>
        </div>
        <div class="qc-state" style="text-align: center;">
          <div style="font-size: 0.75rem; color: var(--ink-soft);">β</div>
          <div style="font-size: 1.1rem; font-weight: 600;">${fmtC(state.b)}</div>
          <div style="font-size: 0.78rem; color: var(--ink-soft);">|β|² = ${p1.toFixed(3)} → P(1) = ${(p1*100).toFixed(1)}%</div>
        </div>
      </div>
      <div><strong>Gate history:</strong> ${history.join(' → ')}</div>
    `;
    root.querySelector('#g-stage').innerHTML = html;

    let exp;
    const last = history[history.length - 1];
    if (last === 'X') exp = `<strong>X applied.</strong> Swapped α and β — bit flip.`;
    else if (last === 'Z') exp = `<strong>Z applied.</strong> Flipped the sign of β. Doesn't change measurement probabilities, but matters in interference.`;
    else if (last === 'H') exp = `<strong>H applied.</strong> Created superposition (if input was a pole) or returned to a pole (if input was equator). H · H = identity.`;
    else exp = `<strong>|0⟩.</strong> Pure 0 state — every measurement returns 0.`;
    root.querySelector('#g-explain').innerHTML = exp;
  }
  render();
}
