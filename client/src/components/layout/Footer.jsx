import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="colophon">
      <div className="colophon__inner">
        <span>Monospace, a publishing platform for developers.</span>
        <nav className="colophon__links" aria-label="Legal and site">
          <Link to="/tags">Tags</Link>
          <Link to="/terms">Terms of service</Link>
          <Link to="/privacy">Privacy policy</Link>
        </nav>
      </div>
    </footer>
  );
}
