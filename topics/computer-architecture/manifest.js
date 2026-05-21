// Computer Architecture topic manifest.

export const manifest = {
  slug: 'computer-architecture',
  title: 'Computer Architecture',
  tagline: 'Why two programs doing the same thing can run 100× apart.',
  lessons: [
    {
      slug: 'pipeline',
      title: 'CPU Pipeline',
      blurb: 'Five stages, one instruction per cycle — when things go well. Watch a data hazard stall the train.',
    },
    {
      slug: 'cache',
      title: 'Cache Hierarchy',
      blurb: 'L1, L2, L3, RAM, SSD. If L1 takes a second, RAM takes 5 minutes and disk takes a week.',
    },
    {
      slug: 'branch-prediction',
      title: 'Branch Prediction',
      blurb: 'A loop body runs faster on the 1000th iteration than the first. Predictors are how.',
    },
    {
      slug: 'locality',
      title: 'Memory Locality',
      blurb: 'Same data, two layouts. Array-of-structs vs struct-of-arrays — watch cache hits diverge.',
    },
    {
      slug: 'virtual-memory',
      title: 'Virtual Memory',
      blurb: 'Every program thinks it owns all the RAM. Page tables and the MMU make that lie work.',
    },
    {
      slug: 'simd',
      title: 'SIMD & Vectorization',
      blurb: 'One instruction, eight numbers at once. The free speedup hiding in your CPU.',
    },
    {
      slug: 'false-sharing',
      title: 'Multi-core & False Sharing',
      blurb: 'Four threads, four counters, one cache line — and the cores spend their time talking to each other.',
    },
    {
      slug: 'perf-model',
      title: 'Performance Mental Model',
      blurb: 'A slow loop, profiled. Where the cycles actually go and how to find them.',
    },
  ],
};
