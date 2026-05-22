// Signatures widget: real ECDSA P-256 via Web Crypto.
// Sign a message, verify, then tamper and re-verify.

export function initSignaturesWidget(root) {
  let keys = null;
  let signedMessage = null;
  let signature = null;

  root.innerHTML = `
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
  `;

  const stateEl = root.querySelector('#sg-state');
  const pubEl = root.querySelector('#sg-pub');
  const msgEl = root.querySelector('#sg-msg');
  const sigEl = root.querySelector('#sg-sig');
  const recvEl = root.querySelector('#sg-recv');
  const resultEl = root.querySelector('#sg-result');
  const explainEl = root.querySelector('#sg-explain');

  root.querySelector('#sg-gen').addEventListener('click', genKeys);
  root.querySelector('#sg-sign').addEventListener('click', sign);
  root.querySelector('#sg-verify').addEventListener('click', verify);
  root.querySelector('#sg-tamper').addEventListener('click', tamper);

  async function genKeys() {
    keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey));
    pubEl.textContent = bytesToHex(raw);
    stateEl.textContent = 'keypair ready';
    signedMessage = null; signature = null;
    sigEl.textContent = '—';
    resultEl.textContent = '—';
  }

  async function sign() {
    if (!keys) await genKeys();
    signedMessage = msgEl.value;
    const sigBuf = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, new TextEncoder().encode(signedMessage));
    signature = new Uint8Array(sigBuf);
    sigEl.textContent = bytesToHex(signature);
    recvEl.value = signedMessage;
    explainEl.innerHTML = 'Signed. Anyone with the public key can now verify this exact message came from the holder of the private key.';
  }

  async function verify() {
    if (!signature || !keys) {
      resultEl.textContent = '(sign a message first)';
      return;
    }
    const valid = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, keys.publicKey, signature, new TextEncoder().encode(recvEl.value));
    if (valid) {
      resultEl.innerHTML = `<span style="color: #2a8a3e;">✓ VALID — message is authentic and unchanged</span>`;
      explainEl.innerHTML = 'Verification succeeded. The received message exactly matches what was signed; the signature is from the holder of the corresponding private key.';
    } else {
      resultEl.innerHTML = `<span style="color: var(--accent);">✗ INVALID — message tampered or wrong key</span>`;
      explainEl.innerHTML = `Verification failed. The received message doesn't match what was signed (or someone else's key was used). The receiver detects this and rejects the message — no trust required in the transport layer.`;
    }
  }

  function tamper() {
    const s = recvEl.value;
    if (!s.length) return;
    // flip the last lowercase letter we can find
    let i = s.length - 1;
    while (i >= 0 && !/[a-zA-Z]/.test(s[i])) i--;
    if (i < 0) { recvEl.value = s + 'x'; return; }
    const ch = s[i];
    const flipped = ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase();
    recvEl.value = s.slice(0, i) + flipped + s.slice(i + 1);
    explainEl.innerHTML = `Flipped one character in the received message. Now click Verify — watch it fail.`;
  }

  function bytesToHex(arr) {
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
