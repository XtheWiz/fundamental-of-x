import { useEffect, useRef, useState } from 'react';

// Visualize the blocking-syscall trap: many green threads on one OS thread.
// If one blocks (in classic green-thread model), ALL are stuck.

const N_GREEN = 8;

export default function GreenThreadsWidget() {
  const [running, setRunning] = useState(false);
  const [blockingIdx, setBlockingIdx] = useState(-1);
  const [tick, setTick] = useState(0);
  const [model, setModel] = useState('classic'); // 'classic' or 'modern'
  const rafRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 80);
    return () => clearInterval(id);
  }, [running]);

  function start() {
    setBlockingIdx(-1);
    setTick(0);
    setRunning(true);
  }

  function blockOne() {
    setBlockingIdx(2);
  }

  function unblock() {
    setBlockingIdx(-1);
  }

  // In classic model, if any green is blocking, all freeze.
  const allBlocked = model === 'classic' && blockingIdx >= 0;
  const activeIdx = allBlocked ? blockingIdx : (tick % N_GREEN);

  return (
    <div className="widget">
      <div className="widget-title">The blocking-syscall trap (classic vs modern)</div>
      <div className="controls">
        <button className={`btn ${model === 'classic' ? 'btn-accent' : ''}`} onClick={() => { setModel('classic'); setBlockingIdx(-1); }}>
          Classic green threads (1990s)
        </button>
        <button className={`btn ${model === 'modern' ? 'btn-accent' : ''}`} onClick={() => { setModel('modern'); setBlockingIdx(-1); }}>
          Modern (Loom / Go scheduler)
        </button>
      </div>
      <div className="controls">
        <button className="btn btn-accent" onClick={start} disabled={running}>Start</button>
        <button className="btn" onClick={blockOne} disabled={!running}>Make thread 3 block</button>
        <button className="btn btn-ghost" onClick={unblock}>Unblock</button>
        <button className="btn btn-ghost" onClick={() => { setRunning(false); setBlockingIdx(-1); setTick(0); }}>Reset</button>
      </div>
      <div className="widget-stage" style={{ minHeight: 240, padding: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
          OS thread (single carrier)
        </div>
        <div style={{ height: 30, background: '#1a1a1a', border: '2px solid var(--ink)', borderRadius: 4, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
          {allBlocked ? '⏸ blocked on syscall — nobody can run' : 'running'}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
          Green threads
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N_GREEN}, 1fr)`, gap: '0.4rem' }}>
          {Array.from({ length: N_GREEN }).map((_, i) => {
            const isBlocking = blockingIdx === i;
            const isActive = !allBlocked && activeIdx === i;
            let bg = 'var(--paper-deep)';
            let label = '';
            if (model === 'classic' && allBlocked) {
              bg = isBlocking ? 'var(--accent)' : 'var(--ink-faint)';
              label = isBlocking ? 'blocked' : 'stuck';
            } else if (model === 'modern' && isBlocking) {
              bg = 'var(--accent)';
              label = 'blocked';
            } else if (isActive) {
              bg = '#2a8a3e';
              label = 'running';
            } else if (running) {
              label = 'ready';
            }
            return (
              <div key={i} style={{
                padding: '0.6rem 0.4rem', background: bg, border: '1.5px solid var(--ink)', borderRadius: 4,
                textAlign: 'center', color: bg !== 'var(--paper-deep)' ? 'white' : 'var(--ink)',
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                transition: 'background 0.2s ease',
              }}>
                <div style={{ fontWeight: 700 }}>T{i + 1}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="callout">
        {model === 'classic'
          ? <>In the classic M:1 model, any blocking syscall freezes the whole party. Java&apos;s green threads were abandoned for exactly this. Press <strong>"Make thread 3 block"</strong> to see it.</>
          : <>Modern runtimes (Loom, Go) detect that a green thread blocks and either run it on a different OS thread or hand it off to async I/O. The other threads keep going.</>}
      </div>
    </div>
  );
}
