import React, { useState } from 'react'
import {
  Box, Typography, IconButton, Paper, Tooltip, Table, TableBody, TableCell,
  TableHead, TableRow, CircularProgress, Chip
} from '@mui/material'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  updateSeguimiento,
  useFetchPropiedades,
  useFetchProspectosUser,
  useFetchProyects,
  useFetchSeguimientosUser
} from '../../hooks/useFetchFunctions'
import { Seguimiento } from '../../config/types'
import SeguimientoModal from './SeguimientoModal'
import { useStatusChip } from '../../config/context/useStatusChip'
import Spinner from '../general/Spinner'
import { fechaActual } from '../../hooks/useDateUtils'

interface Props {
  userid: string
}

// Estatus posibles y etiquetas visuales
const ESTATUS_LIST = [
  'contactado',
  'interaccion',
  'cotizacion',
  'visita',
  'posible',
  'apartado',
  'vendido'
]

const ESTATUS_LABELS: Record<string, string> = {
  contactado: 'Contactado',
  interaccion: 'Interacción',
  cotizacion: 'Cotización',
  visita: 'Visita',
  posible: 'Posible',
  apartado: 'Apartado',
  vendido: 'Vendido'
}

const ESTATUS_COLORS: Record<string, any> = {
  contactado: 'info',
  interaccion: 'primary',
  cotizacion: 'secondary',
  visita: 'warning',
  posible: 'success',
  apartado: 'default',
  vendido: 'error'
}

const SeguimientosTab: React.FC<Props> = ({ userid }) => {
  const { showStatus } = useStatusChip()
  const { seguimientos, loading: loadingSeguimientos } = useFetchSeguimientosUser(userid)
  const { prospectos } = useFetchProspectosUser(userid)
  const { proyectos } = useFetchProyects()
  const { propiedades } = useFetchPropiedades()
  const [modalOpen, setModalOpen] = useState(false)
  const [seguimientoLocal, setSeguimientoLocal] = useState<Seguimiento | null>(null)
  const [loading, setLoading] = useState(false)

  const initialSeguimiento = (): Seguimiento => ({
    id: crypto.randomUUID(),
    userid,
    idprospecto: '',
    fechaCreacion: fechaActual,
    fechaActualizacion: fechaActual,
    fechaProximoSeguimiento: fechaActual,
    unidadInteres: '',
    formaDePago: '',
    temperaturaInteres: '',
    comentarios: '',
    capacidadDePago: '',
    proyectoInteres: '',
    historialSeguimiento: [],
    estatusSeguimiento: 'contactado'
  })

  const handleAbrirModalNuevo = () => {
    setSeguimientoLocal(initialSeguimiento())
    setModalOpen(true)
  }

  const handleAbrirModalVer = (s: Seguimiento) => {
    setSeguimientoLocal(s)
    setModalOpen(true)
  }

  const handleGuardarSeguimiento = async (s: Seguimiento) => {
    setLoading(true)
    try {
      await updateSeguimiento(s)
      showStatus('Seguimiento guardado exitosamente', 'success')
    } catch (err: any) {
      console.error(err)
      showStatus(
        err?.message
          ? `Error al guardar seguimiento: ${err.message}`
          : 'Error al guardar seguimiento',
        'error'
      )
    } finally {
      setModalOpen(false)
      setSeguimientoLocal(null)
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Seguimiento, value: any) => {
    setSeguimientoLocal(prev => prev ? { ...prev, [field]: value } : null)
  }

  // Agrupa los seguimientos por estatus para mostrar cada grupo por separado
  const seguimientosByStatus = ESTATUS_LIST.map(status => ({
    status,
    rows: seguimientos.filter(s => s.estatusSeguimiento === status)
  }))

  return (
    <Box>
      {loading && <Spinner open={true} />}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700} color="primary">
          Seguimientos
        </Typography>
        <Tooltip title="Agregar seguimiento">
          <IconButton color="primary" onClick={handleAbrirModalNuevo} size="large" sx={{ borderRadius: 2 }}>
            <PersonAddAltIcon fontSize="large" />
          </IconButton>
        </Tooltip>
      </Box>

      {loadingSeguimientos ? (
        <Box p={4} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        seguimientosByStatus.map(({ status, rows }) =>
          rows.length > 0 && (
            <Box key={status} mb={4}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="primary"
                mb={1}
                mt={2}
                sx={{ textTransform: "capitalize", display: 'flex', alignItems: 'center' }}
              >
                {ESTATUS_LABELS[status] || status}
                <Chip
                  size="small"
                  color={ESTATUS_COLORS[status] || "default"}
                  label={`${rows.length}`}
                  sx={{ ml: 1, fontWeight: 700 }}
                />
              </Typography>
              <Paper variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Correo</TableCell>
                      <TableCell>Temperatura</TableCell>
                      <TableCell>Unidad/Proyecto interés</TableCell>
                      <TableCell>Fecha Próx. Seguimiento</TableCell>
                      <TableCell>Comentarios</TableCell>
                      <TableCell align="center">Ver</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((s) => {
                      const prospecto = prospectos.find(p => p.id === s.idprospecto)
                      return (
                        <TableRow key={s.id}>
                          <TableCell>{prospecto?.nombreCompleto ?? ''}</TableCell>
                          <TableCell>{prospecto?.correoElectronico ?? ''}</TableCell>
                          <TableCell>{s.temperaturaInteres}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {s.unidadInteres || s.proyectoInteres}
                            </Box>
                          </TableCell>
                          <TableCell>{s.fechaProximoSeguimiento}</TableCell>
                          <TableCell>{s.comentarios}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="Ver seguimiento">
                              <IconButton onClick={() => handleAbrirModalVer(s)} size="small">
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          )
        )
      )}

      <SeguimientoModal
        open={modalOpen}
        seguimiento={seguimientoLocal || initialSeguimiento()}
        prospectos={prospectos}
        onChange={handleChange}
        onClose={() => setModalOpen(false)}
        onSave={handleGuardarSeguimiento}
        proyectos={proyectos}
        propiedades={propiedades}
        readOnly={false}
      />
    </Box>
  )
}

export default SeguimientosTab
