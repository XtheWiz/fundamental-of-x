// AST widget: show several canned programs as ASTs.

const EXAMPLES = [
  {
    name: 'assignment',
    code: 'let x = 1 + 2;',
    ast: {
      type: 'Let', name: 'x',
      value: { type: 'Bin', op: '+', left: { type: 'Num', value: 1 }, right: { type: 'Num', value: 2 } }
    }
  },
  {
    name: 'if/else',
    code: 'if (x > 0) { y = 1; } else { y = -1; }',
    ast: {
      type: 'If',
      cond: { type: 'Bin', op: '>', left: { type: 'Id', name: 'x' }, right: { type: 'Num', value: 0 } },
      then: { type: 'Assign', name: 'y', value: { type: 'Num', value: 1 } },
      else: { type: 'Assign', name: 'y', value: { type: 'Num', value: -1 } }
    }
  },
  {
    name: 'function call',
    code: 'print(add(2, 3));',
    ast: {
      type: 'Call', callee: 'print', args: [
        { type: 'Call', callee: 'add', args: [{ type: 'Num', value: 2 }, { type: 'Num', value: 3 }] }
      ]
    }
  },
  {
    name: 'while loop',
    code: 'while (i < n) { i = i + 1; }',
    ast: {
      type: 'While',
      cond: { type: 'Bin', op: '<', left: { type: 'Id', name: 'i' }, right: { type: 'Id', name: 'n' } },
      body: {
        type: 'Assign', name: 'i',
        value: { type: 'Bin', op: '+', left: { type: 'Id', name: 'i' }, right: { type: 'Num', value: 1 } }
      }
    }
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

function flatten(n, arr = []) { arr.push(n); n.children.forEach((c) => flatten(c, arr)); return arr; }

export function initAstWidget(root) {
  let pick = 0;
  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Programs as trees</div>
      <div class="controls" id="ast-picks">
        ${EXAMPLES.map((e, i) => `<button class="btn" data-i="${i}">${e.name}</button>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr;gap:1rem;">
        <div>
          <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--ink-soft);margin-bottom:0.3rem;">Source</div>
          <pre class="code-block" id="ast-src"></pre>
        </div>
        <div>
          <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--ink-soft);margin-bottom:0.3rem;">AST</div>
          <div class="widget-stage" id="ast-stage" style="min-height:200px;"></div>
        </div>
      </div>
      <div class="callout" id="ast-explain"></div>
    </div>
  `;

  function render() {
    const ex = EXAMPLES[pick];
    root.querySelector('#ast-src').textContent = ex.code;
    const laid = layout(ex.ast);
    const nodes = flatten(laid);
    const maxX = Math.max(...nodes.map((n) => n.x));
    const maxY = Math.max(...nodes.map((n) => n.y));
    const W = Math.max(420, (maxX + 1) * 110);
    const H = (maxY + 1) * 80 + 30;
    const xs = (x) => 55 + x * 110;
    const ys = (y) => 30 + y * 80;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    nodes.forEach((n) => n.children.forEach((c) => {
      svg += `<line x1="${xs(n.x)}" y1="${ys(n.y)+18}" x2="${xs(c.x)}" y2="${ys(c.y)-18}" stroke="var(--ink)" stroke-width="1.5"/>`;
      if (c.edgeLabel) svg += `<text x="${(xs(n.x)+xs(c.x))/2 + 5}" y="${(ys(n.y)+ys(c.y))/2}" style="font-family:var(--font-mono);font-size:10px;fill:var(--ink-faint);">${c.edgeLabel}</text>`;
    }));
    nodes.forEach((n) => {
      const label = nodeLabel(n.node);
      const isLeaf = n.children.length === 0;
      const w = Math.max(50, label.length * 8 + 16);
      svg += `<rect x="${xs(n.x)-w/2}" y="${ys(n.y)-18}" width="${w}" height="36" rx="6" fill="${isLeaf ? 'var(--paper)' : 'var(--accent-soft)'}" stroke="var(--ink)" stroke-width="2"/>`;
      svg += `<text x="${xs(n.x)}" y="${ys(n.y)+5}" text-anchor="middle" style="font-family:var(--font-mono);font-size:12px;font-weight:600;">${label.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`;
    });
    svg += `</svg>`;
    root.querySelector('#ast-stage').innerHTML = svg;
    root.querySelector('#ast-explain').innerHTML = `<strong>${ex.name}.</strong> Note: there are no semicolons, no parens, no <code>{}</code> in the tree — those existed only in the source text to disambiguate. The AST is pure meaning.`;
  }

  root.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { pick = +b.dataset.i; render(); }));
  render();
}
