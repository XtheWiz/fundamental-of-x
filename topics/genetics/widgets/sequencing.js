// Sequencing widget: compare technologies on read-length, accuracy, throughput, cost.
// Also: visualize short-read shotgun coverage on a reference.

const COLOR = { A: '#e74c3c', T: '#3498db', G: '#f39c12', C: '#27ae60' };

const REF = 'ATGCATGCAATTGGCCAAGTAGCCATGGTTAGCCAAGTAGCCATGG';

const TECHS = {
  sanger:   { name: 'Sanger',   readLen: 28, errRate: 0.001, readCount: 2,   color: '#2b6cb0' },
  illumina: { name: 'Illumina', readLen: 10, errRate: 0.005, readCount: 12,  color: '#388e3c' },
  nanopore: { name: 'Nanopore', readLen: 40, errRate: 0.08,  readCount: 3,   color: '#d62828' },
};

const COMPARISON = [
  { tech: 'Sanger',   length: '~1 kb',   acc: '99.9%',   cost: '$$$',  through: 'low',  use: 'gold standard, single-gene confirmation' },
  { tech: 'Illumina', length: '50–300 bp', acc: '99.9%',  cost: '$',    through: 'huge', use: 'WGS, RNA-seq, exome — most production work' },
  { tech: 'PacBio',   length: '10–25 kb', acc: '99% (HiFi)', cost: '$$', through: 'med', use: 'de novo assembly, structural variants' },
  { tech: 'Nanopore', length: '10kb–1Mb', acc: '95–99%', cost: '$$',   through: 'med',  use: 'field sequencing, in-vivo modifications' },
];

function randInt(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s; };
}

function generateReads(tech, refLen, rngSeed) {
  const rand = randInt(rngSeed);
  const reads = [];
  for (let i = 0; i < tech.readCount; i++) {
    const start = Math.floor((rand() / 4294967296) * (refLen - tech.readLen));
    reads.push({ start, len: Math.min(tech.readLen, refLen - start) });
  }
  return reads;
}

export function initSequencingWidget(root) {
  let pickTech = 'illumina';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Reads vs reference — coverage view</div>
      <div class="controls">
        ${Object.keys(TECHS).map((k) => `<button class="btn" data-t="${k}">${TECHS[k].name}</button>`).join('')}
      </div>
      <div class="widget-stage" id="sq-stage" style="min-height:240px;"></div>
      <div class="callout" id="sq-explain"></div>
      <div style="margin-top:1.2rem;">
        <div style="font-family:var(--font-display);font-size:1.1rem;margin-bottom:0.3rem;">All four side by side</div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
            <thead>
              <tr style="background:var(--paper-deep);">
                <th style="text-align:left;padding:0.4rem 0.6rem;border:1.5px solid var(--ink);">Tech</th>
                <th style="text-align:left;padding:0.4rem 0.6rem;border:1.5px solid var(--ink);">Read length</th>
                <th style="text-align:left;padding:0.4rem 0.6rem;border:1.5px solid var(--ink);">Accuracy</th>
                <th style="text-align:left;padding:0.4rem 0.6rem;border:1.5px solid var(--ink);">Cost / Gb</th>
                <th style="text-align:left;padding:0.4rem 0.6rem;border:1.5px solid var(--ink);">Throughput</th>
                <th style="text-align:left;padding:0.4rem 0.6rem;border:1.5px solid var(--ink);">Typical use</th>
              </tr>
            </thead>
            <tbody>
              ${COMPARISON.map((c) => `<tr>
                <td style="padding:0.4rem 0.6rem;border:1.5px solid var(--ink);font-family:var(--font-mono);font-weight:600;">${c.tech}</td>
                <td style="padding:0.4rem 0.6rem;border:1.5px solid var(--ink);font-family:var(--font-mono);">${c.length}</td>
                <td style="padding:0.4rem 0.6rem;border:1.5px solid var(--ink);font-family:var(--font-mono);">${c.acc}</td>
                <td style="padding:0.4rem 0.6rem;border:1.5px solid var(--ink);font-family:var(--font-mono);">${c.cost}</td>
                <td style="padding:0.4rem 0.6rem;border:1.5px solid var(--ink);font-family:var(--font-mono);">${c.through}</td>
                <td style="padding:0.4rem 0.6rem;border:1.5px solid var(--ink);">${c.use}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  root.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { pickTech = b.dataset.t; render(); }));

  function render() {
    const tech = TECHS[pickTech];
    const reads = generateReads(tech, REF.length, 42);
    const W = 700, H = 230, bw = 13;
    const startX = 20;
    const refY = 40;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<text x="20" y="20" style="font-family:var(--font-display);font-size:13px;">Reference</text>`;
    // reference
    for (let i = 0; i < REF.length; i++) {
      const x = startX + i * bw;
      const ch = REF[i];
      svg += `<rect x="${x-6}" y="${refY-7}" width="12" height="14" fill="${COLOR[ch]}" stroke="var(--ink)" stroke-width="1"/>`;
      svg += `<text x="${x}" y="${refY+3}" text-anchor="middle" style="font-family:var(--font-mono);font-size:9px;fill:white;font-weight:700;">${ch}</text>`;
    }

    // reads stacked below
    svg += `<text x="20" y="70" style="font-family:var(--font-display);font-size:13px;">${tech.name} reads</text>`;
    reads.forEach((r, idx) => {
      const y = 90 + idx * 12;
      const x = startX + r.start * bw - 6;
      const w = r.len * bw;
      svg += `<rect x="${x}" y="${y-4}" width="${w}" height="8" fill="${tech.color}" stroke="var(--ink)" stroke-width="1" opacity="0.85"/>`;
      // inject errors randomly
      const errs = Math.round(tech.errRate * r.len * (1 + Math.sin(idx*7)));
      for (let e = 0; e < errs; e++) {
        const ex = x + ((e * 17 + idx * 3) % w);
        svg += `<circle cx="${ex}" cy="${y}" r="2.5" fill="var(--accent)" stroke="var(--ink)" stroke-width="0.5"/>`;
      }
    });
    svg += `</svg>`;
    root.querySelector('#sq-stage').innerHTML = svg;

    const notes = {
      sanger:   `<strong>Sanger.</strong> Long, very accurate reads. ${tech.readCount} reads ~${tech.readLen} bp each. The expensive workhorse for confirming clinical findings.`,
      illumina: `<strong>Illumina.</strong> Many short reads (${tech.readCount}× ${tech.readLen} bp here, ~billions in reality). 99.9% accurate. Stacking them gives "coverage" — every base read 30–100× over.`,
      nanopore: `<strong>Nanopore.</strong> Fewer but very long reads. Higher error rate (red dots) but spans repeats and structural variants short reads can't resolve.`,
    };
    root.querySelector('#sq-explain').innerHTML = notes[pickTech];
  }

  render();
}
