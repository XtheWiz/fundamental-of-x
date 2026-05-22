// Compilers topic manifest. Titles and blurbs reference i18n keys; shell.js
// resolves them via t(). English keeps fallback values for any consumer
// (e.g. raw script) that bypasses i18n.

export const manifest = {
  slug: 'compilers',
  titleKey: 'compilers.title',
  title: 'Compilers',
  tagline: 'How source code becomes something a CPU can run.',
  lessons: [
    { slug: 'lexer',        titleKey: 'compilers.lessons.lexer.title',        blurbKey: 'compilers.lessons.lexer.blurb',        title: 'Lexer & Tokens',         blurb: 'A stream of characters becomes a stream of tokens. The first transformation: text → atoms with meaning.' },
    { slug: 'parser',       titleKey: 'compilers.lessons.parser.title',       blurbKey: 'compilers.lessons.parser.blurb',       title: 'Parsing & Grammar',      blurb: 'Tokens get shape. Precedence, associativity, and how a grammar turns "1+2*3" into a tree.' },
    { slug: 'ast',          titleKey: 'compilers.lessons.ast.title',          blurbKey: 'compilers.lessons.ast.blurb',          title: 'Abstract Syntax Tree',   blurb: 'Strip the syntax, keep the meaning. The shape every later pass actually walks.' },
    { slug: 'types',        titleKey: 'compilers.lessons.types.title',        blurbKey: 'compilers.lessons.types.blurb',        title: 'Type Checking',          blurb: 'Walk the tree, decorate it with types, reject the programs that lie. Inference vs annotation.' },
    { slug: 'ir',           titleKey: 'compilers.lessons.ir.title',           blurbKey: 'compilers.lessons.ir.blurb',           title: 'IR & SSA Form',          blurb: 'High-level trees become low-level instructions. Every variable assigned exactly once.' },
    { slug: 'optimization', titleKey: 'compilers.lessons.optimization.title', blurbKey: 'compilers.lessons.optimization.blurb', title: 'Optimization Passes',    blurb: 'Constant folding, dead code, common subexpressions. Each pass throws code away faster than you write it.' },
    { slug: 'regalloc',     titleKey: 'compilers.lessons.regalloc.title',     blurbKey: 'compilers.lessons.regalloc.blurb',     title: 'Register Allocation',    blurb: 'Infinite virtual registers → 16 real ones. Live ranges, interference graphs, graph coloring.' },
    { slug: 'codegen',      titleKey: 'compilers.lessons.codegen.title',      blurbKey: 'compilers.lessons.codegen.blurb',      title: 'Code Generation',        blurb: 'IR becomes x86 / ARM / RISC-V. Instruction selection, calling conventions, the final emit.' },
  ],
};
