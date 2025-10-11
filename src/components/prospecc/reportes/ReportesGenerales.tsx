import React, { useMemo, useState } from 'react'
import {
  Box, Typography, Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Chip, Stack, Divider, Button
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

import { useStatusChip } from '../../../config/context/useStatusChip'
import {
  useFetchSeguimientos,
  useFetchProspectos,
  useFetchProyects,
  useFetchPropiedades,
  useFetchUsuarios,
} from '../../../hooks/useFetchFunctions'
import Spinner from '../../general/Spinner'
import SignedAvatar from '../../general/SignedAvatar'
import ReporteDetalleModal from './ReporteDetalleModal'


/** ===== Helpers ===== */
const getId = (x: any) => x?.id ?? x?._id ?? x?.uid ?? null

const getName = (u: any) =>
  u?.nombre ??
  u?.name ??
  ([u?.first_name, u?.last_name].filter(Boolean).join(' ') || undefined) ??
  u?.displayName ??
  u?.email ??
  '—'

const getUsuarioId = (x: any) => x?.userid ?? null
const getSeguimientoEstatus = (s: any) => s?.estatusSeguimiento ?? 'SIN_ESTATUS'

// Seguimiento: string id (proyecto o unidad/propiedad)
const getProyectoInteresIdFromSeguimiento = (s: any) => s?.proyectoInteres ?? null
// Prospecto: tomamos el primer proyecto de interés
const getProyectoInteresIdFromProspecto = (p: any) =>
  Array.isArray(p?.proyectosInteres) && p.proyectosInteres.length > 0 ? p.proyectosInteres[0] : null

/** Nombre legible de proyecto/unidad */
function resolveProyectoNombre(
  pid: string | null,
  proyectosById: Map<string, any>,
  unidadesById: Map<string, any>
) {
  if (!pid) return 'Sin proyecto'
  const key = String(pid)
  const p = proyectosById.get(key)
  if (p) return p?.nombre ?? p?.name ?? `Proyecto ${key}`

  const u = unidadesById.get(key)
  if (u) {
    const unidadNombre =
      u?.numerounidad ?? u?.unidadprivativa ?? u?.nombre ?? u?.tituloPropiedad ?? `Unidad ${key}`
    const pj = proyectosById.get(String(u?.proyectoid))
    const pjNombre = pj?.nombre ?? pj?.name ?? `Proyecto ${u?.proyectoid ?? '—'}`
    return `${unidadNombre} (${pjNombre})`
  }

  return `Proyecto/Unidad ${key}`
}

/** Chip de Proyecto/Propiedad/Unidad (id único) con avatar */
function ProyectoChip({
  id,
  proyectosById,
  unidadesById,
  onClick,
}: {
  id?: string | null
  proyectosById: Map<string, any>
  unidadesById: Map<string, any>
  onClick?: () => void
}) {
  if (!id) return <Chip size="small" label="Sin proyecto" sx={{ bgcolor: 'transparent' }} />

  const pid = String(id)
  const baseSx = { mr: 0.5, bgcolor: 'transparent', cursor: onClick ? 'pointer' : 'default' }

  const proy = proyectosById.get(pid)
  if (proy) {
    const label = proy?.nombre ?? proy?.name ?? `Proyecto ${pid}`
    const logo = proy?.logo
    return (
      <Chip
        key={`proy-${pid}`}
        label={label}
        size="small"
        avatar={logo ? <SignedAvatar value={logo} alt={label} sx={{ width: 24, height: 24 }} /> : undefined}
        sx={baseSx}
        onClick={onClick}
        clickable={!!onClick}
      />
    )
  }

  const u = unidadesById.get(pid)
  if (u) {
    const unidadLabel =
      u?.numerounidad ?? u?.unidadprivativa ?? u?.nombre ?? u?.tituloPropiedad ?? `ID ${pid}`
    const img = u?.imagenes?.[0] ?? u?.render
    const pj = proyectosById.get(String(u?.proyectoid))
    const pjNombre = pj?.nombre ?? pj?.name
    const label = pjNombre ? `${unidadLabel} (${pjNombre})` : unidadLabel
    return (
      <Chip
        key={`uni-${pid}`}
        label={label}
        size="small"
        avatar={img ? <SignedAvatar value={img} alt={label} sx={{ width: 24, height: 24 }} /> : undefined}
        sx={baseSx}
        onClick={onClick}
        clickable={!!onClick}
      />
    )
  }

  return <Chip size="small" label={`ID ${pid}`} sx={baseSx} onClick={onClick} clickable={!!onClick} />
}

/** TabPanel simple */
function TabPanel({ value, index, children }: { value: number; index: number; children: React.ReactNode }) {
  if (value !== index) return null
  return <Box sx={{ mt: 2 }}>{children}</Box>
}

/** Tabla compacta */
function SimpleTable({
  headers,
  rows,
}: {
  headers: Array<{ key: string; label: string; align?: 'left' | 'right' | 'center' }>
  rows: Array<Record<string, React.ReactNode>>
}) {
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow sx={{ '& th': { bgcolor: 'grey.50' } }}>
            {headers.map(h => (
              <TableCell key={h.key} align={h.align ?? 'left'}>
                <Typography variant="overline" sx={{ letterSpacing: 0.6 }}>{h.label}</Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} align="center">
                <Typography variant="body2" color="text.secondary">Sin datos</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r, i) => (
              <TableRow
                key={i}
                hover
                sx={(theme) => ({
                  '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.primary.main, 0.03) },
                })}
              >
                {headers.map(h => (
                  <TableCell key={h.key} align={h.align ?? 'left'}>
                    {r[h.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Paper>
  )
}

const ReportesGerentes: React.FC = () => {
  const { showStatus } = useStatusChip()

  // Datos
  const { seguimientos, loading: loadingSeguimientos } = useFetchSeguimientos()
  const { prospectos } = useFetchProspectos()
  const { proyectos } = useFetchProyects()
  const { propiedades } = useFetchPropiedades() // Propiedades/Unidades
  const { usuarios } = useFetchUsuarios()

  // Tabs
  const [mainTab, setMainTab] = useState(0)
  const [subTabPros, setSubTabPros] = useState(0)
  const [subTabSeg, setSubTabSeg] = useState(0)

  const loading = !!loadingSeguimientos

  /** Índices de referencia */
  const proyectosById = useMemo(() => {
    const m = new Map<string, any>()
    ;(proyectos ?? []).forEach((p: any) => m.set(String(getId(p)), p))
    return m
  }, [proyectos])

  // Unidades combinadas: hook + embebidas en proyectos[].unidades
  const unidadesById = useMemo(() => {
    const m = new Map<string, any>()
    ;(propiedades ?? []).forEach((u: any) => m.set(String(getId(u)), u))
    ;(proyectos ?? []).forEach((p: any) => {
      const pu: any[] = Array.isArray(p?.unidades) ? p.unidades : []
      pu.forEach((u: any) => {
        const uid = String(getId(u))
        if (!u?.proyectoid) u = { ...u, proyectoid: p?.id ?? p?._id }
        if (!m.has(uid)) m.set(uid, u)
      })
    })
    return m
  }, [propiedades, proyectos])

  const usuariosById = useMemo(() => {
    const m = new Map<string, any>()
    ;(usuarios ?? []).forEach((u: any) => m.set(String(getId(u)), u))
    return m
  }, [usuarios])

  /** Último estatus por prospecto (desde seguimientos) */
  const lastStatusByProspecto: Map<string, string> = useMemo(() => {
    const map = new Map<string, string>()
    const byPros: Record<string, any[]> = {}
    ;(seguimientos ?? []).forEach((s: any) => {
      const pid = s?.idprospecto
      if (!pid) return
      if (!byPros[pid]) byPros[pid] = []
      byPros[pid].push(s)
    })
    Object.entries(byPros).forEach(([pid, arr]) => {
      arr.sort((a, b) => {
        const da = Date.parse(a?.fechaActualizacion ?? a?.fechaCreacion ?? '1970-01-01')
        const db = Date.parse(b?.fechaActualizacion ?? b?.fechaCreacion ?? '1970-01-01')
        return db - da
      })
      const latest = arr[0]
      map.set(pid, getSeguimientoEstatus(latest))
    })
    return map
  }, [seguimientos])

  const mapEstatusToChipStatus = (estatus: string): Parameters<typeof showStatus>[1] => {
    const e = (estatus || '').toLowerCase().trim()
    if (['ganado', 'cerrado ganado', 'concluido', 'aceptado'].includes(e)) return 'success' as Parameters<typeof showStatus>[1]
    if (['perdido', 'rechazado', 'cancelado', 'cerrado perdido'].includes(e)) return 'error' as Parameters<typeof showStatus>[1]
    if (['en proceso', 'seguimiento', 'pendiente', 'contactado', 'en curso'].includes(e)) return 'warning' as Parameters<typeof showStatus>[1]
    return 'default' as Parameters<typeof showStatus>[1]
  }

  /* ===================== DETALLE MODAL (estado + filtro) ===================== */
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [detalleTitulo, setDetalleTitulo] = useState<string>('')
  const [detalleSeg, setDetalleSeg] = useState<any[]>([])
  const [detallePros, setDetallePros] = useState<any[]>([])

  const openDetalle = (opts:
    | { kind: 'pros-proyecto'; proyectoId: string | null }
    | { kind: 'pros-vendedor'; vendedorId: string }
    | { kind: 'pros-estatus'; estatus: string }
    | { kind: 'seg-proyecto'; proyectoId: string | null }
    | { kind: 'seg-vendedor'; vendedorId: string }
    | { kind: 'seg-estatus'; estatus: string }
  ) => {
    let title = ''
    let seg: any[] = []
    let pros: any[] = []

    if (opts.kind === 'pros-proyecto' || opts.kind === 'seg-proyecto') {
      const pid = opts.proyectoId
      title = `Proyecto: ${resolveProyectoNombre(pid, proyectosById, unidadesById)}`
      seg = (seguimientos ?? []).filter(s => String(getProyectoInteresIdFromSeguimiento(s) ?? 'SIN') === String(pid ?? 'SIN'))
      pros = (prospectos ?? []).filter(p => {
        const arr: string[] = Array.isArray(p?.proyectosInteres) ? p.proyectosInteres.map(String) : []
        if (pid == null) return arr.length === 0
        return arr.includes(String(pid))
      })
    }

    if (opts.kind === 'pros-vendedor' || opts.kind === 'seg-vendedor') {
      const uid = opts.vendedorId
      const u = usuariosById.get(String(uid))
      title = `Vendedor: ${u ? getName(u) : uid}`
      seg = (seguimientos ?? []).filter(s => String(getUsuarioId(s)) === String(uid))
      pros = (prospectos ?? []).filter(p => String(getUsuarioId(p)) === String(uid))
    }

    if (opts.kind === 'pros-estatus' || opts.kind === 'seg-estatus') {
      const est = opts.estatus
      title = `Estatus: ${est}`
      seg = (seguimientos ?? []).filter(s => String(getSeguimientoEstatus(s)) === String(est))
      pros = (prospectos ?? []).filter(p => (lastStatusByProspecto.get(p.id) ?? 'SIN_ESTATUS') === est)
    }

    setDetalleTitulo(title)
    setDetalleSeg(seg)
    setDetallePros(pros)
    setDetalleOpen(true)
  }

  /** ---------- AGRUPACIONES: PROSPECTOS ---------- */
  const prosPorProyecto = useMemo(() => {
    const acc = new Map<string, {
      proyectoId: string | null
      proyectoNombre: string
      prospectos: number
      vendedores: Set<string>
      estatus: Record<string, number>
    }>()
    ;(prospectos ?? []).forEach((p: any) => {
      const pid = getProyectoInteresIdFromProspecto(p)
      const key = String(pid ?? 'SIN_PROYECTO')
      if (!acc.has(key)) {
        acc.set(key, {
          proyectoId: pid ?? null,
          proyectoNombre: resolveProyectoNombre(pid, proyectosById, unidadesById),
          prospectos: 0,
          vendedores: new Set(),
          estatus: {},
        })
      }
      const b = acc.get(key)!
      b.prospectos += 1
      const uid = getUsuarioId(p)
      if (uid) b.vendedores.add(String(uid))
      const est = lastStatusByProspecto.get(p.id) ?? 'SIN_ESTATUS'
      b.estatus[est] = (b.estatus[est] ?? 0) + 1
    })
    return Array.from(acc.values()).map(v => ({
      proyectoId: v.proyectoId,
      proyectoNombre: v.proyectoNombre,
      prospectos: v.prospectos,
      vendedores: v.vendedores.size,
      estatusTop: Object.entries(v.estatus).sort(([,a],[,b]) => (b as number)-(a as number)).slice(0,3)
    }))
  }, [prospectos, proyectosById, unidadesById, lastStatusByProspecto])

  const prosPorVendedor = useMemo(() => {
    const acc = new Map<string, { vendedorId: string; vendedorNombre: string; prospectos: number; proyectos: Set<string>; estatus: Record<string, number> }>()
    ;(prospectos ?? []).forEach((p: any) => {
      const uid = String(getUsuarioId(p) ?? 'SIN_VENDEDOR')
      if (!acc.has(uid)) {
        const u = usuariosById.get(uid)
        acc.set(uid, {
          vendedorId: uid,
          vendedorNombre: u ? getName(u) : 'Sin vendedor',
          prospectos: 0,
          proyectos: new Set(),
          estatus: {},
        })
      }
      const b = acc.get(uid)!
      b.prospectos += 1
      const pid = getProyectoInteresIdFromProspecto(p)
      if (pid != null) b.proyectos.add(String(pid))
      const est = lastStatusByProspecto.get(p.id) ?? 'SIN_ESTATUS'
      b.estatus[est] = (b.estatus[est] ?? 0) + 1
    })
    return Array.from(acc.values()).map(v => ({
      vendedorId: v.vendedorId,
      vendedorNombre: v.vendedorNombre,
      prospectos: v.prospectos,
      proyectos: v.proyectos.size,
      estatusTop: Object.entries(v.estatus).sort(([,a],[,b]) => (b as number)-(a as number)).slice(0,3)
    }))
  }, [prospectos, usuariosById, lastStatusByProspecto])

  const prosPorEstatus = useMemo(() => {
    const acc = new Map<string, { estatus: string; prospectos: number; proyectos: Set<string>; vendedores: Set<string> }>()
    ;(prospectos ?? []).forEach((p: any) => {
      const est = lastStatusByProspecto.get(p.id) ?? 'SIN_ESTATUS'
      const k = est || 'SIN_ESTATUS'
      if (!acc.has(k)) acc.set(k, { estatus: k, prospectos: 0, proyectos: new Set(), vendedores: new Set() })
      const b = acc.get(k)!
      b.prospectos += 1
      const pid = getProyectoInteresIdFromProspecto(p)
      if (pid != null) b.proyectos.add(String(pid))
      const uid = getUsuarioId(p)
      if (uid) b.vendedores.add(String(uid))
    })
    return Array.from(acc.values()).map(v => ({
      estatus: v.estatus,
      prospectos: v.prospectos,
      proyectos: v.proyectos.size,
      vendedores: v.vendedores.size,
    }))
  }, [prospectos, lastStatusByProspecto])

  /** ---------- AGRUPACIONES: SEGUIMIENTOS ---------- */
  const segPorProyecto = useMemo(() => {
    const acc = new Map<string, {
      proyectoId: string | null
      proyectoNombre: string
      seguimientos: number
      vendedores: Set<string>
      estatus: Record<string, number>
    }>()
    ;(seguimientos ?? []).forEach((s: any) => {
      const pid = getProyectoInteresIdFromSeguimiento(s)
      const key = String(pid ?? 'SIN_PROYECTO')
      if (!acc.has(key)) {
        acc.set(key, {
          proyectoId: pid ?? null,
          proyectoNombre: resolveProyectoNombre(pid, proyectosById, unidadesById),
          seguimientos: 0,
          vendedores: new Set(),
          estatus: {},
        })
      }
      const b = acc.get(key)!
      b.seguimientos += 1
      const uid = getUsuarioId(s)
      if (uid) b.vendedores.add(String(uid))
      const est = getSeguimientoEstatus(s)
      b.estatus[est] = (b.estatus[est] ?? 0) + 1
    })
    return Array.from(acc.values()).map(v => ({
      proyectoId: v.proyectoId,
      proyectoNombre: v.proyectoNombre,
      seguimientos: v.seguimientos,
      vendedores: v.vendedores.size,
      estatusTop: Object.entries(v.estatus).sort(([,a],[,b]) => (b as number)-(a as number)).slice(0,3)
    }))
  }, [seguimientos, proyectosById, unidadesById])

  const segPorVendedor = useMemo(() => {
    const acc = new Map<string, { vendedorId: string; vendedorNombre: string; seguimientos: number; proyectos: Set<string>; estatus: Record<string, number> }>()
    ;(seguimientos ?? []).forEach((s: any) => {
      const uid = String(getUsuarioId(s) ?? 'SIN_VENDEDOR')
      if (!acc.has(uid)) {
        const u = usuariosById.get(uid)
        acc.set(uid, {
          vendedorId: uid,
          vendedorNombre: u ? getName(u) : 'Sin vendedor',
          seguimientos: 0,
          proyectos: new Set(),
          estatus: {},
        })
      }
      const b = acc.get(uid)!
      b.seguimientos += 1
      const pid = getProyectoInteresIdFromSeguimiento(s)
      if (pid != null) b.proyectos.add(String(pid))
      const est = getSeguimientoEstatus(s)
      b.estatus[est] = (b.estatus[est] ?? 0) + 1
    })
    return Array.from(acc.values()).map(v => ({
      vendedorId: v.vendedorId,
      vendedorNombre: v.vendedorNombre,
      seguimientos: v.seguimientos,
      proyectos: v.proyectos.size,
      estatusTop: Object.entries(v.estatus).sort(([,a],[,b]) => (b as number)-(a as number)).slice(0,3)
    }))
  }, [seguimientos, usuariosById])

  const segPorEstatus = useMemo(() => {
    const acc = new Map<string, { estatus: string; seguimientos: number; proyectos: Set<string>; vendedores: Set<string> }>()
    ;(seguimientos ?? []).forEach((s: any) => {
      const k = getSeguimientoEstatus(s) || 'SIN_ESTATUS'
      if (!acc.has(k)) acc.set(k, { estatus: k, seguimientos: 0, proyectos: new Set(), vendedores: new Set() })
      const b = acc.get(k)!
      b.seguimientos += 1
      const pid = getProyectoInteresIdFromSeguimiento(s)
      if (pid != null) b.proyectos.add(String(pid))
      const uid = getUsuarioId(s)
      if (uid) b.vendedores.add(String(uid))
    })
    return Array.from(acc.values()).map(v => ({
      estatus: v.estatus,
      seguimientos: v.seguimientos,
      proyectos: v.proyectos.size,
      vendedores: v.vendedores.size,
    }))
  }, [seguimientos])

  /** ===== Headers (ahora con columna "Detalle") ===== */
  const headersProsProyecto = [
    { key: 'proyecto', label: 'Proyecto' },
    { key: 'prospectos', label: 'Prospectos', align: 'right' as const },
    { key: 'vendedores', label: 'Vendedores', align: 'right' as const },
    { key: 'estatus', label: 'Estatus (top 3)' },
    { key: 'detalle', label: 'Detalle', align: 'right' as const },
  ]
  const headersProsVendedor = [
    { key: 'vendedor', label: 'Vendedor' },
    { key: 'prospectos', label: 'Prospectos', align: 'right' as const },
    { key: 'proyectos', label: 'Proyectos', align: 'right' as const },
    { key: 'estatus', label: 'Estatus (top 3)' },
    { key: 'detalle', label: 'Detalle', align: 'right' as const },
  ]
  const headersProsEstatus = [
    { key: 'estatus', label: 'Estatus' },
    { key: 'prospectos', label: 'Prospectos', align: 'right' as const },
    { key: 'proyectos', label: 'Proyectos', align: 'right' as const },
    { key: 'vendedores', label: 'Vendedores', align: 'right' as const },
    { key: 'detalle', label: 'Detalle', align: 'right' as const },
  ]

  const headersSegProyecto = [
    { key: 'proyecto', label: 'Proyecto' },
    { key: 'seguimientos', label: 'Seguimientos', align: 'right' as const },
    { key: 'vendedores', label: 'Vendedores', align: 'right' as const },
    { key: 'estatus', label: 'Estatus (top 3)' },
    { key: 'detalle', label: 'Detalle', align: 'right' as const },
  ]
  const headersSegVendedor = [
    { key: 'vendedor', label: 'Vendedor' },
    { key: 'seguimientos', label: 'Seguimientos', align: 'right' as const },
    { key: 'proyectos', label: 'Proyectos', align: 'right' as const },
    { key: 'estatus', label: 'Estatus (top 3)' },
    { key: 'detalle', label: 'Detalle', align: 'right' as const },
  ]
  const headersSegEstatus = [
    { key: 'estatus', label: 'Estatus' },
    { key: 'seguimientos', label: 'Seguimientos', align: 'right' as const },
    { key: 'proyectos', label: 'Proyectos', align: 'right' as const },
    { key: 'vendedores', label: 'Vendedores', align: 'right' as const },
    { key: 'detalle', label: 'Detalle', align: 'right' as const },
  ]

  /** ===== Rows: Prospectos ===== */
  const rowsProsProyecto = useMemo(() =>
    prosPorProyecto
      .sort((a, b) => b.prospectos - a.prospectos)
      .map(r => ({
        proyecto: (
          <ProyectoChip
            id={r.proyectoId ?? undefined}
            proyectosById={proyectosById}
            unidadesById={unidadesById}
            onClick={() => openDetalle({ kind: 'pros-proyecto', proyectoId: r.proyectoId ?? null })}
          />
        ),
        prospectos: r.prospectos,
        vendedores: r.vendedores,
        estatus: (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {r.estatusTop.map(([k, n]) => (
              <Chip
                key={k}
                size="small"
                label={`${k} (${n})`}
                variant="outlined"
                onClick={() => showStatus(`${k}: ${n}`, mapEstatusToChipStatus(String(k)))}
              />
            ))}
          </Stack>
        ),
        detalle: (
          <Button
            size="small"
            variant="text"
            endIcon={<VisibilityOutlinedIcon fontSize="small" />}
            onClick={() => openDetalle({ kind: 'pros-proyecto', proyectoId: r.proyectoId ?? null })}
          >
            Ver
          </Button>
        ),
      }))
  , [prosPorProyecto, proyectosById, unidadesById, showStatus])

  const rowsProsVendedor = useMemo(() =>
    prosPorVendedor
      .sort((a, b) => b.prospectos - a.prospectos)
      .map(r => ({
        vendedor: <Typography fontWeight={600}>{r.vendedorNombre}</Typography>,
        prospectos: r.prospectos,
        proyectos: r.proyectos,
        estatus: (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {r.estatusTop.map(([k, n]) => (
              <Chip
                key={k}
                size="small"
                label={`${k} (${n})`}
                variant="outlined"
                onClick={() => showStatus(`${k}: ${n}`, mapEstatusToChipStatus(String(k)))}
              />
            ))}
          </Stack>
        ),
        detalle: (
          <Button
            size="small"
            variant="text"
            endIcon={<VisibilityOutlinedIcon fontSize="small" />}
            onClick={() => openDetalle({ kind: 'pros-vendedor', vendedorId: (r as any).vendedorId })}
          >
            Ver
          </Button>
        ),
      }))
  , [prosPorVendedor, showStatus])

  const rowsProsEstatus = useMemo(
    () =>
      prosPorEstatus
        .sort((a, b) => b.prospectos - a.prospectos)
        .map(r => ({
          estatus: (
            <Chip
              size="small"
              label={r.estatus}
              onClick={() => showStatus(`Estatus: ${r.estatus}`, mapEstatusToChipStatus(String(r.estatus)))}
            />
          ),
          prospectos: r.prospectos,
          proyectos: r.proyectos,
          vendedores: r.vendedores,
          detalle: (
            <Button
              size="small"
              variant="text"
              endIcon={<VisibilityOutlinedIcon fontSize="small" />}
              onClick={() => openDetalle({ kind: 'pros-estatus', estatus: r.estatus })}
            >
              Ver
            </Button>
          ),
        })),
    [prosPorEstatus, showStatus]
  )

  /** ===== Rows: Seguimientos ===== */
  const rowsSegProyecto = useMemo(() =>
    segPorProyecto
      .sort((a, b) => b.seguimientos - a.seguimientos)
      .map(r => ({
        proyecto: (
          <ProyectoChip
            id={r.proyectoId ?? undefined}
            proyectosById={proyectosById}
            unidadesById={unidadesById}
            onClick={() => openDetalle({ kind: 'seg-proyecto', proyectoId: r.proyectoId ?? null })}
          />
        ),
        seguimientos: r.seguimientos,
        vendedores: r.vendedores,
        estatus: (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {r.estatusTop.map(([k, n]) => (
              <Chip
                key={k}
                size="small"
                label={`${k} (${n})`}
                variant="outlined"
                onClick={() => showStatus(`${k}: ${n}`, mapEstatusToChipStatus(String(k)))}
              />
            ))}
          </Stack>
        ),
        detalle: (
          <Button
            size="small"
            variant="text"
            endIcon={<VisibilityOutlinedIcon fontSize="small" />}
            onClick={() => openDetalle({ kind: 'seg-proyecto', proyectoId: r.proyectoId ?? null })}
          >
            Ver
          </Button>
        ),
      }))
  , [segPorProyecto, proyectosById, unidadesById, showStatus])

  const rowsSegVendedor = useMemo(() =>
    segPorVendedor
      .sort((a, b) => b.seguimientos - a.seguimientos)
      .map(r => ({
        vendedor: <Typography fontWeight={600}>{r.vendedorNombre}</Typography>,
        seguimientos: r.seguimientos,
        proyectos: r.proyectos,
        estatus: (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {r.estatusTop.map(([k, n]) => (
              <Chip
                key={k}
                size="small"
                label={`${k} (${n})`}
                variant="outlined"
                onClick={() => showStatus(`${k}: ${n}`, mapEstatusToChipStatus(String(k)))}
              />
            ))}
          </Stack>
        ),
        detalle: (
          <Button
            size="small"
            variant="text"
            endIcon={<VisibilityOutlinedIcon fontSize="small" />}
            onClick={() => openDetalle({ kind: 'seg-vendedor', vendedorId: (r as any).vendedorId })}
          >
            Ver
          </Button>
        ),
      }))
  , [segPorVendedor, showStatus])

  const rowsSegEstatus = useMemo(
    () =>
      segPorEstatus
        .sort((a, b) => b.seguimientos - a.seguimientos)
        .map(r => ({
          estatus: (
            <Chip
              size="small"
              label={r.estatus}
              onClick={() => showStatus(`Estatus: ${r.estatus}`, mapEstatusToChipStatus(String(r.estatus)))}
            />
          ),
          seguimientos: r.seguimientos,
          proyectos: r.proyectos,
          vendedores: r.vendedores,
          detalle: (
            <Button
              size="small"
              variant="text"
              endIcon={<VisibilityOutlinedIcon fontSize="small" />}
              onClick={() => openDetalle({ kind: 'seg-estatus', estatus: r.estatus })}
            >
              Ver
            </Button>
          ),
        })),
    [segPorEstatus, showStatus]
  )

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Reportes de Gerencia</Typography>
      <Typography variant="body2" color="text.secondary">
        Vistas por proyecto de interés, vendedor y estatus.
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Tabs principales */}
      <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} variant="scrollable" scrollButtons="auto">
        <Tab label="Prospectos" />
        <Tab label="Seguimientos" />
      </Tabs>

      {loading && <Spinner open />}

      {/* Prospectos */}
      <TabPanel value={mainTab} index={0}>
        <Tabs
          value={subTabPros}
          onChange={(_, v) => setSubTabPros(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          <Tab label="Por proyecto" />
          <Tab label="Por vendedor" />
          <Tab label="Por estatus" />
        </Tabs>

        <TabPanel value={subTabPros} index={0}>
          <SimpleTable headers={headersProsProyecto} rows={rowsProsProyecto} />
        </TabPanel>
        <TabPanel value={subTabPros} index={1}>
          <SimpleTable headers={headersProsVendedor} rows={rowsProsVendedor} />
        </TabPanel>
        <TabPanel value={subTabPros} index={2}>
          <SimpleTable headers={headersProsEstatus} rows={rowsProsEstatus} />
        </TabPanel>
      </TabPanel>

      {/* Seguimientos */}
      <TabPanel value={mainTab} index={1}>
        <Tabs
          value={subTabSeg}
          onChange={(_, v) => setSubTabSeg(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          <Tab label="Por proyecto" />
          <Tab label="Por vendedor" />
          <Tab label="Por estatus" />
        </Tabs>

        <TabPanel value={subTabSeg} index={0}>
          <SimpleTable headers={headersSegProyecto} rows={rowsSegProyecto} />
        </TabPanel>
        <TabPanel value={subTabSeg} index={1}>
          <SimpleTable headers={headersSegVendedor} rows={rowsSegVendedor} />
        </TabPanel>
        <TabPanel value={subTabSeg} index={2}>
          <SimpleTable headers={headersSegEstatus} rows={rowsSegEstatus} />
        </TabPanel>
      </TabPanel>

      {/* KPIs al pie */}
      <Box sx={{ mt: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Chip label={`Prospectos: ${prospectos?.length ?? 0}`} />
          <Chip label={`Seguimientos: ${seguimientos?.length ?? 0}`} />
          <Chip label={`Proyectos: ${proyectos?.length ?? 0}`} />
          <Chip label={`Unidades: ${Array.from(unidadesById.keys()).length}`} />
          <Chip label={`Usuarios: ${usuarios?.length ?? 0}`} />
        </Stack>
      </Box>

      {/* Modal Detalle */}
      <ReporteDetalleModal
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        titulo={detalleTitulo}
        seguimientos={detalleSeg}
        prospectos={detallePros}
        getEstatus={getSeguimientoEstatus}
        users={usuarios}
      />
    </Box>
  )
}

export default ReportesGerentes
