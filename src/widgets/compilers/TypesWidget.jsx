import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SCENARIOS = [
  { code: '1 + 2',         ast: { t: 'Bin', op: '+', l: { t: 'I', v: 1 }, r: { t: 'I', v: 2 } } },
  { code: '1 + 2.0',       ast: { t: 'Bin', op: '+', l: { t: 'I', v: 1 }, r: { t: 'F', v: 2.0 } } },
  { code: '"hi" + 1',      ast: { t: 'Bin', op: '+', l: { t: 'S', v: 'hi' }, r: { t: 'I', v: 1 } } },
  { code: 'true && false', ast: { t: 'Bin', op: '&&', l: { t: 'B', v: true }, r: { t: 'B', v: false } } },
  { code: '1 > 2',         ast: { t: 'Bin', op: '>', l: { t: 'I', v: 1 }, r: { t: 'I', v: 2 } } },
  { code: 'true + 1',      ast: { t: 'Bin', op: '+', l: { t: 'B', v: true }, r: { t: 'I', v: 1 } } },
];

function check(n) {
  if (n.t === 'I') return { type: 'int' };
  if (n.t === 'F') return { type: 'float' };
  if (n.t === 'S') return { type: 'string' };
  if (n.t === 'B') return { type: 'bool' };
  if (n.t === 'Bin') {
    const lt = check(n.l), rt = check(n.r);
    if (lt.error) return lt;
    if (rt.error) return rt;
    const a = lt.type, b = rt.type;
    if (['+', '-', '*', '/'].includes(n.op)) {
      if (a === 'int' && b === 'int') return { type: 'int' };
      if ((a === 'int' || a === 'float') && (b === 'int' || b === 'float')) return { type: 'float', coerced: true };
      if (n.op === '+' && a === 'string' && b === 'string') return { type: 'string' };
      return { error: `cannot apply '${n.op}' to ${a} and ${b}` };
    }
    if (['<', '>', '<=', '>=', '==', '!='].includes(n.op)) {
      if (a === b || (a === 'int' && b === 'float') || (a === 'float' && b === 'int')) return { type: 'bool' };
      return { error: `cannot compare ${a} with ${b}` };
    }
    if (['&&', '||'].includes(n.op)) {
      if (a === 'bool' && b === 'bool') return { type: 'bool' };
      return { error: `'${n.op}' wants bool, got ${a} and ${b}` };
    }
    return { error: `unknown op ${n.op}` };
  }
  return { error: 'unknown node' };
}

function nodeLabel(n) {
  if (n.t === 'I' || n.t === 'F') return String(n.v);
  if (n.t === 'S') return `"${n.v}"`;
  if (n.t === 'B') return String(n.v);
  return n.op;
}

function annotate(n) {
  if (n.t === 'Bin') return { node: n, info: check(n), children: [annotate(n.l), annotate(n.r)] };
  return { node: n, info: check(n), children: [] };
}

function layout(an, depth = 0, pos = { x: 0 }) {
  if (an.children.length === 0) {
    const r = { ...an, x: pos.x, y: depth };
    pos.x += 1;
    return r;
  }
  const kids = an.children.map((c) => layout(c, depth + 1, pos));
  const xs = kids.map((c) => c.x);
  return { ...an, x: (Math.min(...xs) + Math.max(...xs)) / 2, y: depth, children: kids };
}

function flat(n, arr = []) { arr.push(n); n.children.forEach((c) => flat(c, arr)); return arr; }

const TYPE_COLOR = { int: '#d9ead3', float: '#cfe2f3', bool: '#fff2cc', string: '#c9daf8' };

export default function TypesWidget() {
  const [pick, setPick] = useState(0);
  const sc = SCENARIOS[pick];
  const ann = annotate(sc.ast);
  const laid = layout(ann);
  const nodes = flat(laid);
  const maxX = Math.max(...nodes.map((n) => n.x));
  const maxY = Math.max(...nodes.map((n) => n.y));
  const W = Math.max(420, (maxX + 1) * 130);
  const H = (maxY + 1) * 90 + 30;
  const xs = (x) => 65 + x * 130;
  const ys = (y) => 35 + y * 90;
  const top = ann.info;

  return (
    <div className="widget">
      <div className="widget-title">Walk the AST, attach types</div>
      <div className="controls">
        {SCENARIOS.map((s, i) => (
          <button key={s.code} className="btn" onClick={() => setPick(i)}>{s.code}</button>
        ))}
      </div>
      <div className="widget-stage" style={{ minHeight: 240 }}>
        <AnimatePresence mode="wait">
          <motion.svg
            key={pick}
            viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          >
            {nodes.map((n, i) => n.children.map((c, j) => (
              <line key={`e-${i}-${j}`}
                x1={xs(n.x)} y1={ys(n.y) + 22} x2={xs(c.x)} y2={ys(c.y) - 22}
                stroke="var(--ink)" strokeWidth={1.5} />
            )))}
            {nodes.map((n, i) => {
              const label = nodeLabel(n.node);
              const err = n.info.error;
              const fill = err ? '#f4cccc' : (TYPE_COLOR[n.info.type] || 'var(--paper)');
              const w = Math.max(55, label.length * 9 + 16);
              // Bottom-up reveal: leaves first, then operators.
              const delay = (maxY - n.y) * 0.15;
              return (
                <motion.g
                  key={`n-${i}`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay, type: 'spring', stiffness: 260, damping: 22 }}
                >
                  <rect x={xs(n.x) - w / 2} y={ys(n.y) - 22} width={w} height={44} rx={6}
                    fill={fill} stroke="var(--ink)" strokeWidth={2} />
                  <text x={xs(n.x)} y={ys(n.y) - 3} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{label}</text>
                  <text x={xs(n.x)} y={ys(n.y) + 14} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: err ? 'var(--accent)' : 'var(--ink-soft)' }}>
                    {err ? '⚠ error' : ':' + n.info.type + (n.info.coerced ? '*' : '')}
                  </text>
                </motion.g>
              );
            })}
          </motion.svg>
        </AnimatePresence>
      </div>
      <div className="callout">
        {top.error
          ? <><strong>Type error.</strong> <code style={{ color: 'var(--accent)' }}>{top.error}</code> — the compiler refuses to emit code for this expression.</>
          : top.coerced
            ? <><strong>Inferred type: {top.type}</strong> (with an implicit int→float coercion). The starred type is where the compiler inserted a conversion.</>
            : <><strong>Inferred type: {top.type}.</strong> Each node's type was computed from its children — no annotations needed.</>}
      </div>
    </div>
  );
}
