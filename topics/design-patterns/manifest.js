// Design Patterns topic manifest.

export const manifest = {
  slug: 'design-patterns',
  title: 'Design Patterns',
  tagline: 'Vocabulary for refactoring intent. The patterns that still earn their keep.',
  lessons: [
    {
      slug: 'what-is-a-pattern',
      title: 'What is a Pattern?',
      blurb: 'GoF history, modern view, and why some "patterns" became language features. A pattern is a name for a solution to a recurring problem.',
    },
    {
      slug: 'strategy',
      title: 'Strategy',
      blurb: 'Interchangeable algorithms behind a common interface. Sort comparators, payment providers, compression codecs.',
    },
    {
      slug: 'observer',
      title: 'Observer & Pub-Sub',
      blurb: 'The pattern behind every event system: subjects notify subscribers without knowing who they are.',
    },
    {
      slug: 'factory-builder',
      title: 'Factory & Builder',
      blurb: 'When `new` isn\'t enough. Factories choose what to create; builders compose it step by step.',
    },
    {
      slug: 'decorator-adapter',
      title: 'Decorator & Adapter',
      blurb: 'Wrapping existing things. Decorator adds behavior; Adapter changes shape. Both compose cleanly.',
    },
    {
      slug: 'singleton-di',
      title: 'Singleton & Dependency Injection',
      blurb: 'The controversy and the modern alternative. Why a global instance is testability poison — and what to do instead.',
    },
    {
      slug: 'repository-uow',
      title: 'Repository & Unit of Work',
      blurb: 'Data-access patterns. What most "service layers" actually are.',
    },
    {
      slug: 'modern-architecture',
      title: 'Modern Architecture Patterns',
      blurb: 'MVC / MVVM, CQRS, Event Sourcing, Circuit Breaker, Saga — patterns the original GoF book never saw coming.',
    },
  ],
};
