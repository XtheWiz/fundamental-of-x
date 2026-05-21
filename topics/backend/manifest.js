// Backend topic manifest — single source of truth for lesson order,
// titles, and blurbs.

export const manifest = {
  slug: 'backend',
  title: 'Backend',
  tagline: 'What servers actually do with the requests they receive.',
  lessons: [
    {
      slug: 'http',
      title: 'Anatomy of HTTP',
      blurb: 'Verbs, status codes, headers, body. The alphabet every web service is built from.',
    },
    {
      slug: 'rest',
      title: 'REST & API Design',
      blurb: 'Resources vs RPC. Idempotency. Why PUT and POST mean different things. Critique a real API.',
    },
    {
      slug: 'auth',
      title: 'Sessions & Auth',
      blurb: 'Cookies, tokens, JWT, OAuth — watch a login flow with three parties move in real time.',
    },
    {
      slug: 'caching',
      title: 'Caching',
      blurb: 'Browser, CDN, reverse proxy, app. A multi-tier cache simulator with TTLs and invalidation.',
    },
    {
      slug: 'proxy',
      title: 'Reverse Proxies',
      blurb: 'What nginx really does: terminate TLS, route paths, rewrite headers, hide backends.',
    },
    {
      slug: 'load-balancing',
      title: 'Load Balancing',
      blurb: 'Four backends, three strategies. Watch a stream of requests distribute (fairly or not).',
    },
    {
      slug: 'rate-limit',
      title: 'Rate Limiting',
      blurb: 'Token bucket in slow motion. Try to overwhelm it — see what the limiter says.',
    },
    {
      slug: 'lifecycle',
      title: 'Request Lifecycle',
      blurb: 'A request goes from browser → CDN → LB → app → DB → back. Watch the whole journey.',
    },
  ],
};
