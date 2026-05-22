// Photons widget: single-photon double-slit. Fire photons one at a
// time, each hits a random spot weighted by the interference pattern.

export function initPhotonsWidget(root) {
  const hits = [];   // {x, y}
  let total = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Fire photons one at a time through a double slit</div>

      <div class="controls">
        <button class="btn btn-accent" id="ph-one">Fire 1 photon</button>
        <button class="btn" id="ph-100">Fire 100</button>
        <button class="btn" id="ph-1000">Fire 1000</button>
        <button class="btn btn-ghost" id="ph-reset">Reset</button>
      </div>

      <div class="widget-stage" id="ph-stage" style="text-align: center; min-height: 280px;"></div>

      <div class="callout" id="ph-explain"></div>
    </div>
  `;

  root.querySelector('#ph-one').addEventListener('click', () => fire(1));
  root.querySelector('#ph-100').addEventListener('click', () => fire(100));
  root.querySelector('#ph-1000').addEventListener('click', () => fire(1000));
  root.querySelector('#ph-reset').addEventListener('click', () => { hits.length = 0; total = 0; render(); });

  function fire(n) {
    for (let i = 0; i < n; i++) {
      // Sample x from the interference pattern via rejection sampling
      while (true) {
        const x = Math.random() * 2 - 1;  // [-1, 1]
        // I(x) ∝ cos²(k·d·x / L), pick k·d/L ≈ 8
        const I = Math.cos(8 * x) ** 2;
        if (Math.random() < I) {
          hits.push({ x: x, y: Math.random() * 0.8 + 0.1 });
          total++;
          break;
        }
      }
    }
    render();
  }

  function render() {
    const W = 560, H = 280, screenX = W - 60;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // source
    svg += `<rect x="20" y="${H/2 - 15}" width="40" height="30" fill="var(--paper-deep)" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<text x="40" y="${H/2 + 5}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">src</text>`;
    // double slit
    const slitX = 220;
    svg += `<rect x="${slitX - 5}" y="0" width="10" height="${H/2 - 30}" fill="var(--ink)"/>`;
    svg += `<rect x="${slitX - 5}" y="${H/2 - 10}" width="10" height="20" fill="var(--ink)"/>`;
    svg += `<rect x="${slitX - 5}" y="${H/2 + 30}" width="10" height="${H/2 - 30}" fill="var(--ink)"/>`;
    // screen
    svg += `<rect x="${screenX}" y="20" width="20" height="${H - 40}" fill="var(--paper-deep)" stroke="var(--ink)" stroke-width="2"/>`;
    // hits
    hits.forEach((h) => {
      const y = 20 + h.y * (H - 40);
      svg += `<circle cx="${screenX + 10}" cy="${y}" r="2" fill="var(--accent)" opacity="0.5"/>`;
      // distribute across screen width:
      const xpos = screenX + 5 + ((h.x + 1) / 2) * 14;
      // actually use h.x to position vertically on the strip:
    });
    // Map .x of each hit to y on screen:
    svg += `<g>`;
    hits.forEach((h) => {
      const y = 24 + ((h.x + 1) / 2) * (H - 48);
      svg += `<circle cx="${screenX + 10}" cy="${y}" r="1.8" fill="var(--accent)" opacity="0.4"/>`;
    });
    svg += `</g>`;
    svg += `<text x="${W/2}" y="${H - 8}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">${total} photon${total === 1 ? '' : 's'} fired</text>`;
    svg += `</svg>`;
    root.querySelector('#ph-stage').innerHTML = svg;

    let exp;
    if (total === 0) exp = `Fire one photon. It hits one spot — like a particle.`;
    else if (total < 20) exp = `Each photon hits a single spot. The pattern looks random.`;
    else if (total < 200) exp = `Bands are starting to appear. The single particles are <em>collectively</em> tracing out a wave pattern.`;
    else exp = `<strong>Clear interference fringes.</strong> Each individual photon went through one slit (particle), but the pattern over many is the wave-interference pattern. That is wave-particle duality.`;
    root.querySelector('#ph-explain').innerHTML = exp;
  }
  render();
}
