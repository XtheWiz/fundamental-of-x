import{j as g}from"./main-BhRPON15.js";import{L}from"./LegacyWidget-CxSoaB0i.js";function E(t){let e=Math.PI/2,i=0;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Bloch sphere (front view)</div>

      <div class="widget-stage" id="bq-stage" style="text-align: center;"></div>

      <div class="controls">
        <label>θ (latitude): <strong id="bq-tv">${e.toFixed(2)}</strong></label>
        <input type="range" min="0" max="3.1416" step="0.01" value="${e}" id="bq-t" style="flex: 1;">
      </div>
      <div class="controls">
        <label>φ (longitude): <strong id="bq-pv">${i.toFixed(2)}</strong></label>
        <input type="range" min="0" max="6.2832" step="0.01" value="${i}" id="bq-p" style="flex: 1;">
      </div>
      <div class="controls">
        <button class="btn" id="bq-0">Set to |0⟩</button>
        <button class="btn" id="bq-1">Set to |1⟩</button>
        <button class="btn" id="bq-plus">Set to |+⟩ (equator)</button>
      </div>

      <div class="metrics">
        <div class="metric"><div class="label">α (coefficient of |0⟩)</div><div class="value" id="m-alpha">—</div></div>
        <div class="metric"><div class="label">β (coefficient of |1⟩)</div><div class="value" id="m-beta">—</div></div>
        <div class="metric accent"><div class="label">P(measure 0)</div><div class="value" id="m-p0">—</div></div>
        <div class="metric accent"><div class="label">P(measure 1)</div><div class="value" id="m-p1">—</div></div>
      </div>

      <div class="callout" id="bq-explain"></div>
    </div>
  `,t.querySelector("#bq-t").addEventListener("input",n=>{e=Number(n.target.value),s()}),t.querySelector("#bq-p").addEventListener("input",n=>{i=Number(n.target.value),s()}),t.querySelector("#bq-0").addEventListener("click",()=>{e=0,i=0,r(),s()}),t.querySelector("#bq-1").addEventListener("click",()=>{e=Math.PI,i=0,r(),s()}),t.querySelector("#bq-plus").addEventListener("click",()=>{e=Math.PI/2,i=0,r(),s()});function r(){t.querySelector("#bq-t").value=e,t.querySelector("#bq-p").value=i}function s(){const a=Math.sin(e)*Math.cos(i),c=Math.cos(e),l=180+140*a,p=180-140*c;let m='<svg viewBox="0 0 360 360" width="100%" style="max-width: 360px">';m+='<circle cx="180" cy="180" r="140" fill="var(--paper-deep)" stroke="var(--ink)" stroke-width="2.5"/>',m+=`<ellipse cx="180" cy="180" rx="140" ry="${140/4}" fill="none" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="3 3"/>`,m+='<line x1="180" y1="30" x2="180" y2="330" stroke="var(--ink-soft)" stroke-width="1"/>',m+='<line x1="30" y1="180" x2="330" y2="180" stroke="var(--ink-soft)" stroke-width="1"/>',m+='<text x="180" y="25" text-anchor="middle" style="font-family: var(--font-mono); font-size: 14px; fill: var(--ink);">|0⟩</text>',m+='<text x="180" y="345" text-anchor="middle" style="font-family: var(--font-mono); font-size: 14px; fill: var(--ink);">|1⟩</text>',m+='<text x="338" y="184" style="font-family: var(--font-mono); font-size: 11px; fill: var(--ink-soft);">x (|+⟩)</text>',m+=`<line x1="180" y1="180" x2="${l}" y2="${p}" stroke="var(--accent)" stroke-width="3"/>`,m+=`<circle cx="${l}" cy="${p}" r="9" fill="var(--accent)" stroke="var(--ink)" stroke-width="2"/>`,m+="</svg>",t.querySelector("#bq-stage").innerHTML=m;const f=Math.cos(e/2),h=Math.sin(e/2)*Math.cos(i),x=Math.sin(e/2)*Math.sin(i),k=f*f,S=h*h+x*x;t.querySelector("#bq-tv").textContent=e.toFixed(2),t.querySelector("#bq-pv").textContent=i.toFixed(2),t.querySelector("#m-alpha").textContent=f.toFixed(3),t.querySelector("#m-beta").textContent=x===0?h.toFixed(3):`${h.toFixed(3)} + ${x.toFixed(3)}i`,t.querySelector("#m-p0").textContent=(k*100).toFixed(1)+"%",t.querySelector("#m-p1").textContent=(S*100).toFixed(1)+"%";let q;e<.1?q="<strong>|0⟩ pole.</strong> Always measures 0. Classical bit 0.":e>Math.PI-.1?q="<strong>|1⟩ pole.</strong> Always measures 1. Classical bit 1.":Math.abs(e-Math.PI/2)<.1?q="<strong>Equator.</strong> 50/50 on measurement. Maximally superposed — neither 0 nor 1 until measured.":q=`Off the poles: ${(k*100).toFixed(0)}% chance of 0, ${(S*100).toFixed(0)}% chance of 1.`,t.querySelector("#bq-explain").innerHTML=q}s()}function H(t){let e=Math.PI/3,i=[];t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Run measurements, watch frequencies converge</div>

      <div class="controls">
        <label>State preparation θ: <strong id="sp-tv">${e.toFixed(2)}</strong></label>
        <input type="range" min="0" max="3.1416" step="0.05" value="${e}" id="sp-t" style="flex: 1;">
      </div>
      <div class="controls">
        <button class="btn btn-accent" id="sp-one">Measure 1×</button>
        <button class="btn" id="sp-ten">Measure 10×</button>
        <button class="btn" id="sp-100">Measure 100×</button>
        <button class="btn btn-ghost" id="sp-reset">Reset</button>
      </div>

      <div class="widget-stage" id="sp-stage" style="min-height: 240px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Theoretical P(0)</div><div class="value" id="m-p0">—</div></div>
        <div class="metric"><div class="label">Empirical P(0)</div><div class="value" id="m-e0">—</div></div>
        <div class="metric accent"><div class="label">Measurements</div><div class="value" id="m-n">0</div></div>
      </div>
    </div>
  `,t.querySelector("#sp-t").addEventListener("input",n=>{e=Number(n.target.value),i=[],s()}),t.querySelector("#sp-one").addEventListener("click",()=>r(1)),t.querySelector("#sp-ten").addEventListener("click",()=>r(10)),t.querySelector("#sp-100").addEventListener("click",()=>r(100)),t.querySelector("#sp-reset").addEventListener("click",()=>{i=[],s()});function r(n){const o=Math.cos(e/2)**2;for(let u=0;u<n;u++)i.push(Math.random()<o?0:1);s()}function s(){const n=Math.cos(e/2)**2,o=1-n,u=i.length,v=i.filter(f=>f===0).length,d=u-v,a=480,c=240,l=40;let p=`<svg viewBox="0 0 ${a} ${c}" width="100%" style="max-width: ${a}px">`;const m=80;if(p+=`<text style="font-family: var(--font-mono); font-size: 11px; fill: var(--ink-soft);" x="${a/2}" y="20" text-anchor="middle">theoretical (gray) vs empirical (red)</text>`,p+=`<rect x="${a/4-m}" y="${c-l-n*(c-2*l)}" width="${m}" height="${n*(c-2*l)}" fill="#aaa" stroke="var(--ink)" stroke-width="1"/>`,p+=`<rect x="${a/2+20}" y="${c-l-o*(c-2*l)}" width="${m}" height="${o*(c-2*l)}" fill="#aaa" stroke="var(--ink)" stroke-width="1"/>`,u>0){const f=v/u,h=d/u;p+=`<rect x="${a/4}" y="${c-l-f*(c-2*l)}" width="${m}" height="${f*(c-2*l)}" fill="var(--accent)" stroke="var(--ink)" stroke-width="1.5"/>`,p+=`<rect x="${a/2+100}" y="${c-l-h*(c-2*l)}" width="${m}" height="${h*(c-2*l)}" fill="var(--accent)" stroke="var(--ink)" stroke-width="1.5"/>`}p+=`<line x1="${l}" y1="${c-l}" x2="${a-l}" y2="${c-l}" stroke="var(--ink)" stroke-width="1.5"/>`,p+=`<text x="${a/4-m/2+40}" y="${c-l+18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 12px;">|0⟩</text>`,p+=`<text x="${a/2+20+m/2+40}" y="${c-l+18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 12px;">|1⟩</text>`,p+="</svg>",t.querySelector("#sp-stage").innerHTML=p,t.querySelector("#sp-tv").textContent=e.toFixed(2),t.querySelector("#m-p0").textContent=(n*100).toFixed(1)+"%",t.querySelector("#m-e0").textContent=u===0?"—":(100*v/u).toFixed(1)+"%",t.querySelector("#m-n").textContent=u}s()}function A(t){let e=!0,i=[];t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Bell pair (|00⟩ + |11⟩)/√2 — vs an unentangled product state</div>

      <div class="controls">
        <label>State:</label>
        <div class="pill-group">
          <input type="radio" name="en-s" id="en-bell" value="bell" checked>
          <label for="en-bell">Bell pair (entangled)</label>
          <input type="radio" name="en-s" id="en-prod" value="prod">
          <label for="en-prod">Product (|+⟩|+⟩)</label>
        </div>
        <button class="btn btn-accent" id="en-meas">Measure both qubits 1×</button>
        <button class="btn" id="en-meas100">Measure 100×</button>
        <button class="btn btn-ghost" id="en-reset">Reset</button>
      </div>

      <div class="widget-stage" id="en-stage" style="min-height: 220px;"></div>

      <div class="callout" id="en-explain"></div>
    </div>
  `,t.querySelectorAll("input[name=en-s]").forEach(n=>n.addEventListener("change",o=>{e=o.target.value==="bell",i=[],s()})),t.querySelector("#en-meas").addEventListener("click",()=>r(1)),t.querySelector("#en-meas100").addEventListener("click",()=>r(100)),t.querySelector("#en-reset").addEventListener("click",()=>{i=[],s()});function r(n){for(let o=0;o<n;o++)if(e){const u=Math.random()<.5?0:1;i.push({a:u,b:u})}else i.push({a:Math.random()<.5?0:1,b:Math.random()<.5?0:1});s()}function s(){const n={"00":0,"01":0,10:0,11:0};i.forEach(d=>n[`${d.a}${d.b}`]++);const o=i.length;let u=`
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem;">
        ${["00","01","10","11"].map(d=>{const a=n[d],c=o===0?0:a/o*100,l=e?d==="00"||d==="11"?50:0:25;return`<div style="background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 1.1rem;">${d}</div>
            <div style="font-family: var(--font-display); font-size: 1.8rem; color: ${c>1?"var(--accent)":"var(--ink-faint)"};">${c.toFixed(0)}%</div>
            <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft);">expected ${l}%</div>
          </div>`}).join("")}
      </div>
      <div style="margin-top: 0.6rem; font-family: var(--font-mono); font-size: 0.85rem;">${o} measurements — pairs (a, b)</div>
    `;t.querySelector("#en-stage").innerHTML=u;let v;o===0?v="Pick a state and click measure.":e?v="<strong>Bell pair:</strong> outcomes are 100% correlated. You only see 00 or 11. Same measurement on Alice and Bob always agrees, even though each is individually 50/50.":v="<strong>Product state:</strong> each qubit is independently 50/50. You see all four outcomes 25% of the time. No correlation.",t.querySelector("#en-explain").innerHTML=v}s()}function F(t){let e={a:{re:1,im:0},b:{re:0,im:0}},i=["|0⟩"];function r(){e={a:{re:1,im:0},b:{re:0,im:0}},i=["|0⟩"]}function s(){e={a:e.b,b:e.a},i.push("X")}function n(){e={a:e.a,b:{re:-e.b.re,im:-e.b.im}},i.push("Z")}function o(){const a=1/Math.sqrt(2),c={re:a*(e.a.re+e.b.re),im:a*(e.a.im+e.b.im)},l={re:a*(e.a.re-e.b.re),im:a*(e.a.im-e.b.im)};e={a:c,b:l},i.push("H")}t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Apply gates to a single qubit</div>

      <div class="controls">
        <button class="btn btn-accent" id="g-x">X (bit flip)</button>
        <button class="btn btn-accent" id="g-z">Z (phase flip)</button>
        <button class="btn btn-accent" id="g-h">H (Hadamard)</button>
        <button class="btn btn-ghost" id="g-reset">Reset to |0⟩</button>
      </div>

      <div class="widget-stage" id="g-stage" style="min-height: 240px;"></div>

      <div class="callout" id="g-explain"></div>
    </div>
  `,t.querySelector("#g-x").addEventListener("click",()=>{s(),d()}),t.querySelector("#g-z").addEventListener("click",()=>{n(),d()}),t.querySelector("#g-h").addEventListener("click",()=>{o(),d()}),t.querySelector("#g-reset").addEventListener("click",()=>{r(),d()});function u(a){return Math.abs(a.im)<1e-6?a.re.toFixed(3):Math.abs(a.re)<1e-6?a.im.toFixed(3)+"i":`${a.re.toFixed(3)} ${a.im>=0?"+":""}${a.im.toFixed(3)}i`}function v(a){return a.re*a.re+a.im*a.im}function d(){const a=v(e.a),c=v(e.b),l=`
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 0.6rem;">
        <div class="qc-state" style="text-align: center;">
          <div style="font-size: 0.75rem; color: var(--ink-soft);">α</div>
          <div style="font-size: 1.1rem; font-weight: 600;">${u(e.a)}</div>
          <div style="font-size: 0.78rem; color: var(--ink-soft);">|α|² = ${a.toFixed(3)} → P(0) = ${(a*100).toFixed(1)}%</div>
        </div>
        <div class="qc-state" style="text-align: center;">
          <div style="font-size: 0.75rem; color: var(--ink-soft);">β</div>
          <div style="font-size: 1.1rem; font-weight: 600;">${u(e.b)}</div>
          <div style="font-size: 0.78rem; color: var(--ink-soft);">|β|² = ${c.toFixed(3)} → P(1) = ${(c*100).toFixed(1)}%</div>
        </div>
      </div>
      <div><strong>Gate history:</strong> ${i.join(" → ")}</div>
    `;t.querySelector("#g-stage").innerHTML=l;let p;const m=i[i.length-1];m==="X"?p="<strong>X applied.</strong> Swapped α and β — bit flip.":m==="Z"?p="<strong>Z applied.</strong> Flipped the sign of β. Doesn't change measurement probabilities, but matters in interference.":m==="H"?p="<strong>H applied.</strong> Created superposition (if input was a pole) or returned to a pole (if input was equator). H · H = identity.":p="<strong>|0⟩.</strong> Pure 0 state — every measurement returns 0.",t.querySelector("#g-explain").innerHTML=p}d()}const w=[{label:"|00⟩",amps:{"00":1,"01":0,10:0,11:0}},{label:"H on q0 → (|00⟩ + |10⟩)/√2",amps:{"00":.707,"01":0,10:.707,11:0}},{label:"CNOT (q0→q1) → (|00⟩ + |11⟩)/√2 (Bell pair!)",amps:{"00":.707,"01":0,10:0,11:.707}}];function C(t){let e=0,i=[];t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Bell pair circuit</div>

      <div class="controls">
        <button class="btn" id="cc-prev">← Back</button>
        <button class="btn btn-accent" id="cc-next">Next gate →</button>
        <button class="btn" id="cc-meas">Measure 100×</button>
        <button class="btn btn-ghost" id="cc-reset">Reset</button>
      </div>

      <div class="widget-stage" id="cc-stage" style="min-height: 300px;"></div>

      <div class="callout" id="cc-explain"></div>
    </div>
  `,t.querySelector("#cc-prev").addEventListener("click",()=>{e>0&&e--,i=[],r()}),t.querySelector("#cc-next").addEventListener("click",()=>{e<w.length-1&&e++,i=[],r()}),t.querySelector("#cc-meas").addEventListener("click",()=>{const n=w[e].amps;for(let o=0;o<100;o++){const u=Math.random();let v=0;for(const d of["00","01","10","11"])if(v+=n[d]**2,u<v){i.push(d);break}}r()}),t.querySelector("#cc-reset").addEventListener("click",()=>{e=0,i=[],r()});function r(){const n=w[e];let o=`
      <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; font-family: var(--font-mono); margin-bottom: 0.6rem;">
        <div style="font-size: 0.75rem; color: var(--ink-soft);">CURRENT STATE</div>
        <div style="font-size: 1.1rem; margin-top: 0.3em;">${s(n.label)}</div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem;">
        ${["00","01","10","11"].map(v=>{const d=n.amps[v],a=d*d;return`<div style="background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 0.9rem;">|${v}⟩</div>
            <div style="font-family: var(--font-mono); font-size: 0.8rem;">amp ${d.toFixed(3)}</div>
            <div style="height: 60px; display: flex; align-items: flex-end; justify-content: center; margin-top: 0.3rem;">
              <div style="width: 50%; height: ${a*100}%; background: var(--accent); border: 1.5px solid var(--ink); border-radius: 2px;"></div>
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-soft);">P = ${(a*100).toFixed(0)}%</div>
          </div>`}).join("")}
      </div>
    `;if(i.length){const v={"00":0,"01":0,10:0,11:0};i.forEach(d=>v[d]++),o+=`<div style="margin-top: 0.8rem;"><strong>Measured ${i.length}×:</strong> ${Object.entries(v).map(([d,a])=>`${d}: ${a}`).join(" · ")}</div>`}t.querySelector("#cc-stage").innerHTML=o;let u;e===0?u="<strong>Initial state |00⟩.</strong> Both qubits in 0. 100% probability on |00⟩.":e===1?u="<strong>After H on q0.</strong> First qubit is now in superposition. Note we don't have entanglement yet — q1 is still |0⟩ if you look at it alone.":u="<strong>Bell pair!</strong> CNOT linked the qubits. Now you only see |00⟩ or |11⟩ — never |01⟩ or |10⟩. Pure entanglement.",t.querySelector("#cc-explain").innerHTML=u}function s(n){return String(n).replace(/[&<>]/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;"})[o])}r()}const b=16,$=11;function z(t){const e=t.slice();e[$]=-e[$];const i=e.reduce((r,s)=>r+s,0)/b;return e.map(r=>2*i-r)}function N(t){let e=new Array(b).fill(1/Math.sqrt(b)),i=0;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Grover search over 16 items (target = #${$})</div>

      <div class="controls">
        <button class="btn btn-accent" id="gv-step">Next iteration</button>
        <button class="btn btn-ghost" id="gv-reset">Reset</button>
      </div>

      <div class="widget-stage" id="gv-stage" style="min-height: 240px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Iteration</div><div class="value" id="m-iter">0</div></div>
        <div class="metric accent"><div class="label">P(target)</div><div class="value" id="m-pt">—</div></div>
        <div class="metric"><div class="label">Optimal iterations</div><div class="value">~${Math.round(Math.PI/4*Math.sqrt(b))}</div></div>
      </div>

      <div class="callout" id="gv-explain"></div>
    </div>
  `,t.querySelector("#gv-step").addEventListener("click",()=>{e=z(e),i++,r()}),t.querySelector("#gv-reset").addEventListener("click",()=>{e=new Array(b).fill(1/Math.sqrt(b)),i=0,r()});function r(){const u=540/b-2;let v='<svg viewBox="0 0 600 240" width="100%" style="max-width: 600px">';v+=`<line x1="30" y1="${240/2}" x2="570" y2="${240/2}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="3 3"/>`,v+=`<text class="ml-axis-text" x="24" y="${240/2+4}" text-anchor="end">0</text>`;for(let l=0;l<b;l++){const p=e[l],m=30+l*(u+2),f=Math.abs(p)*160,h=p>=0?240/2-f:240/2,x=l===$,k=x?"var(--accent)":p<0?"#aaa":"#1c6dd0";v+=`<rect x="${m}" y="${h}" width="${u}" height="${f}" fill="${k}" stroke="var(--ink)" stroke-width="1"/>`,v+=`<text class="ml-axis-text" x="${m+u/2}" y="${240-30/2}" text-anchor="middle" style="${x?"fill: var(--accent); font-weight: 700;":""}">${l}</text>`}v+="</svg>",t.querySelector("#gv-stage").innerHTML=v;const d=e[$]**2;t.querySelector("#m-iter").textContent=i,t.querySelector("#m-pt").textContent=(d*100).toFixed(1)+"%";const a=Math.round(Math.PI/4*Math.sqrt(b));let c;i===0?c="Uniform superposition: every item equally likely. Step the algorithm to amplify the target.":i<a-1?c=`Amplitude of target is growing. After ~${a} iterations it'll be near 1.`:i<=a+1?c=`<strong>Peak.</strong> Measure now — you'll get the target with probability ${(d*100).toFixed(0)}%.`:c="<strong>Overshot.</strong> Grover amplitude oscillates — too many iterations and it cycles back down. Stop at the optimum.",t.querySelector("#gv-explain").innerHTML=c}r()}const M=[{rsaBits:1024,classicalYears:1,qubitsNeeded:2050,notes:"Already deprecated (since 2013)."},{rsaBits:2048,classicalYears:1e9,qubitsNeeded:4096,notes:"Current standard for HTTPS."},{rsaBits:3072,classicalYears:1e13,qubitsNeeded:6144,notes:"Recommended for new keys."},{rsaBits:4096,classicalYears:1e17,qubitsNeeded:8192,notes:"Used for long-lived root CAs."}];function P(t){let e=1;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">RSA key size vs quantum requirements</div>

      <div class="controls">
        <label>RSA key size:</label>
        <div class="pill-group">
          ${M.map((s,n)=>`
            <input type="radio" name="sh-k" id="sh-${n}" value="${n}" ${n===e?"checked":""}>
            <label for="sh-${n}">${s.rsaBits}-bit</label>
          `).join("")}
        </div>
      </div>

      <div class="widget-stage" id="sh-stage" style="min-height: 220px;"></div>

      <div class="callout" id="sh-explain"></div>
    </div>
  `,t.querySelectorAll("input[name=sh-k]").forEach(s=>s.addEventListener("change",n=>{e=Number(n.target.value),r()}));function i(s){return s<1?`${(s*365).toFixed(1)} days`:s<1e3?`${s.toLocaleString()} years`:s<1e6?`${(s/1e3).toFixed(0)}k years`:s<1e9?`${(s/1e6).toFixed(0)} million years`:s<1e12?`${(s/1e9).toFixed(0)} billion years`:`${(s/1e12).toPrecision(2)} trillion years`}function r(){const s=M[e],n=s.qubitsNeeded*1e3;let o=`
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
        <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; box-shadow: 3px 3px 0 #2a8a3e;">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase;">CLASSICAL BREAK TIME</div>
          <div style="font-family: var(--font-display); font-size: 1.6rem;">${i(s.classicalYears)}</div>
          <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft);">on all of today's supercomputers combined</div>
        </div>
        <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; box-shadow: 3px 3px 0 var(--accent);">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase;">SHOR ON QUANTUM</div>
          <div style="font-family: var(--font-display); font-size: 1.6rem;">~8 hours</div>
          <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft);">if you had a fault-tolerant machine</div>
        </div>
      </div>
      <div style="margin-top: 0.6rem; background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem;">
        <div style="font-family: var(--font-display); letter-spacing: 1px;">Quantum requirements</div>
        <div style="font-family: var(--font-mono); font-size: 0.9rem; margin-top: 0.4em;">
          • Logical qubits: <strong>~${s.qubitsNeeded.toLocaleString()}</strong><br>
          • Physical qubits (with current surface-code overhead): <strong>~${n.toLocaleString()}</strong><br>
          • Today's largest: ~1,200 noisy physical qubits.
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4em;">${s.notes}</div>
      </div>
    `;t.querySelector("#sh-stage").innerHTML=o,t.querySelector("#sh-explain").innerHTML=`The gap between today's ~1k physical qubits and the millions needed is the whole story. Useful Shor is a 10–30 year horizon — long enough that "harvest now, decrypt later" attacks are already a concern, which is why post-quantum migration is happening now.`}r()}const T=[{label:"Today (~2024)",perGate:.005},{label:"Best demonstrated",perGate:.001},{label:"Threshold for QEC",perGate:1e-4},{label:"Future (FT)",perGate:1e-6}],R={"Toy Grover (16 items)":50,"Toy quantum chemistry":500,"Useful Shor on 2048-bit RSA":1e10,"Quantum advantage in ML":1e6};function W(t){let e=0;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Error rate → max useful circuit depth</div>

      <div class="controls">
        <label>Error rate:</label>
        <div class="pill-group">
          ${T.map((r,s)=>`
            <input type="radio" name="nq-r" id="nq-${s}" value="${s}" ${s===0?"checked":""}>
            <label for="nq-${s}">${r.label}</label>
          `).join("")}
        </div>
      </div>

      <div class="widget-stage" id="nq-stage" style="min-height: 280px;"></div>

      <div class="callout" id="nq-explain"></div>
    </div>
  `,t.querySelectorAll("input[name=nq-r]").forEach(r=>r.addEventListener("change",s=>{e=Number(s.target.value),i()}));function i(){const r=T[e],s=.1/r.perGate;let n=`
      <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; margin-bottom: 0.6rem;">
        <div style="font-family: var(--font-mono); font-size: 0.8rem;">Per-gate error rate: <strong>${(r.perGate*100).toFixed(4)}%</strong></div>
        <div style="font-family: var(--font-mono); font-size: 0.8rem;">Max useful circuit depth: <strong>${Math.round(s).toLocaleString()}</strong> gates</div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.3rem;">
        ${Object.entries(R).map(([u,v])=>{const d=v<=s;return`<div style="display: grid; grid-template-columns: 1fr 100px 100px; gap: 0.5rem; align-items: center; padding: 0.35em 0.7em; background: ${d?"#d6f5d6":"var(--accent-soft)"}; border: 1.5px solid var(--ink); border-radius: 3px;">
            <div style="font-family: var(--font-mono); font-size: 0.85rem;">${u}</div>
            <div style="font-family: var(--font-mono); font-size: 0.78rem; text-align: right;">needs ${v.toLocaleString()}</div>
            <div style="font-family: var(--font-display); font-size: 0.95rem; text-align: center;">${d?"✓ OK":"✗ noise dominates"}</div>
          </div>`}).join("")}
      </div>
    `;t.querySelector("#nq-stage").innerHTML=n;let o;e===0?o="Today's machines can run shallow circuits — small Grover, NISQ-friendly chemistry. Anything deep gets drowned in noise. That's why useful Shor is still science fiction.":e<=1?o="Best lab demos. Most academic papers' results are run here, briefly, before noise wins.":e===2?o="<strong>Threshold for surface-code error correction.</strong> Below this, encoding more qubits actually <em>reduces</em> the logical error rate. We're inching past this in 2024–2025.":o="<strong>The fault-tolerant regime.</strong> With error correction on top of this, billions of gates become possible. This is what Shor needs. Decades away at current rate of progress.",t.querySelector("#nq-explain").innerHTML=o}i()}const y=t=>()=>g.jsx(L,{init:t}),j={slug:"quantum-computing",title:"Quantum Computing",intro:g.jsx(g.Fragment,{children:"Eight lessons walking from a single qubit on the Bloch sphere up to Grover's and Shor's algorithms — and an honest look at why useful quantum computing is still decades away."}),lessons:[{slug:"bits-vs-qubits",number:"01",title:"Bits vs Qubits",blurb:"A classical bit is 0 or 1. A qubit is a vector on a sphere.",Widget:y(E),intro:g.jsx(g.Fragment,{children:"A bit has two states. A qubit has infinitely many — any point on the surface of the Bloch sphere. The two poles correspond to classical 0 and 1."}),sections:[],takeaways:["A qubit is a 2D complex unit vector, visualized as a point on a sphere.","|0⟩ and |1⟩ sit at the poles; everything else is a superposition.","Operations on qubits are rotations of the sphere.","The vector is hidden from us — only measurement reveals it (probabilistically)."]},{slug:"superposition",number:"02",title:"Superposition & Measurement",blurb:"A qubit can be in a mix of |0⟩ and |1⟩. Measure it and the mix collapses.",Widget:y(H),intro:g.jsx(g.Fragment,{children:"A qubit holds amplitudes for both 0 and 1 simultaneously. Measuring collapses it to one or the other, with probabilities given by the amplitudes squared."}),sections:[],takeaways:["Superposition: |ψ⟩ = α|0⟩ + β|1⟩ with |α|² + |β|² = 1.","Measurement is irreversible — you can't un-collapse.","The randomness is intrinsic, not from hidden variables (Bell's theorem).","Quantum algorithms manipulate amplitudes before the final measurement."]},{slug:"entanglement",number:"03",title:"Entanglement",blurb:"Two qubits, one shared state. Measure either and the other is determined.",Widget:y(A),intro:g.jsx(g.Fragment,{children:"Entangled qubits can\\'t be described separately — only as one combined state. Measure either and the outcome of the other is instantly fixed, no matter how far apart."}),sections:[],takeaways:["Bell pair: (|00⟩ + |11⟩)/√2. Always correlated when measured.","No information travels faster than light — outcomes are random until measured.","Required for quantum speedups; classical can't reproduce.","Created by an entangling gate (CNOT after Hadamard, typically)."]},{slug:"gates",number:"04",title:"Quantum Gates",blurb:"H, X, Z, CNOT — the building blocks.",Widget:y(F),intro:g.jsx(g.Fragment,{children:"Quantum gates are unitary matrices — they rotate the qubit state vector. Every gate is reversible by definition (because measurement is the only irreversible step)."}),sections:[],takeaways:["X = quantum NOT. Flips |0⟩ and |1⟩.","H = Hadamard. Creates superposition from a basis state.","Z = phase flip. Z|1⟩ = −|1⟩.","CNOT entangles a target qubit conditionally on the control."]},{slug:"circuits",number:"05",title:"Quantum Circuits",blurb:"Compose gates into a circuit.",Widget:y(C),intro:g.jsx(g.Fragment,{children:"Quantum circuits look like guitar tabs — each horizontal wire is a qubit, gates apply at points in time. The output is a probabilistic measurement at the end."}),sections:[],takeaways:["Bell pair: H on qubit 0, then CNOT(0 → 1). Measure both — always 00 or 11.","Circuit depth (number of sequential gates) is what decoherence limits.","IBM, Google, IonQ — different qubit techs, same gate model.","Qiskit, Cirq, Q# let you write and simulate circuits."]},{slug:"grover",number:"06",title:"Grover's Algorithm",blurb:"Search an unsorted database of N items in √N steps.",Widget:y(N),intro:g.jsx(g.Fragment,{children:"Classically, finding a marked item among N takes N/2 lookups on average. Grover\\'s does it in roughly √N — a quadratic speedup, provably optimal for unstructured search."}),sections:[],takeaways:["Speedup is quadratic, not exponential. Real but modest.","Each iteration amplifies the marked item's amplitude.","Useful for SAT, hash inversion, generic search.","Doesn't break crypto on its own — Grover halves the effective bit security."]},{slug:"shor",number:"07",title:"Shor & Post-Quantum",blurb:"Shor's algorithm factors integers in polynomial time.",Widget:y(P),intro:g.jsx(g.Fragment,{children:"Shor turns integer factoring into a period-finding problem on which quantum has an exponential speedup. RSA and elliptic-curve crypto fall once enough qubits exist."}),sections:[],takeaways:["Polynomial time for factoring — breaks RSA and ECDH.","Currently broken on toy inputs only (15 = 3 × 5, etc.).","Likely needs millions of high-quality qubits to break real RSA.","NIST has standardized post-quantum algorithms (Kyber, Dilithium)."]},{slug:"nisq",number:"08",title:"NISQ, Noise & Error Correction",blurb:"Real qubits are fragile.",Widget:y(W),intro:g.jsx(g.Fragment,{children:"Today\\'s quantum hardware is Noisy Intermediate-Scale Quantum — 100–1000 qubits, but each loses coherence in microseconds. Error correction needs ~1000 physical qubits per logical one."}),sections:[],takeaways:["Coherence times: microseconds for superconducting, longer for ion trap.","Gate fidelity: ~99.9% sounds good, terrible across 10000 gates.","Surface code: leading error-correction scheme.","Useful fault-tolerant QC is probably 10+ years away. NISQ-era results are narrow."]}]};export{j as manifest};
