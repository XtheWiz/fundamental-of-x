// Factory & Builder widget: tabs for Factory and Builder, each with
// side-by-side code + a live demo.

const FACTORY_BAD = `// Caller switches on every type. Adding a format = edit here.
function loadImage(path) {
  if (path.endsWith('.png'))  return new PngImage(path);
  if (path.endsWith('.jpeg') || path.endsWith('.jpg'))
                              return new JpegImage(path);
  if (path.endsWith('.webp')) return new WebpImage(path);
  throw new Error('unknown format');
}

const img = loadImage("logo.webp");`;

const FACTORY_GOOD = `class ImageFactory {
  static registry = new Map();
  static register(ext, cls) { ImageFactory.registry.set(ext, cls); }
  static from(path) {
    const ext = path.split('.').pop();
    const Cls = ImageFactory.registry.get(ext);
    if (!Cls) throw new Error('unknown format: ' + ext);
    return new Cls(path);
  }
}

ImageFactory.register('png', PngImage);
ImageFactory.register('jpg', JpegImage);
ImageFactory.register('jpeg', JpegImage);
ImageFactory.register('webp', WebpImage);
// New format = ImageFactory.register('avif', AvifImage)

const img = ImageFactory.from("logo.webp");`;

const BUILDER_BAD = `// 7-argument constructor — readable? no.
new HttpRequest(
  'POST',
  '/api/users',
  { 'Content-Type': 'application/json' },
  '{"name":"Aiko"}',
  30000,
  3,
  true);`;

const BUILDER_GOOD = `// Fluent builder — each step is named.
const req = new HttpRequestBuilder()
  .method('POST')
  .url('/api/users')
  .header('Content-Type', 'application/json')
  .body('{"name":"Aiko"}')
  .timeout(30000)
  .retries(3)
  .followRedirects(true)
  .build();  // validates: all required fields set`;

export function initFactoryBuilderWidget(root) {
  let tab = 'factory';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Two patterns for "how do I create this?"</div>

      <div class="controls">
        <div class="pill-group">
          <input type="radio" name="fb-tab" id="fb-factory" value="factory" checked>
          <label for="fb-factory">Factory</label>
          <input type="radio" name="fb-tab" id="fb-builder" value="builder">
          <label for="fb-builder">Builder</label>
        </div>
      </div>

      <div id="fb-content"></div>
    </div>
  `;

  root.querySelectorAll('input[name=fb-tab]').forEach((r) =>
    r.addEventListener('change', (e) => { tab = e.target.value; render(); })
  );

  function render() {
    const content = root.querySelector('#fb-content');
    if (tab === 'factory') {
      content.innerHTML = `
        <div class="widget-stage" id="fb-stage">${renderFactoryDemo()}</div>
        <div class="dp-grid">
          <div class="dp-side bad">
            <div class="dp-side-label">⚠ Caller switches on type</div>
            <pre>${escape(FACTORY_BAD)}</pre>
          </div>
          <div class="dp-side good">
            <div class="dp-side-label">✓ Factory hides the choice</div>
            <pre>${escape(FACTORY_GOOD)}</pre>
          </div>
        </div>
      `;
      content.querySelectorAll('button[data-load]').forEach((b) =>
        b.addEventListener('click', () => loadImage(b.dataset.load, b.closest('.widget-stage')))
      );
    } else {
      content.innerHTML = `
        <div class="widget-stage" id="fb-stage">${renderBuilderDemo()}</div>
        <div class="dp-grid">
          <div class="dp-side bad">
            <div class="dp-side-label">⚠ Long constructor</div>
            <pre>${escape(BUILDER_BAD)}</pre>
          </div>
          <div class="dp-side good">
            <div class="dp-side-label">✓ Fluent builder</div>
            <pre>${escape(BUILDER_GOOD)}</pre>
          </div>
        </div>
      `;
    }
  }

  function renderFactoryDemo() {
    return `
      <div style="text-align: center;">
        <div style="margin-bottom: 0.5rem; font-family: var(--font-mono); font-size: 0.85rem;">Call <code>ImageFactory.from(path)</code> — it picks the right class.</div>
        <div style="display: flex; gap: 0.4rem; justify-content: center; flex-wrap: wrap;">
          <button class="btn" data-load="logo.png">.png</button>
          <button class="btn" data-load="photo.jpeg">.jpeg</button>
          <button class="btn" data-load="anim.webp">.webp</button>
          <button class="btn" data-load="weird.tiff">.tiff (unknown)</button>
        </div>
        <div id="fb-output" style="margin-top: 0.8rem; min-height: 60px; font-family: var(--font-mono); font-size: 0.85rem; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem;">(click a button)</div>
      </div>
    `;
  }

  function renderBuilderDemo() {
    return `
      <div>
        <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 0.5rem;">Hover the fluent chain — each step adds a piece. Final <code>build()</code> validates required fields.</div>
        <div style="font-family: var(--font-mono); font-size: 0.85rem; background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem;">
          <span class="fb-step">new HttpRequestBuilder()</span><br>
          <span class="fb-step">&nbsp;&nbsp;.method('POST')</span> <span class="fb-comment">→ sets verb</span><br>
          <span class="fb-step">&nbsp;&nbsp;.url('/api/users')</span> <span class="fb-comment">→ sets path</span><br>
          <span class="fb-step">&nbsp;&nbsp;.header('Content-Type', 'application/json')</span> <span class="fb-comment">→ adds header</span><br>
          <span class="fb-step">&nbsp;&nbsp;.body('{"name":"Aiko"}')</span> <span class="fb-comment">→ sets body</span><br>
          <span class="fb-step">&nbsp;&nbsp;.timeout(30000)</span> <span class="fb-comment">→ optional</span><br>
          <span class="fb-step">&nbsp;&nbsp;.retries(3)</span> <span class="fb-comment">→ optional</span><br>
          <span class="fb-step">&nbsp;&nbsp;.build();</span> <span class="fb-comment">→ validates &amp; returns HttpRequest</span>
        </div>
        <style>
          .fb-step:hover { background: var(--accent-soft); }
          .fb-comment { color: var(--ink-soft); font-style: italic; }
        </style>
      </div>
    `;
  }

  function loadImage(path, container) {
    const out = container.querySelector('#fb-output');
    const ext = path.split('.').pop();
    const KNOWN = { png: 'PngImage', jpg: 'JpegImage', jpeg: 'JpegImage', webp: 'WebpImage' };
    if (KNOWN[ext]) {
      out.innerHTML = `→ <code>ImageFactory.from("${path}")</code> returned <strong>${KNOWN[ext]}</strong> instance. Caller never had to know the format.`;
    } else {
      out.innerHTML = `<span style="color: var(--accent);">→ <code>ImageFactory.from("${path}")</code> threw "unknown format: ${ext}". Register a handler with <code>ImageFactory.register('${ext}', ...)</code>.</span>`;
    }
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
