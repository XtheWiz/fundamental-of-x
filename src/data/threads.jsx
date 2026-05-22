import WhyThreadsWidget from '../widgets/threads/WhyThreadsWidget.jsx';
import OSThreadsWidget from '../widgets/threads/OSThreadsWidget.jsx';
import GreenThreadsWidget from '../widgets/threads/GreenThreadsWidget.jsx';
import VirtualThreadsWidget from '../widgets/threads/VirtualThreadsWidget.jsx';
import GoroutinesWidget from '../widgets/threads/GoroutinesWidget.jsx';
import AsyncAwaitWidget from '../widgets/threads/AsyncAwaitWidget.jsx';
import SyncPrimitivesWidget from '../widgets/threads/SyncPrimitivesWidget.jsx';
import DeadlockWidget from '../widgets/threads/DeadlockWidget.jsx';

export const manifest = {
  slug: 'threads',
  title: 'Threads',
  intro: <>Eight lessons on application-level concurrency — OS threads, green threads, Java virtual threads (Project Loom), Go goroutines, async/await across three languages, sync primitives, and the classic failure modes.</>,
  lessons: [
    {
      slug: 'why-threads', number: '01', title: 'Why Threads?', blurb: 'Concurrency vs parallelism. Shared memory vs message passing.',
      Widget: WhyThreadsWidget,
      intro: <>Concurrency is about <em>structure</em> — multiple tasks in flight. Parallelism is about <em>execution</em> — multiple tasks running at the same instant. You can have either without the other.</>,
      sections: [{
        heading: 'Two models that compete',
        body: (
          <>
            <p><strong>Shared memory</strong> — threads see each other&apos;s variables directly. Fast, dangerous (races, deadlocks). Java, C++, .NET.</p>
            <p><strong>Message passing</strong> — isolated workers communicate via channels or queues. Safer, sometimes slower. Erlang, Go (mostly), Akka.</p>
            <p>Real systems mix both. The right default for new code is "isolate by default, share when you must."</p>
          </>
        ),
      }],
      takeaways: [
        'Concurrency ≠ parallelism. One CPU can still run concurrent tasks (just not in parallel).',
        'Shared memory: fast but unsafe by default. Locks everywhere.',
        'Message passing: safer, easier to reason about, often a bit slower.',
        'Most modern languages support both — choose per use case, not religiously.',
      ],
    },
    {
      slug: 'os-threads', number: '02', title: 'OS Threads', blurb: 'The classic model — kernel-scheduled, expensive to create, limited in count.',
      Widget: OSThreadsWidget,
      intro: <>An OS thread is a kernel-managed unit of execution: its own stack (typically 1 MB), its own scheduling slot. The CPU only has a handful of cores, so the kernel time-slices threads across them.</>,
      sections: [{
        heading: 'Why they cost so much',
        body: (
          <ul>
            <li><strong>Stack size:</strong> default ~1 MB per thread. 10,000 threads = 10 GB.</li>
            <li><strong>Context switch:</strong> ~1–10 μs per swap. Adds up at scale.</li>
            <li><strong>Kernel scheduling:</strong> every thread has to be visible to the OS.</li>
            <li>Result: most servers cap out around 1,000–10,000 active threads.</li>
          </ul>
        ),
      }],
      takeaways: [
        'OS thread = 1 MB stack + kernel scheduling slot. Real money.',
        'Context switches are expensive — both direct (TLB flush etc.) and indirect (cache pollution).',
        'A "thread pool" reuses threads instead of creating one per task — cheaper.',
        'Beyond ~10k threads, OS threads break down. That\'s why all the alternatives exist.',
      ],
    },
    {
      slug: 'green-threads', number: '03', title: 'Green Threads & Coroutines', blurb: 'User-space scheduling. A history lesson worth knowing.',
      Widget: GreenThreadsWidget,
      intro: <>"Green threads" were the original M:1 model — many user-mode threads multiplexed onto one OS thread by a runtime. Early Java tried it (and gave up). Coroutines are the modern revival.</>,
      sections: [{
        heading: 'The trade-off',
        body: (
          <>
            <p>Green threads are cheap to create (~2 KB stack) but suffer one fatal flaw on classic OSes: a blocking syscall blocks <em>every</em> green thread. That&apos;s why early Java abandoned them.</p>
            <p>Modern systems fix this with async-aware runtimes (Go, Loom) that detect blocking and steal the work to other OS threads. Coroutines without the trap.</p>
          </>
        ),
      }],
      takeaways: [
        'Green/fiber/coroutine: light-weight, runtime-scheduled, M:1 onto OS threads.',
        'The blocking-syscall problem is what killed the 1990s green-thread story.',
        'Erlang processes have been doing this right since 1986.',
        'Kotlin coroutines, Python asyncio, JS async/await are all flavours of this same idea.',
      ],
    },
    {
      slug: 'virtual-threads', number: '04', title: 'Virtual Threads (Project Loom)', blurb: 'Java\'s 2023 revival of cheap threads — done right.',
      Widget: VirtualThreadsWidget,
      intro: <>Java 21 brought virtual threads: same Thread API as before, but stacks are tiny (~1 KB) and the JVM multiplexes millions of them onto a small pool of carrier OS threads. Blocking calls don&apos;t block the carrier — Loom continuations rescue them.</>,
      sections: [{
        heading: 'Why this matters',
        body: (
          <p>Synchronous, sequential, blocking code regains the upper hand for server work. You write <code>Thread.sleep(1000)</code> in a request handler with a million in-flight requests, and it works. No need to rewrite everything as CompletableFuture chains.</p>
        ),
      }],
      takeaways: [
        'Virtual threads: tiny stack, M:N scheduled by the JVM.',
        '"Thread per request" becomes practical again, even for millions of requests.',
        'Existing Java code mostly just works — the API is unchanged.',
        'Pinning (synchronized blocks holding the carrier) is the gotcha to avoid.',
      ],
    },
    {
      slug: 'goroutines', number: '05', title: 'Go Goroutines', blurb: 'A scheduler in your runtime. Channels as the synchronisation primitive.',
      Widget: GoroutinesWidget,
      intro: <>Goroutines are Go&apos;s answer to the same problem: M:N green threads multiplexed onto OS threads by a work-stealing scheduler. Start one with the <code>go</code> keyword; they cost ~2 KB.</>,
      sections: [{
        heading: 'CSP, not shared memory',
        body: (
          <p>Go&apos;s motto: "Do not communicate by sharing memory; share memory by communicating." Goroutines coordinate via channels — typed, synchronised pipes. Easier to reason about than locks; sometimes slower at high contention.</p>
        ),
      }],
      takeaways: [
        'A goroutine is ~2 KB. You can have millions.',
        'GOMAXPROCS sets the number of OS threads (carriers).',
        'Channels block sender and receiver until both are ready (unbuffered).',
        'Work-stealing scheduler keeps cores busy without manual partitioning.',
      ],
    },
    {
      slug: 'async-await', number: '06', title: 'Async / Await', blurb: 'Same syntax, three very different runtimes.',
      Widget: AsyncAwaitWidget,
      intro: <>async/await is syntactic sugar for "pause here until this completes, but don&apos;t block the runtime." The runtime turns the function into a state machine that resumes when the awaited future is ready.</>,
      sections: [{
        heading: 'JavaScript, Rust, Python — same shape, different guts',
        body: (
          <ul>
            <li><strong>JS</strong> — single-threaded event loop. await yields to the loop.</li>
            <li><strong>Python (asyncio)</strong> — also single-threaded by default. Same model as JS.</li>
            <li><strong>Rust (tokio)</strong> — multi-threaded executor. await can resume on any worker thread.</li>
            <li>All three look almost identical in source. Performance and pitfalls differ wildly.</li>
          </ul>
        ),
      }],
      takeaways: [
        'await = "pause until this future resolves; in the meantime, let someone else run."',
        'Single-threaded async (JS, asyncio) eliminates data races. Trade-off: one CPU core.',
        'Multi-threaded async (Rust, .NET) needs Send + Sync types — back to thinking about safety.',
        '"Coloured functions" problem: async fns can only be called from async fns. Some languages reject this (Go, Loom).',
      ],
    },
    {
      slug: 'sync-primitives', number: '07', title: 'Synchronisation Primitives', blurb: 'Mutex, semaphore, channel, CAS — the toolbox.',
      Widget: SyncPrimitivesWidget,
      intro: <>When threads share data, they need rules to coordinate. The primitives layer from "very low-level, very fast" (atomics, CAS) up to "high-level, easy to reason about" (channels, actors).</>,
      sections: [{
        heading: 'The toolbox',
        body: (
          <ul>
            <li><strong>Mutex</strong> — one thread inside the critical section at a time.</li>
            <li><strong>Semaphore</strong> — up to N threads. Useful for rate-limited resources.</li>
            <li><strong>Read-write lock</strong> — many readers OR one writer.</li>
            <li><strong>Channel</strong> — typed FIFO, doubles as synchronisation.</li>
            <li><strong>Atomic / CAS</strong> — lock-free updates. Subtle but fast.</li>
          </ul>
        ),
      }],
      takeaways: [
        'Always lock in a consistent global order — otherwise deadlock.',
        'Hold the lock for as little code as possible.',
        'Prefer immutable data + channels over shared mutable state.',
        'CAS-based lock-free code is famously hard to get right. Use library primitives.',
      ],
    },
    {
      slug: 'deadlock', number: '08', title: 'Deadlock, Livelock & Starvation', blurb: 'Three ways concurrent programs hang. Animated.',
      Widget: DeadlockWidget,
      intro: <>Deadlock: each thread waits for a lock held by another. Livelock: threads keep moving but make no progress. Starvation: one thread never gets a turn. All three are silent killers in production.</>,
      sections: [{
        heading: 'The classic recipe for deadlock',
        body: (
          <p>Four conditions, all required: mutual exclusion (locks are exclusive), hold-and-wait (hold one, request another), no preemption (locks can&apos;t be forcibly released), circular wait (T1 wants T2&apos;s lock, T2 wants T1&apos;s). Break any one and deadlock is impossible.</p>
        ),
      }],
      takeaways: [
        'Lock ordering is the standard prevention: agree globally on a lock numbering, always acquire in order.',
        'Timeouts on lock acquisition are a pragmatic safety net.',
        'Livelock is sneakier — threads "back off" but in lockstep, doing nothing forever.',
        'Production: if your service hangs but CPU is busy, suspect livelock; if CPU is idle, suspect deadlock.',
      ],
    },
  ],
};
