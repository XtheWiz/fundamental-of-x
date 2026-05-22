import { Routes, Route } from 'react-router-dom';
import Home from './routes/Home.jsx';
import NotFound from './routes/NotFound.jsx';

import CompilersIndex from './routes/compilers/CompilersIndex.jsx';
import CompilersLesson from './routes/compilers/CompilersLesson.jsx';
import GeneticsIndex from './routes/genetics/GeneticsIndex.jsx';
import GeneticsLesson from './routes/genetics/GeneticsLesson.jsx';
import MachineLearningIndex from './routes/ml/MachineLearningIndex.jsx';
import MachineLearningLesson from './routes/ml/MachineLearningLesson.jsx';
import DatabaseIndex from './routes/database/DatabaseIndex.jsx';
import DatabaseLesson from './routes/database/DatabaseLesson.jsx';

import TopicIndex from './components/TopicIndex.jsx';
import TopicLessonRoute from './components/TopicLessonRoute.jsx';

import { manifest as backend } from './data/backend.jsx';
import { manifest as internet } from './data/internet.jsx';
import { manifest as messaging } from './data/messaging.jsx';
import { manifest as distributedSystems } from './data/distributed-systems.jsx';
import { manifest as cryptography } from './data/cryptography.jsx';
import { manifest as designPatterns } from './data/design-patterns.jsx';
import { manifest as operatingSystems } from './data/operating-systems.jsx';
import { manifest as computerArchitecture } from './data/computer-architecture.jsx';
import { manifest as transformers } from './data/transformers.jsx';
import { manifest as quantumComputing } from './data/quantum-computing.jsx';
import { manifest as light } from './data/light.jsx';
import { manifest as solarCell } from './data/solar-cell.jsx';
import { manifest as energySystems } from './data/energy-systems.jsx';
import { manifest as electricVehicles } from './data/electric-vehicles.jsx';

// Topics that share the generic TopicIndex / TopicLessonRoute scaffolding.
// (The four already-React-native topics use bespoke route components.)
const GENERIC_TOPICS = [
  backend, internet, messaging, distributedSystems, cryptography,
  designPatterns, operatingSystems, computerArchitecture,
  transformers, quantumComputing,
  light, solarCell, energySystems, electricVehicles,
];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* React-native ports — dedicated route components per topic */}
      <Route path="/topics/compilers" element={<CompilersIndex />} />
      <Route path="/topics/compilers/" element={<CompilersIndex />} />
      <Route path="/topics/compilers/index.html" element={<CompilersIndex />} />
      <Route path="/topics/compilers/lessons/*" element={<CompilersLesson />} />
      <Route path="/topics/genetics" element={<GeneticsIndex />} />
      <Route path="/topics/genetics/" element={<GeneticsIndex />} />
      <Route path="/topics/genetics/index.html" element={<GeneticsIndex />} />
      <Route path="/topics/genetics/lessons/*" element={<GeneticsLesson />} />
      <Route path="/topics/machine-learning" element={<MachineLearningIndex />} />
      <Route path="/topics/machine-learning/" element={<MachineLearningIndex />} />
      <Route path="/topics/machine-learning/index.html" element={<MachineLearningIndex />} />
      <Route path="/topics/machine-learning/lessons/*" element={<MachineLearningLesson />} />
      <Route path="/topics/database" element={<DatabaseIndex />} />
      <Route path="/topics/database/" element={<DatabaseIndex />} />
      <Route path="/topics/database/index.html" element={<DatabaseIndex />} />
      <Route path="/topics/database/lessons/*" element={<DatabaseLesson />} />

      {/* Legacy-widget ports — generic route scaffolding, manifest-driven */}
      {GENERIC_TOPICS.flatMap((m) => [
        <Route key={`i-${m.slug}`} path={`/topics/${m.slug}`} element={<TopicIndex manifest={m} />} />,
        <Route key={`i-${m.slug}/`} path={`/topics/${m.slug}/`} element={<TopicIndex manifest={m} />} />,
        <Route key={`ih-${m.slug}`} path={`/topics/${m.slug}/index.html`} element={<TopicIndex manifest={m} />} />,
        <Route key={`l-${m.slug}`} path={`/topics/${m.slug}/lessons/*`} element={<TopicLessonRoute manifest={m} />} />,
      ])}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
