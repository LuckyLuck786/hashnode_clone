import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import useTheme from '../../hooks/useTheme.js';
import { SITE_NAME } from '../../config.js';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  // The phone menu remembers which page it was opened on, so it closes itself on navigation.
  const [menuOpenOn, setMenuOpenOn] = useState(null);
  const isMenuOpen = menuOpenOn === location.pathname;

  function handleLogout() {
    logout();
    navigate('/');
  }

  const navLink = (to, label) => (
    <NavLink to={to} end className="site-nav__link">
      {label}
    </NavLink>
  );

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="wordmark">
          {SITE_NAME}
        </Link>

        <button
          type="button"
          className="btn btn--small menu-toggle"
          aria-expanded={isMenuOpen}
          aria-controls="site-nav"
          onClick={() => setMenuOpenOn(isMenuOpen ? null : location.pathname)}
        >
          {isMenuOpen ? 'Close' : 'Menu'}
        </button>

        <nav id="site-nav" className="site-nav" data-open={isMenuOpen} aria-label="Main">
          {navLink('/', 'Feed')}
          {navLink('/tags', 'Tags')}
          {user ? (
            <>
              {navLink('/dashboard', 'Dashboard')}
              {navLink(`/u/${user._id}`, 'Profile')}
              {navLink('/settings', 'Settings')}
              <button type="button" className="link-button" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            navLink('/login', 'Log in')
          )}
          <button type="button" className="link-button" onClick={toggleTheme}>
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>
          <Link to={user ? '/write' : '/register'} className="btn btn--primary btn--small">
            {user ? 'Write' : 'Sign up'}
          </Link>
        </nav>
      </div>
    </header>
  );
}
