// src/components/admin/MigrationModal.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { supabase } from '../../config/supabase';
import Papa from 'papaparse';

interface MigrationModalProps {
  open: boolean;
  onClose: () => void;
}

interface TableStatus {
  name: string;
  displayName: string;
  file: File | null;
  status: 'pending' | 'uploading' | 'success' | 'error';
  recordsProcessed: number;
  totalRecords: number;
  error?: string;
}

const TABLES = [
  { name: 'empresas', displayName: 'Empresas' },
  { name: 'proyectos', displayName: 'Proyectos' },
  { name: 'propiedades', displayName: 'Propiedades' },
  { name: 'prospectos', displayName: 'Prospectos' },
  { name: 'seguimientos', displayName: 'Seguimientos' },
];

export const MigrationModal: React.FC<MigrationModalProps> = ({ open, onClose }) => {
  const [tables, setTables] = useState<TableStatus[]>(
    TABLES.map(t => ({
      ...t,
      file: null,
      status: 'pending' as const,
      recordsProcessed: 0,
      totalRecords: 0,
    }))
  );
  const [migrating, setMigrating] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleFileSelect = (tableName: string, file: File) => {
    setTables(prev =>
      prev.map(t =>
        t.name === tableName
          ? { ...t, file, status: 'pending' as const, error: undefined }
          : t
      )
    );
  };

  const handleRemoveFile = (tableName: string) => {
    setTables(prev =>
      prev.map(t =>
        t.name === tableName
          ? { ...t, file: null, status: 'pending' as const, recordsProcessed: 0, totalRecords: 0 }
          : t
      )
    );
  };

  const transformRecord = (tableName: string, record: any) => {
    // Mapeo de nombres de columnas viejas a nuevas
    const columnMappings: { [table: string]: { [oldName: string]: string } } = {
      empresas: {
        correocontacto: 'email',
        estatus: 'activo',
      },
      proyectos: {
        // imagenesProyecto sigue siendo TEXT en PROD (no cambiar)
        // unidades, paymentPlans, stacking ya son JSONB
      },
      propiedades: {
        // Agregar mapeos si es necesario
      },
      prospectos: {
        // Agregar mapeos si es necesario
      },
      seguimientos: {
        // Agregar mapeos si es necesario
      },
    };

    // Columnas válidas por tabla (basadas en schema REAL de PROD)
    const validColumns: { [table: string]: string[] } = {
      empresas: ['id', 'userid', 'nombre', 'estatus', 'correocontacto', 'telefono', 'created_at'],
      proyectos: [
        'id', 'nombre', 'descripcion', 'userid',
        'logo', 'render', 'imagenesProyecto', 
        'amenidades', 'unidades', 'paymentPlans',
        'fechaEntrega', 'estatus', 'stacking', 'extrasOrder',
        'correoUsuario', 'created_at',
        '_version', '_last_synced_at', '_deleted'
      ],
      propiedades: ['id', 'proyecto_id', 'codigo', 'nombre', 'tipo', 'nivel', 'torre', 'm2_construccion', 'm2_terreno', 'recamaras', 'banos', 'medios_banos', 'estacionamientos', 'bodegas', 'precio_lista', 'precio_final', 'moneda', 'estatus', 'caracteristicas', 'imagenes', 'ubicacion_mapa', 'notas', 'activo', 'created_at', 'updated_at'],
      prospectos: ['id', 'nombre', 'apellido', 'email', 'telefono', 'telefono_secundario', 'origen', 'estado', 'prioridad', 'proyecto_interes_id', 'propiedad_interes_id', 'presupuesto_min', 'presupuesto_max', 'notas', 'asignado_a', 'empresa_id', 'activo', 'created_at', 'updated_at'],
      seguimientos: ['id', 'prospecto_id', 'tipo', 'fecha', 'hora', 'descripcion', 'resultado', 'proxima_accion', 'fecha_proxima_accion', 'usuario_id', 'created_at', 'updated_at'],
    };
    
    // Crear objeto limpio aplicando mapeo de columnas
    const cleanRecord: any = {};
    const mapping = columnMappings[tableName] || {};
    const allowedColumns = validColumns[tableName] || [];
    
    Object.keys(record).forEach(key => {
      if (record[key] !== undefined && record[key] !== '') {
        const mappedKey = mapping[key] || key;
        // Solo incluir si está en la lista de columnas válidas
        if (allowedColumns.length === 0 || allowedColumns.includes(mappedKey)) {
          cleanRecord[mappedKey] = record[key];
        }
      }
    });

    // Transformaciones específicas por tabla
    if (tableName === 'empresas' || tableName === 'proyectos') {
      // Convertir 'activo'/'inactivo' a boolean
      if (typeof cleanRecord.activo === 'string') {
        cleanRecord.activo = cleanRecord.activo.toLowerCase() === 'activo';
      }
    }

    if (tableName === 'proyectos') {
      // Convertir campos JSONB de string a objetos/arrays si vienen como string
      const jsonbFields = ['amenidades', 'unidades', 'paymentPlans', 'stacking', 'extrasOrder', 'logo', 'render'];
      jsonbFields.forEach(field => {
        if (cleanRecord[field] && typeof cleanRecord[field] === 'string') {
          try {
            cleanRecord[field] = JSON.parse(cleanRecord[field]);
          } catch (e) {
            console.warn(`Error parseando ${field}:`, e);
            // Establecer valor por defecto según el tipo esperado
            if (['amenidades', 'unidades', 'paymentPlans', 'extrasOrder'].includes(field)) {
              cleanRecord[field] = [];
            } else if (['stacking', 'logo', 'render'].includes(field)) {
              cleanRecord[field] = null;
            }
          }
        }
      });
      
      // imagenesProyecto es TEXT en PROD (mantener como string)
      // No parsear este campo
    }

    // Asegurar campos básicos de auditoría
    if (!cleanRecord.created_at) {
      cleanRecord.created_at = new Date().toISOString();
    }
    if (!cleanRecord.updated_at) {
      cleanRecord.updated_at = cleanRecord.created_at || new Date().toISOString();
    }

    return cleanRecord;
  };

  const migrateTable = async (tableStatus: TableStatus): Promise<void> => {
    if (!tableStatus.file) return;

    return new Promise((resolve, reject) => {
      Papa.parse(tableStatus.file!, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const records = results.data;
          const totalRecords = records.length;

          // Actualizar total
          setTables(prev =>
            prev.map(t =>
              t.name === tableStatus.name
                ? { ...t, totalRecords, status: 'uploading' as const }
                : t
            )
          );

          try {
            // Procesar en lotes de 50 para mejor control de errores
            const batchSize = 50;
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < records.length; i += batchSize) {
              const batch = records.slice(i, i + batchSize);
              const transformedBatch = batch.map(record =>
                transformRecord(tableStatus.name, record)
              );

              // Insertar registros uno por uno para evitar que un error detenga todo el batch
              for (const record of transformedBatch) {
                try {
                  const { error } = await supabase
                    .from(tableStatus.name)
                    .upsert(record, {
                      onConflict: 'id',
                      ignoreDuplicates: false,
                    });

                  if (error) {
                    // Si es error de duplicado por email, intentar actualizar solo por ID
                    if (error.message.includes('email') || error.message.includes('duplicate')) {
                      console.warn(`Registro duplicado omitido: ${record.id || 'sin ID'}`);
                      errorCount++;
                    } else {
                      throw error;
                    }
                  } else {
                    successCount++;
                  }
                } catch (err) {
                  console.error('Error insertando registro:', err);
                  errorCount++;
                }
              }

              // Actualizar progreso
              setTables(prev =>
                prev.map(t =>
                  t.name === tableStatus.name
                    ? { ...t, recordsProcessed: Math.min(i + batchSize, totalRecords) }
                    : t
                )
              );
            }

            console.log(`✅ ${tableStatus.displayName}: ${successCount} exitosos, ${errorCount} omitidos`)

            // Marcar como exitoso
            setTables(prev =>
              prev.map(t =>
                t.name === tableStatus.name
                  ? { ...t, status: 'success' as const, recordsProcessed: totalRecords }
                  : t
              )
            );

            resolve();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            setTables(prev =>
              prev.map(t =>
                t.name === tableStatus.name
                  ? { ...t, status: 'error' as const, error: errorMessage }
                  : t
              )
            );
            reject(error);
          }
        },
        error: (error) => {
          const errorMessage = `Error al leer CSV de ${tableStatus.displayName}: ${error.message}`;
          setTables(prev =>
            prev.map(t =>
              t.name === tableStatus.name
                ? { ...t, status: 'error' as const, error: errorMessage }
                : t
            )
          );
          reject(new Error(errorMessage));
        },
      });
    });
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setGlobalError('');

    try {
      // Migrar tablas en orden (dependencias primero)
      for (const table of tables) {
        if (table.file) {
          await migrateTable(table);
        }
      }

      // Éxito total
      alert('✅ Migración completada exitosamente');
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Error en la migración');
    } finally {
      setMigrating(false);
    }
  };

  const canMigrate = tables.some(t => t.file !== null) && !migrating;
  const allSuccess = tables.every(t => !t.file || t.status === 'success');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUploadIcon />
          <Typography variant="h6">Migración de Datos (CSV)</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>
          Selecciona los archivos CSV descargados de la base de datos antigua. Los datos se
          adaptarán automáticamente al nuevo esquema con campos de auditoría.
        </Alert>

        {globalError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {globalError}
          </Alert>
        )}

        <List>
          {tables.map((table, index) => (
            <React.Fragment key={table.name}>
              <ListItem
                sx={{
                  bgcolor: table.file ? 'action.hover' : 'transparent',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemIcon>
                  {table.status === 'success' && <CheckIcon color="success" />}
                  {table.status === 'error' && <ErrorIcon color="error" />}
                  {table.status === 'uploading' && <LinearProgress sx={{ width: 24 }} />}
                  {table.status === 'pending' && <UploadIcon color="disabled" />}
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography component="span" variant="subtitle1">{table.displayName}</Typography>
                      {table.file && (
                        <Chip
                          label={table.file.name}
                          size="small"
                          color={table.status === 'success' ? 'success' : 'default'}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      {table.status === 'uploading' && (
                        <Box component="span" sx={{ mt: 1, display: 'block' }}>
                          <LinearProgress
                            variant="determinate"
                            value={(table.recordsProcessed / table.totalRecords) * 100}
                          />
                          <Typography component="span" variant="caption" color="text.secondary">
                            {table.recordsProcessed} / {table.totalRecords} registros
                          </Typography>
                        </Box>
                      )}
                      {table.status === 'success' && (
                        <Typography component="span" variant="caption" color="success.main">
                          ✓ {table.totalRecords} registros migrados
                        </Typography>
                      )}
                      {table.status === 'error' && (
                        <Typography component="span" variant="caption" color="error.main">
                          {table.error}
                        </Typography>
                      )}
                    </React.Fragment>
                  }
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!table.file ? (
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      disabled={migrating}
                    >
                      Seleccionar CSV
                      <input
                        type="file"
                        hidden
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(table.name, file);
                        }}
                      />
                    </Button>
                  ) : (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFile(table.name)}
                      disabled={migrating || table.status === 'uploading'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </ListItem>
              {index < tables.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {migrating && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Migración en progreso... No cierres esta ventana.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={migrating}>
          {allSuccess ? 'Cerrar' : 'Cancelar'}
        </Button>
        <Button
          variant="contained"
          onClick={handleMigrate}
          disabled={!canMigrate}
          startIcon={<CloudUploadIcon />}
        >
          {migrating ? 'Migrando...' : 'Iniciar Migración'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
