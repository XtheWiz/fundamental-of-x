// Polarization widget: light at angle θ_input hits polarizer at angle θ_pol.
// Malus's law: I_out = I_in × cos²(θ_pol − θ_input).

export function initPolarizationWidget(root) {
  let inputDeg = 0;    // input polarization angle
  let polDeg = 0;      // polarizer angle

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Malus's law in action</div>

      <div class="controls">
        <label>Input polarization: <strong id="pl-iv">${inputDeg}°</strong></label>
        <input type="range" min="0" max="180" value="${inputDeg}" id="pl-i" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Polarizer axis: <strong id="pl-pv">${polDeg}°</strong></label>
        <input type="range" min="0" max="180" value="${polDeg}" id="pl-p" style="flex: 1;">
      </div>

      <div class="widget-stage" id="pl-stage" style="text-align: center;"></div>
      <div class="callout" id="pl-explain"></div>
    </div>
  `;

  root.querySelector('#pl-i').addEventListener('input', (e) => { inputDeg = Number(e.target.value); render(); });
  root.querySelector('#pl-p').addEventListener('input', (e) => { polDeg = Number(e.target.value); render(); });

  function render() {
    const diff = (polDeg - inputDeg) * Math.PI / 180;
    const intensity = Math.cos(diff) ** 2;

    const W = 480, H = 240;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // input
    const inCx = 100, cy = H / 2, R = 60;
    const ia = inputDeg * Math.PI / 180;
    svg += `<circle cx="${inCx}" cy="${cy}" r="${R}" fill="var(--paper-deep)" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="${inCx - R * Math.cos(ia)}" y1="${cy - R * Math.sin(ia)}" x2="${inCx + R * Math.cos(ia)}" y2="${cy + R * Math.sin(ia)}" stroke="var(--accent)" stroke-width="4"/>`;
    svg += `<text x="${inCx}" y="${cy + R + 20}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">input @ ${inputDeg}°</text>`;
    // polarizer
    const pCx = W / 2;
    const pa = polDeg * Math.PI / 180;
    svg += `<rect x="${pCx - 60}" y="${cy - 60}" width="120" height="120" fill="var(--paper-deep)" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="${pCx - 60 * Math.cos(pa)}" y1="${cy - 60 * Math.sin(pa)}" x2="${pCx + 60 * Math.cos(pa)}" y2="${cy + 60 * Math.sin(pa)}" stroke="var(--ink)" stroke-width="6"/>`;
    svg += `<text x="${pCx}" y="${cy + 80}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">polarizer @ ${polDeg}°</text>`;
    // output
    const oCx = W - 100;
    svg += `<circle cx="${oCx}" cy="${cy}" r="${R}" fill="var(--paper-deep)" stroke="var(--ink)" stroke-width="2"/>`;
    if (intensity > 0.01) {
      // output is polarized along polarizer's axis
      svg += `<line x1="${oCx - R * Math.cos(pa) * intensity}" y1="${cy - R * Math.sin(pa) * intensity}" x2="${oCx + R * Math.cos(pa) * intensity}" y2="${cy + R * Math.sin(pa) * intensity}" stroke="var(--accent)" stroke-width="4" opacity="${0.3 + 0.7 * intensity}"/>`;
    }
    svg += `<text x="${oCx}" y="${cy + R + 20}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">output: ${(intensity * 100).toFixed(1)}% intensity</text>`;
    // arrows
    svg += `<line x1="${inCx + R + 5}" y1="${cy}" x2="${pCx - 65}" y2="${cy}" stroke="var(--ink)" stroke-width="1.5" marker-end="url(#pl-arr)"/>`;
    svg += `<line x1="${pCx + 65}" y1="${cy}" x2="${oCx - R - 5}" y2="${cy}" stroke="var(--ink)" stroke-width="1.5" marker-end="url(#pl-arr)"/>`;
    svg += `<defs><marker id="pl-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/></marker></defs>`;
    svg += `</svg>`;
    root.querySelector('#pl-stage').innerHTML = svg;

    root.querySelector('#pl-iv').textContent = inputDeg + '°';
    root.querySelector('#pl-pv').textContent = polDeg + '°';

    const delta = ((polDeg - inputDeg) % 180 + 180) % 180;
    const offset = delta > 90 ? 180 - delta : delta;
    let exp;
    if (offset < 5) exp = `<strong>Aligned.</strong> Polarizer axis matches input polarization → 100% transmission.`;
    else if (offset > 85) exp = `<strong>Crossed.</strong> Polarizer 90° from input → 0% transmission. Two crossed polarizers block all light.`;
    else exp = `Transmission = cos²(${offset}°) ≈ ${(intensity * 100).toFixed(0)}%. This is Malus's law.`;
    root.querySelector('#pl-explain').innerHTML = exp;
  }
  render();
}
