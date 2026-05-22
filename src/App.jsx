import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './routes/Home.jsx';
import NotFound from './routes/NotFound.jsx';
import Loading from './components/Loading.jsx';
import { LazyTopicIndex, LazyTopicLesson } from './components/LazyTopic.jsx';

// Bespoke React-native ports (richer per-lesson prose + native widgets +
// Framer Motion accents). Each is its own chunk — visiting one topic only
// downloads that topic's manifest + widgets.
const CompilersIndex      = lazy(() => import('./routes/compilers/CompilersIndex.jsx'));
const CompilersLesson     = lazy(() => import('./routes/compilers/CompilersLesson.jsx'));
const GeneticsIndex       = lazy(() => import('./routes/genetics/GeneticsIndex.jsx'));
const GeneticsLesson      = lazy(() => import('./routes/genetics/GeneticsLesson.jsx'));
const MachineLearningIndex  = lazy(() => import('./routes/ml/MachineLearningIndex.jsx'));
const MachineLearningLesson = lazy(() => import('./routes/ml/MachineLearningLesson.jsx'));
const DatabaseIndex       = lazy(() => import('./routes/database/DatabaseIndex.jsx'));
const DatabaseLesson      = lazy(() => import('./routes/database/DatabaseLesson.jsx'));

// Generic, legacy-widget-wrapped topics — routed by :slug. The dynamic
// loader in LazyTopic.jsx pulls in the right data file (and its widget
// chunk) on first visit.

function S({ children }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Bespoke ports — explicit routes win over the :slug catch-all below */}
      <Route path="/topics/compilers"             element={<S><CompilersIndex /></S>} />
      <Route path="/topics/compilers/"            element={<S><CompilersIndex /></S>} />
      <Route path="/topics/compilers/index.html"  element={<S><CompilersIndex /></S>} />
      <Route path="/topics/compilers/lessons/*"   element={<S><CompilersLesson /></S>} />

      <Route path="/topics/genetics"              element={<S><GeneticsIndex /></S>} />
      <Route path="/topics/genetics/"             element={<S><GeneticsIndex /></S>} />
      <Route path="/topics/genetics/index.html"   element={<S><GeneticsIndex /></S>} />
      <Route path="/topics/genetics/lessons/*"    element={<S><GeneticsLesson /></S>} />

      <Route path="/topics/machine-learning"             element={<S><MachineLearningIndex /></S>} />
      <Route path="/topics/machine-learning/"            element={<S><MachineLearningIndex /></S>} />
      <Route path="/topics/machine-learning/index.html"  element={<S><MachineLearningIndex /></S>} />
      <Route path="/topics/machine-learning/lessons/*"   element={<S><MachineLearningLesson /></S>} />

      <Route path="/topics/database"             element={<S><DatabaseIndex /></S>} />
      <Route path="/topics/database/"            element={<S><DatabaseIndex /></S>} />
      <Route path="/topics/database/index.html"  element={<S><DatabaseIndex /></S>} />
      <Route path="/topics/database/lessons/*"   element={<S><DatabaseLesson /></S>} />

      {/* Generic ports — dynamic chunk loaded by slug. React Router prefers
          the literal routes above when a slug matches them. */}
      <Route path="/topics/:slug"                element={<LazyTopicIndex />} />
      <Route path="/topics/:slug/"               element={<LazyTopicIndex />} />
      <Route path="/topics/:slug/index.html"     element={<LazyTopicIndex />} />
      <Route path="/topics/:slug/lessons/*"      element={<LazyTopicLesson />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
