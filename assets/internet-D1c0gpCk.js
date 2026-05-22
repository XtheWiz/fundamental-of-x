import{j as g}from"./main-BMJeqOcY.js";import{L as K}from"./LegacyWidget-BJxFD61r.js";const N={cold:{label:"Cold visit (nothing cached)",phases:[{id:"dns",label:"DNS lookup",rtts:1,color:"#ffe9b3"},{id:"tcp",label:"TCP handshake",rtts:1,color:"#fff6dc"},{id:"tls",label:"TLS handshake",rtts:1,color:"#f7c8c8"},{id:"http",label:"HTTP request + TTFB",rtts:1,color:"#cfe5ff"},{id:"xfer",label:"Response transfer",rtts:.3,color:"#c8f0c8"}]},warm:{label:"Warm (DNS cached)",phases:[{id:"dns",label:"DNS (cache hit)",rtts:.05,color:"#ffe9b3"},{id:"tcp",label:"TCP handshake",rtts:1,color:"#fff6dc"},{id:"tls",label:"TLS handshake",rtts:1,color:"#f7c8c8"},{id:"http",label:"HTTP request + TTFB",rtts:1,color:"#cfe5ff"},{id:"xfer",label:"Response transfer",rtts:.3,color:"#c8f0c8"}]},reuse:{label:"Connection reuse",phases:[{id:"dns",label:"DNS (cache hit)",rtts:.05,color:"#ffe9b3"},{id:"http",label:"HTTP request + TTFB",rtts:1,color:"#cfe5ff"},{id:"xfer",label:"Response transfer",rtts:.3,color:"#c8f0c8"}]},"0rtt":{label:"0-RTT (TLS resume, HTTP/3)",phases:[{id:"dns",label:"DNS (cache hit)",rtts:.05,color:"#ffe9b3"},{id:"http",label:"HTTP request + 0-RTT",rtts:.5,color:"#cfe5ff"},{id:"xfer",label:"Response transfer",rtts:.3,color:"#c8f0c8"}]}};function O(t){let s="cold",b=40,p=!1,d=0;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Page Load Waterfall</div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="jr-scen">
          ${Object.entries(N).map(([n,e])=>`<option value="${n}">${e.label}</option>`).join("")}
        </select>
        <label>RTT:</label>
        <input type="range" min="5" max="300" value="40" id="jr-rtt" style="width: 160px;">
        <span id="jr-rtt-val" style="font-family: var(--font-mono); min-width: 4em;">40ms</span>
        <button class="btn btn-accent" id="jr-run">Load page</button>
        <button class="btn btn-ghost" id="jr-reset">Reset</button>
      </div>

      <div class="widget-stage" id="stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">TTFB</div><div class="value" id="m-ttfb">—</div></div>
        <div class="metric accent"><div class="label">Total load</div><div class="value" id="m-total">—</div></div>
        <div class="metric"><div class="label">Round trips</div><div class="value" id="m-rt">—</div></div>
      </div>

      <div class="callout" id="jr-explain"></div>
    </div>
  `;const T=t.querySelector("#stage");t.querySelector("#jr-scen").addEventListener("change",n=>{s=n.target.value,v()}),t.querySelector("#jr-rtt").addEventListener("input",n=>{b=Number(n.target.value),t.querySelector("#jr-rtt-val").textContent=`${b}ms`,p||v()}),t.querySelector("#jr-run").addEventListener("click",w),t.querySelector("#jr-reset").addEventListener("click",v);function k(){return N[s].phases.reduce((n,e)=>n+e.rtts*b,0)}function m(){const n=N[s].phases;let e=0;for(const i of n)if(e+=i.rtts*b,i.id==="http")return e;return e}function y(){return N[s].phases.reduce((n,e)=>n+e.rtts,0).toFixed(1)}function v(){d=0,p=!1,o()}function w(){if(p)return;p=!0,d=0;const n=k(),e=performance.now(),i=4;function a(){if(d=(performance.now()-e)*i,d>=n){d=n,p=!1,o(),c();return}o(),requestAnimationFrame(a)}a()}function o(){const e=N[s].phases,i=k(),a=38,f=e.length*a+60;let h=`<svg viewBox="0 0 720 ${f}" width="100%" style="max-width:720px">`;h+=`<style>
      .jr-axis { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .jr-label { font-family: var(--font-display); font-size: 13px; letter-spacing: 1px; fill: var(--ink); }
      .jr-bar-bg { fill: var(--paper-deep); }
      .jr-bar { stroke: var(--ink); stroke-width: 2; }
      .jr-ttfb-line { stroke: var(--accent); stroke-width: 2; stroke-dasharray: 4 3; }
      .jr-time { font-family: var(--font-mono); font-size: 11px; fill: var(--ink); }
    </style>`;const l=180,$=700,u=$-l;h+=`<text class="jr-axis" x="${l}" y="20">0ms</text>`,h+=`<text class="jr-axis" x="${$}" y="20" text-anchor="end">${Math.round(i)}ms</text>`,h+=`<line x1="${l}" y1="24" x2="${$}" y2="24" stroke="var(--ink-soft)" stroke-width="1"/>`;const x=m(),S=l+x/i*u;h+=`<line class="jr-ttfb-line" x1="${S}" y1="30" x2="${S}" y2="${f-10}"/>`,h+=`<text x="${S+4}" y="40" style="font-family: var(--font-mono); font-size: 10px; fill: var(--accent);">TTFB</text>`;let P=0;e.forEach((q,j)=>{const C=50+j*a,H=q.rtts*b,W=l+P/i*u,A=H/i*u;h+=`<text class="jr-label" x="170" y="${C+16}" text-anchor="end">${r(q.label)}</text>`,h+=`<rect class="jr-bar-bg" x="${l}" y="${C}" width="${u}" height="24" rx="3"/>`;const F=Math.min(1,Math.max(0,(d-P)/H)),U=A*F;h+=`<rect class="jr-bar" x="${W}" y="${C}" width="${U}" height="24" rx="3" fill="${q.color}"/>`,h+=`<rect x="${W}" y="${C}" width="${A}" height="24" rx="3" fill="none" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="3 3" opacity="0.5"/>`,h+=`<text class="jr-time" x="${W+6}" y="${C+16}">${Math.round(H)}ms</text>`,P+=H}),h+="</svg>",T.innerHTML=h,t.querySelector("#m-ttfb").textContent=`${Math.round(m())}ms`,t.querySelector("#m-total").textContent=`${Math.round(k())}ms`,t.querySelector("#m-rt").textContent=y()}function c(){let n="";s==="cold"?n=`<strong>Cold visit:</strong> 3 full RTTs of handshakes (DNS + TCP + TLS) before the server even sees your HTTP request. At ${b}ms RTT that's ${b*3}ms gone before anything useful happens. This is why first visits feel slow on poor connections.`:s==="warm"?n="<strong>Warm visit:</strong> DNS is cached, saving one RTT. You still pay TCP + TLS + HTTP. Worth getting users back to your site — the second visit is meaningfully faster.":s==="reuse"?n="<strong>Connection reuse:</strong> When the browser already has a TCP+TLS connection open to your origin (e.g. fetching extra assets on the same page), the cost collapses to just the HTTP request. <em>This is most of what HTTP/2 enables.</em>":n="<strong>0-RTT:</strong> With TLS session resumption or HTTP/3, the very first HTTP request can ride along with the TLS handshake. Effectively zero round trips of overhead. Modern CDNs do this when possible.",t.querySelector("#jr-explain").innerHTML=n}function r(n){return String(n).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}v(),c()}const E=[{id:"you",label:"You",sub:"192.168.1.42",x:70,y:120,kind:"you"},{id:"gw",label:"Home Router",sub:"192.168.1.1",x:200,y:120,kind:"router"},{id:"isp1",label:"ISP Edge",sub:"203.0.113.1",x:320,y:60,kind:"router"},{id:"isp2",label:"ISP Core",sub:"198.51.100.5",x:320,y:200,kind:"router"},{id:"bb1",label:"Backbone A",sub:"209.0.50.10",x:470,y:60,kind:"router"},{id:"bb2",label:"Backbone B",sub:"209.0.50.22",x:470,y:200,kind:"router"},{id:"cdn",label:"CDN Edge",sub:"151.101.1.5",x:600,y:120,kind:"router"},{id:"srv",label:"Web Server",sub:"185.199.108.153",x:720,y:120,kind:"server"}],Y=[["you","gw"],["gw","isp1"],["gw","isp2"],["isp1","bb1"],["isp2","bb2"],["bb1","cdn"],["bb2","cdn"],["cdn","srv"]],z={north:["you","gw","isp1","bb1","cdn","srv"],south:["you","gw","isp2","bb2","cdn","srv"]};function V(t){let s="north",b=64,p=0,d=!1,T=[];t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Hop by Hop</div>
      <p class="widget-hint">Send a packet from "You" to the web server. Each router decrements TTL by 1.</p>

      <div class="controls">
        <label>Route:</label>
        <div class="pill-group">
          <input type="radio" name="ip-path" id="ip-n" value="north" checked>
          <label for="ip-n">North</label>
          <input type="radio" name="ip-path" id="ip-s" value="south">
          <label for="ip-s">South</label>
        </div>
        <label>Initial TTL:</label>
        <input type="number" id="ttl" value="64" min="1" max="255" class="field" style="width: 70px;">
        <button class="btn btn-accent" id="send">Send packet</button>
        <button class="btn btn-ghost" id="reset">Reset</button>
      </div>

      <div class="widget-stage" id="stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Hops</div><div class="value" id="m-hops">0</div></div>
        <div class="metric"><div class="label">TTL remaining</div><div class="value" id="m-ttl">—</div></div>
        <div class="metric accent"><div class="label">Status</div><div class="value" id="m-status">Idle</div></div>
      </div>

      <div class="log" id="log"></div>
    </div>
  `;const k=t.querySelector("#stage"),m=t.querySelector("#log");t.querySelectorAll("input[name=ip-path]").forEach(r=>r.addEventListener("change",n=>{s=n.target.value,y()})),t.querySelector("#ttl").addEventListener("change",r=>{b=Math.max(1,Math.min(255,Number(r.target.value)||64)),y()}),t.querySelector("#send").addEventListener("click",v),t.querySelector("#reset").addEventListener("click",y);function y(){p=0,T=[],d=!1,w("Idle")}async function v(){if(d)return;d=!0,p=0,T=[];const r=z[s];let n=b;o("info",`Sending packet, TTL=${n}, src=${E.find(e=>e.id==="you").sub}, dst=${E.find(e=>e.id==="srv").sub}`),w("In flight"),await wait(450);for(let e=1;e<r.length;e++){p=e;const i=E.find(a=>a.id===r[e]);if(n-=1,o(n<=0?"err":"ok",`Hop ${e} → ${i.label} (${i.sub}). TTL=${n}`),w(n<=0?"Dropped":"In flight"),n<=0){d=!1;return}await wait(550)}o("ok",`Arrived at server. ${r.length-1} hops, ${b-(r.length-1)} TTL remaining.`),w("Delivered ✓"),d=!1}function w(r){let i='<svg viewBox="0 0 800 280" width="100%" style="max-width:800px">';i+=`<style>
      .ip-link { stroke: var(--ink-soft); stroke-width: 1.8; }
      .ip-link.lit { stroke: var(--accent); stroke-width: 3; }
      .ip-node { stroke: var(--ink); stroke-width: 2.5; }
      .ip-node.you { fill: #cfe5ff; }
      .ip-node.server { fill: #c8f0c8; }
      .ip-node.router { fill: var(--paper); }
      .ip-node.lit { fill: var(--accent-soft); stroke: var(--accent); }
      .ip-label { font-family: var(--font-display); font-size: 12px; letter-spacing: 1px; fill: var(--ink); }
      .ip-sub { font-family: var(--font-mono); font-size: 9.5px; fill: var(--ink-soft); }
      .ip-packet { fill: var(--accent); stroke: var(--ink); stroke-width: 1.5; }
      .ip-packet-text { font-family: var(--font-mono); font-size: 9px; fill: white; font-weight: 600; }
    </style>`;const a=z[s],f=new Set;for(let l=0;l<p;l++)f.add(`${a[l]}-${a[l+1]}`),f.add(`${a[l+1]}-${a[l]}`);const h=new Set(a.slice(0,p+1));if(Y.forEach(([l,$])=>{const u=E.find(P=>P.id===l),x=E.find(P=>P.id===$),S=f.has(`${l}-${$}`);i+=`<line class="ip-link ${S?"lit":""}" x1="${u.x}" y1="${u.y}" x2="${x.x}" y2="${x.y}"/>`}),E.forEach(l=>{const $=h.has(l.id);i+=`<rect class="ip-node ${l.kind} ${$?"lit":""}" x="${l.x-55}" y="${l.y-22}" width="110" height="44" rx="6"/>`,i+=`<text class="ip-label" x="${l.x}" y="${l.y-3}" text-anchor="middle">${l.label}</text>`,i+=`<text class="ip-sub" x="${l.x}" y="${l.y+12}" text-anchor="middle">${l.sub}</text>`}),p<a.length){const l=E.find(u=>u.id===a[p]);i+=`<circle class="ip-packet" cx="${l.x+70}" cy="${l.y-30}" r="14"/>`;const $=b-p;i+=`<text class="ip-packet-text" x="${l.x+70}" y="${l.y-27}" text-anchor="middle">TTL ${$}</text>`}i+="</svg>",k.innerHTML=i,t.querySelector("#m-hops").textContent=p,t.querySelector("#m-ttl").textContent=p===0?"—":b-p,t.querySelector("#m-status").textContent=r}function o(r,n){T.unshift({level:r,msg:n,t:new Date().toLocaleTimeString()}),m.innerHTML=T.slice(0,50).map(e=>`<div class="entry ${e.level}"><span class="t">${e.t}</span>${c(e.msg)}</div>`).join("")}function c(r){return String(r).replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}y()}const I=[{domain:"github.com",tld:"com",auth:"ns1.github.net",ip:"140.82.114.4"},{domain:"fundamentalofx.com",tld:"com",auth:"ns.cloudflare.com",ip:"185.199.108.153"},{domain:"wikipedia.org",tld:"org",auth:"ns0.wikimedia.org",ip:"198.35.26.96"},{domain:"mail.google.com",tld:"com",auth:"ns1.google.com",ip:"142.250.80.5"}],_=[{id:"browser",label:"Your Browser",sub:"wants github.com"},{id:"resolver",label:"Recursive Resolver",sub:"1.1.1.1 / 8.8.8.8"},{id:"root",label:"Root Nameserver",sub:"13 servers worldwide"},{id:"tld",label:"TLD Nameserver",sub:"handles .com"},{id:"auth",label:"Authoritative NS",sub:"owns the domain"}];function Q(t){let s=0,b="cold",p=0,d=[];t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Resolve a Domain</div>
      <p class="widget-hint">Pick a domain and a cache state, then step through the walk.</p>

      <div class="controls">
        <label>Domain:</label>
        <select class="field" id="dns-domain">
          ${I.map((e,i)=>`<option value="${i}">${e.domain}</option>`).join("")}
        </select>

        <label>Cache:</label>
        <div class="pill-group">
          <input type="radio" name="dns-cache" id="dns-cold" value="cold" checked>
          <label for="dns-cold">Cold</label>
          <input type="radio" name="dns-cache" id="dns-warm-r" value="warm-resolver">
          <label for="dns-warm-r">Resolver hot</label>
          <input type="radio" name="dns-cache" id="dns-warm-a" value="warm-all">
          <label for="dns-warm-a">Browser hot</label>
        </div>

        <button class="btn btn-accent" id="dns-step">Next →</button>
        <button class="btn btn-ghost" id="dns-reset">Reset</button>
      </div>

      <div class="widget-stage" id="dns-stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Steps</div><div class="value" id="dns-steps">0</div></div>
        <div class="metric"><div class="label">Round trips</div><div class="value" id="dns-rtt">0</div></div>
        <div class="metric accent"><div class="label">Total time</div><div class="value" id="dns-time">—</div></div>
      </div>

      <div class="log" id="dns-log"></div>
    </div>
  `;const T=t.querySelector("#dns-stage"),k=t.querySelector("#dns-log"),m=t.querySelector("#dns-steps"),y=t.querySelector("#dns-rtt"),v=t.querySelector("#dns-time");t.querySelector("#dns-domain").addEventListener("change",e=>{s=Number(e.target.value),w()}),t.querySelectorAll("input[name=dns-cache]").forEach(e=>e.addEventListener("change",i=>{b=i.target.value,w()})),t.querySelector("#dns-step").addEventListener("click",c),t.querySelector("#dns-reset").addEventListener("click",w);function w(){p=0,d=[],r()}function o(){const e=I[s];return b==="warm-all"?[{from:"browser",to:"browser",kind:"cache-hit",text:`Browser cache hit → ${e.ip}`,ms:0}]:b==="warm-resolver"?[{from:"browser",to:"resolver",kind:"query",text:`Query: A ${e.domain}?`,ms:2},{from:"resolver",to:"browser",kind:"answer",text:`Resolver cache hit → ${e.ip}`,ms:2}]:[{from:"browser",to:"resolver",kind:"query",text:`Query: A ${e.domain}?`,ms:1},{from:"resolver",to:"root",kind:"query",text:`Who owns .${e.tld}?`,ms:25},{from:"root",to:"resolver",kind:"answer",text:"Ask TLD nameserver (e.g. a.gtld-servers.net)",ms:25},{from:"resolver",to:"tld",kind:"query",text:`Who owns ${e.domain}?`,ms:18},{from:"tld",to:"resolver",kind:"answer",text:`Ask ${e.auth}`,ms:18},{from:"resolver",to:"auth",kind:"query",text:`A record for ${e.domain}?`,ms:35},{from:"auth",to:"resolver",kind:"answer",text:`${e.ip}`,ms:35},{from:"resolver",to:"browser",kind:"answer",text:`Cached + delivered → ${e.ip}`,ms:1}]}function c(){const e=o();if(p>=e.length)return;const i=e[p];p++,d.push(i),r()}function r(){o();const e=760,i=280,a={browser:{x:80,y:220},resolver:{x:80,y:70},root:{x:280,y:40},tld:{x:480,y:40},auth:{x:680,y:40}};let f=`<svg viewBox="0 0 ${e} ${i}" width="100%" style="max-width:${e}px">`;f+=`<style>
      .dns-node { stroke: var(--ink); stroke-width: 2.5; }
      .dns-node.browser { fill: #cfe5ff; }
      .dns-node.resolver { fill: #ffe9b3; }
      .dns-node.root { fill: var(--paper); }
      .dns-node.tld { fill: var(--paper); }
      .dns-node.auth { fill: #c8f0c8; }
      .dns-node.lit { stroke: var(--accent); stroke-width: 3.5; }
      .dns-label { font-family: var(--font-display); font-size: 13px; letter-spacing: 1px; fill: var(--ink); }
      .dns-sublabel { font-family: var(--font-mono); font-size: 9.5px; fill: var(--ink-soft); }
      .dns-arrow { stroke: var(--accent); stroke-width: 2.5; fill: none; marker-end: url(#dns-arrowhead); }
      .dns-arrow.answer { stroke: #2a8a3e; stroke-dasharray: 4 3; }
      .dns-arrow-text { font-family: var(--font-mono); font-size: 10px; fill: var(--ink); }
      .dns-arrow-bg { fill: var(--paper); }
    </style>`,f+=`<defs>
      <marker id="dns-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <polygon points="0 0, 8 4, 0 8" fill="var(--accent)"/>
      </marker>
      <marker id="dns-arrowhead-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <polygon points="0 0, 8 4, 0 8" fill="#2a8a3e"/>
      </marker>
    </defs>`;const h=new Set;if(d.forEach(u=>{h.add(u.from),h.add(u.to)}),_.forEach(u=>{const x=a[u.id],S=h.has(u.id);f+=`<rect class="dns-node ${u.id} ${S?"lit":""}" x="${x.x-70}" y="${x.y-22}" width="140" height="44" rx="6"/>`,f+=`<text class="dns-label" x="${x.x}" y="${x.y-3}" text-anchor="middle">${u.label}</text>`,f+=`<text class="dns-sublabel" x="${x.x}" y="${x.y+12}" text-anchor="middle">${u.sub}</text>`}),d.length){const u=d[d.length-1];if(u.from!==u.to){const x=a[u.from],S=a[u.to],P=u.kind==="answer"?"dns-arrow answer":"dns-arrow",q=u.kind==="answer"?"url(#dns-arrowhead-green)":"url(#dns-arrowhead)",j=(x.x+S.x)/2,C=(x.y+S.y)/2-30*(u.kind==="answer"?-1:1);f+=`<path class="${P}" d="M ${x.x} ${x.y} Q ${j} ${C}, ${S.x} ${S.y}" marker-end="${q}"/>`;const H=Math.max(60,u.text.length*6.2);f+=`<rect class="dns-arrow-bg" x="${j-H/2}" y="${C-8}" width="${H}" height="16" rx="2" stroke="var(--ink)" stroke-width="1"/>`,f+=`<text class="dns-arrow-text" x="${j}" y="${C+4}" text-anchor="middle">${n(u.text)}</text>`}else u.kind==="cache-hit"&&(f+=`<text x="${a.browser.x}" y="${a.browser.y-40}" text-anchor="middle" class="dns-arrow-text" style="font-size:12px; fill: #2a8a3e;">✓ ${n(u.text)}</text>`)}f+="</svg>",T.innerHTML=f,m.textContent=p;const l=d.filter(u=>u.kind!=="cache-hit").length;y.textContent=Math.ceil(l/2);const $=d.reduce((u,x)=>u+(x.ms||0),0);v.textContent=p===o().length?`${$}ms`:"—",k.innerHTML=d.map((u,x)=>`<div class="entry ${u.kind==="answer"||u.kind==="cache-hit"?"ok":"info"}"><span class="t">${String(x+1).padStart(2,"0")}</span>${n(u.text)} <span style="color: var(--ink-faint);">[${u.ms}ms]</span></div>`).reverse().join("")}function n(e){return String(e).replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i])}w()}function G(t){const s={windowSize:3,lossPct:15,events:[],running:!1,seed:42};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Three-Way Handshake + Windowed Send</div>

      <div class="controls">
        <label>Window:</label>
        <input type="range" min="1" max="6" step="1" value="3" id="win">
        <span id="win-val" style="font-family: var(--font-mono); min-width: 2em;">3</span>

        <label>Loss:</label>
        <input type="range" min="0" max="40" step="5" value="15" id="loss">
        <span id="loss-val" style="font-family: var(--font-mono); min-width: 3em;">15%</span>

        <button class="btn btn-accent" id="run">Start TCP session</button>
        <button class="btn btn-ghost" id="reset">Reset</button>
      </div>

      <div class="widget-stage" id="stage" style="min-height: 400px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Segments delivered</div><div class="value" id="m-deliv">0</div></div>
        <div class="metric"><div class="label">Retransmits</div><div class="value" id="m-rt">0</div></div>
        <div class="metric accent"><div class="label">Status</div><div class="value" id="m-stat">Idle</div></div>
      </div>
    </div>
  `;const b=t.querySelector("#stage"),p=t.querySelector("#win"),d=t.querySelector("#loss");p.addEventListener("input",r=>{s.windowSize=Number(r.target.value),t.querySelector("#win-val").textContent=s.windowSize}),d.addEventListener("input",r=>{s.lossPct=Number(r.target.value),t.querySelector("#loss-val").textContent=`${s.lossPct}%`}),t.querySelector("#run").addEventListener("click",m),t.querySelector("#reset").addEventListener("click",T);function T(){s.events=[],s.running=!1,v("Idle")}function k(){return s.seed=(s.seed*9301+49297)%233280,s.seed/233280}async function m(){if(s.running)return;T(),s.running=!0,s.seed=Date.now()&65535;let r=0,n=0;y("→","SYN seq=0","handshake"),v("Handshake"),await c(450),y("←","SYN-ACK seq=0 ack=1","handshake"),v("Handshake"),await c(450),y("→","ACK ack=1","handshake"),v("Connected"),await c(450);const e=6;let i=1,a=[];for(;n<e;){for(;a.length<s.windowSize&&i<=e;)a.push({seq:i,attempts:1}),i++;for(const l of a){const $=k()<s.lossPct/100;y("→",`DATA seq=${l.seq}${l.attempts>1?` (retry ${l.attempts})`:""}`,$?"lost":"data"),v("Sending"),await c(280)}const f=a.filter(()=>k()>=s.lossPct/100/1.7),h=[];for(const l of a)if(f.find($=>$.seq===l.seq))h.push(l);else break;if(h.length===0)await c(550),a.forEach(l=>l.attempts+=1),r+=a.length,y(" ","RTO — retransmit window","rto"),v("Retransmit");else{for(const l of h)y("←",`ACK ack=${l.seq+1}`,"ack"),n=Math.max(n,l.seq),v("Acked"),await c(260);a=a.filter(l=>!h.find($=>$.seq===l.seq)),a.length&&(r+=a.length,a.forEach(l=>l.attempts+=1))}t.querySelector("#m-rt").textContent=r,t.querySelector("#m-deliv").textContent=`${n}/${e}`}y(" ","All segments acked","done"),v("Done ✓"),s.running=!1}function y(r,n,e){s.events.push({arrow:r,text:n,kind:e})}function v(r){let n=`
      <div style="display: grid; grid-template-columns: 1fr 80px 1fr; gap: 0.4rem; align-items: stretch;">
        <div style="text-align: right; font-family: var(--font-display); font-size: 1.2rem; letter-spacing: 2px;">CLIENT</div>
        <div></div>
        <div style="font-family: var(--font-display); font-size: 1.2rem; letter-spacing: 2px;">SERVER</div>
      </div>
      <div class="tcp-ladder">
    `;s.events.forEach((e,i)=>{const a=e.arrow==="→"||e.arrow===" "&&i%2===0,h=`<div class="tcp-cell" style="background: ${w(e.kind)}">${o(e.text)}</div>`,l=e.arrow===" "?"":`<div class="tcp-arrow">${e.arrow}</div>`,$="<div></div>";n+='<div class="tcp-row" style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 80px 1fr; gap: 0.4rem; align-items: center; margin: 0.2rem 0;">',a?n+=h+l+$:n+=$+l+h,n+="</div>"}),n+="</div>",n+=`<style>
      .tcp-cell { padding: 0.35em 0.7em; border: 1.5px solid var(--ink); border-radius: var(--radius); font-family: var(--font-mono); font-size: 0.85rem; }
      .tcp-arrow { text-align: center; font-family: var(--font-display); font-size: 1.4rem; color: var(--accent); letter-spacing: 2px; }
    </style>`,b.innerHTML=n,t.querySelector("#m-stat").textContent=r}function w(r){return{handshake:"#fff6dc",data:"var(--paper)",ack:"#cdf5d3",lost:"#f7c8c8",rto:"#ffe9b3",done:"#cdf5d3"}[r]||"var(--paper)"}function o(r){return String(r).replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function c(r){return new Promise(n=>setTimeout(n,r))}T()}const M=10;function X(t){const s={lossPct:30,running:!1,seed:1,tcp:{sent:[],received:[],inflight:[],retries:0,done:!1},udp:{sent:[],received:[],inflight:[],lost:0,done:!1}};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Same Packets, Two Protocols</div>
      <p class="widget-hint">Each row sends packets 1–${M}. With non-zero loss, TCP retransmits until each arrives; UDP doesn't bother.</p>

      <div class="controls">
        <label>Packet loss:</label>
        <input type="range" min="0" max="80" step="5" value="30" id="loss" style="width: 200px;">
        <span id="loss-val" style="font-family: var(--font-mono); min-width: 3em;">30%</span>
        <button class="btn btn-accent" id="run">Send 10 packets</button>
        <button class="btn btn-ghost" id="reset">Reset</button>
      </div>

      <div class="widget-stage" id="stage" style="min-height: 280px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">TCP delivered</div><div class="value" id="m-tcp-d">0/${M}</div></div>
        <div class="metric"><div class="label">TCP retries</div><div class="value" id="m-tcp-r">0</div></div>
        <div class="metric accent"><div class="label">UDP delivered</div><div class="value" id="m-udp-d">0/${M}</div></div>
        <div class="metric"><div class="label">UDP lost</div><div class="value" id="m-udp-l">0</div></div>
      </div>

      <div class="callout" id="explain">
        Higher loss = TCP gets <em>slower</em> but never gives up. UDP keeps the same speed but loses data.
      </div>
    </div>
  `;const b=t.querySelector("#stage"),p=t.querySelector("#loss"),d=t.querySelector("#loss-val");p.addEventListener("input",o=>{s.lossPct=Number(o.target.value),d.textContent=`${s.lossPct}%`}),t.querySelector("#run").addEventListener("click",y),t.querySelector("#reset").addEventListener("click",T);function T(){s.tcp={sent:[],received:[],inflight:[],retries:0,done:!1},s.udp={sent:[],received:[],inflight:[],lost:0,done:!1},v()}function k(){return s.seed=(s.seed*9301+49297)%233280,s.seed/233280}function m(){return k()<s.lossPct/100}async function y(){if(!s.running){s.running=!0,T(),s.seed=Date.now()&65535;for(let o=1;o<=M;o++){s.udp.sent.push(o);const c=m();s.udp.inflight.push({n:o,lost:c}),v(),await w(120),s.udp.inflight=s.udp.inflight.filter(r=>r.n!==o),c?s.udp.lost+=1:s.udp.received.push(o),v()}s.udp.done=!0;for(let o=1;o<=M;o++){let c=0;for(;;){c+=1,s.tcp.sent.push(o);const r=m();if(s.tcp.inflight.push({n:o,lost:r,attempt:c}),v(),await w(120),s.tcp.inflight=s.tcp.inflight.filter(n=>n.n!==o),!r){s.tcp.received.push(o),v();break}s.tcp.retries+=1,v(),await w(160)}}s.tcp.done=!0,s.running=!1,v()}}function v(){const r=[{name:"TCP",y:60,data:s.tcp,color:"#cfe5ff"},{name:"UDP",y:160,data:s.udp,color:"#ffe9b3"}];let n='<svg viewBox="0 0 700 220" width="100%" style="max-width:700px">';n+=`<style>
      .tu-lane-bg { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 2; }
      .tu-lane-label { font-family: var(--font-display); font-size: 18px; letter-spacing: 2px; fill: var(--ink); }
      .tu-endpoint { fill: var(--paper); stroke: var(--ink); stroke-width: 2; }
      .tu-pkt { fill: var(--accent); stroke: var(--ink); stroke-width: 1.5; }
      .tu-pkt.lost { fill: #ccc; stroke: #999; stroke-dasharray: 3 2; }
      .tu-pkt-text { font-family: var(--font-mono); font-size: 10px; fill: white; font-weight: 600; }
      .tu-pkt-text.lost { fill: #777; }
      .tu-arrived { font-family: var(--font-mono); font-size: 11px; fill: var(--ink); }
    </style>`,r.forEach(e=>{n+=`<text class="tu-lane-label" x="20" y="${e.y-30}">${e.name}</text>`,n+=`<rect class="tu-lane-bg" x="90" y="${e.y-18}" width="520" height="36" rx="4" fill="${e.color}"/>`,n+=`<rect class="tu-endpoint" x="60" y="${e.y-14}" width="30" height="28" rx="3"/>`,n+=`<text x="75" y="${e.y+4}" text-anchor="middle" style="font-family: var(--font-display); font-size: 10px; letter-spacing: 1px;">SRC</text>`,n+=`<rect class="tu-endpoint" x="610" y="${e.y-14}" width="30" height="28" rx="3"/>`,n+=`<text x="625" y="${e.y+4}" text-anchor="middle" style="font-family: var(--font-display); font-size: 10px; letter-spacing: 1px;">DST</text>`,e.data.received.forEach((i,a)=>{const f=100+a*50;n+=`<circle class="tu-pkt" cx="${f}" cy="${e.y-36}" r="11"/>`,n+=`<text class="tu-pkt-text" x="${f}" y="${e.y-33}" text-anchor="middle">${i}</text>`}),e.data.inflight.forEach(i=>{const f=i.lost?"tu-pkt lost":"tu-pkt",h=i.lost?"tu-pkt-text lost":"tu-pkt-text";n+=`<circle class="${f}" cx="300" cy="${e.y}" r="13"/>`,n+=`<text class="${h}" x="300" y="${e.y+4}" text-anchor="middle">${i.n}</text>`,i.lost&&(n+=`<text x="318" y="${e.y+4}" style="font-family: var(--font-display); font-size: 14px; fill: var(--accent);">✕ lost</text>`)}),e.data.done&&(n+=`<text x="680" y="${e.y-28}" text-anchor="end" style="font-family: var(--font-display); font-size: 14px; letter-spacing: 1px; fill: var(--ink-soft);">DONE</text>`)}),n+="</svg>",b.innerHTML=n,t.querySelector("#m-tcp-d").textContent=`${s.tcp.received.length}/${M}`,t.querySelector("#m-tcp-r").textContent=s.tcp.retries,t.querySelector("#m-udp-d").textContent=`${s.udp.received.length}/${M}`,t.querySelector("#m-udp-l").textContent=s.udp.lost}function w(o){return new Promise(c=>setTimeout(c,o))}v()}const R=[{title:"1. ClientHello",dir:"c→s",body:["Supported cipher suites: TLS_AES_128_GCM_SHA256, …","Supported groups: X25519, secp256r1","Key share: ephemeral public key (X25519)","Random nonce: 32 bytes","Server name: fundamentalofx.com (SNI)"],clientKnows:["Its own private key","Random nonce"],serverKnows:[],note:"Client throws all its capabilities + a public key on the table. The server can pick a suite AND derive a shared secret from this single message."},{title:"2. ServerHello",dir:"s→c",body:["Chosen cipher: TLS_AES_128_GCM_SHA256","Chosen group: X25519","Key share: ephemeral public key","Random nonce"],clientKnows:["Its own private key","Random nonce"],serverKnows:["Its own private key","Client public key","Shared secret 🔑 (just derived)"],note:"Server picks parameters and sends its own ephemeral public key. From the two public keys + its private key it can now derive the shared secret (ECDHE)."},{title:"3. {Certificate, CertVerify, Finished}",dir:"s→c",body:["Encrypted ↗ with newly-derived key","Certificate: x509 chain for fundamentalofx.com","CertificateVerify: signature proving cert ownership","Finished: HMAC over the handshake so far"],clientKnows:["Its own private key","Server public key","Shared secret 🔑","Server identity ✓"],serverKnows:["Everything above"],note:"Server proves it owns the certificate by signing the handshake transcript. The Finished message catches any tampering with earlier messages."},{title:"4. {Finished}",dir:"c→s",body:["Encrypted ↗","Finished: HMAC over the handshake so far"],clientKnows:["All of the above"],serverKnows:["Handshake confirmed ✓"],note:"Client confirms the handshake. From this point on, all application data is sent encrypted with the shared symmetric key."},{title:"5. Application Data",dir:"c↔s",body:["GET / HTTP/1.1 (encrypted)","… and everything else, both directions"],clientKnows:["Connected, can talk freely"],serverKnows:["Connected, can talk freely"],note:"One round trip after ClientHello, both sides can send application data — about half the handshake cost of TLS 1.2."}];function J(t){let s=0;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">TLS 1.3 Handshake</div>
      <p class="widget-hint">Five messages. One round trip. Step through to see what gets exchanged and what each side learns.</p>

      <div class="controls">
        <button class="btn btn-accent" id="tls-next">Next message →</button>
        <button class="btn" id="tls-prev">← Back</button>
        <button class="btn btn-ghost" id="tls-reset">Reset</button>
        <span style="margin-left: auto; font-family: var(--font-mono); color: var(--ink-soft);" id="tls-counter">0 / ${R.length}</span>
      </div>

      <div class="widget-stage" id="tls-stage" style="min-height: 360px;"></div>

      <div class="callout" id="tls-note">Click "Next message →" to start.</div>
    </div>
  `;const b=t.querySelector("#tls-stage"),p=t.querySelector("#tls-note"),d=t.querySelector("#tls-counter");t.querySelector("#tls-next").addEventListener("click",()=>{s<R.length&&s++,T()}),t.querySelector("#tls-prev").addEventListener("click",()=>{s>0&&s--,T()}),t.querySelector("#tls-reset").addEventListener("click",()=>{s=0,T()});function T(){d.textContent=`${s} / ${R.length}`;const y=s>0?R[s-1]:null,v=s>0?R[s-1].clientKnows:[],w=s>0?R[s-1].serverKnows:[];let o=`
      <div class="tls-grid">
        <div class="tls-side">
          <div class="tls-actor">CLIENT</div>
          <div class="tls-state">
            <div class="tls-state-label">Knows:</div>
            ${v.length?v.map(c=>`<div class="tls-state-row">${m(c)}</div>`).join(""):'<div class="tls-state-row" style="color: var(--ink-faint);">(nothing yet)</div>'}
          </div>
        </div>
        <div class="tls-middle">
          ${y?k(y):'<div style="color: var(--ink-faint); padding: 2rem; text-align: center;">(waiting)</div>'}
        </div>
        <div class="tls-side">
          <div class="tls-actor">SERVER</div>
          <div class="tls-state">
            <div class="tls-state-label">Knows:</div>
            ${w.length?w.map(c=>`<div class="tls-state-row">${m(c)}</div>`).join(""):'<div class="tls-state-row" style="color: var(--ink-faint);">(nothing yet)</div>'}
          </div>
        </div>
      </div>
      <style>
        .tls-grid { display: grid; grid-template-columns: 1fr 1.4fr 1fr; gap: 0.8rem; }
        .tls-side { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem; }
        .tls-actor { font-family: var(--font-display); letter-spacing: 2px; text-align: center; margin-bottom: 0.5rem; }
        .tls-state-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3rem; }
        .tls-state-row { font-family: var(--font-mono); font-size: 0.78rem; padding: 0.2em 0.4em; background: var(--paper); margin-bottom: 0.2rem; border-radius: 2px; }
        .tls-middle { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.8rem; }
        .tls-msg-title { font-family: var(--font-display); font-size: 1.1rem; letter-spacing: 0.04em; margin-bottom: 0.5rem; color: var(--accent); }
        .tls-msg-dir { display: inline-block; padding: 0.1em 0.6em; background: var(--accent); color: white; font-family: var(--font-mono); font-size: 0.75rem; border: 1.5px solid var(--ink); border-radius: 2px; margin-bottom: 0.6rem; }
        .tls-msg-body { font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.6; }
        .tls-msg-body div { padding: 0.15em 0; }
      </style>
    `;b.innerHTML=o,p.innerHTML=y?y.note:'Click "Next message →" to start.'}function k(y){return`
      <div class="tls-msg-dir">${{"c→s":"CLIENT → SERVER","s→c":"SERVER → CLIENT","c↔s":"BOTH DIRECTIONS"}[y.dir]}</div>
      <div class="tls-msg-title">${m(y.title)}</div>
      <div class="tls-msg-body">
        ${y.body.map(w=>`<div>· ${m(w)}</div>`).join("")}
      </div>
    `}function m(y){return String(y).replace(/[&<>"']/g,v=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[v])}T()}const D=10;function Z(t){let s=0,b=!1,p=1;const d={h1:{progress:0,totalTime:0,stalledUntil:0},h2:{progress:0,totalTime:0,stalledUntil:0},h3:{progress:0,totalTime:0,stalledUntil:0}};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Race: HTTP/1.1 vs HTTP/2 vs HTTP/3</div>
      <p class="widget-hint">Each lane downloads 10 resources. Crank packet loss and watch HTTP/2 stall when one packet is lost (head-of-line blocking).</p>

      <div class="controls">
        <label>Packet loss:</label>
        <input type="range" min="0" max="40" step="5" value="0" id="loss">
        <span id="loss-val" style="font-family: var(--font-mono); min-width: 3em;">0%</span>
        <button class="btn btn-accent" id="run">Start race</button>
        <button class="btn btn-ghost" id="reset">Reset</button>
      </div>

      <div class="widget-stage" id="stage" style="min-height: 240px;"></div>

      <div class="callout" id="explain">
        At 0% loss they all finish quickly, with HTTP/2 and HTTP/3 essentially tied. Add loss and watch the gap open.
      </div>
    </div>
  `;const T=t.querySelector("#stage");t.querySelector("#loss").addEventListener("input",o=>{s=Number(o.target.value),t.querySelector("#loss-val").textContent=`${s}%`}),t.querySelector("#run").addEventListener("click",y),t.querySelector("#reset").addEventListener("click",m);function k(){return p=(p*9301+49297)%233280,p/233280}function m(){d.h1={progress:0,totalTime:0,stalledUntil:0},d.h2={progress:0,totalTime:0,stalledUntil:0},d.h3={progress:0,totalTime:0,stalledUntil:0},w()}async function y(){if(b)return;b=!0,m(),p=Date.now()&65535;const o=80,c=200,r=s/100,n=6,e=Math.ceil(D/n);let i=0;for(let x=0;x<n;x++){let S=0;for(let P=0;P<e;P++){let q=o;k()<r&&(q+=c),S+=q}i=Math.max(i,S)}let a=o,f=0;for(let x=0;x<D;x++)k()<r&&(f+=1);a+=f*c;let h=o;for(let x=0;x<D;x++){let S=o;k()<r&&(S+=c),h=Math.max(h,S)}const l=4,$=performance.now();function u(){const x=(performance.now()-$)*l;d.h1.progress=Math.min(1,x/i),d.h2.progress=Math.min(1,x/a),d.h3.progress=Math.min(1,x/h),d.h1.totalTime=i,d.h2.totalTime=a,d.h3.totalTime=h,w(),d.h1.progress<1||d.h2.progress<1||d.h3.progress<1?requestAnimationFrame(u):(b=!1,v(i,a,h))}u()}function v(o,c,r){const n=t.querySelector("#explain"),e=Math.min(o,c,r),i=o===e?"HTTP/1.1":c===e?"HTTP/2":"HTTP/3";if(s===0)n.innerHTML=`At 0% loss, HTTP/2 and HTTP/3 finish in essentially the same time. HTTP/1.1 is slower because each of its 6 connections still has to wait for its own queue. <strong>Winner: ${i} (${Math.round(e)}ms).</strong>`;else{const a=Math.round(c-80);n.innerHTML=`With ${s}% loss, every lost packet on the HTTP/2 connection stalls <em>every</em> stream — that's <strong>${a}ms</strong> of cascading delay. HTTP/3 only stalls the affected stream, so the slowest stream sets the total. <strong>Winner: ${i} (${Math.round(e)}ms).</strong>`}}function w(){const c=[{name:"HTTP/1.1",sub:"6 connections, serial",data:d.h1,color:"#ffe9b3"},{name:"HTTP/2",sub:"one TCP, multiplexed",data:d.h2,color:"#cfe5ff"},{name:"HTTP/3",sub:"QUIC, per-stream",data:d.h3,color:"#c8f0c8"}],r=60;let e=`<svg viewBox="0 0 700 ${c.length*r+40}" width="100%" style="max-width:700px">`;e+=`<style>
      .hv-label { font-family: var(--font-display); font-size: 16px; letter-spacing: 1.5px; fill: var(--ink); }
      .hv-sub { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .hv-bar-bg { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 2; }
      .hv-bar { stroke: var(--ink); stroke-width: 2; }
      .hv-time { font-family: var(--font-mono); font-size: 11px; fill: var(--ink); }
    </style>`,c.forEach((i,a)=>{const f=30+a*r;e+=`<text class="hv-label" x="20" y="${f-4}">${i.name}</text>`,e+=`<text class="hv-sub" x="120" y="${f-4}">${i.sub}</text>`,e+=`<rect class="hv-bar-bg" x="20" y="${f}" width="570" height="28" rx="4"/>`;const h=570*i.data.progress;e+=`<rect class="hv-bar" x="20" y="${f}" width="${h}" height="28" rx="4" fill="${i.color}"/>`,e+=`<text class="hv-time" x="600" y="${f+19}">${i.data.totalTime?Math.round(i.data.totalTime)+"ms":""}</text>`}),e+="</svg>",T.innerHTML=e}w()}const B=[{id:"local",label:"Same city (5ms)",rtt:5,bw:100},{id:"region",label:"Same continent (40ms)",rtt:40,bw:100},{id:"global",label:"Across globe (200ms)",rtt:200,bw:50},{id:"3g",label:"Mobile 3G (200ms, 1Mbps)",rtt:200,bw:1}];function ee(t){let s=40,b=100,p=500,d=4;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Where Do the Milliseconds Go?</div>

      <div class="controls">
        <label>Preset:</label>
        <select class="field" id="lat-preset">
          ${B.map(m=>`<option value="${m.id}">${m.label}</option>`).join("")}
          <option value="custom">Custom</option>
        </select>
      </div>

      <div class="lat-sliders">
        <div class="lat-slider">
          <label>RTT (round-trip time): <strong id="lat-rtt-val">40ms</strong></label>
          <input type="range" min="1" max="400" value="40" id="lat-rtt">
          <div class="lat-hint">1ms = same room. 40ms = same continent. 200ms = across the globe.</div>
        </div>
        <div class="lat-slider">
          <label>Bandwidth: <strong id="lat-bw-val">100 Mbps</strong></label>
          <input type="range" min="1" max="1000" value="100" id="lat-bw">
          <div class="lat-hint">1 = mobile 3G. 100 = broadband. 1000 = fiber.</div>
        </div>
        <div class="lat-slider">
          <label>Page size: <strong id="lat-size-val">500 KB</strong></label>
          <input type="range" min="50" max="5000" step="50" value="500" id="lat-size">
          <div class="lat-hint">Modern average is around 2–3MB.</div>
        </div>
        <div class="lat-slider">
          <label>Round trips needed: <strong id="lat-rt-val">4</strong></label>
          <input type="range" min="1" max="20" value="4" id="lat-rt">
          <div class="lat-hint">TCP+TLS+HTTP ≈ 3 trips. Plus extras per chained request.</div>
        </div>
      </div>

      <div class="widget-stage" id="stage" style="min-height: 200px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Connect time</div><div class="value" id="m-conn">—</div></div>
        <div class="metric"><div class="label">Transfer time</div><div class="value" id="m-xfer">—</div></div>
        <div class="metric accent"><div class="label">Total load</div><div class="value" id="m-total">—</div></div>
      </div>

      <div class="callout" id="explain"></div>

      <style>
        .lat-sliders { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.5rem; margin: 1rem 0; }
        .lat-slider label { display: block; font-size: 0.95rem; margin-bottom: 0.2rem; }
        .lat-slider input[type=range] { width: 100%; }
        .lat-hint { font-size: 0.75rem; color: var(--ink-soft); margin-top: 0.1rem; }
        @media (max-width: 640px) { .lat-sliders { grid-template-columns: 1fr; } }
      </style>
    </div>
  `;const T=t.querySelector("#stage");t.querySelector("#lat-preset").addEventListener("change",m=>{const y=B.find(v=>v.id===m.target.value);y&&(s=y.rtt,b=y.bw,t.querySelector("#lat-rtt").value=s,t.querySelector("#lat-bw").value=b,k())}),t.querySelector("#lat-rtt").addEventListener("input",m=>{s=Number(m.target.value),k()}),t.querySelector("#lat-bw").addEventListener("input",m=>{b=Number(m.target.value),k()}),t.querySelector("#lat-size").addEventListener("input",m=>{p=Number(m.target.value),k()}),t.querySelector("#lat-rt").addEventListener("input",m=>{d=Number(m.target.value),k()});function k(){t.querySelector("#lat-rtt-val").textContent=`${s}ms`,t.querySelector("#lat-bw-val").textContent=`${b} Mbps`,t.querySelector("#lat-size-val").textContent=`${p} KB`,t.querySelector("#lat-rt-val").textContent=d;const m=d*s,v=p*1024*8/(b*1e6)*1e3,w=m+v;t.querySelector("#m-conn").textContent=`${Math.round(m)}ms`,t.querySelector("#m-xfer").textContent=`${Math.round(v)}ms`,t.querySelector("#m-total").textContent=`${Math.round(w)}ms`;const o=700,c=50,r=130,n=Math.max(w,100),e=m/n*(o-20),i=v/n*(o-20);let a=`<svg viewBox="0 0 ${o} ${r}" width="100%" style="max-width:${o}px">`;a+=`<style>
      .lat-cap { font-family: var(--font-display); font-size: 14px; letter-spacing: 1.5px; fill: var(--ink); }
      .lat-num { font-family: var(--font-mono); font-size: 12px; fill: var(--ink); }
      .lat-conn { fill: #ffc1c1; stroke: var(--ink); stroke-width: 2; }
      .lat-xfer { fill: #c8f0c8; stroke: var(--ink); stroke-width: 2; }
    </style>`,a+='<text class="lat-cap" x="10" y="20">PAGE LOAD BREAKDOWN</text>',a+=`<rect class="lat-conn" x="10" y="40" width="${e}" height="${c}"/>`,a+=`<rect class="lat-xfer" x="${10+e}" y="40" width="${i}" height="${c}"/>`,e>80&&(a+=`<text class="lat-num" x="${10+e/2}" y="${40+c/2+4}" text-anchor="middle">Connect ${Math.round(m)}ms</text>`),i>80&&(a+=`<text class="lat-num" x="${10+e+i/2}" y="${40+c/2+4}" text-anchor="middle">Transfer ${Math.round(v)}ms</text>`),a+=`<text class="lat-num" x="10" y="${40+c+20}">0ms</text>`,a+=`<text class="lat-num" x="${o-10}" y="${40+c+20}" text-anchor="end">${Math.round(n)}ms</text>`,a+="</svg>",T.innerHTML=a;const f=m/Math.max(1,w);let h;f>.7?h=`<strong>Latency-bound.</strong> ${Math.round(f*100)}% of your page load is waiting for round trips. Doubling bandwidth would barely help. Reducing round trips (HTTP/2/3, CDN closer to users, fewer chained requests) would.`:f<.2?h="<strong>Bandwidth-bound.</strong> Most time is spent transferring bytes. Compression, code-splitting, and smaller assets would help. More round trips wouldn't hurt much here.":h="<strong>Mixed.</strong> Both connect time and transfer time matter at this scale. CDNs help by cutting both — they're closer AND have a fat pipe to your user.",t.querySelector("#explain").innerHTML=h}k()}const L=t=>()=>g.jsx(K,{init:t}),ne={slug:"internet",title:"Internet",intro:g.jsx(g.Fragment,{children:"Eight lessons covering the plumbing under every URL — from the packet that leaves your machine to the bytes that come back. IP, TCP, UDP, DNS, TLS, HTTP versions, latency. Each animated."}),lessons:[{slug:"journey",number:"01",title:"Journey of a Request",blurb:"Type a URL, hit enter. Five protocols and a dozen machines later, you have a webpage. Watch every step.",Widget:L(O),intro:g.jsx(g.Fragment,{children:"What actually happens between hitting Enter and the page rendering? The browser does DNS, then TCP, then TLS, then HTTP — and only then asks for the file."}),sections:[{heading:"Five protocols, one click",body:g.jsx("p",{children:"Every URL triggers the same dance: name resolution, connection setup, encryption negotiation, request, response. The widget walks through it in slow motion."})}],takeaways:['Even a "fast" page does 5+ round-trips before the first byte.',"Each protocol layer adds a fixed cost. Latency compounds.","CDNs flatten this by being geographically close.","HTTP/3 collapses TCP + TLS into one handshake."]},{slug:"ip",number:"02",title:"IP & Routing",blurb:"Addresses, subnets, and the hop-by-hop journey of a packet across a network of routers.",Widget:L(V),intro:g.jsx(g.Fragment,{children:"IP gets a packet from any address to any other address. Every router along the way just looks at the destination and picks the next hop. No global view, no end-to-end state."}),sections:[{heading:"Hop by hop",body:g.jsx("p",{children:"Each router has a routing table. It checks the destination, looks up the longest prefix match, forwards out the corresponding interface. The packet's source has no idea what path it actually took."})}],takeaways:["IP is stateless and unreliable. Routers can drop packets at will.","BGP is how routers learn paths between autonomous systems.","IPv4 ran out of addresses in 2011. IPv6 has 2^128.","Traceroute exposes the hops by lying about TTLs."]},{slug:"dns",number:"03",title:"DNS",blurb:"Names to numbers. Follow a recursive resolver from your laptop to the root and back.",Widget:L(Q),intro:g.jsx(g.Fragment,{children:"The Domain Name System maps human-readable names to IP addresses. Behind the scenes it's a hierarchical, globally-distributed database queried at the speed of light — and cached aggressively."}),sections:[{heading:"The hierarchy",body:g.jsxs("p",{children:["Root nameservers know the .com / .org / .net authorities. Those know ",g.jsx("code",{children:"example.com"}),"'s nameservers. Those know the IP. Your resolver walks the chain."]})}],takeaways:["DNS is hierarchical: root → TLD → authoritative → record.","Caching at every level keeps the load manageable.","TTLs control how long answers are cached. Lower = more flexible, higher = less load.","DNS-over-HTTPS (DoH) prevents your ISP from snooping queries."]},{slug:"tcp",number:"04",title:"TCP Handshake & Flow",blurb:"The three-way handshake, sliding windows, and how TCP recovers from packet loss.",Widget:L(G),intro:g.jsx(g.Fragment,{children:"TCP turns IP's unreliable packets into a reliable, ordered byte stream. The cost: a handshake before you can send anything, and per-packet ACKs."}),sections:[{heading:"The dance",body:g.jsx("p",{children:"SYN, SYN-ACK, ACK. After that, every byte gets a sequence number; the receiver ACKs them back. Loss triggers retransmission with exponential backoff. Congestion control slows things down when the network is busy."})}],takeaways:["Three-way handshake = 1.5 RTTs of overhead before any data.","TCP guarantees ordering. Out-of-order packets get reassembled.","Congestion control (Reno, CUBIC, BBR) prevents senders from flooding the network.","Modern protocols (QUIC) keep TCP's reliability but get rid of the handshake cost."]},{slug:"tcp-vs-udp",number:"05",title:"TCP vs UDP",blurb:"Side-by-side: send the same data over both, drop a packet, see what each does about it.",Widget:L(X),intro:g.jsx(g.Fragment,{children:"Same IP, opposite philosophies. TCP guarantees delivery; UDP just fires packets and forgets. The right pick depends on whether retransmission helps or hurts."}),sections:[{heading:"When to pick which",body:g.jsxs("ul",{children:[g.jsxs("li",{children:[g.jsx("strong",{children:"TCP"}),": web, file transfer, anything that breaks if a byte is missing."]}),g.jsxs("li",{children:[g.jsx("strong",{children:"UDP"}),": voice, video, games, DNS — where a stale packet is worse than a missing one."]})]})}],takeaways:["TCP retransmits lost packets. UDP doesn't.","For real-time audio/video, retransmission would just produce a glitch later.","QUIC is UDP-based but adds TCP-style reliability on top, configurably.",'Most "UDP" protocols add their own reliability (RTP, SRT, WebRTC).']},{slug:"tls",number:"06",title:"TLS Handshake",blurb:"How two strangers agree on a shared secret over an eavesdropped wire. TLS 1.3 in slow motion.",Widget:L(J),intro:g.jsx(g.Fragment,{children:"TLS gives you encryption + identity + integrity over a network where anyone can read your bytes. The handshake exchanges a session key without ever sending the key."}),sections:[{heading:"The trick: Diffie-Hellman",body:g.jsx("p",{children:"Both sides exchange public values. Each computes a shared secret using the other's public value and their own private value. An eavesdropper sees both publics but can't derive the secret."})}],takeaways:["TLS 1.3 needs just one round-trip. 1.2 needed two.","Certificates prove the server is who it claims to be.","Perfect Forward Secrecy = past sessions stay safe even if the server's key leaks.","0-RTT resumption lets the client send data on its first packet — at the cost of replay risk."]},{slug:"http-versions",number:"07",title:"HTTP/1, HTTP/2, HTTP/3",blurb:"Race three versions loading the same page. See head-of-line blocking disappear with QUIC.",Widget:L(Z),intro:g.jsx(g.Fragment,{children:"Same protocol, three eras. Each version solves the bottleneck of the previous one — and exposes a new one."}),sections:[{heading:"What changes between versions",body:g.jsxs("ul",{children:[g.jsxs("li",{children:[g.jsx("strong",{children:"HTTP/1.1"}),": one connection, one request at a time. Pipelining never really worked."]}),g.jsxs("li",{children:[g.jsx("strong",{children:"HTTP/2"}),": multiplexed streams on one TCP connection. Until one packet drops and blocks everyone."]}),g.jsxs("li",{children:[g.jsx("strong",{children:"HTTP/3"}),": same multiplexing on UDP/QUIC. Per-stream loss recovery."]})]})}],takeaways:["HTTP/1.1 = sequential by default. Multiple connections required for parallelism.","HTTP/2 = parallel streams but still TCP-blocked on packet loss.","HTTP/3 = QUIC fixes head-of-line blocking and folds in TLS.","Most production sites support all three; clients pick the newest mutual version."]},{slug:"latency",number:"08",title:"Latency & Performance",blurb:"RTT, throughput, bufferbloat, CDN. What actually decides how fast your site feels.",Widget:L(ee),intro:g.jsx(g.Fragment,{children:"Bandwidth is cheap; latency is physics. The speed of light through fiber means a New York ↔ Tokyo round-trip can never be under ~150 ms."}),sections:[{heading:"Latency is multiplicative",body:g.jsx("p",{children:"A page that fetches 30 resources sequentially sees 30 × RTT just to start each request. Parallelism, caching, and CDNs are how you fight this."})}],takeaways:["First-byte latency is mostly RTT × hops. Throughput is bandwidth limits.","CDNs reduce hops by putting servers near users.","Bufferbloat = oversized queues that look like throughput but ruin latency.","For interactive apps, p99 latency matters more than averages."]}]};export{ne as manifest};
