import{r as _,j as a}from"./main-Dfqj_VUe.js";import{L as pe}from"./LegacyWidget-CUf1c2G7.js";const ne={lookup:{label:"Point lookup",sql:"SELECT * FROM users WHERE email = ?"},join:{label:"Filtered join",sql:"SELECT u.name, o.total FROM users u JOIN orders o ON o.user_id = u.id WHERE u.country = 'NL'"},range:{label:"Range scan",sql:"SELECT * FROM orders WHERE created_at > ?"}},X=.03,ie=.1;function ge(t){const e=Math.log10(1e3),i=Math.log10(1e7);return Math.round(Math.pow(10,e+t/100*(i-e)))}function fe(t){const e=Math.log10(1e3),i=Math.log10(1e7);return(Math.log10(t)-e)/(i-e)*100}function H(t){return t>=1e6?(t/1e6).toFixed(t>=1e7?0:1)+"M":t>=1e3?(t/1e3).toFixed(t>=1e4?0:1)+"K":String(Math.round(t))}function re(t){return t>=1e6?(t/1e6).toFixed(2)+"M":t>=1e3?(t/1e3).toFixed(1)+"K":t.toFixed(1)}const ye=1,Z=5,ve=1.5,be=1.2;function U(t){return t*ye}function K(t){return Math.log2(Math.max(2,t))*Z}function xe(t,e){return t*e*ve+Math.log2(Math.max(2,t))*Z}function we(t,e,i,s){if(t==="lookup"){const m=[{id:"seq",label:"SeqScan users",cost:U(i),tree:[{op:"SeqScan",target:"users",detail:"filter: email = ?"}]}];return e.userEmail&&m.push({id:"idx",label:"IndexScan users.email_idx",cost:K(i),tree:[{op:"IndexScan",target:"users.email_idx",detail:"email = ?"}]}),m}if(t==="range"){const m=[{id:"seq",label:"SeqScan orders + Filter",cost:U(s),tree:[{op:"SeqScan",target:"orders",detail:"filter: created_at > ?"}]}];return e.orderCreated&&m.push({id:"idx",label:"IndexScan orders.created_at_idx",cost:xe(s,ie),tree:[{op:"IndexScan",target:"orders.created_at_idx",detail:`range, ~${Math.round(ie*100)}% selective`}]}),m}e.userCountry?K(i)/Z*X*i+K(i):U(i);const o=i*X,v=e.userCountry?i*X*1.2+Math.log2(Math.max(2,i))*Z:U(i),c=[],f=e.orderUserId?K(s):U(s);c.push({id:"nl",label:"NestedLoop",cost:v+o*f,tree:[{op:"NestedLoop",target:"",detail:`outer ~${H(o)} rows`},{op:e.userCountry?"IndexScan":"SeqScan",target:e.userCountry?"users.country_idx":"users",detail:"country = 'NL'",indent:1},{op:e.orderUserId?"IndexScan":"SeqScan",target:e.orderUserId?"orders.user_id_idx":"orders",detail:"user_id = u.id",indent:1}]});const d=v+U(s)+o*be;return c.push({id:"hash",label:"HashJoin",cost:d,tree:[{op:"HashJoin",target:"",detail:`build: users[NL] ~${H(o)}`},{op:e.userCountry?"IndexScan":"SeqScan",target:e.userCountry?"users.country_idx":"users",detail:"country = 'NL' (build)",indent:1},{op:"SeqScan",target:"orders",detail:"probe",indent:1}]}),c}function Te(t,e,i,s,o,v){return t==="lookup"?e.id==="idx"?`Index on users.email lets the optimiser jump straight to the row — O(log N) vs O(N) for a full scan of ${H(o)} rows.`:`No index on users.email — the only option is a full table scan of all ${H(o)} rows. Toggle the index on to see the optimiser switch.`:t==="range"?e.id==="idx"?`Index on orders.created_at: only ~${Math.round(ie*100)}% of rows match, so the optimiser walks the index instead of scanning all ${H(v)} rows.`:`No index on orders.created_at — a sequential scan is the only choice. With ${H(v)} rows that's expensive.`:(i.find(c=>c.id!==e.id),e.id==="hash"?s.orderUserId?`Hash join wins: orders is large (${H(v)} rows), and a single sequential pass beats ${H(o*X)} index probes.`:`Hash join wins: no index on orders.user_id, so a nested loop would re-scan all ${H(v)} orders for each NL user. Hashing scans each side once.`:s.orderUserId?`Nested loop wins: outer side is small (~${H(o*X)} NL users) and the orders.user_id index makes each probe cheap.`:"Nested loop wins narrowly — outer side is tiny, so even unindexed inner scans don't dominate yet. Grow the orders table and watch hash join take over.")}function Ee({plan:t}){return a.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"0.9rem",lineHeight:1.7},children:t.tree.map((e,i)=>{const s=e.indent||0;return a.jsxs("div",{style:{paddingLeft:s*1.4+"rem",whiteSpace:"nowrap"},children:[a.jsx("span",{style:{color:"var(--ink-faint)"},children:s>0?"└─ ":""}),a.jsx("span",{style:{fontWeight:600,color:e.op.includes("Index")?"#2a8a3e":e.op.includes("Hash")||e.op.includes("Nested")?"#1c6dd0":"var(--ink)"},children:e.op}),e.target&&a.jsxs("span",{style:{color:"var(--ink)"},children:["  ",e.target]}),e.detail&&a.jsxs("span",{style:{color:"var(--ink-soft)"},children:["  (",e.detail,")"]})]},i)})})}function V({checked:t,onChange:e,label:i}){return a.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"0.4rem",fontFamily:"var(--font-mono)",fontSize:"0.85rem",cursor:"pointer"},children:[a.jsx("input",{type:"checkbox",checked:t,onChange:s=>e(s.target.checked)}),a.jsx("code",{children:i})]})}function le({label:t,rows:e,onRowsChange:i}){return a.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.2rem"},children:[a.jsxs("div",{style:{display:"flex",justifyContent:"space-between",fontFamily:"var(--font-mono)",fontSize:"0.8rem"},children:[a.jsx("span",{children:t}),a.jsxs("strong",{style:{color:"var(--accent)"},children:[H(e)," rows"]})]}),a.jsx("input",{type:"range",min:0,max:100,step:1,value:fe(e),onChange:s=>i(ge(+s.target.value)),style:{width:"100%"}})]})}function ke(){const[t,e]=_.useState("lookup"),[i,s]=_.useState({userEmail:!1,userCountry:!1,orderUserId:!1,orderCreated:!1}),[o,v]=_.useState(1e5),[c,f]=_.useState(1e6),{chosen:d,candidates:m,why:p}=_.useMemo(()=>{const w=we(t,i,o,c),u=w.reduce((l,x)=>x.cost<l.cost?x:l,w[0]);return{chosen:u,candidates:w,why:Te(t,u,w,i,o,c)}},[t,i,o,c]),b=w=>u=>s(l=>({...l,[w]:u}));return a.jsxs("div",{className:"widget",children:[a.jsx("div",{className:"widget-title",children:"Query optimiser — why this plan?"}),a.jsx("div",{className:"controls",style:{flexWrap:"wrap"},children:Object.entries(ne).map(([w,u])=>a.jsx("button",{className:`btn ${t===w?"btn-accent":""}`,onClick:()=>e(w),children:u.label},w))}),a.jsx("pre",{style:{background:"var(--paper-deep)",border:"1.5px solid var(--ink)",borderRadius:"var(--radius)",padding:"0.7rem 1rem",fontFamily:"var(--font-mono)",fontSize:"0.9rem",margin:"0.6rem 0",whiteSpace:"pre-wrap"},children:ne[t].sql}),a.jsxs("div",{style:{display:"grid",gridTemplateColumns:"minmax(220px, 1fr) minmax(280px, 1.4fr)",gap:"1rem",alignItems:"start"},children:[a.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.9rem"},children:[a.jsxs("div",{children:[a.jsx("div",{style:{fontFamily:"var(--font-display)",fontSize:"0.85rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--ink-soft)",marginBottom:"0.4rem"},children:"Indexes"}),a.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.3rem"},children:[a.jsx(V,{checked:i.userEmail,onChange:b("userEmail"),label:"users.email"}),a.jsx(V,{checked:i.userCountry,onChange:b("userCountry"),label:"users.country"}),a.jsx(V,{checked:i.orderUserId,onChange:b("orderUserId"),label:"orders.user_id"}),a.jsx(V,{checked:i.orderCreated,onChange:b("orderCreated"),label:"orders.created_at"})]})]}),a.jsxs("div",{children:[a.jsx("div",{style:{fontFamily:"var(--font-display)",fontSize:"0.85rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--ink-soft)",marginBottom:"0.4rem"},children:"Table sizes"}),a.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.6rem"},children:[a.jsx(le,{label:"users",rows:o,onRowsChange:v}),a.jsx(le,{label:"orders",rows:c,onRowsChange:f})]})]})]}),a.jsxs("div",{className:"widget-stage",style:{padding:"0.9rem 1rem",minHeight:220},children:[a.jsx("div",{style:{fontFamily:"var(--font-display)",fontSize:"0.8rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--ink-soft)",marginBottom:"0.3rem"},children:"Chosen plan"}),a.jsx(Ee,{plan:d}),a.jsxs("div",{className:"metrics",style:{margin:"0.8rem 0 0.4rem"},children:[a.jsxs("div",{className:"metric accent",children:[a.jsx("div",{className:"label",children:"Est. cost"}),a.jsx("div",{className:"value",children:re(d.cost)})]}),a.jsxs("div",{className:"metric",children:[a.jsx("div",{className:"label",children:"Operator"}),a.jsx("div",{className:"value",style:{fontSize:"1.1rem"},children:d.label.split(" ")[0]})]})]}),m.length>1&&a.jsxs("div",{style:{marginTop:"0.6rem"},children:[a.jsx("div",{style:{fontFamily:"var(--font-display)",fontSize:"0.75rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--ink-soft)",marginBottom:"0.2rem"},children:"Candidates considered"}),a.jsx("table",{style:{width:"100%",borderCollapse:"collapse",fontFamily:"var(--font-mono)",fontSize:"0.8rem"},children:a.jsx("tbody",{children:m.map(w=>a.jsxs("tr",{style:{background:w.id===d.id?"var(--accent-soft)":"transparent"},children:[a.jsx("td",{style:{padding:"0.25em 0.5em",borderBottom:"1px solid var(--ink-faint)",width:30},children:w.id===d.id?"✓":" "}),a.jsx("td",{style:{padding:"0.25em 0.5em",borderBottom:"1px solid var(--ink-faint)"},children:w.label}),a.jsx("td",{style:{padding:"0.25em 0.5em",borderBottom:"1px solid var(--ink-faint)",textAlign:"right",fontWeight:w.id===d.id?600:400},children:re(w.cost)})]},w.id))})})]})]})]}),a.jsxs("div",{className:"callout",children:[a.jsx("strong",{children:"Why this plan."})," ",p]})]})}function Se(t){t.innerHTML=`
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
  `;const e=t.querySelector("#acid-pane");t.querySelectorAll("input[name=acid-tab]").forEach(s=>s.addEventListener("change",o=>i(o.target.value))),i("a");function i(s){e.innerHTML="",s==="a"&&$e(e),s==="c"&&Le(e),s==="i"&&Ce(e),s==="d"&&Me(e)}}function $e(t){let e=100,i=50,s=!1;t.innerHTML=`
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
  `;function o(){t.querySelector("#acc-a").innerHTML=`<h4>Alice</h4><div class="bal">$${e}</div>`,t.querySelector("#acc-b").innerHTML=`<h4>Bob</h4><div class="bal">$${i}</div>`}o();const v=t.querySelector("#a-log");function c(f,d){const m=document.createElement("div");m.className=`entry ${f}`,m.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${d}`,v.prepend(m)}t.querySelector("#a-success").addEventListener("click",async()=>{s||(s=!0,c("info","BEGIN TRANSACTION"),await M(400),e-=30,o(),c("info",`UPDATE alice SET balance = balance - 30  // alice=${e}`),await M(700),i+=30,o(),c("info",`UPDATE bob SET balance = balance + 30  // bob=${i}`),await M(400),c("ok","COMMIT — both writes durable"),s=!1)}),t.querySelector("#a-crash").addEventListener("click",async()=>{if(s)return;s=!0;const f=e,d=i;c("info","BEGIN TRANSACTION"),await M(400),e-=30,o(),c("info",`UPDATE alice SET balance = balance - 30  // alice=${e}`),await M(700),c("err","💥 CRASH!  step 2 never ran."),await M(600),c("info","Recovery: WAL has no COMMIT for this txn — ROLLBACK"),await M(500),e=f,i=d,o(),c("ok","Atomicity holds. Both accounts restored."),s=!1}),t.querySelector("#a-reset").addEventListener("click",()=>{e=100,i=50,o(),v.innerHTML=""})}function Le(t){t.innerHTML=`
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
  `;const e=[],i=t.querySelector("#c-rows"),s=t.querySelector("#c-log");function o(f,d){const m=document.createElement("div");m.className=`entry ${f}`,m.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${d}`,s.prepend(m)}function v(){i.innerHTML=e.map(f=>`<tr><td>${f.id}</td><td>${f.email}</td><td>${f.age}</td></tr>`).join("")||'<tr><td colspan="3" style="text-align:center; color: var(--ink-faint);">(empty)</td></tr>'}v();const c={"ok-1":{id:1,email:"aiko@x.io",age:28},"ok-2":{id:2,email:"mateo@x.io",age:41},dup:{id:3,email:"aiko@x.io",age:30},null:{id:4,email:null,age:22},neg:{id:5,email:"kid@x.io",age:-3}};t.querySelectorAll("[data-insert]").forEach(f=>{f.addEventListener("click",()=>{const d=c[f.dataset.insert];if(e.some(m=>m.email===d.email&&d.email!=null)){o("err","❌ UNIQUE violation on email — rolled back");return}if(d.email==null){o("err","❌ NOT NULL violation on email — rolled back");return}if(d.age<0){o("err","❌ CHECK constraint (age >= 0) failed — rolled back");return}e.push(d),v(),o("ok",`✅ INSERT id=${d.id} committed`)})}),t.querySelector("#c-reset").addEventListener("click",()=>{e.length=0,v(),s.innerHTML=""})}function Ce(t){t.innerHTML=`
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
  `;const e=t.querySelector("#i-stage"),i=t.querySelector("#i-explain");function s(f){e.innerHTML=f}async function o(){let f=100;s(c("T1","— BEGIN —",0,100,"commit")+c("T2","— BEGIN —",0,100,"commit")+c("DB",`balance = $${f}`,0,100,"read")),await M(500),s(c("T1","UPDATE balance = balance + 50  (locks row)",0,100,"write")+c("T2","... waits for T1 ...",0,100,"read")+c("DB",`balance = $${f} (uncommitted in T1)`,0,100,"read")),await M(900),f=150,s(c("T1","COMMIT",0,100,"commit")+c("T2","SELECT balance",0,100,"read")+c("DB",`balance = $${f}`,0,100,"read")),await M(700),i.innerHTML=`<strong>T2 saw $${f}</strong> — the committed value. Never saw the in-progress write. ✅`}async function v(){s(c("T1","BEGIN; UPDATE balance += 50 (uncommitted)",0,100,"write")+c("T2","BEGIN; SELECT balance",0,100,"read")+c("DB","balance = $150 (in-flight!)",0,100,"read")),await M(900),s(c("T1","ROLLBACK",0,100,"abort")+c("T2","(saw $150 — but it never existed)",0,100,"read")+c("DB","balance = $100",0,100,"read")),await M(600),i.innerHTML="<strong>T2 read $150 — a value that was rolled back.</strong> This is a dirty read. Don't let your database do this. ❌"}t.querySelector("#i-run").addEventListener("click",o),t.querySelector("#i-dirty").addEventListener("click",v),t.querySelector("#i-reset").addEventListener("click",()=>{s(""),i.innerHTML="Pick an option to see two transactions interleave."});function c(f,d,m,p,b){return`<div class="timeline"><div class="actor">${f}</div><div class="track"><div class="step ${b}" style="left:${m}%; width:${p-m}%;">${d}</div></div></div>`}}function Me(t){t.innerHTML=`
    <h3 style="font-family: var(--font-display); letter-spacing: 0.04em;">Crash Survival</h3>
    <p>Once the database says "COMMIT", the write must survive a power cut. The trick is the <strong>Write-Ahead Log</strong> (Lesson 5). Here's a preview.</p>

    <div class="widget-stage" id="d-stage"></div>

    <div class="controls">
      <button class="btn btn-accent" id="d-after">Crash AFTER commit</button>
      <button class="btn" id="d-before">Crash BEFORE commit</button>
      <button class="btn btn-ghost" id="d-reset">Reset</button>
    </div>
    <div class="callout" id="d-explain">A commit writes to the log first, then later flushes to the data pages. Recovery replays the log.</div>
  `;const e=t.querySelector("#d-stage"),i=t.querySelector("#d-explain");function s(c,f,d,m){e.innerHTML=`
      <div class="d-layers">
        <div class="d-layer">
          <div class="d-label">CLIENT</div>
          <div class="d-box">${m}</div>
        </div>
        <div class="d-layer">
          <div class="d-label">MEMORY (buffer pool)</div>
          <div class="d-box">balance = $${c}</div>
        </div>
        <div class="d-layer">
          <div class="d-label">WAL (on disk)</div>
          <div class="d-box wal">${f.map(p=>`<span class="wal-cell ${p.committed?"committed":"uncommitted"}">${p.text}</span>`).join("")||"(empty)"}</div>
        </div>
        <div class="d-layer">
          <div class="d-label">DATA FILE (on disk)</div>
          <div class="d-box">balance = $${d}</div>
        </div>
      </div>
      <style>
        .d-layers { display: flex; flex-direction: column; gap: 0.5rem; }
        .d-layer { display: grid; grid-template-columns: 180px 1fr; align-items: center; gap: 0.6rem; }
        .d-label { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-soft); letter-spacing: 0.1em; text-transform: uppercase; text-align: right; }
        .d-box { padding: 0.5em 0.8em; background: var(--paper); border: 1.5px solid var(--ink); border-radius: var(--radius); font-family: var(--font-mono); font-size: 0.95rem; }
        .d-box.wal { font-family: inherit; padding: 0.3em; }
      </style>
    `}async function o(){s(100,[],100,"Idle"),await M(500),s(150,[{text:"UPD bal=150",committed:!1}],100,"Pending"),await M(700),s(150,[{text:"UPD bal=150",committed:!0},{text:"COMMIT",committed:!0}],100,"✅ Acked"),await M(700),i.innerHTML='💥 <strong>Crash!</strong> Memory and data file are out of sync — but the WAL says "COMMIT"...',s("?",[{text:"UPD bal=150",committed:!0},{text:"COMMIT",committed:!0}],100,"⚡ Crash"),await M(900),s(150,[{text:"UPD bal=150",committed:!0},{text:"COMMIT",committed:!0},{text:"REPLAY",committed:!0}],150,"Recovered"),i.innerHTML="Recovery replays the committed WAL entries into the data file. <strong>The committed write survived.</strong> ✅ Durability holds."}async function v(){s(100,[],100,"Idle"),await M(500),s(150,[{text:"UPD bal=150",committed:!1}],100,"Pending (no commit yet)"),await M(900),i.innerHTML="💥 <strong>Crash!</strong> The client never got a COMMIT ack. The WAL entry is uncommitted.",s("?",[{text:"UPD bal=150",committed:!1}],100,"⚡ Crash"),await M(800),s(100,[],100,"Recovered"),i.innerHTML="Recovery discards uncommitted WAL entries. <strong>Balance is still $100.</strong> ✅ No phantom write — the client wasn't promised durability."}t.querySelector("#d-after").addEventListener("click",o),t.querySelector("#d-before").addEventListener("click",v),t.querySelector("#d-reset").addEventListener("click",()=>{s(100,[],100,"Idle"),i.innerHTML="A commit writes to the log first, then later flushes to the data pages. Recovery replays the log."}),s(100,[],100,"Idle")}function M(t){return new Promise(e=>setTimeout(e,t))}const Ie=4,te=Ie-1;let qe=0;function ae(t=!0){return{id:++qe,keys:[],children:[],isLeaf:t}}function je(t){let e=null,i=new Set,s=null,o=null;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Build a B-Tree</div>
      <p class="widget-hint">Max ${te} keys per node. When a node overflows on insert, the median key is pushed up to its parent.</p>

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
  `;const v=t.querySelector("#bt-stage"),c=t.querySelector("#bt-explain"),f=t.querySelector("#bt-count"),d=t.querySelector("#bt-height"),m=t.querySelector("#bt-ops"),p=t.querySelector("#bt-cmp"),b=t.querySelector("#bt-key");t.querySelector("#bt-insert").addEventListener("click",()=>{const r=Number(b.value);Number.isFinite(r)&&(l(r),b.value="",b.focus())}),b.addEventListener("keydown",r=>{r.key==="Enter"&&t.querySelector("#bt-insert").click()}),t.querySelector("#bt-search").addEventListener("click",()=>{const r=Number(b.value);Number.isFinite(r)&&S(r)}),t.querySelector("#bt-bulk").addEventListener("click",()=>{w();for(let r=1;r<=15;r++)u(r);C(),y("Inserted 1..15. Notice how a flat node of 1..3 split, then split again as more arrived.")}),t.querySelector("#bt-random").addEventListener("click",()=>{const r=new Set(L(e));let h=0,g=0;for(;h<5&&g<100;){const k=Math.floor(Math.random()*99)+1;g++,!r.has(k)&&(r.add(k),u(k),h++)}C(),y("Inserted 5 random keys.")}),t.querySelector("#bt-clear").addEventListener("click",()=>{w(),C(),y("Tree cleared.")});function w(){e=null,i.clear(),s=null,o=null}function u(r){if(!e){e=ae(!0),e.keys.push(r);return}if(e.keys.length>=te){const h=ae(!1);h.children.push(e),E(h,0),e=h}x(e,r)}function l(r){if(L(e).includes(r)){y(`${r} is already in the tree — duplicates not inserted.`);return}u(r),C(),y(`Inserted ${r}.`)}function x(r,h){let g=r.keys.length-1;if(r.isLeaf){for(;g>=0&&r.keys[g]>h;)g--;r.keys.splice(g+1,0,h);return}for(;g>=0&&r.keys[g]>h;)g--;g++,r.children[g].keys.length>=te&&(E(r,g),r.keys[g]<h&&g++),x(r.children[g],h)}function E(r,h){const g=r.children[h],k=Math.floor(g.keys.length/2),j=g.keys[k],q=ae(g.isLeaf);q.keys=g.keys.slice(k+1),g.keys=g.keys.slice(0,k),g.isLeaf||(q.children=g.children.slice(k+1),g.children=g.children.slice(0,k+1)),r.children.splice(h+1,0,q),r.keys.splice(h,0,j)}function S(r){i.clear(),o=null;let h=e,g=0;for(;h;){i.add(h.id),g+=1;let k=0;for(;k<h.keys.length&&r>h.keys[k];)k++;if(k<h.keys.length&&h.keys[k]===r){o=h.id,s=g,C();const j=L(e).length;y(`Found <strong>${r}</strong> in ${g} node visit(s). A table scan would touch ~${j} rows.`);return}if(h.isLeaf){s=g,C();const j=L(e).length;y(`<strong>${r}</strong> not found after ${g} node visit(s). A table scan would still touch all ${j} rows to be sure.`);return}h=h.children[k]}y("Tree is empty.")}function L(r){if(!r)return[];const h=[...r.keys];return r.isLeaf||r.children.forEach(g=>h.push(...L(g))),h.sort((g,k)=>g-k)}function $(r){return r?r.isLeaf?1:1+$(r.children[0]):0}function C(){const r=L(e);if(f.textContent=r.length,d.textContent=$(e),m.textContent=s??"—",s!=null){const A=((r.length||1)/s).toFixed(1);p.textContent=`${A}× faster`}else p.textContent="—";if(!e){v.innerHTML='<div style="text-align:center; color: var(--ink-faint); padding: 2rem;">Empty tree. Insert a key to begin.</div>';return}const h=I(e),k=Math.max(...h.map(T=>T.x+T.width))+40,j=Math.max(...h.map(T=>T.y))+70;let q=`<svg viewBox="0 0 ${k} ${j}" width="100%" style="max-width:${k}px; max-height: 460px;">`;q+=`<style>
      .bt-node-rect { fill: var(--paper); stroke: var(--ink); stroke-width: 2.5; }
      .bt-node-rect.path { stroke: var(--accent); stroke-width: 3; }
      .bt-node-rect.found { fill: var(--accent-soft); stroke: var(--accent); }
      .bt-key { font-family: var(--font-mono); font-size: 14px; fill: var(--ink); }
      .bt-key.found { fill: var(--accent); font-weight: 600; }
      .bt-link { stroke: var(--ink-soft); stroke-width: 1.5; fill: none; }
      .bt-link.path { stroke: var(--accent); stroke-width: 2.5; }
      .bt-slot-div { stroke: var(--ink); stroke-width: 1; }
    </style>`,h.forEach(T=>{T.node.isLeaf||T.node.children.forEach((A,R)=>{const N=h.find(Y=>Y.node.id===A.id);if(!N)return;const W=T.x+T.width*(R+.5)/T.node.children.length,O=T.y+32,G=N.x+N.width/2,B=N.y,ee=i.has(T.node.id)&&i.has(A.id);q+=`<path class="bt-link ${ee?"path":""}" d="M ${W} ${O} C ${W} ${(O+B)/2}, ${G} ${(O+B)/2}, ${G} ${B}"/>`})}),h.forEach(T=>{const A=i.has(T.node.id),R=T.node.id===o;q+=`<rect class="bt-node-rect ${A?"path":""} ${R?"found":""}" x="${T.x}" y="${T.y}" width="${T.width}" height="32" rx="3"/>`;const N=T.width/T.node.keys.length;T.node.keys.forEach((W,O)=>{O>0&&(q+=`<line class="bt-slot-div" x1="${T.x+N*O}" y1="${T.y}" x2="${T.x+N*O}" y2="${T.y+32}"/>`),q+=`<text class="bt-key ${R?"found":""}" x="${T.x+N*(O+.5)}" y="${T.y+21}" text-anchor="middle">${W}</text>`})}),q+="</svg>",v.innerHTML=q}function I(r){const h=[];let g=20;const k=80,j=38,q=14;function T(R,N){const W=R.keys.length*j;let O;if(R.isLeaf)O=g,g+=W+q*2;else{const B=R.children.map(me=>T(me,N+1)),ee=B[0],Y=B[B.length-1];O=(ee.x+(Y.x+Y.width))/2-W/2}const G={node:R,x:O,y:20+N*k,width:W};return h.push(G),G}T(r,0);const A=Math.min(...h.map(R=>R.x));if(A<20){const R=20-A;h.forEach(N=>N.x+=R)}return h}function y(r){c.innerHTML=r}C()}const F=["id","name","city","age","price"],P=[[1,"Aiko","Tokyo",29,120],[2,"Mateo","Lima",41,80],[3,"Priya","Mumbai",34,240],[4,"Kenji","Osaka",22,60],[5,"Lena","Berlin",37,150],[6,"Diego","Bogota",28,200],[7,"Yuna","Seoul",45,310],[8,"Omar","Cairo",31,90]],oe=[{id:"point",label:"SELECT * WHERE id = 4",explain:"Fetch every column of a single row. Row store reads ~1 page; column store reads from 5 different pages.",cells:(t,e)=>P[e][0]===4},{id:"agg",label:"SELECT SUM(price)",explain:"Read one column across every row. Column store reads 1 page; row store has to read all 8 pages and skip 80% of each.",cells:(t,e)=>t==="price"},{id:"narrow",label:"SELECT name, city FROM users",explain:"Two columns, all rows. Column store reads 2 pages; row store still has to read all 8 pages.",cells:(t,e)=>t==="name"||t==="city"}];function Re(t){let e="row",i="point";t.innerHTML=`
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
          ${oe.map(l=>`<option value="${l.id}">${l.label}</option>`).join("")}
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
  `;const s=t.querySelector("#stage"),o=t.querySelector("#explain"),v=t.querySelector("#m-pages"),c=t.querySelector("#m-useful"),f=t.querySelector("#m-wasted"),d=t.querySelector("#m-eff");t.querySelectorAll("input[name=layout]").forEach(l=>l.addEventListener("change",x=>{e=x.target.value,m()})),t.querySelector("#query-select").addEventListener("change",l=>{i=l.target.value,m()});function m(){const l=oe.find(x=>x.id===i);o.textContent=l.explain,e==="row"?s.innerHTML=p(l):s.innerHTML=b(l),w(l)}function p(l){return`<div class="store-row">${P.map((E,S)=>{const L=F.some((I,y)=>l.cells(I,S)),$=F.map((I,y)=>{const r=l.cells(I,S);return`<span class="${L?r?"cell read":"cell skip":"skip"}" data-col="${I}">${E[y]}</span>`}).join("");return`
        <div class="${L?"page page-read":"page page-cold"}">
          <div class="page-label">Page ${S+1}</div>
          <div class="page-cells">${$}</div>
        </div>
      `}).join("")}</div>`+u()}function b(l){return`<div class="store-col">${F.map((E,S)=>{const L=P.some((I,y)=>l.cells(E,y)),$=P.map((I,y)=>{const r=l.cells(E,y);return`<span class="${L?r?"cell read":"cell skip":"skip"}">${I[S]}</span>`}).join("");return`
        <div class="${L?"page page-read":"page page-cold"}">
          <div class="page-label">Page · ${E}</div>
          <div class="page-cells col">${$}</div>
        </div>
      `}).join("")}</div>`+u()}function w(l){let x=0,E=0,S=0;e==="row"?P.forEach((C,I)=>{F.some(r=>l.cells(r,I))&&(x+=1,F.forEach(r=>{l.cells(r,I)?E+=1:S+=1}))}):F.forEach(C=>{P.some((y,r)=>l.cells(C,r))&&(x+=1,P.forEach((y,r)=>{l.cells(C,r)?E+=1:S+=1}))});const L=E+S,$=L===0?0:Math.round(E/L*100);v.textContent=x,c.textContent=E,f.textContent=S,d.textContent=$+"%"}function u(){return`<style>
      .store-row { display: flex; flex-direction: column; gap: 0.4rem; }
      .store-col { display: flex; flex-direction: row; gap: 0.6rem; flex-wrap: wrap; justify-content: center; }
      .page { border: 2px solid var(--ink); background: var(--paper); padding: 0.4rem; border-radius: var(--radius); }
      .page-read { box-shadow: 3px 3px 0 var(--ink); }
      .page-cold { opacity: 0.5; background: repeating-linear-gradient(45deg, transparent 0 4px, var(--hatch) 4px 5px), var(--paper); }
      .page-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); margin-bottom: 0.3rem; letter-spacing: 0.08em; text-transform: uppercase; }
      .page-cells { display: flex; gap: 0; flex-wrap: wrap; }
      .page-cells.col { flex-direction: column; }
    </style>`}m()}const de=[{id:"ru",label:"Read Uncommitted",short:"RU"},{id:"rc",label:"Read Committed",short:"RC"},{id:"rr",label:"Repeatable Read",short:"RR"},{id:"sr",label:"Serializable",short:"SR"}],se={dirty:{label:"Dirty Read",description:"T1 updates a row, T2 reads it, T1 rolls back.",runs:{ru:()=>[n("T1","BEGIN"),n("T2","BEGIN"),n("T1","UPDATE balance = 150  (uncommitted)","write"),n("T2","SELECT balance → 150  ← ❌ DIRTY READ","read","bad"),n("T1","ROLLBACK","abort"),n("T2","T2 acted on a value that never existed")],rc:()=>[n("T1","BEGIN"),n("T2","BEGIN"),n("T1","UPDATE balance = 150  (uncommitted)","write"),n("T2","SELECT balance → 100  ✅ sees committed only","read","good"),n("T1","ROLLBACK","abort"),n("T2","No dirty read at this level.")],rr:()=>[n("T1","BEGIN"),n("T2","BEGIN"),n("T1","UPDATE balance = 150  (uncommitted)","write"),n("T2","SELECT balance → 100  ✅ sees committed only","read","good"),n("T1","ROLLBACK","abort"),n("T2","No dirty read at this level.")],sr:()=>[n("T1","BEGIN"),n("T2","BEGIN"),n("T1","UPDATE balance = 150  (uncommitted)","write"),n("T2","SELECT balance → 100  ✅ sees committed only","read","good"),n("T1","ROLLBACK","abort"),n("T2","No dirty read at this level.")]}},nonrep:{label:"Non-Repeatable Read",description:"T2 reads a row twice; T1 commits an update in between.",runs:{ru:()=>[n("T1","BEGIN"),n("T2","BEGIN"),n("T2","SELECT balance → 100","read"),n("T1","UPDATE balance = 200; COMMIT","write"),n("T2","SELECT balance → 200  ← ❌ value changed!","read","bad"),n("T2","COMMIT"),n("T2","T2 read different values for the same row in one txn.")],rc:()=>[n("T1","BEGIN"),n("T2","BEGIN"),n("T2","SELECT balance → 100","read"),n("T1","UPDATE balance = 200; COMMIT","write"),n("T2","SELECT balance → 200  ← ❌ value changed!","read","bad"),n("T2","COMMIT"),n("T2","RC sees the latest committed value — non-repeatable.")],rr:()=>[n("T1","BEGIN"),n("T2","BEGIN"),n("T2","SELECT balance → 100","read"),n("T1","UPDATE balance = 200; COMMIT","write"),n("T2","SELECT balance → 100  ✅ snapshot kept","read","good"),n("T2","COMMIT"),n("T2","RR locks the snapshot at txn start — repeatable.")],sr:()=>[n("T1","BEGIN"),n("T2","BEGIN"),n("T2","SELECT balance → 100","read"),n("T1","UPDATE balance = 200; COMMIT","write"),n("T2","SELECT balance → 100  ✅ snapshot kept","read","good"),n("T2","COMMIT"),n("T2","Serializable also prevents this.")]}},phantom:{label:"Phantom Read",description:"T2 reads a range twice; T1 inserts a matching row in between.",runs:{ru:()=>[n("T1","BEGIN"),n("T2","BEGIN"),n("T2","SELECT COUNT(*) WHERE age > 30 → 4","read"),n("T1","INSERT (age=35); COMMIT","write"),n("T2","SELECT COUNT(*) WHERE age > 30 → 5  ← ❌ phantom!","read","bad"),n("T2","COMMIT"),n("T2","A new row appeared in the predicate — phantom.")],rc:()=>[n("T1","BEGIN"),n("T2","BEGIN"),n("T2","SELECT COUNT(*) WHERE age > 30 → 4","read"),n("T1","INSERT (age=35); COMMIT","write"),n("T2","SELECT COUNT(*) WHERE age > 30 → 5  ← ❌ phantom!","read","bad"),n("T2","COMMIT"),n("T2","RC re-reads the committed set — phantom slips in.")],rr:()=>[n("T1","BEGIN"),n("T2","BEGIN"),n("T2","SELECT COUNT(*) WHERE age > 30 → 4","read"),n("T1","INSERT (age=35); COMMIT","write"),n("T2","SELECT COUNT(*) WHERE age > 30 → 4  ✅ snapshot","read","good"),n("T2","COMMIT"),n("T2","Standard says phantoms possible at RR. Postgres uses MVCC and prevents them.")],sr:()=>[n("T1","BEGIN"),n("T2","BEGIN"),n("T2","SELECT COUNT(*) WHERE age > 30 → 4","read"),n("T1","INSERT (age=35); COMMIT  ← may be blocked at SR","write","good"),n("T2","SELECT COUNT(*) WHERE age > 30 → 4  ✅","read","good"),n("T2","COMMIT"),n("T2","Serializable prevents phantoms.")]}}};function n(t,e,i="",s=""){return{actor:t,text:e,kind:i,tag:s}}function Ne(t){let e="dirty",i="ru",s=0;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Two Transactions in Slow Motion</div>

      <div class="controls">
        <label>Phenomenon:</label>
        <div class="pill-group">
          ${Object.entries(se).map(([p,b],w)=>`
            <input type="radio" name="iso-phen" id="phen-${p}" value="${p}" ${w===0?"checked":""}>
            <label for="phen-${p}">${b.label}</label>
          `).join("")}
        </div>
      </div>

      <div class="controls">
        <label>Isolation:</label>
        <div class="pill-group">
          ${de.map((p,b)=>`
            <input type="radio" name="iso-lvl" id="lvl-${p.id}" value="${p.id}" ${b===0?"checked":""}>
            <label for="lvl-${p.id}">${p.short}</label>
          `).join("")}
        </div>
        <button class="btn btn-accent" id="iso-step">Next Step</button>
        <button class="btn btn-ghost" id="iso-reset">Reset</button>
      </div>

      <div class="callout" id="iso-desc"></div>

      <div class="widget-stage" id="iso-stage" style="min-height: 240px;"></div>

      <div class="callout" id="iso-summary" style="display:none"></div>
    </div>
  `;const o=t.querySelector("#iso-stage"),v=t.querySelector("#iso-desc"),c=t.querySelector("#iso-summary");t.querySelectorAll("input[name=iso-phen]").forEach(p=>p.addEventListener("change",b=>{e=b.target.value,s=0,f()})),t.querySelectorAll("input[name=iso-lvl]").forEach(p=>p.addEventListener("change",b=>{i=b.target.value,s=0,f()})),t.querySelector("#iso-step").addEventListener("click",()=>{const p=se[e].runs[i]();s<p.length&&s++,f()}),t.querySelector("#iso-reset").addEventListener("click",()=>{s=0,f()});function f(){const p=se[e],b=p.runs[i]();if(v.innerHTML=`<strong>${p.label}</strong> at <strong>${de.find(w=>w.id===i).label}</strong>. ${p.description}`,o.innerHTML=b.slice(0,s).map((w,u)=>d(w,u)).join(""),s>=b.length){const w=b.some(u=>u.tag==="bad");c.style.display="block",c.innerHTML=w?"❌ <strong>Phenomenon occurred</strong> at this level. The database allowed it. Move to a higher isolation level to prevent.":"✅ <strong>Phenomenon prevented</strong>. This isolation level was strong enough."}else c.style.display="none"}function d(p,b){const w=p.actor==="T1";return`
      <div class="iso-row ${p.tag}">
        <div class="iso-stepnum">${String(b+1).padStart(2,"0")}</div>
        ${w?`<div class="iso-cell t1 ${p.kind}">${m(p.text)}</div>
                  <div class="iso-cell empty"></div>`:`<div class="iso-cell empty"></div>
                  <div class="iso-cell t2 ${p.kind}">${m(p.text)}</div>`}
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
    `}function m(p){return String(p).replace(/[&<>"']/g,b=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[b])}f()}function Ae(t){const e={mem:{x:10,y:20},walEntries:[],disk:{x:10,y:20},pending:[],txnOpen:!1,seq:0,crashed:!1};t.innerHTML=`
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
  `;const i=t.querySelector("#wal-stage"),s=t.querySelector("#wal-log");function o(d,m){const p=document.createElement("div");p.className=`entry ${d}`,p.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${m}`,s.prepend(p)}t.querySelector("#wal-begin").addEventListener("click",()=>{if(e.crashed)return o("err","Server is down — reset first.");if(e.txnOpen)return o("err","A transaction is already open.");e.txnOpen=!0,e.pending=[],o("info","BEGIN TRANSACTION"),v()}),t.querySelector("#wal-set-x").addEventListener("click",()=>{if(e.crashed)return;if(!e.txnOpen)return o("err","No open transaction. Click BEGIN first.");const d=c();e.mem.x=d,e.seq+=1,e.walEntries.push({seq:e.seq,op:`SET x=${d}`,committed:!1}),e.pending.push(e.seq),o("info",`Memory: x=${d}.  WAL append (uncommitted, seq=${e.seq}).`),v()}),t.querySelector("#wal-set-y").addEventListener("click",()=>{if(e.crashed)return;if(!e.txnOpen)return o("err","No open transaction. Click BEGIN first.");const d=c();e.mem.y=d,e.seq+=1,e.walEntries.push({seq:e.seq,op:`SET y=${d}`,committed:!1}),e.pending.push(e.seq),o("info",`Memory: y=${d}.  WAL append (uncommitted, seq=${e.seq}).`),v()}),t.querySelector("#wal-commit").addEventListener("click",()=>{if(!e.crashed){if(!e.txnOpen)return o("err","Nothing to commit.");e.walEntries.forEach(d=>{e.pending.includes(d.seq)&&(d.committed=!0)}),e.seq+=1,e.walEntries.push({seq:e.seq,op:"COMMIT",committed:!0,isCommit:!0}),o("ok","fsync(WAL).  COMMIT durable (data page still in memory only)."),e.pending=[],e.txnOpen=!1,v()}}),t.querySelector("#wal-flush").addEventListener("click",()=>{e.crashed||(e.disk={...e.mem},e.walEntries.forEach(d=>d.flushed=!0),o("ok",`Data page flushed to disk. x=${e.disk.x}, y=${e.disk.y}.`),v())}),t.querySelector("#wal-crash").addEventListener("click",async()=>{if(e.crashed)return;e.crashed=!0,o("err","💥 Power cut! Memory wiped."),e.mem={...e.disk},e.pending=[],e.txnOpen=!1,v(),await f(800),o("info","Restarting… reading WAL…"),await f(600);const d=[];e.walEntries.forEach(m=>{if(m.committed&&!m.flushed&&!m.isCommit){const p=m.op.match(/SET (x|y)=(\-?\d+)/);p&&(e.mem[p[1]]=Number(p[2]),d.push(m.op))}}),d.length?o("ok",`Replayed: ${d.join(", ")}`):o("info","Nothing to replay — committed state matches disk."),e.walEntries=e.walEntries.filter(m=>m.committed),e.crashed=!1,v(),o("ok","Recovery complete. Database online.")}),t.querySelector("#wal-reset").addEventListener("click",()=>{e.mem={x:10,y:20},e.disk={x:10,y:20},e.walEntries=[],e.pending=[],e.txnOpen=!1,e.seq=0,e.crashed=!1,s.innerHTML="",v()});function v(){i.innerHTML=`
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
            ${e.walEntries.length===0?'<span style="color: var(--ink-faint);">(empty)</span>':e.walEntries.map(d=>`<span class="wal-cell ${d.committed?"committed":"uncommitted"}" title="seq=${d.seq}">${d.op}</span>`).join("")}
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
    `}function c(){return Math.floor(Math.random()*90+10)}function f(d){return new Promise(m=>setTimeout(m,d))}v()}function Oe(t){const e={mode:"async",primaryLog:[],replicas:[{id:"R1",name:"Replica 1",log:[],down:!1,lagMs:100,baseLag:100},{id:"R2",name:"Replica 2",log:[],down:!1,lagMs:250,baseLag:250},{id:"R3",name:"Replica 3",log:[],down:!1,lagMs:500,baseLag:500}],seq:0,inflight:[],rafHandle:null};t.innerHTML=`
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
        ${e.replicas.map(u=>`<label class="rep-toggle">
          <input type="checkbox" data-rep="${u.id}" checked> ${u.name}
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
  `;const i=t.querySelector("#rep-stage"),s=t.querySelector("#rep-log"),o=t.querySelector("#rep-pseq"),v=t.querySelector("#rep-maxlag"),c=t.querySelector("#rep-last");t.querySelectorAll("input[name=rep-mode]").forEach(u=>u.addEventListener("change",l=>{e.mode=l.target.value,b("info",`Mode → ${e.mode}`)})),t.querySelector("#rep-write").addEventListener("click",f),t.querySelector("#rep-reset").addEventListener("click",d),t.querySelectorAll("input[data-rep]").forEach(u=>u.addEventListener("change",l=>{const x=l.target.dataset.rep,E=e.replicas.find(S=>S.id===x);E.down=!l.target.checked,b(E.down?"err":"ok",`${E.name} ${E.down?"OFFLINE":"ONLINE"}`)}));function f(){e.seq+=1;const u=`v${e.seq}`,l=performance.now();e.primaryLog.push({seq:e.seq,value:u,t:l}),b("ok",`PRIMARY commits ${u} (seq=${e.seq})${e.mode==="sync"?" [waiting for acks…]":""}`),e.replicas.forEach(x=>{if(x.down){b("err",`${x.name} OFFLINE — write queued for later`);return}const E=x.baseLag*(.85+Math.random()*.3);e.inflight.push({toRep:x.id,seq:e.seq,value:u,startT:l,durationMs:E})}),e.mode==="sync"?c.textContent=`${u} ⌛`:c.textContent=u,e.rafHandle||m()}function d(){e.primaryLog=[],e.seq=0,e.inflight=[],e.replicas.forEach(u=>{u.log=[]}),c.textContent="—",s.innerHTML="",w()}function m(){const u=performance.now();e.inflight=e.inflight.filter(l=>{if((u-l.startT)/l.durationMs>=1){const E=e.replicas.find(S=>S.id===l.toRep);return E.log.push({seq:l.seq,value:l.value}),b("ok",`${E.name} applied ${l.value} (lag ${Math.round(l.durationMs)}ms)`),e.mode==="sync"&&p(l.seq)&&(c.textContent=l.value,b("info",`Sync: write ${l.value} fully acked`)),!1}return!0}),w(),e.inflight.length>0?e.rafHandle=requestAnimationFrame(m):e.rafHandle=null}function p(u){return e.replicas.filter(l=>!l.down).every(l=>l.log.some(x=>x.seq===u))}function b(u,l){const x=document.createElement("div");for(x.className=`entry ${u}`,x.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${l}`,s.prepend(x);s.children.length>50;)s.removeChild(s.lastChild)}function w(){const L=[60,140,220];let $='<svg viewBox="0 0 700 280" width="100%" style="max-width:700px;">';$+=`<style>
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
    </style>`,$+='<rect class="rep-node primary" x="30" y="105" width="120" height="70" rx="6"/>',$+='<text class="rep-label" x="90" y="132" text-anchor="middle">PRIMARY</text>',$+=`<text class="rep-sublabel" x="90" y="148" text-anchor="middle">seq = ${e.seq}</text>`,$+=`<text class="rep-sublabel" x="90" y="162" text-anchor="middle">${e.primaryLog.length} writes</text>`,e.replicas.forEach((y,r)=>{const h=L[r],g=y.down?"down":"replica";$+=`<line class="rep-link ${y.down?"down":""}" x1="150" y1="140" x2="480" y2="${h}"/>`,$+=`<rect class="rep-node ${g}" x="480" y="${h-28}" width="120" height="60" rx="6"/>`,$+=`<text class="rep-label" x="540" y="${h-8}" text-anchor="middle">${y.id}</text>`;const k=e.seq-(y.log.length?y.log[y.log.length-1].seq:0);$+=`<text class="rep-sublabel" x="540" y="${h+6}" text-anchor="middle">${y.down?"OFFLINE":`lag: ${k}`}</text>`,$+=`<text class="rep-sublabel" x="540" y="${h+20}" text-anchor="middle">${y.down?"":`${y.log.length} applied`}</text>`;const j=610,q=h-6,T=50,A=12;if($+=`<rect class="lag-bar-bg" x="${j}" y="${q}" width="${T}" height="${A}"/>`,!y.down){const R=Math.min(1,k/Math.max(1,e.seq));$+=`<rect class="lag-bar" x="${j}" y="${q}" width="${T*R}" height="${A}"/>`}});const C=performance.now();e.inflight.forEach(y=>{const r=e.replicas.findIndex(q=>q.id===y.toRep),h=L[r],g=Math.min(1,(C-y.startT)/y.durationMs),k=150+330*g,j=140+(h-140)*g;$+=`<circle class="packet" cx="${k}" cy="${j}" r="14"/>`,$+=`<text class="packet-text" x="${k}" y="${j+4}" text-anchor="middle">${y.value}</text>`}),$+="</svg>",i.innerHTML=$,o.textContent=e.seq;const I=e.replicas.filter(y=>!y.down).map(y=>e.seq-(y.log.length?y.log[y.log.length-1].seq:0));v.textContent=I.length?Math.max(...I,0):"—"}w()}const he=60,z=4,He=["A","B","C","D"],Q=["Tokyo","Berlin","Lima","Mumbai"],We=[.45,.2,.15,.2],ce=Be(he);function Be(t){const e=[];for(let i=1;i<=t;i++){const s=De(i);e.push({id:i,region:s})}return e}function De(t){const e=(t*9301+49297)%233280/233280;let i=0;for(let s=0;s<Q.length;s++)if(i+=We[s],e<i)return Q[s];return Q[Q.length-1]}function Pe(t){let e=t*2654435761;return e=(e^e>>>16)>>>0,e}const J={hash:{label:"Hash",explain:"shard = hash(user_id) % 4. Evenly spread, but a range query like “users 10..20” hits every shard.",assign:t=>Pe(t.id)%z},range:{label:"Range",explain:'ids 1..15 → A, 16..30 → B, 31..45 → C, 46..60 → D. Range scans hit one shard, but if "new users" dominate, the last shard is hot.',assign:t=>Math.min(Math.floor((t.id-1)/(he/z)),z-1)},geo:{label:"Geo",explain:"Tokyo→A, Berlin→B, Lima→C, Mumbai→D. Locality wins, but skewed populations (45% Tokyo) make shard A hot.",assign:t=>Q.indexOf(t.region)}},ue={point:{label:"WHERE user_id = 23",hits:(t,e)=>t.id===23?e:null},range:{label:"WHERE user_id BETWEEN 10 AND 30",hits:(t,e)=>t.id>=10&&t.id<=30?e:null},geoLookup:{label:'WHERE region = "Tokyo"',hits:(t,e)=>t.region==="Tokyo"?e:null},scan:{label:"COUNT(*)",hits:(t,e)=>e}};function Ue(t){let e="hash",i="point";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Shard Distribution</div>
      <p class="widget-hint">Each circle is one user. Each box is one shard machine. Pick a strategy and watch users cluster differently.</p>

      <div class="controls">
        <div class="pill-group">
          ${Object.entries(J).map(([u,l],x)=>`
            <input type="radio" name="strategy" id="strat-${u}" value="${u}" ${x===0?"checked":""}>
            <label for="strat-${u}">${l.label}</label>
          `).join("")}
        </div>

        <label>Query:</label>
        <select class="field" id="query-select">
          ${Object.entries(ue).map(([u,l])=>`<option value="${u}">${l.label}</option>`).join("")}
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
  `;const s=t.querySelector("#stage"),o=t.querySelector("#explain"),v=t.querySelector("#m-max"),c=t.querySelector("#m-min"),f=t.querySelector("#m-skew"),d=t.querySelector("#m-hit");let m=new Set,p=new Set;t.querySelectorAll("input[name=strategy]").forEach(u=>u.addEventListener("change",l=>{e=l.target.value,m=new Set,p=new Set,b()})),t.querySelector("#query-select").addEventListener("change",u=>{i=u.target.value}),t.querySelector("#run-query").addEventListener("click",()=>{const u=ue[i];m=new Set,p=new Set,ce.forEach(l=>{const x=J[e].assign(l);u.hits(l,x)!==null&&(m.add(x),p.add(l.id))}),b()});function b(){o.textContent=J[e].explain;const u=Array.from({length:z},()=>[]);ce.forEach(S=>{u[J[e].assign(S)].push(S)});const l=u.map(S=>S.length),x=Math.max(...l),E=Math.min(...l);v.textContent=x,c.textContent=E,f.textContent=E===0?"∞":(x/E).toFixed(2)+"×",d.textContent=m.size>0?`${m.size}/${z}`:"—",s.innerHTML=w(u)}function w(u){const E=200*z;let S=`<svg viewBox="0 0 ${E} 270" width="${E}" height="270">`;return S+=`<style>
      .shard-frame { fill: var(--paper); stroke: var(--ink); stroke-width: 2.5; }
      .shard-frame.hot { stroke: var(--accent); stroke-width: 3; }
      .shard-label { font-family: var(--font-display); font-size: 18px; fill: var(--ink); letter-spacing: 1px; }
      .shard-count { font-family: var(--font-mono); font-size: 11px; fill: var(--ink-soft); }
      .user-dot { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1; }
      .user-dot.hit { fill: var(--accent); stroke: var(--ink); }
    </style>`,u.forEach((L,$)=>{const C=$*200,I=m.has($);S+=`
        <rect class="shard-frame ${I?"hot":""}" x="${C}" y="36" width="180" height="220" rx="6"/>
        <text class="shard-label" x="${C+12}" y="28">Shard ${He[$]}</text>
        <text class="shard-count" x="${C+180-12}" y="28" text-anchor="end">${L.length} rows</text>
      `;const y=6;L.forEach((r,h)=>{const g=C+18+h%y*26,k=60+Math.floor(h/y)*26,j=p.has(r.id);S+=`<circle class="user-dot ${j?"hit":""}" cx="${g}" cy="${k}" r="9"><title>id=${r.id} · ${r.region}</title></circle>`,S+=`<text x="${g}" y="${k+3}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px; fill: var(--ink);">${r.id}</text>`})}),S+="</svg>",S}b()}const D=t=>()=>a.jsx(pe,{init:t}),_e={slug:"database",title:"Database",tagline:"How databases really work, from disk pages to query plans.",intro:a.jsx(a.Fragment,{children:"Step inside the database engine. Eight lessons covering ACID guarantees, B-Tree indexes, storage layouts, isolation levels, write-ahead logging, replication, sharding, and query execution — each backed by a widget you can poke at."}),lessons:[{slug:"acid",number:"01",title:"ACID Properties",blurb:"Atomicity, Consistency, Isolation, Durability — what each one actually protects against.",Widget:D(Se),intro:a.jsx(a.Fragment,{children:"Four letters that mean four different guarantees. Most database bugs come from misunderstanding which of these you actually have."}),sections:[{heading:"What each letter protects against",body:a.jsxs("ul",{children:[a.jsxs("li",{children:[a.jsx("strong",{children:"Atomicity"})," — a transaction either fully happens or doesn't happen at all. No half-applied writes."]}),a.jsxs("li",{children:[a.jsx("strong",{children:"Consistency"})," — every commit leaves the database in a valid state (constraints, types, foreign keys all satisfied)."]}),a.jsxs("li",{children:[a.jsx("strong",{children:"Isolation"})," — concurrent transactions don't see each other's intermediate state. Different levels trade isolation for throughput."]}),a.jsxs("li",{children:[a.jsx("strong",{children:"Durability"}),' — once the database says "committed", the data survives a crash. Even right after.']})]})}],takeaways:["Atomicity is rollback. The WAL is what makes it cheap.",`Consistency is the boring one — it's just "constraints are enforced."`,"Isolation is the dial. Higher = safer, lower = faster. Defaults rarely match what you think.","Durability assumes fsync actually flushes to disk. Cloud SSDs lie sometimes."]},{slug:"btree",number:"02",title:"B-Tree Indexes",blurb:"Insert keys into a live B-Tree and see why a database can find one row in millions in microseconds.",Widget:D(je),intro:a.jsxs(a.Fragment,{children:["The data structure that makes ",a.jsx("code",{children:"WHERE id = 42"})," O(log n) instead of O(n). Every relational database uses B-trees (or B+-trees, the disk-friendly variant) for primary indexes."]}),sections:[{heading:"Why B-trees, not binary trees?",body:a.jsx("p",{children:"Disk and SSD pages are 4–16 KB. A binary tree visits one key per page — terrible cache use. A B-tree packs hundreds of keys per node, so each disk read advances you 8–10 levels deep instead of one. That's why a million-row table needs only 3–4 disk reads to find a key."})}],takeaways:["Fan-out is the magic. 100 keys per node → 10^6 rows in 3 levels.","Inserts can split nodes, propagating up to the root. Watch the widget do this.","B+-trees keep all data in leaves and chain them — perfect for range scans.","Concurrent updates use latch coupling and copy-on-write tricks. Beyond this lesson's scope, but the structure is the same."]},{slug:"storage",number:"03",title:"Row vs Column Storage",blurb:"The same data on disk, two ways. Watch which blocks get read for OLTP vs OLAP queries.",Widget:D(Re),intro:a.jsx(a.Fragment,{children:"Row stores keep an entire record together; column stores keep each attribute together. Same logical table, opposite physical layout — and the right choice depends entirely on what your queries look like."}),sections:[{heading:"OLTP vs OLAP",body:a.jsxs("ul",{children:[a.jsxs("li",{children:[a.jsx("strong",{children:"Row (OLTP)"}),": ",a.jsx("code",{children:"SELECT * FROM users WHERE id = 42"})," reads one block."]}),a.jsxs("li",{children:[a.jsx("strong",{children:"Column (OLAP)"}),": ",a.jsx("code",{children:"SELECT AVG(salary) FROM users"})," reads just one column's blocks; everything else stays on disk."]}),a.jsx("li",{children:"Modern systems mix the two (HTAP, Hyper, SingleStore) — write rows, query columns."})]})}],takeaways:["Row store = good for fetching whole records. The default for transactional systems.","Column store = good for aggregating one or two columns over many rows. The default for analytics.","Compression on columns can be 10–100×. All the values in a column have the same type and often similar values.","If you're doing both, you want a system that runs both layouts — or two databases."]},{slug:"isolation",number:"04",title:"Transaction Isolation",blurb:"Dial up the isolation level and watch dirty reads, non-repeatable reads, and phantoms disappear.",Widget:D(Ne),intro:a.jsx(a.Fragment,{children:"Concurrent transactions can step on each other in surprisingly subtle ways. The SQL standard defines four isolation levels, each ruling out one more class of anomaly. Higher levels are safer but slower."}),sections:[{heading:"The anomalies, ranked",body:a.jsxs("ul",{children:[a.jsxs("li",{children:[a.jsx("strong",{children:"Dirty read"})," — see a value another transaction wrote but hasn't committed yet."]}),a.jsxs("li",{children:[a.jsx("strong",{children:"Non-repeatable read"})," — read the same row twice in the same transaction, get different values."]}),a.jsxs("li",{children:[a.jsx("strong",{children:"Phantom read"})," — same query, different set of rows the second time."]}),a.jsxs("li",{children:[a.jsx("strong",{children:"Serializable"})," — none of the above. As if transactions ran one after another."]})]})}],takeaways:["Defaults vary by database. Postgres = read committed, MySQL = repeatable read, SQL Server = read committed. Check yours.","Most apps would benefit from snapshot isolation (RC + writes see a consistent snapshot).","Serializable is expensive — implemented via locking or serializable snapshot isolation (SSI).","If you don't think about isolation, you're using whatever the default is — which may or may not match your assumptions."]},{slug:"wal",number:"05",title:"Write-Ahead Log (WAL)",blurb:"Why writing the log first is the trick that gives databases durability after a crash.",Widget:D(Ae),intro:a.jsx(a.Fragment,{children:"The trick: before changing the actual data pages, write a description of the change to a sequential log. If the system crashes mid-update, recovery replays the log. The data pages can lazily catch up."}),sections:[{heading:"Why the log first?",body:a.jsxs("ul",{children:[a.jsx("li",{children:"Sequential writes to the log are an order of magnitude faster than random writes to data pages."}),a.jsx("li",{children:"Once the log is on disk, the transaction is durable — even if the data pages haven't been flushed yet."}),a.jsx("li",{children:"On crash, recovery scans the log and replays committed transactions, undoes uncommitted ones."}),a.jsx("li",{children:"Checkpoints periodically force the data pages to catch up, letting old log segments be truncated."})]})}],takeaways:["Durability without WAL would mean fsyncing every page change. Far too slow.","Postgres, MySQL InnoDB, SQLite, and every serious database uses WAL.","fsync on the log is the actual durability boundary. If your hardware lies about that, you lose data on crash.","Replication often piggybacks on the WAL — replicas just replay the same log."]},{slug:"replication",number:"06",title:"Replication",blurb:"A primary and its replicas. Toggle sync vs async writes and see the lag tradeoff.",Widget:D(Oe),intro:a.jsx(a.Fragment,{children:"Keep extra copies of the database for read scaling, geographic latency, and disaster recovery. The hard part is keeping them in sync without killing write performance."}),sections:[{heading:"Sync vs async",body:a.jsxs("ul",{children:[a.jsxs("li",{children:[a.jsx("strong",{children:"Async"})," — primary commits, then ships the log to replicas in the background. Fast writes, but replicas can fall behind. If the primary dies, you might lose recent writes."]}),a.jsxs("li",{children:[a.jsx("strong",{children:"Sync"})," — primary waits for at least one replica to acknowledge before committing. Safer, slower. If a replica is slow, your writes are slow."]}),a.jsxs("li",{children:[a.jsx("strong",{children:"Quorum"})," — wait for K out of N. The middle ground; what Raft and Postgres synchronous_standby do."]})]})}],takeaways:["Async replication is the default. It's fast but loses recent writes on primary failure.","Sync replication trades latency for durability. Use it when losing a transaction is worse than slow commits.","Replica lag is the number to watch. When it grows, your reads get stale.","Multi-primary (active-active) is much harder — conflicts must be resolved somehow."]},{slug:"sharding",number:"07",title:"Sharding & Partitioning",blurb:"Pick a shard strategy and watch data distribute across nodes — fairly or not.",Widget:D(Ue),intro:a.jsx(a.Fragment,{children:"A single machine can only hold so much data. Sharding spreads the dataset across multiple machines using a key. The strategy you pick decides whether the load is balanced — and whether you can run cross-shard queries at all."}),sections:[{heading:"Three common strategies",body:a.jsxs("ul",{children:[a.jsxs("li",{children:[a.jsx("strong",{children:"Range"})," — keys 1–1000 on shard A, 1001–2000 on shard B. Range scans are local; hot ranges create hot shards."]}),a.jsxs("li",{children:[a.jsx("strong",{children:"Hash"})," — hash(key) % N picks the shard. Even distribution; range scans need to hit every shard."]}),a.jsxs("li",{children:[a.jsx("strong",{children:"Consistent hashing"})," — like hash, but adding/removing nodes only reshuffles a fraction of keys. The default for distributed caches."]})]})}],takeaways:["Range = local range scans, risk of hot shards.","Hash = even load, but no range queries without a scatter-gather.","Consistent hashing makes resharding cheap. Crucial for elastic systems.","Cross-shard transactions are the hardest problem. Most systems just don't support them."]},{slug:"query",number:"08",title:"Query Execution",blurb:"From SQL text to result set: parser → planner → executor, step by step.",Widget:ke,intro:a.jsx(a.Fragment,{children:"SQL is declarative — you say what you want, the database figures out how. Three passes get from text to rows: parse the SQL, plan an execution strategy, run it."}),sections:[{heading:"The pipeline",body:a.jsxs("ol",{children:[a.jsxs("li",{children:[a.jsx("strong",{children:"Parse"})," — SQL string → abstract syntax tree."]}),a.jsxs("li",{children:[a.jsx("strong",{children:"Plan"})," — pick join orders, indexes, sort strategies. The optimizer's job. Same query can have wildly different plans."]}),a.jsxs("li",{children:[a.jsx("strong",{children:"Execute"})," — pull rows through the plan tree using the iterator (volcano) or vectorised model."]})]})}],takeaways:["EXPLAIN ANALYZE is your friend. Always know what plan the database picked.","The optimizer relies on statistics. Stale stats → bad plans → slow queries. Re-analyze regularly.","Index choice can change query time by 10000×. Pick wisely.","Modern engines (DuckDB, ClickHouse, Snowflake) use vectorised execution — process batches of rows at a time, not one row."]}]};export{_e as manifest};
