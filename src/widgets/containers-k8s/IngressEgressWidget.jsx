import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Two concepts share the word "ingress" in Kubernetes:
//   1) Ingress resource — HTTP/L7 routing into the cluster (host + path → service).
//   2) NetworkPolicy   — pod-to-pod allow/deny at L3/L4 (ingress AND egress).
// This widget lets the learner play with both, side by side, behind two tabs.

const SERVICES = ['api-v1', 'api-v2', 'static'];

const DEFAULT_RULES = [
  { id: 'r1', host: 'api.example.com',    path: '/v1', service: 'api-v1' },
  { id: 'r2', host: 'api.example.com',    path: '/v2', service: 'api-v2' },
  { id: 'r3', host: 'static.example.com', path: '/',   service: 'static' },
];

const PODS = [
  { id: 'frontend', x: 80,  y: 70,  label: 'frontend' },
  { id: 'api',      x: 280, y: 70,  label: 'api' },
  { id: 'db',       x: 280, y: 200, label: 'db' },
  { id: 'audit',    x: 80,  y: 200, label: 'audit' },
];

// ----- URL routing -----------------------------------------------------------
function parseUrl(raw) {
  // Hand-rolled, so we can survive missing scheme without throwing.
  if (!raw) return null;
  let s = raw.trim();
  if (!/^https?:\/\//i.test(s)) s = 'http://' + s;
  try {
    const u = new URL(s);
    return { host: u.hostname, path: u.pathname || '/' };
  } catch {
    return null;
  }
}

function matchRule(rules, url) {
  if (!url) return null;
  // Longest-path-wins, like real Ingress controllers.
  const candidates = rules
    .filter((r) => r.host === url.host && url.path.startsWith(r.path))
    .sort((a, b) => b.path.length - a.path.length);
  return candidates[0] || null;
}

// ----- NetworkPolicy evaluation ---------------------------------------------
// Each policy: { id, target, ingressFrom: [pods], egressTo: [pods] }.
// Semantics (kube reality, simplified):
//   - If NO policy targets a pod, all traffic to/from it is allowed.
//   - As soon as ANY policy targets a pod, that pod becomes default-deny;
//     only traffic explicitly listed in ingressFrom / egressTo is allowed.
//   - For a connection src → dst to succeed, BOTH must approve:
//       dst's ingress AND src's egress.
function policyEvaluation(policies) {
  const targetsIngress = new Set();
  const targetsEgress  = new Set();
  for (const p of policies) {
    if (p.ingressFrom.length || p.target) targetsIngress.add(p.target);
    if (p.egressTo.length   || p.target)  targetsEgress.add(p.target);
  }
  function check(src, dst) {
    if (src === dst) return { allowed: true, reason: 'same pod' };
    // egress side (src)
    let egressOk = !targetsEgress.has(src);
    if (!egressOk) {
      egressOk = policies.some((p) => p.target === src && p.egressTo.includes(dst));
    }
    // ingress side (dst)
    let ingressOk = !targetsIngress.has(dst);
    if (!ingressOk) {
      ingressOk = policies.some((p) => p.target === dst && p.ingressFrom.includes(src));
    }
    if (egressOk && ingressOk) {
      const reasons = [];
      reasons.push(targetsEgress.has(src)  ? `${src} egress allows → ${dst}` : `${src} has no egress policy (default-allow)`);
      reasons.push(targetsIngress.has(dst) ? `${dst} ingress allows ← ${src}` : `${dst} has no ingress policy (default-allow)`);
      return { allowed: true, reason: reasons.join(' · ') };
    }
    if (!egressOk)  return { allowed: false, reason: `${src} egress policy does not list ${dst}` };
    return { allowed: false, reason: `${dst} ingress policy does not list ${src}` };
  }
  return { check, targetsIngress, targetsEgress };
}

// ============================================================================
// Tab A — Ingress resource (HTTP routing)
// ============================================================================
function IngressTab() {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [url, setUrl]     = useState('http://api.example.com/v2/users');

  const parsed = useMemo(() => parseUrl(url), [url]);
  const match  = useMemo(() => matchRule(rules, parsed), [rules, parsed]);

  // re-animate on every URL change
  const flowKey = `${url}-${rules.map((r) => r.path + r.service).join('|')}`;

  function setRuleField(id, field, value) {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  // service y-coords on the SVG
  const svcY = { 'api-v1': 60, 'api-v2': 130, 'static': 200 };

  return (
    <div>
      <div className="controls" style={{ gap: '0.4rem' }}>
        <label htmlFor="url-input">Request URL:</label>
        <input
          id="url-input"
          className="field"
          style={{ flex: 1, minWidth: 220, fontFamily: 'var(--font-mono)' }}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://host/path"
        />
        {match ? (
          <span className="badge live">→ {match.service}</span>
        ) : (
          <span className="badge err">404</span>
        )}
      </div>

      <div className="widget-stage" style={{ minHeight: 280 }}>
        <svg viewBox="0 0 640 270" width="100%" style={{ maxWidth: 640 }}>
          <defs>
            <marker id="ing-arr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--ink)" />
            </marker>
          </defs>

          {/* Client */}
          <g>
            <rect x={10} y={110} width={90} height={50} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2.5} rx={6} />
            <text x={55} y={130} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>Client</text>
            <text x={55} y={148} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
              {parsed ? parsed.host : 'invalid URL'}
            </text>
          </g>

          {/* Ingress controller */}
          <g>
            <rect x={170} y={90} width={140} height={90} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2.5} rx={6} />
            <text x={240} y={108} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>Ingress</text>
            <text x={240} y={124} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
              rules: {rules.length}
            </text>
            <text x={240} y={148} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-faint)' }}>
              {parsed ? parsed.path : '—'}
            </text>
            <text x={240} y={166} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, fill: match ? '#2a8a3e' : 'var(--accent)' }}>
              {match ? 'MATCH' : 'NO MATCH'}
            </text>
          </g>

          {/* Services */}
          {SERVICES.map((svc) => {
            const y = svcY[svc];
            const hit = match && match.service === svc;
            return (
              <g key={svc}>
                <rect x={460} y={y - 22} width={150} height={44}
                  fill={hit ? '#d9ead3' : 'var(--paper)'}
                  stroke={hit ? '#2a8a3e' : 'var(--ink)'}
                  strokeWidth={2.5} rx={6} />
                <text x={535} y={y - 4} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>
                  Service
                </text>
                <text x={535} y={y + 12} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>
                  {svc}
                </text>
              </g>
            );
          })}

          {/* static arrow client → ingress */}
          <line x1={100} y1={135} x2={166} y2={135} stroke="var(--ink)" strokeWidth={2.5} markerEnd="url(#ing-arr)" />

          {/* animated request packet client → ingress → service */}
          <AnimatePresence mode="wait">
            {parsed && (
              <motion.circle
                key={flowKey}
                r={7}
                fill={match ? 'var(--accent)' : '#999'}
                stroke="var(--ink)"
                strokeWidth={1.5}
                initial={{ cx: 100, cy: 135, opacity: 0 }}
                animate={
                  match
                    ? { cx: [100, 240, 460], cy: [135, 135, svcY[match.service]], opacity: [1, 1, 1] }
                    : { cx: [100, 240, 240], cy: [135, 135, 135], opacity: [1, 1, 0] }
                }
                transition={{ duration: match ? 1.4 : 1.0, times: [0, 0.5, 1] }}
              />
            )}
          </AnimatePresence>
        </svg>
      </div>

      <div style={{ marginTop: '0.8rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
          Ingress rules (edit live):
        </div>
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          {rules.map((r) => {
            const isMatch = match && match.id === r.id;
            return (
              <div key={r.id} style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr',
                gap: '0.4rem',
                alignItems: 'center',
                padding: '0.4rem 0.6rem',
                background: isMatch ? '#d9ead3' : 'var(--paper-deep)',
                border: `1.5px solid ${isMatch ? '#2a8a3e' : 'var(--ink-faint)'}`,
                borderRadius: 4,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>host</span>
                <input className="field" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', padding: '0.2em 0.4em' }}
                  value={r.host} onChange={(e) => setRuleField(r.id, 'host', e.target.value)} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>path</span>
                <input className="field" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', padding: '0.2em 0.4em' }}
                  value={r.path} onChange={(e) => setRuleField(r.id, 'path', e.target.value)} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>→ svc</span>
                <select className="field" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', padding: '0.2em 0.4em' }}
                  value={r.service} onChange={(e) => setRuleField(r.id, 'service', e.target.value)}>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      <div className="callout">
        <strong>Ingress resource.</strong> An L7 HTTP router into the cluster. A request is
        matched by <em>host</em> and longest-prefix <em>path</em>; the winning rule decides which
        Service receives it. Anything that matches no rule is a 404 at the edge — never reaches
        a pod.
      </div>
    </div>
  );
}

// ============================================================================
// Tab B — NetworkPolicy
// ============================================================================
function NetworkPolicyTab() {
  const [policies, setPolicies] = useState([
    { id: 'p1', target: 'db', ingressFrom: ['api'], egressTo: [] },
  ]);
  const [draft, setDraft] = useState({ target: 'api', ingressFrom: [], egressTo: [] });
  const [probe, setProbe] = useState(null); // { src, dst, allowed, reason }

  const evalr = useMemo(() => policyEvaluation(policies), [policies]);

  function addPolicy() {
    setPolicies((ps) => [
      ...ps,
      { id: 'p' + (ps.length + 1) + '-' + Date.now().toString(36), ...draft },
    ]);
    setDraft({ target: draft.target, ingressFrom: [], egressTo: [] });
  }
  function removePolicy(id) {
    setPolicies((ps) => ps.filter((p) => p.id !== id));
  }
  function toggleDraftList(field, pod) {
    setDraft((d) => {
      const has = d[field].includes(pod);
      return { ...d, [field]: has ? d[field].filter((p) => p !== pod) : [...d[field], pod] };
    });
  }
  function tryConn(src, dst) {
    const res = evalr.check(src, dst);
    setProbe({ src, dst, ...res });
  }

  const otherPods = (target) => PODS.map((p) => p.id).filter((p) => p !== target);

  return (
    <div>
      <div className="widget-stage" style={{ minHeight: 280 }}>
        <svg viewBox="0 0 360 270" width="100%" style={{ maxWidth: 420 }}>
          <defs>
            <marker id="np-arr-ok" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="#2a8a3e" />
            </marker>
            <marker id="np-arr-no" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--accent)" />
            </marker>
          </defs>

          {/* probe arrow */}
          {probe && (() => {
            const src = PODS.find((p) => p.id === probe.src);
            const dst = PODS.find((p) => p.id === probe.dst);
            if (!src || !dst) return null;
            const color = probe.allowed ? '#2a8a3e' : 'var(--accent)';
            const dx = dst.x - src.x, dy = dst.y - src.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            const ux = dx/len, uy = dy/len;
            const pad = 38;
            const x1 = src.x + ux*pad, y1 = src.y + uy*pad;
            const x2 = dst.x - ux*pad, y2 = dst.y - uy*pad;
            return (
              <motion.g key={`${probe.src}-${probe.dst}-${probe.allowed}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <line x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={color} strokeWidth={3}
                  strokeDasharray={probe.allowed ? undefined : '6 4'}
                  markerEnd={`url(#np-arr-${probe.allowed ? 'ok' : 'no'})`} />
                <motion.circle r={6} fill={color} stroke="var(--ink)" strokeWidth={1.5}
                  initial={{ cx: x1, cy: y1 }}
                  animate={{ cx: probe.allowed ? x2 : (x1+x2)/2, cy: probe.allowed ? y2 : (y1+y2)/2 }}
                  transition={{ duration: 0.8 }} />
              </motion.g>
            );
          })()}

          {PODS.map((p) => {
            const targeted = evalr.targetsIngress.has(p.id) || evalr.targetsEgress.has(p.id);
            return (
              <g key={p.id}>
                <circle cx={p.x} cy={p.y} r={34}
                  fill={targeted ? '#fde2e2' : 'var(--paper)'}
                  stroke="var(--ink)" strokeWidth={2.5} />
                <text x={p.x} y={p.y - 2} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>{p.label}</text>
                <text x={p.x} y={p.y + 14} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: 'var(--ink-soft)' }}>
                  {targeted ? 'default-deny' : 'default-allow'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Try-connection grid */}
      <div style={{ marginTop: '0.4rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
          Try a connection (src → dst):
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `auto repeat(${PODS.length}, 1fr)`, gap: '0.3rem', alignItems: 'center' }}>
          <div />
          {PODS.map((d) => (
            <div key={'h-' + d.id} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
              {d.label}
            </div>
          ))}
          {PODS.map((s) => (
            <Row key={'row-' + s.id} src={s} pods={PODS} evalr={evalr} probe={probe} onTry={tryConn} />
          ))}
        </div>
      </div>

      {probe && (
        <div className="callout" style={{ background: probe.allowed ? '#d9ead3' : '#fde2e2' }}>
          <strong>{probe.src} → {probe.dst}:</strong>{' '}
          <span style={{ color: probe.allowed ? '#2a8a3e' : 'var(--accent)', fontWeight: 700 }}>
            {probe.allowed ? 'ALLOWED' : 'DENIED'}
          </span>
          <div style={{ marginTop: '0.3rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            {probe.reason}
          </div>
        </div>
      )}

      {/* Policy editor */}
      <div style={{ marginTop: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
          Active policies:
        </div>
        {policies.length === 0 && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--ink-soft)', marginBottom: '0.6rem' }}>
            No policies — every pod is default-allow. Add one below.
          </div>
        )}
        {policies.map((p) => (
          <div key={p.id} style={{
            padding: '0.5rem 0.7rem',
            background: 'var(--paper-deep)',
            border: '1.5px solid var(--ink-faint)',
            borderRadius: 4,
            marginBottom: '0.4rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            flexWrap: 'wrap',
          }}>
            <span className="badge">target: {p.target}</span>
            <span>ingress from: <strong>{p.ingressFrom.length ? p.ingressFrom.join(', ') : '(none → deny all in)'}</strong></span>
            <span>egress to: <strong>{p.egressTo.length ? p.egressTo.join(', ') : '(none → deny all out)'}</strong></span>
            <button className="btn btn-ghost" style={{ marginLeft: 'auto', padding: '0.2em 0.6em', fontSize: '0.8rem' }}
              onClick={() => removePolicy(p.id)}>remove</button>
          </div>
        ))}

        <div style={{
          padding: '0.7rem',
          border: '1.5px dashed var(--ink-faint)',
          borderRadius: 4,
          marginTop: '0.6rem',
        }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>target pod:</label>
            <select className="field" value={draft.target}
              onChange={(e) => setDraft({ target: e.target.value, ingressFrom: [], egressTo: [] })}>
              {PODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <PodChips label="ingress from" pods={otherPods(draft.target)} selected={draft.ingressFrom}
            onToggle={(p) => toggleDraftList('ingressFrom', p)} />
          <PodChips label="egress to" pods={otherPods(draft.target)} selected={draft.egressTo}
            onToggle={(p) => toggleDraftList('egressTo', p)} />
          <button className="btn btn-accent" style={{ marginTop: '0.5rem' }} onClick={addPolicy}>
            Add policy
          </button>
        </div>
      </div>

      <div className="callout" style={{ marginTop: '1rem' }}>
        <strong>NetworkPolicy.</strong> An L3/L4 pod firewall. Until a policy targets a pod, it
        accepts and emits anything. The moment any policy lists that pod as <em>target</em>, the
        pod flips to default-deny and only the listed peers are allowed. A connection succeeds
        only if both ends approve: source's egress <em>and</em> destination's ingress.
      </div>
    </div>
  );
}

function Row({ src, pods, evalr, probe, onTry }) {
  return (
    <>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textAlign: 'right', color: 'var(--ink-soft)' }}>
        {src.label} →
      </div>
      {pods.map((dst) => {
        if (dst.id === src.id) {
          return <div key={dst.id} style={{ textAlign: 'center', color: 'var(--ink-faint)' }}>—</div>;
        }
        const res = evalr.check(src.id, dst.id);
        const active = probe && probe.src === src.id && probe.dst === dst.id;
        return (
          <button key={dst.id}
            className="btn"
            onClick={() => onTry(src.id, dst.id)}
            style={{
              padding: '0.2em 0.4em',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              background: active
                ? (res.allowed ? '#d9ead3' : '#fde2e2')
                : 'var(--paper)',
              borderColor: res.allowed ? '#2a8a3e' : 'var(--accent)',
              color: res.allowed ? '#2a8a3e' : 'var(--accent)',
              boxShadow: '2px 2px 0 var(--ink)',
            }}>
            {res.allowed ? 'allow' : 'deny'}
          </button>
        );
      })}
    </>
  );
}

function PodChips({ label, pods, selected, onToggle }) {
  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.3rem' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)', minWidth: 90 }}>
        {label}:
      </span>
      {pods.map((p) => {
        const on = selected.includes(p);
        return (
          <button key={p} onClick={() => onToggle(p)} className="btn"
            style={{
              padding: '0.15em 0.55em',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              background: on ? 'var(--accent)' : 'var(--paper)',
              color: on ? 'white' : 'var(--ink)',
              boxShadow: '2px 2px 0 var(--ink)',
            }}>
            {p}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Root
// ============================================================================
export default function IngressEgressWidget() {
  const [tab, setTab] = useState('ingress');
  return (
    <div className="widget">
      <div className="widget-title">Ingress & Egress — two ideas, one word</div>
      <div className="widget-hint">
        Kubernetes uses "ingress" for two unrelated things. Tab between them to see why people get
        confused.
      </div>

      <div className="controls">
        <button className={`btn ${tab === 'ingress' ? 'btn-accent' : ''}`} onClick={() => setTab('ingress')}>
          Ingress (HTTP routing)
        </button>
        <button className={`btn ${tab === 'np' ? 'btn-accent' : ''}`} onClick={() => setTab('np')}>
          NetworkPolicy (pod firewall)
        </button>
      </div>

      {tab === 'ingress' ? <IngressTab /> : <NetworkPolicyTab />}
    </div>
  );
}
