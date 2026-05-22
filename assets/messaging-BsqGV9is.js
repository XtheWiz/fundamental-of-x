import{r as O,j as i}from"./main-BHRJeYOh.js";import{L as C}from"./LegacyWidget-Di7ysmDJ.js";import{m as M,A as P}from"./proxy-G1FlLcCo.js";const D={naive:{name:"Naive dual-write",steps:[{caption:'Service handles "place order" request.',state:{dbOrder:!1,dbOutbox:null,brokerMsg:!1}},{caption:"Write order row to DB. Committed.",state:{dbOrder:!0,dbOutbox:null,brokerMsg:!1}},{caption:'Publish "order placed" to broker — but broker is DOWN.',state:{dbOrder:!0,dbOutbox:null,brokerMsg:!1,brokerError:!0}},{caption:"DB has the order. Broker has nothing. Inconsistent state.",state:{dbOrder:!0,dbOutbox:null,brokerMsg:!1,finalBad:!0}}]},outbox:{name:"Transactional outbox",steps:[{caption:'Service handles "place order" request.',state:{dbOrder:!1,dbOutbox:null,brokerMsg:!1}},{caption:"BEGIN TX → write order row AND outbox row → COMMIT. Both atomic.",state:{dbOrder:!0,dbOutbox:"pending",brokerMsg:!1}},{caption:"Even if broker is DOWN — order is committed, event safely in outbox.",state:{dbOrder:!0,dbOutbox:"pending",brokerMsg:!1,brokerError:!0}},{caption:"Relay polls outbox, publishes, marks row done. (Retries until success.)",state:{dbOrder:!0,dbOutbox:"done",brokerMsg:!0}}]}},f={service:{x:50,y:90,label:"Service"},db:{x:240,y:90,label:"Database"},relay:{x:430,y:90,label:"Outbox relay"},broker:{x:600,y:90,label:"Message broker"}};function T({x:s,y:e,w:a=100,h:o=60,fill:r="var(--paper)",stroke:c="var(--ink)",label:t,sublabel:p,shake:n}){return i.jsxs(M.g,{animate:n?{x:[0,-3,3,-2,2,0]}:{x:0},transition:{duration:.4},children:[i.jsx("rect",{x:s-a/2,y:e-o/2,width:a,height:o,fill:r,stroke:c,strokeWidth:2.5,rx:6}),i.jsx("text",{x:s,y:e-4,textAnchor:"middle",style:{fontFamily:"var(--font-display)",fontSize:13},children:t}),p&&i.jsx("text",{x:s,y:e+14,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:9,fill:"var(--ink-soft)"},children:p})]})}function $({from:s,to:e,color:a="var(--ink)",dashed:o,label:r}){const c=e.x-s.x,t=e.y-s.y,p=Math.sqrt(c*c+t*t),n=c/p,v=t/p,l=52,m=56,d=s.x+n*l,u=s.y+v*l,g=e.x-n*m,b=e.y-v*m,h=(d+g)/2,y=(u+b)/2;return i.jsxs(M.g,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.25},children:[i.jsx("line",{x1:d,y1:u,x2:g,y2:b,stroke:a,strokeWidth:2.5,strokeDasharray:o?"5 4":void 0,markerEnd:"url(#arr-end)"}),r&&i.jsx("text",{x:h,y:y-8,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:10,fill:a,fontWeight:600},children:r})]})}function I(){const[s,e]=O.useState("naive"),[a,o]=O.useState(0),r=D[s],c=r.steps[a],t=c.state;function p(l){e(l),o(0)}function n(){o(l=>Math.min(r.steps.length-1,l+1))}function v(){o(0)}return i.jsxs("div",{className:"widget",children:[i.jsx("div",{className:"widget-title",children:"Outbox — survive the dual-write problem"}),i.jsx("div",{className:"controls",children:Object.entries(D).map(([l,m])=>i.jsx("button",{className:`btn ${s===l?"btn-accent":""}`,onClick:()=>p(l),children:m.name},l))}),i.jsxs("div",{className:"controls",children:[i.jsx("button",{className:"btn btn-accent",onClick:n,disabled:a>=r.steps.length-1,children:"Next step"}),i.jsx("button",{className:"btn btn-ghost",onClick:v,children:"Reset"}),i.jsxs("span",{style:{marginLeft:"auto",fontFamily:"var(--font-mono)",color:"var(--ink-soft)",fontSize:"0.85rem"},children:["Step ",a+1," / ",r.steps.length]})]}),i.jsx("div",{className:"widget-stage",style:{minHeight:240},children:i.jsxs("svg",{viewBox:"0 0 700 200",width:"100%",style:{maxWidth:700},children:[i.jsx("defs",{children:i.jsx("marker",{id:"arr-end",markerWidth:"10",markerHeight:"10",refX:"9",refY:"5",orient:"auto",children:i.jsx("polygon",{points:"0 0,10 5,0 10",fill:"var(--ink)"})})}),i.jsx(T,{...f.service,sublabel:"POST /orders"}),i.jsxs(M.g,{animate:{y:0},children:[i.jsx("rect",{x:f.db.x-60,y:f.db.y-36,width:120,height:72,fill:"var(--paper)",stroke:"var(--ink)",strokeWidth:2.5,rx:6}),i.jsx("text",{x:f.db.x,y:f.db.y-22,textAnchor:"middle",style:{fontFamily:"var(--font-display)",fontSize:12},children:"Database"}),i.jsx("rect",{x:f.db.x-52,y:f.db.y-12,width:104,height:20,rx:3,fill:t.dbOrder?"#2a8a3e":"var(--paper-deep)",stroke:"var(--ink)",strokeWidth:1.5,style:{transition:"fill 0.2s ease"}}),i.jsxs("text",{x:f.db.x,y:f.db.y+2,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:10,fontWeight:600,fill:t.dbOrder?"white":"var(--ink-faint)"},children:["orders: ",t.dbOrder?"1 row":"empty"]}),i.jsx("rect",{x:f.db.x-52,y:f.db.y+12,width:104,height:20,rx:3,fill:t.dbOutbox==="pending"?"var(--accent)":t.dbOutbox==="done"?"#1c6dd0":"var(--paper-deep)",stroke:"var(--ink)",strokeWidth:1.5,style:{transition:"fill 0.2s ease"}}),i.jsxs("text",{x:f.db.x,y:f.db.y+26,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:10,fontWeight:600,fill:t.dbOutbox?"white":"var(--ink-faint)"},children:["outbox: ",t.dbOutbox||(s==="naive"?"—":"empty")]})]}),s==="outbox"&&i.jsx(T,{...f.relay,sublabel:t.dbOutbox==="done"?"published ✓":"polling…"}),i.jsx(T,{...f.broker,fill:t.brokerError?"#fde2e2":t.brokerMsg?"#d9ead3":"var(--paper)",stroke:t.brokerError?"var(--accent)":"var(--ink)",sublabel:t.brokerError?"⚠ DOWN":t.brokerMsg?"1 message":"idle",shake:t.brokerError&&a===2}),i.jsxs(P,{children:[a>=1&&i.jsx($,{from:f.service,to:f.db,label:"write"},"s-db"),s==="naive"&&a>=2&&i.jsx($,{from:f.db,to:f.broker,color:t.brokerError?"var(--accent)":"var(--ink)",dashed:!0,label:t.brokerError?"FAIL":"publish"},"db-b"),s==="outbox"&&a>=3&&i.jsxs(i.Fragment,{children:[i.jsx($,{from:f.db,to:f.relay,label:"poll"},"db-r"),i.jsx($,{from:f.relay,to:f.broker,label:"publish"},"r-b")]})]})]})}),i.jsxs("div",{className:"callout",children:[i.jsxs("strong",{children:["Step ",a+1,"."]})," ",c.caption,c.state.finalBad&&i.jsx("div",{style:{marginTop:"0.4rem",color:"var(--accent)"},children:"⚠ This is the dual-write bug — the whole problem the outbox pattern solves."}),s==="outbox"&&a===r.steps.length-1&&i.jsx("div",{style:{marginTop:"0.4rem",color:"#2a8a3e"},children:"✓ DB and broker stay in lockstep even if the broker (or the relay) was temporarily down."})]})]})}function N(s){const e={mode:"direct",consumerSpeedMs:300,sent:0,succeeded:0,failed:0,queued:0,queue:[],running:!1};s.innerHTML=`
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
  `;const a=s.querySelector("#wh-stage");s.querySelectorAll("input[name=wh-m]").forEach(n=>n.addEventListener("change",v=>{e.mode=v.target.value,o()})),s.querySelector("#wh-burst").addEventListener("click",r),s.querySelector("#wh-reset").addEventListener("click",o);function o(){e.sent=0,e.succeeded=0,e.failed=0,e.queue=[],e.queued=0,t()}async function r(){if(!e.running){e.running=!0,o();for(let n=0;n<20;n++){e.sent++;const v=n+1;e.mode==="direct"?e.queue.length>0?e.failed++:(e.queue.push(v),(async()=>(await p(e.consumerSpeedMs),e.queue.shift(),e.succeeded++,t()))()):e.queue.push(v),t(),await p(50)}for(;e.queue.length>0;)await p(e.consumerSpeedMs),e.queue.shift(),e.succeeded++,t();e.running=!1,c()}}function c(){e.mode==="direct"?s.querySelector("#wh-explain").innerHTML=`<strong>Direct mode</strong>: producer fires faster than consumer can handle → ${e.failed} requests rejected. In real systems this manifests as 503s or timeouts. Capacity is coupled.`:s.querySelector("#wh-explain").innerHTML=`<strong>Broker mode</strong>: all ${e.sent} orders made it. The queue absorbed the burst; the consumer drained it at its own pace. Producer didn't know or care.`}function t(){let l='<svg viewBox="0 0 720 200" width="100%" style="max-width: 720px">';if(l+=`<style>
      .wh-node { stroke: var(--ink); stroke-width: 2.5; }
      .wh-arr { stroke: var(--ink); stroke-width: 2; marker-end: url(#wh-arrow); }
      .wh-msg { fill: var(--accent); stroke: var(--ink); stroke-width: 1; }
    </style>`,l+='<defs><marker id="wh-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/></marker></defs>',l+='<rect class="wh-node" x="40" y="80" width="120" height="60" rx="6" fill="#cfe5ff"/>',l+='<text class="msg-label" x="100" y="110" text-anchor="middle">PRODUCER</text>',l+='<text class="msg-sub" x="100" y="128" text-anchor="middle">orders/sec ≈ 20</text>',e.mode==="broker"){l+='<rect class="wh-node" x="260" y="60" width="240" height="100" rx="6" fill="var(--accent-soft)"/>',l+='<text class="msg-label" x="380" y="82" text-anchor="middle">BROKER (queue)</text>',l+=`<text class="msg-sub" x="380" y="98" text-anchor="middle">${e.queue.length} pending</text>`;const m=10;e.queue.slice(0,m).forEach((u,g)=>{const b=280+g*22;l+=`<rect class="wh-msg" x="${b}" y="115" width="18" height="30" rx="2"/>`,l+=`<text x="${b+9}" y="134" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px; fill: white;">${u}</text>`}),e.queue.length>m&&(l+=`<text class="msg-sub" x="${280+m*22+10}" y="134">+${e.queue.length-m}</text>`),l+='<line class="wh-arr" x1="160" y1="110" x2="258" y2="110"/>',l+='<line class="wh-arr" x1="500" y1="110" x2="598" y2="110"/>'}else l+='<line class="wh-arr" x1="160" y1="110" x2="598" y2="110"/>',l+='<text class="msg-sub" x="380" y="100" text-anchor="middle">direct HTTP call</text>';l+='<rect class="wh-node" x="600" y="80" width="120" height="60" rx="6" fill="#c8f0c8"/>',l+='<text class="msg-label" x="660" y="110" text-anchor="middle">CONSUMER</text>',l+='<text class="msg-sub" x="660" y="128" text-anchor="middle">~3 orders/sec</text>',l+="</svg>",a.innerHTML=l,s.querySelector("#m-sent").textContent=e.sent,s.querySelector("#m-ok").textContent=e.succeeded,s.querySelector("#m-fail").textContent=e.failed,s.querySelector("#m-q").textContent=e.queue.length}function p(n){return new Promise(v=>setTimeout(v,n))}o()}function H(s){const e={partitions:4,consumersA:2,consumersB:1};s.innerHTML=`
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
  `,["p","a","b"].forEach(r=>{const c=s.querySelector("#tp-"+r),t=s.querySelector("#tp-"+r+"-val");c.addEventListener("input",p=>{const n=Number(p.target.value);t.textContent=n,r==="p"&&(e.partitions=n),r==="a"&&(e.consumersA=n),r==="b"&&(e.consumersB=n),o()})});function a(r){if(r===0)return new Array(e.partitions).fill(null);const c=new Array(e.partitions).fill(null);for(let t=0;t<e.partitions;t++)c[t]=t%r;return c}function o(){const t=e.partitions,p=680/Math.max(t,1);let n='<svg viewBox="0 0 760 360" width="100%" style="max-width: 760px">';n+=`<style>
      .tp-tube { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 2; }
      .tp-msg { fill: var(--accent); stroke: var(--ink); stroke-width: 1; }
      .tp-consumer { fill: #c8f0c8; stroke: var(--ink); stroke-width: 2.5; }
      .tp-consumer.idle { fill: #ddd; stroke-dasharray: 4 3; }
      .tp-line { stroke: var(--ink); stroke-width: 1.5; stroke-dasharray: 4 3; }
      .tp-line.a { stroke: #1c6dd0; }
      .tp-line.b { stroke: #7f4eb6; }
    </style>`,n+='<text class="msg-label" x="20" y="22">TOPIC: orders</text>',n+=`<text class="msg-sub" x="20" y="40">${t} partition(s)</text>`;const v=50;for(let u=0;u<t;u++){const g=40+u*p;n+=`<rect class="tp-tube" x="${g}" y="${v}" width="${p-8}" height="50" rx="4"/>`,n+=`<text class="msg-sub" x="${g+(p-8)/2}" y="${v-4}" text-anchor="middle">P${u}</text>`;for(let b=0;b<4;b++){const h=g+6+b*18;n+=`<rect class="tp-msg" x="${h}" y="${v+14}" width="14" height="22" rx="2"/>`}}const l=180;n+=`<text class="msg-label" x="20" y="${l-30}">GROUP A (group.id = "emailer")</text>`,n+=`<text class="msg-sub" x="20" y="${l-14}">${e.consumersA} consumer(s) — partitions split across them</text>`;const m=a(e.consumersA);for(let u=0;u<e.consumersA;u++){const g=40+u*130;n+=`<rect class="tp-consumer" x="${g}" y="${l}" width="110" height="50" rx="6"/>`,n+=`<text class="msg-label" x="${g+55}" y="${l+22}" text-anchor="middle">A-${u}</text>`;const b=m.map((h,y)=>h===u?y:null).filter(h=>h!==null);n+=`<text class="msg-sub" x="${g+55}" y="${l+40}" text-anchor="middle">P: ${b.length?b.join(","):"(idle)"}</text>`,b.forEach(h=>{const y=40+h*p+(p-8)/2;n+=`<line class="tp-line a" x1="${y}" y1="${v+50}" x2="${g+55}" y2="${l}"/>`})}if(e.consumersA>t)for(let u=t;u<e.consumersA;u++){const g=40+u*130;n+=`<rect class="tp-consumer idle" x="${g}" y="${l}" width="110" height="50" rx="6"/>`,n+=`<text class="msg-label" x="${g+55}" y="${l+22}" text-anchor="middle">A-${u}</text>`,n+=`<text class="msg-sub" x="${g+55}" y="${l+40}" text-anchor="middle">IDLE</text>`}if(e.consumersB>0){n+='<text class="msg-label" x="20" y="276">GROUP B (group.id = "analytics") — independent stream</text>';const g=a(e.consumersB);for(let b=0;b<e.consumersB;b++){const h=40+b*130;n+=`<rect class="tp-consumer" x="${h}" y="290" width="110" height="50" rx="6" fill="#cfe5ff"/>`,n+=`<text class="msg-label" x="${h+55}" y="312" text-anchor="middle">B-${b}</text>`;const y=g.map((w,x)=>w===b?x:null).filter(w=>w!==null);n+=`<text class="msg-sub" x="${h+55}" y="330" text-anchor="middle">P: ${y.length?y.join(","):"(idle)"}</text>`,y.forEach(w=>{const x=40+w*p+(p-8)/2;n+=`<line class="tp-line b" x1="${x}" y1="${v+50}" x2="${h+55}" y2="290"/>`})}}n+="</svg>",s.querySelector("#tp-stage").innerHTML=n;let d;e.consumersA>t?d=`<strong>${e.consumersA-t} consumer(s) idle in Group A.</strong> Partitions are the max parallelism unit — extra consumers just stand around. Add more partitions or fewer consumers.`:e.consumersA===t?d="Perfect 1-to-1: each consumer in Group A gets one partition. Maximum parallelism, no idle workers.":d=`Each consumer in Group A handles ~${(t/e.consumersA).toFixed(1)} partitions. Throughput per consumer scales with how many it owns.`,e.consumersB>0&&(d+=" Group B reads the same topic <em>independently</em> — its consumers also see every message."),s.querySelector("#tp-explain").innerHTML=d}o()}const F=["at-most-once","at-least-once","exactly-once"],Q={none:{label:"No failures",crashPoint:null},preAck:{label:"Consumer crashes BEFORE acking",crashPoint:"before-ack"},postAck:{label:"Consumer crashes AFTER processing but BEFORE acking",crashPoint:"after-process"},netLost:{label:"Network drops the ack",crashPoint:"ack-lost"}};function z(s,e){let a=0,o=!1,r=!1,c=!1;return e==="none"?a=1:e==="preAck"?s==="at-most-once"?(a=0,o=!0):a=1:e==="postAck"?s==="at-most-once"?a=1:s==="at-least-once"?(a=2,r=!0):s==="exactly-once"&&(a=1):e==="netLost"&&(s==="at-most-once"?a=1:(a=2,r=!0,c=!0,s==="exactly-once"&&(a=1))),{processed:a,lost:o,duplicated:r,lostAck:c}}function K(s){let e="at-least-once",a="none";s.innerHTML=`
    <div class="widget">
      <div class="widget-title">Send one message, choose your guarantee</div>

      <div class="controls">
        <label>Semantic:</label>
        <div class="pill-group">
          ${F.map((r,c)=>`
            <input type="radio" name="dv-s" id="dv-${c}" value="${r}" ${r==="at-least-once"?"checked":""}>
            <label for="dv-${c}">${r}</label>
          `).join("")}
        </div>
      </div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="dv-scen" style="min-width: 320px;">
          ${Object.entries(Q).map(([r,c])=>`<option value="${r}">${c.label}</option>`).join("")}
        </select>
      </div>

      <div class="widget-stage" id="dv-stage" style="min-height: 240px;"></div>

      <div class="callout" id="dv-explain"></div>
    </div>
  `,s.querySelectorAll("input[name=dv-s]").forEach(r=>r.addEventListener("change",c=>{e=c.target.value,o()})),s.querySelector("#dv-scen").addEventListener("change",r=>{a=r.target.value,o()});function o(){const r=z(e,a);let c=`
      <div class="dv-result">
        <div class="dv-block ${r.lost?"bad":"good"}">
          <div class="dv-block-label">DELIVERED</div>
          <div class="dv-block-value">${r.lost?"0 ✗ LOST":r.processed>0?"1+ ✓":"0"}</div>
        </div>
        <div class="dv-block ${r.processed>1?"bad":"good"}">
          <div class="dv-block-label">PROCESSED COUNT</div>
          <div class="dv-block-value">${r.processed}× ${r.duplicated?"— ⚠ DUPLICATE":""}</div>
        </div>
        <div class="dv-block">
          <div class="dv-block-label">EFFECT</div>
          <div class="dv-block-value">${r.lost?"lost":r.duplicated&&e!=="exactly-once"?"duplicate":"exactly once ✓"}</div>
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
    `;s.querySelector("#dv-stage").innerHTML=c;let t;r.lost?t="<strong>Lost.</strong> The message never reached an alive consumer. At-most-once accepts this as the cost of doing business.":r.processed>1&&e==="at-least-once"?t="<strong>Duplicated.</strong> The broker redelivered after the failure; the consumer ran twice. To avoid app-level harm, consumers should be idempotent (next lesson).":r.processed===1&&e==="exactly-once"?t="<strong>Exactly once.</strong> The consumer received the message twice but deduped by ID. App sees one effect.":t="<strong>Single processing.</strong> No retries needed; the happy path.",s.querySelector("#dv-explain").innerHTML=t}o()}const E=[{id:"evt-1",op:"credit",amount:100},{id:"evt-2",op:"credit",amount:50},{id:"evt-2",op:"credit",amount:50},{id:"evt-3",op:"debit",amount:30}];function U(s){let e=!1;s.innerHTML=`
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
  `,s.querySelector("#or-idem").addEventListener("change",r=>{e=r.target.checked}),s.querySelector("#or-run").addEventListener("click",a),s.querySelector("#or-reset").addEventListener("click",()=>o([]));function a(){const r=[];let c=0;const t=new Set;E.forEach((p,n)=>{if(e&&t.has(p.id)){r.push({...p,action:"skipped (already processed)",balanceBefore:c,balanceAfter:c});return}const v=c;p.op==="credit"?c+=p.amount:c-=p.amount,t.add(p.id),r.push({...p,action:"applied",balanceBefore:v,balanceAfter:c})}),o(r)}function o(r){let c=`
      <div class="or-stream">
        ${E.map((t,p)=>{const n=r[p];let v="or-msg";return n?n.action==="skipped (already processed)"?v+=" skipped":v+=" applied":v+=" pending",`<div class="${v}">
            <div class="or-msg-id">${t.id}${p===2?" ↻":""}</div>
            <div class="or-msg-op">${t.op} ${t.amount}</div>
            ${n?`<div class="or-msg-action">${n.action}</div><div class="or-msg-balance">balance: ${n.balanceBefore} → ${n.balanceAfter}</div>`:""}
          </div>`}).join("")}
      </div>
      ${r.length?`<div class="or-final"><strong>Final balance: ${r[r.length-1].balanceAfter}</strong> (expected: 120 — credit 100 + credit 50 - debit 30)</div>`:""}
      <style>
        .or-stream { display: grid; grid-template-columns: repeat(${E.length}, 1fr); gap: 0.4rem; }
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
    `;if(s.querySelector("#or-stage").innerHTML=c,r.length){const t=r[r.length-1].balanceAfter;t===120?s.querySelector("#or-explain").innerHTML="<strong>Correct balance.</strong> The duplicate of evt-2 was deduped by ID. Idempotent consumers handle the at-least-once world gracefully.":s.querySelector("#or-explain").innerHTML=`<strong>Wrong! Balance is ${t} instead of 120.</strong> The duplicate of evt-2 was applied twice. Without idempotency, the redelivery silently corrupted the data.`}}o([])}const A=10;function Y(s){let e="queue";s.innerHTML=`
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
  `,s.querySelectorAll("input[name=qs-m]").forEach(o=>o.addEventListener("change",r=>{e=r.target.value,a()}));function a(){const o=["#cfe5ff","#c8f0c8","#ffe9b3"],r=[];if(e==="queue")for(let t=0;t<A;t++)r.push({msgId:t+1,consumer:t%3});else for(let t=0;t<A;t++)r.push({msgId:t+1,consumer:"all"});let c=`
      <div class="qs-section">
        <div class="qs-label">${e==="queue"?"WORK QUEUE (each message goes to ONE worker)":"STREAM / LOG (each consumer sees ALL messages)"}</div>
        <div class="qs-msgs">
          ${r.map(t=>(t.consumer==="all"?o.map(p=>`border-top: 4px solid ${p};`).join(""):`${o[t.consumer]}`,`<div class="qs-msg" style="${t.consumer==="all"?"background: var(--paper)":`background: ${o[t.consumer]}`};">
              <div class="qs-msg-id">m${t.msgId}</div>
              <div class="qs-msg-tags">${t.consumer==="all"?o.map((p,n)=>`<span class="qs-tag" style="background:${p}">C${n+1}</span>`).join(""):`<span class="qs-tag" style="background:${o[t.consumer]}">C${t.consumer+1}</span>`}</div>
            </div>`)).join("")}
        </div>
      </div>
      <div class="qs-consumers">
        ${[0,1,2].map(t=>{const p=e==="queue"?r.filter(n=>n.consumer===t).map(n=>"m"+n.msgId):r.map(n=>"m"+n.msgId);return`<div class="qs-consumer" style="background: ${o[t]};">
            <div class="qs-consumer-name">Consumer C${t+1}</div>
            <div class="qs-consumer-msgs">received: ${p.length?p.join(", "):"(nothing)"}</div>
          </div>`}).join("")}
      </div>

      <style>
        .qs-section { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; margin-bottom: 0.6rem; }
        .qs-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.85rem; margin-bottom: 0.4em; }
        .qs-msgs { display: grid; grid-template-columns: repeat(${A}, 1fr); gap: 0.25rem; }
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
    `;s.querySelector("#qs-stage").innerHTML=c,s.querySelector("#qs-explain").innerHTML=e==="queue"?"<strong>Work queue.</strong> Each message goes to exactly one consumer. Total work split 3 ways. Once consumed, the message is gone — no replay possible.":"<strong>Stream.</strong> All 3 consumers see all 10 messages, independently. Tomorrow you can add C4, rewind to offset 0, and it gets every message from the beginning."}a()}const G={buffer:"Buffer (unlimited)",drop:"Drop oldest at capacity",bp:"Backpressure (slow producer)",fail:"Fail (reject producer)"},S=10,L=3,q=30;function _(s){let e="buffer";const a={queue:0,sent:0,processed:0,dropped:0,throttled:0,failed:0,series:[],running:!1};s.innerHTML=`
    <div class="widget">
      <div class="widget-title">Producer ${S}/sec, Consumer ${L}/sec, buffer cap ${q}</div>

      <div class="controls">
        <label>Overflow policy:</label>
        <select class="field" id="bp-pol">
          ${Object.entries(G).map(([n,v])=>`<option value="${n}">${v}</option>`).join("")}
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
  `,s.querySelector("#bp-pol").addEventListener("change",n=>{e=n.target.value,o()}),s.querySelector("#bp-run").addEventListener("click",r),s.querySelector("#bp-reset").addEventListener("click",o);function o(){a.queue=0,a.sent=0,a.processed=0,a.dropped=0,a.throttled=0,a.failed=0,a.series=[],t()}async function r(){if(a.running)return;a.running=!0,o();const n=15;for(let v=0;v<n;v++){let l=S;e==="bp"&&a.queue>=q*.7&&(l=Math.max(L,Math.floor(S*.4)),a.throttled+=S-l);for(let d=0;d<l;d++)a.sent++,a.queue>=q?e==="drop"?a.dropped++:e==="fail"?a.failed++:a.queue++:a.queue++;const m=Math.min(L,a.queue);a.queue-=m,a.processed+=m,a.series.push({t:v,queue:a.queue}),t(),await p(220)}a.running=!1,c()}function c(){e==="buffer"?s.querySelector("#bp-explain").innerHTML=`<strong>Unbounded buffer.</strong> Queue grew to ${a.queue}. Eventually you run out of disk; latency for new messages is the queue depth × processing time. Most Kafka deployments live here.`:e==="drop"?s.querySelector("#bp-explain").innerHTML=`<strong>${a.dropped} messages dropped.</strong> Producer kept its rate, but the broker discarded what wouldn't fit. Use for lossy data (metrics, telemetry); never for important events.`:e==="bp"?s.querySelector("#bp-explain").innerHTML=`<strong>Producer throttled ${a.throttled} messages.</strong> Queue stayed near the limit, producer slowed to match consumer. Zero data lost; producer pays the price.`:s.querySelector("#bp-explain").innerHTML=`<strong>${a.failed} sends rejected.</strong> Producer got errors and must handle them — typically retry-with-backoff. Loud failure, no data lost <em>if</em> the producer retries correctly.`}function t(){let l='<svg viewBox="0 0 720 200" width="100%" style="max-width: 720px">';l+=`<style>
      .bp-axis { stroke: var(--ink-soft); stroke-width: 1; }
      .bp-axis-text { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .bp-bar { fill: var(--accent); }
      .bp-bar.over { fill: #f7c8c8; stroke: var(--accent); stroke-width: 1.5; }
      .bp-limit { stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 4 3; }
      .bp-limit-text { font-family: var(--font-mono); font-size: 11px; fill: var(--accent); }
    </style>`;const m=50,d=700,u=170,g=20,b=Math.max(q*1.2,...a.series.map(x=>x.queue),10);l+=`<line class="bp-axis" x1="${m}" y1="${u}" x2="${d}" y2="${u}"/>`,l+=`<line class="bp-axis" x1="${m}" y1="${g}" x2="${m}" y2="${u}"/>`,l+=`<text class="bp-axis-text" x="${m-5}" y="${u+4}" text-anchor="end">0</text>`,l+=`<text class="bp-axis-text" x="${m-5}" y="${g+4}" text-anchor="end">${Math.round(b)}</text>`;const h=u-q/b*(u-g);l+=`<line class="bp-limit" x1="${m}" y1="${h}" x2="${d}" y2="${h}"/>`,l+=`<text class="bp-limit-text" x="${d}" y="${h-4}" text-anchor="end">buffer cap = ${q}</text>`;const y=15,w=(d-m)/y-2;a.series.forEach(x=>{const R=m+x.t*(d-m)/y+1,j=x.queue/b*(u-g),B=x.queue>=q;l+=`<rect class="bp-bar ${B?"over":""}" x="${R}" y="${u-j}" width="${w}" height="${j}"/>`}),l+="</svg>",s.querySelector("#bp-stage").innerHTML=l,s.querySelector("#m-sent").textContent=a.sent,s.querySelector("#m-proc").textContent=a.processed,s.querySelector("#m-drop").textContent=a.dropped+a.failed,s.querySelector("#m-q").textContent=a.queue}function p(n){return new Promise(v=>setTimeout(v,n))}o()}const X=[{id:"m1",poison:!1},{id:"m2",poison:!1},{id:"m3",poison:!0},{id:"m4",poison:!1},{id:"m5",poison:!1}];function J(s){let e=3,a="expo";const o={delivered:[],dlq:[],timeline:[],running:!1};s.innerHTML=`
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
  `,s.querySelector("#dl-r").addEventListener("input",m=>{e=Number(m.target.value),s.querySelector("#dl-r-val").textContent=e}),s.querySelectorAll("input[name=dl-b]").forEach(m=>m.addEventListener("change",d=>{a=d.target.value})),s.querySelector("#dl-run").addEventListener("click",t),s.querySelector("#dl-reset").addEventListener("click",r);function r(){o.delivered=[],o.dlq=[],o.timeline=[],n()}function c(m){return a==="none"?0:a==="linear"?m*1e3:Math.pow(2,m-1)*1e3}async function t(){if(o.running)return;o.running=!0,r();let m=0;for(const d of X){let u=0,g=!1;for(;u<=e;){u++;const b=d.poison;if(o.timeline.push({t:m,id:d.id,attempt:u,result:b?"fail":"ok"}),n(),await l(180),!b){o.delivered.push({id:d.id,attempts:u}),g=!0,m+=100;break}const h=c(u);u<=e&&(o.timeline.push({t:m+50,id:d.id,attempt:u,result:"backoff",wait:h}),n(),await l(Math.min(280,80+h/50))),m+=200+h}g||(o.dlq.push({id:d.id,attempts:u}),o.timeline.push({t:m,id:d.id,attempt:"dlq",result:"dlq"}),n(),m+=100)}o.running=!1,p()}function p(){const m=o.timeline.filter(u=>u.id==="m3"&&(u.result==="ok"||u.result==="fail")).length,d=o.dlq.find(u=>u.id==="m3");e===0?s.querySelector("#dl-explain").innerHTML="<strong>No retries.</strong> m3 failed once and went straight to DLQ. Fast, but you've given up on transient failures too.":d?s.querySelector("#dl-explain").innerHTML=`<strong>m3 retried ${m} times, then quarantined.</strong> The line kept moving — m4 and m5 weren't blocked. DLQ now has 1 message for human review.`:s.querySelector("#dl-explain").innerHTML="<strong>m3 went poisonous before retries ran out.</strong> In a real system you'd see it eventually reach the DLQ. The poison message can\\'t be made to succeed."}function n(){let m=`
      <div class="dl-grid">
        <div class="dl-panel">
          <div class="dl-panel-label">DELIVERED (${o.delivered.length})</div>
          ${o.delivered.length?o.delivered.map(d=>`<div class="dl-msg ok">${d.id} <span class="dl-sub">${d.attempts} attempt${d.attempts>1?"s":""}</span></div>`).join(""):'<div class="dl-empty">none yet</div>'}
        </div>
        <div class="dl-panel">
          <div class="dl-panel-label">DEAD LETTER QUEUE (${o.dlq.length})</div>
          ${o.dlq.length?o.dlq.map(d=>`<div class="dl-msg bad">${d.id} <span class="dl-sub">${d.attempts} attempts</span></div>`).join(""):'<div class="dl-empty">empty 🎉</div>'}
        </div>
      </div>

      <div class="dl-tl">
        <div class="dl-tl-label">RETRY TIMELINE</div>
        ${o.timeline.slice(-30).map(d=>{const u=d.result==="ok"?"ok":d.result==="fail"?"fail":d.result==="dlq"?"dlq":"bo",g=d.result==="ok"?`${d.id}: attempt ${d.attempt} ✓`:d.result==="fail"?`${d.id}: attempt ${d.attempt} ✗`:d.result==="dlq"?`${d.id} → DLQ`:`${d.id}: wait ${d.wait}ms`;return`<div class="dl-tl-row ${u}">${v(g)}</div>`}).join("")}
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
    `;s.querySelector("#dl-stage").innerHTML=m}function v(m){return String(m).replace(/[&<>"']/g,d=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[d])}function l(m){return new Promise(d=>setTimeout(d,m))}r()}const W={kafka:{label:"Kafka",sub:"Distributed log",profile:[{dim:"Shape",val:"Stream (log)",link:"queues-vs-streams"},{dim:"Throughput",val:"Millions/sec, huge clusters"},{dim:"Delivery",val:"At-least-once; exactly-once via transactions",link:"delivery"},{dim:"Ordering",val:"Per-partition",link:"ordering"},{dim:"Retention",val:"Hours to forever (config)"},{dim:"Backpressure",val:"Disk-based buffering; consumers track offsets",link:"backpressure"},{dim:"DLQ",val:'Manual (write to a "deadletter" topic)',link:"dlq-retries"},{dim:"Ops cost",val:"High — needs care, monitoring, capacity planning"}],use:"Event streaming, analytics, CDC, log aggregation. When you need to replay and many consumers care."},rabbitmq:{label:"RabbitMQ",sub:"Smart broker, work queues + routing",profile:[{dim:"Shape",val:"Work queue (Streams add-on for log)",link:"queues-vs-streams"},{dim:"Throughput",val:"Tens of thousands/sec per node"},{dim:"Delivery",val:"At-most-once or at-least-once via acks",link:"delivery"},{dim:"Ordering",val:"Per-queue (sort of)"},{dim:"Retention",val:"Until consumed"},{dim:"Backpressure",val:"Built-in flow control + memory watermarks",link:"backpressure"},{dim:"DLQ",val:"Native dead-letter exchanges",link:"dlq-retries"},{dim:"Ops cost",val:"Medium — well-trodden, simpler than Kafka"}],use:'Task queues, RPC, complex routing. Pre-Kafka enterprise messaging. Still excellent for "send this email" workloads.'},sqs:{label:"AWS SQS",sub:"Boring, reliable, managed",profile:[{dim:"Shape",val:"Work queue (standard or FIFO)",link:"queues-vs-streams"},{dim:"Throughput",val:"Effectively unlimited (standard); 3000/s (FIFO)"},{dim:"Delivery",val:"At-least-once (standard); exactly-once (FIFO, capped)",link:"delivery"},{dim:"Ordering",val:"No (standard); per-group (FIFO)",link:"ordering"},{dim:"Retention",val:"14 days max"},{dim:"Backpressure",val:"Pull-based; producers always succeed if quota",link:"backpressure"},{dim:"DLQ",val:"Built-in; configure max receives → DLQ",link:"dlq-retries"},{dim:"Ops cost",val:"Near zero. AWS runs it."}],use:"AWS-resident task queues. Decoupling Lambdas. When you do not want to operate a broker at all."},nats:{label:"NATS / JetStream",sub:"Lightweight, low-latency",profile:[{dim:"Shape",val:"Pub/sub (core); streams (JetStream)",link:"queues-vs-streams"},{dim:"Throughput",val:"Millions/sec; sub-ms latency"},{dim:"Delivery",val:"At-most-once (core); at-least-once (JetStream)",link:"delivery"},{dim:"Ordering",val:"Per-subject in JetStream",link:"ordering"},{dim:"Retention",val:"Configurable (count, age, size)"},{dim:"Backpressure",val:"Drop-by-default in core; flow control in JetStream",link:"backpressure"},{dim:"DLQ",val:"Via max-deliver + separate stream",link:"dlq-retries"},{dim:"Ops cost",val:"Low. Single binary, simple cluster."}],use:"Microservice request/reply, edge devices, IoT, where Kafka feels heavy. CNCF graduated; rapidly growing."},redis:{label:"Redis Streams",sub:"Already-deployed Redis as a broker",profile:[{dim:"Shape",val:"Stream (log) with consumer groups",link:"queues-vs-streams"},{dim:"Throughput",val:"Hundreds of thousands/sec"},{dim:"Delivery",val:"At-least-once; ACK-based",link:"delivery"},{dim:"Ordering",val:"Per-stream",link:"ordering"},{dim:"Retention",val:"Configurable; in-memory by default"},{dim:"Backpressure",val:"MAXLEN policies + manual",link:"backpressure"},{dim:"DLQ",val:"Manual via XCLAIM + idle detection",link:"dlq-retries"},{dim:"Ops cost",val:"Low if you already run Redis; pay for it twice if not"}],use:"You already use Redis. Small-to-medium scale streaming without bringing in another system."}},V={"queues-vs-streams":"Queues vs Streams",delivery:"Delivery Semantics",ordering:"Ordering & Idempotency",backpressure:"Backpressure","dlq-retries":"DLQ & Retries"};function Z(s){let e="kafka";s.innerHTML=`
    <div class="widget">
      <div class="widget-title">Five brokers, same primitives</div>

      <div class="controls">
        <div class="pill-group">
          ${Object.entries(W).map(([r,c],t)=>`
            <input type="radio" name="ma-s" id="ma-${r}" value="${r}" ${t===0?"checked":""}>
            <label for="ma-${r}">${c.label.split(" /")[0]}</label>
          `).join("")}
        </div>
      </div>

      <div class="widget-stage" id="ma-stage" style="min-height: 380px;"></div>

      <div class="callout" id="ma-note"></div>
    </div>
  `,s.querySelectorAll("input[name=ma-s]").forEach(r=>r.addEventListener("change",c=>{e=c.target.value,a()}));function a(){const r=W[e];let c=`
      <div class="ma-title">${o(r.label)}</div>
      <div class="ma-sub">${o(r.sub)}</div>
      <div class="ma-grid">
        ${r.profile.map(t=>`
          <div class="ma-row">
            <div class="ma-dim">${o(t.dim)}</div>
            <div class="ma-val">
              ${o(t.val)}
              ${t.link?`<a class="ma-link" href="${t.link}.html" title="${o(V[t.link])}">→</a>`:""}
            </div>
          </div>
        `).join("")}
      </div>
      <style>
        .ma-title { font-family: var(--font-display); font-size: 1.5rem; letter-spacing: 0.04em; }
        .ma-sub { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-soft); margin-bottom: 0.6em; }
        .ma-grid { display: grid; grid-template-columns: 1fr; gap: 0.3rem; }
        .ma-row { display: grid; grid-template-columns: 170px 1fr; gap: 0.5rem; align-items: baseline; padding: 0.35em 0.6em; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: var(--radius); }
        .ma-dim { font-family: var(--font-display); letter-spacing: 0.5px; font-size: 0.85rem; color: var(--ink-soft); }
        .ma-val { font-family: var(--font-mono); font-size: 0.85rem; }
        .ma-link { font-family: var(--font-display); padding: 0.05em 0.45em; background: var(--accent); color: white; border: 1.5px solid var(--ink); border-radius: 2px; text-decoration: none; font-size: 0.8rem; margin-left: 0.4em; }
        .ma-link:hover { color: white; transform: translate(-1px, -1px); }
      </style>
    `;s.querySelector("#ma-stage").innerHTML=c,s.querySelector("#ma-note").innerHTML=r.use}function o(r){return String(r).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c])}a()}const k=s=>()=>i.jsx(C,{init:s}),re={slug:"messaging",title:"Messaging",intro:i.jsx(i.Fragment,{children:"Eight lessons on brokers, queues, topics, partitions, and the patterns behind Kafka, RabbitMQ, SQS, NATS — the systems that decouple producers from consumers."}),lessons:[{slug:"why",number:"01",title:"Why Messaging?",blurb:"Two services, one network. Why a message broker between them changes everything about failure, scale, and back-pressure.",Widget:k(N),intro:i.jsx(i.Fragment,{children:"Direct service-to-service calls couple producer to consumer in time and availability. A broker in the middle decouples them: producer keeps going even when consumer is down."}),sections:[],takeaways:["Sync call: producer blocks until consumer responds. One slow consumer = slow producer.","Async via broker: producer fires-and-forgets, consumer drains the queue at its own pace.","Decoupling in time means decoupling in availability.","Cost: an extra moving part to operate, monitor, and reason about."]},{slug:"topics-partitions",number:"02",title:"Topics, Partitions & Consumer Groups",blurb:"The Kafka mental model. Producers append to a topic; partitions split the work; consumer groups share the load.",Widget:k(H),intro:i.jsx(i.Fragment,{children:"Topics hold messages. Partitions parallelize them. Consumer groups divide partitions among workers so the same topic can be processed by many consumers at once."}),sections:[],takeaways:["Partition = unit of parallelism. More partitions = more consumers can work in parallel.","Each partition is consumed by at most one consumer in a group.","Ordering is per-partition, not per-topic.","Adding consumers beyond the partition count just leaves them idle."]},{slug:"delivery",number:"03",title:"Delivery Semantics",blurb:"At-most-once, at-least-once, exactly-once. The three answers your broker can give, ranked by cost.",Widget:k(K),intro:i.jsx(i.Fragment,{children:"What guarantee does the broker make about message delivery? Each level fixes one failure mode at the cost of more overhead."}),sections:[],takeaways:["At-most-once: fast, may lose messages on crash.","At-least-once: never loses, may duplicate. The pragmatic default.","Exactly-once: requires coordination + idempotent consumers. Available in Kafka with effort.",'Most "exactly-once" claims are at-least-once + idempotent consumer.']},{slug:"ordering",number:"04",title:"Ordering & Idempotency",blurb:"Ordering is only guaranteed within a partition. So consumers must be idempotent.",Widget:k(U),intro:i.jsx(i.Fragment,{children:"Across partitions, messages can interleave any way. If your business logic needs ordering, pin related messages to the same partition by key."}),sections:[],takeaways:["Use a partition key (user ID, order ID) to keep related messages ordered.","Idempotent consumers: processing the same message twice = same result.",'Dedup via a "seen" set or transactional outbox.',"Ordering across partitions requires a single-threaded consumer — losing parallelism."]},{slug:"queues-vs-streams",number:"05",title:"Queues vs Streams",blurb:`RabbitMQ's work queue and Kafka's log are two different shapes. Same word "messaging," very different mechanics.`,Widget:k(Y),intro:i.jsx(i.Fragment,{children:"A queue deletes messages once consumed. A stream keeps them around and lets consumers seek. Different problems, different tools."}),sections:[],takeaways:["Queue: message is owned by one consumer, then gone. Good for work distribution.","Stream: append-only log, many consumers can read independently. Good for event sourcing.","Kafka, Kinesis, Redis Streams = streams. RabbitMQ, SQS = queues.","You can fake one with the other but it hurts."]},{slug:"backpressure",number:"06",title:"Backpressure & Flow Control",blurb:"Producer at 10k/s, consumer at 1k/s. Where do the extra messages go?",Widget:k(_),intro:i.jsx(i.Fragment,{children:"When producers outpace consumers, you must buffer, drop, slow down, or fail. Pick the strategy upfront — defaults are usually wrong."}),sections:[],takeaways:["Buffer: works until the buffer fills. Then what?","Drop: fast but loses messages. Only safe if you can tolerate it.","Slow down the producer: cleanest, but the producer needs to handle it.","Fail: surface the problem early instead of silently degrading."]},{slug:"dlq-retries",number:"07",title:"Dead Letter Queues & Retries",blurb:"A consumer keeps failing on the same message. Retry forever? Skip it? Quarantine it.",Widget:k(J),intro:i.jsx(i.Fragment,{children:"Some messages are poison. Retrying forever blocks the queue; skipping silently loses data. DLQs move bad messages aside for human inspection."}),sections:[],takeaways:["Retry with exponential backoff for transient failures.","After N retries, move to a DLQ — don't block the main pipeline.","DLQ messages need a human or alert; otherwise they pile up forever.","Always log the cause when moving to DLQ — context is lost otherwise."]},{slug:"architectures",number:"08",title:"Architectures in Practice",blurb:"Kafka, RabbitMQ, SQS, NATS, Redis Streams — how the same primitives compose into very different products.",Widget:k(Z),intro:i.jsx(i.Fragment,{children:"Five popular brokers, five different sweet spots. Knowing which one fits the workload up-front saves you from a re-platform later."}),sections:[],takeaways:["Kafka: high throughput, replay, durable. Heavy ops.","RabbitMQ: flexible routing, smaller scale, easy to start.","SQS: fully managed, simple, AWS-locked.","NATS: low latency, lightweight. Redis Streams: in-memory speed but not durable by default."]},{slug:"outbox",number:"09",title:"Transactional Outbox",blurb:"How to update a database AND publish a message reliably when there's no distributed transaction between them.",Widget:I,intro:i.jsxs(i.Fragment,{children:["You wrote the row, then tried to publish — and the broker was down. Now the database has the order, nobody knows. The transactional outbox solves this by writing the event to the ",i.jsx("em",{children:"same DB transaction"})," as the business state change. A separate relay reads from the outbox and publishes."]}),sections:[{heading:"The dual-write problem",body:i.jsxs(i.Fragment,{children:[i.jsx("p",{children:"Two systems, two writes. There's no atomic transaction spanning your DB and your message broker, so failure of one after success of the other leaves them inconsistent. Retries help, but the service might crash between the two writes, so even retry isn't enough."}),i.jsxs("p",{children:["The outbox flips the problem: only one transaction, on the DB. The event sits in an ",i.jsx("code",{children:"outbox"})," table next to the business data, atomically committed. A relay (a poller or change-data-capture stream) drains it."]})]})},{heading:"Implementation flavours",body:i.jsxs("ul",{children:[i.jsxs("li",{children:[i.jsx("strong",{children:"Polling relay"})," — the relay queries ",i.jsx("code",{children:"SELECT * FROM outbox WHERE published_at IS NULL"})," on a tight loop, publishes, marks done. Simple, ~seconds of latency, hits the DB hard."]}),i.jsxs("li",{children:[i.jsx("strong",{children:"CDC stream"})," — Debezium, Postgres logical replication, or a CDC product reads the WAL and emits one event per outbox insert. Lower latency, no extra DB query load, more moving parts."]}),i.jsxs("li",{children:[i.jsx("strong",{children:"Transactional broker"})," — Kafka transactions or RabbitMQ confirms let you coordinate, but the broker must be available at write time. Outbox decouples that."]})]})}],takeaways:['Outbox is the standard answer to "how do I update a DB AND publish a message reliably?"',"Trade-off: you get at-least-once delivery, not exactly-once. Consumers must be idempotent — see the Ordering & Idempotency lesson.","The relay is the single point of failure to monitor. Watch outbox row age; it shouldn't keep growing.","Debezium + Postgres logical replication is the production-grade combo. Polling works fine to start."]}]};export{re as manifest};
