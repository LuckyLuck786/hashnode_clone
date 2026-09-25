import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import StateMessage from '../components/ui/StateMessage.jsx';

export default function NotFound() {
  useDocumentTitle('Page not found');

  return (
    <StateMessage
      title="Page not found"
      action={
        <Link to="/" className="btn">
          Back to the feed
        </Link>
      }
    >
      The page you are looking for does not exist or was moved.
    </StateMessage>
  );
}
