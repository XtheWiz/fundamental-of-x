import { useMemo, useState } from 'react';

// The optimiser's job, made tangible. Three queries, four indexes, two
// table-size sliders — every change re-evaluates the candidate plans and
// the lowest-cost one wins. The "why" caption explains the decision so
// the learner sees how indexes and cardinality drive plan choice.

const QUERIES = {
  lookup: {
    label: 'Point lookup',
    sql: "SELECT * FROM users WHERE email = ?",
    // selectivity = ~1 row out of users
  },
  join: {
    label: 'Filtered join',
    sql: "SELECT u.name, o.total FROM users u JOIN orders o ON o.user_id = u.id WHERE u.country = 'NL'",
    // ~3% of users live in NL; each user has ~ orders/users orders
  },
  range: {
    label: 'Range scan',
    sql: "SELECT * FROM orders WHERE created_at > ?",
    // ~10% of orders match the range
  },
};

const NL_SELECTIVITY = 0.03;
const RANGE_SELECTIVITY = 0.10;

// Log-scale slider helpers — 1K to 10M, exposed as 0..100 to the input.
function sliderToRows(s) {
  const min = Math.log10(1000), max = Math.log10(10_000_000);
  return Math.round(Math.pow(10, min + (s / 100) * (max - min)));
}
function rowsToSlider(r) {
  const min = Math.log10(1000), max = Math.log10(10_000_000);
  return ((Math.log10(r) - min) / (max - min)) * 100;
}
function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'K';
  return String(Math.round(n));
}
function fmtCost(c) {
  if (c >= 1e6) return (c / 1e6).toFixed(2) + 'M';
  if (c >= 1e3) return (c / 1e3).toFixed(1) + 'K';
  return c.toFixed(1);
}

// Cost model — deliberately simple, monotonic in the right inputs.
const SEQ_COST_PER_ROW = 1.0;
const IDX_EQ_COEF = 5;        // log2(N) * 5 for an equality probe
const IDX_RANGE_COEF = 1.5;   // per matched row, plus log2 to find start
const HASH_BUILD_COEF = 1.2;  // build side cost multiplier

function seqScan(rows) {
  return rows * SEQ_COST_PER_ROW;
}
function indexScanEq(rows) {
  return Math.log2(Math.max(2, rows)) * IDX_EQ_COEF;
}
function indexScanRange(rows, sel) {
  return rows * sel * IDX_RANGE_COEF + Math.log2(Math.max(2, rows)) * IDX_EQ_COEF;
}

// Build candidate plans for the current query/index/cardinality state.
// Returns an array of { id, label, cost, tree, why } — the chosen plan
// is the cheapest one; the why explains the decision relative to runners-up.
function buildPlans(queryId, indexes, users, orders) {
  if (queryId === 'lookup') {
    const candidates = [
      {
        id: 'seq',
        label: 'SeqScan users',
        cost: seqScan(users),
        tree: [{ op: 'SeqScan', target: 'users', detail: `filter: email = ?` }],
      },
    ];
    if (indexes.userEmail) {
      candidates.push({
        id: 'idx',
        label: 'IndexScan users.email_idx',
        cost: indexScanEq(users),
        tree: [{ op: 'IndexScan', target: 'users.email_idx', detail: 'email = ?' }],
      });
    }
    return candidates;
  }

  if (queryId === 'range') {
    const candidates = [
      {
        id: 'seq',
        label: 'SeqScan orders + Filter',
        cost: seqScan(orders),
        tree: [{ op: 'SeqScan', target: 'orders', detail: 'filter: created_at > ?' }],
      },
    ];
    if (indexes.orderCreated) {
      candidates.push({
        id: 'idx',
        label: 'IndexScan orders.created_at_idx',
        cost: indexScanRange(orders, RANGE_SELECTIVITY),
        tree: [{ op: 'IndexScan', target: 'orders.created_at_idx', detail: `range, ~${Math.round(RANGE_SELECTIVITY * 100)}% selective` }],
      });
    }
    return candidates;
  }

  // join: outer = filtered users (NL), inner = orders (probed by user_id)
  const outerRows = indexes.userCountry
    ? indexScanEq(users) / IDX_EQ_COEF * NL_SELECTIVITY * users + indexScanEq(users)
    : seqScan(users); // cost to *produce* the outer
  const outerCard = users * NL_SELECTIVITY; // estimated outer row count
  const outerProduceCost = indexes.userCountry
    ? users * NL_SELECTIVITY * 1.2 + Math.log2(Math.max(2, users)) * IDX_EQ_COEF
    : seqScan(users);

  const candidates = [];

  // Nested loop: outer card × per-inner-probe cost
  const innerProbeCost = indexes.orderUserId
    ? indexScanEq(orders)
    : seqScan(orders);
  candidates.push({
    id: 'nl',
    label: 'NestedLoop',
    cost: outerProduceCost + outerCard * innerProbeCost,
    tree: [
      { op: 'NestedLoop', target: '', detail: `outer ~${fmt(outerCard)} rows` },
      { op: indexes.userCountry ? 'IndexScan' : 'SeqScan', target: indexes.userCountry ? 'users.country_idx' : 'users', detail: "country = 'NL'", indent: 1 },
      { op: indexes.orderUserId ? 'IndexScan' : 'SeqScan', target: indexes.orderUserId ? 'orders.user_id_idx' : 'orders', detail: 'user_id = u.id', indent: 1 },
    ],
  });

  // Hash join: scan both sides once, build hash on the smaller side.
  // Build side is the filtered users (NL) — far smaller than orders.
  const hashCost = outerProduceCost + seqScan(orders) + outerCard * HASH_BUILD_COEF;
  candidates.push({
    id: 'hash',
    label: 'HashJoin',
    cost: hashCost,
    tree: [
      { op: 'HashJoin', target: '', detail: `build: users[NL] ~${fmt(outerCard)}` },
      { op: indexes.userCountry ? 'IndexScan' : 'SeqScan', target: indexes.userCountry ? 'users.country_idx' : 'users', detail: "country = 'NL' (build)", indent: 1 },
      { op: 'SeqScan', target: 'orders', detail: 'probe', indent: 1 },
    ],
  });

  return candidates;
}

// Caption that explains why the chosen plan beat the rest. Keep these
// keyed off the actual decision factors so they update in lockstep.
function explainChoice(queryId, chosen, all, indexes, users, orders) {
  if (queryId === 'lookup') {
    if (chosen.id === 'idx') {
      return `Index on users.email lets the optimiser jump straight to the row — O(log N) vs O(N) for a full scan of ${fmt(users)} rows.`;
    }
    return `No index on users.email — the only option is a full table scan of all ${fmt(users)} rows. Toggle the index on to see the optimiser switch.`;
  }
  if (queryId === 'range') {
    if (chosen.id === 'idx') {
      return `Index on orders.created_at: only ~${Math.round(RANGE_SELECTIVITY * 100)}% of rows match, so the optimiser walks the index instead of scanning all ${fmt(orders)} rows.`;
    }
    return `No index on orders.created_at — a sequential scan is the only choice. With ${fmt(orders)} rows that's expensive.`;
  }
  // join
  const other = all.find((p) => p.id !== chosen.id);
  if (chosen.id === 'hash') {
    if (!indexes.orderUserId) {
      return `Hash join wins: no index on orders.user_id, so a nested loop would re-scan all ${fmt(orders)} orders for each NL user. Hashing scans each side once.`;
    }
    return `Hash join wins: orders is large (${fmt(orders)} rows), and a single sequential pass beats ${fmt(users * NL_SELECTIVITY)} index probes.`;
  }
  // nested loop
  if (indexes.orderUserId) {
    return `Nested loop wins: outer side is small (~${fmt(users * NL_SELECTIVITY)} NL users) and the orders.user_id index makes each probe cheap.`;
  }
  return `Nested loop wins narrowly — outer side is tiny, so even unindexed inner scans don't dominate yet. Grow the orders table and watch hash join take over.`;
}

function PlanTree({ plan }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.7 }}>
      {plan.tree.map((node, i) => {
        const indent = node.indent || 0;
        return (
          <div key={i} style={{ paddingLeft: indent * 1.4 + 'rem', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--ink-faint)' }}>{indent > 0 ? '└─ ' : ''}</span>
            <span style={{
              fontWeight: 600,
              color: node.op.includes('Index') ? '#2a8a3e' : node.op.includes('Hash') || node.op.includes('Nested') ? '#1c6dd0' : 'var(--ink)',
            }}>{node.op}</span>
            {node.target && <span style={{ color: 'var(--ink)' }}>  {node.target}</span>}
            {node.detail && <span style={{ color: 'var(--ink-soft)' }}>  ({node.detail})</span>}
          </div>
        );
      })}
    </div>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <code>{label}</code>
    </label>
  );
}

function Slider({ label, rows, onRowsChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
        <span>{label}</span>
        <strong style={{ color: 'var(--accent)' }}>{fmt(rows)} rows</strong>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={rowsToSlider(rows)}
        onChange={(e) => onRowsChange(sliderToRows(+e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

export default function QueryWidget() {
  const [queryId, setQueryId] = useState('lookup');
  const [indexes, setIndexes] = useState({
    userEmail: false,
    userCountry: false,
    orderUserId: false,
    orderCreated: false,
  });
  const [users, setUsers] = useState(100_000);
  const [orders, setOrders] = useState(1_000_000);

  const { chosen, candidates, why } = useMemo(() => {
    const plans = buildPlans(queryId, indexes, users, orders);
    const cheapest = plans.reduce((best, p) => (p.cost < best.cost ? p : best), plans[0]);
    return {
      chosen: cheapest,
      candidates: plans,
      why: explainChoice(queryId, cheapest, plans, indexes, users, orders),
    };
  }, [queryId, indexes, users, orders]);

  const toggle = (k) => (v) => setIndexes((s) => ({ ...s, [k]: v }));

  return (
    <div className="widget">
      <div className="widget-title">Query optimiser — why this plan?</div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        {Object.entries(QUERIES).map(([k, q]) => (
          <button
            key={k}
            className={`btn ${queryId === k ? 'btn-accent' : ''}`}
            onClick={() => setQueryId(k)}
          >
            {q.label}
          </button>
        ))}
      </div>

      <pre style={{
        background: 'var(--paper-deep)',
        border: '1.5px solid var(--ink)',
        borderRadius: 'var(--radius)',
        padding: '0.7rem 1rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.9rem',
        margin: '0.6rem 0',
        whiteSpace: 'pre-wrap',
      }}>
        {QUERIES[queryId].sql}
      </pre>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(280px, 1.4fr)', gap: '1rem', alignItems: 'start' }}>
        {/* LEFT: knobs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
              Indexes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <Checkbox checked={indexes.userEmail} onChange={toggle('userEmail')} label="users.email" />
              <Checkbox checked={indexes.userCountry} onChange={toggle('userCountry')} label="users.country" />
              <Checkbox checked={indexes.orderUserId} onChange={toggle('orderUserId')} label="orders.user_id" />
              <Checkbox checked={indexes.orderCreated} onChange={toggle('orderCreated')} label="orders.created_at" />
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
              Table sizes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <Slider label="users" rows={users} onRowsChange={setUsers} />
              <Slider label="orders" rows={orders} onRowsChange={setOrders} />
            </div>
          </div>
        </div>

        {/* RIGHT: live plan + cost */}
        <div className="widget-stage" style={{ padding: '0.9rem 1rem', minHeight: 220 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.3rem' }}>
            Chosen plan
          </div>
          <PlanTree plan={chosen} />

          <div className="metrics" style={{ margin: '0.8rem 0 0.4rem' }}>
            <div className="metric accent">
              <div className="label">Est. cost</div>
              <div className="value">{fmtCost(chosen.cost)}</div>
            </div>
            <div className="metric">
              <div className="label">Operator</div>
              <div className="value" style={{ fontSize: '1.1rem' }}>{chosen.label.split(' ')[0]}</div>
            </div>
          </div>

          {candidates.length > 1 && (
            <div style={{ marginTop: '0.6rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.2rem' }}>
                Candidates considered
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.id} style={{ background: c.id === chosen.id ? 'var(--accent-soft)' : 'transparent' }}>
                      <td style={{ padding: '0.25em 0.5em', borderBottom: '1px solid var(--ink-faint)', width: 30 }}>
                        {c.id === chosen.id ? '✓' : ' '}
                      </td>
                      <td style={{ padding: '0.25em 0.5em', borderBottom: '1px solid var(--ink-faint)' }}>{c.label}</td>
                      <td style={{ padding: '0.25em 0.5em', borderBottom: '1px solid var(--ink-faint)', textAlign: 'right', fontWeight: c.id === chosen.id ? 600 : 400 }}>
                        {fmtCost(c.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="callout">
        <strong>Why this plan.</strong> {why}
      </div>
    </div>
  );
}
