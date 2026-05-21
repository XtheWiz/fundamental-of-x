// Load balancing widget: 4 backends, 4 strategies. B3 is artificially
// slow to make least-connections look meaningfully different.

const BACKENDS = [
  { id: 'B1', baseLatency: 50,  color: '#cfe5ff' },
  { id: 'B2', baseLatency: 50,  color: '#c8f0c8' },
  { id: 'B3', baseLatency: 180, color: '#f7c8c8', slow: true },
  { id: 'B4', baseLatency: 50,  color: '#ffe9b3' },
];

const STRATEGIES = {
  rr:    'Round-robin',
  least: 'Least connections',
  hash:  'IP hash',
  rand:  'Random',
};

export function initLoadBalancingWidget(root) {
  const state = {
    strategy: 'rr',
    rrIndex: 0,
    backends: BACKENDS.map((b) => ({ ...b, active: 0, served: 0, totalLatency: 0 })),
    seed: 1,
    running: false,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">4 backends, 1 dispatcher</div>

      <div class="controls">
        <label>Strategy:</label>
        <div class="pill-group">
          ${Object.entries(STRATEGIES).map(([id, l], i) => `
            <input type="radio" name="lb-strat" id="lb-${id}" value="${id}" ${i === 0 ? 'checked' : ''}>
            <label for="lb-${id}">${l}</label>
          `).join('')}
        </div>
        <button class="btn btn-accent" id="lb-burst">Send 20 requests</button>
        <button class="btn btn-ghost" id="lb-reset">Reset</button>
      </div>

      <div class="widget-stage" id="lb-stage" style="min-height: 260px;"></div>

      <div class="callout" id="lb-explain">Pick a strategy and click <em>Send 20 requests</em>. Backend 3 is artificially slow.</div>
    </div>
  `;

  const stage = root.querySelector('#lb-stage');
  root.querySelectorAll('input[name=lb-strat]').forEach((r) =>
    r.addEventListener('change', (e) => { state.strategy = e.target.value; reset(); })
  );
  root.querySelector('#lb-burst').addEventListener('click', burst);
  root.querySelector('#lb-reset').addEventListener('click', reset);

  function reset() {
    state.rrIndex = 0;
    state.backends.forEach((b) => { b.active = 0; b.served = 0; b.totalLatency = 0; });
    state.seed = Date.now() & 0xffff;
    render();
  }

  function rng() {
    state.seed = (state.seed * 9301 + 49297) % 233280;
    return state.seed / 233280;
  }

  function pickBackend(clientIp) {
    if (state.strategy === 'rr') {
      const b = state.backends[state.rrIndex];
      state.rrIndex = (state.rrIndex + 1) % state.backends.length;
      return b;
    }
    if (state.strategy === 'least') {
      let best = state.backends[0];
      for (const b of state.backends) if (b.active < best.active) best = b;
      return best;
    }
    if (state.strategy === 'hash') {
      // hash the IP (last octet for variety)
      const h = clientIp.split('.').reduce((a, x) => (a * 31 + Number(x)) | 0, 0);
      return state.backends[Math.abs(h) % state.backends.length];
    }
    if (state.strategy === 'rand') {
      return state.backends[Math.floor(rng() * state.backends.length)];
    }
  }

  async function burst() {
    if (state.running) return;
    state.running = true;
    reset();

    // 20 requests from 12 distinct clients (so hash has variety but still some repeat)
    const requests = [];
    for (let i = 0; i < 20; i++) {
      const clientIp = `203.0.113.${10 + (i % 12)}`;
      requests.push({ id: i + 1, clientIp });
    }

    for (const req of requests) {
      const b = pickBackend(req.clientIp);
      b.active += 1;
      b.served += 1;
      render();
      const jitter = 0.8 + rng() * 0.4;
      const lat = b.baseLatency * jitter;
      b.totalLatency += lat;
      // request completes after `lat` simulated ms; we use a small real wait
      // proportional to the request count so the animation reads.
      (async (be, latency) => {
        await wait(latency * 0.7);
        be.active -= 1;
        render();
      })(b, lat);
      await wait(60); // pacing between dispatches
    }

    // Wait for everything to drain
    while (state.backends.some((b) => b.active > 0)) await wait(80);
    state.running = false;
    explain();
  }

  function explain() {
    const served = state.backends.map((b) => b.served);
    const max = Math.max(...served);
    const min = Math.min(...served);
    const skew = min === 0 ? 'infinite' : (max / min).toFixed(2);
    const total = served.reduce((a, b) => a + b, 0);
    const avgLat = state.backends.reduce((a, b) => a + b.totalLatency, 0) / total;
    let msg;
    if (state.strategy === 'rr') {
      msg = `<strong>Round-robin</strong> distributed evenly (${served.join(' / ')}), but B3 — which is 3× slower — got the same load as the fast ones. Average request latency was ${Math.round(avgLat)}ms.`;
    } else if (state.strategy === 'least') {
      msg = `<strong>Least connections</strong> sent more traffic to the fast backends (${served.join(' / ')}) because B3 always had more active requests. Average latency: ${Math.round(avgLat)}ms — usually lower than round-robin under skew.`;
    } else if (state.strategy === 'hash') {
      msg = `<strong>IP hash</strong> stuck each client to one backend (distribution ${served.join(' / ')}). Same clients always land on the same server — great for sticky sessions, terrible if one backend dies.`;
    } else {
      msg = `<strong>Random</strong> distribution: ${served.join(' / ')}. At scale this converges to round-robin; on small samples you get noise. Skew ratio max/min: ${skew}.`;
    }
    root.querySelector('#lb-explain').innerHTML = msg;
  }

  function render() {
    const W = 700;
    const H = 240;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<style>
      .lb-node { stroke: var(--ink); stroke-width: 2.5; }
      .lb-label { font-family: var(--font-display); font-size: 18px; letter-spacing: 1.5px; fill: var(--ink); }
      .lb-sub { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .lb-bar-bg { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1; }
      .lb-bar { fill: var(--accent); }
      .lb-link { stroke: var(--ink-soft); stroke-width: 1.5; }
      .lb-counter { font-family: var(--font-mono); font-size: 11px; fill: var(--ink); }
    </style>`;

    // LB node
    svg += `<rect class="lb-node" x="40" y="100" width="120" height="50" rx="6" fill="#ffe9b3"/>`;
    svg += `<text class="lb-label" x="100" y="125" text-anchor="middle">LB</text>`;
    svg += `<text class="lb-sub" x="100" y="142" text-anchor="middle">${STRATEGIES[state.strategy]}</text>`;

    // Backends
    state.backends.forEach((b, i) => {
      const y = 20 + i * 55;
      svg += `<line class="lb-link" x1="160" y1="125" x2="320" y2="${y + 20}"/>`;
      svg += `<rect class="lb-node" x="320" y="${y}" width="120" height="40" rx="5" fill="${b.color}"/>`;
      svg += `<text class="lb-label" x="380" y="${y + 18}" text-anchor="middle" style="font-size: 14px;">${b.id}${b.slow ? ' (slow)' : ''}</text>`;
      svg += `<text class="lb-sub" x="380" y="${y + 32}" text-anchor="middle">active: ${b.active} · served: ${b.served}</text>`;

      // load bar showing served-so-far
      const max = Math.max(1, ...state.backends.map((x) => x.served));
      const barW = 180;
      svg += `<rect class="lb-bar-bg" x="460" y="${y + 12}" width="${barW}" height="16" rx="2"/>`;
      svg += `<rect class="lb-bar" x="460" y="${y + 12}" width="${(b.served / max) * barW}" height="16" rx="2"/>`;
    });

    svg += `</svg>`;
    stage.innerHTML = svg;
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  render();
}
