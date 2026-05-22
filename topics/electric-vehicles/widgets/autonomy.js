// Autonomy widget: compare sensor stacks side by side, show what each
// 'sees' in a scene and what failures break each one.

const STACKS = [
  { name: 'Tesla (vision-only)',
    sensors: ['8× cameras', '12× ultrasonics (removed in newer)', 'no LiDAR, no radar (radar removed 2021)'],
    pros: 'Cheap. Scales like software. Massive fleet for data collection. End-to-end neural net.',
    cons: 'Vulnerable to glare, fog, heavy rain. No range measurement → depth is inferred. Phantom braking.',
    color: '#d62828' },
  { name: 'Waymo / Cruise / WeRide',
    sensors: ['1–5× LiDAR (spinning + solid-state)', '5–8× cameras', '6× radar', 'HD map + GPS-RTK'],
    pros: 'Centimeter range from LiDAR. Redundant sensors mean any one can fail. Operating in robotaxi service.',
    cons: 'Expensive ($150K+ extra hardware). Geo-fenced to mapped cities. Heavy compute load.',
    color: '#2b6cb0' },
  { name: 'Mobileye / Chinese (hybrid)',
    sensors: ['6–12× cameras', '5× radar', '1–2× LiDAR (high-end trims)', 'HD map (where licensed)'],
    pros: 'Production-friendly cost. Sensor diversity catches edge cases vision misses. Scales without geo-fencing.',
    cons: 'LiDAR cost still > $500/unit. Software complexity from fusing heterogeneous sensors.',
    color: '#4caf50' },
];

const SCENARIOS = [
  { name: 'Clear daylight, highway',  tesla: 95, waymo: 99, mobileye: 97 },
  { name: 'Heavy rain at night',      tesla: 60, waymo: 88, mobileye: 82 },
  { name: 'Dense fog',                tesla: 30, waymo: 75, mobileye: 70 },
  { name: 'Glare into low sun',       tesla: 55, waymo: 92, mobileye: 88 },
  { name: 'Unmapped rural road',      tesla: 85, waymo: 40, mobileye: 70 },
  { name: 'Snow over lane markings',  tesla: 35, waymo: 70, mobileye: 60 },
];

export function initAutonomyWidget(root) {
  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Vision-only vs sensor fusion</div>

      <div class="widget-stage" id="au-stage"></div>

      <div class="callout"><strong>The bet:</strong> Tesla says cameras + enough data = humans drive with vision, so a car can. Waymo says safety-critical means redundancy, not minimalism. The market may end up split: Tesla-style for personal cars, sensor-rich for robotaxis.</div>
    </div>
  `;

  let html = `<div style="display: grid; gap: 0.8rem; margin-bottom: 1rem;">`;
  STACKS.forEach((s) => {
    html += `<div style="border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; background: var(--paper);">
      <div style="font-family: var(--font-display); font-size: 1.15rem; color: ${s.color}; margin-bottom: 0.3rem;">${s.name}</div>
      <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft); margin-bottom: 0.4rem;">${s.sensors.join(' · ')}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.82rem;">
        <div><strong style="color: #4caf50;">+</strong> ${s.pros}</div>
        <div><strong style="color: #d62828;">−</strong> ${s.cons}</div>
      </div>
    </div>`;
  });
  html += `</div>`;

  html += `<div style="border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem;">
    <div style="font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 0.5rem;">Scenario robustness (rough estimate)</div>
    <div style="display: grid; grid-template-columns: 1.7fr 1fr 1fr 1fr; gap: 0.2rem 0.5rem; font-family: var(--font-mono); font-size: 0.78rem; align-items: center;">
      <div></div>
      <div style="color: ${STACKS[0].color}; font-weight: 600; text-align: center;">Tesla</div>
      <div style="color: ${STACKS[1].color}; font-weight: 600; text-align: center;">Waymo</div>
      <div style="color: ${STACKS[2].color}; font-weight: 600; text-align: center;">Hybrid</div>
      ${SCENARIOS.map((sc) => `
        <div>${sc.name}</div>
        ${['tesla', 'waymo', 'mobileye'].map((k, i) => {
          const v = sc[k];
          const c = STACKS[i].color;
          return `<div style="position: relative; height: 18px; background: var(--paper-deep); border: 1px solid var(--ink); border-radius: 2px; overflow: hidden;">
            <div style="height: 100%; width: ${v}%; background: ${c};"></div>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: ${v > 50 ? 'white' : 'var(--ink)'}; font-weight: 600;">${v}%</div>
          </div>`;
        }).join('')}
      `).join('')}
    </div>
  </div>`;

  root.querySelector('#au-stage').innerHTML = html;
}
