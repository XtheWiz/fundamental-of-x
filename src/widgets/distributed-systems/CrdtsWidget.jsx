import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Two replicas, a partition toggle, per-replica ops, a sync button.
// Partition the link, do ops on both sides, sync — the merge function
// (max / union / max-by-ts) makes both replicas converge. The 'naive
// merge' button is the foil that overwrites instead of merging.

const CRDTS = {
  gcounter: {
    name: 'G-Counter',
    blurb: 'Grow-only counter. Each replica counts its own increments; merge takes the per-replica max.',
    guarantee: 'Convergence: component-wise max. Commutative, associative, idempotent.',
    usedIn: 'Riak DT, Redis CRDB, view/like counters.',
  },
  pncounter: {
    name: 'PN-Counter',
    blurb: 'Two G-Counters — one for increments, one for decrements. Value = sum(P) − sum(N).',
    guarantee: 'Merge by max on both halves. Negative ops without losing concurrent increments.',
    usedIn: 'Riak DT counters, cart quantities, vote tallies.',
  },
  gset: {
    name: 'G-Set',
    blurb: 'Grow-only set. Add only. Merge = set union.',
    guarantee: 'Convergence: union is commutative + idempotent. No remove operation exists.',
    usedIn: 'Append-only logs, tag collections, event archives.',
  },
  lww: {
    name: 'LWW-Register',
    blurb: 'Single value tagged with a timestamp. Merge keeps the higher timestamp.',
    guarantee: 'Convergence: max-by-timestamp wins. Ties broken by replica id. Loses concurrent writes.',
    usedIn: 'Cassandra cells, DNS records, user-profile fields.',
  },
  orset: {
    name: 'OR-Set',
    blurb: 'Observed-Remove set. Each add gets a unique tag; remove erases only tags it has seen.',
    guarantee: 'Concurrent add + remove → add wins. Re-adding after remove just works.',
    usedIn: 'Yjs, Automerge, collaborative editors, shared carts.',
  },
};

const CRDT_LIST = Object.keys(CRDTS);
const ITEM_POOL = ['apple', 'pear', 'kiwi', 'plum', 'mango', 'fig'];

function tsNow() {
  return new Date().toLocaleTimeString([], { hour12: false });
}

// ----- factory + ops + merge per CRDT type -----
// Replicas are { kind, A: {...counts}, B: {...counts} } objects. We store the
// per-replica counter under the replica's own id so merge can do component-max.

function emptyState(kind) {
  if (kind === 'gcounter') return { A: 0, B: 0 };
  if (kind === 'pncounter') return { P: { A: 0, B: 0 }, N: { A: 0, B: 0 } };
  if (kind === 'gset') return { items: [] };
  if (kind === 'lww') return { value: null, ts: 0, by: null };
  if (kind === 'orset') return { adds: [], removes: [] }; // adds:[{item,tag}], removes:[tag]
  return {};
}

function orsetLive(s) {
  const removed = new Set(s.removes);
  const live = new Set();
  for (const a of s.adds) if (!removed.has(a.tag)) live.add(a.item);
  return [...live].sort();
}

function displayValue(kind, s) {
  if (kind === 'gcounter') return String(s.A + s.B);
  if (kind === 'pncounter') return String((s.P.A + s.P.B) - (s.N.A + s.N.B));
  if (kind === 'gset') {
    const xs = [...s.items].sort();
    return xs.length === 0 ? '{ }' : `{ ${xs.join(', ')} }`;
  }
  if (kind === 'lww') return s.value === null ? '∅' : `"${s.value}" @${s.ts}`;
  if (kind === 'orset') {
    const xs = orsetLive(s);
    return xs.length === 0 ? '{ }' : `{ ${xs.join(', ')} }`;
  }
  return '';
}

function opInc(kind, s, r) {
  if (kind === 'gcounter') return { ...s, [r]: s[r] + 1 };
  if (kind === 'pncounter') return { ...s, P: { ...s.P, [r]: s.P[r] + 1 } };
  return s;
}
function opDec(kind, s, r) {
  if (kind === 'pncounter') return { ...s, N: { ...s.N, [r]: s.N[r] + 1 } };
  return s;
}
function opAdd(kind, s, r, item, tagCounter) {
  if (kind === 'gset') return s.items.includes(item) ? s : { ...s, items: [...s.items, item] };
  if (kind === 'orset') return { ...s, adds: [...s.adds, { item, tag: `${r}:${tagCounter}` }] };
  return s;
}
function opRemove(kind, s, item) {
  if (kind !== 'orset') return s;
  const kill = new Set([...s.removes, ...s.adds.filter((a) => a.item === item).map((a) => a.tag)]);
  return { ...s, removes: [...kill] };
}
function opSet(kind, s, r, value, clock) {
  return kind === 'lww' ? { value, ts: clock, by: r } : s;
}

function mergeCRDT(kind, a, b) {
  if (kind === 'gcounter') return { A: Math.max(a.A, b.A), B: Math.max(a.B, b.B) };
  if (kind === 'pncounter') return {
    P: { A: Math.max(a.P.A, b.P.A), B: Math.max(a.P.B, b.P.B) },
    N: { A: Math.max(a.N.A, b.N.A), B: Math.max(a.N.B, b.N.B) },
  };
  if (kind === 'gset') return { items: [...new Set([...a.items, ...b.items])] };
  if (kind === 'lww') {
    if (a.ts > b.ts) return { ...a };
    if (b.ts > a.ts) return { ...b };
    return (a.by || '') <= (b.by || '') ? { ...a } : { ...b };
  }
  if (kind === 'orset') {
    const adds = new Map();
    for (const x of [...a.adds, ...b.adds]) adds.set(x.tag, x);
    return { adds: [...adds.values()], removes: [...new Set([...a.removes, ...b.removes])] };
  }
  return a;
}

// Foil: naive last-writer-wins overwrites the other replica wholesale.
function naiveMerge(_k, a, b, w) { return w === 'A' ? structuredClone(a) : structuredClone(b); }

const MERGE_DESCR = {
  gcounter: 'max(A, B) per replica → sum',
  pncounter: 'max on P and N halves independently → P − N',
  gset: 'set union of items',
  lww: 'pick the value with the larger timestamp',
  orset: 'union of (add tags) minus union of (remove tags)',
};

export default function CrdtsWidget() {
  const [kind, setKind] = useState('gcounter');
  const [partitioned, setPartitioned] = useState(false);
  const [A, setA] = useState(() => emptyState('gcounter'));
  const [B, setB] = useState(() => emptyState('gcounter'));
  const [itemA, setItemA] = useState('apple');
  const [itemB, setItemB] = useState('pear');
  const [lwwA, setLwwA] = useState('hello');
  const [lwwB, setLwwB] = useState('world');
  const [log, setLog] = useState([]);
  const [naivePreview, setNaivePreview] = useState(null);
  const clockRef = useRef(0);
  const tagRef = useRef(0);
  const lastWriter = useRef('A');

  // Unpartitioned ops auto-merge into the peer — instant anti-entropy.
  function pushLog(entry) {
    setLog((prev) => [...prev, { ts: tsNow(), ...entry }].slice(-80));
  }

  function pickKind(k) {
    setKind(k);
    setA(emptyState(k));
    setB(emptyState(k));
    setNaivePreview(null);
    setLog([]);
    clockRef.current = 0;
    tagRef.current = 0;
    pushLog({ kind: 'info', msg: `Switched CRDT to ${CRDTS[k].name}. Replicas reset.` });
  }

  function applyOp(replica, mutator, descr) {
    lastWriter.current = replica;
    setNaivePreview(null);
    const setSelf = replica === 'A' ? setA : setB;
    const setPeer = replica === 'A' ? setB : setA;
    setSelf((prev) => {
      const next = mutator(prev);
      if (!partitioned) setPeer((peer) => mergeCRDT(kind, next, peer));
      return next;
    });
    pushLog({ kind: 'info', msg: `${replica}: ${descr}${partitioned ? ' (local only — partitioned)' : ''}` });
  }

  function inc(r) { applyOp(r, (s) => opInc(kind, s, r), '+1'); }
  function dec(r) { applyOp(r, (s) => opDec(kind, s, r), '-1'); }
  function add(r, item) {
    applyOp(r, (s) => { tagRef.current += 1; return opAdd(kind, s, r, item, tagRef.current); }, `add "${item}"`);
  }
  function remove(r, item) { applyOp(r, (s) => opRemove(kind, s, item), `remove "${item}"`); }
  function setLww(r, val) {
    applyOp(r, (s) => { clockRef.current += 1; return opSet(kind, s, r, val, clockRef.current); }, `set "${val}"`);
  }

  function sync() {
    const merged = mergeCRDT(kind, A, B);
    setA(merged);
    setB(merged);
    setNaivePreview(null);
    pushLog({ kind: 'ok', msg: `SYNC A↔B via merge: ${MERGE_DESCR[kind]}` });
  }

  function showNaive() {
    const naive = naiveMerge(kind, A, B, lastWriter.current);
    const proper = mergeCRDT(kind, A, B);
    setNaivePreview({ naive, proper, writer: lastWriter.current });
    pushLog({ kind: 'err', msg: `Naive last-writer-wins merge would discard the other replica's work.` });
  }

  function togglePartition() {
    setPartitioned((p) => {
      const next = !p;
      pushLog({ kind: next ? 'err' : 'ok', msg: next ? 'Partition raised between A and B. Ops are now local-only.' : 'Partition healed. (Press Sync to converge.)' });
      return next;
    });
  }

  function reset() {
    setA(emptyState(kind));
    setB(emptyState(kind));
    setNaivePreview(null);
    setLog([]);
    clockRef.current = 0;
    tagRef.current = 0;
    pushLog({ kind: 'info', msg: 'Replicas reset.' });
  }

  const converged = useMemo(() => {
    return displayValue(kind, A) === displayValue(kind, B);
  }, [kind, A, B]);

  const isCounter = kind === 'gcounter' || kind === 'pncounter';
  const isSet = kind === 'gset' || kind === 'orset';
  const isLww = kind === 'lww';

  const subStyle = { fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.3rem' };

  function ReplicaPanel({ id, state, item, setItem, lwwVal, setLwwVal }) {
    let sub = null;
    if (kind === 'gcounter') sub = `vector: A=${state.A}, B=${state.B}`;
    else if (kind === 'pncounter') sub = `P: A=${state.P.A}, B=${state.P.B} | N: A=${state.N.A}, B=${state.N.B}`;
    else if (kind === 'orset') sub = `adds=${state.adds.length}, removes=${state.removes.length}`;
    else if (kind === 'lww' && state.by) sub = `last write by ${state.by} @ ts=${state.ts}`;
    return (
      <div style={{
        flex: '1 1 260px', minWidth: 240,
        border: '2px solid var(--ink)', borderRadius: 'var(--radius)',
        background: 'var(--paper)', padding: '0.75rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.05em' }}>Replica {id}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
            {partitioned ? 'isolated' : 'live-sync'}
          </div>
        </div>
        <motion.div
          key={displayValue(kind, state)}
          initial={{ scale: 0.96, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.18 }}
          style={{
            background: 'var(--paper-deep)', border: '1.5px solid var(--ink)', borderRadius: 6,
            padding: '0.5rem 0.7rem', fontFamily: 'var(--font-mono)', fontSize: '0.95rem',
            minHeight: '2.2rem', wordBreak: 'break-word',
          }}
        >
          {displayValue(kind, state)}
        </motion.div>
        {sub && <div style={subStyle}>{sub}</div>}

        <div className="controls" style={{ marginTop: '0.6rem', flexWrap: 'wrap' }}>
          {isCounter && (
            <>
              <button className="btn btn-accent" onClick={() => inc(id)}>+1</button>
              {kind === 'pncounter' && <button className="btn" onClick={() => dec(id)}>−1</button>}
            </>
          )}
          {isSet && (
            <>
              <select className="field" value={item} onChange={(e) => setItem(e.target.value)}>
                {ITEM_POOL.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button className="btn btn-accent" onClick={() => add(id, item)}>Add</button>
              {kind === 'orset' && (
                <button className="btn" onClick={() => remove(id, item)}>Remove</button>
              )}
            </>
          )}
          {isLww && (
            <>
              <input
                className="field"
                style={{ width: '8rem' }}
                value={lwwVal}
                onChange={(e) => setLwwVal(e.target.value)}
                placeholder="value"
              />
              <button className="btn btn-accent" onClick={() => setLww(id, lwwVal)}>Set</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const meta = CRDTS[kind];

  return (
    <div className="widget">
      <div className="widget-title">CRDTs — concurrent writes that just merge</div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <div className="pill-group">
          {CRDT_LIST.map((k) => (
            <span key={k}>
              <input type="radio" id={`crdt-${k}`} name="crdt" checked={kind === k} onChange={() => pickKind(k)} />
              <label htmlFor={`crdt-${k}`}>{CRDTS[k].name}</label>
            </span>
          ))}
        </div>
      </div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <button
          className={`btn ${partitioned ? 'btn-accent' : ''}`}
          onClick={togglePartition}
          style={partitioned ? {} : { borderColor: 'var(--accent)', color: 'var(--accent)' }}
        >
          {partitioned ? 'Heal partition' : 'Partition A | B'}
        </button>
        <button className="btn btn-accent" onClick={sync} disabled={converged && !naivePreview}>
          Sync (merge A↔B)
        </button>
        <button className="btn" onClick={showNaive} disabled={converged}>
          See naive merge
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          {converged ? 'converged' : 'diverged'}
        </span>
      </div>

      <div className="widget-stage" style={{ minHeight: 220, padding: '0.8rem' }}>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'stretch', position: 'relative' }}>
          <ReplicaPanel id="A" state={A} item={itemA} setItem={setItemA} lwwVal={lwwA} setLwwVal={setLwwA} />

          {/* link / partition gutter */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minWidth: 70, position: 'relative',
          }}>
            <svg width="70" height="80" viewBox="0 0 70 80">
              <AnimatePresence mode="wait">
                {partitioned ? (
                  <motion.g key="cut"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <line x1="0" y1="40" x2="25" y2="40" stroke="var(--accent)" strokeWidth="3" strokeDasharray="4 3" />
                    <line x1="45" y1="40" x2="70" y2="40" stroke="var(--accent)" strokeWidth="3" strokeDasharray="4 3" />
                    <line x1="28" y1="20" x2="42" y2="60" stroke="var(--accent)" strokeWidth="3" />
                    <line x1="42" y1="20" x2="28" y2="60" stroke="var(--accent)" strokeWidth="3" />
                  </motion.g>
                ) : (
                  <motion.g key="link"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <line x1="0" y1="40" x2="70" y2="40" stroke="var(--ink)" strokeWidth="3" />
                    <circle cx="35" cy="40" r="6" fill={converged ? '#2a8a3e' : 'var(--accent)'} stroke="var(--ink)" strokeWidth="2" />
                  </motion.g>
                )}
              </AnimatePresence>
            </svg>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)', textAlign: 'center' }}>
              {partitioned ? 'PARTITION' : 'link'}
            </div>
          </div>

          <ReplicaPanel id="B" state={B} item={itemB} setItem={setItemB} lwwVal={lwwB} setLwwVal={setLwwB} />
        </div>

        {naivePreview && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: '0.8rem', border: '2px solid var(--accent)', borderRadius: 'var(--radius)',
              padding: '0.6rem 0.8rem', background: '#fff4f4',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
              Naive last-writer-wins (writer = {naivePreview.writer}):
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              would force both replicas to: <strong>{displayValue(kind, naivePreview.naive)}</strong>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              proper CRDT merge gives: <strong>{displayValue(kind, naivePreview.proper)}</strong>
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '0.3rem' }}>
              Notice what the naive merge silently throws away — that's the bug CRDTs avoid by construction.
            </div>
          </motion.div>
        )}
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">A value</div>
          <div className="value" style={{ fontSize: '1rem' }}>{displayValue(kind, A)}</div>
        </div>
        <div className="metric">
          <div className="label">B value</div>
          <div className="value" style={{ fontSize: '1rem' }}>{displayValue(kind, B)}</div>
        </div>
        <div className={`metric ${converged ? '' : 'accent'}`}>
          <div className="label">status</div>
          <div className="value" style={{ fontSize: '1rem' }}>{converged ? 'converged' : 'divergent'}</div>
        </div>
        <div className="metric">
          <div className="label">link</div>
          <div className="value" style={{ fontSize: '1rem' }}>{partitioned ? 'cut' : 'open'}</div>
        </div>
      </div>

      <div className="callout">
        <strong>{meta.name}.</strong> {meta.blurb}
        <div style={{ marginTop: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
          {meta.guarantee}
        </div>
        <div style={{ marginTop: '0.2rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
          Seen in: {meta.usedIn}
        </div>
      </div>

      <div className="log" aria-label="event log">
        {log.length === 0 && (
          <div className="entry" style={{ color: 'var(--ink-faint)' }}>
            <span className="t">--:--:--</span>Pick a CRDT, raise the partition, do ops on each side, then Sync.
          </div>
        )}
        {log.map((e, i) => (
          <div key={i} className={`entry ${e.kind}`}>
            <span className="t">{e.ts}</span>{e.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
