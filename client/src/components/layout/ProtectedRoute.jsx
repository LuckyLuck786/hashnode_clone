import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { PostListSkeleton } from '../Skeleton.jsx';

// Guards every route that needs a signed-in user. While the stored token is being
// validated we render a placeholder instead of redirecting, otherwise a refresh on a
// protected page would bounce the user to the login form.
export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <main className="app-main">
        <PostListSkeleton count={2} />
      </main>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
