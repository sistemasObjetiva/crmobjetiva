// src/components/proyectos/ContainerProyectos.tsx
import React, { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip, Typography } from '@mui/material'
import AddBusinessIcon from '@mui/icons-material/AddBusiness'
import { actualizarProyecto, eliminarProyecto, useFetchProyects } from '../../hooks/useFetchFunctions'
import { Proyecto } from '../../config/types'
import ProyectoControlModal from './ProyectoControlModal'
import Spinner from '../general/Spinner'
import { useStatusChip } from '../../config/context/useStatusChip'
import { fechaActual } from '../../hooks/useDateUtils'
import CardProyecto from './CardProyecto'

interface Props {
  userId: string
  role: string
}
export const makeInitialProyecto = (userId: string): Proyecto => ({
  id: crypto.randomUUID(),                  
  userid: userId,
  nombre: '',
  descripcion: '',
  imagenesProyecto: [],
  amenidades:       [],
  unidades:         [],
  paymentPlans:     [
        {
          name: "Contado",
          descuento: 6.0,
          pInicial: 100.0,
          mensualidades: 0.0,
          months: 1,
          parcialidades: [],
          contraentrega: 0.0,
        },
        {
          name: "ContadoComercial",
          descuento: 4.0,
          pInicial: 33.33,
          mensualidades: 66.67,
          months: 1,
          parcialidades: [
            { month: 1, value: 33.33 }
          ],
          contraentrega: 33.33,
        },
        {
          name: "Crédito",
          descuento: 0.0,
          pInicial: 20.0,
          mensualidades: 50.0,
          months: 1,
          parcialidades: [
            { month: 1, value: 50.0 }
          ],
          contraentrega: 30.0,
        },
      ],
  fechaEntrega:     fechaActual,
  estatus:         'activo',
})
const ContainerProyectos: React.FC<Props> = ({ userId }) => {
  const { proyectos /*, refresh*/ } = useFetchProyects()
  const { showStatus } = useStatusChip()
  const [loading, setLoading] = useState(false)
  const [proyectoLocal, setProyectoLocal] = useState<Proyecto | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleAgregarProyecto = () => {
    setProyectoLocal(makeInitialProyecto(userId))
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setProyectoLocal(null)
  }
  
  const handleSaveProyecto = async (nuevo: Proyecto) => {
      setLoading(true)
      try {
        await actualizarProyecto(nuevo)
        showStatus('Proyecto guardado exitosamente', 'success')
      } catch (err: any) {
        console.error(err)
        showStatus(
          err?.message
            ? `Error al guardar Proyecto: ${err.message}`
            : 'Error al guardar Proyecto',
          'error'
        )
      } finally {
        setModalOpen(false)
        setProyectoLocal(null)
        setLoading(false)
      }
    }
const handleEditProyecto = (proyecto: Proyecto) => {
  setProyectoLocal(proyecto)
  setModalOpen(true)
}
const [proyectoAEliminar, setProyectoAEliminar] = useState<Proyecto | null>(null);
const [confirmEliminarOpen, setConfirmEliminarOpen] = useState(false);

const handleDeleteProyecto = (proyecto: Proyecto) => {
  setProyectoAEliminar(proyecto)
  setConfirmEliminarOpen(true)
}
const handleEliminarProyectoConfirmado = async () => {
  if (!proyectoAEliminar) return
  setLoading(true)
  try {
    // Aquí llamas a tu función de borrado de proyecto+archivos
     await eliminarProyecto(proyectoAEliminar)
    showStatus('Proyecto eliminado', 'success')
  } catch (err) {
    showStatus('Error al eliminar proyecto', 'error')
  } finally {
    setProyectoAEliminar(null)
    setConfirmEliminarOpen(false)
    setLoading(false)
  }
}

  return (
    <Box>
       {loading && <Spinner open={true} />}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Tooltip title="Agregar Proyecto">
          <IconButton onClick={handleAgregarProyecto} color="primary">
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
        {proyectos.map(proj => (
           <CardProyecto
            key={proj.id}
            proyecto={proj}
            onEdit={handleEditProyecto}
            onDelete={handleDeleteProyecto}
          />
        ))}
      </Box>

      {proyectoLocal && (
        <ProyectoControlModal
          proyecto={proyectoLocal}
          open={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveProyecto}
          setProyecto={setProyectoLocal}
          userid={userId}
        />
      )}
      <Dialog open={confirmEliminarOpen} onClose={() => setConfirmEliminarOpen(false)}>
      <DialogTitle>¿Eliminar proyecto?</DialogTitle>
      <DialogContent>
        <Typography>
          ¿Estás seguro de que deseas eliminar el proyecto <b>{proyectoAEliminar?.nombre}</b>? Esta acción es irreversible.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmEliminarOpen(false)}>Cancelar</Button>
        <Button color="error" variant="contained" onClick={handleEliminarProyectoConfirmado}>
          Sí, eliminar
        </Button>
      </DialogActions>
    </Dialog>
    </Box>
  )
}

export default ContainerProyectos
