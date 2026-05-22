// TCP vs UDP widget: send 10 numbered packets over each, with a
// shared random packet-loss probability. TCP retransmits; UDP doesn't.
// At the end, show what arrived and what was lost.

const NUM_PACKETS = 10;

export function initTcpVsUdpWidget(root) {
  const state = {
    lossPct: 30,
    running: false,
    seed: 1,
    tcp: { sent: [], received: [], inflight: [], retries: 0, done: false },
    udp: { sent: [], received: [], inflight: [], lost: 0, done: false },
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Same Packets, Two Protocols</div>
      <p class="widget-hint">Each row sends packets 1–${NUM_PACKETS}. With non-zero loss, TCP retransmits until each arrives; UDP doesn't bother.</p>

      <div class="controls">
        <label>Packet loss:</label>
        <input type="range" min="0" max="80" step="5" value="30" id="loss" style="width: 200px;">
        <span id="loss-val" style="font-family: var(--font-mono); min-width: 3em;">30%</span>
        <button class="btn btn-accent" id="run">Send 10 packets</button>
        <button class="btn btn-ghost" id="reset">Reset</button>
      </div>

      <div class="widget-stage" id="stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">TCP delivered</div><div class="value" id="m-tcp-d">0/${NUM_PACKETS}</div></div>
        <div class="metric"><div class="label">TCP retries</div><div class="value" id="m-tcp-r">0</div></div>
        <div class="metric accent"><div class="label">UDP delivered</div><div class="value" id="m-udp-d">0/${NUM_PACKETS}</div></div>
        <div class="metric"><div class="label">UDP lost</div><div class="value" id="m-udp-l">0</div></div>
      </div>

      <div class="callout" id="explain">
        Higher loss = TCP gets <em>slower</em> but never gives up. UDP keeps the same speed but loses data.
      </div>
    </div>
  `;

  const stage = root.querySelector('#stage');
  const lossEl = root.querySelector('#loss');
  const lossVal = root.querySelector('#loss-val');

  lossEl.addEventListener('input', (e) => {
    state.lossPct = Number(e.target.value);
    lossVal.textContent = `${state.lossPct}%`;
  });
  root.querySelector('#run').addEventListener('click', run);
  root.querySelector('#reset').addEventListener('click', reset);

  function reset() {
    state.tcp = { sent: [], received: [], inflight: [], retries: 0, done: false };
    state.udp = { sent: [], received: [], inflight: [], lost: 0, done: false };
    render();
  }

  function rng() {
    // simple LCG so each click produces a fresh-looking sequence
    state.seed = (state.seed * 9301 + 49297) % 233280;
    return state.seed / 233280;
  }

  function isLost() {
    return rng() < state.lossPct / 100;
  }

  async function run() {
    if (state.running) return;
    state.running = true;
    reset();
    state.seed = Date.now() & 0xffff;

    // UDP: send 10 fire-and-forget. Each either arrives or is lost.
    for (let i = 1; i <= NUM_PACKETS; i++) {
      state.udp.sent.push(i);
      const lost = isLost();
      state.udp.inflight.push({ n: i, lost });
      render();
      await wait(120);
      state.udp.inflight = state.udp.inflight.filter((p) => p.n !== i);
      if (lost) state.udp.lost += 1;
      else state.udp.received.push(i);
      render();
    }
    state.udp.done = true;

    // TCP: same packets, but resend any lost one until it arrives.
    for (let i = 1; i <= NUM_PACKETS; i++) {
      let attempts = 0;
      while (true) {
        attempts += 1;
        state.tcp.sent.push(i);
        const lost = isLost();
        state.tcp.inflight.push({ n: i, lost, attempt: attempts });
        render();
        await wait(120);
        state.tcp.inflight = state.tcp.inflight.filter((p) => p.n !== i);
        if (!lost) {
          state.tcp.received.push(i);
          render();
          break;
        }
        state.tcp.retries += 1;
        render();
        await wait(160); // RTO backoff
      }
    }
    state.tcp.done = true;
    state.running = false;
    render();
  }

  function render() {
    const W = 700;
    const H = 220;
    const lanes = [
      { name: 'TCP',  y: 60,  data: state.tcp,  color: '#cfe5ff' },
      { name: 'UDP',  y: 160, data: state.udp,  color: '#ffe9b3' },
    ];
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<style>
      .tu-lane-bg { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 2; }
      .tu-lane-label { font-family: var(--font-display); font-size: 18px; letter-spacing: 2px; fill: var(--ink); }
      .tu-endpoint { fill: var(--paper); stroke: var(--ink); stroke-width: 2; }
      .tu-pkt { fill: var(--accent); stroke: var(--ink); stroke-width: 1.5; }
      .tu-pkt.lost { fill: #ccc; stroke: #999; stroke-dasharray: 3 2; }
      .tu-pkt-text { font-family: var(--font-mono); font-size: 10px; fill: white; font-weight: 600; }
      .tu-pkt-text.lost { fill: #777; }
      .tu-arrived { font-family: var(--font-mono); font-size: 11px; fill: var(--ink); }
    </style>`;

    lanes.forEach((lane) => {
      svg += `<text class="tu-lane-label" x="20" y="${lane.y - 30}">${lane.name}</text>`;
      // lane background
      svg += `<rect class="tu-lane-bg" x="90" y="${lane.y - 18}" width="520" height="36" rx="4" fill="${lane.color}"/>`;
      // endpoints
      svg += `<rect class="tu-endpoint" x="60" y="${lane.y - 14}" width="30" height="28" rx="3"/>`;
      svg += `<text x="75" y="${lane.y + 4}" text-anchor="middle" style="font-family: var(--font-display); font-size: 10px; letter-spacing: 1px;">SRC</text>`;
      svg += `<rect class="tu-endpoint" x="610" y="${lane.y - 14}" width="30" height="28" rx="3"/>`;
      svg += `<text x="625" y="${lane.y + 4}" text-anchor="middle" style="font-family: var(--font-display); font-size: 10px; letter-spacing: 1px;">DST</text>`;

      // delivered packets stacked above lane
      lane.data.received.forEach((n, i) => {
        const x = 100 + i * 50;
        svg += `<circle class="tu-pkt" cx="${x}" cy="${lane.y - 36}" r="11"/>`;
        svg += `<text class="tu-pkt-text" x="${x}" y="${lane.y - 33}" text-anchor="middle">${n}</text>`;
      });

      // inflight packets (animated would be ideal but this is a static frame)
      lane.data.inflight.forEach((p) => {
        const cx = 300; // mid-lane
        const cls = p.lost ? 'tu-pkt lost' : 'tu-pkt';
        const cls2 = p.lost ? 'tu-pkt-text lost' : 'tu-pkt-text';
        svg += `<circle class="${cls}" cx="${cx}" cy="${lane.y}" r="13"/>`;
        svg += `<text class="${cls2}" x="${cx}" y="${lane.y + 4}" text-anchor="middle">${p.n}</text>`;
        if (p.lost) {
          svg += `<text x="${cx + 18}" y="${lane.y + 4}" style="font-family: var(--font-display); font-size: 14px; fill: var(--accent);">✕ lost</text>`;
        }
      });

      // status badge
      if (lane.data.done) {
        svg += `<text x="${W - 20}" y="${lane.y - 28}" text-anchor="end" style="font-family: var(--font-display); font-size: 14px; letter-spacing: 1px; fill: var(--ink-soft);">DONE</text>`;
      }
    });

    svg += `</svg>`;
    stage.innerHTML = svg;

    // metrics
    root.querySelector('#m-tcp-d').textContent = `${state.tcp.received.length}/${NUM_PACKETS}`;
    root.querySelector('#m-tcp-r').textContent = state.tcp.retries;
    root.querySelector('#m-udp-d').textContent = `${state.udp.received.length}/${NUM_PACKETS}`;
    root.querySelector('#m-udp-l').textContent = state.udp.lost;
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  render();
}
