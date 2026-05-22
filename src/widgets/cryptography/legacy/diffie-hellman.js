// Diffie-Hellman widget: paint-mixing visualization across 5 steps.
// Three columns (Alice, Eve, Bob). Each step adds one paint blob.
// Math sidebar shows the real exponents.

const COLORS = {
  base:        '#f5d76e',  // yellow (public g)
  aliceSecret: '#d62828',  // red (Alice's a)
  bobSecret:   '#1c6dd0',  // blue (Bob's b)
};

function mix(...hexes) {
  // Average RGB
  const rgbs = hexes.map(h => [
    parseInt(h.slice(1,3), 16),
    parseInt(h.slice(3,5), 16),
    parseInt(h.slice(5,7), 16),
  ]);
  const n = rgbs.length;
  const r = Math.round(rgbs.reduce((a, c) => a + c[0], 0) / n);
  const g = Math.round(rgbs.reduce((a, c) => a + c[1], 0) / n);
  const b = Math.round(rgbs.reduce((a, c) => a + c[2], 0) / n);
  return `#${[r,g,b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

// concrete tiny example: p=23, g=5, a=6, b=15
// A = 5^6 mod 23 = 8 ; B = 5^15 mod 23 = 19 ; secret = 8^15 mod 23 = 19^6 mod 23 = 2
const MATH = { p: 23, g: 5, a: 6, b: 15 };
function powMod(b, e, m) { let r = 1n; b = BigInt(b) % BigInt(m); e = BigInt(e); m = BigInt(m); while (e > 0n) { if (e & 1n) r = (r * b) % m; e >>= 1n; b = (b * b) % m; } return Number(r); }
const A_pub = powMod(MATH.g, MATH.a, MATH.p);
const B_pub = powMod(MATH.g, MATH.b, MATH.p);
const SHARED_FROM_ALICE = powMod(B_pub, MATH.a, MATH.p);
const SHARED_FROM_BOB = powMod(A_pub, MATH.b, MATH.p);

const STEPS = [
  {
    label: '1. Public agreement',
    alice: { has: ['base'] },
    bob:   { has: ['base'] },
    eve:   { sees: ['base'] },
    math:  `Public: p=${MATH.p}, g=${MATH.g}`,
    note:  'Alice and Bob agree on a common color (paint analogy) — equivalently, a prime and a base (the math). Eve hears this in the open. That\'s fine.',
  },
  {
    label: '2. Secrets chosen',
    alice: { has: ['base', 'aliceSecret'], secret: true },
    bob:   { has: ['base', 'bobSecret'], secret: true },
    eve:   { sees: ['base'] },
    math:  `Alice picks a=${MATH.a}.  Bob picks b=${MATH.b}.  (Eve sees neither.)`,
    note:  'Each picks a private secret. These never leave their owners — they\'re the only thing Eve can\'t see.',
  },
  {
    label: '3. Mix and send',
    alice: { has: ['base', 'aliceSecret'], sends: mix(COLORS.base, COLORS.aliceSecret), secret: true },
    bob:   { has: ['base', 'bobSecret'], sends: mix(COLORS.base, COLORS.bobSecret), secret: true },
    eve:   { sees: ['base', mix(COLORS.base, COLORS.aliceSecret), mix(COLORS.base, COLORS.bobSecret)] },
    math:  `Alice sends A = g^a mod p = ${A_pub}.   Bob sends B = g^b mod p = ${B_pub}.   Eve copies both.`,
    note:  'Each mixes secret + base. The result is sent in the clear. Eve now has the base, Alice\'s mix, and Bob\'s mix — but no way to extract either secret.',
  },
  {
    label: '4. Mix again with own secret',
    alice: { has: ['base', 'aliceSecret', mix(COLORS.base, COLORS.bobSecret)], secret: true, computing: true },
    bob:   { has: ['base', 'bobSecret', mix(COLORS.base, COLORS.aliceSecret)], secret: true, computing: true },
    eve:   { sees: ['base', mix(COLORS.base, COLORS.aliceSecret), mix(COLORS.base, COLORS.bobSecret)], stuck: true },
    math:  `Alice computes B^a mod p = ${SHARED_FROM_ALICE}.   Bob computes A^b mod p = ${SHARED_FROM_BOB}.   Both equal g^(ab) mod p.`,
    note:  'Each mixes the received color into their own secret. The result is the same final color — because mixing is commutative.',
  },
  {
    label: '5. Shared secret derived',
    alice: { has: [mix(COLORS.base, COLORS.aliceSecret, COLORS.bobSecret)], final: true },
    bob:   { has: [mix(COLORS.base, COLORS.aliceSecret, COLORS.bobSecret)], final: true },
    eve:   { sees: ['base', mix(COLORS.base, COLORS.aliceSecret), mix(COLORS.base, COLORS.bobSecret)], stuck: true },
    math:  `Shared secret = ${SHARED_FROM_ALICE}.  Eve has p, g, A, B — and needs to solve "discrete log" to recover the secret. Infeasible at real-world key sizes.`,
    note:  'Both Alice and Bob now hold the same final color. Eve has only the three transmitted colors and can\'t un-mix to reach the final. They derive the same secret without ever sending it.',
  },
];

export function initDhWidget(root) {
  let step = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">The Paint Mixing</div>

      <div class="controls">
        <button class="btn" id="dh-prev">← Back</button>
        <button class="btn btn-accent" id="dh-next">Next step →</button>
        <button class="btn btn-ghost" id="dh-reset">Reset</button>
        <span style="margin-left:auto; font-family: var(--font-mono); color: var(--ink-soft);" id="dh-counter">0 / ${STEPS.length}</span>
      </div>

      <div class="widget-stage" id="dh-stage" style="min-height: 320px;"></div>

      <div class="cy-key-label">MATH (toy values for illustration)</div>
      <div class="cy-hex" id="dh-math">—</div>

      <div class="callout" id="dh-note">Click "Next step →" to begin.</div>
    </div>
  `;

  root.querySelector('#dh-next').addEventListener('click', () => { if (step < STEPS.length) step++; render(); });
  root.querySelector('#dh-prev').addEventListener('click', () => { if (step > 0) step--; render(); });
  root.querySelector('#dh-reset').addEventListener('click', () => { step = 0; render(); });

  function render() {
    root.querySelector('#dh-counter').textContent = `${step} / ${STEPS.length}`;
    const cur = step > 0 ? STEPS[step - 1] : null;

    const cols = [
      { name: 'ALICE',  data: cur?.alice ?? { has: [] }, bg: '#fff6dc' },
      { name: 'WIRE / EVE', data: cur?.eve   ?? { sees: [] }, bg: '#f4f4f4', isEve: true },
      { name: 'BOB',    data: cur?.bob   ?? { has: [] }, bg: '#fff6dc' },
    ];

    let html = `<div class="dh-grid">`;
    cols.forEach((col) => {
      html += `<div class="dh-col" style="background: ${col.bg};">`;
      html += `<div class="dh-col-name">${col.name}</div>`;
      const items = col.isEve ? (col.data.sees || []) : (col.data.has || []);
      items.forEach((it) => {
        const hex = it.startsWith && it.startsWith('#') ? it : COLORS[it];
        html += `<div class="dh-blob" style="background: ${hex}; ${col.isEve ? '' : 'box-shadow: 3px 3px 0 var(--ink);'}"></div>`;
      });
      if (col.data.sends) {
        html += `<div class="dh-arrow">→ sent →</div>`;
        html += `<div class="dh-blob" style="background: ${col.data.sends};"></div>`;
      }
      if (col.data.secret) html += `<div class="dh-tag">🔒 has private secret</div>`;
      if (col.data.computing) html += `<div class="dh-tag">⚙ mixing…</div>`;
      if (col.data.final) html += `<div class="dh-tag" style="background:#d6f5d6; color: #2a8a3e;">✓ shared secret derived</div>`;
      if (col.data.stuck) html += `<div class="dh-tag" style="background:#f7c8c8; color: var(--accent);">✗ can't un-mix</div>`;
      html += `</div>`;
    });
    html += `</div>`;
    html += `<style>
      .dh-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.6rem; }
      .dh-col { border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem; display: flex; flex-direction: column; align-items: center; min-height: 240px; }
      .dh-col-name { font-family: var(--font-display); letter-spacing: 2px; font-size: 1rem; margin-bottom: 0.6rem; }
      .dh-blob { width: 60px; height: 60px; border-radius: 50%; border: 2.5px solid var(--ink); margin: 0.2rem 0; }
      .dh-arrow { font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0; }
      .dh-tag { font-family: var(--font-mono); font-size: 0.75rem; padding: 0.2em 0.5em; border: 1.5px solid var(--ink); border-radius: 2px; margin-top: 0.5rem; background: var(--paper); }
      @media (max-width: 640px) { .dh-grid { grid-template-columns: 1fr; } .dh-col { min-height: 120px; } }
    </style>`;
    root.querySelector('#dh-stage').innerHTML = html;

    root.querySelector('#dh-math').textContent = cur ? cur.math : '— pick a step —';
    root.querySelector('#dh-note').innerHTML = cur ? cur.note : 'Click "Next step →" to begin.';
  }

  render();
}
