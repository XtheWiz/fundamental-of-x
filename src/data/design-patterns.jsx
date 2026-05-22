import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import { initWhatIsPatternWidget } from '../widgets/design-patterns/legacy/what-is-a-pattern.js';
import { initStrategyWidget } from '../widgets/design-patterns/legacy/strategy.js';
import { initObserverWidget } from '../widgets/design-patterns/legacy/observer.js';
import { initFactoryBuilderWidget } from '../widgets/design-patterns/legacy/factory-builder.js';
import { initDecoratorAdapterWidget } from '../widgets/design-patterns/legacy/decorator-adapter.js';
import { initSingletonDIWidget } from '../widgets/design-patterns/legacy/singleton-di.js';
import { initRepositoryUoWWidget } from '../widgets/design-patterns/legacy/repository-uow.js';
import { initModernArchWidget } from '../widgets/design-patterns/legacy/modern-architecture.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'design-patterns',
  title: 'Design Patterns',
  intro: <>Eight lessons covering the patterns worth knowing — GoF classics where they still earn their keep, plus the modern architectural patterns the original book never saw coming.</>,
  lessons: [
    { slug: 'what-is-a-pattern', number: '01', title: 'What is a Pattern?', blurb: 'GoF history, modern view, and why some "patterns" became language features.', Widget: W(initWhatIsPatternWidget),
      intro: <>A pattern is a name for a solution to a recurring problem. Half of the original GoF patterns are language features in modern languages — the rest still ship code.</>, sections: [],
      takeaways: ['Patterns are vocabulary, not laws. Use them when they fit, not because the book said so.', 'Many GoF patterns (Iterator, Command) are language built-ins now.', 'The patterns that survived (Strategy, Observer, Factory) describe runtime behavior, not syntax.', 'Modern architectures stack patterns: CQRS + Event Sourcing + Saga is a coherent design.'] },
    { slug: 'strategy', number: '02', title: 'Strategy', blurb: 'Interchangeable algorithms behind a common interface.', Widget: W(initStrategyWidget),
      intro: <>Multiple ways to do the same job — sorting, paying, compressing — behind one interface. Pick the algorithm at runtime, swap freely.</>, sections: [],
      takeaways: ['Decouples the algorithm from the code that uses it.', 'Test each strategy in isolation.', 'Often replaces a long if/else chain selecting behavior.', 'In functional languages: just pass a function.'] },
    { slug: 'observer', number: '03', title: 'Observer & Pub-Sub', blurb: 'The pattern behind every event system: subjects notify subscribers.', Widget: W(initObserverWidget),
      intro: <>The subject doesn\'t know who\'s listening. Subscribers register, unregister, and react to events independently.</>, sections: [],
      takeaways: ['Decouples producer from consumer.', 'addEventListener in browsers, Subjects in RxJS, signals in Solid/Preact.', 'Risk: memory leaks if you forget to unsubscribe.', 'Pub-Sub adds a broker between publisher and subscriber.'] },
    { slug: 'factory-builder', number: '04', title: 'Factory & Builder', blurb: 'When `new` isn\'t enough.', Widget: W(initFactoryBuilderWidget),
      intro: <>Factories decide what concrete type to construct; Builders compose objects step-by-step when they have many fields.</>, sections: [],
      takeaways: ['Factory: input → object of some interface. Hide the concrete type.', 'Builder: chain calls to assemble a complex object. Often immutable.', 'Both let you swap the construction logic without changing callers.', 'In JS: a function returning an object is already a factory.'] },
    { slug: 'decorator-adapter', number: '05', title: 'Decorator & Adapter', blurb: 'Wrapping existing things.', Widget: W(initDecoratorAdapterWidget),
      intro: <>Decorator adds behavior to an existing object without changing it. Adapter changes the shape of an interface so two parts can talk.</>, sections: [],
      takeaways: ['Decorator: same interface, extra behavior. Logging, caching, retry wrappers.', 'Adapter: incompatible interface → expected interface. Translation layer.', 'Both compose cleanly — wrap an Adapter in a Decorator in a Decorator.', 'Higher-order functions in functional languages do both.'] },
    { slug: 'singleton-di', number: '06', title: 'Singleton & Dependency Injection', blurb: 'The controversy and the modern alternative.', Widget: W(initSingletonDIWidget),
      intro: <>Singleton: one global instance forever. Convenient, until you need to test it. DI: pass dependencies in instead of reaching for them. Same goal, far better testability.</>, sections: [],
      takeaways: ['Singleton makes testing miserable — you can\'t swap the instance.', 'DI containers (Spring, Angular) automate dependency wiring.', 'Plain "pass it as a parameter" is often enough.', 'The "Singleton" is usually misused — most use cases want a single configured instance, not a global mutable state.'] },
    { slug: 'repository-uow', number: '07', title: 'Repository & Unit of Work', blurb: 'Data-access patterns.', Widget: W(initRepositoryUoWWidget),
      intro: <>Repository abstracts data access — caller doesn\'t know if it\'s SQL, NoSQL, or in-memory. Unit of Work batches changes for atomic commit.</>, sections: [],
      takeaways: ['Repository: interface for "get/save entity by ID" — implementations vary.', 'Unit of Work: collect mutations, commit them together.', 'Together they let "business logic" be tested without a real database.', 'Most ORMs (Entity Framework, SQLAlchemy, ActiveRecord) bake this in.'] },
    { slug: 'modern-architecture', number: '08', title: 'Modern Architecture Patterns', blurb: 'MVC / MVVM, CQRS, Event Sourcing, Circuit Breaker, Saga, Outbox.', Widget: W(initModernArchWidget),
      intro: <>The GoF book ended in 1994. Networked systems brought a new generation: separation of reads from writes, event logs as the source of truth, distributed transactions via compensation, reliable publishing across services.</>, sections: [],
      takeaways: ['CQRS: read model ≠ write model. Scale them independently.', 'Event Sourcing: append-only log of facts; current state is a fold of the log.', 'Circuit Breaker: stop calling a failing dependency before it cascades.', 'Saga: long-running distributed transaction with compensating actions.', 'Outbox: write the event to the same DB transaction as the business state — covered in detail in the Messaging topic.'] },
  ],
};
