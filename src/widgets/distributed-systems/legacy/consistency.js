// Consistency widget: 3 replicas, a fixed timeline of events. Pick a
// model + a read timestamp, see what that read returns.

const REPLICAS = ['R1', 'R2', 'R3'];

// Events (operations applied to R1 + propagation lag to others).
// time is in arbitrary "tick" units.
const TIMELINE = [
  { t: 1, type: 'write', client: 'Alice', value: 'A1', primary: 'R1' },
  { t: 4, type: 'replicate', from: 'R1', to: 'R2' },   // R2 gets A1
  { t: 5, type: 'write', client: 'Bob',  value: 'B1', primary: 'R1' },
  { t: 7, type: 'replicate', from: 'R1', to: 'R2' },   // R2 gets B1
  { t: 9, type: 'replicate', from: 'R1', to: 'R3' },   // R3 finally gets A1
  { t: 12, type: 'replicate', from: 'R1', to: 'R3' },  // R3 gets B1
];

const MAX_T = 14;

const MODELS = {
  strong: { label: 'Strong (linearizable)',
            note: 'Every read returns the latest committed write — even if it has to wait or be redirected to the leader.' },
  ryw:    { label: 'Read-your-writes',
            note: 'A client always sees its own past writes; may see stale writes from others.' },
  causal: { label: 'Causal',
            note: 'If A caused B, every observer sees A before B. Independent writes may appear in any order.' },
  eventual: { label: 'Eventual',
            note: 'Any replica may return any old value; eventually all converge.' },
};

// per-replica view: what value does R have at time t?
function valueAt(replica, t) {
  // Collect events applied to this replica by time t.
  // For primary R1: all writes with write.t <= t.
  // For followers: writes where there's a replicate event (from=R1, to=R) with t_r <= t.
  const seen = [];  // chronological list of values applied
  for (const e of TIMELINE) {
    if (e.t > t) break;
    if (e.type === 'write' && replica === e.primary) {
      seen.push({ value: e.value, at: e.t, by: e.client });
    } else if (e.type === 'replicate' && e.to === replica) {
      // Find the latest write before e.t that we haven't replicated yet
      const writes = TIMELINE.filter((x) => x.type === 'write' && x.t < e.t);
      const next = writes[seen.length];   // simplification: in-order replication
      if (next) seen.push({ value: next.value, at: e.t, by: next.client });
    }
  }
  return seen;
}

export function initConsistencyWidget(root) {
  let model = 'strong';
  let readTime = 6;
  let readingReplica = 'R2';
  let clientHistory = []; // last writes the "current client" did

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Same timeline, four consistency models</div>

      <div class="controls">
        <label>Model:</label>
        <div class="pill-group">
          ${Object.entries(MODELS).map(([id, m], i) => `
            <input type="radio" name="con-m" id="con-${id}" value="${id}" ${i === 0 ? 'checked' : ''}>
            <label for="con-${id}">${m.label.split(' ')[0]}</label>
          `).join('')}
        </div>
      </div>

      <div class="controls">
        <label>Read from:</label>
        <div class="pill-group">
          ${REPLICAS.map((r, i) => `
            <input type="radio" name="con-r" id="con-r${i}" value="${r}" ${i === 1 ? 'checked' : ''}>
            <label for="con-r${i}">${r}</label>
          `).join('')}
        </div>
        <label>at t=</label>
        <input type="range" min="0" max="${MAX_T}" value="6" id="con-t" style="width: 200px;">
        <span id="con-t-val" style="font-family: var(--font-mono); min-width: 2em;">6</span>
      </div>

      <div class="widget-stage" id="con-stage" style="min-height: 280px;"></div>

      <div class="callout" id="con-explain"></div>
    </div>
  `;

  const stage = root.querySelector('#con-stage');
  root.querySelectorAll('input[name=con-m]').forEach((r) =>
    r.addEventListener('change', (e) => { model = e.target.value; render(); })
  );
  root.querySelectorAll('input[name=con-r]').forEach((r) =>
    r.addEventListener('change', (e) => { readingReplica = e.target.value; render(); })
  );
  root.querySelector('#con-t').addEventListener('input', (e) => {
    readTime = Number(e.target.value);
    root.querySelector('#con-t-val').textContent = readTime;
    render();
  });

  function render() {
    // Timeline visualization
    const W = 760, H = 230;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<style>
      .con-row { font-family: var(--font-display); font-size: 14px; letter-spacing: 1px; fill: var(--ink); }
      .con-track-bg { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1.5; }
      .con-write { fill: var(--accent); stroke: var(--ink); stroke-width: 1.5; }
      .con-write-text { font-family: var(--font-mono); font-size: 10px; fill: white; font-weight: 700; }
      .con-repl { fill: #c8f0c8; stroke: var(--ink); stroke-width: 1; }
      .con-cursor { stroke: var(--accent); stroke-width: 2; stroke-dasharray: 4 3; }
      .con-cursor-text { font-family: var(--font-mono); font-size: 11px; fill: var(--accent); }
      .con-cell-text { font-family: var(--font-mono); font-size: 10px; fill: var(--ink); }
    </style>`;

    const xStart = 80;
    const xEnd = W - 20;
    const tToX = (t) => xStart + ((xEnd - xStart) * t) / MAX_T;

    // axis
    svg += `<line x1="${xStart}" y1="20" x2="${xEnd}" y2="20" stroke="var(--ink-soft)" stroke-width="1"/>`;
    for (let t = 0; t <= MAX_T; t++) {
      svg += `<line x1="${tToX(t)}" y1="17" x2="${tToX(t)}" y2="23" stroke="var(--ink-soft)" stroke-width="1"/>`;
      svg += `<text x="${tToX(t)}" y="15" text-anchor="middle" class="con-cell-text">t=${t}</text>`;
    }

    // per-replica row
    REPLICAS.forEach((r, idx) => {
      const y = 50 + idx * 50;
      svg += `<text class="con-row" x="20" y="${y + 18}">${r}</text>`;
      svg += `<rect class="con-track-bg" x="${xStart}" y="${y}" width="${xEnd - xStart}" height="30" rx="3"/>`;
      // events on this replica
      const v = valueAt(r, MAX_T);
      v.forEach((entry) => {
        const x = tToX(entry.at);
        const isPrimary = r === 'R1' && TIMELINE.find((e) => e.type === 'write' && e.value === entry.value && e.t === entry.at);
        const cls = isPrimary ? 'con-write' : 'con-repl';
        svg += `<rect class="${cls}" x="${x - 14}" y="${y + 3}" width="28" height="24" rx="3"/>`;
        svg += `<text class="${isPrimary ? 'con-write-text' : 'con-cell-text'}" x="${x}" y="${y + 19}" text-anchor="middle">${entry.value}</text>`;
      });
    });

    // read cursor
    const cursorX = tToX(readTime);
    svg += `<line class="con-cursor" x1="${cursorX}" y1="35" x2="${cursorX}" y2="${50 + 3 * 50 - 10}"/>`;
    svg += `<text class="con-cursor-text" x="${cursorX + 6}" y="42">read</text>`;

    svg += `</svg>`;
    stage.innerHTML = svg;

    // Compute what the chosen read returns under the chosen model
    const physical = valueAt(readingReplica, readTime);
    const physicalLatest = physical.length ? physical[physical.length - 1] : null;

    // For "strong" we'd consult the primary's state at readTime
    const primaryState = valueAt('R1', readTime);
    const primaryLatest = primaryState.length ? primaryState[primaryState.length - 1] : null;

    let returned, why;
    if (model === 'strong') {
      returned = primaryLatest;
      why = `Strong reads always go through the leader (or wait for quorum). Returns the latest committed value at t=${readTime}: <strong>${primaryLatest ? primaryLatest.value : 'nothing'}</strong>.`;
    } else if (model === 'eventual') {
      returned = physicalLatest;
      why = `Eventual: returns whatever this replica has locally — <strong>${physicalLatest ? physicalLatest.value : 'nothing yet'}</strong>. Could be stale by ${primaryLatest && physicalLatest ? primaryLatest.at - physicalLatest.at : 0} ticks.`;
    } else if (model === 'ryw') {
      // For demo, assume the current "client" is Alice. So we'd see at least A1.
      // ryw = max of own writes + local replica's view.
      returned = physicalLatest;
      // If client wrote A1 at t=1 and read at t=2 from R3 (no replication yet), strict ryw would force redirect to a replica that has it.
      const aliceWrites = TIMELINE.filter((e) => e.type === 'write' && e.client === 'Alice' && e.t <= readTime);
      const latestOwn = aliceWrites.length ? aliceWrites[aliceWrites.length - 1] : null;
      const hasOwn = !latestOwn || physical.some((p) => p.value === latestOwn.value);
      if (!hasOwn) {
        returned = { value: latestOwn.value, at: latestOwn.t, by: latestOwn.client };
        why = `Read-your-writes: ${readingReplica} doesn't yet have Alice's write <strong>${latestOwn.value}</strong>, so the system either redirects to a replica that does, or waits. Returns <strong>${latestOwn.value}</strong>.`;
      } else {
        why = `Read-your-writes: ${readingReplica} has Alice's latest write; returns <strong>${physicalLatest ? physicalLatest.value : 'nothing'}</strong>.`;
      }
    } else if (model === 'causal') {
      returned = physicalLatest;
      why = `Causal: each replica must see B1 only after A1 (since A1 happened-before B1 on the same primary). ${readingReplica}'s local order respects that. Returns <strong>${physicalLatest ? physicalLatest.value : 'nothing yet'}</strong>.`;
    }

    let html = `<strong>${MODELS[model].label}</strong>. ${MODELS[model].note}<br><br>${why}`;
    root.querySelector('#con-explain').innerHTML = html;
  }

  render();
}
