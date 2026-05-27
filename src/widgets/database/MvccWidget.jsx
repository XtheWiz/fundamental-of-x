import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// MVCC made tangible. One row ("Alice.balance") lives as a stack of
// versions, each stamped with the transaction that wrote it (xmin) and,
// once superseded, the transaction that killed it (xmax). Three open
// transactions hold snapshots and act on the row independently.
//
// The point is to make four things visible at once:
//   1. Updates never overwrite — they append a new version row.
//   2. A reader sees the version visible at *its* snapshot, not "now".
//   3. An aborted version is left as dead tuple noise, not undone in place.
//   4. VACUUM only frees what no active snapshot can still see.

const TX_IDS = ['T100', 'T101', 'T102'];
const INITIAL_VALUE = 1000;
// xmin = 50 means "written by a committed transaction before any of ours";
// the row is visible to everyone from the start.
const INITIAL_VERSION = { id: 1, xmin: 50, xmax: null, value: INITIAL_VALUE, dead: false, xminCommitted: true };

// MVCC visibility rule (PostgreSQL-flavoured):
//   A version is visible to TX t iff
//     xmin is committed AND xmin < t.snapshot AND xmin not in t.activeAtStart
//     AND (xmax is null OR xmax aborted OR xmax >= t.snapshot
//          OR xmax in t.activeAtStart)
// In this widget the bootstrap version uses xmin=50 which is treated as
// "long-committed" so every TX sees it.
function isVisible(version, tx, txTable) {
  if (version.dead) return false;
  const xminTx = txTable[version.xmin];
  const xminCommitted = version.xminCommitted || (xminTx && xminTx.status === 'committed');
  if (!xminCommitted) {
    // Only the writer itself sees its own uncommitted version.
    if (version.xmin !== tx.id) return false;
  } else {
    // Committed by someone else — only visible if committed before our snapshot.
    if (version.xmin !== tx.id && tx.activeAtStart.includes(version.xmin)) return false;
    if (version.xmin !== tx.id && xminTx && xminTx.commitOrder >= tx.snapshot) return false;
  }
  if (version.xmax == null) return true;
  const xmaxTx = txTable[version.xmax];
  const xmaxCommitted = xmaxTx && xmaxTx.status === 'committed';
  const xmaxAborted = xmaxTx && xmaxTx.status === 'aborted';
  if (xmaxAborted) return true;
  if (!xmaxCommitted) {
    // Uncommitted delete by someone else — still visible to us.
    if (version.xmax !== tx.id) return true;
    return false; // we deleted it ourselves
  }
  // Committed deleter — only hides the version if it committed before our snapshot.
  if (tx.activeAtStart.includes(version.xmax)) return true;
  if (xmaxTx && xmaxTx.commitOrder >= tx.snapshot) return true;
  return false;
}

// "Long-running TX" age = current logical clock minus tx.start. Snapshot
// drift = max snapshot - min snapshot across active transactions.
function formatTx(tid) { return tid; }

const STATUS_COLOR = {
  active: 'var(--ink)',
  committed: '#2a8a3e',
  aborted: 'var(--accent)',
};

export default function MvccWidget() {
  // Logical clock. Bumped on every TX start and every commit/abort so we
  // can order events and compute snapshot drift.
  const [clock, setClock] = useState(100);
  const [versions, setVersions] = useState([INITIAL_VERSION]);
  const [nextVersionId, setNextVersionId] = useState(2);
  const [txs, setTxs] = useState(() => ({
    T100: { id: 'T100', status: 'active', start: 100, snapshot: 100, activeAtStart: [], commitOrder: null },
    T101: { id: 'T101', status: 'active', start: 101, snapshot: 101, activeAtStart: ['T100'], commitOrder: null },
    T102: { id: 'T102', status: 'active', start: 102, snapshot: 102, activeAtStart: ['T100', 'T101'], commitOrder: null },
  }));
  const [updateInputs, setUpdateInputs] = useState({ T100: '1100', T101: '900', T102: '1250' });
  const [log, setLog] = useState([
    { t: 'init', kind: 'info', msg: 'Initial row written by long-committed TX. xmin=50, value=1000.' },
  ]);

  function pushLog(kind, msg) {
    setLog((l) => [...l.slice(-40), { t: `t=${clock}`, kind, msg }]);
  }

  function visibleVersionFor(tx, versionList = versions, txTable = txs) {
    // Latest visible version wins (highest id among visible).
    const candidates = versionList.filter((v) => isVisible(v, tx, txTable));
    if (candidates.length === 0) return null;
    return candidates.reduce((best, v) => (v.id > best.id ? v : best), candidates[0]);
  }

  function read(tid) {
    const tx = txs[tid];
    if (tx.status !== 'active') {
      pushLog('err', `${tid} is ${tx.status} — read rejected.`);
      return;
    }
    const v = visibleVersionFor(tx);
    if (!v) {
      pushLog('info', `${tid} READ balance → (no visible version)`);
    } else {
      pushLog('ok', `${tid} READ balance → ${v.value}  (from version #${v.id}, xmin=${formatTx(v.xmin)})`);
    }
  }

  function update(tid) {
    const tx = txs[tid];
    if (tx.status !== 'active') {
      pushLog('err', `${tid} is ${tx.status} — update rejected.`);
      return;
    }
    const newVal = parseInt(updateInputs[tid], 10);
    if (!Number.isFinite(newVal)) {
      pushLog('err', `${tid} update aborted — "${updateInputs[tid]}" is not a number.`);
      return;
    }
    const target = visibleVersionFor(tx);
    if (!target) {
      pushLog('err', `${tid} update — nothing visible to update.`);
      return;
    }
    // Write-write conflict: someone else has already created a newer
    // committed version on top of what we can see. In real PG this would
    // raise a serialization failure under repeatable-read; here we just
    // log it and refuse.
    const conflict = versions.some(
      (v) => v.xmin !== tid && v.id > target.id && (txs[v.xmin]?.status === 'committed' || txs[v.xmin]?.status === 'active')
    );
    if (conflict) {
      pushLog('err', `${tid} write conflict — a newer version already exists above v#${target.id}.`);
      return;
    }
    const newClock = clock + 1;
    const newId = nextVersionId;
    setVersions((vs) =>
      vs.map((v) => (v.id === target.id ? { ...v, xmax: tid } : v)).concat({
        id: newId,
        xmin: tid,
        xmax: null,
        value: newVal,
        dead: false,
        xminCommitted: false,
      })
    );
    setNextVersionId((n) => n + 1);
    setClock(newClock);
    pushLog('ok', `${tid} UPDATE balance ${target.value} → ${newVal}. New v#${newId} (xmin=${tid}); v#${target.id} xmax=${tid}.`);
  }

  function commit(tid) {
    const tx = txs[tid];
    if (tx.status !== 'active') {
      pushLog('err', `${tid} already ${tx.status}.`);
      return;
    }
    const newClock = clock + 1;
    setTxs((t) => ({ ...t, [tid]: { ...t[tid], status: 'committed', commitOrder: newClock } }));
    setVersions((vs) => vs.map((v) => (v.xmin === tid ? { ...v, xminCommitted: true } : v)));
    setClock(newClock);
    pushLog('ok', `${tid} COMMIT. Versions written by ${tid} are now visible to any TX whose snapshot starts after t=${newClock}.`);
  }

  function abort(tid) {
    const tx = txs[tid];
    if (tx.status !== 'active') {
      pushLog('err', `${tid} already ${tx.status}.`);
      return;
    }
    const newClock = clock + 1;
    setTxs((t) => ({ ...t, [tid]: { ...t[tid], status: 'aborted', commitOrder: newClock } }));
    setVersions((vs) =>
      vs.map((v) => {
        if (v.xmin === tid) return { ...v, dead: true };
        if (v.xmax === tid) return { ...v, xmax: null }; // un-mark the kill
        return v;
      })
    );
    setClock(newClock);
    pushLog('err', `${tid} ABORT. Its versions are dead tuples; kills it issued are undone.`);
  }

  function restart(tid) {
    const newClock = clock + 1;
    const others = TX_IDS.filter((x) => x !== tid && txs[x].status === 'active');
    setTxs((t) => ({
      ...t,
      [tid]: { id: tid, status: 'active', start: newClock, snapshot: newClock, activeAtStart: others, commitOrder: null },
    }));
    setClock(newClock);
    pushLog('info', `${tid} restarted with fresh snapshot at t=${newClock}.`);
  }

  function vacuum() {
    const activeTxs = TX_IDS.map((id) => txs[id]).filter((t) => t.status === 'active');
    const before = versions.length;
    const survivors = versions.filter((v) => {
      // A version is reclaimable iff
      //   it is dead (aborted), OR
      //   its xmax is committed and no active TX can still see it.
      if (v.dead) return false;
      if (v.xmax == null) return true;
      const xmaxTx = txs[v.xmax];
      if (!xmaxTx || xmaxTx.status !== 'committed') return true; // killer not durable
      // Visible to any active TX? then keep.
      const stillNeeded = activeTxs.some((tx) => isVisible(v, tx, txs));
      return stillNeeded;
    });
    if (survivors.length === before) {
      pushLog('info', `VACUUM ran — nothing to reclaim. ${before} version(s) still needed.`);
      return;
    }
    setVersions(survivors);
    pushLog('ok', `VACUUM reclaimed ${before - survivors.length} version(s). ${survivors.length} remain.`);
  }

  // Derived bits ----------------------------------------------------------
  const metrics = useMemo(() => {
    const total = versions.length;
    const dead = versions.filter((v) => v.dead || (v.xmax && txs[v.xmax]?.status === 'committed')).length;
    const actives = TX_IDS.map((id) => txs[id]).filter((t) => t.status === 'active');
    const longest = actives.length
      ? actives.reduce((best, t) => (t.start < best.start ? t : best), actives[0])
      : null;
    const longestAge = longest ? clock - longest.start : 0;
    const snaps = actives.map((t) => t.snapshot);
    const drift = snaps.length >= 2 ? Math.max(...snaps) - Math.min(...snaps) : 0;
    return { total, dead, longest: longest ? `${longest.id} (${longestAge})` : '—', drift };
  }, [versions, txs, clock]);

  return (
    <div className="widget">
      <div className="widget-title">MVCC — versions, snapshots, and the vacuum</div>

      <div className="controls">
        <button className="btn btn-accent" onClick={vacuum}>VACUUM</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          logical clock t = {clock}
        </span>
      </div>

      <div className="metrics">
        <div className="metric accent">
          <div className="label">total versions</div>
          <div className="value">{metrics.total}</div>
        </div>
        <div className="metric">
          <div className="label">dead versions</div>
          <div className="value">{metrics.dead}</div>
        </div>
        <div className="metric">
          <div className="label">longest TX</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>{metrics.longest}</div>
        </div>
        <div className="metric">
          <div className="label">snapshot drift</div>
          <div className="value">{metrics.drift}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.9fr) minmax(280px, 1.3fr)', gap: '1rem', alignItems: 'start' }}>
        {/* LEFT: the row's version stack */}
        <div className="widget-stage" style={{ padding: '0.9rem 1rem', minHeight: 280 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
            row: users.alice.balance
          </div>
          <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '0.4rem' }}>
            <AnimatePresence initial={false}>
              {versions.map((v) => {
                const xminTx = txs[v.xmin];
                const xmaxTx = v.xmax ? txs[v.xmax] : null;
                const isAborted = v.dead;
                const isStale = !isAborted && xmaxTx && xmaxTx.status === 'committed';
                const isLive = !isAborted && !isStale;
                const bg = isAborted ? '#fde2e2' : isStale ? 'var(--paper-deep)' : '#e7f3e3';
                const border = isAborted ? 'var(--accent)' : isStale ? 'var(--ink-faint)' : '#2a8a3e';
                return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      border: `2px solid ${border}`,
                      background: bg,
                      borderRadius: 'var(--radius)',
                      padding: '0.5rem 0.7rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      textDecoration: isAborted ? 'line-through' : 'none',
                      color: isAborted ? 'var(--ink-soft)' : 'var(--ink)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem' }}>
                      <strong>v#{v.id}</strong>
                      <span style={{ color: isLive ? '#2a8a3e' : isAborted ? 'var(--accent)' : 'var(--ink-soft)', fontWeight: 600 }}>
                        {isAborted ? 'DEAD' : isStale ? 'stale' : 'LIVE'}
                      </span>
                    </div>
                    <div>
                      xmin = {formatTx(v.xmin)}
                      {xminTx && v.xmin !== 50 && !v.xminCommitted && xminTx.status === 'active' && <span style={{ color: 'var(--accent)' }}> (uncommitted)</span>}
                      {' · '}
                      xmax = {v.xmax ? formatTx(v.xmax) : '—'}
                      {xmaxTx && xmaxTx.status === 'active' && <span style={{ color: 'var(--accent)' }}> (uncommitted)</span>}
                    </div>
                    <div>value = <strong>{v.value}</strong></div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: transaction cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {TX_IDS.map((tid) => {
            const tx = txs[tid];
            const visible = visibleVersionFor(tx);
            const visibleSet = versions.filter((v) => isVisible(v, tx, txs)).map((v) => v.id);
            const dim = tx.status !== 'active';
            return (
              <div
                key={tid}
                style={{
                  border: '2px solid var(--ink)',
                  borderRadius: 'var(--radius)',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--paper)',
                  opacity: dim ? 0.65 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{tid}</strong>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: STATUS_COLOR[tx.status],
                    border: `1.5px solid ${STATUS_COLOR[tx.status]}`,
                    padding: '0 0.4em',
                    borderRadius: 3,
                  }}>{tx.status}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                    snapshot t={tx.snapshot}{tx.activeAtStart.length ? ` · ignoring ${tx.activeAtStart.join(',')}` : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
                  <button className="btn" disabled={dim} onClick={() => read(tid)}>Read</button>
                  <input
                    className="field"
                    style={{ width: 70, padding: '0.2em 0.4em', fontSize: '0.85rem' }}
                    value={updateInputs[tid]}
                    onChange={(e) => setUpdateInputs((s) => ({ ...s, [tid]: e.target.value }))}
                    disabled={dim}
                  />
                  <button className="btn" disabled={dim} onClick={() => update(tid)}>Update</button>
                  <button className="btn btn-accent" disabled={dim} onClick={() => commit(tid)}>Commit</button>
                  <button className="btn" disabled={dim} onClick={() => abort(tid)}>Abort</button>
                  {dim && (
                    <button className="btn" onClick={() => restart(tid)}>Restart</button>
                  )}
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                  sees: {visibleSet.length ? visibleSet.map((id) => `v#${id}`).join(', ') : '(none)'}
                  {visible && (
                    <> · balance = <strong style={{ color: 'var(--ink)' }}>{visible.value}</strong></>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="log">
        {log.map((e, i) => (
          <div key={i} className={`entry ${e.kind}`}><span className="t">{e.t}</span>{e.msg}</div>
        ))}
      </div>

      <div className="callout">
        <strong>Read the stack from the bottom up.</strong> Each UPDATE appends a new version and stamps the old one's
        <code> xmax </code>; the row itself is never overwritten in place. Each transaction sees only versions
        whose <code>xmin</code> committed before its snapshot and whose <code>xmax</code> hasn't — which is
        why readers never block writers and writers never block readers. VACUUM can only reclaim versions
        that no active snapshot still needs, so a long-running transaction holds dead tuples hostage and
        bloats the table.
      </div>
    </div>
  );
}
