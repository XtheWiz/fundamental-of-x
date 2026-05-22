// Optimization widget: apply passes one at a time to a small IR.

// Each "instruction" is { dst, op, args: [strings] } where args are operands.
// op === 'mov' means dst = args[0] (a single value, no operator).
// args can be number literals (digits) or names.

const PROGRAM = [
  { dst: 'a', op: 'mov', args: ['10'] },
  { dst: 'b', op: 'mov', args: ['20'] },
  { dst: 'c', op: '+',   args: ['a', 'b'] },
  { dst: 'd', op: '+',   args: ['a', 'b'] },
  { dst: 'e', op: '*',   args: ['c', '2'] },
  { dst: 'f', op: '*',   args: ['c', '2'] },
  { dst: 'g', op: 'mov', args: ['99'] },  // unused
  { dst: 'out', op: '+', args: ['e', 'f'] },
];

const USED_OUTPUTS = new Set(['out']);

function isNum(s) { return /^-?\d+(\.\d+)?$/.test(s); }

function compute(op, a, b) {
  const x = +a, y = +b;
  switch (op) {
    case '+': return x + y;
    case '-': return x - y;
    case '*': return x * y;
    case '/': return x / y;
  }
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
  const seen = new Map(); // signature -> dst
  const out = [];
  const alias = new Map();
  for (const ins of prog) {
    const resolved = ins.args.map((a) => alias.get(a) || a);
    if (ins.op === 'mov') {
      out.push({ ...ins, args: resolved });
      continue;
    }
    const sig = ins.op + '(' + resolved.join(',') + ')';
    if (seen.has(sig)) {
      alias.set(ins.dst, seen.get(sig));
      // drop this instruction
    } else {
      seen.set(sig, ins.dst);
      out.push({ ...ins, args: resolved });
    }
  }
  return out;
}

function dce(prog) {
  // Walk backwards. An instruction is live if its dst is live downstream.
  const live = new Set(USED_OUTPUTS);
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
  return prog.map((ins) => {
    if (ins.op === 'mov') return `${ins.dst} = ${ins.args[0]}`;
    return `${ins.dst} = ${ins.args[0]} ${ins.op} ${ins.args[1]}`;
  });
}

function diff(before, after) {
  // Mark each "after" line as "new/unchanged"; "before" lines missing in "after" as "removed".
  const beforeStrs = fmt(before);
  const afterStrs = fmt(after);
  return { beforeStrs, afterStrs };
}

const PASSES = [
  { name: 'Constant fold', fn: constantFold, note: '<code>a = 10; b = 20; c = a + b</code> — but <code>a</code> and <code>b</code> are constants. Replace propagated arithmetic with literals.' },
  { name: 'CSE',            fn: cse,         note: '<code>c = a + b</code> and <code>d = a + b</code> compute the same thing. Keep the first, replace later uses of <code>d</code> with <code>c</code>.' },
  { name: 'DCE',            fn: dce,         note: 'Walk backwards. <code>g = 99</code> is never read. <code>d = a + b</code> was eliminated by CSE already. Anything not feeding <code>out</code> is dead.' },
];

export function initOptWidget(root) {
  let current = JSON.parse(JSON.stringify(PROGRAM));
  let appliedIdx = -1;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Apply passes step by step</div>
      <div class="controls">
        <button class="btn" id="op-reset">Reset</button>
        <button class="btn" id="op-step">Apply next pass</button>
        <button class="btn" id="op-all">Apply all</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem;">
        <div>
          <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--ink-soft);margin-bottom:0.3rem;">Original</div>
          <pre class="code-block" id="op-orig" style="margin:0;"></pre>
        </div>
        <div>
          <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--ink-soft);margin-bottom:0.3rem;" id="op-cur-label">Current</div>
          <pre class="code-block" id="op-cur" style="margin:0;"></pre>
        </div>
      </div>
      <div class="callout" id="op-explain"></div>
    </div>
  `;

  function render() {
    root.querySelector('#op-orig').textContent = fmt(PROGRAM).join('\n');
    root.querySelector('#op-cur').textContent = fmt(current).join('\n');
    const label = appliedIdx < 0 ? 'Current (no passes applied)' :
      `After: ${PASSES.slice(0, appliedIdx + 1).map((p) => p.name).join(' → ')}`;
    root.querySelector('#op-cur-label').textContent = label;
    const next = PASSES[appliedIdx + 1];
    let exp = '';
    if (appliedIdx < 0) {
      exp = `8 instructions, but most are redundant. <strong>Click "Apply next pass"</strong> to start with constant folding.`;
    } else if (appliedIdx === PASSES.length - 1) {
      exp = `<strong>Done.</strong> Started at 8 instructions, ended at ${current.length}. The compiler's optimizer would keep going (LICM, inlining, vectorization...) but the pattern is the same: spot redundancy, rewrite it away.`;
    } else {
      exp = `Just applied <strong>${PASSES[appliedIdx].name}</strong>. ${PASSES[appliedIdx].note} Next pass: <strong>${next.name}</strong>.`;
    }
    root.querySelector('#op-explain').innerHTML = exp;
    root.querySelector('#op-step').disabled = appliedIdx >= PASSES.length - 1;
    root.querySelector('#op-all').disabled = appliedIdx >= PASSES.length - 1;
  }

  root.querySelector('#op-reset').addEventListener('click', () => {
    current = JSON.parse(JSON.stringify(PROGRAM));
    appliedIdx = -1;
    render();
  });
  root.querySelector('#op-step').addEventListener('click', () => {
    if (appliedIdx < PASSES.length - 1) {
      appliedIdx++;
      current = PASSES[appliedIdx].fn(current);
      render();
    }
  });
  root.querySelector('#op-all').addEventListener('click', () => {
    while (appliedIdx < PASSES.length - 1) {
      appliedIdx++;
      current = PASSES[appliedIdx].fn(current);
    }
    render();
  });

  render();
}
