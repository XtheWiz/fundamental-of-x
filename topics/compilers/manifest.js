// Compilers topic manifest.

export const manifest = {
  slug: 'compilers',
  title: 'Compilers',
  tagline: 'How source code becomes something a CPU can run.',
  lessons: [
    { slug: 'lexer',        title: 'Lexer & Tokens',         blurb: 'A stream of characters becomes a stream of tokens. The first transformation: text → atoms with meaning.' },
    { slug: 'parser',       title: 'Parsing & Grammar',      blurb: 'Tokens get shape. Precedence, associativity, and how a grammar turns "1+2*3" into a tree.' },
    { slug: 'ast',          title: 'Abstract Syntax Tree',   blurb: 'Strip the syntax, keep the meaning. The shape every later pass actually walks.' },
    { slug: 'types',        title: 'Type Checking',          blurb: 'Walk the tree, decorate it with types, reject the programs that lie. Inference vs annotation.' },
    { slug: 'ir',           title: 'IR & SSA Form',          blurb: 'High-level trees become low-level instructions. Every variable assigned exactly once.' },
    { slug: 'optimization', title: 'Optimization Passes',    blurb: 'Constant folding, dead code, common subexpressions. Each pass throws code away faster than you write it.' },
    { slug: 'regalloc',     title: 'Register Allocation',    blurb: 'Infinite virtual registers → 16 real ones. Live ranges, interference graphs, graph coloring.' },
    { slug: 'codegen',      title: 'Code Generation',        blurb: 'IR becomes x86 / ARM / RISC-V. Instruction selection, calling conventions, the final emit.' },
  ],
};
