// Single source of truth for the BMC link + label. If the handle ever
// changes, edit it here.
const BMC_URL = 'https://buymeacoffee.com/xthewiz';
const LABEL = 'Buy me a coffee';

// Tiny inline coffee-cup SVG. Filled with currentColor so it adopts the
// button's text colour and works on both light/dark backgrounds without
// extra CSS work.
function CoffeeIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">
      <path d="M4 19h12v2H4v-2zm14-13h2a2 2 0 0 1 2 2v3a3 3 0 0 1-3 3h-1v-1h1a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1h-2V6zM3 6h15v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V6zm2 2v6a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V8H5z" />
    </svg>
  );
}

// `variant="compact"` — small chip for the header nav.
// `variant="card"` — full card with copy for the lesson footer.
export default function BMCButton({ variant = 'compact' }) {
  if (variant === 'card') {
    return (
      <aside className="bmc-card">
        <div className="bmc-card-body">
          <div className="bmc-card-text">
            <strong>Enjoying the lesson?</strong>
            <span>Fundamental of X is a one-person project. A coffee keeps the lessons coming.</span>
          </div>
          <a className="bmc-card-cta" href={BMC_URL} target="_blank" rel="noopener noreferrer">
            <CoffeeIcon size={16} />
            <span>{LABEL}</span>
          </a>
        </div>
      </aside>
    );
  }
  return (
    <a className="bmc-chip" href={BMC_URL} target="_blank" rel="noopener noreferrer" title={LABEL}>
      <CoffeeIcon size={14} />
      <span>Coffee</span>
    </a>
  );
}
