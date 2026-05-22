import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import { initBitsQubitsWidget } from '../widgets/quantum-computing/legacy/bits-vs-qubits.js';
import { initSuperpositionWidget } from '../widgets/quantum-computing/legacy/superposition.js';
import { initEntanglementWidget } from '../widgets/quantum-computing/legacy/entanglement.js';
import { initGatesWidget } from '../widgets/quantum-computing/legacy/gates.js';
import { initCircuitsWidget } from '../widgets/quantum-computing/legacy/circuits.js';
import { initGroverWidget } from '../widgets/quantum-computing/legacy/grover.js';
import { initShorWidget } from '../widgets/quantum-computing/legacy/shor.js';
import { initNisqWidget } from '../widgets/quantum-computing/legacy/nisq.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'quantum-computing',
  title: 'Quantum Computing',
  intro: <>Eight lessons walking from a single qubit on the Bloch sphere up to Grover&apos;s and Shor&apos;s algorithms — and an honest look at why useful quantum computing is still decades away.</>,
  lessons: [
    { slug: 'bits-vs-qubits', number: '01', title: 'Bits vs Qubits', blurb: 'A classical bit is 0 or 1. A qubit is a vector on a sphere.', Widget: W(initBitsQubitsWidget),
      intro: <>A bit has two states. A qubit has infinitely many — any point on the surface of the Bloch sphere. The two poles correspond to classical 0 and 1.</>, sections: [],
      takeaways: ['A qubit is a 2D complex unit vector, visualized as a point on a sphere.', '|0⟩ and |1⟩ sit at the poles; everything else is a superposition.', 'Operations on qubits are rotations of the sphere.', 'The vector is hidden from us — only measurement reveals it (probabilistically).'] },
    { slug: 'superposition', number: '02', title: 'Superposition & Measurement', blurb: 'A qubit can be in a mix of |0⟩ and |1⟩. Measure it and the mix collapses.', Widget: W(initSuperpositionWidget),
      intro: <>A qubit holds amplitudes for both 0 and 1 simultaneously. Measuring collapses it to one or the other, with probabilities given by the amplitudes squared.</>, sections: [],
      takeaways: ['Superposition: |ψ⟩ = α|0⟩ + β|1⟩ with |α|² + |β|² = 1.', 'Measurement is irreversible — you can\'t un-collapse.', 'The randomness is intrinsic, not from hidden variables (Bell\'s theorem).', 'Quantum algorithms manipulate amplitudes before the final measurement.'] },
    { slug: 'entanglement', number: '03', title: 'Entanglement', blurb: 'Two qubits, one shared state. Measure either and the other is determined.', Widget: W(initEntanglementWidget),
      intro: <>Entangled qubits can\'t be described separately — only as one combined state. Measure either and the outcome of the other is instantly fixed, no matter how far apart.</>, sections: [],
      takeaways: ['Bell pair: (|00⟩ + |11⟩)/√2. Always correlated when measured.', 'No information travels faster than light — outcomes are random until measured.', 'Required for quantum speedups; classical can\'t reproduce.', 'Created by an entangling gate (CNOT after Hadamard, typically).'] },
    { slug: 'gates', number: '04', title: 'Quantum Gates', blurb: 'H, X, Z, CNOT — the building blocks.', Widget: W(initGatesWidget),
      intro: <>Quantum gates are unitary matrices — they rotate the qubit state vector. Every gate is reversible by definition (because measurement is the only irreversible step).</>, sections: [],
      takeaways: ['X = quantum NOT. Flips |0⟩ and |1⟩.', 'H = Hadamard. Creates superposition from a basis state.', 'Z = phase flip. Z|1⟩ = −|1⟩.', 'CNOT entangles a target qubit conditionally on the control.'] },
    { slug: 'circuits', number: '05', title: 'Quantum Circuits', blurb: 'Compose gates into a circuit.', Widget: W(initCircuitsWidget),
      intro: <>Quantum circuits look like guitar tabs — each horizontal wire is a qubit, gates apply at points in time. The output is a probabilistic measurement at the end.</>, sections: [],
      takeaways: ['Bell pair: H on qubit 0, then CNOT(0 → 1). Measure both — always 00 or 11.', 'Circuit depth (number of sequential gates) is what decoherence limits.', 'IBM, Google, IonQ — different qubit techs, same gate model.', 'Qiskit, Cirq, Q# let you write and simulate circuits.'] },
    { slug: 'grover', number: '06', title: "Grover's Algorithm", blurb: 'Search an unsorted database of N items in √N steps.', Widget: W(initGroverWidget),
      intro: <>Classically, finding a marked item among N takes N/2 lookups on average. Grover\'s does it in roughly √N — a quadratic speedup, provably optimal for unstructured search.</>, sections: [],
      takeaways: ['Speedup is quadratic, not exponential. Real but modest.', 'Each iteration amplifies the marked item\'s amplitude.', 'Useful for SAT, hash inversion, generic search.', 'Doesn\'t break crypto on its own — Grover halves the effective bit security.'] },
    { slug: 'shor', number: '07', title: 'Shor & Post-Quantum', blurb: "Shor's algorithm factors integers in polynomial time.", Widget: W(initShorWidget),
      intro: <>Shor turns integer factoring into a period-finding problem on which quantum has an exponential speedup. RSA and elliptic-curve crypto fall once enough qubits exist.</>, sections: [],
      takeaways: ['Polynomial time for factoring — breaks RSA and ECDH.', 'Currently broken on toy inputs only (15 = 3 × 5, etc.).', 'Likely needs millions of high-quality qubits to break real RSA.', 'NIST has standardized post-quantum algorithms (Kyber, Dilithium).'] },
    { slug: 'nisq', number: '08', title: 'NISQ, Noise & Error Correction', blurb: 'Real qubits are fragile.', Widget: W(initNisqWidget),
      intro: <>Today\'s quantum hardware is Noisy Intermediate-Scale Quantum — 100–1000 qubits, but each loses coherence in microseconds. Error correction needs ~1000 physical qubits per logical one.</>, sections: [],
      takeaways: ['Coherence times: microseconds for superconducting, longer for ion trap.', 'Gate fidelity: ~99.9% sounds good, terrible across 10000 gates.', 'Surface code: leading error-correction scheme.', 'Useful fault-tolerant QC is probably 10+ years away. NISQ-era results are narrow.'] },
  ],
};
