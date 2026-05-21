// Journey widget: animated waterfall chart of the phases a request
// goes through. User picks scenario (cold / warm / repeat) and an
// RTT, then watches each phase fill in.

const SCENARIOS = {
  cold: {
    label: 'Cold visit (nothing cached)',
    phases: [
      { id: 'dns',     label: 'DNS lookup',         rtts: 1, color: '#ffe9b3' },
      { id: 'tcp',     label: 'TCP handshake',      rtts: 1, color: '#fff6dc' },
      { id: 'tls',     label: 'TLS handshake',      rtts: 1, color: '#f7c8c8' },
      { id: 'http',    label: 'HTTP request + TTFB', rtts: 1, color: '#cfe5ff' },
      { id: 'xfer',    label: 'Response transfer',  rtts: 0.3, color: '#c8f0c8' },
    ],
  },
  warm: {
    label: 'Warm (DNS cached)',
    phases: [
      { id: 'dns',     label: 'DNS (cache hit)',    rtts: 0.05, color: '#ffe9b3' },
      { id: 'tcp',     label: 'TCP handshake',      rtts: 1, color: '#fff6dc' },
      { id: 'tls',     label: 'TLS handshake',      rtts: 1, color: '#f7c8c8' },
      { id: 'http',    label: 'HTTP request + TTFB', rtts: 1, color: '#cfe5ff' },
      { id: 'xfer',    label: 'Response transfer',  rtts: 0.3, color: '#c8f0c8' },
    ],
  },
  reuse: {
    label: 'Connection reuse',
    phases: [
      { id: 'dns',     label: 'DNS (cache hit)',    rtts: 0.05, color: '#ffe9b3' },
      { id: 'http',    label: 'HTTP request + TTFB', rtts: 1, color: '#cfe5ff' },
      { id: 'xfer',    label: 'Response transfer',  rtts: 0.3, color: '#c8f0c8' },
    ],
  },
  '0rtt': {
    label: '0-RTT (TLS resume, HTTP/3)',
    phases: [
      { id: 'dns',     label: 'DNS (cache hit)',    rtts: 0.05, color: '#ffe9b3' },
      { id: 'http',    label: 'HTTP request + 0-RTT', rtts: 0.5, color: '#cfe5ff' },
      { id: 'xfer',    label: 'Response transfer',  rtts: 0.3, color: '#c8f0c8' },
    ],
  },
};

export function initJourneyWidget(root) {
  let scenario = 'cold';
  let rtt = 40;
  let running = false;
  let progress = 0; // 0 to total time

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Page Load Waterfall</div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="jr-scen">
          ${Object.entries(SCENARIOS).map(([id, s]) => `<option value="${id}">${s.label}</option>`).join('')}
        </select>
        <label>RTT:</label>
        <input type="range" min="5" max="300" value="40" id="jr-rtt" style="width: 160px;">
        <span id="jr-rtt-val" style="font-family: var(--font-mono); min-width: 4em;">40ms</span>
        <button class="btn btn-accent" id="jr-run">Load page</button>
        <button class="btn btn-ghost" id="jr-reset">Reset</button>
      </div>

      <div class="widget-stage" id="stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">TTFB</div><div class="value" id="m-ttfb">—</div></div>
        <div class="metric accent"><div class="label">Total load</div><div class="value" id="m-total">—</div></div>
        <div class="metric"><div class="label">Round trips</div><div class="value" id="m-rt">—</div></div>
      </div>

      <div class="callout" id="jr-explain"></div>
    </div>
  `;

  const stage = root.querySelector('#stage');

  root.querySelector('#jr-scen').addEventListener('change', (e) => { scenario = e.target.value; reset(); });
  root.querySelector('#jr-rtt').addEventListener('input', (e) => {
    rtt = Number(e.target.value);
    root.querySelector('#jr-rtt-val').textContent = `${rtt}ms`;
    if (!running) reset();
  });
  root.querySelector('#jr-run').addEventListener('click', run);
  root.querySelector('#jr-reset').addEventListener('click', reset);

  function totalMs() {
    return SCENARIOS[scenario].phases.reduce((acc, p) => acc + p.rtts * rtt, 0);
  }
  function ttfbMs() {
    const phs = SCENARIOS[scenario].phases;
    let t = 0;
    for (const p of phs) {
      t += p.rtts * rtt;
      if (p.id === 'http') return t;
    }
    return t;
  }
  function rtCount() {
    return SCENARIOS[scenario].phases.reduce((acc, p) => acc + p.rtts, 0).toFixed(1);
  }

  function reset() {
    progress = 0;
    running = false;
    render();
  }

  function run() {
    if (running) return;
    running = true;
    progress = 0;
    const total = totalMs();
    const tStart = performance.now();
    const SCALE = 4; // 1ms real time → 0.25ms simulated
    function step() {
      progress = (performance.now() - tStart) * SCALE;
      if (progress >= total) {
        progress = total;
        running = false;
        render();
        explain();
        return;
      }
      render();
      requestAnimationFrame(step);
    }
    step();
  }

  function render() {
    const W = 720;
    const phases = SCENARIOS[scenario].phases;
    const total = totalMs();
    const laneH = 38;
    const H = phases.length * laneH + 60;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<style>
      .jr-axis { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .jr-label { font-family: var(--font-display); font-size: 13px; letter-spacing: 1px; fill: var(--ink); }
      .jr-bar-bg { fill: var(--paper-deep); }
      .jr-bar { stroke: var(--ink); stroke-width: 2; }
      .jr-ttfb-line { stroke: var(--accent); stroke-width: 2; stroke-dasharray: 4 3; }
      .jr-time { font-family: var(--font-mono); font-size: 11px; fill: var(--ink); }
    </style>`;

    const xStart = 180;
    const xEnd = W - 20;
    const xRange = xEnd - xStart;

    // axis
    svg += `<text class="jr-axis" x="${xStart}" y="20">0ms</text>`;
    svg += `<text class="jr-axis" x="${xEnd}" y="20" text-anchor="end">${Math.round(total)}ms</text>`;
    svg += `<line x1="${xStart}" y1="24" x2="${xEnd}" y2="24" stroke="var(--ink-soft)" stroke-width="1"/>`;

    // TTFB marker
    const ttfb = ttfbMs();
    const ttfbX = xStart + (ttfb / total) * xRange;
    svg += `<line class="jr-ttfb-line" x1="${ttfbX}" y1="30" x2="${ttfbX}" y2="${H - 10}"/>`;
    svg += `<text x="${ttfbX + 4}" y="40" style="font-family: var(--font-mono); font-size: 10px; fill: var(--accent);">TTFB</text>`;

    let t = 0;
    phases.forEach((p, i) => {
      const y = 50 + i * laneH;
      const phaseMs = p.rtts * rtt;
      const x = xStart + (t / total) * xRange;
      const w = (phaseMs / total) * xRange;
      svg += `<text class="jr-label" x="170" y="${y + 16}" text-anchor="end">${escape(p.label)}</text>`;
      // background of full row
      svg += `<rect class="jr-bar-bg" x="${xStart}" y="${y}" width="${xRange}" height="24" rx="3"/>`;
      // visible portion based on progress
      const phaseProgress = Math.min(1, Math.max(0, (progress - t) / phaseMs));
      const visibleW = w * phaseProgress;
      svg += `<rect class="jr-bar" x="${x}" y="${y}" width="${visibleW}" height="24" rx="3" fill="${p.color}"/>`;
      // outline of full phase as ghost
      svg += `<rect x="${x}" y="${y}" width="${w}" height="24" rx="3" fill="none" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="3 3" opacity="0.5"/>`;
      svg += `<text class="jr-time" x="${x + 6}" y="${y + 16}">${Math.round(phaseMs)}ms</text>`;
      t += phaseMs;
    });

    svg += `</svg>`;
    stage.innerHTML = svg;

    root.querySelector('#m-ttfb').textContent = `${Math.round(ttfbMs())}ms`;
    root.querySelector('#m-total').textContent = `${Math.round(totalMs())}ms`;
    root.querySelector('#m-rt').textContent = rtCount();
  }

  function explain() {
    let html = '';
    if (scenario === 'cold') {
      html = `<strong>Cold visit:</strong> 3 full RTTs of handshakes (DNS + TCP + TLS) before the server even sees your HTTP request. At ${rtt}ms RTT that's ${rtt * 3}ms gone before anything useful happens. This is why first visits feel slow on poor connections.`;
    } else if (scenario === 'warm') {
      html = `<strong>Warm visit:</strong> DNS is cached, saving one RTT. You still pay TCP + TLS + HTTP. Worth getting users back to your site — the second visit is meaningfully faster.`;
    } else if (scenario === 'reuse') {
      html = `<strong>Connection reuse:</strong> When the browser already has a TCP+TLS connection open to your origin (e.g. fetching extra assets on the same page), the cost collapses to just the HTTP request. <em>This is most of what HTTP/2 enables.</em>`;
    } else {
      html = `<strong>0-RTT:</strong> With TLS session resumption or HTTP/3, the very first HTTP request can ride along with the TLS handshake. Effectively zero round trips of overhead. Modern CDNs do this when possible.`;
    }
    root.querySelector('#jr-explain').innerHTML = html;
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  reset();
  explain();
}
