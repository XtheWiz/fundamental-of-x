import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Three pathologies, each driven by user-controlled inputs.
// Diagrams update live as inputs change; "Run" steps a simulation forward.

const MODES = { deadlock: 'Deadlock', livelock: 'Livelock', starvation: 'Starvation' };

export default function DeadlockWidget() {
  const [mode, setMode] = useState('deadlock');
  return (
    <div className="widget">
      <div className="widget-title">Three ways concurrent programs hang</div>
      <div className="controls">
        {Object.entries(MODES).map(([k, label]) => (
          <button key={k} className={`btn ${mode === k ? 'btn-accent' : ''}`} onClick={() => setMode(k)}>{label}</button>
        ))}
      </div>
      {mode === 'deadlock'   && <DeadlockScenario />}
      {mode === 'livelock'   && <LivelockScenario />}
      {mode === 'starvation' && <StarvationScenario />}
    </div>
  );
}

/* DEADLOCK ---------------------------------------------------------- */

function DeadlockScenario() {
  const [orderA, setOrderA] = useState('L1-L2');
  const [orderB, setOrderB] = useState('L2-L1');
  const [tick, setTick] = useState(0);
  const timer = useRef(null);

  // Cycle exists only when the two threads grab the same locks in opposite orders.
  const willDeadlock = orderA !== orderB;

  const stateAt = (first, second) => {
    if (tick === 0) return { holds: [], wants: null, done: false, blocked: false };
    if (tick === 1) return { holds: [first], wants: null, done: false, blocked: false };
    if (willDeadlock) return { holds: [first], wants: second, done: false, blocked: true };
    if (tick === 2) return { holds: [first], wants: second, done: false, blocked: false };
    return { holds: [first, second], wants: null, done: true, blocked: false };
  };

  const [f1, s1] = orderA.split('-');
  const [f2, s2] = orderB.split('-');
  const t1 = stateAt(f1, s1);
  const t2 = stateAt(f2, s2);

  function run() {
    if (timer.current) clearInterval(timer.current);
    setTick(0);
    let step = 0;
    timer.current = setInterval(() => {
      step += 1; setTick(step);
      if (step >= 3) { clearInterval(timer.current); timer.current = null; }
    }, 700);
  }
  function reset() { if (timer.current) clearInterval(timer.current); timer.current = null; setTick(0); }
  useEffect(() => () => timer.current && clearInterval(timer.current), []);
  useEffect(() => { reset(); }, [orderA, orderB]);

  const finalState = tick === 0 ? 'idle' : willDeadlock && tick >= 2 ? 'deadlock' : tick >= 3 ? 'success' : 'running';
  const selectStyle = { padding: '0.3rem 0.5rem', fontFamily: 'var(--font-mono)', border: '2px solid var(--ink)', background: 'var(--paper)' };

  return (
    <>
      <div className="controls" style={{ gap: '1.2rem', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>T1 acquires:
          <select value={orderA} onChange={(e) => setOrderA(e.target.value)} style={selectStyle}>
            <option value="L1-L2">L1 then L2</option><option value="L2-L1">L2 then L1</option>
          </select>
        </label>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>T2 acquires:
          <select value={orderB} onChange={(e) => setOrderB(e.target.value)} style={selectStyle}>
            <option value="L1-L2">L1 then L2</option><option value="L2-L1">L2 then L1</option>
          </select>
        </label>
        <button className="btn btn-accent" onClick={run}>Run</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      <div className="widget-stage" style={{ minHeight: 280 }}>
        <svg viewBox="0 0 560 260" width="100%" style={{ maxWidth: 560 }}>
          <defs>
            <marker id="dl-hold" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><polygon points="0 0,10 5,0 10" fill="#2a8a3e" /></marker>
            <marker id="dl-want" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><polygon points="0 0,10 5,0 10" fill="var(--accent)" /></marker>
          </defs>
          <ThreadBox x={90}  y={50}  label="T1" state={t1} shake={willDeadlock && tick >= 2} />
          <ThreadBox x={470} y={210} label="T2" state={t2} shake={willDeadlock && tick >= 2} />
          <LockCircle x={210} y={130} label="L1" heldBy={t1.holds.includes('L1') ? 'T1' : t2.holds.includes('L1') ? 'T2' : null} />
          <LockCircle x={350} y={130} label="L2" heldBy={t1.holds.includes('L2') ? 'T1' : t2.holds.includes('L2') ? 'T2' : null} />
          <AnimatePresence>
            {t1.holds.includes('L1') && <ArrowLine key="t1hL1" from={{x:90,y:50}}   to={{x:210,y:130}} color="#2a8a3e" marker="dl-hold" label="holds" />}
            {t1.holds.includes('L2') && <ArrowLine key="t1hL2" from={{x:90,y:50}}   to={{x:350,y:130}} color="#2a8a3e" marker="dl-hold" label="holds" />}
            {t2.holds.includes('L1') && <ArrowLine key="t2hL1" from={{x:470,y:210}} to={{x:210,y:130}} color="#2a8a3e" marker="dl-hold" label="holds" />}
            {t2.holds.includes('L2') && <ArrowLine key="t2hL2" from={{x:470,y:210}} to={{x:350,y:130}} color="#2a8a3e" marker="dl-hold" label="holds" />}
            {t1.wants && <ArrowLine key="t1w" from={{x:90,y:50}}   to={t1.wants==='L1'?{x:210,y:130}:{x:350,y:130}} color="var(--accent)" marker="dl-want" dashed label="wants" />}
            {t2.wants && <ArrowLine key="t2w" from={{x:470,y:210}} to={t2.wants==='L1'?{x:210,y:130}:{x:350,y:130}} color="var(--accent)" marker="dl-want" dashed label="wants" />}
          </AnimatePresence>
        </svg>
      </div>

      <div className="callout">
        {finalState === 'idle'     && <><strong>Press Run.</strong> Each thread grabs its first lock, then asks for its second.</>}
        {finalState === 'running'  && <><strong>Running…</strong> step {tick} of 3.</>}
        {finalState === 'deadlock' && <span style={{ color: 'var(--accent)' }}><strong>Deadlock.</strong> Each thread holds one lock and waits for the other — circular wait. <strong>Fix:</strong> pick a global lock order (L1 always before L2) and use it everywhere.</span>}
        {finalState === 'success'  && <span style={{ color: '#2a8a3e' }}><strong>Both completed.</strong> Acquiring in the same order avoids the cycle entirely.</span>}
      </div>
    </>
  );
}

function ThreadBox({ x, y, label, state, shake }) {
  const fill = state.done ? '#d9ead3' : state.blocked ? '#fde2e2' : 'var(--paper)';
  return (
    <motion.g animate={shake ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }} transition={{ duration: 0.5, repeat: shake ? Infinity : 0, repeatDelay: 0.6 }}>
      <rect x={x - 55} y={y - 22} width={110} height={44} fill={fill} stroke="var(--ink)" strokeWidth={2.5} rx={6} />
      <text x={x} y={y - 4} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>{label}</text>
      <text x={x} y={y + 12} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>
        {state.done ? 'done' : state.blocked ? 'BLOCKED' : state.holds.length ? `holds ${state.holds.join(',')}` : 'idle'}
      </text>
    </motion.g>
  );
}

function LockCircle({ x, y, label, heldBy }) {
  return (
    <g>
      <circle cx={x} cy={y} r={28} fill={heldBy ? 'var(--accent-soft)' : 'var(--paper)'} stroke="var(--ink)" strokeWidth={2.5} />
      <text x={x} y={y + 1} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>{label}</text>
      <text x={x} y={y + 14} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>{heldBy ? `held by ${heldBy}` : 'free'}</text>
    </g>
  );
}

function ArrowLine({ from, to, color, marker, dashed, label }) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const x1 = from.x + ux * 56, y1 = from.y + uy * 56;
  const x2 = to.x   - ux * 32, y2 = to.y   - uy * 32;
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5} strokeDasharray={dashed ? '5 4' : undefined} markerEnd={`url(#${marker})`} />
      {label && <text x={(x1+x2)/2} y={(y1+y2)/2 - 6} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: color, fontWeight: 600 }}>{label}</text>}
    </motion.g>
  );
}

/* LIVELOCK ---------------------------------------------------------- */

function LivelockScenario() {
  const [jitter, setJitter] = useState(0);
  const [step, setStep] = useState(0);
  const [history, setHistory] = useState([]);
  const [progress, setProgress] = useState(0);
  const timer = useRef(null);

  function run() {
    if (timer.current) clearInterval(timer.current);
    setStep(0); setHistory([]); setProgress(0);
    let h = [], p = 0, s = 0;
    timer.current = setInterval(() => {
      // Each thread picks a back-off; identical back-offs mean another collision.
      const noise = jitter / 100;
      const b1 = 1 + Math.random() * noise * 4;
      const b2 = 1 + Math.random() * noise * 4;
      const escaped = Math.abs(b1 - b2) > 0.6;
      h = [...h.slice(-9), { t1: b1.toFixed(1), t2: b2.toFixed(1), escaped }];
      p = escaped ? p + 1 : p;
      s += 1;
      setHistory(h); setProgress(p); setStep(s);
      if (s >= 20) { clearInterval(timer.current); timer.current = null; }
    }, 250);
  }
  function reset() { if (timer.current) clearInterval(timer.current); timer.current = null; setStep(0); setHistory([]); setProgress(0); }
  useEffect(() => () => timer.current && clearInterval(timer.current), []);

  const last = history[history.length - 1];
  const colliding = last && !last.escaped;
  const stuck = jitter === 0 && step > 0;
  const cardStyle = { background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 4, padding: '0.8rem 1.2rem', boxShadow: '3px 3px 0 var(--ink)', minWidth: 110, textAlign: 'center' };

  return (
    <>
      <div className="controls" style={{ gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, minWidth: 280 }}>
          Back-off jitter: <strong style={{ fontFamily: 'var(--font-mono)', minWidth: 40 }}>{jitter}%</strong>
          <input type="range" min={0} max={100} step={5} value={jitter}
            onChange={(e) => { setJitter(+e.target.value); reset(); }} style={{ flex: 1 }} />
        </label>
        <button className="btn btn-accent" onClick={run}>Run 20 ticks</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      <div className="widget-stage" style={{ minHeight: 280, padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '0.8rem' }}>
          <motion.div animate={colliding ? { x: [0, 30, 0, 30, 0] } : { x: 0 }} transition={{ duration: 0.6, repeat: colliding ? Infinity : 0 }} style={cardStyle}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>T1</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>back-off {last ? last.t1 : '—'}</div>
          </motion.div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: colliding ? 'var(--accent)' : '#2a8a3e' }}>{colliding ? '⇄' : '→'}</div>
          <motion.div animate={colliding ? { x: [0, -30, 0, -30, 0] } : { x: 0 }} transition={{ duration: 0.6, repeat: colliding ? Infinity : 0 }} style={cardStyle}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>T2</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>back-off {last ? last.t2 : '—'}</div>
          </motion.div>
        </div>

        <div className="metrics" style={{ marginBottom: '0.8rem' }}>
          <div className="metric"><div className="label">Step</div><div className="value">{step}</div></div>
          <div className={`metric ${progress === 0 && step > 0 ? 'accent' : ''}`}><div className="label">Work done</div><div className="value">{progress}</div></div>
          <div className="metric"><div className="label">Throughput</div><div className="value">{step ? Math.round((progress / step) * 100) : 0}%</div></div>
        </div>

        <div style={{ display: 'flex', gap: 3, height: 24 }}>
          {history.map((h, i) => (
            <div key={i} style={{ flex: 1, background: h.escaped ? '#2a8a3e' : 'var(--accent)', border: '1px solid var(--ink)' }} title={h.escaped ? 'progress' : 'collision'} />
          ))}
          {Array.from({ length: Math.max(0, 10 - history.length) }).map((_, i) => (
            <div key={`e-${i}`} style={{ flex: 1, background: 'var(--paper-deep)', border: '1px dashed var(--ink-faint)' }} />
          ))}
        </div>
      </div>

      <div className="callout">
        {step === 0 && <><strong>Two polite threads.</strong> When they collide they back off — but identical back-offs mean another collision. Raise the jitter and watch them escape.</>}
        {stuck && <span style={{ color: 'var(--accent)' }}><strong>Livelock.</strong> Zero jitter = lockstep back-off. CPU is busy, progress is zero.</span>}
        {step > 0 && !stuck && progress === 0 && <span style={{ color: 'var(--accent)' }}><strong>Still colliding.</strong> Bump the jitter higher.</span>}
        {step > 0 && progress > 0 && <span style={{ color: '#2a8a3e' }}><strong>Escaped.</strong> Randomised back-off broke the symmetry — the trick TCP, Ethernet, and good retry loops all use.</span>}
      </div>
    </>
  );
}

/* STARVATION -------------------------------------------------------- */

function StarvationScenario() {
  const [w1, setW1] = useState(8);
  const [w2, setW2] = useState(5);
  const [w3, setW3] = useState(1);
  const TICKS = 200;

  // Under priority-weighted scheduling: share_i = w_i / sum(w). When one
  // weight dominates, strict-priority schedulers never reach the low ones.
  const { runs, share } = useMemo(() => {
    const ws = [w1, w2, w3];
    const total = ws.reduce((a, b) => a + b, 0);
    const s = ws.map((w) => w / total);
    const max = Math.max(...ws);
    const eff = ws.map((w) => (w / max < 0.15 ? 0 : w));
    const effTotal = eff.reduce((a, b) => a + b, 0) || 1;
    return { runs: eff.map((w) => Math.round((w / effTotal) * TICKS)), share: s };
  }, [w1, w2, w3]);

  const labels = ['T1', 'T2', 'T3'];
  const weights = [w1, w2, w3];
  const setters = [setW1, setW2, setW3];
  const colors = ['#1c6dd0', '#2a8a3e', 'var(--accent)'];
  const maxRun = Math.max(...runs, 1);

  return (
    <>
      <div className="controls" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.6rem' }}>
        {labels.map((l, i) => (
          <label key={l} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <span style={{ minWidth: 32, fontFamily: 'var(--font-display)' }}>{l}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>priority</span>
            <input type="range" min={1} max={10} step={1} value={weights[i]} onChange={(e) => setters[i](+e.target.value)} style={{ flex: 1 }} />
            <strong style={{ fontFamily: 'var(--font-mono)', minWidth: 24, textAlign: 'right' }}>{weights[i]}</strong>
          </label>
        ))}
      </div>

      <div className="widget-stage" style={{ minHeight: 260, padding: '1.2rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)', marginBottom: '0.6rem' }}>
          Resource acquisitions over {TICKS} ticks (updates as you move the sliders)
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', height: 170 }}>
          {labels.map((l, i) => {
            const h = (runs[i] / maxRun) * 140;
            const starving = runs[i] === 0;
            return (
              <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: starving ? 'var(--accent)' : 'var(--ink)' }}>{runs[i]}</div>
                <motion.div
                  animate={{ height: Math.max(2, h) }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  style={{ width: '70%', background: starving ? 'var(--paper-deep)' : colors[i], border: '2px solid var(--ink)', borderRadius: '3px 3px 0 0' }}
                />
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>{l}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)' }}>{(share[i] * 100).toFixed(0)}% share</div>
                {starving && <div className="badge err" style={{ fontSize: '0.65rem' }}>STARVED</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="callout">
        {runs.some((r) => r === 0)
          ? <span style={{ color: 'var(--accent)' }}><strong>Starvation.</strong> A thread with too-low relative priority never wins the resource. <strong>Fix:</strong> a fair (FIFO) lock or priority-aging that boosts long-waiting threads.</span>
          : Math.max(...runs) > Math.min(...runs) * 5
            ? <><strong>Heavy skew.</strong> The lowest-priority thread is barely scheduled. Push the imbalance further to see it starve.</>
            : <><strong>Balanced enough.</strong> Every thread makes progress. Drag one slider far below the others to see starvation kick in.</>
        }
      </div>
    </>
  );
}
