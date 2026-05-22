// Replication widget: animate a fork opening, polymerase synthesizing new strands.

const COMPLEMENT = { A: 'T', T: 'A', G: 'C', C: 'G' };
const COLOR = { A: '#e74c3c', T: '#3498db', G: '#f39c12', C: '#27ae60' };

const TEMPLATE = 'ATGCGTACGTTAGCCATGGTCAATGCGTACGTTAGCC';

export function initReplicationWidget(root) {
  let forkPos = 0; // 0..TEMPLATE.length
  let playing = true;
  let raf = null;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">A replication fork in motion</div>
      <div class="controls">
        <button class="btn" id="rp-play">${playing ? 'Pause' : 'Play'}</button>
        <button class="btn" id="rp-reset">Reset</button>
        <label style="margin-left:1rem;">Position:</label>
        <input type="range" id="rp-pos" min="0" max="${TEMPLATE.length}" value="0" style="flex:1;min-width:160px;">
      </div>
      <div class="widget-stage" id="rp-stage" style="min-height:240px;"></div>
      <div class="callout" id="rp-explain"></div>
    </div>
  `;

  const slider = root.querySelector('#rp-pos');
  const playBtn = root.querySelector('#rp-play');
  slider.addEventListener('input', () => { forkPos = +slider.value; render(); });
  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.textContent = playing ? 'Pause' : 'Play';
    if (playing) tick();
  });
  root.querySelector('#rp-reset').addEventListener('click', () => {
    forkPos = 0;
    slider.value = 0;
    render();
  });

  function tick() {
    if (!playing) return;
    forkPos += 0.15;
    if (forkPos >= TEMPLATE.length) forkPos = TEMPLATE.length;
    slider.value = forkPos;
    render();
    if (forkPos < TEMPLATE.length) raf = requestAnimationFrame(tick);
    else { playing = false; playBtn.textContent = 'Play'; }
  }

  function render() {
    const W = 680, H = 230;
    const bw = 18;
    const startX = 30;
    const topY = 50;
    const botY = 130;
    const forkX = startX + forkPos * bw;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;

    // labels
    svg += `<text x="20" y="20" style="font-family:var(--font-display);font-size:13px;">Original duplex (template)</text>`;
    svg += `<text x="20" y="${topY-5}" style="font-family:var(--font-mono);font-size:10px;fill:var(--ink-soft);">5'</text>`;
    svg += `<text x="${W-22}" y="${topY-5}" style="font-family:var(--font-mono);font-size:10px;fill:var(--ink-soft);">3'</text>`;

    // unzipped section: split top/bottom strands moving apart toward fork
    for (let i = 0; i < TEMPLATE.length; i++) {
      const x = startX + i * bw;
      const topBase = TEMPLATE[i];
      const botBase = COMPLEMENT[topBase];

      if (i < Math.floor(forkPos)) {
        // already replicated — show two new duplexes (top one and bottom one)
        // top duplex
        svg += `<rect x="${x-9}" y="${10}" width="18" height="18" fill="${COLOR[topBase]}" stroke="var(--ink)" rx="3"/>`;
        svg += `<text x="${x}" y="${24}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:700;fill:white;">${topBase}</text>`;
        // new complement for top
        const newComp = COMPLEMENT[topBase];
        svg += `<line x1="${x}" y1="${30}" x2="${x}" y2="${42}" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="2,2"/>`;
        svg += `<rect x="${x-9}" y="${42}" width="18" height="18" fill="${COLOR[newComp]}" stroke="var(--accent)" stroke-width="2" rx="3"/>`;
        svg += `<text x="${x}" y="${56}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:700;fill:white;">${newComp}</text>`;
        // new strand for bottom template
        const newTop = COMPLEMENT[botBase];
        svg += `<rect x="${x-9}" y="${130}" width="18" height="18" fill="${COLOR[newTop]}" stroke="var(--accent)" stroke-width="2" rx="3"/>`;
        svg += `<text x="${x}" y="${144}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:700;fill:white;">${newTop}</text>`;
        svg += `<line x1="${x}" y1="${148}" x2="${x}" y2="${160}" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="2,2"/>`;
        svg += `<rect x="${x-9}" y="${160}" width="18" height="18" fill="${COLOR[botBase]}" stroke="var(--ink)" rx="3"/>`;
        svg += `<text x="${x}" y="${174}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:700;fill:white;">${botBase}</text>`;
      } else {
        // still duplex — but spreading at the fork
        const spread = Math.max(0, 10 - Math.abs(x - forkX) / 4);
        svg += `<rect x="${x-9}" y="${topY - spread}" width="18" height="18" fill="${COLOR[topBase]}" stroke="var(--ink)" rx="3"/>`;
        svg += `<text x="${x}" y="${topY - spread + 14}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:700;fill:white;">${topBase}</text>`;
        svg += `<rect x="${x-9}" y="${botY + spread}" width="18" height="18" fill="${COLOR[botBase]}" stroke="var(--ink)" rx="3"/>`;
        svg += `<text x="${x}" y="${botY + spread + 14}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:700;fill:white;">${botBase}</text>`;
        if (i >= Math.floor(forkPos)) {
          svg += `<line x1="${x}" y1="${topY + 18 - spread}" x2="${x}" y2="${botY + spread}" stroke="var(--ink-faint)" stroke-width="1"/>`;
        }
      }
    }

    // helicase indicator
    if (forkPos < TEMPLATE.length) {
      svg += `<circle cx="${forkX}" cy="${(topY + botY)/2 + 9}" r="14" fill="#f4b8b8" stroke="var(--ink)" stroke-width="2"/>`;
      svg += `<text x="${forkX}" y="${(topY+botY)/2 + 13}" text-anchor="middle" style="font-family:var(--font-display);font-size:10px;">helicase</text>`;
    }

    // legend
    svg += `<g transform="translate(20,${H-22})">
      <rect x="0" y="0" width="14" height="14" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>
      <text x="20" y="11" style="font-family:var(--font-mono);font-size:10px;">old strand</text>
      <rect x="120" y="0" width="14" height="14" fill="var(--paper)" stroke="var(--accent)" stroke-width="2"/>
      <text x="140" y="11" style="font-family:var(--font-mono);font-size:10px;">newly synthesized</text>
    </g>`;
    svg += `</svg>`;
    root.querySelector('#rp-stage').innerHTML = svg;

    const done = Math.floor(forkPos);
    let exp = '';
    if (done === 0) exp = `Press <strong>Play</strong>. Helicase will unwind the helix; polymerase will fill in each new strand from the templates.`;
    else if (done >= TEMPLATE.length) exp = `<strong>Complete.</strong> Two daughter duplexes, each containing one original (black) and one new (red) strand. Semiconservative replication — that's the principle Meselson &amp; Stahl proved in 1958.`;
    else exp = `<strong>${done} / ${TEMPLATE.length}</strong> base pairs replicated. The fork is mid-genome. Note both daughter duplexes contain one old strand and one new.`;
    root.querySelector('#rp-explain').innerHTML = exp;
  }

  render();
  tick();
}
