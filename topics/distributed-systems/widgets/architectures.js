// Architectures widget: pick a real-world distributed database, see
// its profile across the dimensions covered in earlier lessons.

const SYSTEMS = {
  cassandra: {
    label: 'Cassandra',
    sub: 'Wide-column, leaderless',
    cap: { x: 70, y: 30, label: 'AP — tunable' },
    profile: [
      { dim: 'Leader',         val: 'Leaderless',                 link: 'leader-election', positive: false },
      { dim: 'Consistency',    val: 'Tunable (one→quorum→all)',   link: 'consistency', positive: true },
      { dim: 'Membership',     val: 'Gossip',                     link: 'gossip', positive: true },
      { dim: 'Replication',    val: 'Quorum-based, asynchronous', link: 'consistency', positive: true },
      { dim: 'Conflict res.',  val: 'Last-writer-wins',           link: 'vector-clocks', positive: false },
      { dim: 'Use case',       val: 'High write throughput, time-series, IoT', link: null, positive: true },
    ],
    note: 'Cassandra prioritizes write availability and horizontal scale. Gossip handles membership across hundreds of nodes. CP via QUORUM if you tune it, AP by default.',
  },
  dynamodb: {
    label: 'DynamoDB',
    sub: 'Managed KV, leaderless',
    cap: { x: 75, y: 35, label: 'AP, with optional strong-read' },
    profile: [
      { dim: 'Leader',         val: 'Per-partition, hidden',      link: 'leader-election', positive: true },
      { dim: 'Consistency',    val: 'Eventual default; strong opt-in', link: 'consistency', positive: true },
      { dim: 'Membership',     val: 'AWS internal',               link: null, positive: true },
      { dim: 'Replication',    val: 'Quorum within AZ',           link: null, positive: true },
      { dim: 'Conflict res.',  val: 'Vector clocks (historically); now coordinated', link: 'vector-clocks', positive: true },
      { dim: 'Use case',       val: 'Web apps, gaming, ad serving', link: null, positive: true },
    ],
    note: 'Dynamo paper inspired Cassandra. The managed DynamoDB hides most of the complexity. Eventual is the default; strong reads cost 2× and double latency.',
  },
  spanner: {
    label: 'Spanner / CockroachDB',
    sub: 'Globally consistent SQL',
    cap: { x: 20, y: 35, label: 'CP — strong everywhere' },
    profile: [
      { dim: 'Leader',         val: 'Raft per range',             link: 'raft', positive: true },
      { dim: 'Consistency',    val: 'Strong (linearizable)',      link: 'consistency', positive: true },
      { dim: 'Membership',     val: 'Gossip',                     link: 'gossip', positive: true },
      { dim: 'Replication',    val: 'Raft groups across regions', link: 'raft', positive: true },
      { dim: 'Distributed txn', val: 'Two-phase commit + TrueTime', link: '2pc', positive: true },
      { dim: 'Use case',       val: 'Banking, billing, anywhere correctness > latency', link: null, positive: true },
    ],
    note: 'Spanner uses globally-synchronized clocks (TrueTime, ~7ms uncertainty) to bound transaction ordering. CockroachDB does similar without atomic clocks — Hybrid Logical Clocks instead.',
  },
  etcd: {
    label: 'etcd / Consul',
    sub: 'KV store for coordination',
    cap: { x: 15, y: 50, label: 'CP — for config + locks' },
    profile: [
      { dim: 'Leader',         val: 'Raft',                       link: 'raft', positive: true },
      { dim: 'Consistency',    val: 'Strong (linearizable reads optional)', link: 'consistency', positive: true },
      { dim: 'Membership',     val: 'Static (etcd) or gossip (Consul)', link: 'gossip', positive: true },
      { dim: 'Replication',    val: 'Raft log, full replicas',    link: 'raft', positive: true },
      { dim: 'Throughput',     val: 'Modest — designed for small, high-value data', link: null, positive: false },
      { dim: 'Use case',       val: 'Service discovery, config, leader locks, Kubernetes', link: null, positive: true },
    ],
    note: 'These are the "boring" but critical KV stores at the heart of every cloud platform. Kubernetes runs on etcd. They prove every day that Raft works in production.',
  },
};

export function initArchitecturesWidget(root) {
  let system = 'cassandra';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Real-world distributed databases</div>

      <div class="controls">
        <div class="pill-group">
          ${Object.entries(SYSTEMS).map(([id, s], i) => `
            <input type="radio" name="ar-sys" id="ar-${id}" value="${id}" ${i === 0 ? 'checked' : ''}>
            <label for="ar-${id}">${s.label.split(' /')[0]}</label>
          `).join('')}
        </div>
      </div>

      <div class="widget-stage" id="ar-stage" style="min-height: 380px;"></div>

      <div class="callout" id="ar-note"></div>
    </div>
  `;

  root.querySelectorAll('input[name=ar-sys]').forEach((r) =>
    r.addEventListener('change', (e) => { system = e.target.value; render(); })
  );

  function render() {
    const s = SYSTEMS[system];

    // CAP triangle: rough positioning C-A-P
    let svg = `<svg viewBox="0 0 220 160" width="220" height="160" style="float: right; margin-left: 1rem;">`;
    svg += `<style>
      .ar-tri { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 2; }
      .ar-tri-label { font-family: var(--font-display); font-size: 12px; letter-spacing: 1px; fill: var(--ink); }
      .ar-marker { fill: var(--accent); stroke: var(--ink); stroke-width: 2; }
      .ar-marker-label { font-family: var(--font-mono); font-size: 9px; fill: var(--ink); }
    </style>`;
    svg += `<polygon class="ar-tri" points="110,15 200,140 20,140"/>`;
    svg += `<text class="ar-tri-label" x="110" y="10" text-anchor="middle">CONSISTENCY</text>`;
    svg += `<text class="ar-tri-label" x="200" y="155" text-anchor="end">AVAILABILITY</text>`;
    svg += `<text class="ar-tri-label" x="20" y="155">PARTITION</text>`;
    const mx = 20 + (200 - 20) * (s.cap.x / 100);
    const my = 15 + (140 - 15) * (s.cap.y / 100);
    svg += `<circle class="ar-marker" cx="${mx}" cy="${my}" r="8"/>`;
    svg += `<text class="ar-marker-label" x="${mx + 14}" y="${my + 4}">${s.label.split(' /')[0]}</text>`;
    svg += `</svg>`;

    let html = `
      <div class="ar-header">
        <div>
          <div class="ar-title">${s.label}</div>
          <div class="ar-sub">${s.sub}</div>
          <div class="ar-cap">${s.cap.label}</div>
        </div>
      </div>
      ${svg}
      <div class="ar-grid">
        ${s.profile.map((p) => `
          <div class="ar-row">
            <div class="ar-dim">${p.dim}</div>
            <div class="ar-val">
              ${p.val}
              ${p.link ? `<a class="ar-link" href="${p.link}.html">→</a>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    html += `<style>
      .ar-header { float: left; margin-right: 1rem; }
      .ar-title { font-family: var(--font-display); font-size: 1.5rem; letter-spacing: 0.04em; }
      .ar-sub { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-soft); margin-bottom: 0.3em; }
      .ar-cap { font-family: var(--font-display); letter-spacing: 0.04em; padding: 0.2em 0.6em; display: inline-block; background: var(--accent-soft); border: 1.5px solid var(--ink); border-radius: var(--radius); font-size: 0.85rem; }
      .ar-grid { clear: both; padding-top: 0.6rem; display: grid; grid-template-columns: 1fr; gap: 0.3rem; }
      .ar-row { display: grid; grid-template-columns: 160px 1fr; gap: 0.5rem; align-items: baseline; padding: 0.35em 0.6em; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: var(--radius); }
      .ar-dim { font-family: var(--font-display); letter-spacing: 0.5px; font-size: 0.85rem; color: var(--ink-soft); }
      .ar-val { font-family: var(--font-mono); font-size: 0.85rem; }
      .ar-link { font-family: var(--font-display); padding: 0.05em 0.45em; background: var(--accent); color: white; border: 1.5px solid var(--ink); border-radius: 2px; text-decoration: none; font-size: 0.8rem; margin-left: 0.4em; }
      .ar-link:hover { color: white; transform: translate(-1px, -1px); }
    </style>`;
    root.querySelector('#ar-stage').innerHTML = html;
    root.querySelector('#ar-note').innerHTML = s.note;
  }

  render();
}
