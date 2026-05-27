import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// CI/CD lesson — Triggers & Versioning.
//
// Two questions a CI/CD pipeline answers, every time something happens:
//   1) "did this event fire a workflow, and which one?"
//   2) "what version did the artifact get?"
//
// Both depend on the same input — a git event — so we show them together.
// The learner picks an event, picks a commit-change kind, optionally re-wires
// the trigger matrix, and watches the workflows + the next version mint.

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

const EVENTS = [
  { id: 'push-feature',  label: 'push to feature branch', ghEvent: 'push',              ghDetail: 'branches: [feature/*]' },
  { id: 'pr-open',       label: 'PR opened to main',      ghEvent: 'pull_request',      ghDetail: 'types: [opened]' },
  { id: 'pr-merged',     label: 'PR merged to main',      ghEvent: 'push',              ghDetail: 'branches: [main]' },
  { id: 'tag-release',   label: 'git tag v1.2.0',         ghEvent: 'push',              ghDetail: 'tags: [v*]' },
  { id: 'nightly',       label: 'nightly cron',           ghEvent: 'schedule',          ghDetail: "cron: '0 3 * * *'" },
  { id: 'manual',        label: 'manual dispatch',        ghEvent: 'workflow_dispatch', ghDetail: '(button in UI)' },
];

const COMMIT_KINDS = [
  { id: 'patch', label: 'patch (bugfix)',         bump: 'patch' },
  { id: 'minor', label: 'minor (new feature)',    bump: 'minor' },
  { id: 'major', label: 'major (breaking)',       bump: 'major' },
  { id: 'none',  label: 'no public API change',   bump: 'none'  },
];

const WORKFLOWS = [
  { id: 'lint',    name: 'lint.yml',         desc: 'static checks, formatting' },
  { id: 'test',    name: 'test.yml',         desc: 'unit + integration tests' },
  { id: 'build',   name: 'build.yml',        desc: 'compile + package artifact' },
  { id: 'release', name: 'release.yml',      desc: 'tag, sign, publish to registry' },
  { id: 'nightly', name: 'nightly-e2e.yml',  desc: 'long e2e + perf suite' },
];

// Default trigger matrix — which event triggers which workflow.
const DEFAULT_MATRIX = {
  lint:    { 'push-feature': true,  'pr-open': true,  'pr-merged': true,  'tag-release': false, 'nightly': false, 'manual': true  },
  test:    { 'push-feature': true,  'pr-open': true,  'pr-merged': true,  'tag-release': false, 'nightly': false, 'manual': true  },
  build:   { 'push-feature': false, 'pr-open': false, 'pr-merged': true,  'tag-release': true,  'nightly': false, 'manual': true  },
  release: { 'push-feature': false, 'pr-open': false, 'pr-merged': false, 'tag-release': true,  'nightly': false, 'manual': false },
  nightly: { 'push-feature': false, 'pr-open': false, 'pr-merged': false, 'tag-release': false, 'nightly': true,  'manual': true  },
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function bumpVersion(current, kind) {
  const [maj, min, pat] = current.split('.').map((n) => parseInt(n, 10));
  switch (kind) {
    case 'major': return `${maj + 1}.0.0`;
    case 'minor': return `${maj}.${min + 1}.0`;
    case 'patch': return `${maj}.${min}.${pat + 1}`;
    default:      return current;
  }
}

// What version comes out of a given event, given the prior version + commit kind?
//   - tag-release: cuts a real release at the bumped version
//   - pr-merged:   pre-release candidate (e.g. 1.2.4-rc.<sha>) — preview
//   - nightly:     preview with .nightly suffix
//   - pr-open:     ephemeral preview (1.2.4-pr.<n>)
//   - push-feature / manual: dev preview or no mint
function computeMint(eventId, commitKind, currentVersion, prNumber = 42, sha = 'a1b2c3d') {
  const next = bumpVersion(currentVersion, commitKind);
  switch (eventId) {
    case 'tag-release':
      return { version: next, channel: 'release', note: 'tag matches v* → cut a real release' };
    case 'pr-merged':
      return commitKind === 'none'
        ? { version: currentVersion, channel: 'none', note: 'no public API change → no mint' }
        : { version: `${next}-rc.${sha}`, channel: 'preview', note: 'merged to main → release candidate' };
    case 'pr-open':
      return { version: `${next}-pr.${prNumber}`, channel: 'preview', note: 'PR preview build, ephemeral' };
    case 'push-feature':
      return { version: `${next}-dev.${sha}`, channel: 'preview', note: 'feature-branch dev build' };
    case 'nightly':
      return { version: `${next}-nightly.${todayStamp()}`, channel: 'preview', note: 'nightly build, latest main' };
    case 'manual':
      return commitKind === 'none'
        ? { version: currentVersion, channel: 'none', note: 'manual dispatch, nothing to mint' }
        : { version: `${next}-manual.${sha}`, channel: 'preview', note: 'manual dispatch — preview only' };
    default:
      return { version: currentVersion, channel: 'none', note: '' };
  }
}

function todayStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function workflowsFor(eventId, matrix) {
  return WORKFLOWS.filter((w) => matrix[w.id][eventId]);
}

function buildYaml(matrix) {
  // Group workflows by their trigger set so the snippet stays compact.
  const lines = ['# .github/workflows/ci.yml (generated)'];
  for (const w of WORKFLOWS) {
    const trigs = EVENTS.filter((e) => matrix[w.id][e.id]);
    if (trigs.length === 0) continue;
    lines.push('');
    lines.push(`# ${w.name} — ${w.desc}`);
    lines.push('on:');
    // collapse equivalent ghEvents
    const byEvent = {};
    for (const t of trigs) {
      if (!byEvent[t.ghEvent]) byEvent[t.ghEvent] = [];
      byEvent[t.ghEvent].push(t);
    }
    for (const [gh, ts] of Object.entries(byEvent)) {
      lines.push(`  ${gh}:`);
      for (const t of ts) lines.push(`    # ${t.ghDetail}  (${t.label})`);
    }
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const STARTING_VERSION = '1.2.3';

export default function TriggersVersioningWidget() {
  const [eventId, setEventId]     = useState('pr-merged');
  const [commitKind, setCommitKind] = useState('minor');
  const [matrix, setMatrix]       = useState(DEFAULT_MATRIX);
  const [history, setHistory]     = useState([
    { current: STARTING_VERSION, mint: null, eventId: null, commitKind: null },
  ]);

  const current = history[history.length - 1].current;

  const ran  = useMemo(() => workflowsFor(eventId, matrix), [eventId, matrix]);
  const mint = useMemo(() => computeMint(eventId, commitKind, current), [eventId, commitKind, current]);
  const yaml = useMemo(() => buildYaml(matrix), [matrix]);

  function toggleMatrix(workflowId, evId) {
    setMatrix((m) => ({ ...m, [workflowId]: { ...m[workflowId], [evId]: !m[workflowId][evId] } }));
  }

  function applyMint() {
    // Only an actual release advances the "current" version pointer.
    // RCs, PR previews, dev/nightly builds don't shift the canonical version.
    const newCurrent = mint.channel === 'release' ? mint.version : current;
    setHistory((h) => [...h, { current: newCurrent, mint, eventId, commitKind }]);
  }
  function resetAll() {
    setMatrix(DEFAULT_MATRIX);
    setHistory([{ current: STARTING_VERSION, mint: null, eventId: null, commitKind: null }]);
  }

  return (
    <div className="widget">
      <div className="widget-title">Triggers & Versioning — what fires, what ships</div>
      <div className="widget-hint">
        Pick an event and a commit kind. Watch which workflows run, and what version the pipeline mints.
        Toggle the trigger matrix to see how a small YAML change reshapes the whole pipeline.
      </div>

      {/* Event picker */}
      <div className="controls">
        <label>Event:</label>
        {EVENTS.map((e) => (
          <button
            key={e.id}
            className={`btn ${eventId === e.id ? 'btn-accent' : ''}`}
            style={{ fontSize: '0.82rem', padding: '0.3em 0.7em' }}
            onClick={() => setEventId(e.id)}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* Commit-change kind */}
      <div className="controls">
        <label>Commit change:</label>
        {COMMIT_KINDS.map((c) => (
          <button
            key={c.id}
            className={`btn ${commitKind === c.id ? 'btn-accent' : ''}`}
            style={{ fontSize: '0.82rem', padding: '0.3em 0.7em' }}
            onClick={() => setCommitKind(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Two-column stage: matrix + outputs ⟂ yaml snippet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1rem', marginTop: '0.6rem' }}>
        {/* LEFT: matrix + outputs */}
        <div>
          <div className="widget-stage" style={{ minHeight: 0, padding: '0.8rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              Trigger matrix — which events trigger which workflows
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.2em 0.4em', color: 'var(--ink-soft)' }}>workflow</th>
                    {EVENTS.map((e) => {
                      const active = eventId === e.id;
                      return (
                        <th key={e.id} style={{ padding: '0.2em 0.3em', textAlign: 'center', whiteSpace: 'nowrap', color: active ? 'var(--accent)' : 'var(--ink-soft)', fontWeight: active ? 700 : 400 }}>
                          {e.label.split(' ').slice(0, 2).join(' ')}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {WORKFLOWS.map((w) => (
                    <tr key={w.id}>
                      <td style={{ padding: '0.25em 0.4em', fontWeight: 600, whiteSpace: 'nowrap' }}>{w.name}</td>
                      {EVENTS.map((e) => {
                        const on = matrix[w.id][e.id];
                        const live = on && eventId === e.id;
                        const bg = live ? 'var(--accent)' : on ? '#d9ead3' : 'var(--paper)';
                        const fg = live ? 'white' : on ? '#2a8a3e' : 'var(--ink-faint)';
                        return (
                          <td key={e.id} style={{ textAlign: 'center', padding: '0.2em' }}>
                            <button onClick={() => toggleMatrix(w.id, e.id)} className="btn"
                              style={{ padding: '0.05em 0.45em', fontSize: '0.7rem', background: bg, color: fg, borderColor: on ? '#2a8a3e' : 'var(--ink-faint)', boxShadow: '1px 1px 0 var(--ink)' }}>
                              {on ? 'on' : 'off'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Outputs */}
          <div className="metrics" style={{ marginTop: '0.8rem' }}>
            <div className="metric">
              <div className="label">workflows run</div>
              <div className="value" style={{ fontSize: '1.2rem' }}>{ran.length}</div>
            </div>
            <div className="metric">
              <div className="label">current version</div>
              <div className="value" style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>{current}</div>
            </div>
            <div className="metric accent">
              <div className="label">next mint</div>
              <div className="value" style={{ fontSize: '1.0rem', fontFamily: 'var(--font-mono)' }}>
                {mint.channel === 'none' ? '—' : mint.version}
              </div>
            </div>
            <div className="metric">
              <div className="label">channel</div>
              <div className="value" style={{ fontSize: '1.1rem' }}>
                <span className={`badge ${mint.channel === 'release' ? 'live' : mint.channel === 'preview' ? 'warn' : 'err'}`}>
                  {mint.channel}
                </span>
              </div>
            </div>
          </div>

          {/* Workflows that ran */}
          <div style={{ marginTop: '0.7rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              Pipeline that ran on this event:
            </div>
            <AnimatePresence mode="popLayout">
              {ran.length === 0 ? (
                <motion.div key="nothing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="callout" style={{ background: '#fde2e2', marginTop: 0 }}>
                  No workflow is wired to this event. Nothing runs.
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {ran.map((w, i) => (
                    <motion.div key={w.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ delay: i * 0.06 }}
                      style={{ padding: '0.4rem 0.6rem', border: '2px solid #2a8a3e', background: '#d9ead3', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', boxShadow: '2px 2px 0 var(--ink)' }}>
                      <div style={{ fontWeight: 700 }}>{w.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>{w.desc}</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Mint explanation */}
          <div className="callout" style={{ marginTop: '0.8rem' }}>
            <strong>Version mint.</strong> {mint.note || 'nothing minted'}.
            {mint.channel !== 'none' && (
              <>
                {' '}Bump rule from commit kind <em>{commitKind}</em>:{' '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>{current} → {bumpVersion(current, commitKind)}</span>.
              </>
            )}
          </div>

          {/* Version history timeline */}
          <div style={{ marginTop: '0.7rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.3rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>Version history</span>
              <button className="btn btn-accent" style={{ fontSize: '0.75rem', padding: '0.2em 0.6em' }} onClick={applyMint}>
                Apply this event
              </button>
              <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.2em 0.6em' }} onClick={resetAll}>
                Reset
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {history.map((h, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    padding: '0.15em 0.5em',
                    border: '1.5px solid var(--ink)',
                    borderRadius: 3,
                    background: i === history.length - 1 ? 'var(--accent-soft)' : 'var(--paper)',
                  }}
                >
                  {h.current}
                </span>
              ))}
              <span style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>→</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  padding: '0.15em 0.5em',
                  border: '2px dashed var(--accent)',
                  borderRadius: 3,
                  background: 'var(--paper-deep)',
                  color: 'var(--accent)',
                  fontWeight: 700,
                }}
              >
                preview: {mint.channel === 'none' ? '—' : mint.version}
              </span>
            </div>
            <div style={{ marginTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
              Only a <strong>release</strong> channel advances the canonical version. Previews are minted but don't move the pointer.
            </div>
          </div>
        </div>

        {/* RIGHT: GitHub Actions snippet */}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
            GitHub Actions snippet
          </div>
          <pre className="code-block" style={{ maxHeight: 480, overflowY: 'auto', fontSize: '0.74rem', margin: 0 }}>
{yaml}
          </pre>
          <div style={{ marginTop: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
            Live: edits to the trigger matrix above rewrite this YAML. Bold rows in the matrix are
            the ones that fire for{' '}
            <strong style={{ color: 'var(--accent)' }}>{EVENTS.find((e) => e.id === eventId).label}</strong>.
          </div>

          <div className="callout" style={{ marginTop: '0.8rem' }}>
            <strong>Two questions, one config.</strong> The same <em>on:</em> block that decides when CI
            fires also decides what gets versioned. Wire a tag push to <em>release.yml</em> and you mint
            a real release; wire only a PR merge and you mint a release candidate. Keep them straight by
            making the channel (release vs preview) explicit in the version string.
          </div>
        </div>
      </div>
    </div>
  );
}
