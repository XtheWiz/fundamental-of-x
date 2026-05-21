// Operating Systems topic manifest.

export const manifest = {
  slug: 'operating-systems',
  title: 'Operating Systems',
  tagline: 'The kernel underneath everything you write.',
  lessons: [
    {
      slug: 'processes',
      title: 'Processes vs Threads',
      blurb: 'Same word, different boundaries. fork(), exec(), address spaces — and why threads are cheap but dangerous.',
    },
    {
      slug: 'scheduler',
      title: 'The Scheduler',
      blurb: 'Many tasks, few CPUs. Watch round-robin, priority, and CFS spread CPU time across competing processes.',
    },
    {
      slug: 'memory',
      title: 'Memory Allocation',
      blurb: 'malloc / free in slow motion. Watch a heap fragment, then defrag itself. Find the leak.',
    },
    {
      slug: 'syscalls',
      title: 'Syscalls',
      blurb: 'Your code runs in user mode; the kernel runs in ring 0. The trap that bridges them is the syscall.',
    },
    {
      slug: 'fd',
      title: 'File Descriptors & Pipes',
      blurb: 'In Unix everything is a file. Watch shell redirection rewire stdin and stdout via the FD table.',
    },
    {
      slug: 'concurrency',
      title: 'Concurrency Primitives',
      blurb: 'Two threads, one counter, racing. Wrap a mutex. Now deadlock yourself with two mutexes in the wrong order.',
    },
    {
      slug: 'ipc',
      title: 'Inter-Process Communication',
      blurb: 'Pipes, shared memory, sockets, signals — five ways for processes to talk, with very different speeds.',
    },
    {
      slug: 'containers',
      title: 'Containers (namespaces + cgroups)',
      blurb: 'What Docker actually is. Stack PID, network, mount namespaces; cap memory and CPU with cgroups.',
    },
  ],
};
