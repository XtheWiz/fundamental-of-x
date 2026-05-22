// Regen widget: simulate a stop from a given speed, show kinetic energy
// recovered vs lost to friction brakes and rolling/aero drag.

export function initRegenWidget(root) {
  let speed = 100;       // km/h
  let aggressive = 0.7;  // regen aggressiveness (0–1, share of decel handled by regen vs friction)

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">How much braking energy comes back</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: grid; grid-template-columns: 160px 1fr 70px; gap: 0.6rem; align-items: center;">
          <label>Speed (km/h):</label>
          <input type="range" id="rg-s" min="20" max="150" value="${speed}" step="5">
          <div id="rg-s-v" style="font-family: var(--font-mono); text-align: right;">${speed}</div>
        </div>
        <div style="display: grid; grid-template-columns: 160px 1fr 70px; gap: 0.6rem; align-items: center;">
          <label>Regen aggressiveness:</label>
          <input type="range" id="rg-a" min="0" max="100" value="${aggressive*100}" step="5">
          <div id="rg-a-v" style="font-family: var(--font-mono); text-align: right;">${Math.round(aggressive*100)}%</div>
        </div>
      </div>

      <div class="widget-stage" id="rg-stage"></div>
      <div class="callout" id="rg-explain"></div>
    </div>
  `;

  root.querySelector('#rg-s').addEventListener('input', (e) => { speed = +e.target.value; root.querySelector('#rg-s-v').textContent = speed; render(); });
  root.querySelector('#rg-a').addEventListener('input', (e) => { aggressive = +e.target.value / 100; root.querySelector('#rg-a-v').textContent = Math.round(aggressive*100) + '%'; render(); });

  function render() {
    const mass = 2000; // kg
    const v = speed / 3.6; // m/s
    const KE = 0.5 * mass * v * v / 1000; // kJ
    const conversionEff = 0.85;
    // motor current saturates at low speed → regen capped
    const motorSaturation = Math.min(1, v / 8); // <8 m/s (~29 km/h) reduces regen
    const recovered = KE * aggressive * conversionEff * motorSaturation;
    const friction = KE * (1 - aggressive * motorSaturation);
    const lostInConversion = KE * aggressive * motorSaturation * (1 - conversionEff);

    const total = KE;
    const recPct = (recovered / total) * 100;
    const lossPct = (lostInConversion / total) * 100;
    const fricPct = (friction / total) * 100;

    let html = `<div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; margin-bottom: 0.6rem; font-family: var(--font-mono); font-size: 0.85rem;">
      Kinetic energy at ${speed} km/h: <strong>${KE.toFixed(0)} kJ</strong> (= ${(KE/3600).toFixed(3)} kWh)
    </div>

    <div style="display: flex; height: 50px; border: 2px solid var(--ink); border-radius: var(--radius); overflow: hidden; margin-bottom: 0.4rem;">
      <div style="width: ${recPct}%; background: #4caf50; display: flex; align-items: center; justify-content: center; color: white; font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600;">${recPct > 8 ? recPct.toFixed(0) + '%' : ''}</div>
      <div style="width: ${lossPct}%; background: #f5a623; display: flex; align-items: center; justify-content: center; color: var(--ink); font-family: var(--font-mono); font-size: 0.8rem;">${lossPct > 8 ? lossPct.toFixed(0) + '%' : ''}</div>
      <div style="width: ${fricPct}%; background: #d62828; display: flex; align-items: center; justify-content: center; color: white; font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600;">${fricPct > 8 ? fricPct.toFixed(0) + '%' : ''}</div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; font-family: var(--font-mono); font-size: 0.78rem;">
      <div><span style="display: inline-block; width: 12px; height: 12px; background: #4caf50; border: 1px solid var(--ink); vertical-align: middle;"></span> Recovered: <strong>${recovered.toFixed(0)} kJ</strong></div>
      <div><span style="display: inline-block; width: 12px; height: 12px; background: #f5a623; border: 1px solid var(--ink); vertical-align: middle;"></span> Conversion loss: <strong>${lostInConversion.toFixed(0)} kJ</strong></div>
      <div><span style="display: inline-block; width: 12px; height: 12px; background: #d62828; border: 1px solid var(--ink); vertical-align: middle;"></span> Friction brake: <strong>${friction.toFixed(0)} kJ</strong></div>
    </div>`;
    root.querySelector('#rg-stage').innerHTML = html;

    let exp;
    if (speed < 25) exp = `<strong>Below ~25 km/h regen weakens.</strong> The motor cannot generate enough back-EMF at low speeds, so most braking falls back on friction. That is why aggressive one-pedal driving still uses pads near a stop.`;
    else if (aggressive < 0.3) exp = `<strong>Mostly coasting/friction braking.</strong> Most of the kinetic energy becomes heat in the pads. Range suffers — this is the 'no regen' world ICE cars live in.`;
    else if (aggressive > 0.9) exp = `<strong>One-pedal driving.</strong> Up to ${conversionEff*100}% of recoverable energy goes back into the pack. Drag and rolling resistance still steal some, so the realistic ceiling sits around 60–70%.`;
    else exp = `<strong>Recovered ${recPct.toFixed(0)}% of kinetic energy.</strong> The rest is friction-brake heat plus conversion losses. Driving smoothly and using one-pedal mode in city traffic adds 10–20% real-world range.`;
    root.querySelector('#rg-explain').innerHTML = exp;
  }
  render();
}
