// DLQ + retries widget: process a stream where msg-3 always fails.
// User picks max retries + backoff strategy; widget shows main queue,
// DLQ, retry timeline.

const STREAM = [
  { id: 'm1', poison: false },
  { id: 'm2', poison: false },
  { id: 'm3', poison: true },   // always fails
  { id: 'm4', poison: false },
  { id: 'm5', poison: false },
];

export function initDlqWidget(root) {
  let maxRetries = 3;
  let backoff = 'expo';     // 'expo' | 'linear' | 'none'
  const state = {
    delivered: [],     // {id, attempts}
    dlq: [],
    timeline: [],      // [{t, id, attempt, result}]
    running: false,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">5 messages, one is poison</div>

      <div class="controls">
        <label>Max retries:</label>
        <input type="range" min="0" max="6" value="3" id="dl-r">
        <span style="font-family: var(--font-mono);" id="dl-r-val">3</span>
        <label>Backoff:</label>
        <div class="pill-group">
          <input type="radio" name="dl-b" id="dl-expo" value="expo" checked>
          <label for="dl-expo">Exponential</label>
          <input type="radio" name="dl-b" id="dl-lin" value="linear">
          <label for="dl-lin">Linear</label>
          <input type="radio" name="dl-b" id="dl-none" value="none">
          <label for="dl-none">None</label>
        </div>
        <button class="btn btn-accent" id="dl-run">Process stream</button>
        <button class="btn btn-ghost" id="dl-reset">Reset</button>
      </div>

      <div class="widget-stage" id="dl-stage" style="min-height: 320px;"></div>

      <div class="callout" id="dl-explain">Run the stream and see how m3 behaves under your retry policy.</div>
    </div>
  `;

  root.querySelector('#dl-r').addEventListener('input', (e) => {
    maxRetries = Number(e.target.value);
    root.querySelector('#dl-r-val').textContent = maxRetries;
  });
  root.querySelectorAll('input[name=dl-b]').forEach((r) =>
    r.addEventListener('change', (e) => { backoff = e.target.value; })
  );
  root.querySelector('#dl-run').addEventListener('click', run);
  root.querySelector('#dl-reset').addEventListener('click', reset);

  function reset() {
    state.delivered = []; state.dlq = []; state.timeline = [];
    render();
  }

  function backoffMs(attempt) {
    if (backoff === 'none') return 0;
    if (backoff === 'linear') return attempt * 1000;
    return Math.pow(2, attempt - 1) * 1000;  // expo: 1s, 2s, 4s, 8s, ...
  }

  async function run() {
    if (state.running) return;
    state.running = true;
    reset();
    let simT = 0;
    for (const msg of STREAM) {
      let attempt = 0;
      let succeeded = false;
      while (attempt <= maxRetries) {
        attempt++;
        const fails = msg.poison;
        state.timeline.push({ t: simT, id: msg.id, attempt, result: fails ? 'fail' : 'ok' });
        render();
        await wait(180);
        if (!fails) {
          state.delivered.push({ id: msg.id, attempts: attempt });
          succeeded = true;
          simT += 100;
          break;
        }
        // Failed — wait backoff (simulated)
        const wait_ms = backoffMs(attempt);
        if (attempt <= maxRetries) {
          state.timeline.push({ t: simT + 50, id: msg.id, attempt, result: 'backoff', wait: wait_ms });
          render();
          await wait(Math.min(280, 80 + wait_ms / 50));
        }
        simT += 200 + wait_ms;
      }
      if (!succeeded) {
        state.dlq.push({ id: msg.id, attempts: attempt });
        state.timeline.push({ t: simT, id: msg.id, attempt: 'dlq', result: 'dlq' });
        render();
        simT += 100;
      }
    }
    state.running = false;
    explain();
  }

  function explain() {
    const m3Attempts = state.timeline.filter((e) => e.id === 'm3' && (e.result === 'ok' || e.result === 'fail')).length;
    const m3Dlq = state.dlq.find((m) => m.id === 'm3');
    if (maxRetries === 0) {
      root.querySelector('#dl-explain').innerHTML = `<strong>No retries.</strong> m3 failed once and went straight to DLQ. Fast, but you've given up on transient failures too.`;
    } else if (m3Dlq) {
      root.querySelector('#dl-explain').innerHTML = `<strong>m3 retried ${m3Attempts} times, then quarantined.</strong> The line kept moving — m4 and m5 weren't blocked. DLQ now has 1 message for human review.`;
    } else {
      root.querySelector('#dl-explain').innerHTML = `<strong>m3 went poisonous before retries ran out.</strong> In a real system you'd see it eventually reach the DLQ. The poison message can\\'t be made to succeed.`;
    }
  }

  function render() {
    let html = `
      <div class="dl-grid">
        <div class="dl-panel">
          <div class="dl-panel-label">DELIVERED (${state.delivered.length})</div>
          ${state.delivered.length
            ? state.delivered.map((m) => `<div class="dl-msg ok">${m.id} <span class="dl-sub">${m.attempts} attempt${m.attempts > 1 ? 's' : ''}</span></div>`).join('')
            : '<div class="dl-empty">none yet</div>'}
        </div>
        <div class="dl-panel">
          <div class="dl-panel-label">DEAD LETTER QUEUE (${state.dlq.length})</div>
          ${state.dlq.length
            ? state.dlq.map((m) => `<div class="dl-msg bad">${m.id} <span class="dl-sub">${m.attempts} attempts</span></div>`).join('')
            : '<div class="dl-empty">empty 🎉</div>'}
        </div>
      </div>

      <div class="dl-tl">
        <div class="dl-tl-label">RETRY TIMELINE</div>
        ${state.timeline.slice(-30).map((e) => {
          const cls = e.result === 'ok' ? 'ok' : e.result === 'fail' ? 'fail' : e.result === 'dlq' ? 'dlq' : 'bo';
          const text = e.result === 'ok' ? `${e.id}: attempt ${e.attempt} ✓`
                     : e.result === 'fail' ? `${e.id}: attempt ${e.attempt} ✗`
                     : e.result === 'dlq' ? `${e.id} → DLQ`
                     : `${e.id}: wait ${e.wait}ms`;
          return `<div class="dl-tl-row ${cls}">${escape(text)}</div>`;
        }).join('')}
      </div>

      <style>
        .dl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.6rem; }
        .dl-panel { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; }
        .dl-panel-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
        .dl-msg { font-family: var(--font-mono); font-size: 0.85rem; padding: 0.25em 0.5em; margin: 0.12em 0; border: 1.5px solid var(--ink); border-radius: 2px; }
        .dl-msg.ok { background: #d6f5d6; }
        .dl-msg.bad { background: var(--accent-soft); border-color: var(--accent); }
        .dl-sub { color: var(--ink-soft); font-size: 0.72rem; }
        .dl-empty { font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-faint); }
        .dl-tl { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; max-height: 180px; overflow-y: auto; }
        .dl-tl-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
        .dl-tl-row { font-family: var(--font-mono); font-size: 0.78rem; padding: 0.12em 0.4em; border-left: 3px solid transparent; margin: 0.08em 0; border-radius: 2px; }
        .dl-tl-row.ok { border-left-color: #2a8a3e; background: #ecf9ec; }
        .dl-tl-row.fail { border-left-color: var(--accent); background: var(--accent-soft); }
        .dl-tl-row.dlq { border-left-color: var(--accent); background: var(--accent); color: white; font-weight: 600; }
        .dl-tl-row.bo { border-left-color: #b07b1a; background: #fff6dc; color: var(--ink-soft); }
        @media (max-width: 600px) { .dl-grid { grid-template-columns: 1fr; } }
      </style>
    `;
    root.querySelector('#dl-stage').innerHTML = html;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  reset();
}
