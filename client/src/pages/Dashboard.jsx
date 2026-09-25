import { useState } from 'react';
import { Link } from 'react-router-dom';
import { deletePost, fetchMyPosts } from '../api/posts.js';
import { getErrorMessage } from '../api/axios.js';
import useAuth from '../hooks/useAuth.js';
import useResource from '../hooks/useResource.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import StateMessage, { ErrorMessage } from '../components/ui/StateMessage.jsx';
import { formatDate } from '../utils/format.js';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { data, setData, status, error, retry } = useResource(fetchMyPosts);
  const [filter, setFilter] = useState('all');
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const posts = data ?? [];
  const countFor = (value) =>
    value === 'all' ? posts.length : posts.filter((post) => post.status === value).length;
  const visiblePosts = filter === 'all' ? posts : posts.filter((post) => post.status === filter);

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deletePost(postToDelete._id);
      setData((current) => current.filter((post) => post._id !== postToDelete._id));
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  }

  return (
    <>
      <header className="dashboard-header">
        <div>
          <h1 className="page-title">Your posts</h1>
          <p className="page-subtitle">Signed in as {user.name}</p>
        </div>
        <Link to="/write" className="btn btn--primary">
          New post
        </Link>
      </header>

      <div className="tabs" role="tablist" aria-label="Filter posts">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            className="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
          >
            {label} {status === 'ready' && <span className="count">{countFor(value)}</span>}
          </button>
        ))}
      </div>

      {deleteError && (
        <p className="form-error form-error--spaced" role="alert">
          {deleteError}
        </p>
      )}

      {status === 'loading' && <DashboardSkeleton />}
      {status === 'error' && <ErrorMessage message={error.message} onRetry={retry} />}
      {status === 'ready' && !visiblePosts.length && (
        <StateMessage
          title={filter === 'draft' ? 'No drafts' : 'No posts here yet'}
          action={
            <Link to="/write" className="btn">
              Write a post
            </Link>
          }
        >
          {filter === 'draft'
            ? 'Posts you save without publishing will wait here.'
            : 'Everything you write, published or not, is listed on this page.'}
        </StateMessage>
      )}
      {status === 'ready' && visiblePosts.length > 0 && (
        <ul className="dashboard-list">
          {visiblePosts.map((post) => (
            <li key={post._id} className="dashboard-row">
              <div className="dashboard-row__main">
                <Link to={`/post/${post.slug}`} className="dashboard-row__title">
                  {post.title}
                </Link>
                <p className="meta">
                  <span className={`status-label status-label--${post.status}`}>{post.status}</span>
                  <span>Updated {formatDate(post.updatedAt)}</span>
                </p>
              </div>
              <div className="dashboard-row__actions">
                <Link to={`/edit/${post._id}`} className="btn btn--small">
                  Edit
                </Link>
                <button
                  type="button"
                  className="btn btn--small btn--danger"
                  onClick={() => setPostToDelete(post)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(postToDelete)}
        title="Delete this post?"
        confirmLabel="Delete post"
        confirmingLabel="Deleting..."
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPostToDelete(null)}
      >
        &ldquo;{postToDelete?.title}&rdquo; will be removed for good. This cannot be undone.
      </ConfirmDialog>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your posts">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="dashboard-row">
          <div className="dashboard-row__main">
            <Skeleton width="70%" height={20} style={{ marginBottom: 8 }} />
            <Skeleton width={160} height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}
