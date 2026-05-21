// Sharding widget: 60 rows of fake users get distributed across 4 shards
// based on the chosen strategy. The user can also run a query and see
// which shards get touched (fan-out cost).

const NUM_USERS = 60;
const NUM_SHARDS = 4;
const SHARD_NAMES = ['A', 'B', 'C', 'D'];
const REGIONS = ['Tokyo', 'Berlin', 'Lima', 'Mumbai'];
// skewed population — Tokyo dominates (real-world: hot regions)
const REGION_WEIGHTS = [0.45, 0.20, 0.15, 0.20];

const USERS = generateUsers(NUM_USERS);

function generateUsers(n) {
  const arr = [];
  for (let i = 1; i <= n; i++) {
    const r = pickRegion(i);
    arr.push({ id: i, region: r });
  }
  return arr;
}

function pickRegion(seed) {
  // deterministic per-id pseudo-random
  const r = ((seed * 9301 + 49297) % 233280) / 233280;
  let cum = 0;
  for (let i = 0; i < REGIONS.length; i++) {
    cum += REGION_WEIGHTS[i];
    if (r < cum) return REGIONS[i];
  }
  return REGIONS[REGIONS.length - 1];
}

function hash(n) {
  // small mixing — enough variance to be visibly even
  let x = n * 2654435761;
  x = (x ^ (x >>> 16)) >>> 0;
  return x;
}

const STRATEGIES = {
  hash: {
    label: 'Hash',
    explain: 'shard = hash(user_id) % 4. Evenly spread, but a range query like “users 10..20” hits every shard.',
    assign: (u) => hash(u.id) % NUM_SHARDS,
  },
  range: {
    label: 'Range',
    explain: 'ids 1..15 → A, 16..30 → B, 31..45 → C, 46..60 → D. Range scans hit one shard, but if "new users" dominate, the last shard is hot.',
    assign: (u) => Math.min(Math.floor((u.id - 1) / (NUM_USERS / NUM_SHARDS)), NUM_SHARDS - 1),
  },
  geo: {
    label: 'Geo',
    explain: 'Tokyo→A, Berlin→B, Lima→C, Mumbai→D. Locality wins, but skewed populations (45% Tokyo) make shard A hot.',
    assign: (u) => REGIONS.indexOf(u.region),
  },
};

const QUERIES = {
  point: { label: 'WHERE user_id = 23', hits: (u, s) => u.id === 23 ? s : null },
  range: { label: 'WHERE user_id BETWEEN 10 AND 30', hits: (u, s) => (u.id >= 10 && u.id <= 30) ? s : null },
  geoLookup: { label: 'WHERE region = "Tokyo"', hits: (u, s) => u.region === 'Tokyo' ? s : null },
  scan: { label: 'COUNT(*)', hits: (u, s) => s },
};

export function initShardingWidget(root) {
  let strategy = 'hash';
  let queryId = 'point';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Shard Distribution</div>
      <p class="widget-hint">Each circle is one user. Each box is one shard machine. Pick a strategy and watch users cluster differently.</p>

      <div class="controls">
        <div class="pill-group">
          ${Object.entries(STRATEGIES).map(([id, s], i) => `
            <input type="radio" name="strategy" id="strat-${id}" value="${id}" ${i === 0 ? 'checked' : ''}>
            <label for="strat-${id}">${s.label}</label>
          `).join('')}
        </div>

        <label>Query:</label>
        <select class="field" id="query-select">
          ${Object.entries(QUERIES).map(([id, q]) => `<option value="${id}">${q.label}</option>`).join('')}
        </select>
        <button class="btn btn-accent" id="run-query">Run Query</button>
      </div>

      <div class="widget-stage" id="stage"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Max load</div><div class="value" id="m-max">0</div></div>
        <div class="metric"><div class="label">Min load</div><div class="value" id="m-min">0</div></div>
        <div class="metric"><div class="label">Skew (max/min)</div><div class="value" id="m-skew">—</div></div>
        <div class="metric accent"><div class="label">Shards hit</div><div class="value" id="m-hit">0</div></div>
      </div>

      <div class="callout" id="explain"></div>
    </div>
  `;

  const stage = root.querySelector('#stage');
  const explainEl = root.querySelector('#explain');
  const mMax = root.querySelector('#m-max');
  const mMin = root.querySelector('#m-min');
  const mSkew = root.querySelector('#m-skew');
  const mHit = root.querySelector('#m-hit');

  let highlighted = new Set(); // shard indices touched by query
  let highlightedUsers = new Set();

  root.querySelectorAll('input[name=strategy]').forEach((r) =>
    r.addEventListener('change', (e) => {
      strategy = e.target.value;
      highlighted = new Set();
      highlightedUsers = new Set();
      render();
    })
  );
  root.querySelector('#query-select').addEventListener('change', (e) => {
    queryId = e.target.value;
  });
  root.querySelector('#run-query').addEventListener('click', () => {
    const q = QUERIES[queryId];
    highlighted = new Set();
    highlightedUsers = new Set();
    USERS.forEach((u) => {
      const s = STRATEGIES[strategy].assign(u);
      if (q.hits(u, s) !== null) {
        highlighted.add(s);
        highlightedUsers.add(u.id);
      }
    });
    render();
  });

  function render() {
    explainEl.textContent = STRATEGIES[strategy].explain;
    const buckets = Array.from({ length: NUM_SHARDS }, () => []);
    USERS.forEach((u) => {
      buckets[STRATEGIES[strategy].assign(u)].push(u);
    });

    const sizes = buckets.map((b) => b.length);
    const max = Math.max(...sizes);
    const min = Math.min(...sizes);
    mMax.textContent = max;
    mMin.textContent = min;
    mSkew.textContent = min === 0 ? '∞' : (max / min).toFixed(2) + '×';
    mHit.textContent = highlighted.size > 0 ? `${highlighted.size}/${NUM_SHARDS}` : '—';

    stage.innerHTML = renderShards(buckets);
  }

  function renderShards(buckets) {
    const shardW = 180;
    const shardH = 220;
    const totalW = (shardW + 20) * NUM_SHARDS;
    let svg = `<svg viewBox="0 0 ${totalW} ${shardH + 50}" width="${totalW}" height="${shardH + 50}">`;
    svg += `<style>
      .shard-frame { fill: var(--paper); stroke: var(--ink); stroke-width: 2.5; }
      .shard-frame.hot { stroke: var(--accent); stroke-width: 3; }
      .shard-label { font-family: var(--font-display); font-size: 18px; fill: var(--ink); letter-spacing: 1px; }
      .shard-count { font-family: var(--font-mono); font-size: 11px; fill: var(--ink-soft); }
      .user-dot { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1; }
      .user-dot.hit { fill: var(--accent); stroke: var(--ink); }
    </style>`;
    buckets.forEach((users, i) => {
      const x = i * (shardW + 20);
      const hot = highlighted.has(i);
      svg += `
        <rect class="shard-frame ${hot ? 'hot' : ''}" x="${x}" y="36" width="${shardW}" height="${shardH}" rx="6"/>
        <text class="shard-label" x="${x + 12}" y="28">Shard ${SHARD_NAMES[i]}</text>
        <text class="shard-count" x="${x + shardW - 12}" y="28" text-anchor="end">${users.length} rows</text>
      `;
      // arrange dots in a grid inside the shard
      const cols = 6;
      users.forEach((u, idx) => {
        const cx = x + 18 + (idx % cols) * 26;
        const cy = 60 + Math.floor(idx / cols) * 26;
        const hit = highlightedUsers.has(u.id);
        svg += `<circle class="user-dot ${hit ? 'hit' : ''}" cx="${cx}" cy="${cy}" r="9"><title>id=${u.id} · ${u.region}</title></circle>`;
        svg += `<text x="${cx}" y="${cy + 3}" text-anchor="middle" style="font-family: var(--font-mono); font-size: 9px; fill: var(--ink);">${u.id}</text>`;
      });
    });
    svg += `</svg>`;
    return svg;
  }

  render();
}
