// Lifecycle widget: animated journey of a request through 6 layers
// (browser, CDN, LB, proxy, app, cache, DB). Each layer has its own
// latency + cache toggle. End state: a waterfall + total time.

const LAYERS = [
  { id: 'browser', label: 'Browser',       latency: 0,   cacheable: true,  hitDefault: false },
  { id: 'cdn',     label: 'CDN',           latency: 25,  cacheable: true,  hitDefault: false },
  { id: 'lb',      label: 'Load Balancer', latency: 5,   cacheable: false, hitDefault: false },
  { id: 'proxy',   label: 'Reverse Proxy', latency: 3,   cacheable: true,  hitDefault: false },
  { id: 'app',     label: 'App Server',    latency: 30,  cacheable: false, hitDefault: false },
  { id: 'cache',   label: 'App Cache',     latency: 5,   cacheable: true,  hitDefault: false },
  { id: 'db',      label: 'Database',      latency: 50,  cacheable: false, hitDefault: false },
];

export function initLifecycleWidget(root) {
  const state = {
    cacheHits: { browser: false, cdn: false, proxy: false, cache: false },
    trace: null, // array of {layer, latency} once a run completes
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">A Request, End to End</div>
      <p class="widget-hint">Toggle which caching layers hit. Send the request. See the waterfall.</p>

      <div class="controls">
        <label>Hit cache at:</label>
        ${LAYERS.filter((l) => l.cacheable).map((l) => `
          <label style="display:inline-flex; gap: 0.3em; align-items: center;">
            <input type="checkbox" data-layer="${l.id}"> ${l.label}
          </label>
        `).join('')}
        <button class="btn btn-accent" id="lf-run">Send request</button>
        <button class="btn btn-ghost" id="lf-reset">Reset</button>
      </div>

      <div class="widget-stage" id="lf-stage" style="min-height: 380px;"></div>

      <div class="callout" id="lf-explain">Send a request to see the journey. Toggle "Hit cache at" boxes to short-circuit at any tier.</div>
    </div>
  `;

  const stage = root.querySelector('#lf-stage');
  root.querySelectorAll('input[data-layer]').forEach((cb) =>
    cb.addEventListener('change', (e) => {
      state.cacheHits[e.target.dataset.layer] = e.target.checked;
    })
  );
  root.querySelector('#lf-run').addEventListener('click', run);
  root.querySelector('#lf-reset').addEventListener('click', () => {
    state.trace = null;
    Object.keys(state.cacheHits).forEach((k) => state.cacheHits[k] = false);
    root.querySelectorAll('input[data-layer]').forEach((cb) => cb.checked = false);
    render();
  });

  async function run() {
    state.trace = [];
    // forward pass
    let resolved = -1;
    for (let i = 0; i < LAYERS.length; i++) {
      const L = LAYERS[i];
      state.trace.push({ layer: L.id, latency: L.latency, action: 'arrived', hit: false });
      render();
      await wait(220);

      if (L.cacheable && state.cacheHits[L.id] && L.id !== 'cache') {
        // cache hit at this layer — short-circuit
        const last = state.trace[state.trace.length - 1];
        last.action = 'cache HIT — serving response';
        last.hit = true;
        resolved = i;
        break;
      }
      if (L.cacheable && state.cacheHits[L.id] && L.id === 'cache') {
        const last = state.trace[state.trace.length - 1];
        last.action = 'cache HIT — return to app';
        last.hit = true;
        resolved = i;
        break;
      }
      if (i === LAYERS.length - 1) {
        // hit DB
        const last = state.trace[state.trace.length - 1];
        last.action = 'queried database';
        resolved = i;
      }
    }
    // return pass: walk back up
    for (let j = resolved - 1; j >= 0; j--) {
      const L = LAYERS[j];
      state.trace.push({ layer: L.id, latency: L.latency, action: 'forwarding response', hit: false, returning: true });
      render();
      await wait(180);
    }
    explain();
  }

  function explain() {
    const totalLatency = state.trace.reduce((acc, t) => acc + t.latency, 0);
    const hitLayer = state.trace.find((t) => t.hit);
    const hitLayerLabel = hitLayer ? LAYERS.find((L) => L.id === hitLayer.layer).label : 'database';
    root.querySelector('#lf-explain').innerHTML = `Total request time: <strong>${totalLatency}ms</strong>. Resolved at the <strong>${hitLayerLabel}</strong>. ${
      hitLayer ?
        `Each upstream cache hit saves a roundtrip to the next layer — that's why a 99% CDN hit rate makes your origin invisible.` :
        `No caches hit — the request went all the way to the database. This is the worst-case path; real traffic should be much faster on average.`
    }`;
  }

  function render() {
    let html = `
      <div class="lf-chain">
    `;
    LAYERS.forEach((L, i) => {
      const visit = state.trace?.find((t) => t.layer === L.id);
      const hit = state.cacheHits[L.id] && L.cacheable;
      const visited = !!visit;
      const cls = visited ? (visit.hit ? 'visit-hit' : 'visit') : '';
      const label = visit ? visit.action : (L.cacheable ? (hit ? 'will hit cache' : 'cache enabled, no toggle') : 'always traversed');
      html += `
        <div class="lf-node ${cls}">
          <div class="lf-node-label">${L.label}</div>
          <div class="lf-node-meta">${L.latency}ms</div>
          ${visited ? `<div class="lf-node-action">${escape(visit.action)}</div>` : ''}
        </div>
      `;
      if (i < LAYERS.length - 1) {
        html += `<div class="lf-arrow ${visited ? 'lit' : ''}">↓</div>`;
      }
    });
    html += `</div>`;

    if (state.trace && state.trace.length) {
      // simple waterfall
      const totalLatency = state.trace.reduce((a, t) => a + t.latency, 0);
      let cum = 0;
      html += `<div class="lf-waterfall">`;
      html += `<div class="lf-waterfall-title">Waterfall (${totalLatency}ms total)</div>`;
      state.trace.forEach((t) => {
        const L = LAYERS.find((L) => L.id === t.layer);
        const widthPct = (t.latency / Math.max(1, totalLatency)) * 100;
        const offsetPct = (cum / Math.max(1, totalLatency)) * 100;
        cum += t.latency;
        html += `
          <div class="lf-wf-row">
            <div class="lf-wf-label">${escape(L.label)}${t.returning ? ' ↩' : ''}</div>
            <div class="lf-wf-track">
              <div class="lf-wf-bar ${t.hit ? 'hit' : ''}" style="margin-left: ${offsetPct}%; width: ${widthPct}%;">${t.latency}ms</div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    html += `<style>
      .lf-chain { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; margin-bottom: 1rem; }
      .lf-node { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 1rem; min-width: 220px; text-align: center; }
      .lf-node.visit { background: #fff6dc; box-shadow: 3px 3px 0 var(--ink); }
      .lf-node.visit-hit { background: #d6f5d6; box-shadow: 3px 3px 0 #2a8a3e; }
      .lf-node-label { font-family: var(--font-display); font-size: 1rem; letter-spacing: 1px; }
      .lf-node-meta { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); }
      .lf-node-action { font-family: var(--font-mono); font-size: 0.75rem; margin-top: 0.2em; padding-top: 0.2em; border-top: 1px dashed var(--ink-faint); }
      .lf-arrow { font-family: var(--font-display); font-size: 1.2rem; color: var(--ink-faint); }
      .lf-arrow.lit { color: var(--accent); }
      .lf-waterfall { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; margin-top: 0.6rem; }
      .lf-waterfall-title { font-family: var(--font-display); font-size: 0.9rem; letter-spacing: 0.04em; margin-bottom: 0.4em; }
      .lf-wf-row { display: grid; grid-template-columns: 110px 1fr; gap: 0.4rem; align-items: center; margin: 0.18em 0; }
      .lf-wf-label { font-family: var(--font-mono); font-size: 0.78rem; text-align: right; }
      .lf-wf-track { position: relative; height: 18px; background: var(--paper); border: 1px solid var(--ink); border-radius: 2px; }
      .lf-wf-bar { height: 100%; background: var(--accent); color: white; font-family: var(--font-mono); font-size: 0.7rem; text-align: center; line-height: 18px; border-right: 1px solid var(--ink); border-radius: 2px; }
      .lf-wf-bar.hit { background: #2a8a3e; }
    </style>`;
    stage.innerHTML = html;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  render();
}
