// src/pages/perfil/PerfilPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth, useAuthRole } from '../../config/auth';
import { supabase } from '../../config/supabase';
import { useSearchParams } from 'react-router-dom';
import { notificationService } from '../../services/NotificationService';
import type { AppNotification } from '../../db/schema';
import { CreateNotificationModal } from '../../components/general/CreateNotificationModal';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const PerfilPage: React.FC = () => {
  const { session } = useAuth();
  const { roleObject } = useAuthRole();
  const user = session?.user;
  const [searchParams] = useSearchParams();
  
  const [tabValue, setTabValue] = useState(0);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Estados para notificaciones
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createNotificationOpen, setCreateNotificationOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    // Si viene con ?tab=notificaciones, ir a esa pestaña
    const tab = searchParams.get('tab');
    if (tab === 'notificaciones') {
      setTabValue(1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  // Cargar notificaciones cuando se abre la pestaña
  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const notifs = await notificationService.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 1) {
      loadNotifications();
    }
  }, [tabValue]);

  // Suscribirse a cambios en notificaciones
  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      if (tabValue === 1) {
        loadNotifications();
      }
    });
    return unsubscribe;
  }, [tabValue]);

  // Obtener iniciales
  const getInitials = (): string => {
    if (!user) return '?';
    const name = user.user_metadata?.full_name || user.email || '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
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

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (updateError) throw updateError;

      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Handlers para notificaciones
  const handleNotificationClick = async (notification: AppNotification) => {
    setSelectedNotification(notification);
    setDetailModalOpen(true);
    
    // Marcar como leída
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
    }
  };

  const handleDeleteNotification = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await notificationService.deleteNotification(id);
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
  };

  const handleClearAll = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todas las notificaciones?')) {
      await notificationService.clearAll();
    }
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

  const handleDownloadAttachment = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Mi Perfil
      </Typography>

      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Información Personal" />
            <Tab label="Notificaciones" />
          </Tabs>

          {/* Tab: Información Personal */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Avatar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: getAvatarColor(),
                    fontSize: '2rem',
                    fontWeight: 600,
                  }}
                >
                  {getInitials()}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {user?.user_metadata?.full_name || 'Usuario'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
              </Box>

              {success && <Alert severity="success">{success}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}

              {/* Formulario */}
              <TextField
                label="Nombre Completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                fullWidth
              />

              <TextField
                label="Email"
                value={user?.email || ''}
                disabled
                fullWidth
                helperText="El email no se puede cambiar"
              />

              <Button
                variant="contained"
                onClick={handleUpdateProfile}
                disabled={loading}
                sx={{ alignSelf: 'flex-start' }}
              >
                {loading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
              </Button>
            </Box>
          </TabPanel>

          {/* Tab: Notificaciones */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Header con acciones */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Mis Notificaciones ({notifications.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {roleObject && roleObject.jerarquia === 0 && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SendIcon />}
                      onClick={() => setCreateNotificationOpen(true)}
                      size="small"
                    >
                      Enviar Notificación
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<DoneAllIcon />}
                        onClick={handleMarkAllRead}
                        size="small"
                      >
                        Marcar todas leídas
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleClearAll}
                        size="small"
                      >
                        Eliminar todas
                      </Button>
                    </>
                  )}
                </Box>
              </Box>

              <Divider />

              {/* Lista de notificaciones */}
              {notifLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : notifications.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No tienes notificaciones
                  </Typography>
                </Box>
              ) : (
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                  {notifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          cursor: 'pointer',
                          bgcolor: notification.read ? 'transparent' : 'action.hover',
                          '&:hover': { bgcolor: 'action.selected' },
                          borderRadius: 1,
                          mb: 1,
                        }}
                        onClick={() => handleNotificationClick(notification)}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" fontWeight={notification.read ? 400 : 600}>
                                {notification.title}
                              </Typography>
                              {!notification.read && (
                                <Chip label="Nueva" color="primary" size="small" />
                              )}
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                                sx={{
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {notification.body}
                              </Typography>
                              <Typography component="span" variant="caption" color="text.secondary">
                                {new Date(notification.timestamp).toLocaleString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                              {notification.attachments && notification.attachments.length > 0 && (
                                <Chip
                                  icon={<AttachFileIcon />}
                                  label={`${notification.attachments.length} archivo(s)`}
                                  size="small"
                                  sx={{ ml: 1, mt: 0.5 }}
                                />
                              )}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Modal de detalle de notificación */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedNotification && getNotificationIcon(selectedNotification.type)}
            <Typography variant="h6">{selectedNotification?.title}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            {selectedNotification?.body}
          </Typography>

          {selectedNotification?.actionUrl && (
            <Box sx={{ mt: 2 }}>
              <Link href={selectedNotification.actionUrl} target="_blank" rel="noopener">
                Ir al enlace →
              </Link>
            </Box>
          )}

          {selectedNotification?.attachments && selectedNotification.attachments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Archivos adjuntos:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedNotification.attachments.map((url: string, idx: number) => {
                  const filename = url.split('/').pop() || `archivo_${idx + 1}`;
                  return (
                    <Chip
                      key={idx}
                      icon={<AttachFileIcon />}
                      label={filename}
                      onClick={() => handleDownloadAttachment(url)}
                      clickable
                      color="primary"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Recibida el{' '}
              {selectedNotification &&
                new Date(selectedNotification.timestamp).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailModalOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de crear notificación (solo para admins) */}
      {roleObject && roleObject.jerarquia === 0 && (
        <CreateNotificationModal
          open={createNotificationOpen}
          onClose={() => setCreateNotificationOpen(false)}
        />
      )}
    </Box>
  );
};

export default PerfilPage;
