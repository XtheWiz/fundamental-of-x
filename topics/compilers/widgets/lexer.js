// Lexer widget: type code, see it tokenized live.

const KEYWORDS = new Set(['let', 'const', 'if', 'else', 'while', 'return', 'function', 'true', 'false']);

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const len = src.length;
  while (i < len) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src[i+1] === '/') {
      while (i < len && src[i] !== '\n') i++;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < len && /[a-zA-Z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      tokens.push({ type: KEYWORDS.has(word) ? 'KEYWORD' : 'IDENT', value: word });
      i = j; continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < len && /[0-9.]/.test(src[j])) j++;
      tokens.push({ type: 'NUMBER', value: src.slice(i, j) });
      i = j; continue;
    }
    if (c === '"' || c === "'") {
      const quote = c;
      let j = i + 1;
      while (j < len && src[j] !== quote) j++;
      tokens.push({ type: 'STRING', value: src.slice(i, j + 1) });
      i = j + 1; continue;
    }
    if ('+-*/=<>!&|'.includes(c)) {
      let j = i + 1;
      if (j < len && '=&|'.includes(src[j])) j++;
      tokens.push({ type: 'OP', value: src.slice(i, j) });
      i = j; continue;
    }
    if ('(){}[];,.:'.includes(c)) {
      tokens.push({ type: 'PUNCT', value: c });
      i++; continue;
    }
    tokens.push({ type: 'UNKNOWN', value: c });
    i++;
  }
  return tokens;
}

const CLASS = { KEYWORD: 'tok-kw', IDENT: 'tok-id', NUMBER: 'tok-num', OP: 'tok-op', PUNCT: 'tok-punct', STRING: 'tok-str', UNKNOWN: '' };
const SAMPLES = [
  `let x = 42;\nlet name = "Ada";\nif (x > 10) {\n  return x * 2;\n}`,
  `function add(a, b) {\n  return a + b;\n}\n// trailing comment`,
  `let pi = 3.14;\nlet ok = true && (x != 0);`,
];

export function initLexerWidget(root) {
  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Type source, get tokens</div>
      <div class="controls">
        <button class="btn" data-sample="0">Sample 1</button>
        <button class="btn" data-sample="1">Sample 2</button>
        <button class="btn" data-sample="2">Sample 3</button>
      </div>
      <textarea id="lex-src" spellcheck="false" style="width:100%;min-height:120px;font-family:var(--font-mono);font-size:0.9rem;padding:0.7rem;border:2px solid var(--ink);border-radius:var(--radius);background:var(--paper-deep);resize:vertical;"></textarea>
      <div style="display:flex;gap:1.2rem;flex-wrap:wrap;margin:0.8rem 0;font-size:0.8rem;color:var(--ink-soft);">
        <span><span class="token tok-kw">keyword</span></span>
        <span><span class="token tok-id">ident</span></span>
        <span><span class="token tok-num">number</span></span>
        <span><span class="token tok-op">operator</span></span>
        <span><span class="token tok-punct">punct</span></span>
        <span><span class="token tok-str">string</span></span>
      </div>
      <div class="widget-stage" id="lex-out" style="min-height:120px;"></div>
      <div class="callout" id="lex-count"></div>
    </div>
  `;

  const ta = root.querySelector('#lex-src');
  const out = root.querySelector('#lex-out');
  const count = root.querySelector('#lex-count');

  function render() {
    const toks = tokenize(ta.value);
    out.innerHTML = toks.map((t) => {
      const cls = CLASS[t.type] || '';
      const v = t.value.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '\\n');
      return `<span class="token ${cls}" title="${t.type}">${v}</span>`;
    }).join('') || '<em style="color:var(--ink-faint);">no tokens — try typing</em>';
    const counts = {};
    toks.forEach((t) => counts[t.type] = (counts[t.type] || 0) + 1);
    count.innerHTML = `<strong>${toks.length}</strong> tokens — ` + Object.entries(counts).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(', ');
  }

  ta.addEventListener('input', render);
  root.querySelectorAll('[data-sample]').forEach((b) => b.addEventListener('click', () => {
    ta.value = SAMPLES[+b.dataset.sample];
    render();
  }));
  ta.value = SAMPLES[0];
  render();
}
