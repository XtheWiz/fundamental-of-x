// ACID widget: four mini-demos in a tabbed layout. Atomicity simulates a
// money transfer that can fail mid-way. Consistency tries to insert a
// row that violates a constraint. Isolation shows concurrent reads.
// Durability simulates a crash before/after the WAL flush.

export function initAcidWidget(root) {
  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">The Four Guarantees</div>
      <div class="controls">
        <div class="pill-group" id="acid-tabs">
          <input type="radio" name="acid-tab" id="tab-a" value="a" checked>
          <label for="tab-a">A · Atomicity</label>
          <input type="radio" name="acid-tab" id="tab-c" value="c">
          <label for="tab-c">C · Consistency</label>
          <input type="radio" name="acid-tab" id="tab-i" value="i">
          <label for="tab-i">I · Isolation</label>
          <input type="radio" name="acid-tab" id="tab-d" value="d">
          <label for="tab-d">D · Durability</label>
        </div>
      </div>
      <div id="acid-pane"></div>
    </div>
  `;

  const pane = root.querySelector('#acid-pane');
  root.querySelectorAll('input[name=acid-tab]').forEach((r) =>
    r.addEventListener('change', (e) => render(e.target.value))
  );
  render('a');

  function render(tab) {
    pane.innerHTML = '';
    if (tab === 'a') renderAtomicity(pane);
    if (tab === 'c') renderConsistency(pane);
    if (tab === 'i') renderIsolation(pane);
    if (tab === 'd') renderDurability(pane);
  }
}

/* ---------- A: Atomicity ---------- */
function renderAtomicity(pane) {
  let alice = 100, bob = 50;
  let inProgress = false;
  pane.innerHTML = `
    <h3 style="font-family: var(--font-display); letter-spacing: 0.04em;">Bank Transfer</h3>
    <p>Transfer $30 from Alice to Bob. Two operations:</p>
    <ol><li>Debit Alice by $30</li><li>Credit Bob by $30</li></ol>
    <p>If the database crashes <em>between</em> step 1 and step 2, atomicity requires both to revert.</p>

    <div class="widget-stage" style="display:flex; gap: 2rem; justify-content: center; align-items: center;">
      <div class="account" id="acc-a"></div>
      <div class="arrow">→</div>
      <div class="account" id="acc-b"></div>
    </div>
    <div class="controls">
      <button class="btn btn-accent" id="a-success">Transfer (no crash)</button>
      <button class="btn" id="a-crash">Transfer + crash after step 1</button>
      <button class="btn btn-ghost" id="a-reset">Reset</button>
    </div>
    <div class="log" id="a-log"></div>
    <style>
      .account { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 1rem; min-width: 140px; text-align: center; box-shadow: 3px 3px 0 var(--ink); }
      .account h4 { font-family: var(--font-display); font-size: 1.4rem; margin: 0; letter-spacing: 0.04em; }
      .account .bal { font-family: var(--font-mono); font-size: 1.8rem; margin-top: 0.4em; }
      .arrow { font-size: 2rem; color: var(--accent); font-family: var(--font-display); }
    </style>
  `;

  function paint() {
    pane.querySelector('#acc-a').innerHTML = `<h4>Alice</h4><div class="bal">$${alice}</div>`;
    pane.querySelector('#acc-b').innerHTML = `<h4>Bob</h4><div class="bal">$${bob}</div>`;
  }
  paint();

  const logEl = pane.querySelector('#a-log');
  function log(level, msg) {
    const div = document.createElement('div');
    div.className = `entry ${level}`;
    div.innerHTML = `<span class="t">${new Date().toLocaleTimeString()}</span>${msg}`;
    logEl.prepend(div);
  }

  pane.querySelector('#a-success').addEventListener('click', async () => {
    if (inProgress) return;
    inProgress = true;
    const savedA = alice, savedB = bob;
    log('info', 'BEGIN TRANSACTION');
    await wait(400);
    alice -= 30; paint();
    log('info', `UPDATE alice SET balance = balance - 30  // alice=${alice}`);
    await wait(700);
    bob += 30; paint();
    log('info', `UPDATE bob SET balance = balance + 30  // bob=${bob}`);
    await wait(400);
    log('ok', `COMMIT — both writes durable`);
    inProgress = false;
  });

  pane.querySelector('#a-crash').addEventListener('click', async () => {
    if (inProgress) return;
    inProgress = true;
    const savedA = alice, savedB = bob;
    log('info', 'BEGIN TRANSACTION');
    await wait(400);
    alice -= 30; paint();
    log('info', `UPDATE alice SET balance = balance - 30  // alice=${alice}`);
    await wait(700);
    log('err', `💥 CRASH!  step 2 never ran.`);
    await wait(600);
    log('info', 'Recovery: WAL has no COMMIT for this txn — ROLLBACK');
    await wait(500);
    alice = savedA; bob = savedB; paint();
    log('ok', `Atomicity holds. Both accounts restored.`);
    inProgress = false;
  });

  pane.querySelector('#a-reset').addEventListener('click', () => {
    alice = 100; bob = 50; paint(); logEl.innerHTML = '';
  });
}

/* ---------- C: Consistency ---------- */
function renderConsistency(pane) {
  pane.innerHTML = `
    <h3 style="font-family: var(--font-display); letter-spacing: 0.04em;">Constraint Enforcement</h3>
    <p>Table <code>users</code> has <code>email UNIQUE NOT NULL</code> and <code>age &gt;= 0</code>.</p>
    <p>Try inserting rows. The database will reject anything that breaks a constraint — that's consistency.</p>

    <div class="widget-stage">
      <table class="c-table">
        <thead><tr><th>id</th><th>email</th><th>age</th></tr></thead>
        <tbody id="c-rows"></tbody>
      </table>
    </div>

    <div class="controls">
      <button class="btn" data-insert="ok-1">INSERT VALUES (1, 'aiko@x.io', 28)</button>
      <button class="btn" data-insert="ok-2">INSERT VALUES (2, 'mateo@x.io', 41)</button>
      <button class="btn" data-insert="dup">INSERT VALUES (3, 'aiko@x.io', 30)  ← duplicate</button>
      <button class="btn" data-insert="null">INSERT VALUES (4, NULL, 22)  ← NULL email</button>
      <button class="btn" data-insert="neg">INSERT VALUES (5, 'kid@x.io', -3)  ← negative age</button>
      <button class="btn btn-ghost" id="c-reset">Reset</button>
    </div>

    <div class="log" id="c-log"></div>

    <style>
      .c-table { width: 100%; border-collapse: collapse; }
      .c-table th, .c-table td { border: 1.5px solid var(--ink); padding: 0.4em 0.8em; font-family: var(--font-mono); font-size: 0.9rem; }
      .c-table th { background: var(--paper-deep); font-family: var(--font-display); letter-spacing: 0.04em; font-weight: 400; }
    </style>
  `;

  const rows = [];
  const tbody = pane.querySelector('#c-rows');
  const logEl = pane.querySelector('#c-log');
  function log(level, msg) {
    const d = document.createElement('div');
    d.className = `entry ${level}`;
    d.innerHTML = `<span class="t">${new Date().toLocaleTimeString()}</span>${msg}`;
    logEl.prepend(d);
  }
  function paint() {
    tbody.innerHTML = rows.map((r) => `<tr><td>${r.id}</td><td>${r.email}</td><td>${r.age}</td></tr>`).join('') ||
      `<tr><td colspan="3" style="text-align:center; color: var(--ink-faint);">(empty)</td></tr>`;
  }
  paint();

  const attempts = {
    'ok-1': { id: 1, email: 'aiko@x.io', age: 28 },
    'ok-2': { id: 2, email: 'mateo@x.io', age: 41 },
    'dup': { id: 3, email: 'aiko@x.io', age: 30 },
    'null': { id: 4, email: null, age: 22 },
    'neg': { id: 5, email: 'kid@x.io', age: -3 },
  };

  pane.querySelectorAll('[data-insert]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const r = attempts[btn.dataset.insert];
      if (rows.some((x) => x.email === r.email && r.email != null)) {
        log('err', `❌ UNIQUE violation on email — rolled back`);
        return;
      }
      if (r.email == null) {
        log('err', `❌ NOT NULL violation on email — rolled back`);
        return;
      }
      if (r.age < 0) {
        log('err', `❌ CHECK constraint (age >= 0) failed — rolled back`);
        return;
      }
      rows.push(r);
      paint();
      log('ok', `✅ INSERT id=${r.id} committed`);
    });
  });
  pane.querySelector('#c-reset').addEventListener('click', () => {
    rows.length = 0; paint(); logEl.innerHTML = '';
  });
}

/* ---------- I: Isolation ---------- */
function renderIsolation(pane) {
  pane.innerHTML = `
    <h3 style="font-family: var(--font-display); letter-spacing: 0.04em;">Two Concurrent Transactions</h3>
    <p>Account starts at $100. T1 wants to deposit $50, T2 wants to read the balance.</p>
    <p>Without isolation, T2 might read T1's <em>in-progress</em> value (a "dirty read"). The database serializes their effects.</p>

    <div class="widget-stage" id="i-stage" style="display: flex; flex-direction: column; gap: 0.4rem;"></div>
    <div class="controls">
      <button class="btn btn-accent" id="i-run">Run with Isolation</button>
      <button class="btn" id="i-dirty">Run without (allow dirty read)</button>
      <button class="btn btn-ghost" id="i-reset">Reset</button>
    </div>
    <div class="callout" id="i-explain">Pick an option to see two transactions interleave. With isolation, T2 sees either $100 or $150 — never an in-flight value.</div>
  `;

  const stage = pane.querySelector('#i-stage');
  const explainEl = pane.querySelector('#i-explain');

  function setStage(html) { stage.innerHTML = html; }

  async function runIso() {
    let bal = 100;
    setStage(line('T1', '— BEGIN —', 0, 100, 'commit') +
             line('T2', '— BEGIN —', 0, 100, 'commit') +
             line('DB', `balance = $${bal}`, 0, 100, 'read'));
    await wait(500);
    setStage(line('T1', 'UPDATE balance = balance + 50  (locks row)', 0, 100, 'write') +
             line('T2', '... waits for T1 ...', 0, 100, 'read') +
             line('DB', `balance = $${bal} (uncommitted in T1)`, 0, 100, 'read'));
    await wait(900);
    bal = 150;
    setStage(line('T1', 'COMMIT', 0, 100, 'commit') +
             line('T2', 'SELECT balance', 0, 100, 'read') +
             line('DB', `balance = $${bal}`, 0, 100, 'read'));
    await wait(700);
    explainEl.innerHTML = `<strong>T2 saw $${bal}</strong> — the committed value. Never saw the in-progress write. ✅`;
  }

  async function runDirty() {
    let bal = 100;
    setStage(line('T1', 'BEGIN; UPDATE balance += 50 (uncommitted)', 0, 100, 'write') +
             line('T2', 'BEGIN; SELECT balance', 0, 100, 'read') +
             line('DB', `balance = $150 (in-flight!)`, 0, 100, 'read'));
    await wait(900);
    setStage(line('T1', 'ROLLBACK', 0, 100, 'abort') +
             line('T2', `(saw $150 — but it never existed)`, 0, 100, 'read') +
             line('DB', `balance = $100`, 0, 100, 'read'));
    await wait(600);
    explainEl.innerHTML = `<strong>T2 read $150 — a value that was rolled back.</strong> This is a dirty read. Don't let your database do this. ❌`;
  }

  pane.querySelector('#i-run').addEventListener('click', runIso);
  pane.querySelector('#i-dirty').addEventListener('click', runDirty);
  pane.querySelector('#i-reset').addEventListener('click', () => {
    setStage('');
    explainEl.innerHTML = 'Pick an option to see two transactions interleave.';
  });

  function line(actor, text, start, width, kind) {
    return `<div class="timeline"><div class="actor">${actor}</div><div class="track"><div class="step ${kind}" style="left:${start}%; width:${width - start}%;">${text}</div></div></div>`;
  }
}

/* ---------- D: Durability ---------- */
function renderDurability(pane) {
  pane.innerHTML = `
    <h3 style="font-family: var(--font-display); letter-spacing: 0.04em;">Crash Survival</h3>
    <p>Once the database says "COMMIT", the write must survive a power cut. The trick is the <strong>Write-Ahead Log</strong> (Lesson 5). Here's a preview.</p>

    <div class="widget-stage" id="d-stage"></div>

    <div class="controls">
      <button class="btn btn-accent" id="d-after">Crash AFTER commit</button>
      <button class="btn" id="d-before">Crash BEFORE commit</button>
      <button class="btn btn-ghost" id="d-reset">Reset</button>
    </div>
    <div class="callout" id="d-explain">A commit writes to the log first, then later flushes to the data pages. Recovery replays the log.</div>
  `;
  const stage = pane.querySelector('#d-stage');
  const explain = pane.querySelector('#d-explain');

  function paint(memVal, walEntries, diskVal, status) {
    stage.innerHTML = `
      <div class="d-layers">
        <div class="d-layer">
          <div class="d-label">CLIENT</div>
          <div class="d-box">${status}</div>
        </div>
        <div class="d-layer">
          <div class="d-label">MEMORY (buffer pool)</div>
          <div class="d-box">balance = $${memVal}</div>
        </div>
        <div class="d-layer">
          <div class="d-label">WAL (on disk)</div>
          <div class="d-box wal">${walEntries.map((e) => `<span class="wal-cell ${e.committed ? 'committed' : 'uncommitted'}">${e.text}</span>`).join('') || '(empty)'}</div>
        </div>
        <div class="d-layer">
          <div class="d-label">DATA FILE (on disk)</div>
          <div class="d-box">balance = $${diskVal}</div>
        </div>
      </div>
      <style>
        .d-layers { display: flex; flex-direction: column; gap: 0.5rem; }
        .d-layer { display: grid; grid-template-columns: 180px 1fr; align-items: center; gap: 0.6rem; }
        .d-label { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-soft); letter-spacing: 0.1em; text-transform: uppercase; text-align: right; }
        .d-box { padding: 0.5em 0.8em; background: var(--paper); border: 1.5px solid var(--ink); border-radius: var(--radius); font-family: var(--font-mono); font-size: 0.95rem; }
        .d-box.wal { font-family: inherit; padding: 0.3em; }
      </style>
    `;
  }

  async function runAfter() {
    paint(100, [], 100, 'Idle');
    await wait(500);
    paint(150, [{ text: 'UPD bal=150', committed: false }], 100, 'Pending');
    await wait(700);
    paint(150, [{ text: 'UPD bal=150', committed: true }, { text: 'COMMIT', committed: true }], 100, '✅ Acked');
    await wait(700);
    explain.innerHTML = `💥 <strong>Crash!</strong> Memory and data file are out of sync — but the WAL says "COMMIT"...`;
    paint('?', [{ text: 'UPD bal=150', committed: true }, { text: 'COMMIT', committed: true }], 100, '⚡ Crash');
    await wait(900);
    paint(150, [{ text: 'UPD bal=150', committed: true }, { text: 'COMMIT', committed: true }, { text: 'REPLAY', committed: true }], 150, 'Recovered');
    explain.innerHTML = `Recovery replays the committed WAL entries into the data file. <strong>The committed write survived.</strong> ✅ Durability holds.`;
  }

  async function runBefore() {
    paint(100, [], 100, 'Idle');
    await wait(500);
    paint(150, [{ text: 'UPD bal=150', committed: false }], 100, 'Pending (no commit yet)');
    await wait(900);
    explain.innerHTML = `💥 <strong>Crash!</strong> The client never got a COMMIT ack. The WAL entry is uncommitted.`;
    paint('?', [{ text: 'UPD bal=150', committed: false }], 100, '⚡ Crash');
    await wait(800);
    paint(100, [], 100, 'Recovered');
    explain.innerHTML = `Recovery discards uncommitted WAL entries. <strong>Balance is still $100.</strong> ✅ No phantom write — the client wasn't promised durability.`;
  }

  pane.querySelector('#d-after').addEventListener('click', runAfter);
  pane.querySelector('#d-before').addEventListener('click', runBefore);
  pane.querySelector('#d-reset').addEventListener('click', () => {
    paint(100, [], 100, 'Idle');
    explain.innerHTML = 'A commit writes to the log first, then later flushes to the data pages. Recovery replays the log.';
  });
  paint(100, [], 100, 'Idle');
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
