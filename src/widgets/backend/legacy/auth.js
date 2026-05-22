// Auth widget: step through OAuth 2.0 Authorization Code flow.
// Three columns (User, App, Provider) with a message ladder.

const STEPS = [
  {
    actor: 'User',
    target: 'App',
    label: '1. Click "Sign in with GitHub"',
    body: 'GET /login',
    note: 'User initiates login. App needs to start the OAuth dance.',
  },
  {
    actor: 'App',
    target: 'User',
    label: '2. Redirect to Provider',
    body: '302 Location: https://github.com/login/oauth/authorize?client_id=…&redirect_uri=…&state=xyz',
    note: 'App generates a random <code>state</code> (anti-CSRF) and sends the user\'s browser to GitHub with its public client_id.',
  },
  {
    actor: 'User',
    target: 'Provider',
    label: '3. Provider asks for consent',
    body: '“Allow App to read your profile?” [Authorize]',
    note: 'User authenticates with GitHub (password, 2FA, etc.) and approves the requested scopes.',
  },
  {
    actor: 'Provider',
    target: 'User',
    label: '4. Redirect back to App with code',
    body: '302 Location: https://app.com/callback?code=abc123&state=xyz',
    note: 'Provider sends user\'s browser back to the App. <code>code</code> is short-lived. <code>state</code> echoes what App sent — App will verify it.',
  },
  {
    actor: 'User',
    target: 'App',
    label: '5. Browser hits callback URL',
    body: 'GET /callback?code=abc123&state=xyz',
    note: 'Browser is just delivering the redirect. App now has the code and verifies the state matches.',
  },
  {
    actor: 'App',
    target: 'Provider',
    label: '6. Exchange code for access token',
    body: 'POST /oauth/token { code, client_id, client_secret }',
    note: '<strong>Server-to-server</strong>. App sends the code plus its private <code>client_secret</code>. The browser never sees this — that\'s why even an intercepted code is useless to an attacker.',
  },
  {
    actor: 'Provider',
    target: 'App',
    label: '7. Provider returns access token',
    body: '200 { access_token, refresh_token, expires_in: 3600 }',
    note: 'App now has a token it can use to call the Provider\'s API on the user\'s behalf.',
  },
  {
    actor: 'App',
    target: 'Provider',
    label: '8. Fetch user profile',
    body: 'GET /user  Authorization: Bearer <access_token>',
    note: 'App calls Provider\'s API with the token to find out who the user is.',
  },
  {
    actor: 'App',
    target: 'User',
    label: '9. Set session cookie, redirect home',
    body: '302 Location: /  Set-Cookie: session=…; Secure; HttpOnly; SameSite=Lax',
    note: 'App creates its own local session. From now on, the user is logged in via the App\'s cookie — the access_token is a server-side detail.',
  },
];

const ACTORS = ['User', 'App', 'Provider'];

export function initAuthWidget(root) {
  let step = 0;

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">OAuth 2.0 — Authorization Code Flow</div>
      <p class="widget-hint">Step through 9 messages between three parties.</p>

      <div class="controls">
        <button class="btn" id="a-prev">← Back</button>
        <button class="btn btn-accent" id="a-next">Next step →</button>
        <button class="btn btn-ghost" id="a-reset">Reset</button>
        <span style="margin-left:auto; font-family: var(--font-mono); color: var(--ink-soft);" id="a-counter">0 / ${STEPS.length}</span>
      </div>

      <div class="widget-stage" id="a-stage" style="min-height: 420px;"></div>
      <div class="callout" id="a-note">Click "Next step →" to begin.</div>
    </div>
  `;

  const stage = root.querySelector('#a-stage');
  const noteEl = root.querySelector('#a-note');
  const counterEl = root.querySelector('#a-counter');

  root.querySelector('#a-next').addEventListener('click', () => { if (step < STEPS.length) step++; render(); });
  root.querySelector('#a-prev').addEventListener('click', () => { if (step > 0) step--; render(); });
  root.querySelector('#a-reset').addEventListener('click', () => { step = 0; render(); });

  function render() {
    counterEl.textContent = `${step} / ${STEPS.length}`;

    // header row
    let html = `
      <div class="auth-grid">
        <div class="auth-actor user">USER</div>
        <div class="auth-actor app">APP <small>(your site)</small></div>
        <div class="auth-actor prov">PROVIDER <small>(github.com)</small></div>
    `;

    // each rendered step
    STEPS.slice(0, step).forEach((s, i) => {
      const fromIdx = ACTORS.indexOf(s.actor);
      const toIdx = ACTORS.indexOf(s.target);
      const left = Math.min(fromIdx, toIdx);
      const span = Math.abs(toIdx - fromIdx) + 1;
      const dir = toIdx > fromIdx ? '→' : '←';
      const highlight = i === step - 1 ? 'current' : '';
      html += `
        <div class="auth-stepnum">${String(i + 1).padStart(2,'0')}</div>
        <div class="auth-msg ${highlight}" style="grid-column: ${left + 2} / span ${span};">
          <div class="auth-msg-label">${escape(s.label)} <span class="auth-arrow">${dir}</span></div>
          <div class="auth-msg-body">${escape(s.body)}</div>
        </div>
      `;
    });

    html += `</div>`;
    html += `<style>
      .auth-grid { display: grid; grid-template-columns: 30px 1fr 1fr 1fr; gap: 0.4rem 0.6rem; align-items: stretch; }
      .auth-actor { grid-column: span 1; font-family: var(--font-display); letter-spacing: 2px; text-align: center; padding: 0.4em; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper-deep); }
      .auth-actor.user { background: #cfe5ff; grid-column: 2; }
      .auth-actor.app  { background: #ffe9b3; grid-column: 3; }
      .auth-actor.prov { background: #c8f0c8; grid-column: 4; }
      .auth-actor small { display: block; font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.05em; color: var(--ink-soft); text-transform: none; }
      .auth-stepnum { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-faint); text-align: center; padding-top: 0.6em; }
      .auth-msg { background: var(--paper); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 0.4em 0.7em; }
      .auth-msg.current { background: var(--accent-soft); border-color: var(--accent); border-width: 2px; }
      .auth-msg-label { font-family: var(--font-display); font-size: 0.85rem; letter-spacing: 0.04em; margin-bottom: 0.2em; }
      .auth-arrow { color: var(--accent); margin-left: 0.4em; font-size: 1rem; }
      .auth-msg-body { font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink); word-break: break-word; line-height: 1.4; }
    </style>`;
    stage.innerHTML = html;

    noteEl.innerHTML = step > 0 ? STEPS[step - 1].note : 'Click "Next step →" to begin.';
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
