import React, { useEffect, useMemo, useState } from 'react'
import {
  Box, Typography, IconButton, Paper, Tooltip, Table, TableBody, TableCell,
  TableHead, TableRow, CircularProgress
} from '@mui/material'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'

import {
  updateSeguimiento,
  useFetchPropiedades,
  useFetchProspectosUser,
  useFetchProyects,
  useFetchSeguimientosUser
} from '../../../hooks/useFetchFunctions'

import { Prospecto, Seguimiento } from '../../../config/types'
import SeguimientoModal from './SeguimientoModal'
import { useStatusChip } from '../../../config/context/useStatusChip'
import Spinner from '../../general/Spinner'
import { fechaActual } from '../../../hooks/useDateUtils'
import SeguimientosFiltersBar from './SeguimientosFilterBar'
import { useSeguimientosFilters } from '../../../hooks/seguimientos/useSeguimientosFilter'

// 👇 la tabla reutilizable
import SeguimientosTableSection from './SeguimientosTableSection'
import type { OrderByKey } from '../../../hooks/seguimientos/useSeguimientosViewModel'

const ESTATUS_LIST = [
  'contactado', 'interaccion', 'cotizacion', 'visita', 'posible', 'apartado', 'vendido', 'descartado'
] as const

interface Props { userid: string }


const SeguimientosTab: React.FC<Props> = ({ userid }) => {
  const { showStatus } = useStatusChip()
  const { seguimientos, loading: loadingSeguimientos, fetch: fetchSeguimientos } = useFetchSeguimientosUser(userid)
  const { prospectos, fetch: fetchProspectos } = useFetchProspectosUser(userid)
  const { proyectos } = useFetchProyects()
  const { propiedades } = useFetchPropiedades()

  const [modalOpen, setModalOpen] = useState(false)
  const [seguimientoLocal, setSeguimientoLocal] = useState<Seguimiento | null>(null)
  const [saving, setSaving] = useState(false)

  // 🔹 filtros globales
  const { filters } = useSeguimientosFilters()

  // maps
  const prospectosById = useMemo(() => {
    const map = new Map<string, Prospecto>()
    ;(prospectos ?? []).forEach(p => { if (p?.id) map.set(p.id, p) })
    return map
  }, [prospectos])

  // Para TableSection (este tab no necesita emails ni usuarios)
  const usuariosById = useMemo(() => new Map<string, any>(), [])
  const getUserEmail = () => '' // no mostramos email aquí

  // Prospectos sin seguimiento (la cajita superior)
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
    proyectoInteres: '',      // puede ser string o string[]
    historialSeguimiento: [],
    estatusSeguimiento: 'contactado'
  })

  const handleAbrirModalNuevo = () => { setSeguimientoLocal(initialSeguimiento()); setModalOpen(true) }
  const handleAbrirModalVer   = (s: Seguimiento) => { setSeguimientoLocal(s); setModalOpen(true) }

  const refreshSeguimientoData = async () => {
    await Promise.all([fetchSeguimientos(), fetchProspectos()])
  }

  const handleGuardarSeguimiento = async (s: Seguimiento) => {
    setSaving(true)
    try {
      await updateSeguimiento({ ...s, fechaActualizacion: new Date().toISOString() })
      await refreshSeguimientoData()
      showStatus('Seguimiento guardado exitosamente', 'success')
    }
    catch (err: any) {
      console.error(err)
      showStatus(err?.message || 'Error al guardar seguimiento', 'error')
    }
    finally { setModalOpen(false); setSeguimientoLocal(null); setSaving(false) }
  }

  const handleChange = (field: keyof Seguimiento, value: any) => {
    setSeguimientoLocal(prev => prev ? { ...prev, [field]: value } : null)
  }

  // -------- ORDEN (usamos keys compatibles con TableSection) --------
  type Order = 'asc' | 'desc'
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderByKey>('fechaProximo') // 'usuario' | 'nombre' | 'correo' | 'temperatura' | 'proyectos' | 'fechaProximo' | 'fechaActualizacion'

  const handleRequestSort = (key: OrderByKey) => {
    if (orderBy === key) setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else { setOrderBy(key); setOrder('asc') }
  }

  const normalize = (s?: string | null) =>
    (s ?? '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const matches = (val?: string | null, needle = '') => normalize(val).includes(normalize(needle))
  const compare = <T,>(a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0)

  // id -> label (para sort de 'proyectos')
  const idToLabel = useMemo(() => {
    const map = new Map<string, string>()
    proyectos.forEach(p => map.set(String(p.id), p.nombre))
    propiedades.forEach(p => map.set(String(p.id), p.tituloPropiedad))
    return map
  }, [proyectos, propiedades])

  const proyectoLabelFromSeguimiento = (s: Seguimiento) => {
    const ids = Array.isArray(s.proyectoInteres) ? s.proyectoInteres : s.proyectoInteres ? [s.proyectoInteres] : []
    return ids.map(id => idToLabel.get(String(id)) ?? String(id)).join(' | ')
  }

  // filtros + sort (por estatus)
  const filterAndSort = (arr: Seguimiento[]) => {
    const filtrada = arr.filter(s => {
      const prosp = prospectosById.get(s.idprospecto)
      if (!prosp) return false

      if (filters.nombre && !matches(prosp.nombreCompleto, filters.nombre)) return false
      if (filters.correo && !matches(prosp.correoElectronico, filters.correo)) return false
      if (filters.temperatura && !matches(s.temperaturaInteres, filters.temperatura)) return false
      if (filters.unidad && !matches(s.unidadInteres, filters.unidad)) return false

      if (filters.proyectoTexto) {
        const hay = normalize(proyectoLabelFromSeguimiento(s)).includes(normalize(filters.proyectoTexto))
        if (!hay) return false
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

    const sorted = [...filtrada].sort((a, b) => {
      let cmp = 0
      const pa = prospectosById.get(a.idprospecto)
      const pb = prospectosById.get(b.idprospecto)
      switch (orderBy) {
        case 'nombre': cmp = compare(normalize(pa?.nombreCompleto), normalize(pb?.nombreCompleto)); break
        case 'correo': cmp = compare(normalize(pa?.correoElectronico), normalize(pb?.correoElectronico)); break
        case 'temperatura': cmp = compare(normalize(a.temperaturaInteres), normalize(b.temperaturaInteres)); break
        case 'proyectos': {
          const la = normalize(proyectoLabelFromSeguimiento(a))
          const lb = normalize(proyectoLabelFromSeguimiento(b))
          cmp = compare(la, lb); break
        }
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

  // mismo orden visual base, luego filtros/orden
  const historialOrdenado = useMemo(
    () => [...(seguimientos ?? [])].sort(
      (a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
    ),
    [seguimientos]
  )

  // ===== Paginación por estatus =====
  type PagingState = Record<string, { page: number; rowsPerPage: number }>
  const DEFAULT_RPP = 25
  const [paging, setPaging] = useState<PagingState>(() =>
    Object.fromEntries(ESTATUS_LIST.map(s => [s, { page: 0, rowsPerPage: DEFAULT_RPP }])) as PagingState
  )
  const onChangePage = (status: string, newPage: number) =>
    setPaging(prev => ({ ...prev, [status]: { ...prev[status], page: newPage } }))
  const onChangeRpp = (status: string, rpp: number) =>
    setPaging(prev => ({ ...prev, [status]: { page: 0, rowsPerPage: rpp } }))

  // Reset page al cambiar filtros/orden
  useEffect(() => {
    setPaging(prev =>
      Object.fromEntries(Object.keys(prev).map(k => [k, { ...prev[k], page: 0 }])) as PagingState
    )
  }, [filters, order, orderBy])

  return (
    <Box>
      {saving && <Spinner open />}

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Typography variant="h6" fontWeight={700} color="primary">Seguimientos</Typography>
        <Tooltip title="Agregar seguimiento">
          <IconButton color="primary" onClick={handleAbrirModalNuevo} size="large" sx={{ borderRadius: 2 }}>
            <PersonAddAltIcon fontSize="large" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 🔹 Barra ÚNICA de filtros (global) */}
      <SeguimientosFiltersBar />

      {/* Prospectos sin seguimiento (cajita superior) */}
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
                <TableCell>Proyecto/Propiedad interés (del prospecto)</TableCell>
                <TableCell align="center">Agregar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prospectosSinSeguimiento.map(prosp => (
                <TableRow key={prosp.id}>
                  <TableCell>{prosp.nombreCompleto ?? ''}</TableCell>
                  <TableCell>{prosp.correoElectronico ?? ''}</TableCell>
                  <TableCell>{prosp.celular ?? ''}</TableCell>
                  <TableCell>—</TableCell>
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

      {/* Secciones por estatus usando la tabla reutilizable */}
      {loadingSeguimientos ? (
        <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
      ) : (
        (ESTATUS_LIST as readonly string[]).map((status) => {
          const allRows = filterAndSort(
            historialOrdenado.filter(s => s.estatusSeguimiento === status)
          )
          const { page, rowsPerPage } = paging[status] ?? { page: 0, rowsPerPage: DEFAULT_RPP }

          return (
            <SeguimientosTableSection
              key={status}
              estatusValue={status}
              allRows={allRows}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(newPage) => onChangePage(status, newPage)}
              onRowsPerPageChange={(rpp) => onChangeRpp(status, rpp)}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              loading={false}

              // maps
              prospectosById={prospectosById}
              usuariosById={usuariosById}
              proyectos={proyectos}
              propiedades={propiedades}
              getUserEmail={getUserEmail}

              // acciones
              onView={handleAbrirModalVer}
              onToggleBaja={() => { /* no aplica baja en este tab */ }}
            />
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
