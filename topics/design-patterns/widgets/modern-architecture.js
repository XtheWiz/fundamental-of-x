// Modern architecture patterns widget: card grid of 5 patterns, each
// shows a small flow diagram + use case + when-not-to-use.

const PATTERNS = {
  mvc: {
    label: 'MVC / MVVM',
    sub: 'Separation of presentation',
    flow: 'User input → Controller → Model → View update',
    diagram: [
      { id: 'view', label: 'View', color: '#cfe5ff' },
      { id: 'ctrl', label: 'Controller', color: '#ffe9b3' },
      { id: 'model', label: 'Model', color: '#c8f0c8' },
    ],
    edges: [['view', 'ctrl', 'user event'], ['ctrl', 'model', 'mutate'], ['model', 'view', 'update']],
    use: 'Every UI framework: Rails, ASP.NET, iOS UIKit. MVVM (Angular, .NET MAUI) adds a binding layer.',
    avoid: 'Tiny apps where the View IS the Model. Don\'t add layers for the sake of layers.',
  },
  cqrs: {
    label: 'CQRS',
    sub: 'Different models for reads & writes',
    flow: 'Commands → Write model → Events → Read model(s)',
    diagram: [
      { id: 'cmd', label: 'Command', color: '#ffe9b3' },
      { id: 'write', label: 'Write model', color: '#cfe5ff' },
      { id: 'read', label: 'Read model', color: '#c8f0c8' },
      { id: 'query', label: 'Query', color: '#f7c8c8' },
    ],
    edges: [['cmd', 'write', 'validate'], ['write', 'read', 'project'], ['query', 'read', 'fast lookup']],
    use: 'When reads and writes have very different shapes/scale. E.g. write small normalized rows; read denormalized analytics views.',
    avoid: 'Until your read and write loads actually diverge. CQRS doubles your data model.',
  },
  es: {
    label: 'Event Sourcing',
    sub: 'Store changes, not state',
    flow: 'Command → Event(s) → append-only log → fold into state on read',
    diagram: [
      { id: 'cmd', label: 'Command', color: '#ffe9b3' },
      { id: 'log', label: 'Event log', color: '#cfe5ff' },
      { id: 'state', label: 'Materialized state', color: '#c8f0c8' },
    ],
    edges: [['cmd', 'log', 'append event'], ['log', 'state', 'fold/replay']],
    use: 'Audit-heavy domains (banking, healthcare, regulatory). "What was the state at time T?" is free.',
    avoid: 'CRUD apps. Adds significant complexity (event versioning, snapshots, projections) without payoff.',
  },
  cb: {
    label: 'Circuit Breaker',
    sub: 'Fail fast when upstream is broken',
    flow: 'closed → too many failures → open → cool down → half-open → success → closed',
    diagram: [
      { id: 'closed',   label: 'Closed', color: '#c8f0c8' },
      { id: 'open',     label: 'Open', color: '#f7c8c8' },
      { id: 'halfOpen', label: 'Half-open', color: '#ffe9b3' },
    ],
    edges: [['closed', 'open', 'failures > threshold'], ['open', 'halfOpen', 'cool-down elapsed'], ['halfOpen', 'closed', 'success'], ['halfOpen', 'open', 'failed probe']],
    use: 'Calling any external service. Stops cascading failures and gives the upstream room to recover.',
    avoid: 'In-process calls that can\'t fail. Library: Hystrix (deprecated), resilience4j, polly, tower.',
  },
  saga: {
    label: 'Saga',
    sub: 'Distributed transaction via compensation',
    flow: 'Step 1 → Step 2 → Step 3 fails → compensate Step 2 → compensate Step 1',
    diagram: [
      { id: 's1', label: 'Step 1: reserve', color: '#c8f0c8' },
      { id: 's2', label: 'Step 2: charge', color: '#c8f0c8' },
      { id: 's3', label: 'Step 3: ship', color: '#f7c8c8' },
    ],
    edges: [['s1', 's2', 'ok'], ['s2', 's3', 'ok'], ['s3', 's2', 'fail → refund'], ['s2', 's1', 'release reservation']],
    use: 'Cross-service workflows (book travel: flight + hotel + car). 2PC doesn\'t scale; sagas trade atomicity for availability.',
    avoid: 'Single-DB transactions where ACID suffices. Sagas put complexity in app code that 2PC kept in the DB.',
  },
};

export function initModernArchWidget(root) {
  let active = 'mvc';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Five patterns the original book never saw</div>

      <div class="controls">
        <div class="pill-group">
          ${Object.entries(PATTERNS).map(([id, p], i) => `
            <input type="radio" name="ma-p" id="ma-${id}" value="${id}" ${i === 0 ? 'checked' : ''}>
            <label for="ma-${id}">${p.label}</label>
          `).join('')}
        </div>
      </div>

      <div class="widget-stage" id="ma-stage" style="min-height: 320px;"></div>
    </div>
  `;

  root.querySelectorAll('input[name=ma-p]').forEach((r) =>
    r.addEventListener('change', (e) => { active = e.target.value; render(); })
  );

  function render() {
    const p = PATTERNS[active];
    // simple node-link diagram
    const W = 600, H = 180;
    const positions = {};
    p.diagram.forEach((n, i) => {
      const x = 60 + i * ((W - 120) / Math.max(1, p.diagram.length - 1));
      positions[n.id] = { x, y: H / 2 };
    });
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<style>
      .ma-node { stroke: var(--ink); stroke-width: 2.5; }
      .ma-label { font-family: var(--font-display); font-size: 14px; letter-spacing: 1px; fill: var(--ink); }
      .ma-edge { stroke: var(--ink); stroke-width: 1.5; marker-end: url(#ma-arr); }
      .ma-edge-text { font-family: var(--font-mono); font-size: 9.5px; fill: var(--ink); }
      .ma-edge-bg { fill: var(--paper); stroke: var(--ink); stroke-width: 0.5; }
    </style>`;
    svg += `<defs><marker id="ma-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/></marker></defs>`;

    // edges
    p.edges.forEach((e, idx) => {
      const a = positions[e[0]];
      const b = positions[e[1]];
      if (!a || !b) return;
      // offset for back-edges
      const sameDir = positions[e[0]].x < positions[e[1]].x;
      const yOffset = sameDir ? -22 : 22;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2 + yOffset;
      svg += `<path class="ma-edge" d="M ${a.x} ${a.y} Q ${mx} ${my}, ${b.x} ${b.y}"/>`;
      const w = Math.max(60, e[2].length * 6);
      svg += `<rect class="ma-edge-bg" x="${mx - w/2}" y="${my - 7}" width="${w}" height="14" rx="2"/>`;
      svg += `<text class="ma-edge-text" x="${mx}" y="${my + 4}" text-anchor="middle">${escape(e[2])}</text>`;
    });

    // nodes
    p.diagram.forEach((n) => {
      const pos = positions[n.id];
      svg += `<rect class="ma-node" x="${pos.x - 50}" y="${pos.y - 22}" width="100" height="44" rx="6" fill="${n.color}"/>`;
      svg += `<text class="ma-label" x="${pos.x}" y="${pos.y + 5}" text-anchor="middle">${escape(n.label)}</text>`;
    });

    svg += `</svg>`;

    const html = `
      <div class="ma-header">
        <div class="ma-title">${escape(p.label)}</div>
        <div class="ma-sub">${escape(p.sub)}</div>
        <div class="ma-flow"><code>${escape(p.flow)}</code></div>
      </div>
      ${svg}
      <div class="ma-grid">
        <div class="ma-card">
          <div class="ma-card-label">USE WHEN</div>
          <div>${escape(p.use)}</div>
        </div>
        <div class="ma-card warn">
          <div class="ma-card-label">DON'T REACH FOR IT WHEN</div>
          <div>${escape(p.avoid)}</div>
        </div>
      </div>
      <style>
        .ma-header { margin-bottom: 0.5rem; }
        .ma-title { font-family: var(--font-display); font-size: 1.4rem; letter-spacing: 0.04em; }
        .ma-sub { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-soft); margin-bottom: 0.4em; }
        .ma-flow { font-family: var(--font-mono); font-size: 0.78rem; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: 2px; padding: 0.3em 0.5em; display: inline-block; }
        .ma-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.6rem; }
        .ma-card { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; font-size: 0.88rem; box-shadow: 3px 3px 0 #2a8a3e; }
        .ma-card.warn { box-shadow: 3px 3px 0 var(--accent); }
        .ma-card-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
        @media (max-width: 640px) { .ma-grid { grid-template-columns: 1fr; } }
      </style>
    `;
    root.querySelector('#ma-stage').innerHTML = html;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
