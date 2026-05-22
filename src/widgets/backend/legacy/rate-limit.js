// Rate limiting widget: a token bucket. Tokens refill at a rate per
// second. Each request consumes one. Empty bucket = 429.

export function initRateLimitWidget(root) {
  const state = {
    capacity: 5,
    refillPerSec: 1,
    tokens: 5,
    lastRefill: performance.now(),
    history: [],   // [{t, allowed}]
    allowed: 0,
    denied: 0,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Token Bucket Limiter</div>

      <div class="controls">
        <label>Capacity:</label>
        <input type="range" min="1" max="20" value="5" id="rl-cap">
        <span style="font-family: var(--font-mono);" id="rl-cap-val">5</span>
        <label>Refill (tokens/sec):</label>
        <input type="range" min="0.5" max="5" step="0.5" value="1" id="rl-rate">
        <span style="font-family: var(--font-mono);" id="rl-rate-val">1</span>
        <button class="btn btn-accent" id="rl-req">Request</button>
        <button class="btn" id="rl-burst">Burst x10</button>
        <button class="btn btn-ghost" id="rl-reset">Reset</button>
      </div>

      <div class="widget-stage" id="rl-stage" style="min-height: 240px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Allowed (200)</div><div class="value" id="m-allow">0</div></div>
        <div class="metric"><div class="label">Denied (429)</div><div class="value" id="m-deny">0</div></div>
        <div class="metric accent"><div class="label">Bucket</div><div class="value" id="m-bucket">5/5</div></div>
      </div>
    </div>
  `;

  const stage = root.querySelector('#rl-stage');

  root.querySelector('#rl-cap').addEventListener('input', (e) => {
    state.capacity = Number(e.target.value);
    root.querySelector('#rl-cap-val').textContent = state.capacity;
    state.tokens = Math.min(state.tokens, state.capacity);
  });
  root.querySelector('#rl-rate').addEventListener('input', (e) => {
    state.refillPerSec = Number(e.target.value);
    root.querySelector('#rl-rate-val').textContent = state.refillPerSec;
  });
  root.querySelector('#rl-req').addEventListener('click', () => request(false));
  root.querySelector('#rl-burst').addEventListener('click', async () => {
    for (let i = 0; i < 10; i++) { request(true); await wait(120); }
  });
  root.querySelector('#rl-reset').addEventListener('click', () => {
    state.tokens = state.capacity;
    state.history = [];
    state.allowed = 0;
    state.denied = 0;
    state.lastRefill = performance.now();
  });

  function refill() {
    const now = performance.now();
    const elapsed = (now - state.lastRefill) / 1000;
    const add = elapsed * state.refillPerSec;
    state.tokens = Math.min(state.capacity, state.tokens + add);
    state.lastRefill = now;
  }

  function request(quiet) {
    refill();
    let allowed;
    if (state.tokens >= 1) {
      state.tokens -= 1;
      allowed = true;
      state.allowed += 1;
    } else {
      allowed = false;
      state.denied += 1;
    }
    state.history.push({ t: performance.now(), allowed });
    if (state.history.length > 40) state.history.shift();
  }

  function render() {
    refill();
    const W = 720;
    const H = 240;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<style>
      .rl-label { font-family: var(--font-display); font-size: 14px; letter-spacing: 1.5px; fill: var(--ink); }
      .rl-sub { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .rl-bucket-frame { fill: var(--paper); stroke: var(--ink); stroke-width: 3; }
      .rl-token { fill: var(--accent); stroke: var(--ink); stroke-width: 1.5; }
      .rl-token-empty { fill: var(--paper-deep); stroke: var(--ink-faint); stroke-width: 1.5; stroke-dasharray: 2 2; }
      .rl-history-dot { stroke: var(--ink); stroke-width: 1; }
      .rl-allowed { fill: #2a8a3e; }
      .rl-denied { fill: var(--accent); }
      .rl-axis { font-family: var(--font-mono); font-size: 9px; fill: var(--ink-soft); }
    </style>`;

    // bucket on the left
    const bucketX = 50;
    const bucketY = 30;
    const bucketW = 120;
    const bucketH = 160;
    svg += `<text class="rl-label" x="${bucketX + bucketW/2}" y="${bucketY - 8}" text-anchor="middle">TOKEN BUCKET</text>`;
    svg += `<rect class="rl-bucket-frame" x="${bucketX}" y="${bucketY}" width="${bucketW}" height="${bucketH}" rx="6"/>`;
    // tokens stack from bottom up
    const tokenR = 12;
    const tokenGap = 6;
    for (let i = 0; i < state.capacity; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const cx = bucketX + 18 + col * (tokenR * 2 + tokenGap);
      const cy = bucketY + bucketH - 18 - row * (tokenR * 2 + tokenGap);
      const filled = i < Math.floor(state.tokens);
      svg += `<circle class="${filled ? 'rl-token' : 'rl-token-empty'}" cx="${cx}" cy="${cy}" r="${tokenR}"/>`;
    }
    svg += `<text class="rl-sub" x="${bucketX + bucketW/2}" y="${bucketY + bucketH + 16}" text-anchor="middle">${state.tokens.toFixed(1)} / ${state.capacity}</text>`;
    svg += `<text class="rl-sub" x="${bucketX + bucketW/2}" y="${bucketY + bucketH + 30}" text-anchor="middle">+${state.refillPerSec}/sec</text>`;

    // history timeline on the right
    const timeX = 230;
    const timeW = W - timeX - 20;
    svg += `<text class="rl-label" x="${timeX}" y="${bucketY - 8}">RECENT REQUESTS</text>`;
    svg += `<line x1="${timeX}" y1="${H/2}" x2="${timeX + timeW}" y2="${H/2}" stroke="var(--ink-soft)" stroke-width="1"/>`;
    svg += `<text class="rl-axis" x="${timeX}" y="${H/2 + 16}">oldest</text>`;
    svg += `<text class="rl-axis" x="${timeX + timeW}" y="${H/2 + 16}" text-anchor="end">newest →</text>`;
    state.history.forEach((h, i) => {
      const x = timeX + (i / Math.max(1, state.history.length - 1)) * timeW;
      const y = H / 2 + (h.allowed ? -18 : 18);
      svg += `<circle class="rl-history-dot ${h.allowed ? 'rl-allowed' : 'rl-denied'}" cx="${x}" cy="${y}" r="6"/>`;
    });
    if (state.history.length === 0) {
      svg += `<text class="rl-sub" x="${timeX + timeW/2}" y="${H/2 - 30}" text-anchor="middle">click Request to start</text>`;
    }
    // legend
    svg += `<circle class="rl-history-dot rl-allowed" cx="${timeX + 60}" cy="${H - 18}" r="6"/>`;
    svg += `<text class="rl-sub" x="${timeX + 72}" y="${H - 14}">allowed (200)</text>`;
    svg += `<circle class="rl-history-dot rl-denied" cx="${timeX + 200}" cy="${H - 18}" r="6"/>`;
    svg += `<text class="rl-sub" x="${timeX + 212}" y="${H - 14}">denied (429)</text>`;

    svg += `</svg>`;
    stage.innerHTML = svg;

    root.querySelector('#m-allow').textContent = state.allowed;
    root.querySelector('#m-deny').textContent = state.denied;
    root.querySelector('#m-bucket').textContent = `${state.tokens.toFixed(1)}/${state.capacity}`;
  }

  // Animation loop so the bucket visibly refills
  function loop() {
    render();
    requestAnimationFrame(loop);
  }
  loop();

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
}
