// Observer widget: a subject (chat message arrived) + 3 observers
// (badge, dropdown, title). Publish events, watch each react.

const BAD_CODE = `// Publisher knows every reactor by name.
function onMessageArrived(msg) {
  updateBadge(unread + 1);
  appendToDropdown(msg);
  document.title = "(" + unread + ") inbox";
  pushNotification(msg);
  // Add a new reactor → edit this function.
}`;

const GOOD_CODE = `class EventBus {
  subscribers = new Map();
  on(evt, fn) {
    if (!this.subscribers.has(evt)) this.subscribers.set(evt, []);
    this.subscribers.get(evt).push(fn);
  }
  emit(evt, payload) {
    (this.subscribers.get(evt) ?? []).forEach(fn => fn(payload));
  }
}

const bus = new EventBus();
bus.on('message-arrived', updateBadge);
bus.on('message-arrived', appendToDropdown);
bus.on('message-arrived', updateTitle);

// Adding a new reactor:
bus.on('message-arrived', archiveToDisk);  // done.

// Publishing:
bus.emit('message-arrived', { from: 'Aiko', text: 'hi' });`;

const OBSERVERS = [
  { id: 'badge',    label: 'Badge',    icon: '🔴', describe: (n) => `unread = ${n}` },
  { id: 'dropdown', label: 'Dropdown', icon: '📥', describe: (n, last) => last ? `last: "${last.text}" from ${last.from}` : 'empty' },
  { id: 'title',    label: 'Page title', icon: '🪟', describe: (n) => `(${n}) inbox · X-sensei` },
];

const NAMES = ['Aiko', 'Mateo', 'Priya', 'Kenji', 'Lena', 'Diego', 'Yuna', 'Omar'];
const TEXTS = ['hello!', 'are you free?', 'lunch?', 'fyi: ship today', 'lol', 'wow', 'thanks!', 'lmk'];

export function initObserverWidget(root) {
  const state = {
    unread: 0,
    last: null,
    enabled: { badge: true, dropdown: true, title: true },
    log: [],
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">message-arrived event</div>

      <div class="controls">
        <strong>Subscribers:</strong>
        ${OBSERVERS.map((o) => `<label><input type="checkbox" data-obs="${o.id}" checked> ${o.icon} ${o.label}</label>`).join('  ')}
      </div>

      <div class="controls">
        <button class="btn btn-accent" id="ob-publish">Publish "message-arrived"</button>
        <button class="btn btn-ghost" id="ob-reset">Reset</button>
      </div>

      <div class="widget-stage" id="ob-stage" style="min-height: 200px;"></div>

      <div class="dp-grid">
        <div class="dp-side bad">
          <div class="dp-side-label">⚠ Without observer (publisher knows everyone)</div>
          <pre>${escape(BAD_CODE)}</pre>
        </div>
        <div class="dp-side good">
          <div class="dp-side-label">✓ With observer (loose coupling)</div>
          <pre>${escape(GOOD_CODE)}</pre>
        </div>
      </div>
    </div>
  `;

  root.querySelectorAll('input[data-obs]').forEach((cb) =>
    cb.addEventListener('change', (e) => {
      state.enabled[e.target.dataset.obs] = e.target.checked;
      render();
    })
  );
  root.querySelector('#ob-publish').addEventListener('click', () => {
    const msg = { from: NAMES[Math.floor(Math.random() * NAMES.length)], text: TEXTS[Math.floor(Math.random() * TEXTS.length)] };
    state.unread += 1;
    state.last = msg;
    state.log.unshift(`publish: { from: "${msg.from}", text: "${msg.text}" }`);
    if (state.log.length > 6) state.log.length = 6;
    render(msg);
  });
  root.querySelector('#ob-reset').addEventListener('click', () => {
    state.unread = 0; state.last = null; state.log = [];
    Object.keys(state.enabled).forEach((k) => state.enabled[k] = true);
    root.querySelectorAll('input[data-obs]').forEach((cb) => cb.checked = true);
    render();
  });

  function render(justPublished) {
    let html = `<div class="ob-stage">`;
    html += `<div class="ob-pub"><div class="ob-pub-icon">📨</div><div class="ob-pub-name">SUBJECT<br><small>message-arrived</small></div></div>`;
    html += `<div class="ob-obs">`;
    OBSERVERS.forEach((o) => {
      const on = state.enabled[o.id];
      const fired = justPublished && on;
      html += `<div class="ob-sub ${on ? 'active' : 'mute'} ${fired ? 'just-fired' : ''}">
        <div class="ob-sub-icon">${o.icon}</div>
        <div class="ob-sub-name">${o.label}</div>
        <div class="ob-sub-state">${on ? escape(o.describe(state.unread, state.last)) : '(unsubscribed)'}</div>
      </div>`;
    });
    html += `</div></div>`;

    html += `<div class="ob-log">${state.log.map((l) => `<div>${escape(l)}</div>`).join('') || '<span style="color: var(--ink-faint);">no events yet</span>'}</div>`;

    html += `<style>
      .ob-stage { display: grid; grid-template-columns: 200px 1fr; gap: 0.8rem; align-items: center; margin-bottom: 0.6rem; }
      .ob-pub { background: var(--accent); color: white; border: 2.5px solid var(--ink); border-radius: var(--radius); padding: 0.7rem; text-align: center; box-shadow: 4px 4px 0 var(--ink); }
      .ob-pub-icon { font-size: 2rem; }
      .ob-pub-name { font-family: var(--font-display); letter-spacing: 1.5px; }
      .ob-pub-name small { font-family: var(--font-mono); letter-spacing: 0; font-size: 0.7rem; }
      .ob-obs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; }
      .ob-sub { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem; text-align: center; transition: transform 0.2s, box-shadow 0.2s; }
      .ob-sub.active { background: #c8f0c8; }
      .ob-sub.mute { opacity: 0.4; }
      .ob-sub.just-fired { transform: translateY(-4px); box-shadow: 4px 6px 0 var(--accent); }
      .ob-sub-icon { font-size: 1.6rem; }
      .ob-sub-name { font-family: var(--font-display); letter-spacing: 1px; font-size: 0.9rem; }
      .ob-sub-state { font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-soft); }
      .ob-log { background: var(--paper-deep); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 0.4rem 0.6rem; font-family: var(--font-mono); font-size: 0.78rem; max-height: 110px; overflow-y: auto; }
      @media (max-width: 640px) { .ob-stage { grid-template-columns: 1fr; } .ob-obs { grid-template-columns: 1fr; } }
    </style>`;
    root.querySelector('#ob-stage').innerHTML = html;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  render();
}
