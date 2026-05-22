// Training widget: walk through a sentence token by token. At each
// position, show the (made-up) top-3 predictions, the actual next
// token, and the per-token loss.

const SENTENCE = ['The', 'cat', 'sat', 'on', 'the', 'mat', '.'];

// Hand-crafted top predictions at each position for storytelling.
const PREDICTIONS = [
  null,  // no prediction at position 0
  { right: 'cat',  top: [['dog', 0.32], ['cat', 0.28], ['boy', 0.10]] },  // mild surprise
  { right: 'sat',  top: [['ran', 0.30], ['sat', 0.25], ['was', 0.15]] },  // common verb
  { right: 'on',   top: [['on', 0.45], ['under', 0.20], ['near', 0.12]] },// easy
  { right: 'the',  top: [['the', 0.60], ['a', 0.18], ['his', 0.08]] },    // very easy
  { right: 'mat',  top: [['floor', 0.18], ['mat', 0.16], ['rug', 0.14]] },// surprise
  { right: '.',    top: [['.', 0.55], [',', 0.20], ['and', 0.08]] },      // easy
];

function lossFor(p) {
  if (!p) return 0;
  const prob = p.top.find((x) => x[0] === p.right);
  const pVal = prob ? prob[1] : 0.01;
  return -Math.log(pVal);
}

export function initTrainingWidget(root) {
  let pos = 1;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Step through training on "${SENTENCE.join(' ')}"</div>

      <div class="controls">
        <button class="btn" id="tr-prev">← Back</button>
        <button class="btn btn-accent" id="tr-next">Next token →</button>
        <button class="btn btn-ghost" id="tr-reset">Reset</button>
      </div>

      <div class="widget-stage" id="tr-stage" style="min-height: 320px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Position</div><div class="value" id="m-pos">1</div></div>
        <div class="metric"><div class="label">Per-token loss</div><div class="value" id="m-tloss">—</div></div>
        <div class="metric accent"><div class="label">Total loss so far</div><div class="value" id="m-total">—</div></div>
      </div>

      <div class="callout" id="tr-explain"></div>
    </div>
  `;

  root.querySelector('#tr-next').addEventListener('click', () => { if (pos < SENTENCE.length - 1) pos++; render(); });
  root.querySelector('#tr-prev').addEventListener('click', () => { if (pos > 1) pos--; render(); });
  root.querySelector('#tr-reset').addEventListener('click', () => { pos = 1; render(); });

  function render() {
    let html = `<div class="tr-context"><strong>Context the model sees:</strong></div>`;
    html += `<div style="display: flex; gap: 0.2rem; flex-wrap: wrap; margin: 0.4rem 0 1rem;">`;
    SENTENCE.forEach((t, i) => {
      let style = 'font-family: var(--font-mono); padding: 0.3em 0.6em; border: 1.5px solid var(--ink); border-radius: 3px;';
      if (i < pos) style += 'background: #cfe5ff;';
      else if (i === pos) style += 'background: var(--accent); color: white;';
      else style += 'background: var(--paper); opacity: 0.4;';
      html += `<div style="${style}">${t}</div>`;
    });
    html += `</div>`;

    const p = PREDICTIONS[pos];
    if (p) {
      html += `<div><strong>Model's top predictions for the next token:</strong></div>`;
      html += `<table style="border-collapse: collapse; margin-top: 0.4rem; font-family: var(--font-mono); font-size: 0.85rem;">`;
      html += `<thead><tr><th style="padding: 0.3em 0.6em; text-align: left;">token</th><th style="padding: 0.3em 0.6em; text-align: right;">probability</th><th></th></tr></thead><tbody>`;
      p.top.forEach((pair) => {
        const isRight = pair[0] === p.right;
        html += `<tr>
          <td style="padding: 0.2em 0.6em; ${isRight ? 'background: #d6f5d6; font-weight: 700;' : ''}">${pair[0]}</td>
          <td style="padding: 0.2em 0.6em; text-align: right; ${isRight ? 'background: #d6f5d6; font-weight: 700;' : ''}">${(pair[1] * 100).toFixed(1)}%</td>
          <td style="padding: 0.2em 0.6em;">${isRight ? '← actual' : ''}</td>
        </tr>`;
      });
      html += `</tbody></table>`;

      html += `<div style="margin-top: 0.6rem;"><strong>Cross-entropy loss</strong> = −log(P[actual]) = −log(${(p.top.find((x) => x[0] === p.right)[1]).toFixed(3)}) = <strong>${lossFor(p).toFixed(3)}</strong> nats.</div>`;
    }
    root.querySelector('#tr-stage').innerHTML = html;

    const totalLoss = PREDICTIONS.slice(1, pos + 1).reduce((acc, q) => acc + lossFor(q), 0);
    root.querySelector('#m-pos').textContent = pos;
    root.querySelector('#m-tloss').textContent = p ? lossFor(p).toFixed(3) : '—';
    root.querySelector('#m-total').textContent = totalLoss.toFixed(3);

    if (p && lossFor(p) > 1.4) {
      root.querySelector('#tr-explain').innerHTML = `<strong>Surprising token.</strong> The model predicted "${p.top[0][0]}" but the actual was "${p.right}" — high loss. Each weight gets a tiny nudge to make this less surprising next time.`;
    } else if (p) {
      root.querySelector('#tr-explain').innerHTML = `<strong>Confident and (mostly) right.</strong> Low loss — small gradient update. The model already "knows" this part of language well.`;
    }
  }
  render();
}
