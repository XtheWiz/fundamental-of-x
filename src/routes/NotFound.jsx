import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="hub">
        <section className="intro">
          <h1>404 — page not found</h1>
          <p>
            That URL doesn't exist. Either the link is broken or the page hasn't
            been built yet. <Link to="/">Back to the home page</Link>.
          </p>
        </section>
      </main>
    </>
  );
}
