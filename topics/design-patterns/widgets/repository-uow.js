// Repository & UoW widget: simulate operations, show UoW change list,
// commit or rollback.

const REPO_BAD = `// business logic writes SQL directly
async function createOrder(userId, items) {
  await db.query(
    "INSERT INTO orders (user_id, status) VALUES (?, ?)",
    [userId, 'open']);
  const orderId = db.lastId();
  for (const it of items) {
    await db.query(
      "INSERT INTO order_items (order_id, product_id, qty) VALUES (?, ?, ?)",
      [orderId, it.productId, it.qty]);
  }
  await db.query(
    "UPDATE users SET last_order_at = NOW() WHERE id = ?",
    [userId]);
  // 3 separate transactions; what if one fails?
}`;

const REPO_GOOD = `// business logic talks to repositories + UoW
async function createOrder(userId, items, uow) {
  const user = await uow.users.byId(userId);
  const order = new Order(user, 'open');
  for (const it of items) order.addItem(it.productId, it.qty);
  uow.orders.add(order);
  user.recordOrderPlaced();   // updates last_order_at in memory
  // nothing persisted yet — all in the UoW's change list
}

// At the boundary:
const uow = new UnitOfWork(db);
await createOrder(userId, items, uow);
await uow.commit();   // one transaction; all-or-nothing`;

export function initRepositoryUoWWidget(root) {
  const uow = {
    changes: [],
    committed: false,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Build up changes, then commit (or rollback)</div>

      <div class="controls">
        <button class="btn" id="uw-add-order">orders.add(Order(...))</button>
        <button class="btn" id="uw-add-item">order.addItem(productId, qty)</button>
        <button class="btn" id="uw-update-user">user.recordOrderPlaced()</button>
        <button class="btn btn-accent" id="uw-commit">uow.commit()</button>
        <button class="btn" id="uw-rollback">uow.rollback()</button>
        <button class="btn btn-ghost" id="uw-reset">Reset</button>
      </div>

      <div class="widget-stage" id="uw-stage" style="min-height: 200px;"></div>

      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Without Repository/UoW</div>
          <pre>${escape(REPO_BAD)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ With Repository + UoW</div>
          <pre>${escape(REPO_GOOD)}</pre>
        </div>
      </div>
    </div>
  `;

  root.querySelector('#uw-add-order').addEventListener('click', () => addChange('INSERT', 'orders', 'new Order(user, "open")'));
  root.querySelector('#uw-add-item').addEventListener('click', () => addChange('INSERT', 'order_items', 'product_id=42, qty=2'));
  root.querySelector('#uw-update-user').addEventListener('click', () => addChange('UPDATE', 'users', 'last_order_at=NOW()'));
  root.querySelector('#uw-commit').addEventListener('click', commit);
  root.querySelector('#uw-rollback').addEventListener('click', rollback);
  root.querySelector('#uw-reset').addEventListener('click', () => {
    uow.changes = []; uow.committed = false; render();
  });

  function addChange(op, table, detail) {
    if (uow.committed) return;
    uow.changes.push({ op, table, detail });
    render();
  }

  function commit() {
    if (!uow.changes.length) return;
    uow.committed = true;
    render();
  }

  function rollback() {
    uow.changes = []; uow.committed = false; render();
  }

  function render() {
    let html = `
      <div class="uw-header">
        <strong>Unit of Work change list</strong> — ${uow.changes.length} pending operation(s)
        ${uow.committed ? '<span class="uw-tag commit">✓ COMMITTED</span>' : ''}
      </div>
      <div class="uw-changes">
        ${uow.changes.length === 0 ? '<div class="uw-empty">(no changes yet)</div>' :
          uow.changes.map((c, i) => `<div class="uw-change">${String(i + 1).padStart(2, '0')}. <span class="uw-op">${c.op}</span> <code>${escape(c.table)}</code> — ${escape(c.detail)}</div>`).join('')}
      </div>
      <div class="uw-note">
        ${uow.committed
          ? 'All operations sent to the database in <strong>one</strong> transaction. If any one failed, none would have been applied.'
          : uow.changes.length
            ? 'Nothing has been written to the database yet. The UoW tracks the changes; <code>commit()</code> sends them all at once.'
            : 'Click some operations above to build up a pending changeset.'}
      </div>
      <style>
        .uw-header { font-family: var(--font-mono); font-size: 0.9rem; margin-bottom: 0.4rem; }
        .uw-tag { background: #2a8a3e; color: white; padding: 0.15em 0.5em; border-radius: 2px; font-family: var(--font-display); letter-spacing: 1px; font-size: 0.7rem; margin-left: 0.5em; }
        .uw-changes { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; min-height: 60px; margin-bottom: 0.4rem; }
        .uw-change { font-family: var(--font-mono); font-size: 0.78rem; padding: 0.18em 0; }
        .uw-op { display: inline-block; font-family: var(--font-mono); font-size: 0.7rem; padding: 0.05em 0.4em; background: var(--accent); color: white; border-radius: 2px; }
        .uw-empty { color: var(--ink-faint); font-family: var(--font-mono); font-size: 0.85rem; }
        .uw-note { font-size: 0.88rem; padding: 0.4rem 0.6rem; background: var(--paper); border: 1.5px solid var(--ink); border-radius: var(--radius); }
      </style>
    `;
    root.querySelector('#uw-stage').innerHTML = html;
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
