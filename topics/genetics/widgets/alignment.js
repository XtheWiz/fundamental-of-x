// Alignment widget: Needleman-Wunsch matrix + traceback visualization.

const COLOR = { A: '#e74c3c', T: '#3498db', G: '#f39c12', C: '#27ae60' };

const SCORE = { match: 1, mismatch: -1, gap: -2 };

function align(a, b) {
  const n = a.length, m = b.length;
  const M = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
  const From = Array.from({ length: n + 1 }, () => new Int8Array(m + 1));
  // From: 0 = diag, 1 = up, 2 = left, -1 = none
  for (let i = 1; i <= n; i++) { M[i][0] = M[i-1][0] + SCORE.gap; From[i][0] = 1; }
  for (let j = 1; j <= m; j++) { M[0][j] = M[0][j-1] + SCORE.gap; From[0][j] = 2; }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const matchScore = a[i-1] === b[j-1] ? SCORE.match : SCORE.mismatch;
      const diag = M[i-1][j-1] + matchScore;
      const up = M[i-1][j] + SCORE.gap;
      const left = M[i][j-1] + SCORE.gap;
      let best = diag, from = 0;
      if (up > best) { best = up; from = 1; }
      if (left > best) { best = left; from = 2; }
      M[i][j] = best;
      From[i][j] = from;
    }
  }
  // traceback
  const path = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    path.push([i, j]);
    if (i === 0) { j--; continue; }
    if (j === 0) { i--; continue; }
    const f = From[i][j];
    if (f === 0) { i--; j--; }
    else if (f === 1) { i--; }
    else { j--; }
  }
  path.push([0, 0]);
  path.reverse();
  // build aligned strings
  const aligned = { a: '', b: '' };
  for (let k = 1; k < path.length; k++) {
    const [pi, pj] = path[k-1];
    const [ci, cj] = path[k];
    if (ci === pi + 1 && cj === pj + 1) { aligned.a += a[pi]; aligned.b += b[pj]; }
    else if (ci === pi + 1) { aligned.a += a[pi]; aligned.b += '-'; }
    else { aligned.a += '-'; aligned.b += b[pj]; }
  }
  return { M, From, path, aligned, score: M[n][m] };
}

const SAMPLES = [
  ['GATTACA', 'GCATGCU'],
  ['ACGTACGT', 'ACTACGAT'],
  ['CAT', 'CAT'],
];

export function initAlignmentWidget(root) {
  let seqA = 'GATTACA';
  let seqB = 'GCATGCU';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Needleman-Wunsch matrix &amp; traceback</div>
      <div class="controls">
        <label>A:</label>
        <input id="al-a" type="text" value="${seqA}" maxlength="10" style="width:90px;font-family:var(--font-mono);padding:0.3em 0.5em;border:2px solid var(--ink);border-radius:var(--radius);background:var(--paper-deep);">
        <label>B:</label>
        <input id="al-b" type="text" value="${seqB}" maxlength="10" style="width:90px;font-family:var(--font-mono);padding:0.3em 0.5em;border:2px solid var(--ink);border-radius:var(--radius);background:var(--paper-deep);">
        <button class="btn" data-s="0">GATTACA</button>
        <button class="btn" data-s="1">ACGT…</button>
        <button class="btn" data-s="2">identical</button>
      </div>
      <div class="widget-stage" id="al-stage" style="min-height:340px;"></div>
      <div class="callout" id="al-explain"></div>
    </div>
  `;

  const aInp = root.querySelector('#al-a');
  const bInp = root.querySelector('#al-b');
  function clean(s) { return s.toUpperCase().replace(/[^ATGCU]/g, '').slice(0, 10); }
  aInp.addEventListener('input', () => { seqA = clean(aInp.value); aInp.value = seqA; render(); });
  bInp.addEventListener('input', () => { seqB = clean(bInp.value); bInp.value = seqB; render(); });
  [0,1,2].forEach((i) => root.querySelector(`[data-s="${i}"]`).addEventListener('click', () => {
    seqA = SAMPLES[i][0]; seqB = SAMPLES[i][1]; aInp.value = seqA; bInp.value = seqB; render();
  }));

  function render() {
    if (!seqA || !seqB) {
      root.querySelector('#al-stage').innerHTML = '<div style="padding:1rem;">Enter two sequences.</div>';
      return;
    }
    const r = align(seqA, seqB);
    const n = seqA.length, m = seqB.length;
    const cell = 36;
    const padL = 60, padT = 40;
    const W = padL + (m + 1) * cell + 20;
    const H = padT + (n + 1) * cell + 100;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    // column labels (B)
    svg += `<text x="${padL + cell/2}" y="${padT - 20}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;">·</text>`;
    for (let j = 0; j < m; j++) {
      svg += `<text x="${padL + (j+1) * cell + cell/2}" y="${padT - 20}" text-anchor="middle" style="font-family:var(--font-mono);font-size:13px;font-weight:700;fill:${COLOR[seqB[j]] || 'var(--ink)'};">${seqB[j]}</text>`;
    }
    // row labels (A)
    svg += `<text x="${padL - 25}" y="${padT + cell/2 + 4}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;">·</text>`;
    for (let i = 0; i < n; i++) {
      svg += `<text x="${padL - 25}" y="${padT + (i+1)*cell + cell/2 + 4}" text-anchor="middle" style="font-family:var(--font-mono);font-size:13px;font-weight:700;fill:${COLOR[seqA[i]] || 'var(--ink)'};">${seqA[i]}</text>`;
    }
    // grid cells
    const pathSet = new Set(r.path.map(([i,j]) => `${i},${j}`));
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= m; j++) {
        const x = padL + j * cell;
        const y = padT + i * cell;
        const onPath = pathSet.has(`${i},${j}`);
        svg += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${onPath ? '#f4b8b8' : 'var(--paper)'}" stroke="var(--ink)" stroke-width="1"/>`;
        svg += `<text x="${x + cell/2}" y="${y + cell/2 + 4}" text-anchor="middle" style="font-family:var(--font-mono);font-size:12px;font-weight:${onPath ? 700 : 400};">${r.M[i][j]}</text>`;
      }
    }
    // traceback arrows
    for (let k = 1; k < r.path.length; k++) {
      const [pi, pj] = r.path[k-1];
      const [ci, cj] = r.path[k];
      const x1 = padL + pj * cell + cell/2;
      const y1 = padT + pi * cell + cell/2;
      const x2 = padL + cj * cell + cell/2;
      const y2 = padT + ci * cell + cell/2;
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--accent)" stroke-width="2" opacity="0.8"/>`;
    }
    // aligned strings below
    const ay = padT + (n + 1) * cell + 30;
    let ax = padL;
    const aBases = r.aligned.a.split('');
    const bBases = r.aligned.b.split('');
    for (let i = 0; i < aBases.length; i++) {
      const ca = aBases[i], cb = bBases[i];
      const match = ca === cb && ca !== '-';
      svg += `<rect x="${ax}" y="${ay - 14}" width="22" height="20" fill="${COLOR[ca] || '#ccc'}" stroke="var(--ink)" rx="3"/>`;
      svg += `<text x="${ax + 11}" y="${ay + 1}" text-anchor="middle" style="font-family:var(--font-mono);font-size:12px;font-weight:700;fill:white;">${ca}</text>`;
      svg += `<rect x="${ax}" y="${ay + 8}" width="22" height="20" fill="${COLOR[cb] || '#ccc'}" stroke="var(--ink)" rx="3"/>`;
      svg += `<text x="${ax + 11}" y="${ay + 23}" text-anchor="middle" style="font-family:var(--font-mono);font-size:12px;font-weight:700;fill:white;">${cb}</text>`;
      if (match) svg += `<text x="${ax + 11}" y="${ay + 45}" text-anchor="middle" style="font-family:var(--font-mono);font-size:12px;fill:var(--accent);">|</text>`;
      ax += 26;
    }
    svg += `</svg>`;
    root.querySelector('#al-stage').innerHTML = svg;

    const matches = aBases.filter((c, i) => c === bBases[i] && c !== '-').length;
    root.querySelector('#al-explain').innerHTML =
      `<strong>Final score: ${r.score}.</strong> ${matches} matches, ${aBases.length - matches} mismatches/gaps. The pink path is the traceback from bottom-right to top-left — each step is a match (diagonal), gap-in-A (down), or gap-in-B (right). Scoring: match +1, mismatch −1, gap −2.`;
  }

  render();
}
