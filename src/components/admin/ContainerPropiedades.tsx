// src/components/proyectos/ContainerPropiedades.tsx
import React, { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip, Typography } from '@mui/material'
import AddBusinessIcon from '@mui/icons-material/AddBusiness'
import {  upsertPropiedad, useFetchPropiedades  } from '../../hooks/useFetchFunctions'
import { Propiedad } from '../../config/types'
import Spinner from '../general/Spinner'
import { useStatusChip } from '../../config/context/useStatusChip'
import CardPropiedad from './CardPropiedad'
import PropiedadControlModal from './PropiedadControlModal'

interface Props {
  userId: string
  role: string
}
export const makeInitialPropiedad = (userId: string): Propiedad => ({
  id: crypto.randomUUID(),                  
  userid: userId,
  tituloPropiedad: '',
  descripcion: '',
  tipo: '',  
  estatus:         'disponible',
})
const ContainerPropiedades: React.FC<Props> = ({ userId }) => {
  const { propiedades /*, refresh*/ } = useFetchPropiedades()
  const { showStatus } = useStatusChip()
  const [loading, setLoading] = useState(false)
  const [propiedadLocal, setPropiedadLocal] = useState<Propiedad | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleAgregarPropiedad = () => {
    setPropiedadLocal(makeInitialPropiedad(userId))
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setPropiedadLocal(null)
  }
  
  const handleSaveProyecto = async (nuevo: Propiedad) => {
      setLoading(true)
      try {
        await upsertPropiedad(nuevo)
        showStatus('Empresa guardada exitosamente', 'success')
      } catch (err: any) {
        console.error(err)
        showStatus(
          err?.message
            ? `Error al guardar empresa: ${err.message}`
            : 'Error al guardar empresa',
          'error'
        )
      } finally {
        setModalOpen(false)
        setPropiedadLocal(null)
        setLoading(false)
      }
    }
const handleEditPropiedad = (propiedad: Propiedad) => {
  setPropiedadLocal(propiedad)
  setModalOpen(true)
}
const [propiedadAEliminar, setPropiedadAEliminar] = useState<Propiedad | null>(null);
const [confirmEliminarOpen, setConfirmEliminarOpen] = useState(false);

const handleDeletePropiedad = (propiedad: Propiedad) => {
  setPropiedadAEliminar(propiedad)
  setConfirmEliminarOpen(true)
}
const handleEliminarPropiedadConfirmado = async () => {
  if (!propiedadAEliminar) return
  setLoading(true)
  try {
     //await eliminarProyecto(propiedadAEliminar)
    showStatus('Propiedad eliminado', 'success')
  } catch (err) {
    showStatus('Error al eliminar propiedad', 'error')
  } finally {
    setPropiedadAEliminar(null)
    setConfirmEliminarOpen(false)
    setLoading(false)
  }
}

  return (
    <Box>
       {loading && <Spinner open={true} />}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Tooltip title="Agregar Propiedad">
          <IconButton onClick={handleAgregarPropiedad} color="primary">
            <AddBusinessIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Aquí podrías mapear tus cards de proyecto */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }}
        gap={2}
        p={2}
      >
        {propiedades.map(prop => (
           <CardPropiedad
            key={prop.id}
            propiedad={prop}
            onEdit={handleEditPropiedad}
            onDelete={handleDeletePropiedad}
          />
        ))}
      </Box>

      {propiedadLocal && (
        <PropiedadControlModal
            open={modalOpen}
            onClose={handleCloseModal}
            propiedad={propiedadLocal}
            setPropiedad={setPropiedadLocal as React.Dispatch<React.SetStateAction<Propiedad>>}
            userID={userId}
            onSave={handleSaveProyecto}
        />
        )}

      <Dialog open={confirmEliminarOpen} onClose={() => setConfirmEliminarOpen(false)}>
      <DialogTitle>¿Eliminar propiedad?</DialogTitle>
      <DialogContent>
        <Typography>
          ¿Estás seguro de que deseas eliminar el propiedad <b>{propiedadAEliminar?.variables?.nombre}</b>? Esta acción es irreversible.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmEliminarOpen(false)}>Cancelar</Button>
        <Button color="error" variant="contained" onClick={handleEliminarPropiedadConfirmado}>
          Sí, eliminar
        </Button>
      </DialogActions>
    </Dialog>
    </Box>
  )
}

export default ContainerPropiedades
