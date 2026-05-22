import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import { initUnitsWidget } from '../widgets/energy-systems/legacy/units.js';
import { initGenMixWidget } from '../widgets/energy-systems/legacy/generation-mix.js';
import { initDuckCurveWidget } from '../widgets/energy-systems/legacy/duck-curve.js';
import { initFrequencyWidget } from '../widgets/energy-systems/legacy/frequency.js';
import { initStorageWidget } from '../widgets/energy-systems/legacy/storage.js';
import { initLcoeWidget } from '../widgets/energy-systems/legacy/lcoe.js';
import { initDemandResponseWidget } from '../widgets/energy-systems/legacy/demand-response.js';
import { initCarbonWidget } from '../widgets/energy-systems/legacy/carbon.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'energy-systems',
  title: 'Energy Systems',
  intro: <>Eight lessons on how a power grid balances supply and demand in real time — units, generation mix, duck curves, frequency control, storage arbitrage, LCOE, demand response, and carbon accounting.</>,
  lessons: [
    { slug: 'units', number: '01', title: 'Units & Scales', blurb: 'Watts vs watt-hours, MWh vs TWh, capacity vs energy.', Widget: W(initUnitsWidget),
      intro: <>Half of every energy debate is unit confusion. Power is a rate (W), energy is an amount (Wh). Capacity is what a plant can produce; energy is what it actually does.</>, sections: [],
      takeaways: ['Watt = energy rate. Watt-hour = energy.', 'kW × hours = kWh. Easy.', 'Capacity factor: actual output / nameplate × time. Solar ~20%, nuclear ~90%.', 'Country scale: TWh/year. Household: kWh/month.'] },
    { slug: 'generation-mix', number: '02', title: 'Generation Mix', blurb: 'Each source plays a different role.', Widget: W(initGenMixWidget),
      intro: <>Baseload runs flat all day. Load-following ramps with demand. Peakers cover the spikes. Intermittents (wind, solar) cover whatever they can. The mix decides cost and carbon.</>, sections: [],
      takeaways: ['Coal/nuclear/large hydro: baseload — cheap to run, slow to change.', 'CCGT (gas): load-following. Mid-tier cost.', 'Open-cycle gas: peakers — expensive but fast.', 'Wind/solar: zero marginal cost, no control over output.'] },
    { slug: 'duck-curve', number: '03', title: 'The Duck Curve', blurb: "California's net-load shape after rooftop solar.", Widget: W(initDuckCurveWidget),
      intro: <>Subtract rooftop solar from demand and you get a duck-shaped curve. Midday sag, evening ramp — the evening ramp is what gas peakers have to chase and what batteries can replace.</>, sections: [],
      takeaways: ['Solar floods the grid mid-day. Net-load plummets.', 'Then everyone gets home; solar dies; net-load spikes.', 'The ramp rate (MW per minute) is harder to handle than the magnitude.', 'Storage that absorbs midday glut and releases at peak is the cleanest fix.'] },
    { slug: 'frequency', number: '04', title: 'Grid Frequency', blurb: '50 or 60 Hz, held to within a few millihertz.', Widget: W(initFrequencyWidget),
      intro: <>The grid is a single synchronous machine — every generator and motor rotates in lockstep. Frequency drifts when supply doesn\'t match demand. Inertia, governor response, and AGC keep it locked.</>, sections: [],
      takeaways: ['Frequency drops when load exceeds generation. Watch it after a plant trips.', 'Inertia (spinning mass) buys seconds. Renewables provide none — synthetic inertia from batteries is needed.', 'Governor response (5 sec) and AGC (minutes) restore the balance.', 'Under-frequency load shedding is the last line before blackouts.'] },
    { slug: 'storage', number: '05', title: 'Storage Arbitrage', blurb: 'Buy cheap at midnight, sell expensive at 7 pm.', Widget: W(initStorageWidget),
      intro: <>Grid-scale batteries make money on the price spread between cheap and expensive hours. Round-trip efficiency and cycle count decide whether the math works.</>, sections: [],
      takeaways: ['Round-trip efficiency: 85–90% for lithium-ion, lower for pumped hydro.', 'Cycle cost: battery degrades per full charge-discharge.', 'Daily price spread × cycles × efficiency must beat capital + degradation.', 'Frequency response and capacity payments often pay better than arbitrage.'] },
    { slug: 'lcoe', number: '06', title: 'LCOE & Merit Order', blurb: 'Levelized cost of energy decides who runs first.', Widget: W(initLcoeWidget),
      intro: <>LCOE rolls capital, fuel, and O&M into a single $/MWh number. The grid operator dispatches plants in cost order — cheapest first — until demand is met. Solar\'s near-zero marginal cost crushes midday prices.</>, sections: [],
      takeaways: ['LCOE = (total lifecycle cost) / (total energy produced).', 'Merit order: dispatch cheapest first.', 'Solar marginal cost ≈ 0 once installed. Always dispatched when available.', "LCOE undervalues firm power — it doesn't capture when energy is delivered."] },
    { slug: 'demand-response', number: '07', title: 'Demand Response', blurb: 'Pay big consumers to drop demand for an hour.', Widget: W(initDemandResponseWidget),
      intro: <>Instead of adding peaker plants, pay aluminum smelters, data centers, and EV fleets to back off for an hour. Often cheaper than the alternative.</>, sections: [],
      takeaways: ['DR is cheaper than peaker plants per MW of peak shaved.', 'Industrial DR: known and reliable. Has been done for decades.', 'Residential DR: smart thermostats, smart EV charging. Growing fast.', 'Virtual power plants aggregate small DR resources into grid-visible blocks.'] },
    { slug: 'carbon', number: '08', title: 'Carbon Accounting', blurb: 'gCO2/kWh by source and country.', Widget: W(initCarbonWidget),
      intro: <>Different sources emit very different amounts of CO2 per kWh — coal ~1000 g, gas ~400 g, solar/wind ~20 g (lifecycle). Marginal vs average emissions decides whether your EV is actually clean today.</>, sections: [],
      takeaways: ['Coal: ~1000 g CO2/kWh. Gas: ~400. Nuclear/wind/solar: <50 (lifecycle).', 'Average grid emissions: weighted by what\'s currently on. France ~50, Poland ~700.', 'Marginal emissions: what gets dispatched when you add load. Often higher.', 'Charging your EV at night might be dirtier than at noon — depends on the grid mix that hour.'] },
  ],
};
