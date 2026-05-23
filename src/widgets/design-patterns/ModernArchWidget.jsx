import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Pedagogical pivot: the legacy widget was a static reference card.
// This version turns it into a decision tool — the learner toggles the
// real architectural problems they face, and the patterns re-rank live.
// That makes the "when do I reach for this?" intuition concrete instead
// of memorized.

const REQUIREMENTS = [
  { id: 'splitRW',   label: 'Separate read and write models' },
  { id: 'audit',     label: 'Full audit trail of every change' },
  { id: 'timeTravel',label: 'Reproduce state at any past point in time' },
  { id: 'tolerate',  label: 'Tolerate downstream service failure' },
  { id: 'distTx',    label: 'Cross-service distributed transaction' },
  { id: 'noDualWrite', label: 'Reliable publish-after-DB-write (no dual-write bug)' },
  { id: 'decouple',  label: 'Decouple UI from domain logic' },
];

// Each pattern declares which requirements it directly addresses.
// Scoring is "how many checked boxes does this pattern actually solve?"
const PATTERNS = [
  {
    id: 'mvc',
    label: 'MVC / MVVM',
    sub: 'Separation of presentation',
    solves: { decouple: true },
    why: 'Splits user-facing concerns (View, Controller, Model) so domain logic is not entangled with UI plumbing.',
  },
  {
    id: 'cqrs',
    label: 'CQRS',
    sub: 'Different models for reads and writes',
    solves: { splitRW: true, decouple: true },
    why: 'Commands and queries take different shapes and scale paths — model them separately instead of forcing one schema to serve both.',
  },
  {
    id: 'es',
    label: 'Event Sourcing',
    sub: 'Store changes, not state',
    solves: { audit: true, timeTravel: true, splitRW: true },
    why: 'The append-only event log IS the source of truth. Audit and historical replay come for free; current state is a fold.',
  },
  {
    id: 'cb',
    label: 'Circuit Breaker',
    sub: 'Fail fast when upstream is broken',
    solves: { tolerate: true },
    why: 'Stops calling a failing dependency once errors exceed a threshold, preventing cascading failures across services.',
  },
  {
    id: 'saga',
    label: 'Saga',
    sub: 'Distributed transaction via compensation',
    solves: { distTx: true, tolerate: true },
    why: 'Long-running cross-service workflow: each step has a compensating action, so you can unwind partial progress without 2PC.',
  },
  {
    id: 'outbox',
    label: 'Outbox',
    sub: 'Atomic write + reliable publish',
    solves: { noDualWrite: true, tolerate: true },
    why: 'Writes the event row in the same DB transaction as the business state, then a relay publishes — no dual-write window.',
  },
];

// Tiny per-pattern glyphs. Kept deliberately small — the chooser is the star.
function MiniDiagram({ id }) {
  const stroke = 'var(--ink)';
  const fill = 'var(--paper-deep)';
  const common = { stroke, strokeWidth: 1.5, fill };
  switch (id) {
    case 'mvc':
      return (
        <svg viewBox="0 0 80 40" width="80" height="40" aria-hidden="true">
          <rect x="2" y="12" width="20" height="16" rx="2" {...common} />
          <rect x="30" y="12" width="20" height="16" rx="2" {...common} />
          <rect x="58" y="12" width="20" height="16" rx="2" {...common} />
          <line x1="22" y1="20" x2="30" y2="20" stroke={stroke} />
          <line x1="50" y1="20" x2="58" y2="20" stroke={stroke} />
        </svg>
      );
    case 'cqrs':
      return (
        <svg viewBox="0 0 80 40" width="80" height="40" aria-hidden="true">
          <rect x="2" y="4" width="22" height="14" rx="2" {...common} />
          <rect x="2" y="22" width="22" height="14" rx="2" {...common} />
          <rect x="56" y="13" width="22" height="14" rx="2" {...common} />
          <line x1="24" y1="11" x2="56" y2="20" stroke={stroke} />
          <line x1="24" y1="29" x2="56" y2="20" stroke={stroke} />
        </svg>
      );
    case 'es':
      return (
        <svg viewBox="0 0 80 40" width="80" height="40" aria-hidden="true">
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={2 + i*15} y="14" width="12" height="12" rx="1" {...common} />
          ))}
        </svg>
      );
    case 'cb':
      return (
        <svg viewBox="0 0 80 40" width="80" height="40" aria-hidden="true">
          <circle cx="20" cy="20" r="10" {...common} />
          <circle cx="60" cy="20" r="10" {...common} />
          <line x1="30" y1="20" x2="44" y2="20" stroke={stroke} strokeWidth="1.5" />
          <line x1="46" y1="14" x2="54" y2="26" stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case 'saga':
      return (
        <svg viewBox="0 0 80 40" width="80" height="40" aria-hidden="true">
          {[0,1,2].map(i => (
            <rect key={i} x={4 + i*26} y="14" width="20" height="12" rx="2" {...common} />
          ))}
          <line x1="24" y1="20" x2="30" y2="20" stroke={stroke} />
          <line x1="50" y1="20" x2="56" y2="20" stroke={stroke} />
          <path d="M 70 26 Q 40 38 14 26" fill="none" stroke={stroke} strokeDasharray="3 2" />
        </svg>
      );
    case 'outbox':
      return (
        <svg viewBox="0 0 80 40" width="80" height="40" aria-hidden="true">
          <rect x="2" y="6" width="28" height="12" rx="2" {...common} />
          <rect x="2" y="22" width="28" height="12" rx="2" fill="var(--accent)" stroke={stroke} strokeWidth="1.5" />
          <rect x="56" y="14" width="22" height="12" rx="2" {...common} />
          <line x1="30" y1="28" x2="56" y2="20" stroke={stroke} />
        </svg>
      );
    default:
      return null;
  }
}

function scorePattern(pattern, checkedSet) {
  if (checkedSet.size === 0) return 0;
  let hits = 0;
  for (const req of checkedSet) if (pattern.solves[req]) hits++;
  return hits;
}

export default function ModernArchWidget() {
  const [checked, setChecked] = useState(() => new Set());

  function toggle(id) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function clearAll() { setChecked(new Set()); }

  const ranked = useMemo(() => {
    const withScores = PATTERNS.map(p => ({ ...p, score: scorePattern(p, checked) }));
    // Stable secondary order by original index so neutral state is deterministic.
    return withScores
      .map((p, i) => ({ ...p, _orig: i }))
      .sort((a, b) => b.score - a.score || a._orig - b._orig);
  }, [checked]);

  const topScore = ranked[0]?.score ?? 0;
  const hasSignal = checked.size > 0 && topScore > 0;
  const checkedCount = checked.size;

  return (
    <div className="widget">
      <div className="widget-title">Pick your problems — find the pattern</div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
        Check the architectural problems you actually have. Patterns re-rank by how many they solve.
      </div>

      <div className="controls" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
        {REQUIREMENTS.map(r => {
          const on = checked.has(r.id);
          return (
            <button
              key={r.id}
              className={`btn ${on ? 'btn-accent' : ''}`}
              onClick={() => toggle(r.id)}
              style={{ fontSize: '0.82rem' }}
              aria-pressed={on}
            >
              <span style={{ fontFamily: 'var(--font-mono)', marginRight: '0.4em' }}>
                [{on ? 'x' : ' '}]
              </span>
              {r.label}
            </button>
          );
        })}
      </div>

      <div className="controls">
        <button className="btn btn-ghost" onClick={clearAll} disabled={checkedCount === 0}>
          Clear
        </button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          {checkedCount === 0 ? 'No requirements — neutral ranking' : `${checkedCount} requirement${checkedCount === 1 ? '' : 's'} checked`}
        </span>
      </div>

      <div className="widget-stage" style={{ minHeight: 320, padding: '0.6rem' }}>
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.7rem' }}>
          <AnimatePresence initial={false}>
            {ranked.map((p, idx) => {
              const isTop = hasSignal && idx === 0 && p.score === topScore;
              const dim = checked.size > 0 && p.score === 0;
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: dim ? 0.55 : 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                  style={{
                    border: `2.5px solid ${isTop ? 'var(--accent)' : 'var(--ink)'}`,
                    borderRadius: 'var(--radius)',
                    background: 'var(--paper)',
                    padding: '0.7rem 0.8rem',
                    boxShadow: isTop ? '4px 4px 0 var(--accent)' : '3px 3px 0 var(--ink)',
                    position: 'relative',
                  }}
                >
                  {isTop && (
                    <span
                      className="badge"
                      style={{ position: 'absolute', top: -12, right: 10, background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }}
                    >
                      Top match
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.04em' }}>
                        {p.label}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                        {p.sub}
                      </div>
                    </div>
                    <MiniDiagram id={p.id} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.45rem 0 0.4rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Match
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: isTop ? 'var(--accent)' : 'var(--ink)' }}>
                      {p.score}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                      / {checkedCount || REQUIREMENTS.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.4rem' }}>
                    {REQUIREMENTS.map(r => {
                      const solves = !!p.solves[r.id];
                      const isChecked = checked.has(r.id);
                      // Three visual tiers: solved-and-checked (live), solved-but-not-checked (neutral),
                      // not-solved (faded). Plain text labels — no emojis.
                      const live = solves && isChecked;
                      const known = solves && !isChecked;
                      return (
                        <span
                          key={r.id}
                          className={`badge ${live ? 'live' : ''}`}
                          title={r.label}
                          style={{
                            fontSize: '0.62rem',
                            margin: 0,
                            opacity: known ? 0.85 : solves ? 1 : 0.35,
                            borderStyle: solves ? 'solid' : 'dashed',
                          }}
                        >
                          <span style={{ marginRight: '0.3em', fontWeight: 700 }}>
                            {solves ? 'yes' : 'no'}
                          </span>
                          {shortLabel(r.id)}
                        </span>
                      );
                    })}
                  </div>

                  {isTop && (
                    <div style={{ fontSize: '0.83rem', color: 'var(--ink)', borderTop: '1.5px dashed var(--ink-soft)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-soft)', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: '0.4em' }}>
                        Why
                      </span>
                      {p.why}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="callout">
        {checkedCount === 0 ? (
          <>Tick one or more problems above. The patterns reorder live — the closest match floats to the top with a short explanation of why.</>
        ) : topScore === 0 ? (
          <>None of these six patterns directly addresses the boxes you ticked. Combine with patterns from earlier lessons (Strategy, Observer, Repository) — or reconsider whether the requirement is real.</>
        ) : (
          <>
            <strong>{ranked[0].label}</strong> covers {topScore} of your {checkedCount} checked requirement{checkedCount === 1 ? '' : 's'}.
            Real systems usually stack patterns — e.g. <em>CQRS + Event Sourcing + Outbox</em> together — rather than picking one.
          </>
        )}
      </div>
    </div>
  );
}

function shortLabel(id) {
  switch (id) {
    case 'splitRW': return 'split R/W';
    case 'audit': return 'audit';
    case 'timeTravel': return 'time-travel';
    case 'tolerate': return 'tolerate fail';
    case 'distTx': return 'dist. tx';
    case 'noDualWrite': return 'no dual-write';
    case 'decouple': return 'decouple UI';
    default: return id;
  }
}
