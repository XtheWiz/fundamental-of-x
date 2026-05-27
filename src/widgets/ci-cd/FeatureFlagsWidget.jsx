import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// Feature flags decouple deploy from release. Code for every variant ships
// in the same binary. The flag config — checked at request time — decides
// what each user sees. Flip the flag, change the world, no redeploy.

const FLAGS = [
  { id: 'new_checkout',        label: 'new_checkout',        blurb: 'One-page checkout',         onLabel: 'One-page checkout',    offLabel: 'Classic 3-step checkout' },
  { id: 'beta_dashboard',      label: 'beta_dashboard',      blurb: 'Redesigned dashboard',      onLabel: 'New dashboard (beta)', offLabel: 'Original dashboard' },
  { id: 'experimental_search', label: 'experimental_search', blurb: 'Vector-search results',     onLabel: 'Vector search',        offLabel: 'Keyword search' },
];

const USERS = [
  { id: 'u1', email: 'amy@acme.com',       country: 'US', role: 'external' },
  { id: 'u2', email: 'ben@example.org',    country: 'US', role: 'external' },
  { id: 'u3', email: 'cara@internal.co',   country: 'DE', role: 'internal' },
  { id: 'u4', email: 'dan@acme.com',       country: 'FR', role: 'external' },
  { id: 'u5', email: 'eve@internal.co',    country: 'US', role: 'internal' },
  { id: 'u6', email: 'finn@example.org',   country: 'JP', role: 'external' },
];

const RULES = [
  { id: 'everyone', label: 'everyone' },
  { id: 'domain',   label: 'by email domain' },
  { id: 'internal', label: 'internal users only' },
  { id: 'country',  label: 'by country' },
];

const DOMAIN_OPTIONS = ['acme.com', 'internal.co', 'example.org'];
const COUNTRY_OPTIONS = ['US', 'DE', 'FR', 'JP'];

const INITIAL_CONFIG = {
  new_checkout:        { mode: 'percent', percent: 50, rule: 'everyone',  domain: 'acme.com',   country: 'US', kill: false },
  beta_dashboard:      { mode: 'on',      percent: 100, rule: 'internal', domain: 'internal.co', country: 'US', kill: false },
  experimental_search: { mode: 'off',     percent: 0,  rule: 'country',   domain: 'acme.com',   country: 'DE', kill: false },
};

// Deterministic 0..99 bucket per (flag, user) — stable across slider moves.
// fnv-1a-ish hash on a short string keeps the dependency surface tiny.
function bucket(flagId, userId) {
  const s = `${flagId}::${userId}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h % 100;
}

// Targeting predicate — does this user match the flag's rule?
function matchesRule(cfg, user) {
  switch (cfg.rule) {
    case 'everyone': return true;
    case 'domain':   return user.email.endsWith('@' + cfg.domain);
    case 'internal': return user.role === 'internal';
    case 'country':  return user.country === cfg.country;
    default:         return false;
  }
}

// Final ON/OFF for a user × flag — kill switch wins, then mode + rule.
function evaluate(flagId, cfg, user) {
  if (cfg.kill) return false;
  if (cfg.mode === 'off') return false;
  if (!matchesRule(cfg, user)) return false;
  if (cfg.mode === 'on') return true;
  return bucket(flagId, user.id) < cfg.percent;
}

// Estimated population share — at-rule users count, then the % thins them.
function estimatedShare(flagId, cfg, users) {
  if (cfg.kill || cfg.mode === 'off') return 0;
  const eligible = users.filter((u) => matchesRule(cfg, u)).length;
  const eligibleShare = eligible / users.length;
  const pct = cfg.mode === 'on' ? 1 : cfg.percent / 100;
  return eligibleShare * pct;
}

function FlagRow({ flag, cfg, onChange }) {
  const set = (patch) => onChange({ ...cfg, ...patch });
  return (
    <div
      style={{
        border: '2px solid var(--ink)',
        borderRadius: 'var(--radius)',
        padding: '0.6rem 0.7rem',
        background: cfg.kill ? '#fde2e2' : 'var(--paper)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.4rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 600 }}>{flag.label}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>{flag.blurb}</div>
        </div>
        <button
          className="btn btn-ghost"
          style={{ fontSize: '0.78rem', padding: '0.2em 0.6em', border: '1.5px solid var(--accent)', color: cfg.kill ? 'white' : 'var(--accent)', background: cfg.kill ? 'var(--accent)' : 'transparent', boxShadow: 'none' }}
          onClick={() => set({ kill: !cfg.kill })}
          title="Disable instantly, overriding all rules"
        >
          {cfg.kill ? 'kill: ON' : 'kill switch'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
        {['off', 'percent', 'on'].map((m) => (
          <button
            key={m}
            className={`btn ${cfg.mode === m ? 'btn-accent' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.25em 0.7em' }}
            onClick={() => set({ mode: m })}
            disabled={cfg.kill}
          >
            {m === 'percent' ? '% rollout' : m}
          </button>
        ))}
      </div>

      {cfg.mode === 'percent' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="range"
            min={0}
            max={100}
            value={cfg.percent}
            onChange={(e) => set({ percent: Number(e.target.value) })}
            disabled={cfg.kill}
            style={{ flex: 1 }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', minWidth: '3ch', textAlign: 'right' }}>
            {cfg.percent}%
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>target</label>
        <select
          className="field"
          style={{ fontSize: '0.78rem', padding: '0.2em 0.4em' }}
          value={cfg.rule}
          onChange={(e) => set({ rule: e.target.value })}
          disabled={cfg.kill}
        >
          {RULES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        {cfg.rule === 'domain' && (
          <select className="field" style={{ fontSize: '0.78rem', padding: '0.2em 0.4em' }}
            value={cfg.domain} onChange={(e) => set({ domain: e.target.value })} disabled={cfg.kill}>
            {DOMAIN_OPTIONS.map((d) => <option key={d} value={d}>@{d}</option>)}
          </select>
        )}
        {cfg.rule === 'country' && (
          <select className="field" style={{ fontSize: '0.78rem', padding: '0.2em 0.4em' }}
            value={cfg.country} onChange={(e) => set({ country: e.target.value })} disabled={cfg.kill}>
            {COUNTRY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

function RolloutBar({ share }) {
  const pct = Math.round(share * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 14, border: '1.5px solid var(--ink)', borderRadius: 3, background: 'var(--paper-deep)', overflow: 'hidden', position: 'relative' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 240, damping: 28 }}
          style={{ height: '100%', background: 'var(--accent)' }}
        />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', minWidth: '6ch', textAlign: 'right' }}>
        ~{pct}% in
      </span>
    </div>
  );
}

function AppView({ user, activeFlags }) {
  if (!user) {
    return (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--ink-soft)', textAlign: 'center', padding: '1.2rem 0' }}>
        Click a user to preview the app they see.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
        viewing as <strong style={{ color: 'var(--ink)' }}>{user.email}</strong>
      </div>
      <div style={{ border: '1.5px dashed var(--ink-faint)', borderRadius: 'var(--radius)', padding: '0.6rem 0.7rem', background: 'var(--paper)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {FLAGS.map((f) => {
          const on = activeFlags[f.id];
          return (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)', minWidth: '11ch' }}>
                {f.label}
              </span>
              <motion.span
                key={`${f.id}-${on ? 'on' : 'off'}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                style={{
                  flex: 1,
                  padding: '0.3em 0.55em',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  border: '1.5px solid var(--ink)',
                  borderRadius: 3,
                  background: on ? '#d9ead3' : 'var(--paper-deep)',
                  color: on ? 'var(--ink)' : 'var(--ink-soft)',
                }}
              >
                {on ? f.onLabel : f.offLabel}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FeatureFlagsWidget() {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [selectedUserId, setSelectedUserId] = useState('u1');

  const selectedUser = USERS.find((u) => u.id === selectedUserId) || null;

  // Per-user per-flag evaluation — pure derived state.
  const evaluation = useMemo(() => {
    const out = {};
    USERS.forEach((u) => {
      out[u.id] = {};
      FLAGS.forEach((f) => { out[u.id][f.id] = evaluate(f.id, config[f.id], u); });
    });
    return out;
  }, [config]);

  const totalsByFlag = useMemo(() => {
    const out = {};
    FLAGS.forEach((f) => {
      const inCount = USERS.filter((u) => evaluation[u.id][f.id]).length;
      out[f.id] = { inCount, outCount: USERS.length - inCount };
    });
    return out;
  }, [evaluation]);

  function updateFlag(flagId, next) {
    setConfig((c) => ({ ...c, [flagId]: next }));
  }
  function reset() { setConfig(INITIAL_CONFIG); }

  const activeForSelected = selectedUser ? evaluation[selectedUser.id] : {};

  return (
    <div className="widget">
      <div className="widget-title">Feature flags — decouple deploy from release</div>
      <div className="widget-hint">
        The code for every variant has already shipped. Change the flag table on the left and watch which UI
        the user on the right actually sees. No redeploy needed.
      </div>

      <div className="controls">
        <button className="btn btn-ghost" onClick={reset}>Reset config</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.82rem' }}>
          {USERS.length} sample users · {FLAGS.length} flags
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1.1fr) minmax(220px, 0.9fr) minmax(240px, 1fr)', gap: '0.7rem', alignItems: 'stretch' }}>
        {/* ── Flag config column ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', letterSpacing: '0.04em' }}>
            Flag config
          </div>
          {FLAGS.map((f) => (
            <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <FlagRow flag={f} cfg={config[f.id]} onChange={(next) => updateFlag(f.id, next)} />
              <RolloutBar share={estimatedShare(f.id, config[f.id], USERS)} />
            </div>
          ))}
        </div>

        {/* ── Sample-user list ───────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', letterSpacing: '0.04em' }}>
            Sample users
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {USERS.map((u) => {
              const on = selectedUserId === u.id;
              const onCount = FLAGS.filter((f) => evaluation[u.id][f.id]).length;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: on ? 'var(--paper-deep)' : 'var(--paper)',
                    border: `${on ? 2.5 : 1.5}px solid ${on ? 'var(--accent)' : 'var(--ink)'}`,
                    borderRadius: 'var(--radius)',
                    padding: '0.45rem 0.55rem',
                    boxShadow: on ? '3px 3px 0 var(--ink)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{u.email}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-soft)' }}>
                      {u.country} · {u.role}
                    </div>
                  </div>
                  <span className="badge" style={{ background: onCount > 0 ? '#d9ead3' : 'var(--paper)' }}>
                    {onCount}/{FLAGS.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── App view + per-flag metrics ────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', letterSpacing: '0.04em' }}>
            App view
          </div>
          <div className="widget-stage" style={{ minHeight: 0, margin: 0, padding: '0.7rem' }}>
            <AppView user={selectedUser} activeFlags={activeForSelected} />
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', letterSpacing: '0.04em', marginTop: '0.2rem' }}>
            A/B split (this cohort)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {FLAGS.map((f) => {
              const { inCount, outCount } = totalsByFlag[f.id];
              const inPct = (inCount / USERS.length) * 100;
              return (
                <div key={f.id} style={{ border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', padding: '0.4rem 0.55rem', background: 'var(--paper)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>
                    <span>{f.label}</span>
                    <span style={{ color: 'var(--ink-soft)' }}>
                      <strong style={{ color: 'var(--ink)' }}>{inCount}</strong> on · {outCount} off
                    </span>
                  </div>
                  <div style={{ height: 10, marginTop: 4, border: '1.5px solid var(--ink)', borderRadius: 2, display: 'flex', overflow: 'hidden', background: 'var(--paper-deep)' }}>
                    <motion.div animate={{ width: `${inPct}%` }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                      style={{ background: '#d9ead3' }} />
                    <div style={{ flex: 1, background: 'var(--paper-deep)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="callout">
        {selectedUser ? (
          <>
            <strong>{selectedUser.email}</strong> currently sees{' '}
            <strong>{FLAGS.filter((f) => activeForSelected[f.id]).length}</strong> of {FLAGS.length} flags ON.
            Notice that the bundle never changes — only the flag config did. Move a slider, switch a rule, or
            hit a kill switch: deploy stays put, release happens right here.
          </>
        ) : (
          <>
            <strong>Pick a user.</strong> Flags are evaluated per request: same code path,
            different answers depending on who is asking.
          </>
        )}
      </div>
    </div>
  );
}
