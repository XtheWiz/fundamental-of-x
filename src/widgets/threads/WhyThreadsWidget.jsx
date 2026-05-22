import { useEffect, useRef, useState } from 'react';

const TASKS = [
  { name: 'fetch API', duration: 300, color: '#1c6dd0' },
  { name: 'read file', duration: 200, color: '#2a8a3e' },
  { name: 'compute', duration: 400, color: '#d62828' },
  { name: 'render', duration: 150, color: '#f59e0b' },
];

export default function WhyThreadsWidget() {
  const [mode, setMode] = useState('sequential');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(TASKS.map(() => 0));
  const rafRef = useRef(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    const tick = (now) => {
      const elapsed = now - startRef.current;
      if (mode === 'sequential') {
        let used = 0;
        const newProg = TASKS.map((t) => {
          if (elapsed < used) return 0;
          const local = Math.min(t.duration, elapsed - used);
          used += t.duration;
          return Math.min(1, local / t.duration);
        });
        setProgress(newProg);
        if (elapsed >= TASKS.reduce((a, t) => a + t.duration, 0)) { setRunning(false); return; }
      } else {
        const newProg = TASKS.map((t) => Math.min(1, elapsed / t.duration));
        setProgress(newProg);
        if (newProg.every((p) => p >= 1)) { setRunning(false); return; }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, mode]);

  function run(m) {
    setMode(m);
    setProgress(TASKS.map(() => 0));
    setRunning(true);
  }

  const seqTotal = TASKS.reduce((a, t) => a + t.duration, 0);
  const concTotal = Math.max(...TASKS.map((t) => t.duration));

  return (
    <div className="widget">
      <div className="widget-title">Concurrency vs no concurrency — wall time</div>
      <div className="controls">
        <button className="btn btn-accent" onClick={() => run('sequential')}>Run sequentially</button>
        <button className="btn btn-accent" onClick={() => run('concurrent')}>Run concurrently</button>
      </div>
      <div className="widget-stage" style={{ minHeight: 220, padding: '1rem' }}>
        {TASKS.map((t, i) => (
          <div key={t.name} style={{ marginBottom: '0.7rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
              <span>{t.name}</span>
              <span style={{ color: 'var(--ink-soft)' }}>{t.duration}ms · {Math.round(progress[i] * 100)}%</span>
            </div>
            <div style={{ height: 20, background: 'var(--paper-deep)', border: '1.5px solid var(--ink)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${progress[i] * 100}%`, height: '100%', background: t.color,
                transition: 'width 0.05s linear',
              }} />
            </div>
          </div>
        ))}
      </div>
      <div className="metrics">
        <div className="metric"><div className="label">Sequential total</div><div className="value">{seqTotal} ms</div></div>
        <div className="metric accent"><div className="label">Concurrent total</div><div className="value">{concTotal} ms</div></div>
        <div className="metric"><div className="label">Speedup</div><div className="value">{(seqTotal / concTotal).toFixed(1)}×</div></div>
      </div>
      <div className="callout">
        Sequential: each task waits for the previous to finish — {seqTotal}ms.
        Concurrent: all four run in flight together — wall time is the slowest one, {concTotal}ms.
        Concurrency doesn&apos;t make any single task faster — it overlaps the waits.
      </div>
    </div>
  );
}
