// src/components/proyectos/ContainerPropiedades.tsx
import React, { useMemo, useState } from 'react'
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Tooltip, Typography, Paper, Stack, Chip
} from '@mui/material'
import AddBusinessIcon from '@mui/icons-material/AddBusiness'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import CategoryIcon from '@mui/icons-material/Category'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import SellIcon from '@mui/icons-material/Sell'
import { upsertPropiedad, useFetchPropiedades } from '../../hooks/useFetchFunctions'
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
  estatus: 'disponible',
})

const ContainerPropiedades: React.FC<Props> = ({ userId }) => {
  const { propiedades /*, refresh*/ } = useFetchPropiedades()
  const { showStatus } = useStatusChip()
  const [loading, setLoading] = useState(false)
  const [propiedadLocal, setPropiedadLocal] = useState<Propiedad | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // ======== Resumen (KPIs) ========
  const {
    totalProps, disponibles, apartados, vendidos, otros, topTipos
  } = useMemo(() => {
    const total = propiedades.length

    // ✅ reduce con genérico
    const statusCount = propiedades.reduce<Record<string, number>>((acc, p) => {
      const k = (p.estatus ?? '').toLowerCase()
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {})

    const disp = statusCount['disponible'] ?? 0
    const ap = statusCount['apartado'] ?? 0
    const ven = statusCount['vendido'] ?? 0
    const otrosCount = total - (disp + ap + ven)

    const tipoCount = propiedades.reduce<Record<string, number>>((acc, p) => {
      const t = (p.tipo ?? '').trim()
      if (!t) return acc
      acc[t] = (acc[t] ?? 0) + 1
      return acc
    }, {})

    const top = Object.entries(tipoCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tipo, count]) => ({ tipo, count }))

    return {
      totalProps: total,
      disponibles: disp,
      apartados: ap,
      vendidos: ven,
      otros: otrosCount,
      topTipos: top as Array<{ tipo: string; count: number }>,
    }
  }, [propiedades])

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
      showStatus('Propiedad guardada exitosamente', 'success')
    } catch (err: any) {
      console.error(err)
      showStatus(err?.message ? `Error al guardar Propiedad: ${err.message}` : 'Error al guardar Propiedad', 'error')
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

  const [propiedadAEliminar, setPropiedadAEliminar] = useState<Propiedad | null>(null)
  const [confirmEliminarOpen, setConfirmEliminarOpen] = useState(false)
  const handleDeletePropiedad = (propiedad: Propiedad) => {
    setPropiedadAEliminar(propiedad)
    setConfirmEliminarOpen(true)
  }
  const handleEliminarPropiedadConfirmado = async () => {
    if (!propiedadAEliminar) return
    setLoading(true)
    try {
      // TODO: implementar eliminación real (ej. eliminarPropiedad(propiedadAEliminar))
      showStatus('Propiedad eliminada', 'success')
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
          {/* Total propiedades */}
          <Paper sx={{ p: 2.2, borderLeft: '4px solid #1976d2', borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Inventory2Icon color="primary" />
              <Typography fontWeight={700}>Propiedades</Typography>
            </Stack>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
              {totalProps}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              <Chip size="small" icon={<CheckCircleIcon />} color="success" label={`Disponibles ${disponibles}`} />
              <Chip size="small" icon={<WarningAmberIcon />} color="warning" variant="outlined" label={`Apartadas ${apartados}`} />
              <Chip size="small" icon={<SellIcon />} color="error" variant="outlined" label={`Vendidas ${vendidos}`} />
              {otros > 0 && <Chip size="small" variant="outlined" label={`Otros ${otros}`} />}
            </Stack>
          </Paper>

          {/* Tipos más frecuentes */}
          <Paper sx={{ p: 2.2, borderLeft: '4px solid #9c27b0', borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CategoryIcon sx={{ color: '#9c27b0' }} />
              <Typography fontWeight={700}>Top tipos</Typography>
            </Stack>
            {topTipos.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Sin tipos definidos aún.
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                {topTipos.map(t => (
                  <Chip key={t.tipo} size="small" label={`${t.tipo} (${t.count})`} />
                ))}
              </Stack>
            )}
          </Paper>

          {/* Acciones rápidas */}
          <Paper sx={{ p: 2.2, borderLeft: '4px solid #2e7d32', borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <HomeWorkIcon sx={{ color: '#2e7d32' }} />
              <Typography fontWeight={700}>Acciones</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Crea, edita y elimina propiedades. Revisa el estado general arriba.
            </Typography>
            <Box mt={1.5}>
              <Tooltip title="Agregar Propiedad">
                <IconButton onClick={handleAgregarPropiedad} color="primary">
                  <AddBusinessIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Botón adicional (si quieres mantenerlo aparte) */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Tooltip title="Agregar Propiedad">
          <IconButton onClick={handleAgregarPropiedad} color="primary">
            <AddBusinessIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Cards de propiedades */}
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

      {/* Confirmación de eliminación */}
      <Dialog open={confirmEliminarOpen} onClose={() => setConfirmEliminarOpen(false)}>
        <DialogTitle>¿Eliminar propiedad?</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la propiedad <b>{propiedadAEliminar?.tituloPropiedad || '—'}</b>? Esta acción es irreversible.
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
