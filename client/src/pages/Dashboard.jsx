import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { readErrorMessage } from '../api/axios.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { PostListSkeleton } from '../components/Skeleton.jsx';
import useRequest from '../hooks/useRequest.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { formatDate } from '../utils/format.js';

export default function Dashboard() {
  useDocumentTitle('Dashboard');

  const { data, loading, error, reload, setData } = useRequest(
    (signal) => api.get('/posts/mine', { signal }).then((res) => res.data.posts),
    [],
  );

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);

  async function confirmDelete() {
    setDeleting(true);
    setActionError(null);
    try {
      await api.delete(`/posts/${pendingDelete._id}`);
      setData((posts) => posts.filter((post) => post._id !== pendingDelete._id));
      setPendingDelete(null);
    } catch (deleteError) {
      setActionError(readErrorMessage(deleteError, 'Could not delete that post.'));
    } finally {
      setDeleting(false);
    }
  }

  const drafts = data?.filter((post) => post.status === 'draft') ?? [];
  const published = data?.filter((post) => post.status === 'published') ?? [];

  return (
    <main className="app-main" id="main">
      <div className="page-head">
        <div className="page-head__row">
          <div>
            <h1 className="page-head__title">Your posts</h1>
            <p className="page-head__meta">
              {data
                ? `${published.length} published, ${drafts.length} in draft`
                : 'Drafts and published articles in one place'}
            </p>
          </div>
          <Link className="button button--primary" to="/editor/new">
            New post
          </Link>
        </div>
      </div>

      {actionError ? (
        <div style={{ marginBottom: '1rem' }}>
          <ErrorMessage>{actionError}</ErrorMessage>
        </div>
      ) : null}

      {loading ? <PostListSkeleton count={3} /> : null}
      {!loading && error ? <ErrorMessage onRetry={reload}>{error}</ErrorMessage> : null}

      {!loading && !error && data ? (
        data.length ? (
          <div className="record-list">
            {data.map((post) => (
              <div className="record" key={post._id}>
                <div>
                  <p className="record__title">
                    {post.status === 'published' ? (
                      <Link to={`/post/${post.slug}`}>{post.title}</Link>
                    ) : (
                      post.title
                    )}
                  </p>
                  <div className="record__meta">
                    <span
                      className={`status-flag${
                        post.status === 'published' ? ' status-flag--published' : ''
                      }`}
                    >
                      {post.status}
                    </span>
                    <span>Updated {formatDate(post.updatedAt)}</span>
                    {post.tags?.length ? (
                      <span>{post.tags.map((tag) => tag.name).join(', ')}</span>
                    ) : null}
                  </div>
                </div>

                <div className="button-row">
                  <Link className="button" to={`/editor/${post._id}`}>
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="button button--danger"
                    onClick={() => setPendingDelete(post)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="You have not written anything yet">
            Start a draft, preview the Markdown as you type, and publish when it reads well.
          </EmptyState>
        )
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this post?"
          body={`"${pendingDelete.title}" will be removed permanently. This cannot be undone.`}
          confirmLabel="Delete post"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => {
            setPendingDelete(null);
            setActionError(null);
          }}
        />
      ) : null}
    </main>
  );
}
