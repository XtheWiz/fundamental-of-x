// Curated subject list for the home page, grouped into three categories.
// `to` is an internal React route; `href` is a static URL for not-yet-ported
// vanilla topics. The home renderer picks the right one per card.

const C = (title, body, slug, ported = false) => ({
  title,
  body,
  slug,
  ported,
  href: `/topics/${slug}/index.html`,
  to: `/topics/${slug}`,
});

export const CATEGORIES = [
  {
    key: 'software',
    label: 'Software & Systems',
    subjects: [
      C('Database', 'Where does your SELECT * actually go? Step inside the engine — ACID, B-Trees, replication, query planning — all live.', 'database'),
      C('Internet', 'Type a URL, hit Enter. Watch packets leave your machine and find their way back. IP, TCP, DNS, TLS — all animated.', 'internet'),
      C('Backend', 'Once a request lands on your server, what happens next? Routing, middleware, caching, rate limiting — every step lit up.', 'backend'),
      C('Messaging', 'Brokers, queues, topics, partitions — drag messages around and see how Kafka, RabbitMQ, SQS actually differ.', 'messaging'),
      C('Distributed Systems', 'Watch nodes vote, argue, partition, and recover. Raft, CAP, leader election, gossip — all running live.', 'distributed-systems'),
      C('Cryptography', "What's really happening inside a TLS handshake? Hashing, signatures, key exchange, certificates — animated step by step.", 'cryptography'),
      C('Design Patterns', 'Strategy, Observer, Factory, DI, CQRS — names for refactoring intent. The GoF classics, plus the patterns the book missed.', 'design-patterns'),
      C('Operating Systems', "What's the kernel actually doing under your code? Processes, threads, syscalls, memory, IPC, containers — all visible.", 'operating-systems'),
    ],
  },
  {
    key: 'cs',
    label: 'Computer Science',
    subjects: [
      C('Computer Architecture', 'Why are two identical programs 10× different in speed? CPU pipelines, caches, branch prediction — the silicon underneath.', 'computer-architecture'),
      C('Compilers', 'How does the file you wrote become bytes the CPU runs? Lexer, parser, AST, IR, optimization, codegen — every pass, interactive.', 'compilers', true),
      C('Machine Learning', 'Watch gradient descent climb. Train a tiny neural net one frame at a time. Regression, classification, k-means — all live.', 'machine-learning'),
      { ...C('Transformers & LLMs', 'Tokens go in, attention happens, words come out. See exactly what a transformer does to your prompt — one matmul at a time.', 'transformers'), title: 'Transformers & LLMs' },
      C('Quantum Computing', 'Spin a qubit on the Bloch sphere. Make two of them entangle. Gates, circuits, Grover, Shor — the math made tangible.', 'quantum-computing'),
    ],
  },
  {
    key: 'science',
    label: 'Science & Engineering',
    subjects: [
      C('Light', 'Bend it. Reflect it. Split it through a prism. The physics of light through interactive optics experiments.', 'light'),
      C('Solar Cell', 'How does a photon turn into electricity? Bandgaps, P-N junctions, Shockley-Queisser — physics behind every rooftop panel.', 'solar-cell'),
      C('Energy Systems', 'Watch a power grid balance supply and demand in real time. The duck curve, storage arbitrage, frequency — by the numbers.', 'energy-systems'),
      C('Electric Vehicles', 'Strip a Tesla or BYD down to principles. Battery chemistry, BMS, motors, regen, charging curves — electrons to motion.', 'electric-vehicles'),
      C('Genetics', "DNA's molecular machinery — replication, transcription, translation, mutations, sequencing, CRISPR. Life as a program in four letters.", 'genetics'),
    ],
  },
];
