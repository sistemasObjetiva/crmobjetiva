// src/components/proyectos/ContainerProyectos.tsx
import React, { useMemo, useState } from 'react'
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Tooltip, Typography, Paper, Stack, Chip
} from '@mui/material'
import AddBusinessIcon from '@mui/icons-material/AddBusiness'
import ApartmentIcon from '@mui/icons-material/Apartment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import EventIcon from '@mui/icons-material/Event'
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
  imagenesProyecto: '',
  amenidades: [],
  unidades: [],
  paymentPlans: [
    { name: 'Contado', descuento: 6.0, pInicial: 100.0, mensualidades: 0.0, months: 1, parcialidades: [], contraentrega: 0.0 },
    { name: 'ContadoComercial', descuento: 4.0, pInicial: 33.33, mensualidades: 66.67, months: 1, parcialidades: [{ month: 1, value: 33.33 }], contraentrega: 33.33 },
    { name: 'Crédito', descuento: 0.0, pInicial: 20.0, mensualidades: 50.0, months: 1, parcialidades: [{ month: 1, value: 50.0 }], contraentrega: 30.0 },
  ],
  fechaEntrega: fechaActual,
  estatus: 'activo',
})

const ContainerProyectos: React.FC<Props> = ({ userId }) => {
  const { proyectos, fetchProyectos } = useFetchProyects()
  const { showStatus } = useStatusChip()
  const [loading, setLoading] = useState(false)
  const [proyectoLocal, setProyectoLocal] = useState<Proyecto | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // ======== Resumen (KPIs) ========
  const {
    totalProyectos,
    activos,
    inactivos,
    totalUnidades,
    disponibles,
    apartados,
    vendidos,
    proximaEntregaNombre,
    proximaEntregaFecha
  } = useMemo(() => {
    const total = proyectos.length
    const act = proyectos.filter(p => p.estatus === 'activo').length
    const inact = total - act

    const unidadesTot = proyectos.reduce((acc, p) => acc + (p.unidades?.length ?? 0), 0)
    const disp = proyectos.reduce((acc, p) => acc + (p.unidades?.filter(u => u.estatus === 'disponible').length ?? 0), 0)
    const ap = proyectos.reduce((acc, p) => acc + (p.unidades?.filter(u => u.estatus === 'apartado').length ?? 0), 0)
    const vend = proyectos.reduce((acc, p) => acc + (p.unidades?.filter(u => u.estatus === 'vendido').length ?? 0), 0)

    const proximas = proyectos
      .map(p => ({ nombre: p.nombre || 'Proyecto', fecha: new Date(p.fechaEntrega as any) }))
      .filter(x => !Number.isNaN(x.fecha.getTime()))
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

    const prox = proximas[0]
    const fmt = (d?: Date) =>
      d ? d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

    return {
      totalProyectos: total,
      activos: act,
      inactivos: inact,
      totalUnidades: unidadesTot,
      disponibles: disp,
      apartados: ap,
      vendidos: vend,
      proximaEntregaNombre: prox?.nombre ?? '—',
      proximaEntregaFecha: fmt(prox?.fecha),
    }
  }, [proyectos])

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
      await fetchProyectos()
      showStatus('Proyecto guardado exitosamente', 'success')
    } catch (err: any) {
      console.error(err)
      showStatus(err?.message ? `Error al guardar Proyecto: ${err.message}` : 'Error al guardar Proyecto', 'error')
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

  const [proyectoAEliminar, setProyectoAEliminar] = useState<Proyecto | null>(null)
  const [confirmEliminarOpen, setConfirmEliminarOpen] = useState(false)

  const handleDeleteProyecto = (proyecto: Proyecto) => {
    setProyectoAEliminar(proyecto)
    setConfirmEliminarOpen(true)
  }

  const handleEliminarProyectoConfirmado = async () => {
    if (!proyectoAEliminar) return
    setLoading(true)
    try {
      await eliminarProyecto(proyectoAEliminar)
      await fetchProyectos()
      showStatus('Proyecto eliminado', 'success')
    } catch {
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

      {/* ===== Resumen bonito ===== */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={800} color="primary" sx={{ mb: 1 }}>
          Resumen
        </Typography>

        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }}
          gap={2}
        >
          <Paper sx={{ p: 2.2, borderLeft: '4px solid #1976d2', borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ApartmentIcon color="primary" />
              <Typography fontWeight={700}>Proyectos</Typography>
            </Stack>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
              {totalProyectos}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              <Chip size="small" color="success" icon={<CheckCircleIcon />} label={`Activos ${activos}`} />
              <Chip size="small" variant="outlined" color="default" icon={<PauseCircleOutlineIcon />} label={`Inactivos ${inactivos}`} />
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.2, borderLeft: '4px solid #2e7d32', borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <HomeWorkIcon sx={{ color: '#2e7d32' }} />
              <Typography fontWeight={700}>Unidades</Typography>
            </Stack>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
              {totalUnidades}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              <Chip size="small" color="primary" label={`Disponibles ${disponibles}`} />
              <Chip size="small" color="warning" variant="outlined" label={`Apartados ${apartados}`} />
              <Chip size="small" color="error" variant="outlined" label={`Vendidos ${vendidos}`} />
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.2, borderLeft: '4px solid #9c27b0', borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <EventIcon sx={{ color: '#9c27b0' }} />
              <Typography fontWeight={700}>Próxima entrega</Typography>
            </Stack>
            <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5 }}>
              {proximaEntregaFecha}
            </Typography>
            <Typography variant="body2" color="text.secondary">{proximaEntregaNombre}</Typography>
          </Paper>

          <Paper sx={{ p: 2.2, borderLeft: '4px solid #455a64', borderRadius: 3 }}>
            <Typography fontWeight={700} mb={0.5}>Acciones</Typography>
            <Typography variant="body2" color="text.secondary">
              Crea, edita y elimina proyectos. Revisa el estado general arriba.
            </Typography>
            <Box mt={1.5}>
              <Tooltip title="Agregar Proyecto">
                <IconButton onClick={handleAgregarProyecto} color="primary">
                  <AddBusinessIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Botón adicional (por si quieres mantenerlo en la barra) */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Tooltip title="Agregar Proyecto">
          <IconButton onClick={handleAgregarProyecto} color="primary">
            <AddBusinessIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Cards de proyectos */}
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

      {/* Confirmación de eliminación */}
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
