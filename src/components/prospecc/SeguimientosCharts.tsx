import React, { useMemo } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  LabelList,
  Cell,
} from 'recharts'
import { ESTATUS_OPCIONES, EstatusSeguimiento, Seguimiento } from '../../config/types'

// Helpers
const getUserEmail = (u: any): string =>
  u?.email ?? u?.correo ?? u?.correoElectronico ?? ''

type Item = { key: string; label: string; count: number }

type ChartsProps = {
  /** Lista YA filtrada por el padre. */
  rows: Seguimiento[]

  /** Mapa id usuario -> usuario (para fallback). */
  usuariosById: Map<string, any>

  /** Mapa id proyecto/propiedad -> etiqueta visible. */
  idToLabel: Map<string, string>

  /** Helpers del padre (opcionales). */
  getUserEmailById?: (id?: string) => string
  getUserNameById?: (id?: string) => string

  /** Filtros actualmente seleccionados (para resaltar/limpiar). */
  selectedUserId?: string
  selectedProjectLabel?: string
  selectedStatus?: EstatusSeguimiento | ''

  /** Callbacks (aceptan '' para limpiar). */
  onSelectUser?: (userId: string | '') => void
  onSelectProyecto?: (label: string | '') => void
  onSelectStatus?: (status: EstatusSeguimiento | '') => void
}

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Paper variant="outlined" sx={{ p: 2, height: 360, display: 'flex', flexDirection: 'column' }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
      {title}
    </Typography>
    <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
  </Paper>
)

const TOP_N = 12

// Paleta (usa tus variables CSS)
const COLORS = {
  users: `rgba(var(--primary-color-rgb), 0.85)`,
  usersDim: `rgba(var(--primary-color-rgb), 0.30)`,
  projects: `rgba(var(--secondary-color-rgb), 0.85)`,
  projectsDim: `rgba(var(--secondary-color-rgb), 0.30)`,
  labels: `rgba(var(--primary-color-rgb), 1)`,
}

const STATUS_COLORS: string[] = [
  `rgba(var(--primary-color-rgb), 0.85)`,
  `rgba(var(--secondary-color-rgb), 0.85)`,
  `rgba(52,152,219,0.85)`,       // --third-color aprox
  `rgba(172,231,202,0.85)`,      // --fourth-color aprox
  `rgba(95,167,235,0.85)`,       // --context1-color
  `rgba(241,124,14,0.85)`,       // --context2-color
  `rgba(0,0,0,0.75)`,
  `rgba(120,120,120,0.75)`,
]
const STATUS_COLORS_DIM = STATUS_COLORS.map(c => c.replace(/0\.85|0\.75/, '0.30'))

// Utils
const truncate = (s: string, n = 14) => (s?.length > n ? s.slice(0, n - 1) + '…' : s)

const SeguimientosCharts: React.FC<ChartsProps> = ({
  rows,
  usuariosById,
  idToLabel,
  getUserEmailById,
  // getUserNameById, // libre para usar después
  selectedUserId = '',
  selectedProjectLabel = '',
  selectedStatus = '',
  onSelectUser,
  onSelectProyecto,
  onSelectStatus,
}) => {
  // ======= Por Vendedor =======
  const byUser: Item[] = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of rows) {
      const uid = String(s.userid ?? '')
      counts.set(uid, (counts.get(uid) ?? 0) + 1)
    }
    const arr: Item[] = Array.from(counts.entries()).map(([uid, count]) => {
      const emailFromHelper = getUserEmailById?.(uid)
      const email = emailFromHelper || getUserEmail(usuariosById.get(uid)) || '(sin usuario)'
      return { key: uid, label: email, count }
    })
    arr.sort((a, b) => b.count - a.count)
    if (arr.length <= TOP_N) return arr
    const top = arr.slice(0, TOP_N)
    const rest = arr.slice(TOP_N).reduce((n, it) => n + it.count, 0)
    return [...top, { key: '__otros', label: 'Otros', count: rest }]
  }, [rows, usuariosById, getUserEmailById])

  // ======= Por Proyecto / Unidad =======
  const byProject: Item[] = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of rows) {
      let label = String(s.proyectoInteres ?? '').trim()
      if (label && idToLabel.has(label)) label = idToLabel.get(label) as string
      if (!label) label = '(sin proyecto)'
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    const arr: Item[] = Array.from(counts.entries()).map(([label, count]) => ({
      key: label,
      label,
      count,
    }))
    arr.sort((a, b) => b.count - a.count)
    if (arr.length <= TOP_N) return arr
    const top = arr.slice(0, TOP_N)
    const rest = arr.slice(TOP_N).reduce((n, it) => n + it.count, 0)
    return [...top, { key: '__otros', label: 'Otros', count: rest }]
  }, [rows, idToLabel])

  // ======= Por Estatus (en orden definido) =======
  const byStatus: Item[] = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of rows) {
      const k = (s.estatusSeguimiento as string) || 'contactado'
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    return ESTATUS_OPCIONES.map(({ value, label }) => ({
      key: value,
      label: label || value,
      count: counts.get(value) ?? 0,
    }))
  }, [rows])

  return (
    <Box sx={{ display: 'grid', gap: 16 / 8, gridTemplateColumns: 'repeat(12, 1fr)', mb: 2 }}>
      {/* Vendedores */}
      <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6', lg: 'span 4' } }}>
        <ChartCard title="Seguimientos por vendedor">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={byUser}
              margin={{ top: 10, right: 10, left: 10, bottom: 12 }}
              barCategoryGap="18%"
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                angle={-25}
                textAnchor="end"
                height={64}
                interval={0}
                tickMargin={10}
                tick={{ fontSize: 11, fill: COLORS.labels }}
                tickFormatter={(v) => truncate(String(v))}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <RTooltip />
              <Bar
                dataKey="count"
                onClick={(_: any, idx: number) => {
                  const item = byUser[idx]
                  if (!item || !onSelectUser) return
                  // Toggle: si ya está seleccionado → limpiar
                  const next = item.key === selectedUserId ? '' : String(item.key === '__otros' ? '' : item.key)
                  onSelectUser(next)
                }}
                style={{ cursor: 'pointer' }}
              >
                {byUser.map((it, i) => {
                  const active = selectedUserId && it.key === selectedUserId
                  const dim = selectedUserId && it.key !== selectedUserId
                  const fill = dim ? COLORS.usersDim : COLORS.users
                  return <Cell key={i} fill={fill} stroke={active ? 'var(--primary-color)' : undefined} strokeWidth={active ? 2 : 1} />
                })}
                <LabelList dataKey="count" position="top" offset={6} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Box>

      {/* Proyectos / Unidades */}
      <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6', lg: 'span 4' } }}>
        <ChartCard title="Seguimientos por proyecto/unidad">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={byProject}
              margin={{ top: 10, right: 10, left: 10, bottom: 12 }}
              barCategoryGap="18%"
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                angle={-25}
                textAnchor="end"
                height={72}
                interval={0}
                tickMargin={10}
                tick={{ fontSize: 11, fill: COLORS.labels }}
                tickFormatter={(v) => truncate(String(v), 16)}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <RTooltip />
              <Bar
                dataKey="count"
                onClick={(_: any, idx: number) => {
                  const item = byProject[idx]
                  if (!item || !onSelectProyecto) return
                  const cleaned = item.key === '__otros' ? '' : String(item.label)
                  const next = cleaned === selectedProjectLabel ? '' : cleaned
                  onSelectProyecto(next)
                }}
                style={{ cursor: 'pointer' }}
              >
                {byProject.map((it, i) => {
                  const active = selectedProjectLabel && it.label === selectedProjectLabel
                  const dim = selectedProjectLabel && it.label !== selectedProjectLabel
                  const fill = dim ? COLORS.projectsDim : COLORS.projects
                  return <Cell key={i} fill={fill} stroke={active ? 'var(--secondary-color)' : undefined} strokeWidth={active ? 2 : 1} />
                })}
                <LabelList dataKey="count" position="top" offset={6} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Box>

      {/* Estatus */}
      <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 12', lg: 'span 4' } }}>
        <ChartCard title="Seguimientos por estatus">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={byStatus}
              margin={{ top: 10, right: 10, left: 10, bottom: 8 }}
              barCategoryGap="22%"
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                interval={0}
                height={42}
                tickMargin={8}
                tick={{ fontSize: 12, fill: COLORS.labels }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <RTooltip />
              <Bar
                dataKey="count"
                onClick={(_: any, idx: number) => {
                  const item = byStatus[idx]
                  if (!item || !onSelectStatus) return
                  const key = item.key as EstatusSeguimiento
                  const next = key === selectedStatus ? '' : key
                  onSelectStatus(next)
                }}
                style={{ cursor: 'pointer' }}
              >
                {byStatus.map((it, i) => {
                  const key = it.key as EstatusSeguimiento
                  const active = selectedStatus && key === selectedStatus
                  const dim = selectedStatus && key !== selectedStatus
                  const base = STATUS_COLORS[i % STATUS_COLORS.length]
                  const baseDim = STATUS_COLORS_DIM[i % STATUS_COLORS_DIM.length]
                  return <Cell key={i} fill={dim ? baseDim : base} stroke={active ? 'var(--primary-color)' : undefined} strokeWidth={active ? 2 : 1} />
                })}
                <LabelList dataKey="count" position="top" offset={6} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Box>
    </Box>
  )
}

export default SeguimientosCharts
