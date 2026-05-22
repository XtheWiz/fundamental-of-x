import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import { initProcessesWidget } from '../widgets/operating-systems/legacy/processes.js';
import { initSchedulerWidget } from '../widgets/operating-systems/legacy/scheduler.js';
import { initMemoryWidget } from '../widgets/operating-systems/legacy/memory.js';
import { initSyscallsWidget } from '../widgets/operating-systems/legacy/syscalls.js';
import { initFdWidget } from '../widgets/operating-systems/legacy/fd.js';
import { initConcurrencyWidget } from '../widgets/operating-systems/legacy/concurrency.js';
import { initIpcWidget } from '../widgets/operating-systems/legacy/ipc.js';
import { initContainersWidget } from '../widgets/operating-systems/legacy/containers.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'operating-systems',
  title: 'Operating Systems',
  intro: <>Eight lessons walking the kernel surface — processes, threads, the scheduler, memory allocation, syscalls, file descriptors, concurrency primitives, IPC, and how containers are built from kernel features.</>,
  lessons: [
    { slug: 'processes', number: '01', title: 'Processes vs Threads', blurb: 'Same word, different boundaries. fork(), exec(), address spaces.', Widget: W(initProcessesWidget),
      intro: <>A process has its own address space; threads share one. The kernel schedules both, but the isolation cost is wildly different.</>, sections: [],
      takeaways: ['fork() clones the process; exec() replaces the running program in it.', 'Threads share heap, globals, and FDs — race conditions abound.', 'Process creation is ~1 ms, thread creation is ~10 μs. Use threads for parallelism within one program.', 'Coroutines/goroutines/async are user-space versions — even cheaper.'] },
    { slug: 'scheduler', number: '02', title: 'The Scheduler', blurb: 'Many tasks, few CPUs. Watch round-robin, priority, and CFS spread CPU time.', Widget: W(initSchedulerWidget),
      intro: <>The scheduler decides who runs next. Linux\'s CFS uses virtual runtime to keep all runnable tasks fair; priorities and cgroups bias the decision.</>, sections: [],
      takeaways: ['Round-robin: simple, fair, ignores priority. Used in nothing serious.', 'Priority: high-priority tasks always preempt — risk of starvation.', 'CFS: pick the task with the lowest virtual runtime so far. Fair but priority-aware.', 'Real-time schedulers (SCHED_FIFO) guarantee deadlines — at the cost of letting tasks hog the CPU.'] },
    { slug: 'memory', number: '03', title: 'Memory Allocation', blurb: 'malloc / free in slow motion.', Widget: W(initMemoryWidget),
      intro: <>The heap grows by mmap()ing pages from the kernel and handing out chunks. Fragmentation is the enemy — efficient allocators (jemalloc, tcmalloc) keep the heap dense.</>, sections: [],
      takeaways: ['malloc returns memory the kernel has reserved but not necessarily backed by RAM.', 'Free doesn\'t always give memory back to the OS — it returns to the allocator\'s free list.', 'Fragmentation: lots of free space, but no contiguous block big enough.', 'Modern allocators use thread-local arenas to avoid lock contention.'] },
    { slug: 'syscalls', number: '04', title: 'Syscalls', blurb: 'Your code runs in user mode; the kernel runs in ring 0. The trap that bridges them is the syscall.', Widget: W(initSyscallsWidget),
      intro: <>Every disk read, every network send, every fork — they all cross into the kernel via a syscall. The transition is expensive on purpose.</>, sections: [],
      takeaways: ['User mode can\'t directly touch hardware — must ask the kernel.', 'A syscall traps to ring 0, kernel handles it, returns. ~100 ns overhead each.', 'Batching syscalls is critical — io_uring, sendfile, splice.', 'strace shows every syscall a program makes. Worth running on confusing apps.'] },
    { slug: 'fd', number: '05', title: 'File Descriptors & Pipes', blurb: 'In Unix everything is a file.', Widget: W(initFdWidget),
      intro: <>Every open file, socket, pipe, and device gets a small integer — the file descriptor. The kernel keeps a table mapping FD → kernel object per process.</>, sections: [],
      takeaways: ['stdin=0, stdout=1, stderr=2 by convention.', 'dup2 redirects an FD to point at another — the basis of shell redirection.', 'Pipes are pairs of FDs: write to one, read from the other.', 'Forgetting to close FDs leaks them — eventually you hit ulimit.'] },
    { slug: 'concurrency', number: '06', title: 'Concurrency Primitives', blurb: 'Two threads, one counter, racing. Wrap a mutex.', Widget: W(initConcurrencyWidget),
      intro: <>Shared mutable state across threads is the source of most bugs. Mutexes serialize access; condition variables let threads wait for state changes.</>, sections: [],
      takeaways: ['Atomicity: read-modify-write must be one indivisible operation.', 'Mutex: only one thread inside the critical section.', 'Always lock in the same global order — otherwise you deadlock.', 'Lock-free structures (CAS, RCU) avoid mutex contention but are very hard to get right.'] },
    { slug: 'ipc', number: '07', title: 'Inter-Process Communication', blurb: 'Pipes, shared memory, sockets, signals.', Widget: W(initIpcWidget),
      intro: <>Processes need to talk. Choose the mechanism by latency, bandwidth, and whether you need the kernel to mediate.</>, sections: [],
      takeaways: ['Pipes/FIFOs: byte streams, kernel buffered. Easy.', 'Shared memory: fastest possible. Need your own locking.', 'Unix domain sockets: like TCP but local — supports passing FDs.', 'Signals: short notification, no payload. Easy to mess up.'] },
    { slug: 'containers', number: '08', title: 'Containers (namespaces + cgroups)', blurb: 'What Docker actually is.', Widget: W(initContainersWidget),
      intro: <>Containers aren\'t VMs. They\'re processes with restricted views of the kernel — namespaces hide what they can see, cgroups cap what they can use.</>, sections: [],
      takeaways: ['Namespaces: PID, mount, network, user, UTS, IPC. Each hides part of the host.', 'cgroups: CPU shares, memory limits, IO throttling.', 'Docker = namespaces + cgroups + a layered filesystem + a packaging format.', 'Containers share the host kernel — VMs do not. Faster, less isolated.'] },
  ],
};
