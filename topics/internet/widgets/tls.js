// TLS 1.3 widget: step through the handshake one message at a time.
// Shows what each side sends and what each side now "knows".

const STEPS = [
  {
    title: '1. ClientHello',
    dir: 'c→s',
    body: [
      'Supported cipher suites: TLS_AES_128_GCM_SHA256, …',
      'Supported groups: X25519, secp256r1',
      'Key share: ephemeral public key (X25519)',
      'Random nonce: 32 bytes',
      'Server name: fundamentalofx.com (SNI)',
    ],
    clientKnows: ['Its own private key', 'Random nonce'],
    serverKnows: [],
    note: 'Client throws all its capabilities + a public key on the table. The server can pick a suite AND derive a shared secret from this single message.',
  },
  {
    title: '2. ServerHello',
    dir: 's→c',
    body: [
      'Chosen cipher: TLS_AES_128_GCM_SHA256',
      'Chosen group: X25519',
      'Key share: ephemeral public key',
      'Random nonce',
    ],
    clientKnows: ['Its own private key', 'Random nonce'],
    serverKnows: ['Its own private key', 'Client public key', 'Shared secret 🔑 (just derived)'],
    note: 'Server picks parameters and sends its own ephemeral public key. From the two public keys + its private key it can now derive the shared secret (ECDHE).',
  },
  {
    title: '3. {Certificate, CertVerify, Finished}',
    dir: 's→c',
    body: [
      'Encrypted ↗ with newly-derived key',
      'Certificate: x509 chain for fundamentalofx.com',
      'CertificateVerify: signature proving cert ownership',
      'Finished: HMAC over the handshake so far',
    ],
    clientKnows: ['Its own private key', 'Server public key', 'Shared secret 🔑', 'Server identity ✓'],
    serverKnows: ['Everything above'],
    note: 'Server proves it owns the certificate by signing the handshake transcript. The Finished message catches any tampering with earlier messages.',
  },
  {
    title: '4. {Finished}',
    dir: 'c→s',
    body: [
      'Encrypted ↗',
      'Finished: HMAC over the handshake so far',
    ],
    clientKnows: ['All of the above'],
    serverKnows: ['Handshake confirmed ✓'],
    note: 'Client confirms the handshake. From this point on, all application data is sent encrypted with the shared symmetric key.',
  },
  {
    title: '5. Application Data',
    dir: 'c↔s',
    body: [
      'GET / HTTP/1.1 (encrypted)',
      '… and everything else, both directions',
    ],
    clientKnows: ['Connected, can talk freely'],
    serverKnows: ['Connected, can talk freely'],
    note: 'One round trip after ClientHello, both sides can send application data — about half the handshake cost of TLS 1.2.',
  },
];

export function initTlsWidget(root) {
  let step = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">TLS 1.3 Handshake</div>
      <p class="widget-hint">Five messages. One round trip. Step through to see what gets exchanged and what each side learns.</p>

      <div class="controls">
        <button class="btn btn-accent" id="tls-next">Next message →</button>
        <button class="btn" id="tls-prev">← Back</button>
        <button class="btn btn-ghost" id="tls-reset">Reset</button>
        <span style="margin-left: auto; font-family: var(--font-mono); color: var(--ink-soft);" id="tls-counter">0 / ${STEPS.length}</span>
      </div>

      <div class="widget-stage" id="tls-stage" style="min-height: 360px;"></div>

      <div class="callout" id="tls-note">Click "Next message →" to start.</div>
    </div>
  `;

  const stage = root.querySelector('#tls-stage');
  const noteEl = root.querySelector('#tls-note');
  const counterEl = root.querySelector('#tls-counter');

  root.querySelector('#tls-next').addEventListener('click', () => { if (step < STEPS.length) step++; render(); });
  root.querySelector('#tls-prev').addEventListener('click', () => { if (step > 0) step--; render(); });
  root.querySelector('#tls-reset').addEventListener('click', () => { step = 0; render(); });

  function render() {
    counterEl.textContent = `${step} / ${STEPS.length}`;
    const cur = step > 0 ? STEPS[step - 1] : null;
    const clientState = step > 0 ? STEPS[step - 1].clientKnows : [];
    const serverState = step > 0 ? STEPS[step - 1].serverKnows : [];

    let html = `
      <div class="tls-grid">
        <div class="tls-side">
          <div class="tls-actor">CLIENT</div>
          <div class="tls-state">
            <div class="tls-state-label">Knows:</div>
            ${clientState.length ? clientState.map((s) => `<div class="tls-state-row">${escape(s)}</div>`).join('') : '<div class="tls-state-row" style="color: var(--ink-faint);">(nothing yet)</div>'}
          </div>
        </div>
        <div class="tls-middle">
          ${cur ? renderMessage(cur) : '<div style="color: var(--ink-faint); padding: 2rem; text-align: center;">(waiting)</div>'}
        </div>
        <div class="tls-side">
          <div class="tls-actor">SERVER</div>
          <div class="tls-state">
            <div class="tls-state-label">Knows:</div>
            ${serverState.length ? serverState.map((s) => `<div class="tls-state-row">${escape(s)}</div>`).join('') : '<div class="tls-state-row" style="color: var(--ink-faint);">(nothing yet)</div>'}
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
    `;
    stage.innerHTML = html;
    noteEl.innerHTML = cur ? cur.note : 'Click "Next message →" to start.';
  }

  function renderMessage(s) {
    const dirText = { 'c→s': 'CLIENT → SERVER', 's→c': 'SERVER → CLIENT', 'c↔s': 'BOTH DIRECTIONS' }[s.dir];
    return `
      <div class="tls-msg-dir">${dirText}</div>
      <div class="tls-msg-title">${escape(s.title)}</div>
      <div class="tls-msg-body">
        ${s.body.map((l) => `<div>· ${escape(l)}</div>`).join('')}
      </div>
    `;
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  render();
}
