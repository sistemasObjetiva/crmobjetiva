import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Divider,
  Stack,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Unidad } from '../../config/types';

type ImportMode = 'append' | 'replace' | 'merge';

interface ImportPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  preview: Unidad[];
  warnings: string[];
  importMode: ImportMode;
  onImportModeChange: (mode: ImportMode) => void;
  currentUnitsCount: number;
}

const ImportPreviewDialog: React.FC<ImportPreviewDialogProps> = ({
  open,
  onClose,
  onConfirm,
  preview,
  warnings,
  importMode,
  onImportModeChange,
  currentUnitsCount,
}) => {
  const hasWarnings = warnings.length > 0;
  const hasData = preview.length > 0;

  const getModeDescription = (mode: ImportMode) => {
    switch (mode) {
      case 'append':
        return `Se agregarán ${preview.length} unidades nuevas a las ${currentUnitsCount} existentes (Total: ${currentUnitsCount + preview.length})`;
      case 'replace':
        return `Se reemplazarán las ${currentUnitsCount} unidades existentes por ${preview.length} nuevas`;
      case 'merge':
        return `Se fusionarán las unidades por número de unidad. Las existentes se actualizarán y las nuevas se agregarán`;
      default:
        return '';
    }
  };

  const getModeIcon = (mode: ImportMode) => {
    switch (mode) {
      case 'append':
        return '➕';
      case 'replace':
        return '🔄';
      case 'merge':
        return '🔀';
      default:
        return '';
    }
  };

  // Obtener todas las claves de extras de las unidades de preview
  const allExtrasKeys = React.useMemo(() => {
    const keysSet = new Set<string>();
    preview.forEach(u => {
      if (u.extras) {
        Object.keys(u.extras).forEach(k => keysSet.add(k));
      }
    });
    return Array.from(keysSet);
  }, [preview]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ backgroundColor: 'var(--secondary-color)', color: 'white' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <InfoIcon />
          <Typography variant="h6">Vista Previa de Importación</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {/* Warnings */}
        {hasWarnings && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Se encontraron {warnings.length} advertencia(s):
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {warnings.map((w, idx) => (
                <li key={idx}>
                  <Typography variant="body2">{w}</Typography>
                </li>
              ))}
            </Box>
          </Alert>
        )}

        {/* Resumen */}
        {hasData && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              📊 Resumen de Importación
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              <Chip
                label={`${preview.length} unidades a importar`}
                color="primary"
                icon={<CheckCircleIcon />}
              />
              <Chip
                label={`${currentUnitsCount} unidades existentes`}
                variant="outlined"
              />
              {allExtrasKeys.length > 0 && (
                <Chip
                  label={`${allExtrasKeys.length} campos extras detectados`}
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Stack>

            {allExtrasKeys.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Campos extras detectados:</strong>
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {allExtrasKeys.map(key => (
                    <Chip key={key} label={key} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Modo de importación */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              🔧 Modo de Importación
            </Typography>
            <RadioGroup
              value={importMode}
              onChange={e => onImportModeChange(e.target.value as ImportMode)}
            >
              <FormControlLabel
                value="append"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">
                      {getModeIcon('append')} <strong>Agregar</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getModeDescription('append')}
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="merge"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">
                      {getModeIcon('merge')} <strong>Fusionar</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getModeDescription('merge')}
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="replace"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">
                      {getModeIcon('replace')} <strong>Reemplazar</strong> (⚠️ Cuidado)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getModeDescription('replace')}
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>

            <Divider sx={{ my: 2 }} />

            {/* Preview de datos */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              👁️ Vista Previa de Datos (primeras 10 unidades)
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>#</strong></TableCell>
                    <TableCell><strong>Número</strong></TableCell>
                    <TableCell><strong>Unidad Privativa</strong></TableCell>
                    <TableCell><strong>Precio Lista</strong></TableCell>
                    <TableCell><strong>Estatus</strong></TableCell>
                    {allExtrasKeys.slice(0, 3).map(key => (
                      <TableCell key={key}><strong>{key}</strong></TableCell>
                    ))}
                    {allExtrasKeys.length > 3 && (
                      <TableCell><strong>...</strong></TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.slice(0, 10).map((u, idx) => (
                    <TableRow key={u.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{u.numerounidad || '-'}</TableCell>
                      <TableCell>{u.unidadprivativa || '-'}</TableCell>
                      <TableCell>
                        {u.preciolista ? `$${parseFloat(String(u.preciolista)).toLocaleString('es-MX')}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.estatus}
                          size="small"
                          color={
                            u.estatus === 'disponible' ? 'success' :
                            u.estatus === 'apartado' ? 'warning' :
                            u.estatus === 'vendido' ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      {allExtrasKeys.slice(0, 3).map(key => (
                        <TableCell key={key}>
                          {u.extras?.[key] || '-'}
                        </TableCell>
                      ))}
                      {allExtrasKeys.length > 3 && (
                        <TableCell>+{allExtrasKeys.length - 3}</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {preview.length > 10 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Mostrando 10 de {preview.length} unidades
              </Typography>
            )}
          </Box>
        )}

        {!hasData && (
          <Alert severity="info">
            No hay datos para importar. Por favor selecciona un archivo válido.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={!hasData}
          color={importMode === 'replace' ? 'warning' : 'primary'}
        >
          {importMode === 'replace' ? '⚠️ Confirmar Reemplazo' : 'Confirmar Importación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportPreviewDialog;
