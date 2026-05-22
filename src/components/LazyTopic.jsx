import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TopicIndex from './TopicIndex.jsx';
import LessonShell from './LessonShell.jsx';
import Loading from './Loading.jsx';
import NotFound from '../routes/NotFound.jsx';

// Per-topic data files that should be served via dynamic chunks.
// import.meta.glob asks Vite to emit one chunk per matched file; the
// returned record maps each path to a `() => Promise<Module>` loader.
//
// The four bespoke topics (compilers, genetics, machine-learning, database)
// have their own dedicated route components that React.lazy-load directly;
// their data files are still matched by the glob (Vite dedupes), but we
// never *use* the dynamic loader for them — App.jsx routes those slugs to
// their bespoke route components instead.
const topicModules = import.meta.glob('../data/*.jsx');

// Generic topics handled by this dynamic loader. Bespoke topics are
// listed here so the loader can fall through and let App.jsx win the
// match; instead, the loader treats unknown slugs as 404.
const ALL_SLUGS = new Set([
  // bespoke (won't reach this component normally, but guarded just in case)
  'compilers', 'genetics', 'machine-learning', 'database',
  // generic
  'backend', 'internet', 'messaging', 'distributed-systems', 'cryptography',
  'design-patterns', 'operating-systems', 'computer-architecture',
  'transformers', 'quantum-computing',
  'light', 'solar-cell', 'energy-systems', 'electric-vehicles',
  'algorithms', 'threads',
]);

// Cache successfully loaded manifests so re-navigations are instant.
const manifestCache = new Map();

function load(slug) {
  if (manifestCache.has(slug)) return Promise.resolve(manifestCache.get(slug));
  const loader = topicModules[`../data/${slug}.jsx`];
  if (!loader) return Promise.resolve(null);
  return loader().then((m) => {
    manifestCache.set(slug, m.manifest);
    return m.manifest;
  });
}

export function LazyTopicIndex() {
  const { slug } = useParams();
  const [manifest, setManifest] = useState(() => manifestCache.get(slug) || null);

  useEffect(() => {
    if (!ALL_SLUGS.has(slug)) { setManifest('404'); return; }
    let cancelled = false;
    load(slug).then((m) => {
      if (!cancelled) setManifest(m || '404');
    });
    return () => { cancelled = true; };
  }, [slug]);

  if (manifest === '404') return <NotFound />;
  if (!manifest) return <Loading />;
  return <TopicIndex manifest={manifest} />;
}

export function LazyTopicLesson() {
  const params = useParams();
  const slug = params.slug;
  const lessonSlug = (params['*'] || '').replace(/\.html$/, '').replace(/\/$/, '');
  const [manifest, setManifest] = useState(() => manifestCache.get(slug) || null);

  useEffect(() => {
    if (!ALL_SLUGS.has(slug)) { setManifest('404'); return; }
    let cancelled = false;
    load(slug).then((m) => {
      if (!cancelled) setManifest(m || '404');
    });
    return () => { cancelled = true; };
  }, [slug]);

  if (manifest === '404') return <NotFound />;
  if (!manifest) return <Loading />;
  const lesson = manifest.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) return <NotFound />;
  return <LessonShell topic={manifest} lesson={lesson} />;
}
