import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// eBPF: tiny verified programs the kernel runs at hook points (syscalls,
// network events, kprobes, uprobes). They share state with userspace via
// "maps" (typed key/value tables). The verifier rejects anything unsafe
// BEFORE the program ever executes — unbounded loops, out-of-bounds reads,
// forbidden helpers. Learner picks a hook, loads its program, fires kernel
// events, and watches events + maps + metrics update live.

const HOOKS = {
  openat: {
    label: 'tracepoint/syscalls/sys_enter_openat', short: 'sys_enter_openat', kind: 'tracepoint',
    blurb: 'Fires whenever any process calls openat(2). Used by security tools and file-access auditors.',
    mapName: 'open_count', mapDesc: 'BPF_MAP_TYPE_HASH<filename, u64>',
    program: `// trace every openat(2), count by path
SEC("tracepoint/syscalls/sys_enter_openat")
int trace_openat(struct trace_event_raw_sys_enter *ctx) {
    char path[64];
    bpf_probe_read_user_str(path, sizeof(path), (void *)ctx->args[1]);
    u64 zero = 0, *cnt;
    cnt = bpf_map_lookup_or_try_init(&open_count, path, &zero);
    if (cnt) __sync_fetch_and_add(cnt, 1);
    bpf_printk("openat %s", path);
    return 0;
}`,
  },
  tcp: {
    label: 'kprobe/tcp_connect', short: 'tcp_connect', kind: 'kprobe',
    blurb: 'Attaches to the kernel function tcp_connect(). Sees every outbound TCP handshake.',
    mapName: 'connect_by_pid', mapDesc: 'BPF_MAP_TYPE_HASH<pid_t, u64>',
    program: `// count outbound TCP connects per pid
SEC("kprobe/tcp_connect")
int BPF_KPROBE(kp_tcp_connect, struct sock *sk) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    u64 zero = 0, *cnt;
    cnt = bpf_map_lookup_or_try_init(&connect_by_pid, &pid, &zero);
    if (cnt) __sync_fetch_and_add(cnt, 1);
    bpf_printk("tcp_connect pid=%u", pid);
    return 0;
}`,
  },
  xdp: {
    label: 'XDP packet filter', short: 'xdp_filter', kind: 'xdp',
    blurb: 'Runs in the NIC driver, before the kernel stack. Can XDP_DROP packets at line rate.',
    mapName: 'drops_by_src', mapDesc: 'BPF_MAP_TYPE_LRU_HASH<__be32, u64>',
    program: `// drop packets from blocklisted source IPs at the driver
SEC("xdp")
int xdp_filter(struct xdp_md *ctx) {
    void *data = (void *)(long)ctx->data;
    void *end  = (void *)(long)ctx->data_end;
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > end) return XDP_PASS;
    if (eth->h_proto != bpf_htons(ETH_P_IP)) return XDP_PASS;
    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > end) return XDP_PASS;
    u64 *blocked = bpf_map_lookup_elem(&drops_by_src, &ip->saddr);
    if (blocked) { __sync_fetch_and_add(blocked, 1); return XDP_DROP; }
    return XDP_PASS;
}`,
  },
  uprobe: {
    label: 'uprobe/userspace function', short: 'uprobe:SSL_write', kind: 'uprobe',
    blurb: 'Attaches to a userspace function (SSL_write in libssl). Inspects encrypted-payload sizes.',
    mapName: 'ssl_bytes', mapDesc: 'BPF_MAP_TYPE_HASH<comm, u64>',
    program: `// observe SSL_write payload sizes per process name
SEC("uprobe/libssl.so.3:SSL_write")
int BPF_UPROBE(up_ssl_write, void *ssl, const void *buf, int num) {
    char comm[16];
    bpf_get_current_comm(&comm, sizeof(comm));
    u64 add = num, *acc;
    acc = bpf_map_lookup_or_try_init(&ssl_bytes, comm, &add);
    if (acc) __sync_fetch_and_add(acc, add);
    bpf_printk("SSL_write %s %d", comm, num);
    return 0;
}`,
  },
};

// Simulated kernel events. Each names the hook it matches, the map key to
// bump, and the log line it produces.
const EVENT_BUTTONS = [
  { id: 'e1', label: 'process opens /etc/passwd',     hookId: 'openat', key: '/etc/passwd',   line: 'sshd[1042]  openat(AT_FDCWD, "/etc/passwd", O_RDONLY)' },
  { id: 'e2', label: 'process opens /etc/shadow',     hookId: 'openat', key: '/etc/shadow',   line: 'sudo[2210]  openat(AT_FDCWD, "/etc/shadow", O_RDONLY)' },
  { id: 'e3', label: 'outbound TCP SYN',              hookId: 'tcp',    key: '2210',          line: 'tcp_connect  pid=2210 -> 10.0.0.5:443' },
  { id: 'e4', label: 'another TCP SYN',               hookId: 'tcp',    key: '1042',          line: 'tcp_connect  pid=1042 -> 10.0.0.7:80'  },
  { id: 'e5', label: 'incoming pkt (allowed src)',    hookId: 'xdp',    key: '10.0.0.4',      line: 'xdp  src=10.0.0.4  -> XDP_PASS', noBump: true },
  { id: 'e6', label: 'incoming pkt (blocked src)',    hookId: 'xdp',    key: '198.51.100.66', line: 'xdp  src=198.51.100.66 -> XDP_DROP', bad: true },
  { id: 'e7', label: 'curl SSL_write(420)',           hookId: 'uprobe', key: 'curl',          line: 'SSL_write  comm=curl  num=420', delta: 420 },
  { id: 'e8', label: 'firefox SSL_write(1180)',       hookId: 'uprobe', key: 'firefox',       line: 'SSL_write  comm=firefox  num=1180', delta: 1180 },
];

// Programs that intentionally fail verification, with realistic reasons.
const BAD_PROGRAMS = [
  { label: 'unbounded loop',           reason: 'back-edge from insn 5 to 3: infinite loop detected. eBPF programs must have a provably bounded instruction count.' },
  { label: 'out-of-bounds packet read',reason: 'invalid access to packet, off=0 size=20: pointer arithmetic on PTR_TO_PACKET requires a check against ctx->data_end.' },
  { label: 'forbidden helper',         reason: 'unknown func bpf_probe_write_user#36: helper not permitted in this program type (needs CAP_SYS_ADMIN + opt-in).' },
];

const VERIFIER_STEPS = [
  'parsing ELF section .text...',
  'building program CFG (control-flow graph)...',
  'walking instructions, tracking register types...',
  'checking memory accesses are bounded...',
  'verifying loops terminate (must converge)...',
  'JIT-compiling to native code...',
  'attaching to hook.',
];

let evtSeq = 0;
const nextId = () => (evtSeq += 1);

export default function EbpfWidget() {
  const [hookId, setHookId] = useState('openat');
  const [loaded, setLoaded] = useState({});
  const [verifierLog, setVerifierLog] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [maps, setMaps] = useState({});
  const [events, setEvents] = useState([]);
  const [dropped, setDropped] = useState(0);
  const [programsLoaded, setProgramsLoaded] = useState(0);
  const [editingKey, setEditingKey] = useState(null);
  const [editVal, setEditVal] = useState('');

  const hook = HOOKS[hookId];
  const isLoaded = !!loaded[hookId];
  const mapEntries = useMemo(() => Object.entries(maps[hookId] || {}), [maps, hookId]);
  const mapEntriesTotal = useMemo(
    () => Object.values(maps).reduce((a, m) => a + Object.keys(m).length, 0),
    [maps]
  );
  const totalCaptured = events.filter((e) => e.kind === 'ok').length;

  function pushEvent(line, kind) { setEvents((p) => [{ id: nextId(), line, kind }, ...p].slice(0, 30)); }
  function pushV(text, kind = 'info') { setVerifierLog((p) => [...p, { id: nextId(), text, kind }].slice(-12)); }

  function loadProgram() {
    if (verifying || isLoaded) return;
    setVerifying(true); setVerifierLog([]);
    let i = 0;
    const tick = () => {
      if (i < VERIFIER_STEPS.length) { pushV(`verifier: ${VERIFIER_STEPS[i]}`); i++; setTimeout(tick, 260); return; }
      pushV(`verifier: program accepted -> attached to ${hook.label}`, 'ok');
      pushEvent(`program loaded and attached to ${hook.short}`, 'ok');
      setLoaded((l) => ({ ...l, [hookId]: true }));
      setProgramsLoaded((n) => n + 1);
      setVerifying(false);
    };
    tick();
  }
  function unloadProgram() {
    if (verifying) return;
    setLoaded((l) => { const n = { ...l }; delete n[hookId]; return n; });
    pushEvent(`program detached from ${hook.short}`, 'info');
    setVerifierLog([]);
  }
  function loadBad(i) {
    const b = BAD_PROGRAMS[i];
    setVerifierLog([]);
    pushV('verifier: parsing ELF section .text...');
    pushV('verifier: walking instructions, tracking register types...');
    pushV(`verifier: REJECTED — ${b.reason}`, 'err');
    pushEvent(`load failed (${b.label}): verifier rejected program`, 'err');
  }

  function fireEvent(btn) {
    if (btn.hookId !== hookId || !isLoaded) {
      setDropped((d) => d + 1);
      pushEvent(`${btn.line}   [no matching program loaded — event ignored]`, 'err');
      return;
    }
    if (!btn.noBump) {
      setMaps((all) => {
        const cur = { ...(all[hookId] || {}) };
        cur[btn.key] = (cur[btn.key] || 0) + (btn.delta ?? 1);
        return { ...all, [hookId]: cur };
      });
    }
    pushEvent(btn.line, btn.bad ? 'err' : 'ok');
  }

  function startEdit(k, v) { setEditingKey(k); setEditVal(String(v)); }
  function commitEdit() {
    if (editingKey == null) return;
    const n = Number(editVal);
    setMaps((all) => {
      const cur = { ...(all[hookId] || {}) };
      cur[editingKey] = Number.isFinite(n) ? n : 0;
      return { ...all, [hookId]: cur };
    });
    pushEvent(`userspace wrote map ${hook.mapName}[${editingKey}] = ${editVal}`, 'info');
    setEditingKey(null);
  }
  function deleteEntry(k) {
    setMaps((all) => { const cur = { ...(all[hookId] || {}) }; delete cur[k]; return { ...all, [hookId]: cur }; });
    pushEvent(`userspace deleted ${hook.mapName}[${k}]`, 'info');
  }
  function clearMap() {
    setMaps((all) => ({ ...all, [hookId]: {} }));
    pushEvent(`userspace cleared ${hook.mapName}`, 'info');
  }
  function pickHook(id) {
    if (id === hookId) return;
    setHookId(id); setEditingKey(null); setVerifierLog([]);
    pushEvent(`switched view to ${HOOKS[id].label}`, 'info');
  }

  return (
    <div className="widget">
      <div className="widget-title">eBPF — programmable, verified kernel hooks</div>

      <div className="callout">
        eBPF lets you attach tiny programs to kernel hook points — syscalls, kprobes, network
        drivers, uprobes — and share data with userspace via typed <strong>maps</strong>. Before
        any program runs, the kernel <em>verifier</em> proves it terminates and never touches
        memory it shouldn&apos;t.
      </div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <div className="pill-group" style={{ flexWrap: 'wrap' }}>
          {Object.entries(HOOKS).map(([id, h]) => (
            <span key={id} style={{ display: 'contents' }}>
              <input type="radio" id={`hook-${id}`} name="ebpf-hook"
                checked={hookId === id} onChange={() => pickHook(id)} />
              <label htmlFor={`hook-${id}`} title={h.blurb}>{h.short}</label>
            </span>
          ))}
        </div>
      </div>

      <div className="widget-stage" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: '1rem' }}>
        {/* ===== LEFT: program + verifier + bad programs ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <strong style={{ fontFamily: 'var(--font-display)' }}>{hook.label}</strong>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>{hook.kind} hook</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>{hook.blurb}</div>

          <div className="code-block" style={{ minHeight: 160, fontSize: '0.78rem' }}>{hook.program}</div>

          <div className="controls">
            {!isLoaded
              ? <button className="btn btn-accent" onClick={loadProgram} disabled={verifying}>{verifying ? 'Verifying...' : 'Load program'}</button>
              : <button className="btn" onClick={unloadProgram}>Detach program</button>}
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
              color: isLoaded ? '#2a8a3e' : 'var(--ink-soft)' }}>
              {isLoaded ? 'attached' : verifying ? 'in verifier...' : 'not loaded'}
            </span>
          </div>

          {verifierLog.length > 0 && (
            <div className="log" style={{ fontSize: '0.78rem', maxHeight: 130 }}>
              <AnimatePresence initial={false}>
                {verifierLog.map((l) => (
                  <motion.div key={l.id} className={`entry ${l.kind}`} initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                    <span className="t">{l.kind === 'err' ? 'x' : l.kind === 'ok' ? '+' : '.'}</span>{l.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>
              Try a program the verifier should reject:
            </strong>
            <div className="controls" style={{ flexWrap: 'wrap' }}>
              {BAD_PROGRAMS.map((b, i) => (
                <button key={b.label} className="btn" onClick={() => loadBad(i)} disabled={verifying}>
                  Load: {b.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--ink-soft)' }}>
              The verifier is the whole reason eBPF is safe to run in the kernel.
              Without it, a bug in your program would be a kernel bug.
            </div>
          </div>
        </div>

        {/* ===== RIGHT: events + map + log ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', minWidth: 0 }}>
          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>Simulate kernel events</strong>
            <div className="controls" style={{ flexWrap: 'wrap', gap: '0.35rem' }}>
              {EVENT_BUTTONS.map((b) => {
                const matches = b.hookId === hookId;
                return (
                  <button key={b.id}
                    className={`btn ${matches && isLoaded ? 'btn-accent' : ''}`}
                    onClick={() => fireEvent(b)}
                    title={matches && isLoaded ? 'this hook is attached — event will be captured'
                      : matches ? 'matches this hook, but program is not loaded'
                      : 'will not match the current hook (event will be dropped)'}
                    style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem', opacity: matches ? 1 : 0.7 }}>
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>
                eBPF map: <code style={{ fontFamily: 'var(--font-mono)' }}>{hook.mapName}</code>
              </strong>
              <button className="btn btn-ghost" onClick={clearMap}
                style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}>clear</button>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>{hook.mapDesc}</div>
            <div style={{ border: '1.5px solid var(--ink)', borderRadius: 4,
              background: 'var(--paper)', maxHeight: 170, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse',
                fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: 'var(--paper-deep)', borderBottom: '1px solid var(--ink-faint)' }}>
                    <th style={{ textAlign: 'left', padding: '0.25rem 0.5rem', width: '55%' }}>key</th>
                    <th style={{ textAlign: 'right', padding: '0.25rem 0.5rem' }}>value</th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {mapEntries.length === 0 && (
                      <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan={3} style={{ padding: '0.5rem', color: 'var(--ink-faint)', textAlign: 'center' }}>
                          (map is empty — fire some events)
                        </td>
                      </motion.tr>
                    )}
                    {mapEntries.map(([k, v]) => (
                      <motion.tr key={k}
                        initial={{ opacity: 0, backgroundColor: '#fff2cc' }}
                        animate={{ opacity: 1, backgroundColor: 'rgba(255,242,204,0)' }}
                        exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
                        style={{ borderBottom: '1px dashed var(--ink-faint)' }}>
                        <td style={{ padding: '0.25rem 0.5rem', wordBreak: 'break-all' }}>{k}</td>
                        <td style={{ padding: '0.25rem 0.5rem', textAlign: 'right' }}>
                          {editingKey === k ? (
                            <input autoFocus value={editVal}
                              onChange={(e) => setEditVal(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingKey(null); }}
                              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', width: 80,
                                padding: '0.1rem 0.3rem', border: '1px solid var(--ink-faint)',
                                background: 'var(--paper)', textAlign: 'right' }} />
                          ) : (
                            <span onClick={() => startEdit(k, v)}
                              style={{ cursor: 'pointer', borderBottom: '1px dotted var(--ink-faint)' }}>{v}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn btn-ghost" onClick={() => deleteEntry(k)}
                            title="delete entry from userspace"
                            style={{ fontSize: '0.72rem', padding: '0.05rem 0.35rem' }}>×</button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
              Click a value to edit it from userspace — that&apos;s how tools like bpftool
              and bcc read/write maps shared with the running program.
            </div>
          </div>

          <div className="log" style={{ fontSize: '0.78rem', maxHeight: 150, marginTop: 0 }}>
            <AnimatePresence initial={false}>
              {events.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ color: 'var(--ink-faint)' }}># event ring buffer (perf_event_output) — empty</motion.div>
              )}
              {events.map((e) => (
                <motion.div key={e.id} className={`entry ${e.kind}`} initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  <span className="t">{e.kind === 'err' ? '!' : e.kind === 'ok' ? '>' : '.'}</span>{e.line}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="metrics">
        <div className="metric"><div className="label">events captured</div><div className="value">{totalCaptured}</div></div>
        <div className="metric accent"><div className="label">dropped events</div><div className="value">{dropped}</div></div>
        <div className="metric"><div className="label">map entries</div><div className="value">{mapEntriesTotal}</div></div>
        <div className="metric"><div className="label">programs loaded</div><div className="value">{programsLoaded}</div></div>
      </div>
    </div>
  );
}
