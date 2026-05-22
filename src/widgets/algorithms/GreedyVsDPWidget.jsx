import { useMemo, useState } from 'react';

function greedyChange(coins, target) {
  const sorted = [...coins].sort((a, b) => b - a);
  const used = [];
  let rem = target;
  for (const c of sorted) {
    while (rem >= c) { used.push(c); rem -= c; }
  }
  return rem === 0 ? used : null;
}

function dpChange(coins, target) {
  const dp = new Array(target + 1).fill(Infinity);
  const choice = new Array(target + 1).fill(-1);
  dp[0] = 0;
  for (let v = 1; v <= target; v++) {
    for (const c of coins) {
      if (c <= v && dp[v - c] + 1 < dp[v]) {
        dp[v] = dp[v - c] + 1;
        choice[v] = c;
      }
    }
  }
  if (dp[target] === Infinity) return null;
  const used = [];
  let v = target;
  while (v > 0) { used.push(choice[v]); v -= choice[v]; }
  return used;
}

const SCENARIOS = [
  { coins: [1, 3, 4], target: 6, label: '{1,3,4} → 6 (greedy fails)' },
  { coins: [1, 5, 10, 25], target: 30, label: 'US coins → 30¢ (greedy fine)' },
  { coins: [1, 7, 10], target: 14, label: '{1,7,10} → 14 (greedy fails)' },
  { coins: [1, 2, 5, 10], target: 27, label: '{1,2,5,10} → 27 (both agree)' },
];

export default function GreedyVsDPWidget() {
  const [idx, setIdx] = useState(0);
  const s = SCENARIOS[idx];
  const greedy = useMemo(() => greedyChange(s.coins, s.target), [s]);
  const dp = useMemo(() => dpChange(s.coins, s.target), [s]);

  return (
    <div className="widget">
      <div className="widget-title">Coin change — when greedy works, when it doesn&apos;t</div>
      <div className="controls">
        {SCENARIOS.map((sc, i) => (
          <button key={i} className={`btn ${idx === i ? 'btn-accent' : ''}`} onClick={() => setIdx(i)}>
            {sc.label}
          </button>
        ))}
      </div>
      <div className="widget-stage" style={{ minHeight: 200, padding: '1.2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 4, padding: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Greedy</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: '0.8rem' }}>
              Take the largest coin ≤ remaining, repeat.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {greedy ? greedy.map((c, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '50%', background: '#f59e0b',
                  border: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'white' }}>{c}</span>
              )) : <em style={{ color: 'var(--accent)' }}>no solution</em>}
            </div>
            <div style={{ marginTop: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              <strong>{greedy ? `${greedy.length} coins` : 'failed'}</strong>
            </div>
          </div>
          <div style={{ background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 4, padding: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Dynamic Programming</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: '0.8rem' }}>
              Try every combination; remember the cheapest for each subtotal.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {dp.map((c, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)',
                  border: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'white' }}>{c}</span>
              ))}
            </div>
            <div style={{ marginTop: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              <strong>{dp.length} coins (optimal)</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="callout">
        Greedy: <strong>{greedy ? greedy.length + ' coins' : 'fails'}</strong>. DP: <strong>{dp.length} coins</strong>.
        {greedy && greedy.length === dp.length
          ? ' Both agree here — greedy happens to be optimal for this coin set.'
          : ' Greedy was wrong. DP guarantees optimal because it considers every option for every subtotal.'}
      </div>
    </div>
  );
}
