import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/user.types';
import { roleRedirect } from '../utils/roleRedirect';

export default function ProtectedRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== 'SUPER_ADMIN' && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleRedirect(user.role)} replace />;
  }
  return <Outlet/>;
}
