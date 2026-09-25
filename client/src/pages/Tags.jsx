import { Link } from 'react-router-dom';
import useTags from '../hooks/useTags.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import Skeleton from '../components/ui/Skeleton.jsx';
import StateMessage, { ErrorMessage } from '../components/ui/StateMessage.jsx';
import { pluralize } from '../utils/format.js';

export default function Tags() {
  useDocumentTitle('Tags');
  const { tags, status, error } = useTags();

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Tags</h1>
        <p className="page-subtitle">Browse posts by topic.</p>
      </header>

      {status === 'loading' && (
        <div aria-busy="true">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} height={20} style={{ marginBottom: 18 }} />
          ))}
        </div>
      )}
      {status === 'error' && <ErrorMessage message={error} />}
      {status === 'ready' && !tags.length && (
        <StateMessage title="No tags yet">Tags appear once someone adds them to a post.</StateMessage>
      )}
      {status === 'ready' && tags.length > 0 && (
        <ul className="tag-index">
          {tags.map((tag) => (
            <li key={tag._id}>
              <Link to={`/tags/${tag.slug}`} className="tag-index__item">
                <span>#{tag.name}</span>
                <span className="count">{pluralize(tag.postCount, 'post')}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
