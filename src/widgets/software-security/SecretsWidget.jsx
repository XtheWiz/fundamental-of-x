import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Secrets & Key Management
// ------------------------
// Same leak event, three storage strategies. Different blast radius.
//   1) HARDCODED — secret lives in git history forever
//   2) ENV var   — secret lives in every running pod until redeploy
//   3) VAULT     — short-lived token, revocable in seconds
// Defensive/educational only.

const STRATEGIES = {
  source: {
    label: 'Hardcoded in source',
    leakKind: 'accidental commit',
    surfaces: ['every fork', 'every CI log', 'every old branch', 'GitHub mirror', 'employee laptops'],
    containSeconds: Infinity,
    rotateCost: 'high',
    callout:
      'The secret is baked into every commit. Once pushed, it lives forever in git history, ' +
      'every clone, every fork, every CI log. Rotation means rewriting history AND chasing ' +
      'every mirror — and you still cannot trust the old key was not scraped within seconds.',
  },
  env: {
    label: 'Env var on deploy',
    leakKind: 'env dump in error log',
    surfaces: ['running web pod', 'running worker pod', 'running batch pod', 'log aggregator'],
    containSeconds: 60 * 60 * 4,
    rotateCost: 'med',
    callout:
      'Not in source — better. But it sits in process memory and environment of every running ' +
      'pod. One bad stack trace that dumps env, or one compromised log shipper, and it is out. ' +
      'Containment requires re-issuing the key AND redeploying every service.',
  },
  vault: {
    label: 'Vault + rotation + short-lived tokens',
    leakKind: 'stolen runtime token',
    surfaces: ['holder of stolen token'],
    containSeconds: 30,
    rotateCost: 'low',
    callout:
      'The long-lived secret never leaves the vault. Services fetch short-lived tokens that ' +
      'expire on their own. If a token leaks, you revoke it and the blast radius goes to zero ' +
      'in seconds — without redeploying anything.',
  },
};

const POS = {
  repo:   { x:  80, y:  60, label: 'Source repo' },
  ci:     { x: 260, y:  60, label: 'CI runner' },
  deploy: { x: 440, y:  60, label: 'Deploy env' },
  vault:  { x: 620, y:  60, label: 'Vault' },
  web:    { x: 200, y: 190, label: 'web' },
  worker: { x: 360, y: 190, label: 'worker' },
  batch:  { x: 520, y: 190, label: 'batch' },
};

const fmtTime = (s) =>
  !isFinite(s) ? '∞' : s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : `${(s / 3600).toFixed(1)}h`;

function Box({ x, y, w = 110, h = 50, tainted, special, label, sublabel }) {
  const fill = tainted ? '#fde2e2' : special ? '#e6f0ff' : 'var(--paper)';
  const stroke = tainted ? 'var(--accent)' : special ? '#1c6dd0' : 'var(--ink)';
  return (
    <motion.g
      animate={tainted ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={{ duration: 0.7, repeat: tainted ? Infinity : 0 }}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    >
      {tainted && (
        <rect x={x - w / 2 - 5} y={y - h / 2 - 5} width={w + 10} height={h + 10} rx={9}
          fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6} />
      )}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6}
        fill={fill} stroke={stroke} strokeWidth={2.5}
        style={{ transition: 'fill 0.25s ease, stroke 0.25s ease' }} />
      <text x={x} y={y - 2} textAnchor="middle"
        style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>{label}</text>
      {sublabel && (
        <text x={x} y={y + 14} textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>{sublabel}</text>
      )}
    </motion.g>
  );
}

function Arrow({ from, to, color = 'var(--ink)', dashed, label }) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;
  const x1 = from.x + ux * 56, y1 = from.y + uy * 56;
  const x2 = to.x - ux * 60,   y2 = to.y - uy * 60;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2}
        strokeDasharray={dashed ? '5 4' : undefined} markerEnd="url(#sec-arr)" />
      {label && (
        <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: color, fontWeight: 600 }}>{label}</text>
      )}
    </g>
  );
}

const leakedNodes = (mode) =>
  mode === 'source' ? ['repo', 'ci', 'deploy', 'web', 'worker', 'batch']
  : mode === 'env' ? ['deploy', 'web', 'worker', 'batch']
  : mode === 'vault' ? ['web']
  : [];

export default function SecretsWidget() {
  const [mode, setMode] = useState('source');
  const [leaked, setLeaked] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [log, setLog] = useState([]);
  const [tokenTtl, setTokenTtl] = useState(0);
  const tickRef = useRef(null);

  const strat = STRATEGIES[mode];
  const tainted = leaked && !revoked ? leakedNodes(mode) : [];
  const surfaceCount = tainted.length;
  const pushLog = (e) => setLog((l) => [e, ...l].slice(0, 10));

  // Reset leak state on mode switch
  useEffect(() => {
    setLeaked(false);
    setRevoked(false);
    setTokenTtl(0);
    pushLog({ kind: 'info', t: 'mode', msg: `Strategy → ${STRATEGIES[mode].label}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Vault token TTL countdown
  useEffect(() => {
    if (mode !== 'vault' || !leaked || revoked) {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    tickRef.current = setInterval(() => {
      setTokenTtl((t) => {
        if (t <= 1) {
          clearInterval(tickRef.current); tickRef.current = null;
          setRevoked(true);
          pushLog({ kind: 'ok', t: 'expire', msg: 'Short-lived token expired on its own. Surface → 0.' });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [mode, leaked, revoked]);

  function triggerLeak() {
    setLeaked(true);
    setRevoked(false);
    if (mode === 'vault') setTokenTtl(strat.containSeconds);
    pushLog({ kind: 'err', t: 'leak', msg: `Leak event: ${strat.leakKind}. Surface = ${leakedNodes(mode).length}.` });
  }

  function rotate() {
    if (mode !== 'vault') return;
    setRevoked(true);
    setTokenTtl(0);
    pushLog({ kind: 'ok', t: 'rotate', msg: 'Token revoked at vault. Surface → 0 instantly.' });
  }

  function reset() {
    setLeaked(false); setRevoked(false); setTokenTtl(0);
    pushLog({ kind: 'info', t: 'reset', msg: 'Cleared leak state.' });
  }

  let containDisplay;
  if (!leaked) containDisplay = '—';
  else if (mode === 'vault' && revoked) containDisplay = 'seconds';
  else if (mode === 'vault') containDisplay = `${tokenTtl}s left`;
  else containDisplay = fmtTime(strat.containSeconds);

  const subFor = (key) => {
    if (key === 'repo')   return mode === 'source' ? 'has secret' : 'no secret';
    if (key === 'ci')     return mode === 'source' ? 'logs leak it' : 'builds artifact';
    if (key === 'deploy') return mode === 'env' ? 'injects ENV' : mode === 'vault' ? 'mounts vault SA' : 'ships binary';
    return null;
  };

  return (
    <div className="widget">
      <div className="widget-title">Secrets — strategy decides the blast radius</div>

      <div className="controls">
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
          Storage:
        </label>
        <div className="pill-group">
          <input type="radio" name="sec-mode" id="sec-source" value="source"
            checked={mode === 'source'} onChange={() => setMode('source')} />
          <label htmlFor="sec-source">Hardcoded in source</label>
          <input type="radio" name="sec-mode" id="sec-env" value="env"
            checked={mode === 'env'} onChange={() => setMode('env')} />
          <label htmlFor="sec-env">Env var on deploy</label>
          <input type="radio" name="sec-mode" id="sec-vault" value="vault"
            checked={mode === 'vault'} onChange={() => setMode('vault')} />
          <label htmlFor="sec-vault">Vault + rotation</label>
        </div>
      </div>

      <div className="controls">
        <button className="btn btn-accent" onClick={triggerLeak} disabled={leaked && !revoked}>
          Leak the secret
        </button>
        <button className="btn" onClick={rotate}
          disabled={mode !== 'vault' || !leaked || revoked}>
          Rotate / revoke
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
        {leaked && !revoked && <span className="badge err" style={{ marginLeft: 'auto' }}>LEAK ACTIVE</span>}
        {leaked && revoked && <span className="badge live" style={{ marginLeft: 'auto' }}>CONTAINED</span>}
      </div>

      <div className="widget-stage" style={{ minHeight: 280 }}>
        <svg viewBox="0 0 720 260" width="100%" style={{ maxWidth: 720 }}>
          <defs>
            <marker id="sec-arr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--ink)" />
            </marker>
          </defs>

          {['repo', 'ci', 'deploy'].map((k) => (
            <Box key={k} {...POS[k]} tainted={tainted.includes(k)} sublabel={subFor(k)} />
          ))}
          {mode === 'vault' && <Box {...POS.vault} special sublabel="issues 30s tokens" />}

          {['web', 'worker', 'batch'].map((k) => (
            <Box key={k} {...POS[k]} w={90} tainted={tainted.includes(k)} sublabel={`${k} svc`} />
          ))}

          <Arrow from={POS.repo} to={POS.ci} label="push" />
          <Arrow from={POS.ci} to={POS.deploy} label="deploy" />
          <Arrow from={POS.deploy} to={POS.web} />
          <Arrow from={POS.deploy} to={POS.worker} />
          <Arrow from={POS.deploy} to={POS.batch} />

          {mode === 'vault' && (
            <>
              <Arrow from={POS.vault} to={POS.web} color="#1c6dd0" dashed label="token" />
              <Arrow from={POS.vault} to={POS.worker} color="#1c6dd0" dashed />
              <Arrow from={POS.vault} to={POS.batch} color="#1c6dd0" dashed />
            </>
          )}

          <AnimatePresence>
            {leaked && !revoked && (
              <motion.text key="surface"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                x={360} y={250} textAnchor="middle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--accent)', fontWeight: 700 }}>
                leaked surface: {strat.surfaces.join(' · ')}
              </motion.text>
            )}
          </AnimatePresence>
        </svg>
      </div>

      <div className="metrics" style={{ marginTop: '0.75rem' }}>
        <div className="metric">
          <div className="label">Time to contain</div>
          <div className="value">{containDisplay}</div>
        </div>
        <div className="metric">
          <div className="label">Leaked surface</div>
          <div className="value" style={{ color: surfaceCount > 0 ? 'var(--accent)' : undefined }}>
            {surfaceCount}
          </div>
        </div>
        <div className="metric">
          <div className="label">Rotation cost</div>
          <div className="value">{strat.rotateCost}</div>
        </div>
      </div>

      <div className="callout">
        <strong>{strat.label}.</strong> {strat.callout}
        {leaked && !revoked && mode === 'source' && (
          <div style={{ marginTop: '0.4rem', color: 'var(--accent)' }}>
            Leak is permanent in git history. Even a force-push will not clean every fork or mirror.
          </div>
        )}
        {leaked && !revoked && mode === 'env' && (
          <div style={{ marginTop: '0.4rem', color: 'var(--accent)' }}>
            Every running pod still holds the leaked value until you re-issue AND redeploy.
          </div>
        )}
        {leaked && !revoked && mode === 'vault' && (
          <div style={{ marginTop: '0.4rem', color: '#1c6dd0' }}>
            Token self-expires in {tokenTtl}s — or click Rotate to revoke at the vault now.
          </div>
        )}
        {leaked && revoked && (
          <div style={{ marginTop: '0.4rem', color: '#2a8a3e' }}>
            Contained. No long-lived secret was exposed — only one short-lived token, now dead.
          </div>
        )}
      </div>

      <div className="log" style={{ marginTop: '0.5rem', maxHeight: 120, overflow: 'auto' }}>
        {log.length === 0 && (
          <div className="entry info"><span className="t">idle</span>pick a strategy and leak the secret.</div>
        )}
        {log.map((e, i) => (
          <div key={i} className={`entry ${e.kind}`}>
            <span className="t">{e.t}</span>{e.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
