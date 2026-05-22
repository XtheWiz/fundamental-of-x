// Tokens widget: tokenize input text using a tiny rule-based imitation
// of BPE — split on whitespace + a few common subwords. Show each
// token + a fake embedding (deterministic from the token text).

const SPLITS = ['ing', 'ed', 'er', 'est', 's', 'ly', 'tion', 'ment', 'ness', 'ize'];

function tokenize(text) {
  const out = [];
  // simple BPE-ish: split on spaces, then peel known suffixes
  const words = text.split(/(\s+)/).filter((w) => w.length);
  for (const w of words) {
    if (/^\s+$/.test(w)) { continue; }
    let head = w;
    const tails = [];
    for (const sfx of SPLITS) {
      if (head.length > sfx.length + 2 && head.toLowerCase().endsWith(sfx)) {
        tails.unshift(head.slice(-sfx.length));
        head = head.slice(0, -sfx.length);
        break;
      }
    }
    // longer words may split into two equal parts
    if (head.length > 8) {
      const mid = Math.floor(head.length / 2);
      out.push((out.length === 0 ? '' : ' ') + head.slice(0, mid));
      out.push(head.slice(mid));
    } else {
      out.push((out.length === 0 ? '' : ' ') + head);
    }
    tails.forEach((t) => out.push(t));
  }
  return out;
}

function fakeEmbed(token, dim = 12) {
  // Deterministic pseudo-embedding: hash token chars into [dim] floats
  let h = 0;
  for (const c of token) h = (h * 31 + c.charCodeAt(0)) | 0;
  const vec = [];
  for (let i = 0; i < dim; i++) {
    h = (h * 1103515245 + 12345) | 0;
    vec.push(((h & 0xff) / 255 - 0.5).toFixed(2));
  }
  return vec;
}

export function initTokensWidget(root) {
  let text = 'The quick brown fox jumps fundamentally.';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Type, watch it become tokens</div>

      <div class="controls">
        <input class="field" id="tk-text" value="${text}" style="flex: 1; min-width: 280px; font-family: var(--font-mono);">
      </div>

      <div class="widget-stage" id="tk-stage" style="min-height: 220px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Tokens</div><div class="value" id="m-tokens">0</div></div>
        <div class="metric"><div class="label">Characters</div><div class="value" id="m-chars">0</div></div>
        <div class="metric accent"><div class="label">Chars / token</div><div class="value" id="m-ratio">—</div></div>
      </div>

      <div class="callout" id="tk-explain">Hover a token to see its (simulated) 12-d embedding. Real models use 512+ dims.</div>
    </div>
  `;

  root.querySelector('#tk-text').addEventListener('input', (e) => { text = e.target.value; render(); });

  function render() {
    const tokens = tokenize(text);
    const html = tokens.map((t, i) => `<span class="tf-token" data-i="${i}" title="embedding: [${fakeEmbed(t).join(', ')}]">${escape(t.replace(/ /g, '·'))}</span>`).join('');
    root.querySelector('#tk-stage').innerHTML = `
      <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 0.6rem;">Tokens (hover for embedding; · = leading space):</div>
      <div style="line-height: 2;">${html}</div>
      <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-top: 0.8rem;">Hovered token's embedding:</div>
      <div id="tk-embed" style="font-family: var(--font-mono); font-size: 0.78rem; padding: 0.5rem 0.7rem; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: 4px; min-height: 30px;">(hover a token)</div>
    `;
    root.querySelectorAll('.tf-token').forEach((el, i) => {
      el.addEventListener('mouseenter', () => {
        root.querySelector('#tk-embed').textContent = `[${fakeEmbed(tokens[i]).join(', ')}]`;
      });
    });

    root.querySelector('#m-tokens').textContent = tokens.length;
    root.querySelector('#m-chars').textContent = text.length;
    root.querySelector('#m-ratio').textContent = tokens.length ? (text.length / tokens.length).toFixed(2) : '—';
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
