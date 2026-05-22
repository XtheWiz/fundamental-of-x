// Color widget: RGB additive mixer and CMY subtractive analogy.

export function initColorWidget(root) {
  let r = 200, g = 100, b = 50;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Mix RGB primaries (additive — like a screen)</div>

      <div class="controls">
        <label>Red: <strong id="cl-rv">${r}</strong></label>
        <input type="range" min="0" max="255" value="${r}" id="cl-r" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Green: <strong id="cl-gv">${g}</strong></label>
        <input type="range" min="0" max="255" value="${g}" id="cl-g" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Blue: <strong id="cl-bv">${b}</strong></label>
        <input type="range" min="0" max="255" value="${b}" id="cl-b" style="flex: 1;">
      </div>

      <div class="widget-stage" id="cl-stage" style="text-align: center;"></div>

      <div class="callout">Same three primaries are inside every screen pixel — combine them in different amounts and your brain reconstructs the perceived color. CMY printing inverts this: pigments <em>absorb</em> the channels you don't want.</div>
    </div>
  `;

  ['r','g','b'].forEach((k) => {
    root.querySelector('#cl-' + k).addEventListener('input', (e) => {
      const v = Number(e.target.value);
      if (k === 'r') r = v;
      else if (k === 'g') g = v;
      else b = v;
      render();
    });
  });

  function render() {
    const W = 360, H = 240, cx = W/2, cy = 110, R = 60;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // three overlapping circles with screen blending (use opacity)
    svg += `<circle cx="${cx - 32}" cy="${cy}" r="${R}" fill="rgb(${r}, 0, 0)" opacity="0.85"/>`;
    svg += `<circle cx="${cx + 32}" cy="${cy}" r="${R}" fill="rgb(0, ${g}, 0)" opacity="0.85" style="mix-blend-mode: screen;"/>`;
    svg += `<circle cx="${cx}" cy="${cy + 36}" r="${R}" fill="rgb(0, 0, ${b})" opacity="0.85" style="mix-blend-mode: screen;"/>`;
    // result swatch below
    svg += `<rect x="40" y="200" width="${W - 80}" height="30" fill="rgb(${r}, ${g}, ${b})" stroke="var(--ink)" stroke-width="2" rx="3"/>`;
    svg += `<text x="${W/2}" y="220" text-anchor="middle" style="font-family: var(--font-mono); font-size: 12px; fill: ${(r+g+b) > 400 ? 'black' : 'white'};">rgb(${r}, ${g}, ${b})</text>`;
    svg += `</svg>`;
    root.querySelector('#cl-stage').innerHTML = svg;
    root.querySelector('#cl-rv').textContent = r;
    root.querySelector('#cl-gv').textContent = g;
    root.querySelector('#cl-bv').textContent = b;
  }
  render();
}
