import { Link } from 'react-router-dom';
import { SITE_NAME } from '../../config.js';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>
          {SITE_NAME} is a Hashnode-inspired internship project. It is not affiliated with Hashnode.
        </p>
        <nav className="site-footer__links" aria-label="Legal">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
