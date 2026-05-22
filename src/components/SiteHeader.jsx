import { Link } from 'react-router-dom';
import BMCButton from './BMCButton.jsx';

// Breadcrumb is rendered separately by lesson/topic pages; the home page
// shows the brand + the section anchors. Language switcher stays hidden
// per the i18n SWITCHER_ENABLED flag.
export default function SiteHeader({ breadcrumb }) {
  return (
    <header className="site-header">
      {breadcrumb ? (
        <div>
          <div className="brand">
            <Link to="/">Fundamental of <span className="accent">X</span></Link>
          </div>
          <div className="breadcrumb">{breadcrumb}</div>
        </div>
      ) : (
        <div className="brand">
          <Link to="/">Fundamental of <span className="accent">X</span></Link>
        </div>
      )}
      <nav>
        {!breadcrumb && (
          <>
            <a href="#subjects">Subjects</a>
            <a href="#about">About</a>
          </>
        )}
        <BMCButton variant="compact" />
      </nav>
    </header>
  );
}
