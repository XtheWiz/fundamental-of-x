// Transcription widget: animate RNA polymerase walking the template, building mRNA.

const DNA_COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
const DNA_TO_RNA = { A: 'U', T: 'A', G: 'C', C: 'G' };
const COLOR = { A: '#e74c3c', T: '#3498db', G: '#f39c12', C: '#27ae60', U: '#9b59b6' };

const TEMPLATE = 'TACGCATGCAATCGGTACCAGTTACGCATGCAA'; // template strand (3'→5'); read to build RNA

export function initTranscriptionWidget(root) {
  let pos = 0;
  let playing = true;
  let raf = null;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">RNA polymerase reads DNA, writes mRNA</div>
      <div class="controls">
        <button class="btn" id="tx-play">${playing ? 'Pause' : 'Play'}</button>
        <button class="btn" id="tx-reset">Reset</button>
        <label style="margin-left:1rem;">Position:</label>
        <input type="range" id="tx-pos" min="0" max="${TEMPLATE.length}" value="0" style="flex:1;min-width:160px;">
      </div>
      <div class="widget-stage" id="tx-stage" style="min-height:240px;"></div>
      <div class="callout" id="tx-explain"></div>
    </div>
  `;

  const slider = root.querySelector('#tx-pos');
  const playBtn = root.querySelector('#tx-play');
  slider.addEventListener('input', () => { pos = +slider.value; render(); });
  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.textContent = playing ? 'Pause' : 'Play';
    if (playing) tick();
  });
  root.querySelector('#tx-reset').addEventListener('click', () => {
    pos = 0; slider.value = 0; render();
  });

  function tick() {
    if (!playing) return;
    pos += 0.18;
    if (pos >= TEMPLATE.length) pos = TEMPLATE.length;
    slider.value = pos;
    render();
    if (pos < TEMPLATE.length) raf = requestAnimationFrame(tick);
    else { playing = false; playBtn.textContent = 'Play'; }
  }

  function render() {
    const W = 700, H = 230;
    const bw = 20;
    const startX = 30;
    const dnaTopY = 60;
    const dnaBotY = 100;
    const rnaY = 180;

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<text x="20" y="20" style="font-family:var(--font-display);font-size:13px;">Template DNA</text>`;
    svg += `<text x="20" y="170" style="font-family:var(--font-display);font-size:13px;">mRNA being synthesized</text>`;

    const polX = startX + pos * bw;

    for (let i = 0; i < TEMPLATE.length; i++) {
      const x = startX + i * bw;
      const tBase = TEMPLATE[i];
      const coding = DNA_COMP[tBase];

      // open bubble around polymerase
      const dist = Math.abs(x - polX);
      const isOpen = dist < 30;
      const sep = isOpen ? (30 - dist) * 0.6 : 0;

      // coding strand on top
      svg += `<rect x="${x-10}" y="${dnaTopY - sep - 10}" width="20" height="20" fill="${COLOR[coding]}" stroke="var(--ink)" rx="3" opacity="0.55"/>`;
      svg += `<text x="${x}" y="${dnaTopY - sep + 5}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:700;fill:white;opacity:0.85;">${coding}</text>`;

      // template strand on bottom
      svg += `<rect x="${x-10}" y="${dnaBotY + sep - 10}" width="20" height="20" fill="${COLOR[tBase]}" stroke="var(--ink)" stroke-width="2" rx="3"/>`;
      svg += `<text x="${x}" y="${dnaBotY + sep + 5}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:700;fill:white;">${tBase}</text>`;

      // mRNA — placed below
      if (i < Math.floor(pos)) {
        const rna = DNA_TO_RNA[tBase];
        svg += `<rect x="${x-10}" y="${rnaY - 10}" width="20" height="20" fill="${COLOR[rna]}" stroke="var(--ink)" stroke-width="1.5" rx="3"/>`;
        svg += `<text x="${x}" y="${rnaY + 5}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:700;fill:white;">${rna}</text>`;
      }
    }

    // polymerase
    if (pos < TEMPLATE.length) {
      svg += `<rect x="${polX - 30}" y="${dnaTopY - 35}" width="60" height="80" rx="14" fill="#f4b8b8" stroke="var(--ink)" stroke-width="2"/>`;
      svg += `<text x="${polX}" y="${dnaTopY - 18}" text-anchor="middle" style="font-family:var(--font-display);font-size:11px;">RNA pol</text>`;
      svg += `<text x="${polX}" y="${dnaTopY - 5}" text-anchor="middle" style="font-family:var(--font-mono);font-size:9px;">⤵</text>`;
    }

    svg += `</svg>`;
    root.querySelector('#tx-stage').innerHTML = svg;

    const done = Math.floor(pos);
    let exp = '';
    if (done === 0) exp = `<strong>Click Play.</strong> RNA polymerase will scan the template strand 3'→5' and build mRNA 5'→3' using A↔U, G↔C pairing.`;
    else if (done >= TEMPLATE.length) {
      const rna = TEMPLATE.split('').map((b) => DNA_TO_RNA[b]).join('');
      exp = `<strong>Done.</strong> Full mRNA: <code style="background:var(--paper-deep);padding:0 0.3em;">${rna}</code>. Notice every T in the DNA became a U in the RNA.`;
    } else exp = `<strong>${done} / ${TEMPLATE.length}</strong> bases transcribed. Note: template (bottom) bases get paired to the RNA bases below — A→U, T→A, G→C, C→G.`;
    root.querySelector('#tx-explain').innerHTML = exp;
  }

  render();
  tick();
}
