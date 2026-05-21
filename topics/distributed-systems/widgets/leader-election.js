// Leader election widget: 5 nodes on a ring, randomized election
// timeouts, voting. User can kill nodes and watch re-elections.

const NUM_NODES = 5;
const TICK_MS = 50;
const HEARTBEAT_INTERVAL = 20;  // ticks
const ELECTION_TIMEOUT_MIN = 30;
const ELECTION_TIMEOUT_MAX = 60;

export function initLeaderElectionWidget(root) {
  let timer = null;
  let tick = 0;
  let term = 0;
  let log = [];
  let nodes = [];

  function init() {
    nodes = [];
    for (let i = 0; i < NUM_NODES; i++) {
      nodes.push({
        id: i,
        state: 'follower',     // follower | candidate | leader | dead
        term: 0,
        votedFor: null,
        timeout: randomTimeout(),
        ticksSinceHeartbeat: 0,
        votesReceived: 0,
      });
    }
    term = 0;
    log = [];
    tick = 0;
  }

  function randomTimeout() {
    return Math.floor(ELECTION_TIMEOUT_MIN + Math.random() * (ELECTION_TIMEOUT_MAX - ELECTION_TIMEOUT_MIN));
  }

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">5-node cluster</div>

      <div class="controls">
        <button class="btn btn-accent" id="le-run">Start</button>
        <button class="btn" id="le-pause">Pause</button>
        <button class="btn" id="le-kill">Kill leader</button>
        <button class="btn btn-ghost" id="le-reset">Reset</button>
      </div>

      <div class="widget-stage" id="le-stage" style="min-height: 320px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Term</div><div class="value" id="m-term">0</div></div>
        <div class="metric accent"><div class="label">Leader</div><div class="value" id="m-leader">—</div></div>
        <div class="metric"><div class="label">Tick</div><div class="value" id="m-tick">0</div></div>
      </div>

      <div class="log" id="le-log"></div>
    </div>
  `;

  const stage = root.querySelector('#le-stage');
  const logEl = root.querySelector('#le-log');

  root.querySelector('#le-run').addEventListener('click', () => {
    if (!timer) timer = setInterval(step, TICK_MS);
  });
  root.querySelector('#le-pause').addEventListener('click', () => {
    if (timer) { clearInterval(timer); timer = null; }
  });
  root.querySelector('#le-kill').addEventListener('click', () => {
    const leader = nodes.find((n) => n.state === 'leader');
    if (!leader) { addLog('warn', 'No leader to kill'); return; }
    leader.state = 'dead';
    addLog('err', `Node ${leader.id} (was leader, term ${leader.term}) KILLED.`);
    render();
  });
  root.querySelector('#le-reset').addEventListener('click', () => {
    if (timer) { clearInterval(timer); timer = null; }
    init();
    logEl.innerHTML = '';
    render();
  });

  function step() {
    tick++;
    const leader = nodes.find((n) => n.state === 'leader');

    if (leader) {
      // leader sends heartbeats
      if (tick % HEARTBEAT_INTERVAL === 0) {
        nodes.forEach((n) => {
          if (n.id !== leader.id && n.state !== 'dead') {
            n.ticksSinceHeartbeat = 0;
            n.term = Math.max(n.term, leader.term);
            n.state = 'follower';
            n.votedFor = null;
          }
        });
      }
    }

    nodes.forEach((n) => {
      if (n.state === 'dead') return;
      n.ticksSinceHeartbeat++;

      if (n.state === 'follower' && n.ticksSinceHeartbeat > n.timeout) {
        // Become candidate
        n.state = 'candidate';
        n.term++;
        n.votedFor = n.id;
        n.votesReceived = 1;
        n.ticksSinceHeartbeat = 0;
        n.timeout = randomTimeout();
        addLog('info', `Node ${n.id} timed out → candidate (term ${n.term})`);

        // Request votes from all live nodes immediately (simplified)
        nodes.forEach((other) => {
          if (other.id !== n.id && other.state !== 'dead') {
            if (other.term < n.term && other.votedFor === null) {
              other.term = n.term;
              other.votedFor = n.id;
              n.votesReceived++;
              other.ticksSinceHeartbeat = 0;  // give the vote = reset our timer
            }
          }
        });

        // Check majority
        const liveCount = nodes.filter((x) => x.state !== 'dead').length;
        if (n.votesReceived > liveCount / 2) {
          // win!
          nodes.forEach((other) => {
            if (other.state === 'leader' || other.state === 'candidate') other.state = 'follower';
          });
          n.state = 'leader';
          term = n.term;
          addLog('ok', `Node ${n.id} WON term ${n.term} with ${n.votesReceived}/${liveCount} votes`);
        }
      }
    });

    render();
  }

  function render() {
    const W = 460, H = 320;
    const cx = W / 2, cy = H / 2;
    const r = 110;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">`;
    svg += `<style>
      .le-node-circle { stroke: var(--ink); stroke-width: 2.5; }
      .le-node-circle.follower { fill: #cfe5ff; }
      .le-node-circle.candidate { fill: #ffe9b3; }
      .le-node-circle.leader { fill: var(--accent); }
      .le-node-circle.dead { fill: #ccc; stroke: #888; stroke-dasharray: 4 3; }
      .le-node-name { font-family: var(--font-display); font-size: 16px; letter-spacing: 1.5px; fill: var(--ink); }
      .le-node-name.leader-text { fill: white; }
      .le-node-sub { font-family: var(--font-mono); font-size: 10px; fill: var(--ink); }
      .le-node-sub.leader-text { fill: white; }
      .le-heartbeat { stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 3 4; fill: none; opacity: 0.5; }
    </style>`;

    // heartbeat lines from leader to followers
    const leader = nodes.find((n) => n.state === 'leader');
    if (leader) {
      const lp = nodePos(leader.id);
      nodes.forEach((n) => {
        if (n.id !== leader.id && n.state !== 'dead') {
          const p = nodePos(n.id);
          svg += `<line class="le-heartbeat" x1="${lp.x}" y1="${lp.y}" x2="${p.x}" y2="${p.y}"/>`;
        }
      });
    }

    nodes.forEach((n) => {
      const p = nodePos(n.id);
      svg += `<circle class="le-node-circle ${n.state}" cx="${p.x}" cy="${p.y}" r="36"/>`;
      const leaderText = n.state === 'leader' ? 'leader-text' : '';
      svg += `<text class="le-node-name ${leaderText}" x="${p.x}" y="${p.y - 4}" text-anchor="middle">N${n.id}</text>`;
      svg += `<text class="le-node-sub ${leaderText}" x="${p.x}" y="${p.y + 10}" text-anchor="middle">${n.state === 'dead' ? 'DEAD' : `t=${n.term}`}</text>`;
      if (n.state !== 'dead' && n.state !== 'leader') {
        const remaining = Math.max(0, n.timeout - n.ticksSinceHeartbeat);
        svg += `<text class="le-node-sub ${leaderText}" x="${p.x}" y="${p.y + 22}" text-anchor="middle" style="font-size: 9px; opacity: 0.7;">to: ${remaining}</text>`;
      }
    });

    svg += `</svg>`;
    stage.innerHTML = svg;

    root.querySelector('#m-term').textContent = term;
    root.querySelector('#m-leader').textContent = leader ? `N${leader.id}` : '—';
    root.querySelector('#m-tick').textContent = tick;

    function nodePos(i) {
      const angle = (i / NUM_NODES) * 2 * Math.PI - Math.PI / 2;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    }
  }

  function addLog(level, msg) {
    log.push({ level, msg, t: tick });
    const d = document.createElement('div');
    d.className = `entry ${level}`;
    d.innerHTML = `<span class="t">t=${tick}</span>${msg}`;
    logEl.prepend(d);
    while (logEl.children.length > 30) logEl.removeChild(logEl.lastChild);
  }

  init();
  render();
}
