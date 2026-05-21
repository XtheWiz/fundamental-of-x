// Caching widget: 4 layers (browser, CDN, reverse proxy, app cache)
// each with its own TTL. User makes requests, invalidates layers,
// and skips time forward to see TTLs expire.

const LAYERS = [
  { id: 'browser', label: 'Browser',       ttl: 60,  latency: 0,   color: '#cfe5ff' },
  { id: 'cdn',     label: 'CDN',           ttl: 300, latency: 20,  color: '#ffe9b3' },
  { id: 'proxy',   label: 'Reverse Proxy', ttl: 120, latency: 5,   color: '#f7c8c8' },
  { id: 'app',     label: 'App Cache',     ttl: 30,  latency: 2,   color: '#e6d6ff' },
  { id: 'origin',  label: 'Origin (DB)',   ttl: 0,   latency: 150, color: '#cccccc' },
];

export function initCachingWidget(root) {
  const state = {
    now: 0,
    caches: {},          // layerId → { storedAt }  null = empty
    lastTrace: null,     // array of { layer, hit, latency }
    requests: 0,
    hits: 0,
  };
  LAYERS.forEach((l) => state.caches[l.id] = null);

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Multi-tier Cache</div>
      <p class="widget-hint">A request travels left-to-right until something has the page cached. On the way back, every layer that missed stores a copy.</p>

      <div class="controls">
        <button class="btn btn-accent" id="c-req">Request /home</button>
        <button class="btn" id="c-wait">+30s</button>
        <button class="btn" id="c-clear">Invalidate all</button>
        <button class="btn btn-ghost" id="c-reset">Reset</button>
      </div>

      <div class="widget-stage" id="c-stage" style="min-height: 220px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Requests</div><div class="value" id="m-req">0</div></div>
        <div class="metric"><div class="label">Hit rate</div><div class="value" id="m-hr">—</div></div>
        <div class="metric accent"><div class="label">Last latency</div><div class="value" id="m-lat">—</div></div>
        <div class="metric"><div class="label">Sim. time</div><div class="value" id="m-t">0s</div></div>
      </div>

      <div class="callout" id="c-explain">Send a request to see the cascade. Repeat it and watch the same request stay fast for as long as the caches are still warm.</div>
    </div>
  `;

  const stage = root.querySelector('#c-stage');
  root.querySelector('#c-req').addEventListener('click', request);
  root.querySelector('#c-wait').addEventListener('click', () => { state.now += 30; render(); });
  root.querySelector('#c-clear').addEventListener('click', () => {
    LAYERS.forEach((l) => state.caches[l.id] = null);
    state.lastTrace = null;
    render();
  });
  root.querySelector('#c-reset').addEventListener('click', () => {
    state.now = 0; state.requests = 0; state.hits = 0; state.lastTrace = null;
    LAYERS.forEach((l) => state.caches[l.id] = null);
    render();
  });

  function request() {
    state.requests += 1;
    const trace = [];
    let cumLatency = 0;
    let resolvedAt = -1;
    // pass forward through layers, looking for a hit
    for (let i = 0; i < LAYERS.length; i++) {
      const L = LAYERS[i];
      cumLatency += L.latency;
      const stored = state.caches[L.id];
      const fresh = stored !== null && (state.now - stored.storedAt) < L.ttl;
      if (i === LAYERS.length - 1) {
        // origin always serves
        trace.push({ layer: L.id, hit: false, latency: L.latency, action: 'fetched from DB' });
        resolvedAt = i;
        break;
      }
      if (fresh) {
        trace.push({ layer: L.id, hit: true, latency: L.latency, action: `cache HIT (${L.ttl - (state.now - stored.storedAt)}s left)` });
        resolvedAt = i;
        state.hits += 1;
        break;
      }
      trace.push({ layer: L.id, hit: false, latency: L.latency, action: 'cache MISS' });
    }
    // on the way back, populate all layers that missed
    for (let i = 0; i < resolvedAt; i++) {
      state.caches[LAYERS[i].id] = { storedAt: state.now };
    }
    state.lastTrace = trace;
    render();
  }

  function render() {
    // layers visual
    let html = `<div class="cc-layers">`;
    LAYERS.forEach((L, i) => {
      const stored = state.caches[L.id];
      const isFresh = stored !== null && (state.now - stored.storedAt) < L.ttl;
      const remaining = stored ? Math.max(0, L.ttl - (state.now - stored.storedAt)) : 0;
      const lit = state.lastTrace?.find((t) => t.layer === L.id);
      let badge = '';
      if (L.id === 'origin') badge = `<span class="cc-tag origin">always available</span>`;
      else if (isFresh) badge = `<span class="cc-tag warm">stored, ${remaining}s left</span>`;
      else badge = `<span class="cc-tag cold">empty</span>`;
      const litCls = lit ? (lit.hit ? 'hit' : 'miss') : '';
      html += `
        <div class="cc-layer ${litCls}" style="background: ${L.color}">
          <div class="cc-layer-label">${L.label}</div>
          ${badge}
          <div class="cc-layer-meta">${L.latency}ms latency · TTL ${L.ttl || '∞'}s</div>
          ${lit ? `<div class="cc-layer-result">${escape(lit.action)}</div>` : ''}
        </div>
      `;
      if (i < LAYERS.length - 1) {
        const onPath = lit && lit.hit === false;
        html += `<div class="cc-arrow ${onPath ? 'lit' : ''}">→</div>`;
      }
    });
    html += `</div>`;
    html += `<style>
      .cc-layers { display: flex; flex-wrap: nowrap; gap: 0.3rem; overflow-x: auto; padding: 0.4rem 0; }
      .cc-layer { flex: 1 1 130px; min-width: 130px; border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.6rem; box-shadow: 3px 3px 0 var(--ink); }
      .cc-layer.hit { box-shadow: 4px 4px 0 #2a8a3e; transform: translateY(-2px); }
      .cc-layer.miss { box-shadow: 4px 4px 0 var(--accent); opacity: 0.85; }
      .cc-layer-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 1.1rem; }
      .cc-tag { display: inline-block; font-family: var(--font-mono); font-size: 0.7rem; padding: 0.1em 0.4em; border: 1.5px solid var(--ink); border-radius: 2px; margin-top: 0.2em; }
      .cc-tag.warm { background: #d6f5d6; }
      .cc-tag.cold { background: var(--paper); color: var(--ink-soft); }
      .cc-tag.origin { background: var(--paper); }
      .cc-layer-meta { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); margin-top: 0.2em; }
      .cc-layer-result { font-family: var(--font-mono); font-size: 0.75rem; margin-top: 0.4em; padding-top: 0.3em; border-top: 1px dashed var(--ink-faint); }
      .cc-arrow { align-self: center; font-family: var(--font-display); font-size: 1.3rem; color: var(--ink-faint); padding: 0 0.2rem; }
      .cc-arrow.lit { color: var(--accent); }
    </style>`;
    stage.innerHTML = html;

    root.querySelector('#m-req').textContent = state.requests;
    root.querySelector('#m-hr').textContent = state.requests === 0 ? '—' : `${Math.round(state.hits / state.requests * 100)}%`;
    if (state.lastTrace) {
      const lat = state.lastTrace.reduce((acc, t) => acc + t.latency, 0);
      root.querySelector('#m-lat').textContent = `${lat}ms`;
    } else {
      root.querySelector('#m-lat').textContent = '—';
    }
    root.querySelector('#m-t').textContent = `${state.now}s`;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
