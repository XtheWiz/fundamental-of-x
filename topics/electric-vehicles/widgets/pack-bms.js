// Pack & BMS widget: configure a pack (S x P), see voltage, capacity, kWh.
// Toggle a 'weak cell' or 'overheat' to watch the BMS react.

export function initPackBMSWidget(root) {
  let S = 96, P = 46, fault = 'none';
  const CELL_V = 3.7, CELL_AH = 4.8;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Build a pack, then break a cell</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.6rem;">
        <div style="display: grid; grid-template-columns: 130px 1fr 60px; gap: 0.6rem; align-items: center;">
          <label>Series (S):</label>
          <input type="range" id="pb-s" min="20" max="120" value="${S}" step="1">
          <div id="pb-s-v" style="font-family: var(--font-mono); text-align: right;">${S}</div>
        </div>
        <div style="display: grid; grid-template-columns: 130px 1fr 60px; gap: 0.6rem; align-items: center;">
          <label>Parallel (P):</label>
          <input type="range" id="pb-p" min="10" max="80" value="${P}" step="1">
          <div id="pb-p-v" style="font-family: var(--font-mono); text-align: right;">${P}</div>
        </div>
        <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
          <label>Fault:</label>
          <div class="pill-group">
            <input type="radio" name="pb-f" id="pb-f0" value="none" checked>
            <label for="pb-f0">none</label>
            <input type="radio" name="pb-f" id="pb-f1" value="weak">
            <label for="pb-f1">weak cell</label>
            <input type="radio" name="pb-f" id="pb-f2" value="hot">
            <label for="pb-f2">overheat</label>
          </div>
        </div>
      </div>

      <div class="widget-stage" id="pb-stage"></div>
      <div class="callout" id="pb-explain"></div>
    </div>
  `;

  root.querySelector('#pb-s').addEventListener('input', (e) => { S = +e.target.value; root.querySelector('#pb-s-v').textContent = S; render(); });
  root.querySelector('#pb-p').addEventListener('input', (e) => { P = +e.target.value; root.querySelector('#pb-p-v').textContent = P; render(); });
  root.querySelectorAll('input[name=pb-f]').forEach((r) => r.addEventListener('change', (e) => { fault = e.target.value; render(); }));

  function render() {
    const totalCells = S * P;
    const packV = S * CELL_V;
    const packAh = P * CELL_AH;
    const kWh = (packV * packAh) / 1000;

    let html = `<div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; margin-bottom: 0.6rem;">
      <div style="font-family: var(--font-mono); font-size: 0.85rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem 1rem;">
        <div>Total cells: <strong>${totalCells.toLocaleString()}</strong></div>
        <div>Pack voltage: <strong>${packV.toFixed(0)} V</strong></div>
        <div>Pack capacity: <strong>${packAh.toFixed(0)} Ah</strong></div>
        <div>Pack energy: <strong>${kWh.toFixed(1)} kWh</strong></div>
      </div>
    </div>`;

    const cols = Math.min(P, 24);
    const rows = Math.min(S, 16);
    const cellSize = 14, gap = 2;
    const W = cols * (cellSize + gap) + 20, H = rows * (cellSize + gap) + 20;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W * 1.6}px">`;
    const weakI = (rows >> 1) * cols + (cols >> 1);
    const hotZoneR = Math.min(rows, cols) / 2.5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const x = 10 + c * (cellSize + gap), y = 10 + r * (cellSize + gap);
        let fill = '#c8f0c8';
        if (fault === 'weak' && i === weakI) fill = '#d62828';
        else if (fault === 'hot') {
          const dx = c - cols/2, dy = r - rows/2;
          if (Math.sqrt(dx*dx + dy*dy) < hotZoneR) fill = '#f5a623';
        }
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fill}" stroke="var(--ink)" stroke-width="0.8" rx="2"/>`;
      }
    }
    svg += `</svg>`;
    html += `<div style="text-align: center;">${svg}</div>`;
    html += `<div style="font-family: var(--font-mono); font-size: 0.75rem; text-align: center; color: var(--ink-soft); margin-top: 0.3rem;">(showing ${rows}×${cols} subset of ${S}×${P} full pack)</div>`;

    root.querySelector('#pb-stage').innerHTML = html;

    let exp;
    if (fault === 'none') exp = `<strong>Healthy pack.</strong> Every cell sits at the same voltage. The BMS sips a few mW monitoring temperatures, individual cell voltages, and current.`;
    else if (fault === 'weak') exp = `<strong>One cell sagging.</strong> Because cells are in series, the weakest one drags down the whole string at full discharge. BMS limits depth-of-discharge to protect it — you lose effective capacity.`;
    else exp = `<strong>Thermal event detected.</strong> BMS opens the main contactors, isolates the bad module, and triggers coolant flow. If runaway reaches a single cell venting, neighbors are next — that is why packs have firewalls between modules.`;
    root.querySelector('#pb-explain').innerHTML = exp;
  }
  render();
}
