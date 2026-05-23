import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 2PC, but interactive. The learner drives the protocol one beat at a time
// and can kill any actor at any moment. The whole point is to feel the
// blocking problem in their hands — kill the coordinator after the vote
// phase and watch P1/P2/P3 sit in PREPARED forever.

const STEPS = [
  { key: 'idle',     label: 'Idle — press Next to begin.' },
  { key: 'prepare',  label: 'Phase 1: Coordinator sends PREPARE to all participants.' },
  { key: 'vote',     label: 'Phase 1: Each participant votes (toggle any to NO before pressing Next).' },
  { key: 'decide',   label: 'Coordinator tallies votes and decides COMMIT or ABORT.' },
  { key: 'deliver',  label: 'Phase 2: Coordinator sends decision to all participants.' },
  { key: 'ack',      label: 'Phase 2: Participants apply the decision and acknowledge.' },
  { key: 'done',     label: 'Protocol complete.' },
];

const COORD_POS = { x: 360, y: 60 };
const PART_POS = [
  { x: 130, y: 230 },
  { x: 360, y: 230 },
  { x: 590, y: 230 },
];

// Colors per state — these directly drive the diagram, so a quick lookup
// keeps the SVG legible.
const STATE_COLORS = {
  idle:       { fill: 'var(--paper)',  stroke: 'var(--ink)',   text: 'var(--ink)' },
  preparing:  { fill: '#fff4cc',       stroke: '#b58900',      text: 'var(--ink)' },
  prepared:   { fill: '#d6e4ff',       stroke: '#1c6dd0',      text: 'var(--ink)' },
  committing: { fill: '#d9ead3',       stroke: '#2a8a3e',      text: 'var(--ink)' },
  committed:  { fill: '#2a8a3e',       stroke: 'var(--ink)',   text: 'white' },
  aborted:    { fill: '#f7c8c8',       stroke: 'var(--accent)', text: 'var(--ink)' },
  crashed:    { fill: '#bbbbbb',       stroke: 'var(--accent)', text: 'var(--ink-soft)' },
};

function initialState() {
  return {
    step: 0,
    coord: { state: 'idle', crashed: false, decision: null },
    parts: [0, 1, 2].map(() => ({ state: 'idle', crashed: false, vote: 'yes' })),
    log: [],
    arrows: [],
  };
}

function tsNow() {
  return new Date().toLocaleTimeString([], { hour12: false });
}

function Box({ x, y, w = 130, h = 70, label, sub, badge, crashed, dim }) {
  const palette = crashed ? STATE_COLORS.crashed : STATE_COLORS[badge] || STATE_COLORS.idle;
  return (
    <motion.g
      animate={crashed ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      style={{ opacity: dim ? 0.55 : 1 }}
    >
      <rect
        x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6}
        fill={palette.fill} stroke={palette.stroke} strokeWidth={2.5}
      />
      <text x={x} y={y - 14} textAnchor="middle"
        style={{ fontFamily: 'var(--font-display)', fontSize: 13, fill: palette.text, letterSpacing: '1px' }}>
        {label}
      </text>
      <text x={x} y={y + 4} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: palette.text, fontWeight: 600 }}>
        {crashed ? 'CRASHED' : (badge || 'idle').toUpperCase()}
      </text>
      {sub && (
        <text x={x} y={y + 20} textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: palette.text, opacity: 0.75 }}>
          {sub}
        </text>
      )}
    </motion.g>
  );
}

function Arrow({ from, to, color = 'var(--ink)', dashed, label, dimmed }) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;
  const pad = 42;
  const x1 = from.x + ux * pad, y1 = from.y + uy * pad;
  const x2 = to.x - ux * pad,   y2 = to.y - uy * pad;
  const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
  // Perpendicular offset so labels don't sit on the line itself.
  const nx = -uy, ny = ux;
  const lx = midX + nx * 10, ly = midY + ny * 10;
  const stroke = dimmed ? '#bbb' : color;
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={2.25}
        strokeDasharray={dashed ? '5 4' : undefined} markerEnd={dimmed ? 'url(#arr-dim)' : 'url(#arr-end)'} />
      {label && (
        <text x={lx} y={ly} textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: stroke, fontWeight: 700 }}>
          {label}
        </text>
      )}
    </motion.g>
  );
}

export default function TwoPCWidget() {
  const [s, setS] = useState(initialState);

  const stepInfo = STEPS[s.step];
  const isBlocked = useMemo(() => {
    // The diagnostic signal: any participant stuck in 'prepared' while the
    // coordinator is dead before delivering the decision.
    if (!s.coord.crashed) return false;
    return s.parts.some((p) => p.state === 'prepared' && !p.crashed);
  }, [s]);
  const isDone = s.step >= STEPS.length - 1;

  function log(entry, kind = 'info') {
    return { ts: tsNow(), msg: entry, kind };
  }

  function advance() {
    if (isDone) return;
    setS((prev) => {
      const next = { ...prev, parts: prev.parts.map((p) => ({ ...p })), coord: { ...prev.coord }, log: [...prev.log], arrows: [] };

      // Step 1 -> PREPARE phase begins
      if (next.step === 0) {
        if (next.coord.crashed) {
          next.log.push(log('Coordinator is crashed — protocol cannot start.', 'err'));
          next.step = 1;
          return next;
        }
        next.coord.state = 'preparing';
        next.parts.forEach((p, i) => {
          if (!p.crashed) {
            p.state = 'preparing';
            next.arrows.push({ id: `c-p${i}`, from: 'C', to: i, label: 'PREPARE', color: '#1c6dd0' });
          }
        });
        next.log.push(log('Coordinator -> PREPARE to P0, P1, P2', 'info'));
        next.step = 1;
        return next;
      }

      // Step 2 -> participants vote
      if (next.step === 1) {
        next.parts.forEach((p, i) => {
          if (p.crashed) {
            next.log.push(log(`P${i} is crashed — no vote received (timeout).`, 'err'));
            return;
          }
          if (p.vote === 'yes') {
            p.state = 'prepared';
            next.log.push(log(`P${i} -> votes YES (prepared, holding locks)`, 'ok'));
            next.arrows.push({ id: `p${i}-c-yes`, from: i, to: 'C', label: 'YES', color: '#2a8a3e' });
          } else {
            p.state = 'aborted';
            next.log.push(log(`P${i} -> votes NO`, 'err'));
            next.arrows.push({ id: `p${i}-c-no`, from: i, to: 'C', label: 'NO', color: 'var(--accent)' });
          }
        });
        next.step = 2;
        return next;
      }

      // Step 3 -> coordinator decides
      if (next.step === 2) {
        if (next.coord.crashed) {
          next.log.push(log('Coordinator crashed before deciding. Live participants stay PREPARED.', 'err'));
          next.step = 3;
          return next;
        }
        const anyNo = next.parts.some((p) => !p.crashed && p.vote === 'no');
        const anyMissing = next.parts.some((p) => p.crashed);
        const decision = (anyNo || anyMissing) ? 'ABORT' : 'COMMIT';
        next.coord.decision = decision;
        next.coord.state = decision === 'COMMIT' ? 'committing' : 'aborted';
        next.log.push(log(
          `Coordinator decides ${decision}` + (anyMissing && !anyNo ? ' (a participant is unreachable)' : ''),
          decision === 'COMMIT' ? 'ok' : 'err'
        ));
        next.step = 3;
        return next;
      }

      // Step 4 -> deliver decision
      if (next.step === 3) {
        if (next.coord.crashed) {
          next.log.push(log('Coordinator is crashed — decision never delivered.', 'err'));
          next.step = 4;
          return next;
        }
        const decision = next.coord.decision;
        next.parts.forEach((p, i) => {
          if (p.crashed) return;
          if (p.state === 'aborted' && decision === 'ABORT') return; // already aborted on its own NO
          next.arrows.push({
            id: `c-p${i}-${decision}`, from: 'C', to: i, label: decision,
            color: decision === 'COMMIT' ? '#2a8a3e' : 'var(--accent)',
          });
          next.log.push(log(`Coordinator -> ${decision} to P${i}`, decision === 'COMMIT' ? 'ok' : 'err'));
        });
        next.step = 4;
        return next;
      }

      // Step 5 -> participants apply and ack
      if (next.step === 4) {
        const decision = next.coord.decision;
        if (!decision || next.coord.crashed) {
          // Without a decision delivered, prepared participants stay blocked.
          next.parts.forEach((p, i) => {
            if (p.crashed) return;
            if (p.state === 'prepared') {
              next.log.push(log(`P${i} still in PREPARED — waiting for a decision that may never come.`, 'err'));
            }
          });
          next.step = 5;
          return next;
        }
        next.parts.forEach((p, i) => {
          if (p.crashed) return;
          if (decision === 'COMMIT') {
            p.state = 'committed';
            next.log.push(log(`P${i} committed, locks released. ACK -> coordinator.`, 'ok'));
          } else {
            p.state = 'aborted';
            next.log.push(log(`P${i} rolled back. ACK -> coordinator.`, 'err'));
          }
        });
        if (decision === 'COMMIT') next.coord.state = 'committed';
        next.step = 5;
        return next;
      }

      // Step 6 -> wrap up
      if (next.step === 5) {
        next.step = 6;
        next.arrows = [];
        return next;
      }

      return next;
    });
  }

  function crashCoord() {
    setS((prev) => {
      if (prev.coord.crashed) return prev;
      const next = { ...prev, coord: { ...prev.coord, crashed: true, state: 'crashed' }, log: [...prev.log] };
      next.log.push(log(`Coordinator CRASHED at step ${prev.step + 1} (${STEPS[prev.step].key})`, 'err'));
      return next;
    });
  }

  function crashPart(i) {
    setS((prev) => {
      if (prev.parts[i].crashed) return prev;
      const parts = prev.parts.map((p, j) => j === i ? { ...p, crashed: true, state: 'crashed' } : p);
      const next = { ...prev, parts, log: [...prev.log] };
      next.log.push(log(`P${i} CRASHED at step ${prev.step + 1} (was ${prev.parts[i].state})`, 'err'));
      return next;
    });
  }

  function toggleVote(i) {
    setS((prev) => {
      // Locking votes after step 2 would hide the failure mode where a participant
      // is overridden mid-flight, so we just gate by step: only flip before voting.
      if (prev.step >= 2) return prev;
      const parts = prev.parts.map((p, j) => j === i ? { ...p, vote: p.vote === 'yes' ? 'no' : 'yes' } : p);
      return { ...prev, parts };
    });
  }

  function reset() {
    setS(initialState());
  }

  function posOf(ref) {
    return ref === 'C' ? COORD_POS : PART_POS[ref];
  }

  return (
    <div className="widget">
      <div className="widget-title">2PC — drive it, crash it, see why it blocks</div>

      <div className="controls">
        <button className="btn btn-accent" onClick={advance} disabled={isDone}>Next step</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          Step {Math.min(s.step + 1, STEPS.length)} / {STEPS.length} — <strong>{stepInfo.key}</strong>
        </span>
      </div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <button
          className="btn"
          onClick={crashCoord}
          disabled={s.coord.crashed}
          style={{ borderColor: 'var(--accent)', color: s.coord.crashed ? 'var(--ink-faint)' : 'var(--accent)' }}
        >
          Crash Coordinator
        </button>
        {s.parts.map((p, i) => (
          <button
            key={`crash-p${i}`}
            className="btn"
            onClick={() => crashPart(i)}
            disabled={p.crashed}
            style={{ borderColor: 'var(--accent)', color: p.crashed ? 'var(--ink-faint)' : 'var(--accent)' }}
          >
            Crash P{i}
          </button>
        ))}
        <div style={{ width: '100%', height: 0 }} />
        {s.parts.map((p, i) => (
          <button
            key={`vote-p${i}`}
            className={`btn ${p.vote === 'no' ? 'btn-accent' : ''}`}
            onClick={() => toggleVote(i)}
            disabled={s.step >= 2 || p.crashed}
            title={s.step >= 2 ? 'Vote already cast' : 'Toggle this participant\'s vote'}
          >
            P{i} vote: {p.vote.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="widget-stage" style={{ minHeight: 320 }}>
        <svg viewBox="0 0 720 300" width="100%" style={{ maxWidth: 760 }}>
          <defs>
            <marker id="arr-end" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--ink)" />
            </marker>
            <marker id="arr-dim" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="#bbb" />
            </marker>
          </defs>

          <Box
            x={COORD_POS.x} y={COORD_POS.y} w={170} h={72}
            label="COORDINATOR"
            sub={s.coord.decision ? `decision: ${s.coord.decision}` : null}
            badge={s.coord.state}
            crashed={s.coord.crashed}
          />

          {s.parts.map((p, i) => (
            <Box
              key={`part-${i}`}
              x={PART_POS[i].x} y={PART_POS[i].y} w={140} h={72}
              label={`PARTICIPANT P${i}`}
              sub={p.crashed ? null : `vote: ${p.vote.toUpperCase()}`}
              badge={p.state}
              crashed={p.crashed}
            />
          ))}

          <AnimatePresence>
            {s.arrows.map((a) => {
              const from = posOf(a.from);
              const to = posOf(a.to);
              const dimmed = (a.from === 'C' && s.coord.crashed) ||
                             (a.to === 'C' && s.coord.crashed) ||
                             (typeof a.from === 'number' && s.parts[a.from].crashed) ||
                             (typeof a.to === 'number' && s.parts[a.to].crashed);
              return (
                <Arrow
                  key={a.id}
                  from={from} to={to}
                  label={a.label} color={a.color} dimmed={dimmed}
                  dashed={a.label === 'PREPARE'}
                />
              );
            })}
          </AnimatePresence>
        </svg>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">Coord</div>
          <div className="value" style={{ fontSize: '1rem' }}>{s.coord.crashed ? 'CRASHED' : s.coord.state}</div>
        </div>
        {s.parts.map((p, i) => (
          <div key={`m-${i}`} className={`metric ${p.state === 'prepared' && s.coord.crashed ? 'accent' : ''}`}>
            <div className="label">P{i}</div>
            <div className="value" style={{ fontSize: '1rem' }}>{p.crashed ? 'CRASHED' : p.state}</div>
          </div>
        ))}
      </div>

      <div className="callout">
        <strong>Step {Math.min(s.step + 1, STEPS.length)}.</strong> {stepInfo.label}
        {isBlocked && (
          <div style={{ marginTop: '0.5rem', color: 'var(--accent)', fontWeight: 600 }}>
            Blocked. The coordinator died after participants prepared but before the decision was delivered.
            Participants are holding locks, waiting for a message that will never arrive — the classic 2PC blocking problem.
          </div>
        )}
        {isDone && !isBlocked && s.coord.decision === 'COMMIT' && (
          <div style={{ marginTop: '0.4rem', color: '#2a8a3e' }}>
            Committed atomically — every live participant applied the change.
          </div>
        )}
        {isDone && !isBlocked && s.coord.decision === 'ABORT' && (
          <div style={{ marginTop: '0.4rem', color: 'var(--accent)' }}>
            Aborted atomically — a single NO (or unreachable participant) forces everyone to roll back.
          </div>
        )}
      </div>

      <div className="log" aria-label="event log">
        {s.log.length === 0 && (
          <div className="entry" style={{ color: 'var(--ink-faint)' }}>
            <span className="t">--:--:--</span>Press "Next step" to start. Try crashing the coordinator at step 3.
          </div>
        )}
        {s.log.map((e, idx) => (
          <div key={idx} className={`entry ${e.kind}`}>
            <span className="t">{e.ts}</span>{e.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
