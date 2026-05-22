import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import { MascotHello } from '../components/Mascot.jsx';
import { CATEGORIES } from '../data/subjects.js';

function SubjectCard({ subject }) {
  const inner = (
    <>
      <span className="tag">LIVE</span>
      <h3>Fundamental of <span className="x">{subject.title}</span></h3>
      <p>{subject.body}</p>
      <div className="meta">8 lessons · interactive</div>
    </>
  );
  return subject.ported ? (
    <Link className="subject-card" to={subject.to}>{inner}</Link>
  ) : (
    <a className="subject-card" href={subject.href}>{inner}</a>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="hub">
        <section className="intro">
          <h1>Foundations you can <em>poke at</em>.<br />One <span className="x">X</span> at a time.</h1>
          <p>
            We took the heavyweight topics — compilers, qubits, DNA, the internet —
            and turned each one into a playground. You click, you drag, you watch.
            The intuition shows up on its own. No wall of text required.
          </p>
          <MascotHello />
        </section>

        <section id="subjects">
          <h2>Subjects</h2>
          {CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <h3 className="category-heading">{cat.label}</h3>
              <div className="subject-grid">
                {cat.subjects.map((s) => <SubjectCard key={s.slug} subject={s} />)}
              </div>
            </div>
          ))}
        </section>

        <section id="about" style={{ marginTop: '3rem', maxWidth: 720 }}>
          <h2>Why visual?</h2>
          <p>
            Honestly? Because pictures move. A B-Tree splitting is one diagram
            instead of three paragraphs; a transaction rolling back is one
            animation instead of a bullet list. You learn faster when you can{' '}
            <em>see</em> the thing happen — that's the whole pitch.
          </p>
          <p>
            Every subject is a self-contained playground. Start anywhere. Click
            around. If something feels weird, that's usually where the interesting
            bit is hiding.
          </p>
        </section>

        <section id="contribute" style={{ marginTop: '3rem', maxWidth: 720 }}>
          <h2>Help shape what's next</h2>
          <p>
            Two ways to chip in. Each one opens a GitHub issue with a short form —
            no commitment beyond filling it out.
          </p>
          <div className="cta-grid">
            <a
              className="cta-card"
              href="https://github.com/xthewiz/fundamental-of-x/issues/new?template=topic-request.yml"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="cta-icon" aria-hidden="true">＋</div>
              <strong>Request a topic</strong>
              <span>
                Tell us what the next <span className="x">Fundamental&nbsp;of&nbsp;X</span> should
                cover. Other folks 👍 to vote up the queue.
              </span>
            </a>
            <a
              className="cta-card"
              href="https://github.com/xthewiz/fundamental-of-x/issues/new?template=feedback.yml"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="cta-icon" aria-hidden="true">✎</div>
              <strong>Report a bug or send feedback</strong>
              <span>
                Broken widget, typo, confusing explanation, or just an idea on an
                existing lesson — tell us.
              </span>
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        Built with curiosity. Made for learners who think with pictures.
      </footer>
    </>
  );
}
