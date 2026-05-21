// What-is-a-pattern widget: a "match the pattern to the problem" quiz.

const PROBLEMS = [
  {
    problem: 'You need to support sorting users by name, age, or signup date — and add more orderings later without touching the sort function.',
    options: ['Strategy', 'Singleton', 'Observer'],
    correct: 'Strategy',
    why: 'Each ordering is an interchangeable algorithm behind a common interface. <code>sort(users, byName)</code>, <code>sort(users, byAge)</code>. Adding a new ordering = a new strategy, no edits to <code>sort</code>.',
  },
  {
    problem: 'When a chat message arrives, you need to update the unread badge, the notification dropdown, and the page title — and other parts of the app should be able to react too.',
    options: ['Decorator', 'Observer', 'Factory'],
    correct: 'Observer',
    why: 'The subject (message-received) emits an event. Each interested component subscribes. Adding a new reactor = subscribe; the subject doesn\'t know or care.',
  },
  {
    problem: 'Different image formats (PNG, JPEG, WebP) need to be loaded — the caller shouldn\'t care which format, just hand back a Image object.',
    options: ['Factory', 'Adapter', 'Observer'],
    correct: 'Factory',
    why: 'The Factory picks the right concrete class based on the input. The caller is shielded from the if/else over file extensions.',
  },
  {
    problem: 'Your code uses a payment gateway with method <code>charge(amountCents)</code>. You\'re switching to a new provider whose method is <code>process({total, currency})</code>. You don\'t want to rewrite every caller.',
    options: ['Adapter', 'Strategy', 'Singleton'],
    correct: 'Adapter',
    why: 'Wrap the new provider in a class that exposes the old <code>charge(amountCents)</code> signature. Callers stay; the adapter translates calls under the hood.',
  },
  {
    problem: 'A request to a flaky external API: sometimes it\'s up, sometimes it\'s timing out. You want to stop hammering it after several failures and let it recover.',
    options: ['Observer', 'Circuit Breaker', 'Decorator'],
    correct: 'Circuit Breaker',
    why: 'Track failure rate; after a threshold, "trip" the breaker — calls fail fast for a cool-off window before testing the upstream again. Modern resilience pattern, not in GoF.',
  },
  {
    problem: 'You need a centralized logger that all parts of the app use, with config loaded once at startup. But the tests want to substitute a fake logger.',
    options: ['Singleton', 'Dependency Injection', 'Factory'],
    correct: 'Dependency Injection',
    why: 'Singleton makes testing painful (global state). DI passes the logger in explicitly — production wires the real one; tests pass a fake. Same shared logger, no global.',
  },
];

export function initWhatIsPatternWidget(root) {
  const answers = new Array(PROBLEMS.length).fill(null);
  let idx = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Problem ${idx + 1} of ${PROBLEMS.length}</div>

      <div id="qz-content"></div>

      <div class="controls">
        <button class="btn" id="qz-prev">← Back</button>
        <button class="btn btn-accent" id="qz-next">Next →</button>
        <button class="btn btn-ghost" id="qz-reset">Reset</button>
        <span style="margin-left: auto; font-family: var(--font-mono);" id="qz-score">Score: 0/${PROBLEMS.length}</span>
      </div>
    </div>
  `;

  root.querySelector('#qz-prev').addEventListener('click', () => { if (idx > 0) idx--; render(); });
  root.querySelector('#qz-next').addEventListener('click', () => { if (idx < PROBLEMS.length - 1) idx++; render(); });
  root.querySelector('#qz-reset').addEventListener('click', () => { answers.fill(null); idx = 0; render(); });

  function render() {
    const p = PROBLEMS[idx];
    const a = answers[idx];
    const content = root.querySelector('#qz-content');
    content.innerHTML = `
      <div class="qz-problem">${escape(p.problem)}</div>
      <div class="qz-options">
        ${p.options.map((opt) => `
          <button class="qz-opt ${a === opt ? (opt === p.correct ? 'right' : 'wrong') : ''}" data-opt="${escape(opt)}" ${a !== null ? 'disabled' : ''}>${opt}</button>
        `).join('')}
      </div>
      ${a ? `<div class="qz-why ${a === p.correct ? 'right' : 'wrong'}">${a === p.correct ? '✅ Right.' : `❌ The intended answer was <strong>${p.correct}</strong>.`} ${p.why}</div>` : ''}

      <style>
        .qz-problem { font-size: 1.02rem; margin: 0.6rem 0 0.8rem; padding: 0.6rem 0.8rem; background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); }
        .qz-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.5rem; margin-bottom: 0.6rem; }
        .qz-opt { padding: 0.6rem 0.9rem; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper); cursor: pointer; font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.04em; box-shadow: 3px 3px 0 var(--ink); }
        .qz-opt:hover:not(:disabled) { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--ink); }
        .qz-opt:disabled { cursor: default; }
        .qz-opt.right { background: #d6f5d6; }
        .qz-opt.wrong { background: #f7c8c8; }
        .qz-why { padding: 0.7rem 0.9rem; border: 2px solid var(--ink); border-radius: var(--radius); }
        .qz-why.right { background: #d6f5d6; box-shadow: 3px 3px 0 #2a8a3e; }
        .qz-why.wrong { background: var(--accent-soft); box-shadow: 3px 3px 0 var(--accent); }
      </style>
    `;
    content.querySelectorAll('.qz-opt').forEach((b) =>
      b.addEventListener('click', () => {
        answers[idx] = b.dataset.opt;
        render();
      })
    );

    root.querySelector('.widget-title').textContent = `Problem ${idx + 1} of ${PROBLEMS.length}`;
    const score = answers.reduce((acc, a, i) => acc + (a === PROBLEMS[i].correct ? 1 : 0), 0);
    root.querySelector('#qz-score').textContent = `Score: ${score}/${PROBLEMS.length}`;
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
