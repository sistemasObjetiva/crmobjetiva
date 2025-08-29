import React, { useMemo, useState } from 'react'
import {
  Box, Typography, IconButton, Paper, Tooltip, Table, TableBody, TableCell,
  TableHead, TableRow, CircularProgress, Button, Chip, FormControl, InputLabel,
  Select, MenuItem, TextField, TableSortLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

import {
  updateSeguimiento,
  useFetchPropiedades,
  useFetchProspectos,
  useFetchProyects,
  useFetchSeguimientos,
  useFetchUsuarios
} from '../../hooks/useFetchFunctions'

import {
  ESTATUS_OPCIONES,
  Prospecto,
  Seguimiento,
  SeguimientoHistorial,
  EstatusSeguimiento
} from '../../config/types'

import SeguimientoModal from './SeguimientoModal'
import { useStatusChip } from '../../config/context/useStatusChip'
import Spinner from '../general/Spinner'
import { fechaActual } from '../../hooks/useDateUtils'
import { getEstatusChip } from '../../hooks/useUtilsFunctions'
import SignedAvatar from '../general/SignedAvatar'

interface Props {
  userid: string
}

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
              avatar={
                proy.logo ? (
                  <SignedAvatar value={proy.logo} alt={proy.nombre} sx={{ width: 24, height: 24 }} />
                ) : undefined
              }
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
  )
}

type Order = 'asc' | 'desc'
type OrderByKey =
  | 'usuario'
  | 'nombre'
  | 'correo'
  | 'temperatura'
  | 'unidad'
  | 'fechaProximo'
  | 'fechaActualizacion'

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

  // Filtro por usuario (topbar)
  const [filtroUsuarioId, setFiltroUsuarioId] = useState<string>('')

  // Import CSV
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importBusy, setImportBusy] = useState(false)
  const [fallbackUserId, setFallbackUserId] = useState<string>('') // si el correo de "usuario" no existe

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
    estatusSeguimiento: 'contactado' as EstatusSeguimiento,
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
        err?.message ? `Error al guardar seguimiento: ${err.message}` : 'Error al guardar seguimiento',
        'error'
      )
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

  const usuariosByEmail = useMemo(() => {
    const map = new Map<string, string>() // email → id
    ;(usuarios ?? []).forEach(u => {
      const id = getUserId(u)
      const em = getUserEmail(u)?.trim().toLowerCase()
      if (id != null && em) map.set(em, String(id))
    })
    return map
  }, [usuarios])

  // Agrupo por estatus para las secciones
  const seguimientosByEstatus: Record<string, Seguimiento[]> = useMemo(() => {
    const groups: Record<string, Seguimiento[]> = {}
    ESTATUS_OPCIONES.forEach(s => (groups[s.value] = []))
    ;(seguimientos ?? []).forEach(s => {
      if (groups[s.estatusSeguimiento] !== undefined) groups[s.estatusSeguimiento].push(s)
    })
    Object.values(groups).forEach(arr =>
      arr.sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime())
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

  // === NUEVO: índices de match por email, teléfono y nombre ===
  const normStr = (s?: string | null) =>
    (s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^\p{L}\d\s@.]/gu, ' ').replace(/\s+/g, ' ').trim().toLowerCase()

  const cleanPhone = (s?: string | null) => {
    if (!s) return ''
    const digits = String(s).replace(/\D+/g, '')
    // usa los últimos 10 si hay país, si no los últimos 8
    if (digits.length >= 10) return digits.slice(-10)
    if (digits.length >= 8) return digits.slice(-8)
    return digits
  }

  const stripNamePrefixes = (s: string) =>
    s.replace(/\b(ing|lic|arq|sr|sra|srta|dra|dr)\.?/gi, '').replace(/\s+/g, ' ').trim()

  const nameKey = (s?: string | null) => {
    const base = stripNamePrefixes(normStr(s))
    // clave por tokens ordenados (ignora tokens de 1 letra comunes)
    const tokens = base.split(' ').filter(t => t.length > 1).sort()
    return tokens.join(' ')
  }

  // Levenshtein simple + similitud
  const levenshtein = (a: string, b: string) => {
    if (a === b) return 0
    const an = a.length, bn = b.length
    if (an === 0) return bn
    if (bn === 0) return an
    const matrix = Array.from({ length: an + 1 }, () => new Array(bn + 1).fill(0))
    for (let i = 0; i <= an; i++) matrix[i][0] = i
    for (let j = 0; j <= bn; j++) matrix[0][j] = j
    for (let i = 1; i <= an; i++) {
      for (let j = 1; j <= bn; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        )
      }
    }
    return matrix[an][bn]
  }
  const similarity = (a: string, b: string) => {
    const d = levenshtein(a, b)
    return 1 - d / Math.max(a.length, b.length, 1)
  }

  const prospectosByEmail = useMemo(() => {
    const map = new Map<string, Prospecto>()
    ;(prospectos ?? []).forEach(p => {
      const em = p?.correoElectronico?.trim().toLowerCase()
      if (p?.id && em) map.set(em, p)
    })
    return map
  }, [prospectos])

  const prospectosByPhone = useMemo(() => {
    const map = new Map<string, Prospecto[]>()
    ;(prospectos ?? []).forEach(p => {
      const k = cleanPhone(p?.celular)
      if (p?.id && k) {
        const list = map.get(k) ?? []
        list.push(p)
        map.set(k, list)
      }
    })
    return map
  }, [prospectos])

  const prospectosByNameKey = useMemo(() => {
    const map = new Map<string, Prospecto[]>()
    ;(prospectos ?? []).forEach(p => {
      const k = nameKey(p?.nombreCompleto)
      if (p?.id && k) {
        const list = map.get(k) ?? []
        list.push(p)
        map.set(k, list)
      }
    })
    return map
  }, [prospectos])

  const { projectLabelToId, propertyLabelToId } = useMemo(() => {
    const pm = new Map<string, string>()
    const hm = new Map<string, string>()
    proyectos.forEach(p => pm.set(normStr(p.nombre), p.id))
    propiedades.forEach(p => hm.set(normStr(p.tituloPropiedad), p.id))
    return { projectLabelToId: pm, propertyLabelToId: hm }
  }, [proyectos, propiedades])

  const resolveProyectoId = (label?: string | null) => {
    if (!label) return ''
    const k = normStr(label)
    return projectLabelToId.get(k) || propertyLabelToId.get(k) || ''
  }

  const mapEstatus = (raw?: string | null): EstatusSeguimiento => {
    const v = normStr(raw)
    const found = ESTATUS_OPCIONES.find(o => normStr(o.value) === v || normStr(o.label) === v)
    return (found?.value as EstatusSeguimiento) ?? ('contactado' as EstatusSeguimiento)
  }

  const getUsuarioEmailById = (id?: string) => {
    if (!id) return ''
    const u = usuariosById.get(String(id))
    return getUserEmail(u)
  }

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
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderByKey>('fechaProximo')
  const [filters, setFilters] = useState({
    usuarioId: '', // sincronizable con filtro superior
    nombre: '',
    correo: '',
    temperatura: '',
    unidad: '',
    proyectoTexto: '',
    fechaProximo: '',
    fechaActualizacion: '',
    comentarios: '',
  })

  const setUsuarioId = (id: string) => {
    setFiltroUsuarioId(id)
    setFilters(f => ({ ...f, usuarioId: id }))
  }

  const handleRequestSort = (key: OrderByKey) => {
    if (orderBy === key) setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setOrderBy(key)
      setOrder('asc')
    }
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
          cmp = compare(normalize(getUsuarioEmailById(String(a.userid))), normalize(getUsuarioEmailById(String(b.userid))))
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
          cmp = compare(normalize(a.unidadInteres || a.proyectoInteres), normalize(b.unidadInteres || b.proyectoInteres))
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

  // ============================ IMPORT CSV (con heurística de match mejorada) ============================

  const quitarAcentos = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const normEmailLoose = (s?: string | null) => {
    if (!s) return ''
    return String(s).trim().toLowerCase()
      .replace('@gamil.com', '@gmail.com')
      .replace('@hotnail.com', '@hotmail.com')
  }

  const excelSerialToDate = (n: number) => {
    const ms = Math.round((n - 25569) * 86400 * 1000)
    return new Date(ms)
  }
  const parseFlexDate = (v: any): Date | null => {
    if (v == null) return null
    if (v instanceof Date && !isNaN(v.getTime())) return v
    const s = String(v).trim()
    if (!s) return null
    if (/^\d+(\.\d+)?$/.test(s)) {
      const num = parseFloat(s)
      if (!isNaN(num)) return excelSerialToDate(num)
    }
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
    if (m) {
      const dd = parseInt(m[1], 10)
      const mm = parseInt(m[2], 10) - 1
      let yyyy = parseInt(m[3], 10)
      if (yyyy < 100) yyyy = yyyy >= 70 ? 1900 + yyyy : 2000 + yyyy
      const HH = m[4] ? parseInt(m[4], 10) : 0
      const MI = m[5] ? parseInt(m[5], 10) : 0
      const SS = m[6] ? parseInt(m[6], 10) : 0
      const d = new Date(yyyy, mm, dd, HH, MI, SS)
      return isNaN(d.getTime()) ? null : d
    }
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }
  const toISO = (d?: Date | null) => (d ? new Date(d).toISOString() : undefined)

  const splitMulti = (s?: string | null) =>
    !s ? [] : String(s).split(/[;,|]/).map(x => x.trim()).filter(Boolean)

  const exportCSV = (rows: any[], filename: string) => {
    try {
      const csv = Papa.unparse(rows)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (_) {}
  }

  const findProspectForRow = (row: any) => {
    // columnas frecuentes
    const emailCsv = normEmailLoose(row['correo_electronico'] ?? row['correo'] ?? row['correo_cliente'])
    const phoneCsv = cleanPhone(row['telefono_cliente'] ?? row['telefono'] ?? row['celular'])
    const nameCsv = row['nombre_cliente'] ?? row['nombre'] ?? ''
    const proyectoCsv = row['proyecto_de_interes'] ?? row['proyecto_interes'] ?? ''

    // 1) por correo exacto
    if (emailCsv) {
      const p = prospectosByEmail.get(emailCsv)
      if (p) return p
    }

    // 2) por teléfono
    if (phoneCsv) {
      const list = prospectosByPhone.get(phoneCsv)
      if (list?.length === 1) return list[0]
      if (list && list.length > 1) {
        // desempata por nombre fuzzy
        const keyCsv = nameKey(nameCsv)
        let best: { p: Prospecto; score: number } | null = null
        for (const p of list) {
          const s = similarity(nameKey(p.nombreCompleto), keyCsv)
          if (!best || s > best.score) best = { p, score: s }
        }
        if (best && best.score >= 0.85) return best.p
      }
    }

    // 3) por nombre exacto normalizado (único)
    const k = nameKey(nameCsv)
    if (k) {
      const list = prospectosByNameKey.get(k)
      if (list?.length === 1) return list[0]
      if (list && list.length > 1) {
        // 3b) desempatar por proyecto de interés si coincide con alguno del prospecto
        if (proyectoCsv) {
          const pid = resolveProyectoId(proyectoCsv)
          const only = list.filter(p => (p.proyectosInteres ?? []).includes(pid))
          if (only.length === 1) return only[0]
        }
        // 3c) fuzzy por similitud de nombre (por si hay espacios/pedacitos distintos)
        let best: { p: Prospecto; score: number } | null = null
        for (const p of list) {
          const s = similarity(nameKey(p.nombreCompleto), k)
          if (!best || s > best.score) best = { p, score: s }
        }
        if (best && (best.score >= 0.9 || (k.length <= 14 && levenshtein(nameKey(best.p.nombreCompleto), k) <= 2))) {
          return best.p
        }
      }
    }

    // 4) fuzzy global por nombre (buscar mejor candidato general)
    if (k) {
      let best: { p: Prospecto; score: number } | null = null
      for (const [nk, list] of prospectosByNameKey.entries()) {
        const sim = similarity(nk, k)
        if (sim >= 0.92) {
          for (const p of list) {
            if (!best || sim > best.score) best = { p, score: sim }
          }
        }
      }
      if (best) return best.p
    }

    return null
  }

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

      if (!rows?.length) {
        showStatus('El CSV no contiene filas', 'warning')
        return
      }

      // 2) Normaliza headers
      const normKey = (k = '') =>
        quitarAcentos(String(k).trim().toLowerCase()).replace(/[^\p{L}\d\s_]/gu, '_').replace(/\s+/g, '_')
      const normRows = rows.map((r) => {
        const o: Record<string, any> = {}
        Object.keys(r || {}).forEach(k => (o[normKey(k)] = r[k]))
        return o
      })

      // 3) Índices existentes de seguimientos (por idprospecto+userid)
      const existingByKey = new Map<string, Seguimiento>()
      ;(seguimientos ?? []).forEach(s => {
        if (s?.idprospecto && s?.userid) {
          existingByKey.set(`${s.idprospecto}|${s.userid}`, s)
        }
      })

      // 4) Agrupar por prospecto (encontrado) + usuario
      type RowPack = {
        key: string
        userId: string
        prospectoId: string
        items: any[]
      }

      const packs = new Map<string, RowPack>()
      const notMatched: any[] = []

      for (const r of normRows) {
        // usuario correo
        const vendedorEmail = normEmailLoose(r['usuario'])
        const userId = (vendedorEmail && usuariosByEmail.get(vendedorEmail)) || fallbackUserId

        // intenta encontrar el prospecto con heurística
        const p = findProspectForRow(r)
        if (!p?.id) {
          notMatched.push({
            motivo: 'No se encontró prospecto (email/teléfono/nombre)',
            usuarioCSV: r['usuario'] ?? '',
            nombreCSV: r['nombre_cliente'] ?? r['nombre'] ?? '',
            telefonoCSV: r['telefono_cliente'] ?? r['telefono'] ?? '',
            correoCSV: r['correo_electronico'] ?? r['correo'] ?? '',
            proyectoCSV: r['proyecto_de_interes'] ?? r['proyecto_interes'] ?? '',
          })
          continue
        }

        const key = `${p.id}|${userId}`
        if (!packs.has(key)) {
          packs.set(key, { key, userId, prospectoId: p.id, items: [] })
        }
        packs.get(key)!.items.push(r)
      }

      if (packs.size === 0) {
        showStatus('No hay filas válidas para importar (ningún match con prospectos)', 'warning')
        if (notMatched.length) exportCSV(notMatched, 'seguimientos_no_emparejados.csv')
        return
      }

      // 5) Construcción de historial y upserts
      const upserts: Seguimiento[] = []

      packs.forEach(pack => {
        const { userId, prospectoId, items } = pack

        const ordered = [...items].sort((a, b) => {
          const da = parseFlexDate(a['fecha_registro'])?.getTime() ?? 0
          const db = parseFlexDate(b['fecha_registro'])?.getTime() ?? 0
          return da - db
        })

        const historial: SeguimientoHistorial[] = ordered.map((r) => {
          const fechaReg = parseFlexDate(r['fecha_registro'])
          const fechaSig = parseFlexDate(r['fecha_sig_contacto'])
          const proyectoId = resolveProyectoId(r['proyecto_de_interes'] ?? r['proyecto_interes'])
          const temperatura = r['temperatura_de_interes'] ?? r['temperatura']
          const forma = r['forma_de_pago'] ?? ''
          const unidad = r['unidad_de_interes'] ?? r['unidad_interes'] ?? ''
          const capPago = r['capacidad_de_pago'] ?? r['capacidad_de_pago_'] ?? r['capacidad_de_pago__'] ?? ''
          const comentarios = r['comentarios'] ?? ''
          const est = mapEstatus(r['estatus_seguimiento'])
          const proyectoInteres = proyectoId || (r['proyecto_de_interes'] ?? '')

          const h: SeguimientoHistorial = {
            id: crypto.randomUUID(),
            idprospecto: prospectoId,
            userid: userId,
            fechaCreacion: toISO(fechaReg) || fechaActual,
            fechaActualizacion: toISO(fechaReg) || fechaActual,
            fechaProximoSeguimiento: toISO(fechaSig) || '',
            unidadInteres: String(unidad),
            formaDePago: String(forma),
            temperaturaInteres: String(temperatura || ''),
            comentarios: String(comentarios || ''),
            proyectoInteres: String(proyectoInteres || ''),
            capacidadDePago: String(capPago || ''),
            estatusSeguimiento: est,
          }
          return h
        })

        const last = ordered[ordered.length - 1] || {}
        const fechaRegLast = parseFlexDate(last['fecha_registro'])
        const fechaSigLast = parseFlexDate(last['fecha_sig_contacto'])
        const proyectoIdLast = resolveProyectoId(last['proyecto_de_interes'] ?? last['proyecto_interes'])
        const temperaturaLast = last['temperatura_de_interes'] ?? last['temperatura']
        const formaLast = last['forma_de_pago'] ?? ''
        const unidadLast = last['unidad_de_interes'] ?? last['unidad_interes'] ?? ''
        const capPagoLast = last['capacidad_de_pago'] ?? last['capacidad_de_pago_'] ?? last['capacidad_de_pago__'] ?? ''
        const comentariosLast = last['comentarios'] ?? ''
        const estLast = mapEstatus(last['estatus_seguimiento'])
        const motivos = splitMulti(last['razon'])

        const existing = existingByKey.get(`${prospectoId}|${userId}`)

        let mergedHistorial: SeguimientoHistorial[] = [
          ...(existing?.historialSeguimiento ?? []),
          ...historial,
        ]

        const seenHist = new Set<string>()
        mergedHistorial = mergedHistorial.filter(h => {
          const k = `${h.fechaCreacion}|${h.comentarios}|${h.estatusSeguimiento}`
          if (seenHist.has(k)) return false
          seenHist.add(k)
          return true
        })
        mergedHistorial.sort((a, b) => (new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()))

        const seg: Seguimiento = {
          id: existing?.id || crypto.randomUUID(),
          idprospecto: prospectoId,
          userid: userId,
          fechaCreacion: existing?.fechaCreacion || (toISO(parseFlexDate(ordered[0]?.['fecha_registro'])) || fechaActual),
          fechaActualizacion: toISO(fechaRegLast) || fechaActual,
          fechaProximoSeguimiento: toISO(fechaSigLast) || '',
          unidadInteres: String(unidadLast || ''),
          formaDePago: String(formaLast || ''),
          temperaturaInteres: String(temperaturaLast || ''),
          comentarios: String(comentariosLast || ''),
          proyectoInteres: String(proyectoIdLast || last['proyecto_de_interes'] || ''),
          capacidadDePago: String(capPagoLast || ''),
          estatusSeguimiento: estLast,
          motivo: motivos.length ? motivos : undefined,
          historialSeguimiento: mergedHistorial,
        }

        upserts.push(seg)
      })

      const results = await Promise.allSettled(upserts.map(u => updateSeguimiento(u)))
      const ok = results.filter(r => r.status === 'fulfilled').length
      const fail = results.length - ok

      if (notMatched.length) {
        exportCSV(notMatched, 'seguimientos_no_emparejados.csv')
      }

      const extras = notMatched.length ? `, ${notMatched.length} filas sin match (exportadas)` : ''
      showStatus(`Importación de seguimientos: ${ok} ok, ${fail} con error${extras}`, fail ? 'warning' : 'success')

      setImportFile(null)
      setImportOpen(false)
    } catch (e: any) {
      console.error(e)
      showStatus(e?.message || 'Error al importar CSV de seguimientos', 'error')
    } finally {
      setImportBusy(false)
    }
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

      {loadingSeguimientos ? (
        <Paper variant="outlined">
          <Box p={4} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        </Paper>
      ) : (
        ESTATUS_OPCIONES.map(estatus => {
          const grupo = seguimientosByEstatus[estatus.value] ?? []
          const rows = filterAndSort(
            filtroUsuarioId ? grupo.filter(s => String(s.userid) === filtroUsuarioId) : grupo
          )
          return (
            <Box key={estatus.value} mb={4}>
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                mb={1}
                sx={{ textTransform: 'uppercase', letterSpacing: 1, minHeight: 40 }}
              >
                {getEstatusChip(estatus.value)}
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ lineHeight: 1, mb: 0, fontSize: 17, letterSpacing: 1, textTransform: 'uppercase' }}
                >
                  ({rows.length})
                </Typography>
              </Box>

              <Paper
                variant="outlined"
                sx={{ mb: 2, borderLeft: '5px solid var(--primary-color, #1976d2)', overflowX: 'auto' }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
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

                    {/* Filtros inline */}
                    <TableRow>
                      <TableCell>
                        <Select
                          size="small"
                          fullWidth
                          displayEmpty
                          value={filters.usuarioId}
                          onChange={e => setUsuarioId(String(e.target.value))}
                        >
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
                        <TextField
                          size="small" fullWidth placeholder="Filtrar nombre…"
                          value={filters.nombre}
                          onChange={e => setFilters(f => ({ ...f, nombre: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" fullWidth placeholder="Filtrar correo…"
                          value={filters.correo}
                          onChange={e => setFilters(f => ({ ...f, correo: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell />
                      <TableCell>
                        <TextField
                          size="small" fullWidth placeholder="Filtrar temperatura…"
                          value={filters.temperatura}
                          onChange={e => setFilters(f => ({ ...f, temperatura: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" fullWidth placeholder="Filtrar unidad/proyecto…"
                          value={filters.unidad}
                          onChange={e => setFilters(f => ({ ...f, unidad: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" fullWidth placeholder="Proyecto/Propiedad (chips)…"
                          value={filters.proyectoTexto}
                          onChange={e => setFilters(f => ({ ...f, proyectoTexto: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" fullWidth type="date"
                          value={filters.fechaProximo}
                          onChange={e => setFilters(f => ({ ...f, fechaProximo: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" fullWidth type="date"
                          value={filters.fechaActualizacion}
                          onChange={e => setFilters(f => ({ ...f, fechaActualizacion: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" fullWidth placeholder="Filtrar comentarios…"
                          value={filters.comentarios}
                          onChange={e => setFilters(f => ({ ...f, comentarios: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Limpiar filtros">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setFilters({
                                usuarioId: '', nombre: '', correo: '', temperatura: '',
                                unidad: '', proyectoTexto: '', fechaProximo: '',
                                fechaActualizacion: '', comentarios: ''
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

      {/* Diálogo de importación CSV de seguimientos */}
      <Dialog open={importOpen} onClose={() => !importBusy && setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Importar seguimientos (CSV)</DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gap={2}>
            <Typography variant="body2">
              Encabezados aceptados (flexibles): <i>
                Fecha Registro, usuario (correo asesor), Nombre Cliente, Teléfono Cliente, Correo Electrónico,
                Clasificación cliente, Proyecto de Interés, Unidad de interés, Forma de pago, Capacidad de Pago,
                Temperatura de interés, Fecha sig Contacto, Comentarios, Estatus seguimiento, Razon
              </i>.
              Se intenta empatar por <b>correo</b>, <b>teléfono</b> y luego <b>nombre</b> (con tolerancia).
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
                  if (id == null) return null
                  return (
                    <MenuItem key={String(id)} value={String(id)}>
                      {getUserLabelById(String(id))}
                    </MenuItem>
                  )
                })}
              </Select>
              <Typography variant="caption" color="text.secondary">
                Se usa cuando el correo de “usuario” no coincide con ningún usuario.
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

export default SeguimientosGeneralTab
