// Photovoltaic widget: pick a photon energy, see whether it can excite
// an electron in silicon. Animate a photon hitting the cell.

const SI_GAP = 1.12;
const PHOTONS = [
  { name: 'Red (700 nm)',     energy: 1.77 },
  { name: 'Yellow (590 nm)',  energy: 2.10 },
  { name: 'Blue (450 nm)',    energy: 2.76 },
  { name: 'Near-IR (1100 nm)', energy: 1.13 },
  { name: 'Mid-IR (2000 nm)',  energy: 0.62 },
  { name: 'UV (350 nm)',       energy: 3.54 },
];

export function initPhotovoltaicWidget(root) {
  let idx = 0;
  let outcome = null;   // 'absorbed' | 'pass' | null

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Photon meets silicon (bandgap = ${SI_GAP} eV)</div>

      <div class="controls">
        <label>Photon:</label>
        <select class="field" id="pv-p">
          ${PHOTONS.map((p, i) => `<option value="${i}">${p.name} — ${p.energy} eV</option>`).join('')}
        </select>
        <button class="btn btn-accent" id="pv-fire">Fire photon</button>
      </div>

      <div class="widget-stage" id="pv-stage" style="text-align: center;"></div>
      <div class="callout" id="pv-explain"></div>
    </div>
  `;

  root.querySelector('#pv-p').addEventListener('change', (e) => { idx = Number(e.target.value); outcome = null; render(); });
  root.querySelector('#pv-fire').addEventListener('click', () => { outcome = PHOTONS[idx].energy >= SI_GAP ? 'absorbed' : 'pass'; render(); });

  function render() {
    const p = PHOTONS[idx];
    const W = 540, H = 260;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // Silicon slab
    svg += `<rect x="200" y="60" width="140" height="140" fill="#cfe5ff" stroke="var(--ink)" stroke-width="2.5"/>`;
    svg += `<text x="270" y="55" text-anchor="middle" style="font-family: var(--font-display); font-size: 14px;">SILICON</text>`;
    // Energy bands inside
    svg += `<line x1="210" y1="100" x2="330" y2="100" stroke="var(--ink-soft)" stroke-width="2"/>`;
    svg += `<text x="335" y="104" style="font-family: var(--font-mono); font-size: 10px;">conduction</text>`;
    svg += `<line x1="210" y1="160" x2="330" y2="160" stroke="var(--ink-soft)" stroke-width="2"/>`;
    svg += `<text x="335" y="164" style="font-family: var(--font-mono); font-size: 10px;">valence</text>`;
    svg += `<text x="335" y="130" style="font-family: var(--font-mono); font-size: 10px; fill: var(--accent);">gap = 1.12 eV</text>`;
    // photon arrow
    svg += `<text x="80" y="40" style="font-family: var(--font-mono); font-size: 12px;">${p.name}</text>`;
    svg += `<line x1="40" y1="130" x2="200" y2="130" stroke="var(--accent)" stroke-width="3" marker-end="url(#pv-arr)"/>`;
    svg += `<defs><marker id="pv-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--accent)"/></marker></defs>`;
    // outcome
    if (outcome === 'absorbed') {
      // electron lifted from valence to conduction
      svg += `<circle cx="270" cy="100" r="6" fill="#1c6dd0" stroke="var(--ink)" stroke-width="1.5"/>`;
      svg += `<text x="270" y="92" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">e⁻</text>`;
      svg += `<circle cx="270" cy="160" r="6" fill="white" stroke="var(--ink)" stroke-width="1.5"/>`;
      svg += `<text x="270" y="178" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">h⁺</text>`;
      svg += `<line x1="270" y1="155" x2="270" y2="105" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 2" marker-end="url(#pv-arr)"/>`;
    } else if (outcome === 'pass') {
      svg += `<line x1="340" y1="130" x2="500" y2="130" stroke="var(--accent)" stroke-width="3" marker-end="url(#pv-arr)" opacity="0.7"/>`;
      svg += `<text x="420" y="120" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px; fill: var(--ink-soft);">passes through</text>`;
    }
    svg += `</svg>`;
    root.querySelector('#pv-stage').innerHTML = svg;

    let exp;
    if (outcome === null) exp = `Pick a photon energy and fire. Silicon's bandgap is ${SI_GAP} eV — that's the threshold.`;
    else if (outcome === 'absorbed') {
      const excess = p.energy - SI_GAP;
      exp = `<strong>Absorbed.</strong> Photon energy ${p.energy} eV ≥ ${SI_GAP} eV → an electron-hole pair is created. The extra ${excess.toFixed(2)} eV becomes heat. The pair gets pulled apart by the P-N junction (next lesson) to produce current.`;
    } else exp = `<strong>Passes through.</strong> Photon energy ${p.energy} eV < ${SI_GAP} eV → not enough to lift an electron across the gap. Silicon is essentially transparent to this wavelength.`;
    root.querySelector('#pv-explain').innerHTML = exp;
  }
  render();
}
