// Gossip widget: ~16 nodes in a circle. Drop a rumor on one. Each
// round, every node with the rumor gossips it to k random peers.
// Watch the rumor spread and convergence rounds count.

const NUM_NODES = 16;

export function initGossipWidget(root) {
  const state = {
    fanout: 2,
    nodes: [],   // [{id, x, y, hasRumor, justGot}]
    round: 0,
    edges: [],   // visualized edges (last round)
  };

  init();

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">${NUM_NODES}-node cluster</div>

      <div class="controls">
        <label>Fan-out (k):</label>
        <div class="pill-group">
          ${[1,2,3,4].map((k, i) => `
            <input type="radio" name="g-k" id="g-k${k}" value="${k}" ${k === 2 ? 'checked' : ''}>
            <label for="g-k${k}">${k}</label>
          `).join('')}
        </div>
        <button class="btn btn-accent" id="g-step">Next round →</button>
        <button class="btn" id="g-run">Run to convergence</button>
        <button class="btn btn-ghost" id="g-reset">Reset</button>
      </div>

      <div class="widget-stage" id="g-stage" style="min-height: 360px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Round</div><div class="value" id="m-round">0</div></div>
        <div class="metric"><div class="label">Informed</div><div class="value" id="m-inf">1/${NUM_NODES}</div></div>
        <div class="metric accent"><div class="label">log<sub>k+1</sub>(N)</div><div class="value" id="m-log">—</div></div>
      </div>

      <div class="callout" id="g-explain">
        One node starts with a rumour. Click "Next round →" to see who gossips to whom. Try different fan-out values.
      </div>
    </div>
  `;

  const stage = root.querySelector('#g-stage');
  root.querySelectorAll('input[name=g-k]').forEach((r) =>
    r.addEventListener('change', (e) => { state.fanout = Number(e.target.value); updateLog(); })
  );
  root.querySelector('#g-step').addEventListener('click', stepRound);
  root.querySelector('#g-run').addEventListener('click', async () => {
    let safety = 30;
    while (state.nodes.some((n) => !n.hasRumor) && safety-- > 0) {
      stepRound();
      await wait(450);
    }
  });
  root.querySelector('#g-reset').addEventListener('click', () => { init(); render(); });

  function init() {
    state.nodes = [];
    for (let i = 0; i < NUM_NODES; i++) {
      const angle = (i / NUM_NODES) * 2 * Math.PI - Math.PI / 2;
      state.nodes.push({
        id: i,
        x: 230 + 140 * Math.cos(angle),
        y: 170 + 140 * Math.sin(angle),
        hasRumor: i === 0,
        justGot: i === 0,
      });
    }
    state.round = 0;
    state.edges = [];
  }

  function stepRound() {
    if (state.nodes.every((n) => n.hasRumor)) return;
    state.round++;
    const edges = [];
    const newCarriers = new Set();
    state.nodes.forEach((n) => { n.justGot = false; });
    state.nodes.forEach((n) => {
      if (!n.hasRumor) return;
      // pick k random peers (not self)
      const peers = state.nodes.filter((x) => x.id !== n.id);
      for (let i = peers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [peers[i], peers[j]] = [peers[j], peers[i]];
      }
      for (let i = 0; i < state.fanout && i < peers.length; i++) {
        edges.push({ from: n.id, to: peers[i].id });
        if (!peers[i].hasRumor) newCarriers.add(peers[i].id);
      }
    });
    newCarriers.forEach((id) => {
      state.nodes[id].hasRumor = true;
      state.nodes[id].justGot = true;
    });
    state.edges = edges;
    render();
  }

  function render() {
    const W = 460, H = 340;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<style>
      .g-edge { stroke: var(--accent); stroke-width: 1.5; fill: none; opacity: 0.7; marker-end: url(#g-arrow); }
      .g-node-circle { stroke: var(--ink); stroke-width: 2; }
      .g-node-circle.has { fill: var(--accent); }
      .g-node-circle.just { fill: var(--accent); stroke-width: 3.5; }
      .g-node-circle.no { fill: var(--paper); }
      .g-node-text { font-family: var(--font-mono); font-size: 10px; fill: white; font-weight: 600; }
      .g-node-text.no { fill: var(--ink-soft); }
    </style>`;
    svg += `<defs><marker id="g-arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="var(--accent)"/></marker></defs>`;

    state.edges.forEach((e) => {
      const a = state.nodes[e.from];
      const b = state.nodes[e.to];
      svg += `<line class="g-edge" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    });

    state.nodes.forEach((n) => {
      const cls = n.justGot ? 'just' : (n.hasRumor ? 'has' : 'no');
      svg += `<circle class="g-node-circle ${cls}" cx="${n.x}" cy="${n.y}" r="15"/>`;
      svg += `<text class="g-node-text ${cls === 'no' ? 'no' : ''}" x="${n.x}" y="${n.y + 3.5}" text-anchor="middle">${n.id}</text>`;
    });

    svg += `</svg>`;
    stage.innerHTML = svg;

    const informed = state.nodes.filter((n) => n.hasRumor).length;
    root.querySelector('#m-round').textContent = state.round;
    root.querySelector('#m-inf').textContent = `${informed}/${NUM_NODES}`;
    updateLog();

    if (informed === NUM_NODES) {
      root.querySelector('#g-explain').innerHTML = `<strong>Converged in ${state.round} rounds.</strong> Theoretical lower bound: ⌈log<sub>${state.fanout + 1}</sub>(${NUM_NODES})⌉ ≈ ${Math.ceil(Math.log(NUM_NODES) / Math.log(state.fanout + 1))}. Your run was close — randomness affects the constant.`;
    } else if (state.round > 0) {
      root.querySelector('#g-explain').innerHTML = `Round ${state.round}: ${informed}/${NUM_NODES} informed. Each informed node gossiped to ${state.fanout} random peer(s). Click again to continue.`;
    }
  }

  function updateLog() {
    const logN = Math.ceil(Math.log(NUM_NODES) / Math.log(state.fanout + 1));
    root.querySelector('#m-log').textContent = `≈ ${logN}`;
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  init();
  render();
}
