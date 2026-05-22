import { useMemo, useState } from 'react';

const BITS = 64;
const HASHES = 3;

// Simple deterministic-ish hash for visualisation.
function hash(str, seed) {
  let h = seed * 2654435761;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % BITS);
}
function hashes(str) { return [hash(str, 1), hash(str, 7), hash(str, 13)]; }

export default function RandomizedWidget() {
  const [filter, setFilter] = useState(() => new Array(BITS).fill(false));
  const [inserted, setInserted] = useState([]);
  const [query, setQuery] = useState('');
  const [lastInsert, setLastInsert] = useState('');

  function add() {
    const v = query.trim();
    if (!v) return;
    const idxs = hashes(v);
    const next = filter.slice();
    idxs.forEach((i) => { next[i] = true; });
    setFilter(next);
    setInserted([...inserted, v]);
    setLastInsert(v);
    setQuery('');
  }

  const queryResult = useMemo(() => {
    if (!query.trim()) return null;
    const idxs = hashes(query.trim());
    const allSet = idxs.every((i) => filter[i]);
    const actuallyIn = inserted.includes(query.trim());
    return { idxs, allSet, actuallyIn, falsePositive: allSet && !actuallyIn };
  }, [query, filter, inserted]);

  const setCount = filter.filter(Boolean).length;

  return (
    <div className="widget">
      <div className="widget-title">Bloom filter — add items, query for membership</div>
      <div className="controls">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="type a word…"
          style={{ flex: 1, fontFamily: 'var(--font-mono)', padding: '0.4em 0.6em', border: '2px solid var(--ink)', borderRadius: 'var(--radius)', background: 'var(--paper-deep)' }} />
        <button className="btn btn-accent" onClick={add} disabled={!query.trim()}>Add</button>
        <button className="btn btn-ghost" onClick={() => { setFilter(new Array(BITS).fill(false)); setInserted([]); setLastInsert(''); }}>Reset</button>
      </div>
      <div className="widget-stage" style={{ minHeight: 220, padding: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
          Bit array (64 bits, {HASHES} hashes per item)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '3px', marginBottom: '1rem' }}>
          {filter.map((b, i) => {
            const isQuery = queryResult?.idxs.includes(i);
            const bg = isQuery ? (b ? 'var(--accent)' : 'var(--accent-soft)') : (b ? 'var(--ink)' : 'var(--paper-deep)');
            const color = b || isQuery ? 'white' : 'var(--ink-soft)';
            return (
              <div key={i} style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: bg, color, border: '1px solid var(--ink)', borderRadius: '3px',
                fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700,
                transition: 'background 0.2s ease',
              }}>{b ? '1' : '0'}</div>
            );
          })}
        </div>
        {inserted.length > 0 && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <strong>Inserted ({inserted.length}):</strong> {inserted.join(', ')}
          </div>
        )}
        {queryResult && (
          <div style={{ padding: '0.6rem 0.8rem', background: 'var(--paper-deep)', border: '1.5px solid var(--ink)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            <strong>"{query.trim()}"</strong> hashes to bits [{queryResult.idxs.join(', ')}].{' '}
            {queryResult.allSet
              ? queryResult.actuallyIn
                ? <span style={{ color: '#2a8a3e' }}>✓ probably in (correctly)</span>
                : <span style={{ color: '#d62828' }}>⚠ false positive — all bits set but never inserted</span>
              : <span style={{ color: 'var(--ink-soft)' }}>✗ definitely NOT in (some bit is 0)</span>}
          </div>
        )}
      </div>
      <div className="metrics">
        <div className="metric"><div className="label">Items inserted</div><div className="value">{inserted.length}</div></div>
        <div className="metric"><div className="label">Bits set</div><div className="value">{setCount} / {BITS}</div></div>
        <div className="metric accent"><div className="label">Saturation</div><div className="value">{((setCount / BITS) * 100).toFixed(0)}%</div></div>
      </div>
      <div className="callout">
        Try inserting 5–10 words, then query for one you didn&apos;t insert. As the filter fills up, false positives become more likely — that&apos;s the engineering knob. More bits + more hashes lower the rate.
      </div>
    </div>
  );
}
