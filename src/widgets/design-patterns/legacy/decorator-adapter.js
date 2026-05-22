// Decorator & Adapter widget: tabs. Decorator demo stacks 3 toggleable
// HTTP-middleware layers around a handler. Adapter shows code side-by-side.

const DECORATOR_BAD = `// Behavior glued onto the handler — hard to mix and match.
function handler(req) {
  const start = Date.now();
  if (!req.user) throw 'unauthorized';
  const res = realLogic(req);
  res.body = gzip(res.body);
  console.log("req took", Date.now() - start, "ms");
  return res;
}`;

const DECORATOR_GOOD = `// Each concern is a wrapping function (same shape as handler).
const log     = (next) => (req) => { const t=Date.now(); const r=next(req); console.log(Date.now()-t); return r; };
const auth    = (next) => (req) => { if (!req.user) throw 'unauthorized'; return next(req); };
const compress= (next) => (req) => { const r=next(req); r.body=gzip(r.body); return r; };

const app = compress(log(auth(realLogic)));
app(req);  // mix, match, reorder — without touching realLogic`;

const ADAPTER_BAD = `// Switching providers means touching every caller.
const stripe = new StripeProvider();
stripe.charge(199_99);  // old API: amount in cents

// Now we switch to BraintreeProvider:
const braintree = new BraintreeProvider();
braintree.process({ total: 199.99, currency: 'USD' });  // new shape
// every charge() caller in the codebase needs rewriting`;

const ADAPTER_GOOD = `// Adapter wraps Braintree behind the old "charge" API.
class BraintreeAdapter {
  constructor() { this.bt = new BraintreeProvider(); }
  charge(amountCents) {
    return this.bt.process({
      total: amountCents / 100,
      currency: 'USD',
    });
  }
}

const payments = new BraintreeAdapter();
payments.charge(199_99);  // callers don't change`;

const MIDDLEWARE = [
  { id: 'log',  label: 'log',   prefix: '[log] req received',  suffix: '[log] req done' },
  { id: 'auth', label: 'auth',  prefix: '[auth] check token',  suffix: '[auth] (pass)' },
  { id: 'comp', label: 'compress', prefix: '[compress] gzip on', suffix: '[compress] body compressed' },
];

export function initDecoratorAdapterWidget(root) {
  let tab = 'decorator';
  const enabled = { log: true, auth: true, comp: true };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Two ways to wrap an object</div>

      <div class="controls">
        <div class="pill-group">
          <input type="radio" name="da-tab" id="da-deco" value="decorator" checked>
          <label for="da-deco">Decorator</label>
          <input type="radio" name="da-tab" id="da-adp" value="adapter">
          <label for="da-adp">Adapter</label>
        </div>
      </div>

      <div id="da-content"></div>
    </div>
  `;

  root.querySelectorAll('input[name=da-tab]').forEach((r) =>
    r.addEventListener('change', (e) => { tab = e.target.value; render(); })
  );

  function render() {
    if (tab === 'decorator') renderDecorator();
    else renderAdapter();
  }

  function renderDecorator() {
    const c = root.querySelector('#da-content');
    c.innerHTML = `
      <div class="widget-stage">
        <div class="da-mw">
          ${MIDDLEWARE.map((m) => `
            <label class="da-mw-toggle"><input type="checkbox" data-mw="${m.id}" ${enabled[m.id] ? 'checked' : ''}> ${m.label}</label>
          `).join('')}
          <button class="btn btn-accent" id="da-run">Send request</button>
        </div>
        <div class="da-trace" id="da-trace"><span style="color: var(--ink-faint);">click "Send request"</span></div>
      </div>
      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Glued together</div>
          <pre>${escape(DECORATOR_BAD)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ Composable layers</div>
          <pre>${escape(DECORATOR_GOOD)}</pre>
        </div>
      </div>
      <style>
        .da-mw { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
        .da-mw-toggle { display: inline-flex; gap: 0.25em; align-items: center; font-family: var(--font-mono); font-size: 0.85rem; padding: 0.2em 0.5em; border: 1.5px solid var(--ink); border-radius: var(--radius); background: var(--paper); }
        .da-trace { margin-top: 0.6rem; font-family: var(--font-mono); font-size: 0.82rem; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; min-height: 80px; white-space: pre-line; }
      </style>
    `;
    c.querySelectorAll('input[data-mw]').forEach((cb) =>
      cb.addEventListener('change', (e) => { enabled[e.target.dataset.mw] = e.target.checked; })
    );
    c.querySelector('#da-run').addEventListener('click', () => {
      const lines = [];
      const layers = MIDDLEWARE.filter((m) => enabled[m.id]);
      layers.forEach((m) => lines.push(m.prefix));
      lines.push('→ realLogic(req) computes response');
      layers.slice().reverse().forEach((m) => lines.push(m.suffix));
      lines.push('← response returned to caller');
      c.querySelector('#da-trace').textContent = lines.join('\n');
    });
  }

  function renderAdapter() {
    const c = root.querySelector('#da-content');
    c.innerHTML = `
      <div class="widget-stage">
        <div class="da-flow">
          <div class="da-box client">caller: <code>payments.charge(19999)</code></div>
          <div class="da-arrow">↓</div>
          <div class="da-box adapter">
            <strong>BraintreeAdapter</strong><br>
            charge(amountCents) → process({total: ${'${'}amountCents/100${'}'}, currency: 'USD'})
          </div>
          <div class="da-arrow">↓</div>
          <div class="da-box provider">BraintreeProvider.process({total: 199.99, currency: 'USD'})</div>
        </div>
      </div>
      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Switching providers = rewrite every caller</div>
          <pre>${escape(ADAPTER_BAD)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ Adapter translates</div>
          <pre>${escape(ADAPTER_GOOD)}</pre>
        </div>
      </div>
      <style>
        .da-flow { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
        .da-box { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.8rem; font-family: var(--font-mono); font-size: 0.8rem; max-width: 600px; }
        .da-box.client { background: #cfe5ff; }
        .da-box.adapter { background: var(--accent-soft); }
        .da-box.provider { background: #c8f0c8; }
        .da-arrow { font-family: var(--font-display); font-size: 1.4rem; color: var(--ink-faint); }
      </style>
    `;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
