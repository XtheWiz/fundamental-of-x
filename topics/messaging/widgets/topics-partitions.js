// Topics/partitions/consumer-groups widget: visualize partition→consumer
// assignment as user tunes counts.

export function initTopicsPartitionsWidget(root) {
  const state = {
    partitions: 4,
    consumersA: 2,   // group A
    consumersB: 1,   // group B
  };

  root.innerHTML = `
    <div class="widget">
      <div class="widget-title">Topic "orders" with N partitions</div>

      <div class="controls">
        <label>Partitions:</label>
        <input type="range" min="1" max="8" value="4" id="tp-p">
        <span style="font-family: var(--font-mono);" id="tp-p-val">4</span>
        <label>Consumers in Group A:</label>
        <input type="range" min="1" max="6" value="2" id="tp-a">
        <span style="font-family: var(--font-mono);" id="tp-a-val">2</span>
        <label>Consumers in Group B:</label>
        <input type="range" min="0" max="6" value="1" id="tp-b">
        <span style="font-family: var(--font-mono);" id="tp-b-val">1</span>
      </div>

      <div class="widget-stage" id="tp-stage" style="min-height: 360px;"></div>

      <div class="callout" id="tp-explain"></div>
    </div>
  `;

  ['p','a','b'].forEach((k) => {
    const slider = root.querySelector('#tp-' + k);
    const val = root.querySelector('#tp-' + k + '-val');
    slider.addEventListener('input', (e) => {
      const v = Number(e.target.value);
      val.textContent = v;
      if (k === 'p') state.partitions = v;
      if (k === 'a') state.consumersA = v;
      if (k === 'b') state.consumersB = v;
      render();
    });
  });

  function assign(consumerCount) {
    // Round-robin partition assignment
    if (consumerCount === 0) return new Array(state.partitions).fill(null);
    const out = new Array(state.partitions).fill(null);
    for (let p = 0; p < state.partitions; p++) {
      out[p] = p % consumerCount;
    }
    return out;
  }

  function render() {
    const W = 760, H = 360;
    const partitions = state.partitions;
    const partW = (W - 80) / Math.max(partitions, 1);

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px">`;
    svg += `<style>
      .tp-tube { fill: var(--paper-deep); stroke: var(--ink); stroke-width: 2; }
      .tp-msg { fill: var(--accent); stroke: var(--ink); stroke-width: 1; }
      .tp-consumer { fill: #c8f0c8; stroke: var(--ink); stroke-width: 2.5; }
      .tp-consumer.idle { fill: #ddd; stroke-dasharray: 4 3; }
      .tp-line { stroke: var(--ink); stroke-width: 1.5; stroke-dasharray: 4 3; }
      .tp-line.a { stroke: #1c6dd0; }
      .tp-line.b { stroke: #7f4eb6; }
    </style>`;

    // Topic header
    svg += `<text class="msg-label" x="20" y="22">TOPIC: orders</text>`;
    svg += `<text class="msg-sub" x="20" y="40">${partitions} partition(s)</text>`;

    // Partitions
    const partY = 50;
    for (let p = 0; p < partitions; p++) {
      const x = 40 + p * partW;
      svg += `<rect class="tp-tube" x="${x}" y="${partY}" width="${partW - 8}" height="50" rx="4"/>`;
      svg += `<text class="msg-sub" x="${x + (partW - 8)/2}" y="${partY - 4}" text-anchor="middle">P${p}</text>`;
      // 4 messages per partition
      for (let m = 0; m < 4; m++) {
        const mx = x + 6 + m * 18;
        svg += `<rect class="tp-msg" x="${mx}" y="${partY + 14}" width="14" height="22" rx="2"/>`;
      }
    }

    // Group A
    const groupAY = 180;
    svg += `<text class="msg-label" x="20" y="${groupAY - 30}">GROUP A (group.id = "emailer")</text>`;
    svg += `<text class="msg-sub" x="20" y="${groupAY - 14}">${state.consumersA} consumer(s) — partitions split across them</text>`;
    const assignA = assign(state.consumersA);
    for (let c = 0; c < state.consumersA; c++) {
      const x = 40 + c * 130;
      svg += `<rect class="tp-consumer" x="${x}" y="${groupAY}" width="110" height="50" rx="6"/>`;
      svg += `<text class="msg-label" x="${x + 55}" y="${groupAY + 22}" text-anchor="middle">A-${c}</text>`;
      const myParts = assignA.map((cidx, pidx) => cidx === c ? pidx : null).filter((x) => x !== null);
      svg += `<text class="msg-sub" x="${x + 55}" y="${groupAY + 40}" text-anchor="middle">P: ${myParts.length ? myParts.join(',') : '(idle)'}</text>`;
      // lines to partitions
      myParts.forEach((p) => {
        const px = 40 + p * partW + (partW - 8) / 2;
        svg += `<line class="tp-line a" x1="${px}" y1="${partY + 50}" x2="${x + 55}" y2="${groupAY}"/>`;
      });
    }
    // any partitions not assigned (consumer count < partitions) show idle status
    if (state.consumersA > partitions) {
      for (let c = partitions; c < state.consumersA; c++) {
        const x = 40 + c * 130;
        svg += `<rect class="tp-consumer idle" x="${x}" y="${groupAY}" width="110" height="50" rx="6"/>`;
        svg += `<text class="msg-label" x="${x + 55}" y="${groupAY + 22}" text-anchor="middle">A-${c}</text>`;
        svg += `<text class="msg-sub" x="${x + 55}" y="${groupAY + 40}" text-anchor="middle">IDLE</text>`;
      }
    }

    // Group B
    if (state.consumersB > 0) {
      const groupBY = 290;
      svg += `<text class="msg-label" x="20" y="${groupBY - 14}">GROUP B (group.id = "analytics") — independent stream</text>`;
      const assignB = assign(state.consumersB);
      for (let c = 0; c < state.consumersB; c++) {
        const x = 40 + c * 130;
        svg += `<rect class="tp-consumer" x="${x}" y="${groupBY}" width="110" height="50" rx="6" fill="#cfe5ff"/>`;
        svg += `<text class="msg-label" x="${x + 55}" y="${groupBY + 22}" text-anchor="middle">B-${c}</text>`;
        const myParts = assignB.map((cidx, pidx) => cidx === c ? pidx : null).filter((x) => x !== null);
        svg += `<text class="msg-sub" x="${x + 55}" y="${groupBY + 40}" text-anchor="middle">P: ${myParts.length ? myParts.join(',') : '(idle)'}</text>`;
        myParts.forEach((p) => {
          const px = 40 + p * partW + (partW - 8) / 2;
          svg += `<line class="tp-line b" x1="${px}" y1="${partY + 50}" x2="${x + 55}" y2="${groupBY}"/>`;
        });
      }
    }

    svg += `</svg>`;
    root.querySelector('#tp-stage').innerHTML = svg;

    // Explain
    let exp;
    if (state.consumersA > partitions) {
      exp = `<strong>${state.consumersA - partitions} consumer(s) idle in Group A.</strong> Partitions are the max parallelism unit — extra consumers just stand around. Add more partitions or fewer consumers.`;
    } else if (state.consumersA === partitions) {
      exp = `Perfect 1-to-1: each consumer in Group A gets one partition. Maximum parallelism, no idle workers.`;
    } else {
      const avg = (partitions / state.consumersA).toFixed(1);
      exp = `Each consumer in Group A handles ~${avg} partitions. Throughput per consumer scales with how many it owns.`;
    }
    if (state.consumersB > 0) {
      exp += ` Group B reads the same topic <em>independently</em> — its consumers also see every message.`;
    }
    root.querySelector('#tp-explain').innerHTML = exp;
  }

  render();
}
