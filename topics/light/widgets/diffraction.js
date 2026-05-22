// Double-slit diffraction widget: tune wavelength and slit separation,
// see fringe pattern.

export function initDiffractionWidget(root) {
  let wavelength = 550;  // nm
  let slitSep = 100;     // microns

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Double slit — intensity on the screen</div>

      <div class="controls">
        <label>Wavelength: <strong id="df-wv">${wavelength} nm</strong></label>
        <input type="range" min="380" max="750" value="${wavelength}" id="df-w" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Slit separation: <strong id="df-dv">${slitSep} µm</strong></label>
        <input type="range" min="20" max="300" value="${slitSep}" id="df-d" style="flex: 1;">
      </div>

      <div class="widget-stage" id="df-stage" style="text-align: center;"></div>
      <div class="callout" id="df-explain"></div>
    </div>
  `;

  root.querySelector('#df-w').addEventListener('input', (e) => { wavelength = Number(e.target.value); render(); });
  root.querySelector('#df-d').addEventListener('input', (e) => { slitSep = Number(e.target.value); render(); });

  function wlToColor(w) {
    // Approximate RGB for a wavelength in nm
    if (w < 440) return `rgb(120, 0, 200)`;
    if (w < 490) return `rgb(0, 100, 230)`;
    if (w < 510) return `rgb(0, 200, 220)`;
    if (w < 580) return `rgb(80, 220, 0)`;
    if (w < 645) return `rgb(255, 220, 0)`;
    return `rgb(255, 60, 40)`;
  }

  function render() {
    const W = 600, H = 240;
    const color = wlToColor(wavelength);
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // axis
    svg += `<line x1="0" y1="${H/2}" x2="${W}" y2="${H/2}" stroke="var(--ink-soft)" stroke-width="1"/>`;
    // intensity curve: I(x) ∝ cos²(π d sin θ / λ), small-angle: ∝ cos²(π d x / (λ L))
    // We'll just use π * d * x / (lambda * scale) with scale tuned to look reasonable.
    let path = '';
    const lambdaMm = wavelength * 1e-6; // nm → mm
    const dMm = slitSep * 1e-3;          // µm → mm
    const scale = 0.04;                  // tuning
    for (let px = 0; px <= W; px += 2) {
      const x = (px - W/2) * scale;
      const phi = Math.PI * dMm * x / lambdaMm;
      const I = Math.cos(phi) ** 2;
      const y = H/2 - I * (H/2 - 10);
      path += (path ? 'L' : 'M') + px + ',' + y;
    }
    svg += `<path d="${path}" stroke="${color}" stroke-width="3" fill="none"/>`;
    // baseline shading
    svg += `<path d="${path} L ${W},${H/2} L 0,${H/2} Z" fill="${color}" opacity="0.2"/>`;
    svg += `<text class="ml-axis-text" x="${W/2}" y="${H - 10}" text-anchor="middle">intensity on screen</text>`;
    svg += `</svg>`;
    root.querySelector('#df-stage').innerHTML = svg;
    root.querySelector('#df-wv').textContent = wavelength + ' nm';
    root.querySelector('#df-dv').textContent = slitSep + ' µm';

    const fringeSpacing = (wavelength * 1000) / (slitSep);  // arbitrary units
    let exp;
    if (slitSep > 200) exp = `<strong>Closely-spaced fringes.</strong> Wide slit separation → many bright peaks crammed close together.`;
    else if (slitSep < 50) exp = `<strong>Widely-spaced fringes.</strong> Narrow slit separation → few wide peaks. This is why diffraction limits resolution — tiny features need tiny wavelengths.`;
    else exp = `Wavelength and slit separation both matter. Fringe spacing = λL/d (where L is distance to screen).`;
    root.querySelector('#df-explain').innerHTML = exp;
  }
  render();
}
