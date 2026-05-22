// Shared lazy-load fallback. Kept tiny so it doesn't ship a big stub
// before the real bundle arrives.
export default function Loading() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '0.5rem',
        color: 'var(--ink-soft)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.9rem',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: '3px solid var(--paper-deep)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'fox-spin 0.8s linear infinite',
        }}
      />
      <span>loading…</span>
      <style>{`@keyframes fox-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
