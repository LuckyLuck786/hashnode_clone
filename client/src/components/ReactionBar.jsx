import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { readErrorMessage } from '../api/axios.js';
import useAuth from '../hooks/useAuth.js';

// A single component for the three "act on something" buttons, because all three share the
// same shape: send a POST, the server answers with the new state, render that state. Guests
// are redirected to /login instead of silently failing.
export default function ReactionBar({
  postId,
  liked: initialLiked,
  bookmarked: initialBookmarked,
  likeCount = 0,
  bookmarkCount = 0,
  showBookmark = true,
  size = 'md',
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState({
    liked: Boolean(initialLiked),
    bookmarked: Boolean(initialBookmarked),
    likeCount,
    bookmarkCount,
  });
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  async function toggle(action) {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setBusy(action);
    setError(null);
    try {
      const { data } = await api.post(`/posts/${postId}/${action}`);
      // The server returns the authoritative post-reaction state, so the two buttons can
      // never drift apart after a double submit.
      setState((current) => ({ ...current, ...data }));
    } catch (toggleError) {
      setError(readErrorMessage(toggleError, 'That did not work. Please try again.'));
    } finally {
      setBusy(null);
    }
  }

  const className = `reaction-bar${size === 'sm' ? ' reaction-bar--sm' : ''}`;

  return (
    <div className={className}>
      <button
        type="button"
        className={`reaction${state.liked ? ' reaction--on' : ''}`}
        onClick={() => toggle('like')}
        disabled={busy !== null}
        aria-pressed={state.liked}
        title={isAuthenticated ? (state.liked ? 'Remove like' : 'Like this post') : 'Log in to like'}
      >
        <span aria-hidden="true">{state.liked ? '♥' : '♡'}</span>
        {state.likeCount > 0 ? <span>{state.likeCount}</span> : null}
        <span className="sr-only">
          {state.liked ? 'Unlike this post' : 'Like this post'}
        </span>
      </button>

      {showBookmark ? (
        <button
          type="button"
          className={`reaction${state.bookmarked ? ' reaction--on' : ''}`}
          onClick={() => toggle('bookmark')}
          disabled={busy !== null}
          aria-pressed={state.bookmarked}
          title={
            isAuthenticated
              ? state.bookmarked
                ? 'Remove from saved'
                : 'Save for later'
              : 'Log in to save'
          }
        >
          <span aria-hidden="true">{state.bookmarked ? '🔖' : '📑'}</span>
          <span className="sr-only">
            {state.bookmarked ? 'Remove from saved posts' : 'Save this post for later'}
          </span>
        </button>
      ) : null}

      {error ? (
        <span className="reaction__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}