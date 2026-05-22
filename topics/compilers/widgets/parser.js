// Parser widget: enter an expression, see the parse tree built with precedence.

// Pratt parser for + - * / ^ with parens.
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
  function peek() { return tokens[pos]; }
  function next() { return tokens[pos++]; }
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
      const r = parsePrimary();
      return { type: 'Unary', op: t.value, right: r };
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
  if (n.type === 'Unary') return n.op + ' (unary)';
  return n.op;
}

function layout(node, depth = 0, pos = { x: 0 }) {
  const left = node.left || node.right ? layout(node.left || null, depth + 1, pos) : null;
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

function collectNodes(n, arr = []) {
  arr.push(n);
  n.children.forEach((c) => collectNodes(c, arr));
  return arr;
}

export function initParserWidget(root) {
  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Build a parse tree</div>
      <div class="controls">
        <input id="pa-src" type="text" value="1 + 2 * 3" style="flex:1;min-width:200px;font-family:var(--font-mono);font-size:0.95rem;padding:0.45em 0.7em;border:2px solid var(--ink);border-radius:var(--radius);background:var(--paper-deep);">
        <button class="btn" data-ex="1 + 2 * 3">1+2*3</button>
        <button class="btn" data-ex="(1 + 2) * 3">(1+2)*3</button>
        <button class="btn" data-ex="2 ^ 3 ^ 2">2^3^2</button>
        <button class="btn" data-ex="-5 + 3 * (4 - 1)">complex</button>
      </div>
      <div class="widget-stage" id="pa-stage" style="min-height:240px;"></div>
      <div class="callout" id="pa-explain"></div>
    </div>
  `;

  const inp = root.querySelector('#pa-src');
  const stage = root.querySelector('#pa-stage');
  const explain = root.querySelector('#pa-explain');

  function render() {
    try {
      const tree = parse(tokenize(inp.value));
      const laid = layout(tree, 0, { x: 0 });
      const nodes = collectNodes(laid);
      const maxX = Math.max(...nodes.map((n) => n.x));
      const maxY = Math.max(...nodes.map((n) => n.y));
      const W = Math.max(380, (maxX + 1) * 80);
      const H = (maxY + 1) * 80 + 30;
      const xs = (x) => 40 + x * 80;
      const ys = (y) => 30 + y * 80;
      let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
      // edges
      nodes.forEach((n) => n.children.forEach((c) => {
        svg += `<line x1="${xs(n.x)}" y1="${ys(n.y)}" x2="${xs(c.x)}" y2="${ys(c.y)}" stroke="var(--ink)" stroke-width="1.8"/>`;
      }));
      // nodes
      nodes.forEach((n) => {
        const label = nodeLabel(n.node);
        const isOp = n.node.type !== 'Num';
        svg += `<circle cx="${xs(n.x)}" cy="${ys(n.y)}" r="20" fill="${isOp ? 'var(--accent-soft)' : 'var(--paper)'}" stroke="var(--ink)" stroke-width="2"/>`;
        svg += `<text x="${xs(n.x)}" y="${ys(n.y) + 5}" text-anchor="middle" style="font-family:var(--font-mono);font-size:13px;font-weight:600;">${label.replace(/</g, '&lt;')}</text>`;
      });
      svg += `</svg>`;
      stage.innerHTML = svg;
      explain.innerHTML = `<strong>Parsed.</strong> Operator precedence and parentheses determined the tree shape. Tree depth = ${maxY + 1} levels.`;
    } catch (e) {
      stage.innerHTML = `<div style="padding:1rem;color:var(--accent);font-family:var(--font-mono);">Parse error: ${e.message}</div>`;
      explain.innerHTML = `Fix the expression to see the tree.`;
    }
  }

  inp.addEventListener('input', render);
  root.querySelectorAll('[data-ex]').forEach((b) => b.addEventListener('click', () => { inp.value = b.dataset.ex; render(); }));
  render();
}
