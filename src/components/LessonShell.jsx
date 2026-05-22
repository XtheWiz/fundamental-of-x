import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteHeader from './SiteHeader.jsx';
import { MascotTakeaway } from './Mascot.jsx';
import TallyModal from './TallyModal.jsx';
import { TALLY_FORMS, useFeedbackForm, githubFeedbackUrl } from '../data/contact.js';

export default function LessonShell({ topic, lesson }) {
  const navigate = useNavigate();
  const idx = topic.lessons.findIndex((l) => l.slug === lesson.slug);
  const prev = idx > 0 ? topic.lessons[idx - 1] : null;
  const next = idx >= 0 && idx < topic.lessons.length - 1 ? topic.lessons[idx + 1] : null;

  useEffect(() => {
    document.title = `${lesson.title} — Fundamental of ${topic.title}`;
  }, [lesson.title, topic.title]);

  // Mobile menu toggle for the sidebar.
  useEffect(() => {
    const btn = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (!btn || !sidebar) return;
    const handler = () => sidebar.classList.toggle('open');
    btn.addEventListener('click', handler);
    return () => btn.removeEventListener('click', handler);
  }, []);

  return (
    <>
      <SiteHeader
        breadcrumb={
          <>
            <Link to="/">Fundamental of X</Link>
            <span className="sep">›</span>
            <Link to={`/topics/${topic.slug}`}>{topic.title}</Link>
            <span className="sep">›</span>
            <span className="current">{lesson.title}</span>
          </>
        }
      />

      <div className="layout">
        <aside className="sidebar" id="sidebar">
          <h4>{topic.title}</h4>
          <ol>
            {topic.lessons.map((l) => (
              <li key={l.slug}>
                <Link
                  to={`/topics/${topic.slug}/lessons/${l.slug}`}
                  className={l.slug === lesson.slug ? 'active' : undefined}
                >
                  {l.title}
                </Link>
              </li>
            ))}
          </ol>
        </aside>

        <main className="main">
          <div className="container">
            <div className="lesson-header">
              <div className="lesson-num">Lesson {lesson.number}</div>
              <h1>{lesson.title}</h1>
              <p className="blurb">{lesson.intro}</p>
            </div>

            {lesson.sections?.map((s, i) => (
              <section className="section" key={i}>
                <h2>{s.heading}</h2>
                {s.body}
              </section>
            ))}

            <section className="section">
              <h2>Try it</h2>
              {lesson.Widget ? <lesson.Widget /> : null}
            </section>

            <div className="takeaways">
              <h3>Key takeaways</h3>
              <ul>
                {lesson.takeaways?.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
              <MascotTakeaway />
            </div>

            <nav className="lesson-nav">
              {prev ? (
                <Link className="prev" to={`/topics/${topic.slug}/lessons/${prev.slug}`}>
                  <div className="dir">← prev</div>
                  <div className="title">{prev.title}</div>
                </Link>
              ) : (
                <a className="prev disabled">
                  <div className="dir">← prev</div>
                  <div className="title">—</div>
                </a>
              )}
              {next ? (
                <Link className="next" to={`/topics/${topic.slug}/lessons/${next.slug}`}>
                  <div className="dir">next →</div>
                  <div className="title">{next.title}</div>
                </Link>
              ) : (
                <a className="next disabled">
                  <div className="dir">next →</div>
                  <div className="title">—</div>
                </a>
              )}
            </nav>

            <FeedbackLink topic={topic} lesson={lesson} />
          </div>
        </main>
      </div>
    </>
  );
}

function FeedbackLink({ topic, lesson }) {
  const [open, setOpen] = useState(false);
  const url = typeof window !== 'undefined'
    ? window.location.href
    : `https://fundamentalofx.com/topics/${topic.slug}/lessons/${lesson.slug}`;
  const href = githubFeedbackUrl({ topicTitle: topic.title, lessonTitle: lesson.title, url });

  function onClick(e) {
    if (useFeedbackForm) { e.preventDefault(); setOpen(true); }
  }

  return (
    <>
      <div className="lesson-feedback">
        Found a bug or have an idea for this lesson?{' '}
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>Tell us</a>.
      </div>
      <TallyModal
        open={open}
        onClose={() => setOpen(false)}
        title={`Feedback · ${lesson.title}`}
        formUrl={TALLY_FORMS.feedback}
        prefill={{
          Topic: topic.title,
          Lesson: lesson.title,
          'Page URL': url,
        }}
      />
    </>
  );
}
