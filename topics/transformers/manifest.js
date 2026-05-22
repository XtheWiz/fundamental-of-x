// Transformers & LLMs topic manifest.

export const manifest = {
  slug: 'transformers',
  title: 'Transformers & LLMs',
  tagline: 'The architecture behind GPT, Claude, Gemini — pulled apart, layer by layer.',
  lessons: [
    {
      slug: 'tokens',
      title: 'Tokens & Embeddings',
      blurb: "Text doesn't enter a model — numbers do. Watch a sentence become tokens, then vectors that capture meaning.",
    },
    {
      slug: 'attention',
      title: 'Attention',
      blurb: 'Query, key, value. The mechanism that lets each word look at every other word and decide what matters.',
    },
    {
      slug: 'multi-head',
      title: 'Multi-Head Attention',
      blurb: 'Several attention heads in parallel, each specializing in a different relationship — syntax, coreference, distance.',
    },
    {
      slug: 'transformer-block',
      title: 'The Transformer Block',
      blurb: 'Attention + feed-forward + residuals + layer norm. Stack 96 of these and you have GPT-3.',
    },
    {
      slug: 'positional',
      title: 'Positional Encoding',
      blurb: "Attention is permutation-invariant — it can't see word order. So we add positional information into the embeddings.",
    },
    {
      slug: 'training',
      title: 'Next-Token Training',
      blurb: 'One simple objective: predict the next token. Trillions of times. Watch the loss flatten.',
    },
    {
      slug: 'sampling',
      title: 'Sampling',
      blurb: 'Temperature, top-k, top-p. How "creative" vs "deterministic" output is just a tweak of the same softmax.',
    },
    {
      slug: 'scaling',
      title: 'Scaling & Emergence',
      blurb: "Loss vs parameters: a straight log-log line. The capabilities aren't linear though — they emerge in jumps.",
    },
  ],
};
