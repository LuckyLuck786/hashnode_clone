import { Component } from 'react';

// React unmounts the whole tree when a render throws, which leaves a visitor staring at a
// blank white page with no way back. This catches that, shows something readable, and
// offers a way to recover without a full reload.
//
// Only render errors are caught here. Errors thrown inside event handlers or async code
// are handled by useRequest and readErrorMessage, which turn them into visible messages.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Real deployments would forward this to Sentry or similar; console keeps the
    // component boundary of the trace visible during development.
    console.error('Render error caught by ErrorBoundary:', error, info?.componentStack);
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    // Clearing localStorage drops the JWT, which is the usual cause: a stale token from
    // before a schema change can make an authenticated page throw on every render.
    const isAuthProblem = /token|session|auth/i.test(error.message ?? '');

    return (
      <main className="app-main app-main--narrow" id="main">
        <div className="page-head">
          <h1 className="page-head__title">Something went wrong</h1>
          <p className="page-head__meta">
            This page hit an unexpected error. The rest of the site is still running.
          </p>
        </div>

        {isAuthProblem ? (
          <p className="notice">
            Your session may have expired.{' '}
            <button
              type="button"
              className="button"
              onClick={() => {
                localStorage.removeItem('monospace.token');
                window.location.assign('/login');
              }}
            >
              Sign in again
            </button>
          </p>
        ) : null}

        <div className="button-row">
          <button type="button" className="button" onClick={this.reset}>
            Try again
          </button>
          <button
            type="button"
            className="button button--quiet"
            onClick={() => window.location.assign('/')}
          >
            Back to the feed
          </button>
        </div>

        {import.meta.env.DEV ? (
          <pre className="crash-detail">{String(error?.stack ?? error)}</pre>
        ) : null}
      </main>
    );
  }
}