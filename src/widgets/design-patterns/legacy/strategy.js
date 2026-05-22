// Strategy widget: live demo of sorting users by 3 orderings + side-by-
// side code (if/else hardcoded vs strategy injected).

const USERS = [
  { name: 'Aiko',  age: 29, signup: '2024-01-15' },
  { name: 'Mateo', age: 41, signup: '2023-11-02' },
  { name: 'Priya', age: 34, signup: '2025-03-08' },
  { name: 'Kenji', age: 22, signup: '2024-06-21' },
  { name: 'Lena',  age: 37, signup: '2024-12-30' },
];

const STRATS = {
  name:   { label: 'by name',          fn: (a, b) => a.name.localeCompare(b.name) },
  age:    { label: 'by age',           fn: (a, b) => a.age - b.age },
  signup: { label: 'by signup (new→old)', fn: (a, b) => b.signup.localeCompare(a.signup) },
};

const BAD_CODE = `function sort(users, order) {
  if (order === 'name') {
    return users.sort((a, b) => a.name.localeCompare(b.name));
  } else if (order === 'age') {
    return users.sort((a, b) => a.age - b.age);
  } else if (order === 'signup') {
    return users.sort((a, b) =>
      b.signup.localeCompare(a.signup));
  }
  // Adding a new order = edit this function.
}

sort(users, 'age');`;

const GOOD_CODE = `// Strategy is just a function/object you pass in.
const byName   = (a, b) => a.name.localeCompare(b.name);
const byAge    = (a, b) => a.age - b.age;
const bySignup = (a, b) =>
  b.signup.localeCompare(a.signup);

function sort(users, strategy) {
  return users.slice().sort(strategy);
}

sort(users, byAge);

// Adding a new ordering = a new function.
// sort() never changes.`;

export function initStrategyWidget(root) {
  let strat = 'name';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Same data, three orderings</div>

      <div class="controls">
        <label>Strategy:</label>
        <div class="pill-group">
          ${Object.entries(STRATS).map(([id, s], i) => `
            <input type="radio" name="st-s" id="st-${id}" value="${id}" ${i === 0 ? 'checked' : ''}>
            <label for="st-${id}">${s.label}</label>
          `).join('')}
        </div>
      </div>

      <div class="widget-stage" id="st-stage" style="min-height: 180px;"></div>

      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Without strategy (hardcoded if/else)</div>
          <pre>${escape(BAD_CODE)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ With strategy (function passed in)</div>
          <pre>${escape(GOOD_CODE)}</pre>
        </div>
      </div>
    </div>
  `;

  root.querySelectorAll('input[name=st-s]').forEach((r) =>
    r.addEventListener('change', (e) => { strat = e.target.value; render(); })
  );

  function render() {
    const sorted = USERS.slice().sort(STRATS[strat].fn);
    const stage = root.querySelector('#st-stage');
    stage.innerHTML = `
      <table class="st-table">
        <thead><tr><th>name</th><th>age</th><th>signup</th></tr></thead>
        <tbody>
          ${sorted.map((u) => `<tr><td>${escape(u.name)}</td><td>${u.age}</td><td>${u.signup}</td></tr>`).join('')}
        </tbody>
      </table>
      <style>
        .st-table { width: 100%; border-collapse: collapse; }
        .st-table th, .st-table td { padding: 0.3em 0.8em; border: 1.5px solid var(--ink); font-family: var(--font-mono); font-size: 0.85rem; }
        .st-table th { background: var(--paper-deep); font-family: var(--font-display); letter-spacing: 0.04em; font-weight: 400; font-size: 0.78rem; }
      </style>
    `;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
