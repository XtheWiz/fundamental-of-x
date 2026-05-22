// Codegen widget: pick an IR, choose backend, emit assembly side-by-side.

const PROGRAMS = [
  {
    name: 'add two',
    ir: [
      { dst: 't1', op: '+', a: 'a', b: 'b' },
      { dst: 'r',  op: 'mov', a: 't1' },
    ],
    args: ['a', 'b'],
    ret: 'r',
  },
  {
    name: 'sumsq',
    ir: [
      { dst: 't1', op: '*', a: 'x', b: 'x' },
      { dst: 't2', op: '*', a: 'y', b: 'y' },
      { dst: 'r',  op: '+', a: 't1', b: 't2' },
    ],
    args: ['x', 'y'],
    ret: 'r',
  },
  {
    name: 'avg of two',
    ir: [
      { dst: 't1', op: '+', a: 'a', b: 'b' },
      { dst: 'r',  op: '/', a: 't1', b: 2 },
    ],
    args: ['a', 'b'],
    ret: 'r',
  },
];

const BACKENDS = {
  'x86-64': {
    argRegs: ['rdi', 'rsi', 'rdx', 'rcx'],
    retReg: 'rax',
    scratch: ['rax', 'r10', 'r11'],
    emit(prog) {
      const out = [];
      const ir = prog.ir;
      const argMap = {};
      prog.args.forEach((a, i) => { argMap[a] = this.argRegs[i]; });
      const reg = {};  // var → register
      let s = 0;
      out.push('; --- x86-64 (System V) ---');
      out.push('add_fn:');
      ir.forEach((ins) => {
        const aReg = argMap[ins.a] || reg[ins.a];
        const bReg = argMap[ins.b] || reg[ins.b];
        if (ins.op === 'mov') {
          if (ins.dst === prog.ret) {
            out.push(`    mov     ${this.retReg}, ${aReg}`);
            reg[ins.dst] = this.retReg;
          } else {
            const r = this.scratch[s++ % this.scratch.length];
            out.push(`    mov     ${r}, ${aReg}`);
            reg[ins.dst] = r;
          }
        } else {
          const target = ins.dst === prog.ret ? this.retReg : this.scratch[s++ % this.scratch.length];
          out.push(`    mov     ${target}, ${aReg}`);
          const mnemonic = { '+': 'add', '-': 'sub', '*': 'imul', '/': 'idiv' }[ins.op];
          if (typeof ins.b === 'number') {
            out.push(`    ${mnemonic}    ${target}, ${ins.b}`);
          } else {
            out.push(`    ${mnemonic}    ${target}, ${bReg}`);
          }
          reg[ins.dst] = target;
        }
      });
      out.push(`    ret`);
      return out;
    }
  },
  'ARM64': {
    argRegs: ['x0', 'x1', 'x2', 'x3'],
    retReg: 'x0',
    scratch: ['x9', 'x10', 'x11'],
    emit(prog) {
      const out = [];
      const ir = prog.ir;
      const argMap = {};
      prog.args.forEach((a, i) => { argMap[a] = this.argRegs[i]; });
      const reg = {};
      let s = 0;
      out.push('// --- ARM64 (AAPCS) ---');
      out.push('add_fn:');
      ir.forEach((ins) => {
        const aReg = argMap[ins.a] || reg[ins.a];
        const bReg = argMap[ins.b] || reg[ins.b];
        const target = ins.dst === prog.ret ? this.retReg : this.scratch[s++ % this.scratch.length];
        reg[ins.dst] = target;
        if (ins.op === 'mov') {
          out.push(`    mov     ${target}, ${aReg}`);
        } else {
          const mnemonic = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'sdiv' }[ins.op];
          if (typeof ins.b === 'number') {
            out.push(`    ${mnemonic}     ${target}, ${aReg}, #${ins.b}`);
          } else {
            out.push(`    ${mnemonic}     ${target}, ${aReg}, ${bReg}`);
          }
        }
      });
      out.push(`    ret`);
      return out;
    }
  },
  'RISC-V': {
    argRegs: ['a0', 'a1', 'a2', 'a3'],
    retReg: 'a0',
    scratch: ['t0', 't1', 't2'],
    emit(prog) {
      const out = [];
      const ir = prog.ir;
      const argMap = {};
      prog.args.forEach((a, i) => { argMap[a] = this.argRegs[i]; });
      const reg = {};
      let s = 0;
      out.push('# --- RISC-V (rv64) ---');
      out.push('add_fn:');
      ir.forEach((ins) => {
        const aReg = argMap[ins.a] || reg[ins.a];
        const bReg = argMap[ins.b] || reg[ins.b];
        const target = ins.dst === prog.ret ? this.retReg : this.scratch[s++ % this.scratch.length];
        reg[ins.dst] = target;
        if (ins.op === 'mov') {
          out.push(`    mv      ${target}, ${aReg}`);
        } else {
          if (typeof ins.b === 'number') {
            const mnemonic = { '+': 'addi', '-': 'addi', '*': 'muli', '/': 'divi' }[ins.op] || 'addi';
            const imm = ins.op === '-' ? -ins.b : ins.b;
            if (ins.op === '*' || ins.op === '/') {
              out.push(`    li      t6, ${ins.b}`);
              const real = { '*': 'mul', '/': 'div' }[ins.op];
              out.push(`    ${real}     ${target}, ${aReg}, t6`);
            } else {
              out.push(`    addi    ${target}, ${aReg}, ${imm}`);
            }
          } else {
            const mnemonic = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'div' }[ins.op];
            out.push(`    ${mnemonic}     ${target}, ${aReg}, ${bReg}`);
          }
        }
      });
      out.push(`    ret`);
      return out;
    }
  },
};

function fmtIR(ir) {
  return ir.map((ins) => {
    if (ins.op === 'mov') return `${ins.dst} = ${ins.a}`;
    return `${ins.dst} = ${ins.a} ${ins.op} ${ins.b}`;
  }).join('\n');
}

export function initCodegenWidget(root) {
  let pick = 0;
  let arch = 'x86-64';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">IR → assembly</div>
      <div class="controls">
        ${PROGRAMS.map((p, i) => `<button class="btn" data-i="${i}">${p.name}</button>`).join('')}
      </div>
      <div class="controls" style="margin-top:0.3rem;">
        ${Object.keys(BACKENDS).map((a) => `<button class="btn" data-a="${a}">${a}</button>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem;">
        <div>
          <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--ink-soft);margin-bottom:0.3rem;">IR</div>
          <pre class="code-block" id="cg-ir" style="margin:0;"></pre>
        </div>
        <div>
          <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--ink-soft);margin-bottom:0.3rem;" id="cg-arch-label">Assembly</div>
          <pre class="code-block" id="cg-asm" style="margin:0;"></pre>
        </div>
      </div>
      <div class="callout" id="cg-explain"></div>
    </div>
  `;

  const NOTES = {
    'x86-64': 'x86-64 uses <code>rdi, rsi, ...</code> for args, <code>rax</code> for return. Two-operand form: <code>add dest, src</code> means <code>dest += src</code>.',
    'ARM64':  'ARM64 uses <code>x0–x7</code> for args, <code>x0</code> for return. Three-operand form: <code>add dst, a, b</code> means <code>dst = a + b</code>. RISC fixed-width 32-bit instructions.',
    'RISC-V': 'RISC-V uses <code>a0–a7</code> for args, <code>a0</code> for return. Tiny ISA — even immediate arithmetic is a separate instruction (<code>addi</code>).',
  };

  function render() {
    const p = PROGRAMS[pick];
    root.querySelector('#cg-ir').textContent = fmtIR(p.ir);
    root.querySelector('#cg-asm').textContent = BACKENDS[arch].emit(p).join('\n');
    root.querySelector('#cg-arch-label').textContent = `Assembly (${arch})`;
    root.querySelector('#cg-explain').innerHTML = `<strong>${arch}.</strong> ${NOTES[arch]}`;
  }

  root.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { pick = +b.dataset.i; render(); }));
  root.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => { arch = b.dataset.a; render(); }));
  render();
}
