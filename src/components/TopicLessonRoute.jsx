import { useParams } from 'react-router-dom';
import LessonShell from './LessonShell.jsx';
import NotFound from '../routes/NotFound.jsx';

// Generic lesson router. Looks up the slug from the wildcard route,
// strips any trailing .html for backwards compatibility, finds the
// lesson in the passed manifest, and renders LessonShell.
export default function TopicLessonRoute({ manifest }) {
  const params = useParams();
  const slug = (params['*'] || params.slug || '').replace(/\.html$/, '').replace(/\/$/, '');
  const lesson = manifest.lessons.find((l) => l.slug === slug);
  if (!lesson) return <NotFound />;
  return <LessonShell topic={manifest} lesson={lesson} />;
}
