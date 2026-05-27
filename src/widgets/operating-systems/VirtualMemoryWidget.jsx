import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Virtual Memory Deep Dive: translate a 32-bit virtual address through a
// two-level page table (10/10/12 split, 4 KB pages), with a TLB short-circuit
// and a page-fault path that allocates/evicts frames.
//
// Tiny machine for legibility: 16 physical frames, 8 TLB entries (LRU).
// The thresholds at TLB size (8) and physical memory (16) are the punchline of
// the working-set benchmark slider.

const PD_BITS = 10, PT_BITS = 10, OFFSET_BITS = 12;
const TLB_SIZE = 8, PHYS_FRAMES = 16, VIRT_PAGE_POOL = 32, BENCH_ITERS = 4;

const toHex32 = (n) => '0x' + (n >>> 0).toString(16).padStart(8, '0').toUpperCase();
const toBin = (n, b) => (n >>> 0).toString(2).padStart(b, '0');
function splitAddr(a) {
  const offset = a & ((1 << OFFSET_BITS) - 1);
  const ptIdx = (a >>> OFFSET_BITS) & ((1 << PT_BITS) - 1);
  const pdIdx = (a >>> (OFFSET_BITS + PT_BITS)) & ((1 << PD_BITS) - 1);
  return { pdIdx, ptIdx, offset, vpn: a >>> OFFSET_BITS };
}
// Spread page ids across distinct PD entries so the walk visibly varies.
const pageIdToVAddr = (id) =>
  (((id * 7) & ((1 << PD_BITS) - 1)) << (OFFSET_BITS + PT_BITS)) |
  (((id * 13 + 3) & ((1 << PT_BITS) - 1)) << OFFSET_BITS);

const tlbBump = (t, vpn) => {
  const i = t.findIndex((e) => e.vpn === vpn);
  return i === -1 ? t : [t[i], ...t.slice(0, i), ...t.slice(i + 1)];
};
const tlbInsert = (t, e) => [e, ...t.filter((x) => x.vpn !== e.vpn)].slice(0, TLB_SIZE);
const tlbDrop = (t, vpn) => t.filter((e) => e.vpn !== vpn);

export default function VirtualMemoryWidget() {
  const initialAddr = pageIdToVAddr(0) | 0x123;
  const [addrInput, setAddrInput] = useState(toHex32(initialAddr));
  const [addr, setAddr] = useState(initialAddr);

  // Pre-populate first 8 working-set pages so the first translation succeeds.
  const initial = useMemo(() => {
    const map = {}, frames = new Array(PHYS_FRAMES).fill(null), fifo = [];
    for (let i = 0; i < 8; i++) {
      const vpn = pageIdToVAddr(i) >>> OFFSET_BITS;
      map[vpn] = i; frames[i] = vpn; fifo.push(vpn);
    }
    return { map, frames, fifo };
  }, []);

  const [ptMap, setPtMap] = useState(initial.map);
  const [frames, setFrames] = useState(initial.frames);
  const [fifo, setFifo] = useState(initial.fifo);
  const [tlb, setTlb] = useState([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [faults, setFaults] = useState(0);
  const [walk, setWalk] = useState(null); // {step, vpn, pdIdx, ptIdx, offset, frame, hit, fault}
  const [log, setLog] = useState('Enter a virtual address and press Translate.');
  const [workingSet, setWorkingSet] = useState(6);
  const [nextUnmappedId, setNextUnmappedId] = useState(8);
  const benchRef = useRef(null);

  const split = splitAddr(addr);
  const physAddr = walk && walk.frame != null ? (walk.frame << OFFSET_BITS) | split.offset : null;

  function animateWalk(base, delays) {
    delays.forEach(([ms, patch]) => setTimeout(
      () => setWalk((w) => (w && w.vpn === base.vpn ? { ...w, ...patch } : w)), ms
    ));
  }

  function translate(target) {
    const { vpn, pdIdx, ptIdx, offset } = splitAddr(target);
    const i = tlb.findIndex((e) => e.vpn === vpn);
    if (i !== -1) {
      const frame = tlb[i].frame;
      setHits((h) => h + 1);
      setTlb((t) => tlbBump(t, vpn));
      setWalk({ step: 4, vpn, pdIdx, ptIdx, offset, frame, hit: true, fault: false });
      setLog(`TLB hit on VPN ${vpn} -> frame ${frame}. Skipped the page-table walk.`);
      return;
    }
    setMisses((m) => m + 1);
    if (Object.prototype.hasOwnProperty.call(ptMap, vpn)) {
      const frame = ptMap[vpn];
      const base = { step: 1, vpn, pdIdx, ptIdx, offset, frame: null, hit: false, fault: false };
      setWalk(base);
      animateWalk(base, [[350, { step: 2 }], [700, { step: 3 }], [1050, { step: 4, frame } ]]);
      setTlb((t) => tlbInsert(t, { vpn, frame }));
      setLog(`TLB miss. Walk: PD[${pdIdx}] -> PT[${ptIdx}] -> frame ${frame}. Cached in TLB.`);
      return;
    }
    handleFault(target);
  }

  function handleFault(target) {
    const { vpn, pdIdx, ptIdx, offset } = splitAddr(target);
    setFaults((f) => f + 1);
    let nextFrames = frames.slice(), nextFifo = fifo.slice(), nextMap = { ...ptMap };
    let frame, victim = null;
    const free = nextFrames.indexOf(null);
    if (free !== -1) {
      frame = free;
    } else {
      victim = nextFifo.shift();
      frame = nextFrames.findIndex((v) => v === victim);
      delete nextMap[victim];
      setTlb((t) => tlbDrop(t, victim));
    }
    nextFrames[frame] = vpn; nextFifo.push(vpn); nextMap[vpn] = frame;
    setFrames(nextFrames); setFifo(nextFifo); setPtMap(nextMap);
    setTlb((t) => tlbInsert(t, { vpn, frame }));
    const base = { step: 0, vpn, pdIdx, ptIdx, offset, frame: null, hit: false, fault: true };
    setWalk(base);
    animateWalk(base, [[300, { step: 1 }], [600, { step: 2 }], [900, { step: 3 }], [1200, { step: 4, frame }]]);
    setLog(victim != null
      ? `Page fault on VPN ${vpn}. Evicted VPN ${victim} from frame ${frame}; mapped VPN ${vpn} -> frame ${frame}.`
      : `Page fault on VPN ${vpn}. Kernel allocated free frame ${frame}; mapped VPN ${vpn} -> frame ${frame}.`);
  }

  function onTranslateClick() {
    const p = parseAddr(addrInput);
    if (p == null) { setLog('Could not parse address. Use hex (0x...) or decimal.'); return; }
    setAddr(p); translate(p);
  }
  function onTouchUnmapped() {
    const id = nextUnmappedId;
    setNextUnmappedId((n) => n + 1);
    const a = pageIdToVAddr(id) | 0x040;
    setAddr(a); setAddrInput(toHex32(a)); translate(a);
  }
  function onReset() {
    setPtMap(initial.map); setFrames(initial.frames); setFifo(initial.fifo);
    setTlb([]); setHits(0); setMisses(0); setFaults(0); setWalk(null);
    setNextUnmappedId(8); setAddr(initialAddr); setAddrInput(toHex32(initialAddr));
    setLog('State reset. Page table holds working-set pages 0..7.');
  }
  function runBenchmark(ws) {
    setTlb([]); setHits(0); setMisses(0); setFaults(0);
    let mTlb = [], mFrames = frames.slice(), mFifo = fifo.slice(), mMap = { ...ptMap };
    let mH = 0, mM = 0, mF = 0;
    for (let it = 0; it < BENCH_ITERS; it++) {
      for (let pid = 0; pid < ws; pid++) {
        const vpn = pageIdToVAddr(pid) >>> OFFSET_BITS;
        if (mTlb.find((e) => e.vpn === vpn)) { mH++; mTlb = tlbBump(mTlb, vpn); continue; }
        mM++;
        if (!Object.prototype.hasOwnProperty.call(mMap, vpn)) {
          mF++;
          let frame;
          const free = mFrames.indexOf(null);
          if (free !== -1) frame = free;
          else {
            const victim = mFifo.shift();
            frame = mFrames.findIndex((v) => v === victim);
            delete mMap[victim]; mTlb = tlbDrop(mTlb, victim);
          }
          mFrames[frame] = vpn; mFifo.push(vpn); mMap[vpn] = frame;
          mTlb = tlbInsert(mTlb, { vpn, frame });
        } else {
          mTlb = tlbInsert(mTlb, { vpn, frame: mMap[vpn] });
        }
      }
    }
    setTlb(mTlb); setFrames(mFrames); setFifo(mFifo); setPtMap(mMap);
    setHits(mH); setMisses(mM); setFaults(mF); setWalk(null);
    const total = mH + mM;
    const rate = total === 0 ? 0 : Math.round((mH / total) * 100);
    setLog(`Swept ${ws} pages x ${BENCH_ITERS} iters. TLB hit rate ${rate}% (${mH}/${total}); page faults ${mF}.`);
  }
  function onWorkingSetChange(v) {
    setWorkingSet(v);
    if (benchRef.current) clearTimeout(benchRef.current);
    benchRef.current = setTimeout(() => runBenchmark(v), 80);
  }

  const total = hits + misses;
  const hitRate = total === 0 ? 0 : Math.round((hits / total) * 100);
  const framesFree = frames.filter((f) => f === null).length;

  return (
    <div className="widget">
      <div className="widget-title">Virtual memory — page tables, TLB, faults</div>

      <div className="controls">
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Virtual addr:</label>
        <input className="field" value={addrInput} onChange={(e) => setAddrInput(e.target.value)}
          style={{ width: '11ch', fontFamily: 'var(--font-mono)' }} />
        <button className="btn btn-accent" onClick={onTranslateClick}>Translate</button>
        <button className="btn" onClick={onTouchUnmapped}>Touch unmapped page</button>
        <button className="btn btn-ghost" onClick={onReset}>Reset</button>
      </div>

      <AddressBitfield addr={addr} split={split} />

      <div className="widget-stage" style={{ minHeight: 280 }}>
        <svg viewBox="0 0 720 260" width="100%" style={{ maxWidth: 720 }}>
          <defs>
            <marker id="vm-arr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--ink)" />
            </marker>
            <marker id="vm-arr-a" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--accent)" />
            </marker>
          </defs>

          <Stage x={40} y={130} w={70} h={48} label="CR3" sub="page-dir base"
            active={walk && walk.step >= 1 && !walk.hit} />
          <TableBox x={210} y={130} title="Page Directory" idx={split.pdIdx} bits={PD_BITS}
            highlight={walk && walk.step >= 1 && !walk.hit} present />
          <TableBox x={400} y={130} title={`Page Table [PD ${split.pdIdx}]`} idx={split.ptIdx} bits={PT_BITS}
            highlight={walk && walk.step >= 2 && !walk.hit}
            present={walk && walk.step >= 4 && !walk.fault} />
          <Stage x={620} y={130} w={80} h={60}
            label={walk && walk.step >= 4 ? `frame ${walk.frame}` : 'frame ?'}
            sub={walk && walk.step >= 4 ? toHex32((walk.frame << OFFSET_BITS) | walk.offset) : '— phys —'}
            active={walk && walk.step >= 4}
            fault={walk && walk.fault && walk.step < 4} />
          <TLBShortcut active={walk && walk.hit} />

          <AnimatePresence>
            {walk && !walk.hit && walk.step >= 1 && (
              <FlowArrow key="a1" x1={110} y1={130} x2={170} y2={130} accent />
            )}
            {walk && !walk.hit && walk.step >= 2 && (
              <FlowArrow key="a2" x1={250} y1={130} x2={360} y2={130} accent label={`PD[${split.pdIdx}]`} />
            )}
            {walk && !walk.hit && walk.step >= 3 && (
              <FlowArrow key="a3" x1={440} y1={130} x2={580} y2={130} accent label={`PT[${split.ptIdx}]`} />
            )}
            {walk && walk.fault && walk.step >= 1 && walk.step < 4 && (
              <motion.text key="ft" x={400} y={40} textAnchor="middle"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontFamily: 'var(--font-display)', fontSize: 14, fill: 'var(--accent)' }}>
                PAGE FAULT — kernel allocates frame
              </motion.text>
            )}
          </AnimatePresence>
        </svg>
      </div>

      <div className="metrics">
        <div className="metric"><div className="label">TLB HIT RATE</div><div className="value">{hitRate}%</div></div>
        <div className="metric"><div className="label">TLB HITS</div><div className="value">{hits}</div></div>
        <div className="metric"><div className="label">TLB MISSES</div><div className="value">{misses}</div></div>
        <div className="metric accent"><div className="label">PAGE FAULTS</div><div className="value">{faults}</div></div>
        <div className="metric"><div className="label">FRAMES FREE</div><div className="value">{framesFree}/{PHYS_FRAMES}</div></div>
        <div className="metric"><div className="label">WORKING SET</div><div className="value">{workingSet}</div></div>
      </div>

      <TLBPanel tlb={tlb} highlightVpn={walk ? walk.vpn : null} hit={walk ? walk.hit : false} />
      <PhysMemPanel frames={frames} highlightFrame={walk && walk.step >= 4 ? walk.frame : null} />

      <div className="controls" style={{ alignItems: 'center' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', minWidth: '15ch' }}>
          Benchmark working-set: <strong>{workingSet}</strong>
        </label>
        <input type="range" min="1" max={VIRT_PAGE_POOL} step="1" value={workingSet}
          onChange={(e) => onWorkingSetChange(+e.target.value)} style={{ flex: 1 }} />
        <button className="btn" onClick={() => runBenchmark(workingSet)}>Re-run</button>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '-0.3rem' }}>
        TLB size = {TLB_SIZE} entries. Physical memory = {PHYS_FRAMES} frames. Beyond either, the curve breaks.
      </div>

      <div className="callout">
        <strong>What just happened.</strong> {log}
        {physAddr != null && walk && (
          <div style={{ marginTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            phys = (frame {walk.frame} &lt;&lt; 12) | offset 0x{split.offset.toString(16)} = {toHex32(physAddr)}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function parseAddr(s) {
  if (!s) return null;
  const t = s.trim();
  if (!t) return null;
  const n = t.toLowerCase().startsWith('0x') ? parseInt(t, 16) : parseInt(t, 10);
  return Number.isFinite(n) && n >= 0 ? (n >>> 0) : null;
}

function AddressBitfield({ addr, split }) {
  const bin = toBin(addr, 32);
  const cell = { padding: '4px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', borderRight: '1px solid var(--ink)' };
  const lab = { fontSize: '0.65rem', color: 'var(--ink-soft)' };
  return (
    <div style={{ border: '2px solid var(--ink)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--paper)', margin: '0.6rem 0' }}>
      <div style={{ display: 'flex' }}>
        <div style={{ ...cell, flex: '10 1 0', background: 'var(--paper-deep)' }}>
          <div style={lab}>PD INDEX (10 bits)</div><div>{bin.slice(0, 10)}</div>
        </div>
        <div style={{ ...cell, flex: '10 1 0', background: 'var(--paper-deep)' }}>
          <div style={lab}>PT INDEX (10 bits)</div><div>{bin.slice(10, 20)}</div>
        </div>
        <div style={{ ...cell, flex: '12 1 0', borderRight: 'none' }}>
          <div style={lab}>OFFSET (12 bits)</div><div>{bin.slice(20, 32)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid var(--ink)' }}>
        <div style={{ ...cell, flex: '10 1 0' }}><strong>{split.pdIdx}</strong> <span style={{ color: 'var(--ink-soft)' }}>dec</span></div>
        <div style={{ ...cell, flex: '10 1 0' }}><strong>{split.ptIdx}</strong> <span style={{ color: 'var(--ink-soft)' }}>dec</span></div>
        <div style={{ ...cell, flex: '12 1 0', borderRight: 'none' }}>
          <strong>0x{split.offset.toString(16).padStart(3, '0')}</strong>
          <span style={{ color: 'var(--ink-soft)' }}> within 4 KB page</span>
        </div>
      </div>
    </div>
  );
}

function Stage({ x, y, w = 80, h = 50, label, sub, active, fault }) {
  return (
    <motion.g animate={{ scale: active ? 1.04 : 1 }} transition={{ duration: 0.25 }}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6}
        fill={fault ? '#fde2e2' : active ? 'var(--paper-deep)' : 'var(--paper)'}
        stroke={fault ? 'var(--accent)' : active ? 'var(--accent)' : 'var(--ink)'} strokeWidth={2.5} />
      <text x={x} y={y - 4} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>{label}</text>
      {sub && <text x={x} y={y + 12} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>{sub}</text>}
    </motion.g>
  );
}

function TableBox({ x, y, title, idx, bits, highlight, present }) {
  const w = 80, rowH = 8, rows = 6;
  return (
    <g>
      <rect x={x - w / 2} y={y - 50} width={w} height={100} rx={6}
        fill="var(--paper)" stroke={highlight ? 'var(--accent)' : 'var(--ink)'} strokeWidth={2.5} />
      <text x={x} y={y - 36} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 10 }}>{title}</text>
      <text x={x} y={y - 24} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: 'var(--ink-soft)' }}>
        {1 << bits} entries
      </text>
      {Array.from({ length: rows }).map((_, i) => (
        <rect key={i} x={x - w / 2 + 6} y={y - 18 + i * rowH} width={w - 12} height={rowH - 2} rx={1}
          fill={i === 3 && highlight ? (present ? '#d9ead3' : 'var(--accent)') : 'var(--paper-deep)'}
          stroke="var(--ink)" strokeWidth={0.6} />
      ))}
      <text x={x} y={y - 18 + 3 * rowH + rowH / 2 + 3} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: highlight ? 'var(--ink)' : 'var(--ink-soft)' }}>
        [{idx}]
      </text>
    </g>
  );
}

function FlowArrow({ x1, y1, x2, y2, accent, label }) {
  const color = accent ? 'var(--accent)' : 'var(--ink)';
  const marker = accent ? 'vm-arr-a' : 'vm-arr';
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5} markerEnd={`url(#${marker})`} />
      {label && <text x={(x1 + x2) / 2} y={y1 - 8} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: color, fontWeight: 600 }}>{label}</text>}
    </motion.g>
  );
}

function TLBShortcut({ active }) {
  return (
    <motion.g animate={{ opacity: active ? 1 : 0.18 }} transition={{ duration: 0.2 }}>
      <path d="M 60 100 Q 360 30 600 100" fill="none"
        stroke={active ? 'var(--accent)' : 'var(--ink-soft)'}
        strokeWidth={active ? 3 : 1.5}
        strokeDasharray={active ? undefined : '4 4'} markerEnd="url(#vm-arr-a)" />
      <text x={360} y={28} textAnchor="middle"
        style={{ fontFamily: 'var(--font-display)', fontSize: 11, fill: active ? 'var(--accent)' : 'var(--ink-soft)' }}>
        TLB short-circuit
      </text>
    </motion.g>
  );
}

function TLBPanel({ tlb, highlightVpn, hit }) {
  const slots = Array.from({ length: TLB_SIZE }, (_, i) => tlb[i] || null);
  return (
    <div style={{ margin: '0.6rem 0' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
        TLB <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
          ({TLB_SIZE} entries, LRU; most-recent left)
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${TLB_SIZE}, 1fr)`, gap: 6 }}>
        {slots.map((e, i) => {
          const isHL = e && highlightVpn != null && e.vpn === highlightVpn;
          return (
            <div key={i} style={{
              border: '2px solid', borderColor: isHL ? 'var(--accent)' : 'var(--ink)', borderRadius: 4,
              padding: '4px 6px',
              background: isHL ? (hit ? '#d9ead3' : 'var(--paper-deep)') : 'var(--paper)',
              fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textAlign: 'center', minHeight: 38,
            }}>
              {e ? (
                <>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '0.6rem' }}>VPN</div>
                  <div><strong>{e.vpn}</strong> &rarr; f{e.frame}</div>
                </>
              ) : <div style={{ color: 'var(--ink-faint)', paddingTop: 8 }}>—</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhysMemPanel({ frames, highlightFrame }) {
  return (
    <div style={{ margin: '0.4rem 0 0.6rem' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
        Physical memory <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
          ({PHYS_FRAMES} frames of 4 KB)
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PHYS_FRAMES}, 1fr)`, gap: 4 }}>
        {frames.map((v, i) => {
          const isHL = highlightFrame === i;
          const occ = v !== null;
          return (
            <div key={i} style={{
              border: '2px solid', borderColor: isHL ? 'var(--accent)' : 'var(--ink)',
              background: isHL ? '#d9ead3' : occ ? 'var(--paper-deep)' : 'var(--paper)',
              borderRadius: 3, padding: '2px 0', textAlign: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '0.65rem', minHeight: 30,
            }}>
              <div style={{ color: 'var(--ink-soft)', fontSize: '0.55rem' }}>f{i}</div>
              <div>{occ ? `v${v}` : '·'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
