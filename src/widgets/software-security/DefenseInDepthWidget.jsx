import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LAYERS = [
  { key: 'waf',    name: 'WAF',                 short: 'WAF',   radius: 165 },
  { key: 'auth',   name: 'Auth gate',           short: 'Auth',  radius: 135 },
  { key: 'input',  name: 'Input validation',    short: 'Input', radius: 105 },
  { key: 'orm',    name: 'ORM / params',        short: 'ORM',   radius: 75  },
  { key: 'role',   name: 'DB role isolation',   short: 'Role',  radius: 45  },
];

const ATTACKS = {
  sqli: {
    name: 'SQL injection',
    blurb: "' OR 1=1 -- against /search",
    // Probability each layer (if enabled) catches this attack.
    catches: { waf: 0.7, auth: 0.0, input: 0.5, orm: 0.98, role: 0.4 },
  },
  xss: {
    name: 'XSS payload',
    blurb: '<script>fetch(evil)</script> in comment',
    catches: { waf: 0.55, auth: 0.0, input: 0.85, orm: 0.0, role: 0.0 },
  },
  brute: {
    name: 'Brute-force login',
    blurb: '5,000 password guesses',
    catches: { waf: 0.4, auth: 0.95, input: 0.1, orm: 0.0, role: 0.0 },
  },
  session: {
    name: 'Stolen session cookie',
    blurb: 'Replayed cookie from coffee-shop wifi',
    catches: { waf: 0.05, auth: 0.4, input: 0.0, orm: 0.0, role: 0.6 },
  },
};

// Deterministic pseudo-random so re-runs with same inputs give the same story.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function simulate(enabled, attackKey) {
  const attack = ATTACKS[attackKey];
  const trail = [];
  let stoppedAt = null;
  for (const layer of LAYERS) {
    const on = enabled[layer.key];
    if (!on) {
      trail.push({ key: layer.key, name: layer.name, status: 'off' });
      continue;
    }
    const p = attack.catches[layer.key] ?? 0;
    const roll = hash(`${attackKey}|${layer.key}|${Object.values(enabled).join('')}`);
    const caught = roll < p;
    if (caught) {
      trail.push({ key: layer.key, name: layer.name, status: 'blocked' });
      stoppedAt = layer.key;
      break;
    }
    trail.push({ key: layer.key, name: layer.name, status: 'bypassed' });
  }
  const breached = trail.filter((t) => t.status === 'bypassed').length;
  const skipped  = trail.filter((t) => t.status === 'off').length;
  const safe = stoppedAt !== null;
  return { trail, stoppedAt, breached, skipped, safe, attack };
}

function Ring({ layer, enabled, status, onToggle }) {
  const stroke =
    status === 'blocked'  ? '#2a8a3e' :
    status === 'bypassed' ? 'var(--accent)' :
    status === 'off'      ? 'var(--ink-faint)' :
                            'var(--ink)';
  const dash = enabled ? undefined : '4 5';
  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onToggle(layer.key)}>
      <circle
        cx={200} cy={200} r={layer.radius}
        fill="none" stroke={stroke} strokeWidth={enabled ? 3 : 1.5}
        strokeDasharray={dash} opacity={enabled ? 0.9 : 0.45}
      />
      <rect
        x={200 - 44} y={200 - layer.radius - 11} width={88} height={20} rx={4}
        fill="var(--paper)" stroke={stroke} strokeWidth={1.5}
      />
      <text
        x={200} y={200 - layer.radius + 3} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, fill: stroke }}
      >
        {enabled ? layer.short : `${layer.short} off`}
      </text>
    </g>
  );
}

export default function DefenseInDepthWidget() {
  const [enabled, setEnabled] = useState({ waf: true, auth: true, input: true, orm: true, role: true });
  const [attackKey, setAttackKey] = useState('sqli');
  const [runId, setRunId] = useState(0);

  const result = useMemo(() => simulate(enabled, attackKey), [enabled, attackKey]);

  // Re-trigger animation whenever any input changes.
  useEffect(() => { setRunId((n) => n + 1); }, [enabled, attackKey]);

  function toggle(key) {
    setEnabled((e) => ({ ...e, [key]: !e[key] }));
  }
  function pickAttack(k) { setAttackKey(k); }
  function runAgain() { setRunId((n) => n + 1); }
  function enableAll() { setEnabled({ waf: true, auth: true, input: true, orm: true, role: true }); }
  function disableAll() { setEnabled({ waf: false, auth: false, input: false, orm: false, role: false }); }

  const statusByLayer = Object.fromEntries(result.trail.map((t) => [t.key, t.status]));

  // Compute the inward path the attack travels: from outside to either the
  // first blocking ring, or all the way to the centre.
  const stopRadius = result.stoppedAt
    ? LAYERS.find((l) => l.key === result.stoppedAt).radius
    : 0;
  const attackEndR = stopRadius;

  return (
    <div className="widget">
      <div className="widget-title">Defense in depth — peel one layer, the rest still hold</div>

      <div className="controls">
        {LAYERS.map((l) => (
          <label key={l.key} className="field" style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={enabled[l.key]} onChange={() => toggle(l.key)} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{l.name}</span>
          </label>
        ))}
        <button className="btn btn-ghost" onClick={enableAll}>All on</button>
        <button className="btn btn-ghost" onClick={disableAll}>All off</button>
      </div>

      <div className="controls pill-group" role="radiogroup" aria-label="Attack">
        {Object.entries(ATTACKS).map(([k, a]) => (
          <span key={k}>
            <input
              type="radio" id={`atk-${k}`} name="atk"
              checked={attackKey === k} onChange={() => pickAttack(k)}
            />
            <label htmlFor={`atk-${k}`}>{a.name}</label>
          </span>
        ))}
        <button className="btn btn-accent" onClick={runAgain} style={{ marginLeft: 'auto' }}>
          Run attack
        </button>
      </div>

      <div className="widget-stage" style={{ minHeight: 420, display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 400 400" width="100%" style={{ maxWidth: 460 }}>
          <defs>
            <radialGradient id="jewels" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stopColor="#ffe082" />
              <stop offset="100%" stopColor="#c79a1f" />
            </radialGradient>
            <marker id="atk-end" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--accent)" />
            </marker>
          </defs>

          {LAYERS.map((l) => (
            <Ring
              key={l.key}
              layer={l}
              enabled={enabled[l.key]}
              status={statusByLayer[l.key]}
              onToggle={toggle}
            />
          ))}

          {/* Crown jewels */}
          <circle cx={200} cy={200} r={26} fill="url(#jewels)" stroke="var(--ink)" strokeWidth={2} />
          <text x={200} y={196} textAnchor="middle"
            style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700 }}>
            Crown
          </text>
          <text x={200} y={208} textAnchor="middle"
            style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700 }}>
            Jewels
          </text>

          {/* Attack origin marker */}
          <g>
            <circle cx={200} cy={20} r={9} fill="var(--accent)" stroke="var(--ink)" strokeWidth={1.5} />
            <text x={200} y={12} textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink)' }}>
              attacker
            </text>
          </g>

          {/* Animated attack arrow travelling inward */}
          <AnimatePresence mode="wait">
            <motion.line
              key={runId}
              x1={200} y1={29}
              x2={200}
              stroke="var(--accent)" strokeWidth={2.5}
              strokeDasharray="6 4"
              markerEnd="url(#atk-end)"
              initial={{ y2: 29 }}
              animate={{ y2: 200 - attackEndR - 2 }}
              transition={{ duration: 1.1, ease: 'easeIn' }}
            />
          </AnimatePresence>

          {/* Verdict pulse at stop point */}
          {result.safe && (
            <motion.circle
              key={`stop-${runId}`}
              cx={200} cy={200 - stopRadius}
              r={6} fill="#2a8a3e" stroke="var(--ink)" strokeWidth={1.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.4, 1], opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.4 }}
            />
          )}
          {!result.safe && (
            <motion.circle
              key={`hit-${runId}`}
              cx={200} cy={200}
              r={32}
              fill="none" stroke="var(--accent)" strokeWidth={3}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [0.6, 1.3, 1], opacity: [0, 1, 0.9] }}
              transition={{ delay: 1.0, duration: 0.5 }}
            />
          )}
        </svg>
      </div>

      <div className="metrics">
        <div className={`metric ${result.safe ? '' : 'accent'}`}>
          <div className="label">Verdict</div>
          <div className="value">
            {result.safe
              ? 'Crown jewels safe'
              : `Compromised through ${result.breached + result.skipped} layer${result.breached + result.skipped === 1 ? '' : 's'}`}
          </div>
        </div>
        <div className="metric">
          <div className="label">Layers bypassed</div>
          <div className="value">{result.breached}</div>
        </div>
        <div className="metric">
          <div className="label">Layers disabled</div>
          <div className="value">{result.skipped}</div>
        </div>
        <div className="metric">
          <div className="label">Attack</div>
          <div className="value" style={{ fontSize: '0.95rem' }}>{result.attack.name}</div>
        </div>
      </div>

      <div className="log" aria-live="polite">
        <div className="entry info">
          <span className="t">probe</span>
          <span>{result.attack.name} — {result.attack.blurb}</span>
        </div>
        {result.trail.map((t, i) => {
          const cls = t.status === 'blocked' ? 'ok' : t.status === 'bypassed' ? 'err' : 'info';
          const verb =
            t.status === 'blocked'  ? 'STOPPED by' :
            t.status === 'bypassed' ? 'bypassed' :
                                      'skipped (disabled)';
          return (
            <div key={`${runId}-${i}`} className={`entry ${cls}`}>
              <span className="t">L{i + 1}</span>
              <span>{verb} {t.name}</span>
              {t.status === 'blocked' && <span className="badge live" style={{ marginLeft: '0.5rem' }}>blocked</span>}
              {t.status === 'bypassed' && <span className="badge err" style={{ marginLeft: '0.5rem' }}>through</span>}
              {t.status === 'off' && <span className="badge warn" style={{ marginLeft: '0.5rem' }}>off</span>}
            </div>
          );
        })}
        {!result.safe && (
          <div className="entry err">
            <span className="t">!!</span>
            <span>Attack reached the crown jewels.</span>
          </div>
        )}
        {result.safe && (
          <div className="entry ok">
            <span className="t">ok</span>
            <span>Attack stopped after {result.breached} bypassed layer{result.breached === 1 ? '' : 's'}.</span>
          </div>
        )}
      </div>

      <div className="callout">
        <strong>Why this matters.</strong> Defense in depth works because each layer
        has different failure modes — turn one ring off and the others usually still
        catch the attack. A WAF can miss a clever SQLi payload, but parameterised
        queries still neutralise it. Auth alone can&apos;t stop XSS, but input
        validation will. The system fails only when several independent layers fail
        at once.
      </div>
    </div>
  );
}
