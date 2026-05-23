import { useEffect, useMemo, useRef, useState } from 'react';

// Tick-based scheduler simulating three runtime models.
// One tick == 10ms of simulated wall-clock. CPU tasks need ~10 ticks of pure
// compute (no yield). IO tasks need a brief setup, then ~6 ticks of off-lane
// waiting (the lane is free during this — this is the whole point of await),
// then a brief resume. The visible swimlane footprint of an IO task is small;
// of a CPU task it dominates.

const TICK_MS = 90;          // wall-clock per tick of the playhead
const SIM_MS_PER_TICK = 10;  // simulated milliseconds advanced per tick
const CPU_DURATION = 10;     // CPU task: blocks a lane for 10 ticks
const IO_SETUP = 2;          // IO task: 2 ticks to issue the request
const IO_WAIT = 6;           // IO task: 6 ticks waiting (lane is free)
const IO_RESUME = 2;         // IO task: 2 ticks to consume the result

let nextTaskId = 1;

function makeTask(kind) {
  return {
    id: nextTaskId++,
    kind,                  // 'io' | 'cpu'
    state: 'queued',       // queued | running | waiting | done
    lane: -1,              // -1 if unassigned or off-lane (IO waiting)
    progressInPhase: 0,
    spans: [],             // [{lane, start, end, kind, phase}] for rendering
    submittedAt: 0,
    completedAt: -1,
  };
}

const RUNTIMES = {
  loop: { label: 'Event loop (JS / asyncio)', lanes: 1 },
  pool: { label: 'Thread pool (Tokio / FJP)', lanes: 4 },
  hybrid: { label: 'Hybrid (Rust async, N workers)', lanes: 4 },
};

function laneCount(runtime, hybridN) {
  if (runtime === 'loop') return 1;
  if (runtime === 'pool') return 4;
  return hybridN;
}

export default function AsyncAwaitWidget() {
  const [runtime, setRuntime] = useState('loop');
  const [hybridN, setHybridN] = useState(4);
  const [tasks, setTasks] = useState([]);
  const [simTime, setSimTime] = useState(0);     // ticks elapsed
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);
  const simTimeRef = useRef(0);

  const lanes = laneCount(runtime, hybridN);

  // Stop the clock and reset world state whenever the runtime model changes.
  useEffect(() => {
    setPlaying(false);
    setTasks([]);
    setSimTime(0);
    simTimeRef.current = 0;
  }, [runtime, hybridN]);

  function tick() {
    const t = simTimeRef.current;
    simTimeRef.current = t + 1;
    setSimTime(t + 1);
    setTasks((prev) => stepWorld(prev, runtime, lanes, t));
  }

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(tick, TICK_MS);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, runtime, lanes]);

  function addTask(kind) {
    setTasks((prev) => {
      const t = makeTask(kind);
      t.submittedAt = simTimeRef.current;
      return [...prev, t];
    });
  }

  function clearAll() {
    setPlaying(false);
    setTasks([]);
    setSimTime(0);
    simTimeRef.current = 0;
  }

  // ----- derived metrics -----
  const completed = tasks.filter((t) => t.state === 'done').length;
  const pending = tasks.length - completed;
  const stuck = isEventLoopStuck(tasks, runtime);

  const utilisation = useMemo(() => {
    if (simTime === 0) return 0;
    let busyTickLanes = 0;
    tasks.forEach((t) =>
      t.spans.forEach((s) => {
        if (s.lane >= 0) busyTickLanes += s.end - s.start;
      })
    );
    return Math.min(100, Math.round((100 * busyTickLanes) / (simTime * lanes)));
  }, [tasks, simTime, lanes]);

  const wallMs = simTime * SIM_MS_PER_TICK;

  return (
    <div className="widget">
      <div className="widget-title">async / await — runtime model bake-off</div>

      <div className="controls">
        <div className="pill-group" role="radiogroup" aria-label="Runtime model">
          {Object.entries(RUNTIMES).map(([k, v]) => (
            <span key={k}>
              <input
                type="radio"
                id={`rt-${k}`}
                name="rt"
                checked={runtime === k}
                onChange={() => setRuntime(k)}
              />
              <label htmlFor={`rt-${k}`}>{v.label}</label>
            </span>
          ))}
        </div>
        {runtime === 'hybrid' && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            workers
            <input
              type="range"
              min={1}
              max={8}
              value={hybridN}
              onChange={(e) => setHybridN(Number(e.target.value))}
            />
            <span style={{ minWidth: '1.2em', textAlign: 'right' }}>{hybridN}</span>
          </label>
        )}
      </div>

      <div className="controls">
        <button className="btn" onClick={() => addTask('io')}>+ IO task (await fetch)</button>
        <button className="btn" onClick={() => addTask('cpu')}>+ CPU task (100ms compute)</button>
        <button className="btn btn-ghost" onClick={clearAll}>Clear all</button>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: '0.4rem' }}>
          <button className={`btn ${playing ? '' : 'btn-accent'}`} onClick={() => setPlaying((p) => !p)} disabled={tasks.length === 0 || tasks.every((t) => t.state === 'done')}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <button className="btn btn-ghost" onClick={tick} disabled={playing}>
            Step
          </button>
        </span>
      </div>

      <div className="widget-stage" style={{ minHeight: 220, padding: '0.8rem' }}>
        <SwimlaneChart tasks={tasks} lanes={lanes} simTime={simTime} runtime={runtime} stuck={stuck} />
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">wall time</div>
          <div className="value" style={{ fontVariantNumeric: 'tabular-nums' }}>{wallMs}<span style={{ fontSize: '0.7em', color: 'var(--ink-soft)' }}> ms</span></div>
        </div>
        <div className="metric">
          <div className="label">completed</div>
          <div className="value">{completed}<span style={{ fontSize: '0.7em', color: 'var(--ink-soft)' }}> / {tasks.length}</span></div>
        </div>
        <div className="metric">
          <div className="label">pending</div>
          <div className="value">{pending}</div>
        </div>
        <div className="metric">
          <div className="label">utilisation</div>
          <div className="value">{utilisation}<span style={{ fontSize: '0.7em', color: 'var(--ink-soft)' }}>%</span></div>
        </div>
        <div className={`metric ${stuck ? 'accent' : ''}`}>
          <div className="label">event loop</div>
          <div className="value" style={{ fontSize: '1rem', paddingTop: '0.3em' }}>
            {stuck ? 'STUCK' : 'free'}
          </div>
        </div>
      </div>

      <div className="callout">
        {runtime === 'loop' && (
          <>
            <strong>Event loop.</strong> One lane. IO tasks <em>yield</em> on await (lane free while waiting), so they
            interleave beautifully. But a CPU task has no yield point — the whole loop is frozen until it finishes.
            Stack three CPU tasks and watch wall time grow linearly.
          </>
        )}
        {runtime === 'pool' && (
          <>
            <strong>Thread pool.</strong> 4 worker threads chew tasks in parallel. CPU work scales until you saturate the pool;
            beyond {lanes} concurrent CPU tasks the rest queue. IO tasks here also park their carrier — a thread per await.
          </>
        )}
        {runtime === 'hybrid' && (
          <>
            <strong>Hybrid (Rust/tokio style).</strong> {hybridN} worker thread{hybridN === 1 ? '' : 's'}. IO tasks yield like
            in the event loop, so one worker juggles many awaits. CPU tasks still pin a worker — exceed {hybridN} of them and
            you queue. await can resume on any worker, hence the <code>Send</code> bound.
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scheduler — pure function. Simulates the half-open interval [T, T+1) of
// wall-clock work. Each tick: existing running tasks advance one step, then
// any newly-freed lanes pick up queued / waiting-ready tasks (which also do
// one step in this same interval). Transitions (done / yield) are checked
// AFTER the tick's work lands, so progress counts are the truthful "ticks of
// work completed."
// ---------------------------------------------------------------------------
function stepWorld(prevTasks, runtime, lanes, T) {
  const tasks = prevTasks.map((t) => ({ ...t, spans: t.spans.slice() }));

  // Lanes that already saw work in this tick can't take a fresh task — even
  // if their occupant yielded/completed mid-tick. (Otherwise two tasks would
  // share the same [T, T+1) slot on one lane.)
  const laneUsedThisTick = new Array(lanes).fill(false);

  // 1) Advance currently running tasks by one tick of work in [T, T+1).
  for (const tk of tasks) {
    if (tk.state !== 'running') continue;
    const last = tk.spans[tk.spans.length - 1];
    if (last && last.end === T && last.lane === tk.lane) last.end = T + 1;
    else tk.spans.push({ lane: tk.lane, start: T, end: T + 1, phase: last?.phase ?? 'cpu', kind: tk.kind });
    tk.progressInPhase += 1;
    if (tk.lane >= 0 && tk.lane < lanes) laneUsedThisTick[tk.lane] = true;
  }

  // 2) Advance waiting (off-lane) tasks by one tick of waiting.
  for (const tk of tasks) {
    if (tk.state !== 'waiting') continue;
    const last = tk.spans[tk.spans.length - 1];
    if (last && last.phase === 'io-wait' && last.end === T) last.end = T + 1;
    else tk.spans.push({ lane: -1, start: T, end: T + 1, phase: 'io-wait', kind: 'io' });
    tk.progressInPhase += 1;
  }

  // 3) Check transitions for everyone we just advanced.
  for (const tk of tasks) {
    if (tk.kind === 'cpu' && tk.state === 'running' && tk.progressInPhase >= CPU_DURATION) {
      tk.state = 'done';
      tk.completedAt = T + 1;
      tk.lane = -1;
    } else if (tk.kind === 'io' && tk.state === 'running') {
      const phase = tk.spans[tk.spans.length - 1].phase;
      if (phase === 'io-setup' && tk.progressInPhase >= IO_SETUP) {
        tk.state = 'waiting';
        tk.lane = -1;
        tk.progressInPhase = 0;
      } else if (phase === 'io-resume' && tk.progressInPhase >= IO_RESUME) {
        tk.state = 'done';
        tk.completedAt = T + 1;
        tk.lane = -1;
      }
    } else if (tk.kind === 'io' && tk.state === 'waiting' && tk.progressInPhase >= IO_WAIT) {
      tk.state = 'waiting-ready';
      tk.progressInPhase = 0;
    }
  }

  // 4) Identify free lanes. A lane is free only if NO task occupied it this
  // tick (including ones that just yielded/completed mid-tick).
  const laneBusy = new Array(lanes).fill(null);
  for (let i = 0; i < lanes; i++) if (laneUsedThisTick[i]) laneBusy[i] = -1;
  for (const tk of tasks) {
    if (tk.state === 'running' && tk.lane >= 0 && tk.lane < lanes) laneBusy[tk.lane] = tk.id;
  }

  // 5) Schedule new arrivals onto free lanes. They also do one tick of work
  // in [T, T+1) — and we check their completion immediately afterwards.
  const allReady = [
    ...tasks.filter((tk) => tk.state === 'waiting-ready'),
    ...tasks.filter((tk) => tk.state === 'queued'),
  ];

  for (let lane = 0; lane < lanes; lane++) {
    if (laneBusy[lane] !== null) continue;
    const next = allReady.shift();
    if (!next) break;
    next.lane = lane;
    next.state = 'running';
    next.progressInPhase = 1;
    laneBusy[lane] = next.id;
    const phase = next.kind === 'cpu'
      ? 'cpu'
      : (next.spans.some((s) => s.phase === 'io-setup') ? 'io-resume' : 'io-setup');
    next.spans.push({ lane, start: T, end: T + 1, phase, kind: next.kind });

    // Check completion immediately so 1-tick phases don't linger an extra tick.
    if (next.kind === 'cpu' && next.progressInPhase >= CPU_DURATION) {
      next.state = 'done'; next.completedAt = T + 1; next.lane = -1;
    } else if (next.kind === 'io' && phase === 'io-setup' && next.progressInPhase >= IO_SETUP) {
      next.state = 'waiting'; next.lane = -1; next.progressInPhase = 0;
    } else if (next.kind === 'io' && phase === 'io-resume' && next.progressInPhase >= IO_RESUME) {
      next.state = 'done'; next.completedAt = T + 1; next.lane = -1;
    }
  }

  return tasks;
}

// "Event loop stuck" = single-thread mode and a CPU task is currently running.
function isEventLoopStuck(tasks, runtime) {
  if (runtime !== 'loop') return false;
  return tasks.some((t) => t.state === 'running' && t.kind === 'cpu');
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function SwimlaneChart({ tasks, lanes, simTime, runtime, stuck }) {
  const PX_PER_TICK = 14;
  const LANE_H = 30;
  const LANE_GAP = 6;
  const LEFT = 70;
  const TOP = 24;
  const visibleTicks = Math.max(30, simTime + 4);
  const width = LEFT + visibleTicks * PX_PER_TICK + 20;
  const offLaneY = TOP + lanes * (LANE_H + LANE_GAP) + 12;
  const height = offLaneY + LANE_H + 30;

  // Build per-lane spans for rendering.
  const laneSpans = Array.from({ length: lanes }, () => []);
  const waitingSpans = [];
  tasks.forEach((t) => {
    t.spans.forEach((s) => {
      if (s.lane >= 0 && s.lane < lanes) laneSpans[s.lane].push({ ...s, taskId: t.id });
      else if (s.phase === 'io-wait') waitingSpans.push({ ...s, taskId: t.id });
    });
  });

  const trackW = visibleTicks * PX_PER_TICK;
  const trackFill = stuck && runtime === 'loop' ? '#fde2e2' : 'var(--paper-deep)';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: width, fontFamily: 'var(--font-mono)' }}>
      {Array.from({ length: lanes }).map((_, i) => {
        const y = TOP + i * (LANE_H + LANE_GAP);
        return (
          <g key={`lane-${i}`}>
            <text x={LEFT - 8} y={y + LANE_H / 2 + 4} textAnchor="end" fontSize={11} fill="var(--ink-soft)">
              {runtime === 'loop' ? 'loop' : `w${i}`}
            </text>
            <rect x={LEFT} y={y} width={trackW} height={LANE_H} fill={trackFill} stroke="var(--ink)" strokeWidth={1.5} rx={3} />
          </g>
        );
      })}

      <g>
        <text x={LEFT - 8} y={offLaneY + LANE_H / 2 + 4} textAnchor="end" fontSize={11} fill="var(--ink-soft)">await</text>
        <rect x={LEFT} y={offLaneY} width={trackW} height={LANE_H} fill="none" stroke="var(--ink-faint)" strokeWidth={1} strokeDasharray="3 3" rx={3} />
      </g>

      {laneSpans.map((spans, laneIdx) =>
        spans.map((s, j) => {
          const y = TOP + laneIdx * (LANE_H + LANE_GAP);
          const x = LEFT + s.start * PX_PER_TICK;
          const w = Math.max(2, (s.end - s.start) * PX_PER_TICK - 1);
          const fill = s.phase === 'cpu' ? 'var(--accent)' : '#1c6dd0';
          const label = s.phase === 'cpu' ? 'cpu' : s.phase === 'io-setup' ? 'req' : 'res';
          return (
            <g key={`s-${laneIdx}-${j}`}>
              <rect x={x} y={y + 4} width={w} height={LANE_H - 8} fill={fill} rx={2} />
              {w > 22 && <text x={x + 4} y={y + LANE_H / 2 + 4} fontSize={10} fill="white">#{s.taskId} {label}</text>}
            </g>
          );
        })
      )}

      {waitingSpans.map((s, j) => {
        const x = LEFT + s.start * PX_PER_TICK;
        const w = Math.max(2, (s.end - s.start) * PX_PER_TICK - 1);
        return (
          <g key={`w-${j}`}>
            <rect x={x} y={offLaneY + 4} width={w} height={LANE_H - 8} fill="none" stroke="#1c6dd0" strokeWidth={1.5} strokeDasharray="2 2" rx={2} />
            {w > 24 && <text x={x + 4} y={offLaneY + LANE_H / 2 + 4} fontSize={10} fill="#1c6dd0">#{s.taskId} waiting</text>}
          </g>
        );
      })}

      <line x1={LEFT + simTime * PX_PER_TICK} y1={TOP - 6} x2={LEFT + simTime * PX_PER_TICK} y2={offLaneY + LANE_H + 4} stroke="var(--ink)" strokeWidth={1.5} />

      <g>
        {Array.from({ length: Math.floor(visibleTicks / 10) + 1 }).map((_, i) => {
          const x = LEFT + i * 10 * PX_PER_TICK;
          return (
            <g key={`ax-${i}`}>
              <line x1={x} y1={offLaneY + LANE_H + 6} x2={x} y2={offLaneY + LANE_H + 11} stroke="var(--ink-soft)" />
              <text x={x} y={offLaneY + LANE_H + 22} fontSize={9} fill="var(--ink-soft)" textAnchor="middle">{i * 10 * SIM_MS_PER_TICK}ms</text>
            </g>
          );
        })}
      </g>

      <g transform={`translate(${LEFT}, 8)`}>
        <rect x={0} y={-8} width={10} height={10} fill="var(--accent)" rx={2} />
        <text x={14} y={1} fontSize={10} fill="var(--ink-soft)">cpu</text>
        <rect x={50} y={-8} width={10} height={10} fill="#1c6dd0" rx={2} />
        <text x={64} y={1} fontSize={10} fill="var(--ink-soft)">io (on lane)</text>
        <rect x={140} y={-8} width={10} height={10} fill="none" stroke="#1c6dd0" strokeDasharray="2 2" rx={2} />
        <text x={154} y={1} fontSize={10} fill="var(--ink-soft)">io (awaiting)</text>
      </g>
    </svg>
  );
}
