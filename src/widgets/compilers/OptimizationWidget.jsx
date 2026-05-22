import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PROGRAM = [
  { dst: 'a', op: 'mov', args: ['10'] },
  { dst: 'b', op: 'mov', args: ['20'] },
  { dst: 'c', op: '+',   args: ['a', 'b'] },
  { dst: 'd', op: '+',   args: ['a', 'b'] },
  { dst: 'e', op: '*',   args: ['c', '2'] },
  { dst: 'f', op: '*',   args: ['c', '2'] },
  { dst: 'g', op: 'mov', args: ['99'] },
  { dst: 'out', op: '+', args: ['e', 'f'] },
];
const USED = new Set(['out']);
const isNum = (s) => /^-?\d+(\.\d+)?$/.test(s);

function compute(op, a, b) {
  const x = +a, y = +b;
  switch (op) { case '+': return x + y; case '-': return x - y; case '*': return x * y; case '/': return x / y; }
  return null;
}

function constantFold(prog) {
  return prog.map((ins) => {
    if (ins.op === 'mov') return ins;
    if (ins.args.length === 2 && ins.args.every(isNum)) {
      const v = compute(ins.op, ins.args[0], ins.args[1]);
      if (v !== null) return { dst: ins.dst, op: 'mov', args: [String(v)] };
    }
    return ins;
  });
}

function cse(prog) {
  const seen = new Map();
  const out = [];
  const alias = new Map();
  for (const ins of prog) {
    const resolved = ins.args.map((a) => alias.get(a) || a);
    if (ins.op === 'mov') { out.push({ ...ins, args: resolved }); continue; }
    const sig = ins.op + '(' + resolved.join(',') + ')';
    if (seen.has(sig)) alias.set(ins.dst, seen.get(sig));
    else { seen.set(sig, ins.dst); out.push({ ...ins, args: resolved }); }
  }
  return out;
}

function dce(prog) {
  const live = new Set(USED);
  const keep = new Array(prog.length).fill(false);
  for (let i = prog.length - 1; i >= 0; i--) {
    if (live.has(prog[i].dst)) {
      keep[i] = true;
      prog[i].args.forEach((a) => { if (!isNum(a)) live.add(a); });
    }
  }
  return prog.filter((_, i) => keep[i]);
}

function fmt(prog) {
  return prog.map((ins) =>
    ins.op === 'mov' ? `${ins.dst} = ${ins.args[0]}` : `${ins.dst} = ${ins.args[0]} ${ins.op} ${ins.args[1]}`
  );
}

const PASSES = [
  { name: 'Constant fold', fn: constantFold, note: '<code>a = 10; b = 20; c = a + b</code> — but <code>a</code> and <code>b</code> are constants. Replace propagated arithmetic with literals.' },
  { name: 'CSE',            fn: cse,         note: '<code>c = a + b</code> and <code>d = a + b</code> compute the same thing. Keep the first, replace later uses of <code>d</code> with <code>c</code>.' },
  { name: 'DCE',            fn: dce,         note: 'Walk backwards. <code>g = 99</code> is never read. <code>d = a + b</code> was eliminated by CSE already. Anything not feeding <code>out</code> is dead.' },
];

export default function OptimizationWidget() {
  const [current, setCurrent] = useState(PROGRAM);
  const [appliedIdx, setAppliedIdx] = useState(-1);

  const reset = () => { setCurrent(PROGRAM); setAppliedIdx(-1); };
  const step = () => {
    if (appliedIdx >= PASSES.length - 1) return;
    const next = appliedIdx + 1;
    setCurrent((c) => PASSES[next].fn(c));
    setAppliedIdx(next);
  };
  const all = () => {
    let c = current; let idx = appliedIdx;
    while (idx < PASSES.length - 1) { idx++; c = PASSES[idx].fn(c); }
    setCurrent(c); setAppliedIdx(idx);
  };

  const label = appliedIdx < 0
    ? 'Current (no passes applied)'
    : `After: ${PASSES.slice(0, appliedIdx + 1).map((p) => p.name).join(' → ')}`;

  const next = PASSES[appliedIdx + 1];
  let exp;
  if (appliedIdx < 0) exp = <>8 instructions, but most are redundant. <strong>Click "Apply next pass"</strong> to start with constant folding.</>;
  else if (appliedIdx === PASSES.length - 1) exp = <><strong>Done.</strong> Started at 8 instructions, ended at {current.length}. The compiler's optimizer would keep going (LICM, inlining, vectorization...) but the pattern is the same: spot redundancy, rewrite it away.</>;
  else exp = <>Just applied <strong>{PASSES[appliedIdx].name}</strong>. <span dangerouslySetInnerHTML={{ __html: PASSES[appliedIdx].note }} /> Next pass: <strong>{next.name}</strong>.</>;

  return (
    <div className="widget">
      <div className="widget-title">Apply passes step by step</div>
      <div className="controls">
        <button className="btn" onClick={reset}>Reset</button>
        <button className="btn" onClick={step} disabled={appliedIdx >= PASSES.length - 1}>Apply next pass</button>
        <button className="btn" onClick={all} disabled={appliedIdx >= PASSES.length - 1}>Apply all</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.3rem' }}>Original</div>
          <pre className="code-block" style={{ margin: 0 }}>{fmt(PROGRAM).join('\n')}</pre>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.3rem' }}>{label}</div>
          <pre className="code-block" style={{ margin: 0 }}>
            <AnimatePresence mode="popLayout">
              {fmt(current).map((line, i) => (
                <motion.div
                  key={`${appliedIdx}-${i}-${line}`}
                  layout
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12, height: 0, marginTop: 0, marginBottom: 0 }}
                  transition={{ duration: 0.22 }}
                >{line}</motion.div>
              ))}
            </AnimatePresence>
          </pre>
        </div>
      </div>
      <div className="callout">{exp}</div>
    </div>
  );
}
