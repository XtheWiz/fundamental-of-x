import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import OutboxWidget from '../widgets/messaging/OutboxWidget.jsx';
import { initWhyWidget } from '../widgets/messaging/legacy/why.js';
import { initTopicsPartitionsWidget } from '../widgets/messaging/legacy/topics-partitions.js';
import { initDeliveryWidget } from '../widgets/messaging/legacy/delivery.js';
import { initOrderingWidget } from '../widgets/messaging/legacy/ordering.js';
import { initQueuesStreamsWidget } from '../widgets/messaging/legacy/queues-vs-streams.js';
import { initBackpressureWidget } from '../widgets/messaging/legacy/backpressure.js';
import { initDlqWidget } from '../widgets/messaging/legacy/dlq-retries.js';
import { initMsgArchitecturesWidget } from '../widgets/messaging/legacy/architectures.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'messaging',
  title: 'Messaging',
  intro: <>Eight lessons on brokers, queues, topics, partitions, and the patterns behind Kafka, RabbitMQ, SQS, NATS — the systems that decouple producers from consumers.</>,
  lessons: [
    { slug: 'why', number: '01', title: 'Why Messaging?', blurb: 'Two services, one network. Why a message broker between them changes everything about failure, scale, and back-pressure.', Widget: W(initWhyWidget),
      intro: <>Direct service-to-service calls couple producer to consumer in time and availability. A broker in the middle decouples them: producer keeps going even when consumer is down.</>, sections: [],
      takeaways: ['Sync call: producer blocks until consumer responds. One slow consumer = slow producer.', 'Async via broker: producer fires-and-forgets, consumer drains the queue at its own pace.', 'Decoupling in time means decoupling in availability.', 'Cost: an extra moving part to operate, monitor, and reason about.'] },
    { slug: 'topics-partitions', number: '02', title: 'Topics, Partitions & Consumer Groups', blurb: 'The Kafka mental model. Producers append to a topic; partitions split the work; consumer groups share the load.', Widget: W(initTopicsPartitionsWidget),
      intro: <>Topics hold messages. Partitions parallelize them. Consumer groups divide partitions among workers so the same topic can be processed by many consumers at once.</>, sections: [],
      takeaways: ['Partition = unit of parallelism. More partitions = more consumers can work in parallel.', 'Each partition is consumed by at most one consumer in a group.', 'Ordering is per-partition, not per-topic.', 'Adding consumers beyond the partition count just leaves them idle.'] },
    { slug: 'delivery', number: '03', title: 'Delivery Semantics', blurb: 'At-most-once, at-least-once, exactly-once. The three answers your broker can give, ranked by cost.', Widget: W(initDeliveryWidget),
      intro: <>What guarantee does the broker make about message delivery? Each level fixes one failure mode at the cost of more overhead.</>, sections: [],
      takeaways: ['At-most-once: fast, may lose messages on crash.', 'At-least-once: never loses, may duplicate. The pragmatic default.', 'Exactly-once: requires coordination + idempotent consumers. Available in Kafka with effort.', 'Most "exactly-once" claims are at-least-once + idempotent consumer.'] },
    { slug: 'ordering', number: '04', title: 'Ordering & Idempotency', blurb: 'Ordering is only guaranteed within a partition. So consumers must be idempotent.', Widget: W(initOrderingWidget),
      intro: <>Across partitions, messages can interleave any way. If your business logic needs ordering, pin related messages to the same partition by key.</>, sections: [],
      takeaways: ['Use a partition key (user ID, order ID) to keep related messages ordered.', 'Idempotent consumers: processing the same message twice = same result.', 'Dedup via a "seen" set or transactional outbox.', 'Ordering across partitions requires a single-threaded consumer — losing parallelism.'] },
    { slug: 'queues-vs-streams', number: '05', title: 'Queues vs Streams', blurb: 'RabbitMQ\'s work queue and Kafka\'s log are two different shapes. Same word "messaging," very different mechanics.', Widget: W(initQueuesStreamsWidget),
      intro: <>A queue deletes messages once consumed. A stream keeps them around and lets consumers seek. Different problems, different tools.</>, sections: [],
      takeaways: ['Queue: message is owned by one consumer, then gone. Good for work distribution.', 'Stream: append-only log, many consumers can read independently. Good for event sourcing.', 'Kafka, Kinesis, Redis Streams = streams. RabbitMQ, SQS = queues.', 'You can fake one with the other but it hurts.'] },
    { slug: 'backpressure', number: '06', title: 'Backpressure & Flow Control', blurb: 'Producer at 10k/s, consumer at 1k/s. Where do the extra messages go?', Widget: W(initBackpressureWidget),
      intro: <>When producers outpace consumers, you must buffer, drop, slow down, or fail. Pick the strategy upfront — defaults are usually wrong.</>, sections: [],
      takeaways: ['Buffer: works until the buffer fills. Then what?', 'Drop: fast but loses messages. Only safe if you can tolerate it.', 'Slow down the producer: cleanest, but the producer needs to handle it.', 'Fail: surface the problem early instead of silently degrading.'] },
    { slug: 'dlq-retries', number: '07', title: 'Dead Letter Queues & Retries', blurb: 'A consumer keeps failing on the same message. Retry forever? Skip it? Quarantine it.', Widget: W(initDlqWidget),
      intro: <>Some messages are poison. Retrying forever blocks the queue; skipping silently loses data. DLQs move bad messages aside for human inspection.</>, sections: [],
      takeaways: ['Retry with exponential backoff for transient failures.', 'After N retries, move to a DLQ — don\'t block the main pipeline.', 'DLQ messages need a human or alert; otherwise they pile up forever.', 'Always log the cause when moving to DLQ — context is lost otherwise.'] },
    { slug: 'architectures', number: '08', title: 'Architectures in Practice', blurb: 'Kafka, RabbitMQ, SQS, NATS, Redis Streams — how the same primitives compose into very different products.', Widget: W(initMsgArchitecturesWidget),
      intro: <>Five popular brokers, five different sweet spots. Knowing which one fits the workload up-front saves you from a re-platform later.</>, sections: [],
      takeaways: ['Kafka: high throughput, replay, durable. Heavy ops.', 'RabbitMQ: flexible routing, smaller scale, easy to start.', 'SQS: fully managed, simple, AWS-locked.', 'NATS: low latency, lightweight. Redis Streams: in-memory speed but not durable by default.'] },
    { slug: 'outbox', number: '09', title: 'Transactional Outbox', blurb: 'How to update a database AND publish a message reliably when there\'s no distributed transaction between them.',
      Widget: OutboxWidget,
      intro: <>You wrote the row, then tried to publish — and the broker was down. Now the database has the order, nobody knows. The transactional outbox solves this by writing the event to the <em>same DB transaction</em> as the business state change. A separate relay reads from the outbox and publishes.</>,
      sections: [{
        heading: 'The dual-write problem',
        body: (
          <>
            <p>Two systems, two writes. There&apos;s no atomic transaction spanning your DB and your message broker, so failure of one after success of the other leaves them inconsistent. Retries help, but the service might crash between the two writes, so even retry isn&apos;t enough.</p>
            <p>The outbox flips the problem: only one transaction, on the DB. The event sits in an <code>outbox</code> table next to the business data, atomically committed. A relay (a poller or change-data-capture stream) drains it.</p>
          </>
        ),
      }, {
        heading: 'Implementation flavours',
        body: (
          <ul>
            <li><strong>Polling relay</strong> — the relay queries <code>SELECT * FROM outbox WHERE published_at IS NULL</code> on a tight loop, publishes, marks done. Simple, ~seconds of latency, hits the DB hard.</li>
            <li><strong>CDC stream</strong> — Debezium, Postgres logical replication, or a CDC product reads the WAL and emits one event per outbox insert. Lower latency, no extra DB query load, more moving parts.</li>
            <li><strong>Transactional broker</strong> — Kafka transactions or RabbitMQ confirms let you coordinate, but the broker must be available at write time. Outbox decouples that.</li>
          </ul>
        ),
      }],
      takeaways: [
        "Outbox is the standard answer to \"how do I update a DB AND publish a message reliably?\"",
        "Trade-off: you get at-least-once delivery, not exactly-once. Consumers must be idempotent — see the Ordering & Idempotency lesson.",
        "The relay is the single point of failure to monitor. Watch outbox row age; it shouldn't keep growing.",
        "Debezium + Postgres logical replication is the production-grade combo. Polling works fine to start.",
      ] },
  ],
};
