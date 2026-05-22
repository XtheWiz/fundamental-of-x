// Query execution widget: takes a preset SQL query and walks the user
// through parse → analyze → optimize → execute → return, with each
// stage producing a visible artifact.

const PRESETS = [
  {
    sql: "SELECT name FROM users WHERE city = 'Tokyo'",
    ast: {
      type: 'Select',
      columns: ['name'],
      from: 'users',
      where: { op: '=', left: 'city', right: "'Tokyo'" },
    },
    analyzed: 'users.name exists ✅ · users.city exists ✅ · type(city)=TEXT, "Tokyo" is TEXT ✅',
    plans: [
      { name: 'Seq Scan on users', filter: 'city = "Tokyo"', cost: 1000, rows: 320, chosen: false },
      { name: 'Index Scan on users_city_idx', filter: 'city = "Tokyo"', cost: 24, rows: 320, chosen: true },
    ],
    chosenPlan: 1,
    results: ['Aiko', 'Kenji', 'Yuna', 'Hiro', 'Sora'],
  },
  {
    sql: "SELECT SUM(price) FROM orders WHERE created_at > '2026-01-01'",
    ast: {
      type: 'Select',
      columns: ['SUM(price)'],
      from: 'orders',
      where: { op: '>', left: 'created_at', right: "'2026-01-01'" },
    },
    analyzed: 'orders.price NUMERIC ✅ · orders.created_at TIMESTAMP ✅ · SUM applicable to NUMERIC ✅',
    plans: [
      { name: 'Index Scan on orders_created_idx', filter: 'created_at > 2026-01-01', cost: 540, rows: 12340, chosen: true },
      { name: 'Seq Scan + Filter', filter: 'created_at > 2026-01-01', cost: 18200, rows: 12340, chosen: false },
    ],
    chosenPlan: 0,
    results: ['SUM(price) = 4,820,113.50'],
  },
  {
    sql: "SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id WHERE u.country = 'JP'",
    ast: {
      type: 'Select',
      columns: ['u.name', 'o.total'],
      from: 'users u JOIN orders o ON u.id = o.user_id',
      where: { op: '=', left: 'u.country', right: "'JP'" },
    },
    analyzed: 'Aliases u, o resolved. Foreign key orders.user_id → users.id detected.',
    plans: [
      { name: 'Nested Loop  (users → orders)', filter: 'JP users × all their orders', cost: 880, rows: 4500, chosen: false },
      { name: 'Hash Join  (build users[JP], probe orders)', filter: 'users.country=JP, hash on id', cost: 220, rows: 4500, chosen: true },
      { name: 'Merge Join  (sort both)', filter: 'sort both inputs', cost: 1200, rows: 4500, chosen: false },
    ],
    chosenPlan: 1,
    results: ['Aiko → ¥4,200', 'Kenji → ¥980', 'Hiro → ¥12,400', 'Yuna → ¥3,100', '…'],
  },
];

const STAGES = [
  { id: 'parse', label: '1. Parse', sub: 'SQL → AST' },
  { id: 'bind', label: '2. Bind', sub: 'Resolve names' },
  { id: 'optimize', label: '3. Optimize', sub: 'Pick a plan' },
  { id: 'execute', label: '4. Execute', sub: 'Run the plan' },
  { id: 'return', label: '5. Return', sub: 'Stream rows' },
];

export function initQueryWidget(root) {
  let preset = 0;
  let stage = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">From SQL to Result Set</div>

      <div class="controls">
        <label>Query:</label>
        <select class="field" id="q-select">
          ${PRESETS.map((p, i) => `<option value="${i}">${escape(p.sql)}</option>`).join('')}
        </select>
        <button class="btn btn-accent" id="q-next">Next Stage →</button>
        <button class="btn btn-ghost" id="q-reset">Reset</button>
      </div>

      <pre id="q-sql" style="background:var(--paper-deep); border:1.5px solid var(--ink); padding: 0.7rem 1rem; font-family: var(--font-mono); font-size: 1rem;"></pre>

      <div class="widget-stage" id="q-stages" style="padding: 1rem 0.6rem;"></div>

      <div class="widget-stage" id="q-output" style="min-height: 60px;"></div>
    </div>
  `;

  const sqlEl = root.querySelector('#q-sql');
  const stagesEl = root.querySelector('#q-stages');
  const outEl = root.querySelector('#q-output');

  root.querySelector('#q-select').addEventListener('change', (e) => {
    preset = Number(e.target.value);
    stage = 0;
    render();
  });
  root.querySelector('#q-next').addEventListener('click', () => {
    if (stage < STAGES.length) stage += 1;
    render();
  });
  root.querySelector('#q-reset').addEventListener('click', () => {
    stage = 0;
    render();
  });

  function render() {
    const p = PRESETS[preset];
    sqlEl.innerHTML = highlight(p.sql);
    stagesEl.innerHTML = renderStages();
    outEl.innerHTML = renderOutput(p);
  }

  function renderStages() {
    return `
      <div class="q-stages">
        ${STAGES.map((s, i) => {
          const active = i < stage;
          const current = i === stage - 1;
          return `
            <div class="q-stage ${active ? 'on' : 'off'} ${current ? 'current' : ''}">
              <div class="q-stage-label">${s.label}</div>
              <div class="q-stage-sub">${s.sub}</div>
            </div>
            ${i < STAGES.length - 1 ? `<div class="q-arrow ${active ? 'on' : ''}">→</div>` : ''}
          `;
        }).join('')}
      </div>
      <style>
        .q-stages { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; justify-content: center; }
        .q-stage { padding: 0.6rem 0.8rem; border: 2px solid var(--ink); border-radius: var(--radius); min-width: 100px; text-align: center; background: var(--paper); }
        .q-stage.on { background: var(--accent); color: white; }
        .q-stage.current { box-shadow: 4px 4px 0 var(--ink); transform: translate(-2px, -2px); }
        .q-stage-label { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.04em; }
        .q-stage-sub { font-family: var(--font-mono); font-size: 0.7rem; opacity: 0.9; }
        .q-arrow { font-family: var(--font-display); font-size: 1.4rem; color: var(--ink-faint); }
        .q-arrow.on { color: var(--accent); }
      </style>
    `;
  }

  function renderOutput(p) {
    if (stage === 0) return `<div style="color: var(--ink-soft); text-align: center; padding: 1rem;">Click "Next Stage →" to begin.</div>`;
    if (stage === 1) {
      return panel('Abstract Syntax Tree (AST)', `<pre style="margin:0; font-family: var(--font-mono); font-size: 0.85rem;">${JSON.stringify(p.ast, null, 2)}</pre>`);
    }
    if (stage === 2) {
      return panel('Name resolution & type checks', `<div style="font-family: var(--font-mono); font-size: 0.9rem;">${p.analyzed}</div>`);
    }
    if (stage === 3) {
      const planRows = p.plans.map((pl) => `
        <tr class="${pl.chosen ? 'chosen' : ''}">
          <td>${pl.chosen ? '✅' : '⨯'}</td>
          <td>${escape(pl.name)}</td>
          <td>${escape(pl.filter)}</td>
          <td>${pl.cost}</td>
          <td>${pl.rows}</td>
        </tr>
      `).join('');
      return panel('Candidate plans (lower cost wins)', `
        <table class="plan-table">
          <thead><tr><th></th><th>Operator</th><th>Filter</th><th>Cost</th><th>Est. rows</th></tr></thead>
          <tbody>${planRows}</tbody>
        </table>
        <style>
          .plan-table { width: 100%; border-collapse: collapse; }
          .plan-table th, .plan-table td { border: 1.5px solid var(--ink); padding: 0.4em 0.6em; font-family: var(--font-mono); font-size: 0.85rem; text-align: left; }
          .plan-table tr.chosen { background: var(--accent-soft); }
          .plan-table th { background: var(--paper-deep); }
        </style>
      `);
    }
    if (stage === 4) {
      const chosen = p.plans[p.chosenPlan];
      return panel('Running…', `
        <div style="font-family: var(--font-mono); font-size: 0.9rem;">
          ▸ ${escape(chosen.name)}<br>
          ▸ filter: ${escape(chosen.filter)}<br>
          ▸ producing rows…
        </div>
      `);
    }
    if (stage >= 5) {
      return panel(`Result set (${p.results.length} rows)`, `
        <ul style="margin: 0; padding-left: 1.2rem; font-family: var(--font-mono); font-size: 0.9rem;">
          ${p.results.map((r) => `<li>${escape(r)}</li>`).join('')}
        </ul>
      `);
    }
  }

  function panel(title, body) {
    return `
      <div style="border: 2px solid var(--ink); background: var(--paper); border-radius: var(--radius); overflow: hidden;">
        <div style="background: var(--paper-deep); padding: 0.4em 0.8em; border-bottom: 1.5px solid var(--ink); font-family: var(--font-display); letter-spacing: 0.04em;">${title}</div>
        <div style="padding: 0.7em 0.9em;">${body}</div>
      </div>
    `;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  function highlight(sql) {
    return escape(sql)
      .replace(/\b(SELECT|FROM|WHERE|JOIN|ON|AND|OR|SUM|COUNT|BETWEEN|GROUP BY|ORDER BY|AS)\b/gi, '<span style="color: var(--accent); font-weight: 600;">$1</span>')
      .replace(/'([^']*)'/g, '<span style="color:#2a8a3e;">\'$1\'</span>')
      .replace(/\b(\d+)\b/g, '<span style="color:#1c6dd0;">$1</span>');
  }

  render();
}
