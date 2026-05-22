// Compilers topic manifest — same shape as the vanilla version, plus the
// per-lesson content (sections, takeaways, widget component) so the lesson
// shell can render everything declaratively.

import LexerWidget from '../widgets/compilers/LexerWidget.jsx';
import ParserWidget from '../widgets/compilers/ParserWidget.jsx';
import AstWidget from '../widgets/compilers/AstWidget.jsx';
import TypesWidget from '../widgets/compilers/TypesWidget.jsx';
import IrWidget from '../widgets/compilers/IrWidget.jsx';
import OptimizationWidget from '../widgets/compilers/OptimizationWidget.jsx';
import RegallocWidget from '../widgets/compilers/RegallocWidget.jsx';
import CodegenWidget from '../widgets/compilers/CodegenWidget.jsx';

export const manifest = {
  slug: 'compilers',
  title: 'Compilers',
  tagline: 'How source code becomes something a CPU can run.',
  intro: (
    <>
      Eight passes between the file you wrote and the bytes the CPU runs.
      Lexer, parser, AST, type checker, IR, optimizer, register allocator,
      code generator — each step throws information away on purpose, and
      each step has a widget you can poke at.
    </>
  ),
  lessons: [
    {
      slug: 'lexer',
      number: '01',
      title: 'Lexer & Tokens',
      blurb: 'A stream of characters becomes a stream of tokens. The first transformation: text → atoms with meaning.',
      Widget: LexerWidget,
      intro: <>Source code is a flat string. The first job of a compiler is to chop it into <em>tokens</em> — atomic units like <code>let</code>, <code>x</code>, <code>=</code>, <code>42</code> — and tag each one with what kind of thing it is. Whitespace and comments get thrown away.</>,
      sections: [
        {
          heading: 'What the lexer does',
          body: (
            <>
              <p>It scans left-to-right with a tiny state machine, recognising patterns: a letter starts an identifier or keyword, a digit starts a number, a quote starts a string. Each match becomes a token. The lexer doesn't care what the program <em>means</em> yet — only what shapes the characters form.</p>
              <ul>
                <li><strong>Keywords</strong>: reserved words (<code>let</code>, <code>if</code>, <code>return</code>).</li>
                <li><strong>Identifiers</strong>: names you chose (<code>x</code>, <code>total</code>).</li>
                <li><strong>Literals</strong>: numbers, strings, booleans.</li>
                <li><strong>Operators &amp; punctuation</strong>: <code>+ - * / = ( ) {'{ } ;'}</code></li>
              </ul>
            </>
          ),
        },
      ],
      takeaways: [
        "The lexer's output is a flat sequence — no structure yet, just labelled atoms.",
        'Whitespace and comments are usually discarded here. Position info is kept for error messages.',
        'Most real lexers are generated from regex-like rules (flex, ANTLR) or hand-written for speed.',
        'Keywords are just identifiers that happen to be reserved — the lexer treats them specially.',
      ],
    },
    {
      slug: 'parser',
      number: '02',
      title: 'Parsing & Grammar',
      blurb: 'Tokens get shape. Precedence, associativity, and how a grammar turns "1+2*3" into a tree.',
      Widget: ParserWidget,
      intro: <>Tokens have no structure — just a flat list. The parser takes that list and discovers the tree hidden inside, guided by a <em>grammar</em>. Operator precedence and associativity decide which tree.</>,
      sections: [
        {
          heading: 'From flat to tree',
          body: (
            <>
              <p>For <code>1 + 2 * 3</code> the tokens are <code>[1, +, 2, *, 3]</code>. Should that be <code>(1+2)*3</code> or <code>1+(2*3)</code>? The grammar says <code>*</code> has higher precedence, so the parser builds <code>1 + (2*3)</code>. The shape of the tree is the meaning of the program.</p>
              <pre className="code-block">{`expr   → term ('+' | '-') term
term   → factor ('*' | '/') factor
factor → NUMBER | '(' expr ')'`}</pre>
            </>
          ),
        },
      ],
      takeaways: [
        'The same tokens can produce different trees — the grammar\'s structure picks one.',
        'Precedence (* binds tighter than +) and associativity (a-b-c = (a-b)-c) are encoded in the grammar.',
        'Parentheses let you override precedence — they push deeper into the tree.',
        'Real-world parsers: recursive descent (hand-written), Pratt (top-down with precedence), LR (table-driven, yacc/bison).',
      ],
    },
    {
      slug: 'ast',
      number: '03',
      title: 'Abstract Syntax Tree',
      blurb: 'Strip the syntax, keep the meaning. The shape every later pass actually walks.',
      Widget: AstWidget,
      intro: <>The parse tree mirrors the grammar exactly — including dummy nodes like "expression with no operator". The AST throws those away. Only the nodes that <em>do something</em> survive.</>,
      sections: [
        {
          heading: 'Parse tree vs AST',
          body: (
            <>
              <p>A parse tree (CST) records every grammar rule used: matched <code>expr</code>, descended into <code>term</code>, etc. An AST keeps only the semantically meaningful nodes — operators, literals, identifiers, control flow. Parentheses and semicolons vanish because the tree shape already encodes them.</p>
              <p>Every later pass — type checking, optimization, codegen — walks the AST, not the source string. The AST is the compiler's "real" representation of your program.</p>
            </>
          ),
        },
      ],
      takeaways: [
        'The AST is a compact, structural view — every node corresponds to a piece of program meaning.',
        'Many AST nodes carry attributes later passes attach: types, scopes, source positions.',
        'Different languages share node kinds: BinaryOp, Call, If, Return show up everywhere.',
        'Source-to-source tools (Babel, ESLint, Prettier) all run on ASTs. Once you have one, you can transform it back.',
      ],
    },
    {
      slug: 'types',
      number: '04',
      title: 'Type Checking',
      blurb: 'Walk the tree, decorate it with types, reject the programs that lie. Inference vs annotation.',
      Widget: TypesWidget,
      intro: <>Once the AST exists, the type checker walks it bottom-up: every leaf already has a type (literals, variables in scope), every operator computes its result type from its operands. Mismatches become errors.</>,
      sections: [
        {
          heading: 'Inference vs annotation',
          body: (
            <>
              <p>In languages like Java you write <code>int x = 1 + 2</code> — the compiler verifies. In Rust, Haskell, TypeScript with <code>const x = 1 + 2</code>, the compiler <em>infers</em> <code>x: i32</code> from the right-hand side. Same algorithm; just whether you wrote the answer down.</p>
              <p>Type errors caught here ("can't add a string to a number") are why static languages catch whole classes of bugs at compile time.</p>
            </>
          ),
        },
      ],
      takeaways: [
        'Types propagate bottom-up. Each node either accepts its children\'s types or fails.',
        'Implicit coercions (int → float in 1 + 2.0) are decided here, not at runtime.',
        'Generics & polymorphism push this further: types become variables (?T) that get unified across the tree.',
        'Type checking is a separate pass from parsing — the parser doesn\'t know what types anything has.',
      ],
    },
    {
      slug: 'ir',
      number: '05',
      title: 'IR & SSA Form',
      blurb: 'High-level trees become low-level instructions. Every variable assigned exactly once.',
      Widget: IrWidget,
      intro: <>The AST is still high-level — nested, machine-independent. The IR (intermediate representation) flattens it into three-address code: every instruction does one operation and writes one temporary. Then SSA renames things so each variable is assigned exactly once.</>,
      sections: [
        {
          heading: 'Three steps down the ladder',
          body: (
            <ul>
              <li><strong>Source.</strong> Nested expressions, scopes, syntax.</li>
              <li><strong>3-address IR.</strong> Each line: <code>t = a op b</code>. Sub-expressions get named temporaries.</li>
              <li><strong>SSA.</strong> Every name is defined exactly once. Reassigning <code>x</code> creates <code>x2</code>. Optimizations love this — knowing a definition can't be overwritten makes analysis trivial.</li>
            </ul>
          ),
        },
      ],
      takeaways: [
        'IR is machine-independent but already flat — it looks closer to assembly than to source.',
        'LLVM IR is the famous example; CPython has a bytecode IR; GCC has GIMPLE.',
        'SSA\'s "every variable defined once" property simplifies dataflow analysis.',
        'Control flow joins use phi nodes in SSA — explicit "this value comes from one of these predecessors".',
      ],
    },
    {
      slug: 'optimization',
      number: '06',
      title: 'Optimization Passes',
      blurb: 'Constant folding, dead code, common subexpressions. Each pass throws code away faster than you write it.',
      Widget: OptimizationWidget,
      intro: <>Most of an optimizing compiler's body weight is here. Each pass rewrites the IR to be smaller, faster, or both — usually by spotting that <em>something doesn't have to happen</em>.</>,
      sections: [
        {
          heading: 'The classic three',
          body: (
            <>
              <ul>
                <li><strong>Constant folding</strong> — compute literal-only expressions at compile time. <code>2 * 60 * 60</code> becomes <code>7200</code>.</li>
                <li><strong>Common subexpression elimination (CSE)</strong> — if <code>a*b</code> appears twice, compute it once into a temp.</li>
                <li><strong>Dead code elimination (DCE)</strong> — if a value is computed and never used, throw it out.</li>
              </ul>
              <p>Compilers run dozens of these — strength reduction, loop-invariant code motion, inlining, vectorization — usually in carefully ordered pipelines because passes feed each other.</p>
            </>
          ),
        },
      ],
      takeaways: [
        'Passes are local rewrites: spot a pattern, replace it with a better one.',
        'Order matters: constant folding exposes more dead code, which exposes more constant folding.',
        'Modern compilers run the pipeline to a fixed point — keep applying until nothing changes.',
        'The optimizer is why -O3 code looks nothing like the source you wrote.',
      ],
    },
    {
      slug: 'regalloc',
      number: '07',
      title: 'Register Allocation',
      blurb: 'Infinite virtual registers → 16 real ones. Live ranges, interference graphs, graph coloring.',
      Widget: RegallocWidget,
      intro: <>The IR uses infinite virtual registers. The CPU has 16. The register allocator maps the first set to the second, sharing real registers between variables that don't overlap in time.</>,
      sections: [
        {
          heading: 'Live ranges & interference',
          body: (
            <>
              <p>A variable is <em>live</em> from when it's defined to its last use. Two variables <em>interfere</em> if their live ranges overlap. Build a graph where nodes are variables and edges connect interferers, then <strong>graph-color</strong> the nodes with K colors (K = number of registers). Two variables that don't interfere can share a register.</p>
              <p>If a graph can't be colored with K, the allocator <em>spills</em> a variable to the stack — slow but always works.</p>
            </>
          ),
        },
      ],
      takeaways: [
        'Register allocation is graph coloring — NP-hard in general but easy on the graphs real programs produce.',
        'The fewer registers (small K), the harder it is to avoid spills.',
        'Spilling means storing to and reloading from RAM — orders of magnitude slower than a register hit.',
        'Linear-scan allocators (used in JITs) are faster but suboptimal; graph-coloring is used in AOT compilers like GCC.',
      ],
    },
    {
      slug: 'codegen',
      number: '08',
      title: 'Code Generation',
      blurb: 'IR becomes x86 / ARM / RISC-V. Instruction selection, calling conventions, the final emit.',
      Widget: CodegenWidget,
      intro: <>The final pass turns IR into actual instructions for an actual CPU. Same IR, different backends: pick x86-64, ARM64, or RISC-V and watch the same program emit different bytes.</>,
      sections: [
        {
          heading: 'What the backend does',
          body: (
            <ul>
              <li><strong>Instruction selection</strong> — match IR patterns to machine instructions. <code>x = a + 1</code> on x86 → <code>inc</code> or <code>add</code> depending on which is faster.</li>
              <li><strong>Register assignment</strong> — applies the allocation from the previous pass.</li>
              <li><strong>Calling conventions</strong> — which registers hold arguments, return values, what gets preserved across calls.</li>
              <li><strong>Encoding</strong> — emit actual bytes (an opcode table for the ISA).</li>
            </ul>
          ),
        },
      ],
      takeaways: [
        'One IR, many backends — that\'s why LLVM and GCC can target dozens of architectures from the same frontend.',
        'x86 is CISC (variable-length, complex addressing modes); ARM and RISC-V are RISC (fixed-length, simple).',
        'RISC-V has more registers than x86 — 32 vs 16 — so it sees fewer spills.',
        'After codegen, the assembler turns text mnemonics into actual machine code bytes — the same flow runs once more.',
      ],
    },
  ],
};
