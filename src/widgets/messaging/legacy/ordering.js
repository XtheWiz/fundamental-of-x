// Ordering & idempotency widget: simulate a balance-update stream
// where one message is duplicated. Show non-idempotent vs idempotent
// consumer outcomes.

const STREAM = [
  { id: 'evt-1', op: 'credit', amount: 100 },
  { id: 'evt-2', op: 'credit', amount: 50 },
  { id: 'evt-2', op: 'credit', amount: 50 },  // DUPLICATE!
  { id: 'evt-3', op: 'debit',  amount: 30 },
];

export function initOrderingWidget(root) {
  let idempotent = false;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Same stream, two consumer styles</div>

      <div class="controls">
        <label><input type="checkbox" id="or-idem"> Idempotent consumer (dedupe by message ID)</label>
        <button class="btn btn-accent" id="or-run">Process stream</button>
        <button class="btn btn-ghost" id="or-reset">Reset</button>
      </div>

      <div class="widget-stage" id="or-stage" style="min-height: 320px;"></div>

      <div class="callout" id="or-explain">
        Stream: 4 events. <strong>evt-2 is delivered twice</strong> (an at-least-once redelivery). With idempotency, the duplicate is skipped; without, the balance is wrong.
      </div>
    </div>
  `;

  root.querySelector('#or-idem').addEventListener('change', (e) => { idempotent = e.target.checked; });
  root.querySelector('#or-run').addEventListener('click', run);
  root.querySelector('#or-reset').addEventListener('click', () => render([]));

  function run() {
    const events = [];
    let balance = 0;
    const seen = new Set();
    STREAM.forEach((msg, i) => {
      if (idempotent && seen.has(msg.id)) {
        events.push({ ...msg, action: 'skipped (already processed)', balanceBefore: balance, balanceAfter: balance });
        return;
      }
      const before = balance;
      if (msg.op === 'credit') balance += msg.amount;
      else balance -= msg.amount;
      seen.add(msg.id);
      events.push({ ...msg, action: 'applied', balanceBefore: before, balanceAfter: balance });
    });
    render(events);
  }

  function render(events) {
    let html = `
      <div class="or-stream">
        ${STREAM.map((msg, i) => {
          const e = events[i];
          let cls = 'or-msg';
          if (!e) cls += ' pending';
          else if (e.action === 'skipped (already processed)') cls += ' skipped';
          else cls += ' applied';
          return `<div class="${cls}">
            <div class="or-msg-id">${msg.id}${i === 2 ? ' ↻' : ''}</div>
            <div class="or-msg-op">${msg.op} ${msg.amount}</div>
            ${e ? `<div class="or-msg-action">${e.action}</div><div class="or-msg-balance">balance: ${e.balanceBefore} → ${e.balanceAfter}</div>` : ''}
          </div>`;
        }).join('')}
      </div>
      ${events.length ? `<div class="or-final"><strong>Final balance: ${events[events.length-1].balanceAfter}</strong> (expected: 120 — credit 100 + credit 50 - debit 30)</div>` : ''}
      <style>
        .or-stream { display: grid; grid-template-columns: repeat(${STREAM.length}, 1fr); gap: 0.4rem; }
        .or-msg { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.6rem; text-align: center; }
        .or-msg.pending { opacity: 0.5; }
        .or-msg.applied { background: #c8f0c8; box-shadow: 3px 3px 0 var(--ink); }
        .or-msg.skipped { background: #ffe9b3; box-shadow: 3px 3px 0 var(--ink); }
        .or-msg-id { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.9rem; }
        .or-msg-op { font-family: var(--font-mono); font-size: 0.8rem; }
        .or-msg-action { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); margin-top: 0.3em; padding-top: 0.2em; border-top: 1px dashed var(--ink); }
        .or-msg-balance { font-family: var(--font-mono); font-size: 0.7rem; }
        .or-final { margin-top: 0.6rem; padding: 0.6rem 0.8rem; background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); box-shadow: 3px 3px 0 var(--accent); }
        @media (max-width: 640px) { .or-stream { grid-template-columns: 1fr 1fr; } }
      </style>
    `;
    root.querySelector('#or-stage').innerHTML = html;

    if (events.length) {
      const final = events[events.length - 1].balanceAfter;
      if (final === 120) {
        root.querySelector('#or-explain').innerHTML = `<strong>Correct balance.</strong> The duplicate of evt-2 was deduped by ID. Idempotent consumers handle the at-least-once world gracefully.`;
      } else {
        root.querySelector('#or-explain').innerHTML = `<strong>Wrong! Balance is ${final} instead of 120.</strong> The duplicate of evt-2 was applied twice. Without idempotency, the redelivery silently corrupted the data.`;
      }
    }
  }

  render([]);
}
