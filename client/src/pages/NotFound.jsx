import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function NotFound() {
  useDocumentTitle('Page not found');

  return (
    <main className="app-main app-main--narrow" id="main">
      <div className="page-head">
        <h1 className="page-head__title">Page not found</h1>
        <p className="page-head__meta">
          That address does not match anything on the platform. It may have been deleted, or the
          link may be mistyped.
        </p>
      </div>
      <Link className="button" to="/">
        Back to the feed
      </Link>
    </main>
  );
}
