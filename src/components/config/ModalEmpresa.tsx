// src/components/empresas/ModalEmpresa.tsx

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Button,
  Box,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import DeleteIcon from '@mui/icons-material/Delete'

import { Empresa } from '../../config/types'
import { eliminarEmpresa } from '../../hooks/useFetchFunctions'
import { useStatusChip } from '../../config/context/useStatusChip'

interface Props {
  open: boolean
  onClose: () => void
  empresa: Empresa
  setEmpresa: (e: Empresa) => void
  onSave: (e: Empresa) => void
}

const ModalEmpresa: React.FC<Props> = ({
  open,
  onClose,
  empresa,
  setEmpresa,
  onSave,
}) => {
  const { showStatus } = useStatusChip()
  // Estado para controlar el diálogo de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleChange = <K extends keyof Empresa>(field: K, value: Empresa[K]) => {
    setEmpresa({ ...empresa, [field]: value })
  }

   const handleGuardar = () => {
    if (!empresa.nombre.trim() || !empresa.nombre.trim()) {
      showStatus('Nombre comercial y legal son obligatorios', 'error');
      return;
    }
    onSave(empresa);
  };

  const handleEliminarConfirm = () => {
    setConfirmOpen(true)
  }

  const handleEliminar = async () => {
    try {
      await eliminarEmpresa(empresa.id);
      showStatus('Empresa eliminada exitosamente', 'success');
      setConfirmOpen(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      showStatus(
        err?.message
          ? `Error al eliminar la empresa: ${err.message}`
          : 'Error al eliminar la empresa',
        'error'
      );
    }
  };


  const handleCancelEliminar = () => {
    setConfirmOpen(false)
  }

  return (
    <>
      {/* Modal principal */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
            color: 'white',
            backgroundColor: 'var(--secondary-color)',
          }}
        >
          <Typography>Datos de la Empresa</Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
            gap={2}
            mb={1}
            alignItems="center"
          >
            <Box textAlign="center">
              <TextField
                label="Nombre Comercial"
                value={empresa.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                fullWidth
                required
              />
            </Box>            
            <Box textAlign="center">
              <TextField
                label="Correo Electrónico"
                value={empresa.correocontacto ?? ''}
                onChange={(e) => handleChange('correocontacto', e.target.value)}
                fullWidth
              />
            </Box>
          </Box>

          <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
            gap={2}
            mb={1}
            alignItems="center"
          >
            <Box textAlign="center">
              <TextField
                label="Teléfono"
                value={empresa.telefono ?? ''}
                onChange={(e) => handleChange('telefono', e.target.value)}
                fullWidth
              />
            </Box>
          </Box>


        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: 'var(--secondary-color)',
              color: '#fff',
              '&:hover': { backgroundColor: 'var(--primary-color)' },
            }}
            startIcon={<DeleteIcon />}
            onClick={handleEliminarConfirm}
          >
            Eliminar
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: 'var(--secondary-color)',
              color: '#fff',
              '&:hover': { backgroundColor: 'var(--primary-color)' },
            }}
            startIcon={<SaveIcon />}
            onClick={handleGuardar}
          >
            Guardar Empresa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación */}
      <Dialog open={confirmOpen} onClose={handleCancelEliminar} maxWidth="xs">
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent dividers>
          <Typography>
            ¿Estás seguro de que deseas eliminar la empresa "{empresa.nombre}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEliminar}>Cancelar</Button>
          <Button color="error" onClick={handleEliminar}>
            Sí, eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ModalEmpresa
