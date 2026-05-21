// Certificates widget: 3-tier chain (root → intermediate → leaf).
// Pick a domain, walk verification step-by-step, optionally tamper.

const DOMAINS = {
  'fundamentalofx.com': {
    leaf:         { subject: 'fundamentalofx.com', issuer: 'Let\'s Encrypt R3',  validUntil: '2026-08-19' },
    intermediate: { subject: 'Let\'s Encrypt R3', issuer: 'ISRG Root X1',         validUntil: '2027-09-29' },
    root:         { subject: 'ISRG Root X1',     issuer: 'ISRG Root X1 (self)', validUntil: '2035-06-04' },
  },
  'github.com': {
    leaf:         { subject: 'github.com',       issuer: 'DigiCert TLS Hybrid',  validUntil: '2026-03-14' },
    intermediate: { subject: 'DigiCert TLS Hybrid', issuer: 'DigiCert Global Root CA', validUntil: '2031-11-09' },
    root:         { subject: 'DigiCert Global Root CA', issuer: 'DigiCert Global Root CA (self)', validUntil: '2031-11-10' },
  },
  'sketchy-site.example': {
    leaf:         { subject: 'sketchy-site.example', issuer: 'Unknown Root CA', validUntil: '2026-12-01' },
    intermediate: { subject: 'Unknown Intermediate', issuer: 'Unknown Root CA', validUntil: '2030-01-01' },
    root:         { subject: 'Unknown Root CA',  issuer: 'Unknown Root CA (self)', validUntil: '2035-01-01' },
    untrustedRoot: true,
  },
};

const TRUSTED_ROOTS = new Set(['ISRG Root X1', 'DigiCert Global Root CA']);

export function initCertificatesWidget(root) {
  let domain = 'fundamentalofx.com';
  let tampered = new Set(); // set of {'leaf', 'intermediate', 'root'}
  let stage = 0; // 0 = idle, 1..3 = walking up chain

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Walking the chain</div>

      <div class="controls">
        <label>Domain:</label>
        <select class="field" id="ct-domain">
          ${Object.keys(DOMAINS).map((d) => `<option value="${d}">${d}</option>`).join('')}
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
  `;

  root.querySelector('#ct-domain').addEventListener('change', (e) => {
    domain = e.target.value; stage = 0; render();
  });
  root.querySelector('#ct-verify').addEventListener('click', () => {
    if (stage < 3) stage++;
    render();
  });
  root.querySelector('#ct-reset').addEventListener('click', () => { stage = 0; render(); });
  root.querySelectorAll('input[data-tamper]').forEach((cb) =>
    cb.addEventListener('change', (e) => {
      const k = e.target.dataset.tamper;
      if (e.target.checked) tampered.add(k); else tampered.delete(k);
      stage = 0; render();
    })
  );

  function render() {
    const chain = DOMAINS[domain];
    const tiers = [
      { id: 'leaf',         label: 'LEAF',         data: chain.leaf,         active: stage >= 1, color: '#cfe5ff' },
      { id: 'intermediate', label: 'INTERMEDIATE', data: chain.intermediate, active: stage >= 2, color: '#ffe9b3' },
      { id: 'root',         label: 'ROOT CA',      data: chain.root,         active: stage >= 3, color: '#c8f0c8' },
    ];

    let html = `<div class="ct-chain">`;
    tiers.forEach((t, i) => {
      const t2 = tampered.has(t.id);
      const failsHere = t.active && t2;
      html += `
        <div class="ct-cert ${t.active ? 'active' : ''} ${failsHere ? 'bad' : ''}" style="background: ${t.color};">
          <div class="ct-cert-label">${t.label} ${t2 ? '⚠ tampered' : ''}</div>
          <div class="ct-cert-row"><strong>Subject:</strong> ${escape(t.data.subject)}</div>
          <div class="ct-cert-row"><strong>Issuer:</strong> ${escape(t.data.issuer)}</div>
          <div class="ct-cert-row"><strong>Valid until:</strong> ${escape(t.data.validUntil)}</div>
          ${t.active ? `<div class="ct-status">${verdict(t.id, t2)}</div>` : ''}
        </div>
      `;
      if (i < tiers.length - 1) {
        const verifying = t.active && tiers[i + 1].active;
        html += `<div class="ct-arrow ${verifying ? 'lit' : ''}">↑ signed by ↑</div>`;
      }
    });
    html += `</div>`;
    html += `<style>
      .ct-chain { display: flex; flex-direction: column; gap: 0.3rem; align-items: center; }
      .ct-cert { width: 100%; max-width: 460px; border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.9rem; opacity: 0.45; }
      .ct-cert.active { opacity: 1; box-shadow: 3px 3px 0 var(--ink); }
      .ct-cert.bad { box-shadow: 3px 3px 0 var(--accent); border-color: var(--accent); }
      .ct-cert-label { font-family: var(--font-display); letter-spacing: 1.5px; font-size: 0.85rem; color: var(--ink-soft); margin-bottom: 0.3em; }
      .ct-cert-row { font-family: var(--font-mono); font-size: 0.8rem; margin: 0.1em 0; }
      .ct-status { margin-top: 0.4em; padding-top: 0.3em; border-top: 1.5px dashed var(--ink); font-family: var(--font-mono); font-size: 0.82rem; font-weight: 600; }
      .ct-arrow { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-faint); }
      .ct-arrow.lit { color: var(--accent); font-weight: 600; }
    </style>`;
    root.querySelector('#ct-stage').innerHTML = html;

    // explain
    const exEl = root.querySelector('#ct-explain');
    if (stage === 0) {
      exEl.innerHTML = `Picked <strong>${domain}</strong>. Click "Verify step →" to start at the leaf and walk up.`;
    } else if (stage === 1) {
      if (tampered.has('leaf')) {
        exEl.innerHTML = `<strong>Step 1 fails.</strong> The leaf cert was tampered with — its signature no longer matches its contents. Browser refuses the connection.`;
      } else {
        exEl.innerHTML = `<strong>Step 1: leaf check.</strong> Subject matches the URL? ✓ Not expired? ✓ Signature on the cert matches the intermediate's public key? About to verify next.`;
      }
    } else if (stage === 2) {
      if (tampered.has('intermediate')) {
        exEl.innerHTML = `<strong>Step 2 fails.</strong> The intermediate cert was tampered with. Browser refuses.`;
      } else {
        exEl.innerHTML = `<strong>Step 2: intermediate check.</strong> Intermediate's signature matches the root's public key. One step left.`;
      }
    } else if (stage === 3) {
      if (tampered.has('root')) {
        exEl.innerHTML = `<strong>Step 3 fails.</strong> The root in the chain doesn't match the one in your browser's trust store. Browser refuses.`;
      } else if (DOMAINS[domain].untrustedRoot || !TRUSTED_ROOTS.has(DOMAINS[domain].root.subject)) {
        exEl.innerHTML = `<strong>Step 3 fails.</strong> The root CA "${DOMAINS[domain].root.subject}" is not in your browser's trust store. Connection refused.`;
      } else {
        exEl.innerHTML = `<strong>All three checks passed.</strong> Chain ends at a trusted root the browser already had. 🟢 Padlock appears.`;
      }
    }
  }

  function verdict(tierId, tamperedTier) {
    if (tamperedTier) return '<span style="color: var(--accent);">✗ signature mismatch</span>';
    if (tierId === 'root') {
      const isTrusted = TRUSTED_ROOTS.has(DOMAINS[domain].root.subject);
      return isTrusted
        ? '<span style="color: #2a8a3e;">✓ trusted root (in browser store)</span>'
        : '<span style="color: var(--accent);">✗ untrusted root — not in browser store</span>';
    }
    return '<span style="color: #2a8a3e;">✓ signature OK</span>';
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
