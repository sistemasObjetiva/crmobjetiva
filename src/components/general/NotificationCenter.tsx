// src/components/general/NotificationCenter.tsx
import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle,
  Error as ErrorIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { notificationService } from '../../services/NotificationService';
import { useNavigate } from 'react-router-dom';
import type { AppNotification } from '../../db/schema';

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    const notifs = await notificationService.getNotifications();
    const count = await notificationService.getUnreadCount();
    setNotifications(notifs);
    setUnreadCount(count);
  };

  useEffect(() => {
    loadNotifications();
    const unsubscribe = notificationService.subscribe(() => {
      loadNotifications();
    });
    return unsubscribe;
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    // Marcar como leída
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
    }

    // Navegar si tiene URL
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      handleClose();
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
  };

  const handleClearAll = async () => {
    await notificationService.clearAll();
    handleClose();
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await notificationService.deleteNotification(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sync':
        return <CheckCircle color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'business':
        return <BusinessIcon color="primary" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'sync':
        return 'success';
      case 'error':
        return 'error';
      case 'business':
        return 'primary';
      default:
        return 'info';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)}h`;
    return `Hace ${Math.floor(diffMins / 1440)}d`;
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton onClick={handleClick} color="inherit" size="large">
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Notificaciones {unreadCount > 0 && `(${unreadCount})`}
          </Typography>
          <Box>
            {unreadCount > 0 && (
              <Tooltip title="Marcar todas como leídas">
                <IconButton size="small" onClick={handleMarkAllRead}>
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {notifications.length > 0 && (
              <Tooltip title="Limpiar todas">
                <IconButton size="small" onClick={handleClearAll} color="error">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              No hay notificaciones
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 450, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={notification.read ? 'normal' : 'bold'}>
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Chip
                            label="NUEVO"
                            size="small"
                            color={getNotificationColor(notification.type) as any}
                            sx={{ height: 18, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {notification.body}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {formatTimestamp(notification.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                  <Tooltip title="Eliminar">
                    <IconButton
                      size="small"
                      onClick={(e) => handleDelete(notification.id, e)}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}

        {notifications.length > 0 && (
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Button size="small" onClick={handleClose}>
              Cerrar
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
};
