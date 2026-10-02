import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import useAuth from '../hooks/useAuth.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { readErrorMessage } from '../api/axios.js';

const MIN_PASSWORD_LENGTH = 8;

export default function Register() {
  useDocumentTitle('Create an account');
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (registerError) {
      setError(readErrorMessage(registerError, 'Could not create your account.'));
      setBusy(false);
    }
  }

  return (
    <main className="app-main app-main--narrow" id="main">
      <AuthForm
        title="Create an account"
        intro="Publish your first article in a few minutes."
        error={error}
        busy={busy}
        submitLabel="Create account"
        onSubmit={onSubmit}
        footer={{ text: 'Already registered?', to: '/login', linkLabel: 'Log in' }}
      >
        <label className="field">
          <span className="field__label">Name</span>
          <input
            className="input"
            name="name"
            autoComplete="name"
            required
            maxLength={60}
            value={form.name}
            onChange={update('name')}
          />
        </label>

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
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={form.password}
            onChange={update('password')}
          />
          <span className="field__hint">At least {MIN_PASSWORD_LENGTH} characters.</span>
        </label>
      </AuthForm>
    </main>
  );
}
