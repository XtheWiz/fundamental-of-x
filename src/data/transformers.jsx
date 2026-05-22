import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import { initTokensWidget } from '../widgets/transformers/legacy/tokens.js';
import { initAttentionWidget } from '../widgets/transformers/legacy/attention.js';
import { initMultiHeadWidget } from '../widgets/transformers/legacy/multi-head.js';
import { initBlockWidget } from '../widgets/transformers/legacy/transformer-block.js';
import { initPositionalWidget } from '../widgets/transformers/legacy/positional.js';
import { initTrainingWidget } from '../widgets/transformers/legacy/training.js';
import { initSamplingWidget } from '../widgets/transformers/legacy/sampling.js';
import { initScalingWidget } from '../widgets/transformers/legacy/scaling.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'transformers',
  title: 'Transformers & LLMs',
  intro: <>Eight lessons unpacking what a transformer does to your prompt, one matmul at a time — tokens, embeddings, attention, multi-head, the transformer block, positional encoding, training, sampling, and scaling laws.</>,
  lessons: [
    { slug: 'tokens', number: '01', title: 'Tokens & Embeddings', blurb: "Text doesn't enter a model — numbers do.", Widget: W(initTokensWidget),
      intro: <>The tokenizer splits text into sub-word units; each token maps to a learned vector. The model only ever sees vectors.</>, sections: [],
      takeaways: ['Tokenization is sub-word — common words = 1 token, rare ones split.', 'Embeddings are learned during training; similar words end up nearby.', 'Vocabulary size affects model size: GPT-2 had 50k tokens, modern LLMs ~100–200k.', 'Same model, different tokenizer = different costs per character.'] },
    { slug: 'attention', number: '02', title: 'Attention', blurb: 'Query, key, value. Each token looks at every other and decides what matters.', Widget: W(initAttentionWidget),
      intro: <>For each token, compute a score against every other token; use those scores to mix their values. That\'s attention.</>, sections: [],
      takeaways: ['Q, K, V are linear projections of each token.', 'Attention weights = softmax(Q·Kᵀ / √d). Always sum to 1.', 'Cost: O(n²) in sequence length. The thing that limits context window size.', 'Causal mask hides future tokens during training.'] },
    { slug: 'multi-head', number: '03', title: 'Multi-Head Attention', blurb: 'Several attention heads in parallel, each specializing.', Widget: W(initMultiHeadWidget),
      intro: <>Run attention several times in parallel with different learned projections, concatenate the outputs. Each head ends up specializing.</>, sections: [],
      takeaways: ['Heads learn different relationships — syntax, coreference, position.', 'Typical: 8–96 heads. Each smaller than a single full-attention block would be.', 'Sum of head dims = model dim.', 'Some heads are interpretable; many are mush.'] },
    { slug: 'transformer-block', number: '04', title: 'The Transformer Block', blurb: 'Attention + feed-forward + residuals + layer norm.', Widget: W(initBlockWidget),
      intro: <>One transformer block: layer-norm, multi-head attention, residual, layer-norm, feed-forward, residual. Stack 96 of these and you have GPT-3.</>, sections: [],
      takeaways: ['Residual connections let gradients flow through deep stacks.', 'LayerNorm stabilizes activations between layers.', 'The feed-forward (MLP) processes each token independently — where most parameters live.', 'Depth × width is the parameter knob — both buy capacity differently.'] },
    { slug: 'positional', number: '05', title: 'Positional Encoding', blurb: "Attention is permutation-invariant — it can't see word order.", Widget: W(initPositionalWidget),
      intro: <>Plain attention has no idea which token came first. We add a position-dependent signal to each embedding so order survives.</>, sections: [],
      takeaways: ['Sinusoidal: classic, no learned parameters, extrapolates beyond training length.', 'Learned: simpler, doesn\'t extrapolate.', 'RoPE (rotary): rotates Q and K by position. Used by Llama, GPT-NeoX.', 'ALiBi: penalty added to attention scores by distance.'] },
    { slug: 'training', number: '06', title: 'Next-Token Training', blurb: 'One simple objective: predict the next token. Trillions of times.', Widget: W(initTrainingWidget),
      intro: <>Slide the model over text. At each position, predict the next token. Cross-entropy loss against the true next token. That single objective gets you GPT.</>, sections: [],
      takeaways: ['Objective: cross-entropy between predicted and actual next token.', 'Training data: most of the internet, scrubbed and deduplicated.', 'Loss falls log-linearly with compute. Scaling laws.', 'Fine-tuning + RLHF turns a base model into an assistant.'] },
    { slug: 'sampling', number: '07', title: 'Sampling', blurb: 'Temperature, top-k, top-p.', Widget: W(initSamplingWidget),
      intro: <>The model outputs a probability over the whole vocabulary. How you sample from it determines whether the output is creative, repetitive, or boring.</>, sections: [],
      takeaways: ['Greedy / temperature 0: always pick the most likely. Repetitive but deterministic.', 'Temperature > 1: flattens the distribution. More creative, less coherent.', 'Top-k: only consider the k most likely tokens.', 'Top-p (nucleus): only consider tokens summing to p of the probability mass.'] },
    { slug: 'scaling', number: '08', title: 'Scaling & Emergence', blurb: 'Loss vs parameters: a straight log-log line.', Widget: W(initScalingWidget),
      intro: <>More parameters + more data + more compute → smoothly lower loss. But the capabilities those parameters enable show up in jumps.</>, sections: [],
      takeaways: ['Loss decreases predictably with scale; capabilities do not.', 'Chinchilla-optimal: 20 tokens per parameter. Most models were under-trained.', 'Mixture-of-experts gets more parameters without more flops per token.', 'Scaling is the boring secret of modern AI. Most progress is more, not new.'] },
  ],
};
