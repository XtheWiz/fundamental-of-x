import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

// A trie stores a set of strings by sharing common prefixes. Each node
// holds one character; a root-to-terminal path spells a stored word.
// Prefix lookup is O(L) regardless of dictionary size — autocomplete
// becomes "walk to the prefix node, then collect everything below it".
// The radix toggle merges single-child non-terminal chains into one edge.

const PRESET_WORDS = ['car', 'cart', 'care', 'cards', 'cost', 'code', 'cord', 'dog', 'door', 'doom', 'dorm', 'dorms'];

// ---- Trie model ---------------------------------------------------------
const makeNode = (ch = '') => ({ ch, terminal: false, children: new Map() });

function insertWord(root, word) {
  let cur = root;
  for (const c of word) {
    if (!cur.children.has(c)) cur.children.set(c, makeNode(c));
    cur = cur.children.get(c);
  }
  cur.terminal = true;
}

function deleteWord(root, word) {
  const path = [];
  let cur = root;
  for (const c of word) {
    if (!cur.children.has(c)) return;
    path.push({ parent: cur, ch: c });
    cur = cur.children.get(c);
  }
  if (!cur.terminal) return;
  cur.terminal = false;
  // Prune now-dead branches walking back up.
  for (let i = path.length - 1; i >= 0; i--) {
    const { parent, ch } = path[i];
    const node = parent.children.get(ch);
    if (node.children.size === 0 && !node.terminal) parent.children.delete(ch);
    else break;
  }
}

function collectWords(node, prefix, out) {
  if (node.terminal) out.push(prefix);
  for (const k of [...node.children.keys()].sort()) {
    collectWords(node.children.get(k), prefix + k, out);
  }
  return out;
}

function countNodes(node) {
  let n = 1;
  for (const c of node.children.values()) n += countNodes(c);
  return n;
}

// ---- Radix projection ---------------------------------------------------
// Project the trie into a view tree where single-child non-terminal chains
// collapse into one edge whose label is the joined characters. We never
// mutate the underlying trie — toggling is purely cosmetic.
function toViewChild(node, compressed) {
  if (!compressed) {
    return {
      label: node.ch,
      terminal: node.terminal,
      children: [...node.children.values()].map((c) => toViewChild(c, compressed)),
    };
  }
  let label = node.ch;
  let cur = node;
  while (!cur.terminal && cur.children.size === 1) {
    const only = cur.children.values().next().value;
    label += only.ch;
    cur = only;
  }
  return {
    label,
    terminal: cur.terminal,
    children: [...cur.children.values()].map((c) => toViewChild(c, compressed)),
  };
}

function toView(root, compressed) {
  return {
    label: '·', terminal: false, isRoot: true,
    children: [...root.children.values()].map((c) => toViewChild(c, compressed)),
  };
}

function countViewNodes(view) {
  let n = 1;
  for (const c of view.children) n += countViewNodes(c);
  return n;
}

function collectViewWords(node, prefix, out) {
  if (node.terminal) out.push(prefix);
  for (const c of node.children) collectViewWords(c, prefix + c.label, out);
  return out;
}

// ---- Layout: leaf-count tidy tree --------------------------------------
function layout(view) {
  const LEAF_W = 38, LEVEL_H = 60;
  const nodes = [], edges = [];

  const measure = (n) => {
    if (n.children.length === 0) return (n._w = LEAF_W);
    let w = 0;
    for (const c of n.children) w += measure(c);
    return (n._w = Math.max(LEAF_W, w));
  };
  measure(view);

  const place = (n, x, depth, parentXY, key) => {
    const cx = x + n._w / 2;
    const cy = 30 + depth * LEVEL_H;
    nodes.push({ node: n, x: cx, y: cy, key });
    if (parentXY) edges.push({ from: parentXY, to: { x: cx, y: cy }, label: n.label, key });
    let cursor = x;
    if (n.children.length > 0) {
      const totalW = n.children.reduce((a, c) => a + c._w, 0);
      cursor = cx - totalW / 2;
    }
    for (const c of n.children) {
      place(c, cursor, depth + 1, { x: cx, y: cy }, key + '/' + c.label);
      cursor += c._w;
    }
  };
  place(view, 0, 0, null, 'root');

  let minX = Infinity, maxX = -Infinity, maxY = 0;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
  }
  const pad = 30;
  return {
    nodes, edges,
    width: Math.max(420, maxX - minX + pad * 2),
    height: maxY + 50,
    offsetX: pad - minX,
  };
}

// Walk view edges by query, returning highlighted keys + end node.
function findViewPath(view, query) {
  const keys = new Set(['root']);
  if (!query) return { keys, matched: true, endNode: view, basePrefix: '' };
  let cur = view, curKey = 'root', remaining = query, base = '';
  while (remaining.length > 0) {
    let advanced = false;
    for (const c of cur.children) {
      const lbl = c.label;
      if (remaining.startsWith(lbl)) {
        cur = c; curKey += '/' + lbl; keys.add(curKey);
        base += lbl;
        remaining = remaining.slice(lbl.length);
        advanced = true;
        break;
      } else if (lbl.startsWith(remaining)) {
        curKey += '/' + lbl; keys.add(curKey);
        return { keys, matched: true, endNode: c, basePrefix: base + lbl };
      }
    }
    if (!advanced) return { keys, matched: false, endNode: null, basePrefix: '' };
  }
  return { keys, matched: true, endNode: cur, basePrefix: base };
}

// ---- Component ----------------------------------------------------------
export default function TriesWidget() {
  const [, force] = useState(0);
  const [root, setRoot] = useState(() => {
    const r = makeNode('');
    for (const w of PRESET_WORDS) insertWord(r, w);
    return r;
  });
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('co');
  const [compressed, setCompressed] = useState(false);

  const rerender = useCallback(() => force((n) => n + 1), []);
  const words = useMemo(() => collectWords(root, '', []).sort(), [root]);
  const rawNodeCount = useMemo(() => countNodes(root), [root]);
  const view = useMemo(() => toView(root, compressed), [root, compressed]);
  const viewNodeCount = useMemo(() => countViewNodes(view), [view]);
  const layoutData = useMemo(() => layout(view), [view]);
  const longest = useMemo(() => words.reduce((a, w) => (w.length > a.length ? w : a), ''), [words]);
  // Naive separate storage = 1 root + sum of word lengths.
  const separateNodes = useMemo(() => 1 + words.reduce((a, w) => a + w.length, 0), [words]);
  const savedVsSeparate = separateNodes - viewNodeCount;

  const { keys: highlightedKeys, matched, endNode, basePrefix } = useMemo(
    () => findViewPath(view, query), [view, query]
  );

  const suggestions = useMemo(() => {
    if (!query) return words.slice(0, 12);
    if (!matched || !endNode) return [];
    return collectViewWords(endNode, basePrefix, []).sort().slice(0, 12);
  }, [view, query, matched, endNode, basePrefix, words]);

  const clean = (s) => s.trim().toLowerCase().replace(/[^a-z]/g, '');
  const doInsert = () => { const w = clean(input); if (w) { insertWord(root, w); setInput(''); rerender(); } };
  const doDelete = () => { const w = clean(input); if (w) { deleteWord(root, w); setInput(''); rerender(); } };
  const loadPreset = () => {
    const r = makeNode('');
    for (const w of PRESET_WORDS) insertWord(r, w);
    setRoot(r);
  };
  const clearAll = () => { setRoot(makeNode('')); setQuery(''); };

  return (
    <div className="widget">
      <div className="widget-title">Tries — prefix sharing for O(L) lookup</div>

      <div className="controls">
        <input
          className="field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="word, e.g. cart"
          onKeyDown={(e) => e.key === 'Enter' && doInsert()}
          style={{ fontFamily: 'var(--font-mono)', flex: '1 1 180px', minWidth: 140 }}
        />
        <button className="btn btn-accent" onClick={doInsert}>Insert</button>
        <button className="btn" onClick={doDelete}>Delete</button>
        <button className="btn" onClick={loadPreset}>Insert dictionary (12 words)</button>
        <button className="btn btn-ghost" onClick={clearAll}>Clear</button>
      </div>

      <div className="controls">
        <input
          className="field"
          value={query}
          onChange={(e) => setQuery(clean(e.target.value))}
          placeholder="search prefix, e.g. co"
          style={{ fontFamily: 'var(--font-mono)', flex: '1 1 180px', minWidth: 140 }}
        />
        <button className={`btn ${!compressed ? 'btn-accent' : ''}`} onClick={() => setCompressed(false)}>
          Standard trie
        </button>
        <button className={`btn ${compressed ? 'btn-accent' : ''}`} onClick={() => setCompressed(true)}>
          Compressed (radix)
        </button>
      </div>

      <div className="widget-stage" style={{ minHeight: 240, overflow: 'auto' }}>
        <svg
          viewBox={`0 0 ${layoutData.width} ${layoutData.height}`}
          width="100%"
          style={{ maxWidth: Math.max(700, layoutData.width), display: 'block', margin: '0 auto' }}
        >
          {layoutData.edges.map((e) => {
            const fx = e.from.x + layoutData.offsetX;
            const tx = e.to.x + layoutData.offsetX;
            const onPath = highlightedKeys.has(e.key);
            return (
              <g key={'e-' + e.key}>
                <line
                  x1={fx} y1={e.from.y + 14}
                  x2={tx} y2={e.to.y - 14}
                  stroke={onPath ? 'var(--accent)' : 'var(--ink-soft)'}
                  strokeWidth={onPath ? 2.5 : 1.5}
                  style={{ transition: 'stroke 0.18s ease' }}
                />
                {compressed && e.label.length > 1 && (
                  <text
                    x={(fx + tx) / 2 + 6} y={(e.from.y + e.to.y) / 2}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)', fontWeight: 600 }}
                  >{e.label}</text>
                )}
              </g>
            );
          })}

          {layoutData.nodes.map((n) => {
            const x = n.x + layoutData.offsetX;
            const y = n.y;
            const onPath = highlightedKeys.has(n.key);
            const isRoot = n.node.isRoot;
            const term = n.node.terminal;
            const fill = isRoot ? 'var(--paper-deep)'
              : onPath ? 'var(--accent)'
              : term ? '#2a8a3e'
              : 'var(--paper)';
            const stroke = term && !isRoot ? '#2a8a3e' : 'var(--ink)';
            const textFill = (onPath || term) && !isRoot ? 'white' : 'var(--ink)';
            const label = isRoot ? 'root' : n.node.label;
            return (
              <motion.g
                key={'n-' + n.key}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.18 }}
              >
                {term && !isRoot && (
                  <circle cx={x} cy={y} r={17} fill="none" stroke="#2a8a3e" strokeWidth={1.5} />
                )}
                <circle
                  cx={x} cy={y} r={14}
                  fill={fill}
                  stroke={onPath ? 'var(--accent)' : stroke}
                  strokeWidth={2}
                  style={{ transition: 'fill 0.18s ease, stroke 0.18s ease' }}
                />
                <text
                  x={x} y={y + 4} textAnchor="middle"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: isRoot ? 11 : label.length > 1 ? 9 : 12,
                    fontWeight: 700,
                    fill: textFill,
                  }}
                >{label}</text>
              </motion.g>
            );
          })}

          {layoutData.nodes.length === 1 && (
            <text
              x={layoutData.width / 2} y={layoutData.height / 2}
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: 'var(--ink-faint)' }}
            >Empty trie — insert a word.</text>
          )}
        </svg>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">Nodes used</div>
          <div className="value">{viewNodeCount}</div>
        </div>
        <div className="metric">
          <div className="label">Words stored</div>
          <div className="value">{words.length}</div>
        </div>
        <div className="metric">
          <div className="label">Longest word</div>
          <div className="value" style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', paddingTop: '0.4rem' }}>
            {longest || '—'}
          </div>
        </div>
        <div className={`metric ${savedVsSeparate > 0 ? 'accent' : ''}`}>
          <div className="label">Saved vs separate</div>
          <div className="value">
            {savedVsSeparate > 0 ? '−' : ''}{Math.abs(savedVsSeparate)}
          </div>
        </div>
      </div>

      <div className="callout">
        <div>
          <strong>Autocomplete for &quot;{query || '∅'}&quot;</strong>
          {query && !matched && (
            <span style={{ color: 'var(--accent)', marginLeft: '0.4rem' }}>
              no match — that prefix isn&rsquo;t in the trie
            </span>
          )}
        </div>
        {suggestions.length > 0 ? (
          <div style={{ marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {suggestions.map((s) => (
              <span
                key={s}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
                  padding: '0.18rem 0.5rem',
                  background: 'var(--paper-deep)',
                  border: '1.5px solid var(--ink)', borderRadius: 4,
                }}
              >
                {query && <strong style={{ color: 'var(--accent)' }}>{s.slice(0, query.length)}</strong>}
                {s.slice(query.length)}
              </span>
            ))}
          </div>
        ) : (
          query && matched && (
            <div style={{ marginTop: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              (prefix exists but no words complete it)
            </div>
          )
        )}
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
          Search cost: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>O({query.length || 'L'})</strong>
          {' '}— it does not depend on the {words.length} stored words.
          {compressed && (
            <> Compressed view merges single-child chains: <strong>{rawNodeCount} → {viewNodeCount}</strong> nodes.</>
          )}
        </div>
      </div>
    </div>
  );
}
