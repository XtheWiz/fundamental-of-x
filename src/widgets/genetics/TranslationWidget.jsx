import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLOR = { A: '#e74c3c', U: '#9b59b6', G: '#f39c12', C: '#27ae60' };

const CODON_TABLE = {
  UUU:'F',UUC:'F',UUA:'L',UUG:'L', UCU:'S',UCC:'S',UCA:'S',UCG:'S',
  UAU:'Y',UAC:'Y',UAA:'*',UAG:'*', UGU:'C',UGC:'C',UGA:'*',UGG:'W',
  CUU:'L',CUC:'L',CUA:'L',CUG:'L', CCU:'P',CCC:'P',CCA:'P',CCG:'P',
  CAU:'H',CAC:'H',CAA:'Q',CAG:'Q', CGU:'R',CGC:'R',CGA:'R',CGG:'R',
  AUU:'I',AUC:'I',AUA:'I',AUG:'M', ACU:'T',ACC:'T',ACA:'T',ACG:'T',
  AAU:'N',AAC:'N',AAA:'K',AAG:'K', AGU:'S',AGC:'S',AGA:'R',AGG:'R',
  GUU:'V',GUC:'V',GUA:'V',GUG:'V', GCU:'A',GCC:'A',GCA:'A',GCG:'A',
  GAU:'D',GAC:'D',GAA:'E',GAG:'E', GGU:'G',GGC:'G',GGA:'G',GGG:'G',
};

const AMINO_NAMES = { F: 'Phe', L: 'Leu', S: 'Ser', Y: 'Tyr', C: 'Cys', W: 'Trp', P: 'Pro', H: 'His', Q: 'Gln', R: 'Arg', I: 'Ile', M: 'Met', T: 'Thr', N: 'Asn', K: 'Lys', V: 'Val', A: 'Ala', D: 'Asp', E: 'Glu', G: 'Gly', '*': 'STOP' };
const AMINO_COLOR = {
  F:'#e67e22', L:'#e67e22', I:'#e67e22', M:'#e67e22', V:'#e67e22',
  S:'#1abc9c', T:'#1abc9c', N:'#1abc9c', Q:'#1abc9c', C:'#1abc9c', Y:'#1abc9c',
  D:'#e74c3c', E:'#e74c3c', K:'#3498db', R:'#3498db', H:'#3498db',
  G:'#95a5a6', A:'#95a5a6', P:'#95a5a6', W:'#9b59b6', '*':'#1a1a1a',
};

const SAMPLES = [
  'AUGGCUACGUAUCAAGAUUGGCGGUAA',
  'AUGAGGGAUCUGCAUUCGUAA',
  'AUGGGGCCAGCAUUGAGCUAA',
];

const cleanRna = (s) => s.toUpperCase().replace(/[^AUGC]/g, '');

export default function TranslationWidget() {
  const [mrna, setMrna] = useState(SAMPLES[0]);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(true);
  const rafRef = useRef(null);

  const codons = useMemo(() => {
    const c = [];
    for (let i = 0; i + 3 <= mrna.length; i += 3) c.push(mrna.slice(i, i + 3));
    return c;
  }, [mrna]);

  const protein = useMemo(() => {
    const aa = [];
    for (const cd of codons) {
      const a = CODON_TABLE[cd] || '?';
      aa.push(a);
      if (a === '*') break;
    }
    return aa;
  }, [codons]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setPos((p) => {
        const next = p + dt * 3;
        if (next >= codons.length) { setPlaying(false); return codons.length; }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, codons.length]);

  const reset = () => { setPos(0); setPlaying(false); };
  const pickSample = (i) => { setMrna(SAMPLES[i]); setPos(0); setPlaying(true); };

  const W = 700, H = 260, bw = 22, startX = 30, rnaY = 70;
  const posInt = Math.floor(pos);
  const startOK = codons[0] === 'AUG';
  const finished = protein.length && protein[protein.length - 1] === '*';

  let exp;
  if (!startOK) exp = <><strong>Doesn't start with AUG.</strong> Real ribosomes hunt for a start codon — without one, translation never initiates.</>;
  else if (finished) exp = <><strong>Stop codon reached.</strong> Final protein: <code>{protein.slice(0, -1).join('-')}</code>. The ribosome dissociates; the polypeptide is released to fold into its 3D shape.</>;
  else if (posInt < codons.length) exp = <>Reading codon <code>{codons[posInt]}</code> → <strong>{AMINO_NAMES[CODON_TABLE[codons[posInt]] || '?']}</strong>. The ribosome charges a tRNA carrying that amino acid and adds it to the chain.</>;
  else exp = <>Click Play.</>;

  return (
    <div className="widget">
      <div className="widget-title">Ribosome translating mRNA into protein</div>
      <div className="controls">
        <button className="btn" onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button className="btn" onClick={reset}>Reset</button>
        {SAMPLES.map((_, i) => (
          <button key={i} className="btn" onClick={() => pickSample(i)}>Sample {i + 1}</button>
        ))}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '0.4rem' }}>mRNA (must start with AUG):</div>
      <input
        type="text"
        value={mrna}
        onChange={(e) => { setMrna(cleanRna(e.target.value)); setPos(0); }}
        style={{ width: '100%', marginTop: '0.2rem', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', letterSpacing: '0.1em', padding: '0.45em 0.7em', border: '2px solid var(--ink)', borderRadius: 'var(--radius)', background: 'var(--paper-deep)' }}
      />
      <div className="widget-stage" style={{ minHeight: 260 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <text x={20} y={20} style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>mRNA (codons)</text>
          <text x={20} y={155} style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>Polypeptide chain</text>

          {codons.map((codon, i) => codon.split('').map((ch, j) => {
            const x = startX + (i * 3 + j) * bw + i * 4;
            const stopped = i >= protein.length;
            const op = stopped ? 0.4 : 1;
            return (
              <g key={`${i}-${j}`}>
                <rect x={x - 10} y={rnaY - 11} width={20} height={22} fill={COLOR[ch]} stroke="var(--ink)" rx={3} opacity={op} />
                <text x={x} y={rnaY + 5} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, fill: 'white', opacity: op }}>{ch}</text>
              </g>
            );
          }))}

          {posInt < codons.length && (() => {
            const rx = startX + (posInt * 3 + 1) * bw + posInt * 4;
            return (
              <motion.g animate={{ x: 0 }}>
                <rect x={rx - 36} y={rnaY - 30} width={72} height={60} rx={20} fill="#fde2e2" stroke="var(--ink)" strokeWidth={2} />
                <text x={rx} y={rnaY - 12} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 11 }}>ribosome</text>
                <text x={rx} y={rnaY + 22} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>reads codon {posInt + 1}</text>
              </motion.g>
            );
          })()}

          <AnimatePresence>
            {protein.map((aa, i) => {
              const x = startX + i * 38 + 12;
              const y = 200;
              const color = AMINO_COLOR[aa] || '#888';
              return (
                <motion.g
                  key={`aa-${i}-${aa}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  <circle cx={x} cy={y} r={16} fill={color} stroke="var(--ink)" strokeWidth={2} />
                  <text x={x} y={y + 5} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: 'white' }}>{aa}</text>
                  <text x={x} y={y + 30} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9 }}>{AMINO_NAMES[aa] || ''}</text>
                  {i > 0 && (() => {
                    const prev = startX + (i - 1) * 38 + 12;
                    return <line x1={prev + 16} y1={y} x2={x - 16} y2={y} stroke="var(--ink)" strokeWidth={1.5} />;
                  })()}
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>
      </div>
      <div className="callout">{exp}</div>
    </div>
  );
}
