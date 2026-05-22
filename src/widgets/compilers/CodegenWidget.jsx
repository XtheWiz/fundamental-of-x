import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PROGRAMS = [
  { name: 'add two',    ir: [{ dst: 't1', op: '+', a: 'a', b: 'b' }, { dst: 'r', op: 'mov', a: 't1' }], args: ['a', 'b'], ret: 'r' },
  { name: 'sumsq',      ir: [{ dst: 't1', op: '*', a: 'x', b: 'x' }, { dst: 't2', op: '*', a: 'y', b: 'y' }, { dst: 'r', op: '+', a: 't1', b: 't2' }], args: ['x', 'y'], ret: 'r' },
  { name: 'avg of two', ir: [{ dst: 't1', op: '+', a: 'a', b: 'b' }, { dst: 'r', op: '/', a: 't1', b: 2 }], args: ['a', 'b'], ret: 'r' },
];

const BACKENDS = {
  'x86-64': {
    argRegs: ['rdi', 'rsi', 'rdx', 'rcx'], retReg: 'rax', scratch: ['rax', 'r10', 'r11'],
    emit(prog) {
      const out = ['; --- x86-64 (System V) ---', 'add_fn:'];
      const argMap = {}; prog.args.forEach((a, i) => { argMap[a] = this.argRegs[i]; });
      const reg = {}; let s = 0;
      prog.ir.forEach((ins) => {
        const aReg = argMap[ins.a] || reg[ins.a];
        const bReg = argMap[ins.b] || reg[ins.b];
        if (ins.op === 'mov') {
          if (ins.dst === prog.ret) { out.push(`    mov     ${this.retReg}, ${aReg}`); reg[ins.dst] = this.retReg; }
          else { const r = this.scratch[s++ % this.scratch.length]; out.push(`    mov     ${r}, ${aReg}`); reg[ins.dst] = r; }
        } else {
          const target = ins.dst === prog.ret ? this.retReg : this.scratch[s++ % this.scratch.length];
          out.push(`    mov     ${target}, ${aReg}`);
          const m = { '+': 'add', '-': 'sub', '*': 'imul', '/': 'idiv' }[ins.op];
          if (typeof ins.b === 'number') out.push(`    ${m}    ${target}, ${ins.b}`);
          else out.push(`    ${m}    ${target}, ${bReg}`);
          reg[ins.dst] = target;
        }
      });
      out.push('    ret');
      return out;
    },
  },
  'ARM64': {
    argRegs: ['x0', 'x1', 'x2', 'x3'], retReg: 'x0', scratch: ['x9', 'x10', 'x11'],
    emit(prog) {
      const out = ['// --- ARM64 (AAPCS) ---', 'add_fn:'];
      const argMap = {}; prog.args.forEach((a, i) => { argMap[a] = this.argRegs[i]; });
      const reg = {}; let s = 0;
      prog.ir.forEach((ins) => {
        const aReg = argMap[ins.a] || reg[ins.a];
        const bReg = argMap[ins.b] || reg[ins.b];
        const target = ins.dst === prog.ret ? this.retReg : this.scratch[s++ % this.scratch.length];
        reg[ins.dst] = target;
        if (ins.op === 'mov') out.push(`    mov     ${target}, ${aReg}`);
        else {
          const m = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'sdiv' }[ins.op];
          if (typeof ins.b === 'number') out.push(`    ${m}     ${target}, ${aReg}, #${ins.b}`);
          else out.push(`    ${m}     ${target}, ${aReg}, ${bReg}`);
        }
      });
      out.push('    ret');
      return out;
    },
  },
  'RISC-V': {
    argRegs: ['a0', 'a1', 'a2', 'a3'], retReg: 'a0', scratch: ['t0', 't1', 't2'],
    emit(prog) {
      const out = ['# --- RISC-V (rv64) ---', 'add_fn:'];
      const argMap = {}; prog.args.forEach((a, i) => { argMap[a] = this.argRegs[i]; });
      const reg = {}; let s = 0;
      prog.ir.forEach((ins) => {
        const aReg = argMap[ins.a] || reg[ins.a];
        const bReg = argMap[ins.b] || reg[ins.b];
        const target = ins.dst === prog.ret ? this.retReg : this.scratch[s++ % this.scratch.length];
        reg[ins.dst] = target;
        if (ins.op === 'mov') out.push(`    mv      ${target}, ${aReg}`);
        else {
          if (typeof ins.b === 'number') {
            if (ins.op === '*' || ins.op === '/') {
              out.push(`    li      t6, ${ins.b}`);
              out.push(`    ${{ '*': 'mul', '/': 'div' }[ins.op]}     ${target}, ${aReg}, t6`);
            } else {
              const imm = ins.op === '-' ? -ins.b : ins.b;
              out.push(`    addi    ${target}, ${aReg}, ${imm}`);
            }
          } else {
            const m = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'div' }[ins.op];
            out.push(`    ${m}     ${target}, ${aReg}, ${bReg}`);
          }
        }
      });
      out.push('    ret');
      return out;
    },
  },
};

const NOTES = {
  'x86-64': 'x86-64 uses rdi, rsi, ... for args, rax for return. Two-operand form: add dest, src means dest += src.',
  'ARM64':  'ARM64 uses x0–x7 for args, x0 for return. Three-operand form: add dst, a, b means dst = a + b. RISC fixed-width 32-bit instructions.',
  'RISC-V': 'RISC-V uses a0–a7 for args, a0 for return. Tiny ISA — even immediate arithmetic is a separate instruction (addi).',
};

function fmtIR(ir) {
  return ir.map((ins) => ins.op === 'mov' ? `${ins.dst} = ${ins.a}` : `${ins.dst} = ${ins.a} ${ins.op} ${ins.b}`).join('\n');
}

export default function CodegenWidget() {
  const [pick, setPick] = useState(0);
  const [arch, setArch] = useState('x86-64');
  const p = PROGRAMS[pick];

  return (
    <div className="widget">
      <div className="widget-title">IR → assembly</div>
      <div className="controls">
        {PROGRAMS.map((pr, i) => (
          <button key={pr.name} className="btn" onClick={() => setPick(i)}>{pr.name}</button>
        ))}
      </div>
      <div className="controls" style={{ marginTop: '0.3rem' }}>
        {Object.keys(BACKENDS).map((a) => (
          <button key={a} className="btn" onClick={() => setArch(a)}>{a}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.3rem' }}>IR</div>
          <pre className="code-block" style={{ margin: 0 }}>{fmtIR(p.ir)}</pre>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.3rem' }}>
            Assembly ({arch})
          </div>
          <pre className="code-block" style={{ margin: 0 }}>
            <AnimatePresence mode="popLayout">
              {BACKENDS[arch].emit(p).map((line, i) => (
                <motion.div
                  key={`${arch}-${pick}-${i}`}
                  layout
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.02 }}
                >{line}</motion.div>
              ))}
            </AnimatePresence>
          </pre>
        </div>
      </div>
      <div className="callout"><strong>{arch}.</strong> {NOTES[arch]}</div>
    </div>
  );
}
