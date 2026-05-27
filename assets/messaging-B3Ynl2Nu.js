import{r as T,j as e}from"./main-Dfqj_VUe.js";import{L as F}from"./LegacyWidget-CUf1c2G7.js";import{m as E}from"./proxy-oI7iOEWV.js";import{A as D}from"./index-CCy-1sZU.js";const C={naive:{name:"Naive dual-write",steps:[{caption:'Service handles "place order" request.',state:{dbOrder:!1,dbOutbox:null,brokerMsg:!1}},{caption:"Write order row to DB. Committed.",state:{dbOrder:!0,dbOutbox:null,brokerMsg:!1}},{caption:'Publish "order placed" to broker — but broker is DOWN.',state:{dbOrder:!0,dbOutbox:null,brokerMsg:!1,brokerError:!0}},{caption:"DB has the order. Broker has nothing. Inconsistent state.",state:{dbOrder:!0,dbOutbox:null,brokerMsg:!1,finalBad:!0}}]},outbox:{name:"Transactional outbox",steps:[{caption:'Service handles "place order" request.',state:{dbOrder:!1,dbOutbox:null,brokerMsg:!1}},{caption:"BEGIN TX → write order row AND outbox row → COMMIT. Both atomic.",state:{dbOrder:!0,dbOutbox:"pending",brokerMsg:!1}},{caption:"Even if broker is DOWN — order is committed, event safely in outbox.",state:{dbOrder:!0,dbOutbox:"pending",brokerMsg:!1,brokerError:!0}},{caption:"Relay polls outbox, publishes, marks row done. (Retries until success.)",state:{dbOrder:!0,dbOutbox:"done",brokerMsg:!0}}]}},b={service:{x:50,y:90,label:"Service"},db:{x:240,y:90,label:"Database"},relay:{x:430,y:90,label:"Outbox relay"},broker:{x:600,y:90,label:"Message broker"}};function A({x:t,y:s,w:a=100,h:l=60,fill:n="var(--paper)",stroke:m="var(--ink)",label:r,sublabel:h,shake:i}){return e.jsxs(E.g,{animate:i?{x:[0,-3,3,-2,2,0]}:{x:0},transition:{duration:.4},children:[e.jsx("rect",{x:t-a/2,y:s-l/2,width:a,height:l,fill:n,stroke:m,strokeWidth:2.5,rx:6}),e.jsx("text",{x:t,y:s-4,textAnchor:"middle",style:{fontFamily:"var(--font-display)",fontSize:13},children:r}),h&&e.jsx("text",{x:t,y:s+14,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:9,fill:"var(--ink-soft)"},children:h})]})}function $({from:t,to:s,color:a="var(--ink)",dashed:l,label:n}){const m=s.x-t.x,r=s.y-t.y,h=Math.sqrt(m*m+r*r),i=m/h,c=r/h,o=52,u=56,d=t.x+i*o,p=t.y+c*o,g=s.x-i*u,f=s.y-c*u,v=(d+g)/2,y=(p+f)/2;return e.jsxs(E.g,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.25},children:[e.jsx("line",{x1:d,y1:p,x2:g,y2:f,stroke:a,strokeWidth:2.5,strokeDasharray:l?"5 4":void 0,markerEnd:"url(#arr-end)"}),n&&e.jsx("text",{x:v,y:y-8,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:10,fill:a,fontWeight:600},children:n})]})}function P(){const[t,s]=T.useState("naive"),[a,l]=T.useState(0),n=C[t],m=n.steps[a],r=m.state;function h(o){s(o),l(0)}function i(){l(o=>Math.min(n.steps.length-1,o+1))}function c(){l(0)}return e.jsxs("div",{className:"widget",children:[e.jsx("div",{className:"widget-title",children:"Outbox — survive the dual-write problem"}),e.jsx("div",{className:"controls",children:Object.entries(C).map(([o,u])=>e.jsx("button",{className:`btn ${t===o?"btn-accent":""}`,onClick:()=>h(o),children:u.name},o))}),e.jsxs("div",{className:"controls",children:[e.jsx("button",{className:"btn btn-accent",onClick:i,disabled:a>=n.steps.length-1,children:"Next step"}),e.jsx("button",{className:"btn btn-ghost",onClick:c,children:"Reset"}),e.jsxs("span",{style:{marginLeft:"auto",fontFamily:"var(--font-mono)",color:"var(--ink-soft)",fontSize:"0.85rem"},children:["Step ",a+1," / ",n.steps.length]})]}),e.jsx("div",{className:"widget-stage",style:{minHeight:240},children:e.jsxs("svg",{viewBox:"0 0 700 200",width:"100%",style:{maxWidth:700},children:[e.jsx("defs",{children:e.jsx("marker",{id:"arr-end",markerWidth:"10",markerHeight:"10",refX:"9",refY:"5",orient:"auto",children:e.jsx("polygon",{points:"0 0,10 5,0 10",fill:"var(--ink)"})})}),e.jsx(A,{...b.service,sublabel:"POST /orders"}),e.jsxs(E.g,{animate:{y:0},children:[e.jsx("rect",{x:b.db.x-60,y:b.db.y-36,width:120,height:72,fill:"var(--paper)",stroke:"var(--ink)",strokeWidth:2.5,rx:6}),e.jsx("text",{x:b.db.x,y:b.db.y-22,textAnchor:"middle",style:{fontFamily:"var(--font-display)",fontSize:12},children:"Database"}),e.jsx("rect",{x:b.db.x-52,y:b.db.y-12,width:104,height:20,rx:3,fill:r.dbOrder?"#2a8a3e":"var(--paper-deep)",stroke:"var(--ink)",strokeWidth:1.5,style:{transition:"fill 0.2s ease"}}),e.jsxs("text",{x:b.db.x,y:b.db.y+2,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:10,fontWeight:600,fill:r.dbOrder?"white":"var(--ink-faint)"},children:["orders: ",r.dbOrder?"1 row":"empty"]}),e.jsx("rect",{x:b.db.x-52,y:b.db.y+12,width:104,height:20,rx:3,fill:r.dbOutbox==="pending"?"var(--accent)":r.dbOutbox==="done"?"#1c6dd0":"var(--paper-deep)",stroke:"var(--ink)",strokeWidth:1.5,style:{transition:"fill 0.2s ease"}}),e.jsxs("text",{x:b.db.x,y:b.db.y+26,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:10,fontWeight:600,fill:r.dbOutbox?"white":"var(--ink-faint)"},children:["outbox: ",r.dbOutbox||(t==="naive"?"—":"empty")]})]}),t==="outbox"&&e.jsx(A,{...b.relay,sublabel:r.dbOutbox==="done"?"published ✓":"polling…"}),e.jsx(A,{...b.broker,fill:r.brokerError?"#fde2e2":r.brokerMsg?"#d9ead3":"var(--paper)",stroke:r.brokerError?"var(--accent)":"var(--ink)",sublabel:r.brokerError?"⚠ DOWN":r.brokerMsg?"1 message":"idle",shake:r.brokerError&&a===2}),e.jsxs(D,{children:[a>=1&&e.jsx($,{from:b.service,to:b.db,label:"write"},"s-db"),t==="naive"&&a>=2&&e.jsx($,{from:b.db,to:b.broker,color:r.brokerError?"var(--accent)":"var(--ink)",dashed:!0,label:r.brokerError?"FAIL":"publish"},"db-b"),t==="outbox"&&a>=3&&e.jsxs(e.Fragment,{children:[e.jsx($,{from:b.db,to:b.relay,label:"poll"},"db-r"),e.jsx($,{from:b.relay,to:b.broker,label:"publish"},"r-b")]})]})]})}),e.jsxs("div",{className:"callout",children:[e.jsxs("strong",{children:["Step ",a+1,"."]})," ",m.caption,m.state.finalBad&&e.jsx("div",{style:{marginTop:"0.4rem",color:"var(--accent)"},children:"⚠ This is the dual-write bug — the whole problem the outbox pattern solves."}),t==="outbox"&&a===n.steps.length-1&&e.jsx("div",{style:{marginTop:"0.4rem",color:"#2a8a3e"},children:"✓ DB and broker stay in lockstep even if the broker (or the relay) was temporarily down."})]})]})}const q=[{id:"replay",label:"Need replay",hint:"Consumer can rewind & re-read history"},{id:"managed",label:"Managed service",hint:"No broker to operate yourself"},{id:"lowLatency",label:"Lowest latency",hint:"Sub-millisecond end-to-end"},{id:"routing",label:"Complex routing",hint:"Fanout, topic patterns, header matching"},{id:"durable",label:"Durable by default",hint:"Survives broker restart without extra setup"},{id:"throughput",label:"High throughput",hint:"At least one million messages per second"},{id:"keyOrder",label:"Per-key ordering",hint:"Messages with the same key stay in order"}],B=[{id:"kafka",label:"Kafka",sub:"Distributed log",caps:{replay:!0,managed:!1,lowLatency:!1,routing:!1,durable:!0,throughput:!0,keyOrder:!0},notes:{replay:"Log retention is configurable from hours to forever",durable:"Replicated to disk across brokers by default",throughput:"Designed for millions of messages per second",keyOrder:"Same key → same partition → guaranteed order"},weakness:"No native fanout exchanges; sub-ms latency is unusual",operate:"Self-hosted (or via Confluent / MSK)"},{id:"rabbitmq",label:"RabbitMQ",sub:"Smart broker with rich routing",caps:{replay:!1,managed:!1,lowLatency:!1,routing:!0,durable:!0,throughput:!1,keyOrder:!1},notes:{routing:"Direct, topic, fanout, and header exchanges built in",durable:"Persistent queues + publisher confirms"},weakness:"No log/replay; per-node throughput in the tens of thousands",operate:"Self-hosted (CloudAMQP for managed)"},{id:"sqs",label:"AWS SQS",sub:"Fully managed queue",caps:{replay:!1,managed:!0,lowLatency:!1,routing:!1,durable:!0,throughput:!1,keyOrder:!0},notes:{managed:"AWS runs it. No nodes, no patching",durable:"Persisted across multiple AZs",keyOrder:"FIFO queues use MessageGroupId for ordering"},weakness:"Standard queue has no ordering; FIFO is capped to 3000 msg/s",operate:"AWS only"},{id:"nats-core",label:"NATS core",sub:"Lightweight pub/sub",caps:{replay:!1,managed:!1,lowLatency:!0,routing:!0,durable:!1,throughput:!0,keyOrder:!1},notes:{lowLatency:"Single-digit microseconds in-cluster",routing:"Subject-based with wildcards (foo.*.bar)",throughput:"Easily clears 1M msgs/s on commodity hardware"},weakness:"Fire-and-forget — messages dropped if no consumer is listening",operate:"Self-hosted (Synadia Cloud for managed)"},{id:"nats-jetstream",label:"NATS JetStream",sub:"NATS with durable streams",caps:{replay:!0,managed:!1,lowLatency:!0,routing:!0,durable:!0,throughput:!0,keyOrder:!0},notes:{replay:"Streams retain messages by count / age / size",lowLatency:"Built on the same low-latency NATS core",durable:"File or memory storage with replication",keyOrder:"Per-subject ordering within a stream"},weakness:"Newer than Kafka; smaller operational community",operate:"Self-hosted (Synadia Cloud for managed)"},{id:"redis",label:"Redis Streams",sub:"In-memory log with consumer groups",caps:{replay:!0,managed:!1,lowLatency:!0,routing:!1,durable:!1,throughput:!1,keyOrder:!0},notes:{replay:"XREAD from any ID — full history available",lowLatency:"In-memory, sub-millisecond typical",keyOrder:"Single stream is strictly ordered"},weakness:"Not durable by default; bounded by single-node memory",operate:"Self-hosted (Redis Cloud / Elasticache for managed)"},{id:"pubsub",label:"Google Pub/Sub",sub:"Managed global pub/sub",caps:{replay:!0,managed:!0,lowLatency:!1,routing:!1,durable:!0,throughput:!0,keyOrder:!0},notes:{replay:"Seek-by-time within the retention window",managed:"Google runs it. Autoscales",durable:"Synchronously replicated across zones",throughput:"Scales to millions of msg/s without sharding work",keyOrder:"Ordering keys keep same-key messages in order"},weakness:"No rich routing; latency typically tens of ms",operate:"GCP only"}];function I(t,s){return s.length===0?0:s.reduce((a,l)=>a+(t.caps[l]?1:0),0)}function z(t,s){const a=s.filter(n=>t.caps[n]);if(a.length===0)return null;const l=a.map(n=>t.notes[n]).filter(Boolean);return l.length===0?`Matches all your requirements: ${a.map(m=>q.find(r=>r.id===m).label.toLowerCase()).join(", ")}.`:l.join(" • ")}function H(){const[t,s]=T.useState([]);function a(c){s(o=>o.includes(c)?o.filter(u=>u!==c):[...o,c])}function l(){s([])}const n=T.useMemo(()=>{const c=B.map(o=>({broker:o,score:I(o,t)}));return c.sort((o,u)=>u.score!==o.score?u.score-o.score:o.broker.label.localeCompare(u.broker.label)),c},[t]),m=t.length>0?n[0].score:0,h=t.length>0&&m>0&&(n.length===1||n[1].score<m)?n[0].broker:null,i=t.length>0&&m===0;return e.jsxs("div",{className:"widget",children:[e.jsx("div",{className:"widget-title",children:"Pick your requirements — find your broker"}),e.jsxs("div",{className:"controls",style:{flexWrap:"wrap"},children:[q.map(c=>{const o=t.includes(c.id);return e.jsxs("button",{className:`btn ${o?"btn-accent":""}`,onClick:()=>a(c.id),title:c.hint,children:[e.jsxs("span",{style:{fontFamily:"var(--font-mono)",marginRight:"0.4em"},children:["[",o?"x":" ","]"]}),c.label]},c.id)}),e.jsx("button",{className:"btn btn-ghost",onClick:l,disabled:t.length===0,style:{marginLeft:"auto"},children:"Reset"})]}),e.jsxs("div",{className:"metrics",children:[e.jsxs("div",{className:"metric",children:[e.jsx("span",{style:{fontFamily:"var(--font-mono)",color:"var(--ink-soft)",fontSize:"0.8rem"},children:"Requirements"}),e.jsxs("strong",{style:{fontFamily:"var(--font-display)",fontSize:"1.2rem"},children:[t.length," / ",q.length]})]}),e.jsxs("div",{className:"metric",children:[e.jsx("span",{style:{fontFamily:"var(--font-mono)",color:"var(--ink-soft)",fontSize:"0.8rem"},children:"Top score"}),e.jsx("strong",{style:{fontFamily:"var(--font-display)",fontSize:"1.2rem"},children:t.length===0?"—":`${m} / ${t.length}`})]}),e.jsxs("div",{className:"metric",children:[e.jsx("span",{style:{fontFamily:"var(--font-mono)",color:"var(--ink-soft)",fontSize:"0.8rem"},children:"Top match"}),e.jsx("strong",{style:{fontFamily:"var(--font-display)",fontSize:"1.2rem"},children:h?h.label:t.length===0?"all equal":"tie"})]})]}),e.jsx("div",{className:"widget-stage",style:{minHeight:480,padding:"0.6rem"},children:e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:"0.6rem"},children:e.jsx(D,{children:n.map(({broker:c,score:o},u)=>{const d=h&&c.id===h.id,p=t.length===0;return e.jsxs(E.div,{layout:!0,initial:{opacity:0,y:8},animate:{opacity:1,y:0},exit:{opacity:0},transition:{layout:{type:"spring",stiffness:280,damping:28},opacity:{duration:.2}},style:{background:"var(--paper-deep)",border:`${d?3:2}px solid ${d?"var(--accent)":"var(--ink)"}`,borderRadius:"var(--radius)",padding:"0.7rem 0.8rem",display:"flex",flexDirection:"column",gap:"0.5rem",boxShadow:d?"4px 4px 0 var(--ink)":"none"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:"0.4rem"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.03em"},children:c.label}),e.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"0.78rem",color:"var(--ink-soft)"},children:c.sub})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.2rem"},children:[d&&e.jsx("span",{className:"badge",style:{background:"var(--accent)",color:"white",border:"1.5px solid var(--ink)"},children:"TOP MATCH"}),e.jsxs("span",{style:{fontFamily:"var(--font-mono)",fontSize:"0.8rem",color:"var(--ink-soft)"},children:["rank #",u+1]})]})]}),!p&&e.jsxs("div",{style:{fontFamily:"var(--font-mono)",fontSize:"0.78rem"},children:["score ",e.jsx("strong",{style:{fontSize:"0.95rem"},children:o})," / ",t.length]}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.3rem"},children:(p?q:q.filter(g=>t.includes(g.id))).map(g=>{const f=c.caps[g.id];return e.jsxs("span",{title:g.hint,style:{fontFamily:"var(--font-mono)",fontSize:"0.72rem",padding:"0.15em 0.5em",borderRadius:2,border:"1.5px solid var(--ink)",background:p?"var(--paper)":f?"#d9ead3":"#fde2e2",color:"var(--ink)",opacity:p?.7:1},children:[g.label," · ",f?"yes":"no"]},g.id)})}),e.jsxs("div",{style:{fontFamily:"var(--font-mono)",fontSize:"0.75rem",color:"var(--ink-soft)",borderTop:"1px dashed var(--ink-soft)",paddingTop:"0.4rem"},children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Operate:"})," ",c.operate]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Watch out:"})," ",c.weakness]})]})]},c.id)})})})}),e.jsxs("div",{className:"callout",children:[t.length===0&&e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:"Pick the constraints you care about."}),' Each requirement narrows the field — brokers re-rank live, and the best fit floats to the top with a "why" caption.']}),t.length>0&&h&&e.jsxs(e.Fragment,{children:[e.jsxs("strong",{children:[h.label," wins (",m,"/",t.length,")."]})," ",z(h,t)]}),t.length>0&&!h&&!i&&e.jsxs(e.Fragment,{children:[e.jsxs("strong",{children:["It is a tie (",m,"/",t.length,")."]})," ","Multiple brokers cover the same set of requirements you picked — add another constraint to separate them."]}),i&&e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:"Nothing matches all of these."}),' Some combinations rule out every broker — for example "managed service" + "lowest latency" is hard to find in one box. Try relaxing a constraint.']})]})]})}function Q(t){const s={mode:"direct",consumerSpeedMs:300,sent:0,succeeded:0,failed:0,queued:0,queue:[],running:!1};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Producer → Consumer, with and without a broker</div>

      <div class="controls">
        <label>Mode:</label>
        <div class="pill-group">
          <input type="radio" name="wh-m" id="wh-direct" value="direct" checked>
          <label for="wh-direct">Direct call (sync)</label>
          <input type="radio" name="wh-m" id="wh-broker" value="broker">
          <label for="wh-broker">With broker (async)</label>
        </div>
        <button class="btn btn-accent" id="wh-burst">Send 20 orders fast</button>
        <button class="btn btn-ghost" id="wh-reset">Reset</button>
      </div>

      <div class="widget-stage" id="wh-stage" style="min-height: 220px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Sent</div><div class="value" id="m-sent">0</div></div>
        <div class="metric"><div class="label">Succeeded</div><div class="value" id="m-ok">0</div></div>
        <div class="metric accent"><div class="label">Failed / dropped</div><div class="value" id="m-fail">0</div></div>
        <div class="metric"><div class="label">Queued</div><div class="value" id="m-q">0</div></div>
      </div>

      <div class="callout" id="wh-explain">
        Both modes have the same producer rate and consumer speed. The only difference is whether a queue sits between them.
      </div>
    </div>
  `;const a=t.querySelector("#wh-stage");t.querySelectorAll("input[name=wh-m]").forEach(i=>i.addEventListener("change",c=>{s.mode=c.target.value,l()})),t.querySelector("#wh-burst").addEventListener("click",n),t.querySelector("#wh-reset").addEventListener("click",l);function l(){s.sent=0,s.succeeded=0,s.failed=0,s.queue=[],s.queued=0,r()}async function n(){if(!s.running){s.running=!0,l();for(let i=0;i<20;i++){s.sent++;const c=i+1;s.mode==="direct"?s.queue.length>0?s.failed++:(s.queue.push(c),(async()=>(await h(s.consumerSpeedMs),s.queue.shift(),s.succeeded++,r()))()):s.queue.push(c),r(),await h(50)}for(;s.queue.length>0;)await h(s.consumerSpeedMs),s.queue.shift(),s.succeeded++,r();s.running=!1,m()}}function m(){s.mode==="direct"?t.querySelector("#wh-explain").innerHTML=`<strong>Direct mode</strong>: producer fires faster than consumer can handle → ${s.failed} requests rejected. In real systems this manifests as 503s or timeouts. Capacity is coupled.`:t.querySelector("#wh-explain").innerHTML=`<strong>Broker mode</strong>: all ${s.sent} orders made it. The queue absorbed the burst; the consumer drained it at its own pace. Producer didn't know or care.`}function r(){let o='<svg viewBox="0 0 720 200" width="100%" style="max-width: 720px">';if(o+=`<style>
      .wh-node { stroke: var(--ink); stroke-width: 2.5; }
      .wh-arr { stroke: var(--ink); stroke-width: 2; marker-end: url(#wh-arrow); }
      .wh-msg { fill: var(--accent); stroke: var(--ink); stroke-width: 1; }
    </style>`,o+='<defs><marker id="wh-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/></marker></defs>',o+='<rect class="wh-node" x="40" y="80" width="120" height="60" rx="6" fill="#cfe5ff"/>',o+='<text class="msg-label" x="100" y="110" text-anchor="middle">PRODUCER</text>',o+='<text class="msg-sub" x="100" y="128" text-anchor="middle">orders/sec ≈ 20</text>',s.mode==="broker"){o+='<rect class="wh-node" x="260" y="60" width="240" height="100" rx="6" fill="var(--accent-soft)"/>',o+='<text class="msg-label" x="380" y="82" text-anchor="middle">BROKER (queue)</text>',o+=`<text class="msg-sub" x="380" y="98" text-anchor="middle">${s.queue.length} pending</text>`;const u=10;s.queue.slice(0,u).forEach((p,g)=>{const f=280+g*22;o+=`<rect class="wh-msg" x="${f}" y="115" width="18" height="30" rx="2"/>`,o+=`<text x="${f+9}" y="134" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px; fill: white;">${p}</text>`}),s.queue.length>u&&(o+=`<text class="msg-sub" x="${280+u*22+10}" y="134">+${s.queue.length-u}</text>`),o+='<line class="wh-arr" x1="160" y1="110" x2="258" y2="110"/>',o+='<line class="wh-arr" x1="500" y1="110" x2="598" y2="110"/>'}else o+='<line class="wh-arr" x1="160" y1="110" x2="598" y2="110"/>',o+='<text class="msg-sub" x="380" y="100" text-anchor="middle">direct HTTP call</text>';o+='<rect class="wh-node" x="600" y="80" width="120" height="60" rx="6" fill="#c8f0c8"/>',o+='<text class="msg-label" x="660" y="110" text-anchor="middle">CONSUMER</text>',o+='<text class="msg-sub" x="660" y="128" text-anchor="middle">~3 orders/sec</text>',o+="</svg>",a.innerHTML=o,t.querySelector("#m-sent").textContent=s.sent,t.querySelector("#m-ok").textContent=s.succeeded,t.querySelector("#m-fail").textContent=s.failed,t.querySelector("#m-q").textContent=s.queue.length}function h(i){return new Promise(c=>setTimeout(c,i))}l()}function K(t){const s={partitions:4,consumersA:2,consumersB:1};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Topic "orders" with N partitions</div>

      <div class="controls">
        <label>Partitions:</label>
        <input type="range" min="1" max="8" value="4" id="tp-p">
        <span style="font-family: var(--font-mono);" id="tp-p-val">4</span>
        <label>Consumers in Group A:</label>
        <input type="range" min="1" max="6" value="2" id="tp-a">
        <span style="font-family: var(--font-mono);" id="tp-a-val">2</span>
        <label>Consumers in Group B:</label>
        <input type="range" min="0" max="6" value="1" id="tp-b">
        <span style="font-family: var(--font-mono);" id="tp-b-val">1</span>
      </div>

      <div class="widget-stage" id="tp-stage" style="min-height: 360px;"></div>

      <div class="callout" id="tp-explain"></div>
    </div>
  `,["p","a","b"].forEach(n=>{const m=t.querySelector("#tp-"+n),r=t.querySelector("#tp-"+n+"-val");m.addEventListener("input",h=>{const i=Number(h.target.value);r.textContent=i,n==="p"&&(s.partitions=i),n==="a"&&(s.consumersA=i),n==="b"&&(s.consumersB=i),l()})});function a(n){if(n===0)return new Array(s.partitions).fill(null);const m=new Array(s.partitions).fill(null);for(let r=0;r<s.partitions;r++)m[r]=r%n;return m}function l(){const r=s.partitions,h=680/Math.max(r,1);let i='<svg viewBox="0 0 760 360" width="100%" style="max-width: 760px">';i+=`<style>
      .tp-tube { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 2; }
      .tp-msg { fill: var(--accent); stroke: var(--ink); stroke-width: 1; }
      .tp-consumer { fill: #c8f0c8; stroke: var(--ink); stroke-width: 2.5; }
      .tp-consumer.idle { fill: #ddd; stroke-dasharray: 4 3; }
      .tp-line { stroke: var(--ink); stroke-width: 1.5; stroke-dasharray: 4 3; }
      .tp-line.a { stroke: #1c6dd0; }
      .tp-line.b { stroke: #7f4eb6; }
    </style>`,i+='<text class="msg-label" x="20" y="22">TOPIC: orders</text>',i+=`<text class="msg-sub" x="20" y="40">${r} partition(s)</text>`;const c=50;for(let p=0;p<r;p++){const g=40+p*h;i+=`<rect class="tp-tube" x="${g}" y="${c}" width="${h-8}" height="50" rx="4"/>`,i+=`<text class="msg-sub" x="${g+(h-8)/2}" y="${c-4}" text-anchor="middle">P${p}</text>`;for(let f=0;f<4;f++){const v=g+6+f*18;i+=`<rect class="tp-msg" x="${v}" y="${c+14}" width="14" height="22" rx="2"/>`}}const o=180;i+=`<text class="msg-label" x="20" y="${o-30}">GROUP A (group.id = "emailer")</text>`,i+=`<text class="msg-sub" x="20" y="${o-14}">${s.consumersA} consumer(s) — partitions split across them</text>`;const u=a(s.consumersA);for(let p=0;p<s.consumersA;p++){const g=40+p*130;i+=`<rect class="tp-consumer" x="${g}" y="${o}" width="110" height="50" rx="6"/>`,i+=`<text class="msg-label" x="${g+55}" y="${o+22}" text-anchor="middle">A-${p}</text>`;const f=u.map((v,y)=>v===p?y:null).filter(v=>v!==null);i+=`<text class="msg-sub" x="${g+55}" y="${o+40}" text-anchor="middle">P: ${f.length?f.join(","):"(idle)"}</text>`,f.forEach(v=>{const y=40+v*h+(h-8)/2;i+=`<line class="tp-line a" x1="${y}" y1="${c+50}" x2="${g+55}" y2="${o}"/>`})}if(s.consumersA>r)for(let p=r;p<s.consumersA;p++){const g=40+p*130;i+=`<rect class="tp-consumer idle" x="${g}" y="${o}" width="110" height="50" rx="6"/>`,i+=`<text class="msg-label" x="${g+55}" y="${o+22}" text-anchor="middle">A-${p}</text>`,i+=`<text class="msg-sub" x="${g+55}" y="${o+40}" text-anchor="middle">IDLE</text>`}if(s.consumersB>0){i+='<text class="msg-label" x="20" y="276">GROUP B (group.id = "analytics") — independent stream</text>';const g=a(s.consumersB);for(let f=0;f<s.consumersB;f++){const v=40+f*130;i+=`<rect class="tp-consumer" x="${v}" y="290" width="110" height="50" rx="6" fill="#cfe5ff"/>`,i+=`<text class="msg-label" x="${v+55}" y="312" text-anchor="middle">B-${f}</text>`;const y=g.map((k,x)=>k===f?x:null).filter(k=>k!==null);i+=`<text class="msg-sub" x="${v+55}" y="330" text-anchor="middle">P: ${y.length?y.join(","):"(idle)"}</text>`,y.forEach(k=>{const x=40+k*h+(h-8)/2;i+=`<line class="tp-line b" x1="${x}" y1="${c+50}" x2="${v+55}" y2="290"/>`})}}i+="</svg>",t.querySelector("#tp-stage").innerHTML=i;let d;s.consumersA>r?d=`<strong>${s.consumersA-r} consumer(s) idle in Group A.</strong> Partitions are the max parallelism unit — extra consumers just stand around. Add more partitions or fewer consumers.`:s.consumersA===r?d="Perfect 1-to-1: each consumer in Group A gets one partition. Maximum parallelism, no idle workers.":d=`Each consumer in Group A handles ~${(r/s.consumersA).toFixed(1)} partitions. Throughput per consumer scales with how many it owns.`,s.consumersB>0&&(d+=" Group B reads the same topic <em>independently</em> — its consumers also see every message."),t.querySelector("#tp-explain").innerHTML=d}l()}const U=["at-most-once","at-least-once","exactly-once"],G={none:{label:"No failures",crashPoint:null},preAck:{label:"Consumer crashes BEFORE acking",crashPoint:"before-ack"},postAck:{label:"Consumer crashes AFTER processing but BEFORE acking",crashPoint:"after-process"},netLost:{label:"Network drops the ack",crashPoint:"ack-lost"}};function Y(t,s){let a=0,l=!1,n=!1,m=!1;return s==="none"?a=1:s==="preAck"?t==="at-most-once"?(a=0,l=!0):a=1:s==="postAck"?t==="at-most-once"?a=1:t==="at-least-once"?(a=2,n=!0):t==="exactly-once"&&(a=1):s==="netLost"&&(t==="at-most-once"?a=1:(a=2,n=!0,m=!0,t==="exactly-once"&&(a=1))),{processed:a,lost:l,duplicated:n,lostAck:m}}function _(t){let s="at-least-once",a="none";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Send one message, choose your guarantee</div>

      <div class="controls">
        <label>Semantic:</label>
        <div class="pill-group">
          ${U.map((n,m)=>`
            <input type="radio" name="dv-s" id="dv-${m}" value="${n}" ${n==="at-least-once"?"checked":""}>
            <label for="dv-${m}">${n}</label>
          `).join("")}
        </div>
      </div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="dv-scen" style="min-width: 320px;">
          ${Object.entries(G).map(([n,m])=>`<option value="${n}">${m.label}</option>`).join("")}
        </select>
      </div>

      <div class="widget-stage" id="dv-stage" style="min-height: 240px;"></div>

      <div class="callout" id="dv-explain"></div>
    </div>
  `,t.querySelectorAll("input[name=dv-s]").forEach(n=>n.addEventListener("change",m=>{s=m.target.value,l()})),t.querySelector("#dv-scen").addEventListener("change",n=>{a=n.target.value,l()});function l(){const n=Y(s,a);let m=`
      <div class="dv-result">
        <div class="dv-block ${n.lost?"bad":"good"}">
          <div class="dv-block-label">DELIVERED</div>
          <div class="dv-block-value">${n.lost?"0 ✗ LOST":n.processed>0?"1+ ✓":"0"}</div>
        </div>
        <div class="dv-block ${n.processed>1?"bad":"good"}">
          <div class="dv-block-label">PROCESSED COUNT</div>
          <div class="dv-block-value">${n.processed}× ${n.duplicated?"— ⚠ DUPLICATE":""}</div>
        </div>
        <div class="dv-block">
          <div class="dv-block-label">EFFECT</div>
          <div class="dv-block-value">${n.lost?"lost":n.duplicated&&s!=="exactly-once"?"duplicate":"exactly once ✓"}</div>
        </div>
      </div>
      <style>
        .dv-result { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.6rem; }
        .dv-block { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; box-shadow: 3px 3px 0 var(--ink); }
        .dv-block.good { box-shadow: 3px 3px 0 #2a8a3e; background: #d6f5d6; }
        .dv-block.bad  { box-shadow: 3px 3px 0 var(--accent); background: var(--accent-soft); }
        .dv-block-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; }
        .dv-block-value { font-family: var(--font-display); font-size: 1.2rem; letter-spacing: 0.04em; }
        @media (max-width: 600px) { .dv-result { grid-template-columns: 1fr; } }
      </style>
    `;t.querySelector("#dv-stage").innerHTML=m;let r;n.lost?r="<strong>Lost.</strong> The message never reached an alive consumer. At-most-once accepts this as the cost of doing business.":n.processed>1&&s==="at-least-once"?r="<strong>Duplicated.</strong> The broker redelivered after the failure; the consumer ran twice. To avoid app-level harm, consumers should be idempotent (next lesson).":n.processed===1&&s==="exactly-once"?r="<strong>Exactly once.</strong> The consumer received the message twice but deduped by ID. App sees one effect.":r="<strong>Single processing.</strong> No retries needed; the happy path.",t.querySelector("#dv-explain").innerHTML=r}l()}const L=[{id:"evt-1",op:"credit",amount:100},{id:"evt-2",op:"credit",amount:50},{id:"evt-2",op:"credit",amount:50},{id:"evt-3",op:"debit",amount:30}];function X(t){let s=!1;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Same stream, two consumer styles</div>

      <div class="controls">
        <label><input type="checkbox" id="or-idem"> Idempotent consumer (dedupe by message ID)</label>
        <button class="btn btn-accent" id="or-run">Process stream</button>
        <button class="btn btn-ghost" id="or-reset">Reset</button>
      </div>

      <div class="widget-stage" id="or-stage" style="min-height: 320px;"></div>

      <div class="callout" id="or-explain">
        Stream: 4 events. <strong>evt-2 is delivered twice</strong> (an at-least-once redelivery). With idempotency, the duplicate is skipped; without, the balance is wrong.
      </div>
    </div>
  `,t.querySelector("#or-idem").addEventListener("change",n=>{s=n.target.checked}),t.querySelector("#or-run").addEventListener("click",a),t.querySelector("#or-reset").addEventListener("click",()=>l([]));function a(){const n=[];let m=0;const r=new Set;L.forEach((h,i)=>{if(s&&r.has(h.id)){n.push({...h,action:"skipped (already processed)",balanceBefore:m,balanceAfter:m});return}const c=m;h.op==="credit"?m+=h.amount:m-=h.amount,r.add(h.id),n.push({...h,action:"applied",balanceBefore:c,balanceAfter:m})}),l(n)}function l(n){let m=`
      <div class="or-stream">
        ${L.map((r,h)=>{const i=n[h];let c="or-msg";return i?i.action==="skipped (already processed)"?c+=" skipped":c+=" applied":c+=" pending",`<div class="${c}">
            <div class="or-msg-id">${r.id}${h===2?" ↻":""}</div>
            <div class="or-msg-op">${r.op} ${r.amount}</div>
            ${i?`<div class="or-msg-action">${i.action}</div><div class="or-msg-balance">balance: ${i.balanceBefore} → ${i.balanceAfter}</div>`:""}
          </div>`}).join("")}
      </div>
      ${n.length?`<div class="or-final"><strong>Final balance: ${n[n.length-1].balanceAfter}</strong> (expected: 120 — credit 100 + credit 50 - debit 30)</div>`:""}
      <style>
        .or-stream { display: grid; grid-template-columns: repeat(${L.length}, 1fr); gap: 0.4rem; }
        .or-msg { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.6rem; text-align: center; }
        .or-msg.pending { opacity: 0.5; }
        .or-msg.applied { background: #c8f0c8; box-shadow: 3px 3px 0 var(--ink); }
        .or-msg.skipped { background: #ffe9b3; box-shadow: 3px 3px 0 var(--ink); }
        .or-msg-id { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.9rem; }
        .or-msg-op { font-family: var(--font-mono); font-size: 0.8rem; }
        .or-msg-action { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); margin-top: 0.3em; padding-top: 0.2em; border-top: 1px dashed var(--ink); }
        .or-msg-balance { font-family: var(--font-mono); font-size: 0.7rem; }
        .or-final { margin-top: 0.6rem; padding: 0.6rem 0.8rem; background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); box-shadow: 3px 3px 0 var(--accent); }
        @media (max-width: 640px) { .or-stream { grid-template-columns: 1fr 1fr; } }
      </style>
    `;if(t.querySelector("#or-stage").innerHTML=m,n.length){const r=n[n.length-1].balanceAfter;r===120?t.querySelector("#or-explain").innerHTML="<strong>Correct balance.</strong> The duplicate of evt-2 was deduped by ID. Idempotent consumers handle the at-least-once world gracefully.":t.querySelector("#or-explain").innerHTML=`<strong>Wrong! Balance is ${r} instead of 120.</strong> The duplicate of evt-2 was applied twice. Without idempotency, the redelivery silently corrupted the data.`}}l([])}const M=10;function V(t){let s="queue";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">10 messages, 3 consumers — two different shapes</div>

      <div class="controls">
        <label>Model:</label>
        <div class="pill-group">
          <input type="radio" name="qs-m" id="qs-q" value="queue" checked>
          <label for="qs-q">Work queue</label>
          <input type="radio" name="qs-m" id="qs-s" value="stream">
          <label for="qs-s">Stream (log)</label>
        </div>
      </div>

      <div class="widget-stage" id="qs-stage" style="min-height: 320px;"></div>

      <div class="callout" id="qs-explain"></div>
    </div>
  `,t.querySelectorAll("input[name=qs-m]").forEach(l=>l.addEventListener("change",n=>{s=n.target.value,a()}));function a(){const l=["#cfe5ff","#c8f0c8","#ffe9b3"],n=[];if(s==="queue")for(let r=0;r<M;r++)n.push({msgId:r+1,consumer:r%3});else for(let r=0;r<M;r++)n.push({msgId:r+1,consumer:"all"});let m=`
      <div class="qs-section">
        <div class="qs-label">${s==="queue"?"WORK QUEUE (each message goes to ONE worker)":"STREAM / LOG (each consumer sees ALL messages)"}</div>
        <div class="qs-msgs">
          ${n.map(r=>(r.consumer==="all"?l.map(h=>`border-top: 4px solid ${h};`).join(""):`${l[r.consumer]}`,`<div class="qs-msg" style="${r.consumer==="all"?"background: var(--paper)":`background: ${l[r.consumer]}`};">
              <div class="qs-msg-id">m${r.msgId}</div>
              <div class="qs-msg-tags">${r.consumer==="all"?l.map((h,i)=>`<span class="qs-tag" style="background:${h}">C${i+1}</span>`).join(""):`<span class="qs-tag" style="background:${l[r.consumer]}">C${r.consumer+1}</span>`}</div>
            </div>`)).join("")}
        </div>
      </div>
      <div class="qs-consumers">
        ${[0,1,2].map(r=>{const h=s==="queue"?n.filter(i=>i.consumer===r).map(i=>"m"+i.msgId):n.map(i=>"m"+i.msgId);return`<div class="qs-consumer" style="background: ${l[r]};">
            <div class="qs-consumer-name">Consumer C${r+1}</div>
            <div class="qs-consumer-msgs">received: ${h.length?h.join(", "):"(nothing)"}</div>
          </div>`}).join("")}
      </div>

      <style>
        .qs-section { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; margin-bottom: 0.6rem; }
        .qs-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.85rem; margin-bottom: 0.4em; }
        .qs-msgs { display: grid; grid-template-columns: repeat(${M}, 1fr); gap: 0.25rem; }
        .qs-msg { background: var(--paper); border: 1.5px solid var(--ink); border-radius: 2px; padding: 0.3em; text-align: center; }
        .qs-msg-id { font-family: var(--font-mono); font-size: 0.78rem; font-weight: 600; }
        .qs-msg-tags { display: flex; gap: 1px; justify-content: center; margin-top: 0.2em; }
        .qs-tag { display: inline-block; font-family: var(--font-mono); font-size: 0.6rem; padding: 0 0.25em; border: 1px solid var(--ink); border-radius: 2px; }
        .qs-consumers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; }
        .qs-consumer { border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; box-shadow: 3px 3px 0 var(--ink); }
        .qs-consumer-name { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.9rem; }
        .qs-consumer-msgs { font-family: var(--font-mono); font-size: 0.78rem; }
        @media (max-width: 600px) { .qs-msgs { grid-template-columns: repeat(5, 1fr); } .qs-consumers { grid-template-columns: 1fr; } }
      </style>
    `;t.querySelector("#qs-stage").innerHTML=m,t.querySelector("#qs-explain").innerHTML=s==="queue"?"<strong>Work queue.</strong> Each message goes to exactly one consumer. Total work split 3 ways. Once consumed, the message is gone — no replay possible.":"<strong>Stream.</strong> All 3 consumers see all 10 messages, independently. Tomorrow you can add C4, rewind to offset 0, and it gets every message from the beginning."}a()}const Z={buffer:"Buffer (unlimited)",drop:"Drop oldest at capacity",bp:"Backpressure (slow producer)",fail:"Fail (reject producer)"},j=10,O=3,w=30;function J(t){let s="buffer";const a={queue:0,sent:0,processed:0,dropped:0,throttled:0,failed:0,series:[],running:!1};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Producer ${j}/sec, Consumer ${O}/sec, buffer cap ${w}</div>

      <div class="controls">
        <label>Overflow policy:</label>
        <select class="field" id="bp-pol">
          ${Object.entries(Z).map(([i,c])=>`<option value="${i}">${c}</option>`).join("")}
        </select>
        <button class="btn btn-accent" id="bp-run">Run 15 sec sim</button>
        <button class="btn btn-ghost" id="bp-reset">Reset</button>
      </div>

      <div class="widget-stage" id="bp-stage" style="min-height: 240px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Sent</div><div class="value" id="m-sent">0</div></div>
        <div class="metric"><div class="label">Processed</div><div class="value" id="m-proc">0</div></div>
        <div class="metric"><div class="label">Dropped/failed</div><div class="value" id="m-drop">0</div></div>
        <div class="metric accent"><div class="label">Queue depth</div><div class="value" id="m-q">0</div></div>
      </div>

      <div class="callout" id="bp-explain"></div>
    </div>
  `,t.querySelector("#bp-pol").addEventListener("change",i=>{s=i.target.value,l()}),t.querySelector("#bp-run").addEventListener("click",n),t.querySelector("#bp-reset").addEventListener("click",l);function l(){a.queue=0,a.sent=0,a.processed=0,a.dropped=0,a.throttled=0,a.failed=0,a.series=[],r()}async function n(){if(a.running)return;a.running=!0,l();const i=15;for(let c=0;c<i;c++){let o=j;s==="bp"&&a.queue>=w*.7&&(o=Math.max(O,Math.floor(j*.4)),a.throttled+=j-o);for(let d=0;d<o;d++)a.sent++,a.queue>=w?s==="drop"?a.dropped++:s==="fail"?a.failed++:a.queue++:a.queue++;const u=Math.min(O,a.queue);a.queue-=u,a.processed+=u,a.series.push({t:c,queue:a.queue}),r(),await h(220)}a.running=!1,m()}function m(){s==="buffer"?t.querySelector("#bp-explain").innerHTML=`<strong>Unbounded buffer.</strong> Queue grew to ${a.queue}. Eventually you run out of disk; latency for new messages is the queue depth × processing time. Most Kafka deployments live here.`:s==="drop"?t.querySelector("#bp-explain").innerHTML=`<strong>${a.dropped} messages dropped.</strong> Producer kept its rate, but the broker discarded what wouldn't fit. Use for lossy data (metrics, telemetry); never for important events.`:s==="bp"?t.querySelector("#bp-explain").innerHTML=`<strong>Producer throttled ${a.throttled} messages.</strong> Queue stayed near the limit, producer slowed to match consumer. Zero data lost; producer pays the price.`:t.querySelector("#bp-explain").innerHTML=`<strong>${a.failed} sends rejected.</strong> Producer got errors and must handle them — typically retry-with-backoff. Loud failure, no data lost <em>if</em> the producer retries correctly.`}function r(){let o='<svg viewBox="0 0 720 200" width="100%" style="max-width: 720px">';o+=`<style>
      .bp-axis { stroke: var(--ink-soft); stroke-width: 1; }
      .bp-axis-text { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .bp-bar { fill: var(--accent); }
      .bp-bar.over { fill: #f7c8c8; stroke: var(--accent); stroke-width: 1.5; }
      .bp-limit { stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 4 3; }
      .bp-limit-text { font-family: var(--font-mono); font-size: 11px; fill: var(--accent); }
    </style>`;const u=50,d=700,p=170,g=20,f=Math.max(w*1.2,...a.series.map(x=>x.queue),10);o+=`<line class="bp-axis" x1="${u}" y1="${p}" x2="${d}" y2="${p}"/>`,o+=`<line class="bp-axis" x1="${u}" y1="${g}" x2="${u}" y2="${p}"/>`,o+=`<text class="bp-axis-text" x="${u-5}" y="${p+4}" text-anchor="end">0</text>`,o+=`<text class="bp-axis-text" x="${u-5}" y="${g+4}" text-anchor="end">${Math.round(f)}</text>`;const v=p-w/f*(p-g);o+=`<line class="bp-limit" x1="${u}" y1="${v}" x2="${d}" y2="${v}"/>`,o+=`<text class="bp-limit-text" x="${d}" y="${v-4}" text-anchor="end">buffer cap = ${w}</text>`;const y=15,k=(d-u)/y-2;a.series.forEach(x=>{const R=u+x.t*(d-u)/y+1,W=x.queue/f*(p-g),N=x.queue>=w;o+=`<rect class="bp-bar ${N?"over":""}" x="${R}" y="${p-W}" width="${k}" height="${W}"/>`}),o+="</svg>",t.querySelector("#bp-stage").innerHTML=o,t.querySelector("#m-sent").textContent=a.sent,t.querySelector("#m-proc").textContent=a.processed,t.querySelector("#m-drop").textContent=a.dropped+a.failed,t.querySelector("#m-q").textContent=a.queue}function h(i){return new Promise(c=>setTimeout(c,i))}l()}const ee=[{id:"m1",poison:!1},{id:"m2",poison:!1},{id:"m3",poison:!0},{id:"m4",poison:!1},{id:"m5",poison:!1}];function te(t){let s=3,a="expo";const l={delivered:[],dlq:[],timeline:[],running:!1};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">5 messages, one is poison</div>

      <div class="controls">
        <label>Max retries:</label>
        <input type="range" min="0" max="6" value="3" id="dl-r">
        <span style="font-family: var(--font-mono);" id="dl-r-val">3</span>
        <label>Backoff:</label>
        <div class="pill-group">
          <input type="radio" name="dl-b" id="dl-expo" value="expo" checked>
          <label for="dl-expo">Exponential</label>
          <input type="radio" name="dl-b" id="dl-lin" value="linear">
          <label for="dl-lin">Linear</label>
          <input type="radio" name="dl-b" id="dl-none" value="none">
          <label for="dl-none">None</label>
        </div>
        <button class="btn btn-accent" id="dl-run">Process stream</button>
        <button class="btn btn-ghost" id="dl-reset">Reset</button>
      </div>

      <div class="widget-stage" id="dl-stage" style="min-height: 320px;"></div>

      <div class="callout" id="dl-explain">Run the stream and see how m3 behaves under your retry policy.</div>
    </div>
  `,t.querySelector("#dl-r").addEventListener("input",u=>{s=Number(u.target.value),t.querySelector("#dl-r-val").textContent=s}),t.querySelectorAll("input[name=dl-b]").forEach(u=>u.addEventListener("change",d=>{a=d.target.value})),t.querySelector("#dl-run").addEventListener("click",r),t.querySelector("#dl-reset").addEventListener("click",n);function n(){l.delivered=[],l.dlq=[],l.timeline=[],i()}function m(u){return a==="none"?0:a==="linear"?u*1e3:Math.pow(2,u-1)*1e3}async function r(){if(l.running)return;l.running=!0,n();let u=0;for(const d of ee){let p=0,g=!1;for(;p<=s;){p++;const f=d.poison;if(l.timeline.push({t:u,id:d.id,attempt:p,result:f?"fail":"ok"}),i(),await o(180),!f){l.delivered.push({id:d.id,attempts:p}),g=!0,u+=100;break}const v=m(p);p<=s&&(l.timeline.push({t:u+50,id:d.id,attempt:p,result:"backoff",wait:v}),i(),await o(Math.min(280,80+v/50))),u+=200+v}g||(l.dlq.push({id:d.id,attempts:p}),l.timeline.push({t:u,id:d.id,attempt:"dlq",result:"dlq"}),i(),u+=100)}l.running=!1,h()}function h(){const u=l.timeline.filter(p=>p.id==="m3"&&(p.result==="ok"||p.result==="fail")).length,d=l.dlq.find(p=>p.id==="m3");s===0?t.querySelector("#dl-explain").innerHTML="<strong>No retries.</strong> m3 failed once and went straight to DLQ. Fast, but you've given up on transient failures too.":d?t.querySelector("#dl-explain").innerHTML=`<strong>m3 retried ${u} times, then quarantined.</strong> The line kept moving — m4 and m5 weren't blocked. DLQ now has 1 message for human review.`:t.querySelector("#dl-explain").innerHTML="<strong>m3 went poisonous before retries ran out.</strong> In a real system you'd see it eventually reach the DLQ. The poison message can\\'t be made to succeed."}function i(){let u=`
      <div class="dl-grid">
        <div class="dl-panel">
          <div class="dl-panel-label">DELIVERED (${l.delivered.length})</div>
          ${l.delivered.length?l.delivered.map(d=>`<div class="dl-msg ok">${d.id} <span class="dl-sub">${d.attempts} attempt${d.attempts>1?"s":""}</span></div>`).join(""):'<div class="dl-empty">none yet</div>'}
        </div>
        <div class="dl-panel">
          <div class="dl-panel-label">DEAD LETTER QUEUE (${l.dlq.length})</div>
          ${l.dlq.length?l.dlq.map(d=>`<div class="dl-msg bad">${d.id} <span class="dl-sub">${d.attempts} attempts</span></div>`).join(""):'<div class="dl-empty">empty 🎉</div>'}
        </div>
      </div>

      <div class="dl-tl">
        <div class="dl-tl-label">RETRY TIMELINE</div>
        ${l.timeline.slice(-30).map(d=>{const p=d.result==="ok"?"ok":d.result==="fail"?"fail":d.result==="dlq"?"dlq":"bo",g=d.result==="ok"?`${d.id}: attempt ${d.attempt} ✓`:d.result==="fail"?`${d.id}: attempt ${d.attempt} ✗`:d.result==="dlq"?`${d.id} → DLQ`:`${d.id}: wait ${d.wait}ms`;return`<div class="dl-tl-row ${p}">${c(g)}</div>`}).join("")}
      </div>

      <style>
        .dl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.6rem; }
        .dl-panel { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; }
        .dl-panel-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
        .dl-msg { font-family: var(--font-mono); font-size: 0.85rem; padding: 0.25em 0.5em; margin: 0.12em 0; border: 1.5px solid var(--ink); border-radius: 2px; }
        .dl-msg.ok { background: #d6f5d6; }
        .dl-msg.bad { background: var(--accent-soft); border-color: var(--accent); }
        .dl-sub { color: var(--ink-soft); font-size: 0.72rem; }
        .dl-empty { font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-faint); }
        .dl-tl { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; max-height: 180px; overflow-y: auto; }
        .dl-tl-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
        .dl-tl-row { font-family: var(--font-mono); font-size: 0.78rem; padding: 0.12em 0.4em; border-left: 3px solid transparent; margin: 0.08em 0; border-radius: 2px; }
        .dl-tl-row.ok { border-left-color: #2a8a3e; background: #ecf9ec; }
        .dl-tl-row.fail { border-left-color: var(--accent); background: var(--accent-soft); }
        .dl-tl-row.dlq { border-left-color: var(--accent); background: var(--accent); color: white; font-weight: 600; }
        .dl-tl-row.bo { border-left-color: #b07b1a; background: #fff6dc; color: var(--ink-soft); }
        @media (max-width: 600px) { .dl-grid { grid-template-columns: 1fr; } }
      </style>
    `;t.querySelector("#dl-stage").innerHTML=u}function c(u){return String(u).replace(/[&<>"']/g,d=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[d])}function o(u){return new Promise(d=>setTimeout(d,u))}n()}const S=t=>()=>e.jsx(F,{init:t}),ie={slug:"messaging",title:"Messaging",intro:e.jsx(e.Fragment,{children:"Eight lessons on brokers, queues, topics, partitions, and the patterns behind Kafka, RabbitMQ, SQS, NATS — the systems that decouple producers from consumers."}),lessons:[{slug:"why",number:"01",title:"Why Messaging?",blurb:"Two services, one network. Why a message broker between them changes everything about failure, scale, and back-pressure.",Widget:S(Q),intro:e.jsx(e.Fragment,{children:"Direct service-to-service calls couple producer to consumer in time and availability. A broker in the middle decouples them: producer keeps going even when consumer is down."}),sections:[],takeaways:["Sync call: producer blocks until consumer responds. One slow consumer = slow producer.","Async via broker: producer fires-and-forgets, consumer drains the queue at its own pace.","Decoupling in time means decoupling in availability.","Cost: an extra moving part to operate, monitor, and reason about."]},{slug:"topics-partitions",number:"02",title:"Topics, Partitions & Consumer Groups",blurb:"The Kafka mental model. Producers append to a topic; partitions split the work; consumer groups share the load.",Widget:S(K),intro:e.jsx(e.Fragment,{children:"Topics hold messages. Partitions parallelize them. Consumer groups divide partitions among workers so the same topic can be processed by many consumers at once."}),sections:[],takeaways:["Partition = unit of parallelism. More partitions = more consumers can work in parallel.","Each partition is consumed by at most one consumer in a group.","Ordering is per-partition, not per-topic.","Adding consumers beyond the partition count just leaves them idle."]},{slug:"delivery",number:"03",title:"Delivery Semantics",blurb:"At-most-once, at-least-once, exactly-once. The three answers your broker can give, ranked by cost.",Widget:S(_),intro:e.jsx(e.Fragment,{children:"What guarantee does the broker make about message delivery? Each level fixes one failure mode at the cost of more overhead."}),sections:[],takeaways:["At-most-once: fast, may lose messages on crash.","At-least-once: never loses, may duplicate. The pragmatic default.","Exactly-once: requires coordination + idempotent consumers. Available in Kafka with effort.",'Most "exactly-once" claims are at-least-once + idempotent consumer.']},{slug:"ordering",number:"04",title:"Ordering & Idempotency",blurb:"Ordering is only guaranteed within a partition. So consumers must be idempotent.",Widget:S(X),intro:e.jsx(e.Fragment,{children:"Across partitions, messages can interleave any way. If your business logic needs ordering, pin related messages to the same partition by key."}),sections:[],takeaways:["Use a partition key (user ID, order ID) to keep related messages ordered.","Idempotent consumers: processing the same message twice = same result.",'Dedup via a "seen" set or transactional outbox.',"Ordering across partitions requires a single-threaded consumer — losing parallelism."]},{slug:"queues-vs-streams",number:"05",title:"Queues vs Streams",blurb:`RabbitMQ's work queue and Kafka's log are two different shapes. Same word "messaging," very different mechanics.`,Widget:S(V),intro:e.jsx(e.Fragment,{children:"A queue deletes messages once consumed. A stream keeps them around and lets consumers seek. Different problems, different tools."}),sections:[],takeaways:["Queue: message is owned by one consumer, then gone. Good for work distribution.","Stream: append-only log, many consumers can read independently. Good for event sourcing.","Kafka, Kinesis, Redis Streams = streams. RabbitMQ, SQS = queues.","You can fake one with the other but it hurts."]},{slug:"backpressure",number:"06",title:"Backpressure & Flow Control",blurb:"Producer at 10k/s, consumer at 1k/s. Where do the extra messages go?",Widget:S(J),intro:e.jsx(e.Fragment,{children:"When producers outpace consumers, you must buffer, drop, slow down, or fail. Pick the strategy upfront — defaults are usually wrong."}),sections:[],takeaways:["Buffer: works until the buffer fills. Then what?","Drop: fast but loses messages. Only safe if you can tolerate it.","Slow down the producer: cleanest, but the producer needs to handle it.","Fail: surface the problem early instead of silently degrading."]},{slug:"dlq-retries",number:"07",title:"Dead Letter Queues & Retries",blurb:"A consumer keeps failing on the same message. Retry forever? Skip it? Quarantine it.",Widget:S(te),intro:e.jsx(e.Fragment,{children:"Some messages are poison. Retrying forever blocks the queue; skipping silently loses data. DLQs move bad messages aside for human inspection."}),sections:[],takeaways:["Retry with exponential backoff for transient failures.","After N retries, move to a DLQ — don't block the main pipeline.","DLQ messages need a human or alert; otherwise they pile up forever.","Always log the cause when moving to DLQ — context is lost otherwise."]},{slug:"architectures",number:"08",title:"Architectures in Practice",blurb:"Kafka, RabbitMQ, SQS, NATS, Redis Streams — how the same primitives compose into very different products.",Widget:H,intro:e.jsx(e.Fragment,{children:"Five popular brokers, five different sweet spots. Knowing which one fits the workload up-front saves you from a re-platform later."}),sections:[],takeaways:["Kafka: high throughput, replay, durable. Heavy ops.","RabbitMQ: flexible routing, smaller scale, easy to start.","SQS: fully managed, simple, AWS-locked.","NATS: low latency, lightweight. Redis Streams: in-memory speed but not durable by default."]},{slug:"outbox",number:"09",title:"Transactional Outbox",blurb:"How to update a database AND publish a message reliably when there's no distributed transaction between them.",Widget:P,intro:e.jsxs(e.Fragment,{children:["You wrote the row, then tried to publish — and the broker was down. Now the database has the order, nobody knows. The transactional outbox solves this by writing the event to the ",e.jsx("em",{children:"same DB transaction"})," as the business state change. A separate relay reads from the outbox and publishes."]}),sections:[{heading:"The dual-write problem",body:e.jsxs(e.Fragment,{children:[e.jsx("p",{children:"Two systems, two writes. There's no atomic transaction spanning your DB and your message broker, so failure of one after success of the other leaves them inconsistent. Retries help, but the service might crash between the two writes, so even retry isn't enough."}),e.jsxs("p",{children:["The outbox flips the problem: only one transaction, on the DB. The event sits in an ",e.jsx("code",{children:"outbox"})," table next to the business data, atomically committed. A relay (a poller or change-data-capture stream) drains it."]})]})},{heading:"Implementation flavours",body:e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Polling relay"})," — the relay queries ",e.jsx("code",{children:"SELECT * FROM outbox WHERE published_at IS NULL"})," on a tight loop, publishes, marks done. Simple, ~seconds of latency, hits the DB hard."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"CDC stream"})," — Debezium, Postgres logical replication, or a CDC product reads the WAL and emits one event per outbox insert. Lower latency, no extra DB query load, more moving parts."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Transactional broker"})," — Kafka transactions or RabbitMQ confirms let you coordinate, but the broker must be available at write time. Outbox decouples that."]})]})}],takeaways:['Outbox is the standard answer to "how do I update a DB AND publish a message reliably?"',"Trade-off: you get at-least-once delivery, not exactly-once. Consumers must be idempotent — see the Ordering & Idempotency lesson.","The relay is the single point of failure to monitor. Watch outbox row age; it shouldn't keep growing.","Debezium + Postgres logical replication is the production-grade combo. Polling works fine to start."]}]};export{ie as manifest};
