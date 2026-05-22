// Infrastructure widget: compare plug standards, charging power, time to 80%.

const PLUGS = [
  { name: 'Type 1 / J1772',  ac: true,  region: 'NA legacy', maxKW: 7.4,  desc: 'Old US AC standard, single-phase. Home and L2 chargers.' },
  { name: 'Type 2 (Mennekes)', ac: true, region: 'EU / global', maxKW: 22, desc: 'European AC standard. Three-phase up to 22 kW. Most home wallboxes.' },
  { name: 'CCS Combo 1',      ac: false, region: 'NA',        maxKW: 350, desc: 'AC + DC pins in one connector. Used by Ford, GM, VW, Hyundai in North America.' },
  { name: 'CCS Combo 2',      ac: false, region: 'EU',        maxKW: 400, desc: 'European DC standard. Now also dominant outside Tesla globally.' },
  { name: 'NACS (Tesla)',     ac: false, region: 'NA',        maxKW: 250, desc: 'Tesla\'s small plug, now adopted by Ford, GM, Rivian, others. AC + DC same pins.' },
  { name: 'GB/T',             ac: false, region: 'China',     maxKW: 250, desc: 'China\'s DC standard. Separate AC plug. Mega-watt successor (ChaoJi) coming.' },
  { name: 'CHAdeMO',          ac: false, region: 'Japan',     maxKW: 100, desc: 'Aging Japanese DC standard. Nissan Leaf legacy. Mostly dead outside Japan.' },
  { name: 'MCS',              ac: false, region: 'global',    maxKW: 3750, desc: 'Megawatt Charging System — for trucks. Hot off the spec table.' },
];

export function initInfraWidget(root) {
  let packKWh = 75;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Plug standards · time to 80%</div>

      <div class="controls" style="display: grid; grid-template-columns: 160px 1fr 70px; gap: 0.6rem; align-items: center;">
        <label>Your pack (kWh):</label>
        <input type="range" id="if-p" min="40" max="120" value="${packKWh}" step="5">
        <div id="if-p-v" style="font-family: var(--font-mono); text-align: right;">${packKWh}</div>
      </div>

      <div class="widget-stage" id="if-stage"></div>
      <div class="callout"><strong>Why so many standards?</strong> Each region's grid (1ph vs 3ph), regulator (UL vs CE vs CCC), and incumbent automaker froze the connector decision at different points. The world is slowly converging on CCS or NACS for DC and Type 2 for AC.</div>
    </div>
  `;

  root.querySelector('#if-p').addEventListener('input', (e) => { packKWh = +e.target.value; root.querySelector('#if-p-v').textContent = packKWh; render(); });

  function render() {
    const target = packKWh * 0.8;
    let html = `<div style="display: grid; gap: 0.4rem;">`;
    const maxPower = Math.max(...PLUGS.map((p) => p.maxKW));
    PLUGS.forEach((p) => {
      // Effective avg power: DC tapers, so use 0.6 of max for DC; AC delivers near-rated steady
      const avgKW = p.ac ? p.maxKW * 0.9 : p.maxKW * 0.55;
      const minutes = target / avgKW * 60;
      const barPct = Math.log10(p.maxKW) / Math.log10(maxPower) * 100;
      html += `<div style="display: grid; grid-template-columns: 160px 1fr 90px 90px; gap: 0.6rem; align-items: center; padding: 0.4rem 0.6rem; border: 1.5px solid var(--ink); border-radius: 3px; background: ${p.ac ? 'var(--paper)' : 'var(--paper-deep)'};">
        <div>
          <div style="font-weight: 600; font-family: var(--font-mono); font-size: 0.85rem;">${p.name}</div>
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft);">${p.region} · ${p.ac ? 'AC' : 'DC'}</div>
        </div>
        <div style="position: relative; height: 18px; background: var(--paper); border: 1px solid var(--ink); border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; width: ${barPct}%; background: ${p.ac ? '#2b6cb0' : '#d62828'};"></div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.8rem; text-align: right;"><strong>${p.maxKW} kW</strong></div>
        <div style="font-family: var(--font-mono); font-size: 0.8rem; text-align: right;">${minutes < 60 ? minutes.toFixed(0) + ' min' : (minutes/60).toFixed(1) + ' h'}</div>
      </div>
      <div style="font-size: 0.78rem; color: var(--ink-soft); padding: 0 0.6rem 0.3rem;">${p.desc}</div>`;
    });
    html += `</div>`;
    root.querySelector('#if-stage').innerHTML = html;
  }
  render();
}
