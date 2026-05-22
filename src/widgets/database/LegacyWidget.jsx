import { useEffect, useRef } from 'react';

// Tiny React wrapper that hosts an imperative vanilla widget. Each widget
// exports an `init<Name>Widget(rootEl)` function that builds and wires up
// its own DOM tree. We mount it once on the inner div ref and let it run.
//
// This keeps 100% behavioural fidelity for widgets that aren't yet worth
// re-writing in idiomatic React (Framer Motion / R3F can be layered on
// later, one widget at a time). The Compilers / Genetics / ML widgets
// were ported as native React components because they benefit from the
// state model; the Database widgets are mostly self-contained simulations
// where the imperative version is already polished.

export default function LegacyWidget({ init }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const root = ref.current;
    // Reset in case React StrictMode / route remount fired init twice.
    root.innerHTML = '';
    init(root);
    return () => { root.innerHTML = ''; };
  }, [init]);
  return <div ref={ref} />;
}
