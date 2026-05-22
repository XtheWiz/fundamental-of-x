// Spectrum widget: slide along wavelength, see the band + per-photon
// energy + a familiar example at that wavelength.

const BANDS = [
  { min: 1e-12, max: 1e-11, label: 'gamma',   color: '#9c27b0' },
  { min: 1e-11, max: 1e-8,  label: 'X-ray',   color: '#673ab7' },
  { min: 1e-8,  max: 380e-9, label: 'UV',     color: '#3f51b5' },
  { min: 380e-9, max: 450e-9, label: 'violet', color: '#7c4dff' },
  { min: 450e-9, max: 495e-9, label: 'blue',   color: '#2196f3' },
  { min: 495e-9, max: 570e-9, label: 'green',  color: '#4caf50' },
  { min: 570e-9, max: 590e-9, label: 'yellow', color: '#ffeb3b' },
  { min: 590e-9, max: 620e-9, label: 'orange', color: '#ff9800' },
  { min: 620e-9, max: 750e-9, label: 'red',    color: '#f44336' },
  { min: 750e-9, max: 1e-3,   label: 'infrared', color: '#b71c1c' },
  { min: 1e-3,   max: 1e-1,   label: 'microwave', color: '#795548' },
  { min: 1e-1,   max: 1e3,    label: 'radio',     color: '#607d8b' },
];

const EXAMPLES = [
  { w: 5e-13, what: 'gamma rays from radioactive decay' },
  { w: 1e-10, what: 'medical X-rays' },
  { w: 1e-8,  what: 'ultraviolet — sunburn risk' },
  { w: 550e-9, what: 'green light — peak of human eye sensitivity' },
  { w: 850e-9, what: 'near-IR — TV remote' },
  { w: 1e-2,   what: 'microwave oven (2.45 GHz)' },
  { w: 1,      what: '300 MHz radio (FM territory)' },
  { w: 1e3,    what: 'long-wave radio' },
];

export function initSpectrumWidget(root) {
  let logW = Math.log10(550e-9);  // start in green

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Slide across the EM spectrum</div>

      <div class="controls">
        <label>Wavelength: <strong id="sp-w">—</strong></label>
        <input type="range" min="-12" max="3" step="0.05" value="${logW}" id="sp-r" style="flex: 1;">
      </div>

      <div class="widget-stage" id="sp-stage" style="min-height: 220px;"></div>

      <div class="callout" id="sp-explain"></div>
    </div>
  `;

  root.querySelector('#sp-r').addEventListener('input', (e) => { logW = Number(e.target.value); render(); });

  function fmt(w) {
    if (w < 1e-9) return (w * 1e12).toPrecision(3) + ' pm';
    if (w < 1e-6) return (w * 1e9).toPrecision(3) + ' nm';
    if (w < 1e-3) return (w * 1e6).toPrecision(3) + ' µm';
    if (w < 1) return (w * 1e3).toPrecision(3) + ' mm';
    if (w < 1000) return w.toPrecision(3) + ' m';
    return (w / 1000).toPrecision(3) + ' km';
  }

  function render() {
    const w = Math.pow(10, logW);
    const f = 3e8 / w;
    const E = 4.135667696e-15 * f; // eV
    const band = BANDS.find((b) => w >= b.min && w < b.max) || BANDS[BANDS.length - 1];
    const example = EXAMPLES.reduce((best, e) => Math.abs(Math.log10(e.w) - logW) < Math.abs(Math.log10(best.w) - logW) ? e : best, EXAMPLES[0]);

    // visual: a rainbow strip
    const W = 600, H = 80;
    let svg = `<svg viewBox="0 0 ${W} ${H + 60}" width="100%" style="max-width: ${W}px">`;
    // strip
    svg += `<defs><linearGradient id="sp-grad" x1="0" y1="0" x2="1" y2="0">`;
    BANDS.forEach((b, i) => {
      svg += `<stop offset="${i / (BANDS.length - 1)}" stop-color="${b.color}"/>`;
    });
    svg += `</linearGradient></defs>`;
    svg += `<rect x="0" y="20" width="${W}" height="${H}" fill="url(#sp-grad)" stroke="var(--ink)" stroke-width="2"/>`;
    // marker
    const x = ((logW - (-12)) / 15) * W;
    svg += `<line x1="${x}" y1="10" x2="${x}" y2="${H + 30}" stroke="var(--ink)" stroke-width="2.5"/>`;
    svg += `<polygon points="${x-7},10 ${x+7},10 ${x},22" fill="var(--ink)"/>`;
    svg += `<text x="0" y="${H + 50}" style="font-family: var(--font-mono); font-size: 11px;">long λ</text>`;
    svg += `<text x="${W}" y="${H + 50}" text-anchor="end" style="font-family: var(--font-mono); font-size: 11px;">short λ ↑ more energy</text>`;
    svg += `</svg>`;

    let html = svg + `
      <div style="margin-top: 0.6rem; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem;">
        <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: 4px; padding: 0.5rem 0.7rem; text-align: center;">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase;">band</div>
          <div style="font-family: var(--font-display); font-size: 1.2rem;">${band.label}</div>
        </div>
        <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: 4px; padding: 0.5rem 0.7rem; text-align: center;">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase;">frequency</div>
          <div style="font-family: var(--font-mono); font-size: 1rem;">${f.toExponential(2)} Hz</div>
        </div>
        <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: 4px; padding: 0.5rem 0.7rem; text-align: center;">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase;">energy/photon</div>
          <div style="font-family: var(--font-mono); font-size: 1rem;">${E.toExponential(2)} eV</div>
        </div>
      </div>
    `;
    root.querySelector('#sp-stage').innerHTML = html;

    root.querySelector('#sp-w').textContent = fmt(w);
    root.querySelector('#sp-explain').innerHTML = `Closest familiar example: <strong>${example.what}</strong>.`;
  }
  render();
}
