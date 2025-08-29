import React, { useMemo, useState } from 'react'
import {
  Box, Typography, IconButton, Paper, Tooltip, Table, TableBody, TableCell,
  TableHead, TableRow, CircularProgress, Chip, Button, FormControl, InputLabel,
  Select, MenuItem, TextField, Autocomplete, TableSortLabel
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  updateProspecto,
  useFetchPropiedades,
  useFetchProspectos,
  useFetchProyects,
  useFetchUsuarios
} from '../../hooks/useFetchFunctions'
import { Prospecto } from '../../config/types'
import NuevoProspectoModal from './ProspectoModal'
import { useStatusChip } from '../../config/context/useStatusChip'
import Spinner from '../general/Spinner'
import SignedAvatar from '../general/SignedAvatar'
import * as XLSX from 'xlsx';

interface ProspectosTabProps {
  userid: string
}

// --- Helpers tolerantes a distintos nombres de campos ---
const getUserId = (u: any) => u?.id ?? u?.uid ?? u?.userId ?? null;
const getUserEmail = (u: any) => u?.email ?? u?.correo ?? u?.correoElectronico ?? '';
const getUserName = (u: any) => u?.nombre ?? u?.displayName ?? u?.name ?? getUserEmail(u) ?? '—';
const getProspectOwnerId = (p: any) => p?.userid

type Order = 'asc' | 'desc'
type OrderByKey =
  | 'nombreCompleto'
  | 'correoElectronico'
  | 'celular'
  | 'clasificacionCliente'
  | 'proyectosInteres'
  | 'usuario'         // ordena por email del usuario
  | 'fechaCreacion'

const ProspectosGeneralTab: React.FC<ProspectosTabProps> = ({ }) => {
  const { showStatus } = useStatusChip()
  const { usuarios } = useFetchUsuarios()
  const { prospectos, loading: loadingProspectos } = useFetchProspectos()
  const { proyectos } = useFetchProyects()
  const { propiedades } = useFetchPropiedades()

  const [modalOpen, setModalOpen] = useState(false)
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState<Prospecto | null>(null)
  const [loading, setLoading] = useState(false)

  // ----------------- Orden & Filtros -----------------
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderByKey>('fechaCreacion')

  // Filtro por usuario (arriba y en header; están sincronizados)
  const [filtroUsuarioId, setFiltroUsuarioId] = useState<string>('')

  const [filters, setFilters] = useState({
    nombre: '',
    correo: '',
    celular: '',
    clasificacion: '',
    proyectoTexto: '', // texto en nombre de proyecto/propiedad
    fecha: '',         // yyyy-mm-dd exacta
    usuarioId: '',     // sincronizado con filtroUsuarioId
  })

  // Mapa rápido de usuarios por id
  const usuariosById = useMemo(() => {
    const map = new Map<string, any>()
    ;(usuarios ?? []).forEach(u => {
      const id = getUserId(u)
      if (id) map.set(String(id), u)
    })
    return map
  }, [usuarios])

  const getEmailByProspect = (p: Prospecto) => {
    const ownerId = getProspectOwnerId(p)
    const u = ownerId != null ? usuariosById.get(String(ownerId)) : null
    return u ? getUserEmail(u) : ''
  }

  const getUserLabelById = (id: string) => {
    const u = usuariosById.get(String(id))
    if (!u) return '—'
    const name = getUserName(u)
    const email = getUserEmail(u)
    return name && email ? `${name} (${email})` : (name || email || '—')
  }

  // Opciones de autocomplete (proyectos + propiedades)
  const opcionesProyecto = useMemo(() => {
    const arr = [
      ...proyectos.map(p => ({ id: p.id, label: p.nombre })),
      ...propiedades.map(p => ({ id: p.id, label: p.tituloPropiedad })),
    ]
    const seen = new Set<string>()
    return arr.filter(o => {
      if (seen.has(o.label)) return false
      seen.add(o.label)
      return true
    })
  }, [proyectos, propiedades])

  // Clasificaciones únicas para sugerir
  const opcionesClasificacion = useMemo(() => {
    const set = new Set<string>()
    ;(prospectos ?? []).forEach(p => p?.clasificacionCliente && set.add(p.clasificacionCliente))
    return Array.from(set)
  }, [prospectos])

  // Mapa id -> label (para filtrar por texto de proyecto/propiedad)
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

  // Helpers de comparación/normalización
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
      case 'usuario': {
        const ea = normalize(getEmailByProspect(a))
        const eb = normalize(getEmailByProspect(b))
        cmp = compare(ea, eb)
        break
      }
      case 'fechaCreacion':
      default: {
        const da = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0
        const db = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0
        cmp = compare(da, db)
      }
    }
    return order === 'asc' ? cmp : -cmp
  }

  // --- Sincroniza el Select superior con el filtro del header
  const setUsuarioId = (id: string) => {
    setFiltroUsuarioId(id)
    setFilters(f => ({ ...f, usuarioId: id }))
  }

  // Base: aplica usuario; luego filtros; luego orden
  const rows = useMemo(() => {
    let base = (prospectos ?? []).filter(Boolean)
    // filtro por usuario (desde topbar o header)
    if (filters.usuarioId) {
      base = base.filter(p => String(getProspectOwnerId(p) ?? '') === filters.usuarioId)
    }

    const filtrada = base.filter(p => {
      if (filters.nombre && !matches(p.nombreCompleto, filters.nombre)) return false
      if (filters.correo && !matches(p.correoElectronico, filters.correo)) return false
      if (filters.celular && !matches(p.celular, filters.celular)) return false

      if (filters.clasificacion) {
        const c = normalize(filters.clasificacion)
        const pc = normalize(p.clasificacionCliente)
        if (!pc.includes(c)) return false
      }

      if (filters.proyectoTexto) {
        const needle = normalize(filters.proyectoTexto)
        const anyMatch =
          (p.proyectosInteres ?? []).some(id => normalize(idToLabel.get(id) ?? '').includes(needle))
        if (!anyMatch) return false
      }

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
    setProspectoSeleccionado(prev => prev ? { ...prev, [field]: value } : null)
  }

  // ---- Exporta lo visible (rows)
  const handleExportExcel = () => {
    const rowsToExport = (rows ?? []).map(p => {
      const intereses = (p.proyectosInteres ?? [])
        .map(id => {
          const proy = proyectos.find(x => x.id === id);
          if (proy) return proy.nombre;
          const prop = propiedades.find(x => x.id === id);
          if (prop) return prop.tituloPropiedad;
          return id;
        })
        .join(', ');

      return {
        'Nombre': p.nombreCompleto ?? '',
        'Correo': p.correoElectronico ?? '',
        'Celular': p.celular ?? '',
        'Clasificación': p.clasificacionCliente ?? '',
        'Usuario (email)': getEmailByProspect(p),
        'Proyectos / Propiedades de Interés': intereses,
        'Fecha Creación': p.fechaCreacion ? new Date(p.fechaCreacion).toLocaleDateString() : '',
        'Comentarios': p.comentarios ?? '',
      }
    });
    const ws = XLSX.utils.json_to_sheet(rowsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prospectos');
    XLSX.writeFile(wb, 'prospectos.xlsx');
  };

  return (
    <Box>
      {loading && <Spinner open={true} />}

      {/* Toolbar superior (opcional) */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700} color="primary">
          Lista de prospectos
        </Typography>
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
                if (!id) return null
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
                <TableCell sortDirection={orderBy === 'usuario' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'usuario'}
                    direction={orderBy === 'usuario' ? order : 'asc'}
                    onClick={() => handleRequestSort('usuario')}
                  >
                    Usuario (email)
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
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={filters.correo}
                    onChange={e => setFilters(f => ({ ...f, correo: e.target.value }))}
                    placeholder="Filtrar correo…"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={filters.celular}
                    onChange={e => setFilters(f => ({ ...f, celular: e.target.value }))}
                    placeholder="Filtrar celular…"
                    size="small"
                    fullWidth
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
                  {/* Filtro usuario dentro del header (sincronizado con el de arriba) */}
                  <Select
                    size="small"
                    value={filters.usuarioId}
                    displayEmpty
                    onChange={(e) => setUsuarioId(String(e.target.value))}
                    fullWidth
                  >
                    <MenuItem value=""><em>Todos</em></MenuItem>
                    {(usuarios ?? []).map(u => {
                      const id = getUserId(u)
                      if (!id) return null
                      return (
                        <MenuItem key={String(id)} value={String(id)}>
                          {getUserLabelById(String(id))}
                        </MenuItem>
                      )
                    })}
                  </Select>
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
                      onClick={() => {
                        setFilters({
                          nombre: '', correo: '', celular: '', clasificacion: '',
                          proyectoTexto: '', fecha: '', usuarioId: ''
                        })
                        setFiltroUsuarioId('')
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>✕</span>
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {!rows || rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography color="text.secondary" align="center">
                      {filters.usuarioId ? 'Sin prospectos para el usuario seleccionado' : 'Sin prospectos con los filtros actuales'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((p) => {
                  const ownerEmail = getEmailByProspect(p)
                  return (
                    <TableRow key={p.id ?? p.correoElectronico ?? Math.random()}>
                      <TableCell>{p.nombreCompleto}</TableCell>
                      <TableCell>{p.correoElectronico}</TableCell>
                      <TableCell>{p.celular}</TableCell>
                      <TableCell>{p.clasificacionCliente}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(p.proyectosInteres ?? []).map((id) => {
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
                            return null
                          })}
                        </Box>
                      </TableCell>

                      <TableCell>{ownerEmail}</TableCell>

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
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <NuevoProspectoModal
        open={modalOpen}
        prospecto={prospectoSeleccionado || null}
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

export default ProspectosGeneralTab
