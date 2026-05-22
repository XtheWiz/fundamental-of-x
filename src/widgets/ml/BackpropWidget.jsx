import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const x = 2, target = 1;
const w = 0.5, b = 0.1;
const z = w * x + b;
const y = 1 / (1 + Math.exp(-z));
const L = (y - target) ** 2;
const dL_dy = 2 * (y - target);
const dL_dz = dL_dy * y * (1 - y);
const dL_dw = dL_dz * x;
const dL_db = dL_dz;

const STAGES = [
  { phase: 'init',  label: 'Initial state — input x=2, target=1, parameters w=0.5, b=0.1', nodes: [] },
  { phase: 'fwd-1', label: 'Forward 1: z = w·x + b = 0.5·2 + 0.1 = 1.10', nodes: ['z'] },
  { phase: 'fwd-2', label: 'Forward 2: y = σ(z) = 1/(1+e^−1.1) ≈ 0.7503', nodes: ['z', 'y'] },
  { phase: 'fwd-3', label: 'Forward 3: L = (y − target)² ≈ 0.0624', nodes: ['z', 'y', 'L'] },
  { phase: 'bwd-1', label: 'Backward 1: ∂L/∂y = 2(y − target) ≈ −0.4994', nodes: ['L'] },
  { phase: 'bwd-2', label: 'Backward 2: ∂L/∂z = ∂L/∂y · y(1−y) ≈ −0.0936', nodes: ['L', 'y'] },
  { phase: 'bwd-3', label: 'Backward 3: ∂L/∂w = ∂L/∂z · x ≈ −0.1872 ; ∂L/∂b ≈ −0.0936', nodes: ['L', 'y', 'z'] },
];

export default function BackpropWidget() {
  const [step, setStep] = useState(0);
  const s = STAGES[step];
  const phase = s.phase;
  const isBwd = phase.startsWith('bwd');
  const computed = new Set(s.nodes);
  const W = 600, H = 250;

  const nodes = {
    x: { x: 60, y: 80, label: 'x', val: '2.00' },
    w: { x: 60, y: 150, label: 'w', val: '0.500', grad: phase === 'bwd-3' ? `∂L/∂w = ${dL_dw.toFixed(4)}` : '' },
    b: { x: 60, y: 220, label: 'b', val: '0.100', grad: phase === 'bwd-3' ? `∂L/∂b = ${dL_db.toFixed(4)}` : '' },
    z: { x: 240, y: 120, label: 'z = w·x + b', val: z.toFixed(3), grad: (phase === 'bwd-2' || phase === 'bwd-3') ? `∂L/∂z = ${dL_dz.toFixed(4)}` : '' },
    y: { x: 400, y: 120, label: 'y = σ(z)', val: y.toFixed(4), grad: '' },
    L: { x: 540, y: 120, label: 'L = (y − t)²', val: L.toFixed(4), grad: (phase === 'bwd-1' || phase === 'bwd-2' || phase === 'bwd-3') ? `∂L/∂y = ${dL_dy.toFixed(4)}` : '' },
  };
  const edges = [['x', 'z'], ['w', 'z'], ['b', 'z'], ['z', 'y'], ['y', 'L']];

  return (
    <div className="widget">
      <div className="widget-title">A tiny graph: L = (σ(w·x + b) − target)²</div>
      <div className="controls">
        <button className="btn" onClick={() => setStep(Math.max(0, step - 1))}>← Back</button>
        <button className="btn btn-accent" onClick={() => setStep(Math.min(STAGES.length - 1, step + 1))}>Next step →</button>
        <button className="btn btn-ghost" onClick={() => setStep(0)}>Reset</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>{step} / {STAGES.length - 1}</span>
      </div>
      <div className="widget-stage" style={{ minHeight: 280 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <defs>
            <marker id="bp-fwd" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--ink)" /></marker>
            <marker id="bp-bwd" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="var(--accent)" /></marker>
          </defs>
          {edges.map(([from, to], i) => {
            const a = nodes[from], c = nodes[to];
            return isBwd ? (
              <motion.line key={i}
                x1={c.x - 50} y1={c.y} x2={a.x + 50} y2={a.y}
                stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 3" markerEnd="url(#bp-bwd)"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }}
              />
            ) : (
              <line key={i} x1={a.x + 50} y1={a.y} x2={c.x - 50} y2={c.y}
                stroke="var(--ink)" strokeWidth={1.5} markerEnd="url(#bp-fwd)" />
            );
          })}
          {Object.entries(nodes).map(([k, n]) => {
            const isComp = computed.has(k);
            const fill = isBwd && isComp ? 'var(--accent-soft)' : (isComp ? '#cfe5ff' : 'var(--paper)');
            const stroke = isBwd && isComp ? 'var(--accent)' : 'var(--ink)';
            return (
              <motion.g key={k}
                initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
              >
                <rect x={n.x - 50} y={n.y - 22} width={100} height={44} rx={6}
                  fill={fill} stroke={stroke} strokeWidth={2} />
                <text x={n.x} y={n.y - 4} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{n.label}</text>
                {n.val && <text x={n.x} y={n.y + 12} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-soft)' }}>{n.val}</text>}
                {n.grad && (
                  <AnimatePresence>
                    <motion.text key={n.grad}
                      x={n.x} y={n.y + 36} textAnchor="middle"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--accent)', fontWeight: 600 }}
                      initial={{ opacity: 0, y: n.y + 28 }}
                      animate={{ opacity: 1, y: n.y + 36 }}
                      transition={{ duration: 0.25 }}
                    >{n.grad}</motion.text>
                  </AnimatePresence>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
      <div className="callout">{s.label}</div>
    </div>
  );
}
