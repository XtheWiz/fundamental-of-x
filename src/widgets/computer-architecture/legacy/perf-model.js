// Performance model widget: same loop, four variants, with cycle
// breakdown showing where time goes (retired, cache miss, mispredict,
// false sharing).

const VARIANTS = {
  baseline: {
    label: 'Baseline: random-access AoS loop with unpredictable branch',
    code: `for (int i = 0; i < N; i++) {
  if (data[indices[i]].x > THRESHOLD) {  // unpredictable
    result += data[indices[i]].score;     // pointer chase, AoS
  }
}`,
    breakdown: { retired: 12, cacheMiss: 55, mispredict: 23, coherence: 0, deps: 10 },
    total: 100,
    crossLinks: ['locality', 'branch-prediction'],
    diagnosis: '<strong>Cache misses dominate.</strong> Random indices defeat the prefetcher, AoS layout wastes most of each line. Unpredictable branch adds 23% on top.',
  },
  sortedSeq: {
    label: 'Variant: sequential access + sorted array (predictable branch)',
    code: `// data is now sorted by x
for (int i = 0; i < N; i++) {
  if (data[i].x > THRESHOLD) {            // predictable after sort
    result += data[i].score;
  }
}`,
    breakdown: { retired: 60, cacheMiss: 25, mispredict: 3, coherence: 0, deps: 12 },
    total: 42,
    crossLinks: ['branch-prediction', 'locality'],
    diagnosis: 'Sorting collapsed the mispredictions (the branch is now monotonic). Sequential access lets the prefetcher do its job. <strong>~2.4× faster</strong> with no algorithmic change.',
  },
  soa: {
    label: 'Variant: Struct-of-Arrays layout (better cache use)',
    code: `// data split into separate arrays: xs[], scores[]
for (int i = 0; i < N; i++) {
  if (xs[i] > THRESHOLD) {                // still predictable
    result += scores[i];                  // tight, dense access
  }
}`,
    breakdown: { retired: 78, cacheMiss: 10, mispredict: 3, coherence: 0, deps: 9 },
    total: 30,
    crossLinks: ['locality', 'cache'],
    diagnosis: 'Splitting xs and scores into their own arrays means each cache line holds 16 useful values, not 4. Cache misses drop again. <strong>~3.3× faster than baseline.</strong>',
  },
  simdMulti: {
    label: 'Variant: SoA + SIMD + per-thread state',
    code: `#pragma omp parallel for simd
for (int i = 0; i < N; i++) {
  __m256 mask = _mm256_cmp_ps(xs[i..i+8] > THRESHOLD);
  result[tid] += hsum(_mm256_and_ps(mask, scores[i..i+8]));
}`,
    breakdown: { retired: 88, cacheMiss: 7, mispredict: 1, coherence: 1, deps: 3 },
    total: 8,
    crossLinks: ['simd', 'false-sharing'],
    diagnosis: 'SIMD does 8 lanes at once; per-thread <code>result[tid]</code> is padded to avoid false sharing. <strong>~12× faster than baseline.</strong> Almost all cycles now do real work.',
  },
};

const COLORS = {
  retired:   { color: '#2a8a3e', label: 'Retired (real work)' },
  cacheMiss: { color: '#d62828', label: 'Cache miss stall' },
  mispredict:{ color: '#b07b1a', label: 'Branch mispredict' },
  coherence: { color: '#7f4eb6', label: 'Coherence (false sharing)' },
  deps:      { color: '#888',    label: 'Data dependencies' },
};

const LESSON_LINKS = {
  'locality': 'Memory Locality',
  'branch-prediction': 'Branch Prediction',
  'cache': 'Cache Hierarchy',
  'simd': 'SIMD',
  'false-sharing': 'False Sharing',
};

export function initPerfModelWidget(root) {
  let variant = 'baseline';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Same loop, four variants</div>

      <div class="controls">
        <label>Variant:</label>
        <select class="field" id="pm-variant" style="min-width: 260px;">
          ${Object.entries(VARIANTS).map(([id, v]) => `<option value="${id}">${v.label}</option>`).join('')}
        </select>
      </div>

      <div class="widget-stage" id="pm-stage" style="min-height: 380px;"></div>
      <div class="callout" id="pm-diag"></div>
    </div>
  `;

  root.querySelector('#pm-variant').addEventListener('change', (e) => { variant = e.target.value; render(); });

  function render() {
    const v = VARIANTS[variant];
    const baseline = VARIANTS.baseline.total;
    const ratio = (baseline / v.total).toFixed(1);

    let html = `
      <div class="pm-grid">
        <div class="pm-code-panel">
          <div class="pm-panel-label">CODE</div>
          <pre>${escape(v.code)}</pre>
        </div>
        <div class="pm-profile-panel">
          <div class="pm-panel-label">CYCLE BREAKDOWN</div>
          <div class="pm-bar">
    `;
    let cum = 0;
    Object.entries(v.breakdown).forEach(([key, pct]) => {
      html += `<div class="pm-bar-seg" style="width: ${pct}%; background: ${COLORS[key].color};" title="${COLORS[key].label}: ${pct}%">${pct > 8 ? pct + '%' : ''}</div>`;
      cum += pct;
    });
    html += `</div>
          <div class="pm-legend">
            ${Object.entries(v.breakdown).map(([key, pct]) => `
              <div class="pm-legend-item">
                <div class="pm-legend-swatch" style="background: ${COLORS[key].color}"></div>
                <span>${COLORS[key].label}: <strong>${pct}%</strong></span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="pm-bottom">
        <div class="pm-metric">
          <div class="pm-metric-label">Relative time</div>
          <div class="pm-metric-value">${v.total} units</div>
          <div class="pm-metric-sub">${variant === 'baseline' ? '(baseline)' : `${ratio}× faster than baseline`}</div>
        </div>
        <div class="pm-links">
          <div class="pm-links-label">Related lessons:</div>
          ${v.crossLinks.map((l) => `<a class="pm-link" href="${l}.html">${LESSON_LINKS[l]}</a>`).join('')}
        </div>
      </div>
    `;
    html += `<style>
      .pm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 0.6rem; }
      @media (max-width: 720px) { .pm-grid { grid-template-columns: 1fr; } }
      .pm-panel-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
      .pm-code-panel { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; overflow-x: auto; }
      .pm-code-panel pre { margin: 0; font-family: var(--font-mono); font-size: 0.75rem; background: transparent; border: none; padding: 0; line-height: 1.5; }
      .pm-profile-panel { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; }
      .pm-bar { display: flex; height: 32px; border: 1.5px solid var(--ink); border-radius: 3px; overflow: hidden; margin-bottom: 0.6rem; background: var(--paper); }
      .pm-bar-seg { color: white; font-family: var(--font-mono); font-size: 0.75rem; display: flex; align-items: center; justify-content: center; border-right: 1px solid rgba(0,0,0,0.2); }
      .pm-legend { display: flex; flex-direction: column; gap: 0.2em; }
      .pm-legend-item { display: flex; align-items: center; gap: 0.4em; font-family: var(--font-mono); font-size: 0.75rem; }
      .pm-legend-swatch { width: 14px; height: 14px; border: 1px solid var(--ink); border-radius: 2px; }
      .pm-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
      .pm-metric { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; box-shadow: 3px 3px 0 var(--accent); }
      .pm-metric-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; }
      .pm-metric-value { font-family: var(--font-display); font-size: 1.8rem; letter-spacing: 0.04em; }
      .pm-metric-sub { font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft); }
      .pm-links { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; }
      .pm-links-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
      .pm-link { display: inline-block; font-family: var(--font-display); letter-spacing: 0.04em; font-size: 0.85rem; padding: 0.15em 0.5em; margin: 0.15em 0.2em 0.15em 0; border: 1.5px solid var(--ink); border-radius: 2px; background: var(--paper-deep); text-decoration: none; color: var(--ink); }
      .pm-link:hover { background: var(--accent-soft); border-color: var(--accent); }
      @media (max-width: 540px) { .pm-bottom { grid-template-columns: 1fr; } }
    </style>`;
    root.querySelector('#pm-stage').innerHTML = html;

    root.querySelector('#pm-diag').innerHTML = v.diagnosis;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  render();
}
