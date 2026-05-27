import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

// Each index type is a specialist. Pick a data shape and a query shape;
// see which of B-tree / Hash / GIN / GIST / Bloom is actually built for
// the job — and which ones simply cannot answer the query at all.
//
// Pedagogy: the comparison table updates immediately, an OPTIMAL badge
// snaps to the winner, and a tiny diagram per index reminds you of the
// structure that makes it good (or bad) for the chosen query shape.

const DATA_TYPES = {
  integer:  { label: 'integer ids',   sample: '42, 137, 8 901, 12 003, …' },
  string:   { label: 'strings',       sample: '"alice", "alan", "ben", …' },
  geo:      { label: 'geo points',    sample: '(52.37, 4.89), (40.71, -74.0), …' },
  json:     { label: 'JSON documents', sample: '{ tags:["a","b"], price:9 }' },
  fulltext: { label: 'full-text articles', sample: '"the quick brown fox…"' },
};

// Which query shapes make sense for which data shape.
const QUERY_TYPES = {
  exact:    { label: 'exact match', forData: ['integer', 'string', 'geo', 'json', 'fulltext'] },
  range:    { label: 'range',        forData: ['integer', 'string'] },
  prefix:   { label: 'prefix',       forData: ['string'] },
  contains: { label: 'contains-word', forData: ['fulltext', 'json'] },
  georad:   { label: 'geo radius',   forData: ['geo'] },
  jsonpath: { label: 'JSON path',    forData: ['json'] },
};

const INDEX_TYPES = ['btree', 'hash', 'gin', 'gist', 'bloom'];

const INDEX_META = {
  btree: { label: 'B-tree',  tag: 'ordered tree' },
  hash:  { label: 'Hash',    tag: 'bucket map' },
  gin:   { label: 'GIN',     tag: 'inverted index' },
  gist:  { label: 'GIST',    tag: 'spatial / R-tree' },
  bloom: { label: 'Bloom',   tag: 'probabilistic bitset' },
};

// Per (index × query) capability matrix. Each entry describes whether the
// index can serve the query and, if so, the cost class and a tiny "why".
// We score winners with a numeric rank so picking the optimum is mechanical.
function evaluate(indexId, dataId, queryId) {
  // helpers — score: lower is better; null means not supported.
  const make = (supported, big, why, score) => ({ supported, big, why, score });

  if (indexId === 'btree') {
    if (queryId === 'exact')  return make(true,  'O(log n)', 'walks the tree to a single leaf.', 2);
    if (queryId === 'range')  return make(true,  'O(log n + k)', 'finds the start, then scans leaves in order.', 1);
    if (queryId === 'prefix') return make(true,  'O(log n + k)', 'sorted keys make prefix a special range.', 1);
    if (queryId === 'contains') return make(false, '—', 'leaves are ordered by whole key, not by inner words.');
    if (queryId === 'georad') return make(false, '—', '1-D ordering cannot bound a 2-D radius cheaply.');
    if (queryId === 'jsonpath') return make(false, '—', 'does not crack open JSON keys; only whole-value compares.');
  }

  if (indexId === 'hash') {
    if (queryId === 'exact')  return make(true,  'O(1) avg', 'hash the key, jump to the bucket.', 1);
    if (queryId === 'range')  return make(false, '—', 'buckets destroy order — no way to walk a range.');
    if (queryId === 'prefix') return make(false, '—', 'hash of "alice" tells you nothing about "ali%".');
    if (queryId === 'contains') return make(false, '—', 'hashes the whole document, not its words.');
    if (queryId === 'georad') return make(false, '—', 'no notion of nearness between buckets.');
    if (queryId === 'jsonpath') return make(false, '—', 'whole-document hash; cannot probe sub-paths.');
  }

  if (indexId === 'gin') {
    if (queryId === 'contains') return make(true, 'O(log n) per term', 'posting lists per word — intersect them.', 1);
    if (queryId === 'jsonpath') return make(true, 'O(log n) per key', 'inverted index over JSON keys/values.', 1);
    if (queryId === 'exact') {
      if (dataId === 'fulltext' || dataId === 'json') return make(true, 'O(log n)', 'works, but slower writes than B-tree.', 4);
      return make(false, '—', 'designed to index *elements*, not whole scalars.');
    }
    if (queryId === 'range')  return make(false, '—', 'no global ordering on posting lists.');
    if (queryId === 'prefix') return make(false, '—', 'organised by term, not by sorted character order.');
    if (queryId === 'georad') return make(false, '—', 'no geometric bounding — only set membership.');
  }

  if (indexId === 'gist') {
    if (queryId === 'georad') return make(true, 'O(log n)', 'R-tree of bounding boxes — prune by overlap.', 1);
    if (queryId === 'exact') {
      if (dataId === 'geo') return make(true, 'O(log n)', 'bounding box of a single point still works.', 3);
      return make(false, '—', 'GIST shines for geometric/range types, not scalars.');
    }
    if (queryId === 'range')  return make(true,  'O(log n + k)', 'supports range, but B-tree is tighter for 1-D.', 3);
    if (queryId === 'prefix') return make(false, '—', 'not optimised for character prefixes.');
    if (queryId === 'contains') return make(false, '—', 'no inverted lists; geometry not text.');
    if (queryId === 'jsonpath') return make(false, '—', 'GIN handles JSON paths, GIST does not.');
  }

  if (indexId === 'bloom') {
    if (queryId === 'exact')  return make(true, 'O(1), may false-positive', 'bit test; confirms with a heap fetch.', 5);
    // Bloom genuinely cannot do anything else.
    return make(false, '—', 'membership-only: no order, no structure, no geometry.');
  }
  return make(false, '—', '');
}

const STORAGE = {
  btree: '~1.2x key size',
  hash:  '~1.0x key size',
  gin:   '2–10x (posting lists)',
  gist:  '~1.5x (bbox per row)',
  bloom: '~0.1x (bits per row)',
};

// Pick the best-supported index for the current (data, query) pair.
// Lower score wins; ties broken in INDEX_TYPES declaration order.
function pickOptimal(dataId, queryId) {
  let best = null;
  for (const id of INDEX_TYPES) {
    const e = evaluate(id, dataId, queryId);
    if (!e.supported) continue;
    if (!best || e.score < best.score) best = { id, ...e };
  }
  return best;
}

// One short sentence explaining *why* the winner wins for this combo.
function whyWinner(dataId, queryId, winnerId) {
  if (!winnerId) return 'No index helps here — the planner will fall back to a sequential scan.';
  if (winnerId === 'btree' && queryId === 'range')  return 'B-tree leaves are sorted, so a range becomes "find start, walk forward".';
  if (winnerId === 'btree' && queryId === 'prefix') return 'A prefix is just a contiguous slice of sorted keys — B-tree is built for it.';
  if (winnerId === 'btree' && queryId === 'exact')  return 'B-tree handles equality too; cheap and ordered.';
  if (winnerId === 'hash'  && queryId === 'exact')  return 'Hash beats B-tree on equality alone: one probe vs log n hops.';
  if (winnerId === 'gin'   && queryId === 'contains') return 'GIN stores a posting list per word — set-intersect the matching docs.';
  if (winnerId === 'gin'   && queryId === 'jsonpath') return 'GIN inverts JSON keys/values, so path lookups become indexed term lookups.';
  if (winnerId === 'gist'  && queryId === 'georad') return 'GIST keeps bounding boxes in an R-tree; whole branches prune away.';
  if (winnerId === 'bloom' && queryId === 'exact')  return 'Bloom only proves *non*-existence cheaply — useful when most lookups miss.';
  return 'This index matches the query shape closely; the others either miss or pay more.';
}

// ────────────────────────────────────────────────────────────
// Tiny per-index visualisations. Each is ~150×80 in SVG units.
// ────────────────────────────────────────────────────────────

const MONO = { fontFamily: 'var(--font-mono)', fontSize: 8 };
const SOFT = { ...MONO, fill: 'var(--ink-soft)' };

function svgFrame(children, caption, highlight) {
  return (
    <svg viewBox="0 0 150 80" width="150" height="80">
      {children}
      <text x={75} y={78} textAnchor="middle" style={SOFT}>{caption}</text>
    </svg>
  );
}

function BTreeMini({ highlight }) {
  const s = highlight ? 'var(--accent)' : 'var(--ink)';
  const f = highlight ? 'var(--accent-soft)' : 'var(--paper)';
  return svgFrame(<>
    <rect x={60} y={6} width={30} height={16} fill={f} stroke={s} strokeWidth={1.5} rx={3} />
    <text x={75} y={18} textAnchor="middle" style={{ ...MONO, fontSize: 9 }}>30|60</text>
    {[20, 75, 130].map((cx, i) => (
      <g key={i}>
        <line x1={75} y1={22} x2={cx} y2={40} stroke={s} strokeWidth={1.2} />
        <rect x={cx - 14} y={40} width={28} height={16} fill={f} stroke={s} strokeWidth={1.5} rx={3} />
        <text x={cx} y={52} textAnchor="middle" style={MONO}>{['10|20', '40|50', '70|90'][i]}</text>
      </g>
    ))}
  </>, 'sorted fan-out');
}

function HashMini({ highlight }) {
  const s = highlight ? 'var(--accent)' : 'var(--ink)';
  const f = highlight ? 'var(--accent-soft)' : 'var(--paper)';
  return svgFrame(<>
    <text x={6} y={15} style={{ ...MONO, fontSize: 9, fill: 'var(--ink-soft)' }}>h(k)</text>
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={i}>
        <rect x={32} y={6 + i * 12} width={26} height={10} fill={f} stroke={s} strokeWidth={1.2} />
        <text x={45} y={14 + i * 12} textAnchor="middle" style={MONO}>{i}</text>
        <line x1={58} y1={11 + i * 12} x2={78} y2={11 + i * 12} stroke={s} strokeWidth={1.2} />
        <rect x={78} y={6 + i * 12} width={62} height={10} fill="var(--paper)" stroke={s} strokeWidth={1.2} />
        <text x={109} y={14 + i * 12} textAnchor="middle" style={MONO}>
          {['key→row', 'key→row', '∅', 'key→row', 'key→row'][i]}
        </text>
      </g>
    ))}
  </>, 'buckets (no order)');
}

function GinMini({ highlight }) {
  const s = highlight ? 'var(--accent)' : 'var(--ink)';
  const f = highlight ? 'var(--accent-soft)' : 'var(--paper)';
  const rows = [['"fox"', '3, 8, 12'], ['"quick"', '3, 5'], ['"lazy"', '8, 9, 12']];
  return svgFrame(<>
    {rows.map(([term, posts], i) => (
      <g key={i}>
        <rect x={4} y={6 + i * 18} width={42} height={14} fill={f} stroke={s} strokeWidth={1.2} rx={2} />
        <text x={25} y={16 + i * 18} textAnchor="middle" style={MONO}>{term}</text>
        <line x1={46} y1={13 + i * 18} x2={62} y2={13 + i * 18} stroke={s} strokeWidth={1.2} />
        <rect x={62} y={6 + i * 18} width={82} height={14} fill="var(--paper)" stroke={s} strokeWidth={1.2} rx={2} />
        <text x={103} y={16 + i * 18} textAnchor="middle" style={MONO}>{posts}</text>
      </g>
    ))}
  </>, 'term → posting list');
}

function GistMini({ highlight }) {
  const s = highlight ? 'var(--accent)' : 'var(--ink)';
  const f = highlight ? 'var(--accent-soft)' : 'transparent';
  const pts = [[28, 26], [52, 32], [92, 22], [124, 26], [34, 52], [58, 54]];
  return svgFrame(<>
    <rect x={8} y={8} width={134} height={52} fill={f} stroke={s} strokeWidth={1.8} rx={3} />
    {[[14, 14, 56, 26], [76, 14, 60, 20], [20, 40, 50, 18]].map(([x, y, w, h], i) => (
      <rect key={i} x={x} y={y} width={w} height={h} fill="var(--paper)" stroke={s} strokeWidth={1.2} strokeDasharray="3 2" />
    ))}
    {pts.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={2} fill="var(--ink)" />)}
  </>, 'bounding boxes (R-tree)');
}

function BloomMini({ highlight }) {
  const s = highlight ? 'var(--accent)' : 'var(--ink)';
  const bits = [0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0];
  return (
    <svg viewBox="0 0 150 80" width="150" height="80">
      <text x={75} y={18} textAnchor="middle" style={{ ...MONO, fontSize: 9 }}>h1(k), h2(k), h3(k) → bits</text>
      {bits.map((b, i) => (
        <rect key={i} x={5 + i * 7} y={26} width={6} height={16}
          fill={b ? (highlight ? 'var(--accent)' : 'var(--ink)') : 'var(--paper)'} stroke={s} strokeWidth={1} />
      ))}
      <text x={75} y={58} textAnchor="middle" style={SOFT}>all 1s? "maybe present"</text>
      <text x={75} y={70} textAnchor="middle" style={SOFT}>any 0?  "definitely absent"</text>
    </svg>
  );
}

const MINIS = {
  btree: BTreeMini,
  hash:  HashMini,
  gin:   GinMini,
  gist:  GistMini,
  bloom: BloomMini,
};

// ────────────────────────────────────────────────────────────

function Radio({ name, value, current, onChange, children, disabled }) {
  const id = `${name}-${value}`;
  return (
    <>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={current === value}
        onChange={() => onChange(value)}
        disabled={disabled}
      />
      <label htmlFor={id} style={disabled ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}>
        {children}
      </label>
    </>
  );
}

export default function IndexTypesWidget() {
  const [dataId, setDataId] = useState('string');
  const [queryId, setQueryId] = useState('prefix');

  // If the chosen query no longer fits the chosen data, snap to the first
  // legal one — this keeps the comparison live and never nonsensical.
  const legalQueries = useMemo(
    () => Object.entries(QUERY_TYPES).filter(([, q]) => q.forData.includes(dataId)),
    [dataId],
  );
  const effectiveQueryId = legalQueries.some(([k]) => k === queryId) ? queryId : legalQueries[0][0];

  function pickData(d) {
    setDataId(d);
    const stillLegal = QUERY_TYPES[queryId]?.forData.includes(d);
    if (!stillLegal) {
      const first = Object.entries(QUERY_TYPES).find(([, q]) => q.forData.includes(d));
      if (first) setQueryId(first[0]);
    }
  }

  const evals = useMemo(
    () => INDEX_TYPES.map((id) => ({ id, ...evaluate(id, dataId, effectiveQueryId) })),
    [dataId, effectiveQueryId],
  );
  const winner = useMemo(() => pickOptimal(dataId, effectiveQueryId), [dataId, effectiveQueryId]);
  const why = whyWinner(dataId, effectiveQueryId, winner?.id);

  return (
    <div className="widget">
      <div className="widget-title">Index types — pick the right tool for the query</div>
      <div className="widget-hint">
        Indexes are specialists. Change the data shape and the query shape; the comparison and the
        OPTIMAL badge update to show which structure was actually built for that combination.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        <div className="controls" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
            Data type
          </span>
          <div className="pill-group">
            {Object.entries(DATA_TYPES).map(([k, v]) => (
              <Radio key={k} name="data" value={k} current={dataId} onChange={pickData}>
                {v.label}
              </Radio>
            ))}
          </div>
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
            sample: {DATA_TYPES[dataId].sample}
          </code>
        </div>

        <div className="controls" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
            Query shape
          </span>
          <div className="pill-group">
            {Object.entries(QUERY_TYPES).map(([k, q]) => {
              const allowed = q.forData.includes(dataId);
              return (
                <Radio key={k} name="query" value={k} current={effectiveQueryId} onChange={setQueryId} disabled={!allowed}>
                  {q.label}
                </Radio>
              );
            })}
          </div>
        </div>
      </div>

      <div className="widget-stage" style={{ padding: '0.9rem', marginTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
          {evals.map((e) => {
            const isWinner = winner && winner.id === e.id;
            const Mini = MINIS[e.id];
            return (
              <motion.div
                key={e.id}
                animate={{
                  borderColor: isWinner ? 'var(--accent)' : (e.supported ? 'var(--ink)' : 'var(--ink-faint)'),
                  backgroundColor: isWinner ? 'var(--accent-soft)' : 'var(--paper)',
                }}
                transition={{ duration: 0.18 }}
                style={{
                  border: '2px solid var(--ink)',
                  borderRadius: 'var(--radius)',
                  padding: '0.7rem',
                  position: 'relative',
                  opacity: e.supported ? 1 : 0.6,
                  boxShadow: isWinner ? '3px 3px 0 var(--ink)' : 'none',
                }}
              >
                {isWinner && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -10,
                      right: 10,
                      background: 'var(--accent)',
                      color: 'white',
                      border: '2px solid var(--ink)',
                      borderRadius: 3,
                      padding: '0.1em 0.5em',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.12em',
                    }}
                  >
                    OPTIMAL
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{INDEX_META[e.id].label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                    {INDEX_META[e.id].tag}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.3rem' }}>
                  <Mini highlight={isWinner} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.15rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>supports:</span>
                  <span style={{ fontWeight: 600, color: e.supported ? '#2a8a3e' : 'var(--accent)' }}>
                    {e.supported ? 'yes' : 'no'}
                  </span>
                  <span style={{ color: 'var(--ink-soft)' }}>perf:</span>
                  <span>{e.big}</span>
                  <span style={{ color: 'var(--ink-soft)' }}>storage:</span>
                  <span>{STORAGE[e.id]}</span>
                </div>

                <div style={{ marginTop: '0.4rem', fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--ink-soft)', lineHeight: 1.35 }}>
                  {e.why}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="metrics">
        <div className="metric accent">
          <div className="label">Optimal index</div>
          <div className="value" style={{ fontSize: '1.3rem' }}>
            {winner ? INDEX_META[winner.id].label : 'none'}
          </div>
        </div>
        <div className="metric">
          <div className="label">Query cost</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>{winner ? winner.big : 'O(n) scan'}</div>
        </div>
        <div className="metric">
          <div className="label">Storage</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>{winner ? STORAGE[winner.id] : '—'}</div>
        </div>
      </div>

      <div className="callout">
        <strong>Why {winner ? INDEX_META[winner.id].label : 'no index'} wins.</strong> {why}
      </div>
    </div>
  );
}
