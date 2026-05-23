import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Decision tool: pick the requirements you care about → brokers re-rank.
// Each broker has a known boolean answer per requirement. Score = count
// of matched requirements. Cards re-sort live; top match gets a "why".

const REQUIREMENTS = [
  { id: 'replay',     label: 'Need replay',           hint: 'Consumer can rewind & re-read history' },
  { id: 'managed',    label: 'Managed service',       hint: 'No broker to operate yourself' },
  { id: 'lowLatency', label: 'Lowest latency',        hint: 'Sub-millisecond end-to-end' },
  { id: 'routing',    label: 'Complex routing',       hint: 'Fanout, topic patterns, header matching' },
  { id: 'durable',    label: 'Durable by default',    hint: 'Survives broker restart without extra setup' },
  { id: 'throughput', label: 'High throughput',       hint: 'At least one million messages per second' },
  { id: 'keyOrder',   label: 'Per-key ordering',      hint: 'Messages with the same key stay in order' },
];

const BROKERS = [
  {
    id: 'kafka',
    label: 'Kafka',
    sub: 'Distributed log',
    caps: { replay: true,  managed: false, lowLatency: false, routing: false, durable: true,  throughput: true,  keyOrder: true  },
    notes: {
      replay: 'Log retention is configurable from hours to forever',
      durable: 'Replicated to disk across brokers by default',
      throughput: 'Designed for millions of messages per second',
      keyOrder: 'Same key → same partition → guaranteed order',
    },
    weakness: 'No native fanout exchanges; sub-ms latency is unusual',
    operate: 'Self-hosted (or via Confluent / MSK)',
  },
  {
    id: 'rabbitmq',
    label: 'RabbitMQ',
    sub: 'Smart broker with rich routing',
    caps: { replay: false, managed: false, lowLatency: false, routing: true,  durable: true,  throughput: false, keyOrder: false },
    notes: {
      routing: 'Direct, topic, fanout, and header exchanges built in',
      durable: 'Persistent queues + publisher confirms',
    },
    weakness: 'No log/replay; per-node throughput in the tens of thousands',
    operate: 'Self-hosted (CloudAMQP for managed)',
  },
  {
    id: 'sqs',
    label: 'AWS SQS',
    sub: 'Fully managed queue',
    caps: { replay: false, managed: true,  lowLatency: false, routing: false, durable: true,  throughput: false, keyOrder: true  },
    notes: {
      managed: 'AWS runs it. No nodes, no patching',
      durable: 'Persisted across multiple AZs',
      keyOrder: 'FIFO queues use MessageGroupId for ordering',
    },
    weakness: 'Standard queue has no ordering; FIFO is capped to 3000 msg/s',
    operate: 'AWS only',
  },
  {
    id: 'nats-core',
    label: 'NATS core',
    sub: 'Lightweight pub/sub',
    caps: { replay: false, managed: false, lowLatency: true,  routing: true,  durable: false, throughput: true,  keyOrder: false },
    notes: {
      lowLatency: 'Single-digit microseconds in-cluster',
      routing: 'Subject-based with wildcards (foo.*.bar)',
      throughput: 'Easily clears 1M msgs/s on commodity hardware',
    },
    weakness: 'Fire-and-forget — messages dropped if no consumer is listening',
    operate: 'Self-hosted (Synadia Cloud for managed)',
  },
  {
    id: 'nats-jetstream',
    label: 'NATS JetStream',
    sub: 'NATS with durable streams',
    caps: { replay: true,  managed: false, lowLatency: true,  routing: true,  durable: true,  throughput: true,  keyOrder: true  },
    notes: {
      replay: 'Streams retain messages by count / age / size',
      lowLatency: 'Built on the same low-latency NATS core',
      durable: 'File or memory storage with replication',
      keyOrder: 'Per-subject ordering within a stream',
    },
    weakness: 'Newer than Kafka; smaller operational community',
    operate: 'Self-hosted (Synadia Cloud for managed)',
  },
  {
    id: 'redis',
    label: 'Redis Streams',
    sub: 'In-memory log with consumer groups',
    caps: { replay: true,  managed: false, lowLatency: true,  routing: false, durable: false, throughput: false, keyOrder: true  },
    notes: {
      replay: 'XREAD from any ID — full history available',
      lowLatency: 'In-memory, sub-millisecond typical',
      keyOrder: 'Single stream is strictly ordered',
    },
    weakness: 'Not durable by default; bounded by single-node memory',
    operate: 'Self-hosted (Redis Cloud / Elasticache for managed)',
  },
  {
    id: 'pubsub',
    label: 'Google Pub/Sub',
    sub: 'Managed global pub/sub',
    caps: { replay: true,  managed: true,  lowLatency: false, routing: false, durable: true,  throughput: true,  keyOrder: true  },
    notes: {
      replay: 'Seek-by-time within the retention window',
      managed: 'Google runs it. Autoscales',
      durable: 'Synchronously replicated across zones',
      throughput: 'Scales to millions of msg/s without sharding work',
      keyOrder: 'Ordering keys keep same-key messages in order',
    },
    weakness: 'No rich routing; latency typically tens of ms',
    operate: 'GCP only',
  },
];

function scoreBroker(broker, selected) {
  if (selected.length === 0) return 0;
  return selected.reduce((acc, req) => acc + (broker.caps[req] ? 1 : 0), 0);
}

function whyTopMatch(broker, selected) {
  const hits = selected.filter((r) => broker.caps[r]);
  if (hits.length === 0) return null;
  const phrases = hits.map((r) => broker.notes[r]).filter(Boolean);
  if (phrases.length === 0) {
    const labels = hits.map((r) => REQUIREMENTS.find((x) => x.id === r).label.toLowerCase());
    return `Matches all your requirements: ${labels.join(', ')}.`;
  }
  return phrases.join(' • ');
}

export default function ArchitecturesWidget() {
  const [selected, setSelected] = useState([]);

  function toggle(reqId) {
    setSelected((s) => (s.includes(reqId) ? s.filter((x) => x !== reqId) : [...s, reqId]));
  }
  function reset() { setSelected([]); }

  const ranked = useMemo(() => {
    const scored = BROKERS.map((b) => ({ broker: b, score: scoreBroker(b, selected) }));
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.broker.label.localeCompare(b.broker.label);
    });
    return scored;
  }, [selected]);

  const topScore = selected.length > 0 ? ranked[0].score : 0;
  const hasClearWinner =
    selected.length > 0 &&
    topScore > 0 &&
    (ranked.length === 1 || ranked[1].score < topScore);
  const winner = hasClearWinner ? ranked[0].broker : null;
  const noneMatch = selected.length > 0 && topScore === 0;

  return (
    <div className="widget">
      <div className="widget-title">Pick your requirements — find your broker</div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        {REQUIREMENTS.map((r) => {
          const on = selected.includes(r.id);
          return (
            <button
              key={r.id}
              className={`btn ${on ? 'btn-accent' : ''}`}
              onClick={() => toggle(r.id)}
              title={r.hint}
            >
              <span style={{ fontFamily: 'var(--font-mono)', marginRight: '0.4em' }}>
                [{on ? 'x' : ' '}]
              </span>
              {r.label}
            </button>
          );
        })}
        <button className="btn btn-ghost" onClick={reset} disabled={selected.length === 0} style={{ marginLeft: 'auto' }}>
          Reset
        </button>
      </div>

      <div className="metrics">
        <div className="metric">
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.8rem' }}>Requirements</span>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{selected.length} / {REQUIREMENTS.length}</strong>
        </div>
        <div className="metric">
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.8rem' }}>Top score</span>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
            {selected.length === 0 ? '—' : `${topScore} / ${selected.length}`}
          </strong>
        </div>
        <div className="metric">
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.8rem' }}>Top match</span>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
            {winner ? winner.label : selected.length === 0 ? 'all equal' : 'tie'}
          </strong>
        </div>
      </div>

      <div className="widget-stage" style={{ minHeight: 480, padding: '0.6rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.6rem' }}>
          <AnimatePresence>
            {ranked.map(({ broker, score }, idx) => {
              const isWinner = winner && broker.id === winner.id;
              const neutral = selected.length === 0;
              return (
                <motion.div
                  key={broker.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ layout: { type: 'spring', stiffness: 280, damping: 28 }, opacity: { duration: 0.2 } }}
                  style={{
                    background: 'var(--paper-deep)',
                    border: `${isWinner ? 3 : 2}px solid ${isWinner ? 'var(--accent)' : 'var(--ink)'}`,
                    borderRadius: 'var(--radius)',
                    padding: '0.7rem 0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    boxShadow: isWinner ? '4px 4px 0 var(--ink)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.4rem' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.03em' }}>
                        {broker.label}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                        {broker.sub}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                      {isWinner && <span className="badge" style={{ background: 'var(--accent)', color: 'white', border: '1.5px solid var(--ink)' }}>TOP MATCH</span>}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                        rank #{idx + 1}
                      </span>
                    </div>
                  </div>

                  {!neutral && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      score <strong style={{ fontSize: '0.95rem' }}>{score}</strong> / {selected.length}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {(neutral ? REQUIREMENTS : REQUIREMENTS.filter((r) => selected.includes(r.id))).map((r) => {
                      const ok = broker.caps[r.id];
                      return (
                        <span
                          key={r.id}
                          title={r.hint}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.72rem',
                            padding: '0.15em 0.5em',
                            borderRadius: 2,
                            border: '1.5px solid var(--ink)',
                            background: neutral
                              ? 'var(--paper)'
                              : ok
                                ? '#d9ead3'
                                : '#fde2e2',
                            color: 'var(--ink)',
                            opacity: neutral ? 0.7 : 1,
                          }}
                        >
                          {r.label} · {ok ? 'yes' : 'no'}
                        </span>
                      );
                    })}
                  </div>

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)', borderTop: '1px dashed var(--ink-soft)', paddingTop: '0.4rem' }}>
                    <div><strong>Operate:</strong> {broker.operate}</div>
                    <div><strong>Watch out:</strong> {broker.weakness}</div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="callout">
        {selected.length === 0 && (
          <>
            <strong>Pick the constraints you care about.</strong> Each requirement narrows the field —
            brokers re-rank live, and the best fit floats to the top with a "why" caption.
          </>
        )}
        {selected.length > 0 && winner && (
          <>
            <strong>{winner.label} wins ({topScore}/{selected.length}).</strong>{' '}
            {whyTopMatch(winner, selected)}
          </>
        )}
        {selected.length > 0 && !winner && !noneMatch && (
          <>
            <strong>It is a tie ({topScore}/{selected.length}).</strong>{' '}
            Multiple brokers cover the same set of requirements you picked — add another constraint to separate them.
          </>
        )}
        {noneMatch && (
          <>
            <strong>Nothing matches all of these.</strong> Some combinations rule out every broker — for
            example "managed service" + "lowest latency" is hard to find in one box. Try relaxing a constraint.
          </>
        )}
      </div>
    </div>
  );
}
