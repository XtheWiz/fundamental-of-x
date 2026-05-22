// Containers widget: toggle namespaces on/off and show what the
// contained process sees vs the host.

const NAMESPACES = [
  {
    id: 'pid',
    label: 'PID',
    hostView:      'PIDs 1, 2, 3, …, 14523 (entire system)',
    containedView: 'PIDs 1 (this proc), 2 (its child)',
    effect: 'kill 1 outside the container kills init; kill 1 inside only kills the container.',
  },
  {
    id: 'net',
    label: 'NET',
    hostView:      'eth0 192.168.1.10, docker0, lo, plus 100 other veth pairs',
    containedView: 'eth0 172.17.0.5, lo (own loopback)',
    effect: 'Your container can bind port 80 even if the host has port 80 taken.',
  },
  {
    id: 'mnt',
    label: 'MNT',
    hostView:      '/, /home, /var, /etc — full host filesystem',
    containedView: '/ (from image), /etc/hosts, /etc/resolv.conf, /sys (limited)',
    effect: 'Container "/" is actually an overlay mount; the host\'s "/" is invisible.',
  },
  {
    id: 'uts',
    label: 'UTS',
    hostView:      'hostname: my-laptop',
    containedView: 'hostname: a3f9c8d2b1e0',
    effect: '`hostname new-name` inside doesn\'t change the host.',
  },
  {
    id: 'ipc',
    label: 'IPC',
    hostView:      'shared mem segments + sysv queues from all processes',
    containedView: 'only the container\'s own IPC objects',
    effect: 'Two containers can\'t share posix shm by accident.',
  },
  {
    id: 'user',
    label: 'USER',
    hostView:      'uid 1000 (xthewiz), uid 0 (root), …',
    containedView: 'uid 0 (root inside) → mapped to uid 100000 on host',
    effect: 'Container "root" has no actual host privileges. Modern, recommended.',
  },
];

const CGROUPS = [
  { id: 'cpu', label: 'CPU', value: '50% of one core', desc: 'cpu.max = "50000 100000"' },
  { id: 'mem', label: 'Memory', value: '512 MB', desc: 'memory.max = "536870912"' },
  { id: 'io', label: 'Block I/O', value: '10 MB/s read', desc: 'io.max = "8:0 rbps=10485760"' },
  { id: 'pids', label: 'Max PIDs', value: '100', desc: 'pids.max = "100"' },
];

export function initContainersWidget(root) {
  const enabled = new Set();   // namespaces currently on

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Build a container, namespace by namespace</div>

      <div class="controls">
        <strong>Namespaces:</strong>
        ${NAMESPACES.map((n) => `
          <label style="display: inline-flex; gap: 0.25em; align-items: center;">
            <input type="checkbox" data-ns="${n.id}"> ${n.label}
          </label>
        `).join('')}
        <button class="btn" id="ct-all">All on</button>
        <button class="btn btn-ghost" id="ct-none">Reset</button>
      </div>

      <div class="widget-stage" id="ct-stage" style="min-height: 380px;"></div>
    </div>
  `;

  root.querySelectorAll('input[data-ns]').forEach((cb) =>
    cb.addEventListener('change', (e) => {
      if (e.target.checked) enabled.add(e.target.dataset.ns);
      else enabled.delete(e.target.dataset.ns);
      render();
    })
  );
  root.querySelector('#ct-all').addEventListener('click', () => {
    NAMESPACES.forEach((n) => enabled.add(n.id));
    root.querySelectorAll('input[data-ns]').forEach((cb) => cb.checked = true);
    render();
  });
  root.querySelector('#ct-none').addEventListener('click', () => {
    enabled.clear();
    root.querySelectorAll('input[data-ns]').forEach((cb) => cb.checked = false);
    render();
  });

  function render() {
    let html = `
      <div class="ct-grid">
        <div class="ct-side host">
          <div class="ct-side-label">HOST KERNEL</div>
          <div class="ct-content">
    `;
    NAMESPACES.forEach((n) => {
      html += `<div class="ct-ns-row"><strong>${n.label}:</strong> ${escape(n.hostView)}</div>`;
    });
    html += `</div></div>
        <div class="ct-side container">
          <div class="ct-side-label">CONTAINER VIEW</div>
          <div class="ct-content">
    `;
    NAMESPACES.forEach((n) => {
      const on = enabled.has(n.id);
      html += `<div class="ct-ns-row ${on ? 'isolated' : 'shared'}">
        <strong>${n.label}:</strong> ${escape(on ? n.containedView : n.hostView)}
        ${on ? '<span class="ct-tag iso">isolated</span>' : '<span class="ct-tag shr">shared with host</span>'}
      </div>`;
    });
    html += `</div></div>
      </div>

      <div class="ct-cgroups">
        <div class="ct-side-label">CGROUPS (resource limits) — always on for a real container</div>
        <div class="ct-cgroup-grid">
          ${CGROUPS.map((c) => `
            <div class="ct-cgroup">
              <div class="ct-cgroup-name">${c.label}</div>
              <div class="ct-cgroup-val">${c.value}</div>
              <div class="ct-cgroup-desc">${escape(c.desc)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="ct-summary">
        ${enabled.size === 0 ? '0 namespaces enabled — this is just a normal process. No isolation yet.' :
          enabled.size === NAMESPACES.size ? `<strong>${enabled.size}/${NAMESPACES.size} namespaces enabled — congratulations, you have a container.</strong> This is roughly what \`docker run\` configures for you.` :
          `${enabled.size}/${NAMESPACES.size} namespaces enabled. The rest are shared with the host — partial isolation.`}
      </div>

      <style>
        .ct-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
        .ct-side { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; }
        .ct-side.host { background: #ffe9b3; }
        .ct-side.container { background: #cfe5ff; }
        .ct-side-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.85rem; margin-bottom: 0.4em; }
        .ct-ns-row { font-family: var(--font-mono); font-size: 0.78rem; padding: 0.25em 0.4em; background: var(--paper); border: 1.5px solid var(--ink); border-radius: 2px; margin: 0.15em 0; position: relative; padding-right: 5rem; }
        .ct-ns-row.isolated { background: #d6f5d6; }
        .ct-tag { position: absolute; right: 0.4em; top: 50%; transform: translateY(-50%); font-size: 0.65rem; padding: 0.1em 0.4em; border: 1px solid var(--ink); border-radius: 2px; }
        .ct-tag.iso { background: #2a8a3e; color: white; }
        .ct-tag.shr { background: var(--paper-deep); color: var(--ink-soft); }
        .ct-cgroups { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; margin-top: 0.6rem; }
        .ct-cgroup-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; }
        .ct-cgroup { background: var(--paper); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 0.4rem 0.5rem; text-align: center; }
        .ct-cgroup-name { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.85rem; }
        .ct-cgroup-val { font-family: var(--font-mono); font-size: 0.95rem; font-weight: 600; }
        .ct-cgroup-desc { font-family: var(--font-mono); font-size: 0.65rem; color: var(--ink-soft); }
        .ct-summary { margin-top: 0.6rem; padding: 0.6rem 0.8rem; background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); box-shadow: 3px 3px 0 var(--accent); }
        @media (max-width: 720px) { .ct-grid { grid-template-columns: 1fr; } .ct-cgroup-grid { grid-template-columns: repeat(2, 1fr); } }
      </style>
    `;
    root.querySelector('#ct-stage').innerHTML = html;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
