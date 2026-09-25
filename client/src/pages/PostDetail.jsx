import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deletePost, fetchPost } from '../api/posts.js';
import { getErrorMessage } from '../api/axios.js';
import useAuth from '../hooks/useAuth.js';
import useResource from '../hooks/useResource.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import Avatar from '../components/ui/Avatar.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import StateMessage, { ErrorMessage } from '../components/ui/StateMessage.jsx';
import MarkdownView from '../components/post/MarkdownView.jsx';
import PostMeta from '../components/post/PostMeta.jsx';
import TagList from '../components/post/TagList.jsx';

export default function PostDetail() {
  const { slug } = useParams();
  const load = useCallback(() => fetchPost(slug), [slug]);
  const { data: post, status, error, retry } = useResource(load);
  useDocumentTitle(post?.title);

  if (status === 'loading') return <PostSkeleton />;
  if (status === 'error' && error.status === 404) {
    return (
      <StateMessage
        title="Post not found"
        action={
          <Link to="/" className="btn">
            Back to the feed
          </Link>
        }
      >
        It may have been deleted, or the link might be wrong.
      </StateMessage>
    );
  }
  if (status === 'error') return <ErrorMessage message={error.message} onRetry={retry} />;

  return (
    <article className="post">
      {post.status === 'draft' && (
        <p className="draft-notice">This is a draft. Only you can see it until it is published.</p>
      )}
      {post.coverImage && <img className="post__cover" src={post.coverImage} alt="" />}

      <header className="post__header">
        <h1 className="post__title">{post.title}</h1>
        <div className="post__byline">
          <Link to={`/u/${post.author._id}`}>
            <Avatar user={post.author} size={40} />
          </Link>
          <div>
            <Link to={`/u/${post.author._id}`} className="post__author-name">
              {post.author.name}
            </Link>
            <PostMeta post={post} />
          </div>
        </div>
        <TagList tags={post.tags} />
        <OwnerActions post={post} />
      </header>

      <MarkdownView source={post.content} />

      <footer className="author-card">
        <Link to={`/u/${post.author._id}`}>
          <Avatar user={post.author} size={56} />
        </Link>
        <div>
          <p className="author-card__label">Written by</p>
          <Link to={`/u/${post.author._id}`} className="author-card__name">
            {post.author.name}
          </Link>
          {post.author.bio && <p className="author-card__bio">{post.author.bio}</p>}
        </div>
      </footer>
    </article>
  );
}

function OwnerActions({ post }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (user?._id !== post.author._id) return null;

  async function handleDelete() {
    setIsDeleting(true);
    setError('');
    try {
      await deletePost(post._id);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  }

  return (
    <>
      <div className="post__owner-actions">
        <Link to={`/edit/${post._id}`} className="btn btn--small">
          Edit post
        </Link>
        <button
          type="button"
          className="btn btn--small btn--danger"
          onClick={() => setIsConfirmOpen(true)}
        >
          Delete
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
      <ConfirmDialog
        open={isConfirmOpen}
        title="Delete this post?"
        confirmLabel="Delete post"
        confirmingLabel="Deleting..."
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
      >
        &ldquo;{post.title}&rdquo; will be removed for good. This cannot be undone.
      </ConfirmDialog>
    </>
  );
}

function PostSkeleton() {
  return (
    <div className="post" aria-busy="true" aria-label="Loading post">
      <Skeleton height="auto" style={{ aspectRatio: '2 / 1', marginBottom: 32 }} />
      <Skeleton width="90%" height={36} style={{ marginBottom: 12 }} />
      <Skeleton width="60%" height={36} style={{ marginBottom: 28 }} />
      <Skeleton width={220} height={16} style={{ marginBottom: 40 }} />
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} width={index % 3 === 2 ? '70%' : '100%'} height={16} style={{ marginBottom: 12 }} />
      ))}
    </div>
  );
}
