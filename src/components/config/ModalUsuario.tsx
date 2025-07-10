import React, {  useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete'
import { Empresa, User, ROLES, RoleTipo } from '../../config/types';
import { eliminarUsuario } from '../../hooks/useFetchFunctions';
import { useStatusChip } from '../../config/context/useStatusChip';

interface Props {
  open: boolean;
  onClose: () => void;
  usuario: User;
  setUsuario: (u: User) => void;
  onSave: (u: User) => void;
  empresas: Empresa[];
}

const ModalUsuario: React.FC<Props> = ({
  open,
  onClose,
  usuario,
  setUsuario,
  onSave,
  empresas,
}) => {
  const { showStatus } = useStatusChip()

  const handleChange = <K extends keyof User>(field: K, value: User[K]) => {
    setUsuario({ ...usuario, [field]: value });
  };

 const handleGuardar = () => {
  if (!usuario.nombre.trim()) {
    showStatus('El nombre completo es obligatorio', 'error');
    return;
  }
  if (!usuario.email.trim()) {
    showStatus('El correo electrónico es obligatorio', 'error');
    return;
  }
  if (!usuario.role?.tipo) {
    showStatus('Debes seleccionar un rol', 'error');
    return;
  }
  if (!usuario.empresaid) {
    showStatus('Debes seleccionar una empresa', 'error');
    return;
  }
  onSave(usuario);
};


  
    const [confirmOpen, setConfirmOpen] = useState(false)

    const handleEliminarConfirm = () => {
        setConfirmOpen(true)
      }
    
      const handleEliminar = async () => {
        try {
          await eliminarUsuario(usuario.id);
          showStatus('Usuario eliminado exitosamente', 'success');
          setConfirmOpen(false);
          onClose();
        } catch (err: any) {
          console.error(err);
          showStatus(
            err?.message
              ? `Error al eliminar el usuario: ${err.message}`
              : 'Error al eliminar el usuario',
            'error'
          );
        }
      };
    
      const handleCancelEliminar = () => {
        setConfirmOpen(false)
      }

  return (
    <Dialog open={open} onClose={() => {}} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' , mb:1, color:'white', backgroundColor:'var(--secondary-color)' } }>
        <Typography>Datos del Usuario</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Nombre y Correo */}
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
          gap={2}
          mb={2}
        >
          <TextField
            label="Nombre completo"
            value={usuario.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            fullWidth
            required
          />
          <TextField
            type="email"
            label="Correo electrónico"
            value={usuario.email}
            onChange={(e) => handleChange('email', e.target.value)}
            fullWidth
            required
          />
        </Box>

        {/* Teléfono y Empresa */}
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
          gap={2}
          mb={2}
        >
          <TextField
            label="Teléfono"
            value={usuario.telefono ?? ''}
            onChange={(e) => handleChange('telefono', e.target.value)}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Empresa</InputLabel>
            <Select
              value={usuario.empresaid ?? ''}
              label="Empresa"
              onChange={(e) => handleChange('empresaid', e.target.value)}
            >
              {empresas.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Rol general y Nivel */}
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
          gap={2}
          mb={2}
        >
          <FormControl fullWidth>
            <InputLabel>Rol general</InputLabel>
            <Select
              value={usuario.role.tipo}
              label="Rol general"
              onChange={(e) => {
                const selected = e.target.value as RoleTipo;
                handleChange('role', ROLES[selected]);
              }}
            >
              {(Object.keys(ROLES) as Array<keyof typeof ROLES>)
                .filter((r) => r !== 'Plataforma')
                .map((r) => (
                  <MenuItem key={r} value={r}>
                    {ROLES[r].tipo}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>

        {/* Estatus */}
        <Box mb={2}>
          <FormControl fullWidth>
            <InputLabel>Estatus</InputLabel>
            <Select
              value={usuario.estatus}
              label="Estatus"
              onChange={(e) =>
                handleChange('estatus', e.target.value as 'activo' | 'inactivo')
              }
            >
              <MenuItem value="activo">Activo</MenuItem>
              <MenuItem value="inactivo">Inactivo</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* ====== Proyectos ====== */}
        
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
         <Button variant="contained" sx={{  backgroundColor: 'var(--secondary-color)',  color: '#fff', '&:hover': {  backgroundColor: 'var(--primary-color)',  }, }} 
            startIcon={<SaveIcon />}
            onClick={handleGuardar}
            >
          Guardar Usuario
        </Button>
      </DialogActions>
      {/* Diálogo de confirmación */}
      <Dialog open={confirmOpen} onClose={handleCancelEliminar} maxWidth="xs">
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent dividers>
          <Typography>
            ¿Estás seguro de que deseas eliminar la empresa "{usuario.nombre}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEliminar}>Cancelar</Button>
          <Button color="error" onClick={handleEliminar}>
            Sí, eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ModalUsuario;
