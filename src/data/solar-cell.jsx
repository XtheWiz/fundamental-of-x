import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import { initBandgapWidget } from '../widgets/solar-cell/legacy/bandgap.js';
import { initPhotovoltaicWidget } from '../widgets/solar-cell/legacy/photovoltaic.js';
import { initPNJunctionWidget } from '../widgets/solar-cell/legacy/pn-junction.js';
import { initSQLimitWidget } from '../widgets/solar-cell/legacy/sq-limit.js';
import { initMaterialsWidget } from '../widgets/solar-cell/legacy/materials.js';
import { initArraysWidget } from '../widgets/solar-cell/legacy/arrays.js';
import { initMpptWidget } from '../widgets/solar-cell/legacy/mppt.js';
import { initRealWorldWidget } from '../widgets/solar-cell/legacy/real-world.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'solar-cell',
  title: 'Solar Cell',
  intro: <>Eight lessons on how a photon becomes electricity — bandgaps, P-N junctions, the Shockley-Queisser limit, materials, series/parallel arrays, MPPT, and real-world efficiency losses.</>,
  lessons: [
    { slug: 'bandgap', number: '01', title: 'Bandgap', blurb: 'Why some materials conduct, some insulate, some are semiconductors.', Widget: W(initBandgapWidget),
      intro: <>Electrons can only sit in certain energy bands. The gap between the highest filled band (valence) and the lowest empty one (conduction) decides how a material behaves.</>, sections: [],
      takeaways: ['Metals: bands overlap. Always conduct.', 'Insulators: gap ≫ thermal energy. Never conduct (under normal conditions).', 'Semiconductors: small gap. Conduct when given a kick (thermal, optical, electrical).', 'Solar cell needs a gap that matches the solar spectrum — ~1.1 eV for silicon.'] },
    { slug: 'photovoltaic', number: '02', title: 'The Photovoltaic Effect', blurb: 'A photon hits silicon. If energetic enough, it knocks an electron free.', Widget: W(initPhotovoltaicWidget),
      intro: <>Photons with energy above the bandgap promote electrons from valence to conduction band, leaving a hole. Now you have a mobile charge pair — current waiting to flow.</>, sections: [],
      takeaways: ['Photon energy must exceed the bandgap to free an electron.', 'Extra energy beyond the gap becomes heat — wasted.', 'Photons below the gap pass through unabsorbed — also wasted.', 'These two losses set the upper bound on single-junction efficiency.'] },
    { slug: 'pn-junction', number: '03', title: 'The P-N Junction', blurb: 'Two doped silicons joined at the hip. The built-in field pulls electrons through the external circuit.', Widget: W(initPNJunctionWidget),
      intro: <>P-type (excess holes) and N-type (excess electrons) silicon, joined at a boundary. Diffusion creates a permanent electric field that separates photogenerated electron-hole pairs.</>, sections: [],
      takeaways: ['Built-in field is established once and forever.', 'Photons create electron-hole pairs; the field sweeps them apart.', 'Electrons exit through the N contact, do useful work, return through the P contact.', 'Without the junction, electrons and holes would just recombine.'] },
    { slug: 'sq-limit', number: '04', title: 'The Shockley-Queisser Limit', blurb: 'Why a single-junction silicon cell can\'t exceed ~33% efficiency.', Widget: W(initSQLimitWidget),
      intro: <>Two unavoidable losses (sub-gap photons + above-gap excess) plus radiative recombination give a hard ceiling. Shockley and Queisser computed it in 1961: ~33% for ideal silicon.</>, sections: [],
      takeaways: ['Ideal single-junction limit: ~33% at the optimal 1.34 eV bandgap.', 'Real silicon cells reach ~22–26% — close enough.', 'Multi-junction (tandem) cells stack different bandgaps and beat the SQ limit. Lab record ~47%.', 'Concentrator + tandem + tracking pushes still further — at huge cost.'] },
    { slug: 'materials', number: '05', title: 'Materials', blurb: 'Silicon vs perovskite vs thin-film vs III-V.', Widget: W(initMaterialsWidget),
      intro: <>Crystalline silicon dominates because it\'s abundant and decades-engineered. Newer materials trade efficiency for cost, weight, or flexibility.</>, sections: [],
      takeaways: ['Mono-Si: 22% efficient, durable, cheap at scale. The default.', 'Perovskite: rapidly improving; degradation still an issue.', 'CdTe / CIGS: thin film, less efficient, cheaper per W in some markets.', 'III-V: 30%+ efficient but expensive — spacecraft and concentrators.'] },
    { slug: 'arrays', number: '06', title: 'Series & Parallel', blurb: 'Stack cells in series for voltage, parallel for current.', Widget: W(initArraysWidget),
      intro: <>One cell gives ~0.5 V. Real arrays stack them — series for voltage, parallel for current. Bypass diodes prevent one shaded cell from dragging down the whole string.</>, sections: [],
      takeaways: ['Series: voltages add, current = weakest cell. Bad cell hurts string.', 'Parallel: currents add, voltage = average.', 'Bypass diodes route current around shaded cells.', 'Microinverters and DC optimizers handle per-panel MPPT — fix the partial-shading problem.'] },
    { slug: 'mppt', number: '07', title: 'MPPT', blurb: "A solar panel's IV curve has one sweet spot.", Widget: W(initMpptWidget),
      intro: <>The panel\'s current-voltage curve has a knee — the Maximum Power Point. An MPPT controller continuously hunts for it as sun and temperature change.</>, sections: [],
      takeaways: ['Power = V × I; the IV curve has one peak.', 'MPP shifts with irradiance, temperature, shading.', 'Perturb-and-observe is the dominant algorithm. Simple and good enough.', 'Without MPPT, you\'d lose ~30% of available power on a typical day.'] },
    { slug: 'real-world', number: '08', title: 'Real-World Efficiency', blurb: 'Lab cells hit 47%. Your rooftop hits ~20%.', Widget: W(initRealWorldWidget),
      intro: <>Lab cells are tiny and tested under ideal conditions. Real panels lose efficiency to temperature, angle, soiling, and aging. Knowing where the losses go is half of system design.</>, sections: [],
      takeaways: ['Lab → module loss: ~5%. Cells perform better in isolation than tiled together.', 'Temperature loss: ~0.4% per °C above 25°C. Hot panels are bad panels.', 'Soiling, shading, mismatch: another 5–10%.', 'Aging: ~0.5% per year over 25 years. Warranties typically guarantee 80% at year 25.'] },
  ],
};
