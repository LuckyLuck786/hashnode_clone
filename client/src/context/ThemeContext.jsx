import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios.js';
import useAuth from '../hooks/useAuth.js';

export const THEME_KEY = 'monospace.theme';

const ThemeContext = createContext(null);

// readStoredTheme is also imported by main.jsx, which applies the attribute before React
// mounts so a dark-mode reader never sees a flash of the light palette.
export function readStoredTheme() {
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({ children }) {
  const { user, isAuthenticated, setUser } = useAuth();
  // The stored value is the immediate source of truth so the first paint is correct;
  // the server copy only wins once the session has been resolved.
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Once we know who is signed in, their saved preference wins over this device's value.
  useEffect(() => {
    if (!isAuthenticated || !user?.theme || user.theme === theme) return;
    setThemeState(user.theme);
  }, [isAuthenticated, user?.theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const setTheme = useCallback(
    (next) => {
      setThemeState(next);
      if (!isAuthenticated) return;

      // Persisted per account so the preference follows the reader to another device.
      api
        .put('/users/me', { theme: next })
        .then(({ data }) => setUser(data.user))
        .catch(() => {
          // A failed sync only costs the preference on this device; the theme still applies.
        });
    },
    [isAuthenticated, setUser],
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, isDark: theme === 'dark' }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider');
  return context;
}