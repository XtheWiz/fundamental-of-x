// React port of mascot.js. The SVG body is ported verbatim — same paths,
// same colors via CSS variables — so the manga character is identical.

const INK = 'var(--ink, #1a1a1a)';
const PAPER = 'var(--paper, #f5f1e8)';
const ACCENT = 'var(--accent, #d62828)';

function body(rightArm) {
  return `
    <path d="M 18 42 Q 14 14 38 6 Q 50 -2 64 8 Q 86 12 82 46 Q 80 58 70 52 Q 80 28 56 22 Q 34 22 28 38 Q 22 52 22 44 Z" fill="${INK}"/>
    <circle cx="50" cy="48" r="28" fill="${PAPER}" stroke="${INK}" stroke-width="2.5"/>
    <path d="M 22 42 Q 30 26 42 30 Q 50 24 58 30 Q 70 26 78 42 Q 64 34 50 36 Q 36 34 22 42 Z" fill="${INK}"/>
    <path d="M 50 6 Q 56 0 54 -4" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M 76 38 Q 86 36 80 50 Q 78 50 76 44 Z" fill="${INK}"/>
    <circle cx="40" cy="52" r="2.8" fill="${INK}"/>
    <circle cx="60" cy="52" r="2.8" fill="${INK}"/>
    <circle cx="41" cy="51" r="0.9" fill="white"/>
    <circle cx="61" cy="51" r="0.9" fill="white"/>
    <ellipse cx="34" cy="60" rx="3.6" ry="1.7" fill="${ACCENT}" opacity="0.4"/>
    <ellipse cx="66" cy="60" rx="3.6" ry="1.7" fill="${ACCENT}" opacity="0.4"/>
    <path d="M 44 64 Q 50 68.5 56 64" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <rect x="46" y="75" width="8" height="6" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>
    <path d="M 28 96 Q 50 82 72 96 L 76 134 L 24 134 Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.5"/>
    <rect x="22" y="82" width="56" height="12" fill="${ACCENT}" stroke="${INK}" stroke-width="2"/>
    <text x="50" y="91.5" text-anchor="middle" fill="white" font-family="Bangers, Impact, sans-serif" font-size="11" letter-spacing="1">X</text>
    <path d="M 76 90 Q 84 96 80 108 L 72 104 Z" fill="${ACCENT}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    ${rightArm}
  `;
}

const tuckedLeftArm = `
  <path d="M 28 98 Q 22 114 27 130" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="27" cy="130" r="3.5" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>
`;

const arms = {
  wave: tuckedLeftArm + `
    <path d="M 72 98 Q 84 80 82 60" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="82" cy="56" r="5.5" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>
    <path d="M 90 52 L 95 50" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M 90 58 L 97 58" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M 90 64 L 95 66" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
  `,
  point: tuckedLeftArm + `
    <path d="M 72 100 Q 86 96 96 96" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="96" cy="96" r="4.5" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>
    <path d="M 100 96 L 106 96" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
  `,
  idle: tuckedLeftArm + `
    <path d="M 72 98 Q 78 114 73 130" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="73" cy="130" r="3.5" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>
  `,
};

export default function Mascot({ pose = 'wave', size = 60 }) {
  const h = Math.round(size * 1.4);
  const arm = arms[pose] || arms.wave;
  return (
    <svg
      className={`mascot mascot-${pose}`}
      viewBox="-2 -8 104 146"
      width={size}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="X-sensei, the Fundamental of X mascot"
      dangerouslySetInnerHTML={{ __html: body(arm) }}
    />
  );
}

export function MascotHello() {
  return (
    <div className="mascot-hello">
      <div className="mascot-hello-figure"><Mascot pose="wave" size={110} /></div>
      <div className="mascot-hello-bubble">
        <strong>Hi! I'm X-sensei.</strong><br />
        I'll point at the important bits while you learn.
      </div>
    </div>
  );
}

export function MascotTakeaway() {
  return <div className="mascot-takeaway"><Mascot pose="point" size={70} /></div>;
}
