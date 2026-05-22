// Positional encoding widget: visualize sinusoidal PE as a heatmap.
// Show a position vector when hovered, and a similarity score between
// any two positions.

const NUM_POS = 32;
const DIM = 32;

function pe(pos, i) {
  const d = i;
  const denom = Math.pow(10000, 2 * Math.floor(d / 2) / DIM);
  return d % 2 === 0 ? Math.sin(pos / denom) : Math.cos(pos / denom);
}

function vec(pos) {
  const v = new Array(DIM);
  for (let i = 0; i < DIM; i++) v[i] = pe(pos, i);
  return v;
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  return dot / Math.sqrt(na * nb);
}

export function initPositionalWidget(root) {
  let posA = 5, posB = 7;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Sinusoidal positional encoding (32 positions × 32 dims)</div>

      <div class="widget-stage" id="pp-stage" style="text-align: center;"></div>

      <div class="controls">
        <label>Position A:</label>
        <input type="range" min="0" max="${NUM_POS - 1}" value="${posA}" id="pp-a">
        <span style="font-family: var(--font-mono);" id="pp-a-val">${posA}</span>
        <label>Position B:</label>
        <input type="range" min="0" max="${NUM_POS - 1}" value="${posB}" id="pp-b">
        <span style="font-family: var(--font-mono);" id="pp-b-val">${posB}</span>
      </div>

      <div class="metrics">
        <div class="metric"><div class="label">Distance</div><div class="value" id="m-dist">—</div></div>
        <div class="metric accent"><div class="label">Cosine similarity</div><div class="value" id="m-sim">—</div></div>
      </div>

      <div class="callout" id="pp-explain"></div>
    </div>
  `;

  root.querySelector('#pp-a').addEventListener('input', (e) => { posA = Number(e.target.value); render(); });
  root.querySelector('#pp-b').addEventListener('input', (e) => { posB = Number(e.target.value); render(); });

  function render() {
    const W = 640, H = 240, PAD = 50;
    const cellW = (W - 2 * PAD) / NUM_POS;
    const cellH = (H - 2 * PAD) / DIM;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<text class="ml-axis-text" x="${W/2}" y="20" text-anchor="middle">positional encoding heatmap</text>`;
    svg += `<text class="ml-axis-text" x="${W/2}" y="${H - 8}" text-anchor="middle">position →</text>`;
    svg += `<text class="ml-axis-text" x="14" y="${H/2}" text-anchor="middle" transform="rotate(-90, 14, ${H/2})">embedding dim →</text>`;
    for (let p = 0; p < NUM_POS; p++) {
      for (let i = 0; i < DIM; i++) {
        const v = pe(p, i);
        const intensity = (v + 1) / 2;  // map [-1,1] to [0,1]
        const color = `rgb(${Math.round(255 - intensity * 200)}, ${Math.round(60 + intensity * 60)}, ${Math.round(60 + intensity * 30)})`;
        svg += `<rect x="${PAD + p * cellW}" y="${PAD + i * cellH}" width="${cellW}" height="${cellH}" fill="${color}"/>`;
      }
    }
    // markers for A and B
    [{ p: posA, color: '#2a8a3e', label: 'A' }, { p: posB, color: '#1c6dd0', label: 'B' }].forEach((mk) => {
      svg += `<rect x="${PAD + mk.p * cellW - 1}" y="${PAD - 4}" width="${cellW + 2}" height="${H - 2 * PAD + 8}" fill="none" stroke="${mk.color}" stroke-width="2"/>`;
      svg += `<text x="${PAD + mk.p * cellW + cellW/2}" y="${PAD - 8}" text-anchor="middle" style="font-family: var(--font-display); fill: ${mk.color}; font-size: 12px;">${mk.label}=${mk.p}</text>`;
    });
    svg += `</svg>`;
    root.querySelector('#pp-stage').innerHTML = svg;

    root.querySelector('#pp-a-val').textContent = posA;
    root.querySelector('#pp-b-val').textContent = posB;
    root.querySelector('#m-dist').textContent = Math.abs(posA - posB);
    const sim = cosineSim(vec(posA), vec(posB));
    root.querySelector('#m-sim').textContent = sim.toFixed(3);

    let exp;
    if (posA === posB) exp = `Same position — vectors identical, similarity = 1.0.`;
    else if (Math.abs(posA - posB) <= 3) exp = `<strong>Nearby positions</strong> have similar encodings (high cosine similarity). That's by design — attention can use proximity as a soft signal.`;
    else exp = `Distant positions have low similarity. The model can still tell them apart (vectors are unique), but they don't blur together.`;
    root.querySelector('#pp-explain').innerHTML = exp;
  }
  render();
}
