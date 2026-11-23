import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/user';
import { Loading } from '../components/common/Loading';

interface ProtectedRouteProps {
  /** If set, only these roles may access child routes. */
  allowedRoles?: UserRole[];
}

/**
 * Route guard component.
 * - Displays loading indicator while checking local session.
 * - Redirects unauthenticated users to /login.
 * - Redirects users without an allowed role to their own dashboard.
 * - Renders child routes via <Outlet /> when access is granted.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading message="Verifying session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <Outlet />;
};


