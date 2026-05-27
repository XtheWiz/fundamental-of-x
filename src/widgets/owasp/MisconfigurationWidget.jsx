import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// OWASP A05 — Security Misconfiguration.
//
// The pedagogical move: defaults bite. We render a mock server config as
// a list of toggles, and live-render the resulting attack surface, a
// severity score, and a BAD vs GOOD code snippet. Hardening flips every
// toggle off; the callout shows what production-grade defaults look like.
//
// Defensive/educational only — no live exploit code, no fetches, no
// network calls. Everything below is a pure-React simulation.

const SETTINGS = [
  {
    key: 'debug',
    label: 'DEBUG = true in production',
    sub: 'framework debug mode left on',
    weight: 2,
    attack: 'DEBUG: error pages leak secrets, env vars, and source paths.',
    bad: `# settings.py\nDEBUG = True\nALLOWED_HOSTS = ['*']`,
    good: `# settings.py\nDEBUG = False\nALLOWED_HOSTS = ['yourapp.com']`,
  },
  {
    key: 'admin',
    label: 'Admin panel exposed at /admin (no auth)',
    sub: 'unauthenticated administrative UI on the public host',
    weight: 3,
    attack: 'Admin panel: anyone hitting /admin gets full control — no login required.',
    bad: `app.use('/admin', adminRouter); // no auth middleware`,
    good: `app.use('/admin',\n  requireAuth, requireRole('admin'),\n  ipAllowlist(INTERNAL_CIDRS),\n  adminRouter)`,
  },
  {
    key: 'creds',
    label: 'Default credentials admin / admin',
    sub: 'vendor or seed defaults never rotated',
    weight: 3,
    attack: 'Default creds: brute force succeeds in 1 try (admin/admin).',
    bad: `# initial_seed.sql\nINSERT INTO users (u, p)\nVALUES ('admin', 'admin');`,
    good: `# generated at install, written to a sealed secret\nadmin_password = secrets.token_urlsafe(32)\nrequire_rotation_on_first_login()`,
  },
  {
    key: 'listing',
    label: 'Directory listing enabled',
    sub: 'static file server indexes folders',
    weight: 1,
    attack: 'Directory listing: backups, .env, .git/ files become enumerable.',
    bad: `# nginx.conf\nlocation / {\n  autoindex on;\n}`,
    good: `# nginx.conf\nlocation / {\n  autoindex off;\n}\nlocation ~ /\\.(git|env) { deny all; }`,
  },
  {
    key: 'cors',
    label: 'CORS: Access-Control-Allow-Origin: *',
    sub: 'wildcard origin with credentials',
    weight: 2,
    attack: 'CORS *: any origin can read responses with the user\'s session.',
    bad: `app.use(cors({\n  origin: '*',\n  credentials: true,\n}))`,
    good: `app.use(cors({\n  origin: ['https://yourapp.com'],\n  credentials: true,\n}))`,
  },
  {
    key: 'headers',
    label: 'Missing security headers (HSTS, CSP, X-Frame-Options)',
    sub: 'no transport, content, or framing protections',
    weight: 2,
    attack: 'No HSTS / CSP / X-Frame-Options: downgrade, XSS, and clickjacking are wide open.',
    bad: `// no helmet, no header middleware`,
    good: `app.use(helmet({\n  hsts: { maxAge: 31536000, includeSubDomains: true },\n  contentSecurityPolicy: { directives: {\n    defaultSrc: [\"'self'\"],\n  }},\n  frameguard: { action: 'deny' },\n}))`,
  },
  {
    key: 'errors',
    label: 'Verbose error pages with stack traces',
    sub: 'unfiltered exceptions returned to the client',
    weight: 2,
    attack: 'Verbose errors: stack traces reveal framework, library versions, and file paths.',
    bad: `app.use((err, req, res, next) => {\n  res.status(500).send(err.stack);\n})`,
    good: `app.use((err, req, res, next) => {\n  logger.error(err);\n  res.status(500).json({ error: 'internal' });\n})`,
  },
];

const MAX_SCORE = SETTINGS.reduce((s, x) => s + x.weight, 0); // 15

function severityLabel(score) {
  if (score === 0) return { text: 'HARDENED', tone: '#2a8a3e' };
  if (score <= 4) return { text: 'LOW', tone: '#1c6dd0' };
  if (score <= 8) return { text: 'MEDIUM', tone: '#d39200' };
  if (score <= 12) return { text: 'HIGH', tone: 'var(--accent)' };
  return { text: 'CRITICAL', tone: 'var(--accent)' };
}

function ScoreBar({ score }) {
  const pct = Math.round((score / MAX_SCORE) * 100);
  const sev = severityLabel(score);
  return (
    <div style={{ margin: '0.6rem 0 0.4rem' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)',
      }}>
        <span>Severity (0 – {MAX_SCORE})</span>
        <span style={{ color: sev.tone, fontWeight: 700 }}>{score} / {MAX_SCORE} — {sev.text}</span>
      </div>
      <div style={{
        height: 14, marginTop: 4, border: '1.5px solid var(--ink)', borderRadius: 4,
        background: 'var(--paper-deep)', overflow: 'hidden',
      }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{ height: '100%', background: sev.tone }}
        />
      </div>
    </div>
  );
}

function ToggleRow({ s, on, onChange }) {
  return (
    <label
      htmlFor={`mc-${s.key}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr auto',
        gap: '0.7rem',
        alignItems: 'center',
        padding: '0.55rem 0.7rem',
        border: '1.5px solid var(--ink)',
        borderRadius: 'var(--radius)',
        background: on ? '#fde2e2' : 'var(--paper)',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
    >
      <input
        id={`mc-${s.key}`}
        type="checkbox"
        checked={on}
        onChange={(e) => onChange(s.key, e.target.checked)}
        style={{ width: 20, height: 20, accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>{s.label}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
          {s.sub}
        </div>
      </div>
      <span className={`badge ${on ? 'err' : ''}`} style={{ marginRight: 0 }}>
        {on ? `+${s.weight}` : 'off'}
      </span>
    </label>
  );
}

function CodeCompare({ setting }) {
  if (!setting) {
    return (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
        Pick a misconfiguration to see the BAD vs GOOD config side by side.
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
          color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 4,
        }}>
          BAD — DEFAULT
        </div>
        <pre className="code-block" style={{ margin: 0, borderColor: 'var(--accent)' }}>
          {setting.bad}
        </pre>
      </div>
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
          color: '#2a8a3e', letterSpacing: '0.1em', marginBottom: 4,
        }}>
          GOOD — HARDENED
        </div>
        <pre className="code-block" style={{ margin: 0, borderColor: '#2a8a3e' }}>
          {setting.good}
        </pre>
      </div>
    </div>
  );
}

const ALL_ON = Object.fromEntries(SETTINGS.map((s) => [s.key, true]));
const ALL_OFF = Object.fromEntries(SETTINGS.map((s) => [s.key, false]));

export default function MisconfigurationWidget() {
  const [enabled, setEnabled] = useState(ALL_ON);
  const [focused, setFocused] = useState(SETTINGS[0].key);

  const score = useMemo(
    () => SETTINGS.reduce((sum, s) => sum + (enabled[s.key] ? s.weight : 0), 0),
    [enabled],
  );
  const activeAttacks = useMemo(
    () => SETTINGS.filter((s) => enabled[s.key]),
    [enabled],
  );
  const focusedSetting = SETTINGS.find((s) => s.key === focused);
  const hardened = score === 0;

  function toggle(key, val) {
    setEnabled((prev) => ({ ...prev, [key]: val }));
    setFocused(key);
  }
  function applyHardening() { setEnabled(ALL_OFF); }
  function resetToDefaults() { setEnabled(ALL_ON); }

  return (
    <div className="widget">
      <div className="widget-title">Security misconfiguration — defaults bite</div>
      <div className="widget-hint">
        Toggle each common misconfiguration. Watch the attack surface, severity score, and
        offending snippet update live. Then press <strong>Apply hardening</strong> to see what
        production-grade defaults look like.
      </div>

      <div className="controls">
        <button className="btn btn-accent" onClick={applyHardening} disabled={hardened}>
          Apply hardening
        </button>
        <button className="btn btn-ghost" onClick={resetToDefaults}>
          Reset to insecure defaults
        </button>
        <span style={{
          marginLeft: 'auto', fontFamily: 'var(--font-mono)',
          color: 'var(--ink-soft)', fontSize: '0.85rem',
        }}>
          {activeAttacks.length} / {SETTINGS.length} misconfigurations active
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: '1rem',
        alignItems: 'start',
      }}>
        {/* Left — the mock server config */}
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '0.9rem',
            letterSpacing: '0.06em', marginBottom: '0.4rem',
          }}>
            server.config
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {SETTINGS.map((s) => (
              <div key={s.key} onClick={() => setFocused(s.key)}>
                <ToggleRow s={s} on={!!enabled[s.key]} onChange={toggle} />
              </div>
            ))}
          </div>
        </div>

        {/* Right — live attack-surface panel */}
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '0.9rem',
            letterSpacing: '0.06em', marginBottom: '0.4rem',
          }}>
            attack surface
          </div>

          <ScoreBar score={score} />

          <div
            className="widget-stage"
            style={{ minHeight: 180, padding: '0.7rem 0.9rem', margin: '0.6rem 0' }}
          >
            <AnimatePresence mode="popLayout">
              {activeAttacks.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
                    color: '#2a8a3e', padding: '0.5rem 0',
                  }}
                >
                  No active misconfigurations. Attack surface is empty.
                </motion.div>
              ) : (
                <ul style={{
                  listStyle: 'none', margin: 0, padding: 0,
                  display: 'flex', flexDirection: 'column', gap: '0.35rem',
                }}>
                  {activeAttacks.map((s) => (
                    <motion.li
                      key={s.key}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.22 }}
                      onClick={() => setFocused(s.key)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                        fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
                        cursor: 'pointer',
                        padding: '0.3rem 0.4rem',
                        background: focused === s.key ? 'var(--paper)' : 'transparent',
                        border: focused === s.key ? '1.5px solid var(--ink)' : '1.5px solid transparent',
                        borderRadius: 4,
                      }}
                    >
                      <span className="badge err" style={{ marginRight: 0, flexShrink: 0 }}>
                        +{s.weight}
                      </span>
                      <span>{s.attack}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '0.9rem',
          letterSpacing: '0.06em', marginBottom: '0.4rem',
        }}>
          before / after — {focusedSetting ? focusedSetting.label : '—'}
        </div>
        <CodeCompare setting={focusedSetting} />
      </div>

      {hardened ? (
        <div className="callout" style={{ marginTop: '1.2rem' }}>
          <strong>Hardened.</strong> Production-grade defaults look like this:
          <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem',
            fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
            <li>DEBUG off; generic 500 page; structured logs server-side.</li>
            <li>Admin surfaces gated by auth, role, and an IP allowlist (or VPN-only).</li>
            <li>No default credentials — secrets generated per-install, rotated on first login.</li>
            <li>Directory listing off; dotfiles and backups denied at the web tier.</li>
            <li>CORS restricted to an explicit origin allowlist.</li>
            <li>HSTS, CSP, and X-Frame-Options sent on every response (helmet / equivalent).</li>
            <li>Automated config drift checks in CI so this never regresses.</li>
          </ul>
        </div>
      ) : (
        <div className="callout" style={{ marginTop: '1.2rem' }}>
          <strong>Why this matters.</strong> Each toggle is a real default that ships enabled
          somewhere. None of them are bugs in the code — they are bugs in the configuration.
          A05 is consistently in the OWASP Top 10 precisely because hardening is a checklist
          that is easy to skip and hard to notice missing.
        </div>
      )}
    </div>
  );
}
