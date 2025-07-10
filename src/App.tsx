// src/App.tsx
import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/general/Layout';
import LoginPage from './pages/LoginPage';
import RequireAuth from './config/context/RequireAuth';
import RequireRole from './config/context/RequireRole';
import { routes } from './config/routes';
import { useAuthRole } from './config/auth';
import Spinner from './components/general/Spinner';
import ResetPasswordPage from './pages/ResetPasswordPage';
import "./styles/global.css";
import { StatusChipProvider } from './config/context/useStatusChip';
function App() {
  const {role,loading} = useAuthRole()
  if (loading) {
    return <Spinner open={loading} />;
  }
  return (
    <Router>
      <Suspense fallback={<Spinner open={true} />}>
        <StatusChipProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset" element={<ResetPasswordPage />} />

              <Route
                element={
                  <RequireAuth>
                      <Layout />
                  </RequireAuth>
                }
              >

                {routes.map(ruta => {
                  const Element = ruta.element;
                  const allowedRoles = ruta.rol?.toString().split(',').map(x=>x.trim()) ?? [];
                  const wrapped = ruta.rol
                    ? <RequireRole allowed={allowedRoles} role={role!}><Element/></RequireRole>
                    : <Element/>;

                  // Si tiene hijos los registras como rutas anidadas
                  if (ruta.children) {
                    return (
                      <Route key={ruta.path} path={ruta.path.replace(/^\//, '')} element={wrapped}>
                        {ruta.children.map(child => {
                          const ChildEl = child.element;
                          const childAllowed = child.rol?.toString().split(',').map(x=>x.trim()) ?? [];
                          const childWrapped = child.rol
                            ? <RequireRole allowed={childAllowed } role={role!}><ChildEl/></RequireRole>
                            : <ChildEl/>;
                          return (
                            <Route
                              key={child.path}
                              path={child.path.replace(/^\//, '')}
                              element={childWrapped}
                            />
                          );
                        })}
                      </Route>
                    );
                  }

                  // Si no tiene hijos, ruta directa
                  return (
                    <Route
                      key={ruta.path}
                      path={ruta.path.replace(/^\//, '')}
                      element={wrapped}
                    />
                  );
                })}

              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </StatusChipProvider>
      </Suspense>
    </Router>
  );
}

export default App;
