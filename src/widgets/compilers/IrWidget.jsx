import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PROGRAMS = [
  {
    name: 'expression',
    source: `result = (x + 2) * (x - 1)`,
    ir: ['t1 = x + 2', 't2 = x - 1', 't3 = t1 * t2', 'result = t3'],
    ssa: ['t1_1 = x_1 + 2', 't2_1 = x_1 - 1', 't3_1 = t1_1 * t2_1', 'result_1 = t3_1'],
  },
  {
    name: 'reassignment',
    source: `x = 1\nx = x + 5\ny = x * 2`,
    ir: ['x = 1', 'x = x + 5', 'y = x * 2'],
    ssa: ['x_1 = 1', 'x_2 = x_1 + 5', 'y_1 = x_2 * 2'],
  },
  {
    name: 'if/else (phi)',
    source: `if (c) {\n  x = 1\n} else {\n  x = 2\n}\ny = x + 10`,
    ir: ['if c goto L1', 'goto L2', 'L1: x = 1', '    goto L3', 'L2: x = 2', 'L3: y = x + 10'],
    ssa: ['if c_1 goto L1', 'goto L2', 'L1: x_1 = 1', '    goto L3', 'L2: x_2 = 2', 'L3: x_3 = phi(x_1 from L1, x_2 from L2)', '    y_1 = x_3 + 10'],
  },
];

function colorize(line) {
  return line
    .replace(/\b(if|goto|phi|from)\b/g, '<span style="color:#a64ca6;font-weight:600;">$1</span>')
    .replace(/\b([a-z_]+_\d+)\b/g, '<span style="background:var(--accent-soft);padding:0 0.2em;border-radius:2px;">$1</span>')
    .replace(/(L\d+):/g, '<span style="color:#2b6cb0;font-weight:600;">$1:</span>');
}

const STAGES = ['Source', '3-address IR', 'SSA'];

export default function IrWidget() {
  const [pick, setPick] = useState(0);
  const [stage, setStage] = useState(0);
  const p = PROGRAMS[pick];
  const text = stage === 0 ? p.source : (stage === 1 ? p.ir.join('\n') : p.ssa.join('\n'));
  const html = stage === 0 ? text : text.split('\n').map(colorize).join('<br>');

  let exp;
  if (stage === 0) exp = <>The source as you wrote it. Nested expressions, control flow blocks.</>;
  else if (stage === 1) exp = <><strong>Three-address code.</strong> Each instruction has at most one operator. Sub-expressions are named (<code>t1</code>, <code>t2</code>). Control flow becomes labels and gotos.</>;
  else if (pick === 2) exp = <><strong>SSA with phi nodes.</strong> The two branches each define <code>x</code>; SSA renames them <code>x_1</code> and <code>x_2</code>, then uses a <code>phi</code> at the join point to merge them. The optimizer can now reason about each definition independently.</>;
  else exp = <><strong>SSA.</strong> Every variable is defined exactly once. Reassignment creates a new version (<code>x_1</code>, <code>x_2</code>...). Dataflow analysis becomes trivial — there's nothing to chase.</>;

  return (
    <div className="widget">
      <div className="widget-title">Source → IR → SSA</div>
      <div className="controls">
        {PROGRAMS.map((pr, i) => (
          <button key={pr.name} className="btn" onClick={() => setPick(i)}>{pr.name}</button>
        ))}
      </div>
      <div className="controls" style={{ marginTop: '0.3rem' }}>
        {STAGES.map((s, i) => (
          <button key={s} className="btn" onClick={() => setStage(i)}>{s}</button>
        ))}
      </div>
      <div className="widget-stage" style={{ minHeight: 200 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
          {STAGES[stage]}
        </div>
        <AnimatePresence mode="wait">
          <motion.pre
            key={`${pick}-${stage}`}
            className="code-block"
            style={{ margin: 0 }}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            dangerouslySetInnerHTML={{ __html: stage === 0 ? text : html }}
          />
        </AnimatePresence>
      </div>
      <div className="callout">{exp}</div>
    </div>
  );
}
