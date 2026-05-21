// Vector clocks widget: 3 nodes, manual events + sends. Show each
// node's current vector and a history of events with their vectors.
// Pick two events to compare and see if one happened-before the other.

const NUM_NODES = 3;

export function initVectorClocksWidget(root) {
  const state = {
    vectors: [],          // current vector per node
    events: [],           // {id, node, action, vector, payload?}
    pendingMessages: [],  // {from, to, vector}
    nextEventId: 1,
    compareA: null,
    compareB: null,
  };
  for (let i = 0; i < NUM_NODES; i++) state.vectors.push([0, 0, 0]);

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">3-node vector clocks</div>

      <div class="controls">
        <strong>N0:</strong>
        <button class="btn" data-act="event-0">Local event</button>
        <button class="btn" data-act="send-0-1">Send → N1</button>
        <button class="btn" data-act="send-0-2">Send → N2</button>
      </div>
      <div class="controls">
        <strong>N1:</strong>
        <button class="btn" data-act="event-1">Local event</button>
        <button class="btn" data-act="send-1-0">Send → N0</button>
        <button class="btn" data-act="send-1-2">Send → N2</button>
      </div>
      <div class="controls">
        <strong>N2:</strong>
        <button class="btn" data-act="event-2">Local event</button>
        <button class="btn" data-act="send-2-0">Send → N0</button>
        <button class="btn" data-act="send-2-1">Send → N1</button>
      </div>

      <div class="controls">
        <span style="font-family: var(--font-mono); color: var(--ink-soft); margin-right: 0.4em;" id="vc-pending"></span>
        <button class="btn btn-accent" id="vc-deliver">Deliver next message</button>
        <button class="btn btn-ghost" id="vc-reset">Reset</button>
      </div>

      <div class="widget-stage" id="vc-stage" style="min-height: 320px;"></div>

      <div class="callout" id="vc-explain">
        Trigger events and sends on each node. Watch the vectors update. Click any two events in the history to compare causality.
      </div>
    </div>
  `;

  const stage = root.querySelector('#vc-stage');
  root.querySelectorAll('button[data-act]').forEach((b) =>
    b.addEventListener('click', () => doAction(b.dataset.act))
  );
  root.querySelector('#vc-deliver').addEventListener('click', deliverNext);
  root.querySelector('#vc-reset').addEventListener('click', () => {
    state.vectors = [];
    for (let i = 0; i < NUM_NODES; i++) state.vectors.push([0, 0, 0]);
    state.events = [];
    state.pendingMessages = [];
    state.nextEventId = 1;
    state.compareA = null;
    state.compareB = null;
    render();
  });

  function doAction(act) {
    const m = act.match(/^event-(\d)$/);
    if (m) return localEvent(Number(m[1]));
    const s = act.match(/^send-(\d)-(\d)$/);
    if (s) return sendMessage(Number(s[1]), Number(s[2]));
  }

  function localEvent(node) {
    state.vectors[node][node]++;
    state.events.push({
      id: state.nextEventId++,
      node,
      action: 'local',
      vector: state.vectors[node].slice(),
    });
    render();
  }

  function sendMessage(from, to) {
    state.vectors[from][from]++;
    const vec = state.vectors[from].slice();
    state.events.push({
      id: state.nextEventId++,
      node: from,
      action: `send → N${to}`,
      vector: vec,
    });
    state.pendingMessages.push({ from, to, vector: vec });
    render();
  }

  function deliverNext() {
    if (!state.pendingMessages.length) return;
    const msg = state.pendingMessages.shift();
    const v = state.vectors[msg.to];
    v[msg.to]++;
    for (let i = 0; i < v.length; i++) v[i] = Math.max(v[i], msg.vector[i]);
    state.events.push({
      id: state.nextEventId++,
      node: msg.to,
      action: `receive ← N${msg.from}`,
      vector: v.slice(),
      payload: msg.vector,
    });
    render();
  }

  function compareVectors(a, b) {
    let lessEq = true, greaterEq = true;
    let strictLess = false, strictGreater = false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] > b[i]) { lessEq = false; strictGreater = true; }
      if (a[i] < b[i]) { greaterEq = false; strictLess = true; }
    }
    if (lessEq && strictLess) return 'before';
    if (greaterEq && strictGreater) return 'after';
    if (lessEq && greaterEq) return 'equal';
    return 'concurrent';
  }

  function render() {
    // current vectors
    let html = `<div class="vc-current">`;
    for (let i = 0; i < NUM_NODES; i++) {
      html += `<div class="vc-node">
        <div class="vc-node-name">N${i}</div>
        <div class="vc-vector">[${state.vectors[i].join(', ')}]</div>
      </div>`;
    }
    html += `</div>`;

    // events history
    html += `<div class="vc-history-title">Event history (click two to compare):</div>`;
    html += `<div class="vc-history">`;
    state.events.forEach((e) => {
      const isA = state.compareA === e.id;
      const isB = state.compareB === e.id;
      const cls = isA ? 'sel-a' : (isB ? 'sel-b' : '');
      html += `<div class="vc-event ${cls}" data-eid="${e.id}">
        <div class="vc-event-id">e${e.id}</div>
        <div class="vc-event-meta">N${e.node} · ${e.action}</div>
        <div class="vc-event-vec">[${e.vector.join(',')}]</div>
      </div>`;
    });
    if (!state.events.length) html += `<div style="color: var(--ink-faint); font-family: var(--font-mono); font-size: 0.85rem;">(no events yet)</div>`;
    html += `</div>`;

    // comparison result
    if (state.compareA && state.compareB && state.compareA !== state.compareB) {
      const a = state.events.find((e) => e.id === state.compareA);
      const b = state.events.find((e) => e.id === state.compareB);
      const rel = compareVectors(a.vector, b.vector);
      let msg;
      if (rel === 'before') msg = `<strong>e${a.id} happened-before e${b.id}.</strong> Causality: a fact at e${a.id} was visible to the system before e${b.id} occurred.`;
      else if (rel === 'after') msg = `<strong>e${b.id} happened-before e${a.id}.</strong> The other direction.`;
      else if (rel === 'concurrent') msg = `<strong>e${a.id} ⫛ e${b.id} (concurrent).</strong> Neither caused the other. Conflict resolution is up to the application.`;
      else msg = `Same event.`;
      html += `<div class="vc-compare">${msg}</div>`;
    }

    html += `<style>
      .vc-current { display: grid; grid-template-columns: repeat(${NUM_NODES}, 1fr); gap: 0.4rem; margin-bottom: 0.6rem; }
      .vc-node { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem; text-align: center; }
      .vc-node-name { font-family: var(--font-display); letter-spacing: 1.5px; font-size: 1.1rem; }
      .vc-vector { font-family: var(--font-mono); font-size: 1.2rem; font-weight: 600; }
      .vc-history-title { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
      .vc-history { display: flex; flex-wrap: wrap; gap: 0.3rem; max-height: 160px; overflow-y: auto; padding: 0.3rem; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: var(--radius); }
      .vc-event { background: var(--paper); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 0.3em 0.5em; font-size: 0.78rem; min-width: 110px; cursor: pointer; }
      .vc-event:hover { background: var(--paper-deep); }
      .vc-event.sel-a { background: #cfe5ff; border-color: var(--accent); box-shadow: 2px 2px 0 var(--accent); }
      .vc-event.sel-b { background: #ffe9b3; border-color: var(--accent); box-shadow: 2px 2px 0 var(--accent); }
      .vc-event-id { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.9rem; }
      .vc-event-meta { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); }
      .vc-event-vec { font-family: var(--font-mono); font-size: 0.85rem; font-weight: 600; }
      .vc-compare { margin-top: 0.6rem; padding: 0.7rem; background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); box-shadow: 3px 3px 0 var(--accent); }
    </style>`;
    stage.innerHTML = html;

    // wire up event clicks
    stage.querySelectorAll('.vc-event').forEach((el) =>
      el.addEventListener('click', () => {
        const id = Number(el.dataset.eid);
        if (state.compareA === null) state.compareA = id;
        else if (state.compareB === null && id !== state.compareA) state.compareB = id;
        else { state.compareA = id; state.compareB = null; }
        render();
      })
    );

    // pending message indicator
    const pendingEl = root.querySelector('#vc-pending');
    if (state.pendingMessages.length) {
      pendingEl.textContent = `${state.pendingMessages.length} message(s) in flight`;
    } else {
      pendingEl.textContent = 'no pending messages';
    }
  }

  render();
}
