// IPC widget: pick a mechanism, see relative throughput, use cases,
// and a small "hello"-message exchange sequence.

const MECHANISMS = {
  pipe: {
    label: 'Pipe',
    throughput: 30,   // arbitrary relative GB/s scale
    kernelMediated: true,
    usecase: 'Shell pipelines, parent↔child streaming',
    seq: [
      'parent: pipe(fds) → [r=3, w=4]',
      'parent: fork()',
      'parent: close(3)  (only writes)',
      'child:  close(4)  (only reads)',
      'parent: write(4, "hello", 5)',
      'child:  read(3, buf, 5) → "hello"',
    ],
    code: `int fd[2];
pipe(fd);
if (fork() == 0) {
  close(fd[1]);
  read(fd[0], buf, n);
} else {
  close(fd[0]);
  write(fd[1], "hello", 5);
}`,
  },
  socket: {
    label: 'Unix socket',
    throughput: 40,
    kernelMediated: true,
    usecase: 'Docker daemon, X11, dbus, sidecar IPC — bidirectional, named',
    seq: [
      'server: socket() + bind("/tmp/sock") + listen()',
      'client: socket() + connect("/tmp/sock")',
      'server: accept() → connFd',
      'client: write(s, "hello", 5)',
      'server: read(connFd, buf, 5) → "hello"',
    ],
    code: `// server
int s = socket(AF_UNIX, SOCK_STREAM, 0);
bind(s, &addr, len);
listen(s, 5);
int c = accept(s, NULL, NULL);
read(c, buf, n);`,
  },
  shm: {
    label: 'Shared memory',
    throughput: 100,
    kernelMediated: false,
    usecase: 'High-throughput data — databases (Postgres), graphics, ML pipelines',
    seq: [
      'process A: shm_open("/x") + mmap() → ptr',
      'process B: shm_open("/x") + mmap() → same physical page',
      'A: strcpy(ptr, "hello")  // memory write, NO syscall',
      'B: read ptr  // direct memory read, NO syscall',
      '(synchronization with mutex/semaphore is your problem)',
    ],
    code: `int fd = shm_open("/x", O_CREAT | O_RDWR, 0666);
ftruncate(fd, 4096);
void *p = mmap(NULL, 4096, PROT_READ | PROT_WRITE,
               MAP_SHARED, fd, 0);
strcpy(p, "hello");`,
  },
  mq: {
    label: 'Message queue',
    throughput: 25,
    kernelMediated: true,
    usecase: 'Discrete messages with priorities; embedded / older Unix code',
    seq: [
      'A: mq_open("/q") → mqd',
      'B: mq_open("/q") → mqd',
      'A: mq_send(mqd, "hello", 5, prio=0)',
      'B: mq_receive(mqd, buf, 8192, NULL) → "hello"',
    ],
    code: `mqd_t q = mq_open("/q", O_CREAT | O_RDWR, 0666, &attr);
mq_send(q, "hello", 5, 0);
mq_receive(q, buf, sizeof buf, NULL);`,
  },
  signal: {
    label: 'Signal',
    throughput: 1,
    kernelMediated: true,
    usecase: 'Notifications ("reload", "terminate") — not data',
    seq: [
      'A: signal(SIGTERM, handler)',
      'B: kill(pid_of_A, SIGTERM)',
      'kernel: pauses A, calls handler(SIGTERM)',
      'A handler: cleanup + exit',
    ],
    code: `signal(SIGTERM, [](int){
  cleanup();
  exit(0);
});
// elsewhere
kill(other_pid, SIGTERM);`,
  },
  tcp: {
    label: 'TCP loopback',
    throughput: 15,
    kernelMediated: true,
    usecase: 'Cross-language services where Unix sockets aren\'t convenient (Windows, dev environments)',
    seq: [
      'server: socket(AF_INET) + bind(127.0.0.1:7000) + listen()',
      'client: socket(AF_INET) + connect(127.0.0.1:7000)',
      '(full TCP handshake, even on loopback)',
      'client: write(s, "hello", 5)',
      'server: read(c, buf, 5) → "hello"',
    ],
    code: `int s = socket(AF_INET, SOCK_STREAM, 0);
connect(s, &(struct sockaddr_in){
  .sin_family = AF_INET,
  .sin_port = htons(7000),
  .sin_addr.s_addr = htonl(INADDR_LOOPBACK),
}, sizeof addr);
write(s, "hello", 5);`,
  },
};

export function initIpcWidget(root) {
  let mech = 'pipe';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Pick your IPC</div>

      <div class="controls" id="ip-tabs">
        <div class="pill-group">
          ${Object.entries(MECHANISMS).map(([id, m], i) => `
            <input type="radio" name="ip-m" id="ip-${id}" value="${id}" ${i === 0 ? 'checked' : ''}>
            <label for="ip-${id}">${m.label}</label>
          `).join('')}
        </div>
      </div>

      <div class="widget-stage" id="ip-stage" style="min-height: 380px;"></div>
    </div>
  `;

  root.querySelectorAll('input[name=ip-m]').forEach((r) =>
    r.addEventListener('change', (e) => { mech = e.target.value; render(); })
  );

  function render() {
    const m = MECHANISMS[mech];
    const maxThr = Math.max(...Object.values(MECHANISMS).map((x) => x.throughput));
    const widthPct = (m.throughput / maxThr) * 100;

    let html = `
      <div class="ip-grid">
        <div class="ip-bar-block">
          <div class="ip-bar-label">RELATIVE THROUGHPUT</div>
          <div class="ip-bar"><div class="ip-bar-fill" style="width: ${widthPct}%;">${m.throughput}</div></div>
          <div class="ip-bar-axis"><span>0</span><span>${maxThr} (shm = baseline)</span></div>
          <div class="ip-meta">
            <div><strong>Kernel-mediated:</strong> ${m.kernelMediated ? 'Yes (syscall per send/recv)' : 'No (direct memory)'}</div>
            <div><strong>Best for:</strong> ${escape(m.usecase)}</div>
          </div>
        </div>

        <div class="ip-seq-block">
          <div class="ip-seq-label">EXCHANGE SEQUENCE</div>
          <ol class="ip-seq">
            ${m.seq.map((s) => `<li>${escape(s)}</li>`).join('')}
          </ol>
        </div>

        <div class="ip-code-block">
          <div class="ip-seq-label">SAMPLE CODE</div>
          <pre>${escape(m.code)}</pre>
        </div>
      </div>

      <style>
        .ip-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
        .ip-bar-block, .ip-seq-block, .ip-code-block { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; }
        .ip-bar-label, .ip-seq-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
        .ip-bar { height: 28px; background: var(--paper); border: 1.5px solid var(--ink); border-radius: 3px; overflow: hidden; margin-bottom: 0.2em; }
        .ip-bar-fill { height: 100%; background: var(--accent); color: white; font-family: var(--font-mono); font-size: 0.85rem; line-height: 28px; padding-left: 0.5em; }
        .ip-bar-axis { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); margin-bottom: 0.5em; }
        .ip-meta { font-family: var(--font-mono); font-size: 0.82rem; line-height: 1.6; }
        .ip-meta div { margin: 0.15em 0; }
        .ip-seq { margin: 0; padding-left: 1.2em; font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.6; }
        .ip-code-block { grid-column: 1 / -1; }
        .ip-code-block pre { margin: 0; font-family: var(--font-mono); font-size: 0.78rem; background: var(--paper); border: 1.5px solid var(--ink); padding: 0.5em 0.7em; border-radius: 2px; white-space: pre-wrap; }
        @media (max-width: 720px) { .ip-grid { grid-template-columns: 1fr; } .ip-code-block { grid-column: auto; } }
      </style>
    `;
    root.querySelector('#ip-stage').innerHTML = html;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
