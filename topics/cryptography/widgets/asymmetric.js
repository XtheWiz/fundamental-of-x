// Asymmetric widget: real RSA-OAEP-2048 via Web Crypto. Generate
// keypair, encrypt with public, decrypt with private. The "wrong way"
// button tries to decrypt with the public key and fails.

export function initAsymmetricWidget(root) {
  let keys = null;       // CryptoKeyPair
  let pubPem = '';       // exported public for display
  let privPem = '';      // exported private (truncated for display)
  let lastCipher = null;

  root.innerHTML = `
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
  `;

  const pubEl = root.querySelector('#ak-pub');
  const privEl = root.querySelector('#ak-priv');
  const ctEl = root.querySelector('#ak-ct');
  const resEl = root.querySelector('#ak-result');
  const stateEl = root.querySelector('#ak-state');
  const explainEl = root.querySelector('#explain');

  root.querySelector('#ak-gen').addEventListener('click', genKeys);
  root.querySelector('#ak-enc').addEventListener('click', encrypt);
  root.querySelector('#ak-dec').addEventListener('click', () => decrypt(false));
  root.querySelector('#ak-bad').addEventListener('click', () => decrypt(true));

  async function genKeys() {
    stateEl.textContent = 'generating…';
    keys = await crypto.subtle.generateKey(
      { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true, ['encrypt', 'decrypt']
    );
    const rawPub = new Uint8Array(await crypto.subtle.exportKey('spki', keys.publicKey));
    const rawPriv = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keys.privateKey));
    pubPem = `…${bytesToHex(rawPub).slice(40, 200)}…`;
    privPem = `…${bytesToHex(rawPriv).slice(40, 200)}…`;
    pubEl.textContent = pubPem;
    privEl.textContent = privPem;
    stateEl.textContent = 'keypair ready';
    explainEl.innerHTML = 'Generated. Public key is fine to share — encrypt a message with it.';
    lastCipher = null;
    ctEl.textContent = '—';
    resEl.textContent = '—';
  }

  async function encrypt() {
    if (!keys) await genKeys();
    const pt = new TextEncoder().encode(root.querySelector('#ak-msg').value);
    const ctBuf = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, keys.publicKey, pt);
    lastCipher = new Uint8Array(ctBuf);
    ctEl.textContent = bytesToHex(lastCipher);
    explainEl.innerHTML = `Encrypted with the public key. Only the matching private key can decrypt this. Try it both ways.`;
  }

  async function decrypt(wrong) {
    if (!keys || !lastCipher) {
      resEl.textContent = '(encrypt something first)';
      return;
    }
    try {
      const keyToUse = wrong ? keys.publicKey : keys.privateKey;
      const ptBuf = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, keyToUse, lastCipher);
      resEl.textContent = new TextDecoder().decode(ptBuf);
      explainEl.innerHTML = `Decrypted successfully with the private key.`;
    } catch (e) {
      resEl.innerHTML = `❌ <span style="color: var(--accent);">decryption failed</span> — ${wrong ? 'public key can\'t decrypt what its private half encrypts. That\'s the whole point.' : 'unexpected error: ' + e.message}`;
      if (wrong) {
        explainEl.innerHTML = `Public keys <strong>only encrypt</strong>; they can't decrypt. The asymmetry is what makes the whole scheme safe.`;
      }
    }
  }

  function bytesToHex(arr) {
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
