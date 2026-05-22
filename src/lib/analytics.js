// Cloudflare Web Analytics beacon, conditionally injected.
//
// Why JS-inject instead of pasting the snippet into index.html: this
// keeps the beacon out of the bundle when no token is configured (e.g.,
// on first build before you've signed up). When the token is set,
// the beacon loads asynchronously after React mounts — Cloudflare's
// beacon registers a `pushState` observer of its own, so SPA route
// changes get tracked too.
//
// To enable:
//   1. Sign up free at one.dash.cloudflare.com (existing CF account works).
//   2. Web Analytics → Add a site → enter fundamentalofx.com → get token.
//   3. Add to .env.production (committed to repo — token is not a secret):
//        VITE_CF_ANALYTICS_TOKEN=abcdef0123456789abcdef0123456789
//   4. `npm run publish`. Dashboard starts collecting on next visit.

export function initAnalytics() {
  const token = import.meta.env.VITE_CF_ANALYTICS_TOKEN;
  if (!token || typeof document === 'undefined') return;
  if (document.querySelector('script[data-cf-beacon]')) return;  // hot reload guard
  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token }));
  document.head.appendChild(s);
}
