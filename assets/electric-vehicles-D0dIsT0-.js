import{j as h}from"./main-b-Nq7fYF.js";import{L as q}from"./LegacyWidget-BtutJkVO.js";const R=[{name:"NMC / NCA",density:250,cost:130,life:1500,safety:5,note:"Tesla long-range, Mach-E. Best energy, lowest cycle life, highest fire risk."},{name:"LFP",density:180,cost:90,life:4e3,safety:8,note:"Tesla SR, BYD, CATL. Cheaper and lasts forever — at the price of range."},{name:"Solid-state",density:400,cost:250,life:2500,safety:9,note:"Toyota, QuantumScape. Higher energy and safer, but factory yield is still terrible."}],z=[{key:"density",label:"Energy density (Wh/kg)",max:500},{key:"cost",label:"Cost ($/kWh)",max:300,invert:!0},{key:"life",label:"Cycle life",max:5e3},{key:"safety",label:"Safety (1–10)",max:10}];function F(e){e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Battery chemistry trade-offs</div>
      <div class="widget-stage" id="cells-stage"></div>
      <div class="callout"><strong>Pick two-and-a-half.</strong> NMC wins on range, LFP on cost and longevity, solid-state on (eventually) everything — but it does not yet ship at scale.</div>
    </div>
  `;function i(r,s,m){const o=Math.min(100,r/s*100);return`<div style="position: relative; height: 14px; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: 3px; overflow: hidden;">
      <div style="height: 100%; width: ${m?Math.max(8,100-o):o}%; background: var(--accent);"></div>
    </div>`}let t='<div style="display: grid; gap: 0.8rem;">';R.forEach(r=>{t+=`<div style="border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; background: var(--paper);">
      <div style="font-family: var(--font-display); font-size: 1.2rem; color: var(--accent); margin-bottom: 0.3rem;">${r.name}</div>
      <div style="display: grid; grid-template-columns: 220px 1fr 70px; gap: 0.4rem 0.7rem; align-items: center; font-family: var(--font-mono); font-size: 0.78rem; margin-bottom: 0.4rem;">
        ${z.map(s=>`
          <div>${s.label}</div>
          <div>${i(r[s.key],s.max,s.invert)}</div>
          <div style="text-align: right;">${r[s.key].toLocaleString()}</div>
        `).join("")}
      </div>
      <div style="font-size: 0.85rem; color: var(--ink-soft);">${r.note}</div>
    </div>`}),t+="</div>",e.querySelector("#cells-stage").innerHTML=t}function B(e){let i=96,t=46,r="none";const s=3.7,m=4.8;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Build a pack, then break a cell</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.6rem;">
        <div style="display: grid; grid-template-columns: 130px 1fr 60px; gap: 0.6rem; align-items: center;">
          <label>Series (S):</label>
          <input type="range" id="pb-s" min="20" max="120" value="${i}" step="1">
          <div id="pb-s-v" style="font-family: var(--font-mono); text-align: right;">${i}</div>
        </div>
        <div style="display: grid; grid-template-columns: 130px 1fr 60px; gap: 0.6rem; align-items: center;">
          <label>Parallel (P):</label>
          <input type="range" id="pb-p" min="10" max="80" value="${t}" step="1">
          <div id="pb-p-v" style="font-family: var(--font-mono); text-align: right;">${t}</div>
        </div>
        <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
          <label>Fault:</label>
          <div class="pill-group">
            <input type="radio" name="pb-f" id="pb-f0" value="none" checked>
            <label for="pb-f0">none</label>
            <input type="radio" name="pb-f" id="pb-f1" value="weak">
            <label for="pb-f1">weak cell</label>
            <input type="radio" name="pb-f" id="pb-f2" value="hot">
            <label for="pb-f2">overheat</label>
          </div>
        </div>
      </div>

      <div class="widget-stage" id="pb-stage"></div>
      <div class="callout" id="pb-explain"></div>
    </div>
  `,e.querySelector("#pb-s").addEventListener("input",v=>{i=+v.target.value,e.querySelector("#pb-s-v").textContent=i,o()}),e.querySelector("#pb-p").addEventListener("input",v=>{t=+v.target.value,e.querySelector("#pb-p-v").textContent=t,o()}),e.querySelectorAll("input[name=pb-f]").forEach(v=>v.addEventListener("change",l=>{r=l.target.value,o()}));function o(){const v=i*t,l=i*s,a=t*m,d=l*a/1e3;let x=`<div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; margin-bottom: 0.6rem;">
      <div style="font-family: var(--font-mono); font-size: 0.85rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem 1rem;">
        <div>Total cells: <strong>${v.toLocaleString()}</strong></div>
        <div>Pack voltage: <strong>${l.toFixed(0)} V</strong></div>
        <div>Pack capacity: <strong>${a.toFixed(0)} Ah</strong></div>
        <div>Pack energy: <strong>${d.toFixed(1)} kWh</strong></div>
      </div>
    </div>`;const g=Math.min(t,24),c=Math.min(i,16),n=14,u=2,y=g*(n+u)+20,p=c*(n+u)+20;let b=`<svg viewBox="0 0 ${y} ${p}" width="100%" style="max-width: ${y*1.6}px">`;const $=(c>>1)*g+(g>>1),A=Math.min(c,g)/2.5;for(let f=0;f<c;f++)for(let C=0;C<g;C++){const E=f*g+C,D=10+C*(n+u),L=10+f*(n+u);let M="#c8f0c8";if(r==="weak"&&E===$)M="#d62828";else if(r==="hot"){const P=C-g/2,T=f-c/2;Math.sqrt(P*P+T*T)<A&&(M="#f5a623")}b+=`<rect x="${D}" y="${L}" width="${n}" height="${n}" fill="${M}" stroke="var(--ink)" stroke-width="0.8" rx="2"/>`}b+="</svg>",x+=`<div style="text-align: center;">${b}</div>`,x+=`<div style="font-family: var(--font-mono); font-size: 0.75rem; text-align: center; color: var(--ink-soft); margin-top: 0.3rem;">(showing ${c}×${g} subset of ${i}×${t} full pack)</div>`,e.querySelector("#pb-stage").innerHTML=x;let k;r==="none"?k="<strong>Healthy pack.</strong> Every cell sits at the same voltage. The BMS sips a few mW monitoring temperatures, individual cell voltages, and current.":r==="weak"?k="<strong>One cell sagging.</strong> Because cells are in series, the weakest one drags down the whole string at full discharge. BMS limits depth-of-discharge to protect it — you lose effective capacity.":k="<strong>Thermal event detected.</strong> BMS opens the main contactors, isolates the bad module, and triggers coolant flow. If runaway reaches a single cell venting, neighbors are next — that is why packs have firewalls between modules.",e.querySelector("#pb-explain").innerHTML=k}o()}const W=[{name:"PMSM",color:"#d62828",torque:e=>e<4e3?450:450*4e3/e,note:"Permanent magnets. Highest efficiency at part-load, used in most modern EVs. Rare-earth supply risk."},{name:"Induction",color:"#2b6cb0",torque:e=>e<3e3?380:380*3e3/e,note:"Tesla Model S/X front motor. No magnets, just induced fields. Cheaper, robust, slightly less efficient."},{name:"ICE (gas)",color:"#888",torque:e=>e<1e3?80:e<4500?80+(e-1e3)*240/3500:e<6e3?320-(e-4500)*40/1500:0,note:"Gasoline engine for comparison. Builds torque slowly, peaks mid-band, dies at redline."}];function V(e){let i=new Set(["PMSM","ICE (gas)"]);e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Torque vs RPM</div>

      <div class="controls">
        ${W.map(r=>`<label style="display: inline-flex; gap: 0.4em; align-items: center;">
          <input type="checkbox" data-m="${r.name}" ${i.has(r.name)?"checked":""}>
          <span style="color: ${r.color}; font-weight: 600;">${r.name}</span>
        </label>`).join("")}
      </div>

      <div class="widget-stage" id="mt-stage"></div>
      <div class="callout" id="mt-explain"></div>
    </div>
  `,e.querySelectorAll("input[type=checkbox]").forEach(r=>r.addEventListener("change",()=>{r.checked?i.add(r.dataset.m):i.delete(r.dataset.m),t()}));function t(){function l(n){return 50+n/9e3*500}function a(n){return 250-n/500*200}let d='<svg viewBox="0 0 600 300" width="100%" style="max-width: 600px">';d+='<line x1="50" y1="250" x2="550" y2="250" stroke="var(--ink)" stroke-width="2"/>',d+='<line x1="50" y1="50" x2="50" y2="250" stroke="var(--ink)" stroke-width="2"/>',[0,2e3,4e3,6e3,8e3].forEach(n=>{d+=`<line x1="${l(n)}" y1="250" x2="${l(n)}" y2="255" stroke="var(--ink)"/>`,d+=`<text x="${l(n)}" y="268" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${n}</text>`}),[0,100,200,300,400,500].forEach(n=>{d+=`<line x1="45" y1="${a(n)}" x2="50" y2="${a(n)}" stroke="var(--ink)"/>`,d+=`<text x="42" y="${a(n)+3}" text-anchor="end" style="font-family: var(--font-mono); font-size: 10px;">${n}</text>`}),d+=`<text x="${600/2}" y="288" text-anchor="middle" style="font-family: var(--font-display); font-size: 13px;">RPM</text>`,d+=`<text x="15" y="${300/2}" text-anchor="middle" style="font-family: var(--font-display); font-size: 13px;" transform="rotate(-90 15 ${300/2})">Torque (N·m)</text>`,W.forEach(n=>{if(!i.has(n.name))return;let u=[];for(let y=0;y<=9e3;y+=200)u.push(`${l(y)},${a(Math.min(500,n.torque(y)))}`);d+=`<polyline points="${u.join(" ")}" fill="none" stroke="${n.color}" stroke-width="3"/>`}),d+="</svg>",e.querySelector("#mt-stage").innerHTML=d;const x=i.has("PMSM")||i.has("Induction"),g=i.has("ICE (gas)");let c="";x&&g?c="<strong>The EV has full torque at 0 RPM.</strong> The ICE has to rev to 4000+ RPM (via a multi-speed gearbox) to match. That is why EVs feel quicker even when on-paper horsepower is similar.":x?c=W.find(n=>i.has(n.name)).note:g?c="<strong>Note the bell curve.</strong> ICE engines are designed around a power band. Outside it, you need to change gear. EVs do not have a power band — that is why they often use a single-speed reducer.":c="Tick at least one curve to see it.",e.querySelector("#mt-explain").innerHTML=c}t()}function j(e){let i=100,t=.7;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">How much braking energy comes back</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: grid; grid-template-columns: 160px 1fr 70px; gap: 0.6rem; align-items: center;">
          <label>Speed (km/h):</label>
          <input type="range" id="rg-s" min="20" max="150" value="${i}" step="5">
          <div id="rg-s-v" style="font-family: var(--font-mono); text-align: right;">${i}</div>
        </div>
        <div style="display: grid; grid-template-columns: 160px 1fr 70px; gap: 0.6rem; align-items: center;">
          <label>Regen aggressiveness:</label>
          <input type="range" id="rg-a" min="0" max="100" value="${t*100}" step="5">
          <div id="rg-a-v" style="font-family: var(--font-mono); text-align: right;">${Math.round(t*100)}%</div>
        </div>
      </div>

      <div class="widget-stage" id="rg-stage"></div>
      <div class="callout" id="rg-explain"></div>
    </div>
  `,e.querySelector("#rg-s").addEventListener("input",s=>{i=+s.target.value,e.querySelector("#rg-s-v").textContent=i,r()}),e.querySelector("#rg-a").addEventListener("input",s=>{t=+s.target.value/100,e.querySelector("#rg-a-v").textContent=Math.round(t*100)+"%",r()});function r(){const m=i/3.6,o=.5*2e3*m*m/1e3,v=.85,l=Math.min(1,m/8),a=o*t*v*l,d=o*(1-t*l),x=o*t*l*(1-v),g=o,c=a/g*100,n=x/g*100,u=d/g*100;let y=`<div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; margin-bottom: 0.6rem; font-family: var(--font-mono); font-size: 0.85rem;">
      Kinetic energy at ${i} km/h: <strong>${o.toFixed(0)} kJ</strong> (= ${(o/3600).toFixed(3)} kWh)
    </div>

    <div style="display: flex; height: 50px; border: 2px solid var(--ink); border-radius: var(--radius); overflow: hidden; margin-bottom: 0.4rem;">
      <div style="width: ${c}%; background: #4caf50; display: flex; align-items: center; justify-content: center; color: white; font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600;">${c>8?c.toFixed(0)+"%":""}</div>
      <div style="width: ${n}%; background: #f5a623; display: flex; align-items: center; justify-content: center; color: var(--ink); font-family: var(--font-mono); font-size: 0.8rem;">${n>8?n.toFixed(0)+"%":""}</div>
      <div style="width: ${u}%; background: #d62828; display: flex; align-items: center; justify-content: center; color: white; font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600;">${u>8?u.toFixed(0)+"%":""}</div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; font-family: var(--font-mono); font-size: 0.78rem;">
      <div><span style="display: inline-block; width: 12px; height: 12px; background: #4caf50; border: 1px solid var(--ink); vertical-align: middle;"></span> Recovered: <strong>${a.toFixed(0)} kJ</strong></div>
      <div><span style="display: inline-block; width: 12px; height: 12px; background: #f5a623; border: 1px solid var(--ink); vertical-align: middle;"></span> Conversion loss: <strong>${x.toFixed(0)} kJ</strong></div>
      <div><span style="display: inline-block; width: 12px; height: 12px; background: #d62828; border: 1px solid var(--ink); vertical-align: middle;"></span> Friction brake: <strong>${d.toFixed(0)} kJ</strong></div>
    </div>`;e.querySelector("#rg-stage").innerHTML=y;let p;i<25?p="<strong>Below ~25 km/h regen weakens.</strong> The motor cannot generate enough back-EMF at low speeds, so most braking falls back on friction. That is why aggressive one-pedal driving still uses pads near a stop.":t<.3?p="<strong>Mostly coasting/friction braking.</strong> Most of the kinetic energy becomes heat in the pads. Range suffers — this is the 'no regen' world ICE cars live in.":t>.9?p=`<strong>One-pedal driving.</strong> Up to ${v*100}% of recoverable energy goes back into the pack. Drag and rolling resistance still steal some, so the realistic ceiling sits around 60–70%.`:p=`<strong>Recovered ${c.toFixed(0)}% of kinetic energy.</strong> The rest is friction-brake heat plus conversion losses. Driving smoothly and using one-pedal mode in city traffic adds 10–20% real-world range.`,e.querySelector("#rg-explain").innerHTML=p}r()}function K(e){let i=250,t=75,r=!1,s=5,m=null;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Why fast charging slows past 80%</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: grid; grid-template-columns: 160px 1fr 90px; gap: 0.6rem; align-items: center;">
          <label>Charger peak (kW):</label>
          <input type="range" id="ch-k" min="50" max="350" value="${i}" step="25">
          <div id="ch-k-v" style="font-family: var(--font-mono); text-align: right;">${i}</div>
        </div>
        <div style="display: grid; grid-template-columns: 160px 1fr 90px; gap: 0.6rem; align-items: center;">
          <label>Pack size (kWh):</label>
          <input type="range" id="ch-p" min="40" max="120" value="${t}" step="5">
          <div id="ch-p-v" style="font-family: var(--font-mono); text-align: right;">${t}</div>
        </div>
        <div style="display: flex; gap: 0.6rem;">
          <button id="ch-play" class="btn">▶ Charge from 5% to 100%</button>
          <button id="ch-reset" class="btn">Reset</button>
        </div>
      </div>

      <div class="widget-stage" id="ch-stage"></div>
      <div class="callout" id="ch-explain"></div>
    </div>
  `,e.querySelector("#ch-k").addEventListener("input",a=>{i=+a.target.value,e.querySelector("#ch-k-v").textContent=i,l()}),e.querySelector("#ch-p").addEventListener("input",a=>{t=+a.target.value,e.querySelector("#ch-p-v").textContent=t,l()}),e.querySelector("#ch-play").addEventListener("click",()=>{r||(r=!0,s=5,m&&clearInterval(m),m=setInterval(()=>{s+=1,s>=100&&(s=100,r=!1,clearInterval(m)),l()},80))}),e.querySelector("#ch-reset").addEventListener("click",()=>{r=!1,s=5,m&&clearInterval(m),l()});function o(a){return a<20?i*.9:a<50?i:a<80?i*(1-(a-50)/60):i*.25*(1-(a-80)/25)}function v(a){let d=0;for(let x=5;x<a;x+=.5){const g=Math.max(1,o(x));d+=t*.005/g*3600}return d}function l(){function g(f){return 50+f/100*500}function c(f){return 210-f/350*160}let n='<svg viewBox="0 0 600 260" width="100%" style="max-width: 600px">';n+='<line x1="50" y1="210" x2="550" y2="210" stroke="var(--ink)" stroke-width="2"/>',n+='<line x1="50" y1="50" x2="50" y2="210" stroke="var(--ink)" stroke-width="2"/>',[0,25,50,75,100].forEach(f=>{n+=`<text x="${g(f)}" y="228" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">${f}%</text>`}),[0,100,200,300].forEach(f=>{n+=`<line x1="45" y1="${c(f)}" x2="50" y2="${c(f)}" stroke="var(--ink)"/>`,n+=`<text x="42" y="${c(f)+3}" text-anchor="end" style="font-family: var(--font-mono); font-size: 10px;">${f}</text>`}),n+=`<text x="${600/2}" y="248" text-anchor="middle" style="font-family: var(--font-display); font-size: 13px;">State of charge</text>`,n+=`<text x="14" y="${260/2}" text-anchor="middle" style="font-family: var(--font-display); font-size: 13px;" transform="rotate(-90 14 ${260/2})">Power (kW)</text>`;let u=[];for(let f=0;f<=100;f+=1)u.push(`${g(f)},${c(o(f))}`);n+=`<polyline points="${u.join(" ")}" fill="none" stroke="var(--accent)" stroke-width="3"/>`;const y=g(s),p=c(o(s));n+=`<circle cx="${y}" cy="${p}" r="7" fill="var(--accent)" stroke="var(--ink)" stroke-width="2"/>`,n+=`<line x1="${y}" y1="${p}" x2="${y}" y2="210" stroke="var(--ink)" stroke-width="1" stroke-dasharray="3 3"/>`,n+=`<text x="${y}" y="${p-12}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px; font-weight: 600;">${o(s).toFixed(0)} kW</text>`,n+="</svg>";const b=(v(80)-v(10))/60,$=(v(100)-v(80))/60;let A=n+`
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-top: 0.6rem; font-family: var(--font-mono); font-size: 0.8rem;">
        <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.4rem 0.6rem; border-radius: 3px;">SoC: <strong>${s}%</strong></div>
        <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.4rem 0.6rem; border-radius: 3px;">10→80%: <strong>${b.toFixed(1)} min</strong></div>
        <div style="background: var(--paper-deep); border: 1.5px solid var(--ink); padding: 0.4rem 0.6rem; border-radius: 3px;">80→100%: <strong>${$.toFixed(1)} min</strong></div>
      </div>`;e.querySelector("#ch-stage").innerHTML=A;let k;s<50?k="<strong>CC phase (constant current).</strong> The charger pushes maximum amps. Voltage rises gently. This is where you grab the most kWh per minute.":s<80?k="<strong>Tapering.</strong> Cell voltage is approaching its limit. To keep going without damaging the anode (lithium plating), the BMS cuts current.":k="<strong>CV phase (constant voltage).</strong> Voltage is held at the limit; current trickles. The last 20% can take as long as the first 60%. Most road-trip plans target 10–80% and skip the rest.",e.querySelector("#ch-explain").innerHTML=k}l()}function I(e){let i=110,t=20,r="off",s=1;const m=75,o=.92;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Real-world range estimator</div>

      <div class="controls" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
        <div style="display: grid; grid-template-columns: 130px 1fr 70px; gap: 0.6rem; align-items: center;">
          <label>Speed (km/h):</label>
          <input type="range" id="rn-s" min="40" max="160" value="${i}" step="5">
          <div id="rn-s-v" style="font-family: var(--font-mono); text-align: right;">${i}</div>
        </div>
        <div style="display: grid; grid-template-columns: 130px 1fr 70px; gap: 0.6rem; align-items: center;">
          <label>Outside temp (°C):</label>
          <input type="range" id="rn-t" min="-20" max="40" value="${t}" step="1">
          <div id="rn-t-v" style="font-family: var(--font-mono); text-align: right;">${t}°</div>
        </div>
        <div style="display: grid; grid-template-columns: 130px 1fr 70px; gap: 0.6rem; align-items: center;">
          <label>Passengers:</label>
          <input type="range" id="rn-p" min="1" max="5" value="${s}" step="1">
          <div id="rn-p-v" style="font-family: var(--font-mono); text-align: right;">${s}</div>
        </div>
        <div style="display: flex; gap: 0.6rem; align-items: center;">
          <label>HVAC:</label>
          <div class="pill-group">
            <input type="radio" name="rn-h" id="rn-h0" value="off" checked>
            <label for="rn-h0">off</label>
            <input type="radio" name="rn-h" id="rn-h1" value="heat">
            <label for="rn-h1">heat</label>
            <input type="radio" name="rn-h" id="rn-h2" value="ac">
            <label for="rn-h2">A/C</label>
          </div>
        </div>
      </div>

      <div class="widget-stage" id="rn-stage"></div>
      <div class="callout" id="rn-explain"></div>
    </div>
  `,e.querySelector("#rn-s").addEventListener("input",a=>{i=+a.target.value,e.querySelector("#rn-s-v").textContent=i,l()}),e.querySelector("#rn-t").addEventListener("input",a=>{t=+a.target.value,e.querySelector("#rn-t-v").textContent=t+"°",l()}),e.querySelector("#rn-p").addEventListener("input",a=>{s=+a.target.value,e.querySelector("#rn-p-v").textContent=s,l()}),e.querySelectorAll("input[name=rn-h]").forEach(a=>a.addEventListener("change",d=>{r=d.target.value,l()}));function v(){const a=i/3.6,n=.5*.23*2.3*1.2*a*a*a/a/3.6,p=.01*(1900+s*75)*9.81*a/a/3.6;let b=0;r==="heat"?b=Math.max(80,(20-t)*15):r==="ac"&&(b=Math.max(60,(t-20)*10));const $=t<0?(0-t)*4:0;return{aero:n,roll:p,hvac:b,cold:$}}function l(){const a=v(),d=a.aero+a.roll+a.hvac+a.cold,g=m*o*(t<0?.9:1)*1e3/d,c=480;let n=`<div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem 1rem; margin-bottom: 0.6rem;">
      <div style="font-family: var(--font-display); font-size: 1.6rem; color: var(--accent);">${Math.round(g)} km</div>
      <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-soft);">vs EPA ${c} km (${Math.round(g/c*100)}%) · ${d.toFixed(0)} Wh/km</div>
    </div>`;const u=[{k:"Aero drag",v:a.aero,color:"#d62828"},{k:"Rolling",v:a.roll,color:"#f5a623"},{k:"HVAC",v:a.hvac,color:"#2b6cb0"},{k:"Cold penalty",v:a.cold,color:"#4a4a4a"}];n+=`<div style="display: flex; height: 38px; border: 2px solid var(--ink); border-radius: var(--radius); overflow: hidden; margin-bottom: 0.4rem;">
      ${u.filter(p=>p.v>0).map(p=>{const b=p.v/d*100;return`<div style="width: ${b}%; background: ${p.color}; display: flex; align-items: center; justify-content: center; color: white; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600;">${b>12?Math.round(b)+"%":""}</div>`}).join("")}
    </div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.3rem; font-family: var(--font-mono); font-size: 0.78rem;">
      ${u.map(p=>`<div><span style="display: inline-block; width: 10px; height: 10px; background: ${p.color}; border: 1px solid var(--ink); vertical-align: middle;"></span> ${p.k}: <strong>${p.v.toFixed(0)} Wh/km</strong></div>`).join("")}
    </div>`,e.querySelector("#rn-stage").innerHTML=n;let y;i>130?y="<strong>Drag dominates at highway speed.</strong> Aero loss grows with v³, so going from 100 to 130 km/h costs you nearly 30% range, with no extra time saved on most trips.":t<0?y="<strong>Cold is brutal for EVs.</strong> The pack itself holds less usable energy below 0°C, and the cabin heater pulls 2–5 kW from the same battery. Pre-conditioning while plugged in helps.":r!=="off"&&Math.abs(t-20)>10?y="<strong>HVAC overhead is real.</strong> A heat pump (most modern EVs) trims the penalty roughly in half versus a resistive heater.":y="<strong>Best conditions:</strong> mild temp, moderate speed, HVAC off. Stay between 90–110 km/h to hit close to EPA range.",e.querySelector("#rn-explain").innerHTML=y}l()}const H=[{name:"Type 1 / J1772",ac:!0,region:"NA legacy",maxKW:7.4,desc:"Old US AC standard, single-phase. Home and L2 chargers."},{name:"Type 2 (Mennekes)",ac:!0,region:"EU / global",maxKW:22,desc:"European AC standard. Three-phase up to 22 kW. Most home wallboxes."},{name:"CCS Combo 1",ac:!1,region:"NA",maxKW:350,desc:"AC + DC pins in one connector. Used by Ford, GM, VW, Hyundai in North America."},{name:"CCS Combo 2",ac:!1,region:"EU",maxKW:400,desc:"European DC standard. Now also dominant outside Tesla globally."},{name:"NACS (Tesla)",ac:!1,region:"NA",maxKW:250,desc:"Tesla's small plug, now adopted by Ford, GM, Rivian, others. AC + DC same pins."},{name:"GB/T",ac:!1,region:"China",maxKW:250,desc:"China's DC standard. Separate AC plug. Mega-watt successor (ChaoJi) coming."},{name:"CHAdeMO",ac:!1,region:"Japan",maxKW:100,desc:"Aging Japanese DC standard. Nissan Leaf legacy. Mostly dead outside Japan."},{name:"MCS",ac:!1,region:"global",maxKW:3750,desc:"Megawatt Charging System — for trucks. Hot off the spec table."}];function N(e){let i=75;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Plug standards · time to 80%</div>

      <div class="controls" style="display: grid; grid-template-columns: 160px 1fr 70px; gap: 0.6rem; align-items: center;">
        <label>Your pack (kWh):</label>
        <input type="range" id="if-p" min="40" max="120" value="${i}" step="5">
        <div id="if-p-v" style="font-family: var(--font-mono); text-align: right;">${i}</div>
      </div>

      <div class="widget-stage" id="if-stage"></div>
      <div class="callout"><strong>Why so many standards?</strong> Each region's grid (1ph vs 3ph), regulator (UL vs CE vs CCC), and incumbent automaker froze the connector decision at different points. The world is slowly converging on CCS or NACS for DC and Type 2 for AC.</div>
    </div>
  `,e.querySelector("#if-p").addEventListener("input",r=>{i=+r.target.value,e.querySelector("#if-p-v").textContent=i,t()});function t(){const r=i*.8;let s='<div style="display: grid; gap: 0.4rem;">';const m=Math.max(...H.map(o=>o.maxKW));H.forEach(o=>{const v=o.ac?o.maxKW*.9:o.maxKW*.55,l=r/v*60,a=Math.log10(o.maxKW)/Math.log10(m)*100;s+=`<div style="display: grid; grid-template-columns: 160px 1fr 90px 90px; gap: 0.6rem; align-items: center; padding: 0.4rem 0.6rem; border: 1.5px solid var(--ink); border-radius: 3px; background: ${o.ac?"var(--paper)":"var(--paper-deep)"};">
        <div>
          <div style="font-weight: 600; font-family: var(--font-mono); font-size: 0.85rem;">${o.name}</div>
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft);">${o.region} · ${o.ac?"AC":"DC"}</div>
        </div>
        <div style="position: relative; height: 18px; background: var(--paper); border: 1px solid var(--ink); border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; width: ${a}%; background: ${o.ac?"#2b6cb0":"#d62828"};"></div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.8rem; text-align: right;"><strong>${o.maxKW} kW</strong></div>
        <div style="font-family: var(--font-mono); font-size: 0.8rem; text-align: right;">${l<60?l.toFixed(0)+" min":(l/60).toFixed(1)+" h"}</div>
      </div>
      <div style="font-size: 0.78rem; color: var(--ink-soft); padding: 0 0.6rem 0.3rem;">${o.desc}</div>`}),s+="</div>",e.querySelector("#if-stage").innerHTML=s}t()}const S=[{name:"Tesla (vision-only)",sensors:["8× cameras","12× ultrasonics (removed in newer)","no LiDAR, no radar (radar removed 2021)"],pros:"Cheap. Scales like software. Massive fleet for data collection. End-to-end neural net.",cons:"Vulnerable to glare, fog, heavy rain. No range measurement → depth is inferred. Phantom braking.",color:"#d62828"},{name:"Waymo / Cruise / WeRide",sensors:["1–5× LiDAR (spinning + solid-state)","5–8× cameras","6× radar","HD map + GPS-RTK"],pros:"Centimeter range from LiDAR. Redundant sensors mean any one can fail. Operating in robotaxi service.",cons:"Expensive ($150K+ extra hardware). Geo-fenced to mapped cities. Heavy compute load.",color:"#2b6cb0"},{name:"Mobileye / Chinese (hybrid)",sensors:["6–12× cameras","5× radar","1–2× LiDAR (high-end trims)","HD map (where licensed)"],pros:"Production-friendly cost. Sensor diversity catches edge cases vision misses. Scales without geo-fencing.",cons:"LiDAR cost still > $500/unit. Software complexity from fusing heterogeneous sensors.",color:"#4caf50"}],O=[{name:"Clear daylight, highway",tesla:95,waymo:99,mobileye:97},{name:"Heavy rain at night",tesla:60,waymo:88,mobileye:82},{name:"Dense fog",tesla:30,waymo:75,mobileye:70},{name:"Glare into low sun",tesla:55,waymo:92,mobileye:88},{name:"Unmapped rural road",tesla:85,waymo:40,mobileye:70},{name:"Snow over lane markings",tesla:35,waymo:70,mobileye:60}];function U(e){e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Vision-only vs sensor fusion</div>

      <div class="widget-stage" id="au-stage"></div>

      <div class="callout"><strong>The bet:</strong> Tesla says cameras + enough data = humans drive with vision, so a car can. Waymo says safety-critical means redundancy, not minimalism. The market may end up split: Tesla-style for personal cars, sensor-rich for robotaxis.</div>
    </div>
  `;let i='<div style="display: grid; gap: 0.8rem; margin-bottom: 1rem;">';S.forEach(t=>{i+=`<div style="border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; background: var(--paper);">
      <div style="font-family: var(--font-display); font-size: 1.15rem; color: ${t.color}; margin-bottom: 0.3rem;">${t.name}</div>
      <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft); margin-bottom: 0.4rem;">${t.sensors.join(" · ")}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.82rem;">
        <div><strong style="color: #4caf50;">+</strong> ${t.pros}</div>
        <div><strong style="color: #d62828;">−</strong> ${t.cons}</div>
      </div>
    </div>`}),i+="</div>",i+=`<div style="border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem;">
    <div style="font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 0.5rem;">Scenario robustness (rough estimate)</div>
    <div style="display: grid; grid-template-columns: 1.7fr 1fr 1fr 1fr; gap: 0.2rem 0.5rem; font-family: var(--font-mono); font-size: 0.78rem; align-items: center;">
      <div></div>
      <div style="color: ${S[0].color}; font-weight: 600; text-align: center;">Tesla</div>
      <div style="color: ${S[1].color}; font-weight: 600; text-align: center;">Waymo</div>
      <div style="color: ${S[2].color}; font-weight: 600; text-align: center;">Hybrid</div>
      ${O.map(t=>`
        <div>${t.name}</div>
        ${["tesla","waymo","mobileye"].map((r,s)=>{const m=t[r],o=S[s].color;return`<div style="position: relative; height: 18px; background: var(--paper-deep); border: 1px solid var(--ink); border-radius: 2px; overflow: hidden;">
            <div style="height: 100%; width: ${m}%; background: ${o};"></div>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: ${m>50?"white":"var(--ink)"}; font-weight: 600;">${m}%</div>
          </div>`}).join("")}
      `).join("")}
    </div>
  </div>`,e.querySelector("#au-stage").innerHTML=i}const w=e=>()=>h.jsx(q,{init:e}),J={slug:"electric-vehicles",title:"Electric Vehicles",intro:h.jsx(h.Fragment,{children:"Eight lessons stripping a Tesla or BYD down to principles — cell chemistry, BMS, motors, regen braking, charging curves, range estimation, charging infrastructure, and the autonomy stack."}),lessons:[{slug:"cells",number:"01",title:"Battery Cells",blurb:"Lithium-ion vs LFP vs solid-state.",Widget:w(F),intro:h.jsx(h.Fragment,{children:"The unit cell of a pack. Chemistry decides energy density, cost, safety, and cycle life. Trade-offs are real — you don\\'t get all four."}),sections:[],takeaways:["NMC/NCA: highest energy density, higher fire risk, shorter cycle life.","LFP: cheaper, safer, longer-lived, lower energy density.","Solid-state: emerging — higher density and safer, but slow to manufacture at scale.","Cell form factor (18650, 21700, 4680, pouch, prismatic) is a packaging choice, not a chemistry one."]},{slug:"pack-bms",number:"02",title:"Battery Pack & BMS",blurb:"Thousands of cells in series and parallel.",Widget:w(B),intro:h.jsx(h.Fragment,{children:"An EV pack has thousands of cells. The BMS balances them, watches for thermal runaway, and keeps each cell in its safe operating window."}),sections:[],takeaways:["Pack voltage = cells in series × cell voltage.","Pack capacity = cells in parallel × cell capacity.","BMS balances cells during charging — weakest cell limits the whole pack.","Thermal management is critical — heat is the killer."]},{slug:"motor",number:"03",title:"Electric Motors",blurb:"PMSM vs induction vs reluctance. Torque/RPM curves.",Widget:w(V),intro:h.jsx(h.Fragment,{children:"EV motors deliver full torque from 0 RPM — no need for a multi-speed gearbox. Different motor types trade efficiency, cost, and rare-earth dependency."}),sections:[],takeaways:["PMSM: highest efficiency, needs rare-earth magnets.","Induction: cheaper, no magnets, slightly less efficient.","Switched reluctance: simplest, no magnets, but noisier.","EVs use a single-speed reducer — no gearbox needed."]},{slug:"regen",number:"04",title:"Regenerative Braking",blurb:"Stop the car by running the motor backwards.",Widget:w(j),intro:h.jsx(h.Fragment,{children:"When you lift off the throttle, the motor acts as a generator, converting kinetic energy back to electricity. Recovers ~70% of braking energy in city driving."}),sections:[],takeaways:["Recovers kinetic energy that would otherwise become brake-pad heat.","Strongest at moderate speeds — too slow and the EMF is too low.","Friction brakes still needed for emergency stops and at very low speeds.","One-pedal driving is essentially aggressive regen + low creep."]},{slug:"charging",number:"05",title:"Charging Curves",blurb:"Why fast charging slows past 80%.",Widget:w(K),intro:h.jsx(h.Fragment,{children:'Below 80% the pack accepts maximum power. Above that, the BMS tapers to avoid lithium plating. Hence the 20→80% interval is what fast-charging "miles per minute" claims really measure.'}),sections:[],takeaways:["CC (constant current) up to ~80%, then CV (constant voltage) — current ramps down.","C-rate: charge current relative to capacity. 3C means 20 minutes to full theoretically.","Temperature matters: cold pack charges slowly, hot pack derates.",'Brand-claimed "10-80% in 15 minutes" is the realistic fast-charge experience.']},{slug:"range",number:"06",title:"Range & Efficiency",blurb:"Wh/km vs speed, temperature, payload, HVAC.",Widget:w(I),intro:h.jsx(h.Fragment,{children:"Range is energy in the pack divided by energy per km. The denominator changes wildly with speed, temperature, terrain, and HVAC load."}),sections:[],takeaways:["Aerodynamic drag dominates above ~70 km/h. Doubles every 30 km/h roughly.","Cold weather: 30%+ range loss from heater + chemistry slowdown.","HVAC pulls 1–3 kW continuously. Real impact on highway.","EPA/WLTP ratings are unrealistic — real-world is 70–90% of label."]},{slug:"infrastructure",number:"07",title:"Charging Infrastructure",blurb:"AC vs DC, CCS vs NACS vs GB/T.",Widget:w(N),intro:h.jsx(h.Fragment,{children:"Why every country picked a different plug. AC charging is slow but ubiquitous; DC fast charging requires standardized high-power connectors."}),sections:[],takeaways:["AC: 3–22 kW, via onboard charger. Home + workplace.","DC: 50–350 kW, bypasses onboard charger. Highway.","CCS dominant in EU/US. NACS (Tesla) becoming North American standard.","CHAdeMO is dying. GB/T is China only. Megawatt charging for trucks is coming."]},{slug:"autonomy",number:"08",title:"Autonomy Stack",blurb:"Sensors, perception, planning, control. Tesla's vision-only vs Waymo's sensor fusion.",Widget:w(U),intro:h.jsx(h.Fragment,{children:"Self-driving is sensors → perception → prediction → planning → control. Tesla bets on vision-only at scale; Waymo bets on lidar + HD maps in geofenced areas."}),sections:[],takeaways:[`Perception: pixels → "there's a car at distance D moving at velocity V".`,"Prediction: where will it be in 5 seconds?","Planning: pick a safe trajectory.","Vision-only is cheaper but harder; sensor fusion is more robust but more expensive."]}]};export{J as manifest};
