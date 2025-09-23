import React, { useMemo, useState } from 'react'
import {
  Box, Typography, IconButton, Paper, Tooltip, CircularProgress, Chip, TextField, Autocomplete
} from '@mui/material'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  updateProspecto,
  useFetchPropiedades,
  useFetchProspectosUser,
  useFetchProyects,
  useFetchSeguimientosUser
} from '../../../hooks/useFetchFunctions'
import { Prospecto } from '../../../config/types'
import NuevoProspectoModal from './ProspectoModal'
import { useStatusChip } from '../../../config/context/useStatusChip'
import Spinner from '../../general/Spinner'
import { DataGrid, GridColDef, GridSortModel, GridSortDirection } from '@mui/x-data-grid'
import { SignedAvatarLazy } from '../../general/SignedAvatarLazy'

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

const ROW_HEIGHT = 56

// ===================== helper de formato (sin campos extra) =====================
const fmtFechaCorta = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// ===================== Chips "lite" con lazy avatar =====================
const ProyectosChipsLite: React.FC<{
  ids?: string[]
  proyectos: Array<{ id: string; nombre: string; logo?: any }>
  propiedades: Array<{ id: string; tituloPropiedad: string; imagenes?: any[] }>
  maxChips?: number
}> = ({ ids = [], proyectos, propiedades, maxChips = 2 }) => {
  if (!ids.length) return null
  const items = ids.slice(0, maxChips)
  const rest = ids.length - items.length

  const meta = (id: string) => {
    const p = proyectos.find(x => x.id === id)
    if (p) return { label: p.nombre, avatarDoc: p.logo }
    const r = propiedades.find(x => x.id === id)
    if (r) return { label: r.tituloPropiedad, avatarDoc: r.imagenes?.[0] }
    return { label: id, avatarDoc: undefined }
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {items.map(id => {
        const { label, avatarDoc } = meta(id)
        return (
          <Chip
            key={id}
            label={label}
            avatar={avatarDoc ? <SignedAvatarLazy doc={avatarDoc} alt={label} size={24} /> : undefined}
            size="small"
            sx={{ bgcolor: 'transparent' }}
          />
        )
      })}
      {rest > 0 && <Chip size="small" label={`+${rest}`} variant="outlined" />}
    </Box>
  )
}

const ProspectosTab: React.FC<ProspectosTabProps> = ({ userid }) => {
  const { showStatus } = useStatusChip()
  const { prospectos, loading: loadingProspectos } = useFetchProspectosUser(userid!)
  const { seguimientos, loading: loadingSeguimientos } = useFetchSeguimientosUser(userid!)
  const { proyectos } = useFetchProyects()
  const { propiedades } = useFetchPropiedades()

  const [modalOpen, setModalOpen] = useState(false)
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState<Prospecto | null>(null)
  const [loading, setLoading] = useState(false)

  // ----------------- Orden & Filtros -----------------
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderByKey>('fechaCreacion')

  const [filters, setFilters] = useState({
    nombre: '',
    correo: '',
    celular: '',
    clasificacion: '',
    proyectoTexto: '',
    fecha: '',
  })

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

  // Mapa id -> label para filtrar por texto
  const idToLabel = useMemo(() => {
    const map = new Map<string, string>()
    proyectos.forEach(p => map.set(p.id, p.nombre))
    propiedades.forEach(p => map.set(p.id, p.tituloPropiedad))
    return map
  }, [proyectos, propiedades])

  const handleRequestSort = (key: OrderByKey, forced?: Order) => {
    if (forced) {
      setOrderBy(key)
      setOrder(forced)
      return
    }
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

  // ----------------- Crear / Editar -----------------
  const initialProspecto = (): Prospecto => ({
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
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
      showStatus(err?.message ? `Error al guardar prospecto: ${err.message}` : 'Error al guardar prospecto', 'error')
    } finally {
      setModalOpen(false)
      setProspectoSeleccionado(null)
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Prospecto, value: any) => {
    setProspectoSeleccionado(prev => (prev ? { ...prev, [field]: value } : null))
  }

  // valores únicos de clasificación para sugerir
  const opcionesClasificacion = useMemo(() => {
    const set = new Set<string>()
    ;(prospectos ?? []).forEach(p => p?.clasificacionCliente && set.add(p.clasificacionCliente))
    return Array.from(set)
  }, [prospectos])

  // ===================== DataGrid =====================
  // mapeo columnas -> claves de sort
  const fieldToOrderKey: Record<string, OrderByKey> = {
    nombreCompleto: 'nombreCompleto',
    correoElectronico: 'correoElectronico',
    celular: 'celular',
    clasificacionCliente: 'clasificacionCliente',
    fechaCreacion: 'fechaCreacion',
  }

  const orderKeyToField: Record<OrderByKey, string> = {
    nombreCompleto: 'nombreCompleto',
    correoElectronico: 'correoElectronico',
    celular: 'celular',
    clasificacionCliente: 'clasificacionCliente',
    proyectosInteres: 'proyectosInteres', // no sortable en grid
    fechaCreacion: 'fechaCreacion',
  }

  const sortModel: GridSortModel = useMemo(
    () => [{ field: orderKeyToField[orderBy], sort: (order as GridSortDirection) }],
    [order, orderBy]
  )

  const columns: GridColDef[] = useMemo(() => [
    { field: 'nombreCompleto', headerName: 'Nombre', flex: 1, sortable: true },
    { field: 'correoElectronico', headerName: 'Correo', flex: 1, sortable: true },
    { field: 'celular', headerName: 'Celular', width: 140, sortable: true },
    { field: 'clasificacionCliente', headerName: 'Clasificación', width: 160, sortable: true },
    {
      field: 'proyectosInteres',
      headerName: 'Proyecto(s) interés',
      flex: 1.3,
      sortable: false,
      renderCell: (params: any) => (
        <ProyectosChipsLite
          ids={params.row.proyectosInteres}
          proyectos={proyectos}
          propiedades={propiedades}
          maxChips={2}
        />
      ),
    },
    {
      field: 'fechaCreacion',
      headerName: 'Fecha creación',
      width: 140,
      sortable: true,
      valueGetter: (_value, row) => fmtFechaCorta(row.fechaCreacion),      // Nota: usamos sort "server" abajo; aquí devolvemos texto solo para UI
    },
    {
      field: 'acciones',
      headerName: 'Ver',
      width: 80,
      sortable: false,
      renderCell: (params: any) => (
        <IconButton size="small" onClick={() => handleAbrirModalVer(params.row)}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ], [proyectos, propiedades])

  // Preparamos rows con ID seguro (sin campos derivados)
  const rowsDG: Prospecto[] = useMemo(() =>
    (rows ?? []).map((p) => ({
      ...p,
      id: p.id ?? p.correoElectronico ?? (
        (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      )
    })), [rows])

  return (
    <Box>
      {loading && <Spinner open={true} />}

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700} color="primary">Lista de prospectos</Typography>
        <Tooltip title="Agregar prospecto">
          <IconButton color="primary" onClick={handleAbrirModalNuevo} size="large" sx={{ borderRadius: 2 }}>
            <PersonAddAltIcon fontSize="large" />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {loadingProspectos??loadingSeguimientos ? (
          <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            {/* Filtros */}
            <Box
              sx={{
                p: 1.5,
                borderBottom: theme => `1px solid ${theme.palette.divider}`,
                display: 'grid',
                gap: 1,
                gridTemplateColumns: 'repeat(6, minmax(0, 1fr))'
              }}
            >
              <TextField
                value={filters.nombre}
                onChange={e => setFilters(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Filtrar nombre…"
                size="small"
              />
              <TextField
                value={filters.correo}
                onChange={e => setFilters(f => ({ ...f, correo: e.target.value }))}
                placeholder="Filtrar correo…"
                size="small"
              />
              <TextField
                value={filters.celular}
                onChange={e => setFilters(f => ({ ...f, celular: e.target.value }))}
                placeholder="Filtrar celular…"
                size="small"
              />
              <Autocomplete
                freeSolo
                options={opcionesClasificacion}
                value={filters.clasificacion}
                onInputChange={(_, val) => setFilters(f => ({ ...f, clasificacion: val ?? '' }))}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Filtrar clasificación…" size="small" />
                )}
              />
              <Autocomplete
                freeSolo
                options={opcionesProyecto.map(o => o.label)}
                value={filters.proyectoTexto}
                onInputChange={(_, val) => setFilters(f => ({ ...f, proyectoTexto: val ?? '' }))}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Proyecto/Propiedad…" size="small" />
                )}
              />
              <TextField
                type="date"
                value={filters.fecha}
                onChange={e => setFilters(f => ({ ...f, fecha: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* DataGrid virtualizado */}
            <DataGrid
              rows={rowsDG}
              columns={columns}
              sortingMode="server"
              sortModel={sortModel}
              onSortModelChange={(model) => {
                const item = model[0]
                if (!item?.field) return
                const key = fieldToOrderKey[item.field] || 'fechaCreacion'
                const dir = (item.sort === 'desc' ? 'desc' : 'asc') as Order
                handleRequestSort(key, dir)
              }}
              density="comfortable"
              getRowHeight={() => ROW_HEIGHT}
              disableRowSelectionOnClick
              pageSizeOptions={[50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 50, page: 0 } },
              }}
              sx={{
                border: 0,
                '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' }
              }}
            />
          </Box>
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
        seguimientos={seguimientos}
      />
    </Box>
  )
}

export default ProspectosTab
