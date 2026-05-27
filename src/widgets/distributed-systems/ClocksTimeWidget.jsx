import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Four clock models, side by side, on the same set of events.
// The learner sets a per-node skew, fires events, picks two to compare,
// and reads the verdict each model gives. Wall-clock ordering breaks
// silently — NTP narrows the gap, TrueTime owns the uncertainty, HLC
// preserves causality without strict sync.

const MODELS = [
  { key: 'none', name: 'No sync',
    note: 'Each node trusts its own (skewed) wall clock. Crank the skews — events appear out of order and the verdict lies.' },
  { key: 'ntp',  name: 'NTP',
    note: 'Every few seconds the nodes pull toward a shared reference (blue pulse). Most skew vanishes; residual jitter remains.' },
  { key: 'tt',   name: 'TrueTime',
    note: 'Each timestamp is an interval [earliest, latest]. Commit waits out the interval. Overlap means the model refuses to lie.' },
  { key: 'hlc',  name: 'HLC',
    note: 'Physical time plus a logical counter. Causally-related events keep their order even with arbitrary skew — no atomic clock needed.' },
];

const NODE_COLORS = ['#1c6dd0', '#2a8a3e', '#b58900'];
const TT_EPSILON = 350; // ms — TrueTime uncertainty half-width

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const m = ms % 1000;
  return `${s}.${String(m).padStart(3, '0')}s`;
}

// Per-model timestamp computation for a single event.
// Each event captures the "true" wall-clock the sim believes is real.
function stampFor(model, event, ntpOffsets) {
  const skewed = event.trueT + event.skewMs;
  switch (model) {
    case 'none':
      return { kind: 'point', t: skewed };
    case 'ntp': {
      // NTP correction: subtract whatever residual offset the node held
      // at the moment of the event. Small residual jitter remains.
      const corrected = skewed - (ntpOffsets[event.node] ?? event.skewMs);
      return { kind: 'point', t: corrected };
    }
    case 'tt':
      return { kind: 'interval', lo: skewed - TT_EPSILON, hi: skewed + TT_EPSILON };
    case 'hlc':
      return { kind: 'hlc', pt: event.hlc.pt, l: event.hlc.l };
    default:
      return { kind: 'point', t: skewed };
  }
}

// Verdict for an A vs B comparison under one model.
function verdict(model, a, b, ntpOffsets) {
  if (!a || !b) return '—';
  const sa = stampFor(model, a, ntpOffsets);
  const sb = stampFor(model, b, ntpOffsets);
  if (model === 'tt') {
    if (sa.hi < sb.lo) return 'A before B';
    if (sb.hi < sa.lo) return 'B before A';
    return 'overlap — commit-wait required';
  }
  if (model === 'hlc') {
    // HLC respects causality: events on the same node strictly increase,
    // and event B "happens after" event A whenever B's HLC > A's HLC.
    const ka = sa.pt * 1e6 + sa.l;
    const kb = sb.pt * 1e6 + sb.l;
    if (ka < kb) return 'A before B';
    if (kb < ka) return 'B before A';
    return 'concurrent';
  }
  if (sa.t < sb.t) return 'A before B';
  if (sb.t < sa.t) return 'B before A';
  return 'simultaneous (can\'t tell)';
}

// Count "out of order" pairs: where the wall-clock ordering under the
// chosen model disagrees with the true causal order (event index).
function outOfOrderCount(model, events, ntpOffsets) {
  let bad = 0;
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const v = verdict(model, events[i], events[j], ntpOffsets);
      if (v === 'B before A') bad += 1;
    }
  }
  return bad;
}

export default function ClocksTimeWidget() {
  const [model, setModel] = useState('none');
  const [skews, setSkews] = useState([0, 0, 0]);
  const [events, setEvents] = useState([]);
  const [tick, setTick] = useState(0);
  const [pickA, setPickA] = useState(null);
  const [pickB, setPickB] = useState(null);
  const [ntpPulse, setNtpPulse] = useState(0);
  const [ntpOffsets, setNtpOffsets] = useState([0, 0, 0]);
  const startRef = useRef(Date.now());
  const hlcRef = useRef({ pt: 0, l: 0 }); // shared sim view; per-node HLC tracked via events
  const lastHlcByNode = useRef([{ pt: 0, l: 0 }, { pt: 0, l: 0 }, { pt: 0, l: 0 }]);

  // Tick the simulated wall clocks twice a second.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  // NTP sync sweep: every 4 seconds, snapshot current skews as the
  // "known offsets" the node will subtract from its readings, leaving
  // a small residual jitter. Trigger an animation pulse too.
  useEffect(() => {
    if (model !== 'ntp') return;
    const id = setInterval(() => {
      setNtpPulse((p) => p + 1);
      setNtpOffsets(skews.map((s) => s + (Math.random() * 60 - 30)));
    }, 4000);
    return () => clearInterval(id);
  }, [model, skews]);

  const trueNow = (Date.now() - startRef.current);

  // Render wall-clock for a node based on its skew (and NTP correction
  // if active).
  function nodeClockMs(i) {
    const skewed = trueNow + skews[i] * 1000;
    if (model === 'ntp') return skewed - (ntpOffsets[i] ?? skews[i] * 1000);
    return skewed;
  }

  function fireEvent(nodeIdx) {
    const trueT = Date.now() - startRef.current;
    const skewMs = skews[nodeIdx] * 1000;
    // HLC update for that node: pt = max(prev.pt, physical), l increments on tie.
    const prev = lastHlcByNode.current[nodeIdx];
    const phys = trueT;
    const newPt = Math.max(prev.pt, phys, hlcRef.current.pt);
    const newL = newPt === prev.pt ? prev.l + 1 : 0;
    lastHlcByNode.current[nodeIdx] = { pt: newPt, l: newL };
    hlcRef.current = { pt: newPt, l: newL };
    const label = String.fromCharCode(65 + events.length);
    const ev = {
      id: events.length,
      label,
      node: nodeIdx,
      trueT,
      skewMs,
      hlc: { pt: newPt, l: newL },
    };
    setEvents((es) => [...es, ev]);
  }

  function resetAll() {
    setEvents([]);
    setPickA(null);
    setPickB(null);
    lastHlcByNode.current = [{ pt: 0, l: 0 }, { pt: 0, l: 0 }, { pt: 0, l: 0 }];
    hlcRef.current = { pt: 0, l: 0 };
  }

  const maxSkew = useMemo(() => {
    const xs = skews.map(Math.abs);
    return Math.max(...xs);
  }, [skews]);

  const ooo = useMemo(
    () => outOfOrderCount(model, events, ntpOffsets),
    [model, events, ntpOffsets]
  );

  const resolvable = useMemo(() => {
    // A conflict is "resolvable" if the model can tell which came first
    // for any pair. TrueTime says no when intervals overlap; HLC and
    // simple wall-clocks return false only on exact ties.
    let total = 0, good = 0;
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        total += 1;
        const v = verdict(model, events[i], events[j], ntpOffsets);
        if (v === 'A before B' || v === 'B before A') good += 1;
      }
    }
    return total === 0 ? '—' : `${good}/${total}`;
  }, [model, events, ntpOffsets]);

  const a = events.find((e) => e.id === pickA);
  const b = events.find((e) => e.id === pickB);
  const cmp = verdict(model, a, b, ntpOffsets);

  // Map a timestamp to an x coordinate on the timeline.
  const tlMin = 0;
  const tlMax = Math.max(8000, trueNow + 1500);
  const x = (t) => 40 + ((t - tlMin) / (tlMax - tlMin)) * 620;

  return (
    <div className="widget">
      <div className="widget-title">Clocks &amp; time — four models, one set of events</div>

      <div className="controls" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
        <div className="pill-group" role="radiogroup" aria-label="Clock model">
          {MODELS.map((m, i) => (
            <span key={m.key} style={{ position: 'relative' }}>
              <input
                type="radio"
                id={`ct-m-${m.key}`}
                name="ct-model"
                checked={model === m.key}
                onChange={() => setModel(m.key)}
              />
              <label htmlFor={`ct-m-${m.key}`}>{m.name}</label>
            </span>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={resetAll}>Reset events</button>
      </div>

      <div className="controls" style={{ flexWrap: 'wrap', gap: '0.8rem' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            border: `2px solid ${NODE_COLORS[i]}`, borderRadius: 6, padding: '0.4rem 0.6rem',
            display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 180,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong style={{ color: NODE_COLORS[i], fontFamily: 'var(--font-display)' }}>Node {i + 1}</strong>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                {fmt(nodeClockMs(i))}
              </span>
            </div>
            <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
              skew {skews[i] >= 0 ? '+' : ''}{skews[i].toFixed(1)}s
            </label>
            <input
              type="range" min={-2} max={2} step={0.1}
              value={skews[i]}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setSkews((s) => s.map((x, j) => (j === i ? v : x)));
              }}
            />
            <button className="btn" onClick={() => fireEvent(i)} style={{ padding: '0.3em 0.6em', fontSize: '0.85rem' }}>
              Fire event on N{i + 1}
            </button>
          </div>
        ))}
      </div>

      <div className="widget-stage" style={{ minHeight: 240, padding: '0.6rem' }}>
        <svg viewBox="0 0 700 220" width="100%" style={{ maxWidth: 700 }}>
          {/* Three node lanes */}
          {[0, 1, 2].map((i) => {
            const y = 40 + i * 55;
            return (
              <g key={i}>
                <text x={6} y={y + 4} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: NODE_COLORS[i], fontWeight: 700 }}>
                  N{i + 1}
                </text>
                <line x1={40} y1={y} x2={660} y2={y} stroke="var(--ink-faint)" strokeWidth={1.5} />
                {/* NTP pulse */}
                <AnimatePresence>
                  {model === 'ntp' && (
                    <motion.circle
                      key={`ntp-${i}-${ntpPulse}`}
                      cx={650} cy={y} r={4}
                      fill="#1c6dd0"
                      initial={{ opacity: 1, r: 4 }}
                      animate={{ opacity: 0, r: 22 }}
                      transition={{ duration: 1.0 }}
                    />
                  )}
                </AnimatePresence>
              </g>
            );
          })}

          {/* Time axis */}
          <line x1={40} y1={205} x2={660} y2={205} stroke="var(--ink)" strokeWidth={1.5} />
          {[0, 2, 4, 6, 8].map((s) => {
            const tx = x(s * 1000);
            return (
              <g key={s}>
                <line x1={tx} y1={203} x2={tx} y2={209} stroke="var(--ink)" strokeWidth={1.2} />
                <text x={tx} y={219} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
                  {s}s
                </text>
              </g>
            );
          })}

          {/* Events on each lane */}
          {events.map((e) => {
            const y = 40 + e.node * 55;
            const stamp = stampFor(model, e, ntpOffsets);
            const selA = pickA === e.id, selB = pickB === e.id;
            if (stamp.kind === 'interval') {
              const x1 = x(stamp.lo), x2 = x(stamp.hi);
              return (
                <g key={e.id} style={{ cursor: 'pointer' }}
                  onClick={() => (selA ? setPickA(null) : selB ? setPickB(null) : pickA === null ? setPickA(e.id) : setPickB(e.id))}>
                  <rect x={x1} y={y - 9} width={Math.max(2, x2 - x1)} height={18}
                    fill={NODE_COLORS[e.node]} fillOpacity={0.18}
                    stroke={NODE_COLORS[e.node]} strokeWidth={1.4} rx={3} />
                  <circle cx={(x1 + x2) / 2} cy={y} r={selA || selB ? 7 : 5}
                    fill={NODE_COLORS[e.node]} stroke="var(--ink)" strokeWidth={selA || selB ? 2 : 1} />
                  <text x={(x1 + x2) / 2} y={y - 13} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 11, fill: 'var(--ink)', fontWeight: 700 }}>
                    {e.label}{selA ? ' (A)' : selB ? ' (B)' : ''}
                  </text>
                </g>
              );
            }
            const cx = stamp.kind === 'hlc' ? x(stamp.pt) : x(stamp.t);
            return (
              <g key={e.id} style={{ cursor: 'pointer' }}
                onClick={() => (selA ? setPickA(null) : selB ? setPickB(null) : pickA === null ? setPickA(e.id) : setPickB(e.id))}>
                <circle cx={cx} cy={y} r={selA || selB ? 8 : 6}
                  fill={NODE_COLORS[e.node]} stroke="var(--ink)" strokeWidth={selA || selB ? 2.5 : 1.5} />
                <text x={cx} y={y - 11} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 11, fill: 'var(--ink)', fontWeight: 700 }}>
                  {e.label}{selA ? ' (A)' : selB ? ' (B)' : ''}
                </text>
                {model === 'hlc' && (
                  <text x={cx} y={y + 18} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: 'var(--ink-soft)' }}>
                    {Math.floor(stamp.pt / 100)}|{stamp.l}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">model</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>{MODELS.find((m) => m.key === model).name}</div>
        </div>
        <div className={`metric ${maxSkew >= 1 ? 'accent' : ''}`}>
          <div className="label">max skew</div>
          <div className="value">{maxSkew.toFixed(1)}s</div>
        </div>
        <div className={`metric ${ooo > 0 ? 'accent' : ''}`}>
          <div className="label">out of order</div>
          <div className="value">{ooo}</div>
        </div>
        <div className="metric">
          <div className="label">resolvable</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>{resolvable}</div>
        </div>
        <div className="metric">
          <div className="label">events</div>
          <div className="value">{events.length}</div>
        </div>
      </div>

      <div className="controls" style={{ alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Compare</span>
        <select className="field" value={pickA ?? ''} onChange={(e) => setPickA(e.target.value === '' ? null : Number(e.target.value))}>
          <option value="">— A —</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.label} (N{e.node + 1})</option>)}
        </select>
        <span style={{ fontFamily: 'var(--font-mono)' }}>vs</span>
        <select className="field" value={pickB ?? ''} onChange={(e) => setPickB(e.target.value === '' ? null : Number(e.target.value))}>
          <option value="">— B —</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.label} (N{e.node + 1})</option>)}
        </select>
        <span className="btn btn-accent" style={{ pointerEvents: 'none', fontSize: '0.85rem' }}>
          {cmp}
        </span>
      </div>

      <div className="callout">
        <strong>{MODELS.find((m) => m.key === model).name}.</strong>{' '}
        {MODELS.find((m) => m.key === model).note}
      </div>

      <div className="log">
        {events.length === 0 && <div className="entry"><span className="t">·</span>No events yet — fire one on a node.</div>}
        {events.slice().reverse().map((e) => {
          const stamp = stampFor(model, e, ntpOffsets);
          let s;
          if (stamp.kind === 'interval') s = `[${fmt(stamp.lo)}, ${fmt(stamp.hi)}]`;
          else if (stamp.kind === 'hlc') s = `pt=${fmt(stamp.pt)} L=${stamp.l}`;
          else s = fmt(stamp.t);
          return (
            <div key={e.id} className="entry info">
              <span className="t">{e.label}</span>
              N{e.node + 1} → {s}
            </div>
          );
        })}
      </div>
    </div>
  );
}
