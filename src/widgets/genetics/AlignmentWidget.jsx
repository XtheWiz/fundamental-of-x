import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const COLOR = { A: '#e74c3c', T: '#3498db', G: '#f39c12', C: '#27ae60', U: '#9b59b6' };
const SCORE = { match: 1, mismatch: -1, gap: -2 };

function align(a, b) {
  const n = a.length, m = b.length;
  const M = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
  const From = Array.from({ length: n + 1 }, () => new Int8Array(m + 1));
  for (let i = 1; i <= n; i++) { M[i][0] = M[i-1][0] + SCORE.gap; From[i][0] = 1; }
  for (let j = 1; j <= m; j++) { M[0][j] = M[0][j-1] + SCORE.gap; From[0][j] = 2; }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const matchScore = a[i-1] === b[j-1] ? SCORE.match : SCORE.mismatch;
      const diag = M[i-1][j-1] + matchScore;
      const up = M[i-1][j] + SCORE.gap;
      const left = M[i][j-1] + SCORE.gap;
      let best = diag, from = 0;
      if (up > best) { best = up; from = 1; }
      if (left > best) { best = left; from = 2; }
      M[i][j] = best;
      From[i][j] = from;
    }
  }
  const path = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    path.push([i, j]);
    if (i === 0) { j--; continue; }
    if (j === 0) { i--; continue; }
    const f = From[i][j];
    if (f === 0) { i--; j--; }
    else if (f === 1) { i--; }
    else { j--; }
  }
  path.push([0, 0]);
  path.reverse();
  const aligned = { a: '', b: '' };
  for (let k = 1; k < path.length; k++) {
    const [pi, pj] = path[k-1];
    const [ci, cj] = path[k];
    if (ci === pi + 1 && cj === pj + 1) { aligned.a += a[pi]; aligned.b += b[pj]; }
    else if (ci === pi + 1) { aligned.a += a[pi]; aligned.b += '-'; }
    else { aligned.a += '-'; aligned.b += b[pj]; }
  }
  return { M, path, aligned, score: M[n][m] };
}

const SAMPLES = [['GATTACA', 'GCATGCU'], ['ACGTACGT', 'ACTACGAT'], ['CAT', 'CAT']];
const clean = (s) => s.toUpperCase().replace(/[^ATGCU]/g, '').slice(0, 10);

export default function AlignmentWidget() {
  const [seqA, setSeqA] = useState('GATTACA');
  const [seqB, setSeqB] = useState('GCATGCU');

  const result = useMemo(() => seqA && seqB ? align(seqA, seqB) : null, [seqA, seqB]);

  if (!result) {
    return (
      <div className="widget">
        <div className="widget-title">Needleman-Wunsch matrix &amp; traceback</div>
        <div className="widget-stage">Enter two sequences.</div>
      </div>
    );
  }

  const { M, path, aligned, score } = result;
  const n = seqA.length, m = seqB.length;
  const cell = 36, padL = 60, padT = 40;
  const W = padL + (m + 1) * cell + 20;
  const H = padT + (n + 1) * cell + 100;
  const pathSet = new Set(path.map(([i, j]) => `${i},${j}`));

  const aBases = aligned.a.split('');
  const bBases = aligned.b.split('');
  const matches = aBases.filter((c, i) => c === bBases[i] && c !== '-').length;

  return (
    <div className="widget">
      <div className="widget-title">Needleman-Wunsch matrix &amp; traceback</div>
      <div className="controls">
        <label>A:</label>
        <input value={seqA} onChange={(e) => setSeqA(clean(e.target.value))} maxLength={10}
          style={{ width: 90, fontFamily: 'var(--font-mono)', padding: '0.3em 0.5em', border: '2px solid var(--ink)', borderRadius: 'var(--radius)', background: 'var(--paper-deep)' }} />
        <label>B:</label>
        <input value={seqB} onChange={(e) => setSeqB(clean(e.target.value))} maxLength={10}
          style={{ width: 90, fontFamily: 'var(--font-mono)', padding: '0.3em 0.5em', border: '2px solid var(--ink)', borderRadius: 'var(--radius)', background: 'var(--paper-deep)' }} />
        {SAMPLES.map(([a, b], i) => (
          <button key={i} className="btn" onClick={() => { setSeqA(a); setSeqB(b); }}>
            {i === 0 ? 'GATTACA' : i === 1 ? 'ACGT…' : 'identical'}
          </button>
        ))}
      </div>
      <div className="widget-stage" style={{ minHeight: 340 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <text x={padL + cell / 2} y={padT - 20} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>·</text>
          {seqB.split('').map((b, j) => (
            <text key={`b-${j}`} x={padL + (j + 1) * cell + cell / 2} y={padT - 20} textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, fill: COLOR[b] || 'var(--ink)' }}>{b}</text>
          ))}
          <text x={padL - 25} y={padT + cell / 2 + 4} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>·</text>
          {seqA.split('').map((a, i) => (
            <text key={`a-${i}`} x={padL - 25} y={padT + (i + 1) * cell + cell / 2 + 4} textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, fill: COLOR[a] || 'var(--ink)' }}>{a}</text>
          ))}
          {Array.from({ length: n + 1 }).map((_, i) =>
            Array.from({ length: m + 1 }).map((__, j) => {
              const x = padL + j * cell;
              const y = padT + i * cell;
              const onPath = pathSet.has(`${i},${j}`);
              return (
                <g key={`c-${i}-${j}`}>
                  <rect x={x} y={y} width={cell} height={cell} fill={onPath ? '#f4b8b8' : 'var(--paper)'} stroke="var(--ink)" strokeWidth={1} />
                  <text x={x + cell / 2} y={y + cell / 2 + 4} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: onPath ? 700 : 400 }}>{M[i][j]}</text>
                </g>
              );
            })
          )}
          {path.slice(1).map(([ci, cj], k) => {
            const [pi, pj] = path[k];
            return (
              <motion.line key={`t-${k}`}
                x1={padL + pj * cell + cell / 2} y1={padT + pi * cell + cell / 2}
                x2={padL + cj * cell + cell / 2} y2={padT + ci * cell + cell / 2}
                stroke="var(--accent)" strokeWidth={2} opacity={0.8}
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 0.3 + k * 0.06, duration: 0.2 }}
              />
            );
          })}
          {aBases.map((ca, i) => {
            const ay = padT + (n + 1) * cell + 30;
            const ax = padL + i * 26;
            const cb = bBases[i];
            const match = ca === cb && ca !== '-';
            return (
              <g key={`al-${i}`}>
                <rect x={ax} y={ay - 14} width={22} height={20} fill={COLOR[ca] || '#ccc'} stroke="var(--ink)" rx={3} />
                <text x={ax + 11} y={ay + 1} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, fill: 'white' }}>{ca}</text>
                <rect x={ax} y={ay + 8} width={22} height={20} fill={COLOR[cb] || '#ccc'} stroke="var(--ink)" rx={3} />
                <text x={ax + 11} y={ay + 23} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, fill: 'white' }}>{cb}</text>
                {match && <text x={ax + 11} y={ay + 45} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: 'var(--accent)' }}>|</text>}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="callout">
        <strong>Final score: {score}.</strong> {matches} matches, {aBases.length - matches} mismatches/gaps. The pink path is the traceback from bottom-right to top-left — each step is a match (diagonal), gap-in-A (down), or gap-in-B (right). Scoring: match +1, mismatch −1, gap −2.
      </div>
    </div>
  );
}
