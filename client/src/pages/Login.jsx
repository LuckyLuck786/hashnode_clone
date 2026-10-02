import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import useAuth from '../hooks/useAuth.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { readErrorMessage } from '../api/axios.js';

export default function Login() {
  useDocumentTitle('Log in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(form);
      // Return the user to the protected page that sent them here.
      navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true });
    } catch (loginError) {
      setError(readErrorMessage(loginError, 'Could not log you in.'));
      setBusy(false);
    }
  }

  return (
    <main className="app-main app-main--narrow" id="main">
      <AuthForm
        title="Log in"
        intro="Pick up where you left off."
        error={error}
        busy={busy}
        submitLabel="Log in"
        onSubmit={onSubmit}
        footer={{ text: 'No account yet?', to: '/register', linkLabel: 'Create one' }}
      >
        <label className="field">
          <span className="field__label">Email</span>
          <input
            className="input"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update('email')}
          />
        </label>

        <label className="field">
          <span className="field__label">Password</span>
          <input
            className="input"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={update('password')}
          />
        </label>
      </AuthForm>
    </main>
  );
}
