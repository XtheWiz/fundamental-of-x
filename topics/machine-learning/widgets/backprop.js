// Backprop widget: step through a tiny computation graph
// L = (y - target)^2 where y = sigmoid(w*x + b). Walk forward, then
// backward, showing values and gradients at each node.

const STAGES = [
  { phase: 'init',   label: 'Initial state — input x=2, target=1, parameters w=0.5, b=0.1', nodes: [] },
  { phase: 'fwd-1',  label: 'Forward 1: z = w·x + b = 0.5·2 + 0.1 = 1.10', nodes: ['z'] },
  { phase: 'fwd-2',  label: 'Forward 2: y = σ(z) = 1/(1+e^−1.1) ≈ 0.7503', nodes: ['z', 'y'] },
  { phase: 'fwd-3',  label: 'Forward 3: L = (y − target)² = (0.7503 − 1)² ≈ 0.0624', nodes: ['z', 'y', 'L'] },
  { phase: 'bwd-1',  label: 'Backward 1: ∂L/∂y = 2(y − target) ≈ −0.4994', nodes: ['L'] },
  { phase: 'bwd-2',  label: 'Backward 2: ∂L/∂z = ∂L/∂y · σ′(z) = ∂L/∂y · y(1−y) ≈ −0.0936', nodes: ['L', 'y'] },
  { phase: 'bwd-3',  label: 'Backward 3: ∂L/∂w = ∂L/∂z · x ≈ −0.1872 ; ∂L/∂b = ∂L/∂z ≈ −0.0936', nodes: ['L', 'y', 'z'] },
];

const x = 2, target = 1;
let w = 0.5, b = 0.1;
const z = w * x + b;
const y = 1 / (1 + Math.exp(-z));
const L = (y - target) ** 2;
const dL_dy = 2 * (y - target);
const dL_dz = dL_dy * y * (1 - y);
const dL_dw = dL_dz * x;
const dL_db = dL_dz;

export function initBackpropWidget(root) {
  let step = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">A tiny graph: L = (σ(w·x + b) − target)²</div>

      <div class="controls">
        <button class="btn" id="bp-prev">← Back</button>
        <button class="btn btn-accent" id="bp-next">Next step →</button>
        <button class="btn btn-ghost" id="bp-reset">Reset</button>
        <span style="margin-left: auto; font-family: var(--font-mono); color: var(--ink-soft);" id="bp-counter">0 / ${STAGES.length - 1}</span>
      </div>

      <div class="widget-stage" id="bp-stage" style="min-height: 280px;"></div>

      <div class="callout" id="bp-explain"></div>
    </div>
  `;

  root.querySelector('#bp-prev').addEventListener('click', () => { if (step > 0) step--; render(); });
  root.querySelector('#bp-next').addEventListener('click', () => { if (step < STAGES.length - 1) step++; render(); });
  root.querySelector('#bp-reset').addEventListener('click', () => { step = 0; render(); });

  function render() {
    const s = STAGES[step];
    const phase = s.phase;
    const isFwd = phase.startsWith('fwd') || phase === 'init';
    const W = 600, H = 250;

    const nodePositions = {
      x: { x: 60, y: 80, label: 'x', val: '2.00' },
      w: { x: 60, y: 150, label: 'w', val: '0.500', grad: phase.includes('bwd-3') ? `∂L/∂w = ${dL_dw.toFixed(4)}` : '' },
      b: { x: 60, y: 220, label: 'b', val: '0.100', grad: phase.includes('bwd-3') ? `∂L/∂b = ${dL_db.toFixed(4)}` : '' },
      z: { x: 240, y: 120, label: 'z = w·x + b', val: z.toFixed(3), grad: (phase === 'bwd-2' || phase === 'bwd-3') ? `∂L/∂z = ${dL_dz.toFixed(4)}` : '' },
      y: { x: 400, y: 120, label: 'y = σ(z)', val: y.toFixed(4), grad: (phase === 'bwd-1' || phase === 'bwd-2' || phase === 'bwd-3') ? '' : '', grad2: (phase === 'bwd-2' || phase === 'bwd-3') ? `via y(1−y)` : '' },
      yL: { x: 400, y: 120 },   // alias
      L: { x: 540, y: 120, label: 'L = (y − t)²', val: L.toFixed(4), grad: (phase === 'bwd-1' || phase === 'bwd-2' || phase === 'bwd-3') ? `∂L/∂y = ${dL_dy.toFixed(4)}` : '' },
    };

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<style>
      .bp-node { fill: var(--paper); stroke: var(--ink); stroke-width: 2; }
      .bp-node.computed { fill: #cfe5ff; }
      .bp-node.gradient { fill: var(--accent-soft); stroke: var(--accent); }
      .bp-text { font-family: var(--font-mono); font-size: 12px; fill: var(--ink); }
      .bp-text-small { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .bp-text-grad { font-family: var(--font-mono); font-size: 10px; fill: var(--accent); font-weight: 600; }
      .bp-edge { stroke: var(--ink); stroke-width: 1.5; marker-end: url(#bp-fwd); }
      .bp-edge.bwd { stroke: var(--accent); stroke-width: 2; marker-end: url(#bp-bwd); stroke-dasharray: 4 3; }
    </style>`;
    svg += `<defs>
      <marker id="bp-fwd" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/></marker>
      <marker id="bp-bwd" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--accent)"/></marker>
    </defs>`;

    // edges
    const isBwd = phase.startsWith('bwd');
    const edges = [
      ['x', 'z'], ['w', 'z'], ['b', 'z'],
      ['z', 'y'], ['y', 'L'],
    ];
    edges.forEach(([from, to]) => {
      const a = nodePositions[from], b2 = nodePositions[to];
      if (isBwd) {
        // backward arrows
        svg += `<line class="bp-edge bwd" x1="${b2.x - 50}" y1="${b2.y}" x2="${a.x + 50}" y2="${a.y}"/>`;
      } else {
        svg += `<line class="bp-edge" x1="${a.x + 50}" y1="${a.y}" x2="${b2.x - 50}" y2="${b2.y}"/>`;
      }
    });

    // nodes
    const computed = new Set(s.nodes);
    Object.entries(nodePositions).filter(([k]) => !['yL'].includes(k)).forEach(([k, n]) => {
      const isComp = computed.has(k);
      const cls = isBwd && isComp ? 'gradient' : (isComp ? 'computed' : '');
      svg += `<rect class="bp-node ${cls}" x="${n.x - 50}" y="${n.y - 22}" width="100" height="44" rx="6"/>`;
      svg += `<text class="bp-text" x="${n.x}" y="${n.y - 4}" text-anchor="middle">${n.label}</text>`;
      if (n.val) svg += `<text class="bp-text-small" x="${n.x}" y="${n.y + 12}" text-anchor="middle">${n.val}</text>`;
      if (n.grad) svg += `<text class="bp-text-grad" x="${n.x}" y="${n.y + 36}" text-anchor="middle">${n.grad}</text>`;
    });

    svg += `</svg>`;
    root.querySelector('#bp-stage').innerHTML = svg;

    root.querySelector('#bp-counter').textContent = `${step} / ${STAGES.length - 1}`;
    root.querySelector('#bp-explain').innerHTML = s.label;
  }
  render();
}
