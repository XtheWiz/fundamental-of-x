import { useRef, useState } from 'react';

const TRUE_MIN = 3;
const loss = (w) => (w - TRUE_MIN) ** 2 + 1;
const grad = (w) => 2 * (w - TRUE_MIN);

const W = 500, H = 320, PAD = 40;
const WMIN = -5, WMAX = 10;
const LMAX = loss(WMIN);
const xToPx = (w) => PAD + (w - WMIN) / (WMAX - WMIN) * (W - 2 * PAD);
const yToPx = (l) => H - PAD - Math.min(l, LMAX) / LMAX * (H - 2 * PAD);

export default function GradientDescentWidget() {
  const [w, setW] = useState(-2);
  const [lr, setLr] = useState(0.1);
  const [history, setHistory] = useState([]);
  const runRef = useRef(false);

  const stepOnce = () => {
    setHistory((h) => [...h, w]);
    let next = w - lr * grad(w);
    if (!isFinite(next) || Math.abs(next) > 50) next = next > 0 ? 50 : -50;
    setW(next);
  };

  const run = async () => {
    if (runRef.current) return;
    runRef.current = true;
    for (let i = 0; i < 30 && runRef.current; i++) {
      await new Promise((r) => setTimeout(r, 120));
      setW((curr) => {
        setHistory((h) => [...h, curr]);
        let next = curr - lr * grad(curr);
        if (!isFinite(next) || Math.abs(next) > 50) next = next > 0 ? 50 : -50;
        return next;
      });
    }
    runRef.current = false;
  };

  const reset = () => { setHistory([]); };

  let lossPath = '';
  for (let x = WMIN; x <= WMAX; x += 0.1) {
    lossPath += (lossPath ? 'L' : 'M') + xToPx(x) + ',' + yToPx(loss(x));
  }
  const arrowEnd = w - lr * grad(w);

  let exp;
  if (lr > 1.0) exp = <><strong>Diverging.</strong> lr={lr.toFixed(2)} is too large — each step overshoots, then overshoots more. Real ML: pick a smaller lr or use Adam.</>;
  else if (lr < 0.03) exp = <><strong>Too slow.</strong> Convergence will eventually happen, but you'll waste hundreds of steps. Bump lr up.</>;
  else if (lr > 0.9) exp = <><strong>Bouncing.</strong> lr={lr.toFixed(2)} is at the edge of stability — you'll converge but with oscillation.</>;
  else exp = <>Smooth convergence. Each step moves a fraction of the way toward the minimum.</>;

  return (
    <div className="widget">
      <div className="widget-title">Roll the ball down (loss = (w−3)² + 1)</div>
      <div className="controls">
        <label>Learning rate: <strong>{lr.toFixed(2)}</strong></label>
        <input type="range" min="0.01" max="1.2" step="0.01" value={lr} onChange={(e) => setLr(+e.target.value)} style={{ flex: 1 }} />
      </div>
      <div className="controls">
        <label>Starting w: <strong>{w.toFixed(2)}</strong></label>
        <input type="range" min="-5" max="10" step="0.1" value={w} onChange={(e) => { setW(+e.target.value); setHistory([]); }} style={{ flex: 1 }} />
      </div>
      <div className="controls">
        <button className="btn btn-accent" onClick={stepOnce}>Step</button>
        <button className="btn" onClick={run}>Run 30 steps</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>
      <div className="widget-stage" style={{ textAlign: 'center' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <defs>
            <marker id="gd-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <polygon points="0 0, 8 4, 0 8" fill="var(--accent)" />
            </marker>
          </defs>
          <rect className="ml-plot-bg" x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} />
          {[-5, -2.5, 0, 2.5, 5, 7.5, 10].map((wv) => (
            <text key={wv} className="ml-axis-text" x={xToPx(wv)} y={H - PAD + 14} textAnchor="middle">{wv}</text>
          ))}
          <text className="ml-axis-text" x={xToPx(WMAX / 2)} y={H - 4} textAnchor="middle">parameter w</text>
          <text className="ml-axis-text" x={10} y={H / 2} transform={`rotate(-90, 10, ${H / 2})`} textAnchor="middle">loss</text>
          <path d={lossPath} stroke="var(--ink)" strokeWidth={2.5} fill="none" />
          <circle cx={xToPx(TRUE_MIN)} cy={yToPx(loss(TRUE_MIN))} r={4} fill="#2a8a3e" stroke="var(--ink)" strokeWidth={1.5} />
          <text className="ml-axis-text" x={xToPx(TRUE_MIN)} y={yToPx(loss(TRUE_MIN)) + 18} textAnchor="middle" style={{ fill: '#2a8a3e' }}>min</text>
          {history.map((wh, i) => (
            <circle key={i} cx={xToPx(wh)} cy={yToPx(loss(wh))} r={3} fill="var(--accent)"
              opacity={0.2 + 0.6 * (i / Math.max(1, history.length))} />
          ))}
          <line x1={xToPx(w)} y1={yToPx(loss(w))} x2={xToPx(arrowEnd)} y2={yToPx(loss(w))}
            stroke="var(--accent)" strokeWidth={2} markerEnd="url(#gd-arr)" />
          <circle cx={xToPx(w)} cy={yToPx(loss(w))} r={9} fill="var(--accent)" stroke="var(--ink)" strokeWidth={2} />
        </svg>
      </div>
      <div className="metrics">
        <div className="metric"><div className="label">w</div><div className="value">{w.toFixed(3)}</div></div>
        <div className="metric"><div className="label">loss</div><div className="value">{loss(w).toFixed(3)}</div></div>
        <div className="metric accent"><div className="label">steps</div><div className="value">{history.length}</div></div>
      </div>
      <div className="callout">{exp}</div>
    </div>
  );
}
