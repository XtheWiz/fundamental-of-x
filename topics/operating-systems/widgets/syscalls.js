// Syscalls widget: step through the user-to-kernel-to-user round trip
// for a chosen syscall. Show register state (call number + args) and
// what happens at each ring transition.

const SYSCALLS = {
  write:  { num: 1,  args: ['fd=1', '"hello\\n"', 'len=6'], ret: 'bytes_written=6', desc: 'write data to a file descriptor' },
  read:   { num: 0,  args: ['fd=0', 'buf=0x7ff…', 'len=4096'], ret: 'bytes_read=128', desc: 'read from a file descriptor' },
  open:   { num: 2,  args: ['"/etc/hostname"', 'O_RDONLY=0', 'mode=0'], ret: 'fd=4', desc: 'open a file, returns a new fd' },
  fork:   { num: 57, args: ['(none)'], ret: 'pid=8472 (child) or 0 (parent)', desc: 'clone the current process' },
  exit:   { num: 60, args: ['code=0'], ret: '(does not return)', desc: 'terminate the process' },
};

const STEPS = [
  { side: 'user', label: '1. Application calls libc wrapper', detail: 'printf("hello\\n") in C eventually calls write(1, "hello\\n", 6).' },
  { side: 'user', label: '2. libc loads registers', detail: 'rax = syscall number, rdi/rsi/rdx = arguments. Then "syscall" instruction.' },
  { side: 'trap', label: '3. CPU traps to ring 0', detail: 'Saves user-mode state, switches to kernel stack, jumps to entry_SYSCALL_64.' },
  { side: 'kernel', label: '4. Kernel dispatches', detail: 'Looks up sys_call_table[rax], calls that function with the saved arg registers.' },
  { side: 'kernel', label: '5. Handler runs', detail: 'The actual implementation runs — touch buffers, talk to drivers, etc.' },
  { side: 'trap', label: '6. Trap return (sysret)', detail: 'Restores user-mode state, jumps back to the instruction after "syscall".' },
  { side: 'user', label: '7. Control resumes in user code', detail: 'rax holds the return value (or -errno on failure).' },
];

export function initSyscallsWidget(root) {
  let call = 'write';
  let step = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">User ↔ Kernel round trip</div>

      <div class="controls">
        <label>Syscall:</label>
        <select class="field" id="sy-call">
          ${Object.entries(SYSCALLS).map(([id, s]) => `<option value="${id}">${id}(${s.args.join(', ')})  → ${s.ret}</option>`).join('')}
        </select>
        <button class="btn btn-accent" id="sy-step">Next step →</button>
        <button class="btn btn-ghost" id="sy-reset">Reset</button>
      </div>

      <div class="widget-stage" id="sy-stage" style="min-height: 320px;"></div>
      <div class="callout" id="sy-note"></div>
    </div>
  `;

  root.querySelector('#sy-call').addEventListener('change', (e) => { call = e.target.value; step = 0; render(); });
  root.querySelector('#sy-step').addEventListener('click', () => { if (step < STEPS.length) step++; render(); });
  root.querySelector('#sy-reset').addEventListener('click', () => { step = 0; render(); });

  function render() {
    const cur = step === 0 ? null : STEPS[step - 1];
    const side = cur?.side ?? 'idle';
    const s = SYSCALLS[call];

    let html = `
      <div class="sy-ring">
        <div class="sy-zone user ${side === 'user' ? 'active' : ''}">
          <div class="sy-zone-label">USER MODE (ring 3)</div>
          <pre>${call}(${s.args.join(', ')});</pre>
          ${side === 'user' && step >= 2 ? `<div class="sy-reg">rax=${s.num} (syscall #)</div>` : ''}
          ${step >= STEPS.length ? `<div class="sy-result">→ ${escape(s.ret)}</div>` : ''}
        </div>

        <div class="sy-trap ${side === 'trap' ? 'active' : ''}">
          ${side === 'trap' ? '⚡ TRAP' : '· · ·'}
        </div>

        <div class="sy-zone kernel ${side === 'kernel' ? 'active' : ''}">
          <div class="sy-zone-label">KERNEL MODE (ring 0)</div>
          <pre>sys_call_table[${s.num}]
  → sys_${call}(${s.args.join(', ')})</pre>
          ${side === 'kernel' && step >= 4 ? `<div class="sy-reg">handler: ${escape(s.desc)}</div>` : ''}
        </div>
      </div>

      <div class="sy-steps">
        ${STEPS.map((st, i) => `
          <div class="sy-step ${i < step ? 'done' : ''} ${i === step - 1 ? 'cur' : ''}">
            <div class="sy-step-num">${String(i + 1).padStart(2, '0')}</div>
            <div class="sy-step-label">${escape(st.label)}</div>
          </div>
        `).join('')}
      </div>

      <style>
        .sy-ring { display: grid; grid-template-columns: 1fr 60px 1fr; gap: 0.4rem; margin-bottom: 0.8rem; }
        .sy-zone { padding: 0.7rem; border: 2.5px solid var(--ink); border-radius: var(--radius); transition: box-shadow 0.2s; }
        .sy-zone.user { background: #cfe5ff; }
        .sy-zone.kernel { background: #f7c8c8; }
        .sy-zone.active { box-shadow: 4px 4px 0 var(--accent); }
        .sy-zone-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.85rem; margin-bottom: 0.3em; }
        .sy-zone pre { font-family: var(--font-mono); font-size: 0.8rem; margin: 0; background: rgba(255,255,255,0.5); border: 1px solid var(--ink); padding: 0.4em 0.6em; border-radius: 2px; white-space: pre-wrap; }
        .sy-reg { margin-top: 0.4em; font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-soft); }
        .sy-result { margin-top: 0.4em; font-family: var(--font-mono); font-size: 0.85rem; font-weight: 600; }
        .sy-trap { display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 1.2rem; letter-spacing: 1px; color: var(--ink-soft); border: 2px dashed var(--ink-soft); border-radius: var(--radius); }
        .sy-trap.active { color: var(--accent); border-color: var(--accent); border-style: solid; background: var(--accent-soft); }
        .sy-steps { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; }
        .sy-step { display: grid; grid-template-columns: 32px 1fr; gap: 0.4rem; padding: 0.18em 0.3em; font-family: var(--font-mono); font-size: 0.82rem; color: var(--ink-soft); }
        .sy-step.done { color: var(--ink); }
        .sy-step.cur { background: var(--accent-soft); border-radius: 2px; color: var(--ink); font-weight: 600; }
        .sy-step-num { color: var(--ink-faint); }
      </style>
    `;
    root.querySelector('#sy-stage').innerHTML = html;
    root.querySelector('#sy-note').innerHTML = cur ? cur.detail : 'Pick a syscall and click "Next step →".';
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
