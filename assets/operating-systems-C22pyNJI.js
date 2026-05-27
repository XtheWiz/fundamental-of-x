import{r as S,j as e}from"./main-BhRPON15.js";import{L as Ue}from"./LegacyWidget-CxSoaB0i.js";import{A as de,m as V}from"./proxy-dTprwLRU.js";const Se=8,le=16,ye=4;function Ne(){const t=Array.from({length:Se},(m,i)=>({id:i,used:i===0,type:i===0?"dir":null,size:0,blocks:[],links:i===0?1:0})),s=Array.from({length:le},()=>({used:!1,fill:0,owner:null}));return{inodes:t,blocks:s,dirents:[]}}function Ve(t){return{inodes:t.inodes.map(s=>({...s,blocks:[...s.blocks]})),blocks:t.blocks.map(s=>({...s})),dirents:t.dirents.map(s=>({...s}))}}function Ke(t){return t.inodes.find(s=>!s.used)||null}const Fe={ext4:{label:"ext4 (journaling)",short:"ext4"},cow:{label:"ZFS / btrfs (COW)",short:"COW"}};function Ye(){const[t,s]=S.useState(()=>{const p=Ne(),v=p.inodes[1];return v.used=!0,v.type="file",v.size=6,v.blocks=[0,1],v.links=1,p.blocks[0]={used:!0,fill:1,owner:1},p.blocks[1]={used:!0,fill:.5,owner:1},p.dirents.push({name:"notes.txt",inode:1}),p.inodes[0].size=p.dirents.length,p}),[a,m]=S.useState("ext4"),[i,n]=S.useState(8),[o,f]=S.useState(1),[g,u]=S.useState("file.txt"),[d,r]=S.useState("alias.txt"),[l,k]=S.useState("renamed.txt"),[M,_]=S.useState("Tip: select an inode in the table, then write / rename / delete it."),[x,w]=S.useState(null);function b(p){_(p)}function P(p){s(v=>{const $=Ve(v);return p($),$.inodes[0].size=$.dirents.length,$}),w(null)}function h(){if(!g.trim()){b("Give the file a name first.");return}if(t.dirents.some(p=>p.name===g)){b(`"${g}" already exists.`);return}P(p=>{const v=Ke(p);if(!v){b("Out of inodes.");return}v.used=!0,v.type="file",v.size=0,v.blocks=[],v.links=1,p.dirents.push({name:g,inode:v.id}),f(v.id),b(`create("${g}") -> allocated inode #${v.id}, 0 data blocks.`)})}function A(){const p=t.inodes[o];if(!p||!p.used||p.type!=="file"){b("Select a file inode first.");return}const v=Math.max(1,Math.ceil(i/ye));P($=>{const E=$.inodes[o];for(const c of E.blocks)$.blocks[c]={used:!1,fill:0,owner:null};E.blocks=[];const T=$.blocks.map((c,y)=>c.used?-1:y).filter(c=>c>=0);if(T.length<v){b(`Not enough free blocks (need ${v}, have ${T.length}).`);return}let te=i;for(let c=0;c<v;c++){const y=T[c],N=Math.min(ye,te);$.blocks[y]={used:!0,fill:N/ye,owner:E.id},E.blocks.push(y),te-=N}E.size=i,b(`write(inode #${E.id}, ${i} KB) -> ${v} block(s): [${E.blocks.join(", ")}].`)})}function X(){if(!l.trim()){b("Type a new name.");return}if(!t.dirents.find(v=>v.inode===o)){b("Selected inode has no directory entry.");return}if(t.dirents.some(v=>v.name===l)){b(`"${l}" already exists.`);return}P(v=>{const $=v.dirents.find(T=>T.inode===o),E=$.name;$.name=l,b(`rename("${E}" -> "${l}") — inode #${o} unchanged, only the dirent.`)})}function H(){const p=t.inodes[o];if(!p||!p.used||p.id===0){b("Pick a non-root used inode.");return}P(v=>{const $=v.inodes[o],E=v.dirents.filter(T=>T.inode===o).map(T=>T.name);v.dirents=v.dirents.filter(T=>T.inode!==o),$.links=0;for(const T of $.blocks)v.blocks[T]={used:!1,fill:0,owner:null};$.used=!1,$.type=null,$.size=0,$.blocks=[],f(0),b(`unlink: removed dirent(s) [${E.join(", ")}], freed inode + ${E.length,""}data blocks.`)})}function J(){const p=t.inodes[o];if(!p||!p.used||p.type!=="file"){b("Hardlink target must be a file inode.");return}if(!d.trim()){b("Give the hardlink a name.");return}if(t.dirents.some(v=>v.name===d)){b(`"${d}" already exists.`);return}P(v=>{v.dirents.push({name:d,inode:o}),v.inodes[o].links+=1,b(`link("${d}" -> inode #${o}) — same data, two names. link count = ${v.inodes[o].links}.`)})}function O(){const p=t.inodes[o];if(!p||!p.used||p.type!=="file"||p.blocks.length===0){b("Pick a file with data, then crash a write to it.");return}a==="ext4"?(P(v=>{const $=v.inodes[o];if($.blocks.length===0)return;const E=$.blocks[$.blocks.length-1];v.blocks[E]={...v.blocks[E],fill:.35}}),w({fsType:"ext4",corrupted:!0,caption:"Journal replay restores metadata consistency — inode + dirent agree. But ext4 journals metadata only by default: the half-written data block stays torn. The file opens, the bytes are garbage."})):w({fsType:"cow",corrupted:!1,caption:"COW wrote the new data to *fresh* blocks and was about to swing the inode pointer. Crash hit before the swing. On reboot the inode still points at the old blocks. Old contents intact. No fsck. No torn write."}),b("Simulated power loss mid-write.")}function Y(){s(Ne()),f(0),w(null),b("Filesystem wiped. Only root / remains.")}const G=S.useMemo(()=>{const p=t.inodes.filter(T=>T.used&&T.type==="file").length,v=t.inodes.filter(T=>T.used).length,$=t.blocks.filter(T=>T.used).length,E=Math.round((le-$)/le*100);return{files:p,inodesUsed:v,blocksUsed:$,freePct:E}},[t]),ee=a==="ext4"?"maybe (torn data block)":"no",C=t.inodes[o];return e.jsxs("div",{className:"widget",children:[e.jsx("div",{className:"widget-title",children:"Filesystems — inodes, journaling, COW"}),e.jsx("div",{className:"controls pill-group",style:{flexWrap:"wrap"},children:Object.entries(Fe).map(([p,v])=>e.jsxs("label",{style:{display:"inline-flex",alignItems:"center",gap:"0.35rem",cursor:"pointer"},children:[e.jsx("input",{type:"radio",name:"fs-type",checked:a===p,onChange:()=>{m(p),w(null)}}),e.jsx("span",{style:{fontFamily:"var(--font-display)",fontSize:"0.9rem"},children:v.label})]},p))}),e.jsxs("div",{className:"controls",style:{flexWrap:"wrap",alignItems:"center"},children:[e.jsx("input",{className:"field",style:{width:130},value:g,onChange:p=>u(p.target.value),placeholder:"filename"}),e.jsx("button",{className:"btn btn-accent",onClick:h,children:"create"}),e.jsx("button",{className:"btn",onClick:A,children:"write"}),e.jsxs("label",{style:{display:"inline-flex",alignItems:"center",gap:"0.4rem",fontFamily:"var(--font-mono)",fontSize:"0.8rem"},children:["size",e.jsx("input",{type:"range",min:1,max:32,step:1,value:i,onChange:p=>n(+p.target.value)}),e.jsxs("span",{style:{minWidth:38},children:[i," KB"]})]})]}),e.jsxs("div",{className:"controls",style:{flexWrap:"wrap"},children:[e.jsx("input",{className:"field",style:{width:130},value:l,onChange:p=>k(p.target.value),placeholder:"new name"}),e.jsx("button",{className:"btn",onClick:X,children:"rename"}),e.jsx("input",{className:"field",style:{width:130},value:d,onChange:p=>r(p.target.value),placeholder:"hardlink name"}),e.jsx("button",{className:"btn",onClick:J,children:"hardlink"}),e.jsx("button",{className:"btn",onClick:H,children:"delete"}),e.jsx("button",{className:"btn btn-accent",onClick:O,style:{marginLeft:"auto"},children:"crash mid-write"}),e.jsx("button",{className:"btn btn-ghost",onClick:Y,children:"reset"})]}),e.jsx("div",{className:"widget-stage",style:{minHeight:360},children:e.jsxs("svg",{viewBox:"0 0 720 360",width:"100%",style:{maxWidth:740},children:[e.jsxs("g",{children:[e.jsx("rect",{x:10,y:10,width:140,height:56,rx:6,fill:"var(--paper-deep)",stroke:"var(--ink)",strokeWidth:2.5}),e.jsx("text",{x:80,y:30,textAnchor:"middle",style:{fontFamily:"var(--font-display)",fontSize:13},children:"superblock"}),e.jsxs("text",{x:80,y:47,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:9,fill:"var(--ink-soft)"},children:["type: ",Fe[a].short]}),e.jsxs("text",{x:80,y:60,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:9,fill:"var(--ink-soft)"},children:[Se," inodes · ",le," blocks"]})]}),e.jsxs("g",{children:[e.jsx("text",{x:170,y:26,style:{fontFamily:"var(--font-display)",fontSize:12},children:"dirents in /"}),t.dirents.length===0&&e.jsx("text",{x:170,y:50,style:{fontFamily:"var(--font-mono)",fontSize:10,fill:"var(--ink-faint)"},children:"(empty)"}),t.dirents.map((p,v)=>e.jsxs("g",{transform:`translate(${170+v%4*130}, ${38+Math.floor(v/4)*22})`,children:[e.jsx("rect",{width:120,height:18,rx:3,fill:"var(--paper)",stroke:"var(--ink)",strokeWidth:1.5}),e.jsx("text",{x:6,y:13,style:{fontFamily:"var(--font-mono)",fontSize:10},children:p.name}),e.jsxs("text",{x:114,y:13,textAnchor:"end",style:{fontFamily:"var(--font-mono)",fontSize:10,fill:"var(--accent)"},children:["-> #",p.inode]})]},`${p.name}-${p.inode}`))]}),e.jsxs("g",{transform:"translate(10, 100)",children:[e.jsx("text",{x:0,y:-4,style:{fontFamily:"var(--font-display)",fontSize:12},children:"inode table"}),t.inodes.map((p,v)=>{const $=v%4*175,E=Math.floor(v/4)*80+4,T=o===v;return e.jsxs("g",{transform:`translate(${$}, ${E})`,style:{cursor:"pointer"},onClick:()=>f(v),children:[e.jsx("rect",{width:165,height:72,rx:5,fill:p.used?"var(--paper)":"var(--paper-deep)",stroke:T?"var(--accent)":"var(--ink)",strokeWidth:T?3:1.8}),e.jsxs("text",{x:8,y:14,style:{fontFamily:"var(--font-mono)",fontSize:10,fontWeight:700},children:["#",v," ",p.used?p.type==="dir"?"[dir]":"[file]":"[free]"]}),e.jsxs("text",{x:157,y:14,textAnchor:"end",style:{fontFamily:"var(--font-mono)",fontSize:9,fill:"var(--ink-soft)"},children:["links: ",p.links]}),e.jsxs("text",{x:8,y:30,style:{fontFamily:"var(--font-mono)",fontSize:9,fill:"var(--ink-soft)"},children:["size: ",p.used?p.type==="dir"?`${p.size} entries`:`${p.size} KB`:"-"]}),e.jsx("text",{x:8,y:45,style:{fontFamily:"var(--font-mono)",fontSize:9,fill:"var(--ink-soft)"},children:"ptrs:"}),e.jsx("text",{x:36,y:45,style:{fontFamily:"var(--font-mono)",fontSize:9},children:p.used&&p.blocks.length?`[${p.blocks.join(", ")}]`:p.used?"[]":"-"}),e.jsx("g",{transform:"translate(8, 52)",children:Array.from({length:8}).map((te,c)=>{const y=p.blocks[c]!==void 0;return e.jsx("rect",{x:c*18,y:0,width:16,height:14,rx:2,fill:y?"var(--accent)":"var(--paper-deep)",stroke:"var(--ink)",strokeWidth:1},c)})})]},v)})]}),e.jsxs("g",{transform:"translate(10, 280)",children:[e.jsx("text",{x:0,y:-4,style:{fontFamily:"var(--font-display)",fontSize:12},children:"data blocks"}),t.blocks.map((p,v)=>{const $=v*42,E=p.owner===o&&o!==0;return e.jsxs("g",{transform:`translate(${$}, 4)`,children:[e.jsx("rect",{width:38,height:50,rx:4,fill:"var(--paper-deep)",stroke:E?"var(--accent)":"var(--ink)",strokeWidth:E?2.5:1.5}),e.jsx(de,{children:p.used&&e.jsx(V.rect,{initial:{height:0,y:50},animate:{height:50*p.fill,y:50-50*p.fill},transition:{duration:.25},width:38,rx:4,fill:p.fill<.5?"#e0aa3e":"var(--accent)",opacity:.85},`fill-${v}-${p.owner}-${p.fill}`)}),e.jsx("text",{x:19,y:62,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:9,fill:"var(--ink-soft)"},children:v}),p.used&&p.owner!=null&&e.jsxs("text",{x:19,y:14,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:9,fontWeight:700,fill:"white"},children:["#",p.owner]})]},v)})]})]})}),e.jsxs("div",{className:"metrics",children:[e.jsxs("div",{className:"metric",children:[e.jsx("div",{className:"label",children:"files"}),e.jsx("div",{className:"value",children:G.files})]}),e.jsxs("div",{className:"metric",children:[e.jsx("div",{className:"label",children:"inodes used"}),e.jsxs("div",{className:"value",children:[G.inodesUsed," / ",Se]})]}),e.jsxs("div",{className:"metric",children:[e.jsx("div",{className:"label",children:"blocks used"}),e.jsxs("div",{className:"value",children:[G.blocksUsed," / ",le]})]}),e.jsxs("div",{className:"metric",children:[e.jsx("div",{className:"label",children:"free space"}),e.jsxs("div",{className:"value",children:[G.freePct,"%"]})]}),e.jsxs("div",{className:`metric ${a==="ext4"?"accent":""}`,children:[e.jsx("div",{className:"label",children:"crash corrupts?"}),e.jsx("div",{className:"value",style:{fontSize:"1rem"},children:ee})]})]}),e.jsxs("div",{className:"callout",children:[e.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"0.85rem"},children:M}),C&&C.used&&e.jsxs("div",{style:{marginTop:"0.4rem",fontFamily:"var(--font-mono)",fontSize:"0.8rem",color:"var(--ink-soft)"},children:["selected: inode #",C.id," (",C.type,"), ",C.type==="dir"?`${C.size} entries`:`${C.size} KB`,", blocks [",C.blocks.join(", ")||"—","], links ",C.links]}),x&&e.jsxs("div",{style:{marginTop:"0.5rem",padding:"0.5rem 0.7rem",borderRadius:6,border:`2px solid ${x.corrupted?"var(--accent)":"#2a8a3e"}`,background:x.corrupted?"#fde2e2":"#e6f4ea"},children:[e.jsx("strong",{children:x.corrupted?"Recovered — but data is torn.":"Recovered cleanly."})," ",x.caption]})]})]})}const $e=10,me=10,K=12,ce=8,pe=16,Ge=32,Ee=4,oe=t=>"0x"+(t>>>0).toString(16).padStart(8,"0").toUpperCase(),Xe=(t,s)=>(t>>>0).toString(2).padStart(s,"0");function be(t){const s=t&(1<<K)-1,a=t>>>K&(1<<me)-1;return{pdIdx:t>>>K+me&(1<<$e)-1,ptIdx:a,offset:s,vpn:t>>>K}}const ue=t=>(t*7&(1<<$e)-1)<<K+me|(t*13+3&(1<<me)-1)<<K,Pe=(t,s)=>{const a=t.findIndex(m=>m.vpn===s);return a===-1?t:[t[a],...t.slice(0,a),...t.slice(a+1)]},fe=(t,s)=>[s,...t.filter(a=>a.vpn!==s.vpn)].slice(0,ce),Ce=(t,s)=>t.filter(a=>a.vpn!==s);function Je(){const t=ue(0)|291,[s,a]=S.useState(oe(t)),[m,i]=S.useState(t),n=S.useMemo(()=>{const F={},j=new Array(pe).fill(null),I=[];for(let D=0;D<8;D++){const z=ue(D)>>>K;F[z]=D,j[D]=z,I.push(z)}return{map:F,frames:j,fifo:I}},[]),[o,f]=S.useState(n.map),[g,u]=S.useState(n.frames),[d,r]=S.useState(n.fifo),[l,k]=S.useState([]),[M,_]=S.useState(0),[x,w]=S.useState(0),[b,P]=S.useState(0),[h,A]=S.useState(null),[X,H]=S.useState("Enter a virtual address and press Translate."),[J,O]=S.useState(6),[Y,G]=S.useState(8),ee=S.useRef(null),C=be(m),p=h&&h.frame!=null?h.frame<<K|C.offset:null;function v(F,j){j.forEach(([I,D])=>setTimeout(()=>A(z=>z&&z.vpn===F.vpn?{...z,...D}:z),I))}function $(F){const{vpn:j,pdIdx:I,ptIdx:D,offset:z}=be(F),W=l.findIndex(L=>L.vpn===j);if(W!==-1){const L=l[W].frame;_(q=>q+1),k(q=>Pe(q,j)),A({step:4,vpn:j,pdIdx:I,ptIdx:D,offset:z,frame:L,hit:!0,fault:!1}),H(`TLB hit on VPN ${j} -> frame ${L}. Skipped the page-table walk.`);return}if(w(L=>L+1),Object.prototype.hasOwnProperty.call(o,j)){const L=o[j],q={step:1,vpn:j,pdIdx:I,ptIdx:D,offset:z,frame:null,hit:!1,fault:!1};A(q),v(q,[[350,{step:2}],[700,{step:3}],[1050,{step:4,frame:L}]]),k(R=>fe(R,{vpn:j,frame:L})),H(`TLB miss. Walk: PD[${I}] -> PT[${D}] -> frame ${L}. Cached in TLB.`);return}E(F)}function E(F){const{vpn:j,pdIdx:I,ptIdx:D,offset:z}=be(F);P(B=>B+1);let W=g.slice(),L=d.slice(),q={...o},R,Z=null;const ae=W.indexOf(null);ae!==-1?R=ae:(Z=L.shift(),R=W.findIndex(B=>B===Z),delete q[Z],k(B=>Ce(B,Z))),W[R]=j,L.push(j),q[j]=R,u(W),r(L),f(q),k(B=>fe(B,{vpn:j,frame:R}));const ne={step:0,vpn:j,pdIdx:I,ptIdx:D,offset:z,frame:null,hit:!1,fault:!0};A(ne),v(ne,[[300,{step:1}],[600,{step:2}],[900,{step:3}],[1200,{step:4,frame:R}]]),H(Z!=null?`Page fault on VPN ${j}. Evicted VPN ${Z} from frame ${R}; mapped VPN ${j} -> frame ${R}.`:`Page fault on VPN ${j}. Kernel allocated free frame ${R}; mapped VPN ${j} -> frame ${R}.`)}function T(){const F=Ze(s);if(F==null){H("Could not parse address. Use hex (0x...) or decimal.");return}i(F),$(F)}function te(){const F=Y;G(I=>I+1);const j=ue(F)|64;i(j),a(oe(j)),$(j)}function c(){f(n.map),u(n.frames),r(n.fifo),k([]),_(0),w(0),P(0),A(null),G(8),i(t),a(oe(t)),H("State reset. Page table holds working-set pages 0..7.")}function y(F){k([]),_(0),w(0),P(0);let j=[],I=g.slice(),D=d.slice(),z={...o},W=0,L=0,q=0;for(let ae=0;ae<Ee;ae++)for(let ne=0;ne<F;ne++){const B=ue(ne)>>>K;if(j.find(se=>se.vpn===B)){W++,j=Pe(j,B);continue}if(L++,Object.prototype.hasOwnProperty.call(z,B))j=fe(j,{vpn:B,frame:z[B]});else{q++;let se;const Te=I.indexOf(null);if(Te!==-1)se=Te;else{const ge=D.shift();se=I.findIndex(He=>He===ge),delete z[ge],j=Ce(j,ge)}I[se]=B,D.push(B),z[B]=se,j=fe(j,{vpn:B,frame:se})}}k(j),u(I),r(D),f(z),_(W),w(L),P(q),A(null);const R=W+L,Z=R===0?0:Math.round(W/R*100);H(`Swept ${F} pages x ${Ee} iters. TLB hit rate ${Z}% (${W}/${R}); page faults ${q}.`)}function N(F){O(F),ee.current&&clearTimeout(ee.current),ee.current=setTimeout(()=>y(F),80)}const _e=M+x,Oe=_e===0?0:Math.round(M/_e*100),We=g.filter(F=>F===null).length;return e.jsxs("div",{className:"widget",children:[e.jsx("div",{className:"widget-title",children:"Virtual memory — page tables, TLB, faults"}),e.jsxs("div",{className:"controls",children:[e.jsx("label",{style:{fontFamily:"var(--font-mono)",fontSize:"0.85rem"},children:"Virtual addr:"}),e.jsx("input",{className:"field",value:s,onChange:F=>a(F.target.value),style:{width:"11ch",fontFamily:"var(--font-mono)"}}),e.jsx("button",{className:"btn btn-accent",onClick:T,children:"Translate"}),e.jsx("button",{className:"btn",onClick:te,children:"Touch unmapped page"}),e.jsx("button",{className:"btn btn-ghost",onClick:c,children:"Reset"})]}),e.jsx(Qe,{addr:m,split:C}),e.jsx("div",{className:"widget-stage",style:{minHeight:280},children:e.jsxs("svg",{viewBox:"0 0 720 260",width:"100%",style:{maxWidth:720},children:[e.jsxs("defs",{children:[e.jsx("marker",{id:"vm-arr",markerWidth:"10",markerHeight:"10",refX:"9",refY:"5",orient:"auto",children:e.jsx("polygon",{points:"0 0,10 5,0 10",fill:"var(--ink)"})}),e.jsx("marker",{id:"vm-arr-a",markerWidth:"10",markerHeight:"10",refX:"9",refY:"5",orient:"auto",children:e.jsx("polygon",{points:"0 0,10 5,0 10",fill:"var(--accent)"})})]}),e.jsx(ze,{x:40,y:130,w:70,h:48,label:"CR3",sub:"page-dir base",active:h&&h.step>=1&&!h.hit}),e.jsx(Ae,{x:210,y:130,title:"Page Directory",idx:C.pdIdx,bits:$e,highlight:h&&h.step>=1&&!h.hit,present:!0}),e.jsx(Ae,{x:400,y:130,title:`Page Table [PD ${C.pdIdx}]`,idx:C.ptIdx,bits:me,highlight:h&&h.step>=2&&!h.hit,present:h&&h.step>=4&&!h.fault}),e.jsx(ze,{x:620,y:130,w:80,h:60,label:h&&h.step>=4?`frame ${h.frame}`:"frame ?",sub:h&&h.step>=4?oe(h.frame<<K|h.offset):"— phys —",active:h&&h.step>=4,fault:h&&h.fault&&h.step<4}),e.jsx(et,{active:h&&h.hit}),e.jsxs(de,{children:[h&&!h.hit&&h.step>=1&&e.jsx(xe,{x1:110,y1:130,x2:170,y2:130,accent:!0},"a1"),h&&!h.hit&&h.step>=2&&e.jsx(xe,{x1:250,y1:130,x2:360,y2:130,accent:!0,label:`PD[${C.pdIdx}]`},"a2"),h&&!h.hit&&h.step>=3&&e.jsx(xe,{x1:440,y1:130,x2:580,y2:130,accent:!0,label:`PT[${C.ptIdx}]`},"a3"),h&&h.fault&&h.step>=1&&h.step<4&&e.jsx(V.text,{x:400,y:40,textAnchor:"middle",initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},style:{fontFamily:"var(--font-display)",fontSize:14,fill:"var(--accent)"},children:"PAGE FAULT — kernel allocates frame"},"ft")]})]})}),e.jsxs("div",{className:"metrics",children:[e.jsxs("div",{className:"metric",children:[e.jsx("div",{className:"label",children:"TLB HIT RATE"}),e.jsxs("div",{className:"value",children:[Oe,"%"]})]}),e.jsxs("div",{className:"metric",children:[e.jsx("div",{className:"label",children:"TLB HITS"}),e.jsx("div",{className:"value",children:M})]}),e.jsxs("div",{className:"metric",children:[e.jsx("div",{className:"label",children:"TLB MISSES"}),e.jsx("div",{className:"value",children:x})]}),e.jsxs("div",{className:"metric accent",children:[e.jsx("div",{className:"label",children:"PAGE FAULTS"}),e.jsx("div",{className:"value",children:b})]}),e.jsxs("div",{className:"metric",children:[e.jsx("div",{className:"label",children:"FRAMES FREE"}),e.jsxs("div",{className:"value",children:[We,"/",pe]})]}),e.jsxs("div",{className:"metric",children:[e.jsx("div",{className:"label",children:"WORKING SET"}),e.jsx("div",{className:"value",children:J})]})]}),e.jsx(tt,{tlb:l,highlightVpn:h?h.vpn:null,hit:h?h.hit:!1}),e.jsx(st,{frames:g,highlightFrame:h&&h.step>=4?h.frame:null}),e.jsxs("div",{className:"controls",style:{alignItems:"center"},children:[e.jsxs("label",{style:{fontFamily:"var(--font-mono)",fontSize:"0.85rem",minWidth:"15ch"},children:["Benchmark working-set: ",e.jsx("strong",{children:J})]}),e.jsx("input",{type:"range",min:"1",max:Ge,step:"1",value:J,onChange:F=>N(+F.target.value),style:{flex:1}}),e.jsx("button",{className:"btn",onClick:()=>y(J),children:"Re-run"})]}),e.jsxs("div",{style:{fontFamily:"var(--font-mono)",fontSize:"0.75rem",color:"var(--ink-soft)",marginTop:"-0.3rem"},children:["TLB size = ",ce," entries. Physical memory = ",pe," frames. Beyond either, the curve breaks."]}),e.jsxs("div",{className:"callout",children:[e.jsx("strong",{children:"What just happened."})," ",X,p!=null&&h&&e.jsxs("div",{style:{marginTop:"0.4rem",fontFamily:"var(--font-mono)",fontSize:"0.85rem"},children:["phys = (frame ",h.frame," << 12) | offset 0x",C.offset.toString(16)," = ",oe(p)]})]})]})}function Ze(t){if(!t)return null;const s=t.trim();if(!s)return null;const a=s.toLowerCase().startsWith("0x")?parseInt(s,16):parseInt(s,10);return Number.isFinite(a)&&a>=0?a>>>0:null}function Qe({addr:t,split:s}){const a=Xe(t,32),m={padding:"4px 6px",fontFamily:"var(--font-mono)",fontSize:"0.8rem",borderRight:"1px solid var(--ink)"},i={fontSize:"0.65rem",color:"var(--ink-soft)"};return e.jsxs("div",{style:{border:"2px solid var(--ink)",borderRadius:"var(--radius)",overflow:"hidden",background:"var(--paper)",margin:"0.6rem 0"},children:[e.jsxs("div",{style:{display:"flex"},children:[e.jsxs("div",{style:{...m,flex:"10 1 0",background:"var(--paper-deep)"},children:[e.jsx("div",{style:i,children:"PD INDEX (10 bits)"}),e.jsx("div",{children:a.slice(0,10)})]}),e.jsxs("div",{style:{...m,flex:"10 1 0",background:"var(--paper-deep)"},children:[e.jsx("div",{style:i,children:"PT INDEX (10 bits)"}),e.jsx("div",{children:a.slice(10,20)})]}),e.jsxs("div",{style:{...m,flex:"12 1 0",borderRight:"none"},children:[e.jsx("div",{style:i,children:"OFFSET (12 bits)"}),e.jsx("div",{children:a.slice(20,32)})]})]}),e.jsxs("div",{style:{display:"flex",borderTop:"1px solid var(--ink)"},children:[e.jsxs("div",{style:{...m,flex:"10 1 0"},children:[e.jsx("strong",{children:s.pdIdx})," ",e.jsx("span",{style:{color:"var(--ink-soft)"},children:"dec"})]}),e.jsxs("div",{style:{...m,flex:"10 1 0"},children:[e.jsx("strong",{children:s.ptIdx})," ",e.jsx("span",{style:{color:"var(--ink-soft)"},children:"dec"})]}),e.jsxs("div",{style:{...m,flex:"12 1 0",borderRight:"none"},children:[e.jsxs("strong",{children:["0x",s.offset.toString(16).padStart(3,"0")]}),e.jsx("span",{style:{color:"var(--ink-soft)"},children:" within 4 KB page"})]})]})]})}function ze({x:t,y:s,w:a=80,h:m=50,label:i,sub:n,active:o,fault:f}){return e.jsxs(V.g,{animate:{scale:o?1.04:1},transition:{duration:.25},style:{transformBox:"fill-box",transformOrigin:"center"},children:[e.jsx("rect",{x:t-a/2,y:s-m/2,width:a,height:m,rx:6,fill:f?"#fde2e2":o?"var(--paper-deep)":"var(--paper)",stroke:f||o?"var(--accent)":"var(--ink)",strokeWidth:2.5}),e.jsx("text",{x:t,y:s-4,textAnchor:"middle",style:{fontFamily:"var(--font-display)",fontSize:12},children:i}),n&&e.jsx("text",{x:t,y:s+12,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:9,fill:"var(--ink-soft)"},children:n})]})}function Ae({x:t,y:s,title:a,idx:m,bits:i,highlight:n,present:o}){return e.jsxs("g",{children:[e.jsx("rect",{x:t-80/2,y:s-50,width:80,height:100,rx:6,fill:"var(--paper)",stroke:n?"var(--accent)":"var(--ink)",strokeWidth:2.5}),e.jsx("text",{x:t,y:s-36,textAnchor:"middle",style:{fontFamily:"var(--font-display)",fontSize:10},children:a}),e.jsxs("text",{x:t,y:s-24,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:8,fill:"var(--ink-soft)"},children:[1<<i," entries"]}),Array.from({length:6}).map((d,r)=>e.jsx("rect",{x:t-80/2+6,y:s-18+r*8,width:68,height:6,rx:1,fill:r===3&&n?o?"#d9ead3":"var(--accent)":"var(--paper-deep)",stroke:"var(--ink)",strokeWidth:.6},r)),e.jsxs("text",{x:t,y:s-18+24+8/2+3,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:8,fill:n?"var(--ink)":"var(--ink-soft)"},children:["[",m,"]"]})]})}function xe({x1:t,y1:s,x2:a,y2:m,accent:i,label:n}){const o=i?"var(--accent)":"var(--ink)",f=i?"vm-arr-a":"vm-arr";return e.jsxs(V.g,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.2},children:[e.jsx("line",{x1:t,y1:s,x2:a,y2:m,stroke:o,strokeWidth:2.5,markerEnd:`url(#${f})`}),n&&e.jsx("text",{x:(t+a)/2,y:s-8,textAnchor:"middle",style:{fontFamily:"var(--font-mono)",fontSize:10,fill:o,fontWeight:600},children:n})]})}function et({active:t}){return e.jsxs(V.g,{animate:{opacity:t?1:.18},transition:{duration:.2},children:[e.jsx("path",{d:"M 60 100 Q 360 30 600 100",fill:"none",stroke:t?"var(--accent)":"var(--ink-soft)",strokeWidth:t?3:1.5,strokeDasharray:t?void 0:"4 4",markerEnd:"url(#vm-arr-a)"}),e.jsx("text",{x:360,y:28,textAnchor:"middle",style:{fontFamily:"var(--font-display)",fontSize:11,fill:t?"var(--accent)":"var(--ink-soft)"},children:"TLB short-circuit"})]})}function tt({tlb:t,highlightVpn:s,hit:a}){const m=Array.from({length:ce},(i,n)=>t[n]||null);return e.jsxs("div",{style:{margin:"0.6rem 0"},children:[e.jsxs("div",{style:{fontFamily:"var(--font-display)",fontSize:"0.9rem",marginBottom:"0.3rem"},children:["TLB ",e.jsxs("span",{style:{fontFamily:"var(--font-mono)",fontSize:"0.75rem",color:"var(--ink-soft)"},children:["(",ce," entries, LRU; most-recent left)"]})]}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:`repeat(${ce}, 1fr)`,gap:6},children:m.map((i,n)=>{const o=i&&s!=null&&i.vpn===s;return e.jsx("div",{style:{border:"2px solid",borderColor:o?"var(--accent)":"var(--ink)",borderRadius:4,padding:"4px 6px",background:o?a?"#d9ead3":"var(--paper-deep)":"var(--paper)",fontFamily:"var(--font-mono)",fontSize:"0.72rem",textAlign:"center",minHeight:38},children:i?e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{color:"var(--ink-soft)",fontSize:"0.6rem"},children:"VPN"}),e.jsxs("div",{children:[e.jsx("strong",{children:i.vpn})," → f",i.frame]})]}):e.jsx("div",{style:{color:"var(--ink-faint)",paddingTop:8},children:"—"})},n)})})]})}function st({frames:t,highlightFrame:s}){return e.jsxs("div",{style:{margin:"0.4rem 0 0.6rem"},children:[e.jsxs("div",{style:{fontFamily:"var(--font-display)",fontSize:"0.9rem",marginBottom:"0.3rem"},children:["Physical memory ",e.jsxs("span",{style:{fontFamily:"var(--font-mono)",fontSize:"0.75rem",color:"var(--ink-soft)"},children:["(",pe," frames of 4 KB)"]})]}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:`repeat(${pe}, 1fr)`,gap:4},children:t.map((a,m)=>{const i=s===m,n=a!==null;return e.jsxs("div",{style:{border:"2px solid",borderColor:i?"var(--accent)":"var(--ink)",background:i?"#d9ead3":n?"var(--paper-deep)":"var(--paper)",borderRadius:3,padding:"2px 0",textAlign:"center",fontFamily:"var(--font-mono)",fontSize:"0.65rem",minHeight:30},children:[e.jsxs("div",{style:{color:"var(--ink-soft)",fontSize:"0.55rem"},children:["f",m]}),e.jsx("div",{children:n?`v${a}`:"·"})]},m)})})]})}const ke={openat:{label:"tracepoint/syscalls/sys_enter_openat",short:"sys_enter_openat",kind:"tracepoint",blurb:"Fires whenever any process calls openat(2). Used by security tools and file-access auditors.",mapName:"open_count",mapDesc:"BPF_MAP_TYPE_HASH<filename, u64>",program:`// trace every openat(2), count by path
SEC("tracepoint/syscalls/sys_enter_openat")
int trace_openat(struct trace_event_raw_sys_enter *ctx) {
    char path[64];
    bpf_probe_read_user_str(path, sizeof(path), (void *)ctx->args[1]);
    u64 zero = 0, *cnt;
    cnt = bpf_map_lookup_or_try_init(&open_count, path, &zero);
    if (cnt) __sync_fetch_and_add(cnt, 1);
    bpf_printk("openat %s", path);
    return 0;
}`},tcp:{label:"kprobe/tcp_connect",short:"tcp_connect",kind:"kprobe",blurb:"Attaches to the kernel function tcp_connect(). Sees every outbound TCP handshake.",mapName:"connect_by_pid",mapDesc:"BPF_MAP_TYPE_HASH<pid_t, u64>",program:`// count outbound TCP connects per pid
SEC("kprobe/tcp_connect")
int BPF_KPROBE(kp_tcp_connect, struct sock *sk) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    u64 zero = 0, *cnt;
    cnt = bpf_map_lookup_or_try_init(&connect_by_pid, &pid, &zero);
    if (cnt) __sync_fetch_and_add(cnt, 1);
    bpf_printk("tcp_connect pid=%u", pid);
    return 0;
}`},xdp:{label:"XDP packet filter",short:"xdp_filter",kind:"xdp",blurb:"Runs in the NIC driver, before the kernel stack. Can XDP_DROP packets at line rate.",mapName:"drops_by_src",mapDesc:"BPF_MAP_TYPE_LRU_HASH<__be32, u64>",program:`// drop packets from blocklisted source IPs at the driver
SEC("xdp")
int xdp_filter(struct xdp_md *ctx) {
    void *data = (void *)(long)ctx->data;
    void *end  = (void *)(long)ctx->data_end;
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > end) return XDP_PASS;
    if (eth->h_proto != bpf_htons(ETH_P_IP)) return XDP_PASS;
    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > end) return XDP_PASS;
    u64 *blocked = bpf_map_lookup_elem(&drops_by_src, &ip->saddr);
    if (blocked) { __sync_fetch_and_add(blocked, 1); return XDP_DROP; }
    return XDP_PASS;
}`},uprobe:{label:"uprobe/userspace function",short:"uprobe:SSL_write",kind:"uprobe",blurb:"Attaches to a userspace function (SSL_write in libssl). Inspects encrypted-payload sizes.",mapName:"ssl_bytes",mapDesc:"BPF_MAP_TYPE_HASH<comm, u64>",program:`// observe SSL_write payload sizes per process name
SEC("uprobe/libssl.so.3:SSL_write")
int BPF_UPROBE(up_ssl_write, void *ssl, const void *buf, int num) {
    char comm[16];
    bpf_get_current_comm(&comm, sizeof(comm));
    u64 add = num, *acc;
    acc = bpf_map_lookup_or_try_init(&ssl_bytes, comm, &add);
    if (acc) __sync_fetch_and_add(acc, add);
    bpf_printk("SSL_write %s %d", comm, num);
    return 0;
}`}},it=[{id:"e1",label:"process opens /etc/passwd",hookId:"openat",key:"/etc/passwd",line:'sshd[1042]  openat(AT_FDCWD, "/etc/passwd", O_RDONLY)'},{id:"e2",label:"process opens /etc/shadow",hookId:"openat",key:"/etc/shadow",line:'sudo[2210]  openat(AT_FDCWD, "/etc/shadow", O_RDONLY)'},{id:"e3",label:"outbound TCP SYN",hookId:"tcp",key:"2210",line:"tcp_connect  pid=2210 -> 10.0.0.5:443"},{id:"e4",label:"another TCP SYN",hookId:"tcp",key:"1042",line:"tcp_connect  pid=1042 -> 10.0.0.7:80"},{id:"e5",label:"incoming pkt (allowed src)",hookId:"xdp",key:"10.0.0.4",line:"xdp  src=10.0.0.4  -> XDP_PASS",noBump:!0},{id:"e6",label:"incoming pkt (blocked src)",hookId:"xdp",key:"198.51.100.66",line:"xdp  src=198.51.100.66 -> XDP_DROP",bad:!0},{id:"e7",label:"curl SSL_write(420)",hookId:"uprobe",key:"curl",line:"SSL_write  comm=curl  num=420",delta:420},{id:"e8",label:"firefox SSL_write(1180)",hookId:"uprobe",key:"firefox",line:"SSL_write  comm=firefox  num=1180",delta:1180}],Le=[{label:"unbounded loop",reason:"back-edge from insn 5 to 3: infinite loop detected. eBPF programs must have a provably bounded instruction count."},{label:"out-of-bounds packet read",reason:"invalid access to packet, off=0 size=20: pointer arithmetic on PTR_TO_PACKET requires a check against ctx->data_end."},{label:"forbidden helper",reason:"unknown func bpf_probe_write_user#36: helper not permitted in this program type (needs CAP_SYS_ADMIN + opt-in)."}],Me=["parsing ELF section .text...","building program CFG (control-flow graph)...","walking instructions, tracking register types...","checking memory accesses are bounded...","verifying loops terminate (must converge)...","JIT-compiling to native code...","attaching to hook."];let rt=0;const Ie=()=>rt+=1;function nt(){const[t,s]=S.useState("openat"),[a,m]=S.useState({}),[i,n]=S.useState([]),[o,f]=S.useState(!1),[g,u]=S.useState({}),[d,r]=S.useState([]),[l,k]=S.useState(0),[M,_]=S.useState(0),[x,w]=S.useState(null),[b,P]=S.useState(""),h=ke[t],A=!!a[t],X=S.useMemo(()=>Object.entries(g[t]||{}),[g,t]),H=S.useMemo(()=>Object.values(g).reduce((c,y)=>c+Object.keys(y).length,0),[g]),J=d.filter(c=>c.kind==="ok").length;function O(c,y){r(N=>[{id:Ie(),line:c,kind:y},...N].slice(0,30))}function Y(c,y="info"){n(N=>[...N,{id:Ie(),text:c,kind:y}].slice(-12))}function G(){if(o||A)return;f(!0),n([]);let c=0;const y=()=>{if(c<Me.length){Y(`verifier: ${Me[c]}`),c++,setTimeout(y,260);return}Y(`verifier: program accepted -> attached to ${h.label}`,"ok"),O(`program loaded and attached to ${h.short}`,"ok"),m(N=>({...N,[t]:!0})),_(N=>N+1),f(!1)};y()}function ee(){o||(m(c=>{const y={...c};return delete y[t],y}),O(`program detached from ${h.short}`,"info"),n([]))}function C(c){const y=Le[c];n([]),Y("verifier: parsing ELF section .text..."),Y("verifier: walking instructions, tracking register types..."),Y(`verifier: REJECTED — ${y.reason}`,"err"),O(`load failed (${y.label}): verifier rejected program`,"err")}function p(c){if(c.hookId!==t||!A){k(y=>y+1),O(`${c.line}   [no matching program loaded — event ignored]`,"err");return}c.noBump||u(y=>{const N={...y[t]||{}};return N[c.key]=(N[c.key]||0)+(c.delta??1),{...y,[t]:N}}),O(c.line,c.bad?"err":"ok")}function v(c,y){w(c),P(String(y))}function $(){if(x==null)return;const c=Number(b);u(y=>{const N={...y[t]||{}};return N[x]=Number.isFinite(c)?c:0,{...y,[t]:N}}),O(`userspace wrote map ${h.mapName}[${x}] = ${b}`,"info"),w(null)}function E(c){u(y=>{const N={...y[t]||{}};return delete N[c],{...y,[t]:N}}),O(`userspace deleted ${h.mapName}[${c}]`,"info")}function T(){u(c=>({...c,[t]:{}})),O(`userspace cleared ${h.mapName}`,"info")}function te(c){c!==t&&(s(c),w(null),n([]),O(`switched view to ${ke[c].label}`,"info"))}return e.jsxs("div",{className:"widget",children:[e.jsx("div",{className:"widget-title",children:"eBPF — programmable, verified kernel hooks"}),e.jsxs("div",{className:"callout",children:["eBPF lets you attach tiny programs to kernel hook points — syscalls, kprobes, network drivers, uprobes — and share data with userspace via typed ",e.jsx("strong",{children:"maps"}),". Before any program runs, the kernel ",e.jsx("em",{children:"verifier"})," proves it terminates and never touches memory it shouldn't."]}),e.jsx("div",{className:"controls",style:{flexWrap:"wrap"},children:e.jsx("div",{className:"pill-group",style:{flexWrap:"wrap"},children:Object.entries(ke).map(([c,y])=>e.jsxs("span",{style:{display:"contents"},children:[e.jsx("input",{type:"radio",id:`hook-${c}`,name:"ebpf-hook",checked:t===c,onChange:()=>te(c)}),e.jsx("label",{htmlFor:`hook-${c}`,title:y.blurb,children:y.short})]},c))})}),e.jsxs("div",{className:"widget-stage",style:{display:"grid",gridTemplateColumns:"minmax(0, 1.1fr) minmax(0, 1fr)",gap:"1rem"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.7rem",minWidth:0},children:[e.jsxs("div",{style:{display:"flex",alignItems:"baseline",justifyContent:"space-between"},children:[e.jsx("strong",{style:{fontFamily:"var(--font-display)"},children:h.label}),e.jsxs("span",{style:{fontFamily:"var(--font-mono)",fontSize:"0.72rem",color:"var(--ink-soft)"},children:[h.kind," hook"]})]}),e.jsx("div",{style:{fontSize:"0.8rem",color:"var(--ink-soft)"},children:h.blurb}),e.jsx("div",{className:"code-block",style:{minHeight:160,fontSize:"0.78rem"},children:h.program}),e.jsxs("div",{className:"controls",children:[A?e.jsx("button",{className:"btn",onClick:ee,children:"Detach program"}):e.jsx("button",{className:"btn btn-accent",onClick:G,disabled:o,children:o?"Verifying...":"Load program"}),e.jsx("span",{style:{marginLeft:"auto",fontFamily:"var(--font-mono)",fontSize:"0.78rem",color:A?"#2a8a3e":"var(--ink-soft)"},children:A?"attached":o?"in verifier...":"not loaded"})]}),i.length>0&&e.jsx("div",{className:"log",style:{fontSize:"0.78rem",maxHeight:130},children:e.jsx(de,{initial:!1,children:i.map(c=>e.jsxs(V.div,{className:`entry ${c.kind}`,initial:{opacity:0,x:-6},animate:{opacity:1,x:0},exit:{opacity:0},transition:{duration:.18},children:[e.jsx("span",{className:"t",children:c.kind==="err"?"x":c.kind==="ok"?"+":"."}),c.text]},c.id))})}),e.jsxs("div",{className:"field",style:{display:"flex",flexDirection:"column",gap:"0.4rem"},children:[e.jsx("strong",{style:{fontFamily:"var(--font-display)",fontSize:"0.9rem"},children:"Try a program the verifier should reject:"}),e.jsx("div",{className:"controls",style:{flexWrap:"wrap"},children:Le.map((c,y)=>e.jsxs("button",{className:"btn",onClick:()=>C(y),disabled:o,children:["Load: ",c.label]},c.label))}),e.jsx("div",{style:{fontSize:"0.74rem",color:"var(--ink-soft)"},children:"The verifier is the whole reason eBPF is safe to run in the kernel. Without it, a bug in your program would be a kernel bug."})]})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.7rem",minWidth:0},children:[e.jsxs("div",{className:"field",style:{display:"flex",flexDirection:"column",gap:"0.4rem"},children:[e.jsx("strong",{style:{fontFamily:"var(--font-display)",fontSize:"0.9rem"},children:"Simulate kernel events"}),e.jsx("div",{className:"controls",style:{flexWrap:"wrap",gap:"0.35rem"},children:it.map(c=>{const y=c.hookId===t;return e.jsx("button",{className:`btn ${y&&A?"btn-accent":""}`,onClick:()=>p(c),title:y&&A?"this hook is attached — event will be captured":y?"matches this hook, but program is not loaded":"will not match the current hook (event will be dropped)",style:{fontSize:"0.74rem",padding:"0.25rem 0.55rem",opacity:y?1:.7},children:c.label},c.id)})})]}),e.jsxs("div",{className:"field",style:{display:"flex",flexDirection:"column",gap:"0.35rem"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"baseline",justifyContent:"space-between"},children:[e.jsxs("strong",{style:{fontFamily:"var(--font-display)",fontSize:"0.9rem"},children:["eBPF map: ",e.jsx("code",{style:{fontFamily:"var(--font-mono)"},children:h.mapName})]}),e.jsx("button",{className:"btn btn-ghost",onClick:T,style:{fontSize:"0.72rem",padding:"0.15rem 0.45rem"},children:"clear"})]}),e.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"0.72rem",color:"var(--ink-soft)"},children:h.mapDesc}),e.jsx("div",{style:{border:"1.5px solid var(--ink)",borderRadius:4,background:"var(--paper)",maxHeight:170,overflowY:"auto"},children:e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",fontFamily:"var(--font-mono)",fontSize:"0.78rem"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{background:"var(--paper-deep)",borderBottom:"1px solid var(--ink-faint)"},children:[e.jsx("th",{style:{textAlign:"left",padding:"0.25rem 0.5rem",width:"55%"},children:"key"}),e.jsx("th",{style:{textAlign:"right",padding:"0.25rem 0.5rem"},children:"value"}),e.jsx("th",{style:{width:48}})]})}),e.jsx("tbody",{children:e.jsxs(de,{initial:!1,children:[X.length===0&&e.jsx(V.tr,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},children:e.jsx("td",{colSpan:3,style:{padding:"0.5rem",color:"var(--ink-faint)",textAlign:"center"},children:"(map is empty — fire some events)"})},"empty"),X.map(([c,y])=>e.jsxs(V.tr,{initial:{opacity:0,backgroundColor:"#fff2cc"},animate:{opacity:1,backgroundColor:"rgba(255,242,204,0)"},exit:{opacity:0},transition:{duration:.5},style:{borderBottom:"1px dashed var(--ink-faint)"},children:[e.jsx("td",{style:{padding:"0.25rem 0.5rem",wordBreak:"break-all"},children:c}),e.jsx("td",{style:{padding:"0.25rem 0.5rem",textAlign:"right"},children:x===c?e.jsx("input",{autoFocus:!0,value:b,onChange:N=>P(N.target.value),onBlur:$,onKeyDown:N=>{N.key==="Enter"&&$(),N.key==="Escape"&&w(null)},style:{fontFamily:"var(--font-mono)",fontSize:"0.78rem",width:80,padding:"0.1rem 0.3rem",border:"1px solid var(--ink-faint)",background:"var(--paper)",textAlign:"right"}}):e.jsx("span",{onClick:()=>v(c,y),style:{cursor:"pointer",borderBottom:"1px dotted var(--ink-faint)"},children:y})}),e.jsx("td",{style:{textAlign:"center"},children:e.jsx("button",{className:"btn btn-ghost",onClick:()=>E(c),title:"delete entry from userspace",style:{fontSize:"0.72rem",padding:"0.05rem 0.35rem"},children:"×"})})]},c))]})})]})}),e.jsx("div",{style:{fontSize:"0.72rem",color:"var(--ink-soft)"},children:"Click a value to edit it from userspace — that's how tools like bpftool and bcc read/write maps shared with the running program."})]}),e.jsx("div",{className:"log",style:{fontSize:"0.78rem",maxHeight:150,marginTop:0},children:e.jsxs(de,{initial:!1,children:[d.length===0&&e.jsx(V.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},style:{color:"var(--ink-faint)"},children:"# event ring buffer (perf_event_output) — empty"}),d.map(c=>e.jsxs(V.div,{className:`entry ${c.kind}`,initial:{opacity:0,x:-6},animate:{opacity:1,x:0},exit:{opacity:0},transition:{duration:.18},children:[e.jsx("span",{className:"t",children:c.kind==="err"?"!":c.kind==="ok"?">":"."}),c.line]},c.id))]})})]})]}),e.jsxs("div",{className:"metrics",children:[e.jsxs("div",{className:"metric",children:[e.jsx("div",{className:"label",children:"events captured"}),e.jsx("div",{className:"value",children:J})]}),e.jsxs("div",{className:"metric accent",children:[e.jsx("div",{className:"label",children:"dropped events"}),e.jsx("div",{className:"value",children:l})]}),e.jsxs("div",{className:"metric",children:[e.jsx("div",{className:"label",children:"map entries"}),e.jsx("div",{className:"value",children:H})]}),e.jsxs("div",{className:"metric",children:[e.jsx("div",{className:"label",children:"programs loaded"}),e.jsx("div",{className:"value",children:M})]})]})]})}let we=100,he=1;function at(t){const s={processes:[{pid:1,ppid:0,prog:"init",addr:"AS-1",fdTable:["stdin","stdout","stderr"],threads:[{tid:1}]}],log:[],selected:1};t.innerHTML=`
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
  `;const a=t.querySelector("#pp-stage"),m=t.querySelector("#pp-log");t.querySelector("#pp-fork").addEventListener("click",i),t.querySelector("#pp-exec").addEventListener("click",n),t.querySelector("#pp-thread").addEventListener("click",o),t.querySelector("#pp-exit").addEventListener("click",f),t.querySelector("#pp-reset").addEventListener("click",()=>{we=100,he=1,s.processes=[{pid:1,ppid:0,prog:"init",addr:"AS-1",fdTable:["stdin","stdout","stderr"],threads:[{tid:1}]}],s.log=[],s.selected=1,m.innerHTML="",g()});function i(){const r=s.processes.find(k=>k.pid===s.selected);if(!r)return;const l={pid:we++,ppid:r.pid,prog:r.prog,addr:"AS-"+r.pid+"."+we,fdTable:r.fdTable.slice(),threads:[{tid:he++}]};s.processes.push(l),u("ok",`fork(): parent PID=${r.pid} → child PID=${l.pid}. Child gets its own address space (COW) and a copy of the FD table.`),g()}function n(){const r=s.processes.find(k=>k.pid===s.selected);if(!r)return;const l="/bin/grep";r.prog=l,r.addr="AS-"+r.pid+"*",r.threads=[{tid:he++}],u("info",`exec("${l}"): PID=${r.pid} keeps its identity but loads a new program. FDs preserved; threads reset to one.`),g()}function o(){const r=s.processes.find(l=>l.pid===s.selected);r&&(r.threads.push({tid:he++}),u("ok",`pthread_create(): new thread TID=${r.threads[r.threads.length-1].tid} in PID=${r.pid}. Shares the address space + FD table with sibling threads.`),g())}function f(){const r=s.processes.find(l=>l.pid===s.selected);if(!r||r.pid===1){u("err","Can't exit init (PID 1) in this demo.");return}s.processes=s.processes.filter(l=>l.pid!==r.pid),u("info",`exit(): PID=${r.pid} terminated. Its address space, FDs, and threads are reclaimed by the kernel.`),s.selected=1,g()}function g(){let r='<div class="pp-grid">';s.processes.forEach(l=>{const k=l.pid===s.selected;r+=`
        <div class="pp-proc ${k?"sel":""}" data-pid="${l.pid}">
          <div class="pp-proc-name">PID ${l.pid} — ${d(l.prog)} <span class="pp-proc-ppid">ppid=${l.ppid}</span></div>
          <div class="pp-proc-sub">${l.addr}  ·  ${l.fdTable.length} fds</div>
          <div class="pp-threads">
            ${l.threads.map(M=>`<div class="pp-thread">TID ${M.tid}</div>`).join("")}
          </div>
        </div>
      `}),r+="</div>",r+=`<style>
      .pp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.6rem; }
      .pp-proc { background: #c8f0c8; border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; cursor: pointer; transition: transform 0.12s, box-shadow 0.12s; }
      .pp-proc:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--ink); }
      .pp-proc.sel { box-shadow: 4px 4px 0 var(--accent); border-color: var(--accent); transform: translate(-2px, -2px); }
      .pp-proc-name { font-family: var(--font-display); letter-spacing: 0.04em; font-size: 1rem; }
      .pp-proc-ppid { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); font-weight: normal; }
      .pp-proc-sub { font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-soft); margin-bottom: 0.4em; }
      .pp-threads { display: flex; gap: 0.3rem; flex-wrap: wrap; }
      .pp-thread { background: #ffe9b3; border: 1.5px solid var(--ink); border-radius: 2px; padding: 0.15em 0.4em; font-family: var(--font-mono); font-size: 0.7rem; }
    </style>`,a.innerHTML=r,a.querySelectorAll(".pp-proc").forEach(l=>l.addEventListener("click",()=>{s.selected=Number(l.dataset.pid),g()}))}function u(r,l){s.log.unshift({level:r,msg:l,t:new Date().toLocaleTimeString()});const k=document.createElement("div");for(k.className=`entry ${r}`,k.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${l}`,m.prepend(k);m.children.length>50;)m.removeChild(m.lastChild)}function d(r){return String(r).replace(/[&<>"']/g,l=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[l])}g()}const re=[{id:"A",arrival:0,burst:6,priority:2,color:"#cfe5ff"},{id:"B",arrival:1,burst:3,priority:1,color:"#c8f0c8"},{id:"C",arrival:2,burst:8,priority:3,color:"#ffe9b3"},{id:"D",arrival:3,burst:2,priority:1,color:"#f7c8c8"}],De={fcfs:"FCFS (first come, first served)",rr:"Round-robin (quantum=2)",sjf:"SJF (non-preemptive, shortest job)",prio:"Priority (lower = higher priority)",cfs:"CFS-like (fairness via vruntime)"};function ot(t){const s=re.map(o=>({...o,remaining:o.burst,vruntime:0})),a=[];let m=0;const i=100;for(;s.some(o=>o.remaining>0)&&m<i;){const o=s.filter(g=>g.arrival<=m&&g.remaining>0);if(!o.length){a.push({t:m,job:null}),m++;continue}let f;if(t==="fcfs"){f=o.sort((u,d)=>u.arrival-d.arrival)[0];const g=f.remaining;for(let u=0;u<g;u++)a.push({t:m+u,job:f.id});m+=g,f.remaining=0}else if(t==="sjf"){f=o.sort((u,d)=>u.remaining-d.remaining||u.arrival-d.arrival)[0];const g=f.remaining;for(let u=0;u<g;u++)a.push({t:m+u,job:f.id});m+=g,f.remaining=0}else if(t==="prio"){f=o.sort((u,d)=>u.priority-d.priority||u.arrival-d.arrival)[0];const g=f.remaining;for(let u=0;u<g;u++)a.push({t:m+u,job:f.id});m+=g,f.remaining=0}else if(t==="rr"){o.sort((r,l)=>r.arrival-l.arrival);const u={};for(let r=a.length-1;r>=0;r--){const l=a[r].job;l&&u[l]===void 0&&(u[l]=r)}f=o.sort((r,l)=>(u[r.id]??-1)-(u[l.id]??-1))[0];const d=Math.min(2,f.remaining);for(let r=0;r<d;r++)a.push({t:m+r,job:f.id});m+=d,f.remaining-=d}else if(t==="cfs"){f=o.sort((u,d)=>u.vruntime-d.vruntime||u.arrival-d.arrival)[0],a.push({t:m,job:f.id});const g=1/f.priority;f.vruntime+=1/g,f.remaining-=1,m+=1}}const n={};return re.forEach(o=>{const f=a.reduce((d,r)=>r.job===o.id?r.t+1:d,o.arrival),g=f-o.arrival,u=g-o.burst;n[o.id]={completion:f,turnaround:g,wait:u}}),{timeline:a,stats:n}}function lt(t){let s="fcfs";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">4 jobs, 1 CPU</div>

      <div class="controls">
        <label>Policy:</label>
        <select class="field" id="sc-policy">
          ${Object.entries(De).map(([i,n])=>`<option value="${i}">${n}</option>`).join("")}
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
  `;const a=t.querySelector("#sc-stage");t.querySelector("#sc-policy").addEventListener("change",i=>{s=i.target.value,m()});function m(){const{timeline:i,stats:n}=ot(s),o=i.length,f=720;let u=`<svg viewBox="0 0 ${f} 200" width="100%" style="max-width: ${f}px">`;u+=`<style>
      .sc-job-row { font-family: var(--font-display); font-size: 14px; letter-spacing: 1.5px; fill: var(--ink); }
      .sc-burst { stroke: var(--ink); stroke-width: 1.5; }
      .sc-axis { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .sc-track { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1; }
      .sc-arrival { stroke: var(--ink); stroke-width: 2; }
    </style>`;const d=60,r=f-20,l=(r-d)/o;for(let x=0;x<=o;x++){const w=d+x*l;u+=`<line x1="${w}" y1="155" x2="${w}" y2="160" stroke="var(--ink-soft)" stroke-width="1"/>`,x%2===0&&(u+=`<text class="sc-axis" x="${w}" y="172" text-anchor="middle">${x}</text>`)}u+=`<line x1="${d}" y1="160" x2="${r}" y2="160" stroke="var(--ink-soft)" stroke-width="1"/>`,u+='<text class="sc-job-row" x="20" y="115">CPU</text>',u+=`<rect class="sc-track" x="${d}" y="100" width="${r-d}" height="40" rx="3"/>`,i.forEach(x=>{if(!x.job)return;const w=d+x.t*l,b=re.find(P=>P.id===x.job);u+=`<rect class="sc-burst" x="${w}" y="100" width="${l}" height="40" fill="${b.color}"/>`,l>16&&(u+=`<text x="${w+l/2}" y="125" text-anchor="middle" style="font-family: var(--font-display); font-size: 14px; letter-spacing: 1px; fill: var(--ink);">${x.job}</text>`)}),re.forEach(x=>{const w=d+x.arrival*l;u+=`<line class="sc-arrival" x1="${w}" y1="60" x2="${w}" y2="100"/>`,u+=`<polygon points="${w-5},60 ${w+5},60 ${w},70" fill="${x.color}" stroke="var(--ink)" stroke-width="1.5"/>`,u+=`<text x="${w}" y="55" text-anchor="middle" class="sc-axis">${x.id}↓ burst:${x.burst} prio:${x.priority}</text>`}),u+="</svg>",a.innerHTML=u;const k=(Object.values(n).reduce((x,w)=>x+w.wait,0)/re.length).toFixed(1),M=(Object.values(n).reduce((x,w)=>x+w.turnaround,0)/re.length).toFixed(1);t.querySelector("#m-wait").textContent=k,t.querySelector("#m-tt").textContent=M,t.querySelector("#m-cpu").textContent=re.reduce((x,w)=>x+w.burst,0);let _=`<strong>${De[s]}</strong>. `;s==="fcfs"?_+="Jobs run in arrival order. Long jobs early can starve later short ones — see how D (burst=2, arrives at t=3) waits behind A and B.":s==="sjf"?_+="Always picks the shortest <em>remaining</em> job. Minimizes average wait time, at the cost of starving long jobs (C waits longest here).":s==="rr"?_+="Quantum=2. Every ready job gets 2 ticks before yielding. Fair but adds context-switch overhead (we ignore the overhead in this demo).":s==="prio"?_+="Lower priority number runs first. B and D (priority 1) preempt A (priority 2) and C (priority 3). Risk: starvation of priority-3 jobs.":s==="cfs"&&(_+='Each tick, the job with the lowest accumulated "virtual runtime" runs. Roughly equivalent to fair-share. Priority acts as a weight.'),t.querySelector("#sc-explain").innerHTML=_}m()}const U=32,Be=["#cfe5ff","#c8f0c8","#ffe9b3","#f7c8c8","#e6d6ff","#ffd9b3","#b3e6cc"];function dt(t){const s={heap:new Array(U).fill(null),chunks:[],nextId:1,strategy:"first",log:[]};t.innerHTML=`
    <div class="widget">
      <div class="widget-title">${U}-cell heap (1 cell = 1 KB, say)</div>

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
        <div class="metric"><div class="label">Free total</div><div class="value" id="m-free">${U}</div></div>
        <div class="metric"><div class="label">Largest free</div><div class="value" id="m-lf">${U}</div></div>
        <div class="metric accent"><div class="label">Fragmentation</div><div class="value" id="m-frag">0%</div></div>
      </div>

      <div class="log" id="mm-log"></div>
    </div>
  `;const a=t.querySelector("#mm-stage"),m=t.querySelector("#mm-log");t.querySelectorAll("input[name=mm-s]").forEach(d=>d.addEventListener("change",r=>{s.strategy=r.target.value})),t.querySelector("#mm-alloc").addEventListener("click",()=>{const d=Number(t.querySelector("#mm-size").value);i(d)}),t.querySelector("#mm-burst").addEventListener("click",async()=>{const d=[];for(let r=0;r<8;r++){const l=i(2);l&&d.push(l),await u(80)}for(let r=0;r<d.length;r+=2)n(d[r]),await u(80)}),t.querySelector("#mm-reset").addEventListener("click",()=>{s.heap=new Array(U).fill(null),s.chunks=[],s.nextId=1,s.log=[],m.innerHTML="",f()});function i(d){const r=o();let l=null;if(s.strategy==="first")l=r.find(_=>_.length>=d);else{const _=r.filter(x=>x.length>=d);_.sort((x,w)=>x.length-w.length),l=_[0]}if(!l)return g("err",`malloc(${d}): FAILED — fragmentation. Largest free run is only ${Math.max(0,...r.map(_=>_.length))} cells.`),f(),null;const k=s.nextId++,M=Be[(k-1)%Be.length];s.chunks.push({id:k,size:d,color:M});for(let _=l.start;_<l.start+d;_++)s.heap[_]=k;return g("ok",`malloc(${d}) → chunk #${k} at offset ${l.start}`),f(),k}function n(d){let r=0;for(let l=0;l<s.heap.length;l++)s.heap[l]===d&&(s.heap[l]=null,r++);r&&g("info",`free(#${d}) — ${r} cells returned`),f()}function o(){const d=[];let r=0;for(;r<U;)if(s.heap[r]===null){let l=r;for(;l<U&&s.heap[l]===null;)l++;d.push({start:r,length:l-r}),r=l}else r++;return d}function f(){let d="";for(let b=0;b<U;b++){const P=s.heap[b],h=P?s.chunks.find(X=>X.id===P):null,A=P&&(b===0||s.heap[b-1]!==P);d+=`<div class="mm-cell ${P?"used":"free"}" data-id="${P||""}" style="${h?`background: ${h.color};`:""}">
        ${A?`<span class="mm-cell-label">#${P}</span>`:""}
      </div>`}const r=s.chunks.filter(b=>s.heap.includes(b.id)).map(b=>`<button class="mm-chunk-btn" data-free="${b.id}" style="background: ${b.color};">free(#${b.id}) ${b.size}KB</button>`).join("");let l=`
      <div class="mm-heap">${d}</div>
      <div class="mm-chunks">${r||'<span style="color: var(--ink-faint); font-family: var(--font-mono); font-size: 0.8rem;">no live allocations</span>'}</div>
      <style>
        .mm-heap { display: grid; grid-template-columns: repeat(${U}, 1fr); gap: 2px; margin: 0.4rem 0 0.6rem; }
        .mm-cell { height: 36px; border: 1.5px solid var(--ink); border-radius: 2px; position: relative; }
        .mm-cell.free { background: var(--paper); }
        .mm-cell-label { position: absolute; left: 2px; top: 2px; font-family: var(--font-mono); font-size: 9px; }
        .mm-chunks { display: flex; gap: 0.3rem; flex-wrap: wrap; }
        .mm-chunk-btn { font-family: var(--font-mono); font-size: 0.78rem; border: 1.5px solid var(--ink); border-radius: 2px; padding: 0.2em 0.5em; cursor: pointer; }
        .mm-chunk-btn:hover { box-shadow: 2px 2px 0 var(--ink); }
      </style>
    `;a.innerHTML=l,a.querySelectorAll("button[data-free]").forEach(b=>b.addEventListener("click",()=>n(Number(b.dataset.free))));const k=s.heap.filter(b=>b!==null).length,M=U-k,_=o(),x=_.length?Math.max(..._.map(b=>b.length)):0,w=M===0?0:Math.round((1-x/M)*100);t.querySelector("#m-used").textContent=k,t.querySelector("#m-free").textContent=M,t.querySelector("#m-lf").textContent=x,t.querySelector("#m-frag").textContent=w+"%"}function g(d,r){const l=document.createElement("div");for(l.className=`entry ${d}`,l.innerHTML=`<span class="t">${new Date().toLocaleTimeString()}</span>${r}`,m.prepend(l);m.children.length>50;)m.removeChild(m.lastChild)}function u(d){return new Promise(r=>setTimeout(r,d))}f()}const Re={write:{num:1,args:["fd=1",'"hello\\n"',"len=6"],ret:"bytes_written=6",desc:"write data to a file descriptor"},read:{num:0,args:["fd=0","buf=0x7ff…","len=4096"],ret:"bytes_read=128",desc:"read from a file descriptor"},open:{num:2,args:['"/etc/hostname"',"O_RDONLY=0","mode=0"],ret:"fd=4",desc:"open a file, returns a new fd"},fork:{num:57,args:["(none)"],ret:"pid=8472 (child) or 0 (parent)",desc:"clone the current process"},exit:{num:60,args:["code=0"],ret:"(does not return)",desc:"terminate the process"}},ve=[{side:"user",label:"1. Application calls libc wrapper",detail:'printf("hello\\n") in C eventually calls write(1, "hello\\n", 6).'},{side:"user",label:"2. libc loads registers",detail:'rax = syscall number, rdi/rsi/rdx = arguments. Then "syscall" instruction.'},{side:"trap",label:"3. CPU traps to ring 0",detail:"Saves user-mode state, switches to kernel stack, jumps to entry_SYSCALL_64."},{side:"kernel",label:"4. Kernel dispatches",detail:"Looks up sys_call_table[rax], calls that function with the saved arg registers."},{side:"kernel",label:"5. Handler runs",detail:"The actual implementation runs — touch buffers, talk to drivers, etc."},{side:"trap",label:"6. Trap return (sysret)",detail:'Restores user-mode state, jumps back to the instruction after "syscall".'},{side:"user",label:"7. Control resumes in user code",detail:"rax holds the return value (or -errno on failure)."}];function ct(t){let s="write",a=0;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">User ↔ Kernel round trip</div>

      <div class="controls">
        <label>Syscall:</label>
        <select class="field" id="sy-call">
          ${Object.entries(Re).map(([n,o])=>`<option value="${n}">${n}(${o.args.join(", ")})  → ${o.ret}</option>`).join("")}
        </select>
        <button class="btn btn-accent" id="sy-step">Next step →</button>
        <button class="btn btn-ghost" id="sy-reset">Reset</button>
      </div>

      <div class="widget-stage" id="sy-stage" style="min-height: 320px;"></div>
      <div class="callout" id="sy-note"></div>
    </div>
  `,t.querySelector("#sy-call").addEventListener("change",n=>{s=n.target.value,a=0,m()}),t.querySelector("#sy-step").addEventListener("click",()=>{a<ve.length&&a++,m()}),t.querySelector("#sy-reset").addEventListener("click",()=>{a=0,m()});function m(){const n=a===0?null:ve[a-1],o=(n==null?void 0:n.side)??"idle",f=Re[s];let g=`
      <div class="sy-ring">
        <div class="sy-zone user ${o==="user"?"active":""}">
          <div class="sy-zone-label">USER MODE (ring 3)</div>
          <pre>${s}(${f.args.join(", ")});</pre>
          ${o==="user"&&a>=2?`<div class="sy-reg">rax=${f.num} (syscall #)</div>`:""}
          ${a>=ve.length?`<div class="sy-result">→ ${i(f.ret)}</div>`:""}
        </div>

        <div class="sy-trap ${o==="trap"?"active":""}">
          ${o==="trap"?"⚡ TRAP":"· · ·"}
        </div>

        <div class="sy-zone kernel ${o==="kernel"?"active":""}">
          <div class="sy-zone-label">KERNEL MODE (ring 0)</div>
          <pre>sys_call_table[${f.num}]
  → sys_${s}(${f.args.join(", ")})</pre>
          ${o==="kernel"&&a>=4?`<div class="sy-reg">handler: ${i(f.desc)}</div>`:""}
        </div>
      </div>

      <div class="sy-steps">
        ${ve.map((u,d)=>`
          <div class="sy-step ${d<a?"done":""} ${d===a-1?"cur":""}">
            <div class="sy-step-num">${String(d+1).padStart(2,"0")}</div>
            <div class="sy-step-label">${i(u.label)}</div>
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
    `;t.querySelector("#sy-stage").innerHTML=g,t.querySelector("#sy-note").innerHTML=n?n.detail:'Pick a syscall and click "Next step →".'}function i(n){return String(n).replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}m()}const qe={base:{label:"Start: fresh shell",description:"Three default FDs in each process, pointing to the terminal.",procs:[{name:"shell",fds:{0:"tty (read)",1:"tty (write)",2:"tty (write)"}}]},open:{label:'fd = open("foo.txt")',description:"open() returns the lowest free FD — here 3. The file now appears in the table.",procs:[{name:"shell",fds:{0:"tty (read)",1:"tty (write)",2:"tty (write)",3:"foo.txt (file)"}}]},redirOut:{label:"shell: ls > out.txt",description:'Shell forks. Child opens out.txt (gets fd 3), then dup2(3, 1) overwrites stdout. exec("ls"). Now writes go to the file, not the terminal.',procs:[{name:"shell",fds:{0:"tty (read)",1:"tty (write)",2:"tty (write)"}},{name:"ls (child)",fds:{0:"tty (read)",1:"out.txt (file)",2:"tty (write)"}}]},pipe:{label:"shell: cat foo | grep bar",description:"pipe() returns two FDs: read end + write end. Shell forks twice, dup2 to wire cat's stdout → pipe write, grep's stdin → pipe read. Both think they're using normal stdin/stdout.",procs:[{name:"cat (child)",fds:{0:"foo.txt (file)",1:"pipe (write)",2:"tty (write)"}},{name:"grep (child)",fds:{0:"pipe (read)",1:"tty (write)",2:"tty (write)"}}],pipe:!0},socket:{label:"server: socket() + accept()",description:"A socket is just another FD. accept() returns a new FD for the client connection. Same read/write API as files.",procs:[{name:"server",fds:{0:"tty (read)",1:"tty (write)",2:"tty (write)",3:"tcp:8080 (listen)",4:"tcp client (accepted)"}}]}};function pt(t){let s="base";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">FD tables in action</div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="fd-scen" style="min-width: 280px;">
          ${Object.entries(qe).map(([i,n])=>`<option value="${i}">${n.label}</option>`).join("")}
        </select>
      </div>

      <div class="widget-stage" id="fd-stage" style="min-height: 240px;"></div>

      <div class="callout" id="fd-note"></div>
    </div>
  `,t.querySelector("#fd-scen").addEventListener("change",i=>{s=i.target.value,a()});function a(){const i=qe[s];let n='<div class="fd-procs">';i.procs.forEach(o=>{n+=`<div class="fd-proc">
        <div class="fd-proc-name">${m(o.name)}</div>
        <table class="fd-table">
          <thead><tr><th>fd</th><th>points to</th></tr></thead>
          <tbody>
            ${Object.entries(o.fds).map(([f,g])=>{const u=f==="0"?"stdin":f==="1"?"stdout":f==="2"?"stderr":"opened",d=g.includes("pipe")?"pipe":g.includes("file")||g.includes("foo")||g.includes("out")?"file":g.includes("tcp")?"sock":"tty";return`<tr><td><code>${f}</code> <span class="fd-kind">${u}</span></td><td><span class="fd-target ${d}">${m(g)}</span></td></tr>`}).join("")}
          </tbody>
        </table>
      </div>`}),n+="</div>",i.pipe&&(n+='<div class="fd-pipe-note">⤷ The "pipe (write)" in cat and "pipe (read)" in grep are <strong>two FDs pointing at the same kernel buffer</strong>. Bytes written to one come out the other.</div>'),n+=`<style>
      .fd-procs { display: grid; grid-template-columns: ${i.procs.length>1?"1fr 1fr":"1fr"}; gap: 0.6rem; }
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
    </style>`,t.querySelector("#fd-stage").innerHTML=n,t.querySelector("#fd-note").innerHTML=i.description}function m(i){return String(i).replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}a()}const mt={race:{label:"Race condition (counter++ × 2 threads, 100 iterations each)"},deadlock:{label:"Deadlock (T1: lock M1→M2; T2: lock M2→M1)"}};function ut(t){let s="race",a=!1;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Two threads, shared state</div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="cc-scen">
          ${Object.entries(mt).map(([d,r])=>`<option value="${d}">${r.label}</option>`).join("")}
        </select>
        <label id="cc-mutex-wrap"><input type="checkbox" id="cc-mutex"> use mutex</label>
        <button class="btn btn-accent" id="cc-run">Run</button>
        <button class="btn btn-ghost" id="cc-reset">Reset</button>
      </div>

      <div class="widget-stage" id="cc-stage" style="min-height: 280px;"></div>

      <div class="callout" id="cc-explain"></div>
    </div>
  `;const m=t.querySelector("#cc-stage");t.querySelector("#cc-scen").addEventListener("change",d=>{s=d.target.value,n()}),t.querySelector("#cc-mutex").addEventListener("change",d=>{a=d.target.checked}),t.querySelector("#cc-run").addEventListener("click",g),t.querySelector("#cc-reset").addEventListener("click",n);let i=null;function n(){i=null,u()}function o(){let d=0;const r=100;if(a)return d=r*2,{counter:d,expected:r*2,lost:0};let l=0;for(let k=0;k<r;k++)Math.random()<.1?l++:d++;for(let k=0;k<r;k++)Math.random()<.1?l++:d++;return{counter:d,expected:r*2,lost:l}}function f(){return{deadlock:!0}}function g(){s==="race"?i={type:"race",...o()}:i={type:"deadlock",...f()},u()}function u(){const d=t.querySelector("#cc-mutex-wrap");d.style.display=s==="race"?"inline-flex":"none";let r="";if(s==="race"){if(r=`
        <div class="cc-grid">
          <div class="cc-thread t1">
            <div class="cc-thread-name">Thread 1</div>
            <pre>for i in 1..100:
  ${a?`mu.lock()
  `:""}counter++${a?`
  mu.unlock()`:""}</pre>
          </div>
          <div class="cc-shared">
            <div class="cc-shared-label">SHARED</div>
            <div class="cc-counter">counter = ${i?i.counter:"0"}</div>
            ${a?'<div class="cc-mutex-state">🔒 mutex</div>':""}
          </div>
          <div class="cc-thread t2">
            <div class="cc-thread-name">Thread 2</div>
            <pre>for i in 1..100:
  ${a?`mu.lock()
  `:""}counter++${a?`
  mu.unlock()`:""}</pre>
          </div>
        </div>
      `,i){const k=i.counter===i.expected;r+=`<div class="cc-result ${k?"good":"bad"}">
          Final counter: <strong>${i.counter}</strong> (expected ${i.expected}). ${i.lost?`${i.lost} increments lost to races.`:"No lost updates."}
        </div>`}}else r=`
        <div class="cc-grid">
          <div class="cc-thread t1">
            <div class="cc-thread-name">Thread 1</div>
            <pre>m1.lock()
${i?`🔒 acquired M1
`:""}m2.lock()  ←  ${i?"⏳ waits forever (T2 holds M2)":""}
critical_section()
m2.unlock()
m1.unlock()</pre>
          </div>
          <div class="cc-shared">
            <div class="cc-shared-label">MUTEXES</div>
            <div class="cc-mutex-state ${i?"held-1":""}">🔒 M1 ${i?"(held by T1)":"(free)"}</div>
            <div class="cc-mutex-state ${i?"held-2":""}">🔒 M2 ${i?"(held by T2)":"(free)"}</div>
          </div>
          <div class="cc-thread t2">
            <div class="cc-thread-name">Thread 2</div>
            <pre>m2.lock()
${i?`🔒 acquired M2
`:""}m1.lock()  ←  ${i?"⏳ waits forever (T1 holds M1)":""}
critical_section()
m1.unlock()
m2.unlock()</pre>
          </div>
        </div>
      `,i&&(r+='<div class="cc-result bad">💀 <strong>Deadlock.</strong> Each thread holds one mutex and waits for the other. Neither will ever proceed.</div>');r+=`<style>
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
    </style>`,m.innerHTML=r;let l;s==="race"?i?a?l="<strong>Correct result.</strong> The mutex serialized the two threads' critical sections, so every increment counted.":l=`<strong>${i.lost} lost updates.</strong> The race is silent — your "counter++" looks atomic in source but isn't on the hardware. Add a mutex (or use atomic_fetch_add).`:l=`Click Run. Without the mutex, each thread's "counter++" can interleave at the instruction level, dropping updates.`:i?l="<strong>Classic AB-BA deadlock.</strong> Fix: agree on a global lock ordering (e.g. always M1 before M2). Tools (deadlock detectors, runtime checks, static analyzers) can catch this in development.":l="Click Run. Both threads succeed at locking their first mutex, then wait forever for the second.",t.querySelector("#cc-explain").innerHTML=l}n()}const je={pipe:{label:"Pipe",throughput:30,kernelMediated:!0,usecase:"Shell pipelines, parent↔child streaming",seq:["parent: pipe(fds) → [r=3, w=4]","parent: fork()","parent: close(3)  (only writes)","child:  close(4)  (only reads)",'parent: write(4, "hello", 5)','child:  read(3, buf, 5) → "hello"'],code:`int fd[2];
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
write(s, "hello", 5);`}};function ft(t){let s="pipe";t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Pick your IPC</div>

      <div class="controls" id="ip-tabs">
        <div class="pill-group">
          ${Object.entries(je).map(([i,n],o)=>`
            <input type="radio" name="ip-m" id="ip-${i}" value="${i}" ${o===0?"checked":""}>
            <label for="ip-${i}">${n.label}</label>
          `).join("")}
        </div>
      </div>

      <div class="widget-stage" id="ip-stage" style="min-height: 380px;"></div>
    </div>
  `,t.querySelectorAll("input[name=ip-m]").forEach(i=>i.addEventListener("change",n=>{s=n.target.value,a()}));function a(){const i=je[s],n=Math.max(...Object.values(je).map(g=>g.throughput));let f=`
      <div class="ip-grid">
        <div class="ip-bar-block">
          <div class="ip-bar-label">RELATIVE THROUGHPUT</div>
          <div class="ip-bar"><div class="ip-bar-fill" style="width: ${i.throughput/n*100}%;">${i.throughput}</div></div>
          <div class="ip-bar-axis"><span>0</span><span>${n} (shm = baseline)</span></div>
          <div class="ip-meta">
            <div><strong>Kernel-mediated:</strong> ${i.kernelMediated?"Yes (syscall per send/recv)":"No (direct memory)"}</div>
            <div><strong>Best for:</strong> ${m(i.usecase)}</div>
          </div>
        </div>

        <div class="ip-seq-block">
          <div class="ip-seq-label">EXCHANGE SEQUENCE</div>
          <ol class="ip-seq">
            ${i.seq.map(g=>`<li>${m(g)}</li>`).join("")}
          </ol>
        </div>

        <div class="ip-code-block">
          <div class="ip-seq-label">SAMPLE CODE</div>
          <pre>${m(i.code)}</pre>
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
    `;t.querySelector("#ip-stage").innerHTML=f}function m(i){return String(i).replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}a()}const ie=[{id:"pid",label:"PID",hostView:"PIDs 1, 2, 3, …, 14523 (entire system)",containedView:"PIDs 1 (this proc), 2 (its child)",effect:"kill 1 outside the container kills init; kill 1 inside only kills the container."},{id:"net",label:"NET",hostView:"eth0 192.168.1.10, docker0, lo, plus 100 other veth pairs",containedView:"eth0 172.17.0.5, lo (own loopback)",effect:"Your container can bind port 80 even if the host has port 80 taken."},{id:"mnt",label:"MNT",hostView:"/, /home, /var, /etc — full host filesystem",containedView:"/ (from image), /etc/hosts, /etc/resolv.conf, /sys (limited)",effect:`Container "/" is actually an overlay mount; the host's "/" is invisible.`},{id:"uts",label:"UTS",hostView:"hostname: my-laptop",containedView:"hostname: a3f9c8d2b1e0",effect:"`hostname new-name` inside doesn't change the host."},{id:"ipc",label:"IPC",hostView:"shared mem segments + sysv queues from all processes",containedView:"only the container's own IPC objects",effect:"Two containers can't share posix shm by accident."},{id:"user",label:"USER",hostView:"uid 1000 (xthewiz), uid 0 (root), …",containedView:"uid 0 (root inside) → mapped to uid 100000 on host",effect:'Container "root" has no actual host privileges. Modern, recommended.'}],ht=[{id:"cpu",label:"CPU",value:"50% of one core",desc:'cpu.max = "50000 100000"'},{id:"mem",label:"Memory",value:"512 MB",desc:'memory.max = "536870912"'},{id:"io",label:"Block I/O",value:"10 MB/s read",desc:'io.max = "8:0 rbps=10485760"'},{id:"pids",label:"Max PIDs",value:"100",desc:'pids.max = "100"'}];function vt(t){const s=new Set;t.innerHTML=`
    <div class="widget">
      <div class="widget-title">Build a container, namespace by namespace</div>

      <div class="controls">
        <strong>Namespaces:</strong>
        ${ie.map(i=>`
          <label style="display: inline-flex; gap: 0.25em; align-items: center;">
            <input type="checkbox" data-ns="${i.id}"> ${i.label}
          </label>
        `).join("")}
        <button class="btn" id="ct-all">All on</button>
        <button class="btn btn-ghost" id="ct-none">Reset</button>
      </div>

      <div class="widget-stage" id="ct-stage" style="min-height: 380px;"></div>
    </div>
  `,t.querySelectorAll("input[data-ns]").forEach(i=>i.addEventListener("change",n=>{n.target.checked?s.add(n.target.dataset.ns):s.delete(n.target.dataset.ns),a()})),t.querySelector("#ct-all").addEventListener("click",()=>{ie.forEach(i=>s.add(i.id)),t.querySelectorAll("input[data-ns]").forEach(i=>i.checked=!0),a()}),t.querySelector("#ct-none").addEventListener("click",()=>{s.clear(),t.querySelectorAll("input[data-ns]").forEach(i=>i.checked=!1),a()});function a(){let i=`
      <div class="ct-grid">
        <div class="ct-side host">
          <div class="ct-side-label">HOST KERNEL</div>
          <div class="ct-content">
    `;ie.forEach(n=>{i+=`<div class="ct-ns-row"><strong>${n.label}:</strong> ${m(n.hostView)}</div>`}),i+=`</div></div>
        <div class="ct-side container">
          <div class="ct-side-label">CONTAINER VIEW</div>
          <div class="ct-content">
    `,ie.forEach(n=>{const o=s.has(n.id);i+=`<div class="ct-ns-row ${o?"isolated":"shared"}">
        <strong>${n.label}:</strong> ${m(o?n.containedView:n.hostView)}
        ${o?'<span class="ct-tag iso">isolated</span>':'<span class="ct-tag shr">shared with host</span>'}
      </div>`}),i+=`</div></div>
      </div>

      <div class="ct-cgroups">
        <div class="ct-side-label">CGROUPS (resource limits) — always on for a real container</div>
        <div class="ct-cgroup-grid">
          ${ht.map(n=>`
            <div class="ct-cgroup">
              <div class="ct-cgroup-name">${n.label}</div>
              <div class="ct-cgroup-val">${n.value}</div>
              <div class="ct-cgroup-desc">${m(n.desc)}</div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="ct-summary">
        ${s.size===0?"0 namespaces enabled — this is just a normal process. No isolation yet.":s.size===ie.size?`<strong>${s.size}/${ie.size} namespaces enabled — congratulations, you have a container.</strong> This is roughly what \`docker run\` configures for you.`:`${s.size}/${ie.size} namespaces enabled. The rest are shared with the host — partial isolation.`}
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
    `,t.querySelector("#ct-stage").innerHTML=i}function m(i){return String(i).replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}a()}const Q=t=>()=>e.jsx(Ue,{init:t}),xt={slug:"operating-systems",title:"Operating Systems",intro:e.jsx(e.Fragment,{children:"Eight lessons walking the kernel surface — processes, threads, the scheduler, memory allocation, syscalls, file descriptors, concurrency primitives, IPC, and how containers are built from kernel features."}),lessons:[{slug:"processes",number:"01",title:"Processes vs Threads",blurb:"Same word, different boundaries. fork(), exec(), address spaces.",Widget:Q(at),intro:e.jsx(e.Fragment,{children:"A process has its own address space; threads share one. The kernel schedules both, but the isolation cost is wildly different."}),sections:[],takeaways:["fork() clones the process; exec() replaces the running program in it.","Threads share heap, globals, and FDs — race conditions abound.","Process creation is ~1 ms, thread creation is ~10 μs. Use threads for parallelism within one program.","Coroutines/goroutines/async are user-space versions — even cheaper."]},{slug:"scheduler",number:"02",title:"The Scheduler",blurb:"Many tasks, few CPUs. Watch round-robin, priority, and CFS spread CPU time.",Widget:Q(lt),intro:e.jsx(e.Fragment,{children:"The scheduler decides who runs next. Linux\\'s CFS uses virtual runtime to keep all runnable tasks fair; priorities and cgroups bias the decision."}),sections:[],takeaways:["Round-robin: simple, fair, ignores priority. Used in nothing serious.","Priority: high-priority tasks always preempt — risk of starvation.","CFS: pick the task with the lowest virtual runtime so far. Fair but priority-aware.","Real-time schedulers (SCHED_FIFO) guarantee deadlines — at the cost of letting tasks hog the CPU."]},{slug:"memory",number:"03",title:"Memory Allocation",blurb:"malloc / free in slow motion.",Widget:Q(dt),intro:e.jsx(e.Fragment,{children:"The heap grows by mmap()ing pages from the kernel and handing out chunks. Fragmentation is the enemy — efficient allocators (jemalloc, tcmalloc) keep the heap dense."}),sections:[],takeaways:["malloc returns memory the kernel has reserved but not necessarily backed by RAM.","Free doesn't always give memory back to the OS — it returns to the allocator's free list.","Fragmentation: lots of free space, but no contiguous block big enough.","Modern allocators use thread-local arenas to avoid lock contention."]},{slug:"syscalls",number:"04",title:"Syscalls",blurb:"Your code runs in user mode; the kernel runs in ring 0. The trap that bridges them is the syscall.",Widget:Q(ct),intro:e.jsx(e.Fragment,{children:"Every disk read, every network send, every fork — they all cross into the kernel via a syscall. The transition is expensive on purpose."}),sections:[],takeaways:["User mode can't directly touch hardware — must ask the kernel.","A syscall traps to ring 0, kernel handles it, returns. ~100 ns overhead each.","Batching syscalls is critical — io_uring, sendfile, splice.","strace shows every syscall a program makes. Worth running on confusing apps."]},{slug:"fd",number:"05",title:"File Descriptors & Pipes",blurb:"In Unix everything is a file.",Widget:Q(pt),intro:e.jsx(e.Fragment,{children:"Every open file, socket, pipe, and device gets a small integer — the file descriptor. The kernel keeps a table mapping FD → kernel object per process."}),sections:[],takeaways:["stdin=0, stdout=1, stderr=2 by convention.","dup2 redirects an FD to point at another — the basis of shell redirection.","Pipes are pairs of FDs: write to one, read from the other.","Forgetting to close FDs leaks them — eventually you hit ulimit."]},{slug:"concurrency",number:"06",title:"Concurrency Primitives",blurb:"Two threads, one counter, racing. Wrap a mutex.",Widget:Q(ut),intro:e.jsx(e.Fragment,{children:"Shared mutable state across threads is the source of most bugs. Mutexes serialize access; condition variables let threads wait for state changes."}),sections:[],takeaways:["Atomicity: read-modify-write must be one indivisible operation.","Mutex: only one thread inside the critical section.","Always lock in the same global order — otherwise you deadlock.","Lock-free structures (CAS, RCU) avoid mutex contention but are very hard to get right."]},{slug:"ipc",number:"07",title:"Inter-Process Communication",blurb:"Pipes, shared memory, sockets, signals.",Widget:Q(ft),intro:e.jsx(e.Fragment,{children:"Processes need to talk. Choose the mechanism by latency, bandwidth, and whether you need the kernel to mediate."}),sections:[],takeaways:["Pipes/FIFOs: byte streams, kernel buffered. Easy.","Shared memory: fastest possible. Need your own locking.","Unix domain sockets: like TCP but local — supports passing FDs.","Signals: short notification, no payload. Easy to mess up."]},{slug:"containers",number:"08",title:"Containers (namespaces + cgroups)",blurb:"What Docker actually is.",Widget:Q(vt),intro:e.jsx(e.Fragment,{children:"Containers aren\\'t VMs. They\\'re processes with restricted views of the kernel — namespaces hide what they can see, cgroups cap what they can use."}),sections:[],takeaways:["Namespaces: PID, mount, network, user, UTS, IPC. Each hides part of the host.","cgroups: CPU shares, memory limits, IO throttling.","Docker = namespaces + cgroups + a layered filesystem + a packaging format.","Containers share the host kernel — VMs do not. Faster, less isolated."]},{slug:"filesystems",number:"09",title:"Filesystems (inodes, journaling, COW)",blurb:"Map /home/user/file.txt to actual disk blocks. Crash mid-write — does journaling save you?",Widget:Ye,intro:e.jsx(e.Fragment,{children:'A filesystem is a tree of directories, files, and metadata laid over a flat block device. Inodes hold the metadata; data blocks hold the bytes; directory entries map names to inodes. Crash recovery — journaling vs copy-on-write — is what separates "files lost" from "files intact".'}),sections:[],takeaways:["Inode = metadata (permissions, size, block pointers). Filename lives in the directory entry, not the inode — hence hardlinks.","Journaling (ext4, NTFS): write intent to a log, then apply. Replay on crash.","Copy-on-write (ZFS, btrfs): write new blocks, atomically swap the pointer. Old data stays valid until GC.","fsync is the only durability boundary you can rely on. Buffer cache lies until you call it."]},{slug:"virtual-memory",number:"10",title:"Virtual Memory Deep Dive (page tables, TLB)",blurb:"Translate a virtual address to a physical frame. Watch the TLB cache the walk.",Widget:Je,intro:e.jsx(e.Fragment,{children:"Every memory access your code makes goes through the MMU\\'s page-table walk — unless the TLB has already cached the translation. Faults bring in pages from disk and possibly evict others. The whole performance picture of your program is shaped by how well its memory access pattern fits the TLB and the resident set."}),sections:[],takeaways:["Multi-level page tables let huge virtual address spaces stay sparse on disk.","TLB caches recent translations. Hit = nanoseconds; miss = hundreds of cycles for the walk.","Page faults pull in absent pages — major fault if disk-bound, minor if just unmapped.","Working set > TLB → translation overhead spikes. Working set > RAM → thrash."]},{slug:"ebpf",number:"11",title:"eBPF & Kernel Observability",blurb:"Attach a safe little program to a kernel hook. Trace syscalls, packets, anything.",Widget:nt,intro:e.jsx(e.Fragment,{children:"eBPF lets userspace ship small programs that run in-kernel at trace points, syscalls, packet hooks, and function entries — sandboxed by a verifier that proves termination and memory safety before load. The result: production observability and networking without recompiling the kernel."}),sections:[],takeaways:["The verifier is the safety net — it rejects unbounded loops, out-of-bounds reads, forbidden helpers.","Maps are shared key/value stores between kernel programs and userspace.","Hook types: kprobes (function entry), tracepoints (stable events), uprobes (user functions), XDP (packets), LSM (security).","Production users: Cilium (networking), Falco (security), bpftrace (one-liners), Pixie (observability)."]}]};export{xt as manifest};
