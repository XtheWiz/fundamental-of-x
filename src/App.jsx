import { Routes, Route } from 'react-router-dom';
import Home from './routes/Home.jsx';
import CompilersIndex from './routes/compilers/CompilersIndex.jsx';
import CompilersLesson from './routes/compilers/CompilersLesson.jsx';
import GeneticsIndex from './routes/genetics/GeneticsIndex.jsx';
import GeneticsLesson from './routes/genetics/GeneticsLesson.jsx';
import MachineLearningIndex from './routes/ml/MachineLearningIndex.jsx';
import MachineLearningLesson from './routes/ml/MachineLearningLesson.jsx';
import DatabaseIndex from './routes/database/DatabaseIndex.jsx';
import DatabaseLesson from './routes/database/DatabaseLesson.jsx';
import NotFound from './routes/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
