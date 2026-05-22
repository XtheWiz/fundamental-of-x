import{j as p}from"./main-BHRJeYOh.js";import{L as A}from"./LegacyWidget-Di7ysmDJ.js";const u=[{problem:"You need to support sorting users by name, age, or signup date — and add more orderings later without touching the sort function.",options:["Strategy","Singleton","Observer"],correct:"Strategy",why:"Each ordering is an interchangeable algorithm behind a common interface. <code>sort(users, byName)</code>, <code>sort(users, byAge)</code>. Adding a new ordering = a new strategy, no edits to <code>sort</code>."},{problem:"When a chat message arrives, you need to update the unread badge, the notification dropdown, and the page title — and other parts of the app should be able to react too.",options:["Decorator","Observer","Factory"],correct:"Observer",why:"The subject (message-received) emits an event. Each interested component subscribes. Adding a new reactor = subscribe; the subject doesn't know or care."},{problem:"Different image formats (PNG, JPEG, WebP) need to be loaded — the caller shouldn't care which format, just hand back a Image object.",options:["Factory","Adapter","Observer"],correct:"Factory",why:"The Factory picks the right concrete class based on the input. The caller is shielded from the if/else over file extensions."},{problem:"Your code uses a payment gateway with method <code>charge(amountCents)</code>. You're switching to a new provider whose method is <code>process({total, currency})</code>. You don't want to rewrite every caller.",options:["Adapter","Strategy","Singleton"],correct:"Adapter",why:"Wrap the new provider in a class that exposes the old <code>charge(amountCents)</code> signature. Callers stay; the adapter translates calls under the hood."},{problem:"A request to a flaky external API: sometimes it's up, sometimes it's timing out. You want to stop hammering it after several failures and let it recover.",options:["Observer","Circuit Breaker","Decorator"],correct:"Circuit Breaker",why:'Track failure rate; after a threshold, "trip" the breaker — calls fail fast for a cool-off window before testing the upstream again. Modern resilience pattern, not in GoF.'},{problem:"You need a centralized logger that all parts of the app use, with config loaded once at startup. But the tests want to substitute a fake logger.",options:["Singleton","Dependency Injection","Factory"],correct:"Dependency Injection",why:"Singleton makes testing painful (global state). DI passes the logger in explicitly — production wires the real one; tests pass a fake. Same shared logger, no global."}];function I(a){const e=new Array(u.length).fill(null);let d=0;a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Problem ${d+1} of ${u.length}</div>

      <div id="qz-content"></div>

      <div class="controls">
        <button class="btn" id="qz-prev">← Back</button>
        <button class="btn btn-accent" id="qz-next">Next →</button>
        <button class="btn btn-ghost" id="qz-reset">Reset</button>
        <span style="margin-left: auto; font-family: var(--font-mono);" id="qz-score">Score: 0/${u.length}</span>
      </div>
    </div>
  `,a.querySelector("#qz-prev").addEventListener("click",()=>{d>0&&d--,l()}),a.querySelector("#qz-next").addEventListener("click",()=>{d<u.length-1&&d++,l()}),a.querySelector("#qz-reset").addEventListener("click",()=>{e.fill(null),d=0,l()});function l(){const r=u[d],o=e[d],n=a.querySelector("#qz-content");n.innerHTML=`
      <div class="qz-problem">${s(r.problem)}</div>
      <div class="qz-options">
        ${r.options.map(i=>`
          <button class="qz-opt ${o===i?i===r.correct?"right":"wrong":""}" data-opt="${s(i)}" ${o!==null?"disabled":""}>${i}</button>
        `).join("")}
      </div>
      ${o?`<div class="qz-why ${o===r.correct?"right":"wrong"}">${o===r.correct?"✅ Right.":`❌ The intended answer was <strong>${r.correct}</strong>.`} ${r.why}</div>`:""}

      <style>
        .qz-problem { font-size: 1.02rem; margin: 0.6rem 0 0.8rem; padding: 0.6rem 0.8rem; background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); }
        .qz-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.5rem; margin-bottom: 0.6rem; }
        .qz-opt { padding: 0.6rem 0.9rem; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper); cursor: pointer; font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.04em; box-shadow: 3px 3px 0 var(--ink); }
        .qz-opt:hover:not(:disabled) { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--ink); }
        .qz-opt:disabled { cursor: default; }
        .qz-opt.right { background: #d6f5d6; }
        .qz-opt.wrong { background: #f7c8c8; }
        .qz-why { padding: 0.7rem 0.9rem; border: 2px solid var(--ink); border-radius: var(--radius); }
        .qz-why.right { background: #d6f5d6; box-shadow: 3px 3px 0 #2a8a3e; }
        .qz-why.wrong { background: var(--accent-soft); box-shadow: 3px 3px 0 var(--accent); }
      </style>
    `,n.querySelectorAll(".qz-opt").forEach(i=>i.addEventListener("click",()=>{e[d]=i.dataset.opt,l()})),a.querySelector(".widget-title").textContent=`Problem ${d+1} of ${u.length}`;const t=e.reduce((i,c,g)=>i+(c===u[g].correct?1:0),0);a.querySelector("#qz-score").textContent=`Score: ${t}/${u.length}`}function s(r){return String(r).replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}l()}const D=[{name:"Aiko",age:29,signup:"2024-01-15"},{name:"Mateo",age:41,signup:"2023-11-02"},{name:"Priya",age:34,signup:"2025-03-08"},{name:"Kenji",age:22,signup:"2024-06-21"},{name:"Lena",age:37,signup:"2024-12-30"}],w={name:{label:"by name",fn:(a,e)=>a.name.localeCompare(e.name)},age:{label:"by age",fn:(a,e)=>a.age-e.age},signup:{label:"by signup (new→old)",fn:(a,e)=>e.signup.localeCompare(a.signup)}},T=`function sort(users, order) {
  if (order === 'name') {
    return users.sort((a, b) => a.name.localeCompare(b.name));
  } else if (order === 'age') {
    return users.sort((a, b) => a.age - b.age);
  } else if (order === 'signup') {
    return users.sort((a, b) =>
      b.signup.localeCompare(a.signup));
  }
  // Adding a new order = edit this function.
}

sort(users, 'age');`,L=`// Strategy is just a function/object you pass in.
const byName   = (a, b) => a.name.localeCompare(b.name);
const byAge    = (a, b) => a.age - b.age;
const bySignup = (a, b) =>
  b.signup.localeCompare(a.signup);

function sort(users, strategy) {
  return users.slice().sort(strategy);
}

sort(users, byAge);

// Adding a new ordering = a new function.
// sort() never changes.`;function O(a){let e="name";a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Same data, three orderings</div>

      <div class="controls">
        <label>Strategy:</label>
        <div class="pill-group">
          ${Object.entries(w).map(([s,r],o)=>`
            <input type="radio" name="st-s" id="st-${s}" value="${s}" ${o===0?"checked":""}>
            <label for="st-${s}">${r.label}</label>
          `).join("")}
        </div>
      </div>

      <div class="widget-stage" id="st-stage" style="min-height: 180px;"></div>

      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Without strategy (hardcoded if/else)</div>
          <pre>${l(T)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ With strategy (function passed in)</div>
          <pre>${l(L)}</pre>
        </div>
      </div>
    </div>
  `,a.querySelectorAll("input[name=st-s]").forEach(s=>s.addEventListener("change",r=>{e=r.target.value,d()}));function d(){const s=D.slice().sort(w[e].fn),r=a.querySelector("#st-stage");r.innerHTML=`
      <table class="st-table">
        <thead><tr><th>name</th><th>age</th><th>signup</th></tr></thead>
        <tbody>
          ${s.map(o=>`<tr><td>${l(o.name)}</td><td>${o.age}</td><td>${o.signup}</td></tr>`).join("")}
        </tbody>
      </table>
      <style>
        .st-table { width: 100%; border-collapse: collapse; }
        .st-table th, .st-table td { padding: 0.3em 0.8em; border: 1.5px solid var(--ink); font-family: var(--font-mono); font-size: 0.85rem; }
        .st-table th { background: var(--paper-deep); font-family: var(--font-display); letter-spacing: 0.04em; font-weight: 400; font-size: 0.78rem; }
      </style>
    `}function l(s){return String(s).replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r])}d()}const C=`// Publisher knows every reactor by name.
function onMessageArrived(msg) {
  updateBadge(unread + 1);
  appendToDropdown(msg);
  document.title = "(" + unread + ") inbox";
  pushNotification(msg);
  // Add a new reactor → edit this function.
}`,z=`class EventBus {
  subscribers = new Map();
  on(evt, fn) {
    if (!this.subscribers.has(evt)) this.subscribers.set(evt, []);
    this.subscribers.get(evt).push(fn);
  }
  emit(evt, payload) {
    (this.subscribers.get(evt) ?? []).forEach(fn => fn(payload));
  }
}

const bus = new EventBus();
bus.on('message-arrived', updateBadge);
bus.on('message-arrived', appendToDropdown);
bus.on('message-arrived', updateTitle);

// Adding a new reactor:
bus.on('message-arrived', archiveToDisk);  // done.

// Publishing:
bus.emit('message-arrived', { from: 'Aiko', text: 'hi' });`,k=[{id:"badge",label:"Badge",icon:"🔴",describe:a=>`unread = ${a}`},{id:"dropdown",label:"Dropdown",icon:"📥",describe:(a,e)=>e?`last: "${e.text}" from ${e.from}`:"empty"},{id:"title",label:"Page title",icon:"🪟",describe:a=>`(${a}) inbox · X-sensei`}],x=["Aiko","Mateo","Priya","Kenji","Lena","Diego","Yuna","Omar"],S=["hello!","are you free?","lunch?","fyi: ship today","lol","wow","thanks!","lmk"];function j(a){const e={unread:0,last:null,enabled:{badge:!0,dropdown:!0,title:!0},log:[]};a.innerHTML=`
    <div class="widget">
      <div class="widget-title">message-arrived event</div>

      <div class="controls">
        <strong>Subscribers:</strong>
        ${k.map(s=>`<label><input type="checkbox" data-obs="${s.id}" checked> ${s.icon} ${s.label}</label>`).join("  ")}
      </div>

      <div class="controls">
        <button class="btn btn-accent" id="ob-publish">Publish "message-arrived"</button>
        <button class="btn btn-ghost" id="ob-reset">Reset</button>
      </div>

      <div class="widget-stage" id="ob-stage" style="min-height: 200px;"></div>

      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Without observer (publisher knows everyone)</div>
          <pre>${l(C)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ With observer (loose coupling)</div>
          <pre>${l(z)}</pre>
        </div>
      </div>
    </div>
  `,a.querySelectorAll("input[data-obs]").forEach(s=>s.addEventListener("change",r=>{e.enabled[r.target.dataset.obs]=r.target.checked,d()})),a.querySelector("#ob-publish").addEventListener("click",()=>{const s={from:x[Math.floor(Math.random()*x.length)],text:S[Math.floor(Math.random()*S.length)]};e.unread+=1,e.last=s,e.log.unshift(`publish: { from: "${s.from}", text: "${s.text}" }`),e.log.length>6&&(e.log.length=6),d(s)}),a.querySelector("#ob-reset").addEventListener("click",()=>{e.unread=0,e.last=null,e.log=[],Object.keys(e.enabled).forEach(s=>e.enabled[s]=!0),a.querySelectorAll("input[data-obs]").forEach(s=>s.checked=!0),d()});function d(s){let r='<div class="ob-stage">';r+='<div class="ob-pub"><div class="ob-pub-icon">📨</div><div class="ob-pub-name">SUBJECT<br><small>message-arrived</small></div></div>',r+='<div class="ob-obs">',k.forEach(o=>{const n=e.enabled[o.id];r+=`<div class="ob-sub ${n?"active":"mute"} ${s&&n?"just-fired":""}">
        <div class="ob-sub-icon">${o.icon}</div>
        <div class="ob-sub-name">${o.label}</div>
        <div class="ob-sub-state">${n?l(o.describe(e.unread,e.last)):"(unsubscribed)"}</div>
      </div>`}),r+="</div></div>",r+=`<div class="ob-log">${e.log.map(o=>`<div>${l(o)}</div>`).join("")||'<span style="color: var(--ink-faint);">no events yet</span>'}</div>`,r+=`<style>
      .ob-stage { display: grid; grid-template-columns: 200px 1fr; gap: 0.8rem; align-items: center; margin-bottom: 0.6rem; }
      .ob-pub { background: var(--accent); color: white; border: 2.5px solid var(--ink); border-radius: var(--radius); padding: 0.7rem; text-align: center; box-shadow: 4px 4px 0 var(--ink); }
      .ob-pub-icon { font-size: 2rem; }
      .ob-pub-name { font-family: var(--font-display); letter-spacing: 1.5px; }
      .ob-pub-name small { font-family: var(--font-mono); letter-spacing: 0; font-size: 0.7rem; }
      .ob-obs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; }
      .ob-sub { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem; text-align: center; transition: transform 0.2s, box-shadow 0.2s; }
      .ob-sub.active { background: #c8f0c8; }
      .ob-sub.mute { opacity: 0.4; }
      .ob-sub.just-fired { transform: translateY(-4px); box-shadow: 4px 6px 0 var(--accent); }
      .ob-sub-icon { font-size: 1.6rem; }
      .ob-sub-name { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.9rem; }
      .ob-sub-state { font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-soft); }
      .ob-log { background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 0.4rem 0.6rem; font-family: var(--font-mono); font-size: 0.78rem; max-height: 110px; overflow-y: auto; }
      @media (max-width: 640px) { .ob-stage { grid-template-columns: 1fr; } .ob-obs { grid-template-columns: 1fr; } }
    </style>`,a.querySelector("#ob-stage").innerHTML=r}function l(s){return String(s).replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r])}d()}const W=`// Caller switches on every type. Adding a format = edit here.
function loadImage(path) {
  if (path.endsWith('.png'))  return new PngImage(path);
  if (path.endsWith('.jpeg') || path.endsWith('.jpg'))
                              return new JpegImage(path);
  if (path.endsWith('.webp')) return new WebpImage(path);
  throw new Error('unknown format');
}

const img = loadImage("logo.webp");`,R=`class ImageFactory {
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

const img = ImageFactory.from("logo.webp");`,M=`// 7-argument constructor — readable? no.
new HttpRequest(
  'POST',
  '/api/users',
  { 'Content-Type': 'application/json' },
  '{"name":"Aiko"}',
  30000,
  3,
  true);`,B=`// Fluent builder — each step is named.
const req = new HttpRequestBuilder()
  .method('POST')
  .url('/api/users')
  .header('Content-Type', 'application/json')
  .body('{"name":"Aiko"}')
  .timeout(30000)
  .retries(3)
  .followRedirects(true)
  .build();  // validates: all required fields set`;function F(a){let e="factory";a.innerHTML=`
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
  `,a.querySelectorAll("input[name=fb-tab]").forEach(n=>n.addEventListener("change",t=>{e=t.target.value,d()}));function d(){const n=a.querySelector("#fb-content");e==="factory"?(n.innerHTML=`
        <div class="widget-stage" id="fb-stage">${l()}</div>
        <div class="dp-grid">
          <div class="dp-side bad">
            <div class="dp-side-label">⚠ Caller switches on type</div>
            <pre>${o(W)}</pre>
          </div>
          <div class="dp-side good">
            <div class="dp-side-label">✓ Factory hides the choice</div>
            <pre>${o(R)}</pre>
          </div>
        </div>
      `,n.querySelectorAll("button[data-load]").forEach(t=>t.addEventListener("click",()=>r(t.dataset.load,t.closest(".widget-stage"))))):n.innerHTML=`
        <div class="widget-stage" id="fb-stage">${s()}</div>
        <div class="dp-grid">
          <div class="dp-side bad">
            <div class="dp-side-label">⚠ Long constructor</div>
            <pre>${o(M)}</pre>
          </div>
          <div class="dp-side good">
            <div class="dp-side-label">✓ Fluent builder</div>
            <pre>${o(B)}</pre>
          </div>
        </div>
      `}function l(){return`
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
    `}function s(){return`
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
    `}function r(n,t){const i=t.querySelector("#fb-output"),c=n.split(".").pop(),g={png:"PngImage",jpg:"JpegImage",jpeg:"JpegImage",webp:"WebpImage"};g[c]?i.innerHTML=`→ <code>ImageFactory.from("${n}")</code> returned <strong>${g[c]}</strong> instance. Caller never had to know the format.`:i.innerHTML=`<span style="color: var(--accent);">→ <code>ImageFactory.from("${n}")</code> threw "unknown format: ${c}". Register a handler with <code>ImageFactory.register('${c}', ...)</code>.</span>`}function o(n){return String(n).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}d()}const P=`// Behavior glued onto the handler — hard to mix and match.
function handler(req) {
  const start = Date.now();
  if (!req.user) throw 'unauthorized';
  const res = realLogic(req);
  res.body = gzip(res.body);
  console.log("req took", Date.now() - start, "ms");
  return res;
}`,U=`// Each concern is a wrapping function (same shape as handler).
const log     = (next) => (req) => { const t=Date.now(); const r=next(req); console.log(Date.now()-t); return r; };
const auth    = (next) => (req) => { if (!req.user) throw 'unauthorized'; return next(req); };
const compress= (next) => (req) => { const r=next(req); r.body=gzip(r.body); return r; };

const app = compress(log(auth(realLogic)));
app(req);  // mix, match, reorder — without touching realLogic`,H=`// Switching providers means touching every caller.
const stripe = new StripeProvider();
stripe.charge(199_99);  // old API: amount in cents

// Now we switch to BraintreeProvider:
const braintree = new BraintreeProvider();
braintree.process({ total: 199.99, currency: 'USD' });  // new shape
// every charge() caller in the codebase needs rewriting`,_=`// Adapter wraps Braintree behind the old "charge" API.
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
payments.charge(199_99);  // callers don't change`,$=[{id:"log",label:"log",prefix:"[log] req received",suffix:"[log] req done"},{id:"auth",label:"auth",prefix:"[auth] check token",suffix:"[auth] (pass)"},{id:"comp",label:"compress",prefix:"[compress] gzip on",suffix:"[compress] body compressed"}];function N(a){let e="decorator";const d={log:!0,auth:!0,comp:!0};a.innerHTML=`
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
  `,a.querySelectorAll("input[name=da-tab]").forEach(n=>n.addEventListener("change",t=>{e=t.target.value,l()}));function l(){e==="decorator"?s():r()}function s(){const n=a.querySelector("#da-content");n.innerHTML=`
      <div class="widget-stage">
        <div class="da-mw">
          ${$.map(t=>`
            <label class="da-mw-toggle"><input type="checkbox" data-mw="${t.id}" ${d[t.id]?"checked":""}> ${t.label}</label>
          `).join("")}
          <button class="btn btn-accent" id="da-run">Send request</button>
        </div>
        <div class="da-trace" id="da-trace"><span style="color: var(--ink-faint);">click "Send request"</span></div>
      </div>
      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Glued together</div>
          <pre>${o(P)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ Composable layers</div>
          <pre>${o(U)}</pre>
        </div>
      </div>
      <style>
        .da-mw { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
        .da-mw-toggle { display: inline-flex; gap: 0.25em; align-items: center; font-family: var(--font-mono); font-size: 0.85rem; padding: 0.2em 0.5em; border: 1.5px solid var(--ink); border-radius: var(--radius); background: var(--paper); }
        .da-trace { margin-top: 0.6rem; font-family: var(--font-mono); font-size: 0.82rem; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; min-height: 80px; white-space: pre-line; }
      </style>
    `,n.querySelectorAll("input[data-mw]").forEach(t=>t.addEventListener("change",i=>{d[i.target.dataset.mw]=i.target.checked})),n.querySelector("#da-run").addEventListener("click",()=>{const t=[],i=$.filter(c=>d[c.id]);i.forEach(c=>t.push(c.prefix)),t.push("→ realLogic(req) computes response"),i.slice().reverse().forEach(c=>t.push(c.suffix)),t.push("← response returned to caller"),n.querySelector("#da-trace").textContent=t.join(`
`)})}function r(){const n=a.querySelector("#da-content");n.innerHTML=`
      <div class="widget-stage">
        <div class="da-flow">
          <div class="da-box client">caller: <code>payments.charge(19999)</code></div>
          <div class="da-arrow">↓</div>
          <div class="da-box adapter">
            <strong>BraintreeAdapter</strong><br>
            charge(amountCents) → process({total: \${amountCents/100}, currency: 'USD'})
          </div>
          <div class="da-arrow">↓</div>
          <div class="da-box provider">BraintreeProvider.process({total: 199.99, currency: 'USD'})</div>
        </div>
      </div>
      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Switching providers = rewrite every caller</div>
          <pre>${o(H)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ Adapter translates</div>
          <pre>${o(_)}</pre>
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
    `}function o(n){return String(n).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}l()}const G=`class Logger {
  static instance = null;
  static get() {
    if (!Logger.instance) Logger.instance = new Logger();
    return Logger.instance;
  }
  messages = [];
  log(m) { this.messages.push(m); }
}

class UserService {
  createUser(name) {
    Logger.get().log("created " + name);   // hidden dependency
    return { name };
  }
}

// In tests:
test("creates user", () => {
  new UserService().createUser("Aiko");
  // ⚠ how do we verify the log? Singleton state from
  //   prior tests is already in messages.
});`,V=`class UserService {
  constructor(logger) { this.logger = logger; }  // explicit
  createUser(name) {
    this.logger.log("created " + name);
    return { name };
  }
}

// In tests:
test("creates user, logs it", () => {
  const fakeLogger = { messages: [], log(m) { this.messages.push(m); } };
  new UserService(fakeLogger).createUser("Aiko");
  expect(fakeLogger.messages).toEqual(["created Aiko"]);
  // ✓ test owns its dependencies. No global state.
});`;function Q(a){const e={messages:[]},d=[],l=[];a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Tests, run twice</div>

      <div class="controls">
        <button class="btn btn-accent" id="sd-run-s">Run 3 tests (Singleton)</button>
        <button class="btn btn-accent" id="sd-run-d">Run 3 tests (DI)</button>
        <button class="btn btn-ghost" id="sd-reset">Reset</button>
      </div>

      <div class="widget-stage" id="sd-stage"></div>

      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Singleton (hidden global)</div>
          <pre>${n(G)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ DI (explicit)</div>
          <pre>${n(V)}</pre>
        </div>
      </div>
    </div>
  `,a.querySelector("#sd-run-s").addEventListener("click",s),a.querySelector("#sd-run-d").addEventListener("click",r),a.querySelector("#sd-reset").addEventListener("click",()=>{e.messages=[],l.length=0,d.length=0,o()});function s(){e.messages.push("created Aiko");const t=e.messages.length===1;l.push({name:"creates Aiko, logs once",pass:t,note:t?"✅ but only because this is the first test":"❌ shared state from previous test"}),e.messages.push("created Bob");const i=e.messages.length===1;l.push({name:"creates Bob, logs once",pass:i,note:"❌ messages now has 2 entries — leftover from test 1"}),e.messages.push("created Cara");const c=e.messages.length===1;l.push({name:"creates Cara, logs once",pass:c,note:"❌ messages now has 3 entries"}),o()}function r(){[["Aiko"],["Bob"],["Cara"]].forEach(([t])=>{const i={messages:[]};i.messages.push("created "+t);const c=i.messages.length===1;d.push({name:`creates ${t}, logs once`,pass:c,note:"✅ fresh logger, isolated"})}),o()}function o(){let t='<div class="sd-grid">';t+='<div class="sd-panel"><div class="sd-panel-label">SINGLETON TESTS</div>',l.length===0?t+='<div class="sd-empty">(not run)</div>':l.forEach(i=>{t+=`<div class="sd-test ${i.pass?"pass":"fail"}">${i.pass?"✓":"✗"} ${n(i.name)} <span class="sd-note">${i.note}</span></div>`}),t+="</div>",t+='<div class="sd-panel"><div class="sd-panel-label">DI TESTS</div>',d.length===0?t+='<div class="sd-empty">(not run)</div>':d.forEach(i=>{t+=`<div class="sd-test ${i.pass?"pass":"fail"}">${i.pass?"✓":"✗"} ${n(i.name)} <span class="sd-note">${i.note}</span></div>`}),t+="</div></div>",t+=`<style>
      .sd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.6rem; }
      .sd-panel { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; }
      .sd-panel-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.85rem; margin-bottom: 0.4em; }
      .sd-test { font-family: var(--font-mono); font-size: 0.8rem; padding: 0.2em 0.4em; margin: 0.12em 0; border-left: 3px solid; border-radius: 2px; }
      .sd-test.pass { background: #d6f5d6; border-left-color: #2a8a3e; }
      .sd-test.fail { background: var(--accent-soft); border-left-color: var(--accent); }
      .sd-note { color: var(--ink-soft); margin-left: 0.4em; }
      .sd-empty { font-family: var(--font-mono); color: var(--ink-faint); font-size: 0.85rem; }
      @media (max-width: 720px) { .sd-grid { grid-template-columns: 1fr; } }
    </style>`,a.querySelector("#sd-stage").innerHTML=t}function n(t){return String(t).replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i])}o()}const Y=`// business logic writes SQL directly
async function createOrder(userId, items) {
  await db.query(
    "INSERT INTO orders (user_id, status) VALUES (?, ?)",
    [userId, 'open']);
  const orderId = db.lastId();
  for (const it of items) {
    await db.query(
      "INSERT INTO order_items (order_id, product_id, qty) VALUES (?, ?, ?)",
      [orderId, it.productId, it.qty]);
  }
  await db.query(
    "UPDATE users SET last_order_at = NOW() WHERE id = ?",
    [userId]);
  // 3 separate transactions; what if one fails?
}`,J=`// business logic talks to repositories + UoW
async function createOrder(userId, items, uow) {
  const user = await uow.users.byId(userId);
  const order = new Order(user, 'open');
  for (const it of items) order.addItem(it.productId, it.qty);
  uow.orders.add(order);
  user.recordOrderPlaced();   // updates last_order_at in memory
  // nothing persisted yet — all in the UoW's change list
}

// At the boundary:
const uow = new UnitOfWork(db);
await createOrder(userId, items, uow);
await uow.commit();   // one transaction; all-or-nothing`;function K(a){const e={changes:[],committed:!1};a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Build up changes, then commit (or rollback)</div>

      <div class="controls">
        <button class="btn" id="uw-add-order">orders.add(Order(...))</button>
        <button class="btn" id="uw-add-item">order.addItem(productId, qty)</button>
        <button class="btn" id="uw-update-user">user.recordOrderPlaced()</button>
        <button class="btn btn-accent" id="uw-commit">uow.commit()</button>
        <button class="btn" id="uw-rollback">uow.rollback()</button>
        <button class="btn btn-ghost" id="uw-reset">Reset</button>
      </div>

      <div class="widget-stage" id="uw-stage" style="min-height: 200px;"></div>

      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Without Repository/UoW</div>
          <pre>${o(Y)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ With Repository + UoW</div>
          <pre>${o(J)}</pre>
        </div>
      </div>
    </div>
  `,a.querySelector("#uw-add-order").addEventListener("click",()=>d("INSERT","orders",'new Order(user, "open")')),a.querySelector("#uw-add-item").addEventListener("click",()=>d("INSERT","order_items","product_id=42, qty=2")),a.querySelector("#uw-update-user").addEventListener("click",()=>d("UPDATE","users","last_order_at=NOW()")),a.querySelector("#uw-commit").addEventListener("click",l),a.querySelector("#uw-rollback").addEventListener("click",s),a.querySelector("#uw-reset").addEventListener("click",()=>{e.changes=[],e.committed=!1,r()});function d(n,t,i){e.committed||(e.changes.push({op:n,table:t,detail:i}),r())}function l(){e.changes.length&&(e.committed=!0,r())}function s(){e.changes=[],e.committed=!1,r()}function r(){let n=`
      <div class="uw-header">
        <strong>Unit of Work change list</strong> — ${e.changes.length} pending operation(s)
        ${e.committed?'<span class="uw-tag commit">✓ COMMITTED</span>':""}
      </div>
      <div class="uw-changes">
        ${e.changes.length===0?'<div class="uw-empty">(no changes yet)</div>':e.changes.map((t,i)=>`<div class="uw-change">${String(i+1).padStart(2,"0")}. <span class="uw-op">${t.op}</span> <code>${o(t.table)}</code> — ${o(t.detail)}</div>`).join("")}
      </div>
      <div class="uw-note">
        ${e.committed?"All operations sent to the database in <strong>one</strong> transaction. If any one failed, none would have been applied.":e.changes.length?"Nothing has been written to the database yet. The UoW tracks the changes; <code>commit()</code> sends them all at once.":"Click some operations above to build up a pending changeset."}
      </div>
      <style>
        .uw-header { font-family: var(--font-mono); font-size: 0.9rem; margin-bottom: 0.4rem; }
        .uw-tag { background: #2a8a3e; color: white; padding: 0.15em 0.5em; border-radius: 2px; font-family: var(--font-display); letter-spacing: 1px; font-size: 0.7rem; margin-left: 0.5em; }
        .uw-changes { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; min-height: 60px; margin-bottom: 0.4rem; }
        .uw-change { font-family: var(--font-mono); font-size: 0.78rem; padding: 0.18em 0; }
        .uw-op { display: inline-block; font-family: var(--font-mono); font-size: 0.7rem; padding: 0.05em 0.4em; background: var(--accent); color: white; border-radius: 2px; }
        .uw-empty { color: var(--ink-faint); font-family: var(--font-mono); font-size: 0.85rem; }
        .uw-note { font-size: 0.88rem; padding: 0.4rem 0.6rem; background: var(--paper); border: 1.5px solid var(--ink); border-radius: var(--radius); }
      </style>
    `;a.querySelector("#uw-stage").innerHTML=n}function o(n){return String(n).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}r()}const E={mvc:{label:"MVC / MVVM",sub:"Separation of presentation",flow:"User input → Controller → Model → View update",diagram:[{id:"view",label:"View",color:"#cfe5ff"},{id:"ctrl",label:"Controller",color:"#ffe9b3"},{id:"model",label:"Model",color:"#c8f0c8"}],edges:[["view","ctrl","user event"],["ctrl","model","mutate"],["model","view","update"]],use:"Every UI framework: Rails, ASP.NET, iOS UIKit. MVVM (Angular, .NET MAUI) adds a binding layer.",avoid:"Tiny apps where the View IS the Model. Don't add layers for the sake of layers."},cqrs:{label:"CQRS",sub:"Different models for reads & writes",flow:"Commands → Write model → Events → Read model(s)",diagram:[{id:"cmd",label:"Command",color:"#ffe9b3"},{id:"write",label:"Write model",color:"#cfe5ff"},{id:"read",label:"Read model",color:"#c8f0c8"},{id:"query",label:"Query",color:"#f7c8c8"}],edges:[["cmd","write","validate"],["write","read","project"],["query","read","fast lookup"]],use:"When reads and writes have very different shapes/scale. E.g. write small normalized rows; read denormalized analytics views.",avoid:"Until your read and write loads actually diverge. CQRS doubles your data model."},es:{label:"Event Sourcing",sub:"Store changes, not state",flow:"Command → Event(s) → append-only log → fold into state on read",diagram:[{id:"cmd",label:"Command",color:"#ffe9b3"},{id:"log",label:"Event log",color:"#cfe5ff"},{id:"state",label:"Materialized state",color:"#c8f0c8"}],edges:[["cmd","log","append event"],["log","state","fold/replay"]],use:'Audit-heavy domains (banking, healthcare, regulatory). "What was the state at time T?" is free.',avoid:"CRUD apps. Adds significant complexity (event versioning, snapshots, projections) without payoff."},cb:{label:"Circuit Breaker",sub:"Fail fast when upstream is broken",flow:"closed → too many failures → open → cool down → half-open → success → closed",diagram:[{id:"closed",label:"Closed",color:"#c8f0c8"},{id:"open",label:"Open",color:"#f7c8c8"},{id:"halfOpen",label:"Half-open",color:"#ffe9b3"}],edges:[["closed","open","failures > threshold"],["open","halfOpen","cool-down elapsed"],["halfOpen","closed","success"],["halfOpen","open","failed probe"]],use:"Calling any external service. Stops cascading failures and gives the upstream room to recover.",avoid:"In-process calls that can't fail. Library: Hystrix (deprecated), resilience4j, polly, tower."},saga:{label:"Saga",sub:"Distributed transaction via compensation",flow:"Step 1 → Step 2 → Step 3 fails → compensate Step 2 → compensate Step 1",diagram:[{id:"s1",label:"Step 1: reserve",color:"#c8f0c8"},{id:"s2",label:"Step 2: charge",color:"#c8f0c8"},{id:"s3",label:"Step 3: ship",color:"#f7c8c8"}],edges:[["s1","s2","ok"],["s2","s3","ok"],["s3","s2","fail → refund"],["s2","s1","release reservation"]],use:"Cross-service workflows (book travel: flight + hotel + car). 2PC doesn't scale; sagas trade atomicity for availability.",avoid:"Single-DB transactions where ACID suffices. Sagas put complexity in app code that 2PC kept in the DB."}};function X(a){let e="mvc";a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Five patterns the original book never saw</div>

      <div class="controls">
        <div class="pill-group">
          ${Object.entries(E).map(([s,r],o)=>`
            <input type="radio" name="ma-p" id="ma-${s}" value="${s}" ${o===0?"checked":""}>
            <label for="ma-${s}">${r.label}</label>
          `).join("")}
        </div>
      </div>

      <div class="widget-stage" id="ma-stage" style="min-height: 320px;"></div>
    </div>
  `,a.querySelectorAll("input[name=ma-p]").forEach(s=>s.addEventListener("change",r=>{e=r.target.value,d()}));function d(){const s=E[e],r=600,o=180,n={};s.diagram.forEach((c,g)=>{const b=60+g*((r-120)/Math.max(1,s.diagram.length-1));n[c.id]={x:b,y:o/2}});let t=`<svg viewBox="0 0 ${r} ${o}" width="100%" style="max-width: ${r}px">`;t+=`<style>
      .ma-node { stroke: var(--ink); stroke-width: 2.5; }
      .ma-label { font-family: var(--font-display); font-size: 14px; letter-spacing: 1px; fill: var(--ink); }
      .ma-edge { stroke: var(--ink); stroke-width: 1.5; marker-end: url(#ma-arr); }
      .ma-edge-text { font-family: var(--font-mono); font-size: 9.5px; fill: var(--ink); }
      .ma-edge-bg { fill: var(--paper); stroke: var(--ink); stroke-width: 0.5; }
    </style>`,t+='<defs><marker id="ma-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/></marker></defs>',s.edges.forEach((c,g)=>{const b=n[c[0]],f=n[c[1]];if(!b||!f)return;const q=n[c[0]].x<n[c[1]].x?-22:22,v=(b.x+f.x)/2,h=(b.y+f.y)/2+q;t+=`<path class="ma-edge" d="M ${b.x} ${b.y} Q ${v} ${h}, ${f.x} ${f.y}"/>`;const y=Math.max(60,c[2].length*6);t+=`<rect class="ma-edge-bg" x="${v-y/2}" y="${h-7}" width="${y}" height="14" rx="2"/>`,t+=`<text class="ma-edge-text" x="${v}" y="${h+4}" text-anchor="middle">${l(c[2])}</text>`}),s.diagram.forEach(c=>{const g=n[c.id];t+=`<rect class="ma-node" x="${g.x-50}" y="${g.y-22}" width="100" height="44" rx="6" fill="${c.color}"/>`,t+=`<text class="ma-label" x="${g.x}" y="${g.y+5}" text-anchor="middle">${l(c.label)}</text>`}),t+="</svg>";const i=`
      <div class="ma-header">
        <div class="ma-title">${l(s.label)}</div>
        <div class="ma-sub">${l(s.sub)}</div>
        <div class="ma-flow"><code>${l(s.flow)}</code></div>
      </div>
      ${t}
      <div class="ma-grid">
        <div class="ma-card">
          <div class="ma-card-label">USE WHEN</div>
          <div>${l(s.use)}</div>
        </div>
        <div class="ma-card warn">
          <div class="ma-card-label">DON'T REACH FOR IT WHEN</div>
          <div>${l(s.avoid)}</div>
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
    `;a.querySelector("#ma-stage").innerHTML=i}function l(s){return String(s).replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r])}d()}const m=a=>()=>p.jsx(A,{init:a}),ae={slug:"design-patterns",title:"Design Patterns",intro:p.jsx(p.Fragment,{children:"Eight lessons covering the patterns worth knowing — GoF classics where they still earn their keep, plus the modern architectural patterns the original book never saw coming."}),lessons:[{slug:"what-is-a-pattern",number:"01",title:"What is a Pattern?",blurb:'GoF history, modern view, and why some "patterns" became language features.',Widget:m(I),intro:p.jsx(p.Fragment,{children:"A pattern is a name for a solution to a recurring problem. Half of the original GoF patterns are language features in modern languages — the rest still ship code."}),sections:[],takeaways:["Patterns are vocabulary, not laws. Use them when they fit, not because the book said so.","Many GoF patterns (Iterator, Command) are language built-ins now.","The patterns that survived (Strategy, Observer, Factory) describe runtime behavior, not syntax.","Modern architectures stack patterns: CQRS + Event Sourcing + Saga is a coherent design."]},{slug:"strategy",number:"02",title:"Strategy",blurb:"Interchangeable algorithms behind a common interface.",Widget:m(O),intro:p.jsx(p.Fragment,{children:"Multiple ways to do the same job — sorting, paying, compressing — behind one interface. Pick the algorithm at runtime, swap freely."}),sections:[],takeaways:["Decouples the algorithm from the code that uses it.","Test each strategy in isolation.","Often replaces a long if/else chain selecting behavior.","In functional languages: just pass a function."]},{slug:"observer",number:"03",title:"Observer & Pub-Sub",blurb:"The pattern behind every event system: subjects notify subscribers.",Widget:m(j),intro:p.jsx(p.Fragment,{children:"The subject doesn\\'t know who\\'s listening. Subscribers register, unregister, and react to events independently."}),sections:[],takeaways:["Decouples producer from consumer.","addEventListener in browsers, Subjects in RxJS, signals in Solid/Preact.","Risk: memory leaks if you forget to unsubscribe.","Pub-Sub adds a broker between publisher and subscriber."]},{slug:"factory-builder",number:"04",title:"Factory & Builder",blurb:"When `new` isn't enough.",Widget:m(F),intro:p.jsx(p.Fragment,{children:"Factories decide what concrete type to construct; Builders compose objects step-by-step when they have many fields."}),sections:[],takeaways:["Factory: input → object of some interface. Hide the concrete type.","Builder: chain calls to assemble a complex object. Often immutable.","Both let you swap the construction logic without changing callers.","In JS: a function returning an object is already a factory."]},{slug:"decorator-adapter",number:"05",title:"Decorator & Adapter",blurb:"Wrapping existing things.",Widget:m(N),intro:p.jsx(p.Fragment,{children:"Decorator adds behavior to an existing object without changing it. Adapter changes the shape of an interface so two parts can talk."}),sections:[],takeaways:["Decorator: same interface, extra behavior. Logging, caching, retry wrappers.","Adapter: incompatible interface → expected interface. Translation layer.","Both compose cleanly — wrap an Adapter in a Decorator in a Decorator.","Higher-order functions in functional languages do both."]},{slug:"singleton-di",number:"06",title:"Singleton & Dependency Injection",blurb:"The controversy and the modern alternative.",Widget:m(Q),intro:p.jsx(p.Fragment,{children:"Singleton: one global instance forever. Convenient, until you need to test it. DI: pass dependencies in instead of reaching for them. Same goal, far better testability."}),sections:[],takeaways:["Singleton makes testing miserable — you can't swap the instance.","DI containers (Spring, Angular) automate dependency wiring.",'Plain "pass it as a parameter" is often enough.','The "Singleton" is usually misused — most use cases want a single configured instance, not a global mutable state.']},{slug:"repository-uow",number:"07",title:"Repository & Unit of Work",blurb:"Data-access patterns.",Widget:m(K),intro:p.jsx(p.Fragment,{children:"Repository abstracts data access — caller doesn\\'t know if it\\'s SQL, NoSQL, or in-memory. Unit of Work batches changes for atomic commit."}),sections:[],takeaways:['Repository: interface for "get/save entity by ID" — implementations vary.',"Unit of Work: collect mutations, commit them together.",'Together they let "business logic" be tested without a real database.',"Most ORMs (Entity Framework, SQLAlchemy, ActiveRecord) bake this in."]},{slug:"modern-architecture",number:"08",title:"Modern Architecture Patterns",blurb:"MVC / MVVM, CQRS, Event Sourcing, Circuit Breaker, Saga, Outbox.",Widget:m(X),intro:p.jsx(p.Fragment,{children:"The GoF book ended in 1994. Networked systems brought a new generation: separation of reads from writes, event logs as the source of truth, distributed transactions via compensation, reliable publishing across services."}),sections:[],takeaways:["CQRS: read model ≠ write model. Scale them independently.","Event Sourcing: append-only log of facts; current state is a fold of the log.","Circuit Breaker: stop calling a failing dependency before it cascades.","Saga: long-running distributed transaction with compensating actions.","Outbox: write the event to the same DB transaction as the business state — covered in detail in the Messaging topic."]}]};export{ae as manifest};
