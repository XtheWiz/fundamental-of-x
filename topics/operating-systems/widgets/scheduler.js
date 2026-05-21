// Scheduler widget: 4 jobs with (arrival, burst, priority). User
// picks a policy; widget produces a Gantt chart + per-job stats.

const JOBS = [
  { id: 'A', arrival: 0, burst: 6, priority: 2, color: '#cfe5ff' },
  { id: 'B', arrival: 1, burst: 3, priority: 1, color: '#c8f0c8' },
  { id: 'C', arrival: 2, burst: 8, priority: 3, color: '#ffe9b3' },
  { id: 'D', arrival: 3, burst: 2, priority: 1, color: '#f7c8c8' },
];

const POLICIES = {
  fcfs:  'FCFS (first come, first served)',
  rr:    'Round-robin (quantum=2)',
  sjf:   'SJF (non-preemptive, shortest job)',
  prio:  'Priority (lower = higher priority)',
  cfs:   'CFS-like (fairness via vruntime)',
};

function schedule(policy) {
  const jobs = JOBS.map((j) => ({ ...j, remaining: j.burst, vruntime: 0 }));
  const timeline = []; // [{t, job}]
  let t = 0;
  const max = 100;
  while (jobs.some((j) => j.remaining > 0) && t < max) {
    const ready = jobs.filter((j) => j.arrival <= t && j.remaining > 0);
    if (!ready.length) { timeline.push({ t, job: null }); t++; continue; }
    let next;
    if (policy === 'fcfs') {
      // run to completion of the earliest-arrival ready job
      next = ready.sort((a, b) => a.arrival - b.arrival)[0];
      const slice = next.remaining;
      for (let i = 0; i < slice; i++) timeline.push({ t: t + i, job: next.id });
      t += slice;
      next.remaining = 0;
    } else if (policy === 'sjf') {
      next = ready.sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival)[0];
      const slice = next.remaining;
      for (let i = 0; i < slice; i++) timeline.push({ t: t + i, job: next.id });
      t += slice;
      next.remaining = 0;
    } else if (policy === 'prio') {
      next = ready.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival)[0];
      const slice = next.remaining;
      for (let i = 0; i < slice; i++) timeline.push({ t: t + i, job: next.id });
      t += slice;
      next.remaining = 0;
    } else if (policy === 'rr') {
      const q = 2;
      // simple ready-queue rotation
      // Build a queue order from previous timeline + new arrivals
      ready.sort((a, b) => a.arrival - b.arrival);
      // pick the one that ran longest ago (or first if none)
      const lastRunByJob = {};
      for (let i = timeline.length - 1; i >= 0; i--) {
        const tj = timeline[i].job;
        if (tj && lastRunByJob[tj] === undefined) lastRunByJob[tj] = i;
      }
      next = ready.sort((a, b) => (lastRunByJob[a.id] ?? -1) - (lastRunByJob[b.id] ?? -1))[0];
      const slice = Math.min(q, next.remaining);
      for (let i = 0; i < slice; i++) timeline.push({ t: t + i, job: next.id });
      t += slice;
      next.remaining -= slice;
    } else if (policy === 'cfs') {
      // pick min vruntime
      next = ready.sort((a, b) => a.vruntime - b.vruntime || a.arrival - b.arrival)[0];
      // run for 1 unit, increment vruntime weighted by priority (lower prio number = higher prio = lower vruntime gain)
      timeline.push({ t, job: next.id });
      const weight = 1 / next.priority;
      next.vruntime += 1 / weight;
      next.remaining -= 1;
      t += 1;
    }
  }
  // compute per-job completion + wait + turnaround
  const stats = {};
  JOBS.forEach((j) => {
    const completion = timeline.reduce((acc, e) => e.job === j.id ? e.t + 1 : acc, j.arrival);
    const turnaround = completion - j.arrival;
    const wait = turnaround - j.burst;
    stats[j.id] = { completion, turnaround, wait };
  });
  return { timeline, stats };
}

export function initSchedulerWidget(root) {
  let policy = 'fcfs';

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">4 jobs, 1 CPU</div>

      <div class="controls">
        <label>Policy:</label>
        <select class="field" id="sc-policy">
          ${Object.entries(POLICIES).map(([id, l]) => `<option value="${id}">${l}</option>`).join('')}
        </select>
      </div>

      <div class="widget-stage" id="sc-stage" style="min-height: 220px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Avg wait time</div><div class="value" id="m-wait">—</div></div>
        <div class="metric"><div class="label">Avg turnaround</div><div class="value" id="m-tt">—</div></div>
        <div class="metric accent"><div class="label">Total CPU time</div><div class="value" id="m-cpu">—</div></div>
      </div>

      <div class="callout" id="sc-explain"></div>
    </div>
  `;

  const stage = root.querySelector('#sc-stage');
  root.querySelector('#sc-policy').addEventListener('change', (e) => { policy = e.target.value; render(); });

  function render() {
    const { timeline, stats } = schedule(policy);
    const maxT = timeline.length;
    const W = 720;
    const H = 200;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<style>
      .sc-job-row { font-family: var(--font-display); font-size: 14px; letter-spacing: 1.5px; fill: var(--ink); }
      .sc-burst { stroke: var(--ink); stroke-width: 1.5; }
      .sc-axis { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
      .sc-track { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 1; }
      .sc-arrival { stroke: var(--ink); stroke-width: 2; }
    </style>`;

    const xStart = 60;
    const xEnd = W - 20;
    const cellW = (xEnd - xStart) / maxT;

    // time axis
    for (let i = 0; i <= maxT; i++) {
      const x = xStart + i * cellW;
      svg += `<line x1="${x}" y1="155" x2="${x}" y2="160" stroke="var(--ink-soft)" stroke-width="1"/>`;
      if (i % 2 === 0) svg += `<text class="sc-axis" x="${x}" y="172" text-anchor="middle">${i}</text>`;
    }
    svg += `<line x1="${xStart}" y1="160" x2="${xEnd}" y2="160" stroke="var(--ink-soft)" stroke-width="1"/>`;

    // single CPU lane
    svg += `<text class="sc-job-row" x="20" y="115">CPU</text>`;
    svg += `<rect class="sc-track" x="${xStart}" y="100" width="${xEnd - xStart}" height="40" rx="3"/>`;

    timeline.forEach((slot) => {
      if (!slot.job) return;
      const x = xStart + slot.t * cellW;
      const job = JOBS.find((j) => j.id === slot.job);
      svg += `<rect class="sc-burst" x="${x}" y="100" width="${cellW}" height="40" fill="${job.color}"/>`;
      if (cellW > 16) {
        svg += `<text x="${x + cellW/2}" y="125" text-anchor="middle" style="font-family: var(--font-display); font-size: 14px; letter-spacing: 1px; fill: var(--ink);">${slot.job}</text>`;
      }
    });

    // arrival markers
    JOBS.forEach((j) => {
      const x = xStart + j.arrival * cellW;
      svg += `<line class="sc-arrival" x1="${x}" y1="60" x2="${x}" y2="100"/>`;
      svg += `<polygon points="${x - 5},60 ${x + 5},60 ${x},70" fill="${j.color}" stroke="var(--ink)" stroke-width="1.5"/>`;
      svg += `<text x="${x}" y="55" text-anchor="middle" class="sc-axis">${j.id}↓ burst:${j.burst} prio:${j.priority}</text>`;
    });

    svg += `</svg>`;
    stage.innerHTML = svg;

    // metrics
    const avgWait = (Object.values(stats).reduce((a, s) => a + s.wait, 0) / JOBS.length).toFixed(1);
    const avgTT = (Object.values(stats).reduce((a, s) => a + s.turnaround, 0) / JOBS.length).toFixed(1);
    root.querySelector('#m-wait').textContent = avgWait;
    root.querySelector('#m-tt').textContent = avgTT;
    root.querySelector('#m-cpu').textContent = JOBS.reduce((a, j) => a + j.burst, 0);

    // explain
    let exp = `<strong>${POLICIES[policy]}</strong>. `;
    if (policy === 'fcfs') exp += `Jobs run in arrival order. Long jobs early can starve later short ones — see how D (burst=2, arrives at t=3) waits behind A and B.`;
    else if (policy === 'sjf') exp += `Always picks the shortest <em>remaining</em> job. Minimizes average wait time, at the cost of starving long jobs (C waits longest here).`;
    else if (policy === 'rr') exp += `Quantum=2. Every ready job gets 2 ticks before yielding. Fair but adds context-switch overhead (we ignore the overhead in this demo).`;
    else if (policy === 'prio') exp += `Lower priority number runs first. B and D (priority 1) preempt A (priority 2) and C (priority 3). Risk: starvation of priority-3 jobs.`;
    else if (policy === 'cfs') exp += `Each tick, the job with the lowest accumulated "virtual runtime" runs. Roughly equivalent to fair-share. Priority acts as a weight.`;
    root.querySelector('#sc-explain').innerHTML = exp;
  }

  render();
}
