import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';

// Substring search showdown: naive vs KMP vs Rabin-Karp.
// We pre-compute every step of the run so Step / Play / Reset just walk
// the same array. Editing text/pattern or switching algorithm rebuilds
// the steps from scratch and rewinds to step 0.

const ALGOS = [
  { key: 'naive', label: 'Naive', complexity: 'O(n·m)' },
  { key: 'kmp',   label: 'KMP',   complexity: 'O(n + m)' },
  { key: 'rk',    label: 'Rabin-Karp', complexity: 'O(n + m) avg' },
];

const DEFAULT_TEXT = 'ABABDABACDABABCABABABCABAB';
const DEFAULT_PATTERN = 'ABABCABAB';

// Rolling hash params (small mod for visible numbers, prime base).
const RK_BASE = 31;
const RK_MOD = 1_000_003;

function buildFailure(p) {
  const f = new Array(p.length).fill(0);
  let k = 0;
  for (let i = 1; i < p.length; i++) {
    while (k > 0 && p[k] !== p[i]) k = f[k - 1];
    if (p[k] === p[i]) k++;
    f[i] = k;
  }
  return f;
}

// Every step: { shift, i, j, kind, note, hash?, target?, jumpTo? }
function buildNaiveSteps(t, p) {
  const steps = [];
  if (!p.length || p.length > t.length) return steps;
  for (let s = 0; s <= t.length - p.length; s++) {
    let j = 0;
    while (j < p.length) {
      const eq = t[s + j] === p[j];
      steps.push({
        shift: s, i: s + j, j, kind: eq ? 'match' : 'mismatch',
        note: eq
          ? `text[${s + j}]='${t[s + j]}' == pattern[${j}]`
          : `text[${s + j}]='${t[s + j]}' ≠ pattern[${j}]='${p[j]}' — slide by 1`,
      });
      if (!eq) break;
      j++;
    }
    if (j === p.length) steps.push({ shift: s, i: s, j: p.length - 1, kind: 'found', note: `match at index ${s}` });
  }
  return steps;
}

function buildKmpSteps(t, p) {
  const steps = [];
  if (!p.length || p.length > t.length) return steps;
  const f = buildFailure(p);
  let s = 0, j = 0;
  while (s <= t.length - p.length) {
    if (j < p.length && t[s + j] === p[j]) {
      steps.push({ shift: s, i: s + j, j, kind: 'match', note: `match text[${s + j}]='${t[s + j]}' == pattern[${j}]` });
      j++;
      if (j === p.length) {
        steps.push({ shift: s, i: s, j: p.length - 1, kind: 'found', note: `match at index ${s}` });
        s += j - f[j - 1];
        j = f[j - 1];
      }
    } else if (j === 0) {
      steps.push({ shift: s, i: s, j: 0, kind: 'mismatch', note: `mismatch at j=0 — slide by 1` });
      s += 1;
    } else {
      const newJ = f[j - 1];
      steps.push({
        shift: s, i: s + j, j, kind: 'skip', jumpTo: newJ,
        note: `mismatch at j=${j} — failure[${j - 1}]=${newJ}, skip ${j - newJ} (re-use known prefix)`,
      });
      s += j - newJ;
      j = newJ;
    }
  }
  return steps;
}

function buildRkSteps(t, p) {
  const steps = [];
  if (!p.length || p.length > t.length) return steps;
  const m = p.length, n = t.length;
  let ph = 0, wh = 0, h = 1;
  for (let i = 0; i < m - 1; i++) h = (h * RK_BASE) % RK_MOD;
  for (let i = 0; i < m; i++) {
    ph = (RK_BASE * ph + p.charCodeAt(i)) % RK_MOD;
    wh = (RK_BASE * wh + t.charCodeAt(i)) % RK_MOD;
  }
  for (let s = 0; s <= n - m; s++) {
    if (wh === ph) {
      steps.push({ shift: s, i: s, j: 0, kind: 'verify', hash: wh, target: ph, note: `hash matches (${wh}) — verify char by char` });
      let j = 0;
      while (j < m) {
        const eq = t[s + j] === p[j];
        steps.push({
          shift: s, i: s + j, j, kind: eq ? 'match' : 'mismatch', hash: wh, target: ph,
          note: eq ? `verify text[${s + j}] == pattern[${j}]` : `hash collision — text[${s + j}] ≠ pattern[${j}]`,
        });
        if (!eq) break;
        j++;
      }
      if (j === m) steps.push({ shift: s, i: s, j: m - 1, kind: 'found', hash: wh, target: ph, note: `match at index ${s}` });
    } else {
      steps.push({
        shift: s, i: s, j: -1, kind: 'skip', hash: wh, target: ph,
        note: `hash ${wh} ≠ ${ph} — skip window, no char comparisons`,
      });
    }
    if (s < n - m) {
      wh = (RK_BASE * (wh - t.charCodeAt(s) * h) + t.charCodeAt(s + m)) % RK_MOD;
      if (wh < 0) wh += RK_MOD;
    }
  }
  return steps;
}

function buildSteps(algo, t, p) {
  if (algo === 'naive') return buildNaiveSteps(t, p);
  if (algo === 'kmp')   return buildKmpSteps(t, p);
  return buildRkSteps(t, p);
}

export default function StringAlgosWidget() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [pattern, setPattern] = useState(DEFAULT_PATTERN);
  const [algo, setAlgo] = useState('kmp');
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(null);

  const steps = useMemo(() => buildSteps(algo, text, pattern), [algo, text, pattern]);
  const failure = useMemo(() => (pattern ? buildFailure(pattern) : []), [pattern]);

  // Any input change rewinds the run.
  useEffect(() => { setStepIdx(0); setPlaying(false); }, [algo, text, pattern]);

  useEffect(() => {
    if (!playing) return;
    playRef.current = setInterval(() => {
      setStepIdx((s) => {
        if (s >= steps.length - 1) { setPlaying(false); return s; }
        return s + 1;
      });
    }, 380);
    return () => clearInterval(playRef.current);
  }, [playing, steps.length]);

  const totalSteps = steps.length;
  const stepsTaken = Math.min(stepIdx + 1, Math.max(totalSteps, 1));
  const cur = steps[Math.min(stepIdx, totalSteps - 1)] || {
    shift: 0, j: -1, kind: 'cmp', note: 'edit text and pattern, then press Step.',
  };
  const lastStep = stepIdx >= totalSteps - 1;

  const upTo = steps.slice(0, stepIdx + 1);
  const comparisons = upTo.filter((s) => s.kind === 'match' || s.kind === 'mismatch').length;
  const windowsExamined = new Set(upTo.map((s) => s.shift)).size;
  const occurrences = upTo.filter((s) => s.kind === 'found').length;
  const worstCase = Math.max(1, text.length * pattern.length);

  function step() { setPlaying(false); setStepIdx((s) => Math.min(totalSteps - 1, s + 1)); }
  function reset() { setStepIdx(0); setPlaying(false); }

  const CELL = 22;
  const PAD = 24;
  const Y_TEXT = 50;
  const Y_PAT = 92;
  const stageW = Math.max(560, PAD * 2 + text.length * CELL);
  const stageH = 150;

  return (
    <div className="widget">
      <div className="widget-title">String search — naive vs KMP vs Rabin-Karp</div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Text</label>
        <input
          type="text" className="field" value={text}
          onChange={(e) => setText(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 40))}
          style={{ flex: '1 1 280px', fontFamily: 'var(--font-mono)' }}
          spellCheck={false}
        />
      </div>
      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Pattern</label>
        <input
          type="text" className="field" value={pattern}
          onChange={(e) => setPattern(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 15))}
          style={{ flex: '0 1 220px', fontFamily: 'var(--font-mono)' }}
          spellCheck={false}
        />
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.8rem' }}>
          n={text.length}, m={pattern.length}
        </span>
      </div>

      <div className="controls" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        {ALGOS.map((a) => (
          <label key={a.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="radio" name="strAlgo" checked={algo === a.key} onChange={() => setAlgo(a.key)} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>{a.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>{a.complexity}</span>
          </label>
        ))}
      </div>

      <div className="controls">
        <button className="btn btn-accent" onClick={step} disabled={lastStep || totalSteps === 0}>Step</button>
        <button className="btn" onClick={() => setPlaying((p) => !p)} disabled={(lastStep || totalSteps === 0) && !playing}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          Step {totalSteps ? stepsTaken : 0} / {totalSteps}
        </span>
      </div>

      <div className="widget-stage" style={{ minHeight: stageH + 20 }}>
        <svg viewBox={`0 0 ${stageW} ${stageH}`} width="100%" style={{ maxWidth: stageW }}>
          {text.split('').map((_, i) => (
            <text key={`r${i}`} x={PAD + i * CELL + CELL / 2} y={Y_TEXT - 18}
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: 'var(--ink-faint)' }}>{i}</text>
          ))}

          {text.split('').map((ch, i) => {
            const inWin = i >= cur.shift && i < cur.shift + pattern.length;
            const active = i === cur.i && (cur.kind === 'match' || cur.kind === 'mismatch');
            let fill = 'var(--paper)', stroke = 'var(--ink-faint)';
            if (cur.kind === 'verify' && inWin) { fill = '#fff3c4'; stroke = 'var(--ink)'; }
            if (cur.kind === 'skip' && inWin) { fill = 'var(--paper-deep)'; stroke = 'var(--ink-faint)'; }
            if (active && cur.kind === 'match') { fill = '#d9ead3'; stroke = '#2a8a3e'; }
            if (active && cur.kind === 'mismatch') { fill = '#fde2e2'; stroke = 'var(--accent)'; }
            if (cur.kind === 'found' && inWin) { fill = '#2a8a3e'; stroke = '#1f6b30'; }
            return (
              <g key={`t${i}`}>
                <rect x={PAD + i * CELL} y={Y_TEXT - 14} width={CELL - 2} height={26}
                  fill={fill} stroke={stroke}
                  strokeWidth={active || cur.kind === 'found' ? 2 : 1} rx={3}
                  style={{ transition: 'fill 0.15s ease, stroke 0.15s ease' }} />
                <text x={PAD + i * CELL + (CELL - 2) / 2} y={Y_TEXT + 4} textAnchor="middle"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                    fill: cur.kind === 'found' && inWin ? 'white' : 'var(--ink)',
                  }}>{ch}</text>
              </g>
            );
          })}

          <motion.g
            animate={{ x: PAD + cur.shift * CELL }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            {pattern.split('').map((ch, j) => {
              const active = j === cur.j && (cur.kind === 'match' || cur.kind === 'mismatch');
              let fill = 'var(--paper)', stroke = 'var(--ink-faint)';
              if (cur.kind === 'skip') { fill = 'var(--paper-deep)'; stroke = 'var(--ink-faint)'; }
              if (cur.kind === 'verify') { fill = '#fff3c4'; stroke = 'var(--ink)'; }
              if (active && cur.kind === 'match') { fill = '#d9ead3'; stroke = '#2a8a3e'; }
              if (active && cur.kind === 'mismatch') { fill = '#fde2e2'; stroke = 'var(--accent)'; }
              if (cur.kind === 'found') { fill = '#2a8a3e'; stroke = '#1f6b30'; }
              const carried = algo === 'kmp' && cur.kind === 'skip' && cur.jumpTo !== undefined && j < cur.jumpTo;
              if (carried) { fill = '#cfe5ff'; stroke = '#1c6dd0'; }
              return (
                <g key={`p${j}`}>
                  <rect x={j * CELL} y={Y_PAT - 14} width={CELL - 2} height={26}
                    fill={fill} stroke={stroke}
                    strokeWidth={active || cur.kind === 'found' ? 2 : 1} rx={3} />
                  <text x={(CELL - 2) / 2 + j * CELL} y={Y_PAT + 4} textAnchor="middle"
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                      fill: cur.kind === 'found' ? 'white' : 'var(--ink)',
                    }}>{ch}</text>
                </g>
              );
            })}
            {cur.j >= 0 && cur.j < pattern.length && (cur.kind === 'match' || cur.kind === 'mismatch') && (
              <polygon
                points={`${cur.j * CELL + (CELL - 2) / 2 - 4},${Y_PAT + 18} ${cur.j * CELL + (CELL - 2) / 2 + 4},${Y_PAT + 18} ${cur.j * CELL + (CELL - 2) / 2},${Y_PAT + 12}`}
                fill="var(--ink)" />
            )}
          </motion.g>

          {(cur.kind === 'match' || cur.kind === 'mismatch') && cur.i >= 0 && cur.i < text.length && (
            <polygon
              points={`${PAD + cur.i * CELL + (CELL - 2) / 2 - 4},${Y_TEXT - 18} ${PAD + cur.i * CELL + (CELL - 2) / 2 + 4},${Y_TEXT - 18} ${PAD + cur.i * CELL + (CELL - 2) / 2},${Y_TEXT - 12}`}
              fill="var(--ink)" />
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <div className="metrics">
            <div className="metric accent">
              <div className="label">Char compares</div>
              <div className="value">{comparisons}</div>
            </div>
            <div className="metric">
              <div className="label">Windows</div>
              <div className="value">{windowsExamined}</div>
            </div>
            <div className="metric">
              <div className="label">Matches</div>
              <div className="value">{occurrences}</div>
            </div>
            <div className="metric">
              <div className="label">Worst n·m</div>
              <div className="value" style={{ fontSize: '1.3rem', paddingTop: '0.3rem' }}>{worstCase}</div>
            </div>
          </div>
        </div>

        <SidePanel algo={algo} pattern={pattern} failure={failure} cur={cur} />
      </div>

      <div className="callout">
        <strong>Step {totalSteps ? stepsTaken : 0}.</strong> {cur.note}
        {algo === 'naive' && stepIdx === 0 && (
          <div style={{ marginTop: '0.4rem', color: 'var(--ink-soft)' }}>
            Naive checks every shift 0…n−m. After a mismatch it slides by 1 and re-compares from scratch — the redundancy KMP and Rabin-Karp attack.
          </div>
        )}
        {algo === 'kmp' && cur.kind === 'skip' && (
          <div style={{ marginTop: '0.4rem', color: '#1c6dd0' }}>Prefix already matched — failure table says how far we can re-use it without re-comparing.</div>
        )}
        {algo === 'rk' && cur.kind === 'skip' && (
          <div style={{ marginTop: '0.4rem', color: '#1c6dd0' }}>Hash differs → pattern cannot be here. Whole window skipped in O(1).</div>
        )}
        {cur.kind === 'found' && (
          <div style={{ marginTop: '0.4rem', color: '#2a8a3e' }}>Match found at index {cur.shift}.</div>
        )}
      </div>
    </div>
  );
}

const PANEL_BOX = {
  flex: '1 1 260px', minWidth: 240,
  border: '2px solid var(--ink)', borderRadius: 'var(--radius)',
  padding: '0.7rem 0.9rem', background: 'var(--paper)',
};
const PANEL_TITLE = { fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.4rem' };

function SidePanel({ algo, pattern, failure, cur }) {
  if (!pattern) {
    return (
      <div style={PANEL_BOX}>
        <div style={PANEL_TITLE}>Side panel</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Enter a pattern.</div>
      </div>
    );
  }

  if (algo === 'naive') {
    return (
      <div style={PANEL_BOX}>
        <div style={PANEL_TITLE}>What naive does</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          for s = 0 … n−m:<br />
          &nbsp;&nbsp;for j = 0 … m−1:<br />
          &nbsp;&nbsp;&nbsp;&nbsp;if text[s+j] ≠ pattern[j]: break<br />
          &nbsp;&nbsp;if j == m: report s
          <div style={{ marginTop: '0.5rem', color: 'var(--ink)' }}>Worst case: n·m comparisons. No memory of past work.</div>
        </div>
      </div>
    );
  }

  if (algo === 'kmp') {
    return (
      <div style={PANEL_BOX}>
        <div style={PANEL_TITLE}>Failure table</div>
        <table style={{ borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
          <tbody>
            <tr>
              <td style={{ color: 'var(--ink-soft)', paddingRight: 6 }}>i</td>
              {pattern.split('').map((_, i) => (
                <td key={i} style={tdCell(cur.kind === 'skip' && i === cur.j - 1)}>{i}</td>
              ))}
            </tr>
            <tr>
              <td style={{ color: 'var(--ink-soft)', paddingRight: 6 }}>p</td>
              {pattern.split('').map((ch, i) => (
                <td key={i} style={tdCell(false, true)}>{ch}</td>
              ))}
            </tr>
            <tr>
              <td style={{ color: 'var(--ink-soft)', paddingRight: 6 }}>f</td>
              {failure.map((v, i) => (
                <td key={i} style={tdCell(cur.kind === 'skip' && i === cur.j - 1)}>{v}</td>
              ))}
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          f[i] = length of the longest proper prefix of p[0..i] that is also a suffix.
          {cur.kind === 'skip' && cur.j > 0 && (
            <div style={{ marginTop: '0.4rem', color: '#1c6dd0' }}>
              Mismatch at j={cur.j} → jump j to f[{cur.j - 1}] = {failure[cur.j - 1]}. Prefix re-aligns; no re-comparison.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={PANEL_BOX}>
      <div style={PANEL_TITLE}>Rolling hash</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: 1.7 }}>
        <div>base = {RK_BASE}, mod = {RK_MOD}</div>
        <div>hash(pattern) = <strong>{cur.target ?? '—'}</strong></div>
        <div>
          hash(window @ {cur.shift}) ={' '}
          <strong style={{ color: cur.hash === cur.target ? '#2a8a3e' : 'var(--accent)' }}>{cur.hash ?? '—'}</strong>
        </div>
        <div style={{ marginTop: '0.4rem' }}>
          {cur.kind === 'skip' && <span style={{ color: 'var(--accent)' }}>hash mismatch → skip window (O(1))</span>}
          {cur.kind === 'verify' && <span style={{ color: '#1c6dd0' }}>hash match → verify chars (could be collision)</span>}
          {cur.kind === 'match' && <span style={{ color: '#2a8a3e' }}>verifying… match so far</span>}
          {cur.kind === 'mismatch' && <span style={{ color: 'var(--accent)' }}>verify failed — hash collision</span>}
          {cur.kind === 'found' && <span style={{ color: '#2a8a3e' }}>verified — real match</span>}
        </div>
      </div>
      <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
        Sliding: h' = (base · (h − text[s]·base^(m−1)) + text[s+m]) mod p. One subtract, multiply, add per shift — independent of m.
      </div>
    </div>
  );
}

function tdCell(highlight, bold = false) {
  return {
    border: '1px solid var(--ink-faint)',
    padding: '2px 6px',
    textAlign: 'center',
    minWidth: 18,
    background: highlight ? '#fff3c4' : 'var(--paper-deep)',
    fontWeight: bold ? 700 : 400,
  };
}
