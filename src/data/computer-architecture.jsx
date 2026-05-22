import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import { initPipelineWidget } from '../widgets/computer-architecture/legacy/pipeline.js';
import { initCacheWidget } from '../widgets/computer-architecture/legacy/cache.js';
import { initBranchPredictionWidget } from '../widgets/computer-architecture/legacy/branch-prediction.js';
import { initLocalityWidget } from '../widgets/computer-architecture/legacy/locality.js';
import { initVirtualMemoryWidget } from '../widgets/computer-architecture/legacy/virtual-memory.js';
import { initSimdWidget } from '../widgets/computer-architecture/legacy/simd.js';
import { initFalseSharingWidget } from '../widgets/computer-architecture/legacy/false-sharing.js';
import { initPerfModelWidget } from '../widgets/computer-architecture/legacy/perf-model.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'computer-architecture',
  title: 'Computer Architecture',
  intro: <>Eight lessons on why two semantically identical programs run at 10× different speeds — CPU pipelines, caches, branch prediction, memory locality, virtual memory, SIMD, multi-core gotchas, and the mental model to reason about performance.</>,
  lessons: [
    { slug: 'pipeline', number: '01', title: 'CPU Pipeline', blurb: 'Five stages, one instruction per cycle — when things go well.', Widget: W(initPipelineWidget),
      intro: <>Modern CPUs run several instructions at once, each at a different stage. Stalls happen when one instruction depends on another that hasn\'t finished.</>, sections: [],
      takeaways: ['Five canonical stages: fetch, decode, execute, memory, write-back.', 'Data hazard: next instruction needs result of previous. Stall or forward.', 'Modern x86 cores pipeline 14–20 stages and execute out-of-order.', 'Branches are the worst — a wrong prediction flushes the pipeline.'] },
    { slug: 'cache', number: '02', title: 'Cache Hierarchy', blurb: 'L1, L2, L3, RAM, SSD. If L1 takes a second, RAM takes 5 minutes.', Widget: W(initCacheWidget),
      intro: <>Memory access times span six orders of magnitude. Knowing roughly where your data lives is the difference between fast and slow code.</>, sections: [],
      takeaways: ['L1 cache: ~1 ns. L2: ~3 ns. L3: ~10 ns. RAM: ~100 ns. SSD: ~100 μs.', 'A miss at any level falls through to the next, slower one.', 'Cache lines are 64 bytes — when you touch one byte, you get all 64.', 'Algorithmic cache-friendliness often beats lower complexity in practice.'] },
    { slug: 'branch-prediction', number: '03', title: 'Branch Prediction', blurb: 'A loop body runs faster on the 1000th iteration than the first.', Widget: W(initBranchPredictionWidget),
      intro: <>The CPU guesses which way a branch will go and starts running that path. When right (and it usually is), it saves a stall.</>, sections: [],
      takeaways: ['Static prediction: backward branches predicted taken (loops), forward not.', 'Dynamic predictors track per-branch history.', 'Misprediction costs ~15 cycles — flushed pipeline.', 'Sorted data branches predictably; random data fights the predictor.'] },
    { slug: 'locality', number: '04', title: 'Memory Locality', blurb: 'Same data, two layouts. Array-of-structs vs struct-of-arrays.', Widget: W(initLocalityWidget),
      intro: <>Two ways to lay out a list of structs. Choose based on what your hot loop touches: whole records (AoS) or single fields (SoA).</>, sections: [],
      takeaways: ['AoS (array of structs): natural OOP layout, hits cache when you use whole records.', 'SoA (struct of arrays): better when you process one field over many records.', 'ECS game engines use SoA for the inner loops.', 'Compilers sometimes auto-rewrite, but rarely.'] },
    { slug: 'virtual-memory', number: '05', title: 'Virtual Memory', blurb: 'Every program thinks it owns all the RAM. Page tables make that lie work.', Widget: W(initVirtualMemoryWidget),
      intro: <>The MMU translates virtual addresses to physical pages on every memory access. The page table maps them; the TLB caches the recent translations.</>, sections: [],
      takeaways: ['Pages are typically 4 KB — translation granularity.', 'TLB miss adds ~50 ns. TLB misses on hot paths kill performance.', 'Huge pages (2 MB, 1 GB) shrink the TLB footprint.', 'Same virtual address in two processes maps to different physical RAM.'] },
    { slug: 'simd', number: '06', title: 'SIMD & Vectorization', blurb: 'One instruction, eight numbers at once.', Widget: W(initSimdWidget),
      intro: <>SIMD instructions operate on a vector of values. AVX2 does 8 32-bit ops per instruction; AVX-512 does 16. Massive speedups for the right loops.</>, sections: [],
      takeaways: ['Loops that do the same thing to many values are SIMD candidates.', 'Compilers auto-vectorize simple loops; complex ones need intrinsics.', 'Memory layout matters — SoA vectorizes much better than AoS.', 'WebAssembly, JIT compilers also emit SIMD when available.'] },
    { slug: 'false-sharing', number: '07', title: 'Multi-core & False Sharing', blurb: 'Four threads, four counters, one cache line.', Widget: W(initFalseSharingWidget),
      intro: <>Two cores updating different variables on the same cache line still fight over the line. The bug: scalability flatlines despite "independent" data.</>, sections: [],
      takeaways: ['Cache coherence keeps lines consistent across cores — but at a cost.', 'False sharing: independent variables, same line, contention.', 'Pad hot per-thread data to cache-line boundaries (align to 64 bytes).', 'Per-thread aggregates merged at the end beat shared atomics.'] },
    { slug: 'perf-model', number: '08', title: 'Performance Mental Model', blurb: 'A slow loop, profiled. Where the cycles actually go.', Widget: W(initPerfModelWidget),
      intro: <>Profile first, guess never. Most slow code is bottlenecked on memory, not CPU. The numbers to know fit on a napkin.</>, sections: [],
      takeaways: ['Always measure before optimising. Intuition is wrong more than half the time.', 'Memory hierarchy dominates. CPU cycles are mostly waiting on memory.', 'perf, vtune, Instruments — use the real tools.', 'Big-O still matters, but constant factors often matter more in practice.'] },
  ],
};
