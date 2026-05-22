// Queue vs stream widget: process 10 messages with 3 consumers under
// each model. Queue: workers compete; once consumed, gone. Stream: each
// consumer sees all messages independently.

const NUM_MSGS = 10;

export function initQueuesStreamsWidget(root) {
  let mode = 'queue';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">10 messages, 3 consumers — two different shapes</div>

      <div class="controls">
        <label>Model:</label>
        <div class="pill-group">
          <input type="radio" name="qs-m" id="qs-q" value="queue" checked>
          <label for="qs-q">Work queue</label>
          <input type="radio" name="qs-m" id="qs-s" value="stream">
          <label for="qs-s">Stream (log)</label>
        </div>
      </div>

      <div class="widget-stage" id="qs-stage" style="min-height: 320px;"></div>

      <div class="callout" id="qs-explain"></div>
    </div>
  `;

  root.querySelectorAll('input[name=qs-m]').forEach((r) =>
    r.addEventListener('change', (e) => { mode = e.target.value; render(); })
  );

  function render() {
    // Assign messages to consumers
    const consumerColors = ['#cfe5ff', '#c8f0c8', '#ffe9b3'];
    const assignments = [];  // [{msgId, consumer | null}]
    if (mode === 'queue') {
      // Round-robin among 3 workers
      for (let i = 0; i < NUM_MSGS; i++) {
        assignments.push({ msgId: i + 1, consumer: i % 3 });
      }
    } else {
      // Stream: every consumer sees every message
      for (let i = 0; i < NUM_MSGS; i++) {
        assignments.push({ msgId: i + 1, consumer: 'all' });
      }
    }

    let html = `
      <div class="qs-section">
        <div class="qs-label">${mode === 'queue' ? 'WORK QUEUE (each message goes to ONE worker)' : 'STREAM / LOG (each consumer sees ALL messages)'}</div>
        <div class="qs-msgs">
          ${assignments.map((a) => {
            const colors = a.consumer === 'all'
              ? consumerColors.map((c) => `border-top: 4px solid ${c};`).join('') // doesn't really work; we'll do flag bar
              : `background: ${consumerColors[a.consumer]};`;
            return `<div class="qs-msg" style="${a.consumer === 'all' ? 'background: var(--paper)' : `background: ${consumerColors[a.consumer]}`};">
              <div class="qs-msg-id">m${a.msgId}</div>
              <div class="qs-msg-tags">${a.consumer === 'all' ? consumerColors.map((c,i) => `<span class="qs-tag" style="background:${c}">C${i+1}</span>`).join('') : `<span class="qs-tag" style="background:${consumerColors[a.consumer]}">C${a.consumer+1}</span>`}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="qs-consumers">
        ${[0,1,2].map((c) => {
          const msgs = mode === 'queue'
            ? assignments.filter((a) => a.consumer === c).map((a) => 'm' + a.msgId)
            : assignments.map((a) => 'm' + a.msgId);
          return `<div class="qs-consumer" style="background: ${consumerColors[c]};">
            <div class="qs-consumer-name">Consumer C${c + 1}</div>
            <div class="qs-consumer-msgs">received: ${msgs.length ? msgs.join(', ') : '(nothing)'}</div>
          </div>`;
        }).join('')}
      </div>

      <style>
        .qs-section { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem 0.8rem; margin-bottom: 0.6rem; }
        .qs-label { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.85rem; margin-bottom: 0.4em; }
        .qs-msgs { display: grid; grid-template-columns: repeat(${NUM_MSGS}, 1fr); gap: 0.25rem; }
        .qs-msg { background: var(--paper); border: 1.5px solid var(--ink); border-radius: 2px; padding: 0.3em; text-align: center; }
        .qs-msg-id { font-family: var(--font-mono); font-size: 0.78rem; font-weight: 600; }
        .qs-msg-tags { display: flex; gap: 1px; justify-content: center; margin-top: 0.2em; }
        .qs-tag { display: inline-block; font-family: var(--font-mono); font-size: 0.6rem; padding: 0 0.25em; border: 1px solid var(--ink); border-radius: 2px; }
        .qs-consumers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; }
        .qs-consumer { border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; box-shadow: 3px 3px 0 var(--ink); }
        .qs-consumer-name { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.9rem; }
        .qs-consumer-msgs { font-family: var(--font-mono); font-size: 0.78rem; }
        @media (max-width: 600px) { .qs-msgs { grid-template-columns: repeat(5, 1fr); } .qs-consumers { grid-template-columns: 1fr; } }
      </style>
    `;
    root.querySelector('#qs-stage').innerHTML = html;

    root.querySelector('#qs-explain').innerHTML = mode === 'queue'
      ? `<strong>Work queue.</strong> Each message goes to exactly one consumer. Total work split 3 ways. Once consumed, the message is gone — no replay possible.`
      : `<strong>Stream.</strong> All 3 consumers see all 10 messages, independently. Tomorrow you can add C4, rewind to offset 0, and it gets every message from the beginning.`;
  }

  render();
}
