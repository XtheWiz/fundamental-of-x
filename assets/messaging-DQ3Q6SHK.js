import{j as b}from"./main-BMJeqOcY.js";import{L as R}from"./LegacyWidget-BJxFD61r.js";function D(s){const e={mode:"direct",consumerSpeedMs:300,sent:0,succeeded:0,failed:0,queued:0,queue:[],running:!1};s.innerHTML=`
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
  `;const a=s.querySelector("#wh-stage");s.querySelectorAll("input[name=wh-m]").forEach(i=>i.addEventListener("change",p=>{e.mode=p.target.value,n()})),s.querySelector("#wh-burst").addEventListener("click",t),s.querySelector("#wh-reset").addEventListener("click",n);function n(){e.sent=0,e.succeeded=0,e.failed=0,e.queue=[],e.queued=0,r()}async function t(){if(!e.running){e.running=!0,n();for(let i=0;i<20;i++){e.sent++;const p=i+1;e.mode==="direct"?e.queue.length>0?e.failed++:(e.queue.push(p),(async()=>(await m(e.consumerSpeedMs),e.queue.shift(),e.succeeded++,r()))()):e.queue.push(p),r(),await m(50)}for(;e.queue.length>0;)await m(e.consumerSpeedMs),e.queue.shift(),e.succeeded++,r();e.running=!1,c()}}function c(){e.mode==="direct"?s.querySelector("#wh-explain").innerHTML=`<strong>Direct mode</strong>: producer fires faster than consumer can handle → ${e.failed} requests rejected. In real systems this manifests as 503s or timeouts. Capacity is coupled.`:s.querySelector("#wh-explain").innerHTML=`<strong>Broker mode</strong>: all ${e.sent} orders made it. The queue absorbed the burst; the consumer drained it at its own pace. Producer didn't know or care.`}function r(){let o='<svg viewBox="0 0 720 200" width="100%" style="max-width: 720px">';if(o+=`<style>
      .wh-node { stroke: var(--ink); stroke-width: 2.5; }
      .wh-arr { stroke: var(--ink); stroke-width: 2; marker-end: url(#wh-arrow); }
      .wh-msg { fill: var(--accent); stroke: var(--ink); stroke-width: 1; }
    </style>`,o+='<defs><marker id="wh-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/></marker></defs>',o+='<rect class="wh-node" x="40" y="80" width="120" height="60" rx="6" fill="#cfe5ff"/>',o+='<text class="msg-label" x="100" y="110" text-anchor="middle">PRODUCER</text>',o+='<text class="msg-sub" x="100" y="128" text-anchor="middle">orders/sec ≈ 20</text>',e.mode==="broker"){o+='<rect class="wh-node" x="260" y="60" width="240" height="100" rx="6" fill="var(--accent-soft)"/>',o+='<text class="msg-label" x="380" y="82" text-anchor="middle">BROKER (queue)</text>',o+=`<text class="msg-sub" x="380" y="98" text-anchor="middle">${e.queue.length} pending</text>`;const u=10;e.queue.slice(0,u).forEach((d,v)=>{const g=280+v*22;o+=`<rect class="wh-msg" x="${g}" y="115" width="18" height="30" rx="2"/>`,o+=`<text x="${g+9}" y="134" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px; fill: white;">${d}</text>`}),e.queue.length>u&&(o+=`<text class="msg-sub" x="${280+u*22+10}" y="134">+${e.queue.length-u}</text>`),o+='<line class="wh-arr" x1="160" y1="110" x2="258" y2="110"/>',o+='<line class="wh-arr" x1="500" y1="110" x2="598" y2="110"/>'}else o+='<line class="wh-arr" x1="160" y1="110" x2="598" y2="110"/>',o+='<text class="msg-sub" x="380" y="100" text-anchor="middle">direct HTTP call</text>';o+='<rect class="wh-node" x="600" y="80" width="120" height="60" rx="6" fill="#c8f0c8"/>',o+='<text class="msg-label" x="660" y="110" text-anchor="middle">CONSUMER</text>',o+='<text class="msg-sub" x="660" y="128" text-anchor="middle">~3 orders/sec</text>',o+="</svg>",a.innerHTML=o,s.querySelector("#m-sent").textContent=e.sent,s.querySelector("#m-ok").textContent=e.succeeded,s.querySelector("#m-fail").textContent=e.failed,s.querySelector("#m-q").textContent=e.queue.length}function m(i){return new Promise(p=>setTimeout(p,i))}n()}function W(s){const e={partitions:4,consumersA:2,consumersB:1};s.innerHTML=`
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
  `,["p","a","b"].forEach(t=>{const c=s.querySelector("#tp-"+t),r=s.querySelector("#tp-"+t+"-val");c.addEventListener("input",m=>{const i=Number(m.target.value);r.textContent=i,t==="p"&&(e.partitions=i),t==="a"&&(e.consumersA=i),t==="b"&&(e.consumersB=i),n()})});function a(t){if(t===0)return new Array(e.partitions).fill(null);const c=new Array(e.partitions).fill(null);for(let r=0;r<e.partitions;r++)c[r]=r%t;return c}function n(){const r=e.partitions,m=680/Math.max(r,1);let i='<svg viewBox="0 0 760 360" width="100%" style="max-width: 760px">';i+=`<style>
      .tp-tube { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 2; }
      .tp-msg { fill: var(--accent); stroke: var(--ink); stroke-width: 1; }
      .tp-consumer { fill: #c8f0c8; stroke: var(--ink); stroke-width: 2.5; }
      .tp-consumer.idle { fill: #ddd; stroke-dasharray: 4 3; }
      .tp-line { stroke: var(--ink); stroke-width: 1.5; stroke-dasharray: 4 3; }
      .tp-line.a { stroke: #1c6dd0; }
      .tp-line.b { stroke: #7f4eb6; }
    </style>`,i+='<text class="msg-label" x="20" y="22">TOPIC: orders</text>',i+=`<text class="msg-sub" x="20" y="40">${r} partition(s)</text>`;const p=50;for(let d=0;d<r;d++){const v=40+d*m;i+=`<rect class="tp-tube" x="${v}" y="${p}" width="${m-8}" height="50" rx="4"/>`,i+=`<text class="msg-sub" x="${v+(m-8)/2}" y="${p-4}" text-anchor="middle">P${d}</text>`;for(let g=0;g<4;g++){const f=v+6+g*18;i+=`<rect class="tp-msg" x="${f}" y="${p+14}" width="14" height="22" rx="2"/>`}}const o=180;i+=`<text class="msg-label" x="20" y="${o-30}">GROUP A (group.id = "emailer")</text>`,i+=`<text class="msg-sub" x="20" y="${o-14}">${e.consumersA} consumer(s) — partitions split across them</text>`;const u=a(e.consumersA);for(let d=0;d<e.consumersA;d++){const v=40+d*130;i+=`<rect class="tp-consumer" x="${v}" y="${o}" width="110" height="50" rx="6"/>`,i+=`<text class="msg-label" x="${v+55}" y="${o+22}" text-anchor="middle">A-${d}</text>`;const g=u.map((f,h)=>f===d?h:null).filter(f=>f!==null);i+=`<text class="msg-sub" x="${v+55}" y="${o+40}" text-anchor="middle">P: ${g.length?g.join(","):"(idle)"}</text>`,g.forEach(f=>{const h=40+f*m+(m-8)/2;i+=`<line class="tp-line a" x1="${h}" y1="${p+50}" x2="${v+55}" y2="${o}"/>`})}if(e.consumersA>r)for(let d=r;d<e.consumersA;d++){const v=40+d*130;i+=`<rect class="tp-consumer idle" x="${v}" y="${o}" width="110" height="50" rx="6"/>`,i+=`<text class="msg-label" x="${v+55}" y="${o+22}" text-anchor="middle">A-${d}</text>`,i+=`<text class="msg-sub" x="${v+55}" y="${o+40}" text-anchor="middle">IDLE</text>`}if(e.consumersB>0){i+='<text class="msg-label" x="20" y="276">GROUP B (group.id = "analytics") — independent stream</text>';const v=a(e.consumersB);for(let g=0;g<e.consumersB;g++){const f=40+g*130;i+=`<rect class="tp-consumer" x="${f}" y="290" width="110" height="50" rx="6" fill="#cfe5ff"/>`,i+=`<text class="msg-label" x="${f+55}" y="312" text-anchor="middle">B-${g}</text>`;const h=v.map((k,y)=>k===g?y:null).filter(k=>k!==null);i+=`<text class="msg-sub" x="${f+55}" y="330" text-anchor="middle">P: ${h.length?h.join(","):"(idle)"}</text>`,h.forEach(k=>{const y=40+k*m+(m-8)/2;i+=`<line class="tp-line b" x1="${y}" y1="${p+50}" x2="${f+55}" y2="290"/>`})}}i+="</svg>",s.querySelector("#tp-stage").innerHTML=i;let l;e.consumersA>r?l=`<strong>${e.consumersA-r} consumer(s) idle in Group A.</strong> Partitions are the max parallelism unit — extra consumers just stand around. Add more partitions or fewer consumers.`:e.consumersA===r?l="Perfect 1-to-1: each consumer in Group A gets one partition. Maximum parallelism, no idle workers.":l=`Each consumer in Group A handles ~${(r/e.consumersA).toFixed(1)} partitions. Throughput per consumer scales with how many it owns.`,e.consumersB>0&&(l+=" Group B reads the same topic <em>independently</em> — its consumers also see every message."),s.querySelector("#tp-explain").innerHTML=l}n()}const C=["at-most-once","at-least-once","exactly-once"],P={none:{label:"No failures",crashPoint:null},preAck:{label:"Consumer crashes BEFORE acking",crashPoint:"before-ack"},postAck:{label:"Consumer crashes AFTER processing but BEFORE acking",crashPoint:"after-process"},netLost:{label:"Network drops the ack",crashPoint:"ack-lost"}};function B(s,e){let a=0,n=!1,t=!1,c=!1;return e==="none"?a=1:e==="preAck"?s==="at-most-once"?(a=0,n=!0):a=1:e==="postAck"?s==="at-most-once"?a=1:s==="at-least-once"?(a=2,t=!0):s==="exactly-once"&&(a=1):e==="netLost"&&(s==="at-most-once"?a=1:(a=2,t=!0,c=!0,s==="exactly-once"&&(a=1))),{processed:a,lost:n,duplicated:t,lostAck:c}}function O(s){let e="at-least-once",a="none";s.innerHTML=`
    <div class="widget">
      <div class="widget-title">Send one message, choose your guarantee</div>

      <div class="controls">
        <label>Semantic:</label>
        <div class="pill-group">
          ${C.map((t,c)=>`
            <input type="radio" name="dv-s" id="dv-${c}" value="${t}" ${t==="at-least-once"?"checked":""}>
            <label for="dv-${c}">${t}</label>
          `).join("")}
        </div>
      </div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="dv-scen" style="min-width: 320px;">
          ${Object.entries(P).map(([t,c])=>`<option value="${t}">${c.label}</option>`).join("")}
        </select>
      </div>

      <div class="widget-stage" id="dv-stage" style="min-height: 240px;"></div>

      <div class="callout" id="dv-explain"></div>
    </div>
  `,s.querySelectorAll("input[name=dv-s]").forEach(t=>t.addEventListener("change",c=>{e=c.target.value,n()})),s.querySelector("#dv-scen").addEventListener("change",t=>{a=t.target.value,n()});function n(){const t=B(e,a);let c=`
      <div class="dv-result">
        <div class="dv-block ${t.lost?"bad":"good"}">
          <div class="dv-block-label">DELIVERED</div>
          <div class="dv-block-value">${t.lost?"0 ✗ LOST":t.processed>0?"1+ ✓":"0"}</div>
        </div>
        <div class="dv-block ${t.processed>1?"bad":"good"}">
          <div class="dv-block-label">PROCESSED COUNT</div>
          <div class="dv-block-value">${t.processed}× ${t.duplicated?"— ⚠ DUPLICATE":""}</div>
        </div>
        <div class="dv-block">
          <div class="dv-block-label">EFFECT</div>
          <div class="dv-block-value">${t.lost?"lost":t.duplicated&&e!=="exactly-once"?"duplicate":"exactly once ✓"}</div>
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
    `;s.querySelector("#dv-stage").innerHTML=c;let r;t.lost?r="<strong>Lost.</strong> The message never reached an alive consumer. At-most-once accepts this as the cost of doing business.":t.processed>1&&e==="at-least-once"?r="<strong>Duplicated.</strong> The broker redelivered after the failure; the consumer ran twice. To avoid app-level harm, consumers should be idempotent (next lesson).":t.processed===1&&e==="exactly-once"?r="<strong>Exactly once.</strong> The consumer received the message twice but deduped by ID. App sees one effect.":r="<strong>Single processing.</strong> No retries needed; the happy path.",s.querySelector("#dv-explain").innerHTML=r}n()}const $=[{id:"evt-1",op:"credit",amount:100},{id:"evt-2",op:"credit",amount:50},{id:"evt-2",op:"credit",amount:50},{id:"evt-3",op:"debit",amount:30}];function H(s){let e=!1;s.innerHTML=`
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
  `,s.querySelector("#or-idem").addEventListener("change",t=>{e=t.target.checked}),s.querySelector("#or-run").addEventListener("click",a),s.querySelector("#or-reset").addEventListener("click",()=>n([]));function a(){const t=[];let c=0;const r=new Set;$.forEach((m,i)=>{if(e&&r.has(m.id)){t.push({...m,action:"skipped (already processed)",balanceBefore:c,balanceAfter:c});return}const p=c;m.op==="credit"?c+=m.amount:c-=m.amount,r.add(m.id),t.push({...m,action:"applied",balanceBefore:p,balanceAfter:c})}),n(t)}function n(t){let c=`
      <div class="or-stream">
        ${$.map((r,m)=>{const i=t[m];let p="or-msg";return i?i.action==="skipped (already processed)"?p+=" skipped":p+=" applied":p+=" pending",`<div class="${p}">
            <div class="or-msg-id">${r.id}${m===2?" ↻":""}</div>
            <div class="or-msg-op">${r.op} ${r.amount}</div>
            ${i?`<div class="or-msg-action">${i.action}</div><div class="or-msg-balance">balance: ${i.balanceBefore} → ${i.balanceAfter}</div>`:""}
          </div>`}).join("")}
      </div>
      ${t.length?`<div class="or-final"><strong>Final balance: ${t[t.length-1].balanceAfter}</strong> (expected: 120 — credit 100 + credit 50 - debit 30)</div>`:""}
      <style>
        .or-stream { display: grid; grid-template-columns: repeat(${$.length}, 1fr); gap: 0.4rem; }
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
    `;if(s.querySelector("#or-stage").innerHTML=c,t.length){const r=t[t.length-1].balanceAfter;r===120?s.querySelector("#or-explain").innerHTML="<strong>Correct balance.</strong> The duplicate of evt-2 was deduped by ID. Idempotent consumers handle the at-least-once world gracefully.":s.querySelector("#or-explain").innerHTML=`<strong>Wrong! Balance is ${r} instead of 120.</strong> The duplicate of evt-2 was applied twice. Without idempotency, the redelivery silently corrupted the data.`}}n([])}const S=10;function I(s){let e="queue";s.innerHTML=`
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
  `,s.querySelectorAll("input[name=qs-m]").forEach(n=>n.addEventListener("change",t=>{e=t.target.value,a()}));function a(){const n=["#cfe5ff","#c8f0c8","#ffe9b3"],t=[];if(e==="queue")for(let r=0;r<S;r++)t.push({msgId:r+1,consumer:r%3});else for(let r=0;r<S;r++)t.push({msgId:r+1,consumer:"all"});let c=`
      <div class="qs-section">
        <div class="qs-label">${e==="queue"?"WORK QUEUE (each message goes to ONE worker)":"STREAM / LOG (each consumer sees ALL messages)"}</div>
        <div class="qs-msgs">
          ${t.map(r=>(r.consumer==="all"?n.map(m=>`border-top: 4px solid ${m};`).join(""):`${n[r.consumer]}`,`<div class="qs-msg" style="${r.consumer==="all"?"background: var(--paper)":`background: ${n[r.consumer]}`};">
              <div class="qs-msg-id">m${r.msgId}</div>
              <div class="qs-msg-tags">${r.consumer==="all"?n.map((m,i)=>`<span class="qs-tag" style="background:${m}">C${i+1}</span>`).join(""):`<span class="qs-tag" style="background:${n[r.consumer]}">C${r.consumer+1}</span>`}</div>
            </div>`)).join("")}
        </div>
      </div>
      <div class="qs-consumers">
        ${[0,1,2].map(r=>{const m=e==="queue"?t.filter(i=>i.consumer===r).map(i=>"m"+i.msgId):t.map(i=>"m"+i.msgId);return`<div class="qs-consumer" style="background: ${n[r]};">
            <div class="qs-consumer-name">Consumer C${r+1}</div>
            <div class="qs-consumer-msgs">received: ${m.length?m.join(", "):"(nothing)"}</div>
          </div>`}).join("")}
      </div>

      <style>
        .qs-section { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; margin-bottom: 0.6rem; }
        .qs-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.85rem; margin-bottom: 0.4em; }
        .qs-msgs { display: grid; grid-template-columns: repeat(${S}, 1fr); gap: 0.25rem; }
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
    `;s.querySelector("#qs-stage").innerHTML=c,s.querySelector("#qs-explain").innerHTML=e==="queue"?"<strong>Work queue.</strong> Each message goes to exactly one consumer. Total work split 3 ways. Once consumed, the message is gone — no replay possible.":"<strong>Stream.</strong> All 3 consumers see all 10 messages, independently. Tomorrow you can add C4, rewind to offset 0, and it gets every message from the beginning."}a()}const j={buffer:"Buffer (unlimited)",drop:"Drop oldest at capacity",bp:"Backpressure (slow producer)",fail:"Fail (reject producer)"},q=10,T=3,w=30;function Q(s){let e="buffer";const a={queue:0,sent:0,processed:0,dropped:0,throttled:0,failed:0,series:[],running:!1};s.innerHTML=`
    <div class="widget">
      <div class="widget-title">Producer ${q}/sec, Consumer ${T}/sec, buffer cap ${w}</div>

      <div class="controls">
        <label>Overflow policy:</label>
        <select class="field" id="bp-pol">
          ${Object.entries(j).map(([i,p])=>`<option value="${i}">${p}</option>`).join("")}
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
  `,s.querySelector("#bp-pol").addEventListener("change",i=>{e=i.target.value,n()}),s.querySelector("#bp-run").addEventListener("click",t),s.querySelector("#bp-reset").addEventListener("click",n);function n(){a.queue=0,a.sent=0,a.processed=0,a.dropped=0,a.throttled=0,a.failed=0,a.series=[],r()}async function t(){if(a.running)return;a.running=!0,n();const i=15;for(let p=0;p<i;p++){let o=q;e==="bp"&&a.queue>=w*.7&&(o=Math.max(T,Math.floor(q*.4)),a.throttled+=q-o);for(let l=0;l<o;l++)a.sent++,a.queue>=w?e==="drop"?a.dropped++:e==="fail"?a.failed++:a.queue++:a.queue++;const u=Math.min(T,a.queue);a.queue-=u,a.processed+=u,a.series.push({t:p,queue:a.queue}),r(),await m(220)}a.running=!1,c()}function c(){e==="buffer"?s.querySelector("#bp-explain").innerHTML=`<strong>Unbounded buffer.</strong> Queue grew to ${a.queue}. Eventually you run out of disk; latency for new messages is the queue depth × processing time. Most Kafka deployments live here.`:e==="drop"?s.querySelector("#bp-explain").innerHTML=`<strong>${a.dropped} messages dropped.</strong> Producer kept its rate, but the broker discarded what wouldn't fit. Use for lossy data (metrics, telemetry); never for important events.`:e==="bp"?s.querySelector("#bp-explain").innerHTML=`<strong>Producer throttled ${a.throttled} messages.</strong> Queue stayed near the limit, producer slowed to match consumer. Zero data lost; producer pays the price.`:s.querySelector("#bp-explain").innerHTML=`<strong>${a.failed} sends rejected.</strong> Producer got errors and must handle them — typically retry-with-backoff. Loud failure, no data lost <em>if</em> the producer retries correctly.`}function r(){let o='<svg viewBox="0 0 720 200" width="100%" style="max-width: 720px">';o+=`<style>
      .bp-axis { stroke: var(--ink-soft); stroke-width: 1; }
      .bp-axis-text { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .bp-bar { fill: var(--accent); }
      .bp-bar.over { fill: #f7c8c8; stroke: var(--accent); stroke-width: 1.5; }
      .bp-limit { stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 4 3; }
      .bp-limit-text { font-family: var(--font-mono); font-size: 11px; fill: var(--accent); }
    </style>`;const u=50,l=700,d=170,v=20,g=Math.max(w*1.2,...a.series.map(y=>y.queue),10);o+=`<line class="bp-axis" x1="${u}" y1="${d}" x2="${l}" y2="${d}"/>`,o+=`<line class="bp-axis" x1="${u}" y1="${v}" x2="${u}" y2="${d}"/>`,o+=`<text class="bp-axis-text" x="${u-5}" y="${d+4}" text-anchor="end">0</text>`,o+=`<text class="bp-axis-text" x="${u-5}" y="${v+4}" text-anchor="end">${Math.round(g)}</text>`;const f=d-w/g*(d-v);o+=`<line class="bp-limit" x1="${u}" y1="${f}" x2="${l}" y2="${f}"/>`,o+=`<text class="bp-limit-text" x="${l}" y="${f-4}" text-anchor="end">buffer cap = ${w}</text>`;const h=15,k=(l-u)/h-2;a.series.forEach(y=>{const A=u+y.t*(l-u)/h+1,L=y.queue/g*(d-v),M=y.queue>=w;o+=`<rect class="bp-bar ${M?"over":""}" x="${A}" y="${d-L}" width="${k}" height="${L}"/>`}),o+="</svg>",s.querySelector("#bp-stage").innerHTML=o,s.querySelector("#m-sent").textContent=a.sent,s.querySelector("#m-proc").textContent=a.processed,s.querySelector("#m-drop").textContent=a.dropped+a.failed,s.querySelector("#m-q").textContent=a.queue}function m(i){return new Promise(p=>setTimeout(p,i))}n()}const F=[{id:"m1",poison:!1},{id:"m2",poison:!1},{id:"m3",poison:!0},{id:"m4",poison:!1},{id:"m5",poison:!1}];function z(s){let e=3,a="expo";const n={delivered:[],dlq:[],timeline:[],running:!1};s.innerHTML=`
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
  `,s.querySelector("#dl-r").addEventListener("input",u=>{e=Number(u.target.value),s.querySelector("#dl-r-val").textContent=e}),s.querySelectorAll("input[name=dl-b]").forEach(u=>u.addEventListener("change",l=>{a=l.target.value})),s.querySelector("#dl-run").addEventListener("click",r),s.querySelector("#dl-reset").addEventListener("click",t);function t(){n.delivered=[],n.dlq=[],n.timeline=[],i()}function c(u){return a==="none"?0:a==="linear"?u*1e3:Math.pow(2,u-1)*1e3}async function r(){if(n.running)return;n.running=!0,t();let u=0;for(const l of F){let d=0,v=!1;for(;d<=e;){d++;const g=l.poison;if(n.timeline.push({t:u,id:l.id,attempt:d,result:g?"fail":"ok"}),i(),await o(180),!g){n.delivered.push({id:l.id,attempts:d}),v=!0,u+=100;break}const f=c(d);d<=e&&(n.timeline.push({t:u+50,id:l.id,attempt:d,result:"backoff",wait:f}),i(),await o(Math.min(280,80+f/50))),u+=200+f}v||(n.dlq.push({id:l.id,attempts:d}),n.timeline.push({t:u,id:l.id,attempt:"dlq",result:"dlq"}),i(),u+=100)}n.running=!1,m()}function m(){const u=n.timeline.filter(d=>d.id==="m3"&&(d.result==="ok"||d.result==="fail")).length,l=n.dlq.find(d=>d.id==="m3");e===0?s.querySelector("#dl-explain").innerHTML="<strong>No retries.</strong> m3 failed once and went straight to DLQ. Fast, but you've given up on transient failures too.":l?s.querySelector("#dl-explain").innerHTML=`<strong>m3 retried ${u} times, then quarantined.</strong> The line kept moving — m4 and m5 weren't blocked. DLQ now has 1 message for human review.`:s.querySelector("#dl-explain").innerHTML="<strong>m3 went poisonous before retries ran out.</strong> In a real system you'd see it eventually reach the DLQ. The poison message can\\'t be made to succeed."}function i(){let u=`
      <div class="dl-grid">
        <div class="dl-panel">
          <div class="dl-panel-label">DELIVERED (${n.delivered.length})</div>
          ${n.delivered.length?n.delivered.map(l=>`<div class="dl-msg ok">${l.id} <span class="dl-sub">${l.attempts} attempt${l.attempts>1?"s":""}</span></div>`).join(""):'<div class="dl-empty">none yet</div>'}
        </div>
        <div class="dl-panel">
          <div class="dl-panel-label">DEAD LETTER QUEUE (${n.dlq.length})</div>
          ${n.dlq.length?n.dlq.map(l=>`<div class="dl-msg bad">${l.id} <span class="dl-sub">${l.attempts} attempts</span></div>`).join(""):'<div class="dl-empty">empty 🎉</div>'}
        </div>
      </div>

      <div class="dl-tl">
        <div class="dl-tl-label">RETRY TIMELINE</div>
        ${n.timeline.slice(-30).map(l=>{const d=l.result==="ok"?"ok":l.result==="fail"?"fail":l.result==="dlq"?"dlq":"bo",v=l.result==="ok"?`${l.id}: attempt ${l.attempt} ✓`:l.result==="fail"?`${l.id}: attempt ${l.attempt} ✗`:l.result==="dlq"?`${l.id} → DLQ`:`${l.id}: wait ${l.wait}ms`;return`<div class="dl-tl-row ${d}">${p(v)}</div>`}).join("")}
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
    `;s.querySelector("#dl-stage").innerHTML=u}function p(u){return String(u).replace(/[&<>"']/g,l=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[l])}function o(u){return new Promise(l=>setTimeout(l,u))}t()}const E={kafka:{label:"Kafka",sub:"Distributed log",profile:[{dim:"Shape",val:"Stream (log)",link:"queues-vs-streams"},{dim:"Throughput",val:"Millions/sec, huge clusters"},{dim:"Delivery",val:"At-least-once; exactly-once via transactions",link:"delivery"},{dim:"Ordering",val:"Per-partition",link:"ordering"},{dim:"Retention",val:"Hours to forever (config)"},{dim:"Backpressure",val:"Disk-based buffering; consumers track offsets",link:"backpressure"},{dim:"DLQ",val:'Manual (write to a "deadletter" topic)',link:"dlq-retries"},{dim:"Ops cost",val:"High — needs care, monitoring, capacity planning"}],use:"Event streaming, analytics, CDC, log aggregation. When you need to replay and many consumers care."},rabbitmq:{label:"RabbitMQ",sub:"Smart broker, work queues + routing",profile:[{dim:"Shape",val:"Work queue (Streams add-on for log)",link:"queues-vs-streams"},{dim:"Throughput",val:"Tens of thousands/sec per node"},{dim:"Delivery",val:"At-most-once or at-least-once via acks",link:"delivery"},{dim:"Ordering",val:"Per-queue (sort of)"},{dim:"Retention",val:"Until consumed"},{dim:"Backpressure",val:"Built-in flow control + memory watermarks",link:"backpressure"},{dim:"DLQ",val:"Native dead-letter exchanges",link:"dlq-retries"},{dim:"Ops cost",val:"Medium — well-trodden, simpler than Kafka"}],use:'Task queues, RPC, complex routing. Pre-Kafka enterprise messaging. Still excellent for "send this email" workloads.'},sqs:{label:"AWS SQS",sub:"Boring, reliable, managed",profile:[{dim:"Shape",val:"Work queue (standard or FIFO)",link:"queues-vs-streams"},{dim:"Throughput",val:"Effectively unlimited (standard); 3000/s (FIFO)"},{dim:"Delivery",val:"At-least-once (standard); exactly-once (FIFO, capped)",link:"delivery"},{dim:"Ordering",val:"No (standard); per-group (FIFO)",link:"ordering"},{dim:"Retention",val:"14 days max"},{dim:"Backpressure",val:"Pull-based; producers always succeed if quota",link:"backpressure"},{dim:"DLQ",val:"Built-in; configure max receives → DLQ",link:"dlq-retries"},{dim:"Ops cost",val:"Near zero. AWS runs it."}],use:"AWS-resident task queues. Decoupling Lambdas. When you do not want to operate a broker at all."},nats:{label:"NATS / JetStream",sub:"Lightweight, low-latency",profile:[{dim:"Shape",val:"Pub/sub (core); streams (JetStream)",link:"queues-vs-streams"},{dim:"Throughput",val:"Millions/sec; sub-ms latency"},{dim:"Delivery",val:"At-most-once (core); at-least-once (JetStream)",link:"delivery"},{dim:"Ordering",val:"Per-subject in JetStream",link:"ordering"},{dim:"Retention",val:"Configurable (count, age, size)"},{dim:"Backpressure",val:"Drop-by-default in core; flow control in JetStream",link:"backpressure"},{dim:"DLQ",val:"Via max-deliver + separate stream",link:"dlq-retries"},{dim:"Ops cost",val:"Low. Single binary, simple cluster."}],use:"Microservice request/reply, edge devices, IoT, where Kafka feels heavy. CNCF graduated; rapidly growing."},redis:{label:"Redis Streams",sub:"Already-deployed Redis as a broker",profile:[{dim:"Shape",val:"Stream (log) with consumer groups",link:"queues-vs-streams"},{dim:"Throughput",val:"Hundreds of thousands/sec"},{dim:"Delivery",val:"At-least-once; ACK-based",link:"delivery"},{dim:"Ordering",val:"Per-stream",link:"ordering"},{dim:"Retention",val:"Configurable; in-memory by default"},{dim:"Backpressure",val:"MAXLEN policies + manual",link:"backpressure"},{dim:"DLQ",val:"Manual via XCLAIM + idle detection",link:"dlq-retries"},{dim:"Ops cost",val:"Low if you already run Redis; pay for it twice if not"}],use:"You already use Redis. Small-to-medium scale streaming without bringing in another system."}},N={"queues-vs-streams":"Queues vs Streams",delivery:"Delivery Semantics",ordering:"Ordering & Idempotency",backpressure:"Backpressure","dlq-retries":"DLQ & Retries"};function K(s){let e="kafka";s.innerHTML=`
    <div class="widget">
      <div class="widget-title">Five brokers, same primitives</div>

      <div class="controls">
        <div class="pill-group">
          ${Object.entries(E).map(([t,c],r)=>`
            <input type="radio" name="ma-s" id="ma-${t}" value="${t}" ${r===0?"checked":""}>
            <label for="ma-${t}">${c.label.split(" /")[0]}</label>
          `).join("")}
        </div>
      </div>

      <div class="widget-stage" id="ma-stage" style="min-height: 380px;"></div>

      <div class="callout" id="ma-note"></div>
    </div>
  `,s.querySelectorAll("input[name=ma-s]").forEach(t=>t.addEventListener("change",c=>{e=c.target.value,a()}));function a(){const t=E[e];let c=`
      <div class="ma-title">${n(t.label)}</div>
      <div class="ma-sub">${n(t.sub)}</div>
      <div class="ma-grid">
        ${t.profile.map(r=>`
          <div class="ma-row">
            <div class="ma-dim">${n(r.dim)}</div>
            <div class="ma-val">
              ${n(r.val)}
              ${r.link?`<a class="ma-link" href="${r.link}.html" title="${n(N[r.link])}">→</a>`:""}
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
    `;s.querySelector("#ma-stage").innerHTML=c,s.querySelector("#ma-note").innerHTML=t.use}function n(t){return String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c])}a()}const x=s=>()=>b.jsx(R,{init:s}),G={slug:"messaging",title:"Messaging",intro:b.jsx(b.Fragment,{children:"Eight lessons on brokers, queues, topics, partitions, and the patterns behind Kafka, RabbitMQ, SQS, NATS — the systems that decouple producers from consumers."}),lessons:[{slug:"why",number:"01",title:"Why Messaging?",blurb:"Two services, one network. Why a message broker between them changes everything about failure, scale, and back-pressure.",Widget:x(D),intro:b.jsx(b.Fragment,{children:"Direct service-to-service calls couple producer to consumer in time and availability. A broker in the middle decouples them: producer keeps going even when consumer is down."}),sections:[],takeaways:["Sync call: producer blocks until consumer responds. One slow consumer = slow producer.","Async via broker: producer fires-and-forgets, consumer drains the queue at its own pace.","Decoupling in time means decoupling in availability.","Cost: an extra moving part to operate, monitor, and reason about."]},{slug:"topics-partitions",number:"02",title:"Topics, Partitions & Consumer Groups",blurb:"The Kafka mental model. Producers append to a topic; partitions split the work; consumer groups share the load.",Widget:x(W),intro:b.jsx(b.Fragment,{children:"Topics hold messages. Partitions parallelize them. Consumer groups divide partitions among workers so the same topic can be processed by many consumers at once."}),sections:[],takeaways:["Partition = unit of parallelism. More partitions = more consumers can work in parallel.","Each partition is consumed by at most one consumer in a group.","Ordering is per-partition, not per-topic.","Adding consumers beyond the partition count just leaves them idle."]},{slug:"delivery",number:"03",title:"Delivery Semantics",blurb:"At-most-once, at-least-once, exactly-once. The three answers your broker can give, ranked by cost.",Widget:x(O),intro:b.jsx(b.Fragment,{children:"What guarantee does the broker make about message delivery? Each level fixes one failure mode at the cost of more overhead."}),sections:[],takeaways:["At-most-once: fast, may lose messages on crash.","At-least-once: never loses, may duplicate. The pragmatic default.","Exactly-once: requires coordination + idempotent consumers. Available in Kafka with effort.",'Most "exactly-once" claims are at-least-once + idempotent consumer.']},{slug:"ordering",number:"04",title:"Ordering & Idempotency",blurb:"Ordering is only guaranteed within a partition. So consumers must be idempotent.",Widget:x(H),intro:b.jsx(b.Fragment,{children:"Across partitions, messages can interleave any way. If your business logic needs ordering, pin related messages to the same partition by key."}),sections:[],takeaways:["Use a partition key (user ID, order ID) to keep related messages ordered.","Idempotent consumers: processing the same message twice = same result.",'Dedup via a "seen" set or transactional outbox.',"Ordering across partitions requires a single-threaded consumer — losing parallelism."]},{slug:"queues-vs-streams",number:"05",title:"Queues vs Streams",blurb:`RabbitMQ's work queue and Kafka's log are two different shapes. Same word "messaging," very different mechanics.`,Widget:x(I),intro:b.jsx(b.Fragment,{children:"A queue deletes messages once consumed. A stream keeps them around and lets consumers seek. Different problems, different tools."}),sections:[],takeaways:["Queue: message is owned by one consumer, then gone. Good for work distribution.","Stream: append-only log, many consumers can read independently. Good for event sourcing.","Kafka, Kinesis, Redis Streams = streams. RabbitMQ, SQS = queues.","You can fake one with the other but it hurts."]},{slug:"backpressure",number:"06",title:"Backpressure & Flow Control",blurb:"Producer at 10k/s, consumer at 1k/s. Where do the extra messages go?",Widget:x(Q),intro:b.jsx(b.Fragment,{children:"When producers outpace consumers, you must buffer, drop, slow down, or fail. Pick the strategy upfront — defaults are usually wrong."}),sections:[],takeaways:["Buffer: works until the buffer fills. Then what?","Drop: fast but loses messages. Only safe if you can tolerate it.","Slow down the producer: cleanest, but the producer needs to handle it.","Fail: surface the problem early instead of silently degrading."]},{slug:"dlq-retries",number:"07",title:"Dead Letter Queues & Retries",blurb:"A consumer keeps failing on the same message. Retry forever? Skip it? Quarantine it.",Widget:x(z),intro:b.jsx(b.Fragment,{children:"Some messages are poison. Retrying forever blocks the queue; skipping silently loses data. DLQs move bad messages aside for human inspection."}),sections:[],takeaways:["Retry with exponential backoff for transient failures.","After N retries, move to a DLQ — don't block the main pipeline.","DLQ messages need a human or alert; otherwise they pile up forever.","Always log the cause when moving to DLQ — context is lost otherwise."]},{slug:"architectures",number:"08",title:"Architectures in Practice",blurb:"Kafka, RabbitMQ, SQS, NATS, Redis Streams — how the same primitives compose into very different products.",Widget:x(K),intro:b.jsx(b.Fragment,{children:"Five popular brokers, five different sweet spots. Knowing which one fits the workload up-front saves you from a re-platform later."}),sections:[],takeaways:["Kafka: high throughput, replay, durable. Heavy ops.","RabbitMQ: flexible routing, smaller scale, easy to start.","SQS: fully managed, simple, AWS-locked.","NATS: low latency, lightweight. Redis Streams: in-memory speed but not durable by default."]}]};export{G as manifest};
