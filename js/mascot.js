// X-sensei — the Fundamental of X mascot. Inline SVG, no external assets.
// Three poses share head + body; only the right arm differs.
// Colors come from CSS variables so the mascot inherits the page theme.
//
// Usage:
//   import { mascot, mountMascot } from './mascot.js';
//   element.innerHTML = mascot('wave', { size: 48 });
//
// Importing this module also auto-mounts the mascot into well-known spots
// (.site-header .brand, .hub .intro, .takeaways) so existing pages
// pick it up without per-page edits.

const C = {
  ink: 'var(--ink, #1a1a1a)',
  paper: 'var(--paper, #f5f1e8)',
  accent: 'var(--accent, #d62828)',
};

function body(rightArm) {
  return `
    <!-- back hair shadow -->
    <path d="M 18 42 Q 14 14 38 6 Q 50 -2 64 8 Q 86 12 82 46 Q 80 58 70 52 Q 80 28 56 22 Q 34 22 28 38 Q 22 52 22 44 Z"
          fill="${C.ink}"/>

    <!-- head -->
    <circle cx="50" cy="48" r="28" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.5"/>

    <!-- front bangs -->
    <path d="M 22 42 Q 30 26 42 30 Q 50 24 58 30 Q 70 26 78 42 Q 64 34 50 36 Q 36 34 22 42 Z"
          fill="${C.ink}"/>

    <!-- ahoge (single stray hair, manga signature) -->
    <path d="M 50 6 Q 56 0 54 -4" stroke="${C.ink}" stroke-width="2" fill="none" stroke-linecap="round"/>

    <!-- ear tuft right -->
    <path d="M 76 38 Q 86 36 80 50 Q 78 50 76 44 Z" fill="${C.ink}"/>

    <!-- eyes -->
    <circle cx="40" cy="52" r="2.8" fill="${C.ink}"/>
    <circle cx="60" cy="52" r="2.8" fill="${C.ink}"/>
    <circle cx="41" cy="51" r="0.9" fill="white"/>
    <circle cx="61" cy="51" r="0.9" fill="white"/>

    <!-- blush -->
    <ellipse cx="34" cy="60" rx="3.6" ry="1.7" fill="${C.accent}" opacity="0.4"/>
    <ellipse cx="66" cy="60" rx="3.6" ry="1.7" fill="${C.accent}" opacity="0.4"/>

    <!-- mouth -->
    <path d="M 44 64 Q 50 68.5 56 64" stroke="${C.ink}" stroke-width="2" fill="none" stroke-linecap="round"/>

    <!-- neck -->
    <rect x="46" y="75" width="8" height="6" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>

    <!-- shirt body -->
    <path d="M 28 96 Q 50 82 72 96 L 76 134 L 24 134 Z"
          fill="${C.paper}" stroke="${C.ink}" stroke-width="2.5"/>

    <!-- scarf -->
    <rect x="22" y="82" width="56" height="12" fill="${C.accent}" stroke="${C.ink}" stroke-width="2"/>
    <text x="50" y="91.5" text-anchor="middle" fill="white"
          font-family="Bangers, Impact, sans-serif" font-size="11" letter-spacing="1">X</text>

    <!-- scarf tail (right side) -->
    <path d="M 76 90 Q 84 96 80 108 L 72 104 Z" fill="${C.accent}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>

    <!-- left arm (tucked) -->
    <path d="M 28 98 Q 22 114 27 130" stroke="${C.ink}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="27" cy="130" r="3.5" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>

    ${rightArm}
  `;
}

const arms = {
  wave: `
    <!-- right arm raised -->
    <path d="M 72 98 Q 84 80 82 60" stroke="${C.ink}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="82" cy="56" r="5.5" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>
    <!-- motion lines -->
    <path d="M 90 52 L 95 50" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M 90 58 L 97 58" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M 90 64 L 95 66" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round"/>
  `,
  point: `
    <!-- right arm extended, pointing -->
    <path d="M 72 100 Q 86 96 96 96" stroke="${C.ink}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="96" cy="96" r="4.5" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>
    <!-- finger -->
    <path d="M 100 96 L 106 96" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>
  `,
  idle: `
    <!-- right arm relaxed -->
    <path d="M 72 98 Q 78 114 73 130" stroke="${C.ink}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="73" cy="130" r="3.5" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>
  `,
};

export function mascot(pose = 'wave', { size = 60 } = {}) {
  const arm = arms[pose] || arms.wave;
  const w = size;
  const h = Math.round(size * 1.4);
  return `<svg class="mascot mascot-${pose}" viewBox="-2 -8 104 146" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="X-sensei, the Fundamental of X mascot">${body(arm)}</svg>`;
}

export function mountMascot() {
  // Small mascot beside the site brand in the header.
  const brand = document.querySelector('.site-header .brand');
  if (brand && !brand.querySelector('.mascot')) {
    brand.insertAdjacentHTML('afterbegin', `<span class="mascot-brand">${mascot('wave', { size: 38 })}</span>`);
  }

  // Big "hello" mascot inside the hub intro (root + topic hubs).
  const heroIntro = document.querySelector('.hub .intro');
  if (heroIntro && !heroIntro.querySelector('.mascot-hello')) {
    heroIntro.insertAdjacentHTML('beforeend', `
      <div class="mascot-hello">
        <div class="mascot-hello-figure">${mascot('wave', { size: 110 })}</div>
        <div class="mascot-hello-bubble">
          <strong>Hi! I'm X-sensei.</strong><br>
          I'll point at the important bits while you learn.
        </div>
      </div>
    `);
  }

  // Tiny pointing mascot poking out of the Key Takeaways box.
  document.querySelectorAll('.takeaways').forEach((el) => {
    if (el.querySelector('.mascot')) return;
    el.insertAdjacentHTML('beforeend', `<div class="mascot-takeaway">${mascot('point', { size: 70 })}</div>`);
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountMascot);
  } else {
    mountMascot();
  }
}
