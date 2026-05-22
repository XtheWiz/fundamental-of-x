// Real-world widget: waterfall of efficiency losses from 22% nameplate
// down to ~15% real-world.

const LOSSES = [
  { name: 'Panel nameplate (STC)', value: 22.0, isLoss: false },
  { name: 'Temperature derate (60°C)', value: -2.6, note: '0.4%/°C × 35°C above STC' },
  { name: 'Tilt/orientation', value: -2.0, note: 'flat roof, no tilt' },
  { name: 'Soiling (dust, pollen)', value: -0.6, note: '3% relative' },
  { name: 'Mismatch + wiring', value: -0.7, note: 'panel-to-panel variation' },
  { name: 'Inverter DC→AC', value: -0.5, note: '3% conversion loss' },
  { name: 'Aging (year 10)', value: -1.0, note: '0.5%/year' },
];

export function initRealWorldWidget(root) {
  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">From 22% nameplate to real-world output</div>

      <div class="widget-stage" id="rw-stage"></div>

      <div class="callout">Total real-world efficiency: <strong>~14.6%</strong> on a hot rooftop in year 10. Most loss is preventable in part — clean panels, tilt them right, give them airflow.</div>
    </div>
  `;

  function render() {
    const W = 600, H = 280, PAD = 40;
    const maxV = 22;
    const barW = (W - 2 * PAD) / LOSSES.length - 4;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    let cum = 0;
    LOSSES.forEach((l, i) => {
      const x = PAD + i * (barW + 4);
      let y, h, fill;
      if (i === 0) {
        h = (l.value / maxV) * (H - 2 * PAD);
        y = H - PAD - h;
        cum = l.value;
        fill = 'var(--accent)';
      } else {
        h = (Math.abs(l.value) / maxV) * (H - 2 * PAD);
        y = H - PAD - (cum / maxV) * (H - 2 * PAD);
        cum += l.value;
        fill = '#f7c8c8';
      }
      svg += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${fill}" stroke="var(--ink)" stroke-width="1.5"/>`;
      svg += `<text class="ml-axis-text" x="${x + barW/2}" y="${H - PAD + 14}" text-anchor="middle" style="font-size: 9px;">${l.name.length > 18 ? l.name.slice(0, 15) + '…' : l.name}</text>`;
      svg += `<text class="ml-axis-text" x="${x + barW/2}" y="${y - 5}" text-anchor="middle" style="font-weight: 600;">${l.value > 0 ? '+' : ''}${l.value}%</text>`;
    });
    // Final result bar
    const finalX = PAD + LOSSES.length * (barW + 4);
    const finalH = (cum / maxV) * (H - 2 * PAD);
    svg += `<rect x="${finalX}" y="${H - PAD - finalH}" width="${barW}" height="${finalH}" fill="#c8f0c8" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<text class="ml-axis-text" x="${finalX + barW/2}" y="${H - PAD + 14}" text-anchor="middle" style="font-weight: 600;">REAL</text>`;
    svg += `<text class="ml-axis-text" x="${finalX + barW/2}" y="${H - PAD - finalH - 5}" text-anchor="middle" style="font-weight: 600;">${cum.toFixed(1)}%</text>`;
    svg += `</svg>`;
    root.querySelector('#rw-stage').innerHTML = svg;
  }
  render();
}
