import { Routes, Route } from 'react-router-dom';
import Home from './routes/Home.jsx';
import CompilersIndex from './routes/compilers/CompilersIndex.jsx';
import CompilersLesson from './routes/compilers/CompilersLesson.jsx';
import GeneticsIndex from './routes/genetics/GeneticsIndex.jsx';
import GeneticsLesson from './routes/genetics/GeneticsLesson.jsx';
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
