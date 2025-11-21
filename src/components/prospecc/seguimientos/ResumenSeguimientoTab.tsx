import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Stack,
  useTheme,
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Temporal } from '@js-temporal/polyfill'

import type { Seguimiento, Prospecto } from '../../../config/types'
import { belongsToUser } from '../../../config/ownership'
import { useFetchSeguimientos, useFetchProspectos } from '../../../hooks/useFetchFunctions'

// ✅ Constantes y helpers compartidos
import {
  ESTATUS_LIST,
  toNice,
  safeColorFor,
} from '../../../config/seguimientos.constants'

import SeguimientosCalendar from './SeguimientosCalendar'

// ====== Props ======
interface Props {
  userid?: string // id del usuario logueado
  userRole?: string // 'admin' | 'gerencia' | 'operacion' | 'usuario'
}

// ====== Helpers de filtrado ======
const perteneceAlUsuario = (s: Seguimiento, userid?: string) =>
  belongsToUser(s as any, userid)

const prospectoPerteneceAlUsuario = (p: Prospecto, userid?: string) =>
  belongsToUser(p as any, userid)

// ====== Datos de charts ======
function getSeguimientosPorDia(seguimientos: Seguimiento[]) {
  const hoy = Temporal.Now.plainDateISO()
  return Array.from({ length: 7 }).map((_, i) => {
    const fecha = hoy.add({ days: i }).toString()
    const obj: any = { fecha }
    ESTATUS_LIST.forEach((estatus) => {
      obj[estatus] = seguimientos.filter(
        (s) =>
          s.fechaProximoSeguimiento?.slice(0, 10) === fecha &&
          s.estatusSeguimiento === estatus
      ).length
    })
    return obj
  })
}

// ====== Componente ======
const ResumenSeguimientosTab: React.FC<Props> = ({ userid, userRole }) => {
  const theme = useTheme()
  const { seguimientos } = useFetchSeguimientos()
  const { prospectos } = useFetchProspectos()

  const role = (userRole ?? '').toLowerCase()
  const isUsuario = role === 'usuario' // si quieres agregar 'operacion', cámbialo a: ['usuario','operacion'].includes(role)

  // Filtrado local por rol
  const segFiltrados = React.useMemo(
    () => (isUsuario ? seguimientos.filter((s) => perteneceAlUsuario(s, userid)) : seguimientos),
    [isUsuario, seguimientos, userid]
  )

  const prospectosFiltrados = React.useMemo(
    () => (isUsuario ? prospectos.filter((p) => prospectoPerteneceAlUsuario(p, userid)) : prospectos),
    [isUsuario, prospectos, userid]
  )

  // Pie: datos por estatus
  const pieData = ESTATUS_LIST.map((estatus) => ({
    name: toNice(estatus),
    value: segFiltrados.filter((s) => s.estatusSeguimiento === estatus).length,
    color: safeColorFor(estatus),
  }))

  // Barras: próximos 7 días
  const porDia = getSeguimientosPorDia(segFiltrados)

  return (
    <Box
      sx={{
        background: '#f5f7fa',
        minHeight: '100vh',
        py: { xs: 1, md: 3 },
        px: { xs: 0.5, md: 5 },
      }}
    >
      <Typography
        variant="h5"
        fontWeight={800}
        color="primary"
        mb={2}
        letterSpacing={0.5}
      >
        Resumen de Seguimientos
      </Typography>

      <Stack spacing={3}>
        {/* Pie Chart */}
        <Paper elevation={2} sx={{ p: { xs: 1.5, md: 3 }, background: '#f9fafb' }}>
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
            Seguimientos por Estatus
          </Typography>
          {segFiltrados.length === 0 ? (
            <Typography color="text.secondary">No tienes seguimientos asignados.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={65}
                  outerRadius={100}
                  labelLine={false}
                  label={({
                    cx, cy, midAngle, innerRadius, outerRadius, percent, name,
                  }) => {
                    if (percent < 0.07) return ''
                    const RADIAN = Math.PI / 180
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.68
                    const x = cx + radius * Math.cos(-midAngle * RADIAN)
                    const y = cy + radius * Math.sin(-midAngle * RADIAN)
                    return (
                      <text
                        x={x}
                        y={y}
                        fill={theme.palette.grey[900]}
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontSize={13}
                        fontWeight={700}
                        style={{ pointerEvents: 'none' }}
                      >
                        {`${name} (${Math.round(percent * 100)}%)`}
                      </text>
                    )
                  }}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  wrapperStyle={{
                    right: 15,
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: '28px',
                  }}
                  formatter={(value, _, i) => (
                    <span style={{ color: pieData[i].color, fontWeight: 700 }}>
                      {value}
                    </span>
                  )}
                />
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Bar Chart */}
        <Paper elevation={2} sx={{ p: { xs: 1.5, md: 3 }, background: '#f9fafb' }}>
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
            Seguimientos próximos 7 días (por Estatus)
          </Typography>
          {segFiltrados.length === 0 ? (
            <Typography color="text.secondary">No tienes seguimientos próximos.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={porDia} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(v) => {
                    const d = Temporal.PlainDate.from(v)
                    return `${d.day}/${d.month}`
                  }}
                  tick={{ fontWeight: 600, fontSize: 13 }}
                />
                <YAxis allowDecimals={false} tick={{ fontWeight: 600, fontSize: 13 }} />
                <ReTooltip />
                <Legend verticalAlign="top" height={32} iconType="circle" />
                {ESTATUS_LIST.map((estatus) => (
                  <Bar
                    key={estatus}
                    dataKey={estatus}
                    name={toNice(estatus)}
                    stackId="a"
                    fill={safeColorFor(estatus)}
                    maxBarSize={35}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Calendario reusable */}
        <Paper elevation={2} sx={{ p: { xs: 1.5, md: 3 }, background: '#f9fafb' }}>
          <SeguimientosCalendar
            title="Calendario de Seguimientos"
            seguimientos={segFiltrados}
            prospectos={prospectosFiltrados}
            maxWidth={410}
            hideFrame={false}
          />
        </Paper>
      </Stack>
    </Box>
  )
}

export default ResumenSeguimientosTab
