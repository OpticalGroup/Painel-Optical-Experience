import { ReactNode, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'operator' | 'sales' | 'viewer';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userRole, isApproved, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Redirect to access-pending if user is not approved
  if (!isApproved) {
    return <Navigate to="/access-pending" replace />;
  }

  // Check role if required
  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
