// TCP widget: animates a three-way handshake then a windowed data
// transfer with optional packet loss + retransmission.

export function initTcpWidget(root) {
  const state = {
    windowSize: 3,
    lossPct: 15,
    events: [],     // rendered ladder rows
    running: false,
    seed: 42,
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Three-Way Handshake + Windowed Send</div>

      <div class="controls">
        <label>Window:</label>
        <input type="range" min="1" max="6" step="1" value="3" id="win">
        <span id="win-val" style="font-family: var(--font-mono); min-width: 2em;">3</span>

        <label>Loss:</label>
        <input type="range" min="0" max="40" step="5" value="15" id="loss">
        <span id="loss-val" style="font-family: var(--font-mono); min-width: 3em;">15%</span>

        <button class="btn btn-accent" id="run">Start TCP session</button>
        <button class="btn btn-ghost" id="reset">Reset</button>
      </div>

      <div class="widget-stage" id="stage" style="min-height: 400px;"></div>

      <div class="metrics">
        <div class="metric"><div class="label">Segments delivered</div><div class="value" id="m-deliv">0</div></div>
        <div class="metric"><div class="label">Retransmits</div><div class="value" id="m-rt">0</div></div>
        <div class="metric accent"><div class="label">Status</div><div class="value" id="m-stat">Idle</div></div>
      </div>
    </div>
  `;

  const stage = root.querySelector('#stage');
  const winEl = root.querySelector('#win');
  const lossEl = root.querySelector('#loss');
  winEl.addEventListener('input', (e) => {
    state.windowSize = Number(e.target.value);
    root.querySelector('#win-val').textContent = state.windowSize;
  });
  lossEl.addEventListener('input', (e) => {
    state.lossPct = Number(e.target.value);
    root.querySelector('#loss-val').textContent = `${state.lossPct}%`;
  });
  root.querySelector('#run').addEventListener('click', run);
  root.querySelector('#reset').addEventListener('click', reset);

  function reset() {
    state.events = [];
    state.running = false;
    render('Idle');
  }

  function rng() {
    state.seed = (state.seed * 9301 + 49297) % 233280;
    return state.seed / 233280;
  }

  async function run() {
    if (state.running) return;
    reset();
    state.running = true;
    state.seed = Date.now() & 0xffff;
    let retransmits = 0;
    let delivered = 0;

    // Handshake
    pushEvent('→', 'SYN seq=0', 'handshake');
    render('Handshake');
    await wait(450);
    pushEvent('←', 'SYN-ACK seq=0 ack=1', 'handshake');
    render('Handshake');
    await wait(450);
    pushEvent('→', 'ACK ack=1', 'handshake');
    render('Connected');
    await wait(450);

    // Data
    const TOTAL = 6;
    let nextSend = 1;
    let unacked = []; // {seq, attempts}

    while (delivered < TOTAL) {
      // fill window
      while (unacked.length < state.windowSize && nextSend <= TOTAL) {
        unacked.push({ seq: nextSend, attempts: 1 });
        nextSend++;
      }
      // send each + maybe-loss each
      for (const seg of unacked) {
        const lost = rng() < state.lossPct / 100;
        pushEvent('→', `DATA seq=${seg.seq}${seg.attempts > 1 ? ` (retry ${seg.attempts})` : ''}`, lost ? 'lost' : 'data');
        render('Sending');
        await wait(280);
      }
      // ACKs for the ones that got through
      const arrived = unacked.filter(() => rng() >= state.lossPct / 100 / 1.7); // ACKs more reliable than initial
      // Approximation: ack only consecutive from base
      const inOrder = [];
      for (const seg of unacked) {
        if (arrived.find((a) => a.seq === seg.seq)) inOrder.push(seg);
        else break;
      }
      if (inOrder.length === 0) {
        // RTO — all retransmitted
        await wait(550);
        unacked.forEach((s) => s.attempts += 1);
        retransmits += unacked.length;
        pushEvent(' ', `RTO — retransmit window`, 'rto');
        render('Retransmit');
      } else {
        for (const seg of inOrder) {
          pushEvent('←', `ACK ack=${seg.seq + 1}`, 'ack');
          delivered = Math.max(delivered, seg.seq);
          render('Acked');
          await wait(260);
        }
        unacked = unacked.filter((s) => !inOrder.find((o) => o.seq === s.seq));
        // remaining unacked get retransmitted
        if (unacked.length) {
          retransmits += unacked.length;
          unacked.forEach((s) => s.attempts += 1);
        }
      }

      root.querySelector('#m-rt').textContent = retransmits;
      root.querySelector('#m-deliv').textContent = `${delivered}/${TOTAL}`;
    }

    pushEvent(' ', 'All segments acked', 'done');
    render('Done ✓');
    state.running = false;
  }

  function pushEvent(arrow, text, kind) {
    state.events.push({ arrow, text, kind });
  }

  function render(status) {
    let html = `
      <div style="display: grid; grid-template-columns: 1fr 80px 1fr; gap: 0.4rem; align-items: stretch;">
        <div style="text-align: right; font-family: var(--font-display); font-size: 1.2rem; letter-spacing: 2px;">CLIENT</div>
        <div></div>
        <div style="font-family: var(--font-display); font-size: 1.2rem; letter-spacing: 2px;">SERVER</div>
      </div>
      <div class="tcp-ladder">
    `;
    state.events.forEach((e, i) => {
      const isLeft = e.arrow === '→' || (e.arrow === ' ' && i % 2 === 0);
      const bg = colorFor(e.kind);
      const cell = `<div class="tcp-cell" style="background: ${bg}">${escape(e.text)}</div>`;
      const arrowVis = e.arrow === ' ' ? '' : `<div class="tcp-arrow">${e.arrow}</div>`;
      const blank = `<div></div>`;
      html += `<div class="tcp-row" style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 80px 1fr; gap: 0.4rem; align-items: center; margin: 0.2rem 0;">`;
      if (isLeft) { html += cell + arrowVis + blank; }
      else { html += blank + arrowVis + cell; }
      html += `</div>`;
    });
    html += `</div>`;
    html += `<style>
      .tcp-cell { padding: 0.35em 0.7em; border: 1.5px solid var(--ink); border-radius: var(--radius); font-family: var(--font-mono); font-size: 0.85rem; }
      .tcp-arrow { text-align: center; font-family: var(--font-display); font-size: 1.4rem; color: var(--accent); letter-spacing: 2px; }
    </style>`;
    stage.innerHTML = html;
    root.querySelector('#m-stat').textContent = status;
  }

  function colorFor(kind) {
    return {
      handshake: '#fff6dc',
      data: 'var(--paper)',
      ack: '#cdf5d3',
      lost: '#f7c8c8',
      rto: '#ffe9b3',
      done: '#cdf5d3',
    }[kind] || 'var(--paper)';
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  reset();
}
