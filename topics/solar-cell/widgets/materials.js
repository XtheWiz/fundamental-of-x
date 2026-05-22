// Materials widget: side-by-side comparison of common solar cell technologies.

const TECHS = [
  { name: 'Crystalline silicon', eff: 22, cost: 0.30, life: 25, weight: 'heavy', notes: 'Workhorse. 90% of installed panels. Mature manufacturing.' },
  { name: 'Thin-film CdTe', eff: 18, cost: 0.25, life: 25, weight: 'light', notes: 'First Solar dominates. Lower efficiency but cheaper per watt.' },
  { name: 'CIGS thin-film', eff: 19, cost: 0.35, life: 20, weight: 'light', notes: 'Flexible, can be deposited on glass or polymer.' },
  { name: 'Perovskite', eff: 26, cost: 0.15, life: 10, weight: 'very light', notes: 'Emerging. Cheap and efficient, but stability is still being solved.' },
  { name: 'GaAs (III-V)', eff: 30, cost: 50, life: 30, weight: 'heavy', notes: 'Used in satellites. Very efficient, very expensive.' },
  { name: 'Tandem perovskite/Si', eff: 33, cost: 0.50, life: 15, weight: 'heavy', notes: 'Bleeding edge. Likely commercial future of utility solar.' },
];

export function initMaterialsWidget(root) {
  let sortBy = 'eff';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Solar cell technologies</div>

      <div class="controls">
        <label>Sort by:</label>
        <div class="pill-group">
          <input type="radio" name="mt-s" id="mt-eff" value="eff" checked>
          <label for="mt-eff">Efficiency</label>
          <input type="radio" name="mt-s" id="mt-cost" value="cost">
          <label for="mt-cost">Cost / W</label>
          <input type="radio" name="mt-s" id="mt-life" value="life">
          <label for="mt-life">Lifetime</label>
        </div>
      </div>

      <div class="widget-stage" id="mt-stage"></div>
    </div>
  `;

  root.querySelectorAll('input[name=mt-s]').forEach((r) => r.addEventListener('change', (e) => { sortBy = e.target.value; render(); }));

  function render() {
    let sorted = TECHS.slice();
    if (sortBy === 'eff') sorted.sort((a, b) => b.eff - a.eff);
    else if (sortBy === 'cost') sorted.sort((a, b) => a.cost - b.cost);
    else sorted.sort((a, b) => b.life - a.life);

    let html = `<div style="display: flex; flex-direction: column; gap: 0.4rem;">`;
    sorted.forEach((t) => {
      html += `<div style="background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem;">
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 0.5rem; align-items: center;">
          <div style="font-family: var(--font-display); letter-spacing: 0.04em;">${t.name}</div>
          <div><strong>${t.eff}%</strong><br><span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft);">efficiency</span></div>
          <div><strong>$${t.cost.toFixed(2)}/W</strong><br><span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft);">cost</span></div>
          <div><strong>${t.life} yrs</strong><br><span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft);">lifetime</span></div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft); margin-top: 0.4em;">${t.notes}</div>
      </div>`;
    });
    html += `</div>`;
    root.querySelector('#mt-stage').innerHTML = html;
  }
  render();
}
