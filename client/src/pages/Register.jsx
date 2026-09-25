import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { getErrorMessage } from '../api/axios.js';
import Field from '../components/ui/Field.jsx';

const MIN_PASSWORD_LENGTH = 8;

export default function Register() {
  useDocumentTitle('Create an account');
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user && !isSubmitting) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError('');
    try {
      await register({
        name: form.get('name').trim(),
        email: form.get('email'),
        password: form.get('password'),
      });
      navigate('/write', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="narrow">
      <header className="page-header">
        <h1 className="page-title">Create an account</h1>
        <p className="page-subtitle">Publish your first post in a couple of minutes.</p>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Field label="Name" hint="Shown next to your posts.">
          {(props) => (
            <input {...props} name="name" className="input" autoComplete="name" maxLength={60} required />
          )}
        </Field>
        <Field label="Email">
          {(props) => (
            <input {...props} name="email" type="email" className="input" autoComplete="email" required />
          )}
        </Field>
        <Field label="Password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
          {(props) => (
            <input
              {...props}
              name="password"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          )}
        </Field>
        <p className="field__hint">
          By creating an account you agree to the{' '}
          <Link to="/terms" className="text-link">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-link">
            Privacy Policy
          </Link>
          .
        </p>
        <button type="submit" className="btn btn--primary btn--block" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="form-footer">
        Already have an account?{' '}
        <Link to="/login" className="text-link">
          Log in
        </Link>
      </p>
    </div>
  );
}
