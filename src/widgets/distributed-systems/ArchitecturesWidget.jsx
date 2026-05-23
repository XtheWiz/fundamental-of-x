import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Requirements a learner might actually have when picking a distributed DB.
// Each system carries a boolean per requirement; checking requirements
// reorders systems by how many they satisfy. The point: every system is
// a different point in trade-off space — there is no universal winner.
const REQUIREMENTS = [
  { id: 'strong',     label: 'Strong consistency (linearizable)' },
  { id: 'ap',         label: 'Tolerate network partitions (AP)' },
  { id: 'multiRegion',label: 'Multi-region active-active' },
  { id: 'highWrite',  label: 'High write throughput (>=100k ops/s)' },
  { id: 'managed',    label: 'Managed service (no ops)' },
  { id: 'lowCost',    label: 'Low ops cost / small footprint' },
  { id: 'schemaless', label: 'Schema flexibility (schemaless / wide-column)' },
];

const SYSTEMS = [
  {
    id: 'cassandra',
    label: 'Cassandra',
    sub: 'Wide-column, leaderless',
    traits: { strong: false, ap: true,  multiRegion: true,  highWrite: true,  managed: false, lowCost: false, schemaless: true  },
    why: 'Built for write-heavy, multi-DC workloads — quorum-tunable but AP by default.',
  },
  {
    id: 'dynamodb',
    label: 'DynamoDB',
    sub: 'Managed KV, leaderless',
    traits: { strong: false, ap: true,  multiRegion: true,  highWrite: true,  managed: true,  lowCost: false, schemaless: true  },
    why: 'Fully managed Dynamo-style KV with eventual reads and global tables.',
  },
  {
    id: 'spanner',
    label: 'Spanner',
    sub: 'Globally consistent SQL',
    traits: { strong: true,  ap: false, multiRegion: true,  highWrite: true,  managed: true,  lowCost: false, schemaless: false },
    why: 'TrueTime + Paxos gives linearizable SQL across regions — pay for the atomic clocks.',
  },
  {
    id: 'etcd',
    label: 'etcd',
    sub: 'KV store for coordination',
    traits: { strong: true,  ap: false, multiRegion: false, highWrite: false, managed: false, lowCost: true,  schemaless: false },
    why: 'Tiny Raft-backed KV — the boring core of Kubernetes. Small data, high value.',
  },
  {
    id: 'cockroach',
    label: 'CockroachDB',
    sub: 'Distributed SQL, Raft per range',
    traits: { strong: true,  ap: false, multiRegion: true,  highWrite: true,  managed: true,  lowCost: false, schemaless: false },
    why: 'Spanner-style guarantees with Hybrid Logical Clocks — Postgres wire-compatible.',
  },
  {
    id: 'postgres',
    label: 'Postgres (primary-replica)',
    sub: 'Single-leader SQL',
    traits: { strong: true,  ap: false, multiRegion: false, highWrite: false, managed: false, lowCost: true,  schemaless: false },
    why: 'The default for a reason — strong on one box, cheap, well-understood.',
  },
];

function scoreSystem(sys, checked) {
  let met = 0;
  for (const req of REQUIREMENTS) {
    if (checked[req.id] && sys.traits[req.id]) met += 1;
  }
  return met;
}

function Chip({ label, state }) {
  // state: 'met' | 'missed' | 'neutral'
  const bg =
    state === 'met'    ? '#d9ead3' :
    state === 'missed' ? '#fde2e2' :
                         'var(--paper-deep)';
  const fg =
    state === 'met'    ? '#1e5a2a' :
    state === 'missed' ? '#8a1f1f' :
                         'var(--ink-soft)';
  const mark =
    state === 'met'    ? 'yes' :
    state === 'missed' ? 'no'  :
                         '·';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35em',
        padding: '0.15em 0.5em',
        background: bg,
        color: fg,
        border: '1.5px solid var(--ink)',
        borderRadius: 'var(--radius)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontWeight: 700, letterSpacing: '0.04em' }}>{mark}</span>
      <span>{label}</span>
    </span>
  );
}

function SystemCard({ sys, checked, score, anyChecked, isTop }) {
  const totalChecked = Object.values(checked).filter(Boolean).length;
  return (
    <motion.div
      layout
      layoutId={`sys-${sys.id}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      style={{
        position: 'relative',
        padding: '0.7rem 0.9rem',
        background: 'var(--paper)',
        border: isTop ? '2.5px solid var(--accent)' : '1.5px solid var(--ink)',
        borderRadius: 'var(--radius)',
        boxShadow: isTop ? '3px 3px 0 var(--accent-soft)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', letterSpacing: '0.03em' }}>
          {sys.label}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
          {sys.sub}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isTop && (
            <span
              className="badge"
              style={{
                background: 'var(--accent)',
                color: 'white',
                border: '1.5px solid var(--ink)',
                borderRadius: 'var(--radius)',
                padding: '0.1em 0.55em',
                fontFamily: 'var(--font-display)',
                fontSize: '0.72rem',
                letterSpacing: '0.08em',
              }}
            >
              TOP MATCH
            </span>
          )}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              padding: '0.1em 0.55em',
              background: 'var(--paper-deep)',
              border: '1.5px solid var(--ink)',
              borderRadius: 'var(--radius)',
            }}
          >
            {anyChecked ? `${score}/${totalChecked}` : '—'}
          </span>
        </div>
      </div>

      <div style={{ marginTop: '0.55rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {REQUIREMENTS.map((req) => {
          const has = sys.traits[req.id];
          const checkedReq = checked[req.id];
          // Only paint a chip green/red when the learner cares about that requirement.
          const state = !anyChecked || !checkedReq ? 'neutral' : has ? 'met' : 'missed';
          return <Chip key={req.id} label={req.label} state={state} />;
        })}
      </div>

      {isTop && (
        <div
          style={{
            marginTop: '0.55rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: 'var(--ink-soft)',
            borderTop: '1px dashed var(--ink-faint, #ccc)',
            paddingTop: '0.4rem',
          }}
        >
          {sys.why}
        </div>
      )}
    </motion.div>
  );
}

export default function ArchitecturesWidget() {
  const [checked, setChecked] = useState(() =>
    Object.fromEntries(REQUIREMENTS.map((r) => [r.id, false]))
  );

  const anyChecked = useMemo(() => Object.values(checked).some(Boolean), [checked]);

  // Rank systems by score; ties broken by original order so the layout
  // stays stable as the learner toggles options.
  const ranked = useMemo(() => {
    const withScores = SYSTEMS.map((sys, idx) => ({ sys, score: scoreSystem(sys, checked), idx }));
    withScores.sort((a, b) => (b.score - a.score) || (a.idx - b.idx));
    return withScores;
  }, [checked]);

  const topScore = ranked[0]?.score ?? 0;
  // A "top match" only exists when (a) at least one requirement is checked
  // and (b) the leader actually meets a strict majority of them. Otherwise
  // we'd crown a winner on a 1-of-1 fluke.
  const totalChecked = Object.values(checked).filter(Boolean).length;
  const hasTop = anyChecked && topScore > 0 && topScore === totalChecked;

  function toggle(id) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }

  function reset() {
    setChecked(Object.fromEntries(REQUIREMENTS.map((r) => [r.id, false])));
  }

  return (
    <div className="widget">
      <div className="widget-title">Pick your requirements — see which architecture fits</div>

      <div
        className="controls"
        style={{
          flexWrap: 'wrap',
          alignItems: 'stretch',
          gap: '0.4rem',
        }}
      >
        {REQUIREMENTS.map((req) => {
          const on = checked[req.id];
          return (
            <button
              key={req.id}
              className={`btn ${on ? 'btn-accent' : ''}`}
              onClick={() => toggle(req.id)}
              style={{
                textAlign: 'left',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '0.9em',
                  marginRight: '0.45em',
                  fontWeight: 700,
                }}
              >
                {on ? '[x]' : '[ ]'}
              </span>
              {req.label}
            </button>
          );
        })}
        <button className="btn btn-ghost" onClick={reset} style={{ marginLeft: 'auto' }}>
          Reset
        </button>
      </div>

      <div className="widget-stage" style={{ minHeight: 360, padding: '0.6rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <AnimatePresence initial={false}>
            {ranked.map(({ sys, score }, i) => (
              <SystemCard
                key={sys.id}
                sys={sys}
                checked={checked}
                score={score}
                anyChecked={anyChecked}
                isTop={hasTop && i === 0}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="callout">
        {!anyChecked && (
          <>
            <strong>Six real systems, seven dimensions.</strong> Check the requirements
            that matter for your workload — cards re-rank in real time. The exercise
            is to see that there is no single best database; each one is a deliberate
            point in trade-off space.
          </>
        )}
        {anyChecked && hasTop && (
          <>
            <strong>Top match: {ranked[0].sys.label}.</strong> {ranked[0].sys.why}
            {ranked.length > 1 && ranked[1].score === topScore && (
              <> (Tied with {ranked.filter((r) => r.score === topScore).slice(1).map((r) => r.sys.label).join(', ')} — multiple systems meet all your requirements.)</>
            )}
          </>
        )}
        {anyChecked && !hasTop && (
          <>
            <strong>No system meets every requirement you picked.</strong> Closest:{' '}
            {ranked[0].sys.label} ({topScore}/{totalChecked}). Either relax a
            constraint or accept the trade-off — that is exactly the CAP-and-cousins
            lesson in practice.
          </>
        )}
      </div>
    </div>
  );
}
