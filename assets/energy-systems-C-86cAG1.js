import{j as W}from"./main-BHRJeYOh.js";import{L as R}from"./LegacyWidget-Di7ysmDJ.js";const j=[{name:"Solar PV (utility)",cf:.22,color:"#f5a623"},{name:"Wind onshore",cf:.35,color:"#2b6cb0"},{name:"Wind offshore",cf:.48,color:"#1a4d80"},{name:"Hydro",cf:.4,color:"#4ec9ff"},{name:"Coal",cf:.55,color:"#4a4a4a"},{name:"Gas (CCGT)",cf:.55,color:"#888"},{name:"Nuclear",cf:.92,color:"#9c27b0"},{name:"Battery (4-hr)",cf:.12,color:"#4caf50"}],G=[{name:"100 W bulb (1 hr)",wh:100},{name:"Phone full charge",wh:15},{name:"EV daily commute",wh:8e3},{name:"Home daily",wh:3e4},{name:"Steel factory daily",wh:5e7},{name:"Small town daily",wh:5e8},{name:"NYC daily",wh:16e10},{name:"USA daily",wh:11e12}];function I(a){let r=1e3;a.innerHTML=`
    <div class="widget">
      <div class="widget-title">From nameplate watts → actual watt-hours</div>

      <div class="controls" style="display: grid; grid-template-columns: 200px 1fr 100px; gap: 0.6rem; align-items: center;">
        <label>Plant nameplate (MW):</label>
        <input type="range" id="un-c" min="10" max="5000" value="${r}" step="10">
        <div id="un-c-v" style="font-family: var(--font-mono); text-align: right;">${r}</div>
      </div>

      <div class="widget-stage" id="un-stage"></div>
      <div class="callout"><strong>The slogan:</strong> capacity tells you size, capacity factor tells you reality. A 1 GW solar farm produces less annual energy than a 400 MW nuclear plant.</div>
    </div>
  `,a.querySelector("#un-c").addEventListener("input",i=>{r=+i.target.value,a.querySelector("#un-c-v").textContent=r,o()});function h(i){return i>=1e12?(i/1e12).toFixed(2)+" TWh":i>=1e9?(i/1e9).toFixed(2)+" GWh":i>=1e6?(i/1e6).toFixed(2)+" MWh":i>=1e3?(i/1e3).toFixed(2)+" kWh":i.toFixed(1)+" Wh"}function o(){const i=r*1e6;let e='<div style="display: grid; gap: 0.4rem;">';j.forEach(l=>{const m=i*8760*l.cf;e+=`<div style="display: grid; grid-template-columns: 170px 60px 1fr 130px; gap: 0.6rem; align-items: center; padding: 0.4rem 0.6rem; border: 1.5px solid var(--ink); border-radius: 3px; background: var(--paper);">
        <div style="font-family: var(--font-mono); font-size: 0.82rem;">${l.name}</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem; text-align: right;">CF ${(l.cf*100).toFixed(0)}%</div>
        <div style="position: relative; height: 18px; background: var(--paper-deep); border: 1px solid var(--ink); border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; width: ${l.cf*100}%; background: ${l.color};"></div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.8rem; text-align: right;"><strong>${h(m)}/yr</strong></div>
      </div>`}),e+="</div>",e+='<div style="margin-top: 1rem;"><strong>Scale check:</strong> what is one MWh?</div>',e+='<div style="display: grid; gap: 0.25rem; margin-top: 0.4rem;">',G.forEach(l=>{e+=`<div style="display: grid; grid-template-columns: 200px 1fr; gap: 0.6rem; font-family: var(--font-mono); font-size: 0.78rem; padding: 0.2rem 0.4rem; border-bottom: 1px dashed var(--ink-soft);">
        <div>${l.name}</div>
        <div><strong>${h(l.wh)}</strong></div>
      </div>`}),e+="</div>",a.querySelector("#un-stage").innerHTML=e}o()}const D={France:{coal:1,gas:7,nuclear:65,hydro:11,wind:9,solar:4,other:3},Germany:{coal:24,gas:14,nuclear:4,hydro:4,wind:26,solar:12,other:16},USA:{coal:16,gas:43,nuclear:18,hydro:6,wind:10,solar:5,other:2},China:{coal:60,gas:3,nuclear:5,hydro:14,wind:9,solar:6,other:3},Norway:{coal:0,gas:1,nuclear:0,hydro:88,wind:11,solar:0,other:0},Australia:{coal:47,gas:18,nuclear:0,hydro:6,wind:12,solar:14,other:3},Thailand:{coal:16,gas:64,nuclear:0,hydro:4,wind:1,solar:5,other:10}},z=[{key:"coal",name:"Coal",color:"#1a1a1a",role:"baseload",carbon:820},{key:"gas",name:"Gas",color:"#888",role:"load-following",carbon:490},{key:"nuclear",name:"Nuclear",color:"#9c27b0",role:"baseload",carbon:12},{key:"hydro",name:"Hydro",color:"#4ec9ff",role:"flexible",carbon:24},{key:"wind",name:"Wind",color:"#2b6cb0",role:"variable",carbon:11},{key:"solar",name:"Solar",color:"#f5a623",role:"variable",carbon:45},{key:"other",name:"Other",color:"#bbb",role:"mixed",carbon:200}];function B(a){let r="Germany";a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Generation mix by country</div>

      <div class="controls">
        <label>Country:</label>
        <div class="pill-group">
          ${Object.keys(D).map((o,i)=>`
            <input type="radio" name="gm-c" id="gm-c${i}" value="${o}" ${o===r?"checked":""}>
            <label for="gm-c${i}">${o}</label>
          `).join("")}
        </div>
      </div>

      <div class="widget-stage" id="gm-stage"></div>
      <div class="callout" id="gm-explain"></div>
    </div>
  `,a.querySelectorAll("input[name=gm-c]").forEach(o=>o.addEventListener("change",i=>{r=i.target.value,h()}));function h(){const o=D[r],i=Object.values(o).reduce((s,y)=>s+y,0);let e=0;z.forEach(s=>e+=o[s.key]/i*s.carbon);let l=`<div style="display: flex; height: 45px; border: 2px solid var(--ink); border-radius: var(--radius); overflow: hidden; margin-bottom: 0.4rem;">
      ${z.map(s=>{const y=o[s.key]/i*100;return y<.5?"":`<div style="width: ${y}%; background: ${s.color}; display: flex; align-items: center; justify-content: center; color: white; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600;" title="${s.name} ${y.toFixed(1)}%">${y>8?y.toFixed(0)+"%":""}</div>`}).join("")}
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.25rem; font-family: var(--font-mono); font-size: 0.78rem; margin-bottom: 0.8rem;">
      ${z.map(s=>`<div><span style="display: inline-block; width: 12px; height: 12px; background: ${s.color}; border: 1px solid var(--ink); vertical-align: middle;"></span> ${s.name}: <strong>${o[s.key]}%</strong></div>`).join("")}
    </div>

    <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 1rem;">
      <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 0.4rem;">
        Avg carbon intensity: <strong style="color: ${e>400?"#d62828":e>150?"#f5a623":"#4caf50"};">${e.toFixed(0)} gCO₂/kWh</strong>
      </div>
      <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft);">Roles in this mix:</div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.2rem; font-family: var(--font-mono); font-size: 0.75rem; margin-top: 0.3rem;">
        ${["baseload","load-following","flexible","variable","mixed"].map(s=>{const y=z.filter(x=>x.role===s).reduce((x,f)=>x+o[f.key],0);return`<div>${s}: <strong>${y}%</strong></div>`}).join("")}
      </div>
    </div>`;a.querySelector("#gm-stage").innerHTML=l;const m=z.map(s=>({...s,share:o[s.key]})).sort((s,y)=>y.share-s.share)[0];a.querySelector("#gm-explain").innerHTML=`<strong>${r}</strong> leans hardest on <strong>${m.name}</strong> (${m.share}%). ${e<100?"A predominantly low-carbon grid — your EV is genuinely clean here.":e<300?"Mid-carbon grid. Renewables matter but fossil still sets the marginal carbon at most hours.":"High-carbon grid. The marginal kWh almost certainly comes from coal or gas."}`}h()}function N(a){let r=0;function h(e){const m=.18*Math.exp(-Math.pow((e-8.5)/2,2)),s=.35*Math.exp(-Math.pow((e-19)/2.2,2));return Math.max(.3,.55+m+s+0)}function o(e){return e<6||e>18?0:Math.max(0,Math.cos((e-12)*Math.PI/12)*1)}a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Net load = demand − solar output</div>

      <div class="controls" style="display: grid; grid-template-columns: 200px 1fr 70px; gap: 0.6rem; align-items: center;">
        <label>Solar penetration:</label>
        <input type="range" id="dk-s" min="0" max="80" value="0" step="2">
        <div id="dk-s-v" style="font-family: var(--font-mono); text-align: right;">0%</div>
      </div>

      <div class="widget-stage" id="dk-stage"></div>
      <div class="callout" id="dk-explain"></div>
    </div>
  `,a.querySelector("#dk-s").addEventListener("input",e=>{r=+e.target.value,a.querySelector("#dk-s-v").textContent=r+"%",i()});function i(){const e=Array.from({length:24},(d,S)=>h(S)).reduce((d,S)=>d+S),l=r/100,m=Array.from({length:24},(d,S)=>o(S)).reduce((d,S)=>d+S),s=e*l/Math.max(.001,m),y=600,x=280,f=50;function b(d){return f+d/24*(y-2*f)}function g(d){return x-f-d/1.5*(x-2*f)}let t=`<svg viewBox="0 0 ${y} ${x}" width="100%" style="max-width: ${y}px">`;t+=`<line x1="${f}" y1="${x-f}" x2="${y-f}" y2="${x-f}" stroke="var(--ink)" stroke-width="2"/>`,t+=`<line x1="${f}" y1="${f}" x2="${f}" y2="${x-f}" stroke="var(--ink)" stroke-width="2"/>`,[0,6,12,18,24].forEach(d=>{t+=`<text x="${b(d)}" y="${x-f+18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${d}:00</text>`}),[0,.5,1,1.5].forEach(d=>{t+=`<text x="${f-8}" y="${g(d)+3}" text-anchor="end" style="font-family: var(--font-mono); font-size: 10px;">${d.toFixed(1)}</text>`});let c=[];for(let d=0;d<=24;d+=.25)c.push(`${b(d)},${g(h(d))}`);t+=`<polyline points="${c.join(" ")}" fill="none" stroke="var(--ink-soft)" stroke-width="2" stroke-dasharray="4 3"/>`;let n=[];for(let d=0;d<=24;d+=.25)n.push(`${b(d)},${g(o(d)*s)}`);t+=`<polyline points="${n.join(" ")}" fill="none" stroke="#f5a623" stroke-width="2"/>`;let p=[];for(let d=0;d<=24;d+=.25){const S=Math.max(0,h(d)-o(d)*s);p.push(`${b(d)},${g(S)}`)}t+=`<polyline points="${p.join(" ")}" fill="none" stroke="var(--accent)" stroke-width="3"/>`,t+=`<g transform="translate(${y-180}, ${f+5})">
      <rect x="0" y="0" width="170" height="60" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5" rx="3"/>
      <line x1="10" y1="14" x2="30" y2="14" stroke="var(--ink-soft)" stroke-width="2" stroke-dasharray="3 2"/>
      <text x="36" y="18" style="font-family: var(--font-mono); font-size: 10px;">Total demand</text>
      <line x1="10" y1="32" x2="30" y2="32" stroke="#f5a623" stroke-width="2"/>
      <text x="36" y="36" style="font-family: var(--font-mono); font-size: 10px;">Solar supply</text>
      <line x1="10" y1="50" x2="30" y2="50" stroke="var(--accent)" stroke-width="3"/>
      <text x="36" y="54" style="font-family: var(--font-mono); font-size: 10px;">Net (residual) load</text>
    </g>`,t+=`<text x="${y/2}" y="${x-12}" text-anchor="middle" style="font-family: var(--font-display); font-size: 13px;">Hour of day</text>`,t+=`<text x="14" y="${x/2}" text-anchor="middle" style="font-family: var(--font-display); font-size: 13px;" transform="rotate(-90 14 ${x/2})">Load (normalized)</text>`,t+="</svg>";let $=0,u=999;for(let d=0;d<=24;d+=.25){const S=Math.max(0,h(d)-o(d)*s);S>$&&($=S),S<u&&(u=S)}const v=$-u;let M=t+`<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; margin-top: 0.5rem; font-family: var(--font-mono); font-size: 0.78rem;">
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Peak net: <strong>${$.toFixed(2)}</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Min net: <strong>${u.toFixed(2)}</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Daily ramp: <strong>${v.toFixed(2)}</strong></div>
    </div>`;a.querySelector("#dk-stage").innerHTML=M;let k;r<10?k="<strong>Flat day, gentle bumps.</strong> Generation chases demand with a comfortable morning ramp and evening peak. This was every grid until ~2010.":r<30?k="<strong>Daytime trough begins.</strong> Wholesale prices dip when the sun is up. Fossil baseload starts cycling — bad for plant economics.":r<60?k="<strong>The duck is here.</strong> The valley is deep and the evening ramp is brutal. Operators need fast-ramping resources — peakers or batteries.":k="<strong>Over-the-belly duck.</strong> Solar makes more than the grid can absorb midday. Either curtail solar or store it. Modern systems shift it to evening with batteries.",a.querySelector("#dk-explain").innerHTML=k}i()}function U(a){let r=.7,h=!1,o=null,i=0,e=50,l=[];a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Trip a 1 GW generator on a 60 GW system</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: grid; grid-template-columns: 200px 1fr 90px; gap: 0.6rem; align-items: center;">
          <label>Grid inertia level:</label>
          <input type="range" id="fq-i" min="10" max="100" value="${r*100}" step="5">
          <div id="fq-i-v" style="font-family: var(--font-mono); text-align: right;">${(r*100).toFixed(0)}%</div>
        </div>
        <div style="display: flex; gap: 0.6rem;">
          <button id="fq-trip" class="btn">⚡ Trip generator</button>
          <button id="fq-reset" class="btn">Reset</button>
        </div>
      </div>

      <div class="widget-stage" id="fq-stage"></div>
      <div class="callout" id="fq-explain"></div>
    </div>
  `,a.querySelector("#fq-i").addEventListener("input",x=>{r=+x.target.value/100,a.querySelector("#fq-i-v").textContent=(r*100).toFixed(0)+"%",m()}),a.querySelector("#fq-trip").addEventListener("click",()=>{h||(h=!0,i=0,l=[],o&&clearInterval(o),o=setInterval(s,60))}),a.querySelector("#fq-reset").addEventListener("click",()=>m());function m(){o&&clearInterval(o),h=!1,i=0,e=50,l=[],y()}function s(){i+=.1;const x=.5/(r+.1);if(i<2)e-=x*.1;else if(i<15){const f=50-x*2,g=f+(50-f)*.3*Math.min(1,(i-2)/5);e+=(g-e)*.05}else i<45?e+=(50-e)*.02:(e=50,clearInterval(o),h=!1);l.push({t:i,freq:e}),y()}function y(){function t(u){return 50+u/45*500}function c(u){return 190-(u-49)/1.2*140}let n='<svg viewBox="0 0 600 240" width="100%" style="max-width: 600px">';if(n+='<line x1="50" y1="190" x2="550" y2="190" stroke="var(--ink)" stroke-width="2"/>',n+='<line x1="50" y1="50" x2="50" y2="190" stroke="var(--ink)" stroke-width="2"/>',n+=`<line x1="50" y1="${c(50)}" x2="550" y2="${c(50)}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="3 3"/>`,n+=`<text x="555" y="${c(50)+4}" style="font-family: var(--font-mono); font-size: 10px;">50.0</text>`,n+=`<line x1="50" y1="${c(49.5)}" x2="550" y2="${c(49.5)}" stroke="#d62828" stroke-width="1" stroke-dasharray="3 3"/>`,n+=`<text x="555" y="${c(49.5)+4}" style="font-family: var(--font-mono); font-size: 10px; fill: #d62828;">49.5</text>`,n+=`<rect x="${t(0)}" y="50" width="${t(2)-t(0)}" height="140" fill="rgba(255, 200, 50, 0.15)"/>`,n+=`<rect x="${t(2)}" y="50" width="${t(15)-t(2)}" height="140" fill="rgba(76, 175, 80, 0.12)"/>`,n+=`<rect x="${t(15)}" y="50" width="${t(45)-t(15)}" height="140" fill="rgba(43, 108, 178, 0.1)"/>`,n+=`<text x="${t(1)}" y="62" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px;">inertia</text>`,n+=`<text x="${t(8)}" y="62" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px;">primary (droop)</text>`,n+=`<text x="${t(30)}" y="62" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px;">secondary (AGC)</text>`,[0,5,15,30,45].forEach(u=>{n+=`<text x="${t(u)}" y="208" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${u}s</text>`}),[49,49.5,50,50.2].forEach(u=>{n+=`<text x="42" y="${c(u)+3}" text-anchor="end" style="font-family: var(--font-mono); font-size: 10px;">${u.toFixed(1)}</text>`}),l.length>1){const u=l.map(v=>`${t(v.t)},${c(v.freq)}`).join(" ");n+=`<polyline points="${u}" fill="none" stroke="var(--accent)" stroke-width="3"/>`}n+="</svg>";let p=`<div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.9rem; margin-bottom: 0.5rem; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; font-family: var(--font-mono); font-size: 0.85rem;">
      <div>t = <strong>${i.toFixed(1)}s</strong></div>
      <div>f = <strong style="color: ${e<49.5?"#d62828":"var(--ink)"};">${e.toFixed(3)} Hz</strong></div>
      <div>Δf = <strong>${(e-50).toFixed(3)} Hz</strong></div>
    </div>`+n;a.querySelector("#fq-stage").innerHTML=p;let $;!h&&i===0?$="Hit <em>Trip generator</em>. The system instantly loses 1 GW of supply — frequency starts to fall. How fast it falls depends on inertia.":i<2?$="<strong>Inertia phase.</strong> Spinning turbines convert their rotational kinetic energy into electrical output, slowing as they do. Higher inertia = slower drop = more time to react.":i<15?$="<strong>Primary response (droop).</strong> Each generator's governor reads the dip and opens its valve a bit more. Distributed, fast (seconds). Stops the fall but does not restore.":i<45?$="<strong>Secondary control (AGC).</strong> Central dispatch commands specific units to ramp up over minutes. Restores frequency to exactly 50 Hz and frees up primary reserves.":$="<strong>Back to nominal.</strong> Operators have ~30 minutes to find a tertiary unit (warm-start gas, hydro) and replenish reserves before the next contingency.",a.querySelector("#fq-explain").innerHTML=$}y()}const P={"CA summer (deep duck)":[25,22,20,19,22,28,45,60,55,35,18,8,-2,-5,5,22,55,95,140,165,130,80,50,35],"TX hot day":[35,32,30,30,35,50,70,80,70,55,45,50,65,85,110,140,175,200,180,140,100,70,55,45],"EU calm winter":[80,75,70,70,75,90,130,180,200,170,130,110,100,110,120,140,180,210,190,150,120,100,90,85],"UK windy day":[10,8,6,5,8,15,35,50,40,25,18,15,20,25,30,45,70,95,80,55,35,22,15,12]};function V(a){let r=200,h=50,o=.88,i="CA summer (deep duck)";a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Daily storage arbitrage</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: grid; grid-template-columns: 180px 1fr 80px; gap: 0.6rem; align-items: center;">
          <label>Power rating (MW):</label>
          <input type="range" id="st-p" min="10" max="500" value="${h}" step="10">
          <div id="st-p-v" style="font-family: var(--font-mono); text-align: right;">${h}</div>
        </div>
        <div style="display: grid; grid-template-columns: 180px 1fr 80px; gap: 0.6rem; align-items: center;">
          <label>Energy (MWh):</label>
          <input type="range" id="st-e" min="40" max="2000" value="${r}" step="20">
          <div id="st-e-v" style="font-family: var(--font-mono); text-align: right;">${r}</div>
        </div>
        <div style="display: grid; grid-template-columns: 180px 1fr 80px; gap: 0.6rem; align-items: center;">
          <label>Round-trip eff:</label>
          <input type="range" id="st-r" min="40" max="95" value="${o*100}" step="1">
          <div id="st-r-v" style="font-family: var(--font-mono); text-align: right;">${(o*100).toFixed(0)}%</div>
        </div>
        <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
          <label>Price profile:</label>
          <div class="pill-group">
            ${Object.keys(P).map((m,s)=>`
              <input type="radio" name="st-pr" id="st-pr${s}" value="${m}" ${m===i?"checked":""}>
              <label for="st-pr${s}">${m}</label>
            `).join("")}
          </div>
        </div>
      </div>

      <div class="widget-stage" id="st-stage"></div>
      <div class="callout" id="st-explain"></div>
    </div>
  `,a.querySelector("#st-p").addEventListener("input",m=>{h=+m.target.value,a.querySelector("#st-p-v").textContent=h,l()}),a.querySelector("#st-e").addEventListener("input",m=>{r=+m.target.value,a.querySelector("#st-e-v").textContent=r,l()}),a.querySelector("#st-r").addEventListener("input",m=>{o=+m.target.value/100,a.querySelector("#st-r-v").textContent=(o*100).toFixed(0)+"%",l()}),a.querySelectorAll("input[name=st-pr]").forEach(m=>m.addEventListener("change",s=>{i=s.target.value,l()}));function e(m){const s=m.length,y=m.map((t,c)=>({p:t,i:c})).sort((t,c)=>t.p-c.p),x=y.slice().reverse(),f=new Array(s).fill(0);let b=r/o;for(const{i:t}of y){if(b<=0)break;const c=Math.min(h,b);f[t]=-c,b-=c}let g=r;for(const{i:t}of x){if(g<=0)break;if(f[t]!==0)continue;const c=Math.min(h,g);f[t]=c,g-=c}return f}function l(){const m=P[i],s=e(m);let y=0,x=0;s.forEach((w,A)=>{w>0?y+=w*m[A]:x+=-w*m[A]});const f=y-x,b=f*320,t=r*25e4/(b||1),c=600,n=240,p=50,$=Math.max(...m),u=Math.min(...m);function v(w){return p+w/23*(c-2*p)}function M(w){return n-p-(w-u)/Math.max(1,$-u)*(n-2*p)}let k=`<svg viewBox="0 0 ${c} ${n}" width="100%" style="max-width: ${c}px">`;k+=`<line x1="${p}" y1="${n-p}" x2="${c-p}" y2="${n-p}" stroke="var(--ink)" stroke-width="2"/>`,k+=`<line x1="${p}" y1="${p}" x2="${p}" y2="${n-p}" stroke="var(--ink)" stroke-width="2"/>`,s.forEach((w,A)=>{if(w===0)return;const q=(c-2*p)/24*.9,L=v(A)-q/2,O=w>0?"#4caf50":"#d62828";k+=`<rect x="${L}" y="${p+10}" width="${q}" height="${n-2*p-10}" fill="${O}" fill-opacity="0.18"/>`});let d=m.map((w,A)=>`${v(A)},${M(w)}`).join(" ");k+=`<polyline points="${d}" fill="none" stroke="var(--accent)" stroke-width="3"/>`,[0,6,12,18,23].forEach(w=>k+=`<text x="${v(w)}" y="${n-p+18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${w}:00</text>`),k+=`<text x="${c/2}" y="${n-10}" text-anchor="middle" style="font-family: var(--font-display); font-size: 12px;">Hour · price ($/MWh)</text>`,k+="</svg>";let S=k+`<div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.4rem; margin-top: 0.5rem; font-family: var(--font-mono); font-size: 0.78rem;">
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Spread: <strong>$${($-u).toFixed(0)}</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Day net: <strong>$${f.toFixed(0)}</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Annual: <strong>$${(b/1e6).toFixed(2)}M</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Payback: <strong>${t.toFixed(1)} yr</strong></div>
    </div>
    <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-soft); margin-top: 0.3rem;">red bars = charging, green bars = discharging. Capex assumed $250/kWh.</div>`;a.querySelector("#st-stage").innerHTML=S;let C;t<4?C="<strong>Strong economics.</strong> The price spread is wide enough to pay back the battery in well under its cycle life. This is why grid-scale storage has exploded in CA and TX.":t<8?C="<strong>Solid project.</strong> Comfortable margins for a 10-12 year lithium pack. Most utility-scale lithium projects pencil here.":t<15?C="<strong>Marginal.</strong> Spread is too narrow or RTE too low. Needs a capacity-market payment or ancillary services on top.":C="<strong>Does not pencil.</strong> Either the price profile is too flat or efficiency too low. Hydrogen storage often lands here on day-arbitrage alone — needs seasonal value.",a.querySelector("#st-explain").innerHTML=C}l()}const K=[{name:"Solar",marginal:0,capMW:8e3,lcoe:35,color:"#f5a623"},{name:"Wind",marginal:0,capMW:6e3,lcoe:40,color:"#2b6cb0"},{name:"Nuclear",marginal:8,capMW:4e3,lcoe:95,color:"#9c27b0"},{name:"Hydro",marginal:5,capMW:3e3,lcoe:55,color:"#4ec9ff"},{name:"CCGT gas",marginal:45,capMW:8e3,lcoe:70,color:"#888"},{name:"Coal",marginal:35,capMW:5e3,lcoe:80,color:"#4a4a4a"},{name:"Peaker",marginal:110,capMW:3e3,lcoe:180,color:"#d62828"}];function _(a){let r=22e3,h=1,o=.8;a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Merit-order dispatch</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: grid; grid-template-columns: 180px 1fr 90px; gap: 0.6rem; align-items: center;">
          <label>Demand (MW):</label>
          <input type="range" id="lc-d" min="6000" max="32000" value="${r}" step="500">
          <div id="lc-d-v" style="font-family: var(--font-mono); text-align: right;">${r}</div>
        </div>
        <div style="display: grid; grid-template-columns: 180px 1fr 90px; gap: 0.6rem; align-items: center;">
          <label>Solar output:</label>
          <input type="range" id="lc-s" min="0" max="100" value="${h*100}" step="5">
          <div id="lc-s-v" style="font-family: var(--font-mono); text-align: right;">${(h*100).toFixed(0)}%</div>
        </div>
        <div style="display: grid; grid-template-columns: 180px 1fr 90px; gap: 0.6rem; align-items: center;">
          <label>Wind output:</label>
          <input type="range" id="lc-w" min="0" max="100" value="${o*100}" step="5">
          <div id="lc-w-v" style="font-family: var(--font-mono); text-align: right;">${(o*100).toFixed(0)}%</div>
        </div>
      </div>

      <div class="widget-stage" id="lc-stage"></div>
      <div class="callout" id="lc-explain"></div>
    </div>
  `,a.querySelector("#lc-d").addEventListener("input",e=>{r=+e.target.value,a.querySelector("#lc-d-v").textContent=r,i()}),a.querySelector("#lc-s").addEventListener("input",e=>{h=+e.target.value/100,a.querySelector("#lc-s-v").textContent=(h*100).toFixed(0)+"%",i()}),a.querySelector("#lc-w").addEventListener("input",e=>{o=+e.target.value/100,a.querySelector("#lc-w-v").textContent=(o*100).toFixed(0)+"%",i()});function i(){const e=K.map(v=>({...v,available:v.capMW*(v.name==="Solar"?h:v.name==="Wind"?o:1)}));e.sort((v,M)=>v.marginal-M.marginal);let l=0,m=0,s="";const y=[];for(const v of e){const M=Math.max(0,Math.min(v.available,r-l));if(y.push({...v,used:M}),M>0&&(m=v.marginal,s=v.name),l+=M,l>=r)break}const x=Math.max(0,r-l);e.reduce((v,M)=>v+M.available,0);const f=600,b=240,g=50;function t(v){return g+v/32e3*(f-2*g)}function c(v){return b-g-v/200*(b-2*g)}let n=`<svg viewBox="0 0 ${f} ${b}" width="100%" style="max-width: ${f}px">`;n+=`<line x1="${g}" y1="${b-g}" x2="${f-g}" y2="${b-g}" stroke="var(--ink)" stroke-width="2"/>`,n+=`<line x1="${g}" y1="${g}" x2="${g}" y2="${b-g}" stroke="var(--ink)" stroke-width="2"/>`;let p=0;for(const v of y){if(v.available===0)continue;const M=t(p),k=t(p+v.available);n+=`<rect x="${M}" y="${c(v.marginal)}" width="${k-M}" height="${b-g-c(v.marginal)}" fill="${v.color}" stroke="var(--ink)" stroke-width="1.2" fill-opacity="0.7"/>`,k-M>50&&(n+=`<text x="${(M+k)/2}" y="${b-g-5}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px; fill: white; font-weight: 600;">${v.name}</text>`),p+=v.available}n+=`<line x1="${t(r)}" y1="${g}" x2="${t(r)}" y2="${b-g}" stroke="var(--accent)" stroke-width="3" stroke-dasharray="6 3"/>`,n+=`<text x="${t(r)}" y="${g-5}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px; font-weight: 600; fill: var(--accent);">demand ${r} MW</text>`,n+=`<line x1="${g}" y1="${c(m)}" x2="${t(r)}" y2="${c(m)}" stroke="var(--ink)" stroke-width="2" stroke-dasharray="3 3"/>`,n+=`<text x="${g-8}" y="${c(m)+4}" text-anchor="end" style="font-family: var(--font-mono); font-size: 11px; font-weight: 600;">$${m}</text>`,[0,50,100,150,200].forEach(v=>n+=`<text x="${g-8}" y="${c(v)+3}" text-anchor="end" style="font-family: var(--font-mono); font-size: 9px;">${v}</text>`),[0,1e4,2e4,3e4].forEach(v=>n+=`<text x="${t(v)}" y="${b-g+18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${v/1e3}GW</text>`),n+="</svg>";let $=n+`<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.4rem; margin-top: 0.5rem; font-family: var(--font-mono); font-size: 0.78rem;">
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Clearing: <strong>$${m}/MWh</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Marginal: <strong>${s}</strong></div>
      <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.3rem 0.5rem; border-radius: 3px;">Unserved: <strong>${x} MW</strong></div>
    </div>`;a.querySelector("#lc-stage").innerHTML=$;let u;x>0?u="<strong>Blackout territory.</strong> Demand exceeds available supply. In a real market, operators shed load (managed brownouts). Price hits the cap, often >$5000/MWh.":s==="Solar"||s==="Wind"?u="<strong>Zero clearing price.</strong> Renewables can serve the entire load. Wholesale prices crash. Great for buyers, terrible for thermal plants — and the source of the duck curve.":s==="Peaker"?u="<strong>Peakers in the money.</strong> The most expensive plants are dispatching. Likely a heat wave or wind drought. Every other plant earns the peaker's price — that is how merit-order markets reward inframarginal capacity.":u="<strong>Gas or coal sets the price.</strong> Most hours in most grids look like this. The marginal source determines the wholesale price for everyone — solar, wind, nuclear all paid the same clearing price.",a.querySelector("#lc-explain").innerHTML=u}i()}const Y=[{name:"Smart thermostats (1M homes)",mw:800,cost:30,ramp:"5 min",desc:"Cycle ACs off in 15-min windows. Slight comfort impact."},{name:"EV charging defer",mw:600,cost:25,ramp:"1 min",desc:"Shift home and workplace charging 1-3 hours later."},{name:"Aluminum smelter",mw:350,cost:80,ramp:"10 min",desc:"One phone call. Smelter loses some output value during the curtailment."},{name:"Data center DC throttle",mw:200,cost:60,ramp:"2 min",desc:"Move compute to other regions. Customers see degraded perf."},{name:"Cement kiln",mw:150,cost:95,ramp:"20 min",desc:"Pause grinding step. Output rebalanced overnight."},{name:"Water utility pumps",mw:100,cost:40,ramp:"5 min",desc:"Pump overnight instead. Storage in tanks absorbs the shift."}],F={lcoe:180};function X(a){let r=1500;a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Cover a peak-hour shortfall</div>

      <div class="controls" style="display: grid; grid-template-columns: 200px 1fr 90px; gap: 0.6rem; align-items: center;">
        <label>Capacity needed (MW):</label>
        <input type="range" id="dr-n" min="100" max="2200" value="${r}" step="50">
        <div id="dr-n-v" style="font-family: var(--font-mono); text-align: right;">${r}</div>
      </div>

      <div class="widget-stage" id="dr-stage"></div>
      <div class="callout" id="dr-explain"></div>
    </div>
  `,a.querySelector("#dr-n").addEventListener("input",o=>{r=+o.target.value,a.querySelector("#dr-n-v").textContent=r,h()});function h(){const o=Y.slice().sort((t,c)=>t.cost-c.cost);let i=r,e=0;const l=[];for(const t of o){if(i<=0)break;const c=Math.min(t.mw,i);l.push({...t,taken:c}),e+=c*t.cost,i-=c}const m=r-i,s=i,y=s*F.lcoe,x=r*F.lcoe;let f=`<div style="margin-bottom: 0.4rem; font-family: var(--font-mono); font-size: 0.8rem;"><strong>DR merit order:</strong> stack cheapest first.</div>
      <div style="display: grid; gap: 0.3rem;">`;o.forEach(t=>{var $;const c=(($=l.find(u=>u.name===t.name))==null?void 0:$.taken)||0,n=c/t.mw*100,p=n>0;f+=`<div style="display: grid; grid-template-columns: 240px 100px 1fr 100px; gap: 0.5rem; align-items: center; padding: 0.35rem 0.6rem; border: 1.5px solid var(--ink); border-radius: 3px; background: ${p?"rgba(76, 175, 80, 0.12)":"var(--paper)"};">
        <div>
          <div style="font-family: var(--font-mono); font-size: 0.82rem;">${t.name}</div>
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft);">ramp ${t.ramp} · ${t.desc}</div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem; text-align: right;">$${t.cost}/MWh</div>
        <div style="position: relative; height: 16px; background: var(--paper-deep); border: 1px solid var(--ink); border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; width: ${n}%; background: #4caf50;"></div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem; text-align: right;">${c.toFixed(0)} / ${t.mw} MW</div>
      </div>`}),f+=`</div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.8rem;">
      <div style="background: rgba(76, 175, 80, 0.12); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem;">
        <div style="font-family: var(--font-display); font-size: 1.1rem; color: #2e7d32;">DR-first approach</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem;">DR covers ${m.toFixed(0)} MW</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem;">Peaker tops up ${s.toFixed(0)} MW</div>
        <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-top: 0.3rem;">Total hourly cost: <strong>$${(e+y).toLocaleString()}</strong></div>
      </div>
      <div style="background: rgba(214, 40, 40, 0.08); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem;">
        <div style="font-family: var(--font-display); font-size: 1.1rem; color: #d62828;">Peaker-only approach</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem;">Peaker covers all ${r} MW</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem;">@ $${F.lcoe}/MWh</div>
        <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-top: 0.3rem;">Total hourly cost: <strong>$${x.toLocaleString()}</strong></div>
      </div>
    </div>`,a.querySelector("#dr-stage").innerHTML=f;const b=x-(e+y);let g;b>.4*x?g="<strong>DR is the obvious win.</strong> Most of the shortfall can be flexed away at $25-60/MWh — far below a peaker's $180. This is why ISOs prefer DR to building new gas: same MW available, fraction of the cost.":b>0?g=`<strong>Mixed approach.</strong> Cheap DR is exhausted; a peaker is needed for the residual. Combined cost still beats peaker-only by $${b.toLocaleString()}.`:g="<strong>DR alone is not enough.</strong> The need exceeds available flexible load — a peaker is doing most of the work. Long-term answer: more storage and demand-side enrollment.",a.querySelector("#dr-explain").innerHTML=g}h()}const T={France:{avg:50,marginal:380,mix:"Nuclear baseload + small gas peakers",solar:"low"},Sweden:{avg:30,marginal:80,mix:"Hydro + nuclear; mostly clean even at margin",solar:"low"},Germany:{avg:380,marginal:700,mix:"Renewable-heavy, but lignite or hard coal at the margin",solar:"high"},UK:{avg:200,marginal:450,mix:"Wind + gas; gas usually marginal",solar:"medium"},California:{avg:240,marginal:420,mix:"Solar + gas; gas at the margin most evenings",solar:"high"},Texas:{avg:410,marginal:480,mix:"Wind, gas, coal — almost always gas marginal",solar:"medium"},Poland:{avg:720,marginal:950,mix:"Mostly coal — every kWh you add is coal",solar:"low"},Thailand:{avg:500,marginal:580,mix:"Gas-dominated; coal at peak",solar:"high"},India:{avg:700,marginal:950,mix:"Coal baseload + coal margin",solar:"high"}},H=[{name:"2am (deep night)",solarFactor:0,margBoost:.9},{name:"7am (morning ramp)",solarFactor:.1,margBoost:1},{name:"noon (solar peak)",solarFactor:1,margBoost:.6},{name:"5pm (evening ramp)",solarFactor:.3,margBoost:1.1},{name:"8pm (peak demand)",solarFactor:0,margBoost:1.2}];function Z(a){let r="California",h=4,o=60;a.innerHTML=`
    <div class="widget">
      <div class="widget-title">Average vs marginal carbon</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
          <label>Country:</label>
          <div class="pill-group">
            ${Object.keys(T).map((e,l)=>`
              <input type="radio" name="cb-c" id="cb-c${l}" value="${e}" ${e===r?"checked":""}>
              <label for="cb-c${l}">${e}</label>
            `).join("")}
          </div>
        </div>
        <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
          <label>Hour:</label>
          <div class="pill-group">
            ${H.map((e,l)=>`
              <input type="radio" name="cb-h" id="cb-h${l}" value="${l}" ${l===h?"checked":""}>
              <label for="cb-h${l}">${e.name}</label>
            `).join("")}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 180px 1fr 80px; gap: 0.6rem; align-items: center;">
          <label>EV charge (kWh):</label>
          <input type="range" id="cb-k" min="10" max="100" value="${o}" step="5">
          <div id="cb-k-v" style="font-family: var(--font-mono); text-align: right;">${o}</div>
        </div>
      </div>

      <div class="widget-stage" id="cb-stage"></div>
      <div class="callout" id="cb-explain"></div>
    </div>
  `,a.querySelectorAll("input[name=cb-c]").forEach(e=>e.addEventListener("change",l=>{r=l.target.value,i()})),a.querySelectorAll("input[name=cb-h]").forEach(e=>e.addEventListener("change",l=>{h=+l.target.value,i()})),a.querySelector("#cb-k").addEventListener("input",e=>{o=+e.target.value,a.querySelector("#cb-k-v").textContent=o,i()});function i(){const e=T[r],l=H[h],m=e.solar==="high"?1:e.solar==="medium"?.6:.2,s=Math.max(20,e.avg*(1-l.solarFactor*m*.45)),y=e.marginal*l.margBoost,x=o*s/1e3,f=o*y/1e3,b=2.31,g=o/.18,t=g/12*b,c=540,n=180,p=50;function $(d){return n-p-d/1e3*(n-2*p)}let u=`<svg viewBox="0 0 ${c} ${n}" width="100%" style="max-width: ${c}px">`;u+=`<line x1="${p}" y1="${n-p}" x2="${c-p}" y2="${n-p}" stroke="var(--ink)" stroke-width="2"/>`,u+=`<line x1="${p}" y1="${p}" x2="${p}" y2="${n-p}" stroke="var(--ink)" stroke-width="2"/>`,[0,250,500,750,1e3].forEach(d=>u+=`<text x="${p-8}" y="${$(d)+3}" text-anchor="end" style="font-family: var(--font-mono); font-size: 10px;">${d}</text>`),[{label:"Average",v:s,color:"#4caf50"},{label:"Marginal",v:y,color:"#d62828"}].forEach((d,S)=>{const C=p+60+S*160,w=110;u+=`<rect x="${C}" y="${$(d.v)}" width="${w}" height="${n-p-$(d.v)}" fill="${d.color}" stroke="var(--ink)" stroke-width="2"/>`,u+=`<text x="${C+w/2}" y="${$(d.v)-5}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px; font-weight: 600;">${d.v.toFixed(0)}</text>`,u+=`<text x="${C+w/2}" y="${n-p+18}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">${d.label}</text>`}),u+=`<text x="14" y="${n/2}" text-anchor="middle" style="font-family: var(--font-display); font-size: 12px;" transform="rotate(-90 14 ${n/2})">gCO₂/kWh</text>`,u+="</svg>";let M=`<div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; margin-bottom: 0.5rem; font-family: var(--font-mono); font-size: 0.82rem;">
      <div><strong>${r}</strong> at <strong>${l.name}</strong></div>
      <div style="color: var(--ink-soft); margin-top: 0.2rem;">${e.mix}</div>
    </div>${u}
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem;">
      <div style="border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; background: var(--paper);">
        <div style="font-family: var(--font-display); font-size: 1rem;">EV (avg accounting)</div>
        <div style="font-family: var(--font-mono); font-size: 1.3rem; color: var(--accent);">${x.toFixed(1)} kg CO₂</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft);">${o} kWh × ${s.toFixed(0)} g/kWh</div>
      </div>
      <div style="border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; background: var(--paper);">
        <div style="font-family: var(--font-display); font-size: 1rem;">EV (marginal — honest)</div>
        <div style="font-family: var(--font-mono); font-size: 1.3rem; color: var(--accent);">${f.toFixed(1)} kg CO₂</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft);">${o} kWh × ${y.toFixed(0)} g/kWh</div>
      </div>
    </div>
    <div style="margin-top: 0.5rem; border: 2px dashed var(--ink-soft); border-radius: var(--radius); padding: 0.5rem 0.8rem; font-family: var(--font-mono); font-size: 0.82rem;">
      For the same distance (~${g.toFixed(0)} km) a gasoline car emits ~<strong>${t.toFixed(1)} kg CO₂</strong>. EV wins unless your grid is almost pure coal at the margin.
    </div>`;a.querySelector("#cb-stage").innerHTML=M;let k;l.solarFactor>.7&&e.solar!=="low"?k="<strong>Charge at noon.</strong> Solar drags average intensity down. But the marginal source is still gas (or coal) — your additional kWh comes from whichever plant ramped to serve you, not from the existing solar farm.":e.avg<100?k="<strong>Clean grid, easy win.</strong> Even at the margin you are below most other countries' average. Electrify everything you can.":e.marginal>700?k="<strong>Coal-marginal grid.</strong> Average looks moderate, marginal is brutal. Your extra demand pulls coal up. Time-shifting helps a little, switching to a heat pump helps a lot, rooftop solar helps most.":k="<strong>Mid-carbon grid.</strong> Average vs marginal differ by ~2×. For decision-making (should I charge now or in 4 hours?), look at marginal. For reporting (what did I emit last year?), use average.",a.querySelector("#cb-explain").innerHTML=k}i()}const E=a=>()=>W.jsx(R,{init:a}),ee={slug:"energy-systems",title:"Energy Systems",intro:W.jsx(W.Fragment,{children:"Eight lessons on how a power grid balances supply and demand in real time — units, generation mix, duck curves, frequency control, storage arbitrage, LCOE, demand response, and carbon accounting."}),lessons:[{slug:"units",number:"01",title:"Units & Scales",blurb:"Watts vs watt-hours, MWh vs TWh, capacity vs energy.",Widget:E(I),intro:W.jsx(W.Fragment,{children:"Half of every energy debate is unit confusion. Power is a rate (W), energy is an amount (Wh). Capacity is what a plant can produce; energy is what it actually does."}),sections:[],takeaways:["Watt = energy rate. Watt-hour = energy.","kW × hours = kWh. Easy.","Capacity factor: actual output / nameplate × time. Solar ~20%, nuclear ~90%.","Country scale: TWh/year. Household: kWh/month."]},{slug:"generation-mix",number:"02",title:"Generation Mix",blurb:"Each source plays a different role.",Widget:E(B),intro:W.jsx(W.Fragment,{children:"Baseload runs flat all day. Load-following ramps with demand. Peakers cover the spikes. Intermittents (wind, solar) cover whatever they can. The mix decides cost and carbon."}),sections:[],takeaways:["Coal/nuclear/large hydro: baseload — cheap to run, slow to change.","CCGT (gas): load-following. Mid-tier cost.","Open-cycle gas: peakers — expensive but fast.","Wind/solar: zero marginal cost, no control over output."]},{slug:"duck-curve",number:"03",title:"The Duck Curve",blurb:"California's net-load shape after rooftop solar.",Widget:E(N),intro:W.jsx(W.Fragment,{children:"Subtract rooftop solar from demand and you get a duck-shaped curve. Midday sag, evening ramp — the evening ramp is what gas peakers have to chase and what batteries can replace."}),sections:[],takeaways:["Solar floods the grid mid-day. Net-load plummets.","Then everyone gets home; solar dies; net-load spikes.","The ramp rate (MW per minute) is harder to handle than the magnitude.","Storage that absorbs midday glut and releases at peak is the cleanest fix."]},{slug:"frequency",number:"04",title:"Grid Frequency",blurb:"50 or 60 Hz, held to within a few millihertz.",Widget:E(U),intro:W.jsx(W.Fragment,{children:"The grid is a single synchronous machine — every generator and motor rotates in lockstep. Frequency drifts when supply doesn\\'t match demand. Inertia, governor response, and AGC keep it locked."}),sections:[],takeaways:["Frequency drops when load exceeds generation. Watch it after a plant trips.","Inertia (spinning mass) buys seconds. Renewables provide none — synthetic inertia from batteries is needed.","Governor response (5 sec) and AGC (minutes) restore the balance.","Under-frequency load shedding is the last line before blackouts."]},{slug:"storage",number:"05",title:"Storage Arbitrage",blurb:"Buy cheap at midnight, sell expensive at 7 pm.",Widget:E(V),intro:W.jsx(W.Fragment,{children:"Grid-scale batteries make money on the price spread between cheap and expensive hours. Round-trip efficiency and cycle count decide whether the math works."}),sections:[],takeaways:["Round-trip efficiency: 85–90% for lithium-ion, lower for pumped hydro.","Cycle cost: battery degrades per full charge-discharge.","Daily price spread × cycles × efficiency must beat capital + degradation.","Frequency response and capacity payments often pay better than arbitrage."]},{slug:"lcoe",number:"06",title:"LCOE & Merit Order",blurb:"Levelized cost of energy decides who runs first.",Widget:E(_),intro:W.jsx(W.Fragment,{children:"LCOE rolls capital, fuel, and O&M into a single $/MWh number. The grid operator dispatches plants in cost order — cheapest first — until demand is met. Solar\\'s near-zero marginal cost crushes midday prices."}),sections:[],takeaways:["LCOE = (total lifecycle cost) / (total energy produced).","Merit order: dispatch cheapest first.","Solar marginal cost ≈ 0 once installed. Always dispatched when available.","LCOE undervalues firm power — it doesn't capture when energy is delivered."]},{slug:"demand-response",number:"07",title:"Demand Response",blurb:"Pay big consumers to drop demand for an hour.",Widget:E(X),intro:W.jsx(W.Fragment,{children:"Instead of adding peaker plants, pay aluminum smelters, data centers, and EV fleets to back off for an hour. Often cheaper than the alternative."}),sections:[],takeaways:["DR is cheaper than peaker plants per MW of peak shaved.","Industrial DR: known and reliable. Has been done for decades.","Residential DR: smart thermostats, smart EV charging. Growing fast.","Virtual power plants aggregate small DR resources into grid-visible blocks."]},{slug:"carbon",number:"08",title:"Carbon Accounting",blurb:"gCO2/kWh by source and country.",Widget:E(Z),intro:W.jsx(W.Fragment,{children:"Different sources emit very different amounts of CO2 per kWh — coal ~1000 g, gas ~400 g, solar/wind ~20 g (lifecycle). Marginal vs average emissions decides whether your EV is actually clean today."}),sections:[],takeaways:["Coal: ~1000 g CO2/kWh. Gas: ~400. Nuclear/wind/solar: <50 (lifecycle).","Average grid emissions: weighted by what's currently on. France ~50, Poland ~700.","Marginal emissions: what gets dispatched when you add load. Often higher.","Charging your EV at night might be dirtier than at noon — depends on the grid mix that hour."]}]};export{ee as manifest};
