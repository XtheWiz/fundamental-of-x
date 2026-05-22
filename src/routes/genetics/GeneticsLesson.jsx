import { useParams } from 'react-router-dom';
import LessonShell from '../../components/LessonShell.jsx';
import NotFound from '../NotFound.jsx';
import { manifest } from '../../data/genetics.jsx';

export default function GeneticsLesson() {
  const params = useParams();
  const raw = params['*'] || params.slug || '';
  const slug = raw.replace(/\.html$/, '').replace(/\/$/, '');
  const lesson = manifest.lessons.find((l) => l.slug === slug);
  if (!lesson) return <NotFound />;
  return <LessonShell topic={manifest} lesson={lesson} />;
}
