import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// M:N scheduler simulator. The learner moves three knobs:
//   - GOMAXPROCS (number of Ps / OS-thread carriers)
//   - Goroutine count
//   - Blocking ratio (fraction of Gs that will perform a blocking syscall)
// Then they Spawn and either auto-play or single-step. The picture shows
// local run queues, the global queue, work-stealing, and the blocked pool.

const TICK_MS = 600;
const STEAL_BATCH = 2;            // Half of a victim's queue (capped) — mirrors Go runtime behavior
const GLOBAL_PULL_BATCH = 3;      // Per-P pull size from the global runq

const PALETTE = {
  running: '#2a8a3e',
  blocked: '#c97a1c',
  done:    '#1c6dd0',
};

function makeGoroutines(n, blockingRatio) {
  // Each G has a small "work budget" of ticks. Some will block once partway through.
  const gs = [];
  for (let i = 0; i < n; i++) {
    const work = 2 + Math.floor(Math.random() * 4);          // 2..5 ticks of CPU
    const willBlock = Math.random() < blockingRatio;
    gs.push({
      id: i,
      work,
      done: 0,
      blockAt: willBlock ? 1 + Math.floor(Math.random() * Math.max(1, work - 1)) : -1,
      blockFor: 2 + Math.floor(Math.random() * 3),            // syscall takes 2..4 ticks
      blockedTicks: 0,
      hasBlocked: false,
    });
  }
  return gs;
}

function initialState(gomaxprocs, goroutineCount, blockingRatio) {
  const gs = makeGoroutines(goroutineCount, blockingRatio);
  // Spread initial Gs unevenly across local queues so stealing is visible.
  // First P gets a bigger share; the rest split the remainder. Some always
  // land in the global queue to demonstrate the global-runq pull path.
  const local = Array.from({ length: gomaxprocs }, () => []);
  const global = [];
  const all = gs.map((g) => g.id);
  // 70% to locals, 30% global
  const splitPoint = Math.floor(all.length * 0.7);
  const localIds = all.slice(0, splitPoint);
  const globalIds = all.slice(splitPoint);
  // Skewed local distribution.
  localIds.forEach((id, i) => {
    const target = i < localIds.length / 2 ? 0 : (i % gomaxprocs);
    local[target].push(id);
  });
  globalIds.forEach((id) => global.push(id));

  const running = Array(gomaxprocs).fill(null);
  return {
    gs: Object.fromEntries(gs.map((g) => [g.id, g])),
    local, global,
    running,
    blocked: [],
    completed: [],
    steals: 0,
    globalPulls: 0,
    tick: 0,
    busyTickCount: 0,
  };
}

function stepOnce(state) {
  // One scheduler tick. For each P:
  //   1. If running G's blockAt fires, move it to blocked.
  //   2. Else advance work; if work done, retire G.
  //   3. Decrement blocked timers; resumed Gs go to global runq.
  //   4. After all retire/block, refill each idle P: local → global → steal.
  const next = {
    ...state,
    gs: { ...state.gs },
    local: state.local.map((q) => [...q]),
    global: [...state.global],
    running: [...state.running],
    blocked: [...state.blocked],
    completed: [...state.completed],
  };
  const P = next.running.length;

  // Phase 1: each running G ticks
  for (let p = 0; p < P; p++) {
    const id = next.running[p];
    if (id == null) continue;
    const g = { ...next.gs[id] };
    g.done += 1;
    if (!g.hasBlocked && g.blockAt > 0 && g.done >= g.blockAt) {
      // Block: P detaches from this G. Other work continues here.
      g.hasBlocked = true;
      g.blockedTicks = g.blockFor;
      next.gs[id] = g;
      next.blocked.push(id);
      next.running[p] = null;
    } else if (g.done >= g.work) {
      next.gs[id] = g;
      next.completed.push(id);
      next.running[p] = null;
    } else {
      next.gs[id] = g;
    }
  }

  // Phase 2: blocked timers tick down → return to global runq when ready
  const stillBlocked = [];
  for (const id of next.blocked) {
    const g = { ...next.gs[id] };
    g.blockedTicks -= 1;
    next.gs[id] = g;
    if (g.blockedTicks <= 0) {
      next.global.push(id);
    } else {
      stillBlocked.push(id);
    }
  }
  next.blocked = stillBlocked;

  // Phase 3: refill idle Ps. Order matters: local first, then global, then steal.
  for (let p = 0; p < P; p++) {
    if (next.running[p] != null) continue;
    if (next.local[p].length > 0) {
      next.running[p] = next.local[p].shift();
      continue;
    }
    if (next.global.length > 0) {
      // Pull a batch from global — first goes to run, the rest into local queue.
      const pulled = next.global.splice(0, GLOBAL_PULL_BATCH);
      next.running[p] = pulled.shift();
      next.local[p].push(...pulled);
      next.globalPulls += 1;
      continue;
    }
    // Steal: find the most loaded peer and take ~half.
    let victim = -1, maxLen = 1;
    for (let i = 0; i < P; i++) {
      if (i === p) continue;
      if (next.local[i].length > maxLen) { victim = i; maxLen = next.local[i].length; }
    }
    if (victim >= 0) {
      const take = Math.min(STEAL_BATCH, Math.ceil(next.local[victim].length / 2));
      const stolen = next.local[victim].splice(-take, take);
      next.running[p] = stolen.shift();
      next.local[p].push(...stolen);
      next.steals += 1;
    }
  }

  next.tick = state.tick + 1;
  const busy = next.running.filter((r) => r != null).length;
  if (busy === P && P > 0) next.busyTickCount = state.busyTickCount + 1;
  else next.busyTickCount = state.busyTickCount;

  return next;
}

function isIdle(state) {
  return state.running.every((r) => r == null)
      && state.local.every((q) => q.length === 0)
      && state.global.length === 0
      && state.blocked.length === 0;
}

export default function GoroutinesWidget() {
  const [gomaxprocs, setGomaxprocs] = useState(3);
  const [goroutineCount, setGoroutineCount] = useState(40);
  const [blockingRatio, setBlockingRatio] = useState(0.2);
  const [state, setState] = useState(() => initialState(3, 40, 0.2));
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  // Auto-stop when nothing left to schedule.
  useEffect(() => {
    if (playing && isIdle(state)) setPlaying(false);
  }, [playing, state]);

  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setState((s) => stepOnce(s));
    }, TICK_MS);
    return () => clearInterval(timerRef.current);
  }, [playing]);

  function spawn() {
    setPlaying(false);
    setState(initialState(gomaxprocs, goroutineCount, blockingRatio));
  }
  function step() {
    if (playing) { setPlaying(false); return; }
    setState((s) => isIdle(s) ? s : stepOnce(s));
  }
  function toggle() {
    if (isIdle(state)) return;
    setPlaying((p) => !p);
  }

  const total = goroutineCount;
  const active = total - state.completed.length;
  const busyPct = state.tick === 0 ? 0 : Math.round((state.busyTickCount / state.tick) * 100);

  return (
    <div className="widget">
      <div className="widget-title">Go scheduler — M:N with work-stealing</div>

      <div className="controls" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <SliderField
          label="GOMAXPROCS"
          value={gomaxprocs}
          min={1} max={8}
          onChange={setGomaxprocs}
          format={(v) => `${v} P`}
        />
        <SliderField
          label="goroutines"
          value={goroutineCount}
          min={10} max={200} step={5}
          onChange={setGoroutineCount}
          format={(v) => `${v}`}
        />
        <SliderField
          label="blocking ratio"
          value={Math.round(blockingRatio * 100)}
          min={0} max={80} step={5}
          onChange={(v) => setBlockingRatio(v / 100)}
          format={(v) => `${v}%`}
        />
      </div>

      <div className="controls">
        <button className="btn btn-accent" onClick={spawn}>Spawn</button>
        <button className="btn" onClick={toggle} disabled={isIdle(state)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="btn btn-ghost" onClick={step} disabled={isIdle(state) && !playing}>
          Step
        </button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          tick {state.tick}
        </span>
      </div>

      <div className="metrics">
        <Metric label="active" value={active} />
        <Metric label="completed" value={state.completed.length} />
        <Metric label="blocked" value={state.blocked.length} />
        <Metric label="steals" value={state.steals} accent />
        <Metric label="global pulls" value={state.globalPulls} />
        <Metric label="all Ps busy" value={`${busyPct}%`} />
      </div>

      <div className="widget-stage" style={{ minHeight: 320, padding: '0.8rem' }}>
        {/* Row of Ps with currently-running G + local queue */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gomaxprocs}, minmax(0, 1fr))`,
          gap: '0.6rem',
        }}>
          {Array.from({ length: gomaxprocs }).map((_, p) => (
            <PSlot key={p} index={p} running={state.running[p]} queue={state.local[p]} gs={state.gs} />
          ))}
        </div>

        {/* Global runq + blocked pool */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.8rem' }}>
          <Pool title="Global run queue" ids={state.global} gs={state.gs} accent="var(--accent-soft)" emptyLabel="(empty)" />
          <Pool title="Blocked on IO / channel" ids={state.blocked} gs={state.gs} accent="#f6e1c4" emptyLabel="(none)" annotate={(id) => `${state.gs[id]?.blockedTicks ?? 0}t`} />
        </div>

        {/* Completed strip */}
        <div style={{
          marginTop: '0.8rem',
          padding: '0.5rem 0.7rem',
          background: 'var(--paper-deep)',
          border: '1.5px solid var(--ink)',
          borderRadius: 4,
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
            Completed ({state.completed.length})
          </div>
          <div style={{
            display: 'flex',
            gap: '0.2rem',
            flexWrap: 'wrap',
            marginTop: '0.3rem',
            maxHeight: 60,
            overflow: 'hidden',
          }}>
            <AnimatePresence initial={false}>
              {state.completed.slice(-60).map((id) => (
                <motion.span
                  key={`done-${id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    padding: '0.1em 0.4em',
                    background: PALETTE.done, color: 'white',
                    borderRadius: 3,
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                  }}
                >G{id}</motion.span>
              ))}
            </AnimatePresence>
            {state.completed.length === 0 && (
              <span style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                none yet
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="callout">
        Move the knobs and Spawn. <strong>GOMAXPROCS</strong> sets how many OS threads the runtime
        owns; goroutines (~2 KB each) get multiplexed onto them. When a G blocks on a syscall, its P
        detaches and grabs more work — that&apos;s why blocking ratio doesn&apos;t crater throughput.
        Watch the <em>steals</em> metric climb when one P empties: it raids a neighbour&apos;s queue or
        pulls a batch from the global runq. That&apos;s how Go keeps every core fed without you
        partitioning the work.
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step = 1, onChange, format }) {
  return (
    <label style={{
      display: 'flex', flexDirection: 'column', gap: '0.2rem',
      fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
      color: 'var(--ink-soft)', minWidth: 160, flex: '1 1 160px',
    }}>
      <span style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{format(value)}</span>
      </span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: 'var(--accent)', width: '100%' }}
      />
    </label>
  );
}

function Metric({ label, value, accent }) {
  return (
    <div className={`metric${accent ? ' accent' : ''}`}>
      <div className="label">{label}</div>
      <div className="value" style={{ fontSize: '1.3rem' }}>{value}</div>
    </div>
  );
}

const CARD = { background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 4, padding: '0.55rem', minWidth: 0 };
const HEAD = { fontFamily: 'var(--font-display)', fontSize: '0.85rem', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between' };
const SUB = { fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)' };
const POOL_BOX = { display: 'flex', flexWrap: 'wrap', gap: '0.2rem', minHeight: 56, maxHeight: 96, overflow: 'hidden', padding: '0.25rem', background: 'var(--paper-deep)', border: '1px dashed var(--ink-faint)', borderRadius: 3 };
const CHIP = (bg) => ({ padding: '0.1em 0.4em', background: bg, border: '1px solid var(--ink)', borderRadius: 2, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600 });

function PSlot({ index, running, queue, gs }) {
  const idle = running == null;
  return (
    <div style={CARD}>
      <div style={HEAD}><span>P{index}</span><span style={SUB}>{queue.length} queued</span></div>
      <div style={{
        height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: idle ? 'var(--paper-deep)' : PALETTE.running,
        color: idle ? 'var(--ink-faint)' : 'white',
        border: '1.5px solid var(--ink)', borderRadius: 3, marginBottom: '0.4rem',
        fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
      }}>
        <AnimatePresence mode="wait">
          {running != null ? (
            <motion.span key={`run-${running}`} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.2 }}>
              G{running} ({gs[running]?.done}/{gs[running]?.work})
            </motion.span>
          ) : (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>idle</motion.span>
          )}
        </AnimatePresence>
      </div>
      <ChipList ids={queue} chipStyle={CHIP('var(--accent-soft)')} cap={24} emptyLabel="local runq empty" keyPrefix={`p${index}`} />
    </div>
  );
}

function Pool({ title, ids, gs, accent, emptyLabel, annotate }) {
  return (
    <div style={CARD}>
      <div style={HEAD}><span>{title}</span><span style={SUB}>{ids.length}</span></div>
      <ChipList ids={ids} chipStyle={CHIP(accent)} cap={50} emptyLabel={emptyLabel} keyPrefix={title} annotate={annotate} gs={gs} />
    </div>
  );
}

function ChipList({ ids, chipStyle, cap, emptyLabel, keyPrefix, annotate, gs }) {
  return (
    <div style={POOL_BOX}>
      <AnimatePresence initial={false}>
        {ids.slice(0, cap).map((id) => (
          <motion.span
            key={`${keyPrefix}-${id}`} layout
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18 }} style={chipStyle}
          >
            G{id}{annotate ? <span style={{ color: 'var(--ink-soft)', fontWeight: 400, marginLeft: 3 }}>{annotate(id)}</span> : null}
          </motion.span>
        ))}
      </AnimatePresence>
      {ids.length > cap && <span style={{ ...SUB, padding: '0.1em 0.35em' }}>+{ids.length - cap}</span>}
      {ids.length === 0 && <span style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', margin: 'auto' }}>{emptyLabel}</span>}
    </div>
  );
}
