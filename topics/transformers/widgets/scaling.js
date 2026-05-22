// Scaling widget: log-log plot of validation loss vs parameter count
// with milestone models marked. Hover any to see details.

const MODELS = [
  { name: 'GPT-1',    params: 0.12e9,  loss: 3.30, year: 2018 },
  { name: 'GPT-2',    params: 1.5e9,   loss: 2.85, year: 2019 },
  { name: 'GPT-3',    params: 175e9,   loss: 1.95, year: 2020 },
  { name: 'PaLM',     params: 540e9,   loss: 1.78, year: 2022 },
  { name: 'Chinchilla', params: 70e9,  loss: 1.85, year: 2022 },
  { name: 'Llama 2',  params: 70e9,    loss: 1.80, year: 2023 },
  { name: 'GPT-4',    params: 1700e9,  loss: 1.60, year: 2023 },
  { name: 'Llama 3 70B', params: 70e9, loss: 1.72, year: 2024 },
  { name: 'Llama 3 405B', params: 405e9, loss: 1.58, year: 2024 },
];

const CAPABILITIES = [
  { name: 'Memorize facts',      threshold: 0.1e9 },
  { name: 'Coherent paragraphs', threshold: 1e9 },
  { name: 'In-context learning', threshold: 10e9 },
  { name: 'Multi-step reasoning', threshold: 70e9 },
  { name: 'Code from description', threshold: 175e9 },
  { name: 'Tool use / agents',   threshold: 500e9 },
];

export function initScalingWidget(root) {
  let hovered = null;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Loss vs parameters (log-log)</div>

      <div class="widget-stage" id="sc-stage" style="text-align: center;"></div>

      <div class="callout" id="sc-explain">
        On log-log axes, every order-of-magnitude in parameters lowers the loss by a roughly constant amount — that's the scaling law. Hover any model.
      </div>

      <div style="margin-top: 1rem;">
        <strong>Capabilities (roughly) emerge at:</strong>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.4rem; margin-top: 0.5rem;">
          ${CAPABILITIES.map((c) => `
            <div style="font-family: var(--font-mono); font-size: 0.78rem; padding: 0.4em 0.6em; border: 1.5px solid var(--ink); border-radius: 3px; background: var(--paper-deep);">
              <strong>${c.name}</strong><br><span style="color: var(--ink-soft);">~ ${c.threshold >= 1e9 ? (c.threshold / 1e9).toFixed(0) + 'B' : (c.threshold / 1e6).toFixed(0) + 'M'} params</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  const W = 660, H = 360, PAD = 60;
  const minP = 1e8, maxP = 5e12;
  const minL = 1.5, maxL = 3.5;
  function xToPx(p) { return PAD + (Math.log10(p) - Math.log10(minP)) / (Math.log10(maxP) - Math.log10(minP)) * (W - 2 * PAD); }
  function yToPx(l) { return H - PAD - (maxL - l) / (maxL - minL) * (H - 2 * PAD); }

  function render() {
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<rect class="ml-plot-bg" x="${PAD}" y="${PAD}" width="${W - 2 * PAD}" height="${H - 2 * PAD}"/>`;
    // gridlines at log decades
    for (let p = 1e8; p <= maxP; p *= 10) {
      svg += `<line class="ml-grid" x1="${xToPx(p)}" y1="${PAD}" x2="${xToPx(p)}" y2="${H - PAD}"/>`;
      const lbl = p >= 1e12 ? (p/1e12) + 'T' : p >= 1e9 ? (p/1e9) + 'B' : (p/1e6) + 'M';
      svg += `<text class="ml-axis-text" x="${xToPx(p)}" y="${H - PAD + 14}" text-anchor="middle">${lbl}</text>`;
    }
    for (let l = 1.5; l <= 3.5; l += 0.5) {
      svg += `<line class="ml-grid" x1="${PAD}" y1="${yToPx(l)}" x2="${W - PAD}" y2="${yToPx(l)}"/>`;
      svg += `<text class="ml-axis-text" x="${PAD - 6}" y="${yToPx(l) + 3}" text-anchor="end">${l.toFixed(1)}</text>`;
    }
    svg += `<text class="ml-axis-text" x="${W/2}" y="${H - 12}" text-anchor="middle">parameters (log scale)</text>`;
    svg += `<text class="ml-axis-text" x="20" y="${H/2}" transform="rotate(-90, 20, ${H/2})" text-anchor="middle">val loss (nats/token)</text>`;
    // trend line (rough fit)
    svg += `<line x1="${xToPx(1e8)}" y1="${yToPx(3.3)}" x2="${xToPx(5e12)}" y2="${yToPx(1.45)}" stroke="var(--ink)" stroke-width="2" stroke-dasharray="4 3" opacity="0.4"/>`;
    // models
    MODELS.forEach((m, i) => {
      const cx = xToPx(m.params);
      const cy = yToPx(m.loss);
      const isHovered = hovered === i;
      svg += `<circle cx="${cx}" cy="${cy}" r="${isHovered ? 9 : 6}" fill="var(--accent)" stroke="var(--ink)" stroke-width="2" data-i="${i}" style="cursor: pointer;"/>`;
      if (isHovered) {
        const tooltip = `${m.name} · ${m.year} · ${m.params >= 1e12 ? (m.params/1e12).toFixed(1)+'T' : (m.params/1e9).toFixed(0)+'B'} params · loss ${m.loss.toFixed(2)}`;
        const w = tooltip.length * 6 + 12;
        svg += `<rect x="${Math.min(W - w - 5, Math.max(5, cx - w/2))}" y="${Math.max(5, cy - 32)}" width="${w}" height="22" rx="3" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>`;
        svg += `<text x="${Math.min(W - w/2 - 5, Math.max(w/2 + 5, cx))}" y="${Math.max(20, cy - 18)}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${tooltip}</text>`;
      } else {
        svg += `<text x="${cx}" y="${cy - 10}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px; fill: var(--ink-soft);">${m.name.split(' ')[0]}</text>`;
      }
    });
    svg += `</svg>`;
    root.querySelector('#sc-stage').innerHTML = svg;

    root.querySelectorAll('circle[data-i]').forEach((c) => {
      c.addEventListener('mouseenter', () => { hovered = Number(c.dataset.i); render(); });
      c.addEventListener('mouseleave', () => { hovered = null; render(); });
    });
  }
  render();
}
