// HTTP versions widget: race HTTP/1.1, HTTP/2, HTTP/3 loading 10
// resources. Show how H/2 stalls under packet loss (TCP head-of-line
// blocking) while H/3 keeps individual streams independent.

const NUM_RESOURCES = 10;

export function initHttpVersionsWidget(root) {
  let lossPct = 0;
  let running = false;
  let seed = 1;

  const state = {
    h1: { progress: 0, totalTime: 0, stalledUntil: 0 },
    h2: { progress: 0, totalTime: 0, stalledUntil: 0 },
    h3: { progress: 0, totalTime: 0, stalledUntil: 0 },
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Race: HTTP/1.1 vs HTTP/2 vs HTTP/3</div>
      <p class="widget-hint">Each lane downloads 10 resources. Crank packet loss and watch HTTP/2 stall when one packet is lost (head-of-line blocking).</p>

      <div class="controls">
        <label>Packet loss:</label>
        <input type="range" min="0" max="40" step="5" value="0" id="loss">
        <span id="loss-val" style="font-family: var(--font-mono); min-width: 3em;">0%</span>
        <button class="btn btn-accent" id="run">Start race</button>
        <button class="btn btn-ghost" id="reset">Reset</button>
      </div>

      <div class="widget-stage" id="stage" style="min-height: 240px;"></div>

      <div class="callout" id="explain">
        At 0% loss they all finish quickly, with HTTP/2 and HTTP/3 essentially tied. Add loss and watch the gap open.
      </div>
    </div>
  `;

  const stage = root.querySelector('#stage');
  root.querySelector('#loss').addEventListener('input', (e) => {
    lossPct = Number(e.target.value);
    root.querySelector('#loss-val').textContent = `${lossPct}%`;
  });
  root.querySelector('#run').addEventListener('click', run);
  root.querySelector('#reset').addEventListener('click', reset);

  function rng() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

  function reset() {
    state.h1 = { progress: 0, totalTime: 0, stalledUntil: 0 };
    state.h2 = { progress: 0, totalTime: 0, stalledUntil: 0 };
    state.h3 = { progress: 0, totalTime: 0, stalledUntil: 0 };
    render();
  }

  async function run() {
    if (running) return;
    running = true;
    reset();
    seed = Date.now() & 0xffff;

    // Model parameters (ms per resource — purely illustrative)
    const baseLatency = 80; // per request
    const lossPenalty = 200; // ms added per lost packet
    const lossProb = lossPct / 100;

    // HTTP/1.1: 6 connections, serial within each. 10 resources spread across 6 lanes.
    // For each lane, requests are serial: each subsequent waits for previous.
    // Simplify: ceil(10 / 6) = 2 sequential requests per lane.
    // Add loss penalty per request if hit.

    const h1lanes = 6;
    const reqsPerLane = Math.ceil(NUM_RESOURCES / h1lanes);
    // simulate each lane finishing in N * baseLatency + loss penalty
    let h1MaxTime = 0;
    for (let lane = 0; lane < h1lanes; lane++) {
      let laneTime = 0;
      for (let r = 0; r < reqsPerLane; r++) {
        let t = baseLatency;
        if (rng() < lossProb) t += lossPenalty;
        laneTime += t;
      }
      h1MaxTime = Math.max(h1MaxTime, laneTime);
    }

    // HTTP/2: all on one TCP connection. base time + each lost packet stalls ALL streams.
    let h2Time = baseLatency;
    let h2LostEvents = 0;
    for (let i = 0; i < NUM_RESOURCES; i++) {
      if (rng() < lossProb) h2LostEvents += 1;
    }
    h2Time += h2LostEvents * lossPenalty;

    // HTTP/3: per-stream reliability. Lost packets only stall the affected stream.
    // Take the slowest stream as the bottleneck.
    let h3Max = baseLatency;
    for (let i = 0; i < NUM_RESOURCES; i++) {
      let t = baseLatency;
      if (rng() < lossProb) t += lossPenalty;
      h3Max = Math.max(h3Max, t);
    }

    // Animate progress. Use real-time but scaled.
    const SCALE = 4; // 1ms = 0.25ms of animation
    const tStart = performance.now();
    function step() {
      const elapsed = (performance.now() - tStart) * SCALE;
      state.h1.progress = Math.min(1, elapsed / h1MaxTime);
      state.h2.progress = Math.min(1, elapsed / h2Time);
      state.h3.progress = Math.min(1, elapsed / h3Max);
      state.h1.totalTime = h1MaxTime;
      state.h2.totalTime = h2Time;
      state.h3.totalTime = h3Max;
      render();
      if (state.h1.progress < 1 || state.h2.progress < 1 || state.h3.progress < 1) {
        requestAnimationFrame(step);
      } else {
        running = false;
        updateExplain(h1MaxTime, h2Time, h3Max);
      }
    }
    step();
  }

  function updateExplain(h1, h2, h3) {
    const callout = root.querySelector('#explain');
    const fastest = Math.min(h1, h2, h3);
    const fastestName = (h1 === fastest) ? 'HTTP/1.1' : (h2 === fastest) ? 'HTTP/2' : 'HTTP/3';
    if (lossPct === 0) {
      callout.innerHTML = `At 0% loss, HTTP/2 and HTTP/3 finish in essentially the same time. HTTP/1.1 is slower because each of its 6 connections still has to wait for its own queue. <strong>Winner: ${fastestName} (${Math.round(fastest)}ms).</strong>`;
    } else {
      const h2pen = Math.round(h2 - 80);
      callout.innerHTML = `With ${lossPct}% loss, every lost packet on the HTTP/2 connection stalls <em>every</em> stream — that's <strong>${h2pen}ms</strong> of cascading delay. HTTP/3 only stalls the affected stream, so the slowest stream sets the total. <strong>Winner: ${fastestName} (${Math.round(fastest)}ms).</strong>`;
    }
  }

  function render() {
    const W = 700;
    const lanes = [
      { name: 'HTTP/1.1', sub: '6 connections, serial', data: state.h1, color: '#ffe9b3' },
      { name: 'HTTP/2',   sub: 'one TCP, multiplexed', data: state.h2, color: '#cfe5ff' },
      { name: 'HTTP/3',   sub: 'QUIC, per-stream',     data: state.h3, color: '#c8f0c8' },
    ];
    const laneH = 60;
    const H = lanes.length * laneH + 40;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<style>
      .hv-label { font-family: var(--font-display); font-size: 16px; letter-spacing: 1.5px; fill: var(--ink); }
      .hv-sub { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .hv-bar-bg { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 2; }
      .hv-bar { stroke: var(--ink); stroke-width: 2; }
      .hv-time { font-family: var(--font-mono); font-size: 11px; fill: var(--ink); }
    </style>`;
    lanes.forEach((lane, i) => {
      const y = 30 + i * laneH;
      svg += `<text class="hv-label" x="20" y="${y - 4}">${lane.name}</text>`;
      svg += `<text class="hv-sub" x="120" y="${y - 4}">${lane.sub}</text>`;
      svg += `<rect class="hv-bar-bg" x="20" y="${y}" width="${W - 130}" height="28" rx="4"/>`;
      const w = (W - 130) * lane.data.progress;
      svg += `<rect class="hv-bar" x="20" y="${y}" width="${w}" height="28" rx="4" fill="${lane.color}"/>`;
      svg += `<text class="hv-time" x="${W - 100}" y="${y + 19}">${lane.data.totalTime ? Math.round(lane.data.totalTime) + 'ms' : ''}</text>`;
    });
    svg += `</svg>`;
    stage.innerHTML = svg;
  }

  render();
}
