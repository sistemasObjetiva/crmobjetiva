// src/components/general/UserAvatarMenu.tsx
import React, { useState } from 'react';
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth, logout } from '../../config/auth';

export const UserAvatarMenu: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const user = session?.user;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path: string) => {
    handleClose();
    // Delay para que el menú se cierre suavemente
    setTimeout(() => {
      navigate(path);
    }, 100);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
  };

  // Obtener iniciales del nombre o email
  const getInitials = (): string => {
    if (!user) return '?';
    
    const name = user.user_metadata?.full_name || user.email || '';
    const parts = name.split(' ');

    if (parts.length >= 2) {
      // "Juan Pérez" → "JP"
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    
    // "juan@email.com" → "J"
    return name[0]?.toUpperCase() || '?';
  };

  // Color único basado en el email
  const getAvatarColor = (): string => {
    if (!user?.email) return '#1976d2';
    
    const hash = user.email
      .split('')
      .reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 50%)`;
  };

  const getUserName = (): string => {
    return user?.user_metadata?.full_name || user?.email || 'Usuario';
  };

  const getUserEmail = (): string => {
    return user?.email || '';
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 1 }}
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: getAvatarColor(),
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {getInitials()}
        </Avatar>
      </IconButton>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 220,
            mt: 1.5,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header con info del usuario */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {getUserName()}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {getUserEmail()}
          </Typography>
        </Box>

        <Divider />

        {/* Opciones del menú */}
        <MenuItem onClick={() => handleMenuItemClick('/perfil')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mi Perfil</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleMenuItemClick('/perfil?tab=notificaciones')}>
          <ListItemIcon>
            <NotificationsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Notificaciones</ListItemText>
        </MenuItem>

        <Divider />

        {/* Cerrar sesión */}
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Cerrar Sesión</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
