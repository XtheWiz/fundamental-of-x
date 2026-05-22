// Lexer widget: type code, see it tokenized live.

import { t } from '../../../js/i18n.js';

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
const LABEL_KEY = { KEYWORD: 'compilers.lexer.widget.legendKw', IDENT: 'compilers.lexer.widget.legendId', NUMBER: 'compilers.lexer.widget.legendNum', OP: 'compilers.lexer.widget.legendOp', PUNCT: 'compilers.lexer.widget.legendPunct', STRING: 'compilers.lexer.widget.legendStr' };
const SAMPLES = [
  `let x = 42;\nlet name = "Ada";\nif (x > 10) {\n  return x * 2;\n}`,
  `function add(a, b) {\n  return a + b;\n}\n// trailing comment`,
  `let pi = 3.14;\nlet ok = true && (x != 0);`,
];

export function initLexerWidget(root) {
  function render() {
    root.innerHTML = `
      <div class="widget">
        <div class="widget-title">${t('compilers.lexer.widget.title')}</div>
        <div class="controls">
          <button class="btn" data-sample="0">${t('compilers.lexer.widget.sample1')}</button>
          <button class="btn" data-sample="1">${t('compilers.lexer.widget.sample2')}</button>
          <button class="btn" data-sample="2">${t('compilers.lexer.widget.sample3')}</button>
        </div>
        <textarea id="lex-src" spellcheck="false" style="width:100%;min-height:120px;font-family:var(--font-mono);font-size:0.9rem;padding:0.7rem;border:2px solid var(--ink);border-radius:var(--radius);background:var(--paper-deep);resize:vertical;"></textarea>
        <div style="display:flex;gap:1.2rem;flex-wrap:wrap;margin:0.8rem 0;font-size:0.8rem;color:var(--ink-soft);">
          <span><span class="token tok-kw">${t('compilers.lexer.widget.legendKw')}</span></span>
          <span><span class="token tok-id">${t('compilers.lexer.widget.legendId')}</span></span>
          <span><span class="token tok-num">${t('compilers.lexer.widget.legendNum')}</span></span>
          <span><span class="token tok-op">${t('compilers.lexer.widget.legendOp')}</span></span>
          <span><span class="token tok-punct">${t('compilers.lexer.widget.legendPunct')}</span></span>
          <span><span class="token tok-str">${t('compilers.lexer.widget.legendStr')}</span></span>
        </div>
        <div class="widget-stage" id="lex-out" style="min-height:120px;"></div>
        <div class="callout" id="lex-count"></div>
      </div>
    `;

    const ta = root.querySelector('#lex-src');
    const out = root.querySelector('#lex-out');
    const count = root.querySelector('#lex-count');

    function update() {
      const toks = tokenize(ta.value);
      out.innerHTML = toks.map((tok) => {
        const cls = CLASS[tok.type] || '';
        const v = tok.value.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '\\n');
        return `<span class="token ${cls}" title="${tok.type}">${v}</span>`;
      }).join('') || `<em style="color:var(--ink-faint);">${t('compilers.lexer.widget.empty')}</em>`;
      const counts = {};
      toks.forEach((tok) => counts[tok.type] = (counts[tok.type] || 0) + 1);
      const summary = Object.entries(counts).map(([k, v]) => `${v} ${LABEL_KEY[k] ? t(LABEL_KEY[k]) : k.toLowerCase()}`).join(', ');
      count.innerHTML = t('compilers.lexer.widget.count', { n: toks.length, summary });
    }

    ta.addEventListener('input', update);
    root.querySelectorAll('[data-sample]').forEach((b) => b.addEventListener('click', () => {
      ta.value = SAMPLES[+b.dataset.sample];
      update();
    }));
    ta.value = SAMPLES[0];
    update();
  }

  render();
  window.addEventListener('i18n:changed', render);
}
