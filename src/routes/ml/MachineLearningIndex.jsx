import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../../components/SiteHeader.jsx';
import { MascotHello } from '../../components/Mascot.jsx';
import { manifest } from '../../data/machine-learning.jsx';

export default function MachineLearningIndex() {
  useEffect(() => {
    document.title = 'Fundamental of Machine Learning — Visual Crash Course';
  }, []);

  return (
    <>
      <SiteHeader
        breadcrumb={
          <>
            <Link to="/">Fundamental of X</Link>
            <span className="sep">›</span>
            <span className="current">Machine Learning</span>
          </>
        }
      />
      <main className="hub">
        <section className="intro">
          <div className="badge live">8 Lessons</div>
          <h1>Fundamental of <span className="x">Machine Learning</span></h1>
          <p>{manifest.intro}</p>
          <MascotHello />
        </section>
        <section>
          <h2>Lessons</h2>
          <div className="lesson-grid">
            {manifest.lessons.map((l, i) => (
              <Link className="lesson-card" key={l.slug} to={`/topics/machine-learning/lessons/${l.slug}`}>
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
