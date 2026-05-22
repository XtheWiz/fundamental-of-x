import { useEffect, useRef, useState } from 'react';

// Visualize a small Go scheduler: M carriers, queues of runnable goroutines,
// work-stealing when one carrier runs out.

const CARRIERS = 3;
const N_GOROUTINES = 9;

function initialQueues() {
  // Unbalanced: most goroutines on carrier 0, demonstrating work-stealing.
  return [
    [0, 1, 2, 3, 4],
    [5, 6],
    [7, 8],
  ];
}

export default function GoroutinesWidget() {
  const [queues, setQueues] = useState(initialQueues);
  const [running, setRunning] = useState([null, null, null]);
  const [completed, setCompleted] = useState([]);
  const [tick, setTick] = useState(0);
  const playRef = useRef(false);

  useEffect(() => {
    if (!playRef.current) return;
    const id = setInterval(() => setTick((t) => t + 1), 700);
    return () => clearInterval(id);
  }, [playRef.current]);

  useEffect(() => {
    if (tick === 0) return;
    setQueues((qs) => {
      const newQueues = qs.map((q) => [...q]);
      const newRunning = [...running];
      const newCompleted = [...completed];
      // Each carrier: complete its current goroutine, dequeue the next.
      for (let c = 0; c < CARRIERS; c++) {
        if (newRunning[c] !== null) {
          newCompleted.push(newRunning[c]);
          newRunning[c] = null;
        }
        if (newQueues[c].length > 0) {
          newRunning[c] = newQueues[c].shift();
        } else {
          // Steal from the most-loaded queue
          let donor = -1, maxLen = 1;
          for (let i = 0; i < CARRIERS; i++) {
            if (newQueues[i].length > maxLen) { donor = i; maxLen = newQueues[i].length; }
          }
          if (donor >= 0) {
            const stolen = newQueues[donor].pop();
            newRunning[c] = stolen;
          }
        }
      }
      setRunning(newRunning);
      setCompleted(newCompleted);
      if (newQueues.every((q) => q.length === 0) && newRunning.every((r) => r === null)) {
        playRef.current = false;
      }
      return newQueues;
    });
  }, [tick]);

  function start() {
    playRef.current = true;
    setTick((t) => t + 1);
  }
  function reset() {
    playRef.current = false;
    setQueues(initialQueues());
    setRunning([null, null, null]);
    setCompleted([]);
    setTick(0);
  }

  return (
    <div className="widget">
      <div className="widget-title">Work-stealing scheduler (GOMAXPROCS=3)</div>
      <div className="controls">
        <button className="btn btn-accent" onClick={start}>Step the scheduler</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>
      <div className="widget-stage" style={{ minHeight: 260, padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${CARRIERS}, 1fr)`, gap: '0.8rem' }}>
          {Array.from({ length: CARRIERS }).map((_, c) => (
            <div key={c} style={{ background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 4, padding: '0.7rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.4rem' }}>Carrier P{c}</div>
              <div style={{
                padding: '0.5rem', background: running[c] !== null ? '#2a8a3e' : 'var(--paper-deep)',
                color: running[c] !== null ? 'white' : 'var(--ink-soft)',
                border: '1.5px solid var(--ink)', borderRadius: 3, marginBottom: '0.5rem',
                fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textAlign: 'center',
              }}>
                {running[c] !== null ? `running G${running[c]}` : 'idle'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)', marginBottom: '0.3rem' }}>queue:</div>
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', minHeight: 30 }}>
                {queues[c].map((g) => (
                  <span key={g} style={{
                    padding: '0.2em 0.5em', background: 'var(--accent-soft)', border: '1.5px solid var(--ink)',
                    borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600,
                  }}>G{g}</span>
                ))}
                {queues[c].length === 0 && <span style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>(empty)</span>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem', padding: '0.6rem 0.8rem', background: 'var(--paper-deep)', border: '1.5px solid var(--ink)', borderRadius: 4 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Completed</div>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.3rem', minHeight: 24 }}>
            {completed.map((g, i) => (
              <span key={i} style={{
                padding: '0.15em 0.45em', background: 'var(--ink)', color: 'var(--paper)',
                borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
              }}>G{g}</span>
            ))}
            {completed.length === 0 && <span style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>none yet</span>}
          </div>
        </div>
      </div>
      <div className="callout">
        Carrier P0 starts overloaded (5 goroutines); P1 and P2 have less. Step the scheduler — when P1 and P2 run out, they <strong>steal</strong> from P0&apos;s queue. That&apos;s how Go keeps all cores busy without you having to partition work.
      </div>
    </div>
  );
}
