import BigOWidget from '../widgets/algorithms/BigOWidget.jsx';
import SortingWidget from '../widgets/algorithms/SortingWidget.jsx';
import SearchingWidget from '../widgets/algorithms/SearchingWidget.jsx';
import TreesWidget from '../widgets/algorithms/TreesWidget.jsx';
import HeapsWidget from '../widgets/algorithms/HeapsWidget.jsx';
import GraphTraversalWidget from '../widgets/algorithms/GraphTraversalWidget.jsx';
import ShortestPathsWidget from '../widgets/algorithms/ShortestPathsWidget.jsx';
import UnionFindWidget from '../widgets/algorithms/UnionFindWidget.jsx';
import DPWidget from '../widgets/algorithms/DPWidget.jsx';
import GreedyVsDPWidget from '../widgets/algorithms/GreedyVsDPWidget.jsx';
import BacktrackingWidget from '../widgets/algorithms/BacktrackingWidget.jsx';
import TriesWidget from '../widgets/algorithms/TriesWidget.jsx';
import StringAlgosWidget from '../widgets/algorithms/StringAlgosWidget.jsx';
import RandomizedWidget from '../widgets/algorithms/RandomizedWidget.jsx';

export const manifest = {
  slug: 'algorithms',
  title: 'Algorithms',
  intro: <>Fourteen lessons covering the algorithms worth knowing in your bones — analysis, data structures (trees, heaps, tries, union-find), graphs, dynamic programming, greedy, backtracking, string matching, and randomised techniques. What each one looks like running, where constants beat asymptotics, and why "just sort it" isn&apos;t always the right answer.</>,
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
      slug: 'trees', number: '04', title: 'Trees (BST, AVL, Red-Black)',
      blurb: 'Insert sorted keys into a plain BST — watch it degrade into a linked list. AVL and red-black hold their height.',
      Widget: TreesWidget,
      intro: <>A binary search tree gives sorted iteration and O(log n) lookup — until adversarial input turns it into a linked list. AVL and red-black trees rebalance on insert/delete to keep height logarithmic, paying a small constant for guarantees.</>,
      sections: [],
      takeaways: [
        'Plain BST: O(log n) average, O(n) worst case (sorted input is the killer).',
        'AVL: strict balance (heights differ by ≤1). Fastest lookups, more rotations on writes.',
        'Red-black: looser balance, fewer rotations. The default in std::map, Java TreeMap, Linux scheduler.',
        'B-trees (covered in Database) are the disk-friendly generalisation — fewer levels, wider nodes.',
      ],
    },
    {
      slug: 'heaps', number: '05', title: 'Heaps & Priority Queues',
      blurb: 'A complete binary tree where the smallest (or largest) value is always at the root. Backed by an array.',
      Widget: HeapsWidget,
      intro: <>Heaps are the data structure under priority queues. Insert and extract-root in O(log n); the tree is complete, so it fits an array with index arithmetic instead of pointers.</>,
      sections: [],
      takeaways: [
        'Heap property: parent ≤ children (min-heap) or parent ≥ children (max-heap).',
        'Insert: append + sift up. Extract: swap root with last + sift down. Both O(log n).',
        'Build heap from N items in O(n) via Floyd\'s heapify (not n log n).',
        'Used everywhere: Dijkstra, A*, top-K, event schedulers, OS run queues.',
      ],
    },
    {
      slug: 'graph-traversal', number: '06', title: 'Graph Traversal (BFS/DFS)', blurb: 'Two traversal orders, two data structures, very different uses.',
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
      slug: 'shortest-paths', number: '07', title: 'Shortest Paths', blurb: 'Dijkstra and A*, side by side. How a good heuristic earns its keep.',
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
      slug: 'union-find', number: '08', title: 'Union-Find (Disjoint Set)',
      blurb: 'Track connected components in near-constant time. The data structure under Kruskal\'s MST and cycle detection.',
      Widget: UnionFindWidget,
      intro: <>A forest of pointers where each tree represents one component. With union-by-rank and path compression, the operations are effectively O(α(n)) — the inverse Ackermann function, which is ≤ 4 for any N you\'ll meet.</>,
      sections: [],
      takeaways: [
        'Find: walk up parent pointers to the root. Union: hook one root under the other.',
        'Union-by-rank keeps the trees shallow.',
        'Path compression flattens the tree on every Find — almost free amortised.',
        'Used in Kruskal\'s MST, cycle detection in undirected graphs, image-flood-fill, percolation models.',
      ],
    },
    {
      slug: 'dp', number: '09', title: 'Dynamic Programming', blurb: 'Edit distance between two strings. Watch the memo table fill in.',
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
      slug: 'greedy-vs-dp', number: '10', title: 'Greedy vs DP', blurb: 'Coin change: when greedy works, when it doesn\'t.',
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
      slug: 'backtracking', number: '11', title: 'Backtracking',
      blurb: 'DFS with pruning. N-queens, subset sum, sudoku — same algorithm shape, different problems.',
      Widget: BacktrackingWidget,
      intro: <>Backtracking explores a tree of partial solutions, abandoning any branch that can\'t possibly succeed. The pruning step is what makes it tractable — without it, the search space explodes.</>,
      sections: [],
      takeaways: [
        'Backtracking is DFS over the solution space, with a "is this branch still viable?" check at each node.',
        'The pruning predicate is the algorithm. A weak one means exponential blowup.',
        'Pattern: choose → recurse → un-choose. The "un-choose" is the backtrack.',
        'Applies to constraint satisfaction (sudoku), combinatorial enumeration (subsets, permutations), and search (N-queens, maze solving).',
      ],
    },
    {
      slug: 'tries', number: '12', title: 'Tries',
      blurb: 'A tree where each edge is a character. Prefix lookup in O(length), regardless of dictionary size.',
      Widget: TriesWidget,
      intro: <>A trie (pronounced "try") shares prefixes across stored words. Lookup time depends on the length of the query, not the number of stored words — the trick that powers autocomplete, IP routing tables, and the Aho-Corasick multi-pattern matcher.</>,
      sections: [],
      takeaways: [
        'Trie lookup: O(L) where L is the query length. Independent of stored-word count.',
        'Memory: one node per (prefix, character) pair. Common prefixes share nodes.',
        'Radix / Patricia tries compress single-child chains — same complexity, less storage.',
        'Beyond autocomplete: IP routing (longest prefix match), genome k-mer indexing, dictionary compression.',
      ],
    },
    {
      slug: 'string-algos', number: '13', title: 'String Algorithms (KMP, Rabin-Karp)',
      blurb: 'Substring search done right. Skip redundant comparisons with a failure function or a rolling hash.',
      Widget: StringAlgosWidget,
      intro: <>Naive substring search is O(nm). KMP precomputes a failure table to skip impossible alignments — O(n+m). Rabin-Karp uses a rolling hash to compare windows in O(1) amortised — also O(n+m) average, useful for multi-pattern search.</>,
      sections: [],
      takeaways: [
        'Naive search: O(nm). KMP and Rabin-Karp both achieve O(n+m).',
        'KMP\'s failure function tells you how far the pattern can shift on mismatch without re-scanning.',
        'Rabin-Karp: hash the window, slide cheaply via the rolling hash, verify on match.',
        'Aho-Corasick generalises KMP to many patterns at once — the engine under tools like grep -F.',
      ],
    },
    {
      slug: 'randomized', number: '14', title: 'Randomized & Approximation', blurb: 'Bloom filter: a probabilistic set with no false negatives.',
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
