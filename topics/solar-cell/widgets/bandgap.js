// Bandgap widget: pick a material, see its bandgap energy + the
// wavelength threshold + which part of the solar spectrum it absorbs.

const MATERIALS = [
  { name: 'Germanium',   gap: 0.67 },
  { name: 'Silicon',     gap: 1.12 },
  { name: 'GaAs',        gap: 1.43 },
  { name: 'Perovskite',  gap: 1.55 },
  { name: 'CdTe',        gap: 1.50 },
  { name: 'GaP',         gap: 2.26 },
];

export function initBandgapWidget(root) {
  let idx = 1;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Bandgap → absorbable wavelengths</div>

      <div class="controls">
        <label>Material:</label>
        <div class="pill-group">
          ${MATERIALS.map((m, i) => `
            <input type="radio" name="bg-m" id="bg-${i}" value="${i}" ${i === idx ? 'checked' : ''}>
            <label for="bg-${i}">${m.name}</label>
          `).join('')}
        </div>
      </div>

      <div class="widget-stage" id="bg-stage" style="text-align: center;"></div>
      <div class="callout" id="bg-explain"></div>
    </div>
  `;

  root.querySelectorAll('input[name=bg-m]').forEach((r) =>
    r.addEventListener('change', (e) => { idx = Number(e.target.value); render(); })
  );

  function render() {
    const m = MATERIALS[idx];
    const lambdaMaxNm = 1240 / m.gap;

    const W = 600, H = 200;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // Spectrum strip 280–2400 nm
    const xMin = 280, xMax = 2400;
    function xToPx(nm) { return 40 + (nm - xMin) / (xMax - xMin) * (W - 60); }
    // Strip
    svg += `<defs><linearGradient id="bg-spec" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9c27b0"/>
      <stop offset="0.1" stop-color="#7c4dff"/>
      <stop offset="0.2" stop-color="#2196f3"/>
      <stop offset="0.35" stop-color="#4caf50"/>
      <stop offset="0.45" stop-color="#ffeb3b"/>
      <stop offset="0.55" stop-color="#f44336"/>
      <stop offset="0.7" stop-color="#b71c1c"/>
      <stop offset="1" stop-color="#5d4037"/>
    </linearGradient></defs>`;
    svg += `<rect x="40" y="60" width="${W - 60}" height="50" fill="url(#bg-spec)" stroke="var(--ink)" stroke-width="2"/>`;
    // Threshold marker
    const thresholdX = xToPx(lambdaMaxNm);
    svg += `<line x1="${thresholdX}" y1="40" x2="${thresholdX}" y2="130" stroke="var(--ink)" stroke-width="3"/>`;
    svg += `<text x="${thresholdX}" y="35" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">threshold @ ${lambdaMaxNm.toFixed(0)} nm</text>`;
    // Absorbable zone shading (shorter wavelengths)
    svg += `<rect x="40" y="60" width="${thresholdX - 40}" height="50" fill="rgba(0, 0, 0, 0.0)" stroke="none"/>`;
    svg += `<rect x="${thresholdX}" y="60" width="${xToPx(xMax) - thresholdX}" height="50" fill="rgba(0, 0, 0, 0.4)" stroke="none"/>`;
    // wavelength axis labels
    [400, 700, 1100, 1500, 2000].forEach((nm) => {
      svg += `<text x="${xToPx(nm)}" y="130" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft);">${nm} nm</text>`;
    });
    // info badges
    svg += `<text x="${40 + (thresholdX - 40)/2}" y="155" text-anchor="middle" style="font-family: var(--font-display); font-size: 14px; fill: var(--accent);">absorbed</text>`;
    svg += `<text x="${(thresholdX + xToPx(xMax)) / 2}" y="155" text-anchor="middle" style="font-family: var(--font-display); font-size: 14px; fill: var(--ink-soft);">passes through</text>`;
    svg += `<text x="${W/2}" y="180" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">${m.name} — bandgap ${m.gap} eV → λ_max = ${lambdaMaxNm.toFixed(0)} nm</text>`;
    svg += `</svg>`;
    root.querySelector('#bg-stage').innerHTML = svg;

    let exp;
    if (m.gap < 1.0) exp = `<strong>${m.name}</strong> has a small bandgap — it catches even deep-infrared light. Good photon catchment, but each electron's energy is small → low voltage.`;
    else if (m.gap > 2.0) exp = `<strong>${m.name}</strong> has a large bandgap — only the most energetic visible/UV photons get absorbed. High voltage per electron, but lots of the solar spectrum slips through.`;
    else exp = `<strong>${m.name}</strong> at ${m.gap} eV is in the sweet spot for solar — covers most of the visible spectrum without wasting too much energy. ~33% theoretical max (SQ limit covers it next lesson).`;
    root.querySelector('#bg-explain').innerHTML = exp;
  }
  render();
}
