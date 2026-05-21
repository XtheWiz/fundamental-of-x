// Processes vs Threads widget: a small forest of processes, each
// with one or more threads. Buttons to fork/spawn/exec/exit; view
// shows each process's address space + thread list.

let nextPid = 100;
let nextTid = 1;

export function initProcessesWidget(root) {
  const state = {
    processes: [
      { pid: 1, ppid: 0, prog: 'init', addr: 'AS-1', fdTable: ['stdin','stdout','stderr'], threads: [{ tid: 1 }] },
    ],
    log: [],
    selected: 1,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Process &amp; thread tree</div>
      <p class="widget-hint">Click a process to select it; fork it, exec into something else, or spawn a thread.</p>

      <div class="controls">
        <button class="btn btn-accent" id="pp-fork">fork()</button>
        <button class="btn" id="pp-exec">exec("/bin/grep")</button>
        <button class="btn" id="pp-thread">pthread_create()</button>
        <button class="btn" id="pp-exit">exit()</button>
        <button class="btn btn-ghost" id="pp-reset">Reset</button>
      </div>

      <div class="widget-stage" id="pp-stage" style="min-height: 340px;"></div>

      <div class="log" id="pp-log"></div>
    </div>
  `;

  const stage = root.querySelector('#pp-stage');
  const logEl = root.querySelector('#pp-log');
  root.querySelector('#pp-fork').addEventListener('click', doFork);
  root.querySelector('#pp-exec').addEventListener('click', doExec);
  root.querySelector('#pp-thread').addEventListener('click', doThread);
  root.querySelector('#pp-exit').addEventListener('click', doExit);
  root.querySelector('#pp-reset').addEventListener('click', () => {
    nextPid = 100; nextTid = 1;
    state.processes = [{ pid: 1, ppid: 0, prog: 'init', addr: 'AS-1', fdTable: ['stdin','stdout','stderr'], threads: [{ tid: 1 }] }];
    state.log = [];
    state.selected = 1;
    logEl.innerHTML = '';
    render();
  });

  function doFork() {
    const parent = state.processes.find((p) => p.pid === state.selected);
    if (!parent) return;
    const child = {
      pid: nextPid++,
      ppid: parent.pid,
      prog: parent.prog,
      addr: 'AS-' + parent.pid + '.' + nextPid,  // distinct address space (copy-on-write under the hood)
      fdTable: parent.fdTable.slice(),
      threads: [{ tid: nextTid++ }],   // one main thread in the child
    };
    state.processes.push(child);
    addLog('ok', `fork(): parent PID=${parent.pid} → child PID=${child.pid}. Child gets its own address space (COW) and a copy of the FD table.`);
    render();
  }
  function doExec() {
    const p = state.processes.find((x) => x.pid === state.selected);
    if (!p) return;
    const newProg = '/bin/grep';
    p.prog = newProg;
    // exec keeps PID, FDs by default. New address space (the program's).
    p.addr = 'AS-' + p.pid + '*';
    p.threads = [{ tid: nextTid++ }];   // single thread after exec
    addLog('info', `exec("${newProg}"): PID=${p.pid} keeps its identity but loads a new program. FDs preserved; threads reset to one.`);
    render();
  }
  function doThread() {
    const p = state.processes.find((x) => x.pid === state.selected);
    if (!p) return;
    p.threads.push({ tid: nextTid++ });
    addLog('ok', `pthread_create(): new thread TID=${p.threads[p.threads.length - 1].tid} in PID=${p.pid}. Shares the address space + FD table with sibling threads.`);
    render();
  }
  function doExit() {
    const p = state.processes.find((x) => x.pid === state.selected);
    if (!p || p.pid === 1) { addLog('err', `Can't exit init (PID 1) in this demo.`); return; }
    state.processes = state.processes.filter((x) => x.pid !== p.pid);
    addLog('info', `exit(): PID=${p.pid} terminated. Its address space, FDs, and threads are reclaimed by the kernel.`);
    state.selected = 1;
    render();
  }

  function render() {
    let html = `<div class="pp-grid">`;
    state.processes.forEach((p) => {
      const sel = p.pid === state.selected;
      html += `
        <div class="pp-proc ${sel ? 'sel' : ''}" data-pid="${p.pid}">
          <div class="pp-proc-name">PID ${p.pid} — ${escape(p.prog)} <span class="pp-proc-ppid">ppid=${p.ppid}</span></div>
          <div class="pp-proc-sub">${p.addr}  ·  ${p.fdTable.length} fds</div>
          <div class="pp-threads">
            ${p.threads.map((t) => `<div class="pp-thread">TID ${t.tid}</div>`).join('')}
          </div>
        </div>
      `;
    });
    html += `</div>`;
    html += `<style>
      .pp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.6rem; }
      .pp-proc { background: #c8f0c8; border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; cursor: pointer; transition: transform 0.12s, box-shadow 0.12s; }
      .pp-proc:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--ink); }
      .pp-proc.sel { box-shadow: 4px 4px 0 var(--accent); border-color: var(--accent); transform: translate(-2px, -2px); }
      .pp-proc-name { font-family: var(--font-display); letter-spacing: 0.04em; font-size: 1rem; }
      .pp-proc-ppid { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); font-weight: normal; }
      .pp-proc-sub { font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-soft); margin-bottom: 0.4em; }
      .pp-threads { display: flex; gap: 0.3rem; flex-wrap: wrap; }
      .pp-thread { background: #ffe9b3; border: 1.5px solid var(--ink); border-radius: 2px; padding: 0.15em 0.4em; font-family: var(--font-mono); font-size: 0.7rem; }
    </style>`;
    stage.innerHTML = html;
    stage.querySelectorAll('.pp-proc').forEach((el) =>
      el.addEventListener('click', () => { state.selected = Number(el.dataset.pid); render(); })
    );
  }

  function addLog(level, msg) {
    state.log.unshift({ level, msg, t: new Date().toLocaleTimeString() });
    const d = document.createElement('div');
    d.className = `entry ${level}`;
    d.innerHTML = `<span class="t">${new Date().toLocaleTimeString()}</span>${msg}`;
    logEl.prepend(d);
    while (logEl.children.length > 50) logEl.removeChild(logEl.lastChild);
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  render();
}
