import{j as x}from"./main-Ds-YDU3R.js";import{L as j}from"./LegacyWidget-xvrQRn42.js";function D(s){const e={mode:"cp",partitioned:!1,a:{value:"v0"},b:{value:"v0"},seq:0,log:[]};s.innerHTML=`
    <div class="widget">
      <div class="widget-title">Two replicas, one network</div>

      <div class="controls">
        <label>System type:</label>
        <div class="pill-group">
          <input type="radio" name="cap-mode" id="cap-cp" value="cp" checked>
          <label for="cap-cp">CP (consistent, refuses on partition)</label>
          <input type="radio" name="cap-mode" id="cap-ap" value="ap">
          <label for="cap-ap">AP (available, may diverge)</label>
        </div>
        <button class="btn ${e.partitioned?"btn-accent":""}" id="cap-part">${e.partitioned?"Heal partition":"Partition network"}</button>
        <button class="btn btn-ghost" id="cap-reset">Reset</button>
      </div>

      <div class="widget-stage" id="cap-stage" style="min-height: 260px;"></div>

      <div class="controls">
        <strong>Replica A:</strong>
        <button class="btn" data-action="readA">Read</button>
        <button class="btn" data-action="writeA">Write</button>
        <span style="flex: 1;"></span>
        <strong>Replica B:</strong>
        <button class="btn" data-action="readB">Read</button>
        <button class="btn" data-action="writeB">Write</button>
      </div>

      <div class="log" id="cap-log"></div>

      <div class="callout" id="cap-explain">
        Pick a mode, then partition the network and try reading/writing from each side. CP refuses; AP serves on.
      </div>
    </div>
  `;const m=s.querySelector("#cap-stage"),l=s.querySelector("#cap-log");s.querySelectorAll("input[name=cap-mode]").forEach(t=>t.addEventListener("change",i=>{e.mode=i.target.value,c()})),s.querySelector("#cap-part").addEventListener("click",()=>{if(e.partitioned=!e.partitioned,e.partitioned)r("warn","Network partition! A and B can no longer reach each other.");else if(e.mode==="ap"){const t=e.a.value.localeCompare(e.b.value)>0?e.a.value:e.b.value,i=e.a.value,a=e.b.value;e.a.value=t,e.b.value=t,r("info",`Partition healed. AP reconciliation: A=${i} & B=${a} → both ${t} (last-writer-wins).`)}else r("ok","Partition healed. Replicas had stayed in sync.");c()}),s.querySelector("#cap-reset").addEventListener("click",()=>{e.partitioned=!1,e.a={value:"v0",log:[]},e.b={value:"v0",log:[]},e.seq=0,e.log=[],l.innerHTML="",c()}),s.querySelectorAll("button[data-action]").forEach(t=>t.addEventListener("click",()=>u(t.dataset.action)));function u(t){if(t==="readA")return v("A");if(t==="readB")return v("B");if(t==="writeA")return p("A");if(t==="writeB")return p("B")}function v(t){if(e.mode==="cp"&&e.partitioned)r("err",`Read on ${t} during partition: <strong>refused</strong> (CP would rather error than risk stale data)`);else{const i=t==="A"?e.a.value:e.b.value;r("ok",`Read on ${t}: returned ${i}`)}c()}function p(t){e.seq++;const i="v"+e.seq;if(e.mode==="cp"&&e.partitioned){r("err",`Write on ${t} during partition: <strong>refused</strong> (CP needs quorum)`),c();return}e.partitioned?t==="A"?(e.a.value=i,r("warn",`AP write on A: local only — A=${i}, B still ${e.b.value}. Replicas now diverged.`)):(e.b.value=i,r("warn",`AP write on B: local only — B=${i}, A still ${e.a.value}. Replicas now diverged.`)):(e.a.value=i,e.b.value=i,r("ok",`Write on ${t}: replicated to both → ${i}`)),c()}function c(){let a='<svg viewBox="0 0 700 250" width="100%" style="max-width: 700px">';a+=`<style>
      .cap-node { stroke: var(--ink); stroke-width: 2.5; }
      .cap-node.a { fill: #cfe5ff; }
      .cap-node.b { fill: #c8f0c8; }
      .cap-label { font-family: var(--font-display); font-size: 22px; letter-spacing: 2px; fill: var(--ink); }
      .cap-sub { font-family: var(--font-mono); font-size: 12px; fill: var(--ink-soft); }
      .cap-val { font-family: var(--font-mono); font-size: 16px; fill: var(--ink); font-weight: 600; }
      .cap-link { stroke: var(--ink); stroke-width: 3; }
      .cap-link.broken { stroke: var(--accent); stroke-dasharray: 8 6; }
      .cap-cut { stroke: var(--accent); stroke-width: 3; }
    </style>`,a+='<rect class="cap-node a" x="50" y="80" width="180" height="100" rx="8"/>',a+='<text class="cap-label" x="140" y="115" text-anchor="middle">Replica A</text>',a+='<text class="cap-sub" x="140" y="135" text-anchor="middle">us-east-1</text>',a+=`<text class="cap-val" x="140" y="162" text-anchor="middle">value = ${e.a.value}</text>`,a+='<rect class="cap-node b" x="470" y="80" width="180" height="100" rx="8"/>',a+='<text class="cap-label" x="560" y="115" text-anchor="middle">Replica B</text>',a+='<text class="cap-sub" x="560" y="135" text-anchor="middle">eu-west-1</text>',a+=`<text class="cap-val" x="560" y="162" text-anchor="middle">value = ${e.b.value}</text>`,a+=`<line class="cap-link ${e.partitioned?"broken":""}" x1="230" y1="130" x2="470" y2="130"/>`,e.partitioned?(a+='<text x="350" y="125" text-anchor="middle" style="font-family: var(--font-display); font-size: 28px; fill: var(--accent);">✂</text>',a+='<text x="350" y="160" text-anchor="middle" class="cap-sub" style="fill: var(--accent);">PARTITION</text>'):a+='<text x="350" y="124" text-anchor="middle" class="cap-sub">replication link</text>';const n=e.mode==="cp"?"CP (consistent)":"AP (available)",d=e.mode==="cp"?"#cfe5ff":"#ffe9b3";a+=`<rect x="280" y="20" width="140" height="32" rx="6" stroke="var(--ink)" stroke-width="2" fill="${d}"/>`,a+=`<text x="350" y="40" text-anchor="middle" class="cap-label" style="font-size: 14px;">${n}</text>`,a+="</svg>",m.innerHTML=a,s.querySelector("#cap-part").textContent=e.partitioned?"Heal partition":"Partition network";let o;e.partitioned?e.mode==="cp"?o="<strong>Partitioned + CP</strong>: refuses all reads and writes that can't reach a quorum. The system stays correct but unavailable until the partition heals.":o="<strong>Partitioned + AP</strong>: each side keeps serving with its local copy. Replicas diverge during the partition; on heal, they must reconcile (last-writer-wins, CRDTs, or app-level merge).":o=`No partition. Writes propagate to both replicas, reads always return the latest. ${e.mode.toUpperCase()} mode looks fine when the network works.`,s.querySelector("#cap-explain").innerHTML=o}function r(t,i){const a=document.createElement("div");a.className=`entry ${t}`,a.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${i}`,l.prepend(a)}c()}const W=["R1","R2","R3"],M=[{t:1,type:"write",client:"Alice",value:"A1",primary:"R1"},{t:4,type:"replicate",from:"R1",to:"R2"},{t:5,type:"write",client:"Bob",value:"B1",primary:"R1"},{t:7,type:"replicate",from:"R1",to:"R2"},{t:9,type:"replicate",from:"R1",to:"R3"},{t:12,type:"replicate",from:"R1",to:"R3"}],L=14,N={strong:{label:"Strong (linearizable)",note:"Every read returns the latest committed write — even if it has to wait or be redirected to the leader."},ryw:{label:"Read-your-writes",note:"A client always sees its own past writes; may see stale writes from others."},causal:{label:"Causal",note:"If A caused B, every observer sees A before B. Independent writes may appear in any order."},eventual:{label:"Eventual",note:"Any replica may return any old value; eventually all converge."}};function q(s,e){const m=[];for(const l of M){if(l.t>e)break;if(l.type==="write"&&s===l.primary)m.push({value:l.value,at:l.t,by:l.client});else if(l.type==="replicate"&&l.to===s){const v=M.filter(p=>p.type==="write"&&p.t<l.t)[m.length];v&&m.push({value:v.value,at:l.t,by:v.client})}}return m}function F(s){let e="strong",m=6,l="R2";s.innerHTML=`
    <div class="widget">
      <div class="widget-title">Same timeline, four consistency models</div>

      <div class="controls">
        <label>Model:</label>
        <div class="pill-group">
          ${Object.entries(N).map(([p,c],r)=>`
            <input type="radio" name="con-m" id="con-${p}" value="${p}" ${r===0?"checked":""}>
            <label for="con-${p}">${c.label.split(" ")[0]}</label>
          `).join("")}
        </div>
      </div>

      <div class="controls">
        <label>Read from:</label>
        <div class="pill-group">
          ${W.map((p,c)=>`
            <input type="radio" name="con-r" id="con-r${c}" value="${p}" ${c===1?"checked":""}>
            <label for="con-r${c}">${p}</label>
          `).join("")}
        </div>
        <label>at t=</label>
        <input type="range" min="0" max="${L}" value="6" id="con-t" style="width: 200px;">
        <span id="con-t-val" style="font-family: var(--font-mono); min-width: 2em;">6</span>
      </div>

      <div class="widget-stage" id="con-stage" style="min-height: 280px;"></div>

      <div class="callout" id="con-explain"></div>
    </div>
  `;const u=s.querySelector("#con-stage");s.querySelectorAll("input[name=con-m]").forEach(p=>p.addEventListener("change",c=>{e=c.target.value,v()})),s.querySelectorAll("input[name=con-r]").forEach(p=>p.addEventListener("change",c=>{l=c.target.value,v()})),s.querySelector("#con-t").addEventListener("input",p=>{m=Number(p.target.value),s.querySelector("#con-t-val").textContent=m,v()});function v(){let r='<svg viewBox="0 0 760 230" width="100%" style="max-width: 760px">';r+=`<style>
      .con-row { font-family: var(--font-display); font-size: 14px; letter-spacing: 1px; fill: var(--ink); }
      .con-track-bg { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1.5; }
      .con-write { fill: var(--accent); stroke: var(--ink); stroke-width: 1.5; }
      .con-write-text { font-family: var(--font-mono); font-size: 10px; fill: white; font-weight: 700; }
      .con-repl { fill: #c8f0c8; stroke: var(--ink); stroke-width: 1; }
      .con-cursor { stroke: var(--accent); stroke-width: 2; stroke-dasharray: 4 3; }
      .con-cursor-text { font-family: var(--font-mono); font-size: 11px; fill: var(--accent); }
      .con-cell-text { font-family: var(--font-mono); font-size: 10px; fill: var(--ink); }
    </style>`;const t=80,i=740,a=y=>t+(i-t)*y/L;r+=`<line x1="${t}" y1="20" x2="${i}" y2="20" stroke="var(--ink-soft)" stroke-width="1"/>`;for(let y=0;y<=L;y++)r+=`<line x1="${a(y)}" y1="17" x2="${a(y)}" y2="23" stroke="var(--ink-soft)" stroke-width="1"/>`,r+=`<text x="${a(y)}" y="15" text-anchor="middle" class="con-cell-text">t=${y}</text>`;W.forEach((y,k)=>{const g=50+k*50;r+=`<text class="con-row" x="20" y="${g+18}">${y}</text>`,r+=`<rect class="con-track-bg" x="${t}" y="${g}" width="${i-t}" height="30" rx="3"/>`,q(y,L).forEach(w=>{const R=a(w.at),H=y==="R1"&&M.find(P=>P.type==="write"&&P.value===w.value&&P.t===w.at);r+=`<rect class="${H?"con-write":"con-repl"}" x="${R-14}" y="${g+3}" width="28" height="24" rx="3"/>`,r+=`<text class="${H?"con-write-text":"con-cell-text"}" x="${R}" y="${g+19}" text-anchor="middle">${w.value}</text>`})});const n=a(m);r+=`<line class="con-cursor" x1="${n}" y1="35" x2="${n}" y2="190"/>`,r+=`<text class="con-cursor-text" x="${n+6}" y="42">read</text>`,r+="</svg>",u.innerHTML=r;const d=q(l,m),o=d.length?d[d.length-1]:null,f=q("R1",m),h=f.length?f[f.length-1]:null;let E;if(e==="strong")E=`Strong reads always go through the leader (or wait for quorum). Returns the latest committed value at t=${m}: <strong>${h?h.value:"nothing"}</strong>.`;else if(e==="eventual")E=`Eventual: returns whatever this replica has locally — <strong>${o?o.value:"nothing yet"}</strong>. Could be stale by ${h&&o?h.at-o.at:0} ticks.`;else if(e==="ryw"){const y=M.filter(b=>b.type==="write"&&b.client==="Alice"&&b.t<=m),k=y.length?y[y.length-1]:null;!k||d.some(b=>b.value===k.value)?E=`Read-your-writes: ${l} has Alice's latest write; returns <strong>${o?o.value:"nothing"}</strong>.`:(k.value,k.t,k.client,E=`Read-your-writes: ${l} doesn't yet have Alice's write <strong>${k.value}</strong>, so the system either redirects to a replica that does, or waits. Returns <strong>${k.value}</strong>.`)}else e==="causal"&&(E=`Causal: each replica must see B1 only after A1 (since A1 happened-before B1 on the same primary). ${l}'s local order respects that. Returns <strong>${o?o.value:"nothing yet"}</strong>.`);let $=`<strong>${N[e].label}</strong>. ${N[e].note}<br><br>${E}`;s.querySelector("#con-explain").innerHTML=$}v()}const B=5,U=50,V=20,I=30,K=60;function G(s){let e=null,m=0,l=0,u=[],v=[];function p(){v=[];for(let d=0;d<B;d++)v.push({id:d,state:"follower",term:0,votedFor:null,timeout:c(),ticksSinceHeartbeat:0,votesReceived:0});l=0,u=[],m=0}function c(){return Math.floor(I+Math.random()*(K-I))}s.innerHTML=`
    <div class="widget">
      <div class="widget-title">5-node cluster</div>

      <div class="controls">
        <button class="btn btn-accent" id="le-run">Start</button>
        <button class="btn" id="le-pause">Pause</button>
        <button class="btn" id="le-kill">Kill leader</button>
        <button class="btn btn-ghost" id="le-reset">Reset</button>
      </div>

      <div class="widget-stage" id="le-stage" style="min-height: 320px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Term</div><div class="value" id="m-term">0</div></div>
        <div class="metric accent"><div class="label">Leader</div><div class="value" id="m-leader">—</div></div>
        <div class="metric"><div class="label">Tick</div><div class="value" id="m-tick">0</div></div>
      </div>

      <div class="log" id="le-log"></div>
    </div>
  `;const r=s.querySelector("#le-stage"),t=s.querySelector("#le-log");s.querySelector("#le-run").addEventListener("click",()=>{e||(e=setInterval(i,U))}),s.querySelector("#le-pause").addEventListener("click",()=>{e&&(clearInterval(e),e=null)}),s.querySelector("#le-kill").addEventListener("click",()=>{const d=v.find(o=>o.state==="leader");if(!d){n("warn","No leader to kill");return}d.state="dead",n("err",`Node ${d.id} (was leader, term ${d.term}) KILLED.`),a()}),s.querySelector("#le-reset").addEventListener("click",()=>{e&&(clearInterval(e),e=null),p(),t.innerHTML="",a()});function i(){m++;const d=v.find(o=>o.state==="leader");d&&m%V===0&&v.forEach(o=>{o.id!==d.id&&o.state!=="dead"&&(o.ticksSinceHeartbeat=0,o.term=Math.max(o.term,d.term),o.state="follower",o.votedFor=null)}),v.forEach(o=>{if(o.state!=="dead"&&(o.ticksSinceHeartbeat++,o.state==="follower"&&o.ticksSinceHeartbeat>o.timeout)){o.state="candidate",o.term++,o.votedFor=o.id,o.votesReceived=1,o.ticksSinceHeartbeat=0,o.timeout=c(),n("info",`Node ${o.id} timed out → candidate (term ${o.term})`),v.forEach(h=>{h.id!==o.id&&h.state!=="dead"&&h.term<o.term&&h.votedFor===null&&(h.term=o.term,h.votedFor=o.id,o.votesReceived++,h.ticksSinceHeartbeat=0)});const f=v.filter(h=>h.state!=="dead").length;o.votesReceived>f/2&&(v.forEach(h=>{(h.state==="leader"||h.state==="candidate")&&(h.state="follower")}),o.state="leader",l=o.term,n("ok",`Node ${o.id} WON term ${o.term} with ${o.votesReceived}/${f} votes`))}}),a()}function a(){let $='<svg viewBox="0 0 460 320" width="100%" style="max-width:460px">';$+=`<style>
      .le-node-circle { stroke: var(--ink); stroke-width: 2.5; }
      .le-node-circle.follower { fill: #cfe5ff; }
      .le-node-circle.candidate { fill: #ffe9b3; }
      .le-node-circle.leader { fill: var(--accent); }
      .le-node-circle.dead { fill: #ccc; stroke: #888; stroke-dasharray: 4 3; }
      .le-node-name { font-family: var(--font-display); font-size: 16px; letter-spacing: 1.5px; fill: var(--ink); }
      .le-node-name.leader-text { fill: white; }
      .le-node-sub { font-family: var(--font-mono); font-size: 10px; fill: var(--ink); }
      .le-node-sub.leader-text { fill: white; }
      .le-heartbeat { stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 3 4; fill: none; opacity: 0.5; }
    </style>`;const y=v.find(g=>g.state==="leader");if(y){const g=k(y.id);v.forEach(b=>{if(b.id!==y.id&&b.state!=="dead"){const w=k(b.id);$+=`<line class="le-heartbeat" x1="${g.x}" y1="${g.y}" x2="${w.x}" y2="${w.y}"/>`}})}v.forEach(g=>{const b=k(g.id);$+=`<circle class="le-node-circle ${g.state}" cx="${b.x}" cy="${b.y}" r="36"/>`;const w=g.state==="leader"?"leader-text":"";if($+=`<text class="le-node-name ${w}" x="${b.x}" y="${b.y-4}" text-anchor="middle">N${g.id}</text>`,$+=`<text class="le-node-sub ${w}" x="${b.x}" y="${b.y+10}" text-anchor="middle">${g.state==="dead"?"DEAD":`t=${g.term}`}</text>`,g.state!=="dead"&&g.state!=="leader"){const R=Math.max(0,g.timeout-g.ticksSinceHeartbeat);$+=`<text class="le-node-sub ${w}" x="${b.x}" y="${b.y+22}" text-anchor="middle" style="font-size: 9px; opacity: 0.7;">to: ${R}</text>`}}),$+="</svg>",r.innerHTML=$,s.querySelector("#m-term").textContent=l,s.querySelector("#m-leader").textContent=y?`N${y.id}`:"—",s.querySelector("#m-tick").textContent=m;function k(g){const b=g/B*2*Math.PI-Math.PI/2;return{x:230+110*Math.cos(b),y:160+110*Math.sin(b)}}}function n(d,o){u.push({level:d,msg:o,t:m});const f=document.createElement("div");for(f.className=`entry ${d}`,f.innerHTML=`<span class="t">t=${m}</span>${o}`,t.prepend(f);t.children.length>30;)t.removeChild(t.lastChild)}p(),a()}const O=5;function _(s){const e={leader:0,nodes:[],entryCounter:0,log:[]};for(let c=0;c<O;c++)e.nodes.push({id:c,log:[],commitIndex:-1,alive:!0,networkOk:!0});s.innerHTML=`
    <div class="widget">
      <div class="widget-title">5-node Raft cluster (N0 is leader)</div>

      <div class="controls">
        <button class="btn btn-accent" id="rf-append">Append "x++"</button>
        <button class="btn" id="rf-append2">Append "y=42"</button>
        <button class="btn btn-ghost" id="rf-reset">Reset</button>
      </div>

      <div class="controls" id="rf-toggles">
        ${e.nodes.map(c=>`
          <label style="display: inline-flex; gap: 0.3em;">
            <input type="checkbox" data-node="${c.id}" checked> N${c.id} ${c.id===0?"(leader)":"reachable"}
          </label>
        `).join("")}
      </div>

      <div class="widget-stage" id="rf-stage" style="min-height: 320px;"></div>

      <div class="callout" id="rf-explain">Click "Append" to send a command to the leader. Watch it replicate to followers and commit once a majority acks.</div>
    </div>
  `;const m=s.querySelector("#rf-stage");s.querySelectorAll("input[data-node]").forEach(c=>c.addEventListener("change",r=>{const t=Number(r.target.dataset.node);e.nodes[t].networkOk=r.target.checked,u()})),s.querySelector("#rf-append").addEventListener("click",()=>l("x++")),s.querySelector("#rf-append2").addEventListener("click",()=>l("y=42")),s.querySelector("#rf-reset").addEventListener("click",()=>{e.nodes.forEach(c=>{c.log=[],c.commitIndex=-1,c.alive=!0,c.networkOk=!0}),e.entryCounter=0,e.log=[],s.querySelectorAll("input[data-node]").forEach(c=>c.checked=!0),u()});async function l(c){e.entryCounter++;const r={term:1,value:c,idx:e.entryCounter-1};e.nodes[e.leader].log.push(r),v("info",`Leader appended entry ${r.idx}: "${c}" to own log`),u(),await p(350);let t=1;for(let a=0;a<e.nodes.length;a++){if(a===e.leader)continue;const n=e.nodes[a];if(!n.networkOk){v("warn",`→ N${a}: AppendEntries DROPPED (network)`);continue}n.log.push(r),t++,v("ok",`→ N${a}: AppendEntries OK (log now has ${n.log.length} entries)`),u(),await p(180)}const i=Math.floor(e.nodes.length/2)+1;if(t>=i){e.nodes[e.leader].commitIndex=r.idx,v("ok",`${t}/${e.nodes.length} acks ≥ ${i} majority → entry ${r.idx} COMMITTED on leader`),u(),await p(300);for(let a=0;a<e.nodes.length;a++){if(a===e.leader)continue;const n=e.nodes[a];n.networkOk&&n.log.find(d=>d.idx===r.idx)&&(n.commitIndex=r.idx)}u()}else v("err",`Only ${t}/${e.nodes.length} acks (< ${i}). Entry stays uncommitted.`)}function u(){let t=`<svg viewBox="0 0 740 ${60+O*56}" width="100%" style="max-width: 740px">`;t+=`<style>
      .rf-name { font-family: var(--font-display); font-size: 15px; letter-spacing: 1.5px; fill: var(--ink); }
      .rf-sub { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .rf-entry { stroke: var(--ink); stroke-width: 1.5; }
      .rf-entry.committed { fill: #c8f0c8; }
      .rf-entry.uncommitted { fill: #ffe9b3; }
      .rf-entry-text { font-family: var(--font-mono); font-size: 10px; fill: var(--ink); }
      .rf-track { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1; }
    </style>`,t+='<text class="rf-sub" x="20" y="20">node</text>',t+='<text class="rf-sub" x="170" y="20">log entries (committed = green; uncommitted = yellow)</text>',e.nodes.forEach((i,a)=>{const n=40+a*56,d=i.id===e.leader;t+=`<text class="rf-name" x="20" y="${n+22}">N${i.id}${d?" ★":""}</text>`,t+=`<text class="rf-sub" x="20" y="${n+38}">${i.networkOk?`commit ${i.commitIndex<0?"—":i.commitIndex}`:"unreachable"}</text>`,t+=`<rect class="rf-track" x="170" y="${n+5}" width="550" height="36" rx="3" ${i.networkOk?"":'opacity="0.4"'}/>`,i.log.forEach((o,f)=>{const h=180+f*70,E=o.idx<=i.commitIndex;t+=`<rect class="rf-entry ${E?"committed":"uncommitted"}" x="${h}" y="${n+10}" width="60" height="26" rx="3" ${i.networkOk?"":'opacity="0.4"'}/>`,t+=`<text class="rf-entry-text" x="${h+30}" y="${n+27}" text-anchor="middle" ${i.networkOk?"":'opacity="0.4"'}>${o.value}</text>`})}),t+="</svg>",m.innerHTML=t}function v(c,r){e.log.unshift({level:c,msg:r,t:new Date().toLocaleTimeString()}),e.log.length>50&&e.log.pop();let t="";e.log.forEach(i=>{t+=`<div class="entry ${i.level}"><span class="t">${i.t}</span>${i.msg}</div>`}),s.querySelector("#rf-explain").innerHTML=e.log.length?e.log.slice(0,6).map(i=>`<div style="font-family: var(--font-mono); font-size: 0.8rem;">${i.msg}</div>`).join(""):'Click "Append" to send a command to the leader.'}function p(c){return new Promise(r=>setTimeout(r,c))}u()}const T=3;function Y(s){const e={vectors:[],events:[],pendingMessages:[],nextEventId:1,compareA:null,compareB:null};for(let t=0;t<T;t++)e.vectors.push([0,0,0]);s.innerHTML=`
    <div class="widget">
      <div class="widget-title">3-node vector clocks</div>

      <div class="controls">
        <strong>N0:</strong>
        <button class="btn" data-act="event-0">Local event</button>
        <button class="btn" data-act="send-0-1">Send → N1</button>
        <button class="btn" data-act="send-0-2">Send → N2</button>
      </div>
      <div class="controls">
        <strong>N1:</strong>
        <button class="btn" data-act="event-1">Local event</button>
        <button class="btn" data-act="send-1-0">Send → N0</button>
        <button class="btn" data-act="send-1-2">Send → N2</button>
      </div>
      <div class="controls">
        <strong>N2:</strong>
        <button class="btn" data-act="event-2">Local event</button>
        <button class="btn" data-act="send-2-0">Send → N0</button>
        <button class="btn" data-act="send-2-1">Send → N1</button>
      </div>

      <div class="controls">
        <span style="font-family: var(--font-mono); color: var(--ink-soft); margin-right: 0.4em;" id="vc-pending"></span>
        <button class="btn btn-accent" id="vc-deliver">Deliver next message</button>
        <button class="btn btn-ghost" id="vc-reset">Reset</button>
      </div>

      <div class="widget-stage" id="vc-stage" style="min-height: 320px;"></div>

      <div class="callout" id="vc-explain">
        Trigger events and sends on each node. Watch the vectors update. Click any two events in the history to compare causality.
      </div>
    </div>
  `;const m=s.querySelector("#vc-stage");s.querySelectorAll("button[data-act]").forEach(t=>t.addEventListener("click",()=>l(t.dataset.act))),s.querySelector("#vc-deliver").addEventListener("click",p),s.querySelector("#vc-reset").addEventListener("click",()=>{e.vectors=[];for(let t=0;t<T;t++)e.vectors.push([0,0,0]);e.events=[],e.pendingMessages=[],e.nextEventId=1,e.compareA=null,e.compareB=null,r()});function l(t){const i=t.match(/^event-(\d)$/);if(i)return u(Number(i[1]));const a=t.match(/^send-(\d)-(\d)$/);if(a)return v(Number(a[1]),Number(a[2]))}function u(t){e.vectors[t][t]++,e.events.push({id:e.nextEventId++,node:t,action:"local",vector:e.vectors[t].slice()}),r()}function v(t,i){e.vectors[t][t]++;const a=e.vectors[t].slice();e.events.push({id:e.nextEventId++,node:t,action:`send → N${i}`,vector:a}),e.pendingMessages.push({from:t,to:i,vector:a}),r()}function p(){if(!e.pendingMessages.length)return;const t=e.pendingMessages.shift(),i=e.vectors[t.to];i[t.to]++;for(let a=0;a<i.length;a++)i[a]=Math.max(i[a],t.vector[a]);e.events.push({id:e.nextEventId++,node:t.to,action:`receive ← N${t.from}`,vector:i.slice(),payload:t.vector}),r()}function c(t,i){let a=!0,n=!0,d=!1,o=!1;for(let f=0;f<t.length;f++)t[f]>i[f]&&(a=!1,o=!0),t[f]<i[f]&&(n=!1,d=!0);return a&&d?"before":n&&o?"after":a&&n?"equal":"concurrent"}function r(){let t='<div class="vc-current">';for(let a=0;a<T;a++)t+=`<div class="vc-node">
        <div class="vc-node-name">N${a}</div>
        <div class="vc-vector">[${e.vectors[a].join(", ")}]</div>
      </div>`;if(t+="</div>",t+='<div class="vc-history-title">Event history (click two to compare):</div>',t+='<div class="vc-history">',e.events.forEach(a=>{const n=e.compareA===a.id,d=e.compareB===a.id;t+=`<div class="vc-event ${n?"sel-a":d?"sel-b":""}" data-eid="${a.id}">
        <div class="vc-event-id">e${a.id}</div>
        <div class="vc-event-meta">N${a.node} · ${a.action}</div>
        <div class="vc-event-vec">[${a.vector.join(",")}]</div>
      </div>`}),e.events.length||(t+='<div style="color: var(--ink-faint); font-family: var(--font-mono); font-size: 0.85rem;">(no events yet)</div>'),t+="</div>",e.compareA&&e.compareB&&e.compareA!==e.compareB){const a=e.events.find(f=>f.id===e.compareA),n=e.events.find(f=>f.id===e.compareB),d=c(a.vector,n.vector);let o;d==="before"?o=`<strong>e${a.id} happened-before e${n.id}.</strong> Causality: a fact at e${a.id} was visible to the system before e${n.id} occurred.`:d==="after"?o=`<strong>e${n.id} happened-before e${a.id}.</strong> The other direction.`:d==="concurrent"?o=`<strong>e${a.id} ⫛ e${n.id} (concurrent).</strong> Neither caused the other. Conflict resolution is up to the application.`:o="Same event.",t+=`<div class="vc-compare">${o}</div>`}t+=`<style>
      .vc-current { display: grid; grid-template-columns: repeat(${T}, 1fr); gap: 0.4rem; margin-bottom: 0.6rem; }
      .vc-node { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem; text-align: center; }
      .vc-node-name { font-family: var(--font-display); letter-spacing: 1.5px; font-size: 1.1rem; }
      .vc-vector { font-family: var(--font-mono); font-size: 1.2rem; font-weight: 600; }
      .vc-history-title { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
      .vc-history { display: flex; flex-wrap: wrap; gap: 0.3rem; max-height: 160px; overflow-y: auto; padding: 0.3rem; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: var(--radius); }
      .vc-event { background: var(--paper); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 0.3em 0.5em; font-size: 0.78rem; min-width: 110px; cursor: pointer; }
      .vc-event:hover { background: var(--paper-deep); }
      .vc-event.sel-a { background: #cfe5ff; border-color: var(--accent); box-shadow: 2px 2px 0 var(--accent); }
      .vc-event.sel-b { background: #ffe9b3; border-color: var(--accent); box-shadow: 2px 2px 0 var(--accent); }
      .vc-event-id { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.9rem; }
      .vc-event-meta { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); }
      .vc-event-vec { font-family: var(--font-mono); font-size: 0.85rem; font-weight: 600; }
      .vc-compare { margin-top: 0.6rem; padding: 0.7rem; background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); box-shadow: 3px 3px 0 var(--accent); }
    </style>`,m.innerHTML=t,m.querySelectorAll(".vc-event").forEach(a=>a.addEventListener("click",()=>{const n=Number(a.dataset.eid);e.compareA===null?e.compareA=n:e.compareB===null&&n!==e.compareA?e.compareB=n:(e.compareA=n,e.compareB=null),r()}));const i=s.querySelector("#vc-pending");e.pendingMessages.length?i.textContent=`${e.pendingMessages.length} message(s) in flight`:i.textContent="no pending messages"}r()}const C=16;function X(s){const e={fanout:2,nodes:[],round:0,edges:[]};l(),s.innerHTML=`
    <div class="widget">
      <div class="widget-title">${C}-node cluster</div>

      <div class="controls">
        <label>Fan-out (k):</label>
        <div class="pill-group">
          ${[1,2,3,4].map((r,t)=>`
            <input type="radio" name="g-k" id="g-k${r}" value="${r}" ${r===2?"checked":""}>
            <label for="g-k${r}">${r}</label>
          `).join("")}
        </div>
        <button class="btn btn-accent" id="g-step">Next round →</button>
        <button class="btn" id="g-run">Run to convergence</button>
        <button class="btn btn-ghost" id="g-reset">Reset</button>
      </div>

      <div class="widget-stage" id="g-stage" style="min-height: 360px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Round</div><div class="value" id="m-round">0</div></div>
        <div class="metric"><div class="label">Informed</div><div class="value" id="m-inf">1/${C}</div></div>
        <div class="metric accent"><div class="label">log<sub>k+1</sub>(N)</div><div class="value" id="m-log">—</div></div>
      </div>

      <div class="callout" id="g-explain">
        One node starts with a rumour. Click "Next round →" to see who gossips to whom. Try different fan-out values.
      </div>
    </div>
  `;const m=s.querySelector("#g-stage");s.querySelectorAll("input[name=g-k]").forEach(r=>r.addEventListener("change",t=>{e.fanout=Number(t.target.value),p()})),s.querySelector("#g-step").addEventListener("click",u),s.querySelector("#g-run").addEventListener("click",async()=>{let r=30;for(;e.nodes.some(t=>!t.hasRumor)&&r-- >0;)u(),await c(450)}),s.querySelector("#g-reset").addEventListener("click",()=>{l(),v()});function l(){e.nodes=[];for(let r=0;r<C;r++){const t=r/C*2*Math.PI-Math.PI/2;e.nodes.push({id:r,x:230+140*Math.cos(t),y:170+140*Math.sin(t),hasRumor:r===0,justGot:r===0})}e.round=0,e.edges=[]}function u(){if(e.nodes.every(i=>i.hasRumor))return;e.round++;const r=[],t=new Set;e.nodes.forEach(i=>{i.justGot=!1}),e.nodes.forEach(i=>{if(!i.hasRumor)return;const a=e.nodes.filter(n=>n.id!==i.id);for(let n=a.length-1;n>0;n--){const d=Math.floor(Math.random()*(n+1));[a[n],a[d]]=[a[d],a[n]]}for(let n=0;n<e.fanout&&n<a.length;n++)r.push({from:i.id,to:a[n].id}),a[n].hasRumor||t.add(a[n].id)}),t.forEach(i=>{e.nodes[i].hasRumor=!0,e.nodes[i].justGot=!0}),e.edges=r,v()}function v(){let i='<svg viewBox="0 0 460 340" width="100%" style="max-width:460px">';i+=`<style>
      .g-edge { stroke: var(--accent); stroke-width: 1.5; fill: none; opacity: 0.7; marker-end: url(#g-arrow); }
      .g-node-circle { stroke: var(--ink); stroke-width: 2; }
      .g-node-circle.has { fill: var(--accent); }
      .g-node-circle.just { fill: var(--accent); stroke-width: 3.5; }
      .g-node-circle.no { fill: var(--paper); }
      .g-node-text { font-family: var(--font-mono); font-size: 10px; fill: white; font-weight: 600; }
      .g-node-text.no { fill: var(--ink-soft); }
    </style>`,i+='<defs><marker id="g-arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="var(--accent)"/></marker></defs>',e.edges.forEach(n=>{const d=e.nodes[n.from],o=e.nodes[n.to];i+=`<line class="g-edge" x1="${d.x}" y1="${d.y}" x2="${o.x}" y2="${o.y}"/>`}),e.nodes.forEach(n=>{const d=n.justGot?"just":n.hasRumor?"has":"no";i+=`<circle class="g-node-circle ${d}" cx="${n.x}" cy="${n.y}" r="15"/>`,i+=`<text class="g-node-text ${d==="no"?"no":""}" x="${n.x}" y="${n.y+3.5}" text-anchor="middle">${n.id}</text>`}),i+="</svg>",m.innerHTML=i;const a=e.nodes.filter(n=>n.hasRumor).length;s.querySelector("#m-round").textContent=e.round,s.querySelector("#m-inf").textContent=`${a}/${C}`,p(),a===C?s.querySelector("#g-explain").innerHTML=`<strong>Converged in ${e.round} rounds.</strong> Theoretical lower bound: ⌈log<sub>${e.fanout+1}</sub>(${C})⌉ ≈ ${Math.ceil(Math.log(C)/Math.log(e.fanout+1))}. Your run was close — randomness affects the constant.`:e.round>0&&(s.querySelector("#g-explain").innerHTML=`Round ${e.round}: ${a}/${C} informed. Each informed node gossiped to ${e.fanout} random peer(s). Click again to continue.`)}function p(){const r=Math.ceil(Math.log(C)/Math.log(e.fanout+1));s.querySelector("#m-log").textContent=`≈ ${r}`}function c(r){return new Promise(t=>setTimeout(t,r))}l(),v()}const A={happy:{label:"Happy path (all yes)",votes:["yes","yes","yes"],pCrash:null,cCrash:!1},oneNo:{label:"One participant votes NO",votes:["yes","no","yes"],pCrash:null,cCrash:!1},pCrash:{label:"Participant crashes after voting yes",votes:["yes","yes","yes"],pCrash:1,cCrash:!1},cCrash:{label:"Coordinator crashes after prepare",votes:["yes","yes","yes"],pCrash:null,cCrash:!0}};function Q(s){let e="happy";s.innerHTML=`
    <div class="widget">
      <div class="widget-title">Coordinator + 3 participants</div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="tp-scen" style="min-width: 280px;">
          ${Object.entries(A).map(([t,i])=>`<option value="${t}">${i.label}</option>`).join("")}
        </select>
        <button class="btn btn-accent" id="tp-run">Run</button>
        <button class="btn btn-ghost" id="tp-reset">Reset</button>
      </div>

      <div class="widget-stage" id="tp-stage" style="min-height: 360px;"></div>

      <div class="callout" id="tp-explain">Pick a scenario and click Run.</div>
    </div>
  `;const m=s.querySelector("#tp-stage");let l=[];s.querySelector("#tp-scen").addEventListener("change",t=>{e=t.target.value,u()}),s.querySelector("#tp-run").addEventListener("click",v),s.querySelector("#tp-reset").addEventListener("click",u);function u(){l=[],c()}async function v(){u();const t=A[e];p("coord","Sending PREPARE to all participants","prepare"),await r(500);for(let n=0;n<3;n++)p("coord-p"+n,`→ P${n}: PREPARE`,"prepare"),await r(280);for(let n=0;n<3;n++){const d=t.votes[n];p(`p${n}`,`${d==="yes"?"✓ prepared, votes YES":"✗ refuses, votes NO"}`,d==="yes"?"yes":"no"),await r(250),p(`p${n}-coord`,`P${n} → coordinator: VOTE ${d.toUpperCase()}`,d==="yes"?"yes":"no"),await r(250)}if(t.pCrash!==null&&(p(`p${t.pCrash}-crash`,`💥 P${t.pCrash} crashes (was prepared, holding locks)`,"crash"),await r(500)),t.cCrash){p("coord-crash","💥 Coordinator crashes BEFORE sending commit/abort decision","crash"),await r(400),p("stuck","<strong>Participants stuck holding locks, awaiting decision they'll never get.</strong> This is the classic 2PC blocking problem.","stuck"),c();return}const i=t.votes.includes("no"),a=i?"ABORT":"COMMIT";p("decide",`All votes received. Decision: ${a}`,i?"abort":"commit"),await r(400);for(let n=0;n<3;n++)n!==t.pCrash&&(p(`coord-p${n}-${a}`,`→ P${n}: ${a}`,i?"abort":"commit"),await r(250),p(`p${n}-done`,`P${n}: ${a==="COMMIT"?"committed, locks released":"aborted, rolled back"}`,i?"abort":"commit"),await r(250));t.pCrash!==null&&p(`p${t.pCrash}-recover`,`When P${t.pCrash} recovers, it asks coordinator: outcome was ${a}. It applies it then.`,"info"),c()}function p(t,i,a){l.push({id:t,msg:i,kind:a,t:new Date().toLocaleTimeString()}),c()}function c(){let t='<div class="tp-actors">';t+=`<div class="tp-actor coord ${A[e].cCrash&&l.some(i=>i.id==="coord-crash")?"dead":""}">
      <div class="tp-actor-name">COORDINATOR</div>
      <div class="tp-actor-state">${A[e].cCrash&&l.some(i=>i.id==="coord-crash")?"💥 crashed":"active"}</div>
    </div>`;for(let i=0;i<3;i++){const a=i===A[e].pCrash&&l.some(d=>d.id===`p${i}-crash`),n=l.find(d=>d.id===`p${i}`||d.id===`p${i}-coord`);t+=`<div class="tp-actor part ${a?"dead":""}">
        <div class="tp-actor-name">P${i}</div>
        <div class="tp-actor-state">${a?"💥 crashed":n?n.kind==="yes"?"voted YES, prepared":"voted NO":"idle"}</div>
      </div>`}t+="</div>",t+='<div class="tp-log">',l.length===0&&(t+='<div style="color: var(--ink-faint); font-family: var(--font-mono); font-size: 0.85rem; padding: 0.5rem;">no messages yet</div>'),l.forEach(i=>{const a={prepare:"tp-msg-prepare",yes:"tp-msg-yes",no:"tp-msg-no",commit:"tp-msg-commit",abort:"tp-msg-abort",crash:"tp-msg-crash",stuck:"tp-msg-stuck",info:"tp-msg-info"}[i.kind]||"";t+=`<div class="tp-msg ${a}">${i.msg}</div>`}),t+="</div>",t+=`<style>
      .tp-actors { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 0.4rem; margin-bottom: 0.6rem; }
      .tp-actor { padding: 0.6rem 0.8rem; border: 2px solid var(--ink); border-radius: var(--radius); text-align: center; }
      .tp-actor.coord { background: #c8f0c8; }
      .tp-actor.part { background: #e6d6ff; }
      .tp-actor.dead { background: #ccc; opacity: 0.65; }
      .tp-actor-name { font-family: var(--font-display); letter-spacing: 1.5px; font-size: 0.9rem; }
      .tp-actor-state { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-soft); }
      .tp-log { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; max-height: 260px; overflow-y: auto; }
      .tp-msg { font-family: var(--font-mono); font-size: 0.82rem; padding: 0.18em 0.4em; margin: 0.12em 0; border-radius: 2px; border-left: 3px solid transparent; }
      .tp-msg-prepare { border-left-color: #1c6dd0; }
      .tp-msg-yes { border-left-color: #2a8a3e; }
      .tp-msg-no { border-left-color: var(--accent); }
      .tp-msg-commit { border-left-color: #2a8a3e; background: #d6f5d6; }
      .tp-msg-abort { border-left-color: var(--accent); background: #f7c8c8; }
      .tp-msg-crash { border-left-color: var(--accent); background: var(--accent-soft); font-weight: 600; }
      .tp-msg-stuck { border-left-color: var(--accent); background: var(--accent-soft); font-weight: 600; padding: 0.4em 0.6em; }
      .tp-msg-info { border-left-color: var(--ink-soft); color: var(--ink-soft); }
      @media (max-width: 640px) { .tp-actors { grid-template-columns: 1fr 1fr; } }
    </style>`,m.innerHTML=t,l.length===0?s.querySelector("#tp-explain").innerHTML="Pick a scenario and click Run.":e==="cCrash"&&l.some(i=>i.id==="stuck")?s.querySelector("#tp-explain").innerHTML="<strong>This is why 2PC has fallen out of favor.</strong> The participants are blocked indefinitely. In real systems, a recovery protocol (or a human operator) has to eventually intervene. Modern designs prefer Sagas (no global commit) or Raft-based consensus (no single coordinator).":l.find(i=>i.kind==="commit")?s.querySelector("#tp-explain").innerHTML="<strong>Committed atomically.</strong> All participants persisted the change; the transaction is durable across all of them.":l.find(i=>i.kind==="abort")&&(s.querySelector("#tp-explain").innerHTML="<strong>Aborted atomically.</strong> Any participant voting NO means everyone rolls back. No partial commits ever escape.")}function r(t){return new Promise(i=>setTimeout(i,t))}c()}const z={cassandra:{label:"Cassandra",sub:"Wide-column, leaderless",cap:{x:70,y:30,label:"AP — tunable"},profile:[{dim:"Leader",val:"Leaderless",link:"leader-election",positive:!1},{dim:"Consistency",val:"Tunable (one→quorum→all)",link:"consistency",positive:!0},{dim:"Membership",val:"Gossip",link:"gossip",positive:!0},{dim:"Replication",val:"Quorum-based, asynchronous",link:"consistency",positive:!0},{dim:"Conflict res.",val:"Last-writer-wins",link:"vector-clocks",positive:!1},{dim:"Use case",val:"High write throughput, time-series, IoT",link:null,positive:!0}],note:"Cassandra prioritizes write availability and horizontal scale. Gossip handles membership across hundreds of nodes. CP via QUORUM if you tune it, AP by default."},dynamodb:{label:"DynamoDB",sub:"Managed KV, leaderless",cap:{x:75,y:35,label:"AP, with optional strong-read"},profile:[{dim:"Leader",val:"Per-partition, hidden",link:"leader-election",positive:!0},{dim:"Consistency",val:"Eventual default; strong opt-in",link:"consistency",positive:!0},{dim:"Membership",val:"AWS internal",link:null,positive:!0},{dim:"Replication",val:"Quorum within AZ",link:null,positive:!0},{dim:"Conflict res.",val:"Vector clocks (historically); now coordinated",link:"vector-clocks",positive:!0},{dim:"Use case",val:"Web apps, gaming, ad serving",link:null,positive:!0}],note:"Dynamo paper inspired Cassandra. The managed DynamoDB hides most of the complexity. Eventual is the default; strong reads cost 2× and double latency."},spanner:{label:"Spanner / CockroachDB",sub:"Globally consistent SQL",cap:{x:20,y:35,label:"CP — strong everywhere"},profile:[{dim:"Leader",val:"Raft per range",link:"raft",positive:!0},{dim:"Consistency",val:"Strong (linearizable)",link:"consistency",positive:!0},{dim:"Membership",val:"Gossip",link:"gossip",positive:!0},{dim:"Replication",val:"Raft groups across regions",link:"raft",positive:!0},{dim:"Distributed txn",val:"Two-phase commit + TrueTime",link:"2pc",positive:!0},{dim:"Use case",val:"Banking, billing, anywhere correctness > latency",link:null,positive:!0}],note:"Spanner uses globally-synchronized clocks (TrueTime, ~7ms uncertainty) to bound transaction ordering. CockroachDB does similar without atomic clocks — Hybrid Logical Clocks instead."},etcd:{label:"etcd / Consul",sub:"KV store for coordination",cap:{x:15,y:50,label:"CP — for config + locks"},profile:[{dim:"Leader",val:"Raft",link:"raft",positive:!0},{dim:"Consistency",val:"Strong (linearizable reads optional)",link:"consistency",positive:!0},{dim:"Membership",val:"Static (etcd) or gossip (Consul)",link:"gossip",positive:!0},{dim:"Replication",val:"Raft log, full replicas",link:"raft",positive:!0},{dim:"Throughput",val:"Modest — designed for small, high-value data",link:null,positive:!1},{dim:"Use case",val:"Service discovery, config, leader locks, Kubernetes",link:null,positive:!0}],note:'These are the "boring" but critical KV stores at the heart of every cloud platform. Kubernetes runs on etcd. They prove every day that Raft works in production.'}};function Z(s){let e="cassandra";s.innerHTML=`
    <div class="widget">
      <div class="widget-title">Real-world distributed databases</div>

      <div class="controls">
        <div class="pill-group">
          ${Object.entries(z).map(([l,u],v)=>`
            <input type="radio" name="ar-sys" id="ar-${l}" value="${l}" ${v===0?"checked":""}>
            <label for="ar-${l}">${u.label.split(" /")[0]}</label>
          `).join("")}
        </div>
      </div>

      <div class="widget-stage" id="ar-stage" style="min-height: 380px;"></div>

      <div class="callout" id="ar-note"></div>
    </div>
  `,s.querySelectorAll("input[name=ar-sys]").forEach(l=>l.addEventListener("change",u=>{e=u.target.value,m()}));function m(){const l=z[e];let u='<svg viewBox="0 0 220 160" width="220" height="160" style="float: right; margin-left: 1rem;">';u+=`<style>
      .ar-tri { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 2; }
      .ar-tri-label { font-family: var(--font-display); font-size: 12px; letter-spacing: 1px; fill: var(--ink); }
      .ar-marker { fill: var(--accent); stroke: var(--ink); stroke-width: 2; }
      .ar-marker-label { font-family: var(--font-mono); font-size: 9px; fill: var(--ink); }
    </style>`,u+='<polygon class="ar-tri" points="110,15 200,140 20,140"/>',u+='<text class="ar-tri-label" x="110" y="10" text-anchor="middle">CONSISTENCY</text>',u+='<text class="ar-tri-label" x="200" y="155" text-anchor="end">AVAILABILITY</text>',u+='<text class="ar-tri-label" x="20" y="155">PARTITION</text>';const v=20+180*(l.cap.x/100),p=15+125*(l.cap.y/100);u+=`<circle class="ar-marker" cx="${v}" cy="${p}" r="8"/>`,u+=`<text class="ar-marker-label" x="${v+14}" y="${p+4}">${l.label.split(" /")[0]}</text>`,u+="</svg>";let c=`
      <div class="ar-header">
        <div>
          <div class="ar-title">${l.label}</div>
          <div class="ar-sub">${l.sub}</div>
          <div class="ar-cap">${l.cap.label}</div>
        </div>
      </div>
      ${u}
      <div class="ar-grid">
        ${l.profile.map(r=>`
          <div class="ar-row">
            <div class="ar-dim">${r.dim}</div>
            <div class="ar-val">
              ${r.val}
              ${r.link?`<a class="ar-link" href="${r.link}.html">→</a>`:""}
            </div>
          </div>
        `).join("")}
      </div>
    `;c+=`<style>
      .ar-header { float: left; margin-right: 1rem; }
      .ar-title { font-family: var(--font-display); font-size: 1.5rem; letter-spacing: 0.04em; }
      .ar-sub { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-soft); margin-bottom: 0.3em; }
      .ar-cap { font-family: var(--font-display); letter-spacing: 0.04em; padding: 0.2em 0.6em; display: inline-block; background: var(--accent-soft); border: 1.5px solid var(--ink); border-radius: var(--radius); font-size: 0.85rem; }
      .ar-grid { clear: both; padding-top: 0.6rem; display: grid; grid-template-columns: 1fr; gap: 0.3rem; }
      .ar-row { display: grid; grid-template-columns: 160px 1fr; gap: 0.5rem; align-items: baseline; padding: 0.35em 0.6em; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: var(--radius); }
      .ar-dim { font-family: var(--font-display); letter-spacing: 0.5px; font-size: 0.85rem; color: var(--ink-soft); }
      .ar-val { font-family: var(--font-mono); font-size: 0.85rem; }
      .ar-link { font-family: var(--font-display); padding: 0.05em 0.45em; background: var(--accent); color: white; border: 1.5px solid var(--ink); border-radius: 2px; text-decoration: none; font-size: 0.8rem; margin-left: 0.4em; }
      .ar-link:hover { color: white; transform: translate(-1px, -1px); }
    </style>`,s.querySelector("#ar-stage").innerHTML=c,s.querySelector("#ar-note").innerHTML=l.note}m()}const S=s=>()=>x.jsx(j,{init:s}),ae={slug:"distributed-systems",title:"Distributed Systems",intro:x.jsx(x.Fragment,{children:"Eight lessons covering the hard parts of running anything on more than one machine — CAP, consensus, leader election, vector clocks, gossip protocols, and two-phase commit."}),lessons:[{slug:"cap",number:"01",title:"CAP Theorem",blurb:"Consistency, availability, partition tolerance — pick two.",Widget:S(D),intro:x.jsx(x.Fragment,{children:"When the network splits, you can answer with consistent data or stay available — not both. CAP is the formal statement of that trade-off."}),sections:[],takeaways:["Partitions are not optional — they will happen.","CP systems refuse writes when partitioned (e.g., HBase).","AP systems keep accepting writes and reconcile later (e.g., DynamoDB).","PACELC extends CAP to the no-partition case: latency vs consistency."]},{slug:"consistency",number:"02",title:"Consistency Models",blurb:"Strong, eventual, causal, read-your-writes — same write, four different reads.",Widget:S(F),intro:x.jsx(x.Fragment,{children:'What does "I just wrote X" mean for the next read? Different models give different answers, with different costs.'}),sections:[],takeaways:["Strong: every read sees the most recent write. Expensive across regions.",'Eventual: reads catch up "eventually". Cheap, often surprising.',"Causal: if A caused B, all observers see A before B.","Read-your-writes: a user always sees their own most recent write."]},{slug:"leader-election",number:"03",title:"Leader Election",blurb:"No leader? Hold an election. Watch five nodes time out, vote, and crown a winner.",Widget:S(G),intro:x.jsx(x.Fragment,{children:"Many distributed protocols need a single coordinator. When one dies, the rest elect a new one — via timeouts, votes, and term numbers."}),sections:[],takeaways:["Heartbeats from the leader keep followers from triggering an election.","Random timeouts prevent everyone from starting an election at once.","A majority of votes is required to win — ensures one leader at a time.","Split-brain is the failure mode this prevents."]},{slug:"raft",number:"04",title:"Raft Consensus",blurb:"The leader proposes; followers ack; majority wins. Step through log replication with random failures.",Widget:S(_),intro:x.jsx(x.Fragment,{children:"Paxos was right but unreadable. Raft is Paxos reorganized for humans — same guarantees, much easier to implement correctly."}),sections:[],takeaways:["Leader-based: only the leader accepts writes.","Log replication: leader appends, followers copy, majority commit.","Used by etcd, Consul, CockroachDB, TiKV, kRaft (Kafka).","A node never serves stale reads — it forwards to or checks with the leader."]},{slug:"vector-clocks",number:"05",title:"Vector Clocks",blurb:"There is no global clock. Vector clocks track who-saw-what-when across nodes.",Widget:S(Y),intro:x.jsx(x.Fragment,{children:"Wall-clock time across nodes is unreliable. Vector clocks give a partial order: for any two events, we can tell if one happened-before the other, or if they\\'re concurrent."}),sections:[],takeaways:["Each node keeps a counter; messages carry the sender's vector.","Receiver merges by taking per-component max, then increments its own.","A < B iff every component A[i] ≤ B[i] and at least one is <.","Used in Dynamo-style systems to detect conflicting writes."]},{slug:"gossip",number:"06",title:"Gossip & Failure Detection",blurb:"No coordinator, no broadcast — nodes whisper to random neighbours.",Widget:S(X),intro:x.jsx(x.Fragment,{children:"Each node periodically picks a random peer and exchanges state. Information spreads logarithmically and tolerates any individual node\\'s failure."}),sections:[],takeaways:["O(log N) rounds to reach every node.","No central point of failure — every node knows just its peers.","Used by Cassandra, Consul, Serf, Hashicorp memberlist.","Same protocol detects failures: missed heartbeats from peers mark them suspect."]},{slug:"2pc",number:"07",title:"Two-Phase Commit",blurb:"Coordinator polls participants — all yes, commit; any no, abort.",Widget:S(Q),intro:x.jsx(x.Fragment,{children:'Atomic commit across multiple participants. Phase 1 asks each "can you commit?", phase 2 tells them all to do it (or roll back).'}),sections:[],takeaways:["All-or-nothing across nodes — the building block of distributed transactions.","Blocking: if the coordinator dies mid-protocol, participants are stuck.","Three-phase commit fixes this at the cost of more round-trips.","In practice, most modern systems use consensus protocols instead."]},{slug:"architectures",number:"08",title:"Architectures in Practice",blurb:"Cassandra, DynamoDB, Spanner, etcd — how real systems compose these primitives.",Widget:S(Z),intro:x.jsx(x.Fragment,{children:"Each real database picks a point on the CAP triangle and stacks consistency, replication, and consensus primitives differently. Knowing the pattern lets you predict the trade-offs."}),sections:[],takeaways:["Cassandra/Dynamo: AP, eventual consistency, vector clocks.","Spanner: CP, strong consistency via TrueTime + Paxos.","etcd/Consul: CP, Raft, small datasets, high consistency needs.","Pick the database that matches your workload, not the one your team knows."]}]};export{ae as manifest};
