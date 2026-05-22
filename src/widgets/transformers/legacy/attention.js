// Attention widget: show a fake attention matrix on a short sentence.
// Click a token to see its attention distribution. Pre-computed weights
// crafted to look like realistic patterns (current token + subject).

const TOKENS = ['The', 'cat', 'sat', 'on', 'the', 'mat', 'because', 'it', 'was', 'tired'];

// Hand-crafted attention matrix that demonstrates a "coreference"-style
// pattern: when query is "it", it attends strongly to "cat".
// rows = query token, cols = key token (attention weights, each row sums to 1)
function computeAttention() {
  const n = TOKENS.length;
  const M = [];
  for (let q = 0; q < n; q++) {
    const row = new Array(n).fill(0);
    for (let k = 0; k < n; k++) {
      // Base: small attention to all
      let w = 0.02;
      // Self-attention: prefer your own position lightly
      if (q === k) w += 0.2;
      // Recency bias: prefer recent tokens
      const dist = Math.abs(q - k);
      w += Math.max(0, 0.5 - dist * 0.08);
      // Special: "it" attends to "cat"
      if (TOKENS[q] === 'it' && TOKENS[k] === 'cat') w += 1.5;
      // Special: "tired" attends to "it" and "cat"
      if (TOKENS[q] === 'tired' && (TOKENS[k] === 'cat' || TOKENS[k] === 'it')) w += 0.8;
      // Articles attend to their nouns
      if (TOKENS[q] === 'The' && TOKENS[k] === 'cat') w += 0.4;
      if (TOKENS[q] === 'the' && TOKENS[k] === 'mat') w += 0.4;
      row[k] = w;
    }
    // softmax
    const max = Math.max(...row);
    const exp = row.map((x) => Math.exp(x - max));
    const sum = exp.reduce((a, b) => a + b);
    for (let k = 0; k < n; k++) row[k] = exp[k] / sum;
    M.push(row);
  }
  return M;
}

export function initAttentionWidget(root) {
  const A = computeAttention();
  let query = TOKENS.indexOf('it');

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">"${TOKENS.join(' ')}"</div>
      <p class="widget-hint">Click any token to make it the <em>query</em>. The intensity of each other token shows how much attention the query pays to it.</p>

      <div class="widget-stage" id="at-stage" style="min-height: 280px;"></div>

      <div class="callout" id="at-explain"></div>
    </div>
  `;

  function render() {
    let html = `
      <div style="margin-bottom: 0.8rem;">
        <strong>Query token:</strong>
        ${TOKENS.map((t, i) => `<button class="at-tok ${i === query ? 'q' : ''}" data-i="${i}" style="font-family: var(--font-mono); font-size: 0.9rem; padding: 0.25em 0.6em; margin: 0.1em; border: 2px solid var(--ink); border-radius: 3px; background: ${i === query ? 'var(--accent)' : 'var(--paper)'}; color: ${i === query ? 'white' : 'var(--ink)'}; cursor: pointer;">${t}</button>`).join('')}
      </div>

      <div style="margin: 1rem 0 0.5rem;"><strong>Attention from "${TOKENS[query]}" to each token:</strong></div>
      <div style="display: flex; gap: 0.15rem; flex-wrap: wrap;">
        ${TOKENS.map((t, i) => {
          const w = A[query][i];
          const alpha = w;
          return `<div style="font-family: var(--font-mono); font-size: 0.9rem; padding: 0.35em 0.7em; border: 1.5px solid var(--ink); border-radius: 3px; background: rgba(214, 40, 40, ${alpha}); color: ${alpha > 0.4 ? 'white' : 'var(--ink)'};">${t}<br><span style="font-size: 0.65rem; opacity: 0.85;">${(w*100).toFixed(1)}%</span></div>`;
        }).join('')}
      </div>

      <div style="margin-top: 1.2rem;"><strong>Full attention matrix</strong> (queries down, keys across):</div>
      <div style="overflow-x: auto;">
        <table style="border-collapse: collapse; margin-top: 0.4rem; font-family: var(--font-mono); font-size: 0.7rem;">
          <thead><tr><td></td>${TOKENS.map((t) => `<th style="padding: 0.15em 0.3em; text-align: center; transform: rotate(-30deg); transform-origin: bottom left;">${t}</th>`).join('')}</tr></thead>
          <tbody>
            ${TOKENS.map((rt, ri) => `
              <tr>
                <th style="padding: 0.15em 0.4em; text-align: right;">${rt}</th>
                ${TOKENS.map((_, ci) => {
                  const w = A[ri][ci];
                  return `<td style="width: 28px; height: 28px; background: rgba(214, 40, 40, ${w}); border: 1px solid var(--ink-soft); text-align: center; color: ${w > 0.4 ? 'white' : 'var(--ink)'};">${w > 0.05 ? (w*100).toFixed(0) : ''}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    root.querySelector('#at-stage').innerHTML = html;
    root.querySelectorAll('.at-tok').forEach((b) => {
      b.addEventListener('click', () => { query = Number(b.dataset.i); render(); });
    });

    const topK = A[query].map((w, i) => ({ w, t: TOKENS[i] })).sort((a, b) => b.w - a.w).slice(0, 3);
    root.querySelector('#at-explain').innerHTML = `<strong>"${TOKENS[query]}" attends most to:</strong> ${topK.map((x) => `<code>${x.t}</code> (${(x.w*100).toFixed(0)}%)`).join(', ')}. ${TOKENS[query] === 'it' ? `"It" correctly resolves to "cat" — that's coreference, learned from data.` : ''}`;
  }
  render();
}
