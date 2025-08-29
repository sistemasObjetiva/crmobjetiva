import React, { useMemo, useState } from 'react'
import {
  Box, Typography, IconButton, Paper, Tooltip, Table, TableBody, TableCell,
  TableHead, TableRow, CircularProgress, Button, Chip,
  FormControl, InputLabel, Select, MenuItem, TextField, TableSortLabel
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
import { ESTATUS_OPCIONES, Prospecto, Seguimiento } from '../../config/types'
import SeguimientoModal from './SeguimientoModal'
import { useStatusChip } from '../../config/context/useStatusChip'
import Spinner from '../general/Spinner'
import { fechaActual } from '../../hooks/useDateUtils'
import { getEstatusChip } from '../../hooks/useUtilsFunctions'
import * as XLSX from 'xlsx'
import SignedAvatar from '../general/SignedAvatar'

interface Props { userid: string }

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '')

const getUserId = (u: any) => u?.id ?? u?.uid ?? null
const getUserEmail = (u: any) => u?.email ?? u?.correo ?? u?.correoElectronico ?? ''
const getUserName = (u: any) => u?.nombre ?? u?.displayName ?? u?.name ?? ''

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
      {ids.map((id) => {
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

  // 🔎 Filtro por usuario (topbar)
  const [filtroUsuarioId, setFiltroUsuarioId] = useState<string>('')

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
      showStatus(err?.message ? `Error al guardar seguimiento: ${err.message}` : 'Error al guardar seguimiento', 'error')
    } finally {
      setModalOpen(false)
      setSeguimientoLocal(null)
      setLoading(false)
    }
  }

  // Usuarios y accesos rápidos
  const usuariosById = useMemo(() => {
    const map = new Map<string, any>()
    ;(usuarios ?? []).forEach(u => {
      const id = getUserId(u)
      if (id != null) map.set(String(id), u)
    })
    return map
  }, [usuarios])

  // Agrupo por estatus
  const seguimientosByEstatus: Record<string, Seguimiento[]> = useMemo(() => {
    const groups: Record<string, Seguimiento[]> = {}
    ESTATUS_OPCIONES.forEach(s => (groups[s.value] = []))
    ;(seguimientos ?? []).forEach(s => {
      if (groups[s.estatusSeguimiento] !== undefined) groups[s.estatusSeguimiento].push(s)
    })
    Object.values(groups).forEach(arr =>
      arr.sort((a,b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime())
    )
    return groups
  }, [seguimientos])

  const prospectosById = useMemo(() => {
    const map = new Map<string, Prospecto>()
     ;(prospectos ?? []).forEach(p => {
       if (p?.id) map.set(p.id, p)
     })
     return map
   }, [prospectos])

  const handleExportExcel = () => {
    const all = (seguimientos ?? [])
    const filtered = filtroUsuarioId ? all.filter(s => String(s.userid) === filtroUsuarioId) : all
    const rows = filtered.map(s => {
      const u = usuariosById.get(String(s.userid))
      return { ...s, usuarioEmail: getUserEmail(u) }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Seguimientos')
    XLSX.writeFile(wb, 'seguimientos.xlsx')
  }

  const getUserLabelById = (id: string) => {
    const u = usuariosById.get(String(id))
    if (!u) return '—'
    const name = getUserName(u)
    const email = getUserEmail(u)
    return name && email ? `${name} (${email})` : (name || email || '—')
  }

  // -------- ORDEN + FILTROS EN HEADER --------
  type Order = 'asc' | 'desc'
  type OrderByKey =
    | 'usuario' | 'nombre' | 'correo' | 'temperatura' | 'unidad'
    | 'fechaProximo' | 'fechaActualizacion'

  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderByKey>('fechaProximo')
  const [filters, setFilters] = useState({
    usuarioId: '',  // sincronizable con filtro superior
    nombre: '',
    correo: '',
    temperatura: '',
    unidad: '',
    proyectoTexto: '',
    fechaProximo: '',
    fechaActualizacion: '',
    comentarios: '',
  })

  // sincroniza ambos select de usuario si quieres
  const setUsuarioId = (id: string) => {
    setFiltroUsuarioId(id)
    setFilters(f => ({ ...f, usuarioId: id }))
  }

  const handleRequestSort = (key: OrderByKey) => {
    if (orderBy === key) setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else { setOrderBy(key); setOrder('asc') }
  }

  const normalize = (s?: string | null) =>
    (s ?? '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const matches = (v?: string | null, n = '') => normalize(v).includes(normalize(n))
  const compare = <T,>(a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0)

  const idToLabel = useMemo(() => {
    const map = new Map<string, string>()
    proyectos.forEach(p => map.set(p.id, p.nombre))
    propiedades.forEach(p => map.set(p.id, p.tituloPropiedad))
    return map
  }, [proyectos, propiedades])

  const getUsuarioEmailById = (id?: string) => {
    if (!id) return ''
    const u = usuariosById.get(String(id))
    return getUserEmail(u)
  }

  const filterAndSort = (arr: Seguimiento[]) => {
    let base = arr
    if (filters.usuarioId) base = base.filter(s => String(s.userid) === filters.usuarioId)

    const filtrada = base.filter(s => {
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
        case 'usuario':
          cmp = compare(normalize(getUsuarioEmailById(String(a.userid))), normalize(getUsuarioEmailById(String(b.userid)))); break
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

  return (
    <Box>
      {loading && <Spinner open={true} />}

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700} color="primary">Seguimientos</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel id="filter-user-label">Filtrar por usuario</InputLabel>
            <Select
              labelId="filter-user-label"
              label="Filtrar por usuario"
              value={filtroUsuarioId}
              onChange={(e) => setUsuarioId(String(e.target.value))}
            >
              <MenuItem value=""><em>Todos</em></MenuItem>
              {(usuarios ?? []).map(u => {
                const id = getUserId(u)
                if (id == null) return null
                return (
                  <MenuItem key={String(id)} value={String(id)}>
                    {getUserLabelById(String(id))}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>

          <Button variant="outlined" color="primary" onClick={handleExportExcel}>
            Descargar Excel
          </Button>
        </Box>
      </Box>

      {loadingSeguimientos ? (
        <Paper variant="outlined">
          <Box p={4} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        </Paper>
      ) : (
        ESTATUS_OPCIONES.map(estatus => {
          const grupo = seguimientosByEstatus[estatus.value] ?? []
          // Aplica filtro superior + header
          const rows = filterAndSort(
            filtroUsuarioId ? grupo.filter(s => String(s.userid) === filtroUsuarioId) : grupo
          )

          return (
            <Box key={estatus.value} mb={4}>
              <Box display="flex" alignItems="center" gap={1} mb={1}
                sx={{ textTransform: 'uppercase', letterSpacing: 1, minHeight: 40 }}>
                {getEstatusChip(estatus.value)}
                <Typography variant="subtitle1" fontWeight={700} color="text.secondary"
                  sx={{ lineHeight: 1, mb: 0, fontSize: 17, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {`(${rows.length})`}
                </Typography>
              </Box>

              <Paper variant="outlined" sx={{ mb: 2, borderLeft: `5px solid var(--primary-color, #1976d2)`, overflowX: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    {/* Títulos con sort */}
                    <TableRow>
                      <TableCell sortDirection={orderBy === 'usuario' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'usuario'}
                          direction={orderBy === 'usuario' ? order : 'asc'}
                          onClick={() => handleRequestSort('usuario')}
                        >
                          Usuario (email)
                        </TableSortLabel>
                      </TableCell>
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
                      <TableCell>Estatus</TableCell>
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
                        <Select size="small" fullWidth displayEmpty
                          value={filters.usuarioId}
                          onChange={e => setUsuarioId(String(e.target.value))}>
                          <MenuItem value=""><em>Todos</em></MenuItem>
                          {(usuarios ?? []).map(u => {
                            const id = getUserId(u); if (id == null) return null
                            return (
                              <MenuItem key={String(id)} value={String(id)}>
                                {getUserEmail(u)}
                              </MenuItem>
                            )
                          })}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Filtrar nombre…"
                          value={filters.nombre} onChange={e => setFilters(f => ({ ...f, nombre: e.target.value }))}/>
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Filtrar correo…"
                          value={filters.correo} onChange={e => setFilters(f => ({ ...f, correo: e.target.value }))}/>
                      </TableCell>
                      <TableCell />{/* estatus visual */}
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Filtrar temperatura…"
                          value={filters.temperatura} onChange={e => setFilters(f => ({ ...f, temperatura: e.target.value }))}/>
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Filtrar unidad/proyecto…"
                          value={filters.unidad} onChange={e => setFilters(f => ({ ...f, unidad: e.target.value }))}/>
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Proyecto/Propiedad (chips)…"
                          value={filters.proyectoTexto} onChange={e => setFilters(f => ({ ...f, proyectoTexto: e.target.value }))}/>
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth type="date"
                          value={filters.fechaProximo} onChange={e => setFilters(f => ({ ...f, fechaProximo: e.target.value }))}/>
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth type="date"
                          value={filters.fechaActualizacion} onChange={e => setFilters(f => ({ ...f, fechaActualizacion: e.target.value }))}/>
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Filtrar comentarios…"
                          value={filters.comentarios} onChange={e => setFilters(f => ({ ...f, comentarios: e.target.value }))}/>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Limpiar filtros">
                          <IconButton size="small" onClick={() => {
                            setFilters({
                              usuarioId:'', nombre:'', correo:'', temperatura:'', unidad:'',
                              proyectoTexto:'', fechaProximo:'', fechaActualizacion:'', comentarios:''
                            })
                            setFiltroUsuarioId('')
                          }}>
                            <span style={{ fontWeight:700 }}>✕</span>
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11}>
                          <Typography color="text.secondary" align="center" fontSize={14}>
                            Sin seguimientos en este estatus
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((s) => {
                        const prospecto = prospectosById.get(s.idprospecto)
                        const usuario = usuariosById.get(String(s.userid))
                        return (
                          <TableRow key={s.id}>
                            <TableCell>{getUserEmail(usuario)}</TableCell>
                            <TableCell>{prospecto?.nombreCompleto ?? ''}</TableCell>
                            <TableCell>{prospecto?.correoElectronico ?? ''}</TableCell>
                            <TableCell>{getEstatusChip(s.estatusSeguimiento)}</TableCell>
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
        onChange={(field, value) => setSeguimientoLocal(prev => prev ? { ...prev, [field]: value } : null)}
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
