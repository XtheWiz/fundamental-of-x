import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// OWASP A01 — Broken Access Control.
//
// Educational sandbox only. The "API" here is a pure function that
// inspects a session and a requested user id; flipping BAD/GOOD just
// swaps which version of the handler runs. No real network, no real
// data — the entire "exploit" lives in this component.
//
// The point: IDOR (Insecure Direct Object Reference) lives or dies on
// a single authz line. BAD: the handler returns whatever record the
// URL points at. GOOD: the handler rejects requests where the session
// user does not own the requested resource.

const USERS = {
  1: { id: 1, name: 'Alice',   role: 'customer' },
  2: { id: 2, name: 'Bob',     role: 'customer' },
  3: { id: 3, name: 'Mallory', role: 'customer' },
};

const INVOICES = {
  1: [
    { id: 'INV-1001', amount: 480.00, note: 'Q1 retainer' },
    { id: 'INV-1002', amount: 120.50, note: 'support hours' },
  ],
  2: [
    { id: 'INV-2044', amount: 39.99,  note: 'monthly plan' },
  ],
  3: [
    { id: 'INV-3010', amount: 2400.0, note: 'pen-test report' },
    { id: 'INV-3011', amount: 75.00,  note: 'travel reimburse' },
  ],
};

// --- The two API handlers, side by side. The code shown in the UI is
// literally these implementations stringified for the learner to read.

const BAD_CODE = `app.get('/api/users/:id/invoices', (req, res) => {
  const id = Number(req.params.id);
  const target = users[id];
  if (!target) return res.status(404).json({ error: 'not found' });
  // No authorisation check. Anyone with a session
  // can read anyone's invoices by editing the URL.
  return res.json({ user: target.name, invoices: invoices[id] });
});`;

const GOOD_CODE = `app.get('/api/users/:id/invoices', (req, res) => {
  const id = Number(req.params.id);
  const target = users[id];
  if (!target) return res.status(404).json({ error: 'not found' });
  // One-line authorisation check — the whole fix.
  if (req.session.userId !== id) {
    return res.status(403).json({ error: 'forbidden' });
  }
  return res.json({ user: target.name, invoices: invoices[id] });
});`;

function handleRequest({ mode, sessionUserId, requestedId }) {
  const target = USERS[requestedId];
  if (!target) {
    return {
      status: 404,
      body: { error: 'not found' },
      verdict: 'not-found',
    };
  }
  if (mode === 'good' && sessionUserId !== requestedId) {
    return {
      status: 403,
      body: { error: 'forbidden' },
      verdict: 'forbidden',
    };
  }
  return {
    status: 200,
    body: { user: target.name, invoices: INVOICES[requestedId] ?? [] },
    verdict: sessionUserId === requestedId ? 'self' : 'leak',
  };
}

function caption({ mode, sessionUserId, requestedId, verdict }) {
  const me = USERS[sessionUserId]?.name ?? `user#${sessionUserId}`;
  const target = USERS[requestedId]?.name ?? `user#${requestedId}`;
  if (verdict === 'not-found') {
    return `404 — no user with id=${requestedId}. (Returning 404 here is itself a small information leak; some apps return 403 instead.)`;
  }
  if (verdict === 'forbidden') {
    return `GOOD: 403 Forbidden — authz check rejected ${me}'s attempt to read ${target}'s invoices.`;
  }
  if (verdict === 'self') {
    return `OK — ${me} is reading their own invoices. Both BAD and GOOD allow this.`;
  }
  // leak
  if (mode === 'bad') {
    return `BAD: ${me} just read ${target}'s invoices. The handler never checked who was logged in.`;
  }
  return '';
}

function statusColor(status) {
  if (status === 200) return '#2a8a3e';
  if (status === 403) return 'var(--accent)';
  return 'var(--ink-soft)';
}

function parseId(raw) {
  // Accept the full URL or just a number. Pull the first integer that
  // sits between /users/ and /invoices, or fall back to any integer.
  const m = String(raw).match(/\/users\/(\d+)\//);
  if (m) return Number(m[1]);
  const n = String(raw).match(/\d+/);
  return n ? Number(n[0]) : NaN;
}

function buildUrl(id) {
  return `/api/users/${id}/invoices`;
}

export default function BrokenAccessControlWidget() {
  const [mode, setMode] = useState('bad');             // 'bad' | 'good'
  const [sessionUserId, setSessionUserId] = useState(3); // Mallory by default — the most fun
  const [url, setUrl] = useState(buildUrl(1));         // ...poking at Alice
  const [history, setHistory] = useState([]);

  const requestedId = useMemo(() => parseId(url), [url]);
  const valid = Number.isFinite(requestedId);

  const response = useMemo(() => {
    if (!valid) {
      return { status: 400, body: { error: 'malformed url' }, verdict: 'bad-url' };
    }
    return handleRequest({ mode, sessionUserId, requestedId });
  }, [mode, sessionUserId, requestedId, valid]);

  const cap = valid
    ? caption({ mode, sessionUserId, requestedId, verdict: response.verdict })
    : 'Type an id like /api/users/2/invoices.';

  function pickSession(id) {
    setSessionUserId(id);
    pushHistory(`session → ${USERS[id].name}`);
  }
  function setMode_(m) {
    setMode(m);
    pushHistory(`mode → ${m.toUpperCase()}`);
  }
  function onUrlChange(e) {
    setUrl(e.target.value);
  }
  function quickJump(id) {
    setUrl(buildUrl(id));
  }
  function pushHistory(line) {
    setHistory((h) => [{ t: new Date().toLocaleTimeString().slice(0, 8), line }, ...h].slice(0, 6));
  }

  const me = USERS[sessionUserId];
  const isSelf = requestedId === sessionUserId;
  const code = mode === 'bad' ? BAD_CODE : GOOD_CODE;
  const responseText = JSON.stringify(response.body, null, 2);

  const leakedCount =
    response.verdict === 'leak' && Array.isArray(response.body.invoices)
      ? response.body.invoices.length
      : 0;

  return (
    <div className="widget">
      <div className="widget-title">A01 — Broken Access Control (IDOR sandbox)</div>

      <div className="controls">
        <button
          className={`btn ${mode === 'bad' ? 'btn-accent' : ''}`}
          onClick={() => setMode_('bad')}
        >
          BAD — no authz check
        </button>
        <button
          className={`btn ${mode === 'good' ? 'btn-accent' : ''}`}
          onClick={() => setMode_('good')}
        >
          GOOD — owner check
        </button>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--ink-soft)',
          }}
        >
          in-browser sandbox — no real network
        </span>
      </div>

      <div className="controls pill-group" role="radiogroup" aria-label="Logged in as">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', alignSelf: 'center' }}>
          Logged in as:
        </span>
        {Object.values(USERS).map((u) => (
          <span key={u.id}>
            <input type="radio" id={`sess-${u.id}`} name="sess"
              checked={sessionUserId === u.id} onChange={() => pickSession(u.id)} />
            <label htmlFor={`sess-${u.id}`}>{u.name} (id={u.id})</label>
          </span>
        ))}
      </div>

      <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <label htmlFor="bac-url"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
          Address bar — edit the id and watch the response change:
        </label>
        <input id="bac-url" type="text" value={url} onChange={onUrlChange} spellCheck={false}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', padding: '0.5rem 0.7rem',
            border: '2px solid var(--ink)', borderRadius: 4, background: 'var(--paper)' }} />
        <div className="controls" style={{ gap: '0.3rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
            jump to:
          </span>
          {Object.values(USERS).map((u) => (
            <button key={u.id} className="btn btn-ghost" onClick={() => quickJump(u.id)}>
              /users/{u.id}/invoices
            </button>
          ))}
        </div>
      </div>

      <div className="widget-stage"
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '0.8rem', alignItems: 'stretch' }}>
        {/* Live response */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--ink-soft)' }}>GET</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</span>
            <span className="badge" style={{ background: statusColor(response.status),
              color: 'white', padding: '0.1rem 0.5rem', borderRadius: 4, fontWeight: 700 }}>
              {response.status}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.pre
              key={`${mode}-${sessionUserId}-${requestedId}-${response.status}`}
              className="code-block"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              style={{ margin: 0, minHeight: 140,
                borderLeft: `4px solid ${statusColor(response.status)}`,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {responseText}
            </motion.pre>
          </AnimatePresence>

          <div className="callout" style={{ borderColor:
              response.verdict === 'leak' ? 'var(--accent)'
              : response.verdict === 'forbidden' ? '#2a8a3e' : undefined }}>
            {cap}
          </div>
        </div>

        {/* Code for current branch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
            color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            handler running now:
            <span className="badge" style={{ background: mode === 'bad' ? 'var(--accent)' : '#2a8a3e',
              color: 'white', padding: '0.1rem 0.5rem', borderRadius: 4, fontWeight: 700 }}>
              {mode.toUpperCase()}
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.pre key={mode} className="code-block"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              style={{ margin: 0, minHeight: 220, whiteSpace: 'pre', overflow: 'auto' }}>
              {code}
            </motion.pre>
          </AnimatePresence>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">Session user</div>
          <div className="value" style={{ fontSize: '0.95rem' }}>
            {me.name} (id={me.id})
          </div>
        </div>
        <div className="metric">
          <div className="label">Requested id</div>
          <div className="value" style={{ fontSize: '0.95rem' }}>
            {valid ? requestedId : '—'}
          </div>
        </div>
        <div className="metric">
          <div className="label">Self-access?</div>
          <div className="value" style={{ fontSize: '0.95rem' }}>
            {valid ? (isSelf ? 'yes' : 'no — cross-user') : '—'}
          </div>
        </div>
        <div className={`metric ${response.verdict === 'leak' ? 'accent' : ''}`}>
          <div className="label">Records leaked</div>
          <div className="value">{leakedCount}</div>
        </div>
      </div>

      <div className="log" aria-live="polite">
        <div className="entry info">
          <span className="t">try</span>
          <span>
            Switch to <strong>Mallory</strong>, BAD mode, change the URL id to <strong>1</strong>.
            You just read Alice&apos;s invoices.
          </span>
        </div>
        <div className="entry info">
          <span className="t">fix</span>
          <span>
            Now flip to GOOD with the same URL — 403. The one-line owner check is the whole patch.
          </span>
        </div>
        {history.map((h, i) => (
          <div key={i} className="entry info">
            <span className="t">{h.t}</span>
            <span>{h.line}</span>
          </div>
        ))}
      </div>

      <div className="callout">
        <strong>Why A01 is #1.</strong> Access-control bugs are the most common
        high-impact web flaw because the check is invisible when it works and
        invisible when it&apos;s missing — nothing breaks visibly, the wrong
        user just gets the wrong data. The cure is dull but absolute: deny by
        default, and on every endpoint that touches a resource, ask
        &quot;does the caller actually own this?&quot; — server-side, every
        time, not just in the UI.
      </div>
    </div>
  );
}
