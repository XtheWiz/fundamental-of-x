import { useState } from 'react';

const SCENARIOS = {
  deadlock: {
    name: 'Deadlock',
    desc: 'T1 holds A, wants B. T2 holds B, wants A. Both wait forever.',
    cpu: 'idle',
    progress: false,
    fix: 'Acquire locks in a consistent global order (e.g., always lower address first).',
  },
  livelock: {
    name: 'Livelock',
    desc: 'Two polite threads back off when they see each other — and back off again. CPU busy, no progress.',
    cpu: 'busy',
    progress: false,
    fix: 'Add randomised backoff (exponential backoff with jitter).',
  },
  starvation: {
    name: 'Starvation',
    desc: 'Many threads keep grabbing the lock; one thread never gets a chance.',
    cpu: 'busy',
    progress: 'some',
    fix: 'Use a fair lock (FIFO scheduling) or give priority to waiting threads.',
  },
};

export default function DeadlockWidget() {
  const [mode, setMode] = useState('deadlock');
  const s = SCENARIOS[mode];

  return (
    <div className="widget">
      <div className="widget-title">Three ways concurrent programs hang</div>
      <div className="controls">
        {Object.entries(SCENARIOS).map(([k, v]) => (
          <button key={k} className={`btn ${mode === k ? 'btn-accent' : ''}`} onClick={() => setMode(k)}>{v.name}</button>
        ))}
      </div>
      <div className="widget-stage" style={{ minHeight: 280, padding: '1rem' }}>
        {mode === 'deadlock' && (
          <svg viewBox="0 0 500 240" width="100%" style={{ maxWidth: 500 }}>
            <g>
              <rect x={40} y={40} width={140} height={70} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2.5} rx={6} />
              <text x={110} y={68} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>Thread 1</text>
              <text x={110} y={88} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-soft)' }}>holds A · wants B</text>
            </g>
            <g>
              <rect x={320} y={130} width={140} height={70} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2.5} rx={6} />
              <text x={390} y={158} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>Thread 2</text>
              <text x={390} y={178} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-soft)' }}>holds B · wants A</text>
            </g>
            <g>
              <rect x={250} y={40} width={70} height={50} fill="var(--accent-soft)" stroke="var(--ink)" strokeWidth={2} rx={4} />
              <text x={285} y={70} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>Lock B</text>
            </g>
            <g>
              <rect x={180} y={150} width={70} height={50} fill="var(--accent-soft)" stroke="var(--ink)" strokeWidth={2} rx={4} />
              <text x={215} y={180} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>Lock A</text>
            </g>
            <defs>
              <marker id="dl-arr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><polygon points="0 0,10 5,0 10" fill="var(--accent)" /></marker>
            </defs>
            <line x1={180} y1={75} x2={245} y2={75} stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="6 4" markerEnd="url(#dl-arr)" />
            <line x1={320} y1={165} x2={255} y2={165} stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="6 4" markerEnd="url(#dl-arr)" />
          </svg>
        )}
        {mode === 'livelock' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 4, padding: '0.8rem 1.2rem', boxShadow: '3px 3px 0 var(--ink)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Thread 1</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>"after you"</div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--accent)' }}>⇄</div>
              <div style={{ background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 4, padding: '0.8rem 1.2rem', boxShadow: '3px 3px 0 var(--ink)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Thread 2</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>"no, after you"</div>
              </div>
            </div>
            <div style={{ padding: '0.8rem 1rem', background: 'var(--paper-deep)', border: '1.5px solid var(--ink)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              Both threads detect contention, back off, retry... in lockstep. CPU pegged at 100%. Throughput zero.
            </div>
          </div>
        )}
        {mode === 'starvation' && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'center' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  padding: '0.5rem 0.7rem', background: i === 7 ? 'var(--paper-deep)' : '#2a8a3e',
                  color: i === 7 ? 'var(--ink-soft)' : 'white',
                  border: '1.5px solid var(--ink)', borderRadius: 3, fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem', fontWeight: 600,
                }}>
                  T{i + 1}
                  <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>{i === 7 ? 'waiting…' : 'busy'}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '0.8rem 1rem', background: 'var(--paper-deep)', border: '1.5px solid var(--ink)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              T1-T7 keep grabbing the lock before T8 wakes up. T8 never makes progress. The system works — for everyone except T8.
            </div>
          </div>
        )}
      </div>
      <div className="callout">
        <strong>{s.name}.</strong> {s.desc} CPU: <strong>{s.cpu}</strong>. <strong>Fix:</strong> {s.fix}
      </div>
    </div>
  );
}
