import api from '../api/axios.js';
import TagPill from '../components/post/TagPill.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { SkeletonLine } from '../components/Skeleton.jsx';
import useRequest from '../hooks/useRequest.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function TagsPage() {
  useDocumentTitle('Tags');

  const { data, loading, error, reload } = useRequest(
    (signal) => api.get('/tags', { signal }).then((res) => res.data.tags),
    [],
  );

  return (
    <main className="app-main" id="main">
      <div className="page-head">
        <h1 className="page-head__title">Topics</h1>
        <p className="page-head__meta">Every tag on the platform, busiest first.</p>
      </div>

      {loading ? (
        <div className="tag-list" role="status" aria-label="Loading tags">
          {Array.from({ length: 10 }, (unused, index) => (
            <span key={index} style={{ width: '5rem' }}>
              <SkeletonLine />
            </span>
          ))}
        </div>
      ) : null}

      {!loading && error ? <ErrorMessage onRetry={reload}>{error}</ErrorMessage> : null}

      {!loading && !error && data ? (
        data.length ? (
          <div className="tag-list">
            {data.map((tag) => (
              <TagPill key={tag._id} tag={tag} count={tag.postCount} />
            ))}
          </div>
        ) : (
          <EmptyState title="No tags yet">
            Tags are created the first time an author uses them on a post.
          </EmptyState>
        )
      ) : null}
    </main>
  );
}
