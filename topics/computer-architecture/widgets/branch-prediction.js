// Branch prediction widget: two-bit saturating counter, fed a stream
// of branches from a chosen pattern. Show prediction vs outcome and
// running accuracy.

const PATTERNS = {
  loop:   { label: 'Loop (TTTTTT...N)', gen: (i) => i % 10 !== 9 },
  alt:    { label: 'Alternating (TNTNTN)', gen: (i) => i % 2 === 0 },
  random: { label: 'Random (~50/50)', gen: (i) => Math.random() < 0.5 },
  sorted: { label: 'Sorted array if (x < 128)', gen: (i) => (i % 256) < 128 },
  unsort: { label: 'Unsorted array if (x < 128)', gen: () => Math.random() < 0.5 },
};

// 2-bit saturating counter: 0=strongly N, 1=weakly N, 2=weakly T, 3=strongly T
function predict(state) { return state >= 2; }
function update(state, taken) {
  if (taken && state < 3) return state + 1;
  if (!taken && state > 0) return state - 1;
  return state;
}

export function initBranchPredictionWidget(root) {
  const state = {
    pattern: 'loop',
    counter: 0,
    iter: 0,
    correct: 0,
    history: [],     // last 50 outcomes
    running: false,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Two-bit saturating counter</div>

      <div class="controls">
        <label>Pattern:</label>
        <select class="field" id="bp-pattern">
          ${Object.entries(PATTERNS).map(([id, p]) => `<option value="${id}">${p.label}</option>`).join('')}
        </select>
        <button class="btn btn-accent" id="bp-step">Next branch</button>
        <button class="btn" id="bp-run100">Run 100</button>
        <button class="btn btn-ghost" id="bp-reset">Reset</button>
      </div>

      <div class="widget-stage" id="bp-stage" style="min-height: 220px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Branches</div><div class="value" id="m-iter">0</div></div>
        <div class="metric"><div class="label">Correct</div><div class="value" id="m-correct">0</div></div>
        <div class="metric accent"><div class="label">Accuracy</div><div class="value" id="m-acc">—</div></div>
        <div class="metric"><div class="label">Stall cost</div><div class="value" id="m-stall">0 cycles</div></div>
      </div>

      <div class="callout" id="bp-explain">Pick a pattern and step. Watch the predictor "learn" the pattern over time.</div>
    </div>
  `;

  const stage = root.querySelector('#bp-stage');
  root.querySelector('#bp-pattern').addEventListener('change', (e) => { state.pattern = e.target.value; reset(); });
  root.querySelector('#bp-step').addEventListener('click', () => step(1));
  root.querySelector('#bp-run100').addEventListener('click', async () => {
    for (let i = 0; i < 100 && !state.running; i++) { step(1); await wait(15); }
  });
  root.querySelector('#bp-reset').addEventListener('click', reset);

  function reset() {
    state.counter = 0;
    state.iter = 0;
    state.correct = 0;
    state.history = [];
    render();
  }

  function step(n) {
    for (let i = 0; i < n; i++) {
      const taken = PATTERNS[state.pattern].gen(state.iter);
      const guess = predict(state.counter);
      const right = guess === taken;
      if (right) state.correct++;
      state.history.push({ taken, guess, right });
      if (state.history.length > 50) state.history.shift();
      state.counter = update(state.counter, taken);
      state.iter++;
    }
    render();
  }

  function render() {
    const acc = state.iter ? (state.correct / state.iter) : 0;
    root.querySelector('#m-iter').textContent = state.iter;
    root.querySelector('#m-correct').textContent = state.correct;
    root.querySelector('#m-acc').textContent = state.iter ? `${(acc * 100).toFixed(1)}%` : '—';
    const stalls = state.iter - state.correct;
    root.querySelector('#m-stall').textContent = `${stalls * 15} cycles`;

    // counter state visualization + recent history
    const counterLabels = ['strong N', 'weak N', 'weak T', 'strong T'];
    let html = `
      <div class="bp-counter">
        <div class="bp-counter-label">PREDICTOR STATE</div>
        <div class="bp-counter-dots">
          ${[0,1,2,3].map((i) => `<div class="bp-dot ${i === state.counter ? 'on' : ''}">${i}</div>`).join('')}
        </div>
        <div class="bp-counter-name">${counterLabels[state.counter]}</div>
        <div class="bp-counter-sub">${state.counter >= 2 ? 'predict TAKEN' : 'predict NOT TAKEN'}</div>
      </div>

      <div class="bp-history">
        <div class="bp-history-label">LAST 50 BRANCHES (left = newest)</div>
        <div class="bp-history-row">
          ${state.history.slice().reverse().map((h) => `<div class="bp-pip ${h.right ? 'right' : 'wrong'}" title="taken=${h.taken} guess=${h.guess}"></div>`).join('')}
        </div>
        <div class="bp-history-legend">
          <span><div class="bp-pip right"></div> correct</span>
          <span><div class="bp-pip wrong"></div> mispredict</span>
        </div>
      </div>
    `;
    html += `<style>
      .bp-counter { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; margin-bottom: 0.6rem; }
      .bp-counter-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.4em; }
      .bp-counter-dots { display: flex; gap: 0.4rem; margin-bottom: 0.3em; }
      .bp-dot { width: 32px; height: 32px; border: 2px solid var(--ink); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 0.9rem; background: var(--paper); }
      .bp-dot.on { background: var(--accent); color: white; }
      .bp-counter-name { font-family: var(--font-display); letter-spacing: 0.04em; font-size: 1.1rem; }
      .bp-counter-sub { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-soft); }
      .bp-history { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; }
      .bp-history-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.4em; }
      .bp-history-row { display: flex; gap: 2px; flex-wrap: wrap; min-height: 18px; }
      .bp-pip { width: 14px; height: 14px; border: 1px solid var(--ink); border-radius: 2px; }
      .bp-pip.right { background: #2a8a3e; }
      .bp-pip.wrong { background: var(--accent); }
      .bp-history-legend { display: flex; gap: 1rem; margin-top: 0.4em; font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-soft); align-items: center; }
      .bp-history-legend span { display: inline-flex; align-items: center; gap: 0.3em; }
    </style>`;
    stage.innerHTML = html;

    let exp;
    if (state.iter === 0) exp = 'Pick a pattern and click "Next branch" to start feeding the predictor.';
    else if (state.pattern === 'random' || state.pattern === 'unsort') exp = 'Random/unpredictable branches keep the predictor confused — accuracy hovers around 50%, which is no better than coin-flipping. Every misprediction is a ~15-cycle pipeline flush.';
    else if (acc > 0.9) exp = `${(acc*100).toFixed(0)}% accuracy. The predictor has locked onto the pattern — most branches now cost nothing.`;
    else if (acc > 0.7) exp = `Predictor is learning. ${(acc*100).toFixed(0)}% accuracy and rising as the counter saturates.`;
    else exp = 'Early branches mispredict (the counter starts at "strong N"). Give it 10–20 iterations to converge.';
    root.querySelector('#bp-explain').innerHTML = exp;
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  render();
}
