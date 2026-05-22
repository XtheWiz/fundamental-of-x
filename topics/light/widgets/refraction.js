// Refraction widget: Snell's law. Two media. Drag angle of incidence,
// see refracted ray. Detect total internal reflection.

const MEDIA = {
  air:     { n: 1.00, label: 'Air' },
  water:   { n: 1.33, label: 'Water' },
  glass:   { n: 1.50, label: 'Glass' },
  diamond: { n: 2.42, label: 'Diamond' },
};

export function initRefractionWidget(root) {
  let angleDeg = 35;
  let topMedium = 'air';
  let botMedium = 'water';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Snell's law: n₁ sin θ₁ = n₂ sin θ₂</div>

      <div class="controls">
        <label>Top medium:</label>
        <select class="field" id="rf-top">${Object.entries(MEDIA).map(([k, m]) => `<option value="${k}" ${k === topMedium ? 'selected' : ''}>${m.label} (n=${m.n})</option>`).join('')}</select>
        <label>Bottom medium:</label>
        <select class="field" id="rf-bot">${Object.entries(MEDIA).map(([k, m]) => `<option value="${k}" ${k === botMedium ? 'selected' : ''}>${m.label} (n=${m.n})</option>`).join('')}</select>
      </div>
      <div class="controls">
        <label>Angle of incidence: <strong id="rf-av">${angleDeg}°</strong></label>
        <input type="range" min="0" max="89" value="${angleDeg}" id="rf-a" style="flex: 1;">
      </div>

      <div class="widget-stage" id="rf-stage" style="text-align: center;"></div>
      <div class="callout" id="rf-explain"></div>
    </div>
  `;

  root.querySelector('#rf-a').addEventListener('input', (e) => { angleDeg = Number(e.target.value); render(); });
  root.querySelector('#rf-top').addEventListener('change', (e) => { topMedium = e.target.value; render(); });
  root.querySelector('#rf-bot').addEventListener('change', (e) => { botMedium = e.target.value; render(); });

  function render() {
    const n1 = MEDIA[topMedium].n;
    const n2 = MEDIA[botMedium].n;
    const t1 = angleDeg * Math.PI / 180;
    const sinT2 = (n1 / n2) * Math.sin(t1);
    const tir = Math.abs(sinT2) > 1;
    const t2 = tir ? null : Math.asin(sinT2);

    const W = 480, H = 320, cx = W / 2, midY = H / 2;
    const L = 130;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // Top medium
    svg += `<rect x="0" y="0" width="${W}" height="${midY}" fill="#cfe5ff" opacity="0.4"/>`;
    svg += `<rect x="0" y="${midY}" width="${W}" height="${midY}" fill="#a8c8e8" opacity="0.6"/>`;
    svg += `<text x="20" y="30" style="font-family: var(--font-mono); font-size: 12px;">${MEDIA[topMedium].label} n₁=${n1}</text>`;
    svg += `<text x="20" y="${midY + 30}" style="font-family: var(--font-mono); font-size: 12px;">${MEDIA[botMedium].label} n₂=${n2}</text>`;
    svg += `<line x1="0" y1="${midY}" x2="${W}" y2="${midY}" stroke="var(--ink)" stroke-width="2"/>`;
    // normal
    svg += `<line x1="${cx}" y1="${20}" x2="${cx}" y2="${H - 20}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="4 3"/>`;
    // incoming ray
    const ix = cx - L * Math.sin(t1);
    const iy = midY - L * Math.cos(t1);
    svg += `<line x1="${ix}" y1="${iy}" x2="${cx}" y2="${midY}" stroke="var(--accent)" stroke-width="3" marker-end="url(#rf-a1)"/>`;
    // refracted or TIR
    if (tir) {
      const rx = cx + L * Math.sin(t1);
      const ry = midY - L * Math.cos(t1);
      svg += `<line x1="${cx}" y1="${midY}" x2="${rx}" y2="${ry}" stroke="var(--accent)" stroke-width="3" stroke-dasharray="6 3" marker-end="url(#rf-a1)"/>`;
      svg += `<text x="${cx + 50}" y="${midY - 50}" style="font-family: var(--font-display); font-size: 14px; fill: var(--accent);">TOTAL INTERNAL REFLECTION</text>`;
    } else {
      const rx = cx + L * Math.sin(t2);
      const ry = midY + L * Math.cos(t2);
      svg += `<line x1="${cx}" y1="${midY}" x2="${rx}" y2="${ry}" stroke="#1c6dd0" stroke-width="3" marker-end="url(#rf-a2)"/>`;
      svg += `<text x="${cx + 8}" y="${midY + 30}" style="font-family: var(--font-mono); font-size: 11px; fill: #1c6dd0;">θ₂ = ${(t2 * 180 / Math.PI).toFixed(1)}°</text>`;
    }
    svg += `<text x="${cx - 70}" y="${midY - 20}" style="font-family: var(--font-mono); font-size: 11px; fill: var(--accent);">θ₁ = ${angleDeg}°</text>`;
    svg += `<defs>
      <marker id="rf-a1" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--accent)"/></marker>
      <marker id="rf-a2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="#1c6dd0"/></marker>
    </defs>`;
    svg += `</svg>`;
    root.querySelector('#rf-stage').innerHTML = svg;
    root.querySelector('#rf-av').textContent = angleDeg + '°';

    let exp;
    if (tir) {
      const critical = Math.asin(n2 / n1) * 180 / Math.PI;
      exp = `<strong>Past the critical angle (${critical.toFixed(1)}°).</strong> Light can't escape from the denser medium — all energy reflects back. This is how fiber optics work.`;
    } else if (n1 > n2) exp = `Going from dense to less-dense — ray bends <em>away</em> from normal.`;
    else exp = `Going from less-dense to dense — ray bends <em>toward</em> normal.`;
    root.querySelector('#rf-explain').innerHTML = exp;
  }
  render();
}
