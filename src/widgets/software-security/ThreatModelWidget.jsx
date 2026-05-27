import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ASSETS = {
  browser: { x: 80,  y: 110, w: 110, h: 60, label: 'Browser',     sub: 'untrusted',   zone: 'edge' },
  cdn:     { x: 250, y: 110, w: 110, h: 60, label: 'CDN',         sub: 'shared',      zone: 'edge' },
  app:     { x: 440, y: 110, w: 110, h: 60, label: 'App Server',  sub: 'trusted',     zone: 'core' },
  db:      { x: 620, y: 110, w: 110, h: 60, label: 'Database',    sub: 'trusted',     zone: 'core' },
};

const ATTACKERS = [
  { id: 'device',    label: 'Owns user device' },
  { id: 'network',   label: 'Snoops the network' },
  { id: 'cdn',       label: 'Compromised CDN' },
  { id: 'insider',   label: 'Insider in datacenter' },
  { id: 'creds',     label: 'Stolen credentials' },
  { id: 'dep',       label: 'Malicious dependency' },
];

const DEFENSES = [
  { id: 'tls',       label: 'TLS in transit' },
  { id: 'validate',  label: 'Input validation at app' },
  { id: 'paramsql',  label: 'Parameterised queries' },
  { id: 'vault',     label: 'Secrets in vault' },
  { id: 'mfa',       label: 'MFA' },
  { id: 'audit',     label: 'Audit logging' },
  { id: 'sandbox',   label: 'Sandbox dependencies' },
];

// Each row: an attack vector that some attacker capability unlocks against
// some asset, plus the set of defenses that fully neutralise it. If any
// listed defense is enabled the vector is considered mitigated.
const VECTORS = [
  { attacker: 'device',  asset: 'browser', vector: 'Read session cookies / keystrokes',     mitigatedBy: [],                weight: 2 },
  { attacker: 'device',  asset: 'app',     vector: 'Replay user session to app',            mitigatedBy: ['mfa'],           weight: 2 },

  { attacker: 'network', asset: 'browser', vector: 'Intercept page + form fields',          mitigatedBy: ['tls'],           weight: 2 },
  { attacker: 'network', asset: 'app',     vector: 'Steal API tokens on the wire',          mitigatedBy: ['tls'],           weight: 2 },

  { attacker: 'cdn',     asset: 'browser', vector: 'Inject script into delivered JS',       mitigatedBy: [],                weight: 3 },
  { attacker: 'cdn',     asset: 'app',     vector: 'Forge requests with stolen edge keys',  mitigatedBy: ['mfa', 'audit'],  weight: 2 },

  { attacker: 'insider', asset: 'db',      vector: 'Direct read of customer rows',          mitigatedBy: ['audit'],         weight: 3 },
  { attacker: 'insider', asset: 'app',     vector: 'Exfiltrate secrets from app host',      mitigatedBy: ['vault'],         weight: 2 },

  { attacker: 'creds',   asset: 'app',     vector: 'Log in as a real user',                 mitigatedBy: ['mfa'],           weight: 3 },
  { attacker: 'creds',   asset: 'db',      vector: 'Query DB via app with stolen role',     mitigatedBy: ['audit', 'mfa'],  weight: 2 },

  { attacker: 'dep',     asset: 'app',     vector: 'Arbitrary code in app process',         mitigatedBy: ['sandbox'],       weight: 3 },
  { attacker: 'dep',     asset: 'db',      vector: 'Smuggle SQL via tainted input',         mitigatedBy: ['validate', 'paramsql'], weight: 2 },
];

const MAX_RAW = VECTORS.reduce((s, v) => s + v.weight, 0);

function computeExposure(attackerSet, defenseSet) {
  const exposed = [];
  let raw = 0;
  for (const v of VECTORS) {
    if (!attackerSet.has(v.attacker)) continue;
    const mitigated = v.mitigatedBy.some((d) => defenseSet.has(d));
    if (!mitigated) {
      exposed.push(v);
      raw += v.weight;
    }
  }
  const score = Math.round((raw / MAX_RAW) * 100) / 10;
  return { exposed, score };
}

function dominantRisk(exposed, attackerSet, defenseSet) {
  if (attackerSet.size === 0) return 'No attacker capabilities selected — pick at least one to see what crosses a trust boundary.';
  if (exposed.length === 0) return 'Every modelled vector for the selected attackers is mitigated. Real systems still face unknown-unknowns — keep auditing.';

  const byAttacker = {};
  for (const v of exposed) byAttacker[v.attacker] = (byAttacker[v.attacker] || 0) + v.weight;
  const worstId = Object.entries(byAttacker).sort((a, b) => b[1] - a[1])[0][0];
  const worstLabel = ATTACKERS.find((a) => a.id === worstId).label.toLowerCase();

  const hints = {
    device:  'Endpoint compromise sidesteps most server-side controls — assume the browser is hostile and bind sessions to a second factor.',
    network: 'Plaintext on the wire is the cheapest attack of all. TLS everywhere is non-negotiable.',
    cdn:     'A compromised CDN is inside your blast radius for any user. Subresource integrity and a strict CSP shrink it.',
    insider: 'Privileged humans bypass perimeter controls. Lean on least privilege, vaulted secrets, and immutable audit logs.',
    creds:   'Passwords leak. MFA turns one stolen secret into not-enough on its own.',
    dep:     'Your dependencies run with your privileges. Sandbox, pin, and review the supply chain.',
  };
  return `Dominant residual risk: ${worstLabel}. ${hints[worstId]}`;
}

function Asset({ a, hot }) {
  return (
    <motion.g animate={hot ? { scale: [1, 1.04, 1] } : { scale: 1 }} transition={{ duration: 0.35 }} style={{ transformOrigin: `${a.x}px ${a.y}px` }}>
      <rect
        x={a.x - a.w / 2} y={a.y - a.h / 2} width={a.w} height={a.h} rx={6}
        fill={hot ? '#fde2e2' : 'var(--paper)'}
        stroke={hot ? 'var(--accent)' : 'var(--ink)'} strokeWidth={2.5}
      />
      <text x={a.x} y={a.y - 4} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{a.label}</text>
      <text x={a.x} y={a.y + 14} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>{a.sub}</text>
    </motion.g>
  );
}

export default function ThreatModelWidget() {
  const [attackers, setAttackers] = useState(() => new Set(['network', 'creds']));
  const [defenses, setDefenses] = useState(() => new Set(['tls']));

  function toggle(set, setter, id) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  }

  function reset() {
    setAttackers(new Set());
    setDefenses(new Set());
  }

  const { exposed, score } = useMemo(() => computeExposure(attackers, defenses), [attackers, defenses]);
  const callout = useMemo(() => dominantRisk(exposed, attackers, defenses), [exposed, attackers, defenses]);
  const hotAssets = useMemo(() => new Set(exposed.map((v) => v.asset)), [exposed]);

  const scoreColor = score >= 6 ? 'var(--accent)' : score >= 3 ? '#c97a1a' : '#2a8a3e';

  return (
    <div className="widget">
      <div className="widget-title">Threat model — what crosses the trust boundary?</div>

      <div className="controls">
        <button className="btn btn-ghost" onClick={reset}>Reset all</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          {attackers.size} attacker {attackers.size === 1 ? 'capability' : 'capabilities'} · {defenses.size} defense{defenses.size === 1 ? '' : 's'}
        </span>
      </div>

      <div className="widget-stage" style={{ minHeight: 240 }}>
        <svg viewBox="0 0 760 230" width="100%" style={{ maxWidth: 760 }}>
          <defs>
            <marker id="tm-arr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--ink-soft)" />
            </marker>
          </defs>

          <rect x={20}  y={40} width={350} height={150} rx={8} fill="none" stroke="var(--ink-soft)" strokeWidth={1.5} strokeDasharray="6 5" />
          <text x={30}  y={58} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>edge / untrusted zone</text>

          <rect x={385} y={40} width={355} height={150} rx={8} fill="none" stroke="var(--ink-soft)" strokeWidth={1.5} strokeDasharray="6 5" />
          <text x={395} y={58} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>core / trusted zone</text>

          <line x1={377} y1={30} x2={377} y2={200} stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 4" />
          <text x={377} y={22} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--accent)', fontWeight: 600 }}>
            TRUST BOUNDARY
          </text>

          <line x1={ASSETS.browser.x + 55} y1={ASSETS.browser.y} x2={ASSETS.cdn.x - 55} y2={ASSETS.cdn.y} stroke="var(--ink-soft)" strokeWidth={1.5} markerEnd="url(#tm-arr)" />
          <line x1={ASSETS.cdn.x + 55}     y1={ASSETS.cdn.y}     x2={ASSETS.app.x - 55} y2={ASSETS.app.y} stroke="var(--ink-soft)" strokeWidth={1.5} markerEnd="url(#tm-arr)" />
          <line x1={ASSETS.app.x + 55}     y1={ASSETS.app.y}     x2={ASSETS.db.x - 55}  y2={ASSETS.db.y}  stroke="var(--ink-soft)" strokeWidth={1.5} markerEnd="url(#tm-arr)" />

          {Object.entries(ASSETS).map(([id, a]) => <Asset key={id} a={a} hot={hotAssets.has(id)} />)}
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
        <div className="field">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.4rem' }}>Attacker capabilities</div>
          <div className="pill-group">
            {ATTACKERS.map((a) => {
              const on = attackers.has(a.id);
              return (
                <button
                  key={a.id}
                  className={`btn ${on ? 'btn-accent' : 'btn-ghost'}`}
                  onClick={() => toggle(attackers, setAttackers, a.id)}
                  style={{ fontSize: '0.8rem' }}
                >
                  {on ? '■' : '□'} {a.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.4rem' }}>Defenses in place</div>
          <div className="pill-group">
            {DEFENSES.map((d) => {
              const on = defenses.has(d.id);
              return (
                <button
                  key={d.id}
                  className={`btn ${on ? 'btn-accent' : 'btn-ghost'}`}
                  onClick={() => toggle(defenses, setDefenses, d.id)}
                  style={{ fontSize: '0.8rem' }}
                >
                  {on ? '■' : '□'} {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="metrics" style={{ marginTop: '0.75rem' }}>
        <div className="metric">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)' }}>RESIDUAL RISK</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: scoreColor }}>{score.toFixed(1)} / 10</div>
        </div>
        <div className="metric">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)' }}>EXPOSED VECTORS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem' }}>{exposed.length}</div>
        </div>
        <div className="metric">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)' }}>ASSETS AT RISK</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem' }}>{hotAssets.size} / 4</div>
        </div>
      </div>

      <div className="log" style={{ marginTop: '0.75rem', maxHeight: 200, overflowY: 'auto' }}>
        <AnimatePresence initial={false}>
          {exposed.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)', padding: '0.4rem' }}
            >
              No exposed surface for the current model.
            </motion.div>
          ) : (
            exposed.map((v) => {
              const assetLabel = ASSETS[v.asset].label;
              const attackerLabel = ATTACKERS.find((a) => a.id === v.attacker).label;
              return (
                <motion.div
                  key={`${v.attacker}-${v.asset}-${v.vector}`}
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.25rem 0.4rem', fontSize: '0.82rem' }}
                >
                  <span className="badge" style={{ minWidth: 90, textAlign: 'center' }}>{assetLabel}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>{attackerLabel}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>{'→'}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{v.vector}</span>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div className="callout" style={{ marginTop: '0.75rem' }}>
        {callout}
      </div>
    </div>
  );
}
