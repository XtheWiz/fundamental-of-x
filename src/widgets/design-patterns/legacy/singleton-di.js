// Singleton vs DI widget: same UserService, both flavors. Run "tests"
// in both: singleton tests share state and pollute each other; DI
// tests are independent.

const SINGLE_CODE = `class Logger {
  static instance = null;
  static get() {
    if (!Logger.instance) Logger.instance = new Logger();
    return Logger.instance;
  }
  messages = [];
  log(m) { this.messages.push(m); }
}

class UserService {
  createUser(name) {
    Logger.get().log("created " + name);   // hidden dependency
    return { name };
  }
}

// In tests:
test("creates user", () => {
  new UserService().createUser("Aiko");
  // ⚠ how do we verify the log? Singleton state from
  //   prior tests is already in messages.
});`;

const DI_CODE = `class UserService {
  constructor(logger) { this.logger = logger; }  // explicit
  createUser(name) {
    this.logger.log("created " + name);
    return { name };
  }
}

// In tests:
test("creates user, logs it", () => {
  const fakeLogger = { messages: [], log(m) { this.messages.push(m); } };
  new UserService(fakeLogger).createUser("Aiko");
  expect(fakeLogger.messages).toEqual(["created Aiko"]);
  // ✓ test owns its dependencies. No global state.
});`;

export function initSingletonDIWidget(root) {
  const sLog = { messages: [] };  // singleton's shared state
  const diResults = [];
  const sResults = [];

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Tests, run twice</div>

      <div class="controls">
        <button class="btn btn-accent" id="sd-run-s">Run 3 tests (Singleton)</button>
        <button class="btn btn-accent" id="sd-run-d">Run 3 tests (DI)</button>
        <button class="btn btn-ghost" id="sd-reset">Reset</button>
      </div>

      <div class="widget-stage" id="sd-stage"></div>

      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Singleton (hidden global)</div>
          <pre>${escape(SINGLE_CODE)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ DI (explicit)</div>
          <pre>${escape(DI_CODE)}</pre>
        </div>
      </div>
    </div>
  `;

  root.querySelector('#sd-run-s').addEventListener('click', runSingletonTests);
  root.querySelector('#sd-run-d').addEventListener('click', runDITests);
  root.querySelector('#sd-reset').addEventListener('click', () => {
    sLog.messages = []; sResults.length = 0; diResults.length = 0; render();
  });

  function runSingletonTests() {
    // Singleton's state persists between tests
    sLog.messages.push('created Aiko');
    const aiko_pass = sLog.messages.length === 1;
    sResults.push({ name: 'creates Aiko, logs once', pass: aiko_pass, note: aiko_pass ? '✅ but only because this is the first test' : '❌ shared state from previous test' });

    sLog.messages.push('created Bob');
    const bob_pass = sLog.messages.length === 1;  // expected 1, will be 2
    sResults.push({ name: 'creates Bob, logs once', pass: bob_pass, note: '❌ messages now has 2 entries — leftover from test 1' });

    sLog.messages.push('created Cara');
    const cara_pass = sLog.messages.length === 1;
    sResults.push({ name: 'creates Cara, logs once', pass: cara_pass, note: '❌ messages now has 3 entries' });

    render();
  }

  function runDITests() {
    // Each test gets its own fake logger
    [['Aiko'], ['Bob'], ['Cara']].forEach(([name]) => {
      const fake = { messages: [] };
      fake.messages.push('created ' + name);
      const pass = fake.messages.length === 1;
      diResults.push({ name: `creates ${name}, logs once`, pass, note: '✅ fresh logger, isolated' });
    });
    render();
  }

  function render() {
    let html = `<div class="sd-grid">`;
    html += `<div class="sd-panel"><div class="sd-panel-label">SINGLETON TESTS</div>`;
    if (sResults.length === 0) html += `<div class="sd-empty">(not run)</div>`;
    else sResults.forEach((r) => {
      html += `<div class="sd-test ${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓' : '✗'} ${escape(r.name)} <span class="sd-note">${r.note}</span></div>`;
    });
    html += `</div>`;
    html += `<div class="sd-panel"><div class="sd-panel-label">DI TESTS</div>`;
    if (diResults.length === 0) html += `<div class="sd-empty">(not run)</div>`;
    else diResults.forEach((r) => {
      html += `<div class="sd-test ${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓' : '✗'} ${escape(r.name)} <span class="sd-note">${r.note}</span></div>`;
    });
    html += `</div></div>`;
    html += `<style>
      .sd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.6rem; }
      .sd-panel { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; }
      .sd-panel-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.85rem; margin-bottom: 0.4em; }
      .sd-test { font-family: var(--font-mono); font-size: 0.8rem; padding: 0.2em 0.4em; margin: 0.12em 0; border-left: 3px solid; border-radius: 2px; }
      .sd-test.pass { background: #d6f5d6; border-left-color: #2a8a3e; }
      .sd-test.fail { background: var(--accent-soft); border-left-color: var(--accent); }
      .sd-note { color: var(--ink-soft); margin-left: 0.4em; }
      .sd-empty { font-family: var(--font-mono); color: var(--ink-faint); font-size: 0.85rem; }
      @media (max-width: 720px) { .sd-grid { grid-template-columns: 1fr; } }
    </style>`;
    root.querySelector('#sd-stage').innerHTML = html;
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
