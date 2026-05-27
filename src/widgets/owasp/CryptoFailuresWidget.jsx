import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Three side-by-side crypto failure patterns, each with a BAD vs GOOD knob.
// Everything is pre-canned — no real hashing, no real network, no real KMS.
// The point is for the learner to see the verdict change the moment they
// flip a setting.

const TABS = [
  { id: 'hash',   label: 'Weak hash for passwords' },
  { id: 'wire',   label: 'Plaintext in transit' },
  { id: 'key',    label: 'Hardcoded crypto key' },
];

// ---------- Tab 1: hashing ----------------------------------------------------

const HASH_CHOICES = {
  md5:    { name: 'MD5',                  bytes: 16, salted: false, rainbow: true,  crack: 'instant',     tone: 'bad',  why: 'MD5 is broken for security. A laptop GPU computes billions of MD5/s; common passwords resolve from precomputed rainbow tables in milliseconds.' },
  sha256: { name: 'SHA-256',              bytes: 32, salted: false, rainbow: true,  crack: 'hours',       tone: 'bad',  why: 'SHA-256 is a fast general-purpose hash, not a password hash. Without a salt and without slowness, GPUs grind through dictionaries in hours.' },
  bcrypt: { name: 'bcrypt (work=12)',     bytes: 60, salted: true,  rainbow: false, crack: 'years+',      tone: 'good', why: 'bcrypt is salted and deliberately slow. A work factor of 12 puts a single guess in the hundreds-of-milliseconds range — attacker throughput collapses by ~7 orders of magnitude vs SHA-256.' },
};

// Deterministic faux hash so display is stable per (password, algorithm).
function fauxHash(pw, algo) {
  const seed = (pw || '') + '|' + algo;
  let h1 = 0x811c9dc5, h2 = 0xdeadbeef;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761) >>> 0;
    h2 = Math.imul(h2 ^ c, 1597334677) >>> 0;
  }
  const target = HASH_CHOICES[algo].bytes * 2;
  let out = '';
  let s1 = h1, s2 = h2;
  while (out.length < target) {
    s1 = Math.imul(s1 ^ s2, 2246822519) >>> 0;
    s2 = Math.imul(s2 ^ s1, 3266489917) >>> 0;
    out += s1.toString(16).padStart(8, '0') + s2.toString(16).padStart(8, '0');
  }
  out = out.slice(0, target);
  if (algo === 'bcrypt') {
    const salt = (s1 ^ s2).toString(36).padStart(11, '0').slice(0, 11);
    return `$2b$12$${salt}${out.slice(0, 31)}`;
  }
  return out;
}

const COMMON_PWS = new Set([
  'password', '123456', 'qwerty', 'letmein', 'admin', 'welcome',
  'iloveyou', 'monkey', 'dragon', 'football', 'abc123', 'password1',
  'p@ssw0rd', 'sunshine',
]);

function rainbowHit(pw, algo) {
  if (!HASH_CHOICES[algo].rainbow) return false;
  return COMMON_PWS.has((pw || '').toLowerCase());
}

function HashTab() {
  const [algo, setAlgo] = useState('md5');
  const [pw, setPw] = useState('password');
  const choice = HASH_CHOICES[algo];
  const stored = useMemo(() => fauxHash(pw, algo), [pw, algo]);
  const hit = useMemo(() => rainbowHit(pw, algo), [pw, algo]);
  const display = stored.length > 48 ? stored.slice(0, 45) + '...' : stored;
  const crackColor = choice.crack === 'instant' ? 'var(--accent)' : choice.crack === 'hours' ? '#c97a1a' : '#2a8a3e';

  return (
    <div>
      <div className="controls">
        {Object.entries(HASH_CHOICES).map(([k, v]) => (
          <button key={k} className={`btn ${algo === k ? 'btn-accent' : 'btn-ghost'}`} onClick={() => setAlgo(k)} style={{ fontSize: '0.85rem' }}>
            {algo === k ? '●' : '○'} {v.name}
          </button>
        ))}
      </div>

      <div className="controls" style={{ marginTop: '0.5rem' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>password:</label>
        <input
          className="field"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', flex: 1, minWidth: 160 }}
          spellCheck={false}
        />
      </div>

      <div className="widget-stage" style={{ minHeight: 150, padding: '0.75rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>
          stored in DB ({choice.salted ? 'with salt' : 'no salt'})
        </div>
        <motion.div
          key={algo + pw}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="code-block"
          style={{ wordBreak: 'break-all', fontSize: '0.8rem' }}
        >
          {display}
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.6rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>RAINBOW-TABLE LOOKUP</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginTop: '0.2rem' }}>
              {hit ? (
                <span className="badge err">HIT — password recovered</span>
              ) : choice.rainbow ? (
                <span className="badge">no hit (uncommon password)</span>
              ) : (
                <span className="badge live">N/A — salted hash defeats tables</span>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>OFFLINE CRACK TIME</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: crackColor, marginTop: '0.1rem' }}>
              {choice.crack}
            </div>
          </div>
        </div>
      </div>

      <div className="callout" style={{ marginTop: '0.5rem' }}>
        <strong>{choice.tone === 'good' ? 'GOOD:' : 'BAD:'}</strong> {choice.why}
      </div>
    </div>
  );
}

// ---------- Tab 2: plaintext in transit --------------------------------------

function ciphertext(s, seed = 7) {
  // Just visual gibberish so the learner sees "opaque bytes".
  const HEX = '0123456789abcdef';
  let h = seed;
  let out = '';
  const len = Math.max(32, Math.min(80, (s || '').length * 2 + 24));
  for (let i = 0; i < len; i++) {
    h = (Math.imul(h ^ (s.charCodeAt(i % Math.max(1, s.length)) || 1), 2654435761) >>> 0);
    out += HEX[(h >>> ((i % 8) * 4)) & 0xf];
    if (i % 4 === 3 && i < len - 1) out += ' ';
  }
  return out;
}

function WireTab() {
  const [proto, setProto] = useState('http');
  const [body, setBody] = useState('user=alice&password=hunter2');
  const isHttps = proto === 'https';
  const cipher = useMemo(() => ciphertext(body), [body]);

  return (
    <div>
      <div className="controls">
        <button className={`btn ${proto === 'http' ? 'btn-accent' : 'btn-ghost'}`} onClick={() => setProto('http')} style={{ fontSize: '0.85rem' }}>
          {proto === 'http' ? '●' : '○'} HTTP
        </button>
        <button className={`btn ${proto === 'https' ? 'btn-accent' : 'btn-ghost'}`} onClick={() => setProto('https')} style={{ fontSize: '0.85rem' }}>
          {proto === 'https' ? '●' : '○'} HTTPS
        </button>
      </div>

      <div className="controls" style={{ marginTop: '0.5rem' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>POST body:</label>
        <input
          className="field"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', flex: 1, minWidth: 220 }}
          spellCheck={false}
        />
      </div>

      <div className="widget-stage" style={{ minHeight: 200 }}>
        <svg viewBox="0 0 700 200" width="100%" style={{ maxWidth: 700 }}>
          <defs>
            <marker id="cf-arr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--ink)" />
            </marker>
          </defs>

          <rect x={20}  y={70} width={120} height={60} rx={6} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2.5} />
          <text x={80} y={95}  textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>Browser</text>
          <text x={80} y={113} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>POST /login</text>

          <rect x={560} y={70} width={120} height={60} rx={6} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2.5} />
          <text x={620} y={95}  textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>Server</text>
          <text x={620} y={113} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>api.bank.example</text>

          <line x1={140} y1={100} x2={560} y2={100} stroke="var(--ink)" strokeWidth={2.5} markerEnd="url(#cf-arr)" />

          {/* Animated packet */}
          <motion.g
            key={proto + body}
            initial={{ x: 0 }}
            animate={{ x: 400 }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
          >
            <rect x={150} y={84} width={36} height={32} rx={4}
              fill={isHttps ? '#d9ead3' : '#fde2e2'}
              stroke={isHttps ? '#2a8a3e' : 'var(--accent)'} strokeWidth={2} />
            <text x={168} y={104} textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: isHttps ? '#2a8a3e' : 'var(--accent)' }}>
              {isHttps ? 'TLS' : 'CLR'}
            </text>
          </motion.g>

          {/* Sniffer */}
          <rect x={250} y={150} width={200} height={40} rx={6} fill="var(--paper-deep)" stroke="var(--ink-soft)" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={350} y={166} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>passive sniffer (Wi-Fi tap)</text>
          <line x1={350} y1={130} x2={350} y2={150} stroke="var(--ink-soft)" strokeWidth={1.5} strokeDasharray="3 3" />

          <text x={350} y={185} textAnchor="middle"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, fill: isHttps ? '#2a8a3e' : 'var(--accent)' }}>
            {isHttps ? 'sees: opaque TLS record' : 'sees: every byte'}
          </text>

          <text x={80} y={155} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>
            {isHttps ? 'https://' : 'http://'}
          </text>
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem', marginTop: '0.5rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>WHAT THE SNIFFER LOGS</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={proto + body}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="code-block"
              style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}
            >
              {isHttps ? cipher : body}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="callout" style={{ marginTop: '0.5rem' }}>
        <strong>{isHttps ? 'GOOD:' : 'BAD:'}</strong>{' '}
        {isHttps
          ? 'TLS turns the body into an opaque record before it leaves the NIC. A passive tap on the same Wi-Fi sees ciphertext + SNI metadata only — not credentials.'
          : 'Plain HTTP puts credentials in cleartext on every hop — the cafe AP, the ISP, every transit router. Anyone with tcpdump and the same network sees the password verbatim.'}
      </div>
    </div>
  );
}

// ---------- Tab 3: hardcoded key ---------------------------------------------

const KEY_CHOICES = {
  hardcoded: {
    label: 'Hardcoded',
    snippet: `// payments/crypto.js
const KEY = "9f3c7a1e4b8d2061c5a3e8f0d7b419c2";
export function encrypt(pt) {
  return aesGcm(KEY, pt);
}`,
    verdict: 'COMPROMISED',
    tone: 'bad',
    why: 'The key ships in the repo. Anyone who reads source — a contractor, a leaked git history, a misconfigured public mirror — instantly decrypts every record. Rotating means a code change + redeploy.',
  },
  env: {
    label: 'From env var',
    snippet: `// payments/crypto.js
const KEY = process.env.PAYMENTS_KEY;
export function encrypt(pt) {
  return aesGcm(KEY, pt);
}`,
    verdict: 'PARTIAL',
    tone: 'meh',
    why: 'Source no longer leaks the key, but the env var still sits in plaintext on every host, in process listings, in dumped core files, in CI logs. Better than hardcoded, still not great for long-lived secrets.',
  },
  kms: {
    label: 'KMS-wrapped',
    snippet: `// payments/crypto.js
import { kmsDecrypt } from "./kms";
const dek = await kmsDecrypt(WRAPPED_DEK);   // resolved at boot
export function encrypt(pt) {
  return aesGcm(dek, pt);
}`,
    verdict: 'PROTECTED',
    tone: 'good',
    why: 'The data-encryption key is wrapped by a KMS; only an authenticated role can unwrap it, every unwrap is logged, and rotation is a single API call. Reading source reveals nothing usable.',
  },
};

function KeyTab() {
  const [mode, setMode] = useState('hardcoded');
  const choice = KEY_CHOICES[mode];
  const badgeClass = choice.tone === 'bad' ? 'badge err' : choice.tone === 'meh' ? 'badge warn' : 'badge live';

  return (
    <div>
      <div className="controls">
        {Object.entries(KEY_CHOICES).map(([k, v]) => (
          <button key={k} className={`btn ${mode === k ? 'btn-accent' : 'btn-ghost'}`} onClick={() => setMode(k)} style={{ fontSize: '0.85rem' }}>
            {mode === k ? '●' : '○'} {v.label}
          </button>
        ))}
      </div>

      <div className="widget-stage" style={{ minHeight: 180, padding: '0.75rem' }}>
        <AnimatePresence mode="wait">
          <motion.pre
            key={mode}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="code-block"
            style={{ margin: 0, fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}
          >
            {choice.snippet}
          </motion.pre>
        </AnimatePresence>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.7rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>ATTACKER READS SOURCE</div>
            <div style={{ marginTop: '0.2rem' }}>
              <span className={badgeClass}>{choice.verdict}</span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>KEY ROTATION COST</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginTop: '0.2rem' }}>
              {mode === 'hardcoded' && 'code change + redeploy'}
              {mode === 'env' && 'restart every host'}
              {mode === 'kms' && 'one API call'}
            </div>
          </div>
        </div>
      </div>

      <div className="callout" style={{ marginTop: '0.5rem' }}>
        <strong>{choice.tone === 'good' ? 'GOOD:' : choice.tone === 'meh' ? 'PARTIAL:' : 'BAD:'}</strong> {choice.why}
      </div>
    </div>
  );
}

// ---------- Shell ------------------------------------------------------------

export default function CryptoFailuresWidget() {
  const [tab, setTab] = useState('hash');

  return (
    <div className="widget">
      <div className="widget-title">Cryptographic failures — three traps, three fixes</div>
      <div className="widget-hint">
        Each tab shows one of the patterns OWASP A02 warns about. Flip the switch on any tab and the verdict updates immediately.
      </div>

      <div className="controls" style={{ marginTop: '0.5rem' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`btn ${tab === t.id ? 'btn-accent' : 'btn-ghost'}`}
            onClick={() => setTab(t.id)}
            style={{ fontSize: '0.85rem' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '0.6rem' }}>
        {tab === 'hash' && <HashTab />}
        {tab === 'wire' && <WireTab />}
        {tab === 'key'  && <KeyTab />}
      </div>
    </div>
  );
}
