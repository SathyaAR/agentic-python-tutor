import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** Redirects to /login when there's no session (frontend-spec.md §8). */
export function ProtectedRoute() {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Inverse guard for /login and /signup: an authenticated user goes Home. */
export function PublicOnlyRoute() {
  const { token } = useAuth();
  if (token) return <Navigate to="/curriculum" replace />;
  return <Outlet />;
}
