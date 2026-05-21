// Memory allocator widget: a 32-cell heap. User allocates chunks of
// various sizes (first-fit or best-fit) and frees them. Visualize
// fragmentation and track the failed-allocation threshold.

const HEAP_SIZE = 32;
const COLORS = ['#cfe5ff', '#c8f0c8', '#ffe9b3', '#f7c8c8', '#e6d6ff', '#ffd9b3', '#b3e6cc'];

export function initMemoryWidget(root) {
  const state = {
    heap: new Array(HEAP_SIZE).fill(null),  // null or chunkId
    chunks: [],   // [{id, size, color}]
    nextId: 1,
    strategy: 'first',  // first | best
    log: [],
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">${HEAP_SIZE}-cell heap (1 cell = 1 KB, say)</div>

      <div class="controls">
        <label>Strategy:</label>
        <div class="pill-group">
          <input type="radio" name="mm-s" id="mm-first" value="first" checked>
          <label for="mm-first">First fit</label>
          <input type="radio" name="mm-s" id="mm-best" value="best">
          <label for="mm-best">Best fit</label>
        </div>
        <label>malloc(</label>
        <select class="field" id="mm-size">
          <option value="2">2</option>
          <option value="4" selected>4</option>
          <option value="6">6</option>
          <option value="8">8</option>
          <option value="12">12</option>
        </select>
        <label>)</label>
        <button class="btn btn-accent" id="mm-alloc">Allocate</button>
        <button class="btn" id="mm-burst">Burst: 8× malloc(2) + free every other</button>
        <button class="btn btn-ghost" id="mm-reset">Reset</button>
      </div>

      <div class="widget-stage" id="mm-stage" style="min-height: 220px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Used</div><div class="value" id="m-used">0</div></div>
        <div class="metric"><div class="label">Free total</div><div class="value" id="m-free">${HEAP_SIZE}</div></div>
        <div class="metric"><div class="label">Largest free</div><div class="value" id="m-lf">${HEAP_SIZE}</div></div>
        <div class="metric accent"><div class="label">Fragmentation</div><div class="value" id="m-frag">0%</div></div>
      </div>

      <div class="log" id="mm-log"></div>
    </div>
  `;

  const stage = root.querySelector('#mm-stage');
  const logEl = root.querySelector('#mm-log');

  root.querySelectorAll('input[name=mm-s]').forEach((r) =>
    r.addEventListener('change', (e) => { state.strategy = e.target.value; })
  );
  root.querySelector('#mm-alloc').addEventListener('click', () => {
    const size = Number(root.querySelector('#mm-size').value);
    allocate(size);
  });
  root.querySelector('#mm-burst').addEventListener('click', async () => {
    const ids = [];
    for (let i = 0; i < 8; i++) {
      const id = allocate(2);
      if (id) ids.push(id);
      await wait(80);
    }
    for (let i = 0; i < ids.length; i += 2) {
      free(ids[i]);
      await wait(80);
    }
  });
  root.querySelector('#mm-reset').addEventListener('click', () => {
    state.heap = new Array(HEAP_SIZE).fill(null);
    state.chunks = [];
    state.nextId = 1;
    state.log = [];
    logEl.innerHTML = '';
    render();
  });

  function allocate(size) {
    // Find a contiguous run of `size` free cells using chosen strategy
    const runs = freeRuns();
    let chosen = null;
    if (state.strategy === 'first') {
      chosen = runs.find((r) => r.length >= size);
    } else {
      const candidates = runs.filter((r) => r.length >= size);
      candidates.sort((a, b) => a.length - b.length);
      chosen = candidates[0];
    }
    if (!chosen) {
      addLog('err', `malloc(${size}): FAILED — fragmentation. Largest free run is only ${Math.max(0, ...runs.map((r) => r.length))} cells.`);
      render();
      return null;
    }
    const id = state.nextId++;
    const color = COLORS[(id - 1) % COLORS.length];
    state.chunks.push({ id, size, color });
    for (let i = chosen.start; i < chosen.start + size; i++) state.heap[i] = id;
    addLog('ok', `malloc(${size}) → chunk #${id} at offset ${chosen.start}`);
    render();
    return id;
  }

  function free(id) {
    let count = 0;
    for (let i = 0; i < state.heap.length; i++) {
      if (state.heap[i] === id) { state.heap[i] = null; count++; }
    }
    if (count) addLog('info', `free(#${id}) — ${count} cells returned`);
    render();
  }

  function freeRuns() {
    const runs = [];
    let i = 0;
    while (i < HEAP_SIZE) {
      if (state.heap[i] === null) {
        let j = i;
        while (j < HEAP_SIZE && state.heap[j] === null) j++;
        runs.push({ start: i, length: j - i });
        i = j;
      } else i++;
    }
    return runs;
  }

  function render() {
    let cellsHtml = '';
    for (let i = 0; i < HEAP_SIZE; i++) {
      const id = state.heap[i];
      const chunk = id ? state.chunks.find((c) => c.id === id) : null;
      const isStart = id && (i === 0 || state.heap[i - 1] !== id);
      cellsHtml += `<div class="mm-cell ${id ? 'used' : 'free'}" data-id="${id || ''}" style="${chunk ? `background: ${chunk.color};` : ''}">
        ${isStart ? `<span class="mm-cell-label">#${id}</span>` : ''}
      </div>`;
    }

    // chunk list for clicking-to-free
    const chunksList = state.chunks
      .filter((c) => state.heap.includes(c.id))
      .map((c) => `<button class="mm-chunk-btn" data-free="${c.id}" style="background: ${c.color};">free(#${c.id}) ${c.size}KB</button>`)
      .join('');

    let html = `
      <div class="mm-heap">${cellsHtml}</div>
      <div class="mm-chunks">${chunksList || '<span style="color: var(--ink-faint); font-family: var(--font-mono); font-size: 0.8rem;">no live allocations</span>'}</div>
      <style>
        .mm-heap { display: grid; grid-template-columns: repeat(${HEAP_SIZE}, 1fr); gap: 2px; margin: 0.4rem 0 0.6rem; }
        .mm-cell { height: 36px; border: 1.5px solid var(--ink); border-radius: 2px; position: relative; }
        .mm-cell.free { background: var(--paper); }
        .mm-cell-label { position: absolute; left: 2px; top: 2px; font-family: var(--font-mono); font-size: 9px; }
        .mm-chunks { display: flex; gap: 0.3rem; flex-wrap: wrap; }
        .mm-chunk-btn { font-family: var(--font-mono); font-size: 0.78rem; border: 1.5px solid var(--ink); border-radius: 2px; padding: 0.2em 0.5em; cursor: pointer; }
        .mm-chunk-btn:hover { box-shadow: 2px 2px 0 var(--ink); }
      </style>
    `;
    stage.innerHTML = html;
    stage.querySelectorAll('button[data-free]').forEach((b) =>
      b.addEventListener('click', () => free(Number(b.dataset.free)))
    );

    const used = state.heap.filter((c) => c !== null).length;
    const free_ = HEAP_SIZE - used;
    const runs = freeRuns();
    const lf = runs.length ? Math.max(...runs.map((r) => r.length)) : 0;
    const fragPct = free_ === 0 ? 0 : Math.round((1 - lf / free_) * 100);
    root.querySelector('#m-used').textContent = used;
    root.querySelector('#m-free').textContent = free_;
    root.querySelector('#m-lf').textContent = lf;
    root.querySelector('#m-frag').textContent = fragPct + '%';
  }

  function addLog(level, msg) {
    const d = document.createElement('div');
    d.className = `entry ${level}`;
    d.innerHTML = `<span class="t">${new Date().toLocaleTimeString()}</span>${msg}`;
    logEl.prepend(d);
    while (logEl.children.length > 50) logEl.removeChild(logEl.lastChild);
  }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  render();
}
