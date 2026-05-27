import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Three ways state enters a Pod: ConfigMap (plaintext), Secret (base64-wrapped),
// Volume (mutable storage). Learner edits source objects on the left; the Pod
// view on the right updates live. Persist test simulates a pod restart to show
// the durability trade-off across volume types.

const DEFAULT_CM = [
  { id: 'cm-1', key: 'DB_HOST',  value: 'postgres.prod.svc' },
  { id: 'cm-2', key: 'LOG_LEVEL', value: 'info' },
  { id: 'cm-3', key: 'FEATURE_X', value: 'on' },
];
const DEFAULT_SEC = [
  { id: 'sec-1', key: 'api-key',     value: 'sk_live_8f1ab9c2' },
  { id: 'sec-2', key: 'db-password', value: 'hunter2!' },
];

const VOLUMES = {
  emptyDir: {
    label: 'emptyDir',
    blurb: 'Scratch space tied to the Pod. Wiped on Pod restart.',
    survivesPodRestart: false, survivesNodeMove: false,
  },
  hostPath: {
    label: 'hostPath',
    blurb: 'Directory on the host node. Survives Pod restarts on that node only.',
    survivesPodRestart: true, survivesNodeMove: false,
  },
  pvc: {
    label: 'PersistentVolumeClaim',
    blurb: 'Claim against cluster storage. Survives reschedules to other nodes.',
    survivesPodRestart: true, survivesNodeMove: true,
  },
};

function b64(s) {
  try { return btoa(unescape(encodeURIComponent(s))); }
  catch { return '<<encode-error>>'; }
}

let rowCounter = 100;
function nextId(prefix) { rowCounter += 1; return `${prefix}-${rowCounter}`; }

function inputStyle(readOnly, isSecret) {
  return {
    fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
    padding: '0.2rem 0.4rem', border: '1px solid var(--ink-faint)',
    background: readOnly ? 'var(--paper-deep)' : 'var(--paper)',
    color: isSecret && readOnly ? 'var(--ink-soft)' : 'inherit',
    borderRadius: 3, minWidth: 0,
  };
}

export default function ConfigVolumesWidget() {
  const [configMap, setConfigMap] = useState(DEFAULT_CM);
  const [secret, setSecret] = useState(DEFAULT_SEC);
  const [showPlain, setShowPlain] = useState(false);

  // Per-key mount mode: 'off' | 'env' | 'file'
  const [cmMounts, setCmMounts] = useState({ 'cm-1': 'env', 'cm-2': 'env', 'cm-3': 'file' });
  const [secMounts, setSecMounts] = useState({ 'sec-1': 'file', 'sec-2': 'env' });

  const [volume, setVolume] = useState('emptyDir');
  const [volumeFile, setVolumeFile] = useState('hello from pod\n');
  const [restartLog, setRestartLog] = useState([]);
  const [volumeWiped, setVolumeWiped] = useState(false);

  function updateRow(setter, id, field, val) {
    setter((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  }
  function addCmRow() {
    const id = nextId('cm');
    setConfigMap((rs) => [...rs, { id, key: 'NEW_KEY', value: '' }]);
    setCmMounts((m) => ({ ...m, [id]: 'env' }));
  }
  function addSecRow() {
    const id = nextId('sec');
    setSecret((rs) => [...rs, { id, key: 'new-secret', value: '' }]);
    setSecMounts((m) => ({ ...m, [id]: 'file' }));
  }
  function deleteRow(setter, mountSetter, id) {
    setter((rs) => rs.filter((r) => r.id !== id));
    mountSetter((m) => { const n = { ...m }; delete n[id]; return n; });
  }
  function cycleMount(source, id) {
    const order = ['off', 'env', 'file'];
    const setter = source === 'cm' ? setCmMounts : setSecMounts;
    setter((m) => {
      const cur = m[id] || 'off';
      return { ...m, [id]: order[(order.indexOf(cur) + 1) % order.length] };
    });
  }

  // --- Derived: what the pod actually sees -------------------------------
  const podView = useMemo(() => {
    // Secrets are decoded by kubelet at projection time — base64 is the
    // wire/storage form, not what the app reads.
    const envs = [], files = [];
    for (const row of configMap) {
      const mode = cmMounts[row.id] || 'off';
      if (mode === 'env')  envs.push({ name: row.key, value: row.value, from: 'ConfigMap' });
      if (mode === 'file') files.push({ path: `/etc/config/${row.key}`, content: row.value, from: 'ConfigMap' });
    }
    for (const row of secret) {
      const mode = secMounts[row.id] || 'off';
      if (mode === 'env')  envs.push({ name: row.key.toUpperCase().replace(/-/g, '_'), value: row.value, from: 'Secret' });
      if (mode === 'file') files.push({ path: `/etc/secrets/${row.key}`, content: row.value, from: 'Secret' });
    }
    return { envs, files };
  }, [configMap, secret, cmMounts, secMounts]);

  // --- Persist test ------------------------------------------------------
  function persistTest() {
    const v = VOLUMES[volume];
    const detail = !v.survivesPodRestart
      ? 'Pod restarted — emptyDir was wiped. File is gone.'
      : v.survivesNodeMove
        ? 'Pod restarted, even on a different node — file still there.'
        : 'Pod restarted on the same node — file still there. Different node → gone.';
    setRestartLog((log) => [{ id: Date.now(), volume, survives: v.survivesPodRestart, detail }, ...log].slice(0, 5));
    setVolumeWiped(!v.survivesPodRestart);
  }
  function resetVolume() { setVolumeWiped(false); setRestartLog([]); }

  // ----------------------------------------------------------------------
  return (
    <div className="widget">
      <div className="widget-title">ConfigMaps, Secrets &amp; Volumes — what the Pod actually sees</div>

      <div className="callout">
        Three ways state reaches a Pod: <strong>ConfigMap</strong> (plaintext config),
        <strong> Secret</strong> (base64-wrapped sensitive data), and <strong>Volumes</strong> (mutable storage).
        Edit anything on the left — the Pod view on the right updates live.
      </div>

      <div className="widget-stage" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
        {/* ====== LEFT: source objects ====== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', minWidth: 0 }}>

          {/* ConfigMap editor */}
          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontFamily: 'var(--font-display)' }}>ConfigMap: app-config</strong>
              <span className="badge">{configMap.length} keys</span>
            </div>
            {configMap.map((row) => (
              <KvRow
                key={row.id} row={row}
                mount={cmMounts[row.id] || 'off'}
                onChange={(f, v) => updateRow(setConfigMap, row.id, f, v)}
                onCycle={() => cycleMount('cm', row.id)}
                onDelete={() => deleteRow(setConfigMap, setCmMounts, row.id)}
              />
            ))}
            <div className="controls">
              <button className="btn btn-ghost" onClick={addCmRow}>+ add key</button>
            </div>
          </div>

          {/* Secret editor */}
          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontFamily: 'var(--font-display)' }}>Secret: app-secrets</strong>
              <div className="pill-group">
                <button
                  className={`btn ${showPlain ? 'btn-accent' : 'btn-ghost'}`}
                  onClick={() => setShowPlain((p) => !p)}
                >
                  {showPlain ? 'showing plaintext' : 'showing base64'}
                </button>
              </div>
            </div>
            {secret.map((row) => (
              <KvRow
                key={row.id} row={row} isSecret
                mount={secMounts[row.id] || 'off'}
                displayValue={showPlain ? row.value : b64(row.value)}
                valueReadOnly={!showPlain}
                onChange={(f, v) => updateRow(setSecret, row.id, f, v)}
                onCycle={() => cycleMount('sec', row.id)}
                onDelete={() => deleteRow(setSecret, setSecMounts, row.id)}
              />
            ))}
            <div className="controls">
              <button className="btn btn-ghost" onClick={addSecRow}>+ add secret</button>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                base64 ≠ encryption — it&apos;s just how Secrets are stored.
              </span>
            </div>
          </div>

          {/* Volume picker */}
          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <strong style={{ fontFamily: 'var(--font-display)' }}>Volume type</strong>
            <div className="pill-group">
              {Object.entries(VOLUMES).map(([k, v]) => (
                <button
                  key={k}
                  className={`btn ${volume === k ? 'btn-accent' : 'btn-ghost'}`}
                  onClick={() => { setVolume(k); resetVolume(); }}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>{VOLUMES[volume].blurb}</div>
            <div className="controls" style={{ alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                /data/state.txt:
              </span>
              <input
                className="field"
                style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '0.25rem 0.4rem' }}
                value={volumeFile}
                onChange={(e) => { setVolumeFile(e.target.value); setVolumeWiped(false); }}
              />
            </div>
            <div className="controls">
              <button className="btn btn-accent" onClick={persistTest}>Restart pod (persist test)</button>
              <button className="btn btn-ghost" onClick={resetVolume}>Reset</button>
            </div>
            {restartLog.length > 0 && (
              <div className="log" style={{ fontSize: '0.78rem' }}>
                {restartLog.map((e) => (
                  <div key={e.id} style={{ color: e.survives ? '#2a8a3e' : 'var(--accent)' }}>
                    [{e.volume}] {e.detail}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ====== RIGHT: pod view ====== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', minWidth: 0 }}>
          <div
            className="field"
            style={{
              display: 'flex', flexDirection: 'column', gap: '0.6rem',
              border: '2px dashed var(--ink)', padding: '0.7rem', background: 'var(--paper-deep)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontFamily: 'var(--font-display)' }}>Pod: app-7d</strong>
              <span className="badge">live view</span>
            </div>

            {/* Metrics */}
            <div className="metrics">
              <div className="metric">
                <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>env vars</span>
                <strong>{podView.envs.length}</strong>
              </div>
              <div className="metric">
                <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>mounted files</span>
                <strong>{podView.files.length}</strong>
              </div>
              <div className="metric">
                <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>volume</span>
                <strong style={{ fontSize: '0.85rem' }}>{VOLUMES[volume].label}</strong>
              </div>
            </div>

            {/* Env vars */}
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: 4 }}>
                <code>$ env</code>
              </div>
              <div className="code-block" style={{ minHeight: 60, fontSize: '0.78rem' }}>
                <AnimatePresence initial={false}>
                  {podView.envs.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ color: 'var(--ink-faint)' }}>
                      # no env vars projected
                    </motion.div>
                  )}
                  {podView.envs.map((e) => (
                    <motion.div
                      key={`${e.from}:${e.name}`}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <span style={{ color: e.from === 'Secret' ? 'var(--accent)' : 'inherit' }}>{e.name}</span>
                      =<span>{e.value || '""'}</span>
                      <span style={{ color: 'var(--ink-faint)' }}>  # from {e.from}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Mounted files */}
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: 4 }}>
                <code>$ ls -R /etc/config /etc/secrets /data</code>
              </div>
              <div className="code-block" style={{ minHeight: 80, fontSize: '0.78rem' }}>
                <AnimatePresence initial={false}>
                  {podView.files.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ color: 'var(--ink-faint)' }}>
                      # no files projected from ConfigMap/Secret
                    </motion.div>
                  )}
                  {podView.files.map((f) => (
                    <motion.div
                      key={f.path}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <span style={{ color: f.from === 'Secret' ? 'var(--accent)' : 'inherit' }}>{f.path}</span>
                      <span style={{ color: 'var(--ink-faint)' }}>  → {JSON.stringify(f.content)}</span>
                    </motion.div>
                  ))}
                  {/* Volume-backed file */}
                  <motion.div
                    key="vol-file"
                    initial={false}
                    animate={{ opacity: volumeWiped ? 0.35 : 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ borderTop: '1px dashed var(--ink-faint)', marginTop: 4, paddingTop: 4 }}
                  >
                    <span>/data/state.txt</span>
                    <span style={{ color: 'var(--ink-faint)' }}>
                      {'  → '}
                      {volumeWiped
                        ? <em style={{ color: 'var(--accent)' }}>(missing — volume wiped)</em>
                        : JSON.stringify(volumeFile)}
                    </span>
                    <span style={{ color: 'var(--ink-faint)' }}>  # on {VOLUMES[volume].label}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="callout" style={{ fontSize: '0.82rem' }}>
            <strong>Notice:</strong> Secrets project as <em>decoded</em> values inside the Pod — the base64 wrapper
            is only how they ride on the wire and rest in etcd. ConfigMap and Secret keys can each be either
            env vars or files. Click the mount pill on any row to cycle <code>off → env → file</code>.
          </div>
        </div>
      </div>
    </div>
  );
}

function KvRow({ row, mount, onChange, onCycle, onDelete, displayValue, valueReadOnly, isSecret }) {
  const mountLabel = mount === 'off' ? 'unmounted' : mount === 'env' ? 'as env var' : 'as file';
  const mountColor = mount === 'env' ? 'var(--accent)' : mount === 'file' ? '#1c6dd0' : 'var(--ink-faint)';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr) auto auto', gap: '0.35rem', alignItems: 'center' }}>
      <input value={row.key} onChange={(e) => onChange('key', e.target.value)} style={inputStyle()} />
      <input
        value={displayValue ?? row.value}
        readOnly={valueReadOnly}
        onChange={(e) => onChange('value', e.target.value)}
        style={inputStyle(valueReadOnly, isSecret)}
      />
      <button className="btn" onClick={onCycle} title="Cycle mount: off → env → file"
        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderColor: mountColor, color: mountColor }}>
        {mountLabel}
      </button>
      <button className="btn btn-ghost" onClick={onDelete} title="Delete this key"
        style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>×</button>
    </div>
  );
}
