// IR widget: pick a small program, see Source → 3-address IR → SSA.

const PROGRAMS = [
  {
    name: 'expression',
    source: `result = (x + 2) * (x - 1)`,
    ir: [
      't1 = x + 2',
      't2 = x - 1',
      't3 = t1 * t2',
      'result = t3',
    ],
    ssa: [
      't1_1 = x_1 + 2',
      't2_1 = x_1 - 1',
      't3_1 = t1_1 * t2_1',
      'result_1 = t3_1',
    ],
  },
  {
    name: 'reassignment',
    source: `x = 1
x = x + 5
y = x * 2`,
    ir: [
      'x = 1',
      'x = x + 5',
      'y = x * 2',
    ],
    ssa: [
      'x_1 = 1',
      'x_2 = x_1 + 5',
      'y_1 = x_2 * 2',
    ],
  },
  {
    name: 'if/else (phi)',
    source: `if (c) {
  x = 1
} else {
  x = 2
}
y = x + 10`,
    ir: [
      'if c goto L1',
      'goto L2',
      'L1: x = 1',
      '    goto L3',
      'L2: x = 2',
      'L3: y = x + 10',
    ],
    ssa: [
      'if c_1 goto L1',
      'goto L2',
      'L1: x_1 = 1',
      '    goto L3',
      'L2: x_2 = 2',
      'L3: x_3 = phi(x_1 from L1, x_2 from L2)',
      '    y_1 = x_3 + 10',
    ],
  },
];

export function initIrWidget(root) {
  let pick = 0;
  let stage = 0; // 0=src, 1=ir, 2=ssa

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Source → IR → SSA</div>
      <div class="controls">
        ${PROGRAMS.map((p, i) => `<button class="btn" data-i="${i}">${p.name}</button>`).join('')}
      </div>
      <div class="controls" style="margin-top:0.3rem;">
        <button class="btn" data-s="0">Source</button>
        <button class="btn" data-s="1">3-Address IR</button>
        <button class="btn" data-s="2">SSA</button>
      </div>
      <div class="widget-stage" id="ir-stage" style="min-height:200px;"></div>
      <div class="callout" id="ir-explain"></div>
    </div>
  `;

  function colorize(line) {
    return line
      .replace(/\b(if|goto|phi|from)\b/g, '<span style="color:#a64ca6;font-weight:600;">$1</span>')
      .replace(/\b([a-z_]+_\d+)\b/g, '<span style="background:var(--accent-soft);padding:0 0.2em;border-radius:2px;">$1</span>')
      .replace(/(L\d+):/g, '<span style="color:#2b6cb0;font-weight:600;">$1:</span>');
  }

  function render() {
    const p = PROGRAMS[pick];
    const text = stage === 0 ? p.source : (stage === 1 ? p.ir.join('\n') : p.ssa.join('\n'));
    const html = stage === 0 ? text : text.split('\n').map(colorize).join('<br>');
    const stageNames = ['Source', '3-address IR', 'SSA'];
    root.querySelector('#ir-stage').innerHTML = `
      <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--ink-soft);margin-bottom:0.4rem;">${stageNames[stage]}</div>
      <pre class="code-block" style="margin:0;">${html}</pre>
    `;
    let exp = '';
    if (stage === 0) exp = `The source as you wrote it. Nested expressions, control flow blocks.`;
    if (stage === 1) exp = `<strong>Three-address code.</strong> Each instruction has at most one operator. Sub-expressions are named (<code>t1</code>, <code>t2</code>). Control flow becomes labels and gotos.`;
    if (stage === 2) {
      if (pick === 2) exp = `<strong>SSA with phi nodes.</strong> The two branches each define <code>x</code>; SSA renames them <code>x_1</code> and <code>x_2</code>, then uses a <code>phi</code> at the join point to merge them. The optimizer can now reason about each definition independently.`;
      else exp = `<strong>SSA.</strong> Every variable is defined exactly once. Reassignment creates a new version (<code>x_1</code>, <code>x_2</code>...). Dataflow analysis becomes trivial — there's nothing to chase.`;
    }
    root.querySelector('#ir-explain').innerHTML = exp;
  }

  root.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { pick = +b.dataset.i; render(); }));
  root.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { stage = +b.dataset.s; render(); }));
  render();
}
