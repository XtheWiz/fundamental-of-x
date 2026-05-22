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
(Phases 2 + 3). All topics need to be React-native first so the
generation pipeline produces files in a single, well-understood shape.

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

## Migration progress (live tracker)

- **Phase 0** — done. Vite + React + react-router-dom + Framer Motion
  scaffold. Home page in React. Vanilla pages survive in `/topics/*`.
- **Phase 1** — done. Compilers ported (8 lessons, 8 widgets, Framer
  Motion accents on each).
- **Phase 2** — in progress. One topic per session.
  - [x] Genetics
  - [x] Machine Learning
  - [ ] backend
  - [ ] computer-architecture
  - [ ] cryptography
  - [ ] database
  - [ ] design-patterns
  - [ ] distributed-systems
  - [ ] electric-vehicles
  - [ ] energy-systems
  - [ ] internet
  - [ ] light
  - [ ] messaging
  - [ ] operating-systems
  - [ ] quantum-computing
  - [ ] solar-cell
  - [ ] transformers
- **Phase 3** — pending. Delete remaining vanilla `topics/<name>/`
  folders; remove unused shared `/js/*.js` (`mascot.js`, `shell.js`,
  `support.js`, `i18n.js`) once nothing imports them; re-enable the
  language switcher (`SWITCHER_ENABLED = true`) when i18n dictionaries
  cover the React-native UI.
