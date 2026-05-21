// Messaging architectures widget: pick a system, see profile across
// dimensions (shape, throughput, semantics, etc.) + a typical use case.

const SYSTEMS = {
  kafka: {
    label: 'Kafka',
    sub: 'Distributed log',
    profile: [
      { dim: 'Shape',         val: 'Stream (log)', link: 'queues-vs-streams' },
      { dim: 'Throughput',    val: 'Millions/sec, huge clusters' },
      { dim: 'Delivery',      val: 'At-least-once; exactly-once via transactions', link: 'delivery' },
      { dim: 'Ordering',      val: 'Per-partition', link: 'ordering' },
      { dim: 'Retention',     val: 'Hours to forever (config)' },
      { dim: 'Backpressure',  val: 'Disk-based buffering; consumers track offsets', link: 'backpressure' },
      { dim: 'DLQ',           val: 'Manual (write to a "deadletter" topic)', link: 'dlq-retries' },
      { dim: 'Ops cost',      val: 'High — needs care, monitoring, capacity planning' },
    ],
    use: 'Event streaming, analytics, CDC, log aggregation. When you need to replay and many consumers care.',
  },
  rabbitmq: {
    label: 'RabbitMQ',
    sub: 'Smart broker, work queues + routing',
    profile: [
      { dim: 'Shape',         val: 'Work queue (Streams add-on for log)', link: 'queues-vs-streams' },
      { dim: 'Throughput',    val: 'Tens of thousands/sec per node' },
      { dim: 'Delivery',      val: 'At-most-once or at-least-once via acks', link: 'delivery' },
      { dim: 'Ordering',      val: 'Per-queue (sort of)' },
      { dim: 'Retention',     val: 'Until consumed' },
      { dim: 'Backpressure',  val: 'Built-in flow control + memory watermarks', link: 'backpressure' },
      { dim: 'DLQ',           val: 'Native dead-letter exchanges', link: 'dlq-retries' },
      { dim: 'Ops cost',      val: 'Medium — well-trodden, simpler than Kafka' },
    ],
    use: 'Task queues, RPC, complex routing. Pre-Kafka enterprise messaging. Still excellent for "send this email" workloads.',
  },
  sqs: {
    label: 'AWS SQS',
    sub: 'Boring, reliable, managed',
    profile: [
      { dim: 'Shape',         val: 'Work queue (standard or FIFO)', link: 'queues-vs-streams' },
      { dim: 'Throughput',    val: 'Effectively unlimited (standard); 3000/s (FIFO)' },
      { dim: 'Delivery',      val: 'At-least-once (standard); exactly-once (FIFO, capped)', link: 'delivery' },
      { dim: 'Ordering',      val: 'No (standard); per-group (FIFO)', link: 'ordering' },
      { dim: 'Retention',     val: '14 days max' },
      { dim: 'Backpressure',  val: 'Pull-based; producers always succeed if quota', link: 'backpressure' },
      { dim: 'DLQ',           val: 'Built-in; configure max receives → DLQ', link: 'dlq-retries' },
      { dim: 'Ops cost',      val: 'Near zero. AWS runs it.' },
    ],
    use: 'AWS-resident task queues. Decoupling Lambdas. When you do not want to operate a broker at all.',
  },
  nats: {
    label: 'NATS / JetStream',
    sub: 'Lightweight, low-latency',
    profile: [
      { dim: 'Shape',         val: 'Pub/sub (core); streams (JetStream)', link: 'queues-vs-streams' },
      { dim: 'Throughput',    val: 'Millions/sec; sub-ms latency' },
      { dim: 'Delivery',      val: 'At-most-once (core); at-least-once (JetStream)', link: 'delivery' },
      { dim: 'Ordering',      val: 'Per-subject in JetStream', link: 'ordering' },
      { dim: 'Retention',     val: 'Configurable (count, age, size)' },
      { dim: 'Backpressure',  val: 'Drop-by-default in core; flow control in JetStream', link: 'backpressure' },
      { dim: 'DLQ',           val: 'Via max-deliver + separate stream', link: 'dlq-retries' },
      { dim: 'Ops cost',      val: 'Low. Single binary, simple cluster.' },
    ],
    use: 'Microservice request/reply, edge devices, IoT, where Kafka feels heavy. CNCF graduated; rapidly growing.',
  },
  redis: {
    label: 'Redis Streams',
    sub: 'Already-deployed Redis as a broker',
    profile: [
      { dim: 'Shape',         val: 'Stream (log) with consumer groups', link: 'queues-vs-streams' },
      { dim: 'Throughput',    val: 'Hundreds of thousands/sec' },
      { dim: 'Delivery',      val: 'At-least-once; ACK-based', link: 'delivery' },
      { dim: 'Ordering',      val: 'Per-stream', link: 'ordering' },
      { dim: 'Retention',     val: 'Configurable; in-memory by default' },
      { dim: 'Backpressure',  val: 'MAXLEN policies + manual', link: 'backpressure' },
      { dim: 'DLQ',           val: 'Manual via XCLAIM + idle detection', link: 'dlq-retries' },
      { dim: 'Ops cost',      val: 'Low if you already run Redis; pay for it twice if not' },
    ],
    use: 'You already use Redis. Small-to-medium scale streaming without bringing in another system.',
  },
};

const LESSON_LINKS = {
  'queues-vs-streams': 'Queues vs Streams',
  'delivery': 'Delivery Semantics',
  'ordering': 'Ordering & Idempotency',
  'backpressure': 'Backpressure',
  'dlq-retries': 'DLQ & Retries',
};

export function initMsgArchitecturesWidget(root) {
  let system = 'kafka';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Five brokers, same primitives</div>

      <div class="controls">
        <div class="pill-group">
          ${Object.entries(SYSTEMS).map(([id, s], i) => `
            <input type="radio" name="ma-s" id="ma-${id}" value="${id}" ${i === 0 ? 'checked' : ''}>
            <label for="ma-${id}">${s.label.split(' /')[0]}</label>
          `).join('')}
        </div>
      </div>

      <div class="widget-stage" id="ma-stage" style="min-height: 380px;"></div>

      <div class="callout" id="ma-note"></div>
    </div>
  `;

  root.querySelectorAll('input[name=ma-s]').forEach((r) =>
    r.addEventListener('change', (e) => { system = e.target.value; render(); })
  );

  function render() {
    const s = SYSTEMS[system];
    let html = `
      <div class="ma-title">${escape(s.label)}</div>
      <div class="ma-sub">${escape(s.sub)}</div>
      <div class="ma-grid">
        ${s.profile.map((p) => `
          <div class="ma-row">
            <div class="ma-dim">${escape(p.dim)}</div>
            <div class="ma-val">
              ${escape(p.val)}
              ${p.link ? `<a class="ma-link" href="${p.link}.html" title="${escape(LESSON_LINKS[p.link])}">→</a>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <style>
        .ma-title { font-family: var(--font-display); font-size: 1.5rem; letter-spacing: 0.04em; }
        .ma-sub { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-soft); margin-bottom: 0.6em; }
        .ma-grid { display: grid; grid-template-columns: 1fr; gap: 0.3rem; }
        .ma-row { display: grid; grid-template-columns: 170px 1fr; gap: 0.5rem; align-items: baseline; padding: 0.35em 0.6em; background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: var(--radius); }
        .ma-dim { font-family: var(--font-display); letter-spacing: 0.5px; font-size: 0.85rem; color: var(--ink-soft); }
        .ma-val { font-family: var(--font-mono); font-size: 0.85rem; }
        .ma-link { font-family: var(--font-display); padding: 0.05em 0.45em; background: var(--accent); color: white; border: 1.5px solid var(--ink); border-radius: 2px; text-decoration: none; font-size: 0.8rem; margin-left: 0.4em; }
        .ma-link:hover { color: white; transform: translate(-1px, -1px); }
      </style>
    `;
    root.querySelector('#ma-stage').innerHTML = html;
    root.querySelector('#ma-note').innerHTML = s.use;
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
