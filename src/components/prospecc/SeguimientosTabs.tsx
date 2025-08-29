import React, { useMemo, useState } from 'react'
import {
  Box, Typography, IconButton, Paper, Tooltip, Table, TableBody, TableCell,
  TableHead, TableRow, CircularProgress, Chip, TextField, TableSortLabel
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
import { Prospecto, Seguimiento } from '../../config/types'
import SeguimientoModal from './SeguimientoModal'
import { useStatusChip } from '../../config/context/useStatusChip'
import Spinner from '../general/Spinner'
import { fechaActual } from '../../hooks/useDateUtils'
import SignedAvatar from '../general/SignedAvatar'
import { getEstatusChip } from '../../hooks/useUtilsFunctions'

const ESTATUS_LIST = [
  'contactado', 'interaccion', 'cotizacion', 'visita', 'posible', 'apartado', 'vendido','descartado'
] as const

interface Props { userid: string }

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '')

/** Chips reutilizables de proyectos/propiedades de interés */
function ProyectosInteresChips({
  ids,
  proyectos,
  propiedades,
}: {
  ids: string[] | undefined
  proyectos: any[]
  propiedades: any[]
}) {
  if (!ids || ids.length === 0) return null
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {ids.map((id: string)  => {
        const proy = proyectos.find((x: any) => x.id === id)
        if (proy) {
          return (
            <Chip
              key={id}
              label={proy.nombre}
              avatar={proy.logo ? (
                <SignedAvatar value={proy.logo} alt={proy.nombre} sx={{ width: 24, height: 24 }} />
              ) : undefined}
              size="small"
              sx={{ mr: 0.5, bgcolor: 'transparent' }}
            />
          )
        }
        const prop = propiedades.find((x: any) => x.id === id)
        if (prop) {
          return (
            <Chip
              key={id}
              label={prop.tituloPropiedad}
              avatar={prop.imagenes?.length ? (
                <SignedAvatar value={prop.imagenes[0]} alt={prop.tituloPropiedad} sx={{ width: 24, height: 24 }} />
              ) : undefined}
              size="small"
              sx={{ mr: 0.5, bgcolor: 'transparent' }}
            />
          )
        }
        return null
      })}
    </Box>
  )
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


 const prospectosById = useMemo(() => {
  const map = new Map<string, Prospecto>()
   ;(prospectos ?? []).forEach(p => {
     if (p?.id) map.set(p.id, p)
   })
   return map
 }, [prospectos])


  // Prospectos sin seguimiento
  const prospectosSinSeguimiento = useMemo(() => {
    const segIds = new Set((seguimientos ?? []).map(s => s.idprospecto))
    return (prospectos ?? []).filter(p => !segIds.has(p.id))
  }, [prospectos, seguimientos])

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
      showStatus(err?.message ? `Error al guardar seguimiento: ${err.message}` : 'Error al guardar seguimiento', 'error')
    } finally {
      setModalOpen(false)
      setSeguimientoLocal(null)
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Seguimiento, value: any) => {
    setSeguimientoLocal(prev => prev ? { ...prev, [field]: value } : null)
  }

  // -------- ORDEN + FILTROS EN HEADER --------
  type Order = 'asc' | 'desc'
  type OrderByKey =
    | 'nombre' | 'correo' | 'temperatura' | 'unidad'
    | 'fechaProximo' | 'fechaActualizacion'

  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderByKey>('fechaProximo')
  const [filters, setFilters] = useState({
    nombre: '',
    correo: '',
    temperatura: '',
    unidad: '',
    proyectoTexto: '',
    fechaProximo: '',
    fechaActualizacion: '',
    comentarios: '',
  })

  const handleRequestSort = (key: OrderByKey) => {
    if (orderBy === key) setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else { setOrderBy(key); setOrder('asc') }
  }

  const normalize = (s?: string | null) =>
    (s ?? '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const matches = (val?: string | null, needle = '') =>
    normalize(val).includes(normalize(needle))
  const compare = <T,>(a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0)

  // id -> label proyecto/propiedad
  const idToLabel = useMemo(() => {
    const map = new Map<string, string>()
    proyectos.forEach(p => map.set(p.id, p.nombre))
    propiedades.forEach(p => map.set(p.id, p.tituloPropiedad))
    return map
  }, [proyectos, propiedades])

  const filterAndSort = (arr: Seguimiento[]) => {
    const filtrada = arr.filter(s => {
      const prosp = prospectosById.get(s.idprospecto)
      if (!prosp) return false

      if (filters.nombre && !matches(prosp.nombreCompleto, filters.nombre)) return false
      if (filters.correo && !matches(prosp.correoElectronico, filters.correo)) return false
      if (filters.temperatura && !matches(s.temperaturaInteres, filters.temperatura)) return false
      if (filters.unidad && !matches(s.unidadInteres || s.proyectoInteres, filters.unidad)) return false

      if (filters.proyectoTexto) {
        const needle = normalize(filters.proyectoTexto)
        const anyMatch = (prosp.proyectosInteres ?? [])
          .some(id => normalize(idToLabel.get(id) ?? '').includes(needle))
        if (!anyMatch) return false
      }

      const toYMD = (iso?: string) => {
        const d = iso ? new Date(iso) : null
        return d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : ''
      }
      if (filters.fechaProximo && toYMD(s.fechaProximoSeguimiento) !== filters.fechaProximo) return false
      if (filters.fechaActualizacion && toYMD(s.fechaActualizacion) !== filters.fechaActualizacion) return false

      if (filters.comentarios && !matches(s.comentarios, filters.comentarios)) return false
      return true
    })

    const sorted = [...filtrada].sort((a,b) => {
      let cmp = 0
      const pa = prospectosById.get(a.idprospecto)
      const pb = prospectosById.get(b.idprospecto)
      switch (orderBy) {
        case 'nombre':
          cmp = compare(normalize(pa?.nombreCompleto), normalize(pb?.nombreCompleto)); break
        case 'correo':
          cmp = compare(normalize(pa?.correoElectronico), normalize(pb?.correoElectronico)); break
        case 'temperatura':
          cmp = compare(normalize(a.temperaturaInteres), normalize(b.temperaturaInteres)); break
        case 'unidad':
          cmp = compare(normalize(a.unidadInteres || a.proyectoInteres), normalize(b.unidadInteres || b.proyectoInteres)); break
        case 'fechaActualizacion': {
          const da = a.fechaActualizacion ? new Date(a.fechaActualizacion).getTime() : 0
          const db = b.fechaActualizacion ? new Date(b.fechaActualizacion).getTime() : 0
          cmp = compare(da, db); break
        }
        case 'fechaProximo':
        default: {
          const da = a.fechaProximoSeguimiento ? new Date(a.fechaProximoSeguimiento).getTime() : 0
          const db = b.fechaProximoSeguimiento ? new Date(b.fechaProximoSeguimiento).getTime() : 0
          cmp = compare(da, db); break
        }
      }
      return order === 'asc' ? cmp : -cmp
    })
    return sorted
  }

  // mismo orden visual del general; luego aplicamos filtros/orden
  const historialOrdenado = useMemo(
    () => [...(seguimientos ?? [])].sort(
      (a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
    ),
    [seguimientos]
  )

  return (
    <Box>
      {loading && <Spinner open={true} />}

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700} color="primary">Seguimientos</Typography>
        <Tooltip title="Agregar seguimiento">
          <IconButton color="primary" onClick={handleAbrirModalNuevo} size="large" sx={{ borderRadius: 2 }}>
            <PersonAddAltIcon fontSize="large" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Prospectos sin seguimiento */}
      {prospectosSinSeguimiento.length > 0 && (
        <Paper variant="outlined" sx={{ mb: 4, borderLeft: '5px solid orange', p: 2, overflowX: 'auto' }}>
          <Typography variant="subtitle1" fontWeight={700} color="warning.main" sx={{ mb: 1 }}>
            Prospectos sin seguimiento ({prospectosSinSeguimiento.length})
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Proyectos/Propiedades interés</TableCell>
                <TableCell align="center">Agregar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prospectosSinSeguimiento.map(prosp => (
                <TableRow key={prosp.id}>
                  <TableCell>{prosp.nombreCompleto ?? ''}</TableCell>
                  <TableCell>{prosp.correoElectronico ?? ''}</TableCell>
                  <TableCell>{prosp.celular ?? ''}</TableCell>
                  <TableCell>
                    <ProyectosInteresChips
                      ids={prosp.proyectosInteres}
                      proyectos={proyectos}
                      propiedades={propiedades}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Agregar seguimiento">
                      <IconButton
                        color="primary"
                        onClick={() => {
                          const nuevo = initialSeguimiento()
                          nuevo.idprospecto = prosp.id
                          setSeguimientoLocal(nuevo)
                          setModalOpen(true)
                        }}
                      >
                        <PersonAddAltIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {loadingSeguimientos ? (
        <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
      ) : (
        (ESTATUS_LIST as readonly string[]).map((status) => {
          const rows = filterAndSort(
            historialOrdenado.filter(s => s.estatusSeguimiento === status)
          )

          return (
            <Box key={status} mb={4}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="text.secondary"
                sx={{
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {getEstatusChip(status)}
                <Typography
                  component="span"
                  sx={{ ml: 1, fontWeight: 700, fontSize: 14 }}
                >
                  ({rows.length})
                </Typography>
              </Typography>


              <Paper variant="outlined" sx={{ mb: 2, borderLeft: `5px solid var(--primary-color, #1976d2)`, overflowX: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    {/* Títulos con sort */}
                    <TableRow>
                      <TableCell sortDirection={orderBy === 'nombre' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'nombre'}
                          direction={orderBy === 'nombre' ? order : 'asc'}
                          onClick={() => handleRequestSort('nombre')}
                        >
                          Nombre
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={orderBy === 'correo' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'correo'}
                          direction={orderBy === 'correo' ? order : 'asc'}
                          onClick={() => handleRequestSort('correo')}
                        >
                          Correo
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={orderBy === 'temperatura' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'temperatura'}
                          direction={orderBy === 'temperatura' ? order : 'asc'}
                          onClick={() => handleRequestSort('temperatura')}
                        >
                          Temperatura
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={orderBy === 'unidad' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'unidad'}
                          direction={orderBy === 'unidad' ? order : 'asc'}
                          onClick={() => handleRequestSort('unidad')}
                        >
                          Unidad/Proyecto interés
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Proyectos/Propiedades interés</TableCell>
                      <TableCell sortDirection={orderBy === 'fechaProximo' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'fechaProximo'}
                          direction={orderBy === 'fechaProximo' ? order : 'asc'}
                          onClick={() => handleRequestSort('fechaProximo')}
                        >
                          Fecha Próx. Seguimiento
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={orderBy === 'fechaActualizacion' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'fechaActualizacion'}
                          direction={orderBy === 'fechaActualizacion' ? order : 'asc'}
                          onClick={() => handleRequestSort('fechaActualizacion')}
                        >
                          Fecha actualización
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Comentarios</TableCell>
                      <TableCell align="center">Ver</TableCell>
                    </TableRow>

                    {/* Fila de filtros inline */}
                    <TableRow>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Filtrar nombre…"
                          value={filters.nombre}
                          onChange={e => setFilters(f => ({ ...f, nombre: e.target.value }))} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Filtrar correo…"
                          value={filters.correo}
                          onChange={e => setFilters(f => ({ ...f, correo: e.target.value }))} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Filtrar temperatura…"
                          value={filters.temperatura}
                          onChange={e => setFilters(f => ({ ...f, temperatura: e.target.value }))} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Filtrar unidad/proyecto…"
                          value={filters.unidad}
                          onChange={e => setFilters(f => ({ ...f, unidad: e.target.value }))} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Proyecto/Propiedad (chips)…"
                          value={filters.proyectoTexto}
                          onChange={e => setFilters(f => ({ ...f, proyectoTexto: e.target.value }))} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth type="date"
                          value={filters.fechaProximo}
                          onChange={e => setFilters(f => ({ ...f, fechaProximo: e.target.value }))} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth type="date"
                          value={filters.fechaActualizacion}
                          onChange={e => setFilters(f => ({ ...f, fechaActualizacion: e.target.value }))} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Filtrar comentarios…"
                          value={filters.comentarios}
                          onChange={e => setFilters(f => ({ ...f, comentarios: e.target.value }))} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Limpiar filtros">
                          <IconButton size="small" onClick={() => setFilters({
                            nombre:'', correo:'', temperatura:'', unidad:'', proyectoTexto:'',
                            fechaProximo:'', fechaActualizacion:'', comentarios:''
                          })}>
                            <span style={{ fontWeight:700 }}>✕</span>
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9}>
                          <Typography color="text.secondary" align="center" fontSize={14}>
                            Sin seguimientos en este estatus
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((s) => {
                        const prospecto = prospectosById.get(s.idprospecto)
                        return (
                          <TableRow key={s.id}>
                            <TableCell>{prospecto?.nombreCompleto ?? ''}</TableCell>
                            <TableCell>{prospecto?.correoElectronico ?? ''}</TableCell>
                            <TableCell>{s.temperaturaInteres}</TableCell>
                            <TableCell>{s.unidadInteres || s.proyectoInteres}</TableCell>
                            <TableCell>
                              <ProyectosInteresChips
                                ids={prospecto?.proyectosInteres}
                                proyectos={proyectos}
                                propiedades={propiedades}
                              />
                            </TableCell>
                            <TableCell>{fmtDate(s.fechaProximoSeguimiento)}</TableCell>
                            <TableCell>{fmtDate(s.fechaActualizacion)}</TableCell>
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
          )
        })
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
