// Hashing widget: real SHA-256 via Web Crypto. Shows the digest for
// the current input + a comparison row that updates on edit, with a
// bit-flip visualization to surface the avalanche effect.

const ALGOS = ['SHA-1', 'SHA-256', 'SHA-512'];

export function initHashingWidget(root) {
  let algo = 'SHA-256';
  let prevDigest = null;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">SHA in real time</div>
      <p class="widget-hint">Type anything below. The hash updates on every keystroke.</p>

      <div class="controls">
        <label>Algorithm:</label>
        <div class="pill-group">
          ${ALGOS.map((a, i) => `
            <input type="radio" name="hash-algo" id="ha-${i}" value="${a}" ${a === 'SHA-256' ? 'checked' : ''}>
            <label for="ha-${i}">${a}</label>
          `).join('')}
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
  `;

  const inp = root.querySelector('#h-input');
  inp.addEventListener('input', update);
  root.querySelector('#h-flip').addEventListener('click', () => {
    const s = inp.value;
    if (!s.length) return;
    const ch = s.charCodeAt(s.length - 1);
    inp.value = s.slice(0, -1) + String.fromCharCode(ch ^ 1);
    update();
  });
  root.querySelectorAll('input[name=hash-algo]').forEach((r) =>
    r.addEventListener('change', (e) => { algo = e.target.value; prevDigest = null; update(); })
  );

  async function update() {
    const text = inp.value;
    const buf = new TextEncoder().encode(text);
    let digestBuf;
    try {
      digestBuf = await crypto.subtle.digest(algo, buf);
    } catch (e) {
      root.querySelector('#h-digest').textContent = 'Web Crypto unavailable on this page (needs HTTPS or localhost).';
      return;
    }
    const digestBytes = new Uint8Array(digestBuf);
    const hex = bytesToHex(digestBytes);
    root.querySelector('#h-digest').textContent = hex;
    root.querySelector('#m-len').textContent = text.length;
    root.querySelector('#m-bits').textContent = digestBytes.length * 8;

    if (prevDigest && prevDigest.length === digestBytes.length) {
      let flipped = 0;
      const diffMarkers = [];
      for (let i = 0; i < digestBytes.length; i++) {
        const xor = prevDigest[i] ^ digestBytes[i];
        flipped += popcount(xor);
        diffMarkers.push(xor);
      }
      root.querySelector('#m-flipped').textContent = `${flipped} / ${digestBytes.length * 8}`;
      root.querySelector('#h-diff').innerHTML = renderDiff(digestBytes, prevDigest);
    } else {
      root.querySelector('#m-flipped').textContent = '—';
      root.querySelector('#h-diff').textContent = '(type or flip a byte to compare)';
    }
    prevDigest = digestBytes;
  }

  function renderDiff(cur, prev) {
    let out = '';
    for (let i = 0; i < cur.length; i++) {
      const xor = cur[i] ^ prev[i];
      const hex = cur[i].toString(16).padStart(2, '0');
      if (xor === 0) out += `<span style="opacity:0.4">${hex}</span>`;
      else out += `<span style="background: var(--accent); color: white; padding: 0 1px;">${hex}</span>`;
    }
    return out;
  }
  function bytesToHex(arr) {
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  function popcount(n) {
    let c = 0;
    while (n) { c += n & 1; n >>>= 1; }
    return c;
  }

  update();
}
