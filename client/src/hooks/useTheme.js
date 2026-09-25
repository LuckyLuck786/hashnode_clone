import { useCallback, useState } from 'react';

// The initial theme is applied by the inline script in index.html before React loads.
export default function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch {
        // Storage can be unavailable (private mode). The theme still applies for this visit.
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
