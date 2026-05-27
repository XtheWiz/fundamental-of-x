import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// Three tree variants, same interface — BST degrades to a linked list on
// sorted input; AVL and RB rebalance to keep height near log2(n). The tree
// is rebuilt from the key list on every change so render stays pure.

const VARIANTS = [
  { key: 'bst', label: 'Plain BST' },
  { key: 'avl', label: 'AVL' },
  { key: 'rb',  label: 'Red-Black' },
];

let _id = 0;
const newId = () => ++_id;
const makeNode = (key, extra = {}) => ({ id: newId(), key, left: null, right: null, ...extra });
const height = (n) => (n ? n.h : 0);
const treeHeight = (n) => (n ? 1 + Math.max(treeHeight(n.left), treeHeight(n.right)) : 0);

function bstInsert(root, key) {
  if (!root) return makeNode(key);
  if (key === root.key) return root;
  if (key < root.key) root.left = bstInsert(root.left, key);
  else root.right = bstInsert(root.right, key);
  return root;
}

const avlNode = (key) => makeNode(key, { h: 1 });
const updateH = (n) => { n.h = 1 + Math.max(height(n.left), height(n.right)); };
const balanceFactor = (n) => (n ? height(n.left) - height(n.right) : 0);

function rotateRight(y) {
  const x = y.left; const t2 = x.right;
  x.right = y; y.left = t2;
  updateH(y); updateH(x);
  return x;
}
function rotateLeft(x) {
  const y = x.right; const t2 = y.left;
  y.left = x; x.right = t2;
  updateH(x); updateH(y);
  return y;
}

function avlInsert(root, key) {
  if (!root) return avlNode(key);
  if (key === root.key) return root;
  if (key < root.key) root.left = avlInsert(root.left, key);
  else root.right = avlInsert(root.right, key);
  updateH(root);
  const bf = balanceFactor(root);
  if (bf > 1 && key < root.left.key) return rotateRight(root);
  if (bf < -1 && key > root.right.key) return rotateLeft(root);
  if (bf > 1 && key > root.left.key) { root.left = rotateLeft(root.left); return rotateRight(root); }
  if (bf < -1 && key < root.right.key) { root.right = rotateRight(root.right); return rotateLeft(root); }
  return root;
}

// Sentinel-free RB: null leaves are BLACK. Standard insert + recolor/rotate fixup.
const RED = 'R', BLACK = 'B';
const rbNode = (key, color = RED) => makeNode(key, { color, parent: null });

function rbRotateLeft(root, x) {
  const y = x.right;
  x.right = y.left; if (y.left) y.left.parent = x;
  y.parent = x.parent;
  if (!x.parent) root = y;
  else if (x === x.parent.left) x.parent.left = y;
  else x.parent.right = y;
  y.left = x; x.parent = y;
  return root;
}
function rbRotateRight(root, x) {
  const y = x.left;
  x.left = y.right; if (y.right) y.right.parent = x;
  y.parent = x.parent;
  if (!x.parent) root = y;
  else if (x === x.parent.right) x.parent.right = y;
  else x.parent.left = y;
  y.right = x; x.parent = y;
  return root;
}

function rbInsert(root, key) {
  let parent = null, cur = root;
  while (cur) {
    if (key === cur.key) return root;
    parent = cur;
    cur = key < cur.key ? cur.left : cur.right;
  }
  const z = rbNode(key, RED);
  z.parent = parent;
  if (!parent) { z.color = BLACK; return z; }
  if (key < parent.key) parent.left = z; else parent.right = z;
  let n = z;
  while (n.parent && n.parent.color === RED) {
    const p = n.parent, g = p.parent;
    if (!g) break;
    if (p === g.left) {
      const u = g.right;
      if (u && u.color === RED) {
        p.color = BLACK; u.color = BLACK; g.color = RED; n = g;
      } else {
        if (n === p.right) { n = p; root = rbRotateLeft(root, n); }
        n.parent.color = BLACK; n.parent.parent.color = RED;
        root = rbRotateRight(root, n.parent.parent);
      }
    } else {
      const u = g.left;
      if (u && u.color === RED) {
        p.color = BLACK; u.color = BLACK; g.color = RED; n = g;
      } else {
        if (n === p.left) { n = p; root = rbRotateRight(root, n); }
        n.parent.color = BLACK; n.parent.parent.color = RED;
        root = rbRotateLeft(root, n.parent.parent);
      }
    }
  }
  while (root.parent) root = root.parent;
  root.color = BLACK;
  return root;
}

function buildTree(variant, keys) {
  let root = null;
  for (const k of keys) {
    if (variant === 'bst') root = bstInsert(root, k);
    else if (variant === 'avl') root = avlInsert(root, k);
    else root = rbInsert(root, k);
  }
  return root;
}

function searchPath(root, key) {
  const path = [];
  let cur = root;
  while (cur) {
    path.push({ id: cur.id, hit: cur.key === key });
    if (cur.key === key) return { path, found: true };
    cur = key < cur.key ? cur.left : cur.right;
  }
  return { path, found: false };
}

// In-order x-positions, depth y-positions. Guarantees no sibling overlap.
function layoutTree(root) {
  const nodes = [], edges = [];
  let order = 0;
  (function visit(n, depth) {
    if (!n) return;
    visit(n.left, depth + 1);
    nodes.push({ ref: n, x: order++, depth });
    visit(n.right, depth + 1);
  })(root, 0);
  const byId = new Map(nodes.map((p) => [p.ref.id, p]));
  for (const p of nodes) {
    if (p.ref.left && byId.has(p.ref.left.id)) edges.push([p.ref.id, p.ref.left.id]);
    if (p.ref.right && byId.has(p.ref.right.id)) edges.push([p.ref.id, p.ref.right.id]);
  }
  return { nodes, edges, byId };
}

export default function TreesWidget() {
  const [variant, setVariant] = useState('bst');
  const [keys, setKeys] = useState([8, 4, 12, 2, 6, 10, 14]);
  const [insertVal, setInsertVal] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [highlightIds, setHighlightIds] = useState([]); // ids on the current search path
  const [searchResult, setSearchResult] = useState(null);
  const searchTimer = useRef(null);

  // Rebuild on every change — render stays a pure function of (variant, keys).
  const root = useMemo(() => buildTree(variant, keys), [variant, keys]);
  const layout = useMemo(() => layoutTree(root), [root]);

  const nodeCount = layout.nodes.length;
  const h = treeHeight(root);
  const log2N = nodeCount > 0 ? Math.ceil(Math.log2(nodeCount + 1)) : 0;

  // Clear search highlight whenever the tree or variant changes.
  useEffect(() => {
    setHighlightIds([]);
    setSearchResult(null);
    if (searchTimer.current) { clearInterval(searchTimer.current); searchTimer.current = null; }
  }, [variant, keys]);

  function doInsert(v) {
    if (!Number.isFinite(v) || keys.includes(v)) return;
    setKeys((k) => [...k, v]);
  }
  function onInsertClick() {
    const v = parseInt(insertVal, 10);
    if (!Number.isNaN(v)) { doInsert(v); setInsertVal(''); }
  }
  const bulkSorted = () => setKeys(Array.from({ length: 15 }, (_, i) => i + 1));
  function bulkRandom() {
    const set = new Set();
    while (set.size < 15) set.add(1 + Math.floor(Math.random() * 99));
    setKeys([...set]);
  }
  function reset() { setKeys([]); setHighlightIds([]); setSearchResult(null); }

  function animateSearch(target) {
    if (!Number.isFinite(target)) return;
    if (searchTimer.current) { clearInterval(searchTimer.current); searchTimer.current = null; }
    const { path, found } = searchPath(root, target);
    if (path.length === 0) {
      setHighlightIds([]); setSearchResult({ target, found: false, steps: 0 });
      return;
    }
    setHighlightIds([]); // start clean
    let i = 0;
    searchTimer.current = setInterval(() => {
      i++;
      setHighlightIds(path.slice(0, i).map((p) => p.id));
      if (i >= path.length) {
        clearInterval(searchTimer.current); searchTimer.current = null;
        setSearchResult({ target, found, steps: path.length });
      }
    }, 220);
  }

  function onSearchClick() {
    const v = parseInt(searchVal, 10);
    if (!Number.isNaN(v)) animateSearch(v);
  }

  // SVG geometry — width derived from in-order count so siblings never overlap.
  const NW = 36, NH = 34, GAPX = 14, GAPY = 56, PADX = 20, PADY = 28;
  const stageW = Math.max(560, PADX * 2 + Math.max(1, nodeCount) * (NW + GAPX));
  const stageH = PADY * 2 + Math.max(1, h) * GAPY;

  const highlightSet = new Set(highlightIds);
  const lastHighlight = highlightIds[highlightIds.length - 1];

  // For BST on sorted input we want a clear callout.
  const looksLikeStick = variant === 'bst' && nodeCount >= 6 && h === nodeCount;

  return (
    <div className="widget">
      <div className="widget-title">Trees — BST vs AVL vs Red-Black</div>

      <div className="controls pill-group" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        {VARIANTS.map((v) => (
          <label key={v.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="radio" name="tree-variant" checked={variant === v.key} onChange={() => setVariant(v.key)} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>{v.label}</span>
          </label>
        ))}
      </div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <input
          type="number" className="field" placeholder="key"
          value={insertVal}
          onChange={(e) => setInsertVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onInsertClick(); }}
          style={{ width: 90, fontFamily: 'var(--font-mono)' }}
        />
        <button className="btn btn-accent" onClick={onInsertClick}>Insert</button>
        <button className="btn" onClick={bulkSorted}>Insert 1..15 (sorted)</button>
        <button className="btn" onClick={bulkRandom}>Insert random 15</button>
        <button className="btn btn-ghost" onClick={reset} style={{ marginLeft: 'auto' }}>Reset</button>
      </div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <input
          type="number" className="field" placeholder="search key"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearchClick(); }}
          style={{ width: 110, fontFamily: 'var(--font-mono)' }}
        />
        <button className="btn" onClick={onSearchClick} disabled={!root}>Search (animate path)</button>
        {searchResult && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
            color: searchResult.found ? '#2a8a3e' : 'var(--accent)' }}>
            {searchResult.found
              ? `found ${searchResult.target} in ${searchResult.steps} step${searchResult.steps === 1 ? '' : 's'}`
              : `${searchResult.target} not found (${searchResult.steps} step${searchResult.steps === 1 ? '' : 's'})`}
          </span>
        )}
      </div>

      <div className="widget-stage" style={{ minHeight: 220, overflowX: 'auto' }}>
        {nodeCount === 0 ? (
          <div style={{ padding: '2rem', textAnchor: 'middle', textAlign: 'center', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
            Empty tree. Insert a key or click a bulk-insert button.
          </div>
        ) : (
          <svg viewBox={`0 0 ${stageW} ${stageH}`} width="100%" style={{ maxWidth: stageW }}>
            {/* edges first so nodes render on top */}
            {layout.edges.map(([pid, cid], i) => {
              const p = layout.byId.get(pid), c = layout.byId.get(cid);
              const px = PADX + p.x * (NW + GAPX) + NW / 2;
              const py = PADY + p.depth * GAPY + NH / 2;
              const cx = PADX + c.x * (NW + GAPX) + NW / 2;
              const cy = PADY + c.depth * GAPY + NH / 2;
              const onPath = highlightSet.has(pid) && highlightSet.has(cid);
              return (
                <line key={i} x1={px} y1={py} x2={cx} y2={cy}
                  stroke={onPath ? 'var(--accent)' : 'var(--ink)'}
                  strokeWidth={onPath ? 2.5 : 1.5} />
              );
            })}
            {layout.nodes.map(({ ref, x, depth }) => {
              const cx = PADX + x * (NW + GAPX);
              const cy = PADY + depth * GAPY;
              const isRB = variant === 'rb';
              const isRed = isRB && ref.color === RED;
              const onPath = highlightSet.has(ref.id);
              const isHit = ref.id === lastHighlight && searchResult && searchResult.found;
              const fill = isHit
                ? '#2a8a3e'
                : onPath
                  ? 'var(--accent)'
                  : isRB
                    ? (isRed ? '#c43a3a' : '#1a1a1a')
                    : 'var(--paper-deep)';
              const textFill = isRB || onPath || isHit ? 'white' : 'var(--ink)';
              const stroke = onPath ? 'var(--accent)' : 'var(--ink)';
              return (
                <motion.g key={ref.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <rect x={cx} y={cy} width={NW} height={NH} rx={6}
                    fill={fill} stroke={stroke} strokeWidth={onPath ? 2.5 : 1.5}
                    style={{ transition: 'fill 0.15s ease' }} />
                  <text x={cx + NW / 2} y={cy + NH / 2 + 4} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, fill: textFill }}>
                    {ref.key}
                  </text>
                  {variant === 'avl' && (
                    <text x={cx + NW + 2} y={cy + 10}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
                      bf={balanceFactor(ref)}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </svg>
        )}
      </div>

      <div className="metrics">
        <div className="metric accent">
          <div className="label">Nodes</div>
          <div className="value">{nodeCount}</div>
        </div>
        <div className="metric">
          <div className="label">Height</div>
          <div className="value">{h}</div>
        </div>
        <div className="metric">
          <div className="label">Worst lookup</div>
          <div className="value">{h}</div>
        </div>
        <div className="metric">
          <div className="label">Ideal (⌈log₂(n+1)⌉)</div>
          <div className="value">{log2N}</div>
        </div>
      </div>

      <div className="callout">
        {variant === 'bst' && (
          looksLikeStick ? (
            <>This is the BST failure mode: sorted input → every new key lands on the right spine,
            so height = <strong>{h}</strong> and lookup is <strong>O(n)</strong>. Switch to AVL or
            Red-Black to watch the same input rebalance.</>
          ) : (
            <>A plain BST never rebalances. On lucky orders it is fine; on sorted or near-sorted
            input the height grows linearly. Current height {h}, ideal {log2N}.</>
          )
        )}
        {variant === 'avl' && (
          <>AVL keeps every node's balance factor in &#123;-1, 0, +1&#125; via rotations after each
          insert — strictly height-balanced. Height {h}, ideal {log2N}. The labels next to each
          node show its current balance factor.</>
        )}
        {variant === 'rb' && (
          <>Red-Black is balanced more loosely: no two reds in a row, and every root-to-null path
          has the same black-height. That guarantees height ≤ 2·log₂(n+1). Height {h}, ideal {log2N}.
          Fewer rotations on average than AVL — the trade-off Java's TreeMap and the Linux kernel
          make.</>
        )}
      </div>
    </div>
  );
}
