import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#d62828', '#1c6dd0', '#2a8a3e'];

function generateData(seed) {
  let s = seed;
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const gauss = () => (rng() + rng() + rng() - 1.5) * 1.2;
  const pts = [];
  [[2.5, 2.5], [7, 3], [5, 7.5]].forEach((c) => {
    for (let i = 0; i < 15; i++) pts.push({ x: c[0] + gauss(), y: c[1] + gauss(), cluster: -1 });
  });
  return pts;
}

function initialCentroids() {
  return Array.from({ length: 3 }, () => ({ x: 1 + Math.random() * 8, y: 1 + Math.random() * 8 }));
}

const W = 480, H = 360, PAD = 30;
const XMIN = 0, XMAX = 10, YMIN = 0, YMAX = 10;
const xToPx = (x) => PAD + (x - XMIN) / (XMAX - XMIN) * (W - 2 * PAD);
const yToPx = (y) => H - PAD - (y - YMIN) / (YMAX - YMIN) * (H - 2 * PAD);

export default function KmeansWidget() {
  const [points, setPoints] = useState(() => generateData(7));
  const [centroids, setCentroids] = useState(() => initialCentroids());
  const [phase, setPhase] = useState('init');
  const [iter, setIter] = useState(0);
  const runRef = useRef(false);

  function reset() {
    setPoints(generateData(Math.floor(Math.random() * 1000)));
    setCentroids(initialCentroids());
    setPhase('init');
    setIter(0);
  }

  function assignStep() {
    setPoints((pts) => pts.map((p) => {
      let best = 0, bestD = Infinity;
      centroids.forEach((c, i) => {
        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      return { ...p, cluster: best };
    }));
    setPhase('assign');
  }

  function updateStep() {
    const moved = [];
    const newCentroids = centroids.map((c, i) => {
      const inCluster = points.filter((p) => p.cluster === i);
      if (!inCluster.length) return c;
      const nx = inCluster.reduce((a, p) => a + p.x, 0) / inCluster.length;
      const ny = inCluster.reduce((a, p) => a + p.y, 0) / inCluster.length;
      moved.push(Math.hypot(nx - c.x, ny - c.y));
      return { x: nx, y: ny };
    });
    setCentroids(newCentroids);
    setPhase(moved.every((m) => m < 0.01) ? 'converged' : 'update');
    setIter((i) => i + 1);
  }

  function stepOnce() {
    if (phase === 'init' || phase === 'update') assignStep();
    else if (phase === 'assign') updateStep();
  }

  async function runAll() {
    if (runRef.current) return;
    runRef.current = true;
    let curPhase = phase, curIter = iter;
    while (curPhase !== 'converged' && curIter < 30 && runRef.current) {
      await new Promise((r) => setTimeout(r, 280));
      if (curPhase === 'init' || curPhase === 'update') { assignStep(); curPhase = 'assign'; }
      else if (curPhase === 'assign') { updateStep(); curIter++; }
    }
    runRef.current = false;
  }

  return (
    <div className="widget">
      <div className="widget-title">Lloyd's algorithm step-by-step (K=3)</div>
      <div className="controls">
        <button className="btn btn-accent" onClick={stepOnce}>Next step</button>
        <button className="btn" onClick={runAll}>Run to convergence</button>
        <button className="btn btn-ghost" onClick={reset}>New dataset</button>
      </div>
      <div className="widget-stage" style={{ textAlign: 'center' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <rect className="ml-plot-bg" x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} />
          {points.map((p, i) => {
            const color = p.cluster >= 0 ? COLORS[p.cluster] : '#aaa';
            return (
              <motion.circle key={i}
                cx={xToPx(p.x)} cy={yToPx(p.y)} r={4} fill={color}
                stroke="var(--ink)" strokeWidth={0.8}
                animate={{ fill: color }} transition={{ duration: 0.25 }}
              />
            );
          })}
          {centroids.map((c, i) => (
            <motion.g key={i}
              animate={{ x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
            >
              <polygon
                points={`${xToPx(c.x)},${yToPx(c.y) - 11} ${xToPx(c.x) + 10},${yToPx(c.y) + 6} ${xToPx(c.x) - 10},${yToPx(c.y) + 6}`}
                fill={COLORS[i]} stroke="var(--ink)" strokeWidth={2.5} />
              <text className="ml-axis-text" x={xToPx(c.x)} y={yToPx(c.y) + 24} textAnchor="middle"
                style={{ fill: COLORS[i], fontWeight: 700 }}>μ{i + 1}</text>
            </motion.g>
          ))}
        </svg>
      </div>
      <div className="metrics">
        <div className="metric"><div className="label">Iteration</div><div className="value">{iter}</div></div>
        <div className="metric"><div className="label">Phase</div><div className="value">{phase}</div></div>
        <div className="metric accent"><div className="label">Status</div><div className="value">{phase === 'converged' ? 'converged ✓' : 'running'}</div></div>
      </div>
    </div>
  );
}
