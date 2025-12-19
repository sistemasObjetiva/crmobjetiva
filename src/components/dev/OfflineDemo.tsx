/**
 * ============================================
 * OFFLINE DEMO - Componente de Prueba
 * ============================================
 * Componente para probar la arquitectura offline-first
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Alert,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Delete, Refresh, CloudOff, CloudDone } from '@mui/icons-material';
import { useOffline } from '../../config/context/OfflineContext';
import { repositories } from '../../repositories';
import { db, type LocalProyecto } from '../../db/schema';

export const OfflineDemo: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, syncNow, lastSync } = useOffline();
  const [proyectos, setProyectos] = useState<LocalProyecto[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Cargar proyectos
  const loadProyectos = async () => {
    try {
      const data = await repositories.proyectos.getAll();
      setProyectos(data);
    } catch (error) {
      console.error('Error loading proyectos:', error);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    const dbStats = await db.getStats();
    setStats(dbStats);
  };

  useEffect(() => {
    loadProyectos();
    loadStats();
  }, []);

  // Crear proyecto
  const handleCreate = async () => {
    if (!nuevoNombre.trim()) return;

    setLoading(true);
    try {
      const result = await repositories.proyectos.create({
        nombre: nuevoNombre,
        userid: 'demo-user-id',
        descripcion: 'Proyecto de prueba offline',
        estatus: 'activo',
        imagenesProyecto: '',
        amenidades: [],
        unidades: [],
        paymentPlans: [],
        fechaEntrega: new Date().toISOString(),
      });

      if (result.success) {
        setNuevoNombre('');
        await loadProyectos();
        await loadStats();
        
        if (result.offline) {
          alert('✅ Proyecto creado localmente. Se sincronizará automáticamente.');
        } else {
          alert('✅ Proyecto creado en servidor.');
        }
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating proyecto:', error);
      alert('❌ Error al crear proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar proyecto (soft delete)
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proyecto?')) return;

    setLoading(true);
    try {
      const result = await repositories.proyectos.delete(id);

      if (result.success) {
        await loadProyectos();
        await loadStats();
        alert('🗑️ Proyecto eliminado (soft delete)');
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting proyecto:', error);
      alert('❌ Error al eliminar proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar
  const handleSync = async () => {
    setLoading(true);
    try {
      await syncNow();
      await loadProyectos();
      await loadStats();
    } finally {
      setLoading(false);
    }
  };

  // Limpiar DB
  const handleClearDB = async () => {
    if (!confirm('¿Limpiar toda la base de datos local?')) return;

    setLoading(true);
    try {
      await db.clearAll();
      localStorage.removeItem('lastSyncTimestamp');
      await loadProyectos();
      await loadStats();
      alert('🗑️ Base de datos local limpiada');
    } catch (error) {
      console.error('Error clearing DB:', error);
      alert('❌ Error al limpiar DB');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Offline-First Demo
      </Typography>

      {/* Estado de Conexión */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            {isOnline ? (
              <Chip icon={<CloudDone />} label="Online" color="success" />
            ) : (
              <Chip icon={<CloudOff />} label="Offline" color="error" />
            )}

            {isSyncing && <Chip label="Sincronizando..." color="primary" />}

            {pendingCount > 0 && (
              <Chip
                label={`${pendingCount} operación${pendingCount > 1 ? 'es' : ''} pendiente${pendingCount > 1 ? 's' : ''}`}
                color="warning"
              />
            )}

            {lastSync && (
              <Typography variant="caption" color="text.secondary">
                Última sync: {lastSync.toLocaleTimeString()}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Alertas */}
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Estás trabajando sin conexión. Los cambios se sincronizarán automáticamente cuando vuelvas a conectarte.
        </Alert>
      )}

      {/* Estadísticas */}
      {stats && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Estadísticas IndexedDB
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip label={`Proyectos: ${stats.proyectos}`} />
              <Chip label={`Pendientes: ${stats.pending_operations}`} color="warning" />
              <Chip label={`Total: ${stats.total}`} />
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Crear Proyecto */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ➕ Crear Proyecto
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="Nombre del Proyecto"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={loading || !nuevoNombre.trim()}
            >
              Crear
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Lista de Proyectos */}
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              📋 Proyectos ({proyectos.length})
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<Refresh />}
                onClick={handleSync}
                disabled={loading || !isOnline}
              >
                Sincronizar
              </Button>
              <Button
                size="small"
                color="error"
                onClick={handleClearDB}
                disabled={loading}
              >
                Limpiar DB
              </Button>
            </Stack>
          </Stack>

          {proyectos.length === 0 ? (
            <Alert severity="info">No hay proyectos. Crea uno para probar el modo offline.</Alert>
          ) : (
            <List>
              {proyectos.map((proyecto) => (
                <ListItem key={proyecto.id} divider>
                  <ListItemText
                    primary={proyecto.nombre}
                    secondary={
                      <Stack direction="row" spacing={1} mt={0.5}>
                        <Chip
                          size="small"
                          label={proyecto.estatus || 'Sin estado'}
                          color={proyecto.estatus === 'activo' ? 'success' : 'default'}
                        />
                        {proyecto.sync_status && (
                          <Chip
                            size="small"
                            label={proyecto.sync_status}
                            color={
                              proyecto.sync_status === 'synced'
                                ? 'success'
                                : proyecto.sync_status === 'pending'
                                ? 'warning'
                                : 'error'
                            }
                          />
                        )}
                        {proyecto.created_at && (
                          <Typography variant="caption" color="text.secondary">
                            {new Date(proyecto.created_at).toLocaleString()}
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(proyecto.id)}
                      disabled={loading}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          🧪 Cómo probar:
        </Typography>
        <ol>
          <li>Crea algunos proyectos estando online</li>
          <li>Desconecta tu internet (modo avión o apagar WiFi)</li>
          <li>Crea más proyectos - verás que se guardan localmente</li>
          <li>Reconecta internet - los cambios se sincronizarán automáticamente</li>
          <li>Verifica el badge de estado en el navbar</li>
        </ol>
      </Alert>
    </Box>
  );
};

export default OfflineDemo;
