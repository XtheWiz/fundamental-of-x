// Quantum Computing topic manifest.

export const manifest = {
  slug: 'quantum-computing',
  title: 'Quantum Computing',
  tagline: 'Qubits, superposition, entanglement — the math + intuition behind a still-weird technology.',
  lessons: [
    {
      slug: 'bits-vs-qubits',
      title: 'Bits vs Qubits',
      blurb: "A classical bit is 0 or 1. A qubit is a vector on a sphere. Visualize the Bloch sphere and see what a qubit actually is.",
    },
    {
      slug: 'superposition',
      title: 'Superposition & Measurement',
      blurb: "A qubit can be in a mix of |0⟩ and |1⟩. Measure it and the mix collapses to one. The randomness is intrinsic.",
    },
    {
      slug: 'entanglement',
      title: 'Entanglement',
      blurb: "Two qubits, one shared state. Measure either and the other's outcome is instantly determined. The 'spookiest' part.",
    },
    {
      slug: 'gates',
      title: 'Quantum Gates',
      blurb: "H, X, Z, CNOT — the building blocks. Each is a rotation of the qubit state, unitary and reversible.",
    },
    {
      slug: 'circuits',
      title: 'Quantum Circuits',
      blurb: "Compose gates into a circuit. Build a Bell pair generator, see the entangled outcomes when you run it.",
    },
    {
      slug: 'grover',
      title: "Grover's Algorithm",
      blurb: "Search an unsorted database of N items in √N steps instead of N/2. The quadratic speedup, animated.",
    },
    {
      slug: 'shor',
      title: 'Shor & Post-Quantum',
      blurb: "Shor's algorithm factors integers in polynomial time — eventually breaking RSA. The crypto world's response.",
    },
    {
      slug: 'nisq',
      title: 'NISQ, Noise & Error Correction',
      blurb: "Real qubits are fragile. Why useful quantum computing is still decades away, and what error correction will need.",
    },
  ],
};
