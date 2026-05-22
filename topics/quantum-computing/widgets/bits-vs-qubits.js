// Bits vs Qubits: drag a point around a Bloch sphere (rendered as a
// circle = view from above), watch α and β + measurement probabilities update.

export function initBitsQubitsWidget(root) {
  // State: theta in [0, π], phi in [0, 2π]
  let theta = Math.PI / 2;
  let phi = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Bloch sphere (front view)</div>

      <div class="widget-stage" id="bq-stage" style="text-align: center;"></div>

      <div class="controls">
        <label>θ (latitude): <strong id="bq-tv">${theta.toFixed(2)}</strong></label>
        <input type="range" min="0" max="3.1416" step="0.01" value="${theta}" id="bq-t" style="flex: 1;">
      </div>
      <div class="controls">
        <label>φ (longitude): <strong id="bq-pv">${phi.toFixed(2)}</strong></label>
        <input type="range" min="0" max="6.2832" step="0.01" value="${phi}" id="bq-p" style="flex: 1;">
      </div>
      <div class="controls">
        <button class="btn" id="bq-0">Set to |0⟩</button>
        <button class="btn" id="bq-1">Set to |1⟩</button>
        <button class="btn" id="bq-plus">Set to |+⟩ (equator)</button>
      </div>

      <div class="metrics">
        <div class="metric"><div class="label">α (coefficient of |0⟩)</div><div class="value" id="m-alpha">—</div></div>
        <div class="metric"><div class="label">β (coefficient of |1⟩)</div><div class="value" id="m-beta">—</div></div>
        <div class="metric accent"><div class="label">P(measure 0)</div><div class="value" id="m-p0">—</div></div>
        <div class="metric accent"><div class="label">P(measure 1)</div><div class="value" id="m-p1">—</div></div>
      </div>

      <div class="callout" id="bq-explain"></div>
    </div>
  `;

  root.querySelector('#bq-t').addEventListener('input', (e) => { theta = Number(e.target.value); render(); });
  root.querySelector('#bq-p').addEventListener('input', (e) => { phi = Number(e.target.value); render(); });
  root.querySelector('#bq-0').addEventListener('click', () => { theta = 0; phi = 0; sync(); render(); });
  root.querySelector('#bq-1').addEventListener('click', () => { theta = Math.PI; phi = 0; sync(); render(); });
  root.querySelector('#bq-plus').addEventListener('click', () => { theta = Math.PI / 2; phi = 0; sync(); render(); });

  function sync() {
    root.querySelector('#bq-t').value = theta;
    root.querySelector('#bq-p').value = phi;
  }

  function render() {
    const W = 360, H = 360, cx = W / 2, cy = H / 2, R = 140;
    // Bloch coords (front-view projection: ignore y component)
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    // Project: SVG x = phi-x component, SVG y = -z (north up). Show y as size cue.
    const px = cx + R * x;
    const py = cy - R * z;

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // sphere outline
    svg += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="var(--paper-deep)" stroke="var(--ink)" stroke-width="2.5"/>`;
    // equator
    svg += `<ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${R/4}" fill="none" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="3 3"/>`;
    // axes
    svg += `<line x1="${cx}" y1="${cy - R - 10}" x2="${cx}" y2="${cy + R + 10}" stroke="var(--ink-soft)" stroke-width="1"/>`;
    svg += `<line x1="${cx - R - 10}" y1="${cy}" x2="${cx + R + 10}" y2="${cy}" stroke="var(--ink-soft)" stroke-width="1"/>`;
    // poles
    svg += `<text x="${cx}" y="${cy - R - 15}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 14px; fill: var(--ink);">|0⟩</text>`;
    svg += `<text x="${cx}" y="${cy + R + 25}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 14px; fill: var(--ink);">|1⟩</text>`;
    svg += `<text x="${cx + R + 18}" y="${cy + 4}" style="font-family: var(--font-mono); font-size: 11px; fill: var(--ink-soft);">x (|+⟩)</text>`;
    // qubit vector
    svg += `<line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="var(--accent)" stroke-width="3"/>`;
    svg += `<circle cx="${px}" cy="${py}" r="9" fill="var(--accent)" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `</svg>`;
    root.querySelector('#bq-stage').innerHTML = svg;

    const alpha = Math.cos(theta / 2);
    const beta_re = Math.sin(theta / 2) * Math.cos(phi);
    const beta_im = Math.sin(theta / 2) * Math.sin(phi);
    const p0 = alpha * alpha;
    const p1 = beta_re * beta_re + beta_im * beta_im;
    root.querySelector('#bq-tv').textContent = theta.toFixed(2);
    root.querySelector('#bq-pv').textContent = phi.toFixed(2);
    root.querySelector('#m-alpha').textContent = alpha.toFixed(3);
    root.querySelector('#m-beta').textContent = beta_im === 0 ? beta_re.toFixed(3) : `${beta_re.toFixed(3)} + ${beta_im.toFixed(3)}i`;
    root.querySelector('#m-p0').textContent = (p0 * 100).toFixed(1) + '%';
    root.querySelector('#m-p1').textContent = (p1 * 100).toFixed(1) + '%';

    let exp;
    if (theta < 0.1) exp = `<strong>|0⟩ pole.</strong> Always measures 0. Classical bit 0.`;
    else if (theta > Math.PI - 0.1) exp = `<strong>|1⟩ pole.</strong> Always measures 1. Classical bit 1.`;
    else if (Math.abs(theta - Math.PI/2) < 0.1) exp = `<strong>Equator.</strong> 50/50 on measurement. Maximally superposed — neither 0 nor 1 until measured.`;
    else exp = `Off the poles: ${(p0*100).toFixed(0)}% chance of 0, ${(p1*100).toFixed(0)}% chance of 1.`;
    root.querySelector('#bq-explain').innerHTML = exp;
  }
  render();
}
