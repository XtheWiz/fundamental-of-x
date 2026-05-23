import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Two tabs:
//   1) Decorator — toggle and reorder middleware; "send request" walks the chain.
//      The order matters: e.g. Auth before Logger means unauthenticated requests
//      never reach the log; Logger before Auth logs every attempt.
//   2) Adapter — pick source + target wire formats; the adapter translates live.

const MIDDLEWARE = {
  log:   { id: 'log',   label: 'Logger',    color: '#cfe5ff' },
  auth:  { id: 'auth',  label: 'Auth',      color: '#fde2e2' },
  comp:  { id: 'comp',  label: 'Compress',  color: '#d9ead3' },
  rate:  { id: 'rate',  label: 'Rate-limit',color: '#fff2b3' },
  retry: { id: 'retry', label: 'Retry',     color: '#e7d6f5' },
};

function traceFor(orderedIds, authPasses) {
  const lines = [];
  let blockedBy = null;
  for (const id of orderedIds) {
    if (blockedBy) break;
    switch (id) {
      case 'log':   lines.push({ id, dir: 'in', text: '[log]    request received'           }); break;
      case 'auth':
        if (authPasses) {
          lines.push({ id, dir: 'in', text: '[auth]   token OK'                            });
        } else {
          lines.push({ id, dir: 'in', text: '[auth]   token MISSING — reject 401', err: true });
          blockedBy = 'auth';
        }
        break;
      case 'comp':  lines.push({ id, dir: 'in', text: '[comp]   negotiating gzip'           }); break;
      case 'rate':  lines.push({ id, dir: 'in', text: '[rate]   1 of 10 in window'          }); break;
      case 'retry': lines.push({ id, dir: 'in', text: '[retry]  attempt 1/3'                }); break;
      default: break;
    }
  }
  if (!blockedBy) {
    lines.push({ id: 'core', dir: 'core', text: '>> realLogic(req) -> 200 OK' });
  }
  // Unwind in reverse, skipping anything past the blocker.
  const unwindFrom = blockedBy ? orderedIds.slice(0, orderedIds.indexOf(blockedBy)) : orderedIds.slice();
  for (const id of unwindFrom.slice().reverse()) {
    switch (id) {
      case 'log':   lines.push({ id, dir: 'out', text: '[log]    response written (12ms)'   }); break;
      case 'auth':  lines.push({ id, dir: 'out', text: '[auth]   (pass-through)'            }); break;
      case 'comp':  lines.push({ id, dir: 'out', text: '[comp]   body gzipped (1.8 kB)'     }); break;
      case 'rate':  lines.push({ id, dir: 'out', text: '[rate]   counter += 1'              }); break;
      case 'retry': lines.push({ id, dir: 'out', text: '[retry]  success on attempt 1'      }); break;
      default: break;
    }
  }
  return { lines, blockedBy };
}

function consequenceFor(orderedIds) {
  if (orderedIds.length === 0) return 'No middleware — the request goes straight to the handler.';
  const iLog = orderedIds.indexOf('log');
  const iAuth = orderedIds.indexOf('auth');
  const iComp = orderedIds.indexOf('comp');
  const iRate = orderedIds.indexOf('rate');
  const iRetry = orderedIds.indexOf('retry');
  if (iAuth !== -1 && iLog !== -1 && iAuth < iLog) {
    return 'Auth runs before Logger — unauthenticated requests are rejected before they are ever logged. Good for privacy, bad for security audits.';
  }
  if (iAuth !== -1 && iLog !== -1 && iLog < iAuth) {
    return 'Logger runs before Auth — every attempt is logged, including failed auth. Useful for intrusion detection.';
  }
  if (iComp !== -1 && iRetry !== -1 && iComp < iRetry) {
    return 'Compress wraps Retry — each retry attempt re-compresses the body. Wasteful CPU. Put Retry outside Compress.';
  }
  if (iRate !== -1 && iRetry !== -1 && iRetry < iRate) {
    return 'Retry sits outside Rate-limit — a single failing request can burn through your quota in milliseconds. Put Rate-limit outside Retry.';
  }
  return 'Try moving Auth above or below Logger to see the trace change.';
}

// --- Adapter tab ----------------------------------------------------------

const FORMATS = {
  rest: { id: 'rest', label: 'REST JSON' },
  soap: { id: 'soap', label: 'SOAP XML' },
  gql:  { id: 'gql',  label: 'GraphQL' },
};

const SAMPLE = {
  rest: `{
  "method": "getUser",
  "params": { "id": 42 }
}`,
  soap: `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <getUser>
      <id>42</id>
    </getUser>
  </soap:Body>
</soap:Envelope>`,
  gql: `query {
  user(id: 42) {
    id
    name
  }
}`,
};

// Very small, illustrative translation. Not a real parser — we extract a
// canonical { operation, id } and re-emit in the target shape.
function canonicalize(src, text) {
  try {
    if (src === 'rest') {
      const j = JSON.parse(text);
      const op = j.method || 'unknown';
      const id = j.params?.id ?? null;
      return { op, id, ok: true };
    }
    if (src === 'soap') {
      const opMatch = text.match(/<(?:\w+:)?Body>\s*<(\w+)/);
      const idMatch = text.match(/<id>([^<]+)<\/id>/);
      return { op: opMatch?.[1] || 'unknown', id: idMatch ? Number(idMatch[1]) : null, ok: true };
    }
    if (src === 'gql') {
      const opMatch = text.match(/(\w+)\s*\(/);
      const idMatch = text.match(/id:\s*(\d+)/);
      const op = opMatch ? 'get' + opMatch[1][0].toUpperCase() + opMatch[1].slice(1) : 'unknown';
      return { op, id: idMatch ? Number(idMatch[1]) : null, ok: true };
    }
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
  return { ok: false, error: 'unrecognised source format' };
}

function emit(target, canon) {
  if (!canon.ok) return `// could not parse source:\n// ${canon.error}`;
  const { op, id } = canon;
  if (target === 'rest') {
    return JSON.stringify({ method: op, params: { id } }, null, 2);
  }
  if (target === 'soap') {
    return `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${op}>
      <id>${id}</id>
    </${op}>
  </soap:Body>
</soap:Envelope>`;
  }
  if (target === 'gql') {
    const field = op.replace(/^get/, '');
    const fieldLower = field ? field[0].toLowerCase() + field.slice(1) : 'item';
    return `query {
  ${fieldLower}(id: ${id}) {
    id
    name
  }
}`;
  }
  return '';
}

function rulesFor(src, target) {
  if (src === target) return [];
  const rules = [];
  if (src === 'soap') rules.push('Unwrap SOAP envelope → strip <soap:Body>.');
  if (src === 'gql')  rules.push('Parse GraphQL operation name → map to REST-style method.');
  if (src === 'rest') rules.push('Read JSON method + params.');
  if (target === 'soap') rules.push('Wrap in <soap:Envelope><soap:Body>... XML escape values.');
  if (target === 'gql')  rules.push('Emit `query { ... }` with named field; `id:` arg inline.');
  if (target === 'rest') rules.push('Emit `{ method, params }` JSON body.');
  return rules;
}

// --- Component ------------------------------------------------------------

export default function DecoratorAdapterWidget() {
  const [tab, setTab] = useState('decorator');
  return (
    <div className="widget">
      <div className="widget-title">Decorator & Adapter — wrap and translate</div>
      <div className="controls">
        <div className="pill-group">
          <button className={`btn ${tab === 'decorator' ? 'btn-accent' : ''}`} onClick={() => setTab('decorator')}>Decorator</button>
          <button className={`btn ${tab === 'adapter' ? 'btn-accent' : ''}`} onClick={() => setTab('adapter')}>Adapter</button>
        </div>
      </div>
      {tab === 'decorator' ? <DecoratorTab /> : <AdapterTab />}
    </div>
  );
}

function DecoratorTab() {
  const [enabled, setEnabled] = useState({ log: true, auth: true, comp: true, rate: false, retry: false });
  const [order, setOrder] = useState(['log', 'auth', 'comp', 'rate', 'retry']);
  const [authPasses, setAuthPasses] = useState(true);
  const [trace, setTrace] = useState(null);

  const activeOrder = useMemo(() => order.filter((id) => enabled[id]), [order, enabled]);

  function toggle(id) {
    setEnabled((e) => ({ ...e, [id]: !e[id] }));
    setTrace(null);
  }
  function move(id, dir) {
    setOrder((o) => {
      // Reorder among ACTIVE items only (preserve disabled positions visually).
      const active = o.filter((x) => enabled[x]);
      const i = active.indexOf(id);
      if (i === -1) return o;
      const j = i + dir;
      if (j < 0 || j >= active.length) return o;
      const swapped = active.slice();
      [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
      // Splice the new active order back into the original list.
      const result = [];
      let k = 0;
      for (const orig of o) {
        if (enabled[orig]) { result.push(swapped[k++]); } else { result.push(orig); }
      }
      return result;
    });
    setTrace(null);
  }
  function send() {
    setTrace(traceFor(activeOrder, authPasses));
  }

  const caption = consequenceFor(activeOrder);

  return (
    <>
      <div className="controls" style={{ flexWrap: 'wrap' }}>
        {Object.values(MIDDLEWARE).map((m) => (
          <label key={m.id} style={toggleStyle(enabled[m.id], m.color)}>
            <input type="checkbox" checked={enabled[m.id]} onChange={() => toggle(m.id)} />
            <span style={{ marginLeft: '0.4em' }}>{m.label}</span>
          </label>
        ))}
      </div>

      <div className="controls" style={{ alignItems: 'center' }}>
        <button className="btn btn-accent" onClick={send} disabled={activeOrder.length === 0 && false}>Send request</button>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3em' }}>
          <input type="checkbox" checked={authPasses} onChange={(e) => { setAuthPasses(e.target.checked); setTrace(null); }} />
          request has valid token
        </label>
      </div>

      <div className="widget-stage" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(260px, 1.4fr)', gap: '0.8rem', alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Chain (outer → inner)</div>
          {activeOrder.length === 0 && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-faint)' }}>
              No layers enabled — the handler runs bare.
            </div>
          )}
          <motion.ul layout style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <AnimatePresence>
              {activeOrder.map((id, idx) => {
                const m = MIDDLEWARE[id];
                return (
                  <motion.li
                    key={id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      background: m.color,
                      border: '1.5px solid var(--ink)',
                      borderRadius: 'var(--radius)',
                      padding: '0.3rem 0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ color: 'var(--ink-soft)', minWidth: '1.4em' }}>{idx + 1}.</span>
                    <span style={{ flex: 1 }}>{m.label}</span>
                    <button className="btn btn-ghost" style={miniBtn} onClick={() => move(id, -1)} disabled={idx === 0} aria-label="move up">↑</button>
                    <button className="btn btn-ghost" style={miniBtn} onClick={() => move(id, +1)} disabled={idx === activeOrder.length - 1} aria-label="move down">↓</button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            <motion.li layout style={{
              background: 'var(--paper-deep)',
              border: '1.5px dashed var(--ink)',
              borderRadius: 'var(--radius)',
              padding: '0.3rem 0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              color: 'var(--ink-soft)',
            }}>
              core: realLogic(req)
            </motion.li>
          </motion.ul>
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Trace</div>
          <div className="code-block" style={{ minHeight: 160, fontSize: '0.82rem', padding: '0.5rem 0.7rem' }}>
            {!trace && <span style={{ color: 'var(--ink-faint)' }}>Press "Send request" to walk the chain.</span>}
            <AnimatePresence>
              {trace && trace.lines.map((l, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: l.dir === 'out' ? 6 : -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.04 }}
                  style={{
                    color: l.err ? 'var(--accent)' : l.dir === 'core' ? '#1c6dd0' : 'var(--ink)',
                    paddingLeft: l.dir === 'core' ? 0 : `${Math.min(i, trace.lines.length - 1 - i) * 0.8}em`,
                    fontWeight: l.dir === 'core' ? 600 : 400,
                  }}
                >
                  {l.dir === 'in' ? '→ ' : l.dir === 'out' ? '← ' : '   '}{l.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="callout">
        <strong>Order matters.</strong> {caption}
      </div>
    </>
  );
}

function AdapterTab() {
  const [src, setSrc] = useState('rest');
  const [target, setTarget] = useState('soap');
  const [input, setInput] = useState(SAMPLE.rest);
  const [touched, setTouched] = useState(false);

  function pickSrc(next) {
    setSrc(next);
    // Only overwrite the textarea if the learner hasn't customised it.
    if (!touched) setInput(SAMPLE[next]);
    else if (input.trim() === '' || input === SAMPLE[src]) { setInput(SAMPLE[next]); setTouched(false); }
  }

  const canon = useMemo(() => canonicalize(src, input), [src, input]);
  const passthrough = src === target;
  const output = passthrough ? input : emit(target, canon);
  const rules = rulesFor(src, target);

  return (
    <>
      <div className="controls" style={{ flexWrap: 'wrap', gap: '0.8rem' }}>
        <label style={selectLabel}>
          <span style={selectCaption}>Source</span>
          <select value={src} onChange={(e) => pickSrc(e.target.value)} style={selectStyle}>
            {Object.values(FORMATS).map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>
        <label style={selectLabel}>
          <span style={selectCaption}>Target</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} style={selectStyle}>
            {Object.values(FORMATS).map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>
        <button className="btn btn-ghost" onClick={() => { setInput(SAMPLE[src]); setTouched(false); }}>Reset payload</button>
      </div>

      <div className="widget-stage" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
        <svg viewBox="0 0 700 90" width="100%" style={{ maxWidth: 700 }}>
          <defs>
            <marker id="da-arr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--ink)" />
            </marker>
          </defs>
          <FlowBox x={90}  y={45} label={FORMATS[src].label}    sublabel="source"  fill="#cfe5ff" />
          <FlowBox x={350} y={45} label="Adapter"               sublabel={passthrough ? 'pass-through' : 'translates'} fill={passthrough ? 'var(--paper-deep)' : 'var(--accent-soft)'} highlight={!passthrough} />
          <FlowBox x={610} y={45} label={FORMATS[target].label} sublabel="target"  fill="#d9ead3" />
          <line x1={150} y1={45} x2={290} y2={45} stroke="var(--ink)" strokeWidth={2} markerEnd="url(#da-arr)" />
          <line x1={410} y1={45} x2={550} y2={45} stroke="var(--ink)" strokeWidth={2} markerEnd="url(#da-arr)" />
        </svg>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Input payload</div>
            <textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); setTouched(true); }}
              spellCheck={false}
              style={{
                width: '100%',
                minHeight: 160,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                padding: '0.5rem 0.7rem',
                border: '1.5px solid var(--ink)',
                borderRadius: 'var(--radius)',
                background: 'var(--paper)',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
              Translated output {passthrough && <span style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }}>(no adapter needed)</span>}
            </div>
            <pre className="code-block" style={{ margin: 0, minHeight: 160, fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {output}
            </pre>
          </div>
        </div>
      </div>

      <div className="callout">
        {passthrough ? (
          <><strong>Source equals target.</strong> No translation — the payload passes straight through. An adapter only earns its keep across an interface gap.</>
        ) : (
          <>
            <strong>Translation rules applied:</strong>
            <ul style={{ margin: '0.3rem 0 0 1.2rem', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
              {rules.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

function FlowBox({ x, y, label, sublabel, fill, highlight }) {
  const w = 120, h = 60;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6}
        fill={fill} stroke="var(--ink)" strokeWidth={highlight ? 3 : 2} />
      <text x={x} y={y - 4} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{label}</text>
      <text x={x} y={y + 14} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>{sublabel}</text>
    </g>
  );
}

// --- inline styles --------------------------------------------------------

const miniBtn = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  padding: '0.1rem 0.4rem',
  lineHeight: 1,
};

function toggleStyle(on, color) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25em 0.55em',
    border: '1.5px solid var(--ink)',
    borderRadius: 'var(--radius)',
    background: on ? color : 'var(--paper)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.82rem',
    cursor: 'pointer',
    userSelect: 'none',
  };
}

const selectLabel = {
  display: 'inline-flex',
  flexDirection: 'column',
  gap: '0.2rem',
};

const selectCaption = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.72rem',
  color: 'var(--ink-soft)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const selectStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.85rem',
  padding: '0.25rem 0.4rem',
  border: '1.5px solid var(--ink)',
  borderRadius: 'var(--radius)',
  background: 'var(--paper)',
};
