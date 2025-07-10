// src/components/general/RequireRole.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface RequireRoleProps {
  allowed: string[];
  children: React.ReactNode;
  role:string;
}

const RequireRole: React.FC<RequireRoleProps> = ({ allowed, children,role }) => {
  if (!role || !allowed.includes(role)) {
    return <Navigate to="/inicio" replace />;
  }

  return <>{children}</>;
};

export default RequireRole;
