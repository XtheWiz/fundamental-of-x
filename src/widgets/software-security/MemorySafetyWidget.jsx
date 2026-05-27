import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

// Educational sandbox visualising a classic stack buffer overflow.
//
// Layout (top of frame at top of diagram, growing downward in display, but
// reflecting how `strcpy` writes upward into adjacent saved state):
//
//   [ buf[16] ........ ][ canary ][ saved_fp ][ return_addr ][ caller_args ]
//
// The learner types into the buffer. After 16 bytes, writes spill into the
// canary slot, then the saved frame pointer, then the saved return address.
// Toggles for stack canary / ASLR / NX explain what each mitigation catches.
//
// Strictly defensive: no real shellcode, no real addresses, no working exploit.
// Smashed bytes are rendered as opaque hex placeholders.

const BUF_LEN = 16;
const CANARY_LEN = 4;
const FP_LEN = 4;
const RET_LEN = 4;
const ARGS_LEN = 4;
const CELL = 22;
const CELL_GAP = 2;
const TOTAL_BYTES = BUF_LEN + CANARY_LEN + FP_LEN + RET_LEN + ARGS_LEN;

const REGIONS = [
  { key: 'buf',    label: 'buf[16]',      len: BUF_LEN,    color: 'var(--paper)' },
  { key: 'canary', label: 'canary',       len: CANARY_LEN, color: '#fff2cc' },
  { key: 'fp',     label: 'saved_fp',     len: FP_LEN,     color: '#cfe2f3' },
  { key: 'ret',    label: 'return_addr',  len: RET_LEN,    color: '#d9ead3' },
  { key: 'args',   label: 'caller_args',  len: ARGS_LEN,   color: '#ead1dc' },
];

// A small, deterministic pseudo-random for "addresses" — we never emit real
// addresses, this is purely a visual stand-in randomised when the learner
// clicks Run with ASLR on.
function fakeAddr(seed, offset = 0) {
  // Mix the seed and offset into a hex blob that LOOKS like an address but
  // is obviously a placeholder (high bits forced).
  let x = (seed * 2654435761 + offset * 0x9e3779b1) >>> 0;
  const hex = x.toString(16).padStart(8, '0').toUpperCase();
  return '0x' + hex.slice(0, 4) + '_' + hex.slice(4);
}

function byteHex(ch) {
  return ch.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase();
}

function regionOf(byteIdx) {
  let cursor = 0;
  for (const r of REGIONS) {
    if (byteIdx < cursor + r.len) return r.key;
    cursor += r.len;
  }
  return 'args';
}

function regionStart(key) {
  let cursor = 0;
  for (const r of REGIONS) {
    if (r.key === key) return cursor;
    cursor += r.len;
  }
  return 0;
}

export default function MemorySafetyWidget() {
  const [input, setInput] = useState('hello');
  const [canary, setCanary] = useState(true);
  const [aslr, setAslr] = useState(false);
  const [nx, setNx] = useState(false);
  const [runSeed, setRunSeed] = useState(1);

  // Clamp learner input so we never render past the frame in the diagram.
  const bytesWritten = Math.min(input.length, TOTAL_BYTES);
  const overflowBytes = Math.max(0, input.length - BUF_LEN);
  const smashedCanary = overflowBytes > 0 && bytesWritten > BUF_LEN;
  const smashedFp = bytesWritten > BUF_LEN + CANARY_LEN;
  const smashedRet = bytesWritten > BUF_LEN + CANARY_LEN + FP_LEN;

  // Symbolic addresses; randomised per "run" when ASLR is on.
  const addrs = useMemo(() => ({
    bufBase: aslr ? fakeAddr(runSeed, 1) : '0x7FFF_BUF0',
    retOrig: aslr ? fakeAddr(runSeed, 2) : '0x0040_05AB',
  }), [aslr, runSeed]);

  // Compute verdict from input + toggles. Re-evaluates on every keystroke.
  const verdict = useMemo(() => {
    if (overflowBytes === 0) {
      return {
        tone: 'ok',
        title: 'Within bounds.',
        caption: `Wrote ${bytesWritten}/${BUF_LEN} bytes into buf. No adjacent state touched.`,
      };
    }
    if (canary && smashedCanary) {
      return {
        tone: 'detected',
        title: '*** stack smashing detected ***, abort',
        caption: `The canary word was overwritten before the function returned. libc notices the mismatch and kills the process before control transfers.`,
      };
    }
    if (!smashedRet) {
      return {
        tone: 'warn',
        title: 'Overflow into adjacent state.',
        caption: `${overflowBytes} byte(s) spilled past buf. ${smashedFp ? 'Saved frame pointer corrupted — caller frame will be wrong.' : 'Adjacent slot corrupted.'} Return address still intact.`,
      };
    }
    // RET hijacked. ASLR / NX shape the outcome.
    const symbolicTarget = 'ADDR_SMASHED_BY_INPUT';
    if (aslr && nx) {
      return {
        tone: 'mitigated',
        title: `RET overwritten with ${symbolicTarget}`,
        caption: `ASLR re-randomised the layout this run (buf at ${addrs.bufBase}), so any prewritten target the attacker baked in won't land. And NX means even if it did land on the buffer, the CPU refuses to execute data there.`,
      };
    }
    if (aslr) {
      return {
        tone: 'mitigated',
        title: `RET overwritten with ${symbolicTarget}`,
        caption: `ASLR re-randomised the layout (buf at ${addrs.bufBase} this run). A prewritten exploit address would no longer point where the attacker expected. Click Run to re-randomise.`,
      };
    }
    if (nx) {
      return {
        tone: 'mitigated',
        title: `RET overwritten with ${symbolicTarget}`,
        caption: `Even if RET points back into buf, the stack is marked non-executable — the CPU faults on the first instruction. Attacker would have to pivot to ROP (a much harder, separate topic).`,
      };
    }
    return {
      tone: 'pwn',
      title: `RET hijacked to ${symbolicTarget} — pretend code execution`,
      caption: `No canary, no ASLR, no NX. On return, the CPU pops the smashed value off the stack and jumps. In the real world this is where shellcode would have run — we don't show any here.`,
    };
  }, [overflowBytes, bytesWritten, canary, smashedCanary, smashedFp, smashedRet, aslr, nx, addrs]);

  function reset() {
    setInput('');
  }
  function rerun() {
    setRunSeed((s) => s + 1);
  }

  return (
    <div className="widget">
      <div className="widget-title">Memory safety — stack smashing, visualised</div>

      <div className="controls">
        <label className="field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 280px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
            strcpy(buf, …) input:
          </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, TOTAL_BYTES))}
            placeholder="type here…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', font: 'inherit', fontFamily: 'var(--font-mono)' }}
          />
        </label>
        <button className="btn" onClick={reset}>Clear</button>
        <button className="btn btn-accent" onClick={rerun} disabled={!aslr} title={aslr ? 'Re-randomise layout' : 'ASLR is off — nothing to re-randomise'}>
          Run (re-randomise)
        </button>
      </div>

      <div className="controls">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={canary} onChange={(e) => setCanary(e.target.checked)} />
          Stack canary
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={aslr} onChange={(e) => setAslr(e.target.checked)} />
          ASLR
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={nx} onChange={(e) => setNx(e.target.checked)} />
          Non-executable stack
        </label>
      </div>

      <div className="widget-stage" style={{ paddingTop: '1rem' }}>
        <StackDiagram input={input} bytesWritten={bytesWritten} canaryOn={canary} />
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">Bytes written</div>
          <div className="value">{bytesWritten}</div>
        </div>
        <div className={`metric ${overflowBytes > 0 ? 'accent' : ''}`}>
          <div className="label">Overflow</div>
          <div className="value">{overflowBytes}</div>
        </div>
        <div className="metric">
          <div className="label">buf base</div>
          <div className="value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{addrs.bufBase}</div>
        </div>
        <div className="metric">
          <div className="label">orig RET</div>
          <div className="value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{addrs.retOrig}</div>
        </div>
      </div>

      <div className="callout">
        <strong style={{ color: verdictColor(verdict.tone) }}>{verdict.title}</strong>
        <div style={{ marginTop: '0.4rem' }}>{verdict.caption}</div>
      </div>

      <SafePattern />
    </div>
  );
}

function verdictColor(tone) {
  switch (tone) {
    case 'ok':        return '#2a8a3e';
    case 'warn':      return '#c47a00';
    case 'detected':  return '#1c6dd0';
    case 'mitigated': return '#1c6dd0';
    case 'pwn':       return 'var(--accent)';
    default:          return 'var(--ink)';
  }
}

function StackDiagram({ input, bytesWritten, canaryOn }) {
  // Lay out regions vertically (one row per region) with labels on the left.
  // Each row shows that region's bytes as small squares.
  const rowHeight = CELL + 14;
  const labelWidth = 110;
  const gridWidth = BUF_LEN * (CELL + CELL_GAP); // longest row sets width
  const width = labelWidth + gridWidth + 24;
  const height = REGIONS.length * rowHeight + 30;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: width }}>
      <text x={labelWidth} y={14} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>
        low addr → growth direction of strcpy →
      </text>
      {REGIONS.map((region, rIdx) => {
        const y = 24 + rIdx * rowHeight;
        const startByte = regionStart(region.key);
        return (
          <g key={region.key}>
            <text x={labelWidth - 8} y={y + CELL / 2 + 4} textAnchor="end"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>
              {region.label}
            </text>
            {Array.from({ length: region.len }).map((_, i) => {
              const byteIdx = startByte + i;
              const filled = byteIdx < bytesWritten;
              const isOverflow = filled && byteIdx >= BUF_LEN;
              const ch = input[byteIdx];
              let fill = region.color;
              if (filled && !isOverflow) fill = 'var(--accent-soft, #fde2e2)';
              if (isOverflow) fill = 'var(--accent)';
              // Canary cell when off looks different (just empty slot).
              if (region.key === 'canary' && !canaryOn) fill = '#eeeeee';
              return (
                <motion.g key={i}
                  initial={false}
                  animate={isOverflow ? { y: [-2, 0] } : { y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <rect
                    x={labelWidth + i * (CELL + CELL_GAP)}
                    y={y}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    fill={fill}
                    stroke="var(--ink)"
                    strokeWidth={1.2}
                  />
                  <text
                    x={labelWidth + i * (CELL + CELL_GAP) + CELL / 2}
                    y={y + CELL / 2 + 4}
                    textAnchor="middle"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      fontWeight: 600,
                      fill: isOverflow ? 'white' : 'var(--ink)',
                    }}
                  >
                    {filled ? renderCell(region.key, ch, isOverflow) : ''}
                  </text>
                </motion.g>
              );
            })}
            {/* Annotation per region when smashed */}
            {regionSmashedNote(region, bytesWritten, canaryOn) && (
              <text
                x={labelWidth + region.len * (CELL + CELL_GAP) + 8}
                y={y + CELL / 2 + 4}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--accent)', fontWeight: 600 }}
              >
                {regionSmashedNote(region, bytesWritten, canaryOn)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function renderCell(regionKey, ch, isOverflow) {
  if (!isOverflow) {
    // Inside buf — show ASCII char (or hex for non-printables).
    if (!ch) return '';
    const code = ch.charCodeAt(0);
    if (code >= 32 && code < 127) return ch;
    return byteHex(ch);
  }
  // Overflow region: never show the raw char (avoid implying real exploit
  // payload). Show the hex byte — that's what's actually being smashed in.
  return ch ? byteHex(ch) : '';
}

function regionSmashedNote(region, bytesWritten, canaryOn) {
  const start = regionStart(region.key);
  const end = start + region.len;
  const touched = bytesWritten > start && start >= BUF_LEN;
  if (!touched) return null;
  if (region.key === 'canary') return canaryOn ? 'canary trip!' : '(canary off)';
  if (region.key === 'fp')     return 'FP corrupted';
  if (region.key === 'ret' && bytesWritten > start) return 'RET overwritten';
  if (region.key === 'args' && bytesWritten >= end) return 'spilled into caller';
  return null;
}

function SafePattern() {
  return (
    <div className="pill-group" style={{ display: 'block', borderRadius: 'var(--radius)', marginTop: '1rem', padding: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <div style={{ padding: '0.75rem 0.9rem', borderRight: '2px solid var(--ink)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--accent)' }}>
            Unsafe — no bound
          </div>
          <pre className="code-block" style={{ margin: 0 }}>{`char buf[16];
strcpy(buf, user_input);   // writes until '\\0'`}</pre>
        </div>
        <div style={{ padding: '0.75rem 0.9rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#2a8a3e' }}>
            Safe — bounded / owned
          </div>
          <pre className="code-block" style={{ margin: 0 }}>{`// C: bounded copy, always NUL-terminate
char buf[16];
strncpy(buf, user_input, sizeof(buf) - 1);
buf[sizeof(buf) - 1] = '\\0';

// Rust: String owns its bytes, grows as needed
let buf: String = user_input.to_string();`}</pre>
        </div>
      </div>
    </div>
  );
}
