import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Rollback & Disaster Recovery
//
// Pedagogical goal: code-only rollback is the easy case. Schema and data
// changes break the symmetry — once you've dropped a column or rewritten
// rows, "go back to the previous build" no longer means "go back to a
// working system". The learner toggles what each past release changed,
// then attempts a rollback and sees the verdict + RTO/RPO change.

const CHANGE_TYPES = {
  code:        { label: 'code-only',           tone: '#2a8a3e', reversible: 'instant'     },
  config:      { label: 'config change',       tone: '#1c6dd0', reversible: 'instant'     },
  add_mig:     { label: 'additive migration',  tone: '#1c6dd0', reversible: 'safe'        },
  drop_mig:    { label: 'destructive migration', tone: 'var(--accent)', reversible: 'broken' },
  backfill:    { label: 'data backfill',       tone: '#b9770e', reversible: 'irreversible' },
};

const INITIAL_RELEASES = [
  { v: 'v1.0', change: 'code',     note: 'initial release' },
  { v: 'v1.1', change: 'config',   note: 'tune feature flags' },
  { v: 'v1.2', change: 'add_mig',  note: 'add nullable column users.locale' },
  { v: 'v1.3', change: 'drop_mig', note: 'drop column users.legacy_id' },
  { v: 'v1.4', change: 'backfill', note: 'backfill orders.tax from logs' },
];

const DISASTERS = {
  bad_code: {
    label: 'Bad code deploy',
    summary: 'Latest release ships a NullPointerException on the checkout path. Errors > 5%.',
    plan: [
      { t: 't+0 min',  text: 'Pager fires. On-call confirms error spike correlates with deploy.' },
      { t: 't+2 min',  text: 'Re-route traffic to previous build via blue/green switch.' },
      { t: 't+3 min',  text: 'Errors drop. Post-mortem scheduled.' },
    ],
    rto: '3 min',
    rpo: '0',
    moral: 'Code-only rollback is the textbook easy case — what every other disaster wishes it was.',
  },
  bad_config: {
    label: 'Corrupted config',
    summary: 'A typo in the prod config (feature-flag rollout = 1000% instead of 10%) breaks throttling.',
    plan: [
      { t: 't+0 min',  text: 'Dashboards red. Revert config in config service.' },
      { t: 't+1 min',  text: 'Config propagates to fleet (TTL ~30s).' },
      { t: 't+2 min',  text: 'Recovered. No code redeploy needed.' },
    ],
    rto: '2 min',
    rpo: '0',
    moral: 'Config rollbacks are even faster than code — assuming config is versioned.',
  },
  region_out: {
    label: 'Region outage',
    summary: 'us-east-1 is gone. Your DB primary, your cache, your queues all sit there.',
    plan: [
      { t: 't+0 min',   text: 'Cloud provider declares incident. No ETA.' },
      { t: 't+5 min',   text: 'DNS fail-over to us-west-2 standby region.' },
      { t: 't+15 min',  text: 'Promote replica DB. Replication lag = last RPO commit.' },
      { t: 't+30 min',  text: 'Warm caches; backpressure on queues drains.' },
    ],
    rto: '30 min',
    rpo: '~30 sec',
    moral: 'RTO and RPO stop being theoretical the moment a region disappears.',
  },
  ransomware: {
    label: 'DB ransomware / corruption',
    summary: 'Attacker encrypted the primary AND the synchronous replica. Async backup is 4h old.',
    plan: [
      { t: 't+0 min',     text: 'Isolate the blast radius. Take affected services offline.' },
      { t: 't+30 min',    text: 'Provision fresh DB cluster from latest clean snapshot.' },
      { t: 't+2 h',       text: 'Restore snapshot. Replay WAL up to last clean LSN.' },
      { t: 't+4 h',       text: 'Reconcile via idempotent re-ingest of last 4h of events (if you have them).' },
    ],
    rto: '4 h',
    rpo: '~4 h',
    moral: 'Snapshots are only as useful as the data you can replay on top of them.',
  },
};

const VERDICTS = {
  instant: {
    label: 'INSTANT',
    color: '#2a8a3e',
    bg: '#d9ead3',
    text: 'Code-only/config rollback. Swap the running build. No data implications.',
  },
  safe: {
    label: 'SAFE',
    color: '#1c6dd0',
    bg: '#d6e4f5',
    text: 'Additive migrations stay compatible — old code ignores the new column. Roll back the binary; leave the schema.',
  },
  broken: {
    label: 'BROKEN',
    color: 'var(--accent)',
    bg: '#fde2e2',
    text: 'A destructive migration dropped state the old code expects. Rolling back the binary against the new schema will crash. You must restore schema first, which means restoring data.',
  },
  irreversible: {
    label: 'IRREVERSIBLE',
    color: '#b9770e',
    bg: '#fff3cd',
    text: 'A backfill rewrote rows in place. There is no inverse — the prior values are gone. You can only roll forward.',
  },
};

// Worst (most fragile) wins: instant < safe < broken < irreversible.
const SEVERITY = { instant: 0, safe: 1, broken: 2, irreversible: 3 };

function evaluateRollback(releases, targetIdx) {
  // To roll back to release `targetIdx`, we must undo every release AFTER it.
  // The worst undo-step in that range determines the verdict.
  const undone = releases.slice(targetIdx + 1);
  if (undone.length === 0) {
    return { verdict: 'instant', steps: [], minutes: 0, dataLossSec: 0 };
  }
  let worst = 'instant';
  const steps = undone.map((r) => {
    const kind = CHANGE_TYPES[r.change].reversible;
    if (SEVERITY[kind] > SEVERITY[worst]) worst = kind;
    return { v: r.v, change: r.change, kind };
  });
  // Cheap heuristic so the metric tiles change as you toggle changes.
  const minutes = steps.reduce((acc, s) => {
    if (s.kind === 'instant') return acc + 1;
    if (s.kind === 'safe') return acc + 3;
    if (s.kind === 'broken') return acc + 90; // restore-from-snapshot territory
    if (s.kind === 'irreversible') return acc + 9999; // can't, really
    return acc;
  }, 0);
  const dataLossSec = steps.some((s) => s.kind === 'broken' || s.kind === 'irreversible') ? 1800 : 0;
  return { verdict: worst, steps, minutes, dataLossSec };
}

function formatMinutes(m) {
  if (m >= 9999) return '∞';
  if (m >= 60) return `${Math.round((m / 60) * 10) / 10} h`;
  return `${m} min`;
}

export default function RollbackWidget() {
  const [releases, setReleases] = useState(INITIAL_RELEASES);
  const [target, setTarget] = useState(null); // index of release to roll back to
  const [disasterKey, setDisasterKey] = useState('bad_code');

  function setChange(idx, change) {
    setReleases((rs) => rs.map((r, i) => (i === idx ? { ...r, change } : r)));
    setTarget(null); // any change invalidates the in-flight attempt
  }

  const disaster = DISASTERS[disasterKey];

  const attempt = useMemo(() => (target == null ? null : evaluateRollback(releases, target)), [releases, target]);
  const verdict = attempt ? VERDICTS[attempt.verdict] : null;

  // Aggregate "fleet recoverability" by inspecting every possible target.
  const fleetHealth = useMemo(() => {
    let worst = 'instant';
    for (let i = 0; i < releases.length - 1; i++) {
      const r = evaluateRollback(releases, i);
      if (SEVERITY[r.verdict] > SEVERITY[worst]) worst = r.verdict;
    }
    return worst;
  }, [releases]);

  return (
    <div className="widget">
      <div className="widget-title">Rollback & Disaster Recovery</div>
      <div className="widget-hint">
        Edit what each past release changed, then attempt a rollback. Watch how schema and data changes turn a 2-minute fix into a 4-hour restore.
      </div>

      {/* Release timeline */}
      <div className="widget-stage" style={{ minHeight: 'auto', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.6rem' }}>
          {releases.map((r, idx) => {
            const isLatest = idx === releases.length - 1;
            const tone = CHANGE_TYPES[r.change].tone;
            return (
              <motion.div
                key={r.v}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  border: `2px solid ${target === idx ? 'var(--accent)' : 'var(--ink)'}`,
                  background: 'var(--paper)',
                  borderRadius: 'var(--radius)',
                  padding: '0.6rem 0.8rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.6rem',
                  alignItems: 'center',
                }}
              >
                <div style={{ minWidth: 80 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', letterSpacing: '0.04em' }}>
                    {r.v} {isLatest && <span className="badge live" style={{ marginLeft: 4 }}>LIVE</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{r.note}</div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', flex: '1 1 auto' }}>
                  {Object.entries(CHANGE_TYPES).map(([key, def]) => (
                    <label
                      key={key}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        padding: '0.25em 0.55em',
                        border: '1.5px solid var(--ink)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: r.change === key ? def.tone : 'var(--paper)',
                        color: r.change === key ? 'white' : 'var(--ink)',
                        transition: 'background 0.15s',
                      }}
                    >
                      <input
                        type="radio"
                        name={`change-${idx}`}
                        checked={r.change === key}
                        onChange={() => setChange(idx, key)}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                      />
                      {def.label}
                    </label>
                  ))}
                </div>

                <button
                  className={`btn ${target === idx ? 'btn-accent' : ''}`}
                  disabled={isLatest}
                  onClick={() => setTarget(idx)}
                  style={{ fontSize: '0.8rem', padding: '0.35em 0.7em' }}
                >
                  {isLatest ? 'current' : `roll back to ${r.v}`}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Rollback verdict */}
      <AnimatePresence mode="wait">
        {attempt && verdict && (
          <motion.div
            key={`${target}-${attempt.verdict}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="callout"
            style={{ background: verdict.bg, borderColor: verdict.color }}
          >
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span
                className="badge"
                style={{
                  background: verdict.color,
                  color: 'white',
                  borderColor: verdict.color,
                }}
              >
                {verdict.label}
              </span>
              <strong style={{ fontFamily: 'var(--font-display)' }}>
                Rolling back to {releases[target].v} requires undoing {attempt.steps.length} release{attempt.steps.length === 1 ? '' : 's'}:
              </strong>
            </div>
            <ul style={{ margin: '0.2rem 0 0.4rem 1.2rem', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              {attempt.steps.map((s) => (
                <li key={s.v}>
                  {s.v} — {CHANGE_TYPES[s.change].label}{' '}
                  <span style={{ color: VERDICTS[s.kind].color, fontWeight: 600 }}>[{VERDICTS[s.kind].label}]</span>
                </li>
              ))}
            </ul>
            <div>{verdict.text}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disaster picker */}
      <div className="widget-title" style={{ fontSize: '1.05rem', marginTop: '1.4rem' }}>
        Disaster Recovery Drill
      </div>
      <div className="controls">
        {Object.entries(DISASTERS).map(([k, d]) => (
          <button
            key={k}
            className={`btn ${disasterKey === k ? 'btn-accent' : ''}`}
            onClick={() => setDisasterKey(k)}
            style={{ fontSize: '0.85rem' }}
          >
            <input
              type="radio"
              name="disaster"
              checked={disasterKey === k}
              onChange={() => setDisasterKey(k)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            {d.label}
          </button>
        ))}
      </div>

      <motion.div
        key={disasterKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="callout"
      >
        <div style={{ marginBottom: '0.5rem' }}>{disaster.summary}</div>
        <ol style={{ margin: '0 0 0.4rem 1.2rem', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
          {disaster.plan.map((step, i) => (
            <li key={i} style={{ margin: '0.15em 0' }}>
              <span style={{ color: 'var(--ink-faint)', marginRight: '0.5em' }}>{step.t}</span>
              {step.text}
            </li>
          ))}
        </ol>
        <div style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>{disaster.moral}</div>
      </motion.div>

      {/* Metrics */}
      <div className="metrics">
        <div className="metric">
          <div className="label">Disaster RTO</div>
          <div className="value">{disaster.rto}</div>
        </div>
        <div className="metric">
          <div className="label">Disaster RPO</div>
          <div className="value">{disaster.rpo}</div>
        </div>
        <div className={`metric ${attempt && attempt.verdict !== 'instant' && attempt.verdict !== 'safe' ? 'accent' : ''}`}>
          <div className="label">Rollback RTO</div>
          <div className="value">{attempt ? formatMinutes(attempt.minutes) : '—'}</div>
        </div>
        <div className={`metric ${attempt && attempt.dataLossSec > 0 ? 'accent' : ''}`}>
          <div className="label">Rollback RPO</div>
          <div className="value">{attempt ? (attempt.dataLossSec > 0 ? `~${attempt.dataLossSec / 60} min` : '0') : '—'}</div>
        </div>
        <div className={`metric ${SEVERITY[fleetHealth] >= 2 ? 'accent' : ''}`}>
          <div className="label">Fleet recoverability</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>{VERDICTS[fleetHealth].label}</div>
        </div>
      </div>

      <div className="widget-hint" style={{ marginTop: '0.8rem' }}>
        <strong>RTO</strong> = Recovery Time Objective (how long until we're back up).{' '}
        <strong>RPO</strong> = Recovery Point Objective (how much data we accept losing).
        The cheap rollback story (instant binary swap) only holds while every change between you and the target is code or additive schema.
        The moment a destructive migration or backfill is in the way, "rollback" becomes "restore" — and restore is measured in hours.
      </div>
    </div>
  );
}
