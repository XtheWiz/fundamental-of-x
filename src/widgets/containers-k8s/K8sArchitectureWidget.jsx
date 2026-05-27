import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Kubernetes architecture — learner-driven walk-through.
//
// The learner picks a kubectl command, then advances one hop at a time.
// Each hop animates a token along the arrow it travels and highlights the
// component currently doing the work. The side log narrates exactly what
// happened. The learner can also "kill" any control-plane component to
// see how the flow stalls (apiserver down → connection refused; scheduler
// down → pods stuck Pending; controller down → desired-state never
// reconciled; etcd down → writes refused).

// ---------------------------------------------------------------------------
// Static layout — coordinates inside a 760x420 svg.
// ---------------------------------------------------------------------------

const CP_BAND = { x: 20,  y: 30,  w: 720, h: 180, label: 'Control plane' };
const DP_BAND = { x: 20,  y: 230, w: 720, h: 170, label: 'Data plane (worker nodes)' };

const COMPONENTS = {
  kubectl:    { x: 70,   y: 120, w: 90, h: 50, label: 'kubectl', kind: 'client',  killable: false },
  apiserver:  { x: 240,  y: 120, w: 110, h: 54, label: 'api-server', kind: 'cp',  killable: true },
  etcd:       { x: 400,  y: 60,  w: 90,  h: 44, label: 'etcd',       kind: 'cp',  killable: true },
  controller: { x: 400,  y: 180, w: 110, h: 44, label: 'controller-mgr', kind: 'cp', killable: true },
  scheduler:  { x: 560,  y: 120, w: 100, h: 50, label: 'scheduler',  kind: 'cp',  killable: true },
};

// Three worker nodes along the data-plane band.
const NODES = [
  { id: 'node-1', x: 130, y: 320 },
  { id: 'node-2', x: 380, y: 320 },
  { id: 'node-3', x: 630, y: 320 },
];

// ---------------------------------------------------------------------------
// Command catalogue. Each command is a sequence of hops. A hop names the
// edge being traversed, which component "owns" that step, and the log line.
// Hops are filtered at run-time based on what's alive / what the command
// needs (read-only commands skip controller + scheduler + kubelet).
// ---------------------------------------------------------------------------

const COMMANDS = {
  apply: {
    cmd: 'kubectl apply -f pod.yaml',
    summary: 'create a Pod',
    mutating: true,
    needs: ['apiserver', 'etcd', 'controller', 'scheduler'],
    hops: [
      { from: 'kubectl',    to: 'apiserver',  owner: 'apiserver',
        log: 'kubectl POSTs the manifest. api-server authenticates, validates the schema, and runs admission.' },
      { from: 'apiserver',  to: 'etcd',       owner: 'etcd',
        log: 'api-server writes the Pod object to etcd. Status: Pending. No nodeName yet.' },
      { from: 'etcd',       to: 'controller', owner: 'controller',
        log: 'controller-manager watches the change. Desired = 1 Pod, actual = 0. Nothing to do here (no ReplicaSet), so it yields.' },
      { from: 'apiserver',  to: 'scheduler',  owner: 'scheduler',
        log: 'scheduler sees an unscheduled Pod. Filters + scores nodes, picks one, PATCHes spec.nodeName via api-server.' },
      { from: 'scheduler',  to: 'kubelet',    owner: 'kubelet',
        log: 'kubelet on the chosen node sees a Pod bound to it. Pulls the image, asks the container runtime to start it. Status: Running.' },
    ],
  },
  scale: {
    cmd: 'kubectl scale deploy/web --replicas=3',
    summary: 'scale a Deployment to 3',
    mutating: true,
    needs: ['apiserver', 'etcd', 'controller', 'scheduler'],
    hops: [
      { from: 'kubectl',    to: 'apiserver',  owner: 'apiserver',
        log: 'kubectl PATCHes the Deployment spec.replicas = 3. api-server validates.' },
      { from: 'apiserver',  to: 'etcd',       owner: 'etcd',
        log: 'Deployment object updated in etcd.' },
      { from: 'etcd',       to: 'controller', owner: 'controller',
        log: 'deployment-controller diffs desired (3) vs actual (1). Updates the ReplicaSet. replicaset-controller creates 2 new Pod objects via api-server.' },
      { from: 'apiserver',  to: 'scheduler',  owner: 'scheduler',
        log: 'scheduler picks nodes for the 2 new Pods and binds them.' },
      { from: 'scheduler',  to: 'kubelet',    owner: 'kubelet',
        log: 'kubelets on the chosen nodes pull images and start containers. Deployment reaches 3/3 Ready.' },
    ],
  },
  delete: {
    cmd: 'kubectl delete pod web-x',
    summary: 'delete a Pod',
    mutating: true,
    needs: ['apiserver', 'etcd', 'controller'],
    hops: [
      { from: 'kubectl',    to: 'apiserver',  owner: 'apiserver',
        log: 'kubectl sends DELETE. api-server marks the Pod with a deletionTimestamp (graceful).' },
      { from: 'apiserver',  to: 'etcd',       owner: 'etcd',
        log: 'etcd records the tombstone. Watchers fire.' },
      { from: 'apiserver',  to: 'kubelet',    owner: 'kubelet',
        log: 'kubelet on the host node receives the delete event. Sends SIGTERM to the container, waits for terminationGracePeriodSeconds, then SIGKILL.' },
      { from: 'kubelet',    to: 'apiserver',  owner: 'apiserver',
        log: 'kubelet reports the Pod as gone. api-server removes the object from etcd.' },
    ],
  },
  get: {
    cmd: 'kubectl get pods',
    summary: 'list Pods (read-only)',
    mutating: false,
    needs: ['apiserver', 'etcd'],
    hops: [
      { from: 'kubectl',    to: 'apiserver',  owner: 'apiserver',
        log: 'kubectl GETs /api/v1/namespaces/default/pods. api-server authenticates + authorises.' },
      { from: 'apiserver',  to: 'etcd',       owner: 'etcd',
        log: 'api-server reads the Pod list from etcd (or its watch cache).' },
      { from: 'etcd',       to: 'apiserver',  owner: 'apiserver',
        log: 'Results returned to api-server.' },
      { from: 'apiserver',  to: 'kubectl',    owner: 'kubectl',
        log: 'api-server returns JSON. kubectl prints the table. No worker nodes were involved.' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Drawing primitives.
// ---------------------------------------------------------------------------

function Band({ band, sub }) {
  return (
    <g>
      <rect x={band.x} y={band.y} width={band.w} height={band.h}
        fill="var(--paper)" stroke="var(--ink-faint)" strokeWidth={1.5}
        strokeDasharray="6 4" rx={8} />
      <text x={band.x + 12} y={band.y + 18}
        style={{ fontFamily: 'var(--font-display)', fontSize: 12, fill: 'var(--ink-soft)', letterSpacing: '0.08em' }}>
        {band.label.toUpperCase()}
      </text>
      {sub && (
        <text x={band.x + band.w - 12} y={band.y + 18} textAnchor="end"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-faint)' }}>{sub}</text>
      )}
    </g>
  );
}

function Box({ c, dead, active, sub }) {
  const fill = dead ? '#e6e6e6' : active ? 'var(--accent-soft)' : 'var(--paper)';
  const stroke = dead ? 'var(--ink-faint)' : active ? 'var(--accent)' : 'var(--ink)';
  const textFill = dead ? 'var(--ink-faint)' : 'var(--ink)';
  return (
    <motion.g
      animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ transformOrigin: `${c.x}px ${c.y}px` }}
    >
      <rect x={c.x - c.w / 2} y={c.y - c.h / 2} width={c.w} height={c.h}
        rx={6} fill={fill} stroke={stroke} strokeWidth={2.5} />
      <text x={c.x} y={c.y - 2} textAnchor="middle"
        style={{ fontFamily: 'var(--font-display)', fontSize: 13, fill: textFill }}>{c.label}</text>
      {sub && (
        <text x={c.x} y={c.y + 14} textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: dead ? 'var(--ink-faint)' : 'var(--ink-soft)' }}>{sub}</text>
      )}
      {dead && (
        <g>
          <line x1={c.x - c.w / 2 + 4} y1={c.y - c.h / 2 + 4}
            x2={c.x + c.w / 2 - 4} y2={c.y + c.h / 2 - 4}
            stroke="var(--accent)" strokeWidth={2} />
          <line x1={c.x + c.w / 2 - 4} y1={c.y - c.h / 2 + 4}
            x2={c.x - c.w / 2 + 4} y2={c.y + c.h / 2 - 4}
            stroke="var(--accent)" strokeWidth={2} />
        </g>
      )}
    </motion.g>
  );
}

function WorkerNode({ node, dead, active, hostsPod, podPhase }) {
  // A worker node holds two stacked sub-boxes: kubelet and runtime.
  const w = 150, h = 110;
  const x = node.x - w / 2, y = node.y - h / 2;
  const fill = dead ? '#e6e6e6' : active ? 'var(--accent-soft)' : 'var(--paper)';
  const stroke = dead ? 'var(--ink-faint)' : active ? 'var(--accent)' : 'var(--ink)';
  return (
    <motion.g
      animate={active ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ transformOrigin: `${node.x}px ${node.y}px` }}
    >
      <rect x={x} y={y} width={w} height={h} rx={8} fill={fill} stroke={stroke} strokeWidth={2.5} />
      <text x={node.x} y={y + 14} textAnchor="middle"
        style={{ fontFamily: 'var(--font-display)', fontSize: 12, fill: 'var(--ink-soft)', letterSpacing: '0.06em' }}>
        {node.id.toUpperCase()}
      </text>
      {/* kubelet sub-box */}
      <rect x={x + 10} y={y + 24} width={w - 20} height={26} rx={4}
        fill="var(--paper-deep)" stroke="var(--ink)" strokeWidth={1.5} />
      <text x={node.x} y={y + 41} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink)' }}>kubelet</text>
      {/* runtime sub-box */}
      <rect x={x + 10} y={y + 56} width={w - 20} height={26} rx={4}
        fill="var(--paper-deep)" stroke="var(--ink)" strokeWidth={1.5} />
      <text x={node.x} y={y + 73} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink)' }}>containerd</text>
      {/* hosted pod marker */}
      {hostsPod && (
        <g>
          <circle cx={node.x} cy={y + h - 8} r={6}
            fill={podPhase === 'Running' ? '#2a8a3e' : podPhase === 'Pending' ? '#e0a82e' : 'var(--ink-faint)'}
            stroke="var(--ink)" strokeWidth={1.5} />
          <text x={node.x + 12} y={y + h - 4}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>{podPhase}</text>
        </g>
      )}
    </motion.g>
  );
}

function edgePoints(from, to) {
  // Pick the closest pair of box-edge midpoints so the arrow looks clean.
  const dx = to.x - from.x, dy = to.y - from.y;
  const horiz = Math.abs(dx) > Math.abs(dy);
  let p1, p2;
  if (horiz) {
    p1 = { x: from.x + (dx > 0 ? from.w / 2 : -from.w / 2), y: from.y };
    p2 = { x: to.x   + (dx > 0 ? -to.w / 2 : to.w / 2),     y: to.y };
  } else {
    p1 = { x: from.x, y: from.y + (dy > 0 ? from.h / 2 : -from.h / 2) };
    p2 = { x: to.x,   y: to.y   + (dy > 0 ? -to.h / 2 : to.h / 2) };
  }
  return { p1, p2 };
}

function Edge({ from, to, active, dim }) {
  const { p1, p2 } = edgePoints(from, to);
  const color = active ? 'var(--accent)' : dim ? 'var(--ink-faint)' : 'var(--ink)';
  return (
    <g>
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={color} strokeWidth={active ? 3 : 1.5}
        strokeDasharray={dim ? '4 4' : undefined}
        markerEnd={active ? 'url(#k8s-arr-accent)' : 'url(#k8s-arr)'} />
    </g>
  );
}

function Token({ from, to, show }) {
  const { p1, p2 } = edgePoints(from, to);
  return (
    <AnimatePresence>
      {show && (
        <motion.circle
          key={`${p1.x}-${p1.y}-${p2.x}-${p2.y}`}
          initial={{ cx: p1.x, cy: p1.y, opacity: 0 }}
          animate={{ cx: p2.x, cy: p2.y, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          r={7}
          fill="var(--accent)"
          stroke="var(--ink)"
          strokeWidth={1.5}
        />
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main component.
// ---------------------------------------------------------------------------

export default function K8sArchitectureWidget() {
  const [cmdKey, setCmdKey] = useState('apply');
  const [stepIdx, setStepIdx] = useState(-1); // -1 = nothing happened yet
  const [dead, setDead] = useState({ apiserver: false, etcd: false, controller: false, scheduler: false });
  const [log, setLog] = useState([]);
  const [pods, setPods] = useState([]); // { node, phase } entries

  const cmd = COMMANDS[cmdKey];

  // The effective hop list = the command's hops, but if a needed component is
  // dead we cut the flow at the first hop that touches it. The "stall" message
  // becomes the final log line so the learner can see exactly where it broke.
  const { hops, stallAt } = useMemo(() => {
    const list = [];
    for (let i = 0; i < cmd.hops.length; i++) {
      const h = cmd.hops[i];
      // apiserver is the entry point — if it's dead, even hop 0 fails.
      if (dead.apiserver) { return { hops: [], stallAt: 'apiserver' }; }
      // etcd is required for any hop that touches it.
      if ((h.from === 'etcd' || h.to === 'etcd' || h.owner === 'etcd') && dead.etcd) {
        return { hops: list, stallAt: 'etcd' };
      }
      if (h.owner === 'controller' && dead.controller) {
        return { hops: list, stallAt: 'controller' };
      }
      if (h.owner === 'scheduler' && dead.scheduler) {
        return { hops: list, stallAt: 'scheduler' };
      }
      list.push(h);
    }
    return { hops: list, stallAt: null };
  }, [cmd, dead]);

  function pickCommand(k) {
    setCmdKey(k);
    setStepIdx(-1);
    setLog([]);
    setPods([]);
  }

  function toggleKill(name) {
    setDead((d) => ({ ...d, [name]: !d[name] }));
    setStepIdx(-1);
    setLog([]);
    setPods([]);
  }

  function nextStep() {
    // Special case: apiserver is dead → produce a single err log and stop.
    if (dead.apiserver) {
      setLog([{ kind: 'err', text: 'kubectl: The connection to the server was refused — did you specify the right host or port?' }]);
      return;
    }
    const nextIdx = stepIdx + 1;
    if (nextIdx >= hops.length) {
      // We've run out of hops. If we stalled, emit the stall message once.
      if (stallAt && log[log.length - 1]?.kind !== 'err') {
        const msg = stallMessage(stallAt, cmd);
        setLog((l) => [...l, { kind: 'err', text: msg }]);
      }
      return;
    }
    const hop = hops[nextIdx];
    setStepIdx(nextIdx);
    setLog((l) => [...l, { kind: 'info', text: hop.log }]);

    // Update cluster state when interesting things happen.
    if (cmd.mutating && hop.owner === 'scheduler' && cmdKey === 'apply') {
      // Pick a worker that isn't already saturated. Round-robin by current count.
      const target = pickLeastLoadedNode(pods);
      setPods((p) => [...p, { node: target, phase: 'Pending' }]);
    }
    if (cmd.mutating && hop.owner === 'scheduler' && cmdKey === 'scale') {
      // Add two Pending pods on different nodes.
      const t1 = pickLeastLoadedNode(pods);
      const t2 = pickLeastLoadedNode([...pods, { node: t1, phase: 'Pending' }]);
      setPods((p) => [...p, { node: t1, phase: 'Pending' }, { node: t2, phase: 'Pending' }]);
    }
    if (hop.owner === 'kubelet' && (cmdKey === 'apply' || cmdKey === 'scale')) {
      setPods((p) => p.map((x) => x.phase === 'Pending' ? { ...x, phase: 'Running' } : x));
    }
    if (cmdKey === 'delete' && hop.owner === 'apiserver' && nextIdx === hops.length - 1) {
      setPods((p) => p.slice(0, -1));
    }
  }

  function reset() {
    setStepIdx(-1);
    setLog([]);
    setPods([]);
  }

  // Which component is "active" right now (highlighted on the canvas)?
  const activeOwner = stepIdx >= 0 && stepIdx < hops.length ? hops[stepIdx].owner : null;
  const activeHop = stepIdx >= 0 && stepIdx < hops.length ? hops[stepIdx] : null;

  // For drawing the active edge / token.
  const hopEndpoints = activeHop ? getHopEndpoints(activeHop, pods) : null;

  // List of all edges to draw (static skeleton between control-plane pieces +
  // dotted scheduler→nodes links).
  const staticEdges = [
    ['kubectl', 'apiserver'],
    ['apiserver', 'etcd'],
    ['apiserver', 'controller'],
    ['apiserver', 'scheduler'],
  ];

  // Has the user already exhausted the flow (so Next becomes "done")?
  const flowDone = stepIdx >= hops.length - 1;
  const stalled = stallAt && flowDone;

  return (
    <div className="widget">
      <div className="widget-title">Kubernetes — how a kubectl command flows through the cluster</div>
      <div className="widget-hint">
        Pick a command, then click <em>Next step</em> to walk it through the control plane one hop at a time.
        Kill a component to see exactly where the flow breaks.
      </div>

      {/* Command picker */}
      <div className="controls">
        <label>Command:</label>
        <div className="pill-group">
          {Object.entries(COMMANDS).map(([k, v]) => (
            <span key={k}>
              <input type="radio" id={`k8s-cmd-${k}`} name="k8s-cmd"
                checked={cmdKey === k} onChange={() => pickCommand(k)} />
              <label htmlFor={`k8s-cmd-${k}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {v.cmd}
              </label>
            </span>
          ))}
        </div>
      </div>

      {/* Step + kill controls */}
      <div className="controls">
        <button className="btn btn-accent" onClick={nextStep}
          disabled={flowDone && (!stallAt || log[log.length - 1]?.kind === 'err') && !dead.apiserver}>
          Next step
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          {hops.length > 0
            ? `Step ${Math.max(0, stepIdx + 1)} / ${hops.length}${stallAt ? ' (will stall)' : ''}`
            : 'Flow blocked — apiserver unreachable'}
        </span>
      </div>

      <div className="controls">
        <label>Kill:</label>
        {['apiserver', 'etcd', 'controller', 'scheduler'].map((name) => (
          <button key={name}
            className={`btn ${dead[name] ? 'btn-accent' : 'btn-ghost'}`}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
            onClick={() => toggleKill(name)}>
            {dead[name] ? `revive ${name}` : `kill ${name}`}
          </button>
        ))}
      </div>

      {/* Stage */}
      <div className="widget-stage" style={{ minHeight: 440 }}>
        <svg viewBox="0 0 760 420" width="100%" style={{ maxWidth: 880 }}>
          <defs>
            <marker id="k8s-arr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--ink)" />
            </marker>
            <marker id="k8s-arr-accent" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--accent)" />
            </marker>
          </defs>

          <Band band={CP_BAND} sub="brain — decides what should be" />
          <Band band={DP_BAND} sub="muscle — actually runs containers" />

          {/* Static edges within the control plane */}
          {staticEdges.map(([a, b]) => (
            <Edge key={`${a}-${b}`} from={COMPONENTS[a]} to={COMPONENTS[b]}
              dim
              active={activeHop && activeHop.from === a && activeHop.to === b}
            />
          ))}

          {/* Dotted scheduler/apiserver → each node link */}
          {NODES.map((n) => (
            <line key={`sched-${n.id}`}
              x1={COMPONENTS.scheduler.x}
              y1={COMPONENTS.scheduler.y + COMPONENTS.scheduler.h / 2}
              x2={n.x} y2={n.y - 55}
              stroke="var(--ink-faint)" strokeWidth={1} strokeDasharray="3 4" />
          ))}

          {/* If the active hop targets a node (kubelet), draw that edge live */}
          {activeHop && hopEndpoints?.toNode && (
            <line
              x1={hopEndpoints.from.x} y1={hopEndpoints.from.y + (hopEndpoints.from.h || 0) / 2}
              x2={hopEndpoints.toNode.x} y2={hopEndpoints.toNode.y - 55}
              stroke="var(--accent)" strokeWidth={3}
              markerEnd="url(#k8s-arr-accent)" />
          )}

          {/* Control-plane boxes */}
          <Box c={COMPONENTS.kubectl}    active={activeOwner === 'kubectl'} sub="client" />
          <Box c={COMPONENTS.apiserver}  dead={dead.apiserver}  active={activeOwner === 'apiserver'}
            sub={dead.apiserver ? 'DOWN' : 'REST + watch'} />
          <Box c={COMPONENTS.etcd}       dead={dead.etcd}       active={activeOwner === 'etcd'}
            sub={dead.etcd ? 'DOWN' : 'key/value store'} />
          <Box c={COMPONENTS.controller} dead={dead.controller} active={activeOwner === 'controller'}
            sub={dead.controller ? 'DOWN' : 'reconcile loop'} />
          <Box c={COMPONENTS.scheduler}  dead={dead.scheduler}  active={activeOwner === 'scheduler'}
            sub={dead.scheduler ? 'DOWN' : 'bind Pod→Node'} />

          {/* Worker nodes */}
          {NODES.map((n) => {
            const hosted = pods.filter((p) => p.node === n.id);
            const targetNode = hopEndpoints?.toNode?.id;
            return (
              <WorkerNode key={n.id} node={n}
                active={activeOwner === 'kubelet' && targetNode === n.id}
                hostsPod={hosted.length > 0}
                podPhase={hosted.some((p) => p.phase === 'Running') ? `Running x${hosted.length}` :
                          hosted.length > 0 ? `Pending x${hosted.length}` : null} />
            );
          })}

          {/* Token on the active hop */}
          {activeHop && hopEndpoints && (
            <Token
              from={hopEndpoints.from}
              to={hopEndpoints.toNode
                ? { x: hopEndpoints.toNode.x, y: hopEndpoints.toNode.y - 55, w: 0, h: 0 }
                : hopEndpoints.to}
              show
            />
          )}
        </svg>
      </div>

      {/* Side log */}
      <div className="log">
        {log.length === 0 ? (
          <div className="entry"><span className="t">$</span> Pick a command, then press <em>Next step</em>.</div>
        ) : (
          log.map((e, i) => (
            <div key={i} className={`entry ${e.kind}`}>
              <span className="t">{e.kind === 'err' ? '!' : e.kind === 'ok' ? '✓' : i + 1}</span>{e.text}
            </div>
          ))
        )}
      </div>

      {/* Callout — explains the failure mode when something is killed,
          or summarises the command when everything is healthy. */}
      <div className="callout">
        {dead.apiserver ? (
          <>
            <strong>api-server is down.</strong> Every kubectl call fails immediately with a connection error.
            Nothing else in the cluster can talk either — controller-manager, scheduler and kubelets all communicate
            through the api-server. Existing Pods keep running on the nodes, but the cluster is effectively read-only and blind.
          </>
        ) : dead.etcd ? (
          <>
            <strong>etcd is down.</strong> The api-server can still accept requests but every read or write fails:
            etcd is the cluster's source of truth. Reconcilers can't observe state, no new objects can be created.
          </>
        ) : dead.scheduler ? (
          <>
            <strong>scheduler is down.</strong> New Pods are still created in etcd, but nothing assigns them to a node.
            They stay in <code>Pending</code> forever. Already-running Pods are unaffected.
          </>
        ) : dead.controller ? (
          <>
            <strong>controller-manager is down.</strong> Higher-level objects (Deployments, ReplicaSets, Jobs) stop
            reconciling. A <code>scale</code> command updates the Deployment but no new Pods are created,
            because it's the controllers — not the api-server — that turn intent into Pod objects.
          </>
        ) : (
          <>
            <strong>{cmd.cmd}</strong> — {cmd.summary}.
            {' '}The api-server is the only component that talks to etcd; everything else watches the api-server.
            That's why killing the api-server takes the whole cluster down, but killing a single controller only
            breaks the workloads that controller manages.
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

function stallMessage(stallAt, cmd) {
  switch (stallAt) {
    case 'apiserver':  return 'kubectl: connection refused — api-server is down. The command never even reached the cluster.';
    case 'etcd':       return 'api-server: etcdserver: request timed out. Nothing can be persisted; the request is rejected.';
    case 'controller': return `controller-manager is down — no Pods will be created to satisfy "${cmd.cmd}". The Deployment object is updated but the world is not.`;
    case 'scheduler':  return 'scheduler is down — the Pod is created and stored, but it stays Pending forever because nothing assigns it to a node.';
    default:           return 'Flow stalled.';
  }
}

function pickLeastLoadedNode(pods) {
  const counts = Object.fromEntries(NODES.map((n) => [n.id, 0]));
  for (const p of pods) counts[p.node] = (counts[p.node] || 0) + 1;
  return NODES.reduce((best, n) => counts[n.id] < counts[best.id] ? n : best, NODES[0]).id;
}

function getHopEndpoints(hop, pods) {
  // Map kubelet endpoints to a specific node so the token visibly moves down
  // into the data plane. For non-kubelet hops, both endpoints live in the
  // control plane lookup.
  const from = hop.from === 'kubelet'
    ? (() => {
        const target = pods.find((p) => p.phase !== 'Running');
        const node = NODES.find((n) => n.id === (target?.node)) || NODES[0];
        return { x: node.x, y: node.y - 55, w: 0, h: 0 };
      })()
    : COMPONENTS[hop.from];
  if (hop.to === 'kubelet') {
    // Find a Pending pod's node first (the one we just scheduled), else node-1.
    const target = pods.find((p) => p.phase === 'Pending')
      || pods[pods.length - 1]
      || { node: NODES[0].id };
    const node = NODES.find((n) => n.id === target.node) || NODES[0];
    return { from, to: COMPONENTS[hop.from], toNode: node };
  }
  return { from, to: COMPONENTS[hop.to] };
}
