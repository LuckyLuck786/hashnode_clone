import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import Skeleton from '../ui/Skeleton.jsx';

// Sends signed-out visitors to the login page and brings them back afterwards.
export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div aria-busy="true">
        <Skeleton width="40%" height={32} />
        <Skeleton height={16} style={{ marginTop: 20 }} />
        <Skeleton width="80%" height={16} style={{ marginTop: 10 }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}
