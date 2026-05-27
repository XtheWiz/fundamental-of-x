import{j as b}from"./main-Dfqj_VUe.js";import{L as I}from"./LegacyWidget-CUf1c2G7.js";const P=["SHA-1","SHA-256","SHA-512"];function D(e){let i="SHA-256",n=null;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">SHA in real time</div>
      <p class="widget-hint">Type anything below. The hash updates on every keystroke.</p>

      <div class="controls">
        <label>Algorithm:</label>
        <div class="pill-group">
          ${P.map((s,t)=>`
            <input type="radio" name="hash-algo" id="ha-${t}" value="${s}" ${s==="SHA-256"?"checked":""}>
            <label for="ha-${t}">${s}</label>
          `).join("")}
        </div>
      </div>

      <div class="controls">
        <input class="field" id="h-input" value="Hello, X-sensei!" style="flex: 1; min-width: 280px; font-family: var(--font-mono);">
        <button class="btn" id="h-flip">Flip last byte</button>
      </div>

      <div class="cy-key-label">DIGEST (hex)</div>
      <div class="cy-hex" id="h-digest">—</div>

      <div style="margin: 0.7rem 0 0.3rem;">
        <div class="cy-key-label">BIT DIFF vs previous</div>
        <div class="cy-hex" id="h-diff" style="background: var(--paper);">—</div>
      </div>

      <div class="metrics">
        <div class="metric"><div class="label">Input length</div><div class="value" id="m-len">0</div></div>
        <div class="metric"><div class="label">Digest bits</div><div class="value" id="m-bits">—</div></div>
        <div class="metric accent"><div class="label">Bits flipped</div><div class="value" id="m-flipped">—</div></div>
      </div>

      <div class="callout" id="explain">
        Change one character above. Notice that about half the digest bits change — that's the avalanche effect. There's no smooth interpolation between similar inputs.
      </div>
    </div>
  `;const a=e.querySelector("#h-input");a.addEventListener("input",o),e.querySelector("#h-flip").addEventListener("click",()=>{const s=a.value;if(!s.length)return;const t=s.charCodeAt(s.length-1);a.value=s.slice(0,-1)+String.fromCharCode(t^1),o()}),e.querySelectorAll("input[name=hash-algo]").forEach(s=>s.addEventListener("change",t=>{i=t.target.value,n=null,o()}));async function o(){const s=a.value,t=new TextEncoder().encode(s);let d;try{d=await crypto.subtle.digest(i,t)}catch{e.querySelector("#h-digest").textContent="Web Crypto unavailable on this page (needs HTTPS or localhost).";return}const c=new Uint8Array(d),g=r(c);if(e.querySelector("#h-digest").textContent=g,e.querySelector("#m-len").textContent=s.length,e.querySelector("#m-bits").textContent=c.length*8,n&&n.length===c.length){let u=0;for(let v=0;v<c.length;v++){const m=n[v]^c[v];u+=l(m)}e.querySelector("#m-flipped").textContent=`${u} / ${c.length*8}`,e.querySelector("#h-diff").innerHTML=h(c,n)}else e.querySelector("#m-flipped").textContent="—",e.querySelector("#h-diff").textContent="(type or flip a byte to compare)";n=c}function h(s,t){let d="";for(let c=0;c<s.length;c++){const g=s[c]^t[c],u=s[c].toString(16).padStart(2,"0");g===0?d+=`<span style="opacity:0.4">${u}</span>`:d+=`<span style="background: var(--accent); color: white; padding: 0 1px;">${u}</span>`}return d}function r(s){return Array.from(s).map(t=>t.toString(16).padStart(2,"0")).join("")}function l(s){let t=0;for(;s;)t+=s&1,s>>>=1;return t}o()}function B(e){let i=null,n=null;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">AES-256-GCM in slow motion</div>

      <div class="controls">
        <button class="btn" id="sk-gen">Generate new key</button>
        <span style="font-family: var(--font-mono); color: var(--ink-soft);" id="sk-state">no key yet</span>
      </div>

      <div class="cy-key-label">SHARED KEY (256 bits)</div>
      <div class="cy-key symmetric" id="sk-key">(click "Generate new key")</div>

      <div class="controls">
        <label>Message:</label>
        <input class="field" id="sk-msg" value="The quick brown fox jumps over the lazy dog." style="flex:1; min-width: 280px; font-family: var(--font-mono);">
      </div>

      <div class="controls">
        <button class="btn btn-accent" id="sk-enc">Encrypt →</button>
        <button class="btn" id="sk-dec">← Decrypt</button>
      </div>

      <div class="cy-key-label">CIPHERTEXT (hex)</div>
      <div class="cy-hex" id="sk-cipher">—</div>

      <div class="cy-key-label" style="margin-top: 0.6rem;">DECRYPTED</div>
      <div class="cy-hex" id="sk-plain" style="background: var(--paper);">—</div>

      <div class="callout" id="sk-explain">Generate a key, type a message, click Encrypt. Hit Encrypt again with the same message — notice the ciphertext changes anyway. That's the random IV.</div>
    </div>
  `;const a=e.querySelector("#sk-state"),o=e.querySelector("#sk-key"),h=e.querySelector("#sk-msg"),r=e.querySelector("#sk-cipher"),l=e.querySelector("#sk-plain"),s=e.querySelector("#sk-explain");e.querySelector("#sk-gen").addEventListener("click",t),e.querySelector("#sk-enc").addEventListener("click",d),e.querySelector("#sk-dec").addEventListener("click",c);async function t(){i=await crypto.subtle.generateKey({name:"AES-GCM",length:256},!0,["encrypt","decrypt"]);const u=new Uint8Array(await crypto.subtle.exportKey("raw",i));o.textContent=g(u),a.textContent="key ready",n=null,r.textContent="—",l.textContent="—"}async function d(){i||await t();const u=crypto.getRandomValues(new Uint8Array(12)),v=new TextEncoder().encode(h.value),m=await crypto.subtle.encrypt({name:"AES-GCM",iv:u},i,v),p=new Uint8Array(m);n={iv:u,ciphertext:p},r.innerHTML=`<span style="color: var(--ink-soft);">iv = </span>${g(u)}<br><span style="color: var(--ink-soft);">ct = </span>${g(p)}`,s.innerHTML="Encrypted with random IV. Hit <em>Encrypt</em> again — the ciphertext will change even though the message is identical. That's not a bug; it prevents an attacker from telling two identical messages apart."}async function c(){if(!i||!n){l.textContent="(encrypt something first)";return}try{const u=await crypto.subtle.decrypt({name:"AES-GCM",iv:n.iv},i,n.ciphertext);l.textContent=new TextDecoder().decode(u),s.innerHTML="Same key + same IV + same ciphertext = original message. If anyone had tampered with the ciphertext, GCM would have caught it and decryption would have failed loudly."}catch{l.textContent="❌ decryption failed (tampered ciphertext or wrong key)"}}function g(u){return Array.from(u).map(v=>v.toString(16).padStart(2,"0")).join("")}}function U(e){let i=null,n="",a="",o=null;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">RSA-OAEP-2048 keypair</div>

      <div class="controls">
        <button class="btn btn-accent" id="ak-gen">Generate keypair</button>
        <span style="font-family: var(--font-mono); color: var(--ink-soft);" id="ak-state">no keys yet</span>
      </div>

      <div class="ak-keys">
        <div>
          <div class="cy-key-label">PUBLIC KEY (shoutable)</div>
          <div class="cy-key pub" id="ak-pub">— click "Generate keypair" —</div>
        </div>
        <div>
          <div class="cy-key-label">PRIVATE KEY (never share)</div>
          <div class="cy-key priv" id="ak-priv">—</div>
        </div>
      </div>

      <div class="controls" style="margin-top: 0.8rem;">
        <label>Message:</label>
        <input class="field" id="ak-msg" value="Open sesame" style="flex: 1; min-width: 240px; font-family: var(--font-mono);">
        <button class="btn btn-accent" id="ak-enc">Encrypt with PUBLIC →</button>
      </div>

      <div class="cy-key-label">CIPHERTEXT</div>
      <div class="cy-hex" id="ak-ct">—</div>

      <div class="controls" style="margin-top: 0.8rem;">
        <button class="btn" id="ak-dec">← Decrypt with PRIVATE</button>
        <button class="btn" id="ak-bad">Try decrypt with PUBLIC (wrong)</button>
      </div>

      <div class="cy-key-label">RESULT</div>
      <div class="cy-hex" id="ak-result" style="background: var(--paper);">—</div>

      <div class="callout" id="explain">Generate a keypair to begin.</div>

      <style>
        .ak-keys { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
        @media (max-width: 640px) { .ak-keys { grid-template-columns: 1fr; } }
      </style>
    </div>
  `;const h=e.querySelector("#ak-pub"),r=e.querySelector("#ak-priv"),l=e.querySelector("#ak-ct"),s=e.querySelector("#ak-result"),t=e.querySelector("#ak-state"),d=e.querySelector("#explain");e.querySelector("#ak-gen").addEventListener("click",c),e.querySelector("#ak-enc").addEventListener("click",g),e.querySelector("#ak-dec").addEventListener("click",()=>u(!1)),e.querySelector("#ak-bad").addEventListener("click",()=>u(!0));async function c(){t.textContent="generating…",i=await crypto.subtle.generateKey({name:"RSA-OAEP",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},!0,["encrypt","decrypt"]);const m=new Uint8Array(await crypto.subtle.exportKey("spki",i.publicKey)),p=new Uint8Array(await crypto.subtle.exportKey("pkcs8",i.privateKey));n=`…${v(m).slice(40,200)}…`,a=`…${v(p).slice(40,200)}…`,h.textContent=n,r.textContent=a,t.textContent="keypair ready",d.innerHTML="Generated. Public key is fine to share — encrypt a message with it.",o=null,l.textContent="—",s.textContent="—"}async function g(){i||await c();const m=new TextEncoder().encode(e.querySelector("#ak-msg").value),p=await crypto.subtle.encrypt({name:"RSA-OAEP"},i.publicKey,m);o=new Uint8Array(p),l.textContent=v(o),d.innerHTML="Encrypted with the public key. Only the matching private key can decrypt this. Try it both ways."}async function u(m){if(!i||!o){s.textContent="(encrypt something first)";return}try{const p=m?i.publicKey:i.privateKey,w=await crypto.subtle.decrypt({name:"RSA-OAEP"},p,o);s.textContent=new TextDecoder().decode(w),d.innerHTML="Decrypted successfully with the private key."}catch(p){s.innerHTML=`❌ <span style="color: var(--accent);">decryption failed</span> — ${m?"public key can't decrypt what its private half encrypts. That's the whole point.":"unexpected error: "+p.message}`,m&&(d.innerHTML="Public keys <strong>only encrypt</strong>; they can't decrypt. The asymmetry is what makes the whole scheme safe.")}}function v(m){return Array.from(m).map(p=>p.toString(16).padStart(2,"0")).join("")}}const y={base:"#f5d76e",aliceSecret:"#d62828",bobSecret:"#1c6dd0"};function k(...e){const i=e.map(r=>[parseInt(r.slice(1,3),16),parseInt(r.slice(3,5),16),parseInt(r.slice(5,7),16)]),n=i.length,a=Math.round(i.reduce((r,l)=>r+l[0],0)/n),o=Math.round(i.reduce((r,l)=>r+l[1],0)/n),h=Math.round(i.reduce((r,l)=>r+l[2],0)/n);return`#${[a,o,h].map(r=>r.toString(16).padStart(2,"0")).join("")}`}const f={p:23,g:5,a:6,b:15};function A(e,i,n){let a=1n;for(e=BigInt(e)%BigInt(n),i=BigInt(i),n=BigInt(n);i>0n;)i&1n&&(a=a*e%n),i>>=1n,e=e*e%n;return Number(a)}const q=A(f.g,f.a,f.p),$=A(f.g,f.b,f.p),H=A($,f.a,f.p),j=A(q,f.b,f.p),C=[{label:"1. Public agreement",alice:{has:["base"]},bob:{has:["base"]},eve:{sees:["base"]},math:`Public: p=${f.p}, g=${f.g}`,note:"Alice and Bob agree on a common color (paint analogy) — equivalently, a prime and a base (the math). Eve hears this in the open. That's fine."},{label:"2. Secrets chosen",alice:{has:["base","aliceSecret"],secret:!0},bob:{has:["base","bobSecret"],secret:!0},eve:{sees:["base"]},math:`Alice picks a=${f.a}.  Bob picks b=${f.b}.  (Eve sees neither.)`,note:"Each picks a private secret. These never leave their owners — they're the only thing Eve can't see."},{label:"3. Mix and send",alice:{has:["base","aliceSecret"],sends:k(y.base,y.aliceSecret),secret:!0},bob:{has:["base","bobSecret"],sends:k(y.base,y.bobSecret),secret:!0},eve:{sees:["base",k(y.base,y.aliceSecret),k(y.base,y.bobSecret)]},math:`Alice sends A = g^a mod p = ${q}.   Bob sends B = g^b mod p = ${$}.   Eve copies both.`,note:"Each mixes secret + base. The result is sent in the clear. Eve now has the base, Alice's mix, and Bob's mix — but no way to extract either secret."},{label:"4. Mix again with own secret",alice:{has:["base","aliceSecret",k(y.base,y.bobSecret)],secret:!0,computing:!0},bob:{has:["base","bobSecret",k(y.base,y.aliceSecret)],secret:!0,computing:!0},eve:{sees:["base",k(y.base,y.aliceSecret),k(y.base,y.bobSecret)],stuck:!0},math:`Alice computes B^a mod p = ${H}.   Bob computes A^b mod p = ${j}.   Both equal g^(ab) mod p.`,note:"Each mixes the received color into their own secret. The result is the same final color — because mixing is commutative."},{label:"5. Shared secret derived",alice:{has:[k(y.base,y.aliceSecret,y.bobSecret)],final:!0},bob:{has:[k(y.base,y.aliceSecret,y.bobSecret)],final:!0},eve:{sees:["base",k(y.base,y.aliceSecret),k(y.base,y.bobSecret)],stuck:!0},math:`Shared secret = ${H}.  Eve has p, g, A, B — and needs to solve "discrete log" to recover the secret. Infeasible at real-world key sizes.`,note:"Both Alice and Bob now hold the same final color. Eve has only the three transmitted colors and can't un-mix to reach the final. They derive the same secret without ever sending it."}];function G(e){let i=0;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">The Paint Mixing</div>

      <div class="controls">
        <button class="btn" id="dh-prev">← Back</button>
        <button class="btn btn-accent" id="dh-next">Next step →</button>
        <button class="btn btn-ghost" id="dh-reset">Reset</button>
        <span style="margin-left:auto; font-family: var(--font-mono); color: var(--ink-soft);" id="dh-counter">0 / ${C.length}</span>
      </div>

      <div class="widget-stage" id="dh-stage" style="min-height: 320px;"></div>

      <div class="cy-key-label">MATH (toy values for illustration)</div>
      <div class="cy-hex" id="dh-math">—</div>

      <div class="callout" id="dh-note">Click "Next step →" to begin.</div>
    </div>
  `,e.querySelector("#dh-next").addEventListener("click",()=>{i<C.length&&i++,n()}),e.querySelector("#dh-prev").addEventListener("click",()=>{i>0&&i--,n()}),e.querySelector("#dh-reset").addEventListener("click",()=>{i=0,n()});function n(){e.querySelector("#dh-counter").textContent=`${i} / ${C.length}`;const a=i>0?C[i-1]:null,o=[{name:"ALICE",data:(a==null?void 0:a.alice)??{has:[]},bg:"#fff6dc"},{name:"WIRE / EVE",data:(a==null?void 0:a.eve)??{sees:[]},bg:"#f4f4f4",isEve:!0},{name:"BOB",data:(a==null?void 0:a.bob)??{has:[]},bg:"#fff6dc"}];let h='<div class="dh-grid">';o.forEach(r=>{h+=`<div class="dh-col" style="background: ${r.bg};">`,h+=`<div class="dh-col-name">${r.name}</div>`,(r.isEve?r.data.sees||[]:r.data.has||[]).forEach(s=>{const t=s.startsWith&&s.startsWith("#")?s:y[s];h+=`<div class="dh-blob" style="background: ${t}; ${r.isEve?"":"box-shadow: 3px 3px 0 var(--ink);"}"></div>`}),r.data.sends&&(h+='<div class="dh-arrow">→ sent →</div>',h+=`<div class="dh-blob" style="background: ${r.data.sends};"></div>`),r.data.secret&&(h+='<div class="dh-tag">🔒 has private secret</div>'),r.data.computing&&(h+='<div class="dh-tag">⚙ mixing…</div>'),r.data.final&&(h+='<div class="dh-tag" style="background:#d6f5d6; color: #2a8a3e;">✓ shared secret derived</div>'),r.data.stuck&&(h+=`<div class="dh-tag" style="background:#f7c8c8; color: var(--accent);">✗ can't un-mix</div>`),h+="</div>"}),h+="</div>",h+=`<style>
      .dh-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.6rem; }
      .dh-col { border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem; display: flex; flex-direction: column; align-items: center; min-height: 240px; }
      .dh-col-name { font-family: var(--font-display); letter-spacing: 2px; font-size: 1rem; margin-bottom: 0.6rem; }
      .dh-blob { width: 60px; height: 60px; border-radius: 50%; border: 2.5px solid var(--ink); margin: 0.2rem 0; }
      .dh-arrow { font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0; }
      .dh-tag { font-family: var(--font-mono); font-size: 0.75rem; padding: 0.2em 0.5em; border: 1.5px solid var(--ink); border-radius: 2px; margin-top: 0.5rem; background: var(--paper); }
      @media (max-width: 640px) { .dh-grid { grid-template-columns: 1fr; } .dh-col { min-height: 120px; } }
    </style>`,e.querySelector("#dh-stage").innerHTML=h,e.querySelector("#dh-math").textContent=a?a.math:"— pick a step —",e.querySelector("#dh-note").innerHTML=a?a.note:'Click "Next step →" to begin.'}n()}function O(e){let i=null,n=null,a=null;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">ECDSA P-256 sign &amp; verify</div>

      <div class="controls">
        <button class="btn btn-accent" id="sg-gen">Generate keypair</button>
        <span style="font-family: var(--font-mono); color: var(--ink-soft);" id="sg-state">no keys yet</span>
      </div>

      <div class="cy-key-label">PUBLIC KEY (anyone can verify with this)</div>
      <div class="cy-key pub" id="sg-pub">—</div>

      <div class="controls" style="margin-top: 0.6rem;">
        <label>Message to sign:</label>
        <input class="field" id="sg-msg" value="I, Alice, transfer $100 to Bob." style="flex: 1; min-width: 280px; font-family: var(--font-mono);">
        <button class="btn btn-accent" id="sg-sign">Sign with private key</button>
      </div>

      <div class="cy-key-label">SIGNATURE</div>
      <div class="cy-hex" id="sg-sig">—</div>

      <div class="controls" style="margin-top: 0.6rem;">
        <label>Received message:</label>
        <input class="field" id="sg-recv" value="" style="flex: 1; min-width: 280px; font-family: var(--font-mono);">
        <button class="btn" id="sg-verify">Verify ↗</button>
        <button class="btn btn-ghost" id="sg-tamper">Tamper (flip a char)</button>
      </div>

      <div class="cy-key-label">VERIFICATION</div>
      <div class="cy-hex" id="sg-result" style="background: var(--paper);">—</div>

      <div class="callout" id="sg-explain">Generate keys, sign the message, then verify. Then change one character in "Received message" and verify again.</div>
    </div>
  `;const o=e.querySelector("#sg-state"),h=e.querySelector("#sg-pub"),r=e.querySelector("#sg-msg"),l=e.querySelector("#sg-sig"),s=e.querySelector("#sg-recv"),t=e.querySelector("#sg-result"),d=e.querySelector("#sg-explain");e.querySelector("#sg-gen").addEventListener("click",c),e.querySelector("#sg-sign").addEventListener("click",g),e.querySelector("#sg-verify").addEventListener("click",u),e.querySelector("#sg-tamper").addEventListener("click",v);async function c(){i=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},!0,["sign","verify"]);const p=new Uint8Array(await crypto.subtle.exportKey("raw",i.publicKey));h.textContent=m(p),o.textContent="keypair ready",n=null,a=null,l.textContent="—",t.textContent="—"}async function g(){i||await c(),n=r.value;const p=await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},i.privateKey,new TextEncoder().encode(n));a=new Uint8Array(p),l.textContent=m(a),s.value=n,d.innerHTML="Signed. Anyone with the public key can now verify this exact message came from the holder of the private key."}async function u(){if(!a||!i){t.textContent="(sign a message first)";return}await crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},i.publicKey,a,new TextEncoder().encode(s.value))?(t.innerHTML='<span style="color: #2a8a3e;">✓ VALID — message is authentic and unchanged</span>',d.innerHTML="Verification succeeded. The received message exactly matches what was signed; the signature is from the holder of the corresponding private key."):(t.innerHTML='<span style="color: var(--accent);">✗ INVALID — message tampered or wrong key</span>',d.innerHTML="Verification failed. The received message doesn't match what was signed (or someone else's key was used). The receiver detects this and rejects the message — no trust required in the transport layer.")}function v(){const p=s.value;if(!p.length)return;let w=p.length-1;for(;w>=0&&!/[a-zA-Z]/.test(p[w]);)w--;if(w<0){s.value=p+"x";return}const E=p[w],R=E===E.toLowerCase()?E.toUpperCase():E.toLowerCase();s.value=p.slice(0,w)+R+p.slice(w+1),d.innerHTML="Flipped one character in the received message. Now click Verify — watch it fail."}function m(p){return Array.from(p).map(w=>w.toString(16).padStart(2,"0")).join("")}}const S={"fundamentalofx.com":{leaf:{subject:"fundamentalofx.com",issuer:"Let's Encrypt R3",validUntil:"2026-08-19"},intermediate:{subject:"Let's Encrypt R3",issuer:"ISRG Root X1",validUntil:"2027-09-29"},root:{subject:"ISRG Root X1",issuer:"ISRG Root X1 (self)",validUntil:"2035-06-04"}},"github.com":{leaf:{subject:"github.com",issuer:"DigiCert TLS Hybrid",validUntil:"2026-03-14"},intermediate:{subject:"DigiCert TLS Hybrid",issuer:"DigiCert Global Root CA",validUntil:"2031-11-09"},root:{subject:"DigiCert Global Root CA",issuer:"DigiCert Global Root CA (self)",validUntil:"2031-11-10"}},"sketchy-site.example":{leaf:{subject:"sketchy-site.example",issuer:"Unknown Root CA",validUntil:"2026-12-01"},intermediate:{subject:"Unknown Intermediate",issuer:"Unknown Root CA",validUntil:"2030-01-01"},root:{subject:"Unknown Root CA",issuer:"Unknown Root CA (self)",validUntil:"2035-01-01"},untrustedRoot:!0}},L=new Set(["ISRG Root X1","DigiCert Global Root CA"]);function W(e){let i="fundamentalofx.com",n=new Set,a=0;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Walking the chain</div>

      <div class="controls">
        <label>Domain:</label>
        <select class="field" id="ct-domain">
          ${Object.keys(S).map(l=>`<option value="${l}">${l}</option>`).join("")}
        </select>
        <button class="btn btn-accent" id="ct-verify">Verify step →</button>
        <button class="btn btn-ghost" id="ct-reset">Reset</button>
      </div>

      <div class="controls">
        <label>Tamper:</label>
        <label><input type="checkbox" data-tamper="leaf"> Leaf</label>
        <label><input type="checkbox" data-tamper="intermediate"> Intermediate</label>
        <label><input type="checkbox" data-tamper="root"> Root</label>
      </div>

      <div class="widget-stage" id="ct-stage" style="min-height: 360px;"></div>

      <div class="callout" id="ct-explain">Pick a domain, then click "Verify step →" to walk up the chain.</div>
    </div>
  `,e.querySelector("#ct-domain").addEventListener("change",l=>{i=l.target.value,a=0,o()}),e.querySelector("#ct-verify").addEventListener("click",()=>{a<3&&a++,o()}),e.querySelector("#ct-reset").addEventListener("click",()=>{a=0,o()}),e.querySelectorAll("input[data-tamper]").forEach(l=>l.addEventListener("change",s=>{const t=s.target.dataset.tamper;s.target.checked?n.add(t):n.delete(t),a=0,o()}));function o(){const l=S[i],s=[{id:"leaf",label:"LEAF",data:l.leaf,active:a>=1,color:"#cfe5ff"},{id:"intermediate",label:"INTERMEDIATE",data:l.intermediate,active:a>=2,color:"#ffe9b3"},{id:"root",label:"ROOT CA",data:l.root,active:a>=3,color:"#c8f0c8"}];let t='<div class="ct-chain">';s.forEach((c,g)=>{const u=n.has(c.id),v=c.active&&u;if(t+=`
        <div class="ct-cert ${c.active?"active":""} ${v?"bad":""}" style="background: ${c.color};">
          <div class="ct-cert-label">${c.label} ${u?"⚠ tampered":""}</div>
          <div class="ct-cert-row"><strong>Subject:</strong> ${r(c.data.subject)}</div>
          <div class="ct-cert-row"><strong>Issuer:</strong> ${r(c.data.issuer)}</div>
          <div class="ct-cert-row"><strong>Valid until:</strong> ${r(c.data.validUntil)}</div>
          ${c.active?`<div class="ct-status">${h(c.id,u)}</div>`:""}
        </div>
      `,g<s.length-1){const m=c.active&&s[g+1].active;t+=`<div class="ct-arrow ${m?"lit":""}">↑ signed by ↑</div>`}}),t+="</div>",t+=`<style>
      .ct-chain { display: flex; flex-direction: column; gap: 0.3rem; align-items: center; }
      .ct-cert { width: 100%; max-width: 460px; border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.9rem; opacity: 0.45; }
      .ct-cert.active { opacity: 1; box-shadow: 3px 3px 0 var(--ink); }
      .ct-cert.bad { box-shadow: 3px 3px 0 var(--accent); border-color: var(--accent); }
      .ct-cert-label { font-family: var(--font-display); letter-spacing: 1.5px; font-size: 0.85rem; color: var(--ink-soft); margin-bottom: 0.3em; }
      .ct-cert-row { font-family: var(--font-mono); font-size: 0.8rem; margin: 0.1em 0; }
      .ct-status { margin-top: 0.4em; padding-top: 0.3em; border-top: 1.5px dashed var(--ink); font-family: var(--font-mono); font-size: 0.82rem; font-weight: 600; }
      .ct-arrow { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-faint); }
      .ct-arrow.lit { color: var(--accent); font-weight: 600; }
    </style>`,e.querySelector("#ct-stage").innerHTML=t;const d=e.querySelector("#ct-explain");a===0?d.innerHTML=`Picked <strong>${i}</strong>. Click "Verify step →" to start at the leaf and walk up.`:a===1?n.has("leaf")?d.innerHTML="<strong>Step 1 fails.</strong> The leaf cert was tampered with — its signature no longer matches its contents. Browser refuses the connection.":d.innerHTML="<strong>Step 1: leaf check.</strong> Subject matches the URL? ✓ Not expired? ✓ Signature on the cert matches the intermediate's public key? About to verify next.":a===2?n.has("intermediate")?d.innerHTML="<strong>Step 2 fails.</strong> The intermediate cert was tampered with. Browser refuses.":d.innerHTML="<strong>Step 2: intermediate check.</strong> Intermediate's signature matches the root's public key. One step left.":a===3&&(n.has("root")?d.innerHTML="<strong>Step 3 fails.</strong> The root in the chain doesn't match the one in your browser's trust store. Browser refuses.":S[i].untrustedRoot||!L.has(S[i].root.subject)?d.innerHTML=`<strong>Step 3 fails.</strong> The root CA "${S[i].root.subject}" is not in your browser's trust store. Connection refused.`:d.innerHTML="<strong>All three checks passed.</strong> Chain ends at a trusted root the browser already had. 🟢 Padlock appears.")}function h(l,s){return s?'<span style="color: var(--accent);">✗ signature mismatch</span>':l==="root"?L.has(S[i].root.subject)?'<span style="color: #2a8a3e;">✓ trusted root (in browser store)</span>':'<span style="color: var(--accent);">✗ untrusted root — not in browser store</span>':'<span style="color: #2a8a3e;">✓ signature OK</span>'}function r(l){return String(l).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s])}o()}const M=[{regex:/[a-z]/,size:26},{regex:/[A-Z]/,size:26},{regex:/[0-9]/,size:10},{regex:/[^a-zA-Z0-9]/,size:33}],K=new Set(["password","123456","qwerty","abc123","letmein","admin","welcome","password1","iloveyou","monkey","dragon","sunshine","12345678","fundamentalofx","xthewiz"]),z=1e10,N=10;function F(e){let i="sunshine";e.innerHTML=`
    <div class="widget">
      <div class="widget-title">Crack-time race</div>

      <div class="controls">
        <label>Password:</label>
        <input type="text" class="field" id="pw-input" value="sunshine" style="flex: 1; min-width: 240px; font-family: var(--font-mono);">
        <span style="font-family: var(--font-mono); color: var(--ink-soft);" id="pw-info"></span>
      </div>

      <div class="pw-grid">
        <div class="pw-side">
          <div class="pw-method">stored as SHA-256</div>
          <div class="cy-key-label">attacker rate</div>
          <div class="cy-hex">10,000,000,000 / sec  (GPU)</div>
          <div class="cy-key-label" style="margin-top: 0.5rem;">estimated crack time</div>
          <div class="cy-hex" id="pw-sha" style="background: #f7c8c8;">—</div>
        </div>
        <div class="pw-side">
          <div class="pw-method">stored as bcrypt (cost=12)</div>
          <div class="cy-key-label">attacker rate</div>
          <div class="cy-hex">10 / sec  (deliberately slow)</div>
          <div class="cy-key-label" style="margin-top: 0.5rem;">estimated crack time</div>
          <div class="cy-hex" id="pw-bcrypt" style="background: #d6f5d6;">—</div>
        </div>
      </div>

      <div class="callout" id="pw-explain"></div>

      <style>
        .pw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin: 1rem 0; }
        .pw-side { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.8rem; }
        .pw-method { font-family: var(--font-display); font-size: 1.05rem; letter-spacing: 1px; margin-bottom: 0.5rem; }
        @media (max-width: 600px) { .pw-grid { grid-template-columns: 1fr; } }
      </style>
    </div>
  `,e.querySelector("#pw-input").addEventListener("input",t=>{i=t.target.value,a()});function a(){let t=0;for(const m of M)m.regex.test(i)&&(t+=m.size);t===0&&(t=26);const d=Math.pow(t,i.length),c=K.has(i.toLowerCase());e.querySelector("#pw-info").textContent=`length=${i.length} · char-classes=${o(i)} · space ≈ ${h(d)}`;let g,u;c?(g=1e-4,u=100):(g=d/2/z,u=d/2/N),e.querySelector("#pw-sha").textContent=r(g),e.querySelector("#pw-bcrypt").textContent=r(u);let v;c?v=`❌ <strong>"${s(i)}" is in every public wordlist.</strong> SHA-256 storage: cracked instantly. Even bcrypt: ~${r(u)} — slow but very feasible. Pick something the world hasn't already seen.`:i.length<8?v="<strong>Short password.</strong> Even with bcrypt slowing things down, a short password is still brute-forceable. Aim for 12+ characters or use a passphrase.":i.length>=12&&o(i)>=3?v=`<strong>Strong password.</strong> Under SHA-256 it would still take ${r(g)}; under bcrypt the attacker would have given up long before the heat death of the universe. Mix of character classes + length is what works.`:v=`<strong>Moderate.</strong> Bcrypt buys you ${l(u/g)} more time than SHA-256 against the same attacker. That's the whole reason slow hashes exist.`,e.querySelector("#pw-explain").innerHTML=v}function o(t){let d=0;for(const c of M)c.regex.test(t)&&d++;return d}function h(t){return!isFinite(t)||t>1e18?"> 10^18":t>=1e9?(t/1e9).toPrecision(3)+" billion":t>=1e6?(t/1e6).toPrecision(3)+" million":t>=1e3?Math.round(t/1e3)+"k":Math.round(t)}function r(t){return t<.001?"instant":t<1?`${(t*1e3).toPrecision(2)} ms`:t<60?`${t.toPrecision(2)} sec`:t<3600?`${(t/60).toPrecision(2)} min`:t<86400?`${(t/3600).toPrecision(2)} hours`:t<86400*365?`${(t/86400).toPrecision(2)} days`:t<86400*365*1e3?`${(t/(86400*365)).toPrecision(3)} years`:t<86400*365*1e9?`${(t/(86400*365*1e6)).toPrecision(3)} million years`:`${(t/(86400*365*1e9)).toPrecision(3)} billion years`}function l(t){return t>1e9?`${(t/1e9).toPrecision(2)} billion×`:t>1e6?`${(t/1e6).toPrecision(2)} million×`:`${t.toPrecision(2)}×`}function s(t){return String(t).replace(/[&<>"']/g,d=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[d])}a()}const V=[{id:"hash",label:"Hashing",link:"hashing.html"},{id:"sym",label:"Symmetric",link:"symmetric.html"},{id:"asym",label:"Asymmetric",link:"asymmetric.html"},{id:"dh",label:"Diffie-Hellman",link:"diffie-hellman.html"},{id:"sig",label:"Signatures",link:"signatures.html"},{id:"cert",label:"Cert chain",link:"certificates.html"}],T=[{title:"1. ClientHello",body:"Client → Server: cipher suites, supported curves, RANDOM_C, DH key share (ephemeral pub_C).",primitives:["asym","dh"],note:"Client commits to a fresh ephemeral DH keypair. Sending the public half publicly is fine — that's how DH works."},{title:"2. ServerHello",body:"Server → Client: chosen cipher suite, RANDOM_S, DH key share (ephemeral pub_S). Server now has both halves of DH — derives shared secret 🔑.",primitives:["asym","dh"],note:"After one round trip both sides can derive the same secret from (pub_C, pub_S) + their own private. That secret becomes the basis for every subsequent symmetric key."},{title:"3. {Certificate}  ← encrypted",body:"Server → Client (encrypted from here): cert chain proving server identity for fundamentalofx.com.",primitives:["cert","sym"],note:'From this message on, traffic is encrypted with a key derived from the DH secret. The cert chain is the proof of "this is really fundamentalofx.com."'},{title:"4. {CertificateVerify}",body:"Server signs the handshake transcript with its private key. Anyone with the cert's public key can verify.",primitives:["sig","hash"],note:"Without this signature, an attacker could swap the cert mid-flight. This step proves the server actually holds the private key for the cert it sent."},{title:"5. {Finished}",body:"Server → Client: HMAC over the entire handshake transcript. Server proves it processed every preceding message correctly.",primitives:["hash"],note:"A keyed hash (HMAC) of the transcript catches any tampering. If even one earlier byte was modified, both sides' Finished messages won't match."},{title:"6. Application Data",body:"Both directions: GET requests, HTML responses, every byte — encrypted with AES-128-GCM (or ChaCha20-Poly1305) using the DH-derived key.",primitives:["sym"],note:"Bulk traffic uses symmetric crypto — fast, well-studied. The expensive asymmetric work was only at handshake time, never again for this connection."}];function _(e){let i=0;e.innerHTML=`
    <div class="widget">
      <div class="widget-title">TLS 1.3 + crypto primitives, side by side</div>

      <div class="controls">
        <button class="btn" id="tr-prev">← Back</button>
        <button class="btn btn-accent" id="tr-next">Next message →</button>
        <button class="btn btn-ghost" id="tr-reset">Reset</button>
        <span style="margin-left:auto; font-family: var(--font-mono); color: var(--ink-soft);" id="tr-counter">0 / ${T.length}</span>
      </div>

      <div class="tr-layout">
        <div class="tr-main" id="tr-main"></div>
        <div class="tr-side">
          <div class="tr-side-title">PRIMITIVES IN USE</div>
          ${V.map(o=>`
            <a href="${o.link}" class="tr-prim" data-prim="${o.id}">
              <span class="tr-prim-dot"></span>
              <span class="tr-prim-label">${o.label}</span>
            </a>
          `).join("")}
        </div>
      </div>

      <div class="callout" id="tr-note">Click "Next message →" to walk through the handshake.</div>

      <style>
        .tr-layout { display: grid; grid-template-columns: 1fr 220px; gap: 0.8rem; margin: 0.6rem 0; }
        .tr-main { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.9rem 1rem; min-height: 220px; }
        .tr-side { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.8rem; }
        .tr-side-title { font-family: var(--font-display); font-size: 0.8rem; letter-spacing: 1px; color: var(--ink-soft); margin-bottom: 0.4rem; }
        .tr-prim { display: flex; align-items: center; gap: 0.5em; padding: 0.4em 0.5em; border: 1.5px solid var(--ink); border-radius: var(--radius); margin: 0.25em 0; background: var(--paper); text-decoration: none; color: var(--ink); transition: background 0.15s; }
        .tr-prim:hover { background: var(--paper-deep); color: var(--ink); }
        .tr-prim-dot { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid var(--ink); background: var(--paper); }
        .tr-prim.on { background: var(--accent-soft); border-color: var(--accent); box-shadow: 2px 2px 0 var(--ink); }
        .tr-prim.on .tr-prim-dot { background: var(--accent); }
        .tr-prim-label { font-family: var(--font-display); font-size: 0.95rem; letter-spacing: 0.04em; }
        .tr-step-title { font-family: var(--font-display); font-size: 1.2rem; letter-spacing: 0.04em; color: var(--accent); margin-bottom: 0.4em; }
        .tr-step-body { font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.55; }
        @media (max-width: 720px) { .tr-layout { grid-template-columns: 1fr; } }
      </style>
    </div>
  `,e.querySelector("#tr-next").addEventListener("click",()=>{i<T.length&&i++,n()}),e.querySelector("#tr-prev").addEventListener("click",()=>{i>0&&i--,n()}),e.querySelector("#tr-reset").addEventListener("click",()=>{i=0,n()});function n(){e.querySelector("#tr-counter").textContent=`${i} / ${T.length}`;const o=i>0?T[i-1]:null,h=e.querySelector("#tr-main");o?h.innerHTML=`<div class="tr-step-title">${a(o.title)}</div><div class="tr-step-body">${a(o.body)}</div>`:h.innerHTML='<div style="text-align:center; color: var(--ink-faint); padding: 2rem;">(no step yet)</div>';const r=new Set((o==null?void 0:o.primitives)??[]);e.querySelectorAll(".tr-prim").forEach(l=>{l.classList.toggle("on",r.has(l.dataset.prim))}),e.querySelector("#tr-note").innerHTML=o?o.note:'Click "Next message →" to walk through the handshake.'}function a(o){return String(o).replace(/[&<>"']/g,h=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[h])}n()}const x=e=>()=>b.jsx(I,{init:e}),Z={slug:"cryptography",title:"Cryptography",intro:b.jsx(b.Fragment,{children:"Eight lessons walking up from one-way hash functions to the full TLS handshake — symmetric and asymmetric crypto, key exchange, signatures, certificates, and password hashing."}),lessons:[{slug:"hashing",number:"01",title:"Hashing",blurb:"One-way functions, the avalanche effect, and why a single character changes everything.",Widget:x(D),intro:b.jsx(b.Fragment,{children:"A cryptographic hash takes any input and produces a fixed-size fingerprint. Easy forward, impossible to reverse, and tiny input changes produce wildly different outputs."}),sections:[],takeaways:["One-way: easy to compute, infeasible to invert.","Deterministic: same input → same hash.","Avalanche: flip one bit, half the output bits flip.","SHA-256, BLAKE3 are modern defaults; MD5 and SHA-1 are broken."]},{slug:"symmetric",number:"02",title:"Symmetric Crypto",blurb:"AES, ChaCha20, and the eternal problem: how do you share the key without exposing it?",Widget:x(B),intro:b.jsx(b.Fragment,{children:"Same key encrypts and decrypts. Fast (microseconds for kilobytes), but only useful if both parties already share the key."}),sections:[],takeaways:["AES-256-GCM is the modern default — fast on hardware, authenticated.","Never use ECB mode. CBC is fine if you authenticate; GCM does both.",'The "key distribution problem" is what asymmetric crypto solves.',"For real systems: derive keys with HKDF, never reuse a nonce with GCM."]},{slug:"asymmetric",number:"03",title:"Asymmetric Crypto",blurb:"A keypair where one half is public and the other half is yours.",Widget:x(U),intro:b.jsx(b.Fragment,{children:"Two mathematically linked keys. Encrypt with one, decrypt with the other. Same trick gives us signatures, key exchange, and identity."}),sections:[],takeaways:["RSA: based on factoring large primes. Slow but well-understood.","Elliptic curve (Ed25519, X25519): smaller keys, same security, faster.","1000× slower than symmetric — used only for setup, not bulk encryption.",'Public key = "send me secrets". Private key = "this is me".']},{slug:"diffie-hellman",number:"04",title:"Diffie-Hellman",blurb:"Two strangers agree on a shared secret while shouting numbers across a crowded room.",Widget:x(G),intro:b.jsx(b.Fragment,{children:"Both parties pick a secret, exchange a derived public value, and combine to land on the same shared key — without ever sending it. The foundation of every TLS connection."}),sections:[],takeaways:["Each side computes the same secret from public + their private — without transmitting it.","Eavesdropper sees both public values but cannot derive the shared secret.","Ephemeral DH (DHE/ECDHE) gives forward secrecy — past sessions stay safe if a long-term key leaks.","Modern TLS always uses ephemeral key exchange."]},{slug:"signatures",number:"05",title:"Digital Signatures",blurb:"Sign with private, verify with public. Change one byte — verification fails.",Widget:x(O),intro:b.jsx(b.Fragment,{children:"A signature proves who wrote a message and that nobody changed it. Hash the message, encrypt the hash with your private key, anyone can verify with your public key."}),sections:[],takeaways:["Authentication: only the private key holder can produce the signature.","Integrity: any change to the message invalidates the signature.","Non-repudiation: signer can't later deny signing.","Ed25519 is the modern default — fast, small, side-channel resistant."]},{slug:"certificates",number:"06",title:"Certificate Chains",blurb:"Why does your browser trust a stranger's site?",Widget:x(W),intro:b.jsx(b.Fragment,{children:"Certificates are signed claims about who owns a public key. Chains of them go up to root CAs that your browser already trusts. Trust transfers down the chain."}),sections:[],takeaways:["Browsers ship a list of trusted root CAs.",'A leaf cert says "this key is example.com" — signed by an intermediate.',"Intermediate is signed by a root. Browser verifies the whole chain.","Misissued certs are revoked via OCSP or CRLs (slowly and unreliably)."]},{slug:"password-hashing",number:"07",title:"Password Hashing",blurb:"bcrypt vs raw SHA-256 in a timing race. Salts, work factors, and why rainbow tables exist.",Widget:x(F),intro:b.jsx(b.Fragment,{children:"Storing passwords means assuming your database will leak. Hash them with a deliberately slow function so brute-force costs become prohibitive."}),sections:[],takeaways:["Never store plaintext passwords. Never.","Use bcrypt, scrypt, or Argon2 — slow on purpose.","Salt per user prevents rainbow-table attacks across users.","Tune the work factor so a single hash takes ~100 ms on your hardware."]},{slug:"tls-revisited",number:"08",title:"TLS Revisited",blurb:"Now that you know the primitives, walk through the TLS handshake again.",Widget:x(_),intro:b.jsx(b.Fragment,{children:"Every TLS connection uses hashing, signatures, asymmetric key exchange, certificates, and symmetric encryption in sequence. With the primitives in hand, you can see how they fit."}),sections:[],takeaways:["ClientHello/ServerHello negotiate version + cipher suite.","Key exchange (ECDHE) establishes the session key.","Certificate (signed by a CA) authenticates the server.","Bulk data flows over symmetric AES-GCM thereafter."]}]};export{Z as manifest};
