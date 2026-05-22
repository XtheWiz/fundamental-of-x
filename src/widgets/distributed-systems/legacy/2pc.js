// Two-Phase Commit widget: coordinator + 3 participants. Run different
// scenarios (happy path, one votes no, participant crashes, coordinator
// crashes) and see the outcome.

const SCENARIOS = {
  happy:    { label: 'Happy path (all yes)',           votes: ['yes','yes','yes'],  pCrash: null, cCrash: false },
  oneNo:    { label: 'One participant votes NO',       votes: ['yes','no','yes'],   pCrash: null, cCrash: false },
  pCrash:   { label: 'Participant crashes after voting yes', votes: ['yes','yes','yes'], pCrash: 1, cCrash: false },
  cCrash:   { label: 'Coordinator crashes after prepare',    votes: ['yes','yes','yes'], pCrash: null, cCrash: true },
};

export function initTwoPCWidget(root) {
  let scenario = 'happy';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Coordinator + 3 participants</div>

      <div class="controls">
        <label>Scenario:</label>
        <select class="field" id="tp-scen" style="min-width: 280px;">
          ${Object.entries(SCENARIOS).map(([id, s]) => `<option value="${id}">${s.label}</option>`).join('')}
        </select>
        <button class="btn btn-accent" id="tp-run">Run</button>
        <button class="btn btn-ghost" id="tp-reset">Reset</button>
      </div>

      <div class="widget-stage" id="tp-stage" style="min-height: 360px;"></div>

      <div class="callout" id="tp-explain">Pick a scenario and click Run.</div>
    </div>
  `;

  const stage = root.querySelector('#tp-stage');
  let messages = [];   // log of steps

  root.querySelector('#tp-scen').addEventListener('change', (e) => { scenario = e.target.value; reset(); });
  root.querySelector('#tp-run').addEventListener('click', run);
  root.querySelector('#tp-reset').addEventListener('click', reset);

  function reset() {
    messages = [];
    render();
  }

  async function run() {
    reset();
    const s = SCENARIOS[scenario];

    push('coord', 'Sending PREPARE to all participants', 'prepare');
    await wait(500);
    for (let i = 0; i < 3; i++) {
      push('coord-p' + i, `→ P${i}: PREPARE`, 'prepare');
      await wait(280);
    }

    // Participants vote
    for (let i = 0; i < 3; i++) {
      const vote = s.votes[i];
      push(`p${i}`, `${vote === 'yes' ? '✓ prepared, votes YES' : '✗ refuses, votes NO'}`, vote === 'yes' ? 'yes' : 'no');
      await wait(250);
      push(`p${i}-coord`, `P${i} → coordinator: VOTE ${vote.toUpperCase()}`, vote === 'yes' ? 'yes' : 'no');
      await wait(250);
    }

    // Participant crash scenario
    if (s.pCrash !== null) {
      push(`p${s.pCrash}-crash`, `💥 P${s.pCrash} crashes (was prepared, holding locks)`, 'crash');
      await wait(500);
    }

    // Coordinator crash scenario
    if (s.cCrash) {
      push('coord-crash', `💥 Coordinator crashes BEFORE sending commit/abort decision`, 'crash');
      await wait(400);
      push('stuck', `<strong>Participants stuck holding locks, awaiting decision they\'ll never get.</strong> This is the classic 2PC blocking problem.`, 'stuck');
      render();
      return;
    }

    // Decision
    const anyNo = s.votes.includes('no');
    const decision = anyNo ? 'ABORT' : 'COMMIT';
    push('decide', `All votes received. Decision: ${decision}`, anyNo ? 'abort' : 'commit');
    await wait(400);
    for (let i = 0; i < 3; i++) {
      if (i === s.pCrash) continue;
      push(`coord-p${i}-${decision}`, `→ P${i}: ${decision}`, anyNo ? 'abort' : 'commit');
      await wait(250);
      push(`p${i}-done`, `P${i}: ${decision === 'COMMIT' ? 'committed, locks released' : 'aborted, rolled back'}`, anyNo ? 'abort' : 'commit');
      await wait(250);
    }
    if (s.pCrash !== null) {
      push(`p${s.pCrash}-recover`, `When P${s.pCrash} recovers, it asks coordinator: outcome was ${decision}. It applies it then.`, 'info');
    }
    render();
  }

  function push(id, msg, kind) {
    messages.push({ id, msg, kind, t: new Date().toLocaleTimeString() });
    render();
  }

  function render() {
    let html = `<div class="tp-actors">`;
    // coordinator
    html += `<div class="tp-actor coord ${SCENARIOS[scenario].cCrash && messages.some((m) => m.id === 'coord-crash') ? 'dead' : ''}">
      <div class="tp-actor-name">COORDINATOR</div>
      <div class="tp-actor-state">${SCENARIOS[scenario].cCrash && messages.some((m) => m.id === 'coord-crash') ? '💥 crashed' : 'active'}</div>
    </div>`;
    for (let i = 0; i < 3; i++) {
      const isCrashed = i === SCENARIOS[scenario].pCrash && messages.some((m) => m.id === `p${i}-crash`);
      const vote = messages.find((m) => m.id === `p${i}` || m.id === `p${i}-coord`);
      html += `<div class="tp-actor part ${isCrashed ? 'dead' : ''}">
        <div class="tp-actor-name">P${i}</div>
        <div class="tp-actor-state">${isCrashed ? '💥 crashed' : (vote ? (vote.kind === 'yes' ? 'voted YES, prepared' : 'voted NO') : 'idle')}</div>
      </div>`;
    }
    html += `</div>`;

    // event log
    html += `<div class="tp-log">`;
    if (messages.length === 0) {
      html += `<div style="color: var(--ink-faint); font-family: var(--font-mono); font-size: 0.85rem; padding: 0.5rem;">no messages yet</div>`;
    }
    messages.forEach((m) => {
      const cls = ({
        prepare: 'tp-msg-prepare', yes: 'tp-msg-yes', no: 'tp-msg-no',
        commit: 'tp-msg-commit', abort: 'tp-msg-abort',
        crash: 'tp-msg-crash', stuck: 'tp-msg-stuck', info: 'tp-msg-info',
      })[m.kind] || '';
      html += `<div class="tp-msg ${cls}">${m.msg}</div>`;
    });
    html += `</div>`;

    html += `<style>
      .tp-actors { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 0.4rem; margin-bottom: 0.6rem; }
      .tp-actor { padding: 0.6rem 0.8rem; border: 2px solid var(--ink); border-radius: var(--radius); text-align: center; }
      .tp-actor.coord { background: #c8f0c8; }
      .tp-actor.part { background: #e6d6ff; }
      .tp-actor.dead { background: #ccc; opacity: 0.65; }
      .tp-actor-name { font-family: var(--font-display); letter-spacing: 1.5px; font-size: 0.9rem; }
      .tp-actor-state { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-soft); }
      .tp-log { background: var(--paper-deep); border: 2px solid var(--ink); border-radius: var(--radius); padding: 0.5rem 0.7rem; max-height: 260px; overflow-y: auto; }
      .tp-msg { font-family: var(--font-mono); font-size: 0.82rem; padding: 0.18em 0.4em; margin: 0.12em 0; border-radius: 2px; border-left: 3px solid transparent; }
      .tp-msg-prepare { border-left-color: #1c6dd0; }
      .tp-msg-yes { border-left-color: #2a8a3e; }
      .tp-msg-no { border-left-color: var(--accent); }
      .tp-msg-commit { border-left-color: #2a8a3e; background: #d6f5d6; }
      .tp-msg-abort { border-left-color: var(--accent); background: #f7c8c8; }
      .tp-msg-crash { border-left-color: var(--accent); background: var(--accent-soft); font-weight: 600; }
      .tp-msg-stuck { border-left-color: var(--accent); background: var(--accent-soft); font-weight: 600; padding: 0.4em 0.6em; }
      .tp-msg-info { border-left-color: var(--ink-soft); color: var(--ink-soft); }
      @media (max-width: 640px) { .tp-actors { grid-template-columns: 1fr 1fr; } }
    </style>`;
    stage.innerHTML = html;

    if (messages.length === 0) {
      root.querySelector('#tp-explain').innerHTML = 'Pick a scenario and click Run.';
    } else if (scenario === 'cCrash' && messages.some((m) => m.id === 'stuck')) {
      root.querySelector('#tp-explain').innerHTML = `<strong>This is why 2PC has fallen out of favor.</strong> The participants are blocked indefinitely. In real systems, a recovery protocol (or a human operator) has to eventually intervene. Modern designs prefer Sagas (no global commit) or Raft-based consensus (no single coordinator).`;
    } else if (messages.find((m) => m.kind === 'commit')) {
      root.querySelector('#tp-explain').innerHTML = `<strong>Committed atomically.</strong> All participants persisted the change; the transaction is durable across all of them.`;
    } else if (messages.find((m) => m.kind === 'abort')) {
      root.querySelector('#tp-explain').innerHTML = `<strong>Aborted atomically.</strong> Any participant voting NO means everyone rolls back. No partial commits ever escape.`;
    }
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  render();
}
