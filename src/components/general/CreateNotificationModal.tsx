// src/components/general/CreateNotificationModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { supabase } from '../../config/supabase';
import { notificationService } from '../../services/NotificationService';
import type { User } from '../../config/types';

interface CreateNotificationModalProps {
  open: boolean;
  onClose: () => void;
}

interface FileAttachment {
  file: File;
  name: string;
  size: number;
}

export const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({ open, onClose }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<'business' | 'system' | 'error'>('business');
  const [recipients, setRecipients] = useState<'all' | 'specific'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Cargar usuarios
  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nombre, email, role, estatus')
        .eq('estatus', 'activo')
        .order('nombre');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Error al cargar usuarios');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: FileAttachment[] = Array.from(files).map(file => ({
      file,
      name: file.name,
      size: file.size,
    }));

    setAttachments([...attachments, ...newAttachments]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const uploadAttachments = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const attachment of attachments) {
      const fileName = `notifications/${Date.now()}_${attachment.file.name}`;
      
      const { error } = await supabase.storage
        .from('documentos')
        .upload(fileName, attachment.file);

      if (error) throw error;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Título y mensaje son obligatorios');
      return;
    }

    if (recipients === 'specific' && selectedUsers.length === 0) {
      setError('Selecciona al menos un usuario');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Subir archivos adjuntos
      let attachmentUrls: string[] = [];
      if (attachments.length > 0) {
        attachmentUrls = await uploadAttachments();
      }

      // Determinar destinatarios
      const targetUsers = recipients === 'all' 
        ? users.map(u => u.id)
        : selectedUsers;

      // Crear notificación en Supabase (tabla custom_notifications)
      const { error: dbError } = await supabase
        .from('custom_notifications')
        .insert({
          title,
          body,
          type,
          recipients: targetUsers,
          attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (dbError) throw dbError;

      // Enviar notificación (se mostrará a todos los destinatarios)
      await notificationService.show({
        title: `📢 ${title}`,
        body,
        type,
        icon: '📢',
        data: {
          attachments: attachmentUrls,
          customNotification: true,
          recipients: targetUsers,
        },
      });

      // Limpiar y cerrar
      handleClose();
      
      // Notificar éxito
      await notificationService.show({
        title: '✅ Notificación enviada',
        body: `Enviada a ${targetUsers.length} usuario${targetUsers.length > 1 ? 's' : ''}`,
        type: 'system',
        icon: '✅',
      });
    } catch (err) {
      console.error('Error sending notification:', err);
      setError('Error al enviar notificación');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setBody('');
    setType('business');
    setRecipients('all');
    setSelectedUsers([]);
    setAttachments([]);
    setError('');
    setUserFilter('');
    onClose();
  };

  const filteredUsers = users.filter(user =>
    user.nombre.toLowerCase().includes(userFilter.toLowerCase()) ||
    user.email.toLowerCase().includes(userFilter.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">📢 Nueva Notificación</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Título */}
        <TextField
          fullWidth
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
          required
        />

        {/* Mensaje */}
        <TextField
          fullWidth
          label="Mensaje"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          multiline
          rows={4}
          sx={{ mb: 2 }}
          required
        />

        {/* Tipo */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Tipo</InputLabel>
          <Select value={type} onChange={(e) => setType(e.target.value as any)} label="Tipo">
            <MenuItem value="business">📊 Negocio</MenuItem>
            <MenuItem value="system">ℹ️ Sistema</MenuItem>
            <MenuItem value="error">⚠️ Importante</MenuItem>
          </Select>
        </FormControl>

        {/* Destinatarios */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Destinatarios</InputLabel>
          <Select
            value={recipients}
            onChange={(e) => setRecipients(e.target.value as 'all' | 'specific')}
            label="Destinatarios"
          >
            <MenuItem value="all">👥 Todos los usuarios</MenuItem>
            <MenuItem value="specific">👤 Usuarios específicos</MenuItem>
          </Select>
        </FormControl>

        {/* Selector de usuarios específicos */}
        {recipients === 'specific' && (
          <Box sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar usuario..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              sx={{ mb: 1 }}
            />
            
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Seleccionados: {selectedUsers.length} / {users.length}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 200, overflow: 'auto' }}>
              {filteredUsers.map(user => (
                <Chip
                  key={user.id}
                  label={user.nombre}
                  onClick={() => handleUserToggle(user.id)}
                  color={selectedUsers.includes(user.id) ? 'primary' : 'default'}
                  variant={selectedUsers.includes(user.id) ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Archivos adjuntos */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AttachFileIcon />}
            component="label"
            fullWidth
          >
            Adjuntar archivos
            <input
              type="file"
              hidden
              multiple
              onChange={handleFileSelect}
            />
          </Button>

          {attachments.length > 0 && (
            <List dense sx={{ mt: 1 }}>
              {attachments.map((attachment, index) => (
                <ListItem key={index} sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 0.5 }}>
                  <ListItemText
                    primary={attachment.name}
                    secondary={formatFileSize(attachment.size)}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Resumen */}
        <Alert severity="info" icon={false}>
          <Typography variant="body2">
            📊 <strong>Destinatarios:</strong>{' '}
            {recipients === 'all'
              ? `Todos (${users.length} usuarios)`
              : `${selectedUsers.length} usuario${selectedUsers.length !== 1 ? 's' : ''} seleccionado${selectedUsers.length !== 1 ? 's' : ''}`}
          </Typography>
          {attachments.length > 0 && (
            <Typography variant="body2">
              📎 <strong>Archivos:</strong> {attachments.length} adjunto{attachments.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !title.trim() || !body.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {loading ? 'Enviando...' : 'Enviar Notificación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
