import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// OWASP A07 — Identification & Authentication Failures
// ----------------------------------------------------
// Three classic auth failures, side by side with their fixes:
//   1) Weak password policy      — short, single-class passwords crack in seconds
//   2) No rate limiting          — brute-force succeeds; lockout makes it useless
//   3) Predictable session IDs   — sequential IDs are guessable; CSPRNG is not
//
// Defensive/educational only — no exploit code, no real credentials.

const TABS = [
  { key: 'password', label: 'Weak password policy' },
  { key: 'ratelimit', label: 'No rate limiting' },
  { key: 'session', label: 'Predictable session ID' },
];

// --- Password strength helpers ---------------------------------------------
// Very rough entropy estimate: log2(pool^length). Educational only — real
// password strength meters use dictionary checks too.
function charPool(pw) {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
  return pool || 1;
}

function entropyBits(pw) {
  if (!pw) return 0;
  return Math.log2(charPool(pw)) * pw.length;
}

function fmtDuration(seconds) {
  if (!isFinite(seconds) || seconds > 1e20) return 'heat death of the universe';
  if (seconds < 1e-3) return 'instant';
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} h`;
  if (seconds < 3.15e7) return `${(seconds / 86400).toFixed(1)} days`;
  if (seconds < 3.15e10) return `${(seconds / 3.15e7).toFixed(1)} years`;
  if (seconds < 3.15e13) return `${(seconds / 3.15e7).toExponential(1)} years`;
  return `${(seconds / 3.15e7).toExponential(1)} years`;
}

function crackTime(pw, guessesPerSec = 1e10) {
  // 1e10 guesses/sec = a single modern GPU on a fast hash like MD5/SHA1.
  const bits = entropyBits(pw);
  const guesses = Math.pow(2, bits) / 2; // expected ~half the space
  return guesses / guessesPerSec;
}

function strengthLabel(bits) {
  if (bits < 28) return { label: 'very weak', color: 'var(--accent)' };
  if (bits < 40) return { label: 'weak', color: '#cc7a00' };
  if (bits < 60) return { label: 'okay', color: '#b58900' };
  if (bits < 80) return { label: 'strong', color: '#2a8a3e' };
  return { label: 'very strong', color: '#1c6dd0' };
}

const CRACK_TABLE = [
  { example: '123456',          bits: 19.9 },
  { example: 'password',         bits: 37.6 },
  { example: 'Summer2024',       bits: 59.5 },
  { example: 'Tr0ub4dor&3',      bits: 71.4 },
  { example: 'correct horse battery staple', bits: 132 },
];

// --- Sub-widgets -----------------------------------------------------------

function PasswordTab() {
  const [pw, setPw] = useState('hunter2');
  const [strict, setStrict] = useState(false);

  let bits = entropyBits(pw);
  const classes = (/[a-z]/.test(pw) ? 1 : 0) + (/[A-Z]/.test(pw) ? 1 : 0) +
                  (/[0-9]/.test(pw) ? 1 : 0) + (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);
  const meetsStrict = pw.length >= 12 && classes >= 3;

  // Strict mode imposes a minimum entropy floor in our visualization:
  // even before the user types, the policy filters out junk.
  const effectiveBits = strict && !meetsStrict ? 0 : bits;
  const secs = crackTime(pw);
  const verdictBits = strict && !meetsStrict ? 0 : bits;
  const lbl = strengthLabel(verdictBits);

  const verdictText = strict
    ? meetsStrict
      ? `Accepted by policy. ~${bits.toFixed(0)} bits of entropy. Cracks in ${fmtDuration(secs)}.`
      : 'Rejected by policy: needs >= 12 chars AND 3+ char classes.'
    : bits === 0
      ? 'No password entered.'
      : `~${bits.toFixed(0)} bits of entropy. Cracks in ${fmtDuration(secs)} on one GPU.`;

  return (
    <div>
      <div className="controls">
        <label htmlFor="pw-input">Try a password:</label>
        <input
          id="pw-input"
          className="field"
          type="text"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          style={{ minWidth: 220, fontFamily: 'var(--font-mono)' }}
        />
        <label style={{ marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} />
          <span>Enforce: min 12 chars + 3 char classes</span>
        </label>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">length</div>
          <div className="value">{pw.length}</div>
        </div>
        <div className="metric">
          <div className="label">char classes</div>
          <div className="value">{classes} / 4</div>
        </div>
        <div className="metric">
          <div className="label">entropy bits</div>
          <div className="value">{effectiveBits.toFixed(0)}</div>
        </div>
        <div className="metric accent">
          <div className="label">crack time</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>{fmtDuration(secs)}</div>
        </div>
      </div>

      <div className="widget-stage" style={{ minHeight: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="badge" style={{ background: lbl.color, color: 'white', borderColor: lbl.color }}>
            {lbl.label}
          </span>
          <div style={{ flex: 1, height: 14, background: 'var(--paper)', border: '1.5px solid var(--ink)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${Math.min(100, verdictBits)}%` }}
              transition={{ duration: 0.25 }}
              style={{ height: '100%', background: lbl.color }}
            />
          </div>
        </div>
      </div>

      <details style={{ marginTop: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
        <summary style={{ cursor: 'pointer', color: 'var(--ink-soft)' }}>Reference: crack times (1 GPU, fast hash)</summary>
        <table style={{ marginTop: '0.5rem', borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--ink-soft)' }}>
              <th style={{ padding: '0.3rem 0.5rem' }}>example</th>
              <th style={{ padding: '0.3rem 0.5rem' }}>bits</th>
              <th style={{ padding: '0.3rem 0.5rem' }}>time</th>
            </tr>
          </thead>
          <tbody>
            {CRACK_TABLE.map((r) => (
              <tr key={r.example} style={{ borderTop: '1px solid var(--ink-faint)' }}>
                <td style={{ padding: '0.3rem 0.5rem' }}>{r.example}</td>
                <td style={{ padding: '0.3rem 0.5rem' }}>{r.bits.toFixed(0)}</td>
                <td style={{ padding: '0.3rem 0.5rem' }}>{fmtDuration(Math.pow(2, r.bits) / 2 / 1e10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <div className="callout">
        <strong>Verdict.</strong> {verdictText}
      </div>
    </div>
  );
}

// --- Rate limiting tab -----------------------------------------------------

const RATES = [
  { key: 10, label: '10 / sec' },
  { key: 100, label: '100 / sec' },
  { key: 1000, label: '1000 / sec' },
];

function RateLimitTab() {
  const [rate, setRate] = useState(100);
  const [mode, setMode] = useState('bad'); // bad | good
  const [running, setRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [outcome, setOutcome] = useState(null); // 'pwned' | 'locked' | null
  const timer = useRef(null);

  // The "real" attack space we simulate: 10,000 common passwords.
  const PASSWORD_SPACE = 10000;
  const HIT_AT = 4321; // where the BAD path "guesses right"
  const LOCK_AT = 5;   // where the GOOD path locks the account

  function stop() {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setRunning(false);
  }

  function reset() {
    stop();
    setAttempts(0);
    setOutcome(null);
  }

  useEffect(() => {
    if (!running) return undefined;
    // Tick at most every 50ms; advance counter by (rate / 20) per tick
    // so the visible counter changes feel proportional to the chosen rate.
    const tickMs = 50;
    const inc = Math.max(1, Math.round(rate / 20));
    timer.current = setInterval(() => {
      setAttempts((a) => {
        const next = a + inc;
        if (mode === 'good' && next >= LOCK_AT) {
          setOutcome('locked');
          setRunning(false);
          if (timer.current) { clearInterval(timer.current); timer.current = null; }
          return LOCK_AT;
        }
        if (mode === 'bad' && next >= HIT_AT) {
          setOutcome('pwned');
          setRunning(false);
          if (timer.current) { clearInterval(timer.current); timer.current = null; }
          return HIT_AT;
        }
        return next;
      });
    }, tickMs);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [running, rate, mode]);

  // Stop any running simulation when the user flips mode or rate.
  useEffect(() => { reset(); /* eslint-disable-line */ }, [mode]);

  const elapsedSec = attempts / rate;
  const verdict =
    outcome === 'pwned'
      ? `BAD path: logged in as the victim after ${attempts.toLocaleString()} attempts (${elapsedSec.toFixed(1)}s at ${rate}/s). No alarm, no lockout.`
      : outcome === 'locked'
        ? `GOOD path: account locked after ${LOCK_AT} failed attempts. "Locked, please wait 15 min." Attacker gets nothing.`
        : running
          ? `Hammering login: ${attempts.toLocaleString()} attempts so far (${elapsedSec.toFixed(1)}s).`
          : 'Idle. Pick a rate and start the simulator.';

  return (
    <div>
      <div className="controls">
        <label>Mode:</label>
        <div className="pill-group" role="radiogroup" aria-label="rate-limit mode">
          {['bad', 'good'].map((m) => (
            <span key={m}>
              <input
                type="radio"
                name="rl-mode"
                id={`rl-${m}`}
                checked={mode === m}
                onChange={() => setMode(m)}
              />
              <label htmlFor={`rl-${m}`}>{m === 'bad' ? 'BAD: no limit' : 'GOOD: lockout after 5'}</label>
            </span>
          ))}
        </div>
      </div>

      <div className="controls">
        <label>Attempt rate:</label>
        {RATES.map((r) => (
          <button
            key={r.key}
            className={`btn ${rate === r.key ? 'btn-accent' : ''}`}
            onClick={() => { setRate(r.key); reset(); }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="controls">
        <button className="btn btn-accent" onClick={() => { reset(); setRunning(true); }} disabled={running}>
          Start brute force
        </button>
        <button className="btn" onClick={stop} disabled={!running}>Pause</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">attempts</div>
          <div className="value">{attempts.toLocaleString()}</div>
        </div>
        <div className="metric">
          <div className="label">elapsed</div>
          <div className="value">{elapsedSec.toFixed(1)}s</div>
        </div>
        <div className="metric">
          <div className="label">space tried</div>
          <div className="value">{Math.min(100, (attempts / PASSWORD_SPACE) * 100).toFixed(1)}%</div>
        </div>
        <div className={`metric ${outcome === 'pwned' ? 'accent' : ''}`}>
          <div className="label">status</div>
          <div className="value" style={{ fontSize: '1rem' }}>
            {outcome === 'pwned' ? 'PWNED' : outcome === 'locked' ? 'LOCKED' : running ? 'RUNNING' : 'idle'}
          </div>
        </div>
      </div>

      <div className="widget-stage" style={{ minHeight: 70, padding: '0.8rem 1rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
          {mode === 'bad'
            ? 'BAD server: every POST /login just checks the password and replies. No cooldown, no lockout.'
            : 'GOOD server: counts failures per account. After 5 failures: 15-minute lockout + alert.'}
        </div>
        <AnimatePresence mode="wait">
          {outcome === 'pwned' && (
            <motion.div
              key="pwn"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="badge err"
            >
              200 OK — Welcome back, victim
            </motion.div>
          )}
          {outcome === 'locked' && (
            <motion.div
              key="lock"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="badge warn"
            >
              423 Locked — try again in 15 min
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="callout">
        <strong>Verdict.</strong> {verdict}
      </div>
    </div>
  );
}

// --- Session ID tab --------------------------------------------------------

function genGoodId() {
  // 32 random bytes -> 64 hex chars. Crypto-quality if available.
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function SessionTab() {
  const [mode, setMode] = useState('bad');
  const [badStart] = useState(1001);
  const badIds = Array.from({ length: 3 }, (_, i) => `sess_${badStart + i}`);
  const [goodIds, setGoodIds] = useState(() => Array.from({ length: 3 }, () => genGoodId()));

  // Guessing simulator state
  const [guesses, setGuesses] = useState(0);
  const [hit, setHit] = useState(false);
  const [log, setLog] = useState([]);

  function regen() {
    setGoodIds(Array.from({ length: 3 }, () => genGoodId()));
  }

  function tryGuess() {
    if (hit) return;
    const nextGuess = guesses + 1;
    setGuesses(nextGuess);
    if (mode === 'bad') {
      // The attacker's guesses: sess_1004, sess_1005, ... — first one (sess_1004) is wrong,
      // sess_1005 happens to be a live session ID belonging to the next-logged-in user.
      const guessId = `sess_${badStart + 2 + nextGuess}`;
      const success = nextGuess === 2;
      setLog((l) => [
        { id: nextGuess, guess: guessId, hit: success },
        ...l,
      ].slice(0, 6));
      if (success) setHit(true);
    } else {
      const guessId = genGoodId();
      setLog((l) => [
        { id: nextGuess, guess: guessId.slice(0, 16) + '...', hit: false },
        ...l,
      ].slice(0, 6));
      // We never set hit=true in good mode — the joke is the search space.
    }
  }

  function reset() {
    setGuesses(0);
    setHit(false);
    setLog([]);
  }

  useEffect(() => { reset(); /* eslint-disable-line */ }, [mode]);

  const verdict =
    mode === 'bad'
      ? hit
        ? `Hit on attempt ${guesses}. The attacker now holds a valid session for another user. No password needed.`
        : guesses === 0
          ? 'BAD mode: session IDs are sequential. The attacker only needs to guess +1 or +2.'
          : `Guessing... ${guesses} attempt(s).`
      : guesses === 0
        ? 'GOOD mode: 32-byte CSPRNG IDs. Search space ~2^256. Brute force is infeasible.'
        : `${guesses} random guess(es). Expected attempts to land one: ~2^255 (more than atoms in the observable universe).`;

  return (
    <div>
      <div className="controls">
        <label>Mode:</label>
        <div className="pill-group" role="radiogroup" aria-label="session-id mode">
          {['bad', 'good'].map((m) => (
            <span key={m}>
              <input
                type="radio"
                name="sess-mode"
                id={`sess-${m}`}
                checked={mode === m}
                onChange={() => setMode(m)}
              />
              <label htmlFor={`sess-${m}`}>{m === 'bad' ? 'BAD: sequential' : 'GOOD: CSPRNG'}</label>
            </span>
          ))}
        </div>
        {mode === 'good' && (
          <button className="btn btn-ghost" onClick={regen}>Regenerate sample IDs</button>
        )}
      </div>

      <div className="widget-stage" style={{ minHeight: 110 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
          Sample session IDs issued by the server:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {(mode === 'bad' ? badIds : goodIds).map((id) => (
            <code key={id} className="cell" style={{ display: 'block', textAlign: 'left', wordBreak: 'break-all' }}>
              {id}
            </code>
          ))}
        </div>
      </div>

      <div className="controls">
        <button className="btn btn-accent" onClick={tryGuess} disabled={hit}>
          Attacker guesses next ID
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset attacker</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          {guesses} guess(es)
        </span>
      </div>

      {log.length > 0 && (
        <div className="log" role="log" aria-live="polite">
          {log.map((e) => (
            <div key={e.id} className={`entry ${e.hit ? 'err' : 'info'}`}>
              <span className="t">guess #{e.id}</span>
              {e.guess} {e.hit ? '-> HIT (valid session!)' : '-> miss'}
            </div>
          ))}
        </div>
      )}

      <div className="callout">
        <strong>Verdict.</strong> {verdict}
      </div>
    </div>
  );
}

// --- Top-level widget ------------------------------------------------------

export default function AuthFailuresWidget() {
  const [tab, setTab] = useState('password');

  return (
    <div className="widget">
      <div className="widget-title">A07 — Identification & Authentication Failures</div>
      <div className="widget-hint">
        Three classic failures, side by side with their fixes. Defensive demo only — no real
        credentials are touched.
      </div>

      <div className="controls" role="tablist" aria-label="failure scenarios">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`btn ${tab === t.key ? 'btn-accent' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'password' && <PasswordTab />}
      {tab === 'ratelimit' && <RateLimitTab />}
      {tab === 'session' && <SessionTab />}
    </div>
  );
}
