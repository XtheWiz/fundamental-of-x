import { useParams } from 'react-router-dom';
import LessonShell from '../../components/LessonShell.jsx';
import NotFound from '../NotFound.jsx';
import { manifest } from '../../data/compilers.jsx';

export default function CompilersLesson() {
  const params = useParams();
  // Path is /topics/compilers/lessons/* — the slug may end in .html for
  // backwards compatibility with old vanilla URLs.
  const raw = params['*'] || params.slug || '';
  const slug = raw.replace(/\.html$/, '').replace(/\/$/, '');
  const lesson = manifest.lessons.find((l) => l.slug === slug);
  if (!lesson) return <NotFound />;
  return <LessonShell topic={manifest} lesson={lesson} />;
}
