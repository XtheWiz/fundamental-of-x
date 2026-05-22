import { useState } from 'react';

const PLATFORM_STACK_KB = 1024;
const VIRTUAL_STACK_KB = 1;     // ~1KB resting size (continuation only)

export default function VirtualThreadsWidget() {
  const [threads, setThreads] = useState(10000);
  const platMem = (threads * PLATFORM_STACK_KB) / 1024;
  const virtMem = (threads * VIRTUAL_STACK_KB) / 1024;

  return (
    <div className="widget">
      <div className="widget-title">Platform threads vs virtual threads (Project Loom)</div>
      <div className="controls">
        <label>Active requests / threads: <strong style={{ fontFamily: 'var(--font-mono)' }}>{threads.toLocaleString()}</strong></label>
        <input type="range" min="100" max="1000000" step="100" value={threads}
          onChange={(e) => setThreads(+e.target.value)} style={{ flex: 1 }} />
      </div>
      <div className="widget-stage" style={{ minHeight: 280, padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 4, padding: '1rem', boxShadow: '4px 4px 0 var(--ink)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.4rem' }}>Platform thread</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.8rem' }}>1 MB stack · 1:1 OS thread</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700,
              color: platMem > 10 * 1024 ? 'var(--accent)' : 'var(--ink)' }}>
              {platMem >= 1024 ? (platMem / 1024).toFixed(1) + ' GB' : platMem.toFixed(0) + ' MB'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-faint)', marginTop: '0.5rem' }}>
              {threads > 10000 ? '⚠ would OOM on most servers' : 'survivable'}
            </div>
          </div>
          <div style={{ background: 'var(--paper)', border: '2px solid var(--accent)', borderRadius: 4, padding: '1rem', boxShadow: '4px 4px 0 var(--ink)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--accent)' }}>Virtual thread</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.8rem' }}>~1 KB resting · M:N on carriers</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700 }}>
              {virtMem >= 1 ? virtMem.toFixed(1) + ' MB' : (virtMem * 1024).toFixed(0) + ' KB'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-faint)', marginTop: '0.5rem' }}>
              fits easily — even at 1M
            </div>
          </div>
        </div>
        <div style={{ marginTop: '1rem', padding: '0.8rem 1rem', background: 'var(--paper-deep)', border: '1.5px solid var(--ink)', borderRadius: 4 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            Memory ratio: <strong>{(platMem / virtMem).toFixed(0)}×</strong> more for platform threads.
            That&apos;s the whole pitch: same Thread API, same blocking calls, ~1000× more capacity.
          </div>
        </div>
      </div>
      <div className="callout">
        Loom keeps the synchronous-blocking programming model — <code>Thread.sleep()</code>, blocking I/O, the works — while giving you scale you used to need async/await for. Code that used to need CompletableFuture chains can now be straight-line again.
      </div>
    </div>
  );
}
