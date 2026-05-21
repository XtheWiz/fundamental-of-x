// REST widget: 6 design choices, each with two options. Pick the
// more RESTful one. Reveal explanation + running score.

const SCENARIOS = [
  {
    question: 'Fetch a user by ID',
    a: { code: 'GET /getUser?id=42',         restful: false },
    b: { code: 'GET /users/42',              restful: true  },
    why: '<strong>Resources, not verbs.</strong> The URL identifies a thing (a user); the HTTP method identifies the action (GET = read). <code>/getUser</code> mixes the two and breaks predictability — what is <code>/getUser?id=42&delete=true</code> supposed to mean?',
  },
  {
    question: 'Delete a user',
    a: { code: 'POST /users/42/delete',      restful: false },
    b: { code: 'DELETE /users/42',           restful: true  },
    why: '<strong>Use DELETE for deletes.</strong> Proxies, caches, and frameworks all know "DELETE is destructive and idempotent." Hiding the intent inside a POST forces every caller to read your docs.',
  },
  {
    question: 'Update a user\'s entire profile',
    a: { code: 'PUT /users/42 { full payload }', restful: true  },
    b: { code: 'POST /users/42 { full payload }', restful: false },
    why: '<strong>PUT replaces; POST creates or is non-idempotent.</strong> If a client retries on a network blip, PUT is safe (you get the same final state), POST might create a new record or trigger an action twice.',
  },
  {
    question: 'Increment a counter on a post',
    a: { code: 'POST /posts/42/like',         restful: true  },
    b: { code: 'PUT  /posts/42/likes/+1',     restful: false },
    why: '<strong>"Like" is an action that creates a like, not an idempotent replacement.</strong> POST is correct — running it twice produces two likes. PUT implies "set to this value," not "add one."',
  },
  {
    question: 'Search for products under $100',
    a: { code: 'POST /search { "max": 100 }', restful: false },
    b: { code: 'GET  /products?max_price=100', restful: true  },
    why: '<strong>Search results are a resource representation; GET reads.</strong> Filters in the query string make the URL bookmarkable, cacheable, and idempotent. POST hides the parameters in a body that proxies/CDNs ignore.',
  },
  {
    question: 'Indicate a successful POST that created a resource',
    a: { code: 'HTTP 200 OK',                 restful: false },
    b: { code: 'HTTP 201 Created',            restful: true  },
    why: '<strong>201 is the specific code for "created."</strong> It also lets you return a <code>Location:</code> header pointing at the new resource. 200 works, but loses information that intermediaries (clients, dashboards, error trackers) can use.',
  },
];

export function initRestWidget(root) {
  let idx = 0;
  const answers = new Array(SCENARIOS.length).fill(null);

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Design Choice #<span id="r-idx">1</span> of ${SCENARIOS.length}</div>

      <div id="r-question" style="font-size: 1.05rem; margin: 0.5rem 0 1rem;"></div>

      <div class="rest-options">
        <button class="rest-opt" data-opt="a"></button>
        <button class="rest-opt" data-opt="b"></button>
      </div>

      <div class="callout" id="r-why" style="display: none;"></div>

      <div class="controls">
        <button class="btn" id="r-prev">← Back</button>
        <button class="btn btn-accent" id="r-next">Next →</button>
        <button class="btn btn-ghost" id="r-reset">Reset</button>
        <span style="margin-left: auto; font-family: var(--font-mono);" id="r-score">Score: 0/${SCENARIOS.length}</span>
      </div>

      <style>
        .rest-options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin: 1rem 0; }
        .rest-opt { padding: 0.9rem 1.1rem; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper); cursor: pointer; font-family: var(--font-mono); font-size: 0.95rem; text-align: left; box-shadow: 3px 3px 0 var(--ink); transition: transform 0.12s, box-shadow 0.12s; }
        .rest-opt:hover:not(:disabled) { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--ink); }
        .rest-opt.right { background: #d6f5d6; }
        .rest-opt.wrong { background: #f7c8c8; }
        .rest-opt:disabled { cursor: default; }
        @media (max-width: 540px) { .rest-options { grid-template-columns: 1fr; } }
      </style>
    </div>
  `;

  root.querySelector('#r-next').addEventListener('click', () => {
    if (idx < SCENARIOS.length - 1) idx++;
    render();
  });
  root.querySelector('#r-prev').addEventListener('click', () => {
    if (idx > 0) idx--;
    render();
  });
  root.querySelector('#r-reset').addEventListener('click', () => {
    answers.fill(null);
    idx = 0;
    render();
  });
  root.querySelectorAll('.rest-opt').forEach((btn) =>
    btn.addEventListener('click', () => choose(btn.dataset.opt))
  );

  function choose(letter) {
    if (answers[idx] !== null) return;
    answers[idx] = letter;
    render();
  }

  function render() {
    const s = SCENARIOS[idx];
    root.querySelector('#r-idx').textContent = idx + 1;
    root.querySelector('#r-question').textContent = s.question;

    const btnA = root.querySelector('button.rest-opt[data-opt=a]');
    const btnB = root.querySelector('button.rest-opt[data-opt=b]');
    btnA.textContent = s.a.code;
    btnB.textContent = s.b.code;
    btnA.className = 'rest-opt';
    btnB.className = 'rest-opt';
    btnA.disabled = btnB.disabled = false;

    if (answers[idx] !== null) {
      btnA.disabled = btnB.disabled = true;
      btnA.classList.add(s.a.restful ? 'right' : 'wrong');
      btnB.classList.add(s.b.restful ? 'right' : 'wrong');
      const why = root.querySelector('#r-why');
      why.style.display = 'block';
      const correct = (s.a.restful ? 'a' : 'b');
      why.innerHTML = `${answers[idx] === correct ? '✅ Right.' : '❌ Not quite.'} ${s.why}`;
    } else {
      root.querySelector('#r-why').style.display = 'none';
    }

    const score = answers.reduce((acc, a, i) => {
      if (a === null) return acc;
      const s = SCENARIOS[i];
      const correct = s.a.restful ? 'a' : 'b';
      return acc + (a === correct ? 1 : 0);
    }, 0);
    root.querySelector('#r-score').textContent = `Score: ${score}/${SCENARIOS.length}`;
  }

  render();
}
