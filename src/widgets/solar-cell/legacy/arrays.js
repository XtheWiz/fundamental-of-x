// Arrays widget: stack cells in series/parallel, see total V/I/P, with
// shading penalty for series.

export function initArraysWidget(root) {
  let series = 4;
  let parallel = 2;
  let shaded = false;   // shade one cell in one string

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Cells per string × strings in parallel</div>

      <div class="controls">
        <label>Cells in series: <strong id="ar-sv">${series}</strong></label>
        <input type="range" min="1" max="8" value="${series}" id="ar-s" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Parallel strings: <strong id="ar-pv">${parallel}</strong></label>
        <input type="range" min="1" max="4" value="${parallel}" id="ar-p" style="flex: 1;">
      </div>
      <div class="controls">
        <label><input type="checkbox" id="ar-sh"> Shade one cell (simulate a leaf/dust)</label>
      </div>

      <div class="widget-stage" id="ar-stage"></div>
      <div class="callout" id="ar-explain"></div>
    </div>
  `;

  root.querySelector('#ar-s').addEventListener('input', (e) => { series = Number(e.target.value); render(); });
  root.querySelector('#ar-p').addEventListener('input', (e) => { parallel = Number(e.target.value); render(); });
  root.querySelector('#ar-sh').addEventListener('change', (e) => { shaded = e.target.checked; render(); });

  function render() {
    const V_PER = 0.5;
    const I_PER = 8;
    // String current limited by weakest cell (shading factor)
    const stringCurrent = shaded ? I_PER * 0.1 : I_PER;
    const totalV = V_PER * series;
    const totalI = stringCurrent * parallel;
    const totalP = totalV * totalI;
    const idealP = V_PER * series * I_PER * parallel;

    // Visualization
    let cells = '';
    for (let p = 0; p < parallel; p++) {
      cells += '<div style="display: flex; gap: 4px; margin: 4px 0; align-items: center;">';
      for (let s = 0; s < series; s++) {
        const isShaded = shaded && p === 0 && s === 0;
        cells += `<div style="width: 50px; height: 50px; background: ${isShaded ? '#444' : '#cfe5ff'}; border: 1.5px solid var(--ink); border-radius: 2px; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 0.7rem; color: ${isShaded ? 'white' : 'var(--ink)'};">${isShaded ? '🍃' : V_PER + 'V'}</div>`;
        if (s < series - 1) cells += '<div style="font-family: var(--font-mono); font-size: 0.8rem;">—</div>';
      }
      cells += `<div style="margin-left: 0.8rem; font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-soft);">string ${p + 1}: ${V_PER * series}V × ${(shaded && p === 0 ? stringCurrent : I_PER).toFixed(1)}A</div>`;
      cells += '</div>';
    }

    let html = `<div>${cells}</div>
      <div style="margin-top: 0.6rem; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.4rem;">
        <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: 4px; padding: 0.4rem; text-align: center;">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft);">VOLTAGE</div>
          <div style="font-family: var(--font-display); font-size: 1.4rem;">${totalV} V</div>
        </div>
        <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: 4px; padding: 0.4rem; text-align: center;">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft);">CURRENT</div>
          <div style="font-family: var(--font-display); font-size: 1.4rem;">${totalI.toFixed(1)} A</div>
        </div>
        <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: 4px; padding: 0.4rem; text-align: center; box-shadow: 3px 3px 0 var(--accent);">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft);">POWER</div>
          <div style="font-family: var(--font-display); font-size: 1.4rem;">${totalP.toFixed(1)} W</div>
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: ${totalP < idealP * 0.95 ? 'var(--accent)' : 'var(--ink-soft)'};">${totalP < idealP * 0.95 ? '(was ' + idealP.toFixed(1) + 'W unshaded)' : ''}</div>
        </div>
      </div>
    `;
    root.querySelector('#ar-stage').innerHTML = html;
    root.querySelector('#ar-sv').textContent = series;
    root.querySelector('#ar-pv').textContent = parallel;

    let exp;
    if (!shaded) exp = `${series}-cell series strings give ${totalV}V; ${parallel} strings in parallel give ${totalI.toFixed(0)}A. Total power scales linearly with cell count.`;
    else {
      const pct = (1 - totalP / idealP) * 100;
      exp = `<strong>One shaded cell dropped output by ${pct.toFixed(0)}%.</strong> The string with the shaded cell can only push as much current as its weakest cell. Real panels add bypass diodes to short around shaded sub-strings — they help but don't fully fix this.`;
    }
    root.querySelector('#ar-explain').innerHTML = exp;
  }
  render();
}
