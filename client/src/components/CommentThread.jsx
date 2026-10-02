import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { readErrorMessage } from '../api/axios.js';
import Avatar from './Avatar.jsx';
import EmptyState from './EmptyState.jsx';
import useAuth from '../hooks/useAuth.js';
import { formatDate } from '../utils/format.js';

// A single textarea used for both a new top-level comment and a reply, so the two paths
// share validation and the "cancel" affordance.
function CommentForm({ placeholder, submitLabel, onSubmit, onCancel, autoFocus = false }) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const tooLong = body.trim().length > 2000;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!body.trim() || tooLong) return;

    setBusy(true);
    setError(null);
    try {
      await onSubmit(body.trim());
      setBody('');
    } catch (submitError) {
      setError(readErrorMessage(submitError, 'Could not post that comment.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={`comment-${submitLabel}`}>
        {placeholder}
      </label>
      <textarea
        id={`comment-${submitLabel}`}
        className="input"
        rows={onCancel ? 2 : 3}
        placeholder={placeholder}
        value={body}
        maxLength={2100}
        autoFocus={autoFocus}
        onChange={(event) => setBody(event.target.value)}
      />

      {tooLong ? (
        <p className="notice notice--error">Comments can be at most 2000 characters.</p>
      ) : null}
      {error ? (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="button-row">
        <button type="submit" className="button button--primary" disabled={busy || tooLong}>
          {busy ? 'Posting…' : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="button button--quiet" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function CommentItem({ comment, postAuthorId, currentUserId, onReply, onDelete, depth = 0 }) {
  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const isAuthor = currentUserId && comment.author?._id === currentUserId;
  // A post's author can moderate their own discussion, matching the API rule.
  const canDelete = isAuthor || (currentUserId && postAuthorId === currentUserId);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(comment._id);
    } catch (error) {
      setDeleteError(readErrorMessage(error, 'Could not delete that comment.'));
      setDeleting(false);
    }
  }

  return (
    <li className={`comment${depth > 0 ? ' comment--reply' : ''}`}>
      <Avatar user={comment.author} />

      <div className="comment__body">
        <p className="comment__meta">
          {comment.author ? (
            <Link to={`/profile/${comment.author._id}`}>{comment.author.name}</Link>
          ) : (
            'Unknown'
          )}
          <span className="dot-sep">{formatDate(comment.createdAt)}</span>
        </p>

        <p className="comment__text">{comment.body}</p>

        <div className="comment__actions">
          {depth === 0 ? (
            <button type="button" className="button button--quiet" onClick={() => setReplying(!replying)}>
              Reply
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              className="button button--quiet"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : null}
        </div>

        {deleteError ? (
          <p className="notice notice--error" role="alert">
            {deleteError}
          </p>
        ) : null}

        {replying ? (
          <CommentForm
            placeholder={`Reply to ${comment.author?.name ?? 'this comment'}`}
            submitLabel="Post reply"
            autoFocus
            onCancel={() => setReplying(false)}
            onSubmit={(body) => onReply(body, comment._id)}
          />
        ) : null}

        {comment.replies?.length ? (
          <ul className="comment__replies">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                postAuthorId={postAuthorId}
                currentUserId={currentUserId}
                onReply={onReply}
                onDelete={onDelete}
                depth={depth + 1}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

export default function CommentThread({ postId, postAuthorId, thread, onChange }) {
  const { isAuthenticated, user } = useAuth();

  async function addComment(body, parent) {
    await api.post(`/posts/${postId}/comments`, { body, parent });
    onChange();
  }

  async function deleteComment(commentId) {
    await api.delete(`/comments/${commentId}`);
    onChange();
  }

  const total = thread?.replyCount ?? 0;

  return (
    <section className="comments" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="comments__heading">
        {total === 0 ? 'Discussion' : `${total} ${total === 1 ? 'comment' : 'comments'}`}
      </h2>

      {isAuthenticated ? (
        <CommentForm
          placeholder="Add a comment. Markdown is not supported here — plain text works best."
          submitLabel="Post comment"
          onSubmit={addComment}
        />
      ) : (
        <p className="comments__signin">
          <Link to="/login">Log in</Link> or <Link to="/register">create an account</Link> to
          join the discussion.
        </p>
      )}

      {!thread ? (
        <p className="comments__loading">Loading comments…</p>
      ) : thread.topLevel.length ? (
        <ul className="comment__list">
          {thread.topLevel.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postAuthorId={postAuthorId}
              currentUserId={user?._id}
              onReply={addComment}
              onDelete={deleteComment}
            />
          ))}
        </ul>
      ) : (
        <EmptyState title="No comments yet">
          {isAuthenticated
            ? 'Be the first to reply to this post.'
            : 'Nobody has replied yet — logging in lets you join in.'}
        </EmptyState>
      )}
    </section>
  );
}