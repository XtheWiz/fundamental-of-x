// Energy Systems topic manifest.

export const manifest = {
  slug: 'energy-systems',
  title: 'Energy Systems',
  tagline: 'How supply and demand stay balanced on a power grid in real time.',
  lessons: [
    {
      slug: 'units',
      title: 'Units & Scales',
      blurb: "Watts vs watt-hours, MWh vs TWh, capacity vs energy. The unit confusions that hide the actual size of every energy debate.",
    },
    {
      slug: 'generation-mix',
      title: 'Generation Mix',
      blurb: "Coal, gas, nuclear, hydro, wind, solar. Each plays a different role: baseload, load-following, peakers, intermittent. Mix decides cost and carbon.",
    },
    {
      slug: 'duck-curve',
      title: 'The Duck Curve',
      blurb: "California's net-load shape after rooftop solar took over the day. The evening ramp that gas peakers have to chase — and why batteries are the answer.",
    },
    {
      slug: 'frequency',
      title: 'Grid Frequency',
      blurb: "50 or 60 Hz, held to within a few millihertz. Watch what happens when a big generator trips. Inertia, governor response, AGC, and why renewables need batteries to help.",
    },
    {
      slug: 'storage',
      title: 'Storage Arbitrage',
      blurb: "Buy electricity cheap at midnight, sell it expensive at 7pm. Round-trip efficiency, cycle cost, and why grid-scale batteries pay back in years not decades.",
    },
    {
      slug: 'lcoe',
      title: 'LCOE & Merit Order',
      blurb: "Levelized cost of energy decides who runs first. Watch the merit-order stack and see why solar zero marginal cost crushed midday prices.",
    },
    {
      slug: 'demand-response',
      title: 'Demand Response',
      blurb: "Instead of adding supply, pay big consumers to drop demand for an hour. Aluminum smelters, data centers, EV fleets — flexible load is cheap capacity.",
    },
    {
      slug: 'carbon',
      title: 'Carbon Accounting',
      blurb: "gCO2/kWh by source and country. The marginal vs average emissions distinction that determines whether your EV is actually clean today.",
    },
  ],
};
