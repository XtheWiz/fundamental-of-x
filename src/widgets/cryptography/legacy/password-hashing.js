// Password hashing widget: takes a password and computes "crack time"
// against an attacker with a known hash database, comparing SHA-256
// (fast: 10^10 guesses/sec on GPU) vs bcrypt at cost=12 (~10/sec).

// Rough character class sizes
const CLASSES = [
  { regex: /[a-z]/, size: 26 },
  { regex: /[A-Z]/, size: 26 },
  { regex: /[0-9]/, size: 10 },
  { regex: /[^a-zA-Z0-9]/, size: 33 },
];

// common passwords for "in a wordlist?" check
const COMMON_PASSWORDS = new Set([
  'password', '123456', 'qwerty', 'abc123', 'letmein', 'admin', 'welcome',
  'password1', 'iloveyou', 'monkey', 'dragon', 'sunshine', '12345678',
  'fundamentalofx', 'xthewiz',
]);

const SHA_RATE = 1e10;   // 10 billion guesses/sec on a modest GPU rig
const BCRYPT_RATE = 10;  // bcrypt cost=12 ≈ 10 guesses/sec

export function initPasswordHashingWidget(root) {
  let password = 'sunshine';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Crack-time race</div>

      <div class="controls">
        <label>Password:</label>
        <input type="text" class="field" id="pw-input" value="sunshine" style="flex: 1; min-width: 240px; font-family: var(--font-mono);">
        <span style="font-family: var(--font-mono); color: var(--ink-soft);" id="pw-info"></span>
      </div>

      <div class="pw-grid">
        <div class="pw-side">
          <div class="pw-method">stored as SHA-256</div>
          <div class="cy-key-label">attacker rate</div>
          <div class="cy-hex">10,000,000,000 / sec  (GPU)</div>
          <div class="cy-key-label" style="margin-top: 0.5rem;">estimated crack time</div>
          <div class="cy-hex" id="pw-sha" style="background: #f7c8c8;">—</div>
        </div>
        <div class="pw-side">
          <div class="pw-method">stored as bcrypt (cost=12)</div>
          <div class="cy-key-label">attacker rate</div>
          <div class="cy-hex">10 / sec  (deliberately slow)</div>
          <div class="cy-key-label" style="margin-top: 0.5rem;">estimated crack time</div>
          <div class="cy-hex" id="pw-bcrypt" style="background: #d6f5d6;">—</div>
        </div>
      </div>

      <div class="callout" id="pw-explain"></div>

      <style>
        .pw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin: 1rem 0; }
        .pw-side { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.8rem; }
        .pw-method { font-family: var(--font-display); font-size: 1.05rem; letter-spacing: 1px; margin-bottom: 0.5rem; }
        @media (max-width: 600px) { .pw-grid { grid-template-columns: 1fr; } }
      </style>
    </div>
  `;

  const inp = root.querySelector('#pw-input');
  inp.addEventListener('input', (e) => { password = e.target.value; update(); });

  function update() {
    // Compute search space
    let classSize = 0;
    for (const c of CLASSES) if (c.regex.test(password)) classSize += c.size;
    if (classSize === 0) classSize = 26;
    const space = Math.pow(classSize, password.length);
    const inWordlist = COMMON_PASSWORDS.has(password.toLowerCase());

    root.querySelector('#pw-info').textContent =
      `length=${password.length} · char-classes=${classCount(password)} · space ≈ ${formatNum(space)}`;

    let shaSec, bcryptSec;
    if (inWordlist) {
      shaSec = 0.0001;     // attacker tries wordlist first
      bcryptSec = 100;     // 1000-word list at 10/sec
    } else {
      shaSec = space / 2 / SHA_RATE;
      bcryptSec = space / 2 / BCRYPT_RATE;
    }

    root.querySelector('#pw-sha').textContent = humanTime(shaSec);
    root.querySelector('#pw-bcrypt').textContent = humanTime(bcryptSec);

    let msg;
    if (inWordlist) {
      msg = `❌ <strong>"${escape(password)}" is in every public wordlist.</strong> SHA-256 storage: cracked instantly. Even bcrypt: ~${humanTime(bcryptSec)} — slow but very feasible. Pick something the world hasn't already seen.`;
    } else if (password.length < 8) {
      msg = `<strong>Short password.</strong> Even with bcrypt slowing things down, a short password is still brute-forceable. Aim for 12+ characters or use a passphrase.`;
    } else if (password.length >= 12 && classCount(password) >= 3) {
      msg = `<strong>Strong password.</strong> Under SHA-256 it would still take ${humanTime(shaSec)}; under bcrypt the attacker would have given up long before the heat death of the universe. Mix of character classes + length is what works.`;
    } else {
      msg = `<strong>Moderate.</strong> Bcrypt buys you ${formatRatio(bcryptSec / shaSec)} more time than SHA-256 against the same attacker. That's the whole reason slow hashes exist.`;
    }
    root.querySelector('#pw-explain').innerHTML = msg;
  }

  function classCount(s) {
    let c = 0;
    for (const cl of CLASSES) if (cl.regex.test(s)) c++;
    return c;
  }
  function formatNum(n) {
    if (!isFinite(n) || n > 1e18) return '> 10^18';
    if (n >= 1e9) return (n / 1e9).toPrecision(3) + ' billion';
    if (n >= 1e6) return (n / 1e6).toPrecision(3) + ' million';
    if (n >= 1e3) return Math.round(n / 1e3) + 'k';
    return Math.round(n);
  }
  function humanTime(sec) {
    if (sec < 1e-3) return 'instant';
    if (sec < 1) return `${(sec * 1000).toPrecision(2)} ms`;
    if (sec < 60) return `${sec.toPrecision(2)} sec`;
    if (sec < 3600) return `${(sec / 60).toPrecision(2)} min`;
    if (sec < 86400) return `${(sec / 3600).toPrecision(2)} hours`;
    if (sec < 86400 * 365) return `${(sec / 86400).toPrecision(2)} days`;
    if (sec < 86400 * 365 * 1000) return `${(sec / (86400 * 365)).toPrecision(3)} years`;
    if (sec < 86400 * 365 * 1e9) return `${(sec / (86400 * 365 * 1e6)).toPrecision(3)} million years`;
    return `${(sec / (86400 * 365 * 1e9)).toPrecision(3)} billion years`;
  }
  function formatRatio(r) {
    if (r > 1e9) return `${(r/1e9).toPrecision(2)} billion×`;
    if (r > 1e6) return `${(r/1e6).toPrecision(2)} million×`;
    return `${r.toPrecision(2)}×`;
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  update();
}
