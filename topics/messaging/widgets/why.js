// Why-messaging widget: simulate direct calls vs broker, with a slow
// consumer and a burst of requests. Show success/failure counts.

export function initWhyWidget(root) {
  const state = {
    mode: 'direct',     // 'direct' or 'broker'
    consumerSpeedMs: 300,
    sent: 0, succeeded: 0, failed: 0, queued: 0,
    queue: [],
    running: false,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Producer → Consumer, with and without a broker</div>

      <div class="controls">
        <label>Mode:</label>
        <div class="pill-group">
          <input type="radio" name="wh-m" id="wh-direct" value="direct" checked>
          <label for="wh-direct">Direct call (sync)</label>
          <input type="radio" name="wh-m" id="wh-broker" value="broker">
          <label for="wh-broker">With broker (async)</label>
        </div>
        <button class="btn btn-accent" id="wh-burst">Send 20 orders fast</button>
        <button class="btn btn-ghost" id="wh-reset">Reset</button>
      </div>

      <div class="widget-stage" id="wh-stage" style="min-height: 220px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Sent</div><div class="value" id="m-sent">0</div></div>
        <div class="metric"><div class="label">Succeeded</div><div class="value" id="m-ok">0</div></div>
        <div class="metric accent"><div class="label">Failed / dropped</div><div class="value" id="m-fail">0</div></div>
        <div class="metric"><div class="label">Queued</div><div class="value" id="m-q">0</div></div>
      </div>

      <div class="callout" id="wh-explain">
        Both modes have the same producer rate and consumer speed. The only difference is whether a queue sits between them.
      </div>
    </div>
  `;

  const stage = root.querySelector('#wh-stage');
  root.querySelectorAll('input[name=wh-m]').forEach((r) =>
    r.addEventListener('change', (e) => { state.mode = e.target.value; reset(); })
  );
  root.querySelector('#wh-burst').addEventListener('click', burst);
  root.querySelector('#wh-reset').addEventListener('click', reset);

  function reset() {
    state.sent = 0; state.succeeded = 0; state.failed = 0;
    state.queue = []; state.queued = 0;
    render();
  }

  async function burst() {
    if (state.running) return;
    state.running = true;
    reset();
    // Producer fires 20 fast: ~50ms apart
    for (let i = 0; i < 20; i++) {
      state.sent++;
      const orderId = i + 1;
      if (state.mode === 'direct') {
        // Direct: consumer is busy if we're still processing the previous one
        if (state.queue.length > 0) {
          // consumer busy → reject
          state.failed++;
        } else {
          state.queue.push(orderId);
          // process immediately
          (async () => {
            await wait(state.consumerSpeedMs);
            state.queue.shift();
            state.succeeded++;
            render();
          })();
        }
      } else {
        // Broker: queue and drain
        state.queue.push(orderId);
      }
      render();
      await wait(50);
    }
    // Drain queue at consumer pace
    while (state.queue.length > 0) {
      await wait(state.consumerSpeedMs);
      state.queue.shift();
      state.succeeded++;
      render();
    }
    state.running = false;
    explain();
  }

  function explain() {
    if (state.mode === 'direct') {
      root.querySelector('#wh-explain').innerHTML = `<strong>Direct mode</strong>: producer fires faster than consumer can handle → ${state.failed} requests rejected. In real systems this manifests as 503s or timeouts. Capacity is coupled.`;
    } else {
      root.querySelector('#wh-explain').innerHTML = `<strong>Broker mode</strong>: all ${state.sent} orders made it. The queue absorbed the burst; the consumer drained it at its own pace. Producer didn't know or care.`;
    }
  }

  function render() {
    const W = 720, H = 200;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<style>
      .wh-node { stroke: var(--ink); stroke-width: 2.5; }
      .wh-arr { stroke: var(--ink); stroke-width: 2; marker-end: url(#wh-arrow); }
      .wh-msg { fill: var(--accent); stroke: var(--ink); stroke-width: 1; }
    </style>`;
    svg += `<defs><marker id="wh-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/></marker></defs>`;

    // producer
    svg += `<rect class="wh-node" x="40" y="80" width="120" height="60" rx="6" fill="#cfe5ff"/>`;
    svg += `<text class="msg-label" x="100" y="110" text-anchor="middle">PRODUCER</text>`;
    svg += `<text class="msg-sub" x="100" y="128" text-anchor="middle">orders/sec ≈ 20</text>`;

    if (state.mode === 'broker') {
      // broker / queue
      svg += `<rect class="wh-node" x="260" y="60" width="240" height="100" rx="6" fill="var(--accent-soft)"/>`;
      svg += `<text class="msg-label" x="380" y="82" text-anchor="middle">BROKER (queue)</text>`;
      svg += `<text class="msg-sub" x="380" y="98" text-anchor="middle">${state.queue.length} pending</text>`;
      // pending messages
      const maxShow = 10;
      const show = state.queue.slice(0, maxShow);
      show.forEach((id, i) => {
        const x = 280 + i * 22;
        svg += `<rect class="wh-msg" x="${x}" y="115" width="18" height="30" rx="2"/>`;
        svg += `<text x="${x + 9}" y="134" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px; fill: white;">${id}</text>`;
      });
      if (state.queue.length > maxShow) {
        svg += `<text class="msg-sub" x="${280 + maxShow * 22 + 10}" y="134">+${state.queue.length - maxShow}</text>`;
      }
      svg += `<line class="wh-arr" x1="160" y1="110" x2="258" y2="110"/>`;
      svg += `<line class="wh-arr" x1="500" y1="110" x2="598" y2="110"/>`;
    } else {
      svg += `<line class="wh-arr" x1="160" y1="110" x2="598" y2="110"/>`;
      svg += `<text class="msg-sub" x="380" y="100" text-anchor="middle">direct HTTP call</text>`;
    }

    // consumer
    svg += `<rect class="wh-node" x="600" y="80" width="120" height="60" rx="6" fill="#c8f0c8"/>`;
    svg += `<text class="msg-label" x="660" y="110" text-anchor="middle">CONSUMER</text>`;
    svg += `<text class="msg-sub" x="660" y="128" text-anchor="middle">~3 orders/sec</text>`;

    svg += `</svg>`;
    stage.innerHTML = svg;

    root.querySelector('#m-sent').textContent = state.sent;
    root.querySelector('#m-ok').textContent = state.succeeded;
    root.querySelector('#m-fail').textContent = state.failed;
    root.querySelector('#m-q').textContent = state.queue.length;
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  reset();
}
