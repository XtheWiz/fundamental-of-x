import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// Four DORA metrics — and how the four "behaviour" sliders below
// map onto each. The thresholds come from the public DORA State of
// DevOps report bands (Elite / High / Medium / Low). Adjusting any
// slider (or flipping a practice toggle) snaps every metric's tier
// badge, the overall tier, and the benchmark chart in real time.

const TIERS = ['Elite', 'High', 'Medium', 'Low'];
const TIER_COLOR = {
  Elite:  '#2a8a3e',
  High:   '#1c6dd0',
  Medium: '#d68a00',
  Low:    'var(--accent)',
};
const TIER_RANK = { Elite: 0, High: 1, Medium: 2, Low: 3 };

// Behaviour-slider → DORA-metric mappings.
// Returns the tier band given the slider value.

// Deploys/day → deployment frequency band.
function deployFreqTier(perDay) {
  if (perDay >= 1)       return 'Elite';   // on-demand
  if (perDay >= 1 / 7)   return 'High';    // weekly+
  if (perDay >= 1 / 30)  return 'Medium';  // monthly+
  return 'Low';
}

// % of commits that ship same day → lead-time-to-change band.
function leadTimeTier(sameDayPct) {
  if (sameDayPct >= 80) return 'Elite';   // < 1 hour for most
  if (sameDayPct >= 40) return 'High';    // < 1 day
  if (sameDayPct >= 10) return 'Medium';  // < 1 week
  return 'Low';
}

// % of deploys causing an incident → change-failure-rate band.
// (Lower is better. Classic DORA bands: 0-15 Elite, 16-30 High,
//  31-45 Medium, 46+ Low.)
function changeFailTier(failPct) {
  if (failPct <= 15) return 'Elite';
  if (failPct <= 30) return 'High';
  if (failPct <= 45) return 'Medium';
  return 'Low';
}

// Median minutes to restore service → MTTR band.
function mttrTier(minutes) {
  if (minutes <= 60)         return 'Elite';   // < 1 hour
  if (minutes <= 60 * 24)    return 'High';    // < 1 day
  if (minutes <= 60 * 24 * 7) return 'Medium'; // < 1 week
  return 'Low';
}

// Pretty-print helpers.
function fmtDeploys(d) {
  if (d >= 1)   return `${d.toFixed(d < 10 ? 1 : 0)} / day`;
  if (d >= 1/7) return `${(d * 7).toFixed(1)} / week`;
  return `${(d * 30).toFixed(1)} / month`;
}
function fmtMinutes(m) {
  if (m < 60)              return `${Math.round(m)} min`;
  if (m < 60 * 24)         return `${(m / 60).toFixed(1)} hr`;
  if (m < 60 * 24 * 30)    return `${(m / 60 / 24).toFixed(1)} days`;
  return `${(m / 60 / 24 / 30).toFixed(1)} months`;
}

// Log-scale slider mapping for deploys/day  (0.01 … 50).
const LOG_MIN = Math.log(0.01);
const LOG_MAX = Math.log(50);
function sliderToDeploys(v) { return Math.exp(LOG_MIN + (v / 100) * (LOG_MAX - LOG_MIN)); }
function deploysToSlider(d) { return ((Math.log(d) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100; }

// Log-scale slider for MTTR (1 min … 7 days = 10080 min).
const M_MIN = Math.log(1);
const M_MAX = Math.log(60 * 24 * 7);
function sliderToMttr(v) { return Math.exp(M_MIN + (v / 100) * (M_MAX - M_MIN)); }
function mttrToSlider(m) { return ((Math.log(m) - M_MIN) / (M_MAX - M_MIN)) * 100; }

// Practice toggles. Each one *shifts* certain sliders by deltas; the
// caller composes them via clamp() so multiple practices stack but
// stay in-range.
const PRACTICES = [
  {
    key:   'trunk',
    label: 'Adopt trunk-based development',
    caption: 'Small batches merge to main many times a day — lead time collapses, deploy frequency climbs.',
    apply: (s) => ({ ...s, deploys: clamp(s.deploys * 6, 0.01, 50), sameDay: clamp(s.sameDay + 45, 0, 100) }),
  },
  {
    key:   'gates',
    label: 'Add deploy-protection gates',
    caption: 'Canary + auto-rollback catch bad changes — change-failure rate drops, but deploys slow down slightly.',
    apply: (s) => ({ ...s, failPct: clamp(s.failPct - 25, 0, 50), deploys: clamp(s.deploys * 0.6, 0.01, 50) }),
  },
  {
    key:   'runbook',
    label: 'Improve runbook + monitoring',
    caption: 'Better paging, dashboards, and rehearsed runbooks — incidents are diagnosed and restored far faster.',
    apply: (s) => ({ ...s, mttr: clamp(s.mttr * 0.15, 1, 60 * 24 * 7) }),
  },
];

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Default starting state — a "Medium-ish" team.
const DEFAULT_STATE = {
  deploys:  0.2,   // ~ once every 5 days
  sameDay:  25,    // 25% commits ship same day
  failPct:  28,    // 28% of deploys cause an incident
  mttr:     60 * 8, // 8 hours
};

export default function ObservabilityWidget() {
  const [base, setBase] = useState(DEFAULT_STATE);
  const [active, setActive] = useState({}); // { trunk: true, gates: true, … }

  // Compose: apply each active practice on top of the base sliders.
  const state = useMemo(() => {
    let s = { ...base };
    for (const p of PRACTICES) if (active[p.key]) s = p.apply(s);
    return s;
  }, [base, active]);

  // Per-metric tiers.
  const tiers = {
    deploys: deployFreqTier(state.deploys),
    lead:    leadTimeTier(state.sameDay),
    fail:    changeFailTier(state.failPct),
    mttr:    mttrTier(state.mttr),
  };
  const overall = TIERS[Math.max(...Object.values(tiers).map((t) => TIER_RANK[t]))];

  function reset() {
    setBase(DEFAULT_STATE);
    setActive({});
  }

  return (
    <div className="widget">
      <div className="widget-title">DORA — how behaviours move the four metrics</div>
      <div className="widget-hint">
        Drag a slider or flip a practice. Each metric's tier badge, the overall tier,
        and the benchmark bars update instantly.
      </div>

      {/* Sliders ----------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 1.5rem', margin: '0.6rem 0 1rem' }}>
        <SliderRow
          label="Deploys per day"
          value={fmtDeploys(state.deploys)}
          tier={tiers.deploys}
          sliderVal={deploysToSlider(state.deploys)}
          onChange={(v) => setBase((s) => ({ ...s, deploys: sliderToDeploys(v) }))}
          hint="0.01 – 50 (log scale)"
        />
        <SliderRow
          label="% commits shipping same day"
          value={`${Math.round(state.sameDay)} %`}
          tier={tiers.lead}
          sliderVal={state.sameDay}
          onChange={(v) => setBase((s) => ({ ...s, sameDay: v }))}
          hint="proxy for lead time"
        />
        <SliderRow
          label="% deploys causing an incident"
          value={`${state.failPct.toFixed(1)} %`}
          tier={tiers.fail}
          sliderVal={state.failPct * 2}      /* 0-50 mapped to 0-100 */
          onChange={(v) => setBase((s) => ({ ...s, failPct: v / 2 }))}
          hint="change failure rate"
        />
        <SliderRow
          label="Median time to restore on failure"
          value={fmtMinutes(state.mttr)}
          tier={tiers.mttr}
          sliderVal={mttrToSlider(state.mttr)}
          onChange={(v) => setBase((s) => ({ ...s, mttr: sliderToMttr(v) }))}
          hint="1 min – 7 days (log scale)"
        />
      </div>

      {/* Practice toggles -------------------------------------------- */}
      <div className="controls" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
        {PRACTICES.map((p) => {
          const on = !!active[p.key];
          return (
            <div key={p.key} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <button
                className={`btn ${on ? 'btn-accent' : ''}`}
                style={{ minWidth: 230, textAlign: 'left' }}
                onClick={() => setActive((a) => ({ ...a, [p.key]: !a[p.key] }))}
              >
                {on ? '[on] ' : '[off] '}{p.label}
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', flex: 1, lineHeight: 1.45, paddingTop: '0.4rem' }}>
                {p.caption}
              </span>
            </div>
          );
        })}
        <button className="btn btn-ghost" onClick={reset} style={{ alignSelf: 'flex-start', marginTop: '0.3rem' }}>
          Reset
        </button>
      </div>

      {/* Overall tier + chart ---------------------------------------- */}
      <div className="widget-stage" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1rem', alignItems: 'stretch' }}>
        <OverallPanel overall={overall} tiers={tiers} />
        <BenchmarkChart state={state} tiers={tiers} />
      </div>

      <div className="callout">
        <strong>The trick:</strong> overall tier = your <em>worst</em> metric.
        A team that deploys 20x/day but takes a week to restore is still Low overall.
        The four metrics are designed to balance speed against stability — improving
        one in a way that crushes another is not a win.
      </div>
    </div>
  );
}

// -- subcomponents -----------------------------------------------------

function TierBadge({ tier }) {
  return (
    <span
      className="badge"
      style={{
        background: TIER_COLOR[tier],
        color: 'white',
        borderColor: 'var(--ink)',
      }}
    >
      {tier}
    </span>
  );
}

function SliderRow({ label, value, tier, sliderVal, onChange, hint }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)', letterSpacing: '0.05em' }}>
          {label}
        </label>
        <TierBadge tier={tier} />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={sliderVal}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: '100%', accentColor: TIER_COLOR[tier] }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
        <span style={{ color: 'var(--ink-faint)' }}>{hint}</span>
        <span style={{ fontWeight: 600 }}>{value}</span>
      </div>
    </div>
  );
}

function OverallPanel({ overall, tiers }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--ink-soft)' }}>
          OVERALL TIER
        </div>
        <motion.div
          key={overall}
          initial={{ scale: 0.92, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.4rem',
            color: TIER_COLOR[overall],
            letterSpacing: '0.04em',
            lineHeight: 1.1,
          }}
        >
          {overall}
        </motion.div>
        <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '0.3rem' }}>
          (lowest of the four metrics)
        </div>
      </div>
      <div style={{ marginTop: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 0.6rem' }}>
        {[
          ['Deploy freq', tiers.deploys],
          ['Lead time',   tiers.lead],
          ['Change fail', tiers.fail],
          ['MTTR',        tiers.mttr],
        ].map(([k, t]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--ink-soft)' }}>{k}</span>
            <TierBadge tier={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Bar chart: for each of the four metrics, plot the team's score
// against the Elite benchmark. We normalise everything to a 0-1
// "how close to Elite" score so the four bars are comparable.
function BenchmarkChart({ state, tiers }) {
  // Elite benchmarks: 1/day, 80% same-day, 5% fail, 30 min MTTR.
  const teamScores = {
    deploys: clamp(Math.log(Math.max(state.deploys, 0.001) / 0.001) / Math.log(1 / 0.001), 0, 1),
    lead:    clamp(state.sameDay / 100, 0, 1),
    fail:    clamp(1 - state.failPct / 60, 0, 1),
    mttr:    clamp(1 - Math.log(state.mttr) / Math.log(60 * 24 * 7), 0, 1),
  };
  const rows = [
    { key: 'deploys', label: 'Deploy freq' },
    { key: 'lead',    label: 'Lead time'   },
    { key: 'fail',    label: 'Change fail' },
    { key: 'mttr',    label: 'MTTR'        },
  ];
  const W = 360, H = 170, padL = 88, padR = 60, padT = 10, padB = 20;
  const barH = (H - padT - padB) / rows.length - 8;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
      {/* axis 0 and 100% (Elite) */}
      <line x1={padL} y1={padT} x2={padL} y2={H - padB} className="ml-axis" />
      <line
        x1={W - padR} y1={padT} x2={W - padR} y2={H - padB}
        stroke="var(--ink-faint)" strokeDasharray="3 3" strokeWidth={1.5}
      />
      <text x={W - padR} y={H - padB + 14} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
        Elite
      </text>
      <text x={padL} y={H - padB + 14} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
        0
      </text>

      {rows.map((r, i) => {
        const y = padT + i * ((H - padT - padB) / rows.length) + 4;
        const trackW = W - padR - padL;
        const w = teamScores[r.key] * trackW;
        const color = TIER_COLOR[tiers[r.key]];
        return (
          <g key={r.key}>
            <text x={padL - 6} y={y + barH / 2 + 3} textAnchor="end"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink)' }}>
              {r.label}
            </text>
            {/* track */}
            <rect x={padL} y={y} width={trackW} height={barH}
              fill="var(--paper)" stroke="var(--ink-faint)" strokeWidth={1} rx={2} />
            {/* fill */}
            <motion.rect
              x={padL} y={y} height={barH} rx={2}
              fill={color} stroke="var(--ink)" strokeWidth={1.5}
              animate={{ width: w }}
              transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            />
            {/* tier label at end of bar */}
            <text x={padL + w + 4} y={y + barH / 2 + 3}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, fill: color }}>
              {tiers[r.key]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
