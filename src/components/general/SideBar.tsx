// src/components/Sidebar.tsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { routesNav } from '../../config/routes';
import { logout } from '../../config/auth';
import { APPBAR_HEIGHT } from '../../config/variables';

interface SidebarProps {
  visible: boolean;
  role: string;
  nivel?: string;
  area?: string[];
  onClose: () => void;
}
const drawerWidth = 250;

const Sidebar: React.FC<SidebarProps> = ({ visible, role, nivel, area, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Roles que ven TODO
  const isPlataforma = ['Plataforma', 'Desarrollador'].includes(role);

  // Contratista ve por áreas, igual que usuario/gerencia/supervision
  const isContratista = role === 'Contratista';
  const isUsuarioOrSimilar = ['Usuario', 'Gerencia', 'Supervisión'].includes(nivel??"");

  // Si no visible, no renderiza nada
  if (!visible) return null;

  const areaIncludes = (routeArea: string | string[]) =>
    Array.isArray(routeArea)
      ? routeArea.some(a => (area || []).includes(a))
      : (area || []).includes(routeArea);

  const allowedRoutes = routesNav
    .filter(route => {
      // Siempre valida por rol permitido
      const byRole = !route.rol || route.rol.includes(role);

      // Si es Plataforma, muestra todo
      if (isPlataforma) return byRole;

      // Si es Contratista, Usuario, Gerencia o Supervisión y la ruta requiere área, filtra por área
      if ((isContratista || isUsuarioOrSimilar) && route.area && Array.isArray(area)) {
        return byRole && areaIncludes(route.area);
      }

      return byRole;
    })
    .map(route => ({
      ...route,
      children: route.children?.filter(child => {
        const byRole = !child.rol || child.rol.includes(role);

        if (isPlataforma) return byRole;

        if ((isContratista || isUsuarioOrSimilar) && child.area && Array.isArray(area)) {
          return byRole && areaIncludes(child.area);
        }

        return byRole;
      }),
    }));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Backdrop semitransparente */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 1050,
        }}
      />

      {/* Sidebar */}
      <aside
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: APPBAR_HEIGHT,
          height: `calc(100vh - ${APPBAR_HEIGHT})`,
          overflowY: 'auto',
          left: 0,
          width: `${drawerWidth}px`,
          backgroundColor: 'var(--primary-color)',
          color: '#fff',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1100,
        }}
      >
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
            {allowedRoutes.map((route, idx) => (
              <li key={idx} style={{ marginBottom: '1rem' }}>
                <Link
                  to={route.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#fff',
                    backgroundColor: location.pathname.replace(/\//g, '') === route.path
                      ? 'var(--secondary-color)'
                      : 'transparent',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    textDecoration: 'none',
                  }}
                >
                  {route.icon && <route.icon style={{ marginRight: '0.5rem' }} />}
                  {route.name}
                </Link>
                {route.children && route.children.length > 0 && (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, marginTop: '0.5rem' }}>
                    {route.children.map((child, cidx) => (
                      <li key={cidx} style={{ margin: '0.25rem 0' }}>
                        <Link
                          to={child.path}
                          style={{
                            display: 'block',
                            padding: '0.4rem 0.5rem',
                            paddingLeft: '2rem',
                            borderRadius: '4px',
                            color: '#fff',
                            backgroundColor: location.pathname.replace(/\//g, '') === child.path
                              ? 'var(--secondary-color)'
                              : 'transparent',
                            textDecoration: 'none',
                          }}
                        >
                          {child.icon && <child.icon fontSize="small" style={{ marginRight: '0.5rem' }} />}
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}

            <li style={{ marginTop: 'auto' }}>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  width: '100%',
                }}
              >
                <ExitToAppIcon fontSize="small" style={{ marginRight: '0.5rem' }} />
                Cerrar sesión
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
