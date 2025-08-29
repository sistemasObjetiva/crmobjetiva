import React, { useMemo, useState } from 'react'
import {
  Box, Typography, IconButton, Paper, Tooltip, Table, TableBody, TableCell,
  TableHead, TableRow, CircularProgress, Chip, TextField, Autocomplete, TableSortLabel
} from '@mui/material'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { updateProspecto, useFetchPropiedades, useFetchProspectosUser, useFetchProyects } from '../../hooks/useFetchFunctions'
import { Prospecto } from '../../config/types'
import NuevoProspectoModal from './ProspectoModal'
import { useStatusChip } from '../../config/context/useStatusChip'
import Spinner from '../general/Spinner'
import SignedAvatar from '../general/SignedAvatar'

interface ProspectosTabProps {
  userid: string
}

type Order = 'asc' | 'desc'
type OrderByKey =
  | 'nombreCompleto'
  | 'correoElectronico'
  | 'celular'
  | 'clasificacionCliente'
  | 'fechaCreacion'
  | 'proyectosInteres' // ordena por cantidad de intereses

const ProspectosTab: React.FC<ProspectosTabProps> = ({ userid }) => {
  const { showStatus } = useStatusChip()
  const { prospectos, loading: loadingProspectos } = useFetchProspectosUser(userid!)
  const { proyectos } = useFetchProyects()
  const { propiedades } = useFetchPropiedades()
  const [modalOpen, setModalOpen] = useState(false)
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState<Prospecto | null>(null)
  const [loading, setLoading] = useState(false)
console.log(userid)
  // ----------------- NUEVO: estado de filtros y orden -----------------
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderByKey>('fechaCreacion')

  const [filters, setFilters] = useState({
    nombre: '',
    correo: '',
    celular: '',
    clasificacion: '',
    proyectoTexto: '', // filtra por texto en nombre de proyecto/propiedad
    fecha: '', // yyyy-mm-dd
  })

  // Opciones de autocomplete (proyectos + propiedades)
  const opcionesProyecto = useMemo(() => {
    const arr = [
      ...proyectos.map(p => ({ id: p.id, label: p.nombre })),
      ...propiedades.map(p => ({ id: p.id, label: p.tituloPropiedad })),
    ]
    // único por label
    const seen = new Set<string>()
    return arr.filter(o => {
      if (seen.has(o.label)) return false
      seen.add(o.label)
      return true
    })
  }, [proyectos, propiedades])

  // Mapa id -> label para render y filtrados
  const idToLabel = useMemo(() => {
    const map = new Map<string, string>()
    proyectos.forEach(p => map.set(p.id, p.nombre))
    propiedades.forEach(p => map.set(p.id, p.tituloPropiedad))
    return map
  }, [proyectos, propiedades])

  const handleRequestSort = (key: OrderByKey) => {
    if (orderBy === key) {
      setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setOrderBy(key)
      setOrder('asc')
    }
  }

  // ----------------- helpers -----------------
  const normalize = (s: string | undefined | null) =>
    (s ?? '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

  const matches = (value: string | undefined | null, needle: string) =>
    normalize(value).includes(normalize(needle))

  const compare = <T,>(a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0)

  const sortComparator = (a: Prospecto, b: Prospecto) => {
    let cmp = 0
    switch (orderBy) {
      case 'nombreCompleto':
        cmp = compare(normalize(a.nombreCompleto), normalize(b.nombreCompleto))
        break
      case 'correoElectronico':
        cmp = compare(normalize(a.correoElectronico), normalize(b.correoElectronico))
        break
      case 'celular':
        cmp = compare(normalize(a.celular), normalize(b.celular))
        break
      case 'clasificacionCliente':
        cmp = compare(normalize(a.clasificacionCliente), normalize(b.clasificacionCliente))
        break
      case 'proyectosInteres':
        cmp = compare(a.proyectosInteres?.length ?? 0, b.proyectosInteres?.length ?? 0)
        break
      case 'fechaCreacion':
      default: {
        const da = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0
        const db = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0
        cmp = compare(da, db)
      }
    }
    return order === 'asc' ? cmp : -cmp
  }

  // ----------------- Filtrado + Orden -----------------
  const rows = useMemo(() => {
    const list = (prospectos ?? []).filter(Boolean)

    const filtrada = list.filter(p => {
      // nombre, correo, celular
      if (filters.nombre && !matches(p.nombreCompleto, filters.nombre)) return false
      if (filters.correo && !matches(p.correoElectronico, filters.correo)) return false
      if (filters.celular && !matches(p.celular, filters.celular)) return false

      // clasificacion (exacto si eliges del dropdown, o substring si tecleas)
      if (filters.clasificacion) {
        const c = normalize(filters.clasificacion)
        const pc = normalize(p.clasificacionCliente)
        if (!pc.includes(c)) return false
      }

      // proyectoTexto: busca en labels de ids de proyectosInteres
      if (filters.proyectoTexto) {
        const needle = normalize(filters.proyectoTexto)
        const anyMatch =
          (p.proyectosInteres ?? []).some(id => normalize(idToLabel.get(id) ?? '').includes(needle))
        if (!anyMatch) return false
      }

      // fecha = fechaCreacion (yyyy-mm-dd)
      if (filters.fecha) {
        const fechaRow = p.fechaCreacion ? new Date(p.fechaCreacion) : null
        const fechaStr = fechaRow
          ? `${fechaRow.getFullYear()}-${String(fechaRow.getMonth() + 1).padStart(2, '0')}-${String(
              fechaRow.getDate()
            ).padStart(2, '0')}`
          : ''
        if (fechaStr !== filters.fecha) return false
      }

      return true
    })

    return [...filtrada].sort(sortComparator)
  }, [prospectos, filters, order, orderBy, idToLabel])

  // ----------------- resto de tu lógica -----------------
  const initialProspecto = (): Prospecto => ({
    id: crypto.randomUUID(),
    userid,
    nombreCompleto: '',
    correoElectronico: '',
    celular: '',
    ocupacionCliente: '',
    edoCivilCliente: '',
    clasificacionCliente: '',
    medioCaptacion: '',
    proyectosInteres: [],
  })

  const handleAbrirModalNuevo = () => {
    setProspectoSeleccionado(initialProspecto())
    setModalOpen(true)
  }

  const handleAbrirModalVer = (prospecto: Prospecto) => {
    setProspectoSeleccionado(prospecto)
    setModalOpen(true)
  }

  const handleGuardarProspecto = async (p: Prospecto) => {
    setLoading(true)
    try {
      await updateProspecto(p)
      showStatus('Prospecto guardado exitosamente', 'success')
    } catch (err: any) {
      console.error(err)
      showStatus(
        err?.message
          ? `Error al guardar prospecto: ${err.message}`
          : 'Error al guardar prospecto',
        'error'
      )
    } finally {
      setModalOpen(false)
      setProspectoSeleccionado(null)
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Prospecto, value: any) => {
    setProspectoSeleccionado(prev => (prev ? { ...prev, [field]: value } : null))
  }

  // valores únicos de clasificación para sugerir (puedes cambiar por una lista fija)
  const opcionesClasificacion = useMemo(() => {
    const set = new Set<string>()
    ;(prospectos ?? []).forEach(p => p?.clasificacionCliente && set.add(p.clasificacionCliente))
    return Array.from(set)
  }, [prospectos])

  return (
    <Box>
      {loading && <Spinner open={true} />}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700} color="primary">
          Lista de prospectos
        </Typography>
        <Tooltip title="Agregar prospecto">
          <IconButton color="primary" onClick={handleAbrirModalNuevo} size="large" sx={{ borderRadius: 2 }}>
            <PersonAddAltIcon fontSize="large" />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper variant="outlined" sx={{ overflow: 'auto' }}>
        {loadingProspectos ? (
          <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              {/* Fila de títulos con sort */}
              <TableRow>
                <TableCell sortDirection={orderBy === 'nombreCompleto' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'nombreCompleto'}
                    direction={orderBy === 'nombreCompleto' ? order : 'asc'}
                    onClick={() => handleRequestSort('nombreCompleto')}
                  >
                    Nombre
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'correoElectronico' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'correoElectronico'}
                    direction={orderBy === 'correoElectronico' ? order : 'asc'}
                    onClick={() => handleRequestSort('correoElectronico')}
                  >
                    Correo
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'celular' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'celular'}
                    direction={orderBy === 'celular' ? order : 'asc'}
                    onClick={() => handleRequestSort('celular')}
                  >
                    Celular
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'clasificacionCliente' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'clasificacionCliente'}
                    direction={orderBy === 'clasificacionCliente' ? order : 'asc'}
                    onClick={() => handleRequestSort('clasificacionCliente')}
                  >
                    Clasificación
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'proyectosInteres' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'proyectosInteres'}
                    direction={orderBy === 'proyectosInteres' ? order : 'asc'}
                    onClick={() => handleRequestSort('proyectosInteres')}
                  >
                    Proyecto(s) interés
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'fechaCreacion' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'fechaCreacion'}
                    direction={orderBy === 'fechaCreacion' ? order : 'asc'}
                    onClick={() => handleRequestSort('fechaCreacion')}
                  >
                    Fecha creación
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Ver</TableCell>
              </TableRow>

              {/* Fila de filtros integrada en el header */}
              <TableRow>
                <TableCell>
                  <TextField
                    value={filters.nombre}
                    onChange={e => setFilters(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Filtrar nombre…"
                    size="small"
                    fullWidth
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={filters.correo}
                    onChange={e => setFilters(f => ({ ...f, correo: e.target.value }))}
                    placeholder="Filtrar correo…"
                    size="small"
                    fullWidth
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={filters.celular}
                    onChange={e => setFilters(f => ({ ...f, celular: e.target.value }))}
                    placeholder="Filtrar celular…"
                    size="small"
                    fullWidth
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Autocomplete
                    freeSolo
                    options={opcionesClasificacion}
                    value={filters.clasificacion}
                    onInputChange={(_, val) => setFilters(f => ({ ...f, clasificacion: val ?? '' }))}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Filtrar clasificación…" size="small" />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Autocomplete
                    freeSolo
                    options={opcionesProyecto.map(o => o.label)}
                    value={filters.proyectoTexto}
                    onInputChange={(_, val) => setFilters(f => ({ ...f, proyectoTexto: val ?? '' }))}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Proyecto/Propiedad…" size="small" />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="date"
                    value={filters.fecha}
                    onChange={e => setFilters(f => ({ ...f, fecha: e.target.value }))}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Limpiar filtros">
                    <IconButton
                      size="small"
                      onClick={() =>
                        setFilters({ nombre: '', correo: '', celular: '', clasificacion: '', proyectoTexto: '', fecha: '' })
                      }
                    >
                      {/* Ícono minimalista: un círculo con X, puedes usar otro si prefieres */}
                      <span style={{ fontWeight: 700 }}>✕</span>
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {!rows || rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary" align="center">
                      {prospectos?.length ? 'Sin resultados con los filtros actuales' : 'Sin prospectos registrados'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((p) => (
                  <TableRow key={p.id ?? p.correoElectronico ?? Math.random()}>
                    <TableCell>{p.nombreCompleto}</TableCell>
                    <TableCell>{p.correoElectronico}</TableCell>
                    <TableCell>{p.celular}</TableCell>
                    <TableCell>{p.clasificacionCliente}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(p.proyectosInteres ?? []).map((id) => {
                          // Buscar si es un proyecto
                          const proy = proyectos.find(x => x.id === id)
                          if (proy) {
                            return (
                              <Chip
                                key={id}
                                label={proy.nombre}
                                avatar={
                                  proy.logo && (
                                    <SignedAvatar
                                      value={proy.logo}
                                      alt={proy.nombre}
                                      sx={{ width: 24, height: 24 }}
                                    />
                                  )
                                }
                                size="small"
                                sx={{ mr: 0.5, bgcolor: 'transparent' }}
                              />
                            )
                          }
                          // Si no, buscar si es una propiedad
                          const prop = propiedades.find(x => x.id === id)
                          if (prop) {
                            return (
                              <Chip
                                key={id}
                                label={prop.tituloPropiedad}
                                avatar={
                                  prop.imagenes?.length ? (
                                    <SignedAvatar
                                      value={prop.imagenes[0]}
                                      alt={prop.tituloPropiedad}
                                      sx={{ width: 24, height: 24 }}
                                    />
                                  ) : undefined
                                }
                                size="small"
                                sx={{ mr: 0.5, bgcolor: 'transparent' }}
                              />
                            )
                          }
                          return null // Si no encontró nada
                        })}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {p.fechaCreacion ? new Date(p.fechaCreacion).toLocaleDateString() : ''}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver prospecto">
                        <IconButton onClick={() => handleAbrirModalVer(p)} size="small">
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <NuevoProspectoModal
        open={modalOpen}
        prospecto={prospectoSeleccionado || initialProspecto()}
        onChange={handleChange}
        onClose={() => setModalOpen(false)}
        onSave={handleGuardarProspecto}
        proyectos={proyectos}
        propiedades={propiedades}
        readOnly={false}
      />
    </Box>
  )
}

export default ProspectosTab
