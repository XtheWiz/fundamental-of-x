// Messaging topic manifest.

export const manifest = {
  slug: 'messaging',
  title: 'Messaging',
  tagline: 'The patterns behind Kafka, RabbitMQ, SQS, NATS — and the trade-offs they share.',
  lessons: [
    {
      slug: 'why',
      title: 'Why Messaging?',
      blurb: 'Two services, one network. Why a message broker between them changes everything about failure, scale, and back-pressure.',
    },
    {
      slug: 'topics-partitions',
      title: 'Topics, Partitions & Consumer Groups',
      blurb: 'The Kafka mental model. Producers append to a topic; partitions split the work; consumer groups share the load.',
    },
    {
      slug: 'delivery',
      title: 'Delivery Semantics',
      blurb: 'At-most-once, at-least-once, exactly-once. The three answers your broker can give, ranked by cost.',
    },
    {
      slug: 'ordering',
      title: 'Ordering & Idempotency',
      blurb: 'Ordering is only guaranteed within a partition. So consumers must be idempotent. Here\'s what that means in code.',
    },
    {
      slug: 'queues-vs-streams',
      title: 'Queues vs Streams',
      blurb: 'RabbitMQ\'s work queue and Kafka\'s log are two different shapes. Same word "messaging," very different mechanics.',
    },
    {
      slug: 'backpressure',
      title: 'Backpressure & Flow Control',
      blurb: 'Producer at 10k/s, consumer at 1k/s. Where do the extra messages go? Buffer, drop, slow down, or fail?',
    },
    {
      slug: 'dlq-retries',
      title: 'Dead Letter Queues & Retries',
      blurb: 'A consumer keeps failing on the same message. Retry forever? Skip it? Quarantine it. The patterns that prevent meltdowns.',
    },
    {
      slug: 'architectures',
      title: 'Architectures in Practice',
      blurb: 'Kafka, RabbitMQ, SQS, NATS, Redis Streams — how the same primitives compose into very different products.',
    },
  ],
};
