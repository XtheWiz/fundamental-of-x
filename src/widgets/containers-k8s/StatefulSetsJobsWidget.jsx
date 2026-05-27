import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Three workload controllers, same cluster, same slider:
// Deployment = interchangeable pods, random names, no identity, no storage.
// StatefulSet = ordered pod-0, pod-1, ... each with its own PVC; identity and
// PVC outlive the pod. Scale-down terminates the highest ordinal first.
// CronJob = schedule fires a Job, which runs one short-lived pod, with history.

const STORAGE_CLASSES = ['standard', 'fast-ssd', 'gp3'];
const SCHEDULES = [
  { id: '1m', label: 'every 1 min', ms: 60000 },
  { id: '5m', label: 'every 5 min', ms: 300000 },
  { id: 'demand', label: 'on-demand', ms: 0 },
];
const CONCURRENCY = ['Allow', 'Forbid', 'Replace'];
const SPAWN_MS = 600;
const JOB_RUN_MS = 1800;

let podSeq = 0, jobSeq = 0;
const rs = () => Math.random().toString(36).slice(2, 7);
const ts = () => new Date().toLocaleTimeString();

const mkDeployPod = () => ({ id: `dp-${++podSeq}`, name: `web-${rs()}`, status: 'creating', bornAt: Date.now() });
const mkStatefulPod = (ordinal, sc, pvc) => ({
  id: `sp-${++podSeq}`, ordinal, name: `web-${ordinal}`, status: 'creating',
  pvc: pvc || { name: `data-web-${ordinal}`, storageClass: sc, sizeGi: 1 },
});
const mkJobRun = (command) => ({
  id: `job-${++jobSeq}`, name: `web-${jobSeq.toString().padStart(5, '0')}`,
  command, startedAt: Date.now(), finishedAt: null, status: 'running',
  willSucceed: Math.random() > 0.18, // small flake rate so FAIL badge isn't theoretical
});

export default function StatefulSetsJobsWidget() {
  const [controller, setController] = useState('deployment');
  const [replicas, setReplicas] = useState(3);
  const [storageClass, setStorageClass] = useState('fast-ssd');
  const [schedule, setSchedule] = useState('demand');
  const [command, setCommand] = useState('backup.sh --full');
  const [concurrency, setConcurrency] = useState('Allow');

  const orphanPvcs = useRef({}); // ordinal -> PVC; survives pod deletion
  const [deployPods, setDeployPods] = useState(() => Array.from({ length: 3 }, () => ({ ...mkDeployPod(), status: 'ready' })));
  const [statefulPods, setStatefulPods] = useState([]);
  const [jobRuns, setJobRuns] = useState([]);
  const [log, setLog] = useState([]);
  const timers = useRef(new Set());
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => { const t = setTimeout(() => { timers.current.delete(t); fn(); }, ms); timers.current.add(t); };
  const say = (s) => setLog((l) => [`${ts()}  ${s}`, ...l].slice(0, 40));

  // Deployment: interchangeable replicas. Scale-down terminates youngest first.
  function reconcileDeployment(target) {
    setDeployPods((curr) => {
      const alive = curr.filter((p) => p.status !== 'terminating');
      if (alive.length === target) return curr;
      if (alive.length < target) {
        const add = Array.from({ length: target - alive.length }, () => mkDeployPod());
        add.forEach((p) => later(() => setDeployPods((cs) => cs.map((x) => x.id === p.id ? { ...x, status: 'ready' } : x)), SPAWN_MS));
        say(`Deployment: creating ${add.map((p) => p.name).join(', ')}`);
        return [...curr, ...add];
      }
      const drop = new Set([...alive].sort((a, b) => b.bornAt - a.bornAt).slice(0, alive.length - target).map((p) => p.id));
      say(`Deployment: terminating ${drop.size} pod(s) (no order)`);
      later(() => setDeployPods((cs) => cs.filter((p) => !drop.has(p.id))), SPAWN_MS);
      return curr.map((p) => (drop.has(p.id) ? { ...p, status: 'terminating' } : p));
    });
  }
  // ---------- handlers ----------
  function pickController(k) { setController(k); if (k === 'statefulset' && statefulPods.length === 0) reconcileStatefulSet(replicas, storageClass); }
  function onReplicas(n) { setReplicas(n); if (controller === 'deployment') reconcileDeployment(n); else if (controller === 'statefulset') reconcileStatefulSet(n); }

  // StatefulSet: ordered creation; scale-down terminates highest ordinal first; PVCs outlive pods.
  function reconcileStatefulSet(target, sc = storageClass) {
    setStatefulPods((curr) => {
      const alive = curr.filter((p) => p.status !== 'terminating');
      if (alive.length === target) return curr;
      if (alive.length < target) {
        let next = curr;
        for (let i = alive.length; i < target; i++) {
          const orphan = orphanPvcs.current[i];
          if (orphan) { delete orphanPvcs.current[i]; say(`StatefulSet: reattaching PVC ${orphan.name} to web-${i}`); }
          else say(`StatefulSet: creating web-${i} + PVC data-web-${i} (${sc})`);
          const p = mkStatefulPod(i, sc, orphan);
          next = [...next, p];
          later(() => setStatefulPods((cs) => cs.map((x) => x.id === p.id ? { ...x, status: 'ready' } : x)), SPAWN_MS * (i - alive.length + 1));
        }
        return next;
      }
      const remove = [...alive].sort((a, b) => b.ordinal - a.ordinal).slice(0, alive.length - target);
      const dropIds = new Set(remove.map((p) => p.id));
      remove.forEach((p) => { orphanPvcs.current[p.ordinal] = p.pvc; say(`StatefulSet: terminating web-${p.ordinal} (PVC ${p.pvc.name} retained)`); });
      later(() => setStatefulPods((cs) => cs.filter((p) => !dropIds.has(p.id))), SPAWN_MS);
      return curr.map((p) => dropIds.has(p.id) ? { ...p, status: 'terminating' } : p);
    });
  }

  function triggerCronJob() {
    setJobRuns((curr) => {
      const running = curr.find((j) => j.status === 'running');
      if (running && concurrency === 'Forbid') { say(`CronJob: Forbid — skipped (prior run still in flight)`); return curr; }
      if (running && concurrency === 'Replace') {
        say(`CronJob: Replace — killing prior run ${running.name}`);
        curr = curr.map((j) => j.id === running.id ? { ...j, status: 'failed', finishedAt: Date.now(), reason: 'replaced' } : j);
      }
      const r = mkJobRun(command);
      say(`CronJob: starting ${r.name} (${command})`);
      later(() => setJobRuns((cs) => cs.map((j) => j.id === r.id
        ? { ...j, status: j.status === 'failed' ? 'failed' : (j.willSucceed ? 'succeeded' : 'failed'), finishedAt: Date.now() } : j)), JOB_RUN_MS);
      return [r, ...curr].slice(0, 12);
    });
  }

  // Auto-fire on schedule (sped up so the demo is watchable).
  useEffect(() => {
    if (controller !== 'cronjob') return;
    const s = SCHEDULES.find((x) => x.id === schedule);
    if (!s || s.ms === 0) return;
    const id = setInterval(triggerCronJob, Math.min(3500, Math.max(1500, s.ms / 12)));
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [controller, schedule, concurrency, command]);

  function killPodZero() {
    if (controller === 'deployment') {
      const first = deployPods.find((p) => p.status !== 'terminating');
      if (!first) return;
      say(`Deployment: killing ${first.name} — replacement gets a NEW random name`);
      setDeployPods((curr) => curr.map((p) => p.id === first.id ? { ...p, status: 'terminating' } : p));
      later(() => setDeployPods((curr) => {
        const rest = curr.filter((p) => p.id !== first.id);
        if (rest.filter((p) => p.status !== 'terminating').length >= replicas) return rest;
        const repl = mkDeployPod();
        later(() => setDeployPods((cs) => cs.map((x) => x.id === repl.id ? { ...x, status: 'ready' } : x)), SPAWN_MS);
        return [...rest, repl];
      }), SPAWN_MS);
    } else if (controller === 'statefulset') {
      const p0 = statefulPods.find((p) => p.ordinal === 0 && p.status !== 'terminating');
      if (!p0) return;
      say(`StatefulSet: killing web-0 — same name & PVC ${p0.pvc.name} will return`);
      const keptPvc = p0.pvc;
      setStatefulPods((curr) => curr.map((p) => p.id === p0.id ? { ...p, status: 'terminating' } : p));
      later(() => setStatefulPods((curr) => {
        const repl = mkStatefulPod(0, keptPvc.storageClass, keptPvc);
        later(() => setStatefulPods((cs) => cs.map((x) => x.id === repl.id ? { ...x, status: 'ready' } : x)), SPAWN_MS);
        return [repl, ...curr.filter((p) => p.id !== p0.id)];
      }), SPAWN_MS);
    } else {
      const running = jobRuns.find((j) => j.status === 'running');
      if (!running) { say('CronJob: no running pod to kill'); return; }
      const restart = concurrency !== 'Forbid';
      say(`CronJob: killed pod for ${running.name} — policy ${concurrency} ${restart ? 'restarts pod' : 'fails Job'}`);
      setJobRuns((curr) => curr.map((j) => j.id === running.id
        ? { ...j, status: restart ? 'running' : 'failed', startedAt: Date.now(), finishedAt: restart ? null : Date.now() } : j));
      if (restart) later(() => setJobRuns((cs) => cs.map((j) => j.id === running.id
        ? { ...j, status: j.willSucceed ? 'succeeded' : 'failed', finishedAt: Date.now() } : j)), JOB_RUN_MS);
    }
  }

  function reset() {
    timers.current.forEach(clearTimeout); timers.current.clear();
    podSeq = 0; jobSeq = 0; orphanPvcs.current = {};
    setReplicas(3);
    setDeployPods(Array.from({ length: 3 }, () => ({ ...mkDeployPod(), status: 'ready' })));
    setStatefulPods([]); setJobRuns([]); setLog([]);
    if (controller === 'statefulset') reconcileStatefulSet(3);
  }

  const m = useMemo(() => {
    if (controller === 'deployment') return { alive: deployPods.filter((p) => p.status !== 'terminating').length, identity: 'no', pvcs: 0, succ: 0, fail: 0 };
    if (controller === 'statefulset') {
      const alive = statefulPods.filter((p) => p.status !== 'terminating').length;
      return { alive, identity: 'yes', pvcs: alive + Object.keys(orphanPvcs.current).length, succ: 0, fail: 0 };
    }
    return { alive: jobRuns.filter((j) => j.status === 'running').length, identity: 'n/a', pvcs: 0,
      succ: jobRuns.filter((j) => j.status === 'succeeded').length,
      fail: jobRuns.filter((j) => j.status === 'failed').length };
  }, [controller, deployPods, statefulPods, jobRuns]);

  const idColor = m.identity === 'yes' ? '#2a8a3e' : m.identity === 'no' ? 'var(--accent)' : 'var(--ink-soft)';

  return (
    <div className="widget">
      <div className="widget-title">StatefulSets & Jobs — same slider, three different promises</div>
      <div className="widget-hint">
        A Deployment treats pods as cattle. A StatefulSet hands each pod a name and a PVC it keeps for life.
        A CronJob fires a one-shot pod on a schedule. Move the slider, kill pod-0, watch what each one guarantees.
      </div>

      <div className="controls">
        {[['deployment', 'Deployment'], ['statefulset', 'StatefulSet'], ['cronjob', 'CronJob']].map(([k, label]) => (
          <button key={k} className={`btn ${controller === k ? 'btn-accent' : ''}`} onClick={() => pickController(k)}>{label}</button>
        ))}
        <button className="btn btn-ghost" onClick={reset} style={{ marginLeft: 'auto' }}>Reset</button>
      </div>

      <div className="controls">
        {controller !== 'cronjob' && <>
          <label htmlFor="replica-slider">Replicas</label>
          <input id="replica-slider" type="range" min={1} max={6} value={replicas}
            onChange={(e) => onReplicas(Number(e.target.value))} style={{ flex: '0 1 200px' }} />
          <span style={{ fontFamily: 'var(--font-mono)', minWidth: '2em' }}>{replicas}</span>
        </>}
        {controller === 'statefulset' && <>
          <label style={{ marginLeft: '0.6rem' }}>storageClass</label>
          <select className="field" value={storageClass}
            onChange={(e) => { setStorageClass(e.target.value); say(`StatefulSet: default storageClass -> ${e.target.value} (existing PVCs unchanged)`); }}>
            {STORAGE_CLASSES.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
          </select>
        </>}
        {controller === 'cronjob' && <>
          <label>schedule</label>
          <div className="pill-group">
            {SCHEDULES.map((s) => (
              <button key={s.id} className={`btn ${schedule === s.id ? 'btn-accent' : ''}`}
                style={{ fontSize: '0.78rem', padding: '0.25em 0.7em' }} onClick={() => setSchedule(s.id)}>{s.label}</button>
            ))}
          </div>
          <label style={{ marginLeft: '0.5rem' }}>command</label>
          <input className="field" style={{ width: 180 }} value={command} onChange={(e) => setCommand(e.target.value)} />
          <label style={{ marginLeft: '0.5rem' }}>concurrencyPolicy</label>
          <select className="field" value={concurrency} onChange={(e) => setConcurrency(e.target.value)}>
            {CONCURRENCY.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </>}
      </div>

      <div className="controls">
        {controller === 'cronjob'
          ? <button className="btn btn-accent" onClick={triggerCronJob}>Trigger run now</button>
          : <>
              <button className="btn btn-accent" onClick={() => onReplicas(Math.min(6, replicas + 1))}>Scale up</button>
              <button className="btn" onClick={() => onReplicas(Math.max(1, replicas - 1))}>Scale down</button>
            </>}
        <button className="btn" onClick={killPodZero}>{controller === 'cronjob' ? 'Kill running pod' : 'Kill pod-0'}</button>
      </div>

      <div className="widget-stage" style={{ minHeight: 240 }}>
        {controller === 'deployment' && <DeploymentStage pods={deployPods} />}
        {controller === 'statefulset' && <StatefulSetStage pods={statefulPods} orphaned={orphanPvcs.current} />}
        {controller === 'cronjob' && <CronJobStage runs={jobRuns} schedule={schedule} />}
      </div>

      <div className="metrics">
        <div className="metric"><div className="label">Pods alive</div><div className="value">{m.alive}</div></div>
        <div className="metric"><div className="label">Identity preserved?</div><div className="value" style={{ color: idColor }}>{m.identity}</div></div>
        <div className="metric"><div className="label">PVCs attached</div><div className="value">{m.pvcs}</div></div>
        <div className="metric"><div className="label">Jobs succeeded</div><div className="value">{m.succ}</div></div>
        <div className={`metric ${m.fail ? 'accent' : ''}`}><div className="label">Jobs failed</div><div className="value">{m.fail}</div></div>
      </div>

      <pre className="log" style={{ maxHeight: 140, overflowY: 'auto', marginTop: '0.6rem' }}>
        {log.length === 0 ? '(events appear here)' : log.join('\n')}
      </pre>

      <div className="callout">
        <strong>Try this.</strong> On <em>Deployment</em>, kill pod-0 a few times — every replacement has a new random name.
        Switch to <em>StatefulSet</em>: kill web-0, the replacement is also web-0 with the same PVC re-attached, and scale
        down always terminates the highest ordinal first. Switch to <em>CronJob</em>, set concurrency to <em>Forbid</em> —
        triggering while a run is in flight is silently skipped, instead of piling up.
      </div>
    </div>
  );
}

// ===================== Stages =====================
const podCard = (s) => ({
  width: 130, padding: '0.5rem 0.6rem', borderRadius: 6, boxShadow: '3px 3px 0 var(--ink)',
  background: s === 'terminating' ? '#f7c8c8' : s === 'creating' ? '#fff4cc' : 'var(--paper)',
  border: `2px solid ${s === 'terminating' ? 'var(--accent)' : 'var(--ink)'}`,
});
const m9 = { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-soft)', letterSpacing: '0.1em' };
const m10 = { fontFamily: 'var(--font-mono)', fontSize: 10 };
const m11s = { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' };
const m12b = { fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 };
const popAnim = (s) => ({
  initial: { opacity: 0, scale: 0.6, y: 20 }, exit: { opacity: 0, scale: 0.5, y: -20 }, transition: { duration: 0.3 },
  animate: { opacity: s === 'terminating' ? 0.5 : 1, scale: 1, y: 0 },
});

const PodCard = ({ p, showStorage }) => (
  <div style={podCard(p.status)}>
    <div style={m9}>POD</div>
    <div style={m12b}>{p.name}</div>
    <div style={{ ...m10, color: 'var(--ink-soft)', marginTop: 4 }}>{p.status}</div>
    {showStorage && <div style={{ ...m9, color: 'var(--ink-faint)', letterSpacing: 0, marginTop: 6 }}>storage: emptyDir</div>}
  </div>
);

function DeploymentStage({ pods }) {
  return (
    <div>
      <div style={{ ...m11s, marginBottom: 8 }}>ReplicaSet keeps N pods alive. Names are random. No persistent identity, no per-pod storage.</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <AnimatePresence>
          {pods.map((p) => (
            <motion.div key={p.id} {...popAnim(p.status)}><PodCard p={p} showStorage /></motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatefulSetStage({ pods, orphaned }) {
  const sorted = [...pods].sort((a, b) => a.ordinal - b.ordinal);
  const orphanList = Object.values(orphaned);
  return (
    <div>
      <div style={{ ...m11s, marginBottom: 8 }}>Pods are created 0, 1, 2, ... and torn down in reverse. Each pod has a sticky name and its own PVC.</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <AnimatePresence>
          {sorted.map((p) => (
            <motion.div key={p.id} layout {...popAnim(p.status)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <PodCard p={p} />
              <svg width={2} height={14}><line x1={1} y1={0} x2={1} y2={14} stroke="var(--ink)" strokeWidth={2} /></svg>
              <div style={{ width: 130, padding: '0.4rem 0.6rem', background: '#cfe2f3', border: '2px solid var(--ink)', borderRadius: 6 }}>
                <div style={m9}>PVC</div>
                <div style={{ ...m10, fontWeight: 700 }}>{p.pvc.name}</div>
                <div style={{ ...m9, letterSpacing: 0 }}>{p.pvc.storageClass} · {p.pvc.sizeGi}Gi</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {orphanList.length > 0 && (
        <div style={{ marginTop: 14, padding: '0.5rem 0.6rem', border: '1.5px dashed var(--ink-faint)', borderRadius: 6, background: 'var(--paper-deep)' }}>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>Retained PVCs (no pod attached):</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {orphanList.map((pvc) => (
              <span key={pvc.name} style={{ ...m10, padding: '2px 6px', background: '#cfe2f3', border: '1.5px solid var(--ink)', borderRadius: 3 }}>
                {pvc.name} ({pvc.storageClass})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CronJobStage({ runs, schedule }) {
  const current = runs.find((j) => j.status === 'running');
  const history = runs.filter((j) => j.status !== 'running');
  const label = SCHEDULES.find((s) => s.id === schedule)?.label;
  return (
    <div>
      <div style={{ ...m11s, marginBottom: 8 }}>
        Schedule: <strong>{label}</strong>. Each fire creates a Job, which spawns one short-lived pod.
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 200px' }}>
          <div style={{ ...m9, marginBottom: 4 }}>CURRENT</div>
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div key={current.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.3 }}
                style={{ padding: '0.5rem 0.6rem', background: '#fff4cc', border: '2px solid #b58900', borderRadius: 6, boxShadow: '3px 3px 0 var(--ink)' }}>
                <div style={m9}>JOB POD</div>
                <div style={m12b}>{current.name}</div>
                <div style={{ ...m9, letterSpacing: 0, marginTop: 4 }}>{current.command}</div>
                <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: JOB_RUN_MS / 1000, ease: 'linear' }}
                  style={{ height: 4, background: '#b58900', marginTop: 6, borderRadius: 2 }} />
              </motion.div>
            ) : (
              <div style={{ ...m11s, color: 'var(--ink-faint)', padding: '0.5rem 0.6rem', border: '1.5px dashed var(--ink-faint)', borderRadius: 6 }}>idle — no pod running</div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ ...m9, marginBottom: 4 }}>HISTORY</div>
          {history.length === 0
            ? <div style={{ ...m11s, color: 'var(--ink-faint)' }}>(no runs yet)</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{history.map((j) => <HistoryRow key={j.id} j={j} />)}</div>}
        </div>
      </div>
    </div>
  );
}

const HistoryRow = ({ j }) => {
  const ok = j.status === 'succeeded';
  const c = ok ? '#2a8a3e' : 'var(--accent)';
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8, padding: '0.25rem 0.5rem', border: '1.5px solid var(--ink-faint)', borderRadius: 4, background: 'var(--paper)' }}>
      <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700,
        background: ok ? '#d9ead3' : '#f7c8c8', color: c, border: `1px solid ${c}` }}>{ok ? 'OK' : 'FAIL'}</span>
      <strong>{j.name}</strong>
      <span style={{ color: 'var(--ink-soft)' }}>{j.command}</span>
      <span style={{ marginLeft: 'auto', color: 'var(--ink-faint)', fontSize: 10 }}>
        {j.finishedAt ? `${Math.round((j.finishedAt - j.startedAt) / 100) / 10}s` : ''}
      </span>
    </div>
  );
};
