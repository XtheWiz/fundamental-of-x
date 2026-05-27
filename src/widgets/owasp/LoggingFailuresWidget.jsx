import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// OWASP A09 — Security Logging & Monitoring Failures.
//
// Educational sandbox only. Everything below is a pure simulation
// inside this component — no real auth, no real network, no real
// log shipping. The point is to feel the consequence of *not*
// logging: when nothing is recorded, nothing is alerted, and the
// attack only surfaces months later (if ever) from a third party.

// --- Logging configuration toggles ----------------------------------

const TOGGLES = [
  { key: 'auth',      label: 'Log auth events (success + fail)' },
  { key: 'admin',     label: 'Log admin actions' },
  { key: 'sensitive', label: 'Log access to sensitive resources' },
  { key: 'siem',      label: 'Ship logs to centralised SIEM' },
  { key: 'alertFails',label: 'Alert on > 10 failed logins / minute' },
  { key: 'retain',    label: 'Retain logs > 90 days' },
];

const DEFAULT_CFG = {
  auth: false, admin: false, sensitive: false,
  siem: false, alertFails: false, retain: false,
};

// --- Attack scenarios. Each is a list of timed "events". Each event
// declares which log category would have recorded it.

const ATTACKS = {
  stuffing: {
    name: 'Slow credential stuffing (6 weeks)',
    blurb:
      'A botnet tries 4–6 logins per minute against many usernames, ' +
      'spread thinly enough to evade naive rate limits.',
    realTimespan: '6 weeks',
    events: [
      { t: 1,  kind: 'auth-fail', actor: 'bot-37',  detail: 'login fail user=alice',    burst: 12 },
      { t: 2,  kind: 'auth-fail', actor: 'bot-12',  detail: 'login fail user=bob',      burst: 14 },
      { t: 3,  kind: 'auth-fail', actor: 'bot-04',  detail: 'login fail user=carol',    burst: 11 },
      { t: 4,  kind: 'auth-fail', actor: 'bot-22',  detail: 'login fail user=dave',     burst: 13 },
      { t: 5,  kind: 'auth-ok',   actor: 'bot-37',  detail: 'login OK   user=alice (reused pw)' },
      { t: 6,  kind: 'sensitive', actor: 'alice*',  detail: 'GET /account/statements' },
      { t: 7,  kind: 'sensitive', actor: 'alice*',  detail: 'GET /account/cards' },
      { t: 8,  kind: 'auth-ok',   actor: 'bot-22',  detail: 'login OK   user=dave (reused pw)' },
      { t: 9,  kind: 'sensitive', actor: 'dave*',   detail: 'POST /transfers $4,000' },
      { t: 10, kind: 'sensitive', actor: 'dave*',   detail: 'POST /transfers $4,000' },
      { t: 11, kind: 'sensitive', actor: 'alice*',  detail: 'POST /transfers $2,800' },
    ],
    realStory:
      'Two real customer accounts compromised. Money moved. The fraud ' +
      'team finds out 11 weeks later, from a chargeback dispute.',
  },
  insider: {
    name: 'Insider exfiltrating customer records',
    blurb:
      'A logged-in employee opens normal-looking customer pages, then ' +
      'pulls thousands of records via the export endpoint.',
    realTimespan: '3 days',
    events: [
      { t: 1,  kind: 'auth-ok',   actor: 'emp-jordan', detail: 'login OK from office VPN' },
      { t: 2,  kind: 'sensitive', actor: 'emp-jordan', detail: 'GET /customers/441 (normal lookup)' },
      { t: 3,  kind: 'sensitive', actor: 'emp-jordan', detail: 'GET /customers/512 (normal lookup)' },
      { t: 4,  kind: 'sensitive', actor: 'emp-jordan', detail: 'GET /customers/export?limit=500' },
      { t: 5,  kind: 'sensitive', actor: 'emp-jordan', detail: 'GET /customers/export?limit=500&offset=500' },
      { t: 6,  kind: 'sensitive', actor: 'emp-jordan', detail: 'GET /customers/export?limit=500&offset=1000' },
      { t: 7,  kind: 'sensitive', actor: 'emp-jordan', detail: 'GET /customers/export?limit=500&offset=1500' },
      { t: 8,  kind: 'sensitive', actor: 'emp-jordan', detail: 'GET /customers/export?limit=500&offset=2000' },
      { t: 9,  kind: 'sensitive', actor: 'emp-jordan', detail: 'GET /customers/export?limit=500&offset=2500' },
      { t: 10, kind: 'auth-ok',   actor: 'emp-jordan', detail: 'logout' },
    ],
    realStory:
      'Three thousand customer records leave the building inside an HR ' +
      'laptop. The breach surfaces months later when records appear on a forum.',
  },
  privesc: {
    name: 'Privilege escalation to admin',
    blurb:
      'A regular account exploits a missing authz check on the role ' +
      'editor, then grants themself admin and walks through the back office.',
    realTimespan: '40 minutes',
    events: [
      { t: 1, kind: 'auth-ok',   actor: 'user-mallory', detail: 'login OK   user=mallory' },
      { t: 2, kind: 'sensitive', actor: 'user-mallory', detail: 'GET /admin/roles (returns 200 — bug)' },
      { t: 3, kind: 'admin',     actor: 'user-mallory', detail: 'POST /admin/roles {grant: admin, to: mallory}' },
      { t: 4, kind: 'admin',     actor: 'user-mallory', detail: 'GET /admin/users (now permitted)' },
      { t: 5, kind: 'admin',     actor: 'user-mallory', detail: 'POST /admin/feature-flags {killSwitch: on}' },
      { t: 6, kind: 'sensitive', actor: 'user-mallory', detail: 'GET /admin/audit-export' },
      { t: 7, kind: 'admin',     actor: 'user-mallory', detail: 'DELETE /admin/audit (cover tracks)' },
      { t: 8, kind: 'auth-ok',   actor: 'user-mallory', detail: 'logout' },
    ],
    realStory:
      'Mallory owned the back office for 40 minutes and then deleted ' +
      'the audit trail. Anything not shipped off-box is gone.',
  },
};

// --- Pure evaluator. Given a config + attack, decide what gets logged,
// what gets alerted, and how long detection actually took.

function evaluate(cfg, attack) {
  const events = attack.events;

  // Which kinds of events the current logging config will capture.
  const captured = events.map((ev) => {
    if (ev.kind === 'auth-fail' || ev.kind === 'auth-ok') return cfg.auth;
    if (ev.kind === 'admin')                              return cfg.admin;
    if (ev.kind === 'sensitive')                          return cfg.sensitive;
    return false;
  });

  const capturedCount = captured.filter(Boolean).length;
  const coverage = events.length ? capturedCount / events.length : 0;

  // Alert fires only if:
  //  - we're logging auth events, AND
  //  - the alert rule is enabled, AND
  //  - at least one event in this attack is a failed-login burst > 10/min.
  const failBurst = events.find((e) => e.kind === 'auth-fail' && (e.burst ?? 0) > 10);
  const alertFired = !!(cfg.auth && cfg.alertFails && failBurst);

  // Detection model — deliberately blunt and pedagogical:
  //   - alert fired:              "instant"
  //   - shipped to SIEM:          "hours" (SOC eventually spots a pattern)
  //   - local-only logs retained: "weeks" (someone digs them up later)
  //   - logged but rotated out:   "never (logs gone)"
  //   - nothing logged at all:    "never"
  let detection;
  if (alertFired) {
    detection = { tier: 'instant', text: 'instant — alert paged on-call' };
  } else if (capturedCount === 0) {
    detection = { tier: 'never', text: 'never — nothing was logged' };
  } else if (!cfg.retain && !cfg.siem) {
    detection = { tier: 'never', text: 'never — local logs already rotated out' };
  } else if (cfg.siem) {
    detection = { tier: 'hours', text: 'hours — SOC notices in dashboards' };
  } else {
    detection = { tier: 'weeks', text: 'weeks — found post-hoc in retained logs' };
  }

  // Forensic reconstruction is only meaningful if logs still exist.
  const forensicCoverage =
    (cfg.retain || cfg.siem) ? coverage : 0;

  return {
    captured, capturedCount, coverage,
    alertFired, detection,
    forensicCoverage,
  };
}

function formatPct(x) { return `${Math.round(x * 100)}%`; }

function detectionColor(tier) {
  if (tier === 'instant') return '#2a8a3e';
  if (tier === 'hours')   return '#1c6dd0';
  if (tier === 'weeks')   return '#d68a00';
  return 'var(--accent)';
}

// A faux clock that ticks one "second" per event so the user feels the
// timeline progress. Resets whenever the dependencies change.
function useAttackClock(running, total, onDone) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    setT(0);
    let cur = 0;
    const id = setInterval(() => {
      cur += 1;
      setT(cur);
      if (cur >= total) {
        clearInterval(id);
        onDone?.();
      }
    }, 350);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, total]);
  return t;
}

export default function LoggingFailuresWidget() {
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [attackKey, setAttackKey] = useState('stuffing');
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const attack = ATTACKS[attackKey];
  const result = useMemo(() => evaluate(cfg, attack), [cfg, attack]);
  const tickedTo = useAttackClock(running, attack.events.length, () => {
    setRunning(false);
    setDone(true);
  });

  // When the user toggles config or switches attack, re-evaluate by
  // replaying instantly (no animation) — the metrics update live.
  useEffect(() => {
    setDone(true);
    setRunning(false);
  }, [cfg, attackKey]);

  function toggle(k) {
    setCfg((c) => ({ ...c, [k]: !c[k] }));
  }
  function runAttack() {
    setDone(false);
    setRunning(true);
  }
  function reset() {
    setRunning(false);
    setDone(false);
  }

  const shownUpTo = running ? tickedTo : (done ? attack.events.length : 0);

  // Build the log panel: only events the config would capture, up to
  // the current tick.
  const logLines = attack.events
    .map((ev, i) => ({ ev, i, captured: result.captured[i] }))
    .filter((row) => row.i < shownUpTo && row.captured)
    .map((row) => {
      const ev = row.ev;
      const tag =
        ev.kind === 'auth-fail' ? 'AUTH-FAIL' :
        ev.kind === 'auth-ok'   ? 'AUTH-OK'   :
        ev.kind === 'admin'     ? 'ADMIN'     :
        'SENSITIVE';
      return { i: row.i, t: ev.t, tag, actor: ev.actor, detail: ev.detail };
    });

  return (
    <div className="widget">
      <div className="widget-title">A09 — Security Logging &amp; Monitoring Failures</div>
      <div className="widget-hint">
        Toggle what gets logged, pick an attack, press <em>Run attack</em>.
        Watch whether anyone notices — and how much of the story you can reconstruct later.
      </div>

      {/* Attack picker */}
      <div className="controls">
        {Object.entries(ATTACKS).map(([k, v]) => (
          <button
            key={k}
            className={`btn ${attackKey === k ? 'btn-accent' : ''}`}
            onClick={() => { setAttackKey(k); reset(); }}
          >
            {v.name}
          </button>
        ))}
      </div>

      {/* Run / reset */}
      <div className="controls">
        <button className="btn btn-accent" onClick={runAttack} disabled={running}>
          {running ? 'Attack in progress…' : 'Run attack'}
        </button>
        <button className="btn btn-ghost" onClick={reset} disabled={running}>
          Reset
        </button>
        <span style={{
          marginLeft: 'auto', fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem', color: 'var(--ink-soft)',
        }}>
          sim t = {shownUpTo} / {attack.events.length}
          {'  ·  '}
          real-world: {attack.realTimespan}
        </span>
      </div>

      {/* Two-column stage: config + log panel */}
      <div
        className="widget-stage"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)',
          gap: '0.8rem',
          alignItems: 'stretch',
          minHeight: 320,
        }}
      >
        {/* Logging config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
            color: 'var(--ink-soft)',
          }}>
            Logging &amp; monitoring config
          </div>
          <div style={{
            border: '2px solid var(--ink)',
            borderRadius: 'var(--radius)',
            background: 'var(--paper)',
            padding: '0.7rem 0.9rem',
            display: 'flex', flexDirection: 'column', gap: '0.4rem',
          }}>
            {TOGGLES.map((t) => (
              <label key={t.key} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
                color: 'var(--ink)', cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={cfg[t.key]}
                  onChange={() => toggle(t.key)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                />
                <span>{t.label}</span>
              </label>
            ))}
          </div>

          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
            color: 'var(--ink-soft)', lineHeight: 1.5,
          }}>
            <strong>Scenario:</strong> {attack.blurb}
          </div>
        </div>

        {/* Log panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
          }}>
            <span style={{ color: 'var(--ink-soft)' }}>/var/log/app/security.log</span>
            <span
              className="badge"
              style={{
                background: cfg.siem ? '#d6f5d6' : 'var(--paper)',
                marginLeft: 'auto',
              }}
            >
              {cfg.siem ? 'shipped to SIEM' : 'local only'}
            </span>
            <span
              className="badge"
              style={{ background: cfg.retain ? '#d6f5d6' : '#ffe9b3' }}
            >
              {cfg.retain ? '90d retention' : '24h rotate'}
            </span>
          </div>

          <div className="log" style={{ flex: 1, minHeight: 200, maxHeight: 260 }}>
            {logLines.length === 0 && (
              <div className="entry info">
                <span className="t">—</span>
                <span style={{ color: 'var(--ink-faint)' }}>
                  {shownUpTo === 0
                    ? 'No events yet. Press Run attack.'
                    : 'Attack ran. Nothing was logged with the current config.'}
                </span>
              </div>
            )}
            <AnimatePresence initial={false}>
              {logLines.map((ln) => (
                <motion.div
                  key={ln.i}
                  className={`entry ${ln.tag.startsWith('AUTH-FAIL') ? 'err' : 'info'}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <span className="t">t+{ln.t}s</span>
                  <span>
                    <strong>{ln.tag}</strong> {ln.actor} — {ln.detail}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {result.alertFired && shownUpTo > 0 && (
              <motion.div
                className="entry err"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18 }}
                style={{ marginTop: '0.4rem', fontWeight: 700 }}
              >
                <span className="t">ALERT</span>
                <span>failed-login burst &gt; 10/min — paging on-call</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics">
        <div className="metric">
          <div className="label">Time to detection</div>
          <div className="value" style={{
            fontSize: '1rem',
            color: detectionColor(result.detection.tier),
          }}>
            {result.detection.text}
          </div>
        </div>
        <div className={`metric ${result.forensicCoverage < 0.5 ? 'accent' : ''}`}>
          <div className="label">Forensic coverage</div>
          <div className="value">{formatPct(result.forensicCoverage)}</div>
        </div>
        <div className={`metric ${!result.alertFired ? 'accent' : ''}`}>
          <div className="label">Alert fired?</div>
          <div className="value" style={{ fontSize: '1.2rem' }}>
            {result.alertFired ? 'yes' : 'no'}
          </div>
        </div>
        <div className="metric">
          <div className="label">Events captured</div>
          <div className="value" style={{ fontSize: '1.2rem' }}>
            {result.capturedCount} / {attack.events.length}
          </div>
        </div>
      </div>

      <div className="callout">
        <strong>What the post-mortem looks like.</strong>{' '}
        {result.detection.tier === 'instant' && (
          <>The pager went off mid-attack. You stopped it in progress, and the
          retained log gives you a {formatPct(result.forensicCoverage)} reconstruction of what happened.</>
        )}
        {result.detection.tier === 'hours' && (
          <>The SOC eventually noticed the pattern in the SIEM. By then the
          attacker had time to do real work, but you can reconstruct
          {' '}{formatPct(result.forensicCoverage)} of the steps. {attack.realStory}</>
        )}
        {result.detection.tier === 'weeks' && (
          <>Nobody was watching live. The logs sat on the box until someone
          went looking. You can still reconstruct {formatPct(result.forensicCoverage)} of
          the attack — enough for a write-up, too late to prevent harm. {attack.realStory}</>
        )}
        {result.detection.tier === 'never' && (
          <>You will not find out from your own systems.{' '}
          {result.capturedCount === 0
            ? 'Nothing was recorded.'
            : 'The events were logged locally, but the logs rotated out before anyone looked.'}{' '}
          {attack.realStory}</>
        )}
      </div>

      <div className="callout" style={{ borderColor: 'var(--ink)' }}>
        <strong>Why A09 makes every other bug worse.</strong> A logging gap is
        not itself an exploit — it is the reason every other exploit lives
        longer. The defensive recipe is dull: log auth, admin, and access to
        anything sensitive; ship it off-box so the attacker cannot delete it;
        keep it long enough to investigate; and put at least one real alert in
        front of a human. Toggle them off one at a time above and watch the
        detection time collapse from <em>instant</em> to <em>never</em>.
      </div>
    </div>
  );
}
