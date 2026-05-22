import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KEYWORDS = new Set(['let', 'const', 'if', 'else', 'while', 'return', 'function', 'true', 'false']);

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const len = src.length;
  while (i < len) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') {
      while (i < len && src[i] !== '\n') i++;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < len && /[a-zA-Z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      tokens.push({ type: KEYWORDS.has(word) ? 'KEYWORD' : 'IDENT', value: word, key: `${i}-${word}` });
      i = j; continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < len && /[0-9.]/.test(src[j])) j++;
      tokens.push({ type: 'NUMBER', value: src.slice(i, j), key: `${i}-n` });
      i = j; continue;
    }
    if (c === '"' || c === "'") {
      const quote = c;
      let j = i + 1;
      while (j < len && src[j] !== quote) j++;
      tokens.push({ type: 'STRING', value: src.slice(i, j + 1), key: `${i}-s` });
      i = j + 1; continue;
    }
    if ('+-*/=<>!&|'.includes(c)) {
      let j = i + 1;
      if (j < len && '=&|'.includes(src[j])) j++;
      tokens.push({ type: 'OP', value: src.slice(i, j), key: `${i}-o` });
      i = j; continue;
    }
    if ('(){}[];,.:'.includes(c)) {
      tokens.push({ type: 'PUNCT', value: c, key: `${i}-p` });
      i++; continue;
    }
    tokens.push({ type: 'UNKNOWN', value: c, key: `${i}-u` });
    i++;
  }
  return tokens;
}

const CLASS = { KEYWORD: 'tok-kw', IDENT: 'tok-id', NUMBER: 'tok-num', OP: 'tok-op', PUNCT: 'tok-punct', STRING: 'tok-str', UNKNOWN: '' };
const LABEL = { KEYWORD: 'keyword', IDENT: 'ident', NUMBER: 'number', OP: 'operator', PUNCT: 'punct', STRING: 'string' };

const SAMPLES = [
  `let x = 42;\nlet name = "Ada";\nif (x > 10) {\n  return x * 2;\n}`,
  `function add(a, b) {\n  return a + b;\n}\n// trailing comment`,
  `let pi = 3.14;\nlet ok = true && (x != 0);`,
];

export default function LexerWidget() {
  const [src, setSrc] = useState(SAMPLES[0]);
  const tokens = useMemo(() => tokenize(src), [src]);

  const counts = useMemo(() => {
    const c = {};
    tokens.forEach((t) => { c[t.type] = (c[t.type] || 0) + 1; });
    return c;
  }, [tokens]);

  return (
    <div className="widget">
      <div className="widget-title">Type source, get tokens</div>
      <div className="controls">
        {SAMPLES.map((s, i) => (
          <button key={i} className="btn" onClick={() => setSrc(s)}>Sample {i + 1}</button>
        ))}
      </div>
      <textarea
        value={src}
        onChange={(e) => setSrc(e.target.value)}
        spellCheck={false}
        style={{ width: '100%', minHeight: 120, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', padding: '0.7rem', border: '2px solid var(--ink)', borderRadius: 'var(--radius)', background: 'var(--paper-deep)', resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', margin: '0.8rem 0', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
        {Object.entries(LABEL).map(([t, l]) => (
          <span key={t}><span className={`token ${CLASS[t]}`}>{l}</span></span>
        ))}
      </div>
      <div className="widget-stage" style={{ minHeight: 120 }}>
        {tokens.length === 0 ? (
          <em style={{ color: 'var(--ink-faint)' }}>no tokens — try typing</em>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {tokens.map((t) => (
              <motion.span
                key={t.key}
                className={`token ${CLASS[t.type]}`}
                title={t.type}
                layout
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                {t.value.replace(/\n/g, '\\n')}
              </motion.span>
            ))}
          </AnimatePresence>
        )}
      </div>
      <div className="callout">
        <strong>{tokens.length}</strong> tokens
        {Object.keys(counts).length > 0 && (
          <> — {Object.entries(counts).map(([k, v]) => `${v} ${LABEL[k] ?? k.toLowerCase()}`).join(', ')}</>
        )}
      </div>
    </div>
  );
}
