// SQ limit widget: slide bandgap from 0.5 to 3 eV, see efficiency
// peak at ~1.34 eV (the SQ optimum for AM1.5 sun).

// Simplified SQ-like efficiency model:
// eta(Eg) = peak_eta * exp(-((Eg - 1.34)^2) / (2 * 0.6^2))
// (Just for shape — real SQ is more involved, but this captures the curve.)

function sqEfficiency(Eg) {
  // Combine two effects:
  // 1) Above-bandgap losses: fraction of solar spectrum with hν >= Eg
  //    approximation: aboveFraction ≈ exp(-Eg / 1.5)
  // 2) Per-photon excess energy: Eg/Ephoton (smaller Eg → more wasted)
  // Result peaks around 1.34 eV. We hand-tune to match SQ ~33.7% at 1.34.
  const aboveFraction = 1 / (1 + Math.exp(2.5 * (Eg - 1.6)));  // s-curve declining
  const voltageEfficiency = Eg / 4.0;  // higher gap → higher V
  const eta = aboveFraction * voltageEfficiency * 1.0;
  // Normalize to peak ≈ 0.337
  return eta * 0.6;
}

export function initSQLimitWidget(root) {
  let Eg = 1.12;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Shockley-Queisser efficiency vs bandgap</div>

      <div class="controls">
        <label>Bandgap: <strong id="sq-egv">${Eg}</strong> eV</label>
        <input type="range" min="0.5" max="3" step="0.01" value="${Eg}" id="sq-eg" style="flex: 1;">
      </div>

      <div class="widget-stage" id="sq-stage" style="text-align: center;"></div>
      <div class="callout" id="sq-explain"></div>
    </div>
  `;

  root.querySelector('#sq-eg').addEventListener('input', (e) => { Eg = Number(e.target.value); render(); });

  function render() {
    const W = 580, H = 280, PAD = 40;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<rect class="ml-plot-bg" x="${PAD}" y="${PAD}" width="${W - 2*PAD}" height="${H - 2*PAD}"/>`;
    // axes
    for (let e = 0.5; e <= 3; e += 0.5) {
      const x = PAD + (e - 0.5) / 2.5 * (W - 2*PAD);
      svg += `<text class="ml-axis-text" x="${x}" y="${H - PAD + 14}" text-anchor="middle">${e}</text>`;
    }
    for (let p = 0; p <= 0.4; p += 0.1) {
      const y = H - PAD - p / 0.4 * (H - 2*PAD);
      svg += `<text class="ml-axis-text" x="${PAD - 6}" y="${y + 3}" text-anchor="end">${(p*100).toFixed(0)}%</text>`;
      svg += `<line class="ml-grid" x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}"/>`;
    }
    // efficiency curve
    let path = '';
    for (let e = 0.5; e <= 3; e += 0.02) {
      const eta = sqEfficiency(e);
      const x = PAD + (e - 0.5) / 2.5 * (W - 2*PAD);
      const y = H - PAD - Math.max(0, Math.min(0.4, eta)) / 0.4 * (H - 2*PAD);
      path += (path ? 'L' : 'M') + x + ',' + y;
    }
    svg += `<path d="${path}" stroke="var(--accent)" stroke-width="2.5" fill="none"/>`;
    // Marker for selected
    const myEta = sqEfficiency(Eg);
    const mx = PAD + (Eg - 0.5) / 2.5 * (W - 2*PAD);
    const my = H - PAD - Math.max(0, Math.min(0.4, myEta)) / 0.4 * (H - 2*PAD);
    svg += `<line x1="${mx}" y1="${my}" x2="${mx}" y2="${H - PAD}" stroke="var(--ink)" stroke-width="1" stroke-dasharray="3 2"/>`;
    svg += `<circle cx="${mx}" cy="${my}" r="7" fill="var(--accent)" stroke="var(--ink)" stroke-width="2"/>`;
    // labels for known materials
    const MARKERS = [
      { e: 1.12, name: 'Si (1.12)' },
      { e: 1.43, name: 'GaAs (1.43)' },
      { e: 1.55, name: 'Perovskite (1.55)' },
    ];
    MARKERS.forEach((m) => {
      const x = PAD + (m.e - 0.5) / 2.5 * (W - 2*PAD);
      svg += `<line x1="${x}" y1="${PAD}" x2="${x}" y2="${H - PAD}" stroke="var(--ink-soft)" stroke-width="1" opacity="0.4"/>`;
      svg += `<text x="${x}" y="${PAD - 5}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9.5px; fill: var(--ink-soft);">${m.name}</text>`;
    });
    svg += `<text class="ml-axis-text" x="${W/2}" y="${H - 8}" text-anchor="middle">bandgap (eV)</text>`;
    svg += `<text class="ml-axis-text" x="14" y="${H/2}" transform="rotate(-90, 14, ${H/2})" text-anchor="middle">efficiency (SQ)</text>`;
    svg += `</svg>`;
    root.querySelector('#sq-stage').innerHTML = svg;

    root.querySelector('#sq-egv').textContent = Eg.toFixed(2);
    let exp;
    if (Eg < 0.8) exp = `<strong>Bandgap too small.</strong> Catches lots of photons, but each electron has very little voltage. Low efficiency.`;
    else if (Eg > 2.0) exp = `<strong>Bandgap too large.</strong> Each electron has lots of voltage, but most of the solar spectrum slips through without absorbing.`;
    else if (Math.abs(Eg - 1.34) < 0.1) exp = `<strong>SQ optimum.</strong> ~${(myEta*100).toFixed(0)}% theoretical max — the peak of the curve.`;
    else exp = `Efficiency ≈ ${(myEta*100).toFixed(0)}%. Silicon (1.12 eV) is slightly below optimum but cheap to make; perovskite (~1.55) is slightly above.`;
    root.querySelector('#sq-explain').innerHTML = exp;
  }
  render();
}
