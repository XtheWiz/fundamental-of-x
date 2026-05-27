import WhyCicdWidget from '../widgets/ci-cd/WhyCicdWidget.jsx';
import BuildPipelineWidget from '../widgets/ci-cd/BuildPipelineWidget.jsx';
import TriggersVersioningWidget from '../widgets/ci-cd/TriggersVersioningWidget.jsx';
import TestPyramidWidget from '../widgets/ci-cd/TestPyramidWidget.jsx';
import ArtifactsRegistriesWidget from '../widgets/ci-cd/ArtifactsRegistriesWidget.jsx';
import DeploymentStrategiesWidget from '../widgets/ci-cd/DeploymentStrategiesWidget.jsx';
import FeatureFlagsWidget from '../widgets/ci-cd/FeatureFlagsWidget.jsx';
import RollbackWidget from '../widgets/ci-cd/RollbackWidget.jsx';
import PipelineSecurityWidget from '../widgets/ci-cd/PipelineSecurityWidget.jsx';
import ObservabilityWidget from '../widgets/ci-cd/ObservabilityWidget.jsx';

export const manifest = {
  slug: 'ci-cd',
  title: 'CI / CD',
  intro: <>Ten lessons on shipping code reliably. From the first "why automate?" through pipeline composition, test pyramids, deployment strategies, feature flags, rollback, supply-chain signing, and DORA metrics. Hands-on for every concept.</>,
  lessons: [
    { slug: 'why-cicd', number: '01', title: 'Why CI/CD?',
      blurb: 'Same team, same commits — once with manual weekly deploys, once with CI/CD. See the gap.',
      Widget: WhyCicdWidget,
      intro: <>The simplest argument: small batches mean small failures. CI runs the tests on every commit, attributing each regression to the person who caused it; CD ships the green commits without ceremony. The result is more deploys per day with lower outage rates — not the other way around.</>,
      sections: [],
      takeaways: [
        "Small batches > big batches. Always. Every metric that matters improves.",
        "CI tells you who broke it, in seconds. Manual integration tells you next week, vaguely.",
        "CD removes deploy as a human activity. Humans push merge buttons; the pipeline ships.",
        "The bar isn\'t \"deploy 10× a day to look elite\" — it\'s deploy when ready, with confidence, in minutes not hours.",
      ] },

    { slug: 'build-pipelines', number: '02', title: 'Build Pipelines',
      blurb: 'Compose stages, run a buggy commit, watch fail-fast save you 4 minutes of CPU.',
      Widget: BuildPipelineWidget,
      intro: <>A pipeline is a chain of validators, ordered cheap-to-expensive. Lint (seconds), type-check (seconds), unit tests (~minute), build (~minute), integration (~minutes), E2E (~tens of minutes). Put cheap first so you don\'t spend 240 seconds before catching a one-character typo.</>,
      sections: [],
      takeaways: [
        "Order matters. Lint and type-check belong at the start.",
        "Fail-fast: stop on first failure. No point running E2E if the build broke.",
        "Parallelise independent stages where possible (e.g. lint + type-check + unit can all run together).",
        "Cache aggressively — node_modules, build outputs, container layers. CI minutes are cheap; recomputing the same thing is wasteful.",
      ] },

    { slug: 'triggers-versioning', number: '03', title: 'Triggers & Versioning',
      blurb: 'Pick a git event + a change kind. The widget shows which workflows ran and what version got minted.',
      Widget: TriggersVersioningWidget,
      intro: <>Triggers decide *when* CI fires (push, PR, tag, cron, manual). Versioning decides *what* gets stamped on the resulting artifact (semver, calver, sha). Keep them straight — same workflow can fire on multiple triggers, each producing a different channel of artifact.</>,
      sections: [],
      takeaways: [
        "Tag-based release flows are predictable: only `v1.2.3` tags produce a release artifact.",
        "Conventional commits + automated semver tooling (changesets, semantic-release) takes humans out of version-bump decisions.",
        "Preview deploys per PR are gold for review — each PR gets its own URL.",
        "Manual dispatch with inputs is the escape hatch for one-off releases; don\'t let it be the norm.",
      ] },

    { slug: 'test-pyramid', number: '04', title: 'The Test Pyramid',
      blurb: 'Distribute tests across unit / integration / E2E. Build an ice-cream cone, see the antipattern.',
      Widget: TestPyramidWidget,
      intro: <>Unit tests are fast and cheap and catch logic bugs. E2E tests are slow and flaky and catch user-flow bugs. The pyramid is the right shape because each level\'s strengths cover the others\' weaknesses without burning all your CI minutes on flakes.</>,
      sections: [],
      takeaways: [
        "Lots of unit tests (cheap, fast, focused). Some integration tests (real DB, real dependencies). A few E2E (the critical paths).",
        "Inverted pyramid (mostly E2E) is the classic antipattern — slow, flaky, hard to diagnose.",
        "E2E flake compounds. With 30 e2e tests at 99% reliability each, pipeline reliability is 74%. Watch that math.",
        "Don\'t test what the framework guarantees. Test your business logic.",
      ] },

    { slug: 'artifacts-registries', number: '05', title: 'Artifacts & Registries',
      blurb: 'Push to `latest`, push again, deploy yesterday\'s deploy spec — what version actually lands? Pin by sha and find out.',
      Widget: ArtifactsRegistriesWidget,
      intro: <>An artifact is whatever you ship — a container image, a binary, a tarball. Registries store them with names + tags. Mutable tags (`latest`) point at whatever was pushed last; immutable tags (`@sha256:...`) point at exact bytes forever. Always pin deploys to digests.</>,
      sections: [],
      takeaways: [
        "`latest` is for humans during development. Production deploys should reference a digest.",
        "Same digest moves through dev → staging → prod (promotion). Don\'t rebuild per environment.",
        "Retention policies matter. Untagged builds add up to terabytes fast.",
        "Sign your artifacts (Sigstore, Notary) so deploy can verify provenance.",
      ] },

    { slug: 'deployment-strategies', number: '06', title: 'Deployment Strategies',
      blurb: 'Same buggy release, three rollout shapes. Blast radius and rollback speed differ wildly.',
      Widget: DeploymentStrategiesWidget,
      intro: <>The deploy itself can be the safety mechanism. Rolling rolls one pod at a time. Blue-Green keeps the old version live alongside the new for instant switch-back. Canary sends a small slice of traffic first; if metrics stay green, ramp up. Each has a different cost and a different recovery profile.</>,
      sections: [],
      takeaways: [
        "Rolling: cheap, but you\'re mid-deploy when problems show up. Slowest rollback.",
        "Blue-Green: double the capacity briefly, but rollback is a switch flip. Best when downtime is unacceptable.",
        "Canary: catches bad releases against 5% of users instead of 100%. The right default for high-stakes services.",
        "Pair canary with automatic abort on error-rate spike. Otherwise it\'s manual canary, which doesn\'t scale.",
      ] },

    { slug: 'feature-flags', number: '07', title: 'Feature Flags',
      blurb: 'Decouple deploy from release. Ship the code dark; flip the flag when ready.',
      Widget: FeatureFlagsWidget,
      intro: <>The hardest part of shipping a big feature isn\'t writing it — it\'s landing it without breaking the world. Flags let you ship the code to production, gate it off, then turn it on for 1% of users, 10%, 100%, all without redeploys. Kill switch built in.</>,
      sections: [],
      takeaways: [
        "Decouple deploy from release. Code is shipped; feature is released independently.",
        "Always have a kill switch. Default to off; turn off > turn on.",
        "Target by segment (country, plan tier, internal users) for staged rollouts.",
        "Don\'t accumulate dead flags. They become technical debt — schedule the cleanup.",
      ] },

    { slug: 'rollback-dr', number: '08', title: 'Rollback & Disaster Recovery',
      blurb: 'Rolling back code is easy. Rolling back a destructive migration is not. See the verdict per release.',
      Widget: RollbackWidget,
      intro: <>The myth: "we can always roll back". The truth: only if nothing irreversible happened in between. Destructive schema changes, data backfills, and side-effecting integrations all create one-way doors. Knowing which doors you walked through is half the discipline.</>,
      sections: [],
      takeaways: [
        "Code-only rollback is trivial. Configuration rollback is trivial.",
        "Destructive migrations require a backup restore — rehearse it before you need it.",
        "Backfills are irreversible by definition. Plan them like one-way doors.",
        "RTO (recovery time) and RPO (data loss tolerance) drive what infrastructure you need. Pick numbers; design backwards.",
      ] },

    { slug: 'pipeline-security', number: '09', title: 'Pipeline Security',
      blurb: 'Source → CI → Build → Registry → Deploy. Where can an attacker inject? Turn on each protection, watch attacks die.',
      Widget: PipelineSecurityWidget,
      intro: <>The pipeline is the attacker\'s ideal target — it has commit access to your source, build access to your artifacts, and deploy access to your infrastructure. Modern protections (branch protection, signed commits, hermetic builds, signed releases, SBOM, deploy verification) raise SLSA levels and cut attack surface materially.</>,
      sections: [],
      takeaways: [
        "Branch protection + required reviews stops most malicious commits at the source.",
        "Hermetic builds (no network access during build) prevent compromise from build-time package installs.",
        "Sign every artifact (Sigstore, in-toto). Verify on deploy — refuse unsigned bytes.",
        "Generate SBOMs so when a CVE drops, you can grep your inventory in seconds.",
      ] },

    { slug: 'observability', number: '10', title: 'Observability for Delivery (DORA)',
      blurb: 'Deploy frequency, lead time, change failure rate, MTTR. Move sliders; see your team\'s tier.',
      Widget: ObservabilityWidget,
      intro: <>The four DORA metrics — deploy frequency, lead time, change failure rate, mean time to recover — predict almost everything else about engineering team performance. Elite teams deploy multiple times per day with sub-1% failure rates. The behaviours that get you there are knowable.</>,
      sections: [],
      takeaways: [
        "Deploy frequency: how often code reaches production. Elite: on demand.",
        "Lead time: commit → production. Elite: hours.",
        "Change failure rate: % of deploys causing an incident. Elite: 0-15%.",
        "MTTR: time to restore on failure. Elite: under an hour. Driven by good runbooks + good monitoring, not heroics.",
      ] },
  ],
};
