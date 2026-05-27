import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Distributed locking, the hard way: three clients race for a critical
// section (a shared counter). The learner picks an algorithm, fires
// failure injections (GC pause, partition, clock skew), and watches the
// invariant break — two clients believing they hold the lock at once.
// Toggling "fencing tokens" shows the canonical fix: the protected
// resource rejects writes carrying a stale monotonic token.

const ALGOS = {
  naive:   { key: 'naive',   label: 'Naive SET+TTL',     nodes: 1, quorum: 1 },
  redlock: { key: 'redlock', label: 'Redlock (5 nodes)', nodes: 5, quorum: 3 },
  zk:      { key: 'zk',      label: 'ZooKeeper seq',     nodes: 1, quorum: 1 },
};

const TTL_MS = 8000;
const TICK_MS = 200;
const GC_PAUSE_MS = 5000;
const SKEW_MS = 10000;

const CLIENT_DEFS = [
  { id: 'C1', color: '#1c6dd0' },
  { id: 'C2', color: '#2a8a3e' },
  { id: 'C3', color: '#b58900' },
];

const tsNow = () => new Date().toLocaleTimeString([], { hour12: false });

function initialState() {
  return {
    now: 0, algo: 'naive', fencing: false,
    clients: CLIENT_DEFS.map(() => ({
      gcUntil: 0, skew: 0, partitioned: false,
      holds: false, token: null, leaseExpiresLocal: 0,
    })),
    lock: { owner: null, token: null, expires: 0, nodes: [false, false, false, false, false] },
    counter: { value: 0, lastWriter: null, lastToken: 0 },
    nextToken: 1, log: [], metrics: { acquires: 0, conflicts: 0, fenced: 0 },
  };
}

function pushLog(s, msg, kind = 'info') {
  s.log = [...s.log.slice(-40), { ts: tsNow(), msg, kind }];
}

// Server-side truth: is the lock currently held and unexpired?
const serverHolder = (s) => (s.lock.owner != null && s.now < s.lock.expires ? s.lock.owner : null);

// Who *believes* they hold an unexpired lease, by their own local clock?
// More than one believer == split brain.
function believedHolders(s) {
  const out = [];
  s.clients.forEach((c, i) => {
    if (!c.holds) return;
    if (s.now + c.skew >= c.leaseExpiresLocal) return;
    out.push(i);
  });
  return out;
}

export default function DistributedLocksWidget() {
  const [s, setS] = useState(initialState);

  // Sim clock — everything else reacts to `now`.
  useEffect(() => {
    const id = setInterval(() => {
      setS((prev) => {
        const next = { ...prev, lock: { ...prev.lock } };
        next.now = prev.now + TICK_MS;
        if (next.lock.owner != null && next.now >= next.lock.expires) {
          if (prev.now < prev.lock.expires) {
            pushLog(next, `Lock lease expired at server (was held by ${CLIENT_DEFS[next.lock.owner].id})`, 'info');
          }
          next.lock = { ...next.lock, owner: null };
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const algoDef = ALGOS[s.algo];
  const trueOwner = serverHolder(s);
  const believers = believedHolders(s);

  function pickAlgo(k) {
    const fresh = initialState();
    fresh.algo = k;
    pushLog(fresh, `Algorithm switched to ${ALGOS[k].label}`, 'info');
    setS(fresh);
  }
  function toggleFencing() {
    setS((p) => {
      const n = { ...p, fencing: !p.fencing, log: [...p.log] };
      pushLog(n, `Fencing tokens ${n.fencing ? 'ENABLED' : 'disabled'} on resource`, n.fencing ? 'ok' : 'info');
      return n;
    });
  }
  function reset() {
    const fresh = initialState();
    pushLog(fresh, 'World reset.', 'info');
    setS(fresh);
  }

  // Attempt acquire. Not a faithful algorithm impl — the goal is exposing
  // the failure modes a learner needs to feel.
  function acquire(i) {
    setS((p) => {
      const n = {
        ...p, clients: p.clients.map((c) => ({ ...c })),
        lock: { ...p.lock }, log: [...p.log], metrics: { ...p.metrics },
      };
      const me = n.clients[i], def = CLIENT_DEFS[i];
      if (me.gcUntil > n.now) { pushLog(n, `${def.id} is GC-paused — request not even sent`, 'err'); return n; }
      if (me.partitioned)     { pushLog(n, `${def.id} cannot reach lock service (partitioned)`, 'err'); return n; }

      const liveOwner = n.lock.owner != null && n.now < n.lock.expires ? n.lock.owner : null;

      if (n.algo === 'redlock') {
        const up = 5 - n.lock.nodes.filter(Boolean).length;
        if (up < ALGOS.redlock.quorum) {
          pushLog(n, `${def.id} Redlock: only ${up}/5 nodes up, no quorum`, 'err');
          return n;
        }
      }
      if (liveOwner != null && liveOwner !== i) {
        pushLog(n, `${def.id} acquire denied — ${CLIENT_DEFS[liveOwner].id} holds the lock`, 'err');
        return n;
      }

      // Grant. Issue a monotonic token regardless of fencing toggle — the
      // toggle only changes whether the resource enforces it.
      const token = n.nextToken++;
      n.lock.owner = i; n.lock.token = token; n.lock.expires = n.now + TTL_MS;
      me.holds = true; me.token = token;
      // Client computes expiry against ITS OWN clock — seed of the
      // clock-skew bug: a skewed client trusts a wrong "now".
      me.leaseExpiresLocal = n.now + me.skew + TTL_MS;
      n.metrics.acquires += 1;
      pushLog(n, `${def.id} acquired lock with token=${token} (algo: ${ALGOS[n.algo].label})`, 'ok');
      return n;
    });
  }

  // Write to the protected resource. Fencing saves us here — a stale
  // token gets rejected even if the client believes it still owns.
  function doWork(i) {
    setS((p) => {
      const n = {
        ...p, clients: p.clients.map((c) => ({ ...c })),
        counter: { ...p.counter }, log: [...p.log], metrics: { ...p.metrics },
      };
      const me = n.clients[i], def = CLIENT_DEFS[i];
      if (me.gcUntil > n.now) { pushLog(n, `${def.id} GC-paused, cannot write`, 'err'); return n; }
      if (!me.holds)          { pushLog(n, `${def.id} tried to write without holding the lock`, 'err'); return n; }

      // Local-clock check: the client thinks the lease is still good.
      const localNow = n.now + me.skew;
      if (localNow >= me.leaseExpiresLocal) {
        pushLog(n, `${def.id} sees its own lease expired, abandons write`, 'info');
        me.holds = false;
        return n;
      }
      if (n.fencing && me.token != null && me.token < n.counter.lastToken) {
        n.metrics.fenced += 1;
        pushLog(n, `Resource REJECTED ${def.id}'s write — stale token ${me.token} < ${n.counter.lastToken}`, 'err');
        me.holds = false;
        return n;
      }

      n.counter.value += 1;
      n.counter.lastWriter = i;
      n.counter.lastToken = me.token || 0;
      pushLog(n, `${def.id} wrote counter -> ${n.counter.value} (token ${me.token})`, 'ok');

      // Conflict: were two clients believing they held the lock at write?
      const dual = believedHolders(n);
      if (dual.length > 1) {
        n.metrics.conflicts += 1;
        pushLog(n, `CONFLICT: ${dual.map((j) => CLIENT_DEFS[j].id).join(', ')} both think they hold the lock`, 'err');
      }
      return n;
    });
  }

  // Failure injections — each makes the next acquire/work behave wrongly.
  function injectGc(i) {
    setS((p) => {
      const n = { ...p, clients: p.clients.map((c, j) => j === i ? { ...c, gcUntil: p.now + GC_PAUSE_MS } : c), log: [...p.log] };
      pushLog(n, `${CLIENT_DEFS[i].id} GC pause for ${GC_PAUSE_MS / 1000}s — frozen mid-execution`, 'err');
      return n;
    });
  }
  function injectPartition(i) {
    setS((p) => {
      const n = { ...p, clients: p.clients.map((c, j) => j === i ? { ...c, partitioned: !c.partitioned } : c), log: [...p.log] };
      const now = n.clients[i].partitioned;
      pushLog(n, `${CLIENT_DEFS[i].id} ${now ? 'PARTITIONED' : 'rejoined'} — still believes it holds lock if it did`, now ? 'err' : 'ok');
      return n;
    });
  }
  function injectSkew(i) {
    setS((p) => {
      const n = { ...p, clients: p.clients.map((c, j) => j === i ? { ...c, skew: c.skew + SKEW_MS } : c), log: [...p.log] };
      pushLog(n, `${CLIENT_DEFS[i].id} clock skewed +${SKEW_MS / 1000}s (now thinks lease lasts longer)`, 'err');
      return n;
    });
  }
  function toggleNode(idx) {
    setS((p) => {
      const nodes = [...p.lock.nodes]; nodes[idx] = !nodes[idx];
      const n = { ...p, lock: { ...p.lock, nodes }, log: [...p.log] };
      pushLog(n, `Redis node R${idx} ${nodes[idx] ? 'DOWN' : 'up'}`, nodes[idx] ? 'err' : 'ok');
      return n;
    });
  }

  const CX = 360, LOCK_Y = 80, CLIENT_Y = 240;
  const CLIENT_X = [120, 360, 600];
  const lockExpiresIn = useMemo(() => s.lock.owner == null ? 0 : Math.max(0, s.lock.expires - s.now), [s.lock, s.now]);

  return (
    <div className="widget">
      <div className="widget-title">Distributed locks — clocks, pauses, partitions, and the fencing fix</div>

      <div className="controls" style={{ flexWrap: 'wrap', gap: '0.6rem' }}>
        <div className="pill-group" role="radiogroup" aria-label="Algorithm">
          {Object.values(ALGOS).map((a) => (
            <span key={a.key}>
              <input type="radio" id={`algo-${a.key}`} name="algo"
                checked={s.algo === a.key} onChange={() => pickAlgo(a.key)} />
              <label htmlFor={`algo-${a.key}`}>{a.label}</label>
            </span>
          ))}
        </div>
        <button className={`btn ${s.fencing ? 'btn-accent' : ''}`} onClick={toggleFencing}>
          Fencing tokens: {s.fencing ? 'ON' : 'OFF'}
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      <div className="widget-stage" style={{ minHeight: 320 }}>
        <svg viewBox="0 0 720 330" width="100%" style={{ maxWidth: 760 }}>
          {/* Lock service */}
          <motion.g animate={{ scale: trueOwner != null ? 1.02 : 1 }} transition={{ duration: 0.2 }}>
            <rect x={CX - 110} y={LOCK_Y - 38} width={220} height={76} rx={6}
              fill={trueOwner != null ? '#fff4cc' : 'var(--paper)'}
              stroke={believers.length > 1 ? 'var(--accent)' : 'var(--ink)'} strokeWidth={2.5} />
            <text x={CX} y={LOCK_Y - 18} textAnchor="middle"
              style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '1px' }}>LOCK SERVICE</text>
            <text x={CX} y={LOCK_Y - 2} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
              {trueOwner != null ? `held by ${CLIENT_DEFS[trueOwner].id}` : 'free'}
            </text>
            <text x={CX} y={LOCK_Y + 14} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>
              {trueOwner != null ? `expires in ${(lockExpiresIn / 1000).toFixed(1)}s` : `token next: ${s.nextToken}`}
            </text>
            <text x={CX} y={LOCK_Y + 28} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>
              {s.lock.token != null ? `last token: ${s.lock.token}` : ''}
            </text>
          </motion.g>

          {/* Redlock node ribbon */}
          {s.algo === 'redlock' && (
            <g>
              <text x={CX} y={142} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
                click a node to flip it (need {ALGOS.redlock.quorum}/5 up)
              </text>
              {[0, 1, 2, 3, 4].map((i) => {
                const x = CX - 90 + i * 45;
                const down = s.lock.nodes[i];
                return (
                  <g key={`rn-${i}`} onClick={() => toggleNode(i)} style={{ cursor: 'pointer' }}>
                    <rect x={x - 16} y={150} width={32} height={22} rx={3}
                      fill={down ? '#f7c8c8' : '#d9ead3'} stroke="var(--ink)" strokeWidth={1.5} />
                    <text x={x} y={165} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>
                      R{i}{down ? '!' : ''}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Protected resource */}
          <g>
            <rect x={CX - 80} y={300} width={160} height={22} rx={3} fill="var(--paper-deep)" stroke="var(--ink)" strokeWidth={1.5} />
            <text x={CX} y={315} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
              counter = {s.counter.value}  (last tok {s.counter.lastToken})
            </text>
          </g>

          {/* Clients */}
          {s.clients.map((c, i) => {
            const def = CLIENT_DEFS[i];
            const x = CLIENT_X[i];
            const localNow = s.now + c.skew;
            const believes = c.holds && localNow < c.leaseExpiresLocal;
            const lies = believes && trueOwner !== i;
            const ringColor = lies ? 'var(--accent)' : (believes ? def.color : 'var(--ink)');
            return (
              <motion.g key={def.id}
                animate={c.gcUntil > s.now ? { opacity: [0.4, 0.7, 0.4] } : { opacity: 1 }}
                transition={{ duration: 1.2, repeat: c.gcUntil > s.now ? Infinity : 0 }}>
                <line x1={x} y1={CLIENT_Y - 32} x2={CX} y2={LOCK_Y + 38}
                  stroke={c.partitioned ? 'var(--accent)' : (believes ? def.color : '#ccc')}
                  strokeWidth={believes ? 2.5 : 1.5}
                  strokeDasharray={c.partitioned ? '4 4' : (believes ? undefined : '3 4')} />
                {c.partitioned && (
                  <text x={(x + CX) / 2} y={(CLIENT_Y - 32 + LOCK_Y + 38) / 2 - 4} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--accent)', fontWeight: 700 }}>
                    X partitioned
                  </text>
                )}
                <rect x={x - 60} y={CLIENT_Y - 32} width={120} height={64} rx={6}
                  fill={believes ? '#fff4cc' : 'var(--paper)'} stroke={ringColor} strokeWidth={lies ? 3.5 : 2.5} />
                <text x={x} y={CLIENT_Y - 14} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 13, fill: def.color }}>{def.id}</text>
                <text x={x} y={CLIENT_Y + 2} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>
                  {c.gcUntil > s.now ? 'GC paused' : (c.partitioned ? 'partitioned' : (believes ? `holds tok ${c.token}` : 'idle'))}
                </text>
                <text x={x} y={CLIENT_Y + 16} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
                  {c.skew ? `clock +${c.skew / 1000}s` : 'clock ok'}
                  {believes ? ` · lease ${((c.leaseExpiresLocal - localNow) / 1000).toFixed(1)}s` : ''}
                </text>
              </motion.g>
            );
          })}

          <AnimatePresence>
            {believers.length > 1 && (
              <motion.text key="conflict" x={CX} y={205} textAnchor="middle"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontFamily: 'var(--font-display)', fontSize: 14, fill: 'var(--accent)', fontWeight: 700 }}>
                SPLIT BRAIN: {believers.map((i) => CLIENT_DEFS[i].id).join(' + ')} both think they hold the lock
              </motion.text>
            )}
          </AnimatePresence>
        </svg>
      </div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        {s.clients.map((c, i) => {
          const def = CLIENT_DEFS[i];
          return (
            <div key={`row-${i}`} style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center', borderRight: i < 2 ? '1px dashed var(--ink-faint)' : 'none', paddingRight: '0.5rem' }}>
              <span className="badge" style={{ background: def.color, color: 'white', borderColor: def.color }}>{def.id}</span>
              <button className="btn btn-accent" onClick={() => acquire(i)}>Acquire</button>
              <button className="btn" onClick={() => doWork(i)} disabled={!c.holds}>Write</button>
              <button className="btn" onClick={() => injectGc(i)} style={{ borderColor: 'var(--accent)' }}>GC 5s</button>
              <button className="btn" onClick={() => injectPartition(i)} style={{ borderColor: 'var(--accent)' }}>{c.partitioned ? 'Heal' : 'Partition'}</button>
              <button className="btn" onClick={() => injectSkew(i)} style={{ borderColor: 'var(--accent)' }}>Skew +10s</button>
            </div>
          );
        })}
      </div>

      <div className="metrics">
        <div className="metric"><div className="label">Acquires</div><div className="value">{s.metrics.acquires}</div></div>
        <div className={`metric ${s.metrics.conflicts > 0 ? 'accent' : ''}`}>
          <div className="label">Conflicts</div><div className="value">{s.metrics.conflicts}</div>
        </div>
        <div className="metric"><div className="label">Fenced rejects</div><div className="value">{s.metrics.fenced}</div></div>
        <div className="metric"><div className="label">Sim clock</div><div className="value" style={{ fontSize: '1.1rem' }}>{(s.now / 1000).toFixed(1)}s</div></div>
      </div>

      <div className="callout">
        <strong>Try the canonical break.</strong> Pick <em>Naive</em>, have C1 acquire, then "GC 5s" on C1 and immediately have C2 acquire (lease expires while C1 is frozen). When C1 resumes it still <em>thinks</em> it holds the lock and writes — two writers, one critical section. Now toggle <em>Fencing tokens ON</em> and repeat: the resource sees C1's old token and rejects the write.
        {believers.length > 1 && (
          <div style={{ marginTop: '0.5rem', color: 'var(--accent)', fontWeight: 600 }}>
            Split brain right now: {believers.map((i) => CLIENT_DEFS[i].id).join(', ')} both believe they own the lock.
            {s.fencing ? ' Fencing will reject the loser at write time.' : ' Without fencing, whoever writes last wins — silently corrupting state.'}
          </div>
        )}
        {algoDef.key === 'redlock' && (
          <div style={{ marginTop: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
            Redlock needs majority ({ALGOS.redlock.quorum}/5). Click red nodes in the diagram to flip them down — partition the quorum and acquires fail.
          </div>
        )}
        {algoDef.key === 'zk' && (
          <div style={{ marginTop: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
            ZooKeeper sequential nodes give an inherent ordering — its zxid is effectively a fencing token. Even so, a GC-paused holder still sees stale local state, so the resource must check the token.
          </div>
        )}
      </div>

      <div className="log" aria-label="event log">
        {s.log.length === 0 && (
          <div className="entry" style={{ color: 'var(--ink-faint)' }}>
            <span className="t">--:--:--</span>Press Acquire on a client, then Write. Inject a failure and watch the invariant break.
          </div>
        )}
        {s.log.map((e, idx) => (
          <div key={idx} className={`entry ${e.kind}`}>
            <span className="t">{e.ts}</span>{e.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
