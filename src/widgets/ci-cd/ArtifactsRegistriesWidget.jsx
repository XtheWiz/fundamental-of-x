import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Artifact lifecycle: build → tag → push → pull → run.
// Teaching point: `latest` is a moving pointer; the sha-prefixed tag IS the
// artifact. Pin specs to the digest and the same bits roll through dev/staging/prod.
// Retention keeps the registry from growing forever (untagged builds GC'd).

const NAMESPACES = ['dev', 'staging', 'prod'];

function makeArtifact(commit, counter) {
  const sha = `sha256:${commit}${String(counter).padStart(3, '0')}f7e9a1`;
  return {
    id: `${commit}-${counter}`,
    name: 'app',
    commit,
    sha,
    sizeMb: 40 + Math.floor((counter * 7) % 30),
    builtAt: Date.now() + counter,
  };
}

const NS_TINT = { dev: 'var(--accent-soft)', staging: '#fff2cc', prod: '#d9ead3' };

export default function ArtifactsRegistriesWidget() {
  // Synthetic SHA suffix counter so distinct builds get distinct digests.
  const [buildCounter, setBuildCounter] = useState(0);
  // shape: { ...artifact, tags: { dev: Set<string>, staging: Set, prod: Set } }
  const [artifacts, setArtifacts] = useState([]);
  // Per-namespace deploy spec: which tag this env's deploy will pull.
  const [deploySpec, setDeploySpec] = useState({
    dev:     { tag: 'latest', strategy: 'mutable' },
    staging: { tag: 'latest', strategy: 'mutable' },
    prod:    { tag: 'latest', strategy: 'mutable' },
  });
  const [liveDigest, setLiveDigest] = useState({ dev: null, staging: null, prod: null });
  const [strategy, setStrategy] = useState('mutable'); // 'mutable' | 'immutable'
  const [retention, setRetention] = useState(3);

  const [log, setLog] = useState([]);
  function logEvent(kind, msg) {
    setLog((l) => [{ kind, msg, t: new Date().toLocaleTimeString() }, ...l].slice(0, 8));
  }

  // ---- Build ---------------------------------------------------------
  function build(commit) {
    const next = buildCounter + 1;
    const art = makeArtifact(commit, next);
    setBuildCounter(next);
    setArtifacts((prev) => {
      // Move `latest` in dev: clear it from any existing artifact, add to new one.
      const cleared = prev.map((a) => {
        const newDev = new Set(a.tags.dev);
        newDev.delete('latest');
        return { ...a, tags: { ...a.tags, dev: newDev } };
      });
      const fresh = {
        ...art,
        tags: {
          dev: new Set(['latest', `sha-${commit}`]),
          staging: new Set(),
          prod: new Set(),
        },
      };
      return gc([...cleared, fresh], retention);
    });
    logEvent('ok', `built ${commit} → ${art.sha.slice(0, 14)}… retagged dev/latest`);
  }

  // GC: keep all tagged artifacts, plus the most recent `keepN` untagged ones.
  function gc(list, keepN) {
    const tagged = list.filter((a) =>
      a.tags.dev.size + a.tags.staging.size + a.tags.prod.size > 0,
    );
    const untagged = list
      .filter((a) => a.tags.dev.size + a.tags.staging.size + a.tags.prod.size === 0)
      .sort((a, b) => b.builtAt - a.builtAt)
      .slice(0, keepN);
    return [...tagged, ...untagged];
  }

  function changeRetention(n) {
    setRetention(n);
    setArtifacts((prev) => gc(prev, n));
  }

  // Resolve a deploy spec to a concrete artifact in this namespace.
  function resolve(ns, spec) {
    return artifacts.find((a) => a.tags[ns].has(spec.tag));
  }

  // Deploy `dev`: with `mutable`, follow latest. With `immutable`, freeze the
  // spec to whatever sha currently owns dev/latest at deploy time.
  function deployDev() {
    let spec;
    if (strategy === 'mutable') {
      spec = { tag: 'latest', strategy: 'mutable' };
    } else {
      const cur = artifacts.find((a) => a.tags.dev.has('latest'));
      if (!cur) { logEvent('err', 'nothing tagged latest yet — build first'); return; }
      spec = { tag: `sha-${cur.commit}`, strategy: 'immutable' };
    }
    setDeploySpec((d) => ({ ...d, dev: spec }));
    const resolved = resolve('dev', spec);
    if (!resolved) { logEvent('err', `dev: no artifact matches ${spec.tag}`); return; }
    setLiveDigest((ld) => ({ ...ld, dev: resolved.sha }));
    logEvent('info', `dev pulled ${spec.tag} → ${resolved.sha.slice(0, 14)}…`);
  }

  // Promote dev→staging→prod: always copy the exact sha. That's the point.
  function promote(fromNs, toNs) {
    const src = artifacts.find((a) => a.tags[fromNs].has('latest'))
            ?? artifacts.find((a) => a.tags[fromNs].size > 0);
    if (!src) { logEvent('err', `nothing in ${fromNs} to promote`); return; }
    setArtifacts((prev) => prev.map((a) => {
      if (a.id === src.id) {
        const next = new Set(a.tags[toNs]);
        next.add('latest'); next.add(`sha-${a.commit}`);
        return { ...a, tags: { ...a.tags, [toNs]: next } };
      }
      // Clear `latest` in `toNs` from the previous owner.
      if (a.tags[toNs].has('latest')) {
        const cleared = new Set(a.tags[toNs]); cleared.delete('latest');
        return { ...a, tags: { ...a.tags, [toNs]: cleared } };
      }
      return a;
    }));
    setLiveDigest((ld) => ({ ...ld, [toNs]: src.sha }));
    setDeploySpec((d) => ({
      ...d,
      [toNs]: strategy === 'immutable'
        ? { tag: `sha-${src.commit}`, strategy: 'immutable' }
        : { tag: 'latest', strategy: 'mutable' },
    }));
    logEvent('ok', `promoted ${fromNs}→${toNs}: ${src.sha.slice(0, 14)}…`);
  }

  // ---- Metrics -------------------------------------------------------
  const metrics = useMemo(() => {
    const total = artifacts.length;
    const storage = artifacts.reduce((s, a) => s + a.sizeMb, 0);
    const digests = NAMESPACES.map((n) => liveDigest[n]).filter(Boolean);
    const unique = new Set(digests);
    const drift = digests.length > 0 && unique.size > 1;
    return { total, storage, drift, deployedCount: digests.length };
  }, [artifacts, liveDigest]);

  function reset() {
    setArtifacts([]); setBuildCounter(0); setLog([]);
    setLiveDigest({ dev: null, staging: null, prod: null });
    setDeploySpec({
      dev:     { tag: 'latest', strategy: 'mutable' },
      staging: { tag: 'latest', strategy: 'mutable' },
      prod:    { tag: 'latest', strategy: 'mutable' },
    });
  }

  // Sort newest-first for display.
  const sortedArtifacts = [...artifacts].sort((a, b) => b.builtAt - a.builtAt);

  return (
    <div className="widget">
      <div className="widget-title">Registry — tags, digests &amp; the promotion lane</div>
      <div className="widget-hint">
        Build, tag, deploy, promote. Watch how a mutable <code>latest</code> can
        silently change what runs, while a sha-pinned spec always lands the same bits.
      </div>

      {/* ---- BUILDS + STRATEGY ---- */}
      <div className="controls">
        <button className="btn btn-accent" onClick={() => build('A')}>Build commit A</button>
        <button className="btn btn-accent" onClick={() => build('B')}>Build commit B</button>
        <span style={{ marginLeft: '0.6rem', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
          tag strategy:
        </span>
        <div className="pill-group">
          <input id="strat-mut" type="radio" name="strat" checked={strategy === 'mutable'} onChange={() => setStrategy('mutable')} />
          <label htmlFor="strat-mut">mutable (latest)</label>
          <input id="strat-imm" type="radio" name="strat" checked={strategy === 'immutable'} onChange={() => setStrategy('immutable')} />
          <label htmlFor="strat-imm">immutable (sha)</label>
        </div>
        <button className="btn btn-ghost" onClick={reset} style={{ marginLeft: 'auto' }}>Reset</button>
      </div>

      {/* ---- METRICS ---- */}
      <div className="metrics">
        <div className="metric"><div className="label">artifacts</div><div className="value">{metrics.total}</div></div>
        <div className="metric"><div className="label">storage</div><div className="value">{metrics.storage} MB</div></div>
        <div className="metric"><div className="label">deployed</div><div className="value">{metrics.deployedCount}/3</div></div>
        <div className={`metric ${metrics.drift ? 'accent' : ''}`}>
          <div className="label">drift</div>
          <div className="value">{metrics.drift ? 'YES' : 'no'}</div>
        </div>
      </div>

      {/* ---- PROMOTION LANE ---- */}
      <div className="widget-stage" style={{ padding: '0.8rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
          {NAMESPACES.map((ns) => {
            const inNs = sortedArtifacts.filter((a) => a.tags[ns].size > 0);
            const live = liveDigest[ns];
            const spec = deploySpec[ns];
            return (
              <div key={ns} style={{
                border: '2px solid var(--ink)', borderRadius: 'var(--radius)',
                background: NS_TINT[ns], padding: '0.6rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <span className="badge" style={{ background: 'var(--paper)' }}>{ns}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                    spec: {spec.tag}
                  </span>
                </div>

                <div style={{ minHeight: 64 }}>
                  <AnimatePresence>
                    {inNs.length === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
                        (empty)
                      </motion.div>
                    )}
                    {inNs.slice(0, 2).map((a) => (
                      <motion.div key={a.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        style={{
                          background: 'var(--paper)', border: '1.5px solid var(--ink)',
                          borderRadius: 4, padding: '0.3rem 0.4rem', marginBottom: '0.3rem',
                          fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                        }}>
                        <div>
                          <strong>{a.name}</strong>:
                          {[...a.tags[ns]].map((t) => (
                            <span key={t} style={{
                              marginLeft: 4,
                              padding: '0 0.25em',
                              border: '1px solid var(--ink)',
                              background: t === 'latest' ? 'var(--accent-soft)' : 'var(--paper-deep)',
                              fontSize: '0.65rem',
                            }}>{t}</span>
                          ))}
                        </div>
                        <div style={{ color: 'var(--ink-faint)' }}>{a.sha.slice(0, 18)}…</div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div style={{ borderTop: '1.5px dashed var(--ink-faint)', paddingTop: '0.4rem', marginTop: '0.3rem' }}>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>live:</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', minHeight: 16 }}>
                    {live ? live.slice(0, 20) + '…' : <span style={{ color: 'var(--ink-faint)' }}>not deployed</span>}
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {ns === 'dev' && (
                    <button className="btn" style={{ fontSize: '0.8rem', padding: '0.25em 0.6em' }} onClick={deployDev}>
                      Deploy
                    </button>
                  )}
                  {ns === 'dev' && (
                    <button className="btn" style={{ fontSize: '0.8rem', padding: '0.25em 0.6em' }}
                      onClick={() => promote('dev', 'staging')}
                      disabled={!sortedArtifacts.some((a) => a.tags.dev.size > 0)}>
                      promote →
                    </button>
                  )}
                  {ns === 'staging' && (
                    <button className="btn" style={{ fontSize: '0.8rem', padding: '0.25em 0.6em' }}
                      onClick={() => promote('staging', 'prod')}
                      disabled={!sortedArtifacts.some((a) => a.tags.staging.size > 0)}>
                      promote →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- RETENTION ---- */}
      <div className="controls">
        <label htmlFor="retn">retention (untagged builds to keep in dev):</label>
        <input id="retn" type="range" min={0} max={6} value={retention}
          onChange={(e) => changeRetention(Number(e.target.value))} />
        <span style={{ fontFamily: 'var(--font-mono)', minWidth: '1.5em' }}>{retention}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginLeft: '0.5rem' }}>
          (older untagged → garbage-collected)
        </span>
      </div>

      {/* ---- FULL ARTIFACT LIST ---- */}
      <div className="widget-stage" style={{ padding: '0.6rem', minHeight: 80 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
          Registry contents ({sortedArtifacts.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          <AnimatePresence>
            {sortedArtifacts.map((a) => {
              const tagged = a.tags.dev.size + a.tags.staging.size + a.tags.prod.size > 0;
              return (
                <motion.div key={a.id} layout
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  style={{
                    border: '1.5px solid var(--ink)', borderRadius: 4,
                    background: tagged ? 'var(--paper)' : 'var(--paper-deep)',
                    padding: '0.3rem 0.5rem', fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem', minWidth: 180,
                  }}>
                  <div><strong>commit {a.commit}</strong> · {a.sizeMb} MB</div>
                  <div style={{ color: 'var(--ink-faint)' }}>{a.sha.slice(0, 22)}…</div>
                  <div style={{ marginTop: 2 }}>
                    {NAMESPACES.map((n) =>
                      a.tags[n].size > 0 && (
                        <span key={n} style={{
                          marginRight: 3, padding: '0 0.2em',
                          background: NS_TINT[n], border: '1px solid var(--ink)', fontSize: '0.65rem',
                        }}>
                          {n}:{[...a.tags[n]].join(',')}
                        </span>
                      ),
                    )}
                    {!tagged && <span style={{ color: 'var(--ink-faint)' }}>untagged · GC candidate</span>}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {sortedArtifacts.length === 0 && (
            <span style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              (registry empty — build something)
            </span>
          )}
        </div>
      </div>

      {/* ---- LOG ---- */}
      {log.length > 0 && (
        <div className="log">
          {log.map((e, i) => (
            <div key={i} className={`entry ${e.kind}`}>
              <span className="t">[{e.t}]</span>{e.msg}
            </div>
          ))}
        </div>
      )}

      {/* ---- TAKEAWAY ---- */}
      <div className="callout">
        {metrics.drift ? (
          <>
            <strong>Drift detected.</strong> dev / staging / prod are NOT running
            the same digest. With a mutable <code>latest</code> spec, redeploying
            any namespace would silently pick up whatever <code>latest</code> points
            at right now — not what was tested. Promote a sha-pinned tag instead.
          </>
        ) : (
          <>
            <strong>Why this matters.</strong> A tag like <code>latest</code> is a
            <em> pointer</em>; the sha-prefixed tag IS the artifact. Build twice,
            and <code>latest</code> jumps — but <code>sha-…</code> is forever. Pin
            your deploy spec to the digest and the same bits roll through dev,
            staging, prod.
          </>
        )}
      </div>
    </div>
  );
}
