// Replication widget: a primary + 3 replicas. User clicks "Write" and
// watches the packet travel from primary to each replica. Toggle sync vs
// async; kill a replica; see lag accumulate.

export function initReplicationWidget(root) {
  const state = {
    mode: 'async',         // 'async' | 'sync'
    primaryLog: [],        // committed values at primary [{seq, value, t}]
    replicas: [
      { id: 'R1', name: 'Replica 1', log: [], down: false, lagMs: 100, baseLag: 100 },
      { id: 'R2', name: 'Replica 2', log: [], down: false, lagMs: 250, baseLag: 250 },
      { id: 'R3', name: 'Replica 3', log: [], down: false, lagMs: 500, baseLag: 500 },
    ],
    seq: 0,
    inflight: [],          // { fromX, fromY, toX, toY, replicaId, seq, value, startT, durationMs }
    waitingForAcks: null,  // sync mode: track pending acks
    log: [],               // event log entries
    rafHandle: null,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Primary &amp; Replicas</div>
      <p class="widget-hint">Click <em>Write</em> to send a value from primary to all replicas. In <em>sync</em> mode the write doesn't commit until acks arrive. Toggle replicas off to simulate failure.</p>

      <div class="controls">
        <div class="pill-group">
          <input type="radio" name="rep-mode" id="rep-async" value="async" checked>
          <label for="rep-async">Async</label>
          <input type="radio" name="rep-mode" id="rep-sync" value="sync">
          <label for="rep-sync">Sync</label>
        </div>
        <button class="btn btn-accent" id="rep-write">Write</button>
        <button class="btn" id="rep-reset">Reset</button>
        <label style="margin-left:auto">Replicas:</label>
        ${state.replicas.map((r) => `<label class="rep-toggle">
          <input type="checkbox" data-rep="${r.id}" checked> ${r.name}
        </label>`).join('')}
      </div>

      <div class="widget-stage" id="rep-stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Primary seq</div><div class="value" id="rep-pseq">0</div></div>
        <div class="metric"><div class="label">Max lag</div><div class="value" id="rep-maxlag">0</div></div>
        <div class="metric accent"><div class="label">Last write</div><div class="value" id="rep-last">—</div></div>
      </div>

      <div class="log" id="rep-log"></div>
    </div>

    <style>
      .rep-toggle { font-size: 0.85rem; margin-left: 0.4rem; }
    </style>
  `;

  const stage = root.querySelector('#rep-stage');
  const logEl = root.querySelector('#rep-log');
  const mPseq = root.querySelector('#rep-pseq');
  const mMaxLag = root.querySelector('#rep-maxlag');
  const mLast = root.querySelector('#rep-last');

  root.querySelectorAll('input[name=rep-mode]').forEach((r) =>
    r.addEventListener('change', (e) => { state.mode = e.target.value; addLog('info', `Mode → ${state.mode}`); })
  );
  root.querySelector('#rep-write').addEventListener('click', doWrite);
  root.querySelector('#rep-reset').addEventListener('click', resetAll);
  root.querySelectorAll('input[data-rep]').forEach((cb) =>
    cb.addEventListener('change', (e) => {
      const id = e.target.dataset.rep;
      const rep = state.replicas.find((r) => r.id === id);
      rep.down = !e.target.checked;
      addLog(rep.down ? 'err' : 'ok', `${rep.name} ${rep.down ? 'OFFLINE' : 'ONLINE'}`);
    })
  );

  function doWrite() {
    state.seq += 1;
    const value = `v${state.seq}`;
    const t = performance.now();
    state.primaryLog.push({ seq: state.seq, value, t });
    addLog('ok', `PRIMARY commits ${value} (seq=${state.seq})${state.mode === 'sync' ? ' [waiting for acks…]' : ''}`);

    state.replicas.forEach((r) => {
      if (r.down) {
        addLog('err', `${r.name} OFFLINE — write queued for later`);
        return;
      }
      // small per-write jitter
      const dur = r.baseLag * (0.85 + Math.random() * 0.3);
      state.inflight.push({
        toRep: r.id,
        seq: state.seq,
        value,
        startT: t,
        durationMs: dur,
      });
    });

    if (state.mode === 'sync') {
      mLast.textContent = `${value} ⌛`;
    } else {
      mLast.textContent = value;
    }
    if (!state.rafHandle) loop();
  }

  function resetAll() {
    state.primaryLog = [];
    state.seq = 0;
    state.inflight = [];
    state.replicas.forEach((r) => { r.log = []; });
    mLast.textContent = '—';
    logEl.innerHTML = '';
    render();
  }

  function loop() {
    const t = performance.now();
    state.inflight = state.inflight.filter((pkt) => {
      const progress = (t - pkt.startT) / pkt.durationMs;
      if (progress >= 1) {
        const rep = state.replicas.find((r) => r.id === pkt.toRep);
        rep.log.push({ seq: pkt.seq, value: pkt.value });
        addLog('ok', `${rep.name} applied ${pkt.value} (lag ${Math.round(pkt.durationMs)}ms)`);
        // if sync and this was the last needed ack, mark commit
        if (state.mode === 'sync' && allRepsCaughtUp(pkt.seq)) {
          mLast.textContent = pkt.value;
          addLog('info', `Sync: write ${pkt.value} fully acked`);
        }
        return false;
      }
      return true;
    });
    render();
    if (state.inflight.length > 0) {
      state.rafHandle = requestAnimationFrame(loop);
    } else {
      state.rafHandle = null;
    }
  }

  function allRepsCaughtUp(seq) {
    return state.replicas
      .filter((r) => !r.down)
      .every((r) => r.log.some((e) => e.seq === seq));
  }

  function addLog(level, msg) {
    const div = document.createElement('div');
    div.className = `entry ${level}`;
    div.innerHTML = `<span class="t">${new Date().toLocaleTimeString()}</span>${msg}`;
    logEl.prepend(div);
    while (logEl.children.length > 50) logEl.removeChild(logEl.lastChild);
  }

  function render() {
    const W = 700;
    const H = 280;
    const primaryX = 90, primaryY = H / 2;
    const repX = 540;
    const repYs = [60, 140, 220];

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;">`;
    svg += `<style>
      .rep-node { stroke: var(--ink); stroke-width: 2.5; }
      .rep-node.primary { fill: var(--accent-soft); }
      .rep-node.replica { fill: var(--paper); }
      .rep-node.down { fill: #ddd; stroke: #999; stroke-dasharray: 4 4; }
      .rep-label { font-family: var(--font-display); font-size: 16px; fill: var(--ink); letter-spacing: 1px; }
      .rep-sublabel { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .rep-link { stroke: var(--ink-soft); stroke-width: 1.5; stroke-dasharray: 5 4; }
      .rep-link.down { stroke: #ccc; }
      .packet { fill: var(--accent); stroke: var(--ink); stroke-width: 1.5; }
      .packet-text { font-family: var(--font-mono); font-size: 10px; fill: white; }
      .lag-bar-bg { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1; }
      .lag-bar { fill: var(--accent); }
    </style>`;

    // primary node
    svg += `<rect class="rep-node primary" x="${primaryX - 60}" y="${primaryY - 35}" width="120" height="70" rx="6"/>`;
    svg += `<text class="rep-label" x="${primaryX}" y="${primaryY - 8}" text-anchor="middle">PRIMARY</text>`;
    svg += `<text class="rep-sublabel" x="${primaryX}" y="${primaryY + 8}" text-anchor="middle">seq = ${state.seq}</text>`;
    svg += `<text class="rep-sublabel" x="${primaryX}" y="${primaryY + 22}" text-anchor="middle">${state.primaryLog.length} writes</text>`;

    // replicas
    state.replicas.forEach((r, idx) => {
      const y = repYs[idx];
      const cls = r.down ? 'down' : 'replica';
      svg += `<line class="rep-link ${r.down ? 'down' : ''}" x1="${primaryX + 60}" y1="${primaryY}" x2="${repX - 60}" y2="${y}"/>`;
      svg += `<rect class="rep-node ${cls}" x="${repX - 60}" y="${y - 28}" width="120" height="60" rx="6"/>`;
      svg += `<text class="rep-label" x="${repX}" y="${y - 8}" text-anchor="middle">${r.id}</text>`;
      const lag = state.seq - (r.log.length ? r.log[r.log.length - 1].seq : 0);
      svg += `<text class="rep-sublabel" x="${repX}" y="${y + 6}" text-anchor="middle">${r.down ? 'OFFLINE' : `lag: ${lag}`}</text>`;
      svg += `<text class="rep-sublabel" x="${repX}" y="${y + 20}" text-anchor="middle">${r.down ? '' : `${r.log.length} applied`}</text>`;

      // lag bar to the right
      const barX = repX + 70, barY = y - 6, barW = 50, barH = 12;
      svg += `<rect class="lag-bar-bg" x="${barX}" y="${barY}" width="${barW}" height="${barH}"/>`;
      if (!r.down) {
        const lagFrac = Math.min(1, lag / Math.max(1, state.seq));
        svg += `<rect class="lag-bar" x="${barX}" y="${barY}" width="${barW * lagFrac}" height="${barH}"/>`;
      }
    });

    // packets in flight
    const t = performance.now();
    state.inflight.forEach((pkt) => {
      const idx = state.replicas.findIndex((r) => r.id === pkt.toRep);
      const ry = repYs[idx];
      const progress = Math.min(1, (t - pkt.startT) / pkt.durationMs);
      const x = primaryX + 60 + (repX - 60 - (primaryX + 60)) * progress;
      const y = primaryY + (ry - primaryY) * progress;
      svg += `<circle class="packet" cx="${x}" cy="${y}" r="14"/>`;
      svg += `<text class="packet-text" x="${x}" y="${y + 4}" text-anchor="middle">${pkt.value}</text>`;
    });

    svg += `</svg>`;
    stage.innerHTML = svg;

    mPseq.textContent = state.seq;
    const lags = state.replicas.filter((r) => !r.down).map((r) => state.seq - (r.log.length ? r.log[r.log.length - 1].seq : 0));
    mMaxLag.textContent = lags.length ? Math.max(...lags, 0) : '—';
  }

  render();
}
