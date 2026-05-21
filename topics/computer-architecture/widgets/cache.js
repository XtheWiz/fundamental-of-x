// Cache hierarchy widget: clickable tiers showing actual + human-scale
// latency, plus a log-scale strip placing them all in one view.

const TIERS = [
  { id: 'reg',  label: 'Register', ns: 0.3,        size: '~200 bytes',   color: '#c8f0c8' },
  { id: 'l1',   label: 'L1 cache', ns: 1,          size: '~32 KB',       color: '#cfe5ff' },
  { id: 'l2',   label: 'L2 cache', ns: 4,          size: '~512 KB',      color: '#cfe5ff' },
  { id: 'l3',   label: 'L3 cache', ns: 10,         size: '~16 MB',       color: '#ffe9b3' },
  { id: 'ram',  label: 'RAM',      ns: 100,        size: '~16 GB',       color: '#ffe9b3' },
  { id: 'ssd',  label: 'NVMe SSD', ns: 100_000,    size: '~1 TB',        color: '#f7c8c8' },
  { id: 'hdd',  label: 'Spinning disk', ns: 10_000_000, size: '~4 TB',   color: '#f7c8c8' },
  { id: 'net',  label: 'Network RTT (same region)', ns: 50_000_000, size: 'internet', color: '#e6d6ff' },
];

// scaling: if L1 = 1 second, what does each other take?
const L1_NS = 1;
function humanScale(ns) {
  const sec = ns / L1_NS;
  if (sec < 1) return `${(sec * 1000).toPrecision(2)} ms`;
  if (sec < 60) return `${sec.toPrecision(2)} sec`;
  if (sec < 3600) return `${(sec / 60).toPrecision(2)} min`;
  if (sec < 86400) return `${(sec / 3600).toPrecision(2)} hours`;
  if (sec < 86400 * 365) return `${(sec / 86400).toPrecision(2)} days`;
  return `${(sec / (86400 * 365)).toPrecision(3)} years`;
}

export function initCacheWidget(root) {
  let selected = 'l1';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Latency at every tier</div>

      <div class="cc-tiers" id="cc-tiers"></div>

      <div class="cc-detail" id="cc-detail"></div>

      <div class="cc-strip" id="cc-strip"></div>

      <div class="callout" id="cc-explain"></div>

      <style>
        .cc-tiers { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.4rem; margin: 0.6rem 0; }
        .cc-tier {
          padding: 0.5rem 0.7rem; border: 2px solid var(--ink); border-radius: var(--radius);
          cursor: pointer; box-shadow: 2px 2px 0 var(--ink); transition: transform 0.12s, box-shadow 0.12s;
          text-align: left;
        }
        .cc-tier:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--ink); }
        .cc-tier.sel { box-shadow: 4px 4px 0 var(--accent); transform: translate(-2px, -2px); border-color: var(--accent); }
        .cc-tier-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 1rem; }
        .cc-tier-ns { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-soft); }
        .cc-tier-size { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); }
        .cc-detail {
          background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius);
          padding: 0.8rem 1rem; margin: 0.6rem 0;
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;
        }
        @media (max-width: 600px) { .cc-detail { grid-template-columns: 1fr; } }
        .cc-detail-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; }
        .cc-detail-value { font-family: var(--font-display); font-size: 1.5rem; letter-spacing: 0.04em; }
        .cc-strip {
          position: relative; height: 70px; background: linear-gradient(to right, #c8f0c8, #cfe5ff, #ffe9b3, #f7c8c8, #e6d6ff);
          border: 2px solid var(--ink); border-radius: var(--radius);
          margin: 0.8rem 0;
        }
        .cc-strip-marker { position: absolute; top: -8px; width: 2px; height: 86px; background: var(--ink); }
        .cc-strip-marker.sel { background: var(--accent); width: 3px; }
        .cc-strip-label { position: absolute; top: 76px; font-family: var(--font-mono); font-size: 0.65rem; transform: translateX(-50%); white-space: nowrap; color: var(--ink-soft); }
        .cc-strip-label.sel { color: var(--accent); font-weight: 600; }
        .cc-strip-axis { position: absolute; bottom: -16px; left: 0; right: 0; display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.65rem; color: var(--ink-soft); }
      </style>
    </div>
  `;

  render();

  function render() {
    // tiers
    const tiersEl = root.querySelector('#cc-tiers');
    tiersEl.innerHTML = TIERS.map((t) => `
      <button class="cc-tier ${t.id === selected ? 'sel' : ''}" data-id="${t.id}" style="background: ${t.color};">
        <div class="cc-tier-label">${t.label}</div>
        <div class="cc-tier-ns">${formatNs(t.ns)}</div>
        <div class="cc-tier-size">${t.size}</div>
      </button>
    `).join('');
    tiersEl.querySelectorAll('button').forEach((b) =>
      b.addEventListener('click', () => { selected = b.dataset.id; render(); })
    );

    // detail
    const cur = TIERS.find((t) => t.id === selected);
    root.querySelector('#cc-detail').innerHTML = `
      <div>
        <div class="cc-detail-label">Actual latency</div>
        <div class="cc-detail-value">${formatNs(cur.ns)}</div>
      </div>
      <div>
        <div class="cc-detail-label">Human-scale (L1 = 1 sec)</div>
        <div class="cc-detail-value">${humanScale(cur.ns)}</div>
      </div>
    `;

    // strip — log scale across all tiers
    const min = Math.log10(TIERS[0].ns);
    const max = Math.log10(TIERS[TIERS.length - 1].ns);
    const range = max - min;
    let stripHtml = '';
    TIERS.forEach((t) => {
      const pos = ((Math.log10(t.ns) - min) / range) * 100;
      const isSel = t.id === selected;
      stripHtml += `<div class="cc-strip-marker ${isSel ? 'sel' : ''}" style="left: ${pos}%;"></div>`;
      stripHtml += `<div class="cc-strip-label ${isSel ? 'sel' : ''}" style="left: ${pos}%;">${t.label.split(' ')[0]}</div>`;
    });
    stripHtml += `<div class="cc-strip-axis"><span>0.3 ns</span><span>1 ns</span><span>1 µs</span><span>1 ms</span><span>50 ms</span></div>`;
    root.querySelector('#cc-strip').innerHTML = stripHtml;

    // explain
    let exp;
    if (cur.id === 'reg') exp = 'Registers are the absolute fastest — pretty much free. The compiler aggressively allocates the hot variables here. There are only a handful, so they\'re scarce.';
    else if (cur.id === 'l1' || cur.id === 'l2') exp = 'L1 and L2 are per-core. Hits here mean the data is "warm" in this thread — the goal of cache-friendly code.';
    else if (cur.id === 'l3') exp = 'L3 is shared across cores. Slower than L1/L2 but still 10× faster than RAM. Often the line between "fast" and "slow" code.';
    else if (cur.id === 'ram') exp = 'A cache miss to RAM costs ~100× a cache hit. This is why pointer-chasing data structures (linked lists, trees) are slower than they look on paper.';
    else if (cur.id === 'ssd') exp = '100µs is 1,000× slower than RAM. Modern apps treat disk as far away — pre-load into RAM, cache aggressively.';
    else if (cur.id === 'hdd') exp = 'Spinning disks are essentially extinct in performance-critical paths. The seek time alone is 10ms.';
    else if (cur.id === 'net') exp = 'A network round trip in the same region is 50ms — half a million times slower than L1. That\'s why CDNs and caches at every layer earn their keep.';
    root.querySelector('#cc-explain').innerHTML = exp;
  }

  function formatNs(ns) {
    if (ns < 1) return `${ns} ns`;
    if (ns < 1000) return `${ns} ns`;
    if (ns < 1_000_000) return `${(ns/1000).toPrecision(3)} µs`;
    if (ns < 1_000_000_000) return `${(ns/1_000_000).toPrecision(3)} ms`;
    return `${(ns/1_000_000_000).toPrecision(3)} s`;
  }
}
