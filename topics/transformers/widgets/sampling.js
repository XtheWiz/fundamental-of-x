// Sampling widget: a fixed logit distribution. User adjusts temperature,
// top-k, top-p. Show how the sampling distribution reshapes.

const LOGITS = [
  { tok: 'dog',    logit: 3.5 },
  { tok: 'cat',    logit: 3.0 },
  { tok: 'animal', logit: 1.8 },
  { tok: 'thing',  logit: 1.0 },
  { tok: 'word',   logit: 0.5 },
  { tok: 'idea',   logit: 0.0 },
  { tok: 'plant',  logit: -0.5 },
  { tok: 'rock',   logit: -1.5 },
];

function softmax(logits, T) {
  const scaled = logits.map((l) => l / T);
  const m = Math.max(...scaled);
  const exp = scaled.map((x) => Math.exp(x - m));
  const sum = exp.reduce((a, b) => a + b);
  return exp.map((e) => e / sum);
}

function applyTopK(probs, k) {
  const indexed = probs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
  const kept = new Set(indexed.slice(0, k).map((x) => x.i));
  const out = probs.map((p, i) => kept.has(i) ? p : 0);
  const sum = out.reduce((a, b) => a + b);
  return out.map((p) => p / sum);
}

function applyTopP(probs, p_thresh) {
  const indexed = probs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
  let cum = 0;
  const kept = new Set();
  for (const x of indexed) {
    kept.add(x.i);
    cum += x.p;
    if (cum >= p_thresh) break;
  }
  const out = probs.map((p, i) => kept.has(i) ? p : 0);
  const sum = out.reduce((a, b) => a + b);
  return out.map((p) => p / sum);
}

export function initSamplingWidget(root) {
  let T = 1.0;
  let topK = LOGITS.length;
  let topP = 1.0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Sampling distribution over 8 candidate tokens</div>

      <div class="controls">
        <label>Temperature: <strong id="sp-tv">${T.toFixed(2)}</strong></label>
        <input type="range" min="0.05" max="2" step="0.05" value="${T}" id="sp-t" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Top-k: <strong id="sp-kv">${topK}</strong></label>
        <input type="range" min="1" max="${LOGITS.length}" step="1" value="${topK}" id="sp-k" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Top-p: <strong id="sp-pv">${topP.toFixed(2)}</strong></label>
        <input type="range" min="0.1" max="1" step="0.05" value="${topP}" id="sp-p" style="flex: 1;">
      </div>

      <div class="widget-stage" id="sp-stage" style="min-height: 280px;"></div>

      <div class="callout" id="sp-explain"></div>
    </div>
  `;

  root.querySelector('#sp-t').addEventListener('input', (e) => { T = Number(e.target.value); render(); });
  root.querySelector('#sp-k').addEventListener('input', (e) => { topK = Number(e.target.value); render(); });
  root.querySelector('#sp-p').addEventListener('input', (e) => { topP = Number(e.target.value); render(); });

  function render() {
    const raw = softmax(LOGITS.map((x) => x.logit), T);
    let filtered = applyTopK(raw, topK);
    filtered = applyTopP(filtered, topP);

    const maxP = Math.max(...raw, ...filtered, 0.1);
    let html = `
      <div style="margin-bottom: 0.5rem;"><strong>After temperature only (gray) vs after top-k + top-p (red):</strong></div>
      <div style="display: flex; flex-direction: column; gap: 0.3rem;">
    `;
    LOGITS.forEach((l, i) => {
      const rawW = (raw[i] / maxP) * 100;
      const filtW = (filtered[i] / maxP) * 100;
      const ban = filtered[i] === 0;
      html += `<div style="display: grid; grid-template-columns: 80px 1fr 70px; gap: 0.6rem; align-items: center;">
        <div style="font-family: var(--font-mono); font-size: 0.85rem; text-align: right;">${l.tok}</div>
        <div style="position: relative; height: 26px; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: 3px;">
          <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${rawW}%; background: rgba(150, 150, 150, 0.5); border-right: 1px solid var(--ink-soft);"></div>
          <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${filtW}%; background: var(--accent); ${ban ? 'opacity: 0;' : ''}"></div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem; ${ban ? 'color: var(--ink-faint); text-decoration: line-through;' : ''}">${(filtered[i] * 100).toFixed(1)}%</div>
      </div>`;
    });
    html += `</div>`;
    root.querySelector('#sp-stage').innerHTML = html;

    root.querySelector('#sp-tv').textContent = T.toFixed(2);
    root.querySelector('#sp-kv').textContent = topK;
    root.querySelector('#sp-pv').textContent = topP.toFixed(2);

    const survivors = filtered.filter((p) => p > 0).length;
    let exp;
    if (T < 0.2) exp = `<strong>Near-greedy.</strong> Temperature ${T.toFixed(2)} makes the model almost always pick the top token. Repetitive but reliable.`;
    else if (T > 1.5) exp = `<strong>High temperature.</strong> The distribution is flattened — low-probability tokens get sampled too. More creative, more risk of nonsense.`;
    else if (survivors <= 2) exp = `Top-k/top-p have narrowed to ${survivors} candidates. Conservative sampling.`;
    else exp = `Balanced sampling — ${survivors} candidates survive filtering. Common production settings.`;
    root.querySelector('#sp-explain').innerHTML = exp;
  }
  render();
}
