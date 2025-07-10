import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthRole } from '../auth';

interface ProtectedRouteProps {
  allowedRoles: string[];
  projectId?: string;
  areaName?: string;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const {
    role,
  } = useAuthRole();


  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/inicio" replace />;
  }
  switch (role) {
    case 'Desarrollador':
      return <>{children}</>;

    case 'Gerencia':
    case 'Supervision':
     
      return <>{children}</>;

    case 'Contratista':
      
      return <>{children}</>;

    default:
      // Otros roles (p. ej. Plataforma)
      return <>{children}</>;
  }
};

export default ProtectedRoute;
