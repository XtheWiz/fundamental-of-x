import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import QueryWidget from '../widgets/database/QueryWidget.jsx';
import NoSqlWidget from '../widgets/database/NoSqlWidget.jsx';
import MvccWidget from '../widgets/database/MvccWidget.jsx';
import IndexTypesWidget from '../widgets/database/IndexTypesWidget.jsx';
import { initAcidWidget } from '../widgets/database/legacy/acid.js';
import { initBTreeWidget } from '../widgets/database/legacy/btree.js';
import { initStorageWidget } from '../widgets/database/legacy/storage.js';
import { initIsolationWidget } from '../widgets/database/legacy/isolation.js';
import { initWalWidget } from '../widgets/database/legacy/wal.js';
import { initReplicationWidget } from '../widgets/database/legacy/replication.js';
import { initShardingWidget } from '../widgets/database/legacy/sharding.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'database',
  title: 'Database',
  tagline: 'How databases really work, from disk pages to query plans.',
  intro: (
    <>
      Step inside the database engine. Eight lessons covering ACID guarantees,
      B-Tree indexes, storage layouts, isolation levels, write-ahead logging,
      replication, sharding, and query execution — each backed by a widget
      you can poke at.
    </>
  ),
  lessons: [
    {
      slug: 'acid', number: '01', title: 'ACID Properties',
      blurb: 'Atomicity, Consistency, Isolation, Durability — what each one actually protects against.',
      Widget: W(initAcidWidget),
      intro: <>Four letters that mean four different guarantees. Most database bugs come from misunderstanding which of these you actually have.</>,
      sections: [{
        heading: 'What each letter protects against',
        body: (
          <ul>
            <li><strong>Atomicity</strong> — a transaction either fully happens or doesn't happen at all. No half-applied writes.</li>
            <li><strong>Consistency</strong> — every commit leaves the database in a valid state (constraints, types, foreign keys all satisfied).</li>
            <li><strong>Isolation</strong> — concurrent transactions don't see each other's intermediate state. Different levels trade isolation for throughput.</li>
            <li><strong>Durability</strong> — once the database says "committed", the data survives a crash. Even right after.</li>
          </ul>
        ),
      }],
      takeaways: [
        "Atomicity is rollback. The WAL is what makes it cheap.",
        "Consistency is the boring one — it's just \"constraints are enforced.\"",
        "Isolation is the dial. Higher = safer, lower = faster. Defaults rarely match what you think.",
        "Durability assumes fsync actually flushes to disk. Cloud SSDs lie sometimes.",
      ],
    },
    {
      slug: 'btree', number: '02', title: 'B-Tree Indexes',
      blurb: 'Insert keys into a live B-Tree and see why a database can find one row in millions in microseconds.',
      Widget: W(initBTreeWidget),
      intro: <>The data structure that makes <code>WHERE id = 42</code> O(log n) instead of O(n). Every relational database uses B-trees (or B+-trees, the disk-friendly variant) for primary indexes.</>,
      sections: [{
        heading: 'Why B-trees, not binary trees?',
        body: (
          <p>Disk and SSD pages are 4–16 KB. A binary tree visits one key per page — terrible cache use. A B-tree packs hundreds of keys per node, so each disk read advances you 8–10 levels deep instead of one. That's why a million-row table needs only 3–4 disk reads to find a key.</p>
        ),
      }],
      takeaways: [
        "Fan-out is the magic. 100 keys per node → 10^6 rows in 3 levels.",
        "Inserts can split nodes, propagating up to the root. Watch the widget do this.",
        "B+-trees keep all data in leaves and chain them — perfect for range scans.",
        "Concurrent updates use latch coupling and copy-on-write tricks. Beyond this lesson's scope, but the structure is the same.",
      ],
    },
    {
      slug: 'storage', number: '03', title: 'Row vs Column Storage',
      blurb: 'The same data on disk, two ways. Watch which blocks get read for OLTP vs OLAP queries.',
      Widget: W(initStorageWidget),
      intro: <>Row stores keep an entire record together; column stores keep each attribute together. Same logical table, opposite physical layout — and the right choice depends entirely on what your queries look like.</>,
      sections: [{
        heading: 'OLTP vs OLAP',
        body: (
          <ul>
            <li><strong>Row (OLTP)</strong>: <code>SELECT * FROM users WHERE id = 42</code> reads one block.</li>
            <li><strong>Column (OLAP)</strong>: <code>SELECT AVG(salary) FROM users</code> reads just one column's blocks; everything else stays on disk.</li>
            <li>Modern systems mix the two (HTAP, Hyper, SingleStore) — write rows, query columns.</li>
          </ul>
        ),
      }],
      takeaways: [
        "Row store = good for fetching whole records. The default for transactional systems.",
        "Column store = good for aggregating one or two columns over many rows. The default for analytics.",
        "Compression on columns can be 10–100×. All the values in a column have the same type and often similar values.",
        "If you're doing both, you want a system that runs both layouts — or two databases.",
      ],
    },
    {
      slug: 'isolation', number: '04', title: 'Transaction Isolation',
      blurb: 'Dial up the isolation level and watch dirty reads, non-repeatable reads, and phantoms disappear.',
      Widget: W(initIsolationWidget),
      intro: <>Concurrent transactions can step on each other in surprisingly subtle ways. The SQL standard defines four isolation levels, each ruling out one more class of anomaly. Higher levels are safer but slower.</>,
      sections: [{
        heading: 'The anomalies, ranked',
        body: (
          <ul>
            <li><strong>Dirty read</strong> — see a value another transaction wrote but hasn't committed yet.</li>
            <li><strong>Non-repeatable read</strong> — read the same row twice in the same transaction, get different values.</li>
            <li><strong>Phantom read</strong> — same query, different set of rows the second time.</li>
            <li><strong>Serializable</strong> — none of the above. As if transactions ran one after another.</li>
          </ul>
        ),
      }],
      takeaways: [
        "Defaults vary by database. Postgres = read committed, MySQL = repeatable read, SQL Server = read committed. Check yours.",
        "Most apps would benefit from snapshot isolation (RC + writes see a consistent snapshot).",
        "Serializable is expensive — implemented via locking or serializable snapshot isolation (SSI).",
        "If you don't think about isolation, you're using whatever the default is — which may or may not match your assumptions.",
      ],
    },
    {
      slug: 'wal', number: '05', title: 'Write-Ahead Log (WAL)',
      blurb: 'Why writing the log first is the trick that gives databases durability after a crash.',
      Widget: W(initWalWidget),
      intro: <>The trick: before changing the actual data pages, write a description of the change to a sequential log. If the system crashes mid-update, recovery replays the log. The data pages can lazily catch up.</>,
      sections: [{
        heading: 'Why the log first?',
        body: (
          <ul>
            <li>Sequential writes to the log are an order of magnitude faster than random writes to data pages.</li>
            <li>Once the log is on disk, the transaction is durable — even if the data pages haven't been flushed yet.</li>
            <li>On crash, recovery scans the log and replays committed transactions, undoes uncommitted ones.</li>
            <li>Checkpoints periodically force the data pages to catch up, letting old log segments be truncated.</li>
          </ul>
        ),
      }],
      takeaways: [
        "Durability without WAL would mean fsyncing every page change. Far too slow.",
        "Postgres, MySQL InnoDB, SQLite, and every serious database uses WAL.",
        "fsync on the log is the actual durability boundary. If your hardware lies about that, you lose data on crash.",
        "Replication often piggybacks on the WAL — replicas just replay the same log.",
      ],
    },
    {
      slug: 'replication', number: '06', title: 'Replication',
      blurb: 'A primary and its replicas. Toggle sync vs async writes and see the lag tradeoff.',
      Widget: W(initReplicationWidget),
      intro: <>Keep extra copies of the database for read scaling, geographic latency, and disaster recovery. The hard part is keeping them in sync without killing write performance.</>,
      sections: [{
        heading: 'Sync vs async',
        body: (
          <ul>
            <li><strong>Async</strong> — primary commits, then ships the log to replicas in the background. Fast writes, but replicas can fall behind. If the primary dies, you might lose recent writes.</li>
            <li><strong>Sync</strong> — primary waits for at least one replica to acknowledge before committing. Safer, slower. If a replica is slow, your writes are slow.</li>
            <li><strong>Quorum</strong> — wait for K out of N. The middle ground; what Raft and Postgres synchronous_standby do.</li>
          </ul>
        ),
      }],
      takeaways: [
        "Async replication is the default. It's fast but loses recent writes on primary failure.",
        "Sync replication trades latency for durability. Use it when losing a transaction is worse than slow commits.",
        "Replica lag is the number to watch. When it grows, your reads get stale.",
        "Multi-primary (active-active) is much harder — conflicts must be resolved somehow.",
      ],
    },
    {
      slug: 'sharding', number: '07', title: 'Sharding & Partitioning',
      blurb: 'Pick a shard strategy and watch data distribute across nodes — fairly or not.',
      Widget: W(initShardingWidget),
      intro: <>A single machine can only hold so much data. Sharding spreads the dataset across multiple machines using a key. The strategy you pick decides whether the load is balanced — and whether you can run cross-shard queries at all.</>,
      sections: [{
        heading: 'Three common strategies',
        body: (
          <ul>
            <li><strong>Range</strong> — keys 1–1000 on shard A, 1001–2000 on shard B. Range scans are local; hot ranges create hot shards.</li>
            <li><strong>Hash</strong> — hash(key) % N picks the shard. Even distribution; range scans need to hit every shard.</li>
            <li><strong>Consistent hashing</strong> — like hash, but adding/removing nodes only reshuffles a fraction of keys. The default for distributed caches.</li>
          </ul>
        ),
      }],
      takeaways: [
        "Range = local range scans, risk of hot shards.",
        "Hash = even load, but no range queries without a scatter-gather.",
        "Consistent hashing makes resharding cheap. Crucial for elastic systems.",
        "Cross-shard transactions are the hardest problem. Most systems just don't support them.",
      ],
    },
    {
      slug: 'query', number: '08', title: 'Query Execution',
      blurb: 'From SQL text to result set: parser → planner → executor, step by step.',
      Widget: QueryWidget,
      intro: <>SQL is declarative — you say what you want, the database figures out how. Three passes get from text to rows: parse the SQL, plan an execution strategy, run it.</>,
      sections: [{
        heading: 'The pipeline',
        body: (
          <ol>
            <li><strong>Parse</strong> — SQL string → abstract syntax tree.</li>
            <li><strong>Plan</strong> — pick join orders, indexes, sort strategies. The optimizer's job. Same query can have wildly different plans.</li>
            <li><strong>Execute</strong> — pull rows through the plan tree using the iterator (volcano) or vectorised model.</li>
          </ol>
        ),
      }],
      takeaways: [
        "EXPLAIN ANALYZE is your friend. Always know what plan the database picked.",
        "The optimizer relies on statistics. Stale stats → bad plans → slow queries. Re-analyze regularly.",
        "Index choice can change query time by 10000×. Pick wisely.",
        "Modern engines (DuckDB, ClickHouse, Snowflake) use vectorised execution — process batches of rows at a time, not one row.",
      ],
    },
    {
      slug: 'nosql', number: '09', title: 'NoSQL & Document Stores',
      blurb: 'Same data, three shapes. Relational, document, key-value. The query you write changes per model — so does the cost.',
      Widget: NoSqlWidget,
      intro: <>"NoSQL" lumps together everything that isn&apos;t a relational table. The real choice is data model: normalised tables, denormalised JSON documents, or single opaque blobs by key. Each fits a different query pattern; each pays a different denormalisation tax.</>,
      sections: [],
      takeaways: [
        "Relational: writes cheap, reads sometimes expensive (joins). Schema enforced.",
        "Document (Mongo, Dynamo, Firestore): nested structures are first-class. Joins are application-side.",
        "Key-value (Redis, Memcached, DynamoDB single-table): one round-trip per key. Schema-free.",
        "Pick by query shape, not by hype. The same workload at 10× scale may flip the right answer.",
      ],
    },
    {
      slug: 'mvcc', number: '10', title: 'MVCC (Multi-Version Concurrency Control)',
      blurb: 'Readers don\'t block writers. Writers don\'t block readers. The trick: every row has multiple versions tagged with TXIDs.',
      Widget: MvccWidget,
      intro: <>MVCC is the mechanism underneath snapshot isolation in every modern database. Each update creates a new version of the row stamped with a transaction ID; each transaction reads the snapshot consistent with its own start time. No read locks needed.</>,
      sections: [],
      takeaways: [
        "Each transaction sees a snapshot of the database as of its start (or its statement, depending on isolation).",
        "Updates write new versions instead of overwriting; old versions remain until VACUUM.",
        "Long-running transactions block VACUUM and cause table bloat — the classic Postgres ops problem.",
        "Serialisable snapshot isolation (SSI) layers conflict detection on top of MVCC for full serialisability.",
      ],
    },
    {
      slug: 'index-types', number: '11', title: 'Index Types Beyond B-Tree',
      blurb: 'Hash, GIN, GIST, Bloom. Each wins for a different query shape. Pick the right one and the query gets 1000× faster.',
      Widget: IndexTypesWidget,
      intro: <>B-tree is the default because it handles point lookups, ranges, and ordering. But for substring search, geo radius, JSON path, or set-containment queries, specialised indexes (GIN, GIST, Bloom) are dramatically faster — sometimes the difference between milliseconds and minutes.</>,
      sections: [],
      takeaways: [
        "B-tree: balanced, supports equality + range + ordering. The default for a reason.",
        "Hash: faster equality lookup, no range. Niche.",
        "GIN: inverted index. Good for full-text, array containment, JSONB path queries.",
        "GIST: generalised search tree. Good for geo (R-tree), trigram similarity, ranges.",
        "Bloom: probabilistic, tiny, fast negative check. Useful as a filter before a real lookup.",
      ],
    },
  ],
};
