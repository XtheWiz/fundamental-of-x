// Latency widget: simple page-load model. User tunes distance,
// bandwidth, # round trips. Output: breakdown of where the ms go,
// plus a stacked bar showing total page load time.

const PRESETS = [
  { id: 'local',  label: 'Same city (5ms)',       rtt: 5,   bw: 100 },
  { id: 'region', label: 'Same continent (40ms)', rtt: 40,  bw: 100 },
  { id: 'global', label: 'Across globe (200ms)',  rtt: 200, bw: 50  },
  { id: '3g',     label: 'Mobile 3G (200ms, 1Mbps)', rtt: 200, bw: 1 },
];

export function initLatencyWidget(root) {
  let rtt = 40;
  let bw = 100;
  let pageSizeKB = 500;
  let rtCount = 4; // typical HTTP/2 page: TCP + TLS + HTTP

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Where Do the Milliseconds Go?</div>

      <div class="controls">
        <label>Preset:</label>
        <select class="field" id="lat-preset">
          ${PRESETS.map((p) => `<option value="${p.id}">${p.label}</option>`).join('')}
          <option value="custom">Custom</option>
        </select>
      </div>

      <div class="lat-sliders">
        <div class="lat-slider">
          <label>RTT (round-trip time): <strong id="lat-rtt-val">40ms</strong></label>
          <input type="range" min="1" max="400" value="40" id="lat-rtt">
          <div class="lat-hint">1ms = same room. 40ms = same continent. 200ms = across the globe.</div>
        </div>
        <div class="lat-slider">
          <label>Bandwidth: <strong id="lat-bw-val">100 Mbps</strong></label>
          <input type="range" min="1" max="1000" value="100" id="lat-bw">
          <div class="lat-hint">1 = mobile 3G. 100 = broadband. 1000 = fiber.</div>
        </div>
        <div class="lat-slider">
          <label>Page size: <strong id="lat-size-val">500 KB</strong></label>
          <input type="range" min="50" max="5000" step="50" value="500" id="lat-size">
          <div class="lat-hint">Modern average is around 2–3MB.</div>
        </div>
        <div class="lat-slider">
          <label>Round trips needed: <strong id="lat-rt-val">4</strong></label>
          <input type="range" min="1" max="20" value="4" id="lat-rt">
          <div class="lat-hint">TCP+TLS+HTTP ≈ 3 trips. Plus extras per chained request.</div>
        </div>
      </div>

      <div class="widget-stage" id="stage" style="min-height: 200px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Connect time</div><div class="value" id="m-conn">—</div></div>
        <div class="metric"><div class="label">Transfer time</div><div class="value" id="m-xfer">—</div></div>
        <div class="metric accent"><div class="label">Total load</div><div class="value" id="m-total">—</div></div>
      </div>

      <div class="callout" id="explain"></div>

      <style>
        .lat-sliders { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.5rem; margin: 1rem 0; }
        .lat-slider label { display: block; font-size: 0.95rem; margin-bottom: 0.2rem; }
        .lat-slider input[type=range] { width: 100%; }
        .lat-hint { font-size: 0.75rem; color: var(--ink-soft); margin-top: 0.1rem; }
        @media (max-width: 640px) { .lat-sliders { grid-template-columns: 1fr; } }
      </style>
    </div>
  `;

  const stage = root.querySelector('#stage');

  root.querySelector('#lat-preset').addEventListener('change', (e) => {
    const p = PRESETS.find((x) => x.id === e.target.value);
    if (!p) return;
    rtt = p.rtt; bw = p.bw;
    root.querySelector('#lat-rtt').value = rtt;
    root.querySelector('#lat-bw').value = bw;
    update();
  });
  root.querySelector('#lat-rtt').addEventListener('input', (e) => { rtt = Number(e.target.value); update(); });
  root.querySelector('#lat-bw').addEventListener('input', (e) => { bw = Number(e.target.value); update(); });
  root.querySelector('#lat-size').addEventListener('input', (e) => { pageSizeKB = Number(e.target.value); update(); });
  root.querySelector('#lat-rt').addEventListener('input', (e) => { rtCount = Number(e.target.value); update(); });

  function update() {
    root.querySelector('#lat-rtt-val').textContent = `${rtt}ms`;
    root.querySelector('#lat-bw-val').textContent = `${bw} Mbps`;
    root.querySelector('#lat-size-val').textContent = `${pageSizeKB} KB`;
    root.querySelector('#lat-rt-val').textContent = rtCount;

    // Compute
    const connectMs = rtCount * rtt;
    // Transfer time: size_in_bits / (bw_mbps * 1e6) seconds → ms
    const sizeBits = pageSizeKB * 1024 * 8;
    const transferMs = (sizeBits / (bw * 1e6)) * 1000;
    const totalMs = connectMs + transferMs;

    root.querySelector('#m-conn').textContent = `${Math.round(connectMs)}ms`;
    root.querySelector('#m-xfer').textContent = `${Math.round(transferMs)}ms`;
    root.querySelector('#m-total').textContent = `${Math.round(totalMs)}ms`;

    // Stacked bar
    const W = 700;
    const barH = 50;
    const H = 130;
    const totalForBar = Math.max(totalMs, 100);
    const connectW = (connectMs / totalForBar) * (W - 20);
    const transferW = (transferMs / totalForBar) * (W - 20);
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<style>
      .lat-cap { font-family: var(--font-display); font-size: 14px; letter-spacing: 1.5px; fill: var(--ink); }
      .lat-num { font-family: var(--font-mono); font-size: 12px; fill: var(--ink); }
      .lat-conn { fill: #ffc1c1; stroke: var(--ink); stroke-width: 2; }
      .lat-xfer { fill: #c8f0c8; stroke: var(--ink); stroke-width: 2; }
    </style>`;
    svg += `<text class="lat-cap" x="10" y="20">PAGE LOAD BREAKDOWN</text>`;
    svg += `<rect class="lat-conn" x="10" y="40" width="${connectW}" height="${barH}"/>`;
    svg += `<rect class="lat-xfer" x="${10 + connectW}" y="40" width="${transferW}" height="${barH}"/>`;
    if (connectW > 80) svg += `<text class="lat-num" x="${10 + connectW/2}" y="${40 + barH/2 + 4}" text-anchor="middle">Connect ${Math.round(connectMs)}ms</text>`;
    if (transferW > 80) svg += `<text class="lat-num" x="${10 + connectW + transferW/2}" y="${40 + barH/2 + 4}" text-anchor="middle">Transfer ${Math.round(transferMs)}ms</text>`;
    svg += `<text class="lat-num" x="10" y="${40 + barH + 20}">0ms</text>`;
    svg += `<text class="lat-num" x="${W - 10}" y="${40 + barH + 20}" text-anchor="end">${Math.round(totalForBar)}ms</text>`;
    svg += `</svg>`;
    stage.innerHTML = svg;

    const ratio = connectMs / Math.max(1, totalMs);
    let msg;
    if (ratio > 0.7) {
      msg = `<strong>Latency-bound.</strong> ${Math.round(ratio * 100)}% of your page load is waiting for round trips. Doubling bandwidth would barely help. Reducing round trips (HTTP/2/3, CDN closer to users, fewer chained requests) would.`;
    } else if (ratio < 0.2) {
      msg = `<strong>Bandwidth-bound.</strong> Most time is spent transferring bytes. Compression, code-splitting, and smaller assets would help. More round trips wouldn't hurt much here.`;
    } else {
      msg = `<strong>Mixed.</strong> Both connect time and transfer time matter at this scale. CDNs help by cutting both — they're closer AND have a fat pipe to your user.`;
    }
    root.querySelector('#explain').innerHTML = msg;
  }

  update();
}
