// Machine Learning topic manifest.

export const manifest = {
  slug: 'machine-learning',
  title: 'Machine Learning',
  tagline: 'Functions you fit instead of write. The math, visualized.',
  lessons: [
    {
      slug: 'what-is-learning',
      title: 'What is Learning?',
      blurb: 'Fitting a function to data instead of writing it. Supervised, unsupervised, and the role of the loss function.',
    },
    {
      slug: 'linear-regression',
      title: 'Linear Regression',
      blurb: 'The simplest ML model. Fit a line by adjusting two numbers. Watch the loss shrink in real time.',
    },
    {
      slug: 'gradient-descent',
      title: 'Gradient Descent',
      blurb: 'The loss landscape and the ball rolling down it. Tune the step size — too small, too slow; too big, you overshoot.',
    },
    {
      slug: 'classification',
      title: 'Classification',
      blurb: 'Drawing a decision boundary between two classes. Click points to add examples, watch the boundary move.',
    },
    {
      slug: 'neural-network',
      title: 'Neural Networks',
      blurb: 'Neurons, layers, activations. A network that learns XOR — which a line cannot.',
    },
    {
      slug: 'backprop',
      title: 'Backpropagation',
      blurb: 'Gradients flowing backward through the network. The chain rule, animated.',
    },
    {
      slug: 'kmeans',
      title: 'K-means Clustering',
      blurb: 'No labels, just data. Watch points self-organize into K clusters as centroids drift toward them.',
    },
    {
      slug: 'overfitting',
      title: 'Overfitting & Regularization',
      blurb: 'The sweet spot between under- and over-fitting. Train vs validation loss, the bias-variance tradeoff in one plot.',
    },
  ],
};
