// HTTP widget: build a request and see it on the wire. The widget
// mocks a tiny REST API (/users) and chooses a sensible response
// based on the verb + body the user composes.

const VERBS = [
  { v: 'GET',    safe: true,  idempotent: true,  body: false, hint: 'Fetch a resource. No side effects. Safely cacheable.' },
  { v: 'POST',   safe: false, idempotent: false, body: true,  hint: 'Create a resource (or trigger an action). Not idempotent — sending twice creates two.' },
  { v: 'PUT',    safe: false, idempotent: true,  body: true,  hint: 'Replace a resource entirely. Idempotent — sending twice is identical to once.' },
  { v: 'PATCH',  safe: false, idempotent: false, body: true,  hint: 'Partially update a resource. Often not idempotent (e.g. +1 a counter).' },
  { v: 'DELETE', safe: false, idempotent: true,  body: false, hint: 'Remove a resource. Idempotent — second DELETE is a no-op (returns 404).' },
];

const PRESETS = [
  { verb: 'GET',    path: '/users/42',         body: '' },
  { verb: 'POST',   path: '/users',            body: '{ "name": "Aiko", "city": "Tokyo" }' },
  { verb: 'PUT',    path: '/users/42',         body: '{ "name": "Aiko", "city": "Osaka" }' },
  { verb: 'PATCH',  path: '/users/42',         body: '{ "city": "Osaka" }' },
  { verb: 'DELETE', path: '/users/42',         body: '' },
  { verb: 'GET',    path: '/users?city=Tokyo', body: '' },
];

export function initHttpWidget(root) {
  let verb = 'GET';
  let path = '/users/42';
  let body = '';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">HTTP Request Builder</div>

      <div class="controls">
        <label>Verb:</label>
        <select class="field" id="h-verb">
          ${VERBS.map((v) => `<option>${v.v}</option>`).join('')}
        </select>
        <label>Path:</label>
        <input class="field" id="h-path" value="/users/42" style="width: 220px;">
        <label>Preset:</label>
        <select class="field" id="h-preset">
          <option value="">— pick —</option>
          ${PRESETS.map((p, i) => `<option value="${i}">${p.verb} ${p.path}</option>`).join('')}
        </select>
      </div>

      <div class="controls">
        <label style="vertical-align: top;">Body:</label>
        <textarea class="field" id="h-body" rows="3" style="flex: 1; min-width: 260px; font-family: var(--font-mono); font-size: 0.85rem;" placeholder='{ "name": "Aiko" }'></textarea>
      </div>

      <div class="callout" id="h-hint"></div>

      <div class="http-grid">
        <div class="http-pane">
          <div class="http-pane-label">REQUEST (on the wire)</div>
          <pre id="h-req">—</pre>
        </div>
        <div class="http-pane">
          <div class="http-pane-label">RESPONSE</div>
          <pre id="h-res">—</pre>
        </div>
      </div>

      <style>
        .http-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-top: 0.8rem; }
        .http-pane { border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper); overflow: hidden; }
        .http-pane-label { background: var(--paper-deep); padding: 0.3em 0.7em; font-family: var(--font-display); letter-spacing: 0.04em; border-bottom: 1.5px solid var(--ink); font-size: 0.85rem; }
        .http-pane pre { margin: 0; padding: 0.7em 0.9em; font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.55; background: var(--paper); border: none; white-space: pre-wrap; word-break: break-word; }
        @media (max-width: 720px) { .http-grid { grid-template-columns: 1fr; } }
        .http-hl-verb { font-weight: 700; }
        .http-hl-200 { color: #2a8a3e; }
        .http-hl-3xx { color: #1c6dd0; }
        .http-hl-4xx { color: #b07b1a; }
        .http-hl-5xx { color: var(--accent); }
      </style>
    </div>
  `;

  const verbEl = root.querySelector('#h-verb');
  const pathEl = root.querySelector('#h-path');
  const bodyEl = root.querySelector('#h-body');
  const presetEl = root.querySelector('#h-preset');

  verbEl.addEventListener('change', (e) => { verb = e.target.value; render(); });
  pathEl.addEventListener('input', (e) => { path = e.target.value; render(); });
  bodyEl.addEventListener('input', (e) => { body = e.target.value; render(); });
  presetEl.addEventListener('change', (e) => {
    const p = PRESETS[Number(e.target.value)];
    if (!p) return;
    verb = p.verb; path = p.path; body = p.body;
    verbEl.value = verb; pathEl.value = path; bodyEl.value = body;
    render();
  });

  function render() {
    const verbDef = VERBS.find((v) => v.v === verb);
    root.querySelector('#h-hint').innerHTML = `<strong>${verb}</strong> — ${verbDef.hint} <span style="color: var(--ink-soft);">safe=${verbDef.safe} · idempotent=${verbDef.idempotent}</span>`;

    // Build the wire-format request
    const hasBody = body.trim().length > 0 && verbDef.body;
    const reqHeaders = [
      `Host: api.fundamentalofx.com`,
      `User-Agent: Mozilla/5.0`,
      `Accept: application/json`,
    ];
    if (hasBody) {
      reqHeaders.push(`Content-Type: application/json`);
      reqHeaders.push(`Content-Length: ${body.trim().length}`);
    }
    const reqLines = [
      `${verb} ${path} HTTP/1.1`,
      ...reqHeaders,
      '',
      hasBody ? body.trim() : '',
    ];
    root.querySelector('#h-req').textContent = reqLines.join('\n');

    // Pick a sensible response
    const res = pickResponse(verb, path, body);
    root.querySelector('#h-res').innerHTML = renderResponse(res);
  }

  function pickResponse(verb, path, body) {
    // /users/42 lookup
    const idMatch = path.match(/^\/users\/(\d+)$/);
    const collMatch = path.match(/^\/users(\?.*)?$/);
    if (verb === 'GET') {
      if (idMatch) {
        if (idMatch[1] === '42') {
          return { code: 200, reason: 'OK', headers: { 'Content-Type': 'application/json' }, body: `{"id":42,"name":"Aiko","city":"Tokyo"}` };
        }
        return { code: 404, reason: 'Not Found', headers: { 'Content-Type': 'application/json' }, body: `{"error":"user not found"}` };
      }
      if (collMatch) return { code: 200, reason: 'OK', headers: { 'Content-Type': 'application/json' }, body: `[{"id":42,"name":"Aiko"},{"id":43,"name":"Kenji"}]` };
    }
    if (verb === 'POST') {
      if (path === '/users') {
        if (!body.trim()) return { code: 400, reason: 'Bad Request', headers: { 'Content-Type': 'application/json' }, body: `{"error":"body required"}` };
        try { JSON.parse(body); } catch { return { code: 400, reason: 'Bad Request', headers: {}, body: `{"error":"invalid JSON"}` }; }
        return { code: 201, reason: 'Created', headers: { 'Content-Type': 'application/json', Location: '/users/99' }, body: `{"id":99,"name":"…"}` };
      }
    }
    if (verb === 'PUT' || verb === 'PATCH') {
      if (idMatch && idMatch[1] === '42') {
        try { JSON.parse(body); } catch { return { code: 400, reason: 'Bad Request', headers: {}, body: `{"error":"invalid JSON"}` }; }
        return { code: 200, reason: 'OK', headers: { 'Content-Type': 'application/json' }, body: `{"id":42,"name":"Aiko","city":"Osaka"}` };
      }
    }
    if (verb === 'DELETE') {
      if (idMatch && idMatch[1] === '42') return { code: 204, reason: 'No Content', headers: {}, body: '' };
      return { code: 404, reason: 'Not Found', headers: { 'Content-Type': 'application/json' }, body: `{"error":"user not found"}` };
    }
    return { code: 405, reason: 'Method Not Allowed', headers: { Allow: 'GET, POST' }, body: '' };
  }

  function renderResponse(res) {
    const cls = res.code >= 500 ? '5xx' : res.code >= 400 ? '4xx' : res.code >= 300 ? '3xx' : '200';
    const lines = [
      `<span class="http-hl-${cls}">HTTP/1.1 ${res.code} ${escape(res.reason)}</span>`,
      ...Object.entries(res.headers).map(([k, v]) => `${escape(k)}: ${escape(v)}`),
      '',
      escape(res.body),
    ];
    return lines.join('\n');
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  render();
}
