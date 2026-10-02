import { Link, NavLink, useNavigate } from 'react-router-dom';
import Avatar from '../Avatar.jsx';
import ThemeToggle from '../ThemeToggle.jsx';
import useAuth from '../../hooks/useAuth.js';

export default function Navbar() {
  const { isAuthenticated, user, status, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="masthead">
      <div className="masthead__inner">
        <Link className="masthead__brand" to="/">
          monospace
        </Link>

        <nav className="masthead__nav" aria-label="Main">
          <NavLink className="masthead__link" to="/" end>
            Feed
          </NavLink>
          <NavLink className="masthead__link" to="/tags">
            Tags
          </NavLink>

          {status === 'loading' ? null : isAuthenticated ? (
            <>
              <NavLink className="masthead__link" to="/dashboard">
                Dashboard
              </NavLink>
              <NavLink className="masthead__link" to="/bookmarks">
                Saved
              </NavLink>
              <Link className="button" to="/editor/new">
                Write
              </Link>
              <span className="masthead__user">
                <Link className="masthead__link" to="/settings" title="Profile settings">
                  <Avatar user={user} />
                  <span className="sr-only">Profile settings</span>
                </Link>
                <ThemeToggle />
                <button type="button" className="button button--quiet" onClick={onLogout}>
                  Log out
                </button>
              </span>
            </>
          ) : (
            <span className="masthead__user">
              <ThemeToggle />
              <NavLink className="masthead__link" to="/login">
                Log in
              </NavLink>
              <Link className="button" to="/register">
                Sign up
              </Link>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
