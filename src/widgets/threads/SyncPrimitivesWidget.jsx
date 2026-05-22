import { useState } from 'react';

const PRIMS = {
  mutex: {
    name: 'Mutex',
    desc: 'Exactly one thread inside the critical section.',
    when: 'When one thread\'s update must complete before any other can read or write.',
    risk: 'Forget to unlock = deadlock. Lock too long = contention.',
    code: `let mutex = Mutex::new(counter);

// thread A
let mut g = mutex.lock().unwrap();
*g += 1;
// guard drops -> lock released`,
  },
  semaphore: {
    name: 'Semaphore',
    desc: 'Up to N threads inside at a time.',
    when: 'Rate-limited resource: DB connection pool, file handles, parallel job slots.',
    risk: 'Choose N too low = bottleneck; too high = resource exhaustion downstream.',
    code: `let sem = Arc::new(Semaphore::new(10));

let permit = sem.acquire().await;
do_request().await;
// permit dropped -> slot freed`,
  },
  rwlock: {
    name: 'Read-write lock',
    desc: 'Many readers OR one writer.',
    when: 'Data read often, written rarely (caches, config).',
    risk: 'Writer starvation if readers always present. Implementation-dependent.',
    code: `let rw = RwLock::new(cache);

// many readers
let g = rw.read().unwrap();
return g.get(&key);

// exclusive writer
let mut g = rw.write().unwrap();
g.insert(k, v);`,
  },
  channel: {
    name: 'Channel',
    desc: 'Typed FIFO. Sender + receiver synchronise via the queue.',
    when: 'Pipeline of work; producer/consumer; replacing shared mutable state.',
    risk: 'Unbounded = OOM; bounded = backpressure (which is usually what you want).',
    code: `let (tx, rx) = mpsc::channel(100);

// producer
tx.send(job).await?;

// consumer
while let Some(job) = rx.recv().await {
    process(job);
}`,
  },
  cas: {
    name: 'Atomic / CAS',
    desc: 'Lock-free compare-and-swap on a primitive.',
    when: 'Highly contended counters, lock-free data structures.',
    risk: 'ABA problem, memory ordering subtleties, easy to write buggy lock-free code.',
    code: `let counter = AtomicU64::new(0);

// fast, lock-free increment
counter.fetch_add(1, Ordering::Relaxed);

// CAS: only swap if current matches expected
counter.compare_exchange(
  expected, new,
  Ordering::SeqCst,
  Ordering::Relaxed
);`,
  },
};

export default function SyncPrimitivesWidget() {
  const [key, setKey] = useState('mutex');
  const p = PRIMS[key];

  return (
    <div className="widget">
      <div className="widget-title">Synchronisation primitives — when to reach for each</div>
      <div className="controls">
        {Object.entries(PRIMS).map(([k, v]) => (
          <button key={k} className={`btn ${key === k ? 'btn-accent' : ''}`} onClick={() => setKey(k)}>{v.name}</button>
        ))}
      </div>
      <div className="widget-stage" style={{ minHeight: 320, padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ marginBottom: '0.8rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--ink-soft)' }}>What it is</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>{p.desc}</div>
            </div>
            <div style={{ marginBottom: '0.8rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--ink-soft)' }}>When to use</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>{p.when}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--accent)' }}>What goes wrong</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>{p.risk}</div>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>Sketch (Rust-ish)</div>
            <pre className="code-block" style={{ margin: 0, fontSize: '0.8rem' }}>{p.code}</pre>
          </div>
        </div>
      </div>
      <div className="callout">
        Use the simplest primitive that works. A mutex is easier to reason about than a CAS loop; a channel is easier than a mutex around a queue. Reach for low-level primitives only when measurements say you must.
      </div>
    </div>
  );
}
