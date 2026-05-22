import { useRef, useState } from 'react';

const XOR_DATA = [
  { x: 0.1, y: 0.1, c: 0 }, { x: 0.1, y: 0.9, c: 1 },
  { x: 0.9, y: 0.1, c: 1 }, { x: 0.9, y: 0.9, c: 0 },
];

const sigmoid = (z) => 1 / (1 + Math.exp(-Math.max(-50, Math.min(50, z))));

function makeNet() {
  return {
    W1: Array.from({ length: 4 }, () => [Math.random() - 0.5, Math.random() - 0.5]),
    b1: Array.from({ length: 4 }, () => Math.random() - 0.5),
    W2: Array.from({ length: 4 }, () => Math.random() - 0.5),
    b2: Math.random() - 0.5,
  };
}

function forward(net, x1, x2) {
  const h = net.W1.map((w, i) => sigmoid(w[0] * x1 + w[1] * x2 + net.b1[i]));
  const y = sigmoid(h.reduce((acc, hi, i) => acc + hi * net.W2[i], net.b2));
  return { h, y };
}

function step(net, lr) {
  const gW1 = net.W1.map(() => [0, 0]);
  const gb1 = net.b1.map(() => 0);
  const gW2 = net.W2.map(() => 0);
  let gb2 = 0;
  XOR_DATA.forEach((p) => {
    const { h, y } = forward(net, p.x, p.y);
    const dout = y - p.c;
    net.W2.forEach((w, i) => { gW2[i] += dout * h[i]; });
    gb2 += dout;
    h.forEach((hi, i) => {
      const dh = dout * net.W2[i] * hi * (1 - hi);
      gW1[i][0] += dh * p.x;
      gW1[i][1] += dh * p.y;
      gb1[i] += dh;
    });
  });
  const n = XOR_DATA.length;
  net.W1.forEach((w, i) => { w[0] -= lr * gW1[i][0] / n; w[1] -= lr * gW1[i][1] / n; });
  net.b1.forEach((_, i) => { net.b1[i] -= lr * gb1[i] / n; });
  net.W2.forEach((_, i) => { net.W2[i] -= lr * gW2[i] / n; });
  net.b2 -= lr * gb2 / n;
}

function lossOf(net) {
  return XOR_DATA.reduce((acc, p) => {
    const y = forward(net, p.x, p.y).y;
    return acc - (p.c * Math.log(Math.max(1e-7, y)) + (1 - p.c) * Math.log(Math.max(1e-7, 1 - y)));
  }, 0) / XOR_DATA.length;
}

export default function NeuralNetworkWidget() {
  const netRef = useRef(makeNet());
  const [, force] = useState(0);
  const [history, setHistory] = useState(() => [lossOf(netRef.current)]);
  const runRef = useRef(false);

  const stepN = (n) => {
    for (let i = 0; i < n; i++) step(netRef.current, 1.5);
    setHistory((h) => [...h, lossOf(netRef.current)]);
    force((c) => c + 1);
  };

  const trainAsync = async () => {
    if (runRef.current) return;
    runRef.current = true;
    for (let i = 0; i < 20 && runRef.current; i++) {
      for (let j = 0; j < 10; j++) step(netRef.current, 1.5);
      setHistory((h) => [...h, lossOf(netRef.current)]);
      force((c) => c + 1);
      await new Promise((r) => setTimeout(r, 40));
    }
    runRef.current = false;
  };

  const reinit = () => {
    netRef.current = makeNet();
    setHistory([lossOf(netRef.current)]);
    force((c) => c + 1);
  };

  const W = 480, H = 360, PAD = 24;
  const plotW = 240, cell = 12;
  const net = netRef.current;

  const cells = [];
  for (let px = PAD; px < PAD + plotW; px += cell) {
    for (let py = PAD; py < PAD + plotW; py += cell) {
      const xx = (px - PAD) / plotW;
      const yy = 1 - (py - PAD) / plotW;
      const p = forward(net, xx, yy).y;
      const color = p > 0.5 ? `rgba(28, 109, 208, ${(p - 0.5) * 0.8})` : `rgba(214, 40, 40, ${(0.5 - p) * 0.8})`;
      cells.push({ px, py, color });
    }
  }

  const lossX = 290, lossY = PAD, lossW = 170, lossH = 240;
  const maxL = Math.max(...history);
  let lossPath = '';
  if (history.length > 1) {
    history.forEach((l, i) => {
      const px = lossX + (i / (history.length - 1)) * lossW;
      const py = lossY + lossH - (l / maxL) * lossH;
      lossPath += (lossPath ? 'L' : 'M') + px + ',' + py;
    });
  }

  const currentLoss = lossOf(net);
  const acc = XOR_DATA.filter((p) => (forward(net, p.x, p.y).y > 0.5) === (p.c === 1)).length / XOR_DATA.length;

  return (
    <div className="widget">
      <div className="widget-title">XOR — a line cannot do this, but 4 hidden neurons can</div>
      <div className="controls">
        <button className="btn btn-accent" onClick={trainAsync}>Train 200 steps</button>
        <button className="btn" onClick={() => stepN(10)}>Step 10</button>
        <button className="btn btn-ghost" onClick={reinit}>Re-init weights</button>
      </div>
      <div className="widget-stage" style={{ textAlign: 'center' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <rect className="ml-plot-bg" x={PAD} y={PAD} width={plotW} height={plotW} />
          {cells.map((c, i) => <rect key={i} x={c.px} y={c.py} width={cell} height={cell} fill={c.color} />)}
          {XOR_DATA.map((p, i) => (
            <circle key={i}
              className={p.c === 0 ? 'ml-point-a' : 'ml-point-b'}
              cx={PAD + p.x * plotW} cy={PAD + (1 - p.y) * plotW} r={10} />
          ))}
          <text className="ml-axis-text" x={PAD + plotW / 2} y={PAD + plotW + 16} textAnchor="middle">decision regions</text>

          <rect className="ml-plot-bg" x={lossX} y={lossY} width={lossW} height={lossH} />
          <text className="ml-axis-text" x={lossX + lossW / 2} y={lossY + lossH + 16} textAnchor="middle">training loss</text>
          {lossPath && <path d={lossPath} stroke="var(--accent)" strokeWidth={2} fill="none" />}
        </svg>
      </div>
      <div className="metrics">
        <div className="metric"><div className="label">Loss</div><div className="value">{currentLoss.toFixed(4)}</div></div>
        <div className="metric"><div className="label">Steps</div><div className="value">{(history.length - 1) * 10}</div></div>
        <div className="metric accent"><div className="label">Accuracy</div><div className="value">{(acc * 100).toFixed(0)}%</div></div>
      </div>
    </div>
  );
}
