import { Link } from 'react-router-dom';
import ErrorMessage from './ErrorMessage.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

// Shared shell for the Login and Register pages: same heading, error slot and submit row.
export default function AuthForm({
  title,
  intro,
  error,
  busy,
  submitLabel,
  footer,
  onSubmit,
  children,
}) {
  return (
    <div>
      <div className="page-head">
        <h1 className="page-head__title">{title}</h1>
        <p className="page-head__meta">{intro}</p>
      </div>

      <form onSubmit={onSubmit} noValidate>
        {error ? (
          <div style={{ marginBottom: '1rem' }}>
            <ErrorMessage>{error}</ErrorMessage>
          </div>
        ) : null}

        {children}

        <button type="submit" className="button button--primary button--block" disabled={busy}>
          {busy ? <LoadingSpinner label="Submitting" /> : null}
          {submitLabel}
        </button>
      </form>

      <p className="page-head__meta" style={{ marginTop: '1.5rem' }}>
        {footer.text} <Link to={footer.to}>{footer.linkLabel}</Link>
      </p>
    </div>
  );
}
