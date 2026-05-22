import { Routes, Route } from 'react-router-dom';
import Home from './routes/Home.jsx';
import CompilersIndex from './routes/compilers/CompilersIndex.jsx';
import CompilersLesson from './routes/compilers/CompilersLesson.jsx';
import NotFound from './routes/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/topics/compilers" element={<CompilersIndex />} />
      <Route path="/topics/compilers/" element={<CompilersIndex />} />
      <Route path="/topics/compilers/index.html" element={<CompilersIndex />} />
      <Route path="/topics/compilers/lessons/*" element={<CompilersLesson />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
