// src/hooks/useSeguimientosViewModel.ts
import { useEffect, useMemo, useState } from 'react'
import { ESTATUS_OPCIONES, EstatusSeguimiento, Prospecto, Seguimiento } from '../../config/types'

type Order = 'asc' | 'desc'
export type OrderByKey =
  | 'usuario'
  | 'nombre'
  | 'correo'
  | 'temperatura'
  | 'unidad'
  | 'fechaProximo'
  | 'fechaActualizacion'

type PagingState = Record<string, { page: number; rowsPerPage: number }>

export interface Filters {
  usuarioId: string
  nombre: string
  correo: string
  temperatura: string
  unidad: string
  proyectoTexto: string
  fechaProximo: string
  fechaActualizacion: string
  comentarios: string
}

export const DEFAULT_RPP = 25

export function useSeguimientosViewModel(opts: {
  seguimientos: Seguimiento[]
  prospectos: Prospecto[]
  usuariosById: Map<string, any>
  getUsuarioEmailById: (id?: string) => string
  idToLabel: Map<string, string> // project/prop labels
}) {
  const { seguimientos, prospectos, getUsuarioEmailById, idToLabel } = opts

  // ===== Estado UI principal =====
  const [filtroUsuarioId, setFiltroUsuarioId] = useState<string>('')

  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderByKey>('fechaProximo')

  const [filters, setFilters] = useState<Filters>({
    usuarioId: '',
    nombre: '',
    correo: '',
    temperatura: '',
    unidad: '',
    proyectoTexto: '',
    fechaProximo: '',
    fechaActualizacion: '',
    comentarios: '',
  })

  const [statusFocus, setStatusFocus] = useState<EstatusSeguimiento | ''>('')

  // Paginación por estatus
  const [paging, setPaging] = useState<PagingState>(() =>
    Object.fromEntries(
      ESTATUS_OPCIONES.map(o => [o.value, { page: 0, rowsPerPage: DEFAULT_RPP }])
    ) as PagingState
  )

  const onChangePage = (estatus: string, page: number) =>
    setPaging(prev => ({ ...prev, [estatus]: { ...prev[estatus], page } }))

  const onChangeRpp = (estatus: string, rpp: number) =>
    setPaging(prev => ({ ...prev, [estatus]: { page: 0, rowsPerPage: rpp } }))

  const resetAllPages = () =>
    setPaging(prev =>
      Object.fromEntries(
        Object.keys(prev).map(k => [k, { ...prev[k], page: 0 }])
      ) as PagingState
    )

  // Resetear páginas si cambian filtros/orden/usuario/estatus
  useEffect(() => {
    resetAllPages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, order, orderBy, filtroUsuarioId, statusFocus])

  // ===== Helpers =====
  const normalize = (s?: string | null) =>
    (s ?? '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const matches = (v?: string | null, n = '') => normalize(v).includes(normalize(n))
  const compare = <T,>(a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0)

  // Índice de prospectos
  const prospectosById = useMemo(() => {
    const map = new Map<string, Prospecto>()
    ;(prospectos ?? []).forEach(p => { if (p?.id) map.set(p.id, p) })
    return map
  }, [prospectos])

  // ===== Filtro + orden =====
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
        return d
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          : ''
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
        case 'usuario':
          cmp = compare(
            normalize(getUsuarioEmailById(String(a.userid))),
            normalize(getUsuarioEmailById(String(b.userid)))
          )
          break
        case 'nombre':
          cmp = compare(normalize(pa?.nombreCompleto), normalize(pb?.nombreCompleto))
          break
        case 'correo':
          cmp = compare(normalize(pa?.correoElectronico), normalize(pb?.correoElectronico))
          break
        case 'temperatura':
          cmp = compare(normalize(a.temperaturaInteres), normalize(b.temperaturaInteres))
          break
        case 'unidad':
          cmp = compare(
            normalize(a.unidadInteres || a.proyectoInteres),
            normalize(b.unidadInteres || b.proyectoInteres)
          )
          break
        case 'fechaActualizacion': {
          const da = a.fechaActualizacion ? new Date(a.fechaActualizacion).getTime() : 0
          const db = b.fechaActualizacion ? new Date(b.fechaActualizacion).getTime() : 0
          cmp = compare(da, db)
          break
        }
        case 'fechaProximo':
        default: {
          const da = a.fechaProximoSeguimiento ? new Date(a.fechaProximoSeguimiento).getTime() : 0
          const db = b.fechaProximoSeguimiento ? new Date(b.fechaProximoSeguimiento).getTime() : 0
          cmp = compare(da, db)
          break
        }
      }
      return order === 'asc' ? cmp : -cmp
    })

    return sorted
  }

  // ===== Agrupar por estatus =====
  const seguimientosByEstatus: Record<string, Seguimiento[]> = useMemo(() => {
    const groups: Record<string, Seguimiento[]> = {}
    ESTATUS_OPCIONES.forEach(s => (groups[s.value] = []))
    ;(seguimientos ?? []).forEach(s => {
      if (groups[s.estatusSeguimiento] !== undefined) groups[s.estatusSeguimiento].push(s)
    })
    return groups
  }, [seguimientos])

  // Filtradas + ordenadas por estatus (respetando filtro de usuario topbar)
  const rowsByStatus: Record<string, Seguimiento[]> = useMemo(() => {
    const out: Record<string, Seguimiento[]> = {}
    for (const s of ESTATUS_OPCIONES) {
      const base = seguimientosByEstatus[s.value] ?? []
      const afterTopbar = filtroUsuarioId ? base.filter(x => String(x.userid) === filtroUsuarioId) : base
      out[s.value] = filterAndSort(afterTopbar)
    }
    return out
  }, [seguimientosByEstatus, filtroUsuarioId, filters, order, orderBy, idToLabel])

  // Filas para gráficas (toman focus de estatus)
  const rowsForCharts: Seguimiento[] = useMemo(() => {
    if (statusFocus) return rowsByStatus[statusFocus] ?? []
    return Object.values(rowsByStatus).flat()
  }, [rowsByStatus, statusFocus])

  // ===== API del hook =====
  const handleRequestSort = (key: OrderByKey) => {
    if (orderBy === key) setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setOrderBy(key)
      setOrder('asc')
    }
  }

  const setUsuarioId = (id: string) => {
    setFiltroUsuarioId(id)
    setFilters(f => ({ ...f, usuarioId: id }))
  }

  const clearAllFilters = () => {
    setFilters({
      usuarioId: '',
      nombre: '',
      correo: '',
      temperatura: '',
      unidad: '',
      proyectoTexto: '',
      fechaProximo: '',
      fechaActualizacion: '',
      comentarios: '',
    })
    setFiltroUsuarioId('')
  }

  return {
    // datos calculados
    rowsByStatus,
    rowsForCharts,

    // estado UI
    filtroUsuarioId,
    setUsuarioId,

    order,
    orderBy,
    handleRequestSort,

    filters,
    setFilters,
    clearAllFilters,

    statusFocus,
    setStatusFocus,

    paging,
    onChangePage,
    onChangeRpp,
    resetAllPages,
  }
}
