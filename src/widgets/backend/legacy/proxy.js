// Reverse proxy widget: client sends a request to nginx, proxy
// applies rules (TLS termination, path routing, header rewriting),
// forwards to one of three backends.

const ROUTES = [
  { match: /^\/api\//,    backend: 'api',     desc: 'starts with /api/' },
  { match: /^\/static\//, backend: 'static',  desc: 'starts with /static/' },
  { match: /.*/,          backend: 'web',     desc: 'fallback' },
];

const BACKENDS = {
  api:    { label: 'API server',    addr: '10.0.0.11:8080', color: '#cfe5ff' },
  static: { label: 'Static server', addr: '10.0.0.12:8080', color: '#c8f0c8' },
  web:    { label: 'Web server',    addr: '10.0.0.13:8080', color: '#ffe9b3' },
};

const PRESETS = [
  'https://fundamentalofx.com/api/users/42',
  'https://fundamentalofx.com/static/logo.png',
  'https://fundamentalofx.com/',
  'https://fundamentalofx.com/topics/database/',
];

export function initProxyWidget(root) {
  let url = PRESETS[0];

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">nginx in slow motion</div>

      <div class="controls">
        <label>Request URL:</label>
        <input class="field" id="p-url" value="${url}" style="flex: 1; min-width: 280px;">
        <select class="field" id="p-preset" style="min-width: 220px;">
          <option value="">— preset —</option>
          ${PRESETS.map((u, i) => `<option value="${i}">${u.replace('https://fundamentalofx.com', '')}</option>`).join('')}
        </select>
        <button class="btn btn-accent" id="p-go">Send →</button>
      </div>

      <div class="widget-stage" id="p-stage" style="min-height: 280px;"></div>

      <div class="log" id="p-log"></div>
    </div>
  `;

  const stage = root.querySelector('#p-stage');
  const logEl = root.querySelector('#p-log');
  root.querySelector('#p-url').addEventListener('input', (e) => { url = e.target.value; });
  root.querySelector('#p-preset').addEventListener('change', (e) => {
    const i = e.target.value;
    if (i !== '') {
      url = PRESETS[Number(i)];
      root.querySelector('#p-url').value = url;
    }
  });
  root.querySelector('#p-go').addEventListener('click', send);

  async function send() {
    logEl.innerHTML = '';
    let path;
    let isHttps = url.startsWith('https://');
    try {
      path = new URL(url).pathname + (new URL(url).search || '');
    } catch {
      addLog('err', 'Invalid URL');
      return;
    }

    addLog('info', `→ Proxy receives: ${isHttps ? 'HTTPS' : 'HTTP'} ${path}  (from client 203.0.113.42)`);
    await wait(400);

    if (isHttps) {
      addLog('ok', `Proxy: TLS terminated (certificate for fundamentalofx.com)`);
      await wait(400);
    } else {
      addLog('warn', `Proxy: HTTP — would normally 301 redirect to HTTPS`);
      await wait(400);
    }

    const route = ROUTES.find((r) => r.match.test(path));
    addLog('info', `Proxy: route matched — "${route.desc}" → ${route.backend} backend`);
    await wait(400);

    const headerLines = [
      `X-Forwarded-For: 203.0.113.42`,
      `X-Real-IP: 203.0.113.42`,
      `X-Forwarded-Proto: ${isHttps ? 'https' : 'http'}`,
      `X-Forwarded-Host: fundamentalofx.com`,
    ];
    addLog('info', `Proxy: added headers — ${headerLines.length} entries`);
    await wait(300);

    const backend = BACKENDS[route.backend];
    addLog('ok', `Proxy → ${backend.label} (${backend.addr}) over plaintext HTTP`);
    await wait(500);
    addLog('ok', `${backend.label} ← responded 200 OK`);
    await wait(300);
    addLog('ok', `Proxy → client: re-encrypted with TLS, 200 OK`);
    render(route, isHttps, headerLines, backend, path);
  }

  function render(route, isHttps, headers, backend, path) {
    let svg = `<svg viewBox="0 0 800 280" width="100%" style="max-width: 800px;">`;
    svg += `<style>
      .pr-node { stroke: var(--ink); stroke-width: 2.5; }
      .pr-label { font-family: var(--font-display); font-size: 14px; letter-spacing: 1px; fill: var(--ink); }
      .pr-sub { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .pr-link { stroke: var(--ink); stroke-width: 2; marker-end: url(#pr-arrow); }
      .pr-text { font-family: var(--font-mono); font-size: 10px; fill: var(--ink); }
    </style>`;
    svg += `<defs>
      <marker id="pr-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/>
      </marker>
    </defs>`;

    // client
    svg += `<rect class="pr-node" x="20" y="120" width="120" height="50" rx="6" fill="#cfe5ff"/>`;
    svg += `<text class="pr-label" x="80" y="142" text-anchor="middle">CLIENT</text>`;
    svg += `<text class="pr-sub" x="80" y="158" text-anchor="middle">203.0.113.42</text>`;
    // proxy
    svg += `<rect class="pr-node" x="290" y="100" width="180" height="90" rx="6" fill="#f7c8c8"/>`;
    svg += `<text class="pr-label" x="380" y="125" text-anchor="middle">REVERSE PROXY</text>`;
    svg += `<text class="pr-sub" x="380" y="143" text-anchor="middle">nginx · public IP</text>`;
    svg += `<text class="pr-sub" x="380" y="160" text-anchor="middle">TLS terminated</text>`;
    svg += `<text class="pr-sub" x="380" y="176" text-anchor="middle">route: ${escape(route.desc)}</text>`;

    // three backends
    const backs = ['api', 'static', 'web'];
    backs.forEach((id, i) => {
      const b = BACKENDS[id];
      const y = 30 + i * 80;
      const isActive = id === route.backend;
      svg += `<rect class="pr-node" x="620" y="${y}" width="160" height="50" rx="6" fill="${b.color}" stroke="${isActive ? 'var(--accent)' : 'var(--ink)'}" stroke-width="${isActive ? 3 : 2}"/>`;
      svg += `<text class="pr-label" x="700" y="${y + 22}" text-anchor="middle">${b.label}</text>`;
      svg += `<text class="pr-sub" x="700" y="${y + 38}" text-anchor="middle">${b.addr}</text>`;
    });

    // arrows
    svg += `<line class="pr-link" x1="140" y1="145" x2="288" y2="145"/>`;
    svg += `<text class="pr-text" x="214" y="138" text-anchor="middle">${escape(isHttps ? 'HTTPS' : 'HTTP')} ${escape(path)}</text>`;

    const backIdx = backs.indexOf(route.backend);
    const bY = 30 + backIdx * 80 + 25;
    svg += `<line class="pr-link" x1="470" y1="145" x2="618" y2="${bY}"/>`;
    svg += `<text class="pr-text" x="540" y="${(145 + bY) / 2 - 5}" text-anchor="middle">HTTP ${escape(path)}</text>`;

    svg += `</svg>`;
    stage.innerHTML = svg;
  }

  function addLog(level, msg) {
    const d = document.createElement('div');
    d.className = `entry ${level}`;
    d.innerHTML = `<span class="t">${new Date().toLocaleTimeString()}</span>${escape(msg)}`;
    logEl.prepend(d);
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // initial render
  stage.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--ink-faint);">Click "Send →" to route a request.</div>`;
}
