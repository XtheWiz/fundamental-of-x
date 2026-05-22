# Roadmap

Notes on deferred work — for me (Claude) and any future contributors to find
across sessions. Items are committed deliberately; revisit when the prereqs
in each section are met.

## Feedback + topic-request system

### v0 — shipped

Custom in-page forms via Tally (tally.so), wrapped in our manga-styled
modal so the UX feels native to the site. Tally hosts the form,
collects submissions, handles spam (their honeypot + reCAPTCHA).

- `src/data/contact.js` — single source of truth for form URLs. If
  blanked out, CTAs fall back to GitHub Issues.
- `src/components/TallyModal.jsx` — iframe embed of a Tally form
  inside our `<Modal>`. Listens for `Tally.FormHeight` postMessages
  for dynamic resize. Accepts `prefill` props for field auto-fill.
- Per-lesson feedback link prefills `Topic`, `Lesson`, `Page URL`
  so the reporter only has to type what's wrong.
- GitHub Issue templates kept as the fallback path and as a public
  browse view of historical requests.

Validation step: triage incoming Tally submissions for a couple of
weeks. If the queue stays empty, the submission friction wasn't the
problem (revisit topic selection). If it fills up, move to v1.

### v1 — deferred (build when v0 has signal)

Daily GitHub Action that:
1. Fetches open `topic-request` issues, ranks by `votes × log(age+1) ÷ dup_count`.
2. Calls Claude API with the site's style guide + 2-3 golden examples
   (Compilers, Genetics manifests) + the file shape it should emit
   (`src/data/<slug>.jsx`, widgets in `src/widgets/<slug>/`).
3. Runs `npm run build` and a playwright smoke test on the draft.
4. Opens a draft PR — **never auto-merges.** Human review is the gate.
5. Comments on the source issue with the PR link.

Same pipeline for `feedback` label, just with a different prompt:
attempt an auto-fix, open PR, human reviews.

Guardrails: budget cap in the workflow (max N drafts per month),
cooldown (don't propose the same topic twice in 7 days), kill switch
(disable the Action).

### v2 — deferred further

- Custom submission form (no GitHub login) via a serverless function.
- Weekly digest of queue + shipped items via Slack/email.
- Auto-close stale requests with no votes in 90 days.

### Open questions to revisit when v1 lands

**Open questions for that discussion:**
- Submission surface: GitHub Issues (free, low friction, public), a
  dedicated form on the home page (custom backend or Formspree-style
  service), or a Discussions board?
- Dedup + ranking: how do "Database" and "databases" get merged? How
  much weight does a single request carry vs N requests?
- Trust model: anonymous requests → spam risk. Require GitHub auth or
  rate-limit by IP / fingerprint?
- AI authoring loop: scheduled Claude job that reads the queue, picks
  the top 1–2 with the most upvotes/requests, drafts a manifest +
  widgets + lesson content, opens a PR for human review. CI runs
  build + screenshot smoke tests on the PR. Merge gates the deploy.
- Quality bar: how do we keep the manga aesthetic + widget interactivity
  consistent? Style guide / templates / golden examples for the AI to
  follow.
- Cost/cadence: 1–2 per day means real model spend. Cap monthly budget
  or request floor before queue acts.

**Why this is good:** the site's whole pitch is "interactive deep-dives
on fundamentals." Letting the audience nominate next subjects compounds
that — the library grows in the directions learners actually want, and
the AI loop keeps cost-per-topic low enough to justify the long tail.

### Decisions made

- **Always human merges.** AI never ships unreviewed; every PR needs eyes.
- **GitHub Issues as the queue** (v0). Lower friction options (custom form,
  serverless backend) are v2 if friction proves to be the bottleneck.
- **Single repo, single workflow.** Topic requests + feedback share the
  same pipeline, differentiated by issue label.

## Migration progress

- **Phase 0** — done. Vite + React + react-router-dom + Framer Motion
  scaffold. Home page in React. Vanilla pages survived in `/topics/*`.
- **Phase 1** — done. Compilers ported (8 lessons, 8 widgets, Framer
  Motion accents on each).
## New topics shipped post-migration

- **Algorithms** (Software/CS) — 8 native React widgets with Framer Motion
  potential: Big-O bars, sorting race, binary vs linear search,
  BFS/DFS graph traversal, Dijkstra vs A* on a grid, edit-distance DP
  table fill, coin-change greedy-vs-DP comparison, Bloom filter.
- **Threads** (Software/CS) — 8 native React widgets: concurrency vs
  parallelism, OS thread cost, the classic green-thread blocking trap,
  Java virtual threads (Loom), Go work-stealing scheduler, async/await
  in JS vs Python vs Rust, sync primitives explorer, deadlock/livelock/
  starvation scenarios.

## Migration progress

- **Phase 2** — **DONE.** All 18 original topics now React-native, plus 2 brand-new topics (Algorithms, Threads) = 20 total.
  - [x] Compilers (Phase 1; native React widgets w/ Framer Motion)
  - [x] Genetics (native React widgets w/ Framer Motion)
  - [x] Machine Learning (native React widgets w/ Framer Motion)
  - [x] Database (legacy-widget wrapper)
  - [x] Internet, Backend, Messaging, Distributed Systems, Cryptography
        (legacy-widget wrapper, generic TopicIndex/TopicLessonRoute scaffold)
  - [x] Design Patterns, Operating Systems, Computer Architecture
        (legacy-widget wrapper)
  - [x] Transformers, Quantum Computing
        (legacy-widget wrapper — both are R3F candidates for future polish)
  - [x] Light, Solar Cell, Energy Systems, Electric Vehicles
        (legacy-widget wrapper)
- **Phase 3** — in progress. Polish:
  - [x] **Code-split per topic with React.lazy.** Home-page bundle went
    from 354 KB gzipped to ~83 KB gzipped (-77%). Each topic loads its
    own ~10-20 KB chunk on first visit. Bespoke ports (Compilers,
    Genetics, ML, Database) each have a dedicated lazy route component;
    generic ports route through a single `<LazyTopicIndex />` /
    `<LazyTopicLesson />` that uses `import.meta.glob` to map slugs to
    chunks. Suspense fallback is a small spinner.
  - [x] **Analytics wiring.** Cloudflare Web Analytics beacon, JS-injected
    only when `VITE_CF_ANALYTICS_TOKEN` is set in `.env.production`. No
    token = no script = no analytics. Privacy-friendly, no cookies, no
    consent banner needed in most jurisdictions. SPA route changes
    tracked automatically by the beacon's own pushState observer.
  - [ ] Convert remaining legacy-widget topics to native React on demand
    (when a widget needs Framer Motion or R3F treatment).
  - [ ] Re-enable the language switcher (`SWITCHER_ENABLED = true`) once
    i18n dictionaries cover the React-native UI.
  - [ ] Add R3F to Quantum (Bloch sphere) and Light (3D ray tracing) as
    showcase 3D widgets.

## Architectural notes

**Generic vs bespoke routes.** The four topics I touched first (Compilers,
Genetics, ML, Database) have dedicated `<TopicName>Index.jsx` and
`<TopicName>Lesson.jsx` route components in `src/routes/<topic>/`. Every
other topic uses the generic `TopicIndex` and `TopicLessonRoute` in
`src/components/`, driven entirely by the per-topic data file. New topics
should prefer the generic path unless they need bespoke React widgets.

**LegacyWidget pattern.** `src/widgets/database/LegacyWidget.jsx` is a
small wrapper that mounts a vanilla `init<Name>Widget(rootEl)` function
into a React-managed div. Used by every topic ported via "lift the
existing JS into `src/widgets/<topic>/legacy/`". Trade-off: not idiomatic
React, but 100% behavioural fidelity with no rewrite effort. Convert to
native React per widget when there's a reason (animation polish, state
that should be lifted, etc.).

**Publish flow.** `npm run publish` resets `index.html` from the pristine
`index.html.template`, wipes the previous build's `/assets/`, runs Vite
into `dist/`, and copies the output back to repo root so GitHub Pages
serves it from main without any settings change.
