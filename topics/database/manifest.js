// Database topic manifest — single source of truth for lesson order,
// titles, and blurbs. The sidebar, lesson nav, and topic hub all
// render from this. Adding/reordering lessons happens here.

export const manifest = {
  slug: 'database',
  title: 'Database',
  tagline: 'How databases really work, from disk pages to query plans.',
  lessons: [
    {
      slug: 'acid',
      title: 'ACID Properties',
      blurb: 'Atomicity, Consistency, Isolation, Durability — what each one actually protects against.',
    },
    {
      slug: 'btree',
      title: 'B-Tree Indexes',
      blurb: 'Insert keys into a live B-Tree and see why a database can find one row in millions in microseconds.',
    },
    {
      slug: 'storage',
      title: 'Row vs Column Storage',
      blurb: 'The same data on disk, two ways. Watch which blocks get read for OLTP vs OLAP queries.',
    },
    {
      slug: 'isolation',
      title: 'Transaction Isolation',
      blurb: 'Dial up the isolation level and watch dirty reads, non-repeatable reads, and phantoms disappear.',
    },
    {
      slug: 'wal',
      title: 'Write-Ahead Log (WAL)',
      blurb: 'Why writing the log first is the trick that gives databases durability after a crash.',
    },
    {
      slug: 'replication',
      title: 'Replication',
      blurb: 'A primary and its replicas. Toggle sync vs async writes and see the lag tradeoff.',
    },
    {
      slug: 'sharding',
      title: 'Sharding & Partitioning',
      blurb: 'Pick a shard strategy and watch data distribute across nodes — fairly or not.',
    },
    {
      slug: 'query',
      title: 'Query Execution',
      blurb: 'From SQL text to result set: parser → planner → executor, step by step.',
    },
  ],
};
