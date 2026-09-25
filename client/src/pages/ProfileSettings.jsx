import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateMyProfile } from '../api/users.js';
import { getErrorMessage } from '../api/axios.js';
import useAuth from '../hooks/useAuth.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import Avatar from '../components/ui/Avatar.jsx';
import Field from '../components/ui/Field.jsx';

const BIO_MAX_LENGTH = 200;

export default function ProfileSettings() {
  useDocumentTitle('Profile settings');
  const { user, setUser } = useAuth();
  const [values, setValues] = useState({
    name: user.name,
    bio: user.bio ?? '',
    avatarUrl: user.avatarUrl ?? '',
  });
  const [status, setStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [error, setError] = useState('');

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setStatus('idle');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('saving');
    setError('');
    try {
      setUser(await updateMyProfile({ ...values, name: values.name.trim() }));
      setStatus('saved');
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus('idle');
    }
  }

  return (
    <div className="narrow">
      <header className="page-header">
        <h1 className="page-title">Profile settings</h1>
        <p className="page-subtitle">
          This is what readers see on{' '}
          <Link to={`/u/${user._id}`} className="text-link">
            your profile
          </Link>{' '}
          and under your posts.
        </p>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Field label="Name">
          {(props) => (
            <input
              {...props}
              className="input"
              value={values.name}
              maxLength={60}
              required
              onChange={(event) => setField('name', event.target.value)}
            />
          )}
        </Field>
        <Field label="Bio" hint={`${values.bio.length}/${BIO_MAX_LENGTH} characters`}>
          {(props) => (
            <textarea
              {...props}
              className="textarea"
              rows={3}
              value={values.bio}
              maxLength={BIO_MAX_LENGTH}
              onChange={(event) => setField('bio', event.target.value)}
            />
          )}
        </Field>
        <Field label="Avatar URL" hint="Optional. Leave empty to show your initials.">
          {(props) => (
            <div className="inline-row">
              <Avatar user={{ ...user, ...values }} size={40} />
              <input
                {...props}
                type="url"
                className="input"
                placeholder="https://"
                value={values.avatarUrl}
                onChange={(event) => setField('avatarUrl', event.target.value)}
              />
            </div>
          )}
        </Field>
        <div className="inline-row">
          <button type="submit" className="btn btn--primary" disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving...' : 'Save changes'}
          </button>
          {status === 'saved' && (
            <p className="form-success" role="status">
              Profile updated.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
