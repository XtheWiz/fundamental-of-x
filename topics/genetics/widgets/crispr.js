// CRISPR widget: pick a guide, find the match + PAM, cut, repair via NHEJ or HDR.

const COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
const COLOR = { A: '#e74c3c', T: '#3498db', G: '#f39c12', C: '#27ae60' };

// Target genomic DNA (top strand 5'→3').
const GENOME = 'TTACGATGCATCAGGTACGCATTGGCATGCAAGCCTAGGCCT';
//                   ^^^^^^^^^^^^^^^^^^^^|||
// guide targets a 20-bp region followed by NGG (PAM).

const GUIDE = 'TCAGGTACGCATTGGCATGC'; // 20bp; followed in genome by AAG (NGG → AGG works as PAM after C? Let's pick a real one)

// Recompute: find a sub-string of GENOME of length 20 followed by an NGG triplet.
// GENOME: TTACGATGCATCAGGTACGCATTGGCATGCAAGCCTAGGCCT
//          0         1         2         3         4
//          0123456789012345678901234567890123456789012
// Pick start 2: ACGATGCATCAGGTACGCATT  next: GGC  → GGC is GG... we want NGG (3rd letter = ?). NGG means N then G then G; so we need any base followed by 'GG'. So GG anywhere after position 22 (=2+20).
// Actually PAM is positions 20,21,22 of genome relative to target start. Need genome[start+20..start+22] = 'NGG' (last 2 = GG).
// At start=4: genome[4..24]=TGCATCAGGTACGCATTGGC, PAM=genome[24..27]=ATG... TGCATCAGG..., let me just search.

function findCutsite(genome, guide) {
  for (let i = 0; i + guide.length + 3 <= genome.length; i++) {
    const region = genome.slice(i, i + guide.length);
    const pam = genome.slice(i + guide.length, i + guide.length + 3);
    if (region === guide && pam[1] === 'G' && pam[2] === 'G') {
      return { start: i, pamStart: i + guide.length };
    }
  }
  return null;
}

// Hand-tune: pick guide and genome where there's a match with NGG.
const TUNED_GENOME = 'TTACGATGCATCAGGTACGCATTGGCAAGGCCTAGGCCTGAA';
const TUNED_GUIDE  = 'TGCATCAGGTACGCATTGGC';  // 20bp; genome contains it at index 4; PAM at index 24 → 'AAG' nope.

// Let's just construct genome from guide + PAM.
const FINAL_GUIDE = 'TGCATCAGGTACGCATTGGC';
const FINAL_PAM   = 'AGG';   // valid NGG
const FINAL_GENOME = 'TTAC' + FINAL_GUIDE + FINAL_PAM + 'CCTAGGCCTGAA';
// verify: FINAL_GENOME = 'TTAC' + 'TGCATCAGGTACGCATTGGC' + 'AGG' + 'CCTAGGCCTGAA'

export function initCrisprWidget(root) {
  let stage = 0; // 0=before, 1=bind, 2=cut, 3=repair
  let repair = 'NHEJ'; // or 'HDR'
  let raf = null;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Guide → bind → cut → repair</div>
      <div class="controls">
        <button class="btn" id="cr-step">Next step</button>
        <button class="btn" id="cr-reset">Reset</button>
        <label style="margin-left:1rem;">Repair:</label>
        <label><input type="radio" name="cr-rep" value="NHEJ" checked> NHEJ (knockout)</label>
        <label><input type="radio" name="cr-rep" value="HDR"> HDR (template)</label>
      </div>
      <div class="widget-stage" id="cr-stage" style="min-height:280px;"></div>
      <div class="callout" id="cr-explain"></div>
    </div>
  `;

  root.querySelectorAll('input[name="cr-rep"]').forEach((r) => r.addEventListener('change', () => {
    repair = root.querySelector('input[name="cr-rep"]:checked').value;
    render();
  }));
  root.querySelector('#cr-step').addEventListener('click', () => {
    stage = Math.min(3, stage + 1);
    render();
  });
  root.querySelector('#cr-reset').addEventListener('click', () => { stage = 0; render(); });

  function render() {
    const guideStart = 4;
    const guideEnd = guideStart + FINAL_GUIDE.length;
    const pamStart = guideEnd;
    const pamEnd = pamStart + 3;
    const cutSite = guideEnd - 3; // 3 bp upstream of PAM
    const W = 700, H = 280, bw = 14;
    const startX = 20;
    const topY = 90;
    const botY = 130;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;

    // Cas9 + guide RNA above
    if (stage >= 1) {
      const cx = startX + (guideStart + 10) * bw;
      svg += `<rect x="${cx - 110}" y="20" width="220" height="50" rx="20" fill="#fde2e2" stroke="var(--ink)" stroke-width="2"/>`;
      svg += `<text x="${cx}" y="38" text-anchor="middle" style="font-family:var(--font-display);font-size:13px;">Cas9 + guide RNA</text>`;
      // guide bases
      for (let i = 0; i < FINAL_GUIDE.length; i++) {
        const ch = FINAL_GUIDE[i];
        const x = startX + (guideStart + i) * bw;
        svg += `<rect x="${x-6}" y="56" width="12" height="14" fill="${COLOR[ch]}" stroke="var(--ink)" stroke-width="1"/>`;
        svg += `<text x="${x}" y="66" text-anchor="middle" style="font-family:var(--font-mono);font-size:9px;font-weight:700;fill:white;">${COMP[ch]}</text>`;
      }
    }

    // genome top strand
    for (let i = 0; i < FINAL_GENOME.length; i++) {
      const ch = FINAL_GENOME[i];
      const x = startX + i * bw;
      const inGuide = i >= guideStart && i < guideEnd;
      const inPam = i >= pamStart && i < pamEnd;
      const isCut = stage >= 2 && i === cutSite;
      let fill = COLOR[ch];
      let strokeC = 'var(--ink)';
      let sw = 1;
      if (inGuide && stage >= 1) { strokeC = 'var(--accent)'; sw = 2; }
      if (inPam) { strokeC = '#9b59b6'; sw = 2.5; }
      svg += `<rect x="${x-6}" y="${topY-9}" width="12" height="16" fill="${fill}" stroke="${strokeC}" stroke-width="${sw}"/>`;
      svg += `<text x="${x}" y="${topY+3}" text-anchor="middle" style="font-family:var(--font-mono);font-size:9px;fill:white;font-weight:700;">${ch}</text>`;
    }
    // bottom strand
    for (let i = 0; i < FINAL_GENOME.length; i++) {
      const ch = COMP[FINAL_GENOME[i]];
      const x = startX + i * bw;
      svg += `<rect x="${x-6}" y="${botY-9}" width="12" height="16" fill="${COLOR[ch]}" stroke="var(--ink)" stroke-width="1" opacity="0.7"/>`;
      svg += `<text x="${x}" y="${botY+3}" text-anchor="middle" style="font-family:var(--font-mono);font-size:9px;fill:white;font-weight:700;opacity:0.85;">${ch}</text>`;
    }

    // cut line
    if (stage >= 2) {
      const cx = startX + cutSite * bw - 7;
      svg += `<line x1="${cx}" y1="${topY-15}" x2="${cx}" y2="${botY+15}" stroke="var(--accent)" stroke-width="3"/>`;
      svg += `<text x="${cx+8}" y="${topY-18}" style="font-family:var(--font-display);font-size:11px;fill:var(--accent);">CUT</text>`;
    }

    // PAM label
    svg += `<text x="${startX + (pamStart+1)*bw}" y="${botY+30}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:700;fill:#9b59b6;">PAM (NGG)</text>`;
    svg += `<text x="${startX + (guideStart+10)*bw}" y="${topY-22}" text-anchor="middle" style="font-family:var(--font-mono);font-size:10px;fill:var(--ink-soft);">target region (20 bp)</text>`;

    // repair result
    if (stage >= 3) {
      const ry = 230;
      svg += `<text x="20" y="${ry-8}" style="font-family:var(--font-display);font-size:12px;">After repair (${repair})</text>`;
      let resultSeq;
      if (repair === 'NHEJ') {
        // delete 4 bases at cut
        resultSeq = FINAL_GENOME.slice(0, cutSite - 1) + '----' + FINAL_GENOME.slice(cutSite + 3);
      } else {
        // HDR: insert a precise edit (change one base)
        resultSeq = FINAL_GENOME.slice(0, cutSite) + 'TTT' + FINAL_GENOME.slice(cutSite + 3);
      }
      for (let i = 0; i < resultSeq.length; i++) {
        const ch = resultSeq[i];
        const x = startX + i * bw;
        if (ch === '-') {
          svg += `<rect x="${x-6}" y="${ry+3}" width="12" height="16" fill="#1a1a1a" stroke="var(--ink)" stroke-width="1"/>`;
        } else {
          const isEdit = stage >= 3 && i >= cutSite && i < cutSite + 3 && repair === 'HDR';
          svg += `<rect x="${x-6}" y="${ry+3}" width="12" height="16" fill="${COLOR[ch]}" stroke="${isEdit ? 'var(--accent)' : 'var(--ink)'}" stroke-width="${isEdit ? 2.5 : 1}"/>`;
          svg += `<text x="${x}" y="${ry+15}" text-anchor="middle" style="font-family:var(--font-mono);font-size:9px;fill:white;font-weight:700;">${ch}</text>`;
        }
      }
    }

    svg += `</svg>`;
    root.querySelector('#cr-stage').innerHTML = svg;

    let exp = '';
    if (stage === 0) exp = `<strong>Step 0.</strong> The target genome with a guide region (purple stroke marks the PAM). Press <strong>Next step</strong>.`;
    if (stage === 1) exp = `<strong>Step 1: bind.</strong> Cas9 + guide RNA scan the genome. The guide finds a 20-bp complementary match adjacent to a PAM (NGG). Both must be present.`;
    if (stage === 2) exp = `<strong>Step 2: cut.</strong> Cas9 creates a double-strand break 3 bp upstream of the PAM. Both strands of the helix are severed.`;
    if (stage === 3) {
      if (repair === 'NHEJ') exp = `<strong>Step 3: NHEJ.</strong> Non-Homologous End Joining stitches the ends back together — usually with small insertions or deletions (here: a 4-bp loss). Good enough to knock out a gene.`;
      else exp = `<strong>Step 3: HDR.</strong> Homology-Directed Repair uses a template you supplied (red bases). Precise rewrite, ~1% efficient — but it lets you change a specific sequence rather than just disable.`;
    }
    root.querySelector('#cr-explain').innerHTML = exp;
  }

  render();
}
