import React, { useState } from 'react'
import {
  Box, Typography, IconButton, Paper, Tooltip, Table, TableBody, TableCell,
  TableHead, TableRow, CircularProgress, Chip
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  updateSeguimiento,
  useFetchPropiedades,
  useFetchProspectos,
  useFetchProyects,
  useFetchSeguimientos,
  useFetchUsuarios
} from '../../hooks/useFetchFunctions'
import { Seguimiento } from '../../config/types'
import SeguimientoModal from './SeguimientoModal'
import { useStatusChip } from '../../config/context/useStatusChip'
import Spinner from '../general/Spinner'
import { fechaActual } from '../../hooks/useDateUtils'

interface Props {
  userid: string
}

const ESTATUS_LIST = [
  'contactado',
  'interaccion',
  'cotizacion',
  'visita',
  'posible',
  'apartado',
  'vendido'
] as const;

const ESTATUS_LABEL: Record<(typeof ESTATUS_LIST)[number], string> = {
  contactado:   'Contactado',
  interaccion:  'Interacción',
  cotizacion:   'Cotización',
  visita:       'Visita',
  posible:      'Posible',
  apartado:     'Apartado',
  vendido:      'Vendido'
}

const COLOR_CHIP: Record<string, "default" | "primary" | "success" | "warning" | "info" | "error" | "secondary"> = {
  contactado:   'default',
  interaccion:  'info',
  cotizacion:   'primary',
  visita:       'secondary',
  posible:      'warning',
  apartado:     'success',
  vendido:      'error'
}

const SeguimientosGeneralTab: React.FC<Props> = ({ userid }) => {
  const { showStatus } = useStatusChip()
  const { seguimientos, loading: loadingSeguimientos } = useFetchSeguimientos()
  const { prospectos } = useFetchProspectos()
  const { proyectos } = useFetchProyects()
  const { propiedades } = useFetchPropiedades()
  const { usuarios } = useFetchUsuarios()

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

  // Agrupa los seguimientos por estatus
  const seguimientosByEstatus: Record<string, Seguimiento[]> = {};
  ESTATUS_LIST.forEach(status => {
    seguimientosByEstatus[status] = [];
  });
  if (seguimientos) {
    seguimientos.forEach(s => {
      if (ESTATUS_LIST.includes(s.estatusSeguimiento as any)) {
        seguimientosByEstatus[s.estatusSeguimiento].push(s);
      }
    });
  }

  return (
    <Box>
      {loading && <Spinner open={true} />}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700} color="primary">
          Seguimientos
        </Typography>
      </Box>
      {loadingSeguimientos ? (
        <Paper variant="outlined">
          <Box p={4} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        </Paper>
      ) : (
        ESTATUS_LIST.map(estatus => (
          <Box key={estatus} mb={4}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color="text.secondary"
              sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}
            >
              <Chip
                label={ESTATUS_LABEL[estatus]}
                color={COLOR_CHIP[estatus]}
                size="small"
                sx={{ fontWeight: 700, fontSize: 14, px: 2, borderRadius: 1.5, mr: 1 }}
              />
              {`(${seguimientosByEstatus[estatus].length})`}
            </Typography>
            <Paper variant="outlined" sx={{ mb: 2, borderLeft: `5px solid var(--primary-color, #1976d2)` }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Correo</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell>Temperatura</TableCell>
                    <TableCell>Unidad/Proyecto interés</TableCell>
                    <TableCell>Fecha Próx. Seguimiento</TableCell>
                    <TableCell>Comentarios</TableCell>
                    <TableCell align="center">Ver</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {seguimientosByEstatus[estatus].length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Typography color="text.secondary" align="center" fontSize={14}>
                          Sin seguimientos en este estatus
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    seguimientosByEstatus[estatus].map((s) => {
                      const prospecto = prospectos.find(p => p.id === s.idprospecto)
                      const usuario = usuarios.find(u => u.id === s.userid)
                      return (
                        <TableRow key={s.id}>
                          <TableCell>
                            {usuario?.email ?? ''}
                          </TableCell>
                          <TableCell>{prospecto?.nombreCompleto ?? ''}</TableCell>
                          <TableCell>{prospecto?.correoElectronico ?? ''}</TableCell>
                          <TableCell>
                            <Chip
                              label={ESTATUS_LABEL[s.estatusSeguimiento as typeof ESTATUS_LIST[number]]}
                              color={COLOR_CHIP[s.estatusSeguimiento]}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
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
                    })
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        ))
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

export default SeguimientosGeneralTab
