import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, profile, loading } = useSupabaseAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return <Navigate to="/admin/auth" replace />;
  }

  // Only allow admin and active columnists
  if (profile.role !== 'admin' && (!profile.is_active || profile.role !== 'colunista')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;