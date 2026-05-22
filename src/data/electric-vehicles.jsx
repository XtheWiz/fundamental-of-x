import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import { initCellsWidget } from '../widgets/electric-vehicles/legacy/cells.js';
import { initPackBMSWidget } from '../widgets/electric-vehicles/legacy/pack-bms.js';
import { initMotorWidget } from '../widgets/electric-vehicles/legacy/motor.js';
import { initRegenWidget } from '../widgets/electric-vehicles/legacy/regen.js';
import { initChargingWidget } from '../widgets/electric-vehicles/legacy/charging.js';
import { initRangeWidget } from '../widgets/electric-vehicles/legacy/range.js';
import { initInfraWidget } from '../widgets/electric-vehicles/legacy/infrastructure.js';
import { initAutonomyWidget } from '../widgets/electric-vehicles/legacy/autonomy.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'electric-vehicles',
  title: 'Electric Vehicles',
  intro: <>Eight lessons stripping a Tesla or BYD down to principles — cell chemistry, BMS, motors, regen braking, charging curves, range estimation, charging infrastructure, and the autonomy stack.</>,
  lessons: [
    { slug: 'cells', number: '01', title: 'Battery Cells', blurb: 'Lithium-ion vs LFP vs solid-state.', Widget: W(initCellsWidget),
      intro: <>The unit cell of a pack. Chemistry decides energy density, cost, safety, and cycle life. Trade-offs are real — you don\'t get all four.</>, sections: [],
      takeaways: ['NMC/NCA: highest energy density, higher fire risk, shorter cycle life.', 'LFP: cheaper, safer, longer-lived, lower energy density.', 'Solid-state: emerging — higher density and safer, but slow to manufacture at scale.', 'Cell form factor (18650, 21700, 4680, pouch, prismatic) is a packaging choice, not a chemistry one.'] },
    { slug: 'pack-bms', number: '02', title: 'Battery Pack & BMS', blurb: 'Thousands of cells in series and parallel.', Widget: W(initPackBMSWidget),
      intro: <>An EV pack has thousands of cells. The BMS balances them, watches for thermal runaway, and keeps each cell in its safe operating window.</>, sections: [],
      takeaways: ['Pack voltage = cells in series × cell voltage.', 'Pack capacity = cells in parallel × cell capacity.', 'BMS balances cells during charging — weakest cell limits the whole pack.', 'Thermal management is critical — heat is the killer.'] },
    { slug: 'motor', number: '03', title: 'Electric Motors', blurb: 'PMSM vs induction vs reluctance. Torque/RPM curves.', Widget: W(initMotorWidget),
      intro: <>EV motors deliver full torque from 0 RPM — no need for a multi-speed gearbox. Different motor types trade efficiency, cost, and rare-earth dependency.</>, sections: [],
      takeaways: ['PMSM: highest efficiency, needs rare-earth magnets.', 'Induction: cheaper, no magnets, slightly less efficient.', 'Switched reluctance: simplest, no magnets, but noisier.', 'EVs use a single-speed reducer — no gearbox needed.'] },
    { slug: 'regen', number: '04', title: 'Regenerative Braking', blurb: 'Stop the car by running the motor backwards.', Widget: W(initRegenWidget),
      intro: <>When you lift off the throttle, the motor acts as a generator, converting kinetic energy back to electricity. Recovers ~70% of braking energy in city driving.</>, sections: [],
      takeaways: ['Recovers kinetic energy that would otherwise become brake-pad heat.', 'Strongest at moderate speeds — too slow and the EMF is too low.', 'Friction brakes still needed for emergency stops and at very low speeds.', 'One-pedal driving is essentially aggressive regen + low creep.'] },
    { slug: 'charging', number: '05', title: 'Charging Curves', blurb: 'Why fast charging slows past 80%.', Widget: W(initChargingWidget),
      intro: <>Below 80% the pack accepts maximum power. Above that, the BMS tapers to avoid lithium plating. Hence the 20→80% interval is what fast-charging "miles per minute" claims really measure.</>, sections: [],
      takeaways: ['CC (constant current) up to ~80%, then CV (constant voltage) — current ramps down.', 'C-rate: charge current relative to capacity. 3C means 20 minutes to full theoretically.', 'Temperature matters: cold pack charges slowly, hot pack derates.', 'Brand-claimed "10-80% in 15 minutes" is the realistic fast-charge experience.'] },
    { slug: 'range', number: '06', title: 'Range & Efficiency', blurb: 'Wh/km vs speed, temperature, payload, HVAC.', Widget: W(initRangeWidget),
      intro: <>Range is energy in the pack divided by energy per km. The denominator changes wildly with speed, temperature, terrain, and HVAC load.</>, sections: [],
      takeaways: ['Aerodynamic drag dominates above ~70 km/h. Doubles every 30 km/h roughly.', 'Cold weather: 30%+ range loss from heater + chemistry slowdown.', 'HVAC pulls 1–3 kW continuously. Real impact on highway.', 'EPA/WLTP ratings are unrealistic — real-world is 70–90% of label.'] },
    { slug: 'infrastructure', number: '07', title: 'Charging Infrastructure', blurb: 'AC vs DC, CCS vs NACS vs GB/T.', Widget: W(initInfraWidget),
      intro: <>Why every country picked a different plug. AC charging is slow but ubiquitous; DC fast charging requires standardized high-power connectors.</>, sections: [],
      takeaways: ['AC: 3–22 kW, via onboard charger. Home + workplace.', 'DC: 50–350 kW, bypasses onboard charger. Highway.', 'CCS dominant in EU/US. NACS (Tesla) becoming North American standard.', 'CHAdeMO is dying. GB/T is China only. Megawatt charging for trucks is coming.'] },
    { slug: 'autonomy', number: '08', title: 'Autonomy Stack', blurb: "Sensors, perception, planning, control. Tesla's vision-only vs Waymo's sensor fusion.", Widget: W(initAutonomyWidget),
      intro: <>Self-driving is sensors → perception → prediction → planning → control. Tesla bets on vision-only at scale; Waymo bets on lidar + HD maps in geofenced areas.</>, sections: [],
      takeaways: ['Perception: pixels → "there\'s a car at distance D moving at velocity V".', 'Prediction: where will it be in 5 seconds?', 'Planning: pick a safe trajectory.', 'Vision-only is cheaper but harder; sensor fusion is more robust but more expensive.'] },
  ],
};
