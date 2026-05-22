// Translation widget: walk a ribosome across mRNA, decode codons → amino acids.

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

const AMINO_NAMES = {
  F: 'Phe', L: 'Leu', S: 'Ser', Y: 'Tyr', C: 'Cys', W: 'Trp',
  P: 'Pro', H: 'His', Q: 'Gln', R: 'Arg', I: 'Ile', M: 'Met',
  T: 'Thr', N: 'Asn', K: 'Lys', V: 'Val', A: 'Ala', D: 'Asp',
  E: 'Glu', G: 'Gly', '*': 'STOP',
};

const AMINO_COLOR = {
  F:'#e67e22', L:'#e67e22', I:'#e67e22', M:'#e67e22', V:'#e67e22',
  S:'#1abc9c', T:'#1abc9c', N:'#1abc9c', Q:'#1abc9c', C:'#1abc9c', Y:'#1abc9c',
  D:'#e74c3c', E:'#e74c3c', K:'#3498db', R:'#3498db', H:'#3498db',
  G:'#95a5a6', A:'#95a5a6', P:'#95a5a6', W:'#9b59b6',
  '*':'#1a1a1a',
};

const SAMPLES = [
  'AUGGCUACGUAUCAAGAUUGGCGGUAA',
  'AUGAGGGAUCUGCAUUCGUAA',
  'AUGGGGCCAGCAUUGAGCUAA',
];

export function initTranslationWidget(root) {
  let mrna = SAMPLES[0];
  let pos = 0; // codon index
  let playing = true;
  let raf = null;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Ribosome translating mRNA into protein</div>
      <div class="controls">
        <button class="btn" id="tl-play">${playing ? 'Pause' : 'Play'}</button>
        <button class="btn" id="tl-reset">Reset</button>
        <button class="btn" id="tl-s0">Sample 1</button>
        <button class="btn" id="tl-s1">Sample 2</button>
        <button class="btn" id="tl-s2">Sample 3</button>
      </div>
      <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--ink-soft);margin-top:0.4rem;">mRNA (must start with AUG):</div>
      <input id="tl-mrna" type="text" value="${mrna}" style="width:100%;margin-top:0.2rem;font-family:var(--font-mono);font-size:0.95rem;letter-spacing:0.1em;padding:0.45em 0.7em;border:2px solid var(--ink);border-radius:var(--radius);background:var(--paper-deep);">
      <div class="widget-stage" id="tl-stage" style="min-height:260px;"></div>
      <div class="callout" id="tl-explain"></div>
    </div>
  `;

  const inp = root.querySelector('#tl-mrna');
  inp.addEventListener('input', () => {
    mrna = inp.value.toUpperCase().replace(/[^AUGC]/g, '');
    inp.value = mrna;
    pos = 0;
    render();
  });
  const playBtn = root.querySelector('#tl-play');
  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.textContent = playing ? 'Pause' : 'Play';
    if (playing) tick();
  });
  root.querySelector('#tl-reset').addEventListener('click', () => { pos = 0; render(); });
  [0,1,2].forEach((i) => root.querySelector(`#tl-s${i}`).addEventListener('click', () => {
    mrna = SAMPLES[i]; inp.value = mrna; pos = 0; render();
  }));

  function tick() {
    if (!playing) return;
    pos += 0.08;
    const codonCount = Math.floor(mrna.length / 3);
    if (pos >= codonCount) { pos = codonCount; playing = false; playBtn.textContent = 'Play'; }
    render();
    if (playing) raf = requestAnimationFrame(tick);
  }

  function getCodons() {
    const c = [];
    for (let i = 0; i + 3 <= mrna.length; i += 3) c.push(mrna.slice(i, i + 3));
    return c;
  }

  function getProtein() {
    const codons = getCodons();
    const aa = [];
    for (const c of codons) {
      const a = CODON_TABLE[c] || '?';
      aa.push(a);
      if (a === '*') break;
    }
    return aa;
  }

  function render() {
    const codons = getCodons();
    const protein = getProtein();
    const W = 700, H = 260;
    const bw = 22;
    const startX = 30;
    const rnaY = 70;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<text x="20" y="20" style="font-family:var(--font-display);font-size:13px;">mRNA (codons)</text>`;
    svg += `<text x="20" y="155" style="font-family:var(--font-display);font-size:13px;">Polypeptide chain</text>`;

    const posInt = Math.floor(pos);
    // RNA bases grouped in codons
    for (let i = 0; i < codons.length; i++) {
      for (let j = 0; j < 3; j++) {
        const ch = codons[i][j];
        const x = startX + (i * 3 + j) * bw + i * 4;
        const stopped = i >= protein.length;
        const op = stopped ? 0.4 : 1;
        svg += `<rect x="${x-10}" y="${rnaY-11}" width="20" height="22" fill="${COLOR[ch]}" stroke="var(--ink)" rx="3" opacity="${op}"/>`;
        svg += `<text x="${x}" y="${rnaY+5}" text-anchor="middle" style="font-family:var(--font-mono);font-size:12px;font-weight:700;fill:white;opacity:${op};">${ch}</text>`;
      }
    }

    // ribosome
    const riboCodon = posInt;
    if (riboCodon < codons.length) {
      const rx = startX + (riboCodon * 3 + 1) * bw + riboCodon * 4;
      svg += `<rect x="${rx-36}" y="${rnaY-30}" width="72" height="60" rx="20" fill="#fde2e2" stroke="var(--ink)" stroke-width="2"/>`;
      svg += `<text x="${rx}" y="${rnaY-12}" text-anchor="middle" style="font-family:var(--font-display);font-size:11px;">ribosome</text>`;
      svg += `<text x="${rx}" y="${rnaY+22}" text-anchor="middle" style="font-family:var(--font-mono);font-size:10px;">reads codon ${riboCodon+1}</text>`;
    }

    // amino acid chain
    for (let i = 0; i < protein.length; i++) {
      const aa = protein[i];
      const x = startX + i * 38 + 12;
      const y = 200;
      const color = AMINO_COLOR[aa] || '#888';
      svg += `<circle cx="${x}" cy="${y}" r="16" fill="${color}" stroke="var(--ink)" stroke-width="2"/>`;
      svg += `<text x="${x}" y="${y+5}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:700;fill:white;">${aa}</text>`;
      svg += `<text x="${x}" y="${y+30}" text-anchor="middle" style="font-family:var(--font-mono);font-size:9px;">${AMINO_NAMES[aa] || ''}</text>`;
      if (i > 0) {
        const prev = startX + (i-1) * 38 + 12;
        svg += `<line x1="${prev+16}" y1="${y}" x2="${x-16}" y2="${y}" stroke="var(--ink)" stroke-width="1.5"/>`;
      }
    }

    svg += `</svg>`;
    root.querySelector('#tl-stage').innerHTML = svg;

    const finished = protein.length && protein[protein.length-1] === '*';
    const startOK = codons[0] === 'AUG';
    let exp = '';
    if (!startOK) exp = `<strong>Doesn't start with AUG.</strong> Real ribosomes hunt for a start codon — without one, translation never initiates.`;
    else if (finished) exp = `<strong>Stop codon reached.</strong> Final protein: <code>${protein.slice(0,-1).join('-')}</code>. The ribosome dissociates; the polypeptide is released to fold into its 3D shape.`;
    else if (posInt < codons.length) exp = `Reading codon <code>${codons[posInt]}</code> → <strong>${AMINO_NAMES[CODON_TABLE[codons[posInt]] || '?']}</strong>. The ribosome charges a tRNA carrying that amino acid and adds it to the chain.`;
    else exp = `Click Play.`;
    root.querySelector('#tl-explain').innerHTML = exp;
  }

  render();
  tick();
}
