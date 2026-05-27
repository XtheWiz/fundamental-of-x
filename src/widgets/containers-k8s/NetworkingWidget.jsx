import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Cluster networking: the actual life of a packet from pod A (node 1) to
// pod B (node 2), routed by a CNI plugin. With a mesh on, sidecars add
// mTLS + retries + per-pod telemetry. Inject drops to see how reliability
// changes mesh-on vs mesh-off.

const CNI_PLUGINS = {
  flannel: { label: 'flannel', encap: 'VXLAN', encapDetail: 'UDP/8472 overlay',     latency: 0.6,  note: 'Simple L2 overlay. VXLAN encapsulates pod packets in UDP.' },
  calico:  { label: 'calico',  encap: 'IPIP',  encapDetail: 'IP-in-IP, BGP routes', latency: 0.4,  note: 'BGP-distributed routes between nodes. IPIP wraps pod IPs.' },
  cilium:  { label: 'cilium',  encap: 'eBPF',  encapDetail: 'kernel datapath',      latency: 0.25, note: 'eBPF in the kernel. Can skip the bridge entirely.' },
};

const MESH_OPTIONS = {
  off:     { label: 'mesh off', sidecar: null,            mTLS: false, retries: 0 },
  linkerd: { label: 'linkerd',  sidecar: 'linkerd-proxy', mTLS: true,  retries: 2 },
  istio:   { label: 'istio',    sidecar: 'envoy',         mTLS: true,  retries: 3 },
};

const HOP_MS = 240;
const IDLE_PODS = [
  { id: 'pod-a2', x: 175, y: 70, label: 'pod A2' },
  { id: 'pod-b2', x: 725, y: 70, label: 'pod B2' },
];

function buildHops(cniKey, meshKey) {
  const cni = CNI_PLUGINS[cniKey];
  const mesh = MESH_OPTIONS[meshKey];
  const hops = [{ id: 'pod-a', x: 90, y: 130, label: 'pod A', sub: 'app', kind: 'pod' }];
  if (mesh.sidecar) hops.push({ id: 'side-a', x: 90, y: 195, label: mesh.sidecar, sub: 'sidecar', kind: 'sidecar' });
  hops.push({ id: 'veth-a', x: 175, y: 250, label: 'veth0',   sub: 'pair',          kind: 'veth' });
  hops.push({ id: 'br-1',   x: 260, y: 305, label: 'cni0',    sub: 'bridge',        kind: 'bridge' });
  hops.push({ id: 'encap',  x: 345, y: 305, label: cni.encap, sub: 'encap',         kind: 'encap' });
  hops.push({ id: 'wire',   x: 450, y: 360, label: 'eth0',    sub: 'physical net',  kind: 'wire' });
  hops.push({ id: 'decap',  x: 555, y: 305, label: cni.encap, sub: 'decap',         kind: 'encap' });
  hops.push({ id: 'br-2',   x: 640, y: 305, label: 'cni0',    sub: 'bridge',        kind: 'bridge' });
  hops.push({ id: 'veth-b', x: 725, y: 250, label: 'veth0',   sub: 'pair',          kind: 'veth' });
  if (mesh.sidecar) hops.push({ id: 'side-b', x: 810, y: 195, label: mesh.sidecar, sub: 'sidecar', kind: 'sidecar' });
  hops.push({ id: 'pod-b', x: 810, y: 130, label: 'pod B', sub: 'app', kind: 'pod' });
  return hops;
}

export default function NetworkingWidget() {
  const [cniKey, setCniKey] = useState('flannel');
  const [meshKey, setMeshKey] = useState('off');
  const [dropEnabled, setDropEnabled] = useState(false);
  const [activeHopIdx, setActiveHopIdx] = useState(-1);
  const [mTLSPhase, setMTLSPhase] = useState(null);
  const [running, setRunning] = useState(false);
  const [retriesUsed, setRetriesUsed] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [stats, setStats] = useState({ sent: 0, delivered: 0, dropped: 0, totalRetries: 0 });
  const [reqRateA, setReqRateA] = useState(0);
  const [reqRateB, setReqRateB] = useState(0);
  const timersRef = useRef(new Set());

  useEffect(() => () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
  }, []);

  function schedule(fn, ms) {
    const t = setTimeout(() => { timersRef.current.delete(t); fn(); }, ms);
    timersRef.current.add(t);
    return t;
  }

  const hops = useMemo(() => buildHops(cniKey, meshKey), [cniKey, meshKey]);
  const cni = CNI_PLUGINS[cniKey];
  const mesh = MESH_OPTIONS[meshKey];

  // Rough latency: per-hop base + CNI encap cost + mTLS handshake cost.
  const latencyBudget = useMemo(() => {
    const base = hops.length * 0.08;
    const mTLSCost = mesh.mTLS ? 0.5 : 0;
    return (base + cni.latency + mTLSCost).toFixed(2);
  }, [hops.length, cni.latency, mesh.mTLS]);

  function pickCni(k)  { if (running) return; setCniKey(k);  setActiveHopIdx(-1); setMTLSPhase(null); setLastResult(null); }
  function pickMesh(k) { if (running) return; setMeshKey(k); setActiveHopIdx(-1); setMTLSPhase(null); setLastResult(null); }
  function toggleDrop() { if (running) return; setDropEnabled((d) => !d); }

  function sendPacket() {
    if (running) return;
    setRunning(true);
    setLastResult(null);
    setActiveHopIdx(-1);
    setMTLSPhase(null);
    setRetriesUsed(0);
    setStats((s) => ({ ...s, sent: s.sent + 1 }));
    setReqRateA((r) => r + 1);

    const hopList = hops;
    const handshakeIdx = mesh.mTLS ? hopList.findIndex((h) => h.id === 'side-a') : -1;

    function walkAttempt(attemptNo) {
      hopList.forEach((_, i) => {
        schedule(() => {
          setActiveHopIdx(i);
          if (mesh.mTLS && i === handshakeIdx) {
            setMTLSPhase('handshake');
            schedule(() => setMTLSPhase('done'), HOP_MS);
          }
        }, i * HOP_MS);
      });
      schedule(() => {
        const willDrop = dropEnabled && Math.random() < 0.3;
        if (willDrop) {
          if (mesh.sidecar && attemptNo < mesh.retries) {
            setRetriesUsed((r) => r + 1);
            setStats((s) => ({ ...s, totalRetries: s.totalRetries + 1 }));
            schedule(() => { setActiveHopIdx(-1); walkAttempt(attemptNo + 1); }, HOP_MS);
          } else {
            setLastResult('fail');
            setStats((s) => ({ ...s, dropped: s.dropped + 1 }));
            setRunning(false);
          }
        } else {
          setLastResult('ok');
          setStats((s) => ({ ...s, delivered: s.delivered + 1 }));
          setReqRateB((r) => r + 1);
          setRunning(false);
        }
      }, hopList.length * HOP_MS + 60);
    }
    walkAttempt(0);
  }

  function reset() {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
    setActiveHopIdx(-1); setMTLSPhase(null); setRunning(false);
    setRetriesUsed(0); setLastResult(null);
    setStats({ sent: 0, delivered: 0, dropped: 0, totalRetries: 0 });
    setReqRateA(0); setReqRateB(0);
  }

  const currentHop = activeHopIdx >= 0 ? hops[activeHopIdx] : null;

  return (
    <div className="widget">
      <div className="widget-title">Cluster networking — CNI, the wire, and the service mesh on top</div>
      <div className="widget-hint">
        Pod A on node 1 wants to reach pod B on node 2. The CNI builds the cross-node path; the mesh sidecars
        (if any) wrap it in mTLS and retry around failures. Pick a CNI, pick a mesh, send a packet.
      </div>

      <div className="controls">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>CNI:</span>
        {Object.entries(CNI_PLUGINS).map(([k, v]) => (
          <button key={k} className={`btn ${cniKey === k ? 'btn-accent' : ''}`} onClick={() => pickCni(k)} disabled={running}>
            {v.label}
          </button>
        ))}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)', marginLeft: '0.6rem' }}>Mesh:</span>
        {Object.entries(MESH_OPTIONS).map(([k, v]) => (
          <button key={k} className={`btn ${meshKey === k ? 'btn-accent' : ''}`} onClick={() => pickMesh(k)} disabled={running}>
            {v.label}
          </button>
        ))}
      </div>

      <div className="controls">
        <button className="btn btn-accent" onClick={sendPacket} disabled={running}>
          Send packet from pod A to pod B
        </button>
        <button className={`btn ${dropEnabled ? 'btn-accent' : ''}`} onClick={toggleDrop} disabled={running}>
          {dropEnabled ? 'Drop 30% to pod B: ON' : 'Drop 30% to pod B: OFF'}
        </button>
        <button className="btn btn-ghost" onClick={reset} style={{ marginLeft: 'auto' }}>Reset</button>
      </div>

      <div className="widget-stage" style={{ minHeight: 440 }}>
        <svg viewBox="0 0 900 440" width="100%" style={{ maxWidth: 900 }}>
          <defs>
            <marker id="net-arr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--ink)" />
            </marker>
          </defs>

          <NodeBox x={50}  y={30} w={380} h={310} label="node-1" sub={`${cni.label} agent`} />
          <NodeBox x={470} y={30} w={380} h={310} label="node-2" sub={`${cni.label} agent`} />

          {IDLE_PODS.map((p) => <IdlePod key={p.id} x={p.x} y={p.y} label={p.label} />)}

          {/* The physical wire between nodes. */}
          <line x1={430} y1={395} x2={470} y2={395} stroke="var(--ink)" strokeWidth={2.5} />
          <text x={450} y={417} textAnchor="middle"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>
            physical net
          </text>

          {/* Faint path connecting consecutive hops. */}
          {hops.map((h, i) => i === 0 ? null : (
            <line key={`p-${h.id}`} x1={hops[i - 1].x} y1={hops[i - 1].y} x2={h.x} y2={h.y}
              stroke="var(--ink-faint)" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6} />
          ))}

          {hops.map((h, i) => (
            <HopNode key={h.id} hop={h} active={activeHopIdx === i} passed={activeHopIdx > i}
              meshMTLS={mesh.mTLS} cniEncap={cni.encap} />
          ))}

          {/* The packet ring riding the current hop. */}
          <AnimatePresence>
            {currentHop && (
              <motion.g key={`pkt-${activeHopIdx}-${currentHop.id}`}
                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <circle cx={currentHop.x} cy={currentHop.y} r={14} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
                <circle cx={currentHop.x} cy={currentHop.y} r={6}  fill="var(--accent)" stroke="var(--ink)" strokeWidth={1.5} />
              </motion.g>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {mesh.mTLS && mTLSPhase && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <rect x={350} y={20} width={200} height={26} rx={4} fill="#d9ead3" stroke="var(--ink)" strokeWidth={1.5} />
                <text x={450} y={37} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>
                  {mTLSPhase === 'handshake' ? 'mTLS handshake…' : 'mTLS established'}
                </text>
              </motion.g>
            )}
          </AnimatePresence>

          {mesh.sidecar && (
            <>
              <MetricBadge x={150} y={108} label={`${reqRateA} req/s`} />
              <MetricBadge x={870} y={108} label={`${reqRateB} req/s`} anchor="end" />
            </>
          )}

          {currentHop && (
            <g>
              <rect x={300} y={400} width={300} height={28} rx={4} fill="var(--paper-deep)" stroke="var(--ink)" strokeWidth={1.5} />
              <text x={450} y={419} textAnchor="middle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>
                hop {activeHopIdx + 1}/{hops.length}: {currentHop.label} ({currentHop.sub})
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="metrics">
        <div className="metric"><div className="label">Hops</div><div className="value">{hops.length}</div></div>
        <div className="metric"><div className="label">Latency budget</div><div className="value">{latencyBudget}ms</div></div>
        <div className={`metric ${mesh.mTLS ? '' : 'accent'}`}>
          <div className="label">Encryption</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>{mesh.mTLS ? 'mTLS' : 'plaintext'}</div>
        </div>
        <div className="metric"><div className="label">Retries (last)</div><div className="value">{retriesUsed}</div></div>
        <div className="metric"><div className="label">Delivered</div><div className="value">{stats.delivered}/{stats.sent}</div></div>
        <div className={`metric ${stats.dropped > 0 ? 'accent' : ''}`}>
          <div className="label">Dropped</div><div className="value">{stats.dropped}</div>
        </div>
      </div>

      <div className="callout">
        <strong>{cni.label}:</strong> {cni.note} Each cross-node packet is wrapped as <code>{cni.encap}</code> ({cni.encapDetail}) and unwrapped on the other side.
        {mesh.sidecar ? (
          <div style={{ marginTop: '0.4rem' }}>
            <strong>{mesh.label}:</strong> sidecars sit between the app and the veth. They negotiate mTLS,
            emit per-request telemetry, and retry up to <code>{mesh.retries}×</code> on failure. Flip drop ON and
            send a few packets — the mesh hides flakiness; turn it off and watch dropped climb.
          </div>
        ) : (
          <div style={{ marginTop: '0.4rem' }}>
            <strong>No mesh:</strong> traffic is plaintext and there is no automatic retry. A dropped packet is a
            dropped request. Turn on a mesh and send the same packet — same wire, very different reliability.
          </div>
        )}
        {lastResult === 'ok' && retriesUsed > 0 && (
          <div style={{ marginTop: '0.4rem', color: '#2a8a3e' }}>
            Delivered after {retriesUsed} retr{retriesUsed === 1 ? 'y' : 'ies'}. The mesh absorbed the failure.
          </div>
        )}
        {lastResult === 'fail' && (
          <div style={{ marginTop: '0.4rem', color: 'var(--accent)' }}>
            Packet dropped. {mesh.sidecar ? 'Retry budget exhausted.' : 'No retry logic without a mesh.'}
          </div>
        )}
      </div>
    </div>
  );
}

function NodeBox({ x, y, w, h, label, sub }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2.5} strokeDasharray="6 3" />
      <text x={x + 12} y={y + 18}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)', letterSpacing: '0.1em' }}>
        {label.toUpperCase()}
      </text>
      <text x={x + w - 12} y={y + 18} textAnchor="end"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-faint)' }}>
        {sub}
      </text>
    </g>
  );
}

function IdlePod({ x, y, label }) {
  return (
    <g>
      <rect x={x - 32} y={y - 18} width={64} height={36} rx={5}
        fill="var(--paper-deep)" stroke="var(--ink-faint)" strokeWidth={1.5} />
      <text x={x} y={y - 2}  textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>{label}</text>
      <text x={x} y={y + 10} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: 'var(--ink-faint)' }}>idle</text>
    </g>
  );
}

const KIND_STYLE = {
  pod:     { w: 64, h: 50, fill: 'var(--paper)' },
  sidecar: { w: 78, h: 36, fill: '#cfe2f3' },
  veth:    { w: 56, h: 28, fill: '#fff4cc' },
  bridge:  { w: 58, h: 30, fill: '#fce5cd' },
  encap:   { w: 64, h: 32, fill: '#e6d6f2' },
  wire:    { w: 56, h: 28, fill: 'var(--paper-deep)' },
};

function HopNode({ hop, active, passed, meshMTLS, cniEncap }) {
  const s = KIND_STYLE[hop.kind];
  const fill = active ? 'var(--accent)' : passed ? '#d9ead3' : s.fill;
  const textFill = active ? 'white' : 'var(--ink)';
  return (
    <g>
      <rect x={hop.x - s.w / 2} y={hop.y - s.h / 2} width={s.w} height={s.h} rx={4}
        fill={fill} stroke="var(--ink)" strokeWidth={active ? 2.5 : 1.8} style={{ transition: 'fill 0.15s ease' }} />
      <text x={hop.x} y={hop.y - 2} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: hop.kind === 'pod' ? 11 : 10, fontWeight: 600, fill: textFill }}>
        {hop.label}
      </text>
      <text x={hop.x} y={hop.y + 10} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: active ? 'white' : 'var(--ink-soft)' }}>
        {hop.sub}
      </text>
      {hop.kind === 'sidecar' && meshMTLS && (
        <text x={hop.x} y={hop.y - s.h / 2 - 4} textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: '#2a8a3e', fontWeight: 600 }}>mTLS</text>
      )}
      {hop.kind === 'encap' && (
        <text x={hop.x} y={hop.y + s.h / 2 + 11} textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: 'var(--ink-faint)' }}>{cniEncap}</text>
      )}
    </g>
  );
}

function MetricBadge({ x, y, label, anchor = 'start' }) {
  const w = 64;
  const rectX = anchor === 'end' ? x - w : x;
  return (
    <g>
      <rect x={rectX} y={y - 10} width={w} height={20} rx={10} fill="#1c6dd0" stroke="var(--ink)" strokeWidth={1.5} />
      <text x={rectX + w / 2} y={y + 4} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, fill: 'white' }}>{label}</text>
    </g>
  );
}
