// Helix widget: edit a strand, see complement auto-computed, render rotating helix.

const COMPLEMENT = { A: 'T', T: 'A', G: 'C', C: 'G' };
const COLOR = { A: '#e74c3c', T: '#3498db', G: '#f39c12', C: '#27ae60' };

function clean(s) { return s.toUpperCase().replace(/[^ATGC]/g, ''); }

export function initHelixWidget(root) {
  let seq = 'ATGCGTACGTTAGCCATGGTC';
  let rotation = 0;
  let raf = null;
  let playing = true;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Edit a strand, watch the helix</div>
      <div class="controls">
        <label>Strand 5'→3':</label>
        <input id="hx-seq" type="text" value="${seq}" maxlength="40" style="flex:1;min-width:200px;font-family:var(--font-mono);font-size:0.95rem;letter-spacing:0.15em;padding:0.45em 0.7em;border:2px solid var(--ink);border-radius:var(--radius);background:var(--paper-deep);">
        <button class="btn" id="hx-play">${playing ? 'Pause' : 'Spin'}</button>
      </div>
      <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--ink-soft);margin:0.3rem 0;">
        Complement 3'→5': <span id="hx-comp" style="letter-spacing:0.15em;color:var(--ink);font-weight:600;"></span>
      </div>
      <div class="widget-stage" id="hx-stage" style="min-height:280px;"></div>
      <div class="callout" id="hx-stats"></div>
    </div>
  `;

  const inp = root.querySelector('#hx-seq');
  inp.addEventListener('input', () => {
    seq = clean(inp.value);
    inp.value = seq;
    render();
  });
  root.querySelector('#hx-play').addEventListener('click', (e) => {
    playing = !playing;
    e.target.textContent = playing ? 'Pause' : 'Spin';
    if (playing) tick();
  });

  function complement(s) { return s.split('').map((b) => COMPLEMENT[b] || '?').join(''); }

  function render() {
    root.querySelector('#hx-comp').textContent = complement(seq);
    const W = 600, H = 260;
    const cx = W/2;
    const n = seq.length;
    const step = (H - 30) / Math.max(1, n - 1);
    const r = 50;  // helix amplitude
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;

    // backbones as two sinusoid paths
    let path1 = '', path2 = '';
    for (let i = 0; i < n; i++) {
      const y = 15 + i * step;
      const ang = (i / 10) * Math.PI * 2 + rotation;
      const x1 = cx + Math.sin(ang) * r;
      const x2 = cx - Math.sin(ang) * r;
      path1 += (i === 0 ? 'M' : 'L') + `${x1},${y} `;
      path2 += (i === 0 ? 'M' : 'L') + `${x2},${y} `;
    }
    svg += `<path d="${path1}" fill="none" stroke="var(--ink)" stroke-width="2.5"/>`;
    svg += `<path d="${path2}" fill="none" stroke="var(--ink-soft)" stroke-width="2.5"/>`;

    // base pairs
    for (let i = 0; i < n; i++) {
      const y = 15 + i * step;
      const ang = (i / 10) * Math.PI * 2 + rotation;
      const s = Math.sin(ang);
      const x1 = cx + s * r;
      const x2 = cx - s * r;
      const b1 = seq[i];
      const b2 = COMPLEMENT[b1] || '?';
      const z = Math.cos(ang); // depth → opacity & order
      const opacity = 0.4 + 0.6 * ((z + 1) / 2);
      svg += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="var(--ink-soft)" stroke-width="1.2" opacity="${opacity * 0.6}"/>`;
      svg += `<g opacity="${opacity}">`;
      svg += `<rect x="${x1-9}" y="${y-9}" width="18" height="18" fill="${COLOR[b1]}" stroke="var(--ink)" stroke-width="1.5" rx="3"/>`;
      svg += `<text x="${x1}" y="${y+4}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:700;fill:white;">${b1}</text>`;
      svg += `<rect x="${x2-9}" y="${y-9}" width="18" height="18" fill="${COLOR[b2]}" stroke="var(--ink)" stroke-width="1.5" rx="3"/>`;
      svg += `<text x="${x2}" y="${y+4}" text-anchor="middle" style="font-family:var(--font-mono);font-size:11px;font-weight:700;fill:white;">${b2}</text>`;
      svg += `</g>`;
    }
    svg += `</svg>`;
    root.querySelector('#hx-stage').innerHTML = svg;

    const counts = { A: 0, T: 0, G: 0, C: 0 };
    seq.split('').forEach((b) => { if (counts[b] !== undefined) counts[b]++; });
    const gc = ((counts.G + counts.C) / Math.max(1, seq.length) * 100).toFixed(0);
    root.querySelector('#hx-stats').innerHTML =
      `<strong>${seq.length} bp.</strong> A: ${counts.A}, T: ${counts.T}, G: ${counts.G}, C: ${counts.C}. <strong>GC content: ${gc}%</strong> — higher GC means tighter binding and higher melting temperature.`;
  }

  function tick() {
    if (!playing) return;
    rotation += 0.03;
    render();
    raf = requestAnimationFrame(tick);
  }

  render();
  tick();
}
