// Storage widget: shows the same table laid out as row pages or column
// pages, then highlights which cells get read for different queries.

const COLUMNS = ['id', 'name', 'city', 'age', 'price'];
const ROWS = [
  [1, 'Aiko',    'Tokyo',   29,  120],
  [2, 'Mateo',   'Lima',    41,   80],
  [3, 'Priya',   'Mumbai',  34,  240],
  [4, 'Kenji',   'Osaka',   22,   60],
  [5, 'Lena',    'Berlin',  37,  150],
  [6, 'Diego',   'Bogota',  28,  200],
  [7, 'Yuna',    'Seoul',   45,  310],
  [8, 'Omar',    'Cairo',   31,   90],
];

const QUERIES = [
  {
    id: 'point',
    label: 'SELECT * WHERE id = 4',
    explain: 'Fetch every column of a single row. Row store reads ~1 page; column store reads from 5 different pages.',
    cells: (col, rowIdx) => ROWS[rowIdx][0] === 4,
  },
  {
    id: 'agg',
    label: 'SELECT SUM(price)',
    explain: 'Read one column across every row. Column store reads 1 page; row store has to read all 8 pages and skip 80% of each.',
    cells: (col, rowIdx) => col === 'price',
  },
  {
    id: 'narrow',
    label: 'SELECT name, city FROM users',
    explain: 'Two columns, all rows. Column store reads 2 pages; row store still has to read all 8 pages.',
    cells: (col, rowIdx) => col === 'name' || col === 'city',
  },
];

export function initStorageWidget(root) {
  let layout = 'row';
  let queryId = 'point';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Pages on Disk</div>
      <p class="widget-hint">Toggle the layout and the query. Highlighted cells are the bytes the DB <em>actually wants</em>. Hatched cells live on the same page so they get read too — wasted I/O.</p>

      <div class="controls">
        <div class="pill-group" role="radiogroup" aria-label="Storage layout">
          <input type="radio" name="layout" id="layout-row" value="row" checked>
          <label for="layout-row">Row Store</label>
          <input type="radio" name="layout" id="layout-col" value="col">
          <label for="layout-col">Column Store</label>
        </div>

        <select class="field" id="query-select" aria-label="Query">
          ${QUERIES.map((q) => `<option value="${q.id}">${q.label}</option>`).join('')}
        </select>
      </div>

      <div class="widget-stage" id="stage"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Pages Read</div><div class="value" id="m-pages">0</div></div>
        <div class="metric"><div class="label">Cells Useful</div><div class="value" id="m-useful">0</div></div>
        <div class="metric"><div class="label">Cells Wasted</div><div class="value" id="m-wasted">0</div></div>
        <div class="metric accent"><div class="label">Efficiency</div><div class="value" id="m-eff">0%</div></div>
      </div>

      <div class="callout" id="explain"></div>
    </div>
  `;

  const stage = root.querySelector('#stage');
  const explainEl = root.querySelector('#explain');
  const mPages = root.querySelector('#m-pages');
  const mUseful = root.querySelector('#m-useful');
  const mWasted = root.querySelector('#m-wasted');
  const mEff = root.querySelector('#m-eff');

  root.querySelectorAll('input[name=layout]').forEach((r) =>
    r.addEventListener('change', (e) => { layout = e.target.value; render(); })
  );
  root.querySelector('#query-select').addEventListener('change', (e) => {
    queryId = e.target.value;
    render();
  });

  function render() {
    const query = QUERIES.find((q) => q.id === queryId);
    explainEl.textContent = query.explain;

    if (layout === 'row') {
      stage.innerHTML = renderRowStore(query);
    } else {
      stage.innerHTML = renderColStore(query);
    }
    updateMetrics(query);
  }

  function renderRowStore(query) {
    // each row is its own page. A page is "read" if any wanted cell lives in it.
    const pageDivs = ROWS.map((row, rIdx) => {
      const pageWanted = COLUMNS.some((col, cIdx) => query.cells(col, rIdx));
      const cells = COLUMNS.map((col, cIdx) => {
        const wanted = query.cells(col, rIdx);
        const cls = !pageWanted ? 'skip' : wanted ? 'cell read' : 'cell skip';
        return `<span class="${cls}" data-col="${col}">${row[cIdx]}</span>`;
      }).join('');
      const pageCls = pageWanted ? 'page page-read' : 'page page-cold';
      return `
        <div class="${pageCls}">
          <div class="page-label">Page ${rIdx + 1}</div>
          <div class="page-cells">${cells}</div>
        </div>
      `;
    }).join('');
    return `<div class="store-row">${pageDivs}</div>` + pageStyles();
  }

  function renderColStore(query) {
    // each column is a page. A page is read if any wanted cell lives in it.
    const pageDivs = COLUMNS.map((col, cIdx) => {
      const pageWanted = ROWS.some((row, rIdx) => query.cells(col, rIdx));
      const cells = ROWS.map((row, rIdx) => {
        const wanted = query.cells(col, rIdx);
        const cls = !pageWanted ? 'skip' : wanted ? 'cell read' : 'cell skip';
        return `<span class="${cls}">${row[cIdx]}</span>`;
      }).join('');
      const pageCls = pageWanted ? 'page page-read' : 'page page-cold';
      return `
        <div class="${pageCls}">
          <div class="page-label">Page · ${col}</div>
          <div class="page-cells col">${cells}</div>
        </div>
      `;
    }).join('');
    return `<div class="store-col">${pageDivs}</div>` + pageStyles();
  }

  function updateMetrics(query) {
    let pages = 0;
    let useful = 0;
    let wasted = 0;
    if (layout === 'row') {
      ROWS.forEach((row, rIdx) => {
        const pageWanted = COLUMNS.some((col) => query.cells(col, rIdx));
        if (pageWanted) {
          pages += 1;
          COLUMNS.forEach((col) => {
            if (query.cells(col, rIdx)) useful += 1;
            else wasted += 1;
          });
        }
      });
    } else {
      COLUMNS.forEach((col) => {
        const pageWanted = ROWS.some((row, rIdx) => query.cells(col, rIdx));
        if (pageWanted) {
          pages += 1;
          ROWS.forEach((row, rIdx) => {
            if (query.cells(col, rIdx)) useful += 1;
            else wasted += 1;
          });
        }
      });
    }
    const total = useful + wasted;
    const eff = total === 0 ? 0 : Math.round((useful / total) * 100);
    mPages.textContent = pages;
    mUseful.textContent = useful;
    mWasted.textContent = wasted;
    mEff.textContent = eff + '%';
  }

  function pageStyles() {
    return `<style>
      .store-row { display: flex; flex-direction: column; gap: 0.4rem; }
      .store-col { display: flex; flex-direction: row; gap: 0.6rem; flex-wrap: wrap; justify-content: center; }
      .page { border: 2px solid var(--ink); background: var(--paper); padding: 0.4rem; border-radius: var(--radius); }
      .page-read { box-shadow: 3px 3px 0 var(--ink); }
      .page-cold { opacity: 0.5; background: repeating-linear-gradient(45deg, transparent 0 4px, var(--hatch) 4px 5px), var(--paper); }
      .page-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); margin-bottom: 0.3rem; letter-spacing: 0.08em; text-transform: uppercase; }
      .page-cells { display: flex; gap: 0; flex-wrap: wrap; }
      .page-cells.col { flex-direction: column; }
    </style>`;
  }

  render();
}
