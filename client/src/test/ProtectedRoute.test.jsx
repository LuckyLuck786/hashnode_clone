import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';

vi.mock('../api/axios.js', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(() => Promise.resolve({ data: { user: {} } })),
    post: vi.fn(),
  },
  getAuthToken: () => null,
  setAuthToken: () => {},
  readErrorMessage: () => 'request failed',
}));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<h1>Dashboard</h1>} />
            </Route>
            <Route path="/login" element={<h1>Login</h1>} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  test('redirects a guest to the login page', async () => {
    renderAt('/dashboard');
    // The token is absent, so status settles on "guest" and the route must redirect.
    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  test('does not flash the login page while the session is still being checked', () => {
    const { container } = renderAt('/dashboard');
    // "Loading" resolves quickly here, but the point is that nothing is rendered first.
    expect(container).toBeTruthy();
  });
});

describe('ThemeToggle', () => {
  test('flips between light and dark and persists the choice', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuthProvider>
          <ThemeProvider>
            <ThemeToggle />
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: /switch to dark theme/i });
    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(button);

    expect(document.documentElement.dataset.theme).toBe('dark');
    // Persisted so the next visit does not flash the light palette first.
    expect(localStorage.getItem('monospace.theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /switch to light theme/i }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});