import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// OWASP A10 — Server-Side Request Forgery (SSRF).
//
// Educational sandbox only. Everything is simulated in-component:
// no real fetch ever fires. The "server" here is a pure function
// that takes a URL plus a protection mode and decides what would
// happen if a naive backend (or a hardened one) fetched it on the
// user's behalf.
//
// The point: when an HTTP-fetching endpoint trusts user-supplied
// URLs, attackers can pivot the server itself into the VPC — most
// famously to the cloud metadata endpoint (169.254.169.254) where
// short-lived IAM credentials live. A two-line allowlist plus a
// post-DNS private-IP block is the whole defense.

// --- "Resources" reachable from the simulated app server. -----------

const SIMULATED_HOSTS = {
  'example.com': {
    ip: '93.184.216.34',
    kind: 'public',
    body: '<!doctype html><title>Example Domain</title><h1>Example Domain</h1>',
    note: 'Public site on the allowlist.',
  },
  'api.partner.com': {
    ip: '52.10.20.30',
    kind: 'public',
    body: '{"status":"ok","partner":"acme"}',
    note: 'Public partner API on the allowlist.',
  },
  '169.254.169.254': {
    ip: '169.254.169.254',
    kind: 'metadata',
    body:
      '{\n  "Code": "Success",\n  "AccessKeyId": "AKIA...REDACTED",\n  "SecretAccessKey": "wJalrXUtnFEMI/...REDACTED",\n  "Token": "FwoGZXIvYXdzE...REDACTED",\n  "Expiration": "2026-05-27T18:00:00Z"\n}',
    note: 'AWS-style instance metadata. Link-local — should never be reachable from user input.',
  },
  '10.0.0.5': {
    ip: '10.0.0.5',
    kind: 'internal',
    body: '<html><body><h1>Admin Console</h1><form>shutdown / drain / rotate keys</form></body></html>',
    note: 'Internal admin host. RFC1918 private space — must never be fetched on behalf of the internet.',
  },
  'evil.example': {
    // A DNS-rebinding attacker: first lookup returns a public IP, a
    // second lookup (after the SSRF check) returns a private IP.
    ip: '203.0.113.7',
    reboundIp: '169.254.169.254',
    kind: 'rebind',
    body: '{\n  "Code": "Success",\n  "AccessKeyId": "AKIA...REDACTED"\n}',
    note: 'DNS-rebinding host. Resolves "public" once, then flips to the metadata IP.',
  },
};

// --- Code shown to the learner. -------------------------------------

const BAD_CODE = `// BAD: trust whatever URL the client gives us.
app.post('/fetch', async (req, res) => {
  const userUrl = req.body.url;
  const upstream = await fetch(userUrl);         // <-- SSRF here
  const body = await upstream.text();
  res.send(body);
});`;

const ALLOWLIST_CODE = `// GOOD: only known public origins are allowed through.
const ALLOWED = new Set([
  'https://example.com',
  'https://api.partner.com',
]);

app.post('/fetch', async (req, res) => {
  const u = new URL(req.body.url);
  const origin = \`\${u.protocol}//\${u.host}\`;
  if (!ALLOWED.has(origin)) return res.status(400).send('blocked');
  const upstream = await fetch(u);
  res.send(await upstream.text());
});`;

const DNS_CODE = `// GOOD: resolve the host, reject any private/link-local IP,
// then connect to *that exact IP* so a second DNS lookup
// cannot flip to an internal address (DNS rebinding).
import dns from 'node:dns/promises';

function isPrivate(ip) {
  return /^10\\./.test(ip)
      || /^192\\.168\\./.test(ip)
      || /^127\\./.test(ip)
      || /^169\\.254\\./.test(ip)
      || /^172\\.(1[6-9]|2\\d|3[01])\\./.test(ip);
}

app.post('/fetch', async (req, res) => {
  const u = new URL(req.body.url);
  const { address } = await dns.lookup(u.hostname);
  if (isPrivate(address)) return res.status(400).send('blocked');
  // Pin to the resolved IP — no re-resolve, no rebind.
  const pinned = u.href.replace(u.hostname, address);
  res.send(await (await fetch(pinned, {
    headers: { Host: u.hostname }
  })).text());
});`;

// --- Pure simulator. Returns what the "server" would do. ------------

function isPrivateIp(ip) {
  if (!ip) return false;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^127\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  return false;
}

function lookupHost(host) {
  // Hand-rolled "DNS": exact match against our simulated table, or
  // treat a literal dotted-quad host as its own IP.
  if (SIMULATED_HOSTS[host]) return SIMULATED_HOSTS[host];
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return { ip: host, kind: isPrivateIp(host) ? 'unknown-private' : 'unknown-public', body: '', note: 'Unknown host. Pretend DNS returned this literal IP.' };
  }
  return null;
}

function evaluate(rawUrl, mode) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return {
      kind: 'bad-url',
      status: 0,
      body: '',
      reason: 'Not a valid URL. Try https://example.com',
    };
  }
  const host = parsed.hostname;
  const origin = `${parsed.protocol}//${parsed.host}`;
  const record = lookupHost(host);

  if (!record) {
    return { kind: 'dns-fail', status: 0, body: '', reason: `DNS: no such host "${host}".` };
  }

  // --- Mode: allowlist ---------------------------------------------
  if (mode === 'allowlist') {
    const allowed = origin === 'https://example.com' || origin === 'https://api.partner.com';
    if (!allowed) {
      return {
        kind: 'blocked',
        status: 400,
        body: 'blocked',
        reason: `Origin ${origin} is not on the allowlist.`,
        resolved: record.ip,
      };
    }
    return {
      kind: 'ok',
      status: 200,
      body: record.body,
      reason: `Origin ${origin} is allowlisted.`,
      resolved: record.ip,
    };
  }

  // --- Mode: dns + private-IP block --------------------------------
  if (mode === 'dns') {
    if (isPrivateIp(record.ip)) {
      return {
        kind: 'blocked',
        status: 400,
        body: 'blocked',
        reason: `Resolved IP ${record.ip} is in a private/link-local range.`,
        resolved: record.ip,
      };
    }
    // DNS-rebinding host: the second resolve would flip to a private
    // IP, but we pinned the first resolved address — so the rebind
    // attack fails.
    if (record.kind === 'rebind') {
      return {
        kind: 'ok-pinned',
        status: 200,
        body: '<!-- public page from pinned IP 203.0.113.7 -->',
        reason: `Resolved ${record.ip}, pinned the connection to that IP. Second DNS lookup would have returned ${record.reboundIp} (private) — ignored because we did not re-resolve.`,
        resolved: record.ip,
      };
    }
    return {
      kind: 'ok',
      status: 200,
      body: record.body,
      reason: `Resolved ${record.ip} — public address, allowed.`,
      resolved: record.ip,
    };
  }

  // --- Mode: none (BAD) --------------------------------------------
  if (record.kind === 'metadata') {
    return {
      kind: 'leak-creds',
      status: 200,
      body: record.body,
      reason: 'WOULD LEAK CLOUD CREDS — the server fetched the instance metadata endpoint and returned short-lived IAM credentials to the attacker.',
      resolved: record.ip,
    };
  }
  if (record.kind === 'internal') {
    return {
      kind: 'leak-internal',
      status: 200,
      body: record.body,
      reason: 'INTERNAL ADMIN ACCESS — the server reached a host that should only be reachable from inside the VPC.',
      resolved: record.ip,
    };
  }
  if (record.kind === 'rebind') {
    return {
      kind: 'leak-rebind',
      status: 200,
      body: SIMULATED_HOSTS['169.254.169.254'].body,
      reason: 'DNS REBIND — first lookup said public, second lookup (used by fetch) flipped to 169.254.169.254 and quietly leaked metadata.',
      resolved: record.reboundIp,
    };
  }
  if (record.kind === 'unknown-private') {
    return {
      kind: 'leak-internal',
      status: 200,
      body: '<-- whatever was at that private IP -->',
      reason: `INTERNAL ACCESS — ${record.ip} is in a private range and the BAD endpoint had no check.`,
      resolved: record.ip,
    };
  }
  return {
    kind: 'ok',
    status: 200,
    body: record.body,
    reason: 'Public host, fetched normally.',
    resolved: record.ip,
  };
}

// --- Diagram --------------------------------------------------------

function Box({ x, y, w = 110, h = 50, fill = 'var(--paper)', stroke = 'var(--ink)', label, sublabel, glow }) {
  return (
    <g>
      {glow && (
        <rect x={x - w / 2 - 4} y={y - h / 2 - 4} width={w + 8} height={h + 8}
          fill="none" stroke={glow} strokeWidth={2} strokeDasharray="4 3" rx={8} opacity={0.8} />
      )}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={2.5} rx={6} />
      <text x={x} y={y - 2} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>{label}</text>
      {sublabel && (
        <text x={x} y={y + 14} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
          {sublabel}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, color = 'var(--ink)', dashed, label, blocked }) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5}
        strokeDasharray={dashed ? '5 4' : undefined} markerEnd="url(#ssrf-arr)" opacity={blocked ? 0.35 : 1} />
      {blocked && (
        <g>
          <line x1={midX - 7} y1={midY - 7} x2={midX + 7} y2={midY + 7} stroke="var(--accent)" strokeWidth={3} />
          <line x1={midX + 7} y1={midY - 7} x2={midX - 7} y2={midY + 7} stroke="var(--accent)" strokeWidth={3} />
        </g>
      )}
      {label && (
        <text x={midX} y={midY - 10} textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: color, fontWeight: 600 }}>{label}</text>
      )}
    </g>
  );
}

// --- Component ------------------------------------------------------

const QUICK_URLS = [
  'https://example.com',
  'http://169.254.169.254/latest/meta-data/iam/security-credentials/web-app-role',
  'http://10.0.0.5/admin',
  'http://evil.example/page',
];

const MODE_LABELS = {
  none: 'None (BAD)',
  allowlist: 'URL allowlist',
  dns: 'DNS + private-IP block',
};

function verdictColor(kind) {
  if (kind === 'leak-creds' || kind === 'leak-internal' || kind === 'leak-rebind') return 'var(--accent)';
  if (kind === 'blocked') return '#2a8a3e';
  if (kind === 'ok' || kind === 'ok-pinned') return '#1c6dd0';
  return 'var(--ink-soft)';
}

function targetForUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.hostname === '169.254.169.254') return 'metadata';
    if (u.hostname === '10.0.0.5') return 'internal';
    if (u.hostname === 'evil.example') return 'rebind';
    return 'public';
  } catch {
    return null;
  }
}

export default function SSRFWidget() {
  const [url, setUrl] = useState('http://169.254.169.254/latest/meta-data/iam/security-credentials/web-app-role');
  const [mode, setMode] = useState('none');

  const result = useMemo(() => evaluate(url, mode), [url, mode]);
  const target = targetForUrl(url);
  const code = mode === 'none' ? BAD_CODE : mode === 'allowlist' ? ALLOWLIST_CODE : DNS_CODE;

  const fetchBlocked = result.kind === 'blocked' || result.kind === 'bad-url' || result.kind === 'dns-fail';
  const hitsMetadata = target === 'metadata' || (target === 'rebind' && mode === 'none');
  const hitsInternal = target === 'internal';

  return (
    <div className="widget">
      <div className="widget-title">A10 — Server-Side Request Forgery (SSRF)</div>

      <div className="controls pill-group" role="radiogroup" aria-label="Protection mode">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', alignSelf: 'center' }}>
          Protection:
        </span>
        {Object.entries(MODE_LABELS).map(([k, v]) => (
          <span key={k}>
            <input
              type="radio"
              id={`ssrf-mode-${k}`}
              name="ssrf-mode"
              checked={mode === k}
              onChange={() => setMode(k)}
            />
            <label htmlFor={`ssrf-mode-${k}`}>{v}</label>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
          simulated — no real outbound fetch
        </span>
      </div>

      <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <label htmlFor="ssrf-url" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
          URL the (simulated) server will fetch on your behalf:
        </label>
        <input
          id="ssrf-url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          spellCheck={false}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.92rem',
            padding: '0.5rem 0.7rem',
            border: '2px solid var(--ink)',
            borderRadius: 4,
            background: 'var(--paper)',
          }}
        />
        <div className="controls" style={{ gap: '0.3rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>try:</span>
          {QUICK_URLS.map((q) => (
            <button key={q} className="btn btn-ghost" onClick={() => setUrl(q)} style={{ fontSize: '0.78rem' }}>
              {q.length > 44 ? q.slice(0, 41) + '...' : q}
            </button>
          ))}
        </div>
      </div>

      <div className="widget-stage" style={{ minHeight: 240 }}>
        <svg viewBox="0 0 720 240" width="100%" style={{ maxWidth: 720 }}>
          <defs>
            <marker id="ssrf-arr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--ink)" />
            </marker>
          </defs>

          {/* VPC boundary */}
          <rect x={250} y={20} width={450} height={200} fill="none" stroke="var(--ink-soft)"
            strokeDasharray="6 4" strokeWidth={1.5} rx={10} />
          <text x={260} y={36} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>VPC</text>

          <Box x={70} y={120} label="Browser" sublabel="POST /fetch" />

          <Box x={340} y={120} w={130} h={60} label="App Server"
            sublabel={mode === 'none' ? 'await fetch(userUrl)' : mode === 'allowlist' ? 'allowlist check' : 'resolve + check'}
            glow={mode === 'none' ? 'var(--accent)' : '#2a8a3e'} />

          {/* Internal resources */}
          <Box x={600} y={60} w={170} h={40} label="169.254.169.254"
            sublabel="cloud metadata (fake)"
            glow={hitsMetadata && !fetchBlocked ? 'var(--accent)' : undefined} />
          <Box x={600} y={130} w={170} h={40} label="10.0.0.5"
            sublabel="internal admin"
            glow={hitsInternal && !fetchBlocked ? 'var(--accent)' : undefined} />
          <Box x={600} y={200} w={170} h={40} label="example.com"
            sublabel="public, allowed" />

          {/* Browser → App Server */}
          <Arrow x1={125} y1={120} x2={278} y2={120} label="URL" />

          {/* App Server → metadata */}
          <Arrow x1={405} y1={108} x2={518} y2={68}
            color={hitsMetadata && !fetchBlocked ? 'var(--accent)' : 'var(--ink-faint)'}
            dashed
            blocked={target === 'metadata' && fetchBlocked}
            label={hitsMetadata ? (fetchBlocked ? 'blocked' : 'LEAK') : ''} />

          {/* App Server → internal */}
          <Arrow x1={405} y1={120} x2={518} y2={130}
            color={hitsInternal && !fetchBlocked ? 'var(--accent)' : 'var(--ink-faint)'}
            dashed
            blocked={target === 'internal' && fetchBlocked}
            label={hitsInternal ? (fetchBlocked ? 'blocked' : 'reached') : ''} />

          {/* App Server → public */}
          <Arrow x1={405} y1={132} x2={518} y2={200}
            color={target === 'public' && !fetchBlocked ? '#1c6dd0' : 'var(--ink-faint)'}
            label={target === 'public' && !fetchBlocked ? 'ok' : ''} />
        </svg>
      </div>

      <div
        className="widget-stage"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '0.8rem',
          alignItems: 'stretch',
        }}
      >
        {/* Live outcome */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
          }}>
            <span style={{ color: 'var(--ink-soft)' }}>server →</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
            <span
              className="badge"
              style={{
                background: verdictColor(result.kind),
                color: 'white',
                padding: '0.1rem 0.5rem',
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              {result.status || '—'}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.pre
              key={`${mode}-${url}-${result.kind}`}
              className="code-block"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              style={{
                margin: 0,
                minHeight: 150,
                borderLeft: `4px solid ${verdictColor(result.kind)}`,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {result.body || '(no body)'}
            </motion.pre>
          </AnimatePresence>

          <div
            className="callout"
            style={{
              borderColor:
                result.kind === 'leak-creds' || result.kind === 'leak-internal' || result.kind === 'leak-rebind'
                  ? 'var(--accent)'
                  : result.kind === 'blocked' || result.kind === 'ok-pinned'
                  ? '#2a8a3e'
                  : undefined,
            }}
          >
            <strong>
              {result.kind === 'leak-creds' && 'WOULD LEAK CLOUD CREDS. '}
              {result.kind === 'leak-internal' && 'INTERNAL ADMIN ACCESS. '}
              {result.kind === 'leak-rebind' && 'DNS REBIND BYPASS. '}
              {result.kind === 'blocked' && 'Blocked. '}
              {result.kind === 'ok' && 'Fetched. '}
              {result.kind === 'ok-pinned' && 'Fetched (pinned). '}
              {result.kind === 'bad-url' && 'Invalid URL. '}
              {result.kind === 'dns-fail' && 'DNS failure. '}
            </strong>
            {result.reason}
          </div>
        </div>

        {/* Code for current mode */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            handler running now:
            <span
              className="badge"
              style={{
                background: mode === 'none' ? 'var(--accent)' : '#2a8a3e',
                color: 'white',
                padding: '0.1rem 0.5rem',
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              {MODE_LABELS[mode]}
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.pre
              key={mode}
              className="code-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              style={{
                margin: 0,
                minHeight: 240,
                whiteSpace: 'pre',
                overflow: 'auto',
                fontSize: '0.8rem',
              }}
            >
              {code}
            </motion.pre>
          </AnimatePresence>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">Target host</div>
          <div className="value" style={{ fontSize: '0.95rem' }}>
            {(() => { try { return new URL(url).hostname; } catch { return '—'; } })()}
          </div>
        </div>
        <div className="metric">
          <div className="label">Resolved IP</div>
          <div className="value" style={{ fontSize: '0.95rem' }}>
            {result.resolved || '—'}
          </div>
        </div>
        <div className="metric">
          <div className="label">Private/link-local?</div>
          <div className="value" style={{ fontSize: '0.95rem' }}>
            {result.resolved ? (isPrivateIp(result.resolved) ? 'yes' : 'no') : '—'}
          </div>
        </div>
        <div className={`metric ${result.kind.startsWith('leak') ? 'accent' : ''}`}>
          <div className="label">Outcome</div>
          <div className="value" style={{ fontSize: '0.95rem' }}>
            {result.kind}
          </div>
        </div>
      </div>

      <div className="log" aria-live="polite">
        <div className="entry info">
          <span className="t">try</span>
          <span>
            With <strong>Protection: None</strong>, paste the metadata URL.
            The "server" returns IAM credentials it should never have been able to see.
          </span>
        </div>
        <div className="entry info">
          <span className="t">try</span>
          <span>
            Switch to <strong>URL allowlist</strong> — same URL, blocked. Then try
            <code> http://evil.example/page</code> under <strong>DNS + private-IP block</strong>:
            the rebind attack quietly fails because the first resolved IP is pinned.
          </span>
        </div>
      </div>

      <div className="callout">
        <strong>Why A10 hurts.</strong> An HTTP-fetching endpoint that trusts a
        user-supplied URL hands the attacker the network identity of your
        server — and your server can reach things the attacker cannot:
        cloud metadata, internal admin panels, databases bound to localhost.
        The fix is layered: a strict allowlist of egress origins, plus a
        post-DNS check that rejects private/link-local IPs and pins the
        socket to the resolved address so a second lookup cannot rebind
        you onto <code>169.254.169.254</code>.
      </div>
    </div>
  );
}
