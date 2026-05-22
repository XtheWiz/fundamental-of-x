import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EXAMPLES = [
  {
    name: 'assignment',
    code: 'let x = 1 + 2;',
    ast: { type: 'Let', name: 'x', value: { type: 'Bin', op: '+', left: { type: 'Num', value: 1 }, right: { type: 'Num', value: 2 } } },
  },
  {
    name: 'if/else',
    code: 'if (x > 0) { y = 1; } else { y = -1; }',
    ast: {
      type: 'If',
      cond: { type: 'Bin', op: '>', left: { type: 'Id', name: 'x' }, right: { type: 'Num', value: 0 } },
      then: { type: 'Assign', name: 'y', value: { type: 'Num', value: 1 } },
      else: { type: 'Assign', name: 'y', value: { type: 'Num', value: -1 } },
    },
  },
  {
    name: 'function call',
    code: 'print(add(2, 3));',
    ast: {
      type: 'Call', callee: 'print', args: [
        { type: 'Call', callee: 'add', args: [{ type: 'Num', value: 2 }, { type: 'Num', value: 3 }] },
      ],
    },
  },
  {
    name: 'while loop',
    code: 'while (i < n) { i = i + 1; }',
    ast: {
      type: 'While',
      cond: { type: 'Bin', op: '<', left: { type: 'Id', name: 'i' }, right: { type: 'Id', name: 'n' } },
      body: { type: 'Assign', name: 'i', value: { type: 'Bin', op: '+', left: { type: 'Id', name: 'i' }, right: { type: 'Num', value: 1 } } },
    },
  },
];

function childrenOf(n) {
  if (!n) return [];
  switch (n.type) {
    case 'Num': case 'Id': return [];
    case 'Bin': return [['left', n.left], ['right', n.right]];
    case 'Let': return [['value', n.value]];
    case 'Assign': return [['value', n.value]];
    case 'If': return [['cond', n.cond], ['then', n.then], ['else', n.else]];
    case 'While': return [['cond', n.cond], ['body', n.body]];
    case 'Call': return n.args.map((a, i) => [`arg${i}`, a]);
    default: return [];
  }
}

function nodeLabel(n) {
  switch (n.type) {
    case 'Num': return String(n.value);
    case 'Id': return n.name;
    case 'Bin': return n.op;
    case 'Let': return `let ${n.name}`;
    case 'Assign': return `${n.name} =`;
    case 'If': return 'if';
    case 'While': return 'while';
    case 'Call': return `${n.callee}()`;
    default: return n.type;
  }
}

function layout(node, depth = 0, pos = { x: 0 }, edgeLabel = '') {
  const kids = childrenOf(node);
  if (kids.length === 0) {
    const r = { node, x: pos.x, y: depth, edgeLabel, children: [] };
    pos.x += 1;
    return r;
  }
  const children = kids.map(([lbl, k]) => layout(k, depth + 1, pos, lbl));
  const xs = children.map((c) => c.x);
  return { node, x: (Math.min(...xs) + Math.max(...xs)) / 2, y: depth, edgeLabel, children };
}

function flat(n, arr = []) { arr.push(n); n.children.forEach((c) => flat(c, arr)); return arr; }

export default function AstWidget() {
  const [pick, setPick] = useState(0);
  const ex = EXAMPLES[pick];
  const laid = layout(ex.ast);
  const nodes = flat(laid);
  const maxX = Math.max(...nodes.map((n) => n.x));
  const maxY = Math.max(...nodes.map((n) => n.y));
  const W = Math.max(420, (maxX + 1) * 110);
  const H = (maxY + 1) * 80 + 30;
  const xs = (x) => 55 + x * 110;
  const ys = (y) => 30 + y * 80;

  return (
    <div className="widget">
      <div className="widget-title">Programs as trees</div>
      <div className="controls">
        {EXAMPLES.map((e, i) => (
          <button key={e.name} className="btn" onClick={() => setPick(i)}>{e.name}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.3rem' }}>Source</div>
          <pre className="code-block">{ex.code}</pre>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.3rem' }}>AST</div>
          <div className="widget-stage" style={{ minHeight: 200 }}>
            <AnimatePresence mode="wait">
              <motion.svg
                key={pick}
                viewBox={`0 0 ${W} ${H}`}
                width="100%"
                style={{ maxWidth: W }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {nodes.map((n, i) => n.children.map((c, j) => (
                  <motion.line
                    key={`e-${i}-${j}`}
                    x1={xs(n.x)} y1={ys(n.y) + 18} x2={xs(c.x)} y2={ys(c.y) - 18}
                    stroke="var(--ink)" strokeWidth={1.5}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.1 + c.y * 0.05, duration: 0.3 }}
                  />
                )))}
                {nodes.map((n, i) => n.children.map((c, j) => c.edgeLabel && (
                  <text
                    key={`l-${i}-${j}`}
                    x={(xs(n.x) + xs(c.x)) / 2 + 5}
                    y={(ys(n.y) + ys(c.y)) / 2}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-faint)' }}
                  >
                    {c.edgeLabel}
                  </text>
                )))}
                {nodes.map((n, i) => {
                  const label = nodeLabel(n.node);
                  const isLeaf = n.children.length === 0;
                  const w = Math.max(50, label.length * 8 + 16);
                  return (
                    <motion.g
                      key={`n-${i}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: n.y * 0.08, type: 'spring', stiffness: 280, damping: 22 }}
                    >
                      <rect x={xs(n.x) - w / 2} y={ys(n.y) - 18} width={w} height={36} rx={6}
                        fill={isLeaf ? 'var(--paper)' : 'var(--accent-soft)'} stroke="var(--ink)" strokeWidth={2}
                      />
                      <text x={xs(n.x)} y={ys(n.y) + 5} textAnchor="middle"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>
                        {label}
                      </text>
                    </motion.g>
                  );
                })}
              </motion.svg>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="callout">
        <strong>{ex.name}.</strong> Note: there are no semicolons, no parens, no braces in the tree — those existed only in the source text to disambiguate. The AST is pure meaning.
      </div>
    </div>
  );
}
