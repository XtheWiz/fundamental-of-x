import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Two scenarios side by side:
//   A) Naive dual-write — fails when the broker is down
//   B) Outbox pattern — survives the same failure
//
// Each scenario walks through 4 steps. Watching them side by side makes
// the "why" of the pattern obvious: in scenario A the order exists in
// the DB but the event never reaches the broker. In B, the event is
// safely in the outbox until the relay publishes it.

const SCENARIOS = {
  naive: {
    name: 'Naive dual-write',
    steps: [
      { caption: 'Service handles "place order" request.',                 state: { dbOrder: false, dbOutbox: null, brokerMsg: false } },
      { caption: 'Write order row to DB. Committed.',                       state: { dbOrder: true,  dbOutbox: null, brokerMsg: false } },
      { caption: 'Publish "order placed" to broker — but broker is DOWN.',  state: { dbOrder: true,  dbOutbox: null, brokerMsg: false, brokerError: true } },
      { caption: 'DB has the order. Broker has nothing. Inconsistent state.', state: { dbOrder: true,  dbOutbox: null, brokerMsg: false, finalBad: true } },
    ],
  },
  outbox: {
    name: 'Transactional outbox',
    steps: [
      { caption: 'Service handles "place order" request.',                                 state: { dbOrder: false, dbOutbox: null,  brokerMsg: false } },
      { caption: 'BEGIN TX → write order row AND outbox row → COMMIT. Both atomic.',       state: { dbOrder: true,  dbOutbox: 'pending', brokerMsg: false } },
      { caption: 'Even if broker is DOWN — order is committed, event safely in outbox.',   state: { dbOrder: true,  dbOutbox: 'pending', brokerMsg: false, brokerError: true } },
      { caption: 'Relay polls outbox, publishes, marks row done. (Retries until success.)', state: { dbOrder: true,  dbOutbox: 'done',    brokerMsg: true } },
    ],
  },
};

// Layout coords for the SVG flow diagram.
const POS = {
  service: { x: 50,  y: 90, label: 'Service' },
  db:      { x: 240, y: 90, label: 'Database' },
  relay:   { x: 430, y: 90, label: 'Outbox relay' },
  broker:  { x: 600, y: 90, label: 'Message broker' },
};

function Box({ x, y, w = 100, h = 60, fill = 'var(--paper)', stroke = 'var(--ink)', label, sublabel, shake }) {
  return (
    <motion.g
      animate={shake ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={2.5} rx={6} />
      <text x={x} y={y - 4} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{label}</text>
      {sublabel && (
        <text x={x} y={y + 14} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
          {sublabel}
        </text>
      )}
    </motion.g>
  );
}

function Arrow({ from, to, color = 'var(--ink)', dashed, label }) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;
  const padFrom = 52, padTo = 56;
  const x1 = from.x + ux * padFrom, y1 = from.y + uy * padFrom;
  const x2 = to.x - ux * padTo,   y2 = to.y - uy * padTo;
  const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5}
        strokeDasharray={dashed ? '5 4' : undefined} markerEnd="url(#arr-end)" />
      {label && (
        <text x={midX} y={midY - 8} textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: color, fontWeight: 600 }}>{label}</text>
      )}
    </motion.g>
  );
}

export default function OutboxWidget() {
  const [scenarioKey, setScenarioKey] = useState('naive');
  const [stepIdx, setStepIdx] = useState(0);
  const scenario = SCENARIOS[scenarioKey];
  const step = scenario.steps[stepIdx];
  const s = step.state;

  function pickScenario(k) { setScenarioKey(k); setStepIdx(0); }
  function nextStep() { setStepIdx((i) => Math.min(scenario.steps.length - 1, i + 1)); }
  function reset() { setStepIdx(0); }

  return (
    <div className="widget">
      <div className="widget-title">Outbox — survive the dual-write problem</div>
      <div className="controls">
        {Object.entries(SCENARIOS).map(([k, v]) => (
          <button key={k} className={`btn ${scenarioKey === k ? 'btn-accent' : ''}`} onClick={() => pickScenario(k)}>
            {v.name}
          </button>
        ))}
      </div>
      <div className="controls">
        <button className="btn btn-accent" onClick={nextStep} disabled={stepIdx >= scenario.steps.length - 1}>
          Next step
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          Step {stepIdx + 1} / {scenario.steps.length}
        </span>
      </div>

      <div className="widget-stage" style={{ minHeight: 240 }}>
        <svg viewBox="0 0 700 200" width="100%" style={{ maxWidth: 700 }}>
          <defs>
            <marker id="arr-end" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--ink)" />
            </marker>
          </defs>

          <Box {...POS.service} sublabel="POST /orders" />

          {/* Database with two compartments */}
          <motion.g animate={{ y: 0 }}>
            <rect x={POS.db.x - 60} y={POS.db.y - 36} width={120} height={72} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2.5} rx={6} />
            <text x={POS.db.x} y={POS.db.y - 22} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>Database</text>
            {/* orders row */}
            <rect x={POS.db.x - 52} y={POS.db.y - 12} width={104} height={20} rx={3}
              fill={s.dbOrder ? '#2a8a3e' : 'var(--paper-deep)'} stroke="var(--ink)" strokeWidth={1.5}
              style={{ transition: 'fill 0.2s ease' }} />
            <text x={POS.db.x} y={POS.db.y + 2} textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, fill: s.dbOrder ? 'white' : 'var(--ink-faint)' }}>
              orders: {s.dbOrder ? '1 row' : 'empty'}
            </text>
            {/* outbox row */}
            <rect x={POS.db.x - 52} y={POS.db.y + 12} width={104} height={20} rx={3}
              fill={s.dbOutbox === 'pending' ? 'var(--accent)' : s.dbOutbox === 'done' ? '#1c6dd0' : 'var(--paper-deep)'}
              stroke="var(--ink)" strokeWidth={1.5}
              style={{ transition: 'fill 0.2s ease' }} />
            <text x={POS.db.x} y={POS.db.y + 26} textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, fill: s.dbOutbox ? 'white' : 'var(--ink-faint)' }}>
              outbox: {s.dbOutbox || (scenarioKey === 'naive' ? '—' : 'empty')}
            </text>
          </motion.g>

          {scenarioKey === 'outbox' && <Box {...POS.relay} sublabel={s.dbOutbox === 'done' ? 'published ✓' : 'polling…'} />}

          <Box {...POS.broker}
            fill={s.brokerError ? '#fde2e2' : s.brokerMsg ? '#d9ead3' : 'var(--paper)'}
            stroke={s.brokerError ? 'var(--accent)' : 'var(--ink)'}
            sublabel={s.brokerError ? '⚠ DOWN' : s.brokerMsg ? '1 message' : 'idle'}
            shake={s.brokerError && stepIdx === 2} />

          <AnimatePresence>
            {/* service → db arrow */}
            {stepIdx >= 1 && <Arrow key="s-db" from={POS.service} to={POS.db} label="write" />}

            {/* db → broker arrow only for naive (the direct, failing dual write) */}
            {scenarioKey === 'naive' && stepIdx >= 2 && (
              <Arrow key="db-b" from={POS.db} to={POS.broker} color={s.brokerError ? 'var(--accent)' : 'var(--ink)'}
                dashed label={s.brokerError ? 'FAIL' : 'publish'} />
            )}

            {/* outbox-flavor arrows */}
            {scenarioKey === 'outbox' && stepIdx >= 3 && (
              <>
                <Arrow key="db-r" from={POS.db} to={POS.relay} label="poll" />
                <Arrow key="r-b" from={POS.relay} to={POS.broker} label="publish" />
              </>
            )}
          </AnimatePresence>
        </svg>
      </div>

      <div className="callout">
        <strong>Step {stepIdx + 1}.</strong> {step.caption}
        {step.state.finalBad && <div style={{ marginTop: '0.4rem', color: 'var(--accent)' }}>⚠ This is the dual-write bug — the whole problem the outbox pattern solves.</div>}
        {scenarioKey === 'outbox' && stepIdx === scenario.steps.length - 1 && (
          <div style={{ marginTop: '0.4rem', color: '#2a8a3e' }}>✓ DB and broker stay in lockstep even if the broker (or the relay) was temporarily down.</div>
        )}
      </div>
    </div>
  );
}
