// B-Tree widget: an interactive B-Tree with order=4 (max 3 keys per
// node, max 4 children). Insert/search/clear. Visualizes splits and
// search paths.

const ORDER = 4;       // max children per node
const MAX_KEYS = ORDER - 1; // = 3

let nodeId = 0;
function newNode(isLeaf = true) {
  return { id: ++nodeId, keys: [], children: [], isLeaf };
}

export function initBTreeWidget(root) {
  let tree = null;
  let highlightPath = new Set();
  let lastSearchOps = null;
  let lastFoundNode = null;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Build a B-Tree</div>
      <p class="widget-hint">Max ${MAX_KEYS} keys per node. When a node overflows on insert, the median key is pushed up to its parent.</p>

      <div class="controls">
        <input type="number" class="field" id="bt-key" placeholder="key" style="width: 90px;">
        <button class="btn btn-accent" id="bt-insert">Insert</button>
        <button class="btn" id="bt-search">Search</button>
        <button class="btn" id="bt-bulk">Insert 1..15</button>
        <button class="btn" id="bt-random">Insert 5 random</button>
        <button class="btn btn-ghost" id="bt-clear">Clear</button>
      </div>

      <div class="widget-stage" id="bt-stage" style="min-height: 220px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Keys</div><div class="value" id="bt-count">0</div></div>
        <div class="metric"><div class="label">Height</div><div class="value" id="bt-height">0</div></div>
        <div class="metric"><div class="label">Last search ops</div><div class="value" id="bt-ops">—</div></div>
        <div class="metric accent"><div class="label">Vs. table scan</div><div class="value" id="bt-cmp">—</div></div>
      </div>

      <div class="callout" id="bt-explain">Tip: insert keys 1..15 and watch the tree grow from 1 to 3 levels.</div>
    </div>
  `;

  const stage = root.querySelector('#bt-stage');
  const explainEl = root.querySelector('#bt-explain');
  const mCount = root.querySelector('#bt-count');
  const mHeight = root.querySelector('#bt-height');
  const mOps = root.querySelector('#bt-ops');
  const mCmp = root.querySelector('#bt-cmp');

  const keyInput = root.querySelector('#bt-key');

  root.querySelector('#bt-insert').addEventListener('click', () => {
    const v = Number(keyInput.value);
    if (!Number.isFinite(v)) return;
    insert(v);
    keyInput.value = '';
    keyInput.focus();
  });
  keyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') root.querySelector('#bt-insert').click();
  });
  root.querySelector('#bt-search').addEventListener('click', () => {
    const v = Number(keyInput.value);
    if (!Number.isFinite(v)) return;
    search(v);
  });
  root.querySelector('#bt-bulk').addEventListener('click', () => {
    clearTree();
    for (let i = 1; i <= 15; i++) insertSilent(i);
    render();
    explain(`Inserted 1..15. Notice how a flat node of 1..3 split, then split again as more arrived.`);
  });
  root.querySelector('#bt-random').addEventListener('click', () => {
    const used = new Set(allKeys(tree));
    let added = 0, attempts = 0;
    while (added < 5 && attempts < 100) {
      const v = Math.floor(Math.random() * 99) + 1;
      attempts++;
      if (used.has(v)) continue;
      used.add(v);
      insertSilent(v);
      added++;
    }
    render();
    explain(`Inserted 5 random keys.`);
  });
  root.querySelector('#bt-clear').addEventListener('click', () => {
    clearTree();
    render();
    explain(`Tree cleared.`);
  });

  function clearTree() {
    tree = null;
    highlightPath.clear();
    lastSearchOps = null;
    lastFoundNode = null;
  }

  function insertSilent(key) {
    if (!tree) {
      tree = newNode(true);
      tree.keys.push(key);
      return;
    }
    if (tree.keys.length >= MAX_KEYS) {
      const newRoot = newNode(false);
      newRoot.children.push(tree);
      splitChild(newRoot, 0);
      tree = newRoot;
    }
    insertNonFull(tree, key);
  }

  function insert(key) {
    if (allKeys(tree).includes(key)) {
      explain(`${key} is already in the tree — duplicates not inserted.`);
      return;
    }
    insertSilent(key);
    render();
    explain(`Inserted ${key}.`);
  }

  function insertNonFull(node, key) {
    let i = node.keys.length - 1;
    if (node.isLeaf) {
      while (i >= 0 && node.keys[i] > key) i--;
      node.keys.splice(i + 1, 0, key);
      return;
    }
    while (i >= 0 && node.keys[i] > key) i--;
    i++;
    if (node.children[i].keys.length >= MAX_KEYS) {
      splitChild(node, i);
      if (node.keys[i] < key) i++;
    }
    insertNonFull(node.children[i], key);
  }

  function splitChild(parent, idx) {
    const full = parent.children[idx];
    const mid = Math.floor(full.keys.length / 2);
    const medianKey = full.keys[mid];
    const right = newNode(full.isLeaf);
    right.keys = full.keys.slice(mid + 1);
    full.keys = full.keys.slice(0, mid);
    if (!full.isLeaf) {
      right.children = full.children.slice(mid + 1);
      full.children = full.children.slice(0, mid + 1);
    }
    parent.children.splice(idx + 1, 0, right);
    parent.keys.splice(idx, 0, medianKey);
  }

  function search(key) {
    highlightPath.clear();
    lastFoundNode = null;
    let node = tree;
    let ops = 0;
    while (node) {
      highlightPath.add(node.id);
      ops += 1;
      let i = 0;
      while (i < node.keys.length && key > node.keys[i]) i++;
      if (i < node.keys.length && node.keys[i] === key) {
        lastFoundNode = node.id;
        lastSearchOps = ops;
        render();
        const total = allKeys(tree).length;
        explain(`Found <strong>${key}</strong> in ${ops} node visit(s). A table scan would touch ~${total} rows.`);
        return;
      }
      if (node.isLeaf) {
        lastSearchOps = ops;
        render();
        const total = allKeys(tree).length;
        explain(`<strong>${key}</strong> not found after ${ops} node visit(s). A table scan would still touch all ${total} rows to be sure.`);
        return;
      }
      node = node.children[i];
    }
    explain('Tree is empty.');
  }

  function allKeys(node) {
    if (!node) return [];
    const out = [...node.keys];
    if (!node.isLeaf) node.children.forEach((c) => out.push(...allKeys(c)));
    return out.sort((a, b) => a - b);
  }

  function height(node) {
    if (!node) return 0;
    if (node.isLeaf) return 1;
    return 1 + height(node.children[0]);
  }

  function render() {
    const allK = allKeys(tree);
    mCount.textContent = allK.length;
    mHeight.textContent = height(tree);
    mOps.textContent = lastSearchOps ?? '—';
    if (lastSearchOps != null) {
      const total = allK.length || 1;
      const ratio = (total / lastSearchOps).toFixed(1);
      mCmp.textContent = `${ratio}× faster`;
    } else {
      mCmp.textContent = '—';
    }
    if (!tree) {
      stage.innerHTML = `<div style="text-align:center; color: var(--ink-faint); padding: 2rem;">Empty tree. Insert a key to begin.</div>`;
      return;
    }

    // Layout: use a simple recursive walker to position nodes
    const positions = layout(tree);
    const padding = 40;
    const W = Math.max(...positions.map((p) => p.x + p.width)) + padding;
    const H = Math.max(...positions.map((p) => p.y)) + 70;

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px; max-height: 460px;">`;
    svg += `<style>
      .bt-node-rect { fill: var(--paper); stroke: var(--ink); stroke-width: 2.5; }
      .bt-node-rect.path { stroke: var(--accent); stroke-width: 3; }
      .bt-node-rect.found { fill: var(--accent-soft); stroke: var(--accent); }
      .bt-key { font-family: var(--font-mono); font-size: 14px; fill: var(--ink); }
      .bt-key.found { fill: var(--accent); font-weight: 600; }
      .bt-link { stroke: var(--ink-soft); stroke-width: 1.5; fill: none; }
      .bt-link.path { stroke: var(--accent); stroke-width: 2.5; }
      .bt-slot-div { stroke: var(--ink); stroke-width: 1; }
    </style>`;

    // edges first
    positions.forEach((p) => {
      if (!p.node.isLeaf) {
        p.node.children.forEach((child, idx) => {
          const cp = positions.find((q) => q.node.id === child.id);
          if (!cp) return;
          const x1 = p.x + (p.width * (idx + 0.5)) / p.node.children.length;
          const y1 = p.y + 32;
          const x2 = cp.x + cp.width / 2;
          const y2 = cp.y;
          const onPath = highlightPath.has(p.node.id) && highlightPath.has(child.id);
          svg += `<path class="bt-link ${onPath ? 'path' : ''}" d="M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}"/>`;
        });
      }
    });

    // nodes on top
    positions.forEach((p) => {
      const onPath = highlightPath.has(p.node.id);
      const isFound = p.node.id === lastFoundNode;
      svg += `<rect class="bt-node-rect ${onPath ? 'path' : ''} ${isFound ? 'found' : ''}" x="${p.x}" y="${p.y}" width="${p.width}" height="32" rx="3"/>`;
      const slotW = p.width / p.node.keys.length;
      p.node.keys.forEach((k, i) => {
        if (i > 0) {
          svg += `<line class="bt-slot-div" x1="${p.x + slotW * i}" y1="${p.y}" x2="${p.x + slotW * i}" y2="${p.y + 32}"/>`;
        }
        svg += `<text class="bt-key ${isFound ? 'found' : ''}" x="${p.x + slotW * (i + 0.5)}" y="${p.y + 21}" text-anchor="middle">${k}</text>`;
      });
    });

    svg += `</svg>`;
    stage.innerHTML = svg;
  }

  function layout(root) {
    // First pass: assign x via in-order leaf positions; then propagate up.
    const positions = [];
    let nextLeafX = 20;
    const LEVEL_H = 80;
    const KEY_W = 38;
    const PAD = 14;
    function walk(node, depth) {
      const width = node.keys.length * KEY_W;
      let x;
      if (node.isLeaf) {
        x = nextLeafX;
        nextLeafX += width + PAD * 2;
      } else {
        const childPositions = node.children.map((c) => walk(c, depth + 1));
        // center over children
        const leftmost = childPositions[0];
        const rightmost = childPositions[childPositions.length - 1];
        const childrenCenter = (leftmost.x + (rightmost.x + rightmost.width)) / 2;
        x = childrenCenter - width / 2;
      }
      const pos = { node, x, y: 20 + depth * LEVEL_H, width };
      positions.push(pos);
      return pos;
    }
    walk(root, 0);
    // Ensure non-overlap on the leaf row was handled implicitly.
    // Shift everything to positive x if needed.
    const minX = Math.min(...positions.map((p) => p.x));
    if (minX < 20) {
      const dx = 20 - minX;
      positions.forEach((p) => p.x += dx);
    }
    return positions;
  }

  function explain(html) {
    explainEl.innerHTML = html;
  }

  render();
}
