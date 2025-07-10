// src/components/RequireAuth.tsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../config/auth'
import Spinner from '../../components/general/Spinner'

const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { session, loading } = useAuth()

  if (loading) {
    return <Spinner open={true}/>
  }
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Si hay sesión, renderiza los hijos (layout + rutas hijas)
  return children
}

export default RequireAuth
