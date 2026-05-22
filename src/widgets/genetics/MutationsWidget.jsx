import { useMemo, useState } from 'react';

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

const AMINO_COLOR = {
  F:'#e67e22', L:'#e67e22', I:'#e67e22', M:'#e67e22', V:'#e67e22',
  S:'#1abc9c', T:'#1abc9c', N:'#1abc9c', Q:'#1abc9c', C:'#1abc9c', Y:'#1abc9c',
  D:'#e74c3c', E:'#e74c3c', K:'#3498db', R:'#3498db', H:'#3498db',
  G:'#95a5a6', A:'#95a5a6', P:'#95a5a6', W:'#9b59b6', '*':'#1a1a1a',
};

const ORIGINAL = 'AUGGCAUUUCGUACGUGGCCCAAGUAA';

const MUTATIONS = {
  silent:    { name: 'Silent',     apply: (s) => s.slice(0, 5) + 'C' + s.slice(6),   note: 'Codon 2: GCA → GCC. Both code for Alanine. Protein unchanged — that\'s the redundancy of the genetic code at work.' },
  missense:  { name: 'Missense',   apply: (s) => s.slice(0, 4) + 'U' + s.slice(5),   note: 'Codon 2: GCA → GUA. Alanine → Valine. One amino acid swaps for another. Sickle-cell anemia is exactly this — one missense in beta-hemoglobin.' },
  nonsense:  { name: 'Nonsense',   apply: (s) => s.slice(0, 21) + 'U' + s.slice(22), note: 'Codon 8: AAG → UAG. UAG is STOP — translation halts early. The protein is truncated and usually non-functional.' },
  insertion: { name: 'Insertion',  apply: (s) => s.slice(0, 5) + 'G' + s.slice(5),   note: 'Insert one G after position 5. Every downstream codon shifts by one — completely different amino acids, usually a premature stop. Frameshift.' },
  deletion:  { name: 'Deletion',   apply: (s) => s.slice(0, 5) + s.slice(6),         note: 'Delete one base. Same disaster as insertion: reading frame is wrong from the cut onward.' },
};

const KEYS = ['silent', 'missense', 'nonsense', 'insertion', 'deletion'];

function translate(rna) {
  const aa = [];
  for (let i = 0; i + 3 <= rna.length; i += 3) {
    const c = rna.slice(i, i + 3);
    const a = CODON_TABLE[c] || '?';
    aa.push(a);
    if (a === '*') break;
  }
  return aa;
}

function Strip({ rna, label, y, original }) {
  const W = 700, bw = 18, startX = 30;
  const codonCount = Math.floor(rna.length / 3);
  const protein = translate(rna);
  return (
    <>
      <text x={20} y={y - 18} style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>{label}</text>
      {rna.split('').map((ch, i) => {
        const x = startX + i * bw;
        const diff = original && original[i] !== ch;
        return (
          <g key={`b-${i}`}>
            <rect x={x - 8} y={y - 9} width={16} height={18} fill={COLOR[ch]}
              stroke={diff ? 'var(--accent)' : 'var(--ink)'} strokeWidth={diff ? 2.5 : 1.5} rx={2} />
            <text x={x} y={y + 5} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, fill: 'white' }}>{ch}</text>
          </g>
        );
      })}
      {Array.from({ length: codonCount }).map((_, i) => {
        const x1 = startX + i * 3 * bw - 9;
        const x2 = startX + (i * 3 + 2) * bw + 9;
        return <line key={`c-${i}`} x1={x1} y1={y + 13} x2={x2} y2={y + 13} stroke="var(--ink-faint)" strokeWidth={1} />;
      })}
      {protein.map((aa, i) => {
        const x = startX + i * 3 * bw + bw;
        const color = AMINO_COLOR[aa] || '#888';
        return (
          <g key={`p-${i}`}>
            <circle cx={x} cy={y + 50} r={11} fill={color} stroke="var(--ink)" strokeWidth={1.5} />
            <text x={x} y={y + 54} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, fill: 'white' }}>{aa}</text>
          </g>
        );
      })}
    </>
  );
}

export default function MutationsWidget() {
  const [current, setCurrent] = useState('silent');
  const mutated = useMemo(() => MUTATIONS[current].apply(ORIGINAL), [current]);
  const before = translate(ORIGINAL).join('');
  const after = translate(mutated).join('');

  return (
    <div className="widget">
      <div className="widget-title">Mutate and re-translate</div>
      <div className="controls">
        {KEYS.map((k) => (
          <button key={k} className="btn" onClick={() => setCurrent(k)}>{MUTATIONS[k].name}</button>
        ))}
      </div>
      <div className="widget-stage" style={{ minHeight: 280 }}>
        <svg viewBox="0 0 700 280" width="100%" style={{ maxWidth: 700 }}>
          <Strip rna={ORIGINAL} label="Original mRNA" y={30} />
          <Strip rna={mutated} label={`Mutated mRNA  (${MUTATIONS[current].name})`} y={150} original={ORIGINAL} />
        </svg>
      </div>
      <div className="callout">
        <strong>{MUTATIONS[current].name} mutation.</strong> {MUTATIONS[current].note}<br />
        Before: <code>{before}</code><br />
        After: <code>{after}</code>
      </div>
    </div>
  );
}
