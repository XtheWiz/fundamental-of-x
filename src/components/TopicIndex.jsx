import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from './SiteHeader.jsx';
import { MascotHello } from './Mascot.jsx';

// Generic topic landing page. Each topic data file passes its manifest in.
export default function TopicIndex({ manifest }) {
  useEffect(() => {
    document.title = `Fundamental of ${manifest.title} — Visual Crash Course`;
  }, [manifest.title]);
  return (
    <>
      <SiteHeader breadcrumb={
        <>
          <Link to="/">Fundamental of X</Link>
          <span className="sep">›</span>
          <span className="current">{manifest.title}</span>
        </>
      } />
      <main className="hub">
        <section className="intro">
          <div className="badge live">{manifest.lessons.length} Lessons</div>
          <h1>Fundamental of <span className="x">{manifest.title}</span></h1>
          <p>{manifest.intro}</p>
          <MascotHello />
        </section>
        <section>
          <h2>Lessons</h2>
          <div className="lesson-grid">
            {manifest.lessons.map((l, i) => (
              <Link className="lesson-card" key={l.slug} to={`/topics/${manifest.slug}/lessons/${l.slug}`}>
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{l.title}</h3>
                <p className="blurb">{l.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <footer className="site-footer">
        Part of the <Link to="/">Fundamental of X</Link> series.
      </footer>
    </>
  );
}
