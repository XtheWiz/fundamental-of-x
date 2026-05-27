import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// What this widget is for:
//   Make the runtime stack concrete. A user types `docker run nginx` —
//   what actually happens between that command and a running process?
//   Pick a command, pick a runtime, then click "Step" to watch each hop
//   down the stack and see the real interface used at that hop
//   (CRI gRPC, OCI config.json, clone3/unshare/setns syscalls, etc.).

// ---- Layers -------------------------------------------------------------
// Each layer renders as a box in a vertical stack. Some commands start
// lower in the stack (e.g. `runc run` skips the CLI and CRI).

const LAYERS = {
  cli:    { id: 'cli',    title: 'kubectl / docker CLI', sub: 'user-facing client' },
  cri:    { id: 'cri',    title: 'CRI (containerd / CRI-O)', sub: 'kubelet ↔ runtime gRPC' },
  oci:    { id: 'oci',    title: 'OCI runtime (runc)', sub: 'spec.json → live container' },
  kernel: { id: 'kernel', title: 'Linux kernel', sub: 'namespaces · cgroups · seccomp' },
  proc:   { id: 'proc',   title: 'Container process', sub: 'pid 1 inside the container' },
};

// ---- Commands -----------------------------------------------------------
// Each command has an entry layer (where it joins the stack) and a list
// of hops. Each hop = the interface used between two layers, plus the
// snippet the side panel will show for that hop.

const COMMANDS = {
  kubectl: {
    label: 'kubectl apply pod.yaml',
    entry: 'cli',
    hops: [
      { from: 'cli', to: 'cri', protocol: 'CRI gRPC · RunPodSandbox + CreateContainer',
        snippet: criSnippet() },
      { from: 'cri', to: 'oci', protocol: 'fork+exec runc with bundle dir + config.json',
        snippet: ociSnippet() },
      { from: 'oci', to: 'kernel', protocol: 'clone3 + unshare + setns syscalls',
        snippet: syscallSnippet() },
      { from: 'kernel', to: 'proc', protocol: 'execve("/docker-entrypoint.sh")',
        snippet: execSnippet() },
    ],
  },
  docker: {
    label: 'docker run nginx',
    entry: 'cli',
    hops: [
      { from: 'cli', to: 'cri', protocol: 'dockerd → containerd (CRI-like gRPC)',
        snippet: dockerSnippet() },
      { from: 'cri', to: 'oci', protocol: 'containerd-shim spawns runc',
        snippet: ociSnippet() },
      { from: 'oci', to: 'kernel', protocol: 'clone3 + unshare + setns syscalls',
        snippet: syscallSnippet() },
      { from: 'kernel', to: 'proc', protocol: 'execve("nginx", ["-g","daemon off;"])',
        snippet: execSnippet() },
    ],
  },
  ctr: {
    label: 'ctr run nginx',
    entry: 'cri',
    hops: [
      { from: 'cri', to: 'oci', protocol: 'containerd writes config.json, execs runc create',
        snippet: ociSnippet() },
      { from: 'oci', to: 'kernel', protocol: 'clone3 + unshare + setns syscalls',
        snippet: syscallSnippet() },
      { from: 'kernel', to: 'proc', protocol: 'execve("nginx", ...)',
        snippet: execSnippet() },
    ],
  },
  runc: {
    label: 'runc run nginx',
    entry: 'oci',
    hops: [
      { from: 'oci', to: 'kernel', protocol: 'clone3 + unshare + setns syscalls',
        snippet: syscallSnippet() },
      { from: 'kernel', to: 'proc', protocol: 'execve("nginx", ...)',
        snippet: execSnippet() },
    ],
  },
};

// ---- Runtime variants ---------------------------------------------------
// Replaces the lower part of the stack. runc is the boring/default one;
// crun is a drop-in C rewrite; gVisor adds Sentry (a userspace kernel);
// Kata wraps the container in a lightweight VM.

const RUNTIMES = {
  runc:   { label: 'runc',   extra: null,
            blurb: 'Reference OCI runtime. Calls Linux syscalls directly. Shares the host kernel.' },
  crun:   { label: 'crun',   extra: null,
            blurb: 'Drop-in OCI runtime written in C. Same syscalls as runc, faster startup, lower memory.' },
  gvisor: { label: 'gVisor',
            extra: { id: 'sentry', title: 'gVisor Sentry', sub: 'userspace kernel intercepts syscalls' },
            blurb: 'Container syscalls hit Sentry (a userspace kernel) instead of the host kernel directly. Stronger isolation, slower I/O.' },
  kata:   { label: 'Kata',
            extra: { id: 'vm', title: 'Lightweight VM (Firecracker / QEMU)', sub: 'guest kernel + virtio' },
            blurb: 'Container runs inside its own micro-VM with its own kernel. VM-grade isolation, ~100ms boot.' },
};

// ---- Snippet content ----------------------------------------------------

function criSnippet() {
  return `// CRI gRPC — kubelet → containerd
RunPodSandboxRequest {
  config: {
    metadata: { name: "web", namespace: "default" },
    linux: { security_context: { namespace_options: {...} } }
  }
}
CreateContainerRequest {
  pod_sandbox_id: "8af2…",
  config: {
    image: { image: "docker.io/library/nginx:1.27" },
    command: ["nginx","-g","daemon off;"],
    mounts: [...], envs: [...], linux: {...}
  }
}`;
}

function dockerSnippet() {
  return `// dockerd talks to containerd over a UNIX socket
// (same gRPC surface CRI-O exposes to the kubelet)
$ unix:///run/containerd/containerd.sock
  → Containers.Create  { id, image, snapshotter, ... }
  → Tasks.Create       { container_id, rootfs, io }
  → Tasks.Start        { container_id }`;
}

function ociSnippet() {
  return `// /run/containerd/.../config.json (OCI runtime spec)
{
  "ociVersion": "1.2.0",
  "process": {
    "args": ["nginx","-g","daemon off;"],
    "cwd": "/",
    "capabilities": { "bounding": ["CAP_CHOWN","CAP_NET_BIND_SERVICE"] },
    "noNewPrivileges": true
  },
  "root":    { "path": "rootfs", "readonly": false },
  "linux": {
    "namespaces": [
      { "type": "pid" }, { "type": "mount" }, { "type": "uts" },
      { "type": "ipc" }, { "type": "network" }
    ],
    "resources": { "memory": { "limit": 134217728 } }
  }
}`;
}

function syscallSnippet() {
  return `// strace -f runc init  (abridged)
clone3({flags=CLONE_NEWPID|CLONE_NEWNS|CLONE_NEWUTS
              |CLONE_NEWIPC|CLONE_NEWNET, ...}) = 12345
unshare(CLONE_NEWUSER)                            = 0
setns(/proc/.../ns/mnt,  CLONE_NEWNS)             = 0
mount("proc", "/proc", "proc",  MS_NOSUID, ...)   = 0
pivot_root(".", "./.oldroot")                     = 0
write("/sys/fs/cgroup/.../memory.max", "128M")    = 4
prctl(PR_SET_NO_NEW_PRIVS, 1)                     = 0
seccomp(SECCOMP_SET_MODE_FILTER, ...)             = 0`;
}

function execSnippet() {
  return `// final hop — runc-init replaces itself with the entrypoint
execve("/usr/sbin/nginx",
       ["nginx","-g","daemon off;"],
       [/* scrubbed env */])               = 0
// from this instant, pid 1 inside the container *is* nginx.
// the kernel enforces the namespaces + cgroups set above.`;
}

function sandboxSnippet(runtimeId) {
  if (runtimeId === 'gvisor') {
    return `// gVisor: syscalls don't reach the host kernel directly
container syscall  ── ptrace/KVM ──▶  Sentry (userspace kernel)
Sentry implements ~250 Linux syscalls in Go.
Only a tiny, audited set is forwarded to the host kernel.`;
  }
  if (runtimeId === 'kata') {
    return `// Kata: a VM boundary sits under the container
runc-equivalent inside the guest
        ▲
  virtio-vsock (agent protocol)
        ▲
  Firecracker / QEMU on the host  ◀── shimv2 starts the VM`;
  }
  return null;
}

// ---- Pure helpers -------------------------------------------------------

function stackForRuntime(runtimeId) {
  // Returns the ordered list of layer ids that should render, top to bottom.
  const base = ['cli', 'cri', 'oci', 'kernel', 'proc'];
  const extra = RUNTIMES[runtimeId].extra;
  if (!extra) return base;
  // gVisor / Kata insert their box between OCI and kernel.
  const out = [];
  for (const id of base) {
    out.push(id);
    if (id === 'oci') out.push(extra.id);
  }
  return out;
}

function activeLayersAfter(cmdId, stepIdx) {
  // Which layer ids are "lit up" right now?
  const cmd = COMMANDS[cmdId];
  const active = new Set([cmd.entry]);
  for (let i = 0; i < stepIdx; i++) active.add(cmd.hops[i].to);
  return active;
}

// ---- Subcomponents ------------------------------------------------------

function LayerBox({ layer, lit, isCurrentTarget }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      style={{
        border: `2.5px solid ${lit ? 'var(--ink)' : 'var(--ink-faint)'}`,
        background: isCurrentTarget ? 'var(--accent-soft)' : lit ? 'var(--paper)' : 'var(--paper-deep)',
        borderRadius: 8,
        padding: '0.55rem 0.8rem',
        opacity: lit ? 1 : 0.55,
        boxShadow: isCurrentTarget ? '0 0 0 3px var(--accent) inset' : 'none',
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>
        {layer.title}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-soft)' }}>
        {layer.sub}
      </div>
    </motion.div>
  );
}

function HopArrow({ label, active }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2px 0' }}>
      <motion.div
        animate={active ? { y: [0, 2, 0] } : { y: 0 }}
        transition={{ duration: 0.8, repeat: active ? Infinity : 0 }}
        style={{
          width: 0, height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: `10px solid ${active ? 'var(--accent)' : 'var(--ink-faint)'}`,
        }}
      />
      {label && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: active ? 'var(--accent)' : 'var(--ink-faint)',
          fontWeight: active ? 700 : 400,
          marginTop: 2, textAlign: 'center', maxWidth: 280,
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ---- Main component -----------------------------------------------------

export default function RuntimesWidget() {
  const [cmdId, setCmdId] = useState('kubectl');
  const [runtimeId, setRuntimeId] = useState('runc');
  const [stepIdx, setStepIdx] = useState(0);

  const cmd = COMMANDS[cmdId];
  const runtime = RUNTIMES[runtimeId];
  const maxStep = cmd.hops.length;

  const stackIds = useMemo(() => stackForRuntime(runtimeId), [runtimeId]);
  const activeIds = useMemo(() => activeLayersAfter(cmdId, stepIdx), [cmdId, stepIdx]);

  function pickCmd(id) { setCmdId(id); setStepIdx(0); }
  function pickRuntime(id) { setRuntimeId(id); setStepIdx(0); }
  function nextStep() { setStepIdx((i) => Math.min(maxStep, i + 1)); }
  function reset() { setStepIdx(0); }

  // Which hop is currently the most-recent one (drives side-panel snippet)?
  const currentHop = stepIdx > 0 ? cmd.hops[stepIdx - 1] : null;
  const sandboxBlurb = sandboxSnippet(runtimeId);

  // Build the rendered list interleaving boxes + arrows.
  // We only draw an arrow between two layers if both are in the chosen
  // stack AND the source layer is at or below the command's entry layer
  // (i.e. an arrow above the entry is hidden — runc-only commands don't
  // dangle arrows from a phantom CLI).
  const entryIdx = stackIds.indexOf(cmd.entry);

  return (
    <div className="widget">
      <div className="widget-title">Container runtimes — from CLI to a running process</div>

      <div className="controls">
        <div className="pill-group" role="radiogroup" aria-label="Command">
          {Object.entries(COMMANDS).map(([k, v]) => (
            <span key={k}>
              <input type="radio" id={`cmd-${k}`} name="cmd"
                checked={cmdId === k} onChange={() => pickCmd(k)} />
              <label htmlFor={`cmd-${k}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                {v.label}
              </label>
            </span>
          ))}
        </div>
      </div>

      <div className="controls">
        <div className="pill-group" role="radiogroup" aria-label="Runtime">
          {Object.entries(RUNTIMES).map(([k, v]) => (
            <span key={k}>
              <input type="radio" id={`rt-${k}`} name="rt"
                checked={runtimeId === k} onChange={() => pickRuntime(k)} />
              <label htmlFor={`rt-${k}`}>{v.label}</label>
            </span>
          ))}
        </div>
        <button className="btn btn-accent" onClick={nextStep} disabled={stepIdx >= maxStep}>
          Step ↓
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)',
                       color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          Hop {stepIdx} / {maxStep}
        </span>
      </div>

      <div className="widget-stage" style={{ display: 'grid',
            gridTemplateColumns: 'minmax(260px, 1fr) minmax(280px, 1.2fr)',
            gap: '1rem', alignItems: 'start' }}>

        {/* ---- Left: vertical stack ---- */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          <AnimatePresence mode="popLayout">
            {stackIds.map((id, i) => {
              const layer = LAYERS[id] || runtime.extra;
              const lit = activeIds.has(id);
              const isTarget = currentHop && currentHop.to === id;

              // Determine if an arrow should appear *before* this box
              // (i.e. coming into it from the layer above).
              let arrow = null;
              if (i > 0) {
                const prevId = stackIds[i - 1];
                const prevInStack = i - 1 >= entryIdx;
                if (prevInStack) {
                  // Is this hop part of the chosen command?
                  const hopMatch = cmd.hops.find(
                    (h) => (h.from === prevId || prevId === runtime.extra?.id) &&
                           (h.to === id || id === runtime.extra?.id)
                  );
                  // Always render a faint arrow if both boxes are in the stack;
                  // mark it active if its `to` layer is the last activated one.
                  const active = activeIds.has(id) && activeIds.has(prevId);
                  arrow = (
                    <HopArrow
                      key={`arr-${prevId}-${id}`}
                      label={hopMatch ? hopMatch.protocol :
                        (id === runtime.extra?.id ? 'intercept' :
                         prevId === runtime.extra?.id ? 'forward' : '')}
                      active={active && isTarget}
                    />
                  );
                }
              }

              // Hide layers that sit *above* the command's entry point — for
              // `runc run`, don't render a ghost CLI/CRI.
              const hideAboveEntry = i < entryIdx;
              if (hideAboveEntry) return null;

              return (
                <div key={id}>
                  {arrow}
                  <LayerBox layer={layer} lit={lit} isCurrentTarget={isTarget} />
                </div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* ---- Right: side panel ---- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{
            border: '2px solid var(--ink)', borderRadius: 8,
            background: 'var(--paper)', padding: '0.6rem 0.75rem',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 12,
                          color: 'var(--ink-soft)', marginBottom: '0.3rem' }}>
              {currentHop
                ? `Hop ${stepIdx}: ${LAYERS[currentHop.from]?.title || runtime.extra?.title} → ${LAYERS[currentHop.to]?.title || runtime.extra?.title}`
                : 'Pick a command, then press Step ↓'}
            </div>
            <pre style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.45,
              margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              color: 'var(--ink)',
            }}>
              {currentHop
                ? currentHop.snippet
                : `// ${cmd.label}\n// stack entry point: ${LAYERS[cmd.entry].title}\n// ${cmd.hops.length} hop${cmd.hops.length === 1 ? '' : 's'} to a running process.`}
            </pre>
          </div>

          {sandboxBlurb && (
            <div style={{
              border: '2px dashed var(--ink-faint)', borderRadius: 8,
              background: 'var(--paper-deep)', padding: '0.5rem 0.7rem',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 12,
                            color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>
                {runtime.label} insertion point
              </div>
              <pre style={{
                fontFamily: 'var(--font-mono)', fontSize: 10.5, lineHeight: 1.45,
                margin: 0, whiteSpace: 'pre-wrap',
              }}>
                {sandboxBlurb}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="callout">
        <strong>{runtime.label}.</strong> {runtime.blurb}
        {stepIdx === 0 && (
          <div style={{ marginTop: '0.35rem', color: 'var(--ink-soft)' }}>
            <code style={{ fontFamily: 'var(--font-mono)' }}>{cmd.label}</code> joins the
            stack at <strong>{LAYERS[cmd.entry].title}</strong> and needs {maxStep} hop{maxStep === 1 ? '' : 's'} to reach a live process.
          </div>
        )}
        {stepIdx === maxStep && (
          <div style={{ marginTop: '0.35rem', color: '#2a8a3e' }}>
            ✓ Container is running. Every layer above was just glue around the same
            kernel primitives — namespaces, cgroups, and a process tree.
          </div>
        )}
      </div>
    </div>
  );
}
