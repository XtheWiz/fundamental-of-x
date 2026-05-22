import{j as r}from"./main-BHRJeYOh.js";import{L as ne}from"./LegacyWidget-Di7ysmDJ.js";function re(t){t.innerHTML=`
    <div class="widget">
      <div class="widget-title">The Four Guarantees</div>
      <div class="controls">
        <div class="pill-group" id="acid-tabs">
          <input type="radio" name="acid-tab" id="tab-a" value="a" checked>
          <label for="tab-a">A · Atomicity</label>
          <input type="radio" name="acid-tab" id="tab-c" value="c">
          <label for="tab-c">C · Consistency</label>
          <input type="radio" name="acid-tab" id="tab-i" value="i">
          <label for="tab-i">I · Isolation</label>
          <input type="radio" name="acid-tab" id="tab-d" value="d">
          <label for="tab-d">D · Durability</label>
        </div>
      </div>
      <div id="acid-pane"></div>
    </div>
  `;const e=t.querySelector("#acid-pane");t.querySelectorAll("input[name=acid-tab]").forEach(i=>i.addEventListener("change",g=>o(g.target.value))),o("a");function o(i){e.innerHTML="",i==="a"&&le(e),i==="c"&&oe(e),i==="i"&&de(e),i==="d"&&ce(e)}}function le(t){let e=100,o=50,i=!1;t.innerHTML=`
    <h3 style="font-family: var(--font-display); letter-spacing: 0.04em;">Bank Transfer</h3>
    <p>Transfer $30 from Alice to Bob. Two operations:</p>
    <ol><li>Debit Alice by $30</li><li>Credit Bob by $30</li></ol>
    <p>If the database crashes <em>between</em> step 1 and step 2, atomicity requires both to revert.</p>

    <div class="widget-stage" style="display:flex; gap: 2rem; justify-content: center; align-items: center;">
      <div class="account" id="acc-a"></div>
      <div class="arrow">→</div>
      <div class="account" id="acc-b"></div>
    </div>
    <div class="controls">
      <button class="btn btn-accent" id="a-success">Transfer (no crash)</button>
      <button class="btn" id="a-crash">Transfer + crash after step 1</button>
      <button class="btn btn-ghost" id="a-reset">Reset</button>
    </div>
    <div class="log" id="a-log"></div>
    <style>
      .account { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 1rem; min-width: 140px; text-align: center; box-shadow: 3px 3px 0 var(--ink); }
      .account h4 { font-family: var(--font-display); font-size: 1.4rem; margin: 0; letter-spacing: 0.04em; }
      .account .bal { font-family: var(--font-mono); font-size: 1.8rem; margin-top: 0.4em; }
      .arrow { font-size: 2rem; color: var(--accent); font-family: var(--font-display); }
    </style>
  `;function g(){t.querySelector("#acc-a").innerHTML=`<h4>Alice</h4><div class="bal">$${e}</div>`,t.querySelector("#acc-b").innerHTML=`<h4>Bob</h4><div class="bal">$${o}</div>`}g();const T=t.querySelector("#a-log");function h(f,u){const p=document.createElement("div");p.className=`entry ${f}`,p.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${u}`,T.prepend(p)}t.querySelector("#a-success").addEventListener("click",async()=>{i||(i=!0,h("info","BEGIN TRANSACTION"),await q(400),e-=30,g(),h("info",`UPDATE alice SET balance = balance - 30  // alice=${e}`),await q(700),o+=30,g(),h("info",`UPDATE bob SET balance = balance + 30  // bob=${o}`),await q(400),h("ok","COMMIT — both writes durable"),i=!1)}),t.querySelector("#a-crash").addEventListener("click",async()=>{if(i)return;i=!0;const f=e,u=o;h("info","BEGIN TRANSACTION"),await q(400),e-=30,g(),h("info",`UPDATE alice SET balance = balance - 30  // alice=${e}`),await q(700),h("err","💥 CRASH!  step 2 never ran."),await q(600),h("info","Recovery: WAL has no COMMIT for this txn — ROLLBACK"),await q(500),e=f,o=u,g(),h("ok","Atomicity holds. Both accounts restored."),i=!1}),t.querySelector("#a-reset").addEventListener("click",()=>{e=100,o=50,g(),T.innerHTML=""})}function oe(t){t.innerHTML=`
    <h3 style="font-family: var(--font-display); letter-spacing: 0.04em;">Constraint Enforcement</h3>
    <p>Table <code>users</code> has <code>email UNIQUE NOT NULL</code> and <code>age &gt;= 0</code>.</p>
    <p>Try inserting rows. The database will reject anything that breaks a constraint — that's consistency.</p>

    <div class="widget-stage">
      <table class="c-table">
        <thead><tr><th>id</th><th>email</th><th>age</th></tr></thead>
        <tbody id="c-rows"></tbody>
      </table>
    </div>

    <div class="controls">
      <button class="btn" data-insert="ok-1">INSERT VALUES (1, 'aiko@x.io', 28)</button>
      <button class="btn" data-insert="ok-2">INSERT VALUES (2, 'mateo@x.io', 41)</button>
      <button class="btn" data-insert="dup">INSERT VALUES (3, 'aiko@x.io', 30)  ← duplicate</button>
      <button class="btn" data-insert="null">INSERT VALUES (4, NULL, 22)  ← NULL email</button>
      <button class="btn" data-insert="neg">INSERT VALUES (5, 'kid@x.io', -3)  ← negative age</button>
      <button class="btn btn-ghost" id="c-reset">Reset</button>
    </div>

    <div class="log" id="c-log"></div>

    <style>
      .c-table { width: 100%; border-collapse: collapse; }
      .c-table th, .c-table td { border: 1.5px solid var(--ink); padding: 0.4em 0.8em; font-family: var(--font-mono); font-size: 0.9rem; }
      .c-table th { background: var(--paper-deep); font-family: var(--font-display); letter-spacing: 0.04em; font-weight: 400; }
    </style>
  `;const e=[],o=t.querySelector("#c-rows"),i=t.querySelector("#c-log");function g(f,u){const p=document.createElement("div");p.className=`entry ${f}`,p.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${u}`,i.prepend(p)}function T(){o.innerHTML=e.map(f=>`<tr><td>${f.id}</td><td>${f.email}</td><td>${f.age}</td></tr>`).join("")||'<tr><td colspan="3" style="text-align:center; color: var(--ink-faint);">(empty)</td></tr>'}T();const h={"ok-1":{id:1,email:"aiko@x.io",age:28},"ok-2":{id:2,email:"mateo@x.io",age:41},dup:{id:3,email:"aiko@x.io",age:30},null:{id:4,email:null,age:22},neg:{id:5,email:"kid@x.io",age:-3}};t.querySelectorAll("[data-insert]").forEach(f=>{f.addEventListener("click",()=>{const u=h[f.dataset.insert];if(e.some(p=>p.email===u.email&&u.email!=null)){g("err","❌ UNIQUE violation on email — rolled back");return}if(u.email==null){g("err","❌ NOT NULL violation on email — rolled back");return}if(u.age<0){g("err","❌ CHECK constraint (age >= 0) failed — rolled back");return}e.push(u),T(),g("ok",`✅ INSERT id=${u.id} committed`)})}),t.querySelector("#c-reset").addEventListener("click",()=>{e.length=0,T(),i.innerHTML=""})}function de(t){t.innerHTML=`
    <h3 style="font-family: var(--font-display); letter-spacing: 0.04em;">Two Concurrent Transactions</h3>
    <p>Account starts at $100. T1 wants to deposit $50, T2 wants to read the balance.</p>
    <p>Without isolation, T2 might read T1's <em>in-progress</em> value (a "dirty read"). The database serializes their effects.</p>

    <div class="widget-stage" id="i-stage" style="display: flex; flex-direction: column; gap: 0.4rem;"></div>
    <div class="controls">
      <button class="btn btn-accent" id="i-run">Run with Isolation</button>
      <button class="btn" id="i-dirty">Run without (allow dirty read)</button>
      <button class="btn btn-ghost" id="i-reset">Reset</button>
    </div>
    <div class="callout" id="i-explain">Pick an option to see two transactions interleave. With isolation, T2 sees either $100 or $150 — never an in-flight value.</div>
  `;const e=t.querySelector("#i-stage"),o=t.querySelector("#i-explain");function i(f){e.innerHTML=f}async function g(){let f=100;i(h("T1","— BEGIN —",0,100,"commit")+h("T2","— BEGIN —",0,100,"commit")+h("DB",`balance = $${f}`,0,100,"read")),await q(500),i(h("T1","UPDATE balance = balance + 50  (locks row)",0,100,"write")+h("T2","... waits for T1 ...",0,100,"read")+h("DB",`balance = $${f} (uncommitted in T1)`,0,100,"read")),await q(900),f=150,i(h("T1","COMMIT",0,100,"commit")+h("T2","SELECT balance",0,100,"read")+h("DB",`balance = $${f}`,0,100,"read")),await q(700),o.innerHTML=`<strong>T2 saw $${f}</strong> — the committed value. Never saw the in-progress write. ✅`}async function T(){i(h("T1","BEGIN; UPDATE balance += 50 (uncommitted)",0,100,"write")+h("T2","BEGIN; SELECT balance",0,100,"read")+h("DB","balance = $150 (in-flight!)",0,100,"read")),await q(900),i(h("T1","ROLLBACK",0,100,"abort")+h("T2","(saw $150 — but it never existed)",0,100,"read")+h("DB","balance = $100",0,100,"read")),await q(600),o.innerHTML="<strong>T2 read $150 — a value that was rolled back.</strong> This is a dirty read. Don't let your database do this. ❌"}t.querySelector("#i-run").addEventListener("click",g),t.querySelector("#i-dirty").addEventListener("click",T),t.querySelector("#i-reset").addEventListener("click",()=>{i(""),o.innerHTML="Pick an option to see two transactions interleave."});function h(f,u,p,d,b){return`<div class="timeline"><div class="actor">${f}</div><div class="track"><div class="step ${b}" style="left:${p}%; width:${d-p}%;">${u}</div></div></div>`}}function ce(t){t.innerHTML=`
    <h3 style="font-family: var(--font-display); letter-spacing: 0.04em;">Crash Survival</h3>
    <p>Once the database says "COMMIT", the write must survive a power cut. The trick is the <strong>Write-Ahead Log</strong> (Lesson 5). Here's a preview.</p>

    <div class="widget-stage" id="d-stage"></div>

    <div class="controls">
      <button class="btn btn-accent" id="d-after">Crash AFTER commit</button>
      <button class="btn" id="d-before">Crash BEFORE commit</button>
      <button class="btn btn-ghost" id="d-reset">Reset</button>
    </div>
    <div class="callout" id="d-explain">A commit writes to the log first, then later flushes to the data pages. Recovery replays the log.</div>
  `;const e=t.querySelector("#d-stage"),o=t.querySelector("#d-explain");function i(h,f,u,p){e.innerHTML=`
      <div class="d-layers">
        <div class="d-layer">
          <div class="d-label">CLIENT</div>
          <div class="d-box">${p}</div>
        </div>
        <div class="d-layer">
          <div class="d-label">MEMORY (buffer pool)</div>
          <div class="d-box">balance = $${h}</div>
        </div>
        <div class="d-layer">
          <div class="d-label">WAL (on disk)</div>
          <div class="d-box wal">${f.map(d=>`<span class="wal-cell ${d.committed?"committed":"uncommitted"}">${d.text}</span>`).join("")||"(empty)"}</div>
        </div>
        <div class="d-layer">
          <div class="d-label">DATA FILE (on disk)</div>
          <div class="d-box">balance = $${u}</div>
        </div>
      </div>
      <style>
        .d-layers { display: flex; flex-direction: column; gap: 0.5rem; }
        .d-layer { display: grid; grid-template-columns: 180px 1fr; align-items: center; gap: 0.6rem; }
        .d-label { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-soft); letter-spacing: 0.1em; text-transform: uppercase; text-align: right; }
        .d-box { padding: 0.5em 0.8em; background: var(--paper); border: 1.5px solid var(--ink); border-radius: var(--radius); font-family: var(--font-mono); font-size: 0.95rem; }
        .d-box.wal { font-family: inherit; padding: 0.3em; }
      </style>
    `}async function g(){i(100,[],100,"Idle"),await q(500),i(150,[{text:"UPD bal=150",committed:!1}],100,"Pending"),await q(700),i(150,[{text:"UPD bal=150",committed:!0},{text:"COMMIT",committed:!0}],100,"✅ Acked"),await q(700),o.innerHTML='💥 <strong>Crash!</strong> Memory and data file are out of sync — but the WAL says "COMMIT"...',i("?",[{text:"UPD bal=150",committed:!0},{text:"COMMIT",committed:!0}],100,"⚡ Crash"),await q(900),i(150,[{text:"UPD bal=150",committed:!0},{text:"COMMIT",committed:!0},{text:"REPLAY",committed:!0}],150,"Recovered"),o.innerHTML="Recovery replays the committed WAL entries into the data file. <strong>The committed write survived.</strong> ✅ Durability holds."}async function T(){i(100,[],100,"Idle"),await q(500),i(150,[{text:"UPD bal=150",committed:!1}],100,"Pending (no commit yet)"),await q(900),o.innerHTML="💥 <strong>Crash!</strong> The client never got a COMMIT ack. The WAL entry is uncommitted.",i("?",[{text:"UPD bal=150",committed:!1}],100,"⚡ Crash"),await q(800),i(100,[],100,"Recovered"),o.innerHTML="Recovery discards uncommitted WAL entries. <strong>Balance is still $100.</strong> ✅ No phantom write — the client wasn't promised durability."}t.querySelector("#d-after").addEventListener("click",g),t.querySelector("#d-before").addEventListener("click",T),t.querySelector("#d-reset").addEventListener("click",()=>{i(100,[],100,"Idle"),o.innerHTML="A commit writes to the log first, then later flushes to the data pages. Recovery replays the log."}),i(100,[],100,"Idle")}function q(t){return new Promise(e=>setTimeout(e,t))}const ue=4,_=ue-1;let he=0;function Q(t=!0){return{id:++he,keys:[],children:[],isLeaf:t}}function pe(t){let e=null,o=new Set,i=null,g=null;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Build a B-Tree</div>
      <p class="widget-hint">Max ${_} keys per node. When a node overflows on insert, the median key is pushed up to its parent.</p>

      <div class="controls">
        <input type="number" class="field" id="bt-key" placeholder="key" style="width: 90px;">
        <button class="btn btn-accent" id="bt-insert">Insert</button>
        <button class="btn" id="bt-search">Search</button>
        <button class="btn" id="bt-bulk">Insert 1..15</button>
        <button class="btn" id="bt-random">Insert 5 random</button>
        <button class="btn btn-ghost" id="bt-clear">Clear</button>
      </div>

      <div class="widget-stage" id="bt-stage" style="min-height: 220px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Keys</div><div class="value" id="bt-count">0</div></div>
        <div class="metric"><div class="label">Height</div><div class="value" id="bt-height">0</div></div>
        <div class="metric"><div class="label">Last search ops</div><div class="value" id="bt-ops">—</div></div>
        <div class="metric accent"><div class="label">Vs. table scan</div><div class="value" id="bt-cmp">—</div></div>
      </div>

      <div class="callout" id="bt-explain">Tip: insert keys 1..15 and watch the tree grow from 1 to 3 levels.</div>
    </div>
  `;const T=t.querySelector("#bt-stage"),h=t.querySelector("#bt-explain"),f=t.querySelector("#bt-count"),u=t.querySelector("#bt-height"),p=t.querySelector("#bt-ops"),d=t.querySelector("#bt-cmp"),b=t.querySelector("#bt-key");t.querySelector("#bt-insert").addEventListener("click",()=>{const s=Number(b.value);Number.isFinite(s)&&(n(s),b.value="",b.focus())}),b.addEventListener("keydown",s=>{s.key==="Enter"&&t.querySelector("#bt-insert").click()}),t.querySelector("#bt-search").addEventListener("click",()=>{const s=Number(b.value);Number.isFinite(s)&&S(s)}),t.querySelector("#bt-bulk").addEventListener("click",()=>{v();for(let s=1;s<=15;s++)l(s);M(),y("Inserted 1..15. Notice how a flat node of 1..3 split, then split again as more arrived.")}),t.querySelector("#bt-random").addEventListener("click",()=>{const s=new Set(L(e));let c=0,m=0;for(;c<5&&m<100;){const k=Math.floor(Math.random()*99)+1;m++,!s.has(k)&&(s.add(k),l(k),c++)}M(),y("Inserted 5 random keys.")}),t.querySelector("#bt-clear").addEventListener("click",()=>{v(),M(),y("Tree cleared.")});function v(){e=null,o.clear(),i=null,g=null}function l(s){if(!e){e=Q(!0),e.keys.push(s);return}if(e.keys.length>=_){const c=Q(!1);c.children.push(e),E(c,0),e=c}w(e,s)}function n(s){if(L(e).includes(s)){y(`${s} is already in the tree — duplicates not inserted.`);return}l(s),M(),y(`Inserted ${s}.`)}function w(s,c){let m=s.keys.length-1;if(s.isLeaf){for(;m>=0&&s.keys[m]>c;)m--;s.keys.splice(m+1,0,c);return}for(;m>=0&&s.keys[m]>c;)m--;m++,s.children[m].keys.length>=_&&(E(s,m),s.keys[m]<c&&m++),w(s.children[m],c)}function E(s,c){const m=s.children[c],k=Math.floor(m.keys.length/2),I=m.keys[k],R=Q(m.isLeaf);R.keys=m.keys.slice(k+1),m.keys=m.keys.slice(0,k),m.isLeaf||(R.children=m.children.slice(k+1),m.children=m.children.slice(0,k+1)),s.children.splice(c+1,0,R),s.keys.splice(c,0,I)}function S(s){o.clear(),g=null;let c=e,m=0;for(;c;){o.add(c.id),m+=1;let k=0;for(;k<c.keys.length&&s>c.keys[k];)k++;if(k<c.keys.length&&c.keys[k]===s){g=c.id,i=m,M();const I=L(e).length;y(`Found <strong>${s}</strong> in ${m} node visit(s). A table scan would touch ~${I} rows.`);return}if(c.isLeaf){i=m,M();const I=L(e).length;y(`<strong>${s}</strong> not found after ${m} node visit(s). A table scan would still touch all ${I} rows to be sure.`);return}c=c.children[k]}y("Tree is empty.")}function L(s){if(!s)return[];const c=[...s.keys];return s.isLeaf||s.children.forEach(m=>c.push(...L(m))),c.sort((m,k)=>m-k)}function $(s){return s?s.isLeaf?1:1+$(s.children[0]):0}function M(){const s=L(e);if(f.textContent=s.length,u.textContent=$(e),p.textContent=i??"—",i!=null){const O=((s.length||1)/i).toFixed(1);d.textContent=`${O}× faster`}else d.textContent="—";if(!e){T.innerHTML='<div style="text-align:center; color: var(--ink-faint); padding: 2rem;">Empty tree. Insert a key to begin.</div>';return}const c=C(e),k=Math.max(...c.map(x=>x.x+x.width))+40,I=Math.max(...c.map(x=>x.y))+70;let R=`<svg viewBox="0 0 ${k} ${I}" width="100%" style="max-width:${k}px; max-height: 460px;">`;R+=`<style>
      .bt-node-rect { fill: var(--paper); stroke: var(--ink); stroke-width: 2.5; }
      .bt-node-rect.path { stroke: var(--accent); stroke-width: 3; }
      .bt-node-rect.found { fill: var(--accent-soft); stroke: var(--accent); }
      .bt-key { font-family: var(--font-mono); font-size: 14px; fill: var(--ink); }
      .bt-key.found { fill: var(--accent); font-weight: 600; }
      .bt-link { stroke: var(--ink-soft); stroke-width: 1.5; fill: none; }
      .bt-link.path { stroke: var(--accent); stroke-width: 2.5; }
      .bt-slot-div { stroke: var(--ink); stroke-width: 1; }
    </style>`,c.forEach(x=>{x.node.isLeaf||x.node.children.forEach((O,A)=>{const N=c.find(G=>G.node.id===O.id);if(!N)return;const j=x.x+x.width*(A+.5)/x.node.children.length,H=x.y+32,z=N.x+N.width/2,B=N.y,Y=o.has(x.node.id)&&o.has(O.id);R+=`<path class="bt-link ${Y?"path":""}" d="M ${j} ${H} C ${j} ${(H+B)/2}, ${z} ${(H+B)/2}, ${z} ${B}"/>`})}),c.forEach(x=>{const O=o.has(x.node.id),A=x.node.id===g;R+=`<rect class="bt-node-rect ${O?"path":""} ${A?"found":""}" x="${x.x}" y="${x.y}" width="${x.width}" height="32" rx="3"/>`;const N=x.width/x.node.keys.length;x.node.keys.forEach((j,H)=>{H>0&&(R+=`<line class="bt-slot-div" x1="${x.x+N*H}" y1="${x.y}" x2="${x.x+N*H}" y2="${x.y+32}"/>`),R+=`<text class="bt-key ${A?"found":""}" x="${x.x+N*(H+.5)}" y="${x.y+21}" text-anchor="middle">${j}</text>`})}),R+="</svg>",T.innerHTML=R}function C(s){const c=[];let m=20;const k=80,I=38,R=14;function x(A,N){const j=A.keys.length*I;let H;if(A.isLeaf)H=m,m+=j+R*2;else{const B=A.children.map(ie=>x(ie,N+1)),Y=B[0],G=B[B.length-1];H=(Y.x+(G.x+G.width))/2-j/2}const z={node:A,x:H,y:20+N*k,width:j};return c.push(z),z}x(s,0);const O=Math.min(...c.map(A=>A.x));if(O<20){const A=20-O;c.forEach(N=>N.x+=A)}return c}function y(s){h.innerHTML=s}M()}const D=["id","name","city","age","price"],P=[[1,"Aiko","Tokyo",29,120],[2,"Mateo","Lima",41,80],[3,"Priya","Mumbai",34,240],[4,"Kenji","Osaka",22,60],[5,"Lena","Berlin",37,150],[6,"Diego","Bogota",28,200],[7,"Yuna","Seoul",45,310],[8,"Omar","Cairo",31,90]],V=[{id:"point",label:"SELECT * WHERE id = 4",explain:"Fetch every column of a single row. Row store reads ~1 page; column store reads from 5 different pages.",cells:(t,e)=>P[e][0]===4},{id:"agg",label:"SELECT SUM(price)",explain:"Read one column across every row. Column store reads 1 page; row store has to read all 8 pages and skip 80% of each.",cells:(t,e)=>t==="price"},{id:"narrow",label:"SELECT name, city FROM users",explain:"Two columns, all rows. Column store reads 2 pages; row store still has to read all 8 pages.",cells:(t,e)=>t==="name"||t==="city"}];function me(t){let e="row",o="point";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Pages on Disk</div>
      <p class="widget-hint">Toggle the layout and the query. Highlighted cells are the bytes the DB <em>actually wants</em>. Hatched cells live on the same page so they get read too — wasted I/O.</p>

      <div class="controls">
        <div class="pill-group" role="radiogroup" aria-label="Storage layout">
          <input type="radio" name="layout" id="layout-row" value="row" checked>
          <label for="layout-row">Row Store</label>
          <input type="radio" name="layout" id="layout-col" value="col">
          <label for="layout-col">Column Store</label>
        </div>

        <select class="field" id="query-select" aria-label="Query">
          ${V.map(n=>`<option value="${n.id}">${n.label}</option>`).join("")}
        </select>
      </div>

      <div class="widget-stage" id="stage"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Pages Read</div><div class="value" id="m-pages">0</div></div>
        <div class="metric"><div class="label">Cells Useful</div><div class="value" id="m-useful">0</div></div>
        <div class="metric"><div class="label">Cells Wasted</div><div class="value" id="m-wasted">0</div></div>
        <div class="metric accent"><div class="label">Efficiency</div><div class="value" id="m-eff">0%</div></div>
      </div>

      <div class="callout" id="explain"></div>
    </div>
  `;const i=t.querySelector("#stage"),g=t.querySelector("#explain"),T=t.querySelector("#m-pages"),h=t.querySelector("#m-useful"),f=t.querySelector("#m-wasted"),u=t.querySelector("#m-eff");t.querySelectorAll("input[name=layout]").forEach(n=>n.addEventListener("change",w=>{e=w.target.value,p()})),t.querySelector("#query-select").addEventListener("change",n=>{o=n.target.value,p()});function p(){const n=V.find(w=>w.id===o);g.textContent=n.explain,e==="row"?i.innerHTML=d(n):i.innerHTML=b(n),v(n)}function d(n){return`<div class="store-row">${P.map((E,S)=>{const L=D.some((C,y)=>n.cells(C,S)),$=D.map((C,y)=>{const s=n.cells(C,S);return`<span class="${L?s?"cell read":"cell skip":"skip"}" data-col="${C}">${E[y]}</span>`}).join("");return`
        <div class="${L?"page page-read":"page page-cold"}">
          <div class="page-label">Page ${S+1}</div>
          <div class="page-cells">${$}</div>
        </div>
      `}).join("")}</div>`+l()}function b(n){return`<div class="store-col">${D.map((E,S)=>{const L=P.some((C,y)=>n.cells(E,y)),$=P.map((C,y)=>{const s=n.cells(E,y);return`<span class="${L?s?"cell read":"cell skip":"skip"}">${C[S]}</span>`}).join("");return`
        <div class="${L?"page page-read":"page page-cold"}">
          <div class="page-label">Page · ${E}</div>
          <div class="page-cells col">${$}</div>
        </div>
      `}).join("")}</div>`+l()}function v(n){let w=0,E=0,S=0;e==="row"?P.forEach((M,C)=>{D.some(s=>n.cells(s,C))&&(w+=1,D.forEach(s=>{n.cells(s,C)?E+=1:S+=1}))}):D.forEach(M=>{P.some((y,s)=>n.cells(M,s))&&(w+=1,P.forEach((y,s)=>{n.cells(M,s)?E+=1:S+=1}))});const L=E+S,$=L===0?0:Math.round(E/L*100);T.textContent=w,h.textContent=E,f.textContent=S,u.textContent=$+"%"}function l(){return`<style>
      .store-row { display: flex; flex-direction: column; gap: 0.4rem; }
      .store-col { display: flex; flex-direction: row; gap: 0.6rem; flex-wrap: wrap; justify-content: center; }
      .page { border: 2px solid var(--ink); background: var(--paper); padding: 0.4rem; border-radius: var(--radius); }
      .page-read { box-shadow: 3px 3px 0 var(--ink); }
      .page-cold { opacity: 0.5; background: repeating-linear-gradient(45deg, transparent 0 4px, var(--hatch) 4px 5px), var(--paper); }
      .page-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); margin-bottom: 0.3rem; letter-spacing: 0.08em; text-transform: uppercase; }
      .page-cells { display: flex; gap: 0; flex-wrap: wrap; }
      .page-cells.col { flex-direction: column; }
    </style>`}p()}const Z=[{id:"ru",label:"Read Uncommitted",short:"RU"},{id:"rc",label:"Read Committed",short:"RC"},{id:"rr",label:"Repeatable Read",short:"RR"},{id:"sr",label:"Serializable",short:"SR"}],K={dirty:{label:"Dirty Read",description:"T1 updates a row, T2 reads it, T1 rolls back.",runs:{ru:()=>[a("T1","BEGIN"),a("T2","BEGIN"),a("T1","UPDATE balance = 150  (uncommitted)","write"),a("T2","SELECT balance → 150  ← ❌ DIRTY READ","read","bad"),a("T1","ROLLBACK","abort"),a("T2","T2 acted on a value that never existed")],rc:()=>[a("T1","BEGIN"),a("T2","BEGIN"),a("T1","UPDATE balance = 150  (uncommitted)","write"),a("T2","SELECT balance → 100  ✅ sees committed only","read","good"),a("T1","ROLLBACK","abort"),a("T2","No dirty read at this level.")],rr:()=>[a("T1","BEGIN"),a("T2","BEGIN"),a("T1","UPDATE balance = 150  (uncommitted)","write"),a("T2","SELECT balance → 100  ✅ sees committed only","read","good"),a("T1","ROLLBACK","abort"),a("T2","No dirty read at this level.")],sr:()=>[a("T1","BEGIN"),a("T2","BEGIN"),a("T1","UPDATE balance = 150  (uncommitted)","write"),a("T2","SELECT balance → 100  ✅ sees committed only","read","good"),a("T1","ROLLBACK","abort"),a("T2","No dirty read at this level.")]}},nonrep:{label:"Non-Repeatable Read",description:"T2 reads a row twice; T1 commits an update in between.",runs:{ru:()=>[a("T1","BEGIN"),a("T2","BEGIN"),a("T2","SELECT balance → 100","read"),a("T1","UPDATE balance = 200; COMMIT","write"),a("T2","SELECT balance → 200  ← ❌ value changed!","read","bad"),a("T2","COMMIT"),a("T2","T2 read different values for the same row in one txn.")],rc:()=>[a("T1","BEGIN"),a("T2","BEGIN"),a("T2","SELECT balance → 100","read"),a("T1","UPDATE balance = 200; COMMIT","write"),a("T2","SELECT balance → 200  ← ❌ value changed!","read","bad"),a("T2","COMMIT"),a("T2","RC sees the latest committed value — non-repeatable.")],rr:()=>[a("T1","BEGIN"),a("T2","BEGIN"),a("T2","SELECT balance → 100","read"),a("T1","UPDATE balance = 200; COMMIT","write"),a("T2","SELECT balance → 100  ✅ snapshot kept","read","good"),a("T2","COMMIT"),a("T2","RR locks the snapshot at txn start — repeatable.")],sr:()=>[a("T1","BEGIN"),a("T2","BEGIN"),a("T2","SELECT balance → 100","read"),a("T1","UPDATE balance = 200; COMMIT","write"),a("T2","SELECT balance → 100  ✅ snapshot kept","read","good"),a("T2","COMMIT"),a("T2","Serializable also prevents this.")]}},phantom:{label:"Phantom Read",description:"T2 reads a range twice; T1 inserts a matching row in between.",runs:{ru:()=>[a("T1","BEGIN"),a("T2","BEGIN"),a("T2","SELECT COUNT(*) WHERE age > 30 → 4","read"),a("T1","INSERT (age=35); COMMIT","write"),a("T2","SELECT COUNT(*) WHERE age > 30 → 5  ← ❌ phantom!","read","bad"),a("T2","COMMIT"),a("T2","A new row appeared in the predicate — phantom.")],rc:()=>[a("T1","BEGIN"),a("T2","BEGIN"),a("T2","SELECT COUNT(*) WHERE age > 30 → 4","read"),a("T1","INSERT (age=35); COMMIT","write"),a("T2","SELECT COUNT(*) WHERE age > 30 → 5  ← ❌ phantom!","read","bad"),a("T2","COMMIT"),a("T2","RC re-reads the committed set — phantom slips in.")],rr:()=>[a("T1","BEGIN"),a("T2","BEGIN"),a("T2","SELECT COUNT(*) WHERE age > 30 → 4","read"),a("T1","INSERT (age=35); COMMIT","write"),a("T2","SELECT COUNT(*) WHERE age > 30 → 4  ✅ snapshot","read","good"),a("T2","COMMIT"),a("T2","Standard says phantoms possible at RR. Postgres uses MVCC and prevents them.")],sr:()=>[a("T1","BEGIN"),a("T2","BEGIN"),a("T2","SELECT COUNT(*) WHERE age > 30 → 4","read"),a("T1","INSERT (age=35); COMMIT  ← may be blocked at SR","write","good"),a("T2","SELECT COUNT(*) WHERE age > 30 → 4  ✅","read","good"),a("T2","COMMIT"),a("T2","Serializable prevents phantoms.")]}}};function a(t,e,o="",i=""){return{actor:t,text:e,kind:o,tag:i}}function ge(t){let e="dirty",o="ru",i=0;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Two Transactions in Slow Motion</div>

      <div class="controls">
        <label>Phenomenon:</label>
        <div class="pill-group">
          ${Object.entries(K).map(([d,b],v)=>`
            <input type="radio" name="iso-phen" id="phen-${d}" value="${d}" ${v===0?"checked":""}>
            <label for="phen-${d}">${b.label}</label>
          `).join("")}
        </div>
      </div>

      <div class="controls">
        <label>Isolation:</label>
        <div class="pill-group">
          ${Z.map((d,b)=>`
            <input type="radio" name="iso-lvl" id="lvl-${d.id}" value="${d.id}" ${b===0?"checked":""}>
            <label for="lvl-${d.id}">${d.short}</label>
          `).join("")}
        </div>
        <button class="btn btn-accent" id="iso-step">Next Step</button>
        <button class="btn btn-ghost" id="iso-reset">Reset</button>
      </div>

      <div class="callout" id="iso-desc"></div>

      <div class="widget-stage" id="iso-stage" style="min-height: 240px;"></div>

      <div class="callout" id="iso-summary" style="display:none"></div>
    </div>
  `;const g=t.querySelector("#iso-stage"),T=t.querySelector("#iso-desc"),h=t.querySelector("#iso-summary");t.querySelectorAll("input[name=iso-phen]").forEach(d=>d.addEventListener("change",b=>{e=b.target.value,i=0,f()})),t.querySelectorAll("input[name=iso-lvl]").forEach(d=>d.addEventListener("change",b=>{o=b.target.value,i=0,f()})),t.querySelector("#iso-step").addEventListener("click",()=>{const d=K[e].runs[o]();i<d.length&&i++,f()}),t.querySelector("#iso-reset").addEventListener("click",()=>{i=0,f()});function f(){const d=K[e],b=d.runs[o]();if(T.innerHTML=`<strong>${d.label}</strong> at <strong>${Z.find(v=>v.id===o).label}</strong>. ${d.description}`,g.innerHTML=b.slice(0,i).map((v,l)=>u(v,l)).join(""),i>=b.length){const v=b.some(l=>l.tag==="bad");h.style.display="block",h.innerHTML=v?"❌ <strong>Phenomenon occurred</strong> at this level. The database allowed it. Move to a higher isolation level to prevent.":"✅ <strong>Phenomenon prevented</strong>. This isolation level was strong enough."}else h.style.display="none"}function u(d,b){const v=d.actor==="T1";return`
      <div class="iso-row ${d.tag}">
        <div class="iso-stepnum">${String(b+1).padStart(2,"0")}</div>
        ${v?`<div class="iso-cell t1 ${d.kind}">${p(d.text)}</div>
                  <div class="iso-cell empty"></div>`:`<div class="iso-cell empty"></div>
                  <div class="iso-cell t2 ${d.kind}">${p(d.text)}</div>`}
      </div>
      <style>
        .iso-row { display: grid; grid-template-columns: 36px 1fr 1fr; gap: 0.4rem; align-items: center; margin: 0.2rem 0; }
        .iso-stepnum { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-faint); text-align: center; }
        .iso-cell { padding: 0.45em 0.7em; border: 1.5px solid var(--ink); border-radius: var(--radius); font-family: var(--font-mono); font-size: 0.85rem; background: var(--paper); }
        .iso-cell.empty { background: transparent; border: 1.5px dashed transparent; }
        .iso-cell.t1 { background: #fff6dc; }
        .iso-cell.t2 { background: #e6f0ff; }
        .iso-cell.write { border-color: var(--accent); }
        .iso-cell.abort { background: var(--accent); color: white; border-color: var(--accent); }
        .iso-row.bad .iso-cell.t1, .iso-row.bad .iso-cell.t2 { box-shadow: 0 0 0 2px var(--accent); }
        .iso-row.good .iso-cell.t1, .iso-row.good .iso-cell.t2 { box-shadow: 0 0 0 2px #2a8a3e; }
      </style>
    `}function p(d){return String(d).replace(/[&<>"']/g,b=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[b])}f()}function ve(t){const e={mem:{x:10,y:20},walEntries:[],disk:{x:10,y:20},pending:[],txnOpen:!1,seq:0,crashed:!1};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">A Transaction in Slow Motion</div>
      <p class="widget-hint">Begin a transaction, modify <code>x</code> and <code>y</code> a few times, then commit. Or crash before committing — watch what recovery does.</p>

      <div class="widget-stage" id="wal-stage" style="min-height: 220px;"></div>

      <div class="controls">
        <button class="btn" id="wal-begin">BEGIN</button>
        <button class="btn" id="wal-set-x">UPDATE x = ?</button>
        <button class="btn" id="wal-set-y">UPDATE y = ?</button>
        <button class="btn btn-accent" id="wal-commit">COMMIT</button>
        <button class="btn" id="wal-flush">Flush data page</button>
        <button class="btn" id="wal-crash">💥 Crash</button>
        <button class="btn btn-ghost" id="wal-reset">Reset</button>
      </div>

      <div class="log" id="wal-log"></div>
    </div>
  `;const o=t.querySelector("#wal-stage"),i=t.querySelector("#wal-log");function g(u,p){const d=document.createElement("div");d.className=`entry ${u}`,d.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${p}`,i.prepend(d)}t.querySelector("#wal-begin").addEventListener("click",()=>{if(e.crashed)return g("err","Server is down — reset first.");if(e.txnOpen)return g("err","A transaction is already open.");e.txnOpen=!0,e.pending=[],g("info","BEGIN TRANSACTION"),T()}),t.querySelector("#wal-set-x").addEventListener("click",()=>{if(e.crashed)return;if(!e.txnOpen)return g("err","No open transaction. Click BEGIN first.");const u=h();e.mem.x=u,e.seq+=1,e.walEntries.push({seq:e.seq,op:`SET x=${u}`,committed:!1}),e.pending.push(e.seq),g("info",`Memory: x=${u}.  WAL append (uncommitted, seq=${e.seq}).`),T()}),t.querySelector("#wal-set-y").addEventListener("click",()=>{if(e.crashed)return;if(!e.txnOpen)return g("err","No open transaction. Click BEGIN first.");const u=h();e.mem.y=u,e.seq+=1,e.walEntries.push({seq:e.seq,op:`SET y=${u}`,committed:!1}),e.pending.push(e.seq),g("info",`Memory: y=${u}.  WAL append (uncommitted, seq=${e.seq}).`),T()}),t.querySelector("#wal-commit").addEventListener("click",()=>{if(!e.crashed){if(!e.txnOpen)return g("err","Nothing to commit.");e.walEntries.forEach(u=>{e.pending.includes(u.seq)&&(u.committed=!0)}),e.seq+=1,e.walEntries.push({seq:e.seq,op:"COMMIT",committed:!0,isCommit:!0}),g("ok","fsync(WAL).  COMMIT durable (data page still in memory only)."),e.pending=[],e.txnOpen=!1,T()}}),t.querySelector("#wal-flush").addEventListener("click",()=>{e.crashed||(e.disk={...e.mem},e.walEntries.forEach(u=>u.flushed=!0),g("ok",`Data page flushed to disk. x=${e.disk.x}, y=${e.disk.y}.`),T())}),t.querySelector("#wal-crash").addEventListener("click",async()=>{if(e.crashed)return;e.crashed=!0,g("err","💥 Power cut! Memory wiped."),e.mem={...e.disk},e.pending=[],e.txnOpen=!1,T(),await f(800),g("info","Restarting… reading WAL…"),await f(600);const u=[];e.walEntries.forEach(p=>{if(p.committed&&!p.flushed&&!p.isCommit){const d=p.op.match(/SET (x|y)=(\-?\d+)/);d&&(e.mem[d[1]]=Number(d[2]),u.push(p.op))}}),u.length?g("ok",`Replayed: ${u.join(", ")}`):g("info","Nothing to replay — committed state matches disk."),e.walEntries=e.walEntries.filter(p=>p.committed),e.crashed=!1,T(),g("ok","Recovery complete. Database online.")}),t.querySelector("#wal-reset").addEventListener("click",()=>{e.mem={x:10,y:20},e.disk={x:10,y:20},e.walEntries=[],e.pending=[],e.txnOpen=!1,e.seq=0,e.crashed=!1,i.innerHTML="",T()});function T(){o.innerHTML=`
      <div class="wal-grid">
        <div class="wal-row">
          <div class="wal-label">Memory<br><span>(buffer pool)</span></div>
          <div class="wal-data ${e.crashed?"crashed":""}">
            x = <strong>${e.crashed?"?":e.mem.x}</strong> &nbsp;&nbsp;
            y = <strong>${e.crashed?"?":e.mem.y}</strong>
            ${e.txnOpen?'<span class="badge warn">TXN OPEN</span>':""}
          </div>
        </div>
        <div class="wal-row">
          <div class="wal-label">WAL<br><span>(append-only)</span></div>
          <div class="wal-entries">
            ${e.walEntries.length===0?'<span style="color: var(--ink-faint);">(empty)</span>':e.walEntries.map(u=>`<span class="wal-cell ${u.committed?"committed":"uncommitted"}" title="seq=${u.seq}">${u.op}</span>`).join("")}
          </div>
        </div>
        <div class="wal-row">
          <div class="wal-label">Disk<br><span>(data file)</span></div>
          <div class="wal-data">
            x = <strong>${e.disk.x}</strong> &nbsp;&nbsp;
            y = <strong>${e.disk.y}</strong>
          </div>
        </div>
      </div>
      <style>
        .wal-grid { display: flex; flex-direction: column; gap: 0.5rem; }
        .wal-row { display: grid; grid-template-columns: 130px 1fr; gap: 0.6rem; align-items: center; }
        .wal-label { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.04em; text-align: right; color: var(--ink); }
        .wal-label span { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.1em; }
        .wal-data { background: var(--paper); border: 2px solid var(--ink); padding: 0.6em 0.8em; border-radius: var(--radius); font-family: var(--font-mono); font-size: 1rem; }
        .wal-data.crashed { background: #eee; color: var(--ink-faint); }
        .wal-entries { background: var(--paper-deep); border: 2px solid var(--ink); padding: 0.5em; border-radius: var(--radius); display: flex; flex-wrap: wrap; gap: 0; min-height: 36px; }
      </style>
    `}function h(){return Math.floor(Math.random()*90+10)}function f(u){return new Promise(p=>setTimeout(p,u))}T()}function fe(t){const e={mode:"async",primaryLog:[],replicas:[{id:"R1",name:"Replica 1",log:[],down:!1,lagMs:100,baseLag:100},{id:"R2",name:"Replica 2",log:[],down:!1,lagMs:250,baseLag:250},{id:"R3",name:"Replica 3",log:[],down:!1,lagMs:500,baseLag:500}],seq:0,inflight:[],rafHandle:null};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Primary &amp; Replicas</div>
      <p class="widget-hint">Click <em>Write</em> to send a value from primary to all replicas. In <em>sync</em> mode the write doesn't commit until acks arrive. Toggle replicas off to simulate failure.</p>

      <div class="controls">
        <div class="pill-group">
          <input type="radio" name="rep-mode" id="rep-async" value="async" checked>
          <label for="rep-async">Async</label>
          <input type="radio" name="rep-mode" id="rep-sync" value="sync">
          <label for="rep-sync">Sync</label>
        </div>
        <button class="btn btn-accent" id="rep-write">Write</button>
        <button class="btn" id="rep-reset">Reset</button>
        <label style="margin-left:auto">Replicas:</label>
        ${e.replicas.map(l=>`<label class="rep-toggle">
          <input type="checkbox" data-rep="${l.id}" checked> ${l.name}
        </label>`).join("")}
      </div>

      <div class="widget-stage" id="rep-stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Primary seq</div><div class="value" id="rep-pseq">0</div></div>
        <div class="metric"><div class="label">Max lag</div><div class="value" id="rep-maxlag">0</div></div>
        <div class="metric accent"><div class="label">Last write</div><div class="value" id="rep-last">—</div></div>
      </div>

      <div class="log" id="rep-log"></div>
    </div>

    <style>
      .rep-toggle { font-size: 0.85rem; margin-left: 0.4rem; }
    </style>
  `;const o=t.querySelector("#rep-stage"),i=t.querySelector("#rep-log"),g=t.querySelector("#rep-pseq"),T=t.querySelector("#rep-maxlag"),h=t.querySelector("#rep-last");t.querySelectorAll("input[name=rep-mode]").forEach(l=>l.addEventListener("change",n=>{e.mode=n.target.value,b("info",`Mode → ${e.mode}`)})),t.querySelector("#rep-write").addEventListener("click",f),t.querySelector("#rep-reset").addEventListener("click",u),t.querySelectorAll("input[data-rep]").forEach(l=>l.addEventListener("change",n=>{const w=n.target.dataset.rep,E=e.replicas.find(S=>S.id===w);E.down=!n.target.checked,b(E.down?"err":"ok",`${E.name} ${E.down?"OFFLINE":"ONLINE"}`)}));function f(){e.seq+=1;const l=`v${e.seq}`,n=performance.now();e.primaryLog.push({seq:e.seq,value:l,t:n}),b("ok",`PRIMARY commits ${l} (seq=${e.seq})${e.mode==="sync"?" [waiting for acks…]":""}`),e.replicas.forEach(w=>{if(w.down){b("err",`${w.name} OFFLINE — write queued for later`);return}const E=w.baseLag*(.85+Math.random()*.3);e.inflight.push({toRep:w.id,seq:e.seq,value:l,startT:n,durationMs:E})}),e.mode==="sync"?h.textContent=`${l} ⌛`:h.textContent=l,e.rafHandle||p()}function u(){e.primaryLog=[],e.seq=0,e.inflight=[],e.replicas.forEach(l=>{l.log=[]}),h.textContent="—",i.innerHTML="",v()}function p(){const l=performance.now();e.inflight=e.inflight.filter(n=>{if((l-n.startT)/n.durationMs>=1){const E=e.replicas.find(S=>S.id===n.toRep);return E.log.push({seq:n.seq,value:n.value}),b("ok",`${E.name} applied ${n.value} (lag ${Math.round(n.durationMs)}ms)`),e.mode==="sync"&&d(n.seq)&&(h.textContent=n.value,b("info",`Sync: write ${n.value} fully acked`)),!1}return!0}),v(),e.inflight.length>0?e.rafHandle=requestAnimationFrame(p):e.rafHandle=null}function d(l){return e.replicas.filter(n=>!n.down).every(n=>n.log.some(w=>w.seq===l))}function b(l,n){const w=document.createElement("div");for(w.className=`entry ${l}`,w.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${n}`,i.prepend(w);i.children.length>50;)i.removeChild(i.lastChild)}function v(){const L=[60,140,220];let $='<svg viewBox="0 0 700 280" width="100%" style="max-width:700px;">';$+=`<style>
      .rep-node { stroke: var(--ink); stroke-width: 2.5; }
      .rep-node.primary { fill: var(--accent-soft); }
      .rep-node.replica { fill: var(--paper); }
      .rep-node.down { fill: #ddd; stroke: #999; stroke-dasharray: 4 4; }
      .rep-label { font-family: var(--font-display); font-size: 16px; fill: var(--ink); letter-spacing: 1px; }
      .rep-sublabel { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .rep-link { stroke: var(--ink-soft); stroke-width: 1.5; stroke-dasharray: 5 4; }
      .rep-link.down { stroke: #ccc; }
      .packet { fill: var(--accent); stroke: var(--ink); stroke-width: 1.5; }
      .packet-text { font-family: var(--font-mono); font-size: 10px; fill: white; }
      .lag-bar-bg { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1; }
      .lag-bar { fill: var(--accent); }
    </style>`,$+='<rect class="rep-node primary" x="30" y="105" width="120" height="70" rx="6"/>',$+='<text class="rep-label" x="90" y="132" text-anchor="middle">PRIMARY</text>',$+=`<text class="rep-sublabel" x="90" y="148" text-anchor="middle">seq = ${e.seq}</text>`,$+=`<text class="rep-sublabel" x="90" y="162" text-anchor="middle">${e.primaryLog.length} writes</text>`,e.replicas.forEach((y,s)=>{const c=L[s],m=y.down?"down":"replica";$+=`<line class="rep-link ${y.down?"down":""}" x1="150" y1="140" x2="480" y2="${c}"/>`,$+=`<rect class="rep-node ${m}" x="480" y="${c-28}" width="120" height="60" rx="6"/>`,$+=`<text class="rep-label" x="540" y="${c-8}" text-anchor="middle">${y.id}</text>`;const k=e.seq-(y.log.length?y.log[y.log.length-1].seq:0);$+=`<text class="rep-sublabel" x="540" y="${c+6}" text-anchor="middle">${y.down?"OFFLINE":`lag: ${k}`}</text>`,$+=`<text class="rep-sublabel" x="540" y="${c+20}" text-anchor="middle">${y.down?"":`${y.log.length} applied`}</text>`;const I=610,R=c-6,x=50,O=12;if($+=`<rect class="lag-bar-bg" x="${I}" y="${R}" width="${x}" height="${O}"/>`,!y.down){const A=Math.min(1,k/Math.max(1,e.seq));$+=`<rect class="lag-bar" x="${I}" y="${R}" width="${x*A}" height="${O}"/>`}});const M=performance.now();e.inflight.forEach(y=>{const s=e.replicas.findIndex(R=>R.id===y.toRep),c=L[s],m=Math.min(1,(M-y.startT)/y.durationMs),k=150+330*m,I=140+(c-140)*m;$+=`<circle class="packet" cx="${k}" cy="${I}" r="14"/>`,$+=`<text class="packet-text" x="${k}" y="${I+4}" text-anchor="middle">${y.value}</text>`}),$+="</svg>",o.innerHTML=$,g.textContent=e.seq;const C=e.replicas.filter(y=>!y.down).map(y=>e.seq-(y.log.length?y.log[y.log.length-1].seq:0));T.textContent=C.length?Math.max(...C,0):"—"}v()}const se=60,U=4,ye=["A","B","C","D"],F=["Tokyo","Berlin","Lima","Mumbai"],be=[.45,.2,.15,.2],ee=we(se);function we(t){const e=[];for(let o=1;o<=t;o++){const i=xe(o);e.push({id:o,region:i})}return e}function xe(t){const e=(t*9301+49297)%233280/233280;let o=0;for(let i=0;i<F.length;i++)if(o+=be[i],e<o)return F[i];return F[F.length-1]}function Te(t){let e=t*2654435761;return e=(e^e>>>16)>>>0,e}const X={hash:{label:"Hash",explain:"shard = hash(user_id) % 4. Evenly spread, but a range query like “users 10..20” hits every shard.",assign:t=>Te(t.id)%U},range:{label:"Range",explain:'ids 1..15 → A, 16..30 → B, 31..45 → C, 46..60 → D. Range scans hit one shard, but if "new users" dominate, the last shard is hot.',assign:t=>Math.min(Math.floor((t.id-1)/(se/U)),U-1)},geo:{label:"Geo",explain:"Tokyo→A, Berlin→B, Lima→C, Mumbai→D. Locality wins, but skewed populations (45% Tokyo) make shard A hot.",assign:t=>F.indexOf(t.region)}},te={point:{label:"WHERE user_id = 23",hits:(t,e)=>t.id===23?e:null},range:{label:"WHERE user_id BETWEEN 10 AND 30",hits:(t,e)=>t.id>=10&&t.id<=30?e:null},geoLookup:{label:'WHERE region = "Tokyo"',hits:(t,e)=>t.region==="Tokyo"?e:null},scan:{label:"COUNT(*)",hits:(t,e)=>e}};function Ee(t){let e="hash",o="point";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Shard Distribution</div>
      <p class="widget-hint">Each circle is one user. Each box is one shard machine. Pick a strategy and watch users cluster differently.</p>

      <div class="controls">
        <div class="pill-group">
          ${Object.entries(X).map(([l,n],w)=>`
            <input type="radio" name="strategy" id="strat-${l}" value="${l}" ${w===0?"checked":""}>
            <label for="strat-${l}">${n.label}</label>
          `).join("")}
        </div>

        <label>Query:</label>
        <select class="field" id="query-select">
          ${Object.entries(te).map(([l,n])=>`<option value="${l}">${n.label}</option>`).join("")}
        </select>
        <button class="btn btn-accent" id="run-query">Run Query</button>
      </div>

      <div class="widget-stage" id="stage"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Max load</div><div class="value" id="m-max">0</div></div>
        <div class="metric"><div class="label">Min load</div><div class="value" id="m-min">0</div></div>
        <div class="metric"><div class="label">Skew (max/min)</div><div class="value" id="m-skew">—</div></div>
        <div class="metric accent"><div class="label">Shards hit</div><div class="value" id="m-hit">0</div></div>
      </div>

      <div class="callout" id="explain"></div>
    </div>
  `;const i=t.querySelector("#stage"),g=t.querySelector("#explain"),T=t.querySelector("#m-max"),h=t.querySelector("#m-min"),f=t.querySelector("#m-skew"),u=t.querySelector("#m-hit");let p=new Set,d=new Set;t.querySelectorAll("input[name=strategy]").forEach(l=>l.addEventListener("change",n=>{e=n.target.value,p=new Set,d=new Set,b()})),t.querySelector("#query-select").addEventListener("change",l=>{o=l.target.value}),t.querySelector("#run-query").addEventListener("click",()=>{const l=te[o];p=new Set,d=new Set,ee.forEach(n=>{const w=X[e].assign(n);l.hits(n,w)!==null&&(p.add(w),d.add(n.id))}),b()});function b(){g.textContent=X[e].explain;const l=Array.from({length:U},()=>[]);ee.forEach(S=>{l[X[e].assign(S)].push(S)});const n=l.map(S=>S.length),w=Math.max(...n),E=Math.min(...n);T.textContent=w,h.textContent=E,f.textContent=E===0?"∞":(w/E).toFixed(2)+"×",u.textContent=p.size>0?`${p.size}/${U}`:"—",i.innerHTML=v(l)}function v(l){const E=200*U;let S=`<svg viewBox="0 0 ${E} 270" width="${E}" height="270">`;return S+=`<style>
      .shard-frame { fill: var(--paper); stroke: var(--ink); stroke-width: 2.5; }
      .shard-frame.hot { stroke: var(--accent); stroke-width: 3; }
      .shard-label { font-family: var(--font-display); font-size: 18px; fill: var(--ink); letter-spacing: 1px; }
      .shard-count { font-family: var(--font-mono); font-size: 11px; fill: var(--ink-soft); }
      .user-dot { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1; }
      .user-dot.hit { fill: var(--accent); stroke: var(--ink); }
    </style>`,l.forEach((L,$)=>{const M=$*200,C=p.has($);S+=`
        <rect class="shard-frame ${C?"hot":""}" x="${M}" y="36" width="180" height="220" rx="6"/>
        <text class="shard-label" x="${M+12}" y="28">Shard ${ye[$]}</text>
        <text class="shard-count" x="${M+180-12}" y="28" text-anchor="end">${L.length} rows</text>
      `;const y=6;L.forEach((s,c)=>{const m=M+18+c%y*26,k=60+Math.floor(c/y)*26,I=d.has(s.id);S+=`<circle class="user-dot ${I?"hit":""}" cx="${m}" cy="${k}" r="9"><title>id=${s.id} · ${s.region}</title></circle>`,S+=`<text x="${m}" y="${k+3}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px; fill: var(--ink);">${s.id}</text>`})}),S+="</svg>",S}b()}const ae=[{sql:"SELECT name FROM users WHERE city = 'Tokyo'",ast:{type:"Select",columns:["name"],from:"users",where:{op:"=",left:"city",right:"'Tokyo'"}},analyzed:'users.name exists ✅ · users.city exists ✅ · type(city)=TEXT, "Tokyo" is TEXT ✅',plans:[{name:"Seq Scan on users",filter:'city = "Tokyo"',cost:1e3,rows:320,chosen:!1},{name:"Index Scan on users_city_idx",filter:'city = "Tokyo"',cost:24,rows:320,chosen:!0}],chosenPlan:1,results:["Aiko","Kenji","Yuna","Hiro","Sora"]},{sql:"SELECT SUM(price) FROM orders WHERE created_at > '2026-01-01'",ast:{type:"Select",columns:["SUM(price)"],from:"orders",where:{op:">",left:"created_at",right:"'2026-01-01'"}},analyzed:"orders.price NUMERIC ✅ · orders.created_at TIMESTAMP ✅ · SUM applicable to NUMERIC ✅",plans:[{name:"Index Scan on orders_created_idx",filter:"created_at > 2026-01-01",cost:540,rows:12340,chosen:!0},{name:"Seq Scan + Filter",filter:"created_at > 2026-01-01",cost:18200,rows:12340,chosen:!1}],chosenPlan:0,results:["SUM(price) = 4,820,113.50"]},{sql:"SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id WHERE u.country = 'JP'",ast:{type:"Select",columns:["u.name","o.total"],from:"users u JOIN orders o ON u.id = o.user_id",where:{op:"=",left:"u.country",right:"'JP'"}},analyzed:"Aliases u, o resolved. Foreign key orders.user_id → users.id detected.",plans:[{name:"Nested Loop  (users → orders)",filter:"JP users × all their orders",cost:880,rows:4500,chosen:!1},{name:"Hash Join  (build users[JP], probe orders)",filter:"users.country=JP, hash on id",cost:220,rows:4500,chosen:!0},{name:"Merge Join  (sort both)",filter:"sort both inputs",cost:1200,rows:4500,chosen:!1}],chosenPlan:1,results:["Aiko → ¥4,200","Kenji → ¥980","Hiro → ¥12,400","Yuna → ¥3,100","…"]}],J=[{id:"parse",label:"1. Parse",sub:"SQL → AST"},{id:"bind",label:"2. Bind",sub:"Resolve names"},{id:"optimize",label:"3. Optimize",sub:"Pick a plan"},{id:"execute",label:"4. Execute",sub:"Run the plan"},{id:"return",label:"5. Return",sub:"Stream rows"}];function ke(t){let e=0,o=0;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">From SQL to Result Set</div>

      <div class="controls">
        <label>Query:</label>
        <select class="field" id="q-select">
          ${ae.map((v,l)=>`<option value="${l}">${d(v.sql)}</option>`).join("")}
        </select>
        <button class="btn btn-accent" id="q-next">Next Stage →</button>
        <button class="btn btn-ghost" id="q-reset">Reset</button>
      </div>

      <pre id="q-sql" style="background:var(--paper-deep); border:1.5px solid var(--ink); padding: 0.7rem 1rem; font-family: var(--font-mono); font-size: 1rem;"></pre>

      <div class="widget-stage" id="q-stages" style="padding: 1rem 0.6rem;"></div>

      <div class="widget-stage" id="q-output" style="min-height: 60px;"></div>
    </div>
  `;const i=t.querySelector("#q-sql"),g=t.querySelector("#q-stages"),T=t.querySelector("#q-output");t.querySelector("#q-select").addEventListener("change",v=>{e=Number(v.target.value),o=0,h()}),t.querySelector("#q-next").addEventListener("click",()=>{o<J.length&&(o+=1),h()}),t.querySelector("#q-reset").addEventListener("click",()=>{o=0,h()});function h(){const v=ae[e];i.innerHTML=b(v.sql),g.innerHTML=f(),T.innerHTML=u(v)}function f(){return`
      <div class="q-stages">
        ${J.map((v,l)=>{const n=l<o,w=l===o-1;return`
            <div class="q-stage ${n?"on":"off"} ${w?"current":""}">
              <div class="q-stage-label">${v.label}</div>
              <div class="q-stage-sub">${v.sub}</div>
            </div>
            ${l<J.length-1?`<div class="q-arrow ${n?"on":""}">→</div>`:""}
          `}).join("")}
      </div>
      <style>
        .q-stages { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; justify-content: center; }
        .q-stage { padding: 0.6rem 0.8rem; border: 2px solid var(--ink); border-radius: var(--radius); min-width: 100px; text-align: center; background: var(--paper); }
        .q-stage.on { background: var(--accent); color: white; }
        .q-stage.current { box-shadow: 4px 4px 0 var(--ink); transform: translate(-2px, -2px); }
        .q-stage-label { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.04em; }
        .q-stage-sub { font-family: var(--font-mono); font-size: 0.7rem; opacity: 0.9; }
        .q-arrow { font-family: var(--font-display); font-size: 1.4rem; color: var(--ink-faint); }
        .q-arrow.on { color: var(--accent); }
      </style>
    `}function u(v){if(o===0)return'<div style="color: var(--ink-soft); text-align: center; padding: 1rem;">Click "Next Stage →" to begin.</div>';if(o===1)return p("Abstract Syntax Tree (AST)",`<pre style="margin:0; font-family: var(--font-mono); font-size: 0.85rem;">${JSON.stringify(v.ast,null,2)}</pre>`);if(o===2)return p("Name resolution & type checks",`<div style="font-family: var(--font-mono); font-size: 0.9rem;">${v.analyzed}</div>`);if(o===3){const l=v.plans.map(n=>`
        <tr class="${n.chosen?"chosen":""}">
          <td>${n.chosen?"✅":"⨯"}</td>
          <td>${d(n.name)}</td>
          <td>${d(n.filter)}</td>
          <td>${n.cost}</td>
          <td>${n.rows}</td>
        </tr>
      `).join("");return p("Candidate plans (lower cost wins)",`
        <table class="plan-table">
          <thead><tr><th></th><th>Operator</th><th>Filter</th><th>Cost</th><th>Est. rows</th></tr></thead>
          <tbody>${l}</tbody>
        </table>
        <style>
          .plan-table { width: 100%; border-collapse: collapse; }
          .plan-table th, .plan-table td { border: 1.5px solid var(--ink); padding: 0.4em 0.6em; font-family: var(--font-mono); font-size: 0.85rem; text-align: left; }
          .plan-table tr.chosen { background: var(--accent-soft); }
          .plan-table th { background: var(--paper-deep); }
        </style>
      `)}if(o===4){const l=v.plans[v.chosenPlan];return p("Running…",`
        <div style="font-family: var(--font-mono); font-size: 0.9rem;">
          ▸ ${d(l.name)}<br>
          ▸ filter: ${d(l.filter)}<br>
          ▸ producing rows…
        </div>
      `)}if(o>=5)return p(`Result set (${v.results.length} rows)`,`
        <ul style="margin: 0; padding-left: 1.2rem; font-family: var(--font-mono); font-size: 0.9rem;">
          ${v.results.map(l=>`<li>${d(l)}</li>`).join("")}
        </ul>
      `)}function p(v,l){return`
      <div style="border: 2px solid var(--ink); background: var(--paper); border-radius: var(--radius); overflow: hidden;">
        <div style="background: var(--paper-deep); padding: 0.4em 0.8em; border-bottom: 1.5px solid var(--ink); font-family: var(--font-display); letter-spacing: 0.04em;">${v}</div>
        <div style="padding: 0.7em 0.9em;">${l}</div>
      </div>
    `}function d(v){return String(v).replace(/[&<>"']/g,l=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[l])}function b(v){return d(v).replace(/\b(SELECT|FROM|WHERE|JOIN|ON|AND|OR|SUM|COUNT|BETWEEN|GROUP BY|ORDER BY|AS)\b/gi,'<span style="color: var(--accent); font-weight: 600;">$1</span>').replace(/'([^']*)'/g,`<span style="color:#2a8a3e;">'$1'</span>`).replace(/\b(\d+)\b/g,'<span style="color:#1c6dd0;">$1</span>')}h()}const W=t=>()=>r.jsx(ne,{init:t}),Me={slug:"database",title:"Database",tagline:"How databases really work, from disk pages to query plans.",intro:r.jsx(r.Fragment,{children:"Step inside the database engine. Eight lessons covering ACID guarantees, B-Tree indexes, storage layouts, isolation levels, write-ahead logging, replication, sharding, and query execution — each backed by a widget you can poke at."}),lessons:[{slug:"acid",number:"01",title:"ACID Properties",blurb:"Atomicity, Consistency, Isolation, Durability — what each one actually protects against.",Widget:W(re),intro:r.jsx(r.Fragment,{children:"Four letters that mean four different guarantees. Most database bugs come from misunderstanding which of these you actually have."}),sections:[{heading:"What each letter protects against",body:r.jsxs("ul",{children:[r.jsxs("li",{children:[r.jsx("strong",{children:"Atomicity"})," — a transaction either fully happens or doesn't happen at all. No half-applied writes."]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Consistency"})," — every commit leaves the database in a valid state (constraints, types, foreign keys all satisfied)."]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Isolation"})," — concurrent transactions don't see each other's intermediate state. Different levels trade isolation for throughput."]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Durability"}),' — once the database says "committed", the data survives a crash. Even right after.']})]})}],takeaways:["Atomicity is rollback. The WAL is what makes it cheap.",`Consistency is the boring one — it's just "constraints are enforced."`,"Isolation is the dial. Higher = safer, lower = faster. Defaults rarely match what you think.","Durability assumes fsync actually flushes to disk. Cloud SSDs lie sometimes."]},{slug:"btree",number:"02",title:"B-Tree Indexes",blurb:"Insert keys into a live B-Tree and see why a database can find one row in millions in microseconds.",Widget:W(pe),intro:r.jsxs(r.Fragment,{children:["The data structure that makes ",r.jsx("code",{children:"WHERE id = 42"})," O(log n) instead of O(n). Every relational database uses B-trees (or B+-trees, the disk-friendly variant) for primary indexes."]}),sections:[{heading:"Why B-trees, not binary trees?",body:r.jsx("p",{children:"Disk and SSD pages are 4–16 KB. A binary tree visits one key per page — terrible cache use. A B-tree packs hundreds of keys per node, so each disk read advances you 8–10 levels deep instead of one. That's why a million-row table needs only 3–4 disk reads to find a key."})}],takeaways:["Fan-out is the magic. 100 keys per node → 10^6 rows in 3 levels.","Inserts can split nodes, propagating up to the root. Watch the widget do this.","B+-trees keep all data in leaves and chain them — perfect for range scans.","Concurrent updates use latch coupling and copy-on-write tricks. Beyond this lesson's scope, but the structure is the same."]},{slug:"storage",number:"03",title:"Row vs Column Storage",blurb:"The same data on disk, two ways. Watch which blocks get read for OLTP vs OLAP queries.",Widget:W(me),intro:r.jsx(r.Fragment,{children:"Row stores keep an entire record together; column stores keep each attribute together. Same logical table, opposite physical layout — and the right choice depends entirely on what your queries look like."}),sections:[{heading:"OLTP vs OLAP",body:r.jsxs("ul",{children:[r.jsxs("li",{children:[r.jsx("strong",{children:"Row (OLTP)"}),": ",r.jsx("code",{children:"SELECT * FROM users WHERE id = 42"})," reads one block."]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Column (OLAP)"}),": ",r.jsx("code",{children:"SELECT AVG(salary) FROM users"})," reads just one column's blocks; everything else stays on disk."]}),r.jsx("li",{children:"Modern systems mix the two (HTAP, Hyper, SingleStore) — write rows, query columns."})]})}],takeaways:["Row store = good for fetching whole records. The default for transactional systems.","Column store = good for aggregating one or two columns over many rows. The default for analytics.","Compression on columns can be 10–100×. All the values in a column have the same type and often similar values.","If you're doing both, you want a system that runs both layouts — or two databases."]},{slug:"isolation",number:"04",title:"Transaction Isolation",blurb:"Dial up the isolation level and watch dirty reads, non-repeatable reads, and phantoms disappear.",Widget:W(ge),intro:r.jsx(r.Fragment,{children:"Concurrent transactions can step on each other in surprisingly subtle ways. The SQL standard defines four isolation levels, each ruling out one more class of anomaly. Higher levels are safer but slower."}),sections:[{heading:"The anomalies, ranked",body:r.jsxs("ul",{children:[r.jsxs("li",{children:[r.jsx("strong",{children:"Dirty read"})," — see a value another transaction wrote but hasn't committed yet."]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Non-repeatable read"})," — read the same row twice in the same transaction, get different values."]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Phantom read"})," — same query, different set of rows the second time."]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Serializable"})," — none of the above. As if transactions ran one after another."]})]})}],takeaways:["Defaults vary by database. Postgres = read committed, MySQL = repeatable read, SQL Server = read committed. Check yours.","Most apps would benefit from snapshot isolation (RC + writes see a consistent snapshot).","Serializable is expensive — implemented via locking or serializable snapshot isolation (SSI).","If you don't think about isolation, you're using whatever the default is — which may or may not match your assumptions."]},{slug:"wal",number:"05",title:"Write-Ahead Log (WAL)",blurb:"Why writing the log first is the trick that gives databases durability after a crash.",Widget:W(ve),intro:r.jsx(r.Fragment,{children:"The trick: before changing the actual data pages, write a description of the change to a sequential log. If the system crashes mid-update, recovery replays the log. The data pages can lazily catch up."}),sections:[{heading:"Why the log first?",body:r.jsxs("ul",{children:[r.jsx("li",{children:"Sequential writes to the log are an order of magnitude faster than random writes to data pages."}),r.jsx("li",{children:"Once the log is on disk, the transaction is durable — even if the data pages haven't been flushed yet."}),r.jsx("li",{children:"On crash, recovery scans the log and replays committed transactions, undoes uncommitted ones."}),r.jsx("li",{children:"Checkpoints periodically force the data pages to catch up, letting old log segments be truncated."})]})}],takeaways:["Durability without WAL would mean fsyncing every page change. Far too slow.","Postgres, MySQL InnoDB, SQLite, and every serious database uses WAL.","fsync on the log is the actual durability boundary. If your hardware lies about that, you lose data on crash.","Replication often piggybacks on the WAL — replicas just replay the same log."]},{slug:"replication",number:"06",title:"Replication",blurb:"A primary and its replicas. Toggle sync vs async writes and see the lag tradeoff.",Widget:W(fe),intro:r.jsx(r.Fragment,{children:"Keep extra copies of the database for read scaling, geographic latency, and disaster recovery. The hard part is keeping them in sync without killing write performance."}),sections:[{heading:"Sync vs async",body:r.jsxs("ul",{children:[r.jsxs("li",{children:[r.jsx("strong",{children:"Async"})," — primary commits, then ships the log to replicas in the background. Fast writes, but replicas can fall behind. If the primary dies, you might lose recent writes."]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Sync"})," — primary waits for at least one replica to acknowledge before committing. Safer, slower. If a replica is slow, your writes are slow."]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Quorum"})," — wait for K out of N. The middle ground; what Raft and Postgres synchronous_standby do."]})]})}],takeaways:["Async replication is the default. It's fast but loses recent writes on primary failure.","Sync replication trades latency for durability. Use it when losing a transaction is worse than slow commits.","Replica lag is the number to watch. When it grows, your reads get stale.","Multi-primary (active-active) is much harder — conflicts must be resolved somehow."]},{slug:"sharding",number:"07",title:"Sharding & Partitioning",blurb:"Pick a shard strategy and watch data distribute across nodes — fairly or not.",Widget:W(Ee),intro:r.jsx(r.Fragment,{children:"A single machine can only hold so much data. Sharding spreads the dataset across multiple machines using a key. The strategy you pick decides whether the load is balanced — and whether you can run cross-shard queries at all."}),sections:[{heading:"Three common strategies",body:r.jsxs("ul",{children:[r.jsxs("li",{children:[r.jsx("strong",{children:"Range"})," — keys 1–1000 on shard A, 1001–2000 on shard B. Range scans are local; hot ranges create hot shards."]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Hash"})," — hash(key) % N picks the shard. Even distribution; range scans need to hit every shard."]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Consistent hashing"})," — like hash, but adding/removing nodes only reshuffles a fraction of keys. The default for distributed caches."]})]})}],takeaways:["Range = local range scans, risk of hot shards.","Hash = even load, but no range queries without a scatter-gather.","Consistent hashing makes resharding cheap. Crucial for elastic systems.","Cross-shard transactions are the hardest problem. Most systems just don't support them."]},{slug:"query",number:"08",title:"Query Execution",blurb:"From SQL text to result set: parser → planner → executor, step by step.",Widget:W(ke),intro:r.jsx(r.Fragment,{children:"SQL is declarative — you say what you want, the database figures out how. Three passes get from text to rows: parse the SQL, plan an execution strategy, run it."}),sections:[{heading:"The pipeline",body:r.jsxs("ol",{children:[r.jsxs("li",{children:[r.jsx("strong",{children:"Parse"})," — SQL string → abstract syntax tree."]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Plan"})," — pick join orders, indexes, sort strategies. The optimizer's job. Same query can have wildly different plans."]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Execute"})," — pull rows through the plan tree using the iterator (volcano) or vectorised model."]})]})}],takeaways:["EXPLAIN ANALYZE is your friend. Always know what plan the database picked.","The optimizer relies on statistics. Stale stats → bad plans → slow queries. Re-analyze regularly.","Index choice can change query time by 10000×. Pick wisely.","Modern engines (DuckDB, ClickHouse, Snowflake) use vectorised execution — process batches of rows at a time, not one row."]}]};export{Me as manifest};
