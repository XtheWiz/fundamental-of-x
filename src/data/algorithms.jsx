import BigOWidget from '../widgets/algorithms/BigOWidget.jsx';
import SortingWidget from '../widgets/algorithms/SortingWidget.jsx';
import SearchingWidget from '../widgets/algorithms/SearchingWidget.jsx';
import GraphTraversalWidget from '../widgets/algorithms/GraphTraversalWidget.jsx';
import ShortestPathsWidget from '../widgets/algorithms/ShortestPathsWidget.jsx';
import DPWidget from '../widgets/algorithms/DPWidget.jsx';
import GreedyVsDPWidget from '../widgets/algorithms/GreedyVsDPWidget.jsx';
import RandomizedWidget from '../widgets/algorithms/RandomizedWidget.jsx';

export const manifest = {
  slug: 'algorithms',
  title: 'Algorithms',
  intro: <>Eight lessons on the algorithms worth knowing in your bones — what each one looks like running, where constants beat asymptotics, and why "just sort it" isn&apos;t always the right answer.</>,
  lessons: [
    {
      slug: 'bigo', number: '01', title: 'Big-O in Practice', blurb: 'When constants beat asymptotic, when they don\'t. A reality check on the math.',
      Widget: BigOWidget,
      intro: <>Big-O describes how runtime grows with input size — not how fast something is at any particular N. Constants and cache behaviour often dominate at the sizes that matter.</>,
      sections: [{
        heading: 'Same N, very different times',
        body: (
          <>
            <p>A 100× constant factor means O(n²) wins over O(n log n) until N is huge. At N=100, 100·n² = 1,000,000 and 1·n·log n ≈ 664 — but if the n log n algorithm has a 100× constant, they tie around N=70.</p>
            <p>This is why insertion sort beats quicksort on small arrays, and most "fast" sorts switch to insertion sort for N ≤ ~16. The asymptotic loser wins the small fight.</p>
          </>
        ),
      }],
      takeaways: [
        'O(f(n)) tells you the shape, not the height of the curve.',
        'Memory hierarchy (cache, RAM, disk) introduces 10^6 multipliers Big-O can\'t see.',
        'Always know the N you care about. Asymptotic only matters if you\'re in the asymptote.',
        'Profile before optimising — intuition about constants is wrong more often than right.',
      ],
    },
    {
      slug: 'sorting', number: '02', title: 'Sorting', blurb: 'Quicksort, mergesort, heapsort, insertion. Race them on the same array.',
      Widget: SortingWidget,
      intro: <>Sorting is the canonical algorithm demo because the state is a picture. Watch four classics work the same array and you can feel which one is fast.</>,
      sections: [{
        heading: 'Comparison vs O(n log n)',
        body: (
          <>
            <p>Comparison-based sorts can&apos;t beat O(n log n) — proven by an information-theoretic lower bound. Counting sort and radix sort do beat it, by not comparing keys at all (they bucket by value).</p>
            <p>Stability matters too: a stable sort preserves the order of equal keys. Mergesort is stable; quicksort isn&apos;t (by default).</p>
          </>
        ),
      }],
      takeaways: [
        'Quicksort: fast average, O(n²) worst case. Real implementations randomise the pivot.',
        'Mergesort: O(n log n) guaranteed, stable, but allocates O(n) extra memory.',
        'Heapsort: O(n log n), in-place, but cache-unfriendly.',
        'Insertion sort wins for small N — that\'s why hybrids (Timsort, introsort) use it as the base case.',
      ],
    },
    {
      slug: 'searching', number: '03', title: 'Searching & Hashing', blurb: 'Binary search vs hash tables. Where each one wins.',
      Widget: SearchingWidget,
      intro: <>Binary search needs sorted data and gives O(log n) lookups. Hash tables don&apos;t need order and give O(1) average — but with collisions and resize costs.</>,
      sections: [{
        heading: 'When to use which',
        body: (
          <ul>
            <li><strong>Binary search</strong> — sorted array, range queries, predecessor / successor. Pure compute, cache-friendly.</li>
            <li><strong>Hash table</strong> — unordered lookup, fast on average, awful worst case under adversarial input.</li>
            <li><strong>BSTs</strong> — sorted iteration + fast lookup, but pointer-heavy and slow on modern CPUs.</li>
          </ul>
        ),
      }],
      takeaways: [
        'Binary search: O(log n), needs sorted input, plays nicely with cache.',
        'Hash table: O(1) average, O(n) worst case. Resize is amortised away.',
        'Hash functions must be cheap AND well-distributed. SipHash for general use.',
        'B-trees beat BSTs on disk; for in-memory, hash + sorted array often beats both.',
      ],
    },
    {
      slug: 'graph-traversal', number: '04', title: 'Graph Traversal (BFS/DFS)', blurb: 'Two traversal orders, two data structures, very different uses.',
      Widget: GraphTraversalWidget,
      intro: <>BFS uses a queue and explores level by level — shortest path in unweighted graphs. DFS uses a stack (or recursion) and goes deep before wide — cycle detection, topological sort.</>,
      sections: [{
        heading: 'Same nodes, different orders',
        body: (
          <p>The choice of queue vs stack is the whole difference. BFS finds nearest-first, DFS finds deepest-first. Both visit every node once → O(V+E). Step the widget and watch each frontier expand.</p>
        ),
      }],
      takeaways: [
        'BFS = queue, level-order. Use for unweighted shortest path.',
        'DFS = stack/recursion, depth-first. Use for cycle detection, topological sort, connectivity.',
        'Both are O(V + E) time and space.',
        'On a tree (no cycles), BFS = level-order traversal; DFS = preorder.',
      ],
    },
    {
      slug: 'shortest-paths', number: '05', title: 'Shortest Paths', blurb: 'Dijkstra and A*, side by side. How a good heuristic earns its keep.',
      Widget: ShortestPathsWidget,
      intro: <>Dijkstra is BFS with a priority queue — always expand the cheapest-so-far node. A* adds a heuristic estimate of the remaining distance, focusing search toward the goal.</>,
      sections: [{
        heading: 'Why heuristics help',
        body: (
          <p>Dijkstra explores in concentric rings around the start, wasting work on nodes far from the goal. A* with an admissible heuristic (never overestimates) explores a thin corridor between start and goal — the same answer, much less compute.</p>
        ),
      }],
      takeaways: [
        'Dijkstra: O((V+E) log V) with a heap. Requires non-negative edge weights.',
        'Bellman-Ford handles negative weights but is O(V·E) — slower.',
        'A*\'s heuristic must be admissible (never overestimate true cost) to guarantee optimal.',
        'A* with h=0 degenerates to Dijkstra. With perfect h, it visits only the shortest path.',
      ],
    },
    {
      slug: 'dp', number: '06', title: 'Dynamic Programming', blurb: 'Edit distance between two strings. Watch the memo table fill in.',
      Widget: DPWidget,
      intro: <>DP solves problems by combining solutions to overlapping subproblems. Edit distance asks: how many insertions, deletions, and substitutions turn string A into string B? The whole computation is a 2D table.</>,
      sections: [{
        heading: 'Memoisation vs tabulation',
        body: (
          <ul>
            <li><strong>Memoisation</strong> — top-down recursion + cache. Easy to write from a recurrence.</li>
            <li><strong>Tabulation</strong> — bottom-up loop, fill the table in dependency order.</li>
            <li>Same time complexity; tabulation usually wins on constants (no recursion overhead).</li>
          </ul>
        ),
      }],
      takeaways: [
        'DP applies when subproblems repeat and have optimal substructure.',
        'Edit distance, longest common subsequence, knapsack — all 2D-table DPs.',
        'Time and space both O(n·m) for 2D — sometimes space is reducible to O(min(n,m)).',
        'If you can\'t see the recurrence, the DP is wrong. The recurrence is the algorithm.',
      ],
    },
    {
      slug: 'greedy-vs-dp', number: '07', title: 'Greedy vs DP', blurb: 'Coin change: when greedy works, when it doesn\'t.',
      Widget: GreedyVsDPWidget,
      intro: <>Greedy picks the locally best option at each step. It&apos;s fast and simple — but only correct when the problem has the right structure. Coin change is the classic counter-example.</>,
      sections: [{
        heading: 'When greedy is correct',
        body: (
          <p>Greedy works when local choices compose to a global optimum — matroid problems, MST, Huffman coding, interval scheduling. For coin change with arbitrary denominations, it doesn&apos;t: with coins {`{1, 3, 4}`} and target 6, greedy gives 4+1+1 (3 coins) while DP gives 3+3 (2 coins).</p>
        ),
      }],
      takeaways: [
        'Greedy: O(n log n) typically. Easy to write, easy to be wrong.',
        'DP: slower but always optimal when the problem has optimal substructure.',
        'Standard "denominations" used in real currency are designed so greedy works.',
        'When in doubt, prove greedy is correct (exchange argument) — or fall back to DP.',
      ],
    },
    {
      slug: 'randomized', number: '08', title: 'Randomized & Approximation', blurb: 'Bloom filter: a probabilistic set with no false negatives.',
      Widget: RandomizedWidget,
      intro: <>Some problems are easier if you accept a small chance of being wrong. Bloom filters trade certainty for huge space savings — useful for "is this URL in our blocklist of 100M?"</>,
      sections: [{
        heading: 'No false negatives, controllable false positives',
        body: (
          <p>A Bloom filter hashes each inserted item into k positions of a bit array and sets those bits. A lookup checks those same k positions. All set → "probably in"; any unset → "definitely not in". The "probably" rate depends on filter size and number of hashes.</p>
        ),
      }],
      takeaways: [
        'Bloom filters never give false negatives. False positives are tunable.',
        'About 10 bits per item gets ~1% false positive rate.',
        'You can\'t remove items from a standard Bloom filter (counting variants can).',
        'Same family: HyperLogLog (cardinality), MinHash (similarity), Count-Min Sketch (frequencies).',
      ],
    },
  ],
};
