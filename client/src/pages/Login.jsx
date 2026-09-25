import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { getErrorMessage } from '../api/axios.js';
import Field from '../components/ui/Field.jsx';

export default function Login() {
  useDocumentTitle('Log in');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname ?? '/dashboard';
  if (user && !isSubmitting) return <Navigate to={redirectTo} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError('');
    try {
      await login({ email: form.get('email'), password: form.get('password') });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="narrow">
      <header className="page-header">
        <h1 className="page-title">Log in</h1>
        <p className="page-subtitle">Welcome back. Pick up where you left off.</p>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Field label="Email">
          {(props) => (
            <input
              {...props}
              name="email"
              type="email"
              className="input"
              autoComplete="email"
              required
            />
          )}
        </Field>
        <Field label="Password">
          {(props) => (
            <input
              {...props}
              name="password"
              type="password"
              className="input"
              autoComplete="current-password"
              required
            />
          )}
        </Field>
        <button type="submit" className="btn btn--primary btn--block" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="form-footer">
        New here?{' '}
        <Link to="/register" className="text-link">
          Create an account
        </Link>
        . To look around first, use the demo account <code>demo@example.com</code> with the password{' '}
        <code>demo12345</code>.
      </p>
    </div>
  );
}
