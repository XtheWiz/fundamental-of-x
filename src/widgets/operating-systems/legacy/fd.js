// FD widget: simulate two processes' FD tables. User can run a few
// canned scenarios that mirror what a shell does for redirection / pipes.

const SCENARIOS = {
  base: {
    label: 'Start: fresh shell',
    description: 'Three default FDs in each process, pointing to the terminal.',
    procs: [
      { name: 'shell', fds: { 0: 'tty (read)', 1: 'tty (write)', 2: 'tty (write)' } },
    ],
  },
  open: {
    label: 'fd = open("foo.txt")',
    description: 'open() returns the lowest free FD — here 3. The file now appears in the table.',
    procs: [
      { name: 'shell', fds: { 0: 'tty (read)', 1: 'tty (write)', 2: 'tty (write)', 3: 'foo.txt (file)' } },
    ],
  },
  redirOut: {
    label: 'shell: ls > out.txt',
    description: 'Shell forks. Child opens out.txt (gets fd 3), then dup2(3, 1) overwrites stdout. exec("ls"). Now writes go to the file, not the terminal.',
    procs: [
      { name: 'shell', fds: { 0: 'tty (read)', 1: 'tty (write)', 2: 'tty (write)' } },
      { name: 'ls (child)', fds: { 0: 'tty (read)', 1: 'out.txt (file)', 2: 'tty (write)' } },
    ],
  },
  pipe: {
    label: 'shell: cat foo | grep bar',
    description: 'pipe() returns two FDs: read end + write end. Shell forks twice, dup2 to wire cat\'s stdout → pipe write, grep\'s stdin → pipe read. Both think they\'re using normal stdin/stdout.',
    procs: [
      { name: 'cat (child)',  fds: { 0: 'foo.txt (file)', 1: 'pipe (write)', 2: 'tty (write)' } },
      { name: 'grep (child)', fds: { 0: 'pipe (read)',    1: 'tty (write)',  2: 'tty (write)' } },
    ],
    pipe: true,
  },
  socket: {
    label: 'server: socket() + accept()',
    description: 'A socket is just another FD. accept() returns a new FD for the client connection. Same read/write API as files.',
    procs: [
      { name: 'server', fds: { 0: 'tty (read)', 1: 'tty (write)', 2: 'tty (write)', 3: 'tcp:8080 (listen)', 4: 'tcp client (accepted)' } },
    ],
  },
};

export function initFdWidget(root) {
  let scenario = 'base';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">FD tables in action</div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="fd-scen" style="min-width: 280px;">
          ${Object.entries(SCENARIOS).map(([id, s]) => `<option value="${id}">${s.label}</option>`).join('')}
        </select>
      </div>

      <div class="widget-stage" id="fd-stage" style="min-height: 240px;"></div>

      <div class="callout" id="fd-note"></div>
    </div>
  `;

  root.querySelector('#fd-scen').addEventListener('change', (e) => { scenario = e.target.value; render(); });

  function render() {
    const s = SCENARIOS[scenario];
    let html = `<div class="fd-procs">`;
    s.procs.forEach((p) => {
      html += `<div class="fd-proc">
        <div class="fd-proc-name">${escape(p.name)}</div>
        <table class="fd-table">
          <thead><tr><th>fd</th><th>points to</th></tr></thead>
          <tbody>
            ${Object.entries(p.fds).map(([fd, target]) => {
              const kind = fd === '0' ? 'stdin' : fd === '1' ? 'stdout' : fd === '2' ? 'stderr' : 'opened';
              const tgtCls = target.includes('pipe') ? 'pipe' : target.includes('file') || target.includes('foo') || target.includes('out') ? 'file' : target.includes('tcp') ? 'sock' : 'tty';
              return `<tr><td><code>${fd}</code> <span class="fd-kind">${kind}</span></td><td><span class="fd-target ${tgtCls}">${escape(target)}</span></td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
    });
    html += `</div>`;
    if (s.pipe) {
      html += `<div class="fd-pipe-note">⤷ The "pipe (write)" in cat and "pipe (read)" in grep are <strong>two FDs pointing at the same kernel buffer</strong>. Bytes written to one come out the other.</div>`;
    }
    html += `<style>
      .fd-procs { display: grid; grid-template-columns: ${s.procs.length > 1 ? '1fr 1fr' : '1fr'}; gap: 0.6rem; }
      .fd-proc { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; }
      .fd-proc-name { font-family: var(--font-display); letter-spacing: 1.5px; font-size: 1rem; margin-bottom: 0.4em; }
      .fd-table { width: 100%; border-collapse: collapse; }
      .fd-table th, .fd-table td { padding: 0.3em 0.5em; border: 1px solid var(--ink); font-family: var(--font-mono); font-size: 0.85rem; }
      .fd-table th { background: var(--paper); font-family: var(--font-display); letter-spacing: 0.04em; font-weight: 400; font-size: 0.78rem; }
      .fd-kind { color: var(--ink-soft); font-size: 0.75rem; margin-left: 0.4em; }
      .fd-target { padding: 0.1em 0.4em; border: 1.5px solid var(--ink); border-radius: 2px; display: inline-block; }
      .fd-target.tty { background: var(--paper); }
      .fd-target.file { background: #cfe5ff; }
      .fd-target.pipe { background: #ffe9b3; }
      .fd-target.sock { background: #c8f0c8; }
      .fd-pipe-note { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; margin-top: 0.4rem; font-size: 0.88rem; }
      @media (max-width: 640px) { .fd-procs { grid-template-columns: 1fr; } }
    </style>`;
    root.querySelector('#fd-stage').innerHTML = html;
    root.querySelector('#fd-note').innerHTML = s.description;
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
