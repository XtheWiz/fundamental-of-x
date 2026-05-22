// Electric Vehicles topic manifest.

export const manifest = {
  slug: 'electric-vehicles',
  title: 'Electric Vehicles',
  tagline: 'How a Tesla or BYD turns electrons into motion.',
  lessons: [
    { slug: 'cells',         title: 'Battery Cells', blurb: 'Lithium-ion vs LFP vs solid-state. Energy density, cost, safety — pick two-and-a-half.' },
    { slug: 'pack-bms',      title: 'Battery Pack & BMS', blurb: 'Thousands of cells in series and parallel. The BMS balances them and keeps them alive.' },
    { slug: 'motor',         title: 'Electric Motors', blurb: 'PMSM vs induction vs reluctance. Torque/RPM curves, why EVs are quick off the line.' },
    { slug: 'regen',         title: 'Regenerative Braking', blurb: 'Stop the car by running the motor backwards as a generator. Energy goes back to the pack.' },
    { slug: 'charging',      title: 'Charging Curves', blurb: 'Why fast charging slows past 80%. The CC-CV profile, C-rate, thermal throttling.' },
    { slug: 'range',         title: 'Range & Efficiency', blurb: 'Wh/km vs speed, temperature, payload, HVAC. The drag curve that decides how far you go.' },
    { slug: 'infrastructure',title: 'Charging Infrastructure', blurb: 'AC vs DC, CCS vs NACS vs GB/T, megawatt charging. Why every country picked a different plug.' },
    { slug: 'autonomy',      title: 'Autonomy Stack', blurb: "Sensors, perception, planning, control. Tesla's vision-only vs Waymo's sensor fusion." },
  ],
};
