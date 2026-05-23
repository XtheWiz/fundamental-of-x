import{r as h,j as e}from"./main-_Tg0Y2ea.js";import{L as P}from"./LegacyWidget-Dk_86ovI.js";import{m as x}from"./proxy-CWzFoYuJ.js";import{A as F}from"./index-BVdpxcMX.js";const I={log:{id:"log",label:"Logger",color:"#cfe5ff"},auth:{id:"auth",label:"Auth",color:"#fde2e2"},comp:{id:"comp",label:"Compress",color:"#d9ead3"},rate:{id:"rate",label:"Rate-limit",color:"#fff2b3"},retry:{id:"retry",label:"Retry",color:"#e7d6f5"}};function U(t,s){const r=[];let n=null;for(const a of t){if(n)break;switch(a){case"log":r.push({id:a,dir:"in",text:"[log]    request received"});break;case"auth":s?r.push({id:a,dir:"in",text:"[auth]   token OK"}):(r.push({id:a,dir:"in",text:"[auth]   token MISSING — reject 401",err:!0}),n="auth");break;case"comp":r.push({id:a,dir:"in",text:"[comp]   negotiating gzip"});break;case"rate":r.push({id:a,dir:"in",text:"[rate]   1 of 10 in window"});break;case"retry":r.push({id:a,dir:"in",text:"[retry]  attempt 1/3"});break}}n||r.push({id:"core",dir:"core",text:">> realLogic(req) -> 200 OK"});const i=n?t.slice(0,t.indexOf(n)):t.slice();for(const a of i.slice().reverse())switch(a){case"log":r.push({id:a,dir:"out",text:"[log]    response written (12ms)"});break;case"auth":r.push({id:a,dir:"out",text:"[auth]   (pass-through)"});break;case"comp":r.push({id:a,dir:"out",text:"[comp]   body gzipped (1.8 kB)"});break;case"rate":r.push({id:a,dir:"out",text:"[rate]   counter += 1"});break;case"retry":r.push({id:a,dir:"out",text:"[retry]  success on attempt 1"});break}return{lines:r,blockedBy:n}}function H(t){if(t.length===0)return"No middleware — the request goes straight to the handler.";const s=t.indexOf("log"),r=t.indexOf("auth"),n=t.indexOf("comp"),i=t.indexOf("rate"),a=t.indexOf("retry");return r!==-1&&s!==-1&&r<s?"Auth runs before Logger — unauthenticated requests are rejected before they are ever logged. Good for privacy, bad for security audits.":r!==-1&&s!==-1&&s<r?"Logger runs before Auth — every attempt is logged, including failed auth. Useful for intrusion detection.":n!==-1&&a!==-1&&n<a?"Compress wraps Retry — each retry attempt re-compresses the body. Wasteful CPU. Put Retry outside Compress.":i!==-1&&a!==-1&&a<i?"Retry sits outside Rate-limit — a single failing request can burn through your quota in milliseconds. Put Rate-limit outside Retry.":"Try moving Auth above or below Logger to see the trace change."}const E={rest:{id:"rest",label:"REST JSON"},soap:{id:"soap",label:"SOAP XML"},gql:{id:"gql",label:"GraphQL"}},j={rest:`{
  "method": "getUser",
  "params": { "id": 42 }
}`,soap:`<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <getUser>
      <id>42</id>
    </getUser>
  </soap:Body>
</soap:Envelope>`,gql:`query {
  user(id: 42) {
    id
    name
  }
}`};function _(t,s){var r;try{if(t==="rest"){const n=JSON.parse(s),i=n.method||"unknown",a=((r=n.params)==null?void 0:r.id)??null;return{op:i,id:a,ok:!0}}if(t==="soap"){const n=s.match(/<(?:\w+:)?Body>\s*<(\w+)/),i=s.match(/<id>([^<]+)<\/id>/);return{op:(n==null?void 0:n[1])||"unknown",id:i?Number(i[1]):null,ok:!0}}if(t==="gql"){const n=s.match(/(\w+)\s*\(/),i=s.match(/id:\s*(\d+)/);return{op:n?"get"+n[1][0].toUpperCase()+n[1].slice(1):"unknown",id:i?Number(i[1]):null,ok:!0}}}catch(n){return{ok:!1,error:String(n.message||n)}}return{ok:!1,error:"unrecognised source format"}}function G(t,s){if(!s.ok)return`// could not parse source:
// ${s.error}`;const{op:r,id:n}=s;if(t==="rest")return JSON.stringify({method:r,params:{id:n}},null,2);if(t==="soap")return`<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${r}>
      <id>${n}</id>
    </${r}>
  </soap:Body>
</soap:Envelope>`;if(t==="gql"){const i=r.replace(/^get/,"");return`query {
  ${i?i[0].toLowerCase()+i.slice(1):"item"}(id: ${n}) {
    id
    name
  }
}`}return""}function J(t,s){if(t===s)return[];const r=[];return t==="soap"&&r.push("Unwrap SOAP envelope → strip <soap:Body>."),t==="gql"&&r.push("Parse GraphQL operation name → map to REST-style method."),t==="rest"&&r.push("Read JSON method + params."),s==="soap"&&r.push("Wrap in <soap:Envelope><soap:Body>... XML escape values."),s==="gql"&&r.push("Emit `query { ... }` with named field; `id:` arg inline."),s==="rest"&&r.push("Emit `{ method, params }` JSON body."),r}function Q(){const[t,s]=h.useState("decorator");return e.jsxs("div",{className:"widget",children:[e.jsx("div",{className:"widget-title",children:"Decorator & Adapter — wrap and translate"}),e.jsx("div",{className:"controls",children:e.jsxs("div",{className:"pill-group",children:[e.jsx("button",{className:`btn ${t==="decorator"?"btn-accent":""}`,onClick:()=>s("decorator"),children:"Decorator"}),e.jsx("button",{className:`btn ${t==="adapter"?"btn-accent":""}`,onClick:()=>s("adapter"),children:"Adapter"})]})}),t==="decorator"?e.jsx(Y,{}):e.jsx(V,{})]})}function Y(){const[t,s]=h.useState({log:!0,auth:!0,comp:!0,rate:!1,retry:!1}),[r,n]=h.useState(["log","auth","comp","rate","retry"]),[i,a]=h.useState(!0),[u,c]=h.useState(null),d=h.useMemo(()=>r.filter(l=>t[l]),[r,t]);function o(l){s(m=>({...m,[l]:!m[l]})),c(null)}function p(l,m){n(b=>{const k=b.filter(T=>t[T]),v=k.indexOf(l);if(v===-1)return b;const q=v+m;if(q<0||q>=k.length)return b;const S=k.slice();[S[v],S[q]]=[S[q],S[v]];const $=[];let M=0;for(const T of b)t[T]?$.push(S[M++]):$.push(T);return $}),c(null)}function g(){c(U(d,i))}const w=H(d);return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"controls",style:{flexWrap:"wrap"},children:Object.values(I).map(l=>e.jsxs("label",{style:K(t[l.id],l.color),children:[e.jsx("input",{type:"checkbox",checked:t[l.id],onChange:()=>o(l.id)}),e.jsx("span",{style:{marginLeft:"0.4em"},children:l.label})]},l.id))}),e.jsxs("div",{className:"controls",style:{alignItems:"center"},children:[e.jsx("button",{className:"btn btn-accent",onClick:g,disabled:d.length===0&&!1,children:"Send request"}),e.jsxs("label",{style:{fontFamily:"var(--font-mono)",fontSize:"0.85rem",display:"inline-flex",alignItems:"center",gap:"0.3em"},children:[e.jsx("input",{type:"checkbox",checked:i,onChange:l=>{a(l.target.checked),c(null)}}),"request has valid token"]})]}),e.jsxs("div",{className:"widget-stage",style:{display:"grid",gridTemplateColumns:"minmax(220px, 1fr) minmax(260px, 1.4fr)",gap:"0.8rem",alignItems:"start"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontFamily:"var(--font-display)",fontSize:"0.9rem",marginBottom:"0.4rem"},children:"Chain (outer → inner)"}),d.length===0&&e.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"0.8rem",color:"var(--ink-faint)"},children:"No layers enabled — the handler runs bare."}),e.jsxs(x.ul,{layout:!0,style:{listStyle:"none",padding:0,margin:0,display:"flex",flexDirection:"column",gap:"0.3rem"},children:[e.jsx(F,{children:d.map((l,m)=>{const b=I[l];return e.jsxs(x.li,{layout:!0,initial:{opacity:0,y:-4},animate:{opacity:1,y:0},exit:{opacity:0,y:4},transition:{duration:.18},style:{background:b.color,border:"1.5px solid var(--ink)",borderRadius:"var(--radius)",padding:"0.3rem 0.5rem",display:"flex",alignItems:"center",gap:"0.4rem",fontFamily:"var(--font-mono)",fontSize:"0.85rem"},children:[e.jsxs("span",{style:{color:"var(--ink-soft)",minWidth:"1.4em"},children:[m+1,"."]}),e.jsx("span",{style:{flex:1},children:b.label}),e.jsx("button",{className:"btn btn-ghost",style:A,onClick:()=>p(l,-1),disabled:m===0,"aria-label":"move up",children:"↑"}),e.jsx("button",{className:"btn btn-ghost",style:A,onClick:()=>p(l,1),disabled:m===d.length-1,"aria-label":"move down",children:"↓"})]},l)})}),e.jsx(x.li,{layout:!0,style:{background:"var(--paper-deep)",border:"1.5px dashed var(--ink)",borderRadius:"var(--radius)",padding:"0.3rem 0.5rem",fontFamily:"var(--font-mono)",fontSize:"0.82rem",color:"var(--ink-soft)"},children:"core: realLogic(req)"})]})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontFamily:"var(--font-display)",fontSize:"0.9rem",marginBottom:"0.4rem"},children:"Trace"}),e.jsxs("div",{className:"code-block",style:{minHeight:160,fontSize:"0.82rem",padding:"0.5rem 0.7rem"},children:[!u&&e.jsx("span",{style:{color:"var(--ink-faint)"},children:'Press "Send request" to walk the chain.'}),e.jsx(F,{children:u&&u.lines.map((l,m)=>e.jsxs(x.div,{initial:{opacity:0,x:l.dir==="out"?6:-6},animate:{opacity:1,x:0},transition:{duration:.18,delay:m*.04},style:{color:l.err?"var(--accent)":l.dir==="core"?"#1c6dd0":"var(--ink)",paddingLeft:l.dir==="core"?0:`${Math.min(m,u.lines.length-1-m)*.8}em`,fontWeight:l.dir==="core"?600:400},children:[l.dir==="in"?"→ ":l.dir==="out"?"← ":"   ",l.text]},m))})]})]})]}),e.jsxs("div",{className:"callout",children:[e.jsx("strong",{children:"Order matters."})," ",w]})]})}function V(){const[t,s]=h.useState("rest"),[r,n]=h.useState("soap"),[i,a]=h.useState(j.rest),[u,c]=h.useState(!1);function d(l){s(l),u?(i.trim()===""||i===j[t])&&(a(j[l]),c(!1)):a(j[l])}const o=h.useMemo(()=>_(t,i),[t,i]),p=t===r,g=p?i:G(r,o),w=J(t,r);return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"controls",style:{flexWrap:"wrap",gap:"0.8rem"},children:[e.jsxs("label",{style:L,children:[e.jsx("span",{style:R,children:"Source"}),e.jsx("select",{value:t,onChange:l=>d(l.target.value),style:O,children:Object.values(E).map(l=>e.jsx("option",{value:l.id,children:l.label},l.id))})]}),e.jsxs("label",{style:L,children:[e.jsx("span",{style:R,children:"Target"}),e.jsx("select",{value:r,onChange:l=>n(l.target.value),style:O,children:Object.values(E).map(l=>e.jsx("option",{value:l.id,children:l.label},l.id))})]}),e.jsx("button",{className:"btn btn-ghost",onClick:()=>{a(j[t]),c(!1)},children:"Reset payload"})]}),e.jsxs("div",{className:"widget-stage",style:{display:"grid",gridTemplateColumns:"1fr",gap:"0.8rem"},children:[e.jsxs("svg",{viewBox:"0 0 700 90",width:"100%",style:{maxWidth:700},children:[e.jsx("defs",{children:e.jsx("marker",{id:"da-arr",markerWidth:"10",markerHeight:"10",refX:"9",refY:"5",orient:"auto",children:e.jsx("polygon",{points:"0 0,10 5,0 10",fill:"var(--ink)"})})}),e.jsx(C,{x:90,y:45,label:E[t].label,sublabel:"source",fill:"#cfe5ff"}),e.jsx(C,{x:350,y:45,label:"Adapter",sublabel:p?"pass-through":"translates",fill:p?"var(--paper-deep)":"var(--accent-soft)",highlight:!p}),e.jsx(C,{x:610,y:45,label:E[r].label,sublabel:"target",fill:"#d9ead3"}),e.jsx("line",{x1:150,y1:45,x2:290,y2:45,stroke:"var(--ink)",strokeWidth:2,markerEnd:"url(#da-arr)"}),e.jsx("line",{x1:410,y1:45,x2:550,y2:45,stroke:"var(--ink)",strokeWidth:2,markerEnd:"url(#da-arr)"})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.6rem"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontFamily:"var(--font-display)",fontSize:"0.9rem",marginBottom:"0.3rem"},children:"Input payload"}),e.jsx("textarea",{value:i,onChange:l=>{a(l.target.value),c(!0)},spellCheck:!1,style:{width:"100%",minHeight:160,fontFamily:"var(--font-mono)",fontSize:"0.8rem",padding:"0.5rem 0.7rem",border:"1.5px solid var(--ink)",borderRadius:"var(--radius)",background:"var(--paper)",resize:"vertical",boxSizing:"border-box"}})]}),e.jsxs("div",{children:[e.jsxs("div",{style:{fontFamily:"var(--font-display)",fontSize:"0.9rem",marginBottom:"0.3rem"},children:["Translated output ",p&&e.jsx("span",{style:{color:"var(--ink-soft)",fontSize:"0.8rem"},children:"(no adapter needed)"})]}),e.jsx("pre",{className:"code-block",style:{margin:0,minHeight:160,fontSize:"0.8rem",whiteSpace:"pre-wrap",wordBreak:"break-word"},children:g})]})]})]}),e.jsx("div",{className:"callout",children:p?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:"Source equals target."})," No translation — the payload passes straight through. An adapter only earns its keep across an interface gap."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:"Translation rules applied:"}),e.jsx("ul",{style:{margin:"0.3rem 0 0 1.2rem",padding:0,fontFamily:"var(--font-mono)",fontSize:"0.82rem"},children:w.map((l,m)=>e.jsx("li",{children:l},m))})]})})]})}function C({x:t,y:s,label:r,sublabel:n,fill:i,highlight:a}){return e.jsxs("g",{children:[e.jsx("rect",{x:t-120/2,y:s-60/2,width:120,height:60,rx:6,fill:i,stroke:"var(--ink)",strokeWidth:a?3:2}),e.jsx("text",{x:t,y:s-4,textAnchor:"middle",style:{fontFamily:"var(--font-display)",fontSize:13},children:r}),e.jsx("text",{x:t,y:s+14,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:10,fill:"var(--ink-soft)"},children:n})]})}const A={fontFamily:"var(--font-mono)",fontSize:"0.75rem",padding:"0.1rem 0.4rem",lineHeight:1};function K(t,s){return{display:"inline-flex",alignItems:"center",padding:"0.25em 0.55em",border:"1.5px solid var(--ink)",borderRadius:"var(--radius)",background:t?s:"var(--paper)",fontFamily:"var(--font-mono)",fontSize:"0.82rem",cursor:"pointer",userSelect:"none"}}const L={display:"inline-flex",flexDirection:"column",gap:"0.2rem"},R={fontFamily:"var(--font-mono)",fontSize:"0.72rem",color:"var(--ink-soft)",textTransform:"uppercase",letterSpacing:"0.05em"},O={fontFamily:"var(--font-mono)",fontSize:"0.85rem",padding:"0.25rem 0.4rem",border:"1.5px solid var(--ink)",borderRadius:"var(--radius)",background:"var(--paper)"},z=[{id:"splitRW",label:"Separate read and write models"},{id:"audit",label:"Full audit trail of every change"},{id:"timeTravel",label:"Reproduce state at any past point in time"},{id:"tolerate",label:"Tolerate downstream service failure"},{id:"distTx",label:"Cross-service distributed transaction"},{id:"noDualWrite",label:"Reliable publish-after-DB-write (no dual-write bug)"},{id:"decouple",label:"Decouple UI from domain logic"}],X=[{id:"mvc",label:"MVC / MVVM",sub:"Separation of presentation",solves:{decouple:!0},why:"Splits user-facing concerns (View, Controller, Model) so domain logic is not entangled with UI plumbing."},{id:"cqrs",label:"CQRS",sub:"Different models for reads and writes",solves:{splitRW:!0,decouple:!0},why:"Commands and queries take different shapes and scale paths — model them separately instead of forcing one schema to serve both."},{id:"es",label:"Event Sourcing",sub:"Store changes, not state",solves:{audit:!0,timeTravel:!0,splitRW:!0},why:"The append-only event log IS the source of truth. Audit and historical replay come for free; current state is a fold."},{id:"cb",label:"Circuit Breaker",sub:"Fail fast when upstream is broken",solves:{tolerate:!0},why:"Stops calling a failing dependency once errors exceed a threshold, preventing cascading failures across services."},{id:"saga",label:"Saga",sub:"Distributed transaction via compensation",solves:{distTx:!0,tolerate:!0},why:"Long-running cross-service workflow: each step has a compensating action, so you can unwind partial progress without 2PC."},{id:"outbox",label:"Outbox",sub:"Atomic write + reliable publish",solves:{noDualWrite:!0,tolerate:!0},why:"Writes the event row in the same DB transaction as the business state, then a relay publishes — no dual-write window."}];function Z({id:t}){const s="var(--ink)",n={stroke:s,strokeWidth:1.5,fill:"var(--paper-deep)"};switch(t){case"mvc":return e.jsxs("svg",{viewBox:"0 0 80 40",width:"80",height:"40","aria-hidden":"true",children:[e.jsx("rect",{x:"2",y:"12",width:"20",height:"16",rx:"2",...n}),e.jsx("rect",{x:"30",y:"12",width:"20",height:"16",rx:"2",...n}),e.jsx("rect",{x:"58",y:"12",width:"20",height:"16",rx:"2",...n}),e.jsx("line",{x1:"22",y1:"20",x2:"30",y2:"20",stroke:s}),e.jsx("line",{x1:"50",y1:"20",x2:"58",y2:"20",stroke:s})]});case"cqrs":return e.jsxs("svg",{viewBox:"0 0 80 40",width:"80",height:"40","aria-hidden":"true",children:[e.jsx("rect",{x:"2",y:"4",width:"22",height:"14",rx:"2",...n}),e.jsx("rect",{x:"2",y:"22",width:"22",height:"14",rx:"2",...n}),e.jsx("rect",{x:"56",y:"13",width:"22",height:"14",rx:"2",...n}),e.jsx("line",{x1:"24",y1:"11",x2:"56",y2:"20",stroke:s}),e.jsx("line",{x1:"24",y1:"29",x2:"56",y2:"20",stroke:s})]});case"es":return e.jsx("svg",{viewBox:"0 0 80 40",width:"80",height:"40","aria-hidden":"true",children:[0,1,2,3,4].map(i=>e.jsx("rect",{x:2+i*15,y:"14",width:"12",height:"12",rx:"1",...n},i))});case"cb":return e.jsxs("svg",{viewBox:"0 0 80 40",width:"80",height:"40","aria-hidden":"true",children:[e.jsx("circle",{cx:"20",cy:"20",r:"10",...n}),e.jsx("circle",{cx:"60",cy:"20",r:"10",...n}),e.jsx("line",{x1:"30",y1:"20",x2:"44",y2:"20",stroke:s,strokeWidth:"1.5"}),e.jsx("line",{x1:"46",y1:"14",x2:"54",y2:"26",stroke:s,strokeWidth:"2"})]});case"saga":return e.jsxs("svg",{viewBox:"0 0 80 40",width:"80",height:"40","aria-hidden":"true",children:[[0,1,2].map(i=>e.jsx("rect",{x:4+i*26,y:"14",width:"20",height:"12",rx:"2",...n},i)),e.jsx("line",{x1:"24",y1:"20",x2:"30",y2:"20",stroke:s}),e.jsx("line",{x1:"50",y1:"20",x2:"56",y2:"20",stroke:s}),e.jsx("path",{d:"M 70 26 Q 40 38 14 26",fill:"none",stroke:s,strokeDasharray:"3 2"})]});case"outbox":return e.jsxs("svg",{viewBox:"0 0 80 40",width:"80",height:"40","aria-hidden":"true",children:[e.jsx("rect",{x:"2",y:"6",width:"28",height:"12",rx:"2",...n}),e.jsx("rect",{x:"2",y:"22",width:"28",height:"12",rx:"2",fill:"var(--accent)",stroke:s,strokeWidth:"1.5"}),e.jsx("rect",{x:"56",y:"14",width:"22",height:"12",rx:"2",...n}),e.jsx("line",{x1:"30",y1:"28",x2:"56",y2:"20",stroke:s})]});default:return null}}function ee(t,s){if(s.size===0)return 0;let r=0;for(const n of s)t.solves[n]&&r++;return r}function te(){var d;const[t,s]=h.useState(()=>new Set);function r(o){s(p=>{const g=new Set(p);return g.has(o)?g.delete(o):g.add(o),g})}function n(){s(new Set)}const i=h.useMemo(()=>X.map(p=>({...p,score:ee(p,t)})).map((p,g)=>({...p,_orig:g})).sort((p,g)=>g.score-p.score||p._orig-g._orig),[t]),a=((d=i[0])==null?void 0:d.score)??0,u=t.size>0&&a>0,c=t.size;return e.jsxs("div",{className:"widget",children:[e.jsx("div",{className:"widget-title",children:"Pick your problems — find the pattern"}),e.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"0.82rem",color:"var(--ink-soft)",marginBottom:"0.5rem"},children:"Check the architectural problems you actually have. Patterns re-rank by how many they solve."}),e.jsx("div",{className:"controls",style:{flexWrap:"wrap",gap:"0.4rem"},children:z.map(o=>{const p=t.has(o.id);return e.jsxs("button",{className:`btn ${p?"btn-accent":""}`,onClick:()=>r(o.id),style:{fontSize:"0.82rem"},"aria-pressed":p,children:[e.jsxs("span",{style:{fontFamily:"var(--font-mono)",marginRight:"0.4em"},children:["[",p?"x":" ","]"]}),o.label]},o.id)})}),e.jsxs("div",{className:"controls",children:[e.jsx("button",{className:"btn btn-ghost",onClick:n,disabled:c===0,children:"Clear"}),e.jsx("span",{style:{marginLeft:"auto",fontFamily:"var(--font-mono)",color:"var(--ink-soft)",fontSize:"0.85rem"},children:c===0?"No requirements — neutral ranking":`${c} requirement${c===1?"":"s"} checked`})]}),e.jsx("div",{className:"widget-stage",style:{minHeight:320,padding:"0.6rem"},children:e.jsx(x.div,{layout:!0,style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))",gap:"0.7rem"},children:e.jsx(F,{initial:!1,children:i.map((o,p)=>{const g=u&&p===0&&o.score===a,w=t.size>0&&o.score===0;return e.jsxs(x.div,{layout:!0,initial:{opacity:0,y:8},animate:{opacity:w?.55:1,y:0},exit:{opacity:0},transition:{type:"spring",stiffness:260,damping:26},style:{border:`2.5px solid ${g?"var(--accent)":"var(--ink)"}`,borderRadius:"var(--radius)",background:"var(--paper)",padding:"0.7rem 0.8rem",boxShadow:g?"4px 4px 0 var(--accent)":"3px 3px 0 var(--ink)",position:"relative"},children:[g&&e.jsx("span",{className:"badge",style:{position:"absolute",top:-12,right:10,background:"var(--accent)",color:"white",borderColor:"var(--accent)"},children:"Top match"}),e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"0.5rem"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.04em"},children:o.label}),e.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"0.75rem",color:"var(--ink-soft)"},children:o.sub})]}),e.jsx(Z,{id:o.id})]}),e.jsxs("div",{style:{display:"flex",alignItems:"baseline",gap:"0.5rem",margin:"0.45rem 0 0.4rem"},children:[e.jsx("span",{style:{fontFamily:"var(--font-mono)",fontSize:"0.7rem",color:"var(--ink-soft)",letterSpacing:"0.1em",textTransform:"uppercase"},children:"Match"}),e.jsx("span",{style:{fontFamily:"var(--font-display)",fontSize:"1.3rem",color:g?"var(--accent)":"var(--ink)"},children:o.score}),e.jsxs("span",{style:{fontFamily:"var(--font-mono)",fontSize:"0.78rem",color:"var(--ink-soft)"},children:["/ ",c||z.length]})]}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.25rem",marginBottom:"0.4rem"},children:z.map(l=>{const m=!!o.solves[l.id],b=t.has(l.id),k=m&&b,v=m&&!b;return e.jsxs("span",{className:`badge ${k?"live":""}`,title:l.label,style:{fontSize:"0.62rem",margin:0,opacity:v?.85:m?1:.35,borderStyle:m?"solid":"dashed"},children:[e.jsx("span",{style:{marginRight:"0.3em",fontWeight:700},children:m?"yes":"no"}),se(l.id)]},l.id)})}),g&&e.jsxs("div",{style:{fontSize:"0.83rem",color:"var(--ink)",borderTop:"1.5px dashed var(--ink-soft)",paddingTop:"0.4rem",marginTop:"0.2rem"},children:[e.jsx("span",{style:{fontFamily:"var(--font-mono)",fontSize:"0.68rem",color:"var(--ink-soft)",letterSpacing:"0.1em",textTransform:"uppercase",marginRight:"0.4em"},children:"Why"}),o.why]})]},o.id)})})})}),e.jsx("div",{className:"callout",children:c===0?e.jsx(e.Fragment,{children:"Tick one or more problems above. The patterns reorder live — the closest match floats to the top with a short explanation of why."}):a===0?e.jsx(e.Fragment,{children:"None of these six patterns directly addresses the boxes you ticked. Combine with patterns from earlier lessons (Strategy, Observer, Repository) — or reconsider whether the requirement is real."}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:i[0].label})," covers ",a," of your ",c," checked requirement",c===1?"":"s",". Real systems usually stack patterns — e.g. ",e.jsx("em",{children:"CQRS + Event Sourcing + Outbox"})," together — rather than picking one."]})})]})}function se(t){switch(t){case"splitRW":return"split R/W";case"audit":return"audit";case"timeTravel":return"time-travel";case"tolerate":return"tolerate fail";case"distTx":return"dist. tx";case"noDualWrite":return"no dual-write";case"decouple":return"decouple UI";default:return t}}const f=[{problem:"You need to support sorting users by name, age, or signup date — and add more orderings later without touching the sort function.",options:["Strategy","Singleton","Observer"],correct:"Strategy",why:"Each ordering is an interchangeable algorithm behind a common interface. <code>sort(users, byName)</code>, <code>sort(users, byAge)</code>. Adding a new ordering = a new strategy, no edits to <code>sort</code>."},{problem:"When a chat message arrives, you need to update the unread badge, the notification dropdown, and the page title — and other parts of the app should be able to react too.",options:["Decorator","Observer","Factory"],correct:"Observer",why:"The subject (message-received) emits an event. Each interested component subscribes. Adding a new reactor = subscribe; the subject doesn't know or care."},{problem:"Different image formats (PNG, JPEG, WebP) need to be loaded — the caller shouldn't care which format, just hand back a Image object.",options:["Factory","Adapter","Observer"],correct:"Factory",why:"The Factory picks the right concrete class based on the input. The caller is shielded from the if/else over file extensions."},{problem:"Your code uses a payment gateway with method <code>charge(amountCents)</code>. You're switching to a new provider whose method is <code>process({total, currency})</code>. You don't want to rewrite every caller.",options:["Adapter","Strategy","Singleton"],correct:"Adapter",why:"Wrap the new provider in a class that exposes the old <code>charge(amountCents)</code> signature. Callers stay; the adapter translates calls under the hood."},{problem:"A request to a flaky external API: sometimes it's up, sometimes it's timing out. You want to stop hammering it after several failures and let it recover.",options:["Observer","Circuit Breaker","Decorator"],correct:"Circuit Breaker",why:'Track failure rate; after a threshold, "trip" the breaker — calls fail fast for a cool-off window before testing the upstream again. Modern resilience pattern, not in GoF.'},{problem:"You need a centralized logger that all parts of the app use, with config loaded once at startup. But the tests want to substitute a fake logger.",options:["Singleton","Dependency Injection","Factory"],correct:"Dependency Injection",why:"Singleton makes testing painful (global state). DI passes the logger in explicitly — production wires the real one; tests pass a fake. Same shared logger, no global."}];function re(t){const s=new Array(f.length).fill(null);let r=0;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Problem ${r+1} of ${f.length}</div>

      <div id="qz-content"></div>

      <div class="controls">
        <button class="btn" id="qz-prev">← Back</button>
        <button class="btn btn-accent" id="qz-next">Next →</button>
        <button class="btn btn-ghost" id="qz-reset">Reset</button>
        <span style="margin-left: auto; font-family: var(--font-mono);" id="qz-score">Score: 0/${f.length}</span>
      </div>
    </div>
  `,t.querySelector("#qz-prev").addEventListener("click",()=>{r>0&&r--,n()}),t.querySelector("#qz-next").addEventListener("click",()=>{r<f.length-1&&r++,n()}),t.querySelector("#qz-reset").addEventListener("click",()=>{s.fill(null),r=0,n()});function n(){const a=f[r],u=s[r],c=t.querySelector("#qz-content");c.innerHTML=`
      <div class="qz-problem">${i(a.problem)}</div>
      <div class="qz-options">
        ${a.options.map(o=>`
          <button class="qz-opt ${u===o?o===a.correct?"right":"wrong":""}" data-opt="${i(o)}" ${u!==null?"disabled":""}>${o}</button>
        `).join("")}
      </div>
      ${u?`<div class="qz-why ${u===a.correct?"right":"wrong"}">${u===a.correct?"✅ Right.":`❌ The intended answer was <strong>${a.correct}</strong>.`} ${a.why}</div>`:""}

      <style>
        .qz-problem { font-size: 1.02rem; margin: 0.6rem 0 0.8rem; padding: 0.6rem 0.8rem; background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); }
        .qz-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.5rem; margin-bottom: 0.6rem; }
        .qz-opt { padding: 0.6rem 0.9rem; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper); cursor: pointer; font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.04em; box-shadow: 3px 3px 0 var(--ink); }
        .qz-opt:hover:not(:disabled) { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--ink); }
        .qz-opt:disabled { cursor: default; }
        .qz-opt.right { background: #d6f5d6; }
        .qz-opt.wrong { background: #f7c8c8; }
        .qz-why { padding: 0.7rem 0.9rem; border: 2px solid var(--ink); border-radius: var(--radius); }
        .qz-why.right { background: #d6f5d6; box-shadow: 3px 3px 0 #2a8a3e; }
        .qz-why.wrong { background: var(--accent-soft); box-shadow: 3px 3px 0 var(--accent); }
      </style>
    `,c.querySelectorAll(".qz-opt").forEach(o=>o.addEventListener("click",()=>{s[r]=o.dataset.opt,n()})),t.querySelector(".widget-title").textContent=`Problem ${r+1} of ${f.length}`;const d=s.reduce((o,p,g)=>o+(p===f[g].correct?1:0),0);t.querySelector("#qz-score").textContent=`Score: ${d}/${f.length}`}function i(a){return String(a).replace(/[&<>"']/g,u=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[u])}n()}const ae=[{name:"Aiko",age:29,signup:"2024-01-15"},{name:"Mateo",age:41,signup:"2023-11-02"},{name:"Priya",age:34,signup:"2025-03-08"},{name:"Kenji",age:22,signup:"2024-06-21"},{name:"Lena",age:37,signup:"2024-12-30"}],W={name:{label:"by name",fn:(t,s)=>t.name.localeCompare(s.name)},age:{label:"by age",fn:(t,s)=>t.age-s.age},signup:{label:"by signup (new→old)",fn:(t,s)=>s.signup.localeCompare(t.signup)}},ne=`function sort(users, order) {
  if (order === 'name') {
    return users.sort((a, b) => a.name.localeCompare(b.name));
  } else if (order === 'age') {
    return users.sort((a, b) => a.age - b.age);
  } else if (order === 'signup') {
    return users.sort((a, b) =>
      b.signup.localeCompare(a.signup));
  }
  // Adding a new order = edit this function.
}

sort(users, 'age');`,ie=`// Strategy is just a function/object you pass in.
const byName   = (a, b) => a.name.localeCompare(b.name);
const byAge    = (a, b) => a.age - b.age;
const bySignup = (a, b) =>
  b.signup.localeCompare(a.signup);

function sort(users, strategy) {
  return users.slice().sort(strategy);
}

sort(users, byAge);

// Adding a new ordering = a new function.
// sort() never changes.`;function oe(t){let s="name";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Same data, three orderings</div>

      <div class="controls">
        <label>Strategy:</label>
        <div class="pill-group">
          ${Object.entries(W).map(([i,a],u)=>`
            <input type="radio" name="st-s" id="st-${i}" value="${i}" ${u===0?"checked":""}>
            <label for="st-${i}">${a.label}</label>
          `).join("")}
        </div>
      </div>

      <div class="widget-stage" id="st-stage" style="min-height: 180px;"></div>

      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Without strategy (hardcoded if/else)</div>
          <pre>${n(ne)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ With strategy (function passed in)</div>
          <pre>${n(ie)}</pre>
        </div>
      </div>
    </div>
  `,t.querySelectorAll("input[name=st-s]").forEach(i=>i.addEventListener("change",a=>{s=a.target.value,r()}));function r(){const i=ae.slice().sort(W[s].fn),a=t.querySelector("#st-stage");a.innerHTML=`
      <table class="st-table">
        <thead><tr><th>name</th><th>age</th><th>signup</th></tr></thead>
        <tbody>
          ${i.map(u=>`<tr><td>${n(u.name)}</td><td>${u.age}</td><td>${u.signup}</td></tr>`).join("")}
        </tbody>
      </table>
      <style>
        .st-table { width: 100%; border-collapse: collapse; }
        .st-table th, .st-table td { padding: 0.3em 0.8em; border: 1.5px solid var(--ink); font-family: var(--font-mono); font-size: 0.85rem; }
        .st-table th { background: var(--paper-deep); font-family: var(--font-display); letter-spacing: 0.04em; font-weight: 400; font-size: 0.78rem; }
      </style>
    `}function n(i){return String(i).replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}r()}const le=`// Publisher knows every reactor by name.
function onMessageArrived(msg) {
  updateBadge(unread + 1);
  appendToDropdown(msg);
  document.title = "(" + unread + ") inbox";
  pushNotification(msg);
  // Add a new reactor → edit this function.
}`,de=`class EventBus {
  subscribers = new Map();
  on(evt, fn) {
    if (!this.subscribers.has(evt)) this.subscribers.set(evt, []);
    this.subscribers.get(evt).push(fn);
  }
  emit(evt, payload) {
    (this.subscribers.get(evt) ?? []).forEach(fn => fn(payload));
  }
}

const bus = new EventBus();
bus.on('message-arrived', updateBadge);
bus.on('message-arrived', appendToDropdown);
bus.on('message-arrived', updateTitle);

// Adding a new reactor:
bus.on('message-arrived', archiveToDisk);  // done.

// Publishing:
bus.emit('message-arrived', { from: 'Aiko', text: 'hi' });`,D=[{id:"badge",label:"Badge",icon:"🔴",describe:t=>`unread = ${t}`},{id:"dropdown",label:"Dropdown",icon:"📥",describe:(t,s)=>s?`last: "${s.text}" from ${s.from}`:"empty"},{id:"title",label:"Page title",icon:"🪟",describe:t=>`(${t}) inbox · X-sensei`}],N=["Aiko","Mateo","Priya","Kenji","Lena","Diego","Yuna","Omar"],B=["hello!","are you free?","lunch?","fyi: ship today","lol","wow","thanks!","lmk"];function ce(t){const s={unread:0,last:null,enabled:{badge:!0,dropdown:!0,title:!0},log:[]};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">message-arrived event</div>

      <div class="controls">
        <strong>Subscribers:</strong>
        ${D.map(i=>`<label><input type="checkbox" data-obs="${i.id}" checked> ${i.icon} ${i.label}</label>`).join("  ")}
      </div>

      <div class="controls">
        <button class="btn btn-accent" id="ob-publish">Publish "message-arrived"</button>
        <button class="btn btn-ghost" id="ob-reset">Reset</button>
      </div>

      <div class="widget-stage" id="ob-stage" style="min-height: 200px;"></div>

      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Without observer (publisher knows everyone)</div>
          <pre>${n(le)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ With observer (loose coupling)</div>
          <pre>${n(de)}</pre>
        </div>
      </div>
    </div>
  `,t.querySelectorAll("input[data-obs]").forEach(i=>i.addEventListener("change",a=>{s.enabled[a.target.dataset.obs]=a.target.checked,r()})),t.querySelector("#ob-publish").addEventListener("click",()=>{const i={from:N[Math.floor(Math.random()*N.length)],text:B[Math.floor(Math.random()*B.length)]};s.unread+=1,s.last=i,s.log.unshift(`publish: { from: "${i.from}", text: "${i.text}" }`),s.log.length>6&&(s.log.length=6),r(i)}),t.querySelector("#ob-reset").addEventListener("click",()=>{s.unread=0,s.last=null,s.log=[],Object.keys(s.enabled).forEach(i=>s.enabled[i]=!0),t.querySelectorAll("input[data-obs]").forEach(i=>i.checked=!0),r()});function r(i){let a='<div class="ob-stage">';a+='<div class="ob-pub"><div class="ob-pub-icon">📨</div><div class="ob-pub-name">SUBJECT<br><small>message-arrived</small></div></div>',a+='<div class="ob-obs">',D.forEach(u=>{const c=s.enabled[u.id];a+=`<div class="ob-sub ${c?"active":"mute"} ${i&&c?"just-fired":""}">
        <div class="ob-sub-icon">${u.icon}</div>
        <div class="ob-sub-name">${u.label}</div>
        <div class="ob-sub-state">${c?n(u.describe(s.unread,s.last)):"(unsubscribed)"}</div>
      </div>`}),a+="</div></div>",a+=`<div class="ob-log">${s.log.map(u=>`<div>${n(u)}</div>`).join("")||'<span style="color: var(--ink-faint);">no events yet</span>'}</div>`,a+=`<style>
      .ob-stage { display: grid; grid-template-columns: 200px 1fr; gap: 0.8rem; align-items: center; margin-bottom: 0.6rem; }
      .ob-pub { background: var(--accent); color: white; border: 2.5px solid var(--ink); border-radius: var(--radius); padding: 0.7rem; text-align: center; box-shadow: 4px 4px 0 var(--ink); }
      .ob-pub-icon { font-size: 2rem; }
      .ob-pub-name { font-family: var(--font-display); letter-spacing: 1.5px; }
      .ob-pub-name small { font-family: var(--font-mono); letter-spacing: 0; font-size: 0.7rem; }
      .ob-obs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; }
      .ob-sub { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem; text-align: center; transition: transform 0.2s, box-shadow 0.2s; }
      .ob-sub.active { background: #c8f0c8; }
      .ob-sub.mute { opacity: 0.4; }
      .ob-sub.just-fired { transform: translateY(-4px); box-shadow: 4px 6px 0 var(--accent); }
      .ob-sub-icon { font-size: 1.6rem; }
      .ob-sub-name { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.9rem; }
      .ob-sub-state { font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-soft); }
      .ob-log { background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 0.4rem 0.6rem; font-family: var(--font-mono); font-size: 0.78rem; max-height: 110px; overflow-y: auto; }
      @media (max-width: 640px) { .ob-stage { grid-template-columns: 1fr; } .ob-obs { grid-template-columns: 1fr; } }
    </style>`,t.querySelector("#ob-stage").innerHTML=a}function n(i){return String(i).replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}r()}const ue=`// Caller switches on every type. Adding a format = edit here.
function loadImage(path) {
  if (path.endsWith('.png'))  return new PngImage(path);
  if (path.endsWith('.jpeg') || path.endsWith('.jpg'))
                              return new JpegImage(path);
  if (path.endsWith('.webp')) return new WebpImage(path);
  throw new Error('unknown format');
}

const img = loadImage("logo.webp");`,pe=`class ImageFactory {
  static registry = new Map();
  static register(ext, cls) { ImageFactory.registry.set(ext, cls); }
  static from(path) {
    const ext = path.split('.').pop();
    const Cls = ImageFactory.registry.get(ext);
    if (!Cls) throw new Error('unknown format: ' + ext);
    return new Cls(path);
  }
}

ImageFactory.register('png', PngImage);
ImageFactory.register('jpg', JpegImage);
ImageFactory.register('jpeg', JpegImage);
ImageFactory.register('webp', WebpImage);
// New format = ImageFactory.register('avif', AvifImage)

const img = ImageFactory.from("logo.webp");`,ge=`// 7-argument constructor — readable? no.
new HttpRequest(
  'POST',
  '/api/users',
  { 'Content-Type': 'application/json' },
  '{"name":"Aiko"}',
  30000,
  3,
  true);`,me=`// Fluent builder — each step is named.
const req = new HttpRequestBuilder()
  .method('POST')
  .url('/api/users')
  .header('Content-Type', 'application/json')
  .body('{"name":"Aiko"}')
  .timeout(30000)
  .retries(3)
  .followRedirects(true)
  .build();  // validates: all required fields set`;function he(t){let s="factory";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Two patterns for "how do I create this?"</div>

      <div class="controls">
        <div class="pill-group">
          <input type="radio" name="fb-tab" id="fb-factory" value="factory" checked>
          <label for="fb-factory">Factory</label>
          <input type="radio" name="fb-tab" id="fb-builder" value="builder">
          <label for="fb-builder">Builder</label>
        </div>
      </div>

      <div id="fb-content"></div>
    </div>
  `,t.querySelectorAll("input[name=fb-tab]").forEach(c=>c.addEventListener("change",d=>{s=d.target.value,r()}));function r(){const c=t.querySelector("#fb-content");s==="factory"?(c.innerHTML=`
        <div class="widget-stage" id="fb-stage">${n()}</div>
        <div class="dp-grid">
          <div class="dp-side bad">
            <div class="dp-side-label">⚠ Caller switches on type</div>
            <pre>${u(ue)}</pre>
          </div>
          <div class="dp-side good">
            <div class="dp-side-label">✓ Factory hides the choice</div>
            <pre>${u(pe)}</pre>
          </div>
        </div>
      `,c.querySelectorAll("button[data-load]").forEach(d=>d.addEventListener("click",()=>a(d.dataset.load,d.closest(".widget-stage"))))):c.innerHTML=`
        <div class="widget-stage" id="fb-stage">${i()}</div>
        <div class="dp-grid">
          <div class="dp-side bad">
            <div class="dp-side-label">⚠ Long constructor</div>
            <pre>${u(ge)}</pre>
          </div>
          <div class="dp-side good">
            <div class="dp-side-label">✓ Fluent builder</div>
            <pre>${u(me)}</pre>
          </div>
        </div>
      `}function n(){return`
      <div style="text-align: center;">
        <div style="margin-bottom: 0.5rem; font-family: var(--font-mono); font-size: 0.85rem;">Call <code>ImageFactory.from(path)</code> — it picks the right class.</div>
        <div style="display: flex; gap: 0.4rem; justify-content: center; flex-wrap: wrap;">
          <button class="btn" data-load="logo.png">.png</button>
          <button class="btn" data-load="photo.jpeg">.jpeg</button>
          <button class="btn" data-load="anim.webp">.webp</button>
          <button class="btn" data-load="weird.tiff">.tiff (unknown)</button>
        </div>
        <div id="fb-output" style="margin-top: 0.8rem; min-height: 60px; font-family: var(--font-mono); font-size: 0.85rem; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem;">(click a button)</div>
      </div>
    `}function i(){return`
      <div>
        <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 0.5rem;">Hover the fluent chain — each step adds a piece. Final <code>build()</code> validates required fields.</div>
        <div style="font-family: var(--font-mono); font-size: 0.85rem; background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem;">
          <span class="fb-step">new HttpRequestBuilder()</span><br>
          <span class="fb-step">&nbsp;&nbsp;.method('POST')</span> <span class="fb-comment">→ sets verb</span><br>
          <span class="fb-step">&nbsp;&nbsp;.url('/api/users')</span> <span class="fb-comment">→ sets path</span><br>
          <span class="fb-step">&nbsp;&nbsp;.header('Content-Type', 'application/json')</span> <span class="fb-comment">→ adds header</span><br>
          <span class="fb-step">&nbsp;&nbsp;.body('{"name":"Aiko"}')</span> <span class="fb-comment">→ sets body</span><br>
          <span class="fb-step">&nbsp;&nbsp;.timeout(30000)</span> <span class="fb-comment">→ optional</span><br>
          <span class="fb-step">&nbsp;&nbsp;.retries(3)</span> <span class="fb-comment">→ optional</span><br>
          <span class="fb-step">&nbsp;&nbsp;.build();</span> <span class="fb-comment">→ validates &amp; returns HttpRequest</span>
        </div>
        <style>
          .fb-step:hover { background: var(--accent-soft); }
          .fb-comment { color: var(--ink-soft); font-style: italic; }
        </style>
      </div>
    `}function a(c,d){const o=d.querySelector("#fb-output"),p=c.split(".").pop(),g={png:"PngImage",jpg:"JpegImage",jpeg:"JpegImage",webp:"WebpImage"};g[p]?o.innerHTML=`→ <code>ImageFactory.from("${c}")</code> returned <strong>${g[p]}</strong> instance. Caller never had to know the format.`:o.innerHTML=`<span style="color: var(--accent);">→ <code>ImageFactory.from("${c}")</code> threw "unknown format: ${p}". Register a handler with <code>ImageFactory.register('${p}', ...)</code>.</span>`}function u(c){return String(c).replace(/[&<>"']/g,d=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[d])}r()}const be=`class Logger {
  static instance = null;
  static get() {
    if (!Logger.instance) Logger.instance = new Logger();
    return Logger.instance;
  }
  messages = [];
  log(m) { this.messages.push(m); }
}

class UserService {
  createUser(name) {
    Logger.get().log("created " + name);   // hidden dependency
    return { name };
  }
}

// In tests:
test("creates user", () => {
  new UserService().createUser("Aiko");
  // ⚠ how do we verify the log? Singleton state from
  //   prior tests is already in messages.
});`,fe=`class UserService {
  constructor(logger) { this.logger = logger; }  // explicit
  createUser(name) {
    this.logger.log("created " + name);
    return { name };
  }
}

// In tests:
test("creates user, logs it", () => {
  const fakeLogger = { messages: [], log(m) { this.messages.push(m); } };
  new UserService(fakeLogger).createUser("Aiko");
  expect(fakeLogger.messages).toEqual(["created Aiko"]);
  // ✓ test owns its dependencies. No global state.
});`;function ve(t){const s={messages:[]},r=[],n=[];t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Tests, run twice</div>

      <div class="controls">
        <button class="btn btn-accent" id="sd-run-s">Run 3 tests (Singleton)</button>
        <button class="btn btn-accent" id="sd-run-d">Run 3 tests (DI)</button>
        <button class="btn btn-ghost" id="sd-reset">Reset</button>
      </div>

      <div class="widget-stage" id="sd-stage"></div>

      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Singleton (hidden global)</div>
          <pre>${c(be)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ DI (explicit)</div>
          <pre>${c(fe)}</pre>
        </div>
      </div>
    </div>
  `,t.querySelector("#sd-run-s").addEventListener("click",i),t.querySelector("#sd-run-d").addEventListener("click",a),t.querySelector("#sd-reset").addEventListener("click",()=>{s.messages=[],n.length=0,r.length=0,u()});function i(){s.messages.push("created Aiko");const d=s.messages.length===1;n.push({name:"creates Aiko, logs once",pass:d,note:d?"✅ but only because this is the first test":"❌ shared state from previous test"}),s.messages.push("created Bob");const o=s.messages.length===1;n.push({name:"creates Bob, logs once",pass:o,note:"❌ messages now has 2 entries — leftover from test 1"}),s.messages.push("created Cara");const p=s.messages.length===1;n.push({name:"creates Cara, logs once",pass:p,note:"❌ messages now has 3 entries"}),u()}function a(){[["Aiko"],["Bob"],["Cara"]].forEach(([d])=>{const o={messages:[]};o.messages.push("created "+d);const p=o.messages.length===1;r.push({name:`creates ${d}, logs once`,pass:p,note:"✅ fresh logger, isolated"})}),u()}function u(){let d='<div class="sd-grid">';d+='<div class="sd-panel"><div class="sd-panel-label">SINGLETON TESTS</div>',n.length===0?d+='<div class="sd-empty">(not run)</div>':n.forEach(o=>{d+=`<div class="sd-test ${o.pass?"pass":"fail"}">${o.pass?"✓":"✗"} ${c(o.name)} <span class="sd-note">${o.note}</span></div>`}),d+="</div>",d+='<div class="sd-panel"><div class="sd-panel-label">DI TESTS</div>',r.length===0?d+='<div class="sd-empty">(not run)</div>':r.forEach(o=>{d+=`<div class="sd-test ${o.pass?"pass":"fail"}">${o.pass?"✓":"✗"} ${c(o.name)} <span class="sd-note">${o.note}</span></div>`}),d+="</div></div>",d+=`<style>
      .sd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.6rem; }
      .sd-panel { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; }
      .sd-panel-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.85rem; margin-bottom: 0.4em; }
      .sd-test { font-family: var(--font-mono); font-size: 0.8rem; padding: 0.2em 0.4em; margin: 0.12em 0; border-left: 3px solid; border-radius: 2px; }
      .sd-test.pass { background: #d6f5d6; border-left-color: #2a8a3e; }
      .sd-test.fail { background: var(--accent-soft); border-left-color: var(--accent); }
      .sd-note { color: var(--ink-soft); margin-left: 0.4em; }
      .sd-empty { font-family: var(--font-mono); color: var(--ink-faint); font-size: 0.85rem; }
      @media (max-width: 720px) { .sd-grid { grid-template-columns: 1fr; } }
    </style>`,t.querySelector("#sd-stage").innerHTML=d}function c(d){return String(d).replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}u()}const ye=`// business logic writes SQL directly
async function createOrder(userId, items) {
  await db.query(
    "INSERT INTO orders (user_id, status) VALUES (?, ?)",
    [userId, 'open']);
  const orderId = db.lastId();
  for (const it of items) {
    await db.query(
      "INSERT INTO order_items (order_id, product_id, qty) VALUES (?, ?, ?)",
      [orderId, it.productId, it.qty]);
  }
  await db.query(
    "UPDATE users SET last_order_at = NOW() WHERE id = ?",
    [userId]);
  // 3 separate transactions; what if one fails?
}`,xe=`// business logic talks to repositories + UoW
async function createOrder(userId, items, uow) {
  const user = await uow.users.byId(userId);
  const order = new Order(user, 'open');
  for (const it of items) order.addItem(it.productId, it.qty);
  uow.orders.add(order);
  user.recordOrderPlaced();   // updates last_order_at in memory
  // nothing persisted yet — all in the UoW's change list
}

// At the boundary:
const uow = new UnitOfWork(db);
await createOrder(userId, items, uow);
await uow.commit();   // one transaction; all-or-nothing`;function we(t){const s={changes:[],committed:!1};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Build up changes, then commit (or rollback)</div>

      <div class="controls">
        <button class="btn" id="uw-add-order">orders.add(Order(...))</button>
        <button class="btn" id="uw-add-item">order.addItem(productId, qty)</button>
        <button class="btn" id="uw-update-user">user.recordOrderPlaced()</button>
        <button class="btn btn-accent" id="uw-commit">uow.commit()</button>
        <button class="btn" id="uw-rollback">uow.rollback()</button>
        <button class="btn btn-ghost" id="uw-reset">Reset</button>
      </div>

      <div class="widget-stage" id="uw-stage" style="min-height: 200px;"></div>

      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Without Repository/UoW</div>
          <pre>${u(ye)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ With Repository + UoW</div>
          <pre>${u(xe)}</pre>
        </div>
      </div>
    </div>
  `,t.querySelector("#uw-add-order").addEventListener("click",()=>r("INSERT","orders",'new Order(user, "open")')),t.querySelector("#uw-add-item").addEventListener("click",()=>r("INSERT","order_items","product_id=42, qty=2")),t.querySelector("#uw-update-user").addEventListener("click",()=>r("UPDATE","users","last_order_at=NOW()")),t.querySelector("#uw-commit").addEventListener("click",n),t.querySelector("#uw-rollback").addEventListener("click",i),t.querySelector("#uw-reset").addEventListener("click",()=>{s.changes=[],s.committed=!1,a()});function r(c,d,o){s.committed||(s.changes.push({op:c,table:d,detail:o}),a())}function n(){s.changes.length&&(s.committed=!0,a())}function i(){s.changes=[],s.committed=!1,a()}function a(){let c=`
      <div class="uw-header">
        <strong>Unit of Work change list</strong> — ${s.changes.length} pending operation(s)
        ${s.committed?'<span class="uw-tag commit">✓ COMMITTED</span>':""}
      </div>
      <div class="uw-changes">
        ${s.changes.length===0?'<div class="uw-empty">(no changes yet)</div>':s.changes.map((d,o)=>`<div class="uw-change">${String(o+1).padStart(2,"0")}. <span class="uw-op">${d.op}</span> <code>${u(d.table)}</code> — ${u(d.detail)}</div>`).join("")}
      </div>
      <div class="uw-note">
        ${s.committed?"All operations sent to the database in <strong>one</strong> transaction. If any one failed, none would have been applied.":s.changes.length?"Nothing has been written to the database yet. The UoW tracks the changes; <code>commit()</code> sends them all at once.":"Click some operations above to build up a pending changeset."}
      </div>
      <style>
        .uw-header { font-family: var(--font-mono); font-size: 0.9rem; margin-bottom: 0.4rem; }
        .uw-tag { background: #2a8a3e; color: white; padding: 0.15em 0.5em; border-radius: 2px; font-family: var(--font-display); letter-spacing: 1px; font-size: 0.7rem; margin-left: 0.5em; }
        .uw-changes { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; min-height: 60px; margin-bottom: 0.4rem; }
        .uw-change { font-family: var(--font-mono); font-size: 0.78rem; padding: 0.18em 0; }
        .uw-op { display: inline-block; font-family: var(--font-mono); font-size: 0.7rem; padding: 0.05em 0.4em; background: var(--accent); color: white; border-radius: 2px; }
        .uw-empty { color: var(--ink-faint); font-family: var(--font-mono); font-size: 0.85rem; }
        .uw-note { font-size: 0.88rem; padding: 0.4rem 0.6rem; background: var(--paper); border: 1.5px solid var(--ink); border-radius: var(--radius); }
      </style>
    `;t.querySelector("#uw-stage").innerHTML=c}function u(c){return String(c).replace(/[&<>"']/g,d=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[d])}a()}const y=t=>()=>e.jsx(P,{init:t}),Te={slug:"design-patterns",title:"Design Patterns",intro:e.jsx(e.Fragment,{children:"Eight lessons covering the patterns worth knowing — GoF classics where they still earn their keep, plus the modern architectural patterns the original book never saw coming."}),lessons:[{slug:"what-is-a-pattern",number:"01",title:"What is a Pattern?",blurb:'GoF history, modern view, and why some "patterns" became language features.',Widget:y(re),intro:e.jsx(e.Fragment,{children:"A pattern is a name for a solution to a recurring problem. Half of the original GoF patterns are language features in modern languages — the rest still ship code."}),sections:[],takeaways:["Patterns are vocabulary, not laws. Use them when they fit, not because the book said so.","Many GoF patterns (Iterator, Command) are language built-ins now.","The patterns that survived (Strategy, Observer, Factory) describe runtime behavior, not syntax.","Modern architectures stack patterns: CQRS + Event Sourcing + Saga is a coherent design."]},{slug:"strategy",number:"02",title:"Strategy",blurb:"Interchangeable algorithms behind a common interface.",Widget:y(oe),intro:e.jsx(e.Fragment,{children:"Multiple ways to do the same job — sorting, paying, compressing — behind one interface. Pick the algorithm at runtime, swap freely."}),sections:[],takeaways:["Decouples the algorithm from the code that uses it.","Test each strategy in isolation.","Often replaces a long if/else chain selecting behavior.","In functional languages: just pass a function."]},{slug:"observer",number:"03",title:"Observer & Pub-Sub",blurb:"The pattern behind every event system: subjects notify subscribers.",Widget:y(ce),intro:e.jsx(e.Fragment,{children:"The subject doesn\\'t know who\\'s listening. Subscribers register, unregister, and react to events independently."}),sections:[],takeaways:["Decouples producer from consumer.","addEventListener in browsers, Subjects in RxJS, signals in Solid/Preact.","Risk: memory leaks if you forget to unsubscribe.","Pub-Sub adds a broker between publisher and subscriber."]},{slug:"factory-builder",number:"04",title:"Factory & Builder",blurb:"When `new` isn't enough.",Widget:y(he),intro:e.jsx(e.Fragment,{children:"Factories decide what concrete type to construct; Builders compose objects step-by-step when they have many fields."}),sections:[],takeaways:["Factory: input → object of some interface. Hide the concrete type.","Builder: chain calls to assemble a complex object. Often immutable.","Both let you swap the construction logic without changing callers.","In JS: a function returning an object is already a factory."]},{slug:"decorator-adapter",number:"05",title:"Decorator & Adapter",blurb:"Wrapping existing things.",Widget:Q,intro:e.jsx(e.Fragment,{children:"Decorator adds behavior to an existing object without changing it. Adapter changes the shape of an interface so two parts can talk."}),sections:[],takeaways:["Decorator: same interface, extra behavior. Logging, caching, retry wrappers.","Adapter: incompatible interface → expected interface. Translation layer.","Both compose cleanly — wrap an Adapter in a Decorator in a Decorator.","Higher-order functions in functional languages do both."]},{slug:"singleton-di",number:"06",title:"Singleton & Dependency Injection",blurb:"The controversy and the modern alternative.",Widget:y(ve),intro:e.jsx(e.Fragment,{children:"Singleton: one global instance forever. Convenient, until you need to test it. DI: pass dependencies in instead of reaching for them. Same goal, far better testability."}),sections:[],takeaways:["Singleton makes testing miserable — you can't swap the instance.","DI containers (Spring, Angular) automate dependency wiring.",'Plain "pass it as a parameter" is often enough.','The "Singleton" is usually misused — most use cases want a single configured instance, not a global mutable state.']},{slug:"repository-uow",number:"07",title:"Repository & Unit of Work",blurb:"Data-access patterns.",Widget:y(we),intro:e.jsx(e.Fragment,{children:"Repository abstracts data access — caller doesn\\'t know if it\\'s SQL, NoSQL, or in-memory. Unit of Work batches changes for atomic commit."}),sections:[],takeaways:['Repository: interface for "get/save entity by ID" — implementations vary.',"Unit of Work: collect mutations, commit them together.",'Together they let "business logic" be tested without a real database.',"Most ORMs (Entity Framework, SQLAlchemy, ActiveRecord) bake this in."]},{slug:"modern-architecture",number:"08",title:"Modern Architecture Patterns",blurb:"MVC / MVVM, CQRS, Event Sourcing, Circuit Breaker, Saga, Outbox.",Widget:te,intro:e.jsx(e.Fragment,{children:"The GoF book ended in 1994. Networked systems brought a new generation: separation of reads from writes, event logs as the source of truth, distributed transactions via compensation, reliable publishing across services."}),sections:[],takeaways:["CQRS: read model ≠ write model. Scale them independently.","Event Sourcing: append-only log of facts; current state is a fold of the log.","Circuit Breaker: stop calling a failing dependency before it cascades.","Saga: long-running distributed transaction with compensating actions.","Outbox: write the event to the same DB transaction as the business state — covered in detail in the Messaging topic."]}]};export{Te as manifest};
