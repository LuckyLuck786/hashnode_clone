import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { readErrorMessage } from '../api/axios.js';
import Avatar from '../components/Avatar.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import useAuth from '../hooks/useAuth.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const MAX_BIO_LENGTH = 200;

export default function ProfileSettings() {
  useDocumentTitle('Profile settings');
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio ?? '',
    avatarUrl: user.avatarUrl ?? '',
  });
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (event) => {
      setSaved(false);
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.put('/users/me', form);
      setUser(data.user);
      setSaved(true);
    } catch (saveError) {
      setError(readErrorMessage(saveError, 'Could not save your profile.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-main app-main--narrow" id="main">
      <div className="page-head">
        <h1 className="page-head__title">Profile settings</h1>
        <p className="page-head__meta">
          This is what readers see on <Link to={`/profile/${user._id}`}>your public profile</Link>.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate>
        {error ? (
          <div style={{ marginBottom: '1rem' }}>
            <ErrorMessage>{error}</ErrorMessage>
          </div>
        ) : null}
        {saved ? (
          <p className="notice notice--success" style={{ marginBottom: '1rem' }} role="status">
            Profile saved.
          </p>
        ) : null}

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Avatar user={{ ...user, ...form }} size="lg" />
          <p className="page-head__meta" style={{ margin: 0 }}>
            Your avatar comes from the image URL below.
          </p>
        </div>

        <label className="field">
          <span className="field__label">Display name</span>
          <input
            className="input"
            required
            maxLength={60}
            value={form.name}
            onChange={update('name')}
          />
        </label>

        <label className="field">
          <span className="field__label">Short bio</span>
          <textarea
            className="input"
            rows={3}
            maxLength={MAX_BIO_LENGTH}
            value={form.bio}
            onChange={update('bio')}
            placeholder="One or two lines about what you work on."
          />
          <span className="field__hint">
            {form.bio.length} of {MAX_BIO_LENGTH} characters.
          </span>
        </label>

        <label className="field">
          <span className="field__label">Avatar URL</span>
          <input
            className="input"
            value={form.avatarUrl}
            onChange={update('avatarUrl')}
            placeholder="https://"
          />
          <span className="field__hint">Leave empty to use your initial instead.</span>
        </label>

        <button type="submit" className="button button--primary" disabled={busy}>
          {busy ? <LoadingSpinner label="Saving" /> : null}
          Save changes
        </button>
      </form>
    </main>
  );
}
