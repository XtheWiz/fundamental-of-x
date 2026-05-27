import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Compare three deployment strategies side-by-side on the same release.
// User picks a strategy, flips a "bug" toggle, picks replica count, then
// hits Deploy. We simulate traffic shifting from V1 to V2 per the strategy
// and accumulate error/detection/overhead metrics. Rollback shows that
// blue-green can revert almost instantly (hot V1 fleet) while rolling has
// to recreate V1 replicas one by one. Numbers are toy values.

const STRATEGIES = {
  bluegreen: {
    name: 'Blue-Green',
    steps: [
      { v1: 100, v2: 0,   label: 'V2 fleet warming (no traffic yet)' },
      { v1: 100, v2: 0,   label: 'V2 ready, smoke-tested off-prod' },
      { v1: 0,   v2: 100, label: 'Cutover: 100% traffic flips to V2' },
    ],
    overhead: 1.0,
    rollbackMs: 250,
  },
  canary: {
    name: 'Canary',
    steps: [
      { v1: 95, v2: 5,   label: 'Canary at 5% — watching errors' },
      { v1: 75, v2: 25,  label: 'Ramping to 25%' },
      { v1: 50, v2: 50,  label: 'Half-and-half' },
      { v1: 0,  v2: 100, label: 'Full rollout at 100%' },
    ],
    overhead: 0.1,
    rollbackMs: 600,
  },
  rolling: {
    name: 'Rolling',
    steps: [
      { v1: 75, v2: 25, label: '25% of replicas swapped to V2' },
      { v1: 50, v2: 50, label: '50% swapped' },
      { v1: 25, v2: 75, label: '75% swapped' },
      { v1: 0,  v2: 100, label: '100% swapped — V1 is gone' },
    ],
    overhead: 0.0,
    rollbackMs: 1800,
  },
};

const REQ_PER_REPLICA_PER_SEC = 50; // toy throughput
const BUG_ERROR_RATE = 0.01;        // 1% errors on V2 when buggy
const DETECT_ERROR_THRESHOLD = 8;   // we "detect" the bug once this many V2 errors observed
const STEP_DURATION_MS = 900;       // wall-clock time per shift step in the animation

function pct(n) { return `${Math.round(n)}%`; }

function FleetBar({ v1Share, v2Share, replicas }) {
  const v1Reps = Math.round((v1Share / 100) * replicas);
  const labelStyle = {
    color: 'white', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontFamily: 'var(--font-mono)',
    fontSize: 11, fontWeight: 600,
  };
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', height: 36, border: '2px solid var(--ink)',
        borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--paper-deep)',
      }}>
        <motion.div
          animate={{ width: `${v1Share}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{
            ...labelStyle, background: '#1c6dd0',
            borderRight: v1Share > 0 && v2Share > 0 ? '2px solid var(--ink)' : 'none',
          }}
        >
          {v1Share > 8 ? `V1 ${pct(v1Share)}` : v1Share > 0 ? 'V1' : ''}
        </motion.div>
        <motion.div
          animate={{ width: `${v2Share}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ ...labelStyle, background: 'var(--accent)' }}
        >
          {v2Share > 8 ? `V2 ${pct(v2Share)}` : v2Share > 0 ? 'V2' : ''}
        </motion.div>
      </div>
      <div style={{
        marginTop: 6, display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)',
      }}>
        <span>V1 replicas: {v1Reps}</span>
        <span>V2 replicas: {replicas - v1Reps}</span>
      </div>
    </div>
  );
}

function ReplicaGrid({ v1Share, replicas, rolling }) {
  // Little dots representing each replica.
  const v1Count = Math.round((v1Share / 100) * replicas);
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8, padding: 6,
      background: 'var(--paper-deep)', border: '1.5px dashed var(--ink-faint)',
      borderRadius: 'var(--radius)',
    }}>
      {Array.from({ length: replicas }, (_, i) => {
        const isV1 = i < v1Count;
        const bg = rolling && i === v1Count
          ? 'var(--paper-deep)'
          : isV1 ? '#1c6dd0' : 'var(--accent)';
        return (
          <motion.span
            key={i}
            layout
            animate={{ background: bg }}
            transition={{ duration: 0.3 }}
            style={{
              width: 18, height: 18, borderRadius: 4,
              border: '1.5px solid var(--ink)', display: 'inline-block',
            }}
          />
        );
      })}
    </div>
  );
}

export default function DeploymentStrategiesWidget() {
  const [strategyKey, setStrategyKey] = useState('canary');
  const [buggy, setBuggy] = useState(true);
  const [replicas, setReplicas] = useState(10);

  const [phase, setPhase] = useState('idle'); // idle | deploying | done | rollingback | rolledback
  const [stepIdx, setStepIdx] = useState(-1);  // -1 means "before deploy" => V1 100%
  const [elapsedMs, setElapsedMs] = useState(0);
  const [v2Errors, setV2Errors] = useState(0);
  const [v1Reqs, setV1Reqs] = useState(0);
  const [v2Reqs, setV2Reqs] = useState(0);
  const [detectMs, setDetectMs] = useState(null);

  const timerRef = useRef(null);
  const tickRef = useRef(null);

  const strat = STRATEGIES[strategyKey];

  // Current traffic split: when idle/rolledback, all on V1.
  // When deploying, the current step. When done, the last step.
  const currentSplit = useMemo(() => {
    if (phase === 'idle' || phase === 'rolledback') return { v1: 100, v2: 0 };
    if (stepIdx < 0) return { v1: 100, v2: 0 };
    const s = strat.steps[Math.min(stepIdx, strat.steps.length - 1)];
    return { v1: s.v1, v2: s.v2 };
  }, [phase, stepIdx, strat]);

  // RPS per version, derived from current split + replicas + throughput.
  const rpsV1 = Math.round((currentSplit.v1 / 100) * replicas * REQ_PER_REPLICA_PER_SEC);
  const rpsV2 = Math.round((currentSplit.v2 / 100) * replicas * REQ_PER_REPLICA_PER_SEC);

  // Capacity overhead percentage during deploy.
  const overheadPct = phase === 'deploying' || phase === 'done'
    ? Math.round(strat.overhead * 100)
    : 0;

  function clearTimers() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (tickRef.current)  { clearInterval(tickRef.current); tickRef.current = null; }
  }

  function resetCounters() {
    setStepIdx(-1);
    setElapsedMs(0);
    setV1Reqs(0);
    setV2Reqs(0);
    setV2Errors(0);
    setDetectMs(null);
  }

  // Re-run deploy whenever the user nudges a knob: per the spec, every
  // strategy/bug/replicas change should re-animate.
  useEffect(() => {
    clearTimers();
    resetCounters();
    setPhase('idle');
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategyKey, buggy, replicas]);

  // The deploy "engine": advance through strategy.steps, accumulating
  // requests and errors per tick.
  function startDeploy() {
    clearTimers();
    resetCounters();
    setPhase('deploying');
    setStepIdx(0);

    let step = 0;
    timerRef.current = setInterval(() => {
      step += 1;
      if (step >= strat.steps.length) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setPhase('done');
        return;
      }
      setStepIdx(step);
    }, STEP_DURATION_MS);
  }

  // Counter tick: every 100ms accumulate served requests and possibly errors.
  useEffect(() => {
    if (phase !== 'deploying' && phase !== 'done') return undefined;

    const TICK_MS = 100;
    tickRef.current = setInterval(() => {
      setElapsedMs((t) => t + TICK_MS);

      // requests served in this tick = (rps * tick / 1000), rounded.
      const dV1 = (rpsV1 * TICK_MS) / 1000;
      const dV2 = (rpsV2 * TICK_MS) / 1000;
      setV1Reqs((r) => r + dV1);
      setV2Reqs((r) => r + dV2);

      if (buggy && dV2 > 0) {
        // Poisson-ish: expected errors per tick = dV2 * BUG_ERROR_RATE.
        const expected = dV2 * BUG_ERROR_RATE;
        // Use a deterministic-ish sample so small numbers still tick up.
        const sample = expected + (Math.random() - 0.5) * expected;
        setV2Errors((e) => e + Math.max(0, sample));
      }
    }, TICK_MS);

    return () => {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    };
  }, [phase, rpsV1, rpsV2, buggy]);

  // Detect the bug once errors cross threshold.
  useEffect(() => {
    if (detectMs === null && buggy && v2Errors >= DETECT_ERROR_THRESHOLD) {
      setDetectMs(elapsedMs);
    }
  }, [v2Errors, buggy, detectMs, elapsedMs]);

  function startRollback() {
    clearTimers();
    setPhase('rollingback');
    // Snap to "all V1" — but how fast we render that depends on strategy.
    // Blue-green: instant. Canary: medium. Rolling: slow, with stages.
    if (strategyKey === 'bluegreen') {
      setStepIdx(-1);
      timerRef.current = setTimeout(() => setPhase('rolledback'), strat.rollbackMs);
    } else {
      // Walk backwards through steps with delays proportional to rollbackMs.
      const stepsLeft = Math.max(1, stepIdx + 1);
      const perStep = Math.round(strat.rollbackMs / stepsLeft);
      let i = stepIdx;
      const back = () => {
        i -= 1;
        if (i < 0) {
          setStepIdx(-1);
          setPhase('rolledback');
          return;
        }
        setStepIdx(i);
        timerRef.current = setTimeout(back, perStep);
      };
      timerRef.current = setTimeout(back, perStep);
    }
  }

  const errorsRounded = Math.round(v2Errors);
  const totalReqs = Math.round(v1Reqs + v2Reqs);

  const detectDisplay = detectMs === null
    ? (buggy && (phase === 'done' || phase === 'rollingback' || phase === 'rolledback')
        ? '— (not yet)'
        : '—')
    : `${(detectMs / 1000).toFixed(1)}s`;

  return (
    <div className="widget">
      <div className="widget-title">Deployment Strategies — Blue-Green, Canary, Rolling</div>
      <div className="widget-hint">
        Pick a strategy and a release quality, then deploy. Watch traffic shift
        from V1 to V2 and see how each strategy contains a buggy release.
      </div>

      <div className="controls">
        <label>Strategy:</label>
        <div className="pill-group" role="radiogroup" aria-label="Strategy">
          {Object.entries(STRATEGIES).map(([k, v]) => (
            <span key={k}>
              <input type="radio" id={`strat-${k}`} name="strategy"
                checked={strategyKey === k} onChange={() => setStrategyKey(k)} />
              <label htmlFor={`strat-${k}`}>{v.name}</label>
            </span>
          ))}
        </div>
      </div>

      <div className="controls">
        <label>Release:</label>
        <div className="pill-group" role="radiogroup" aria-label="Release quality">
          <span>
            <input type="radio" id="bug-no" name="buggy" checked={!buggy} onChange={() => setBuggy(false)} />
            <label htmlFor="bug-no">Good</label>
          </span>
          <span>
            <input type="radio" id="bug-yes" name="buggy" checked={buggy} onChange={() => setBuggy(true)} />
            <label htmlFor="bug-yes">Buggy (1% errors)</label>
          </span>
        </div>
      </div>

      <div className="controls">
        <label htmlFor="reps">Replicas: {replicas}</label>
        <input
          id="reps" type="range" min={4} max={20} step={1} value={replicas}
          onChange={(e) => setReplicas(parseInt(e.target.value, 10))}
          style={{ flex: '1 1 200px', maxWidth: 280 }}
        />
        <button className="btn btn-accent" onClick={startDeploy}
          disabled={phase === 'deploying' || phase === 'rollingback'}>Deploy V2</button>
        <button className="btn" onClick={startRollback}
          disabled={!(phase === 'deploying' || phase === 'done')}>Rollback</button>
      </div>

      <div className="widget-stage" style={{ minHeight: 180 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span className="badge live">{strat.name}</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)',
          }}>
            Phase: {phase}
            {phase === 'deploying' && stepIdx >= 0 && ` — step ${stepIdx + 1}/${strat.steps.length}`}
          </span>
        </div>

        <FleetBar v1Share={currentSplit.v1} v2Share={currentSplit.v2} replicas={replicas} />
        <ReplicaGrid
          v1Share={currentSplit.v1}
          replicas={replicas}
          rolling={strategyKey === 'rolling' && phase === 'rollingback'}
        />

        <AnimatePresence mode="wait">
          {phase !== 'idle' && stepIdx >= 0 && (
            <motion.div
              key={`${phase}-${stepIdx}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                marginTop: 10, fontFamily: 'var(--font-mono)',
                fontSize: 12, color: 'var(--ink)',
              }}
            >
              {phase === 'rollingback' ? 'Rolling back: ' : ''}
              {strat.steps[Math.min(stepIdx, strat.steps.length - 1)].label}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">V1 req/s</div>
          <div className="value">{rpsV1}</div>
        </div>
        <div className="metric">
          <div className="label">V2 req/s</div>
          <div className="value">{rpsV2}</div>
        </div>
        <div className={`metric ${errorsRounded > 0 ? 'accent' : ''}`}>
          <div className="label">Errors (V2)</div>
          <div className="value">{errorsRounded}</div>
        </div>
        <div className="metric">
          <div className="label">Detect bug</div>
          <div className="value" style={{ fontSize: '1.15rem' }}>{detectDisplay}</div>
        </div>
        <div className="metric">
          <div className="label">Overhead</div>
          <div className="value">{overheadPct}%</div>
        </div>
        <div className="metric">
          <div className="label">Total served</div>
          <div className="value">{totalReqs}</div>
        </div>
      </div>

      <div className="callout">
        {strategyKey === 'bluegreen' && (
          <span>
            <strong>Blue-Green.</strong> A full V2 fleet runs alongside V1, so cutover
            is an instant traffic flip and so is the rollback. The price is{' '}
            <strong>100% capacity overhead</strong> during the deploy. If the release
            is buggy, every error happens at full traffic the moment you cut over —
            blue-green doesn't protect you, but it gives you the fastest{' '}
            <strong>{strat.rollbackMs} ms</strong> recovery.
          </span>
        )}
        {strategyKey === 'canary' && (
          <span>
            <strong>Canary.</strong> Traffic ramps 5% → 25% → 50% → 100%. A buggy
            release hits only a slice of users at first, so you detect it on
            tiny traffic and abort before full rollout. Overhead is ~10% for
            the canary slice. Rollback is fast (~{strat.rollbackMs} ms) — drain
            the canary fleet and you're back on V1.
          </span>
        )}
        {strategyKey === 'rolling' && (
          <span>
            <strong>Rolling.</strong> Replicas are swapped in place, V1 → V2, a
            few at a time. <strong>Zero capacity overhead</strong> — but no V1
            fleet to fall back to, so rollback means re-creating V1 replicas one
            by one (~{strat.rollbackMs} ms here). A buggy release leaks into
            production gradually as the V2 share grows.
          </span>
        )}
      </div>
    </div>
  );
}
