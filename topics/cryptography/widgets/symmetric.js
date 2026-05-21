// Symmetric widget: real AES-256-GCM via Web Crypto. Generate a key,
// encrypt a message, decrypt back. Re-encrypting shows the IV changes
// the ciphertext every time.

export function initSymmetricWidget(root) {
  let key = null;
  let lastCipher = null;  // { iv, ciphertext }

  root.innerHTML = `
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
  `;

  const stateEl = root.querySelector('#sk-state');
  const keyEl = root.querySelector('#sk-key');
  const msgEl = root.querySelector('#sk-msg');
  const cipherEl = root.querySelector('#sk-cipher');
  const plainEl = root.querySelector('#sk-plain');
  const explainEl = root.querySelector('#sk-explain');

  root.querySelector('#sk-gen').addEventListener('click', genKey);
  root.querySelector('#sk-enc').addEventListener('click', encrypt);
  root.querySelector('#sk-dec').addEventListener('click', decrypt);

  async function genKey() {
    key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
    keyEl.textContent = bytesToHex(raw);
    stateEl.textContent = 'key ready';
    lastCipher = null;
    cipherEl.textContent = '—';
    plainEl.textContent = '—';
  }

  async function encrypt() {
    if (!key) await genKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(msgEl.value);
    const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    const ct = new Uint8Array(ctBuf);
    lastCipher = { iv, ciphertext: ct };
    cipherEl.innerHTML = `<span style="color: var(--ink-soft);">iv = </span>${bytesToHex(iv)}<br><span style="color: var(--ink-soft);">ct = </span>${bytesToHex(ct)}`;
    explainEl.innerHTML = `Encrypted with random IV. Hit <em>Encrypt</em> again — the ciphertext will change even though the message is identical. That's not a bug; it prevents an attacker from telling two identical messages apart.`;
  }

  async function decrypt() {
    if (!key || !lastCipher) {
      plainEl.textContent = '(encrypt something first)';
      return;
    }
    try {
      const ptBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: lastCipher.iv }, key, lastCipher.ciphertext);
      plainEl.textContent = new TextDecoder().decode(ptBuf);
      explainEl.innerHTML = `Same key + same IV + same ciphertext = original message. If anyone had tampered with the ciphertext, GCM would have caught it and decryption would have failed loudly.`;
    } catch (e) {
      plainEl.textContent = '❌ decryption failed (tampered ciphertext or wrong key)';
    }
  }

  function bytesToHex(arr) {
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
