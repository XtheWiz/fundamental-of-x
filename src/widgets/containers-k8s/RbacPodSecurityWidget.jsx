import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Two complementary security layers in Kubernetes, side by side:
//   1. RBAC — API-server authorization. Who can do what to which resource?
//   2. PodSecurity — admission control. What can the workload itself do
//      (root? host net? capabilities?) once it lands on a node?
// Both tabs are defensive — edit the policy and the verdict updates live.

// ---------- RBAC model ----------
const USERS = {
  alice:   { label: 'Alice',   note: 'cluster operator' },
  bob:     { label: 'Bob',     note: 'app developer'    },
  mallory: { label: 'Mallory', note: 'unknown guest'    },
};

// Each role = a list of rules { verbs, resources }; '*' means any.
const ROLES = {
  'cluster-admin': {
    label: 'cluster-admin', scope: 'ClusterRole',
    rules: [{ verbs: ['*'], resources: ['*'] }],
    blurb: 'Built-in super-user. Every verb on every resource.',
  },
  edit: {
    label: 'edit', scope: 'Role (ns: default)',
    rules: [
      { verbs: ['get','list','watch','create','update','patch','delete'],
        resources: ['pods','deployments','services','configmaps'] },
      { verbs: ['create'], resources: ['pods/exec'] },
    ],
    blurb: 'Read/write workloads in the namespace. Cannot read Secrets.',
  },
  view: {
    label: 'view', scope: 'Role (ns: default)',
    rules: [{ verbs: ['get','list','watch'],
      resources: ['pods','deployments','services','configmaps'] }],
    blurb: 'Read-only on non-sensitive resources in the namespace.',
  },
  custom: {
    label: 'secret-reader', scope: 'Role (ns: default)',
    rules: [{ verbs: ['get','list'], resources: ['secrets'] }],
    blurb: 'Narrow custom Role — only reading Secrets.',
  },
};

const COMMANDS = {
  getPods:      { label: 'kubectl get pods',          verb: 'get',    resource: 'pods' },
  createDeploy: { label: 'kubectl create deployment', verb: 'create', resource: 'deployments' },
  deletePod:    { label: 'kubectl delete pod nginx',  verb: 'delete', resource: 'pods' },
  getSecrets:   { label: 'kubectl get secrets',       verb: 'get',    resource: 'secrets' },
  execPod:      { label: 'kubectl exec -it nginx --', verb: 'create', resource: 'pods/exec' },
};

function evaluateRbac(roleKeys, cmdKey) {
  const cmd = COMMANDS[cmdKey];
  for (const rk of roleKeys) {
    const role = ROLES[rk]; if (!role) continue;
    for (const rule of role.rules) {
      const verbOk = rule.verbs.includes('*') || rule.verbs.includes(cmd.verb);
      const resOk  = rule.resources.includes('*') || rule.resources.includes(cmd.resource);
      if (verbOk && resOk) return { allowed: true, rule, roleKey: rk };
    }
  }
  return { allowed: false };
}

// ---------- PodSecurity model ----------
const STANDARDS = {
  privileged: { label: 'Privileged', blurb: 'Unrestricted. Only for system workloads (CSI, node agents).' },
  baseline:   { label: 'Baseline',   blurb: 'Blocks the worst escalations: hostNetwork, privEsc, dangerous caps.' },
  restricted: { label: 'Restricted', blurb: 'Hardened: non-root, drops ALL caps, no privEsc, no host namespaces.' },
};

const DANGEROUS_CAPS = ['SYS_ADMIN','NET_ADMIN','SYS_PTRACE','SYS_MODULE'];
const ALL_CAPS = ['NET_BIND_SERVICE','CHOWN','KILL','SYS_ADMIN','NET_ADMIN','SYS_PTRACE','SYS_MODULE'];

function checkPodSecurity(std, ctx) {
  if (std === 'privileged') return [];
  const v = [];
  if (std === 'baseline' || std === 'restricted') {
    if (ctx.hostNetwork)
      v.push({ rule: 'hostNetwork', detail: 'Pods must not share the host network namespace (spec.hostNetwork=false).' });
    if (ctx.allowPrivilegeEscalation)
      v.push({ rule: 'privilege-escalation', detail: 'allowPrivilegeEscalation must be false (no setuid-style escalation).' });
    const bad = ctx.capabilitiesAdd.filter((c) => DANGEROUS_CAPS.includes(c));
    if (bad.length > 0)
      v.push({ rule: 'capabilities', detail: `Capability ${bad.join(', ')} is not allowed by ${STANDARDS[std].label}.` });
  }
  if (std === 'restricted') {
    if (!ctx.runAsNonRoot)
      v.push({ rule: 'runAsNonRoot', detail: 'Restricted requires runAsNonRoot: true.' });
    if (ctx.runAsUser === 0)
      v.push({ rule: 'runAsUser', detail: 'Restricted forbids running as UID 0 (root).' });
    if (ctx.capabilitiesAdd.length > 0)
      v.push({ rule: 'capabilities', detail: 'Restricted drops ALL capabilities — none may be added back (except NET_BIND_SERVICE in newer versions).' });
  }
  return v;
}

// ---------- Component ----------
export default function RbacPodSecurityWidget() {
  const [tab, setTab] = useState('rbac');

  // RBAC state
  const [userKey, setUserKey] = useState('bob');
  const [userRoles, setUserRoles] = useState({ alice: ['cluster-admin'], bob: ['edit'], mallory: [] });
  const [cmdKey, setCmdKey] = useState('getPods');
  const toggleRole = (uk, rk) => setUserRoles((p) => ({
    ...p, [uk]: p[uk].includes(rk) ? p[uk].filter((r) => r !== rk) : [...p[uk], rk],
  }));
  const verdict = useMemo(() => evaluateRbac(userRoles[userKey], cmdKey), [userRoles, userKey, cmdKey]);

  // PodSecurity state
  const [standard, setStandard] = useState('baseline');
  const [ctx, setCtx] = useState({
    runAsUser: 1000, runAsNonRoot: true, allowPrivilegeEscalation: false,
    capabilitiesAdd: [], hostNetwork: false,
  });
  const [admitTick, setAdmitTick] = useState(0);
  const toggleCap = (c) => setCtx((p) => ({
    ...p, capabilitiesAdd: p.capabilitiesAdd.includes(c)
      ? p.capabilitiesAdd.filter((x) => x !== c) : [...p.capabilitiesAdd, c],
  }));
  const violations = useMemo(() => checkPodSecurity(standard, ctx), [standard, ctx]);
  const admitted = violations.length === 0;

  return (
    <div className="widget">
      <div className="widget-title">RBAC and PodSecurity — two security layers</div>

      <div className="controls">
        <button className={`btn ${tab === 'rbac' ? 'btn-accent' : ''}`} onClick={() => setTab('rbac')}>RBAC</button>
        <button className={`btn ${tab === 'psa' ? 'btn-accent' : ''}`} onClick={() => setTab('psa')}>PodSecurity</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.8rem' }}>
          {tab === 'rbac' ? 'API-server authorization' : 'admission-time policy'}
        </span>
      </div>

      {tab === 'rbac' ? (
        <RbacPanel userKey={userKey} setUserKey={setUserKey} userRoles={userRoles}
          toggleRole={toggleRole} cmdKey={cmdKey} setCmdKey={setCmdKey} verdict={verdict} />
      ) : (
        <PsaPanel standard={standard} setStandard={setStandard} ctx={ctx} setCtx={setCtx}
          toggleCap={toggleCap} violations={violations} admitted={admitted}
          admitTick={admitTick} setAdmitTick={setAdmitTick} />
      )}

      <div className="callout">
        {tab === 'rbac' ? (
          <>
            <strong>RBAC</strong> answers <em>who can do what</em>. The API server checks every request against every role
            bound to the caller. Deny-by-default: a request is FORBIDDEN unless at least one rule explicitly allows it.
            Prefer narrow Roles + RoleBindings over cluster-admin.
          </>
        ) : (
          <>
            <strong>PodSecurity</strong> answers <em>what the workload itself is allowed to do</em>. The admission webhook
            rejects Pods whose <code>securityContext</code> violates the namespace label{' '}
            <code>pod-security.kubernetes.io/enforce</code>. RBAC + PodSecurity together: even a compromised developer
            credential can&apos;t admit a root, host-networked Pod.
          </>
        )}
      </div>
    </div>
  );
}

// ============== RBAC panel ==============
function RbacPanel({ userKey, setUserKey, userRoles, toggleRole, cmdKey, setCmdKey, verdict }) {
  const cmd = COMMANDS[cmdKey];
  return (
    <div className="widget-stage" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
      {/* LEFT: subject + roles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: 0 }}>
        <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <strong style={{ fontFamily: 'var(--font-display)' }}>Subject (User)</strong>
          <div className="pill-group">
            {Object.entries(USERS).map(([k, u]) => (
              <button key={k} className={`btn ${userKey === k ? 'btn-accent' : 'btn-ghost'}`}
                onClick={() => setUserKey(k)}>{u.label}</button>
            ))}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
            {USERS[userKey].label} — {USERS[userKey].note}
          </div>
        </div>

        <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ fontFamily: 'var(--font-display)' }}>RoleBindings for {USERS[userKey].label}</strong>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
              {userRoles[userKey].length} bound
            </span>
          </div>
          {Object.entries(ROLES).map(([rk, r]) => {
            const on = userRoles[userKey].includes(rk);
            return (
              <button key={rk} onClick={() => toggleRole(userKey, rk)}
                className={`btn ${on ? 'btn-accent' : 'btn-ghost'}`}
                style={{ justifyContent: 'flex-start', textAlign: 'left', display: 'block', padding: '0.4rem 0.55rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', opacity: 0.75 }}>{r.scope}</span>
                </div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 2 }}>{r.blurb}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: command + verdict */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: 0 }}>
        <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <strong style={{ fontFamily: 'var(--font-display)' }}>Try a kubectl command</strong>
          <div className="pill-group" style={{ flexWrap: 'wrap' }}>
            {Object.entries(COMMANDS).map(([k, c]) => (
              <button key={k} className={`btn ${cmdKey === k ? 'btn-accent' : 'btn-ghost'}`}
                onClick={() => setCmdKey(k)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{c.label}</button>
            ))}
          </div>
        </div>

        <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <strong style={{ fontFamily: 'var(--font-display)' }}>API server verdict</strong>
          <pre className="code-block" style={{ fontSize: '0.78rem', margin: 0, lineHeight: 1.45 }}>
{`$ ${cmd.label}\n# acting as: ${USERS[userKey].label}\n# verb=${cmd.verb}  resource=${cmd.resource}`}
          </pre>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${userKey}-${cmdKey}-${userRoles[userKey].join(',')}-${verdict.allowed}`}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              style={{
                padding: '0.55rem 0.7rem', border: '2px solid',
                borderColor: verdict.allowed ? '#2a8a3e' : 'var(--accent)',
                background: verdict.allowed ? '#e8f5e9' : '#fde2e2', borderRadius: 6,
              }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: verdict.allowed ? '#2a8a3e' : 'var(--accent)' }}>
                {verdict.allowed ? 'ALLOWED' : 'FORBIDDEN'}
              </div>
              <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
                {verdict.allowed ? (
                  <>Role <code>{ROLES[verdict.roleKey].label}</code> grants{' '}
                    <code>{verdict.rule.verbs.join(',')}</code> on <code>{verdict.rule.resources.join(',')}</code>.</>
                ) : userRoles[userKey].length === 0 ? (
                  <>{USERS[userKey].label} has no RoleBindings. Deny-by-default: no rule allows{' '}
                    <code>{cmd.verb} {cmd.resource}</code>.</>
                ) : (
                  <>None of {USERS[userKey].label}&apos;s roles (
                    {userRoles[userKey].map((r) => ROLES[r].label).join(', ')}
                    ) include a rule matching <code>{cmd.verb} {cmd.resource}</code>.</>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============== PodSecurity panel ==============
function PsaPanel({ standard, setStandard, ctx, setCtx, toggleCap, violations, admitted, admitTick, setAdmitTick }) {
  const yaml = buildYaml(ctx);
  return (
    <div className="widget-stage" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
      {/* LEFT: standard + securityContext editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: 0 }}>
        <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <strong style={{ fontFamily: 'var(--font-display)' }}>Namespace enforce label</strong>
          <div className="pill-group">
            {Object.entries(STANDARDS).map(([k, s]) => (
              <button key={k} className={`btn ${standard === k ? 'btn-accent' : 'btn-ghost'}`}
                onClick={() => setStandard(k)}>{s.label}</button>
            ))}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>{STANDARDS[standard].blurb}</div>
        </div>

        <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <strong style={{ fontFamily: 'var(--font-display)' }}>securityContext editor</strong>

          <Row label="runAsUser">
            <input type="number" value={ctx.runAsUser}
              onChange={(e) => setCtx({ ...ctx, runAsUser: Number(e.target.value) })}
              style={{ width: 90, fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
                padding: '0.25rem 0.4rem', border: '1.5px solid var(--ink)', borderRadius: 4, background: 'var(--paper)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>(0 = root)</span>
          </Row>
          <Row label="runAsNonRoot">
            <Toggle on={ctx.runAsNonRoot} onChange={(v) => setCtx({ ...ctx, runAsNonRoot: v })} />
          </Row>
          <Row label="allowPrivilegeEscalation">
            <Toggle on={ctx.allowPrivilegeEscalation} onChange={(v) => setCtx({ ...ctx, allowPrivilegeEscalation: v })} />
          </Row>
          <Row label="hostNetwork">
            <Toggle on={ctx.hostNetwork} onChange={(v) => setCtx({ ...ctx, hostNetwork: v })} />
          </Row>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>capabilities.add</span>
            <div className="pill-group" style={{ flexWrap: 'wrap' }}>
              {ALL_CAPS.map((c) => {
                const on = ctx.capabilitiesAdd.includes(c);
                const dangerous = DANGEROUS_CAPS.includes(c);
                return (
                  <button key={c} className={`btn ${on ? 'btn-accent' : 'btn-ghost'}`}
                    onClick={() => toggleCap(c)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                      borderColor: on && dangerous ? 'var(--accent)' : undefined }}>{c}</button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="controls">
          <button className="btn btn-accent" onClick={() => setAdmitTick((t) => t + 1)}>
            Try to admit this pod
          </button>
          <button className="btn btn-ghost" onClick={() => setCtx({
            runAsUser: 1000, runAsNonRoot: true, allowPrivilegeEscalation: false,
            capabilitiesAdd: [], hostNetwork: false,
          })}>Reset to safe defaults</button>
        </div>
      </div>

      {/* RIGHT: yaml + admission verdict */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: 0 }}>
        <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <strong style={{ fontFamily: 'var(--font-display)' }}>Pod spec submitted</strong>
          <pre className="code-block" style={{ fontSize: '0.74rem', lineHeight: 1.45, margin: 0 }}>{yaml}</pre>
        </div>

        <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <strong style={{ fontFamily: 'var(--font-display)' }}>Admission webhook verdict</strong>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
              attempt #{admitTick + 1}
            </span>
          </div>

          <div className="metrics">
            <div className="metric">
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>standard</span>
              <strong>{STANDARDS[standard].label}</strong>
            </div>
            <div className="metric">
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>violations</span>
              <strong style={{ color: admitted ? '#2a8a3e' : 'var(--accent)' }}>{violations.length}</strong>
            </div>
            <div className="metric">
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>outcome</span>
              <strong style={{ color: admitted ? '#2a8a3e' : 'var(--accent)' }}>
                {admitted ? 'admitted' : 'rejected'}
              </strong>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${standard}-${admitted}-${violations.length}-${admitTick}`}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              style={{
                padding: '0.55rem 0.7rem', border: '2px solid',
                borderColor: admitted ? '#2a8a3e' : 'var(--accent)',
                background: admitted ? '#e8f5e9' : '#fde2e2', borderRadius: 6,
              }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: admitted ? '#2a8a3e' : 'var(--accent)' }}>
                {admitted ? 'ADMITTED' : 'REJECTED'}
              </div>
              {admitted ? (
                <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
                  Pod satisfies the <code>{STANDARDS[standard].label}</code> standard for namespace <code>default</code>.
                </div>
              ) : (
                <ul style={{ margin: '0.35rem 0 0 1rem', padding: 0, fontSize: '0.78rem' }}>
                  {violations.map((v) => (
                    <li key={v.rule}><code>{v.rule}</code>: {v.detail}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ---------- small UI helpers ----------
function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', width: 200 }}>{label}</span>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} className={`btn ${on ? 'btn-accent' : 'btn-ghost'}`}
      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', minWidth: 60 }}>
      {on ? 'true' : 'false'}
    </button>
  );
}

function buildYaml(ctx) {
  const caps = ctx.capabilitiesAdd.length > 0
    ? `\n      capabilities:\n        add: [${ctx.capabilitiesAdd.join(', ')}]` : '';
  return `apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  hostNetwork: ${ctx.hostNetwork}
  containers:
  - name: app
    image: app:1.0
    securityContext:
      runAsUser: ${ctx.runAsUser}
      runAsNonRoot: ${ctx.runAsNonRoot}
      allowPrivilegeEscalation: ${ctx.allowPrivilegeEscalation}${caps}`;
}
