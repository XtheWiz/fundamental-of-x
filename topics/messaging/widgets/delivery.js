// Delivery semantics widget: pick a semantic + a failure scenario,
// see the resulting outcome (lost / duplicated / exactly-once).

const SEMANTICS = ['at-most-once', 'at-least-once', 'exactly-once'];

const SCENARIOS = {
  none:        { label: 'No failures',                   crashPoint: null },
  preAck:      { label: 'Consumer crashes BEFORE acking', crashPoint: 'before-ack' },
  postAck:     { label: 'Consumer crashes AFTER processing but BEFORE acking', crashPoint: 'after-process' },
  netLost:     { label: 'Network drops the ack',         crashPoint: 'ack-lost' },
};

// model: 1 producer → broker → 1 consumer. Result: {delivered, processedTimes}
function simulate(semantic, scenario) {
  // Reference message: "order-42"
  let processed = 0;
  let lost = false;
  let duplicated = false;
  let lostAck = false;

  // Producer always sends successfully to broker for this demo
  // Then broker delivers to consumer
  // Consumer either acks (success), crashes before/after, or ack is lost

  if (scenario === 'none') {
    processed = 1;
  } else if (scenario === 'preAck') {
    // Consumer crash before processing
    if (semantic === 'at-most-once') {
      // Sender already acked-itself; consumer lost it
      processed = 0; lost = true;
    } else {
      // at-least-once: redelivered, processed once
      processed = 1;
    }
  } else if (scenario === 'postAck') {
    // Consumer processed but crashed before ack
    if (semantic === 'at-most-once') {
      processed = 1; // got it once
    } else if (semantic === 'at-least-once') {
      // Broker re-delivers; consumer processes again
      processed = 2; duplicated = true;
    } else if (semantic === 'exactly-once') {
      // Idempotent: redelivered, but the effect happens once
      processed = 1; // logically once, even if re-delivered
    }
  } else if (scenario === 'netLost') {
    if (semantic === 'at-most-once') {
      processed = 1;
    } else {
      // at-least-once: broker retries, consumer processes again
      processed = 2; duplicated = true; lostAck = true;
      if (semantic === 'exactly-once') {
        processed = 1; // dedup by ID
      }
    }
  }

  return { processed, lost, duplicated, lostAck };
}

export function initDeliveryWidget(root) {
  let semantic = 'at-least-once';
  let scenario = 'none';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Send one message, choose your guarantee</div>

      <div class="controls">
        <label>Semantic:</label>
        <div class="pill-group">
          ${SEMANTICS.map((s, i) => `
            <input type="radio" name="dv-s" id="dv-${i}" value="${s}" ${s === 'at-least-once' ? 'checked' : ''}>
            <label for="dv-${i}">${s}</label>
          `).join('')}
        </div>
      </div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="dv-scen" style="min-width: 320px;">
          ${Object.entries(SCENARIOS).map(([id, s]) => `<option value="${id}">${s.label}</option>`).join('')}
        </select>
      </div>

      <div class="widget-stage" id="dv-stage" style="min-height: 240px;"></div>

      <div class="callout" id="dv-explain"></div>
    </div>
  `;

  root.querySelectorAll('input[name=dv-s]').forEach((r) =>
    r.addEventListener('change', (e) => { semantic = e.target.value; render(); })
  );
  root.querySelector('#dv-scen').addEventListener('change', (e) => { scenario = e.target.value; render(); });

  function render() {
    const r = simulate(semantic, scenario);
    let html = `
      <div class="dv-result">
        <div class="dv-block ${r.lost ? 'bad' : 'good'}">
          <div class="dv-block-label">DELIVERED</div>
          <div class="dv-block-value">${r.lost ? '0 ✗ LOST' : (r.processed > 0 ? '1+ ✓' : '0')}</div>
        </div>
        <div class="dv-block ${r.processed > 1 ? 'bad' : 'good'}">
          <div class="dv-block-label">PROCESSED COUNT</div>
          <div class="dv-block-value">${r.processed}× ${r.duplicated ? '— ⚠ DUPLICATE' : ''}</div>
        </div>
        <div class="dv-block">
          <div class="dv-block-label">EFFECT</div>
          <div class="dv-block-value">${r.lost ? 'lost' : r.duplicated && semantic !== 'exactly-once' ? 'duplicate' : 'exactly once ✓'}</div>
        </div>
      </div>
      <style>
        .dv-result { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.6rem; }
        .dv-block { background: var(--paper); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.7rem 0.9rem; box-shadow: 3px 3px 0 var(--ink); }
        .dv-block.good { box-shadow: 3px 3px 0 #2a8a3e; background: #d6f5d6; }
        .dv-block.bad  { box-shadow: 3px 3px 0 var(--accent); background: var(--accent-soft); }
        .dv-block-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; }
        .dv-block-value { font-family: var(--font-display); font-size: 1.2rem; letter-spacing: 0.04em; }
        @media (max-width: 600px) { .dv-result { grid-template-columns: 1fr; } }
      </style>
    `;
    root.querySelector('#dv-stage').innerHTML = html;

    let exp;
    if (r.lost) exp = '<strong>Lost.</strong> The message never reached an alive consumer. At-most-once accepts this as the cost of doing business.';
    else if (r.processed > 1 && semantic === 'at-least-once') exp = '<strong>Duplicated.</strong> The broker redelivered after the failure; the consumer ran twice. To avoid app-level harm, consumers should be idempotent (next lesson).';
    else if (r.processed === 1 && semantic === 'exactly-once') exp = '<strong>Exactly once.</strong> The consumer received the message twice but deduped by ID. App sees one effect.';
    else exp = '<strong>Single processing.</strong> No retries needed; the happy path.';
    root.querySelector('#dv-explain').innerHTML = exp;
  }

  render();
}
