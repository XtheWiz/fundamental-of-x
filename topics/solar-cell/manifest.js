// Solar Cell topic manifest.

export const manifest = {
  slug: 'solar-cell',
  title: 'Solar Cell',
  tagline: 'How a photon becomes electricity — physics under every rooftop.',
  lessons: [
    {
      slug: 'bandgap',
      title: 'Bandgap',
      blurb: 'Why some materials conduct, some insulate, some are semiconductors — and why the bandgap decides what light a solar cell can use.',
    },
    {
      slug: 'photovoltaic',
      title: 'The Photovoltaic Effect',
      blurb: "A photon hits silicon. If it's energetic enough, it knocks an electron free. Multiply by trillions per second and you have current.",
    },
    {
      slug: 'pn-junction',
      title: 'The P-N Junction',
      blurb: "Two doped silicons joined at the hip. The built-in field is what actually pulls electrons through the external circuit.",
    },
    {
      slug: 'sq-limit',
      title: 'The Shockley-Queisser Limit',
      blurb: "Why a single-junction silicon cell can't exceed ~33% efficiency, no matter how good your engineering gets.",
    },
    {
      slug: 'materials',
      title: 'Materials',
      blurb: "Silicon vs perovskite vs thin-film vs III-V. The trade-offs between efficiency, cost, weight, and longevity.",
    },
    {
      slug: 'arrays',
      title: 'Series & Parallel',
      blurb: "One cell gives ~0.5V. Stack them in series for voltage, parallel for current. And watch what shading does to a bad design.",
    },
    {
      slug: 'mppt',
      title: 'MPPT',
      blurb: "A solar panel's IV curve has one sweet spot — the Maximum Power Point. Watch a tracker hunt for it as conditions change.",
    },
    {
      slug: 'real-world',
      title: 'Real-World Efficiency',
      blurb: "Lab cells hit 47%. Your rooftop array hits ~20%. Where do the other 27 points go? Temperature, angle, dust, aging.",
    },
  ],
};
