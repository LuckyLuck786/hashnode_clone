import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// BrowserRouter keeps the scroll position between pages. Start each new page at the top.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
