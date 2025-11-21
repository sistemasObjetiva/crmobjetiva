import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Stack,
  Tooltip,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface ExtrasManagerProps {
  extrasKeys: string[];
  extrasValues: Record<string, any>;
  onAddKey: () => void;
  onChangeKey: (index: number, newKey: string) => void;
  onChangeValue: (key: string, value: any) => void;
  onRemoveKey: (index: number) => void;
  onReorderKeys: (fromIndex: number, toIndex: number) => void;
}

const ExtrasManager: React.FC<ExtrasManagerProps> = ({
  extrasKeys,
  extrasValues,
  onAddKey,
  onChangeKey,
  onChangeValue,
  onRemoveKey,
  onReorderKeys,
}) => {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editingValue, setEditingValue] = React.useState('');
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const handleStartEdit = (index: number, currentKey: string) => {
    setEditingIndex(index);
    setEditingValue(currentKey);
  };

  const handleSaveEdit = (index: number) => {
    if (editingValue.trim() && editingValue !== extrasKeys[index]) {
      onChangeKey(index, editingValue.trim());
    }
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    onReorderKeys(draggedIndex, dropIndex);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'var(--background-secondary, #f5f5f5)' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          📝 Campos Personalizados
        </Typography>
        <Tooltip title="Agregar campo nuevo">
          <IconButton
            onClick={onAddKey}
            color="primary"
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': { backgroundColor: 'primary.dark' },
            }}
          >
            <AddCircleIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {extrasKeys.length === 0 ? (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No hay campos personalizados. Haz clic en el botón ➕ para agregar uno.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {extrasKeys.map((key, index) => (
            <Card
              key={`${key}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={e => handleDragOver(e, index)}
              onDrop={e => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              sx={{
                cursor: 'grab',
                transition: 'all 0.2s',
                opacity: draggedIndex === index ? 0.5 : 1,
                transform: draggedIndex === index ? 'scale(0.95)' : 'scale(1)',
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  cursor: 'grabbing',
                },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  {/* Drag handle */}
                  <DragIndicatorIcon sx={{ color: 'text.secondary', cursor: 'grab' }} />

                  {/* Número de orden */}
                  <Chip
                    label={index + 1}
                    size="small"
                    sx={{ minWidth: 32, fontWeight: 'bold' }}
                  />

                  {/* Campo nombre/clave */}
                  {editingIndex === index ? (
                    <TextField
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      size="small"
                      placeholder="Nombre del campo"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit(index);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      sx={{ flexGrow: 1 }}
                    />
                  ) : (
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        {key || <em style={{ color: '#999' }}>(sin nombre)</em>}
                      </Typography>
                    </Box>
                  )}

                  {/* Campo valor */}
                  {editingIndex !== index && (
                    <TextField
                      value={extrasValues[key] || ''}
                      onChange={e => onChangeValue(key, e.target.value)}
                      size="small"
                      placeholder="Valor"
                      sx={{ minWidth: 200 }}
                    />
                  )}

                  {/* Acciones */}
                  <Stack direction="row" spacing={0.5}>
                    {editingIndex === index ? (
                      <>
                        <Tooltip title="Guardar">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleSaveEdit(index)}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={handleCancelEdit}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip title="Editar nombre">
                          <IconButton
                            size="small"
                            onClick={() => handleStartEdit(index, key)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar campo">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onRemoveKey(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        💡 Tip: Arrastra los campos para reordenarlos. El orden se mantendrá en el Excel exportado.
      </Typography>
    </Paper>
  );
};

export default ExtrasManager;
