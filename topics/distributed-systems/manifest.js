// Distributed Systems topic manifest.

export const manifest = {
  slug: 'distributed-systems',
  title: 'Distributed Systems',
  tagline: 'How many machines pretend to be one — and the protocols that make it work.',
  lessons: [
    {
      slug: 'cap',
      title: 'CAP Theorem',
      blurb: 'Consistency, availability, partition tolerance — pick two. Drag the partition slider and watch your system make the choice.',
    },
    {
      slug: 'consistency',
      title: 'Consistency Models',
      blurb: 'Strong, eventual, causal, read-your-writes — same write, four different reads depending on the model.',
    },
    {
      slug: 'leader-election',
      title: 'Leader Election',
      blurb: 'No leader? Hold an election. Watch five nodes time out, vote, and crown a winner — then kill the winner.',
    },
    {
      slug: 'raft',
      title: 'Raft Consensus',
      blurb: 'The leader proposes; followers ack; majority wins. Step through log replication with random failures.',
    },
    {
      slug: 'vector-clocks',
      title: 'Vector Clocks',
      blurb: 'There is no global clock in a distributed system. Vector clocks track who-saw-what-when across nodes.',
    },
    {
      slug: 'gossip',
      title: 'Gossip & Failure Detection',
      blurb: 'No coordinator, no broadcast — just nodes whispering to random neighbours. Watch a rumour spread.',
    },
    {
      slug: '2pc',
      title: 'Two-Phase Commit',
      blurb: 'Coordinator polls participants — all yes, commit; any no, abort. See what happens when a node crashes mid-protocol.',
    },
    {
      slug: 'architectures',
      title: 'Architectures in Practice',
      blurb: 'Cassandra, DynamoDB, Spanner, etcd — how real systems compose these primitives.',
    },
  ],
};
