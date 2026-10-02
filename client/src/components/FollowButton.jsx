import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { readErrorMessage } from '../api/axios.js';
import useAuth from '../hooks/useAuth.js';

export default function FollowButton({ userId, initialFollowing, onChange }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [following, setFollowing] = useState(Boolean(initialFollowing));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Your own profile has no follow button at all — the page shows "Edit profile" instead.
  if (!isAuthenticated) {
    return (
      <button type="button" className="button" onClick={() => navigate('/login')}>
        Log in to follow
      </button>
    );
  }
  if (userId === user?._id) return null;

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post(`/users/${userId}/follow`);
      setFollowing(data.following);
      onChange?.(data);
    } catch (toggleError) {
      setError(readErrorMessage(toggleError, 'Could not update that right now.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="follow-button">
      <button
        type="button"
        className={`button${following ? '' : ' button--primary'}`}
        onClick={toggle}
        disabled={busy}
        aria-pressed={following}
      >
        {busy ? '…' : following ? 'Following' : 'Follow'}
      </button>
      {error ? (
        <span className="notice notice--error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}