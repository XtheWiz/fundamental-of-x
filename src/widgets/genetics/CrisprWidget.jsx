import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
const COLOR = { A: '#e74c3c', T: '#3498db', G: '#f39c12', C: '#27ae60' };

const FINAL_GUIDE = 'TGCATCAGGTACGCATTGGC';
const FINAL_PAM = 'AGG';
const FINAL_GENOME = 'TTAC' + FINAL_GUIDE + FINAL_PAM + 'CCTAGGCCTGAA';

export default function CrisprWidget() {
  const [stage, setStage] = useState(0);
  const [repair, setRepair] = useState('NHEJ');

  const guideStart = 4;
  const guideEnd = guideStart + FINAL_GUIDE.length;
  const pamStart = guideEnd;
  const pamEnd = pamStart + 3;
  const cutSite = guideEnd - 3;

  const W = 700, H = 280, bw = 14, startX = 20, topY = 90, botY = 130;

  let exp;
  if (stage === 0) exp = <><strong>Step 0.</strong> The target genome with a guide region (purple stroke marks the PAM). Press <strong>Next step</strong>.</>;
  else if (stage === 1) exp = <><strong>Step 1: bind.</strong> Cas9 + guide RNA scan the genome. The guide finds a 20-bp complementary match adjacent to a PAM (NGG). Both must be present.</>;
  else if (stage === 2) exp = <><strong>Step 2: cut.</strong> Cas9 creates a double-strand break 3 bp upstream of the PAM. Both strands of the helix are severed.</>;
  else if (repair === 'NHEJ') exp = <><strong>Step 3: NHEJ.</strong> Non-Homologous End Joining stitches the ends back together — usually with small insertions or deletions (here: a 4-bp loss). Good enough to knock out a gene.</>;
  else exp = <><strong>Step 3: HDR.</strong> Homology-Directed Repair uses a template you supplied (red bases). Precise rewrite, ~1% efficient — but it lets you change a specific sequence rather than just disable.</>;

  let resultSeq = '';
  if (stage >= 3) {
    if (repair === 'NHEJ') resultSeq = FINAL_GENOME.slice(0, cutSite - 1) + '----' + FINAL_GENOME.slice(cutSite + 3);
    else resultSeq = FINAL_GENOME.slice(0, cutSite) + 'TTT' + FINAL_GENOME.slice(cutSite + 3);
  }

  return (
    <div className="widget">
      <div className="widget-title">Guide → bind → cut → repair</div>
      <div className="controls">
        <button className="btn" onClick={() => setStage((s) => Math.min(3, s + 1))}>Next step</button>
        <button className="btn" onClick={() => setStage(0)}>Reset</button>
        <label style={{ marginLeft: '1rem' }}>Repair:</label>
        <label><input type="radio" name="cr-rep" value="NHEJ" checked={repair === 'NHEJ'} onChange={(e) => setRepair(e.target.value)} /> NHEJ (knockout)</label>
        <label><input type="radio" name="cr-rep" value="HDR" checked={repair === 'HDR'} onChange={(e) => setRepair(e.target.value)} /> HDR (template)</label>
      </div>
      <div className="widget-stage" style={{ minHeight: 280 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <AnimatePresence>
            {stage >= 1 && (
              <motion.g
                key="cas9"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              >
                {(() => {
                  const cx = startX + (guideStart + 10) * bw;
                  return (
                    <>
                      <rect x={cx - 110} y={20} width={220} height={50} rx={20} fill="#fde2e2" stroke="var(--ink)" strokeWidth={2} />
                      <text x={cx} y={38} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>Cas9 + guide RNA</text>
                      {FINAL_GUIDE.split('').map((ch, i) => {
                        const x = startX + (guideStart + i) * bw;
                        return (
                          <g key={i}>
                            <rect x={x - 6} y={56} width={12} height={14} fill={COLOR[ch]} stroke="var(--ink)" strokeWidth={1} />
                            <text x={x} y={66} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, fill: 'white' }}>{COMP[ch]}</text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </motion.g>
            )}
          </AnimatePresence>

          {FINAL_GENOME.split('').map((ch, i) => {
            const x = startX + i * bw;
            const inGuide = i >= guideStart && i < guideEnd;
            const inPam = i >= pamStart && i < pamEnd;
            let strokeC = 'var(--ink)';
            let sw = 1;
            if (inGuide && stage >= 1) { strokeC = 'var(--accent)'; sw = 2; }
            if (inPam) { strokeC = '#9b59b6'; sw = 2.5; }
            return (
              <g key={`t-${i}`}>
                <rect x={x - 6} y={topY - 9} width={12} height={16} fill={COLOR[ch]} stroke={strokeC} strokeWidth={sw} />
                <text x={x} y={topY + 3} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'white', fontWeight: 700 }}>{ch}</text>
              </g>
            );
          })}
          {FINAL_GENOME.split('').map((ch, i) => {
            const cmp = COMP[ch];
            const x = startX + i * bw;
            return (
              <g key={`b-${i}`}>
                <rect x={x - 6} y={botY - 9} width={12} height={16} fill={COLOR[cmp]} stroke="var(--ink)" strokeWidth={1} opacity={0.7} />
                <text x={x} y={botY + 3} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'white', fontWeight: 700, opacity: 0.85 }}>{cmp}</text>
              </g>
            );
          })}

          {stage >= 2 && (() => {
            const cx = startX + cutSite * bw - 7;
            return (
              <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.25 }} style={{ transformOrigin: `${cx}px ${(topY + botY) / 2}px` }}>
                <line x1={cx} y1={topY - 15} x2={cx} y2={botY + 15} stroke="var(--accent)" strokeWidth={3} />
                <text x={cx + 8} y={topY - 18} style={{ fontFamily: 'var(--font-display)', fontSize: 11, fill: 'var(--accent)' }}>CUT</text>
              </motion.g>
            );
          })()}

          <text x={startX + (pamStart + 1) * bw} y={botY + 30} textAnchor="middle"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: '#9b59b6' }}>PAM (NGG)</text>
          <text x={startX + (guideStart + 10) * bw} y={topY - 22} textAnchor="middle"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>target region (20 bp)</text>

          <AnimatePresence>
            {stage >= 3 && (
              <motion.g
                key={`repair-${repair}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <text x={20} y={222} style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>After repair ({repair})</text>
                {resultSeq.split('').map((ch, i) => {
                  const x = startX + i * bw;
                  if (ch === '-') return <rect key={i} x={x - 6} y={233} width={12} height={16} fill="#1a1a1a" stroke="var(--ink)" strokeWidth={1} />;
                  const isEdit = i >= cutSite && i < cutSite + 3 && repair === 'HDR';
                  return (
                    <g key={i}>
                      <rect x={x - 6} y={233} width={12} height={16} fill={COLOR[ch]}
                        stroke={isEdit ? 'var(--accent)' : 'var(--ink)'} strokeWidth={isEdit ? 2.5 : 1} />
                      <text x={x} y={245} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'white', fontWeight: 700 }}>{ch}</text>
                    </g>
                  );
                })}
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </div>
      <div className="callout">{exp}</div>
    </div>
  );
}
