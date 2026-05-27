import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Tabletop exercise: a suspicious admin login just succeeded.
// Each node = an action. Picking one applies a metric delta (minutes,
// rows leaked, customers affected, downtime, reputation cost) and either
// branches further or terminates with a postmortem.
//
// Textbook IR order: DETECT -> CONTAIN -> ERADICATE -> RECOVER -> REVIEW.
// The "good" path mirrors that; bad paths skip or reorder steps.

const TREE = {
  root: {
    phase: 'detect',
    prompt:
      'A suspicious login from a new IP to your admin user just succeeded. ' +
      'It is 02:47. The session is still active. What is your first action?',
    options: [
      { id: 'investigate', label: 'Investigate the login (audit log, geolocate IP, look for follow-on actions)',
        textbook: true, delta: { minutes: 8 }, next: 'afterInvestigate' },
      { id: 'rotate', label: 'Rotate the admin credentials immediately',
        delta: { minutes: 4 }, next: 'afterRotate' },
      { id: 'unplug', label: 'Pull the network plug on the admin host',
        delta: { minutes: 2, downtimeMin: 45, rep: 1 }, next: 'afterUnplug' },
      { id: 'notify', label: 'Notify customers immediately that there is a breach',
        delta: { minutes: 1, rep: 3, customers: 50000 }, next: 'afterNotify' },
    ],
  },

  // INVESTIGATE branch (textbook detect -> contain)
  afterInvestigate: {
    phase: 'contain',
    prompt:
      'Audit log shows the attacker enumerated the customers table and ran one SELECT * LIMIT 1000. ' +
      'Session is live. Containment time.',
    options: [
      { id: 'revoke', label: 'Revoke the active session token and disable the admin account',
        textbook: true, delta: { minutes: 6, rowsLeaked: 1000, rep: 1 }, next: 'afterRevoke' },
      { id: 'watch', label: 'Keep watching to gather more forensic data before acting',
        delta: { minutes: 25, rowsLeaked: 18000, rep: 2 }, next: 'afterWatch' },
      { id: 'rebootAll', label: 'Reboot every server in the fleet to be safe',
        delta: { minutes: 12, rowsLeaked: 1000, downtimeMin: 30, rep: 1 }, next: 'afterRebootAll' },
    ],
  },
  afterRevoke: {
    phase: 'eradicate',
    prompt: 'Session killed, attacker locked out. Entry vector found: a leaked personal access token in a public gist. Now eradicate.',
    options: [
      { id: 'rotateAll', label: 'Rotate ALL admin tokens, audit for other leaked secrets, force MFA',
        textbook: true, delta: { minutes: 35 },
        outcome: { tone: 'good', headline: 'Clean recovery. Small blast radius. Textbook path.',
          postmortem:
            'You followed detect -> contain -> eradicate. ~1000 rows touched, no downtime, low reputation cost. ' +
            'Review should drive: secret scanning on public repos, short-lived tokens, mandatory MFA for admins.' } },
      { id: 'justOne', label: 'Rotate only the one leaked token and move on',
        delta: { minutes: 10, rowsLeaked: 4000, rep: 1 },
        outcome: { tone: 'mixed', headline: 'Contained the live attacker, but missed siblings of the leaked secret.',
          postmortem:
            'A second leaked token surfaces 11 days later and is used before you notice. ' +
            'Eradication must be complete: when one secret leaks, treat the whole class as compromised.' } },
    ],
  },
  afterWatch: {
    phase: 'contain',
    prompt: '25 minutes of "more forensic data" later, the attacker paginated through ~18,000 rows and tried to pivot to the billing service.',
    options: [
      { id: 'revokeNow', label: 'Finally revoke the session and disable the account',
        delta: { minutes: 4, rep: 1, customers: 18000 },
        outcome: { tone: 'bad', headline: 'Large blast radius. Watching is not containing.',
          postmortem:
            'Detect was correct, but containment was delayed. Textbook order is detect -> CONTAIN -> eradicate -> recover -> review. ' +
            'Forensics continues AFTER bleeding stops. ~18,000 customer rows leaked, mandatory breach notification.' } },
      { id: 'sniffMore', label: 'Keep sniffing - the attacker might reveal C2 infrastructure',
        delta: { minutes: 40, rowsLeaked: 120000, rep: 3, customers: 120000 },
        outcome: { tone: 'bad', headline: 'Catastrophic leak. The whole customer table is out.',
          postmortem:
            'You optimised intel over containment. Press cycle, regulator letter, and SLA-breach class action follow. ' +
            'Rule of thumb: protect users first, study the attacker second.' } },
    ],
  },
  afterRebootAll: {
    phase: 'eradicate',
    prompt: 'The whole fleet bounced. Attacker session is gone, but so are ~30 minutes of customer traffic. Now what?',
    options: [
      { id: 'rotateAll2', label: 'Rotate all secrets, audit, force MFA',
        delta: { minutes: 25, rep: 1 },
        outcome: { tone: 'mixed', headline: 'Eradicated, but downtime hurt more than the breach itself.',
          postmortem:
            'Killing the one session would have been enough. Reboot-everything is the sledgehammer - works but costs uptime and trust. ' +
            'Containment should be proportional to the threat.' } },
    ],
  },

  // ROTATE branch (skipped detect; partial containment)
  afterRotate: {
    phase: 'contain',
    prompt: 'Credentials rotated. But the attacker had an active session token, which does not expire on password change. They are still in.',
    options: [
      { id: 'killSession', label: 'Revoke active sessions too, then investigate',
        delta: { minutes: 7, rowsLeaked: 2500, rep: 1 },
        outcome: { tone: 'mixed', headline: 'Recovered, but lost ~5 minutes of free attacker time.',
          postmortem:
            'Rotating credentials does not log out an existing session. You skipped DETECT and only partly contained - ' +
            'the right reflex is investigate, then revoke sessions AND credentials in one move. ~2500 rows leaked.' } },
      { id: 'assumeFixed', label: 'Assume the rotation fixed it and go back to bed',
        delta: { minutes: 360, rowsLeaked: 80000, rep: 3, customers: 80000 },
        outcome: { tone: 'bad', headline: 'Major breach. You handed the attacker 6 unmonitored hours.',
          postmortem:
            'No detect, no containment confirmation, no eradication. Sessions outlive passwords; tokens outlive sessions. ' +
            'Always verify the bleeding actually stopped.' } },
      { id: 'investigateLate', label: 'Now investigate what the attacker did',
        delta: { minutes: 15, rowsLeaked: 8000, rep: 2, customers: 8000 },
        outcome: { tone: 'bad', headline: 'Detection happened, but too late. ~8000 rows out the door.',
          postmortem: 'Order matters: DETECT first so you know what you are containing. Acting blind means you contain the wrong thing.' } },
    ],
  },

  // UNPLUG branch (jumped to heavy containment, big collateral)
  afterUnplug: {
    phase: 'contain',
    prompt: 'Host is dark. Attacker session is dead, but so are admin tools, monitoring, and 45 minutes of admin-side automation. What next?',
    options: [
      { id: 'forensic', label: 'Forensic image the disk, investigate offline, then rebuild',
        delta: { minutes: 90, downtimeMin: 90, rep: 1 },
        outcome: { tone: 'mixed', headline: 'Tiny data loss, but long downtime and clumsy execution.',
          postmortem:
            'Pulling the plug is a valid contain step, but going straight to it skips DETECT - you did not yet know the threat justified the downtime. ' +
            'Session-revoke first would have given the same containment at 1% of the cost.' } },
      { id: 'restoreFast', label: "Restore the host from last night's backup and bring it back online",
        delta: { minutes: 30, downtimeMin: 60, rep: 2 },
        outcome: { tone: 'bad', headline: 'Persistence survived. The same backdoor is back online.',
          postmortem:
            'You jumped from CONTAIN to RECOVER, skipping ERADICATE. If the attacker planted persistence (cron, SSH key, web shell), it is in the backup too. ' +
            'Eradicate the root cause before recovering, and confirm with a clean image.' } },
    ],
  },

  // NOTIFY branch (skipped detect/contain/eradicate; jumped to comms)
  afterNotify: {
    phase: 'recover',
    prompt:
      'You sent a breach email to 50,000 customers in 3 minutes - before knowing what (if anything) actually leaked. The attacker is still logged in.',
    options: [
      { id: 'nowInvestigate', label: 'Belatedly investigate and contain',
        delta: { minutes: 20, rowsLeaked: 6000, rep: 3, customers: 50000 },
        outcome: { tone: 'bad', headline: 'Self-inflicted PR crisis on top of a real (smaller) breach.',
          postmortem:
            'Public notification is the LAST phase, after review. You front-ran your own investigation: ' +
            'customers are panicking about a leak that turned out to be ~6000 rows, while the attacker kept working during your announcement. ' +
            'Contain first, communicate with facts later.' } },
      { id: 'doubleDown', label: 'Hold a press conference describing the breach in detail',
        delta: { minutes: 60, rowsLeaked: 40000, rep: 3, customers: 50000 },
        outcome: { tone: 'bad', headline: 'You told the attacker exactly what you know - and gave them an hour.',
          postmortem:
            'Talking publicly during an active incident, before containment, is the worst possible step ordering. ' +
            'You leaked your detection capability AND let the attacker keep working. ' +
            'Textbook order is detect -> contain -> eradicate -> recover -> REVIEW (which includes external comms).' } },
    ],
  },
};

const INITIAL = { minutes: 0, rowsLeaked: 0, customers: 0, downtimeMin: 0, rep: 0 };
const REP_LABEL = ['none', 'low', 'medium', 'high'];

function applyDelta(m, d) {
  return {
    minutes: m.minutes + (d.minutes || 0),
    rowsLeaked: m.rowsLeaked + (d.rowsLeaked || 0),
    customers: m.customers + (d.customers || 0),
    downtimeMin: m.downtimeMin + (d.downtimeMin || 0),
    rep: Math.max(m.rep, d.rep || 0),
  };
}

function formatTime(min) {
  if (min === 0) return '0 min';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r === 0 ? `${h} h` : `${h} h ${r} m`;
}

const PHASES = [
  { id: 'detect', label: 'Detect' },
  { id: 'contain', label: 'Contain' },
  { id: 'eradicate', label: 'Eradicate' },
  { id: 'recover', label: 'Recover' },
  { id: 'review', label: 'Review' },
];

const MONO_SOFT = { fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' };

function PhaseStrip({ activePhase }) {
  return (
    <div className="pill-group" aria-label="IR phase" style={{ marginBottom: '0.5rem' }}>
      {PHASES.map((p, i) => {
        const on = p.id === activePhase;
        return (
          <span key={p.id} className="badge" style={{
            padding: '0.2rem 0.55rem',
            background: on ? 'var(--accent)' : 'var(--paper-deep)',
            color: on ? 'white' : 'var(--ink-soft)',
            fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {i + 1}. {p.label}
          </span>
        );
      })}
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="metric">
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: color || undefined }}>{value}</div>
    </div>
  );
}

function LogRow({ entry, isFirst }) {
  const isAlert = entry.kind === 'alert';
  const isOutcome = entry.kind === 'outcome';
  const badgeBg = isOutcome ? 'var(--accent)' : isAlert ? '#c97a1a' : 'var(--paper-deep)';
  const badgeFg = isOutcome || isAlert ? 'white' : 'var(--ink-soft)';
  const badgeText = isAlert ? 'ALERT' : entry.phase;
  return (
    <motion.div layout initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
      style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', padding: '0.2rem 0.3rem',
        borderTop: isFirst ? 'none' : '1px dashed var(--paper-deep)' }}>
      <span style={{ ...MONO_SOFT, minWidth: '3.4em', textAlign: 'right' }}>T+{entry.t}m</span>
      <span className="badge" style={{
        fontSize: '0.62rem', padding: '0 0.35rem', background: badgeBg, color: badgeFg,
        letterSpacing: '0.05em', textTransform: 'uppercase', minWidth: '4.6em', textAlign: 'center',
      }}>{badgeText}</span>
      <span style={{ lineHeight: 1.3 }}>{entry.text}</span>
    </motion.div>
  );
}

export default function IncidentResponseWidget() {
  const [nodeId, setNodeId] = useState('root');
  const [metrics, setMetrics] = useState(INITIAL);
  const [outcome, setOutcome] = useState(null);
  const [steps, setSteps] = useState(0);
  const [tookTextbookFirst, setTookTextbookFirst] = useState(null);
  const [log, setLog] = useState([
    { t: 0, kind: 'alert', text: 'ALERT: admin login from unknown IP succeeded.' },
  ]);

  const node = TREE[nodeId];

  function pick(opt) {
    const m2 = applyDelta(metrics, opt.delta || {});
    const phase = node.phase;
    if (steps === 0) setTookTextbookFirst(!!opt.textbook);
    setMetrics(m2);
    setSteps((s) => s + 1);
    setLog((l) => {
      const next = [...l, { t: m2.minutes, kind: opt.outcome ? 'leaf' : 'action', phase, text: opt.label }];
      if (opt.outcome) next.push({ t: m2.minutes, kind: 'outcome', phase: 'review', text: opt.outcome.headline });
      return next;
    });
    if (opt.outcome) setOutcome(opt.outcome);
    else setNodeId(opt.next);
  }

  function reset() {
    setNodeId('root');
    setMetrics(INITIAL);
    setOutcome(null);
    setSteps(0);
    setTookTextbookFirst(null);
    setLog([{ t: 0, kind: 'alert', text: 'ALERT: admin login from unknown IP succeeded.' }]);
  }

  const repColor = useMemo(() => {
    if (metrics.rep >= 3) return 'var(--accent)';
    if (metrics.rep >= 2) return '#c97a1a';
    if (metrics.rep >= 1) return '#b58a16';
    return '#2a8a3e';
  }, [metrics.rep]);

  const activePhase = outcome ? 'review' : node?.phase;
  const toneColor = outcome
    ? outcome.tone === 'good' ? '#2a8a3e' : outcome.tone === 'mixed' ? '#c97a1a' : 'var(--accent)'
    : null;

  return (
    <div className="widget">
      <div className="widget-title">Incident response - order matters</div>

      <div className="controls">
        <button className="btn btn-ghost" onClick={reset}>Reset and try a different path</button>
        <span style={{ marginLeft: 'auto', ...MONO_SOFT, fontSize: '0.85rem' }}>
          {outcome ? 'incident closed' : `step ${steps + 1}`}
          {tookTextbookFirst === true && ' . textbook start'}
          {tookTextbookFirst === false && ' . off-playbook start'}
        </span>
      </div>

      <PhaseStrip activePhase={activePhase} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1rem' }}>
        <div className="widget-stage" style={{ minHeight: 240, padding: '1rem' }}>
          <AnimatePresence mode="wait">
            {!outcome ? (
              <motion.div key={nodeId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                <div className="field" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem',
                  lineHeight: 1.45, marginBottom: '0.8rem' }}>
                  {node.prompt}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {node.options.map((opt) => (
                    <button key={opt.id} className="btn btn-ghost" onClick={() => pick(opt)}
                      style={{ textAlign: 'left', justifyContent: 'flex-start', whiteSpace: 'normal',
                        lineHeight: 1.35, padding: '0.55rem 0.7rem', fontSize: '0.88rem' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="outcome" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                  letterSpacing: '0.08em', color: toneColor, marginBottom: '0.3rem' }}>
                  INCIDENT CLOSED . {outcome.tone.toUpperCase()} OUTCOME
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem',
                  lineHeight: 1.35, marginBottom: '0.6rem' }}>
                  {outcome.headline}
                </div>
                <div style={{ ...MONO_SOFT, fontSize: '0.82rem', lineHeight: 1.5 }}>
                  {outcome.postmortem}
                </div>
                <div style={{ marginTop: '0.8rem' }}>
                  <button className="btn btn-accent" onClick={reset}>Reset and try a different path</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="log" style={{ maxHeight: 320, overflowY: 'auto', padding: '0.5rem',
          fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }} aria-label="Incident timeline">
          <div style={{ ...MONO_SOFT, fontSize: '0.7rem', letterSpacing: '0.05em', padding: '0.2rem 0.3rem 0.4rem' }}>
            TIMELINE
          </div>
          <AnimatePresence initial={false}>
            {log.map((entry, idx) => <LogRow key={idx} entry={entry} isFirst={idx === 0} />)}
          </AnimatePresence>
        </div>
      </div>

      <div className="metrics" style={{ marginTop: '0.75rem' }}>
        <Metric label="TIME TO CONTAIN" value={formatTime(metrics.minutes)} />
        <Metric label="ROWS LEAKED" value={metrics.rowsLeaked.toLocaleString()} />
        <Metric label="CUSTOMERS AFFECTED" value={metrics.customers.toLocaleString()} />
        <Metric label="DOWNTIME" value={metrics.downtimeMin === 0 ? 'none' : formatTime(metrics.downtimeMin)} />
        <Metric label="REPUTATION COST" value={REP_LABEL[metrics.rep]} color={repColor} />
      </div>

      <div className="callout" style={{ marginTop: '0.75rem' }}>
        <strong>Playbook.</strong> The textbook IR order is{' '}
        <span style={{ fontFamily: 'var(--font-mono)' }}>detect -&gt; contain -&gt; eradicate -&gt; recover -&gt; review</span>.
        Each phase exists because skipping it makes the next one harder: containing without detecting means you contain the wrong thing; recovering without eradicating restores the backdoor along with the service; communicating without reviewing turns a small incident into a public one.
      </div>
    </div>
  );
}
