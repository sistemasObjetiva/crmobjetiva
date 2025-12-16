// src/components/general/Layout.tsx
import React, {  useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  Box,
  AppBar,
  Toolbar,
  useTheme,
} from '@mui/material'
import Sidebar from './SideBar'
import HamburguerMenu from './HamburguerMenu'
import { useAuthRole } from '../../config/auth'
import { routesNav } from '../../config/routes'
import type { RouteConfig } from '../../config/routes'
import { APPBAR_HEIGHT } from '../../config/variables'
import FooterContainer from './Footer'
import { EnvironmentBadge } from '../dev/EnvironmentBadge'
import { OfflineStatusBadge } from './OfflineStatusBadge'
import { NotificationCenter } from './NotificationCenter'
import { CreateNotificationModal } from './CreateNotificationModal'
import { UserAvatarMenu } from './UserAvatarMenu'
import { IconButton, Tooltip } from '@mui/material'
import { AddAlert as AddAlertIcon } from '@mui/icons-material'

const drawerWidth = 250


const Layout: React.FC = () => {
  
  const { role, roleObject, loading } = useAuthRole()
  const theme = useTheme()
  const location = useLocation()



  const [sidebarVisible, setSidebarOpen] = useState(false)
  const [createNotificationOpen, setCreateNotificationOpen] = useState(false)

  if (loading) return null

  const toggleSidebar = () => {
    setSidebarOpen(open => !open)
  }

  // Encontrar la ruta de navegación actual
  const pathKey = location.pathname.replace(/^\//, '')
  let currentRoute: RouteConfig | undefined =
    routesNav.find(r => r.path === pathKey)
  if (!currentRoute) {
    // Checar en children
    currentRoute = routesNav
      .flatMap(r => r.children || [])
      .find(c => c.path === pathKey)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh',width: '100wh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, background: 'var(--primary-color)' ,height: `${Number(APPBAR_HEIGHT) - 10}px`}}>
        <Toolbar sx={{ minHeight: APPBAR_HEIGHT }}>
          <HamburguerMenu onToggle={toggleSidebar} />
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Botón crear notificación (solo para jerarquía 0) */}
          {roleObject && roleObject.jerarquia === 0 && (
            <Tooltip title="Nueva notificación">
              <IconButton 
                color="inherit" 
                size="large"
                onClick={() => setCreateNotificationOpen(true)}
              >
                <AddAlertIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <NotificationCenter />
          <OfflineStatusBadge />
          <EnvironmentBadge />
          <UserAvatarMenu />
        </Toolbar>
      </AppBar>
      
      {/* Modal de crear notificación */}
      <CreateNotificationModal 
        open={createNotificationOpen}
        onClose={() => setCreateNotificationOpen(false)}
      />
      
      {sidebarVisible && <Sidebar visible={true} role={role!} onClose={()=>setSidebarOpen(false)} />}

      <Box
        component="main"
        sx={{
          width: '100vw',
          flexGrow: 1,
          p: 3,
          mt: 10,
          mb: 10,
          overflow: 'auto',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
      <EnvironmentBadge />
      <Outlet />
    </Box>

      <Box
        component="footer"
        sx={{
          p: 2,
          borderTop: '1px solid #ddd',
          ml: {
            xs: 0,
            sm: sidebarVisible ? `${drawerWidth}px` : 0,
          },
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        <FooterContainer />
      </Box>
    </Box>
  )
}

export default Layout
