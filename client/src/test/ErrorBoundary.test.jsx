import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary.jsx';

// A component that throws on render, which is the case an error boundary exists for.
function Boom({ shouldThrow = true }) {
  if (shouldThrow) throw new Error('kaboom');
  return <p>Recovered content</p>;
}

// React logs caught errors to console.error; silenced so test output stays readable.
function renderWithBoundary(ui) {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  return render(<ErrorBoundary>{ui}</ErrorBoundary>);
}

describe('ErrorBoundary', () => {
  test('renders children when nothing throws', () => {
    renderWithBoundary(<Boom shouldThrow={false} />);
    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });

  test('shows a recoverable message instead of a blank page', () => {
    renderWithBoundary(<Boom />);

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.queryByText('Recovered content')).not.toBeInTheDocument();
  });

  test('recovers when the child stops throwing', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    // Re-render with a prop the test controls, so "Try again" has something to recover to.
    function Host() {
      return <Boom shouldThrow={shouldThrow} />;
    }

    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Host />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });

  test('offers a sign-in fix when the failure looks like an expired session', () => {
    function TokenBoom() {
      throw new Error('Your session has expired');
    }

    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <TokenBoom />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: /sign in again/i })).toBeInTheDocument();
  });

  test('shows the stack trace in development but never in production', () => {
    vi.stubEnv('DEV', true);
    const devRender = renderWithBoundary(<Boom />);
    expect(document.querySelector('.crash-detail')).not.toBeNull();
    devRender.unmount();

    // Production builds must not leak internals to a visitor.
    vi.stubEnv('DEV', false);
    renderWithBoundary(<Boom />);
    expect(document.querySelector('.crash-detail')).toBeNull();
    vi.unstubAllEnvs();
  });
});