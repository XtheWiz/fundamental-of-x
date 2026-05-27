import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Supply Chain — make the transitive blast radius visible.
//
// Pick a direct dependency. We render its (fake, but realistic) tree so the
// learner sees that "npm install one thing" actually means trusting dozens
// of authors they have never heard of. Three toggles model the realistic
// defenses and attacks: typosquat injection, lockfile pinning, and SBOM
// generation. Every interaction re-renders the tree, metrics, and caption.
//
// Educational only — names, versions, hashes, and licenses are fabricated.

// --- Fake dependency dataset --------------------------------------------
// Each node: { name, version, children }. Depth kept to 2-3 for legibility.

const TREES = {
  react: {
    name: 'react', version: '18.3.1', children: [
      { name: 'loose-envify', version: '1.4.0', children: [
        { name: 'js-tokens', version: '4.0.0', children: [] },
      ]},
      { name: 'scheduler', version: '0.23.2', children: [
        { name: 'loose-envify', version: '1.4.0', children: [] },
      ]},
    ],
  },
  lodash: {
    name: 'lodash', version: '4.17.21', children: [
      { name: 'lodash._baseiteratee', version: '4.7.0', children: [] },
      { name: 'lodash._basetostring', version: '4.12.0', children: [] },
      { name: 'lodash._root', version: '3.0.1', children: [] },
    ],
  },
  express: {
    name: 'express', version: '4.19.2', children: [
      { name: 'body-parser', version: '1.20.2', children: [
        { name: 'bytes', version: '3.1.2', children: [] },
        { name: 'qs', version: '6.11.0', children: [] },
      ]},
      { name: 'cookie', version: '0.6.0', children: [] },
      { name: 'debug', version: '2.6.9', children: [
        { name: 'ms', version: '2.0.0', children: [] },
      ]},
      { name: 'finalhandler', version: '1.2.0', children: [
        { name: 'encodeurl', version: '1.0.2', children: [] },
      ]},
    ],
  },
  webpack: {
    name: 'webpack', version: '5.91.0', children: [
      { name: 'acorn', version: '8.11.3', children: [] },
      { name: 'enhanced-resolve', version: '5.16.0', children: [
        { name: 'tapable', version: '2.2.1', children: [] },
        { name: 'graceful-fs', version: '4.2.11', children: [] },
      ]},
      { name: 'watchpack', version: '2.4.1', children: [
        { name: 'glob-to-regexp', version: '0.4.1', children: [] },
      ]},
      { name: 'terser-webpack-plugin', version: '5.3.10', children: [
        { name: 'serialize-javascript', version: '6.0.2', children: [] },
        { name: 'jest-worker', version: '27.5.1', children: [] },
      ]},
    ],
  },
};

// Per-package "typosquat" candidates — pedagogical only. We replace exactly
// one transitive node so the lesson lands without flooding the tree in red.
const TYPOSQUATS = {
  lodash:  { target: 'lodash._baseiteratee', impostor: 'lodash._baseitearee' },
  express: { target: 'cookie',               impostor: 'cookei' },
  react:   { target: 'js-tokens',            impostor: 'js-tokenz' },
  webpack: { target: 'tapable',              impostor: 'tapabel' },
};

// Hash / license values are fabricated for the SBOM panel.
const FAKE_LICENSES = ['MIT', 'Apache-2.0', 'ISC', 'BSD-3-Clause'];
function fakeHash(name, version) {
  // Deterministic pseudo-hash so the SBOM stays stable across renders.
  let h = 0x811c9dc5;
  const s = `${name}@${version}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return 'sha256-' + h.toString(16).padStart(8, '0') + '…';
}
function fakeLicense(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) | 0;
  return FAKE_LICENSES[Math.abs(h) % FAKE_LICENSES.length];
}

// --- Tree helpers --------------------------------------------------------

function cloneTree(node) {
  return { ...node, children: node.children.map(cloneTree) };
}

function applyTyposquat(tree, pkgKey) {
  const rule = TYPOSQUATS[pkgKey];
  if (!rule) return { tree, swapped: null };
  const out = cloneTree(tree);
  let swapped = null;
  function walk(node) {
    for (const child of node.children) {
      if (!swapped && child.name === rule.target) {
        swapped = { from: child.name, to: rule.impostor };
        child.name = rule.impostor;
        child.malicious = true;
      }
      walk(child);
    }
  }
  walk(out);
  return { tree: out, swapped };
}

function flatten(node, depth = 0, out = []) {
  out.push({ ...node, depth });
  for (const c of node.children) flatten(c, depth + 1, out);
  return out;
}

function maxDepth(node) {
  if (!node.children.length) return 0;
  return 1 + Math.max(...node.children.map(maxDepth));
}

// --- Tree row render -----------------------------------------------------

function TreeRow({ node, pinned }) {
  const indent = node.depth * 18;
  const isRoot = node.depth === 0;
  const bg = node.malicious
    ? '#fde2e2'
    : isRoot
      ? 'var(--paper-deep)'
      : 'var(--paper)';
  const border = node.malicious ? 'var(--accent)' : 'var(--ink)';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        marginLeft: indent,
        padding: '0.25rem 0.5rem',
        border: `1.5px solid ${border}`,
        background: bg,
        borderRadius: 4,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.82rem',
      }}
    >
      <span style={{ color: 'var(--ink-faint)' }}>
        {isRoot ? '●' : node.depth === 1 ? '├─' : '│  └─'}
      </span>
      <span style={{ fontWeight: isRoot ? 700 : 500 }}>{node.name}</span>
      <span style={{ color: 'var(--ink-soft)' }}>@{node.version}</span>
      {pinned && (
        <span title="pinned by lockfile" style={{ marginLeft: 'auto', color: '#2a8a3e', fontWeight: 700 }}>
          [pinned]
        </span>
      )}
      {node.malicious && (
        <span style={{ marginLeft: pinned ? '0.4rem' : 'auto', color: 'var(--accent)', fontWeight: 700 }}>
          typosquat
        </span>
      )}
    </motion.div>
  );
}

// --- Component -----------------------------------------------------------

const KNOWN = Object.keys(TREES);

export default function SupplyChainWidget() {
  const [pkgInput, setPkgInput] = useState('react');
  const [typosquat, setTyposquat] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [sbom, setSbom] = useState(false);

  // Resolve the input. Unknown packages get a graceful empty state.
  const key = pkgInput.trim().toLowerCase();
  const baseTree = TREES[key] || null;

  const { tree, swapped } = useMemo(() => {
    if (!baseTree) return { tree: null, swapped: null };
    if (!typosquat) return { tree: cloneTree(baseTree), swapped: null };
    return applyTyposquat(baseTree, key);
  }, [baseTree, typosquat, key]);

  const flat = useMemo(() => (tree ? flatten(tree) : []), [tree]);
  const totalDeps = flat.length;
  const depth = tree ? maxDepth(tree) : 0;
  const transitiveCount = Math.max(0, totalDeps - 1);
  const uncontrolledSurface = pinned ? 0 : transitiveCount;

  // Caption — live response to whatever state we are in.
  const caption = useMemo(() => {
    if (!tree) {
      return `Unknown package "${pkgInput}". Try one of: ${KNOWN.join(', ')}.`;
    }
    const parts = [];
    parts.push(`Installing ${tree.name} pulled in ${transitiveCount} transitive package${transitiveCount === 1 ? '' : 's'} across ${depth + 1} level${depth === 0 ? '' : 's'}.`);
    if (typosquat && swapped) {
      parts.push(`A package named "${swapped.to}" replaced "${swapped.from}" in your tree — the attacker only had to publish a name one keystroke away from the real one.`);
    }
    if (pinned) {
      parts.push('Lockfile is pinning every version + hash; even if upstream republishes under the same version, your build refuses the mismatched hash.');
    } else {
      parts.push(`Without a lockfile, ${uncontrolledSurface} transitive package${uncontrolledSurface === 1 ? '' : 's'} can silently change on the next install.`);
    }
    if (sbom) {
      parts.push('SBOM is on — when a CVE drops you can grep the inventory in seconds instead of guessing.');
    }
    return parts.join(' ');
  }, [tree, pkgInput, typosquat, swapped, pinned, sbom, depth, transitiveCount, uncontrolledSurface]);

  return (
    <div className="widget">
      <div className="widget-title">Supply chain — one install, many strangers</div>

      <div className="controls" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Direct dep:</label>
        <input
          type="text"
          className="field"
          value={pkgInput}
          onChange={(e) => setPkgInput(e.target.value)}
          list="supply-chain-known"
          style={{ width: 180, fontFamily: 'var(--font-mono)' }}
          placeholder="react, lodash, express, webpack"
        />
        <datalist id="supply-chain-known">
          {KNOWN.map((k) => <option key={k} value={k} />)}
        </datalist>
        <div className="pill-group">
          {KNOWN.map((k) => (
            <button
              key={k}
              className={`btn ${key === k ? 'btn-accent' : ''}`}
              onClick={() => setPkgInput(k)}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="controls" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <label style={toggleLabel}>
          <input type="checkbox" checked={typosquat} onChange={(e) => setTyposquat(e.target.checked)} />
          <span>Inject typosquat</span>
        </label>
        <label style={toggleLabel}>
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          <span>Lockfile pinned</span>
        </label>
        <label style={toggleLabel}>
          <input type="checkbox" checked={sbom} onChange={(e) => setSbom(e.target.checked)} />
          <span>SBOM enabled</span>
        </label>
      </div>

      <div
        className="widget-stage"
        style={{
          display: 'grid',
          gridTemplateColumns: sbom ? 'minmax(260px, 1.2fr) minmax(240px, 1fr)' : '1fr',
          gap: '0.8rem',
          alignItems: 'start',
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
            Resolved tree
          </div>
          {!tree && (
            <div className="code-block" style={{ fontSize: '0.82rem' }}>
              # npm error
              {'\n'}
              # no canned tree for "{pkgInput}". try: {KNOWN.join(', ')}
            </div>
          )}
          {tree && (
            <motion.div layout style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <AnimatePresence initial={false}>
                {flat.map((n, idx) => (
                  <TreeRow
                    key={`${n.name}@${n.version}@${idx}`}
                    node={n}
                    pinned={pinned}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {sbom && tree && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              SBOM (CycloneDX-ish)
            </div>
            <div className="log" style={{ maxHeight: 320, overflow: 'auto', fontSize: '0.78rem' }}>
              {flat.map((n, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', columnGap: '0.6rem', padding: '0.15rem 0' }}>
                  <span style={{ color: n.malicious ? 'var(--accent)' : 'var(--ink)' }}>
                    {n.name}@{n.version}
                  </span>
                  <span style={{ color: 'var(--ink-soft)' }}>{fakeLicense(n.name)}</span>
                  <span style={{ gridColumn: '1 / -1', color: 'var(--ink-faint)' }}>
                    {fakeHash(n.name, n.version)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">Total packages</div>
          <div className="value">{totalDeps}</div>
        </div>
        <div className="metric">
          <div className="label">Tree depth</div>
          <div className="value">{tree ? depth + 1 : 0}</div>
        </div>
        <div className={`metric ${uncontrolledSurface > 0 ? 'accent' : ''}`}>
          <div className="label">Uncontrolled surface</div>
          <div className="value">{uncontrolledSurface}</div>
        </div>
        <div className="metric">
          <div className="label">Typosquat</div>
          <div className="value">{typosquat && swapped ? 'present' : 'none'}</div>
        </div>
      </div>

      <div className="callout">
        {caption}
        {typosquat && swapped && (
          <div style={{ marginTop: '0.4rem', color: 'var(--accent)' }}>
            Pattern: an attacker registers a near-identical name and waits for a
            typo in someone's package.json — or for an internal package name to
            leak so they can publish it publicly with a higher version
            (dependency confusion). The new code runs at install time with your
            shell's privileges.
          </div>
        )}
        {pinned && (
          <div style={{ marginTop: '0.4rem', color: '#2a8a3e' }}>
            Pinning closes the silent-upgrade vector, but does nothing about the
            first install. Pair it with an SBOM + vulnerability scan in CI.
          </div>
        )}
      </div>
    </div>
  );
}

const toggleLabel = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.85rem',
  cursor: 'pointer',
};
