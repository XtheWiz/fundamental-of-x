// Lens widget: draw a converging lens with focal length f, plot
// object + image via thin-lens equation.

export function initLensesWidget(root) {
  let f = 80;
  let objDist = 120;
  let objH = 30;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Converging lens</div>

      <div class="controls">
        <label>Focal length f: <strong id="ls-fv">${f}</strong> px</label>
        <input type="range" min="30" max="150" value="${f}" id="ls-f" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Object distance: <strong id="ls-ov">${objDist}</strong> px</label>
        <input type="range" min="20" max="280" value="${objDist}" id="ls-o" style="flex: 1;">
      </div>

      <div class="widget-stage" id="ls-stage" style="text-align: center;"></div>
      <div class="callout" id="ls-explain"></div>
    </div>
  `;

  root.querySelector('#ls-f').addEventListener('input', (e) => { f = Number(e.target.value); render(); });
  root.querySelector('#ls-o').addEventListener('input', (e) => { objDist = Number(e.target.value); render(); });

  function render() {
    const W = 640, H = 280, cx = 320, ax = H / 2;
    // Image distance from thin-lens: 1/o + 1/i = 1/f
    const i = objDist === f ? Infinity : (objDist * f) / (objDist - f);
    const magnification = -i / objDist;
    const imgH = objH * magnification;

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // optical axis
    svg += `<line x1="20" y1="${ax}" x2="${W - 20}" y2="${ax}" stroke="var(--ink-soft)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    // lens
    svg += `<ellipse cx="${cx}" cy="${ax}" rx="10" ry="${H/2 - 20}" fill="#cfe5ff" stroke="var(--ink)" stroke-width="2"/>`;
    // focal points
    svg += `<circle cx="${cx - f}" cy="${ax}" r="4" fill="var(--ink)"/>`;
    svg += `<circle cx="${cx + f}" cy="${ax}" r="4" fill="var(--ink)"/>`;
    svg += `<text x="${cx - f}" y="${ax + 16}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">F</text>`;
    svg += `<text x="${cx + f}" y="${ax + 16}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">F</text>`;
    // object (arrow up at left)
    const ox = cx - objDist;
    svg += `<line x1="${ox}" y1="${ax}" x2="${ox}" y2="${ax - objH}" stroke="var(--accent)" stroke-width="3" marker-end="url(#ls-arr)"/>`;
    svg += `<text x="${ox}" y="${ax - objH - 6}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px; fill: var(--accent);">object</text>`;
    // image
    if (isFinite(i)) {
      const ix = cx + i;
      if (ix > 0 && ix < W) {
        svg += `<line x1="${ix}" y1="${ax}" x2="${ix}" y2="${ax - imgH}" stroke="#1c6dd0" stroke-width="3" marker-end="url(#ls-arr2)"/>`;
        svg += `<text x="${ix}" y="${ax + (imgH > 0 ? -imgH - 6 : -imgH + 18)}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px; fill: #1c6dd0;">image</text>`;
      }
      // 3 principal rays
      // 1. through optical center, undeviated
      svg += `<line x1="${ox}" y1="${ax - objH}" x2="${cx + i}" y2="${ax - imgH}" stroke="#1c6dd0" stroke-width="1" opacity="0.6"/>`;
      // 2. parallel to axis → through far focal point
      svg += `<line x1="${ox}" y1="${ax - objH}" x2="${cx}" y2="${ax - objH}" stroke="#1c6dd0" stroke-width="1" opacity="0.6"/>`;
      svg += `<line x1="${cx}" y1="${ax - objH}" x2="${cx + i}" y2="${ax - imgH}" stroke="#1c6dd0" stroke-width="1" opacity="0.6"/>`;
    }
    svg += `<defs>
      <marker id="ls-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--accent)"/></marker>
      <marker id="ls-arr2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="#1c6dd0"/></marker>
    </defs>`;
    svg += `</svg>`;
    root.querySelector('#ls-stage').innerHTML = svg;
    root.querySelector('#ls-fv').textContent = f;
    root.querySelector('#ls-ov').textContent = objDist;

    let exp;
    if (Math.abs(objDist - f) < 5) exp = `Object at the focal point → rays come out parallel, image at infinity. This is how a flashlight reflector works.`;
    else if (objDist < f) exp = `<strong>Object inside f.</strong> Image is virtual (on the same side as the object), upright, magnified. This is a magnifying glass.`;
    else if (objDist < 2 * f) exp = `<strong>Object between f and 2f.</strong> Image is real, inverted, magnified. This is what a projector does.`;
    else exp = `<strong>Object beyond 2f.</strong> Image is real, inverted, reduced. This is what a camera does.`;
    root.querySelector('#ls-explain').innerHTML = exp + `<br>Magnification: ${magnification.toFixed(2)}× — ${magnification < 0 ? 'inverted' : 'upright'}.`;
  }
  render();
}
