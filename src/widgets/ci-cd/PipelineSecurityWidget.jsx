import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Pipeline Security — walk a build artifact through six stages
// (source -> CI runner -> build -> sign -> registry -> deploy) and
// show how each protection narrows the blast radius of a real attack.
//
// The simulation is deterministic and educational. No real malware,
// no exploit payloads — only the *shape* of supply-chain attacks:
// who touches the artifact at each step, and which guardrail would
// have caught the tampering.

const STAGES = [
  { key: 'source',   label: 'Source',     sub: 'git repo' },
  { key: 'runner',   label: 'CI runner',  sub: 'ephemeral VM' },
  { key: 'build',    label: 'Build',      sub: 'compile + test' },
  { key: 'sign',     label: 'Sign',       sub: 'Sigstore' },
  { key: 'registry', label: 'Registry',   sub: 'OCI / npm' },
  { key: 'deploy',   label: 'Deploy',     sub: 'k8s / lambda' },
];

// Each protection blocks (or detects) attacks at specific stages.
// `blocks` maps attack-id -> stage-key where this protection catches it.
const PROTECTIONS = [
  { id: 'branchProtection', label: 'Branch protection (review + 2FA)',  blocks: { malCommit: 'source' } },
  { id: 'secretScan',       label: 'Secret scanning on commit',          blocks: { leakedPat: 'source' } },
  { id: 'hermetic',         label: 'Hermetic build (no network)',        blocks: { runnerInject: 'build' } },
  { id: 'signing',          label: 'Sigstore signing of artifacts',      blocks: { tamperedTarball: 'sign' } },
  { id: 'sbom',             label: 'SBOM generation + attestation',      blocks: { runnerInject: 'build', tamperedTarball: 'registry' } },
  { id: 'verifyDeploy',     label: 'Deploy verifies signature',          blocks: { tamperedTarball: 'deploy', leakedPat: 'deploy' } },
];

const ATTACKS = {
  malCommit: {
    id: 'malCommit', label: 'Malicious commit',
    blurb: 'An attacker with stolen developer creds pushes a backdoor straight to main.',
    enters: 'source', propagates: ['source','runner','build','sign','registry','deploy'],
    surface: 9, blastIfUncaught: 'production',
  },
  runnerInject: {
    id: 'runnerInject', label: 'Compromised CI runner',
    blurb: 'A shared self-hosted runner runs an extra step that swaps a dependency mid-build.',
    enters: 'runner', propagates: ['runner','build','sign','registry','deploy'],
    surface: 8, blastIfUncaught: 'all customers',
  },
  tamperedTarball: {
    id: 'tamperedTarball', label: 'Tampered tarball in registry',
    blurb: 'After publish, the artifact bytes are replaced in the registry mirror.',
    enters: 'registry', propagates: ['registry','deploy'],
    surface: 6, blastIfUncaught: 'downstream users',
  },
  leakedPat: {
    id: 'leakedPat', label: 'Leaked PAT publishes fake release',
    blurb: 'A personal access token leaks in a log; attacker cuts a fake v9.9.9 release.',
    enters: 'registry', propagates: ['registry','deploy'],
    surface: 7, blastIfUncaught: 'auto-updaters',
  },
};

const ATTACK_LIST = Object.values(ATTACKS);

// Returns per-stage status for the chosen attack and protection set:
// 'clean' | 'tainted' | 'caught' | 'na'
function simulate(attack, enabled) {
  const stageStatus = {};
  const catchersByStage = {};
  for (const p of PROTECTIONS) {
    if (!enabled[p.id]) continue;
    const target = p.blocks[attack.id];
    if (target) {
      catchersByStage[target] = catchersByStage[target] || [];
      catchersByStage[target].push(p.id);
    }
  }

  let caughtAt = null;
  let detectedAt = null;

  for (let i = 0; i < STAGES.length; i++) {
    const s = STAGES[i];
    if (caughtAt !== null) { stageStatus[s.key] = 'na'; continue; }
    if (!attack.propagates.includes(s.key)) { stageStatus[s.key] = 'clean'; continue; }
    if (catchersByStage[s.key]) {
      stageStatus[s.key] = 'caught';
      caughtAt = s.key;
      detectedAt = i;
    } else {
      stageStatus[s.key] = 'tainted';
    }
  }

  const enterIdx = STAGES.findIndex((s) => s.key === attack.enters);
  const ttd = detectedAt !== null ? Math.max(1, detectedAt - enterIdx + 1) : null;
  const blastText = caughtAt
    ? `contained at ${STAGES.find((s) => s.key === caughtAt).label.toLowerCase()}`
    : attack.blastIfUncaught;
  const mitigations = PROTECTIONS.filter((p) => enabled[p.id] && p.blocks[attack.id]).length;
  const surface = Math.max(0, attack.surface - mitigations * 2);
  const enabledCount = Object.values(enabled).filter(Boolean).length;

  return { stageStatus, caughtAt, ttd, blastText, surface, enabledCount };
}

function slsaLevel(enabled) {
  const has = (id) => !!enabled[id];
  if (has('hermetic') && has('signing') && has('sbom') && has('verifyDeploy')
      && has('branchProtection') && has('secretScan')) return 4;
  if (has('hermetic') && has('signing') && has('sbom')) return 3;
  if (has('signing') || has('sbom')) return 2;
  return 1;
}

const SLSA_TEXT = {
  1: 'L1 — pipeline exists, but no provenance, no verification.',
  2: 'L2 — provenance is being produced (signing or SBOM).',
  3: 'L3 — hermetic build + signed provenance + SBOM.',
  4: 'L4 — provenance verified at deploy, source controls enforced.',
};

const BOX_W = 96, BOX_H = 56, GAP = 18;
const TOTAL_W = STAGES.length * BOX_W + (STAGES.length - 1) * GAP;

const STAGE_FILLS = { tainted: '#fde2e2', caught: '#d9ead3', na: 'var(--paper-deep)', clean: 'var(--paper)' };
const STAGE_STROKES = { tainted: 'var(--accent)', caught: '#2a8a3e', na: 'var(--ink)', clean: 'var(--ink)' };

function StageBox({ stage, status, isEnter, x }) {
  const shake = status === 'tainted';
  return (
    <motion.g
      animate={shake ? { x: [x, x - 2, x + 2, x] } : { x }}
      transition={{ duration: 0.4 }}
    >
      <rect x={0} y={0} width={BOX_W} height={BOX_H} rx={6}
        fill={STAGE_FILLS[status]} stroke={STAGE_STROKES[status]} strokeWidth={2.5} />
      <text x={BOX_W / 2} y={22} textAnchor="middle"
        style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>{stage.label}</text>
      <text x={BOX_W / 2} y={38} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>{stage.sub}</text>
      {isEnter && (
        <text x={BOX_W / 2} y={BOX_H + 14} textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--accent)', fontWeight: 700 }}>
          entry point
        </text>
      )}
      {status === 'caught' && (
        <text x={BOX_W / 2} y={BOX_H + 14} textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: '#2a8a3e', fontWeight: 700 }}>
          BLOCKED
        </text>
      )}
    </motion.g>
  );
}

function StageArrow({ idx, tainted }) {
  const x = idx * (BOX_W + GAP) + BOX_W;
  const color = tainted ? 'var(--accent)' : 'var(--ink)';
  return (
    <line x1={x + 1} y1={BOX_H / 2} x2={x + GAP - 1} y2={BOX_H / 2}
      stroke={color} strokeWidth={2.5}
      strokeDasharray={tainted ? '5 4' : undefined}
      markerEnd="url(#pipe-arr)" />
  );
}

export default function PipelineSecurityWidget() {
  const [enabled, setEnabled] = useState({
    branchProtection: false, secretScan: false, hermetic: false,
    signing: false, sbom: false, verifyDeploy: false,
  });
  const [attackId, setAttackId] = useState('malCommit');
  const [playKey, setPlayKey] = useState(0);

  const attack = ATTACKS[attackId];
  const result = useMemo(() => simulate(attack, enabled), [attack, enabled]);
  const level = useMemo(() => slsaLevel(enabled), [enabled]);

  const bump = () => setPlayKey((k) => k + 1);
  const toggle = (id) => { setEnabled((e) => ({ ...e, [id]: !e[id] })); bump(); };
  const pickAttack = (id) => { setAttackId(id); bump(); };
  const enableAll = () => { const n = {}; for (const p of PROTECTIONS) n[p.id] = true; setEnabled(n); bump(); };
  const reset = () => { const n = {}; for (const p of PROTECTIONS) n[p.id] = false; setEnabled(n); bump(); };

  return (
    <div className="widget">
      <div className="widget-title">Pipeline security — six stages, four attacks</div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
          Attack:
        </span>
        <div className="pill-group">
          {ATTACK_LIST.map((a) => (
            <button key={a.id}
              className={`btn ${attackId === a.id ? 'btn-accent' : ''}`}
              onClick={() => pickAttack(a.id)}>
              {a.label}
            </button>
          ))}
        </div>
        <button className="btn btn-accent" onClick={bump} style={{ marginLeft: 'auto' }}>
          Run attack
        </button>
        <button className="btn btn-ghost" onClick={enableAll}>Enable all</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      <div className="widget-stage" style={{ minHeight: 130, overflowX: 'auto' }}>
        <svg key={playKey}
          viewBox={`0 0 ${TOTAL_W} ${BOX_H + 28}`}
          width="100%"
          style={{ maxWidth: TOTAL_W, minWidth: 560 }}>
          <defs>
            <marker id="pipe-arr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <polygon points="0 0,10 5,0 10" fill="var(--ink)" />
            </marker>
          </defs>
          <AnimatePresence>
            {STAGES.map((s, i) => (
              <g key={s.key} transform={`translate(${i * (BOX_W + GAP)}, 0)`}>
                <StageBox stage={s} x={0}
                  status={result.stageStatus[s.key]}
                  isEnter={s.key === attack.enters} />
              </g>
            ))}
            {STAGES.slice(0, -1).map((s, i) => {
              const cur = result.stageStatus[s.key];
              const nxt = result.stageStatus[STAGES[i + 1].key];
              const tainted = cur === 'tainted' || (cur === 'tainted' && nxt === 'caught') || nxt === 'caught';
              return <StageArrow key={`arr-${i}`} idx={i} tainted={tainted && (cur === 'tainted' || nxt === 'caught')} />;
            })}
          </AnimatePresence>
        </svg>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 1fr) minmax(220px, 1fr)',
        gap: '0.8rem', alignItems: 'start',
      }}>
        <div>
          <div style={sectionTitle}>Protections</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {PROTECTIONS.map((p) => {
              const active = enabled[p.id];
              const relevant = !!p.blocks[attackId];
              return (
                <label key={p.id} style={{
                  ...rowBase,
                  border: `1.5px solid ${active ? '#2a8a3e' : 'var(--ink)'}`,
                  background: active ? '#eaf5ec' : 'var(--paper)',
                }}>
                  <input type="checkbox" checked={active} onChange={() => toggle(p.id)} />
                  <span style={{ flex: 1 }}>{p.label}</span>
                  {relevant && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700,
                      color: active ? '#2a8a3e' : 'var(--accent)',
                    }}>
                      {active ? 'catches this' : 'would catch'}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <div style={sectionTitle}>SLSA level</div>
          <div style={{
            border: '1.5px solid var(--ink)', borderRadius: 4, padding: '0.5rem',
            background: 'var(--paper)',
          }}>
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={{
                  flex: 1, height: 28,
                  border: '1.5px solid var(--ink)', borderRadius: 4,
                  background: n <= level ? '#1c6dd0' : 'var(--paper-deep)',
                  color: n <= level ? 'white' : 'var(--ink-faint)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem',
                }}>
                  L{n}
                </div>
              ))}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
              color: 'var(--ink-soft)', lineHeight: 1.4,
            }}>
              {SLSA_TEXT[level]}
            </div>
          </div>
        </div>
      </div>

      <div className="metrics">
        <div className={`metric ${result.surface >= 6 ? 'accent' : ''}`}>
          <div className="label">Attack surface</div>
          <div className="value">{result.surface}</div>
        </div>
        <div className="metric">
          <div className="label">Time to detect</div>
          <div className="value">
            {result.ttd === null ? 'never' : `${result.ttd} stage${result.ttd === 1 ? '' : 's'}`}
          </div>
        </div>
        <div className={`metric ${!result.caughtAt ? 'accent' : ''}`}>
          <div className="label">Blast radius</div>
          <div className="value" style={{ fontSize: '0.95rem' }}>{result.blastText}</div>
        </div>
        <div className="metric">
          <div className="label">Protections on</div>
          <div className="value">{result.enabledCount} / {PROTECTIONS.length}</div>
        </div>
      </div>

      <div className="callout">
        <strong>{attack.label}.</strong> {attack.blurb}
        {result.caughtAt && (
          <div style={{ marginTop: '0.4rem', color: '#2a8a3e' }}>
            Caught at the <strong>{STAGES.find((s) => s.key === result.caughtAt).label}</strong> stage —
            the artifact never made it to production with the tampered bytes.
          </div>
        )}
        {!result.caughtAt && (
          <div style={{ marginTop: '0.4rem', color: 'var(--accent)' }}>
            No enabled control caught this — the tainted artifact reached {result.blastText}.
            The lesson of SLSA is that one control alone is brittle; layered provenance plus
            verification is what shrinks the blast radius.
          </div>
        )}
      </div>
    </div>
  );
}

const sectionTitle = {
  fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '0.4rem',
};
const rowBase = {
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  padding: '0.35rem 0.5rem',
  borderRadius: 4,
  fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
  cursor: 'pointer',
};
