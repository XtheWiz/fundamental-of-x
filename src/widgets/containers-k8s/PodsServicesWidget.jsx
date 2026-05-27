import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Pods, Deployments, Services — the core k8s control loop in one diagram.
//
// The learner scales replicas, kills individual pods, and fires requests at
// a Service. The whole point: pod IPs are ephemeral (kill one and its
// replacement has a new IP), but the Service's stable virtual IP load
// balances across whichever pods happen to be alive right now.

const MIN_REPLICAS = 1;
const MAX_REPLICAS = 8;
const SPAWN_MS = 700;          // ReplicaSet "creating" delay before pod is Ready
const REQUEST_MS = 900;        // animation length of a single request
const POD_SLOTS_X = [70, 150, 230, 310, 390, 470, 550, 630]; // up to 8 pods
const POD_Y = 310;
const POD_W = 64;
const POD_H = 56;

const SVC_POS = { x: 800, y: 200 };
const CLIENT_POS = { x: 800, y: 80 };
const RS_POS = { x: 350, y: 200 };
const DEP_POS = { x: 350, y: 100 };

function randomIp() {
  // Pod CIDR-ish addresses. Realism matters less than them clearly differing.
  const a = 10;
  const b = 244;
  const c = Math.floor(Math.random() * 4);
  const d = Math.floor(Math.random() * 240) + 10;
  return `${a}.${b}.${c}.${d}`;
}

let podCounter = 0;
function newPod() {
  podCounter += 1;
  return {
    id: `pod-${podCounter}`,
    name: `web-${Math.random().toString(36).slice(2, 7)}`,
    ip: randomIp(),
    status: 'creating',    // creating → ready → terminating
    requests: 0,
    bornAt: Date.now(),
  };
}

function initialPods(n) {
  podCounter = 0;
  // Seed the initial pods as already Ready so the first frame isn't all
  // pending — the learner shouldn't have to wait to see the steady state.
  return Array.from({ length: n }, () => ({ ...newPod(), status: 'ready' }));
}

export default function PodsServicesWidget() {
  const [desired, setDesired] = useState(3);
  const [pods, setPods] = useState(() => initialPods(3));
  const [restartCount, setRestartCount] = useState(0);
  const [rrIndex, setRrIndex] = useState(0);
  const [flying, setFlying] = useState([]); // {id, podId, phase: 'to-svc'|'to-pod'}
  const timersRef = useRef(new Set());

  // Cleanup any pending timers on unmount so we don't setState on a dead widget.
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  function scheduleTimeout(fn, ms) {
    const t = setTimeout(() => {
      timersRef.current.delete(t);
      fn();
    }, ms);
    timersRef.current.add(t);
    return t;
  }

  // Reconcile: whenever desired changes, the ReplicaSet adds or removes pods.
  // We model that here as a single side-effect — same as k8s, the reconciler
  // diffs current vs desired and acts.
  function reconcile(nextDesired) {
    setPods((curr) => {
      const alive = curr.filter((p) => p.status !== 'terminating');
      const aliveCount = alive.length;
      if (aliveCount === nextDesired) return curr;
      if (aliveCount < nextDesired) {
        const toAdd = nextDesired - aliveCount;
        const newOnes = Array.from({ length: toAdd }, () => newPod());
        // Promote each new pod from creating → ready after a short delay.
        newOnes.forEach((p) => {
          scheduleTimeout(() => {
            setPods((cs) => cs.map((x) => (x.id === p.id ? { ...x, status: 'ready' } : x)));
          }, SPAWN_MS);
        });
        return [...curr, ...newOnes];
      }
      // Scale down: mark the youngest "ready" pods as terminating, then drop.
      const toRemove = aliveCount - nextDesired;
      const readySorted = [...alive].sort((a, b) => b.bornAt - a.bornAt);
      const removeIds = new Set(readySorted.slice(0, toRemove).map((p) => p.id));
      const marked = curr.map((p) => (removeIds.has(p.id) ? { ...p, status: 'terminating' } : p));
      scheduleTimeout(() => {
        setPods((cs) => cs.filter((p) => !removeIds.has(p.id)));
      }, SPAWN_MS);
      return marked;
    });
  }

  function changeDesired(n) {
    const clamped = Math.max(MIN_REPLICAS, Math.min(MAX_REPLICAS, n));
    setDesired(clamped);
    reconcile(clamped);
  }

  function killPod(id) {
    // Terminate the pod, then have the ReplicaSet spin up a replacement with a
    // brand-new IP. This is the moment that justifies the Service abstraction.
    setPods((curr) => curr.map((p) => (p.id === id ? { ...p, status: 'terminating' } : p)));
    setRestartCount((c) => c + 1);
    scheduleTimeout(() => {
      setPods((curr) => {
        const remaining = curr.filter((p) => p.id !== id);
        const aliveCount = remaining.filter((p) => p.status !== 'terminating').length;
        if (aliveCount >= desired) return remaining;
        const replacement = newPod();
        scheduleTimeout(() => {
          setPods((cs) => cs.map((x) => (x.id === replacement.id ? { ...x, status: 'ready' } : x)));
        }, SPAWN_MS);
        return [...remaining, replacement];
      });
    }, SPAWN_MS);
  }

  function sendRequest() {
    // Round-robin over currently Ready pods. The Service is the only thing
    // the client ever talks to — pod IPs underneath can churn.
    const ready = pods.filter((p) => p.status === 'ready');
    if (ready.length === 0) return;
    const pick = ready[rrIndex % ready.length];
    setRrIndex((i) => (i + 1) % Math.max(1, ready.length));
    const reqId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setFlying((f) => [...f, { id: reqId, podId: pick.id, phase: 'to-svc' }]);
    scheduleTimeout(() => {
      setFlying((f) => f.map((x) => (x.id === reqId ? { ...x, phase: 'to-pod' } : x)));
    }, REQUEST_MS);
    scheduleTimeout(() => {
      setFlying((f) => f.filter((x) => x.id !== reqId));
      setPods((curr) =>
        curr.map((p) => (p.id === pick.id ? { ...p, requests: p.requests + 1 } : p)),
      );
    }, REQUEST_MS * 2);
  }

  function reset() {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
    setDesired(3);
    setPods(initialPods(3));
    setRestartCount(0);
    setRrIndex(0);
    setFlying([]);
  }

  const aliveCount = pods.filter((p) => p.status !== 'terminating').length;
  const readyCount = pods.filter((p) => p.status === 'ready').length;
  const totalRequests = pods.reduce((acc, p) => acc + p.requests, 0);

  const yaml = useMemo(() => buildYaml(desired), [desired]);

  return (
    <div className="widget">
      <div className="widget-title">Pods, Deployments, Services — scale it, kill it, watch it heal</div>
      <div className="widget-hint">
        The Deployment owns the ReplicaSet; the ReplicaSet keeps N pods alive; the Service load-balances across whichever
        pod IPs happen to exist right now. Move the slider, murder pods, fire requests.
      </div>

      <div className="controls">
        <label htmlFor="replica-slider">Replicas</label>
        <input
          id="replica-slider"
          type="range"
          min={MIN_REPLICAS}
          max={MAX_REPLICAS}
          value={desired}
          onChange={(e) => changeDesired(Number(e.target.value))}
          style={{ flex: '0 1 220px' }}
        />
        <span style={{ fontFamily: 'var(--font-mono)', minWidth: '2.5em' }}>{desired}</span>
        <button className="btn btn-accent" onClick={sendRequest} disabled={readyCount === 0}>
          Send request to Service
        </button>
        <button className="btn btn-ghost" onClick={reset} style={{ marginLeft: 'auto' }}>Reset</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)', gap: '1rem' }}>
        <div className="widget-stage" style={{ minHeight: 420 }}>
          <svg viewBox="0 0 900 420" width="100%" style={{ maxWidth: 900 }}>
            <defs>
              <marker id="k8s-arr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                <polygon points="0 0,10 5,0 10" fill="var(--ink)" />
              </marker>
              <marker id="k8s-arr-accent" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                <polygon points="0 0,10 5,0 10" fill="var(--accent)" />
              </marker>
            </defs>

            {/* Deployment box */}
            <ControllerBox
              x={DEP_POS.x} y={DEP_POS.y}
              kind="Deployment" name="web" sub={`desired: ${desired}`}
              fill="#fce5cd"
            />

            {/* ReplicaSet box */}
            <ControllerBox
              x={RS_POS.x} y={RS_POS.y}
              kind="ReplicaSet" name="web-rs" sub={`${readyCount}/${desired} ready`}
              fill="#cfe2f3"
              warn={readyCount < desired}
            />

            {/* Arrow Deployment -> ReplicaSet */}
            <Line x1={DEP_POS.x} y1={DEP_POS.y + 34} x2={RS_POS.x} y2={RS_POS.y - 34} label="manages" />

            {/* Arrow ReplicaSet -> Pods (a single fan-out indicator) */}
            <Line x1={RS_POS.x} y1={RS_POS.y + 34} x2={RS_POS.x} y2={POD_Y - POD_H / 2 - 4} label="reconciles" />

            {/* Pods */}
            <AnimatePresence>
              {pods.map((p, i) => (
                <PodNode
                  key={p.id}
                  pod={p}
                  x={POD_SLOTS_X[i] || POD_SLOTS_X[POD_SLOTS_X.length - 1]}
                  y={POD_Y}
                  onKill={() => killPod(p.id)}
                />
              ))}
            </AnimatePresence>

            {/* Service node */}
            <ServiceNode x={SVC_POS.x} y={SVC_POS.y} />

            {/* Client */}
            <ClientNode x={CLIENT_POS.x} y={CLIENT_POS.y} />

            {/* Client -> Service arrow */}
            <Line x1={CLIENT_POS.x} y1={CLIENT_POS.y + 28} x2={SVC_POS.x} y2={SVC_POS.y - 38} dashed label="http" />

            {/* Service -> each ready pod (thin selector lines) */}
            {pods.map((p, i) => {
              if (p.status !== 'ready') return null;
              const px = POD_SLOTS_X[i] || POD_SLOTS_X[POD_SLOTS_X.length - 1];
              return (
                <line
                  key={`svc-${p.id}`}
                  x1={SVC_POS.x - 40} y1={SVC_POS.y}
                  x2={px} y2={POD_Y - POD_H / 2}
                  stroke="var(--ink-faint)" strokeWidth={1} strokeDasharray="3 3" opacity={0.6}
                />
              );
            })}

            {/* Selector label */}
            <text x={SVC_POS.x} y={SVC_POS.y + 58} textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>
              selector: app=web
            </text>

            {/* In-flight requests */}
            <AnimatePresence>
              {flying.map((f) => {
                const podIdx = pods.findIndex((p) => p.id === f.podId);
                const podX = POD_SLOTS_X[podIdx] || SVC_POS.x;
                if (f.phase === 'to-svc') {
                  return (
                    <motion.circle
                      key={f.id}
                      r={7}
                      fill="var(--accent)"
                      stroke="var(--ink)"
                      strokeWidth={1.5}
                      initial={{ cx: CLIENT_POS.x, cy: CLIENT_POS.y + 30 }}
                      animate={{ cx: SVC_POS.x, cy: SVC_POS.y - 40 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: REQUEST_MS / 1000, ease: 'easeInOut' }}
                    />
                  );
                }
                return (
                  <motion.circle
                    key={f.id}
                    r={7}
                    fill="var(--accent)"
                    stroke="var(--ink)"
                    strokeWidth={1.5}
                    initial={{ cx: SVC_POS.x - 40, cy: SVC_POS.y }}
                    animate={{ cx: podX, cy: POD_Y - POD_H / 2 - 4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: REQUEST_MS / 1000, ease: 'easeInOut' }}
                  />
                );
              })}
            </AnimatePresence>
          </svg>
        </div>

        <div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-soft)',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4,
          }}>
            manifest.yaml
          </div>
          <pre className="code-block" style={{ fontSize: '0.74rem', lineHeight: 1.45, margin: 0 }}>{yaml}</pre>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">Desired</div>
          <div className="value">{desired}</div>
        </div>
        <div className={`metric ${readyCount < desired ? 'accent' : ''}`}>
          <div className="label">Ready</div>
          <div className="value">{readyCount}</div>
        </div>
        <div className="metric">
          <div className="label">Alive</div>
          <div className="value">{aliveCount}</div>
        </div>
        <div className="metric">
          <div className="label">Restarts</div>
          <div className="value">{restartCount}</div>
        </div>
        <div className="metric">
          <div className="label">Requests</div>
          <div className="value">{totalRequests}</div>
        </div>
      </div>

      <div className="callout">
        <strong>Try this.</strong> Send a few requests so each pod has a count. Then kill the pod with the most
        requests. A new pod appears with a brand-new IP, the request counter for that slot resets to zero, but the
        Service (web-svc, stable virtual IP) keeps answering. That stability is the whole point of a Service.
      </div>
    </div>
  );
}

// ----- subcomponents -----

function ControllerBox({ x, y, kind, name, sub, fill, warn }) {
  const w = 200, h = 68;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6}
        fill={fill} stroke={warn ? 'var(--accent)' : 'var(--ink)'} strokeWidth={2.5} />
      <text x={x} y={y - 14} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)', letterSpacing: '0.1em' }}>
        {kind.toUpperCase()}
      </text>
      <text x={x} y={y + 4} textAnchor="middle"
        style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.04em' }}>
        {name}
      </text>
      <text x={x} y={y + 22} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: warn ? 'var(--accent)' : 'var(--ink-soft)' }}>
        {sub}
      </text>
    </g>
  );
}

function ServiceNode({ x, y }) {
  const w = 130, h = 80;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={40}
        fill="#d9ead3" stroke="var(--ink)" strokeWidth={2.5} />
      <text x={x} y={y - 20} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)', letterSpacing: '0.1em' }}>
        SERVICE
      </text>
      <text x={x} y={y - 2} textAnchor="middle"
        style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>
        web-svc
      </text>
      <text x={x} y={y + 14} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>
        10.0.0.42:80
      </text>
      <text x={x} y={y + 28} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-faint)' }}>
        (stable VIP)
      </text>
    </g>
  );
}

function ClientNode({ x, y }) {
  const w = 110, h = 50;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={4}
        fill="var(--paper)" stroke="var(--ink)" strokeWidth={2.5} />
      <text x={x} y={y - 4} textAnchor="middle"
        style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>client</text>
      <text x={x} y={y + 12} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>curl web-svc</text>
    </g>
  );
}

function PodNode({ pod, x, y, onKill }) {
  const w = POD_W, h = POD_H;
  const isTerm = pod.status === 'terminating';
  const isCreate = pod.status === 'creating';
  const fill = isTerm ? '#f7c8c8' : isCreate ? '#fff4cc' : 'var(--paper)';
  const stroke = isTerm ? 'var(--accent)' : isCreate ? '#b58900' : 'var(--ink)';
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.4, y: y + 30 }}
      animate={{ opacity: isTerm ? 0.55 : 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.3, y: y + 40 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{ originX: `${x}px`, originY: `${y}px` }}
    >
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6}
        fill={fill} stroke={stroke} strokeWidth={2} />
      <text x={x} y={y - 16} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: 'var(--ink-soft)', letterSpacing: '0.08em' }}>
        POD
      </text>
      <text x={x} y={y - 4} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700 }}>
        {pod.name}
      </text>
      <text x={x} y={y + 8} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: 'var(--ink-soft)' }}>
        {pod.ip}
      </text>
      <text x={x} y={y + 20} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 600,
          fill: isTerm ? 'var(--accent)' : isCreate ? '#b58900' : '#2a8a3e' }}>
        {pod.status === 'ready' ? `req: ${pod.requests}` : pod.status}
      </text>
      {/* clickable kill button below the pod */}
      <g
        style={{ cursor: isTerm || isCreate ? 'not-allowed' : 'pointer' }}
        onClick={isTerm || isCreate ? undefined : onKill}
      >
        <rect x={x - 24} y={y + h / 2 + 6} width={48} height={18} rx={3}
          fill={isTerm || isCreate ? 'var(--paper-deep)' : 'var(--paper)'}
          stroke="var(--accent)" strokeWidth={1.5} opacity={isTerm || isCreate ? 0.4 : 1} />
        <text x={x} y={y + h / 2 + 19} textAnchor="middle"
          style={{
            fontFamily: 'var(--font-display)', fontSize: 10, fill: 'var(--accent)',
            letterSpacing: '0.05em', pointerEvents: 'none',
          }}>
          KILL
        </text>
      </g>
    </motion.g>
  );
}

function Line({ x1, y1, x2, y2, label, dashed }) {
  const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="var(--ink)" strokeWidth={2}
        strokeDasharray={dashed ? '5 4' : undefined}
        markerEnd="url(#k8s-arr)" />
      {label && (
        <text x={midX + 8} y={midY} textAnchor="start"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>
          {label}
        </text>
      )}
    </g>
  );
}

function buildYaml(replicas) {
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: ${replicas}
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
      - name: web
        image: nginx:1.27
        ports: [{ containerPort: 80 }]
---
apiVersion: v1
kind: Service
metadata:
  name: web-svc
spec:
  selector: { app: web }
  ports:
  - port: 80
    targetPort: 80`;
}
