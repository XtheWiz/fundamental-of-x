// CAP widget: two replicas + a tunable network partition. User picks
// CP or AP mode and runs reads/writes from each side. CP rejects when
// partitioned; AP serves possibly-stale data.

export function initCapWidget(root) {
  const state = {
    mode: 'cp',          // 'cp' or 'ap'
    partitioned: false,
    a: { value: 'v0', log: [] },  // replica A
    b: { value: 'v0', log: [] },  // replica B
    seq: 0,
    log: [],
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Two replicas, one network</div>

      <div class="controls">
        <label>System type:</label>
        <div class="pill-group">
          <input type="radio" name="cap-mode" id="cap-cp" value="cp" checked>
          <label for="cap-cp">CP (consistent, refuses on partition)</label>
          <input type="radio" name="cap-mode" id="cap-ap" value="ap">
          <label for="cap-ap">AP (available, may diverge)</label>
        </div>
        <button class="btn ${state.partitioned ? 'btn-accent' : ''}" id="cap-part">${state.partitioned ? 'Heal partition' : 'Partition network'}</button>
        <button class="btn btn-ghost" id="cap-reset">Reset</button>
      </div>

      <div class="widget-stage" id="cap-stage" style="min-height: 260px;"></div>

      <div class="controls">
        <strong>Replica A:</strong>
        <button class="btn" data-action="readA">Read</button>
        <button class="btn" data-action="writeA">Write</button>
        <span style="flex: 1;"></span>
        <strong>Replica B:</strong>
        <button class="btn" data-action="readB">Read</button>
        <button class="btn" data-action="writeB">Write</button>
      </div>

      <div class="log" id="cap-log"></div>

      <div class="callout" id="cap-explain">
        Pick a mode, then partition the network and try reading/writing from each side. CP refuses; AP serves on.
      </div>
    </div>
  `;

  const stage = root.querySelector('#cap-stage');
  const logEl = root.querySelector('#cap-log');

  root.querySelectorAll('input[name=cap-mode]').forEach((r) =>
    r.addEventListener('change', (e) => { state.mode = e.target.value; render(); })
  );
  root.querySelector('#cap-part').addEventListener('click', () => {
    state.partitioned = !state.partitioned;
    if (!state.partitioned) {
      // heal: in AP mode, merge with last-writer-wins
      if (state.mode === 'ap') {
        const winner = state.a.value.localeCompare(state.b.value) > 0 ? state.a.value : state.b.value;
        const aWas = state.a.value, bWas = state.b.value;
        state.a.value = winner;
        state.b.value = winner;
        addLog('info', `Partition healed. AP reconciliation: A=${aWas} & B=${bWas} → both ${winner} (last-writer-wins).`);
      } else {
        addLog('ok', 'Partition healed. Replicas had stayed in sync.');
      }
    } else {
      addLog('warn', 'Network partition! A and B can no longer reach each other.');
    }
    render();
  });
  root.querySelector('#cap-reset').addEventListener('click', () => {
    state.partitioned = false;
    state.a = { value: 'v0', log: [] };
    state.b = { value: 'v0', log: [] };
    state.seq = 0;
    state.log = [];
    logEl.innerHTML = '';
    render();
  });

  root.querySelectorAll('button[data-action]').forEach((b) =>
    b.addEventListener('click', () => doAction(b.dataset.action))
  );

  function doAction(action) {
    if (action === 'readA') return read('A');
    if (action === 'readB') return read('B');
    if (action === 'writeA') return write('A');
    if (action === 'writeB') return write('B');
  }

  function read(side) {
    if (state.mode === 'cp' && state.partitioned) {
      addLog('err', `Read on ${side} during partition: <strong>refused</strong> (CP would rather error than risk stale data)`);
    } else {
      const v = side === 'A' ? state.a.value : state.b.value;
      addLog('ok', `Read on ${side}: returned ${v}`);
    }
    render();
  }

  function write(side) {
    state.seq++;
    const newVal = 'v' + state.seq;
    if (state.mode === 'cp' && state.partitioned) {
      addLog('err', `Write on ${side} during partition: <strong>refused</strong> (CP needs quorum)`);
      render();
      return;
    }
    if (state.partitioned) {
      if (side === 'A') {
        state.a.value = newVal;
        addLog('warn', `AP write on A: local only — A=${newVal}, B still ${state.b.value}. Replicas now diverged.`);
      } else {
        state.b.value = newVal;
        addLog('warn', `AP write on B: local only — B=${newVal}, A still ${state.a.value}. Replicas now diverged.`);
      }
    } else {
      state.a.value = newVal;
      state.b.value = newVal;
      addLog('ok', `Write on ${side}: replicated to both → ${newVal}`);
    }
    render();
  }

  function render() {
    const W = 700, H = 250;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<style>
      .cap-node { stroke: var(--ink); stroke-width: 2.5; }
      .cap-node.a { fill: #cfe5ff; }
      .cap-node.b { fill: #c8f0c8; }
      .cap-label { font-family: var(--font-display); font-size: 22px; letter-spacing: 2px; fill: var(--ink); }
      .cap-sub { font-family: var(--font-mono); font-size: 12px; fill: var(--ink-soft); }
      .cap-val { font-family: var(--font-mono); font-size: 16px; fill: var(--ink); font-weight: 600; }
      .cap-link { stroke: var(--ink); stroke-width: 3; }
      .cap-link.broken { stroke: var(--accent); stroke-dasharray: 8 6; }
      .cap-cut { stroke: var(--accent); stroke-width: 3; }
    </style>`;
    // Replica A
    svg += `<rect class="cap-node a" x="50" y="80" width="180" height="100" rx="8"/>`;
    svg += `<text class="cap-label" x="140" y="115" text-anchor="middle">Replica A</text>`;
    svg += `<text class="cap-sub" x="140" y="135" text-anchor="middle">us-east-1</text>`;
    svg += `<text class="cap-val" x="140" y="162" text-anchor="middle">value = ${state.a.value}</text>`;
    // Replica B
    svg += `<rect class="cap-node b" x="470" y="80" width="180" height="100" rx="8"/>`;
    svg += `<text class="cap-label" x="560" y="115" text-anchor="middle">Replica B</text>`;
    svg += `<text class="cap-sub" x="560" y="135" text-anchor="middle">eu-west-1</text>`;
    svg += `<text class="cap-val" x="560" y="162" text-anchor="middle">value = ${state.b.value}</text>`;
    // Link
    svg += `<line class="cap-link ${state.partitioned ? 'broken' : ''}" x1="230" y1="130" x2="470" y2="130"/>`;
    if (state.partitioned) {
      // partition X mark
      svg += `<text x="350" y="125" text-anchor="middle" style="font-family: var(--font-display); font-size: 28px; fill: var(--accent);">✂</text>`;
      svg += `<text x="350" y="160" text-anchor="middle" class="cap-sub" style="fill: var(--accent);">PARTITION</text>`;
    } else {
      svg += `<text x="350" y="124" text-anchor="middle" class="cap-sub">replication link</text>`;
    }

    // Mode badge
    const modeLabel = state.mode === 'cp' ? 'CP (consistent)' : 'AP (available)';
    const modeColor = state.mode === 'cp' ? '#cfe5ff' : '#ffe9b3';
    svg += `<rect x="280" y="20" width="140" height="32" rx="6" stroke="var(--ink)" stroke-width="2" fill="${modeColor}"/>`;
    svg += `<text x="350" y="40" text-anchor="middle" class="cap-label" style="font-size: 14px;">${modeLabel}</text>`;

    svg += `</svg>`;
    stage.innerHTML = svg;

    // Partition button text
    root.querySelector('#cap-part').textContent = state.partitioned ? 'Heal partition' : 'Partition network';

    // Explain text
    let exp;
    if (!state.partitioned) {
      exp = `No partition. Writes propagate to both replicas, reads always return the latest. ${state.mode.toUpperCase()} mode looks fine when the network works.`;
    } else if (state.mode === 'cp') {
      exp = `<strong>Partitioned + CP</strong>: refuses all reads and writes that can't reach a quorum. The system stays correct but unavailable until the partition heals.`;
    } else {
      exp = `<strong>Partitioned + AP</strong>: each side keeps serving with its local copy. Replicas diverge during the partition; on heal, they must reconcile (last-writer-wins, CRDTs, or app-level merge).`;
    }
    root.querySelector('#cap-explain').innerHTML = exp;
  }

  function addLog(level, msg) {
    const d = document.createElement('div');
    d.className = `entry ${level}`;
    d.innerHTML = `<span class="t">${new Date().toLocaleTimeString()}</span>${msg}`;
    logEl.prepend(d);
  }

  render();
}
