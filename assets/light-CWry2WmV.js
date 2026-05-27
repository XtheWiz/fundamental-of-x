import{j as p}from"./main-Dfqj_VUe.js";import{L}from"./LegacyWidget-CUf1c2G7.js";const w=[{min:1e-12,max:1e-11,label:"gamma",color:"#9c27b0"},{min:1e-11,max:1e-8,label:"X-ray",color:"#673ab7"},{min:1e-8,max:38e-8,label:"UV",color:"#3f51b5"},{min:38e-8,max:45e-8,label:"violet",color:"#7c4dff"},{min:45e-8,max:495e-9,label:"blue",color:"#2196f3"},{min:495e-9,max:57e-8,label:"green",color:"#4caf50"},{min:57e-8,max:59e-8,label:"yellow",color:"#ffeb3b"},{min:59e-8,max:62e-8,label:"orange",color:"#ff9800"},{min:62e-8,max:75e-8,label:"red",color:"#f44336"},{min:75e-8,max:.001,label:"infrared",color:"#b71c1c"},{min:.001,max:.1,label:"microwave",color:"#795548"},{min:.1,max:1e3,label:"radio",color:"#607d8b"}],H=[{w:5e-13,what:"gamma rays from radioactive decay"},{w:1e-10,what:"medical X-rays"},{w:1e-8,what:"ultraviolet — sunburn risk"},{w:55e-8,what:"green light — peak of human eye sensitivity"},{w:85e-8,what:"near-IR — TV remote"},{w:.01,what:"microwave oven (2.45 GHz)"},{w:1,what:"300 MHz radio (FM territory)"},{w:1e3,what:"long-wave radio"}];function S(t){let e=Math.log10(55e-8);t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Slide across the EM spectrum</div>

      <div class="controls">
        <label>Wavelength: <strong id="sp-w">—</strong></label>
        <input type="range" min="-12" max="3" step="0.05" value="${e}" id="sp-r" style="flex: 1;">
      </div>

      <div class="widget-stage" id="sp-stage" style="min-height: 220px;"></div>

      <div class="callout" id="sp-explain"></div>
    </div>
  `,t.querySelector("#sp-r").addEventListener("input",o=>{e=Number(o.target.value),f()});function i(o){return o<1e-9?(o*1e12).toPrecision(3)+" pm":o<1e-6?(o*1e9).toPrecision(3)+" nm":o<.001?(o*1e6).toPrecision(3)+" µm":o<1?(o*1e3).toPrecision(3)+" mm":o<1e3?o.toPrecision(3)+" m":(o/1e3).toPrecision(3)+" km"}function f(){const o=Math.pow(10,e),n=3e8/o,x=4135667696e-24*n,m=w.find(r=>o>=r.min&&o<r.max)||w[w.length-1],a=H.reduce((r,g)=>Math.abs(Math.log10(g.w)-e)<Math.abs(Math.log10(r.w)-e)?g:r,H[0]),h=600,s=80;let l=`<svg viewBox="0 0 ${h} ${s+60}" width="100%" style="max-width: ${h}px">`;l+='<defs><linearGradient id="sp-grad" x1="0" y1="0" x2="1" y2="0">',w.forEach((r,g)=>{l+=`<stop offset="${g/(w.length-1)}" stop-color="${r.color}"/>`}),l+="</linearGradient></defs>",l+=`<rect x="0" y="20" width="${h}" height="${s}" fill="url(#sp-grad)" stroke="var(--ink)" stroke-width="2"/>`;const d=(e- -12)/15*h;l+=`<line x1="${d}" y1="10" x2="${d}" y2="${s+30}" stroke="var(--ink)" stroke-width="2.5"/>`,l+=`<polygon points="${d-7},10 ${d+7},10 ${d},22" fill="var(--ink)"/>`,l+=`<text x="0" y="${s+50}" style="font-family: var(--font-mono); font-size: 11px;">long λ</text>`,l+=`<text x="${h}" y="${s+50}" text-anchor="end" style="font-family: var(--font-mono); font-size: 11px;">short λ ↑ more energy</text>`,l+="</svg>";let c=l+`
      <div style="margin-top: 0.6rem; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem;">
        <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: 4px; padding: 0.5rem 0.7rem; text-align: center;">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase;">band</div>
          <div style="font-family: var(--font-display); font-size: 1.2rem;">${m.label}</div>
        </div>
        <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: 4px; padding: 0.5rem 0.7rem; text-align: center;">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase;">frequency</div>
          <div style="font-family: var(--font-mono); font-size: 1rem;">${n.toExponential(2)} Hz</div>
        </div>
        <div style="background: var(--paper-deep); border: 2px solid var(--ink); border-radius: 4px; padding: 0.5rem 0.7rem; text-align: center;">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase;">energy/photon</div>
          <div style="font-family: var(--font-mono); font-size: 1rem;">${x.toExponential(2)} eV</div>
        </div>
      </div>
    `;t.querySelector("#sp-stage").innerHTML=c,t.querySelector("#sp-w").textContent=i(o),t.querySelector("#sp-explain").innerHTML=`Closest familiar example: <strong>${a.what}</strong>.`}f()}function q(t){let e=30;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Angle in = angle out</div>

      <div class="controls">
        <label>Angle of incidence: <strong id="rf-av">${e}°</strong></label>
        <input type="range" min="0" max="89" value="${e}" id="rf-a" style="flex: 1;">
      </div>

      <div class="widget-stage" id="rf-stage" style="text-align: center;"></div>

      <div class="callout">The dashed line is the surface normal (perpendicular to the mirror). Both angles are measured from the normal.</div>
    </div>
  `,t.querySelector("#rf-a").addEventListener("input",f=>{e=Number(f.target.value),i()});function i(){const a=e*Math.PI/180,h=240-200*Math.sin(a),s=220-200*Math.cos(a),l=240+200*Math.sin(a),d=220-200*Math.cos(a);let c='<svg viewBox="0 0 480 280" width="100%" style="max-width: 480px">';c+='<line x1="20" y1="220" x2="460" y2="220" stroke="var(--ink)" stroke-width="3"/>';for(let g=30;g<460;g+=10)c+=`<line x1="${g}" y1="220" x2="${g-8}" y2="230" stroke="var(--ink)" stroke-width="1"/>`;c+='<line x1="240" y1="-10" x2="240" y2="240" stroke="var(--ink-soft)" stroke-width="1.5" stroke-dasharray="5 4"/>',c+=`<line x1="${h}" y1="${s}" x2="240" y2="220" stroke="var(--accent)" stroke-width="3" marker-end="url(#rf-arr)"/>`,c+=`<line x1="240" y1="220" x2="${l}" y2="${d}" stroke="#1c6dd0" stroke-width="3" marker-end="url(#rf-arr2)"/>`,c+=`<defs>
      <marker id="rf-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--accent)"/></marker>
      <marker id="rf-arr2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="#1c6dd0"/></marker>
    </defs>`;const r=40;c+=`<path d="M ${240-r*Math.sin(a)} ${220-r*Math.cos(a)} A ${r} ${r} 0 0 1 240 ${220-r}" fill="none" stroke="var(--accent)" stroke-width="1.5"/>`,c+=`<path d="M 240 ${220-r} A ${r} ${r} 0 0 1 ${240+r*Math.sin(a)} ${220-r*Math.cos(a)}" fill="none" stroke="#1c6dd0" stroke-width="1.5"/>`,c+=`<text x="210" y="195" style="font-family: var(--font-mono); font-size: 11px; fill: var(--accent);">θᵢ = ${e}°</text>`,c+=`<text x="248" y="195" style="font-family: var(--font-mono); font-size: 11px; fill: #1c6dd0;">θᵣ = ${e}°</text>`,c+="</svg>",t.querySelector("#rf-stage").innerHTML=c,t.querySelector("#rf-av").textContent=e+"°"}i()}const b={air:{n:1,label:"Air"},water:{n:1.33,label:"Water"},glass:{n:1.5,label:"Glass"},diamond:{n:2.42,label:"Diamond"}};function T(t){let e=35,i="air",f="water";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Snell's law: n₁ sin θ₁ = n₂ sin θ₂</div>

      <div class="controls">
        <label>Top medium:</label>
        <select class="field" id="rf-top">${Object.entries(b).map(([n,x])=>`<option value="${n}" ${n===i?"selected":""}>${x.label} (n=${x.n})</option>`).join("")}</select>
        <label>Bottom medium:</label>
        <select class="field" id="rf-bot">${Object.entries(b).map(([n,x])=>`<option value="${n}" ${n===f?"selected":""}>${x.label} (n=${x.n})</option>`).join("")}</select>
      </div>
      <div class="controls">
        <label>Angle of incidence: <strong id="rf-av">${e}°</strong></label>
        <input type="range" min="0" max="89" value="${e}" id="rf-a" style="flex: 1;">
      </div>

      <div class="widget-stage" id="rf-stage" style="text-align: center;"></div>
      <div class="callout" id="rf-explain"></div>
    </div>
  `,t.querySelector("#rf-a").addEventListener("input",n=>{e=Number(n.target.value),o()}),t.querySelector("#rf-top").addEventListener("change",n=>{i=n.target.value,o()}),t.querySelector("#rf-bot").addEventListener("change",n=>{f=n.target.value,o()});function o(){const n=b[i].n,x=b[f].n,m=e*Math.PI/180,a=n/x*Math.sin(m),h=Math.abs(a)>1,s=h?null:Math.asin(a),l=480,d=320,c=l/2,r=d/2,g=130;let v=`<svg viewBox="0 0 ${l} ${d}" width="100%" style="max-width: ${l}px">`;v+=`<rect x="0" y="0" width="${l}" height="${r}" fill="#cfe5ff" opacity="0.4"/>`,v+=`<rect x="0" y="${r}" width="${l}" height="${r}" fill="#a8c8e8" opacity="0.6"/>`,v+=`<text x="20" y="30" style="font-family: var(--font-mono); font-size: 12px;">${b[i].label} n₁=${n}</text>`,v+=`<text x="20" y="${r+30}" style="font-family: var(--font-mono); font-size: 12px;">${b[f].label} n₂=${x}</text>`,v+=`<line x1="0" y1="${r}" x2="${l}" y2="${r}" stroke="var(--ink)" stroke-width="2"/>`,v+=`<line x1="${c}" y1="20" x2="${c}" y2="${d-20}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="4 3"/>`;const $=c-g*Math.sin(m),y=r-g*Math.cos(m);if(v+=`<line x1="${$}" y1="${y}" x2="${c}" y2="${r}" stroke="var(--accent)" stroke-width="3" marker-end="url(#rf-a1)"/>`,h){const M=c+g*Math.sin(m),W=r-g*Math.cos(m);v+=`<line x1="${c}" y1="${r}" x2="${M}" y2="${W}" stroke="var(--accent)" stroke-width="3" stroke-dasharray="6 3" marker-end="url(#rf-a1)"/>`,v+=`<text x="${c+50}" y="${r-50}" style="font-family: var(--font-display); font-size: 14px; fill: var(--accent);">TOTAL INTERNAL REFLECTION</text>`}else{const M=c+g*Math.sin(s),W=r+g*Math.cos(s);v+=`<line x1="${c}" y1="${r}" x2="${M}" y2="${W}" stroke="#1c6dd0" stroke-width="3" marker-end="url(#rf-a2)"/>`,v+=`<text x="${c+8}" y="${r+30}" style="font-family: var(--font-mono); font-size: 11px; fill: #1c6dd0;">θ₂ = ${(s*180/Math.PI).toFixed(1)}°</text>`}v+=`<text x="${c-70}" y="${r-20}" style="font-family: var(--font-mono); font-size: 11px; fill: var(--accent);">θ₁ = ${e}°</text>`,v+=`<defs>
      <marker id="rf-a1" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--accent)"/></marker>
      <marker id="rf-a2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="#1c6dd0"/></marker>
    </defs>`,v+="</svg>",t.querySelector("#rf-stage").innerHTML=v,t.querySelector("#rf-av").textContent=e+"°";let k;h?k=`<strong>Past the critical angle (${(Math.asin(x/n)*180/Math.PI).toFixed(1)}°).</strong> Light can't escape from the denser medium — all energy reflects back. This is how fiber optics work.`:n>x?k="Going from dense to less-dense — ray bends <em>away</em> from normal.":k="Going from less-dense to dense — ray bends <em>toward</em> normal.",t.querySelector("#rf-explain").innerHTML=k}o()}function z(t){let e=80,i=120,f=30;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Converging lens</div>

      <div class="controls">
        <label>Focal length f: <strong id="ls-fv">${e}</strong> px</label>
        <input type="range" min="30" max="150" value="${e}" id="ls-f" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Object distance: <strong id="ls-ov">${i}</strong> px</label>
        <input type="range" min="20" max="280" value="${i}" id="ls-o" style="flex: 1;">
      </div>

      <div class="widget-stage" id="ls-stage" style="text-align: center;"></div>
      <div class="callout" id="ls-explain"></div>
    </div>
  `,t.querySelector("#ls-f").addEventListener("input",n=>{e=Number(n.target.value),o()}),t.querySelector("#ls-o").addEventListener("input",n=>{i=Number(n.target.value),o()});function o(){const h=i===e?1/0:i*e/(i-e),s=-h/i,l=f*s;let d='<svg viewBox="0 0 640 280" width="100%" style="max-width: 640px">';d+='<line x1="20" y1="140" x2="620" y2="140" stroke="var(--ink-soft)" stroke-width="1.5" stroke-dasharray="4 3"/>',d+=`<ellipse cx="320" cy="140" rx="10" ry="${280/2-20}" fill="#cfe5ff" stroke="var(--ink)" stroke-width="2"/>`,d+=`<circle cx="${320-e}" cy="140" r="4" fill="var(--ink)"/>`,d+=`<circle cx="${320+e}" cy="140" r="4" fill="var(--ink)"/>`,d+=`<text x="${320-e}" y="156" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">F</text>`,d+=`<text x="${320+e}" y="156" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">F</text>`;const c=320-i;if(d+=`<line x1="${c}" y1="140" x2="${c}" y2="${140-f}" stroke="var(--accent)" stroke-width="3" marker-end="url(#ls-arr)"/>`,d+=`<text x="${c}" y="${140-f-6}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px; fill: var(--accent);">object</text>`,isFinite(h)){const g=320+h;g>0&&g<640&&(d+=`<line x1="${g}" y1="140" x2="${g}" y2="${140-l}" stroke="#1c6dd0" stroke-width="3" marker-end="url(#ls-arr2)"/>`,d+=`<text x="${g}" y="${140+(l>0?-l-6:-l+18)}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px; fill: #1c6dd0;">image</text>`),d+=`<line x1="${c}" y1="${140-f}" x2="${320+h}" y2="${140-l}" stroke="#1c6dd0" stroke-width="1" opacity="0.6"/>`,d+=`<line x1="${c}" y1="${140-f}" x2="320" y2="${140-f}" stroke="#1c6dd0" stroke-width="1" opacity="0.6"/>`,d+=`<line x1="320" y1="${140-f}" x2="${320+h}" y2="${140-l}" stroke="#1c6dd0" stroke-width="1" opacity="0.6"/>`}d+=`<defs>
      <marker id="ls-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--accent)"/></marker>
      <marker id="ls-arr2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="#1c6dd0"/></marker>
    </defs>`,d+="</svg>",t.querySelector("#ls-stage").innerHTML=d,t.querySelector("#ls-fv").textContent=e,t.querySelector("#ls-ov").textContent=i;let r;Math.abs(i-e)<5?r="Object at the focal point → rays come out parallel, image at infinity. This is how a flashlight reflector works.":i<e?r="<strong>Object inside f.</strong> Image is virtual (on the same side as the object), upright, magnified. This is a magnifying glass.":i<2*e?r="<strong>Object between f and 2f.</strong> Image is real, inverted, magnified. This is what a projector does.":r="<strong>Object beyond 2f.</strong> Image is real, inverted, reduced. This is what a camera does.",t.querySelector("#ls-explain").innerHTML=r+`<br>Magnification: ${s.toFixed(2)}× — ${s<0?"inverted":"upright"}.`}o()}function E(t){let e=550,i=100;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Double slit — intensity on the screen</div>

      <div class="controls">
        <label>Wavelength: <strong id="df-wv">${e} nm</strong></label>
        <input type="range" min="380" max="750" value="${e}" id="df-w" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Slit separation: <strong id="df-dv">${i} µm</strong></label>
        <input type="range" min="20" max="300" value="${i}" id="df-d" style="flex: 1;">
      </div>

      <div class="widget-stage" id="df-stage" style="text-align: center;"></div>
      <div class="callout" id="df-explain"></div>
    </div>
  `,t.querySelector("#df-w").addEventListener("input",n=>{e=Number(n.target.value),o()}),t.querySelector("#df-d").addEventListener("input",n=>{i=Number(n.target.value),o()});function f(n){return n<440?"rgb(120, 0, 200)":n<490?"rgb(0, 100, 230)":n<510?"rgb(0, 200, 220)":n<580?"rgb(80, 220, 0)":n<645?"rgb(255, 220, 0)":"rgb(255, 60, 40)"}function o(){const m=f(e);let a='<svg viewBox="0 0 600 240" width="100%" style="max-width: 600px">';a+=`<line x1="0" y1="${240/2}" x2="600" y2="${240/2}" stroke="var(--ink-soft)" stroke-width="1"/>`;let h="";const s=e*1e-6,l=i*.001,d=.04;for(let r=0;r<=600;r+=2){const g=(r-300)*d,v=Math.PI*l*g/s,$=Math.cos(v)**2,y=240/2-$*(240/2-10);h+=(h?"L":"M")+r+","+y}a+=`<path d="${h}" stroke="${m}" stroke-width="3" fill="none"/>`,a+=`<path d="${h} L 600,${240/2} L 0,${240/2} Z" fill="${m}" opacity="0.2"/>`,a+=`<text class="ml-axis-text" x="${600/2}" y="230" text-anchor="middle">intensity on screen</text>`,a+="</svg>",t.querySelector("#df-stage").innerHTML=a,t.querySelector("#df-wv").textContent=e+" nm",t.querySelector("#df-dv").textContent=i+" µm";let c;i>200?c="<strong>Closely-spaced fringes.</strong> Wide slit separation → many bright peaks crammed close together.":i<50?c="<strong>Widely-spaced fringes.</strong> Narrow slit separation → few wide peaks. This is why diffraction limits resolution — tiny features need tiny wavelengths.":c="Wavelength and slit separation both matter. Fringe spacing = λL/d (where L is distance to screen).",t.querySelector("#df-explain").innerHTML=c}o()}function C(t){let e=0,i=0;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Malus's law in action</div>

      <div class="controls">
        <label>Input polarization: <strong id="pl-iv">${e}°</strong></label>
        <input type="range" min="0" max="180" value="${e}" id="pl-i" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Polarizer axis: <strong id="pl-pv">${i}°</strong></label>
        <input type="range" min="0" max="180" value="${i}" id="pl-p" style="flex: 1;">
      </div>

      <div class="widget-stage" id="pl-stage" style="text-align: center;"></div>
      <div class="callout" id="pl-explain"></div>
    </div>
  `,t.querySelector("#pl-i").addEventListener("input",o=>{e=Number(o.target.value),f()}),t.querySelector("#pl-p").addEventListener("input",o=>{i=Number(o.target.value),f()});function f(){const o=(i-e)*Math.PI/180,n=Math.cos(o)**2,x=480,m=240;let a=`<svg viewBox="0 0 ${x} ${m}" width="100%" style="max-width: ${x}px">`;const h=100,s=m/2,l=60,d=e*Math.PI/180;a+=`<circle cx="${h}" cy="${s}" r="${l}" fill="var(--paper-deep)" stroke="var(--ink)" stroke-width="2"/>`,a+=`<line x1="${h-l*Math.cos(d)}" y1="${s-l*Math.sin(d)}" x2="${h+l*Math.cos(d)}" y2="${s+l*Math.sin(d)}" stroke="var(--accent)" stroke-width="4"/>`,a+=`<text x="${h}" y="${s+l+20}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">input @ ${e}°</text>`;const c=x/2,r=i*Math.PI/180;a+=`<rect x="${c-60}" y="${s-60}" width="120" height="120" fill="var(--paper-deep)" stroke="var(--ink)" stroke-width="2"/>`,a+=`<line x1="${c-60*Math.cos(r)}" y1="${s-60*Math.sin(r)}" x2="${c+60*Math.cos(r)}" y2="${s+60*Math.sin(r)}" stroke="var(--ink)" stroke-width="6"/>`,a+=`<text x="${c}" y="${s+80}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">polarizer @ ${i}°</text>`;const g=x-100;a+=`<circle cx="${g}" cy="${s}" r="${l}" fill="var(--paper-deep)" stroke="var(--ink)" stroke-width="2"/>`,n>.01&&(a+=`<line x1="${g-l*Math.cos(r)*n}" y1="${s-l*Math.sin(r)*n}" x2="${g+l*Math.cos(r)*n}" y2="${s+l*Math.sin(r)*n}" stroke="var(--accent)" stroke-width="4" opacity="${.3+.7*n}"/>`),a+=`<text x="${g}" y="${s+l+20}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">output: ${(n*100).toFixed(1)}% intensity</text>`,a+=`<line x1="${h+l+5}" y1="${s}" x2="${c-65}" y2="${s}" stroke="var(--ink)" stroke-width="1.5" marker-end="url(#pl-arr)"/>`,a+=`<line x1="${c+65}" y1="${s}" x2="${g-l-5}" y2="${s}" stroke="var(--ink)" stroke-width="1.5" marker-end="url(#pl-arr)"/>`,a+='<defs><marker id="pl-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--ink)"/></marker></defs>',a+="</svg>",t.querySelector("#pl-stage").innerHTML=a,t.querySelector("#pl-iv").textContent=e+"°",t.querySelector("#pl-pv").textContent=i+"°";const v=((i-e)%180+180)%180,$=v>90?180-v:v;let y;$<5?y="<strong>Aligned.</strong> Polarizer axis matches input polarization → 100% transmission.":$>85?y="<strong>Crossed.</strong> Polarizer 90° from input → 0% transmission. Two crossed polarizers block all light.":y=`Transmission = cos²(${$}°) ≈ ${(n*100).toFixed(0)}%. This is Malus's law.`,t.querySelector("#pl-explain").innerHTML=y}f()}function P(t){let e=200,i=100,f=50;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Mix RGB primaries (additive — like a screen)</div>

      <div class="controls">
        <label>Red: <strong id="cl-rv">${e}</strong></label>
        <input type="range" min="0" max="255" value="${e}" id="cl-r" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Green: <strong id="cl-gv">${i}</strong></label>
        <input type="range" min="0" max="255" value="${i}" id="cl-g" style="flex: 1;">
      </div>
      <div class="controls">
        <label>Blue: <strong id="cl-bv">${f}</strong></label>
        <input type="range" min="0" max="255" value="${f}" id="cl-b" style="flex: 1;">
      </div>

      <div class="widget-stage" id="cl-stage" style="text-align: center;"></div>

      <div class="callout">Same three primaries are inside every screen pixel — combine them in different amounts and your brain reconstructs the perceived color. CMY printing inverts this: pigments <em>absorb</em> the channels you don't want.</div>
    </div>
  `,["r","g","b"].forEach(n=>{t.querySelector("#cl-"+n).addEventListener("input",x=>{const m=Number(x.target.value);n==="r"?e=m:n==="g"?i=m:f=m,o()})});function o(){let s='<svg viewBox="0 0 360 240" width="100%" style="max-width: 360px">';s+=`<circle cx="148" cy="110" r="60" fill="rgb(${e}, 0, 0)" opacity="0.85"/>`,s+=`<circle cx="212" cy="110" r="60" fill="rgb(0, ${i}, 0)" opacity="0.85" style="mix-blend-mode: screen;"/>`,s+=`<circle cx="180" cy="146" r="60" fill="rgb(0, 0, ${f})" opacity="0.85" style="mix-blend-mode: screen;"/>`,s+=`<rect x="40" y="200" width="280" height="30" fill="rgb(${e}, ${i}, ${f})" stroke="var(--ink)" stroke-width="2" rx="3"/>`,s+=`<text x="${360/2}" y="220" text-anchor="middle" style="font-family: var(--font-mono); font-size: 12px; fill: ${e+i+f>400?"black":"white"};">rgb(${e}, ${i}, ${f})</text>`,s+="</svg>",t.querySelector("#cl-stage").innerHTML=s,t.querySelector("#cl-rv").textContent=e,t.querySelector("#cl-gv").textContent=i,t.querySelector("#cl-bv").textContent=f}o()}function Y(t){const e=[];let i=0;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Fire photons one at a time through a double slit</div>

      <div class="controls">
        <button class="btn btn-accent" id="ph-one">Fire 1 photon</button>
        <button class="btn" id="ph-100">Fire 100</button>
        <button class="btn" id="ph-1000">Fire 1000</button>
        <button class="btn btn-ghost" id="ph-reset">Reset</button>
      </div>

      <div class="widget-stage" id="ph-stage" style="text-align: center; min-height: 280px;"></div>

      <div class="callout" id="ph-explain"></div>
    </div>
  `,t.querySelector("#ph-one").addEventListener("click",()=>f(1)),t.querySelector("#ph-100").addEventListener("click",()=>f(100)),t.querySelector("#ph-1000").addEventListener("click",()=>f(1e3)),t.querySelector("#ph-reset").addEventListener("click",()=>{e.length=0,i=0,o()});function f(n){for(let x=0;x<n;x++)for(;;){const m=Math.random()*2-1,a=Math.cos(8*m)**2;if(Math.random()<a){e.push({x:m,y:Math.random()*.8+.1}),i++;break}}o()}function o(){let a='<svg viewBox="0 0 560 280" width="100%" style="max-width: 560px">';a+=`<rect x="20" y="${280/2-15}" width="40" height="30" fill="var(--paper-deep)" stroke="var(--ink)" stroke-width="2"/>`,a+=`<text x="40" y="${280/2+5}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 10px;">src</text>`;const h=220;a+=`<rect x="${h-5}" y="0" width="10" height="${280/2-30}" fill="var(--ink)"/>`,a+=`<rect x="${h-5}" y="${280/2-10}" width="10" height="20" fill="var(--ink)"/>`,a+=`<rect x="${h-5}" y="${280/2+30}" width="10" height="${280/2-30}" fill="var(--ink)"/>`,a+='<rect x="500" y="20" width="20" height="240" fill="var(--paper-deep)" stroke="var(--ink)" stroke-width="2"/>',e.forEach(l=>{const d=20+l.y*240;a+=`<circle cx="510" cy="${d}" r="2" fill="var(--accent)" opacity="0.5"/>`,505+(l.x+1)/2*14}),a+="<g>",e.forEach(l=>{const d=24+(l.x+1)/2*232;a+=`<circle cx="510" cy="${d}" r="1.8" fill="var(--accent)" opacity="0.4"/>`}),a+="</g>",a+=`<text x="${560/2}" y="272" text-anchor="middle" style="font-family: var(--font-mono); font-size: 11px;">${i} photon${i===1?"":"s"} fired</text>`,a+="</svg>",t.querySelector("#ph-stage").innerHTML=a;let s;i===0?s="Fire one photon. It hits one spot — like a particle.":i<20?s="Each photon hits a single spot. The pattern looks random.":i<200?s="Bands are starting to appear. The single particles are <em>collectively</em> tracing out a wave pattern.":s="<strong>Clear interference fringes.</strong> Each individual photon went through one slit (particle), but the pattern over many is the wave-interference pattern. That is wave-particle duality.",t.querySelector("#ph-explain").innerHTML=s}o()}const u=t=>()=>p.jsx(L,{init:t}),I={slug:"light",title:"Light",intro:p.jsx(p.Fragment,{children:"Eight lessons on the physics of light through interactive optics experiments — the spectrum, reflection, refraction, lenses, diffraction, polarization, color perception, and wave-particle duality."}),lessons:[{slug:"spectrum",number:"01",title:"The Spectrum",blurb:"Light is electromagnetic waves. Visible is a tiny slice.",Widget:u(S),intro:p.jsx(p.Fragment,{children:"Radio, microwave, infrared, visible, UV, X-ray, gamma — all the same thing at different wavelengths. The visible band is just where our eyes evolved sensitivity."}),sections:[],takeaways:["Wavelength × frequency = speed of light. Always.","Visible: ~400–700 nm. Below 400 = UV; above 700 = IR.","Higher frequency = higher energy per photon = more damaging.","Atmospheric windows decide which bands reach the ground."]},{slug:"reflection",number:"02",title:"Reflection",blurb:"Angle in, angle out.",Widget:u(q),intro:p.jsx(p.Fragment,{children:"The angle of incidence equals the angle of reflection — measured from the surface normal. Polished surfaces preserve image; rough surfaces scatter."}),sections:[],takeaways:["Law of reflection: θᵢ = θᵣ, measured from normal.","Specular vs diffuse — same rule, different surface roughness.","Mirrors are flat metalized glass. Curved mirrors focus.","Polarization changes on reflection (Fresnel equations)."]},{slug:"refraction",number:"03",title:"Refraction",blurb:"Light bends when it changes medium. Snell's law in slow motion.",Widget:u(T),intro:p.jsx(p.Fragment,{children:"When light crosses from one medium to another, it speeds up or slows down, bending at the interface. Snell\\'s law captures the geometry."}),sections:[],takeaways:["n₁ sin θ₁ = n₂ sin θ₂. Snell's law.","Refractive index = c / phase speed in the medium.","Total internal reflection above the critical angle — basis of fiber optics.","Prisms split because n depends on wavelength (dispersion)."]},{slug:"lenses",number:"04",title:"Lenses & Imaging",blurb:"How a curved piece of glass focuses rays.",Widget:u(z),intro:p.jsx(p.Fragment,{children:"A lens is shaped so parallel rays converge at the focal point. Everything in cameras, microscopes, telescopes is built from this."}),sections:[],takeaways:["Thin-lens equation: 1/u + 1/v = 1/f.","Converging (convex) lenses focus; diverging (concave) lenses spread.","Spherical aberration: rays from the edge focus closer than from the center.","Modern lenses stack 10+ elements to correct aberrations."]},{slug:"diffraction",number:"05",title:"Diffraction & Interference",blurb:"Light is a wave — it spreads through slits and overlaps.",Widget:u(E),intro:p.jsx(p.Fragment,{children:"Send light through a narrow slit and it spreads. Send through two slits and the spread patterns overlap, producing bright and dark bands — the classic interference pattern."}),sections:[],takeaways:["Wave behavior emerges when slit ~ wavelength.","Double slit produces sinusoidal intensity pattern.","Diffraction limit: the smallest detail any lens can resolve.","CD/DVD rainbows are diffraction off the data tracks."]},{slug:"polarization",number:"06",title:"Polarization",blurb:"Light waves oscillate in a direction.",Widget:u(C),intro:p.jsx(p.Fragment,{children:"Light is a transverse wave — its E-field oscillates perpendicular to the direction of travel. Polarizers transmit only one orientation."}),sections:[],takeaways:["Unpolarized light: random orientations. Polarized: aligned.","Crossed polarizers (90°) block all light.","Malus's law: intensity = cos²(angle between).","LCDs work by twisting polarization between polarizers."]},{slug:"color",number:"07",title:"Color & Perception",blurb:"Wavelength is physical. Color is what your brain does with it.",Widget:u(P),intro:p.jsx(p.Fragment,{children:"Your eye has three cone types — red, green, blue. Color is the brain\\'s interpretation of their relative responses, not a property of light itself."}),sections:[],takeaways:["RGB additive: screens combine colored emitters. Black = none, white = all.","CMY subtractive: pigments absorb certain wavelengths. White = none, black = all.","Metamers: different spectra that look the same.","Magenta isn't on the spectrum — the brain invents it to wrap red and violet."]},{slug:"photons",number:"08",title:"Wave-Particle Duality",blurb:"Light is also discrete photons.",Widget:u(Y),intro:p.jsx(p.Fragment,{children:"Send light one photon at a time through a double slit. The pattern still appears — each photon interferes with itself. Wave and particle, simultaneously."}),sections:[],takeaways:["Photon energy E = hν. Quantized — you can't have half a photon.","Photoelectric effect: above a frequency threshold, light kicks out electrons. Won the 1921 Nobel.","Compton scattering: photons collide with electrons like particles.",`Whether you see a wave or a particle depends on what you measure — there's no "underneath".`]}]};export{I as manifest};
