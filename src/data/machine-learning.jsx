import WhatIsLearningWidget from '../widgets/ml/WhatIsLearningWidget.jsx';
import LinearRegressionWidget from '../widgets/ml/LinearRegressionWidget.jsx';
import GradientDescentWidget from '../widgets/ml/GradientDescentWidget.jsx';
import ClassificationWidget from '../widgets/ml/ClassificationWidget.jsx';
import NeuralNetworkWidget from '../widgets/ml/NeuralNetworkWidget.jsx';
import BackpropWidget from '../widgets/ml/BackpropWidget.jsx';
import KmeansWidget from '../widgets/ml/KmeansWidget.jsx';
import OverfittingWidget from '../widgets/ml/OverfittingWidget.jsx';

export const manifest = {
  slug: 'machine-learning',
  title: 'Machine Learning',
  tagline: 'Functions you fit instead of write. The math, visualized.',
  intro: (
    <>
      Eight lessons walking from "what does it even mean for a machine to
      learn?" up to a tiny neural network solving XOR. Every concept comes
      with a widget — drag the data, push the learning rate, watch the
      loss curve climb down.
    </>
  ),
  lessons: [
    {
      slug: 'what-is-learning', number: '01', title: 'What is Learning?',
      blurb: 'Fitting a function to data instead of writing it. Supervised, unsupervised, and the role of the loss function.',
      Widget: WhatIsLearningWidget,
      intro: <>Programs you <em>write</em> spell out every rule. A learning system <em>fits</em> a function to data instead. Given (input, output) pairs, it adjusts internal parameters until its predictions get close enough.</>,
      sections: [{
        heading: 'Three flavours',
        body: (
          <>
            <ul>
              <li><strong>Supervised</strong> — labelled examples. Most of what people mean by "ML" today.</li>
              <li><strong>Unsupervised</strong> — no labels; the model finds structure (clusters, latent dimensions).</li>
              <li><strong>Reinforcement</strong> — agent acts, gets reward signals, learns a policy.</li>
            </ul>
            <p>Whichever flavour: there's always a <em>loss function</em> measuring how wrong the model is. Training = make the loss small.</p>
          </>
        ),
      }],
      takeaways: [
        'A learning system has parameters that get adjusted, not rules that get written.',
        'The loss function turns "is this prediction good?" into a number you can minimise.',
        'Drag points and the optimal line follows — that\'s exactly what training does at scale.',
        'Linear regression is the simplest case; everything else (neural nets, transformers) generalises this idea.',
      ],
    },
    {
      slug: 'linear-regression', number: '02', title: 'Linear Regression',
      blurb: 'The simplest ML model. Fit a line by adjusting two numbers. Watch the loss shrink in real time.',
      Widget: LinearRegressionWidget,
      intro: <>The line <code>y = w·x + b</code> has just two parameters. Pick the (w, b) that minimise the mean squared error and you've trained a model. Everything else in ML is a fancier version of this.</>,
      sections: [{
        heading: 'Mean squared error',
        body: (
          <>
            <p>The model's prediction for point <code>x</code> is <code>ŷ = w·x + b</code>. The error on that point is <code>(ŷ − y)</code>. Square it (so positive and negative errors don't cancel), average over the dataset, and you've got MSE.</p>
            <p>For linear regression we can solve <code>(w, b)</code> in closed form. For more complex models we use gradient descent — next lesson.</p>
          </>
        ),
      }],
      takeaways: [
        'Two parameters, one line, one loss. Slide the sliders to feel the loss landscape.',
        'The optimal line is the one that minimises the sum of squared residuals.',
        'Linear regression has a closed-form solution; almost nothing else in ML does.',
        'Even on this 8-point dataset the optimum is unique — there\'s only one best line.',
      ],
    },
    {
      slug: 'gradient-descent', number: '03', title: 'Gradient Descent',
      blurb: 'The loss landscape and the ball rolling down it. Tune the step size — too small, too slow; too big, you overshoot.',
      Widget: GradientDescentWidget,
      intro: <>The gradient is the direction of steepest <em>ascent</em>. Walk in the opposite direction, take a step, repeat. That's the algorithm that trains everything from logistic regression to GPT.</>,
      sections: [{
        heading: 'The update rule',
        body: (
          <>
            <p>At each step: <code>w ← w − η · ∂L/∂w</code>. The learning rate <code>η</code> controls how big each step is.</p>
            <ul>
              <li>Too small: slow convergence (but stable).</li>
              <li>Too large: overshoot the minimum, oscillate, sometimes diverge.</li>
              <li>"Just right": fast descent with no oscillation.</li>
            </ul>
            <p>Real systems use adaptive learning rates (Adam, RMSprop) so you don't have to tune η by hand.</p>
          </>
        ),
      }],
      takeaways: [
        'Gradient descent only needs the local slope — no global view of the loss surface.',
        'Learning rate is the single most important hyperparameter. Get it wrong and nothing else matters.',
        'Real ML losses live in millions of dimensions, but the picture is the same: roll downhill.',
        'When this widget diverges with lr > 1, you\'re seeing what makes deep learning hard at scale.',
      ],
    },
    {
      slug: 'classification', number: '04', title: 'Classification',
      blurb: 'Drawing a decision boundary between two classes. Click points to add examples, watch the boundary move.',
      Widget: ClassificationWidget,
      intro: <>Instead of predicting a number, predict a class. <em>Logistic regression</em> squashes a linear score through a sigmoid to get a probability between 0 and 1, then trains via gradient descent on cross-entropy loss.</>,
      sections: [{
        heading: 'Linear decision boundary',
        body: (
          <>
            <p>The model is <code>P(class B) = σ(w₁·x + w₂·y + b)</code>. The boundary is where probability = 0.5, which is the straight line <code>w₁·x + w₂·y + b = 0</code>.</p>
            <p>It can only draw straight boundaries — that's why XOR (next lesson) needs a neural network. For linearly separable data, though, it's hard to beat.</p>
          </>
        ),
      }],
      takeaways: [
        'Classification = regression on a probability, squashed through a sigmoid.',
        'The decision boundary is wherever the model is equally uncertain — straight for logistic regression.',
        'Shaded regions show confidence: deeper colour = more sure.',
        'Non-linearly separable data needs a non-linear model — that\'s next.',
      ],
    },
    {
      slug: 'neural-network', number: '05', title: 'Neural Networks',
      blurb: 'Neurons, layers, activations. A network that learns XOR — which a line cannot.',
      Widget: NeuralNetworkWidget,
      intro: <>Stack linear units, separated by non-linear activations, and you get a function that can approximate basically anything. The widget trains a 2→4→1 network to solve XOR — the canonical example of a problem no line can handle.</>,
      sections: [{
        heading: 'Why "deep"?',
        body: (
          <>
            <p>One hidden layer is enough to approximate any continuous function (the universal approximation theorem). But "enough" can mean exponentially many neurons. Depth lets each layer build on the previous one, often expressing the same function with far fewer parameters.</p>
            <p>Modern networks are millions to trillions of these units arranged in clever architectures. The principle is the same as our 4-neuron toy.</p>
          </>
        ),
      }],
      takeaways: [
        'A neural network is layers of linear-then-non-linear transformations stacked together.',
        'The non-linearity (sigmoid, ReLU, GELU) is what lets the network bend the decision boundary.',
        'XOR is the smallest classic example of a non-linearly separable problem.',
        'Watch the loss curve: stuck plateaus, then sudden drops. That\'s how training feels at scale.',
      ],
    },
    {
      slug: 'backprop', number: '06', title: 'Backpropagation',
      blurb: 'Gradients flowing backward through the network. The chain rule, animated.',
      Widget: BackpropWidget,
      intro: <>To run gradient descent you need <code>∂L/∂(each parameter)</code>. Computing it directly would be O(parameters × parameters). Backprop computes it in one backward pass — the chain rule, applied systematically.</>,
      sections: [{
        heading: 'Forward, then backward',
        body: (
          <>
            <ul>
              <li><strong>Forward pass:</strong> compute every intermediate value, store it.</li>
              <li><strong>Backward pass:</strong> start from the loss, propagate gradients back to each input by multiplying by local derivatives.</li>
            </ul>
            <p>The cost is roughly 2× the forward pass — a huge win. This is the algorithm that makes deep learning practical.</p>
          </>
        ),
      }],
      takeaways: [
        'Backprop = chain rule, applied node-by-node, from loss back to inputs.',
        'Every value computed in the forward pass becomes a multiplier in the backward pass.',
        'The same algorithm works for any computation graph — convolutions, attention, you name it.',
        'PyTorch / TensorFlow / JAX are all autodiff frameworks that automate this.',
      ],
    },
    {
      slug: 'kmeans', number: '07', title: 'K-means Clustering',
      blurb: 'No labels, just data. Watch points self-organize into K clusters as centroids drift toward them.',
      Widget: KmeansWidget,
      intro: <>Unsupervised learning's poster child. You pick K (the number of clusters), the algorithm finds where they are. Two alternating phases — assign each point to its nearest centroid, then move each centroid to the mean of its points — repeated until nothing moves.</>,
      sections: [{
        heading: "Lloyd's algorithm",
        body: (
          <>
            <ol>
              <li>Randomly place K centroids.</li>
              <li><strong>Assign:</strong> every point joins its nearest centroid.</li>
              <li><strong>Update:</strong> each centroid moves to the centre of mass of its points.</li>
              <li>Repeat 2–3 until convergence.</li>
            </ol>
            <p>It always converges, but to a local minimum. Initialisation matters — try K-means++ for better starting points.</p>
          </>
        ),
      }],
      takeaways: [
        'K-means is the simplest unsupervised algorithm — alternating optimisation in two steps.',
        'It minimises within-cluster sum-of-squares, but only locally.',
        "You have to pick K up front. The elbow method or silhouette scores help.",
        'Doesn\'t handle non-spherical clusters well — DBSCAN, GMMs, or HDBSCAN do better there.',
      ],
    },
    {
      slug: 'overfitting', number: '08', title: 'Overfitting & Regularization',
      blurb: 'The sweet spot between under- and over-fitting. Train vs validation loss, the bias-variance tradeoff in one plot.',
      Widget: OverfittingWidget,
      intro: <>Train a polynomial of degree D against a true sine-ish function. Watch what happens to the validation loss as D grows: it falls, hits a sweet spot, then rises again. That U-shape is the bias-variance tradeoff.</>,
      sections: [{
        heading: 'Bias vs variance',
        body: (
          <>
            <ul>
              <li><strong>High bias (low D):</strong> model can't capture the signal. Train and validation losses both high.</li>
              <li><strong>High variance (high D):</strong> model memorises the noise. Train loss tiny, validation loss huge.</li>
              <li><strong>Sweet spot:</strong> capacity matches the underlying complexity.</li>
            </ul>
            <p>Regularisation (L1/L2 penalties, dropout, early stopping) discourages high-capacity models from over-fitting. Big modern networks rely on it heavily.</p>
          </>
        ),
      }],
      takeaways: [
        'Train loss always decreases with capacity. Validation loss tells the real story.',
        'The sweet spot is where validation loss bottoms out.',
        'More data shifts the sweet spot rightward — bigger models can be trained without over-fitting given enough data.',
        'Modern deep learning frequently breaks the classical U-shape (double descent) — but the intuition still helps.',
      ],
    },
  ],
};
