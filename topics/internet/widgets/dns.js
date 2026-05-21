// DNS widget: shows recursive resolution of a chosen domain.
// Hops: browser → recursive resolver → root → TLD → authoritative.
// Cache toggle shortcuts the walk.

const DOMAINS = [
  { domain: 'github.com',           tld: 'com',  auth: 'ns1.github.net',          ip: '140.82.114.4'    },
  { domain: 'fundamentalofx.com',   tld: 'com',  auth: 'ns.cloudflare.com',       ip: '185.199.108.153' },
  { domain: 'wikipedia.org',        tld: 'org',  auth: 'ns0.wikimedia.org',       ip: '198.35.26.96'    },
  { domain: 'mail.google.com',      tld: 'com',  auth: 'ns1.google.com',          ip: '142.250.80.5'    },
];

const HOPS = [
  { id: 'browser',   label: 'Your Browser',         sub: 'wants github.com' },
  { id: 'resolver',  label: 'Recursive Resolver',   sub: '1.1.1.1 / 8.8.8.8' },
  { id: 'root',      label: 'Root Nameserver',      sub: '13 servers worldwide' },
  { id: 'tld',       label: 'TLD Nameserver',       sub: 'handles .com' },
  { id: 'auth',      label: 'Authoritative NS',     sub: 'owns the domain' },
];

export function initDnsWidget(root) {
  let domainIdx = 0;
  let cache = 'cold';   // 'cold' | 'warm-resolver' | 'warm-all'
  let step = 0;
  let log = [];

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Resolve a Domain</div>
      <p class="widget-hint">Pick a domain and a cache state, then step through the walk.</p>

      <div class="controls">
        <label>Domain:</label>
        <select class="field" id="dns-domain">
          ${DOMAINS.map((d, i) => `<option value="${i}">${d.domain}</option>`).join('')}
        </select>

        <label>Cache:</label>
        <div class="pill-group">
          <input type="radio" name="dns-cache" id="dns-cold" value="cold" checked>
          <label for="dns-cold">Cold</label>
          <input type="radio" name="dns-cache" id="dns-warm-r" value="warm-resolver">
          <label for="dns-warm-r">Resolver hot</label>
          <input type="radio" name="dns-cache" id="dns-warm-a" value="warm-all">
          <label for="dns-warm-a">Browser hot</label>
        </div>

        <button class="btn btn-accent" id="dns-step">Next →</button>
        <button class="btn btn-ghost" id="dns-reset">Reset</button>
      </div>

      <div class="widget-stage" id="dns-stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Steps</div><div class="value" id="dns-steps">0</div></div>
        <div class="metric"><div class="label">Round trips</div><div class="value" id="dns-rtt">0</div></div>
        <div class="metric accent"><div class="label">Total time</div><div class="value" id="dns-time">—</div></div>
      </div>

      <div class="log" id="dns-log"></div>
    </div>
  `;

  const stage = root.querySelector('#dns-stage');
  const logEl = root.querySelector('#dns-log');
  const mSteps = root.querySelector('#dns-steps');
  const mRtt = root.querySelector('#dns-rtt');
  const mTime = root.querySelector('#dns-time');

  root.querySelector('#dns-domain').addEventListener('change', (e) => { domainIdx = Number(e.target.value); reset(); });
  root.querySelectorAll('input[name=dns-cache]').forEach((r) =>
    r.addEventListener('change', (e) => { cache = e.target.value; reset(); })
  );
  root.querySelector('#dns-step').addEventListener('click', nextStep);
  root.querySelector('#dns-reset').addEventListener('click', reset);

  function reset() {
    step = 0;
    log = [];
    render();
  }

  function plan() {
    const d = DOMAINS[domainIdx];
    if (cache === 'warm-all') {
      return [
        { from: 'browser', to: 'browser', kind: 'cache-hit', text: `Browser cache hit → ${d.ip}`, ms: 0 },
      ];
    }
    if (cache === 'warm-resolver') {
      return [
        { from: 'browser', to: 'resolver', kind: 'query', text: `Query: A ${d.domain}?`, ms: 2 },
        { from: 'resolver', to: 'browser', kind: 'answer', text: `Resolver cache hit → ${d.ip}`, ms: 2 },
      ];
    }
    // cold: full walk
    return [
      { from: 'browser',  to: 'resolver', kind: 'query',  text: `Query: A ${d.domain}?`, ms: 1 },
      { from: 'resolver', to: 'root',     kind: 'query',  text: `Who owns .${d.tld}?`, ms: 25 },
      { from: 'root',     to: 'resolver', kind: 'answer', text: `Ask TLD nameserver (e.g. a.gtld-servers.net)`, ms: 25 },
      { from: 'resolver', to: 'tld',      kind: 'query',  text: `Who owns ${d.domain}?`, ms: 18 },
      { from: 'tld',      to: 'resolver', kind: 'answer', text: `Ask ${d.auth}`, ms: 18 },
      { from: 'resolver', to: 'auth',     kind: 'query',  text: `A record for ${d.domain}?`, ms: 35 },
      { from: 'auth',     to: 'resolver', kind: 'answer', text: `${d.ip}`, ms: 35 },
      { from: 'resolver', to: 'browser',  kind: 'answer', text: `Cached + delivered → ${d.ip}`, ms: 1 },
    ];
  }

  function nextStep() {
    const events = plan();
    if (step >= events.length) return;
    const e = events[step];
    step++;
    log.push(e);
    render();
  }

  function render() {
    const events = plan();
    const W = 760;
    const H = 280;
    const positions = {
      browser:  { x: 80,  y: 220 },
      resolver: { x: 80,  y: 70 },
      root:     { x: 280, y: 40 },
      tld:      { x: 480, y: 40 },
      auth:     { x: 680, y: 40 },
    };

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<style>
      .dns-node { stroke: var(--ink); stroke-width: 2.5; }
      .dns-node.browser { fill: #cfe5ff; }
      .dns-node.resolver { fill: #ffe9b3; }
      .dns-node.root { fill: var(--paper); }
      .dns-node.tld { fill: var(--paper); }
      .dns-node.auth { fill: #c8f0c8; }
      .dns-node.lit { stroke: var(--accent); stroke-width: 3.5; }
      .dns-label { font-family: var(--font-display); font-size: 13px; letter-spacing: 1px; fill: var(--ink); }
      .dns-sublabel { font-family: var(--font-mono); font-size: 9.5px; fill: var(--ink-soft); }
      .dns-arrow { stroke: var(--accent); stroke-width: 2.5; fill: none; marker-end: url(#dns-arrowhead); }
      .dns-arrow.answer { stroke: #2a8a3e; stroke-dasharray: 4 3; }
      .dns-arrow-text { font-family: var(--font-mono); font-size: 10px; fill: var(--ink); }
      .dns-arrow-bg { fill: var(--paper); }
    </style>`;
    svg += `<defs>
      <marker id="dns-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <polygon points="0 0, 8 4, 0 8" fill="var(--accent)"/>
      </marker>
      <marker id="dns-arrowhead-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <polygon points="0 0, 8 4, 0 8" fill="#2a8a3e"/>
      </marker>
    </defs>`;

    // Determine which hops are "active" in the rendering
    const lit = new Set();
    log.forEach((e) => { lit.add(e.from); lit.add(e.to); });

    // Draw nodes
    HOPS.forEach((h) => {
      const p = positions[h.id];
      const isLit = lit.has(h.id);
      svg += `<rect class="dns-node ${h.id} ${isLit ? 'lit' : ''}" x="${p.x - 70}" y="${p.y - 22}" width="140" height="44" rx="6"/>`;
      svg += `<text class="dns-label" x="${p.x}" y="${p.y - 3}" text-anchor="middle">${h.label}</text>`;
      svg += `<text class="dns-sublabel" x="${p.x}" y="${p.y + 12}" text-anchor="middle">${h.sub}</text>`;
    });

    // Draw most recent arrow
    if (log.length) {
      const last = log[log.length - 1];
      if (last.from !== last.to) {
        const a = positions[last.from];
        const b = positions[last.to];
        const cls = last.kind === 'answer' ? 'dns-arrow answer' : 'dns-arrow';
        const marker = last.kind === 'answer' ? 'url(#dns-arrowhead-green)' : 'url(#dns-arrowhead)';
        // simple curved path
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2 - 30 * (last.kind === 'answer' ? -1 : 1);
        svg += `<path class="${cls}" d="M ${a.x} ${a.y} Q ${mx} ${my}, ${b.x} ${b.y}" marker-end="${marker}"/>`;
        const w = Math.max(60, last.text.length * 6.2);
        svg += `<rect class="dns-arrow-bg" x="${mx - w/2}" y="${my - 8}" width="${w}" height="16" rx="2" stroke="var(--ink)" stroke-width="1"/>`;
        svg += `<text class="dns-arrow-text" x="${mx}" y="${my + 4}" text-anchor="middle">${escape(last.text)}</text>`;
      } else if (last.kind === 'cache-hit') {
        svg += `<text x="${positions.browser.x}" y="${positions.browser.y - 40}" text-anchor="middle" class="dns-arrow-text" style="font-size:12px; fill: #2a8a3e;">✓ ${escape(last.text)}</text>`;
      }
    }

    svg += `</svg>`;
    stage.innerHTML = svg;

    // Update metrics
    mSteps.textContent = step;
    const rts = log.filter((e) => e.kind !== 'cache-hit').length;
    mRtt.textContent = Math.ceil(rts / 2);
    const totalMs = log.reduce((acc, e) => acc + (e.ms || 0), 0);
    mTime.textContent = step === plan().length ? `${totalMs}ms` : '—';

    // Update log
    logEl.innerHTML = log.map((e, i) => {
      const lvl = e.kind === 'answer' ? 'ok' : e.kind === 'cache-hit' ? 'ok' : 'info';
      return `<div class="entry ${lvl}"><span class="t">${String(i + 1).padStart(2,'0')}</span>${escape(e.text)} <span style="color: var(--ink-faint);">[${e.ms}ms]</span></div>`;
    }).reverse().join('');
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  reset();
}
