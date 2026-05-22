// Multi-head attention widget: same sentence, 4 hand-crafted heads
// showing different specializations.

const TOKENS = ['The', 'cat', 'sat', 'on', 'the', 'mat', 'because', 'it', 'was', 'tired'];

const HEADS = [
  {
    name: 'Head 1 — previous token',
    desc: 'Each token attends mostly to the one just before it. Useful for n-gram-like patterns.',
    score: (q, k) => q - k === 1 ? 2.5 : (q === k ? 0.5 : -2),
  },
  {
    name: 'Head 2 — coreference',
    desc: 'Pronouns ("it") learn to attend to their antecedents ("cat").',
    score: (q, k) => {
      if (TOKENS[q] === 'it' && TOKENS[k] === 'cat') return 3;
      if (TOKENS[q] === 'tired' && TOKENS[k] === 'cat') return 1.5;
      return q === k ? 0.3 : -1;
    },
  },
  {
    name: 'Head 3 — article→noun',
    desc: '"The"/"the" learns to look forward to the noun it modifies.',
    score: (q, k) => {
      if (TOKENS[q] === 'The' && k === q + 1) return 3;
      if (TOKENS[q] === 'the' && k === q + 1) return 3;
      return q === k ? 0.2 : -1;
    },
  },
  {
    name: 'Head 4 — broad context',
    desc: 'Diffuse attention across all tokens — gathers global meaning.',
    score: (q, k) => 0.3,
  },
];

function softmaxRow(scores) {
  const m = Math.max(...scores);
  const exp = scores.map((s) => Math.exp(s - m));
  const sum = exp.reduce((a, b) => a + b);
  return exp.map((e) => e / sum);
}

function computeHead(head) {
  const n = TOKENS.length;
  const out = [];
  for (let q = 0; q < n; q++) {
    const row = new Array(n);
    for (let k = 0; k < n; k++) row[k] = head.score(q, k);
    out.push(softmaxRow(row));
  }
  return out;
}

export function initMultiHeadWidget(root) {
  const matrices = HEADS.map(computeHead);
  let activeHead = 0;
  let queryIdx = TOKENS.indexOf('it');

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Same sentence, four heads</div>

      <div class="controls">
        ${HEADS.map((h, i) => `
          <button class="btn ${i === 0 ? 'btn-accent' : ''}" data-h="${i}">${h.name}</button>
        `).join('')}
      </div>

      <div class="callout" id="mh-desc"></div>

      <div class="widget-stage" id="mh-stage" style="min-height: 320px;"></div>
    </div>
  `;

  root.querySelectorAll('button[data-h]').forEach((b) => {
    b.addEventListener('click', () => {
      activeHead = Number(b.dataset.h);
      root.querySelectorAll('button[data-h]').forEach((x) => x.classList.toggle('btn-accent', Number(x.dataset.h) === activeHead));
      render();
    });
  });

  function render() {
    const head = HEADS[activeHead];
    const A = matrices[activeHead];
    root.querySelector('#mh-desc').innerHTML = `<strong>${head.name}.</strong> ${head.desc}`;

    let html = `
      <div style="margin-bottom: 0.6rem;"><strong>Pick a query token:</strong></div>
      <div style="margin-bottom: 0.8rem;">
        ${TOKENS.map((t, i) => `<button class="mh-q ${i === queryIdx ? 'sel' : ''}" data-q="${i}" style="font-family: var(--font-mono); padding: 0.2em 0.5em; margin: 0.1em; border: 2px solid var(--ink); border-radius: 3px; background: ${i === queryIdx ? 'var(--accent)' : 'var(--paper)'}; color: ${i === queryIdx ? 'white' : 'var(--ink)'}; cursor: pointer;">${t}</button>`).join('')}
      </div>
      <div><strong>Attention from "${TOKENS[queryIdx]}":</strong></div>
      <div style="display: flex; gap: 0.15rem; flex-wrap: wrap; margin-top: 0.4rem;">
        ${TOKENS.map((t, i) => {
          const w = A[queryIdx][i];
          return `<div style="font-family: var(--font-mono); padding: 0.3em 0.6em; border: 1.5px solid var(--ink); border-radius: 3px; background: rgba(214, 40, 40, ${w}); color: ${w > 0.4 ? 'white' : 'var(--ink)'};">${t}<br><span style="font-size: 0.65rem; opacity: 0.85;">${(w*100).toFixed(0)}%</span></div>`;
        }).join('')}
      </div>
    `;
    root.querySelector('#mh-stage').innerHTML = html;
    root.querySelectorAll('.mh-q').forEach((b) => {
      b.addEventListener('click', () => { queryIdx = Number(b.dataset.q); render(); });
    });
  }
  render();
}
