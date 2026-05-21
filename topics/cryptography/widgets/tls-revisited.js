// TLS Revisited widget: step through TLS 1.3 handshake messages with
// a side panel showing which crypto primitives activate at each step.

const PRIMITIVES = [
  { id: 'hash',    label: 'Hashing',          link: 'hashing.html' },
  { id: 'sym',     label: 'Symmetric',        link: 'symmetric.html' },
  { id: 'asym',    label: 'Asymmetric',       link: 'asymmetric.html' },
  { id: 'dh',      label: 'Diffie-Hellman',   link: 'diffie-hellman.html' },
  { id: 'sig',     label: 'Signatures',       link: 'signatures.html' },
  { id: 'cert',    label: 'Cert chain',       link: 'certificates.html' },
];

const STEPS = [
  {
    title: '1. ClientHello',
    body: 'Client → Server: cipher suites, supported curves, RANDOM_C, DH key share (ephemeral pub_C).',
    primitives: ['asym', 'dh'],
    note: 'Client commits to a fresh ephemeral DH keypair. Sending the public half publicly is fine — that\'s how DH works.',
  },
  {
    title: '2. ServerHello',
    body: 'Server → Client: chosen cipher suite, RANDOM_S, DH key share (ephemeral pub_S). Server now has both halves of DH — derives shared secret 🔑.',
    primitives: ['asym', 'dh'],
    note: 'After one round trip both sides can derive the same secret from (pub_C, pub_S) + their own private. That secret becomes the basis for every subsequent symmetric key.',
  },
  {
    title: '3. {Certificate}  ← encrypted',
    body: 'Server → Client (encrypted from here): cert chain proving server identity for fundamentalofx.com.',
    primitives: ['cert', 'sym'],
    note: 'From this message on, traffic is encrypted with a key derived from the DH secret. The cert chain is the proof of "this is really fundamentalofx.com."',
  },
  {
    title: '4. {CertificateVerify}',
    body: 'Server signs the handshake transcript with its private key. Anyone with the cert\'s public key can verify.',
    primitives: ['sig', 'hash'],
    note: 'Without this signature, an attacker could swap the cert mid-flight. This step proves the server actually holds the private key for the cert it sent.',
  },
  {
    title: '5. {Finished}',
    body: 'Server → Client: HMAC over the entire handshake transcript. Server proves it processed every preceding message correctly.',
    primitives: ['hash'],
    note: 'A keyed hash (HMAC) of the transcript catches any tampering. If even one earlier byte was modified, both sides\' Finished messages won\'t match.',
  },
  {
    title: '6. Application Data',
    body: 'Both directions: GET requests, HTML responses, every byte — encrypted with AES-128-GCM (or ChaCha20-Poly1305) using the DH-derived key.',
    primitives: ['sym'],
    note: 'Bulk traffic uses symmetric crypto — fast, well-studied. The expensive asymmetric work was only at handshake time, never again for this connection.',
  },
];

export function initTlsRevisitedWidget(root) {
  let step = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">TLS 1.3 + crypto primitives, side by side</div>

      <div class="controls">
        <button class="btn" id="tr-prev">← Back</button>
        <button class="btn btn-accent" id="tr-next">Next message →</button>
        <button class="btn btn-ghost" id="tr-reset">Reset</button>
        <span style="margin-left:auto; font-family: var(--font-mono); color: var(--ink-soft);" id="tr-counter">0 / ${STEPS.length}</span>
      </div>

      <div class="tr-layout">
        <div class="tr-main" id="tr-main"></div>
        <div class="tr-side">
          <div class="tr-side-title">PRIMITIVES IN USE</div>
          ${PRIMITIVES.map((p) => `
            <a href="${p.link}" class="tr-prim" data-prim="${p.id}">
              <span class="tr-prim-dot"></span>
              <span class="tr-prim-label">${p.label}</span>
            </a>
          `).join('')}
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
  `;

  root.querySelector('#tr-next').addEventListener('click', () => { if (step < STEPS.length) step++; render(); });
  root.querySelector('#tr-prev').addEventListener('click', () => { if (step > 0) step--; render(); });
  root.querySelector('#tr-reset').addEventListener('click', () => { step = 0; render(); });

  function render() {
    root.querySelector('#tr-counter').textContent = `${step} / ${STEPS.length}`;
    const cur = step > 0 ? STEPS[step - 1] : null;
    const main = root.querySelector('#tr-main');
    if (!cur) {
      main.innerHTML = `<div style="text-align:center; color: var(--ink-faint); padding: 2rem;">(no step yet)</div>`;
    } else {
      main.innerHTML = `<div class="tr-step-title">${escape(cur.title)}</div><div class="tr-step-body">${escape(cur.body)}</div>`;
    }
    // primitives panel
    const onSet = new Set(cur?.primitives ?? []);
    root.querySelectorAll('.tr-prim').forEach((el) => {
      el.classList.toggle('on', onSet.has(el.dataset.prim));
    });
    root.querySelector('#tr-note').innerHTML = cur ? cur.note : 'Click "Next message →" to walk through the handshake.';
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  render();
}
