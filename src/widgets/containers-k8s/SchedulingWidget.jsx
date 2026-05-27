import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Scheduling & Autoscaling — three layers of "make it fit" in one cluster:
//
//   1. The scheduler places pods on nodes that have room AND match their
//      affinity / toleration rules. Pods that don't fit are Pending.
//   2. HPA scales replica count horizontally based on observed CPU load.
//   3. VPA scales each pod's requests vertically based on observed usage.
//   4. Cluster Autoscaler scales the cluster itself: adds a node when pods
//      stay Pending, removes a node when one sits mostly idle.
//
// Toggling each layer reflows the whole cluster, so the learner can see
// the layers compose (e.g. HPA spawns pods -> they don't fit -> CA adds a node).

const INITIAL_NODES = [
  { id: 'n1', name: 'node-1', cpu: 4000, mem: 8000, taint: null },        // 4 vCPU, 8 GiB
  { id: 'n2', name: 'node-2', cpu: 4000, mem: 8000, taint: null,  zone: 'eu-west-1a' },
  { id: 'n3', name: 'node-3', cpu: 4000, mem: 8000, taint: 'gpu', zone: 'eu-west-1b' },
];

const NEW_NODE_TEMPLATE = { cpu: 4000, mem: 8000, taint: null };

let podSeq = 0;
function newPod(deploy, idx) {
  podSeq += 1;
  return {
    id: `p${podSeq}`,
    deployId: deploy.id,
    name: `${deploy.name}-${Math.random().toString(36).slice(2, 6)}`,
    cpu: deploy.cpu,
    mem: deploy.mem,
    node: null,                // assigned by scheduler
    status: 'Pending',
    affinityZone: deploy.affinityOn ? deploy.affinityZone : null,
    toleration: deploy.tolerationOn ? deploy.toleration : null,
  };
}

// Place a list of pods onto the given nodes honouring requests, taints and affinity.
// Pure: returns a fresh array of pods with .node / .status fields set.
function schedule(pods, nodes) {
  // Available capacity per node id.
  const avail = Object.fromEntries(nodes.map((n) => [n.id, { cpu: n.cpu, mem: n.mem }]));
  const out = pods.map((p) => ({ ...p, node: null, status: 'Pending' }));

  // Sort largest-first so big pods grab their slot before fragmentation.
  const order = out
    .map((p, i) => i)
    .sort((a, b) => (out[b].cpu + out[b].mem / 4) - (out[a].cpu + out[a].mem / 4));

  for (const i of order) {
    const pod = out[i];
    // Build candidate nodes that respect taints + affinity.
    const candidates = nodes.filter((n) => {
      if (n.taint && pod.toleration !== n.taint) return false;
      if (pod.affinityZone && n.zone !== pod.affinityZone) return false;
      const a = avail[n.id];
      return a.cpu >= pod.cpu && a.mem >= pod.mem;
    });
    if (candidates.length === 0) continue;
    // Prefer the node with the most free CPU (best-fit-ish keeps things tidy).
    candidates.sort((a, b) => (avail[b.id].cpu - avail[a.id].cpu));
    const chosen = candidates[0];
    pod.node = chosen.id;
    pod.status = 'Running';
    avail[chosen.id].cpu -= pod.cpu;
    avail[chosen.id].mem -= pod.mem;
  }
  return out;
}

const DEFAULT_DEPLOY = {
  name: 'web', cpu: 500, mem: 512, replicas: 3,
  affinityOn: false, affinityZone: 'eu-west-1a',
  tolerationOn: false, toleration: 'gpu',
  hpaOn: false, hpaMin: 2, hpaMax: 8, hpaTarget: 60,
  vpaOn: false,
};

function bar(used, total, color = 'var(--accent)') {
  const pct = Math.min(100, Math.round((used / total) * 100));
  return (
    <div style={{ background: 'var(--paper-deep)', border: '1px solid var(--ink-faint)', height: 8, borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s ease' }} />
    </div>
  );
}

export default function SchedulingWidget() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [deploys, setDeploys] = useState([{ ...DEFAULT_DEPLOY, id: 'd1' }]);
  const [pods, setPods] = useState([]);
  const [cpuLoad, setCpuLoad] = useState(40);        // % observed cluster CPU load (drives HPA)
  const [caOn, setCaOn] = useState(false);
  const [scaleEvents, setScaleEvents] = useState(0);
  const [editing, setEditing] = useState({ ...DEFAULT_DEPLOY });
  const nodeSeqRef = useRef(4);

  // ----- HPA: desired replicas = ceil(currentReplicas * loadPct / target), clamped.
  function hpaDesired(d, currentRep) {
    if (!d.hpaOn) return d.replicas;
    const desired = Math.ceil(currentRep * (cpuLoad / d.hpaTarget));
    return Math.max(d.hpaMin, Math.min(d.hpaMax, desired || d.hpaMin));
  }

  // ----- VPA: observed usage = load% of request, +20% headroom; bump requests if hot.
  function vpaAdjust(d) {
    if (!d.vpaOn) return d;
    const factor = Math.max(0.5, Math.min(2.0, (cpuLoad / 50)));
    return { ...d, cpu: Math.round(d.cpu * factor), mem: Math.round(d.mem * factor) };
  }

  // Master reflow — called any time inputs change. Builds pods, schedules them,
  // then asks the cluster autoscaler to add/remove nodes as needed.
  function reflow(nextDeploys = deploys, nextNodes = nodes, opts = {}) {
    let workingNodes = nextNodes;
    // 1. Compute the pod set the user wants.
    const wantedPods = [];
    nextDeploys.forEach((d0) => {
      const d = vpaAdjust(d0);
      const replicas = hpaDesired(d, d0.replicas);
      for (let i = 0; i < replicas; i++) wantedPods.push(newPod(d, i));
    });

    // 2. Schedule them.
    let placed = schedule(wantedPods, workingNodes);

    // 3. Cluster autoscaler. Add nodes while pods are pending (cap at 6).
    if (caOn) {
      let safety = 0;
      while (placed.some((p) => p.status === 'Pending') && workingNodes.length < 6 && safety < 4) {
        nodeSeqRef.current += 1;
        const newNode = { ...NEW_NODE_TEMPLATE, id: `n${nodeSeqRef.current}`, name: `node-${nodeSeqRef.current}`, fresh: true };
        workingNodes = [...workingNodes, newNode];
        placed = schedule(wantedPods, workingNodes);
        safety += 1;
        opts.events && opts.events.push('CA: added ' + newNode.name);
      }
      // Remove a node that ended up empty (downscale) — but never go below 1.
      const used = new Set(placed.filter((p) => p.node).map((p) => p.node));
      const idle = workingNodes.filter((n) => !used.has(n.id));
      if (idle.length > 0 && workingNodes.length > 1) {
        const drop = idle[0];
        workingNodes = workingNodes.filter((n) => n.id !== drop.id);
        opts.events && opts.events.push('CA: removed ' + drop.name);
        placed = schedule(wantedPods, workingNodes);
      }
    }

    setNodes(workingNodes);
    setPods(placed);
    if (opts.events && opts.events.length > 0) setScaleEvents((c) => c + opts.events.length);
  }

  // Initial schedule on mount.
  useEffect(() => { reflow(); /* eslint-disable-next-line */ }, []);

  // Re-reflow whenever HPA load / autoscaler toggle change.
  useEffect(() => { reflow(deploys, nodes, { events: [] }); /* eslint-disable-next-line */ }, [cpuLoad, caOn]);

  function applyEdit() {
    const id = editing.id || `d${deploys.length + 1}`;
    const next = editing.id
      ? deploys.map((d) => (d.id === id ? { ...editing } : d))
      : [...deploys, { ...editing, id }];
    setDeploys(next);
    setEditing({ ...DEFAULT_DEPLOY });
    reflow(next, nodes, { events: ['user applied ' + (editing.name || 'deploy')] });
  }
  function removeDeploy(id) {
    const next = deploys.filter((d) => d.id !== id);
    setDeploys(next);
    reflow(next, nodes, { events: [] });
  }
  function editDeploy(d) { setEditing({ ...d }); }

  // ---- Metrics ----
  const m = useMemo(() => {
    const pending = pods.filter((p) => p.status === 'Pending').length;
    const totalCpu = nodes.reduce((s, n) => s + n.cpu, 0);
    const usedCpu = pods.filter((p) => p.node).reduce((s, p) => s + p.cpu, 0);
    const util = totalCpu > 0 ? Math.round((usedCpu / totalCpu) * 100) : 0;
    return { totalPods: pods.length, pending, totalNodes: nodes.length, util };
  }, [pods, nodes]);

  // ---- Layout: each node is a column with its pods drawn inside ----
  const NODE_W = 200, NODE_H = 240, NODE_GAP = 24;
  const totalW = nodes.length * NODE_W + (nodes.length - 1) * NODE_GAP;

  return (
    <div className="widget">
      <div className="widget-title">Scheduling & Autoscaling — fit the workload to the cluster</div>
      <div className="widget-hint">
        Each pod has a CPU + memory <em>request</em>. The scheduler finds a node that has room and matches taints / affinity.
        Then HPA, VPA, and the Cluster Autoscaler argue about whether to add pods, grow pods, or grow the cluster.
      </div>

      {/* ---- Top metrics row ---- */}
      <div className="metrics">
        <div className="metric"><div className="label">Pods</div><div className="value">{m.totalPods}</div></div>
        <div className={`metric ${m.pending > 0 ? 'accent' : ''}`}><div className="label">Pending</div><div className="value">{m.pending}</div></div>
        <div className="metric"><div className="label">Nodes</div><div className="value">{m.totalNodes}</div></div>
        <div className="metric"><div className="label">Cluster util</div><div className="value">{m.util}%</div></div>
        <div className="metric"><div className="label">Scale events</div><div className="value">{scaleEvents}</div></div>
      </div>

      {/* ---- Cluster diagram ---- */}
      <div className="widget-stage" style={{ minHeight: NODE_H + 60 }}>
        <div style={{ display: 'flex', gap: NODE_GAP, justifyContent: 'center', flexWrap: 'wrap', minWidth: Math.min(totalW, 700) }}>
          <AnimatePresence>
            {nodes.map((n) => {
              const onNode = pods.filter((p) => p.node === n.id);
              const cpuUsed = onNode.reduce((s, p) => s + p.cpu, 0);
              const memUsed = onNode.reduce((s, p) => s + p.mem, 0);
              return (
                <motion.div
                  key={n.id}
                  initial={n.fresh ? { opacity: 0, scale: 0.7, y: 20 } : false}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.7, y: -20 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    width: NODE_W, minHeight: NODE_H, padding: '0.5rem 0.6rem',
                    background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 6,
                    boxShadow: '3px 3px 0 var(--ink)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{n.name}</strong>
                    {n.taint && <span className="badge warn" style={{ fontSize: '0.6rem' }}>taint:{n.taint}</span>}
                  </div>
                  {n.zone && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-soft)' }}>zone {n.zone}</div>}
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, marginTop: 4 }}>CPU {cpuUsed}/{n.cpu}m</div>
                  {bar(cpuUsed, n.cpu, '#1c6dd0')}
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, marginTop: 4 }}>MEM {memUsed}/{n.mem}Mi</div>
                  {bar(memUsed, n.mem, '#2a8a3e')}

                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    <AnimatePresence>
                      {onNode.map((p) => (
                        <motion.div
                          key={p.id}
                          layout
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: 0.25 }}
                          title={`${p.name} — ${p.cpu}m CPU, ${p.mem}Mi`}
                          style={{
                            padding: '2px 5px', background: 'var(--accent-soft, #fde2e2)',
                            border: '1.5px solid var(--ink)', borderRadius: 3,
                            fontFamily: 'var(--font-mono)', fontSize: 9, lineHeight: 1.3,
                          }}
                        >
                          <div>{p.name}</div>
                          <div style={{ color: 'var(--ink-soft)' }}>{p.cpu}m / {p.mem}Mi</div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Pending pods tray */}
        {pods.some((p) => p.status === 'Pending') && (
          <div style={{ marginTop: 12, padding: '0.5rem 0.6rem', border: '1.5px dashed var(--accent)', borderRadius: 6, background: '#fde2e2' }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>Pending (no node fits):</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {pods.filter((p) => p.status === 'Pending').map((p) => (
                <span key={p.id} style={{
                  padding: '2px 6px', background: 'var(--paper)', border: '1.5px solid var(--accent)',
                  borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 10,
                }}>
                  {p.name} ({p.cpu}m / {p.mem}Mi)
                  {p.affinityZone && ` aff=${p.affinityZone}`}
                  {p.toleration && ` tol=${p.toleration}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---- Cluster-wide autoscaling controls ---- */}
      <div className="controls">
        <label style={{ fontFamily: 'var(--font-mono)' }}>
          <input type="checkbox" checked={caOn} onChange={(e) => setCaOn(e.target.checked)} />
          {' '}Cluster Autoscaler
        </label>
        <label style={{ marginLeft: '1rem' }}>Cluster CPU load</label>
        <input
          type="range" min={0} max={150} step={5}
          value={cpuLoad}
          onChange={(e) => setCpuLoad(parseInt(e.target.value, 10))}
          style={{ width: 180 }}
        />
        <span style={{ fontFamily: 'var(--font-mono)', minWidth: 50 }}>{cpuLoad}%</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
          drives HPA + VPA observed signal
        </span>
      </div>

      {/* ---- Existing deployments list ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
        {deploys.map((d) => (
          <div key={d.id} style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8,
            padding: '0.4rem 0.6rem', background: 'var(--paper-deep)',
            border: '1.5px solid var(--ink)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12,
          }}>
            <strong style={{ fontFamily: 'var(--font-display)' }}>{d.name}</strong>
            <span>×{hpaDesired(d, d.replicas)} {d.hpaOn && <em style={{ color: 'var(--accent)' }}>(HPA {d.hpaMin}–{d.hpaMax} @ {d.hpaTarget}%)</em>}</span>
            <span>{d.cpu}m / {d.mem}Mi {d.vpaOn && <em style={{ color: '#1c6dd0' }}>(VPA)</em>}</span>
            {d.affinityOn && <span className="badge" style={{ fontSize: '0.6rem' }}>aff:{d.affinityZone}</span>}
            {d.tolerationOn && <span className="badge" style={{ fontSize: '0.6rem' }}>tol:{d.toleration}</span>}
            <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.2em 0.6em' }} onClick={() => editDeploy(d)}>Edit</button>
            <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.2em 0.6em' }} onClick={() => removeDeploy(d.id)}>Remove</button>
          </div>
        ))}
      </div>

      {/* ---- Workload editor ---- */}
      <div style={{
        marginTop: 14, padding: '0.8rem 1rem', border: '2px solid var(--ink)',
        borderRadius: 6, background: 'var(--paper)',
      }}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
          {editing.id ? `Editing ${editing.name}` : 'New deployment'}
        </strong>
        <div className="controls" style={{ marginTop: 8 }}>
          <label>name</label>
          <input
            className="field" style={{ width: 110 }}
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase() })}
          />
          <label>replicas</label>
          <input type="range" min={1} max={8} value={editing.replicas}
            onChange={(e) => setEditing({ ...editing, replicas: parseInt(e.target.value, 10) })} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{editing.replicas}</span>
        </div>
        <div className="controls">
          <label>CPU req (m)</label>
          <input type="range" min={100} max={2000} step={100} value={editing.cpu}
            onChange={(e) => setEditing({ ...editing, cpu: parseInt(e.target.value, 10) })} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{editing.cpu}m</span>
          <label style={{ marginLeft: '0.6rem' }}>Mem req (Mi)</label>
          <input type="range" min={128} max={4096} step={128} value={editing.mem}
            onChange={(e) => setEditing({ ...editing, mem: parseInt(e.target.value, 10) })} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{editing.mem}Mi</span>
        </div>

        <div className="controls">
          <label style={{ fontFamily: 'var(--font-mono)' }}>
            <input type="checkbox" checked={editing.affinityOn}
              onChange={(e) => setEditing({ ...editing, affinityOn: e.target.checked })} />
            {' '}node affinity =&gt;
          </label>
          <select className="field" disabled={!editing.affinityOn}
            value={editing.affinityZone}
            onChange={(e) => setEditing({ ...editing, affinityZone: e.target.value })}>
            <option value="eu-west-1a">eu-west-1a</option>
            <option value="eu-west-1b">eu-west-1b</option>
          </select>
          <label style={{ fontFamily: 'var(--font-mono)', marginLeft: '0.6rem' }}>
            <input type="checkbox" checked={editing.tolerationOn}
              onChange={(e) => setEditing({ ...editing, tolerationOn: e.target.checked })} />
            {' '}toleration =&gt;
          </label>
          <select className="field" disabled={!editing.tolerationOn}
            value={editing.toleration}
            onChange={(e) => setEditing({ ...editing, toleration: e.target.value })}>
            <option value="gpu">gpu</option>
            <option value="spot">spot</option>
          </select>
        </div>

        <div className="controls">
          <label style={{ fontFamily: 'var(--font-mono)' }}>
            <input type="checkbox" checked={editing.hpaOn}
              onChange={(e) => setEditing({ ...editing, hpaOn: e.target.checked })} />
            {' '}HPA
          </label>
          <label>min</label>
          <input type="range" min={1} max={editing.hpaMax} value={editing.hpaMin} disabled={!editing.hpaOn}
            onChange={(e) => setEditing({ ...editing, hpaMin: parseInt(e.target.value, 10) })} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{editing.hpaMin}</span>
          <label>max</label>
          <input type="range" min={editing.hpaMin} max={12} value={editing.hpaMax} disabled={!editing.hpaOn}
            onChange={(e) => setEditing({ ...editing, hpaMax: parseInt(e.target.value, 10) })} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{editing.hpaMax}</span>
          <label>target%</label>
          <input type="range" min={20} max={90} step={5} value={editing.hpaTarget} disabled={!editing.hpaOn}
            onChange={(e) => setEditing({ ...editing, hpaTarget: parseInt(e.target.value, 10) })} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{editing.hpaTarget}%</span>
          <label style={{ fontFamily: 'var(--font-mono)', marginLeft: '0.8rem' }}>
            <input type="checkbox" checked={editing.vpaOn}
              onChange={(e) => setEditing({ ...editing, vpaOn: e.target.checked })} />
            {' '}VPA (resize pods to fit observed load)
          </label>
        </div>

        <div className="controls" style={{ marginTop: 4 }}>
          <button className="btn btn-accent" onClick={applyEdit} disabled={!editing.name}>
            {editing.id ? 'Update' : 'Apply'}
          </button>
          <button className="btn btn-ghost" onClick={() => setEditing({ ...DEFAULT_DEPLOY })}>Clear</button>
        </div>
      </div>

      <div className="callout">
        <strong>Try it:</strong> set CPU req to 2000m on 4 replicas — only 3 fit (one per node).
        Flip on the Cluster Autoscaler and the Pending pod brings up a new node.
        Drag <em>Cluster CPU load</em> up past the HPA target to watch replicas multiply, then turn on VPA to see pods grow until the scheduler has to shuffle them.
      </div>
    </div>
  );
}
