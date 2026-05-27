import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Fail-fast pipelines: cheap stages first reject bad commits before expensive
// stages burn CPU. The learner picks stages, orders them, and watches a
// pre-canned bad commit either get caught early (good) or slip through to
// an expensive stage (wasteful). Reorder → re-run → metrics update.

const STAGE_CATALOG = {
  lint:        { id: 'lint',        name: 'Lint',              seconds: 5   },
  type:        { id: 'type',        name: 'Type-check',        seconds: 10  },
  unit:        { id: 'unit',        name: 'Unit tests',        seconds: 30  },
  build:       { id: 'build',       name: 'Build',             seconds: 60  },
  integration: { id: 'integration', name: 'Integration tests', seconds: 120 },
  e2e:         { id: 'e2e',         name: 'E2E tests',         seconds: 240 },
  deploy:      { id: 'deploy',      name: 'Deploy',            seconds: 30  },
};

const STAGE_ORDER = ['lint', 'type', 'unit', 'build', 'integration', 'e2e', 'deploy'];

// Each commit "fails at" a specific stage id (or null for clean).
const COMMITS = {
  clean:       { id: 'clean',       label: 'Clean commit (passes all)',                  failsAt: null           },
  typo:        { id: 'typo',        label: 'Typo in code (fails lint)',                  failsAt: 'lint'         },
  typeError:   { id: 'typeError',   label: 'Type error (fails type-check)',              failsAt: 'type'         },
  logicBug:    { id: 'logicBug',    label: 'Logic bug (fails unit test)',                failsAt: 'unit'         },
  integration: { id: 'integration', label: 'Integration regression (fails integration)', failsAt: 'integration'  },
};

// Compute the full run synchronously: each stage runs until first failure
// (the stage that catches it), or all stages pass. We use this both for
// the metrics panel (instant) and for the animated playback (timed).
function computeRun(stageIds, commit) {
  const stages = stageIds.map((id) => STAGE_CATALOG[id]);
  const result = { steps: [], caughtAt: null, totalSeconds: 0, passed: false };

  for (const stage of stages) {
    // Stage runs to completion regardless of pass/fail — its time is spent.
    result.totalSeconds += stage.seconds;
    if (commit.failsAt && stage.id === commit.failsAt) {
      result.steps.push({ id: stage.id, status: 'fail' });
      result.caughtAt = stage.id;
      return result;
    }
    // If the stage that *would* fail isn't in the pipeline, the bug slips
    // past silently — we don't mark a failure here.
    result.steps.push({ id: stage.id, status: 'pass' });
  }
  result.passed = !commit.failsAt || !stageIds.includes(commit.failsAt);
  // "Slipped through" still counts as a pass run from the pipeline's POV.
  return result;
}

// "Wasted CPU minutes" = time spent on stages AFTER the cheapest stage that
// *could* have caught this bug, if the bug was caught (or slipped). Helps
// the learner see what fail-fast actually saves.
function wastedSeconds(stageIds, commit, run) {
  if (!commit.failsAt) return 0;
  const idealIdx = stageIds.indexOf(commit.failsAt);
  if (idealIdx === -1) return run.totalSeconds; // bug slipped — all time wasted
  // Sum runtimes of stages that ran BEFORE the failing stage that didn't
  // need to run if the failing stage had been first.
  let waste = 0;
  for (let i = 0; i < idealIdx; i++) {
    // A stage is "wasted work" relative to fail-fast only if it ran later
    // than necessary. Here we count every stage that ran before the catcher
    // but isn't itself a cheaper guard — i.e. anything more expensive than
    // the catcher that we ran first by mistake.
    const ran = STAGE_CATALOG[stageIds[i]];
    const catcher = STAGE_CATALOG[commit.failsAt];
    if (ran.seconds > catcher.seconds) waste += ran.seconds;
  }
  return waste;
}

function fmtTime(s) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${m}m` : `${m}m ${r}s`;
}

export default function BuildPipelineWidget() {
  const [pipeline, setPipeline] = useState(['lint', 'type', 'unit', 'build', 'integration', 'deploy']);
  const [commitKey, setCommitKey] = useState('logicBug');
  const [playback, setPlayback] = useState({ running: false, idx: -1, status: 'idle' });
  const playRef = useRef(null);

  const commit = COMMITS[commitKey];
  const finalRun = useMemo(() => computeRun(pipeline, commit), [pipeline, commit]);
  const wasted = useMemo(() => wastedSeconds(pipeline, commit, finalRun), [pipeline, commit, finalRun]);

  // Stop any in-flight playback when pipeline or commit changes; the
  // metrics already update instantly via finalRun.
  useEffect(() => {
    if (playRef.current) { clearTimeout(playRef.current); playRef.current = null; }
    setPlayback({ running: false, idx: -1, status: 'idle' });
  }, [pipeline, commitKey]);

  // Cleanup on unmount.
  useEffect(() => () => { if (playRef.current) clearTimeout(playRef.current); }, []);

  function addStage(id) {
    if (pipeline.includes(id)) return;
    setPipeline((p) => [...p, id]);
  }
  function removeStage(id) {
    setPipeline((p) => p.filter((s) => s !== id));
  }
  function moveStage(idx, dir) {
    setPipeline((p) => {
      const next = [...p];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return p;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  // Animate the run: each stage takes ~600ms regardless of its "seconds"
  // (we surface real seconds via labels & metrics; playback is just for
  // visual rhythm).
  function runPipeline() {
    if (pipeline.length === 0) return;
    if (playRef.current) clearTimeout(playRef.current);
    setPlayback({ running: true, idx: 0, status: 'running' });

    const steps = finalRun.steps;
    let i = 0;
    const tick = () => {
      const step = steps[i];
      if (!step) {
        setPlayback({ running: false, idx: pipeline.length, status: finalRun.passed ? 'passed' : 'slipped' });
        return;
      }
      if (step.status === 'fail') {
        setPlayback({ running: false, idx: i, status: 'failed' });
        return;
      }
      i += 1;
      setPlayback({ running: true, idx: i, status: 'running' });
      playRef.current = setTimeout(tick, 600);
    };
    playRef.current = setTimeout(tick, 600);
  }

  function resetPlayback() {
    if (playRef.current) { clearTimeout(playRef.current); playRef.current = null; }
    setPlayback({ running: false, idx: -1, status: 'idle' });
  }

  // What status to show on each stage cell:
  //  - while playback running: stages with idx < playback.idx are "pass",
  //    idx === playback.idx is "active" (or "fail" when status==='failed').
  //  - while idle: show the precomputed finalRun state.
  function stageStatus(idx) {
    if (playback.status === 'idle') return null;
    if (playback.status === 'failed') {
      if (idx < playback.idx) return 'pass';
      if (idx === playback.idx) return 'fail';
      return 'pending';
    }
    if (playback.status === 'running') {
      if (idx < playback.idx) return 'pass';
      if (idx === playback.idx) return 'active';
      return 'pending';
    }
    // passed or slipped
    return 'pass';
  }

  const availableStages = STAGE_ORDER.filter((id) => !pipeline.includes(id));
  const catcherName = finalRun.caughtAt ? STAGE_CATALOG[finalRun.caughtAt].name : null;

  return (
    <div className="widget">
      <div className="widget-title">Build pipelines — fail fast, save minutes</div>
      <div className="widget-hint">
        Compose a CI pipeline, throw a bad commit at it, and watch where it gets caught.
        Move cheap checks earlier to reject bad commits before the expensive stages run.
      </div>

      {/* Commit picker */}
      <div className="controls">
        <label>Commit:</label>
        {Object.values(COMMITS).map((c) => (
          <button
            key={c.id}
            className={`btn ${commitKey === c.id ? 'btn-accent' : ''}`}
            onClick={() => setCommitKey(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Stage palette */}
      <div className="controls">
        <label>Add stage:</label>
        {availableStages.length === 0 && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-faint)' }}>
            all stages in pipeline
          </span>
        )}
        {availableStages.map((id) => {
          const s = STAGE_CATALOG[id];
          return (
            <button key={id} className="btn btn-ghost" onClick={() => addStage(id)}>
              + {s.name} <span style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>({fmtTime(s.seconds)})</span>
            </button>
          );
        })}
      </div>

      {/* Pipeline composition area */}
      <div className="widget-stage" style={{ minHeight: 180 }}>
        {pipeline.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', padding: '2rem 0' }}>
            Empty pipeline. Add stages above.
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'stretch' }}>
          <AnimatePresence>
            {pipeline.map((id, idx) => {
              const stage = STAGE_CATALOG[id];
              const status = stageStatus(idx);
              let bg = 'var(--paper)';
              let bd = 'var(--ink)';
              let textColor = 'var(--ink)';
              if (status === 'pass') { bg = '#d9ead3'; }
              else if (status === 'fail') { bg = 'var(--accent)'; textColor = 'white'; bd = 'var(--accent)'; }
              else if (status === 'active') { bg = '#fff2cc'; }
              else if (status === 'pending') { bg = 'var(--paper-deep)'; textColor = 'var(--ink-faint)'; }

              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: status === 'active' ? 1.04 : 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    border: `2px solid ${bd}`,
                    borderRadius: 'var(--radius)',
                    background: bg,
                    color: textColor,
                    padding: '0.6rem 0.8rem',
                    minWidth: 130,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem',
                    boxShadow: status === 'active' ? '3px 3px 0 var(--ink)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>{idx + 1}. {stage.name}</span>
                    {status === 'pass' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#2a8a3e', fontWeight: 700 }}>OK</span>}
                    {status === 'fail' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700 }}>FAIL</span>}
                    {status === 'active' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>…</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: status === 'fail' ? 'white' : 'var(--ink-soft)' }}>
                    {fmtTime(stage.seconds)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.2rem', marginTop: '0.2rem' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.1em 0.5em', fontSize: '0.85rem', boxShadow: 'none' }}
                      onClick={() => moveStage(idx, -1)}
                      disabled={idx === 0 || playback.running}
                      aria-label="Move up"
                    >↑</button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.1em 0.5em', fontSize: '0.85rem', boxShadow: 'none' }}
                      onClick={() => moveStage(idx, +1)}
                      disabled={idx === pipeline.length - 1 || playback.running}
                      aria-label="Move down"
                    >↓</button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.1em 0.5em', fontSize: '0.85rem', boxShadow: 'none', marginLeft: 'auto' }}
                      onClick={() => removeStage(id)}
                      disabled={playback.running}
                      aria-label="Remove stage"
                    >×</button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Run controls */}
      <div className="controls">
        <button
          className="btn btn-accent"
          onClick={runPipeline}
          disabled={pipeline.length === 0 || playback.running}
        >
          {playback.running ? 'Running…' : 'Run pipeline'}
        </button>
        <button className="btn btn-ghost" onClick={resetPlayback} disabled={playback.status === 'idle'}>
          Reset
        </button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          {pipeline.length} stage{pipeline.length === 1 ? '' : 's'} · commit: {commit.label.split(' (')[0]}
        </span>
      </div>

      {/* Metrics */}
      <div className="metrics">
        <div className="metric">
          <div className="label">Pipeline time</div>
          <div className="value">{fmtTime(finalRun.totalSeconds)}</div>
        </div>
        <div className={`metric ${finalRun.caughtAt ? 'accent' : ''}`}>
          <div className="label">Outcome</div>
          <div className="value" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            {finalRun.caughtAt
              ? `caught @ ${catcherName}`
              : commit.failsAt
                ? 'BUG SLIPPED'
                : 'all green'}
          </div>
        </div>
        <div className={`metric ${wasted > 0 ? 'accent' : ''}`}>
          <div className="label">Wasted CPU</div>
          <div className="value">{fmtTime(wasted)}</div>
        </div>
      </div>

      {/* Result / status callout */}
      <div className="callout">
        <strong>Cheap stages first.</strong> Lint is 5s; type-check is 10s; integration is 2 minutes; E2E is 4.
        Put the cheap guards earliest so a bad commit dies fast — every later stage you run before the catcher is wasted CPU.
        {commit.failsAt && finalRun.caughtAt && wasted > 0 && (
          <div style={{ marginTop: '0.5rem', color: 'var(--accent)' }}>
            This pipeline ran {fmtTime(wasted)} of expensive work before {catcherName} caught the bug.
            Move {catcherName} earlier and that time disappears.
          </div>
        )}
        {commit.failsAt && finalRun.caughtAt && wasted === 0 && (
          <div style={{ marginTop: '0.5rem', color: '#2a8a3e' }}>
            Nicely ordered — {catcherName} caught the bug before any more expensive stage ran.
          </div>
        )}
        {commit.failsAt && !finalRun.caughtAt && (
          <div style={{ marginTop: '0.5rem', color: 'var(--accent)' }}>
            The {commit.failsAt} stage isn't in your pipeline, so the bug slipped through to{' '}
            {pipeline.includes('deploy') ? 'production' : 'the next stage downstream'}. Add it.
          </div>
        )}
        {!commit.failsAt && (
          <div style={{ marginTop: '0.5rem', color: '#2a8a3e' }}>
            Clean commit — every stage runs. Total wall time is the sum of every stage's runtime.
          </div>
        )}
      </div>
    </div>
  );
}
