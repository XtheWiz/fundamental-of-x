import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import { initHttpWidget } from '../widgets/backend/legacy/http.js';
import { initRestWidget } from '../widgets/backend/legacy/rest.js';
import { initAuthWidget } from '../widgets/backend/legacy/auth.js';
import { initCachingWidget } from '../widgets/backend/legacy/caching.js';
import { initProxyWidget } from '../widgets/backend/legacy/proxy.js';
import { initLoadBalancingWidget } from '../widgets/backend/legacy/load-balancing.js';
import { initRateLimitWidget } from '../widgets/backend/legacy/rate-limit.js';
import { initLifecycleWidget } from '../widgets/backend/legacy/lifecycle.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'backend',
  title: 'Backend',
  intro: <>Eight lessons on what servers actually do with the requests they receive — HTTP basics, REST design, sessions, caching layers, reverse proxies, load balancing, rate limiting, and the full request lifecycle.</>,
  lessons: [
    { slug: 'http', number: '01', title: 'Anatomy of HTTP', blurb: 'Verbs, status codes, headers, body. The alphabet every web service is built from.', Widget: W(initHttpWidget),
      intro: <>HTTP is plain text with structure: a verb, a path, headers, optional body. Everything else in backend builds on it.</>, sections: [],
      takeaways: ['GET reads, POST creates, PUT replaces, PATCH updates, DELETE removes — most violations cause real bugs.', 'Status codes group: 2xx ok, 3xx redirect, 4xx client error, 5xx server error.', 'Headers carry everything HTTP itself can\'t express: auth, caching, content type, language.', 'HTTP is stateless — sessions are layered on top via cookies or tokens.'] },
    { slug: 'rest', number: '02', title: 'REST & API Design', blurb: 'Resources vs RPC. Idempotency. Why PUT and POST mean different things. Critique a real API.', Widget: W(initRestWidget),
      intro: <>REST treats URLs as nouns (resources) and verbs as operations on them. Done well, the API becomes predictable; done badly, you get verbs in URLs and inconsistent status codes.</>, sections: [],
      takeaways: ['Resources, not actions: /users/42 not /getUser?id=42.', 'PUT is idempotent — same call twice = same result. POST is not.', 'Use status codes for failure modes. 422 ≠ 400 ≠ 409.', 'Versioning belongs in the URL (/v2/) or header — not the body.'] },
    { slug: 'auth', number: '03', title: 'Sessions & Auth', blurb: 'Cookies, tokens, JWT, OAuth — watch a login flow with three parties move in real time.', Widget: W(initAuthWidget),
      intro: <>HTTP is stateless. To remember "this user is logged in", you need cookies or tokens. Different schemes trade off where the state lives and who trusts whom.</>, sections: [],
      takeaways: ['Cookies live in the browser, sent automatically. Tokens live in storage, sent explicitly.', 'JWTs are stateless tokens — the server doesn\'t store sessions.', 'OAuth is "let another service log this user in for me" — three-party flow.', 'Never store secrets in localStorage. XSS will steal them.'] },
    { slug: 'caching', number: '04', title: 'Caching', blurb: 'Browser, CDN, reverse proxy, app. A multi-tier cache simulator with TTLs and invalidation.', Widget: W(initCachingWidget),
      intro: <>The fastest request is the one you don't make. Cache layers between the user and the origin save round-trips at every level.</>, sections: [],
      takeaways: ['Cache-Control headers are the contract. max-age, public, private, no-store all mean different things.', 'CDN caching depends on Vary and origin headers — get them wrong and users see each other\'s data.', 'Invalidation is the hardest part. Either short TTLs, or explicit purges, or content-hashed URLs.', 'Cache the thing that\'s expensive to compute, not the thing that\'s cheap to fetch.'] },
    { slug: 'proxy', number: '05', title: 'Reverse Proxies', blurb: 'What nginx really does: terminate TLS, route paths, rewrite headers, hide backends.', Widget: W(initProxyWidget),
      intro: <>A reverse proxy sits in front of your app servers and looks like one server to clients. It handles TLS, routes paths to different backends, and can rewrite headers on the fly.</>, sections: [],
      takeaways: ['Termination: TLS ends at the proxy; backend speaks plain HTTP.', 'Routing: /api → app server, /static → CDN, /admin → restricted backend.', 'Header rewrites: add X-Forwarded-For, strip cookies, inject auth.', 'nginx, HAProxy, Envoy, Caddy — different syntax, same job.'] },
    { slug: 'load-balancing', number: '06', title: 'Load Balancing', blurb: 'Four backends, three strategies. Watch a stream of requests distribute (fairly or not).', Widget: W(initLoadBalancingWidget),
      intro: <>Spread incoming requests across multiple servers. The strategy you pick decides whether load stays balanced and whether session affinity sticks.</>, sections: [],
      takeaways: ['Round-robin: simplest, ignores server load.', 'Least-connections: better when request durations vary.', 'IP hash: sticky — same client always hits the same server. Bad for fairness.', 'Health checks are critical: pull dead servers out of rotation automatically.'] },
    { slug: 'rate-limit', number: '07', title: 'Rate Limiting', blurb: 'Token bucket in slow motion. Try to overwhelm it — see what the limiter says.', Widget: W(initRateLimitWidget),
      intro: <>Cap how often a client can call your API. Most rate limiters use a token bucket — replenish tokens at a fixed rate, deny when the bucket is empty.</>, sections: [],
      takeaways: ['Token bucket: smooth refill, allows bursts up to bucket size.', 'Sliding window: fairer but harder to implement.', 'Per-IP is the default; per-user is better once you have auth.', '429 Too Many Requests is the right status code — include Retry-After.'] },
    { slug: 'lifecycle', number: '08', title: 'Request Lifecycle', blurb: 'A request goes from browser → CDN → LB → app → DB → back. Watch the whole journey.', Widget: W(initLifecycleWidget),
      intro: <>End-to-end: every layer the request crosses, every cache it might hit, every server it might land on. The fast paths and the slow paths laid out side by side.</>, sections: [],
      takeaways: ['CDN cache hit = nothing else runs. Fastest possible response.', 'CDN miss → origin → LB → app server → maybe DB → back through every layer.', 'p50 latency is the cache-hit path. p99 is the full round-trip.', 'Tracing tools (Jaeger, Honeycomb) show exactly where time goes per request.'] },
  ],
};
