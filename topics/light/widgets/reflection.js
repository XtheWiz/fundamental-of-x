// Reflection widget: a ray hits a surface, angle in = angle out.
// Drag the angle of incidence and watch the reflected ray.

export function initReflectionWidget(root) {
  let angleDeg = 30;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Angle in = angle out</div>

      <div class="controls">
        <label>Angle of incidence: <strong id="rf-av">${angleDeg}°</strong></label>
        <input type="range" min="0" max="89" value="${angleDeg}" id="rf-a" style="flex: 1;">
      </div>

      <div class="widget-stage" id="rf-stage" style="text-align: center;"></div>

      <div class="callout">The dashed line is the surface normal (perpendicular to the mirror). Both angles are measured from the normal.</div>
    </div>
  `;

  root.querySelector('#rf-a').addEventListener('input', (e) => { angleDeg = Number(e.target.value); render(); });

  function render() {
    const W = 480, H = 280, cx = W/2, surfaceY = H - 60;
    const L = 200;
    const a = angleDeg * Math.PI / 180;
    // incoming ray from upper-left
    const ix = cx - L * Math.sin(a);
    const iy = surfaceY - L * Math.cos(a);
    // reflected ray to upper-right
    const rx = cx + L * Math.sin(a);
    const ry = surfaceY - L * Math.cos(a);

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // mirror surface (with hatching)
    svg += `<line x1="20" y1="${surfaceY}" x2="${W - 20}" y2="${surfaceY}" stroke="var(--ink)" stroke-width="3"/>`;
    for (let x = 30; x < W - 20; x += 10) {
      svg += `<line x1="${x}" y1="${surfaceY}" x2="${x - 8}" y2="${surfaceY + 10}" stroke="var(--ink)" stroke-width="1"/>`;
    }
    // normal (dashed)
    svg += `<line x1="${cx}" y1="${surfaceY - 230}" x2="${cx}" y2="${surfaceY + 20}" stroke="var(--ink-soft)" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    // incoming ray
    svg += `<line x1="${ix}" y1="${iy}" x2="${cx}" y2="${surfaceY}" stroke="var(--accent)" stroke-width="3" marker-end="url(#rf-arr)"/>`;
    // reflected ray
    svg += `<line x1="${cx}" y1="${surfaceY}" x2="${rx}" y2="${ry}" stroke="#1c6dd0" stroke-width="3" marker-end="url(#rf-arr2)"/>`;
    svg += `<defs>
      <marker id="rf-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--accent)"/></marker>
      <marker id="rf-arr2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="#1c6dd0"/></marker>
    </defs>`;
    // angle arcs
    const arcR = 40;
    const ai = surfaceY - arcR * Math.cos(a / 2);
    svg += `<path d="M ${cx - arcR * Math.sin(a)} ${surfaceY - arcR * Math.cos(a)} A ${arcR} ${arcR} 0 0 1 ${cx} ${surfaceY - arcR}" fill="none" stroke="var(--accent)" stroke-width="1.5"/>`;
    svg += `<path d="M ${cx} ${surfaceY - arcR} A ${arcR} ${arcR} 0 0 1 ${cx + arcR * Math.sin(a)} ${surfaceY - arcR * Math.cos(a)}" fill="none" stroke="#1c6dd0" stroke-width="1.5"/>`;
    svg += `<text x="${cx - 30}" y="${surfaceY - 25}" style="font-family: var(--font-mono); font-size: 11px; fill: var(--accent);">θᵢ = ${angleDeg}°</text>`;
    svg += `<text x="${cx + 8}" y="${surfaceY - 25}" style="font-family: var(--font-mono); font-size: 11px; fill: #1c6dd0;">θᵣ = ${angleDeg}°</text>`;
    svg += `</svg>`;
    root.querySelector('#rf-stage').innerHTML = svg;
    root.querySelector('#rf-av').textContent = angleDeg + '°';
  }
  render();
}
