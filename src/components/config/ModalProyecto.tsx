// src/components/config/ProyectoModal.tsx
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
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tabs,
  Tab,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import DeleteIcon from '@mui/icons-material/Delete'
import FileUploadPreview from '../general/FileUploadPreviewFiles'
import { Proyecto } from '../../config/types'
import { eliminarProyecto } from '../../hooks/useFetchFunctions'
import { useStatusChip } from '../../config/context/useStatusChip'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (proyecto: Proyecto) => void
  proyecto?: Proyecto | null
  setProyecto?: (proyecto: Proyecto | null) => void
}

const ProyectoModal: React.FC<Props> = ({ open, onClose, onSave, proyecto, setProyecto }) => {
  const { showStatus } = useStatusChip() 

  const [tabIndex, setTabIndex] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  if (!proyecto || !setProyecto) return null

  const handleTabChange = (_ev: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue)
  }

  const handleChange = <K extends keyof Proyecto>(field: K, value: Proyecto[K]) => {
    setProyecto({ ...proyecto, [field]: value })
  }

  const handleGuardar = () => {
    if (!proyecto.nombre.trim()) {
      showStatus('Debes ingresar el nombre del proyecto', 'error')
      return
    }
    onSave(proyecto)
  }
const handleEliminarConfirm = () => {
    setConfirmOpen(true)
  }

  const handleEliminar = async () => {
    try {
      await eliminarProyecto(proyecto)
      setConfirmOpen(false)
      onClose()
      showStatus('Empresa eliminada correctamente', 'success')  
    } catch (error) {
      console.error(error)
      showStatus('Error al eliminar la empresa', 'error')
    }
  }

  const handleCancelEliminar = () => {
    setConfirmOpen(false)
  }
  return (
    <>
   <Dialog open={open} onClose={()=>{}} fullWidth maxWidth="sm">
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
        <Typography>{proyecto.id ? 'Editar Proyecto' : 'Nuevo Proyecto'}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        centered
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Info. General" />
        <Tab label="Más Info" />
      </Tabs>

      <DialogContent dividers>
        {/*** TAB 0: Info. General ***/}
        {tabIndex === 0 && (
          <Box>
            <Box display="grid"  gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2} mb={2} >   
              <Box sx={{ gridColumn: 'span 2' }}>     
                <TextField
                  fullWidth
                  label="Nombre del Proyecto"
                  value={proyecto.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  sx={{ mb: 3 }}
                />
              </Box>
              <Box sx={{ gridColumn: 'span 2' }}> 
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="estatus-label">Estatus</InputLabel>    
                  <Select
                    labelId="estatus-label"              
                    value={proyecto.estatus ?? 'activo'}
                    label="Estatus"
                    onChange={e => handleChange('estatus', e.target.value as 'activo' | 'inactivo')}
                  >
                    <MenuItem value="activo">Activo</MenuItem>
                    <MenuItem value="inactivo">Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr' }} gap={2} mb={2} justifyItems="center" sx={{ textAlign: 'center' }} >     
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Logo del Proyecto
                </Typography>
                <FileUploadPreview
                  value={proyecto.logo}
                  onChange={(f) =>
                    handleChange('logo', {
                      id: 'logo',
                      nombre: f instanceof File ? f.name : '',
                      file: f as File,
                      bucket: '',
                      path: '',
                    })
                  }
                  accept="image/*"
                  width={320}
                  height="auto"
                />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Render del Proyecto
                </Typography>
                <FileUploadPreview
                  value={proyecto.render}
                  onChange={(f) =>
                    handleChange('render', {
                      id: 'render',
                      nombre: f instanceof File ? f.name : '',
                      file: f as File,
                      bucket: '',
                      path: '',
                    })
                  }
                  accept="image/*,.pdf"
                  width={320}
                  height={"auto"}
                />
              </Box>
            </Box>
          </Box>
        )}
        
        {tabIndex === 1 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              py: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Aquí puedes agregar más campos o información adicional del proyecto.⁠
              Por ejemplo:
            </Typography>
            <TextField label="Ubicación" fullWidth placeholder="Ej. Ciudad de México" />
            <TextField label="Cliente" fullWidth placeholder="Nombre del cliente" />
            {/* Agrega otros campos según tus necesidades */}
          </Box>
        )}
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
          Guardar
        </Button>
      </DialogActions>

    </Dialog>
    <Dialog open={confirmOpen} onClose={handleCancelEliminar} maxWidth="xs">
      <DialogTitle>Confirmar eliminación</DialogTitle>
      <DialogContent dividers>
        <Typography>
          ¿Estás seguro de que deseas eliminar el proyecto "{proyecto.nombre}"?
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

export default ProyectoModal


