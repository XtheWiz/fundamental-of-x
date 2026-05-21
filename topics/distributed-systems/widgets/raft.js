// Raft widget: 5 nodes, fixed leader (N0). User appends entries.
// Show log replication + commit on majority. Drop network per node.

const NUM_NODES = 5;

export function initRaftWidget(root) {
  const state = {
    leader: 0,
    nodes: [],   // [{id, log: [{term, value}], commitIndex, alive, networkOk}]
    entryCounter: 0,
    log: [],
  };
  for (let i = 0; i < NUM_NODES; i++) {
    state.nodes.push({
      id: i,
      log: [],
      commitIndex: -1,
      alive: true,
      networkOk: true,
    });
  }

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">5-node Raft cluster (N0 is leader)</div>

      <div class="controls">
        <button class="btn btn-accent" id="rf-append">Append "x++"</button>
        <button class="btn" id="rf-append2">Append "y=42"</button>
        <button class="btn btn-ghost" id="rf-reset">Reset</button>
      </div>

      <div class="controls" id="rf-toggles">
        ${state.nodes.map((n) => `
          <label style="display: inline-flex; gap: 0.3em;">
            <input type="checkbox" data-node="${n.id}" checked> N${n.id} ${n.id === 0 ? '(leader)' : 'reachable'}
          </label>
        `).join('')}
      </div>

      <div class="widget-stage" id="rf-stage" style="min-height: 320px;"></div>

      <div class="callout" id="rf-explain">Click "Append" to send a command to the leader. Watch it replicate to followers and commit once a majority acks.</div>
    </div>
  `;

  const stage = root.querySelector('#rf-stage');
  root.querySelectorAll('input[data-node]').forEach((cb) =>
    cb.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.node);
      state.nodes[id].networkOk = e.target.checked;
      render();
    })
  );
  root.querySelector('#rf-append').addEventListener('click', () => append('x++'));
  root.querySelector('#rf-append2').addEventListener('click', () => append('y=42'));
  root.querySelector('#rf-reset').addEventListener('click', () => {
    state.nodes.forEach((n) => { n.log = []; n.commitIndex = -1; n.alive = true; n.networkOk = true; });
    state.entryCounter = 0;
    state.log = [];
    root.querySelectorAll('input[data-node]').forEach((cb) => cb.checked = true);
    render();
  });

  async function append(cmd) {
    state.entryCounter++;
    const entry = { term: 1, value: cmd, idx: state.entryCounter - 1 };
    state.nodes[state.leader].log.push(entry);
    addLog('info', `Leader appended entry ${entry.idx}: "${cmd}" to own log`);
    render();
    await wait(350);

    // Send AppendEntries to each follower
    let acks = 1; // leader counts itself
    for (let i = 0; i < state.nodes.length; i++) {
      if (i === state.leader) continue;
      const follower = state.nodes[i];
      if (!follower.networkOk) {
        addLog('warn', `→ N${i}: AppendEntries DROPPED (network)`);
        continue;
      }
      // Replicate
      follower.log.push(entry);
      acks++;
      addLog('ok', `→ N${i}: AppendEntries OK (log now has ${follower.log.length} entries)`);
      render();
      await wait(180);
    }

    // Commit if majority
    const majority = Math.floor(state.nodes.length / 2) + 1;
    if (acks >= majority) {
      state.nodes[state.leader].commitIndex = entry.idx;
      addLog('ok', `${acks}/${state.nodes.length} acks ≥ ${majority} majority → entry ${entry.idx} COMMITTED on leader`);
      render();
      await wait(300);
      // Tell followers about commit
      for (let i = 0; i < state.nodes.length; i++) {
        if (i === state.leader) continue;
        const f = state.nodes[i];
        if (!f.networkOk) continue;
        if (f.log.find((e) => e.idx === entry.idx)) {
          f.commitIndex = entry.idx;
        }
      }
      render();
    } else {
      addLog('err', `Only ${acks}/${state.nodes.length} acks (< ${majority}). Entry stays uncommitted.`);
    }
  }

  function render() {
    const W = 740;
    const H = 60 + NUM_NODES * 56;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<style>
      .rf-name { font-family: var(--font-display); font-size: 15px; letter-spacing: 1.5px; fill: var(--ink); }
      .rf-sub { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .rf-entry { stroke: var(--ink); stroke-width: 1.5; }
      .rf-entry.committed { fill: #c8f0c8; }
      .rf-entry.uncommitted { fill: #ffe9b3; }
      .rf-entry-text { font-family: var(--font-mono); font-size: 10px; fill: var(--ink); }
      .rf-track { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1; }
    </style>`;

    // header
    svg += `<text class="rf-sub" x="20" y="20">node</text>`;
    svg += `<text class="rf-sub" x="170" y="20">log entries (committed = green; uncommitted = yellow)</text>`;

    state.nodes.forEach((n, idx) => {
      const y = 40 + idx * 56;
      const isLeader = n.id === state.leader;
      svg += `<text class="rf-name" x="20" y="${y + 22}">N${n.id}${isLeader ? ' ★' : ''}</text>`;
      svg += `<text class="rf-sub" x="20" y="${y + 38}">${n.networkOk ? `commit ${n.commitIndex < 0 ? '—' : n.commitIndex}` : 'unreachable'}</text>`;
      svg += `<rect class="rf-track" x="170" y="${y + 5}" width="${W - 190}" height="36" rx="3" ${n.networkOk ? '' : 'opacity="0.4"'}/>`;
      n.log.forEach((e, i) => {
        const x = 180 + i * 70;
        const committed = e.idx <= n.commitIndex;
        svg += `<rect class="rf-entry ${committed ? 'committed' : 'uncommitted'}" x="${x}" y="${y + 10}" width="60" height="26" rx="3" ${n.networkOk ? '' : 'opacity="0.4"'}/>`;
        svg += `<text class="rf-entry-text" x="${x + 30}" y="${y + 27}" text-anchor="middle" ${n.networkOk ? '' : 'opacity="0.4"'}>${e.value}</text>`;
      });
    });

    svg += `</svg>`;
    stage.innerHTML = svg;
  }

  function addLog(level, msg) {
    state.log.unshift({ level, msg, t: new Date().toLocaleTimeString() });
    if (state.log.length > 50) state.log.pop();
    // Quick + dirty log display
    let html = '';
    state.log.forEach((e) => {
      html += `<div class="entry ${e.level}"><span class="t">${e.t}</span>${e.msg}</div>`;
    });
    // No log element on this page — embed in callout temporarily
    root.querySelector('#rf-explain').innerHTML = state.log.length
      ? state.log.slice(0, 6).map((e) => `<div style="font-family: var(--font-mono); font-size: 0.8rem;">${e.msg}</div>`).join('')
      : 'Click "Append" to send a command to the leader.';
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  render();
}
