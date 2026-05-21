// Backpressure widget: sustained producer rate vs consumer rate, with
// 4 different overflow policies. Run for 10 seconds, watch queue depth.

const POLICIES = {
  buffer: 'Buffer (unlimited)',
  drop:   'Drop oldest at capacity',
  bp:     'Backpressure (slow producer)',
  fail:   'Fail (reject producer)',
};

const PRODUCER_RATE = 10;  // per sec
const CONSUMER_RATE = 3;   // per sec
const BUFFER_LIMIT = 30;

export function initBackpressureWidget(root) {
  let policy = 'buffer';
  const state = {
    queue: 0,
    sent: 0, processed: 0, dropped: 0, throttled: 0, failed: 0,
    series: [],   // [{t, queue}]
    running: false,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Producer ${PRODUCER_RATE}/sec, Consumer ${CONSUMER_RATE}/sec, buffer cap ${BUFFER_LIMIT}</div>

      <div class="controls">
        <label>Overflow policy:</label>
        <select class="field" id="bp-pol">
          ${Object.entries(POLICIES).map(([id, l]) => `<option value="${id}">${l}</option>`).join('')}
        </select>
        <button class="btn btn-accent" id="bp-run">Run 15 sec sim</button>
        <button class="btn btn-ghost" id="bp-reset">Reset</button>
      </div>

      <div class="widget-stage" id="bp-stage" style="min-height: 240px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Sent</div><div class="value" id="m-sent">0</div></div>
        <div class="metric"><div class="label">Processed</div><div class="value" id="m-proc">0</div></div>
        <div class="metric"><div class="label">Dropped/failed</div><div class="value" id="m-drop">0</div></div>
        <div class="metric accent"><div class="label">Queue depth</div><div class="value" id="m-q">0</div></div>
      </div>

      <div class="callout" id="bp-explain"></div>
    </div>
  `;

  root.querySelector('#bp-pol').addEventListener('change', (e) => { policy = e.target.value; reset(); });
  root.querySelector('#bp-run').addEventListener('click', run);
  root.querySelector('#bp-reset').addEventListener('click', reset);

  function reset() {
    state.queue = 0; state.sent = 0; state.processed = 0;
    state.dropped = 0; state.throttled = 0; state.failed = 0;
    state.series = [];
    render();
  }

  async function run() {
    if (state.running) return;
    state.running = true;
    reset();
    const TICKS = 15;
    for (let t = 0; t < TICKS; t++) {
      // Produce
      let producerThisTick = PRODUCER_RATE;
      if (policy === 'bp' && state.queue >= BUFFER_LIMIT * 0.7) {
        producerThisTick = Math.max(CONSUMER_RATE, Math.floor(PRODUCER_RATE * 0.4));
        state.throttled += PRODUCER_RATE - producerThisTick;
      }
      for (let i = 0; i < producerThisTick; i++) {
        state.sent++;
        if (state.queue >= BUFFER_LIMIT) {
          if (policy === 'drop') {
            // drop oldest, accept new
            state.dropped++;
            // queue stays
          } else if (policy === 'fail') {
            state.failed++;
          } else if (policy === 'buffer') {
            state.queue++;  // unbounded buffer
          } else {
            // bp would have already throttled, but in edge cases
            state.queue++;
          }
        } else {
          state.queue++;
        }
      }
      // Consume
      const consumed = Math.min(CONSUMER_RATE, state.queue);
      state.queue -= consumed;
      state.processed += consumed;
      state.series.push({ t, queue: state.queue });
      render();
      await wait(220);
    }
    state.running = false;
    explain();
  }

  function explain() {
    if (policy === 'buffer') {
      root.querySelector('#bp-explain').innerHTML = `<strong>Unbounded buffer.</strong> Queue grew to ${state.queue}. Eventually you run out of disk; latency for new messages is the queue depth × processing time. Most Kafka deployments live here.`;
    } else if (policy === 'drop') {
      root.querySelector('#bp-explain').innerHTML = `<strong>${state.dropped} messages dropped.</strong> Producer kept its rate, but the broker discarded what wouldn't fit. Use for lossy data (metrics, telemetry); never for important events.`;
    } else if (policy === 'bp') {
      root.querySelector('#bp-explain').innerHTML = `<strong>Producer throttled ${state.throttled} messages.</strong> Queue stayed near the limit, producer slowed to match consumer. Zero data lost; producer pays the price.`;
    } else {
      root.querySelector('#bp-explain').innerHTML = `<strong>${state.failed} sends rejected.</strong> Producer got errors and must handle them — typically retry-with-backoff. Loud failure, no data lost <em>if</em> the producer retries correctly.`;
    }
  }

  function render() {
    // Chart: queue depth over time
    const W = 720, H = 200;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<style>
      .bp-axis { stroke: var(--ink-soft); stroke-width: 1; }
      .bp-axis-text { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .bp-bar { fill: var(--accent); }
      .bp-bar.over { fill: #f7c8c8; stroke: var(--accent); stroke-width: 1.5; }
      .bp-limit { stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 4 3; }
      .bp-limit-text { font-family: var(--font-mono); font-size: 11px; fill: var(--accent); }
    </style>`;
    const xStart = 50, xEnd = W - 20;
    const yBase = H - 30;
    const yTop = 20;
    const maxY = Math.max(BUFFER_LIMIT * 1.2, ...state.series.map((s) => s.queue), 10);

    // axis
    svg += `<line class="bp-axis" x1="${xStart}" y1="${yBase}" x2="${xEnd}" y2="${yBase}"/>`;
    svg += `<line class="bp-axis" x1="${xStart}" y1="${yTop}" x2="${xStart}" y2="${yBase}"/>`;
    svg += `<text class="bp-axis-text" x="${xStart - 5}" y="${yBase + 4}" text-anchor="end">0</text>`;
    svg += `<text class="bp-axis-text" x="${xStart - 5}" y="${yTop + 4}" text-anchor="end">${Math.round(maxY)}</text>`;
    // buffer limit line
    const limitY = yBase - (BUFFER_LIMIT / maxY) * (yBase - yTop);
    svg += `<line class="bp-limit" x1="${xStart}" y1="${limitY}" x2="${xEnd}" y2="${limitY}"/>`;
    svg += `<text class="bp-limit-text" x="${xEnd}" y="${limitY - 4}" text-anchor="end">buffer cap = ${BUFFER_LIMIT}</text>`;

    // bars
    const TICKS = 15;
    const barW = (xEnd - xStart) / TICKS - 2;
    state.series.forEach((s) => {
      const x = xStart + s.t * (xEnd - xStart) / TICKS + 1;
      const h = (s.queue / maxY) * (yBase - yTop);
      const over = s.queue >= BUFFER_LIMIT;
      svg += `<rect class="bp-bar ${over ? 'over' : ''}" x="${x}" y="${yBase - h}" width="${barW}" height="${h}"/>`;
    });

    svg += `</svg>`;
    root.querySelector('#bp-stage').innerHTML = svg;

    root.querySelector('#m-sent').textContent = state.sent;
    root.querySelector('#m-proc').textContent = state.processed;
    root.querySelector('#m-drop').textContent = state.dropped + state.failed;
    root.querySelector('#m-q').textContent = state.queue;
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  reset();
}
