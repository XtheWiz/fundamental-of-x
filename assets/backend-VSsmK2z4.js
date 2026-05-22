import{j as m}from"./main-b-Nq7fYF.js";import{L as I}from"./LegacyWidget-BtutJkVO.js";const A=[{v:"GET",safe:!0,idempotent:!0,body:!1,hint:"Fetch a resource. No side effects. Safely cacheable."},{v:"POST",safe:!1,idempotent:!1,body:!0,hint:"Create a resource (or trigger an action). Not idempotent — sending twice creates two."},{v:"PUT",safe:!1,idempotent:!0,body:!0,hint:"Replace a resource entirely. Idempotent — sending twice is identical to once."},{v:"PATCH",safe:!1,idempotent:!1,body:!0,hint:"Partially update a resource. Often not idempotent (e.g. +1 a counter)."},{v:"DELETE",safe:!1,idempotent:!0,body:!1,hint:"Remove a resource. Idempotent — second DELETE is a no-op (returns 404)."}],R=[{verb:"GET",path:"/users/42",body:""},{verb:"POST",path:"/users",body:'{ "name": "Aiko", "city": "Tokyo" }'},{verb:"PUT",path:"/users/42",body:'{ "name": "Aiko", "city": "Osaka" }'},{verb:"PATCH",path:"/users/42",body:'{ "city": "Osaka" }'},{verb:"DELETE",path:"/users/42",body:""},{verb:"GET",path:"/users?city=Tokyo",body:""}];function U(i){let e="GET",b="/users/42",y="";i.innerHTML=`
    <div class="widget">
      <div class="widget-title">HTTP Request Builder</div>

      <div class="controls">
        <label>Verb:</label>
        <select class="field" id="h-verb">
          ${A.map(s=>`<option>${s.v}</option>`).join("")}
        </select>
        <label>Path:</label>
        <input class="field" id="h-path" value="/users/42" style="width: 220px;">
        <label>Preset:</label>
        <select class="field" id="h-preset">
          <option value="">— pick —</option>
          ${R.map((s,o)=>`<option value="${o}">${s.verb} ${s.path}</option>`).join("")}
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
  `;const p=i.querySelector("#h-verb"),h=i.querySelector("#h-path"),c=i.querySelector("#h-body"),d=i.querySelector("#h-preset");p.addEventListener("change",s=>{e=s.target.value,n()}),h.addEventListener("input",s=>{b=s.target.value,n()}),c.addEventListener("input",s=>{y=s.target.value,n()}),d.addEventListener("change",s=>{const o=R[Number(s.target.value)];o&&(e=o.verb,b=o.path,y=o.body,p.value=e,h.value=b,c.value=y,n())});function n(){const s=A.find(f=>f.v===e);i.querySelector("#h-hint").innerHTML=`<strong>${e}</strong> — ${s.hint} <span style="color: var(--ink-soft);">safe=${s.safe} · idempotent=${s.idempotent}</span>`;const o=y.trim().length>0&&s.body,l=["Host: api.fundamentalofx.com","User-Agent: Mozilla/5.0","Accept: application/json"];o&&(l.push("Content-Type: application/json"),l.push(`Content-Length: ${y.trim().length}`));const u=[`${e} ${b} HTTP/1.1`,...l,"",o?y.trim():""];i.querySelector("#h-req").textContent=u.join(`
`);const v=a(e,b,y);i.querySelector("#h-res").innerHTML=t(v)}function a(s,o,l){const u=o.match(/^\/users\/(\d+)$/),v=o.match(/^\/users(\?.*)?$/);if(s==="GET"){if(u)return u[1]==="42"?{code:200,reason:"OK",headers:{"Content-Type":"application/json"},body:'{"id":42,"name":"Aiko","city":"Tokyo"}'}:{code:404,reason:"Not Found",headers:{"Content-Type":"application/json"},body:'{"error":"user not found"}'};if(v)return{code:200,reason:"OK",headers:{"Content-Type":"application/json"},body:'[{"id":42,"name":"Aiko"},{"id":43,"name":"Kenji"}]'}}if(s==="POST"&&o==="/users"){if(!l.trim())return{code:400,reason:"Bad Request",headers:{"Content-Type":"application/json"},body:'{"error":"body required"}'};try{JSON.parse(l)}catch{return{code:400,reason:"Bad Request",headers:{},body:'{"error":"invalid JSON"}'}}return{code:201,reason:"Created",headers:{"Content-Type":"application/json",Location:"/users/99"},body:'{"id":99,"name":"…"}'}}if((s==="PUT"||s==="PATCH")&&u&&u[1]==="42"){try{JSON.parse(l)}catch{return{code:400,reason:"Bad Request",headers:{},body:'{"error":"invalid JSON"}'}}return{code:200,reason:"OK",headers:{"Content-Type":"application/json"},body:'{"id":42,"name":"Aiko","city":"Osaka"}'}}return s==="DELETE"?u&&u[1]==="42"?{code:204,reason:"No Content",headers:{},body:""}:{code:404,reason:"Not Found",headers:{"Content-Type":"application/json"},body:'{"error":"user not found"}'}:{code:405,reason:"Method Not Allowed",headers:{Allow:"GET, POST"},body:""}}function t(s){return[`<span class="http-hl-${s.code>=500?"5xx":s.code>=400?"4xx":s.code>=300?"3xx":"200"}">HTTP/1.1 ${s.code} ${r(s.reason)}</span>`,...Object.entries(s.headers).map(([u,v])=>`${r(u)}: ${r(v)}`),"",r(s.body)].join(`
`)}function r(s){return String(s).replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}n()}const q=[{question:"Fetch a user by ID",a:{code:"GET /getUser?id=42",restful:!1},b:{code:"GET /users/42",restful:!0},why:"<strong>Resources, not verbs.</strong> The URL identifies a thing (a user); the HTTP method identifies the action (GET = read). <code>/getUser</code> mixes the two and breaks predictability — what is <code>/getUser?id=42&delete=true</code> supposed to mean?"},{question:"Delete a user",a:{code:"POST /users/42/delete",restful:!1},b:{code:"DELETE /users/42",restful:!0},why:'<strong>Use DELETE for deletes.</strong> Proxies, caches, and frameworks all know "DELETE is destructive and idempotent." Hiding the intent inside a POST forces every caller to read your docs.'},{question:"Update a user's entire profile",a:{code:"PUT /users/42 { full payload }",restful:!0},b:{code:"POST /users/42 { full payload }",restful:!1},why:"<strong>PUT replaces; POST creates or is non-idempotent.</strong> If a client retries on a network blip, PUT is safe (you get the same final state), POST might create a new record or trigger an action twice."},{question:"Increment a counter on a post",a:{code:"POST /posts/42/like",restful:!0},b:{code:"PUT  /posts/42/likes/+1",restful:!1},why:'<strong>"Like" is an action that creates a like, not an idempotent replacement.</strong> POST is correct — running it twice produces two likes. PUT implies "set to this value," not "add one."'},{question:"Search for products under $100",a:{code:'POST /search { "max": 100 }',restful:!1},b:{code:"GET  /products?max_price=100",restful:!0},why:"<strong>Search results are a resource representation; GET reads.</strong> Filters in the query string make the URL bookmarkable, cacheable, and idempotent. POST hides the parameters in a body that proxies/CDNs ignore."},{question:"Indicate a successful POST that created a resource",a:{code:"HTTP 200 OK",restful:!1},b:{code:"HTTP 201 Created",restful:!0},why:'<strong>201 is the specific code for "created."</strong> It also lets you return a <code>Location:</code> header pointing at the new resource. 200 works, but loses information that intermediaries (clients, dashboards, error trackers) can use.'}];function j(i){let e=0;const b=new Array(q.length).fill(null);i.innerHTML=`
    <div class="widget">
      <div class="widget-title">Design Choice #<span id="r-idx">1</span> of ${q.length}</div>

      <div id="r-question" style="font-size: 1.05rem; margin: 0.5rem 0 1rem;"></div>

      <div class="rest-options">
        <button class="rest-opt" data-opt="a"></button>
        <button class="rest-opt" data-opt="b"></button>
      </div>

      <div class="callout" id="r-why" style="display: none;"></div>

      <div class="controls">
        <button class="btn" id="r-prev">← Back</button>
        <button class="btn btn-accent" id="r-next">Next →</button>
        <button class="btn btn-ghost" id="r-reset">Reset</button>
        <span style="margin-left: auto; font-family: var(--font-mono);" id="r-score">Score: 0/${q.length}</span>
      </div>

      <style>
        .rest-options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin: 1rem 0; }
        .rest-opt { padding: 0.9rem 1.1rem; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper); cursor: pointer; font-family: var(--font-mono); font-size: 0.95rem; text-align: left; box-shadow: 3px 3px 0 var(--ink); transition: transform 0.12s, box-shadow 0.12s; }
        .rest-opt:hover:not(:disabled) { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--ink); }
        .rest-opt.right { background: #d6f5d6; }
        .rest-opt.wrong { background: #f7c8c8; }
        .rest-opt:disabled { cursor: default; }
        @media (max-width: 540px) { .rest-options { grid-template-columns: 1fr; } }
      </style>
    </div>
  `,i.querySelector("#r-next").addEventListener("click",()=>{e<q.length-1&&e++,p()}),i.querySelector("#r-prev").addEventListener("click",()=>{e>0&&e--,p()}),i.querySelector("#r-reset").addEventListener("click",()=>{b.fill(null),e=0,p()}),i.querySelectorAll(".rest-opt").forEach(h=>h.addEventListener("click",()=>y(h.dataset.opt)));function y(h){b[e]===null&&(b[e]=h,p())}function p(){const h=q[e];i.querySelector("#r-idx").textContent=e+1,i.querySelector("#r-question").textContent=h.question;const c=i.querySelector("button.rest-opt[data-opt=a]"),d=i.querySelector("button.rest-opt[data-opt=b]");if(c.textContent=h.a.code,d.textContent=h.b.code,c.className="rest-opt",d.className="rest-opt",c.disabled=d.disabled=!1,b[e]!==null){c.disabled=d.disabled=!0,c.classList.add(h.a.restful?"right":"wrong"),d.classList.add(h.b.restful?"right":"wrong");const a=i.querySelector("#r-why");a.style.display="block";const t=h.a.restful?"a":"b";a.innerHTML=`${b[e]===t?"✅ Right.":"❌ Not quite."} ${h.why}`}else i.querySelector("#r-why").style.display="none";const n=b.reduce((a,t,r)=>{if(t===null)return a;const o=q[r].a.restful?"a":"b";return a+(t===o?1:0)},0);i.querySelector("#r-score").textContent=`Score: ${n}/${q.length}`}p()}const L=[{actor:"User",target:"App",label:'1. Click "Sign in with GitHub"',body:"GET /login",note:"User initiates login. App needs to start the OAuth dance."},{actor:"App",target:"User",label:"2. Redirect to Provider",body:"302 Location: https://github.com/login/oauth/authorize?client_id=…&redirect_uri=…&state=xyz",note:"App generates a random <code>state</code> (anti-CSRF) and sends the user's browser to GitHub with its public client_id."},{actor:"User",target:"Provider",label:"3. Provider asks for consent",body:"“Allow App to read your profile?” [Authorize]",note:"User authenticates with GitHub (password, 2FA, etc.) and approves the requested scopes."},{actor:"Provider",target:"User",label:"4. Redirect back to App with code",body:"302 Location: https://app.com/callback?code=abc123&state=xyz",note:"Provider sends user's browser back to the App. <code>code</code> is short-lived. <code>state</code> echoes what App sent — App will verify it."},{actor:"User",target:"App",label:"5. Browser hits callback URL",body:"GET /callback?code=abc123&state=xyz",note:"Browser is just delivering the redirect. App now has the code and verifies the state matches."},{actor:"App",target:"Provider",label:"6. Exchange code for access token",body:"POST /oauth/token { code, client_id, client_secret }",note:"<strong>Server-to-server</strong>. App sends the code plus its private <code>client_secret</code>. The browser never sees this — that's why even an intercepted code is useless to an attacker."},{actor:"Provider",target:"App",label:"7. Provider returns access token",body:"200 { access_token, refresh_token, expires_in: 3600 }",note:"App now has a token it can use to call the Provider's API on the user's behalf."},{actor:"App",target:"Provider",label:"8. Fetch user profile",body:"GET /user  Authorization: Bearer <access_token>",note:"App calls Provider's API with the token to find out who the user is."},{actor:"App",target:"User",label:"9. Set session cookie, redirect home",body:"302 Location: /  Set-Cookie: session=…; Secure; HttpOnly; SameSite=Lax",note:"App creates its own local session. From now on, the user is logged in via the App's cookie — the access_token is a server-side detail."}],H=["User","App","Provider"];function D(i){let e=0;i.innerHTML=`
    <div class="widget">
      <div class="widget-title">OAuth 2.0 — Authorization Code Flow</div>
      <p class="widget-hint">Step through 9 messages between three parties.</p>

      <div class="controls">
        <button class="btn" id="a-prev">← Back</button>
        <button class="btn btn-accent" id="a-next">Next step →</button>
        <button class="btn btn-ghost" id="a-reset">Reset</button>
        <span style="margin-left:auto; font-family: var(--font-mono); color: var(--ink-soft);" id="a-counter">0 / ${L.length}</span>
      </div>

      <div class="widget-stage" id="a-stage" style="min-height: 420px;"></div>
      <div class="callout" id="a-note">Click "Next step →" to begin.</div>
    </div>
  `;const b=i.querySelector("#a-stage"),y=i.querySelector("#a-note"),p=i.querySelector("#a-counter");i.querySelector("#a-next").addEventListener("click",()=>{e<L.length&&e++,h()}),i.querySelector("#a-prev").addEventListener("click",()=>{e>0&&e--,h()}),i.querySelector("#a-reset").addEventListener("click",()=>{e=0,h()});function h(){p.textContent=`${e} / ${L.length}`;let d=`
      <div class="auth-grid">
        <div class="auth-actor user">USER</div>
        <div class="auth-actor app">APP <small>(your site)</small></div>
        <div class="auth-actor prov">PROVIDER <small>(github.com)</small></div>
    `;L.slice(0,e).forEach((n,a)=>{const t=H.indexOf(n.actor),r=H.indexOf(n.target),s=Math.min(t,r),o=Math.abs(r-t)+1,l=r>t?"→":"←",u=a===e-1?"current":"";d+=`
        <div class="auth-stepnum">${String(a+1).padStart(2,"0")}</div>
        <div class="auth-msg ${u}" style="grid-column: ${s+2} / span ${o};">
          <div class="auth-msg-label">${c(n.label)} <span class="auth-arrow">${l}</span></div>
          <div class="auth-msg-body">${c(n.body)}</div>
        </div>
      `}),d+="</div>",d+=`<style>
      .auth-grid { display: grid; grid-template-columns: 30px 1fr 1fr 1fr; gap: 0.4rem 0.6rem; align-items: stretch; }
      .auth-actor { grid-column: span 1; font-family: var(--font-display); letter-spacing: 2px; text-align: center; padding: 0.4em; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper-deep); }
      .auth-actor.user { background: #cfe5ff; grid-column: 2; }
      .auth-actor.app  { background: #ffe9b3; grid-column: 3; }
      .auth-actor.prov { background: #c8f0c8; grid-column: 4; }
      .auth-actor small { display: block; font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.05em; color: var(--ink-soft); text-transform: none; }
      .auth-stepnum { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-faint); text-align: center; padding-top: 0.6em; }
      .auth-msg { background: var(--paper); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 0.4em 0.7em; }
      .auth-msg.current { background: var(--accent-soft); border-color: var(--accent); border-width: 2px; }
      .auth-msg-label { font-family: var(--font-display); font-size: 0.85rem; letter-spacing: 0.04em; margin-bottom: 0.2em; }
      .auth-arrow { color: var(--accent); margin-left: 0.4em; font-size: 1rem; }
      .auth-msg-body { font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink); word-break: break-word; line-height: 1.4; }
    </style>`,b.innerHTML=d,y.innerHTML=e>0?L[e-1].note:'Click "Next step →" to begin.'}function c(d){return String(d).replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}h()}const k=[{id:"browser",label:"Browser",ttl:60,latency:0,color:"#cfe5ff"},{id:"cdn",label:"CDN",ttl:300,latency:20,color:"#ffe9b3"},{id:"proxy",label:"Reverse Proxy",ttl:120,latency:5,color:"#f7c8c8"},{id:"app",label:"App Cache",ttl:30,latency:2,color:"#e6d6ff"},{id:"origin",label:"Origin (DB)",ttl:0,latency:150,color:"#cccccc"}];function N(i){const e={now:0,caches:{},lastTrace:null,requests:0,hits:0};k.forEach(c=>e.caches[c.id]=null),i.innerHTML=`
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
  `;const b=i.querySelector("#c-stage");i.querySelector("#c-req").addEventListener("click",y),i.querySelector("#c-wait").addEventListener("click",()=>{e.now+=30,p()}),i.querySelector("#c-clear").addEventListener("click",()=>{k.forEach(c=>e.caches[c.id]=null),e.lastTrace=null,p()}),i.querySelector("#c-reset").addEventListener("click",()=>{e.now=0,e.requests=0,e.hits=0,e.lastTrace=null,k.forEach(c=>e.caches[c.id]=null),p()});function y(){e.requests+=1;const c=[];let d=0,n=-1;for(let a=0;a<k.length;a++){const t=k[a];d+=t.latency;const r=e.caches[t.id],s=r!==null&&e.now-r.storedAt<t.ttl;if(a===k.length-1){c.push({layer:t.id,hit:!1,latency:t.latency,action:"fetched from DB"}),n=a;break}if(s){c.push({layer:t.id,hit:!0,latency:t.latency,action:`cache HIT (${t.ttl-(e.now-r.storedAt)}s left)`}),n=a,e.hits+=1;break}c.push({layer:t.id,hit:!1,latency:t.latency,action:"cache MISS"})}for(let a=0;a<n;a++)e.caches[k[a].id]={storedAt:e.now};e.lastTrace=c,p()}function p(){let c='<div class="cc-layers">';if(k.forEach((d,n)=>{var u;const a=e.caches[d.id],t=a!==null&&e.now-a.storedAt<d.ttl,r=a?Math.max(0,d.ttl-(e.now-a.storedAt)):0,s=(u=e.lastTrace)==null?void 0:u.find(v=>v.layer===d.id);let o="";d.id==="origin"?o='<span class="cc-tag origin">always available</span>':t?o=`<span class="cc-tag warm">stored, ${r}s left</span>`:o='<span class="cc-tag cold">empty</span>';const l=s?s.hit?"hit":"miss":"";if(c+=`
        <div class="cc-layer ${l}" style="background: ${d.color}">
          <div class="cc-layer-label">${d.label}</div>
          ${o}
          <div class="cc-layer-meta">${d.latency}ms latency · TTL ${d.ttl||"∞"}s</div>
          ${s?`<div class="cc-layer-result">${h(s.action)}</div>`:""}
        </div>
      `,n<k.length-1){const v=s&&s.hit===!1;c+=`<div class="cc-arrow ${v?"lit":""}">→</div>`}}),c+="</div>",c+=`<style>
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
    </style>`,b.innerHTML=c,i.querySelector("#m-req").textContent=e.requests,i.querySelector("#m-hr").textContent=e.requests===0?"—":`${Math.round(e.hits/e.requests*100)}%`,e.lastTrace){const d=e.lastTrace.reduce((n,a)=>n+a.latency,0);i.querySelector("#m-lat").textContent=`${d}ms`}else i.querySelector("#m-lat").textContent="—";i.querySelector("#m-t").textContent=`${e.now}s`}function h(c){return String(c).replace(/[&<>"']/g,d=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[d])}p()}const z=[{match:/^\/api\//,backend:"api",desc:"starts with /api/"},{match:/^\/static\//,backend:"static",desc:"starts with /static/"},{match:/.*/,backend:"web",desc:"fallback"}],C={api:{label:"API server",addr:"10.0.0.11:8080",color:"#cfe5ff"},static:{label:"Static server",addr:"10.0.0.12:8080",color:"#c8f0c8"},web:{label:"Web server",addr:"10.0.0.13:8080",color:"#ffe9b3"}},P=["https://fundamentalofx.com/api/users/42","https://fundamentalofx.com/static/logo.png","https://fundamentalofx.com/","https://fundamentalofx.com/topics/database/"];function W(i){let e=P[0];i.innerHTML=`
    <div class="widget">
      <div class="widget-title">nginx in slow motion</div>

      <div class="controls">
        <label>Request URL:</label>
        <input class="field" id="p-url" value="${e}" style="flex: 1; min-width: 280px;">
        <select class="field" id="p-preset" style="min-width: 220px;">
          <option value="">— preset —</option>
          ${P.map((a,t)=>`<option value="${t}">${a.replace("https://fundamentalofx.com","")}</option>`).join("")}
        </select>
        <button class="btn btn-accent" id="p-go">Send →</button>
      </div>

      <div class="widget-stage" id="p-stage" style="min-height: 280px;"></div>

      <div class="log" id="p-log"></div>
    </div>
  `;const b=i.querySelector("#p-stage"),y=i.querySelector("#p-log");i.querySelector("#p-url").addEventListener("input",a=>{e=a.target.value}),i.querySelector("#p-preset").addEventListener("change",a=>{const t=a.target.value;t!==""&&(e=P[Number(t)],i.querySelector("#p-url").value=e)}),i.querySelector("#p-go").addEventListener("click",p);async function p(){y.innerHTML="";let a,t=e.startsWith("https://");try{a=new URL(e).pathname+(new URL(e).search||"")}catch{c("err","Invalid URL");return}c("info",`→ Proxy receives: ${t?"HTTPS":"HTTP"} ${a}  (from client 203.0.113.42)`),await n(400),t?(c("ok","Proxy: TLS terminated (certificate for fundamentalofx.com)"),await n(400)):(c("warn","Proxy: HTTP — would normally 301 redirect to HTTPS"),await n(400));const r=z.find(l=>l.match.test(a));c("info",`Proxy: route matched — "${r.desc}" → ${r.backend} backend`),await n(400);const s=["X-Forwarded-For: 203.0.113.42","X-Real-IP: 203.0.113.42",`X-Forwarded-Proto: ${t?"https":"http"}`,"X-Forwarded-Host: fundamentalofx.com"];c("info",`Proxy: added headers — ${s.length} entries`),await n(300);const o=C[r.backend];c("ok",`Proxy → ${o.label} (${o.addr}) over plaintext HTTP`),await n(500),c("ok",`${o.label} ← responded 200 OK`),await n(300),c("ok","Proxy → client: re-encrypted with TLS, 200 OK"),h(r,t,s,o,a)}function h(a,t,r,s,o){let l='<svg viewBox="0 0 800 280" width="100%" style="max-width: 800px;">';l+=`<style>
      .pr-node { stroke: var(--ink); stroke-width: 2.5; }
      .pr-label { font-family: var(--font-display); font-size: 14px; letter-spacing: 1px; fill: var(--ink); }
      .pr-sub { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .pr-link { stroke: var(--ink); stroke-width: 2; marker-end: url(#pr-arrow); }
      .pr-text { font-family: var(--font-mono); font-size: 10px; fill: var(--ink); }
    </style>`,l+=`<defs>
      <marker id="pr-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/>
      </marker>
    </defs>`,l+='<rect class="pr-node" x="20" y="120" width="120" height="50" rx="6" fill="#cfe5ff"/>',l+='<text class="pr-label" x="80" y="142" text-anchor="middle">CLIENT</text>',l+='<text class="pr-sub" x="80" y="158" text-anchor="middle">203.0.113.42</text>',l+='<rect class="pr-node" x="290" y="100" width="180" height="90" rx="6" fill="#f7c8c8"/>',l+='<text class="pr-label" x="380" y="125" text-anchor="middle">REVERSE PROXY</text>',l+='<text class="pr-sub" x="380" y="143" text-anchor="middle">nginx · public IP</text>',l+='<text class="pr-sub" x="380" y="160" text-anchor="middle">TLS terminated</text>',l+=`<text class="pr-sub" x="380" y="176" text-anchor="middle">route: ${d(a.desc)}</text>`;const u=["api","static","web"];u.forEach((g,x)=>{const $=C[g],S=30+x*80,E=g===a.backend;l+=`<rect class="pr-node" x="620" y="${S}" width="160" height="50" rx="6" fill="${$.color}" stroke="${E?"var(--accent)":"var(--ink)"}" stroke-width="${E?3:2}"/>`,l+=`<text class="pr-label" x="700" y="${S+22}" text-anchor="middle">${$.label}</text>`,l+=`<text class="pr-sub" x="700" y="${S+38}" text-anchor="middle">${$.addr}</text>`}),l+='<line class="pr-link" x1="140" y1="145" x2="288" y2="145"/>',l+=`<text class="pr-text" x="214" y="138" text-anchor="middle">${d(t?"HTTPS":"HTTP")} ${d(o)}</text>`;const f=30+u.indexOf(a.backend)*80+25;l+=`<line class="pr-link" x1="470" y1="145" x2="618" y2="${f}"/>`,l+=`<text class="pr-text" x="540" y="${(145+f)/2-5}" text-anchor="middle">HTTP ${d(o)}</text>`,l+="</svg>",b.innerHTML=l}function c(a,t){const r=document.createElement("div");r.className=`entry ${a}`,r.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${d(t)}`,y.prepend(r)}function d(a){return String(a).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function n(a){return new Promise(t=>setTimeout(t,a))}b.innerHTML='<div style="padding: 2rem; text-align: center; color: var(--ink-faint);">Click "Send →" to route a request.</div>'}const F=[{id:"B1",baseLatency:50,color:"#cfe5ff"},{id:"B2",baseLatency:50,color:"#c8f0c8"},{id:"B3",baseLatency:180,color:"#f7c8c8",slow:!0},{id:"B4",baseLatency:50,color:"#ffe9b3"}],O={rr:"Round-robin",least:"Least connections",hash:"IP hash",rand:"Random"};function G(i){const e={strategy:"rr",rrIndex:0,backends:F.map(t=>({...t,active:0,served:0,totalLatency:0})),seed:1,running:!1};i.innerHTML=`
    <div class="widget">
      <div class="widget-title">4 backends, 1 dispatcher</div>

      <div class="controls">
        <label>Strategy:</label>
        <div class="pill-group">
          ${Object.entries(O).map(([t,r],s)=>`
            <input type="radio" name="lb-strat" id="lb-${t}" value="${t}" ${s===0?"checked":""}>
            <label for="lb-${t}">${r}</label>
          `).join("")}
        </div>
        <button class="btn btn-accent" id="lb-burst">Send 20 requests</button>
        <button class="btn btn-ghost" id="lb-reset">Reset</button>
      </div>

      <div class="widget-stage" id="lb-stage" style="min-height: 260px;"></div>

      <div class="callout" id="lb-explain">Pick a strategy and click <em>Send 20 requests</em>. Backend 3 is artificially slow.</div>
    </div>
  `;const b=i.querySelector("#lb-stage");i.querySelectorAll("input[name=lb-strat]").forEach(t=>t.addEventListener("change",r=>{e.strategy=r.target.value,y()})),i.querySelector("#lb-burst").addEventListener("click",c),i.querySelector("#lb-reset").addEventListener("click",y);function y(){e.rrIndex=0,e.backends.forEach(t=>{t.active=0,t.served=0,t.totalLatency=0}),e.seed=Date.now()&65535,n()}function p(){return e.seed=(e.seed*9301+49297)%233280,e.seed/233280}function h(t){if(e.strategy==="rr"){const r=e.backends[e.rrIndex];return e.rrIndex=(e.rrIndex+1)%e.backends.length,r}if(e.strategy==="least"){let r=e.backends[0];for(const s of e.backends)s.active<r.active&&(r=s);return r}if(e.strategy==="hash"){const r=t.split(".").reduce((s,o)=>s*31+Number(o)|0,0);return e.backends[Math.abs(r)%e.backends.length]}if(e.strategy==="rand")return e.backends[Math.floor(p()*e.backends.length)]}async function c(){if(e.running)return;e.running=!0,y();const t=[];for(let r=0;r<20;r++){const s=`203.0.113.${10+r%12}`;t.push({id:r+1,clientIp:s})}for(const r of t){const s=h(r.clientIp);s.active+=1,s.served+=1,n();const o=.8+p()*.4,l=s.baseLatency*o;s.totalLatency+=l,(async(u,v)=>{await a(v*.7),u.active-=1,n()})(s,l),await a(60)}for(;e.backends.some(r=>r.active>0);)await a(80);e.running=!1,d()}function d(){const t=e.backends.map(f=>f.served),r=Math.max(...t),s=Math.min(...t),o=s===0?"infinite":(r/s).toFixed(2),l=t.reduce((f,g)=>f+g,0),u=e.backends.reduce((f,g)=>f+g.totalLatency,0)/l;let v;e.strategy==="rr"?v=`<strong>Round-robin</strong> distributed evenly (${t.join(" / ")}), but B3 — which is 3× slower — got the same load as the fast ones. Average request latency was ${Math.round(u)}ms.`:e.strategy==="least"?v=`<strong>Least connections</strong> sent more traffic to the fast backends (${t.join(" / ")}) because B3 always had more active requests. Average latency: ${Math.round(u)}ms — usually lower than round-robin under skew.`:e.strategy==="hash"?v=`<strong>IP hash</strong> stuck each client to one backend (distribution ${t.join(" / ")}). Same clients always land on the same server — great for sticky sessions, terrible if one backend dies.`:v=`<strong>Random</strong> distribution: ${t.join(" / ")}. At scale this converges to round-robin; on small samples you get noise. Skew ratio max/min: ${o}.`,i.querySelector("#lb-explain").innerHTML=v}function n(){let s='<svg viewBox="0 0 700 240" width="100%" style="max-width:700px">';s+=`<style>
      .lb-node { stroke: var(--ink); stroke-width: 2.5; }
      .lb-label { font-family: var(--font-display); font-size: 18px; letter-spacing: 1.5px; fill: var(--ink); }
      .lb-sub { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .lb-bar-bg { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1; }
      .lb-bar { fill: var(--accent); }
      .lb-link { stroke: var(--ink-soft); stroke-width: 1.5; }
      .lb-counter { font-family: var(--font-mono); font-size: 11px; fill: var(--ink); }
    </style>`,s+='<rect class="lb-node" x="40" y="100" width="120" height="50" rx="6" fill="#ffe9b3"/>',s+='<text class="lb-label" x="100" y="125" text-anchor="middle">LB</text>',s+=`<text class="lb-sub" x="100" y="142" text-anchor="middle">${O[e.strategy]}</text>`,e.backends.forEach((o,l)=>{const u=20+l*55;s+=`<line class="lb-link" x1="160" y1="125" x2="320" y2="${u+20}"/>`,s+=`<rect class="lb-node" x="320" y="${u}" width="120" height="40" rx="5" fill="${o.color}"/>`,s+=`<text class="lb-label" x="380" y="${u+18}" text-anchor="middle" style="font-size: 14px;">${o.id}${o.slow?" (slow)":""}</text>`,s+=`<text class="lb-sub" x="380" y="${u+32}" text-anchor="middle">active: ${o.active} · served: ${o.served}</text>`;const v=Math.max(1,...e.backends.map(g=>g.served)),f=180;s+=`<rect class="lb-bar-bg" x="460" y="${u+12}" width="${f}" height="16" rx="2"/>`,s+=`<rect class="lb-bar" x="460" y="${u+12}" width="${o.served/v*f}" height="16" rx="2"/>`}),s+="</svg>",b.innerHTML=s}function a(t){return new Promise(r=>setTimeout(r,t))}n()}function _(i){const e={capacity:5,refillPerSec:1,tokens:5,lastRefill:performance.now(),history:[],allowed:0,denied:0};i.innerHTML=`
    <div class="widget">
      <div class="widget-title">Token Bucket Limiter</div>

      <div class="controls">
        <label>Capacity:</label>
        <input type="range" min="1" max="20" value="5" id="rl-cap">
        <span style="font-family: var(--font-mono);" id="rl-cap-val">5</span>
        <label>Refill (tokens/sec):</label>
        <input type="range" min="0.5" max="5" step="0.5" value="1" id="rl-rate">
        <span style="font-family: var(--font-mono);" id="rl-rate-val">1</span>
        <button class="btn btn-accent" id="rl-req">Request</button>
        <button class="btn" id="rl-burst">Burst x10</button>
        <button class="btn btn-ghost" id="rl-reset">Reset</button>
      </div>

      <div class="widget-stage" id="rl-stage" style="min-height: 240px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Allowed (200)</div><div class="value" id="m-allow">0</div></div>
        <div class="metric"><div class="label">Denied (429)</div><div class="value" id="m-deny">0</div></div>
        <div class="metric accent"><div class="label">Bucket</div><div class="value" id="m-bucket">5/5</div></div>
      </div>
    </div>
  `;const b=i.querySelector("#rl-stage");i.querySelector("#rl-cap").addEventListener("input",n=>{e.capacity=Number(n.target.value),i.querySelector("#rl-cap-val").textContent=e.capacity,e.tokens=Math.min(e.tokens,e.capacity)}),i.querySelector("#rl-rate").addEventListener("input",n=>{e.refillPerSec=Number(n.target.value),i.querySelector("#rl-rate-val").textContent=e.refillPerSec}),i.querySelector("#rl-req").addEventListener("click",()=>p()),i.querySelector("#rl-burst").addEventListener("click",async()=>{for(let n=0;n<10;n++)p(),await d(120)}),i.querySelector("#rl-reset").addEventListener("click",()=>{e.tokens=e.capacity,e.history=[],e.allowed=0,e.denied=0,e.lastRefill=performance.now()});function y(){const n=performance.now(),t=(n-e.lastRefill)/1e3*e.refillPerSec;e.tokens=Math.min(e.capacity,e.tokens+t),e.lastRefill=n}function p(n){y();let a;e.tokens>=1?(e.tokens-=1,a=!0,e.allowed+=1):(a=!1,e.denied+=1),e.history.push({t:performance.now(),allowed:a}),e.history.length>40&&e.history.shift()}function h(){y();const n=720,a=240;let t=`<svg viewBox="0 0 ${n} ${a}" width="100%" style="max-width:${n}px">`;t+=`<style>
      .rl-label { font-family: var(--font-display); font-size: 14px; letter-spacing: 1.5px; fill: var(--ink); }
      .rl-sub { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .rl-bucket-frame { fill: var(--paper); stroke: var(--ink); stroke-width: 3; }
      .rl-token { fill: var(--accent); stroke: var(--ink); stroke-width: 1.5; }
      .rl-token-empty { fill: var(--paper-deep); stroke: var(--ink-faint); stroke-width: 1.5; stroke-dasharray: 2 2; }
      .rl-history-dot { stroke: var(--ink); stroke-width: 1; }
      .rl-allowed { fill: #2a8a3e; }
      .rl-denied { fill: var(--accent); }
      .rl-axis { font-family: var(--font-mono); font-size: 9px; fill: var(--ink-soft); }
    </style>`;const r=50,s=30,o=120,l=160;t+=`<text class="rl-label" x="${r+o/2}" y="${s-8}" text-anchor="middle">TOKEN BUCKET</text>`,t+=`<rect class="rl-bucket-frame" x="${r}" y="${s}" width="${o}" height="${l}" rx="6"/>`;const u=12,v=6;for(let x=0;x<e.capacity;x++){const $=Math.floor(x/4),S=x%4,E=r+18+S*(u*2+v),M=s+l-18-$*(u*2+v),B=x<Math.floor(e.tokens);t+=`<circle class="${B?"rl-token":"rl-token-empty"}" cx="${E}" cy="${M}" r="${u}"/>`}t+=`<text class="rl-sub" x="${r+o/2}" y="${s+l+16}" text-anchor="middle">${e.tokens.toFixed(1)} / ${e.capacity}</text>`,t+=`<text class="rl-sub" x="${r+o/2}" y="${s+l+30}" text-anchor="middle">+${e.refillPerSec}/sec</text>`;const f=230,g=n-f-20;t+=`<text class="rl-label" x="${f}" y="${s-8}">RECENT REQUESTS</text>`,t+=`<line x1="${f}" y1="${a/2}" x2="${f+g}" y2="${a/2}" stroke="var(--ink-soft)" stroke-width="1"/>`,t+=`<text class="rl-axis" x="${f}" y="${a/2+16}">oldest</text>`,t+=`<text class="rl-axis" x="${f+g}" y="${a/2+16}" text-anchor="end">newest →</text>`,e.history.forEach((x,$)=>{const S=f+$/Math.max(1,e.history.length-1)*g,E=a/2+(x.allowed?-18:18);t+=`<circle class="rl-history-dot ${x.allowed?"rl-allowed":"rl-denied"}" cx="${S}" cy="${E}" r="6"/>`}),e.history.length===0&&(t+=`<text class="rl-sub" x="${f+g/2}" y="${a/2-30}" text-anchor="middle">click Request to start</text>`),t+=`<circle class="rl-history-dot rl-allowed" cx="${f+60}" cy="${a-18}" r="6"/>`,t+=`<text class="rl-sub" x="${f+72}" y="${a-14}">allowed (200)</text>`,t+=`<circle class="rl-history-dot rl-denied" cx="${f+200}" cy="${a-18}" r="6"/>`,t+=`<text class="rl-sub" x="${f+212}" y="${a-14}">denied (429)</text>`,t+="</svg>",b.innerHTML=t,i.querySelector("#m-allow").textContent=e.allowed,i.querySelector("#m-deny").textContent=e.denied,i.querySelector("#m-bucket").textContent=`${e.tokens.toFixed(1)}/${e.capacity}`}function c(){h(),requestAnimationFrame(c)}c();function d(n){return new Promise(a=>setTimeout(a,n))}}const w=[{id:"browser",label:"Browser",latency:0,cacheable:!0,hitDefault:!1},{id:"cdn",label:"CDN",latency:25,cacheable:!0,hitDefault:!1},{id:"lb",label:"Load Balancer",latency:5,cacheable:!1,hitDefault:!1},{id:"proxy",label:"Reverse Proxy",latency:3,cacheable:!0,hitDefault:!1},{id:"app",label:"App Server",latency:30,cacheable:!1,hitDefault:!1},{id:"cache",label:"App Cache",latency:5,cacheable:!0,hitDefault:!1},{id:"db",label:"Database",latency:50,cacheable:!1,hitDefault:!1}];function K(i){const e={cacheHits:{browser:!1,cdn:!1,proxy:!1,cache:!1},trace:null};i.innerHTML=`
    <div class="widget">
      <div class="widget-title">A Request, End to End</div>
      <p class="widget-hint">Toggle which caching layers hit. Send the request. See the waterfall.</p>

      <div class="controls">
        <label>Hit cache at:</label>
        ${w.filter(n=>n.cacheable).map(n=>`
          <label style="display:inline-flex; gap: 0.3em; align-items: center;">
            <input type="checkbox" data-layer="${n.id}"> ${n.label}
          </label>
        `).join("")}
        <button class="btn btn-accent" id="lf-run">Send request</button>
        <button class="btn btn-ghost" id="lf-reset">Reset</button>
      </div>

      <div class="widget-stage" id="lf-stage" style="min-height: 380px;"></div>

      <div class="callout" id="lf-explain">Send a request to see the journey. Toggle "Hit cache at" boxes to short-circuit at any tier.</div>
    </div>
  `;const b=i.querySelector("#lf-stage");i.querySelectorAll("input[data-layer]").forEach(n=>n.addEventListener("change",a=>{e.cacheHits[a.target.dataset.layer]=a.target.checked})),i.querySelector("#lf-run").addEventListener("click",y),i.querySelector("#lf-reset").addEventListener("click",()=>{e.trace=null,Object.keys(e.cacheHits).forEach(n=>e.cacheHits[n]=!1),i.querySelectorAll("input[data-layer]").forEach(n=>n.checked=!1),h()});async function y(){e.trace=[];let n=-1;for(let a=0;a<w.length;a++){const t=w[a];if(e.trace.push({layer:t.id,latency:t.latency,action:"arrived",hit:!1}),h(),await d(220),t.cacheable&&e.cacheHits[t.id]&&t.id!=="cache"){const r=e.trace[e.trace.length-1];r.action="cache HIT — serving response",r.hit=!0,n=a;break}if(t.cacheable&&e.cacheHits[t.id]&&t.id==="cache"){const r=e.trace[e.trace.length-1];r.action="cache HIT — return to app",r.hit=!0,n=a;break}if(a===w.length-1){const r=e.trace[e.trace.length-1];r.action="queried database",n=a}}for(let a=n-1;a>=0;a--){const t=w[a];e.trace.push({layer:t.id,latency:t.latency,action:"forwarding response",hit:!1,returning:!0}),h(),await d(180)}p()}function p(){const n=e.trace.reduce((r,s)=>r+s.latency,0),a=e.trace.find(r=>r.hit),t=a?w.find(r=>r.id===a.layer).label:"database";i.querySelector("#lf-explain").innerHTML=`Total request time: <strong>${n}ms</strong>. Resolved at the <strong>${t}</strong>. ${a?"Each upstream cache hit saves a roundtrip to the next layer — that's why a 99% CDN hit rate makes your origin invisible.":"No caches hit — the request went all the way to the database. This is the worst-case path; real traffic should be much faster on average."}`}function h(){let n=`
      <div class="lf-chain">
    `;if(w.forEach((a,t)=>{var u;const r=(u=e.trace)==null?void 0:u.find(v=>v.layer===a.id),s=e.cacheHits[a.id]&&a.cacheable,o=!!r,l=o?r.hit?"visit-hit":"visit":"";r?r.action:a.cacheable,n+=`
        <div class="lf-node ${l}">
          <div class="lf-node-label">${a.label}</div>
          <div class="lf-node-meta">${a.latency}ms</div>
          ${o?`<div class="lf-node-action">${c(r.action)}</div>`:""}
        </div>
      `,t<w.length-1&&(n+=`<div class="lf-arrow ${o?"lit":""}">↓</div>`)}),n+="</div>",e.trace&&e.trace.length){const a=e.trace.reduce((r,s)=>r+s.latency,0);let t=0;n+='<div class="lf-waterfall">',n+=`<div class="lf-waterfall-title">Waterfall (${a}ms total)</div>`,e.trace.forEach(r=>{const s=w.find(u=>u.id===r.layer),o=r.latency/Math.max(1,a)*100,l=t/Math.max(1,a)*100;t+=r.latency,n+=`
          <div class="lf-wf-row">
            <div class="lf-wf-label">${c(s.label)}${r.returning?" ↩":""}</div>
            <div class="lf-wf-track">
              <div class="lf-wf-bar ${r.hit?"hit":""}" style="margin-left: ${l}%; width: ${o}%;">${r.latency}ms</div>
            </div>
          </div>
        `}),n+="</div>"}n+=`<style>
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
    </style>`,b.innerHTML=n}function c(n){return String(n).replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function d(n){return new Promise(a=>setTimeout(a,n))}h()}const T=i=>()=>m.jsx(I,{init:i}),V={slug:"backend",title:"Backend",intro:m.jsx(m.Fragment,{children:"Eight lessons on what servers actually do with the requests they receive — HTTP basics, REST design, sessions, caching layers, reverse proxies, load balancing, rate limiting, and the full request lifecycle."}),lessons:[{slug:"http",number:"01",title:"Anatomy of HTTP",blurb:"Verbs, status codes, headers, body. The alphabet every web service is built from.",Widget:T(U),intro:m.jsx(m.Fragment,{children:"HTTP is plain text with structure: a verb, a path, headers, optional body. Everything else in backend builds on it."}),sections:[],takeaways:["GET reads, POST creates, PUT replaces, PATCH updates, DELETE removes — most violations cause real bugs.","Status codes group: 2xx ok, 3xx redirect, 4xx client error, 5xx server error.","Headers carry everything HTTP itself can't express: auth, caching, content type, language.","HTTP is stateless — sessions are layered on top via cookies or tokens."]},{slug:"rest",number:"02",title:"REST & API Design",blurb:"Resources vs RPC. Idempotency. Why PUT and POST mean different things. Critique a real API.",Widget:T(j),intro:m.jsx(m.Fragment,{children:"REST treats URLs as nouns (resources) and verbs as operations on them. Done well, the API becomes predictable; done badly, you get verbs in URLs and inconsistent status codes."}),sections:[],takeaways:["Resources, not actions: /users/42 not /getUser?id=42.","PUT is idempotent — same call twice = same result. POST is not.","Use status codes for failure modes. 422 ≠ 400 ≠ 409.","Versioning belongs in the URL (/v2/) or header — not the body."]},{slug:"auth",number:"03",title:"Sessions & Auth",blurb:"Cookies, tokens, JWT, OAuth — watch a login flow with three parties move in real time.",Widget:T(D),intro:m.jsx(m.Fragment,{children:'HTTP is stateless. To remember "this user is logged in", you need cookies or tokens. Different schemes trade off where the state lives and who trusts whom.'}),sections:[],takeaways:["Cookies live in the browser, sent automatically. Tokens live in storage, sent explicitly.","JWTs are stateless tokens — the server doesn't store sessions.",'OAuth is "let another service log this user in for me" — three-party flow.',"Never store secrets in localStorage. XSS will steal them."]},{slug:"caching",number:"04",title:"Caching",blurb:"Browser, CDN, reverse proxy, app. A multi-tier cache simulator with TTLs and invalidation.",Widget:T(N),intro:m.jsx(m.Fragment,{children:"The fastest request is the one you don't make. Cache layers between the user and the origin save round-trips at every level."}),sections:[],takeaways:["Cache-Control headers are the contract. max-age, public, private, no-store all mean different things.","CDN caching depends on Vary and origin headers — get them wrong and users see each other's data.","Invalidation is the hardest part. Either short TTLs, or explicit purges, or content-hashed URLs.","Cache the thing that's expensive to compute, not the thing that's cheap to fetch."]},{slug:"proxy",number:"05",title:"Reverse Proxies",blurb:"What nginx really does: terminate TLS, route paths, rewrite headers, hide backends.",Widget:T(W),intro:m.jsx(m.Fragment,{children:"A reverse proxy sits in front of your app servers and looks like one server to clients. It handles TLS, routes paths to different backends, and can rewrite headers on the fly."}),sections:[],takeaways:["Termination: TLS ends at the proxy; backend speaks plain HTTP.","Routing: /api → app server, /static → CDN, /admin → restricted backend.","Header rewrites: add X-Forwarded-For, strip cookies, inject auth.","nginx, HAProxy, Envoy, Caddy — different syntax, same job."]},{slug:"load-balancing",number:"06",title:"Load Balancing",blurb:"Four backends, three strategies. Watch a stream of requests distribute (fairly or not).",Widget:T(G),intro:m.jsx(m.Fragment,{children:"Spread incoming requests across multiple servers. The strategy you pick decides whether load stays balanced and whether session affinity sticks."}),sections:[],takeaways:["Round-robin: simplest, ignores server load.","Least-connections: better when request durations vary.","IP hash: sticky — same client always hits the same server. Bad for fairness.","Health checks are critical: pull dead servers out of rotation automatically."]},{slug:"rate-limit",number:"07",title:"Rate Limiting",blurb:"Token bucket in slow motion. Try to overwhelm it — see what the limiter says.",Widget:T(_),intro:m.jsx(m.Fragment,{children:"Cap how often a client can call your API. Most rate limiters use a token bucket — replenish tokens at a fixed rate, deny when the bucket is empty."}),sections:[],takeaways:["Token bucket: smooth refill, allows bursts up to bucket size.","Sliding window: fairer but harder to implement.","Per-IP is the default; per-user is better once you have auth.","429 Too Many Requests is the right status code — include Retry-After."]},{slug:"lifecycle",number:"08",title:"Request Lifecycle",blurb:"A request goes from browser → CDN → LB → app → DB → back. Watch the whole journey.",Widget:T(K),intro:m.jsx(m.Fragment,{children:"End-to-end: every layer the request crosses, every cache it might hit, every server it might land on. The fast paths and the slow paths laid out side by side."}),sections:[],takeaways:["CDN cache hit = nothing else runs. Fastest possible response.","CDN miss → origin → LB → app server → maybe DB → back through every layer.","p50 latency is the cache-hit path. p99 is the full round-trip.","Tracing tools (Jaeger, Honeycomb) show exactly where time goes per request."]}]};export{V as manifest};
