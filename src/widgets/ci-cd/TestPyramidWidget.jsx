import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

// The classic test-pyramid trade-off, made tactile.
//
// Learner sets how many tests live at each level. We then compute:
//   - wall-clock pipeline time (e2e dominates fast),
//   - "true" coverage (each level grabs a different slice of behaviour),
//   - flake risk (driven mostly by e2e count),
//   - bug-catch profile (which class of bug each level catches).
//
// The actual pyramid below the sliders is drawn from the same numbers,
// so an "ice-cream cone" shape literally appears upside-down on screen.

// Per-test wall-clock cost (seconds), running in parallel-ish CI.
// Numbers are illustrative but in the right ballpark for a typical web app.
const COST_PER_TEST = { unit: 0.02, integration: 1.2, e2e: 15 };

// Diminishing returns toward each level's *own* coverage ceiling.
// Each test type covers a different aspect of the system.
const COVERAGE_CAP = { unit: 55, integration: 30, e2e: 15 }; // %
const COVERAGE_K   = { unit: 400, integration: 60,  e2e: 10 }; // saturation point

// Per-test independent flake probability — e2e dominate.
const FLAKE_P = { unit: 0.00005, integration: 0.0015, e2e: 0.02 };

// Bug classes and how strongly each level catches them (0..1).
const BUG_CLASSES = [
  { key: 'logic',    label: 'Pure logic / edge cases',  weights: { unit: 1.0, integration: 0.25, e2e: 0.10 } },
  { key: 'contract', label: 'Service contracts / SQL',  weights: { unit: 0.20, integration: 1.0,  e2e: 0.40 } },
  { key: 'flow',     label: 'User flows / regressions', weights: { unit: 0.05, integration: 0.30, e2e: 1.0  } },
  { key: 'perf',     label: 'Perf / timing / wiring',   weights: { unit: 0.10, integration: 0.45, e2e: 0.70 } },
];

const PRESETS = {
  healthy:   { label: 'Healthy pyramid',           counts: { unit: 1200, integration: 80, e2e: 8  } },
  icecream:  { label: 'Ice cream cone',            counts: { unit: 150,  integration: 60, e2e: 25 } },
  hourglass: { label: 'Hourglass',                 counts: { unit: 1500, integration: 10, e2e: 22 } },
};

// Helper: diminishing-returns coverage curve, capped at COVERAGE_CAP[level].
function levelCoverage(level, count) {
  const cap = COVERAGE_CAP[level];
  const k   = COVERAGE_K[level];
  return cap * (1 - Math.exp(-count / k));
}

// Compound flake: P(at least one of n tests flakes on a run).
function pipelineFlake(counts) {
  let pPass = 1;
  for (const lvl of ['unit', 'integration', 'e2e']) {
    pPass *= Math.pow(1 - FLAKE_P[lvl], counts[lvl]);
  }
  return 1 - pPass;
}

function fmtTime(seconds) {
  if (seconds < 60) return `${seconds.toFixed(0)} s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds - m * 60);
  if (m < 60) return `${m}m ${s.toString().padStart(2, '0')}s`;
  const h = Math.floor(m / 60);
  const mm = m - h * 60;
  return `${h}h ${mm.toString().padStart(2, '0')}m`;
}

function Slider({ level, label, min, max, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: '1 1 220px', minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', letterSpacing: '0.04em' }}>{label}</label>
        <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{value}</strong>
      </div>
      <input
        type="range"
        min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(level, +e.target.value)}
        style={{ width: '100%' }}
      />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
        {min} – {max}
      </div>
    </div>
  );
}

export default function TestPyramidWidget() {
  const [counts, setCounts] = useState({ unit: 1200, integration: 80, e2e: 8 });

  function setOne(level, v) {
    setCounts((c) => ({ ...c, [level]: v }));
  }
  function applyPreset(key) {
    setCounts({ ...PRESETS[key].counts });
  }

  // Live derived metrics — recomputed every slider tick.
  const metrics = useMemo(() => {
    const timeUnit  = counts.unit        * COST_PER_TEST.unit;
    const timeInt   = counts.integration * COST_PER_TEST.integration;
    const timeE2E   = counts.e2e         * COST_PER_TEST.e2e;
    const totalTime = timeUnit + timeInt + timeE2E;

    const covU = levelCoverage('unit',        counts.unit);
    const covI = levelCoverage('integration', counts.integration);
    const covE = levelCoverage('e2e',         counts.e2e);
    const trueCoverage = covU + covI + covE; // out of 100

    const flake = pipelineFlake(counts);

    const bugProfile = BUG_CLASSES.map((bc) => {
      const score =
        bc.weights.unit        * covU +
        bc.weights.integration * covI +
        bc.weights.e2e         * covE;
      return { ...bc, score };
    });
    const maxBug = Math.max(1, ...bugProfile.map((b) => b.score));

    return {
      timeUnit, timeInt, timeE2E, totalTime,
      covU, covI, covE, trueCoverage,
      flake,
      bugProfile, maxBug,
    };
  }, [counts]);

  // Shape detection — what kind of pyramid is the learner drawing?
  // We compare the *normalised count widths* used to render slices.
  const shape = useMemo(() => {
    const wU = Math.sqrt(counts.unit)        * 1.0;
    const wI = Math.sqrt(counts.integration) * 3.0;
    const wE = Math.sqrt(counts.e2e)         * 6.5;
    let kind = 'pyramid';
    if (wE > wU && wE > wI)         kind = 'inverted';   // ice-cream cone
    else if (wI < wU * 0.4 && wE > wI) kind = 'hourglass';
    else if (wU < wI || wU < wE)    kind = 'inverted';
    return { kind, wU, wI, wE };
  }, [counts]);

  const flakePct = (metrics.flake * 100);
  const flakeClass = flakePct < 5 ? 'live' : flakePct < 20 ? 'warn' : 'err';

  return (
    <div className="widget">
      <div className="widget-title">The test pyramid — pick your trade-off</div>
      <div className="widget-hint">
        Move the sliders. Watch pipeline time, coverage, flake risk and the shape of the pyramid change together.
      </div>

      <div className="controls">
        {Object.entries(PRESETS).map(([k, p]) => (
          <button key={k} className="btn btn-ghost" onClick={() => applyPreset(k)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="controls" style={{ alignItems: 'stretch' }}>
        <Slider level="unit"        label="Unit tests"        min={0} max={2000} value={counts.unit}        onChange={setOne} />
        <Slider level="integration" label="Integration tests" min={0} max={200}  value={counts.integration} onChange={setOne} />
        <Slider level="e2e"         label="End-to-end tests"  min={0} max={30}   value={counts.e2e}         onChange={setOne} />
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">Pipeline time</div>
          <div className="value">{fmtTime(metrics.totalTime)}</div>
        </div>
        <div className="metric">
          <div className="label">True coverage</div>
          <div className="value">{metrics.trueCoverage.toFixed(0)}%</div>
        </div>
        <div className={`metric${flakeClass === 'err' ? ' accent' : ''}`}>
          <div className="label">Flake / run</div>
          <div className="value">{flakePct.toFixed(1)}%</div>
        </div>
        <div className="metric">
          <div className="label">Total tests</div>
          <div className="value">{counts.unit + counts.integration + counts.e2e}</div>
        </div>
      </div>

      <div className="widget-stage" style={{ minHeight: 320 }}>
        <svg viewBox="0 0 720 320" width="100%" style={{ maxWidth: 720 }}>
          <defs>
            <pattern id="pyramid-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--accent)" strokeWidth="1.5" />
            </pattern>
          </defs>

          {/* ---- left: the pyramid ---- */}
          <PyramidShape counts={counts} shape={shape} />

          {/* ---- right: bug-catch bar chart ---- */}
          <g transform="translate(390, 22)">
            <text x={0} y={-4}
              style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.04em' }}>
              Bugs caught — by class
            </text>
            {metrics.bugProfile.map((b, i) => {
              const rowH = 56;
              const y = i * rowH + 14;
              const w = (b.score / metrics.maxBug) * 220;
              return (
                <g key={b.key} transform={`translate(0, ${y})`}>
                  <text x={0} y={10}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-soft)' }}>
                    {b.label}
                  </text>
                  <rect x={0} y={16} width={220} height={18} fill="var(--paper-deep)" stroke="var(--ink-faint)" strokeWidth={1} rx={2} />
                  <motion.rect
                    initial={false}
                    animate={{ width: Math.max(2, w) }}
                    transition={{ duration: 0.25 }}
                    x={0} y={16} height={18}
                    fill="var(--accent)" stroke="var(--ink)" strokeWidth={1.5} rx={2}
                  />
                  <text x={228} y={29}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
                    {b.score.toFixed(0)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <ShapeCallout shape={shape} metrics={metrics} counts={counts} />

      <div className="callout" style={{ marginTop: '0.6rem' }}>
        <strong>Per-test cost model:</strong>{' '}
        unit <span className="badge">{COST_PER_TEST.unit}s</span>
        integration <span className="badge">{COST_PER_TEST.integration}s</span>
        e2e <span className="badge warn">{COST_PER_TEST.e2e}s</span>
        — that 750x gap between a unit and an e2e is the whole reason the pyramid exists.
        Try pushing the e2e slider up: pipeline time and flake risk explode long before coverage notices.
      </div>
    </div>
  );
}

// ---------- helpers ----------

function PyramidShape({ counts, shape }) {
  // We render three trapezoid slices stacked. Width of each slice scales with
  // sqrt(count) — sqrt so a 2000:30 ratio doesn't make the e2e tip invisible —
  // and per-level multipliers tuned so a "healthy" pyramid looks pyramid-shaped.
  const cx = 180;
  const baseY = 290;
  const slotH = 78;

  const wU = Math.max(20, Math.min(320, Math.sqrt(Math.max(1, counts.unit))        * 7.5));
  const wI = Math.max(14, Math.min(290, Math.sqrt(Math.max(1, counts.integration)) * 22));
  const wE = Math.max(10, Math.min(280, Math.sqrt(Math.max(1, counts.e2e))         * 50));

  // y positions (top of each slice)
  const yU_top = baseY - slotH;
  const yI_top = baseY - slotH * 2;
  const yE_top = baseY - slotH * 3;

  const sliceFill = {
    unit:        '#cfe5ff',
    integration: '#fff2cc',
    e2e:         '#fde2e2',
  };

  // For an "inverted" / antipattern shape we add a red dashed surround.
  const antipattern = shape.kind === 'inverted';

  const slice = (topY, bottomY, topW, bottomW, fill, label, count, level) => {
    const x1L = cx - bottomW / 2, x1R = cx + bottomW / 2;
    const x2L = cx - topW / 2,    x2R = cx + topW / 2;
    return (
      <g>
        <motion.polygon
          initial={false}
          animate={{ points: `${x2L},${topY} ${x2R},${topY} ${x1R},${bottomY} ${x1L},${bottomY}` }}
          transition={{ duration: 0.25 }}
          fill={fill} stroke="var(--ink)" strokeWidth={2}
        />
        <text x={cx} y={(topY + bottomY) / 2 + 4} textAnchor="middle"
          style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.04em' }}>
          {label}
        </text>
        <text x={cx} y={(topY + bottomY) / 2 + 20} textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-soft)' }}>
          {count} tests
        </text>
      </g>
    );
  };

  return (
    <g>
      {/* antipattern halo behind the whole pyramid */}
      {antipattern && (
        <rect x={10} y={baseY - slotH * 3 - 16} width={340} height={slotH * 3 + 32}
          fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="6 4" rx={6} />
      )}

      {/* base line */}
      <line x1={20} y1={baseY + 1} x2={340} y2={baseY + 1} stroke="var(--ink)" strokeWidth={2} />

      {/* unit (bottom): widest at base, narrows to integration's bottom width */}
      {slice(yU_top, baseY, wI, wU, sliceFill.unit, 'UNIT', counts.unit, 'unit')}
      {/* integration (middle): widest at its base, narrows to e2e's bottom width */}
      {slice(yI_top, yU_top, wE, wI, sliceFill.integration, 'INTEGRATION', counts.integration, 'integration')}
      {/* e2e (top): widest at its base, narrows to a thin tip */}
      {slice(yE_top, yI_top, Math.max(4, wE * 0.25), wE, sliceFill.e2e, 'E2E', counts.e2e, 'e2e')}

      {/* label below */}
      <text x={cx} y={baseY + 22} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--ink-soft)' }}>
        slice widths scale with √(test count)
      </text>
    </g>
  );
}

function ShapeCallout({ shape, metrics }) {
  if (shape.kind === 'inverted') {
    return (
      <div className="callout" style={{ borderColor: 'var(--accent)', color: 'var(--ink)' }}>
        <strong style={{ color: 'var(--accent)' }}>Ice-cream cone antipattern.</strong>{' '}
        Most of your tests are slow, flaky end-to-end runs sitting on a thin base of unit tests.
        Pipeline takes <strong>{fmtTime(metrics.totalTime)}</strong> and flakes{' '}
        <strong>{(metrics.flake * 100).toFixed(1)}%</strong> of runs — yet pure-logic bugs barely get caught.
        Push the unit slider up; pull e2e down.
      </div>
    );
  }
  if (shape.kind === 'hourglass') {
    return (
      <div className="callout">
        <strong>Hourglass shape.</strong>{' '}
        You have lots of units and lots of e2e, but almost nothing testing the seams between services.
        Contract bugs (wrong JSON shape, SQL drift) will slip through — and when they finally fail in e2e,
        the failure is expensive and hard to localise.
      </div>
    );
  }
  return (
    <div className="callout">
      <strong>Healthy-looking pyramid.</strong>{' '}
      Pipeline: <strong>{fmtTime(metrics.totalTime)}</strong>, true coverage{' '}
      <strong>{metrics.trueCoverage.toFixed(0)}%</strong>, flake rate{' '}
      <strong>{(metrics.flake * 100).toFixed(1)}%</strong>. This is the trade-off the pyramid is selling you:
      cheap-and-fast at the base, slow-and-precious at the tip.
    </div>
  );
}
