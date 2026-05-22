# Roadmap

Notes on deferred work — for me (Claude) and any future contributors to find
across sessions. Items are committed deliberately; revisit when the prereqs
in each section are met.

## Deferred: Learner-driven topic requests

**Idea (from user, scoping deferred):** open a public way for learners to
suggest which "Fundamental of X" subjects they'd like to see next. An AI
workflow picks 1–2 winners per day based on request volume and ships them
automatically.

**Prerequisites before designing this:** finish the React migration
(Phase 3 polish). All 18 topics are now React-native, but Phase 3
cleanup is pending.

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
- **Phase 3** — pending. Polish:
  - Code-split per topic with `React.lazy` so the home page doesn't
    download every widget (current bundle ~178 KB gzipped).
  - Convert remaining legacy-widget topics to native React on demand
    (when a widget needs Framer Motion or R3F treatment).
  - Re-enable the language switcher (`SWITCHER_ENABLED = true`) once
    i18n dictionaries cover the React-native UI.
  - Add R3F to Quantum (Bloch sphere) and Light (3D ray tracing) as
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
