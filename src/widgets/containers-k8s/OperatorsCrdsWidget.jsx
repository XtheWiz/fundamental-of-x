import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Operators & CRDs — the reconciliation loop.
//
// A CRD extends the Kubernetes API with a new resource kind. An Operator
// is a controller that watches those resources and continually drives the
// observed (actual) state toward the spec (desired) state:
//
//   for ev in watch(PostgresCluster):
//       desired = ev.spec
//       actual  = inspect_cluster(ev.name)
//       if desired != actual: apply(diff)
//       update_status(actual)
//
// Edit the CR, kill a pod, change replicas — the same loop converges.

const VERSIONS = ['15', '16', '17'];
const SIZES = ['10Gi', '50Gi', '100Gi', '500Gi'];

const PSEUDOCODE = `// the heart of every operator
async function reconcile(req) {
  const desired = await api.get(req.name)         // spec from the CR
  const actual  = await inspect(req.name)         // observed in cluster

  // managed sub-resources — create if missing
  if (!actual.service)     await create(Service(desired))
  if (!actual.configMap)   await create(ConfigMap(desired))
  if (!actual.statefulSet) await create(StatefulSet(desired))

  // scale to the requested replica count
  if (actual.replicas !== desired.replicas) {
    await scale(actual.statefulSet, desired.replicas)
  }

  // recreate any pod that has gone away (self-healing)
  for (const i of range(desired.replicas)) {
    if (!actual.pods[i]?.ready) await recreatePod(i)
  }

  await updateStatus({ phase: phaseFor(actual), ready: actual.ready })
  return { requeueAfter: '30s' }
}`;

const PHASE_COLOR = {
  Idle: 'var(--ink-faint)', Pending: '#c08a1c',
  Provisioning: '#1c6dd0', Ready: '#2a8a3e', Degraded: 'var(--accent)',
};

let podSeq = 0;
const newPod = (ordinal, healing = false) =>
  ({ id: `p${++podSeq}`, ordinal, ready: false, _healing: healing });

const phaseFor = (spec, pods) => {
  if (!spec) return 'Idle';
  const ready = pods.filter((p) => p.ready).length;
  if (ready === 0) return 'Pending';
  if (ready < spec.replicas) return 'Provisioning';
  return 'Ready';
};

// Pure reconcile pass. Returns the next (spec, pods, sub) plus diagnostics.
function reconcilePass(spec, pods, sub) {
  if (!spec) return { pods, sub, notes: [], recovered: 0, steady: true };
  const notes = [];
  let recovered = 0;
  let changed = false;
  let nextSub = { ...sub };
  let nextPods = pods.slice();

  if (!nextSub.service)     { nextSub.service = true;     notes.push('create Service/postgres'); changed = true; }
  if (!nextSub.configMap)   { nextSub.configMap = true;   notes.push('create ConfigMap/postgres-conf'); changed = true; }
  if (!nextSub.statefulSet) { nextSub.statefulSet = true; notes.push(`create StatefulSet/postgres (replicas=${spec.replicas})`); changed = true; }

  // add missing pods up to desired
  const present = new Set(nextPods.map((p) => p.ordinal));
  for (let i = 0; i < spec.replicas; i++) {
    if (!present.has(i)) { nextPods.push(newPod(i)); notes.push(`create pod postgres-${i}`); changed = true; }
  }
  // scale-down: drop pods beyond replicas
  const before = nextPods.length;
  nextPods = nextPods.filter((p) => p.ordinal < spec.replicas);
  if (nextPods.length < before) {
    notes.push(`delete ${before - nextPods.length} pod(s) (scale-down)`); changed = true;
  }
  // bring not-ready pods to ready on the next pass
  nextPods = nextPods.map((p) => {
    if (p.ready) return p;
    if (p._healing) recovered += 1;
    return { ...p, ready: true, _healing: false };
  });
  const steady = !changed && nextPods.every((p) => p.ready) && nextPods.length === spec.replicas;
  return { pods: nextPods, sub: nextSub, notes, recovered, steady };
}

export default function OperatorsCrdsWidget() {
  const [draft, setDraft] = useState({ replicas: 3, storage: '50Gi', version: '16' });
  const [spec, setSpec] = useState(null);
  const [pods, setPods] = useState([]);
  const [subRes, setSubRes] = useState({ service: false, configMap: false, statefulSet: false });
  const [phase, setPhase] = useState('Idle');
  const [cycles, setCycles] = useState(0);
  const [recoveries, setRecoveries] = useState(0);
  const [log, setLog] = useState([]);
  const [showCode, setShowCode] = useState(false);
  const reasonRef = useRef(null);

  const pushLog = (line) => setLog((l) => [{ t: Date.now() + Math.random(), line }, ...l].slice(0, 14));

  // Drive the loop until steady state, using the latest spec/pods/sub.
  function reconcileLoop(reason, baseSpec = spec, basePods = pods, baseSub = subRes) {
    if (!baseSpec) return;
    pushLog(`reconcile<${reason}>`);
    let p = basePods, sb = baseSub, bumps = 0, recov = 0;
    for (let i = 0; i < 4; i++) {
      const r = reconcilePass(baseSpec, p, sb);
      bumps += 1; recov += r.recovered;
      r.notes.forEach((n) => pushLog(`  · ${n}`));
      p = r.pods; sb = r.sub;
      if (r.steady) break;
    }
    setPods(p); setSubRes(sb); setPhase(phaseFor(baseSpec, p));
    setCycles((c) => c + bumps);
    if (recov > 0) setRecoveries((rv) => rv + recov);
  }

  // Whenever spec changes, trigger the reconcile loop on the next tick so React commits first.
  useEffect(() => {
    if (!spec) return;
    const reason = reasonRef.current || 'periodic';
    reasonRef.current = null;
    const id = setTimeout(() => reconcileLoop(reason, spec), 60);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]);

  function applyCR() {
    const isNew = !spec;
    pushLog(`kubectl apply -f postgrescluster.yaml`);
    pushLog(`watch event: ${isNew ? 'ADDED' : 'MODIFIED'} PostgresCluster/postgres${isNew ? '' : ` (replicas ${spec.replicas} -> ${draft.replicas})`}`);
    reasonRef.current = isNew ? 'ADDED' : 'MODIFIED';
    setSpec({ ...draft });
  }

  function killPod() {
    if (!spec || pods.length === 0) return;
    const victim = pods[Math.floor(Math.random() * pods.length)];
    pushLog(`pod postgres-${victim.ordinal} CRASHED (user injected)`);
    pushLog(`watch event: DELETED Pod/postgres-${victim.ordinal}`);
    // remove victim + insert a healing replacement, then reconcile
    const survivors = pods.filter((p) => p.id !== victim.id);
    const healed = [...survivors, newPod(victim.ordinal, true)];
    setPods(healed);
    setTimeout(() => reconcileLoop('pod-deleted', spec, healed, subRes), 80);
  }

  function deleteCR() {
    if (!spec) return;
    pushLog(`kubectl delete postgrescluster postgres`);
    pushLog(`watch event: DELETED PostgresCluster/postgres`);
    setSpec(null); setPods([]); setPhase('Idle');
    setSubRes({ service: false, configMap: false, statefulSet: false });
  }

  const desired = spec ? spec.replicas : 0;
  const actual = pods.filter((p) => p.ready).length;
  const drift = desired - actual;

  return (
    <div className="widget">
      <div className="widget-title">Operators & CRDs — the reconciliation loop</div>
      <div className="widget-hint">
        A <strong>CRD</strong> teaches the API server a new resource kind. An <strong>operator</strong> watches
        those resources and reconciles the observed cluster toward the spec — forever. Apply the CR, change replicas,
        kill a pod: the loop always converges on what you asked for.
      </div>

      <div className="metrics">
        <div className="metric"><div className="label">Desired</div><div className="value">{desired}</div></div>
        <div className={`metric ${drift !== 0 ? 'accent' : ''}`}>
          <div className="label">Actual</div><div className="value">{actual}</div>
        </div>
        <div className="metric"><div className="label">Reconcile cycles</div><div className="value">{cycles}</div></div>
        <div className="metric"><div className="label">Recovery events</div><div className="value">{recoveries}</div></div>
        <div className="metric">
          <div className="label">Phase</div>
          <div className="value" style={{ color: PHASE_COLOR[phase] }}>{phase}</div>
        </div>
      </div>

      <div className="widget-stage" style={{ minHeight: 300, padding: '0.6rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(280px, 1.4fr)', gap: 14 }}>

          {/* ---- CR editor ---- */}
          <div style={{
            padding: '0.7rem 0.8rem', background: 'var(--paper)', border: '2px solid var(--ink)',
            borderRadius: 6, boxShadow: '3px 3px 0 var(--ink)',
          }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>
              PostgresCluster (custom resource)
            </strong>
            <pre style={{
              margin: '0.4rem 0 0.6rem 0', padding: '0.5rem 0.6rem',
              background: 'var(--paper-deep)', border: '1.5px solid var(--ink-faint)', borderRadius: 4,
              fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.45, whiteSpace: 'pre-wrap',
            }}>
{`apiVersion: db.example.com/v1
kind: PostgresCluster
metadata:
  name: postgres
spec:
  replicas: ${draft.replicas}
  storage:  ${draft.storage}
  version:  "${draft.version}"`}
            </pre>

            <div className="field">
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>replicas</label>
              <input type="range" min={1} max={7} value={draft.replicas}
                onChange={(e) => setDraft({ ...draft, replicas: parseInt(e.target.value, 10) })}
                style={{ width: '100%' }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                {draft.replicas} {draft.replicas === 1 ? 'replica' : 'replicas'}
              </div>
            </div>

            <div className="field" style={{ marginTop: 8 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>storage</label>
              <div className="pill-group">
                {SIZES.map((s) => (
                  <button key={s}
                    className={`btn ${draft.storage === s ? 'btn-accent' : ''}`}
                    style={{ fontSize: 11, padding: '0.18em 0.55em' }}
                    onClick={() => setDraft({ ...draft, storage: s })}>{s}</button>
                ))}
              </div>
            </div>

            <div className="field" style={{ marginTop: 8 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>version</label>
              <div className="pill-group">
                {VERSIONS.map((v) => (
                  <button key={v}
                    className={`btn ${draft.version === v ? 'btn-accent' : ''}`}
                    style={{ fontSize: 11, padding: '0.18em 0.55em' }}
                    onClick={() => setDraft({ ...draft, version: v })}>pg {v}</button>
                ))}
              </div>
            </div>

            <div className="controls" style={{ marginTop: 10 }}>
              <button className="btn btn-accent" onClick={applyCR}>{spec ? 'Edit CR' : 'Apply CR'}</button>
              <button className="btn" onClick={killPod} disabled={!spec || pods.length === 0}>Simulate failure</button>
              <button className="btn btn-ghost" onClick={deleteCR} disabled={!spec}>Delete</button>
            </div>
          </div>

          {/* ---- Cluster state ---- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              padding: '0.45rem 0.7rem', background: '#fff7e1', border: '2px solid var(--ink)',
              borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <strong style={{ fontFamily: 'var(--font-display)' }}>postgres-operator</strong>
              <span style={{ color: 'var(--ink-soft)' }}>watch:</span>
              <span>PostgresCluster.*</span>
              <span style={{ marginLeft: 'auto', color: PHASE_COLOR[phase], fontWeight: 600 }}>
                {spec ? `desired ${desired}  /  actual ${actual}` : 'no CR yet'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { k: 'service', label: 'Service/postgres' },
                { k: 'configMap', label: 'ConfigMap/postgres-conf' },
                { k: 'statefulSet', label: `StatefulSet/postgres${spec ? ` (×${spec.replicas})` : ''}` },
              ].map((r) => (
                <motion.div key={r.k} initial={false}
                  animate={{ opacity: subRes[r.k] ? 1 : 0.35, scale: subRes[r.k] ? 1 : 0.96 }}
                  style={{
                    padding: '0.3rem 0.55rem', borderRadius: 4,
                    border: `1.5px solid ${subRes[r.k] ? 'var(--ink)' : 'var(--ink-faint)'}`,
                    background: subRes[r.k] ? 'var(--paper)' : 'var(--paper-deep)',
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                  }}>
                  {subRes[r.k] ? '✓ ' : '· '}{r.label}
                </motion.div>
              ))}
            </div>

            <div style={{
              padding: '0.55rem 0.6rem', background: 'var(--paper)',
              border: '2px solid var(--ink)', borderRadius: 6, minHeight: 92,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, marginBottom: 6 }}>
                Pods (managed by StatefulSet)
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <AnimatePresence>
                  {pods.length === 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                      (none — apply a CR to materialise the cluster)
                    </span>
                  )}
                  {pods.slice().sort((a, b) => a.ordinal - b.ordinal).map((p) => (
                    <motion.div key={p.id} layout
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.25 }}
                      title={p.ready ? 'Running' : 'ContainerCreating'}
                      style={{
                        width: 76, padding: '4px 6px', borderRadius: 4,
                        border: '1.5px solid var(--ink)',
                        background: p.ready ? '#d9ead3' : '#fff2c2',
                        fontFamily: 'var(--font-mono)', fontSize: 10, lineHeight: 1.3,
                      }}>
                      <div style={{ fontWeight: 600 }}>postgres-{p.ordinal}</div>
                      <div style={{ color: 'var(--ink-soft)' }}>{p.ready ? 'Running' : 'Starting'}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {drift !== 0 && spec && (
                <div style={{
                  marginTop: 8, padding: '0.3rem 0.5rem', background: '#fde2e2',
                  border: '1.5px dashed var(--accent)', borderRadius: 4,
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                }}>
                  drift: desired={desired}, actual={actual} &mdash; next reconcile will {drift > 0 ? 'create' : 'delete'} {Math.abs(drift)} pod(s)
                </div>
              )}
            </div>

            <div className="log" style={{
              maxHeight: 130, overflowY: 'auto',
              padding: '0.4rem 0.55rem', background: 'var(--paper-deep)',
              border: '1.5px solid var(--ink-faint)', borderRadius: 4,
              fontFamily: 'var(--font-mono)', fontSize: 10.5, lineHeight: 1.45,
            }}>
              {log.length === 0 && (
                <div style={{ color: 'var(--ink-soft)' }}>// operator log — apply a CR to see events</div>
              )}
              {log.map((e, i) => (
                <div key={`${e.t}-${i}`} style={{ color: e.line.startsWith('  ') ? 'var(--ink-soft)' : 'var(--ink)' }}>
                  {e.line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="controls" style={{ marginTop: 8 }}>
        <button className="btn" onClick={() => setShowCode((v) => !v)}>
          {showCode ? 'Hide' : 'Show'} controller code
        </button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
          desired - actual = {drift}
        </span>
      </div>
      {showCode && (
        <pre className="code-block" style={{
          margin: '0.4rem 0 0 0', padding: '0.7rem 0.9rem',
          background: 'var(--paper-deep)', border: '1.5px solid var(--ink)', borderRadius: 4,
          fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.5,
          whiteSpace: 'pre-wrap', overflowX: 'auto',
        }}>
          {PSEUDOCODE}
        </pre>
      )}

      <div className="callout">
        <strong>Try it:</strong> apply the CR (3 replicas) and watch the operator create a Service, ConfigMap, and
        StatefulSet, then bring pods to Ready. Bump replicas to 5 and re-apply — only the diff (2 new pods) runs.
        Hit <em>Simulate failure</em>: the reconciler notices the missing pod and recreates it. That single loop
        &mdash; desired vs actual, apply the diff &mdash; is every operator you will ever read.
      </div>
    </div>
  );
}
