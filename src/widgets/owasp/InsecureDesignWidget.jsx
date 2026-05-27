import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// A04 — Insecure Design.
// Pick a password-reset feature design. Each one runs a small enumeration
// "attack" — the attacker tries to guess / enumerate / replay. Three of
// the four designs are exploitable BY DESIGN: no amount of careful coding
// fixes them, the flow itself leaks. The fourth answers four design
// questions correctly (entropy, expiry, single-use, side-channel) and is
// hard to attack with the same toolkit.

const DESIGNS = {
  question: {
    name: 'Security question = new password',
    blurb: 'Email asks the user a security question. Whoever answers it picks the new password.',
    attackName: 'public-info guessing',
    secure: false,
    verdict: {
      tone: 'bad',
      headline: 'Exploitable BY DESIGN',
      detail:
        'Security answers (mother\'s maiden name, first pet, high school) are public-record or social-media facts. The flow trusts a public secret as the only barrier.',
    },
    // questions correctly handled (none — every column fails)
    answers: { entropy: false, expiry: false, singleUse: false, sideChannel: false },
    // simulated attack trace
    runAttack(seed) {
      const log = [];
      const guesses = ['Smith', 'Johnson', 'Williams', 'Brown'];
      for (let i = 0; i < guesses.length; i++) {
        const ok = i === 2; // 3rd guess "wins"
        log.push({
          t: i + 1,
          text: `attempt #${i + 1}: answer = "${guesses[i]}"`,
          status: ok ? 'ok' : 'err',
          stop: ok,
        });
        if (ok) break;
      }
      return { log, success: true, attempts: log.length, space: '~10^3 plausible answers' };
    },
  },

  sequential: {
    name: 'Sequential reset id (1, 2, 3 ...)',
    blurb: 'Reset link is /reset?id=N where N is an auto-increment. Anyone can iterate.',
    attackName: 'id enumeration',
    secure: false,
    verdict: {
      tone: 'bad',
      headline: 'Exploitable BY DESIGN',
      detail:
        'A predictable, dense id space means an attacker just walks the integers. Other people\'s reset links land in their lap.',
    },
    answers: { entropy: false, expiry: false, singleUse: false, sideChannel: true },
    runAttack(seed) {
      const log = [];
      const valid = 5; // some other user's pending reset
      for (let id = 1; id <= 8; id++) {
        const ok = id === valid;
        log.push({
          t: id,
          text: `GET /reset?id=${id}  →  ${ok ? 'HTTP 200 (valid reset page)' : 'HTTP 404'}`,
          status: ok ? 'ok' : 'err',
          stop: ok,
        });
        if (ok) break;
      }
      return { log, success: true, attempts: log.length, space: '~10^3-10^6 (linear walk)' };
    },
  },

  noExpiry: {
    name: 'Token, but no expiry & multi-use',
    blurb: 'Email link uses a random token, but it never expires and can be replayed.',
    attackName: 'token replay',
    secure: false,
    verdict: {
      tone: 'bad',
      headline: 'Exploitable BY DESIGN',
      detail:
        'A leaked old email, a browser history dump, a forwarded message — any past reset link is a forever-valid skeleton key. Random bytes do not save you here.',
    },
    answers: { entropy: true, expiry: false, singleUse: false, sideChannel: true },
    runAttack(seed) {
      const log = [];
      log.push({ t: 1, text: 'attacker finds 8-month-old reset email in archived inbox', status: 'info' });
      log.push({ t: 2, text: 'GET /reset?token=8f3c…a1  →  HTTP 200 (still valid)', status: 'err' });
      log.push({ t: 3, text: 'POST new password  →  account taken over', status: 'err', stop: true });
      return { log, success: true, attempts: 1, space: 'irrelevant — replay, not guess' };
    },
  },

  secure: {
    name: 'Random 32-byte token, single-use, 15 min',
    blurb: 'Random token, expires fast, burned on first use, generic responses.',
    attackName: 'brute force + replay',
    secure: true,
    verdict: {
      tone: 'good',
      headline: 'Hard to attack',
      detail:
        'High-entropy token (≈ 2^256 space) blocks guessing. 15-minute expiry shrinks the window. Single-use kills replay. Generic responses ("if that email exists, we sent a link") block enumeration side-channels.',
    },
    answers: { entropy: true, expiry: true, singleUse: true, sideChannel: true },
    runAttack(seed) {
      const log = [];
      log.push({ t: 1, text: 'GET /reset?token=0000…00  →  HTTP 404', status: 'err' });
      log.push({ t: 2, text: 'GET /reset?token=0000…01  →  HTTP 404', status: 'err' });
      log.push({ t: 3, text: 'GET /reset?token=0000…02  →  HTTP 404', status: 'err' });
      log.push({ t: 4, text: '…rate limit hit after a few thousand tries', status: 'info' });
      log.push({ t: 5, text: 'expected attempts to land any valid token ≈ 2^255', status: 'info', stop: true });
      return { log, success: false, attempts: Infinity, space: '≈ 2^256 token space' };
    },
  },
};

const DESIGN_QUESTIONS = [
  { key: 'entropy',     label: 'Token entropy',      hint: 'Can an attacker guess a valid token in reasonable time?' },
  { key: 'expiry',      label: 'Expiry window',      hint: 'Does a stolen link stop working after some bounded time?' },
  { key: 'singleUse',   label: 'Single-use',         hint: 'Is a used token burned, so replay fails?' },
  { key: 'sideChannel', label: 'Side-channel safe',  hint: 'Do error / timing responses leak whether an account exists?' },
];

// Animate the attempts log appearing one-by-one so the bar fills visibly.
function useAnimatedTrace(trace, key) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    if (!trace || trace.length === 0) return undefined;
    let cancelled = false;
    let i = 0;
    function tick() {
      if (cancelled) return;
      i += 1;
      setShown(i);
      if (i < trace.length) setTimeout(tick, 360);
    }
    const t = setTimeout(tick, 120);
    return () => { cancelled = true; clearTimeout(t); };
  }, [key]); // re-run when the design changes
  return shown;
}

export default function InsecureDesignWidget() {
  const [designKey, setDesignKey] = useState('question');
  const design = DESIGNS[designKey];

  // Re-run attack whenever the design changes. Memoized so the per-render
  // animation hook gets a stable trace.
  const result = useMemo(() => design.runAttack(designKey), [designKey, design]);
  const shown = useAnimatedTrace(result.log, designKey);

  // Progress bar: for failing-attacker design, the bar stays low.
  const totalSteps = result.log.length;
  const pct = Math.min(100, (shown / Math.max(totalSteps, 1)) * 100);
  const animationDone = shown >= totalSteps;

  const verdictColor =
    design.verdict.tone === 'good' ? '#2a8a3e' : 'var(--accent)';
  const verdictBg =
    design.verdict.tone === 'good' ? '#e7f6e7' : '#fde2e2';

  return (
    <div className="widget">
      <div className="widget-title">A04 — design the password-reset flow</div>
      <div className="widget-hint">
        Pick a design. The attacker runs the same playbook against each one. Three of these flows
        are broken before a single line of code is written — that is what "insecure design" means.
      </div>

      {/* Design picker — radio group as buttons */}
      <div className="controls" role="radiogroup" aria-label="Password reset design">
        {Object.entries(DESIGNS).map(([k, d]) => (
          <button
            key={k}
            role="radio"
            aria-checked={designKey === k}
            className={`btn ${designKey === k ? 'btn-accent' : ''}`}
            onClick={() => setDesignKey(k)}
            style={{ fontSize: '0.85rem' }}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', margin: '0.4rem 0 0.8rem' }}>
        {design.blurb}
      </div>

      {/* Two-column: attack stage left, design-questions side panel right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 280px)',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* LEFT: attack simulator */}
        <div className="widget-stage" style={{ minHeight: 280, padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <span className={`badge ${design.secure ? 'live' : 'err'}`}>
              {design.secure ? 'attacker stalls' : 'attacker wins'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
              simulating: {design.attackName}
            </span>
          </div>

          {/* progress bar — visualizes "how many tries did it take?" */}
          <div
            aria-label="attack progress"
            style={{
              height: 14,
              background: 'var(--paper)',
              border: '1.5px solid var(--ink)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              marginBottom: '0.6rem',
            }}
          >
            <motion.div
              key={designKey}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: design.secure ? '#2a8a3e' : 'var(--accent)',
              }}
            />
          </div>

          {/* attempts log */}
          <div className="log" style={{ maxHeight: 200 }}>
            <AnimatePresence initial={false}>
              {result.log.slice(0, shown).map((e) => (
                <motion.div
                  key={`${designKey}-${e.t}`}
                  className={`entry ${e.status}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <span className="t">[t={e.t}]</span>
                  {e.text}
                </motion.div>
              ))}
            </AnimatePresence>
            {shown === 0 && (
              <div className="entry" style={{ color: 'var(--ink-faint)' }}>
                <span className="t">[t=0]</span>warming up attacker…
              </div>
            )}
          </div>

          {/* summary tiles */}
          <div className="metrics" style={{ marginTop: '0.7rem' }}>
            <div className={`metric ${design.secure ? '' : 'accent'}`}>
              <div className="label">Outcome</div>
              <div className="value" style={{ fontSize: '1.1rem' }}>
                {result.success ? 'TAKEN OVER' : 'BLOCKED'}
              </div>
            </div>
            <div className="metric">
              <div className="label">Attempts</div>
              <div className="value" style={{ fontSize: '1.1rem' }}>
                {result.attempts === Infinity ? '∞ (infeasible)' : result.attempts}
              </div>
            </div>
            <div className="metric">
              <div className="label">Search space</div>
              <div className="value" style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                {result.space}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: design-question scorecard */}
        <div
          style={{
            border: '2px solid var(--ink)',
            borderRadius: 'var(--radius)',
            padding: '0.9rem',
            background: 'var(--paper)',
            boxShadow: '3px 3px 0 var(--ink)',
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            Design questions
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)', marginBottom: '0.6rem' }}>
            A secure flow answers all four. This one:
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {DESIGN_QUESTIONS.map((q) => {
              const ok = design.answers[q.key];
              return (
                <li key={q.key} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      flex: '0 0 22px',
                      height: 22,
                      borderRadius: 4,
                      border: '1.5px solid var(--ink)',
                      background: ok ? '#2a8a3e' : 'var(--accent)',
                      color: 'white',
                      fontFamily: 'var(--font-display)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      lineHeight: 1,
                    }}
                    aria-label={ok ? 'pass' : 'fail'}
                  >
                    {ok ? 'Y' : 'N'}
                  </span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem' }}>{q.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                      {q.hint}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Verdict panel — updates immediately when picker changes */}
      <motion.div
        key={designKey + (animationDone ? '-done' : '-mid')}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="callout"
        style={{
          background: verdictBg,
          borderColor: verdictColor,
          marginTop: '1rem',
        }}
      >
        <strong style={{ color: verdictColor }}>{design.verdict.headline}.</strong>{' '}
        {design.verdict.detail}
        <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
          Lesson: you cannot patch this in the implementation. The flaw is in the flow.
          A code review that only checks "is the SQL parameterized? are inputs escaped?"
          misses every one of the broken designs above.
        </div>
      </motion.div>
    </div>
  );
}
