import React, { useMemo, useState } from 'react'
import {
  Box, Typography, IconButton, Paper, Tooltip, CircularProgress, Chip, Button, FormControl, InputLabel,
  Select, MenuItem, TextField, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  updateProspecto,
  useFetchPropiedades,
  useFetchProspectos,
  useFetchProyects,
  useFetchUsuarios
} from '../../../hooks/useFetchFunctions'
import { Prospecto, Document as StorageDocument } from '../../../config/types'
import NuevoProspectoModal from './ProspectoModal'
import { useStatusChip } from '../../../config/context/useStatusChip'
import Spinner from '../../general/Spinner'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { DataGrid, GridColDef, GridSortDirection, GridSortModel } from '@mui/x-data-grid'
import { SignedAvatarLazy } from '../../general/SignedAvatarLazy'

interface ProspectosTabProps {
  userid: string
}

// --- Helpers tolerantes a distintos nombres de campos ---
const getUserId = (u: any) => u?.id ?? u?.uid ?? u?.userId ?? null
const getUserEmail = (u: any) => u?.email ?? u?.correo ?? u?.correoElectronico ?? ''
const getUserName = (u: any) => u?.nombre ?? u?.displayName ?? u?.name ?? getUserEmail(u) ?? '—'
const getProspectOwnerId = (p: any) => p?.userid

type Order = 'asc' | 'desc'
type OrderByKey =
  | 'nombreCompleto'
  | 'correoElectronico'
  | 'celular'
  | 'clasificacionCliente'
  | 'proyectosInteres'
  | 'usuario'
  | 'fechaCreacion'

// mapping entre columnas del Grid y tus keys
const fieldToOrderKey: Record<string, OrderByKey> = {
  nombreCompleto: 'nombreCompleto',
  correoElectronico: 'correoElectronico',
  celular: 'celular',
  clasificacionCliente: 'clasificacionCliente',
  ownerEmail: 'usuario',            // col calculada
  fechaCreacionFmt: 'fechaCreacion' // string formateada, ordenamos por la real
}

const orderKeyToField: Record<OrderByKey, string> = {
  nombreCompleto: 'nombreCompleto',
  correoElectronico: 'correoElectronico',
  celular: 'celular',
  clasificacionCliente: 'clasificacionCliente',
  proyectosInteres: 'proyectosInteres', // no sortable, lo dejamos mapeado
  usuario: 'ownerEmail',
  fechaCreacion: 'fechaCreacionFmt'
}

const ROW_HEIGHT = 56 // alto estimado para DataGrid

// ===================== Chips "lite" con límite y lazy avatar =====================
const ProyectosChipsLite: React.FC<{
  ids?: string[]
  proyectos: Array<{ id: string; nombre: string; logo?: StorageDocument }>
  propiedades: Array<{ id: string; tituloPropiedad: string; imagenes?: StorageDocument[] }>
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

const ProspectosGeneralTab: React.FC<ProspectosTabProps> = ({ }) => {
  const { showStatus } = useStatusChip()
  const { usuarios } = useFetchUsuarios()
  const { prospectos, loading: loadingProspectos } = useFetchProspectos()
  const { proyectos } = useFetchProyects()
  const { propiedades } = useFetchPropiedades()

  const [modalOpen, setModalOpen] = useState(false)
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState<Prospecto | null>(null)
  const [loading, setLoading] = useState(false)

  // ----------------- Importación CSV -----------------
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importBusy, setImportBusy] = useState(false)
  const [fallbackUserId, setFallbackUserId] = useState<string>('') // usuario respaldo si no se encuentra "Vendedor"

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

  const handleRequestSort = (key: OrderByKey, forced?: Order) => {
    if (forced) {        // si viene del Grid, respeta su dirección
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

  // Helpers de comparación/normalización (UI)
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
          const proy = proyectos.find(x => x.id === id)
          if (proy) return proy.nombre
          const prop = propiedades.find(x => x.id === id)
          if (prop) return prop.tituloPropiedad
          return id
        })
        .join(', ')

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
    })
    const ws = XLSX.utils.json_to_sheet(rowsToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Prospectos')
    XLSX.writeFile(wb, 'prospectos.xlsx')
  }

  // ============================ CSV: helpers ============================
  const quitarAcentos = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const norm = (s?: string | null) => quitarAcentos(String(s ?? '').trim().toLowerCase())
  const normKey = (k = '') => norm(k).replace(/\s+/g, '_')

  // 🔸 Normalizador de NOMBRE para el match y dedupe
  const normName = (s?: string | null) =>
    (s ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()

  // índice en BD por nombre normalizado → id (o 'MULTI' si hay más de uno)
  const existingByName = useMemo(() => {
    const map = new Map<string, string | 'MULTI'>()
    ;(prospectos ?? []).forEach(p => {
      if (!p?.id) return
      const k = normName(p.nombreCompleto)
      if (!k) return
      const prev = map.get(k)
      map.set(k, prev ? 'MULTI' : p.id)
    })
    return map
  }, [prospectos])

  const normEmail = (s?: string | null) => {
    if (!s) return undefined
    return String(s).trim().toLowerCase()
      .replace('@gamil.com', '@gmail.com')
      .replace('@hotnail.com', '@hotmail.com')
  }

  const normPhone = (s?: string | null) => {
    if (!s) return undefined
    const digits = String(s).replace(/\D+/g, '')
    return digits.length >= 7 ? digits : undefined
  }

  const toISODate = (s?: string | null) => {
    if (!s) return undefined
    const str = String(s).trim()
    const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
    if (!m) return undefined
    const dd = m[1].padStart(2, '0')
    const mm = m[2].padStart(2, '0')
    let yy = m[3]
    if (yy.length === 2) yy = (Number(yy) >= 70 ? '19' : '20') + yy
    return `${yy}-${mm}-${dd}`
  }

  const buildLabelMaps = () => {
    const projectMap = new Map<string, string>()   // nombre → id
    const propertyMap = new Map<string, string>()  // título → id
    proyectos.forEach(p => projectMap.set(norm(p.nombre), p.id))
    propiedades.forEach(p => propertyMap.set(norm(p.tituloPropiedad), p.id))
    return { projectMap, propertyMap }
  }

  const splitLabels = (s?: string | null) =>
    !s ? [] : String(s).split(/[;,|]/).map(x => x.trim()).filter(Boolean)

  const resolveIntereses = (texto?: string | null) => {
    if (!texto) return []
    const { projectMap, propertyMap } = buildLabelMaps()
    const out: string[] = []
    for (const label of splitLabels(texto)) {
      const key = norm(label)
      const pid = projectMap.get(key)
      if (pid) { out.push(pid); continue }
      const propId = propertyMap.get(key)
      if (propId) { out.push(propId); continue }
      // si no se encontró, se ignora (o podrías guardarlo en comentarios)
    }
    return Array.from(new Set(out))
  }

  // ============================ CSV: import handler ============================
  const handleImportCSV = async () => {
    if (!importFile) {
      showStatus('Selecciona un CSV', 'warning')
      return
    }
    if (!fallbackUserId) {
      showStatus('Selecciona un usuario de respaldo', 'warning')
      return
    }

    setImportBusy(true)
    try {
      // 1) Parse CSV
      const { data: rows } = await new Promise<{ data: any[] }>((resolve, reject) => {
        Papa.parse(importFile, {
          header: true,
          skipEmptyLines: true,
          complete: (res) => resolve({ data: res.data as any[] }),
          error: (err) => reject(err),
        })
      })

      // 2) Normaliza headers
      const normRows = rows.map((r) => {
        const o: Record<string, any> = {}
        Object.keys(r || {}).forEach(k => (o[normKey(k)] = r[k]))
        return o
      })

      // 3) Mapa (opcional) usuarios por email para asignar dueño
      const usersByEmail = new Map<string, string>() // email → id
      ;(usuarios ?? []).forEach(u => {
        const email = normEmail(getUserEmail(u))
        const id = getUserId(u)
        if (email && id) usersByEmail.set(email, String(id))
      })

      // 4) Construir carga **SOLO por nombre**
      const seenNamesCSV = new Set<string>()  // dedupe dentro del archivo por nombre normalizado
      const payloads: Prospecto[] = []

      for (const r of normRows) {
        // nombre (flexible)
        const nombreRaw =
          (r['nombre_completo_cliente'] ?? r['nombre_completo'] ?? r['nombre'] ?? '')
            .toString()
            .trim()
        if (!nombreRaw) continue

        const nameKey = normName(nombreRaw)
        if (!nameKey) continue

        // dedupe por nombre dentro del CSV
        if (seenNamesCSV.has(nameKey)) {
          continue
        }
        seenNamesCSV.add(nameKey)

        // otros campos (sólo para rellenar datos; NO se usan para el match)
        const email  = normEmail(r['correo_electronico_cliente'] ?? r['correo'])
        const celular = normPhone(r['celular_cliente'] ?? r['celular'])

        const fecha = toISODate(r['fecha_registro'] ?? r['fecha_creacion'])
        const ocup   = r['ocupacion_cliente']?.toString()?.trim() || undefined
        const edo    = r['edo_civil_cliente']?.toString()?.trim() || undefined
        const clasif = r['clasificacion_cliente']?.toString()?.trim() || undefined
        const medio  = r['medio_de_captacion']?.toString()?.trim() || undefined
        const comentarios = r['comentarios']?.toString()?.trim() || undefined

        const intereses1 = resolveIntereses(r['proyecto'])
        const intereses2 = resolveIntereses(r['proyectos_interes'])
        const proyectosInteres = Array.from(new Set([ ...intereses1, ...intereses2 ]))

        // dueño (userid): intenta columna "vendedor" (correo) o respaldo
        const vendEmail = normEmail(r['vendedor'])
        const ownerId = (vendEmail && usersByEmail.get(vendEmail)) || fallbackUserId

        // ¿existe en BD por ese nombre? si hay 1 → usa ese id; si hay MULTI o 0 → crea nuevo
        const candidate = existingByName.get(nameKey)
        const id = candidate && candidate !== 'MULTI' ? candidate : crypto.randomUUID()

        const prospecto: Prospecto = {
          id,
          userid: ownerId,
          nombreCompleto: nombreRaw,
          correoElectronico: email,
          celular,
          fechaCreacion: fecha,
          ocupacionCliente: ocup,
          edoCivilCliente: edo,
          clasificacionCliente: clasif,
          medioCaptacion: medio,
          comentarios,
          proyectosInteres,
        }
        payloads.push(prospecto)
      }

      if (!payloads.length) {
        showStatus('No se encontraron filas válidas en el CSV', 'warning')
        return
      }

      // 5) Upsert paralelo
      const results = await Promise.allSettled(payloads.map(p => updateProspecto(p)))
      const ok = results.filter(r => r.status === 'fulfilled').length
      const fail = results.length - ok

      showStatus(`Importación completa: ${ok} ok, ${fail} con error`, fail ? 'warning' : 'success')
      setImportFile(null)
      setImportOpen(false)
    } catch (e: any) {
      console.error(e)
      showStatus(e?.message || 'Error al importar CSV', 'error')
    } finally {
      setImportBusy(false)
    }
  }

  const sortModel: GridSortModel = useMemo(
    () => [{ field: orderKeyToField[orderBy], sort: order as GridSortDirection }],
    [order, orderBy]
  )

  type ProyLiteDoc = { id: string; nombre: string; logo?: StorageDocument }
  type PropLiteDoc = { id: string; tituloPropiedad: string; imagenes?: StorageDocument[] }

  // crea los arreglos “lite” usando los tipos locales
  const proyectosLite = useMemo<ProyLiteDoc[]>(
    () => (proyectos ?? []).map(p => ({
      id: p.id,
      nombre: p.nombre,
      logo: p.logo,        // Document
    })),
    [proyectos]
  )

  const propiedadesLite = useMemo<PropLiteDoc[]>(
    () => (propiedades ?? []).map(r => ({
      id: r.id,
      tituloPropiedad: r.tituloPropiedad,
      imagenes: r.imagenes, // Document[]
    })),
    [propiedades]
  )

  // Tipar filas para el DataGrid
  type ProspectoRow = Prospecto & {
    id: string
    ownerEmail: string
    fechaCreacionFmt: string
  }

  // Filas para DataGrid (id estable + campos precalculados)
  const rowsDG: ProspectoRow[] = useMemo(
    () =>
      (rows ?? []).map((p) => {
        const id =
          p.id ??
          p.correoElectronico ??
          (typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

        const d = p.fechaCreacion ? new Date(p.fechaCreacion as any) : null
        const fechaCreacionFmt = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString() : ''

        const ownerEmail = getEmailByProspect(p) || ''

        return { ...p, id, ownerEmail, fechaCreacionFmt }
      }),
    [rows, usuariosById]
  )

  // Columnas
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
          proyectos={proyectosLite}
          propiedades={propiedadesLite}
          maxChips={2}
        />
      ),
    },
    { field: 'ownerEmail', headerName: 'Usuario (email)', width: 220, sortable: true },
    { field: 'fechaCreacionFmt', headerName: 'Fecha creación', width: 140, sortable: true },
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
  ], [proyectosLite, propiedadesLite, usuariosById])

  return (
    <Box>
      {loading && <Spinner open={true} />}

      {/* Toolbar superior */}
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

          <Button
            variant="contained"
            onClick={() => {
              setFallbackUserId(filtroUsuarioId || '')
              setImportOpen(true)
            }}
          >
            Importar CSV
          </Button>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {loadingProspectos ? (
          <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            {/* Fila de filtros */}
            <Box sx={{ p: 1.5, borderBottom: theme => `1px solid ${theme.palette.divider}`, display: 'grid', gap: 1, gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
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
              <TextField
                type="date"
                value={filters.fecha}
                onChange={e => setFilters(f => ({ ...f, fecha: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <Box display="flex" alignItems="center" justifyContent="center">
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
              </Box>
            </Box>

            {/* DataGrid virtualizado */}
            <DataGrid
              rows={rowsDG}                 // ya salen filtradas y ORDENADAS por tu useMemo(rows)
              columns={columns}
              sortingMode="server"          // el Grid no ordena; solo notifica
              sortModel={sortModel}
              onSortModelChange={(model) => {
                const item = model[0]
                if (!item?.field) return
                const key = fieldToOrderKey[item.field] || 'fechaCreacion'
                const dir = (item.sort === 'desc' ? 'desc' : 'asc') as Order
                handleRequestSort(key, dir) // usamos tu función aquí
              }}
              density="comfortable"
              getRowHeight={() => ROW_HEIGHT}
              disableRowSelectionOnClick
              pageSizeOptions={[50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 50, page: 0 } } }}
              sx={{ border: 0, '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' } }}
            />
          </Box>
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

      {/* Diálogo de importación CSV */}
      <Dialog open={importOpen} onClose={() => !importBusy && setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Importar prospectos (CSV)</DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gap={2}>
            <Typography variant="body2">
              Encabezados aceptados (flexibles): <i>
                Fecha Registro, Nombre Completo Cliente, Celular Cliente, Correo Electrónico Cliente,
                Ocupación Cliente, Edo Civil Cliente, Clasificación Cliente, Medio de Captación,
                Comentarios, Proyecto, Proyectos Interés (separados por coma), Vendedor (correo)
              </i>.
              <br />
              <b>Durante esta importación solo se empata por nombre.</b>
            </Typography>

            <Button variant="outlined" component="label">
              Seleccionar CSV
              <input hidden type="file" accept=".csv,text/csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
            </Button>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {importFile ? importFile.name : 'Sin archivo seleccionado'}
            </Typography>

            <FormControl size="small" fullWidth>
              <InputLabel id="fallback-user-label">Usuario de respaldo</InputLabel>
              <Select
                labelId="fallback-user-label"
                label="Usuario de respaldo"
                value={fallbackUserId}
                onChange={(e) => setFallbackUserId(String(e.target.value))}
                required
              >
                <MenuItem value=""><em>Selecciona…</em></MenuItem>
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
              <Typography variant="caption" color="text.secondary">
                Se usa cuando el correo de “Vendedor” no coincide con ningún usuario.
              </Typography>
            </FormControl>

            {importBusy && <LinearProgress />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)} disabled={importBusy}>Cancelar</Button>
          <Button variant="contained" onClick={handleImportCSV} disabled={!importFile || !fallbackUserId || importBusy}>
            {importBusy ? 'Importando…' : 'Importar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ProspectosGeneralTab
