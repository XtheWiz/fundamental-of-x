import { useState } from 'react';

const STACK_KB = 1024;     // 1 MB default OS thread stack
const CTX_SWITCH_US = 5;   // typical context switch cost

export default function OSThreadsWidget() {
  const [threads, setThreads] = useState(100);

  const memMB = (threads * STACK_KB) / 1024;
  const switchesPerSec = threads > 8 ? Math.min(100_000, threads * 100) : 0;
  const ctxOverheadPct = (switchesPerSec * CTX_SWITCH_US) / 1_000_000 * 100;

  let verdict;
  if (threads <= 100) verdict = { label: 'Fine', color: '#2a8a3e', note: 'Small thread counts are cheap. The OS handles this without breaking a sweat.' };
  else if (threads <= 1000) verdict = { label: 'Acceptable', color: '#f59e0b', note: 'Hundreds of threads work. Server-class apps live here.' };
  else if (threads <= 10000) verdict = { label: 'Stressed', color: '#d62828', note: 'Stack memory adds up; context switches eat real CPU. Tune carefully.' };
  else verdict = { label: 'Broken', color: '#7e57c2', note: 'OS threads don\'t scale here. Time for virtual threads, goroutines, or async/await.' };

  return (
    <div className="widget">
      <div className="widget-title">How many OS threads can you actually run?</div>
      <div className="controls">
        <label>Threads: <strong style={{ fontFamily: 'var(--font-mono)' }}>{threads.toLocaleString()}</strong></label>
        <input type="range" min="1" max="100000" step="1" value={threads}
          onChange={(e) => setThreads(+e.target.value)} style={{ flex: 1 }} />
      </div>
      <div className="widget-stage" style={{ minHeight: 220, padding: '1.2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 4, padding: '0.8rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--ink-soft)' }}>Stack memory</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700 }}>
              {memMB >= 1024 ? (memMB / 1024).toFixed(1) + ' GB' : memMB.toFixed(0) + ' MB'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
              {threads.toLocaleString()} × 1 MB default stack
            </div>
          </div>
          <div style={{ background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 4, padding: '0.8rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--ink-soft)' }}>Context-switch overhead</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, color: ctxOverheadPct > 30 ? 'var(--accent)' : 'var(--ink)' }}>
              {ctxOverheadPct.toFixed(1)}% CPU
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
              ~5 μs per switch
            </div>
          </div>
        </div>
        <div style={{ padding: '0.8rem 1rem', background: verdict.color, color: 'white', border: '2px solid var(--ink)', borderRadius: 4 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{verdict.label}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{verdict.note}</div>
        </div>
      </div>
      <div className="callout">
        OS threads have hard limits. 1 MB stack × 100k threads = 100 GB just for stacks. Context switches at 5 μs apiece dominate above ~10k active threads. That ceiling is what every alternative (goroutines, virtual threads, async) is trying to break.
      </div>
    </div>
  );
}
