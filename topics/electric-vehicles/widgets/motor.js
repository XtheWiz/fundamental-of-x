// Motor widget: compare torque vs RPM curves for PMSM, induction, ICE.

const MOTORS = [
  { name: 'PMSM',      color: '#d62828',
    torque: (r) => r < 4000 ? 450 : 450 * 4000 / r,
    note: 'Permanent magnets. Highest efficiency at part-load, used in most modern EVs. Rare-earth supply risk.' },
  { name: 'Induction', color: '#2b6cb0',
    torque: (r) => r < 3000 ? 380 : 380 * 3000 / r,
    note: 'Tesla Model S/X front motor. No magnets, just induced fields. Cheaper, robust, slightly less efficient.' },
  { name: 'ICE (gas)', color: '#888',
    torque: (r) => {
      if (r < 1000) return 80;
      if (r < 4500) return 80 + (r - 1000) * (320 - 80) / 3500;
      if (r < 6000) return 320 - (r - 4500) * 40 / 1500;
      return 0;
    },
    note: 'Gasoline engine for comparison. Builds torque slowly, peaks mid-band, dies at redline.' },
];

export function initMotorWidget(root) {
  let active = new Set(['PMSM', 'ICE (gas)']);

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Torque vs RPM</div>

      <div class="controls">
        ${MOTORS.map((m) => `<label style="display: inline-flex; gap: 0.4em; align-items: center;">
          <input type="checkbox" data-m="${m.name}" ${active.has(m.name) ? 'checked' : ''}>
          <span style="color: ${m.color}; font-weight: 600;">${m.name}</span>
        </label>`).join('')}
      </div>

      <div class="widget-stage" id="mt-stage"></div>
      <div class="callout" id="mt-explain"></div>
    </div>
  `;

  root.querySelectorAll('input[type=checkbox]').forEach((cb) =>
    cb.addEventListener('change', () => {
      if (cb.checked) active.add(cb.dataset.m);
      else active.delete(cb.dataset.m);
      render();
    })
  );

  function render() {
    const W = 600, H = 300, PAD = 50;
    const maxR = 9000, maxT = 500;
    function x(r) { return PAD + (r / maxR) * (W - 2*PAD); }
    function y(t) { return H - PAD - (t / maxT) * (H - 2*PAD); }

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    // axes
    svg += `<line x1="${PAD}" y1="${H-PAD}" x2="${W-PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H-PAD}" stroke="var(--ink)" stroke-width="2"/>`;
    [0, 2000, 4000, 6000, 8000].forEach((r) => {
      svg += `<line x1="${x(r)}" y1="${H-PAD}" x2="${x(r)}" y2="${H-PAD+5}" stroke="var(--ink)"/>`;
      svg += `<text x="${x(r)}" y="${H-PAD+18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${r}</text>`;
    });
    [0, 100, 200, 300, 400, 500].forEach((t) => {
      svg += `<line x1="${PAD-5}" y1="${y(t)}" x2="${PAD}" y2="${y(t)}" stroke="var(--ink)"/>`;
      svg += `<text x="${PAD-8}" y="${y(t)+3}" text-anchor="end" style="font-family: var(--font-mono); font-size: 10px;">${t}</text>`;
    });
    svg += `<text x="${W/2}" y="${H-12}" text-anchor="middle" style="font-family: var(--font-display); font-size: 13px;">RPM</text>`;
    svg += `<text x="15" y="${H/2}" text-anchor="middle" style="font-family: var(--font-display); font-size: 13px;" transform="rotate(-90 15 ${H/2})">Torque (N·m)</text>`;

    MOTORS.forEach((m) => {
      if (!active.has(m.name)) return;
      let pts = [];
      for (let r = 0; r <= maxR; r += 200) pts.push(`${x(r)},${y(Math.min(maxT, m.torque(r)))}`);
      svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="${m.color}" stroke-width="3"/>`;
    });

    svg += `</svg>`;
    root.querySelector('#mt-stage').innerHTML = svg;

    const hasEV = active.has('PMSM') || active.has('Induction');
    const hasICE = active.has('ICE (gas)');
    let exp = '';
    if (hasEV && hasICE) exp = `<strong>The EV has full torque at 0 RPM.</strong> The ICE has to rev to 4000+ RPM (via a multi-speed gearbox) to match. That is why EVs feel quicker even when on-paper horsepower is similar.`;
    else if (hasEV) exp = MOTORS.find((m) => active.has(m.name)).note;
    else if (hasICE) exp = `<strong>Note the bell curve.</strong> ICE engines are designed around a power band. Outside it, you need to change gear. EVs do not have a power band — that is why they often use a single-speed reducer.`;
    else exp = `Tick at least one curve to see it.`;
    root.querySelector('#mt-explain').innerHTML = exp;
  }
  render();
}
