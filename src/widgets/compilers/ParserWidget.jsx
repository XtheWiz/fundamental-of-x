import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
const RIGHT_ASSOC = new Set(['^']);

function tokenize(s) {
  const toks = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      toks.push({ type: 'NUM', value: s.slice(i, j) });
      i = j; continue;
    }
    if ('+-*/^()'.includes(c)) {
      toks.push({ type: c === '(' || c === ')' ? c : 'OP', value: c });
      i++; continue;
    }
    throw new Error(`unexpected '${c}'`);
  }
  return toks;
}

function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  function parsePrimary() {
    const t = next();
    if (!t) throw new Error('unexpected end');
    if (t.type === 'NUM') return { type: 'Num', value: +t.value };
    if (t.type === '(') {
      const e = parseExpr(0);
      const r = next();
      if (!r || r.type !== ')') throw new Error('expected )');
      return e;
    }
    if (t.type === 'OP' && (t.value === '-' || t.value === '+')) {
      return { type: 'Unary', op: t.value, right: parsePrimary() };
    }
    throw new Error(`unexpected ${t.value}`);
  }
  function parseExpr(minPrec) {
    let left = parsePrimary();
    while (peek() && peek().type === 'OP' && PRECEDENCE[peek().value] >= minPrec) {
      const op = next().value;
      const prec = PRECEDENCE[op];
      const right = parseExpr(RIGHT_ASSOC.has(op) ? prec : prec + 1);
      left = { type: 'Bin', op, left, right };
    }
    return left;
  }
  const r = parseExpr(0);
  if (peek()) throw new Error(`extra ${peek().value}`);
  return r;
}

function nodeLabel(n) {
  if (n.type === 'Num') return String(n.value);
  if (n.type === 'Unary') return `${n.op} (unary)`;
  return n.op;
}

function layout(node, depth = 0, pos = { x: 0 }) {
  if (!node.left && !node.right) {
    const r = { node, x: pos.x, y: depth, children: [] };
    pos.x += 1;
    return r;
  }
  const children = [];
  if (node.left) children.push(layout(node.left, depth + 1, pos));
  if (node.right) children.push(layout(node.right, depth + 1, pos));
  const xs = children.map((c) => c.x);
  return { node, x: (Math.min(...xs) + Math.max(...xs)) / 2, y: depth, children };
}

function flatten(n, arr = []) { arr.push(n); n.children.forEach((c) => flatten(c, arr)); return arr; }

const EXAMPLES = ['1 + 2 * 3', '(1 + 2) * 3', '2 ^ 3 ^ 2', '-5 + 3 * (4 - 1)'];

export default function ParserWidget() {
  const [expr, setExpr] = useState('1 + 2 * 3');
  const parsed = useMemo(() => {
    try { return { ok: true, tree: parse(tokenize(expr)) }; }
    catch (e) { return { ok: false, error: e.message }; }
  }, [expr]);

  let nodes = [], W = 400, H = 240, maxY = 0;
  if (parsed.ok) {
    const laid = layout(parsed.tree, 0, { x: 0 });
    nodes = flatten(laid);
    const maxX = Math.max(...nodes.map((n) => n.x));
    maxY = Math.max(...nodes.map((n) => n.y));
    W = Math.max(380, (maxX + 1) * 80);
    H = (maxY + 1) * 80 + 30;
  }
  const xs = (x) => 40 + x * 80;
  const ys = (y) => 30 + y * 80;

  return (
    <div className="widget">
      <div className="widget-title">Build a parse tree</div>
      <div className="controls">
        <input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          style={{ flex: 1, minWidth: 200, fontFamily: 'var(--font-mono)', fontSize: '0.95rem', padding: '0.45em 0.7em', border: '2px solid var(--ink)', borderRadius: 'var(--radius)', background: 'var(--paper-deep)' }}
        />
        {EXAMPLES.map((ex) => (
          <button key={ex} className="btn" onClick={() => setExpr(ex)}>
            {ex.length > 10 ? 'complex' : ex.replace(/\s/g, '')}
          </button>
        ))}
      </div>
      <div className="widget-stage" style={{ minHeight: 240 }}>
        {parsed.ok ? (
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
            {nodes.map((n, i) => n.children.map((c, j) => (
              <motion.line
                key={`e-${i}-${j}`}
                x1={xs(n.x)} y1={ys(n.y)} x2={xs(c.x)} y2={ys(c.y)}
                stroke="var(--ink)" strokeWidth={1.8}
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }}
              />
            )))}
            {nodes.map((n, i) => (
              <motion.g
                key={`n-${i}-${nodeLabel(n.node)}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: n.y * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
              >
                <circle cx={xs(n.x)} cy={ys(n.y)} r={20}
                  fill={n.node.type === 'Num' ? 'var(--paper)' : 'var(--accent-soft)'}
                  stroke="var(--ink)" strokeWidth={2}
                />
                <text x={xs(n.x)} y={ys(n.y) + 5} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>
                  {nodeLabel(n.node)}
                </text>
              </motion.g>
            ))}
          </svg>
        ) : (
          <div style={{ padding: '1rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            Parse error: {parsed.error}
          </div>
        )}
      </div>
      <div className="callout">
        {parsed.ok
          ? <><strong>Parsed.</strong> Operator precedence and parentheses determined the tree shape. Tree depth = {maxY + 1} levels.</>
          : <>Fix the expression to see the tree.</>}
      </div>
    </div>
  );
}
