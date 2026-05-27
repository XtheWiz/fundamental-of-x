import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import TwoPCWidget from '../widgets/distributed-systems/TwoPCWidget.jsx';
import ArchitecturesWidget from '../widgets/distributed-systems/ArchitecturesWidget.jsx';
import CrdtsWidget from '../widgets/distributed-systems/CrdtsWidget.jsx';
import DistributedLocksWidget from '../widgets/distributed-systems/DistributedLocksWidget.jsx';
import ClocksTimeWidget from '../widgets/distributed-systems/ClocksTimeWidget.jsx';
import { initCapWidget } from '../widgets/distributed-systems/legacy/cap.js';
import { initConsistencyWidget } from '../widgets/distributed-systems/legacy/consistency.js';
import { initLeaderElectionWidget } from '../widgets/distributed-systems/legacy/leader-election.js';
import { initRaftWidget } from '../widgets/distributed-systems/legacy/raft.js';
import { initVectorClocksWidget } from '../widgets/distributed-systems/legacy/vector-clocks.js';
import { initGossipWidget } from '../widgets/distributed-systems/legacy/gossip.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'distributed-systems',
  title: 'Distributed Systems',
  intro: <>Eight lessons covering the hard parts of running anything on more than one machine — CAP, consensus, leader election, vector clocks, gossip protocols, and two-phase commit.</>,
  lessons: [
    { slug: 'cap', number: '01', title: 'CAP Theorem', blurb: 'Consistency, availability, partition tolerance — pick two.', Widget: W(initCapWidget),
      intro: <>When the network splits, you can answer with consistent data or stay available — not both. CAP is the formal statement of that trade-off.</>, sections: [],
      takeaways: ['Partitions are not optional — they will happen.', 'CP systems refuse writes when partitioned (e.g., HBase).', 'AP systems keep accepting writes and reconcile later (e.g., DynamoDB).', 'PACELC extends CAP to the no-partition case: latency vs consistency.'] },
    { slug: 'consistency', number: '02', title: 'Consistency Models', blurb: 'Strong, eventual, causal, read-your-writes — same write, four different reads.', Widget: W(initConsistencyWidget),
      intro: <>What does "I just wrote X" mean for the next read? Different models give different answers, with different costs.</>, sections: [],
      takeaways: ['Strong: every read sees the most recent write. Expensive across regions.', 'Eventual: reads catch up "eventually". Cheap, often surprising.', 'Causal: if A caused B, all observers see A before B.', 'Read-your-writes: a user always sees their own most recent write.'] },
    { slug: 'leader-election', number: '03', title: 'Leader Election', blurb: 'No leader? Hold an election. Watch five nodes time out, vote, and crown a winner.', Widget: W(initLeaderElectionWidget),
      intro: <>Many distributed protocols need a single coordinator. When one dies, the rest elect a new one — via timeouts, votes, and term numbers.</>, sections: [],
      takeaways: ['Heartbeats from the leader keep followers from triggering an election.', 'Random timeouts prevent everyone from starting an election at once.', 'A majority of votes is required to win — ensures one leader at a time.', 'Split-brain is the failure mode this prevents.'] },
    { slug: 'raft', number: '04', title: 'Raft Consensus', blurb: 'The leader proposes; followers ack; majority wins. Step through log replication with random failures.', Widget: W(initRaftWidget),
      intro: <>Paxos was right but unreadable. Raft is Paxos reorganized for humans — same guarantees, much easier to implement correctly.</>, sections: [],
      takeaways: ['Leader-based: only the leader accepts writes.', 'Log replication: leader appends, followers copy, majority commit.', 'Used by etcd, Consul, CockroachDB, TiKV, kRaft (Kafka).', 'A node never serves stale reads — it forwards to or checks with the leader.'] },
    { slug: 'vector-clocks', number: '05', title: 'Vector Clocks', blurb: 'There is no global clock. Vector clocks track who-saw-what-when across nodes.', Widget: W(initVectorClocksWidget),
      intro: <>Wall-clock time across nodes is unreliable. Vector clocks give a partial order: for any two events, we can tell if one happened-before the other, or if they\'re concurrent.</>, sections: [],
      takeaways: ['Each node keeps a counter; messages carry the sender\'s vector.', 'Receiver merges by taking per-component max, then increments its own.', 'A < B iff every component A[i] ≤ B[i] and at least one is <.', 'Used in Dynamo-style systems to detect conflicting writes.'] },
    { slug: 'gossip', number: '06', title: 'Gossip & Failure Detection', blurb: 'No coordinator, no broadcast — nodes whisper to random neighbours.', Widget: W(initGossipWidget),
      intro: <>Each node periodically picks a random peer and exchanges state. Information spreads logarithmically and tolerates any individual node\'s failure.</>, sections: [],
      takeaways: ['O(log N) rounds to reach every node.', 'No central point of failure — every node knows just its peers.', 'Used by Cassandra, Consul, Serf, Hashicorp memberlist.', 'Same protocol detects failures: missed heartbeats from peers mark them suspect.'] },
    { slug: '2pc', number: '07', title: 'Two-Phase Commit', blurb: 'Coordinator polls participants — all yes, commit; any no, abort.', Widget: TwoPCWidget,
      intro: <>Atomic commit across multiple participants. Phase 1 asks each "can you commit?", phase 2 tells them all to do it (or roll back).</>, sections: [],
      takeaways: ['All-or-nothing across nodes — the building block of distributed transactions.', 'Blocking: if the coordinator dies mid-protocol, participants are stuck.', 'Three-phase commit fixes this at the cost of more round-trips.', 'In practice, most modern systems use consensus protocols instead.'] },
    { slug: 'architectures', number: '08', title: 'Architectures in Practice', blurb: 'Cassandra, DynamoDB, Spanner, etcd — how real systems compose these primitives.', Widget: ArchitecturesWidget,
      intro: <>Each real database picks a point on the CAP triangle and stacks consistency, replication, and consensus primitives differently. Knowing the pattern lets you predict the trade-offs.</>, sections: [],
      takeaways: ['Cassandra/Dynamo: AP, eventual consistency, vector clocks.', 'Spanner: CP, strong consistency via TrueTime + Paxos.', 'etcd/Consul: CP, Raft, small datasets, high consistency needs.', 'Pick the database that matches your workload, not the one your team knows.'] },
    { slug: 'crdts', number: '09', title: 'CRDTs (Conflict-Free Replicated Data Types)',
      blurb: 'Two replicas, both write while partitioned, sync after. The math guarantees they converge.',
      Widget: CrdtsWidget,
      intro: <>CRDTs are data structures whose merge function is associative, commutative, and idempotent — which means independent updates from any number of replicas can be merged in any order without conflict. The modern answer to &quot;last-writer-wins loses data&quot;.</>,
      sections: [],
      takeaways: [
        'G-Counter: increment-only, merge by per-replica max. PN-Counter: pair of G-Counters for increment/decrement.',
        'OR-Set (observed-remove): tracks add-tags so concurrent add+remove resolves in favour of add.',
        'LWW-Register: timestamp + value; latest wins. Simple but loses concurrent edits.',
        'Production users: Riak, Redis CRDTs, Yjs/Automerge (collaborative editors), Figma\'s multiplayer.',
      ] },
    { slug: 'distributed-locks', number: '10', title: 'Distributed Locks',
      blurb: 'Locks across machines look easy. Then a GC pause makes one client think it still holds it. Use a fencing token.',
      Widget: DistributedLocksWidget,
      intro: <>A single-machine lock is solved. A distributed lock has to handle network partitions, clock skew, and processes that pause unexpectedly. Naive timeouts produce two holders; the fix is a monotonic fencing token that the protected resource validates on every write.</>,
      sections: [],
      takeaways: [
        'Naive SETNX + TTL: simple, but a GC-paused client can write after expiry believing it still holds the lock.',
        'Redlock (5 redis quorum): better availability, still vulnerable to clock skew per Kleppmann\'s critique.',
        'Zookeeper sequential ephemeral nodes: stronger, but heavier ops.',
        'Always combine with a fencing token — the resource refuses writes whose token < last accepted.',
      ] },
    { slug: 'clocks-time', number: '11', title: 'Clocks & Time',
      blurb: 'Wall clock skew. NTP corrections. TrueTime intervals. HLC. Why ordering events across machines is hard.',
      Widget: ClocksTimeWidget,
      intro: <>You cannot order events across machines by wall-clock timestamps alone. Clocks drift, jump backward on NTP correction, and disagree by tens of milliseconds across a datacentre. Modern systems use TrueTime intervals (Spanner), Hybrid Logical Clocks (CockroachDB), or causal logical clocks to give meaningful ordering.</>,
      sections: [],
      takeaways: [
        'Wall clocks drift and jump. Never trust raw timestamps for cross-node ordering.',
        'NTP corrects drift but can adjust backward — code that assumes monotonicity breaks.',
        'TrueTime: every timestamp is an interval; commit waits out the interval to ensure global order. Needs atomic clocks + GPS.',
        'HLC: monotonic combination of physical and logical clock. Bounded skew + preserves causality.',
      ] },
  ],
};
