import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// An OCI image is a stack of read-only layers. Each Dockerfile instruction
// produces one layer. The build cache reuses a layer if (a) the instruction
// text is unchanged AND (b) every layer below it is also a cache hit.
//
// This means *order matters*. If you COPY your source code before you
// install dependencies, every source edit busts the dependency layer too —
// and you re-download the world on every commit.
//
// The learner can reorder lines, flag lines as "changes often" (source code
// edits), and simulate a code edit to see which layers re-build.

// Small lookup table — instruction kind → (size in MB, what kind of work it does).
// These are rough but plausible figures for a node app on alpine.
const KIND_INFO = {
  FROM:    { size: 80,  pull: true,  desc: 'base image' },
  WORKDIR: { size: 0,   pull: false, desc: 'set working dir' },
  COPY_DEPS: { size: 1, pull: false, desc: 'copy package.json' },
  RUN_INSTALL: { size: 180, pull: false, desc: 'install deps' },
  COPY_SRC: { size: 5,  pull: false, desc: 'copy source' },
  RUN_BUILD: { size: 25, pull: false, desc: 'build step' },
  CMD:     { size: 0,   pull: false, desc: 'set entrypoint' },
  ENV:     { size: 0,   pull: false, desc: 'set env' },
};

// Starting Dockerfile — deliberately the BAD ordering so the learner has
// something to fix. COPY . . sits before RUN npm install.
const INITIAL_LINES = [
  { id: 'l1', kind: 'FROM',        text: 'FROM node:20-alpine',          changesOften: false },
  { id: 'l2', kind: 'WORKDIR',     text: 'WORKDIR /app',                 changesOften: false },
  { id: 'l3', kind: 'COPY_SRC',    text: 'COPY . .',                     changesOften: true  },
  { id: 'l4', kind: 'RUN_INSTALL', text: 'RUN npm install',              changesOften: false },
  { id: 'l5', kind: 'CMD',         text: 'CMD ["node", "server.js"]',    changesOften: false },
];

// Heuristic for the RED "this should be earlier" flag.
// A line is mis-ordered if it changes often AND there's a later line
// whose inputs *don't* change often but whose size is large — i.e. a
// stable, expensive layer is being unnecessarily invalidated.
function findBadOrdering(lines) {
  const bad = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].changesOften) continue;
    for (let j = i + 1; j < lines.length; j++) {
      const below = lines[j];
      if (below.changesOften) continue;
      const sz = KIND_INFO[below.kind]?.size ?? 0;
      if (sz >= 25) {
        bad.add(lines[i].id);
        break;
      }
    }
  }
  return bad;
}

// Given the lines, simulate a build. If `sourceEdited` is true, every layer
// at-or-above the first "changesOften" line is a MISS; everything below is a HIT.
// On a fresh build (sourceEdited === false but we just reordered), nothing
// is cached either — but we want the "last run" view, so we treat the most
// recent action as the trigger.
function simulateBuild(lines, sourceEdited) {
  // Index of first line that changes often (lowest cache anchor).
  const firstChange = sourceEdited
    ? lines.findIndex((l) => l.changesOften)
    : -1;

  return lines.map((line, i) => {
    const info = KIND_INFO[line.kind] ?? { size: 0 };
    let status;
    if (firstChange === -1) {
      // No edit simulated → everything from the last successful build is cached.
      status = 'hit';
    } else if (i < firstChange) {
      status = 'hit';
    } else {
      status = 'miss';
    }
    return { ...line, size: info.size, status };
  });
}

function LineRow({ line, index, total, onMove, onToggle, badIds }) {
  const isBad = badIds.has(line.id);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: '0.5rem',
        alignItems: 'center',
        padding: '0.4rem 0.55rem',
        background: isBad ? '#fde2e2' : 'var(--paper)',
        border: `1.5px solid ${isBad ? 'var(--accent)' : 'var(--ink)'}`,
        borderRadius: 'var(--radius)',
        marginBottom: '0.35rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.82rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button
          className="btn btn-ghost"
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          aria-label="move up"
          style={{ padding: '0 0.4em', fontSize: '0.9rem', lineHeight: 1 }}
        >
          ↑
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => onMove(index, 1)}
          disabled={index === total - 1}
          aria-label="move down"
          style={{ padding: '0 0.4em', fontSize: '0.9rem', lineHeight: 1 }}
        >
          ↓
        </button>
      </div>
      <code style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {line.text}
      </code>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          fontSize: '0.7rem',
          color: 'var(--ink-soft)',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
        title="Mark this line as having frequently-changing inputs (e.g. source code edits)"
      >
        <input
          type="checkbox"
          checked={line.changesOften}
          onChange={() => onToggle(line.id)}
        />
        changes often
      </label>
    </div>
  );
}

function LayerStack({ built }) {
  // Render in reverse so the FROM line appears at the BOTTOM of the stack
  // — matching how layers are actually stacked in an image.
  const reversed = [...built].reverse();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <AnimatePresence initial={false}>
        {reversed.map((layer) => {
          const color =
            layer.status === 'hit'  ? '#2a8a3e' :
            layer.status === 'miss' ? '#e0a800' :
                                       'var(--accent)';
          const bg =
            layer.status === 'hit'  ? '#d9ead3' :
            layer.status === 'miss' ? '#fff2cc' :
                                       '#fde2e2';
          const label =
            layer.status === 'hit'  ? 'CACHE HIT' :
            layer.status === 'miss' ? 'REBUILT'   :
                                       'BAD ORDER';
          return (
            <motion.div
              key={layer.id}
              layout
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: '0.5rem',
                alignItems: 'center',
                padding: '0.4rem 0.6rem',
                background: bg,
                border: `2px solid ${color}`,
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {layer.text}
              </span>
              <span style={{ color: 'var(--ink-soft)' }}>
                {layer.size > 0 ? `${layer.size} MB` : '—'}
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'white',
                  background: color,
                  padding: '0.1em 0.5em',
                  borderRadius: 3,
                }}
              >
                {label}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default function OCIImagesWidget() {
  const [lines, setLines] = useState(INITIAL_LINES);
  const [sourceEdited, setSourceEdited] = useState(false);

  // Recompute everything every render — it's tiny.
  const badIds = useMemo(() => findBadOrdering(lines), [lines]);
  const built = useMemo(
    () => simulateBuild(lines, sourceEdited),
    [lines, sourceEdited]
  );

  // Apply the bad-order overlay onto the built status, but keep MISS/HIT
  // semantics: if the line is in badIds AND was rebuilt this run, color it
  // RED so the learner sees *why* it rebuilt unnecessarily.
  const annotated = built.map((b) =>
    badIds.has(b.id) && b.status === 'miss' ? { ...b, status: 'bad' } : b
  );

  const totalSize    = annotated.reduce((s, l) => s + l.size, 0);
  const rebuiltCount = annotated.filter((l) => l.status !== 'hit').length;
  const cachedCount  = annotated.length - rebuiltCount;
  const repullBytes  = annotated
    .filter((l) => l.status !== 'hit')
    .reduce((s, l) => s + l.size, 0);

  function moveLine(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= lines.length) return;
    const next = [...lines];
    [next[index], next[target]] = [next[target], next[index]];
    setLines(next);
    // A reorder invalidates everything from the changed position up,
    // so treat it as if the source had been edited this run.
    setSourceEdited(true);
  }

  function toggleFlag(id) {
    setLines((ls) =>
      ls.map((l) => (l.id === id ? { ...l, changesOften: !l.changesOften } : l))
    );
    setSourceEdited(true);
  }

  function simulateEdit() {
    setSourceEdited(true);
  }

  function reset() {
    setLines(INITIAL_LINES);
    setSourceEdited(false);
  }

  // Caption — pick the most useful explanation for the current state.
  let caption;
  if (badIds.size > 0) {
    const firstBad = lines.find((l) => badIds.has(l.id));
    caption = (
      <>
        <strong>Bad ordering:</strong> <code>{firstBad.text}</code> changes
        often, but sits <em>above</em> an expensive stable layer
        (like <code>RUN npm install</code>). Every source edit busts the
        install layer too. Move the frequently-changing line <em>after</em>
        {' '}the stable one.
      </>
    );
  } else if (sourceEdited && rebuiltCount > 0) {
    caption = (
      <>
        <strong>Good ordering.</strong> Only the {rebuiltCount} top-most
        layer{rebuiltCount === 1 ? '' : 's'} re-built — the
        {' '}{cachedCount} stable layer{cachedCount === 1 ? '' : 's'}
        {' '}below stayed cached. That's why <code>COPY package.json</code>
        {' '}+ <code>RUN npm install</code> belongs <em>before</em>
        {' '}<code>COPY . .</code>.
      </>
    );
  } else if (sourceEdited && rebuiltCount === 0) {
    caption = (
      <>
        <strong>Fully cached.</strong> Nothing in this Dockerfile is marked
        as changing — every layer is reusing the cache from the last build.
        Flag a line (e.g. <code>COPY . .</code>) as "changes often" and
        click <em>Edit a source file</em> to see what the cache does.
      </>
    );
  } else {
    caption = (
      <>
        Press <em>Edit a source file</em> to simulate a code change. Layers
        that depend on files you marked as "changes often" will rebuild;
        everything below them stays cached.
      </>
    );
  }

  return (
    <div className="widget">
      <div className="widget-title">OCI images — layers, ordering &amp; the build cache</div>
      <div className="widget-hint">
        An image is a stack of read-only layers, one per Dockerfile
        instruction. The build cache reuses a layer only if it AND every
        layer below it have unchanged inputs. Reorder the lines or
        simulate a code edit to see what happens.
      </div>

      <div className="controls">
        <button className="btn btn-accent" onClick={simulateEdit}>
          Edit a source file
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--ink-soft)',
          }}
        >
          {sourceEdited ? 'last run: rebuilt after edit' : 'last run: fresh build'}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* LEFT: Dockerfile editor */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.95rem',
              letterSpacing: '0.04em',
              marginBottom: '0.4rem',
            }}
          >
            Dockerfile
          </div>
          <div
            style={{
              background: 'var(--paper-deep)',
              border: '1.5px dashed var(--ink-faint)',
              borderRadius: 'var(--radius)',
              padding: '0.6rem',
            }}
          >
            {lines.map((line, i) => (
              <LineRow
                key={line.id}
                line={line}
                index={i}
                total={lines.length}
                onMove={moveLine}
                onToggle={toggleFlag}
                badIds={badIds}
              />
            ))}
          </div>
        </div>

        {/* RIGHT: layer stack */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.95rem',
              letterSpacing: '0.04em',
              marginBottom: '0.4rem',
            }}
          >
            Image layers (top = newest)
          </div>
          <div
            style={{
              background: 'var(--paper-deep)',
              border: '1.5px dashed var(--ink-faint)',
              borderRadius: 'var(--radius)',
              padding: '0.6rem',
            }}
          >
            <LayerStack built={annotated} />
          </div>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">Total size</div>
          <div className="value">{totalSize} MB</div>
        </div>
        <div className="metric">
          <div className="label">Rebuilt</div>
          <div className="value">{rebuiltCount}</div>
        </div>
        <div className="metric">
          <div className="label">Cached</div>
          <div className="value">{cachedCount}</div>
        </div>
        <div className="metric accent">
          <div className="label">Re-pull on deploy</div>
          <div className="value">{repullBytes} MB</div>
        </div>
      </div>

      <div className="callout">{caption}</div>
    </div>
  );
}
