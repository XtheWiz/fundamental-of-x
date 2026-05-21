// Concurrency widget: two scenarios — race condition on a counter
// (with/without mutex) and a deadlock (two mutexes, wrong order).

const SCENARIOS = {
  race:     { label: 'Race condition (counter++ × 2 threads, 100 iterations each)' },
  deadlock: { label: 'Deadlock (T1: lock M1→M2; T2: lock M2→M1)' },
};

export function initConcurrencyWidget(root) {
  let scenario = 'race';
  let withMutex = false;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Two threads, shared state</div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="cc-scen">
          ${Object.entries(SCENARIOS).map(([id, s]) => `<option value="${id}">${s.label}</option>`).join('')}
        </select>
        <label id="cc-mutex-wrap"><input type="checkbox" id="cc-mutex"> use mutex</label>
        <button class="btn btn-accent" id="cc-run">Run</button>
        <button class="btn btn-ghost" id="cc-reset">Reset</button>
      </div>

      <div class="widget-stage" id="cc-stage" style="min-height: 280px;"></div>

      <div class="callout" id="cc-explain"></div>
    </div>
  `;

  const stage = root.querySelector('#cc-stage');
  root.querySelector('#cc-scen').addEventListener('change', (e) => { scenario = e.target.value; reset(); });
  root.querySelector('#cc-mutex').addEventListener('change', (e) => { withMutex = e.target.checked; });
  root.querySelector('#cc-run').addEventListener('click', run);
  root.querySelector('#cc-reset').addEventListener('click', reset);

  let result = null;

  function reset() {
    result = null;
    render();
  }

  function runRace() {
    let counter = 0;
    const ITERATIONS = 100;
    if (withMutex) {
      // Mutex makes increments atomic: counter goes to 200 deterministically.
      counter = ITERATIONS * 2;
      return { counter, expected: ITERATIONS * 2, lost: 0 };
    }
    // Simulate races: random interleaving causes some lost updates
    // Probability a particular T1 increment collides with T2: ~10% (toy model)
    let lost = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      if (Math.random() < 0.1) lost++;
      else counter++;
    }
    for (let i = 0; i < ITERATIONS; i++) {
      if (Math.random() < 0.1) lost++;
      else counter++;
    }
    return { counter, expected: ITERATIONS * 2, lost };
  }

  function runDeadlock() {
    // Deterministic: always deadlock in this scenario
    return { deadlock: true };
  }

  function run() {
    if (scenario === 'race') {
      result = { type: 'race', ...runRace() };
    } else {
      result = { type: 'deadlock', ...runDeadlock() };
    }
    render();
  }

  function render() {
    const wrap = root.querySelector('#cc-mutex-wrap');
    wrap.style.display = scenario === 'race' ? 'inline-flex' : 'none';

    let html = '';
    if (scenario === 'race') {
      html = `
        <div class="cc-grid">
          <div class="cc-thread t1">
            <div class="cc-thread-name">Thread 1</div>
            <pre>for i in 1..100:
  ${withMutex ? 'mu.lock()\n  ' : ''}counter++${withMutex ? '\n  mu.unlock()' : ''}</pre>
          </div>
          <div class="cc-shared">
            <div class="cc-shared-label">SHARED</div>
            <div class="cc-counter">counter = ${result ? result.counter : '0'}</div>
            ${withMutex ? '<div class="cc-mutex-state">🔒 mutex</div>' : ''}
          </div>
          <div class="cc-thread t2">
            <div class="cc-thread-name">Thread 2</div>
            <pre>for i in 1..100:
  ${withMutex ? 'mu.lock()\n  ' : ''}counter++${withMutex ? '\n  mu.unlock()' : ''}</pre>
          </div>
        </div>
      `;
      if (result) {
        const correct = result.counter === result.expected;
        html += `<div class="cc-result ${correct ? 'good' : 'bad'}">
          Final counter: <strong>${result.counter}</strong> (expected ${result.expected}). ${result.lost ? `${result.lost} increments lost to races.` : 'No lost updates.'}
        </div>`;
      }
    } else {
      // deadlock
      html = `
        <div class="cc-grid">
          <div class="cc-thread t1">
            <div class="cc-thread-name">Thread 1</div>
            <pre>m1.lock()
${result ? '🔒 acquired M1\n' : ''}m2.lock()  ←  ${result ? '⏳ waits forever (T2 holds M2)' : ''}
critical_section()
m2.unlock()
m1.unlock()</pre>
          </div>
          <div class="cc-shared">
            <div class="cc-shared-label">MUTEXES</div>
            <div class="cc-mutex-state ${result ? 'held-1' : ''}">🔒 M1 ${result ? '(held by T1)' : '(free)'}</div>
            <div class="cc-mutex-state ${result ? 'held-2' : ''}">🔒 M2 ${result ? '(held by T2)' : '(free)'}</div>
          </div>
          <div class="cc-thread t2">
            <div class="cc-thread-name">Thread 2</div>
            <pre>m2.lock()
${result ? '🔒 acquired M2\n' : ''}m1.lock()  ←  ${result ? '⏳ waits forever (T1 holds M1)' : ''}
critical_section()
m1.unlock()
m2.unlock()</pre>
          </div>
        </div>
      `;
      if (result) {
        html += `<div class="cc-result bad">💀 <strong>Deadlock.</strong> Each thread holds one mutex and waits for the other. Neither will ever proceed.</div>`;
      }
    }

    html += `<style>
      .cc-grid { display: grid; grid-template-columns: 1fr 0.7fr 1fr; gap: 0.5rem; }
      .cc-thread { background: #cfe5ff; border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; }
      .cc-thread.t2 { background: #c8f0c8; }
      .cc-thread-name { font-family: var(--font-display); letter-spacing: 1.5px; font-size: 0.95rem; margin-bottom: 0.3em; }
      .cc-thread pre { font-family: var(--font-mono); font-size: 0.78rem; background: rgba(255,255,255,0.5); border: 1px solid var(--ink); padding: 0.4em 0.5em; border-radius: 2px; margin: 0; white-space: pre-wrap; }
      .cc-shared { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.6rem; text-align: center; display: flex; flex-direction: column; justify-content: center; }
      .cc-shared-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3em; }
      .cc-counter { font-family: var(--font-display); font-size: 1.8rem; }
      .cc-mutex-state { font-family: var(--font-mono); font-size: 0.85rem; padding: 0.2em 0.5em; border: 1.5px solid var(--ink); border-radius: 2px; margin: 0.15em 0; background: var(--paper); }
      .cc-mutex-state.held-1 { background: #cfe5ff; }
      .cc-mutex-state.held-2 { background: #c8f0c8; }
      .cc-result { margin-top: 0.6rem; padding: 0.6rem 0.8rem; border: 2px solid var(--ink); border-radius: var(--radius); }
      .cc-result.good { background: #d6f5d6; box-shadow: 3px 3px 0 #2a8a3e; }
      .cc-result.bad { background: var(--accent-soft); box-shadow: 3px 3px 0 var(--accent); }
      @media (max-width: 720px) { .cc-grid { grid-template-columns: 1fr; } }
    </style>`;
    stage.innerHTML = html;

    let exp;
    if (scenario === 'race') {
      if (!result) exp = 'Click Run. Without the mutex, each thread\'s "counter++" can interleave at the instruction level, dropping updates.';
      else if (withMutex) exp = `<strong>Correct result.</strong> The mutex serialized the two threads' critical sections, so every increment counted.`;
      else exp = `<strong>${result.lost} lost updates.</strong> The race is silent — your "counter++" looks atomic in source but isn't on the hardware. Add a mutex (or use atomic_fetch_add).`;
    } else {
      if (!result) exp = 'Click Run. Both threads succeed at locking their first mutex, then wait forever for the second.';
      else exp = `<strong>Classic AB-BA deadlock.</strong> Fix: agree on a global lock ordering (e.g. always M1 before M2). Tools (deadlock detectors, runtime checks, static analyzers) can catch this in development.`;
    }
    root.querySelector('#cc-explain').innerHTML = exp;
  }

  reset();
}
