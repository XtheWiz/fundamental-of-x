import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Compare a manual release vs a CI/CD pipeline on the same week of work.
// Manual: commits pile up → one big Friday deploy → regressions surface late
//         and bisect across many commits is slow.
// CI/CD:  every push runs build+test → failures caught in minutes,
//         green changes merge and ship in small batches.
// Metrics recompute on every input change; "Run simulation" replays the
// week as an animated timeline for intuition.

const WORK_DAYS = 5;
const MINUTES_PER_DAY = 8 * 60;
const TOTAL_MIN = WORK_DAYS * MINUTES_PER_DAY;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const MODES = {
  manual: { key: 'manual', label: 'Manual: deploy weekly by hand' },
  cicd:   { key: 'cicd',   label: 'CI/CD: build + test on push, deploy on merge' },
};

// Stable pseudo-random so the timeline doesn't reshuffle per render.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildCommits({ teamSize, commitsPerDev, failRate }) {
  const rand = mulberry32(teamSize * 1009 + commitsPerDev * 53 + Math.round(failRate * 100));
  const out = [];
  let id = 0;
  for (let d = 0; d < WORK_DAYS; d++) {
    for (let dev = 0; dev < teamSize; dev++) {
      for (let c = 0; c < commitsPerDev; c++) {
        out.push({
          id: id++,
          minute: d * MINUTES_PER_DAY + Math.floor(rand() * MINUTES_PER_DAY),
          bad: rand() < failRate,
        });
      }
    }
  }
  return out.sort((a, b) => a.minute - b.minute);
}

function computeMetrics({ commits, manualDeployMin, failRate }) {
  const total = commits.length;
  const bad = commits.filter((c) => c.bad).length;
  const batch = Math.max(1, total);

  // Manual: one batch deploy, MTTR scales with log of batch (bisect time),
  // outage probability rises with batch size × failure rate.
  const manual = {
    deploys: total > 0 ? 1 : 0,
    mttr: bad > 0 ? Math.round(20 * Math.log2(batch + 1) + 25) : 0,
    deployWork: (total > 0 ? 1 : 0) * manualDeployMin,
    outages: Math.round((1 - Math.pow(1 - failRate, Math.min(batch, 40))) * 10) / 10,
  };
  // CI/CD: bad commits rejected before merge; green ones ship. Tiny human
  // babysitting per merge. Failures isolated → minutes to detect.
  const cicd = {
    deploys: total - bad,
    mttr: bad > 0 ? 6 : 0,
    deployWork: Math.round((total - bad) * 0.5),
    outages: Math.round(bad * 0.15 * 10) / 10,
  };
  return { total, bad, manual, cicd };
}

function fmtMinutes(min) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ---- timeline geometry ----
const TL_W = 660;
const TL_H = 220;
const PAD_L = 70;
const PAD_R = 14;
const ROW_MANUAL = 60;
const ROW_CICD = 150;
const ROW_H = 28;
const xAt = (minute) => PAD_L + (minute / TOTAL_MIN) * (TL_W - PAD_L - PAD_R);

function DayGrid() {
  const els = [];
  for (let d = 0; d <= WORK_DAYS; d++) {
    const x = xAt(d * MINUTES_PER_DAY);
    els.push(<line key={`g${d}`} x1={x} y1={28} x2={x} y2={TL_H - 10}
      stroke="var(--ink-faint)" strokeWidth={0.8} strokeDasharray="3 3" />);
    if (d < WORK_DAYS) {
      els.push(<text key={`l${d}`} x={x + (xAt(MINUTES_PER_DAY) - xAt(0)) / 2} y={22}
        textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>
        {DAY_LABELS[d]}
      </text>);
    }
  }
  return <g>{els}</g>;
}

export default function WhyCicdWidget() {
  const [teamSize, setTeamSize] = useState(6);
  const [commitsPerDev, setCommitsPerDev] = useState(3);
  const [manualDeployMin, setManualDeployMin] = useState(90);
  const [failRate, setFailRate] = useState(0.12);
  const [mode, setMode] = useState('manual');

  const [playing, setPlaying] = useState(false);
  const [playMinute, setPlayMinute] = useState(TOTAL_MIN);
  const rafRef = useRef(null);
  const startRef = useRef(0);

  const commits = useMemo(
    () => buildCommits({ teamSize, commitsPerDev, failRate }),
    [teamSize, commitsPerDev, failRate],
  );
  const metrics = useMemo(
    () => computeMetrics({ commits, manualDeployMin, failRate }),
    [commits, manualDeployMin, failRate],
  );

  // Any control change cancels playback and snaps to final frame so the
  // timeline visuals stay consistent with the metrics tiles.
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setPlayMinute(TOTAL_MIN);
  }, [teamSize, commitsPerDev, manualDeployMin, failRate, mode]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  function runSim() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const DUR = 4200;
    startRef.current = performance.now();
    setPlaying(true);
    setPlayMinute(0);
    const step = (now) => {
      const t = Math.min(1, (now - startRef.current) / DUR);
      setPlayMinute(t * TOTAL_MIN);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else { setPlaying(false); rafRef.current = null; }
    };
    rafRef.current = requestAnimationFrame(step);
  }

  const isManual = mode === 'manual';
  const visible = commits.filter((c) => c.minute <= playMinute);
  const fridayAt = TOTAL_MIN - 30;
  const showBatchDeploy = isManual && playMinute >= fridayAt;
  const summary = buildSummary({ metrics, isManual, manualDeployMin, failRate });

  return (
    <div className="widget">
      <div className="widget-title">Why CI/CD — one week, two ways</div>
      <div className="widget-hint">
        Dial in your team. Same commits, same regression rate — compare manual
        Friday-deploy against a pipeline that builds and tests every push.
      </div>

      <div className="controls" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.55rem' }}>
        <Slider label={`Team size: ${teamSize} dev${teamSize === 1 ? '' : 's'}`}
          min={1} max={20} step={1} value={teamSize} onChange={setTeamSize} />
        <Slider label={`Commits / dev / day: ${commitsPerDev}`}
          min={0} max={10} step={1} value={commitsPerDev} onChange={setCommitsPerDev} />
        <Slider label={`Manual deploy time: ${fmtMinutes(manualDeployMin)}`}
          min={10} max={240} step={5} value={manualDeployMin} onChange={setManualDeployMin} />
        <Slider label={`Regression rate: ${(failRate * 100).toFixed(0)}% of commits`}
          min={0} max={0.4} step={0.01} value={failRate} onChange={setFailRate} />
      </div>

      <div className="controls">
        {Object.values(MODES).map((mm) => (
          <button key={mm.key} className={`btn ${mode === mm.key ? 'btn-accent' : ''}`}
            onClick={() => setMode(mm.key)}>{mm.label}</button>
        ))}
        <button className="btn btn-accent" onClick={runSim} disabled={playing} style={{ marginLeft: 'auto' }}>
          {playing ? 'Running…' : 'Run simulation for a week'}
        </button>
      </div>

      <div className="widget-stage" style={{ minHeight: TL_H + 24 }}>
        <svg viewBox={`0 0 ${TL_W} ${TL_H}`} width="100%" style={{ maxWidth: TL_W }}>
          <DayGrid />

          <text x={6} y={ROW_MANUAL + ROW_H / 2 + 4}
            style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>Manual</text>
          <text x={6} y={ROW_CICD + ROW_H / 2 + 4}
            style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>CI/CD</text>

          <rect x={PAD_L} y={ROW_MANUAL} width={TL_W - PAD_L - PAD_R} height={ROW_H}
            fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} rx={4}
            opacity={isManual ? 1 : 0.45} />
          <rect x={PAD_L} y={ROW_CICD} width={TL_W - PAD_L - PAD_R} height={ROW_H}
            fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} rx={4}
            opacity={!isManual ? 1 : 0.45} />

          <AnimatePresence>
            {visible.map((c) => (
              <motion.circle key={`mc-${c.id}`}
                initial={{ opacity: 0, r: 0 }}
                animate={{ opacity: isManual ? 1 : 0.35, r: 3.5 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
                cx={xAt(c.minute)} cy={ROW_MANUAL + ROW_H / 2}
                fill={c.bad ? 'var(--accent)' : '#2a8a3e'}
                stroke="var(--ink)" strokeWidth={1} />
            ))}
          </AnimatePresence>

          {showBatchDeploy && (
            <motion.g initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <rect x={xAt(fridayAt) - 6} y={ROW_MANUAL - 6}
                width={xAt(TOTAL_MIN) - xAt(fridayAt) + 12} height={ROW_H + 12}
                fill={metrics.bad > 0 ? 'var(--accent)' : '#2a8a3e'}
                opacity={0.18}
                stroke={metrics.bad > 0 ? 'var(--accent)' : '#2a8a3e'}
                strokeWidth={2} rx={4} />
              <text x={xAt(TOTAL_MIN) - 8} y={ROW_MANUAL - 10} textAnchor="end"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                  fill: metrics.bad > 0 ? 'var(--accent)' : '#2a8a3e' }}>
                {metrics.bad > 0
                  ? `BIG-BATCH DEPLOY (${metrics.bad} regressions hidden inside)`
                  : 'BIG-BATCH DEPLOY'}
              </text>
            </motion.g>
          )}

          <AnimatePresence>
            {visible.map((c) => (
              <motion.g key={`cc-${c.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: !isManual ? 1 : 0.35 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <rect x={xAt(c.minute) - 2} y={ROW_CICD + 4} width={4} height={ROW_H - 8}
                  fill={c.bad ? 'var(--accent)' : '#2a8a3e'} stroke="var(--ink)" strokeWidth={0.8} />
                {c.bad && !isManual && (
                  <motion.circle initial={{ r: 0, opacity: 0.8 }} animate={{ r: 8, opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    cx={xAt(c.minute)} cy={ROW_CICD + ROW_H / 2}
                    fill="none" stroke="var(--accent)" strokeWidth={1.5} />
                )}
              </motion.g>
            ))}
          </AnimatePresence>

          {playing && (
            <line x1={xAt(playMinute)} y1={28} x2={xAt(playMinute)} y2={TL_H - 10}
              stroke="var(--accent)" strokeWidth={1.5} />
          )}

          <g transform={`translate(${PAD_L}, ${TL_H - 4})`}>
            <circle cx={4} cy={-2} r={3.5} fill="#2a8a3e" stroke="var(--ink)" strokeWidth={1} />
            <text x={14} y={2} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>green commit</text>
            <circle cx={104} cy={-2} r={3.5} fill="var(--accent)" stroke="var(--ink)" strokeWidth={1} />
            <text x={114} y={2} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>regression</text>
          </g>
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', margin: '0.8rem 0' }}>
        <Column title={MODES.manual.label} highlight={isManual} tiles={[
          { label: 'Deploys / week', value: metrics.manual.deploys },
          { label: 'MTTR for regression', value: metrics.bad > 0 ? fmtMinutes(metrics.manual.mttr) : '—' },
          { label: 'Human deploy work', value: fmtMinutes(metrics.manual.deployWork) },
          { label: 'Outages (big-batch risk)', value: metrics.manual.outages, accent: true },
        ]} />
        <Column title={MODES.cicd.label} highlight={!isManual} tiles={[
          { label: 'Deploys / week', value: metrics.cicd.deploys },
          { label: 'MTTR for regression', value: metrics.bad > 0 ? fmtMinutes(metrics.cicd.mttr) : '—' },
          { label: 'Human deploy work', value: fmtMinutes(metrics.cicd.deployWork) },
          { label: 'Outages (small-batch)', value: metrics.cicd.outages },
        ]} />
      </div>

      <div className="callout">
        <strong>Why CI/CD wins here.</strong> {summary}
      </div>
    </div>
  );
}

function Slider({ label, min, max, step, value, onChange }) {
  return (
    <label style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '0.6rem', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--ink)' }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%' }} />
    </label>
  );
}

function Column({ title, tiles, highlight }) {
  return (
    <div style={{
      border: '2px solid var(--ink)', borderRadius: 'var(--radius)',
      padding: '0.6rem 0.7rem',
      background: highlight ? 'var(--paper)' : 'var(--paper-deep)',
      boxShadow: highlight ? '3px 3px 0 var(--ink)' : 'none',
      opacity: highlight ? 1 : 0.88,
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>{title}</div>
      <div className="metrics" style={{ margin: 0 }}>
        {tiles.map((t) => (
          <div key={t.label} className={`metric${t.accent ? ' accent' : ''}`}>
            <div className="label">{t.label}</div>
            <div className="value">{t.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildSummary({ metrics, isManual, manualDeployMin, failRate }) {
  if (metrics.total === 0) {
    return 'No commits this week — bump up team size or commits per dev to see the gap.';
  }
  const m = metrics.manual, c = metrics.cicd;
  const deployGap = Math.max(0, c.deploys - m.deploys);
  const mttrGap = Math.max(0, m.mttr - c.mttr);
  const workGap = Math.max(0, m.deployWork - c.deployWork);
  const outageGap = (m.outages - c.outages).toFixed(1);
  return (
    `With ${metrics.total} commits and a ${(failRate * 100).toFixed(0)}% regression rate, ` +
    `the pipeline ships ${deployGap} more times this week, ` +
    `finds regressions ~${mttrGap} min faster (small batch, one commit to blame), ` +
    `and saves ~${fmtMinutes(workGap)} of manual deploy babysitting. ` +
    `Outage exposure drops by ~${outageGap} incidents because risk is spread across small merges ` +
    `instead of one ${fmtMinutes(manualDeployMin)} Friday push.` +
    (isManual ? ' Switch to CI/CD above to see the same week play out cleanly.' : '')
  );
}
