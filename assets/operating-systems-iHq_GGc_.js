import{j as b}from"./main-BHRJeYOh.js";import{L as D}from"./LegacyWidget-Di7ysmDJ.js";let q=100,T=1;function I(a){const r={processes:[{pid:1,ppid:0,prog:"init",addr:"AS-1",fdTable:["stdin","stdout","stderr"],threads:[{tid:1}]}],log:[],selected:1};a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Process &amp; thread tree</div>
      <p class="widget-hint">Click a process to select it; fork it, exec into something else, or spawn a thread.</p>

      <div class="controls">
        <button class="btn btn-accent" id="pp-fork">fork()</button>
        <button class="btn" id="pp-exec">exec("/bin/grep")</button>
        <button class="btn" id="pp-thread">pthread_create()</button>
        <button class="btn" id="pp-exit">exit()</button>
        <button class="btn btn-ghost" id="pp-reset">Reset</button>
      </div>

      <div class="widget-stage" id="pp-stage" style="min-height: 340px;"></div>

      <div class="log" id="pp-log"></div>
    </div>
  `;const d=a.querySelector("#pp-stage"),p=a.querySelector("#pp-log");a.querySelector("#pp-fork").addEventListener("click",t),a.querySelector("#pp-exec").addEventListener("click",n),a.querySelector("#pp-thread").addEventListener("click",c),a.querySelector("#pp-exit").addEventListener("click",l),a.querySelector("#pp-reset").addEventListener("click",()=>{q=100,T=1,r.processes=[{pid:1,ppid:0,prog:"init",addr:"AS-1",fdTable:["stdin","stdout","stderr"],threads:[{tid:1}]}],r.log=[],r.selected=1,p.innerHTML="",u()});function t(){const e=r.processes.find(f=>f.pid===r.selected);if(!e)return;const s={pid:q++,ppid:e.pid,prog:e.prog,addr:"AS-"+e.pid+"."+q,fdTable:e.fdTable.slice(),threads:[{tid:T++}]};r.processes.push(s),o("ok",`fork(): parent PID=${e.pid} → child PID=${s.pid}. Child gets its own address space (COW) and a copy of the FD table.`),u()}function n(){const e=r.processes.find(f=>f.pid===r.selected);if(!e)return;const s="/bin/grep";e.prog=s,e.addr="AS-"+e.pid+"*",e.threads=[{tid:T++}],o("info",`exec("${s}"): PID=${e.pid} keeps its identity but loads a new program. FDs preserved; threads reset to one.`),u()}function c(){const e=r.processes.find(s=>s.pid===r.selected);e&&(e.threads.push({tid:T++}),o("ok",`pthread_create(): new thread TID=${e.threads[e.threads.length-1].tid} in PID=${e.pid}. Shares the address space + FD table with sibling threads.`),u())}function l(){const e=r.processes.find(s=>s.pid===r.selected);if(!e||e.pid===1){o("err","Can't exit init (PID 1) in this demo.");return}r.processes=r.processes.filter(s=>s.pid!==e.pid),o("info",`exit(): PID=${e.pid} terminated. Its address space, FDs, and threads are reclaimed by the kernel.`),r.selected=1,u()}function u(){let e='<div class="pp-grid">';r.processes.forEach(s=>{const f=s.pid===r.selected;e+=`
        <div class="pp-proc ${f?"sel":""}" data-pid="${s.pid}">
          <div class="pp-proc-name">PID ${s.pid} — ${i(s.prog)} <span class="pp-proc-ppid">ppid=${s.ppid}</span></div>
          <div class="pp-proc-sub">${s.addr}  ·  ${s.fdTable.length} fds</div>
          <div class="pp-threads">
            ${s.threads.map(k=>`<div class="pp-thread">TID ${k.tid}</div>`).join("")}
          </div>
        </div>
      `}),e+="</div>",e+=`<style>
      .pp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.6rem; }
      .pp-proc { background: #c8f0c8; border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; cursor: pointer; transition: transform 0.12s, box-shadow 0.12s; }
      .pp-proc:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--ink); }
      .pp-proc.sel { box-shadow: 4px 4px 0 var(--accent); border-color: var(--accent); transform: translate(-2px, -2px); }
      .pp-proc-name { font-family: var(--font-display); letter-spacing: 0.04em; font-size: 1rem; }
      .pp-proc-ppid { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); font-weight: normal; }
      .pp-proc-sub { font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-soft); margin-bottom: 0.4em; }
      .pp-threads { display: flex; gap: 0.3rem; flex-wrap: wrap; }
      .pp-thread { background: #ffe9b3; border: 1.5px solid var(--ink); border-radius: 2px; padding: 0.15em 0.4em; font-family: var(--font-mono); font-size: 0.7rem; }
    </style>`,d.innerHTML=e,d.querySelectorAll(".pp-proc").forEach(s=>s.addEventListener("click",()=>{r.selected=Number(s.dataset.pid),u()}))}function o(e,s){r.log.unshift({level:e,msg:s,t:new Date().toLocaleTimeString()});const f=document.createElement("div");for(f.className=`entry ${e}`,f.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${s}`,p.prepend(f);p.children.length>50;)p.removeChild(p.lastChild)}function i(e){return String(e).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s])}u()}const S=[{id:"A",arrival:0,burst:6,priority:2,color:"#cfe5ff"},{id:"B",arrival:1,burst:3,priority:1,color:"#c8f0c8"},{id:"C",arrival:2,burst:8,priority:3,color:"#ffe9b3"},{id:"D",arrival:3,burst:2,priority:1,color:"#f7c8c8"}],C={fcfs:"FCFS (first come, first served)",rr:"Round-robin (quantum=2)",sjf:"SJF (non-preemptive, shortest job)",prio:"Priority (lower = higher priority)",cfs:"CFS-like (fairness via vruntime)"};function R(a){const r=S.map(c=>({...c,remaining:c.burst,vruntime:0})),d=[];let p=0;const t=100;for(;r.some(c=>c.remaining>0)&&p<t;){const c=r.filter(u=>u.arrival<=p&&u.remaining>0);if(!c.length){d.push({t:p,job:null}),p++;continue}let l;if(a==="fcfs"){l=c.sort((o,i)=>o.arrival-i.arrival)[0];const u=l.remaining;for(let o=0;o<u;o++)d.push({t:p+o,job:l.id});p+=u,l.remaining=0}else if(a==="sjf"){l=c.sort((o,i)=>o.remaining-i.remaining||o.arrival-i.arrival)[0];const u=l.remaining;for(let o=0;o<u;o++)d.push({t:p+o,job:l.id});p+=u,l.remaining=0}else if(a==="prio"){l=c.sort((o,i)=>o.priority-i.priority||o.arrival-i.arrival)[0];const u=l.remaining;for(let o=0;o<u;o++)d.push({t:p+o,job:l.id});p+=u,l.remaining=0}else if(a==="rr"){c.sort((e,s)=>e.arrival-s.arrival);const o={};for(let e=d.length-1;e>=0;e--){const s=d[e].job;s&&o[s]===void 0&&(o[s]=e)}l=c.sort((e,s)=>(o[e.id]??-1)-(o[s.id]??-1))[0];const i=Math.min(2,l.remaining);for(let e=0;e<i;e++)d.push({t:p+e,job:l.id});p+=i,l.remaining-=i}else if(a==="cfs"){l=c.sort((o,i)=>o.vruntime-i.vruntime||o.arrival-i.arrival)[0],d.push({t:p,job:l.id});const u=1/l.priority;l.vruntime+=1/u,l.remaining-=1,p+=1}}const n={};return S.forEach(c=>{const l=d.reduce((i,e)=>e.job===c.id?e.t+1:i,c.arrival),u=l-c.arrival,o=u-c.burst;n[c.id]={completion:l,turnaround:u,wait:o}}),{timeline:d,stats:n}}function _(a){let r="fcfs";a.innerHTML=`
    <div class="widget">
      <div class="widget-title">4 jobs, 1 CPU</div>

      <div class="controls">
        <label>Policy:</label>
        <select class="field" id="sc-policy">
          ${Object.entries(C).map(([t,n])=>`<option value="${t}">${n}</option>`).join("")}
        </select>
      </div>

      <div class="widget-stage" id="sc-stage" style="min-height: 220px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Avg wait time</div><div class="value" id="m-wait">—</div></div>
        <div class="metric"><div class="label">Avg turnaround</div><div class="value" id="m-tt">—</div></div>
        <div class="metric accent"><div class="label">Total CPU time</div><div class="value" id="m-cpu">—</div></div>
      </div>

      <div class="callout" id="sc-explain"></div>
    </div>
  `;const d=a.querySelector("#sc-stage");a.querySelector("#sc-policy").addEventListener("change",t=>{r=t.target.value,p()});function p(){const{timeline:t,stats:n}=R(r),c=t.length,l=720;let o=`<svg viewBox="0 0 ${l} 200" width="100%" style="max-width: ${l}px">`;o+=`<style>
      .sc-job-row { font-family: var(--font-display); font-size: 14px; letter-spacing: 1.5px; fill: var(--ink); }
      .sc-burst { stroke: var(--ink); stroke-width: 1.5; }
      .sc-axis { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .sc-track { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1; }
      .sc-arrival { stroke: var(--ink); stroke-width: 2; }
    </style>`;const i=60,e=l-20,s=(e-i)/c;for(let m=0;m<=c;m++){const h=i+m*s;o+=`<line x1="${h}" y1="155" x2="${h}" y2="160" stroke="var(--ink-soft)" stroke-width="1"/>`,m%2===0&&(o+=`<text class="sc-axis" x="${h}" y="172" text-anchor="middle">${m}</text>`)}o+=`<line x1="${i}" y1="160" x2="${e}" y2="160" stroke="var(--ink-soft)" stroke-width="1"/>`,o+='<text class="sc-job-row" x="20" y="115">CPU</text>',o+=`<rect class="sc-track" x="${i}" y="100" width="${e-i}" height="40" rx="3"/>`,t.forEach(m=>{if(!m.job)return;const h=i+m.t*s,v=S.find(x=>x.id===m.job);o+=`<rect class="sc-burst" x="${h}" y="100" width="${s}" height="40" fill="${v.color}"/>`,s>16&&(o+=`<text x="${h+s/2}" y="125" text-anchor="middle" style="font-family: var(--font-display); font-size: 14px; letter-spacing: 1px; fill: var(--ink);">${m.job}</text>`)}),S.forEach(m=>{const h=i+m.arrival*s;o+=`<line class="sc-arrival" x1="${h}" y1="60" x2="${h}" y2="100"/>`,o+=`<polygon points="${h-5},60 ${h+5},60 ${h},70" fill="${m.color}" stroke="var(--ink)" stroke-width="1.5"/>`,o+=`<text x="${h}" y="55" text-anchor="middle" class="sc-axis">${m.id}↓ burst:${m.burst} prio:${m.priority}</text>`}),o+="</svg>",d.innerHTML=o;const f=(Object.values(n).reduce((m,h)=>m+h.wait,0)/S.length).toFixed(1),k=(Object.values(n).reduce((m,h)=>m+h.turnaround,0)/S.length).toFixed(1);a.querySelector("#m-wait").textContent=f,a.querySelector("#m-tt").textContent=k,a.querySelector("#m-cpu").textContent=S.reduce((m,h)=>m+h.burst,0);let g=`<strong>${C[r]}</strong>. `;r==="fcfs"?g+="Jobs run in arrival order. Long jobs early can starve later short ones — see how D (burst=2, arrives at t=3) waits behind A and B.":r==="sjf"?g+="Always picks the shortest <em>remaining</em> job. Minimizes average wait time, at the cost of starving long jobs (C waits longest here).":r==="rr"?g+="Quantum=2. Every ready job gets 2 ticks before yielding. Fair but adds context-switch overhead (we ignore the overhead in this demo).":r==="prio"?g+="Lower priority number runs first. B and D (priority 1) preempt A (priority 2) and C (priority 3). Risk: starvation of priority-3 jobs.":r==="cfs"&&(g+='Each tick, the job with the lowest accumulated "virtual runtime" runs. Roughly equivalent to fair-share. Priority acts as a weight.'),a.querySelector("#sc-explain").innerHTML=g}p()}const y=32,A=["#cfe5ff","#c8f0c8","#ffe9b3","#f7c8c8","#e6d6ff","#ffd9b3","#b3e6cc"];function O(a){const r={heap:new Array(y).fill(null),chunks:[],nextId:1,strategy:"first",log:[]};a.innerHTML=`
    <div class="widget">
      <div class="widget-title">${y}-cell heap (1 cell = 1 KB, say)</div>

      <div class="controls">
        <label>Strategy:</label>
        <div class="pill-group">
          <input type="radio" name="mm-s" id="mm-first" value="first" checked>
          <label for="mm-first">First fit</label>
          <input type="radio" name="mm-s" id="mm-best" value="best">
          <label for="mm-best">Best fit</label>
        </div>
        <label>malloc(</label>
        <select class="field" id="mm-size">
          <option value="2">2</option>
          <option value="4" selected>4</option>
          <option value="6">6</option>
          <option value="8">8</option>
          <option value="12">12</option>
        </select>
        <label>)</label>
        <button class="btn btn-accent" id="mm-alloc">Allocate</button>
        <button class="btn" id="mm-burst">Burst: 8× malloc(2) + free every other</button>
        <button class="btn btn-ghost" id="mm-reset">Reset</button>
      </div>

      <div class="widget-stage" id="mm-stage" style="min-height: 220px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Used</div><div class="value" id="m-used">0</div></div>
        <div class="metric"><div class="label">Free total</div><div class="value" id="m-free">${y}</div></div>
        <div class="metric"><div class="label">Largest free</div><div class="value" id="m-lf">${y}</div></div>
        <div class="metric accent"><div class="label">Fragmentation</div><div class="value" id="m-frag">0%</div></div>
      </div>

      <div class="log" id="mm-log"></div>
    </div>
  `;const d=a.querySelector("#mm-stage"),p=a.querySelector("#mm-log");a.querySelectorAll("input[name=mm-s]").forEach(i=>i.addEventListener("change",e=>{r.strategy=e.target.value})),a.querySelector("#mm-alloc").addEventListener("click",()=>{const i=Number(a.querySelector("#mm-size").value);t(i)}),a.querySelector("#mm-burst").addEventListener("click",async()=>{const i=[];for(let e=0;e<8;e++){const s=t(2);s&&i.push(s),await o(80)}for(let e=0;e<i.length;e+=2)n(i[e]),await o(80)}),a.querySelector("#mm-reset").addEventListener("click",()=>{r.heap=new Array(y).fill(null),r.chunks=[],r.nextId=1,r.log=[],p.innerHTML="",l()});function t(i){const e=c();let s=null;if(r.strategy==="first")s=e.find(g=>g.length>=i);else{const g=e.filter(m=>m.length>=i);g.sort((m,h)=>m.length-h.length),s=g[0]}if(!s)return u("err",`malloc(${i}): FAILED — fragmentation. Largest free run is only ${Math.max(0,...e.map(g=>g.length))} cells.`),l(),null;const f=r.nextId++,k=A[(f-1)%A.length];r.chunks.push({id:f,size:i,color:k});for(let g=s.start;g<s.start+i;g++)r.heap[g]=f;return u("ok",`malloc(${i}) → chunk #${f} at offset ${s.start}`),l(),f}function n(i){let e=0;for(let s=0;s<r.heap.length;s++)r.heap[s]===i&&(r.heap[s]=null,e++);e&&u("info",`free(#${i}) — ${e} cells returned`),l()}function c(){const i=[];let e=0;for(;e<y;)if(r.heap[e]===null){let s=e;for(;s<y&&r.heap[s]===null;)s++;i.push({start:e,length:s-e}),e=s}else e++;return i}function l(){let i="";for(let v=0;v<y;v++){const x=r.heap[v],M=x?r.chunks.find(F=>F.id===x):null,z=x&&(v===0||r.heap[v-1]!==x);i+=`<div class="mm-cell ${x?"used":"free"}" data-id="${x||""}" style="${M?`background: ${M.color};`:""}">
        ${z?`<span class="mm-cell-label">#${x}</span>`:""}
      </div>`}const e=r.chunks.filter(v=>r.heap.includes(v.id)).map(v=>`<button class="mm-chunk-btn" data-free="${v.id}" style="background: ${v.color};">free(#${v.id}) ${v.size}KB</button>`).join("");let s=`
      <div class="mm-heap">${i}</div>
      <div class="mm-chunks">${e||'<span style="color: var(--ink-faint); font-family: var(--font-mono); font-size: 0.8rem;">no live allocations</span>'}</div>
      <style>
        .mm-heap { display: grid; grid-template-columns: repeat(${y}, 1fr); gap: 2px; margin: 0.4rem 0 0.6rem; }
        .mm-cell { height: 36px; border: 1.5px solid var(--ink); border-radius: 2px; position: relative; }
        .mm-cell.free { background: var(--paper); }
        .mm-cell-label { position: absolute; left: 2px; top: 2px; font-family: var(--font-mono); font-size: 9px; }
        .mm-chunks { display: flex; gap: 0.3rem; flex-wrap: wrap; }
        .mm-chunk-btn { font-family: var(--font-mono); font-size: 0.78rem; border: 1.5px solid var(--ink); border-radius: 2px; padding: 0.2em 0.5em; cursor: pointer; }
        .mm-chunk-btn:hover { box-shadow: 2px 2px 0 var(--ink); }
      </style>
    `;d.innerHTML=s,d.querySelectorAll("button[data-free]").forEach(v=>v.addEventListener("click",()=>n(Number(v.dataset.free))));const f=r.heap.filter(v=>v!==null).length,k=y-f,g=c(),m=g.length?Math.max(...g.map(v=>v.length)):0,h=k===0?0:Math.round((1-m/k)*100);a.querySelector("#m-used").textContent=f,a.querySelector("#m-free").textContent=k,a.querySelector("#m-lf").textContent=m,a.querySelector("#m-frag").textContent=h+"%"}function u(i,e){const s=document.createElement("div");for(s.className=`entry ${i}`,s.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${e}`,p.prepend(s);p.children.length>50;)p.removeChild(p.lastChild)}function o(i){return new Promise(e=>setTimeout(e,i))}l()}const P={write:{num:1,args:["fd=1",'"hello\\n"',"len=6"],ret:"bytes_written=6",desc:"write data to a file descriptor"},read:{num:0,args:["fd=0","buf=0x7ff…","len=4096"],ret:"bytes_read=128",desc:"read from a file descriptor"},open:{num:2,args:['"/etc/hostname"',"O_RDONLY=0","mode=0"],ret:"fd=4",desc:"open a file, returns a new fd"},fork:{num:57,args:["(none)"],ret:"pid=8472 (child) or 0 (parent)",desc:"clone the current process"},exit:{num:60,args:["code=0"],ret:"(does not return)",desc:"terminate the process"}},E=[{side:"user",label:"1. Application calls libc wrapper",detail:'printf("hello\\n") in C eventually calls write(1, "hello\\n", 6).'},{side:"user",label:"2. libc loads registers",detail:'rax = syscall number, rdi/rsi/rdx = arguments. Then "syscall" instruction.'},{side:"trap",label:"3. CPU traps to ring 0",detail:"Saves user-mode state, switches to kernel stack, jumps to entry_SYSCALL_64."},{side:"kernel",label:"4. Kernel dispatches",detail:"Looks up sys_call_table[rax], calls that function with the saved arg registers."},{side:"kernel",label:"5. Handler runs",detail:"The actual implementation runs — touch buffers, talk to drivers, etc."},{side:"trap",label:"6. Trap return (sysret)",detail:'Restores user-mode state, jumps back to the instruction after "syscall".'},{side:"user",label:"7. Control resumes in user code",detail:"rax holds the return value (or -errno on failure)."}];function N(a){let r="write",d=0;a.innerHTML=`
    <div class="widget">
      <div class="widget-title">User ↔ Kernel round trip</div>

      <div class="controls">
        <label>Syscall:</label>
        <select class="field" id="sy-call">
          ${Object.entries(P).map(([n,c])=>`<option value="${n}">${n}(${c.args.join(", ")})  → ${c.ret}</option>`).join("")}
        </select>
        <button class="btn btn-accent" id="sy-step">Next step →</button>
        <button class="btn btn-ghost" id="sy-reset">Reset</button>
      </div>

      <div class="widget-stage" id="sy-stage" style="min-height: 320px;"></div>
      <div class="callout" id="sy-note"></div>
    </div>
  `,a.querySelector("#sy-call").addEventListener("change",n=>{r=n.target.value,d=0,p()}),a.querySelector("#sy-step").addEventListener("click",()=>{d<E.length&&d++,p()}),a.querySelector("#sy-reset").addEventListener("click",()=>{d=0,p()});function p(){const n=d===0?null:E[d-1],c=(n==null?void 0:n.side)??"idle",l=P[r];let u=`
      <div class="sy-ring">
        <div class="sy-zone user ${c==="user"?"active":""}">
          <div class="sy-zone-label">USER MODE (ring 3)</div>
          <pre>${r}(${l.args.join(", ")});</pre>
          ${c==="user"&&d>=2?`<div class="sy-reg">rax=${l.num} (syscall #)</div>`:""}
          ${d>=E.length?`<div class="sy-result">→ ${t(l.ret)}</div>`:""}
        </div>

        <div class="sy-trap ${c==="trap"?"active":""}">
          ${c==="trap"?"⚡ TRAP":"· · ·"}
        </div>

        <div class="sy-zone kernel ${c==="kernel"?"active":""}">
          <div class="sy-zone-label">KERNEL MODE (ring 0)</div>
          <pre>sys_call_table[${l.num}]
  → sys_${r}(${l.args.join(", ")})</pre>
          ${c==="kernel"&&d>=4?`<div class="sy-reg">handler: ${t(l.desc)}</div>`:""}
        </div>
      </div>

      <div class="sy-steps">
        ${E.map((o,i)=>`
          <div class="sy-step ${i<d?"done":""} ${i===d-1?"cur":""}">
            <div class="sy-step-num">${String(i+1).padStart(2,"0")}</div>
            <div class="sy-step-label">${t(o.label)}</div>
          </div>
        `).join("")}
      </div>

      <style>
        .sy-ring { display: grid; grid-template-columns: 1fr 60px 1fr; gap: 0.4rem; margin-bottom: 0.8rem; }
        .sy-zone { padding: 0.7rem; border: 2.5px solid var(--ink); border-radius: var(--radius); transition: box-shadow 0.2s; }
        .sy-zone.user { background: #cfe5ff; }
        .sy-zone.kernel { background: #f7c8c8; }
        .sy-zone.active { box-shadow: 4px 4px 0 var(--accent); }
        .sy-zone-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.85rem; margin-bottom: 0.3em; }
        .sy-zone pre { font-family: var(--font-mono); font-size: 0.8rem; margin: 0; background: rgba(255,255,255,0.5); border: 1px solid var(--ink); padding: 0.4em 0.6em; border-radius: 2px; white-space: pre-wrap; }
        .sy-reg { margin-top: 0.4em; font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft); }
        .sy-result { margin-top: 0.4em; font-family: var(--font-mono); font-size: 0.85rem; font-weight: 600; }
        .sy-trap { display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 1.2rem; letter-spacing: 1px; color: var(--ink-soft); border: 2px dashed var(--ink-soft); border-radius: var(--radius); }
        .sy-trap.active { color: var(--accent); border-color: var(--accent); border-style: solid; background: var(--accent-soft); }
        .sy-steps { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; }
        .sy-step { display: grid; grid-template-columns: 32px 1fr; gap: 0.4rem; padding: 0.18em 0.3em; font-family: var(--font-mono); font-size: 0.82rem; color: var(--ink-soft); }
        .sy-step.done { color: var(--ink); }
        .sy-step.cur { background: var(--accent-soft); border-radius: 2px; color: var(--ink); font-weight: 600; }
        .sy-step-num { color: var(--ink-faint); }
      </style>
    `;a.querySelector("#sy-stage").innerHTML=u,a.querySelector("#sy-note").innerHTML=n?n.detail:'Pick a syscall and click "Next step →".'}function t(n){return String(n).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c])}p()}const j={base:{label:"Start: fresh shell",description:"Three default FDs in each process, pointing to the terminal.",procs:[{name:"shell",fds:{0:"tty (read)",1:"tty (write)",2:"tty (write)"}}]},open:{label:'fd = open("foo.txt")',description:"open() returns the lowest free FD — here 3. The file now appears in the table.",procs:[{name:"shell",fds:{0:"tty (read)",1:"tty (write)",2:"tty (write)",3:"foo.txt (file)"}}]},redirOut:{label:"shell: ls > out.txt",description:'Shell forks. Child opens out.txt (gets fd 3), then dup2(3, 1) overwrites stdout. exec("ls"). Now writes go to the file, not the terminal.',procs:[{name:"shell",fds:{0:"tty (read)",1:"tty (write)",2:"tty (write)"}},{name:"ls (child)",fds:{0:"tty (read)",1:"out.txt (file)",2:"tty (write)"}}]},pipe:{label:"shell: cat foo | grep bar",description:"pipe() returns two FDs: read end + write end. Shell forks twice, dup2 to wire cat's stdout → pipe write, grep's stdin → pipe read. Both think they're using normal stdin/stdout.",procs:[{name:"cat (child)",fds:{0:"foo.txt (file)",1:"pipe (write)",2:"tty (write)"}},{name:"grep (child)",fds:{0:"pipe (read)",1:"tty (write)",2:"tty (write)"}}],pipe:!0},socket:{label:"server: socket() + accept()",description:"A socket is just another FD. accept() returns a new FD for the client connection. Same read/write API as files.",procs:[{name:"server",fds:{0:"tty (read)",1:"tty (write)",2:"tty (write)",3:"tcp:8080 (listen)",4:"tcp client (accepted)"}}]}};function H(a){let r="base";a.innerHTML=`
    <div class="widget">
      <div class="widget-title">FD tables in action</div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="fd-scen" style="min-width: 280px;">
          ${Object.entries(j).map(([t,n])=>`<option value="${t}">${n.label}</option>`).join("")}
        </select>
      </div>

      <div class="widget-stage" id="fd-stage" style="min-height: 240px;"></div>

      <div class="callout" id="fd-note"></div>
    </div>
  `,a.querySelector("#fd-scen").addEventListener("change",t=>{r=t.target.value,d()});function d(){const t=j[r];let n='<div class="fd-procs">';t.procs.forEach(c=>{n+=`<div class="fd-proc">
        <div class="fd-proc-name">${p(c.name)}</div>
        <table class="fd-table">
          <thead><tr><th>fd</th><th>points to</th></tr></thead>
          <tbody>
            ${Object.entries(c.fds).map(([l,u])=>{const o=l==="0"?"stdin":l==="1"?"stdout":l==="2"?"stderr":"opened",i=u.includes("pipe")?"pipe":u.includes("file")||u.includes("foo")||u.includes("out")?"file":u.includes("tcp")?"sock":"tty";return`<tr><td><code>${l}</code> <span class="fd-kind">${o}</span></td><td><span class="fd-target ${i}">${p(u)}</span></td></tr>`}).join("")}
          </tbody>
        </table>
      </div>`}),n+="</div>",t.pipe&&(n+='<div class="fd-pipe-note">⤷ The "pipe (write)" in cat and "pipe (read)" in grep are <strong>two FDs pointing at the same kernel buffer</strong>. Bytes written to one come out the other.</div>'),n+=`<style>
      .fd-procs { display: grid; grid-template-columns: ${t.procs.length>1?"1fr 1fr":"1fr"}; gap: 0.6rem; }
      .fd-proc { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; }
      .fd-proc-name { font-family: var(--font-display); letter-spacing: 1.5px; font-size: 1rem; margin-bottom: 0.4em; }
      .fd-table { width: 100%; border-collapse: collapse; }
      .fd-table th, .fd-table td { padding: 0.3em 0.5em; border: 1px solid var(--ink); font-family: var(--font-mono); font-size: 0.85rem; }
      .fd-table th { background: var(--paper); font-family: var(--font-display); letter-spacing: 0.04em; font-weight: 400; font-size: 0.78rem; }
      .fd-kind { color: var(--ink-soft); font-size: 0.75rem; margin-left: 0.4em; }
      .fd-target { padding: 0.1em 0.4em; border: 1.5px solid var(--ink); border-radius: 2px; display: inline-block; }
      .fd-target.tty { background: var(--paper); }
      .fd-target.file { background: #cfe5ff; }
      .fd-target.pipe { background: #ffe9b3; }
      .fd-target.sock { background: #c8f0c8; }
      .fd-pipe-note { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; margin-top: 0.4rem; font-size: 0.88rem; }
      @media (max-width: 640px) { .fd-procs { grid-template-columns: 1fr; } }
    </style>`,a.querySelector("#fd-stage").innerHTML=n,a.querySelector("#fd-note").innerHTML=t.description}function p(t){return String(t).replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}d()}const U={race:{label:"Race condition (counter++ × 2 threads, 100 iterations each)"},deadlock:{label:"Deadlock (T1: lock M1→M2; T2: lock M2→M1)"}};function W(a){let r="race",d=!1;a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Two threads, shared state</div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="cc-scen">
          ${Object.entries(U).map(([i,e])=>`<option value="${i}">${e.label}</option>`).join("")}
        </select>
        <label id="cc-mutex-wrap"><input type="checkbox" id="cc-mutex"> use mutex</label>
        <button class="btn btn-accent" id="cc-run">Run</button>
        <button class="btn btn-ghost" id="cc-reset">Reset</button>
      </div>

      <div class="widget-stage" id="cc-stage" style="min-height: 280px;"></div>

      <div class="callout" id="cc-explain"></div>
    </div>
  `;const p=a.querySelector("#cc-stage");a.querySelector("#cc-scen").addEventListener("change",i=>{r=i.target.value,n()}),a.querySelector("#cc-mutex").addEventListener("change",i=>{d=i.target.checked}),a.querySelector("#cc-run").addEventListener("click",u),a.querySelector("#cc-reset").addEventListener("click",n);let t=null;function n(){t=null,o()}function c(){let i=0;const e=100;if(d)return i=e*2,{counter:i,expected:e*2,lost:0};let s=0;for(let f=0;f<e;f++)Math.random()<.1?s++:i++;for(let f=0;f<e;f++)Math.random()<.1?s++:i++;return{counter:i,expected:e*2,lost:s}}function l(){return{deadlock:!0}}function u(){r==="race"?t={type:"race",...c()}:t={type:"deadlock",...l()},o()}function o(){const i=a.querySelector("#cc-mutex-wrap");i.style.display=r==="race"?"inline-flex":"none";let e="";if(r==="race"){if(e=`
        <div class="cc-grid">
          <div class="cc-thread t1">
            <div class="cc-thread-name">Thread 1</div>
            <pre>for i in 1..100:
  ${d?`mu.lock()
  `:""}counter++${d?`
  mu.unlock()`:""}</pre>
          </div>
          <div class="cc-shared">
            <div class="cc-shared-label">SHARED</div>
            <div class="cc-counter">counter = ${t?t.counter:"0"}</div>
            ${d?'<div class="cc-mutex-state">🔒 mutex</div>':""}
          </div>
          <div class="cc-thread t2">
            <div class="cc-thread-name">Thread 2</div>
            <pre>for i in 1..100:
  ${d?`mu.lock()
  `:""}counter++${d?`
  mu.unlock()`:""}</pre>
          </div>
        </div>
      `,t){const f=t.counter===t.expected;e+=`<div class="cc-result ${f?"good":"bad"}">
          Final counter: <strong>${t.counter}</strong> (expected ${t.expected}). ${t.lost?`${t.lost} increments lost to races.`:"No lost updates."}
        </div>`}}else e=`
        <div class="cc-grid">
          <div class="cc-thread t1">
            <div class="cc-thread-name">Thread 1</div>
            <pre>m1.lock()
${t?`🔒 acquired M1
`:""}m2.lock()  ←  ${t?"⏳ waits forever (T2 holds M2)":""}
critical_section()
m2.unlock()
m1.unlock()</pre>
          </div>
          <div class="cc-shared">
            <div class="cc-shared-label">MUTEXES</div>
            <div class="cc-mutex-state ${t?"held-1":""}">🔒 M1 ${t?"(held by T1)":"(free)"}</div>
            <div class="cc-mutex-state ${t?"held-2":""}">🔒 M2 ${t?"(held by T2)":"(free)"}</div>
          </div>
          <div class="cc-thread t2">
            <div class="cc-thread-name">Thread 2</div>
            <pre>m2.lock()
${t?`🔒 acquired M2
`:""}m1.lock()  ←  ${t?"⏳ waits forever (T1 holds M1)":""}
critical_section()
m1.unlock()
m2.unlock()</pre>
          </div>
        </div>
      `,t&&(e+='<div class="cc-result bad">💀 <strong>Deadlock.</strong> Each thread holds one mutex and waits for the other. Neither will ever proceed.</div>');e+=`<style>
      .cc-grid { display: grid; grid-template-columns: 1fr 0.7fr 1fr; gap: 0.5rem; }
      .cc-thread { background: #cfe5ff; border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; }
      .cc-thread.t2 { background: #c8f0c8; }
      .cc-thread-name { font-family: var(--font-display); letter-spacing: 1.5px; font-size: 0.95rem; margin-bottom: 0.3em; }
      .cc-thread pre { font-family: var(--font-mono); font-size: 0.78rem; background: rgba(255,255,255,0.5); border: 1px solid var(--ink); padding: 0.4em 0.5em; border-radius: 2px; margin: 0; white-space: pre-wrap; }
      .cc-shared { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem; text-align: center; display: flex; flex-direction: column; justify-content: center; }
      .cc-shared-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
      .cc-counter { font-family: var(--font-display); font-size: 1.8rem; }
      .cc-mutex-state { font-family: var(--font-mono); font-size: 0.85rem; padding: 0.2em 0.5em; border: 1.5px solid var(--ink); border-radius: 2px; margin: 0.15em 0; background: var(--paper); }
      .cc-mutex-state.held-1 { background: #cfe5ff; }
      .cc-mutex-state.held-2 { background: #c8f0c8; }
      .cc-result { margin-top: 0.6rem; padding: 0.6rem 0.8rem; border: 2px solid var(--ink); border-radius: var(--radius); }
      .cc-result.good { background: #d6f5d6; box-shadow: 3px 3px 0 #2a8a3e; }
      .cc-result.bad { background: var(--accent-soft); box-shadow: 3px 3px 0 var(--accent); }
      @media (max-width: 720px) { .cc-grid { grid-template-columns: 1fr; } }
    </style>`,p.innerHTML=e;let s;r==="race"?t?d?s="<strong>Correct result.</strong> The mutex serialized the two threads' critical sections, so every increment counted.":s=`<strong>${t.lost} lost updates.</strong> The race is silent — your "counter++" looks atomic in source but isn't on the hardware. Add a mutex (or use atomic_fetch_add).`:s=`Click Run. Without the mutex, each thread's "counter++" can interleave at the instruction level, dropping updates.`:t?s="<strong>Classic AB-BA deadlock.</strong> Fix: agree on a global lock ordering (e.g. always M1 before M2). Tools (deadlock detectors, runtime checks, static analyzers) can catch this in development.":s="Click Run. Both threads succeed at locking their first mutex, then wait forever for the second.",a.querySelector("#cc-explain").innerHTML=s}n()}const L={pipe:{label:"Pipe",throughput:30,kernelMediated:!0,usecase:"Shell pipelines, parent↔child streaming",seq:["parent: pipe(fds) → [r=3, w=4]","parent: fork()","parent: close(3)  (only writes)","child:  close(4)  (only reads)",'parent: write(4, "hello", 5)','child:  read(3, buf, 5) → "hello"'],code:`int fd[2];
pipe(fd);
if (fork() == 0) {
  close(fd[1]);
  read(fd[0], buf, n);
} else {
  close(fd[0]);
  write(fd[1], "hello", 5);
}`},socket:{label:"Unix socket",throughput:40,kernelMediated:!0,usecase:"Docker daemon, X11, dbus, sidecar IPC — bidirectional, named",seq:['server: socket() + bind("/tmp/sock") + listen()','client: socket() + connect("/tmp/sock")',"server: accept() → connFd",'client: write(s, "hello", 5)','server: read(connFd, buf, 5) → "hello"'],code:`// server
int s = socket(AF_UNIX, SOCK_STREAM, 0);
bind(s, &addr, len);
listen(s, 5);
int c = accept(s, NULL, NULL);
read(c, buf, n);`},shm:{label:"Shared memory",throughput:100,kernelMediated:!1,usecase:"High-throughput data — databases (Postgres), graphics, ML pipelines",seq:['process A: shm_open("/x") + mmap() → ptr','process B: shm_open("/x") + mmap() → same physical page','A: strcpy(ptr, "hello")  // memory write, NO syscall',"B: read ptr  // direct memory read, NO syscall","(synchronization with mutex/semaphore is your problem)"],code:`int fd = shm_open("/x", O_CREAT | O_RDWR, 0666);
ftruncate(fd, 4096);
void *p = mmap(NULL, 4096, PROT_READ | PROT_WRITE,
               MAP_SHARED, fd, 0);
strcpy(p, "hello");`},mq:{label:"Message queue",throughput:25,kernelMediated:!0,usecase:"Discrete messages with priorities; embedded / older Unix code",seq:['A: mq_open("/q") → mqd','B: mq_open("/q") → mqd','A: mq_send(mqd, "hello", 5, prio=0)','B: mq_receive(mqd, buf, 8192, NULL) → "hello"'],code:`mqd_t q = mq_open("/q", O_CREAT | O_RDWR, 0666, &attr);
mq_send(q, "hello", 5, 0);
mq_receive(q, buf, sizeof buf, NULL);`},signal:{label:"Signal",throughput:1,kernelMediated:!0,usecase:'Notifications ("reload", "terminate") — not data',seq:["A: signal(SIGTERM, handler)","B: kill(pid_of_A, SIGTERM)","kernel: pauses A, calls handler(SIGTERM)","A handler: cleanup + exit"],code:`signal(SIGTERM, [](int){
  cleanup();
  exit(0);
});
// elsewhere
kill(other_pid, SIGTERM);`},tcp:{label:"TCP loopback",throughput:15,kernelMediated:!0,usecase:"Cross-language services where Unix sockets aren't convenient (Windows, dev environments)",seq:["server: socket(AF_INET) + bind(127.0.0.1:7000) + listen()","client: socket(AF_INET) + connect(127.0.0.1:7000)","(full TCP handshake, even on loopback)",'client: write(s, "hello", 5)','server: read(c, buf, 5) → "hello"'],code:`int s = socket(AF_INET, SOCK_STREAM, 0);
connect(s, &(struct sockaddr_in){
  .sin_family = AF_INET,
  .sin_port = htons(7000),
  .sin_addr.s_addr = htonl(INADDR_LOOPBACK),
}, sizeof addr);
write(s, "hello", 5);`}};function B(a){let r="pipe";a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Pick your IPC</div>

      <div class="controls" id="ip-tabs">
        <div class="pill-group">
          ${Object.entries(L).map(([t,n],c)=>`
            <input type="radio" name="ip-m" id="ip-${t}" value="${t}" ${c===0?"checked":""}>
            <label for="ip-${t}">${n.label}</label>
          `).join("")}
        </div>
      </div>

      <div class="widget-stage" id="ip-stage" style="min-height: 380px;"></div>
    </div>
  `,a.querySelectorAll("input[name=ip-m]").forEach(t=>t.addEventListener("change",n=>{r=n.target.value,d()}));function d(){const t=L[r],n=Math.max(...Object.values(L).map(u=>u.throughput));let l=`
      <div class="ip-grid">
        <div class="ip-bar-block">
          <div class="ip-bar-label">RELATIVE THROUGHPUT</div>
          <div class="ip-bar"><div class="ip-bar-fill" style="width: ${t.throughput/n*100}%;">${t.throughput}</div></div>
          <div class="ip-bar-axis"><span>0</span><span>${n} (shm = baseline)</span></div>
          <div class="ip-meta">
            <div><strong>Kernel-mediated:</strong> ${t.kernelMediated?"Yes (syscall per send/recv)":"No (direct memory)"}</div>
            <div><strong>Best for:</strong> ${p(t.usecase)}</div>
          </div>
        </div>

        <div class="ip-seq-block">
          <div class="ip-seq-label">EXCHANGE SEQUENCE</div>
          <ol class="ip-seq">
            ${t.seq.map(u=>`<li>${p(u)}</li>`).join("")}
          </ol>
        </div>

        <div class="ip-code-block">
          <div class="ip-seq-label">SAMPLE CODE</div>
          <pre>${p(t.code)}</pre>
        </div>
      </div>

      <style>
        .ip-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
        .ip-bar-block, .ip-seq-block, .ip-code-block { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; }
        .ip-bar-label, .ip-seq-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
        .ip-bar { height: 28px; background: var(--paper); border: 1.5px solid var(--ink); border-radius: 3px; overflow: hidden; margin-bottom: 0.2em; }
        .ip-bar-fill { height: 100%; background: var(--accent); color: white; font-family: var(--font-mono); font-size: 0.85rem; line-height: 28px; padding-left: 0.5em; }
        .ip-bar-axis { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); margin-bottom: 0.5em; }
        .ip-meta { font-family: var(--font-mono); font-size: 0.82rem; line-height: 1.6; }
        .ip-meta div { margin: 0.15em 0; }
        .ip-seq { margin: 0; padding-left: 1.2em; font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.6; }
        .ip-code-block { grid-column: 1 / -1; }
        .ip-code-block pre { margin: 0; font-family: var(--font-mono); font-size: 0.78rem; background: var(--paper); border: 1.5px solid var(--ink); padding: 0.5em 0.7em; border-radius: 2px; white-space: pre-wrap; }
        @media (max-width: 720px) { .ip-grid { grid-template-columns: 1fr; } .ip-code-block { grid-column: auto; } }
      </style>
    `;a.querySelector("#ip-stage").innerHTML=l}function p(t){return String(t).replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}d()}const $=[{id:"pid",label:"PID",hostView:"PIDs 1, 2, 3, …, 14523 (entire system)",containedView:"PIDs 1 (this proc), 2 (its child)",effect:"kill 1 outside the container kills init; kill 1 inside only kills the container."},{id:"net",label:"NET",hostView:"eth0 192.168.1.10, docker0, lo, plus 100 other veth pairs",containedView:"eth0 172.17.0.5, lo (own loopback)",effect:"Your container can bind port 80 even if the host has port 80 taken."},{id:"mnt",label:"MNT",hostView:"/, /home, /var, /etc — full host filesystem",containedView:"/ (from image), /etc/hosts, /etc/resolv.conf, /sys (limited)",effect:`Container "/" is actually an overlay mount; the host's "/" is invisible.`},{id:"uts",label:"UTS",hostView:"hostname: my-laptop",containedView:"hostname: a3f9c8d2b1e0",effect:"`hostname new-name` inside doesn't change the host."},{id:"ipc",label:"IPC",hostView:"shared mem segments + sysv queues from all processes",containedView:"only the container's own IPC objects",effect:"Two containers can't share posix shm by accident."},{id:"user",label:"USER",hostView:"uid 1000 (xthewiz), uid 0 (root), …",containedView:"uid 0 (root inside) → mapped to uid 100000 on host",effect:'Container "root" has no actual host privileges. Modern, recommended.'}],V=[{id:"cpu",label:"CPU",value:"50% of one core",desc:'cpu.max = "50000 100000"'},{id:"mem",label:"Memory",value:"512 MB",desc:'memory.max = "536870912"'},{id:"io",label:"Block I/O",value:"10 MB/s read",desc:'io.max = "8:0 rbps=10485760"'},{id:"pids",label:"Max PIDs",value:"100",desc:'pids.max = "100"'}];function K(a){const r=new Set;a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Build a container, namespace by namespace</div>

      <div class="controls">
        <strong>Namespaces:</strong>
        ${$.map(t=>`
          <label style="display: inline-flex; gap: 0.25em; align-items: center;">
            <input type="checkbox" data-ns="${t.id}"> ${t.label}
          </label>
        `).join("")}
        <button class="btn" id="ct-all">All on</button>
        <button class="btn btn-ghost" id="ct-none">Reset</button>
      </div>

      <div class="widget-stage" id="ct-stage" style="min-height: 380px;"></div>
    </div>
  `,a.querySelectorAll("input[data-ns]").forEach(t=>t.addEventListener("change",n=>{n.target.checked?r.add(n.target.dataset.ns):r.delete(n.target.dataset.ns),d()})),a.querySelector("#ct-all").addEventListener("click",()=>{$.forEach(t=>r.add(t.id)),a.querySelectorAll("input[data-ns]").forEach(t=>t.checked=!0),d()}),a.querySelector("#ct-none").addEventListener("click",()=>{r.clear(),a.querySelectorAll("input[data-ns]").forEach(t=>t.checked=!1),d()});function d(){let t=`
      <div class="ct-grid">
        <div class="ct-side host">
          <div class="ct-side-label">HOST KERNEL</div>
          <div class="ct-content">
    `;$.forEach(n=>{t+=`<div class="ct-ns-row"><strong>${n.label}:</strong> ${p(n.hostView)}</div>`}),t+=`</div></div>
        <div class="ct-side container">
          <div class="ct-side-label">CONTAINER VIEW</div>
          <div class="ct-content">
    `,$.forEach(n=>{const c=r.has(n.id);t+=`<div class="ct-ns-row ${c?"isolated":"shared"}">
        <strong>${n.label}:</strong> ${p(c?n.containedView:n.hostView)}
        ${c?'<span class="ct-tag iso">isolated</span>':'<span class="ct-tag shr">shared with host</span>'}
      </div>`}),t+=`</div></div>
      </div>

      <div class="ct-cgroups">
        <div class="ct-side-label">CGROUPS (resource limits) — always on for a real container</div>
        <div class="ct-cgroup-grid">
          ${V.map(n=>`
            <div class="ct-cgroup">
              <div class="ct-cgroup-name">${n.label}</div>
              <div class="ct-cgroup-val">${n.value}</div>
              <div class="ct-cgroup-desc">${p(n.desc)}</div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="ct-summary">
        ${r.size===0?"0 namespaces enabled — this is just a normal process. No isolation yet.":r.size===$.size?`<strong>${r.size}/${$.size} namespaces enabled — congratulations, you have a container.</strong> This is roughly what \`docker run\` configures for you.`:`${r.size}/${$.size} namespaces enabled. The rest are shared with the host — partial isolation.`}
      </div>

      <style>
        .ct-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
        .ct-side { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; }
        .ct-side.host { background: #ffe9b3; }
        .ct-side.container { background: #cfe5ff; }
        .ct-side-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.85rem; margin-bottom: 0.4em; }
        .ct-ns-row { font-family: var(--font-mono); font-size: 0.78rem; padding: 0.25em 0.4em; background: var(--paper); border: 1.5px solid var(--ink); border-radius: 2px; margin: 0.15em 0; position: relative; padding-right: 5rem; }
        .ct-ns-row.isolated { background: #d6f5d6; }
        .ct-tag { position: absolute; right: 0.4em; top: 50%; transform: translateY(-50%); font-size: 0.65rem; padding: 0.1em 0.4em; border: 1px solid var(--ink); border-radius: 2px; }
        .ct-tag.iso { background: #2a8a3e; color: white; }
        .ct-tag.shr { background: var(--paper-deep); color: var(--ink-soft); }
        .ct-cgroups { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; margin-top: 0.6rem; }
        .ct-cgroup-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; }
        .ct-cgroup { background: var(--paper); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 0.4rem 0.5rem; text-align: center; }
        .ct-cgroup-name { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.85rem; }
        .ct-cgroup-val { font-family: var(--font-mono); font-size: 0.95rem; font-weight: 600; }
        .ct-cgroup-desc { font-family: var(--font-mono); font-size: 0.65rem; color: var(--ink-soft); }
        .ct-summary { margin-top: 0.6rem; padding: 0.6rem 0.8rem; background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); box-shadow: 3px 3px 0 var(--accent); }
        @media (max-width: 720px) { .ct-grid { grid-template-columns: 1fr; } .ct-cgroup-grid { grid-template-columns: repeat(2, 1fr); } }
      </style>
    `,a.querySelector("#ct-stage").innerHTML=t}function p(t){return String(t).replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}d()}const w=a=>()=>b.jsx(D,{init:a}),J={slug:"operating-systems",title:"Operating Systems",intro:b.jsx(b.Fragment,{children:"Eight lessons walking the kernel surface — processes, threads, the scheduler, memory allocation, syscalls, file descriptors, concurrency primitives, IPC, and how containers are built from kernel features."}),lessons:[{slug:"processes",number:"01",title:"Processes vs Threads",blurb:"Same word, different boundaries. fork(), exec(), address spaces.",Widget:w(I),intro:b.jsx(b.Fragment,{children:"A process has its own address space; threads share one. The kernel schedules both, but the isolation cost is wildly different."}),sections:[],takeaways:["fork() clones the process; exec() replaces the running program in it.","Threads share heap, globals, and FDs — race conditions abound.","Process creation is ~1 ms, thread creation is ~10 μs. Use threads for parallelism within one program.","Coroutines/goroutines/async are user-space versions — even cheaper."]},{slug:"scheduler",number:"02",title:"The Scheduler",blurb:"Many tasks, few CPUs. Watch round-robin, priority, and CFS spread CPU time.",Widget:w(_),intro:b.jsx(b.Fragment,{children:"The scheduler decides who runs next. Linux\\'s CFS uses virtual runtime to keep all runnable tasks fair; priorities and cgroups bias the decision."}),sections:[],takeaways:["Round-robin: simple, fair, ignores priority. Used in nothing serious.","Priority: high-priority tasks always preempt — risk of starvation.","CFS: pick the task with the lowest virtual runtime so far. Fair but priority-aware.","Real-time schedulers (SCHED_FIFO) guarantee deadlines — at the cost of letting tasks hog the CPU."]},{slug:"memory",number:"03",title:"Memory Allocation",blurb:"malloc / free in slow motion.",Widget:w(O),intro:b.jsx(b.Fragment,{children:"The heap grows by mmap()ing pages from the kernel and handing out chunks. Fragmentation is the enemy — efficient allocators (jemalloc, tcmalloc) keep the heap dense."}),sections:[],takeaways:["malloc returns memory the kernel has reserved but not necessarily backed by RAM.","Free doesn't always give memory back to the OS — it returns to the allocator's free list.","Fragmentation: lots of free space, but no contiguous block big enough.","Modern allocators use thread-local arenas to avoid lock contention."]},{slug:"syscalls",number:"04",title:"Syscalls",blurb:"Your code runs in user mode; the kernel runs in ring 0. The trap that bridges them is the syscall.",Widget:w(N),intro:b.jsx(b.Fragment,{children:"Every disk read, every network send, every fork — they all cross into the kernel via a syscall. The transition is expensive on purpose."}),sections:[],takeaways:["User mode can't directly touch hardware — must ask the kernel.","A syscall traps to ring 0, kernel handles it, returns. ~100 ns overhead each.","Batching syscalls is critical — io_uring, sendfile, splice.","strace shows every syscall a program makes. Worth running on confusing apps."]},{slug:"fd",number:"05",title:"File Descriptors & Pipes",blurb:"In Unix everything is a file.",Widget:w(H),intro:b.jsx(b.Fragment,{children:"Every open file, socket, pipe, and device gets a small integer — the file descriptor. The kernel keeps a table mapping FD → kernel object per process."}),sections:[],takeaways:["stdin=0, stdout=1, stderr=2 by convention.","dup2 redirects an FD to point at another — the basis of shell redirection.","Pipes are pairs of FDs: write to one, read from the other.","Forgetting to close FDs leaks them — eventually you hit ulimit."]},{slug:"concurrency",number:"06",title:"Concurrency Primitives",blurb:"Two threads, one counter, racing. Wrap a mutex.",Widget:w(W),intro:b.jsx(b.Fragment,{children:"Shared mutable state across threads is the source of most bugs. Mutexes serialize access; condition variables let threads wait for state changes."}),sections:[],takeaways:["Atomicity: read-modify-write must be one indivisible operation.","Mutex: only one thread inside the critical section.","Always lock in the same global order — otherwise you deadlock.","Lock-free structures (CAS, RCU) avoid mutex contention but are very hard to get right."]},{slug:"ipc",number:"07",title:"Inter-Process Communication",blurb:"Pipes, shared memory, sockets, signals.",Widget:w(B),intro:b.jsx(b.Fragment,{children:"Processes need to talk. Choose the mechanism by latency, bandwidth, and whether you need the kernel to mediate."}),sections:[],takeaways:["Pipes/FIFOs: byte streams, kernel buffered. Easy.","Shared memory: fastest possible. Need your own locking.","Unix domain sockets: like TCP but local — supports passing FDs.","Signals: short notification, no payload. Easy to mess up."]},{slug:"containers",number:"08",title:"Containers (namespaces + cgroups)",blurb:"What Docker actually is.",Widget:w(K),intro:b.jsx(b.Fragment,{children:"Containers aren\\'t VMs. They\\'re processes with restricted views of the kernel — namespaces hide what they can see, cgroups cap what they can use."}),sections:[],takeaways:["Namespaces: PID, mount, network, user, UTS, IPC. Each hides part of the host.","cgroups: CPU shares, memory limits, IO throttling.","Docker = namespaces + cgroups + a layered filesystem + a packaging format.","Containers share the host kernel — VMs do not. Faster, less isolated."]}]};export{J as manifest};
