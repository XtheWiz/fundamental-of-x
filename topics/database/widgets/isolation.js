// Isolation widget: pick a phenomenon (dirty / non-repeatable / phantom)
// and an isolation level. Watch two transactions interleave step by
// step; the phenomenon either appears or gets blocked depending on
// the level.

const LEVELS = [
  { id: 'ru', label: 'Read Uncommitted', short: 'RU' },
  { id: 'rc', label: 'Read Committed',   short: 'RC' },
  { id: 'rr', label: 'Repeatable Read',  short: 'RR' },
  { id: 'sr', label: 'Serializable',     short: 'SR' },
];

const PHENOMENA = {
  dirty: {
    label: 'Dirty Read',
    description: 'T1 updates a row, T2 reads it, T1 rolls back.',
    runs: {
      ru: () => [
        st('T1', 'BEGIN'),
        st('T2', 'BEGIN'),
        st('T1', 'UPDATE balance = 150  (uncommitted)', 'write'),
        st('T2', 'SELECT balance → 150  ← ❌ DIRTY READ', 'read', 'bad'),
        st('T1', 'ROLLBACK', 'abort'),
        st('T2', 'T2 acted on a value that never existed'),
      ],
      rc: () => [
        st('T1', 'BEGIN'),
        st('T2', 'BEGIN'),
        st('T1', 'UPDATE balance = 150  (uncommitted)', 'write'),
        st('T2', 'SELECT balance → 100  ✅ sees committed only', 'read', 'good'),
        st('T1', 'ROLLBACK', 'abort'),
        st('T2', 'No dirty read at this level.'),
      ],
      rr: () => [
        st('T1', 'BEGIN'),
        st('T2', 'BEGIN'),
        st('T1', 'UPDATE balance = 150  (uncommitted)', 'write'),
        st('T2', 'SELECT balance → 100  ✅ sees committed only', 'read', 'good'),
        st('T1', 'ROLLBACK', 'abort'),
        st('T2', 'No dirty read at this level.'),
      ],
      sr: () => [
        st('T1', 'BEGIN'),
        st('T2', 'BEGIN'),
        st('T1', 'UPDATE balance = 150  (uncommitted)', 'write'),
        st('T2', 'SELECT balance → 100  ✅ sees committed only', 'read', 'good'),
        st('T1', 'ROLLBACK', 'abort'),
        st('T2', 'No dirty read at this level.'),
      ],
    },
  },
  nonrep: {
    label: 'Non-Repeatable Read',
    description: 'T2 reads a row twice; T1 commits an update in between.',
    runs: {
      ru: () => [
        st('T1', 'BEGIN'),  st('T2', 'BEGIN'),
        st('T2', 'SELECT balance → 100', 'read'),
        st('T1', 'UPDATE balance = 200; COMMIT', 'write'),
        st('T2', 'SELECT balance → 200  ← ❌ value changed!', 'read', 'bad'),
        st('T2', 'COMMIT'),
        st('T2', 'T2 read different values for the same row in one txn.'),
      ],
      rc: () => [
        st('T1', 'BEGIN'),  st('T2', 'BEGIN'),
        st('T2', 'SELECT balance → 100', 'read'),
        st('T1', 'UPDATE balance = 200; COMMIT', 'write'),
        st('T2', 'SELECT balance → 200  ← ❌ value changed!', 'read', 'bad'),
        st('T2', 'COMMIT'),
        st('T2', 'RC sees the latest committed value — non-repeatable.'),
      ],
      rr: () => [
        st('T1', 'BEGIN'),  st('T2', 'BEGIN'),
        st('T2', 'SELECT balance → 100', 'read'),
        st('T1', 'UPDATE balance = 200; COMMIT', 'write'),
        st('T2', 'SELECT balance → 100  ✅ snapshot kept', 'read', 'good'),
        st('T2', 'COMMIT'),
        st('T2', 'RR locks the snapshot at txn start — repeatable.'),
      ],
      sr: () => [
        st('T1', 'BEGIN'),  st('T2', 'BEGIN'),
        st('T2', 'SELECT balance → 100', 'read'),
        st('T1', 'UPDATE balance = 200; COMMIT', 'write'),
        st('T2', 'SELECT balance → 100  ✅ snapshot kept', 'read', 'good'),
        st('T2', 'COMMIT'),
        st('T2', 'Serializable also prevents this.'),
      ],
    },
  },
  phantom: {
    label: 'Phantom Read',
    description: 'T2 reads a range twice; T1 inserts a matching row in between.',
    runs: {
      ru: () => [
        st('T1', 'BEGIN'),  st('T2', 'BEGIN'),
        st('T2', 'SELECT COUNT(*) WHERE age > 30 → 4', 'read'),
        st('T1', 'INSERT (age=35); COMMIT', 'write'),
        st('T2', 'SELECT COUNT(*) WHERE age > 30 → 5  ← ❌ phantom!', 'read', 'bad'),
        st('T2', 'COMMIT'),
        st('T2', 'A new row appeared in the predicate — phantom.'),
      ],
      rc: () => [
        st('T1', 'BEGIN'),  st('T2', 'BEGIN'),
        st('T2', 'SELECT COUNT(*) WHERE age > 30 → 4', 'read'),
        st('T1', 'INSERT (age=35); COMMIT', 'write'),
        st('T2', 'SELECT COUNT(*) WHERE age > 30 → 5  ← ❌ phantom!', 'read', 'bad'),
        st('T2', 'COMMIT'),
        st('T2', 'RC re-reads the committed set — phantom slips in.'),
      ],
      rr: () => [
        st('T1', 'BEGIN'),  st('T2', 'BEGIN'),
        st('T2', 'SELECT COUNT(*) WHERE age > 30 → 4', 'read'),
        st('T1', 'INSERT (age=35); COMMIT', 'write'),
        st('T2', 'SELECT COUNT(*) WHERE age > 30 → 4  ✅ snapshot', 'read', 'good'),
        st('T2', 'COMMIT'),
        st('T2', 'Standard says phantoms possible at RR. Postgres uses MVCC and prevents them.'),
      ],
      sr: () => [
        st('T1', 'BEGIN'),  st('T2', 'BEGIN'),
        st('T2', 'SELECT COUNT(*) WHERE age > 30 → 4', 'read'),
        st('T1', 'INSERT (age=35); COMMIT  ← may be blocked at SR', 'write', 'good'),
        st('T2', 'SELECT COUNT(*) WHERE age > 30 → 4  ✅', 'read', 'good'),
        st('T2', 'COMMIT'),
        st('T2', 'Serializable prevents phantoms.'),
      ],
    },
  },
};

function st(actor, text, kind = '', tag = '') {
  return { actor, text, kind, tag };
}

export function initIsolationWidget(root) {
  let phenomenon = 'dirty';
  let level = 'ru';
  let step = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Two Transactions in Slow Motion</div>

      <div class="controls">
        <label>Phenomenon:</label>
        <div class="pill-group">
          ${Object.entries(PHENOMENA).map(([id, p], i) => `
            <input type="radio" name="iso-phen" id="phen-${id}" value="${id}" ${i === 0 ? 'checked' : ''}>
            <label for="phen-${id}">${p.label}</label>
          `).join('')}
        </div>
      </div>

      <div class="controls">
        <label>Isolation:</label>
        <div class="pill-group">
          ${LEVELS.map((l, i) => `
            <input type="radio" name="iso-lvl" id="lvl-${l.id}" value="${l.id}" ${i === 0 ? 'checked' : ''}>
            <label for="lvl-${l.id}">${l.short}</label>
          `).join('')}
        </div>
        <button class="btn btn-accent" id="iso-step">Next Step</button>
        <button class="btn btn-ghost" id="iso-reset">Reset</button>
      </div>

      <div class="callout" id="iso-desc"></div>

      <div class="widget-stage" id="iso-stage" style="min-height: 240px;"></div>

      <div class="callout" id="iso-summary" style="display:none"></div>
    </div>
  `;

  const stage = root.querySelector('#iso-stage');
  const desc = root.querySelector('#iso-desc');
  const summary = root.querySelector('#iso-summary');

  root.querySelectorAll('input[name=iso-phen]').forEach((r) =>
    r.addEventListener('change', (e) => {
      phenomenon = e.target.value;
      step = 0;
      render();
    })
  );
  root.querySelectorAll('input[name=iso-lvl]').forEach((r) =>
    r.addEventListener('change', (e) => {
      level = e.target.value;
      step = 0;
      render();
    })
  );
  root.querySelector('#iso-step').addEventListener('click', () => {
    const events = PHENOMENA[phenomenon].runs[level]();
    if (step < events.length) step++;
    render();
  });
  root.querySelector('#iso-reset').addEventListener('click', () => {
    step = 0;
    render();
  });

  function render() {
    const phen = PHENOMENA[phenomenon];
    const events = phen.runs[level]();
    desc.innerHTML = `<strong>${phen.label}</strong> at <strong>${LEVELS.find((l) => l.id === level).label}</strong>. ${phen.description}`;

    stage.innerHTML = events.slice(0, step).map((e, i) => row(e, i)).join('');

    if (step >= events.length) {
      const verdict = events.some((e) => e.tag === 'bad');
      summary.style.display = 'block';
      summary.innerHTML = verdict
        ? `❌ <strong>Phenomenon occurred</strong> at this level. The database allowed it. Move to a higher isolation level to prevent.`
        : `✅ <strong>Phenomenon prevented</strong>. This isolation level was strong enough.`;
    } else {
      summary.style.display = 'none';
    }
  }

  function row(e, i) {
    const isT1 = e.actor === 'T1';
    return `
      <div class="iso-row ${e.tag}">
        <div class="iso-stepnum">${String(i + 1).padStart(2, '0')}</div>
        ${isT1 ? `<div class="iso-cell t1 ${e.kind}">${escape(e.text)}</div>
                  <div class="iso-cell empty"></div>`
               : `<div class="iso-cell empty"></div>
                  <div class="iso-cell t2 ${e.kind}">${escape(e.text)}</div>`}
      </div>
      <style>
        .iso-row { display: grid; grid-template-columns: 36px 1fr 1fr; gap: 0.4rem; align-items: center; margin: 0.2rem 0; }
        .iso-stepnum { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-faint); text-align: center; }
        .iso-cell { padding: 0.45em 0.7em; border: 1.5px solid var(--ink); border-radius: var(--radius); font-family: var(--font-mono); font-size: 0.85rem; background: var(--paper); }
        .iso-cell.empty { background: transparent; border: 1.5px dashed transparent; }
        .iso-cell.t1 { background: #fff6dc; }
        .iso-cell.t2 { background: #e6f0ff; }
        .iso-cell.write { border-color: var(--accent); }
        .iso-cell.abort { background: var(--accent); color: white; border-color: var(--accent); }
        .iso-row.bad .iso-cell.t1, .iso-row.bad .iso-cell.t2 { box-shadow: 0 0 0 2px var(--accent); }
        .iso-row.good .iso-cell.t1, .iso-row.good .iso-cell.t2 { box-shadow: 0 0 0 2px #2a8a3e; }
      </style>
    `;
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }
  render();
}
