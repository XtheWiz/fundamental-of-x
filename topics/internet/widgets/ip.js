// IP & Routing widget: a small network of routers between "you" and
// a destination. Send a packet, watch it hop with TTL decrementing.

const NODES = [
  { id: 'you',  label: 'You',           sub: '192.168.1.42',     x: 70,  y: 120, kind: 'you' },
  { id: 'gw',   label: 'Home Router',   sub: '192.168.1.1',      x: 200, y: 120, kind: 'router' },
  { id: 'isp1', label: 'ISP Edge',      sub: '203.0.113.1',      x: 320, y: 60,  kind: 'router' },
  { id: 'isp2', label: 'ISP Core',      sub: '198.51.100.5',     x: 320, y: 200, kind: 'router' },
  { id: 'bb1',  label: 'Backbone A',    sub: '209.0.50.10',      x: 470, y: 60,  kind: 'router' },
  { id: 'bb2',  label: 'Backbone B',    sub: '209.0.50.22',      x: 470, y: 200, kind: 'router' },
  { id: 'cdn',  label: 'CDN Edge',      sub: '151.101.1.5',      x: 600, y: 120, kind: 'router' },
  { id: 'srv',  label: 'Web Server',    sub: '185.199.108.153',  x: 720, y: 120, kind: 'server' },
];

const LINKS = [
  ['you', 'gw'],
  ['gw', 'isp1'],
  ['gw', 'isp2'],
  ['isp1', 'bb1'],
  ['isp2', 'bb2'],
  ['bb1', 'cdn'],
  ['bb2', 'cdn'],
  ['cdn', 'srv'],
];

// two preset paths so user can see route variation
const PATHS = {
  north: ['you', 'gw', 'isp1', 'bb1', 'cdn', 'srv'],
  south: ['you', 'gw', 'isp2', 'bb2', 'cdn', 'srv'],
};

export function initIpWidget(root) {
  let pathName = 'north';
  let initialTTL = 64;
  let pos = 0;     // index in path of current packet location
  let running = false;
  let log = [];

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Hop by Hop</div>
      <p class="widget-hint">Send a packet from "You" to the web server. Each router decrements TTL by 1.</p>

      <div class="controls">
        <label>Route:</label>
        <div class="pill-group">
          <input type="radio" name="ip-path" id="ip-n" value="north" checked>
          <label for="ip-n">North</label>
          <input type="radio" name="ip-path" id="ip-s" value="south">
          <label for="ip-s">South</label>
        </div>
        <label>Initial TTL:</label>
        <input type="number" id="ttl" value="64" min="1" max="255" class="field" style="width: 70px;">
        <button class="btn btn-accent" id="send">Send packet</button>
        <button class="btn btn-ghost" id="reset">Reset</button>
      </div>

      <div class="widget-stage" id="stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Hops</div><div class="value" id="m-hops">0</div></div>
        <div class="metric"><div class="label">TTL remaining</div><div class="value" id="m-ttl">—</div></div>
        <div class="metric accent"><div class="label">Status</div><div class="value" id="m-status">Idle</div></div>
      </div>

      <div class="log" id="log"></div>
    </div>
  `;

  const stage = root.querySelector('#stage');
  const logEl = root.querySelector('#log');

  root.querySelectorAll('input[name=ip-path]').forEach((r) =>
    r.addEventListener('change', (e) => { pathName = e.target.value; reset(); })
  );
  root.querySelector('#ttl').addEventListener('change', (e) => {
    initialTTL = Math.max(1, Math.min(255, Number(e.target.value) || 64));
    reset();
  });
  root.querySelector('#send').addEventListener('click', send);
  root.querySelector('#reset').addEventListener('click', reset);

  function reset() {
    pos = 0;
    log = [];
    running = false;
    render('Idle');
  }

  async function send() {
    if (running) return;
    running = true;
    pos = 0;
    log = [];
    const path = PATHS[pathName];
    let ttl = initialTTL;
    addLog('info', `Sending packet, TTL=${ttl}, src=${NODES.find(n=>n.id==='you').sub}, dst=${NODES.find(n=>n.id==='srv').sub}`);
    render('In flight');
    await wait(450);

    for (let i = 1; i < path.length; i++) {
      pos = i;
      const node = NODES.find((n) => n.id === path[i]);
      ttl -= 1;
      addLog(ttl <= 0 ? 'err' : 'ok', `Hop ${i} → ${node.label} (${node.sub}). TTL=${ttl}`);
      render(ttl <= 0 ? 'Dropped' : 'In flight');
      if (ttl <= 0) {
        running = false;
        return;
      }
      await wait(550);
    }
    addLog('ok', `Arrived at server. ${path.length - 1} hops, ${initialTTL - (path.length - 1)} TTL remaining.`);
    render('Delivered ✓');
    running = false;
  }

  function render(status) {
    const W = 800;
    const H = 280;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<style>
      .ip-link { stroke: var(--ink-soft); stroke-width: 1.8; }
      .ip-link.lit { stroke: var(--accent); stroke-width: 3; }
      .ip-node { stroke: var(--ink); stroke-width: 2.5; }
      .ip-node.you { fill: #cfe5ff; }
      .ip-node.server { fill: #c8f0c8; }
      .ip-node.router { fill: var(--paper); }
      .ip-node.lit { fill: var(--accent-soft); stroke: var(--accent); }
      .ip-label { font-family: var(--font-display); font-size: 12px; letter-spacing: 1px; fill: var(--ink); }
      .ip-sub { font-family: var(--font-mono); font-size: 9.5px; fill: var(--ink-soft); }
      .ip-packet { fill: var(--accent); stroke: var(--ink); stroke-width: 1.5; }
      .ip-packet-text { font-family: var(--font-mono); font-size: 9px; fill: white; font-weight: 600; }
    </style>`;

    const path = PATHS[pathName];
    const litLinks = new Set();
    for (let i = 0; i < pos; i++) {
      litLinks.add(`${path[i]}-${path[i+1]}`);
      litLinks.add(`${path[i+1]}-${path[i]}`);
    }
    const litNodes = new Set(path.slice(0, pos + 1));

    LINKS.forEach(([a, b]) => {
      const na = NODES.find((n) => n.id === a);
      const nb = NODES.find((n) => n.id === b);
      const onPath = litLinks.has(`${a}-${b}`);
      svg += `<line class="ip-link ${onPath ? 'lit' : ''}" x1="${na.x}" y1="${na.y}" x2="${nb.x}" y2="${nb.y}"/>`;
    });

    NODES.forEach((n) => {
      const lit = litNodes.has(n.id);
      svg += `<rect class="ip-node ${n.kind} ${lit ? 'lit' : ''}" x="${n.x - 55}" y="${n.y - 22}" width="110" height="44" rx="6"/>`;
      svg += `<text class="ip-label" x="${n.x}" y="${n.y - 3}" text-anchor="middle">${n.label}</text>`;
      svg += `<text class="ip-sub" x="${n.x}" y="${n.y + 12}" text-anchor="middle">${n.sub}</text>`;
    });

    // packet at current location
    if (pos < path.length) {
      const here = NODES.find((n) => n.id === path[pos]);
      svg += `<circle class="ip-packet" cx="${here.x + 70}" cy="${here.y - 30}" r="14"/>`;
      const ttlNow = initialTTL - pos;
      svg += `<text class="ip-packet-text" x="${here.x + 70}" y="${here.y - 27}" text-anchor="middle">TTL ${ttlNow}</text>`;
    }

    svg += `</svg>`;
    stage.innerHTML = svg;

    root.querySelector('#m-hops').textContent = pos;
    root.querySelector('#m-ttl').textContent = pos === 0 ? '—' : (initialTTL - pos);
    root.querySelector('#m-status').textContent = status;
  }

  function addLog(level, msg) {
    log.unshift({ level, msg, t: new Date().toLocaleTimeString() });
    logEl.innerHTML = log.slice(0, 50).map((e) =>
      `<div class="entry ${e.level}"><span class="t">${e.t}</span>${escape(e.msg)}</div>`
    ).join('');
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  reset();
}
