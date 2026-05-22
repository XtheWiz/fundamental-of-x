import{j as b}from"./main-Ds-YDU3R.js";import{L as O}from"./LegacyWidget-xvrQRn42.js";const $=["F","D","E","M","W"],R=["Fetch","Decode","Execute","Memory","Writeback"],C={ideal:{label:"Ideal (no hazards)",instructions:["ADD r1, r2, r3","SUB r4, r5, r6","MUL r7, r8, r9","LD  r10, [r11]","XOR r12, r13, r14"],stalls:[]},hazard:{label:"Data hazard (instr 3 needs instr 2)",instructions:["ADD r1, r2, r3","LD  r4, [r5]","ADD r6, r4, r1","SUB r7, r8, r9","XOR r10, r11, r12"],stalls:[{instr:2,bubbles:1}]}};function _(t){let e="ideal",d=0;const l=12;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">5-stage pipeline</div>

      <div class="controls">
        <label>Scenario:</label>
        <div class="pill-group">
          <input type="radio" name="pp-scen" id="pp-ideal" value="ideal" checked>
          <label for="pp-ideal">Ideal</label>
          <input type="radio" name="pp-scen" id="pp-haz" value="hazard">
          <label for="pp-haz">Data hazard</label>
        </div>
        <button class="btn btn-accent" id="pp-next">Next cycle →</button>
        <button class="btn" id="pp-run">Run to end</button>
        <button class="btn btn-ghost" id="pp-reset">Reset</button>
      </div>

      <div class="widget-stage" id="pp-stage" style="min-height: 320px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Cycle</div><div class="value" id="m-cyc">0</div></div>
        <div class="metric"><div class="label">Completed</div><div class="value" id="m-done">0</div></div>
        <div class="metric accent"><div class="label">IPC</div><div class="value" id="m-ipc">—</div></div>
      </div>

      <div class="callout" id="pp-explain">
        Click "Next cycle →" to step. In the ideal scenario, all 5 instructions complete in 9 cycles (1 cycle + 4 to fill the pipe). The hazard scenario adds a stall.
      </div>
    </div>
  `;const a=t.querySelector("#pp-stage");t.querySelectorAll("input[name=pp-scen]").forEach(i=>i.addEventListener("change",s=>{e=s.target.value,d=0,o()})),t.querySelector("#pp-next").addEventListener("click",()=>{d<l&&d++,o()}),t.querySelector("#pp-run").addEventListener("click",async()=>{for(;d<l&&!v();)d++,o(),await c(220)}),t.querySelector("#pp-reset").addEventListener("click",()=>{d=0,o()});function r(i){const s=[],m=C[e];let f=0;for(const u of m.stalls)u.instr===i&&(f=u.bubbles);const p=i;for(let u=0;u<l;u++){if(u<p){s.push(null);continue}const h=u-p;let g;if(h<2)g=h;else if(h<2+f){s.push("STALL");continue}else g=h-f;let w=0;for(const P of m.stalls)P.instr<i&&(w+=P.bubbles);const y=h-w;if(y<0){s.push(null);continue}if(y<2)g=y;else if(y<2+f){s.push("STALL");continue}else g=y-f;g<$.length?s.push($[g]):s.push(null)}return s}function v(){const i=C[e];for(let s=0;s<i.instructions.length;s++){const m=r(s);let f=null;for(let p=0;p<=d&&p<l;p++)f=m[p]??f;if(f!=="W")return!1}return!0}function o(){const i=C[e];let s='<div class="pp-grid">';s+='<div class="pp-header pp-instr-label">instruction</div>';for(let f=0;f<l;f++)s+=`<div class="pp-header">${f+1}</div>`;let m=0;i.instructions.forEach((f,p)=>{s+=`<div class="pp-instr-label" title="${n(f)}"><code>${n(f)}</code></div>`;const u=r(p);for(let h=0;h<l;h++){const g=u[h];if(h>d-1)s+='<div class="pp-cell"></div>';else if(g===null)s+='<div class="pp-cell pp-empty"></div>';else if(g==="STALL")s+='<div class="pp-cell ca-stage-stall" title="pipeline stall">—</div>';else{const w=$.indexOf(g),y=["ca-stage-fetch","ca-stage-decode","ca-stage-exec","ca-stage-mem","ca-stage-wb"][w];s+=`<div class="pp-cell ${y}" title="${R[w]}">${g}</div>`,g==="W"&&h<=d-1&&m++}}}),s+="</div>",s+='<div class="pp-legend">',$.forEach((f,p)=>{s+=`<div class="pp-legend-item"><div class="pp-cell ${["ca-stage-fetch","ca-stage-decode","ca-stage-exec","ca-stage-mem","ca-stage-wb"][p]}" style="width: 26px; height: 26px;">${f}</div> ${R[p]}</div>`}),s+='<div class="pp-legend-item"><div class="pp-cell ca-stage-stall" style="width: 26px; height: 26px;">—</div> Stall</div>',s+="</div>",s+=`<style>
      .pp-grid { display: grid; grid-template-columns: 160px repeat(${l}, 1fr); gap: 2px; margin: 0.6rem 0; }
      .pp-header { font-family: var(--font-mono); font-size: 0.75rem; text-align: center; padding: 0.3em 0; color: var(--ink-soft); }
      .pp-instr-label { font-family: var(--font-mono); font-size: 0.75rem; padding: 0.4em 0.3em; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .pp-cell { font-family: var(--font-mono); font-size: 0.9rem; text-align: center; padding: 0.5em 0; border: 1.5px solid var(--ink); border-radius: 2px; min-width: 28px; }
      .pp-cell.pp-empty { border-style: dashed; background: var(--paper); opacity: 0.3; }
      .pp-legend { display: flex; gap: 0.8rem; flex-wrap: wrap; margin: 0.6rem 0 0; font-family: var(--font-mono); font-size: 0.8rem; }
      .pp-legend-item { display: flex; align-items: center; gap: 0.4em; }
    </style>`,a.innerHTML=s,t.querySelector("#m-cyc").textContent=d,t.querySelector("#m-done").textContent=m,t.querySelector("#m-ipc").textContent=d===0?"—":(m/d).toFixed(2),e==="hazard"&&d>=3&&d<=5?t.querySelector("#pp-explain").innerHTML="Instruction 3 needs <code>r4</code> — but <code>r4</code> is being loaded by instruction 2 and won't be ready until cycle 5. Pipeline stalls (bubble cycle) until then.":d>=9&&(t.querySelector("#pp-explain").innerHTML=`Done in <strong>${d} cycles</strong> for 5 instructions. ${e==="ideal"?"IPC ≈ 0.56 — ideal minus fill cost.":"One extra cycle of stall reduced IPC slightly."} Modern CPUs hide most stalls with bypass paths and out-of-order execution.`)}function n(i){return String(i).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s])}function c(i){return new Promise(s=>setTimeout(s,i))}o()}const k=[{id:"reg",label:"Register",ns:.3,size:"~200 bytes",color:"#c8f0c8"},{id:"l1",label:"L1 cache",ns:1,size:"~32 KB",color:"#cfe5ff"},{id:"l2",label:"L2 cache",ns:4,size:"~512 KB",color:"#cfe5ff"},{id:"l3",label:"L3 cache",ns:10,size:"~16 MB",color:"#ffe9b3"},{id:"ram",label:"RAM",ns:100,size:"~16 GB",color:"#ffe9b3"},{id:"ssd",label:"NVMe SSD",ns:1e5,size:"~1 TB",color:"#f7c8c8"},{id:"hdd",label:"Spinning disk",ns:1e7,size:"~4 TB",color:"#f7c8c8"},{id:"net",label:"Network RTT (same region)",ns:5e7,size:"internet",color:"#e6d6ff"}],F=1;function j(t){const e=t/F;return e<1?`${(e*1e3).toPrecision(2)} ms`:e<60?`${e.toPrecision(2)} sec`:e<3600?`${(e/60).toPrecision(2)} min`:e<86400?`${(e/3600).toPrecision(2)} hours`:e<86400*365?`${(e/86400).toPrecision(2)} days`:`${(e/(86400*365)).toPrecision(3)} years`}function U(t){let e="l1";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Latency at every tier</div>

      <div class="cc-tiers" id="cc-tiers"></div>

      <div class="cc-detail" id="cc-detail"></div>

      <div class="cc-strip" id="cc-strip"></div>

      <div class="callout" id="cc-explain"></div>

      <style>
        .cc-tiers { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.4rem; margin: 0.6rem 0; }
        .cc-tier {
          padding: 0.5rem 0.7rem; border: 2px solid var(--ink); border-radius: var(--radius);
          cursor: pointer; box-shadow: 2px 2px 0 var(--ink); transition: transform 0.12s, box-shadow 0.12s;
          text-align: left;
        }
        .cc-tier:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--ink); }
        .cc-tier.sel { box-shadow: 4px 4px 0 var(--accent); transform: translate(-2px, -2px); border-color: var(--accent); }
        .cc-tier-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 1rem; }
        .cc-tier-ns { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-soft); }
        .cc-tier-size { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); }
        .cc-detail {
          background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius);
          padding: 0.8rem 1rem; margin: 0.6rem 0;
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;
        }
        @media (max-width: 600px) { .cc-detail { grid-template-columns: 1fr; } }
        .cc-detail-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; }
        .cc-detail-value { font-family: var(--font-display); font-size: 1.5rem; letter-spacing: 0.04em; }
        .cc-strip {
          position: relative; height: 70px; background: linear-gradient(to right, #c8f0c8, #cfe5ff, #ffe9b3, #f7c8c8, #e6d6ff);
          border: 2px solid var(--ink); border-radius: var(--radius);
          margin: 0.8rem 0;
        }
        .cc-strip-marker { position: absolute; top: -8px; width: 2px; height: 86px; background: var(--ink); }
        .cc-strip-marker.sel { background: var(--accent); width: 3px; }
        .cc-strip-label { position: absolute; top: 76px; font-family: var(--font-mono); font-size: 0.65rem; transform: translateX(-50%); white-space: nowrap; color: var(--ink-soft); }
        .cc-strip-label.sel { color: var(--accent); font-weight: 600; }
        .cc-strip-axis { position: absolute; bottom: -16px; left: 0; right: 0; display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.65rem; color: var(--ink-soft); }
      </style>
    </div>
  `,d();function d(){const a=t.querySelector("#cc-tiers");a.innerHTML=k.map(s=>`
      <button class="cc-tier ${s.id===e?"sel":""}" data-id="${s.id}" style="background: ${s.color};">
        <div class="cc-tier-label">${s.label}</div>
        <div class="cc-tier-ns">${l(s.ns)}</div>
        <div class="cc-tier-size">${s.size}</div>
      </button>
    `).join(""),a.querySelectorAll("button").forEach(s=>s.addEventListener("click",()=>{e=s.dataset.id,d()}));const r=k.find(s=>s.id===e);t.querySelector("#cc-detail").innerHTML=`
      <div>
        <div class="cc-detail-label">Actual latency</div>
        <div class="cc-detail-value">${l(r.ns)}</div>
      </div>
      <div>
        <div class="cc-detail-label">Human-scale (L1 = 1 sec)</div>
        <div class="cc-detail-value">${j(r.ns)}</div>
      </div>
    `;const v=Math.log10(k[0].ns),n=Math.log10(k[k.length-1].ns)-v;let c="";k.forEach(s=>{const m=(Math.log10(s.ns)-v)/n*100,f=s.id===e;c+=`<div class="cc-strip-marker ${f?"sel":""}" style="left: ${m}%;"></div>`,c+=`<div class="cc-strip-label ${f?"sel":""}" style="left: ${m}%;">${s.label.split(" ")[0]}</div>`}),c+='<div class="cc-strip-axis"><span>0.3 ns</span><span>1 ns</span><span>1 µs</span><span>1 ms</span><span>50 ms</span></div>',t.querySelector("#cc-strip").innerHTML=c;let i;r.id==="reg"?i="Registers are the absolute fastest — pretty much free. The compiler aggressively allocates the hot variables here. There are only a handful, so they're scarce.":r.id==="l1"||r.id==="l2"?i='L1 and L2 are per-core. Hits here mean the data is "warm" in this thread — the goal of cache-friendly code.':r.id==="l3"?i='L3 is shared across cores. Slower than L1/L2 but still 10× faster than RAM. Often the line between "fast" and "slow" code.':r.id==="ram"?i="A cache miss to RAM costs ~100× a cache hit. This is why pointer-chasing data structures (linked lists, trees) are slower than they look on paper.":r.id==="ssd"?i="100µs is 1,000× slower than RAM. Modern apps treat disk as far away — pre-load into RAM, cache aggressively.":r.id==="hdd"?i="Spinning disks are essentially extinct in performance-critical paths. The seek time alone is 10ms.":r.id==="net"&&(i="A network round trip in the same region is 50ms — half a million times slower than L1. That's why CDNs and caches at every layer earn their keep."),t.querySelector("#cc-explain").innerHTML=i}function l(a){return a<1?`${a} ns`:a<1e3?`${a} ns`:a<1e6?`${(a/1e3).toPrecision(3)} µs`:a<1e9?`${(a/1e6).toPrecision(3)} ms`:`${(a/1e9).toPrecision(3)} s`}}const I={loop:{label:"Loop (TTTTTT...N)",gen:t=>t%10!==9},alt:{label:"Alternating (TNTNTN)",gen:t=>t%2===0},random:{label:"Random (~50/50)",gen:t=>Math.random()<.5},sorted:{label:"Sorted array if (x < 128)",gen:t=>t%256<128},unsort:{label:"Unsorted array if (x < 128)",gen:()=>Math.random()<.5}};function V(t){return t>=2}function X(t,e){return e&&t<3?t+1:!e&&t>0?t-1:t}function K(t){const e={pattern:"loop",counter:0,iter:0,correct:0,history:[]};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Two-bit saturating counter</div>

      <div class="controls">
        <label>Pattern:</label>
        <select class="field" id="bp-pattern">
          ${Object.entries(I).map(([o,n])=>`<option value="${o}">${n.label}</option>`).join("")}
        </select>
        <button class="btn btn-accent" id="bp-step">Next branch</button>
        <button class="btn" id="bp-run100">Run 100</button>
        <button class="btn btn-ghost" id="bp-reset">Reset</button>
      </div>

      <div class="widget-stage" id="bp-stage" style="min-height: 220px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Branches</div><div class="value" id="m-iter">0</div></div>
        <div class="metric"><div class="label">Correct</div><div class="value" id="m-correct">0</div></div>
        <div class="metric accent"><div class="label">Accuracy</div><div class="value" id="m-acc">—</div></div>
        <div class="metric"><div class="label">Stall cost</div><div class="value" id="m-stall">0 cycles</div></div>
      </div>

      <div class="callout" id="bp-explain">Pick a pattern and step. Watch the predictor "learn" the pattern over time.</div>
    </div>
  `;const d=t.querySelector("#bp-stage");t.querySelector("#bp-pattern").addEventListener("change",o=>{e.pattern=o.target.value,l()}),t.querySelector("#bp-step").addEventListener("click",()=>a(1)),t.querySelector("#bp-run100").addEventListener("click",async()=>{for(let o=0;o<100;o++)a(1),await v(15)}),t.querySelector("#bp-reset").addEventListener("click",l);function l(){e.counter=0,e.iter=0,e.correct=0,e.history=[],r()}function a(o){for(let n=0;n<o;n++){const c=I[e.pattern].gen(e.iter),i=V(e.counter),s=i===c;s&&e.correct++,e.history.push({taken:c,guess:i,right:s}),e.history.length>50&&e.history.shift(),e.counter=X(e.counter,c),e.iter++}r()}function r(){const o=e.iter?e.correct/e.iter:0;t.querySelector("#m-iter").textContent=e.iter,t.querySelector("#m-correct").textContent=e.correct,t.querySelector("#m-acc").textContent=e.iter?`${(o*100).toFixed(1)}%`:"—";const n=e.iter-e.correct;t.querySelector("#m-stall").textContent=`${n*15} cycles`;const c=["strong N","weak N","weak T","strong T"];let i=`
      <div class="bp-counter">
        <div class="bp-counter-label">PREDICTOR STATE</div>
        <div class="bp-counter-dots">
          ${[0,1,2,3].map(m=>`<div class="bp-dot ${m===e.counter?"on":""}">${m}</div>`).join("")}
        </div>
        <div class="bp-counter-name">${c[e.counter]}</div>
        <div class="bp-counter-sub">${e.counter>=2?"predict TAKEN":"predict NOT TAKEN"}</div>
      </div>

      <div class="bp-history">
        <div class="bp-history-label">LAST 50 BRANCHES (left = newest)</div>
        <div class="bp-history-row">
          ${e.history.slice().reverse().map(m=>`<div class="bp-pip ${m.right?"right":"wrong"}" title="taken=${m.taken} guess=${m.guess}"></div>`).join("")}
        </div>
        <div class="bp-history-legend">
          <span><div class="bp-pip right"></div> correct</span>
          <span><div class="bp-pip wrong"></div> mispredict</span>
        </div>
      </div>
    `;i+=`<style>
      .bp-counter { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; margin-bottom: 0.6rem; }
      .bp-counter-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.4em; }
      .bp-counter-dots { display: flex; gap: 0.4rem; margin-bottom: 0.3em; }
      .bp-dot { width: 32px; height: 32px; border: 2px solid var(--ink); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 0.9rem; background: var(--paper); }
      .bp-dot.on { background: var(--accent); color: white; }
      .bp-counter-name { font-family: var(--font-display); letter-spacing: 0.04em; font-size: 1.1rem; }
      .bp-counter-sub { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-soft); }
      .bp-history { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; }
      .bp-history-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.4em; }
      .bp-history-row { display: flex; gap: 2px; flex-wrap: wrap; min-height: 18px; }
      .bp-pip { width: 14px; height: 14px; border: 1px solid var(--ink); border-radius: 2px; }
      .bp-pip.right { background: #2a8a3e; }
      .bp-pip.wrong { background: var(--accent); }
      .bp-history-legend { display: flex; gap: 1rem; margin-top: 0.4em; font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-soft); align-items: center; }
      .bp-history-legend span { display: inline-flex; align-items: center; gap: 0.3em; }
    </style>`,d.innerHTML=i;let s;e.iter===0?s='Pick a pattern and click "Next branch" to start feeding the predictor.':e.pattern==="random"||e.pattern==="unsort"?s="Random/unpredictable branches keep the predictor confused — accuracy hovers around 50%, which is no better than coin-flipping. Every misprediction is a ~15-cycle pipeline flush.":o>.9?s=`${(o*100).toFixed(0)}% accuracy. The predictor has locked onto the pattern — most branches now cost nothing.`:o>.7?s=`Predictor is learning. ${(o*100).toFixed(0)}% accuracy and rising as the counter saturates.`:s='Early branches mispredict (the counter starts at "strong N"). Give it 10–20 iterations to converge.',t.querySelector("#bp-explain").innerHTML=s}function v(o){return new Promise(n=>setTimeout(n,o))}r()}const D=16,B=["x","y","z","w"],L=16,N={sumX:{label:"sum every struct's x field",wantField:"x",wantStruct:null},oneStruct:{label:"compute on struct #3 (all fields)",wantField:null,wantStruct:3}};function G(t){let e="aos",d="sumX";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Cache lines on two layouts</div>

      <div class="controls">
        <label>Layout:</label>
        <div class="pill-group">
          <input type="radio" name="loc-layout" id="loc-aos" value="aos" checked>
          <label for="loc-aos">Array of Structs</label>
          <input type="radio" name="loc-layout" id="loc-soa" value="soa">
          <label for="loc-soa">Struct of Arrays</label>
        </div>
        <label>Query:</label>
        <select class="field" id="loc-query">
          ${Object.entries(N).map(([a,r])=>`<option value="${a}">${r.label}</option>`).join("")}
        </select>
      </div>

      <div class="widget-stage" id="loc-stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Cache lines read</div><div class="value" id="m-lines">0</div></div>
        <div class="metric"><div class="label">Useful bytes</div><div class="value" id="m-useful">0</div></div>
        <div class="metric"><div class="label">Wasted bytes</div><div class="value" id="m-wasted">0</div></div>
        <div class="metric accent"><div class="label">Efficiency</div><div class="value" id="m-eff">—</div></div>
      </div>

      <div class="callout" id="loc-explain"></div>
    </div>
  `,t.querySelectorAll("input[name=loc-layout]").forEach(a=>a.addEventListener("change",r=>{e=r.target.value,l()})),t.querySelector("#loc-query").addEventListener("change",a=>{d=a.target.value,l()});function l(){const a=[],r=N[d];if(e==="aos")for(let p=0;p<D;p++)for(const u of B){const h=r.wantField===u||r.wantStruct===p&&r.wantField===null||r.wantStruct===p&&r.wantField===null||r.wantField===u&&r.wantStruct===null;a.push({label:`${u}${p}`,useful:h,field:u,struct:p})}else for(const p of B)for(let u=0;u<D;u++){const h=r.wantField===p||r.wantStruct===u;a.push({label:`${p}${u}`,useful:h,field:p,struct:u})}const v=[];for(let p=0;p<a.length/L;p++){const u=p*L,h=u+L,g=a.slice(u,h),w=g.some(y=>y.useful);v.push({start:u,end:h,needed:w,slice:g})}let o='<div class="loc-mem">';v.forEach((p,u)=>{o+=`<div class="loc-line ${p.needed?"needed":"skipped"}">`,o+=`<div class="loc-line-label">Cache line ${u+1} (64 B)</div>`,o+='<div class="loc-cells">',p.slice.forEach(h=>{let g="loc-cell";p.needed?h.useful?g+=" useful":g+=" wasted":g+=" cold",o+=`<div class="${g}">${h.label}</div>`}),o+="</div></div>"}),o+="</div>",o+=`<style>
      .loc-mem { display: flex; flex-direction: column; gap: 0.4rem; }
      .loc-line { padding: 0.4rem 0.5rem; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper); }
      .loc-line.needed { box-shadow: 3px 3px 0 var(--ink); }
      .loc-line.skipped { opacity: 0.4; background: repeating-linear-gradient(45deg, transparent 0 5px, var(--hatch) 5px 6px), var(--paper); }
      .loc-line-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); margin-bottom: 0.3em; text-transform: uppercase; letter-spacing: 0.08em; }
      .loc-cells { display: grid; grid-template-columns: repeat(16, 1fr); gap: 2px; }
      .loc-cell { font-family: var(--font-mono); font-size: 0.7rem; padding: 0.3em 0; text-align: center; border: 1px solid var(--ink); background: var(--paper); }
      .loc-cell.useful { background: var(--accent); color: white; }
      .loc-cell.wasted { background: var(--paper-deep); color: var(--ink-soft); opacity: 0.7; }
      .loc-cell.cold { background: var(--paper); color: var(--ink-faint); }
    </style>`,t.querySelector("#loc-stage").innerHTML=o;const n=v.filter(p=>p.needed).length,c=a.filter(p=>p.useful).length*4,i=n*L*4-c,s=n*64,m=s===0?0:Math.round(c/s*100);t.querySelector("#m-lines").textContent=n,t.querySelector("#m-useful").textContent=c+" B",t.querySelector("#m-wasted").textContent=i+" B",t.querySelector("#m-eff").textContent=m+"%";let f;d==="sumX"&&e==="aos"?f=`<strong>Worst case.</strong> Summing every x field reads all 4 cache lines (you can't skip any), but only 1/4 of each line is the x's you want. Efficiency: ${m}%.`:d==="sumX"&&e==="soa"?f=`<strong>Best case for SoA.</strong> All 16 x's fit in one cache line. Read it, sum them, done. ${m}% efficient — perfect.`:d==="oneStruct"&&e==="aos"?f=`<strong>Best case for AoS.</strong> Struct #3's four fields are 16 bytes, all in one cache line. Just one read. ${m}% efficient on the relevant line.`:d==="oneStruct"&&e==="soa"&&(f=`<strong>Worst case for SoA on a single-struct query.</strong> Each of struct #3's four fields lives in a different cache line — 4 separate reads, almost all of each line wasted. ${m}% efficient.`),t.querySelector("#loc-explain").innerHTML=f}l()}const T=4096,q=4,z=[{vp:0,pf:5},{vp:1,pf:2},{vp:2,pf:7},{vp:3,pf:1},{vp:4,pf:4},{vp:5,pf:9},{vp:6,pf:0},{vp:7,pf:6}],J=[{v:16675,label:"0x4123 — first access"},{v:17494,label:"0x4456 — same page, different offset"},{v:8320,label:"0x2080 — different page"},{v:18313,label:"0x4789 — back to page 4 (TLB hit?)"}];function Q(t){const e={tlb:[],lastVp:null,lastPf:null,lastOffset:null,lastHit:null,hits:0,misses:0};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Virtual → Physical translation</div>

      <div class="controls">
        <label>Access:</label>
        ${J.map((a,r)=>`<button class="btn" data-addr="${a.v}">${a.label}</button>`).join("")}
        <button class="btn btn-ghost" id="vm-reset">Flush TLB</button>
      </div>

      <div class="widget-stage" id="vm-stage" style="min-height: 340px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">TLB hits</div><div class="value" id="m-hit">0</div></div>
        <div class="metric"><div class="label">TLB misses</div><div class="value" id="m-miss">0</div></div>
        <div class="metric accent"><div class="label">Last translation</div><div class="value" id="m-last">—</div></div>
      </div>

      <div class="callout" id="vm-explain">Click any "Access" button. The first time you touch a page, it costs a full page-walk; subsequent accesses to the same page hit the TLB.</div>
    </div>
  `,t.querySelectorAll("button[data-addr]").forEach(a=>a.addEventListener("click",()=>d(Number(a.dataset.addr)))),t.querySelector("#vm-reset").addEventListener("click",()=>{e.tlb=[],e.lastVp=null,e.lastPf=null,e.lastOffset=null,e.lastHit=null,e.hits=0,e.misses=0,l()});function d(a){const r=Math.floor(a/T),v=a%T,o=e.tlb.find(c=>c.vp===r);let n;o?(n=o.pf,e.hits++,e.lastHit="TLB hit"):(n=z.find(i=>i.vp===r).pf,e.tlb.push({vp:r,pf:n}),e.tlb.length>q&&e.tlb.shift(),e.misses++,e.lastHit="TLB miss → page-walked"),e.lastVp=r,e.lastPf=n,e.lastOffset=v,l()}function l(){let a='<div class="vm-grid">';a+=`<div class="vm-section">
      <div class="vm-section-title">TLB (${q} entries)</div>
      <div class="vm-tlb">`;for(let r=0;r<q;r++){const v=e.tlb[r],o=v&&v.vp===e.lastVp&&e.lastHit==="TLB hit";a+=`<div class="vm-tlb-row ${o?"lit":""}">${v?`vp ${v.vp} → pf ${v.pf}`:'<span style="color: var(--ink-faint);">empty</span>'}</div>`}a+="</div></div>",a+=`<div class="vm-section">
      <div class="vm-section-title">Page Table (in RAM)</div>
      <div class="vm-pt">`,z.forEach(r=>{const v=r.vp===e.lastVp&&e.lastHit&&e.lastHit.includes("miss");a+=`<div class="vm-pt-row ${v?"lit":""}"><span class="vm-vp">vp ${r.vp}</span> → <span class="vm-pf">pf ${r.pf}</span></div>`}),a+="</div></div>",a+=`<div class="vm-section">
      <div class="vm-section-title">Physical RAM (10 frames)</div>
      <div class="vm-frames">`;for(let r=0;r<10;r++){const v=r===e.lastPf,o=z.some(n=>n.pf===r);a+=`<div class="vm-frame ${v?"lit":""} ${o?"used":""}">pf ${r}</div>`}a+="</div></div>",a+="</div>",a+=`<style>
      .vm-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.6rem; }
      @media (max-width: 720px) { .vm-grid { grid-template-columns: 1fr; } }
      .vm-section { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem; }
      .vm-section-title { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.9rem; margin-bottom: 0.4em; }
      .vm-tlb-row, .vm-pt-row { font-family: var(--font-mono); font-size: 0.8rem; padding: 0.25em 0.4em; border: 1.5px solid var(--ink); border-radius: 2px; background: var(--paper); margin: 0.15em 0; }
      .vm-tlb-row.lit, .vm-pt-row.lit { background: var(--accent-soft); border-color: var(--accent); }
      .vm-frames { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.2rem; }
      .vm-frame { font-family: var(--font-mono); font-size: 0.78rem; padding: 0.3em 0.4em; border: 1.5px solid var(--ink); border-radius: 2px; background: var(--paper); text-align: center; }
      .vm-frame.used { background: var(--paper-deep); }
      .vm-frame.lit { background: var(--accent); color: white; border-color: var(--accent); }
    </style>`,t.querySelector("#vm-stage").innerHTML=a,t.querySelector("#m-hit").textContent=e.hits,t.querySelector("#m-miss").textContent=e.misses,e.lastVp!==null&&(t.querySelector("#m-last").textContent=`0x${(e.lastPf*T+e.lastOffset).toString(16)}`),e.lastHit&&(t.querySelector("#vm-explain").innerHTML=`<strong>${e.lastHit}.</strong> virtual page ${e.lastVp} → physical frame ${e.lastPf}. Combined with offset 0x${e.lastOffset.toString(16)}, the physical address is 0x${(e.lastPf*T+e.lastOffset).toString(16)}.`)}l()}const M=[3,7,2,11,4,9,5,6],S=2;function Y(t){let e=0,d=!1;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Scalar vs SIMD multiplication</div>
      <p class="widget-hint">Both compute <code>v[i] = v[i] × ${S}</code> for 8 values.</p>

      <div class="controls">
        <button class="btn btn-accent" id="simd-step">Next cycle →</button>
        <button class="btn" id="simd-run">Run animation</button>
        <button class="btn btn-ghost" id="simd-reset">Reset</button>
      </div>

      <div class="widget-stage" id="simd-stage" style="min-height: 320px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Cycle</div><div class="value" id="m-cyc">0</div></div>
        <div class="metric"><div class="label">Scalar done</div><div class="value" id="m-scalar">0/8</div></div>
        <div class="metric accent"><div class="label">SIMD done</div><div class="value" id="m-simd">0/8</div></div>
      </div>

      <div class="callout" id="simd-explain">In scalar code, the CPU executes one multiplication per cycle. With SIMD it executes one <em>vector</em> multiplication that handles all 8 elements at once.</div>
    </div>
  `;const l=t.querySelector("#simd-stage");t.querySelector("#simd-step").addEventListener("click",()=>{e<8&&e++,a()}),t.querySelector("#simd-run").addEventListener("click",async()=>{if(!d){for(d=!0;e<8;)e++,a(),await r(400);d=!1}}),t.querySelector("#simd-reset").addEventListener("click",()=>{e=0,a()});function a(){let n='<svg viewBox="0 0 720 320" width="100%" style="max-width:720px">';n+=`<style>
      .si-label { font-family: var(--font-display); letter-spacing: 1.5px; font-size: 1.1rem; fill: var(--ink); }
      .si-sub { font-family: var(--font-mono); font-size: 0.75rem; fill: var(--ink-soft); }
      .si-cell-num { font-family: var(--font-mono); font-size: 14px; fill: var(--ink); }
      .si-cell { stroke: var(--ink); stroke-width: 2; fill: var(--paper); }
      .si-cell.done { fill: #d6f5d6; }
      .si-cell.current { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 2.5; }
      .si-alu { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 2.5; }
      .si-alu.active { fill: var(--accent-soft); stroke: var(--accent); }
      .si-arrow { stroke: var(--ink); stroke-width: 1.5; fill: none; marker-end: url(#si-arrow); }
    </style>`,n+='<defs><marker id="si-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/></marker></defs>',n+='<text class="si-label" x="20" y="30">SCALAR (1 wide)</text>',n+=`<text class="si-sub" x="20" y="48">${e} of 8 cycles</text>`;for(let i=0;i<8;i++){const s=50+i*60,m=i<e,f=i===e-1;n+=`<rect class="si-cell ${m?"done":""} ${f?"current":""}" x="${s}" y="60" width="50" height="40" rx="3"/>`,n+=`<text class="si-cell-num" x="${s+25}" y="85" text-anchor="middle">${m?M[i]*S:M[i]}</text>`}const c=e>0&&e<=8;n+=`<rect class="si-alu ${c?"active":""}" x="${50+(e-1)*60}" y="120" width="50" height="40" rx="4" ${e===0?'style="opacity:0.3"':""}/>`,n+=`<text class="si-cell-num" x="${50+(e-1)*60+25}" y="146" text-anchor="middle" style="font-weight: 700;" ${e===0?'style="opacity:0.3"':""}>× ${S}</text>`,n+='<text class="si-sub" x="20" y="135">ALU →</text>',n+='<text class="si-label" x="20" y="210">SIMD (8 wide)</text>',n+=`<text class="si-sub" x="20" y="228">${e>=1?"1 of 1 cycle":"0 of 1 cycle"}</text>`;for(let i=0;i<8;i++){const s=50+i*60,m=e>=1;n+=`<rect class="si-cell ${m?"done":""} ${m&&e===1?"current":""}" x="${s}" y="240" width="50" height="40" rx="3"/>`,n+=`<text class="si-cell-num" x="${s+25}" y="265" text-anchor="middle">${m?M[i]*S:M[i]}</text>`}n+=`<rect class="si-alu ${e>=1?"active":""}" x="50" y="295" width="470" height="20" rx="4" ${e===0?'style="opacity:0.5"':""}/>`,n+=`<text class="si-cell-num" x="285" y="310" text-anchor="middle" style="font-weight: 700;">vector × ${S}</text>`,n+="</svg>",l.innerHTML=n,t.querySelector("#m-cyc").textContent=e,t.querySelector("#m-scalar").textContent=`${e}/8`,t.querySelector("#m-simd").textContent=e>=1?"8/8":"0/8",e===0?t.querySelector("#simd-explain").innerHTML='Same input array, two execution models. Click "Next cycle →" to compare.':e===1?t.querySelector("#simd-explain").innerHTML="<strong>Cycle 1</strong>: scalar processes element 0 (1/8 done). SIMD processed all 8 in the same cycle (8/8 done). One instruction did the work of 8.":e<8?t.querySelector("#simd-explain").innerHTML=`Scalar still grinding through (${e}/8). SIMD has been done for ${e-1} cycles already. This is the 8× speedup compilers target with vectorization.`:t.querySelector("#simd-explain").innerHTML="Scalar finished after 8 cycles. SIMD finished after 1. Same answer; 8× less time. AVX-512 widens the gap to 16×."}function r(v){return new Promise(o=>setTimeout(o,v))}a()}const E=4,W=8;function Z(t){let e="shared",d=!1;const l={counters:[0,0,0,0],lineState:["I","I","I","I"],invalidations:0,cycles:0,step:0};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">4 cores, MESI in action</div>

      <div class="controls">
        <label>Layout:</label>
        <div class="pill-group">
          <input type="radio" name="fs-layout" id="fs-shared" value="shared" checked>
          <label for="fs-shared">Shared line (false sharing)</label>
          <input type="radio" name="fs-layout" id="fs-padded" value="padded">
          <label for="fs-padded">Padded (one line per counter)</label>
        </div>
        <button class="btn btn-accent" id="fs-run">Run ${W} writes/core</button>
        <button class="btn btn-ghost" id="fs-reset">Reset</button>
      </div>

      <div class="widget-stage" id="fs-stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Writes total</div><div class="value" id="m-writes">0</div></div>
        <div class="metric accent"><div class="label">Cache invalidations</div><div class="value" id="m-inv">0</div></div>
        <div class="metric"><div class="label">Simulated cycles</div><div class="value" id="m-cyc">0</div></div>
      </div>

      <div class="callout" id="fs-explain">Pick a layout and run. Watch the cache-line state churn (or not).</div>
    </div>
  `,t.querySelectorAll("input[name=fs-layout]").forEach(c=>c.addEventListener("change",i=>{e=i.target.value,a()})),t.querySelector("#fs-run").addEventListener("click",r),t.querySelector("#fs-reset").addEventListener("click",a);function a(){l.counters=[0,0,0,0],l.lineState=["I","I","I","I"],l.invalidations=0,l.cycles=0,l.step=0,o()}async function r(){if(d)return;d=!0,a();const c=[];for(let i=0;i<W;i++)for(let s=0;s<E;s++)c.push(s);for(const i of c)v(i),await n(160);d=!1}function v(c){if(l.counters[c]++,e==="shared"){for(let i=0;i<E;i++)i!==c&&((l.lineState[i]==="S"||l.lineState[i]==="M"||l.lineState[i]==="E")&&l.invalidations++,l.lineState[i]="I");l.lineState[c]="M",l.cycles+=31}else l.lineState[c]="M",l.cycles+=1;l.step++,o()}function o(){let c='<div class="fs-row">';if(e==="shared")c+=`
        <div class="fs-line-vis">
          <div class="fs-line-label">SHARED CACHE LINE (64 bytes)</div>
          <div class="fs-line">${l.counters.map((i,s)=>`
            <div class="fs-line-slot ${l.lineState[s]==="M"?"mod":""}">
              counter ${s}<br><strong>${i}</strong>
            </div>`).join("")}</div>
        </div>
      `;else{c+='<div class="fs-line-vis">';for(let i=0;i<E;i++)c+=`
          <div class="fs-line-label">CACHE LINE ${i+1} — counter ${i} only</div>
          <div class="fs-line"><div class="fs-line-slot ${l.lineState[i]==="M"?"mod":""}" style="flex: 1;">counter ${i}<br><strong>${l.counters[i]}</strong></div></div>
        `;c+="</div>"}c+="</div>",c+='<div class="fs-cores">';for(let i=0;i<E;i++){const s=l.lineState[i],m={M:"Modified — exclusive write",E:"Exclusive — clean",S:"Shared",I:"Invalid — refetch on next read"}[s];c+=`<div class="fs-core">
        <div class="fs-core-name">Core ${i}</div>
        <div class="fs-core-state ${s.toLowerCase()}">${s}</div>
        <div class="fs-core-desc">${m}</div>
      </div>`}if(c+="</div>",c+=`<style>
      .fs-line-vis { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; margin-bottom: 0.6rem; }
      .fs-line-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
      .fs-line { display: flex; gap: 0; border: 2px solid var(--ink); border-radius: var(--radius); overflow: hidden; margin-bottom: 0.4rem; }
      .fs-line-slot { flex: 1; padding: 0.4rem; background: var(--paper); text-align: center; font-family: var(--font-mono); font-size: 0.8rem; border-right: 1.5px solid var(--ink); }
      .fs-line-slot:last-child { border-right: none; }
      .fs-line-slot.mod { background: var(--accent-soft); }
      .fs-cores { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; }
      .fs-core { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem; text-align: center; }
      .fs-core-name { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.9rem; }
      .fs-core-state { font-family: var(--font-display); font-size: 1.6rem; margin: 0.2em 0; padding: 0.1em 0.3em; border: 2px solid var(--ink); border-radius: 4px; }
      .fs-core-state.m { background: var(--accent); color: white; }
      .fs-core-state.e { background: #c8f0c8; }
      .fs-core-state.s { background: #cfe5ff; }
      .fs-core-state.i { background: #eee; color: var(--ink-soft); }
      .fs-core-desc { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); }
      @media (max-width: 640px) { .fs-cores { grid-template-columns: repeat(2, 1fr); } }
    </style>`,t.querySelector("#fs-stage").innerHTML=c,t.querySelector("#m-writes").textContent=l.step,t.querySelector("#m-inv").textContent=l.invalidations,t.querySelector("#m-cyc").textContent=l.cycles,!l.step)t.querySelector("#fs-explain").innerHTML="Pick a layout and click Run.";else if(e==="shared"){const i=l.invalidations*30;t.querySelector("#fs-explain").innerHTML=`Each core's write invalidates the others. <strong>${l.invalidations} invalidations</strong> so far, costing ~${i} cycles of coherence traffic. The same workload with padding would take ${l.step} cycles total.`}else t.querySelector("#fs-explain").innerHTML=`Each counter on its own cache line. No invalidations across cores. Total: ${l.step} cycles. Compare to the shared-line version.`}function n(c){return new Promise(i=>setTimeout(i,c))}o()}const H={baseline:{label:"Baseline: random-access AoS loop with unpredictable branch",code:`for (int i = 0; i < N; i++) {
  if (data[indices[i]].x > THRESHOLD) {  // unpredictable
    result += data[indices[i]].score;     // pointer chase, AoS
  }
}`,breakdown:{retired:12,cacheMiss:55,mispredict:23,coherence:0,deps:10},total:100,crossLinks:["locality","branch-prediction"],diagnosis:"<strong>Cache misses dominate.</strong> Random indices defeat the prefetcher, AoS layout wastes most of each line. Unpredictable branch adds 23% on top."},sortedSeq:{label:"Variant: sequential access + sorted array (predictable branch)",code:`// data is now sorted by x
for (int i = 0; i < N; i++) {
  if (data[i].x > THRESHOLD) {            // predictable after sort
    result += data[i].score;
  }
}`,breakdown:{retired:60,cacheMiss:25,mispredict:3,coherence:0,deps:12},total:42,crossLinks:["branch-prediction","locality"],diagnosis:"Sorting collapsed the mispredictions (the branch is now monotonic). Sequential access lets the prefetcher do its job. <strong>~2.4× faster</strong> with no algorithmic change."},soa:{label:"Variant: Struct-of-Arrays layout (better cache use)",code:`// data split into separate arrays: xs[], scores[]
for (int i = 0; i < N; i++) {
  if (xs[i] > THRESHOLD) {                // still predictable
    result += scores[i];                  // tight, dense access
  }
}`,breakdown:{retired:78,cacheMiss:10,mispredict:3,coherence:0,deps:9},total:30,crossLinks:["locality","cache"],diagnosis:"Splitting xs and scores into their own arrays means each cache line holds 16 useful values, not 4. Cache misses drop again. <strong>~3.3× faster than baseline.</strong>"},simdMulti:{label:"Variant: SoA + SIMD + per-thread state",code:`#pragma omp parallel for simd
for (int i = 0; i < N; i++) {
  __m256 mask = _mm256_cmp_ps(xs[i..i+8] > THRESHOLD);
  result[tid] += hsum(_mm256_and_ps(mask, scores[i..i+8]));
}`,breakdown:{retired:88,cacheMiss:7,mispredict:1,coherence:1,deps:3},total:8,crossLinks:["simd","false-sharing"],diagnosis:"SIMD does 8 lanes at once; per-thread <code>result[tid]</code> is padded to avoid false sharing. <strong>~12× faster than baseline.</strong> Almost all cycles now do real work."}},A={retired:{color:"#2a8a3e",label:"Retired (real work)"},cacheMiss:{color:"#d62828",label:"Cache miss stall"},mispredict:{color:"#b07b1a",label:"Branch mispredict"},coherence:{color:"#7f4eb6",label:"Coherence (false sharing)"},deps:{color:"#888",label:"Data dependencies"}},ee={locality:"Memory Locality","branch-prediction":"Branch Prediction",cache:"Cache Hierarchy",simd:"SIMD","false-sharing":"False Sharing"};function te(t){let e="baseline";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Same loop, four variants</div>

      <div class="controls">
        <label>Variant:</label>
        <select class="field" id="pm-variant" style="min-width: 260px;">
          ${Object.entries(H).map(([a,r])=>`<option value="${a}">${r.label}</option>`).join("")}
        </select>
      </div>

      <div class="widget-stage" id="pm-stage" style="min-height: 380px;"></div>
      <div class="callout" id="pm-diag"></div>
    </div>
  `,t.querySelector("#pm-variant").addEventListener("change",a=>{e=a.target.value,d()});function d(){const a=H[e],v=(H.baseline.total/a.total).toFixed(1);let o=`
      <div class="pm-grid">
        <div class="pm-code-panel">
          <div class="pm-panel-label">CODE</div>
          <pre>${l(a.code)}</pre>
        </div>
        <div class="pm-profile-panel">
          <div class="pm-panel-label">CYCLE BREAKDOWN</div>
          <div class="pm-bar">
    `;Object.entries(a.breakdown).forEach(([n,c])=>{o+=`<div class="pm-bar-seg" style="width: ${c}%; background: ${A[n].color};" title="${A[n].label}: ${c}%">${c>8?c+"%":""}</div>`}),o+=`</div>
          <div class="pm-legend">
            ${Object.entries(a.breakdown).map(([n,c])=>`
              <div class="pm-legend-item">
                <div class="pm-legend-swatch" style="background: ${A[n].color}"></div>
                <span>${A[n].label}: <strong>${c}%</strong></span>
              </div>`).join("")}
          </div>
        </div>
      </div>

      <div class="pm-bottom">
        <div class="pm-metric">
          <div class="pm-metric-label">Relative time</div>
          <div class="pm-metric-value">${a.total} units</div>
          <div class="pm-metric-sub">${e==="baseline"?"(baseline)":`${v}× faster than baseline`}</div>
        </div>
        <div class="pm-links">
          <div class="pm-links-label">Related lessons:</div>
          ${a.crossLinks.map(n=>`<a class="pm-link" href="${n}.html">${ee[n]}</a>`).join("")}
        </div>
      </div>
    `,o+=`<style>
      .pm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 0.6rem; }
      @media (max-width: 720px) { .pm-grid { grid-template-columns: 1fr; } }
      .pm-panel-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
      .pm-code-panel { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; overflow-x: auto; }
      .pm-code-panel pre { margin: 0; font-family: var(--font-mono); font-size: 0.75rem; background: transparent; border: none; padding: 0; line-height: 1.5; }
      .pm-profile-panel { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; }
      .pm-bar { display: flex; height: 32px; border: 1.5px solid var(--ink); border-radius: 3px; overflow: hidden; margin-bottom: 0.6rem; background: var(--paper); }
      .pm-bar-seg { color: white; font-family: var(--font-mono); font-size: 0.75rem; display: flex; align-items: center; justify-content: center; border-right: 1px solid rgba(0,0,0,0.2); }
      .pm-legend { display: flex; flex-direction: column; gap: 0.2em; }
      .pm-legend-item { display: flex; align-items: center; gap: 0.4em; font-family: var(--font-mono); font-size: 0.75rem; }
      .pm-legend-swatch { width: 14px; height: 14px; border: 1px solid var(--ink); border-radius: 2px; }
      .pm-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
      .pm-metric { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; box-shadow: 3px 3px 0 var(--accent); }
      .pm-metric-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; }
      .pm-metric-value { font-family: var(--font-display); font-size: 1.8rem; letter-spacing: 0.04em; }
      .pm-metric-sub { font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft); }
      .pm-links { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; }
      .pm-links-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
      .pm-link { display: inline-block; font-family: var(--font-display); letter-spacing: 0.04em; font-size: 0.85rem; padding: 0.15em 0.5em; margin: 0.15em 0.2em 0.15em 0; border: 1.5px solid var(--ink); border-radius: 2px; background: var(--paper-deep); text-decoration: none; color: var(--ink); }
      .pm-link:hover { background: var(--accent-soft); border-color: var(--accent); }
      @media (max-width: 540px) { .pm-bottom { grid-template-columns: 1fr; } }
    </style>`,t.querySelector("#pm-stage").innerHTML=o,t.querySelector("#pm-diag").innerHTML=a.diagnosis}function l(a){return String(a).replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r])}d()}const x=t=>()=>b.jsx(O,{init:t}),ae={slug:"computer-architecture",title:"Computer Architecture",intro:b.jsx(b.Fragment,{children:"Eight lessons on why two semantically identical programs run at 10× different speeds — CPU pipelines, caches, branch prediction, memory locality, virtual memory, SIMD, multi-core gotchas, and the mental model to reason about performance."}),lessons:[{slug:"pipeline",number:"01",title:"CPU Pipeline",blurb:"Five stages, one instruction per cycle — when things go well.",Widget:x(_),intro:b.jsx(b.Fragment,{children:"Modern CPUs run several instructions at once, each at a different stage. Stalls happen when one instruction depends on another that hasn\\'t finished."}),sections:[],takeaways:["Five canonical stages: fetch, decode, execute, memory, write-back.","Data hazard: next instruction needs result of previous. Stall or forward.","Modern x86 cores pipeline 14–20 stages and execute out-of-order.","Branches are the worst — a wrong prediction flushes the pipeline."]},{slug:"cache",number:"02",title:"Cache Hierarchy",blurb:"L1, L2, L3, RAM, SSD. If L1 takes a second, RAM takes 5 minutes.",Widget:x(U),intro:b.jsx(b.Fragment,{children:"Memory access times span six orders of magnitude. Knowing roughly where your data lives is the difference between fast and slow code."}),sections:[],takeaways:["L1 cache: ~1 ns. L2: ~3 ns. L3: ~10 ns. RAM: ~100 ns. SSD: ~100 μs.","A miss at any level falls through to the next, slower one.","Cache lines are 64 bytes — when you touch one byte, you get all 64.","Algorithmic cache-friendliness often beats lower complexity in practice."]},{slug:"branch-prediction",number:"03",title:"Branch Prediction",blurb:"A loop body runs faster on the 1000th iteration than the first.",Widget:x(K),intro:b.jsx(b.Fragment,{children:"The CPU guesses which way a branch will go and starts running that path. When right (and it usually is), it saves a stall."}),sections:[],takeaways:["Static prediction: backward branches predicted taken (loops), forward not.","Dynamic predictors track per-branch history.","Misprediction costs ~15 cycles — flushed pipeline.","Sorted data branches predictably; random data fights the predictor."]},{slug:"locality",number:"04",title:"Memory Locality",blurb:"Same data, two layouts. Array-of-structs vs struct-of-arrays.",Widget:x(G),intro:b.jsx(b.Fragment,{children:"Two ways to lay out a list of structs. Choose based on what your hot loop touches: whole records (AoS) or single fields (SoA)."}),sections:[],takeaways:["AoS (array of structs): natural OOP layout, hits cache when you use whole records.","SoA (struct of arrays): better when you process one field over many records.","ECS game engines use SoA for the inner loops.","Compilers sometimes auto-rewrite, but rarely."]},{slug:"virtual-memory",number:"05",title:"Virtual Memory",blurb:"Every program thinks it owns all the RAM. Page tables make that lie work.",Widget:x(Q),intro:b.jsx(b.Fragment,{children:"The MMU translates virtual addresses to physical pages on every memory access. The page table maps them; the TLB caches the recent translations."}),sections:[],takeaways:["Pages are typically 4 KB — translation granularity.","TLB miss adds ~50 ns. TLB misses on hot paths kill performance.","Huge pages (2 MB, 1 GB) shrink the TLB footprint.","Same virtual address in two processes maps to different physical RAM."]},{slug:"simd",number:"06",title:"SIMD & Vectorization",blurb:"One instruction, eight numbers at once.",Widget:x(Y),intro:b.jsx(b.Fragment,{children:"SIMD instructions operate on a vector of values. AVX2 does 8 32-bit ops per instruction; AVX-512 does 16. Massive speedups for the right loops."}),sections:[],takeaways:["Loops that do the same thing to many values are SIMD candidates.","Compilers auto-vectorize simple loops; complex ones need intrinsics.","Memory layout matters — SoA vectorizes much better than AoS.","WebAssembly, JIT compilers also emit SIMD when available."]},{slug:"false-sharing",number:"07",title:"Multi-core & False Sharing",blurb:"Four threads, four counters, one cache line.",Widget:x(Z),intro:b.jsx(b.Fragment,{children:'Two cores updating different variables on the same cache line still fight over the line. The bug: scalability flatlines despite "independent" data.'}),sections:[],takeaways:["Cache coherence keeps lines consistent across cores — but at a cost.","False sharing: independent variables, same line, contention.","Pad hot per-thread data to cache-line boundaries (align to 64 bytes).","Per-thread aggregates merged at the end beat shared atomics."]},{slug:"perf-model",number:"08",title:"Performance Mental Model",blurb:"A slow loop, profiled. Where the cycles actually go.",Widget:x(te),intro:b.jsx(b.Fragment,{children:"Profile first, guess never. Most slow code is bottlenecked on memory, not CPU. The numbers to know fit on a napkin."}),sections:[],takeaways:["Always measure before optimising. Intuition is wrong more than half the time.","Memory hierarchy dominates. CPU cycles are mostly waiting on memory.","perf, vtune, Instruments — use the real tools.","Big-O still matters, but constant factors often matter more in practice."]}]};export{ae as manifest};
