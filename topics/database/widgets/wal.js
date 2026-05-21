// WAL widget: lets the user step through writes, see the buffer pool /
// WAL / disk diverge, crash at any point, and observe recovery.

export function initWalWidget(root) {
  const initialDisk = { x: 10, y: 20 };
  const state = {
    mem: { x: 10, y: 20 },          // current "memory" view
    walEntries: [],                  // [{seq, op, committed, flushed}]
    disk: { x: 10, y: 20 },          // last flushed data page
    pending: [],                     // pending ops in current txn
    txnOpen: false,
    seq: 0,
    crashed: false,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">A Transaction in Slow Motion</div>
      <p class="widget-hint">Begin a transaction, modify <code>x</code> and <code>y</code> a few times, then commit. Or crash before committing — watch what recovery does.</p>

      <div class="widget-stage" id="wal-stage" style="min-height: 220px;"></div>

      <div class="controls">
        <button class="btn" id="wal-begin">BEGIN</button>
        <button class="btn" id="wal-set-x">UPDATE x = ?</button>
        <button class="btn" id="wal-set-y">UPDATE y = ?</button>
        <button class="btn btn-accent" id="wal-commit">COMMIT</button>
        <button class="btn" id="wal-flush">Flush data page</button>
        <button class="btn" id="wal-crash">💥 Crash</button>
        <button class="btn btn-ghost" id="wal-reset">Reset</button>
      </div>

      <div class="log" id="wal-log"></div>
    </div>
  `;

  const stage = root.querySelector('#wal-stage');
  const logEl = root.querySelector('#wal-log');

  function log(level, msg) {
    const d = document.createElement('div');
    d.className = `entry ${level}`;
    d.innerHTML = `<span class="t">${new Date().toLocaleTimeString()}</span>${msg}`;
    logEl.prepend(d);
  }

  root.querySelector('#wal-begin').addEventListener('click', () => {
    if (state.crashed) return log('err', 'Server is down — reset first.');
    if (state.txnOpen) return log('err', 'A transaction is already open.');
    state.txnOpen = true;
    state.pending = [];
    log('info', 'BEGIN TRANSACTION');
    render();
  });

  root.querySelector('#wal-set-x').addEventListener('click', () => {
    if (state.crashed) return;
    if (!state.txnOpen) return log('err', 'No open transaction. Click BEGIN first.');
    const v = randNum();
    state.mem.x = v;
    state.seq += 1;
    state.walEntries.push({ seq: state.seq, op: `SET x=${v}`, committed: false });
    state.pending.push(state.seq);
    log('info', `Memory: x=${v}.  WAL append (uncommitted, seq=${state.seq}).`);
    render();
  });

  root.querySelector('#wal-set-y').addEventListener('click', () => {
    if (state.crashed) return;
    if (!state.txnOpen) return log('err', 'No open transaction. Click BEGIN first.');
    const v = randNum();
    state.mem.y = v;
    state.seq += 1;
    state.walEntries.push({ seq: state.seq, op: `SET y=${v}`, committed: false });
    state.pending.push(state.seq);
    log('info', `Memory: y=${v}.  WAL append (uncommitted, seq=${state.seq}).`);
    render();
  });

  root.querySelector('#wal-commit').addEventListener('click', () => {
    if (state.crashed) return;
    if (!state.txnOpen) return log('err', 'Nothing to commit.');
    state.walEntries.forEach((e) => { if (state.pending.includes(e.seq)) e.committed = true; });
    state.seq += 1;
    state.walEntries.push({ seq: state.seq, op: 'COMMIT', committed: true, isCommit: true });
    log('ok', `fsync(WAL).  COMMIT durable (data page still in memory only).`);
    state.pending = [];
    state.txnOpen = false;
    render();
  });

  root.querySelector('#wal-flush').addEventListener('click', () => {
    if (state.crashed) return;
    state.disk = { ...state.mem };
    state.walEntries.forEach((e) => e.flushed = true);
    log('ok', `Data page flushed to disk. x=${state.disk.x}, y=${state.disk.y}.`);
    render();
  });

  root.querySelector('#wal-crash').addEventListener('click', async () => {
    if (state.crashed) return;
    state.crashed = true;
    log('err', '💥 Power cut! Memory wiped.');
    state.mem = { ...state.disk }; // memory gone
    state.pending = [];
    state.txnOpen = false;
    render();
    await wait(800);
    log('info', 'Restarting… reading WAL…');
    await wait(600);
    // recovery: redo committed entries that aren't yet flushed
    const replayed = [];
    state.walEntries.forEach((e) => {
      if (e.committed && !e.flushed && !e.isCommit) {
        const m = e.op.match(/SET (x|y)=(\-?\d+)/);
        if (m) {
          state.mem[m[1]] = Number(m[2]);
          replayed.push(e.op);
        }
      }
    });
    if (replayed.length) {
      log('ok', `Replayed: ${replayed.join(', ')}`);
    } else {
      log('info', 'Nothing to replay — committed state matches disk.');
    }
    // discard uncommitted entries from WAL view
    state.walEntries = state.walEntries.filter((e) => e.committed);
    state.crashed = false;
    render();
    log('ok', 'Recovery complete. Database online.');
  });

  root.querySelector('#wal-reset').addEventListener('click', () => {
    state.mem = { x: 10, y: 20 };
    state.disk = { x: 10, y: 20 };
    state.walEntries = [];
    state.pending = [];
    state.txnOpen = false;
    state.seq = 0;
    state.crashed = false;
    logEl.innerHTML = '';
    render();
  });

  function render() {
    stage.innerHTML = `
      <div class="wal-grid">
        <div class="wal-row">
          <div class="wal-label">Memory<br><span>(buffer pool)</span></div>
          <div class="wal-data ${state.crashed ? 'crashed' : ''}">
            x = <strong>${state.crashed ? '?' : state.mem.x}</strong> &nbsp;&nbsp;
            y = <strong>${state.crashed ? '?' : state.mem.y}</strong>
            ${state.txnOpen ? '<span class="badge warn">TXN OPEN</span>' : ''}
          </div>
        </div>
        <div class="wal-row">
          <div class="wal-label">WAL<br><span>(append-only)</span></div>
          <div class="wal-entries">
            ${state.walEntries.length === 0 ? '<span style="color: var(--ink-faint);">(empty)</span>' :
              state.walEntries.map((e) => `<span class="wal-cell ${e.committed ? 'committed' : 'uncommitted'}" title="seq=${e.seq}">${e.op}</span>`).join('')}
          </div>
        </div>
        <div class="wal-row">
          <div class="wal-label">Disk<br><span>(data file)</span></div>
          <div class="wal-data">
            x = <strong>${state.disk.x}</strong> &nbsp;&nbsp;
            y = <strong>${state.disk.y}</strong>
          </div>
        </div>
      </div>
      <style>
        .wal-grid { display: flex; flex-direction: column; gap: 0.5rem; }
        .wal-row { display: grid; grid-template-columns: 130px 1fr; gap: 0.6rem; align-items: center; }
        .wal-label { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.04em; text-align: right; color: var(--ink); }
        .wal-label span { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.1em; }
        .wal-data { background: var(--paper); border: 2px solid var(--ink); padding: 0.6em 0.8em; border-radius: var(--radius); font-family: var(--font-mono); font-size: 1rem; }
        .wal-data.crashed { background: #eee; color: var(--ink-faint); }
        .wal-entries { background: var(--paper-deep); border: 2px solid var(--ink); padding: 0.5em; border-radius: var(--radius); display: flex; flex-wrap: wrap; gap: 0; min-height: 36px; }
      </style>
    `;
  }

  function randNum() {
    return Math.floor(Math.random() * 90 + 10);
  }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  render();
}
