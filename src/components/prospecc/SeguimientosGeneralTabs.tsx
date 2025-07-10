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
  useFetchUsuarios     // <-- nuevo hook para traer la lista de usuarios
} from '../../hooks/useFetchFunctions'
import { Seguimiento } from '../../config/types'
import SeguimientoModal from './SeguimientoModal'
import { useStatusChip } from '../../config/context/useStatusChip'
import Spinner from '../general/Spinner'
import { fechaActual } from '../../hooks/useDateUtils'

interface Props {
  userid: string
}

const SeguimientosGeneralTab: React.FC<Props> = ({ userid }) => {
  const { showStatus } = useStatusChip()
  const { seguimientos, loading: loadingSeguimientos } = useFetchSeguimientos()
  const { prospectos } = useFetchProspectos()
  const { proyectos } = useFetchProyects()
  const { propiedades } = useFetchPropiedades()
  const { usuarios } = useFetchUsuarios() // trae [{ id, correoElectronico, ... }, ...]

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
    estatusSeguimiento: 'activo'
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

  return (
    <Box>
      {loading && <Spinner open={true} />}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700} color="primary">
          Seguimientos
        </Typography>
      </Box>

      <Paper variant="outlined">
        {loadingSeguimientos ? (
          <Box p={4} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
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
              {!seguimientos || seguimientos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography color="text.secondary" align="center">
                      Sin seguimientos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                seguimientos.map((s) => {
                  const prospecto = prospectos.find(p => p.id === s.idprospecto)
                  const usuario  = usuarios.find(u => u.id === s.userid)
                  const isActivo = s.estatusSeguimiento === 'activo'
                  return (
                    <TableRow key={s.id}>
                      {/* Columna Usuario (correo) */}
                      <TableCell>
                        {usuario?.email ?? ''}
                      </TableCell>

                      {/* Datos del prospecto */}
                      <TableCell>{prospecto?.nombreCompleto ?? ''}</TableCell>
                      <TableCell>{prospecto?.correoElectronico ?? ''}</TableCell>

                      {/* Estatus */}
                      <TableCell>
                        <Chip
                          label={isActivo ? 'Activo' : 'Cerrado'}
                          size="small"
                          color={isActivo ? 'success' : 'default'}
                          variant="outlined"
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
        )}
      </Paper>

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
