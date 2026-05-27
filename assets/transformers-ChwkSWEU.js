import{j as u}from"./main-Dfqj_VUe.js";import{L as j}from"./LegacyWidget-CUf1c2G7.js";const N=["ing","ed","er","est","s","ly","tion","ment","ness","ize"];function z(e){const t=[],n=e.split(/(\s+)/).filter(o=>o.length);for(const o of n){if(/^\s+$/.test(o))continue;let i=o;const r=[];for(const a of N)if(i.length>a.length+2&&i.toLowerCase().endsWith(a)){r.unshift(i.slice(-a.length)),i=i.slice(0,-a.length);break}if(i.length>8){const a=Math.floor(i.length/2);t.push((t.length===0?"":" ")+i.slice(0,a)),t.push(i.slice(a))}else t.push((t.length===0?"":" ")+i);r.forEach(a=>t.push(a))}return t}function H(e,t=12){let n=0;for(const i of e)n=n*31+i.charCodeAt(0)|0;const o=[];for(let i=0;i<t;i++)n=n*1103515245+12345|0,o.push(((n&255)/255-.5).toFixed(2));return o}function W(e){let t="The quick brown fox jumps fundamentally.";e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Type, watch it become tokens</div>

      <div class="controls">
        <input class="field" id="tk-text" value="${t}" style="flex: 1; min-width: 280px; font-family: var(--font-mono);">
      </div>

      <div class="widget-stage" id="tk-stage" style="min-height: 220px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Tokens</div><div class="value" id="m-tokens">0</div></div>
        <div class="metric"><div class="label">Characters</div><div class="value" id="m-chars">0</div></div>
        <div class="metric accent"><div class="label">Chars / token</div><div class="value" id="m-ratio">—</div></div>
      </div>

      <div class="callout" id="tk-explain">Hover a token to see its (simulated) 12-d embedding. Real models use 512+ dims.</div>
    </div>
  `,e.querySelector("#tk-text").addEventListener("input",i=>{t=i.target.value,n()});function n(){const i=z(t),r=i.map((a,s)=>`<span class="tf-token" data-i="${s}" title="embedding: [${H(a).join(", ")}]">${o(a.replace(/ /g,"·"))}</span>`).join("");e.querySelector("#tk-stage").innerHTML=`
      <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 0.6rem;">Tokens (hover for embedding; · = leading space):</div>
      <div style="line-height: 2;">${r}</div>
      <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-top: 0.8rem;">Hovered token's embedding:</div>
      <div id="tk-embed" style="font-family: var(--font-mono); font-size: 0.78rem; padding: 0.5rem 0.7rem; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: 4px; min-height: 30px;">(hover a token)</div>
    `,e.querySelectorAll(".tf-token").forEach((a,s)=>{a.addEventListener("mouseenter",()=>{e.querySelector("#tk-embed").textContent=`[${H(i[s]).join(", ")}]`})}),e.querySelector("#m-tokens").textContent=i.length,e.querySelector("#m-chars").textContent=t.length,e.querySelector("#m-ratio").textContent=i.length?(t.length/i.length).toFixed(2):"—"}function o(i){return String(i).replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r])}n()}const g=["The","cat","sat","on","the","mat","because","it","was","tired"];function D(){const e=g.length,t=[];for(let n=0;n<e;n++){const o=new Array(e).fill(0);for(let s=0;s<e;s++){let l=.02;n===s&&(l+=.2);const m=Math.abs(n-s);l+=Math.max(0,.5-m*.08),g[n]==="it"&&g[s]==="cat"&&(l+=1.5),g[n]==="tired"&&(g[s]==="cat"||g[s]==="it")&&(l+=.8),g[n]==="The"&&g[s]==="cat"&&(l+=.4),g[n]==="the"&&g[s]==="mat"&&(l+=.4),o[s]=l}const i=Math.max(...o),r=o.map(s=>Math.exp(s-i)),a=r.reduce((s,l)=>s+l);for(let s=0;s<e;s++)o[s]=r[s]/a;t.push(o)}return t}function B(e){const t=D();let n=g.indexOf("it");e.innerHTML=`
    <div class="widget">
      <div class="widget-title">"${g.join(" ")}"</div>
      <p class="widget-hint">Click any token to make it the <em>query</em>. The intensity of each other token shows how much attention the query pays to it.</p>

      <div class="widget-stage" id="at-stage" style="min-height: 280px;"></div>

      <div class="callout" id="at-explain"></div>
    </div>
  `;function o(){let i=`
      <div style="margin-bottom: 0.8rem;">
        <strong>Query token:</strong>
        ${g.map((a,s)=>`<button class="at-tok ${s===n?"q":""}" data-i="${s}" style="font-family: var(--font-mono); font-size: 0.9rem; padding: 0.25em 0.6em; margin: 0.1em; border: 2px solid var(--ink); border-radius: 3px; background: ${s===n?"var(--accent)":"var(--paper)"}; color: ${s===n?"white":"var(--ink)"}; cursor: pointer;">${a}</button>`).join("")}
      </div>

      <div style="margin: 1rem 0 0.5rem;"><strong>Attention from "${g[n]}" to each token:</strong></div>
      <div style="display: flex; gap: 0.15rem; flex-wrap: wrap;">
        ${g.map((a,s)=>{const l=t[n][s],m=l;return`<div style="font-family: var(--font-mono); font-size: 0.9rem; padding: 0.35em 0.7em; border: 1.5px solid var(--ink); border-radius: 3px; background: rgba(214, 40, 40, ${m}); color: ${m>.4?"white":"var(--ink)"};">${a}<br><span style="font-size: 0.65rem; opacity: 0.85;">${(l*100).toFixed(1)}%</span></div>`}).join("")}
      </div>

      <div style="margin-top: 1.2rem;"><strong>Full attention matrix</strong> (queries down, keys across):</div>
      <div style="overflow-x: auto;">
        <table style="border-collapse: collapse; margin-top: 0.4rem; font-family: var(--font-mono); font-size: 0.7rem;">
          <thead><tr><td></td>${g.map(a=>`<th style="padding: 0.15em 0.3em; text-align: center; transform: rotate(-30deg); transform-origin: bottom left;">${a}</th>`).join("")}</tr></thead>
          <tbody>
            ${g.map((a,s)=>`
              <tr>
                <th style="padding: 0.15em 0.4em; text-align: right;">${a}</th>
                ${g.map((l,m)=>{const p=t[s][m];return`<td style="width: 28px; height: 28px; background: rgba(214, 40, 40, ${p}); border: 1px solid var(--ink-soft); text-align: center; color: ${p>.4?"white":"var(--ink)"};">${p>.05?(p*100).toFixed(0):""}</td>`}).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;e.querySelector("#at-stage").innerHTML=i,e.querySelectorAll(".at-tok").forEach(a=>{a.addEventListener("click",()=>{n=Number(a.dataset.i),o()})});const r=t[n].map((a,s)=>({w:a,t:g[s]})).sort((a,s)=>s.w-a.w).slice(0,3);e.querySelector("#at-explain").innerHTML=`<strong>"${g[n]}" attends most to:</strong> ${r.map(a=>`<code>${a.t}</code> (${(a.w*100).toFixed(0)}%)`).join(", ")}. ${g[n]==="it"?`"It" correctly resolves to "cat" — that's coreference, learned from data.`:""}`}o()}const f=["The","cat","sat","on","the","mat","because","it","was","tired"],L=[{name:"Head 1 — previous token",desc:"Each token attends mostly to the one just before it. Useful for n-gram-like patterns.",score:(e,t)=>e-t===1?2.5:e===t?.5:-2},{name:"Head 2 — coreference",desc:'Pronouns ("it") learn to attend to their antecedents ("cat").',score:(e,t)=>f[e]==="it"&&f[t]==="cat"?3:f[e]==="tired"&&f[t]==="cat"?1.5:e===t?.3:-1},{name:"Head 3 — article→noun",desc:'"The"/"the" learns to look forward to the noun it modifies.',score:(e,t)=>f[e]==="The"&&t===e+1||f[e]==="the"&&t===e+1?3:e===t?.2:-1},{name:"Head 4 — broad context",desc:"Diffuse attention across all tokens — gathers global meaning.",score:(e,t)=>.3}];function R(e){const t=Math.max(...e),n=e.map(i=>Math.exp(i-t)),o=n.reduce((i,r)=>i+r);return n.map(i=>i/o)}function O(e){const t=f.length,n=[];for(let o=0;o<t;o++){const i=new Array(t);for(let r=0;r<t;r++)i[r]=e.score(o,r);n.push(R(i))}return n}function I(e){const t=L.map(O);let n=0,o=f.indexOf("it");e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Same sentence, four heads</div>

      <div class="controls">
        ${L.map((r,a)=>`
          <button class="btn ${a===0?"btn-accent":""}" data-h="${a}">${r.name}</button>
        `).join("")}
      </div>

      <div class="callout" id="mh-desc"></div>

      <div class="widget-stage" id="mh-stage" style="min-height: 320px;"></div>
    </div>
  `,e.querySelectorAll("button[data-h]").forEach(r=>{r.addEventListener("click",()=>{n=Number(r.dataset.h),e.querySelectorAll("button[data-h]").forEach(a=>a.classList.toggle("btn-accent",Number(a.dataset.h)===n)),i()})});function i(){const r=L[n],a=t[n];e.querySelector("#mh-desc").innerHTML=`<strong>${r.name}.</strong> ${r.desc}`;let s=`
      <div style="margin-bottom: 0.6rem;"><strong>Pick a query token:</strong></div>
      <div style="margin-bottom: 0.8rem;">
        ${f.map((l,m)=>`<button class="mh-q ${m===o?"sel":""}" data-q="${m}" style="font-family: var(--font-mono); padding: 0.2em 0.5em; margin: 0.1em; border: 2px solid var(--ink); border-radius: 3px; background: ${m===o?"var(--accent)":"var(--paper)"}; color: ${m===o?"white":"var(--ink)"}; cursor: pointer;">${l}</button>`).join("")}
      </div>
      <div><strong>Attention from "${f[o]}":</strong></div>
      <div style="display: flex; gap: 0.15rem; flex-wrap: wrap; margin-top: 0.4rem;">
        ${f.map((l,m)=>{const p=a[o][m];return`<div style="font-family: var(--font-mono); padding: 0.3em 0.6em; border: 1.5px solid var(--ink); border-radius: 3px; background: rgba(214, 40, 40, ${p}); color: ${p>.4?"white":"var(--ink)"};">${l}<br><span style="font-size: 0.65rem; opacity: 0.85;">${(p*100).toFixed(0)}%</span></div>`}).join("")}
      </div>
    `;e.querySelector("#mh-stage").innerHTML=s,e.querySelectorAll(".mh-q").forEach(l=>{l.addEventListener("click",()=>{o=Number(l.dataset.q),i()})})}i()}const k=[{label:"Input embedding",note:"Token enters with a 768-dim vector from the previous layer (or the embedding table, if this is layer 0)."},{label:"LayerNorm 1",note:"Normalize across the 768 dims: subtract the mean, divide by std. Then scale + shift by learned parameters."},{label:"Multi-Head Attention",note:"Mix in information from every other token. The horizontal step. Output is the same shape: 768-dim per token."},{label:"Residual Add",note:"Add the attention output back to the input. The original signal can still pass through unchanged."},{label:"LayerNorm 2",note:"Normalize again."},{label:"Feed-Forward",note:"Per-token MLP: 768 → 3072 (with GELU/ReLU) → 768. No cross-token mixing — pure point-wise compute."},{label:"Residual Add",note:"Add the FFN output back. Output goes to the next block."}];function G(e){let t=0;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">One block, seven sub-steps</div>

      <div class="controls">
        <button class="btn" id="tb-prev">← Back</button>
        <button class="btn btn-accent" id="tb-next">Next step →</button>
        <button class="btn btn-ghost" id="tb-reset">Reset</button>
        <span style="margin-left: auto; font-family: var(--font-mono);" id="tb-counter">0 / ${k.length}</span>
      </div>

      <div class="widget-stage" id="tb-stage" style="min-height: 380px;"></div>

      <div class="callout" id="tb-note">Click "Next step →" to walk through the block.</div>
    </div>
  `,e.querySelector("#tb-next").addEventListener("click",()=>{t<k.length&&t++,n()}),e.querySelector("#tb-prev").addEventListener("click",()=>{t>0&&t--,n()}),e.querySelector("#tb-reset").addEventListener("click",()=>{t=0,n()});function n(){let i='<div class="tb-flow">';k.forEach((r,a)=>{const s=a<t,l=a===t-1;i+=`
        <div class="tb-step ${s?"done":""} ${l?"cur":""}" style="background: ${s?a===2?"#cfe5ff":a===5?"#c8f0c8":a===3||a===6?"#ffe9b3":"var(--paper)":"var(--paper-deep)"};">
          <div class="tb-step-num">${String(a+1).padStart(2,"0")}</div>
          <div class="tb-step-label">${o(r.label)}</div>
        </div>
        ${a<k.length-1?'<div class="tb-arrow">↓</div>':""}
      `}),i+="</div>",i+=`<style>
      .tb-flow { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
      .tb-step { display: grid; grid-template-columns: 40px 1fr; align-items: center; gap: 0.5rem; min-width: 320px; padding: 0.5rem 0.8rem; border: 2px solid var(--ink); border-radius: var(--radius); opacity: 0.4; }
      .tb-step.done { opacity: 1; box-shadow: 3px 3px 0 var(--ink); }
      .tb-step.cur { box-shadow: 4px 4px 0 var(--accent); border-color: var(--accent); }
      .tb-step-num { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-soft); text-align: center; }
      .tb-step-label { font-family: var(--font-display); letter-spacing: 0.04em; }
      .tb-arrow { font-family: var(--font-display); font-size: 1.4rem; color: var(--ink-faint); }
    </style>`,e.querySelector("#tb-stage").innerHTML=i,e.querySelector("#tb-counter").textContent=`${t} / ${k.length}`,e.querySelector("#tb-note").innerHTML=t>0?k[t-1].note:'Click "Next step →" to walk through the block.'}function o(i){return String(i).replace(/[&<>]/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;"})[r])}n()}const T=32,w=32;function C(e,t){const n=t,o=Math.pow(1e4,2*Math.floor(n/2)/w);return n%2===0?Math.sin(e/o):Math.cos(e/o)}function F(e){const t=new Array(w);for(let n=0;n<w;n++)t[n]=C(e,n);return t}function K(e,t){let n=0,o=0,i=0;for(let r=0;r<e.length;r++)n+=e[r]*t[r],o+=e[r]**2,i+=t[r]**2;return n/Math.sqrt(o*i)}function Q(e){let t=5,n=7;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Sinusoidal positional encoding (32 positions × 32 dims)</div>

      <div class="widget-stage" id="pp-stage" style="text-align: center;"></div>

      <div class="controls">
        <label>Position A:</label>
        <input type="range" min="0" max="${T-1}" value="${t}" id="pp-a">
        <span style="font-family: var(--font-mono);" id="pp-a-val">${t}</span>
        <label>Position B:</label>
        <input type="range" min="0" max="${T-1}" value="${n}" id="pp-b">
        <span style="font-family: var(--font-mono);" id="pp-b-val">${n}</span>
      </div>

      <div class="metrics">
        <div class="metric"><div class="label">Distance</div><div class="value" id="m-dist">—</div></div>
        <div class="metric accent"><div class="label">Cosine similarity</div><div class="value" id="m-sim">—</div></div>
      </div>

      <div class="callout" id="pp-explain"></div>
    </div>
  `,e.querySelector("#pp-a").addEventListener("input",i=>{t=Number(i.target.value),o()}),e.querySelector("#pp-b").addEventListener("input",i=>{n=Number(i.target.value),o()});function o(){const s=540/T,l=140/w;let m='<svg viewBox="0 0 640 240" width="100%" style="max-width: 640px">';m+=`<text class="ml-axis-text" x="${640/2}" y="20" text-anchor="middle">positional encoding heatmap</text>`,m+=`<text class="ml-axis-text" x="${640/2}" y="232" text-anchor="middle">position →</text>`,m+=`<text class="ml-axis-text" x="14" y="${240/2}" text-anchor="middle" transform="rotate(-90, 14, ${240/2})">embedding dim →</text>`;for(let d=0;d<T;d++)for(let c=0;c<w;c++){const v=(C(d,c)+1)/2,x=`rgb(${Math.round(255-v*200)}, ${Math.round(60+v*60)}, ${Math.round(60+v*30)})`;m+=`<rect x="${50+d*s}" y="${50+c*l}" width="${s}" height="${l}" fill="${x}"/>`}[{p:t,color:"#2a8a3e",label:"A"},{p:n,color:"#1c6dd0",label:"B"}].forEach(d=>{m+=`<rect x="${50+d.p*s-1}" y="46" width="${s+2}" height="148" fill="none" stroke="${d.color}" stroke-width="2"/>`,m+=`<text x="${50+d.p*s+s/2}" y="42" text-anchor="middle" style="font-family: var(--font-display); fill: ${d.color}; font-size: 12px;">${d.label}=${d.p}</text>`}),m+="</svg>",e.querySelector("#pp-stage").innerHTML=m,e.querySelector("#pp-a-val").textContent=t,e.querySelector("#pp-b-val").textContent=n,e.querySelector("#m-dist").textContent=Math.abs(t-n);const p=K(F(t),F(n));e.querySelector("#m-sim").textContent=p.toFixed(3);let h;t===n?h="Same position — vectors identical, similarity = 1.0.":Math.abs(t-n)<=3?h="<strong>Nearby positions</strong> have similar encodings (high cosine similarity). That's by design — attention can use proximity as a soft signal.":h="Distant positions have low similarity. The model can still tell them apart (vectors are unique), but they don't blur together.",e.querySelector("#pp-explain").innerHTML=h}o()}const q=["The","cat","sat","on","the","mat","."],P=[null,{right:"cat",top:[["dog",.32],["cat",.28],["boy",.1]]},{right:"sat",top:[["ran",.3],["sat",.25],["was",.15]]},{right:"on",top:[["on",.45],["under",.2],["near",.12]]},{right:"the",top:[["the",.6],["a",.18],["his",.08]]},{right:"mat",top:[["floor",.18],["mat",.16],["rug",.14]]},{right:".",top:[[".",.55],[",",.2],["and",.08]]}];function S(e){if(!e)return 0;const t=e.top.find(o=>o[0]===e.right),n=t?t[1]:.01;return-Math.log(n)}function U(e){let t=1;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Step through training on "${q.join(" ")}"</div>

      <div class="controls">
        <button class="btn" id="tr-prev">← Back</button>
        <button class="btn btn-accent" id="tr-next">Next token →</button>
        <button class="btn btn-ghost" id="tr-reset">Reset</button>
      </div>

      <div class="widget-stage" id="tr-stage" style="min-height: 320px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Position</div><div class="value" id="m-pos">1</div></div>
        <div class="metric"><div class="label">Per-token loss</div><div class="value" id="m-tloss">—</div></div>
        <div class="metric accent"><div class="label">Total loss so far</div><div class="value" id="m-total">—</div></div>
      </div>

      <div class="callout" id="tr-explain"></div>
    </div>
  `,e.querySelector("#tr-next").addEventListener("click",()=>{t<q.length-1&&t++,n()}),e.querySelector("#tr-prev").addEventListener("click",()=>{t>1&&t--,n()}),e.querySelector("#tr-reset").addEventListener("click",()=>{t=1,n()});function n(){let o='<div class="tr-context"><strong>Context the model sees:</strong></div>';o+='<div style="display: flex; gap: 0.2rem; flex-wrap: wrap; margin: 0.4rem 0 1rem;">',q.forEach((a,s)=>{let l="font-family: var(--font-mono); padding: 0.3em 0.6em; border: 1.5px solid var(--ink); border-radius: 3px;";s<t?l+="background: #cfe5ff;":s===t?l+="background: var(--accent); color: white;":l+="background: var(--paper); opacity: 0.4;",o+=`<div style="${l}">${a}</div>`}),o+="</div>";const i=P[t];i&&(o+="<div><strong>Model's top predictions for the next token:</strong></div>",o+='<table style="border-collapse: collapse; margin-top: 0.4rem; font-family: var(--font-mono); font-size: 0.85rem;">',o+='<thead><tr><th style="padding: 0.3em 0.6em; text-align: left;">token</th><th style="padding: 0.3em 0.6em; text-align: right;">probability</th><th></th></tr></thead><tbody>',i.top.forEach(a=>{const s=a[0]===i.right;o+=`<tr>
          <td style="padding: 0.2em 0.6em; ${s?"background: #d6f5d6; font-weight: 700;":""}">${a[0]}</td>
          <td style="padding: 0.2em 0.6em; text-align: right; ${s?"background: #d6f5d6; font-weight: 700;":""}">${(a[1]*100).toFixed(1)}%</td>
          <td style="padding: 0.2em 0.6em;">${s?"← actual":""}</td>
        </tr>`}),o+="</tbody></table>",o+=`<div style="margin-top: 0.6rem;"><strong>Cross-entropy loss</strong> = −log(P[actual]) = −log(${i.top.find(a=>a[0]===i.right)[1].toFixed(3)}) = <strong>${S(i).toFixed(3)}</strong> nats.</div>`),e.querySelector("#tr-stage").innerHTML=o;const r=P.slice(1,t+1).reduce((a,s)=>a+S(s),0);e.querySelector("#m-pos").textContent=t,e.querySelector("#m-tloss").textContent=i?S(i).toFixed(3):"—",e.querySelector("#m-total").textContent=r.toFixed(3),i&&S(i)>1.4?e.querySelector("#tr-explain").innerHTML=`<strong>Surprising token.</strong> The model predicted "${i.top[0][0]}" but the actual was "${i.right}" — high loss. Each weight gets a tiny nudge to make this less surprising next time.`:i&&(e.querySelector("#tr-explain").innerHTML='<strong>Confident and (mostly) right.</strong> Low loss — small gradient update. The model already "knows" this part of language well.')}n()}const M=[{tok:"dog",logit:3.5},{tok:"cat",logit:3},{tok:"animal",logit:1.8},{tok:"thing",logit:1},{tok:"word",logit:.5},{tok:"idea",logit:0},{tok:"plant",logit:-.5},{tok:"rock",logit:-1.5}];function V(e,t){const n=e.map(a=>a/t),o=Math.max(...n),i=n.map(a=>Math.exp(a-o)),r=i.reduce((a,s)=>a+s);return i.map(a=>a/r)}function _(e,t){const n=e.map((a,s)=>({p:a,i:s})).sort((a,s)=>s.p-a.p),o=new Set(n.slice(0,t).map(a=>a.i)),i=e.map((a,s)=>o.has(s)?a:0),r=i.reduce((a,s)=>a+s);return i.map(a=>a/r)}function X(e,t){const n=e.map((s,l)=>({p:s,i:l})).sort((s,l)=>l.p-s.p);let o=0;const i=new Set;for(const s of n)if(i.add(s.i),o+=s.p,o>=t)break;const r=e.map((s,l)=>i.has(l)?s:0),a=r.reduce((s,l)=>s+l);return r.map(s=>s/a)}function J(e){let t=1,n=M.length,o=1;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Sampling distribution over 8 candidate tokens</div>

      <div class="controls">
        <label>Temperature: <strong id="sp-tv">${t.toFixed(2)}</strong></label>
        <input type="range" min="0.05" max="2" step="0.05" value="${t}" id="sp-t" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Top-k: <strong id="sp-kv">${n}</strong></label>
        <input type="range" min="1" max="${M.length}" step="1" value="${n}" id="sp-k" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Top-p: <strong id="sp-pv">${o.toFixed(2)}</strong></label>
        <input type="range" min="0.1" max="1" step="0.05" value="${o}" id="sp-p" style="flex: 1;">
      </div>

      <div class="widget-stage" id="sp-stage" style="min-height: 280px;"></div>

      <div class="callout" id="sp-explain"></div>
    </div>
  `,e.querySelector("#sp-t").addEventListener("input",r=>{t=Number(r.target.value),i()}),e.querySelector("#sp-k").addEventListener("input",r=>{n=Number(r.target.value),i()}),e.querySelector("#sp-p").addEventListener("input",r=>{o=Number(r.target.value),i()});function i(){const r=V(M.map(h=>h.logit),t);let a=_(r,n);a=X(a,o);const s=Math.max(...r,...a,.1);let l=`
      <div style="margin-bottom: 0.5rem;"><strong>After temperature only (gray) vs after top-k + top-p (red):</strong></div>
      <div style="display: flex; flex-direction: column; gap: 0.3rem;">
    `;M.forEach((h,d)=>{const c=r[d]/s*100,b=a[d]/s*100,v=a[d]===0;l+=`<div style="display: grid; grid-template-columns: 80px 1fr 70px; gap: 0.6rem; align-items: center;">
        <div style="font-family: var(--font-mono); font-size: 0.85rem; text-align: right;">${h.tok}</div>
        <div style="position: relative; height: 26px; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: 3px;">
          <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${c}%; background: rgba(150, 150, 150, 0.5); border-right: 1px solid var(--ink-soft);"></div>
          <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${b}%; background: var(--accent); ${v?"opacity: 0;":""}"></div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem; ${v?"color: var(--ink-faint); text-decoration: line-through;":""}">${(a[d]*100).toFixed(1)}%</div>
      </div>`}),l+="</div>",e.querySelector("#sp-stage").innerHTML=l,e.querySelector("#sp-tv").textContent=t.toFixed(2),e.querySelector("#sp-kv").textContent=n,e.querySelector("#sp-pv").textContent=o.toFixed(2);const m=a.filter(h=>h>0).length;let p;t<.2?p=`<strong>Near-greedy.</strong> Temperature ${t.toFixed(2)} makes the model almost always pick the top token. Repetitive but reliable.`:t>1.5?p="<strong>High temperature.</strong> The distribution is flattened — low-probability tokens get sampled too. More creative, more risk of nonsense.":m<=2?p=`Top-k/top-p have narrowed to ${m} candidates. Conservative sampling.`:p=`Balanced sampling — ${m} candidates survive filtering. Common production settings.`,e.querySelector("#sp-explain").innerHTML=p}i()}const Y=[{name:"GPT-1",params:12e7,loss:3.3,year:2018},{name:"GPT-2",params:15e8,loss:2.85,year:2019},{name:"GPT-3",params:175e9,loss:1.95,year:2020},{name:"PaLM",params:54e10,loss:1.78,year:2022},{name:"Chinchilla",params:7e10,loss:1.85,year:2022},{name:"Llama 2",params:7e10,loss:1.8,year:2023},{name:"GPT-4",params:17e11,loss:1.6,year:2023},{name:"Llama 3 70B",params:7e10,loss:1.72,year:2024},{name:"Llama 3 405B",params:405e9,loss:1.58,year:2024}],Z=[{name:"Memorize facts",threshold:1e8},{name:"Coherent paragraphs",threshold:1e9},{name:"In-context learning",threshold:1e10},{name:"Multi-step reasoning",threshold:7e10},{name:"Code from description",threshold:175e9},{name:"Tool use / agents",threshold:5e11}];function ee(e){let t=null;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Loss vs parameters (log-log)</div>

      <div class="widget-stage" id="sc-stage" style="text-align: center;"></div>

      <div class="callout" id="sc-explain">
        On log-log axes, every order-of-magnitude in parameters lowers the loss by a roughly constant amount — that's the scaling law. Hover any model.
      </div>

      <div style="margin-top: 1rem;">
        <strong>Capabilities (roughly) emerge at:</strong>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.4rem; margin-top: 0.5rem;">
          ${Z.map(d=>`
            <div style="font-family: var(--font-mono); font-size: 0.78rem; padding: 0.4em 0.6em; border: 1.5px solid var(--ink); border-radius: 3px; background: var(--paper-deep);">
              <strong>${d.name}</strong><br><span style="color: var(--ink-soft);">~ ${d.threshold>=1e9?(d.threshold/1e9).toFixed(0)+"B":(d.threshold/1e6).toFixed(0)+"M"} params</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;const n=660,o=360,i=60,r=1e8,a=5e12,s=1.5,l=3.5;function m(d){return i+(Math.log10(d)-Math.log10(r))/(Math.log10(a)-Math.log10(r))*(n-2*i)}function p(d){return o-i-(l-d)/(l-s)*(o-2*i)}function h(){let d=`<svg viewBox="0 0 ${n} ${o}" width="100%" style="max-width: ${n}px">`;d+=`<rect class="ml-plot-bg" x="${i}" y="${i}" width="${n-2*i}" height="${o-2*i}"/>`;for(let c=1e8;c<=a;c*=10){d+=`<line class="ml-grid" x1="${m(c)}" y1="${i}" x2="${m(c)}" y2="${o-i}"/>`;const b=c>=1e12?c/1e12+"T":c>=1e9?c/1e9+"B":c/1e6+"M";d+=`<text class="ml-axis-text" x="${m(c)}" y="${o-i+14}" text-anchor="middle">${b}</text>`}for(let c=1.5;c<=3.5;c+=.5)d+=`<line class="ml-grid" x1="${i}" y1="${p(c)}" x2="${n-i}" y2="${p(c)}"/>`,d+=`<text class="ml-axis-text" x="${i-6}" y="${p(c)+3}" text-anchor="end">${c.toFixed(1)}</text>`;d+=`<text class="ml-axis-text" x="${n/2}" y="${o-12}" text-anchor="middle">parameters (log scale)</text>`,d+=`<text class="ml-axis-text" x="20" y="${o/2}" transform="rotate(-90, 20, ${o/2})" text-anchor="middle">val loss (nats/token)</text>`,d+=`<line x1="${m(1e8)}" y1="${p(3.3)}" x2="${m(5e12)}" y2="${p(1.45)}" stroke="var(--ink)" stroke-width="2" stroke-dasharray="4 3" opacity="0.4"/>`,Y.forEach((c,b)=>{const v=m(c.params),x=p(c.loss),E=t===b;if(d+=`<circle cx="${v}" cy="${x}" r="${E?9:6}" fill="var(--accent)" stroke="var(--ink)" stroke-width="2" data-i="${b}" style="cursor: pointer;"/>`,E){const A=`${c.name} · ${c.year} · ${c.params>=1e12?(c.params/1e12).toFixed(1)+"T":(c.params/1e9).toFixed(0)+"B"} params · loss ${c.loss.toFixed(2)}`,$=A.length*6+12;d+=`<rect x="${Math.min(n-$-5,Math.max(5,v-$/2))}" y="${Math.max(5,x-32)}" width="${$}" height="22" rx="3" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>`,d+=`<text x="${Math.min(n-$/2-5,Math.max($/2+5,v))}" y="${Math.max(20,x-18)}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${A}</text>`}else d+=`<text x="${v}" y="${x-10}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px; fill: var(--ink-soft);">${c.name.split(" ")[0]}</text>`}),d+="</svg>",e.querySelector("#sc-stage").innerHTML=d,e.querySelectorAll("circle[data-i]").forEach(c=>{c.addEventListener("mouseenter",()=>{t=Number(c.dataset.i),h()}),c.addEventListener("mouseleave",()=>{t=null,h()})})}h()}const y=e=>()=>u.jsx(j,{init:e}),ne={slug:"transformers",title:"Transformers & LLMs",intro:u.jsx(u.Fragment,{children:"Eight lessons unpacking what a transformer does to your prompt, one matmul at a time — tokens, embeddings, attention, multi-head, the transformer block, positional encoding, training, sampling, and scaling laws."}),lessons:[{slug:"tokens",number:"01",title:"Tokens & Embeddings",blurb:"Text doesn't enter a model — numbers do.",Widget:y(W),intro:u.jsx(u.Fragment,{children:"The tokenizer splits text into sub-word units; each token maps to a learned vector. The model only ever sees vectors."}),sections:[],takeaways:["Tokenization is sub-word — common words = 1 token, rare ones split.","Embeddings are learned during training; similar words end up nearby.","Vocabulary size affects model size: GPT-2 had 50k tokens, modern LLMs ~100–200k.","Same model, different tokenizer = different costs per character."]},{slug:"attention",number:"02",title:"Attention",blurb:"Query, key, value. Each token looks at every other and decides what matters.",Widget:y(B),intro:u.jsx(u.Fragment,{children:"For each token, compute a score against every other token; use those scores to mix their values. That\\'s attention."}),sections:[],takeaways:["Q, K, V are linear projections of each token.","Attention weights = softmax(Q·Kᵀ / √d). Always sum to 1.","Cost: O(n²) in sequence length. The thing that limits context window size.","Causal mask hides future tokens during training."]},{slug:"multi-head",number:"03",title:"Multi-Head Attention",blurb:"Several attention heads in parallel, each specializing.",Widget:y(I),intro:u.jsx(u.Fragment,{children:"Run attention several times in parallel with different learned projections, concatenate the outputs. Each head ends up specializing."}),sections:[],takeaways:["Heads learn different relationships — syntax, coreference, position.","Typical: 8–96 heads. Each smaller than a single full-attention block would be.","Sum of head dims = model dim.","Some heads are interpretable; many are mush."]},{slug:"transformer-block",number:"04",title:"The Transformer Block",blurb:"Attention + feed-forward + residuals + layer norm.",Widget:y(G),intro:u.jsx(u.Fragment,{children:"One transformer block: layer-norm, multi-head attention, residual, layer-norm, feed-forward, residual. Stack 96 of these and you have GPT-3."}),sections:[],takeaways:["Residual connections let gradients flow through deep stacks.","LayerNorm stabilizes activations between layers.","The feed-forward (MLP) processes each token independently — where most parameters live.","Depth × width is the parameter knob — both buy capacity differently."]},{slug:"positional",number:"05",title:"Positional Encoding",blurb:"Attention is permutation-invariant — it can't see word order.",Widget:y(Q),intro:u.jsx(u.Fragment,{children:"Plain attention has no idea which token came first. We add a position-dependent signal to each embedding so order survives."}),sections:[],takeaways:["Sinusoidal: classic, no learned parameters, extrapolates beyond training length.","Learned: simpler, doesn't extrapolate.","RoPE (rotary): rotates Q and K by position. Used by Llama, GPT-NeoX.","ALiBi: penalty added to attention scores by distance."]},{slug:"training",number:"06",title:"Next-Token Training",blurb:"One simple objective: predict the next token. Trillions of times.",Widget:y(U),intro:u.jsx(u.Fragment,{children:"Slide the model over text. At each position, predict the next token. Cross-entropy loss against the true next token. That single objective gets you GPT."}),sections:[],takeaways:["Objective: cross-entropy between predicted and actual next token.","Training data: most of the internet, scrubbed and deduplicated.","Loss falls log-linearly with compute. Scaling laws.","Fine-tuning + RLHF turns a base model into an assistant."]},{slug:"sampling",number:"07",title:"Sampling",blurb:"Temperature, top-k, top-p.",Widget:y(J),intro:u.jsx(u.Fragment,{children:"The model outputs a probability over the whole vocabulary. How you sample from it determines whether the output is creative, repetitive, or boring."}),sections:[],takeaways:["Greedy / temperature 0: always pick the most likely. Repetitive but deterministic.","Temperature > 1: flattens the distribution. More creative, less coherent.","Top-k: only consider the k most likely tokens.","Top-p (nucleus): only consider tokens summing to p of the probability mass."]},{slug:"scaling",number:"08",title:"Scaling & Emergence",blurb:"Loss vs parameters: a straight log-log line.",Widget:y(ee),intro:u.jsx(u.Fragment,{children:"More parameters + more data + more compute → smoothly lower loss. But the capabilities those parameters enable show up in jumps."}),sections:[],takeaways:["Loss decreases predictably with scale; capabilities do not.","Chinchilla-optimal: 20 tokens per parameter. Most models were under-trained.","Mixture-of-experts gets more parameters without more flops per token.","Scaling is the boring secret of modern AI. Most progress is more, not new."]}]};export{ne as manifest};
