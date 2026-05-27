import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Two philosophies for "same app, many environments":
//   Helm      — one chart, templated by values per release.
//   Kustomize — one base of pure YAML, patched by overlays per environment.
// Same end result (final Deployment YAML), different mental models. Learner
// edits inputs on either side; the rendered Deployment updates live, and the
// dev-vs-prod diff shows what the per-env input actually moved.

const ENVS = ['dev', 'staging', 'prod'];
const TOOLS = {
  helm:      { label: 'Helm',      caption: 'Helm: templating; one chart, many releases.' },
  kustomize: { label: 'Kustomize', caption: 'Kustomize: pure YAML overlays; built into kubectl since v1.14.' },
};

const DEFAULT_HELM_VALUES = {
  dev:     { replicas: 1, imageTag: '1.0.0-dev', debug: true,  metrics: false },
  staging: { replicas: 2, imageTag: '1.0.0-rc1', debug: false, metrics: true  },
  prod:    { replicas: 4, imageTag: '1.0.0',     debug: false, metrics: true  },
};

const KUSTOMIZE_BASE = { replicas: 1, imageTag: '1.0.0', env: { DEBUG: 'false', METRICS: 'false' } };

const DEFAULT_KUSTOMIZE_OVERLAYS = {
  dev:     { replicas: 1, imageTag: '1.0.0-dev', patchEnv: true, envPatch: { DEBUG: 'true',  METRICS: 'false' } },
  staging: { replicas: 2, imageTag: '1.0.0-rc1', patchEnv: true, envPatch: { DEBUG: 'false', METRICS: 'true'  } },
  prod:    { replicas: 4, imageTag: '1.0.0',     patchEnv: true, envPatch: { DEBUG: 'false', METRICS: 'true'  } },
};

function renderDeployment({ env, replicas, imageTag, envVars }) {
  const lines = [
    'apiVersion: apps/v1', 'kind: Deployment', 'metadata:',
    `  name: webapp-${env}`, '  labels:', '    app: webapp', `    env: ${env}`,
    'spec:', `  replicas: ${replicas}`,
    '  selector:', '    matchLabels:', '      app: webapp',
    '  template:', '    metadata:', '      labels:', '        app: webapp', `        env: ${env}`,
    '    spec:', '      containers:', '        - name: webapp',
    `          image: registry.io/webapp:${imageTag}`,
    '          ports:', '            - containerPort: 8080',
    '          env:',
  ];
  for (const [k, v] of Object.entries(envVars)) {
    lines.push(`            - name: ${k}`, `              value: "${v}"`);
  }
  return lines.join('\n');
}

function helmResolve(values, env) {
  const v = values[env];
  return {
    env, replicas: v.replicas, imageTag: v.imageTag,
    envVars: { DEBUG: v.debug ? 'true' : 'false', METRICS: v.metrics ? 'true' : 'false' },
  };
}

function kustomizeResolve(overlays, env) {
  const o = overlays[env];
  const envVars = o.patchEnv ? { ...KUSTOMIZE_BASE.env, ...o.envPatch } : { ...KUSTOMIZE_BASE.env };
  return { env, replicas: o.replicas, imageTag: o.imageTag, envVars };
}

function lineDiff(aText, bText) {
  const a = aText.split('\n'), b = bText.split('\n');
  const n = Math.max(a.length, b.length);
  const rows = [];
  for (let i = 0; i < n; i++) rows.push({ a: a[i] ?? '', b: b[i] ?? '', diff: (a[i] ?? '') !== (b[i] ?? '') });
  return rows;
}

const monoInput = {
  fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
  padding: '0.25rem 0.4rem', border: '1px solid var(--ink-faint)',
  background: 'var(--paper)', borderRadius: 3,
};

export default function HelmKustomizeWidget() {
  const [tool, setTool] = useState('helm');
  const [env, setEnv] = useState('dev');
  const [helmValues, setHelmValues] = useState(DEFAULT_HELM_VALUES);
  const [overlays, setOverlays] = useState(DEFAULT_KUSTOMIZE_OVERLAYS);

  const resolve = (e) => tool === 'helm' ? helmResolve(helmValues, e) : kustomizeResolve(overlays, e);
  const resolved = useMemo(() => resolve(env), [tool, env, helmValues, overlays]);
  const rendered = useMemo(() => renderDeployment(resolved), [resolved]);
  const devYaml  = useMemo(() => renderDeployment(resolve('dev')),  [tool, helmValues, overlays]);
  const prodYaml = useMemo(() => renderDeployment(resolve('prod')), [tool, helmValues, overlays]);
  const diffRows = useMemo(() => lineDiff(devYaml, prodYaml), [devYaml, prodYaml]);
  const diffCount = diffRows.filter((r) => r.diff).length;

  const updateHelm = (e, patch) =>
    setHelmValues((v) => ({ ...v, [e]: { ...v[e], ...patch } }));
  const updateOverlay = (e, patch) =>
    setOverlays((o) => ({ ...o, [e]: { ...o[e], ...patch } }));
  const updateOverlayEnvPatch = (e, key, val) =>
    setOverlays((o) => ({ ...o, [e]: { ...o[e], envPatch: { ...o[e].envPatch, [key]: val } } }));

  return (
    <div className="widget">
      <div className="widget-title">Helm &amp; Kustomize — same Deployment, two philosophies</div>

      <div className="controls">
        {Object.entries(TOOLS).map(([k, v]) => (
          <button key={k} className={`btn ${tool === k ? 'btn-accent' : ''}`} onClick={() => setTool(k)}>
            {v.label}
          </button>
        ))}
        <span style={{ marginLeft: '0.75rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          {TOOLS[tool].caption}
        </span>
      </div>

      <div className="controls">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
          environment:
        </span>
        <div className="pill-group">
          {ENVS.map((e) => (
            <button key={e} className={`btn ${env === e ? 'btn-accent' : 'btn-ghost'}`} onClick={() => setEnv(e)}>
              {e}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
          rendering: webapp-{env}
        </span>
      </div>

      <div className="widget-stage" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', gap: '1rem' }}>
        {/* LEFT: tool-specific inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', minWidth: 0 }}>
          <AnimatePresence mode="wait">
            {tool === 'helm' ? (
              <motion.div key="helm-inputs"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <HelmEditor env={env} values={helmValues[env]} onChange={(p) => updateHelm(env, p)} />
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                  One chart, three releases. The chart contains <code>{'{{ .Values.replicas }}'}</code>-style
                  placeholders; <code>values-{env}.yaml</code> fills them in at <code>helm install</code> time.
                </div>
              </motion.div>
            ) : (
              <motion.div key="kust-inputs"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <KustomizeBaseView />
                <KustomizeOverlayEditor env={env} overlay={overlays[env]}
                  onChange={(p) => updateOverlay(env, p)}
                  onEnvPatchChange={(k, v) => updateOverlayEnvPatch(env, k, v)} />
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                  No templating. The base is real YAML; the overlay&apos;s <code>kustomization.yaml</code> declares
                  strategic-merge patches that <code>kubectl kustomize overlays/{env}</code> applies.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: live rendered YAML */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ fontFamily: 'var(--font-display)' }}>Rendered Deployment ({env})</strong>
            <span className="badge">
              {tool === 'helm' ? `helm template -f values-${env}.yaml` : `kubectl kustomize overlays/${env}`}
            </span>
          </div>
          <div className="metrics">
            <div className="metric">
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>replicas</span>
              <strong>{resolved.replicas}</strong>
            </div>
            <div className="metric">
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>image tag</span>
              <strong style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>{resolved.imageTag}</strong>
            </div>
            <div className="metric">
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>env vars</span>
              <strong>{Object.keys(resolved.envVars).length}</strong>
            </div>
          </div>
          <motion.pre key={tool + env + rendered}
            initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
            className="code-block"
            style={{ fontSize: '0.74rem', lineHeight: 1.45, margin: 0, whiteSpace: 'pre', overflowX: 'auto' }}>
            {rendered}
          </motion.pre>
        </div>
      </div>

      {/* Diff: dev vs prod */}
      <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontFamily: 'var(--font-display)' }}>Diff — dev vs prod (final rendered YAML)</strong>
          <span className="badge">{diffCount} differing line{diffCount === 1 ? '' : 's'}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0.5rem' }}>
          <DiffColumn label="dev" rows={diffRows} side="a" />
          <DiffColumn label="prod" rows={diffRows} side="b" />
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
          Whatever your tool, only the per-environment inputs above can move these highlighted lines.
          Same Deployment shape, different way of expressing &quot;what changes per env&quot;.
        </div>
      </div>

      <div className="callout" style={{ marginTop: '0.6rem', fontSize: '0.85rem' }}>
        <strong>Helm</strong> wins when you want one shippable, versioned artifact (a chart) with knobs;
        <strong> Kustomize</strong> wins when you want zero templating syntax in your YAML and a plain
        <code> kubectl apply -k</code> path. Many teams use both — Kustomize on top of Helm output.
      </div>
    </div>
  );
}

function HelmEditor({ env, values, onChange }) {
  return (
    <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong style={{ fontFamily: 'var(--font-display)' }}>values-{env}.yaml</strong>
        <span className="badge">helm chart input</span>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
          replicas: <strong>{values.replicas}</strong>
        </span>
        <input type="range" min={1} max={10} step={1}
          value={values.replicas}
          onChange={(e) => onChange({ replicas: Number(e.target.value) })} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>image.tag</span>
        <input value={values.imageTag} style={monoInput}
          onChange={(e) => onChange({ imageTag: e.target.value })} />
      </label>

      <div className="pill-group">
        <button className={`btn ${values.debug ? 'btn-accent' : 'btn-ghost'}`}
          onClick={() => onChange({ debug: !values.debug })}>
          debug: {values.debug ? 'on' : 'off'}
        </button>
        <button className={`btn ${values.metrics ? 'btn-accent' : 'btn-ghost'}`}
          onClick={() => onChange({ metrics: !values.metrics })}>
          metrics: {values.metrics ? 'on' : 'off'}
        </button>
      </div>

      <pre className="code-block" style={{ fontSize: '0.72rem', lineHeight: 1.4, margin: 0 }}>{`# values-${env}.yaml
replicas: ${values.replicas}
image:
  repository: registry.io/webapp
  tag: ${values.imageTag}
env:
  debug: ${values.debug}
  metrics: ${values.metrics}`}</pre>
    </div>
  );
}

function KustomizeBaseView() {
  return (
    <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong style={{ fontFamily: 'var(--font-display)' }}>base/deployment.yaml</strong>
        <span className="badge">shared base</span>
      </div>
      <pre className="code-block" style={{ fontSize: '0.72rem', lineHeight: 1.4, margin: 0 }}>{`# base/deployment.yaml (plain YAML — no templating)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
spec:
  replicas: ${KUSTOMIZE_BASE.replicas}
  template:
    spec:
      containers:
        - name: webapp
          image: registry.io/webapp:${KUSTOMIZE_BASE.imageTag}
          env:
            - name: DEBUG
              value: "${KUSTOMIZE_BASE.env.DEBUG}"
            - name: METRICS
              value: "${KUSTOMIZE_BASE.env.METRICS}"`}</pre>
    </div>
  );
}

function KustomizeOverlayEditor({ env, overlay, onChange, onEnvPatchChange }) {
  const envPatchBlock = overlay.patchEnv ? `
      - op: replace
        path: /spec/template/spec/containers/0/env
        value:
          - { name: DEBUG,   value: "${overlay.envPatch.DEBUG}" }
          - { name: METRICS, value: "${overlay.envPatch.METRICS}" }` : '';
  return (
    <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong style={{ fontFamily: 'var(--font-display)' }}>overlays/{env}/</strong>
        <span className="badge">overlay patches</span>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
          replicas patch: <strong>{overlay.replicas}</strong>
        </span>
        <input type="range" min={1} max={10} step={1}
          value={overlay.replicas}
          onChange={(e) => onChange({ replicas: Number(e.target.value) })} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>image tag patch</span>
        <input value={overlay.imageTag} style={monoInput}
          onChange={(e) => onChange({ imageTag: e.target.value })} />
      </label>

      <div className="pill-group">
        <button className={`btn ${overlay.patchEnv ? 'btn-accent' : 'btn-ghost'}`}
          onClick={() => onChange({ patchEnv: !overlay.patchEnv })}>
          patch env block: {overlay.patchEnv ? 'on' : 'off'}
        </button>
        <button className={`btn ${overlay.envPatch.DEBUG === 'true' ? 'btn-accent' : 'btn-ghost'}`}
          disabled={!overlay.patchEnv}
          onClick={() => onEnvPatchChange('DEBUG', overlay.envPatch.DEBUG === 'true' ? 'false' : 'true')}>
          DEBUG: {overlay.envPatch.DEBUG}
        </button>
        <button className={`btn ${overlay.envPatch.METRICS === 'true' ? 'btn-accent' : 'btn-ghost'}`}
          disabled={!overlay.patchEnv}
          onClick={() => onEnvPatchChange('METRICS', overlay.envPatch.METRICS === 'true' ? 'false' : 'true')}>
          METRICS: {overlay.envPatch.METRICS}
        </button>
      </div>

      <pre className="code-block" style={{ fontSize: '0.72rem', lineHeight: 1.4, margin: 0 }}>{`# overlays/${env}/kustomization.yaml
resources:
  - ../../base
nameSuffix: -${env}
commonLabels:
  env: ${env}
patches:
  - target: { kind: Deployment, name: webapp }
    patch: |
      - op: replace
        path: /spec/replicas
        value: ${overlay.replicas}
      - op: replace
        path: /spec/template/spec/containers/0/image
        value: registry.io/webapp:${overlay.imageTag}${envPatchBlock}`}</pre>
    </div>
  );
}

function DiffColumn({ label, rows, side }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>{label}</div>
      <pre className="code-block"
        style={{ fontSize: '0.7rem', lineHeight: 1.4, margin: 0, whiteSpace: 'pre', overflowX: 'auto' }}>
        {rows.map((r, i) => {
          const text = side === 'a' ? r.a : r.b;
          const bg = r.diff ? (side === 'a' ? 'rgba(255, 200, 200, 0.45)' : 'rgba(200, 230, 200, 0.55)') : 'transparent';
          const border = r.diff ? `3px solid ${side === 'a' ? 'var(--accent)' : '#2a8a3e'}` : '3px solid transparent';
          return (
            <div key={i} style={{ background: bg, borderLeft: border, paddingLeft: 4 }}>
              {text || ' '}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
