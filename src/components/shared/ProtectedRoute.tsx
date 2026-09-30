import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { LoadingState } from '@/components/shared/LoadingState';

export function ProtectedRoute({ children, requireRole }: { children: ReactNode; requireRole?: 'student' | 'teacher' }) {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState className="min-h-screen" />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requireRole && role !== requireRole) {
    return <Navigate to={role === 'teacher' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }
  return <>{children}</>;
}
