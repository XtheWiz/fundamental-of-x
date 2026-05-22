// Mutations widget: pick a mutation type, see protein before/after.

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

// ORIGINAL = AUGGCAUUUCGUACGUGGCCCAAGUAA
// codons:    AUG GCA UUU CGU ACG UGG CCC AAG UAA
// protein:   M   A   F   R   T   W   P   K   *
const MUTATIONS = {
  silent:    { apply: (s) => s.slice(0, 5) + 'C' + s.slice(6),   note: 'Codon 2: <code>GCA → GCC</code>. Both code for Alanine. Protein unchanged — that\'s the redundancy of the genetic code at work.' },
  missense:  { apply: (s) => s.slice(0, 4) + 'U' + s.slice(5),   note: 'Codon 2: <code>GCA → GUA</code>. Alanine → Valine. One amino acid swaps for another. Sickle-cell anemia is exactly this — one missense in beta-hemoglobin.' },
  nonsense:  { apply: (s) => s.slice(0, 21) + 'U' + s.slice(22), note: 'Codon 8: <code>AAG → UAG</code>. UAG is STOP — translation halts early. The protein is truncated and usually non-functional.' },
  insertion: { apply: (s) => s.slice(0, 5) + 'G' + s.slice(5),   note: 'Insert one G after position 5. Every downstream codon shifts by one — completely different amino acids, usually a premature stop. <strong>Frameshift</strong>.' },
  deletion:  { apply: (s) => s.slice(0, 5) + s.slice(6),         note: 'Delete one base. Same disaster as insertion: reading frame is wrong from the cut onward.' },
};

const MUTATION_KEYS = ['silent', 'missense', 'nonsense', 'insertion', 'deletion'];
const MUTATION_NAMES = { silent: 'Silent', missense: 'Missense', nonsense: 'Nonsense', insertion: 'Insertion', deletion: 'Deletion' };

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

export function initMutationsWidget(root) {
  let current = 'silent';
  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Mutate and re-translate</div>
      <div class="controls">
        ${MUTATION_KEYS.map((k) => `<button class="btn" data-k="${k}">${MUTATION_NAMES[k]}</button>`).join('')}
      </div>
      <div class="widget-stage" id="mu-stage" style="min-height:280px;"></div>
      <div class="callout" id="mu-explain"></div>
    </div>
  `;

  root.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { current = b.dataset.k; render(); }));

  function renderStrip(rna, label, y, original) {
    const W = 700, bw = 18;
    const startX = 30;
    let svg = `<text x="20" y="${y - 18}" style="font-family:var(--font-display);font-size:12px;">${label}</text>`;
    // bases
    for (let i = 0; i < rna.length; i++) {
      const x = startX + i * bw;
      const ch = rna[i];
      const diff = original && original[i] !== ch;
      const codonIdx = Math.floor(i / 3);
      svg += `<rect x="${x-8}" y="${y-9}" width="16" height="18" fill="${COLOR[ch]}" stroke="${diff ? 'var(--accent)' : 'var(--ink)'}" stroke-width="${diff ? 2.5 : 1.5}" rx="2"/>`;
      svg += `<text x="${x}" y="${y+5}" text-anchor="middle" style="font-family:var(--font-mono);font-size:10px;font-weight:700;fill:white;">${ch}</text>`;
    }
    // codon brackets
    const codonCount = Math.floor(rna.length / 3);
    for (let i = 0; i < codonCount; i++) {
      const x1 = startX + i * 3 * bw - 9;
      const x2 = startX + (i * 3 + 2) * bw + 9;
      svg += `<line x1="${x1}" y1="${y+13}" x2="${x2}" y2="${y+13}" stroke="var(--ink-faint)" stroke-width="1"/>`;
    }
    // protein
    const protein = translate(rna);
    const py = y + 50;
    for (let i = 0; i < protein.length; i++) {
      const x = startX + i * 3 * bw + bw;
      const aa = protein[i];
      const color = AMINO_COLOR[aa] || '#888';
      svg += `<circle cx="${x}" cy="${py}" r="11" fill="${color}" stroke="var(--ink)" stroke-width="1.5"/>`;
      svg += `<text x="${x}" y="${py+4}" text-anchor="middle" style="font-family:var(--font-mono);font-size:10px;font-weight:700;fill:white;">${aa}</text>`;
    }
    return svg;
  }

  function render() {
    const mutated = MUTATIONS[current].apply(ORIGINAL);
    const W = 700, H = 280;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += renderStrip(ORIGINAL, 'Original mRNA', 30);
    svg += renderStrip(mutated, `Mutated mRNA  (${MUTATION_NAMES[current]})`, 150, ORIGINAL);
    svg += `</svg>`;
    root.querySelector('#mu-stage').innerHTML = svg;

    const before = translate(ORIGINAL).join('');
    const after = translate(mutated).join('');
    const explain = MUTATIONS[current].note;
    root.querySelector('#mu-explain').innerHTML = `<strong>${MUTATION_NAMES[current]} mutation.</strong> ${explain}<br>Before: <code>${before}</code><br>After: <code>${after}</code>`;
  }

  render();
}
