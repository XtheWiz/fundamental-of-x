import { useState } from 'react';

// Each primitive is its own sandbox. Click a thread action and watch
// who passes through, who queues, who fails. The point: feel the
// difference between "one at a time", "N at a time", "many readers OR
// one writer", FIFO handoff, and lock-free retry.

const TABS = [
  { key: 'mutex',     name: 'Mutex' },
  { key: 'semaphore', name: 'Semaphore' },
  { key: 'rwlock',    name: 'Read-write lock' },
  { key: 'channel',   name: 'Channel' },
  { key: 'cas',       name: 'Atomic / CAS' },
];

const ts = () => {
  const d = new Date();
  return `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

function useLog(cap = 12) {
  const [entries, setEntries] = useState([]);
  return [entries, (kind, msg) => setEntries((L) => [{ kind, msg, t: ts() }, ...L].slice(0, cap)), () => setEntries([])];
}

function LogView({ entries }) {
  if (!entries.length) return null;
  return (
    <div className="log">
      {entries.map((l, i) => (
        <div key={i} className={`entry ${l.kind}`}><span className="t">{l.t}</span>{l.msg}</div>
      ))}
    </div>
  );
}

/* ---------------- MUTEX ---------------- */
function MutexSandbox() {
  const THREADS = ['T1', 'T2', 'T3'];
  const [holder, setHolder] = useState(null);
  const [queue, setQueue] = useState([]);
  const [log, push, clear] = useLog();

  function acquire(t) {
    if (holder === t || queue.includes(t)) { push('err', `${t} already involved.`); return; }
    if (holder === null) { setHolder(t); push('ok', `${t} acquired the lock.`); }
    else { setQueue((q) => [...q, t]); push('info', `${t} blocked. Queue grows.`); }
  }
  function release(t) {
    if (holder !== t) { push('err', `${t} doesn't hold the lock.`); return; }
    if (queue.length === 0) { setHolder(null); push('ok', `${t} released. Lock free.`); }
    else { const [n, ...r] = queue; setHolder(n); setQueue(r); push('ok', `${t} released → ${n} acquired.`); }
  }
  function reset() { setHolder(null); setQueue([]); clear(); }

  return (
    <>
      <div className="metrics">
        <div className={`metric ${holder ? 'accent' : ''}`}>
          <div className="label">Held by</div>
          <div className="value">{holder || '—'}</div>
        </div>
        <div className="metric">
          <div className="label">Queue</div>
          <div className="value" style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>
            {queue.length ? `[${queue.join(', ')}]` : '[]'}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.6rem' }}>
        {THREADS.map((t) => {
          const state = holder === t ? 'holds' : queue.includes(t) ? `queued #${queue.indexOf(t) + 1}` : 'idle';
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', minWidth: 36 }}>{t}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)', minWidth: 90 }}>{state}</span>
              <button className="btn" onClick={() => acquire(t)}>Acquire</button>
              <button className="btn btn-ghost" onClick={() => release(t)}>Release</button>
            </div>
          );
        })}
      </div>
      <div className="controls" style={{ marginTop: '0.6rem' }}>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>
      <LogView entries={log} />
    </>
  );
}

/* ---------------- SEMAPHORE ---------------- */
function SemaphoreSandbox() {
  const THREADS = ['T1', 'T2', 'T3', 'T4', 'T5'];
  const [capacity, setCapacity] = useState(2);
  const [holders, setHolders] = useState([]);
  const [queue, setQueue] = useState([]);
  const [log, push, clear] = useLog();
  const free = capacity - holders.length;

  function acquire(t) {
    if (holders.includes(t) || queue.includes(t)) { push('err', `${t} already holds or queued.`); return; }
    if (holders.length < capacity) {
      setHolders((h) => [...h, t]); push('ok', `${t} took a permit. ${capacity - holders.length - 1} left.`);
    } else {
      setQueue((q) => [...q, t]); push('info', `${t} blocked — all ${capacity} permits taken.`);
    }
  }
  function release(t) {
    if (!holders.includes(t)) { push('err', `${t} has no permit.`); return; }
    const rest = holders.filter((h) => h !== t);
    if (queue.length > 0) {
      const [n, ...q2] = queue; setHolders([...rest, n]); setQueue(q2);
      push('ok', `${t} released → ${n} wakes up.`);
    } else {
      setHolders(rest); push('ok', `${t} released. ${capacity - rest.length} permits free.`);
    }
  }
  function changeCapacity(n) { setCapacity(n); setHolders([]); setQueue([]); push('info', `Capacity = ${n}. Reset.`); }
  function reset() { setHolders([]); setQueue([]); clear(); }

  return (
    <>
      <div className="controls" style={{ alignItems: 'center' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Permits: <strong>{capacity}</strong></label>
        <input type="range" min={1} max={5} value={capacity} onChange={(e) => changeCapacity(+e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', margin: '0.6rem 0', alignItems: 'center', flexWrap: 'wrap' }}>
        {Array.from({ length: capacity }).map((_, i) => {
          const occ = holders[i];
          return (
            <div key={i} style={{
              width: 56, height: 44, border: '2px solid var(--ink)', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: occ ? 'var(--accent)' : 'var(--paper-deep)',
              color: occ ? 'white' : 'var(--ink-faint)',
              fontFamily: 'var(--font-display)', fontSize: '0.95rem',
            }}>{occ || '·'}</div>
          );
        })}
        <div style={{ marginLeft: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
          {free} free · queue: [{queue.join(', ')}]
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '0.4rem' }}>
        {THREADS.map((t) => {
          const state = holders.includes(t) ? 'has permit' : queue.includes(t) ? `queued #${queue.indexOf(t) + 1}` : 'idle';
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', minWidth: 30 }}>{t}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)', minWidth: 80 }}>{state}</span>
              <button className="btn" onClick={() => acquire(t)}>Acquire</button>
              <button className="btn btn-ghost" onClick={() => release(t)}>Release</button>
            </div>
          );
        })}
      </div>
      <div className="controls" style={{ marginTop: '0.6rem' }}>
        <button className="btn btn-ghost" onClick={reset}>Reset state</button>
      </div>
      <LogView entries={log} />
    </>
  );
}

/* ---------------- READ-WRITE LOCK ---------------- */
function RWLockSandbox() {
  const THREADS = ['T1', 'T2', 'T3', 'T4'];
  const [readers, setReaders] = useState([]);
  const [writer, setWriter]   = useState(null);
  const [waiting, setWaiting] = useState([]);  // [{ t, mode: 'R' | 'W' }]
  const [log, push, clear] = useLog();
  const involved = (t) => readers.includes(t) || writer === t || waiting.some((w) => w.t === t);

  // Drain the waiting queue in FIFO order under current ownership rules.
  // Stop early at a head-of-line block to preserve fairness (no writer starvation).
  function drain(R, W, Q) {
    const remaining = [...Q];
    while (remaining.length) {
      const head = remaining[0];
      if (head.mode === 'R' && W === null) { R = [...R, head.t]; remaining.shift(); }
      else if (head.mode === 'W' && W === null && R.length === 0) { W = head.t; remaining.shift(); break; }
      else break;
    }
    return { R, W, Q: remaining };
  }

  function request(t, mode) {
    if (involved(t)) { push('err', `${t} already involved.`); return; }
    const writerWaitingAhead = waiting.some((w) => w.mode === 'W');
    if (mode === 'R' && writer === null && !writerWaitingAhead) {
      const R = [...readers, t]; setReaders(R);
      push('ok', `${t} acquired read (now ${R.length} reader${R.length === 1 ? '' : 's'}).`);
    } else if (mode === 'W' && writer === null && readers.length === 0) {
      setWriter(t); push('ok', `${t} acquired write — exclusive.`);
    } else {
      setWaiting((q) => [...q, { t, mode }]);
      const why = writer ? `writer ${writer} holds` : writerWaitingAhead ? 'writer queued ahead' : `${readers.length} readers active`;
      push('info', `${t} (${mode}) blocked — ${why}.`);
    }
  }

  function release(t) {
    let R = readers, W = writer;
    if (W === t) { W = null; push('ok', `${t} released write.`); }
    else if (R.includes(t)) { R = R.filter((x) => x !== t); push('ok', `${t} released read (${R.length} left).`); }
    else { push('err', `${t} holds nothing.`); return; }
    const next = drain(R, W, waiting);
    setReaders(next.R); setWriter(next.W); setWaiting(next.Q);
    if (next.W && next.W !== writer) push('ok', `${next.W} woke up → write.`);
    else if (next.R.length > R.length) push('ok', `Readers admitted: [${next.R.filter((x) => !R.includes(x)).join(', ')}].`);
  }

  function reset() { setReaders([]); setWriter(null); setWaiting([]); clear(); }

  const stateLine = writer ? `Writer ${writer} holds (exclusive)`
    : readers.length ? `${readers.length} reader${readers.length === 1 ? '' : 's'}: [${readers.join(', ')}]`
    : 'lock free';

  return (
    <>
      <div className="metrics">
        <div className={`metric ${writer ? 'accent' : ''}`}>
          <div className="label">State</div>
          <div className="value" style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>{stateLine}</div>
        </div>
        <div className="metric">
          <div className="label">Waiting</div>
          <div className="value" style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>
            {waiting.length ? waiting.map((w) => `${w.t}(${w.mode})`).join(', ') : '—'}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.6rem' }}>
        {THREADS.map((t) => {
          let state = 'idle';
          if (writer === t) state = 'writing';
          else if (readers.includes(t)) state = 'reading';
          else { const w = waiting.find((x) => x.t === t); if (w) state = `wait ${w.mode}`; }
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', minWidth: 36 }}>{t}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)', minWidth: 80 }}>{state}</span>
              <button className="btn" onClick={() => request(t, 'R')}>Read</button>
              <button className="btn btn-accent" onClick={() => request(t, 'W')}>Write</button>
              <button className="btn btn-ghost" onClick={() => release(t)}>Release</button>
            </div>
          );
        })}
      </div>
      <div className="controls" style={{ marginTop: '0.6rem' }}>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>
      <LogView entries={log} />
    </>
  );
}

/* ---------------- CHANNEL ---------------- */
function ChannelSandbox() {
  const [capacity, setCapacity] = useState(2);
  const [buffer, setBuffer] = useState([]);
  const [seq, setSeq] = useState(1);
  const [pBlocked, setPBlocked] = useState(false);
  const [cBlocked, setCBlocked] = useState(false);
  const [log, push, clear] = useLog();

  function send() {
    if (capacity === 0) {
      // Unbuffered: rendezvous required.
      if (cBlocked) { setCBlocked(false); push('ok', `Rendezvous: producer handed msg#${seq} to consumer.`); setSeq((s) => s + 1); }
      else { setPBlocked(true); push('info', `Producer blocked — no consumer ready (unbuffered).`); }
      return;
    }
    if (buffer.length >= capacity) { setPBlocked(true); push('info', `Producer blocked — buffer full (${capacity}).`); return; }
    // Consumer-was-waiting case: skip the buffer, hand off directly.
    if (cBlocked) {
      setCBlocked(false); setSeq((s) => s + 1);
      push('ok', `Producer pushed msg#${seq} → waiting consumer took it directly.`);
      return;
    }
    setBuffer((b) => [...b, `msg#${seq}`]);
    setSeq((s) => s + 1);
    setPBlocked(false);
    push('ok', `Producer pushed msg#${seq}. Buffer: ${buffer.length + 1}/${capacity}.`);
  }

  function receive() {
    if (capacity === 0) {
      if (pBlocked) { setPBlocked(false); push('ok', `Rendezvous: consumer received from producer.`); setSeq((s) => s + 1); }
      else { setCBlocked(true); push('info', `Consumer blocked — no producer ready (unbuffered).`); }
      return;
    }
    if (buffer.length === 0) { setCBlocked(true); push('info', `Consumer blocked — buffer empty.`); return; }
    const [head, ...rest] = buffer;
    setBuffer(rest); setCBlocked(false);
    push('ok', `Consumer received ${head}. Buffer: ${rest.length}/${capacity}.`);
  }

  function changeCap(n) { setCapacity(n); setBuffer([]); setPBlocked(false); setCBlocked(false); push('info', `Buffer = ${n}. Reset.`); }
  function reset() { setBuffer([]); setSeq(1); setPBlocked(false); setCBlocked(false); clear(); }

  return (
    <>
      <div className="controls" style={{ alignItems: 'center' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          Buffer: <strong>{capacity === 0 ? 'unbuffered' : capacity}</strong>
        </label>
        <input type="range" min={0} max={5} value={capacity} onChange={(e) => changeCap(+e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '0.8rem', alignItems: 'center', margin: '0.8rem 0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)' }}>Producer</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: pBlocked ? 'var(--accent)' : 'var(--ink-soft)' }}>
            {pBlocked ? 'BLOCKED' : 'ready'}
          </div>
          <button className="btn btn-accent" onClick={send} style={{ marginTop: '0.4rem' }}>Send msg#{seq}</button>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', minHeight: 50, alignItems: 'center', flexWrap: 'wrap' }}>
          {capacity === 0 ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>(no buffer — direct handoff)</div>
          ) : Array.from({ length: capacity }).map((_, i) => {
            const msg = buffer[i];
            return (
              <div key={i} style={{
                width: 60, height: 40, border: '2px solid var(--ink)', borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: msg ? 'var(--accent)' : 'var(--paper-deep)',
                color: msg ? 'white' : 'var(--ink-faint)',
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
              }}>{msg || '·'}</div>
            );
          })}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)' }}>Consumer</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: cBlocked ? 'var(--accent)' : 'var(--ink-soft)' }}>
            {cBlocked ? 'BLOCKED' : 'ready'}
          </div>
          <button className="btn" onClick={receive} style={{ marginTop: '0.4rem' }}>Receive</button>
        </div>
      </div>
      <div className="controls"><button className="btn btn-ghost" onClick={reset}>Reset</button></div>
      <LogView entries={log} />
    </>
  );
}

/* ---------------- ATOMIC / CAS ---------------- */
function CASSandbox() {
  const THREADS = ['T1', 'T2', 'T3'];
  const [counter, setCounter] = useState(0);
  const [log, push, clear] = useLog();
  const [inputs, setInputs] = useState({ T1: { exp: 0, neu: 1 }, T2: { exp: 0, neu: 2 }, T3: { exp: 0, neu: 3 } });

  function cas(t) {
    const { exp, neu } = inputs[t];
    if (counter === exp) { setCounter(neu); push('ok', `${t}: CAS(${exp}→${neu}) succeeded. Counter = ${neu}.`); }
    else                 { push('err', `${t}: CAS(${exp}→${neu}) FAILED. Saw ${counter}, expected ${exp}. Must retry.`); }
  }
  function setField(t, field, v) { setInputs((I) => ({ ...I, [t]: { ...I[t], [field]: Number.isFinite(+v) ? +v : 0 } })); }
  function reset() { setCounter(0); clear(); }

  return (
    <>
      <div className="metrics">
        <div className="metric accent">
          <div className="label">Shared counter</div>
          <div className="value">{counter}</div>
        </div>
        <div className="metric">
          <div className="label">Semantics</div>
          <div className="value" style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>if (v == expected) v = new</div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.6rem' }}>
        {THREADS.map((t) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', minWidth: 36 }}>{t}</span>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              expected
              <input className="field" type="number" value={inputs[t].exp} onChange={(e) => setField(t, 'exp', e.target.value)} style={{ width: 60, marginLeft: '0.3rem' }} />
            </label>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              new
              <input className="field" type="number" value={inputs[t].neu} onChange={(e) => setField(t, 'neu', e.target.value)} style={{ width: 60, marginLeft: '0.3rem' }} />
            </label>
            <button className="btn btn-accent" onClick={() => cas(t)}>CAS</button>
          </div>
        ))}
      </div>
      <div className="controls" style={{ marginTop: '0.6rem' }}>
        <button className="btn btn-ghost" onClick={reset}>Reset counter</button>
      </div>
      <LogView entries={log} />
    </>
  );
}

/* ---------------- ROOT ---------------- */
const HINTS = {
  mutex:     'Try: T1 acquires, then T2 (blocks), then T3 (also blocks). Release T1 — T2 wakes up next, FIFO.',
  semaphore: 'With 2 permits, the first two pass instantly. The third blocks until one releases. Slide capacity up: more parallelism, less safety downstream.',
  rwlock:    'Several Reads coexist. Ask for a Write — it queues until readers drain. Once a Writer is queued, new Readers also block (no writer starvation).',
  channel:   'Buffered: producer pushes until full, then blocks. Consumer drains. Unbuffered (size 0): producer and consumer rendezvous — neither makes progress alone.',
  cas:       'Set all three threads to expect 0. Fire T1 — counter changes. Now T2 and T3 still expect 0, so they FAIL. They must re-read and retry: the lock-free retry loop.',
};

const SANDBOXES = { mutex: MutexSandbox, semaphore: SemaphoreSandbox, rwlock: RWLockSandbox, channel: ChannelSandbox, cas: CASSandbox };

export default function SyncPrimitivesWidget() {
  const [tab, setTab] = useState('mutex');
  const Sandbox = SANDBOXES[tab];
  return (
    <div className="widget">
      <div className="widget-title">Synchronisation primitives — try each one</div>
      <div className="controls">
        {TABS.map((t) => (
          <button key={t.key} className={`btn ${tab === t.key ? 'btn-accent' : ''}`} onClick={() => setTab(t.key)}>
            {t.name}
          </button>
        ))}
      </div>
      <div className="widget-stage" style={{ minHeight: 320, padding: '1rem' }}>
        <Sandbox key={tab} />
      </div>
      <div className="callout">{HINTS[tab]}</div>
    </div>
  );
}
